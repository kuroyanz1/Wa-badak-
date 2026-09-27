const SESSION_COOKIE = 'wabadak_session';
const SESSION_DAYS_REPORTER = 7;
const SESSION_DAYS_ADMIN = 2;
const PBKDF2_ITERATIONS = 120000;

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
});

const text = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(name) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function unbase64url(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function sha256(input) {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

async function hashPassword(password, saltB64 = null) {
  const salt = saltB64 ? unbase64url(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password, encoded) {
  try {
    const [kind, iters, saltB64, hashB64] = String(encoded || '').split('$');
    if (kind !== 'pbkdf2') return false;
    const iterations = Number(iters);
    if (!iterations || !saltB64 || !hashB64) return false;
    const salt = unbase64url(saltB64);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
    const expected = unbase64url(hashB64);
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

function now() { return Math.floor(Date.now() / 1000); }
function ticketId() { return `LAP-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`; }

async function bodyJSON(request) {
  try { return await request.json(); } catch { return null; }
}

function requireDB(env) {
  if (!env.DB) throw new Error('D1 binding DB belum dipasang.');
  return env.DB;
}

async function createSession(db, userId, role) {
  const raw = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = base64url(await sha256(raw));
  const expires = now() + (role === 'admin' ? SESSION_DAYS_ADMIN : SESSION_DAYS_REPORTER) * 86400;
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(tokenHash, userId, expires).run();
  return { raw, expires };
}

async function getSessionUser(request, env) {
  if (!env.DB) return null;
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return null;
  const tokenHash = base64url(await sha256(raw));
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, now()).first();
  return row || null;
}

async function destroySession(request, env) {
  if (!env.DB) return;
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return;
  const tokenHash = base64url(await sha256(raw));
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

async function ensureAdmin(env) {
  const email = normalizeEmail(env.ADMIN_EMAIL);
  const name = String(env.ADMIN_NAME || 'Admin WA Badak').trim() || 'Admin WA Badak';
  if (!email || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD belum dikonfigurasi.');
  const db = requireDB(env);
  let user = await db.prepare('SELECT id, email, name, role FROM users WHERE email = ? LIMIT 1').bind(email).first();
  if (!user) {
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, name, 'admin', 'env-managed', now()).run();
    user = { id, email, name, role: 'admin' };
  } else if (user.role !== 'admin') {
    await db.prepare('UPDATE users SET role = ?, name = ? WHERE id = ?').bind('admin', name, user.id).run();
    user.role = 'admin'; user.name = name;
  }
  return user;
}

function publicUser(user) {
  return user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
}

async function handleAuth(request, env, path) {
  const db = requireDB(env);
  if (path === '/api/auth/me' && request.method === 'GET') {
    const user = await getSessionUser(request, env);
    if (!user) return json({ authenticated: false }, 401);
    return json({ authenticated: true, user: publicUser(user) });
  }

  if (path === '/api/auth/register' && request.method === 'POST') {
    const body = await bodyJSON(request);
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '');
    const name = String(body?.name || '').trim().slice(0, 80);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Email tidak valid.' }, 400);
    if (password.length < 8) return json({ error: 'Password minimal 8 karakter.' }, 400);
    if (!name) return json({ error: 'Nama wajib diisi.' }, 400);
    if (normalizeEmail(env.ADMIN_EMAIL) === email) return json({ error: 'Email tersebut dipakai untuk admin.' }, 409);
    const exists = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first();
    if (exists) return json({ error: 'Email sudah terdaftar. Silakan login.' }, 409);
    const hash = await hashPassword(password);
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, name, 'reporter', hash, now()).run();
    const session = await createSession(db, id, 'reporter');
    return json({ ok: true, user: { id, email, name, role: 'reporter' } }, 201, { 'Set-Cookie': cookie(SESSION_COOKIE, session.raw, SESSION_DAYS_REPORTER * 86400) });
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    const body = await bodyJSON(request);
    const role = body?.role === 'admin' ? 'admin' : 'reporter';
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '');
    if (!email || !password) return json({ error: 'Email dan password wajib diisi.' }, 400);

    let user;
    if (role === 'admin') {
      if (email !== normalizeEmail(env.ADMIN_EMAIL) || password !== String(env.ADMIN_PASSWORD)) return json({ error: 'Login admin tidak cocok.' }, 401);
      user = await ensureAdmin(env);
    } else {
      user = await db.prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ? AND role = ? LIMIT 1').bind(email, 'reporter').first();
      if (!user || !(await verifyPassword(password, user.password_hash))) return json({ error: 'Email atau password salah.' }, 401);
    }
    const session = await createSession(db, user.id, role);
    return json({ ok: true, user: publicUser(user) }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, session.raw, (role === 'admin' ? SESSION_DAYS_ADMIN : SESSION_DAYS_REPORTER) * 86400) });
  }

  if (path === '/api/auth/logout' && request.method === 'POST') {
    await destroySession(request, env);
    return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(SESSION_COOKIE) });
  }
  return null;
}

function ticketAccess(user, ticket) {
  return user?.role === 'admin' || ticket?.reporter_id === user?.id;
}

async function loadTicket(db, id) {
  const t = await db.prepare(`SELECT id, reporter_id, reporter_email, reporter_name, category, subject, detail, status, assignee, created_at, updated_at FROM tickets WHERE id = ? LIMIT 1`).bind(id).first();
  if (!t) return null;
  const messages = await db.prepare(`SELECT id, ticket_id, sender_id, sender_role, sender_name, body, created_at FROM messages WHERE ticket_id = ? ORDER BY created_at ASC, rowid ASC`).bind(id).all();
  return { ...t, messages: messages.results || [] };
}

async function handleTickets(request, env, path, user) {
  const db = requireDB(env);
  if (!user) return json({ error: 'Login required.' }, 401);

  if (path === '/api/tickets' && request.method === 'GET') {
    const rows = user.role === 'admin'
      ? await db.prepare(`SELECT id, reporter_id, reporter_email, reporter_name, category, subject, detail, status, assignee, created_at, updated_at FROM tickets ORDER BY updated_at DESC LIMIT 200`).all()
      : await db.prepare(`SELECT id, reporter_id, reporter_email, reporter_name, category, subject, detail, status, assignee, created_at, updated_at FROM tickets WHERE reporter_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(user.id).all();
    return json({ tickets: rows.results || [] });
  }

  if (path === '/api/tickets' && request.method === 'POST') {
    if (user.role !== 'reporter') return json({ error: 'Hanya pelapor yang dapat membuat tiket.' }, 403);
    const body = await bodyJSON(request);
    const category = String(body?.category || 'Error').trim().slice(0, 60);
    const subject = String(body?.subject || '').trim().slice(0, 180);
    const detail = String(body?.detail || '').trim().slice(0, 5000);
    if (!subject || !detail) return json({ error: 'Judul dan detail wajib diisi.' }, 400);
    const id = ticketId();
    const ts = now();
    await db.batch([
      db.prepare(`INSERT INTO tickets (id, reporter_id, reporter_email, reporter_name, category, subject, detail, status, assignee, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru', '', ?, ?, ?)`).bind(id, user.id, user.email, user.name, category, subject, detail, ts, ts),
      db.prepare(`INSERT INTO messages (ticket_id, sender_id, sender_role, sender_name, body, created_at) VALUES (?, ?, 'reporter', ?, ?, ?)`).bind(id, user.id, user.name, detail, ts)
    ]);
    return json({ ticket: await loadTicket(db, id) }, 201);
  }

  const match = path.match(/^\/api\/tickets\/([^/]+)(\/messages)?$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  const ticket = await loadTicket(db, id);
  if (!ticket) return json({ error: 'Tiket tidak ditemukan.' }, 404);
  if (!ticketAccess(user, ticket)) return json({ error: 'Akses ditolak.' }, 403);

  if (!match[2] && request.method === 'GET') return json({ ticket });

  if (match[2] && request.method === 'POST') {
    const body = await bodyJSON(request);
    const message = String(body?.message || '').trim().slice(0, 5000);
    if (!message) return json({ error: 'Pesan tidak boleh kosong.' }, 400);
    const ts = now();
    const newStatus = user.role === 'admin' && ticket.status === 'Baru' ? 'Diproses' : ticket.status;
    await db.batch([
      db.prepare(`INSERT INTO messages (ticket_id, sender_id, sender_role, sender_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, user.id, user.role, user.name, message, ts),
      db.prepare(`UPDATE tickets SET updated_at = ?, status = ? WHERE id = ?`).bind(ts, newStatus, id)
    ]);
    return json({ ticket: await loadTicket(db, id) });
  }

  if (!match[2] && request.method === 'PATCH') {
    if (user.role !== 'admin') return json({ error: 'Hanya admin yang dapat mengubah tiket.' }, 403);
    const body = await bodyJSON(request);
    const status = ['Baru', 'Diproses', 'Selesai'].includes(body?.status) ? body.status : ticket.status;
    const assignee = String(body?.assignee ?? ticket.assignee ?? '').slice(0, 80);
    const ts = now();
    await db.prepare(`UPDATE tickets SET status = ?, assignee = ?, updated_at = ? WHERE id = ?`).bind(status, assignee, ts, id).run();
    return json({ ticket: await loadTicket(db, id) });
  }
  return null;
}

function withPublicHeaders(response) {
  const h = new Headers(response.headers);
  h.set('cache-control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health') {
        return json({ ok: true, database: Boolean(env.DB), time: now() });
      }
      if (url.pathname.startsWith('/api/auth/')) {
        const result = await handleAuth(request, env, url.pathname);
        if (result) return result;
      }
      if (url.pathname.startsWith('/api/tickets')) {
        const user = await getSessionUser(request, env);
        const result = await handleTickets(request, env, url.pathname, user);
        if (result) return result;
      }
      if (url.pathname.startsWith('/api/')) return json({ error: 'API route tidak ditemukan.' }, 404);
      return withPublicHeaders(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || 'Terjadi kesalahan server.' }, 500);
    }
  }
};

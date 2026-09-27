(() => {
  'use strict';

  // Front-end only for now. Add the real authenticated API base when available.
  const API_BASE = '';
  const STORAGE_KEY = 'waBadakStateV2';
  const DEFAULT_STATE = {
    mode: 'public',
    groupMode: 'public',
    settings: { anticall: true, autoblock: true, autoread: true, joinmode: false, private: false },
    paused: false,
    commands: 128,
    ticketCounter: 1,
  };

  const clone = obj => JSON.parse(JSON.stringify(obj));
  const loadState = () => {
    try { return Object.assign(clone(DEFAULT_STATE), JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
    catch { return clone(DEFAULT_STATE); }
  };
  const state = loadState();
  state.settings = Object.assign(clone(DEFAULT_STATE.settings), state.settings || {});

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const views = $$('.view');
  const validRoutes = new Set(views.map(v => v.dataset.view));
  const routeAliases = { home: 'home', dashboard: 'dashboard', manage: 'manage', statistics: 'statistics', 'chat-admin':'chat-admin', shop:'shop', subscription:'subscription', report:'report', profile:'profile', join:'join', groups:'groups', contact:'contact', monitor:'monitor', features:'features', docs:'docs', bots:'bots', about:'about', terms:'terms' };

  function routeName() {
    const raw = location.hash.replace(/^#/, '') || 'home';
    return routeAliases[raw] || 'home';
  }

  function routeTo(name) {
    const route = routeAliases[name] || 'home';
    if (location.hash.replace(/^#/, '') === route) renderRoute();
    else location.hash = route;
  }

  function renderRoute() {
    const route = routeName();
    views.forEach(v => v.classList.toggle('active', v.dataset.view === route));
    $$('.drawer-nav a[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === route));
    closeDrawer();
    if (route === 'manage') renderManage();
    if (route === 'features') renderCommands('all');
    $('#app')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeDrawer() { document.body.classList.remove('drawer-open'); $('#menuBtn')?.setAttribute('aria-expanded', 'false'); }
  function openDrawer() { document.body.classList.add('drawer-open'); $('#menuBtn')?.setAttribute('aria-expanded', 'true'); }

  $('#menuBtn')?.addEventListener('click', () => document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
  $('#drawerClose')?.addEventListener('click', closeDrawer);
  $('#drawerBackdrop')?.addEventListener('click', closeDrawer);

  document.addEventListener('click', e => {
    const routeLink = e.target.closest('[data-route]');
    if (routeLink && !routeLink.matches('a[target="_blank"]')) {
      e.preventDefault();
      routeTo(routeLink.dataset.route);
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) handleAction(action, e.target.closest('[data-action]'));
  });

  const commands = [
    ['General','.menu','Menu utama: profil + kategori.'],['General','.ping','Tes respon bot.'],['General','.profile','Profil lengkap akun bot.'],['General','.shop','Buka toko bot.'],['General','.vip','Cek status VIP.'],
    ['Group','.infogroup','Info grup dan jumlah member.'],['Group','.setintro','Atur welcome text.'],['Group','.anti link','Proteksi anti-link.'],['Group','.tagadmin','Tag semua admin.'],['Group','.refresh','Sinkronkan ulang data grup.'],
    ['Jadibot','.jadibot','Daftarkan nomor jadi bot.'],['Jadibot','.anticall','Tolak panggilan masuk.'],['Jadibot','.autoblock','Blokir japri otomatis.'],['Jadibot','.autoread','Centang biru pesan grup.'],['Jadibot','.joinmode','Izinkan bot di-add via join.'],['Jadibot','.setgrup','Atur mode per grup.'],['Jadibot','.cekbot','Cek status sesi bot.'],['Jadibot','.mygrup','Daftar grup bot.'],
    ['Downloader','.play','Cari audio dari YouTube.'],['Downloader','.youtube','Download dari URL YouTube.'],['Downloader','.tiktok','Download video TikTok.'],['Downloader','.instagram','Download post/reel Instagram.'],['Downloader','.pinterest','Cari gambar Pinterest.'],
    ['Sticker','.sticker','Media ke sticker.'],['Sticker','.toimage','Sticker ke gambar.'],['Sticker','.brat','Sticker teks gaya brat.'],['Sticker','.caristicker','Cari sticker.'],
    ['Maker','.qc','Quote chat WhatsApp.'],['Maker','.iphoneqc','Quote gaya iPhone.'],['Maker','.meme','Buat meme teks.'],
    ['Tools','.translate','Terjemahkan teks.'],['Tools','.weather','Cuaca.'],['Tools','.calc','Kalkulator.'],
    ['Game','.fish','Memancing ikan.'],['Game','.inventory','Isi tas mancing.'],['Game','.rank','Leaderboard game.'],
    ['VIP','.ai','Chat AI.'],['VIP','.aiimage','Generate/edit gambar AI.'],['VIP','.removebg','Hapus background.'],['VIP','.hdvideo','Upscale video.'],
    ['VVIP','.aivideo','Generate video AI.'],['VVIP','.ban','Ban user bot.'],['VVIP','.unban','Cabut ban user.'],['VVIP','.addlimit','Tambah limit user.']
  ];

  function renderCommands(filter = 'all') {
    const grid = $('#commandGrid'); if (!grid) return;
    const data = filter === 'all' ? commands : commands.filter(c => c[0] === filter);
    grid.innerHTML = data.map(([cat, cmd, desc]) => `<article class="command-card"><span class="cat">${esc(cat)}</span><strong>${esc(cmd)}</strong><p>${esc(desc)}</p></article>`).join('');
    $$('#featureFilters .filter').forEach(b => b.classList.toggle('active', b.dataset.featureFilter === filter));
  }

  $('#featureFilters')?.addEventListener('click', e => { const b = e.target.closest('[data-feature-filter]'); if (b) renderCommands(b.dataset.featureFilter); });

  function syncModeUI() {
    const publicMode = state.mode === 'public';
    const modeWord = publicMode ? 'PUBLIC' : 'SELF';
    const copy = publicMode ? 'merespons semua orang' : 'hanya merespons pemilik';
    const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    setText('#miniMode', modeWord); setText('#homeMode', modeWord); setText('#dirMode', modeWord); setText('#dashModeTitle', modeWord); setText('#manageModeBadge', modeWord); setText('#botModeChip', modeWord); setText('#dashModeCopy', copy); setText('#manageModeBadge', modeWord); setText('#groupModeLabel', state.groupMode.toUpperCase());
    const glyph = $('#dashModeGlyph'); if (glyph) glyph.textContent = publicMode ? '1' : '0';
    const selfCount = $('#dashSelfCount'); if (selfCount) selfCount.textContent = publicMode ? '0' : '1';
    const homeActive = $('#homeActive'); if (homeActive) homeActive.textContent = '1';
    const summary = $('#homeBotSummary'); if (summary) summary.textContent = `1 bot aktif · ${modeWord.toLowerCase()}`;
    ['#modePublic','#modeSelf'].forEach(id => $(id)?.classList.remove('active'));
    $(publicMode ? '#modePublic' : '#modeSelf')?.classList.add('active');
    $$('.mode-switch button[data-group-mode]').forEach(b => b.classList.toggle('active', b.dataset.groupMode === state.groupMode));
  }

  function syncSettingsUI() {
    $$('.switch[data-setting]').forEach(btn => {
      const key = btn.dataset.setting;
      btn.setAttribute('aria-pressed', String(Boolean(state.settings[key])));
    });
  }

  const baseLogs = [
    ['23:04:10','CMD','ping args: [] dari Group Laporan'],['23:04:13','OK','response 128ms'],['23:05:02','INFO','autoread true'],['23:05:41','CMD','setgrup group=1'],['23:06:11','OK','group mode public'],['23:07:03','WARN','dashboard demo: API not connected']
  ];
  function renderLogs(target = '#logList', filter = 'ALL') {
    const el = $(target); if (!el) return;
    const data = filter === 'ALL' ? baseLogs : baseLogs.filter(l => l[1] === filter);
    el.innerHTML = data.map(([time, tag, msg]) => `<div class="log-line"><span>[${time}]</span><span class="tag ${tag}">[${tag}]</span><span>${esc(msg)}</span></div>`).join('');
  }

  function renderManage() {
    syncModeUI(); syncSettingsUI(); renderLogs('#manageLogList'); renderLogs('#logList');
  }

  $$('#modePublic,#modeSelf').forEach(btn => btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode;
    state.commands += 1;
    save(); syncModeUI(); renderLogs('#manageLogList'); renderLogs('#logList'); toast(`Mode diubah ke ${state.mode.toUpperCase()} (lokal)`);
  }));

  $$('.switch[data-setting]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.setting;
    state.settings[key] = !state.settings[key]; save(); syncSettingsUI();
    toast(`${key} ${state.settings[key] ? 'ON' : 'OFF'} (lokal)`);
  }));

  $$('.mode-switch button[data-group-mode]').forEach(btn => btn.addEventListener('click', () => {
    state.groupMode = btn.dataset.groupMode; save(); syncModeUI();
    toast(`Mode grup diubah ke ${state.groupMode.toUpperCase()} (lokal)`);
  }));

  $('#manageTabs')?.addEventListener('click', e => {
    const tab = e.target.closest('[data-manage-tab]'); if (!tab) return;
    const key = tab.dataset.manageTab;
    $$('#manageTabs .tab').forEach(x => x.classList.toggle('active', x === tab));
    $$('.manage-pane').forEach(p => p.classList.add('hidden'));
    $(`#manage-${key}`)?.classList.remove('hidden');
    if (key === 'terminal') renderLogs('#manageLogList');
  });

  $$('.filter[data-log-filter]').forEach(btn => btn.addEventListener('click', () => {
    const filter = btn.dataset.logFilter;
    $$('.filter[data-log-filter]').forEach(b => b.classList.toggle('active', b === btn));
    renderLogs('#logList', filter);
  }));

  $('#pauseLogs')?.addEventListener('click', e => {
    state.paused = !state.paused; save();
    e.currentTarget.textContent = state.paused ? '▶ Resume' : 'Ⅱ Pause';
    toast(state.paused ? 'Log dijeda' : 'Log berjalan lagi');
  });

  function handleAction(action) {
    switch(action) {
      case 'manage': routeTo('manage'); break;
      case 'add-bot': openAddBotModal(); break;
      case 'logout':
        state.mode = 'public'; state.groupMode = 'public'; state.settings = clone(DEFAULT_STATE.settings); save(); routeTo('home'); toast('Logout lokal selesai'); break;
      case 'test-ping': toast('Ping demo: 128ms'); renderLogs('#manageLogList'); break;
      case 'refresh': toast('Status diperbarui'); renderLogs('#manageLogList'); break;
      case 'show-toast': toast('Panel ini aktif; payment/API belum disambungkan'); break;
      case 'track-ticket': toast('Mode demo: masukkan kode tiket untuk pencarian lokal'); break;
      case 'open-report': closeReportDrawer(); routeTo('report'); break;
      case 'find-bot': {
        const val = $('#joinLink')?.value.trim();
        $('#joinResult').textContent = val ? `Bot tersedia: 628••••••2193 · mode ${state.mode.toUpperCase()} · siap ditambahkan (demo).` : 'Tempel link undangan grup terlebih dahulu.';
        break;
      }
    }
  }

  function openAddBotModal() {
    $('#modalTitle').textContent = 'Tambah Bot';
    $('#modalBody').innerHTML = `<div class="panel" style="padding:0;border:0;background:transparent"><p><b>Bot WA Badak kamu sudah ada.</b></p><p>Build ini menyediakan alur UI "hubungkan bot yang sudah ada" supaya tombol Tambah Bot tidak buntu. Verifikasi nyata baru bisa dilakukan setelah API bot terpasang.</p><label>Nomor bot<input placeholder="628xxxxxxxxxx"></label><button class="btn btn-primary" type="button" id="connectExistingBtn">Hubungkan bot yang sudah ada</button></div>`;
    $('#connectExistingBtn')?.addEventListener('click', () => { closeModal(); routeTo('dashboard'); toast('Alur hubungkan bot siap; API belum terpasang.'); });
    openModal();
  }

  function openModal() { $('#modalBackdrop').classList.add('open'); $('#modalBackdrop').setAttribute('aria-hidden','false'); }
  function closeModal() { $('#modalBackdrop').classList.remove('open'); $('#modalBackdrop').setAttribute('aria-hidden','true'); }
  $('#modalClose')?.addEventListener('click', closeModal); $('#modalBackdrop')?.addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });

  let toastTimer;
  function toast(msg) { const el = $('#toast'); if (!el) return; clearTimeout(toastTimer); el.textContent = msg; el.classList.add('show'); toastTimer = setTimeout(() => el.classList.remove('show'), 2300); }

  const reportFloat = $('#reportFloat'); const reportDrawer = $('#reportDrawer');
  function closeReportDrawer() { reportDrawer?.classList.remove('open','expanded'); reportDrawer?.setAttribute('aria-hidden','true'); reportFloat?.setAttribute('aria-expanded','false'); }
  reportFloat?.addEventListener('click', () => { const open = !reportDrawer.classList.contains('open'); reportDrawer.classList.toggle('open', open); reportDrawer.setAttribute('aria-hidden', String(!open)); reportFloat.setAttribute('aria-expanded', String(open)); });
  $('#reportDrawerClose')?.addEventListener('click', closeReportDrawer);
  $('#reportDrawerExpand')?.addEventListener('click', () => { reportDrawer?.classList.toggle('expanded'); });
  $('#reportAttach')?.addEventListener('click', () => $('#reportAttachment')?.click());
  $('#reportAttachment')?.addEventListener('change', e => { const file = e.currentTarget.files?.[0]; if (file) toast(`Lampiran dipilih: ${file.name}`); });
  $('#reportComposer')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#reportMessage');
    const val = input?.value.trim();
    if (!val) return;
    const wrap = $('#reportChat');
    const bubble = document.createElement('div');
    bubble.className = 'report-msg report-msg-you';
    bubble.innerHTML = `<b>Kamu</b><p>${esc(val)}</p><small>${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small>`;
    wrap.appendChild(bubble);
    wrap.scrollTop = wrap.scrollHeight;
    input.value = '';
  });

  $('#reportForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const code = `LAP-${String(state.ticketCounter++).padStart(5,'0')}`; save();
    $('#ticketCode').value = code; toast(`Laporan dibuat: ${code}`);
  });

  $('#chatForm')?.addEventListener('submit', e => { e.preventDefault(); const input = $('#chatInput'); const val = input.value.trim(); if (!val) return; const wrap = $('.chat-messages'); const bubble = document.createElement('div'); bubble.className='chat-bubble user'; bubble.innerHTML=`<small>Kamu</small>${esc(val)}`; wrap.appendChild(bubble); input.value=''; toast('Pesan disimpan di tampilan lokal'); });

  $('#themeToggle')?.addEventListener('click', () => {
    const light = document.body.classList.toggle('light-mode');
    localStorage.setItem('waBadakLight', light ? '1' : '0');
    toast(light ? 'Tema terang' : 'Tema gelap');
  });
  if (localStorage.getItem('waBadakLight') === '1') document.body.classList.add('light-mode');

  // Optional future API hook kept intentionally inert until a real endpoint exists.
  async function api(path, options = {}) {
    if (!API_BASE) return null;
    const res = await fetch(`${API_BASE}${path}`, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }
  window.WABadak = { routeTo, state, api };

  setInterval(() => {
    const el = $('#clock'); if (!el) return;
    const d = new Date(); el.textContent = d.toLocaleTimeString('id-ID',{hour12:false});
    const metric = $('#metricCommands'); if (metric && !state.paused) metric.textContent = String(state.commands + Math.floor(Date.now()/60000)%4);
  }, 1000);

  syncModeUI(); syncSettingsUI(); renderLogs('#logList'); renderRoute();
})();

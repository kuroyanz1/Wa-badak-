(() => {
  'use strict';
  const role = document.body.dataset.role || 'reporter';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt = ts => new Date(Number(ts) * 1000).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const toast = m => { const t=$('#toast'); if(!t)return; t.textContent=m; t.classList.add('show'); clearTimeout(window.__t); window.__t=setTimeout(()=>t.classList.remove('show'),2300); };
  let currentTicketId = null;
  let currentTicket = null;

  async function api(url, options={}) {
    const r = await fetch(url, { credentials:'same-origin', ...options });
    let d={}; try { d=await r.json(); } catch {}
    if (r.status===401) { location.href='login.html?role='+(role==='admin'?'admin':'reporter'); throw new Error('Sesi login habis.'); }
    if (!r.ok) throw new Error(d.error||'Permintaan gagal.');
    return d;
  }

  function statusPill(status){
    const cls = status==='Selesai' ? 'ok' : status==='Diproses' ? 'work' : 'new';
    return `<span class="status-pill ${cls}">${esc(status)}</span>`;
  }

  function renderList(list){
    const box = role==='admin' ? $('#adminTickets') : $('#reporterTickets');
    if(!box)return;
    if(!list.length){ box.innerHTML='<div class="empty-state">Belum ada tiket.</div>'; return; }
    box.innerHTML=list.map(t=> role==='admin'
      ? `<button class="admin-ticket" data-ticket="${esc(t.id)}"><div><strong>${esc(t.id)}</strong><small>${esc(t.reporter_name)} · ${esc(t.reporter_email)}</small></div><div><b>${esc(t.subject)}</b><small>${statusPill(t.status)}</small></div><div><small>${fmt(t.updated_at)}</small></div></button>`
      : `<button class="ticket-item ${t.id===currentTicketId?'active':''}" data-ticket="${esc(t.id)}"><div><strong>${esc(t.id)}</strong><small>${esc(t.category)}</small></div><div><b>${esc(t.subject)}</b><small>${statusPill(t.status)}</small></div></button>`
    ).join('');
  }

  function renderAdminStats(list){
    if(role!=='admin')return;
    const c={Baru:0,Diproses:0,Selesai:0}; list.forEach(t=>c[t.status]=(c[t.status]||0)+1);
    $('#countAll')&&( $('#countAll').textContent=list.length );
    $('#countNew')&&( $('#countNew').textContent=c.Baru );
    $('#countWork')&&( $('#countWork').textContent=c.Diproses );
    $('#countDone')&&( $('#countDone').textContent=c.Selesai );
  }

  function renderTicket(t){
    if(!t)return;
    currentTicket=t; currentTicketId=t.id;
    $('#ticketEmpty')?.classList.add('hidden'); $('#ticketDetail')?.classList.remove('hidden');
    $('#ticketCodeTitle')&&( $('#ticketCodeTitle').textContent=t.id );
    $('#ticketSubject')&&( $('#ticketSubject').textContent=t.subject );
    $('#ticketMeta')&&( $('#ticketMeta').textContent=`${t.category} · ${fmt(t.updated_at)}` );
    $('#ticketStatus')&&( $('#ticketStatus').innerHTML=statusPill(t.status) );
    $('#ticketReporter')&&( $('#ticketReporter').textContent=`${t.reporter_name} · ${t.reporter_email}` );
    $('#adminStatus')&&( $('#adminStatus').value=t.status );
    $('#adminAssignee')&&( $('#adminAssignee').value=t.assignee||'' );
    const chat=$('#ticketMessages');
    if(chat){
      chat.innerHTML=(t.messages||[]).map(m=>`<div class="ticket-bubble ${m.sender_role==='admin'?'from-admin':'from-reporter'}"><div class="bubble-head"><strong>${esc(m.sender_name)}</strong><small>${fmt(m.created_at)}</small></div><p>${esc(m.body)}</p></div>`).join('');
      chat.scrollTop=chat.scrollHeight;
    }
    renderList(window.__tickets||[]);
  }

  async function loadList(selectId=null){
    const d=await api('/api/tickets');
    window.__tickets=d.tickets||[];
    let list=window.__tickets;
    if(role==='admin'){
      const q=($('#adminSearch')?.value||'').toLowerCase().trim();
      const f=$('#adminFilter')?.value||'Semua';
      if(f!=='Semua') list=list.filter(t=>t.status===f);
      if(q) list=list.filter(t=>`${t.id} ${t.subject} ${t.reporter_email} ${t.reporter_name}`.toLowerCase().includes(q));
      renderAdminStats(window.__tickets); renderList(list);
    } else renderList(list);
    if(selectId){ const full=window.__tickets.find(t=>t.id===selectId); if(full) await openTicket(full.id); }
    return list;
  }

  async function openTicket(id){
    const d=await api(`/api/tickets/${encodeURIComponent(id)}`); renderTicket(d.ticket); return d.ticket;
  }

  async function whoAmI(){
    try{ const d=await api('/api/auth/me'); if(d.user.role!==role) { location.href='login.html?role='+role; return null; } return d.user; }
    catch{return null;}
  }

  function bind(){
    document.addEventListener('click', async e=>{
      const b=e.target.closest('[data-ticket]');
      if(b){ try{ await openTicket(b.dataset.ticket); }catch(err){toast(err.message);} }
    });

    $('#reporterForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      const fd=new FormData(e.currentTarget);
      try{
        const d=await api('/api/tickets',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category:fd.get('category'),subject:fd.get('subject'),detail:fd.get('detail')})});
        e.currentTarget.reset(); toast(`Tiket ${d.ticket.id} dibuat.`); await loadList(d.ticket.id);
      }catch(err){toast(err.message);}
    });

    $('#reporterReplyForm')?.addEventListener('submit', async e=>{
      e.preventDefault(); if(!currentTicketId)return;
      const input=$('#reporterReply'); if(!input.value.trim())return;
      try{ await api(`/api/tickets/${encodeURIComponent(currentTicketId)}/messages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:input.value})}); input.value=''; await openTicket(currentTicketId); toast('Balasan tersimpan di server.'); }
      catch(err){toast(err.message);}
    });

    $('#adminReplyForm')?.addEventListener('submit', async e=>{
      e.preventDefault(); if(!currentTicketId)return;
      const input=$('#adminReply'); if(!input.value.trim())return;
      try{ await api(`/api/tickets/${encodeURIComponent(currentTicketId)}/messages`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:input.value})}); input.value=''; await openTicket(currentTicketId); await loadList(currentTicketId); toast('Balasan admin tersimpan.'); }
      catch(err){toast(err.message);}
    });

    $('#adminStatus')?.addEventListener('change', async e=>{
      if(!currentTicketId)return; try{const d=await api(`/api/tickets/${encodeURIComponent(currentTicketId)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:e.target.value,assignee:$('#adminAssignee')?.value||''})}); renderTicket(d.ticket); await loadList(currentTicketId); toast('Status diperbarui.');}catch(err){toast(err.message);}
    });
    $('#adminAssignee')?.addEventListener('change', async e=>{
      if(!currentTicketId)return; try{const d=await api(`/api/tickets/${encodeURIComponent(currentTicketId)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:$('#adminStatus')?.value||'Baru',assignee:e.target.value})}); renderTicket(d.ticket); toast('Admin penanggung jawab diperbarui.');}catch(err){toast(err.message);}
    });
    $('#adminFilter')?.addEventListener('change',()=>loadList().catch(err=>toast(err.message)));
    $('#adminSearch')?.addEventListener('input',()=>loadList().catch(err=>toast(err.message)));
    $('#logoutSupport')?.addEventListener('click',async()=>{try{await fetch('/api/auth/logout',{method:'POST'});}finally{location.href='index.html#home';}});
    $('#themeToggleSupport')?.addEventListener('click',()=>{document.body.classList.toggle('light-mode');localStorage.setItem('waBadakLight',document.body.classList.contains('light-mode')?'1':'0')});
    if(localStorage.getItem('waBadakLight')==='1')document.body.classList.add('light-mode');
  }

  (async()=>{
    const user=await whoAmI();
    if(!user)return;
    const badge=$('#currentUser'); if(badge)badge.textContent=`${user.name} · ${user.email}`;
    bind();
    try{ await loadList(); if(window.__tickets?.[0]) await openTicket(window.__tickets[0].id); }
    catch(err){toast(err.message);}
    // Refresh the shared ticket store so admin + reporter on different devices stay in sync.
    window.setInterval(async()=>{ try{ const selected=currentTicketId; await loadList(); if(selected) await openTicket(selected); }catch{} }, 10000);
  })();
})();

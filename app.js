const DATA=[
 ["628******5020","public","2",0,1496],["628*****0703","public","2",62,1495],
 ["628******7187","public","2",6,1494],["628******1076","public","2",0,1493],
 ["628******2005","public","2",0,1492],["628****7187","public","2",0,1491],
 ["628******2638","public","2",11,1490],["628*****7187","public","2",0,1489],
 ["628******6902","public","2",0,1488],["628******5370","public","2",22,1487]
];
const COMMANDS=[
 ["General",".menu","Menu utama, profil, kategori"],["General",".ping","Tes respon dan latency"],
 ["Group",".infogroup","Info grup"],["Group",".anti","Proteksi link, badword, bot, spam"],
 ["Jadibot",".jadibot","Daftarkan nomor sebagai bot"],["Jadibot",".cekbot","Cek status sesi bot"],
 ["Downloader",".youtube <url>","Downloader video/audio"],["Downloader",".tiktok <url>","Downloader TikTok"],
 ["Sticker",".sticker","Media menjadi sticker"],["Maker",".qc <teks>","Quote chat"],
 ["Tools",".translate <kode>","Terjemahan"],["Tools",".cuaca <kota>","Cuaca"],
 ["Fun",".jokes","Lelucon acak"],["Anime",".random","Gambar anime acak"],
 ["Game",".tebakgambar","Game tebak gambar"],["Game",".tictactoe","Tic-tac-toe"],
 ["Mancing",".fish","Memancing"],["Mancing",".inventory","Inventori"],
 ["VIP",".ai <prompt>","Chat AI"],["VIP",".removebg","Hapus background"],
 ["VVIP",".aivideo <prompt>","Generate video AI"],["VVIP",".ban <target>","Ban user"],
 ["Perintah !","!aktifbot","Cek bot aktif di grup"],["Perintah !","!pingme","Ping bot sendiri"]
];
const nav=[
 ["/","Beranda"],["/features","Fitur"],["/bots","Direktori"],["/monitor","Monitor"],
 ["/join","Tambah Bot"],["/docs","Docs"],["/dashboard","Dashboard"]
];
function layout(content){
 return `<header class="top"><a class="brand" href="/"><span>ZEKAIS</span>█ CLOUD</a>
 <nav class="nav" id="nav">${nav.map(([u,t])=>`<a href="${u}" data-route="${u}">${t}</a>`).join("")}</nav>
 <button class="menu" onclick="document.getElementById('nav').classList.toggle('open')">☰</button></header>
 <main>${content}</main><footer class="footer"><span>ZEKAIS█ // cloud edition</span><span>Cloudflare-ready frontend · demo data</span></footer>`;
}
function home(){
 return `<section class="hero"><div><div class="eyebrow">WHATSAPP BOT MANAGEMENT PLATFORM_</div>
 <h1>Jalankan botmu.<br><span style="color:var(--green)">Kelola dari cloud.</span></h1>
 <p>Frontend modern bergaya terminal untuk mengelola bot WhatsApp, melihat status server, direktori bot, command, dan dashboard dalam satu tempat.</p>
 <div class="actions"><a class="btn primary" href="/join">▶ Mulai Gratis</a><a class="btn" href="/docs">$ Dokumentasi</a></div></div>
 <div class="terminal"><div class="termbar"><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
 <div><span class="prompt">zekais@cloud:~$</span> cat /live-stats.json</div><br>
 <div>User Terdaftar <b style="float:right">1,248</b></div><div>Total Grup <b style="float:right">8,492</b></div>
 <div>Total Perintah <b style="float:right">2.8M</b></div><div>Bot Aktif <b style="float:right;color:var(--green)">1,397</b></div><br>
 <div class="dim">status: <span class="ok">● operational</span></div></div></section>
 <section class="section"><h2>Bot yang sedang online.</h2><p class="sub">Data contoh untuk tampilan frontend.</p>
 <div class="statgrid">${["Bot Aktif|1,397","Public|1,154","Self|243","Siap Grup|36"].map(x=>{let [a,b]=x.split("|");return `<div class="stat"><small>${a}</small><b>${b}</b></div>`}).join("")}</div></section>
 <section class="section"><h2>Semua yang kamu butuhkan.</h2><p class="sub">Modular, responsif, dan siap disambungkan ke API milikmu.</p>
 <div class="grid">${[["⚡","Jadibot","Alur pairing dan pengelolaan sesi."],["◉","Command","Direktori command dengan filter dan pencarian."],["⊛","Monitoring","Status CPU, RAM, jaringan, dan bot."],["⊕","Multi-Bot","Direktori bot dengan mode dan prioritas."],["▤","Dashboard","Statistik, chat admin, shop, profil."],["◇","Cloudflare","Static hosting cepat dengan edge network."]].map(a=>`<article class="card"><div style="font-size:22px;margin-bottom:12px">${a[0]}</div><h3>${a[1]}</h3><p>${a[2]}</p></article>`).join("")}</div></section>`;
}
function features(){
 let filtered=COMMANDS; return `<div class="eyebrow">$ man zekais-bot --commands</div><h1>List Fitur Bot█</h1>
 <p style="color:var(--muted)">Direktori command demo — data backend dapat diganti dengan API milikmu.</p>
 <div class="toolbar"><input id="search" class="field" placeholder="⌕ cari command atau fungsi…" oninput="renderCommands()">
 <select id="cat" class="field" onchange="renderCommands()"><option>Semua</option>${[...new Set(COMMANDS.map(x=>x[0]))].map(x=>`<option>${x}</option>`).join("")}</select></div>
 <div id="commands"></div>`}
function renderCommands(){let q=(document.getElementById("search")?.value||"").toLowerCase(), c=document.getElementById("cat")?.value||"Semua";
 let rows=COMMANDS.filter(x=>(c==="Semua"||x[0]===c)&&x.join(" ").toLowerCase().includes(q));
 document.getElementById("commands").innerHTML=rows.map(x=>`<div class="command"><code>${x[1]}</code><p>${x[2]}</p><span class="pill">${x[0]}</span></div>`).join("")||`<div class="notice">Tidak ada command yang cocok.</div>`}
function bots(){
 return `<div class="eyebrow">> ls -la /active-bots/</div><h1>Jadibot Directory</h1><p style="color:var(--muted)">Public list · nomor dimask untuk privacy.</p>
 <div class="statgrid">${["Total Bot|1,397","Public Mode|1,154","Self Mode|243","JoinMode On|36"].map(x=>{let[a,b]=x.split("|");return `<div class="stat"><small>${a}</small><b>${b}</b></div>`}).join("")}</div>
 <div class="toolbar"><select class="field"><option>Semua mode</option><option>public</option><option>self</option></select><select class="field"><option>Semua server</option><option>#1</option><option>#2</option></select><input id="botq" class="field" placeholder="⌕ cari nomor / server..." oninput="filterBots()"><a class="btn primary" href="/join">⊕ Tambah bot ke grup</a></div>
 <div class="tablewrap"><table><thead><tr><th>Nomor</th><th>Mode</th><th>JoinMode</th><th>Prioritas</th><th>Grup</th><th>Server</th><th>Status</th></tr></thead><tbody id="botrows">${botRows(DATA)}</tbody></table></div>`}
function botRows(rows){return rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]==="2"?"ON":"OFF"}</td><td>${x[4]}</td><td>${x[3]}</td><td>#${x[2]}</td><td class="ok">● online</td></tr>`).join("")}
function filterBots(){let q=document.getElementById("botq").value.toLowerCase();document.getElementById("botrows").innerHTML=botRows(DATA.filter(x=>x.join(" ").toLowerCase().includes(q)))}
function monitor(){
 return `<div class="eyebrow">> watch /servers --live</div><h1>Monitor Server</h1><p style="color:var(--muted)">Panel monitoring frontend. Nilai bergerak adalah simulasi sampai API monitoring disambungkan.</p>
 <div class="grid">${["Server #1","Server #2","Server #3"].map((s,i)=>`<div class="card"><div class="kicker">${s}</div><h3 style="margin-top:10px">● operational</h3><p>CPU <b id="cpu${i}">32%</b></p><p>RAM <b>${58+i*7}%</b></p><p>Network <b>${12+i*4} Mbps</b></p></div>`).join("")}</div>
 <div class="section notice">Untuk data real-time, ganti polling demo di <span class="mono">app.js</span> dengan endpoint Worker/API milikmu.</div>`}
function dashboard(){
 return `<div class="sidebar-layout"><aside class="side">${["Dashboard","Statistik","Chat Admin","Shop","Langganan","Lapor/Bantuan","Profil","Tambah Bot"].map((x,i)=>`<a href="#${i}">${i===0?"▣":"›"} ${x}</a>`).join("")}</aside>
 <section><div class="eyebrow">zekais@cloud:~$ dashboard</div><h1>Control Center</h1>
 <div class="notice">Mode demo. Autentikasi dan database belum dihubungkan.</div>
 <div class="section statgrid">${["Bot Aktif|12","Grup|84","Command|3,921","Uptime|99.9%"].map(x=>{let[a,b]=x.split("|");return `<div class="stat"><small>${a}</small><b>${b}</b></div>`}).join("")}</div>
 <div class="section grid"><div class="card"><h3>Aktivitas terbaru</h3><p>21:34 · bot #2 online</p><p>21:29 · command .ping</p><p>21:17 · server #1 healthy</p></div><div class="card"><h3>Sesi bot</h3><p class="ok">● Connected</p><p>Mode: public</p><p>Server: #2</p></div></div></section></div>`}
function generic(title,eyebrow,body){return `<div class="eyebrow">${eyebrow}</div><h1>${title}</h1><div class="card" style="max-width:850px"><p style="color:var(--muted);line-height:1.8">${body}</p></div>`}
function join(){return generic("Tambah Bot ke Grup","$ ./join-bot.sh","Masukkan link undangan grup WhatsApp, lalu pilih bot yang memiliki JoinMode aktif. Pada versi produksi, form ini harus memanggil Worker/API untuk validasi link dan daftar bot.");}
function docs(){return generic("Dokumentasi","$ man zekais-cloud","Panduan instalasi, konfigurasi environment, struktur API, Cloudflare Pages, Workers, KV/D1, autentikasi, dan integrasi WhatsApp dapat ditempatkan di sini.");}
function route(){
 let p=location.pathname.replace(/\/$/,"")||"/", c=p==="/" ? home() : p==="/features"?features():p==="/bots"?bots():p==="/monitor"?monitor():p==="/dashboard"?dashboard():p==="/join"?join():p==="/docs"?docs():generic("Halaman","$ cd ~/","Halaman ini siap ditambahkan.");
 document.getElementById("app").innerHTML=layout(c); document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("active",a.dataset.route===p));
 if(p==="/features")renderCommands();
}
document.addEventListener("click",e=>{let a=e.target.closest("a");if(a&&a.origin===location.origin&&a.pathname.startsWith("/")){e.preventDefault();history.pushState({},'',a.pathname);route();}});
window.addEventListener("popstate",route); route();

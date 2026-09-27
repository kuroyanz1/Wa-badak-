const botRows=document.getElementById('botRows');
const menuBtn=document.getElementById('menuBtn');
const nav=document.getElementById('nav');
const bots=[["628******0518","public","#2","2","1470"],["628******0555","public","#1","30","1469"],["628*****2599","public","#1","10","1468"],["628******2508","self","#1","24","1467"],["628******1567","public","#1","10","1466"],["628*******8269","public","#2","17","1465"],["628******6413","public","#1","20","1464"],["628******5403","public","#1","4","1463"],["628******3719","public","#2","11","1462"],["628*****9059","public","#1","10","1461"],["628******5735","public","#2","29","1460"],["628******5170","public","#2","2","1459"],["628******0881","public","#2","3","1458"],["628******1350","public","#1","32","1457"],["628******7031","public","#2","5","1456"],["628******4379","public","#1","2","1455"],["628******2378","public","#2","0","1454"],["628*******6183","public","#2","5","1453"],["628******1830","public","#2","16","1452"],["628******6585","public","#2","0","1451"],["628******7072","public","#2","0","1450"],["628******9521","public","#1","4","1449"],["628******5021","public","#1","23","1448"],["628******8993","public","#1","6","1447"],["628*******8675","public","#2","0","1446"],["628******1008","public","#2","0","1445"],["628******8480","public","#2","0","1444"],["628*****8480","public","#2","0","1443"],["628******1004","public","#2","0","1442"],["628******6027","public","#1","6","1441"],["628******1534","public","#1","0","1440"],["628******6521","public","#2","0","1439"],["628******4779","public","#2","17","1438"],["601****5097","public","#1","9","1437"],["628******4126","public","#1","78","1436"],["628*******3456","public","#2","5","1435"],["628******1070","public","#2","20","1434"],["628******3689","public","#2","0","1433"],["628******4635","public","#1","0","1432"],["628******1640","self","#1","48","1431"],["628******8229","public","#2","0","1430"],["628******5791","public","#2","0","1429"],["628*******3800","public","#2","0","1428"],["628******7860","public","#2","0","1427"],["628******6496","public","#2","0","1426"],["628*****4439","public","#1","10","1425"],["628******5559","self","#2","2","1422"],["628******8205","public","#2","3","1421"]];
botRows.innerHTML=bots.map(b=>`<div class="bot-row"><span>${b[0]}</span><span>${b[1]}</span><span>${b[2]}</span><span>${b[3]} grup</span><span>${b[4]}</span></div>`).join('');
menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const el=document.querySelector(a.getAttribute('href'));if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth',block:'start'})}}));


// Clone-only navigation: keep internal links inside the clone.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!id || id in {top:1,features:1,pricing:1,faq:1,login:1}) return;
  const target = document.getElementById(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

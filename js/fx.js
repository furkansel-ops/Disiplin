'use strict';
/* ===== Animasyon, ses, efekt yardımcıları ===== */
function count(el,to,dec=0,pre='',suf=''){
  if(!el) return;
  const from=el._v??0; el._v=to; cancelAnimationFrame(el._raf);
  if(RM.matches||from===to||document.hidden){ el.textContent=pre+fmt(to,dec)+suf; return; }
  const t0=performance.now(), D=750;
  const step=t=>{ const k=Math.min(1,(t-t0)/D), e=1-Math.pow(1-k,3); el.textContent=pre+fmt(from+(to-from)*e,dec)+suf; if(k<1) el._raf=requestAnimationFrame(step); };
  el._raf=requestAnimationFrame(step);
}
function flip(container,mutate){
  const pos=new Map(); [...container.children].forEach(c=>pos.set(c.dataset.id,c.getBoundingClientRect().top));
  mutate();
  if(RM.matches) return;
  [...container.children].forEach((c,i)=>{
    const f=pos.get(c.dataset.id);
    if(f==null){ c.animate([{opacity:0,transform:'translateY(10px) scale(.97)'},{opacity:1,transform:'none'}],{duration:420,delay:pos.size?0:i*45,easing:'cubic-bezier(.2,.9,.3,1.15)',fill:'backwards'}); return; }
    const dy=f-c.getBoundingClientRect().top;
    if(Math.abs(dy)>1){
      c.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.9,.25,1)'});
      if(dy>0) c.animate([{boxShadow:'0 0 0 2px var(--good)'},{boxShadow:'0 0 0 0 transparent'}],{duration:900});
    }
  });
}
function shake(el){ el.animate([{transform:'none'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:dur(320)}); el.focus(); }
function ripple(el){ if(RM.matches) return; const s=document.createElement('span'); s.className='ripple'; el.appendChild(s); s.addEventListener('animationend',()=>s.remove()); }
let toastT;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),3000); }
function floatText(x,y,text,cls=''){
  if(RM.matches) return;
  const el=document.createElement('div'); el.className='float '+cls; el.textContent=text; el.style.left=x+'px'; el.style.top=y+'px';
  document.body.appendChild(el);
  el.animate([{opacity:0,transform:'translate(-50%,-30%) scale(.7)'},{opacity:1,transform:'translate(-50%,-110%) scale(1.05)',offset:.25},{opacity:0,transform:'translate(-50%,-260%) scale(1)'}],{duration:1100,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(()=>el.remove());
}

/* konfeti / parçacık */
const cv=$('#fx'), cx=cv.getContext('2d'); let parts=[], running=false;
const CONF=['#8b7bff','#3dd6c6','#3ddc97','#ffcc66','#ff6b81','#60a5fa'];
// yüksek DPI tabletlerde dev canvas'ları önle: piksel oranı sınırlanır (efektlerde fark edilmez)
function sizeCanvas(c,ctx,max=2){ const r=Math.min(max,devicePixelRatio||1); c.width=Math.round(innerWidth*r); c.height=Math.round(innerHeight*r); ctx.setTransform(r,0,0,r,0,0); }
// hareketler zamana bağlı: 60, 90 ya da 120 Hz ekranda aynı hızda akar (k = 60 Hz'lik kare sayısı)
const frameK=(now,last)=>Math.min(3,Math.max(0,(now-last)/16.667))||1;
let fxLast=0;
function run(){ if(!running){ running=true; fxLast=performance.now(); requestAnimationFrame(tick); } }
function tick(now){
  const k=frameK(now,fxLast), drag=Math.pow(.985,k); fxLast=now;
  cx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life>0&&p.y<innerHeight+40);
  for(const p of parts){
    p.vy+=p.g*k; p.vx*=drag; p.x+=p.vx*k; p.y+=p.vy*k; p.rot+=p.vr*k; p.life-=p.decay*k;
    cx.save(); cx.globalAlpha=Math.max(0,Math.min(1,p.life*1.5)); cx.fillStyle=p.c; cx.translate(p.x,p.y); cx.rotate(p.rot);
    if(p.sh===0) cx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);
    else if(p.sh===1){ cx.beginPath(); cx.arc(0,0,p.s/3,0,7); cx.fill(); }
    else cx.fillRect(-p.s/8,-p.s/2,p.s/4,p.s);
    cx.restore();
  }
  if(parts.length) requestAnimationFrame(tick); else { running=false; cx.clearRect(0,0,innerWidth,innerHeight); }
}
function burst(x,y,n,hue){
  if(RM.matches) return;
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=2+Math.random()*4.5;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2.5,g:.22,life:1,decay:.02+Math.random()*.02,s:4+Math.random()*5,rot:Math.random()*6,vr:(Math.random()-.5)*.4,
      c:hue==null?CONF[i%CONF.length]:`hsl(${hue+(i%3)*25} 85% ${55+(i%2)*12}%)`,sh:i%3}); }
  run();
}
function rain(n=160){
  if(RM.matches) return;
  for(let i=0;i<n;i++) parts.push({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.5,vx:(Math.random()-.5)*2.5,vy:2+Math.random()*3,g:.05,life:1.4,decay:.004+Math.random()*.004,s:6+Math.random()*7,rot:Math.random()*6,vr:(Math.random()-.5)*.25,c:CONF[i%CONF.length],sh:i%3});
  run();
}

/* ses efektleri (Web Audio ile sentezlenir, dosya gerekmez) */
let AC=null;
function sfx(type,n=1){
  if(!S.settings.sound) return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    const t=AC.currentTime;
    const tone=(f,st,d,wave='sine',vol=.07)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type=wave; o.frequency.setValueAtTime(f,t+st);
      g.gain.setValueAtTime(0,t+st); g.gain.linearRampToValueAtTime(vol,t+st+.012); g.gain.exponentialRampToValueAtTime(.0001,t+st+d);
      o.connect(g).connect(AC.destination); o.start(t+st); o.stop(t+st+d+.03); };
    if(type==='pop') tone(520+Math.min(n,10)*55,0,.14,'triangle');
    else if(type==='tick') tone(700,0,.06,'sine',.04);
    else if(type==='unpop') tone(240,0,.12,'sine',.05);
    else if(type==='win') [523,659,784,1046].forEach((f,i)=>tone(f,i*.09,.28,'triangle'));
    else if(type==='level') [392,523,659,784,1046,1318].forEach((f,i)=>tone(f,i*.07,.35,'square',.035));
    else if(type==='ding') { tone(880,0,.5,'sine',.08); tone(1320,.12,.5,'sine',.05); }
  }catch(e){}
}

/* ay temalı ortam parçacıkları */
const amb=$('#amb'), ac=amb.getContext('2d'); let ambParts=[], ambType=null, ambRaf=0;
const ambientFor=m=>[11,0,1].includes(m)?'snow':[2,3,4].includes(m)?'petal':[5,6,7].includes(m)?'sun':'leaf';
function newAmb(init){
  const w=innerWidth,h=innerHeight, t=ambType, r=Math.random;
  const p={x:r()*w,y:init?r()*h:(t==='sun'?h+20:-20),rot:r()*6,vr:(r()-.5)*.03,ph:r()*6,a:.25+r()*.45};
  if(t==='snow') Object.assign(p,{s:1.5+r()*3,vx:(r()-.5)*.3,vy:.35+r()*.8,c:'200,215,255'});
  else if(t==='petal') Object.assign(p,{s:4+r()*4,vx:.2+r()*.5,vy:.5+r()*.8,c:'255,160,200'});
  else if(t==='leaf') Object.assign(p,{s:5+r()*5,vx:(r()-.3)*.6,vy:.6+r()*.9,c:['230,126,34','211,84,0','241,196,15'][Math.floor(r()*3)]});
  else Object.assign(p,{s:10+r()*26,vx:(r()-.5)*.2,vy:-.15-r()*.35,c:'255,210,120',a:.06+r()*.1});
  return p;
}
function setAmbient(m){
  const t=S.settings.ambient&&!RM.matches?ambientFor(m):null;
  if(t===ambType) return;
  ambType=t; ambParts=[]; ac.clearRect(0,0,innerWidth,innerHeight);
  if(!t){ cancelAnimationFrame(ambRaf); ambRaf=0; return; }
  for(let i=0;i<(t==='sun'?18:38);i++) ambParts.push(newAmb(true));
  if(!ambRaf) ambRaf=requestAnimationFrame(ambLoop);
}
// güneş parlaması her karede gradyan üretmek yerine bir kez çizilip kopyalanır
const glow=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'), r=g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(255,210,120,1)'); r.addColorStop(1,'rgba(255,210,120,0)'); g.fillStyle=r; g.fillRect(0,0,128,128); return c; })();
let ambLast=0;
function ambLoop(now){
  if(!ambType){ ambRaf=0; return; }
  ambRaf=requestAnimationFrame(ambLoop);
  const k=ambLast?frameK(now,ambLast):1; ambLast=now;
  if(document.hidden||scrolling) return; // kaydırırken arka plan donar: ekran kartı yalnızca kaydırmayla uğraşır
  const w=innerWidth,h=innerHeight; ac.clearRect(0,0,w,h);
  ambParts.forEach((p,i)=>{
    p.ph+=.02*k; p.x+=(p.vx+Math.sin(p.ph)*.35)*k; p.y+=p.vy*k; p.rot+=p.vr*k;
    if(p.y>h+30||p.y<-40||p.x<-40||p.x>w+40){ ambParts[i]=newAmb(false); return; }
    if(ambType==='sun'){ ac.globalAlpha=p.a; ac.drawImage(glow,p.x-p.s,p.y-p.s,p.s*2,p.s*2); ac.globalAlpha=1; return; }
    ac.save(); ac.translate(p.x,p.y); ac.rotate(p.rot);
    ac.fillStyle=`rgba(${p.c},${p.a})`; ac.beginPath(); if(ambType==='snow') ac.arc(0,0,p.s,0,7); else ac.ellipse(0,0,p.s,p.s*.5,0,0,7); ac.fill();
    ac.restore();
  });
}
function resizeAll(){ sizeCanvas(cv,cx); sizeCanvas(amb,ac,1.5); }
resizeAll();

/* ipucu balonu */
const tip=$('#tip'); let tipEl=null;
function showTip(el){
  tipEl=el; if(!el){ tip.classList.remove('show'); return; }
  tip.textContent=el.dataset.tip;
  const r=el.getBoundingClientRect(), w=tip.offsetWidth/2;
  tip.style.left=Math.min(innerWidth-8-w,Math.max(8+w,r.left+r.width/2))+'px';
  tip.style.top=Math.max(tip.offsetHeight+14,r.top)+'px';
  tip.classList.add('show');
}
document.addEventListener('pointerover',e=>{ const el=e.target.closest('[data-tip]'); if(el!==tipEl) showTip(el); });
document.addEventListener('focusin',e=>{ const el=e.target.closest('[data-tip]'); if(el!==tipEl) showTip(el); });
// kaydırma sürerken (tablo ya da sayfa) süs animasyonları duraklar, bittikten 250 ms sonra devam eder
let scrolling=false, scrollT=0;
document.addEventListener('scroll',()=>{
  if(tipEl) showTip(null);
  if(!scrolling){ scrolling=true; document.documentElement.classList.add('scrolling'); }
  clearTimeout(scrollT); scrollT=setTimeout(()=>{ scrolling=false; document.documentElement.classList.remove('scrolling'); },250);
},{capture:true,passive:true});

/* seviye atlama ekranı ve başarım bildirimi */
let lvlT;
function showLevelUp(L){
  $('#luN').textContent=L; $('#luS').textContent=`${xpForLevel(L+1)-xpForLevel(L)} XP ile sıradaki seviye`;
  $('#lvlUp').classList.add('show'); rain(220); sfx('level');
  clearTimeout(lvlT); lvlT=setTimeout(()=>$('#lvlUp').classList.remove('show'),2800);
}
const unlockQ=[]; let unlockBusy=false;
function showUnlock(a){ unlockQ.push(a); if(!unlockBusy) nextUnlock(); }
function nextUnlock(){
  const a=unlockQ.shift(); if(!a){ unlockBusy=false; return; }
  unlockBusy=true; $('#ulX').textContent=`${TIER[a[4]][0]} başarım açıldı · +${TIER[a[4]][1]} XP`; $('#ulE').textContent=a[1]; $('#ulT').textContent=a[2]; $('#ulD').textContent=a[3];
  const u=$('#unlock'); u.classList.add('show'); sfx('ding'); burst(innerWidth/2,70,30);
  setTimeout(()=>{ u.classList.remove('show'); setTimeout(nextUnlock,500); },2800);
}

'use strict';
/* ===== Ek özellikler: evcil hayvan, avatar, meydan okumalar, odak/rutin, nefes, arka plan sesi,
   sesli not, günlük sayfası, mektup, vizyon panosu, ek içgörüler, arkadaş kıyası, QR aktarım, otomatik yedek ===== */
const APP_URL='https://furkansel-ops.github.io/Disiplin/';
const appBase=()=>location.protocol.startsWith('http')?location.origin+location.pathname:APP_URL;

/* ---------- IndexedDB (sesli notlar, yedek klasörü) ---------- */
const IDB=(()=>{ let p=null;
  const open=()=>p||(p=new Promise((res,rej)=>{ const r=indexedDB.open('aliskanlik-medya',1); r.onupgradeneeded=()=>r.result.createObjectStore('m'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }));
  const tx=(mode,fn)=>open().then(db=>new Promise((res,rej)=>{ const t=db.transaction('m',mode), r=fn(t.objectStore('m')); t.oncomplete=()=>res(r&&r.result); t.onerror=()=>rej(t.error); }));
  return {get:k=>tx('readonly',s=>s.get(k)),set:(k,v)=>tx('readwrite',s=>s.put(v,k)),del:k=>tx('readwrite',s=>s.delete(k))}; })();

/* ---------- evcil hayvan ---------- */
const PET_STAGES=[[1,'Yumurta'],[3,'Yavru'],[6,'Genç'],[11,'Yetişkin'],[21,'Efsane']];
function petState(){
  const L=xpInfo().L, st=PET_STAGES.reduce((a,s,i)=>L>=s[0]?i:a,0), tk=todayKey(), td=dayStat(tk);
  let s=0,c=0; for(let i=1;i<=3;i++){ const ds=dayStat(addDays(tk,-i)); s+=ds.s; c+=ds.c; }
  const recent=s?c/s:.6, happy=Math.round(Math.min(1,recent*.65+td.p*.45)*100);
  return {L,st,stage:PET_STAGES[st][1],next:PET_STAGES[st+1],happy,mood:happy>=70?'happy':happy>=40?'ok':'sad',food:td.p,left:td.s-td.c};
}
const petEmoji=st=>st===0?'🥚':(PETS.find(p=>p[0]===S.pet.type)||PETS[0])[1];
function petMsg(p){
  if(p.st===0) return `Yumurtam çatlamak üzere… Seviye ${PET_STAGES[1][0]}'te çıkacağım! 🥚`;
  if(p.food>=1) return 'Bugün harikaydın! Karnım tok, çok mutluyum 💕';
  if(p.mood==='sad') return 'Son günlerde beni biraz unuttun 🥺 Küçük bir alışkanlıkla başlayalım mı?';
  if(p.left>0) return `Karnım acıktı… ${p.left} alışkanlık daha beni doyurur 🍖`;
  return 'Bugün dinlenme günü, birlikte keyif yapalım 😌';
}
function petMini(){ const p=petState(); return `<button class="pet-mini ${p.mood}" data-a="petPat" aria-label="${esc(S.pet.name)} ile oyna"><span class="pet-e st${p.st}">${petEmoji(p.st)}</span><span class="pet-b">${esc(petMsg(p))}</span></button>`; }
function petCard(){
  const p=petState();
  return `<div class="card glass rise pet-card ${p.mood}" style="--i:2"><div class="chead"><h3>🐾 Evcil Dostun</h3><span class="sub">${p.stage}${p.next?` · Seviye ${p.next[0]}'de ${p.next[1]}`:' · son aşama'}</span></div>
    <div class="pet-row"><button class="pet-big" data-a="petPat" aria-label="Sev"><span class="pet-e st${p.st}">${petEmoji(p.st)}</span>${p.mood==='sad'?'<span class="pet-fx">💧</span>':p.mood==='happy'?'<span class="pet-fx">💕</span>':''}</button>
      <div style="flex:1;min-width:200px"><input class="pet-name" data-pet="name" value="${esc(S.pet.name)}" maxlength="20" aria-label="Evcil hayvan adı">
        <p class="pet-say">“${esc(petMsg(p))}”</p>
        <div class="pbar"><span>💖 Mutluluk</span><span class="track"><i style="--h:330;width:${p.happy}%"></i></span><b>%${p.happy}</b></div>
        <div class="pbar"><span>🍖 Tokluk</span><span class="track"><i style="--h:38;width:${Math.round(p.food*100)}%"></i></span><b>%${Math.round(p.food*100)}</b></div>
        <div class="chips" style="margin-top:10px">${PETS.map(([t,e,n])=>`<button class="chip${S.pet.type===t?' on':''}" data-a="petType" data-t="${t}">${e} ${n}</button>`).join('')}</div></div></div>
    <p class="hint">Alışkanlıklarını yaptıkça doyar ve mutlu olur; seviye atladıkça büyür.</p></div>`;
}

/* ---------- avatar ---------- */
const AV_BASE=['🙂','😎','🧑','👩','🧔','👧','🧑‍🎓','🦸','🧙','🥷','🤖','🐵'];
const AV_HATS=[['🎩',2],['🧢',4],['👒',6],['🎓',9],['⛑️',12],['👑',15]];
const AV_EYES=[['👓',3],['🕶️',5],['🥽',8]];
const AV_AURA=[['fire',8,'🔥 Alev'],['ice',12,'❄️ Buz'],['gold',20,'✨ Altın'],['rainbow',25,'🌈 Gökkuşağı']];
function avatarHTML(size=96){ const a=S.avatar;
  return `<span class="avatar${a.aura?' a-'+esc(a.aura):''}" style="--s:${size}px"><span class="av-b">${esc(a.base)}</span>${a.hat?`<span class="av-h">${esc(a.hat)}</span>`:''}${a.eyes?`<span class="av-e">${esc(a.eyes)}</span>`:''}</span>`; }
function avatarCard(){
  const L=xpInfo().L, lock=(v,lv,f,lab)=>`<button class="av-opt${S.avatar[f]===v?' on':''}${L<lv?' lock':''}" data-a="avSet" data-f="${f}" data-v="${esc(v)}" ${L<lv?`disabled data-tip="Seviye ${lv}'te açılır"`:''}>${lab||esc(v)}${L<lv?`<small>Lv ${lv}</small>`:''}</button>`;
  return `<div class="card glass rise" style="--i:3"><div class="chead"><h3>🧑‍🎨 Avatarın</h3><span class="sub">Seviye atladıkça yeni aksesuarlar açılır</span></div>
    <div class="av-row">${avatarHTML(110)}<div class="av-opts">
      <span class="label">Karakter</span><div>${AV_BASE.map(b=>lock(b,1,'base')).join('')}</div>
      <span class="label">Şapka</span><div>${lock('',1,'hat','—')}${AV_HATS.map(([v,l])=>lock(v,l,'hat')).join('')}</div>
      <span class="label">Gözlük</span><div>${lock('',1,'eyes','—')}${AV_EYES.map(([v,l])=>lock(v,l,'eyes')).join('')}</div>
      <span class="label">Aura</span><div>${lock('',1,'aura','—')}${AV_AURA.map(([v,l,n])=>lock(v,l,'aura',n)).join('')}</div></div></div></div>`;
}

/* ---------- meydan okumalar ---------- */
const CH_TPL=[['30 Gün Şekersiz','🍬',30,'Şekersiz Gün'],['21 Gün Erken Kalk','🌅',21,'Erken Kalk'],['7 Gün Ekransız Akşam','📵',7,'Ekransız Akşam'],['14 Gün Kitap','📕',14,'Kitap Oku'],['30 Gün Meditasyon','🧘',30,'Meditasyon'],['30 Gün Spor','💪',30,'Spora Git']];
function chalCard(c,i){
  const st=chalStat(c), pct=Math.min(1,st.ok/c.days);
  return `<div class="ccard rise${st.complete?' won':st.failed?' lost':''}" style="--i:${i}" data-id="${esc(c.id)}"><button class="mini-btn del" data-a="chDel" aria-label="Sil">🗑</button>
    <div class="qtop"><span style="font-size:24px">${esc(c.icon)}</span><div><b>${esc(c.name)}</b><div class="sub">${st.h?`${iconText(st.h.icon)} ${esc(st.h.name)}`:'alışkanlık silinmiş'} · ${c.days} gün</div></div></div>
    <div class="track"><i style="--h:${st.complete?145:st.failed?0:38};width:${pct*100}%"></i></div>
    <span class="sub">${st.complete?'🏆 Tamamlandı! +300 XP':st.failed?`💔 Zincir koptu (${st.ok}/${c.days})`:`${st.ok}/${c.days} gün · ${st.left} gün kaldı`}</span>
    ${st.failed?'<button class="btn ghost sm" data-a="chRestart">↻ Yeniden başla</button>':''}</div>`;
}
function chalSection(){
  return `<div class="card glass rise" style="--i:4;margin-bottom:16px"><div class="chead"><h3>🏁 Meydan Okumalar</h3><span class="sub">Her gün yap, zinciri koparma · tamamlayınca +300 XP</span></div>
    <div class="quits">${S.challenges.map(chalCard).join('')||'<p class="hint">Aşağıdan bir meydan okuma seç ya da kendininkini oluştur.</p>'}</div>
    <div class="tpls" style="margin-top:12px">${CH_TPL.map((t,i)=>`<button class="chip" data-a="chTpl" data-i="${i}">${t[1]} ${esc(t[0])}</button>`).join('')}</div>
    ${active().length?`<form class="qform" id="chForm" style="margin-top:10px"><select id="chHabit" aria-label="Alışkanlık">${active().map(h=>`<option value="${esc(h.id)}">${esc(iconText(h.icon))} ${esc(h.name)}</option>`).join('')}</select><input type="number" id="chDays" min="3" max="365" value="21" aria-label="Gün sayısı" style="max-width:80px"><button class="btn">Başlat</button></form>`:''}</div>`;
}
function startChallenge(name,icon,habitId,days){
  S.challenges.push({id:uid(),name:name.slice(0,60),icon,habitId,days,start:todayKey()}); rev++; save(); render(); sfx('win'); toast(`🏁 ${name} başladı! Her gün yapmayı unutma`);
}

/* ---------- arka plan sesi (sentezlenmiş gürültü) ---------- */
const NOISES=[['','🔇 Sessiz'],['white','🌫️ Beyaz gürültü'],['rain','🌧️ Yağmur'],['ocean','🌊 Okyanus']];
let NZ=null;
function noise(type){
  if(NZ){ const o=NZ; NZ=null; try{ o.g.gain.setTargetAtTime(0,AC.currentTime,.2); setTimeout(()=>{ try{ o.src.stop(); o.lfo&&o.lfo.stop(); }catch(e){} },800); }catch(e){} }
  $$('[data-a="noise"]').forEach(b=>b.textContent=(NOISES.find(n=>n[0]===type)||NOISES[0])[1].split(' ')[0]);
  if(!type) return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume();
    const len=AC.sampleRate*4, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0); let b0=0,b1=0,b2=0,last=0;
    for(let i=0;i<len;i++){ const w=Math.random()*2-1;
      if(type==='white') d[i]=w*.25;
      else if(type==='rain'){ b0=.99765*b0+w*.099046; b1=.963*b1+w*.2965164; b2=.57*b2+w*1.0526913; d[i]=(b0+b1+b2+w*.1848)*.06; }
      else { last=(last+.02*w)/1.02; d[i]=last*3; } }
    const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
    const g=AC.createGain(); g.gain.value=0; let node=src, lfo=null;
    if(type==='rain'){ const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2600; src.connect(f); node=f; }
    if(type==='ocean'){ lfo=AC.createOscillator(); const lg=AC.createGain(); lfo.frequency.value=.09; lg.gain.value=.25; lfo.connect(lg).connect(g.gain); lfo.start(); }
    node.connect(g).connect(AC.destination); src.start(); g.gain.setTargetAtTime(type==='ocean'?.45:.5,AC.currentTime,.5);
    NZ={src,g,lfo,type};
  }catch(e){ toast('Ses başlatılamadı'); }
}
const nextNoise=()=>{ const i=NOISES.findIndex(n=>n[0]===(NZ?NZ.type:'')); const n=NOISES[(i+1)%NOISES.length]; noise(n[0]); toast(n[1]); };

/* ---------- odak / rutin modu ---------- */
let FQ=null;
function openFocus(slot){
  const k=todayKey(), list=chainOrder(active().filter(h=>schedK(h,k)&&(!slot||h.slot===slot)));
  if(!list.length){ toast('Bugün için planlı alışkanlık yok'); return; }
  FQ={k,ids:list.map(h=>h.id),slot,skip:[]}; $('#focus').classList.add('show'); renderFocus(); sfx('ding');
}
function closeFocus(){ FQ=null; $('#focus').classList.remove('show'); }
function renderFocus(){
  if(!FQ) return;
  const k=FQ.k, hs=FQ.ids.map(hab).filter(Boolean), done=hs.filter(h=>isOn(k,h.id)).length;
  const h=hs.find(x=>!isOn(k,x.id)&&!FQ.skip.includes(x.id))||hs.find(x=>!isOn(k,x.id));
  const title=FQ.slot?(SLOTS.find(s=>s[0]===FQ.slot)||['',''])[1]+' rutini':'🎯 Odak modu';
  const dots=`<div class="f-dots">${hs.map(x=>`<i class="${isOn(k,x.id)?'on':x===h?'cur':''}"></i>`).join('')}</div>`;
  const top=`<div class="f-top"><span class="eyebrow">${esc(title)} · ${done}/${hs.length}</span><span style="flex:1"></span><button class="icon-btn sm" data-a="noise" aria-label="Arka plan sesi" data-tip="Arka plan sesi">${NZ?(NOISES.find(n=>n[0]===NZ.type)||NOISES[0])[1].split(' ')[0]:'🎧'}</button><button class="icon-btn sm" data-a="breath" aria-label="Nefes egzersizi">🧘</button><button class="icon-btn sm" data-a="focusClose" aria-label="Kapat">✕</button></div>`;
  if(!h){ $('#focus').innerHTML=`<div class="f-in">${top}${dots}<div class="f-e">🏆</div><h2>Hepsi tamam!</h2><p class="sub">${esc(title)} bitti. Harika iş çıkardın.</p><button class="btn" data-a="focusClose">Kapat</button></div>`; rain(); sfx('win'); return; }
  const v=valOf(k,h.id), T=tgtK(h,k), sd=subsOf(k,h.id), pre=h.after&&hab(h.after);
  $('#focus').innerHTML=`<div class="f-in" style="--h:${h.hue}">${top}${dots}
    <div class="f-e">${iconHTML(h.icon)}</div><h2>${esc(h.name)}</h2>
    ${pre?`<p class="sub">↳ ${esc(pre.name)} sonrası</p>`:''}${h.target?`<p class="f-v">${fmt(v)} / ${T} ${esc(h.unit)}</p>`:''}
    ${h.subs.length?`<div class="f-subs">${h.subs.map((x,i)=>`<button class="sub-i${sd.includes(i)?' on':''}" data-a="fsub" data-h="${esc(h.id)}" data-i="${i}">${sd.includes(i)?'☑':'☐'} ${esc(x)}</button>`).join('')}</div>`:''}
    <div class="f-btns">${h.target?`<button class="btn ghost" data-a="finc" data-h="${esc(h.id)}">＋1 ${esc(h.unit)}</button>`:''}
      ${h.timer?`<button class="btn ghost" data-a="timer" data-h="${esc(h.id)}">▶ ${h.timer} dk</button>`:''}
      <button class="btn big-btn" data-a="fdone" data-h="${esc(h.id)}">✓ Tamamladım</button>
      <button class="btn ghost" data-a="fskip" data-h="${esc(h.id)}">⏭ Sonra</button></div></div>`;
}

/* ---------- nefes egzersizi ---------- */
const BREATHS=[['box','Kutu 4-4-4-4',[['Nefes al',4,1],['Tut',4,1],['Ver',4,.55],['Tut',4,.55]]],['478','Rahatla 4-7-8',[['Nefes al',4,1],['Tut',7,1],['Ver',8,.55]]],['calm','Sakin 4-6',[['Nefes al',4,1],['Ver',6,.55]]]];
let BR=null;
function openBreath(){
  closeBreath(); $('#breath').classList.add('show');
  $('#breath').innerHTML=`<div class="b-in"><div class="f-top"><span class="eyebrow">🧘 Nefes egzersizi</span><span style="flex:1"></span><button class="icon-btn sm" data-a="noise" aria-label="Arka plan sesi">${NZ?(NOISES.find(n=>n[0]===NZ.type)||NOISES[0])[1].split(' ')[0]:'🎧'}</button><button class="icon-btn sm" data-a="breathClose" aria-label="Kapat">✕</button></div>
    <div class="seg" id="brPat">${BREATHS.map(([id,l],i)=>`<button data-a="brPat" data-i="${i}" class="${i===0?'on':''}">${l}</button>`).join('')}</div>
    <div class="seg" id="brDur">${[1,3,5].map((m,i)=>`<button data-a="brDur" data-m="${m}" class="${i===0?'on':''}">${m} dk</button>`).join('')}</div>
    <div class="b-circle" id="brC"><span id="brT">Hazır mısın?</span><b id="brN"></b></div>
    <button class="btn" data-a="brStart" id="brGo">▶ Başla</button><p class="sub" id="brLeft"></p></div>`;
  BR={pat:0,min:1,run:false};
}
function brStart(){
  if(!BR) return; if(BR.run){ brStop(); return; }
  BR.run=true; BR.end=Date.now()+BR.min*60000; BR.ph=-1; $('#brGo').textContent='⏹ Durdur'; brNext();
  BR.tick=setInterval(()=>{ const n=$('#brN'); if(!n||!BR) return; n.textContent=Math.max(1,Math.ceil((BR.phEnd-Date.now())/1000)); const l=Math.max(0,BR.end-Date.now()); $('#brLeft').textContent=`Kalan ${pad(Math.floor(l/60000))}:${pad(Math.floor(l/1000)%60)}`; },200);
}
function brNext(){
  if(!BR||!BR.run) return;
  const ph=BREATHS[BR.pat][2];
  if(Date.now()>=BR.end&&(BR.ph+1)%ph.length===0){ brStop(true); return; }
  BR.ph=(BR.ph+1)%ph.length; const [t,sec,sc]=ph[BR.ph], c=$('#brC');
  BR.phEnd=Date.now()+sec*1000; $('#brT').textContent=t;
  c.style.transitionDuration=RM.matches?'0s':sec+'s'; c.style.transform=`scale(${sc})`; c.dataset.ph=t==='Tut'?'hold':sc===1?'in':'out';
  sfx('tick'); BR.t=setTimeout(brNext,sec*1000);
}
function brStop(done){
  if(!BR) return; clearTimeout(BR.t); clearInterval(BR.tick); BR.run=false;
  const g=$('#brGo'); if(g) g.textContent='▶ Başla'; const c=$('#brC'); if(c){ c.style.transform='scale(.55)'; }
  if(done){ $('#brT').textContent='Tamamlandı 🌿'; $('#brN').textContent=''; sfx('win');
    const m=active().find(h=>/medit|nefes|breath/i.test(h.name)&&schedK(h,todayKey())&&!isOn(todayKey(),h.id));
    $('#brLeft').innerHTML=m?`<button class="btn sm" data-a="brMark" data-h="${esc(m.id)}">✓ ${esc(m.name)} olarak işaretle</button>`:'Kendine iyi baktın.'; }
}
function closeBreath(){ if(BR) brStop(); BR=null; $('#breath').classList.remove('show'); }

/* ---------- sesli not ---------- */
let REC=null;
const vKey=k=>`v:${P.active}:${k}`;
function voiceHTML(k){
  if(REC&&REC.k===k) return `<button type="button" class="btn sm rec" data-a="voiceRec">⏹ Durdur · ${Math.floor((Date.now()-REC.t0)/1000)} sn</button><span class="sub">en fazla 60 sn</span>`;
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined') return '<span class="sub">Bu tarayıcı ses kaydını desteklemiyor.</span>';
  return S.voice[k]?`<button type="button" class="btn ghost sm" data-a="voicePlay" data-k="${k}">▶ Dinle</button><button type="button" class="btn ghost sm" data-a="voiceRec">🎙️ Yeniden kaydet</button><button type="button" class="btn ghost sm" data-a="voiceDel">Sil</button>`
    :'<button type="button" class="btn ghost sm" data-a="voiceRec">🎙️ Kaydet</button><span class="sub">Bu cihazda saklanır, JSON yedeğine girmez</span>';
}
const updVoice=()=>{ const b=$('#voiceBox'); if(b&&dayK) b.innerHTML=voiceHTML(dayK); };
async function voiceRec(){
  if(REC){ REC.mr.stop(); return; }
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){ toast('Bu tarayıcı ses kaydını desteklemiyor'); return; }
  let stream; try{ stream=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ toast('🎙️ Mikrofon izni verilmedi'); return; }
  const k=dayK, mr=new MediaRecorder(stream), chunks=[]; REC={mr,k,t0:Date.now()};
  mr.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  mr.onstop=async()=>{ stream.getTracks().forEach(t=>t.stop()); clearInterval(REC.i); clearTimeout(REC.to); REC=null;
    try{ await IDB.set(vKey(k),new Blob(chunks,{type:mr.mimeType||'audio/webm'})); S.voice[k]=1; onData([k]); sfx('ding'); toast('🎙️ Sesli not kaydedildi'); }catch(e){ toast('⚠️ Ses kaydedilemedi'); }
    updVoice(); };
  mr.start(); REC.i=setInterval(updVoice,1000); REC.to=setTimeout(()=>{ if(mr.state==='recording') mr.stop(); },60000); updVoice();
}
async function voicePlay(k){
  try{ const b=await IDB.get(vKey(k)); if(!b){ toast('Ses bu cihazda bulunamadı'); return; } const u=URL.createObjectURL(b), a=new Audio(u); a.onended=()=>URL.revokeObjectURL(u); await a.play(); }
  catch(e){ toast('⚠️ Ses oynatılamadı'); }
}

/* ---------- günlük sayfası ---------- */
let pixMetric='mood', jQuery='';
const PIX=[['mood','😊 Ruh hâli'],['energy','⚡ Enerji'],['stress','😣 Stres'],['sleep','😴 Uyku'],['done','✅ Tamamlama']];
function pixColor(k){
  if(k>todayKey()) return '';
  if(pixMetric==='done'){ const ds=dayStat(k); return ds.s||ds.all?`hsl(${Math.round(ds.p*140)} 70% 50%)`:''; }
  const n=S.notes[k], v=n?.[pixMetric]; if(!v) return '';
  if(pixMetric==='sleep') return `hsl(${Math.round(Math.min(1,Math.max(0,(v-4)/5))*200)} 65% 52%)`;
  const t=(v-1)/4; return `hsl(${Math.round((pixMetric==='stress'?1-t:t)*130)} 70% 52%)`;
}
function pixelsHTML(y){
  let h='<span></span>'+MONTHS.map(m=>`<span class="px-m">${m.slice(0,1)}</span>`).join('');
  for(let d=1;d<=31;d++){ h+=`<span class="px-d">${d}</span>`;
    for(let m=0;m<12;m++){ if(d>dim(y,m)){ h+='<i class="px none"></i>'; continue; } const k=dkey(y,m,d), c=pixColor(k), n=S.notes[k];
      h+=`<i class="px${c?'':' e'}" style="${c?`--c:${c}`:''}" data-a="day" data-k="${k}" data-tip="${d} ${MONTHS[m]}${n?.mood?' · '+MOODS[n.mood-1]+' '+MOODN[n.mood-1]:''}${n?.energy?' · ⚡'+n.energy:''}${n?.stress?' · 😣'+n.stress:''}${n?.sleep?' · 😴'+n.sleep+' sa':''}"></i>`; } }
  return `<div class="pixels">${h}</div>`;
}
function journalEntries(){
  const q=jQuery.trim().toLocaleLowerCase('tr'), tk=todayKey();
  const ks=[...new Set([...Object.keys(S.notes),...Object.keys(S.photos),...Object.keys(S.voice)])].filter(k=>k<=tk).sort().reverse();
  const out=[];
  for(const k of ks){ const n=S.notes[k]||{}, txt=[n.text||'',...(n.grat||[])].join(' ').toLocaleLowerCase('tr');
    if(!n.text&&!(n.grat||[]).some(Boolean)&&!S.photos[k]&&!S.voice[k]) continue;
    if(q&&!txt.includes(q)&&!(`${pk(k)[2]} ${MONTHS[pk(k)[1]]}`.toLocaleLowerCase('tr').includes(q))) continue;
    out.push(k); if(out.length>=80) break; }
  const hl=s=>{ const e=esc(s); if(!q) return e; const i=e.toLocaleLowerCase('tr').indexOf(esc(q)); return i<0?e:e.slice(0,i)+'<mark>'+e.slice(i,i+esc(q).length)+'</mark>'+e.slice(i+esc(q).length); };
  return out.map((k,i)=>{ const [y,m,d]=pk(k), n=S.notes[k]||{}, g=(n.grat||[]).filter(Boolean);
    return `<article class="jentry rise" style="--i:${Math.min(i,12)}"><button class="jdate" data-a="day" data-k="${k}"><b>${d}</b><span>${MONTHS[m].slice(0,3)} ${y}</span>${n.mood?`<span class="jm">${MOODS[n.mood-1]}</span>`:''}</button>
      <div class="jbody">${n.text?`<p>${hl(n.text)}</p>`:''}${g.length?`<ul class="jgrat">${g.map(x=>`<li>🙏 ${hl(x)}</li>`).join('')}</ul>`:''}
        <div class="jmeta">${n.energy?`<span>⚡ ${n.energy}/5</span>`:''}${n.stress?`<span>😣 ${n.stress}/5</span>`:''}${n.sleep?`<span>😴 ${fmt(n.sleep,1)} sa</span>`:''}${S.voice[k]?`<button class="chip" data-a="voicePlay" data-k="${k}">▶ Sesli not</button>`:''}</div></div>
      ${S.photos[k]?`<img src="${S.photos[k]}" alt="" loading="lazy" class="jph">`:''}</article>`; }).join('')||`<p class="hint">${q?'Aramana uyan kayıt yok.':'Gün penceresinden not, şükür, fotoğraf veya sesli not ekledikçe günlüğün burada birikir.'}</p>`;
}
function beforeAfterHTML(){
  const ks=Object.keys(S.photos).sort(); if(ks.length<2) return '<p class="hint">Önce/sonra karşılaştırması için farklı günlere en az 2 fotoğraf ekle.</p>';
  const opt=sel=>ks.map(k=>{ const [y,m,d]=pk(k); return `<option value="${k}"${k===sel?' selected':''}>${d} ${MONTHS[m]} ${y}</option>`; }).join('');
  return `<div class="ba-sel"><select id="baA" aria-label="Önce">${opt(ks[0])}</select><span>→</span><select id="baB" aria-label="Sonra">${opt(ks[ks.length-1])}</select></div>
    <div class="ba" id="ba" style="--x:50%"><img src="${S.photos[ks[ks.length-1]]}" alt="Sonra" id="baImgB"><img src="${S.photos[ks[0]]}" alt="Önce" id="baImgA" class="ba-top"><span class="ba-line"></span><span class="ba-l">Önce</span><span class="ba-r">Sonra</span>
      <input type="range" id="baR" min="0" max="100" value="50" aria-label="Önce/sonra kaydırıcı"></div>`;
}
function lettersHTML(){
  const tk=todayKey(), def=addDays(tk,30);
  return `<form id="letterForm" class="letter-form"><textarea id="letterTxt" maxlength="2000" rows="3" placeholder="Sevgili gelecekteki ben…" aria-label="Mektup"></textarea>
      <div class="qrow"><label class="sub">Açılış tarihi <input type="date" id="letterDate" min="${addDays(tk,1)}" value="${def}"></label><button class="btn">✉️ Mühürle</button></div></form>
    <div class="letters">${[...S.letters].sort((a,b)=>a.open<b.open?-1:1).map(l=>{ const open=l.open<=tk, [y,m,d]=pk(l.open);
      return `<div class="letter${open?' open':''}" data-id="${esc(l.id)}">${open?`<button class="lbtn" data-a="letterRead">💌 <b>${d} ${MONTHS[m]} ${y}</b><span class="sub">açıldı · oku</span></button>`:`<span class="lbtn">🔒 <b>${d} ${MONTHS[m]} ${y}</b><span class="sub">${daysBetween(tk,l.open)} gün sonra açılır</span></span>`}<button class="mini-btn del" data-a="letterDel" aria-label="Mektubu sil">🗑</button></div>`; }).join('')}</div>`;
}
function visionHTML(){
  return `<div class="vision">${S.vision.map((v,i)=>`<figure class="vcard rise" style="--i:${i}" data-id="${esc(v.id)}"><img src="${v.img}" alt="${esc(v.text)}"><figcaption>${esc(v.text)}</figcaption><button class="mini-btn del" data-a="visDel" aria-label="Kaldır">✕</button></figure>`).join('')}
    ${S.vision.length<12?`<label class="vcard vadd"><span>＋</span><small>Görsel ekle</small><input type="file" accept="image/*" id="visIn" hidden></label>`:''}</div>
    <input id="visTxt" class="field" maxlength="80" placeholder="Görsel için kısa bir hedef yazısı (isteğe bağlı) — sonra görseli seç" aria-label="Vizyon yazısı">`;
}
function renderJournal(){
  const y=S.year;
  $('#view').innerHTML=`<section>
    <div class="mhead"><div class="rise"><span class="eyebrow">Anılar</span><h2>Günlük</h2></div></div>
    <div class="igrid">
      <div class="card glass rise" style="--i:1"><div class="chead"><h3>🎨 ${y} Piksellerde Yıl</h3><div class="seg" role="group" aria-label="Ölçüt">${PIX.map(([m,l])=>`<button data-a="pix" data-m="${m}" class="${pixMetric===m?'on':''}">${l.split(' ')[0]}</button>`).join('')}</div></div>
        <div id="pixBox">${pixelsHTML(y)}</div><p class="hint">${PIX.find(p=>p[0]===pixMetric)[1]} · bir kareye dokun: o günü aç</p></div>
      <div class="card glass rise" style="--i:2"><div class="chead"><h3>🔁 Önce / Sonra</h3></div>${beforeAfterHTML()}</div>
    </div>
    <div class="card glass rise" style="--i:3;margin-bottom:16px"><div class="chead"><h3>📔 Günlüğüm</h3><input id="jSearch" class="field" placeholder="🔎 Notlarda ara…" value="${esc(jQuery)}" aria-label="Günlükte ara" style="max-width:260px"></div>
      <div class="jlist" id="jList">${journalEntries()}</div></div>
    <div class="igrid">
      <div class="card glass rise" style="--i:4"><div class="chead"><h3>✉️ Gelecekteki Kendine Mektup</h3><span class="sub">Seçtiğin güne kadar kilitli kalır</span></div>${lettersHTML()}</div>
      <div class="card glass rise" style="--i:5"><div class="chead"><h3>🌠 Vizyon Panosu</h3><span class="sub">${S.vision.length}/12</span></div>${visionHTML()}</div>
    </div></section>`;
}
function checkLetters(){
  const tk=todayKey(), l=S.letters.find(x=>x.open<=tk&&!x.seen); if(!l) return;
  setTimeout(()=>{ toast('💌 Geçmişten sana bir mektup var!'); openLetter(l); },1800);
}
function openLetter(l){
  l.seen=true; save(); const [y,m,d]=pk(l.created);
  xDlg(`<span class="eyebrow">Geçmişten gelen mektup</span><h3>💌 ${d} ${MONTHS[m]} ${y} tarihinde yazdın</h3><div class="letter-txt">${esc(l.text).replace(/\n/g,'<br>')}</div><footer><button class="btn" value="close">Teşekkürler, geçmişteki ben</button></footer>`);
  rain(120); sfx('win');
}

/* ---------- ek içgörüler ---------- */
function hourHeatHTML(keys){
  const g=Array.from({length:7},()=>new Array(24).fill(0)); let max=0;
  for(const k of keys){ const t=S.times[k]; if(!t) continue; const w=wdK(k); for(const v of Object.values(t)){ const h=+v.slice(0,2); if(++g[w][h]>max) max=g[w][h]; } }
  if(!max) return '<p class="hint">Tik attığın saatler biriktikçe burada en verimli anların görünür.</p>';
  let best=[0,0]; WEEK.forEach(w=>g[w].forEach((c,h)=>{ if(c>g[best[0]][best[1]]) best=[w,h]; }));
  return `<div class="hheat"><span></span>${[0,3,6,9,12,15,18,21].map(h=>`<span class="hh-l" style="grid-column:span 3">${pad(h)}</span>`).join('')}
    ${WEEK.map(w=>`<span class="hh-d">${DAYN[w]}</span>${g[w].map((c,h)=>`<i style="--p:${(c/max).toFixed(2)}" data-tip="${DAYLONG[w]} ${pad(h)}:00–${pad(h)}:59 · ${c} tik"></i>`).join('')}`).join('')}</div>
    <p class="hint">⚡ En verimli anın: <b>${DAYLONG[best[0]]} ${pad(best[1])}:00</b> civarı.</p>`;
}
function reasonsHTML(keys){
  const cnt={}, per={}; let total=0;
  for(const k of keys){ const r=S.reasons[k]; if(!r) continue; for(const [id,c] of Object.entries(r)){ cnt[c]=(cnt[c]||0)+1; total++; (per[c]=per[c]||{})[id]=(per[c][id]||0)+1; } }
  if(!total) return '<p class="hint">Gün penceresinde kaçırdığın alışkanlıklara sebep seçtikçe burada en büyük engelin görünür.</p>';
  const rows=REASONS.filter(([c])=>cnt[c]).sort((a,b)=>cnt[b[0]]-cnt[a[0]]);
  const top=rows[0], th=hab(Object.entries(per[top[0]]).sort((a,b)=>b[1]-a[1])[0][0]);
  return `<div class="hbars">${rows.map(([c,l],i)=>`<div class="hbar" style="--i:${i}"><span>${l}</span><span class="track"><i style="--h:${[0,38,200,330,258,145][REASONS.findIndex(r=>r[0]===c)]};width:${cnt[c]/cnt[top[0]]*100}%"></i></span><b>${cnt[c]}</b></div>`).join('')}</div>
    <p class="hint">En büyük engelin: <b>${top[1]}</b>${th?` — en çok <b>${esc(th.name)}</b> alışkanlığında.`:''}</p>`;
}
function metricsHTML(keys){
  const rows=[];
  const split=(f,hi,lo,lab,unit)=>{ const ks=keys.filter(k=>S.notes[k]?.[f]); if(ks.length<6) return;
    const avg=ks.reduce((s,k)=>s+S.notes[k][f],0)/ks.length, r=a=>{ let s=0,c=0; a.forEach(k=>{ const d=dayStat(k); s+=d.s; c+=d.c; }); return s?c/s:null; };
    const H=r(ks.filter(k=>hi(S.notes[k][f]))), L=r(ks.filter(k=>lo(S.notes[k][f])));
    rows.push(`<li><b>${lab}</b> ortalaman ${fmt(avg,1)}${unit}${H!=null&&L!=null?` · yüksek günlerde <b>%${fmt(H*100)}</b>, düşük günlerde <b>%${fmt(L*100)}</b> tamamlama`:''}</li>`); };
  split('energy',v=>v>=4,v=>v<=2,'⚡ Enerji','/5'); split('stress',v=>v>=4,v=>v<=2,'😣 Stres','/5'); split('sleep',v=>v>=7,v=>v<6,'😴 Uyku',' saat');
  return rows.length?`<ul class="ilist">${rows.join('')}</ul>`:'<p class="hint">Gün penceresinden enerji, stres ve uyku girdikçe alışkanlıklarınla ilişkisi burada çıkar (en az 6 gün).</p>';
}
function recordsHTML(){
  return memo('rec',()=>{
    const hs=active(), tk=todayKey(), first=firstDataKey(); let bs=null;
    hs.forEach(h=>{ const b=streaks(h).best; if(!bs||b>bs[1]) bs=[h,b]; });
    let maxDay=[null,0], run=0, bestRun=0, perfect=0, bestW=[null,0];
    for(let k=first,g=0;k<=tk&&g<4000;k=addDays(k,1),g++){ const ds=dayStat(k), n=(S.checks[k]||[]).length; if(n>maxDay[1]) maxDay=[k,n];
      if(ds.perfect){ perfect++; run++; bestRun=Math.max(bestRun,run); } else if(k!==tk&&!ds.joker) run=0;
      if(wdK(k)===1&&addDays(k,6)<tk){ let s=0,c=0; for(let i=0;i<7;i++){ const d=dayStat(addDays(k,i)); s+=d.s; c+=d.c; } if(s>=5&&c/s>bestW[1]) bestW=[k,c/s]; } }
    const bm=monthsWithData().map(([y,m])=>[y,m,monthStats(y,m).rate]).sort((a,b)=>b[2]-a[2])[0];
    const dl=k=>{ const [y,m,d]=pk(k); return `${d} ${MONTHS[m].slice(0,3)} ${y}`; };
    const cards=[['🔥','En uzun seri',bs&&bs[1]?`${bs[1]} gün`:'—',bs&&bs[1]?bs[0].name:''],['⭐','Üst üste mükemmel gün',`${bestRun} gün`,`toplam ${perfect} mükemmel gün`],
      ['📅','En iyi hafta',bestW[0]?'%'+fmt(bestW[1]*100):'—',bestW[0]?dl(bestW[0])+' haftası':''],['👑','En iyi ay',bm?'%'+fmt(bm[2]*100):'—',bm?`${MONTHS[bm[1]]} ${bm[0]}`:''],
      ['💥','Bir günde en çok tik',maxDay[0]?String(maxDay[1]):'—',maxDay[0]?dl(maxDay[0]):''],['✅','Tüm zamanlar',fmt(totalTicks()),'toplam tik']];
    return `<div class="records">${cards.map(([e,l,v,s],i)=>`<div class="rec rise" style="--i:${i}"><span class="re">${e}</span><span class="label">${l}</span><b>${esc(v)}</b><span class="sub">${esc(s)}</span></div>`).join('')}</div>`;
  });
}
function yearsHTML(){
  const ys=[...new Set(Object.keys(S.checks).map(k=>+k.slice(0,4)))].sort().slice(-4);
  if(ys.length<2) return `<p class="hint">Birden fazla yıla ait veri olduğunda yıllar burada yan yana karşılaştırılır. Şimdilik yalnızca ${ys[0]||S.year} var.</p>`;
  const cols=['var(--accent)','var(--gold)','var(--good)','var(--danger)'];
  const sum=ys.map(y=>{ const s=yearSummary(y); return {y,s,perfect:yearKeys(y).filter(k=>dayStat(k).perfect).length}; });
  return `<table class="mtable"><thead><tr><th>Yıl</th><th class="r">Tik</th><th class="r">Başarı</th><th class="r">Mükemmel gün</th></tr></thead><tbody>${sum.map((x,i)=>`<tr><td><i class="dot" style="background:${cols[i]}"></i> ${x.y}</td><td class="r"><b>${fmt(x.s.total)}</b></td><td class="r">%${fmt(x.s.rate*100,1)}</td><td class="r">${x.perfect}</td></tr>`).join('')}</tbody></table>
    <div class="ycmp">${MONTHS.map((mn,m)=>`<div class="ycol"><div class="ybars">${sum.map((x,i)=>`<i style="height:${x.s.ms[m].rate*100}%;background:${cols[i]}" data-tip="${mn} ${x.y}: %${fmt(x.s.ms[m].rate*100)}"></i>`).join('')}</div><span>${mn.slice(0,3)}</span></div>`).join('')}</div>`;
}
function insightsExtraHTML(keys){
  return `<div class="card glass rise" style="--i:6;margin:16px 0"><div class="chead"><h3>🏅 Kişisel Rekorlar</h3><button class="btn ghost sm" data-a="friend">🤝 Arkadaşla kıyasla</button></div>${recordsHTML()}</div>
    <div class="igrid">
      <div class="card glass rise" style="--i:7"><div class="chead"><h3>🕐 Saat Haritası</h3><span class="sub">Hangi gün, hangi saatte tik atıyorsun</span></div>${hourHeatHTML(keys)}</div>
      <div class="card glass rise" style="--i:8"><div class="chead"><h3>🧱 Neden Kaçırıyorum?</h3></div>${reasonsHTML(keys)}</div>
    </div>
    <div class="igrid">
      <div class="card glass rise" style="--i:9"><div class="chead"><h3>🔋 Enerji · Stres · Uyku</h3></div>${metricsHTML(keys)}</div>
      <div class="card glass rise" style="--i:10"><div class="chead"><h3>📆 Yıllar Arası</h3></div>${yearsHTML()}</div>
    </div>`;
}
// Bağlı hedef: bu yılki hızla hedefe hangi gün ulaşılır
function goalETA(g){
  if(!g.habitId||!g.target||g.done) return '';
  const now=new Date(), y=S.year; if(y!==now.getFullYear()) return '';
  const c=habitYearCount(g.habitId,y), el=daysBetween(`${y}-01-01`,todayKey())+1; if(!c) return '🔮 Tahmin için biraz veri gerekli';
  const eta=addDays(todayKey(),Math.ceil((g.target-c)/(c/el))), [ey,em,ed]=pk(eta);
  return ey>y?`🔮 Bu hızla bu yıl yetişmez — günde biraz daha sık yapmalısın`:`🔮 Bu hızla ~${ed} ${MONTHS[em]}'de ulaşırsın`;
}

/* ---------- ortak pencere ---------- */
function xDlg(html){ $('#xForm').innerHTML=html; const d=$('#xDlg'); if(!d.open) d.showModal(); }

/* ---------- sıkıştırma ve link kodlama ---------- */
const b64u=u8=>{ let s=''; for(let i=0;i<u8.length;i+=8192) s+=String.fromCharCode(...u8.subarray(i,i+8192)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const unb64u=t=>{ const s=atob(t.replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(s,c=>c.charCodeAt(0)); };
async function packStr(str){ return b64u(new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }
async function unpackStr(t){ return new Response(new Blob([unb64u(t)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); }
function linkDlg(title,desc,url,note){
  xDlg(`<h3>${title}</h3><p class="note">${desc}</p><div class="qrbox" id="qrBox"></div>
    <div class="add-row"><input class="hi-name" id="linkOut" readonly value="${esc(url)}" aria-label="Bağlantı"><button type="button" class="btn" data-a="linkCopy">Kopyala</button>${navigator.share?'<button type="button" class="btn ghost" data-a="linkShare">Paylaş</button>':''}</div>
    ${note?`<p class="hint">${note}</p>`:''}<footer><button class="btn ghost" value="close">Kapat</button></footer>`);
  const c=qrCanvas(url,540); if(c) $('#qrBox').appendChild(c); else $('#qrBox').innerHTML='<p class="hint">Veri QR için çok büyük; bağlantıyı kopyalayıp gönder.</p>';
}

/* ---------- arkadaşla kıyaslama ---------- */
function summaryPayload(){
  const y=S.year, ys=yearSummary(y), x=xpInfo(), hs=active();
  const hr=h=>{ let d=0,p=0; ys.ms.forEach(s=>{ d+=s.ds[h.id]||0; p+=s.poss[h.id]||0; }); return p?Math.round(d/p*100):0; };
  return {v:1,n:profName().slice(0,20),y,t:ys.total,r:Math.round(ys.rate*1000),L:x.L,s:Math.max(0,...hs.map(h=>streaks(h).best)),
    p:yearKeys(y).filter(k=>dayStat(k).perfect).length,m:ys.ms.map(s=>Math.round(s.rate*100)),
    h:hs.map(h=>[h.name.slice(0,24),iconText(h.icon).slice(0,4),hr(h)]).sort((a,b)=>b[2]-a[2]).slice(0,5)};
}
function cleanSummary(o){
  if(!isObj(o)||o.v!==1) return null; const n=(v,a,b)=>clampInt(v,a,b,a);
  return {n:String(o.n||'Arkadaş').slice(0,20),y:n(o.y,1970,3000),t:n(o.t,0,1e7),r:n(o.r,0,1000),L:n(o.L,1,999),s:n(o.s,0,1e5),p:n(o.p,0,400),
    m:Array.isArray(o.m)?o.m.slice(0,12).map(v=>n(v,0,100)):[],h:Array.isArray(o.h)?o.h.slice(0,5).filter(Array.isArray).map(a=>[String(a[0]).slice(0,24),String(a[1]).slice(0,4),n(a[2],0,100)]):[]};
}
async function shareFriend(){
  try{ const url=appBase()+'#cmp='+await packStr(JSON.stringify(summaryPayload()));
    linkDlg('🤝 Arkadaşla kıyasla','Bu bağlantıyı ya da QR kodu arkadaşına gönder. Açtığında senin özetinle kendi verisini yan yana görür.',url,'⚠️ Bağlantı yalnızca özet içerir (profil adın, yıl toplamı, başarı oranları ve ilk 5 alışkanlığının adı) ama bağlantıya sahip herkes görebilir.'); }
  catch(e){ toast('⚠️ Bu tarayıcı sıkıştırmayı desteklemiyor'); }
}
function showFriend(f){
  const me=cleanSummary(summaryPayload()), row=(l,a,b,fmtv=v=>fmt(v))=>`<tr><td>${l}</td><td class="r"><b class="${a>=b?'win':''}">${fmtv(a)}</b></td><td class="r"><b class="${b>a?'win':''}">${fmtv(b)}</b></td></tr>`;
  xDlg(`<span class="eyebrow">Arkadaş kıyası · ${f.y}</span><h3>🤝 ${esc(f.n)} vs ${esc(me.n)}</h3>
    <table class="mtable fr"><thead><tr><th></th><th class="r">${esc(f.n)}</th><th class="r">${esc(me.n)} (sen)</th></tr></thead><tbody>
      ${row('Toplam tik',f.t,me.t)}${row('Başarı oranı',f.r,me.r,v=>'%'+fmt(v/10,1))}${row('Seviye',f.L,me.L)}${row('En uzun seri',f.s,me.s,v=>v+' gün')}${row('Mükemmel gün',f.p,me.p)}</tbody></table>
    <h4>Aylara göre</h4><div class="ycmp">${MONTHS.map((mn,i)=>`<div class="ycol"><div class="ybars"><i style="height:${f.m[i]||0}%;background:var(--gold)" data-tip="${esc(f.n)} · ${mn}: %${f.m[i]||0}"></i><i style="height:${me.m[i]||0}%;background:var(--accent)" data-tip="Sen · ${mn}: %${me.m[i]||0}"></i></div><span>${mn.slice(0,3)}</span></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--gold)"></i>${esc(f.n)}</span><span><i style="background:var(--accent)"></i>Sen</span></div>
    ${f.h.length?`<h4>${esc(f.n)} en iyi alışkanlıkları</h4><ul class="ilist">${f.h.map(([n,e,r])=>`<li>${esc(e)} ${esc(n)} · <b>%${r}</b></li>`).join('')}</ul>`:''}
    <footer><button type="button" class="btn ghost" data-a="friend">Benimkini paylaş</button><button class="btn" value="close">Kapat</button></footer>`);
  if(f.t>me.t) toast(`🔥 ${f.n} önde — yetişme zamanı!`); else { toast('🏆 Öndesin!'); rain(80); }
}

/* ---------- QR ile cihaz aktarımı ---------- */
async function packState(level,src=S){
  const o=JSON.parse(JSON.stringify(src)), ids=o.habits.map(h=>h.id), tk=todayKey();
  delete o.photos; o.vision=[]; o.voice={};
  const keys=[...new Set([...Object.keys(o.checks),...Object.keys(o.vals)])].sort();
  let from=keys[0]||tk; if(level>=3&&addDays(tk,-120)>from) from=addDays(tk,-120);
  const last=keys.length?keys[keys.length-1]:tk, n=keys.length?Math.max(0,daysBetween(from,last)+1):0, days=[];
  for(let i=0,k=from;i<n;i++,k=addDays(k,1)) days.push(k);
  // işaretler: alışkanlık başına gün sayısı kadar bitlik dizi; sayısal değerler gün başına virgüllü dizi
  o.pc={f:from,n,b:ids.map(id=>{ const u=new Uint8Array(Math.ceil(n/8)); days.forEach((k,i)=>{ if((o.checks[k]||[]).includes(id)) u[i>>3]|=1<<(i&7); }); return b64u(u); }),
    v:Object.fromEntries(o.habits.map((h,j)=>[j,h]).filter(([,h])=>h.target).map(([j,h])=>[j,days.map(k=>o.vals[k]?.[h.id]||'').join(',')]))};
  delete o.checks; delete o.vals;
  if(level>=1){ const m=new Map(ids.map((id,j)=>[id,'h'+j.toString(36)])), r=id=>m.get(id)||''; // kısa kimlikler
    o.habits.forEach(h=>{ h.id=r(h.id); h.after=r(h.after); }); o.goals.forEach(g=>{ g.habitId=r(g.habitId); }); o.challenges.forEach(c=>{ c.habitId=r(c.habitId); }); }
  o.habits=o.habits.map(h=>{ const x={}; for(const [f,v] of Object.entries(h)) if(v&&!(Array.isArray(v)&&!v.length)&&!(f==='days'&&v.length===7)) x[f]=v; if(!h.days.length) x.days=[]; return x; }); // varsayılanlar validate'te geri gelir
  const cut=x=>{ for(const kk of Object.keys(x)) if(kk<from) delete x[kk]; };
  if(level>=3){ cut(o.notes); cut(o.times); cut(o.subd); cut(o.reasons); }
  if(level>=1){ o.times={}; o.subd={}; o.reasons={}; }
  if(level>=2){ const nd=o.notes; o.pn=[days.map(k=>nd[k]?.mood||0).join(''),'','',''];
    for(const kk of Object.keys(nd)) if(kk>=from&&kk<=last) delete nd[kk]; else nd[kk]={mood:nd[kk].mood}; o.letters=[]; o.quotes={}; o.goals=o.goals.map(g=>({text:g.text,done:g.done,habitId:g.habitId,target:g.target})); }
  return packStr(JSON.stringify(o));
}
function unpackState(o){
  if(!isObj(o)||!Array.isArray(o.habits)||!isObj(o.pc)||!DK.test(o.pc.f||'')||!Array.isArray(o.pc.b)) return null;
  const ids=o.habits.map(h=>h&&h.id), n=clampInt(o.pc.n,0,5000,0), days=[...Array(n)].map((_,i)=>addDays(o.pc.f,i)), checks={}, vals={};
  o.pc.b.forEach((s,j)=>{ if(!ids[j]||typeof s!=='string') return; const u=unb64u(s); days.forEach((k,i)=>{ if(u[i>>3]>>(i&7)&1) (checks[k]=checks[k]||[]).push(ids[j]); }); });
  if(isObj(o.pc.v)) for(const [j,str] of Object.entries(o.pc.v)) if(ids[j]&&typeof str==='string') str.split(',').forEach((v,i)=>{ if(v&&days[i]) (vals[days[i]]=vals[days[i]]||{})[ids[j]]=+v; });
  if(Array.isArray(o.pn)&&o.pn.length===4){ o.notes=isObj(o.notes)?o.notes:{}; days.forEach((k,i)=>{ const m=+o.pn[0][i]||0, e=+o.pn[1][i]||0, st=+o.pn[2][i]||0, sl=parseInt(String(o.pn[3]).slice(i*2,i*2+2),36)/2||0;
    if(m||e||st||sl) o.notes[k]={mood:m,energy:e,stress:st,sleep:sl,text:''}; }); }
  o.checks=checks; o.vals=vals; return validate(o);
}
async function shareTransfer(){
  try{
    const notes=['tüm veriler (fotoğraf ve sesler hariç)','saat kayıtları ve kaçırma sebepleri çıkarıldı','not metinleri, enerji-stres-uyku ve mektuplar çıkarıldı','yalnızca son 120 gün'];
    let lv=0, d=await packState(0); while(d.length>2880&&lv<3){ lv++; d=await packState(lv); }
    if(d.length>2880){ toast('⚠️ Veri QR için çok büyük — JSON yedeği ile aktar'); return; }
    linkDlg('📲 QR ile başka cihaza aktar','Diğer telefonun kamerasıyla QR kodu okut; açılan sayfada “Yeni profil olarak ekle”yi seç.',appBase()+'#imp='+d,`İçerik: ${notes.slice(0,lv+1).join(' · ')}. ⚠️ Bağlantı verilerinin kendisini içerir; kimseyle paylaşma.`);
    $('#menuDlg').open&&$('#menuDlg').close();
  }catch(e){ toast('⚠️ Bu tarayıcı sıkıştırmayı desteklemiyor'); }
}
let pendingImp=null;
async function handleHash(){
  const h=location.hash, m=/^#(cmp|imp)=([A-Za-z0-9_-]+)$/.exec(h); if(!m) return;
  history.replaceState(null,'',location.pathname+location.search);
  try{ const o=JSON.parse(await unpackStr(m[2]));
    if(m[1]==='cmp'){ const f=cleanSummary(o); if(!f) throw 0; showFriend(f); return; }
    const s=unpackState(o); if(!s) throw 0; pendingImp=s;
    xDlg(`<h3>📲 Aktarılan veri</h3><p class="note">${s.habits.length} alışkanlık · ${Object.keys(s.checks).length} gün işaret · ${s.goals.length} hedef</p>
      <p class="hint">Yeni profil olarak eklemek mevcut verine dokunmaz. “Yerine yaz” bu profildeki her şeyi değiştirir (Ctrl+Z ile geri alınabilir).</p>
      <footer><button type="button" class="btn ghost" data-a="impReplace">Bu profilin yerine yaz</button><button type="button" class="btn" data-a="impNew">＋ Yeni profil olarak ekle</button></footer>`);
  }catch(e){ toast('⚠️ Bağlantıdaki veri okunamadı'); }
}
addEventListener('hashchange',handleHash);

/* ---------- otomatik yedek ---------- */
const canDir=()=>'showDirectoryPicker' in window;
async function backupNow(silent){
  const dir=await IDB.get('backupDir').catch(()=>null); if(!dir) return false;
  let perm=await dir.queryPermission({mode:'readwrite'});
  if(perm!=='granted'&&!silent) perm=await dir.requestPermission({mode:'readwrite'});
  if(perm!=='granted'){ if(silent&&S.lastBackup!==todayKey()) toast('📁 Otomatik yedek için Ayarlar → Yedek bölümünden izin ver'); return false; }
  flush(); const tk=todayKey(), f=await dir.getFileHandle(`aliskanlik-${profName().replace(/[^\wğüşıöçĞÜŞİÖÇ-]+/g,'_')}-${tk}.json`,{create:true}), w=await f.createWritable();
  await w.write(JSON.stringify(S)); await w.close(); S.lastBackup=tk; save(); return true;
}
async function autoBackup(){
  const tk=todayKey(); if(S.lastBackup===tk) return;
  if(canDir()&&await IDB.get('backupDir').catch(()=>null)){ try{ if(await backupNow(true)) toast('💾 Otomatik yedek alındı'); }catch(e){} return; }
  if(!S.lastBackup){ S.lastBackup=tk; save(); return; } // ilk açılışta sayaç başlar
  if(S.settings.backupRemind&&daysBetween(S.lastBackup,tk)>=7) $('#bkChip').classList.add('show');
}
function backupHTML(){
  return `<h4>💾 Yedek</h4>${canDir()?`<div class="toggle">📁 Otomatik yedek klasörü<span style="display:flex;gap:6px"><button type="button" class="btn ghost sm" data-a="bkPick">Klasör seç</button><button type="button" class="btn ghost sm" data-a="bkNow">Şimdi yedekle</button></span></div>
    <p class="note">Klasör seçersen uygulama her gün açıldığında oraya JSON yedeği yazar. Son yedek: <b>${S.lastBackup||'hiç'}</b> <span id="bkDir"></span></p>`:''}
    <label class="toggle">🔔 7 gün yedek alınmazsa hatırlat<input type="checkbox" data-s="backupRemind"${S.settings.backupRemind?' checked':''}></label>`;
}
function vacationHTML(){
  const tk=todayKey();
  return `<h4>🏝️ Tatil / Hasta modu</h4><p class="note">Seçtiğin aralıktaki günler oranları düşürmez, serileri bozmaz.</p>
    <div class="vlist">${S.vacations.map(v=>`<div class="prow" data-id="${esc(v.id)}"><span class="pav">${esc(v.name.split(' ')[0]||'🏝️')}</span><span style="flex:1">${esc(v.name)} · ${v.from} → ${v.to}</span><button type="button" class="mini-btn del" data-a="vacDel" aria-label="Kaldır">🗑</button></div>`).join('')}</div>
    <div class="add-row vac-add"><select id="vacType" aria-label="Tür"><option>🏝️ Tatil</option><option>🤒 Hasta</option><option>✈️ Seyahat</option><option>🧘 Dinlenme</option></select><input type="date" id="vacFrom" value="${tk}" aria-label="Başlangıç"><input type="date" id="vacTo" value="${addDays(tk,6)}" aria-label="Bitiş"><button type="button" class="btn" data-a="vacAdd">Ekle</button></div>`;
}

/* ---------- eylemler ---------- */
const XA={
  petPat:el=>{ const e=el.querySelector('.pet-e'); if(e){ e.classList.remove('jump'); void e.offsetWidth; e.classList.add('jump'); } const r=el.getBoundingClientRect(); burst(r.left+r.width/2,r.top+20,10,330); sfx('pop',3); floatText(r.left+r.width/2,r.top,'💕'); },
  petType:el=>{ S.pet.type=el.dataset.t; save(); render(); },
  avSet:el=>{ S.avatar[el.dataset.f]=el.dataset.v; save(); render(); sfx('tick'); },
  chTpl:el=>{ const [name,icon,days,hn]=CH_TPL[+el.dataset.i], h=findOrCreateHabit(hn,icon); if(h.archived) h.archived=false; startChallenge(name,icon,h.id,days); },
  chDel:el=>{ if(!arm(el,'Sil?')) return; const id=el.closest('.ccard').dataset.id, before=JSON.stringify(S); S.challenges=S.challenges.filter(c=>c.id!==id); pushUndo('Meydan okuma silindi',[{full:before}]); rev++; save(); render(); },
  chRestart:el=>{ const c=S.challenges.find(x=>x.id===el.closest('.ccard').dataset.id); c.start=todayKey(); rev++; save(); render(); toast('↻ Yeniden başladı — bu sefer olacak! 💪'); },
  noise:()=>nextNoise(),
  focus:()=>openFocus(null), routine:el=>openFocus(el.dataset.slot), focusClose:()=>closeFocus(),
  fdone:el=>{ changeHabit(FQ.k,hab(el.dataset.h),'on',el); },
  finc:el=>{ changeHabit(FQ.k,hab(el.dataset.h),'inc',el); },
  fskip:el=>{ FQ.skip.push(el.dataset.h); if(FQ.ids.every(id=>isOn(FQ.k,id)||FQ.skip.includes(id))) FQ.skip=[]; renderFocus(); },
  fsub:el=>subToggle(FQ.k,el),
  tsub:el=>subToggle(todayKey(),el),
  breath:()=>openBreath(), breathClose:()=>closeBreath(), brStart:()=>brStart(),
  brPat:el=>{ if(BR.run) return; BR.pat=+el.dataset.i; $$('#brPat button').forEach(b=>b.classList.toggle('on',b===el)); },
  brDur:el=>{ if(BR.run) return; BR.min=+el.dataset.m; $$('#brDur button').forEach(b=>b.classList.toggle('on',b===el)); },
  brMark:el=>{ changeHabit(todayKey(),hab(el.dataset.h),'on',el); el.replaceWith(document.createTextNode('✓ İşaretlendi')); },
  voiceRec:()=>voiceRec(), voicePlay:el=>voicePlay(el.dataset.k),
  voiceDel:()=>{ IDB.del(vKey(dayK)).catch(()=>{}); delete S.voice[dayK]; onData([dayK]); },
  pix:el=>{ pixMetric=el.dataset.m; $$('[data-a="pix"]').forEach(b=>b.classList.toggle('on',b===el)); $('#pixBox').innerHTML=pixelsHTML(S.year); el.closest('.card').querySelector('.hint').textContent=PIX.find(p=>p[0]===pixMetric)[1]+' · bir kareye dokun: o günü aç'; },
  letterRead:el=>openLetter(S.letters.find(l=>l.id===el.closest('.letter').dataset.id)),
  letterDel:el=>{ if(!arm(el,'Sil?')) return; S.letters=S.letters.filter(l=>l.id!==el.closest('.letter').dataset.id); save(); render(); },
  visDel:el=>{ S.vision=S.vision.filter(v=>v.id!==el.closest('.vcard').dataset.id); save(); render(); },
  friend:()=>shareFriend(), qrOut:()=>shareTransfer(),
  linkCopy:()=>{ const i=$('#linkOut'); i.select(); navigator.clipboard?.writeText(i.value).then(()=>toast('📋 Kopyalandı'),()=>{ document.execCommand('copy'); toast('📋 Kopyalandı'); }); },
  linkShare:()=>navigator.share({title:'Alışkanlık Takvimi',url:$('#linkOut').value}).catch(()=>{}),
  impNew:()=>{ if(!pendingImp) return; const id=uid(); try{ localStorage.setItem(dataKey(id),JSON.stringify(pendingImp)); }catch(e){ toast('⚠️ Depolama dolu'); return; }
    P.list.push({id,name:'Aktarılan '+(P.list.length+1)}); savePK(); pendingImp=null; $('#xDlg').close(); switchProfile(id); },
  impReplace:el=>{ if(!pendingImp||!arm(el,'Emin misin? Tekrar dokun')) return; const before=JSON.stringify(S); S=pendingImp; pendingImp=null; pushUndo('Aktarılan veri yüklendi',[{full:before}]); rev++; flush(); $('#xDlg').close(); applyTheme(); render(); updXP(); toast('📲 Veri aktarıldı'); },
  bkPick:async()=>{ try{ const d=await showDirectoryPicker({mode:'readwrite',id:'aliskanlik'}); await IDB.set('backupDir',d); if(await backupNow(false)) toast(`💾 "${d.name}" klasörüne yedek alındı`); renderSettings(); }catch(e){ if(e.name!=='AbortError') toast('⚠️ Klasör seçilemedi'); } },
  bkNow:async()=>{ try{ if(await backupNow(false)){ toast('💾 Yedek alındı'); renderSettings(); } else toast('Önce bir klasör seç'); }catch(e){ toast('⚠️ Yedeklenemedi: '+e.message); } },
  bkLater:()=>$('#bkChip').classList.remove('show'),
  vacAdd:()=>{ const f=$('#vacFrom').value, t=$('#vacTo').value; if(!DK.test(f)||!DK.test(t)||f>t){ toast('Tarih aralığı geçersiz'); return; }
    S.vacations.push({id:uid(),from:f,to:t,name:$('#vacType').value}); rev++; save(); renderSettings(); render(); toast('🏝️ Tatil modu eklendi — iyi dinlenmeler!'); },
  vacDel:el=>{ S.vacations=S.vacations.filter(v=>v.id!==el.closest('.prow').dataset.id); rev++; save(); renderSettings(); render(); },
  trialKeep:el=>{ const h=hab(el.dataset.id); h.trial=0; h.tstart=''; save(); render(); rain(100); toast(`💪 ${h.name} artık kalıcı alışkanlığın!`); },
  trialDrop:el=>{ const h=hab(el.dataset.id); h.trial=0; h.tstart=''; h.archived=true; rev++; save(); render(); toast(`📦 ${h.name} arşivlendi — denediğin için tebrikler`); },
  metric:el=>{ const n=noteOf(dayK), f=el.dataset.f, v=+el.dataset.v; n[f]=n[f]===v?0:v; cleanNote(dayK); onData([dayK]); sfx('tick'); },
};
function subToggle(k,el){
  const h=hab(el.dataset.h), i=+el.dataset.i, snap=snapDay(k), was=isOn(k,h.id);
  setSub(k,h,i,!subsOf(k,h.id).includes(i)); pushUndo(`${h.name}: adım`,[snap]); onData([k]);
  if(isOn(k,h.id)&&!was) fxTick(k,h,true,false,false,el); else sfx('tick');
}

/* ---------- olay dinleyicileri ---------- */
$('#view').addEventListener('input',e=>{
  if(e.target.id==='jSearch'){ jQuery=e.target.value; $('#jList').innerHTML=journalEntries(); }
  if(e.target.id==='baR') $('#ba').style.setProperty('--x',e.target.value+'%');
  if(e.target.dataset.pet==='name'){ const v=e.target.value.trim(); if(v){ S.pet.name=v.slice(0,20); save(); } }
});
$('#view').addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='baA') $('#baImgA').src=S.photos[t.value]; if(t.id==='baB') $('#baImgB').src=S.photos[t.value];
  if(t.id==='visIn'&&t.files[0]){ if(S.vision.length>=12) return; try{ const img=await resizeImage(t.files[0],420); S.vision.push({id:uid(),img,text:($('#visTxt').value||'').trim().slice(0,80)}); save(); render(); sfx('ding'); }catch(err){ toast('⚠️ '+err.message); } }
});
document.addEventListener('submit',e=>{
  if(e.target.id==='letterForm'){ e.preventDefault(); const t=$('#letterTxt').value.trim(), d=$('#letterDate').value;
    if(!t){ shake($('#letterTxt')); return; } if(!DK.test(d)||d<=todayKey()){ toast('Açılış tarihi gelecekte olmalı'); return; }
    S.letters.push({id:uid(),text:t.slice(0,2000),open:d,created:todayKey(),seen:false}); save(); render(); sfx('win'); toast(`✉️ Mektup mühürlendi — ${d} tarihinde açılacak`); }
  if(e.target.id==='chForm'){ e.preventDefault(); const h=hab($('#chHabit').value), d=clampInt($('#chDays').value,3,365,21); if(h) startChallenge(`${d} Gün ${h.name}`,iconText(h.icon),h.id,d); }
});
$('#dayForm').addEventListener('input',e=>{
  const t=e.target; if(!dayK) return;
  if(t.dataset.grat!=null){ const n=noteOf(dayK), g=[...(n.grat||[])]; while(g.length<3) g.push(''); g[+t.dataset.grat]=t.value.slice(0,120); n.grat=g.some(Boolean)?g:[]; cleanNote(dayK); rev++; save(); }
  if(t.id==='daySleep'){ const n=noteOf(dayK), v=parseFloat(t.value); n.sleep=Number.isFinite(v)?Math.max(0,Math.min(16,Math.round(v*2)/2)):0; cleanNote(dayK); rev++; save(); }
});
$('#dayForm').addEventListener('change',e=>{
  const id=e.target.dataset.reason; if(!id||!dayK) return;
  if(e.target.value) (S.reasons[dayK]=S.reasons[dayK]||{})[id]=e.target.value; else if(S.reasons[dayK]){ delete S.reasons[dayK][id]; if(!Object.keys(S.reasons[dayK]).length) delete S.reasons[dayK]; }
  rev++; save();
});
$('#focus').addEventListener('keydown',e=>{ if(e.key==='Escape') closeFocus(); });

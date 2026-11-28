'use strict';
/* ===== Yeni kullanıcı: kurulum sihirbazı ve "ilk adımlar" rehberi ===== */
const SUGG=(()=>{ const seen=new Set(), out=[];
  for(const [name,icon,o] of [...DEFAULT_HABITS,...Object.values(TEMPLATES).flat()]){ const k=name.toLocaleLowerCase('tr'); if(seen.has(k)) continue; seen.add(k); out.push({name,icon,o:o||{}}); }
  return out; })();
let WZ=null;
function maybeOnboard(){ if(!S.onboarded) openWelcome(); else closeWelcome(); }
function openWelcome(){
  if(WZ) return;
  WZ={step:0,name:profName()==='Ben'?'':profName(),sel:new Map(),pet:S.pet.type,petName:S.pet.name,rem:''};
  $('#welcome').classList.add('show'); document.body.classList.add('wz-open'); renderWelcome();
}
function closeWelcome(){ WZ=null; $('#welcome').classList.remove('show'); document.body.classList.remove('wz-open'); }
const wzNextLabel=()=>WZ.sel.size?`${WZ.sel.size} alışkanlıkla devam →`:'Şimdilik atla →';
function renderWelcome(){
  const st=WZ.step; let body='';
  if(st===0) body=`<div class="wz-logo">◆</div><h2>Hoş geldin 👋</h2><p class="sub">Alışkanlıklarını her gün tek dokunuşla işaretle, seviye atla, gelişimini gör.</p>
    <div class="wz-feats"><div><span>✅</span><b>Takip et</b><small>Her gün tek dokunuşla</small></div><div><span>🎮</span><b>Seviye atla</b><small>XP, görevler, evcil dost</small></div><div><span>📈</span><b>Gelişimini gör</b><small>Grafikler ve içgörüler</small></div></div>
    <label class="wz-field">Sana nasıl seslenelim?<input id="wzName" maxlength="24" placeholder="Adın" value="${esc(WZ.name)}" autocomplete="given-name"></label>
    <div class="wz-btns"><button class="btn ghost" data-a="wzDemo">Önce örnek verilerle keşfet</button><button class="btn big-btn" data-a="wzNext">Başlayalım →</button></div>
    <p class="hint">☁️ Verilerin hesabına otomatik yedeklenir.</p>`;
  else if(st===1) body=`<h2>Neleri takip edelim?</h2><p class="sub">Dokunarak seç ya da kendininkini yaz. Sonra istediğin zaman değiştirebilirsin.</p>
    <div class="wz-packs"><span class="label">Hazır paketler</span>${Object.keys(TEMPLATES).map(t=>`<button class="chip" data-a="wzPack" data-t="${esc(t)}">＋ ${esc(t)}</button>`).join('')}</div>
    <div class="wz-sugg">${SUGG.map((s,i)=>`<button class="wz-h${WZ.sel.has(s.name)?' on':''}" data-a="wzToggle" data-i="${i}" aria-pressed="${WZ.sel.has(s.name)}"><span>${esc(s.icon)}</span>${esc(s.name)}</button>`).join('')}${[...WZ.sel.keys()].filter(n=>!SUGG.some(s=>s.name===n)).map(n=>`<button class="wz-h on" data-a="wzRm" data-n="${esc(n)}" aria-pressed="true"><span>${esc(WZ.sel.get(n).icon)}</span>${esc(n)} ✕</button>`).join('')}</div>
    <div class="add-row"><input id="wzNew" class="hi-name" maxlength="60" placeholder="Kendi alışkanlığını yaz…" aria-label="Kendi alışkanlığın"><button class="btn" data-a="wzAdd">Ekle</button></div>
    <div class="wz-btns"><button class="btn ghost" data-a="wzBack">← Geri</button><button class="btn big-btn" data-a="wzNext" id="wzGo">${wzNextLabel()}</button></div>`;
  else body=`<h2>Son dokunuş ✨</h2><p class="sub">Alışkanlıklarını yaptıkça büyüyecek bir dost seç. Şimdilik bir yumurta 🥚</p>
    <div class="wz-pets">${PETS.map(([t,e,n])=>`<button class="wz-pet${WZ.pet===t?' on':''}" data-a="wzPet" data-t="${t}" aria-pressed="${WZ.pet===t}"><span>${e}</span>${n}</button>`).join('')}</div>
    <label class="wz-field">Dostunun adı<input id="wzPetName" maxlength="20" value="${esc(WZ.petName)}"></label>
    <label class="wz-field">⏰ Günlük hatırlatma saati <small>(isteğe bağlı, uygulama açıkken)</small><input type="time" id="wzRem" value="${WZ.rem}"></label>
    <div class="wz-btns"><button class="btn ghost" data-a="wzBack">← Geri</button><button class="btn big-btn" data-a="wzFinish">Hadi başlayalım! 🚀</button></div>`;
  $('#welcome').innerHTML=`<div class="wz-in"><div class="wz-dots">${[0,1,2].map(i=>`<i class="${i===st?'cur':i<st?'on':''}"></i>`).join('')}</div><div class="wz-body">${body}</div></div>`;
  const f=$('#welcome input'); if(f&&st!==1) f.focus();
}
function wzSave(){ // adımlar arasında yazılanları koru
  const n=$('#wzName'), pn=$('#wzPetName'), r=$('#wzRem');
  if(n) WZ.name=n.value.trim(); if(pn) WZ.petName=pn.value.trim(); if(r) WZ.rem=r.value;
}
function finishWelcome(){
  wzSave();
  S.habits=[...WZ.sel.entries()].map(([name,{icon,o}],i)=>normHabit({...o,id:uid(),name,icon,hue:HUES[i%HUES.length],created:todayKey()},i));
  S.pet={name:(WZ.petName||'Pofuduk').slice(0,20),type:WZ.pet};
  if(/^\d\d:\d\d$/.test(WZ.rem)){ S.settings.reminder=WZ.rem; if('Notification' in window&&Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }
  if(WZ.name){ const p=P.list.find(x=>x.id===P.active); if(p){ p.name=WZ.name.slice(0,24); savePK(); $('#profName').textContent='👤 '+profName(); } }
  const nm=WZ.name; S.onboarded=true; S.year=new Date().getFullYear(); rev++; flush(); closeWelcome();
  view=new Date().getMonth(); render(); updXP(false); checkQuests();
  setTimeout(()=>{ rain(); sfx('win'); toast(`🎉 Hoş geldin${nm?', '+nm:''}! ${S.habits.length?'İlk tikini atmaya hazırsın':'Sağ üstteki ＋ ile alışkanlık ekleyebilirsin'}`); },250);
}

/* ilk adımlar rehberi */
function tourItems(){
  return [['✅','İlk tikini at','Bir alışkanlık kartına dokun',totalTicks()>=1],
    ['📝','Güne not veya ruh hâli ekle','“📝 Not / ruh hâli” düğmesi',Object.values(S.notes).some(n=>n.mood||n.text)],
    ['🎯','Bir yıllık hedef koy','📊 Yıllık Özet → Hedeflerim',S.goals.length>=1],
    ['🐾','Evcil dostunla tanış','🏆 Ödüller sekmesi',S.tour.rw]];
}
function tourHTML(){
  if(S.tour.done||!S.onboarded) return '';
  const it=tourItems(), n=it.filter(x=>x[3]).length, all=n===it.length; tourDone=all;
  return `<div class="tour glass rise" id="tour" style="--i:1"><div class="chead"><h3>${all?'🎉 Hazırsın!':'🚀 İlk adımlar'}</h3><span class="sub">${n}/${it.length}</span><span style="flex:1"></span><button class="icon-btn sm" data-a="tourClose" aria-label="Rehberi kapat">✕</button></div>
    <div class="lvl-bar"><i style="width:${n/it.length*100}%"></i></div>
    ${all?'<p class="sub">Temelleri öğrendin. Her gün küçük bir adım — gerisi alışkanlık olur. 💪</p><button class="btn sm" data-a="tourClose">Rehberi kapat</button>'
      :`<ul class="tour-list">${it.map(([e,t,h,ok])=>`<li class="${ok?'ok':''}"><span class="tchk">${ok?'✓':e}</span><div><b>${t}</b><small>${h}</small></div></li>`).join('')}</ul>
      <p class="hint">📲 İpucu: telefonda tarayıcı menüsünden “Ana ekrana ekle” ile uygulama gibi kullanabilirsin.</p>`}</div>`;
}
let tourDone=null;
function updTour(){
  const el=$('#tour'); if(!el) return;
  const n=tourItems().filter(x=>x[3]).length, all=n===tourItems().length;
  if(tourDone===false&&all){ rain(); sfx('win'); toast('🎉 İlk adımları tamamladın!'); }
  const t=document.createElement('div'); t.innerHTML=tourHTML(); if(t.firstElementChild){ t.firstElementChild.classList.remove('rise'); el.replaceWith(t.firstElementChild); }
}

/* eylemler */
const WA={
  wzNext:()=>{ wzSave(); WZ.step++; renderWelcome(); },
  wzBack:()=>{ wzSave(); WZ.step--; renderWelcome(); },
  wzToggle:el=>{ const s=SUGG[+el.dataset.i]; if(WZ.sel.has(s.name)) WZ.sel.delete(s.name); else { WZ.sel.set(s.name,{icon:s.icon,o:s.o}); sfx('tick'); }
    el.classList.toggle('on',WZ.sel.has(s.name)); el.setAttribute('aria-pressed',WZ.sel.has(s.name)); $('#wzGo').textContent=wzNextLabel(); },
  wzPack:el=>{ TEMPLATES[el.dataset.t].forEach(([name,icon,o])=>WZ.sel.set(name,{icon,o:o||{}})); sfx('pop',3); renderWelcome(); },
  wzAdd:()=>{ const i=$('#wzNew'), v=i.value.trim(); if(!v){ shake(i); return; } WZ.sel.set(v.slice(0,60),{icon:'✨',o:{}}); renderWelcome(); $('#wzNew').focus(); sfx('pop'); },
  wzRm:el=>{ WZ.sel.delete(el.dataset.n); renderWelcome(); },
  wzPet:el=>{ wzSave(); WZ.pet=el.dataset.t; renderWelcome(); sfx('tick'); },
  wzFinish:()=>finishWelcome(),
  wzDemo:()=>{ const id=uid(); try{ localStorage.setItem(dataKey(id),JSON.stringify(sampleState())); }catch(e){ toast('⚠️ Tarayıcı depolaması kapalı'); return; }
    P.list.push({id,name:'Demo 🧪'}); savePK(); switchProfile(id);
    setTimeout(()=>toast('🧪 Demo profilindesin · kendi profiline ⚙️ → Profiller bölümünden dönebilirsin'),600); },
  tourClose:()=>{ S.tour.done=true; save(); const el=$('#tour'); if(el) el.animate([{opacity:1},{opacity:0,transform:'translateY(-6px)'}],{duration:dur(250)}).finished.then(()=>el.remove()); },
};
$('#welcome').addEventListener('keydown',e=>{
  if(e.key!=='Enter') return;
  if(e.target.id==='wzNew'){ e.preventDefault(); WA.wzAdd(); } else if(e.target.id==='wzName'){ e.preventDefault(); WA.wzNext(); }
});

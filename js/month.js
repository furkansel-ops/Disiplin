'use strict';
/* ===== Ay görünümü: tablo / takvim / bugün, boss, gün penceresi ===== */
let alertDismissed=false;
const ringSVG=(attr='')=>`<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fg" ${attr} cx="32" cy="32" r="26"/></svg>`;
const EMPTY='<div class="empty"><p>Henüz alışkanlık yok. Takibe başlamak için ilkini ekle ya da hazır bir paket seç.</p><button class="btn" data-a="habits">＋ İlk alışkanlığını ekle</button></div>';

function forgotten(){
  const tk=todayKey(), first=firstDataKey(), out=[];
  for(const h of active()){
    let k=addDays(tk,-1), miss=0;
    for(let i=0;i<60&&k>=first;i++,k=addDays(k,-1)){ if(!schedK(h,k)||S.freezes[k]) continue; if(isOn(k,h.id)) break; miss++; }
    if(miss>=4) out.push([h,miss]);
  }
  return out.sort((a,b)=>b[1]-a[1]).slice(0,3);
}
const flameT=c=>c>=100?4:c>=30?3:c>=7?2:c>=2?1:0;
const trialEnd=h=>addDays(h.tstart,h.trial);
const trialsDue=()=>active().filter(h=>h.trial&&h.tstart&&trialEnd(h)<=todayKey());
function trialRate(h){ let s=0,c=0; for(let k=h.tstart,i=0;i<h.trial;i++,k=addDays(k,1)){ if(k>=todayKey()) break; if(schedK(h,k)){ s++; if(isOn(k,h.id)) c++; } } return s?c/s:0; }
function renderMonth(){
  const y=S.year, m=view, now=new Date(), isCur=now.getFullYear()===y&&now.getMonth()===m, mode=S.settings.view, b=bossOf(y,m);
  if(b.dead) S.bosses[`${y}-${m}`]=1; // önceden yenilmiş boss tekrar kutlanmasın
  const fg=isCur&&!alertDismissed?forgotten():[], tr=isCur?trialsDue():[];
  $('#view').innerHTML=`<section>
    <div class="mhead">
      <div class="rise"><span class="eyebrow">${y}${isCur?' · Bu ay':''}</span><h2>${MONTHS[m]}</h2></div>
      <div class="stats">
        <div class="stat glass rise" style="--i:1"><span class="label">Alışkanlık Sayısı</span><b class="big" id="stN">0</b><span class="sub">aktif alışkanlık</span></div>
        <div class="stat glass rise" style="--i:2"><span class="label">Tamamlanan Alışkanlık</span><b class="big" id="stTicks">0</b><span class="sub">/ <span id="stMax">0</span> planlı tik</span></div>
        <div class="stat glass rise ring-stat" style="--i:3">${ringSVG('id="ring"')}<div><span class="label">Bu Ay Tamamlanan</span><b class="big" id="stRate">%0</b><span class="sub" id="stSoFar"></span></div></div>
      </div>
    </div>
    ${fg.length?`<div class="alerts rise">💡 <b>Biraz ihmal edildi:</b>${fg.map(([h,n])=>`<button class="chip" data-a="detail" data-id="${esc(h.id)}">${iconHTML(h.icon)} ${esc(h.name)} · ${n} gündür boş</button>`).join('')}<span style="flex:1"></span><button class="icon-btn sm" data-a="dismissAlert" aria-label="Uyarıyı kapat">✕</button></div>`:''}
    ${tr.map(h=>{ const st=trialRate(h); return `<div class="alerts rise trial">🧪 <b>${esc(h.name)}</b> denemesi bitti: ${h.trial} günde %${fmt(st*100)} başarı. Devam mı?<span style="flex:1"></span><button class="btn sm" data-a="trialKeep" data-id="${esc(h.id)}">💪 Devam et</button><button class="btn ghost sm" data-a="trialDrop" data-id="${esc(h.id)}">📦 Bırak (arşivle)</button></div>`; }).join('')}
    ${isCur?tourHTML():''}
    <div class="boss glass rise${b.dead?' dead':''}" style="--i:2" id="boss"><span class="boss-e" id="bossE">${b.e}</span>
      <div><span class="label">Ayın Boss'u · her tik 1 hasar · yenince +200 XP</span><b id="bossName">${b.name}${b.dead?' — YENİLDİ ✓':''}</b><div class="hp"><i id="bossHp"></i></div><span class="sub" id="bossTxt"></span></div></div>
    <div class="toolbar rise" style="--i:3">
      <div class="seg" role="group" aria-label="Görünüm">${[['table','▦ Tablo'],['cal','🗓️ Takvim'],['today','⚡ Bugün']].map(([v,l])=>`<button data-a="vmode" data-v="${v}" class="${mode===v?'on':''}">${l}</button>`).join('')}</div>
      ${mode==='table'?`<div class="chips">${[['','Tümü'],...CATS].map(([c,l])=>`<button class="chip${S.settings.cat===c?' on':''}" data-a="cat" data-c="${c}">${l}</button>`).join('')}</div>`:''}
      <span class="sp"></span><button class="btn ghost sm" data-a="share">📸 Paylaş</button><button class="btn ghost sm" data-a="print">🖨️ Yazdır</button>
    </div>
    <div class="grid-card rise" style="--i:3" id="mbody"></div>
    <div class="lower">
      <div class="card glass rise" style="--i:4"><h3>Performans Liderleri 🏆</h3>
        <div class="lb-head"><span>#</span><span>Alışkanlık · geçen aya göre</span><span class="r">Puan</span><span class="gcol">Grafik</span><span class="r">Başarı %</span></div>
        <ol class="lb" id="lb"></ol></div>
      <figure class="quote glass rise" style="--i:5" id="quote">${quoteInner()}</figure>
    </div>
    <div id="collage"></div>
  </section>`;
  renderMonthBody(true); renderCollage();
  later(()=>{ refreshMonth(); updBoss(false); });
}
function renderMonthBody(intro){
  const box=$('#mbody'); if(!box) return;
  if(!active().length){ box.innerHTML=EMPTY; return; }
  const mode=S.settings.view;
  box.innerHTML=mode==='cal'?calHTML(intro):mode==='today'?todayHTML(intro):tableHTML(intro);
  if(mode==='table'&&intro){
    setTimeout(()=>$('.grid')?.classList.remove('intro'),1600);
    const t=$('.dnum.today'), sc=$('.grid-scroll');
    if(t&&sc) setTimeout(()=>sc.scrollTo({left:Math.max(0,t.offsetLeft-sc.clientWidth+t.offsetWidth*4+20),behavior:RM.matches?'auto':'smooth'}),350);
  }
}

/* --- tablo --- */
function cellHTML(h,k,d,r,tk){
  const on=isOn(k,h.id), num=h.target>0, v=num?valOf(k,h.id):0, T=tgtK(h,k);
  return `<button class="cell${on?' on':''}${schedK(h,k)?'':' off'}${k===tk?' today':''}${num?' num':''}" data-a="cell" data-k="${k}" data-h="${esc(h.id)}" style="--h:${h.hue};--r:${r};--c:${d};--f:${num?Math.min(1,v/T):0}" aria-pressed="${on}" aria-label="${esc(h.name)}, ${d} ${MONTHS[view]}${num?`, ${v}/${T}`:''}"${k>tk?' disabled':''}>${num?`<span class="nv">${v&&!on?fmt(v):''}</span>`:''}${CHECK}</button>`;
}
function noteBtn(k,d,tk){
  const n=S.notes[k], has=n&&(n.mood||n.text), ph=!!S.photos[k];
  return `<button class="dnote${has?' has':''}${ph?' ph':''}" data-a="day" data-k="${k}" data-tip="${d} ${MONTHS[view]}: ${has?(n.mood?MOODN[n.mood-1]:'')+(n.text?' · '+esc(n.text.slice(0,40)):''):'Not, ruh hâli, fotoğraf ekle'}"${k>tk?' disabled':''}>${n&&n.mood?MOODS[n.mood-1]:has?'📝':'＋'}</button>`;
}
function tableHTML(intro){
  const y=S.year, m=view, days=dim(y,m), tk=todayKey(), hs=active().filter(h=>!S.settings.cat||h.cat===S.settings.cat);
  let g='<div class="corner sticky" style="grid-row:1/span 3">Alışkanlıklar</div>';
  weeks(y,m).forEach(w=>{ g+=`<div class="wk${w.w%2?' alt':''}" style="grid-row:1;grid-column:${w.start+1}/span ${w.len}">${w.len>=3?`${w.w+1}. HAFTA`:`${w.w+1}.H`}</div>`; });
  for(let d=1;d<=days;d++){
    const k=dkey(y,m,d), wd=new Date(y,m,d).getDay();
    g+=`<div class="dname${wd===0||wd===6?' we':''}" style="grid-row:2;grid-column:${d+1}">${DAYN[wd]}</div><button class="dnum${k===tk?' today':''}${restK(k)?' joker':''}${S.freezes[k]?' frz':''}" data-a="bulk" data-k="${k}" style="grid-row:3;grid-column:${d+1}" data-tip="${d} ${MONTHS[m]} · tıkla: günün tümünü işaretle"${k>tk?' disabled':''}>${d}</button>`;
  }
  hs.forEach((h,r)=>{
    g+=`<button class="hname sticky" data-a="detail" data-id="${esc(h.id)}" style="--h:${h.hue}" aria-label="${esc(h.name)} — ayrıntılar"><span class="hicon">${iconHTML(h.icon)}</span><span class="htxt">${esc(h.name)}${h.target?` <span class="sub">${tgtK(h,todayKey())} ${esc(h.unit)}</span>`:''}${h.weekly?` <span class="sub">haftada ${h.weekly}</span>`:''}</span><span class="streak" data-sk="${esc(h.id)}"></span><span class="hcount" data-hc="${esc(h.id)}">0</span></button>`;
    for(let d=1;d<=days;d++) g+=cellHTML(h,dkey(y,m,d),d,r,tk);
  });
  g+='<div class="dplabel sticky">Günlük İlerleme</div>';
  for(let d=1;d<=days;d++) g+=`<div class="dp" data-k="${dkey(y,m,d)}"><div class="dp-bar"><i></i></div><span>0</span></div>`;
  g+='<div class="dplabel sm sticky">Not &amp; Ruh Hâli</div>';
  for(let d=1;d<=days;d++) g+=noteBtn(dkey(y,m,d),d,tk);
  return `<div class="grid-scroll"><div class="grid${intro?' intro':''}" style="--days:${days}">${g}</div></div>${hs.length?'':'<p class="empty">Bu kategoride alışkanlık yok.</p>'}`;
}
function updCell(el){
  const h=hab(el.dataset.h); if(!h) return;
  const k=el.dataset.k, on=isOn(k,h.id);
  el.classList.toggle('on',on); el.setAttribute('aria-pressed',on); el.classList.toggle('off',!schedK(h,k));
  if(h.target>0){ const v=valOf(k,h.id); el.style.setProperty('--f',Math.min(1,v/tgtK(h,k))); const nv=el.querySelector('.nv'); if(nv) nv.textContent=v&&!on?fmt(v):''; }
}
function updNote(k){ const el=$(`.dnote[data-k="${k}"]`); if(el){ const t=document.createElement('div'); t.innerHTML=noteBtn(k,pk(k)[2],todayKey()); el.replaceWith(t.firstElementChild); } }
function updDP(k){
  const el=$(`.dp[data-k="${k}"]`); if(!el) return;
  const ds=dayStat(k), i=el.querySelector('i'), d=pk(k)[2];
  i.style.height=ds.p*100+'%'; i.style.setProperty('--hue',Math.round(ds.p*140));
  count(el.querySelector('span'),ds.p*100);
  el.classList.toggle('perfect',ds.perfect);
  el.dataset.tip=`${d} ${MONTHS[view]}\n${ds.c}/${ds.s} planlı tamamlandı · %${fmt(ds.p*100,1)}${ds.joker?'\n🃏 Joker gün':''}`;
  if(tipEl===el) showTip(el);
}
function refreshMonth(){
  if(view>11||!$('#stN')) return;
  const y=S.year, m=view, st=monthStats(y,m);
  for(let d=1;d<=st.days;d++) updDP(dkey(y,m,d));
  count($('#stN'),st.n); count($('#stTicks'),st.ticks); $('#stMax').textContent=fmt(st.possible);
  count($('#stRate'),st.rate*100,1,'%'); $('#ring').style.strokeDashoffset=C*(1-st.rate);
  $('#stSoFar').textContent=st.el&&st.el<st.days&&st.soPoss?`Bugüne kadar %${fmt(st.soRate*100,1)} · Ay sonu tahmini ~${fmt(Math.round(st.ticks+st.soRate*(st.possible-st.soPoss)))} tik`:st.el===st.days?'Ay tamamlandı':'Henüz başlamadı';
  active().forEach(h=>{ count($(`[data-hc="${CSS.escape(h.id)}"]`),st.per[h.id]); const s=$(`[data-sk="${CSS.escape(h.id)}"]`); if(s){ const c=streaks(h).cur; s.textContent=c>=2?`🔥${c}`:''; s.dataset.t=flameT(c); s.dataset.tip=`Seri: ${c} gün · Rekor: ${streaks(h).best}`; } });
  renderLeaders(st);
  const tb=$(`.tab[data-go="${m}"] .tp i`); if(tb) tb.style.setProperty('--p',st.rate);
}
function renderLeaders(st){
  const ol=$('#lb'); if(!ol) return;
  const y=S.year, m=view, pst=m?monthStats(y,m-1):monthStats(y-1,11);
  const hs=active(), sorted=[...hs].sort((a,b)=>st.per[b.id]-st.per[a.id]||hs.indexOf(a)-hs.indexOf(b));
  const li=h=>ol.querySelector(`li[data-id="${CSS.escape(h.id)}"]`);
  flip(ol,()=>{
    const keep=new Set(sorted.map(h=>h.id)); [...ol.children].forEach(x=>keep.has(x.dataset.id)||x.remove());
    sorted.forEach(h=>{ let x=li(h); if(!x){ x=document.createElement('li'); x.dataset.id=h.id; x.dataset.a='detail'; x.innerHTML='<span class="rk"></span><span class="lb-name"></span><b class="pts">0</b><span class="lb-bar"><i></i></span><b class="pct">%0</b>'; } ol.appendChild(x); });
  });
  void ol.offsetWidth;
  sorted.forEach((h,i)=>{
    const x=li(h), pts=st.per[h.id], p=st.hRate(h.id), tr=pst.poss[h.id]?Math.round((p-pst.hRate(h.id))*100):null;
    x.style.setProperty('--h',h.hue); x.classList.toggle('top1',i===0&&pts>0);
    x.querySelector('.rk').textContent=i<3&&pts>0?['🥇','🥈','🥉'][i]:i+1;
    x.querySelector('.lb-name').innerHTML=`${iconHTML(h.icon)} ${esc(h.name)}${tr?`<span class="tr ${tr>0?'up':'down'}">${tr>0?'↑':'↓'}${Math.abs(tr)}</span>`:''}`;
    count(x.querySelector('.pts'),pts); count(x.querySelector('.pct'),p*100,1,'%');
    x.querySelector('.lb-bar i').style.width=p*100+'%';
    x.dataset.tip=`${h.name}\n${st.ds[h.id]} / ${st.poss[h.id]} planlı gün · %${fmt(p*100,1)}${tr!==null?`\nGeçen ay: %${fmt(pst.hRate(h.id)*100,1)}`:''}`;
  });
}
function updBoss(fromChange){
  if(view>11||!$('#boss')) return;
  const y=S.year, m=view, b=bossOf(y,m), key=`${y}-${m}`, box=$('#boss');
  $('#bossHp').style.width=b.left/b.hp*100+'%';
  $('#bossTxt').textContent=b.dead?`${b.dmg} hasar verdin — ${b.hp} HP'lik boss yere serildi!`:`${b.left} / ${b.hp} HP kaldı · ${b.dmg} hasar verdin`;
  if(fromChange&&!RM.matches){ const e=$('#bossE'); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
  box.classList.toggle('dead',b.dead);
  $('#bossName').textContent=b.name+(b.dead?' — YENİLDİ ✓':'');
  if(b.dead&&!S.bosses[key]&&fromChange){ S.bosses[key]=1; save(); setTimeout(()=>{ rain(240); sfx('win'); toast(`⚔️ ${b.name} yenildi! +200 XP`); updXP(true); },300); }
  if(!b.dead&&S.bosses[key]) delete S.bosses[key];
}

/* --- takvim --- */
function calHTML(intro){
  const y=S.year, m=view, days=dim(y,m), off=(new Date(y,m,1).getDay()+6)%7, tk=todayKey();
  let h=WEEK.map(w=>`<div class="cdn">${DAYN[w]}</div>`).join('')+'<div></div>'.repeat(off);
  for(let d=1;d<=days;d++){
    const k=dkey(y,m,d), ds=dayStat(k), fut=k>tk, n=S.notes[k];
    h+=`<button class="cday${k===tk?' today':''}${ds.perfect?' perfect':''}" data-a="day" data-k="${k}" style="--i:${intro?d:0};--p:${fut?0:ds.p.toFixed(3)}" data-tip="${d} ${MONTHS[m]}\n${ds.c}/${ds.s} planlı tamamlandı"${fut?' disabled':''}><b>${d}</b><span class="mring"></span>${n&&n.mood?`<span class="cm">${MOODS[n.mood-1]}</span>`:''}${S.photos[k]?'<span class="cph"></span>':''}${ds.vac?'<span class="tag">🏝️</span>':ds.joker?'<span class="tag">🃏</span>':S.freezes[k]?'<span class="tag">❄️</span>':''}</button>`;
  }
  return `<div class="cal">${h}</div><p class="hint" style="padding:10px 6px 2px">Bir güne dokun: alışkanlıkları işaretle, not, ruh hâli ve fotoğraf ekle.</p>`;
}

/* --- bugün --- */
function todayCard(h,i,k){
  const on=isOn(k,h.id), pre=h.after&&hab(h.after), next=!!(pre&&isOn(k,pre.id)&&!on);
  return `<div class="tcard${on?' on':''}${next?' next':''}" role="button" tabindex="0" data-a="tcard" data-h="${esc(h.id)}" style="--h:${h.hue};--i:${i}" aria-pressed="${on}" aria-label="${esc(h.name)}">${tcardInner(h,k,on,pre,next)}</div>`;
}
function tcardInner(h,k,on,pre,next){
  const v=valOf(k,h.id), s=streaks(h).cur, T=tgtK(h,k), sd=subsOf(k,h.id);
  return `<span class="ti">${iconHTML(h.icon)}</span><span class="tcheck">${CHECK}</span><b>${esc(h.name)}</b>
    ${pre?`<span class="chain">${next?'👉 Sırada! ':'↳ '}${esc(pre.name)} sonrası</span>`:''}
    <span class="sub tsub">${h.target?`${fmt(v)} / ${T} ${esc(h.unit)}${T>h.target?' 📈':''}`:h.subs.length&&!on?`${sd.length}/${h.subs.length} adım`:on?'Tamamlandı 🎉':'Dokun ve tamamla'}${h.weekly?` · haftada ${h.weekly}`:''}${s>=2?` · <span class="streak" data-t="${flameT(s)}">🔥${s}</span>`:''}</span>
    ${h.subs.length?`<div class="subs">${h.subs.map((x,i)=>`<button type="button" class="sub-i${sd.includes(i)?' on':''}" data-a="tsub" data-h="${esc(h.id)}" data-i="${i}">${sd.includes(i)?'☑':'☐'} ${esc(x)}</button>`).join('')}</div>`:''}
    ${h.target?`<div class="tbar"><i style="width:${Math.min(100,v/T*100)}%"></i></div><div class="trow"><button class="btn ghost sm" data-a="tdec" data-h="${esc(h.id)}" aria-label="Azalt">−</button><button class="btn ghost sm" data-a="tinc" data-h="${esc(h.id)}" aria-label="Artır">＋</button></div>`:''}
    ${h.timer?`<div class="trow"><button class="btn ghost sm" data-a="timer" data-h="${esc(h.id)}">▶ ${h.timer} dk zamanlayıcı</button></div>`:''}`;
}
function questStrip(k){ return questsFor(k).map(q=>`<span class="quest${q.ok()?' done':''}">${q.e} ${esc(q.text)}<span class="qx">${q.ok()?'✓':'+20 XP'}</span></span>`).join(''); }
// zincirdeki alışkanlıklar öncekinin hemen arkasına dizilir
function chainOrder(list){
  const out=[], seen=new Set(), add=h=>{ if(seen.has(h.id)) return; seen.add(h.id); out.push(h); list.filter(x=>x.after===h.id).forEach(add); };
  list.filter(h=>!h.after||!list.some(x=>x.id===h.after)).forEach(add); list.forEach(add); return out;
}
const daySub=ds=>`${ds.c}/${ds.s} planlı alışkanlık tamamlandı${ds.vac?' · 🏝️ Tatil/hasta modu':ds.joker?' · 🃏 Joker gün':''}`;
function todayHTML(){
  const now=new Date();
  if(S.year!==now.getFullYear()||view!==now.getMonth()) return `<div class="empty"><p>“Bugün” görünümü yalnızca içinde bulunduğun ay için çalışır.</p><button class="btn" data-a="goToday">⚡ Bugüne git</button></div>`;
  const k=todayKey(), ds=dayStat(k), hs=active(), sc=hs.filter(h=>schedK(h,k)), bonus=hs.filter(h=>!schedK(h,k)), slotted=sc.some(h=>h.slot);
  let i=0; const grp=(list,title,slot)=>list.length?`${title?`<div class="tsec">${title}${slot&&list.some(h=>!isOn(k,h.id))?`<button class="btn ghost sm" data-a="routine" data-slot="${slot}">▶ Rutini başlat</button>`:''}</div>`:''}${chainOrder(list).map(h=>todayCard(h,i++,k)).join('')}`:'';
  const groups=SLOTS.map(([s,l])=>grp(sc.filter(h=>h.slot===s),l,s)).join('')+grp(sc.filter(h=>!h.slot),slotted?'✨ Gün içinde':'')+grp(bonus,'Bonus · bugün planlı değil');
  return `<div class="today-hero">${ringSVG(`id="tRing" style="stroke-dashoffset:${C*(1-ds.p)}"`)}<div style="flex:1;min-width:180px"><span class="eyebrow">Bugün</span><h3>${now.getDate()} ${MONTHS[now.getMonth()]}, ${DAYLONG[now.getDay()]}</h3><span class="sub" id="tSub">${daySub(ds)}</span>
      <div class="trow" style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-a="focus">🎯 Odak modu</button><button class="btn ghost sm" data-a="breath">🧘 Nefes</button><button class="btn ghost sm" data-a="day" data-k="${k}">📝 Not / ruh hâli</button></div></div>
      <div id="petMini">${petMini()}</div></div>
    <div class="qstrip" id="qStrip">${questStrip(k)}</div>
    <div class="tgrid">${groups}</div>`;
}
function updToday(){
  const k=todayKey(), ds=dayStat(k);
  $$('.tcard').forEach(el=>{ const h=hab(el.dataset.h); if(!h) return; const t=document.createElement('div'); t.innerHTML=todayCard(h,0,k); const n=t.firstElementChild;
    el.className=n.className; el.setAttribute('aria-pressed',n.getAttribute('aria-pressed')); el.innerHTML=n.innerHTML; });
  const r=$('#tRing'); if(r) r.style.strokeDashoffset=C*(1-ds.p);
  const s=$('#tSub'); if(s) s.textContent=daySub(ds);
  const q=$('#qStrip'); if(q) q.innerHTML=questStrip(k);
  const pm=$('#petMini'); if(pm) pm.innerHTML=petMini();
}

/* --- değişiklik ve efektler --- */
// how: toggle | inc | dec | on | off | set
function changeHabit(k,h,how,origin,setTo){
  if(!h||k>todayKey()) return false;
  const snap=snapDay(k), was=isOn(k,h.id), v0=valOf(k,h.id);
  if(h.target>0){
    let v=v0;
    if(how==='toggle') v=was?0:v0+1; else if(how==='inc') v=v0+1; else if(how==='dec') v=v0-1;
    else if(how==='on') v=Math.max(v0,tgtK(h,k)); else if(how==='off') v=0; else if(how==='set') v=setTo;
    setVal(k,h,v);
  } else setDone(k,h.id,how==='toggle'?!was:how==='on'||how==='inc'?true:how==='off'||how==='dec'?false:!!setTo);
  const on=isOn(k,h.id), v1=valOf(k,h.id);
  if(on===was&&v1===v0) return false;
  pushUndo(`${h.name}: ${on&&!was?'işaretlendi':was&&!on?'işaret kaldırıldı':`${fmt(v1)}/${tgtK(h,k)}`}`,[snap]);
  onData([k]);
  fxTick(k,h,on&&!was,v1>v0&&!on,was&&!on||(v1<v0&&!on),origin);
  return true;
}
function fxTick(k,h,became,partial,removed,origin){
  const r=origin&&origin.getBoundingClientRect?origin.getBoundingClientRect():null, x=r?r.left+r.width/2:innerWidth/2, y=r?r.top+r.height/2:innerHeight/2;
  if(origin&&origin.classList.contains('cell')){
    origin.classList.remove('pop','unpop'); void origin.offsetWidth; origin.classList.add(became||partial?'pop':'unpop');
    origin.addEventListener('animationend',()=>origin.classList.remove('pop','unpop'),{once:true});
    if(became) ripple(origin);
  }
  if(removed){ sfx('unpop'); return; }
  if(partial){ sfx('tick'); burst(x,y,5,h.hue); return; }
  if(!became) return;
  const n=(S.checks[k]||[]).length;
  burst(x,y,14,h.hue); sfx('pop',n); if(navigator.userActivation?.hasBeenActive) navigator.vibrate?.(8);
  floatText(x,y-10,`+${h.diff*10} XP`);
  if(n>=3) setTimeout(()=>floatText(x,y-36,`KOMBO x${n}`,'combo'),140);
  if(k===todayKey()){ const s=streaks(h).cur; if([7,14,30,50,100,200,365].includes(s)) setTimeout(()=>{ rain(); sfx('win'); toast(`🔥 ${h.name}: ${s} günlük seri! Muhteşem!`); },450); }
  if(dayStat(k).perfect) celebrate(k);
  else { const nx=active().find(x=>x.after===h.id&&!isOn(k,x.id)); if(nx) setTimeout(()=>toast(`👉 Sırada: ${iconText(nx.icon)} ${nx.name}`),500); }
}
function celebrate(k){
  $$(`#view [data-k="${k}"]`).forEach(el=>{ el.classList.remove('glow'); void el.offsetWidth; el.classList.add('glow'); setTimeout(()=>el.classList.remove('glow'),1600); });
  rain(); sfx('win'); const [,m,d]=pk(k); toast(`🎉 ${d} ${MONTHS[m]} — günün tüm alışkanlıkları tamamlandı! +25 XP`);
}
function bulkDay(k,origin){
  if(k>todayKey()) return;
  const hs=active().filter(h=>schedK(h,k));
  if(!hs.length){ toast('Bu gün planlı alışkanlık yok'); return; }
  const all=hs.every(h=>isOn(k,h.id)), snap=snapDay(k);
  hs.forEach(h=>h.target?setVal(k,h,all?0:Math.max(valOf(k,h.id),tgtK(h,k))):setDone(k,h.id,!all));
  pushUndo(all?'Günün işaretleri kaldırıldı':'Günün tümü işaretlendi',[snap]);
  onData([k]);
  if(all){ sfx('unpop'); return; }
  $$(`.cell[data-k="${k}"].on`).forEach((c,i)=>setTimeout(()=>{ c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); c.addEventListener('animationend',()=>c.classList.remove('pop'),{once:true}); },i*40));
  const r=origin?.getBoundingClientRect?.(); burst(r?r.left+r.width/2:innerWidth/2,r?r.top+r.height/2:innerHeight/2,30); sfx('pop',hs.length);
  celebrate(k);
}

/* --- ayın sözü --- */
const qKey=()=>`${S.year}-${view}`;
function smartPool(){ // ayarlanmamışsa son 7 güne göre: zor haftada destek, iyi haftada tebrik sözü
  const now=new Date(); if(S.year!==now.getFullYear()||view!==now.getMonth()) return null;
  let s=0,c=0; for(let i=1;i<=7;i++){ const ds=dayStat(addDays(todayKey(),-i)); s+=ds.s; c+=ds.c; }
  if(s<7) return null; const r=c/s; return r<.4?['zor',QUOTES_TOUGH]:r>.85?['süper',QUOTES_CHEER]:null;
}
function quoteText(){
  if(S.quotes[qKey()]!=null) return [S.quotes[qKey()],''];
  const sp=smartPool(); if(sp) return [sp[1][new Date().getDate()%sp[1].length],sp[0]==='zor'?'Zor bir hafta — sana özel seçildi 💪':'Harika gidiyorsun — sana özel seçildi 🌟'];
  return [QUOTES[view],''];
}
function quoteInner(){
  const [q,why]=quoteText(), i=q.lastIndexOf(' — '), txt=i>0?q.slice(0,i):q, au=i>0?q.slice(i+3):'';
  return `<span class="eyebrow">Ayın Motivasyon Sözü</span><blockquote>${esc(txt)}</blockquote>${au?`<figcaption>— ${esc(au)}</figcaption>`:''}${why?`<span class="sub">${why}</span>`:''}
    <div class="qtools"><button class="icon-btn sm" data-a="qshuffle" aria-label="Başka bir söz" data-tip="Başka bir söz">↻</button><button class="icon-btn sm" data-a="qedit" aria-label="Sözü düzenle" data-tip="Kendi sözünü yaz">✎</button></div>`;
}
function swapQuote(){ const f=$('#quote'); if(!f) return; f.innerHTML=quoteInner(); f.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:dur(420),easing:'cubic-bezier(.2,.8,.2,1)'}); }

/* --- kolaj --- */
function renderCollage(){
  const box=$('#collage'); if(!box) return;
  const p=`${S.year}-${pad(view+1)}-`, ks=Object.keys(S.photos).filter(k=>k.startsWith(p)).sort();
  box.innerHTML=ks.length?`<div class="card glass rise" style="--i:6;margin-top:16px"><h3>📸 Ayın Kolajı</h3><div class="collage">${ks.map((k,i)=>`<button data-a="day" data-k="${k}" style="--i:${i}" aria-label="${pk(k)[2]} ${MONTHS[view]} fotoğrafı"><img src="${S.photos[k]}" alt="" loading="lazy"><span>${pk(k)[2]} ${MONTHS[view].slice(0,3)}</span></button>`).join('')}</div></div>`:'';
}

/* --- gün penceresi: ruh hâli, not, fotoğraf, joker, dondurma, toplu işaret --- */
let dayK=null;
function openDay(k){ if(k>todayKey()) return; dayK=k; renderDay(); const d=$('#dayDlg'); if(!d.open) d.showModal(); }
function renderDay(){
  const k=dayK, [y,m,d]=pk(k), dt=new Date(y,m,d), n=S.notes[k]||{mood:0,text:''}, ds=dayStat(k);
  const jl=1-jokersInWeek(k)+(S.jokers[k]?1:0), fl=2-freezesInMonth(k)+(S.freezes[k]?1:0), g=n.grat||[];
  const missed=k<todayKey()?active().filter(h=>schedK(h,k)&&!isOn(k,h.id)):[];
  const seg=(f,lab,icons)=>`<div class="metric"><span>${lab}</span><div class="seg">${[1,2,3,4,5].map(v=>`<button type="button" data-a="metric" data-f="${f}" data-v="${v}" class="${n[f]===v?'on':''}" aria-label="${lab} ${v}">${icons[v-1]}</button>`).join('')}</div></div>`;
  $('#dayForm').innerHTML=`<h3>${d} ${MONTHS[m]} ${y} · ${DAYLONG[dt.getDay()]}</h3>
    <span class="sub">${ds.c}/${ds.s} planlı tamamlandı${ds.vac?' · 🏝️ Tatil/hasta modu (oranı etkilemez)':ds.joker?' · 🃏 Joker gün (oranı etkilemez)':''}</span>
    <h4>Ruh hâli</h4><div class="moods">${MOODS.map((e,i)=>`<button type="button" data-a="mood" data-v="${i+1}" class="${n.mood===i+1?'on':''}" aria-label="${MOODN[i]}" data-tip="${MOODN[i]}">${e}</button>`).join('')}</div>
    <div class="metrics">${seg('energy','⚡ Enerji',['1','2','3','4','5'])}${seg('stress','😣 Stres',['1','2','3','4','5'])}
      <div class="metric"><span>😴 Uyku</span><input type="number" id="daySleep" min="0" max="16" step="0.5" value="${n.sleep||''}" placeholder="saat" aria-label="Uyku saati"></div></div>
    <h4>Not</h4><textarea id="dayNote" rows="3" maxlength="500" placeholder="Bugün nasıl geçti?">${esc(n.text)}</textarea>
    <h4>🙏 Şükür günlüğü</h4><div class="grat">${[0,1,2].map(i=>`<input data-grat="${i}" maxlength="120" value="${esc(g[i]||'')}" placeholder="${i+1}. Bugün minnettarım çünkü…" aria-label="Şükür ${i+1}">`).join('')}</div>
    <h4>🎙️ Sesli not</h4><div class="voice" id="voiceBox">${voiceHTML(k)}</div>
    <h4>Alışkanlıklar</h4><div class="dh-list">${active().map(h=>{ const on=isOn(k,h.id); return `<button type="button" class="dh${on?' on':''}${schedK(h,k)?'':' off'}" data-a="dtog" data-h="${esc(h.id)}" style="--h:${h.hue}">${iconHTML(h.icon)} ${esc(h.name)}${h.target?` · ${fmt(valOf(k,h.id))}/${tgtK(h,k)}`:''}</button>`; }).join('')}</div>
    ${missed.length?`<h4>Neden yapılamadı?</h4><div class="reasons">${missed.map(h=>`<label>${iconHTML(h.icon)} ${esc(h.name)}<select data-reason="${esc(h.id)}" aria-label="${esc(h.name)} için sebep"><option value="">— seç —</option>${REASONS.map(([c,l])=>`<option value="${c}"${S.reasons[k]?.[h.id]===c?' selected':''}>${l}</option>`).join('')}</select></label>`).join('')}</div>`:''}
    <h4>Fotoğraf kanıtı</h4><div class="photo">${S.photos[k]?`<img src="${S.photos[k]}" alt="Günün fotoğrafı">`:''}<label class="btn ghost sm">📷 ${S.photos[k]?'Değiştir':'Fotoğraf ekle'}<input type="file" accept="image/*" id="photoIn" hidden></label>${S.photos[k]?'<button type="button" class="btn ghost sm" data-a="photoDel">Kaldır</button>':''}</div>
    <h4>Araçlar</h4><div class="day-tools">
      <button type="button" class="btn ghost sm" data-a="bulk" data-k="${k}">✅ Planlıların tümü</button>
      <button type="button" class="btn ghost sm${S.jokers[k]?' on':''}" data-a="joker" data-tip="Haftada 1: o gün oranları düşürmez, seriyi bozmaz">🃏 Joker gün (${Math.max(0,jl)} hak)</button>
      <button type="button" class="btn ghost sm${S.freezes[k]?' on':''}" data-a="freeze" data-tip="Ayda 2: kaçırılan gün serileri bozmaz">❄️ Seri dondur (${Math.max(0,fl)} hak)</button></div>
    <footer><button class="btn" value="close">Tamam</button></footer>`;
}

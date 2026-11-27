'use strict';
/* ===== XP, seviye, günlük görevler, başarımlar, bahçe, bırakma takibi ===== */
const xpForLevel=L=>100*(L-1)*L;              // seviye L'nin başladığı toplam XP (L2=200, L3=600, L10=9000)
const levelFromXP=xp=>{ let L=1; while(xp>=xpForLevel(L+1)) L++; return L; };

// Günün 3 görevi tarihten deterministik üretilir; XP verilerden yeniden hesaplanır (hile/çift sayım olmaz)
function questsFor(k){
  return memo('q'+k,()=>{
    const hs=active(); if(!hs.length) return [];
    const r=rng(hash(k+P.active)), pick=a=>a[Math.floor(r()*a.length)], n=hs.length, pool=[];
    const c=Math.min(n,3+Math.floor(r()*3)), cnt=()=>(S.checks[k]||[]).length;
    pool.push({e:'🎯',text:`En az ${c} alışkanlık tamamla`,ok:()=>cnt()>=c,prog:()=>`${Math.min(c,cnt())}/${c}`});
    pool.push({e:'⭐',text:'Mükemmel gün yap (tüm planlılar)',ok:()=>dayStat(k).perfect});
    if(n>=2){ const a=pick(hs); let b=pick(hs); if(b===a) b=hs[(hs.indexOf(a)+1)%n];
      pool.push({e:'🔗',text:`${iconText(a.icon)} ${a.name} + ${iconText(b.icon)} ${b.name} kombosu`,ok:()=>isOn(k,a.id)&&isOn(k,b.id)}); }
    const hard=hs.filter(h=>h.diff===3); if(hard.length){ const h=pick(hard); pool.push({e:'🏔️',text:`Zor görev: ${h.name}`,ok:()=>isOn(k,h.id)}); }
    pool.push({e:'🌅',text:'Öğleden önce 2 alışkanlık tamamla',ok:()=>Object.values(S.times[k]||{}).filter(t=>t<'12:00').length>=2});
    pool.push({e:'📔',text:'Güne ruh hâli veya not ekle',ok:()=>!!(S.notes[k]&&(S.notes[k].mood||S.notes[k].text))});
    const nums=hs.filter(h=>h.target>0); if(nums.length){ const h=pick(nums); pool.push({e:'📏',text:`${h.name}: ${h.target} ${h.unit} hedefini tuttur`,ok:()=>isOn(k,h.id)}); }
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    return pool.slice(0,3).map((q,i)=>({...q,id:k+':'+i}));
  });
}
function xpInfo(){
  return memo('xp',()=>{
    const hm=new Map(S.habits.map(h=>[h.id,h])), tk=todayKey(); let base=0,combo=0,perfect=0,quest=0;
    const days=new Set([...Object.keys(S.checks),...Object.keys(S.notes)]);
    for(const k of days){ if(k>tk) continue; const ids=S.checks[k]||[];
      for(const id of ids) base+=(hm.get(id)?.diff||1)*10;
      if(ids.length>=3) combo+=(ids.length-2)*5;
      if(dayStat(k).perfect) perfect+=25;
      quest+=questsFor(k).filter(q=>q.ok()).length*20; }
    const boss=monthsWithData().filter(([y,m])=>bossOf(y,m).dead).length*200;
    const ach=Object.keys(S.ach).length*50, goals=S.goals.filter(g=>g.done).length*100, chal=S.challenges.filter(c=>chalStat(c).complete).length*300;
    const total=base+combo+perfect+quest+boss+ach+goals+chal, L=levelFromXP(total);
    return {base,combo,perfect,quest,boss,ach,goals,chal,total,L,cur:total-xpForLevel(L),need:xpForLevel(L+1)-xpForLevel(L)};
  });
}
let lastXP=null;
function updXP(anim){
  const x=xpInfo(); $('#xpLv').textContent=`⭐ Lv ${x.L}`; $('#xpBar').style.width=x.cur/x.need*100+'%';
  $('#xpPill').dataset.tip=`${fmt(x.total)} XP · Seviye ${x.L+1} için ${fmt(x.need-x.cur)} XP`;
  if(anim&&lastXP!==null&&x.total!==lastXP){ const p=$('#xpPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  lastXP=x.total;
}
function checkLevel(silent){
  const L=xpInfo().L;
  if(S.levelSeen==null||silent){ S.levelSeen=Math.max(S.levelSeen||0,L); return; }
  if(L>S.levelSeen){ S.levelSeen=L; save(); showLevelUp(L); }
}

/* başarımlar */
const ACH=[
  ['first','👣','İlk Adım','İlk tikini at',s=>s.total>=1],
  ['t100','💯','Yüzlük','Toplam 100 tik',s=>s.total>=100],
  ['t500','🚀','Beş Yüz','Toplam 500 tik',s=>s.total>=500],
  ['t1000','🏔️','Binlik','Toplam 1000 tik',s=>s.total>=1000],
  ['perfect1','⭐','Mükemmel Gün','Bir günün tüm planlı alışkanlıklarını bitir',s=>s.perfect>=1],
  ['perfect10','🌟','On Yıldız','10 mükemmel gün',s=>s.perfect>=10],
  ['s7','🔥','Haftalık Seri','Bir alışkanlıkta 7 günlük seri',s=>s.bestStreak>=7],
  ['s30','☄️','Aylık Seri','Bir alışkanlıkta 30 günlük seri',s=>s.bestStreak>=30],
  ['s100','🌋','Yüzlük Seri','Bir alışkanlıkta 100 günlük seri',s=>s.bestStreak>=100],
  ['lvl10','🎖️','Onuncu Seviye','XP seviyesi 10',s=>s.level>=10],
  ['lvl25','🏆','Yirmi Beş','XP seviyesi 25',s=>s.level>=25],
  ['boss','⚔️','Boss Avcısı','Bir ayın boss\'unu yen',s=>s.bosses>=1],
  ['goal','🎯','Hedef Avcısı','Bir yıllık hedefi tamamla',s=>s.goals>=1],
  ['notes7','📔','Günlükçü','7 güne not veya ruh hâli ekle',s=>s.notes>=7],
  ['photo','📸','Kanıtlı','Bir güne fotoğraf ekle',s=>s.photos>=1],
  ['quit7','🚭','Temiz Sayfa','Bir kötü alışkanlıktan 7 gün uzak dur',s=>s.quitBest>=7],
  ['early','🐦','Erkenci Kuş','08:00\'den önce 10 tik at',s=>s.early>=10],
  ['m80','🏅','Parlak Ay','Bir ayı %80 üzeri bitir',s=>s.bestMonth>=.8],
  ['chal','🏁','Zinciri Koparmadım','Bir meydan okumayı tamamla',s=>s.chal>=1],
  ['grat7','🙏','Minnettar','7 güne şükür yaz',s=>s.grat>=7],
  ['letter','✉️','Zaman Kapsülü','Gelecekteki kendine mektup yaz',s=>s.letters>=1],
  ['vision','🌠','Hayalperest','Vizyon panosuna görsel ekle',s=>s.vision>=1]];
function achStats(){
  const hs=active(), tk=todayKey(); let perfect=0, early=0;
  for(const k of Object.keys(S.checks)) if(k<=tk&&dayStat(k).perfect) perfect++;
  for(const t of Object.values(S.times)) for(const v of Object.values(t)) if(v<'08:00') early++;
  return {total:totalTicks(),perfect,early,bestStreak:Math.max(0,...hs.map(h=>streaks(h).best)),level:xpInfo().L,
    bosses:monthsWithData().filter(([y,m])=>bossOf(y,m).dead).length,goals:S.goals.filter(g=>g.done).length,
    notes:Object.values(S.notes).filter(n=>n.mood||n.text).length,photos:Object.keys(S.photos).length,
    quitBest:Math.max(0,...S.quits.map(q=>Math.max(q.best,daysBetween(q.start,tk)))),
    bestMonth:Math.max(0,...monthsWithData().map(([y,m])=>monthStats(y,m).rate)),
    chal:S.challenges.filter(c=>chalStat(c).complete).length,grat:Object.values(S.notes).filter(n=>(n.grat||[]).some(Boolean)).length,
    letters:S.letters.length,vision:S.vision.length};
}
function checkAch(silent){
  const st=achStats(); let any=false;
  for(const a of ACH) if(!S.ach[a[0]]&&a[4](st)){ S.ach[a[0]]=todayKey(); any=true; if(!silent) showUnlock(a); }
  if(any){ rev++; save(); updXP(!silent); }
}
// Bağlı hedefler: alışkanlık sayısı hedefe ulaşınca otomatik tamamlanır
const habitYearCount=(id,y)=>memo(`hy${id}${y}`,()=>Object.entries(S.checks).filter(([k,a])=>k.startsWith(y+'-')&&a.includes(id)).length);
function autoGoals(){
  let any=false;
  for(const g of S.goals) if(g.habitId&&g.target&&!g.done&&habitYearCount(g.habitId,S.year)>=g.target){ g.done=true; any=true; toast(`🎯 Hedef tamamlandı: ${g.text} · +100 XP`); rain(); sfx('win'); }
  if(any){ rev++; save(); }
}
let questSeen=null;
function checkQuests(){
  const qs=questsFor(todayKey()), done=new Set(qs.filter(q=>q.ok()).map(q=>q.id));
  if(questSeen) for(const q of qs) if(done.has(q.id)&&!questSeen.has(q.id)){ toast(`✅ Görev tamamlandı: ${q.text} · +20 XP`); sfx('ding'); }
  questSeen=done;
}

/* ödüller sayfası */
const MILES=[1,3,7,14,30,60,90,180,365,730,1095];
function plantOf(k,tk){
  if(k>tk) return ['·','soil'];
  const ds=dayStat(k);
  if(ds.joker) return ['🏝️',''];
  if(!ds.s&&!ds.all) return ['·','soil'];
  if(ds.perfect) return ['🌳','']; if(ds.p>=.75) return ['🌻','']; if(ds.p>=.5) return ['🌷','']; if(ds.p>0) return ['🌱',''];
  return ['🥀',''];
}
function quitCard(q,i){
  const tk=todayKey(), days=Math.max(0,daysBetween(q.start,tk)), best=Math.max(q.best,days), next=MILES.find(x=>x>days)||days+365;
  return `<div class="qcard rise" style="--i:${i}" data-id="${esc(q.id)}"><button class="mini-btn qdel del" data-a="qdel" aria-label="Takibi sil">🗑</button>
    <div class="qtop"><span style="font-size:22px">${esc(q.icon)}</span>${esc(q.name)}</div>
    <div><span class="qd" data-count="${days}">0</span> <span class="sub">gün temiz</span></div>
    <div class="track" data-tip="Sıradaki hedef: ${next} gün"><i data-w="${days/next*100}%" style="--h:145"></i></div>
    <span class="sub">Rekor: ${best} gün · Sıradaki: ${next} gün</span>
    <button class="btn ghost sm" data-a="qslip">😔 Kaydım, sıfırla</button></div>`;
}
function renderRewards(){
  const x=xpInfo(), y=S.year, tk=todayKey(), qs=questsFor(tk), got=ACH.filter(a=>S.ach[a[0]]).length;
  let garden='';
  for(let m=0;m<12;m++){
    let row=`<div class="grow-row"><span>${MONTHS[m].slice(0,3)}</span>`;
    for(let d=1;d<=dim(y,m);d++){ const k=dkey(y,m,d), [e,c]=plantOf(k,tk), ds=dayStat(k);
      row+=`<span class="plant ${c}" style="--i:${m*31+d}" data-tip="${d} ${MONTHS[m]}${k<=tk?`\n${ds.c}/${ds.s} tamamlandı`:''}">${e}</span>`; }
    garden+=row+'</div>';
  }
  $('#view').innerHTML=`<section>
    <div class="mhead"><div class="rise"><span class="eyebrow">Oyunlaştırma</span><h2>Ödüller</h2></div></div>
    <div class="lvl-hero glass rise" style="--i:1"><div class="lvl-num"><small>SEVİYE</small>${x.L}</div>
      <div class="lvl-info"><span class="label">Toplam XP</span><b class="big" data-count="${x.total}">0</b>
        <div class="lvl-bar"><i data-w="${x.cur/x.need*100}%"></i></div>
        <span class="sub">${fmt(x.cur)} / ${fmt(x.need)} XP · Seviye ${x.L+1} için ${fmt(x.need-x.cur)} XP</span>
        <div class="xpgrid">${[['Tikler',x.base],['Kombo',x.combo],['Mükemmel gün',x.perfect],['Görevler',x.quest],['Boss',x.boss],['Başarımlar',x.ach],['Hedefler',x.goals],['Meydan okuma',x.chal]].map(([l,v])=>`<span>${l}<b data-count="${v}">0</b></span>`).join('')}</div></div></div>
    <div class="igrid">${petCard()}${avatarCard()}</div>
    ${chalSection()}
    <div class="igrid">
      <div class="card glass rise" style="--i:2"><div class="chead"><h3>🗓️ Bugünün Görevleri</h3><span class="sub">Her biri +20 XP · her gün yenilenir</span></div>
        <div class="ilist" style="display:flex;flex-direction:column;gap:8px">${qs.map((q,i)=>`<div class="quest${q.ok()?' done':''} rise" style="--i:${i}">${q.e} ${esc(q.text)}${q.prog&&!q.ok()?` <span class="sub">(${q.prog()})</span>`:''}<span class="qx">${q.ok()?'✓ Tamam':'+20 XP'}</span></div>`).join('')||'<p class="hint">Görev için önce alışkanlık ekle.</p>'}</div>
        <p class="hint" style="margin-top:12px">Kombo: aynı gün 3+ alışkanlık = ekstra XP · Zor alışkanlıklar daha çok XP verir.</p></div>
      <div class="card glass rise" style="--i:3"><div class="chead"><h3>🚭 Bırakmak İstediklerim</h3></div>
        <div class="quits" id="quits">${S.quits.map(quitCard).join('')||'<p class="hint">Bırakmak istediğin bir alışkanlık ekle; kaç gündür temiz olduğunu sayalım.</p>'}</div>
        <form class="qform" id="quitForm"><input id="quitIcon" value="🚫" maxlength="12" aria-label="İkon"><input id="quitName" maxlength="60" placeholder="Örn. Sigara, şeker, gece telefonu…" aria-label="Bırakılacak alışkanlık"><button class="btn">Başla</button></form></div>
    </div>
    <div class="card glass rise" style="--i:4;margin-bottom:16px"><div class="chead"><h3>🏅 Başarımlar</h3><span class="sub">${got}/${ACH.length} açıldı · her biri +50 XP</span></div>
      <div class="achs">${ACH.map((a,i)=>`<div class="ach ${S.ach[a[0]]?'got':'lock'}" style="--i:${i}" data-tip="${S.ach[a[0]]?`Açıldı: ${S.ach[a[0]]}`:'Kilitli'}"><span class="ae">${a[1]}</span><b>${a[2]}</b><small>${a[3]}</small></div>`).join('')}</div></div>
    <div class="card glass rise" style="--i:5"><div class="chead"><h3>🌳 ${y} Bahçem</h3><span class="sub">🌳 mükemmel · 🌻 %75+ · 🌷 %50+ · 🌱 başladı · 🥀 boş · 🏝️ joker</span></div>
      <div class="garden">${garden}</div></div>
  </section>`;
  later(()=>{ const v=$('#view'); $$('[data-count]',v).forEach(el=>count(el,+el.dataset.count)); $$('[data-w]',v).forEach(el=>el.style.width=el.dataset.w); });
}

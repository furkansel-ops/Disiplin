'use strict';
/* ===== XP, seviye, ünvan, günlük/haftalık görevler, başarımlar, bahçe, bırakma takibi ===== */
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
// Haftanın 3 büyük görevi (pazartesi anahtarından deterministik), her biri +100 XP
function weeklyFor(mo){
  return memo('w'+mo,()=>{
    const hs=active(); if(!hs.length) return [];
    const r=rng(hash('w'+mo+P.active)), tk=todayKey(), past=[...Array(7)].map((_,i)=>addDays(mo,i)).filter(k=>k<=tk), cnt=k=>(S.checks[k]||[]).length;
    const pool=[
      ()=>{ const n=2+Math.floor(r()*3); return {e:'⭐',text:`Bu hafta ${n} mükemmel gün`,cur:past.filter(k=>dayStat(k).perfect).length,n}; },
      ()=>({e:'🔥',text:'7 günün hepsinde en az 1 tik',cur:past.filter(k=>cnt(k)>0).length,n:7}),
      ()=>{ const n=3+Math.floor(r()*3); return {e:'📔',text:`${n} güne not ya da ruh hâli ekle`,cur:past.filter(k=>S.notes[k]&&(S.notes[k].mood||S.notes[k].text)).length,n}; },
      ()=>{ const n=Math.max(7,Math.min(40,hs.length*4)); return {e:'🎯',text:`Hafta boyunca ${n} tik at`,cur:past.reduce((s,k)=>s+cnt(k),0),n}; },
      ()=>{ const h=hs[Math.floor(r()*hs.length)], n=Math.min(5,h.weekly||5); return {e:iconText(h.icon),text:`${h.name}: bu hafta ${n} gün`,cur:past.filter(k=>isOn(k,h.id)).length,n}; },
      ()=>({e:'🔗',text:'4 gün 3+ alışkanlık kombosu',cur:past.filter(k=>cnt(k)>=3).length,n:4}),
      ()=>({e:'🌅',text:'5 gün öğleden önce bir tik',cur:past.filter(k=>Object.values(S.times[k]||{}).some(t=>t<'12:00')).length,n:5})];
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    return pool.slice(0,3).map((f,i)=>{ const q=f(); return {...q,cur:Math.min(q.cur,q.n),ok:q.cur>=q.n,id:mo+':'+i}; });
  });
}
const TIER={b:['Bronz',25,'#e0a06a'],g:['Gümüş',50,'#c9d3e3'],a:['Altın',100,'#ffcc66'],e:['Elmas',250,'#7fe3ff']};
const chalXP=c=>c.days<=7?150:c.days<=21?300:600;
function xpInfo(){
  return memo('xp',()=>{
    const hm=new Map(S.habits.map(h=>[h.id,h])), tk=todayKey(); let base=0,combo=0,perfect=0,quest=0;
    const days=new Set([...Object.keys(S.checks),...Object.keys(S.notes)]), mondays=new Set();
    for(const k of days){ if(k>tk) continue; const ids=S.checks[k]||[]; mondays.add(mondayOf(k));
      for(const id of ids) base+=(hm.get(id)?.diff||1)*10;
      if(ids.length>=3) combo+=(ids.length-2)*5;
      if(dayStat(k).perfect) perfect+=25;
      quest+=questsFor(k).filter(q=>q.ok()).length*20; }
    let week=0; for(const mo of mondays) week+=weeklyFor(mo).filter(q=>q.ok).length*100;
    const boss=monthsWithData().filter(([y,m])=>bossOf(y,m).dead).length*200;
    const ach=ACH.reduce((s,a)=>s+(S.ach[a[0]]?TIER[a[4]][1]:0),0), goals=S.goals.filter(g=>g.done).length*100;
    const chal=S.challenges.filter(c=>chalStat(c).complete).reduce((s,c)=>s+chalXP(c),0);
    const total=base+combo+perfect+quest+week+boss+ach+goals+chal, L=levelFromXP(total);
    return {base,combo,perfect,quest,week,boss,ach,goals,chal,total,L,cur:total-xpForLevel(L),need:xpForLevel(L+1)-xpForLevel(L)};
  });
}
let lastXP=null;
function updXP(anim){
  const x=xpInfo(); $('#xpLv').textContent=`⭐ Lv ${x.L}`; $('#xpBar').style.width=x.cur/x.need*100+'%';
  $('#xpPill').dataset.tip=`${fmt(x.total)} XP · ${titleOf(x.L)[1]} · Seviye ${x.L+1} için ${fmt(x.need-x.cur)} XP`;
  if(anim&&lastXP!==null&&x.total!==lastXP){ const p=$('#xpPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  lastXP=x.total;
}
function checkLevel(silent){
  const L=xpInfo().L;
  if(S.levelSeen==null||silent){ S.levelSeen=Math.max(S.levelSeen||0,L); return; }
  if(L>S.levelSeen){ S.levelSeen=L; save(); showLevelUp(L); }
}
// seviyeye göre ünvan
const TITLES=[[1,'Çaylak'],[3,'Hevesli'],[5,'Kararlı'],[8,'Kararlı Savaşçı'],[10,'Disiplin Çırağı'],[13,'Alışkanlık Avcısı'],[16,'İrade Ustası'],[20,'Disiplin Ustası'],[25,'Efsane'],[30,'Ölümsüz'],[40,'Yaşayan Efsane']];
const titleOf=L=>TITLES.reduce((a,t)=>L>=t[0]?t:a,TITLES[0]);

/* başarımlar: [kimlik, emoji, ad, açıklama, kademe b/g/a/e, kategori, istatistik, hedef, gizli] — kimlikler kayıtlarda tutulur, değiştirme */
const ACH_CATS=[['tik','✅ Tikler'],['seri','🔥 Seriler'],['muk','⭐ Mükemmellik'],['svy','🎖️ Seviye'],['chal','🏁 Meydan okuma'],['gun','📔 Günlük'],['dost','🐾 Dostlar'],['gizli','🕵️ Gizli']];
const ACH=[
  ['first','👣','İlk Adım','İlk tikini at','b','tik','total',1],['t50','✌️','Elli','Toplam 50 tik','b','tik','total',50],
  ['t100','💯','Yüzlük','Toplam 100 tik','g','tik','total',100],['t250','🎳','Çeyrek Bin','Toplam 250 tik','g','tik','total',250],
  ['t500','🚀','Beş Yüz','Toplam 500 tik','a','tik','total',500],['t1000','🏔️','Binlik','Toplam 1000 tik','a','tik','total',1000],
  ['t2500','🛰️','Yörüngede','Toplam 2500 tik','a','tik','total',2500],['t5000','🌌','Galaksi','Toplam 5000 tik','e','tik','total',5000],
  ['t10000','💎','On Bin','Toplam 10.000 tik','e','tik','total',10000],['day10','🎰','Jackpot','Tek günde 10 tik','g','tik','maxDay',10],
  ['s3','🕯️','Kıvılcım','Bir alışkanlıkta 3 günlük seri','b','seri','bestStreak',3],['s7','🔥','Haftalık Seri','Bir alışkanlıkta 7 günlük seri','b','seri','bestStreak',7],
  ['s14','🧨','İki Hafta','14 günlük seri','g','seri','bestStreak',14],['s30','☄️','Aylık Seri','30 günlük seri','g','seri','bestStreak',30],
  ['s60','🌠','İki Ay','60 günlük seri','a','seri','bestStreak',60],['s100','🌋','Yüzlük Seri','100 günlük seri','a','seri','bestStreak',100],
  ['s180','🌞','Yarım Yıl','180 günlük seri','e','seri','bestStreak',180],['s365','♾️','Bir Yıl Kesintisiz','365 günlük seri','e','seri','bestStreak',365],
  ['multi7','🎪','Hokkabaz','Aynı anda 3 alışkanlıkta 7+ seri','g','seri','multi7',3],
  ['perfect1','⭐','Mükemmel Gün','Bir günün tüm planlı alışkanlıklarını bitir','b','muk','perfect',1],['perfect10','🌟','On Yıldız','10 mükemmel gün','g','muk','perfect',10],
  ['perfect30','✨','Otuz Yıldız','30 mükemmel gün','a','muk','perfect',30],['perfect100','🌌','Takımyıldız','100 mükemmel gün','e','muk','perfect',100],
  ['pweek','🏵️','Mükemmel Hafta','7 gün üst üste mükemmel','a','muk','pweek',7],['m80','🏅','Parlak Ay','Bir ayı %80 üzeri bitir','g','muk','bestMonth',80],
  ['m100','👑','Kusursuz Ay','Bir ayı %100 bitir','e','muk','bestMonth',100],['early','🐦','Erkenci Kuş','08:00\'den önce 10 tik','b','muk','early',10],
  ['num10','📏','Hedef Odaklı','Sayısal hedefleri 10 kez tuttur','g','muk','numHits',10],
  ['lvl5','🎗️','Beşinci Seviye','XP seviyesi 5','b','svy','level',5],['lvl10','🎖️','Onuncu Seviye','XP seviyesi 10','g','svy','level',10],
  ['lvl15','🥉','On Beş','XP seviyesi 15','g','svy','level',15],['lvl20','🥈','Yirmi','XP seviyesi 20','a','svy','level',20],
  ['lvl25','🏆','Yirmi Beş','XP seviyesi 25','a','svy','level',25],['lvl30','👑','Otuz','XP seviyesi 30','e','svy','level',30],
  ['xp10k','💰','XP Zengini','Toplam 10.000 XP','a','svy','xp',10000],['dq50','🗓️','Görev Adamı','50 günlük görev tamamla','g','svy','quests',50],
  ['wq10','📆','Haftanın Yıldızı','10 haftalık görev tamamla','a','svy','weekly',10],
  ['chal','🏁','Zinciri Koparmadım','Bir meydan okumayı tamamla','b','chal','chal',1],['chal3','🎌','Üçleme','3 meydan okuma tamamla','g','chal','chal',3],
  ['chal10','🏆','Meydan Okuma Ustası','10 meydan okuma tamamla','a','chal','chal',10],['chal30','🗻','Uzun Yol','30+ günlük bir meydan okumayı bitir','a','chal','chal30',1],
  ['boss','⚔️','Boss Avcısı','Bir ayın boss\'unu yen','g','chal','bosses',1],['boss6','🐉','Ejderha Avcısı','6 ayın boss\'unu yen','e','chal','bosses',6],
  ['goal','🎯','Hedef Avcısı','Bir yıllık hedefi tamamla','g','chal','goals',1],['goal5','🏹','Keskin Nişancı','5 yıllık hedef tamamla','a','chal','goals',5],
  ['quit7','🚭','Temiz Sayfa','Bir kötü alışkanlıktan 7 gün uzak dur','b','chal','quitBest',7],
  ['notes7','📔','Günlükçü','7 güne not veya ruh hâli ekle','b','gun','notes',7],['notes30','📓','Yazar','30 güne not ekle','g','gun','notes',30],
  ['notes100','📚','Anı Kitabı','100 güne not ekle','a','gun','notes',100],['mood30','🎭','Duygu Ustası','30 güne ruh hâli ekle','g','gun','moods',30],
  ['grat7','🙏','Minnettar','7 güne şükür yaz','b','gun','grat',7],['grat30','💐','Şükür Dolu','30 güne şükür yaz','g','gun','grat',30],
  ['photo','📸','Kanıtlı','Bir güne fotoğraf ekle','b','gun','photos',1],['letter','✉️','Zaman Kapsülü','Gelecekteki kendine mektup yaz','b','gun','letters',1],
  ['vision','🌠','Hayalperest','Vizyon panosuna görsel ekle','b','gun','vision',1],['voice','🎙️','Sesli Günlük','İlk sesli notunu kaydet','b','gun','voice',1],
  ['pet1','🤲','Merhaba Dostum','Dostunu ilk kez sev','b','dost','pats',1],['pat50','🐾','Dost Canlısı','Dostunla bağın 50 olsun','g','dost','pats',50],
  ['pat200','💞','Can Dostu','Dostunla bağın 200 olsun','a','dost','pats',200],['acc1','🎀','Süslü','Dostuna aksesuar tak','b','dost','acc',1],
  ['avhat','🎩','Şık','Avatarına şapka tak','b','dost','avhat',1],['petTeen','🐣','Büyüyor','Dostun Genç aşamasına ulaşsın','g','dost','petSt',2],
  ['petAdult','🦁','Yetişkin','Dostun Yetişkin aşamasına ulaşsın','a','dost','petSt',3],['petLegend','🦄','Efsane Dost','Dostun Efsane aşamasına ulaşsın','e','dost','petSt',4],
  ['late','🦉','Gece Kuşu','23:00\'ten sonra 10 tik','g','gizli','late',10,1],['comeback','🔥','Küllerinden Doğuş','7+ gün aradan sonra geri dön','g','gizli','comeback',1,1],
  ['weekend','🏖️','Hafta Sonu Savaşçısı','Cumartesi ve pazarı mükemmel geçir','a','gizli','weekend',1,1],['newyear','🎆','Yeni Yıl Kararı','1 Ocak\'ta tik at','g','gizli','newyear',1,1],
  ['midnight','🌑','Gece Yarısı','00:00–01:00 arası tik at','b','gizli','midnight',1,1],['quit30','🕊️','Özgür','Bir kötü alışkanlıktan 30 gün uzak dur','a','gizli','quitBest',30,1],
  ['habits20','🗃️','Koleksiyoncu','20 alışkanlık oluştur','g','gizli','habits',20,1],['anniv','🎂','Yıldönümü','İlk tikinden 365 gün sonra hâlâ buradasın','e','gizli','anniv',365,1]];
const ymd=k=>{ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); };
function achStats(){
  return memo('achst',()=>{
    const hs=active(), tk=todayKey(), x=xpInfo(), hm=new Map(S.habits.map(h=>[h.id,h]));
    const keys=Object.keys(S.checks).filter(k=>k<=tk&&S.checks[k].length).sort();
    let perfect=0,pRun=0,pBest=0,lastP='',prev='',maxDay=0,comeback=0,weekend=0,numHits=0,early=0,late=0,midnight=0;
    for(const k of keys){ const ds=dayStat(k), ids=S.checks[k]; maxDay=Math.max(maxDay,ids.length);
      for(const id of ids) if(hm.get(id)?.target>0) numHits++;
      if(ds.perfect){ perfect++; pRun=lastP===addDays(k,-1)?pRun+1:1; pBest=Math.max(pBest,pRun); lastP=k;
        if(ymd(k).getDay()===0&&dayStat(addDays(k,-1)).perfect) weekend=1; }
      if(prev&&daysBetween(prev,k)>7) comeback=1; prev=k; }
    for(const t of Object.values(S.times)) for(const v of Object.values(t)){ if(v<'08:00') early++; if(v>='23:00') late++; if(v<'01:00') midnight++; }
    const done=S.challenges.filter(c=>chalStat(c).complete), notes=Object.values(S.notes);
    return {total:totalTicks(),maxDay,bestStreak:Math.max(0,...hs.map(h=>streaks(h).best)),multi7:hs.filter(h=>streaks(h).cur>=7).length,
      perfect,pweek:pBest,bestMonth:Math.round(Math.max(0,...monthsWithData().map(([y,m])=>monthStats(y,m).rate))*100),early,late,midnight:Math.min(1,midnight),numHits,
      level:x.L,xp:x.total,quests:x.quest/20,weekly:x.week/100,chal:done.length,chal30:done.filter(c=>c.days>=30).length,
      bosses:monthsWithData().filter(([y,m])=>bossOf(y,m).dead).length,goals:S.goals.filter(g=>g.done).length,
      quitBest:Math.max(0,...S.quits.map(q=>Math.max(q.best,daysBetween(q.start,tk)))),
      notes:notes.filter(n=>n.mood||n.text).length,moods:notes.filter(n=>n.mood).length,grat:notes.filter(n=>(n.grat||[]).some(Boolean)).length,
      photos:Object.keys(S.photos).length,letters:S.letters.length,vision:S.vision.length,voice:Object.keys(S.voice).length,
      pats:S.pet.pats,acc:S.pet.acc?1:0,avhat:S.avatar.hat?1:0,petSt:petState().st,
      comeback,weekend,newyear:keys.some(k=>k.endsWith('-01-01'))?1:0,habits:S.habits.length,anniv:keys.length?daysBetween(keys[0],tk):0};
  });
}
function checkAch(silent){
  const st=achStats(); let any=false;
  for(const a of ACH) if(!S.ach[a[0]]&&st[a[6]]>=a[7]){ S.ach[a[0]]=todayKey(); any=true; if(!silent) showUnlock(a); }
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
  for(const q of weeklyFor(mondayOf(todayKey()))) if(q.ok) done.add(q.id);
  if(questSeen) for(const id of done) if(!questSeen.has(id)){ const d=qs.find(q=>q.id===id), w=!d&&weeklyFor(mondayOf(todayKey())).find(q=>q.id===id);
    if(d){ toast(`✅ Görev tamamlandı: ${d.text} · +20 XP`); sfx('ding'); } else if(w){ toast(`📆 Haftalık görev tamamlandı: ${w.text} · +100 XP`); sfx('win'); } }
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
let achCat='';
function achHTML(){
  const st=achStats(), list=ACH.filter(a=>!achCat||a[5]===achCat), got=ACH.filter(a=>S.ach[a[0]]).length;
  const tabs=[['',`Tümü · ${ACH.length}`],...ACH_CATS.map(([c,n])=>[c,`${n} · ${ACH.filter(a=>a[5]===c).length}`])];
  return `<div class="card glass" id="achBox" style="margin-bottom:16px"><div class="chead"><h3>🏅 Başarımlar</h3><span class="sub">${got}/${ACH.length} açıldı · bronz +25 · gümüş +50 · altın +100 · elmas +250 XP</span></div>
    <div class="rw-tabs">${tabs.map(([c,n])=>`<button class="chip${achCat===c?' on':''}" data-a="achCat" data-c="${c}">${n}</button>`).join('')}</div>
    <div class="achs">${list.map((a,i)=>{ const on=!!S.ach[a[0]], hide=a[8]&&!on, t=TIER[a[4]], cur=Math.min(st[a[6]]||0,a[7]);
      return `<div class="ach ${on?'got':'lock'}" style="--i:${i};--t:${t[2]}" data-tip="${on?`Açıldı: ${S.ach[a[0]]}`:hide?'Gizli başarım':'Kilitli'}">
        <div class="ach-top"><span class="ae">${hide?'🕵️':a[1]}</span><div><b>${hide?'???':esc(a[2])}</b><span class="tier">${t[0]}</span></div></div>
        <small>${hide?'Gizli başarım: keşfetmek sende':esc(a[3])}</small>
        <span class="track"><i style="width:${on?100:cur/a[7]*100}%;background:${t[2]}"></i></span>
        <span class="ach-p">${on?'✓ Açıldı':hide?'—':`${fmt(cur)} / ${fmt(a[7])}`}</span></div>`; }).join('')}</div></div>`;
}
function renderRewards(){
  if(!S.tour.rw){ S.tour.rw=true; save(); }
  const x=xpInfo(), y=S.year, tk=todayKey(), qs=questsFor(tk), wq=weeklyFor(mondayOf(tk)), got=ACH.filter(a=>S.ach[a[0]]).length;
  const [tl,tn]=titleOf(x.L), nt=TITLES.find(t=>t[0]>x.L), nr=nextReward(x.L), it=itemCounts();
  let garden='';
  for(let m=0;m<12;m++){
    let row=`<div class="grow-row"><span>${MONTHS[m].slice(0,3)}</span>`;
    for(let d=1;d<=dim(y,m);d++){ const k=dkey(y,m,d), [e,c]=plantOf(k,tk), ds=dayStat(k);
      row+=`<span class="plant ${c}" style="--i:${m*31+d}" data-tip="${d} ${MONTHS[m]}${k<=tk?`\n${ds.c}/${ds.s} tamamlandı`:''}">${e}</span>`; }
    garden+=row+'</div>';
  }
  $('#view').innerHTML=`<section>
    <div class="mhead"><div class="rise"><span class="eyebrow">Oyunlaştırma</span><h2>Ödüller</h2></div>
      <div class="rw-chips rise"><span class="rw-chip gold">🏅 ${got} / ${ACH.length} başarım</span><span class="rw-chip teal">🎁 ${it.got} / ${it.all} eşya</span></div></div>
    <div class="lvl-hero glass rise" style="--i:1"><div class="lvl-num"><small>SEVİYE</small>${x.L}</div>
      <div class="lvl-info"><div class="lvl-title"><span class="label">Toplam XP</span><span class="rw-chip">Ünvan: ${esc(tn)}</span></div><b class="big" data-count="${x.total}">0</b>
        <div class="lvl-bar"><i data-w="${x.cur/x.need*100}%"></i></div>
        <span class="sub">${fmt(x.cur)} / ${fmt(x.need)} XP · Seviye ${x.L+1} için ${fmt(x.need-x.cur)} XP${nt?` · sıradaki ünvan: “${nt[1]}” (Lv ${nt[0]})`:''}${nr?` · sıradaki ödül: ${nr}`:''}</span>
        <div class="xpgrid">${[['Tikler',x.base],['Kombo',x.combo],['Mükemmel gün',x.perfect],['Günlük görev',x.quest],['Haftalık görev',x.week],['Boss',x.boss],['Başarımlar',x.ach],['Hedefler',x.goals],['Meydan okuma',x.chal]].map(([l,v])=>`<span>${l}<b data-count="${v}">0</b></span>`).join('')}</div></div></div>
    <div class="igrid">${petCard()}${avatarCard()}</div>
    ${chalSection()}
    <div class="igrid">
      <div class="card glass rise" style="--i:2"><div class="chead"><h3>🗓️ Bugünün Görevleri</h3><span class="sub">Her biri +20 XP · her gün yenilenir</span></div>
        <div class="ilist" style="display:flex;flex-direction:column;gap:8px">${qs.map((q,i)=>`<div class="quest${q.ok()?' done':''} rise" style="--i:${i}">${q.e} ${esc(q.text)}${q.prog&&!q.ok()?` <span class="sub">(${q.prog()})</span>`:''}<span class="qx">${q.ok()?'✓ Tamam':'+20 XP'}</span></div>`).join('')||'<p class="hint">Görev için önce alışkanlık ekle.</p>'}</div>
        <p class="hint" style="margin-top:12px">Kombo: aynı gün 3+ alışkanlık = ekstra XP · Zor alışkanlıklar daha çok XP verir.</p></div>
      <div class="card glass rise" style="--i:3"><div class="chead"><h3>📆 Haftalık Görevler</h3><span class="sub">Her biri +100 XP · pazartesi yenilenir</span></div>
        <div style="display:flex;flex-direction:column;gap:8px">${wq.map((q,i)=>`<div class="wquest${q.ok?' done':''} rise" style="--i:${i}"><div><span>${esc(q.e)} ${esc(q.text)}</span><b>${q.ok?'✓ Tamam':`${q.cur}/${q.n}`}</b></div><span class="track"><i style="width:${q.cur/q.n*100}%"></i></span></div>`).join('')||'<p class="hint">Görev için önce alışkanlık ekle.</p>'}</div></div>
    </div>
    ${achHTML()}
    <div class="card glass rise" style="--i:3;margin-bottom:16px"><div class="chead"><h3>🚭 Bırakmak İstediklerim</h3></div>
      <div class="quits" id="quits">${S.quits.map(quitCard).join('')||'<p class="hint">Bırakmak istediğin bir alışkanlık ekle; kaç gündür temiz olduğunu sayalım.</p>'}</div>
      <form class="qform" id="quitForm"><input id="quitIcon" value="🚫" maxlength="12" aria-label="İkon"><input id="quitName" maxlength="60" placeholder="Örn. Sigara, şeker, gece telefonu…" aria-label="Bırakılacak alışkanlık"><button class="btn">Başla</button></form></div>
    <div class="card glass rise" style="--i:5"><div class="chead"><h3>🌳 ${y} Bahçem</h3><span class="sub">🌳 mükemmel · 🌻 %75+ · 🌷 %50+ · 🌱 başladı · 🥀 boş · 🏝️ joker</span></div>
      <div class="garden">${garden}</div></div>
  </section>`;
  later(()=>{ const v=$('#view'); $$('[data-count]',v).forEach(el=>count(el,+el.dataset.count)); $$('[data-w]',v).forEach(el=>el.style.width=el.dataset.w); });
}

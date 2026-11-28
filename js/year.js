'use strict';
/* ===== Yıllık özet: KPI, grafik, ısı haritası, hedefler, ay tablosu, Wrapped ===== */
let chartMode='ticks', yCache=null;
function yearKeys(y){ const tk=todayKey(), out=[]; for(let m=0;m<12;m++) for(let d=1;d<=dim(y,m);d++){ const k=dkey(y,m,d); if(k>tk) return out; out.push(k); } return out; }
function yearSummary(y){
  return memo('ys'+y,()=>{
    const ms=MONTHS.map((_,m)=>monthStats(y,m)), total=ms.reduce((s,x)=>s+x.ticks,0);
    const sd=ms.reduce((s,x)=>s+x.soDone,0), sp=ms.reduce((s,x)=>s+x.soPoss,0);
    const best=ms.reduce((b,x,i)=>x.rate>ms[b].rate?i:b,0);
    return {ms,total,rate:sp?sd/sp:0,best,hasBest:ms[best].ticks>0};
  });
}
function heatHTML(y){
  const off=(new Date(y,0,1).getDay()+6)%7, tk=todayKey(); let cells='<i class="blank"></i>'.repeat(off), labels='', idx=off;
  for(let m=0;m<12;m++){
    labels+=`<span style="grid-column:${Math.floor(idx/7)+1}">${MONTHS[m].slice(0,3)}</span>`;
    for(let d=1;d<=dim(y,m);d++,idx++){
      const k=dkey(y,m,d), ds=dayStat(k), fut=k>tk, p=fut?0:ds.p;
      cells+=`<i class="${fut?'fut ':''}${p===0?'z ':''}${k===tk?'today':''}" style="--p:${p.toFixed(2)};--w:${Math.floor(idx/7)}" data-tip="${d} ${MONTHS[m]} ${DAYLONG[new Date(y,m,d).getDay()]}\n${fut?'Gelecek':`${ds.c}/${ds.s} · %${fmt(p*100)}`}"></i>`;
    }
  }
  return `<div class="heat-wrap"><div class="heat-m">${labels}</div><div class="heat-body"><div class="heat-d"><span></span><span>PZT</span><span></span><span>ÇAR</span><span></span><span>CUM</span><span></span></div><div class="heat">${cells}</div></div></div>
    <div class="heat-legend">Az ${[0,.25,.5,.75,1].map(p=>`<i style="--p:${p}"></i>`).join('')} Çok</div>`;
}
function renderYear(){
  const y=S.year, now=new Date(), ys=yearSummary(y), {ms,total,best,hasBest}=ys;
  const li=rankOf(total), L=RANKS[li], N=RANKS[li+1], lp=N?(total-L.min)/(N.min-L.min):1, cur=y===now.getFullYear()?now.getMonth():-1;
  const bars=ms.map((s,i)=>`<button class="bar${i===cur?' cur':''}${i===best&&hasBest?' best':''}" data-a="go" data-go="${i}" style="--i:${i}" data-tip="${MONTHS[i]}\n${s.ticks} tik · %${fmt(s.rate*100,1)}" aria-label="${MONTHS[i]}: ${s.ticks} tik"><span class="bv">0</span><span class="bt"><i></i></span><span class="bl">${MONTHS[i].slice(0,3)}</span></button>`).join('');
  const rows=ms.map((s,i)=>`<tr data-a="go" data-go="${i}" tabindex="0" class="${i===cur?'cur':''}"><td>${MONTHS[i]}${i===best&&hasBest?' 👑':''}</td><td class="r"><b data-count="${s.ticks}">0</b></td>
    <td><div class="mini"><span class="track"><i data-w="${s.rate*100}%" style="--h:${HUES[i%HUES.length]}"></i></span><b data-count="${s.rate*100}" data-dec="1" data-pre="%">%0</b></div></td></tr>`).join('');
  $('#view').innerHTML=`<section>
    <div class="mhead"><div class="rise"><span class="eyebrow">Yıllık Özet</span><h2>${y} Yıl Özeti</h2></div><button class="btn rise" style="--i:1" data-a="wrapped">🎬 Yılın Hikâyesi</button></div>
    <div class="kpis">
      <div class="kpi glass rise" style="--i:1"><span class="label">Yıllık Toplam Tik</span><b class="big" data-count="${total}">0</b><span class="sub">${active().length} alışkanlık · 12 ay</span></div>
      <div class="kpi glass rise" style="--i:2"><span class="label">En Verimli Ay</span><b class="big">${hasBest?MONTHS[best]:'—'}</b><span class="sub">${hasBest?`<b data-count="${ms[best].rate*100}" data-dec="1" data-pre="%">%0</b> başarı · ${ms[best].ticks} tik`:'Henüz veri yok'}</span></div>
      <div class="kpi glass rise ring-stat" style="--i:3">${ringSVG(`data-ring="${ys.rate}"`)}<div><span class="label">Yıllık Başarı Oranı</span><b class="big" data-count="${ys.rate*100}" data-dec="1" data-pre="%">%0</b><span class="sub">bugüne kadarki planlı günler</span></div></div>
      <div class="kpi glass rise" style="--i:4"><span class="label">Mevcut Seviye</span><span class="badge"><span class="bicon">${L.icon}</span><b>${L.name}</b></span>
        <div class="lvl-bar" data-tip="${N?`${total} / ${N.min} tik`:'Maksimum seviye!'}"><i data-w="${lp*100}%"></i></div>
        <span class="sub">${N?`${N.icon} ${N.name} için <b>${fmt(N.min-total)}</b> tik daha`:'Zirvedesin! 👑'}</span>
        <div class="ladder">${RANKS.map((l,i)=>`<span class="${i<=li?'on':''}" data-tip="${l.name} · ${l.min}+ tik">${l.icon}</span>`).join('')}</div></div>
    </div>
    <div class="card glass rise" style="--i:5;margin-bottom:16px"><div class="chead"><h3>🟩 Yıl Isı Haritası</h3><span class="sub">Her kare bir gün · koyuluk = tamamlanma oranı</span></div>${heatHTML(y)}</div>
    <div class="ygrid">
      <div class="card glass rise" style="--i:6"><div class="chead"><h3>Aylık Performans</h3>
        <div class="seg" role="group" aria-label="Grafik modu"><button data-a="mode" data-mode="ticks" class="${chartMode==='ticks'?'on':''}">Adet</button><button data-a="mode" data-mode="rate" class="${chartMode==='rate'?'on':''}">Oran</button></div></div>
        <div class="chart" id="chart">${bars}</div></div>
      <div class="card glass rise goals" style="--i:7"><div class="chead"><h3>${y} Hedeflerim 🎯</h3><span class="sub" id="gProg"></span></div>
        <div class="lvl-bar"><i id="gBar"></i></div>
        <ul id="goals">${S.goals.map(goalLi).join('')}</ul>
        <form id="goalForm" class="gform"><input id="goalIn" maxlength="120" placeholder="Yeni hedef ekle…" aria-label="Yeni hedef"><button class="btn">Ekle</button></form>
        <p class="hint" style="margin-top:8px">🔗 ile bir hedefi alışkanlığa bağla; sayı hedefe ulaşınca kendiliğinden tamamlanır.</p></div>
    </div>
    <div class="card glass rise" style="--i:8"><h3>Ay Bazlı Özet</h3><div class="tscroll"><table class="mtable"><thead><tr><th>Ay</th><th class="r">Tamamlanan</th><th>Oran</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  </section>`;
  yCache={ms};
  later(()=>{
    const v=$('#view');
    $$('[data-count]',v).forEach(el=>count(el,+el.dataset.count,+(el.dataset.dec||0),el.dataset.pre||''));
    $$('[data-w]',v).forEach(el=>el.style.width=el.dataset.w);
    $$('[data-ring]',v).forEach(el=>el.style.strokeDashoffset=C*(1-el.dataset.ring));
    drawChart(); updGoals();
  });
}
function drawChart(){
  const box=$('#chart'); if(!box||!yCache) return;
  const {ms}=yCache, rate=chartMode==='rate', max=rate?1:Math.max(1,...ms.map(s=>s.ticks));
  [...box.children].forEach((b,i)=>{ const v=rate?ms[i].rate:ms[i].ticks;
    b.querySelector('i').style.height=v/max*100+'%'; count(b.querySelector('.bv'),rate?v*100:v,0,rate?'%':''); });
}

/* hedefler */
function goalLi(g){
  const h=g.habitId&&hab(g.habitId), c=h?habitYearCount(h.id,S.year):0;
  return `<li data-id="${esc(g.id)}" class="${g.done?'done':''}"><div class="grow"><button type="button" class="gchk" data-a="gchk" aria-pressed="${g.done}" aria-label="Tamamlandı olarak işaretle">${CHECK}</button><span class="gtxt" data-a="gtxt" tabindex="0">${esc(g.text)}</span><button type="button" class="glk" data-a="glink" aria-label="Alışkanlığa bağla" data-tip="Alışkanlığa bağla">🔗</button><button type="button" class="gdel" data-a="gdel" aria-label="Hedefi sil">✕</button></div>
    ${h&&g.target?`<div class="glink">${iconHTML(h.icon)} ${esc(h.name)} <span class="track"><i style="--h:${h.hue};width:${Math.min(100,c/g.target*100)}%"></i></span><b>${c}/${g.target}</b></div>${goalETA(g)?`<div class="geta">${goalETA(g)}</div>`:''}`:''}</li>`;
}
function updGoals(){
  const d=S.goals.filter(g=>g.done).length, t=S.goals.length;
  if($('#gProg')) $('#gProg').textContent=t?`${d}/${t} tamamlandı`:'Henüz hedef yok';
  if($('#gBar')) $('#gBar').style.width=(t?d/t*100:0)+'%';
}
const goalOf=el=>S.goals.find(g=>g.id===el.closest('li').dataset.id);

/* Wrapped: yıl sonu hikâyesi */
let WR=null;
const WBG=['linear-gradient(160deg,#6a3df5,#1b1035)','linear-gradient(160deg,#0fa596,#062c33)','linear-gradient(160deg,#f59e0b,#5a1d0a)','linear-gradient(160deg,#ff4d8d,#2b0a2e)','linear-gradient(160deg,#3b82f6,#0b1a3a)','linear-gradient(160deg,#16b277,#05261b)','linear-gradient(160deg,#a855f7,#ffcc66)','linear-gradient(160deg,#111827,#6a55f5)'];
function wrappedSlides(){
  const y=S.year, ys=yearSummary(y), keys=yearKeys(y), hs=active(), x=xpInfo(), rk=RANKS[rankOf(ys.total)];
  const perfect=keys.filter(k=>dayStat(k).perfect).length;
  const top=[...hs].sort((a,b)=>habitYearCount(b.id,y)-habitYearCount(a.id,y))[0];
  const wd=Array.from({length:7},()=>({c:0,s:0})); keys.forEach(k=>{ const ds=dayStat(k), w=wdK(k); wd[w].c+=ds.c; wd[w].s+=ds.s; });
  const bw=wd.reduce((b,v,i)=>(v.s?v.c/v.s:0)>(wd[b].s?wd[b].c/wd[b].s:0)?i:b,0);
  const moods=keys.map(k=>S.notes[k]?.mood).filter(Boolean), avg=moods.length?moods.reduce((a,b)=>a+b,0)/moods.length:0;
  const sl=[{s:String(y),e:'🎬',b:'Yılın Özeti',t:'Hazır mısın? Bir yılın hikâyesi geliyor…'},
    {s:'Toplam',e:'✅',b:fmt(ys.total),t:`tik attın. ${perfect} gün mükemmeldi ⭐`}];
  if(ys.hasBest) sl.push({s:'En verimli ay',e:'👑',b:MONTHS[ys.best],t:`%${fmt(ys.ms[ys.best].rate*100,1)} başarıyla zirvedeydin.`});
  if(top) sl.push({s:'Yılın alışkanlığı',e:iconText(top.icon),b:top.name,t:`${habitYearCount(top.id,y)} kez yaptın · en uzun seri ${streaks(top).best} gün 🔥`});
  if(wd[bw].s) sl.push({s:'En güçlü günün',e:'📅',b:DAYLONG[bw],t:`Bu günlerde %${fmt(wd[bw].c/wd[bw].s*100)} başarı yakaladın.`});
  if(moods.length) sl.push({s:'Ruh hâlin',e:MOODS[Math.round(avg)-1],b:`${fmt(avg,1)} / 5`,t:`${moods.length} güne ruh hâli ekledin.`});
  sl.push({s:'Karakterin',e:rk.icon,b:`Seviye ${x.L}`,t:`${fmt(x.total)} XP · Rütbe: ${rk.name} · ${Object.keys(S.ach).length} başarım`});
  sl.push({s:'Görüşmek üzere',e:'🚀',b:String(y+1),t:'Aynı disiplinle devam. Yeni yılda daha da güçlü!'});
  return sl;
}
function openWrapped(){
  const sl=wrappedSlides(), w=$('#wrapped');
  w.innerHTML=`<div class="wr-bars">${sl.map(()=>'<span><i></i></span>').join('')}</div><button class="icon-btn wr-close" data-a="wrClose" aria-label="Kapat">✕</button><div class="wr-slide" id="wrS"></div>`;
  WR={i:0,sl}; w.classList.add('show'); showSlide(0); sfx('win');
}
function showSlide(i){
  if(!WR) return;
  if(i>=WR.sl.length){ closeWrapped(); rain(); return; }
  WR.i=Math.max(0,i); const s=WR.sl[WR.i], D=RM.matches?7000:5000;
  $$('.wr-bars span').forEach((b,j)=>{ b.className=j<WR.i?'done':''; });
  const cur=$$('.wr-bars span')[WR.i]; void cur.offsetWidth; cur.className='cur'; cur.style.setProperty('--dur',D+'ms');
  const el=$('#wrS'); el.style.setProperty('--wbg',WBG[WR.i%WBG.length]);
  el.innerHTML=`<div class="ws">${esc(s.s)}</div><div class="we">${esc(s.e)}</div><div class="wb">${esc(s.b)}</div><div class="wt">${esc(s.t)}</div>`;
  clearTimeout(WR.t); WR.t=setTimeout(()=>showSlide(WR.i+1),D);
}
function closeWrapped(){ if(WR) clearTimeout(WR.t); WR=null; $('#wrapped').classList.remove('show'); }
$('#wrapped').addEventListener('click',e=>{ if(!WR||e.target.closest('[data-a]')) return; showSlide(WR.i+(e.clientX<innerWidth/3?-1:1)); });

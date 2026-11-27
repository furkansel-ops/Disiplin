'use strict';
/* ===== İçgörüler, alışkanlık detayı, haftalık rapor ===== */
let cmpA=null, cmpB=null;
const minToHM=v=>`${pad(Math.floor(v/60))}:${pad(Math.round(v%60))}`;
const tMin=t=>{ const [h,m]=t.split(':').map(Number); return h*60+m; };
function weekdayPerf(keys,h){
  const wd=Array.from({length:7},()=>({c:0,s:0}));
  keys.forEach(k=>{ const w=wdK(k); if(h){ if(schedK(h,k)){ wd[w].s++; if(isOn(k,h.id)) wd[w].c++; } } else { const ds=dayStat(k); wd[w].c+=ds.c; wd[w].s+=ds.s; } });
  return wd.map(v=>v.s?v.c/v.s:0);
}
function correlations(keys){
  const hs=active(), out=[];
  for(const a of hs) for(const b of hs){ if(a===b) continue;
    let n1=0,b1=0,n0=0,b0=0;
    for(const k of keys){ if(!schedK(a,k)||!schedK(b,k)) continue; const bo=isOn(k,b.id); if(isOn(k,a.id)){ n1++; if(bo) b1++; } else { n0++; if(bo) b0++; } }
    if(n1>=8&&n0>=8){ const d=b1/n1-b0/n0; if(d>=.1) out.push({a,b,d,p1:b1/n1}); } }
  return out.sort((x,y)=>y.d-x.d).slice(0,4);
}
function moodInsight(keys){
  const md=keys.filter(k=>S.notes[k]?.mood); if(md.length<5) return null;
  const avg=md.reduce((s,k)=>s+S.notes[k].mood,0)/md.length; let best=null;
  for(const h of active()){ const on=md.filter(k=>isOn(k,h.id)), off=md.filter(k=>!isOn(k,h.id)); if(on.length<5||off.length<5) continue;
    const d=on.reduce((s,k)=>s+S.notes[k].mood,0)/on.length-off.reduce((s,k)=>s+S.notes[k].mood,0)/off.length; if(!best||d>best.d) best={h,d}; }
  return {avg,n:md.length,best};
}
function barsHTML(vals,labels,fmtv,cls='',short=labels.map(l=>l.slice(0,3))){ // değerler oran (0–1)
  return `<div class="chart ${cls}">${vals.map((v,i)=>`<div class="bar" style="--i:${i}" data-tip="${labels[i]}: ${fmtv(v)}"><span class="bv">${fmtv(v)}</span><span class="bt"><i data-bh="${v*100}%"></i></span><span class="bl">${short[i]}</span></div>`).join('')}</div>`;
}
function compareHTML(){
  const y=S.year, a=monthStats(y,cmpA), b=monthStats(y,cmpB);
  return `<div class="chead"><h3>⚖️ Ay Karşılaştırma</h3><div style="display:flex;gap:6px;align-items:center"><select id="cmpA" aria-label="Birinci ay">${MONTHS.map((n,i)=>`<option value="${i}"${i===cmpA?' selected':''}>${n}</option>`).join('')}</select> vs <select id="cmpB" aria-label="İkinci ay">${MONTHS.map((n,i)=>`<option value="${i}"${i===cmpB?' selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="legend" style="margin-bottom:10px"><span><i style="background:var(--accent)"></i>${MONTHS[cmpA]} · %${fmt(a.rate*100,1)}</span><span><i style="background:var(--gold)"></i>${MONTHS[cmpB]} · %${fmt(b.rate*100,1)}</span></div>
    <div class="cmp">${active().map(h=>`<div class="cmp-row"><span>${iconHTML(h.icon)} ${esc(h.name)}</span><div class="bars"><span class="track" data-tip="${MONTHS[cmpA]}: %${fmt(a.hRate(h.id)*100,1)}"><i style="--h:258;width:${a.hRate(h.id)*100}%"></i></span><span class="track b" data-tip="${MONTHS[cmpB]}: %${fmt(b.hRate(h.id)*100,1)}"><i style="width:${b.hRate(h.id)*100}%"></i></span></div></div>`).join('')}</div>`;
}
function renderInsights(){
  const y=S.year, now=new Date(), keys=yearKeys(y), hs=active();
  if(cmpB==null){ cmpB=y===now.getFullYear()?now.getMonth():11; cmpA=Math.max(0,cmpB-1); }
  const wd=weekdayPerf(keys), order=WEEK, corr=correlations(keys), mi=moodInsight(keys);
  const bestW=order.reduce((b,w)=>wd[w]>wd[b]?w:b,order[0]), worstW=order.reduce((b,w)=>wd[w]<wd[b]?w:b,order[0]);
  const times=hs.map(h=>{ const ts=keys.map(k=>S.times[k]?.[h.id]).filter(Boolean); return ts.length>=3?{h,avg:ts.reduce((s,t)=>s+tMin(t),0)/ts.length,n:ts.length}:null; }).filter(Boolean).sort((a,b)=>a.avg-b.avg);
  const ys=yearSummary(y), el=keys.length, yearDays=(new Date(y,11,31)-new Date(y,0,1))/864e5+1, fc=el?Math.round(ys.total/el*yearDays):0;
  const ins=[];
  if(el) ins.push(`📅 En güçlü günün <b>${DAYLONG[bestW]}</b> (%${fmt(wd[bestW]*100)}), en zayıfı <b>${DAYLONG[worstW]}</b> (%${fmt(wd[worstW]*100)}).`);
  corr.forEach(c=>ins.push(`🔗 <b>${esc(c.a.name)}</b> yaptığın günlerde <b>${esc(c.b.name)}</b> yapma ihtimalin <b>%${fmt(c.d*100)}</b> daha yüksek (%${fmt(c.p1*100)}).`));
  if(mi&&mi.best&&mi.best.d>.15) ins.push(`😊 <b>${esc(mi.best.h.name)}</b> yaptığın günlerde ruh hâlin ortalama <b>${fmt(mi.best.d,1)}</b> puan daha iyi.`);
  if(el&&y===now.getFullYear()) ins.push(`🔮 Bu tempoyla ${y} yılını yaklaşık <b>${fmt(fc)}</b> tikle kapatırsın.`);
  if(!ins.length) ins.push('Veri biriktikçe burada sana özel tespitler görünecek.');
  $('#view').innerHTML=`<section>
    <div class="mhead"><div class="rise">${statTabs()}<h2>İçgörüler · ${y}</h2></div><button class="btn rise" style="--i:1" data-a="report">📋 Haftalık Rapor Kartı</button></div>
    <div class="igrid">
      <div class="card glass rise" style="--i:1"><div class="chead"><h3>🧠 Senin İçin Tespitler</h3></div><ul class="ilist">${ins.map((t,i)=>`<li style="--i:${i}">${t}</li>`).join('')}</ul></div>
      <div class="card glass rise" style="--i:2"><div class="chead"><h3>📅 Günlere Göre Başarı</h3><span class="sub">${y}, bugüne kadar</span></div>${barsHTML(order.map(w=>wd[w]),order.map(w=>DAYLONG[w]),v=>'%'+fmt(v*100),'c7',order.map(w=>DAYN[w]))}</div>
    </div>
    <div class="igrid">
      <div class="card glass rise" style="--i:3" id="cmpBox">${compareHTML()}</div>
      <div class="card glass rise" style="--i:4"><div class="chead"><h3>⏰ Genelde Ne Zaman?</h3><span class="sub">Ortalama tik saati</span></div>
        ${times.length?`<ul class="ilist">${times.map((t,i)=>`<li style="--i:${i}"><b>${minToHM(t.avg)}</b> · ${iconHTML(t.h.icon)} ${esc(t.h.name)} <span class="sub">(${t.n} kayıt)</span></li>`).join('')}</ul>`:'<p class="hint">Bugünden itibaren tik attığın saatler kaydedilir; birkaç gün sonra burada görünür.</p>'}
        ${mi?`<p class="hint" style="margin-top:12px">Ruh hâli ortalaman: ${MOODS[Math.round(mi.avg)-1]} ${fmt(mi.avg,1)}/5 (${mi.n} gün)</p>`:''}</div>
    </div>
    <div class="card glass rise" style="--i:5"><div class="chead"><h3>📈 Alışkanlık Trendleri</h3><span class="sub">Bu ay ve geçen ay · detay için tıkla</span></div>
      <ul class="ilist">${hs.map((h,i)=>{ const cm=y===now.getFullYear()?now.getMonth():11, a=monthStats(y,cm), b=cm?monthStats(y,cm-1):monthStats(y-1,11), d=Math.round((a.hRate(h.id)-b.hRate(h.id))*100);
        return `<li style="--i:${i};cursor:pointer" data-a="detail" data-id="${esc(h.id)}">${iconHTML(h.icon)} <b>${esc(h.name)}</b> · %${fmt(a.hRate(h.id)*100)} <span class="tr ${d>=0?'up':'down'}">${d>=0?'↑':'↓'}${Math.abs(d)}</span> <span class="sub">· seri ${streaks(h).cur} · rekor ${streaks(h).best}</span></li>`; }).join('')}</ul></div>
    ${insightsExtraHTML(keys)}
  </section>`;
  later(()=>$$('#view [data-bh]').forEach(i=>i.style.height=i.dataset.bh));
}

/* alışkanlık detayı */
function openDetail(id){
  const h=hab(id); if(!h) return;
  const y=S.year, keys=yearKeys(y), st=streaks(h), all=Object.values(S.checks).filter(a=>a.includes(h.id)).length;
  const ms=MONTHS.map((_,m)=>monthStats(y,m).hRate(h.id)), wd=weekdayPerf(keys,h);
  const ts=keys.map(k=>S.times[k]?.[h.id]).filter(Boolean), avgT=ts.length?minToHM(ts.reduce((s,t)=>s+tMin(t),0)/ts.length):'—';
  let sp=0,sd=0; keys.forEach(k=>{ if(schedK(h,k)){ sp++; if(isOn(k,h.id)) sd++; } });
  const bw=WEEK.reduce((b,w)=>wd[w]>wd[b]?w:b,WEEK[0]), sum=h.target?Object.values(S.vals).reduce((s,v)=>s+(v[h.id]||0),0):0;
  $('#detailForm').innerHTML=`<div style="display:flex;align-items:center;gap:12px;--h:${h.hue}"><span class="hicon" style="width:48px;height:48px;font-size:24px;border-radius:14px">${iconHTML(h.icon)}</span>
      <div><h3>${esc(h.name)}</h3><span class="sub">${h.cat?CATS.find(c=>c[0]===h.cat)[1]+' · ':''}${DIFFS[h.diff]} (${h.diff*10} XP) · ${h.days.length===7?'Her gün':WEEK.filter(w=>h.days.includes(w)).map(w=>DAYN[w]).join(' ')}${h.target?` · hedef ${h.target} ${esc(h.unit)}`:''}</span></div></div>
    <div class="dstats"><span>Toplam<b>${fmt(all)}</b></span><span>Mevcut seri<b>🔥 ${st.cur}</b></span><span>En uzun seri<b>${st.best} gün</b></span>
      <span>${y} başarı<b>%${fmt(sp?sd/sp*100:0,1)}</b></span><span>Ort. saat<b>${avgT}</b></span><span>En iyi gün<b>${wd[bw]?DAYLONG[bw]:'—'}</b></span>
      ${h.target?`<span>Toplam miktar<b>${fmt(sum)} ${esc(h.unit)}</b></span>`:''}</div>
    <h4>${y} · aylara göre başarı</h4>${barsHTML(ms,MONTHS,v=>'%'+fmt(v*100))}
    <h4>Günlere göre</h4>${barsHTML(WEEK.map(w=>wd[w]),WEEK.map(w=>DAYLONG[w]),v=>'%'+fmt(v*100),'c7',WEEK.map(w=>DAYN[w]))}
    <footer>${h.timer?`<button type="button" class="btn ghost" data-a="timer" data-h="${esc(h.id)}">▶ ${h.timer} dk zamanlayıcı</button>`:''}<button type="button" class="btn ghost" data-a="editHabit" data-id="${esc(h.id)}">✎ Düzenle</button><button class="btn" value="close">Kapat</button></footer>`;
  const d=$('#detailDlg'); if(!d.open) d.showModal();
  later(()=>$$('#detailForm [data-bh]').forEach(i=>i.style.height=i.dataset.bh));
}

/* haftalık rapor kartı */
function weekStats(mon){
  const tk=todayKey(), ks=[...Array(7)].map((_,i)=>addDays(mon,i)).filter(k=>k<=tk);
  let s=0,c=0,perfect=0; const per={};
  ks.forEach(k=>{ const ds=dayStat(k); s+=ds.s; c+=ds.c; if(ds.perfect) perfect++; active().forEach(h=>{ if(!schedK(h,k)) return; const p=per[h.id]||(per[h.id]={h,s:0,c:0}); p.s++; if(isOn(k,h.id)) p.c++; }); });
  const md=ks.map(k=>S.notes[k]?.mood).filter(Boolean);
  return {ks,s,c,perfect,rate:s?c/s:0,per:Object.values(per),mood:md.length?md.reduce((a,b)=>a+b,0)/md.length:0};
}
const grade=r=>r>=.9?'A+':r>=.8?'A':r>=.7?'B':r>=.6?'C':r>=.45?'D':'F';
function openReport(mon){
  mon=mon||mondayOf(todayKey());
  const w=weekStats(mon), p=weekStats(addDays(mon,-7)), d=Math.round((w.rate-p.rate)*100);
  const sorted=[...w.per].sort((a,b)=>b.c/b.s-a.c/a.s), best=sorted[0], worst=sorted[sorted.length-1];
  const [,m1,d1]=pk(mon), [,m2,d2]=pk(addDays(mon,6));
  $('#reportForm').innerHTML=`<span class="eyebrow">Haftalık Rapor Kartı</span><h3>${d1} ${MONTHS[m1]} – ${d2} ${MONTHS[m2]}</h3>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap"><div class="report-grade">${w.s?grade(w.rate):'–'}</div>
      <div><b class="big">%${fmt(w.rate*100,1)}</b><div class="sub">${w.c}/${w.s} planlı tik · ${w.perfect} mükemmel gün</div>
      <div class="tr ${d>=0?'up':'down'}" style="margin:4px 0 0;font-size:13px">${d>=0?'↑':'↓'} geçen haftaya göre ${Math.abs(d)} puan</div></div></div>
    <div class="dstats">${best?`<span>Haftanın yıldızı<b>${iconHTML(best.h.icon)} ${esc(best.h.name)}</b></span>`:''}${worst&&worst!==best?`<span>Biraz ihmal<b>${iconHTML(worst.h.icon)} ${esc(worst.h.name)}</b></span>`:''}<span>Ruh hâli<b>${w.mood?MOODS[Math.round(w.mood)-1]+' '+fmt(w.mood,1):'—'}</b></span></div>
    <p class="hint">${w.rate>=.8?'Muhteşem bir hafta! Aynı ritmi koru. 🏆':w.rate>=.5?'Fena değil — en zayıf alışkanlığına küçük bir hedef koy. 💪':'Zor bir hafta olmuş. Bu hafta tek bir alışkanlığa odaklan, gerisi gelir. 🌱'}</p>
    <footer><button class="btn" value="close">Harika</button></footer>`;
  const dlg=$('#reportDlg'); if(!dlg.open) dlg.showModal();
  if(w.rate>=.8) setTimeout(()=>rain(),300);
}
// Pazar akşamı (18:00 sonrası) bu haftanın, pazartesi geçen haftanın raporu bir kez kendiliğinden açılır
function autoReport(){
  const n=new Date(), tk=todayKey(); let mon=null;
  if(n.getDay()===0&&n.getHours()>=18) mon=mondayOf(tk); else if(n.getDay()===1) mon=addDays(mondayOf(tk),-7);
  if(!mon||S.lastReport===mon||!Object.keys(S.checks).length) return;
  S.lastReport=mon; save(); setTimeout(()=>openReport(mon),1500);
}

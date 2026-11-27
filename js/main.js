'use strict';
/* ===== Gezinme, olay yönetimi, geri alma, başlangıç ===== */
const now0=new Date();
let view=S.year===now0.getFullYear()?now0.getMonth():0, navT;
const TABS=[...MONTHS,'📊 Yıllık Özet','📈 İçgörüler','🏆 Ödüller','📔 Günlük'], LASTV=TABS.length-1;

function renderTabs(){
  const tabs=$('#tabs'), n=new Date();
  if(!tabs.children.length) tabs.innerHTML='<span class="ind" id="ind"></span>'+TABS.map((t,i)=>`<button class="tab" role="tab" data-a="go" data-go="${i}">${t}${i<12?'<span class="tp"><i></i></span>':''}</button>`).join('');
  $$('.tab',tabs).forEach(t=>{
    const i=+t.dataset.go; t.classList.toggle('on',i===view); t.setAttribute('aria-selected',i===view);
    t.classList.toggle('now',i===n.getMonth()&&S.year===n.getFullYear());
    const b=t.querySelector('.tp i'); if(b) b.style.setProperty('--p',monthStats(S.year,i).rate);
  });
  requestAnimationFrame(moveInd);
}
function moveInd(){
  const t=$('.tab.on'), ind=$('#ind'); if(!t||!ind) return;
  ind.style.width=t.offsetWidth+'px'; ind.style.transform=`translateX(${t.offsetLeft}px)`;
  const tabs=$('#tabs'); tabs.scrollTo({left:t.offsetLeft-tabs.clientWidth/2+t.offsetWidth/2,behavior:RM.matches?'auto':'smooth'});
}
addEventListener('resize',()=>{ resizeAll(); moveInd(); });
document.fonts?.ready.then(()=>moveInd()); // font yüklenince sekme genişlikleri değişir
function render(){
  $('#yLabel').textContent=S.year; renderTabs(); setAmbient(view<12?view:new Date().getMonth());
  if(view<12) renderMonth(); else if(view===12) renderYear(); else if(view===13) renderInsights(); else if(view===14) renderRewards(); else renderJournal();
}
function swap(dir){
  const el=$('#view'); clearTimeout(navT); showTip(null);
  if(RM.matches){ render(); return; }
  el.style.setProperty('--dir',dir); el.classList.add('leave');
  navT=setTimeout(()=>{ render(); el.classList.remove('leave'); el.classList.add('enter'); void el.offsetWidth; el.classList.remove('enter'); },190);
}
function go(v){ if(v===view||v<0||v>LASTV) return; const dir=v>view?1:-1; view=v; renderTabs(); swap(dir); window.scrollTo({top:0,behavior:RM.matches?'auto':'smooth'}); }
function setYear(y){ const dir=y>S.year?1:-1; S.year=y; rev++; save(); $('#yLabel').textContent=y; renderTabs(); swap(dir); }

/* veri değiştiğinde ekranı güncelle */
function onData(keys){
  rev++; save(); updXP(true);
  if(view<12){
    const mode=S.settings.view;
    if(mode==='table'&&$('.grid')){ keys.forEach(k=>{ $$(`.cell[data-k="${k}"]`).forEach(updCell); updNote(k); const dn=$(`.dnum[data-k="${k}"]`); if(dn){ dn.classList.toggle('joker',!!S.jokers[k]); dn.classList.toggle('frz',!!S.freezes[k]); } }); }
    else if(mode==='today'&&$('.tcard')) updToday();
    else renderMonthBody(false);
    refreshMonth(); updBoss(true);
  } else render();
  checkQuests(); if(FQ) renderFocus(); updTour();
  if($('#dayDlg').open) renderDay();
  clearTimeout(onData.t); onData.t=setTimeout(()=>{ autoGoals(); checkAch(false); checkLevel(false); },450);
}

/* geri alma */
const undoStack=[]; let undoT;
function snapDay(k){ return {k,c:S.checks[k]?[...S.checks[k]]:null,v:S.vals[k]?{...S.vals[k]}:null,t:S.times[k]?{...S.times[k]}:null,s:S.subd[k]?JSON.parse(JSON.stringify(S.subd[k])):null}; }
function pushUndo(label,snaps){
  undoStack.push({label,snaps}); if(undoStack.length>60) undoStack.shift();
  $('#undoTxt').textContent=label; const u=$('#undo'); u.classList.add('show');
  clearTimeout(undoT); undoT=setTimeout(()=>u.classList.remove('show'),4500);
}
function undo(){
  const u=undoStack.pop(); $('#undo').classList.remove('show');
  if(!u){ toast('Geri alınacak işlem yok'); return; }
  for(const s of u.snaps){
    if(s.full){ const v=validate(JSON.parse(s.full)); if(v) S=v; continue; }
    for(const [f,val] of [['checks',s.c],['vals',s.v],['times',s.t],['subd',s.s]]){ if(val) S[f][s.k]=val; else delete S[f][s.k]; }
  }
  rev++; save(); applyTheme(); render(); updXP(true); sfx('unpop'); toast('↩️ Geri alındı: '+u.label);
}

/* küçük yardımcılar */
function arm(el,label){ // iki dokunuşla onay: ilk dokunuş kurar, ikincisi uygular
  if(el.classList.contains('arm')) return true;
  const old=el.textContent; el.classList.add('arm'); el.textContent=label;
  clearTimeout(el._t); el._t=setTimeout(()=>{ el.classList.remove('arm'); el.textContent=old; },2500);
  return false;
}
function resizeImage(file,max=560){
  return new Promise((res,rej)=>{ const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const s=Math.min(1,max/Math.max(img.width,img.height)), c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg',.72)); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error('Görsel okunamadı')); }; img.src=url; });
}
function noteOf(k){ return S.notes[k]||(S.notes[k]={mood:0,text:''}); }
function cleanNote(k){ const n=S.notes[k]; if(n&&!n.mood&&!n.text&&!n.energy&&!n.stress&&!n.sleep&&!(n.grat||[]).some(Boolean)) delete S.notes[k]; }

/* eylemler */
const A={
  ...TA, ...XA, ...WA,
  go:el=>go(+el.dataset.go),
  yprev:()=>setYear(S.year-1), ynext:()=>setYear(S.year+1),
  theme:el=>setTheme(['light','pastel'].includes(S.theme)?'dark':'light',el),
  menu:()=>$('#menuDlg').showModal(),
  habits:()=>openHabits(),
  editHabit:el=>{ $('#detailDlg').close(); openHabits(el.dataset.id); },
  detail:el=>openDetail(el.dataset.id),
  vmode:el=>{ S.settings.view=el.dataset.v; save(); $$('.toolbar .seg button').forEach(b=>b.classList.toggle('on',b===el)); renderMonth(); },
  cat:el=>{ S.settings.cat=el.dataset.c; save(); $$('.toolbar .chip').forEach(b=>b.classList.toggle('on',b===el)); renderMonthBody(true); later(refreshMonth); },
  goToday:()=>{ const n=new Date(); if(S.year!==n.getFullYear()){ S.year=n.getFullYear(); rev++; save(); } view=-1; go(n.getMonth()); },
  dismissAlert:el=>{ alertDismissed=true; const a=el.closest('.alerts'); a.animate([{opacity:1},{opacity:0,transform:'translateY(-6px)'}],{duration:dur(250)}).finished.then(()=>a.remove()); },
  cell:el=>changeHabit(el.dataset.k,hab(el.dataset.h),'toggle',el),
  bulk:el=>bulkDay(el.dataset.k,el),
  day:el=>openDay(el.dataset.k),
  tcard:el=>{ const h=hab(el.dataset.h); changeHabit(todayKey(),h,h.target?'inc':'toggle',el); },
  tinc:el=>changeHabit(todayKey(),hab(el.dataset.h),'inc',el.closest('.tcard')),
  tdec:el=>changeHabit(todayKey(),hab(el.dataset.h),'dec',el.closest('.tcard')),
  mood:el=>{ const n=noteOf(dayK), v=+el.dataset.v; n.mood=n.mood===v?0:v; cleanNote(dayK); onData([dayK]); if(n.mood) sfx('tick'); },
  dtog:el=>changeHabit(dayK,hab(el.dataset.h),'toggle',el),
  photoDel:()=>{ delete S.photos[dayK]; onData([dayK]); renderCollage(); },
  joker:()=>{ if(!S.jokers[dayK]&&jokersInWeek(dayK)>=1){ toast('🃏 Bu haftanın joker hakkı kullanıldı'); return; }
    if(S.jokers[dayK]) delete S.jokers[dayK]; else { S.jokers[dayK]=1; toast('🃏 Joker gün: bu gün oranları düşürmez, seriyi bozmaz'); }
    onData([dayK]); },
  freeze:()=>{ if(!S.freezes[dayK]&&freezesInMonth(dayK)>=2){ toast('❄️ Bu ayın 2 dondurma hakkı kullanıldı'); return; }
    if(S.freezes[dayK]) delete S.freezes[dayK]; else { S.freezes[dayK]=1; toast('❄️ Seri donduruldu: bu gün serileri bozmaz'); }
    onData([dayK]); },
  qedit:()=>{ const f=$('#quote');
    f.innerHTML=`<span class="eyebrow">Kendi sözünü yaz</span><textarea id="qIn" maxlength="300" rows="4" aria-label="Motivasyon sözü" placeholder="Söz — Yazar">${esc(quoteText()[0])}</textarea>
      <div class="qrow"><button class="btn" data-a="qsave">Kaydet</button><button class="btn ghost" data-a="qreset">Varsayılan</button><button class="btn ghost" data-a="qcancel">İptal</button></div>`;
    $('#qIn').focus(); },
  qsave:()=>{ const v=$('#qIn').value.trim(); if(v) S.quotes[qKey()]=v.slice(0,300); else delete S.quotes[qKey()]; save(); swapQuote(); },
  qreset:()=>{ delete S.quotes[qKey()]; save(); swapQuote(); },
  qcancel:()=>swapQuote(),
  qshuffle:()=>{ const c=quoteText()[0], pool=[...QUOTES,...QUOTES_TOUGH,...QUOTES_CHEER].filter(q=>q!==c); S.quotes[qKey()]=pool[Math.floor(Math.random()*pool.length)]; save(); swapQuote(); },
  mode:el=>{ chartMode=el.dataset.mode; $$('.seg button[data-mode]').forEach(b=>b.classList.toggle('on',b===el)); drawChart(); },
  gchk:el=>{ const g=goalOf(el), li=el.closest('li'); g.done=!g.done; rev++; save();
    li.classList.toggle('done',g.done); el.setAttribute('aria-pressed',g.done);
    if(g.done){ const r=el.getBoundingClientRect(); burst(r.left+12,r.top+12,18); sfx('win'); floatText(r.left+12,r.top,'+100 XP'); }
    updGoals(); updXP(true); setTimeout(()=>{ checkAch(false); checkLevel(false); },300); },
  gdel:el=>{ const g=goalOf(el), li=el.closest('li'), before=JSON.stringify(S); S.goals=S.goals.filter(x=>x!==g); pushUndo('Hedef silindi',[{full:before}]); rev++; save(); updGoals(); updXP(true);
    li.animate([{opacity:1},{opacity:0,transform:'translateX(24px) scale(.96)'}],{duration:dur(260),easing:'ease-in'}).finished.then(()=>li.remove()); },
  gtxt:el=>{ if(el.querySelector('input')) return; const g=goalOf(el), inp=document.createElement('input');
    inp.className='gin'; inp.value=g.text; inp.maxLength=120; el.textContent=''; el.appendChild(inp); inp.focus(); inp.select();
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } if(e.key==='Escape'){ inp.dataset.cancel=1; inp.blur(); } e.stopPropagation(); });
    inp.addEventListener('blur',()=>{ const v=inp.value.trim(); if(!inp.dataset.cancel&&v){ g.text=v; save(); } el.textContent=g.text; },{once:true}); },
  glink:el=>{ const li=el.closest('li'), g=goalOf(el), ex=li.querySelector('.gedit'); if(ex){ ex.remove(); return; }
    if(!active().length){ toast('Önce bir alışkanlık ekle'); return; }
    li.insertAdjacentHTML('beforeend',`<div class="gedit"><select class="gl-h" aria-label="Bağlanacak alışkanlık">${active().map(h=>`<option value="${esc(h.id)}"${g.habitId===h.id?' selected':''}>${esc(iconText(h.icon))} ${esc(h.name)}</option>`).join('')}</select><input type="number" class="gl-n" min="1" max="10000" value="${g.target||100}" aria-label="Yıllık hedef sayı"><button type="button" class="btn sm" data-a="glsave">Bağla</button>${g.habitId?'<button type="button" class="btn ghost sm" data-a="glrm">Bağı kaldır</button>':''}</div>`); },
  glsave:el=>{ const li=el.closest('li'), g=goalOf(el); g.habitId=li.querySelector('.gl-h').value; g.target=clampInt(li.querySelector('.gl-n').value,1,10000,100); rev++; save(); li.outerHTML=goalLi(g); autoGoals(); updGoals(); },
  glrm:el=>{ const li=el.closest('li'), g=goalOf(el); g.habitId=''; g.target=0; save(); li.outerHTML=goalLi(g); },
  wrapped:()=>openWrapped(), wrClose:()=>closeWrapped(),
  report:()=>openReport(),
  qslip:el=>{ if(!arm(el,'Emin misin? Tekrar dokun')) return; const q=S.quits.find(x=>x.id===el.closest('.qcard').dataset.id), tk=todayKey();
    q.best=Math.max(q.best,daysBetween(q.start,tk)); q.start=tk; rev++; save(); toast('Sorun değil — yeniden başlamak da cesarettir 💪'); render(); },
  qdel:el=>{ if(!arm(el,'Sil?')) return; const id=el.closest('.qcard').dataset.id, before=JSON.stringify(S); S.quits=S.quits.filter(x=>x.id!==id); pushUndo('Takip silindi',[{full:before}]); rev++; save(); render(); },
  undo:()=>undo(),
  closeLvl:()=>$('#lvlUp').classList.remove('show'),
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el||!A[el.dataset.a]||el.disabled) return;
  if(el.tagName==='BUTTON'&&el.type==='submit'&&el.form&&el.form.method==='dialog'&&el.dataset.a) e.preventDefault();
  A[el.dataset.a](el,e);
});
document.addEventListener('contextmenu',e=>{ // sağ tık / uzun bas: sayısal hücreye değer gir
  const el=e.target.closest('.cell.num'); if(!el||el.disabled) return; e.preventDefault();
  const h=hab(el.dataset.h), k=el.dataset.k, [,m,d]=pk(k);
  const v=prompt(`${h.name} · ${d} ${MONTHS[m]}\nDeğer gir (hedef ${h.target} ${h.unit}):`,valOf(k,h.id)); if(v==null) return;
  const n=parseFloat(v.replace(',','.')); if(!Number.isFinite(n)||n<0){ toast('Geçersiz sayı'); return; }
  changeHabit(k,h,'set',el,n);
});
document.addEventListener('keydown',e=>{
  const t=e.target, typing=t.matches?.('input,textarea,select,[contenteditable]'), dlg=document.querySelector('dialog[open]');
  if(WZ) return; // kurulum sihirbazı açıkken kısayollar kapalı
  if(e.key==='Escape'&&(FQ||BR)){ if(BR) closeBreath(); else closeFocus(); return; }
  if(WR){ if(e.key==='Escape') closeWrapped(); else if(e.key==='ArrowRight') showSlide(WR.i+1); else if(e.key==='ArrowLeft') showSlide(WR.i-1); return; }
  if((e.key==='Enter'||e.key===' ')&&t.matches?.('[data-a]:not(button):not(input)')){ e.preventDefault(); t.click(); return; }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!typing){ e.preventDefault(); undo(); return; }
  if(typing||dlg||e.ctrlKey||e.metaKey||e.altKey) return;
  if(e.key==='ArrowRight'&&t===document.body) go(Math.min(LASTV,view+1));
  if(e.key==='ArrowLeft'&&t===document.body) go(Math.max(0,view-1));
  if(/^[1-9]$/.test(e.key)){ // hızlı giriş: 1–9 bugünün alışkanlıkları
    const h=active()[+e.key-1]; if(!h) return; const k=todayKey();
    const origin=$(`.cell[data-k="${k}"][data-h="${CSS.escape(h.id)}"]`)||$(`.tcard[data-h="${CSS.escape(h.id)}"]`);
    if(changeHabit(k,h,'toggle',origin)&&!origin) toast(`${iconText(h.icon)} ${h.name}: ${isOn(k,h.id)?'✅ tamamlandı':h.target?`${fmt(valOf(k,h.id))}/${h.target}`:'işaret kaldırıldı'}`);
  }
});
document.addEventListener('submit',e=>{
  if(e.target.id==='goalForm'){
    e.preventDefault(); const inp=$('#goalIn'), t=inp.value.trim(); if(!t){ shake(inp); return; }
    const g={id:uid(),text:t.slice(0,120),done:false,habitId:'',target:0}; S.goals.push(g); save();
    const ul=$('#goals'); ul.insertAdjacentHTML('beforeend',goalLi(g));
    ul.lastElementChild.animate([{opacity:0,transform:'translateY(8px) scale(.97)'},{opacity:1,transform:'none'}],{duration:dur(380),easing:'cubic-bezier(.2,.9,.3,1.2)'});
    ul.scrollTop=ul.scrollHeight; inp.value=''; updGoals();
  } else if(e.target.id==='quitForm'){
    e.preventDefault(); const nm=$('#quitName'), name=nm.value.trim(); if(!name){ shake(nm); return; }
    S.quits.push({id:uid(),name:name.slice(0,60),icon:($('#quitIcon').value.trim()||'🚫').slice(0,12),start:todayKey(),best:0}); rev++; save(); render(); sfx('pop');
  }
});
// gün penceresi: not yazımı ve fotoğraf
let noteT;
$('#dayForm').addEventListener('input',e=>{
  if(e.target.id!=='dayNote') return;
  noteOf(dayK).text=e.target.value.slice(0,500); cleanNote(dayK); rev++; save(); updNote(dayK);
  clearTimeout(noteT); noteT=setTimeout(()=>{ checkQuests(); updXP(true); },600);
});
$('#dayForm').addEventListener('change',async e=>{
  if(e.target.id!=='photoIn') return;
  const f=e.target.files[0]; if(!f) return;
  try{ S.photos[dayK]=await resizeImage(f); onData([dayK]); renderCollage(); sfx('ding'); }catch(err){ toast('⚠️ '+err.message); }
});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{ if(e.target===d) d.close(); }));
$('#view').addEventListener('change',e=>{ // ay karşılaştırma seçimleri
  if(e.target.id!=='cmpA'&&e.target.id!=='cmpB') return;
  if(e.target.id==='cmpA') cmpA=+e.target.value; else cmpB=+e.target.value;
  $('#cmpBox').innerHTML=compareHTML();
});
// mobil: yatay kaydırma ile sayfa değiştir
let sx=null;
$('#view').addEventListener('touchstart',e=>{ sx=e.target.closest('.grid-scroll,.heat-wrap,.garden,.tscroll,.chart,.ba,.hheat,.pixels,input,textarea,select')?null:[e.touches[0].clientX,e.touches[0].clientY]; },{passive:true});
$('#view').addEventListener('touchend',e=>{
  if(!sx) return; const dx=e.changedTouches[0].clientX-sx[0], dy=e.changedTouches[0].clientY-sx[1]; sx=null;
  if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6) go(Math.max(0,Math.min(LASTV,view+(dx<0?1:-1))));
},{passive:true});

/* self-test (index.html#test) */
function selfTest(){
  const ok=(c,m)=>{ if(!c) throw new Error('Self-test başarısız: '+m); };
  ok(dim(2024,1)===29&&dim(2026,1)===28&&dim(2026,10)===30,'ay gün sayıları');
  const w=weeks(2026,10); ok(w[0].len===1&&w[1].start===2&&w.reduce((s,x)=>s+x.len,0)===30,'haftalar');
  ok(RANKS[rankOf(0)].name==='Başlangıç'&&RANKS[rankOf(100)].name==='İstikrarlı'&&RANKS[rankOf(2500)].name==='Efsane','rütbeler');
  ok(levelFromXP(0)===1&&levelFromXP(199)===1&&levelFromXP(200)===2&&levelFromXP(599)===2&&levelFromXP(600)===3,'XP seviyesi');
  ok(csvRow('2026-01-01;"a;""b""";x',';')[1]==='a;"b"','csv ayrıştırma'); ok(csvCell('=1+1')==="'=1+1",'csv formül koruması');
  const v=validate({habits:[{id:'x',name:'<b>'}],checks:{bad:['x'],'2026-01-01':['x','zz','x']},photos:{'2026-01-01':'javascript:alert(1)'}});
  ok(v&&Object.keys(v.checks).length===1&&v.checks['2026-01-01'].length===1&&!Object.keys(v.photos).length,'doğrulama');
  ok(validate({habits:'x'})===null,'geçersiz veri reddi');
  ok(mondayOf('2026-11-29')==='2026-11-23'&&addDays('2026-12-31',1)==='2027-01-01','tarih yardımcıları');
  const saved=S, t=todayKey(), d=n=>addDays(t,-n);
  try{
    S={...blankState(),habits:[normHabit({id:'a',name:'A'},0),normHabit({id:'b',name:'B',days:[1]},1),normHabit({id:'n',name:'N',target:3},2)],checks:{},vals:{}}; rev++;
    ok(schedK(S.habits[1],'2026-11-23')&&!schedK(S.habits[1],'2026-11-24'),'planlı günler');
    S.checks={[d(1)]:['a'],[d(2)]:['a'],[d(3)]:['a'],[d(5)]:['a']}; rev++;
    ok(streaks(S.habits[0]).cur===3,'seri'); S.freezes={[d(4)]:1}; rev++; ok(streaks(S.habits[0]).cur===4,'seri dondurma');
    S.freezes={}; S.jokers={[d(4)]:1}; rev++; ok(streaks(S.habits[0]).cur===4&&dayStat(d(4)).s===0,'joker gün');
    setVal(t,S.habits[2],2); ok(!isOn(t,'n'),'sayısal: hedef altı'); setVal(t,S.habits[2],3); ok(isOn(t,'n'),'sayısal: hedef'); rev++;
    S.checks={'2026-11-02':['a','b'],'2026-11-03':['a']}; S.vals={}; S.jokers={}; rev++;
    const st=monthStats(2026,10); ok(st.ticks===3&&st.per.a===2&&st.ds.b===1&&st.poss.b===5,'aylık istatistik (planlı)');
    ok(importCSV('tarih;alışkanlık;ikon\n2026-11-05;B;x\n2026-11-05;Yeni;🎯\nbozuk')===2&&S.habits.length===4,'csv içe aktarma');
    rev++; ok(questsFor('2026-11-05').length===3&&questsFor('2026-11-05')[0].text===questsFor('2026-11-05')[0].text,'günlük görevler');
    // haftada X kez: 2000-01-03 pazartesi; salı yapıldı → kalan 1 kota haftanın son günü kaçırılmış sayılır
    S={...blankState(),habits:[normHabit({id:'w',name:'W',weekly:2},0),normHabit({id:'a',name:'A'},1),normHabit({id:'p',name:'P',target:5,step:2,stepMax:9,pstart:'2000-01-01'},2),normHabit({id:'s',name:'S',subs:['x','y']},3)],checks:{'2000-01-04':['w']},vals:{}}; rev++;
    ok(schedK(S.habits[0],'2000-01-04')&&schedK(S.habits[0],'2000-01-09')&&!schedK(S.habits[0],'2000-01-05'),'haftada X kez');
    S.vacations=[{id:'v',from:'2000-01-05',to:'2000-01-06',name:''}]; rev++; ok(!schedK(S.habits[1],'2000-01-05')&&schedK(S.habits[1],'2000-01-07')&&dayStat('2000-01-06').vac,'tatil modu');
    ok(tgtK(S.habits[2],'2000-01-01')===5&&tgtK(S.habits[2],'2000-01-08')===7&&tgtK(S.habits[2],'2000-02-20')===9,'kademeli hedef');
    setSub('2000-01-10',S.habits[3],0,true); ok(!isOn('2000-01-10','s'),'alt görev: eksik'); setSub('2000-01-10',S.habits[3],1,true); ok(isOn('2000-01-10','s'),'alt görev: tamam');
    setDone('2000-01-10','s',false); ok(!S.subd['2000-01-10'],'alt görev temizliği'); rev++;
    S.challenges=[{id:'c',name:'C',icon:'🏁',habitId:'a',days:3,start:'2000-01-10'}]; S.checks['2000-01-10']=['a']; S.checks['2000-01-11']=['a']; rev++;
    ok(chalStat(S.challenges[0]).failed&&chalStat(S.challenges[0]).ok===2,'meydan okuma');
    S.habits[1].created='2000-01-08'; rev++; ok(!schedK(S.habits[1],'2000-01-07')&&schedK(S.habits[1],'2000-01-08'),'başlangıç tarihi'); setDone('2000-01-03','a',true); ok(S.habits[1].created==='2000-01-03','geçmişe işaret'); S.habits[1].created=''; rev++;
    ok(qrMake('hello').length===21&&qrMake('x'.repeat(3000))===null,'QR boyutu');
    selfTestAsync(JSON.parse(JSON.stringify(S)));
  } finally { S=saved; rev++; }
  console.log('✅ Self-test geçti'); toast('✅ Self-test geçti');
}
async function selfTestAsync(st){ // aktarım paketinin gidiş-dönüşü (global S'e dokunmaz)
  const norm=s=>{ const nm=id=>s.habits.find(h=>h.id===id)?.name; return JSON.stringify(Object.keys(s.checks).sort().map(k=>[k,s.checks[k].map(nm).sort()])); }; // kimlikler seviye≥1'de kısalır, adlarla karşılaştır
  const src=validate(st), want=norm(src);
  for(const lv of [0,1,2,3]){ const o=unpackState(JSON.parse(await unpackStr(await packState(lv,src)))); if(!o||(lv<3&&norm(o)!==want)) throw new Error('Self-test başarısız: QR aktarım paketi (seviye '+lv+')'); }
  console.log('✅ Aktarım self-testi geçti');
}

/* başlangıç */
applyTheme(); $('#profName').textContent='👤 '+profName();
render(); checkAch(true); checkLevel(true); updXP(false); checkQuests(); save();
maybeOnboard(); autoReport(); startReminders(); registerSW(); handleHash(); checkLetters();
setTimeout(autoBackup,4000); setInterval(autoBackup,6*36e5);
if(location.hash==='#test') selfTest();

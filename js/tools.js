'use strict';
/* ===== Alışkanlık yöneticisi, zamanlayıcı, içe/dışa aktarma, paylaş, yazdır, ayarlar, profiller ===== */
let hDirty=false, newIcon='✨';
function pickerHTML(target){
  return EMOJIS.map(e=>`<button type="button" data-a="pick" data-t="${esc(target)}" data-v="${e}" aria-label="${e}">${e}</button>`).join('')
    +Object.keys(ICONS).map(n=>`<button type="button" data-a="pick" data-t="${esc(target)}" data-v="i:${n}" aria-label="${n} ikonu">${iconHTML('i:'+n)}</button>`).join('');
}
function hLi(h){
  return `<li data-id="${esc(h.id)}" style="--h:${h.hue}"><div class="hrow">
    <button type="button" class="ibtn" data-a="hmore" aria-label="İkon ve ayarlar">${iconHTML(h.icon)}</button>
    <input class="hi-name" data-f="name" value="${esc(h.name)}" maxlength="60" aria-label="Alışkanlık adı">
    <button type="button" class="hue" data-a="hue" aria-label="Rengi değiştir"></button>
    <button type="button" class="mini-btn" data-a="hup" aria-label="Yukarı taşı">↑</button><button type="button" class="mini-btn" data-a="hdown" aria-label="Aşağı taşı">↓</button>
    <button type="button" class="mini-btn" data-a="hmore" aria-label="Ayrıntılı ayarlar">⚙</button>
    <button type="button" class="mini-btn" data-a="harch" aria-label="Arşivle" data-tip="Arşivle (veriler korunur)">📦</button>
    <button type="button" class="mini-btn del" data-a="hdel" aria-label="Sil">🗑</button></div>
  <div class="hmore">
    <div class="frow"><label>İkon</label><div class="picker">${pickerHTML(h.id)}</div></div>
    <div class="frow"><label>Kendi emojin</label><input class="unit" data-f="icon" value="${h.icon.startsWith('i:')?'':esc(h.icon)}" maxlength="12" aria-label="Emoji"></div>
    <div class="frow"><label>Günler</label><div class="daych">${WEEK.map(w=>`<button type="button" class="${h.days.includes(w)?'on':''}" data-a="hday" data-w="${w}">${DAYN[w]}</button>`).join('')}</div></div>
    <div class="frow"><label>Kategori</label><select data-f="cat" aria-label="Kategori"><option value="">—</option>${CATS.map(([c,l])=>`<option value="${c}"${h.cat===c?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="frow"><label>Zorluk</label><div class="seg">${[1,2,3].map(d=>`<button type="button" data-a="hdiff" data-v="${d}" class="${h.diff===d?'on':''}">${DIFFS[d]} · ${d*10} XP</button>`).join('')}</div></div>
    <div class="frow"><label>Sayısal hedef</label><input type="number" min="0" max="10000" data-f="target" value="${h.target||''}" placeholder="yok" aria-label="Günlük hedef sayısı"><input class="unit" data-f="unit" value="${esc(h.unit)}" placeholder="birim (lt, dk…)" maxlength="12" aria-label="Birim"></div>
    <div class="frow"><label>Artış</label><input type="number" min="0" max="10000" data-f="inc" value="${h.inc||''}" placeholder="${h.target?stepOf(h):'otomatik'}" aria-label="Her dokunuşta eklenecek miktar"><span class="sub">her ＋ dokunuşunda eklenir</span></div>
    <div class="frow"><label>Zamanlayıcı</label><input type="number" min="0" max="240" data-f="timer" value="${h.timer||''}" placeholder="yok" aria-label="Zamanlayıcı dakikası"> dakika</div>
    <div class="frow"><label>Sıklık</label><select data-f="weekly" aria-label="Haftalık sıklık"><option value="0">Seçili her gün</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}"${h.weekly===n?' selected':''}>Haftada ${n} kez (gün serbest)</option>`).join('')}</select></div>
    <div class="frow"><label>Rutin</label><select data-f="slot" aria-label="Rutin zamanı"><option value="">—</option>${SLOTS.map(([s,l])=>`<option value="${s}"${h.slot===s?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="frow"><label>Zincir</label><select data-f="after" aria-label="Hangi alışkanlıktan sonra"><option value="">— bağımsız —</option>${S.habits.filter(x=>x.id!==h.id&&!x.archived).map(x=>`<option value="${esc(x.id)}"${h.after===x.id?' selected':''}>${esc(iconText(x.icon))} ${esc(x.name)} sonrası</option>`).join('')}</select></div>
    <div class="frow"><label>Alt görevler</label><textarea data-f="subs" rows="2" maxlength="400" placeholder="Her satıra bir adım (en fazla 8)" aria-label="Alt görevler">${esc(h.subs.join('\n'))}</textarea></div>
    <div class="frow"><label>Kademeli</label><span class="sub">her hafta +</span><input type="number" min="0" max="1000" data-f="step" value="${h.step||''}" placeholder="0" aria-label="Haftalık artış"><span class="sub">en fazla</span><input type="number" min="0" max="10000" data-f="stepMax" value="${h.stepMax||''}" placeholder="∞" aria-label="Üst sınır">${h.step&&h.target?`<span class="sub">bugün: ${tgtK(h,todayKey())}</span>`:''}</div>
    <div class="frow"><label>Deneme</label><input type="number" min="0" max="365" data-f="trial" value="${h.trial||''}" placeholder="yok" aria-label="Deneme süresi"> gün${h.trial&&h.tstart?` <span class="sub">· bitiş ${trialEnd(h)}</span>`:''}</div>
  </div></li>`;
}
function renderHabitDlg(focusId){
  const arch=S.habits.filter(h=>h.archived);
  $('#habitForm').innerHTML=`<h3>Alışkanlıklarını Yönet</h3>
    <p class="note">İsmi yerinde düzenle, ↑↓ ile sırala, ⚙ ile ikon, günler, kategori, zorluk, sayısal hedef ve zamanlayıcıyı ayarla.</p>
    <ul class="hlist" id="hlist">${active().map(hLi).join('')}</ul>
    <div class="add-row"><span class="ibtn" id="newIconBtn">${iconHTML(newIcon)}</span><input id="newName" class="hi-name" maxlength="60" placeholder="Yeni alışkanlık…" aria-label="Yeni alışkanlık adı"><button type="button" class="btn" data-a="hadd">Ekle</button></div>
    <div class="picker">${pickerHTML('new')}</div>
    <h4>Hazır paketler</h4><div class="tpls">${Object.keys(TEMPLATES).map(t=>`<button type="button" class="chip" data-a="tpl" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    ${arch.length?`<h4>📦 Arşiv</h4><ul class="hlist">${arch.map(h=>`<li data-id="${esc(h.id)}" style="--h:${h.hue}"><div class="hrow"><span class="ibtn">${iconHTML(h.icon)}</span><span class="hi-name" style="padding:0 6px">${esc(h.name)}</span><button type="button" class="btn ghost sm" data-a="hrestore">↩ Geri getir</button><button type="button" class="mini-btn del" data-a="hdel" aria-label="Kalıcı sil">🗑</button></div></li>`).join('')}</ul>`:''}
    <footer><button class="btn" value="close">Bitti</button></footer>`;
  if(focusId){ const li=$(`#hlist li[data-id="${CSS.escape(focusId)}"]`); if(li){ li.classList.add('open'); later(()=>li.scrollIntoView({block:'center'})); li.querySelector('.hi-name').focus(); } }
}
function openHabits(focusId){ renderHabitDlg(focusId); const d=$('#habitDlg'); if(!d.open) d.showModal(); if(!focusId) $('#newName').focus(); }
const habitOf=el=>hab(el.closest('li').dataset.id);
$('#habitForm').addEventListener('input',e=>{
  const f=e.target.dataset.f, h=f&&habitOf(e.target); if(!h) return;
  const raw=e.target.value.trim();
  if(f==='name'||f==='icon'){ if(!raw) return; h[f]=raw.slice(0,f==='icon'?12:60); if(f==='icon') e.target.closest('li').querySelector('.ibtn').innerHTML=iconHTML(h.icon); }
  else if(f==='cat') h.cat=raw;
  else if(f==='unit') h.unit=raw.slice(0,12);
  else if(f==='target') h.target=clampInt(raw||0,0,10000,0);
  else if(f==='inc') h.inc=clampInt(raw||0,0,10000,0);
  else if(f==='timer') h.timer=clampInt(raw||0,0,240,0);
  else if(f==='weekly') h.weekly=clampInt(raw||0,0,7,0);
  else if(f==='slot') h.slot=SLOTS.some(s=>s[0]===raw)?raw:'';
  else if(f==='after'){ let p=hab(raw), loop=false; for(let i=0;p&&i<60;i++){ if(p.id===h.id){ loop=true; break; } p=hab(p.after); }
    if(loop){ toast('Döngüsel zincir kurulamaz'); e.target.value=h.after; return; } h.after=raw&&hab(raw)?raw:''; }
  else if(f==='subs') h.subs=e.target.value.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>x.slice(0,40)).slice(0,8);
  else if(f==='step'){ h.step=clampInt(raw||0,0,1000,0); if(h.step&&!h.pstart) h.pstart=todayKey(); if(!h.step) h.pstart=''; }
  else if(f==='stepMax') h.stepMax=clampInt(raw||0,0,10000,0);
  else if(f==='trial'){ h.trial=clampInt(raw||0,0,365,0); h.tstart=h.trial?(h.tstart||todayKey()):''; }
  hDirty=true; rev++; save();
});
$('#habitForm').addEventListener('keydown',e=>{ if(e.key!=='Enter'||e.target.tagName!=='INPUT') return; e.preventDefault(); if(e.target.id==='newName') TA.hadd(); });
$('#habitDlg').addEventListener('close',()=>{ if(hDirty){ hDirty=false; rev++; render(); updXP(); } });
function moveHabit(el,dir){
  const h=habitOf(el), list=active(), i=list.indexOf(h), j=i+dir; if(j<0||j>=list.length) return;
  const a=S.habits.indexOf(h), b=S.habits.indexOf(list[j]); [S.habits[a],S.habits[b]]=[S.habits[b],S.habits[a]]; hDirty=true; save();
  const li=el.closest('li'); flip($('#hlist'),()=>dir<0?li.previousElementSibling.before(li):li.nextElementSibling.after(li)); el.focus();
}

/* zamanlayıcı (pomodoro) */
let TM=null, tmI=0;
function startTimer(h){
  if(!h||!h.timer) return;
  TM={hid:h.id,total:h.timer*60000,end:Date.now()+h.timer*60000,left:0,paused:false};
  $('#twName').textContent=`${iconText(h.icon)} ${h.name}`; $('#timerW').classList.add('show'); $('#twPause').textContent='⏸';
  clearInterval(tmI); tmI=setInterval(timerTick,250); timerTick(); sfx('tick');
  if('Notification' in window&&Notification.permission==='default') Notification.requestPermission();
}
function timerTick(){
  if(!TM) return;
  const left=TM.paused?TM.left:Math.max(0,TM.end-Date.now());
  $('#twTime').textContent=`${pad(Math.floor(left/60000))}:${pad(Math.floor(left/1000)%60)}`;
  $('#twRing').style.strokeDashoffset=C*(left/TM.total);
  if(left<=0&&!TM.paused) timerDone();
}
function timerDone(){
  const h=hab(TM.hid), k=todayKey(); clearInterval(tmI); TM=null;
  if(h){
    if(h.target&&/dk|dakika|min/i.test(h.unit)) changeHabit(k,h,'set',$('#timerW'),valOf(k,h.id)+h.timer); else changeHabit(k,h,'on',$('#timerW'));
    notify(`⏰ ${h.name} süresi doldu — tamamlandı olarak işaretlendi!`); sfx('win'); rain(80);
  }
  setTimeout(()=>$('#timerW').classList.remove('show'),2500);
}

/* bildirim ve hatırlatıcı */
function notify(msg){
  toast(msg);
  if(!('Notification' in window)||Notification.permission!=='granted') return;
  try{ new Notification('Alışkanlık Takvimi',{body:msg,icon:'icon.svg'}); }
  catch(e){ navigator.serviceWorker?.ready.then(r=>r.showNotification('Alışkanlık Takvimi',{body:msg,icon:'icon.svg'})).catch(()=>{}); }
}
let remDone='';
function startReminders(){
  // shortcut: hatırlatıcı yalnızca sayfa açıkken çalışır; kapalıyken bildirim için sunucu taraflı push gerekir
  setInterval(()=>{
    const r=S.settings.reminder, tk=todayKey(); if(!r||remDone===tk||hhmm()<r) return;
    remDone=tk; const ds=dayStat(tk), left=ds.s-ds.c;
    if(left>0) notify(`Bugün ${left} alışkanlık seni bekliyor 💪`);
  },30000);
}

/* dışa / içe aktarma */
function download(name,data,type){
  const url=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type})), a=Object.assign(document.createElement('a'),{href:url,download:name});
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
}
const stamp=()=>todayKey();
function csvCell(v){ v=String(v); if(/^[=+\-@]/.test(v)) v="'"+v; return /[";,\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v; } // ' öneki: Excel formül enjeksiyonunu engeller
function csvRow(line,sep){
  const out=[]; let cur='', q=false;
  for(let i=0;i<line.length;i++){ const c=line[i];
    if(q){ if(c==='"'){ if(line[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=c; }
    else if(c==='"') q=true; else if(c===sep){ out.push(cur); cur=''; } else cur+=c; }
  out.push(cur); return out;
}
function importCSV(text){
  const lines=text.replace(/^﻿/,'').split(/\r?\n/).filter(l=>l.trim()); if(!lines.length) return 0;
  const sep=lines[0].includes(';')?';':','; let n=0;
  for(const line of lines){
    const [date,rawName,icon,val]=csvRow(line,sep).map(s=>(s||'').trim()), name=(rawName||'').replace(/^'/,'');
    if(!DK.test(date||'')||!name) continue; // başlık ve bozuk satırlar atlanır
    const h=findOrCreateHabit(name,icon), v=parseFloat(String(val||'').replace(',','.'));
    if(h.target&&v>0){ if(valOf(date,h.id)!==v){ setVal(date,h,v); n++; } }
    else if(!isOn(date,h.id)){ setDone(date,h.id,true); n++; }
  }
  return n;
}
// .xlsx = zip: tarayıcının yerleşik DecompressionStream'i ile açılır, ek kütüphane gerekmez
async function unzip(buf){
  const dv=new DataView(buf), u8=new Uint8Array(buf), td=new TextDecoder();
  let e=buf.byteLength-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw new Error('Zip değil');
  const n=dv.getUint16(e+10,true), files={}; let p=dv.getUint32(e+16,true);
  for(let i=0;i<n;i++){
    if(dv.getUint32(p,true)!==0x02014b50) throw new Error('Bozuk zip');
    const nl=dv.getUint16(p+28,true), xl=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true);
    files[td.decode(u8.subarray(p+46,p+46+nl))]={method:dv.getUint16(p+10,true),size:dv.getUint32(p+20,true),off:dv.getUint32(p+42,true)};
    p+=46+nl+xl+cl;
  }
  return async name=>{
    const f=files[name]; if(!f) return null;
    const st=f.off+30+dv.getUint16(f.off+26,true)+dv.getUint16(f.off+28,true), data=u8.subarray(st,st+f.size);
    if(f.method===0) return td.decode(data);
    if(f.method!==8) throw new Error('Desteklenmeyen sıkıştırma');
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
}
async function importXLSX(buf){
  if(typeof DecompressionStream==='undefined') throw new Error('Tarayıcın .xlsx açmayı desteklemiyor');
  const read=await unzip(buf), xml=s=>new DOMParser().parseFromString(s,'application/xml');
  const wbTxt=await read('xl/workbook.xml'), relTxt=await read('xl/_rels/workbook.xml.rels'); if(!wbTxt||!relTxt) throw new Error('Excel dosyası değil');
  const ssTxt=await read('xl/sharedStrings.xml');
  const strings=ssTxt?[...xml(ssTxt).getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join('')):[];
  const rel={}; for(const r of xml(relTxt).getElementsByTagName('Relationship')) rel[r.getAttribute('Id')]=r.getAttribute('Target');
  let added=0, months=0;
  for(const sh of xml(wbTxt).getElementsByTagName('sheet')){
    const m=MONTHS.findIndex(x=>x.toLocaleUpperCase('tr')===(sh.getAttribute('name')||'').trim().toLocaleUpperCase('tr')); if(m<0) continue;
    const tgt=rel[sh.getAttribute('r:id')]; if(!tgt) continue;
    const sx=await read('xl/'+tgt.replace(/^\/?(xl\/)?/,'')); if(!sx) continue;
    const rows={};
    for(const c of xml(sx).getElementsByTagName('c')){
      const mm=/^([A-Z]+)(\d+)$/.exec(c.getAttribute('r')||''); if(!mm) continue;
      const t=c.getAttribute('t'), v=c.getElementsByTagName('v')[0]?.textContent;
      const val=t==='s'?strings[+v]:t==='b'?v==='1':t==='inlineStr'?c.textContent:v==null?null:isNaN(+v)?v:+v;
      (rows[mm[2]]||(rows[mm[2]]={}))[mm[1]]=val;
    }
    let dayCol=null; // gün numaralarının (1..31) yazdığı satır sütun→gün eşlemesini verir
    for(const r of Object.values(rows)){ const cs=Object.entries(r).filter(([,v])=>Number.isInteger(v)&&v>=1&&v<=31); if(cs.length>=28){ dayCol=Object.fromEntries(cs); break; } }
    if(!dayCol) continue; months++;
    for(const r of Object.values(rows)){
      const name=r.A; if(typeof name!=='string'||!name.trim()) continue;
      const bools=Object.entries(r).filter(([c,v])=>typeof v==='boolean'&&dayCol[c]); if(!bools.length) continue;
      const h=findOrCreateHabit(name);
      for(const [c,v] of bools){ const d=dayCol[c]; if(!v||d>dim(S.year,m)) continue; const k=dkey(S.year,m,d); if(!isOn(k,h.id)){ setDone(k,h.id,true); added++; } }
    }
  }
  return {added,months};
}
let fileMode=null;
$('#fileIn').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f) return;
  if(f.size>15e6){ toast('⚠️ Dosya çok büyük'); return; }
  const before=JSON.stringify(S);
  try{
    if(fileMode==='json'){
      let s=null; try{ s=validate(JSON.parse(await f.text())); }catch(err){}
      if(!s){ toast('⚠️ Geçersiz yedek dosyası'); return; }
      if(!confirm('Bu profilin tüm verileri yedekle değiştirilsin mi?')) return;
      S=s; toast('✅ Yedek geri yüklendi');
    } else if(fileMode==='csv'){
      const n=importCSV(await f.text()); if(!n){ toast('⚠️ CSV içinde yeni işaret bulunamadı'); return; }
      toast(`📥 ${n} işaret içe aktarıldı`);
    } else {
      const r=await importXLSX(await f.arrayBuffer());
      if(!r.months){ toast('⚠️ Dosyada ay sayfası (OCAK, ŞUBAT…) bulunamadı'); return; }
      toast(`📗 ${r.months} ay okundu, ${r.added} işaret ${S.year} yılına eklendi`);
    }
  }catch(err){ toast('⚠️ İçe aktarılamadı: '+err.message); return; }
  pushUndo('İçe aktarma',[{full:before}]);
  rev++; flush(); applyTheme(); $('#menuDlg').close(); render(); updXP(); checkAch(false);
});

/* paylaşılabilir görsel (1080×1920) */
function wrapText(g,text,x,y,maxW,lh){
  const words=text.split(' '); let line='', yy=y;
  for(const w of words){ const t=line?line+' '+w:w; if(g.measureText(t).width>maxW&&line){ g.fillText(line,x,yy); line=w; yy+=lh; } else line=t; }
  if(line) g.fillText(line,x,yy); return yy;
}
async function shareImage(){
  await document.fonts?.ready;
  const y=S.year, m=view<12?view:new Date().getMonth(), st=monthStats(y,m), cs=getComputedStyle(document.documentElement);
  const acc=cs.getPropertyValue('--accent').trim()||'#8b7bff', acc2=cs.getPropertyValue('--accent-2').trim()||'#3dd6c6', F='"Plus Jakarta Sans",system-ui,sans-serif';
  const c=document.createElement('canvas'); c.width=1080; c.height=1920; const g=c.getContext('2d');
  let gr=g.createLinearGradient(0,0,1080,1920); gr.addColorStop(0,'#0b0d14'); gr.addColorStop(1,'#1b1433'); g.fillStyle=gr; g.fillRect(0,0,1080,1920);
  [[180,260,acc],[920,520,acc2],[540,1700,acc]].forEach(([x,yy,col])=>{ const r=g.createRadialGradient(x,yy,0,x,yy,520); r.addColorStop(0,col+'55'); r.addColorStop(1,col+'00'); g.fillStyle=r; g.fillRect(0,0,1080,1920); });
  g.fillStyle='#fff'; g.textAlign='center';
  g.font=`800 34px ${F}`; g.globalAlpha=.7; g.fillText('◆  ALIŞKANLIK TAKVİMİ',540,140); g.globalAlpha=1;
  g.font=`800 150px ${F}`; g.fillText(MONTHS[m].toLocaleUpperCase('tr'),540,320);
  g.font=`700 48px ${F}`; g.globalAlpha=.6; g.fillText(String(y),540,390); g.globalAlpha=1;
  g.lineWidth=46; g.lineCap='round'; g.strokeStyle='rgba(255,255,255,.08)'; g.beginPath(); g.arc(540,700,220,0,Math.PI*2); g.stroke();
  gr=g.createLinearGradient(320,480,760,920); gr.addColorStop(0,acc); gr.addColorStop(1,acc2); g.strokeStyle=gr;
  g.beginPath(); g.arc(540,700,220,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.001,st.rate)); g.stroke();
  g.font=`800 120px ${F}`; g.fillText('%'+fmt(st.rate*100),540,740); g.font=`700 34px ${F}`; g.globalAlpha=.7; g.fillText('tamamlandı',540,800); g.globalAlpha=1;
  const perfect=[...Array(st.days)].filter((_,i)=>dayStat(dkey(y,m,i+1)).perfect).length, bestS=Math.max(0,...active().map(h=>streaks(h).best));
  [[fmt(st.ticks),'tik'],[String(perfect),'mükemmel gün'],[String(bestS),'en uzun seri']].forEach(([v,l],i)=>{ const x=200+i*340; g.font=`800 76px ${F}`; g.fillText(v,x,1060); g.font=`600 30px ${F}`; g.globalAlpha=.65; g.fillText(l,x,1110); g.globalAlpha=1; });
  const top=[...active()].sort((a,b)=>st.per[b.id]-st.per[a.id]).slice(0,3);
  g.textAlign='left';
  top.forEach((h,i)=>{ const yy=1220+i*110, p=st.hRate(h.id); g.font=`700 38px ${F}`; g.fillStyle='#fff'; g.fillText(`${['🥇','🥈','🥉'][i]} ${iconText(h.icon)} ${h.name}`.slice(0,34),110,yy);
    g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(110,yy+22,860,18); g.fillStyle=`hsl(${h.hue} 80% 62%)`; g.fillRect(110,yy+22,860*p,18);
    g.fillStyle='#fff'; g.textAlign='right'; g.font=`800 36px ${F}`; g.fillText('%'+fmt(p*100),970,yy); g.textAlign='left'; });
  const [q]=quoteText(); g.textAlign='center'; g.font=`italic 600 36px ${F}`; g.globalAlpha=.85; wrapText(g,'“'+q.split(' — ')[0]+'”',540,1640,860,50); g.globalAlpha=1;
  g.font=`700 28px ${F}`; g.globalAlpha=.5; g.fillText('#AlışkanlıkTakvimi',540,1850); g.globalAlpha=1;
  c.toBlob(async b=>{
    if(!b) return; const file=new File([b],`aliskanlik-${y}-${pad(m+1)}.png`,{type:'image/png'});
    if(navigator.canShare?.({files:[file]})){ try{ await navigator.share({files:[file],title:`${MONTHS[m]} ${y} özetim`}); return; }catch(e){ if(e.name==='AbortError') return; } }
    download(file.name,b); toast('📸 Paylaşım görseli indirildi');
  },'image/png');
}

/* yazdırılabilir boş şablon */
function printMonth(){
  const y=S.year, m=view<12?view:new Date().getMonth(), days=dim(y,m), hs=active(), [q]=quoteText();
  let head='<tr><th>Alışkanlık</th>'; for(let d=1;d<=days;d++) head+=`<th>${DAYN[new Date(y,m,d).getDay()]}<br>${d}</th>`; head+='</tr>';
  const rows=hs.map(h=>`<tr><td>${esc(iconText(h.icon))} ${esc(h.name)}</td>${[...Array(days)].map((_,i)=>`<td class="${schedK(h,dkey(y,m,i+1))?'':'off'}"></td>`).join('')}</tr>`).join('');
  $('#print').innerHTML=`<h1>${MONTHS[m]} ${y}</h1><p>Alışkanlık Takvimi · çizgili kutular o gün planlı değil</p><table>${head}${rows}<tr><td>Günlük ilerleme</td>${'<td></td>'.repeat(days)}</tr></table><p class="q">“${esc(q)}”</p>`;
  window.print();
}

/* tema, ayarlar, profiller */
function applyTheme(){
  const r=document.documentElement; r.dataset.theme=S.theme;
  if(S.accent) r.style.setProperty('--accent',S.accent); else r.style.removeProperty('--accent');
  $('#themeBtn').textContent=['light','pastel'].includes(S.theme)?'☀️':'🌙';
  const t=THEMES.find(x=>x[0]===S.theme); $('meta[name=theme-color]').setAttribute('content',t?t[2]:'#11141d');
}
function setTheme(t,btn){
  S.theme=t; save();
  if(!document.startViewTransition||RM.matches||!btn){ applyTheme(); return; }
  const r=btn.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2, rad=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  document.startViewTransition(applyTheme).ready.then(()=>document.documentElement.animate(
    {clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${rad}px at ${x}px ${y}px)`]},{duration:600,easing:'cubic-bezier(.4,0,.2,1)',pseudoElement:'::view-transition-new(root)'})).catch(()=>{});
}
const profName=()=>P.list.find(p=>p.id===P.active)?.name||'Ben';
function renderSettings(){
  const perm='Notification' in window?{granted:'açık ✅',denied:'engellendi',default:'sorulmadı'}[Notification.permission]:'desteklenmiyor';
  const acc=S.accent||getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  $('#setForm').innerHTML=`<h3>Ayarlar</h3>
    <h4>Tema</h4><div class="themes">${THEMES.map(([t,l,c])=>`<button type="button" data-a="setTheme" data-t="${t}" class="${S.theme===t?'on':''}" style="background:${c};color:${['light','pastel'].includes(t)?'#222':'#fff'}">${l}</button>`).join('')}</div>
    <label class="toggle">🎨 Vurgu rengi<span style="display:flex;gap:6px;align-items:center"><input type="color" id="accentIn" value="${/^#[0-9a-f]{6}$/i.test(acc)?acc:'#8b7bff'}" aria-label="Vurgu rengi"><button type="button" class="btn ghost sm" data-a="accentReset">Varsayılan</button></span></label>
    <label class="toggle">🔊 Ses efektleri<input type="checkbox" data-s="sound"${S.settings.sound?' checked':''}></label>
    <label class="toggle">❄️ Ay temalı arka plan (kar, yaprak, çiçek…)<input type="checkbox" data-s="ambient"${S.settings.ambient?' checked':''}></label>
    <h4>Hatırlatıcı</h4>
    <label class="toggle">⏰ Günlük hatırlatma saati<input type="time" id="remIn" value="${S.settings.reminder}" aria-label="Hatırlatma saati"></label>
    <p class="note">Bildirim izni: <b>${perm}</b> ${'Notification' in window&&Notification.permission==='default'?'<button type="button" class="btn ghost sm" data-a="notifPerm">İzin ver</button>':''}<br>Hatırlatıcı uygulama açıkken çalışır (telefona yüklendiğinde de).</p>
    ${vacationHTML()}
    ${backupHTML()}
    <h4>Profiller</h4>
    <div class="profiles">${P.list.map(p=>`<div class="prow${p.id===P.active?' on':''}" data-id="${esc(p.id)}"><span class="pav">${esc((p.name[0]||'?').toLocaleUpperCase('tr'))}</span><input value="${esc(p.name)}" data-pname maxlength="24" aria-label="Profil adı"><button type="button" class="btn ghost sm" data-a="pswitch"${p.id===P.active?' disabled':''}>${p.id===P.active?'Aktif':'Geç'}</button>${p.id!=='main'?'<button type="button" class="mini-btn del" data-a="pdel" aria-label="Profili sil">🗑</button>':''}</div>`).join('')}</div>
    <div class="add-row"><input id="newProf" class="hi-name" placeholder="Yeni profil adı…" maxlength="24" aria-label="Yeni profil adı"><button type="button" class="btn" data-a="padd">Ekle</button></div>
    <h4>Telefona yükle</h4><p class="note">📱 Telefonda <b>${esc(APP_URL)}</b> adresini aç, tarayıcı menüsünden “Ana ekrana ekle” ile uygulama gibi yükle; internetsiz de çalışır. Verini bu cihazdan taşımak için ⋯ → “QR ile başka cihaza aktar”.</p>
    <footer><button class="btn" value="close">Kapat</button></footer>`;
}
$('#setForm').addEventListener('change',e=>{
  const s=e.target.dataset.s;
  if(s){ S.settings[s]=e.target.checked; save(); if(s==='ambient') setAmbient(view<12?view:new Date().getMonth()); if(s==='sound'&&e.target.checked) sfx('ding'); }
  if(e.target.id==='remIn'){ S.settings.reminder=e.target.value; remDone=''; save(); toast(e.target.value?`⏰ Her gün ${e.target.value}'de hatırlatılacak`:'Hatırlatıcı kapatıldı'); }
});
$('#setForm').addEventListener('input',e=>{
  if(e.target.id==='accentIn'){ S.accent=e.target.value; applyTheme(); save(); }
  if(e.target.matches('[data-pname]')){ const v=e.target.value.trim(); if(!v) return; const p=P.list.find(x=>x.id===e.target.closest('.prow').dataset.id); p.name=v.slice(0,24); savePK(); updTop(); }
});
$('#setForm').addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.tagName==='INPUT'){ e.preventDefault(); if(e.target.id==='newProf') TA.padd(); } });
function switchProfile(id){
  flush(); P.active=id; savePK(); S=loadProfile(id); rev++; undoStack.length=0; lastXP=null; questSeen=null;
  applyTheme(); S.year=new Date().getFullYear(); view=TODAY; lastMonth=new Date().getMonth();
  render(); updXP(); checkAch(true); checkLevel(true); checkQuests();
  toast(`👤 ${profName()} profiline geçildi`); maybeOnboard();
}
function registerSW(){ if('serviceWorker' in navigator&&location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{}); }

/* araç eylemleri */
const TA={
  hmore:el=>el.closest('li').classList.toggle('open'),
  hadd:()=>{ const nm=$('#newName'), name=nm.value.trim(); if(!name){ shake(nm); return; }
    const h=normHabit({id:uid(),name,icon:newIcon,hue:HUES[S.habits.length%HUES.length],created:todayKey()},S.habits.length);
    S.habits.push(h); hDirty=true; rev++; save();
    flip($('#hlist'),()=>$('#hlist').insertAdjacentHTML('beforeend',hLi(h)));
    nm.value=''; newIcon='✨'; $('#newIconBtn').innerHTML=iconHTML(newIcon); nm.focus(); sfx('pop'); },
  pick:el=>{ const t=el.dataset.t, v=el.dataset.v;
    if(t==='new'){ newIcon=v; $('#newIconBtn').innerHTML=iconHTML(v); $('#newName').focus(); return; }
    const h=hab(t); if(!h) return; h.icon=v; hDirty=true; save(); const li=el.closest('li'); li.querySelector('.ibtn').innerHTML=iconHTML(v); const inp=li.querySelector('[data-f=icon]'); if(inp) inp.value=v.startsWith('i:')?'':v; },
  hue:el=>{ const h=habitOf(el); h.hue=HUES[(HUES.indexOf(h.hue)+1)%HUES.length]; el.closest('li').style.setProperty('--h',h.hue); hDirty=true; save(); },
  hup:el=>moveHabit(el,-1), hdown:el=>moveHabit(el,1),
  hday:el=>{ const h=habitOf(el), w=+el.dataset.w, on=h.days.includes(w);
    if(on&&h.days.length===1){ toast('En az bir gün seçili olmalı'); return; }
    h.days=on?h.days.filter(x=>x!==w):[...h.days,w]; el.classList.toggle('on',!on); hDirty=true; rev++; save(); },
  hdiff:el=>{ const h=habitOf(el); h.diff=+el.dataset.v; $$('button',el.parentElement).forEach(b=>b.classList.toggle('on',b===el)); hDirty=true; rev++; save(); },
  harch:el=>{ const h=habitOf(el); h.archived=true; hDirty=true; rev++; save(); toast(`📦 ${h.name} arşivlendi — verileri korunuyor`); renderHabitDlg(); },
  hrestore:el=>{ const h=habitOf(el); h.archived=false; hDirty=true; rev++; save(); renderHabitDlg(h.id); },
  hdel:el=>{
    if(!el.classList.contains('arm')){ el.classList.add('arm'); el.textContent='Sil?'; clearTimeout(el._t); el._t=setTimeout(()=>{ el.classList.remove('arm'); el.textContent='🗑'; },2500); return; }
    const h=habitOf(el), li=el.closest('li'), before=JSON.stringify(S);
    S.habits=S.habits.filter(x=>x!==h);
    for(const f of ['checks']) for(const k of Object.keys(S[f])){ S[f][k]=S[f][k].filter(id=>id!==h.id); if(!S[f][k].length) delete S[f][k]; }
    for(const f of ['vals','times']) for(const k of Object.keys(S[f])){ delete S[f][k][h.id]; if(!Object.keys(S[f][k]).length) delete S[f][k]; }
    S.goals.forEach(g=>{ if(g.habitId===h.id) g.habitId=''; });
    pushUndo(`${h.name} silindi`,[{full:before}]); hDirty=true; rev++; save();
    li.animate([{opacity:1},{opacity:0,transform:'scale(.95)'}],{duration:dur(220)}).finished.then(()=>li.remove());
  },
  tpl:el=>{ const list=TEMPLATES[el.dataset.t]; let n=0;
    list.forEach(([name,icon,o])=>{ if(S.habits.some(h=>h.name.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'))) return; S.habits.push(normHabit({id:uid(),name,icon,hue:HUES[S.habits.length%HUES.length],...o,created:todayKey()},S.habits.length)); n++; });
    hDirty=true; rev++; save(); renderHabitDlg(); toast(n?`✨ ${n} alışkanlık eklendi`:'Bu paketteki alışkanlıklar zaten var'); if(n) sfx('win'); },
  timer:el=>{ startTimer(hab(el.dataset.h)); $('#detailDlg').open&&$('#detailDlg').close(); },
  timerPause:()=>{ if(!TM) return; if(TM.paused){ TM.end=Date.now()+TM.left; TM.paused=false; $('#twPause').textContent='⏸'; } else { TM.left=Math.max(0,TM.end-Date.now()); TM.paused=true; $('#twPause').textContent='▶'; } timerTick(); },
  timerStop:()=>{ clearInterval(tmI); TM=null; $('#timerW').classList.remove('show'); },
  'json-out':()=>{ S.lastBackup=todayKey(); $('#bkChip').classList.remove('show'); flush(); download(`aliskanlik-yedek-${profName()}-${stamp()}.json`,JSON.stringify(S),'application/json'); toast('⬇️ JSON yedeği indirildi'); },
  'csv-out':()=>{ const rows=[['tarih','alışkanlık','ikon','değer']];
    for(const k of Object.keys(S.checks).sort()) for(const id of S.checks[k]){ const h=hab(id); if(h) rows.push([k,h.name,iconText(h.icon),h.target?valOf(k,id):'']); }
    download(`aliskanlik-${stamp()}.csv`,'﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8'); toast(`📄 ${rows.length-1} işaret dışa aktarıldı`); },
  'json-in':()=>{ fileMode='json'; $('#fileIn').accept='.json,application/json'; $('#fileIn').click(); },
  'csv-in':()=>{ fileMode='csv'; $('#fileIn').accept='.csv,text/csv'; $('#fileIn').click(); },
  'xlsx-in':()=>{ fileMode='xlsx'; $('#fileIn').accept='.xlsx'; $('#fileIn').click(); },
  sample:()=>{ if(!confirm('Bu profilin verileri yerine örnek veriler yüklensin mi? (Önce JSON yedeği almanı öneririz.)')) return;
    const before=JSON.stringify(S), t=S.theme; S=sampleState(); S.theme=t; pushUndo('Örnek veriler yüklendi',[{full:before}]);
    rev++; flush(); view=TODAY; $('#menuDlg').close(); render(); updXP(); checkAch(true); checkLevel(true); toast('✨ Örnek veriler yüklendi'); },
  reset:()=>{ if(!confirm('Bu profilin tüm işaretleri, notları, fotoğrafları ve hedefleri silinecek; alışkanlık listen, evcil dostun ve ayarların kalacak. Emin misin?')) return;
    const before=JSON.stringify(S), o=S; S=blankState(); for(const f of ['theme','accent','habits','pet','avatar','settings']) S[f]=o[f]; pushUndo('Veriler sıfırlandı',[{full:before}]);
    rev++; flush(); $('#menuDlg').close(); render(); updXP(); toast('🗑️ Veriler sıfırlandı · Ctrl+Z ile geri alabilirsin'); },
  share:()=>shareImage(),
  print:()=>printMonth(),
  settings:()=>{ renderSettings(); $('#setDlg').showModal(); },
  setTheme:el=>{ setTheme(el.dataset.t,el); $$('.themes button').forEach(b=>b.classList.toggle('on',b===el)); },
  accentReset:()=>{ S.accent=''; applyTheme(); save(); renderSettings(); },
  notifPerm:()=>Notification.requestPermission().then(()=>renderSettings()),
  padd:()=>{ const inp=$('#newProf'), name=inp.value.trim(); if(!name){ shake(inp); return; }
    const id=uid(); P.list.push({id,name:name.slice(0,24)}); savePK(); switchProfile(id); renderSettings(); },
  pswitch:el=>{ switchProfile(el.closest('.prow').dataset.id); renderSettings(); },
  pdel:el=>{ const id=el.closest('.prow').dataset.id, p=P.list.find(x=>x.id===id);
    if(!confirm(`"${p.name}" profili ve tüm verileri kalıcı olarak silinsin mi?`)) return;
    if(P.active===id) switchProfile('main'); // önce geç: geçiş eski profili kaydeder, sonra silinir
    try{ localStorage.removeItem(dataKey(id)); }catch(e){}
    P.list=P.list.filter(x=>x.id!==id); savePK(); renderSettings(); toast('Profil silindi'); },
};

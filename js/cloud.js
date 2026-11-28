'use strict';
/* ===== Hesap ve bulut eşitleme: Firebase Auth + Firestore Lite =====
   Giriş zorunlu: oturum yoksa giris.html açılır (index.html başındaki kontrol ve onUser).
   Her profil users/{uid}/p/{profilId} belgesidir: {name, data (JSON), updated (ms)}. Firebase ayarları: firebase-config.js */
const LOCAL_ONLY=['photos','vision','voice']; // fotoğraf ve sesler cihazda kalır (Firestore belgesi en fazla 1 MB)
// CM: bu cihazın eşitleme defteri. at: bulutta en son gördüğümüz/yazdığımız sürüm, dirty: yüklenmemiş yerel değişiklik sayacı, mod: son yerel değişiklik
let CM=(()=>{ try{ const m=JSON.parse(lsGet(CKEY)); if(isObj(m)&&typeof m.uid==='string') return {uid:m.uid,email:String(m.email||''),at:isObj(m.at)?m.at:{},dirty:isObj(m.dirty)?m.dirty:{},mod:isObj(m.mod)?m.mod:{},last:+m.last||0}; }catch(e){} return null; })();
let FB=null, cUser=null, cReady=false, cBusy=false, cConflict=false, cErr='', pushT=0;
const saveCM=()=>{ try{ CM?localStorage.setItem(CKEY,JSON.stringify(CM)):localStorage.removeItem(CKEY); }catch(e){} };

function fbLoad(){
  return FB||(FB=Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore-lite.js'].map(f=>import(FBV+f))).then(([a,au,fs])=>{
    const app=a.initializeApp(FB_CFG), auth=au.getAuth(app); auth.languageCode='tr';
    au.onAuthStateChanged(auth,onUser);
    return {au,fs,auth,db:fs.getFirestore(app)};
  }).catch(e=>{ FB=null; throw e; }));
}
function onUser(u){
  if(!u){ CM=null; saveCM(); location.replace('giris.html'); return; } // çıkış yapıldı ya da oturum düştü
  cUser=u; cReady=true;
  if(!CM||CM.uid!==u.uid){ CM={uid:u.uid,email:u.email||'',at:{},dirty:{},mod:{},last:0}; saveCM(); }
  cloudSync(); refreshAcc();
}
// core.js flush() gerçek bir değişiklik yazınca çağırır
function cloudMark(pid){ if(!CM) return; CM.dirty[pid]=(CM.dirty[pid]||0)+1; CM.mod[pid]=Date.now(); saveCM(); clearTimeout(pushT); pushT=setTimeout(cloudSync,4000); }

const hasData=s=>!!s&&(s.habits.length>0||Object.keys(s.checks).length>0);
const readLocal=pid=>pid===P.active?S:loadProfile(pid);
const cloudData=s=>{ const o={...s}; for(const f of LOCAL_ONLY) delete o[f]; return JSON.stringify(o); };
function applyRemote(pid,s,local,name){
  for(const f of LOCAL_ONLY) if(local) s[f]=local[f];
  const p=P.list.find(x=>x.id===pid); if(p){ if(name) p.name=String(name).slice(0,24); } else P.list.push({id:pid,name:String(name||'Profil').slice(0,24)});
  savePK(); writeProfile(pid,s);
  if(pid===P.active){ S=s; reloadActive(); }
}
async function cloudSync(choice){
  if(!CM||!cUser||cBusy) return;
  cBusy=true; clearTimeout(pushT); cErr=''; refreshAcc(); flush();
  try{
    const {fs,db}=await fbLoad(), col=fs.collection(db,'users',CM.uid,'p'), remote=new Map();
    (await fs.getDocs(col)).forEach(d=>remote.set(d.id,d.data()));
    const first=!Object.keys(CM.at).length; let takeCloud=false;
    if(first){
      const localReal=P.list.some(p=>hasData(readLocal(p.id)));
      if(localReal&&remote.size&&!choice){ cConflict=true; return; } // ilk bağlantıda iki tarafta da veri var: kullanıcı seçsin
      takeCloud=choice?choice==='cloud':remote.size>0;
    }
    cConflict=false;
    for(const [pid,r] of remote){
      if(CM.at[pid]===r.updated) continue; // bulut değişmemiş; yerel değişiklik varsa aşağıda yüklenir
      const local=P.list.some(p=>p.id===pid)?readLocal(pid):null;
      // değişiklik yoksa buluttakini al; iki tarafta da değişiklik varsa en son yapılan kazanır
      const use=first?takeCloud||!hasData(local):!local||!CM.dirty[pid]||(CM.mod[pid]||0)<r.updated;
      if(use){ let s=null; try{ s=validate(JSON.parse(r.data)); }catch(e){} if(!s) continue;
        applyRemote(pid,s,local,r.name); delete CM.dirty[pid]; CM.at[pid]=r.updated; }
      else CM.dirty[pid]=CM.dirty[pid]||1;
    }
    for(const p of P.list){
      const pid=p.id; if(!CM.dirty[pid]&&remote.has(pid)) continue;
      const s=readLocal(pid); if(!remote.has(pid)&&!hasData(s)){ delete CM.dirty[pid]; continue; }
      const c=CM.dirty[pid], data=cloudData(s);
      if(new TextEncoder().encode(data).length>1000000){ cErr=`“${p.name}” profili buluta sığmayacak kadar büyük`; continue; }
      const updated=Date.now();
      await fs.setDoc(fs.doc(col,pid),{name:p.name,data,updated});
      CM.at[pid]=updated; if(CM.dirty[pid]===c) delete CM.dirty[pid];
    }
    CM.last=Date.now();
  }catch(e){ cErr=e&&e.code==='permission-denied'?'Firestore kuralları erişime izin vermiyor':'Bağlantı kurulamadı, internet gelince tekrar denenecek'; }
  finally{ cBusy=false; saveCM(); refreshAcc(); if(CM&&!cErr&&Object.keys(CM.dirty).length) pushT=setTimeout(cloudSync,4000); }
}
async function cloudDelete(pid){
  if(!CM) return; delete CM.at[pid]; delete CM.dirty[pid]; delete CM.mod[pid]; saveCM();
  if(cUser) try{ const {fs,db}=await fbLoad(); await fs.deleteDoc(fs.doc(db,'users',CM.uid,'p',pid)); }catch(e){}
}

/* ayarlardaki hesap bölümü */
function relTime(t){
  if(!t) return 'henüz yok';
  const d=Date.now()-t, x=new Date(t); if(d<60e3) return 'az önce'; if(d<3600e3) return Math.floor(d/60e3)+' dakika önce';
  const hm=x.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  return x.toDateString()===new Date().toDateString()?'Bugün, '+hm:x.toLocaleDateString('tr-TR',{day:'numeric',month:'long'})+', '+hm;
}
const kbStr=b=>b<1024?b+' B':b<1048576?fmt(b/1024)+' KB':fmt(b/1048576,1)+' MB';
const SVG_SYNC='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 00-14.6-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0014.6 4.5L20 16"/><path d="M20 20v-4h-4"/></svg>';
const SVG_OUT='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/></svg>';
function accountHTML(){
  const u=cUser, prov=u?.providerData?.[0]?.providerId, mail=u?.email||CM?.email||'';
  const name=u?.displayName||mail.split('@')[0]||'Hesabım', ini=(name[0]||'?').toLocaleUpperCase('tr');
  let body;
  if(u&&cConflict) body=`<p class="note">⚠️ Hem bu cihazda hem hesabında veri var. Hangisi kullanılsın? Seçmediğin taraftaki aynı profilin verisi silinir; emin değilsen önce aşağıdan JSON yedeği al.</p>
    <div class="acc-btns"><button type="button" class="btn" data-a="accUseCloud">☁️ Hesaptakini al</button><button type="button" class="btn ghost" data-a="accUseLocal">📱 Bu cihazdakini yükle</button></div>`;
  else {
    const synced=P.list.filter(p=>CM&&CM.at[p.id]), bytes=synced.reduce((n,p)=>n+new TextEncoder().encode(cloudData(readLocal(p.id))).length,0);
    const md=u?.metadata, items=[
      ['Giriş yöntemi',prov==='google.com'?'Google':prov==='password'?'E-posta':'—'],
      ['Hesap açılışı',md?.creationTime?new Date(md.creationTime).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—'],
      ['Son giriş',md?.lastSignInTime?relTime(Date.parse(md.lastSignInTime)):'—'],
      ['Son eşitleme',`<i class="acc-dot${cErr?' bad':''}"></i>${cBusy?'eşitleniyor…':relTime(CM?.last)}`,1],
      ['Buluttaki veri',`${synced.length} profil · ${kbStr(bytes)}`],
      ['Bu cihazda kalan',`${Object.keys(S.photos).length+S.vision.length} fotoğraf · ${Object.keys(S.voice).length} sesli not`],
    ];
    body=`<div class="acc-grid">${items.map(([k,v,raw])=>`<div class="acc-item"><span>${k}</span><b>${raw?v:esc(v)}</b></div>`).join('')}</div>
    ${cErr?`<p class="note acc-err">⚠️ ${esc(cErr)}</p>`:''}
    <div class="acc-btns"><button type="button" class="btn" data-a="accSync"${!u||cBusy?' disabled':''}>${SVG_SYNC}Şimdi eşitle</button>${prov==='password'?'<button type="button" class="btn ghost" data-a="accPass">Şifre değiştir</button>':''}<button type="button" class="btn ghost acc-out" data-a="accOut">${SVG_OUT}Çıkış yap</button></div>
    <p class="note">Değişikliklerin birkaç saniye içinde hesabına yedeklenir. Fotoğraflar ve sesli notlar bu cihazda kalır. Çıkış yapınca giriş sayfasına dönersin.</p>`;
  }
  return `<div id="accBox"><h4>Hesap</h4>
    <div class="acc-card"><div class="acc-av">${esc(ini)}${u?.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`:''}</div>
    <div class="acc-who"><b>${esc(name)}</b><span>${esc(mail)}</span></div><span class="acc-badge${u?'':' wait'}">${u?'✓ Bağlı':cReady?'Çevrimdışı':'Bağlanıyor…'}</span></div>${body}</div>`;
}
function refreshAcc(){ const el=$('#accBox'); if(el) el.outerHTML=accountHTML(); }
const CA={
  accSync:()=>cloudSync(),
  accUseCloud:()=>cloudSync('cloud'), accUseLocal:()=>cloudSync('local'),
  accPass:()=>{ if(!cUser) return; fbLoad().then(({au,auth})=>au.sendPasswordResetEmail(auth,cUser.email))
    .then(()=>toast('📧 Şifre değiştirme bağlantısı e-postana gönderildi'),e=>toast('⚠️ '+authMsg(e))); },
  accOut:async el=>{ if(!confirm('Çıkış yapılsın mı? Verilerin bu cihazda kalır; tekrar giriş yapınca eşitlemeye devam eder.')) return;
    el.disabled=true; await cloudSync();
    try{ const {au,auth}=await fbLoad(); await au.signOut(auth); }catch(e){ toast('⚠️ '+authMsg(e)); el.disabled=false; return; }
    CM=null; saveCM(); location.replace('giris.html'); },
};

// açılışta bağlan; geri dönünce ve internet gelince eşitle
if(CM) setTimeout(()=>fbLoad().catch(()=>{ cReady=true; refreshAcc(); }),300);
document.addEventListener('visibilitychange',()=>{ if(!cUser||!CM) return;
  if(document.hidden){ if(Object.keys(CM.dirty).length) cloudSync(); } else if(Date.now()-CM.last>30000) cloudSync(); });
addEventListener('online',()=>{ if(cUser) cloudSync(); });

'use strict';
/* ===== Hesap ve bulut yedek: Firebase Auth + Firestore Lite (yalnızca giriş yapılınca yüklenir) =====
   Her profil users/{uid}/p/{profilId} belgesidir: {name, data (JSON), updated (ms)}.
   Firebase web anahtarı gizli değildir; verini Firestore kuralları korur (herkes yalnızca kendi uid'sine erişir). */
const FB_CFG={apiKey:'AIzaSyCwc2_FoWipD6ArsZen8jg4LfPvEQOLMz8',authDomain:'disiplin-a0542.firebaseapp.com',projectId:'disiplin-a0542',
  storageBucket:'disiplin-a0542.firebasestorage.app',messagingSenderId:'936901157130',appId:'1:936901157130:web:d901c17475e177e11f5af3'};
const FBV='https://www.gstatic.com/firebasejs/10.12.2/', CKEY='aliskanlik-bulut';
const LOCAL_ONLY=['photos','vision','voice']; // fotoğraf ve sesler cihazda kalır (Firestore belgesi en fazla 1 MB)
// CM: bu cihazın eşitleme defteri. at: bulutta en son gördüğümüz/yazdığımız sürüm, dirty: yüklenmemiş yerel değişiklik sayacı, mod: son yerel değişiklik
let CM=(()=>{ try{ const m=JSON.parse(lsGet(CKEY)); if(isObj(m)&&typeof m.uid==='string') return {uid:m.uid,email:String(m.email||''),at:isObj(m.at)?m.at:{},dirty:isObj(m.dirty)?m.dirty:{},mod:isObj(m.mod)?m.mod:{},last:+m.last||0}; }catch(e){} return null; })();
let FB=null, cUser=null, cReady=false, cBusy=false, cConflict=false, cErr='', pushT=0, authBusy=false;
const saveCM=()=>{ try{ CM?localStorage.setItem(CKEY,JSON.stringify(CM)):localStorage.removeItem(CKEY); }catch(e){} };

function fbLoad(){
  return FB||(FB=Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore-lite.js'].map(f=>import(FBV+f))).then(([a,au,fs])=>{
    const app=a.initializeApp(FB_CFG), auth=au.getAuth(app); auth.languageCode='tr';
    au.onAuthStateChanged(auth,onUser);
    return {au,fs,auth,db:fs.getFirestore(app)};
  }).catch(e=>{ FB=null; throw e; }));
}
function onUser(u){
  const was=cUser; cUser=u; cReady=true;
  if(u){ closeLogin(); try{ localStorage.removeItem(SKEY); }catch(e){} if(!CM||CM.uid!==u.uid){ CM={uid:u.uid,email:u.email||'',at:{},dirty:{},mod:{},last:0}; saveCM(); } cloudSync(); }
  else if(was||CM) openLogin(); // çıkış yapıldı ya da oturum düştü
  refreshAcc();
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
const fmtTime=t=>t?new Date(t).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'henüz yok';
function accountHTML(){
  let b;
  if(cUser&&CM&&cConflict) b=`<p class="note">⚠️ Hem bu cihazda hem hesabında veri var. Hangisi kullanılsın? Seçmediğin taraftaki aynı profilin verisi silinir; emin değilsen önce aşağıdan JSON yedeği al.</p>
    <div class="add-row"><button type="button" class="btn" data-a="accUseCloud">☁️ Hesaptakini al</button><button type="button" class="btn ghost" data-a="accUseLocal">📱 Bu cihazdakini yükle</button></div>`;
  else if(cUser&&CM) b=`<p class="note">✅ <b>${esc(cUser.email||'Hesap')}</b> ile giriş yapıldı. Değişikliklerin birkaç saniye içinde buluta yedeklenir.<br>Son eşitleme: <b>${cBusy?'eşitleniyor…':fmtTime(CM.last)}</b>${cErr?`<br>⚠️ ${esc(cErr)}`:''}</p>
    <div class="add-row"><button type="button" class="btn" data-a="accSync">🔄 Şimdi eşitle</button><button type="button" class="btn ghost" data-a="accOut">Çıkış yap</button></div>`;
  else if(CM&&!cReady) b='<p class="note">☁️ Hesaba bağlanılıyor…</p>';
  else b=`<p class="note">${CM?'⚠️ Oturumun kapanmış, tekrar giriş yap.':'İsteğe bağlı. Giriş yaparsan alışkanlıkların, işaretlerin ve notların hesabına yedeklenir; yeni cihazda giriş yapınca hepsi geri gelir. Fotoğraflar ve sesli notlar bu cihazda kalır.'}</p>
    <div class="add-row"><button type="button" class="btn" data-a="accLogin">Giriş yap / Hesap aç</button></div>`;
  return `<div id="accBox"><h4>☁️ Hesap ve bulut yedek</h4>${b}</div>`;
}
function refreshAcc(){ const el=$('#accBox'); if(el) el.outerHTML=accountHTML(); }
const AUTH_ERR={'auth/invalid-credential':'E-posta veya şifre yanlış','auth/wrong-password':'E-posta veya şifre yanlış','auth/user-not-found':'Bu e-postayla hesap yok, “Hesap aç”a geç',
  'auth/email-already-in-use':'Bu e-postayla zaten hesap var, “Giriş yap”a geç','auth/weak-password':'Şifre en az 6 karakter olmalı','auth/invalid-email':'E-posta adresi geçersiz',
  'auth/missing-password':'Şifreyi yaz','auth/popup-closed-by-user':'Google penceresi kapatıldı','auth/cancelled-popup-request':'Google penceresi kapatıldı',
  'auth/popup-blocked':'Tarayıcı Google penceresini engelledi','auth/network-request-failed':'İnternet bağlantısı yok','auth/too-many-requests':'Çok fazla deneme oldu, biraz bekle',
  'auth/unauthorized-domain':'Bu site Firebase’de yetkili alan adı değil','auth/operation-not-allowed':'Bu giriş yöntemi Firebase’de açık değil',
  'auth/admin-restricted-operation':'Yeni hesap açma kapalı','auth/user-disabled':'Bu hesap devre dışı'};
async function authDo(fn,okMsg){
  if(authBusy) return; authBusy=true; let err='';
  if(LG) lgSet(true,''); else toast('☁️ Bağlanıyor…');
  try{ const F=await fbLoad(); await fn(F); if(okMsg) toast(okMsg); }
  catch(e){ err=AUTH_ERR[e&&e.code]||(e&&e.code?'Bir sorun oldu: '+e.code:'Bağlantı kurulamadı, internetini kontrol et'); }
  authBusy=false; if(LG) lgSet(false,err); else if(err) toast('⚠️ '+err);
}

/* ===== giriş ekranı ===== */
const SKEY='aliskanlik-hesapsiz'; // "hesapsız devam et" seçildiyse açılışta bir daha sorma
let LG=null;
const G_ICON='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function openLogin(mode){ if(cUser) return; LG={mode:mode||'in'}; $('#login').classList.add('show'); document.body.classList.add('wz-open'); renderLogin(); }
function closeLogin(){ if(!LG) return; LG=null; $('#login').classList.remove('show'); if(!WZ) document.body.classList.remove('wz-open'); }
function renderLogin(){
  const up=LG.mode==='up', mail=$('#lgMail')?.value||'';
  $('#login').innerHTML=`<form class="lg-card" novalidate>
    <div class="wz-logo">◆</div>
    <h2>${up?'Hesap aç':'Tekrar hoş geldin'}</h2>
    <p class="sub">${up?'Alışkanlıkların hesabında yedeklensin, her cihazda seninle olsun.':'Giriş yap, alışkanlıkların kaldığı yerden devam etsin.'}</p>
    <button type="button" class="lg-google" data-a="lgGoogle">${G_ICON}<span>Google ile devam et</span></button>
    <div class="lg-or">veya e-postayla</div>
    <label class="wz-field">E-posta<input id="lgMail" type="email" autocomplete="email" inputmode="email" placeholder="ornek@mail.com" value="${esc(mail)}"></label>
    <label class="wz-field">Şifre<span class="lg-pass"><input id="lgPass" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'En az 6 karakter':'Şifren'}"><button type="button" class="lg-eye" data-a="lgEye" aria-label="Şifreyi göster">👁</button></span></label>
    <p class="lg-err" id="lgErr" role="alert" hidden></p>
    <button type="submit" class="btn big-btn" id="lgGo">${up?'Hesabı oluştur':'Giriş yap'}</button>
    <div class="lg-links">${up?'':'<button type="button" class="linkish" data-a="lgReset">Şifremi unuttum</button>'}<button type="button" class="linkish" data-a="lgMode">${up?'Zaten hesabın var mı? Giriş yap':'Hesabın yok mu? Hesap aç'}</button></div>
    <button type="button" class="lg-skip" data-a="lgSkip">Hesapsız devam et →</button>
    <p class="hint">Verilerin bu cihazda da saklanır · fotoğraflar ve sesli notlar cihazda kalır</p>
  </form>`;
}
function lgSet(busy,err){
  if(!LG) return; const f=$('#login form'); if(!f) return;
  f.querySelectorAll('button').forEach(b=>b.disabled=busy);
  $('#lgGo').textContent=busy?'Bağlanıyor…':LG.mode==='up'?'Hesabı oluştur':'Giriş yap';
  const e=$('#lgErr'); e.textContent=err; e.hidden=!err;
}
$('#login').addEventListener('submit',e=>{
  e.preventDefault(); const m=$('#lgMail'), p=$('#lgPass'), mail=m.value.trim(), up=LG.mode==='up';
  if(!/^\S+@\S+\.\S+$/.test(mail)){ shake(m); lgSet(false,'E-posta adresini yaz'); return; }
  if(p.value.length<6){ shake(p); lgSet(false,'Şifre en az 6 karakter olmalı'); return; }
  authDo(({au,auth})=>(up?au.createUserWithEmailAndPassword:au.signInWithEmailAndPassword)(auth,mail,p.value),up?'🎉 Hesabın açıldı, verilerin yedekleniyor':'✅ Giriş yapıldı');
});
const CA={
  lgGoogle:()=>authDo(({au,auth})=>au.signInWithPopup(auth,new au.GoogleAuthProvider()),'✅ Giriş yapıldı'),
  lgMode:()=>{ LG.mode=LG.mode==='up'?'in':'up'; renderLogin(); $('#lgMail').focus(); },
  lgEye:el=>{ const p=$('#lgPass'), show=p.type==='password'; p.type=show?'text':'password'; el.textContent=show?'🙈':'👁'; el.setAttribute('aria-label',show?'Şifreyi gizle':'Şifreyi göster'); p.focus(); },
  lgReset:()=>{ const m=$('#lgMail'), mail=m.value.trim(); if(!mail){ shake(m); lgSet(false,'Sıfırlama bağlantısı için önce e-postanı yaz'); return; }
    authDo(({au,auth})=>au.sendPasswordResetEmail(auth,mail),'📧 Şifre sıfırlama bağlantısı e-postana gönderildi'); },
  lgSkip:()=>{ try{ localStorage.setItem(SKEY,'1'); }catch(e){} closeLogin(); },
  accLogin:()=>{ $('#setDlg').close(); openLogin(); },
  wzLogin:()=>openLogin(),
  accSync:()=>cloudSync(),
  accUseCloud:()=>cloudSync('cloud'), accUseLocal:()=>cloudSync('local'),
  accOut:()=>{ if(!confirm('Çıkış yapılsın mı? Verilerin bu cihazda kalır, sadece artık buluta yedeklenmez.')) return;
    authDo(async ({au,auth})=>{ await cloudSync(); await au.signOut(auth); CM=null; cConflict=false; saveCM(); refreshAcc(); },'Çıkış yapıldı'); },
};

// daha önce giriş yapıldıysa açılışın ardından bağlan; geri dönünce ve internet gelince eşitle
if(CM) setTimeout(()=>fbLoad().catch(()=>{ cReady=true; refreshAcc(); }),1200);
else if(!lsGet(SKEY)) openLogin(); // hesabı olmayan ilk açılış: önce giriş ekranı (hesapsız devam edilebilir)
document.addEventListener('visibilitychange',()=>{ if(!cUser||!CM) return;
  if(document.hidden){ if(Object.keys(CM.dirty).length) cloudSync(); } else if(Date.now()-CM.last>30000) cloudSync(); });
addEventListener('online',()=>{ if(cUser) cloudSync(); });

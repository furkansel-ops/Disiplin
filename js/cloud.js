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
  cUser=u; cReady=true;
  if(u){ if(!CM||CM.uid!==u.uid){ CM={uid:u.uid,email:u.email||'',at:{},dirty:{},mod:{},last:0}; saveCM(); } cloudSync(); }
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
  else b=`${CM?'<p class="note">⚠️ Oturumun kapanmış, tekrar giriş yap.</p>':''}<div class="acc-form">
    <button type="button" class="btn" data-a="accGoogle">Google ile giriş yap</button>
    <input id="accMail" class="hi-name" type="email" autocomplete="email" placeholder="E-posta" aria-label="E-posta">
    <input id="accPass" class="hi-name" type="password" autocomplete="current-password" placeholder="Şifre (en az 6 karakter)" aria-label="Şifre">
    <div class="add-row"><button type="button" class="btn" data-a="accIn">Giriş yap</button><button type="button" class="btn ghost" data-a="accUp">Hesap aç</button><button type="button" class="btn ghost sm" data-a="accReset">Şifremi unuttum</button></div></div>
    <p class="note">İsteğe bağlı. Giriş yaparsan alışkanlıkların, işaretlerin ve notların hesabına yedeklenir; yeni cihazda giriş yapınca hepsi geri gelir. Fotoğraflar ve sesli notlar bu cihazda kalır.</p>`;
  return `<div id="accBox"><h4>☁️ Hesap ve bulut yedek</h4>${b}</div>`;
}
function refreshAcc(){ const el=$('#accBox'); if(el) el.outerHTML=accountHTML(); }
const AUTH_ERR={'auth/invalid-credential':'E-posta veya şifre yanlış','auth/wrong-password':'E-posta veya şifre yanlış','auth/user-not-found':'Bu e-postayla hesap yok, “Hesap aç”a bas',
  'auth/email-already-in-use':'Bu e-postayla zaten hesap var, “Giriş yap”a bas','auth/weak-password':'Şifre en az 6 karakter olmalı','auth/invalid-email':'E-posta adresi geçersiz',
  'auth/missing-password':'Şifreyi yaz','auth/popup-closed-by-user':'Giriş penceresi kapatıldı','auth/cancelled-popup-request':'Giriş penceresi kapatıldı',
  'auth/popup-blocked':'Tarayıcı giriş penceresini engelledi','auth/network-request-failed':'İnternet bağlantısı yok','auth/too-many-requests':'Çok fazla deneme oldu, biraz bekle',
  'auth/unauthorized-domain':'Bu site Firebase’de yetkili alan adı değil','auth/operation-not-allowed':'Bu giriş yöntemi Firebase’de açık değil'};
async function authDo(fn,okMsg){
  if(authBusy) return; authBusy=true; toast('☁️ Bağlanıyor…');
  try{ const F=await fbLoad(); await fn(F); if(okMsg) toast(okMsg); }
  catch(e){ toast('⚠️ '+(AUTH_ERR[e&&e.code]||(e&&e.code?'Bir sorun oldu: '+e.code:'Bağlantı kurulamadı, internetini kontrol et'))); }
  finally{ authBusy=false; }
}
function accVals(){ const m=$('#accMail'), p=$('#accPass');
  if(!m.value.trim()){ shake(m); return null; } if(p.value.length<6){ shake(p); toast('Şifre en az 6 karakter olmalı'); return null; } return [m.value.trim(),p.value]; }
const CA={
  accGoogle:()=>authDo(({au,auth})=>au.signInWithPopup(auth,new au.GoogleAuthProvider()),'✅ Giriş yapıldı'),
  accIn:()=>{ const v=accVals(); if(v) authDo(({au,auth})=>au.signInWithEmailAndPassword(auth,...v),'✅ Giriş yapıldı'); },
  accUp:()=>{ const v=accVals(); if(v) authDo(({au,auth})=>au.createUserWithEmailAndPassword(auth,...v),'🎉 Hesabın açıldı, verilerin yedekleniyor'); },
  accReset:()=>{ const m=$('#accMail'); if(!m.value.trim()){ shake(m); toast('Önce e-postanı yaz'); return; }
    authDo(({au,auth})=>au.sendPasswordResetEmail(auth,m.value.trim()),'📧 Şifre sıfırlama bağlantısı e-postana gönderildi'); },
  accSync:()=>cloudSync(),
  accUseCloud:()=>cloudSync('cloud'), accUseLocal:()=>cloudSync('local'),
  accOut:()=>{ if(!confirm('Çıkış yapılsın mı? Verilerin bu cihazda kalır, sadece artık buluta yedeklenmez.')) return;
    authDo(async ({au,auth})=>{ await cloudSync(); await au.signOut(auth); CM=null; cConflict=false; saveCM(); refreshAcc(); },'Çıkış yapıldı'); },
  wzLogin:()=>{ renderSettings(); $('#setDlg').showModal(); $('#accBox').scrollIntoView({block:'start'}); },
};
$('#setForm').addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='accPass') CA.accIn(); });

// daha önce giriş yapıldıysa açılışın ardından bağlan; geri dönünce ve internet gelince eşitle
if(CM) setTimeout(()=>fbLoad().catch(()=>{ cReady=true; refreshAcc(); }),1200);
document.addEventListener('visibilitychange',()=>{ if(!cUser||!CM) return;
  if(document.hidden){ if(Object.keys(CM.dirty).length) cloudSync(); } else if(Date.now()-CM.last>30000) cloudSync(); });
addEventListener('online',()=>{ if(cUser) cloudSync(); });

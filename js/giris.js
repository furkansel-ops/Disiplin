'use strict';
/* Giriş sayfası: oturum açılınca uygulamaya (index.html) geçer */
const $=s=>document.querySelector(s);
let mode='in', busy=false, FBP=null;
const fb=()=>FBP||(FBP=Promise.all(['firebase-app.js','firebase-auth.js'].map(f=>import(FBV+f))).then(([a,au])=>{
  const auth=au.getAuth(a.initializeApp(FB_CFG)); auth.languageCode='tr';
  au.onAuthStateChanged(auth,u=>{ if(u) enter(u); }); // kayıtlı oturum varsa ya da giriş başarılıysa
  return {au,auth};
}).catch(e=>{ FBP=null; throw e; }));
function enter(u){
  // uygulama bu kayda bakarak açılır; hesap değiştiyse eşitleme defteri sıfırdan başlar
  let m=null; try{ m=JSON.parse(localStorage.getItem(CKEY)); }catch(e){}
  if(!m||m.uid!==u.uid) try{ localStorage.setItem(CKEY,JSON.stringify({uid:u.uid,email:u.email||'',at:{},dirty:{},mod:{},last:0})); }catch(e){}
  location.replace('index.html'+location.hash);
}
function msg(t,ok){ const e=$('#msg'); e.textContent=t||''; e.hidden=!t; e.classList.toggle('ok',!!ok); }
function setBusy(b){ busy=b; document.querySelectorAll('#form button').forEach(x=>x.disabled=b); $('#go').textContent=b?'Bağlanıyor…':mode==='up'?'Hesabı oluştur':'Giriş yap'; }
async function run(fn,okText){
  if(busy) return; setBusy(true); msg('');
  try{ await fn(await fb()); if(okText) msg(okText,true); }catch(e){ msg(authMsg(e)); }
  setBusy(false);
}
function setMode(m){
  mode=m; const up=m==='up';
  for(const [id,on] of [['#tIn',!up],['#tUp',up]]){ $(id).classList.toggle('on',on); $(id).setAttribute('aria-selected',on); }
  $('#ttl').textContent=up?'Hesabını oluştur':'Tekrar hoş geldin';
  $('#sub').textContent=up?'Bir dakikada hesap aç, alışkanlıkların yedekli olsun.':'Kaldığın yerden devam etmek için giriş yap.';
  $('#pass').placeholder=up?'En az 6 karakter':'Şifren'; $('#pass').autocomplete=up?'new-password':'current-password';
  $('#forgotRow').hidden=up; $('#go').textContent=up?'Hesabı oluştur':'Giriş yap'; msg('');
}
$('#tIn').onclick=()=>setMode('in');
$('#tUp').onclick=()=>setMode('up');
$('#eye').onclick=()=>{ const p=$('#pass'), show=p.type==='password'; p.type=show?'text':'password'; $('#eye').setAttribute('aria-label',show?'Şifreyi gizle':'Şifreyi göster'); $('#eye').classList.toggle('on',show); p.focus(); };
$('#google').onclick=()=>run(({au,auth})=>au.signInWithPopup(auth,new au.GoogleAuthProvider()));
$('#forgot').onclick=()=>{ const m=$('#mail').value.trim(); if(!m){ $('#mail').focus(); msg('Sıfırlama bağlantısı için önce e-postanı yaz'); return; }
  run(({au,auth})=>au.sendPasswordResetEmail(auth,m),'📧 Şifre sıfırlama bağlantısı e-postana gönderildi'); };
$('#form').onsubmit=e=>{
  e.preventDefault(); const mail=$('#mail').value.trim(), pass=$('#pass').value, up=mode==='up';
  if(!/^\S+@\S+\.\S+$/.test(mail)){ $('#mail').focus(); msg('E-posta adresini yaz'); return; }
  if(pass.length<6){ $('#pass').focus(); msg('Şifre en az 6 karakter olmalı'); return; }
  run(({au,auth})=>(up?au.createUserWithEmailAndPassword:au.signInWithEmailAndPassword)(auth,mail,pass));
};
fb().catch(()=>msg('Bağlantı kurulamadı, internetini kontrol et'));
if('serviceWorker' in navigator&&location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});

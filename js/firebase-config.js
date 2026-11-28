'use strict';
/* Firebase ayarları: giriş sayfası ve uygulama ortak kullanır.
   Web anahtarı gizli değildir; verini Firestore kuralları korur (herkes yalnızca kendi uid'sine erişir). */
const FB_CFG={apiKey:'AIzaSyCwc2_FoWipD6ArsZen8jg4LfPvEQOLMz8',authDomain:'disiplin-a0542.firebaseapp.com',projectId:'disiplin-a0542',
  storageBucket:'disiplin-a0542.firebasestorage.app',messagingSenderId:'936901157130',appId:'1:936901157130:web:d901c17475e177e11f5af3'};
const FBV='https://www.gstatic.com/firebasejs/10.12.2/', CKEY='aliskanlik-bulut';
const AUTH_ERR={'auth/invalid-credential':'E-posta veya şifre yanlış','auth/wrong-password':'E-posta veya şifre yanlış','auth/user-not-found':'Bu e-postayla hesap yok, “Hesap aç”a geç',
  'auth/email-already-in-use':'Bu e-postayla zaten hesap var, “Giriş yap”a geç','auth/weak-password':'Şifre en az 6 karakter olmalı','auth/invalid-email':'E-posta adresi geçersiz',
  'auth/missing-password':'Şifreyi yaz','auth/popup-closed-by-user':'Google penceresi kapatıldı','auth/cancelled-popup-request':'Google penceresi kapatıldı',
  'auth/popup-blocked':'Tarayıcı Google penceresini engelledi','auth/network-request-failed':'İnternet bağlantısı yok','auth/too-many-requests':'Çok fazla deneme oldu, biraz bekle',
  'auth/unauthorized-domain':'Bu site Firebase’de yetkili alan adı değil','auth/operation-not-allowed':'Bu giriş yöntemi Firebase’de açık değil',
  'auth/admin-restricted-operation':'Yeni hesap açma kapalı','auth/user-disabled':'Bu hesap devre dışı'};
const authMsg=e=>AUTH_ERR[e&&e.code]||(e&&e.code?'Bir sorun oldu: '+e.code:'Bağlantı kurulamadı, internetini kontrol et');

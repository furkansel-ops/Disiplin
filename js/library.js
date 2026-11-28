'use strict';
/* ===== Alışkanlık kütüphanesi: hızlı ekle önerileri ve ek hazır paketler ===== */
// gezinme kategorisi → alışkanlığın istatistik kategorisi (CATS)
const LIB_CATS=[['saglik','💚 Sağlık','saglik'],['spor','🏃 Spor','saglik'],['zihin','🧠 Zihin','zihin'],['ogrenme','📚 Öğrenme','kariyer'],['is','💼 İş','kariyer'],
  ['beslenme','🍎 Beslenme','saglik'],['uyku','😴 Uyku','saglik'],['sosyal','🫂 Sosyal','sosyal'],['ev','🏠 Ev','kisisel'],['finans','💰 Finans','kariyer'],
  ['detoks','📵 Detoks','zihin'],['bakim','🧴 Öz bakım','saglik'],['hobi','🎨 Hobi','kisisel']];
const LIB_RAW={
  saglik:[['Su İç','💧',{target:2,unit:'lt'}],['Vitamin Al','💊',{slot:'sabah'}],['Diş İpi','🦷'],['Güneş Al','🌞',{target:15,unit:'dk'}],['Soğuk Duş','🧊',{diff:3}],
    ['Duruşunu Düzelt','🧍'],['20-20-20 Göz Molası','👀'],['Diş Fırçala','🪥',{target:2,unit:'kez'}],['Tansiyon Ölç','🩺'],['İlaç Al','💉'],['Her Saat Kalk','🚶'],
    ['Kilo Takibi','⚖️'],['Sigara İçme','🚭',{diff:3}],['Alkol Yok','🍷',{diff:2}]],
  spor:[['Koşu','🏃',{diff:3,target:5,unit:'km',inc:1}],['Yürüyüş','🚶',{target:30,unit:'dk',inc:5}],['10.000 Adım','🚶',{target:10000,unit:'adım',inc:1000}],
    ['Şınav','💪',{diff:2,target:50,unit:'tekrar',inc:10}],['Mekik','🤸',{target:50,unit:'tekrar',inc:10}],['Squat','🦵',{target:50,unit:'tekrar',inc:10}],['Plank','🧱',{target:3,unit:'dk'}],
    ['Yoga','🧘',{timer:20}],['Bisiklet','🚴',{target:10,unit:'km'}],['Yüzme','🏊',{diff:2}],['Spora Git','🏋️',{diff:3}],['İp Atla','🪢',{target:500,unit:'tur',inc:100}],
    ['Esneme','🤸'],['Barfiks','🧗',{diff:3,target:20,unit:'tekrar',inc:5}],['Dans Et','💃']],
  zihin:[['Meditasyon','🧘',{timer:10}],['Günlük Yaz','✍️'],['3 Şükür','🙏'],['Nefes Egzersizi','🌬️',{timer:5}],['Doğada Yürü','🌳'],['Olumlama Söyle','💭'],
    ['Hedeflerini Oku','🌠',{slot:'sabah'}],['Bulmaca Çöz','🧩'],['Satranç Oyna','♟️'],['Sessiz 10 Dakika','🤫'],['Bugün Neyi İyi Yaptım?','🌟',{slot:'aksam'}],['Endişeleri Yaz','📝'],['Gülümse','😊']],
  ogrenme:[['Kitap Oku','📕',{target:20,unit:'sayfa',inc:5}],['İngilizce Çalış','📘',{target:15,unit:'dk'}],['Kelime Ezberle','🔤',{target:10,unit:'kelime'}],['Podcast Dinle','🎧'],
    ['Belgesel İzle','🎬'],['Online Kurs','🎓',{timer:30}],['Ders Çalış','🧠',{diff:3,timer:25,target:120,unit:'dk'}],['Soru Çöz','✍️',{target:50,unit:'soru',inc:10}],['Tekrar Yap','🔁',{diff:2}],
    ['Makale Oku','📰'],['Not Çıkar','🗒️'],['Yeni Bir Şey Öğren','💡'],['Kod Yaz','💻',{target:60,unit:'dk'}],['Dil Çalış','🗣️',{target:30,unit:'dk'}]],
  is:[['Günü Planla','📋',{slot:'sabah'}],['Derin Çalışma','🎯',{diff:3,timer:50}],['Pomodoro','🍅',{target:4,unit:'pomodoro'}],['Gelen Kutusunu Boşalt','📥'],['En Önemli 3 İş','⭐'],
    ['Haftalık Değerlendirme','📊',{weekly:1}],['Masanı Topla','🗂️'],['Ağ Kur','🤝',{weekly:2}],['Yan Proje','🚀',{target:30,unit:'dk'}],['Erteleme Yok','⏱️',{diff:2}],
    ['Toplantı Notu Al','🖊️'],['Yarını Hazırla','🌙',{slot:'aksam'}]],
  beslenme:[['Sebze / Meyve Ye','🍎',{target:5,unit:'porsiyon'}],['Şekersiz Gün','🍬',{diff:3}],['Fast Food Yok','🍔',{diff:2}],['Kahvaltı Yap','🍳',{slot:'sabah'}],['Protein Al','🥩'],
    ['Evde Yemek Yap','🍲'],['Gazlı İçecek Yok','🥤'],['Yeşil Çay','🍵'],['Ara Öğün Yok','🚫'],["20.00'den Sonra Yeme",'🌙',{diff:2}],['Yavaş Ye','🥢'],['En Fazla 2 Kahve','☕'],['Salata Ye','🥗']],
  uyku:[["23.00'te Yat",'😴',{slot:'aksam'}],['Erken Kalk','⏰',{diff:2,slot:'sabah'}],['8 Saat Uyu','🛌',{target:8,unit:'saat'}],['Erken Yat','🌙'],['Yatakta Telefon Yok','📵',{diff:2}],
    ['Yatmadan Kitap','📖',{slot:'aksam'}],['Kısa Öğle Uykusu','💤'],['Odayı Karart','🌑'],['Akşam Kafein Yok','☕'],['Hep Aynı Saatte Kalk','🕰️']],
  sosyal:[['Aileyi Ara','📞'],['Bir Arkadaşa Yaz','💬'],['Bir İyilik Yap','💝'],['Yeni Biriyle Konuş','👋'],['Teşekkür Et','🤗'],['Kaliteli Aile Zamanı','👨‍👩‍👧'],
    ['Telefonsuz Yemek','🍽️'],['Gönüllülük','🤲',{weekly:1}],['Arkadaşla Buluş','☕',{weekly:1}],['Doğum Günlerini Hatırla','🎂'],['Sözünü Kesmeden Dinle','👂']],
  ev:[['Yatağını Topla','🛏️',{slot:'sabah'}],['10 dk Toparlan','🧹'],['Bulaşık','🍽️'],['Çamaşır','🧺',{weekly:2}],['Çiçek Sula','🪴'],['Bir Eşya Ayıkla','📦'],
    ['Mutfak Temizliği','🧽'],['Haftalık Alışveriş','🛒',{weekly:1}],['Evcil Hayvanla İlgilen','🐕'],['Çöpü At','🗑️']],
  finans:[['Harcama Yaz','💰'],['Para Biriktir','🐷'],['Gereksiz Harcama Yok','🛍️',{diff:2}],['Bütçeyi Kontrol Et','📊',{weekly:1}],['Yatırım Oku','📈'],['Faturaları Öde','🧾'],
    ['Abonelikleri Gözden Geçir','🔁',{weekly:1}],['Kahveni Evde Yap','☕'],['Kredi Kartı Kullanma','💳',{diff:2}]],
  detoks:[['Ekran Süresi 2 Saatten Az','📵',{diff:2}],['Sosyal Medya Yok','🚫',{diff:3}],['Ekransız Akşam','🌆',{slot:'aksam'}],['İlk Saat Telefonsuz','🌅',{slot:'sabah'}],
    ['Bildirimleri Kapat','🔕'],['Oyun Oynama','🎮',{diff:2}],['Haber Diyeti','🗞️'],['Telefonu Başka Odada Bırak','📱']],
  bakim:[['Cilt Bakımı','🧴'],['Güneş Kremi','🌤️',{slot:'sabah'}],['Saç Bakımı','💇'],['Tırnak Bakımı','💅',{weekly:1}],['Duş Al','🚿'],['Kendine Vakit Ayır','🛀'],
    ['Güzel Giyin','👔'],['Masaj','💆',{weekly:1}],['Yüz Maskesi','🧖',{weekly:2}]],
  hobi:[['Gitar Çal','🎸',{target:20,unit:'dk'}],['Piyano Çal','🎹',{target:20,unit:'dk'}],['Resim Çiz','🎨'],['Fotoğraf Çek','📷'],['Yazı Yaz','✒️',{target:300,unit:'kelime',inc:100}],
    ['Örgü Ör','🧶'],['Bahçe İşleri','🌱'],['Yeni Tarif Dene','👩‍🍳',{weekly:1}],['Şarkı Söyle','🎤'],['El İşi Yap','✂️'],['Maket / Lego','🧱']]};

// yeni hazır paketler (ilk 14'ün yanına)
Object.assign(TEMPLATES,{
  'YKS Hazırlık 🎯':[['TYT Denemesi','📐',{cat:'kariyer',diff:3,weekly:1}],['Paragraf Çöz','📖',{cat:'kariyer',target:20,unit:'soru',inc:5}],['Problem Çöz','🧮',{cat:'kariyer',target:30,unit:'soru',inc:5}],
    ['AYT Konu Çalış','🧪',{cat:'kariyer',diff:3,timer:50,target:120,unit:'dk'}],['Yanlışları Tekrar Et','🔁',{cat:'kariyer',diff:2}],['Erken Yat','😴',{cat:'saglik'}],['Kısa Yürüyüş','🚶',{cat:'saglik'}]],
  'Akşam Rutini 🌙':[['Ekransız Akşam','🌆',{cat:'zihin',slot:'aksam'}],['Yatmadan Kitap','📖',{cat:'zihin',slot:'aksam'}],['Diş Fırçala','🪥',{cat:'saglik',slot:'aksam'}],['Yarını Hazırla','🌙',{cat:'kariyer',slot:'aksam'}],["23.00'te Yat",'😴',{cat:'saglik',slot:'aksam'}]],
  'Yazılımcı 👨‍💻':[['Kod Yaz','💻',{cat:'kariyer',target:60,unit:'dk'}],['Teknik Okuma','📚',{cat:'kariyer',target:20,unit:'dk'}],['Algoritma Sorusu','🧩',{cat:'kariyer',diff:2}],['Kısa Yürüyüş','🚶',{cat:'saglik'}],['20-20-20 Göz Molası','👀',{cat:'saglik'}]],
  'Maneviyat 🕌':[['Dua Et','🤲',{cat:'zihin'}],['Manevi Okuma','📖',{cat:'zihin'}],['Tefekkür','🙏',{cat:'zihin'}],['Sadaka / Yardım','💝',{cat:'sosyal'}]],
  'Anne-Baba 👨‍👩‍👧':[['Çocukla Oyun Oyna','🧸',{cat:'sosyal'}],['Masal Oku','📚',{cat:'sosyal',slot:'aksam'}],['Eşle Kaliteli Zaman','💑',{cat:'sosyal'}],['Aile Yemeği','🍽️',{cat:'sosyal'}]],
  'Girişimci 🚀':[['Yan Proje','🚀',{cat:'kariyer',target:30,unit:'dk'}],['Müşteriyle Konuş','🗣️',{cat:'kariyer'}],['İçerik Üret','✍️',{cat:'kariyer'}],['Rakamları Takip Et','📊',{cat:'kariyer'}],['Ağ Kur','🤝',{cat:'sosyal',weekly:2}]],
  'Yaratıcılık 🎨':[['Resim Çiz','🎨',{cat:'kisisel'}],['Yazı Yaz','✒️',{cat:'kisisel',target:300,unit:'kelime',inc:100}],['Müzik Yap','🎵',{cat:'kisisel'}],['Fotoğraf Çek','📷',{cat:'kisisel'}],['İlham Topla','💡',{cat:'zihin'}]],
  'Kilo Verme ⚖️':[['Kilo Takibi','⚖️',{cat:'saglik'}],['Şekersiz Gün','🍬',{cat:'saglik',diff:3}],['10.000 Adım','🚶',{cat:'saglik',target:10000,unit:'adım',inc:1000}],['Su İç','💧',{cat:'saglik',target:2,unit:'lt'}],["20.00'den Sonra Yeme",'🌙',{cat:'saglik',diff:2}]],
  'Stres Yönetimi 🧘':[['Nefes Egzersizi','🌬️',{cat:'zihin',timer:5}],['Meditasyon','🧘',{cat:'zihin',timer:10}],['Doğada Yürü','🌳',{cat:'saglik'}],['Endişeleri Yaz','📝',{cat:'zihin'}],['Sosyal Medya Yok','🚫',{cat:'zihin',diff:3}]],
  'Dil Öğrenme 🗣️':[['Kelime Ezberle','🔤',{cat:'kariyer',target:10,unit:'kelime'}],['Orijinal Dilde Dizi','🎬',{cat:'kariyer'}],['Konuşma Pratiği','💬',{cat:'kariyer',diff:2}],['Dil Çalış','🗣️',{cat:'kariyer',target:30,unit:'dk'}]],
  'Sabahçı Kuş 🐦':[["05.30'da Kalk",'⏰',{cat:'saglik',diff:3,slot:'sabah'}],['Soğuk Duş','🧊',{cat:'saglik',diff:3,slot:'sabah'}],['Sabah Sayfaları','✍️',{cat:'zihin',slot:'sabah'}],['İlk Saat Telefonsuz','🌅',{cat:'zihin',slot:'sabah'}],['Güneş Al','🌞',{cat:'saglik',target:15,unit:'dk'}]],
  'Minimalizm 🍃':[['Bir Eşya Ayıkla','📦',{cat:'kisisel'}],['Gereksiz Harcama Yok','🛍️',{cat:'kariyer',diff:2}],['Dijital Temizlik','🗂️',{cat:'zihin',weekly:1}],['10 dk Toparlan','🧹',{cat:'kisisel'}]]});

// tek liste: kütüphane + paketlerdeki diğer alışkanlıklar (adı aynı olan bir kez)
const HABIT_LIB=(()=>{
  const out=[], seen=new Set(), back={saglik:'saglik',zihin:'zihin',kariyer:'is',sosyal:'sosyal',kisisel:'hobi'};
  const add=(n,e,c,o={})=>{ const k=n.toLocaleLowerCase('tr'); if(seen.has(k)) return; seen.add(k);
    const lc=LIB_CATS.find(x=>x[0]===c), opts={cat:lc?lc[2]:'kisisel',...o};
    out.push({i:out.length,n,e,c,o:opts,t:o.target&&!n.includes(fmt(o.target))?`${fmt(o.target)} ${o.unit||''}`.trim():o.weekly?`haftada ${o.weekly}`:o.timer?`${o.timer} dk`:''}); };
  for(const [c,list] of Object.entries(LIB_RAW)) for(const [n,e,o] of list) add(n,e,c,o);
  for(const list of Object.values(TEMPLATES)) for(const [n,e,o] of list) add(n,e,back[o?.cat]||'hobi',o);
  return out;
})();
const POPULAR=['Su İç','Kitap Oku','10.000 Adım','Meditasyon','Koşu','Günlük Yaz','3 Şükür','Sebze / Meyve Ye',"23.00'te Yat",'Ekran Süresi 2 Saatten Az',
  'İngilizce Çalış','Şınav','10 dk Toparlan','Harcama Yaz','Gitar Çal','Aileyi Ara','Cilt Bakımı','Doğada Yürü','Şekersiz Gün','Soru Çöz','Erken Kalk','Yoga','Günü Planla','Ders Çalış'];

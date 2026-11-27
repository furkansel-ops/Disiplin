# Alışkanlık Takvimi

Excel'deki "Alışkanlık Takvimi" yapısını temel alan, animasyonlu ve oyunlaştırılmış bir alışkanlık takip uygulaması. Kurulum gerektirmez, hiçbir kütüphane kullanmaz.

**Canlı sürüm:** https://furkansel-ops.github.io/Disiplin/

## Çalıştırma

- **Telefonda:** Canlı sürümü aç. Tarayıcı menüsünden **"Ana ekrana ekle"** (Android) ya da **Paylaş → Ana Ekrana Ekle** (iPhone) seçeneğini kullan. Uygulama gibi açılır ve internetsiz de çalışır.
- **Bilgisayarda:** `index.html` dosyasına çift tıkla. Ya da yerel bir sunucu başlat ve `http://localhost:5173` adresini aç:

```powershell
python -m http.server 5173
```

- **Verini bir cihazdan diğerine taşımak için:** ⋯ → **QR ile başka cihaza aktar** seçeneğini kullan, ardından diğer telefonun kamerasıyla QR kodu okut.

## Özellikler

**Takip**
- 12 ay için üç görünüm: Tablo, Takvim ve Bugün.
- Sayısal hedefler (litre, dakika gibi).
- Haftanın belirli günlerine planlama.
- "Haftada X kez" hedefi.
- Alt görevler.
- Kademeli hedef (her hafta biraz artar).
- Deneme süresi: "21 gün dene, sonra karar ver".

**Rutin**
- Sabah, öğle ve akşam rutinleri.
- Alışkanlık zinciri ("kahveden sonra kitap").
- Odak modu: tam ekranda sıradaki alışkanlık.
- Pomodoro zamanlayıcı.
- Arka plan sesi: beyaz gürültü, yağmur, okyanus.
- Nefes egzersizi.

**Oyunlaştırma**
- XP ve seviye.
- Günlük görevler.
- 22 başarım.
- Ayın boss'u.
- Büyüyen evcil hayvan.
- Seviyeyle açılan avatar aksesuarları.
- Meydan okumalar ("30 Gün Şekersiz" gibi).
- Alev seviyeli seriler.
- Joker gün ve seri dondurma.
- Tatil / hasta modu.

**Günlük**
- Ruh hâli, enerji, stres ve uyku kaydı.
- Not, şükür günlüğü, fotoğraf ve sesli not.
- Piksellerde yıl: her gün, seçtiğin ölçüye göre renklenir.
- Aranabilir günlük.
- Önce/sonra fotoğraf kaydırıcısı.
- Gelecekteki kendine mektup.
- Vizyon panosu.

**Analiz**
- Yıllık ısı haritası.
- Gün ve saat bazında verimlilik.
- Alışkanlıklar arası ilişkiler.
- Kaçırma sebepleri.
- Enerji, stres ve uykunun etkisi.
- Kişisel rekorlar.
- Yıllar arası karşılaştırma.
- Hedefe ulaşma tahmini.
- Haftalık rapor kartı.
- Yılın Hikâyesi (Wrapped).

**Paylaşım ve yedek**
- Arkadaşla kıyaslama (link / QR).
- Hikâye boyutunda paylaşım görseli.
- JSON, CSV ve Excel (.xlsx) içe ve dışa aktarma.
- Otomatik yedek klasörü (Chrome / Edge masaüstü).
- Yedek hatırlatıcısı.
- Birden fazla profil.

## Dosya yapısı

| Dosya | İçerik |
|---|---|
| `index.html` | İskelet ve pencereler |
| `css/app.css` | 6 tema, tüm stiller ve animasyonlar, yazdırma şablonu |
| `js/core.js` | Veri modeli, doğrulama, profiller, hesaplamalar (planlı günler, haftalık kota, tatil, kademeli hedef, seriler, boss) |
| `js/fx.js` | Sayaçlar, konfeti, ses efektleri, ay temalı arka plan, ipuçları |
| `js/qr.js` | Bağımlılıksız QR kod üretici |
| `js/rewards.js` | XP ve seviye, görevler, başarımlar, bahçe, bırakma takibi |
| `js/month.js` | Ay görünümü (Tablo / Takvim / Bugün), gün penceresi |
| `js/year.js` | Yıllık özet, ısı haritası, hedefler, Wrapped |
| `js/insights.js` | İçgörüler, alışkanlık detayı, haftalık rapor |
| `js/tools.js` | Alışkanlık yöneticisi, zamanlayıcı, içe/dışa aktarma, paylaş, yazdır, ayarlar |
| `js/extra.js` | Evcil hayvan, avatar, meydan okuma, odak, nefes, ses, günlük, mektup, vizyon, ek içgörüler, kıyaslama, QR aktarım, otomatik yedek |
| `js/main.js` | Gezinme, olaylar, geri alma, self-test |
| `sw.js`, `manifest.webmanifest`, `icon*` | Telefona yükleme ve çevrimdışı çalışma |

## Kısayollar

- `←` `→`: sayfa değiştir. Mobilde parmakla sağa-sola kaydır.
- `1`–`9`: bugünün alışkanlıklarını işaretle.
- `Ctrl+Z`: geri al.
- `Esc`: odak modundan ya da nefes ekranından çık.
- Gün numarasına tıkla: o günün tüm planlı alışkanlıklarını işaretle.
- Sayısal hücreye sağ tıkla (mobilde uzun bas): değeri elle gir.

## Notlar

- **Veriler:** Tarayıcının `localStorage` alanında, her profil için ayrı saklanır. Sesli notlar ise o cihazın IndexedDB'sinde tutulur ve JSON yedeğine girmez. Düzenli olarak **⋯ → JSON yedeği indir** ile yedek al.
- **QR aktarım:** Fotoğraflar, sesli notlar ve vizyon panosu aktarılmaz. Veri büyükse saat kayıtları, not metinleri ve son olarak eski günler sırayla çıkarılır; pencere neyin dahil edildiğini gösterir. Bağlantı verinin kendisini içerir, kimseyle paylaşma.
- **Arkadaş kıyaslama:** Bağlantı yalnızca özet içerir (profil adı, toplamlar, oranlar, ilk 5 alışkanlığın adı).
- **Hatırlatıcı:** Yalnızca uygulama açıkken çalışır.
- **Self-test:** `index.html#test` adresiyle aç.

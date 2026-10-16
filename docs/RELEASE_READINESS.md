# iOS build öncesi kontrol — 16 Ekim 2026

## Sonuç

Kaynak kodu, otomatik testler, Expo uyumluluğu ve yerel tarayıcı akışları kontrol edildi. Aşağıdaki düzeltmeler yereldedir; bu denetim sırasında commit, push, yeni Railway deploy'u veya EAS build başlatılmadı. Kontrol edilen mevcut canlı sürüm `81ee208` sonrasındaki deploy'dur.

Ürün kapsamı bağlantı kaydetme ve ortak listelerdir. Anı/galeri fotoğrafı yükleme özelliği kapsam dışı bırakıldı; uygulama ve API rotaları, yükleme istemcisi, S3 ayarları ve kamera/galeri izinleri kaldırıldı. Instagram gibi geçici kapak görsellerinin mevcut PostgreSQL önbelleği korunur. Ayrı S3/R2 servisi gerekmez. Gerçek iPhone girişleri, APNs teslimatı ve paylaşım uzantısı TestFlight kabulünde kalır. Bu rapor “bütün olası hatalar bitti” anlamına gelmez.

## Düzeltilen somut sorunlar

- Hesap değişiminde React Query önbelleği ve seçili alan temizlenmediği için önceki hesabın verileri kısa süre görünebiliyordu. Hesap kimliği değişince temizleniyor.
- Eşzamanlı 401 yanıtları aynı refresh token'ını tekrar tekrar kullanabiliyordu. Yenileme tek istekle yapılıyor; gecikmiş yanıt çıkış yapılmış hesabı geri açmıyor. Önceki hesabın isteği yeni hesabın token'ıyla tekrarlanmıyor. Profil/parola/silme/çıkış işlemleri de yenilenebilir istemciyi kullanıyor.
- Geçici ağ/sunucu hatası refresh token'ını siliyordu. Geçersiz kimlik bilgisi ile geçici hata ayrıldı. Backend refresh işlemi kilitleniyor; pasif hesap reddediliyor.
- Çevrimdışı paylaşım kuyruğu hesaba ait değildi. Kullanıcı kimliğiyle ayrıldı; aynı anda iki kez gönderim engellendi; kararlı istemci kimliği, yinelenen kayıt yanıtı, kalıcı ve geçici hatalar ele alındı. Uygulama açıkken 30 saniyede bir tekrar deneniyor. Eski, sahibi bilinmeyen kuyruk satırları başka hesaba yüklenmemesi için yerel şema yükseltmesinde kaldırılır.
- Alan/liste/öğe ekranları yalnızca ilk 50 sonucu okuyordu. Bütün API sayfaları birleştiriliyor; sonraki sayfa hatası eksik koleksiyon gibi gizlenmiyor.
- Aynı telefonda hesap değişiminde push token benzersizliği kayıt hatasına yol açabiliyordu. Token yeni hesaba aktarılıyor; tüm oturumlardan çıkışta/parola değişiminde eski cihaz kayıtları temizleniyor.
- Üye API'si görünen adı döndürmüyordu. Etkin üye adı döndürülüyor; pasif kullanıcının önceki adı ifşa edilmiyor.
- Expo SDK 57 yama sürümleri hizalandı ve yinelenen native paket sorunu çözüldü. Backend kalite kontrolünü engelleyen mevcut import/satır biçimi hataları giderildi.

## Doğrulama kanıtı

| Kontrol | Sonuç / kapsam |
| --- | --- |
| Backend | 142 test geçti. Giriş, doğrulama, Google/Apple imza kontrolleri, hesap silme, alan/listeler/öğeler, davet, üyelik, bildirim ve PostgreSQL önizleme görseli testi dahil. |
| Frontend | 37 test, 11 suite geçti; yenileme yarışları, hesap izolasyonu, çevrimdışı kuyruk ve sayfalama regresyonları dahil. |
| TypeScript | Başarılı. |
| TR/EN | 598 anahtar, 727 çeviri çağrısı; kataloglar ve parametreler eşleşiyor. |
| Expo Doctor | 21/21 kontrol başarılı. |
| iOS paketleme | Hermes/JavaScript export başarılı. Bu imzalı IPA değildir. |
| Backend Ruff | Bütün backend için hata yok. |
| Frontend ESLint | Hata yok; 39 uyarı var. |
| Canlı API | `/health` ve `/health/ready`: HTTP 200. |
| Canlı yasal sayfalar | `/legal?lang=en` ve `/legal?lang=tr`: HTTP 200. Silme formu gerçek kullanıcı talebiyle gönderilmedi; servis otomatik testte doğrulandı. |
| Apple bildirim rotası | Canlı GET 405: POST rotası mevcut. Gerçek Apple imzalı olay teslimatı henüz denenmedi. |
| EAS production | Google iOS/Web değişkenleri listeleniyor. Hesap konsolundaki OAuth yayın durumu ve gerçek native giriş bu kontrolle doğrulanmaz. |
| Yerel UI | Sahte hesapla e-posta girişi, dolu ana ekran, öğe ayrıntısı, önceki anı ekranı denemesi yapıldı; bu ekran ürün kapsamı netleştirilince kaldırıldı. Önceki bütün ekran dil denetimi `ENGLISH_SCREEN_AUDIT.md` içindedir; tüm ekranlar bu turda yeniden görsel olarak açılmış değildir. |
| iOS prebuild | Windows üzerinde Expo iOS prebuild üretmedi. Native Swift/Xcode derlemesi EAS macOS ortamında doğrulanacak. |

Yerel testler yalnızca bellek içi SQLite ve sahte hesaplar kullandı; üretime kullanıcı, e-posta veya push gönderilmedi. Test yaşam döngüsünün geliştiricinin gerçek DB bağlantısını kullanması engellendi. Eski anı ekranı denemesi ürün kabul kanıtı değildir.

## Kalan kurulum / gerçek cihaz kabulü

1. **Bağlantı önizlemeleri:** Instagram kapak görselinin küçültülüp `item_preview_images` tablosuna kaydedilmesi ve API üzerinden gösterilmesi yeni otomatik testle doğrulandı. Galeri yükleme / anı API yollarının 404 dönmesi de test edildi. Bu özellikler için depolama hesabı açılmayacak.
2. **Apple/Google:** Yeni imzalı iOS build'de ilk/tekrar giriş, iptal, Apple gizli e-posta, Google test kullanıcıları/yayın durumu doğrulanmalı. Apple bildirim adresinin kaydedilmiş olması gerçek olay kabulünün kanıtı değildir.
3. **Hesap silme:** E-posta/Google/Apple hesaplarıyla gerçek cihazdan silme; Apple yetki iptali, oturumların kapanması ve bekleyen iptal işlerinin temizlenmesi doğrulanmalı. Web silme formu hesap sahipliği incelemesi gerektiren destek talebidir.
4. **Paylaşım / davet:** Safari ve sosyal uygulamaların iOS paylaşım menüsü, soğuk açılış, oturum kapalıyken paylaşım, çevrimdışı → çevrimiçi gönderim, davetin uygulamayı açıp doğru alana katılması denenmeli. Mevcut paylaşım kaydetme akışı HTTP bağlantısı gerektirir; yalnız görsel/metin paylaşımı tam bir bağımsız içerik oluşturma akışı değildir.
5. **Bildirim / izin:** APNs kimlik bilgileri, gerçek iPhone push teslimatı, bildirimden doğru öğeye geçiş, çıkış sonrası eski hesap bildirimi gelmemesi denenmeli. Kamera/galeri erişimi bu üründe istenmez. Planlar/yorumlar/geçmiş gibi ana üründen kaldırılmış eski servisler bu denetimle yeniden etkinleştirilmedi.

Bu kurulumlar tamamlandıktan sonra değişiklikler gözden geçirilip push edilmeli, Railway deploy'u doğrulanmalı ve TestFlight build alınmalı.
Anı ve eski yükleme tablolarının tarihsel modelleri migration uyumluluğu için tutuldu; bu temizlik veritabanı tablosu veya üretim verisi silmez.

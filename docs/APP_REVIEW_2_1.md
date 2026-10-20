# App Review 2.1 — kod değişiklikleri ve cihazda kontrol

20 Ekim 2026. Bu çalışma yerel kaynak kodunu değiştirir. Üretime deploy, üretim
veritabanında migration, EAS build veya App Store Connect gönderimi yapmaz.

## Uygulamada eklenenler

- İçerik ayrıntısında **İçerik / kullanıcı bildir** ve başka kullanıcının
  içeriğindeyse **Kullanıcıyı engelle** düğmeleri.
- Alan ayrıntısı ve **Alanlarımı yönet → alanı düzenle → Üyeler ve güvenlik**
  üzerinden üye listesi. Başka bir üyeyi içerik eklememiş olsa bile bildirme/engelleme.
- **Ayarlar → Yardım → İçerik / Kullanıcı Şikayet Et** artık e-posta uygulaması
  açmak yerine uygulama içi bildirim formuna gider.
- Form: neden seçimi, 10–2000 karakter açıklama, gönderim/hata/tekrar deneme,
  başarılı kayıt sonrası bildirim numarası. Türkçe ve İngilizce desteklenir.
- **Ayarlar → Engellenen kullanıcılar**: listeleme ve engeli kaldırma.

## Engelleme tam olarak ne yapar?

Engelleme iki hesabın bütün etkin ortak alanlarındaki paylaşımı sonlandırır:

- Alanın sahibi engelleyen kişiyse karşı tarafın üyeliği kaldırılır.
- Alan başka birine aitse engelleyen kişi o alandan ayrılır. Yönetici olmak
  alan sahipliği sayılmaz. Üçüncü kişilerin üyelikleri korunur.
- Alan veya içerik silinmez; önceden kaydedilen içerikler alanda kalır.
- Erişimi kesilen kişi eski içerik adresleriyle de okuma/değiştirme yapamaz.
- İlgili eski bildirimler temizlenir. İşlemi yapan cihazın sorgu önbelleği ve
  seçili alanı sıfırlanır. Diğer cihazların önceden indirdiği veriler uzaktan
  silinemez; sonraki API isteklerinde üyelik denetlenir.
- Engel, davet bağlantısıyla aynı alanda tekrar buluşmayı iki yönde de önler.
  Üçüncü bir üyenin daveti de bunu aşamaz.
- Engeli yalnız koyan kişi kaldırabilir. Kaldırmak üyeliği geri getirmez;
  tekrar davet kabulü gerekir. Geçerliliği süren eski davetler de yeniden
  kullanılabilir. İki taraf da engellemişse iki engelin de kaldırılması gerekir.
- Çıkarılmış üyeye ait davetler yeni üye ekleyemez.

İşlemden önce bu sonuçlar onay ekranında açıklanır.

## Şikâyetler ve içerik denetimi

`content_reports` tablosunda bildiren hesap, hedef, alan, neden, açıklama,
içerik anlık görüntüsü ve inceleme sonucu saklanır. API başka kişilerin
bildirimlerini açmaz. Kullanıcı yalnız erişebildiği içerik/ortak üyeyi hedefleyebilir;
genel destek bildirimi de yapılabilir. Açık hedef bildirimi yinelenirse aynı
kayıt döner. Hesap başına 24 saatte 20 yeni bildirim sınırı vardır.

Kayıt önce veritabanına yazılır. Ardından mevcut Resend bağlantısıyla
`MODERATION_EMAIL` adresine (varsayılan `contact@durangezer.com`) bildirim gider.
E-posta hatası şikâyeti kaybettirmez. Gönderilmemiş bildirimler yönetim komutuyla
tekrar gönderilebilir; otomatik tekrar zamanlayıcısı kurulmamıştır.

Temel Unicode/harf büyüklüğü normalizasyonlu metin ve alan adı filtresi,
belirli açık tehdit ifadeleri ile yapılandırılmış alan adlarını reddeder.
Alan/liste adları, kayıt/profil adı, içerik başlığı ve metni kontrol edilir;
webden alınan önizleme metni ve adresleri de tekrar kontrol edilir. Filtreye
takılan web önizlemesi sunucuda görünmez yapılır. Bu filtre görsel/video
sınıflandırması yapmaz ve bütün uygunsuz içeriği tespit etme garantisi vermez.

Gizlilik/koşul ekranları, sunucunun yasal sayfası ve TR/EN statik kopyaları
şikâyet/engelleme verilerini ve kullanımını açıklar.

## Sunucuya alma sırası

1. Backend kaynak kodunu normal yayın süreciyle deploy et. Mevcut
   `backend/Dockerfile`, API başlamadan önce `alembic upgrade head` çalıştırıyor;
   bu Docker başlangıcı kullanılıyorsa yeni migration otomatik uygulanır.
   Başka bir başlangıç komutu kullanılıyorsa API başlamadan önce
   `python -m alembic upgrade head` çalıştırılmalı. Yeni revision
   `0017_content_safety`, yeni tablolar `user_blocks` ve `content_reports`.
   Bu çalışma sırasında üretimde migration çalıştırılmadı.
2. Resend'in çalıştığını ve moderasyon e-posta kutusunun izlendiğini doğrula.
   `MODERATION_EMAIL` isteğe bağlıdır. Örnek ayarlar `backend/.env.example` içindedir.
3. Yeni iOS build al. Mevcut App Store build 6 bu yerel değişiklikleri içermez.
4. Aşağıdaki kabul adımlarını yeni build ile gerçek cihazda uygula.

## Bildirimleri incelemek

Sunucunun kendi ortamında, backend klasöründe aşağıdaki komutlar kullanılır.
Veritabanı erişimi gerekir; uygulama kullanıcılarına açık yönetici API'si yoktur.
`REPORT_ID` yerine bildirim numarasını yaz. Gerçek veritabanı şifresini komuta koyma.

```powershell
python -m app.modules.safety.moderate pending
python -m app.modules.safety.moderate show REPORT_ID
python -m app.modules.safety.moderate review REPORT_ID remove --note "Confirmed inappropriate content"
python -m app.modules.safety.moderate review REPORT_ID suspend --note "Confirmed repeated abuse"
python -m app.modules.safety.moderate review REPORT_ID dismiss --note "No violation found"
python -m app.modules.safety.moderate notify
```

`remove` bildirilen içeriği ve önizleme önbelleğini kaldırır. `suspend` bildirilen
hesabı pasifleştirir, oturumlarını ve push kayıtlarını iptal eder, eklediği
içerikleri ve önizlemelerini kaldırır. `dismiss` içeriğe dokunmadan bildirimi
kapatır. Her incelemede not ve zaman tutulur. Aynı kapanmış bildirim tekrar
işleme alınmaz. **24 saat içinde inceleme insan tarafından yürütülmelidir; kod
bunu kendiliğinden yapmaz.** Bu süre uygulamadaki mevcut moderasyon taahhüdüdür.

## Gerçek iPhone'da senin yapacağın kabul / kayıt

1. Güncel iOS'ta yeni build'i uygulama simgesinden aç; sürüm, cihaz modeli ve
   iOS sürümünü not et. Kayıt, e-posta doğrulama, çıkış ve girişi dene.
2. İki deneme hesabı kullan. Ortak alan oluştur, ikinci hesabı davetle ekle;
   Safari paylaşım menüsünden bağlantı kaydet, listede ve ayrıntıda aç, tamamla.
3. İkinci hesabın içeriğini bildir. Başarı ekranındaki numarayı sunucu kaydı
   ve destek e-postasıyla eşleştir. E-posta uygulamasının kurulu olması gerekmez.
4. Üyeler ve güvenlik ekranından engelle. Önce alan sahibiyle, sonra başka
   kullanıcıya ait ayrı bir alanda engelleyen üye olarak dene. Onayda anlatılan
   tarafın erişimi kesilmeli; diğer üyeler etkilenmemeli.
5. Eski davetle yeniden katılmayı dene: engel varken reddedilmeli. Ayarlar'dan
   engeli kaldır: üyelik otomatik gelmemeli; geçerli davetle tekrar katılabilmeli.
6. Bağlantıyı kesip bildirim gönder: başarı mesajı gösterilmemeli, açıklama
   kaybolmamalı. Bağlantıyı açıp tekrar gönder.
7. Ayrı bir deneme hesabında hesap silmeyi tamamla; eski oturumun ve tekrar
   girişin geçersiz olduğunu doğrula. Apple/Google hesabıyla da silmeyi dene.
   Apple'a verilecek demo hesabını silme.

Bu sürümde yorum/tepki/planlama/anı API'leri kapalıdır; bunları videoda varmış
gibi anlatma. Hesap silme mevcut işlevi korunmuştur; bu çalışma fiziksel iPhone,
gerçek Apple/Google yetki iptali, gerçek e-posta teslimi veya App Review onayı
anlamına gelmez. App Store Connect'in veri toplama beyanını yeni güvenlik
bildirimleriyle karşılaştır; video bağlantısı, çalışan demo hesapları ve Apple'ın
altı maddelik açıklaması hem mesaja hem Review Notes'a eklenmelidir.

## Bu çalışmada doğrulananlar

### Son ek: engellemeden ayrılma ve üye bilgileri

Ana sayfa başlığındaki ve alan seçme panelindeki üye adları, ilgili alanın
üye bilgisi ekranını açar. Ad, alandaki rol ve katılım tarihi gösterilir;
e-posta veya giriş sağlayıcısı gibi özel hesap bilgileri paylaşılmaz.

Alan seçme panelindeki çıkış simgesi, alan ayrıntısı, üye listesi ve alanı
düzenleme ekranı **Alandan ayrıl** akışına erişir. Normal üyeler onayla çıkar;
alan sahibi başka etkin üye varsa yeni sahibi seçerek çıkar. Başka etkin üye
yoksa onay sonrası alan erişime kapatılır (kalıcı veri silinmez). İçerikler
alanda kalır, kimse engellenmez, diğer alanlar etkilenmez ve geçerli davetle
geri dönülebilir. Çıkıştan sonra bu alanın eski bildirimleri temizlenir.

Üye bilgisi API'si yalnız mevcut alan üyelerine açıktır; alandan ayrılan veya
başka alana ait bir üyelik kaydıyla özel bilgi alınamaz. Yeni özellikler için
ayrı bir veritabanı migration'ı gerekmez; önceki güvenlik migration'ı korunur.

Son ekin backend testleriyle toplam **162 test**, frontend'de **53 test / 13 suite**
geçti. TypeScript, TR/EN kontrolü ve yeni dosyaların lint kontrolü başarılı;
iOS JavaScript/Hermes paketlemesi de başarılı. UI testleri,
başlıktan/panelden üye açmayı, panelden çıkış akışını açmayı, sahip seçimini,
onay gerekliliğini, eski önbelleğin temizlenmesini ve ağ hatasında alanın
korunmasını kapsar. Aşağıdaki 157/46 sayıları ilk güvenlik çalışmasının
sonuçlarıdır.

- Backend: **157 test geçti**. Bunların 15'i yeni güvenlik/migration testleridir.
  Engelleyenin alan sahibi/üye olması, üçüncü üyelerin korunması, API erişiminin
  kesilmesi, iki yönde davet engeli, bekleyen kilit sonrası üyelik kontrolü,
  engeli kaldırma ve tekrar katılma, rapor yetkileri/kota/yinelenme,
  e-posta hatası/yeniden gönderim, içerik kaldırma ve hesap askıya alma kapsanır.
- Migration ileri/geri çevrimi, mevcut hesap korunarak izole SQLite üzerinde
  denendi. PostgreSQL DDL çıktısı üretildi. Gerçek üretim migration'ı veya
  PostgreSQL üzerinde eşzamanlı yük testi yapılmadı.
- Frontend: **46 test / 12 suite geçti**; 7 yeni ekran testi dahil. Form hatası,
  tekrar deneme, dil değişimi, onay gerekliliği, önbellek temizliği, başarısız
  engellemede veriyi koruma ve engeli kaldırma doğrulanır.
- TypeScript, TR/EN anahtar/parametre kontrolü ve backend Ruff başarılı.
  Yeni güvenlik dosyalarının ESLint kontrolü temiz. Projenin genel ESLint
  kontrolünde hata yok; önceki kodlarda uyarılar devam ediyor.
- iOS JavaScript/Hermes export başarılı. Bu, imzalı IPA veya fiziksel cihaz testi
  değildir. Gerçek e-posta/push gönderilmedi; testlerde sahte servisler kullanıldı.
- Başlangıçta değiştirilmiş olan `auth-store.ts` ve `session-safety.test.ts`
  korunmuştur; bu çalışmada bu iki dosyaya ayrıca müdahale edilmedi.

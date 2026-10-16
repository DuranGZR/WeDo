# WeDo TR / EN uygulama ve yayın notları

Güncelleme: 16 Ekim 2026. Kod ve yerel doğrulama tamamlandı; mağaza yayını ve gerçek iOS cihaz kabulü yapılmadı.

## Uygulanan davranış

- İlk açılışta cihazın dil listesindeki ilk desteklenen dil seçilir. Desteklenmeyen dillerde İngilizce kullanılır.
- Ayarlar’dan **Sistem dili / Türkçe / English** seçilebilir. Giriş/kayıt/doğrulama ekranlarında dil seçici gösterilmez. Tercih AsyncStorage’da saklanır; çıkışta silinmez.
- Dil değiştirmek ekranı veya formu yeniden oluşturmaz. Form değerleri, doğrulama kodu, davet token’ı ve kullanıcı verileri korunur. Eski dildeki geçici sunucu uyarıları temizlenir; istemci validasyonu yeni dilde tekrar hesaplanır.
- İki katalog uygulamada bulunur; çeviriler için ağ bağlantısı veya harici çeviri servisi gerekmez.
- Ekranlar, erişilebilirlik metinleri, boş/yüklenme/hata durumları, paylaşım mesajları, tarih/saat sunumu, sayısal çoğullar ve arama ele alındı. Kaynak kapsamı: [LOCALIZATION_COVERAGE.md](LOCALIZATION_COVERAGE.md).
- Adlar, liste adları, yorumlar, notlar, içerik başlıkları, URL’ler, enum/kimlikler ve plan zamanları çevrilmez veya değiştirilmez. Tarih biçimi cihazın saat diliminde gösterilir; planın saklanan zamanı aynı kalır.
- Her API isteği `Accept-Language` taşır. Backend `tr`/`en` dilini istek bağlamında çözer; ağırlıklı dil başlıklarını destekler. Desteklenmeyen/eksik başlık İngilizceye düşer. Yanıt `Content-Language` ve `Vary: Accept-Language` içerir.
- Hesap iletişim dili `users.preferred_language`, cihaz bildirim dili `device_push_tokens.language` ile tutulur. Dil güncellemeleri sırayla senkronize edilir; uygulama tekrar aktif olduğunda yeniden denenir. Başka dilde sıradan bir API isteği hesap tercihini değiştirmez.
- Doğrulama e-postası hesap dilinde, push her cihazın kendi dilinde hazırlanır. Bildirim merkezindeki metinler görüntüleme dilinde çözülür. Yeni bildirimlerde anahtar/parametreler saklanır; eski bilinen türler İngilizcede türlerine uygun güvenli metinle, bilinmeyen türler genel bir güncellemeyle sunulur. Kullanıcı içeriği otomatik çevrilmez.
- Davet ve yasal web sayfaları iki dillidir; `?lang=tr` / `?lang=en` ile açık seçim yapılabilir. Hesap silme formu seçili dilde API’ye istek gönderir. Statik `docs/legal` sayfaları aynı kaynaktan üretilir ve canlı güvenli forma bağlanır.

## Kaynaklar

| Alan | Kaynak |
| --- | --- |
| Mobil metinler | `frontend/src/i18n/resources/{tr,en}.json` |
| Dil çözümleme / biçimlendirme | `frontend/src/i18n/` |
| Kalıcı tercih | `frontend/src/store/language-store.ts` |
| Backend metinleri | `backend/app/locales/{tr,en}.json` |
| İstek dili | `backend/app/core/localization.py` |
| Yasal sayfa ortak şablonu | `backend/app/templates/legal.html` |
| iOS izin metinleri | `frontend/locales/{tr,en}.json` |
| Veri geçişi | `backend/migrations/versions/0015_localization.py` |

## Doğrulama

16 Ekim 2026 yerel sonuçları:

- Frontend TypeScript kontrolü başarılı.
- 37 frontend testi başarılı: dil çözümleme, kalıcılık, sistem moduna dönüş, saklama hatası, form/kod/davet korunması, API başlığı, çoğul, tarih/sayı, Türkçe karakter araması, web Google düğmesi ve davet ekranı dahil.
- 142 backend testi başarılı: istekler arasında dil yalıtımı, hesap dili, e-posta, cihaz bazlı push, eski bildirimler, dinamik şema varsayılanları, davet HTML kaçışları ve silme formu dahil.
- Katalog kontrolü: 598 anahtar ve 727 kaynak çeviri çağrısı. İki dilde eksik/boş anahtar, farklı parametre ve tarama kapsamındaki sabit UI metni bulunmadı. Bu kontrol, insan redaksiyonunun veya cihaz testinin yerine geçmez.
- ESLint: 0 hata; 39 uyarı var (React ref/animasyon, kullanılmayan değişkenler ve test mock importları dahil).
- Migration: izole SQLite veritabanında `0014 → 0015 → 0014 → 0015`; PostgreSQL için çevrimdışı SQL üretimi başarılı. Üretim veritabanına bağlanılmadı.
- iOS JavaScript/Hermes export başarılı. Bu, imzalanmış `.ipa` veya TestFlight testi değildir.
- 390 px tarayıcı görünümünde bütün ekran rotalarının İngilizce metinleri kontrol edildi; dolu/boş içerikler ve alt pencereler dahil bulgular [ENGLISH_SCREEN_AUDIT.md](ENGLISH_SCREEN_AUDIT.md) dosyasında. İki dil arasında geçiş, alanların korunması ve açık validasyonun çevrilmesi de doğrulandı. Tüm ekranlara ait gerçek cihaz görsel kabulü henüz yapılmadı.

Tekrar çalıştırma:

```powershell
# frontend klasöründe
pnpm typecheck
pnpm test
pnpm i18n:check
pnpm exec node scripts/check-locales.cjs --write-inventory
pnpm lint

# backend klasöründe
uv run pytest
uv run python scripts/export_legal.py --check
```

Metin veya yasal şablon değişirse statik sayfaları `uv run python scripts/export_legal.py` ile yeniden üretin.

## Yayına geçiş

1. Önce backend yayınlanmalı ve `alembic upgrade head` çalışmalı. Mevcut Docker başlangıcı zaten migration’ı uyguluyor. `0015` eski hesap/cihazlara Türkçe varsayılanı verir; uygulama aktif dilini daha sonra senkronize eder. Aynı veritabanını kullanan worker da yeni kodla güncellenmelidir.
2. Ardından yeni iOS build alınmalı. `expo-localization` ve native yerelleştirme ayarları eklendiği için yalnızca OTA/JavaScript güncellemesi yeterli değildir.
3. Mevcut Google istemci ID’leri, API URL ve Resend ayarları korunur. Çeviri altyapısı için yeni gizli anahtar gerekmez.
4. App Store kaydı oluşturulduğunda gerçek mağaza bağlantısı backend’de isteğe bağlı `APP_STORE_URL` olarak eklenebilir. Ayar yoksa davette bozuk/geçici mağaza bağlantısı gösterilmez; uygulamayı açma bağlantısı çalışmaya devam eder.
5. App Store Connect’te İngilizce mağaza açıklaması ve ekran görüntüleri ayrıca hazırlanmalıdır. Kayda erişilmedi ve mağaza yayını yapılmadı.

## Gerçek cihaz kabul listesi

Windows ortamında Expo iOS native proje üretimini desteklemediği için native prebuild ve imzalama tamamlanmadı. EAS/macOS build ve Apple hesabı üzerinden şu kontroller yapılmalı:

- Türkçe, İngilizce ve desteklenmeyen dilde temiz kurulum/soğuk açılış; uygulama yeniden açılınca tercihin kalması.
- Sistem modunda iOS uygulama dili değişikliği; büyük yazı boyutunda ve küçük ekranda tüm rotaların iki dilde görsel kontrolü.
- Gerçek cihazda Google/Apple girişleri; doğrulama e-postası, silme ve davet akışları.
- Aynı hesapta Türkçe ve İngilizce iki cihaz; uygulama kapalıyken gelen gerçek push ve bildirimden açılan rota.
- Fotoğraf/kamera izinleri ve iOS paylaşım ekranı. OS’ye ait pencereler cihazın/iOS uygulama dilinin kurallarını izler; uygulama içindeki dil seçimi işletim sistemi ayarını değiştirmez.
- Son dil tercihini çevrimdışıyken değiştirip uygulamaya dönme ve iletişim/bildirim dilinin sunucuya yeniden kaydolması.

Yayın durumu Git geçmişinden ve dağıtım servisinden ayrıca kontrol edilmelidir. Bu belgedeki yerel kontroller, mağaza yayınının tamamlandığı anlamına gelmez.

Apple hesap bildirimleri, şifreli token saklama, iptal kuyruğu ve canlı kurulum sırası: [APPLE_SIGN_IN.md](APPLE_SIGN_IN.md). Bu ekleme gerçek Apple anahtarı ve TestFlight testi bekler.

Son build öncesi genel denetim ve kalan gerçek cihaz kontrolleri: [RELEASE_READINESS.md](RELEASE_READINESS.md).

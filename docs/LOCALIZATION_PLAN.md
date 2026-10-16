# WeDo Türkçe / İngilizce desteği — uygulama planı

Plan tarihi: 15 Ekim 2026. Güncelleme: 16 Ekim 2026.

Durum: kod uygulaması ve yerel otomatik kontroller tamamlandı. TestFlight ve gerçek cihaz kabul testleri bekliyor. Güncel uygulama, doğrulama ve yayın notları: [LOCALIZATION.md](LOCALIZATION.md).

## 1. Hedef ve kapsam

WeDo, Türkçe ve doğal İngilizce ile uçtan uca kullanılabilir olacak. Bir dili
seçmek yalnızca ekran başlıklarını değil; doğrulama, hata, bildirim, e-posta,
paylaşım, erişilebilirlik ve web sayfalarının dilini de belirleyecek.

Kod taraması: 39 ekran rotası, 128 frontend TypeScript/TSX dosyası; bunlardan
59'u Türkçe karakter içeriyor. Bu son sayı çeviri anahtarı veya tam kapsam sayısı
değildir: ASCII yazılmış Türkçe, native kaynaklar ve backend ayrıca incelenecek.
Başlangıçta `frontend/src/lib/i18n.ts` yalnızca altı Türkçe ifade içeriyordu; artık merkezi altyapıya yönlendiriyor.

Kullanıcıların adları, liste adları, notları, yorumları, kaydettiği içerikler ve
URL'ler otomatik çevrilmeyecek. API alan adları, enum değerleri, kimlikler,
rotalar, marka adı WeDo, doğrulama kodları ve loglar dil değişiminden etkilenmeyecek.

## 2. Dil davranışı: önceden kararlaştırılan kurallar

| Durum | Beklenen davranış |
| --- | --- |
| İlk açılış | İşletim sisteminin uygulama için bildirdiği dil listesinde ilk desteklenen dili seç; hiçbiri desteklenmiyorsa İngilizce |
| Türkçe cihaz | Türkçe açılır |
| İngilizce cihaz | İngilizce açılır; bölgesel tarih tercihleri korunur |
| Yalnızca desteklenmeyen diller | İngilizce açılır |
| Kullanıcı seçimi | Ayarlar: Sistem dili / Türkçe / English |
| Elle dil seçimi | Tüm açık ekranlar ve validasyonlar yeniden başlatma gerektirmeden güncellenir |
| Uygulama kapatılıp açılır | Kaydedilen dil tercihi korunur; yanlış dilde ilk ekran parlaması olmaz |
| Sistem modunda cihaz dili değişir | Uygulama tekrar aktif olduğunda desteklenen dile uyarlanır |
| Çevrimdışı açılış | Her iki dil paketi uygulamada bulunduğu için çeviriler çalışır |
| Oturum yok | Dil seçimi girişten önce de erişilebilir olur |
| Dil değişirken form/davet açık | Form verisi, kod, davet token'ı, navigation ve seçimler korunur |

Tercih, cihazda AsyncStorage ile `system | tr | en` olarak tutulacak. Çözümlenmiş
dil `tr | en`; biçimlendirme locale'i ayrı olacak. Desteklenmeyen tercih değerleri
güvenli biçimde sistem moduna dönecek. Çıkış, uygulamanın dilini sıfırlamayacak.

Backend'de hesap iletişim dili; her cihaz kaydında push dili tutulacak. Aynı
hesabın Türkçe ve İngilizce kullanan iki cihazına kendi dillerinde push gidecek.
Hesap e-postaları, son açıkça senkronize edilen iletişim dilini kullanacak.
Başka bir cihazın sıradan API isteği hesap tercihini değiştirmeyecek.

## 3. Teknik yapı

Frontend: Expo uyumlu `expo-localization`, `i18next`, `react-i18next`.
Zaten kurulu AsyncStorage kullanılacak. Harici çeviri SaaS'ı, çalışma anında
çeviri API'si veya özel bir çeviri motoru kurulmayacak.

Önerilen yerleşim:

```text
frontend/src/i18n/
  index.ts                 # Başlatma, desteklenen diller, fallback
  locale.ts                # Dil çözümleme
  format.ts                # Tarih, sayı, göreli zaman
  resources/tr/*.json
  resources/en/*.json
  types.d.ts               # Anahtar tip güvenliği
frontend/src/store/language-store.ts
backend/app/core/localization.py
backend/app/locales/tr/*.json
backend/app/locales/en/*.json
```

Çeviri grupları: common, auth, onboarding, home, spaces, lists, items, plans,
memories, sharing, activity, notifications, settings, validation, errors, legal.
Dosyalar ihtiyaç ölçüsünde bölünecek; her ekran için ayrı altyapı kurulmayacak.

Anahtarlar anlamsal olacak: `auth.verification.resendCountdown` gibi.
`text42` veya Türkçe cümleyi anahtar olarak kullanmayacağız. Cümleler parçaların
birleştirilmesiyle kurulmayacak; değişkenli tam cümleler kullanılacak.

React bileşenleri `useTranslation` ile yeniden render olacak. Modül yüklenirken
çevirisi dondurulmuş diziler, Zustand mesajları, Zod şemaları, enum etiketleri ve
toast metinleri ayrıca düzenlenecek. Form doğrulama dili, formu sıfırlamadan değişecek.

## 4. Uygulama sırası ve aşama kapıları

### Aşama 1 — Metin ve davranış envanteri

- 39 ekranın her biri için başlık, gövde, buton, form, boş/yüklenme/hata durumu,
  modal, toast, tooltip ve erişilebilirlik metinlerini listele.
- Shared bileşenleri, hata sınırını, bağlantı hatalarını, offline/outbox mesajlarını,
  push bildirimlerini, native kaynakları ve görsel içindeki metinleri listele.
- Her satıra kaynak dosya, anahtar, TR, EN, değişkenler, bağlam ve QA durumu ekle.
- Gizli kullanıcı içeriğini veya çalışma ortamı sırlarını envantere alma.

Tamamlanma: Tüm rotalar bir kapsam listesine bağlı; çeviri sayısı varsayılmıyor.

### Aşama 2 — Terminoloji ve ürün dili

İlk aday sözlük:

| Türkçe kavram | İngilizce ürün karşılığı | Not |
| --- | --- | --- |
| Ortak alan | Space | Ortak kullanım bağlamını onboarding'de açıkla |
| Liste | List | Tüm ekranlarda aynı kavram |
| Kaydet | Save | İçeriği saklama eylemi |
| İçerik | Item / saved item | Kullanıcıya gösterilen bağlama göre |
| Plan | Plan | Tarihli ortak plan |
| Anılar | Memories | Fotoğraf/not özelliği |
| Oy ver | Vote | Karar akışında |
| E-postanı doğrula | Verify your email | Güvenlik akışında |
| Kodu tekrar gönder | Resend code | Sayaca uygun kısa buton |
| Hesabı Sil | Delete account | Silme eylemi |
| Hesap silme talebi | Account deletion request | Web formunda talep, doğrudan silme vaadi değil |

Türkçe samimi ve tutarlı, İngilizce kısa ve doğal olacak. Aynı eylem için Sign in /
Log in rastgele karıştırılmayacak; Sign in kullanılacak. Sistem terimleri dışında
gereksiz başlık büyük harfleri ve kelimesi kelimesine çeviri kullanılmayacak.
Tüm EN metinlere ikinci bir bağlam/redaksiyon turu uygulanacak; bu, ana dilde
profesyonel çevirmen incelemesi yapılmış gibi sunulmayacak.

Tamamlanma: Ortak sözlük ve üslup kuralları hazır; kritik auth/silme cümleleri net.

### Aşama 3 — Dil altyapısı ve tercih ekranı

- Provider başlangıcına dil yüklemesini ekle; splash, auth ve dil hydration'ını koordine et.
- İlk dil çözümleme, kalıcı seçim, fallback ve uygulama aktifleşme davranışını kur.
- Giriş öncesi erişim ve ayarlarda siteyle uyumlu, erişilebilir dil seçimi sun.
- TR/EN kaynaklarını pakete ekle; eski altı anahtarlı yardımcıyı kontrollü taşı.
- Dil değişince yalnızca dile bağlı React Query verilerini yenile; tüm verileri
  gereksiz yere silme, kullanıcı içeriğini ve offline kuyruğunu koru.

Tamamlanma: Örnek giriş ve ayarlar ekranı iki dilde çalışıyor; tercih kalıcı.

### Aşama 4 — Kullanıcı yolculuklarına göre ekran çevirileri

1. Welcome, kayıt, giriş, Google/Apple butonları, doğrulama kodu, form hataları.
2. Onboarding, alan oluşturma, üye daveti, şablonlar, paylaşım anlatımı.
3. Ana ekran, tab bar, listeler, arama/filtre, içerik ekleme/detay/düzenleme.
4. Oylar, reaksiyonlar, yorumlar, geçmiş ve aktivite.
5. Planlar, hatırlatmalar, anılar, fotoğraf yükleme/izin/retry durumları.
6. Paylaşım ekranı, dış uygulamadan paylaşma, offline ve senkronizasyon.
7. Profil, alan/üye yönetimi, bildirimler, yardım, şifre ve hesap silme.
8. Yasal ekranlar, genel hata sınırı, erişilebilirlik etiketleri ve durum mesajları.

Şablonlar ve seçenekler sabit `id` ile tutulacak; çevrilmiş etiket kimlik olarak
kullanılmayacak. Özellikle `list-templates.tsx` seçimi bugün Türkçe etikete bağlı.
Gerçek liste olarak kaydedilmiş mevcut adlar değiştirilmeyecek; yeni varsayılan
adlar oluşturulurken kullanıcının o andaki dili kullanılacak.

Tamamlanma: Kapsam tablosundaki her ekran ve durumu TR/EN olarak işaretli.

### Aşama 5 — Tarih, sayı, çoğul, arama

- Sabit `tr-TR` tarih/sayı kullanımlarını ortak `Intl` yardımcılarına taşı.
- Çoğullar `count` ve dile uygun plural kurallarıyla yazılsın; 0/1/2 ve yüksek
  sayılar kontrol edilsin. Sayaçlar ve karakter sınırı açıklamaları dahil.
- Dil ve saat dilimini ayrı tut: dili değiştirince planın saati/günü değişmesin.
- Türkçe/İngilizce bölgesel tarih ve saat biçimlerini bilinçli destekle; EN için
  desteklenen İngilizce cihaz locale'i, yoksa belirlenmiş `en-GB` fallback kullan.
- Türkçe I/İ/ı/i ve kullanıcı içeriğinde arama/sıralamayı test et. Depolanmış
  adları, URL'leri veya paylaşım verilerini dil değişiminde normalize etme.

Tamamlanma: Aynı plan aynı anı temsil ediyor; yalnızca sunum dili değişiyor.

### Aşama 6 — API hata sözleşmesi ve backend dili

- Tüm HTTP isteklerine çözümlenmiş `Accept-Language` ekle; giriş öncesi dahil.
- Backend dil çözümleyicisi `tr`, `tr-TR`, `en`, `en-US` ve kalite ağırlıklı
  header'ları güvenli biçimde ele alsın; desteklenmeyen dil için EN kullansın.
- E-posta kayıt isteği dilini doğrula; kullanıcı profilinde iletişim dili ve
  cihazlarda bildirim dili için migration/schema güncellemelerini yap.
- Türkçe mesaj metni karşılaştırarak hata tanıma yapma. Alan bazlı, sabit hata
  kodları ve güvenli değişkenler kullan; yalnızca `HTTP_400` yeterli olmayacak.
- Backend yanıtı yerelleştirilmiş güvenli mesaj taşısın; frontend bilinen kodları
  kendi kataloğundan gösterebilsin. Bilinmeyen kodlarda çevrilmiş genel hata verilsin.
- Pydantic alan doğrulaması, rate limit, 401/403/404/409/422/429/503 ve bağlantı
  hataları bu kapsamda. SQL/SMTP/sağlayıcı exception metnini kullanıcıya aktarma.
- Eski istemciler için yanıt alanlarını koru. Dil değişen web/API yanıtlarında
  cache ayrımı (`Vary: Accept-Language`) ve gerekirse `Content-Language` kullan.

Tamamlanma: İngilizce kullanıcı güvenlik/hata durumunda Türkçe mesaj görmüyor;
doğrulama süresi, deneme sınırı ve yetkilendirme davranışları korunuyor.

### Aşama 7 — E-postalar, bildirimler ve geçmiş

- Doğrulama e-postasının konu, gövde, güvenlik uyarısı ve destek bağlantılarını çevir.
- İlk gönderim ve resend aynı hesaba ilişkin güncel dil kuralını kullansın.
- Dili kayıt sırasında belirle; request'i bulunmayan worker iletişim dilini DB'den alsın.
- Bildirim/aktiviteyi `type` + güvenli parametrelerle modelle; kullanıcı adlarını
  ve içerik başlıklarını cümlenin çevrilebilir parçasından ayır.
- Yeni istemciler bildirim listesini seçili dilde görsün; push metni cihazın
  kayıtlı dilinde gönderim anında üretilsin. Bir alandaki farklı diller karışmasın.
- Mevcut `title/body` alanları eski istemciler için korunabilir; yeni mesaj
  anahtarı/parametre alanları eklemeli ve geriye uyumlu gelsin.
- Eski bildirimler yalnızca type ve eldeki veri güvenle yeterliyse yeniden sunulsun.
  Eksik alanlarda kullanıcı metnini tahmin etmek yerine yerelleştirilmiş nötr
  bildirim göster; serbest metne toplu makine çevirisi uygulama.

Tamamlanma: TR ve EN iki kullanıcı/iki cihaz senaryosu doğru; geçmiş veriler bozulmuyor.

### Aşama 8 — Web ve native yüzeyler

- Davet, geçersiz/süresi dolmuş davet ve uygulamayı aç/indir sayfaları TR/EN olsun.
- Web önceliği: açık `?lang=tr|en` seçimi > tarayıcı dili > EN. Davet token'ı ve
  yönlendirme parametreleri dil değişiminde korunacak; HTML `lang` güncellenecek.
- Gizlilik, kullanım koşulları ve hesap silme sayfaları aynı davranışı anlatan
  TR/EN sürümlerine sahip olacak. Silme talebini otomatik silme gibi çevirmeyeceğiz.
- `docs/legal` kopyaları ve backend HTML'i için ortak kaynak/üretim akışı kur;
  birbirinden bağımsız iki metnin sürüklenmesini önle. Tarih ve içerik sürümü eşleşsin.
- Fotoğraf/kamera izin açıklamalarını iOS native localization kaynaklarında çevir;
  yalnızca React metinlerini değiştirmek bu sistem pencerelerini çevirmiyor.
- Paylaşım uzantısının app-owned metinlerini ve App Group dil aktarımını incele;
  sistemin kendi butonlarını hardcode etmeden OS'nin dil davranışıyla test et.
- App Store desteklenen diller, EN açıklama/anahtar kelimeler ve gerçek EN
  ekran görüntülerini ayrı yayın teslimatı olarak hazırla. Gerçek mağaza URL'si
  henüz oluşmadıysa geçici bağlantıyı tamamlanmış sayma.

Tamamlanma: Uygulamadan web'e ve geri dönüşte dil tutarlı; native metinler yeni build'de doğrulanmış.

### Aşama 9 — Çeviri kalite ve otomatik kontroller

- Anlamsal anahtar kapsamı, boş değer, tekrar eden JSON anahtarı ve değişken
  eşleşmesini CI'da kontrol et. Her dilin gerekli plural varyantlarını ayrıca
  denetle; plural kuralları farklı diye ham dosya anahtar eşitliğine dayanma.
- Kaynak taramasında JSX metni, props, Zod, toast, Alert, accessibility, backend
  yanıtları, HTML ve native kaynaklardaki çevrilmemiş ifadeleri yakala.
- İzin listesi yalnızca marka, teknik sabit ve gerçek kullanıcı içeriği gibi
  gerekçeli durumları kapsasın; testteki eksik çeviriler fallback ile gizlenmesin.
- Anahtar ve parametre tipleri yanlış kullanımı derleme sırasında yakalasın.
- Locale çözümleme, saklama, dil değişimi, form validasyonu, çoğullar, API,
  e-posta ve push için davranış testleri ekle.
- Metinleri uzatan pseudo-localization ile taşma kontrolü yap; çıktıyı yayımlama.

Tamamlanma: Eksik anahtar/değişken taraması temiz; var olan testler de geçiyor.

### Aşama 10 — Görsel QA, son redaksiyon ve yayın

Her iki dilde gerçek ekranları kontrol et: küçük iPhone, normal iPhone, büyük
yazı boyutu; web davet/yasal sayfaları için dar ve geniş görünüm. Buton kesilmesi,
klavye açık form, satır taşması, toast/modal ve VoiceOver açıklamalarını denetle.

Uçtan uca matrisi:

| Akış | TR | EN | Ek koşul |
| --- | --- | --- | --- |
| Kayıt → kod → giriş | Zorunlu | Zorunlu | Yanlış kod, süre dolması, resend, mail hatası |
| Google / Apple | Zorunlu | Zorunlu | İptal, hata ve uygulama kontrollü mesajlar |
| Davetle kayıt/giriş | Zorunlu | Zorunlu | Token ve yönlendirme korunuyor |
| Alan/liste/içerik | Zorunlu | Zorunlu | Kullanıcı içeriği aynen kalıyor |
| Yorum/oy/aktivite | Zorunlu | Zorunlu | İsimler, çoğullar, geçmiş |
| Paylaşım uzantısı | Zorunlu | Zorunlu | Cold start ve açık uygulama |
| Offline → senkronizasyon | Zorunlu | Zorunlu | Dil değişince outbox bozulmuyor |
| Plan / hatırlatma / push | Zorunlu | Zorunlu | Saat dilimi ve farklı dilde alıcı |
| Profil / şifre / hesap silme | Zorunlu | Zorunlu | Güvenlik ve mesajların anlamı korunuyor |
| Dil değiştirme | Zorunlu | Zorunlu | Açık form, yeniden açılış, sistem modu |

Çalıştırılacak kontroller: frontend typecheck/lint/test, backend pytest ve
değişen kod için lint, katalog kontrolleri, migration denemesi ve iOS export/build.
Native izin/push/paylaşım doğrulaması TestFlight'ta gerçek cihazla yapılacak;
web önizlemesi bunun yerine geçmiş sayılmayacak.

## 5. Commit ve deploy sırası

1. Kataloglar + dil altyapısı + tercih arayüzü.
2. Auth/onboarding ve temel kullanıcı yolculukları.
3. Kalan ekranlar + erişilebilirlik + tarih/sayı/validasyon.
4. Backend locale ve hata sözleşmesi; geriye uyumlu migration.
5. E-posta/push/aktivite + geçmiş veri uyumluluğu.
6. Web/native metinleri + katalog denetimleri + son redaksiyon.
7. Önce backend deploy, sonra yeni iOS build ve TestFlight kabul testi.

Çalışma commit'leri tek bir yarım yerelleştirme sürümü olarak kullanıcılara
açılmayacak; iki dilde kapsam tamamlanınca yayınlanacak. Commit/push ve mağaza
yayını kullanıcının ayrıca verdiği yayın yetkisi kapsamında yapılacak.

## 6. Tamamlandı diyebilmemiz için

- [x] Rotalar ve ortak bileşenler kaynak taramasına alındı; [kapsam listesi](LOCALIZATION_COVERAGE.md) üretildi.
- [x] TR/EN anahtar, plural ve parametre kontrolleri temiz.
- [x] Dil anında değişiyor; yerel tercih ve iki gömülü katalog kullanılıyor. Kalıcılık ve sistem dili geçişi test edildi.
- [x] Form değeri, doğrulama kodu ve davet token’ı dil değişiminde korundu (otomatik test).
- [x] E-posta, hata, push, davet ve yasal sayfalardaki dil akışları otomatik test edildi; canlı teslimat cihaz kabulüne dahil.
- [x] Eski istemci alan varsayılanları ve eski bildirimlerin dil sunumu ele alındı; migration yerelde geri/ileri doğrulandı.
- [ ] Native izin ve paylaşım metinleri TestFlight'ta doğrulandı.
- [ ] Tarih/saat sunumu değişirken plan zamanları korunuyor.
- [ ] Türkçe ve İngilizce için görsel QA ve bağlamsal redaksiyon yapıldı.
- [ ] Otomatik kontroller ve gerçek cihaz akışları başarılı.

## Kaynaklar

- Expo localization: https://docs.expo.dev/guides/localization/
- Expo device locale API: https://docs.expo.dev/versions/latest/sdk/localization/
- React i18next: https://react.i18next.com/latest
- Çoğul kuralları: https://www.i18next.com/translation-function/plurals
- Anlamsal anahtar ve namespace: https://www.i18next.com/translation-function/essentials

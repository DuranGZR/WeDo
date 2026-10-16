# İngilizce ekran denetimi — 16 Ekim 2026

390 × 844 tarayıcı görünümünde uygulama rotaları açıldı ve görünen metinler okundu. Üye ekranlarında yalnızca bellek içi SQLite kullanan geçici yerel API ve sahte hesap/veriler kullanıldı. Üretime hesap, e-posta veya push gönderilmedi. Ekran listesi kaynak katalog taramasından ayrı olarak kontrol edildi.

| Ekran / akış | Kontrol edilen durum |
| --- | --- |
| Karşılama, giriş, kayıt | Başlıklar, form alanları, validasyon, Apple/Google düğmeleri, dil seçimi |
| E-posta doğrulama | Kod alanı, açıklama, tekrar gönderme; tekil/çoğul sayaç otomatik testte |
| İlk kullanım | Kullanım tipi, liste şablonları, alan oluşturma, paylaşım rehberi, üye daveti |
| Ana ekran | Sahte kullanıcı ve listelerle dolu görünüm, göreli tarihler |
| Listeler sekmesi | Liste kartları ve adetler |
| Liste ayrıntısı | Dolu ve boş liste, tamamlananlar filtresi, sonuçsuz arama |
| Liste oluşturma/düzenleme/arama | Form başlıkları, yer tutucular, kaydetme/silme metinleri |
| Öğe ekleme | Liste seçme penceresi, URL ve başlık alanları |
| Öğe ayrıntısı | Tamamlanmış ve tamamlanmamış öğe eylemleri |
| Geçmiş | Aktiviteli ve boş durum |
| Anılar | Dolu/boş görünüm, puan, not/puan/fotoğraf formu |
| Paylaşım | İçeriksiz durum ve URL ile alan/liste seçme formu |
| Alanlar | Yönetim, düzenleme, oluşturma, dolu/boş alan |
| Davetler | Geçerli davet önizlemesi, mevcut üye, geçersiz ve kabul edilmiş ekranlar |
| Bildirimler | Bir bildirim, okunma eylemleri, eski tipin İngilizce sunumu |
| Profil ve ayarlar | Profil, güvenlik, şifre, gizlilik, hesap silme açıklaması |
| Yardım | Dört yanıt açılarak okundu, destek adresi, yasal bağlantılar |
| Gizlilik / koşullar | İngilizce tam metin |
| Bulunamayan sayfa | Başlık, açıklama, ana sayfa bağlantısı |
| Dil geçişi | Ayarlarda TR → EN; kullanıcı adı korunuyor, etiketler hemen yenileniyor |

`(onboarding)/create-space`, alan oluşturma ekranını yeniden kullanır. Layout, yönlendirme ve native intent dosyaları bağımsız metin ekranı değildir.

## Düzeltilen bulgular

- Google düğmesinin web önizlemesinde gizlenmesi kaldırıldı. Web tıklaması iPhone uygulamasının gerektiğini açıklar; tarayıcıda native OAuth başlatılmaz.
- Hesap silme açıklamasındaki `WeDo'ya` parçası tek bir çevrilebilir cümleye dönüştürüldü.
- Üye sayısı ve doğrulama sayacı İngilizce tekil/çoğul kurallarıyla gösteriliyor.
- Paylaşım rehberi ve davet kabulündeki bozuk Unicode simgeleri düzeltildi.
- Bağlantı hataları `Failed to fetch` yerine seçili dilde gösteriliyor; açıkça iptal edilen istek korunuyor.
- Geçerli davet rotasının her zaman geçersiz ekranı göstermesi düzeltildi. API önizlemesi, katılım, mevcut üyelik ve yeniden deneme eklendi; dört otomatik senaryo ile doğrulandı.
- Doğrudan JSX string ifadeleri çeviri denetimine alındı.
- Gizlilik iletişim cümlesi ve birkaç İngilizce eylem açıklaması düzeltildi.

## Son doğrulama ve sınırlar

- Frontend: 25 test geçti; TypeScript başarılı; katalog kontrolü 608 anahtar / 736 doğrudan çağrı. ESLint sıfır hata, 38 uyarı (animasyon/ref kullanımları ve test mock importları dahil).
- Backend: 116 test geçti.
- Geçici QA menüsü yalnızca atılan yerel test derlemesinde kullanıldı; uygulama kaynaklarından kaldırıldı. Ham ekran metinleri ve yerel ekran görüntüleri git tarafından yok sayılan `.local-logs/en-page-audit` altında bulunur. Geçiş anında alınmış bazı görüntüler görsel kabul kanıtı değildir; metin denetimi DOM kayıtlarına dayanır.
- iPhone sistem pencereleri, gerçek Apple/Google OAuth, gerçek push teslimatı, fotoğraf izinleri ve native paylaşım uzantısı bu tarayıcı denetimiyle doğrulanmış sayılmaz. Bunlar TestFlight kabulünde kalır.
- Bu denetim sırasında commit/push veya mağaza yayını yapılmadı; sonraki yayın durumu Git geçmişinden ayrıca kontrol edilmelidir.

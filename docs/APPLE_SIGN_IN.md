# Apple giriş, hesap bildirimleri ve yetki iptali

## Durum

Native iOS App ID: `com.durangezer.wedo`. Apple tarafında kayıt ve Sign in with Apple capability kullanıcı tarafından oluşturuldu. Sunucu akışları yerelde test edildi. Gerçek Apple anahtarı yerel backend ayarına eklendi; Railway değişkenleri kullanıcı tarafından girildi. Canlı deploy, bildirim adresi kaydı ve TestFlight kabulü henüz doğrulanmadı. Native akış için web Services ID oluşturulmaz.

Yerel doğrulama: 136 backend testi, 27 frontend testi, TypeScript ve TR/EN katalog kontrolü başarılı. `0016` geçişi SQLite üzerinde ileri/geri/ileri, PostgreSQL için çevrimdışı SQL üretimiyle doğrulandı. Gerçek Apple endpoint'lerine test token'ı veya sahte bildirim gönderilmedi.

## Güvenli kurulum sırası

1. Apple Developer → Certificates, Identifiers & Profiles → Keys → `+`.
2. Anahtar adı: `WeDo Sign in with Apple`. **Sign in with Apple** etkinleştirilir; Configure ekranında WeDo (`com.durangezer.wedo`) primary App ID seçilir.
3. Register ve Download ile `.p8` indirilir. Key ID ve Team ID not edilir. `.p8` içeriğini sohbet, Git veya frontend/EAS değişkenlerine koymayın. `.gitignore` bu uzantıyı dışlar.
4. Yerel backend ayarını, anahtarı terminale yazdırmadan oluşturun:

   ```powershell
   # backend klasöründe; örnek dosya yolunu ve kimlikleri kendi değerlerinizle değiştirin
   .\.venv\Scripts\python.exe scripts/configure_apple.py --key-file C:\Users\duran\Downloads\AuthKey_KEYID.p8 --key-id YOURKEYID1 --team-id YOURTEAM01
   ```

   Script mevcut şifreleme anahtarını korur; yoksa yeni bir Fernet anahtarı üretir. Yalnızca yerel `.env` dosyasını günceller.

5. Railway **API servisine** aşağıdaki backend değişkenleri girilir. Ayrı worker kullanılıyorsa aynı değerler ona da verilir:

   | Değişken | Değer |
   | --- | --- |
   | `APPLE_BUNDLE_ID` | `com.durangezer.wedo` |
   | `APPLE_TEAM_ID` | Apple Developer Team ID |
   | `APPLE_KEY_ID` | Sign in with Apple Key ID |
   | `APPLE_PRIVATE_KEY` | Tam `.p8` içeriği; gerçek satır sonları veya literal `\n` kabul edilir |
   | `APPLE_TOKEN_ENCRYPTION_KEY` | Yerel `.env` içinde üretilen Fernet anahtarı |

   Son iki değer sunucu sırrıdır. `EXPO_PUBLIC_` ile başlayan değişkenler olarak eklenmez. Bunlar Google Client ID değildir. `APPLE_TOKEN_ENCRYPTION_KEY` aktif token veya bekleyen iş varken değiştirilmemelidir; değiştirmek önce mevcut veriyi yeniden şifrelemeyi gerektirir.

6. Backend deploy ve `alembic upgrade head` (`0016_apple_lifecycle`) tamamlanır. API, anahtarlar yapılandırılmışsa bekleyen Apple iptallerini başlangıçta ve her 60 saniyede tarar. Ayrı worker zorunlu değildir; varsa aynı güvenli işlem kilitleriyle çalışabilir.
7. Başarılı deploy sonrasında Apple Developer → Identifiers → WeDo → Sign in with Apple → Edit bölümünde **Server-to-Server Notification Endpoint**:

   `https://wedo-production-3ad2.up.railway.app/api/v1/auth/apple/notifications`

   İşleyen endpoint deploy edilmeden bu URL kaydedilmemeli. Kullanılan gerçek API domain'i farklıysa onun HTTPS URL'si kullanılmalı.

8. Yeni iOS build alınır ve TestFlight'a yüklenir. Bu işlem mağazada herkese yayınlama değildir. Eski build tek kullanımlık Apple authorization code'u göndermediği için production Apple girişi yeni build gerektirir.

## Sunucu davranışı

- Tüm ortamlarda Apple RS256 imzası, issuer, audience, iat ve kimlik token'ında exp doğrulanır. Geliştirme ortamındaki imzasız/HS256 token kabulü kaldırılmıştır; testler kendi RSA anahtarlarını ve sahte Apple HTTP yanıtlarını kullanır.
- Native client `identity_token`, `apple_user_id`, `authorization_code` gönderir. Sunucu `/auth/token` ile kodu değiştirir, dönen kimliğin aynı kullanıcı olduğunu doğrular. Developer client secret, Apple `.p8` anahtarıyla kısa ömürlü ES256 JWT olarak üretilir.
- Apple refresh token'ı ayrı Fernet anahtarıyla şifrelenir; API yanıtlarına ve loglara çıkmaz. Kullanıcıdan gelen doğrulanmamış e-posta üzerinden başka hesap eşleştirilmez.
- Apple bildirimlerinde imza, uygulama kimliği, event biçimi/zamanı ve jti kontrol edilir. Bildirimlerin `exp` alanı zorunlu değildir; Apple'ın belgelenmiş örneklerinde bulunmaz. Tekrarlanan jti yalnızca bir kez işlenir. Bilinmeyen kullanıcı/tür güvenli biçimde onaylanır.
- `email-disabled`/`email-enabled` sıralı olarak saklanır; eski e-posta olayları yeni durumu geri almaz. `/users/me` durumu döndürür ve Ayarlar e-posta yönlendirmesinin kapalı olduğunu gösterebilir.
- `consent-revoked` WeDo oturumlarını kapatır, push cihazlarını temizler ve eski kimlik token'ıyla girişe izin vermez. Daha yeni bir Apple girişinden önce oluşmuş gecikmiş iptal olayı yeni oturumu kapatmaz.
- `account-deleted` Apple kimliğini kaldırır. Apple dışında giriş yöntemi olmayan hesabı devre dışı bırakıp anonimleştirir; başka sağlayıcısı/şifresi olan hesabın diğer giriş yöntemi korunur. Mevcut paylaşılmış içerik saklama davranışı değiştirilmemiştir.
- Kullanıcı hesabını silince yerel anonimleştirme ve şifreli iptal işi aynı transaction'da kaydedilir. Yanıt sonrası Apple `/auth/revoke` hemen denenir. Hata olursa iş kaybolmaz; 60 saniyeden başlayıp en fazla bir saate çıkan aralıklarla yeniden denenir. Başarılı iş ve sakladığı token silinir.
- `DELETE /api/v1/users/me` artık HTTP 200 ve `{ "apple_revocation": "not_required" | "pending" | "manual" }` döndürür. Önceki frontend sürümü gövdeyi kullanmadığından işlem yapmaya devam eder. `pending`, Apple'ın başarıyla iptal ettiğinin kanıtı değildir.
- Önceden Apple token'ı saklanmamış hesaplarda silme engellenmez. `manual` sonucu, kullanıcıya Apple Hesabı → Apple ile Giriş → WeDo bağlantısını kaldırma talimatı verir.

## Yayın öncesi kabul

- Gerçek Apple hesabıyla ilk/tekrar giriş, gizli e-posta ve iptal.
- Apple Account ayarlarından e-posta yönlendirmesini kapatma/açma; profili yeniden çekince durumun değişmesi.
- WeDo için Apple onayını kaldırma: webhook kabulü ve mevcut WeDo access/refresh token'larının reddi; yeni Apple girişi.
- Hesap silme: WeDo oturumlarının kapanması, Apple ayarlarında bağlantının kaldırılması, `apple_revocations` kuyruğunun boşalması.
- Apple tarafına ulaşılamayan denemede kullanıcı silmesinin tamamlanması; bekleyen işin bir sonraki döngüde temizlenmesi.
- Sırların `.env`, sunucu secret store ve şifreli DB alanları dışında görünmemesi; kuyrukta hata denemeleri birikirse ayar/anahtar/erişim sorununun incelenmesi.

Kaynaklar:

- [Apple hesap değişiklikleri](https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts)
- [Apple TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)
- [Sign in with Apple anahtarı](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key/)

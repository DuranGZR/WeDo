# Google ile giriş (iOS)

Google Cloud'da Web application ve iOS OAuth istemcileri kullanılmalıdır.
iOS istemcisinin Bundle ID değeri `com.wedo.app` olmalıdır.
Firebase, client secret ve tarayıcı yönlendirme adresleri bu akışta kullanılmaz.

## Ortam değişkenleri

Gerçek değerleri Git'e eklemeyin. `.env.example` dosyaları yalnızca boş alanlar içerir.

| Ortam | Değişken | Değer kaynağı |
| --- | --- | --- |
| `frontend/.env` ve EAS production | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Cloud Web Client ID |
| `frontend/.env` ve EAS production | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google Cloud iOS Client ID |
| `backend/.env` ve Railway API servisi | `GOOGLE_WEB_CLIENT_ID` | Aynı Web Client ID |

Railway Variables bölümünde `GOOGLE_WEB_CLIENT_ID` tanımlanmalıdır.
Commit/push yerel `.env` dosyalarını Railway'e taşımaz.
Backend'de ayar yoksa Google girişi güvenli biçimde reddedilir.

EAS değişkenlerini production ortamında Sensitive görünürlüğüyle tanımlayın.
Development build kullanılırsa aynı değişkenleri development ortamına da ekleyin.
Client ID'ler kaynak kodda tutulmaz; mobil OAuth gereği uygulama paketine girer,
bu nedenle client secret gibi gizli anahtar olarak değerlendirilmez.

## Build ve cihaz doğrulaması

1. Railway ortam değişkenini ayarlayın ve güncel backend'i deploy edin.
2. EAS production ortamında iki frontend değişkenini ayarlayın.
3. Apple Developer'da `com.wedo.app` App ID ve Sign in with Apple capability'sini
   etkinleştirin; EAS iOS dağıtım sertifikası ve provisioning profile'ını hazırlayın.
   Paylaşım uzantısı `com.wedo.app.share-extension` için de ayrı provisioning
   profile gerekir. İlk kurulumu `eas credentials --platform ios` ile etkileşimli
   olarak, kendi Apple Developer hesabınızla tamamlayın.
4. `frontend` klasöründe `eas build --platform ios --profile production` çalıştırın.
5. Oluşan build'i `eas submit --platform ios --profile production` ile yükleyin.
6. TestFlight'ta Google ile ilk giriş, tekrar giriş, iptal, oturum kapatma,
   yeniden giriş ve davet bağlantısıyla giriş sonrası yönlendirmeyi test edin.
7. Apple girişini de gerçek cihazda doğrulayın.

Google girişinin varsayılan kapsamı temel profil ve e-postadır. Ek Google API
izinleri istenmez. Expo Go'da bu native SDK çalışmaz; yeni bir iOS build gerekir.
Android ve web Google girişi bu değişiklikte yapılandırılmamıştır ve buton gizlidir.

## Backend doğrulaması

API yalnızca `id_token` ve isteğe bağlı `device_id` alır. Kimlik, e-posta ve ad,
Google'ın imzası doğrulanmış token'ından okunur. RS256 imzası, issuer, Web Client ID
audience değeri, süre ve doğrulanmış e-posta kontrol edilir. Google sertifika
servisine erişilemezse giriş reddedilir. Mevcut hesaplara üçüncü taraf e-posta
adresleriyle otomatik bağlantı kurulmaz; Gmail ve Google Workspace için Google'ın
doğruladığı e-posta kullanılır.

Resmi kaynaklar:
- https://react-native-google-signin.github.io/docs/setting-up/expo
- https://react-native-google-signin.github.io/docs/original
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

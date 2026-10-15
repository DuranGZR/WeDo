# E-posta doğrulama

E-posta ve şifreyle kayıtlar, 6 haneli kod onaylanmadan oturum açamaz.
Resend gönderimi, destek formuyla aynı `RESEND_API_KEY` ve
`SUPPORT_SENDER_EMAIL` değişkenlerini kullanır. Ek bir anahtar gerekmez.

## Akış

- `POST /api/v1/auth/sign-up`: Hesabı ve doğrulama talebini oluşturur, kodu gönderir;
  `verification_id`, `email`, `expires_in_seconds`, `resend_after_seconds` döner.
- `POST /api/v1/auth/verify-email`: `verification_id` ve 6 haneli `code` alır.
  Başarıda 204 döner. Kod oturum açmaz; kullanıcı daha sonra şifresiyle giriş yapar.
- `POST /api/v1/auth/resend-verification`: `verification_id` alır. 60 saniyelik
  bekleme dolmadıysa tekrar e-posta göndermez ve kalan süreyi döner.
- Doğrulanmamış eski hesapların doğru şifreyle girişinde HTTP 403 ve
  `EMAIL_VERIFICATION_REQUIRED` döner; `error.details` doğrulama bilgilerini içerir.
  Yanlış şifreyle kod veya hesap bilgisi açıklanmaz.
- Kod 10 dakika geçerlidir, tek kullanımlıktır ve 5 yanlış denemede kilitlenir.
  Yeniden gönderim eski kodu iptal eder. Kod DB'de JWT anahtarıyla HMAC özeti
  olarak saklanır, API yanıtlarına veya loglara eklenmez.
- Kullanıcının satırı kilitlenerek aynı hesaptaki doğrulama/yeniden gönderim
  işlemleri PostgreSQL'de sıraya alınır. IP istek sınırı ayrıca uygulanır.
- Google/Apple girişlerinde ek kod istenmez. Eski doğrulanmamış oturumlar da
  access/refresh kontrolünü geçemez; kullanıcı yeni uygulamadan giriş yapmalıdır.

## Deploy

Migration: `0014_email_verification`.
`backend/Dockerfile`, sunucu başlamadan `alembic upgrade head` çalıştırır.
Railway'de özel Start Command Docker komutunu geçersiz kılıyorsa Pre-deploy
Command olarak `uv run --no-dev alembic upgrade head` tanımlayın.

Frontend değiştiği için yeni uygulama build'i gerekir. Eski uygulama sürümleri
doğrulama ekranını içermez. Var olan hesaplar otomatik doğrulanmış sayılmaz.

## Canlı doğrulama

1. Railway deploy'unun ve migration'ın başarılı olduğunu kontrol edin.
2. Resend anahtarının doğrulanmış gönderici alanında Sending access izni olmalı.
3. Kendi test adresinizle kayıt olun; gelen kodu uygulamaya girin.
4. Doğrulama sonrası şifreyle giriş, yanlış kod, yeniden gönderim ve spam
   klasörünü kontrol edin. Davetle kayıtta davet yönlendirmesini de deneyin.

Otomatik testler e-posta sağlayıcısını taklit eder; gerçek posta kutusuna teslim
canlı hesap ve ortam ayarlarıyla ayrıca doğrulanmalıdır.

# Destek ve web hesap silme talepleri

Destek adresi: `contact@durangezer.com` (Google Workspace).

## Gönderim kurulumu

Railway Hobby/Free SMTP bağlantılarına izin vermediği için backend Resend'in
HTTPS API'sini kullanır. Google Workspace posta kutusu alıcıdır; Google hesap
şifresi veya uygulama şifresi gerekmez.

1. Resend'de hesap oluşturun ve Domains bölümünden gönderici alan adını ekleyin.
2. Resend'in verdiği DNS kayıtlarını alan adınızda tanımlayıp doğrulamayı tamamlayın.
   Gönderim doğrulaması için mevcut Google Workspace gelen posta MX kayıtlarını
   değiştirmeyin. Gerekirse ayrı bir gönderim alt alan adı kullanın.
3. İlgili gönderici alanına izinli bir Sending access API anahtarı oluşturun.
4. Railway API servisinin Variables bölümüne şu değerleri ekleyin:

```dotenv
RESEND_API_KEY=
SUPPORT_SENDER_EMAIL=contact@durangezer.com
```

`RESEND_API_KEY` değerine gerçek anahtarı yalnızca Railway'de girin; Git'e veya
sohbete eklemeyin. `SUPPORT_SENDER_EMAIL`, Resend'de doğruladığınız alan adına ait
olmalıdır. Alt alan adı doğrularsanız buna uygun bir gönderici adresi kullanın.
Alıcı her durumda `contact@durangezer.com` olarak sabittir.

5. Güncel backend'i deploy edip `/legal/delete-account#delete-account` formundan
   kendi adresinizle bir test talebi gönderin; Workspace gelen kutusunu ve spam
   klasörünü kontrol edin. Başarılı API yanıtı gönderim servisinin kabulünü gösterir;
   alıcı kutusuna teslimi ayrıca doğrulayın.

## Davranış

- Talep `POST /legal/deletion-requests` üzerinden destek posta kutusuna iletilir.
- Gönderen, alıcı ve konu backend'de belirlenir; kullanıcının adresi Reply-To'dur.
- Form hesap varlığını açıklamaz, hesabı otomatik silmez ve otomatik doğrulama
  e-postası göndermez. İşlem öncesinde hesap sahipliğini destek ekibi doğrular.
- Anahtar eksikse veya gönderim servisi hata verirse HTTP 503 döner; başarı
  gösterilmez. Hata halinde form alanları korunur ve doğrudan destek adresi sunulur.
- İstekler kimlik doğrulama uçlarıyla aynı dakika başına IP sınırını kullanır.
- Statik `docs/legal/index.html` sayfası kullanıcıyı backend'deki canlı forma
  yönlendirir; ayrı alan adında CORS ayarı gerektiren bir form çalıştırmaz.

Kaynaklar:
- https://docs.railway.com/networking/outbound-networking
- https://resend.com/docs/api-reference/emails/send-email

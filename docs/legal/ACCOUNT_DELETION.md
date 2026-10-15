# WeDo Hesap ve Veri Silme Yönergesi (Account & Data Deletion)

Google Play Store ve Apple App Store gereksinimleri uyarınca, kullanıcılar hem uygulama içerisinden hem de harici bir web sayfası üzerinden hesap ve verilerinin silinmesini talep edebilmelidir.

---

## 1. Uygulama İçinden Hesap Silme

Uygulama açıkken:
1. Alt menüden veya profil simgesinden **Ayarlar** sekmesine gidin.
2. **Güvenlik** seçeneğini seçin.
3. En altta yer alan **Hesabı Sil** butonuna tıklayın.
4. Güvenlik amacıyla mevcut şifrenizi girin ve **"Hesabı kalıcı olarak sil"** onayını verin.

Bu işlem yapıldığında:
- E-posta adresiniz ve adınız sistemden anonimleştirilir (`deleted_user@deleted.wedo.app`).
- Tüm aktif oturumlarınız derhal sonlandırılır.
- Cihaz push bildirim belirteçleriniz (token) veritabanından kalıcı olarak silinir.
- Bir daha bu hesaba erişim sağlanamaz.

---

## 2. Web Üzerinden Hesap ve Veri Silme Talebi

Uygulama cihazınızda yüklü değilse veya erişiminizi kaybettiyseniz:
1. Web tarayıcınızdan **`https://wedo-production-3ad2.up.railway.app/legal/delete-account`** sayfasına gidin.
2. Kayıtlı e-posta adresinizi girerek silme talebinde bulunun veya doğrudan **`contact@durangezer.com`** adresine *"Hesap Silme Talebi"* başlıklı bir e-posta gönderin.
3. Form talebi destek ekibine e-posta ile iletir. Hesabınızı otomatik silmez ve otomatik doğrulama e-postası göndermez. Destek ekibi hesap sahipliğini doğruladıktan sonra talebi değerlendirir. Gönderim başarısızsa form hata gösterir ve bilgileri tekrar denemeniz için korur.

---

## 3. Silinen Veri Kategorileri

- **Kişisel Kimlik Bilgileri:** Ad, soyad/görünen ad, e-posta adresi ve şifre özeti kalıcı olarak anonimleştirilir/silinir.
- **Cihaz Tanımlayıcıları:** Push bildirim token'ları silinir.
- **Ortak Alan İçerikleri:** Başka üyelerle paylaşılan ortak alanlarda yarım kalan kararların bozulmaması için içerikler anonim ("Silinmiş Kullanıcı") olarak listelenir, veya alanın tek üyesiyseniz tüm alan tamamen kaldırılır.

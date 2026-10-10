# WeDo App Store & Google Play Store Gönderim Kılavuzu (Store Submission Guide)

Bu kılavuz, WeDo uygulamasının Apple App Store ve Google Play Console mağazalarına ilk seferde başarıyla yüklenmesi ve onaylanması için izlenecek adımları içerir.

---

## 1. Apple Developer Portal & App Store Connect Adımları

### A. Apple Developer Portal Yapılandırması (`developer.apple.com`)
1. **Identifiers (App ID):**
   - Identifier: `com.wedo.app`
   - Capabilities:
     - **Sign in with Apple** (Zorunlu - Aktifleştirin)
     - **Push Notifications** (İşaretleyin)
     - **App Groups** (İşaretleyin)
2. **App Groups Oluşturma:**
   - App Groups bölümüne gidin ve `group.com.wedo.app` grubunu oluşturun.
   - `com.wedo.app` ana App ID'sini bu gruba bağlayın.
3. **Keys (APNs Push Bildirim Anahtarı):**
   - *Keys* bölümünden yeni bir anahtar oluşturun: `Apple Push Notifications service (APNs)`.
   - İndirilen `.p8` dosyasını, Key ID ve Team ID'yi güvenli bir yere kaydedin (EAS credentials veya backend için kullanılır).

### B. App Store Connect Bilgileri (`appstoreconnect.apple.com`)
- **Uygulama Adı:** WeDo
- **Birincil Dil:** Türkçe
- **Bundle ID:** `com.wedo.app`
- **SKU:** `wedo-mobile`
- **Gizlilik Politikası URL'si (Privacy Policy URL):** `https://wedo-production-3ad2.up.railway.app/legal/privacy` (veya `https://wedo.app/privacy`)
- **Destek URL'si (Support URL):** `https://wedo-production-3ad2.up.railway.app/legal/terms` (veya `https://wedo.app`)
- **Pazarlama URL'si (Marketing URL):** İsteğe bağlı
- **Kategori:** Verimlilik (Productivity) / Yaşam Tarzı (Lifestyle)
- **Yaş Derecelendirmesi (Age Rating):** 12+ veya 4+ (Tıbbi/şiddet/kumar yok seçilecek).
- **Giriş Bilgileri (İnceleme Ekibi İçin Demo Hesap):**
  - İncelemecilerin uygulamayı test edebilmesi için demo hesap açın:
    - E-posta: `apple-reviewer@wedo.app`
    - Şifre: `TestReviewer2026!`
    - Not: Ortak alan özelliklerini görebilmeleri için bu hesaba önceden 1 adet örnek liste ve içerik tanımlayın.

---

## 2. Google Play Console Adımları (`play.google.com/console`)

### A. Veri Güvenliği (Data Safety) Formu Cevapları
Google Play formunda sorulan sorulara şu yanıtlar verilmelidir:
- **Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?** -> **Evet**
- **Toplanan tüm kullanıcı verileri aktarım sırasında şifreleniyor mu?** -> **Evet (HTTPS/TLS)**
- **Kullanıcıların verilerinin silinmesini talep etmesi için bir yöntem sağlıyor musunuz?** -> **Evet**
- **Silme Talebi URL'si:** `https://<siteniz>/docs/legal/index.html#delete-account`
- **Toplanan Veri Türleri:**
  - *Kişisel Bilgiler:*
    - Ad (Uygulama işlevselliği, hesap yönetimi)
    - E-posta adresi (Hesap yönetimi, kimlik doğrulama)
  - *Fotoğraflar ve Videolar:*
    - Fotoğraflar (İsteğe bağlı, anılara fotoğraf eklemek için kullanıcı tarafından yüklenir)
  - *Cihaz veya Diğer Tanımlayıcılar:*
    - Cihaz belirteçleri / Push Token (Bildirim gönderme)

### B. Uygulama İçeriği & İzinler
- **Hedef Kitle:** 13 yaş ve üzeri.
- **Gizlilik Politikası URL:** `https://<siteniz>/docs/legal/index.html#privacy`

---

## 3. Derleme & Canlıya Alma Komutları (EAS Build)

### A. Expo Hesabına Giriş & EAS CLI
```bash
npm install -g eas-cli
eas login
```

### B. Önizleme / Test Derlemesi (Preview)
Doğrudan fiziksel cihazlarda test etmek için APK (Android) veya dahili iOS derlemesi:
```bash
cd frontend
eas build --profile preview --platform all
```

### C. Canlı Mağaza Derlemesi (Production)
App Store (IPA) ve Google Play (AAB - Android App Bundle) üretmek için:
```bash
cd frontend
eas build --profile production --platform all
```

### D. Otomatik Mağazaya Gönderme (Submit)
```bash
eas submit --platform ios
eas submit --platform android
```

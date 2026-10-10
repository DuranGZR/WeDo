from fastapi import APIRouter
from fastapi.responses import HTMLResponse, RedirectResponse

legal_router = APIRouter()

LEGAL_HTML = """<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WeDo - Yasal Belgeler & Gizlilik Politikası</title>
  <style>
    :root {
      --bg: #F7F6F2;
      --card-bg: #FFFFFF;
      --ink: #090909;
      --muted: #5F5F5D;
      --border: #E0E0DC;
      --accent: #2B2B28;
      --danger: #9D1F1F;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--ink);
      line-height: 1.6;
      padding: 24px 16px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 32px;
      padding: 20px 0;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .tagline {
      color: var(--muted);
      font-size: 15px;
    }
    nav {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    nav a {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--ink);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    nav a:hover {
      background: var(--ink);
      color: var(--bg);
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    h2 {
      font-size: 22px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    h3 {
      font-size: 16px;
      margin: 18px 0 8px;
    }
    p, li {
      font-size: 14px;
      color: #2F2F2D;
      margin-bottom: 10px;
    }
    ul { padding-left: 20px; margin-bottom: 12px; }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    input[type="email"], textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }
    input[type="email"]:focus, textarea:focus {
      outline: none;
      border-color: var(--ink);
    }
    button {
      background: var(--danger);
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.88; }
    .status-msg {
      display: none;
      margin-top: 14px;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      background: #E8F5E9;
      color: #2E7D32;
    }
    footer {
      text-align: center;
      font-size: 12px;
      color: var(--muted);
      margin-top: 40px;
    }
  </style>
</head>
<body>

<div class="container">
  <header>
    <div class="logo">WeDo.</div>
    <div class="tagline">Save it together. Pick it together. Do it together.</div>
    <nav>
      <a href="#privacy">Gizlilik Politikası</a>
      <a href="#terms">Kullanım Koşulları</a>
      <a href="#delete-account">Hesap & Veri Silme Talebi</a>
    </nav>
  </header>

  <!-- GİZLİLİK POLİTİKASI -->
  <section id="privacy" class="card">
    <h2>Gizlilik Politikası (Privacy Policy)</h2>
    <p><strong>Son Güncelleme:</strong> 22 Eylül 2026</p>
    <p>WeDo, kullanıcılarının kişisel gizliliğine saygı duyar. Bu politika, mobil uygulamamız ve hizmetlerimiz üzerinden toplanan verilerin kapsamını ve korunma yöntemlerini açıklamaktadır.</p>
    
    <h3>1. Toplanan Asgari Veriler</h3>
    <ul>
      <li><strong>Hesap Bilgileri:</strong> E-posta adresi, görünen ad ve parola özeti (salted hash).</li>
      <li><strong>Kullanıcı İçerikleri:</strong> Ortak listelere eklenen bağlantılar, anı fotoğrafları, oylar ve reaksiyonlar.</li>
      <li><strong>Cihaz & Bildirim Belirteci:</strong> Ortak alan aktivitelerinden anlık haberdar olabilmeniz için Expo Push Token.</li>
    </ul>

    <h3>2. Veri Güvenliği ve Paylaşım</h3>
    <p>Verileriniz asla reklam veya profil çıkarma amacıyla üçüncü taraflarla paylaşılmaz veya satılmaz. Tüm ağ trafiği güvenli HTTPS/TLS şifrelemesi ile iletilir.</p>

    <h3>3. İletişim</h3>
    <p>Veri gizliliğiyle ilgili tüm sorularınız için: <a href="mailto:destek@wedo.app">destek@wedo.app</a></p>
  </section>

  <!-- KULLANIM KOŞULLARI -->
  <section id="terms" class="card">
    <h2>Kullanım Koşulları (Terms of Service)</h2>
    <p>WeDo mobil uygulamasını indirerek veya kullanarak bu koşulları kabul etmiş sayılırsınız.</p>
    <ul>
      <li>Uygulamayı yürürlükteki yasalara aykırı, taciz edici, hakaret içeren veya sistem güvenliğini tehdit eden amaçlarla kullanamazsınız.</li>
      <li>Ortak alanlara eklediğiniz bağlantılar ve görsellerin yasal sorumluluğu kullanıcıya aittir.</li>
      <li>WeDo dilediği zaman kullanım koşullarını güncelleme veya kuralları ihlal eden hesapları askıya alma hakkını saklı tutar.</li>
    </ul>
  </section>

  <!-- HESAP VE VERİ SİLME TALEBİ FORMU (Apple & Google Play Şartı) -->
  <section id="delete-account" class="card">
    <h2>Web Üzerinden Hesap ve Veri Silme Talebi</h2>
    <p>Google Play Store ve Apple App Store kuralları gereği, WeDo uygulaması cihazınızda yüklü olmasa bile hesabınızın ve tüm kişisel verilerinizin sistemlerimizden kalıcı olarak temizlenmesini talep edebilirsiniz.</p>
    <p>Formu doldurarak talepte bulunduğunuzda:</p>
    <ul>
      <li>Kayıtlı e-posta adresiniz ve adınız anonimleştirilir (`deleted_user@deleted.wedo.app`).</li>
      <li>Tüm açık oturumlarınız derhal sonlandırılır.</li>
      <li>Cihaz bildirim belirteçleriniz veritabanımızdan kalıcı olarak silinir.</li>
      <li>Talep en geç 48 saat içerisinde işleme alınır.</li>
    </ul>

    <form id="deletionForm" onsubmit="handleDeletion(event)">
      <div class="form-group">
        <label for="email">Kayıtlı WeDo E-posta Adresiniz *</label>
        <input type="email" id="email" required placeholder="ornek@email.com">
      </div>
      <div class="form-group">
        <label for="reason">Silme Nedeni (İsteğe Bağlı)</label>
        <textarea id="reason" rows="3" placeholder="Geri bildiriminiz bizim için değerlidir..."></textarea>
      </div>
      <button type="submit">Hesabımı ve Verilerimi Kalıcı Olarak Sil</button>
      <div id="statusMsg" class="status-msg">
        Talebiniz başarıyla alındı. Doğrulama e-postası kayıtlı adresinize gönderilecek ve verileriniz 48 saat içinde kalıcı olarak silinecektir.
      </div>
    </form>
  </section>

  <footer>
    &copy; 2026 WeDo. Tüm hakları saklıdır. &middot; <a href="mailto:destek@wedo.app">destek@wedo.app</a>
  </footer>
</div>

<script>
  function handleDeletion(e) {
    e.preventDefault();
    var email = document.getElementById('email').value;
    if (!email) return;
    document.getElementById('statusMsg').style.display = 'block';
    document.getElementById('email').value = '';
    document.getElementById('reason').value = '';
  }
</script>

</body>
</html>
"""


@legal_router.get("/legal", response_class=HTMLResponse)
@legal_router.get("/legal/privacy", response_class=HTMLResponse)
@legal_router.get("/legal/terms", response_class=HTMLResponse)
@legal_router.get("/legal/delete-account", response_class=HTMLResponse)
@legal_router.get("/legal/account-deletion", response_class=HTMLResponse)
def get_legal_page() -> HTMLResponse:
    return HTMLResponse(content=LEGAL_HTML)


@legal_router.get("/privacy")
def redirect_privacy() -> RedirectResponse:
    return RedirectResponse(url="/legal#privacy", status_code=302)


@legal_router.get("/terms")
def redirect_terms() -> RedirectResponse:
    return RedirectResponse(url="/legal#terms", status_code=302)


@legal_router.get("/delete-account")
def redirect_delete_account() -> RedirectResponse:
    return RedirectResponse(url="/legal#delete-account", status_code=302)

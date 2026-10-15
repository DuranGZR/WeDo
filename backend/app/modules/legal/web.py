from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from app.modules.legal.service import (
    DeletionDeliveryError,
    DeletionRequest,
    send_deletion_request,
)

legal_router = APIRouter()


@legal_router.post("/legal/deletion-requests", status_code=202)
def request_account_deletion(data: DeletionRequest) -> dict[str, str]:
    try:
        send_deletion_request(data)
    except DeletionDeliveryError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Talep gönderilemedi. Lütfen tekrar deneyin veya "
                "contact@durangezer.com adresine e-posta gönderin."
            ),
        ) from error
    return {
        "message": "Talebiniz destek ekibine iletildi. Hesap sahipliği "
        "doğrulandıktan sonra silme işlemi değerlendirilecektir."
    }

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
    button:disabled { opacity: 0.6; cursor: wait; }
    .status-msg.error { background: #FDECEC; color: #9D1F1F; }
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
    <p><strong>Son Güncelleme:</strong> 15 Ekim 2026</p>
    <p>WeDo, kullanıcılarının kişisel gizliliğine saygı duyar. Bu politika, mobil uygulamamız ve hizmetlerimiz üzerinden toplanan verilerin kapsamını ve korunma yöntemlerini açıklamaktadır.</p>
    
    <h3>1. Toplanan Asgari Veriler</h3>
    <ul>
      <li><strong>Hesap Bilgileri:</strong> E-posta adresi, görünen ad ve parola özeti (salted hash).</li>
      <li><strong>E-posta Doğrulaması:</strong> E-posta ile kayıtta Resend üzerinden süreli kod gönderilir. Kodun güvenli özeti, geçerlilik ve deneme bilgileri hesap güvenliği için sunucuda tutulur.</li>
      <li><strong>Google ile Giriş:</strong> Google tarafından sağlanan kullanıcı kimliği, doğrulanmış e-posta ve profil adı, hesap oluşturma ve oturum doğrulama için kullanılır. Google şifreniz alınmaz; Gmail, Drive veya Takvim erişimi istenmez.</li>
      <li><strong>Apple ile Giriş:</strong> Apple kullanıcı kimliği ve paylaşıldığı ölçüde ad/e-posta bilgisi hesap ve oturum yönetimi için kullanılır. E-postamı Gizle seçeneği desteklenir.</li>
      <li><strong>Destek ve Silme Talepleri:</strong> Formda verdiğiniz e-posta adresi ve isteğe bağlı açıklama, destek posta kutusuna iletilir ve talebinizi değerlendirmek ile hesap sahipliğini doğrulamak için kullanılır.</li>
      <li><strong>Kullanıcı İçerikleri:</strong> Ortak listelere eklenen bağlantılar, anı fotoğrafları, oylar ve reaksiyonlar.</li>
      <li><strong>Cihaz & Bildirim Belirteci:</strong> Ortak alan aktivitelerinden anlık haberdar olabilmeniz için Expo Push Token.</li>
    </ul>

    <h3>2. Veri Güvenliği ve Paylaşım</h3>
    <p>Verileriniz asla reklam veya profil çıkarma amacıyla üçüncü taraflarla paylaşılmaz veya satılmaz. Tüm ağ trafiği güvenli HTTPS/TLS şifrelemesi ile iletilir.</p>
    <p>Seçtiğiniz giriş yönteminde Google veya Apple kimlik doğrulama hizmetleri kullanılır. Web destek taleplerindeki e-posta ve açıklama, Resend gönderim hizmeti üzerinden Google Workspace destek posta kutusuna iletilir.</p>

    <h3>3. İletişim</h3>
    <p>Veri gizliliğiyle ilgili tüm sorularınız için: <a href="mailto:contact@durangezer.com">contact@durangezer.com</a></p>
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

  <!-- HESAP VE VERİ SİLME TALEBİ -->
  <section id="delete-account" class="card">
    <h2>Web Üzerinden Hesap ve Veri Silme Talebi</h2>
    <p>Uygulama cihazınızda yüklü olmasa bile bu formdan hesap silme talebi gönderebilirsiniz. Talep destek ekibine e-posta ile iletilir; form hesabınızı otomatik silmez.</p>
    <p>Hesap sahipliği doğrulanıp silme işlemi tamamlandığında:</p>
    <ul>
      <li>Kayıtlı e-posta adresiniz ve adınız anonimleştirilir.</li>
      <li>Tüm açık oturumlarınız derhal sonlandırılır.</li>
      <li>Cihaz bildirim belirteçleriniz veritabanımızdan kalıcı olarak silinir.</li>
      <li>Ortak alanlarda kalan içerikler hesabınızın anonimleştirilmesiyle ilişkilendirilir; bu form tüm ortak içerikleri otomatik kaldırmaz.</li>
    </ul>

    <form id="deletionForm" onsubmit="handleDeletion(event)">
      <div class="form-group">
        <label for="email">Kayıtlı WeDo E-posta Adresiniz *</label>
        <input type="email" id="email" name="email" required maxlength="254" autocomplete="email" placeholder="ornek@email.com">
      </div>
      <div class="form-group">
        <label for="reason">Silme Nedeni (İsteğe Bağlı)</label>
        <textarea id="reason" name="reason" rows="3" maxlength="2000" placeholder="İsteğe bağlı açıklama; şifrenizi paylaşmayın."></textarea>
      </div>
      <p>Apple ile E-postamı Gizle kullandıysanız uygulamadaki hesap e-postasını belirtin. Size ulaşabileceğimiz adresi açıklamaya ekleyebilirsiniz.</p>
      <button type="submit">Hesap Silme Talebi Gönder</button>
      <div id="statusMsg" class="status-msg" role="status" aria-live="polite"></div>
      <noscript>Talep göndermek için JavaScript'i etkinleştirin veya contact@durangezer.com adresine e-posta gönderin.</noscript>
    </form>
  </section>

  <footer>
    &copy; 2026 WeDo. Tüm hakları saklıdır. &middot; <a href="mailto:contact@durangezer.com">contact@durangezer.com</a>
  </footer>
</div>

<script>
  async function handleDeletion(e) {
    e.preventDefault();
    var form = e.currentTarget;
    if (!form.reportValidity()) return;
    var button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    var status = document.getElementById('statusMsg');
    button.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Talebiniz gönderiliyor…';
    status.style.display = 'block';
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);
    try {
      var response = await fetch('/legal/deletion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          reason: document.getElementById('reason').value.trim()
        })
      });
      if (response.status !== 202) throw new Error('delivery-failed');
      var result = await response.json();
      status.textContent = result.message;
      form.reset();
    } catch (error) {
      status.classList.add('error');
      status.textContent = 'Gönderim onaylanamadı. Lütfen tekrar deneyin veya contact@durangezer.com adresine e-posta gönderin. Hesabınız bu form üzerinden silinmedi.';
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
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

import html

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.api.dependencies import SessionDep
from app.core.config import settings
from app.modules.invitations.service import preview_invitation

web_router = APIRouter()


@web_router.get("/invite/{token}", response_class=HTMLResponse)
def invite_web_landing(token: str, session: SessionDep) -> HTMLResponse:
    deep_link = f"{settings.mobile_scheme}://invite/{token}"
    try:
        preview = preview_invitation(session, token)
        space_name = html.escape(preview.space_name)
        inviter_name = html.escape(preview.inviter_name)
        valid = True
    except Exception:
        space_name = "Ortak Alan"
        inviter_name = "Bir WeDo Kullanıcısı"
        valid = False

    if valid:
        body_content = f"""
        <div class="badge">Ortak Alan Daveti</div>
        <h1 class="title">{space_name}</h1>
        <p class="subtitle"><strong>{inviter_name}</strong> seni WeDo'da ortak bir alana davet etti. Birlikte kaydetmek, planlamak ve seçmek için hemen katıl.</p>
        <div class="actions">
            <a href="{deep_link}" class="btn btn-primary">WeDo Uygulamasında Aç</a>
            <a href="https://apps.apple.com/app/wedo/id" class="btn btn-secondary">App Store'dan İndir</a>
        </div>
        """
        auto_redirect = f"""
        <script>
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {{
                window.location.href = "{deep_link}";
            }}
        </script>
        """
    else:
        body_content = """
        <div class="badge badge-error">Geçersiz Davet</div>
        <h1 class="title">Davet Bulunamadı</h1>
        <p class="subtitle">Bu davet bağlantısının süresi dolmuş veya kullanım limitine ulaşılmış olabilir. Lütfen davet eden kişiden yeni bir bağlantı isteyin.</p>
        <div class="actions">
            <a href="https://apps.apple.com/app/wedo/id" class="btn btn-secondary">App Store'dan İndir</a>
        </div>
        """
        auto_redirect = ""

    html_content = f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeDo Daveti - {space_name}</title>
    <meta property="og:title" content="WeDo - {space_name} Alanına Davet Edildiniz" />
    <meta property="og:description" content="{inviter_name} seni WeDo'da birlikte kaydetmeye davet etti." />
    <meta property="og:type" content="website" />
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F7F6F2;
            color: #090909;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
        }}
        .card {{
            background: #FFFFFF;
            border: 1.5px solid #090909;
            border-radius: 20px;
            max-width: 440px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 10px 0 #090909;
        }}
        .brand {{
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 24px;
        }}
        .brand span {{
            color: #47734B;
        }}
        .badge {{
            display: inline-block;
            background: #E8E8E6;
            color: #090909;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 100px;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .badge-error {{
            background: #FEE2E2;
            color: #991B1B;
        }}
        .title {{
            font-size: 26px;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 12px;
        }}
        .subtitle {{
            font-size: 15px;
            line-height: 1.6;
            color: #5F5F5D;
            margin-bottom: 32px;
        }}
        .actions {{
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}
        .btn {{
            display: block;
            text-decoration: none;
            font-size: 15px;
            font-weight: 700;
            padding: 16px;
            border-radius: 12px;
            transition: transform 0.1s ease, opacity 0.1s ease;
        }}
        .btn:active {{
            transform: scale(0.98);
        }}
        .btn-primary {{
            background: #090909;
            color: #FFFFFF;
        }}
        .btn-secondary {{
            background: #F7F6F2;
            color: #090909;
            border: 1px solid #D1D1CF;
        }}
        .footer {{
            margin-top: 24px;
            font-size: 12px;
            color: #8D8D8B;
        }}
    </style>
    {auto_redirect}
</head>
<body>
    <div class="card">
        <div class="brand">WeDo<span>.</span></div>
        {body_content}
        <div class="footer">Birlikte kaydet, birlikte seç, birlikte yap.</div>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

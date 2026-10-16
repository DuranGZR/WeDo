import html
import json
from urllib.parse import quote

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.api.dependencies import SessionDep
from app.core.config import settings
from app.core.localization import current_language, message
from app.modules.invitations.service import preview_invitation

web_router = APIRouter()


@web_router.get("/invite/{token}", response_class=HTMLResponse)
def invite_web_landing(token: str, session: SessionDep) -> HTMLResponse:
    deep_link = f"{settings.mobile_scheme}://invite/{quote(token, safe='')}"
    download_button = (
        f'<a href="{html.escape(str(settings.app_store_url))}" '
        f'class="btn btn-secondary">{message("invite.download")}</a>'
        if settings.app_store_url else ""
    )
    try:
        preview = preview_invitation(session, token)
        space_name = html.escape(preview.space_name)
        inviter_name = html.escape(preview.inviter_name)
        valid = True
    except Exception:
        space_name = html.escape(message("invite.space"))
        inviter_name = html.escape(message("invite.someone"))
        valid = False

    if valid:
        body_content = f"""
        <div class="badge">{message("invite.badge")}</div>
        <h1 class="title">{space_name}</h1>
        <p class="subtitle">{html.escape(message("invite.description", name=preview.inviter_name))}</p>
        <div class="actions">
            <a href="{deep_link}" class="btn btn-primary">{message("invite.open")}</a>
            {download_button}
        </div>
        """
        auto_redirect = f"""
        <script>
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {{
                window.location.href = {json.dumps(deep_link)};
            }}
        </script>
        """
    else:
        body_content = f"""
        <div class="badge badge-error">{message("invite.invalid")}</div>
        <h1 class="title">{message("invite.notFound")}</h1>
        <p class="subtitle">{message("invite.expired")}</p>
        <div class="actions">
            {download_button}
        </div>
        """
        auto_redirect = ""

    html_content = f"""<!DOCTYPE html>
<html lang="{current_language()}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{message("invite.title", space=space_name)}</title>
    <meta property="og:title" content="{message("invite.metaTitle", space=space_name)}" />
    <meta property="og:description" content="{message("invite.metaDescription", name=inviter_name)}" />
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
        <nav aria-label="{message('web.language')}"><a href="?lang=tr" lang="tr">Türkçe</a> · <a href="?lang=en" lang="en">English</a></nav>
        <div class="brand">WeDo<span>.</span></div>
        {body_content}
        <div class="footer">{message("invite.footer")}</div>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

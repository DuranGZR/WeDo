import httpx

from app.core.config import settings


class EmailDeliveryError(Exception):
    """Email delivery could not be confirmed."""


def send_email(
    *, to: str, subject: str, text: str, reply_to: str | None = None
) -> None:
    if not settings.resend_api_key.get_secret_value():
        raise EmailDeliveryError("Email delivery is not configured")
    payload = {
        "from": str(settings.support_sender_email),
        "to": [to],
        "subject": subject,
        "text": text,
    }
    if reply_to:
        payload["reply_to"] = reply_to
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key.get_secret_value()}"
            },
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or not isinstance(result.get("id"), str):
            raise EmailDeliveryError("Email provider did not accept the request")
    except (httpx.HTTPError, ValueError) as error:
        raise EmailDeliveryError("Email delivery failed") from error

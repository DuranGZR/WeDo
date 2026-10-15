from pydantic import BaseModel, EmailStr, Field

from app.core.mail import EmailDeliveryError, send_email

SUPPORT_EMAIL = "contact@durangezer.com"


class DeletionRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    reason: str = Field(default="", max_length=2000)


DeletionDeliveryError = EmailDeliveryError


def send_deletion_request(data: DeletionRequest) -> None:
    text = (
        "Web formundan hesap silme talebi alındı.\n\n"
        f"Bildirilen hesap e-postası: {data.email}\n"
        f"Açıklama: {data.reason.strip() or 'Belirtilmedi'}\n\n"
        "Bu form hesap sahipliğini doğrulamaz. Herhangi bir silme işleminden "
        "önce başvuranın hesap sahibi olduğunu doğrulayın.\n"
        "Apple'ın E-postamı Gizle özelliği kullanıldıysa ilgili hesap "
        "eşleştirmesini ayrıca doğrulayın.\n"
    )
    send_email(
        to=SUPPORT_EMAIL,
        subject="WeDo hesap silme talebi",
        text=text,
        reply_to=str(data.email),
    )

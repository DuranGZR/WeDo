from pydantic import BaseModel, EmailStr, Field

from app.core.localization import message
from app.core.mail import EmailDeliveryError, send_email

SUPPORT_EMAIL = "contact@durangezer.com"


class DeletionRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    reason: str = Field(default="", max_length=2000)


DeletionDeliveryError = EmailDeliveryError


def send_deletion_request(data: DeletionRequest) -> None:
    text = message(
        "message.anAccountDeletionRequestWasReceivedFromTheWeb",
        value0=data.email,
        value1=data.reason.strip() or message("support.notProvided"),
    )
    send_email(
        to=SUPPORT_EMAIL,
        subject=message("support.deletionSubject"),
        text=text,
        reply_to=str(data.email),
    )

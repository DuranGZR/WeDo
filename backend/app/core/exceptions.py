class AppError(Exception):
    status_code = 500
    code = "INTERNAL_ERROR"
    default_message = "Beklenmeyen bir hata oluştu."

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    default_message = "Kayıt bulunamadı."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    default_message = "Bu işlem için yetkiniz bulunmuyor."


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    default_message = "İşlem mevcut veriyle çakışıyor."

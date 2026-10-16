from app.core.localization import message as localize


class AppError(Exception):
    status_code = 500
    code = "INTERNAL_ERROR"
    default_message_key = "message.somethingWentWrong"

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        self.message = message or localize(self.default_message_key)
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    default_message_key = "message.recordNotFound"


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    default_message_key = "message.youDonTHavePermissionToDoThis"


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    default_message_key = "message.thisConflictsWithExistingData"

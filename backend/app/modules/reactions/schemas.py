from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.reactions.enums import ReactionValue


class ReactionRequest(BaseModel):
    reaction: ReactionValue


class ReactionResponse(BaseModel):
    id: UUID
    item_id: UUID
    user_id: UUID
    reaction: ReactionValue
    created_at: datetime
    updated_at: datetime

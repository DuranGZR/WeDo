from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReportCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    target_type: Literal["item", "user", "app"]
    target_id: UUID | None = None
    space_id: UUID | None = None
    reason: Literal["harassment", "sexual", "violence", "spam", "copyright", "other"]
    details: str = Field(min_length=10, max_length=2000)

    @model_validator(mode="after")
    def validate_target(self):
        if (self.target_type == "app") != (self.target_id is None):
            raise ValueError("A target ID is required only for item and user reports")
        return self


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    created_at: datetime


class BlockResponse(BaseModel):
    user_id: UUID
    display_name: str
    created_at: datetime

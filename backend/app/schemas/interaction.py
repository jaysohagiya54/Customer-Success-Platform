import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.insight import InsightSource, Sentiment
from app.models.interaction import InteractionType


class InteractionBase(BaseModel):
    customer_id: uuid.UUID
    type: InteractionType = InteractionType.MEETING
    title: str = Field(min_length=2, max_length=200)
    notes: str = Field(min_length=10, max_length=20000)
    occurred_at: datetime

    @field_validator("title", "notes")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    type: InteractionType | None = None
    title: str | None = Field(default=None, min_length=2, max_length=200)
    notes: str | None = Field(default=None, min_length=10, max_length=20000)
    occurred_at: datetime | None = None


class InsightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    summary: str
    sentiment: Sentiment
    action_items: list[str]
    risks: list[str]
    source: InsightSource
    model: str | None
    error_message: str | None
    generated_at: datetime


class InteractionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str | None = None
    type: InteractionType
    title: str
    notes: str
    occurred_at: datetime
    created_by: uuid.UUID
    author_name: str | None = None
    insight: InsightOut | None = None
    created_at: datetime
    updated_at: datetime

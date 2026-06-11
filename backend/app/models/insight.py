import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class InsightSource(str, enum.Enum):
    AI = "ai"
    FALLBACK = "fallback"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    interaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("interactions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[Sentiment] = mapped_column(
        Enum(Sentiment, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    action_items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    risks: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    source: Mapped[InsightSource] = mapped_column(
        Enum(InsightSource, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    model: Mapped[str | None] = mapped_column(String(60))
    error_message: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    interaction = relationship("Interaction", back_populates="insight")

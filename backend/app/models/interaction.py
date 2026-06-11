import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InteractionType(str, enum.Enum):
    MEETING = "meeting"
    CALL = "call"
    EMAIL = "email"
    NOTE = "note"


class Interaction(Base):
    __tablename__ = "interactions"
    __table_args__ = (
        Index("ix_interactions_customer_occurred", "customer_id", "occurred_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[InteractionType] = mapped_column(
        Enum(InteractionType, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e]),
        default=InteractionType.MEETING,
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    customer = relationship("Customer", back_populates="interactions", lazy="joined")
    author = relationship("User", lazy="joined")
    insight = relationship(
        "AIInsight",
        back_populates="interaction",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )

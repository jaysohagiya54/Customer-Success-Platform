import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CustomerStatus(str, enum.Enum):
    PROSPECT = "prospect"
    ACTIVE = "active"
    AT_RISK = "at_risk"
    CHURNED = "churned"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[CustomerStatus] = mapped_column(
        Enum(CustomerStatus, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e]),
        default=CustomerStatus.PROSPECT,
        nullable=False,
        index=True,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", lazy="joined")
    interactions = relationship(
        "Interaction", back_populates="customer", cascade="all, delete-orphan", passive_deletes=True,
        lazy="noload",
    )

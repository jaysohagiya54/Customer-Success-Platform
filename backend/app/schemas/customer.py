import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.customer import CustomerStatus


class CustomerBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    company: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    status: CustomerStatus = CustomerStatus.PROSPECT

    @field_validator("name", "company")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    company: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    status: CustomerStatus | None = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    company: str
    email: EmailStr
    phone: str | None
    status: CustomerStatus
    owner_id: uuid.UUID
    owner_name: str | None = None
    interaction_count: int = 0
    created_at: datetime
    updated_at: datetime

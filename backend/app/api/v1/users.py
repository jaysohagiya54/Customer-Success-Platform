import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.api.deps import AdminUser, DbSession
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserOut

router = APIRouter(prefix="/users", tags=["users"])


class RoleUpdate(BaseModel):
    role: UserRole


class AdminCreateUser(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: UserRole = UserRole.CSM

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter and one digit")
        return v

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


@router.get("", response_model=list[UserOut])
async def list_users(
    _: AdminUser,
    session: DbSession,
) -> list[UserOut]:
    repo = UserRepository(session)
    users = await repo.list_all()
    return [UserOut.model_validate(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminCreateUser,
    _: AdminUser,
    session: DbSession,
) -> UserOut:
    repo = UserRepository(session)
    if await repo.get_by_email(body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    user = await repo.create(user)
    return UserOut.model_validate(user)


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    body: RoleUpdate,
    current_admin: AdminUser,
    session: DbSession,
) -> UserOut:
    if user_id == current_admin.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    repo = UserRepository(session)
    user = await repo.get(user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = body.role
    await repo.save(user)
    return UserOut.model_validate(user)

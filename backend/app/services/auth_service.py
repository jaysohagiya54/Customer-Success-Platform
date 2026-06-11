import uuid

import jwt
from fastapi import HTTPException, status

from app.core.cache import TOKEN_BLOCKLIST_PREFIX, CacheService
from app.core.security import (
    ACCESS_TOKEN,
    REFRESH_TOKEN,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_remaining_seconds,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, ProfileUpdate, RegisterRequest, TokenPair


class AuthService:
    def __init__(self, users: UserRepository, cache: CacheService | None = None):
        self.users = users
        self.cache = cache

    async def register(self, data: RegisterRequest) -> User:
        existing = await self.users.get_by_email(data.email)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists")
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=UserRole.CSM,
        )
        return await self.users.create(user)

    async def authenticate(self, data: LoginRequest) -> tuple[User, TokenPair]:
        user = await self.users.get_by_email(data.email)
        # Verify against a dummy hash on unknown email to keep timing uniform
        if user is None or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        return user, self.issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        try:
            payload = decode_token(refresh_token, REFRESH_TOKEN)
            user_id = uuid.UUID(payload["sub"])
            jti = payload.get("jti", "")
        except (jwt.InvalidTokenError, KeyError, ValueError):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
        if jti and self.cache and await self.cache.exists(f"{TOKEN_BLOCKLIST_PREFIX}{jti}"):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked")
        user = await self.users.get(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found or deactivated")
        return self.issue_tokens(user)

    async def revoke_token(self, raw_token: str, token_type: str) -> None:
        """Add a token's jti to the Redis blocklist until it expires."""
        if self.cache is None:
            return
        try:
            payload = decode_token(raw_token, token_type)
            jti = payload.get("jti")
            if not jti:
                return
            ttl = token_remaining_seconds(payload)
            if ttl > 0:
                await self.cache.set_nx(f"{TOKEN_BLOCKLIST_PREFIX}{jti}", "1", ttl)
        except jwt.InvalidTokenError:
            pass

    async def update_profile(self, user: User, data: ProfileUpdate, current_access_token: str | None = None) -> User:
        if data.full_name is not None:
            user.full_name = data.full_name.strip()
        if data.password is not None:
            user.hashed_password = hash_password(data.password)
            # Revoke current access token so all sessions re-authenticate after password change
            if current_access_token:
                await self.revoke_token(current_access_token, ACCESS_TOKEN)
        return await self.users.save(user)

    @staticmethod
    def issue_tokens(user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
        )

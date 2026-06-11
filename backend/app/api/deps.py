import uuid
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheService, get_cache
from app.core.database import get_db
from app.core.cache import TOKEN_BLOCKLIST_PREFIX
from app.core.security import ACCESS_TOKEN, decode_token
from app.models.user import User, UserRole
from app.repositories.customer_repository import CustomerRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.interaction_repository import InteractionRepository
from app.repositories.user_repository import UserRepository
from fastapi import Request as _Request

from app.services.auth_service import AuthService
from app.services.customer_service import CustomerService
from app.services.dashboard_service import DashboardService
from app.services.insight_service import InsightService
from app.services.interaction_service import InteractionService

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]
Cache = Annotated[CacheService, Depends(get_cache)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: DbSession,
    cache: Cache,
    csp_access: str | None = Cookie(default=None),
) -> User:
    # Accept token from Authorization header (Bearer) or HttpOnly cookie
    raw_token = (credentials.credentials if credentials else None) or csp_access
    if raw_token is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(raw_token, ACCESS_TOKEN)
        user_id = uuid.UUID(payload["sub"])
        jti = payload.get("jti", "")
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if jti and await cache.exists(f"{TOKEN_BLOCKLIST_PREFIX}{jti}"):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await UserRepository(session).get(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found or deactivated")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(current_user: CurrentUser) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


AdminUser = Annotated[User, Depends(require_admin)]


def get_auth_service(session: DbSession, cache: Cache) -> AuthService:
    return AuthService(UserRepository(session), cache)


def get_customer_service(session: DbSession, cache: Cache) -> CustomerService:
    return CustomerService(CustomerRepository(session), cache)


def get_interaction_service(
    request: _Request,
    session: DbSession,
    cache: Cache,
) -> InteractionService:
    insight_svc: InsightService = getattr(request.app.state, "insight_service", None) or InsightService()
    return InteractionService(
        InteractionRepository(session), CustomerRepository(session), cache, insight_svc
    )


def get_dashboard_service(session: DbSession, cache: Cache) -> DashboardService:
    return DashboardService(DashboardRepository(session), cache)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CustomerServiceDep = Annotated[CustomerService, Depends(get_customer_service)]
InteractionServiceDep = Annotated[InteractionService, Depends(get_interaction_service)]
DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]

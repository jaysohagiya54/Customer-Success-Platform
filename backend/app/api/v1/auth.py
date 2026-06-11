from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.api.deps import AuthServiceDep, CurrentUser
from app.core.limiter import limiter
from app.core.security import REFRESH_TOKEN
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)

_bearer = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["auth"])

_ACCESS_COOKIE = "csp_access"
_REFRESH_COOKIE = "csp_refresh"
_PRESENCE_COOKIE = "csp_logged_in"  # not HttpOnly — JS reads this as auth guard signal
_SECURE_OPTS: dict = dict(httponly=True, secure=True, samesite="strict", path="/")


def _set_auth_cookies(response: Response, tokens: TokenPair) -> None:
    response.set_cookie(_ACCESS_COOKIE, tokens.access_token, max_age=30 * 60, **_SECURE_OPTS)
    response.set_cookie(_REFRESH_COOKIE, tokens.refresh_token, max_age=7 * 24 * 3600, **_SECURE_OPTS)
    # JS-readable presence flag (no token value, just signals an active session exists)
    response.set_cookie(_PRESENCE_COOKIE, "1", max_age=7 * 24 * 3600,
                        httponly=False, secure=True, samesite="strict", path="/")


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(_ACCESS_COOKIE, path="/", httponly=True, secure=True, samesite="strict")
    response.delete_cookie(_REFRESH_COOKIE, path="/", httponly=True, secure=True, samesite="strict")
    response.delete_cookie(_PRESENCE_COOKIE, path="/", httponly=False, secure=True, samesite="strict")


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    service: AuthServiceDep,
    response: Response,
) -> AuthResponse:
    user = await service.register(data)
    tokens = service.issue_tokens(user)
    _set_auth_cookies(response, tokens)
    return AuthResponse(user=UserOut.model_validate(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    data: LoginRequest,
    service: AuthServiceDep,
    response: Response,
) -> AuthResponse:
    user, tokens = await service.authenticate(data)
    _set_auth_cookies(response, tokens)
    return AuthResponse(user=UserOut.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    service: AuthServiceDep,
    response: Response,
    data: RefreshRequest | None = None,
    csp_refresh: str | None = Cookie(default=None, alias=_REFRESH_COOKIE),
) -> TokenPair:
    raw = (data.refresh_token if data else None) or csp_refresh
    if not raw:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    tokens = await service.refresh(raw)
    _set_auth_cookies(response, tokens)
    return tokens


@router.get("/me", response_model=UserOut)
async def get_profile(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: CurrentUser,
    service: AuthServiceDep,
    response: Response,
    data: LogoutRequest | None = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
    csp_access: str | None = Cookie(default=None, alias=_ACCESS_COOKIE),
    csp_refresh: str | None = Cookie(default=None, alias=_REFRESH_COOKIE),
) -> None:
    # Revoke access token — prefer Authorization header, fall back to cookie
    access_raw = (credentials.credentials if credentials else None) or csp_access
    if access_raw:
        await service.revoke_token(access_raw, "access")
    # Revoke refresh token — prefer body, fall back to cookie
    refresh_raw = (data.refresh_token if data else None) or csp_refresh
    if refresh_raw:
        try:
            await service.revoke_token(refresh_raw, REFRESH_TOKEN)
        except Exception:
            pass
    _clear_auth_cookies(response)


@router.patch("/me", response_model=UserOut)
async def update_profile(
    data: ProfileUpdate,
    current_user: CurrentUser,
    service: AuthServiceDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
) -> UserOut:
    raw_token = credentials.credentials if credentials else None
    user = await service.update_profile(current_user, data, current_access_token=raw_token)
    return UserOut.model_validate(user)

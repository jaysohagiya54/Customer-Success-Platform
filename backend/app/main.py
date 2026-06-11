import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.cache import get_cache
from app.core.config import get_settings
from app.core.database import run_migrations
from app.core.limiter import limiter
from app.core.logging import configure_logging
from app.middleware.correlation import CorrelationIdMiddleware
from app.seed import seed_admin
from app.services.insight_service import InsightService

configure_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import sys
    import traceback

    # InsightService never touches the network at construction — safe to build first.
    app.state.insight_service = InsightService()

    try:
        await run_migrations()
    except Exception:
        # Raw stderr print guarantees the traceback survives even if logging is
        # misconfigured — then re-raise so the failure is loud.
        print("=== STARTUP MIGRATION FAILED ===", file=sys.stderr, flush=True)
        traceback.print_exc()
        sys.stderr.flush()
        raise

    # Seeding is best-effort: a transient DB hiccup here should not prevent the
    # API from starting. The admin can be created on a later request/restart.
    try:
        await seed_admin()
    except Exception:
        print("=== ADMIN SEEDING FAILED (continuing) ===", file=sys.stderr, flush=True)
        traceback.print_exc()
        sys.stderr.flush()

    yield


_docs_url = None if settings.environment == "production" else "/docs"
_redoc_url = None if settings.environment == "production" else "/redoc"

app = FastAPI(
    title="Customer Success Insights Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Cookie"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/health", tags=["health"])
async def health() -> dict:
    redis_ok = await get_cache().ping()

    db_ok = False
    try:
        from sqlalchemy import text
        from app.core.database import async_session_maker
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    overall = "ok" if (redis_ok and db_ok) else "degraded"
    return {
        "status": overall,
        "redis": "ok" if redis_ok else "unavailable",
        "database": "ok" if db_ok else "unavailable",
    }

from collections.abc import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit, parse_qs

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _async_db_url(url: str) -> tuple[str, dict]:
    """Rewrite a sync Postgres URL to the asyncpg driver and extract SSL settings.

    asyncpg does NOT understand libpq query params like ``?sslmode=require`` (psycopg2 does).
    Managed providers (Render, Supabase, Heroku) append those, so strip the query string and
    translate it into asyncpg ``connect_args`` instead. SQLite/other URLs pass through untouched.
    """
    connect_args: dict = {}
    parts = urlsplit(url)
    scheme = parts.scheme

    if scheme in ("postgres", "postgresql", "postgresql+asyncpg"):
        # Detect sslmode from the query string before discarding it
        query = parse_qs(parts.query)
        sslmode = (query.get("sslmode") or query.get("ssl") or [""])[0].lower()
        if sslmode in ("require", "verify-ca", "verify-full", "true", "1"):
            connect_args["ssl"] = True

        # Rebuild URL with asyncpg driver and NO query string
        url = urlunsplit(("postgresql+asyncpg", parts.netloc, parts.path, "", ""))

    return url, connect_args


_url, _connect_args = _async_db_url(get_settings().database_url)
engine = create_async_engine(_url, pool_pre_ping=True, connect_args=_connect_args)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def init_db() -> None:
    """Used by tests only — creates tables directly via SQLAlchemy for in-memory SQLite."""
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def _run_migrations_sync() -> None:
    """Synchronously apply Alembic migrations. Runs entirely with the psycopg2 driver
    (see alembic/env.py) so there is no event loop involved."""
    from pathlib import Path
    from alembic import command
    from alembic.config import Config

    # Resolve alembic.ini relative to this file so it works regardless of CWD
    ini_path = Path(__file__).resolve().parent.parent.parent / "alembic.ini"
    cfg = Config(str(ini_path))
    command.upgrade(cfg, "head")


async def run_migrations() -> None:
    """Apply pending Alembic migrations at startup. Safe to call multiple times.

    Runs the synchronous Alembic upgrade in a worker thread so it never blocks or
    nests inside the application's running event loop.
    """
    import asyncio

    await asyncio.to_thread(_run_migrations_sync)

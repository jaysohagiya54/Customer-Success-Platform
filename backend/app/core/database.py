from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _async_db_url(url: str) -> str:
    """Rewrite plain postgres:// or postgresql:// to use asyncpg driver."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url[len(prefix):]
    return url

engine = create_async_engine(_async_db_url(get_settings().database_url), pool_pre_ping=True)
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

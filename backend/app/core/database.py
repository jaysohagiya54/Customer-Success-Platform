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


async def run_migrations() -> None:
    """Apply pending Alembic migrations at startup. Safe to call multiple times."""
    import asyncio
    from alembic import command
    from alembic.config import Config

    cfg = Config("alembic.ini")
    await asyncio.get_event_loop().run_in_executor(None, command.upgrade, cfg, "head")

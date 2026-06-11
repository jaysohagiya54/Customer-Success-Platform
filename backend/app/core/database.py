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


def _heal_stale_version(cfg) -> None:
    """Recover from a corrupted alembic_version state.

    A prior buggy migration could stamp a revision without actually creating tables.
    If alembic_version points at a revision but the core ``users`` table is missing,
    the version is stale — clear it so the (fixed) initial migration re-runs from scratch.
    """
    from sqlalchemy import create_engine, inspect, text

    url = cfg.get_main_option("sqlalchemy.url")
    eng = create_engine(url, poolclass=None)
    try:
        with eng.connect() as conn:
            insp = inspect(conn)
            tables = set(insp.get_table_names())
            if "alembic_version" in tables and "users" not in tables:
                # Stamped but real schema missing → wipe the stamp.
                conn.execute(text("DELETE FROM alembic_version"))
                conn.commit()
    finally:
        eng.dispose()


def _run_migrations_sync() -> None:
    """Synchronously apply Alembic migrations. Runs entirely with the psycopg2 driver
    (see alembic/env.py) so there is no event loop involved."""
    from pathlib import Path
    from alembic import command
    from alembic.config import Config

    # Resolve alembic.ini relative to this file so it works regardless of CWD
    ini_path = Path(__file__).resolve().parent.parent.parent / "alembic.ini"
    cfg = Config(str(ini_path))

    # Make env.py's DATABASE_URL override apply for the heal step too by loading it.
    import os
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url:
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        if db_url.startswith("postgres://"):
            db_url = "postgresql://" + db_url[len("postgres://"):]
        cfg.set_main_option("sqlalchemy.url", db_url)

    _heal_stale_version(cfg)
    command.upgrade(cfg, "head")


async def run_migrations() -> None:
    """Apply pending Alembic migrations at startup. Safe to call multiple times.

    Runs the synchronous Alembic upgrade in a worker thread so it never blocks or
    nests inside the application's running event loop.
    """
    import asyncio

    await asyncio.to_thread(_run_migrations_sync)

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from DATABASE_URL env var so Docker / Render works without editing alembic.ini.
# Alembic runs migrations synchronously with the psycopg2 (sync) driver — NOT asyncpg — to avoid
# nesting an event loop inside the application's running loop. Normalize any URL to psycopg2 form.
database_url = os.environ.get("DATABASE_URL", "")
if database_url:
    # Strip async driver suffix and any plain prefix → psycopg2 sync URL
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]
    config.set_main_option("sqlalchemy.url", database_url)

from app.core.database import Base  # noqa: E402
import app.models  # noqa: E402, F401 — register all models with Base.metadata

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

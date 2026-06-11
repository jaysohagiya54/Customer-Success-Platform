"""initial_schema

Creates the full schema (users, customers, interactions, ai_insights) directly from
the SQLAlchemy model metadata so the migration can never drift from the models.

Revision ID: bbbb26fba408
Revises:
Create Date: 2026-06-11 11:54:57.139767

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'bbbb26fba408'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables from model metadata (includes all columns, FKs, and indexes)."""
    from app.core.database import Base
    import app.models  # noqa: F401 — register every model on Base.metadata

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Drop all tables."""
    from app.core.database import Base
    import app.models  # noqa: F401

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)

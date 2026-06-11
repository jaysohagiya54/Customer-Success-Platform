"""add_compound_index_interactions

The compound index is already defined on the Interaction model (__table_args__) and is
therefore created by the initial metadata-based migration. This migration is kept for
history continuity but creates the index idempotently (IF NOT EXISTS) so it is a no-op
on a freshly created schema and still works on any older DB that predates the index.

Revision ID: 1d789e286712
Revises: bbbb26fba408
Create Date: 2026-06-11 12:06:02.252044

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '1d789e286712'
down_revision: Union[str, Sequence[str], None] = 'bbbb26fba408'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_interactions_customer_occurred "
        "ON interactions (customer_id, occurred_at)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_interactions_customer_occurred")

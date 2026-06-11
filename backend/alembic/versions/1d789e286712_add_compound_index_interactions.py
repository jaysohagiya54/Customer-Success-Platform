"""add_compound_index_interactions

Revision ID: 1d789e286712
Revises: bbbb26fba408
Create Date: 2026-06-11 12:06:02.252044

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d789e286712'
down_revision: Union[str, Sequence[str], None] = 'bbbb26fba408'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_interactions_customer_occurred",
        "interactions",
        ["customer_id", "occurred_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_interactions_customer_occurred", table_name="interactions")

"""add gamertag to profiles

Revision ID: 2b98dc010e75
Revises: aa6214463f7e
Create Date: 2026-11-26 09:50:16.756266

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b98dc010e75'
down_revision: Union[str, Sequence[str], None] = 'aa6214463f7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("gamertag", sa.String(length=30), nullable=True))
    op.create_index(
        "uq_profiles_gamertag_lower",
        "profiles",
        [sa.text("lower(gamertag)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_profiles_gamertag_lower", table_name="profiles")
    op.drop_column("profiles", "gamertag")

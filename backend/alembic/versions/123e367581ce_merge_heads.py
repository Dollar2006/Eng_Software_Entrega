"""merge heads

Revision ID: 123e367581ce
Revises: 35dba446ea7c, e64171260516
Create Date: 2026-11-25 20:49:38.041388

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '123e367581ce'
down_revision: Union[str, Sequence[str], None] = ('35dba446ea7c', 'e64171260516')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

"""add review likes table

Revision ID: a1b2c3d4e5f6
Revises: 2b98dc010e75
Create Date: 2026-11-26 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "2b98dc010e75"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "review_likes",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "review_id", name="pk_review_likes"),
    )
    op.create_index("ix_review_likes_user_id", "review_likes", ["user_id"])
    op.create_index("ix_review_likes_review_id", "review_likes", ["review_id"])


def downgrade() -> None:
    op.drop_index("ix_review_likes_review_id", table_name="review_likes")
    op.drop_index("ix_review_likes_user_id", table_name="review_likes")
    op.drop_table("review_likes")

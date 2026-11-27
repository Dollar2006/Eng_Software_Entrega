"""add persistent likes to reviews

Revision ID: 7f4c2b9a1d30
Revises: 4de593edd391
Create Date: 2026-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f4c2b9a1d30"
down_revision: Union[str, Sequence[str], None] = "4de593edd391"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "reviews",
        "likes",
        existing_type=sa.SmallInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
        existing_server_default=sa.text("0"),
    )
    op.create_table(
        "review_likes",
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("review_id", "user_id"),
    )
    op.create_index(
        "ix_review_likes_user_id", "review_likes", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_review_likes_user_id", table_name="review_likes")
    op.drop_table("review_likes")
    op.alter_column(
        "reviews",
        "likes",
        existing_type=sa.Integer(),
        type_=sa.SmallInteger(),
        existing_nullable=False,
        existing_server_default=sa.text("0"),
    )

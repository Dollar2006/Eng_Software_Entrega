"""add notifications table

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-11-26 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_recipient_id", "notifications", ["recipient_id"])
    op.create_index("ix_notifications_actor_id", "notifications", ["actor_id"])
    op.create_index("ix_notifications_review_id", "notifications", ["review_id"])
    op.create_index("ix_notifications_read_at", "notifications", ["read_at"])
    op.create_index(
        "ix_notifications_recipient_created_at",
        "notifications",
        ["recipient_id", "created_at"],
    )
    op.create_index(
        "uq_notifications_follow",
        "notifications",
        ["recipient_id", "actor_id", "type"],
        unique=True,
        postgresql_where=sa.text("review_id IS NULL"),
    )
    op.create_index(
        "uq_notifications_review_like",
        "notifications",
        ["recipient_id", "actor_id", "type", "review_id"],
        unique=True,
        postgresql_where=sa.text("review_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_notifications_review_like", table_name="notifications")
    op.drop_index("uq_notifications_follow", table_name="notifications")
    op.drop_index("ix_notifications_recipient_created_at", table_name="notifications")
    op.drop_index("ix_notifications_read_at", table_name="notifications")
    op.drop_index("ix_notifications_review_id", table_name="notifications")
    op.drop_index("ix_notifications_actor_id", table_name="notifications")
    op.drop_index("ix_notifications_recipient_id", table_name="notifications")
    op.drop_table("notifications")

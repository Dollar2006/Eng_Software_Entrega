"""create lists and list_items

Revision ID: e64171260516
Revises: 8d2ce9272a56
Create Date: 2026-10-04 09:30:16.277785

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e64171260516'
down_revision: Union[str, Sequence[str], None] = '8d2ce9272a56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('kind', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("kind IN ('system','custom')", name='ck_lists_kind'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_lists_user_name'),
    )
    op.create_index(op.f('ix_lists_user_id'), 'lists', ['user_id'], unique=False)

    op.create_table(
        'list_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('list_id', sa.Integer(), nullable=False),
        sa.Column('game_id', sa.Integer(), nullable=False),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['game_id'], ['games.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['list_id'], ['lists.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('list_id', 'game_id', name='uq_list_items_list_game'),
    )
    op.create_index(op.f('ix_list_items_game_id'), 'list_items', ['game_id'], unique=False)
    op.create_index(op.f('ix_list_items_list_id'), 'list_items', ['list_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_list_items_list_id'), table_name='list_items')
    op.drop_index(op.f('ix_list_items_game_id'), table_name='list_items')
    op.drop_table('list_items')
    op.drop_index(op.f('ix_lists_user_id'), table_name='lists')
    op.drop_table('lists')

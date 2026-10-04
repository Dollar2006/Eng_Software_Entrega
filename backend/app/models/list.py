from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class List(Base):
    __tablename__ = "lists"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_lists_user_name"),
        CheckConstraint("kind IN ('system','custom')", name="ck_lists_kind"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(50), nullable=False)
    kind = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ListItem(Base):
    __tablename__ = "list_items"
    __table_args__ = (
        UniqueConstraint("list_id", "game_id", name="uq_list_items_list_game"),
    )

    id = Column(Integer, primary_key=True)
    list_id = Column(
        Integer,
        ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    game_id = Column(
        Integer,
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

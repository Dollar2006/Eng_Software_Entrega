from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)

from app.db.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="uq_reviews_user_game"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
    )

    id = Column(Integer, primary_key=True)
    # id do usuário que o auth devolve (Supabase). Sem FK: o usuário vive no auth.
    user_id = Column(String, nullable=False, index=True)
    game_id = Column(
        Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating = Column(SmallInteger, nullable=False)
    # REQ-08: texto da review. NULL = o usuário só deu nota (REQ-07).
    text = Column(Text)
    # Nome exibido ao lado da review. Guardado na hora de escrever porque o
    # perfil (nome de exibição) ainda não existe no backend.
    author_name = Column(String(100))
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

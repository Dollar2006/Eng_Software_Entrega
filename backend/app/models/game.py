from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    cover_url = Column(String(500))
    genres = Column(ARRAY(String), nullable=False, default=list)
    platforms = Column(ARRAY(String), nullable=False, default=list)
from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Categorias_afiliados(Base):
    __tablename__ = "categorias_afiliados"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    ref_id = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    emoji = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
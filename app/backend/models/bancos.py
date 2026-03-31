from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Bancos(Base):
    __tablename__ = "bancos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    ref_id = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    cor = Column(String, nullable=False)
    ativo = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
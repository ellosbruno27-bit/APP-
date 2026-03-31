from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Afiliados(Base):
    __tablename__ = "afiliados"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    nome = Column(String, nullable=False)
    telefone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    categoria_id = Column(String, nullable=False)
    ativo = Column(Boolean, nullable=False)
    codigo_acesso = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
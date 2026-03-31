from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Corretores(Base):
    __tablename__ = "corretores"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    ref_id = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    telefone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    ativo = Column(Boolean, nullable=False)
    leads_atribuidos = Column(Integer, nullable=True)
    landing_pages_json = Column(String, nullable=True)
    codigo_acesso = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
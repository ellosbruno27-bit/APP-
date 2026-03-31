from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Produtos(Base):
    __tablename__ = "produtos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    banco_id = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    valor_min = Column(Float, nullable=True)
    valor_max = Column(Float, nullable=True)
    descricao = Column(String, nullable=True)
    taxa = Column(Float, nullable=True)
    prazo = Column(String, nullable=True)
    ativo = Column(Boolean, nullable=False)
    conteudo_links = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
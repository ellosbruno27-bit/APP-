from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Landing_pages(Base):
    __tablename__ = "landing_pages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    ref_id = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    dominio = Column(String, nullable=False)
    proprietario = Column(String, nullable=False)
    webhook_url = Column(String, nullable=False)
    template_mensagem = Column(String, nullable=False)
    ativa = Column(Boolean, nullable=False)
    cor = Column(String, nullable=False)
    leads_total = Column(Integer, nullable=True)
    conversoes = Column(Integer, nullable=True)
    categoria = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
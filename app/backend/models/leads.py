from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Leads(Base):
    __tablename__ = "leads"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    nome = Column(String, nullable=False)
    telefone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    cpf_cnpj = Column(String, nullable=True)
    valor_pretendido = Column(Float, nullable=True)
    servico = Column(String, nullable=False)
    status = Column(String, nullable=False)
    prioridade = Column(String, nullable=False)
    landing_page_id = Column(String, nullable=False)
    origem = Column(String, nullable=False)
    score_estimado = Column(Integer, nullable=True)
    relacao_parcela_renda = Column(Float, nullable=True)
    corretor_id = Column(String, nullable=True)
    historico = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
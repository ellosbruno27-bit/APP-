// CentralBankMaximo CRM - Backend Data Hook
// Provides backend data with localStorage fallback for seamless migration
import { useState, useEffect, useCallback } from "react";
import type { Lead, LandingPage, Corretor, Banco, Produto, CategoriaAfiliado } from "./data";
import {
  leads as defaultLeads,
  landingPages as defaultLandingPages,
  corretores as defaultCorretores,
  defaultBancos,
  defaultProdutos,
  defaultCategoriasAfiliado,
} from "./data";
import {
  fetchLeads,
  fetchLandingPages,
  fetchCorretores,
  fetchBancos,
  fetchProdutos,
  fetchCategoriasAfiliados,
  type BackendLead,
  type BackendLandingPage,
  type BackendCorretor,
  type BackendBanco,
  type BackendProduto,
  type BackendCategoriaAfiliado,
} from "./api";

// ── Mappers: Backend → Frontend types ──

function mapBackendLead(b: BackendLead): Lead {
  let historico: { data: string; acao: string }[] = [];
  try {
    if (b.historico) {
      historico = JSON.parse(b.historico);
    }
  } catch {
    historico = [];
  }

  return {
    id: String(b.id),
    nome: b.nome,
    telefone: b.telefone,
    email: b.email,
    cpfCnpj: b.cpf_cnpj || undefined,
    valorPretendido: b.valor_pretendido || 0,
    servico: b.servico as Lead["servico"],
    status: b.status as Lead["status"],
    prioridade: b.prioridade as Lead["prioridade"],
    landingPageId: b.landing_page_id,
    origem: b.origem as Lead["origem"],
    scoreEstimado: b.score_estimado || 0,
    relacaoParcelaRenda: b.relacao_parcela_renda || 0,
    corretorId: b.corretor_id || null,
    criadoEm: b.created_at || new Date().toISOString(),
    ultimaInteracao: b.updated_at || b.created_at || new Date().toISOString(),
    historico,
  };
}

function mapBackendLP(b: BackendLandingPage): LandingPage {
  return {
    id: b.ref_id || String(b.id),
    nome: b.nome,
    dominio: b.dominio,
    proprietario: b.proprietario,
    webhookUrl: b.webhook_url,
    templateMensagem: b.template_mensagem,
    ativa: b.ativa,
    cor: b.cor,
    leadsTotal: b.leads_total,
    conversoes: b.conversoes,
    categoria: b.categoria || undefined,
  };
}

function mapBackendCorretor(b: BackendCorretor): Corretor {
  let landingPages: string[] = [];
  try {
    if (b.landing_pages) {
      landingPages = JSON.parse(b.landing_pages);
    }
  } catch {
    landingPages = [];
  }

  return {
    id: b.ref_id || String(b.id),
    nome: b.nome,
    telefone: b.telefone,
    email: b.email,
    ativo: b.ativo,
    leadsAtribuidos: b.leads_atribuidos,
    landingPages,
    codigoAcesso: b.codigo_acesso || undefined,
  };
}

function mapBackendBanco(b: BackendBanco): Banco {
  return {
    id: b.ref_id || String(b.id),
    nome: b.nome,
    cor: b.cor,
    ativo: b.ativo,
    criadoEm: b.created_at || new Date().toISOString(),
  };
}

function mapBackendProduto(b: BackendProduto): Produto {
  let conteudoLinks: Produto["conteudoLinks"] = [];
  try {
    if (b.conteudo_links) {
      conteudoLinks = JSON.parse(b.conteudo_links);
    }
  } catch {
    conteudoLinks = [];
  }

  return {
    id: String(b.id),
    bancoId: b.banco_id,
    nome: b.nome,
    categoria: b.categoria as Produto["categoria"],
    valorMin: b.valor_min,
    valorMax: b.valor_max,
    descricao: b.descricao,
    taxa: b.taxa,
    prazo: b.prazo,
    ativo: b.ativo,
    criadoEm: b.created_at || new Date().toISOString(),
    atualizadoEm: b.updated_at || new Date().toISOString(),
    conteudoLinks,
  };
}

function mapBackendCategoriaAfiliado(b: BackendCategoriaAfiliado): CategoriaAfiliado {
  return {
    id: b.ref_id || String(b.id),
    nome: b.nome,
    emoji: b.emoji,
  };
}

// ── Main Hook ──

interface BackendData {
  leads: Lead[];
  landingPages: LandingPage[];
  corretores: Corretor[];
  bancos: Banco[];
  produtos: Produto[];
  categoriasAfiliado: CategoriaAfiliado[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBackendData(): BackendData {
  const [leads, setLeads] = useState<Lead[]>(defaultLeads);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(defaultLandingPages);
  const [corretores, setCorretores] = useState<Corretor[]>(defaultCorretores);
  const [bancos, setBancos] = useState<Banco[]>(defaultBancos);
  const [produtos, setProdutos] = useState<Produto[]>(defaultProdutos);
  const [categoriasAfiliado, setCategoriasAfiliado] = useState<CategoriaAfiliado[]>(defaultCategoriasAfiliado);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leadsRes, lpRes, corretoresRes, bancosRes, produtosRes, catRes] = await Promise.allSettled([
        fetchLeads({ limit: 500 }),
        fetchLandingPages({ limit: 100 }),
        fetchCorretores({ limit: 100 }),
        fetchBancos({ limit: 100 }),
        fetchProdutos({ limit: 100 }),
        fetchCategoriasAfiliados({ limit: 100 }),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value.items.length > 0) {
        setLeads(leadsRes.value.items.map(mapBackendLead));
      }
      if (lpRes.status === "fulfilled" && lpRes.value.items.length > 0) {
        setLandingPages(lpRes.value.items.map(mapBackendLP));
      }
      if (corretoresRes.status === "fulfilled" && corretoresRes.value.items.length > 0) {
        setCorretores(corretoresRes.value.items.map(mapBackendCorretor));
      }
      if (bancosRes.status === "fulfilled" && bancosRes.value.items.length > 0) {
        setBancos(bancosRes.value.items.map(mapBackendBanco));
      }
      if (produtosRes.status === "fulfilled" && produtosRes.value.items.length > 0) {
        setProdutos(produtosRes.value.items.map(mapBackendProduto));
      }
      if (catRes.status === "fulfilled" && catRes.value.items.length > 0) {
        setCategoriasAfiliado(catRes.value.items.map(mapBackendCategoriaAfiliado));
      }
    } catch (err) {
      console.error("Error loading backend data:", err);
      setError("Falha ao carregar dados do servidor. Usando dados locais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    leads,
    landingPages,
    corretores,
    bancos,
    produtos,
    categoriasAfiliado,
    loading,
    error,
    refresh: loadData,
  };
}
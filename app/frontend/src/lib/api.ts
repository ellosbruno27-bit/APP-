// CentralBankMaximo CRM - Backend API Layer using Web SDK
import { createClient } from "@metagptx/web-sdk";

const client = createClient();

export { client };

// ── Type definitions for backend responses ──
export interface BackendLead {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cpf_cnpj: string | null;
  valor_pretendido: number | null;
  servico: string;
  status: string;
  prioridade: string;
  landing_page_id: string;
  origem: string;
  score_estimado: number | null;
  relacao_parcela_renda: number | null;
  corretor_id: string | null;
  historico: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BackendLandingPage {
  id: number;
  ref_id: string;
  nome: string;
  dominio: string;
  proprietario: string;
  webhook_url: string;
  template_mensagem: string;
  ativa: boolean;
  cor: string;
  leads_total: number;
  conversoes: number;
  categoria: string | null;
  created_at: string | null;
}

export interface BackendCorretor {
  id: number;
  ref_id: string;
  nome: string;
  telefone: string;
  email: string;
  ativo: boolean;
  leads_atribuidos: number;
  landing_pages: string;
  codigo_acesso: string | null;
  created_at: string | null;
}

export interface BackendBanco {
  id: number;
  ref_id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  created_at: string | null;
}

export interface BackendProduto {
  id: number;
  banco_id: string;
  nome: string;
  categoria: string;
  valor_min: number | null;
  valor_max: number | null;
  descricao: string;
  taxa: number | null;
  prazo: string;
  ativo: boolean;
  conteudo_links: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BackendAfiliado {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  categoria_id: string;
  ativo: boolean;
  codigo_acesso: string | null;
  user_id: string;
  created_at: string | null;
}

export interface BackendCategoriaAfiliado {
  id: number;
  ref_id: string;
  nome: string;
  emoji: string;
  created_at: string | null;
}

// ── API Functions ──

// Leads
export async function fetchLeads(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
  skip?: number;
}): Promise<{ items: BackendLead[]; total: number }> {
  try {
    const response = await client.entities.leads.queryAll({
      query: params?.query || {},
      sort: params?.sort || "-created_at",
      limit: params?.limit || 100,
      skip: params?.skip || 0,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching leads:", error);
    return { items: [], total: 0 };
  }
}

export async function createLead(data: Partial<BackendLead>): Promise<BackendLead | null> {
  try {
    const response = await client.entities.leads.create({ data });
    return response.data || null;
  } catch (error) {
    console.error("Error creating lead:", error);
    return null;
  }
}

export async function updateLead(id: number, data: Partial<BackendLead>): Promise<BackendLead | null> {
  try {
    const response = await client.entities.leads.update({ id: String(id), data });
    return response.data || null;
  } catch (error) {
    console.error("Error updating lead:", error);
    return null;
  }
}

export async function deleteLead(id: number): Promise<boolean> {
  try {
    await client.entities.leads.delete({ id: String(id) });
    return true;
  } catch (error) {
    console.error("Error deleting lead:", error);
    return false;
  }
}

// Landing Pages
export async function fetchLandingPages(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendLandingPage[]; total: number }> {
  try {
    const response = await client.entities.landing_pages.queryAll({
      query: params?.query || {},
      sort: params?.sort || "-created_at",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching landing pages:", error);
    return { items: [], total: 0 };
  }
}

export async function createLandingPage(data: Partial<BackendLandingPage>): Promise<BackendLandingPage | null> {
  try {
    const response = await client.entities.landing_pages.create({ data });
    return response.data || null;
  } catch (error) {
    console.error("Error creating landing page:", error);
    return null;
  }
}

export async function updateLandingPage(id: number, data: Partial<BackendLandingPage>): Promise<BackendLandingPage | null> {
  try {
    const response = await client.entities.landing_pages.update({ id: String(id), data });
    return response.data || null;
  } catch (error) {
    console.error("Error updating landing page:", error);
    return null;
  }
}

// Corretores
export async function fetchCorretores(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendCorretor[]; total: number }> {
  try {
    const response = await client.entities.corretores.queryAll({
      query: params?.query || {},
      sort: params?.sort || "-created_at",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching corretores:", error);
    return { items: [], total: 0 };
  }
}

export async function createCorretor(data: Partial<BackendCorretor>): Promise<BackendCorretor | null> {
  try {
    const response = await client.entities.corretores.create({ data });
    return response.data || null;
  } catch (error) {
    console.error("Error creating corretor:", error);
    return null;
  }
}

export async function updateCorretor(id: number, data: Partial<BackendCorretor>): Promise<BackendCorretor | null> {
  try {
    const response = await client.entities.corretores.update({ id: String(id), data });
    return response.data || null;
  } catch (error) {
    console.error("Error updating corretor:", error);
    return null;
  }
}

// Bancos
export async function fetchBancos(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendBanco[]; total: number }> {
  try {
    const response = await client.entities.bancos.queryAll({
      query: params?.query || {},
      sort: params?.sort || "nome",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching bancos:", error);
    return { items: [], total: 0 };
  }
}

// Produtos
export async function fetchProdutos(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendProduto[]; total: number }> {
  try {
    const response = await client.entities.produtos.queryAll({
      query: params?.query || {},
      sort: params?.sort || "-created_at",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching produtos:", error);
    return { items: [], total: 0 };
  }
}

export async function createProduto(data: Partial<BackendProduto>): Promise<BackendProduto | null> {
  try {
    const response = await client.entities.produtos.create({ data });
    return response.data || null;
  } catch (error) {
    console.error("Error creating produto:", error);
    return null;
  }
}

export async function updateProduto(id: number, data: Partial<BackendProduto>): Promise<BackendProduto | null> {
  try {
    const response = await client.entities.produtos.update({ id: String(id), data });
    return response.data || null;
  } catch (error) {
    console.error("Error updating produto:", error);
    return null;
  }
}

export async function deleteProduto(id: number): Promise<boolean> {
  try {
    await client.entities.produtos.delete({ id: String(id) });
    return true;
  } catch (error) {
    console.error("Error deleting produto:", error);
    return false;
  }
}

// Afiliados
export async function fetchAfiliados(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendAfiliado[]; total: number }> {
  try {
    const response = await client.entities.afiliados.query({
      query: params?.query || {},
      sort: params?.sort || "-created_at",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching afiliados:", error);
    return { items: [], total: 0 };
  }
}

export async function createAfiliado(data: Partial<BackendAfiliado>): Promise<BackendAfiliado | null> {
  try {
    const response = await client.entities.afiliados.create({ data });
    return response.data || null;
  } catch (error) {
    console.error("Error creating afiliado:", error);
    return null;
  }
}

export async function updateAfiliado(id: number, data: Partial<BackendAfiliado>): Promise<BackendAfiliado | null> {
  try {
    const response = await client.entities.afiliados.update({ id: String(id), data });
    return response.data || null;
  } catch (error) {
    console.error("Error updating afiliado:", error);
    return null;
  }
}

export async function deleteAfiliado(id: number): Promise<boolean> {
  try {
    await client.entities.afiliados.delete({ id: String(id) });
    return true;
  } catch (error) {
    console.error("Error deleting afiliado:", error);
    return false;
  }
}

// Categorias Afiliados
export async function fetchCategoriasAfiliados(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
}): Promise<{ items: BackendCategoriaAfiliado[]; total: number }> {
  try {
    const response = await client.entities.categorias_afiliados.queryAll({
      query: params?.query || {},
      sort: params?.sort || "nome",
      limit: params?.limit || 100,
    });
    return { items: response.data?.items || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error("Error fetching categorias afiliados:", error);
    return { items: [], total: 0 };
  }
}

// Webhook test
export async function testWebhook(platform: "facebook" | "google", testData: Record<string, unknown>): Promise<{ success: boolean; lead_id?: number; message?: string }> {
  try {
    const response = await client.apiCall.invoke({
      url: `/api/v1/webhooks/${platform}`,
      method: "POST",
      data: testData,
    });
    return response.data || { success: false, message: "No response" };
  } catch (error) {
    console.error(`Error testing ${platform} webhook:`, error);
    return { success: false, message: String(error) };
  }
}
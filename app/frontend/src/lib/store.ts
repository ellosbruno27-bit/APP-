import { leads as defaultLeads, landingPages as defaultLandingPages, corretores as defaultCorretores, defaultProdutos, defaultBancos, defaultCategoriasAfiliado } from "./data";
import type { Lead, LandingPage, Corretor, Produto, Banco, Parceiro, Afiliado, CategoriaAfiliado } from "./data";

const LEADS_KEY = "leadbank_leads";
const LP_KEY = "leadbank_landing_pages";
const QUEUE_KEY = "leadbank_queue";
const BROKER_STATUS_KEY = "leadbank_broker_status";
const ROUND_ROBIN_KEY = "leadbank_round_robin_index";
const PRODUCTS_KEY = "leadbank_produtos";
const BANKS_KEY = "leadbank_bancos";
const PARCEIROS_KEY = "leadbank_parceiros";
const LEAD_PARCEIROS_KEY = "leadbank_lead_parceiros"; // map leadId -> parceiroId
const AFILIADOS_KEY = "leadbank_afiliados";
const CATEGORIAS_AFILIADOS_KEY = "leadbank_categorias_afiliados";
const LEAD_AFILIADOS_KEY = "leadbank_lead_afiliados"; // map leadId -> afiliadoId

// ── Queue Types ──
export type BrokerStatus = "disponivel" | "ocupado" | "offline";

export interface QueueAssignment {
  id: string;
  leadId: string;
  corretorId: string;
  assignedAt: string; // ISO timestamp
  acceptedAt: string | null;
  status: "pendente" | "aceito" | "expirado" | "recusado";
  slaSeconds: number; // 600 = 10 min
}

export interface BrokerState {
  corretorId: string;
  status: BrokerStatus;
}

// ── Leads ──
export function loadLeads(): Lead[] {
  try {
    const stored = localStorage.getItem(LEADS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Lead[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  saveLeads(defaultLeads);
  return [...defaultLeads];
}

export function saveLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch {
    // storage full
  }
}

// ── Landing Pages ──
export function loadLandingPages(): LandingPage[] {
  try {
    const stored = localStorage.getItem(LP_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LandingPage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  saveLandingPages(defaultLandingPages);
  return [...defaultLandingPages];
}

export function saveLandingPages(lps: LandingPage[]): void {
  try {
    localStorage.setItem(LP_KEY, JSON.stringify(lps));
  } catch {
    // storage full
  }
}

// ── Lead helpers ──
export function addLead(lead: Lead): Lead[] {
  const current = loadLeads();
  current.unshift(lead);
  saveLeads(current);

  // Trigger push notification and in-app notification
  import("./notifications").then(({ sendLeadNotification, addInAppNotification }) => {
    const notifData = {
      id: lead.id,
      nome: lead.nome,
      origem: lead.origem,
      servico: lead.servico,
      prioridade: lead.prioridade,
      valorPretendido: lead.valorPretendido,
    };
    sendLeadNotification(notifData);
    addInAppNotification(notifData);
  }).catch(() => {
    // notification module not available
  });

  return current;
}

export function updateLeadStatus(leadId: string, status: Lead["status"]): Lead[] {
  const current = loadLeads();
  const idx = current.findIndex((l) => l.id === leadId);
  if (idx !== -1) {
    current[idx].status = status;
    current[idx].ultimaInteracao = new Date().toISOString();
  }
  saveLeads(current);
  return current;
}

// ── Categories ──
export function getCategories(): { value: string; label: string }[] {
  const lps = loadLandingPages();
  const catMap: Record<string, string> = {
    consignado: "Crédito Consignado",
    financiamento_imoveis: "Financiamento de Imóveis",
    financiamento_veiculos: "Financiamento de Veículos",
    emprestimo_pessoal: "Empréstimo Pessoal",
    consorcio: "Consórcio",
    capital_giro: "Capital de Giro",
    debentures: "Debêntures",
    credito_garantia: "Crédito com Garantia",
    antecipacao_recebiveis: "Antecipação de Recebíveis",
    seguro: "Seguro",
  };
  const cats = new Set<string>();
  lps.forEach((lp) => {
    if (lp.categoria) cats.add(lp.categoria);
  });
  return Array.from(cats).map((c) => ({ value: c, label: catMap[c] || c }));
}

// ── Broker Status ──
export function loadBrokerStates(): BrokerState[] {
  try {
    const stored = localStorage.getItem(BROKER_STATUS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BrokerState[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  // Seed: active corretores = disponivel, inactive = offline
  const initial: BrokerState[] = defaultCorretores.map((c) => ({
    corretorId: c.id,
    status: c.ativo ? "disponivel" : "offline",
  }));
  saveBrokerStates(initial);
  return initial;
}

export function saveBrokerStates(states: BrokerState[]): void {
  try {
    localStorage.setItem(BROKER_STATUS_KEY, JSON.stringify(states));
  } catch {
    // ignore
  }
}

export function updateBrokerStatus(corretorId: string, status: BrokerStatus): BrokerState[] {
  const states = loadBrokerStates();
  const idx = states.findIndex((s) => s.corretorId === corretorId);
  if (idx !== -1) {
    states[idx].status = status;
  } else {
    states.push({ corretorId, status });
  }
  saveBrokerStates(states);
  return states;
}

// ── Queue Assignments ──
export function loadQueue(): QueueAssignment[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QueueAssignment[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveQueue(queue: QueueAssignment[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

// ── Round Robin Index ──
function loadRoundRobinIndex(): number {
  try {
    const stored = localStorage.getItem(ROUND_ROBIN_KEY);
    if (stored) return parseInt(stored, 10) || 0;
  } catch {
    // ignore
  }
  return 0;
}

function saveRoundRobinIndex(idx: number): void {
  try {
    localStorage.setItem(ROUND_ROBIN_KEY, idx.toString());
  } catch {
    // ignore
  }
}

/** Get next available broker via round-robin, skipping the given corretorId */
export function getNextAvailableBroker(skipCorretorId?: string): Corretor | null {
  const brokerStates = loadBrokerStates();
  const available = defaultCorretores.filter((c) => {
    if (skipCorretorId && c.id === skipCorretorId) return false;
    const state = brokerStates.find((s) => s.corretorId === c.id);
    return state?.status === "disponivel";
  });
  if (available.length === 0) return null;

  let idx = loadRoundRobinIndex() % available.length;
  const broker = available[idx];
  idx = (idx + 1) % available.length;
  saveRoundRobinIndex(idx);
  return broker;
}

/** Assign a lead to the next available broker */
export function assignLeadToQueue(leadId: string): QueueAssignment | null {
  const broker = getNextAvailableBroker();
  if (!broker) return null;

  const assignment: QueueAssignment = {
    id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    leadId,
    corretorId: broker.id,
    assignedAt: new Date().toISOString(),
    acceptedAt: null,
    status: "pendente",
    slaSeconds: 600,
  };

  const queue = loadQueue();
  queue.unshift(assignment);
  saveQueue(queue);

  // Mark broker as ocupado
  updateBrokerStatus(broker.id, "ocupado");

  return assignment;
}

/** Accept a queue assignment */
export function acceptAssignment(assignmentId: string): QueueAssignment[] {
  const queue = loadQueue();
  const idx = queue.findIndex((q) => q.id === assignmentId);
  if (idx !== -1) {
    queue[idx].status = "aceito";
    queue[idx].acceptedAt = new Date().toISOString();
  }
  saveQueue(queue);
  return queue;
}

/** Expire an assignment and reassign to next broker */
export function expireAssignment(assignmentId: string): { queue: QueueAssignment[]; newAssignment: QueueAssignment | null } {
  const queue = loadQueue();
  const idx = queue.findIndex((q) => q.id === assignmentId);
  let newAssignment: QueueAssignment | null = null;

  if (idx !== -1) {
    const old = queue[idx];
    queue[idx].status = "expirado";

    // Free the old broker back to disponivel
    updateBrokerStatus(old.corretorId, "disponivel");

    // Reassign to next available broker (skip the one who expired)
    const nextBroker = getNextAvailableBroker(old.corretorId);
    if (nextBroker) {
      newAssignment = {
        id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        leadId: old.leadId,
        corretorId: nextBroker.id,
        assignedAt: new Date().toISOString(),
        acceptedAt: null,
        status: "pendente",
        slaSeconds: 600,
      };
      queue.unshift(newAssignment);
      updateBrokerStatus(nextBroker.id, "ocupado");
    }
  }

  saveQueue(queue);
  return { queue, newAssignment };
}

/** Get all active (pendente) assignments */
export function getActiveAssignments(): QueueAssignment[] {
  return loadQueue().filter((q) => q.status === "pendente");
}

// ── Produtos ──
export function loadProdutos(): Produto[] {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Produto[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  saveProdutos(defaultProdutos);
  return [...defaultProdutos];
}

export function saveProdutos(produtos: Produto[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(produtos));
  } catch {
    // storage full
  }
}

export function addProduto(produto: Produto): Produto[] {
  const current = loadProdutos();
  current.unshift(produto);
  saveProdutos(current);
  return current;
}

export function updateProduto(id: string, updates: Partial<Produto>): Produto[] {
  const current = loadProdutos();
  const idx = current.findIndex((p) => p.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates, atualizadoEm: new Date().toISOString() };
  }
  saveProdutos(current);
  return current;
}

export function deleteProduto(id: string): Produto[] {
  const current = loadProdutos().filter((p) => p.id !== id);
  saveProdutos(current);
  return current;
}

// ── Bancos ──
export function loadBancos(): Banco[] {
  try {
    const stored = localStorage.getItem(BANKS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Banco[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  saveBancos(defaultBancos);
  return [...defaultBancos];
}

export function saveBancos(bancos: Banco[]): void {
  try {
    localStorage.setItem(BANKS_KEY, JSON.stringify(bancos));
  } catch {
    // storage full
  }
}

export function addBanco(banco: Banco): Banco[] {
  const current = loadBancos();
  current.unshift(banco);
  saveBancos(current);
  return current;
}

export function updateBanco(id: string, updates: Partial<Banco>): Banco[] {
  const current = loadBancos();
  const idx = current.findIndex((b) => b.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates };
  }
  saveBancos(current);
  return current;
}

export function deleteBanco(id: string): Banco[] {
  const current = loadBancos().filter((b) => b.id !== id);
  saveBancos(current);
  return current;
}

// ── Parceiros (Bancos & Administradoras) ──
export function loadParceiros(): Parceiro[] {
  try {
    const stored = localStorage.getItem(PARCEIROS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Parceiro[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveParceiros(parceiros: Parceiro[]): void {
  try {
    localStorage.setItem(PARCEIROS_KEY, JSON.stringify(parceiros));
  } catch {
    // storage full
  }
}

export function addParceiro(nome: string, tipo: "banco" | "administradora"): Parceiro[] {
  const current = loadParceiros();
  const parceiro: Parceiro = {
    id: `parc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    nome,
    tipo,
    criadoEm: new Date().toISOString(),
  };
  current.unshift(parceiro);
  saveParceiros(current);
  return current;
}

export function updateParceiro(id: string, updates: Partial<Parceiro>): Parceiro[] {
  const current = loadParceiros();
  const idx = current.findIndex((p) => p.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates };
  }
  saveParceiros(current);
  return current;
}

export function deleteParceiro(id: string): Parceiro[] {
  const current = loadParceiros().filter((p) => p.id !== id);
  saveParceiros(current);
  // Also clean up lead-parceiro associations
  const map = loadLeadParceiros();
  const newMap: Record<string, string> = {};
  for (const [leadId, parceiroId] of Object.entries(map)) {
    if (parceiroId !== id) newMap[leadId] = parceiroId;
  }
  saveLeadParceiros(newMap);
  return current;
}

// ── Lead ↔ Parceiro mapping ──
export function loadLeadParceiros(): Record<string, string> {
  try {
    const stored = localStorage.getItem(LEAD_PARCEIROS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveLeadParceiros(map: Record<string, string>): void {
  try {
    localStorage.setItem(LEAD_PARCEIROS_KEY, JSON.stringify(map));
  } catch {
    // storage full
  }
}

export function setLeadParceiro(leadId: string, parceiroId: string | null): Record<string, string> {
  const map = loadLeadParceiros();
  if (parceiroId) {
    map[leadId] = parceiroId;
  } else {
    delete map[leadId];
  }
  saveLeadParceiros(map);
  return map;
}

// ── Categorias de Afiliados ──
export function loadCategoriasAfiliado(): CategoriaAfiliado[] {
  try {
    const stored = localStorage.getItem(CATEGORIAS_AFILIADOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CategoriaAfiliado[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  saveCategoriasAfiliado(defaultCategoriasAfiliado);
  return [...defaultCategoriasAfiliado];
}

export function saveCategoriasAfiliado(cats: CategoriaAfiliado[]): void {
  try {
    localStorage.setItem(CATEGORIAS_AFILIADOS_KEY, JSON.stringify(cats));
  } catch {
    // storage full
  }
}

export function addCategoriaAfiliado(nome: string, emoji: string): CategoriaAfiliado[] {
  const current = loadCategoriasAfiliado();
  const cat: CategoriaAfiliado = {
    id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    nome,
    emoji,
  };
  current.push(cat);
  saveCategoriasAfiliado(current);
  return current;
}

export function deleteCategoriaAfiliado(id: string): CategoriaAfiliado[] {
  const current = loadCategoriasAfiliado().filter((c) => c.id !== id);
  saveCategoriasAfiliado(current);
  return current;
}

// ── Afiliados ──
export function loadAfiliados(): Afiliado[] {
  try {
    const stored = localStorage.getItem(AFILIADOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Afiliado[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveAfiliados(afiliados: Afiliado[]): void {
  try {
    localStorage.setItem(AFILIADOS_KEY, JSON.stringify(afiliados));
  } catch {
    // storage full
  }
}

export function addAfiliado(afiliado: Omit<Afiliado, "id" | "criadoEm">): Afiliado[] {
  const current = loadAfiliados();
  const novo: Afiliado = {
    ...afiliado,
    id: `afil_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    criadoEm: new Date().toISOString(),
  };
  current.unshift(novo);
  saveAfiliados(current);
  return current;
}

export function updateAfiliado(id: string, updates: Partial<Afiliado>): Afiliado[] {
  const current = loadAfiliados();
  const idx = current.findIndex((a) => a.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates };
  }
  saveAfiliados(current);
  return current;
}

export function deleteAfiliado(id: string): Afiliado[] {
  const current = loadAfiliados().filter((a) => a.id !== id);
  saveAfiliados(current);
  // Clean up lead-afiliado associations
  const map = loadLeadAfiliados();
  const newMap: Record<string, string> = {};
  for (const [leadId, afiliadoId] of Object.entries(map)) {
    if (afiliadoId !== id) newMap[leadId] = afiliadoId;
  }
  saveLeadAfiliados(newMap);
  return current;
}

// ── Lead ↔ Afiliado mapping ──
export function loadLeadAfiliados(): Record<string, string> {
  try {
    const stored = localStorage.getItem(LEAD_AFILIADOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveLeadAfiliados(map: Record<string, string>): void {
  try {
    localStorage.setItem(LEAD_AFILIADOS_KEY, JSON.stringify(map));
  } catch {
    // storage full
  }
}

export function setLeadAfiliado(leadId: string, afiliadoId: string | null): Record<string, string> {
  const map = loadLeadAfiliados();
  if (afiliadoId) {
    map[leadId] = afiliadoId;
  } else {
    delete map[leadId];
  }
  saveLeadAfiliados(map);
  return map;
}

// ── Treinamento Products (Máximo Conceito) ──
const TREINAMENTO_KEY = "leadbank_treinamento_produtos";

export interface TreinamentoProduto {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icone: string;
  links: { id: string; tipo: string; titulo: string; url: string }[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export function loadTreinamentoProdutos(): TreinamentoProduto[] {
  try {
    const stored = localStorage.getItem(TREINAMENTO_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TreinamentoProduto[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveTreinamentoProdutos(items: TreinamentoProduto[]): void {
  try {
    localStorage.setItem(TREINAMENTO_KEY, JSON.stringify(items));
  } catch {
    // storage full
  }
}

export function addTreinamentoProduto(item: Omit<TreinamentoProduto, "id" | "criadoEm" | "atualizadoEm">): TreinamentoProduto[] {
  const current = loadTreinamentoProdutos();
  const novo: TreinamentoProduto = {
    ...item,
    id: `trein_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  current.unshift(novo);
  saveTreinamentoProdutos(current);
  return current;
}

export function updateTreinamentoProduto(id: string, updates: Partial<TreinamentoProduto>): TreinamentoProduto[] {
  const current = loadTreinamentoProdutos();
  const idx = current.findIndex((p) => p.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates, atualizadoEm: new Date().toISOString() };
  }
  saveTreinamentoProdutos(current);
  return current;
}

export function deleteTreinamentoProduto(id: string): TreinamentoProduto[] {
  const current = loadTreinamentoProdutos().filter((p) => p.id !== id);
  saveTreinamentoProdutos(current);
  return current;
}

// ── Access Code Generation ──
export function generateAccessCode(nome: string): string {
  const prefix = nome
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4) || "USER";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CBM-${prefix}-${suffix}`;
}

// ── WhatsApp Template for Afiliados ──
const WHATSAPP_TEMPLATE_KEY = "leadbank_whatsapp_template_afiliado";

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Parabéns {nome_afiliado}! 🎉 Você fez uma indicação e como nosso afiliado isso gera comissão para você. O lead {nome_lead} demonstrou interesse em {produto}. Em breve nossa Gerente de Afiliados Julia entrará em contato com você.";

export function loadWhatsAppTemplate(): string {
  try {
    const stored = localStorage.getItem(WHATSAPP_TEMPLATE_KEY);
    if (stored) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_WHATSAPP_TEMPLATE;
}

export function saveWhatsAppTemplate(template: string): void {
  try {
    localStorage.setItem(WHATSAPP_TEMPLATE_KEY, template);
  } catch {
    // storage full
  }
}
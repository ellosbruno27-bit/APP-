// CentralBankMaximo CRM - Mock Data Store

export type LeadStatus = "novo" | "em_contato" | "simulacao_enviada" | "conversao";
export type LeadPriority = "alto" | "medio" | "baixo";
export type ServiceType =
  | "consignado"
  | "financiamento"
  | "emprestimo_pessoal"
  | "consorcio"
  | "seguro"
  | "abertura_conta"
  | "capital_giro"
  | "financiamento_imoveis"
  | "financiamento_veiculos"
  | "debentures"
  | "credito_garantia"
  | "antecipacao_recebiveis";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj?: string;
  valorPretendido: number;
  servico: ServiceType;
  status: LeadStatus;
  prioridade: LeadPriority;
  landingPageId: string;
  origem: "google_ads" | "facebook_ads" | "rd_station" | "organico";
  scoreEstimado: number;
  relacaoParcelaRenda: number;
  corretorId: string | null;
  criadoEm: string;
  ultimaInteracao: string;
  historico: { data: string; acao: string }[];
}

export interface LandingPage {
  id: string;
  nome: string;
  dominio: string;
  proprietario: string;
  webhookUrl: string;
  templateMensagem: string;
  ativa: boolean;
  cor: string;
  leadsTotal: number;
  conversoes: number;
  categoria?: string;
}

export interface Corretor {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  ativo: boolean;
  leadsAtribuidos: number;
  landingPages: string[];
  /** Unique access code for training portal */
  codigoAcesso?: string;
}

export interface ConfiguracaoMensagem {
  id: string;
  landingPageId: string;
  tipo: "primeiro_contato" | "follow_up" | "simulacao";
  mensagem: string;
}

// Badge colors for landing pages
const LP_COLORS = ["#D4AF37", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4"];

export const landingPages: LandingPage[] = [
  {
    id: "lp1",
    nome: "Crédito Consignado SP",
    dominio: "creditoconsignado-sp.com.br",
    proprietario: "João Silva",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp1",
    templateMensagem: "Olá {nome}, vi que você simulou um crédito consignado de R$ {valor}. Como posso te ajudar?",
    ativa: true,
    cor: LP_COLORS[0],
    leadsTotal: 342,
    conversoes: 87,
    categoria: "consignado",
  },
  {
    id: "lp2",
    nome: "Financiamento Imobiliário RJ",
    dominio: "financiamento-rj.com.br",
    proprietario: "Maria Oliveira",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp2",
    templateMensagem: "Olá {nome}, vi que você tem interesse em financiamento imobiliário de R$ {valor}. Vamos conversar?",
    ativa: true,
    cor: LP_COLORS[1],
    leadsTotal: 215,
    conversoes: 52,
    categoria: "financiamento_imoveis",
  },
  {
    id: "lp3",
    nome: "Consórcio Nacional",
    dominio: "consorcionacional.com.br",
    proprietario: "Carlos Santos",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp3",
    templateMensagem: "Olá {nome}, vi que você simulou um consórcio de R$ {valor}. Posso te ajudar com as melhores condições!",
    ativa: true,
    cor: LP_COLORS[2],
    leadsTotal: 178,
    conversoes: 41,
    categoria: "consorcio",
  },
  {
    id: "lp4",
    nome: "Empréstimo Pessoal MG",
    dominio: "emprestimopessoal-mg.com.br",
    proprietario: "Ana Costa",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp4",
    templateMensagem: "Olá {nome}, vi que você precisa de um empréstimo de R$ {valor}. Vamos encontrar a melhor taxa!",
    ativa: false,
    cor: LP_COLORS[3],
    leadsTotal: 95,
    conversoes: 18,
    categoria: "emprestimo_pessoal",
  },
  {
    id: "lp5",
    nome: "Seguro de Vida Premium",
    dominio: "seguropremium.com.br",
    proprietario: "João Silva",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp5",
    templateMensagem: "Olá {nome}, vi que você tem interesse em seguro de vida. Posso apresentar as melhores opções!",
    ativa: true,
    cor: LP_COLORS[4],
    leadsTotal: 128,
    conversoes: 34,
    categoria: "seguro",
  },
  {
    id: "lp6",
    nome: "Capital de Giro Empresarial",
    dominio: "capitaldegiro.com.br",
    proprietario: "Roberto Lima",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp6",
    templateMensagem: "Olá {nome}, vi que sua empresa precisa de capital de giro de R$ {valor}. Vamos analisar as melhores opções!",
    ativa: true,
    cor: LP_COLORS[5],
    leadsTotal: 89,
    conversoes: 22,
    categoria: "capital_giro",
  },
  {
    id: "lp7",
    nome: "Financiamento de Veículos",
    dominio: "financiamentoveiculos.com.br",
    proprietario: "Maria Oliveira",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp7",
    templateMensagem: "Olá {nome}, vi que você tem interesse em financiamento de veículo de R$ {valor}. Posso te ajudar!",
    ativa: true,
    cor: LP_COLORS[6],
    leadsTotal: 156,
    conversoes: 38,
    categoria: "financiamento_veiculos",
  },
  {
    id: "lp8",
    nome: "Debêntures & Renda Fixa",
    dominio: "debentures-invest.com.br",
    proprietario: "Carlos Santos",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp8",
    templateMensagem: "Olá {nome}, vi que você tem interesse em debêntures de R$ {valor}. Vamos conversar sobre as melhores oportunidades!",
    ativa: true,
    cor: LP_COLORS[7],
    leadsTotal: 64,
    conversoes: 15,
    categoria: "debentures",
  },
  {
    id: "lp9",
    nome: "Crédito com Garantia",
    dominio: "creditogarantia.com.br",
    proprietario: "Ana Costa",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp9",
    templateMensagem: "Olá {nome}, vi que você tem interesse em crédito com garantia de R$ {valor}. Posso te ajudar com as melhores taxas!",
    ativa: true,
    cor: "#0EA5E9",
    leadsTotal: 112,
    conversoes: 29,
    categoria: "credito_garantia",
  },
  {
    id: "lp10",
    nome: "Antecipação de Recebíveis",
    dominio: "antecipacaoreceb.com.br",
    proprietario: "Roberto Lima",
    webhookUrl: "https://api.centralbankmaximo.com/webhook/lp10",
    templateMensagem: "Olá {nome}, vi que sua empresa precisa de antecipação de recebíveis de R$ {valor}. Vamos analisar!",
    ativa: true,
    cor: "#A855F7",
    leadsTotal: 73,
    conversoes: 19,
    categoria: "antecipacao_recebiveis",
  },
];

export const corretores: Corretor[] = [
  { id: "c1", nome: "Pedro Almeida", telefone: "(11) 99999-1111", email: "pedro@centralbankmaximo.com", ativo: true, leadsAtribuidos: 45, landingPages: ["lp1", "lp2"] },
  { id: "c2", nome: "Juliana Ferreira", telefone: "(11) 99999-2222", email: "juliana@centralbankmaximo.com", ativo: true, leadsAtribuidos: 42, landingPages: ["lp1", "lp3"] },
  { id: "c3", nome: "Rafael Mendes", telefone: "(21) 99999-3333", email: "rafael@centralbankmaximo.com", ativo: true, leadsAtribuidos: 38, landingPages: ["lp2", "lp5"] },
  { id: "c4", nome: "Camila Rocha", telefone: "(31) 99999-4444", email: "camila@centralbankmaximo.com", ativo: false, leadsAtribuidos: 20, landingPages: ["lp4"] },
];

const servicoLabels: Record<ServiceType, string> = {
  consignado: "Crédito Consignado",
  financiamento: "Financiamento Imobiliário",
  emprestimo_pessoal: "Empréstimo Pessoal",
  consorcio: "Consórcio",
  seguro: "Seguro",
  abertura_conta: "Abertura de Conta",
  capital_giro: "Capital de Giro",
  financiamento_imoveis: "Financiamento de Imóveis",
  financiamento_veiculos: "Financiamento de Veículos",
  debentures: "Debêntures",
  credito_garantia: "Crédito com Garantia",
  antecipacao_recebiveis: "Antecipação de Recebíveis",
};

const origemLabels: Record<string, string> = {
  google_ads: "Google Ads",
  facebook_ads: "Facebook Ads",
  rd_station: "RD Station",
  organico: "Orgânico",
};

const statusLabels: Record<LeadStatus, string> = {
  novo: "Novo Lead",
  em_contato: "Em Contato",
  simulacao_enviada: "Simulação Enviada",
  conversao: "Conversão",
};

const prioridadeLabels: Record<LeadPriority, string> = {
  alto: "Alto Padrão",
  medio: "Médio",
  baixo: "Baixo",
};

export { servicoLabels, origemLabels, statusLabels, prioridadeLabels };

export const leads: Lead[] = [
  {
    id: "lead1",
    nome: "Roberto Nascimento",
    telefone: "(11) 98765-4321",
    email: "roberto@email.com",
    cpfCnpj: "123.456.789-00",
    valorPretendido: 150000,
    servico: "consignado",
    status: "novo",
    prioridade: "alto",
    landingPageId: "lp1",
    origem: "google_ads",
    scoreEstimado: 820,
    relacaoParcelaRenda: 0.25,
    corretorId: null,
    criadoEm: "2026-03-25T10:30:00",
    ultimaInteracao: "2026-03-25T10:30:00",
    historico: [{ data: "2026-03-25T10:30:00", acao: "Lead capturado via Google Ads" }],
  },
  {
    id: "lead2",
    nome: "Fernanda Lima",
    telefone: "(21) 97654-3210",
    email: "fernanda@email.com",
    cpfCnpj: "987.654.321-00",
    valorPretendido: 450000,
    servico: "financiamento",
    status: "em_contato",
    prioridade: "alto",
    landingPageId: "lp2",
    origem: "facebook_ads",
    scoreEstimado: 780,
    relacaoParcelaRenda: 0.30,
    corretorId: "c3",
    criadoEm: "2026-03-25T09:15:00",
    ultimaInteracao: "2026-03-25T11:00:00",
    historico: [
      { data: "2026-03-25T09:15:00", acao: "Lead capturado via Facebook Ads" },
      { data: "2026-03-25T09:20:00", acao: "Atribuído ao corretor Rafael Mendes" },
      { data: "2026-03-25T11:00:00", acao: "Contato realizado via WhatsApp" },
    ],
  },
  {
    id: "lead3",
    nome: "Marcos Pereira",
    telefone: "(31) 96543-2109",
    email: "marcos@email.com",
    cpfCnpj: "456.789.123-00",
    valorPretendido: 80000,
    servico: "consorcio",
    status: "simulacao_enviada",
    prioridade: "medio",
    landingPageId: "lp3",
    origem: "rd_station",
    scoreEstimado: 650,
    relacaoParcelaRenda: 0.20,
    corretorId: "c2",
    criadoEm: "2026-03-24T14:00:00",
    ultimaInteracao: "2026-03-25T08:30:00",
    historico: [
      { data: "2026-03-24T14:00:00", acao: "Lead capturado via RD Station" },
      { data: "2026-03-24T14:10:00", acao: "Atribuído à corretora Juliana Ferreira" },
      { data: "2026-03-24T15:00:00", acao: "Contato realizado via WhatsApp" },
      { data: "2026-03-25T08:30:00", acao: "Simulação enviada por e-mail" },
    ],
  },
  {
    id: "lead4",
    nome: "Luciana Barbosa",
    telefone: "(11) 95432-1098",
    email: "luciana@email.com",
    cpfCnpj: "321.654.987-00",
    valorPretendido: 35000,
    servico: "emprestimo_pessoal",
    status: "conversao",
    prioridade: "medio",
    landingPageId: "lp1",
    origem: "google_ads",
    scoreEstimado: 720,
    relacaoParcelaRenda: 0.15,
    corretorId: "c1",
    criadoEm: "2026-03-23T16:45:00",
    ultimaInteracao: "2026-03-25T14:00:00",
    historico: [
      { data: "2026-03-23T16:45:00", acao: "Lead capturado via Google Ads" },
      { data: "2026-03-23T17:00:00", acao: "Atribuído ao corretor Pedro Almeida" },
      { data: "2026-03-23T17:30:00", acao: "Contato realizado via WhatsApp" },
      { data: "2026-03-24T10:00:00", acao: "Simulação enviada" },
      { data: "2026-03-25T14:00:00", acao: "Contrato fechado! 🎉" },
    ],
  },
  {
    id: "lead5",
    nome: "André Souza",
    telefone: "(21) 94321-0987",
    email: "andre@email.com",
    cpfCnpj: "654.321.987-00",
    valorPretendido: 200000,
    servico: "financiamento",
    status: "novo",
    prioridade: "alto",
    landingPageId: "lp2",
    origem: "facebook_ads",
    scoreEstimado: 800,
    relacaoParcelaRenda: 0.28,
    corretorId: null,
    criadoEm: "2026-03-25T11:45:00",
    ultimaInteracao: "2026-03-25T11:45:00",
    historico: [{ data: "2026-03-25T11:45:00", acao: "Lead capturado via Facebook Ads" }],
  },
  {
    id: "lead6",
    nome: "Patricia Gomes",
    telefone: "(11) 93210-9876",
    email: "patricia@email.com",
    cpfCnpj: "12.345.678/0001-90",
    valorPretendido: 500000,
    servico: "consorcio",
    status: "em_contato",
    prioridade: "alto",
    landingPageId: "lp3",
    origem: "google_ads",
    scoreEstimado: 850,
    relacaoParcelaRenda: 0.22,
    corretorId: "c2",
    criadoEm: "2026-03-25T08:00:00",
    ultimaInteracao: "2026-03-25T10:15:00",
    historico: [
      { data: "2026-03-25T08:00:00", acao: "Lead capturado via Google Ads" },
      { data: "2026-03-25T08:05:00", acao: "Atribuído à corretora Juliana Ferreira" },
      { data: "2026-03-25T10:15:00", acao: "Contato realizado via WhatsApp" },
    ],
  },
  {
    id: "lead7",
    nome: "Diego Martins",
    telefone: "(31) 92109-8765",
    email: "diego@email.com",
    cpfCnpj: "789.123.456-00",
    valorPretendido: 25000,
    servico: "emprestimo_pessoal",
    status: "novo",
    prioridade: "baixo",
    landingPageId: "lp4",
    origem: "organico",
    scoreEstimado: 520,
    relacaoParcelaRenda: 0.35,
    corretorId: null,
    criadoEm: "2026-03-25T12:00:00",
    ultimaInteracao: "2026-03-25T12:00:00",
    historico: [{ data: "2026-03-25T12:00:00", acao: "Lead capturado via tráfego orgânico" }],
  },
  {
    id: "lead8",
    nome: "Isabela Rodrigues",
    telefone: "(11) 91098-7654",
    email: "isabela@email.com",
    cpfCnpj: "234.567.890-00",
    valorPretendido: 120000,
    servico: "seguro",
    status: "simulacao_enviada",
    prioridade: "medio",
    landingPageId: "lp5",
    origem: "facebook_ads",
    scoreEstimado: 700,
    relacaoParcelaRenda: 0.18,
    corretorId: "c3",
    criadoEm: "2026-03-24T11:30:00",
    ultimaInteracao: "2026-03-25T09:00:00",
    historico: [
      { data: "2026-03-24T11:30:00", acao: "Lead capturado via Facebook Ads" },
      { data: "2026-03-24T12:00:00", acao: "Atribuído ao corretor Rafael Mendes" },
      { data: "2026-03-24T14:00:00", acao: "Contato realizado via WhatsApp" },
      { data: "2026-03-25T09:00:00", acao: "Simulação de seguro enviada" },
    ],
  },
  {
    id: "lead9",
    nome: "Thiago Alves",
    telefone: "(21) 90987-6543",
    email: "thiago@email.com",
    cpfCnpj: "567.890.123-00",
    valorPretendido: 300000,
    servico: "financiamento",
    status: "conversao",
    prioridade: "alto",
    landingPageId: "lp2",
    origem: "google_ads",
    scoreEstimado: 880,
    relacaoParcelaRenda: 0.20,
    corretorId: "c3",
    criadoEm: "2026-03-22T09:00:00",
    ultimaInteracao: "2026-03-25T16:00:00",
    historico: [
      { data: "2026-03-22T09:00:00", acao: "Lead capturado via Google Ads" },
      { data: "2026-03-22T09:10:00", acao: "Atribuído ao corretor Rafael Mendes" },
      { data: "2026-03-22T10:00:00", acao: "Contato realizado via WhatsApp" },
      { data: "2026-03-23T11:00:00", acao: "Simulação enviada" },
      { data: "2026-03-24T15:00:00", acao: "Documentação recebida" },
      { data: "2026-03-25T16:00:00", acao: "Financiamento aprovado! 🎉" },
    ],
  },
  {
    id: "lead10",
    nome: "Vanessa Cruz",
    telefone: "(11) 89876-5432",
    email: "vanessa@email.com",
    cpfCnpj: "890.123.456-00",
    valorPretendido: 60000,
    servico: "consignado",
    status: "em_contato",
    prioridade: "medio",
    landingPageId: "lp1",
    origem: "rd_station",
    scoreEstimado: 680,
    relacaoParcelaRenda: 0.25,
    corretorId: "c1",
    criadoEm: "2026-03-25T07:30:00",
    ultimaInteracao: "2026-03-25T09:45:00",
    historico: [
      { data: "2026-03-25T07:30:00", acao: "Lead capturado via RD Station" },
      { data: "2026-03-25T07:35:00", acao: "Atribuído ao corretor Pedro Almeida" },
      { data: "2026-03-25T09:45:00", acao: "Contato realizado via WhatsApp" },
    ],
  },
];

export const configuracoesMensagem: ConfiguracaoMensagem[] = [
  { id: "msg1", landingPageId: "lp1", tipo: "primeiro_contato", mensagem: "Olá {nome}, vi que você simulou um crédito consignado de R$ {valor} agora pouco. Como posso te ajudar?" },
  { id: "msg2", landingPageId: "lp2", tipo: "primeiro_contato", mensagem: "Olá {nome}, vi que você tem interesse em financiamento imobiliário de R$ {valor}. Vamos conversar?" },
  { id: "msg3", landingPageId: "lp3", tipo: "primeiro_contato", mensagem: "Olá {nome}, vi que você simulou um consórcio de R$ {valor}. Posso te ajudar com as melhores condições!" },
  { id: "msg4", landingPageId: "lp1", tipo: "follow_up", mensagem: "Oi {nome}, tudo bem? Estou entrando em contato novamente sobre o crédito consignado. Posso te ajudar?" },
  { id: "msg5", landingPageId: "lp2", tipo: "simulacao", mensagem: "Olá {nome}, segue a simulação do seu financiamento imobiliário de R$ {valor}. Qualquer dúvida, estou à disposição!" },
];

/** Category badge configuration for the 9 product categories */
export interface CategoryBadge {
  label: string;
  bgColor: string;
  textColor: string;
}

const categoryBadgeMap: Record<string, CategoryBadge> = {
  financiamento_imoveis: { label: "Alta conversão", bgColor: "rgba(34,197,94,0.15)", textColor: "#22C55E" },
  consorcio: { label: "Ticket alto", bgColor: "rgba(212,175,55,0.15)", textColor: "#D4AF37" },
  emprestimo_pessoal: { label: "Volume alto", bgColor: "rgba(139,92,246,0.15)", textColor: "#8B5CF6" },
  capital_giro: { label: "Empresarial", bgColor: "rgba(236,72,153,0.15)", textColor: "#EC4899" },
  financiamento_veiculos: { label: "Frotas & PF", bgColor: "rgba(20,184,166,0.15)", textColor: "#14B8A6" },
  debentures: { label: "Renda Fixa", bgColor: "rgba(249,115,22,0.15)", textColor: "#F97316" },
  credito_garantia: { label: "Garantido", bgColor: "rgba(14,165,233,0.15)", textColor: "#0EA5E9" },
  antecipacao_recebiveis: { label: "Antecipação", bgColor: "rgba(168,85,247,0.15)", textColor: "#A855F7" },
  consignado: { label: "Consignado", bgColor: "rgba(212,175,55,0.10)", textColor: "#D4AF37" },
  seguro: { label: "Proteção", bgColor: "rgba(59,130,246,0.15)", textColor: "#3B82F6" },
};

export function getCategoryBadge(lp: LandingPage): CategoryBadge | null {
  if (lp.categoria && categoryBadgeMap[lp.categoria]) {
    return categoryBadgeMap[lp.categoria];
  }
  // Fallback: match by name
  const nome = lp.nome.toLowerCase();
  if (nome.includes("imobiliári") || nome.includes("financiamento imob")) return categoryBadgeMap.financiamento_imoveis;
  if (nome.includes("consórcio")) return categoryBadgeMap.consorcio;
  if (nome.includes("empréstimo") || nome.includes("emprestimo")) return categoryBadgeMap.emprestimo_pessoal;
  if (nome.includes("capital de giro")) return categoryBadgeMap.capital_giro;
  if (nome.includes("veículo") || nome.includes("veiculo")) return categoryBadgeMap.financiamento_veiculos;
  if (nome.includes("debênture") || nome.includes("debenture")) return categoryBadgeMap.debentures;
  if (nome.includes("garantia")) return categoryBadgeMap.credito_garantia;
  if (nome.includes("antecipação") || nome.includes("antecipacao")) return categoryBadgeMap.antecipacao_recebiveis;
  return null;
}

// Helper functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

export function getLandingPageById(id: string): LandingPage | undefined {
  return landingPages.find((lp) => lp.id === id);
}

export function getCorretorById(id: string): Corretor | undefined {
  return corretores.find((c) => c.id === id);
}

export function getWhatsAppLink(lead: Lead): string {
  const lp = getLandingPageById(lead.landingPageId);
  const phone = lead.telefone.replace(/\D/g, "");
  const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;
  let message = lp?.templateMensagem || "Olá {nome}, como posso te ajudar?";
  message = message.replace("{nome}", lead.nome).replace("{valor}", formatCurrency(lead.valorPretendido));
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

export function getScoreColor(score: number): string {
  if (score >= 800) return "#D4AF37";
  if (score >= 650) return "#3B82F6";
  if (score >= 500) return "#F59E0B";
  return "#EF4444";
}

export function getStatusColor(status: LeadStatus): string {
  switch (status) {
    case "novo": return "#3B82F6";
    case "em_contato": return "#F59E0B";
    case "simulacao_enviada": return "#8B5CF6";
    case "conversao": return "#D4AF37";
  }
}

export function getPrioridadeColor(prioridade: LeadPriority): string {
  switch (prioridade) {
    case "alto": return "#EF4444";
    case "medio": return "#F59E0B";
    case "baixo": return "#94A3B8";
  }
}

/** Product types for landing page forms */
export const productTypes = [
  { value: "consignado", label: "Crédito Consignado" },
  { value: "financiamento_imoveis", label: "Financiamento de Imóveis" },
  { value: "financiamento_veiculos", label: "Financiamento de Veículos" },
  { value: "emprestimo_pessoal", label: "Empréstimo Pessoal" },
  { value: "consorcio", label: "Consórcio" },
  { value: "capital_giro", label: "Capital de Giro" },
  { value: "debentures", label: "Debêntures" },
  { value: "credito_garantia", label: "Crédito com Garantia" },
  { value: "antecipacao_recebiveis", label: "Antecipação de Recebíveis" },
  { value: "seguro", label: "Seguro" },
  { value: "abertura_conta", label: "Abertura de Conta" },
];

/** Lead origins */
export const leadOrigins = [
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "rd_station", label: "RD Station" },
  { value: "organico", label: "Orgânico" },
];

// ── Afiliados (Agentes Indicadores) ──
export interface CategoriaAfiliado {
  id: string;
  nome: string;
  emoji: string;
}

export const defaultCategoriasAfiliado: CategoriaAfiliado[] = [
  { id: "cat_contadores", nome: "Contadores", emoji: "🧮" },
  { id: "cat_imobiliarias", nome: "Imobiliárias", emoji: "🏠" },
  { id: "cat_advogados", nome: "Advogados Empresariais", emoji: "⚖️" },
  { id: "cat_despachantes", nome: "Despachantes", emoji: "📄" },
  { id: "cat_concessionarias", nome: "Concessionárias", emoji: "🚗" },
  { id: "cat_energia_solar", nome: "Empresas de Energia Solar", emoji: "☀️" },
  { id: "cat_corretores_imoveis", nome: "Corretores de Imóveis", emoji: "🏡" },
  { id: "cat_adm_condominio", nome: "Administradoras de Condomínio", emoji: "🏢" },
];

export interface Afiliado {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  categoriaId: string;
  ativo: boolean;
  criadoEm: string;
  /** Simple access code for the affiliate portal (4-6 digits) */
  codigoAcesso?: string;
}

// ── Parceiros (Bancos & Administradoras de Consórcio) ──
export interface Parceiro {
  id: string;
  nome: string;
  tipo: "banco" | "administradora";
  criadoEm: string;
}

// ── Bancos Parceiros ──
export interface Banco {
  id: string;
  nome: string;
  cor: string; // accent color for the bank
  ativo: boolean;
  criadoEm: string;
}

const BANK_COLORS = ["#0066CC", "#CC2229", "#FF6600", "#EE1D23", "#FFCC00", "#00A651", "#7B2D8E", "#003DA5"];

export const defaultBancos: Banco[] = [
  { id: "bank1", nome: "Caixa Econômica Federal", cor: BANK_COLORS[0], ativo: true, criadoEm: "2026-03-20T10:00:00" },
  { id: "bank2", nome: "Bradesco", cor: BANK_COLORS[1], ativo: true, criadoEm: "2026-03-20T10:00:00" },
  { id: "bank3", nome: "Itaú Unibanco", cor: BANK_COLORS[2], ativo: true, criadoEm: "2026-03-20T10:00:00" },
  { id: "bank4", nome: "Santander", cor: BANK_COLORS[3], ativo: true, criadoEm: "2026-03-20T10:00:00" },
  { id: "bank5", nome: "Banco do Brasil", cor: BANK_COLORS[4], ativo: true, criadoEm: "2026-03-20T10:00:00" },
  { id: "bank6", nome: "Banco Inter", cor: BANK_COLORS[5], ativo: true, criadoEm: "2026-03-20T10:00:00" },
];

// ── Produtos ──
export type ProductCategory =
  | "consorcio"
  | "financiamento"
  | "emprestimo"
  | "capital_giro"
  | "seguro"
  | "previdencia"
  | "cambio"
  | "cartao"
  | "investimento";

export const productCategoryLabels: Record<ProductCategory, string> = {
  consorcio: "Consórcio",
  financiamento: "Financiamento",
  emprestimo: "Empréstimo",
  capital_giro: "Capital de Giro",
  seguro: "Seguro",
  previdencia: "Previdência",
  cambio: "Câmbio",
  cartao: "Cartão",
  investimento: "Investimento",
};

export const productCategoryColors: Record<ProductCategory, { bg: string; text: string }> = {
  consorcio: { bg: "rgba(212,175,55,0.15)", text: "#D4AF37" },
  financiamento: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  emprestimo: { bg: "rgba(139,92,246,0.15)", text: "#8B5CF6" },
  capital_giro: { bg: "rgba(236,72,153,0.15)", text: "#EC4899" },
  seguro: { bg: "rgba(20,184,166,0.15)", text: "#14B8A6" },
  previdencia: { bg: "rgba(249,115,22,0.15)", text: "#F97316" },
  cambio: { bg: "rgba(14,165,233,0.15)", text: "#0EA5E9" },
  cartao: { bg: "rgba(168,85,247,0.15)", text: "#A855F7" },
  investimento: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
};

export interface ProdutoConteudo {
  ebookUrl: string;
  videoUrl: string;
  explicacaoUrl: string;
}

export type ConteudoLinkTipo = "ebook" | "video" | "explicacao" | "landing_page" | "outro";

export interface ConteudoLink {
  id: string;
  tipo: ConteudoLinkTipo;
  titulo: string;
  url: string;
}

export const conteudoLinkTipoLabels: Record<ConteudoLinkTipo, string> = {
  ebook: "📖 Ebook",
  video: "🎥 Vídeo",
  explicacao: "📄 Explicação",
  landing_page: "🌐 Landing Page",
  outro: "🔗 Outro",
};

export const conteudoLinkTipoColors: Record<ConteudoLinkTipo, { bg: string; text: string }> = {
  ebook: { bg: "rgba(34,197,94,0.10)", text: "#22C55E" },
  video: { bg: "rgba(239,68,68,0.10)", text: "#EF4444" },
  explicacao: { bg: "rgba(59,130,246,0.10)", text: "#3B82F6" },
  landing_page: { bg: "rgba(212,175,55,0.10)", text: "#D4AF37" },
  outro: { bg: "rgba(148,163,184,0.10)", text: "#94A3B8" },
};

export interface Produto {
  id: string;
  bancoId: string;
  nome: string;
  categoria: ProductCategory;
  valorMin: number | null;
  valorMax: number | null;
  descricao: string;
  taxa: number | null; // percentage
  prazo: string; // e.g. "12 a 60 meses"
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  /** Training content URLs (Máximo Conceito) - legacy */
  conteudo?: ProdutoConteudo;
  /** Dynamic training links (Máximo Conceito) */
  conteudoLinks?: ConteudoLink[];
}

export const defaultProdutos: Produto[] = [
  {
    id: "prod1",
    bancoId: "bank1",
    nome: "Financiamento de Imóvel",
    categoria: "financiamento",
    valorMin: 100000,
    valorMax: 1500000,
    descricao: "Financiamento habitacional com as melhores taxas do mercado.",
    taxa: 6.5,
    prazo: "120 a 420 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
  {
    id: "prod2",
    bancoId: "bank1",
    nome: "Consórcio Imobiliário",
    categoria: "consorcio",
    valorMin: 50000,
    valorMax: 500000,
    descricao: "Consórcio para aquisição de imóveis residenciais e comerciais.",
    taxa: 0.5,
    prazo: "60 a 200 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
  {
    id: "prod3",
    bancoId: "bank2",
    nome: "Empréstimo Pessoal",
    categoria: "emprestimo",
    valorMin: 1000,
    valorMax: 100000,
    descricao: "Crédito pessoal com aprovação rápida e sem garantia.",
    taxa: 2.5,
    prazo: "6 a 60 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
  {
    id: "prod4",
    bancoId: "bank2",
    nome: "Financiamento de Veículos",
    categoria: "financiamento",
    valorMin: 20000,
    valorMax: 300000,
    descricao: "Financiamento de veículos novos e seminovos.",
    taxa: 1.2,
    prazo: "12 a 60 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
  {
    id: "prod5",
    bancoId: "bank3",
    nome: "Capital de Giro",
    categoria: "capital_giro",
    valorMin: 10000,
    valorMax: 1000000,
    descricao: "Crédito para empresas com taxas competitivas.",
    taxa: 1.8,
    prazo: "6 a 48 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
  {
    id: "prod6",
    bancoId: "bank4",
    nome: "Seguro Residencial",
    categoria: "seguro",
    valorMin: 500,
    valorMax: 5000,
    descricao: "Proteção completa para seu imóvel.",
    taxa: null,
    prazo: "12 meses",
    ativo: true,
    criadoEm: "2026-03-20T10:00:00",
    atualizadoEm: "2026-03-20T10:00:00",
  },
];
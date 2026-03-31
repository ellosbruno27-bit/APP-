import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Afiliado, CategoriaAfiliado, Lead, ServiceType, Produto, ConteudoLink, ConteudoLinkTipo } from "@/lib/data";
import {
  landingPages,
  productTypes,
  leadOrigins,
  formatCurrency,
  formatDateShort,
  servicoLabels,
  statusLabels,
  getStatusColor,
  getPrioridadeColor,
} from "@/lib/data";
import {
  loadAfiliados,
  loadCategoriasAfiliado,
  loadProdutos,
  loadLeads,
  loadLeadAfiliados,
  addLead,
  setLeadAfiliado,
  loadWhatsAppTemplate,
  loadTreinamentoProdutos,
} from "@/lib/store";
import type { TreinamentoProduto } from "@/lib/store";
import { conteudoLinkTipoLabels, conteudoLinkTipoColors } from "@/lib/data";
import {
  Zap,
  LogOut,
  Send,
  Package,
  MessageCircle,
  Check,
  Clock,
  TrendingUp,
  User,
  Phone,
  Mail,
  FileText,
  Eye,
  Plus,
  Handshake,
  Lock,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Video,
  ExternalLink,
  Key,
  Copy,
} from "lucide-react";

const PORTAL_SESSION_KEY = "leadbank_portal_afiliado_session";

interface LeadFormState {
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  valorPretendido: string;
  servico: ServiceType | "";
  produtoId: string;
  prioridade: "alto" | "medio" | "baixo";
  landingPageId: string;
  origem: "google_ads" | "facebook_ads" | "rd_station" | "organico";
}

const emptyLeadForm: LeadFormState = {
  nome: "",
  telefone: "",
  email: "",
  cpfCnpj: "",
  valorPretendido: "",
  servico: "",
  produtoId: "",
  prioridade: "medio",
  landingPageId: landingPages[0]?.id || "",
  origem: "organico",
};

type PortalTab = "meus_leads" | "novo_lead" | "treinamento";

export default function PortalAfiliado() {
  const navigate = useNavigate();

  // Auth state
  const [loggedInAfiliadoId, setLoggedInAfiliadoId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PORTAL_SESSION_KEY) || null;
    } catch {
      return null;
    }
  });

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCodigo, setLoginCodigo] = useState("");
  const [loginError, setLoginError] = useState("");

  // Portal state
  const [activeTab, setActiveTab] = useState<PortalTab>("meus_leads");
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [lastCreatedLead, setLastCreatedLead] = useState<{ lead: Lead; produtoNome: string } | null>(null);

  // Data
  const afiliados = useMemo(() => loadAfiliados(), []);
  const categorias = useMemo(() => loadCategoriasAfiliado(), []);
  const produtos = useMemo(() => loadProdutos(), []);

  const loggedAfiliado = useMemo(
    () => afiliados.find((a) => a.id === loggedInAfiliadoId) || null,
    [afiliados, loggedInAfiliadoId]
  );

  const getCatById = useCallback(
    (id: string) => categorias.find((c) => c.id === id),
    [categorias]
  );

  // Get only leads belonging to this affiliate
  const meusLeads = useMemo(() => {
    if (!loggedInAfiliadoId) return [];
    const leadAfiliadoMap = loadLeadAfiliados();
    const allLeads = loadLeads();
    const myLeadIds = new Set(
      Object.entries(leadAfiliadoMap)
        .filter(([, aId]) => aId === loggedInAfiliadoId)
        .map(([leadId]) => leadId)
    );
    return allLeads.filter((l) => myLeadIds.has(l.id));
  }, [loggedInAfiliadoId, lastCreatedLead]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const totalLeads = meusLeads.length;
  const leadsNovos = meusLeads.filter((l) => l.status === "novo").length;
  const leadsEmContato = meusLeads.filter((l) => l.status === "em_contato").length;
  const leadsConvertidos = meusLeads.filter((l) => l.status === "conversao").length;

  // ── Login ──
  const handleLogin = () => {
    setLoginError("");
    const email = loginEmail.trim().toLowerCase();
    const codigo = loginCodigo.trim();

    if (!email) {
      setLoginError("Digite seu e-mail cadastrado.");
      return;
    }

    const afiliado = afiliados.find(
      (a) => a.email.toLowerCase() === email && a.ativo
    );

    if (!afiliado) {
      setLoginError("E-mail não encontrado ou afiliado inativo.");
      return;
    }

    // If affiliate has an access code, check it
    if (afiliado.codigoAcesso && afiliado.codigoAcesso !== codigo) {
      setLoginError("Código de acesso incorreto.");
      return;
    }

    // Login success
    setLoggedInAfiliadoId(afiliado.id);
    try {
      sessionStorage.setItem(PORTAL_SESSION_KEY, afiliado.id);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setLoggedInAfiliadoId(null);
    try {
      sessionStorage.removeItem(PORTAL_SESSION_KEY);
    } catch {
      // ignore
    }
    setLoginEmail("");
    setLoginCodigo("");
    setLoginError("");
  };

  // ── Lead Registration ──
  const updateLeadField = <K extends keyof LeadFormState>(field: K, value: LeadFormState[K]) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterLead = () => {
    if (!loggedAfiliado || !leadForm.nome.trim() || !leadForm.telefone.trim() || !leadForm.servico) return;

    const produto = produtos.find((p) => p.id === leadForm.produtoId);

    const newLead: Lead = {
      id: `lead_afil_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nome: leadForm.nome.trim(),
      telefone: leadForm.telefone.trim(),
      email: leadForm.email.trim(),
      cpfCnpj: leadForm.cpfCnpj.trim() || undefined,
      valorPretendido: parseFloat(leadForm.valorPretendido) || 0,
      servico: leadForm.servico as ServiceType,
      status: "novo",
      prioridade: leadForm.prioridade,
      landingPageId: leadForm.landingPageId,
      origem: leadForm.origem,
      scoreEstimado: 600,
      relacaoParcelaRenda: 0.25,
      corretorId: null,
      criadoEm: new Date().toISOString(),
      ultimaInteracao: new Date().toISOString(),
      historico: [
        {
          data: new Date().toISOString(),
          acao: `Lead indicado pelo afiliado ${loggedAfiliado.nome}${produto ? ` — Produto: ${produto.nome}` : ""}`,
        },
      ],
    };

    addLead(newLead);
    setLeadAfiliado(newLead.id, loggedAfiliado.id);

    setLastCreatedLead({
      lead: newLead,
      produtoNome: produto?.nome || (productTypes.find((pt) => pt.value === leadForm.servico)?.label || ""),
    });

    setLeadForm(emptyLeadForm);
    setActiveTab("meus_leads");
  };

  const buildWhatsAppUrl = (leadNome: string, produtoNome: string): string => {
    if (!loggedAfiliado) return "#";
    const template = loadWhatsAppTemplate();
    const phone = loggedAfiliado.telefone.replace(/\D/g, "");
    const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;
    const message = template
      .replace(/{nome_afiliado}/g, loggedAfiliado.nome)
      .replace(/{nome_lead}/g, leadNome)
      .replace(/{produto}/g, produtoNome);
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  // ════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════
  if (!loggedAfiliado) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#8B5CF6]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Handshake size={32} className="text-[#0F172A]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Portal do Afiliado</h1>
            <p className="text-sm text-[#94A3B8] mt-1">CentralBankMaximo CRM — Área Exclusiva</p>
          </div>

          {/* Login Card */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-medium">
              <Lock size={16} />
              Acesso Restrito
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Código de Acesso (opcional)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={loginCodigo}
                    onChange={(e) => { setLoginCodigo(e.target.value); setLoginError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
              </div>

              {loginError && (
                <div className="px-4 py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-xs text-[#EF4444]">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C4A030] hover:from-[#E5C040] hover:to-[#D4AF37] text-[#0F172A] font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                Entrar no Portal
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Back to CRM */}
          <div className="text-center">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-[#94A3B8] hover:text-[#D4AF37] transition-colors"
            >
              ← Voltar para o CRM Administrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // AFFILIATE PORTAL (LOGGED IN)
  // ════════════════════════════════════════════
  const cat = getCatById(loggedAfiliado.categoriaId);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-xl border-b border-[#1E293B]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Portal do Afiliado</h1>
              <p className="text-[10px] text-[#94A3B8]">CentralBankMaximo CRM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/10 rounded-lg">
              <span className="text-base">{cat?.emoji || "👤"}</span>
              <span className="text-xs text-[#D4AF37] font-semibold">{loggedAfiliado.nome}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#8B5CF6]/5 border border-[#D4AF37]/20 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{cat?.emoji || "👤"}</span>
            Olá, {loggedAfiliado.nome}!
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {cat?.nome || "Afiliado"} — Aqui você pode indicar novos leads e acompanhar o status das suas indicações.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-[#D4AF37]" />
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]">{totalLeads}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Plus size={14} className="text-[#3B82F6]" />
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Novos</span>
            </div>
            <p className="text-2xl font-bold text-[#3B82F6]">{leadsNovos}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-[#F59E0B]" />
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Em Contato</span>
            </div>
            <p className="text-2xl font-bold text-[#F59E0B]">{leadsEmContato}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Check size={14} className="text-[#22C55E]" />
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Convertidos</span>
            </div>
            <p className="text-2xl font-bold text-[#22C55E]">{leadsConvertidos}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#111827] border border-[#1E293B] rounded-xl p-1.5 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("meus_leads"); setLastCreatedLead(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "meus_leads"
                ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <Eye size={16} />
            Meus Leads
          </button>
          <button
            onClick={() => { setActiveTab("novo_lead"); setLastCreatedLead(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "novo_lead"
                ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <Send size={16} />
            Indicar Novo Lead
          </button>
          <button
            onClick={() => { setActiveTab("treinamento"); setLastCreatedLead(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "treinamento"
                ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            <GraduationCap size={16} />
            Máximo Conceito
          </button>
        </div>

        {/* Success Card (after creating lead) */}
        {lastCreatedLead && (
          <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#D4AF37]/10 border border-[#22C55E]/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22C55E]/15 flex items-center justify-center">
                <Check size={20} className="text-[#22C55E]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Lead Cadastrado com Sucesso! 🎉</h3>
                <p className="text-xs text-[#94A3B8]">
                  <span className="text-white font-medium">{lastCreatedLead.lead.nome}</span> foi adicionado.
                  {lastCreatedLead.produtoNome && (
                    <> Produto: <span className="text-[#8B5CF6] font-medium">{lastCreatedLead.produtoNome}</span></>
                  )}
                </p>
              </div>
            </div>

            {loggedAfiliado.telefone && (
              <a
                href={buildWhatsAppUrl(lastCreatedLead.lead.nome, lastCreatedLead.produtoNome)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)]"
              >
                <MessageCircle size={18} />
                Receber Confirmação via WhatsApp
              </a>
            )}

            <button
              onClick={() => setLastCreatedLead(null)}
              className="text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              Fechar ✕
            </button>
          </div>
        )}

        {/* ═══ MEUS LEADS TAB ═══ */}
        {activeTab === "meus_leads" && (
          <div className="space-y-3">
            {meusLeads.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
                <FileText size={48} className="mx-auto text-[#1E293B] mb-4" />
                <p className="text-[#94A3B8] text-sm">Você ainda não indicou nenhum lead.</p>
                <button
                  onClick={() => setActiveTab("novo_lead")}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C4A030] text-[#0F172A] font-bold text-sm rounded-xl transition-all"
                >
                  Indicar Primeiro Lead
                </button>
              </div>
            ) : (
              meusLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-[#D4AF37]/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm text-white font-semibold">{lead.nome}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${getStatusColor(lead.status)}20`,
                            color: getStatusColor(lead.status),
                          }}
                        >
                          {statusLabels[lead.status]}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${getPrioridadeColor(lead.prioridade)}15`,
                            color: getPrioridadeColor(lead.prioridade),
                          }}
                        >
                          {lead.prioridade === "alto" ? "🔥 Alto" : lead.prioridade === "medio" ? "⚡ Médio" : "📋 Baixo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#94A3B8] flex-wrap">
                        {lead.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {lead.telefone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} />
                            {lead.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Package size={10} />
                          {servicoLabels[lead.servico] || lead.servico}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {lead.valorPretendido > 0 && (
                          <span className="text-[#D4AF37] font-semibold">
                            {formatCurrency(lead.valorPretendido)}
                          </span>
                        )}
                        <span className="text-[#94A3B8]">{formatDateShort(lead.criadoEm)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══ NOVO LEAD TAB ═══ */}
        {activeTab === "novo_lead" && (
          <div className="bg-[#111827] border border-[#8B5CF6]/20 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1E293B]">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                <Send size={18} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Indicar Novo Lead</h3>
                <p className="text-xs text-[#94A3B8]">Preencha os dados do cliente que você está indicando</p>
              </div>
            </div>

            {/* Lead Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Nome do Cliente *</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={leadForm.nome}
                  onChange={(e) => updateLeadField("nome", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Telefone/WhatsApp *</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={leadForm.telefone}
                  onChange={(e) => updateLeadField("telefone", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">E-mail</label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={leadForm.email}
                  onChange={(e) => updateLeadField("email", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">CPF/CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={leadForm.cpfCnpj}
                  onChange={(e) => updateLeadField("cpfCnpj", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Valor Pretendido (R$)</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={leadForm.valorPretendido}
                  onChange={(e) => updateLeadField("valorPretendido", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Tipo de Serviço *</label>
                <select
                  value={leadForm.servico}
                  onChange={(e) => updateLeadField("servico", e.target.value as ServiceType | "")}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="">Selecionar serviço...</option>
                  {productTypes.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium flex items-center gap-1.5">
                <Package size={12} className="text-[#D4AF37]" />
                Produto de Interesse
              </label>
              <select
                value={leadForm.produtoId}
                onChange={(e) => updateLeadField("produtoId", e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="">Selecionar produto (opcional)...</option>
                {produtos.filter((p) => p.ativo).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.taxa ? `(${p.taxa}% a.m.)` : ""} {p.valorMin && p.valorMax ? `— ${formatCurrency(p.valorMin)} a ${formatCurrency(p.valorMax)}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Prioridade</label>
                <select
                  value={leadForm.prioridade}
                  onChange={(e) => updateLeadField("prioridade", e.target.value as "alto" | "medio" | "baixo")}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="alto">🔥 Alto Padrão</option>
                  <option value="medio">⚡ Médio</option>
                  <option value="baixo">📋 Baixo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Landing Page</label>
                <select
                  value={leadForm.landingPageId}
                  onChange={(e) => updateLeadField("landingPageId", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {landingPages.map((lp) => (
                    <option key={lp.id} value={lp.id}>{lp.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Origem</label>
                <select
                  value={leadForm.origem}
                  onChange={(e) => updateLeadField("origem", e.target.value as typeof leadForm.origem)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {leadOrigins.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setLeadForm(emptyLeadForm)}
                className="px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleRegisterLead}
                disabled={!leadForm.nome.trim() || !leadForm.telefone.trim() || !leadForm.servico}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9B6CF6] hover:to-[#8B5CF6] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Send size={16} />
                Cadastrar Lead
              </button>
            </div>
          </div>
        )}
        {/* ═══ TREINAMENTO TAB ═══ */}
        {activeTab === "treinamento" && (
          <TreinamentoPortal produtos={produtos} codigoAcesso={loggedAfiliado.codigoAcesso} />
        )}
      </main>
    </div>
  );
}

// ── Treinamento Sub-component for Portal ──
function TreinamentoPortal({ produtos, codigoAcesso }: { produtos: Produto[]; codigoAcesso?: string }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [customProdutos] = useState<TreinamentoProduto[]>(() => loadTreinamentoProdutos());
  const activeProdutos = produtos.filter((p) => p.ativo);

  const handleCopyCode = () => {
    if (!codigoAcesso) return;
    navigator.clipboard.writeText(codigoAcesso).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getProductLinks = (p: Produto): ConteudoLink[] => {
    if (p.conteudoLinks && p.conteudoLinks.length > 0) return p.conteudoLinks;
    const links: ConteudoLink[] = [];
    if (p.conteudo?.ebookUrl) links.push({ id: "leg1", tipo: "ebook", titulo: "Ebook", url: p.conteudo.ebookUrl });
    if (p.conteudo?.videoUrl) links.push({ id: "leg2", tipo: "video", titulo: "Vídeos", url: p.conteudo.videoUrl });
    if (p.conteudo?.explicacaoUrl) links.push({ id: "leg3", tipo: "explicacao", titulo: "Explicações", url: p.conteudo.explicacaoUrl });
    return links;
  };

  const allItems: { id: string; nome: string; descricao: string; icone?: string; links: { id: string; tipo: string; titulo: string; url: string }[] }[] = [
    ...activeProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      links: getProductLinks(p).map((l) => ({ id: l.id, tipo: l.tipo, titulo: l.titulo, url: l.url })),
    })),
    ...customProdutos.filter((c) => c.ativo).map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      icone: c.icone,
      links: c.links,
    })),
  ];

  const itemsWithLinks = allItems.filter((item) => item.links.length > 0);
  const itemsWithoutLinks = allItems.filter((item) => item.links.length === 0);

  return (
    <div className="space-y-5">
      {/* Access Code Banner */}
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#8B5CF6]/10 border border-[#D4AF37]/20 rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#D4AF37]" />
            <span className="text-xs text-[#94A3B8] font-medium">Sua Senha de Acesso:</span>
          </div>
          {codigoAcesso ? (
            <div className="flex items-center gap-2">
              <code className="px-3 py-1.5 bg-[#0F172A] border border-[#D4AF37]/30 rounded-lg text-sm text-[#D4AF37] font-mono font-bold">
                {codigoAcesso}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
                title="Copiar"
              >
                {copiedCode ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#F59E0B] italic">
              Senha ainda não gerada. Solicite ao administrador.
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-2">
          Use esta senha para acessar os conteúdos exclusivos nas landing pages de treinamento.
        </p>
      </div>

      {/* Products with links */}
      {itemsWithLinks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {itemsWithLinks.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827] border border-[#8B5CF6]/20 rounded-xl p-4 hover:border-[#8B5CF6]/40 transition-all"
            >
              <div className="mb-3 flex items-center gap-2">
                {item.icone && <span className="text-lg">{item.icone}</span>}
                <div>
                  <h3 className="text-white font-semibold text-sm">{item.nome}</h3>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5 line-clamp-2">{item.descricao}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.links.map((link) => {
                  const colors = conteudoLinkTipoColors[link.tipo as ConteudoLinkTipo] || conteudoLinkTipoColors.outro;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {link.titulo || conteudoLinkTipoLabels[link.tipo as ConteudoLinkTipo] || link.tipo}
                      <ExternalLink size={10} />
                    </a>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#475569] mt-2">{item.links.length} link(s) disponível(is)</p>
            </div>
          ))}
        </div>
      )}

      {/* Products without links */}
      {itemsWithoutLinks.length > 0 && (
        <div>
          <p className="text-xs text-[#64748B] mb-2">Em breve:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {itemsWithoutLinks.map((item) => (
              <div key={item.id} className="bg-[#111827] border border-[#1E293B] rounded-lg p-3">
                <p className="text-xs text-[#94A3B8] truncate">{item.icone ? `${item.icone} ` : ""}{item.nome}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {allItems.length === 0 && (
        <div className="text-center py-12 bg-[#111827] border border-[#1E293B] rounded-xl">
          <Package size={40} className="mx-auto text-[#334155] mb-3" />
          <p className="text-sm text-[#94A3B8]">Nenhum produto disponível no momento.</p>
        </div>
      )}
    </div>
  );
}
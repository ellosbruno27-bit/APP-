import { useState, useMemo } from "react";
import { formatCurrency, statusLabels, getCategoryBadge } from "@/lib/data";
import type { LeadStatus, Parceiro } from "@/lib/data";
import { useData } from "@/lib/BackendDataContext";
import { loadParceiros, loadLeadParceiros, getCategories } from "@/lib/store";
import { TrendingUp, Users, Target, DollarSign, ArrowUpRight, ArrowDownRight, Zap, Filter, Building2, Loader2 } from "lucide-react";

const HERO_BG = "https://mgx-backend-cdn.metadl.com/generate/images/1058378/2026-03-25/5758e283-4cea-4436-aae5-2118d8a2f783.png";
const DASHBOARD_BG = "https://mgx-backend-cdn.metadl.com/generate/images/1058378/2026-03-25/bbf82687-a871-4d14-b73b-fef645bb5dd7.png";

/** Gold gradient funnel colors from #D4AF37 to #FDE68A */
const funnelColors: Record<LeadStatus, string> = {
  novo: "#D4AF37",
  em_contato: "#DBBF4A",
  simulacao_enviada: "#E8D06A",
  conversao: "#FDE68A",
};

export default function Dashboard() {
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [parceiroFilter, setParceiroFilter] = useState<string>("todos");

  // Load from Backend API via context
  const { leads: allLeads, landingPages: allLandingPages, corretores, loading } = useData();

  // Still use localStorage for parceiros (not yet migrated)
  const categories = useMemo(() => getCategories(), []);
  const parceiros = useMemo(() => loadParceiros(), []);
  const leadParceiros = useMemo(() => loadLeadParceiros(), []);

  // Filter landing pages by category
  const filteredLPs = useMemo(() => {
    if (categoryFilter === "todos") return allLandingPages;
    return allLandingPages.filter((lp) => lp.categoria === categoryFilter);
  }, [allLandingPages, categoryFilter]);

  const filteredLPIds = useMemo(() => new Set(filteredLPs.map((lp) => lp.id)), [filteredLPs]);

  // Filter leads by category + parceiro
  const leads = useMemo(() => {
    let filtered = allLeads;
    if (categoryFilter !== "todos") {
      filtered = filtered.filter((l) => filteredLPIds.has(l.landingPageId));
    }
    if (parceiroFilter !== "todos") {
      filtered = filtered.filter((l) => leadParceiros[l.id] === parceiroFilter);
    }
    return filtered;
  }, [allLeads, categoryFilter, parceiroFilter, filteredLPIds, leadParceiros]);

  const today = new Date().toISOString().split("T")[0];
  const leadsHoje = leads.filter((l) => l.criadoEm.startsWith(today));
  const leadsAtendidos = leads.filter((l) => l.status !== "novo");
  const leadsNovos = leads.filter((l) => l.status === "novo");
  const conversoes = leads.filter((l) => l.status === "conversao");
  const valorTotal = leads.reduce((acc, l) => acc + l.valorPretendido, 0);
  const taxaConversao = leads.length > 0 ? ((conversoes.length / leads.length) * 100).toFixed(1) : "0";

  const funnelData: { status: LeadStatus; count: number }[] = [
    { status: "novo", count: leads.filter((l) => l.status === "novo").length },
    { status: "em_contato", count: leads.filter((l) => l.status === "em_contato").length },
    { status: "simulacao_enviada", count: leads.filter((l) => l.status === "simulacao_enviada").length },
    { status: "conversao", count: leads.filter((l) => l.status === "conversao").length },
  ];

  const maxFunnel = Math.max(...funnelData.map((f) => f.count), 1);

  const lpPerformance = filteredLPs.map((lp) => ({
    ...lp,
    taxa: lp.leadsTotal > 0 ? ((lp.conversoes / lp.leadsTotal) * 100).toFixed(1) : "0",
  }));

  // Parceiro performance stats
  const parceiroStats = useMemo(() => {
    const stats: { parceiro: Parceiro; leadsCount: number; valorTotal: number; conversoes: number }[] = [];
    parceiros.forEach((p) => {
      const pLeads = allLeads.filter((l) => leadParceiros[l.id] === p.id);
      if (pLeads.length > 0) {
        stats.push({
          parceiro: p,
          leadsCount: pLeads.length,
          valorTotal: pLeads.reduce((acc, l) => acc + l.valorPretendido, 0),
          conversoes: pLeads.filter((l) => l.status === "conversao").length,
        });
      }
    });
    return stats.sort((a, b) => b.leadsCount - a.leadsCount);
  }, [parceiros, allLeads, leadParceiros]);

  const stats = [
    { label: "Leads Hoje", value: leadsHoje.length.toString(), icon: <Zap size={20} />, change: "+12%", up: true, color: "#D4AF37" },
    { label: "Leads Atendidos", value: leadsAtendidos.length.toString(), icon: <Users size={20} />, change: "+8%", up: true, color: "#3B82F6" },
    { label: "Taxa de Conversão", value: `${taxaConversao}%`, icon: <Target size={20} />, change: "+3.2%", up: true, color: "#8B5CF6" },
    { label: "Valor Total", value: formatCurrency(valorTotal), icon: <DollarSign size={20} />, change: "+15%", up: true, color: "#F59E0B" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Full Dashboard Background - Luxury Property */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${DASHBOARD_BG})` }}
      />
      {/* Dark Overlay - 80% opacity for legibility */}
      <div className="fixed inset-0 bg-black/80" />

      {/* Content Layer */}
      <div className="relative z-10 space-y-6">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl">
          <Loader2 size={16} className="text-[#D4AF37] animate-spin" />
          <span className="text-xs text-[#D4AF37]">Carregando dados do servidor...</span>
        </div>
      )}

      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden h-32 sm:h-40 flex items-center"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F172A]/40" />
        <div className="relative z-10 px-5 sm:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Bom dia, Admin! 👋</h2>
          <p className="text-sm text-[#94A3B8]">
            Você tem <span className="text-[#D4AF37] font-semibold">{leadsNovos.length} novos leads</span> aguardando atendimento
          </p>
        </div>
      </div>

      {/* Parceiros Slider */}
      {parceiros.length > 0 && (
        <div className="relative rounded-xl p-4 border border-[#D4AF37]/10 bg-[#111827]/60 backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={16} className="text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#D4AF37]">Parceiros</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {parceiros.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 backdrop-blur-sm flex-shrink-0 hover:border-[#D4AF37]/40 transition-colors"
              >
                <span className="text-base">{p.tipo === "banco" ? "🏦" : "📋"}</span>
                <span className="text-xs font-semibold text-[#D4AF37] whitespace-nowrap">{p.nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glassmorphism Filters */}
      <div className="relative rounded-xl p-4 border border-[#D4AF37]/20 bg-[#D4AF37]/5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <Filter size={18} />
            <span className="text-sm font-semibold">Filtros</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 sm:max-w-xs px-4 py-2.5 rounded-lg text-sm text-white font-medium bg-white/5 backdrop-blur-sm border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23D4AF37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="todos">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Parceiro / Institution Filter */}
            <select
              value={parceiroFilter}
              onChange={(e) => setParceiroFilter(e.target.value)}
              className="flex-1 sm:max-w-xs px-4 py-2.5 rounded-lg text-sm text-white font-medium bg-white/5 backdrop-blur-sm border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23D4AF37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="todos">Todas Instituições</option>
              {parceiros.filter((p) => p.tipo === "banco").length > 0 && (
                <optgroup label="🏦 Bancos">
                  {parceiros.filter((p) => p.tipo === "banco").map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </optgroup>
              )}
              {parceiros.filter((p) => p.tipo === "administradora").length > 0 && (
                <optgroup label="📋 Administradoras">
                  {parceiros.filter((p) => p.tipo === "administradora").map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          {(categoryFilter !== "todos" || parceiroFilter !== "todos") && (
            <button
              onClick={() => { setCategoryFilter("todos"); setParceiroFilter("todos"); }}
              className="text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors underline underline-offset-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-5 hover:border-[#334155] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium ${stat.up ? "text-[#D4AF37]" : "text-[#EF4444]"}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[#D4AF37]">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-[#94A3B8] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel + LP Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Funnel */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#D4AF37]" />
            Funil de Vendas
          </h3>
          <div className="space-y-4">
            {funnelData.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-[#94A3B8]">{statusLabels[item.status]}</span>
                  <span className="text-xs sm:text-sm font-semibold text-white">{item.count}</span>
                </div>
                <div className="h-3 bg-[#1E293B] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.count / maxFunnel) * 100}%`,
                      backgroundColor: funnelColors[item.status],
                      boxShadow: `0 0 12px ${funnelColors[item.status]}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Landing Page Performance */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Target size={18} className="text-[#D4AF37]" />
            Performance por Landing Page
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {lpPerformance.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-8">Nenhuma landing page nesta categoria</p>
            ) : (
              lpPerformance.map((lp) => {
                const badge = getCategoryBadge(lp);
                return (
                  <div key={lp.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50 hover:bg-[#1E293B] transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lp.cor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white font-medium truncate">{lp.nome}</p>
                        {badge && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
                            style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] truncate hidden sm:block">{lp.dominio}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{lp.leadsTotal}</p>
                      <p className="text-[10px] sm:text-xs" style={{ color: lp.cor }}>{lp.taxa}%</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Performance por Instituição Financeira */}
      {parceiroStats.length > 0 && (
        <div className="bg-[#111827]/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[#D4AF37]" />
            Performance por Instituição Financeira
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {parceiroStats.map(({ parceiro, leadsCount, valorTotal: vt, conversoes: conv }) => (
              <div
                key={parceiro.id}
                className="p-4 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 backdrop-blur-sm hover:border-[#D4AF37]/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-lg flex-shrink-0">
                    {parceiro.tipo === "banco" ? "🏦" : "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{parceiro.nome}</p>
                    <p className="text-[10px] text-[#D4AF37]">
                      {parceiro.tipo === "banco" ? "Banco" : "Administradora"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{leadsCount}</p>
                    <p className="text-[10px] text-[#94A3B8]">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#D4AF37]">{conv}</p>
                    <p className="text-[10px] text-[#94A3B8]">Conversões</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#FDE68A] truncate">{formatCurrency(vt)}</p>
                    <p className="text-[10px] text-[#94A3B8]">Valor</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corretores Ativos */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={18} className="text-[#D4AF37]" />
          Corretores Ativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {corretores.filter((c) => c.ativo).map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-xs font-bold flex-shrink-0">
                {c.nome.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{c.nome}</p>
                <p className="text-xs text-[#94A3B8]">{c.leadsAtribuidos} leads</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
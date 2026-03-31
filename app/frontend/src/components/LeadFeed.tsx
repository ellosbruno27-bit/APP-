import { useState, useMemo, useCallback } from "react";
import {
  formatCurrency,
  formatDateShort,
  statusLabels,
  origemLabels,
  getStatusColor,
} from "@/lib/data";
import type { Lead, LeadStatus, Parceiro, Afiliado } from "@/lib/data";
import { useData } from "@/lib/BackendDataContext";
import {
  loadParceiros,
  loadLeadParceiros,
  setLeadParceiro,
  loadAfiliados,
  loadLeadAfiliados,
  setLeadAfiliado,
  loadCategoriasAfiliado,
} from "@/lib/store";
import { Search, Filter, MessageSquare, Phone, Star, ChevronRight, Building2, Handshake } from "lucide-react";
import LeadDetail from "./LeadDetail";

export default function LeadFeed() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "todos">("todos");
  const [lpFilter, setLpFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Load from backend context
  const { leads: allLeads, landingPages, corretores } = useData();

  // Still use localStorage for parceiros/afiliados (not yet migrated)
  const parceiros = useMemo(() => loadParceiros(), []);
  const afiliados = useMemo(() => loadAfiliados(), []);
  const categoriasAfiliado = useMemo(() => loadCategoriasAfiliado(), []);
  const [leadParceiros, setLeadParceiros] = useState<Record<string, string>>(() => loadLeadParceiros());
  const [leadAfiliados, setLeadAfiliados] = useState<Record<string, string>>(() => loadLeadAfiliados());

  const handleSetParceiro = useCallback((leadId: string, parceiroId: string) => {
    const updated = setLeadParceiro(leadId, parceiroId || null);
    setLeadParceiros(updated);
  }, []);

  const handleSetAfiliado = useCallback((leadId: string, afiliadoId: string) => {
    const updated = setLeadAfiliado(leadId, afiliadoId || null);
    setLeadAfiliados(updated);
  }, []);

  const getParceiroById = useCallback(
    (id: string): Parceiro | undefined => parceiros.find((p) => p.id === id),
    [parceiros]
  );

  const getAfiliadoById = useCallback(
    (id: string): Afiliado | undefined => afiliados.find((a) => a.id === id),
    [afiliados]
  );

  const getCatEmojiById = useCallback(
    (catId: string): string => categoriasAfiliado.find((c) => c.id === catId)?.emoji || "👤",
    [categoriasAfiliado]
  );

  const getLandingPageById = useCallback(
    (id: string) => landingPages.find((lp) => lp.id === id),
    [landingPages]
  );

  const getCorretorById = useCallback(
    (id: string) => corretores.find((c) => c.id === id),
    [corretores]
  );

  const filteredLeads = allLeads
    .filter((l) => statusFilter === "todos" || l.status === statusFilter)
    .filter((l) => lpFilter === "todos" || l.landingPageId === lpFilter)
    .filter(
      (l) =>
        searchQuery === "" ||
        l.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.telefone.includes(searchQuery)
    )
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  if (selectedLead) {
    return <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Feed de Leads</h2>
          <p className="text-sm text-[#94A3B8]">{filteredLeads.length} leads encontrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#94A3B8] text-sm">
          <Filter size={16} />
          <span>Filtros</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "todos")}
            className="px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="todos">Todos os Status</option>
            {(Object.keys(statusLabels) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>

          {/* Landing Page Filter */}
          <select
            value={lpFilter}
            onChange={(e) => setLpFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="todos">Todas Landing Pages</option>
            {landingPages.map((lp) => (
              <option key={lp.id} value={lp.id}>{lp.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lead List */}
      <div className="space-y-2">
        {filteredLeads.map((lead) => {
          const lp = getLandingPageById(lead.landingPageId);
          const corretor = lead.corretorId ? getCorretorById(lead.corretorId) : null;
          const isHighPriority = lead.prioridade === "alto";
          const parceiroId = leadParceiros[lead.id] || "";
          const parceiro = parceiroId ? getParceiroById(parceiroId) : null;
          const afiliadoId = leadAfiliados[lead.id] || "";
          const afiliado = afiliadoId ? getAfiliadoById(afiliadoId) : null;

          return (
            <div
              key={lead.id}
              className={`bg-[#111827] border rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                isHighPriority
                  ? "border-[#EF4444]/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                  : "border-[#1E293B]"
              }`}
            >
              {/* Main row - clickable */}
              <button
                onClick={() => setSelectedLead(lead)}
                className="w-full text-left hover:bg-[#1E293B]/50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Priority indicator */}
                  <div className="flex-shrink-0">
                    {isHighPriority ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center animate-pulse">
                        <Star size={16} className="text-[#EF4444] fill-[#EF4444]" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                        {lead.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                      <span className="text-white font-semibold text-xs sm:text-sm">{lead.nome}</span>
                      {isHighPriority && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444]">
                          🔥 ALTO
                        </span>
                      )}
                      {parceiro && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37]">
                          🏦 {parceiro.nome}
                        </span>
                      )}
                      {afiliado && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#8B5CF6]/10 text-[#8B5CF6]">
                          {getCatEmojiById(afiliado.categoriaId)} {afiliado.nome}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        <span className="hidden sm:inline">{lead.telefone}</span>
                        <span className="sm:hidden">{lead.telefone.slice(0, 10)}...</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <MessageSquare size={12} />
                        {origemLabels[lead.origem]}
                      </span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-[#D4AF37]">{formatCurrency(lead.valorPretendido)}</p>
                    <p className="text-[10px] sm:text-xs text-[#94A3B8]">{formatDateShort(lead.criadoEm)}</p>
                  </div>

                  {/* Landing Page Badge - hidden on small screens */}
                  <div className="flex-shrink-0 hidden lg:block">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-[#0F172A]"
                      style={{ backgroundColor: lp?.cor || "#94A3B8" }}
                    >
                      {lp?.nome?.split(" ").slice(0, 2).join(" ") || "N/A"}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <span
                      className="px-2 sm:px-3 py-1 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${getStatusColor(lead.status)}15`,
                        color: getStatusColor(lead.status),
                      }}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>

                  {/* Corretor - hidden on small screens */}
                  <div className="flex-shrink-0 hidden xl:block w-24 text-right">
                    {corretor ? (
                      <p className="text-xs text-[#94A3B8] truncate">{corretor.nome}</p>
                    ) : (
                      <p className="text-xs text-[#F59E0B]">Sem corretor</p>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#D4AF37] transition-colors flex-shrink-0" />
                </div>
              </button>

              {/* Parceiro & Afiliado Selector Row */}
              {(parceiros.length > 0 || afiliados.length > 0) && (
                <div className="mt-2 pt-2 border-t border-[#1E293B]/50 flex flex-col sm:flex-row gap-2">
                  {/* Parceiro */}
                  {parceiros.length > 0 && (
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 size={14} className="text-[#D4AF37] flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-[#94A3B8] flex-shrink-0">Parceiro:</span>
                      <select
                        value={parceiroId}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSetParceiro(lead.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 max-w-xs px-2 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-[10px] sm:text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                      >
                        <option value="">Selecionar instituição...</option>
                        {parceiros.filter((p) => p.tipo === "banco").length > 0 && (
                          <optgroup label="🏦 Bancos">
                            {parceiros
                              .filter((p) => p.tipo === "banco")
                              .map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                          </optgroup>
                        )}
                        {parceiros.filter((p) => p.tipo === "administradora").length > 0 && (
                          <optgroup label="📋 Administradoras">
                            {parceiros
                              .filter((p) => p.tipo === "administradora")
                              .map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                  {/* Afiliado Indicador */}
                  {afiliados.length > 0 && (
                    <div className="flex items-center gap-2 flex-1">
                      <Handshake size={14} className="text-[#8B5CF6] flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-[#94A3B8] flex-shrink-0">Indicado por:</span>
                      <select
                        value={afiliadoId}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSetAfiliado(lead.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 max-w-xs px-2 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-[10px] sm:text-xs text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                      >
                        <option value="">Selecionar afiliado...</option>
                        {afiliados
                          .filter((a) => a.ativo)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {getCatEmojiById(a.categoriaId)} {a.nome}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredLeads.length === 0 && (
          <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
            <MessageSquare size={48} className="mx-auto text-[#1E293B] mb-4" />
            <p className="text-[#94A3B8]">Nenhum lead encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
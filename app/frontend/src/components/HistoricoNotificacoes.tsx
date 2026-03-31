import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@metagptx/web-sdk";
import {
  History,
  Volume2,
  VolumeX,
  Moon,
  UserPlus,
  AlertTriangle,
  CalendarClock,
  Clock,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Wind,
  Siren,
  BellRing,
  Loader2,
  Bell,
  Trash2,
  Download,
  Search,
  X,
  Sparkles,
  XCircle,
} from "lucide-react";

const client = createClient();

interface NotificationRecord {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  lead_id: string;
  priority: string;
  sound_played: boolean;
  silenced_by_dnd: boolean;
  sound_type: string;
  created_at: string;
}

type FilterType = "todos" | "novo_lead" | "sem_atendimento" | "follow_up";
type SoundFilter = "todos" | "played" | "silenced";

const PAGE_SIZE = 15;

function getTypeInfo(type: string) {
  switch (type) {
    case "novo_lead":
      return { label: "Novo Lead", icon: <UserPlus size={14} />, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/15", dot: "bg-[#3B82F6]" };
    case "sem_atendimento":
      return { label: "Sem Atendimento +24h", icon: <AlertTriangle size={14} />, color: "text-[#EF4444]", bg: "bg-[#EF4444]/15", dot: "bg-[#EF4444]" };
    case "follow_up":
      return { label: "Follow-up Pendente", icon: <CalendarClock size={14} />, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/15", dot: "bg-[#F59E0B]" };
    default:
      return { label: type, icon: <Bell size={14} />, color: "text-[#8A8A8A]", bg: "bg-[#8A8A8A]/15", dot: "bg-[#8A8A8A]" };
  }
}

function getSoundIcon(soundType: string) {
  switch (soundType) {
    case "apito": return <Wind size={12} className="text-[#3B82F6]" />;
    case "sirene": return <Siren size={12} className="text-[#F59E0B]" />;
    case "campainha": return <BellRing size={12} className="text-[#D4A853]" />;
    case "buzina": return <Megaphone size={12} className="text-[#EF4444]" />;
    default: return <Volume2 size={12} className="text-[#8A8A8A]" />;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "alta": return { label: "Urgente", cls: "text-[#EF4444] bg-[#EF4444]/10" };
    case "media": return { label: "Médio", cls: "text-[#F59E0B] bg-[#F59E0B]/10" };
    case "baixa": return { label: "Baixo", cls: "text-[#8A8A8A] bg-[#8A8A8A]/10" };
    default: return { label: priority, cls: "text-[#8A8A8A] bg-[#8A8A8A]/10" };
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return dateStr; }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDateTime(dateStr);
  } catch { return dateStr; }
}

export default function HistoricoNotificacoes() {
  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("todos");
  const [soundFilter, setSoundFilter] = useState<SoundFilter>("todos");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const aiSummaryRef = useRef("");

  const fetchRecords = useCallback(async () => {
    try {
      const queryObj: Record<string, unknown> = {};
      if (typeFilter !== "todos") queryObj.notification_type = typeFilter;
      if (soundFilter === "played") queryObj.sound_played = true;
      else if (soundFilter === "silenced") queryObj.silenced_by_dnd = true;

      const response = await client.entities.notification_history.query({
        query: queryObj, sort: "-created_at", limit: PAGE_SIZE, skip: page * PAGE_SIZE,
      });
      const data = response.data;
      setRecords(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch notification history:", err);
      setRecords([]);
      setTotal(0);
    }
  }, [typeFilter, soundFilter, page]);

  useEffect(() => {
    setLoading(true);
    fetchRecords().finally(() => setLoading(false));
  }, [fetchRecords]);

  const handleRefresh = async () => { setRefreshing(true); await fetchRecords(); setRefreshing(false); };

  const handleClearAll = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de notificações?")) return;
    try {
      for (const record of records) await client.entities.notification_history.delete({ id: String(record.id) });
      await fetchRecords();
    } catch (err) { console.error("Failed to clear history:", err); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const queryObj: Record<string, unknown> = {};
      if (typeFilter !== "todos") queryObj.notification_type = typeFilter;
      if (soundFilter === "played") queryObj.sound_played = true;
      else if (soundFilter === "silenced") queryObj.silenced_by_dnd = true;

      const allRecords: NotificationRecord[] = [];
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const response = await client.entities.notification_history.query({ query: queryObj, sort: "-created_at", limit: 100, skip });
        const items = response.data.items || [];
        allRecords.push(...items);
        skip += 100;
        hasMore = items.length === 100;
      }
      if (allRecords.length === 0) { setExporting(false); return; }

      const typeLabels: Record<string, string> = { novo_lead: "Novo Lead", sem_atendimento: "Sem Atendimento +24h", follow_up: "Follow-up Pendente" };
      const priorityLabels: Record<string, string> = { alta: "Urgente", media: "Médio", baixa: "Baixo" };
      const headers = ["Tipo", "Título", "Mensagem", "Prioridade", "Som", "Status do Som", "Data/Hora"];
      const csvRows = [headers.join(",")];
      const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;
      for (const r of allRecords) {
        csvRows.push([esc(typeLabels[r.notification_type] || r.notification_type), esc(r.title), esc(r.message), esc(priorityLabels[r.priority] || r.priority), esc(r.sound_type), esc(r.silenced_by_dnd ? "Silenciado (DND)" : r.sound_played ? "Tocado" : "Mudo"), esc(formatDateTime(r.created_at))].join(","));
      }
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `historico_notificacoes_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) { console.error("Failed to export CSV:", err); }
    setExporting(false);
  };

  const handleAiSummary = async () => {
    const queryObj: Record<string, unknown> = {};
    if (typeFilter !== "todos") queryObj.notification_type = typeFilter;
    if (soundFilter === "played") queryObj.sound_played = true;
    else if (soundFilter === "silenced") queryObj.silenced_by_dnd = true;

    setAiLoading(true); setAiSummary(""); setShowAiSummary(true); aiSummaryRef.current = "";
    try {
      const allRecords: NotificationRecord[] = [];
      let skip = 0; let hasMore = true;
      while (hasMore) {
        const response = await client.entities.notification_history.query({ query: queryObj, sort: "-created_at", limit: 100, skip });
        const items = response.data.items || [];
        allRecords.push(...items); skip += 100; hasMore = items.length === 100;
      }
      if (allRecords.length === 0) { setAiSummary("Nenhum registro encontrado para gerar o resumo."); setAiLoading(false); return; }

      const dataToAnalyze = searchQuery.trim() ? allRecords.filter((r) => { const q = searchQuery.toLowerCase().trim(); return r.title.toLowerCase().includes(q) || r.message.toLowerCase().includes(q); }) : allRecords;
      if (dataToAnalyze.length === 0) { setAiSummary("Nenhum registro corresponde à busca atual para gerar o resumo."); setAiLoading(false); return; }

      const typeCount: Record<string, number> = {};
      const hourCount: Record<number, number> = {};
      const leadCount: Record<string, number> = {};
      const priorityCount: Record<string, number> = {};
      let soundPlayed = 0; let silencedDnd = 0;
      for (const r of dataToAnalyze) {
        typeCount[r.notification_type] = (typeCount[r.notification_type] || 0) + 1;
        priorityCount[r.priority] = (priorityCount[r.priority] || 0) + 1;
        if (r.sound_played) soundPlayed++;
        if (r.silenced_by_dnd) silencedDnd++;
        if (r.lead_id) leadCount[r.lead_id] = (leadCount[r.lead_id] || 0) + 1;
        try { hourCount[new Date(r.created_at).getHours()] = (hourCount[new Date(r.created_at).getHours()] || 0) + 1; } catch { /* ignore */ }
      }

      const topLeads = Object.entries(leadCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, count]) => `Lead ${id}: ${count} alertas`);
      const hourDist = Object.entries(hourCount).sort((a, b) => Number(a[0]) - Number(b[0])).map(([h, c]) => `${h}h: ${c}`);

      const dataSummary = `Total: ${dataToAnalyze.length}\nTipos: ${Object.entries(typeCount).map(([t, c]) => `${t}: ${c}`).join(", ")}\nPrioridades: ${Object.entries(priorityCount).map(([p, c]) => `${p}: ${c}`).join(", ")}\nSom: ${soundPlayed} | DND: ${silencedDnd}\nHoras: ${hourDist.join(", ")}\nTop leads: ${topLeads.length > 0 ? topLeads.join("; ") : "N/A"}`;

      await client.ai.gentxt({
        messages: [
          { role: "system" as const, content: "Você é um analista de dados especializado em CRM imobiliário. Gere um resumo inteligente e acionável das notificações. Use emojis. Formate em markdown. Inclua: visão geral, horários de pico, tipos frequentes, leads com mais alertas, análise DND, recomendações. Português brasileiro." },
          { role: "user" as const, content: `Analise:\n${dataSummary}` },
        ],
        model: "deepseek-v3.2",
        stream: true,
        onChunk: (chunk: { content?: string }) => { if (chunk.content) { aiSummaryRef.current += chunk.content; setAiSummary(aiSummaryRef.current); } },
        onComplete: () => { setAiLoading(false); },
        onError: (error: { message?: string }) => { setAiSummary(`Erro: ${error?.message || "Tente novamente."}`); setAiLoading(false); },
        timeout: 60000,
      });
    } catch (err) { console.error("AI summary error:", err); setAiSummary("Erro ao gerar resumo."); setAiLoading(false); }
  };

  const filteredRecords = searchQuery.trim() ? records.filter((r) => { const q = searchQuery.toLowerCase().trim(); return r.title.toLowerCase().includes(q) || r.message.toLowerCase().includes(q); }) : records;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statsPlayed = filteredRecords.filter((r) => r.sound_played).length;
  const statsSilenced = filteredRecords.filter((r) => r.silenced_by_dnd).length;

  const typeFilters: { key: FilterType; label: string }[] = [
    { key: "todos", label: "Todos" }, { key: "novo_lead", label: "Novos Leads" },
    { key: "sem_atendimento", label: "Sem Atend." }, { key: "follow_up", label: "Follow-up" },
  ];
  const soundFilters: { key: SoundFilter; label: string; icon: React.ReactNode }[] = [
    { key: "todos", label: "Todos", icon: <Filter size={12} /> },
    { key: "played", label: "Som Tocado", icon: <Volume2 size={12} /> },
    { key: "silenced", label: "Silenciado", icon: <Moon size={12} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A853]/15 flex items-center justify-center">
              <History size={18} className="text-[#D4A853]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{searchQuery ? filteredRecords.length : total}</p>
              <p className="text-[11px] text-[#8A8A8A]">{searchQuery ? "Resultados da Busca" : "Total de Registros"}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A853]/15 flex items-center justify-center">
              <Volume2 size={18} className="text-[#D4A853]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsPlayed}</p>
              <p className="text-[11px] text-[#8A8A8A]">Som Reproduzido</p>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
              <Moon size={18} className="text-[#6366F1]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsSilenced}</p>
              <p className="text-[11px] text-[#8A8A8A]">Silenciado (DND)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por título ou mensagem..." className="w-full pl-9 pr-9 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white placeholder-[#8A8A8A]/50 focus:outline-none focus:border-[#D4A853]/50" />
          {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-white"><X size={14} /></button>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#8A8A8A] mr-1">Tipo:</span>
            {typeFilters.map((f) => (
              <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(0); }} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${typeFilter === f.key ? "bg-[#D4A853]/10 text-[#D4A853]" : "text-[#8A8A8A] hover:text-white hover:bg-[#1C1C1C]"}`}>{f.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#8A8A8A] mr-1">Som:</span>
            {soundFilters.map((f) => (
              <button key={f.key} onClick={() => { setSoundFilter(f.key); setPage(0); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${soundFilter === f.key ? "bg-[#D4A853]/10 text-[#D4A853]" : "text-[#8A8A8A] hover:text-white hover:bg-[#1C1C1C]"}`}>{f.icon}{f.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleAiSummary} disabled={aiLoading || filteredRecords.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <Sparkles size={12} className={aiLoading ? "animate-spin" : ""} />{aiLoading ? "Analisando..." : "Resumo IA"}
            </button>
            <button onClick={handleExportCSV} disabled={exporting || filteredRecords.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A853]/10 hover:bg-[#D4A853]/20 text-[#D4A853] text-[11px] font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <Download size={12} className={exporting ? "animate-bounce" : ""} />{exporting ? "Exportando..." : "Exportar CSV"}
            </button>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#8A8A8A] hover:text-white text-[11px] font-medium rounded-lg transition-all border border-[#2A2A2A]">
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />Atualizar
            </button>
            {records.length > 0 && (
              <button onClick={handleClearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-[11px] font-medium rounded-lg transition-all"><Trash2 size={12} />Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {showAiSummary && (
        <div className="bg-[#141414] border border-[#8B5CF6]/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-[#8B5CF6]/10 border-b border-[#8B5CF6]/20">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#8B5CF6]" />
              <span className="text-sm font-semibold text-[#8B5CF6]">Resumo Inteligente</span>
              {aiLoading && <Loader2 size={14} className="text-[#8B5CF6] animate-spin" />}
            </div>
            <button onClick={() => setShowAiSummary(false)} className="text-[#8A8A8A] hover:text-white"><XCircle size={16} /></button>
          </div>
          <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
            {aiSummary ? (
              <div className="prose prose-invert prose-sm max-w-none text-[#E2E8F0] text-xs leading-relaxed whitespace-pre-wrap">
                {aiSummary.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.replace("## ", "")}</h3>;
                  if (line.startsWith("### ")) return <h4 key={i} className="text-xs font-bold text-[#8B5CF6] mt-2 mb-1">{line.replace("### ", "")}</h4>;
                  if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-white mt-2 mb-0.5">{line.replace(/\*\*/g, "")}</p>;
                  if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="pl-3 text-[#CBD5E1]">{line}</p>;
                  if (line.trim() === "") return <div key={i} className="h-2" />;
                  return <p key={i} className="text-[#CBD5E1]">{line}</p>;
                })}
                {aiLoading && <span className="inline-block w-1.5 h-4 bg-[#8B5CF6] animate-pulse ml-0.5 align-middle rounded-sm" />}
              </div>
            ) : aiLoading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 size={20} className="text-[#8B5CF6] animate-spin" />
                <span className="text-sm text-[#8A8A8A]">Analisando notificações com IA...</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={32} className="mx-auto text-[#D4A853] animate-spin mb-3" />
            <p className="text-sm text-[#8A8A8A]">Carregando histórico...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <History size={40} className="mx-auto text-[#2A2A2A] mb-3" />
            <p className="text-sm text-[#8A8A8A]">{searchQuery ? "Nenhum resultado para a busca" : "Nenhum registro encontrado"}</p>
            <p className="text-xs text-[#8A8A8A]/60 mt-1">{searchQuery ? `Nenhuma notificação corresponde a "${searchQuery}"` : "As notificações serão registradas automaticamente aqui"}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto] gap-3 px-5 py-3 bg-[#0A0A0A]/60 border-b border-[#2A2A2A] text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">
              <span>Tipo</span><span>Mensagem</span><span className="text-center">Prioridade</span><span className="text-center">Som</span><span className="text-center">Status</span><span className="text-right">Horário</span>
            </div>
            <div className="divide-y divide-[#2A2A2A]/50">
              {filteredRecords.map((record) => {
                const typeInfo = getTypeInfo(record.notification_type);
                const priorityBadge = getPriorityBadge(record.priority);
                return (
                  <div key={record.id} className="grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto] gap-3 px-5 py-3.5 hover:bg-[#1C1C1C]/30 transition-colors items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>{typeInfo.icon}</div>
                      <p className="text-xs text-white font-medium truncate">{typeInfo.label}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">{record.title}</p>
                      <p className="text-[10px] text-[#8A8A8A] truncate mt-0.5">{record.message}</p>
                    </div>
                    <div className="flex justify-center"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${priorityBadge.cls}`}>{priorityBadge.label}</span></div>
                    <div className="flex items-center justify-center gap-1.5 min-w-[80px]">{getSoundIcon(record.sound_type)}<span className="text-[10px] text-[#8A8A8A] capitalize">{record.sound_type}</span></div>
                    <div className="flex justify-center">
                      {record.silenced_by_dnd ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#6366F1]/10"><Moon size={11} className="text-[#6366F1]" /><span className="text-[10px] text-[#6366F1] font-medium">DND</span></div>
                      ) : record.sound_played ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#D4A853]/10"><Volume2 size={11} className="text-[#D4A853]" /><span className="text-[10px] text-[#D4A853] font-medium">Tocado</span></div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#8A8A8A]/10"><VolumeX size={11} className="text-[#8A8A8A]" /><span className="text-[10px] text-[#8A8A8A] font-medium">Mudo</span></div>
                      )}
                    </div>
                    <div className="text-right min-w-[90px]">
                      <p className="text-[10px] text-white font-medium">{formatRelativeTime(record.created_at)}</p>
                      <p className="text-[9px] text-[#8A8A8A]/60 mt-0.5 flex items-center justify-end gap-1"><Clock size={9} />{formatDateTime(record.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]/40">
              <p className="text-[10px] text-[#8A8A8A]">Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#8A8A8A] hover:text-white text-[11px] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-[#2A2A2A]"><ChevronLeft size={12} />Anterior</button>
                <span className="text-[11px] text-[#8A8A8A] tabular-nums">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-[#8A8A8A] hover:text-white text-[11px] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-[#2A2A2A]">Próxima<ChevronRight size={12} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
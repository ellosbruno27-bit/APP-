import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { corretores, formatCurrency, formatDateShort, getLandingPageById, servicoLabels } from "@/lib/data";
import type { Lead } from "@/lib/data";
import {
  loadLeads,
  loadBrokerStates,
  saveBrokerStates,
  loadQueue,
  assignLeadToQueue,
  acceptAssignment,
  expireAssignment,
  loadParceiros,
  type QueueAssignment,
  type BrokerState,
  type BrokerStatus,
} from "@/lib/store";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Play,
  Volume2,
  VolumeX,
  RefreshCw,
  UserCheck,
  Timer,
  ArrowRight,
  Building2,
} from "lucide-react";

const SLA_SECONDS = 600; // 10 minutes

/** Play a short notification beep using Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.65);
  } catch {
    // Audio not available
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getElapsedSeconds(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
}

const statusColors: Record<BrokerStatus, { bg: string; text: string; label: string }> = {
  disponivel: { bg: "rgba(34,197,94,0.15)", text: "#22C55E", label: "Disponível" },
  ocupado: { bg: "rgba(212,175,55,0.15)", text: "#D4AF37", label: "Ocupado" },
  offline: { bg: "rgba(148,163,184,0.15)", text: "#94A3B8", label: "Offline" },
};

export default function FilaAtendimento() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [brokerStates, setBrokerStates] = useState<BrokerState[]>([]);
  const [queue, setQueue] = useState<QueueAssignment[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tick, setTick] = useState(0);
  const lastSoundRef = useRef<string | null>(null);

  // Load initial data
  const refresh = useCallback(() => {
    setLeads(loadLeads());
    setBrokerStates(loadBrokerStates());
    setQueue(loadQueue());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Tick every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      // Check for expired assignments
      const currentQueue = loadQueue();
      let changed = false;
      currentQueue.forEach((q) => {
        if (q.status === "pendente") {
          const elapsed = getElapsedSeconds(q.assignedAt);
          if (elapsed >= q.slaSeconds) {
            expireAssignment(q.id);
            changed = true;
          }
        }
      });
      if (changed) {
        setQueue(loadQueue());
        setBrokerStates(loadBrokerStates());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play sound when new pending assignment appears
  useEffect(() => {
    const pending = queue.filter((q) => q.status === "pendente");
    if (pending.length > 0 && soundEnabled) {
      const latestId = pending[0].id;
      if (lastSoundRef.current !== latestId) {
        lastSoundRef.current = latestId;
        playNotificationSound();
      }
    }
  }, [queue, soundEnabled]);

  const unassignedLeads = leads.filter(
    (l) => l.status === "novo" && !queue.some((q) => q.leadId === l.id && (q.status === "pendente" || q.status === "aceito"))
  );

  const pendingAssignments = queue.filter((q) => q.status === "pendente");
  const acceptedAssignments = queue.filter((q) => q.status === "aceito");
  const expiredAssignments = queue.filter((q) => q.status === "expirado").slice(0, 10);

  const handleAssignLead = (leadId: string) => {
    const result = assignLeadToQueue(leadId);
    if (result && soundEnabled) {
      playNotificationSound();
    }
    refresh();
  };

  const handleAccept = (assignmentId: string) => {
    acceptAssignment(assignmentId);
    refresh();
  };

  const handleToggleBrokerStatus = (corretorId: string) => {
    const current = brokerStates.find((s) => s.corretorId === corretorId);
    const cycle: BrokerStatus[] = ["disponivel", "ocupado", "offline"];
    const currentIdx = cycle.indexOf(current?.status || "offline");
    const nextStatus = cycle[(currentIdx + 1) % cycle.length];
    const updated = brokerStates.map((s) =>
      s.corretorId === corretorId ? { ...s, status: nextStatus } : s
    );
    saveBrokerStates(updated);
    setBrokerStates(updated);
  };

  const handleAutoAssignAll = () => {
    unassignedLeads.forEach((lead) => {
      assignLeadToQueue(lead.id);
    });
    refresh();
  };

  const getLeadById = (id: string) => leads.find((l) => l.id === id);
  const getCorretorById = (id: string) => corretores.find((c) => c.id === id);
  const parceiros = useMemo(() => loadParceiros(), []);

  // Force re-render with tick for countdown
  void tick;

  return (
    <div className="space-y-6">
      {/* Parceiros Slider */}
      {parceiros.length > 0 && (
        <div className="relative rounded-xl p-3 border border-[#D4AF37]/10 bg-[#111827]/60 backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider">Parceiros</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {parceiros.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/15 bg-[#D4AF37]/5 flex-shrink-0"
              >
                <span className="text-xs">{p.tipo === "banco" ? "🏦" : "📋"}</span>
                <span className="text-[10px] font-semibold text-[#D4AF37] whitespace-nowrap">{p.nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Zap size={24} className="text-[#D4AF37]" />
            Fila de Atendimento
          </h2>
          <p className="text-sm text-[#94A3B8]">
            Distribuição automática Round-Robin • SLA de 10 minutos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? "border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/10"
                : "border-[#1E293B] text-[#94A3B8] bg-[#111827]"
            }`}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={refresh}
            className="p-2 rounded-lg border border-[#1E293B] text-[#94A3B8] bg-[#111827] hover:text-white transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={18} />
          </button>
          {unassignedLeads.length > 0 && (
            <button
              onClick={handleAutoAssignAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] text-[#0F172A] text-sm font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
            >
              <Play size={16} />
              Distribuir Todos ({unassignedLeads.length})
            </button>
          )}
        </div>
      </div>

      {/* Broker Status Panel */}
      <div className="bg-[#111827]/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={18} className="text-[#D4AF37]" />
          Painel de Corretores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {corretores.map((c) => {
            const state = brokerStates.find((s) => s.corretorId === c.id);
            const st = state?.status || "offline";
            const colors = statusColors[st];
            const activeAssignment = pendingAssignments.find((q) => q.corretorId === c.id);
            const acceptedCount = acceptedAssignments.filter((q) => q.corretorId === c.id).length;

            return (
              <div
                key={c.id}
                className={`relative p-4 rounded-xl border transition-all duration-300 ${
                  activeAssignment
                    ? "border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-pulse-gold"
                    : "border-[#1E293B] hover:border-[#334155]"
                }`}
                style={{ backgroundColor: "rgba(15,23,42,0.6)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-xs font-bold flex-shrink-0">
                    {c.nome.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{c.nome}</p>
                    <p className="text-[10px] text-[#94A3B8]">{acceptedCount} aceitos hoje</p>
                  </div>
                </div>

                {/* Status Badge - Clickable */}
                <button
                  onClick={() => handleToggleBrokerStatus(c.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.text }} />
                  {colors.label}
                </button>

                {/* Active Assignment Info */}
                {activeAssignment && (
                  <div className="mt-3 p-2 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                    <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] font-semibold mb-1">
                      <Timer size={12} />
                      Lead em espera
                    </div>
                    <p className="text-xs text-white truncate">
                      {getLeadById(activeAssignment.leadId)?.nome || "—"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#94A3B8]">
                        {formatCurrency(getLeadById(activeAssignment.leadId)?.valorPretendido || 0)}
                      </span>
                      <CountdownBadge assignedAt={activeAssignment.assignedAt} sla={SLA_SECONDS} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Assignments - Urgent */}
      {pendingAssignments.length > 0 && (
        <div className="bg-[#111827]/80 backdrop-blur-md border border-[#D4AF37]/30 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            Aguardando Aceite ({pendingAssignments.length})
          </h3>
          <div className="space-y-3">
            {pendingAssignments.map((assignment) => {
              const lead = getLeadById(assignment.leadId);
              const corretor = getCorretorById(assignment.corretorId);
              const lp = lead ? getLandingPageById(lead.landingPageId) : null;
              const elapsed = getElapsedSeconds(assignment.assignedAt);
              const remaining = Math.max(0, assignment.slaSeconds - elapsed);
              const urgency = remaining < 120; // less than 2 min

              return (
                <div
                  key={assignment.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-500 ${
                    urgency
                      ? "border-[#EF4444]/50 bg-[#EF4444]/5 animate-pulse-gold"
                      : "border-[#D4AF37]/30 bg-[#D4AF37]/5 animate-pulse-gold"
                  }`}
                >
                  {/* Lead Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <Zap size={18} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{lead?.nome || "—"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
                        <span>{lead ? servicoLabels[lead.servico] : "—"}</span>
                        <span>•</span>
                        <span className="text-[#D4AF37] font-semibold">{formatCurrency(lead?.valorPretendido || 0)}</span>
                      </div>
                      {lp && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ backgroundColor: lp.cor + "20", color: lp.cor }}
                        >
                          {lp.nome}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={16} className="text-[#D4AF37] hidden sm:block flex-shrink-0" />

                  {/* Corretor */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-[10px] font-bold">
                      {corretor?.nome.split(" ").map((n) => n[0]).join("") || "?"}
                    </div>
                    <span className="text-sm text-white font-medium">{corretor?.nome || "—"}</span>
                  </div>

                  {/* Countdown + Accept */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CountdownBadge assignedAt={assignment.assignedAt} sla={SLA_SECONDS} large />
                    <button
                      onClick={() => handleAccept(assignment.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] text-[#0F172A] text-xs font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                    >
                      <CheckCircle2 size={14} />
                      Aceitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unassigned Leads */}
      {unassignedLeads.length > 0 && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-[#94A3B8]" />
            Leads Não Distribuídos ({unassignedLeads.length})
          </h3>
          <div className="space-y-2">
            {unassignedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50 hover:bg-[#1E293B] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1E293B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {lead.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{lead.nome}</p>
                    <p className="text-xs text-[#94A3B8]">{servicoLabels[lead.servico]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-[#D4AF37]">{formatCurrency(lead.valorPretendido)}</span>
                  <span className="text-xs text-[#94A3B8]">{formatDateShort(lead.criadoEm)}</span>
                  <button
                    onClick={() => handleAssignLead(lead.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/20 transition-colors"
                  >
                    <UserCheck size={14} />
                    Distribuir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Assignments - Manager View */}
      {acceptedAssignments.length > 0 && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#22C55E]" />
            Leads Aceitos ({acceptedAssignments.length})
          </h3>
          <div className="space-y-2">
            {acceptedAssignments.map((assignment) => {
              const lead = getLeadById(assignment.leadId);
              const corretor = getCorretorById(assignment.corretorId);
              return (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{lead?.nome || "—"}</p>
                      <p className="text-xs text-[#94A3B8]">{lead ? servicoLabels[lead.servico] : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-[8px] font-bold">
                        {corretor?.nome.split(" ").map((n) => n[0]).join("") || "?"}
                      </div>
                      <span className="text-xs text-white">{corretor?.nome || "—"}</span>
                    </div>
                    <span className="text-xs text-[#D4AF37] font-semibold">{formatCurrency(lead?.valorPretendido || 0)}</span>
                    {assignment.acceptedAt && (
                      <span className="text-[10px] text-[#22C55E]">
                        Aceito {formatDateShort(assignment.acceptedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired History */}
      {expiredAssignments.length > 0 && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <XCircle size={18} className="text-[#EF4444]" />
            Expirados Recentes ({expiredAssignments.length})
          </h3>
          <div className="space-y-2">
            {expiredAssignments.map((assignment) => {
              const lead = getLeadById(assignment.leadId);
              const corretor = getCorretorById(assignment.corretorId);
              return (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50 opacity-60"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{lead?.nome || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#EF4444]">Expirou com {corretor?.nome || "—"}</span>
                    <span className="text-xs text-[#94A3B8]">{formatDateShort(assignment.assignedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingAssignments.length === 0 && unassignedLeads.length === 0 && acceptedAssignments.length === 0 && (
        <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
          <CheckCircle2 size={48} className="mx-auto text-[#22C55E] mb-4" />
          <p className="text-white font-semibold text-lg">Fila em dia! 🎉</p>
          <p className="text-[#94A3B8] text-sm mt-1">Todos os leads foram distribuídos e aceitos</p>
        </div>
      )}
    </div>
  );
}

/** Countdown badge component */
function CountdownBadge({ assignedAt, sla, large }: { assignedAt: string; sla: number; large?: boolean }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = getElapsedSeconds(assignedAt);
  const remaining = Math.max(0, sla - elapsed);
  const urgency = remaining < 120;
  const critical = remaining < 60;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-mono font-bold ${
        large ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-[10px]"
      } ${
        critical
          ? "bg-[#EF4444]/15 text-[#EF4444]"
          : urgency
            ? "bg-[#F59E0B]/15 text-[#F59E0B]"
            : "bg-[#D4AF37]/10 text-[#D4AF37]"
      }`}
    >
      <Timer size={large ? 14 : 10} />
      {formatCountdown(remaining)}
    </span>
  );
}
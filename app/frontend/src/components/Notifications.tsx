import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  X,
  UserPlus,
  Clock,
  CalendarClock,
  CheckCheck,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  leads,
  getLandingPageById,
  getCorretorById,
  formatCurrency,
} from "@/lib/data";
import type { Lead } from "@/lib/data";
import { useNotificationSound, isInDNDPeriod } from "@/lib/useNotificationSound";
import { createClient } from "@metagptx/web-sdk";

const client = createClient();

export type NotificationType = "novo_lead" | "sem_atendimento" | "follow_up";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  leadId: string;
  priority: "alta" | "media" | "baixa";
}

interface NotificationsProps {
  onNavigateToLead?: (leadId: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function generateNotifications(leadsList: Lead[]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  leadsList.forEach((lead) => {
    const lp = getLandingPageById(lead.landingPageId);
    const corretor = lead.corretorId ? getCorretorById(lead.corretorId) : null;

    if (lead.status === "novo") {
      notifications.push({
        id: `notif-novo-${lead.id}`,
        type: "novo_lead",
        title: "Novo lead recebido",
        message: `${lead.nome} — ${formatCurrency(lead.valorPretendido)} via ${lp?.nome || "Landing Page"}`,
        time: lead.criadoEm,
        read: false,
        leadId: lead.id,
        priority: lead.prioridade === "alto" ? "alta" : lead.prioridade === "medio" ? "media" : "baixa",
      });
    }

    const lastInteraction = new Date(lead.ultimaInteracao);
    const hoursSinceInteraction = (now.getTime() - lastInteraction.getTime()) / 3600000;

    if (
      hoursSinceInteraction > 24 &&
      lead.status !== "conversao" &&
      lead.status !== "novo"
    ) {
      notifications.push({
        id: `notif-sem-atend-${lead.id}`,
        type: "sem_atendimento",
        title: "Lead sem atendimento há +24h",
        message: `${lead.nome} — último contato há ${Math.floor(hoursSinceInteraction)}h${corretor ? ` (${corretor.nome})` : ""}`,
        time: lead.ultimaInteracao,
        read: false,
        leadId: lead.id,
        priority: "alta",
      });
    }

    if (
      (lead.status === "em_contato" || lead.status === "simulacao_enviada") &&
      hoursSinceInteraction > 12 &&
      hoursSinceInteraction <= 24
    ) {
      notifications.push({
        id: `notif-followup-${lead.id}`,
        type: "follow_up",
        title: "Follow-up pendente",
        message: `${lead.nome} — ${lead.status === "simulacao_enviada" ? "Simulação enviada" : "Em contato"} há ${Math.floor(hoursSinceInteraction)}h`,
        time: lead.ultimaInteracao,
        read: false,
        leadId: lead.id,
        priority: "media",
      });
    }
  });

  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  notifications.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return notifications;
}

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case "novo_lead":
      return <UserPlus size={16} />;
    case "sem_atendimento":
      return <AlertTriangle size={16} />;
    case "follow_up":
      return <CalendarClock size={16} />;
  }
}

function getNotifColor(type: NotificationType) {
  switch (type) {
    case "novo_lead":
      return { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]", shadow: "#3B82F6" };
    case "sem_atendimento":
      return { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]", dot: "bg-[#EF4444]", shadow: "#EF4444" };
    case "follow_up":
      return { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", dot: "bg-[#F59E0B]", shadow: "#F59E0B" };
  }
}

function getPriorityLabel(priority: "alta" | "media" | "baixa") {
  switch (priority) {
    case "alta":
      return { label: "Urgente", color: "text-[#EF4444] bg-[#EF4444]/10" };
    case "media":
      return { label: "Médio", color: "text-[#F59E0B] bg-[#F59E0B]/10" };
    case "baixa":
      return { label: "Baixo", color: "text-[#8A8A8A] bg-[#8A8A8A]/10" };
  }
}

function getSoundTypeForNotification(type: NotificationType): string {
  switch (type) {
    case "novo_lead": return "apito";
    case "sem_atendimento": return "sirene";
    case "follow_up": return "campainha";
  }
}

export default function Notifications({ onNavigateToLead }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<NotificationType | "todos">("todos");
  const panelRef = useRef<HTMLDivElement>(null);
  const { checkAndPlay, enabled: soundEnabled, isDND, dndSchedule } = useNotificationSound();
  const loggedIdsRef = useRef<Set<string>>(new Set());

  const allNotifications = useMemo(() => generateNotifications(leads), []);

  const logNotification = useCallback(async (notif: Notification) => {
    if (loggedIdsRef.current.has(notif.id)) return;
    loggedIdsRef.current.add(notif.id);

    const dndActive = isInDNDPeriod(dndSchedule);
    const soundPlayed = soundEnabled && !dndActive;

    try {
      await client.entities.notification_history.create({
        data: {
          notification_type: notif.type,
          title: notif.title,
          message: notif.message,
          lead_id: notif.leadId,
          priority: notif.priority,
          sound_played: soundPlayed,
          silenced_by_dnd: dndActive,
          sound_type: getSoundTypeForNotification(notif.type),
          created_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Failed to log notification:", err);
      loggedIdsRef.current.delete(notif.id);
    }
  }, [soundEnabled, dndSchedule]);

  useEffect(() => {
    allNotifications.forEach((notif) => {
      logNotification(notif);
    });
  }, [allNotifications, logNotification]);

  const notifications = useMemo(() => {
    return allNotifications.map((n) => ({
      ...n,
      read: readIds.has(n.id),
    }));
  }, [allNotifications, readIds]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "todos") return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    checkAndPlay(unreadCount);
  }, [unreadCount, checkAndPlay]);

  const countByType = useMemo(() => {
    return {
      novo_lead: notifications.filter((n) => n.type === "novo_lead" && !n.read).length,
      sem_atendimento: notifications.filter((n) => n.type === "sem_atendimento" && !n.read).length,
      follow_up: notifications.filter((n) => n.type === "follow_up" && !n.read).length,
    };
  }, [notifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (onNavigateToLead) {
      onNavigateToLead(notif.leadId);
    }
    setIsOpen(false);
  };

  const filters: { key: NotificationType | "todos"; label: string; count?: number }[] = [
    { key: "todos", label: "Todas", count: unreadCount },
    { key: "novo_lead", label: "Novos", count: countByType.novo_lead },
    { key: "sem_atendimento", label: "Sem Atend.", count: countByType.sem_atendimento },
    { key: "follow_up", label: "Follow-up", count: countByType.follow_up },
  ];

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? "bg-[#D4A853]/10 text-[#D4A853]"
            : "text-[#8A8A8A] hover:text-white hover:bg-[#1C1C1C]"
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-[#EF4444] text-white text-[10px] font-bold rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#EF4444]/15 text-[#EF4444] text-[10px] font-bold rounded-full">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[10px] text-[#D4A853] hover:text-[#C49B45] font-medium transition-colors"
                  >
                    <CheckCheck size={12} />
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#8A8A8A] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                    activeFilter === f.key
                      ? "bg-[#D4A853]/10 text-[#D4A853]"
                      : "text-[#8A8A8A] hover:text-white hover:bg-[#1C1C1C]"
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span
                      className={`min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full text-[9px] font-bold ${
                        activeFilter === f.key
                          ? "bg-[#D4A853]/20 text-[#D4A853]"
                          : "bg-[#2A2A2A] text-[#8A8A8A]"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-[#2A2A2A] mb-3" />
                <p className="text-sm text-[#8A8A8A]">Nenhuma notificação</p>
                <p className="text-xs text-[#8A8A8A]/60 mt-1">Tudo em dia! 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2A2A2A]/50">
                {filteredNotifications.map((notif) => {
                  const colors = getNotifColor(notif.type);
                  const priorityInfo = getPriorityLabel(notif.priority);
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left p-4 hover:bg-[#1C1C1C]/50 transition-all duration-200 group ${
                        !notif.read ? "bg-[#1C1C1C]/20" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                          {getNotifIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-medium ${!notif.read ? "text-white" : "text-[#8A8A8A]"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} style={{ boxShadow: `0 0 6px ${colors.shadow}` }} />
                            )}
                          </div>
                          <p className="text-xs text-[#8A8A8A] truncate">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-[#8A8A8A]/60">
                              <Clock size={10} />
                              {timeAgo(notif.time)}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          size={14}
                          className="flex-shrink-0 text-[#8A8A8A]/30 group-hover:text-[#D4A853] transition-colors mt-2"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-[#2A2A2A] text-center">
              <p className="text-[10px] text-[#8A8A8A]/60">
                {notifications.length} notificação(ões) • {unreadCount} não lida(s)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, CheckCheck, X, Trash2 } from "lucide-react";
import {
  loadInAppNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  requestNotificationPermission,
  loadNotificationSettings,
  saveNotificationSettings,
  type InAppNotification,
} from "@/lib/notifications";

interface NotificationBellProps {
  onNavigateToLeads?: () => void;
}

export default function NotificationBell({ onNavigateToLeads }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(() => {
    setNotifications(loadInAppNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    refreshNotifications();

    // Check permission state
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState("unsupported");
    }

    // Listen for new notifications
    const handleNewNotification = () => {
      refreshNotifications();
    };

    // Listen for service worker notification clicks
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        onNavigateToLeads?.();
      }
    };

    window.addEventListener("cbmaximo:new-notification", handleNewNotification);
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    // Poll for updates every 5 seconds
    const interval = setInterval(refreshNotifications, 5000);

    return () => {
      window.removeEventListener("cbmaximo:new-notification", handleNewNotification);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      clearInterval(interval);
    };
  }, [refreshNotifications, onNavigateToLeads]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleEnablePush = async () => {
    const permission = await requestNotificationPermission();
    setPermissionState(permission);
    if (permission === "granted") {
      const settings = loadNotificationSettings();
      settings.pushEnabled = true;
      settings.pushPermission = "granted";
      saveNotificationSettings(settings);
    }
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    refreshNotifications();
  };

  const handleNotificationClick = (notif: InAppNotification) => {
    handleMarkRead(notif.id);
    onNavigateToLeads?.();
    setIsOpen(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  };

  const prioridadeColor: Record<string, string> = {
    alto: "#EF4444",
    medio: "#F59E0B",
    baixo: "#94A3B8",
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#1E293B] transition-all"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-[#EF4444] text-white text-[10px] font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl z-[60] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#D4AF37]" />
              <h3 className="text-white font-bold text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-bold rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#1E293B] transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Permission Banner */}
          {permissionState !== "granted" && permissionState !== "unsupported" && (
            <div className="px-4 py-3 bg-[#D4AF37]/5 border-b border-[#1E293B]">
              <p className="text-xs text-[#94A3B8] mb-2">
                Ative as notificações push para ser alertado quando novos leads chegarem.
              </p>
              <button
                onClick={handleEnablePush}
                className="w-full px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded-lg transition-colors border border-[#D4AF37]/20"
              >
                🔔 Ativar Notificações Push
              </button>
              {permissionState === "denied" && (
                <p className="text-[10px] text-[#EF4444] mt-1.5">
                  Notificações bloqueadas pelo navegador. Altere nas configurações do navegador.
                </p>
              )}
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={32} className="mx-auto text-[#1E293B] mb-3" />
                <p className="text-sm text-[#94A3B8]">Nenhuma notificação</p>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Novos leads aparecerão aqui automaticamente
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1E293B]/50 hover:bg-[#1E293B]/50 transition-colors ${
                    !notif.read ? "bg-[#D4AF37]/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority indicator */}
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: prioridadeColor[notif.prioridade] || "#94A3B8" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-medium truncate ${!notif.read ? "text-white" : "text-[#94A3B8]"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5 truncate">{notif.body}</p>
                      <p className="text-[10px] text-[#475569] mt-1">{formatTime(notif.timestamp)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#1E293B] text-center">
              <button
                onClick={() => {
                  onNavigateToLeads?.();
                  setIsOpen(false);
                }}
                className="text-xs text-[#D4AF37] hover:text-[#FDE68A] font-medium transition-colors"
              >
                Ver todos os leads →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
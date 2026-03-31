// Push Notification utilities for CentralBankMaximo CRM

const NOTIFICATION_SETTINGS_KEY = "cbmaximo_notification_settings";

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  pushPermission: NotificationPermission | "unsupported";
  filterAlto: boolean;
  filterMedio: boolean;
  filterBaixo: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  soundEnabled: true,
  pushPermission: "default",
  filterAlto: true,
  filterMedio: true,
  filterBaixo: true,
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NotificationSettings;
      // Sync permission with actual browser state
      if ("Notification" in window) {
        parsed.pushPermission = Notification.permission;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  const settings = { ...DEFAULT_SETTINGS };
  if ("Notification" in window) {
    settings.pushPermission = Notification.permission;
  } else {
    settings.pushPermission = "unsupported";
  }
  return settings;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  const permission = await Notification.requestPermission();
  return permission;
}

const origemLabels: Record<string, string> = {
  google_ads: "Google Ads",
  facebook_ads: "Facebook Ads",
  rd_station: "RD Station",
  organico: "Orgânico",
};

const servicoLabels: Record<string, string> = {
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

const prioridadeEmoji: Record<string, string> = {
  alto: "🔥",
  medio: "⚡",
  baixo: "📋",
};

export interface LeadNotificationData {
  nome: string;
  origem: string;
  servico: string;
  prioridade: string;
  valorPretendido?: number;
}

/**
 * Send a browser push notification for a new lead.
 * Uses the Service Worker if registered, otherwise falls back to Notification API directly.
 */
export async function sendLeadNotification(lead: LeadNotificationData): Promise<boolean> {
  const settings = loadNotificationSettings();

  // Check if push is enabled in settings
  if (!settings.pushEnabled) return false;

  // Check priority filter
  if (lead.prioridade === "alto" && !settings.filterAlto) return false;
  if (lead.prioridade === "medio" && !settings.filterMedio) return false;
  if (lead.prioridade === "baixo" && !settings.filterBaixo) return false;

  // Check browser support
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const emoji = prioridadeEmoji[lead.prioridade] || "📌";
  const origemLabel = origemLabels[lead.origem] || lead.origem;
  const servicoLabel = servicoLabels[lead.servico] || lead.servico;

  const title = `${emoji} Novo Lead: ${lead.nome}`;
  const body = `${servicoLabel} via ${origemLabel}${
    lead.valorPretendido
      ? ` — R$ ${lead.valorPretendido.toLocaleString("pt-BR")}`
      : ""
  }`;

  const notificationOptions: NotificationOptions = {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: `lead-${Date.now()}`,
    data: { url: "/?page=leads" },
    requireInteraction: lead.prioridade === "alto",
    silent: !settings.soundEnabled,
  };

  try {
    // Try via Service Worker first
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to direct Notification API
      new Notification(title, notificationOptions);
    }
    return true;
  } catch {
    // Fallback to direct Notification API
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

// ── In-app notification queue (for the bell icon) ──
const IN_APP_NOTIFICATIONS_KEY = "cbmaximo_in_app_notifications";

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  leadId?: string;
  prioridade: string;
}

export function loadInAppNotifications(): InAppNotification[] {
  try {
    const stored = localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as InAppNotification[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveInAppNotifications(notifications: InAppNotification[]): void {
  try {
    // Keep only the latest 50 notifications
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full
  }
}

export function addInAppNotification(lead: LeadNotificationData & { id?: string }): InAppNotification[] {
  const emoji = prioridadeEmoji[lead.prioridade] || "📌";
  const origemLabel = origemLabels[lead.origem] || lead.origem;
  const servicoLabel = servicoLabels[lead.servico] || lead.servico;

  const notification: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: `${emoji} Novo Lead: ${lead.nome}`,
    body: `${servicoLabel} via ${origemLabel}`,
    timestamp: new Date().toISOString(),
    read: false,
    leadId: lead.id,
    prioridade: lead.prioridade,
  };

  const current = loadInAppNotifications();
  current.unshift(notification);
  saveInAppNotifications(current);

  // Dispatch custom event so UI components can react
  window.dispatchEvent(new CustomEvent("cbmaximo:new-notification", { detail: notification }));

  return current;
}

export function markNotificationRead(id: string): InAppNotification[] {
  const current = loadInAppNotifications();
  const idx = current.findIndex((n) => n.id === id);
  if (idx !== -1) {
    current[idx].read = true;
  }
  saveInAppNotifications(current);
  return current;
}

export function markAllNotificationsRead(): InAppNotification[] {
  const current = loadInAppNotifications();
  current.forEach((n) => { n.read = true; });
  saveInAppNotifications(current);
  return current;
}

export function getUnreadCount(): number {
  return loadInAppNotifications().filter((n) => !n.read).length;
}
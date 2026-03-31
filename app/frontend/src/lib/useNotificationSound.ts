import { useState, useCallback, useEffect, useRef, useMemo } from "react";

const STORAGE_KEY = "crm_notification_sound_enabled";
const DND_ENABLED_KEY = "crm_dnd_enabled";
const DND_START_KEY = "crm_dnd_start";
const DND_END_KEY = "crm_dnd_end";
const VOLUME_KEY = "crm_notification_volume";

export type NotificationSoundType = "novo_lead" | "sem_atendimento" | "follow_up";
export type SoundPreviewType = "buzina" | "apito" | "sirene" | "campainha";

export interface DNDSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

/**
 * 📳 Vibration patterns for each sound type.
 */
const VIBRATION_PATTERNS: Record<SoundPreviewType, number[]> = {
  buzina: [500, 100, 300],
  apito: [150, 80, 150],
  sirene: [200, 100, 200, 100, 200, 100, 200],
  campainha: [100, 200, 300],
};

const NOTIFICATION_VIBRATION: Record<NotificationSoundType, number[]> = {
  novo_lead: VIBRATION_PATTERNS.apito,
  sem_atendimento: VIBRATION_PATTERNS.sirene,
  follow_up: VIBRATION_PATTERNS.campainha,
};

/** Global volume level (0..1). Updated by the hook. */
let _globalVolume = (() => {
  try {
    const stored = localStorage.getItem(VOLUME_KEY);
    return stored !== null ? Math.max(0, Math.min(1, parseFloat(stored))) : 1;
  } catch {
    return 1;
  }
})();

function vibrate(pattern: number[]) {
  try {
    if (navigator && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // silently ignore
  }
}

/**
 * 🌙 Check if current time falls within the DND schedule.
 */
export function isInDNDPeriod(schedule: DNDSchedule): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = schedule.startTime.split(":").map(Number);
  const [endH, endM] = schedule.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export function formatDNDSchedule(schedule: DNDSchedule): string {
  if (!schedule.enabled) return "Desativado";
  return `${schedule.startTime} às ${schedule.endTime}`;
}

export function getDNDStatusText(schedule: DNDSchedule): string {
  if (!schedule.enabled) return "";
  const active = isInDNDPeriod(schedule);
  if (active) {
    return `🌙 Silencioso até ${schedule.endTime}`;
  }
  return `🔔 Ativo — silencia às ${schedule.startTime}`;
}

// ─── Sound Functions (volume-aware) ───

/** Helper: scale a gain value by the global volume */
function v(gain: number): number {
  return gain * _globalVolume;
}

function playBuzina() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.linearRampToValueAtTime(140, t + 0.6);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(v(1.0), t + 0.05);
    gain1.gain.setValueAtTime(v(1.0), t + 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.7);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(300, t);
    osc2.frequency.linearRampToValueAtTime(280, t + 0.6);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(v(0.5), t + 0.05);
    gain2.gain.setValueAtTime(v(0.5), t + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.7);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(75, t);
    gain3.gain.setValueAtTime(0, t);
    gain3.gain.linearRampToValueAtTime(v(0.8), t + 0.05);
    gain3.gain.setValueAtTime(v(0.8), t + 0.4);
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(t);
    osc3.stop(t + 0.7);

    setTimeout(() => ctx.close(), 800);
  } catch {
    // silently ignore
  }
  vibrate(VIBRATION_PATTERNS.buzina);
}

function playApito() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1800, t);
    osc1.frequency.linearRampToValueAtTime(2400, t + 0.08);
    osc1.frequency.setValueAtTime(2400, t + 0.25);
    osc1.frequency.linearRampToValueAtTime(2000, t + 0.4);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(v(1.0), t + 0.03);
    gain1.gain.setValueAtTime(v(1.0), t + 0.3);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(3600, t);
    osc2.frequency.linearRampToValueAtTime(4800, t + 0.08);
    osc2.frequency.setValueAtTime(4800, t + 0.25);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(v(0.3), t + 0.03);
    gain2.gain.setValueAtTime(v(0.3), t + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.45);

    setTimeout(() => ctx.close(), 600);
  } catch {
    // silently ignore
  }
  vibrate(VIBRATION_PATTERNS.apito);
}

function playSirene() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.25);
    osc.frequency.linearRampToValueAtTime(600, t + 0.5);
    osc.frequency.linearRampToValueAtTime(900, t + 0.75);
    osc.frequency.linearRampToValueAtTime(600, t + 1.0);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(v(1.0), t + 0.05);
    gain.gain.setValueAtTime(v(1.0), t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.1);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1200, t);
    osc2.frequency.linearRampToValueAtTime(1800, t + 0.25);
    osc2.frequency.linearRampToValueAtTime(1200, t + 0.5);
    osc2.frequency.linearRampToValueAtTime(1800, t + 0.75);
    osc2.frequency.linearRampToValueAtTime(1200, t + 1.0);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(v(0.4), t + 0.05);
    gain2.gain.setValueAtTime(v(0.4), t + 0.8);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 1.1);

    setTimeout(() => ctx.close(), 1200);
  } catch {
    // silently ignore
  }
  vibrate(VIBRATION_PATTERNS.sirene);
}

function playCampainha() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(830, t);
    gain1.gain.setValueAtTime(v(1.0), t);
    gain1.gain.exponentialRampToValueAtTime(v(0.15), t + 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.6);

    const osc1h = ctx.createOscillator();
    const gain1h = ctx.createGain();
    osc1h.type = "sine";
    osc1h.frequency.setValueAtTime(1660, t);
    gain1h.gain.setValueAtTime(v(0.4), t);
    gain1h.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc1h.connect(gain1h);
    gain1h.connect(ctx.destination);
    osc1h.start(t);
    osc1h.stop(t + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(622, t + 0.35);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(v(1.0), t + 0.35);
    gain2.gain.exponentialRampToValueAtTime(v(0.15), t + 0.75);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.35);
    osc2.stop(t + 1.0);

    const osc2h = ctx.createOscillator();
    const gain2h = ctx.createGain();
    osc2h.type = "sine";
    osc2h.frequency.setValueAtTime(1244, t + 0.35);
    gain2h.gain.setValueAtTime(0, t);
    gain2h.gain.setValueAtTime(v(0.35), t + 0.35);
    gain2h.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc2h.connect(gain2h);
    gain2h.connect(ctx.destination);
    osc2h.start(t + 0.35);
    osc2h.stop(t + 0.65);

    setTimeout(() => ctx.close(), 1100);
  } catch {
    // silently ignore
  }
  vibrate(VIBRATION_PATTERNS.campainha);
}

// ─── Exports ───

export function playNotificationSound(type: NotificationSoundType) {
  switch (type) {
    case "novo_lead":
      playApito();
      break;
    case "sem_atendimento":
      playSirene();
      break;
    case "follow_up":
      playCampainha();
      break;
  }
}

export function playSoundByPreviewType(type: SoundPreviewType) {
  switch (type) {
    case "buzina":
      playBuzina();
      break;
    case "apito":
      playApito();
      break;
    case "sirene":
      playSirene();
      break;
    case "campainha":
      playCampainha();
      break;
  }
}

export function isVibrationSupported(): boolean {
  try {
    return !!(navigator && "vibrate" in navigator);
  } catch {
    return false;
  }
}

export function getVibrationPattern(type: SoundPreviewType): number[] {
  return VIBRATION_PATTERNS[type];
}

export function getNotificationVibrationPattern(type: NotificationSoundType): number[] {
  return NOTIFICATION_VIBRATION[type];
}

// ─── Hook ───

function loadDNDSchedule(): DNDSchedule {
  try {
    return {
      enabled: localStorage.getItem(DND_ENABLED_KEY) === "true",
      startTime: localStorage.getItem(DND_START_KEY) || "19:00",
      endTime: localStorage.getItem(DND_END_KEY) || "07:00",
    };
  } catch {
    return { enabled: false, startTime: "19:00", endTime: "07:00" };
  }
}

function saveDNDSchedule(schedule: DNDSchedule) {
  try {
    localStorage.setItem(DND_ENABLED_KEY, String(schedule.enabled));
    localStorage.setItem(DND_START_KEY, schedule.startTime);
    localStorage.setItem(DND_END_KEY, schedule.endTime);
  } catch {
    // localStorage not available
  }
}

export function useNotificationSound() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(VOLUME_KEY);
      return stored !== null ? Math.max(0, Math.min(1, parseFloat(stored))) : 1;
    } catch {
      return 1;
    }
  });

  const [dndSchedule, setDndSchedule] = useState<DNDSchedule>(loadDNDSchedule);
  const [isDND, setIsDND] = useState(() => isInDNDPeriod(loadDNDSchedule()));
  const prevCountRef = useRef<number | null>(null);

  // Persist sound enabled
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // localStorage not available
    }
  }, [enabled]);

  // Persist volume & sync global
  useEffect(() => {
    _globalVolume = volume;
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      // localStorage not available
    }
  }, [volume]);

  // Persist DND schedule
  useEffect(() => {
    saveDNDSchedule(dndSchedule);
    setIsDND(isInDNDPeriod(dndSchedule));
  }, [dndSchedule]);

  // Check DND status every minute
  useEffect(() => {
    if (!dndSchedule.enabled) {
      setIsDND(false);
      return;
    }
    const interval = setInterval(() => {
      setIsDND(isInDNDPeriod(dndSchedule));
    }, 60_000);
    return () => clearInterval(interval);
  }, [dndSchedule]);

  const canPlay = useMemo(() => enabled && !isDND, [enabled, isDND]);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(Math.max(0, Math.min(1, val)));
  }, []);

  const toggleDND = useCallback(() => {
    setDndSchedule((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setDNDStart = useCallback((time: string) => {
    setDndSchedule((prev) => ({ ...prev, startTime: time }));
  }, []);

  const setDNDEnd = useCallback((time: string) => {
    setDndSchedule((prev) => ({ ...prev, endTime: time }));
  }, []);

  const checkAndPlay = useCallback(
    (currentCount: number) => {
      if (prevCountRef.current !== null && currentCount > prevCountRef.current && canPlay) {
        playApito();
      }
      prevCountRef.current = currentCount;
    },
    [canPlay]
  );

  const playByType = useCallback(
    (type: NotificationSoundType) => {
      if (canPlay) {
        playNotificationSound(type);
      }
    },
    [canPlay]
  );

  const playTest = useCallback((type?: NotificationSoundType) => {
    playNotificationSound(type || "novo_lead");
  }, []);

  const playPreview = useCallback((type: SoundPreviewType) => {
    playSoundByPreviewType(type);
  }, []);

  return {
    enabled,
    toggle,
    volume,
    setVolume,
    canPlay,
    isDND,
    dndSchedule,
    toggleDND,
    setDNDStart,
    setDNDEnd,
    checkAndPlay,
    playByType,
    playTest,
    playPreview,
  };
}
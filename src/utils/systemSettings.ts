export interface SystemSettings {
  referralReward: number;
  referralMinDaysActive: number;
  referralMinTasks: number;
  dailyCheckInBaseReward: number;
  spinCooldownHours: number;
  spinMaxReward: number;
  dailyScratchLimit: number;
  telegramChannelUrl: string;
  telegramGroupUrl: string;
  adminSupportUsername: string;
  howToWorkVideoUrl: string;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  telegramChannelUsername?: string;
  referralLinkFormat?: 'bot_start' | 'mini_app' | 'web_url';
  miniAppShortName?: string;
  customWebUrl?: string;
  notifyOnNewTask?: boolean;
  notifyOnNewVideo?: boolean;
  enabledMethods: {
    bKash: boolean;
    Nagad: boolean;
    Rocket: boolean;
    Binance: boolean;
    Upay: boolean;
    CellFin: boolean;
  };
  updatedAt: number;
}

const STORAGE_KEY = "smart_earning_system_settings";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  referralReward: 20.0,
  referralMinDaysActive: 3,
  referralMinTasks: 20,
  dailyCheckInBaseReward: 2.0,
  spinCooldownHours: 8,
  spinMaxReward: 10.0,
  dailyScratchLimit: 5,
  telegramChannelUrl: "https://t.me/SmartEarningBdOfficial",
  telegramGroupUrl: "https://t.me/SmartEarningBdGroup",
  adminSupportUsername: "@SmartEarningSupport",
  howToWorkVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  telegramBotToken: "",
  telegramBotUsername: "SmartEarning_BDT_bot",
  telegramChannelUsername: "@SmartEarningBdOfficial",
  referralLinkFormat: "web_url",
  miniAppShortName: "app",
  customWebUrl: "https://ais-pre-ggdb4cv4g7cfbb3xlhcvwn-374535181190.asia-southeast1.run.app",
  notifyOnNewTask: true,
  notifyOnNewVideo: true,
  enabledMethods: {
    bKash: true,
    Nagad: true,
    Rocket: true,
    Binance: true,
    Upay: true,
    CellFin: true,
  },
  updatedAt: Date.now(),
};

export function getSystemSettings(): SystemSettings {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...parsed,
          enabledMethods: {
            ...DEFAULT_SYSTEM_SETTINGS.enabledMethods,
            ...(parsed.enabledMethods || {}),
          },
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse system settings from localStorage", e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function saveSystemSettings(settings: SystemSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save system settings", e);
  }

  // Persist to server so all users receive updated settings
  try {
    fetch("/api/system-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to push system settings to server:", err);
  }
}

export async function fetchSystemSettingsFromServer(): Promise<SystemSettings> {
  try {
    const res = await fetch("/api/system-settings");
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        saveSystemSettings(data.settings);
        return data.settings;
      }
    }
  } catch (err) {
    console.warn("Could not fetch system settings from server, using local:", err);
  }
  return getSystemSettings();
}

export function buildReferralLink(referralCode: string): string {
  const sysSettings = getSystemSettings();
  const rawBot = sysSettings.telegramBotUsername || "SmartEarning_BDT_bot";
  const cleanBot = rawBot.replace(/^@/, "").trim() || "SmartEarning_BDT_bot";
  const shortName = (sysSettings.miniAppShortName || "app").trim();
  const linkFormat = sysSettings.referralLinkFormat || "web_url";

  if (linkFormat === 'web_url') {
    const baseUrl = (sysSettings.customWebUrl && sysSettings.customWebUrl.trim())
      ? sysSettings.customWebUrl.trim().replace(/\/$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-ggdb4cv4g7cfbb3xlhcvwn-374535181190.asia-southeast1.run.app');
    return `${baseUrl}?ref=${referralCode}`;
  } else if (linkFormat === 'bot_start') {
    return `https://t.me/${cleanBot}?start=${referralCode}`;
  } else {
    // mini_app (Direct Telegram Mini App Link)
    return `https://t.me/${cleanBot}/${shortName}?startapp=${referralCode}`;
  }
}

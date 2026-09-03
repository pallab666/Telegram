export type AppLanguage = 'bn' | 'en';
export type AppCurrency = 'BDT' | 'USD' | 'INR' | 'EUR';

export interface AppPreferences {
  language: AppLanguage;
  currency: AppCurrency;
  hapticEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface CurrencyConfig {
  code: AppCurrency;
  symbol: string;
  nameBn: string;
  nameEn: string;
  flag: string;
  rateFromBDT: number; // 1 BDT = rate * Currency
}

export const CURRENCY_CONFIGS: Record<AppCurrency, CurrencyConfig> = {
  BDT: {
    code: 'BDT',
    symbol: '৳',
    nameBn: 'বাংলাদেশী টাকা (BDT)',
    nameEn: 'Bangladeshi Taka (BDT)',
    flag: '🇧🇩',
    rateFromBDT: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    nameBn: 'ইউএস ডলার (USD)',
    nameEn: 'US Dollar (USD)',
    flag: '🇺🇸',
    rateFromBDT: 0.0083, // 1 USD ≈ 120 BDT
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    nameBn: 'ভারতীয় রুপি (INR)',
    nameEn: 'Indian Rupee (INR)',
    flag: '🇮🇳',
    rateFromBDT: 0.72, // 1 INR ≈ 1.38 BDT
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    nameBn: 'ইউরো (EUR)',
    nameEn: 'Euro (EUR)',
    flag: '🇪🇺',
    rateFromBDT: 0.0078, // 1 EUR ≈ 128 BDT
  },
};

export const LANGUAGE_OPTIONS: { code: AppLanguage; name: string; nativeName: string; flag: string }[] = [
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

const PREFS_STORAGE_KEY = 'smart_earning_app_preferences';
const ONBOARDING_COMPLETED_KEY = 'smart_earning_initial_setup_done';

export const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'bn',
  currency: 'BDT',
  hapticEnabled: true,
  soundEnabled: true,
  notificationsEnabled: true,
};

export function getAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        language: parsed.language === 'en' ? 'en' : 'bn',
        currency: CURRENCY_CONFIGS[parsed.currency as AppCurrency] ? parsed.currency : 'BDT',
        hapticEnabled: parsed.hapticEnabled !== false,
        soundEnabled: parsed.soundEnabled !== false,
        notificationsEnabled: parsed.notificationsEnabled !== false,
      };
    }
  } catch (e) {
    console.error('Failed to get preferences', e);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Lightweight in-app audio feedback synthesized via Web Audio API
 */
export function playAppSound(type: 'click' | 'reward' | 'win' | 'toggle' = 'click') {
  if (typeof window === 'undefined') return;
  try {
    const prefs = getAppPreferences();
    if (!prefs.soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click' || type === 'toggle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'reward') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.27); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch {
    // ignore audio failure
  }
}

export function saveAppPreferences(prefs: AppPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences', e);
  }
}

export function hasCompletedInitialSetup(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function markInitialSetupCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

/**
 * Format balance according to user currency selection
 */
export function formatMoney(amountInBDT: number, currency: AppCurrency = 'BDT'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.BDT;
  if (currency === 'BDT') {
    return `${config.symbol}${amountInBDT.toFixed(2)}`;
  }
  const converted = amountInBDT * config.rateFromBDT;
  return `${config.symbol}${converted.toFixed(2)}`;
}

/**
 * Simple UI Translations helper
 */
export const TRANSLATIONS = {
  bn: {
    appName: 'স্মার্ট আর্নিং হাব',
    appSub: 'টেলিগ্রাম মিনি অ্যাপ',
    online: 'অনলাইন',
    settings: 'সেটিংস',
    adminPanel: 'অ্যাডমিন প্যানেল',
    adminProtected: 'পাসওয়ার্ড সুরক্ষিত',
    language: 'অ্যাপের ভাষা',
    currency: 'মুদ্রা (Currency)',
    save: 'সেভ করুন',
    continue: 'চালিয়ে যান',
    welcomeTitle: 'স্বাগতম! আপনার ভাষা ও কারেন্সি নির্বাচন করুন',
    welcomeSub: 'অ্যাপটি শুরু করার আগে আপনার পছন্দের ভাষা এবং মুদ্রা নির্বাচন করুন। পরে সেটিংস থেকে পরিবর্তন করতে পারবেন।',
    dailySpin: 'ডেইলি লাকি স্পিন',
    spinNow: 'ফ্রি স্পিন করুন',
    spinCooldown: 'পরবর্তী স্পিন',
    balance: 'বর্তমান ব্যালেন্স',
    withdraw: 'উত্তোলন',
    totalEarned: 'মোট আয়',
    minWithdraw: 'সর্বনিম্ন উত্তোলন',
    changePreference: 'ভাষা ও মুদ্রা পরিবর্তন',
  },
  en: {
    appName: 'Smart Earning Hub',
    appSub: 'Telegram Mini App',
    online: 'Online',
    settings: 'Settings',
    adminPanel: 'Admin Panel',
    adminProtected: 'Password Protected',
    language: 'App Language',
    currency: 'Currency',
    save: 'Save Changes',
    continue: 'Continue',
    welcomeTitle: 'Welcome! Select Language & Currency',
    welcomeSub: 'Please select your preferred language and currency to start. You can change this anytime in Settings.',
    dailySpin: 'Daily Lucky Spin',
    spinNow: 'Spin Now Free',
    spinCooldown: 'Next Spin',
    balance: 'Current Balance',
    withdraw: 'Withdraw',
    totalEarned: 'Total Earned',
    minWithdraw: 'Min Withdraw',
    changePreference: 'Change Language & Currency',
  },
};

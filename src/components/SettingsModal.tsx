import { motion } from 'motion/react';
import React, { useState } from 'react';
import {
  X,
  Globe,
  DollarSign,
  Check,
  Vibrate,
  Volume2,
  VolumeX,
  Bell,
  Send,
  Headphones,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Zap,
  Landmark,
  ArrowUpRight,
} from 'lucide-react';
import { triggerHaptic, openAdLink } from '../utils/telegram';
import {
  AppPreferences,
  AppLanguage,
  AppCurrency,
  CURRENCY_CONFIGS,
  LANGUAGE_OPTIONS,
  formatMoney,
  playAppSound,
} from '../utils/preferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
  onResetData: () => void;
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: AppPreferences) => void;
  onOpenInitialSetup?: () => void;
  onOpenWithdraw?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenGuide,
  onResetData,
  preferences,
  onUpdatePreferences,
  onOpenWithdraw,
}) => {
  if (!isOpen) return null;

  const isBn = preferences.language === 'bn';

  // Local state for interactive features
  const [showFaq, setShowFaq] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleLanguageChange = (lang: AppLanguage) => {
    triggerHaptic('medium');
    playAppSound('toggle');
    onUpdatePreferences({
      ...preferences,
      language: lang,
    });
  };

  const handleCurrencyChange = (currency: AppCurrency) => {
    triggerHaptic('medium');
    playAppSound('toggle');
    onUpdatePreferences({
      ...preferences,
      currency,
    });
  };

  const toggleHapticPref = () => {
    const nextVal = !preferences.hapticEnabled;
    if (nextVal) triggerHaptic('medium');
    playAppSound('toggle');
    onUpdatePreferences({
      ...preferences,
      hapticEnabled: nextVal,
    });
  };

  const toggleSoundPref = () => {
    const nextVal = !preferences.soundEnabled;
    triggerHaptic('light');
    if (nextVal) {
      setTimeout(() => playAppSound('win'), 50);
    }
    onUpdatePreferences({
      ...preferences,
      soundEnabled: nextVal,
    });
  };

  const toggleNotificationPref = () => {
    triggerHaptic('light');
    playAppSound('toggle');
    onUpdatePreferences({
      ...preferences,
      notificationsEnabled: !preferences.notificationsEnabled,
    });
  };

  const handleClearCache = () => {
    triggerHaptic('success');
    playAppSound('win');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[92vh] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {isBn ? 'সেটিংস ও প্রেফারেন্স' : 'Settings & Preferences'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'ভাষা, অডিও, নোটিফিকেশন ও সাপোর্ট' : 'Language, Audio, Alerts & Support'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3.5 bg-slate-50 overflow-y-auto max-h-[78vh]">
          {/* 1. Language Selection */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isBn ? 'অ্যাপের ভাষা (Language)' : 'App Language'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'বাংলা অথবা English নির্বাচন করুন' : 'Select preferred language'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {preferences.language === 'bn' ? 'বাংলা (BN)' : 'English (EN)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = preferences.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/90 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Currency Selection */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isBn ? 'মুদ্রা বা কারেন্সি (Currency)' : 'Display Currency'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'ব্যালেন্স ও উইথড্রল কারেন্সি' : 'Balance & reward conversion'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {CURRENCY_CONFIGS[preferences.currency]?.symbol} {preferences.currency}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
              {(Object.keys(CURRENCY_CONFIGS) as AppCurrency[]).map((curKey) => {
                const cur = CURRENCY_CONFIGS[curKey];
                const active = preferences.currency === curKey;
                return (
                  <button
                    key={curKey}
                    type="button"
                    onClick={() => handleCurrencyChange(curKey)}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      <span>{cur.flag}</span>
                      <span className="font-bold">{cur.code}</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700 mt-0.5">
                      {cur.symbol}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                {isBn ? 'নমুনা রূপান্তর (১০০ ৳):' : 'Preview (100 BDT):'}
              </span>
              <span className="font-bold text-emerald-700 font-mono">
                {formatMoney(100, preferences.currency)}
              </span>
            </div>
          </div>

          {/* Direct Withdraw Action Card */}
          {onOpenWithdraw && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                playAppSound('click');
                onClose();
                onOpenWithdraw();
              }}
              className="w-full p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl flex items-center justify-between shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {isBn ? 'টাকা উত্তোলন (Withdraw Money)' : 'Withdraw Funds'}
                    </h4>
                    <span className="text-[9px] bg-white text-emerald-800 font-black px-1.5 py-0.5 rounded-full">
                      বিকাশ / নগদ
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100">
                    {isBn
                      ? 'সরাসরি বিকাশ, নগদ বা রকেটে ব্যালেন্স ক্যাশআউট করুন'
                      : 'Cash out your balance to bKash, Nagad or Rocket'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-xl border border-white/20">
                <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* 3. Interactive Toggles: Vibration & Sound & Notifications */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              {isBn ? 'ইন্টারেক্টিভ অভিজ্ঞতা ও অ্যালার্ট' : 'Interactive Controls & Alerts'}
            </h4>

            {/* Toggle 1: Haptic Feedback */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Vibrate className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    {isBn ? 'হ্যাপটিক ভাইব্রেশন' : 'Haptic Vibration'}
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'বাটন ক্লিকে মৃদু ভাইব্রেশন' : 'Vibrate on button clicks'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleHapticPref}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.hapticEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.hapticEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Toggle 2: Sound Effects */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    {isBn ? 'ইন-অ্যাপ সাউন্ড এফেক্টস' : 'Sound Effects'}
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'স্পিন ও রিওয়ার্ড জয়ের শব্দ' : 'Chimes on reward & spin win'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSoundPref}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.soundEnabled ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Toggle 3: Daily Task & Spin Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    {isBn ? 'দৈনিক আর্নিং রিমাইন্ডার' : 'Daily Earning Reminder'}
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'ফ্রি স্পিন ও নতুন টাস্কের নোটিশ' : 'Daily spin & task reminders'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleNotificationPref}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. Telegram Community & Support Links */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              {isBn ? 'কমিউনিটি ও হেল্পডেস্ক' : 'Community & Support'}
            </h4>

            {/* Payment Proof Telegram Channel */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                openAdLink('https://t.me/telegram');
              }}
              className="w-full p-2.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-sky-200 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {isBn ? 'পেমেন্ট প্রুফ ও আপডেট চ্যানেল' : 'Official Payment Proof Channel'}
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'সকল সফল বিকাশ ও নগদ পেমেন্ট স্ক্রিনশট' : 'Daily bKash/Nagad cashout proofs'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-600" />
            </button>

            {/* 24/7 Live Support Bot */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                openAdLink('https://t.me/telegram');
              }}
              className="w-full p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {isBn ? '২৪/৭ কাস্টমার সাপোর্ট ও হেল্প' : '24/7 Customer Support'}
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'যেকোনো সমস্যায় দ্রুত মেসেজ করুন' : 'Instant help for withdrawals & tasks'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* 5. Withdrawal Rules & Payment FAQ (Accordion) */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowFaq(!showFaq);
              }}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isBn ? 'পেমেন্ট নিয়মাবলী ও FAQ' : 'Payment Rules & FAQ'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isBn ? 'উত্তোলন সময়, সর্বনিম্ন সীমা ও ফেয়ার রুলস' : 'Payout timelines & fair rules'}
                  </p>
                </div>
              </div>
              {showFaq ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showFaq && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-2 animate-in fade-in">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">⏱️ {isBn ? 'পেমেন্ট সময়:' : 'Payout Time:'}</span>{' '}
                  {isBn
                    ? 'উত্তোলনের আবেদন করার ১ থেকে ১২ ঘণ্টার মধ্যে বিকাশ/নগদে টাকা পৌঁছে যায়।'
                    : 'Withdrawals are processed to bKash/Nagad within 1-12 hours.'}
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">🎯 {isBn ? 'দৈনিক লিমিট:' : 'Daily Limit:'}</span>{' '}
                  {isBn
                    ? 'প্রতিদিন আনলিমিটেড ভিডিও দেখে এবং স্পিন করে আর্ন করতে পারবেন।'
                    : 'Watch unlimited video clips & spin daily to boost your wallet.'}
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">🚫 {isBn ? 'ফেয়ার প্লে নিয়ম:' : 'Fair Play Rules:'}</span>{' '}
                  {isBn
                    ? 'একই ফোনে একাধিক ফেক একাউন্ট বা কোনো ধরনের ভিপিএন ব্যবহার করলে আইডি স্থায়ীভাবে বাতিল হতে পারে।'
                    : 'Multiple accounts on one device or VPN use will result in permanent ban.'}
                </div>
              </div>
            )}
          </div>

          {/* 6. Clear Cache & Refresh Troubleshooting */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isBn ? 'ক্যাশ ক্লিয়ার ও অ্যাপ সিঙ্ক' : 'Clear Cache & Sync App'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isBn ? 'অ্যাপ আটকে গেলে বা স্লো হলে রিফ্রেশ করুন' : 'Fix slow loading or video issues'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                cacheCleared
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cacheCleared ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isBn ? 'সিঙ্কড!' : 'Synced!'}</span>
                </>
              ) : (
                <span>{isBn ? 'ক্লিয়ার' : 'Refresh'}</span>
              )}
            </button>
          </div>

          {/* 7. Bot Setup Guide (Useful for creators & testing) */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
              onOpenGuide();
            }}
            className="w-full p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-200 rounded-2xl flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {isBn ? 'টেলিগ্রাম বট তৈরির পূর্ণ গাইড' : 'Bot Deployment & Setup Guide'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isBn ? 'BotFather ও মেনু বাটন সেটআপ নির্দেশিকা' : 'How to deploy this app to Telegram'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
              {isBn ? 'নির্দেশিকা' : 'Guide'}
            </span>
          </button>

          {/* 8. System Status & Security Badge */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700">
                {isBn ? 'সার্ভার স্ট্যাটাস: সচল ও নিরাপদ' : 'Server Status: Operational'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              v2.2.0 • SSL
            </span>
          </div>

          {/* 9. Collapsed Danger Zone (Data Reset kept safe and tucked away) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
            >
              <span>{isBn ? 'অগ্রসর অপশন (টেস্টিং ডাটা)' : 'Advanced Testing Options'}</span>
              {showDangerZone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDangerZone && (
              <div className="mt-2 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-center space-y-2 animate-in fade-in">
                <p className="text-[10px] text-rose-700">
                  {isBn
                    ? 'সতর্কতা: এটি আপনার লোকাল ব্যালেন্স ও টাস্ক প্রগ্রেস রিসেট করবে।'
                    : 'Warning: This will reset your local balance & earned progress.'}
                </p>
                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onResetData();
                    onClose();
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সব ডেটা রিসেট করুন' : 'Confirm Reset All Data'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};



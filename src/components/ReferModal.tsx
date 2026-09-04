import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Copy,
  Check,
  Send,
  Users,
  UserCheck,
  Crown,
  Gift,
  Hourglass,
  ChevronDown,
  MoreVertical,
  Settings,
  DollarSign,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  CheckSquare,
  AlertCircle,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../utils/telegram";
import { playAppSound } from "../utils/preferences";
import { getSystemSettings } from "../utils/systemSettings";
import { ReferredUser } from "../types";

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  referralsCount: number;
  onlineCount?: number;
  userAvatar?: string;
  onOpenSettings?: () => void;
  language?: 'bn' | 'en';
  onShowToast?: (message: string) => void;
  onClaimMilestone?: (taka: number, videos: number, milestoneFriends: number) => void;
  referrals?: ReferredUser[];
  onAddTestReferral?: () => void;
  onSimulateReferralProgress?: (id: string) => void;
  onNavigate?: (tab: string) => void;
}

export const REWARD_TIERS = [
  {
    friends: 1,
    taka: 50,
    videos: 2,
    btnClass: "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/30",
  },
  {
    friends: 5,
    taka: 100,
    videos: 10,
    btnClass: "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30",
  },
  {
    friends: 10,
    taka: 200,
    videos: 20,
    btnClass: "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30",
  },
  {
    friends: 20,
    taka: 400,
    videos: 40,
    btnClass: "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30",
  },
  {
    friends: 50,
    taka: 1000,
    videos: 100,
    btnClass: "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30",
  },
  {
    friends: 100,
    taka: 2000,
    videos: 200,
    btnClass: "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/30",
  },
  {
    friends: 300,
    taka: 5000,
    videos: 600,
    btnClass: "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30",
  },
  {
    friends: 500,
    taka: 10000,
    videos: 1000,
    btnClass: "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30",
  },
  {
    friends: 1000,
    taka: 20000,
    videos: 2000,
    btnClass: "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30",
  },
  {
    friends: 2000,
    taka: 50000,
    videos: 5000,
    btnClass: "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30",
  },
];

export const ReferModal: React.FC<ReferModalProps> = ({
  isOpen,
  onClose,
  referralCode,
  onlineCount = 1,
  userAvatar,
  onOpenSettings,
  language = 'bn',
  onShowToast,
  onClaimMilestone,
  referrals = [],
  onAddTestReferral,
  onSimulateReferralProgress,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified'>('all');

  // Claimed milestones state persisted in localStorage
  const [claimedMilestones, setClaimedMilestones] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('smart_earning_claimed_ref_tiers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Dynamic real-time countdown to midnight (next daily reset)
  const [timeLeft, setTimeLeft] = useState<string>(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setLocalToast(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sysSettings = getSystemSettings();
  const rawBot = sysSettings.telegramBotUsername || "SmartEarning_BDT_bot";
  const cleanBot = rawBot.replace(/^@/, "").trim() || "SmartEarning_BDT_bot";
  const shortName = (sysSettings.miniAppShortName || "app").trim();
  const linkFormat = sysSettings.referralLinkFormat || "mini_app";

  let botInviteLink = `https://t.me/${cleanBot}/${shortName}?startapp=${referralCode}`;

  if (linkFormat === 'web_url') {
    const baseUrl = (sysSettings.customWebUrl && sysSettings.customWebUrl.trim())
      ? sysSettings.customWebUrl.trim().replace(/\/$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-ggdb4cv4g7cfbb3xlhcvwn-374535181190.asia-southeast1.run.app');
    botInviteLink = `${baseUrl}?ref=${referralCode}`;
  } else if (linkFormat === 'bot_start') {
    botInviteLink = `https://t.me/${cleanBot}?start=${referralCode}`;
  } else {
    // mini_app (Direct Telegram Mini App Link)
    botInviteLink = `https://t.me/${cleanBot}/${shortName}?startapp=${referralCode}`;
  }
  
  // Calculations based on the anti-fraud rules
  const totalReferrals = referrals.length;
  const verifiedReferrals = referrals.filter((r) => r.status === 'verified');
  const pendingReferrals = referrals.filter((r) => r.status === 'pending');
  
  const verifiedCount = verifiedReferrals.length;
  const pendingCount = pendingReferrals.length;

  const pendingBonus = pendingCount * 100;
  const verifiedBonus = verifiedCount * 100;

  const showNotification = (message: string) => {
    setLocalToast(message);
    if (onShowToast) {
      onShowToast(message);
    }
    setTimeout(() => {
      setLocalToast(null);
    }, 3200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(botInviteLink);
    triggerHaptic("success");
    playAppSound("reward");
    setCopied(true);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#4F46E5", "#10B981", "#F59E0B"],
      zIndex: 9999,
    });

    showNotification(
      language === 'bn'
        ? "✅ রেফারেল লিংক কপি হয়েছে! বন্ধুদের সাথে শেয়ার করুন"
        : "✅ Referral link copied! Share with your friends"
    );

    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTelegram = () => {
    triggerHaptic("success");
    playAppSound("reward");
    const shareText = language === 'bn'
      ? `🎁 Smart Earning এ যোগ দিয়ে প্রতিদিন ১০০+ টাকা ইনকাম করুন! ৩ দিন নিয়মিত কাজ করে জিতে নিন বিশেষ ক্যাশ বোনাস।`
      : `🎁 Join Smart Earning & earn daily cash! Active for 3 days to unlock big bonuses:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botInviteLink)}&text=${encodeURIComponent(shareText)}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.8 },
      zIndex: 9999,
    });

    showNotification(
      language === 'bn'
        ? "🚀 টেলিগ্রাম বন্ধুদের শেয়ার লিংক খোলা হয়েছে!"
        : "🚀 Telegram share link opened!"
    );
  };

  const handleShareWhatsApp = () => {
    triggerHaptic("success");
    playAppSound("reward");
    const shareText = language === 'bn'
      ? `🎁 Smart Earning এ যোগ দিয়ে প্রতিদিন ১০০+ টাকা ফ্রি ইনকাম করুন! ৩ দিন নিয়মিত কাজ করে জিতে নিন বিশেষ ক্যাশ বোনাস।\n👉 জয়েন করতে লিংকে ক্লিক করুন: ${botInviteLink}`
      : `🎁 Join Smart Earning & earn 100+ BDT daily! Active for 3 days to unlock big cash bonuses.\n👉 Join here: ${botInviteLink}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.8 },
      zIndex: 9999,
    });

    showNotification(
      language === 'bn'
        ? "📱 হোয়াটসঅ্যাপ বন্ধুদের শেয়ার লিংক খোলা হয়েছে!"
        : "📱 WhatsApp share link opened!"
    );
  };

  const handleClaimTier = (tier: typeof REWARD_TIERS[0]) => {
    // Verified referrals rule: must have reached 3 days active & 20 tasks
    const remaining = tier.friends - verifiedCount;

    // Condition 1: Not enough verified referrals
    if (remaining > 0) {
      const message = language === 'bn'
        ? `⚠️ এই রিওয়ার্ড ক্লেইম করতে আরও ${remaining} টি ভেরিফাইড রেফার বাকি আছে! (রেফারেলদের ৩ দিন সক্রিয় ও ২০টি টাস্ক সম্পন্ন করতে হবে)`
        : `⚠️ You need ${remaining} more verified referral${remaining > 1 ? 's' : ''} (3 days active & 20 tasks required)!`;

      triggerHaptic("warning");
      playAppSound("toggle");
      showNotification(message);
      return;
    }

    // Condition 2: Already claimed
    if (claimedMilestones.includes(tier.friends)) {
      const message = language === 'bn'
        ? `ℹ️ আপনি ইতিমধ্যে ${tier.friends} ফ্রেন্ডস রিওয়ার্ডটি ক্লেইম করেছেন!`
        : `ℹ️ You have already claimed the ${tier.friends} friends reward!`;

      triggerHaptic("light");
      showNotification(message);
      return;
    }

    // Condition 3: Claim successfully!
    const updated = [...claimedMilestones, tier.friends];
    setClaimedMilestones(updated);
    try {
      localStorage.setItem('smart_earning_claimed_ref_tiers', JSON.stringify(updated));
    } catch (e) {}

    triggerHaptic("success");
    playAppSound("win");

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#4F46E5", "#10B981", "#F59E0B", "#EC4899"],
      zIndex: 99999,
    });

    const successMsg = language === 'bn'
      ? `🎉 অভিনন্দন! ${tier.friends} ভেরিফাইড রেফারেল মাইলস্টোন বোনাস ৳${tier.taka}.00 মূল ব্যালেন্সে যোগ হয়েছে!`
      : `🎉 Congratulations! ৳${tier.taka}.00 verified referral bonus successfully added to main balance!`;

    showNotification(successMsg);

    if (onClaimMilestone) {
      onClaimMilestone(tier.taka, tier.videos, tier.friends);
    }
  };

  const displayedReferrals = referrals.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'verified') return r.status === 'verified';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-40 flex flex-col bg-[#eef2ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
    >
      {/* Floating Modal Toast Notification */}
      <AnimatePresence>
        {localToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/95 text-white font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 max-w-[92%] text-center backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="leading-snug">{localToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Status Bar (Purple) */}
      <div className="bg-[#a855f7] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-sm relative z-20">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-2 font-black text-lg tracking-wide">
          🎁 Smart Earning 💸
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      {/* Profile Bar (Blue) */}
      <div className="bg-gradient-to-b from-[#3b82f6] to-[#60a5fa] px-4 py-3 flex items-center justify-between text-white rounded-b-3xl shrink-0 shadow-md relative z-10">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 bg-blue-300 shadow-inner">
          <img
            src={userAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ade80] shadow-[0_0_8px_#4ade80]"></span>
          </span>
          <span className="text-xs font-black tracking-widest uppercase">
            {onlineCount} {language === 'bn' ? 'অনলাইন' : 'ONLINE'}
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/30 transition-colors shadow-inner cursor-pointer"
        >
          <Settings size={20} className="text-yellow-300" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 w-full space-y-5 pb-28">
        {/* HERO REWARDS CARD */}
        <div className="bg-gradient-to-br from-[#7e22ce] via-[#d946ef] to-[#f43f5e] rounded-[2.5rem] p-6 shadow-xl shadow-purple-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-black tracking-wider mb-4 backdrop-blur-sm shadow-sm border border-white/10 uppercase">
              <Crown size={14} className="text-yellow-300 drop-shadow-sm" />{" "}
              {language === 'bn' ? 'সুরক্ষিত রেফারেল সিস্টেম' : 'SECURE REFERRAL PROGRAM'}
            </div>

            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md tracking-tight">
              {language === 'bn' ? 'বন্ধু ইনভাইট করুন' : 'Invite Friends'}
            </h2>
            <p className="text-white/95 text-[13px] font-medium leading-relaxed px-2 drop-shadow-sm">
              {language === 'bn' ? (
                <>
                  প্রতিটি সফল রেফারেলের জন্য বোনাস <span className="font-black text-yellow-300 text-[15px]">৳১০০.০০</span>! রেফারেল বন্ধু <span className="font-black text-white underline">৩ দিন সক্রিয় ও ২০টি টাস্ক</span> শেষ করলেই টাকা সরাসরি মূল ব্যালেন্সে যুক্ত হবে।
                </>
              ) : (
                <>
                  Earn <span className="font-black text-yellow-300 text-[15px]">৳100.00</span> per verified referral! Bonus unlocks to main balance once your friend is <span className="font-black text-white underline">active for 3 days & completes 20 tasks</span>.
                </>
              )}
            </p>

            {/* Two Balanced Boxes: Pending Balance & Transferred to Main */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {/* Pending Box */}
              <div className="bg-amber-950/40 backdrop-blur-md border border-amber-300/30 rounded-[1.25rem] p-3 text-left shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between text-amber-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  <span>{language === 'bn' ? 'পেন্ডিং বোনাস' : 'Pending Bonus'}</span>
                  <Hourglass size={12} className="text-amber-300 animate-spin" />
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono drop-shadow-sm">
                  ৳{pendingBonus.toFixed(2)}
                </div>
                <div className="text-[10px] text-amber-100/80 font-medium mt-0.5 leading-tight">
                  {language === 'bn' ? '৩ দিন ও ২০ টাস্ক শর্ত বাকি' : 'Waiting for criteria'}
                </div>
              </div>

              {/* Main Balance Unlocked Box */}
              <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-300/30 rounded-[1.25rem] p-3 text-left shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  <span>{language === 'bn' ? 'মূল ব্যালেন্সে যোগ' : 'Added to Wallet'}</span>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
                  ৳{verifiedBonus.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-100/80 font-medium mt-0.5 leading-tight">
                  {language === 'bn' ? 'সফল ও উত্তোলনযোগ্য' : 'Ready to withdraw'}
                </div>
              </div>
            </div>

            {/* 1-CLICK VIRAL SHARE BUTTONS (TELEGRAM & WHATSAPP) */}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {/* Telegram Share Button */}
              <button
                onClick={handleShareTelegram}
                className="bg-gradient-to-r from-sky-400 to-blue-600 shadow-[0_4px_0_#1d4ed8] hover:brightness-105 rounded-2xl py-3 px-2 flex items-center justify-center gap-1.5 transition-all active:shadow-none active:translate-y-1 cursor-pointer text-white font-black text-xs sm:text-sm"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69l-2.87-.9c-.63-.2-.64-.63.14-.93 3.56-1.55 5.94-2.58 7.14-3.08 3.39-1.41 4.1-1.65 4.56-1.66.1 0 .33.02.48.15.12.11.16.27.17.38 0 .09.01.24 0 .38z"/>
                </svg>
                <span className="truncate">
                  {language === 'bn' ? 'টেলিগ্রাম বন্ধুদের শেয়ার' : 'Share Telegram'}
                </span>
              </button>

              {/* WhatsApp Share Button */}
              <button
                onClick={handleShareWhatsApp}
                className="bg-gradient-to-r from-emerald-400 to-green-600 shadow-[0_4px_0_#15803d] hover:brightness-105 rounded-2xl py-3 px-2 flex items-center justify-center gap-1.5 transition-all active:shadow-none active:translate-y-1 cursor-pointer text-white font-black text-xs sm:text-sm"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                <span className="truncate">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপে শেয়ার' : 'Share WhatsApp'}
                </span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-inner">
                <Users className="text-white/80 mb-1" size={16} />
                <span className="text-lg font-black text-white">
                  {totalReferrals}
                </span>
                <span className="text-[9px] font-bold text-white/80 uppercase">
                  {language === 'bn' ? 'মোট ইনভাইট' : 'Joined'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-inner">
                <Hourglass className="text-amber-300 mb-1" size={16} />
                <span className="text-lg font-black text-amber-300">
                  {pendingCount}
                </span>
                <span className="text-[9px] font-bold text-white/80 uppercase">
                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-inner">
                <UserCheck className="text-emerald-300 mb-1" size={16} />
                <span className="text-lg font-black text-emerald-300">
                  {verifiedCount}
                </span>
                <span className="text-[9px] font-bold text-white/80 uppercase">
                  {language === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                </span>
              </div>
            </div>

            {/* Copy Link Box */}
            <div className="mt-4 bg-black/25 backdrop-blur-md rounded-2xl p-1.5 flex items-center justify-between border border-white/10 shadow-inner">
              <span className="text-white/80 text-xs font-mono font-medium pl-3 truncate flex-1 text-left">
                {botInviteLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-white/20 hover:bg-white/30 text-white rounded-[0.85rem] px-3.5 py-2.5 flex items-center gap-1.5 text-xs font-bold transition-colors ml-2 shadow-sm cursor-pointer flex-shrink-0"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-300" />
                ) : (
                  <Copy size={16} />
                )}
                <span>{copied ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TOP REFERRER WEEKLY BONUS PRIZES CARD */}
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-[2.25rem] p-5 shadow-xl shadow-indigo-950/20 text-white relative overflow-hidden border border-indigo-400/30">
          <Crown className="absolute -right-6 -bottom-6 w-40 h-40 text-amber-400/10 rotate-[12deg] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                <Crown size={13} className="fill-slate-950" />
                {language === 'bn' ? 'সাপ্তাহিক স্পেশাল বোনাস' : 'Weekly Special Bonus'}
              </span>
              <span className="text-[10px] text-indigo-200 font-bold bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-400/20 font-mono">
                {timeLeft}
              </span>
            </div>

            <h3 className="text-xl font-black text-white mb-1 leading-snug drop-shadow-sm">
              {language === 'bn' ? '🔥 সাপ্তাহিক টপ ৩ রেফারার বোনাস' : '🔥 Top 3 Weekly Referrer Prizes'}
            </h3>
            <p className="text-xs text-indigo-200 font-medium leading-relaxed mb-4">
              {language === 'bn'
                ? 'প্রতি সপ্তাহে সবচেয়ে বেশি রেফারকারী সেরা ৩ জন মেম্বারকে সরাসরি মূল ব্যালেন্সে স্পেশাল ক্যাশ বোনাস দেওয়া হয়!'
                : 'Top 3 referrers each week get extra special cash bonuses added directly to their main balance!'}
            </p>

            {/* Top 3 Prize Cards Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* 1st Place */}
              <div className="bg-gradient-to-b from-amber-400/20 to-yellow-500/10 border border-amber-400/50 rounded-2xl p-2.5 text-center shadow-inner relative overflow-hidden">
                <div className="text-2xl mb-0.5">🥇</div>
                <div className="text-[10px] font-black text-amber-300 uppercase">{language === 'bn' ? '১ম স্থান' : '1st Rank'}</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">৳৫০০</div>
                <div className="text-[9px] text-amber-200/80 font-bold mt-0.5">{language === 'bn' ? '+ কিং ব্যাজ' : '+ King Badge'}</div>
              </div>

              {/* 2nd Place */}
              <div className="bg-gradient-to-b from-slate-300/20 to-slate-400/10 border border-slate-300/40 rounded-2xl p-2.5 text-center shadow-inner relative overflow-hidden">
                <div className="text-2xl mb-0.5">🥈</div>
                <div className="text-[10px] font-black text-slate-200 uppercase">{language === 'bn' ? '২য় স্থান' : '2nd Rank'}</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">৳৩০০</div>
                <div className="text-[9px] text-slate-300/80 font-bold mt-0.5">{language === 'bn' ? '+ মাস্টার ব্যাজ' : '+ Master Badge'}</div>
              </div>

              {/* 3rd Place */}
              <div className="bg-gradient-to-b from-amber-700/20 to-amber-800/10 border border-amber-600/40 rounded-2xl p-2.5 text-center shadow-inner relative overflow-hidden">
                <div className="text-2xl mb-0.5">🥉</div>
                <div className="text-[10px] font-black text-amber-200 uppercase">{language === 'bn' ? '৩য় স্থান' : '3rd Rank'}</div>
                <div className="text-sm font-black text-white font-mono mt-0.5">৳১৫০</div>
                <div className="text-[9px] text-amber-300/80 font-bold mt-0.5">{language === 'bn' ? '+ স্টার ব্যাজ' : '+ Star Badge'}</div>
              </div>
            </div>

            {/* Current user's referral rank prompt */}
            <div className="bg-indigo-950/60 rounded-xl p-2.5 border border-indigo-400/20 flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-amber-400" />
                <span className="text-indigo-100 font-bold">
                  {language === 'bn' ? `আপনার মোট ইনভাইট: ${totalReferrals} জন` : `Your Total Invites: ${totalReferrals}`}
                </span>
              </div>
              <span className="text-amber-300 font-black text-xs bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                {language === 'bn' ? 'সাপ্তাহিক রেশ চলছে' : 'Weekly Race Active'}
              </span>
            </div>

            {/* Leaderboard Button */}
            {onNavigate && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onNavigate('rank');
                }}
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Crown size={16} className="fill-slate-950" />
                <span>{language === 'bn' ? 'সাপ্তাহিক রেফারেল লিডারবোর্ড দেখুন 👉' : 'View Weekly Leaderboard 👉'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ANTI-FAKE FRAUD PROTECTION POLICY BANNER */}
        <div className="bg-amber-50 border border-amber-200 rounded-[1.75rem] p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-black text-sm">
            <ShieldCheck size={18} className="text-amber-600 flex-shrink-0" />
            <span>{language === 'bn' ? '🛡️ ফেক রেফারেল প্রতিরোধ ও পেন্ডিং নিয়মাবলী:' : '🛡️ Anti-Fraud & Pending Referral Rules:'}</span>
          </div>
          <div className="space-y-2 text-xs text-amber-900/90 font-medium">
            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100">
              <Clock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">{language === 'bn' ? '১. ৩ দিন নিয়মিত সক্রিয় থাকা:' : '1. Active for 3 Days:'}</span>{' '}
                {language === 'bn' ? 'যাকে রেফার করবেন তাকে একটানা বা ন্যূনতম ৩ দিন অ্যাপে এক্টিভ থাকতে হবে।' : 'Referred friend must be active on the app for at least 3 days.'}
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100">
              <CheckSquare size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">{language === 'bn' ? '২. ২০টি টাস্ক/ভিডিও সম্পন্ন করা:' : '2. Complete 20 Tasks/Videos:'}</span>{' '}
                {language === 'bn' ? 'তাকে ন্যূনতম ২০টি কাজ বা ভিডিও ওয়াচ সম্পন্ন করতে হবে।' : 'Referred friend must complete at least 20 tasks or video watches.'}
              </div>
            </div>
            <div className="flex items-start gap-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-900">
              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950">{language === 'bn' ? '৩. স্বয়ংক্রিয় মূল ব্যালেন্সে ট্রান্সফার:' : '3. Auto Transfer to Main Balance:'}</span>{' '}
                {language === 'bn' ? 'উপরের ২টি শর্ত পূরণ হওয়ামাত্র পেন্ডিং ৳১০০ সরাসরি আপনার মূল ওয়ালেটে যোগ হয়ে যাবে!' : 'Once fulfilled, ৳100 automatically moves from pending to your main wallet balance!'}
              </div>
            </div>
          </div>
        </div>

        {/* REFERRED FRIENDS PROGRESS TRACKER (LIST) */}
        <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="text-purple-600 w-5 h-5" />
              <h3 className="text-base font-black text-slate-800">
                {language === 'bn' ? 'রেফারেল প্রগ্রেস তালিকা' : 'Referred Friends Tracker'}
              </h3>
            </div>
            {/* Quick test simulation button */}
            {onAddTestReferral && (
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  onAddTestReferral();
                }}
                className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-black px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                title="টেস্ট রেফারেল যোগ করুন"
              >
                <PlusCircle size={12} />
                <span>{language === 'bn' ? '+ টেস্ট রেফারেল' : '+ Test Invite'}</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-black">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? `সবাই (${totalReferrals})` : `All (${totalReferrals})`}
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'pending'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? `পেন্ডিং (${pendingCount})` : `Pending (${pendingCount})`}
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'verified'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? `ভেরিফাইড (${verifiedCount})` : `Verified (${verifiedCount})`}
            </button>
          </div>

          {/* Referral List Items */}
          {displayedReferrals.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 text-purple-600">
                <Users size={24} />
              </div>
              <p className="text-slate-700 font-bold text-xs mb-1">
                {activeTab === 'all'
                  ? (language === 'bn' ? 'এখনো কোনো রেফারেল নেই' : 'No referrals yet')
                  : activeTab === 'pending'
                  ? (language === 'bn' ? 'কোনো পেন্ডিং রেফারেল নেই' : 'No pending referrals')
                  : (language === 'bn' ? 'কোনো ভেরিফাইড রেফারেল নেই' : 'No verified referrals')}
              </p>
              <p className="text-slate-500 text-[11px] mb-3">
                {language === 'bn'
                  ? 'আপনার রেফারেল লিংক বন্ধুদের সাথে শেয়ার করুন।'
                  : 'Share your referral link with friends to earn!'}
              </p>
              {onAddTestReferral && (
                <button
                  onClick={onAddTestReferral}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white font-black text-xs rounded-xl shadow-xs hover:bg-purple-700 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>{language === 'bn' ? 'টেস্ট করতে রেফারেল যোগ করুন' : 'Add Test Referral'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedReferrals.map((member) => {
                const isVerified = member.status === 'verified';
                const daysProgress = Math.min(100, Math.round((member.daysActive / 3) * 100));
                const tasksProgress = Math.min(100, Math.round((member.tasksCompleted / 20) * 100));

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isVerified
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-amber-50/30 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + member.id}
                          alt={member.name}
                          className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-300"
                        />
                        <div>
                          <div className="font-black text-slate-800 text-xs">
                            {member.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {member.joinedDate}
                          </div>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={11} />
                            {language === 'bn' ? 'ভেরিফাইড (৳১০০ মূল ব্যালেন্সে)' : 'Verified (৳100 Added)'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <Hourglass size={10} className="animate-spin" />
                            {language === 'bn' ? 'পেন্ডিং (শর্ত বাকি)' : 'Pending Criteria'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Criteria Progress Bars */}
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                      {/* Active Days */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-indigo-500" />
                            {language === 'bn' ? 'সক্রিয় দিন:' : 'Days Active:'}
                          </span>
                          <span className={member.daysActive >= 3 ? 'text-emerald-600 font-black' : 'text-slate-800'}>
                            {member.daysActive} / ৩ দিন {member.daysActive >= 3 && '✓'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              member.daysActive >= 3 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${daysProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Tasks Done */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                          <span className="flex items-center gap-1">
                            <CheckSquare size={11} className="text-purple-500" />
                            {language === 'bn' ? 'টাস্ক সম্পন্ন:' : 'Tasks Completed:'}
                          </span>
                          <span className={member.tasksCompleted >= 20 ? 'text-emerald-600 font-black' : 'text-slate-800'}>
                            {member.tasksCompleted} / ২০ টাস্ক {member.tasksCompleted >= 20 && '✓'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              member.tasksCompleted >= 20 ? 'bg-emerald-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${tasksProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Simulation Button for Testing Progress */}
                    {!isVerified && onSimulateReferralProgress && (
                      <div className="mt-2.5 pt-2 border-t border-amber-100 flex justify-end">
                        <button
                          onClick={() => {
                            triggerHaptic("medium");
                            onSimulateReferralProgress(member.id);
                          }}
                          className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <TrendingUp size={11} />
                          <span>{language === 'bn' ? 'সিমুলেট: +১ দিন ও +৬ টাস্ক টেস্ট' : 'Simulate +1 Day & +6 Tasks'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 24H DAILY REWARDS MILESTONE TIERS (VERIFIED REFERRALS REQUIRED) */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
                <Gift className="text-purple-600" size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  {language === 'bn' ? 'ভেরিফাইড রেফারেল মাইলস্টোন' : 'Verified Referral Milestones'}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {language === 'bn' ? '৩ দিন সক্রিয় ও ২০ টাস্ক করা রেফারেল দিয়ে ক্যাশ ক্লেইম করুন' : 'Cash bonus for verified referrals'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-rose-50 text-rose-500 px-2.5 py-1.5 rounded-xl text-[11px] font-black border border-rose-100 shadow-xs tracking-wider flex-shrink-0 font-mono">
              <Hourglass size={12} className="animate-spin" />
              <span>{timeLeft}</span>
            </div>
          </div>

          {/* Verified Referral Counter Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-[1.25rem] p-3 flex justify-between items-center mb-4 shadow-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-950 font-bold text-xs">
                {language === 'bn' ? 'আপনার ভেরিফাইড রেফারেল সংখ্যা:' : 'Your Verified Referrals:'}
              </span>
            </div>
            <div className="bg-white border border-emerald-300 text-emerald-700 font-black px-3 py-1 rounded-xl shadow-xs text-base font-mono">
              {verifiedCount}
            </div>
          </div>

          {/* All Reward Tiers: 1, 5, 10, 20, 50, 100, 300, 500, 1000, 2000 */}
          <div className="space-y-3">
            {REWARD_TIERS.map((tier) => {
              const isClaimed = claimedMilestones.includes(tier.friends);
              const isEligible = verifiedCount >= tier.friends;
              const remaining = tier.friends - verifiedCount;

              return (
                <div
                  key={tier.friends}
                  className={`bg-white rounded-[1.5rem] p-4 flex items-center justify-between border transition-all relative overflow-hidden ${
                    isClaimed
                      ? "border-emerald-200 bg-emerald-50/30"
                      : isEligible
                      ? "border-purple-300 ring-2 ring-purple-400/20 shadow-md shadow-purple-500/10"
                      : "border-slate-200/80 shadow-xs"
                  }`}
                >
                  <div className="relative z-10 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-black text-slate-800 text-sm">
                        {language === 'bn'
                          ? `${tier.friends} জন ভেরিফাইড বন্ধু`
                          : `Invite ${tier.friends} Verified Friends`}
                      </h4>
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          {language === 'bn' ? 'ক্লেইমড' : 'Claimed'}
                        </span>
                      ) : isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">
                          ✨ {language === 'bn' ? 'প্রস্তুত' : 'Ready'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          <Lock size={10} />
                          {remaining} {language === 'bn' ? 'ভেরিফাইড বাকি' : 'left'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-black">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs font-mono">
                        +৳{tier.taka}.00
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                        +{tier.videos} {language === 'bn' ? 'ফ্রি ভিডিও' : 'Videos'}
                      </span>
                    </div>

                    {/* Progress indicator */}
                    {!isClaimed && (
                      <div className="mt-2 w-full max-w-[170px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isEligible ? 'bg-purple-500' : 'bg-slate-400'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((verifiedCount / tier.friends) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Claim Button */}
                  <button
                    onClick={() => handleClaimTier(tier)}
                    className={`relative z-10 text-white font-black text-xs tracking-wide px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                      isClaimed
                        ? "bg-slate-300 text-slate-600 shadow-none cursor-default"
                        : isEligible
                        ? `${tier.btnClass} ring-2 ring-white/50 animate-bounce`
                        : "bg-slate-800 hover:bg-slate-900 text-slate-100"
                    }`}
                  >
                    {isClaimed ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span>{language === 'bn' ? 'ক্লেইমড' : 'Claimed'}</span>
                      </>
                    ) : (
                      <span>{language === 'bn' ? 'ক্লেইম' : 'Claim'}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom padding for mobile scrolling */}
        <div className="h-24"></div>
      </div>
    </motion.div>
  );
};

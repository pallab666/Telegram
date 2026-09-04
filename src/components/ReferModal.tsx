import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Copy,
  Check,
  Send,
  Users,
  UserCheck,
  UserX,
  Crown,
  Gift,
  Hourglass,
  ChevronDown,
  MoreVertical,
  Settings,
  DollarSign,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../utils/telegram";

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  referralsCount: number;
  onlineCount?: number;
  userAvatar?: string;
  onOpenSettings?: () => void;
  language?: 'bn' | 'en';
}

const REWARD_TIERS = [
  {
    friends: 1,
    taka: 50,
    videos: 2,
    btnClass:
      "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/30",
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
    btnClass:
      "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30",
  },
  {
    friends: 50,
    taka: 1000,
    videos: 100,
    btnClass:
      "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30",
  },
  {
    friends: 100,
    taka: 2000,
    videos: 200,
    btnClass:
      "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/30",
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
    btnClass:
      "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30",
  },
  {
    friends: 2000,
    taka: 50000,
    videos: 5000,
    btnClass:
      "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30",
  },
];

export const ReferModal: React.FC<ReferModalProps> = ({
  isOpen,
  onClose,
  referralCode,
  referralsCount,
  onlineCount = 1,
  userAvatar,
  onOpenSettings,
  language = 'bn',
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const botInviteLink = `https://t.me/SmartEarning_bot?start=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(botInviteLink);
    triggerHaptic("success");
    setCopied(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#4F46E5", "#10B981", "#F59E0B"],
      zIndex: 9999,
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToInbox = () => {
    triggerHaptic("success");
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      zIndex: 9999,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-30 flex flex-col bg-[#eef2ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
    >
      {/* Top Status Bar (Purple) */}
      <div className="bg-[#a855f7] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-sm relative z-20">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors"
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
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/30 transition-colors shadow-inner"
        >
          <Settings size={20} className="text-yellow-300" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 w-full">
        {/* PREMIUM REWARDS CARD */}
        <div className="bg-gradient-to-br from-[#7e22ce] via-[#d946ef] to-[#f43f5e] rounded-[2.5rem] p-6 shadow-xl shadow-purple-500/20 text-center relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-black tracking-wider mb-5 backdrop-blur-sm shadow-sm border border-white/10 uppercase">
              <Crown size={14} className="text-yellow-300 drop-shadow-sm" />{" "}
              PREMIUM REWARDS
            </div>

            <h2 className="text-3xl font-black text-white mb-3 drop-shadow-md tracking-tight">
              Invite Friends
            </h2>
            <p className="text-white/95 text-[13px] font-medium leading-relaxed px-2 drop-shadow-sm">
              For every successful referral you will get{" "}
              <span className="font-black text-yellow-300 text-[15px]">
                ৳100.00
              </span>{" "}
              directly in pending balance! It moves to main balance once they
              start working.
            </p>

            {/* Pending Bonus Box */}
            <div className="bg-black/25 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-4 mt-6 flex justify-between items-center shadow-inner">
              <div className="text-left">
                <div className="text-white/80 text-[10px] font-black tracking-wider mb-1 uppercase">
                  Pending Referral Bonus
                </div>
                <div className="text-3xl font-black text-[#4ade80] drop-shadow-sm">
                  ৳0.00
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-200">
                <DollarSign className="text-yellow-900" size={24} />
              </div>
            </div>

            {/* Send to Inbox Button */}
            <button
              onClick={handleSendToInbox}
              className="w-full mt-4 bg-gradient-to-b from-[#fde047] to-[#f59e0b] shadow-[0_4px_0_#b45309] rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:shadow-[0_0px_0_#b45309] active:translate-y-1"
            >
              <Send className="text-[#78350f]" size={20} />
              <span className="text-[#78350f] font-black text-[17px]">
                Send to Inbox
              </span>
            </button>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                <Users className="text-white/70 mb-1" size={20} />
                <span className="text-xl font-black text-white">
                  {referralsCount}
                </span>
                <span className="text-[10px] font-bold text-white/70 uppercase">
                  Joined
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                <UserCheck className="text-emerald-300/90 mb-1" size={20} />
                <span className="text-xl font-black text-emerald-300">0</span>
                <span className="text-[10px] font-bold text-white/70 uppercase">
                  Active
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                <UserX className="text-rose-300/90 mb-1" size={20} />
                <span className="text-xl font-black text-rose-300">0</span>
                <span className="text-[10px] font-bold text-white/70 uppercase">
                  Inactive
                </span>
              </div>
            </div>

            {/* Copy Link Box */}
            <div className="mt-5 bg-black/25 backdrop-blur-md rounded-2xl p-1.5 flex items-center justify-between border border-white/5 shadow-inner">
              <span className="text-white/80 text-xs font-mono font-medium pl-3 truncate flex-1 text-left">
                {botInviteLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-white/20 hover:bg-white/30 text-white rounded-[0.85rem] px-4 py-2.5 flex items-center gap-1.5 text-sm font-bold transition-colors ml-2 shadow-sm"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-300" />
                ) : (
                  <Copy size={16} />
                )}
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* FREE UNLOCK GUIDE */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mt-6 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center shadow-inner">
              <Gift className="text-pink-500" size={18} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center">
              Free Unlock Guide!
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                1
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed font-medium">
                <span className="font-bold text-indigo-700">
                  Invite Friends:
                </span>{" "}
                Get free video access per referral.
              </p>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-rose-500/20">
                2
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed font-medium">
                <span className="font-bold text-rose-700">Milestones:</span>{" "}
                Watch ads to automatically get a{" "}
                <span className="font-bold text-rose-600">Gift Card!</span>
              </p>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                3
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed font-medium">
                <span className="font-bold text-blue-700">Daily Rewards:</span>{" "}
                Complete tasks to claim referral packages.
              </p>
            </div>
          </div>

          <button className="w-full mt-6 bg-gradient-to-r from-[#fde047] to-[#eab308] text-yellow-900 font-black rounded-[1.25rem] py-3.5 shadow-md shadow-yellow-400/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 uppercase tracking-wider text-sm border border-yellow-300">
            WORK DAILY, GET PAID 100% 💸
          </button>
        </div>

        {/* 24H DAILY REWARDS */}
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
                <Gift className="text-purple-600" size={18} />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                24H Daily Rewards
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-rose-50 text-rose-500 px-2.5 py-1.5 rounded-xl text-[11px] font-black border border-rose-100 shadow-sm tracking-wider">
              <Hourglass size={12} />
              <span>12:22:18</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-[1.25rem] p-4 flex justify-center items-center gap-3 mb-6 shadow-sm">
            <span className="text-blue-900 font-bold text-[13px]">
              আজকের রেফার:
            </span>
            <div className="bg-white border border-blue-200 text-blue-700 font-black px-4 py-1 rounded-xl shadow-sm text-lg">
              {referralsCount}
            </div>
          </div>

          <div className="space-y-3.5">
            {REWARD_TIERS.map((tier, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group"
              >
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-50 pointer-events-none rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative z-10">
                  <h4 className="font-black text-slate-800 text-[15px] mb-2">
                    Invite {tier.friends} Friends
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-black">
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100 shadow-sm">
                      +৳{tier.taka}.00
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 shadow-sm">
                      +{tier.videos} Free Videos
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => triggerHaptic("medium")}
                  className={`relative z-10 ${tier.btnClass} text-white font-black text-[13px] tracking-wide px-5 py-2.5 rounded-[1rem] shadow-md active:scale-90 transition-all`}
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom padding for scrolling */}
        <div className="h-24"></div>
      </div>
    </motion.div>
  );
};

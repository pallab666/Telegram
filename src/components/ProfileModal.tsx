import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Settings,
  History,
  Copy,
  Headphones,
  ChevronDown,
  MoreVertical,
  Edit3,
  User,
  Phone,
  AtSign,
  Check,
  Sparkles,
} from "lucide-react";
import { UserData, WithdrawalRecord } from "../types";
import { triggerHaptic } from "../utils/telegram";
import { buildReferralLink } from "../utils/systemSettings";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdatePhone?: (phone: string) => void;
  onUpdateUser?: (updated: Partial<UserData>) => void;
  onOpenGuide: () => void;
  onOpenWithdraw?: () => void;
  withdrawals?: WithdrawalRecord[];
  onlineCount?: number;
  onOpenSettings?: () => void;
  language?: 'bn' | 'en';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onUpdatePhone,
  onOpenWithdraw,
  onlineCount = 1,
  onOpenSettings,
  language = 'bn',
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPhone(user.phone || '');
  }, [user]);

  if (!isOpen) return null;

  const inviteLink = buildReferralLink(user.referralCode);

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
    }
    triggerHaptic("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");

    const cleanedName = editName.trim() || 'ইউজার';
    const cleanedUsername = editUsername.trim().replace(/^@/, '') || 'user_member';
    const cleanedPhone = editPhone.trim();

    if (onUpdateUser) {
      onUpdateUser({
        name: cleanedName,
        username: cleanedUsername,
        phone: cleanedPhone,
      });
    } else if (onUpdatePhone) {
      onUpdatePhone(cleanedPhone);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-30 flex flex-col bg-[#f4f0ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
    >
      {/* Top Purple Bar */}
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
        <div className="flex items-center gap-2 font-black text-[17px] tracking-wide">
          👤 {language === 'bn' ? 'মাই প্রোফাইল' : 'My Profile'}
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      {/* Blue Profile Banner */}
      <div className="bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] px-4 py-3 flex items-center justify-between shadow-md rounded-b-[1.5rem] relative z-10">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full border-2 border-[#fde047] overflow-hidden shadow-sm bg-slate-200">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId || user.username || 'user'}`;
            }}
          />
        </div>

        {/* Online Status Pill */}
        <div className="bg-[#1e3a8a]/40 text-[#fde047] text-[11px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          </span>
          {onlineCount} {language === 'bn' ? 'অনলাইন' : 'ONLINE'}
        </div>

        {/* Settings Icon */}
        <button
          onClick={onOpenSettings}
          className="w-11 h-11 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center border border-white/5 backdrop-blur-sm shadow-inner active:scale-95"
        >
          <Settings className="text-[#fde047] w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-28 pt-4">
        {/* Main Hero Card */}
        <div className="bg-gradient-to-br from-[#7e22ce] via-[#8b5cf6] to-[#6b21a8] rounded-[2rem] p-6 shadow-xl shadow-purple-900/10 text-center relative mx-4 mb-5">
          {/* Large Center Avatar */}
          <div className="w-[100px] h-[100px] rounded-full border-4 border-white mx-auto overflow-hidden mb-3 shadow-lg bg-purple-900/40">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId || user.username || 'user'}`;
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-[26px] font-black text-white leading-none drop-shadow-sm">
              {user.name}
            </h2>
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsEditing(true);
              }}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-yellow-300 transition-transform active:scale-95 border border-white/20 shadow-xs"
              title={language === 'bn' ? 'নাম পরিবর্তন করুন' : 'Edit Name'}
            >
              <Edit3 size={15} />
            </button>
          </div>

          <div className="text-purple-200 font-bold text-xs mb-3 flex items-center justify-center gap-1.5">
            <span>@{user.username}</span>
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsEditing(true);
              }}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/10"
            >
              {language === 'bn' ? 'এডিট' : 'Edit'}
            </button>
          </div>

          <div className="bg-white/20 text-white text-[13px] font-bold px-5 py-2 rounded-full inline-flex items-center gap-1.5 mb-5 backdrop-blur-sm border border-white/10 shadow-inner">
            Balance{" "}
            <span className="text-[#4ade80] ml-1">
              ৳ {user.balance.toFixed(2)}
            </span>
          </div>

          {/* Stats Columns */}
          <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center border border-white/5 shadow-inner">
            <div className="text-center flex-1 border-r border-white/10">
              <div className="text-[#fde047] text-2xl font-black leading-none mb-1">
                {user.referralsCount || 0}
              </div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">
                Joined
              </div>
            </div>
            <div className="text-center flex-1 border-r border-white/10">
              <div className="text-[#4ade80] text-2xl font-black leading-none mb-1">
                0
              </div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">
                Active
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[#ef4444] text-2xl font-black leading-none mb-1">
                0
              </div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">
                Inactive
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="flex gap-4 px-4 mb-5">
          {/* Withdraw */}
          <button
            onClick={() => {
              if (onOpenWithdraw) {
                triggerHaptic("medium");
                onClose();
                onOpenWithdraw();
              }
            }}
            className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#f59e0b] rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 mb-1.5 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </div>
            <span className="font-black text-[15px]">Withdraw</span>
          </button>

          {/* History */}
          <button className="flex-1 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
            <History className="w-8 h-8 mb-1.5" strokeWidth={2.5} />
            <span className="font-black text-[15px]">History</span>
          </button>
        </div>

        {/* Invite Link Card */}
        <div className="mx-4 bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 relative overflow-hidden mb-6">
          {/* Decorative background shape */}
          <div className="absolute -right-6 -top-6 text-[#f4f0ff]">
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <circle cx="50" cy="50" r="40" opacity="0.5" />
              <circle cx="70" cy="30" r="20" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
              <h3 className="text-[#1e3a8a] font-black text-lg">
                Your Invite Link
              </h3>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 pr-24 relative border border-slate-200">
              <div className="text-xs text-slate-500 truncate w-full font-mono font-medium select-all">
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Support FAB */}
      <div className="fixed bottom-[88px] left-4 z-40">
        <button
          onClick={() => triggerHaptic("light")}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] border-[3px] border-white shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <Headphones className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Edit Profile Dialog */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 relative text-left"
            >
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">
                    {language === 'bn' ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'bn' ? 'আপনার আসল নাম ও ইউজারনেম সেটিং করুন' : 'Update your real name & username'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'আপনার পূর্ণ নাম (Full Name)' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Md. Tanvir Hossain"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'ইউজারনেম (Telegram Username)' : 'Username'}
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. tanvir_dev"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর (পেমেন্টের জন্য)' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {saveSuccess ? (
                  <div className="bg-emerald-500 text-white rounded-2xl py-3 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                    <Check size={18} /> {language === 'bn' ? 'প্রোফাইল সংরক্ষিত হয়েছে!' : 'Profile Saved Successfully!'}
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm transition-colors"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={16} /> {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Profile'}
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

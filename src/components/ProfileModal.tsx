import React, { useState } from 'react';
import { X, User, Phone, Shield, BookOpen, ExternalLink, RefreshCw, Send, Check } from 'lucide-react';
import { UserData } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdatePhone: (phone: string) => void;
  onOpenGuide: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdatePhone,
  onOpenGuide,
}) => {
  const [phone, setPhone] = useState(user.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePhone(phone);
    setIsEditingPhone(false);
    setSavedSuccess(true);
    triggerHaptic('success');
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              👤
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">আমার প্রোফাইল (My Profile)</h3>
              <p className="text-[11px] text-slate-400">ইউজার একাউন্ট ও বিবরণ</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Top */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center space-x-3.5">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-600 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">{user.name}</h4>
            <p className="text-xs text-indigo-600 font-mono font-semibold">@{user.username || 'user'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">টেলিগ্রাম আইডি: {user.telegramId || '582910284'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 overflow-y-auto space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">বর্তমান ব্যালেন্স</span>
              <div className="text-lg font-mono font-black text-indigo-600">
                ৳{user.balance.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট উত্তোলন</span>
              <div className="text-lg font-mono font-black text-emerald-600">
                ৳{user.totalWithdrawn.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">রেফারেল সংখ্যা</span>
              <div className="text-lg font-mono font-black text-slate-900">
                {user.referralsCount} জন
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">রেফার কোড</span>
              <div className="text-lg font-mono font-black text-indigo-600">
                {user.referralCode}
              </div>
            </div>
          </div>

          {/* Phone Number / bKash settings */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>মোবাইল নম্বর (বিকাশ/নগদ):</span>
              </div>
              {!isEditingPhone && (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  পরিবর্তন
                </button>
              )}
            </div>

            {isEditingPhone ? (
              <form onSubmit={handleSavePhone} className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                  maxLength={11}
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
                >
                  বাতিল
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-800 font-mono font-bold">{phone || 'নম্বর যোগ করা হয়নি'}</p>
            )}

            {savedSuccess && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                <Check className="w-3 h-3" /> নম্বর সফলভাবে আপডেট হয়েছে!
              </p>
            )}
          </div>

          {/* Action to open the Bot Setup Guide */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
              onOpenGuide();
            }}
            className="w-full p-3.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between text-left shadow-sm transition-all group"
            id="btn-profile-bot-guide"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  এমন টেলিগ্রাম বট কীভাবে বানাবেন?
                </h5>
                <p className="text-[10px] text-slate-500">
                  BotFather সেটআপ, কোড ও পূর্ণাঙ্গ নির্দেশিকা
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

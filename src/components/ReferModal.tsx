import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, Gift, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  referralsCount: number;
}

export const ReferModal: React.FC<ReferModalProps> = ({
  isOpen,
  onClose,
  referralCode,
  referralsCount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const botInviteLink = `https://t.me/SmartEarning_BDT_bot/earn?startapp=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(botInviteLink);
    triggerHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    triggerHaptic('medium');
    const shareText = encodeURIComponent(
      `🎁 Smart Earning এ জয়েন করে প্রতিদিন ভিডিও দেখে ও টাস্ক কমপ্লিট করে টাকা আয় করুন!\n\nআমার লিংক দিয়ে জয়েন করলেই পাবেন ফ্রি বোনাস:\n${botInviteLink}`
    );
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(botInviteLink)}&text=${shareText}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              👥
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">রেফার ও আয় করুন (Refer & Earn)</h3>
              <p className="text-[11px] text-slate-400">বন্ধুদের ইনভাইট করে প্রতি রেফারে ৳10 BDT</p>
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

        {/* Body */}
        <div className="p-4 space-y-4 bg-slate-50">
          {/* Reward highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">প্রতি রেফার বোনাস</span>
              <div className="text-xl font-black text-indigo-600 font-mono mt-0.5">৳10.00</div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-emerald-200">
                +১০% কমিশন
              </span>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট রেফারেল</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{referralsCount} জন</div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-indigo-200">
                সক্রিয় সদস্য
              </span>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <span className="text-xs font-bold text-slate-700">আপনার রেফারেল কোড:</span>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="font-mono font-black text-base text-indigo-600 tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  triggerHaptic('success');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>কপি</span>
              </button>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <span className="text-xs font-bold text-slate-700">আপনার রেফারেল লিংক:</span>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
              <span className="truncate mr-2">{botInviteLink}</span>
              <button
                onClick={handleCopyLink}
                className="text-slate-500 hover:text-indigo-600 flex-shrink-0 p-1 bg-white border border-slate-200 rounded-lg shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleShareTelegram}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              id="btn-share-telegram"
            >
              <Share2 className="w-4 h-4" />
              <span>টেলিগ্রামে বন্ধুদের শেয়ার করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

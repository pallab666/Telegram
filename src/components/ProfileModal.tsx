import React, { useState } from 'react';
import { X, Settings, History, Copy, Headphones, ChevronDown, MoreVertical } from 'lucide-react';
import { UserData, WithdrawalRecord } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdatePhone: (phone: string) => void;
  onOpenGuide: () => void;
  onOpenWithdraw?: () => void;
  withdrawals?: WithdrawalRecord[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenWithdraw,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    triggerHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f0ff] animate-in slide-in-from-bottom-2 sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden">
      
      {/* Top Purple Bar */}
      <div className="bg-[#a855f7] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-sm relative z-20">
        <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-2 font-black text-[17px] tracking-wide">
          🎁 Smart Earning 💸
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      {/* Blue Profile Banner */}
      <div className="bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] px-4 py-3 flex items-center justify-between shadow-md rounded-b-[1.5rem] relative z-10">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full border-2 border-[#fde047] overflow-hidden shadow-sm">
          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        
        {/* Online Status Pill */}
        <div className="bg-[#1e3a8a]/40 text-[#fde047] text-[11px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          52 ONLINE
        </div>
        
        {/* Settings Icon */}
        <button className="w-11 h-11 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center border border-white/5 backdrop-blur-sm shadow-inner active:scale-95">
          <Settings className="text-[#fde047] w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-28 pt-4">
        
        {/* Main Hero Card */}
        <div className="bg-gradient-to-br from-[#7e22ce] via-[#8b5cf6] to-[#6b21a8] rounded-[2rem] p-6 shadow-xl shadow-purple-900/10 text-center relative mx-4 mb-5">
          {/* Large Center Avatar */}
          <div className="w-[100px] h-[100px] rounded-full border-4 border-white mx-auto overflow-hidden mb-3 shadow-lg">
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <h2 className="text-[30px] font-black text-white mb-2 leading-none drop-shadow-sm">{user.name}</h2>
          
          <div className="bg-white/20 text-white text-[13px] font-bold px-5 py-2 rounded-full inline-flex items-center gap-1.5 mb-5 backdrop-blur-sm border border-white/10 shadow-inner">
            Balance <span className="text-[#4ade80] ml-1">৳ {user.balance.toFixed(2)}</span>
          </div>
          
          {/* Stats Columns */}
          <div className="bg-black/15 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center border border-white/5 shadow-inner">
            <div className="text-center flex-1 border-r border-white/10">
              <div className="text-[#fde047] text-2xl font-black leading-none mb-1">{user.referralsCount || 0}</div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">Joined</div>
            </div>
            <div className="text-center flex-1 border-r border-white/10">
              <div className="text-[#4ade80] text-2xl font-black leading-none mb-1">0</div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">Active</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[#ef4444] text-2xl font-black leading-none mb-1">0</div>
              <div className="text-[10px] text-white/80 font-bold tracking-widest uppercase">Inactive</div>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="flex gap-4 px-4 mb-5">
          {/* Withdraw */}
          <button 
            onClick={() => {
              if(onOpenWithdraw) {
                triggerHaptic('medium');
                onClose();
                onOpenWithdraw();
              }
            }} 
            className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#f59e0b] rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 mb-1.5 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" opacity="0.5" />
              <circle cx="70" cy="30" r="20" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
              <h3 className="text-[#1e3a8a] font-black text-lg">Your Invite Link</h3>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-3 pr-24 relative border border-slate-200">
              <div className="text-xs text-slate-500 truncate w-full font-mono font-medium">
                https://t.me/smarterning15_bot/...
              </div>
              <button 
                onClick={handleCopyLink}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Support FAB */}
      <div className="fixed bottom-[88px] left-4 z-40">
        <button 
          onClick={() => triggerHaptic('light')}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] border-[3px] border-white shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <Headphones className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
};

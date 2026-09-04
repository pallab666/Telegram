import React from "react";
import { Settings, Lock } from "lucide-react";
import { UserData } from "../types";
import { triggerHaptic } from "../utils/telegram";

interface TelegramHeaderProps {
  user: UserData;
  onlineCount: number;
  totalUsers?: number;
  language?: 'bn' | 'en';
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  onOpenGuide: () => void;
  onOpenProfile: () => void;
  pendingWithdrawalsCount?: number;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  user,
  onlineCount,
  totalUsers = 1,
  language = 'bn',
  onOpenSettings,
  onOpenAdmin,
  onOpenGuide,
  onOpenProfile,
  pendingWithdrawalsCount = 0,
}) => {
  return (
    <header className="w-full select-none" id="telegram-header">
      {/* Hero bar with Avatar, Online status pill, and Settings button */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
        {/* User Avatar with refined border */}
        <button
          onClick={() => {
            triggerHaptic("light");
            onOpenProfile();
          }}
          className="relative group transition-transform active:scale-95 flex items-center gap-2.5"
          id="btn-user-avatar"
          aria-label="Open Profile"
        >
          <div className="w-11 h-11 rounded-full border-2 border-indigo-100 p-0.5 shadow-sm overflow-hidden bg-slate-100">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback avatar
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[110px]">@{user.username}</div>
          </div>
        </button>

        {/* Online status indicator & Total users count pill */}
        <div
          id="badge-online-users"
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-xs"
          title={language === 'bn' ? `লাইভ একটিভ: ${onlineCount} জন | সর্বমোট ইউজার: ${totalUsers} জন` : `Active: ${onlineCount} online | Total Users: ${totalUsers}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
            <span>{onlineCount} {language === 'bn' ? 'অনলাইন' : 'ONLINE'}</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-extrabold">{totalUsers} {language === 'bn' ? 'ইউজার' : 'USERS'}</span>
          </div>
        </div>

        {/* Action Controls: Settings button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              triggerHaptic("medium");
              onOpenSettings();
            }}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition-all active:scale-90 cursor-pointer"
            id="btn-settings-gear"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

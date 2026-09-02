import React from 'react';
import { X, Award, Medal, Trophy } from 'lucide-react';
import { LeaderboardRank } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranks: LeaderboardRank[];
}

export const RankModal: React.FC<RankModalProps> = ({ isOpen, onClose, ranks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              🏆
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">শীর্ষ আয়কারী (Leaderboard)</h3>
              <p className="text-[11px] text-slate-400">বাংলাদেশের সেরা স্মার্ট আর্নাররা</p>
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

        {/* Top 3 Podium Cards */}
        <div className="p-4 bg-slate-100 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-2 items-end pt-3">
            {/* Rank 2 */}
            {ranks[1] && (
              <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-full ring-2 ring-slate-300 overflow-hidden mb-1">
                  <img src={ranks[1].avatar} alt={ranks[1].name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 truncate max-w-[80px]">
                  {ranks[1].name}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  ৳{ranks[1].earnings}
                </span>
                <span className="mt-1 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                  🥈 ২য়
                </span>
              </div>
            )}

            {/* Rank 1 */}
            {ranks[0] && (
              <div className="flex flex-col items-center p-3 rounded-2xl bg-white border-2 border-indigo-600 shadow-md relative -top-2">
                <Trophy className="w-4 h-4 text-indigo-600 mb-0.5" />
                <div className="w-12 h-12 rounded-full ring-2 ring-indigo-600 overflow-hidden mb-1">
                  <img src={ranks[0].avatar} alt={ranks[0].name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-slate-900 truncate max-w-[90px]">
                  {ranks[0].name}
                </span>
                <span className="text-sm font-mono font-black text-indigo-600">
                  ৳{ranks[0].earnings}
                </span>
                <span className="mt-1 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                  🥇 ১ম
                </span>
              </div>
            )}

            {/* Rank 3 */}
            {ranks[2] && (
              <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-full ring-2 ring-amber-500 overflow-hidden mb-1">
                  <img src={ranks[2].avatar} alt={ranks[2].name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 truncate max-w-[80px]">
                  {ranks[2].name}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  ৳{ranks[2].earnings}
                </span>
                <span className="mt-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  🥉 ৩য়
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Full List */}
        <div className="p-4 overflow-y-auto space-y-2 bg-slate-50">
          {ranks.slice(3).map((user) => (
            <div
              key={user.rank}
              className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-xs text-slate-400 w-5 text-center">
                  #{user.rank}
                </span>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{user.name}</h4>
                  <span className="text-[10px] text-slate-400">{user.referrals} রেফারেল</span>
                </div>
              </div>
              <div className="font-mono font-bold text-xs text-slate-900">
                ৳{user.earnings.toLocaleString()} BDT
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

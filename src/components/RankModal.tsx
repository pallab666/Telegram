import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Trophy,
  Gift,
  Star,
  Users,
  Coins,
  Video,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { triggerHaptic } from "../utils/telegram";

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RankModal: React.FC<RankModalProps> = ({ isOpen, onClose }) => {
  const [activeTimeTab, setActiveTimeTab] = useState("Daily");
  const [activeCategoryTab, setActiveCategoryTab] = useState("Top Refs");

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-30 flex flex-col bg-[#f4f0ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
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
        <div className="flex items-center gap-2 font-black text-[17px] tracking-wide">
          🎁 Smart Earning 💸
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-24 px-4 pt-5">
        {/* HERO CARD - Top Champions */}
        <div className="bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] rounded-[2rem] p-6 shadow-xl shadow-blue-900/20 text-center relative overflow-hidden mb-5">
          {/* Faint Background Trophy */}
          <Trophy
            className="absolute -left-12 top-2 w-56 h-56 text-white/5 rotate-[-15deg] pointer-events-none"
            strokeWidth={1}
            fill="currentColor"
          />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-[28px] font-black text-white mb-0.5 tracking-tight drop-shadow-md">
              Top Champions
            </h2>
            <p className="text-[10px] font-bold text-blue-200 tracking-widest uppercase mb-6">
              Stay Ahead And Earn More!
            </p>

            <div className="relative inline-block mb-6">
              <div className="w-[84px] h-[84px] bg-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-[#e2e8f0]/30 backdrop-blur-sm">
                <Gift
                  className="w-10 h-10 text-[#f472b6]"
                  fill="currentColor"
                  strokeWidth={1}
                />
              </div>
              <div className="absolute -top-1 -right-1 w-[26px] h-[26px] bg-[#ef4444] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#ef4444] to-[#f43f5e] text-white font-black text-[11px] tracking-wide px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(225,29,72,0.4)] border border-red-400 mb-7 active:scale-95 transition-transform flex items-center gap-1.5 uppercase">
              <span className="text-[14px]">👆</span> Tap to see your rank!
            </button>

            <div className="bg-[#000000]/25 backdrop-blur-md rounded-[1.25rem] px-5 py-3.5 flex justify-between items-center border border-white/10 w-full shadow-inner">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-6 h-6 text-[#fde047] fill-[#fde047] drop-shadow-sm" />
                <div className="text-left">
                  <span className="text-[10px] text-white/90 font-bold block leading-tight mb-0.5 uppercase tracking-wide">
                    Prize:
                  </span>
                  <span className="text-[#fde047] font-black text-[15px] block leading-none">
                    ৳300.00
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-200 font-bold block leading-tight mb-0.5 uppercase tracking-wide">
                  Ends In:
                </span>
                <span className="text-white font-black text-[15px] block leading-none tracking-wider">
                  12:01:08
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TIME TABS */}
        <div className="flex bg-white rounded-2xl p-1.5 mb-4 shadow-sm border border-slate-100/50">
          {["Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                triggerHaptic("light");
                setActiveTimeTab(tab);
              }}
              className={`flex-1 py-2 text-[12px] font-black rounded-xl transition-all ${
                activeTimeTab === tab
                  ? "bg-[#f472b6] text-black shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-2.5 mb-6">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Refs");
            }}
            className={`flex-1 rounded-[1.5rem] p-3.5 flex flex-col items-center shadow-sm transition-all border ${
              activeCategoryTab === "Top Refs"
                ? "bg-[#f472b6] border-pink-400 text-black"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Users
              className="w-7 h-7 mb-2"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[12px] font-black">Top Refs</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Earners");
            }}
            className={`flex-1 rounded-[1.5rem] p-3.5 flex flex-col items-center shadow-sm transition-all border ${
              activeCategoryTab === "Top Earners"
                ? "bg-[#f472b6] border-pink-400 text-black"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Coins
              className="w-7 h-7 mb-2"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[12px] font-black">Top Earners</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Unlocks");
            }}
            className={`flex-1 rounded-[1.5rem] p-3.5 flex flex-col items-center shadow-sm transition-all border ${
              activeCategoryTab === "Top Unlocks"
                ? "bg-[#f472b6] border-pink-400 text-black"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Video
              className="w-7 h-7 mb-2"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[12px] font-black">Top Unlocks</span>
          </button>
        </div>

        {/* LEADERBOARD ITEM 1 */}
        <div className="p-[2px] rounded-[1.5rem] bg-gradient-to-r from-[#2dd4bf] via-[#fef08a] to-[#ec4899] shadow-md relative">
          <div className="bg-[#fffae6] rounded-[1.4rem] p-3.5 flex items-center justify-between relative overflow-hidden">
            {/* Background faint flowers decoration */}
            <div className="absolute top-2 left-1/2 text-pink-300 opacity-50 text-xs">
              🌸
            </div>
            <div className="absolute bottom-1 right-24 text-yellow-400 opacity-40 text-lg">
              🌼
            </div>
            <div className="absolute top-5 right-20 text-yellow-300 opacity-60 text-sm">
              ✨
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <Trophy className="w-[30px] h-[30px] text-[#eab308] fill-[#eab308] drop-shadow-md ml-1" />
              <img
                src="https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                alt="Avatar"
                className="w-[52px] h-[52px] rounded-full border-2 border-white shadow-sm object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-black text-slate-900 text-[17px]">
                    SSDR
                  </span>
                  <span className="text-[10px]">🌼</span>
                </div>
                <div className="bg-gradient-to-r from-[#fde047] to-[#eab308] text-yellow-900 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm border border-yellow-200">
                  <span>👑</span> King
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1rem] px-5 py-2 shadow-sm flex flex-col items-center justify-center border border-slate-100 relative z-10 min-w-[70px]">
              <span className="text-[#2563eb] font-black text-[22px] leading-none mb-1">
                1
              </span>
              <span className="text-slate-400 text-[9px] font-black tracking-wider leading-none uppercase">
                Refs
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import React from "react";
import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { triggerHaptic } from "../utils/telegram";
import {
  AppPreferences,
  CURRENCY_CONFIGS,
  formatMoney,
} from "../utils/preferences";

interface BalanceCardProps {
  balance: number;
  minWithdraw: number;
  onOpenWithdraw: () => void;
  preferences?: AppPreferences;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  minWithdraw,
  onOpenWithdraw,
  preferences,
}) => {
  const isBn = preferences?.language !== "en";
  const currency = preferences?.currency || "BDT";
  const curConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.BDT;
  const progressPercent = Math.min(
    100,
    Math.max(1, (balance / minWithdraw) * 100),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-4 py-2.5"
      id="section-balance-card"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#7e22ce] via-[#8b5cf6] to-[#6b21a8] p-6 text-white shadow-xl shadow-purple-900/10 border border-purple-500/20">
        <div className="relative z-10 flex flex-col items-start space-y-4">
          <div className="text-[15px] font-semibold text-white/90">
            Total Balance
          </div>

          <div className="flex items-baseline space-x-1.5 leading-none">
            <span className="text-[26px] font-black text-[#fde047]">
              {curConfig.symbol}
            </span>
            <span className="text-[40px] font-black tracking-tight text-white">
              {currency === "BDT"
                ? balance.toFixed(2)
                : (balance * curConfig.rateFromBDT).toFixed(2)}
            </span>
            <span className="text-[20px] font-black text-white/90 uppercase ml-1">
              {curConfig.code}
            </span>
          </div>

          <div className="w-full pt-1 pb-1">
            <div className="w-full h-[7px] bg-white/20 rounded-full overflow-hidden p-0 border border-black/5">
              <div
                className="h-full bg-[#4ade80] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="w-full pt-1 flex justify-center">
            <button
              onClick={() => {
                triggerHaptic("medium");
                onOpenWithdraw();
              }}
              className="flex items-center gap-2 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white px-5 py-2.5 text-[13px] font-black shadow-md shadow-red-500/30 transition-transform active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-full border-[1.5px] border-white/50 flex items-center justify-center bg-white/10">
                <Bell className="w-3 h-3 text-white" fill="currentColor" />
              </div>
              <span>
                Withdraw from minimum {formatMoney(minWithdraw, currency)}!
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

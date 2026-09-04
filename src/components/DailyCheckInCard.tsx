import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Sparkles,
  Clock,
  Check,
  Flame,
  Award,
  Gift,
  ChevronRight,
  Info,
} from "lucide-react";
import { triggerHaptic } from "../utils/telegram";
import { AppPreferences, formatMoney, playAppSound } from "../utils/preferences";
import confetti from "canvas-confetti";

export const DAILY_CHECKIN_REWARDS = [
  { day: 1, reward: 2.0, titleBn: "১ম দিন", titleEn: "Day 1", isJackpot: false },
  { day: 2, reward: 3.0, titleBn: "২য় দিন", titleEn: "Day 2", isJackpot: false },
  { day: 3, reward: 4.0, titleBn: "৩য় দিন", titleEn: "Day 3", isJackpot: false },
  { day: 4, reward: 5.0, titleBn: "৪র্থ দিন", titleEn: "Day 4", isJackpot: false },
  { day: 5, reward: 6.0, titleBn: "৫ম দিন", titleEn: "Day 5", isJackpot: false },
  { day: 6, reward: 8.0, titleBn: "৬ষ্ঠ দিন", titleEn: "Day 6", isJackpot: false },
  { day: 7, reward: 15.0, titleBn: "৭ম দিন", titleEn: "Day 7", isJackpot: true },
];

export const CHECKIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
export const CHECKIN_STORAGE_KEY = "smart_earning_last_checkin_timestamp";
export const STREAK_STORAGE_KEY = "smart_earning_checkin_streak";

interface DailyCheckInCardProps {
  lastCheckInTimestamp?: number;
  checkInStreak?: number;
  onClaim: (reward: number, newStreak: number, timestamp: number) => void;
  preferences?: AppPreferences;
}

export const DailyCheckInCard: React.FC<DailyCheckInCardProps> = ({
  lastCheckInTimestamp,
  checkInStreak = 0,
  onClaim,
  preferences,
}) => {
  const isBn = preferences?.language !== "en";
  const currency = preferences?.currency || "BDT";

  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);

  // Compute cooldown countdown and automatic reset
  useEffect(() => {
    const updateCountdown = () => {
      let timestamp = lastCheckInTimestamp;
      if (!timestamp) {
        const stored = localStorage.getItem(CHECKIN_STORAGE_KEY);
        if (stored) {
          timestamp = parseInt(stored, 10);
        }
      }

      if (!timestamp) {
        setCooldownRemaining(0);
        return;
      }

      const elapsed = Date.now() - timestamp;
      const remaining = CHECKIN_COOLDOWN_MS - elapsed;

      if (remaining > 0) {
        setCooldownRemaining(remaining);
      } else {
        setCooldownRemaining(0); // Automatically resets after 24h
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastCheckInTimestamp]);

  const isClaimedToday = cooldownRemaining > 0;

  // Determine current active day (1 to 7)
  const currentStreak = Math.max(0, checkInStreak);
  const activeDayIndex = isClaimedToday
    ? ((currentStreak - 1 + 7) % 7) // day that was just claimed
    : (currentStreak % 7); // day available to claim today

  const nextRewardObj = DAILY_CHECKIN_REWARDS[activeDayIndex];
  const nextRewardAmount = nextRewardObj ? nextRewardObj.reward : 2.0;

  // Format countdown time helper
  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (isBn) {
      const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const toBn = (n: number) =>
        String(n)
          .padStart(2, "0")
          .split("")
          .map((d) => bnDigits[parseInt(d, 10)] ?? d)
          .join("");
      return `${toBn(hours)} ঘণ্টা ${toBn(minutes)} মি. ${toBn(seconds)} সে.`;
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  const handleClaimClick = () => {
    if (isClaimedToday || isClaiming) return;

    setIsClaiming(true);
    triggerHaptic("success");
    playAppSound("reward");

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    const now = Date.now();
    // Calculate new streak: if consecutive within 48h, streak + 1; otherwise reset to 1
    let newStreak = 1;
    let prevTimestamp = lastCheckInTimestamp;
    if (!prevTimestamp) {
      const stored = localStorage.getItem(CHECKIN_STORAGE_KEY);
      if (stored) prevTimestamp = parseInt(stored, 10);
    }

    if (prevTimestamp) {
      const elapsed = now - prevTimestamp;
      // If claimed between 24h and 48h, streak continues
      if (elapsed <= 48 * 60 * 60 * 1000) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = currentStreak + 1;
    }

    localStorage.setItem(CHECKIN_STORAGE_KEY, now.toString());
    localStorage.setItem(STREAK_STORAGE_KEY, newStreak.toString());

    setTimeout(() => {
      onClaim(nextRewardAmount, newStreak, now);
      setIsClaiming(false);
    }, 400);
  };

  return (
    <div className="bg-white rounded-[2rem] p-4.5 mb-4 shadow-sm border border-purple-200/80 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-400/15 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header with Streak and Badge */}
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-amber-950 shadow-md shadow-amber-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {isBn ? "দৈনিক চেক-ইন বোনাস" : "Daily Check-in Bonus"}
              </h3>
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                {isBn
                  ? `${currentStreak} দিন স্ট্রিক`
                  : `${currentStreak} Day Streak`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold">
              {isBn
                ? "প্রতি ২৪ ঘণ্টায় বিনামূল্যে বোনাস ক্লেইম করুন"
                : "Claim your daily bonus once every 24 hours"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
            {formatMoney(nextRewardAmount, currency)}
          </span>
        </div>
      </div>

      {/* 7-DAY STREAK ROADMAP CALENDAR */}
      <div className="grid grid-cols-7 gap-1.5 mb-4 relative z-10">
        {DAILY_CHECKIN_REWARDS.map((item, index) => {
          const isDone = isClaimedToday
            ? index <= activeDayIndex
            : index < activeDayIndex;
          const isCurrentTarget = !isClaimedToday && index === activeDayIndex;
          const isUpcoming = isClaimedToday
            ? index > activeDayIndex
            : index > activeDayIndex;

          return (
            <motion.div
              key={item.day}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all text-center relative ${
                isDone
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-800"
                  : isCurrentTarget
                  ? "bg-gradient-to-b from-amber-50 to-amber-100/90 border-amber-400 shadow-md shadow-amber-400/20 ring-2 ring-amber-400/40"
                  : item.isJackpot
                  ? "bg-gradient-to-b from-purple-50 to-fuchsia-50 border-purple-200 text-purple-900"
                  : "bg-slate-50/80 border-slate-200 text-slate-400"
              }`}
            >
              {/* Day title */}
              <span
                className={`text-[9px] font-black ${
                  isDone
                    ? "text-emerald-700"
                    : isCurrentTarget
                    ? "text-amber-800"
                    : item.isJackpot
                    ? "text-purple-700"
                    : "text-slate-500"
                }`}
              >
                {isBn ? item.titleBn : item.titleEn}
              </span>

              {/* Icon / Coin in center */}
              <div className="my-1">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isCurrentTarget ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[11px] shadow-sm"
                  >
                    ৳
                  </motion.div>
                ) : item.isJackpot ? (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-yellow-300 flex items-center justify-center shadow-xs">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                    ৳
                  </div>
                )}
              </div>

              {/* Reward amount */}
              <span
                className={`text-[9px] font-black leading-tight ${
                  isDone
                    ? "text-emerald-700"
                    : isCurrentTarget
                    ? "text-amber-900"
                    : item.isJackpot
                    ? "text-purple-700"
                    : "text-slate-500"
                }`}
              >
                +{item.reward.toFixed(0)}
              </span>

              {/* Mega bonus tag for day 7 */}
              {item.isJackpot && !isDone && (
                <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[7px] font-black px-1 rounded-full shadow-xs">
                  MAX
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* CLAIM / COOLDOWN BUTTON */}
      <button
        onClick={handleClaimClick}
        disabled={isClaimedToday || isClaiming}
        className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all cursor-pointer shadow-md ${
          isClaimedToday
            ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed shadow-none"
            : "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 shadow-amber-500/25 active:scale-[0.98]"
        }`}
      >
        {isClaimedToday ? (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
            <span>
              {isBn
                ? `আজকের চেক-ইন সম্পন্ন (পরবর্তী: ${formatTimeRemaining(
                    cooldownRemaining
                  )})`
                : `Claimed Today (Next in: ${formatTimeRemaining(
                    cooldownRemaining
                  )})`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>
              {isBn
                ? `আজকের বোনাস ক্লেইম করুন (+${formatMoney(
                    nextRewardAmount,
                    currency
                  )})`
                : `Claim Today's Reward (+${formatMoney(
                    nextRewardAmount,
                    currency
                  )})`}
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

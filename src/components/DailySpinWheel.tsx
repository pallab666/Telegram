import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Gift, Play, Flame, Trophy } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { triggerSmartAd } from '../utils/adManager';
import { AppPreferences, formatMoney, playAppSound } from '../utils/preferences';

interface DailySpinWheelProps {
  onWinReward: (amount: number) => void;
  preferences?: AppPreferences;
}

interface Sector {
  amount: number;
  label: string;
  color: string;
  textColor: string;
}

const SECTORS: Sector[] = [
  { amount: 1.0, label: '৳১.০', color: '#6366f1', textColor: '#ffffff' }, // Indigo
  { amount: 2.5, label: '৳২.৫', color: '#10b981', textColor: '#ffffff' }, // Emerald
  { amount: 0.5, label: '৳০.৫', color: '#f59e0b', textColor: '#ffffff' }, // Amber
  { amount: 5.0, label: '৳৫.০', color: '#ec4899', textColor: '#ffffff' }, // Pink
  { amount: 1.5, label: '৳১.৫', color: '#8b5cf6', textColor: '#ffffff' }, // Purple
  { amount: 3.0, label: '৳৩.০', color: '#3b82f6', textColor: '#ffffff' }, // Blue
  { amount: 10.0, label: '৳১০ 🔥', color: '#ef4444', textColor: '#ffffff' }, // Red (Jackpot)
  { amount: 2.0, label: '৳২.০', color: '#14b8a6', textColor: '#ffffff' }, // Teal
];

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'smart_earning_daily_spin_last_time';

export const DailySpinWheel: React.FC<DailySpinWheelProps> = ({ onWinReward, preferences }) => {
  const isBn = preferences?.language !== 'en';
  const currency = preferences?.currency || 'BDT';

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [recentWin, setRecentWin] = useState<number | null>(null);

  // Check cooldown state on mount and update every second
  useEffect(() => {
    const updateCooldown = () => {
      const savedTime = localStorage.getItem(STORAGE_KEY);
      if (!savedTime) {
        setCooldownRemaining(0);
        return;
      }
      const lastSpinTimestamp = parseInt(savedTime, 10);
      const elapsed = Date.now() - lastSpinTimestamp;
      const remaining = COOLDOWN_MS - elapsed;

      if (remaining > 0) {
        setCooldownRemaining(remaining);
      } else {
        setCooldownRemaining(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCooldown = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpin = () => {
    if (isSpinning || cooldownRemaining > 0) return;

    // Trigger dual ad rotation (Adsterra / Monetag)
    try {
      triggerSmartAd('spin');
    } catch (e) {
      console.warn('Ad trigger ignored', e);
    }

    triggerHaptic('heavy');
    playAppSound('click');
    setIsSpinning(true);
    setRecentWin(null);

    // Pick a random sector (or weighted toward fun amounts)
    const chosenIndex = Math.floor(Math.random() * SECTORS.length);
    const chosenSector = SECTORS[chosenIndex];

    const sectorAngle = 360 / SECTORS.length;
    const extraSpins = 6 * 360; // 6 full revolutions
    // Arrow is at the top (270 deg or 0 deg relative to canvas).
    // Center of sector i is at i * sectorAngle + sectorAngle / 2
    const targetAngle = 360 - (chosenIndex * sectorAngle + sectorAngle / 2);
    const finalAngle = rotation + extraSpins + (targetAngle - (rotation % 360));

    setRotation(finalAngle);

    // After animation finishes (3.5s)
    setTimeout(() => {
      setIsSpinning(false);
      setRecentWin(chosenSector.amount);

      // Save 24h cooldown to localStorage
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, now.toString());
      setCooldownRemaining(COOLDOWN_MS);

      // Trigger reward callback to parent
      onWinReward(chosenSector.amount);
      triggerHaptic('success');
      playAppSound('win');
    }, 3600);
  };

  const canSpin = cooldownRemaining <= 0 && !isSpinning;

  return (
    <div className="px-4 py-2" id="section-daily-spin">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/60 to-purple-100/40 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

        {/* Header Title & Timer */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  ডেইলি লাকি স্পিন (Daily Spin)
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                  24H
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                প্রতি ২৪ ঘণ্টায় একবার চাকা ঘুরিয়ে ফ্রি টাকা জিতুন!
              </p>
            </div>
          </div>

          {cooldownRemaining > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{formatCooldown(cooldownRemaining)}</span>
            </div>
          )}
        </div>

        {/* Wheel Graphic Container */}
        <div className="relative z-10 flex flex-col items-center justify-center py-2">
          {/* Top Indicator Arrow */}
          <div className="z-20 -mb-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-rose-600 drop-shadow-md" />

          {/* Rotating Wheel */}
          <div
            className="w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 border-slate-900 shadow-xl relative overflow-hidden flex items-center justify-center transition-transform duration-[3600ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(
                #6366f1 0deg 45deg,
                #10b981 45deg 90deg,
                #f59e0b 90deg 135deg,
                #ec4899 135deg 180deg,
                #8b5cf6 180deg 225deg,
                #3b82f6 225deg 270deg,
                #ef4444 270deg 315deg,
                #14b8a6 315deg 360deg
              )`,
            }}
            id="wheel-canvas"
          >
            {/* Center Cap Button / Pin */}
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-amber-400 z-10 flex items-center justify-center shadow-lg text-amber-400">
              <Gift className="w-5 h-5" />
            </div>

            {/* Segment Labels */}
            <div className="absolute inset-0 pointer-events-none text-white text-[10px] font-black select-none">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 drop-shadow-md">৳১.০</span>
              <span className="absolute top-7 right-5 drop-shadow-md">৳২.৫</span>
              <span className="absolute top-1/2 -translate-y-1/2 right-2 drop-shadow-md">৳০.৫</span>
              <span className="absolute bottom-7 right-5 drop-shadow-md">৳৫.০</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 drop-shadow-md">৳১.৫</span>
              <span className="absolute bottom-7 left-5 drop-shadow-md">৳৩.০</span>
              <span className="absolute top-1/2 -translate-y-1/2 left-2 drop-shadow-md">৳১০🔥</span>
              <span className="absolute top-7 left-5 drop-shadow-md">৳২.০</span>
            </div>
          </div>
        </div>

        {/* Win Alert Badge */}
        {recentWin !== null && (
          <div className="relative z-10 mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in zoom-in duration-300">
            <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {isBn
                ? `অভিনন্দন! আপনি ${formatMoney(recentWin, currency)} জিতেছেন! ব্যালেন্সে যোগ হয়েছে।`
                : `Congratulations! You won ${formatMoney(recentWin, currency)}! Added to balance.`}
            </span>
          </div>
        )}

        {/* Spin CTA Button */}
        <div className="relative z-10 mt-3">
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            id="btn-spin-wheel"
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              canSpin
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 active:scale-[0.98] cursor-pointer'
                : isSpinning
                ? 'bg-amber-500 text-white cursor-wait opacity-90'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {isSpinning ? (
              <>
                <Play className="w-3.5 h-3.5 fill-white animate-spin" />
                <span>{isBn ? 'চাকা ঘুরছে... শুভকামনা!' : 'Wheel spinning... Good luck!'}</span>
              </>
            ) : cooldownRemaining > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isBn
                    ? `পরবর্তী ফ্রি স্পিন: ${formatCooldown(cooldownRemaining)} পর`
                    : `Next free spin in: ${formatCooldown(cooldownRemaining)}`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBn ? 'এখনই স্পিন করুন (Free Spin)' : 'Spin Now (Free Spin)'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

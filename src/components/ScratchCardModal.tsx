import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Trophy,
  Gift,
  X,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../utils/telegram";
import { triggerSmartAd } from "../utils/adManager";
import { AppPreferences, formatMoney, playAppSound } from "../utils/preferences";

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (amount: number) => void;
  preferences?: AppPreferences;
  onlineCount?: number;
}

const MAX_DAILY_CARDS = 3;
const STORAGE_DATE_KEY = "smart_earning_scratch_date";
const STORAGE_COUNT_KEY = "smart_earning_scratch_count";
const STORAGE_CARDS_KEY = "smart_earning_scratch_prizes";

const PRIZE_POOL = [
  { amount: 1.5, weight: 30, text: "৳১.৫০", note: "শুভকামনা!" },
  { amount: 2.0, weight: 25, text: "৳২.০০", note: "দারুণ!" },
  { amount: 3.0, weight: 20, text: "৳৩.০০", note: "চমৎকার!" },
  { amount: 5.0, weight: 15, text: "৳৫.০০", note: "বিগ উইন! 🔥" },
  { amount: 10.0, weight: 10, text: "৳১০.০০", note: "মেগা জ্যাকপট! 👑" },
];

function getRandomPrize(): { amount: number; text: string; note: string } {
  const totalWeight = PRIZE_POOL.reduce((acc, p) => acc + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of PRIZE_POOL) {
    if (random < prize.weight) return prize;
    random -= prize.weight;
  }
  return PRIZE_POOL[0];
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
  preferences,
}) => {
  const isBn = preferences?.language !== "en";
  const currency = preferences?.currency || "BDT";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const [cardsUsedToday, setCardsUsedToday] = useState<number>(0);
  const [currentPrize, setCurrentPrize] = useState<{
    amount: number;
    text: string;
    note: string;
  } | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);

  // Initialize and check daily card reset
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
    const savedCount = localStorage.getItem(STORAGE_COUNT_KEY);

    if (savedDate !== todayStr) {
      // New day: reset limit to 0
      localStorage.setItem(STORAGE_DATE_KEY, todayStr);
      localStorage.setItem(STORAGE_COUNT_KEY, "0");
      setCardsUsedToday(0);
    } else if (savedCount) {
      setCardsUsedToday(parseInt(savedCount, 10) || 0);
    }
  }, [isOpen]);

  // Setup new scratch card canvas
  const initCard = () => {
    const newPrize = getRandomPrize();
    setCurrentPrize(newPrize);
    setIsScratched(false);
    setIsClaimed(false);
    setScratchPercent(0);

    // Give react time to render canvas
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Draw metallic gold/silver gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#d97706"); // Amber 600
      grad.addColorStop(0.3, "#fbbf24"); // Amber 400
      grad.addColorStop(0.6, "#f59e0b"); // Amber 500
      grad.addColorStop(1, "#b45309"); // Amber 700

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw shiny sparkle decorations
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw scratch guide banner text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Hind Siliguri', sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText(
        isBn ? "✨ এখানে ঘষুন এবং জিতুন ✨" : "✨ Scratch Here to Win ✨",
        width / 2,
        height / 2 - 10
      );

      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#fef3c7";
      ctx.fillText(
        isBn ? "আঙ্গুল দিয়ে ঘষে পুরস্কার দেখুন" : "Rub with finger to reveal",
        width / 2,
        height / 2 + 16
      );
      ctx.shadowBlur = 0;
    }, 50);
  };

  useEffect(() => {
    if (isOpen && cardsUsedToday < MAX_DAILY_CARDS) {
      initCard();
    }
  }, [isOpen, cardsUsedToday]);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched || isClaimed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    triggerHaptic("light");
    checkScratchProgress();
  };

  const checkScratchProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const pixels = imageData.data;
      let transparentCount = 0;
      const totalPixels = pixels.length / 4;

      // Sample every 4th pixel for high performance
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) {
          transparentCount += 4;
        }
      }

      const percent = Math.min(100, Math.round((transparentCount / totalPixels) * 100));
      setScratchPercent(percent);

      if (percent > 42 && !isScratched) {
        revealFullPrize();
      }
    } catch (e) {
      // Fallback
    }
  };

  const revealFullPrize = () => {
    setIsScratched(true);
    setScratchPercent(100);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    triggerHaptic("success");
    playAppSound("win");
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#10b981", "#6366f1"],
      });
    } catch (e) {}
  };

  const handleClaim = () => {
    if (!currentPrize || isClaimed) return;

    // Trigger Smart Ad (Adsterra / Monetag dual rotation)
    try {
      triggerSmartAd("scratch");
    } catch (e) {
      console.warn("Ad trigger error:", e);
    }

    setIsClaimed(true);
    const nextUsed = cardsUsedToday + 1;
    setCardsUsedToday(nextUsed);
    localStorage.setItem(STORAGE_COUNT_KEY, nextUsed.toString());

    onClaimReward(currentPrize.amount);
    triggerHaptic("heavy");

    // If more cards remaining, prep next after short delay
    if (nextUsed < MAX_DAILY_CARDS) {
      setTimeout(() => {
        initCard();
      }, 1200);
    }
  };

  const handleStartNextCard = () => {
    if (cardsUsedToday < MAX_DAILY_CARDS) {
      // Trigger Ad on opening next card
      try {
        triggerSmartAd("scratch");
      } catch (e) {}
      initCard();
    }
  };

  if (!isOpen) return null;

  const cardsLeft = Math.max(0, MAX_DAILY_CARDS - cardsUsedToday);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 relative"
          id="modal-scratch-win"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white relative">
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Gift className="w-6 h-6 text-yellow-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-white drop-shadow-xs">
                    {isBn ? "লাকি স্ক্র্যাচ কার্ড" : "Lucky Scratch & Win"}
                  </h3>
                  <span className="bg-white/25 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/30">
                    Daily
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-medium">
                  {isBn
                    ? "কার্ড ঘষে তাৎক্ষণিক টাকা জিতুন!"
                    : "Scratch & win instant real cash!"}
                </p>
              </div>
            </div>

            {/* Daily limit badge */}
            <div className="mt-3 flex items-center justify-between bg-black/20 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-white/10 text-xs">
              <span className="text-amber-100 font-bold">
                {isBn ? "আজকের সুযোগ বাকি:" : "Cards remaining today:"}
              </span>
              <span className="font-mono font-black text-white bg-amber-600/60 px-2 py-0.5 rounded-md">
                {cardsLeft} / {MAX_DAILY_CARDS}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 flex flex-col items-center">
            {cardsLeft === 0 && isClaimed ? (
              /* All daily cards exhausted */
              <div className="py-6 text-center space-y-3 w-full">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-base">
                    {isBn ? "আজকের সকল কার্ড সম্পন্ন!" : "Daily Cards Finished!"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {isBn
                      ? "আপনি আজকের ৩টি স্ক্র্যাচ কার্ডই ব্যবহার করে ফেলেছেন। আগামীকাল রাত ১২টার পর আবার ৩টি নতুন কার্ড পাবেন!"
                      : "You have used all 3 scratch cards for today. Check back tomorrow for 3 new cards!"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>
                    {isBn
                      ? "পরবর্তী কার্ড রিফ্রেশ: আগামীকাল"
                      : "Next refresh: Tomorrow"}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  {isBn ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            ) : (
              /* Active Scratch Card Area */
              <div className="w-full flex flex-col items-center">
                {/* Scratch Box Container */}
                <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 select-none">
                  {/* Underneath Reward Layer (Always rendered, revealed as canvas is scratched) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-900 shadow-md mb-2 animate-bounce">
                      <Trophy className="w-6 h-6 text-amber-900" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                      {currentPrize?.note}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-0.5">
                      {currentPrize ? formatMoney(currentPrize.amount, currency) : "৳০.০০"}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {isBn ? "ইনস্ট্যান্ট ক্যাশ ব্যালেন্স" : "Instant Cash Balance"}
                    </span>
                  </div>

                  {/* Top Canvas Scratch Layer */}
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={208}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    onMouseDown={(e) => {
                      isDrawingRef.current = true;
                      scratchAt(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => {
                      if (isDrawingRef.current) {
                        scratchAt(e.clientX, e.clientY);
                      }
                    }}
                    onMouseUp={() => {
                      isDrawingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isDrawingRef.current = false;
                    }}
                    onTouchStart={(e) => {
                      isDrawingRef.current = true;
                      if (e.touches[0]) {
                        scratchAt(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isDrawingRef.current && e.touches[0]) {
                        scratchAt(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={() => {
                      isDrawingRef.current = false;
                    }}
                  />
                </div>

                {/* Progress & Auto-Reveal Help */}
                <div className="w-full mt-3 flex items-center justify-between px-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-500">
                    {isScratched
                      ? isBn
                        ? "🎉 সম্পূর্ণ উন্মোচিত!"
                        : "🎉 Fully Revealed!"
                      : isBn
                      ? `ঘষা হয়েছে: ${scratchPercent}%`
                      : `Scratched: ${scratchPercent}%`}
                  </span>

                  {!isScratched && (
                    <button
                      onClick={revealFullPrize}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      {isBn ? "স্বয়ংক্রিয় উন্মোচন (Auto Reveal)" : "Auto Reveal"}
                    </button>
                  )}
                </div>

                {/* Action CTA Button */}
                <div className="w-full mt-4">
                  {isScratched && !isClaimed ? (
                    <button
                      onClick={handleClaim}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-200" />
                      <span>
                        {isBn
                          ? `+${formatMoney(currentPrize?.amount || 0, currency)} ব্যালেন্সে নিন`
                          : `Claim +${formatMoney(currentPrize?.amount || 0, currency)} to Balance`}
                      </span>
                    </button>
                  ) : isClaimed && cardsLeft > 0 ? (
                    <button
                      onClick={handleStartNextCard}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {isBn
                          ? `পরবর্তী কার্ড ঘষুন (${cardsLeft}টি বাকি)`
                          : `Scratch Next Card (${cardsLeft} left)`}
                      </span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {isBn
                          ? "পুরস্কার ক্লেইম করতে কার্ডটি ঘষুন"
                          : "Scratch the card to claim prize"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

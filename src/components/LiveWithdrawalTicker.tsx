import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";
import { WithdrawalRecord } from "../types";
import { AppPreferences } from "../utils/preferences";

interface LiveProofItem {
  id: string;
  name: string;
  phoneMasked: string;
  method: string;
  amount: number;
  timeAgoBn: string;
  timeAgoEn: string;
  isReal?: boolean;
}

const MOCK_PROOFS: Omit<LiveProofItem, "id">[] = [
  {
    name: "রাকিব হোসেন",
    phoneMasked: "017*****89",
    method: "bKash",
    amount: 1500,
    timeAgoBn: "১ মিনিট আগে",
    timeAgoEn: "1 min ago",
  },
  {
    name: "তানভীর হাসান",
    phoneMasked: "018*****34",
    method: "Nagad",
    amount: 2000,
    timeAgoBn: "২ মিনিট আগে",
    timeAgoEn: "2 mins ago",
  },
  {
    name: "ফারহানা আক্তার",
    phoneMasked: "019*****12",
    method: "bKash",
    amount: 1000,
    timeAgoBn: "৩ মিনিট আগে",
    timeAgoEn: "3 mins ago",
  },
  {
    name: "শামীম রেজা",
    phoneMasked: "016*****78",
    method: "Binance",
    amount: 3500,
    timeAgoBn: "৪ মিনিট আগে",
    timeAgoEn: "4 mins ago",
  },
  {
    name: "মেহেদী হাসান",
    phoneMasked: "013*****90",
    method: "bKash",
    amount: 5000,
    timeAgoBn: "এইমাত্র",
    timeAgoEn: "Just now",
  },
  {
    name: "সাকিব আহমেদ",
    phoneMasked: "017*****45",
    method: "Rocket",
    amount: 1200,
    timeAgoBn: "৫ মিনিট আগে",
    timeAgoEn: "5 mins ago",
  },
  {
    name: "নুসরাত জাহান",
    phoneMasked: "019*****67",
    method: "Nagad",
    amount: 1800,
    timeAgoBn: "১ মিনিট আগে",
    timeAgoEn: "1 min ago",
  },
  {
    name: "ইমন আহমেদ",
    phoneMasked: "018*****23",
    method: "Upay",
    amount: 1000,
    timeAgoBn: "৩ মিনিট আগে",
    timeAgoEn: "3 mins ago",
  },
  {
    name: "সুমন ইসলাম",
    phoneMasked: "015*****55",
    method: "bKash",
    amount: 2500,
    timeAgoBn: "৬ মিনিট আগে",
    timeAgoEn: "6 mins ago",
  },
  {
    name: "অনিক চৌধুরী",
    phoneMasked: "014*****88",
    method: "CellFin",
    amount: 3000,
    timeAgoBn: "এইমাত্র",
    timeAgoEn: "Just now",
  },
  {
    name: "তারেক রহমান",
    phoneMasked: "017*****11",
    method: "Binance",
    amount: 4200,
    timeAgoBn: "২ মিনিট আগে",
    timeAgoEn: "2 mins ago",
  },
  {
    name: "জান্নাতুল ফেরদৌস",
    phoneMasked: "018*****99",
    method: "bKash",
    amount: 1000,
    timeAgoBn: "৪ মিনিট আগে",
    timeAgoEn: "4 mins ago",
  },
  {
    name: "রিফাত খান",
    phoneMasked: "019*****44",
    method: "Nagad",
    amount: 2800,
    timeAgoBn: "৭ মিনিট আগে",
    timeAgoEn: "7 mins ago",
  },
  {
    name: "হাবিবুর রহমান",
    phoneMasked: "016*****33",
    method: "Rocket",
    amount: 1500,
    timeAgoBn: "এইমাত্র",
    timeAgoEn: "Just now",
  },
  {
    name: "মিতু চৌধুরী",
    phoneMasked: "013*****22",
    method: "Binance",
    amount: 6000,
    timeAgoBn: "৫ মিনিট আগে",
    timeAgoEn: "5 mins ago",
  },
];

interface LiveWithdrawalTickerProps {
  preferences: AppPreferences;
  realWithdrawals?: WithdrawalRecord[];
  onOpenWithdraw?: () => void;
}

export const LiveWithdrawalTicker: React.FC<LiveWithdrawalTickerProps> = ({
  preferences,
  realWithdrawals = [],
  onOpenWithdraw,
}) => {
  const [currentProof, setCurrentProof] = useState<LiveProofItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isBn = preferences.language !== "en";

  useEffect(() => {
    let timeoutId: any;
    let hideTimeoutId: any;

    const showNextProof = () => {
      if (dismissed) return;

      // Randomly pick either a recent real approved withdrawal or a mock proof
      let item: LiveProofItem;
      const approvedReals = realWithdrawals.filter(
        (w) => w.status === "Approved" || w.status === "Pending"
      );

      if (approvedReals.length > 0 && Math.random() > 0.45) {
        const randomReal =
          approvedReals[Math.floor(Math.random() * approvedReals.length)];
        const phone = randomReal.accountNumber || "01700000000";
        const masked =
          phone.length >= 7
            ? `${phone.slice(0, 3)}*****${phone.slice(-2)}`
            : "017*****89";

        item = {
          id: `real_${randomReal.id}_${Date.now()}`,
          name: randomReal.userName || (isBn ? "ইউজার" : "User"),
          phoneMasked: masked,
          method: (randomReal.method as any) || "bKash",
          amount: Math.max(1000, randomReal.amount || 1000),
          timeAgoBn: "এইমাত্র পরিশোধিত",
          timeAgoEn: "Just Paid",
          isReal: true,
        };
      } else {
        const randomMock =
          MOCK_PROOFS[Math.floor(Math.random() * MOCK_PROOFS.length)];
        item = {
          ...randomMock,
          id: `mock_${Date.now()}_${Math.random()}`,
        };
      }

      setCurrentProof(item);
      setIsVisible(true);

      // Hide after 4.8 seconds
      hideTimeoutId = setTimeout(() => {
        setIsVisible(false);
        // Wait 7 to 12 seconds before next popup
        const nextDelay = Math.floor(Math.random() * 5000) + 7000;
        timeoutId = setTimeout(showNextProof, nextDelay);
      }, 4800);
    };

    // First appearance 3.5 seconds after app load
    timeoutId = setTimeout(showNextProof, 3500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(hideTimeoutId);
    };
  }, [realWithdrawals, dismissed, isBn]);

  if (!currentProof || !isVisible || dismissed) {
    return null;
  }

  const getMethodBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes("bkash") || m.includes("বিকাশ")) {
      return {
        bg: "bg-pink-600",
        text: "text-pink-600",
        border: "border-pink-200",
        lightBg: "bg-pink-50",
        label: isBn ? "বিকাশ" : "bKash",
      };
    }
    if (m.includes("nagad") || m.includes("নগদ")) {
      return {
        bg: "bg-orange-600",
        text: "text-orange-600",
        border: "border-orange-200",
        lightBg: "bg-orange-50",
        label: isBn ? "নগদ" : "Nagad",
      };
    }
    if (m.includes("binance") || m.includes("usdt") || m.includes("crypto") || m.includes("বাইন্যান্স")) {
      return {
        bg: "bg-amber-500",
        text: "text-amber-600",
        border: "border-amber-200",
        lightBg: "bg-amber-50",
        label: isBn ? "বাইন্যান্স" : "Binance",
      };
    }
    if (m.includes("upay") || m.includes("উপায়")) {
      return {
        bg: "bg-cyan-600",
        text: "text-cyan-600",
        border: "border-cyan-200",
        lightBg: "bg-cyan-50",
        label: isBn ? "উপায়" : "Upay",
      };
    }
    if (m.includes("cellfin") || m.includes("সেলফিন")) {
      return {
        bg: "bg-emerald-600",
        text: "text-emerald-600",
        border: "border-emerald-200",
        lightBg: "bg-emerald-50",
        label: isBn ? "সেলফিন" : "CellFin",
      };
    }
    return {
      bg: "bg-purple-600",
      text: "text-purple-600",
      border: "border-purple-200",
      lightBg: "bg-purple-50",
      label: isBn ? "রকেট" : "Rocket",
    };
  };

  const badge = getMethodBadge(currentProof.method);

  const formatAmount = (amt: number) => {
    if (isBn) {
      const bnDigits: { [k: string]: string } = {
        "0": "০",
        "1": "১",
        "2": "২",
        "3": "৩",
        "4": "৪",
        "5": "৫",
        "6": "৬",
        "7": "৭",
        "8": "৮",
        "9": "৯",
      };
      const numStr = amt.toString().replace(/[0-9]/g, (d) => bnDigits[d] || d);
      return `৳${numStr}`;
    }
    return `৳${amt}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={currentProof.id}
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed bottom-[4.8rem] left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm"
          onClick={() => {
            if (onOpenWithdraw) onOpenWithdraw();
          }}
        >
          <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3 shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-transform">
            {/* Left glowing animated pill indicator */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Method Icon / Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-xl ${badge.bg} flex items-center justify-center text-white font-black text-[11px] shadow-sm`}
                >
                  {badge.label.slice(0, 2)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white shadow-xs">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              </div>

              {/* Text Info */}
              <div className="flex flex-col min-w-0 leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[11px] text-slate-800 truncate max-w-[100px]">
                    {currentProof.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentProof.phoneMasked}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {isBn ? "পেমেন্ট সফল" : "Paid"}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                  <span>
                    {isBn
                      ? `${badge.label} থেকে `
                      : `withdrew via ${badge.label} `}
                  </span>
                  <span className="font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded text-[11px]">
                    {formatAmount(currentProof.amount)}
                  </span>
                  <span className="text-slate-400 text-[10px] ml-1">
                    • {isBn ? currentProof.timeAgoBn : currentProof.timeAgoEn}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side Close / Dismiss Button */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtle Top shimmer bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

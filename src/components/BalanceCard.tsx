import React from 'react';
import { Bell, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { AppPreferences, CURRENCY_CONFIGS, formatMoney } from '../utils/preferences';

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
  const isBn = preferences?.language !== 'en';
  const currency = preferences?.currency || 'BDT';
  const curConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.BDT;
  const progressPercent = Math.min(100, Math.max(1, (balance / minWithdraw) * 100));

  return (
    <div className="px-4 py-2.5" id="section-balance-card">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-200/80 border border-slate-800">
        <div className="relative z-10 flex flex-col space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isBn ? 'মোট ব্যালেন্স' : 'Total Balance'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {curConfig.flag} {currency}
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenWithdraw();
              }}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors font-semibold cursor-pointer"
              id="btn-quick-withdraw-link"
            >
              <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Large Balance Display */}
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-400">{curConfig.symbol}</span>
            <span className="text-4xl font-black tracking-tight text-white font-mono">
              {currency === 'BDT'
                ? balance.toFixed(2)
                : (balance * curConfig.rateFromBDT).toFixed(2)}
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {curConfig.code}
            </span>
            {currency !== 'BDT' && (
              <span className="text-[11px] text-slate-500 ml-1 font-mono">
                (≈ ৳{balance.toFixed(2)} BDT)
              </span>
            )}
          </div>

          {/* Progress bar towards minimum withdrawal */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{isBn ? 'প্রগ্রেস' : 'Progress'}: {progressPercent.toFixed(1)}%</span>
              <span>{isBn ? 'টার্গেট' : 'Target'}: {formatMoney(minWithdraw, currency)}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0 border border-slate-700/50">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Notice Banner */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenWithdraw();
            }}
            className="mt-1 flex items-center justify-between rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 px-3.5 py-2 text-xs font-semibold shadow-sm transition-transform active:scale-[0.99] border border-slate-700 cursor-pointer"
            id="btn-withdraw-alert-banner"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center">
                <Bell className="w-3 h-3 text-indigo-400" />
              </div>
              <span className="text-xs text-slate-300 font-medium">
                {isBn ? 'সর্বনিম্ন উত্তোলন' : 'Min Withdraw'}: {formatMoney(minWithdraw, currency)}
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
              {isBn ? 'উত্তোলন করুন' : 'Withdraw'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Volume2, Smartphone, Moon, BookOpen, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenGuide,
  onResetData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">সেটিংস ও সহায়তা (Settings)</h3>
              <p className="text-[11px] text-slate-400">অ্যাপ প্রেফারেন্স ও কন্ট্রোল</p>
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

        {/* Options */}
        <div className="p-4 space-y-3 bg-slate-50">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
              onOpenGuide();
            }}
            className="w-full p-3.5 bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-200 rounded-2xl flex items-center justify-between text-left transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">বট তৈরির সম্পূর্ণ নির্দেশিকা</h4>
                <p className="text-[10px] text-slate-500">How to create this Telegram Bot</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">ওপেন</span>
          </button>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">হ্যাপটিক ভাইব্রেশন</h4>
                <p className="text-[10px] text-slate-500">Telegram Haptic Feedback</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              সক্রিয় (ON)
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">নিরাপত্তা ও নীতিমালা</h4>
                <p className="text-[10px] text-slate-500">১০০% নিরাপদ আর্নিং মেথড</p>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">v1.2.0</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('warning');
              onResetData();
              onClose();
            }}
            className="w-full p-3.5 bg-white hover:bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center justify-between text-left text-rose-700 transition-colors shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-rose-700">ডেমো ব্যালেন্স ও টাস্ক রিসেট</h4>
                <p className="text-[10px] text-rose-500">টেস্টিং এর জন্য ডাটা রিসেট করুন</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

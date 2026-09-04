import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, DollarSign, Check, ArrowRight } from 'lucide-react';
import { AppLanguage, AppCurrency, AppPreferences, CURRENCY_CONFIGS, LANGUAGE_OPTIONS, formatMoney } from '../utils/preferences';
import { triggerHaptic } from '../utils/telegram';

interface InitialSetupModalProps {
  isOpen: boolean;
  currentPrefs: AppPreferences;
  onSave: (prefs: AppPreferences) => void;
  isFirstTime?: boolean;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, currentPrefs, onSave, isFirstTime = false }) => {
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(currentPrefs.language);
  const [selectedCurrency, setSelectedCurrency] = useState<AppCurrency>(currentPrefs.currency);

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHaptic('success');
    onSave({ language: selectedLang, currency: selectedCurrency });
  };

  const isBn = selectedLang === 'bn';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                {isFirstTime ? (isBn ? 'স্বাগতম' : 'Welcome') : (isBn ? 'সেটিংস' : 'Preferences')}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {isBn ? 'ভাষা ও কারেন্সি নির্বাচন' : 'Select Language & Currency'}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {isBn ? 'অ্যাপে প্রবেশ করার আগে আপনার পছন্দের ভাষা ও মুদ্রা বেছে নিন। পরবর্তীতে সেটিংস থেকে পরিবর্তন করতে পারবেন।' : 'Choose your preferred display language and currency. You can adjust this anytime in Settings.'}
          </p>
        </div>
        <div className="p-5 space-y-5 bg-slate-50 overflow-y-auto max-h-[68vh]">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isBn ? 'অ্যাপের ভাষা (Language)' : 'App Language'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button key={lang.code} type="button" onClick={() => { triggerHaptic('light'); setSelectedLang(lang.code); }} className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/70'}`}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xl">{lang.flag}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-500">{lang.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'মুদ্রা বা কারেন্সি (Currency)' : 'Currency'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CURRENCY_CONFIGS) as AppCurrency[]).map((curKey) => {
                const cur = CURRENCY_CONFIGS[curKey];
                const isSelected = selectedCurrency === curKey;
                return (
                  <button key={curKey} type="button" onClick={() => { triggerHaptic('light'); setSelectedCurrency(curKey); }} className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/70'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cur.flag}</span>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1">
                          <span>{cur.symbol}</span>
                          <span>{cur.code}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {isBn ? cur.nameBn.split(' ')[0] : cur.nameEn.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
            <span className="text-xs font-medium text-slate-600">
              {isBn ? 'ব্যালেন্স প্রদর্শন নমুনা:' : 'Preview balance format:'}
            </span>
            <span className="text-sm font-black text-indigo-700 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              {formatMoney(100, selectedCurrency)}
            </span>
          </div>
          <button onClick={handleConfirm} className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer">
            <span>{isFirstTime ? (isBn ? 'শুরু করুন' : 'Get Started') : (isBn ? 'সেভ করুন' : 'Save Changes')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, History, CreditCard, ShieldCheck } from 'lucide-react';
import { WithdrawalRecord } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  minWithdraw: number;
  withdrawals: WithdrawalRecord[];
  onRequestWithdraw: (newRecord: WithdrawalRecord) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  minWithdraw,
  withdrawals,
  onRequestWithdraw,
}) => {
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Personal' | 'Agent'>('Personal');
  const [amount, setAmount] = useState('1000');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন');
      triggerHaptic('warning');
      return;
    }

    if (parsedAmount < minWithdraw) {
      setErrorMsg(`সর্বনিম্ন উত্তোলনের সীমা ৳${minWithdraw.toFixed(2)} BDT`);
      triggerHaptic('warning');
      return;
    }

    if (parsedAmount > balance) {
      setErrorMsg('আপনার বর্তমান ব্যালেন্সে পর্যাপ্ত টাকা নেই!');
      triggerHaptic('warning');
      return;
    }

    if (!accountNumber || accountNumber.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন');
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    const newRecord: WithdrawalRecord = {
      id: 'tx_' + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString('bn-BD'),
      method,
      accountNumber,
      accountType,
      amount: parsedAmount,
      status: 'Pending',
    };

    onRequestWithdraw(newRecord);
    setSuccessMsg(`৳${parsedAmount} BDT উত্তোলনের আবেদন সফল হয়েছে! ২৪ ঘণ্টার মধ্যে আপনার ${method} একাউন্টে টাকা পৌঁছাবে।`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              🏦
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">টাকা উত্তোলন (Withdraw)</h3>
              <p className="text-[11px] text-slate-400">বিকাশ, নগদ, রকেটে পেমেন্ট নিন</p>
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

        {/* Tab switch */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>উত্তোলন ফরম</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>উত্তোলনের ইতিহাস ({withdrawals.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 bg-slate-50">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Balance & Min Withdraw Notice */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আপনার মোট ব্যালেন্স</span>
                  <div className="text-xl font-black text-indigo-400 font-mono">
                    ৳{balance.toFixed(2)} BDT
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মিনিমাম উইথড্র</span>
                  <div className="text-sm font-bold text-slate-300 font-mono">
                    ৳{minWithdraw.toFixed(2)} BDT
                  </div>
                </div>
              </div>

              {/* Select Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  পেমেন্ট মেথড বেছে নিন:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'bKash', name: 'বিকাশ' },
                    { id: 'Nagad', name: 'নগদ' },
                    { id: 'Rocket', name: 'রকেট' },
                    { id: 'Upay', name: 'উপায়' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setMethod(item.id as any);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                        method === item.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-black'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Type */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                <span className="text-slate-500 font-medium">অ্যাকাউন্ট টাইপ:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    checked={accountType === 'Personal'}
                    onChange={() => setAccountType('Personal')}
                    className="accent-indigo-600"
                  />
                  <span>পার্সোনাল</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    checked={accountType === 'Agent'}
                    onChange={() => setAccountType('Agent')}
                    className="accent-indigo-600"
                  />
                  <span>এজেন্ট</span>
                </label>
              </div>

              {/* Account Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {method} নম্বর (১১ ডিজিট):
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-600 font-mono tracking-wider shadow-sm"
                  maxLength={11}
                  required
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উত্তোলনের পরিমাণ (টাকা):
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-600 font-mono shadow-sm"
                  min={minWithdraw}
                  required
                />
                {/* Fast select amount pills */}
                <div className="flex gap-2 mt-2">
                  {['1000', '1500', '2000', '3000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-semibold shadow-sm transition-colors"
                    >
                      ৳{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error or Success message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-transform active:scale-98 flex items-center justify-center gap-2"
                id="btn-submit-withdrawal"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>উত্তোলন নিশ্চিত করুন</span>
              </button>
            </form>
          ) : (
            <div className="space-y-2.5">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  আপনার কোনো পূর্বের উত্তোলনের রেকর্ড নেই।
                </div>
              ) : (
                withdrawals.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{item.method}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({item.accountType})</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{item.accountNumber}</p>
                      <p className="text-[10px] text-slate-400">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        ৳{item.amount.toFixed(2)}
                      </span>
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.status === 'Pending' ? 'প্রক্রিয়াধীন' : item.status === 'Approved' ? 'পরিশোধিত' : 'বাতিল'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Landmark,
  Sliders,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  Phone,
  Calendar,
  Hash,
  ArrowDownToLine,
  RefreshCw,
  Send,
} from 'lucide-react';
import { AdminAdConfig, getAdConfig, saveAdConfig } from '../utils/adManager';
import { triggerHaptic, openAdLink } from '../utils/telegram';
import { WithdrawalRecord } from '../types';
import { playAppSound } from '../utils/preferences';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMinWithdraw: (amount: number) => void;
  onShowToast: (msg: string) => void;
  withdrawals: WithdrawalRecord[];
  onApproveWithdrawal: (id: string, trxId?: string) => void;
  onRejectWithdrawal: (id: string, reason?: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onUpdateMinWithdraw,
  onShowToast,
  withdrawals,
  onApproveWithdrawal,
  onRejectWithdrawal,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [config, setConfig] = useState<AdminAdConfig>(getAdConfig());
  const [newPin, setNewPin] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Admin section tabs: 'withdrawals' | 'ads'
  const [adminTab, setAdminTab] = useState<'withdrawals' | 'ads'>('withdrawals');

  // Withdrawals management state
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline approval / rejection forms
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [trxIdInput, setTrxIdInput] = useState('');
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // ALWAYS force password authentication every single time admin panel opens
    setIsAuthenticated(false);
    setPinError(false);
    setEnteredPin('');
    setShowSuccessBanner(false);
    setActiveApprovalId(null);
    setActiveRejectId(null);
    if (isOpen) {
      const currentConfig = getAdConfig();
      setConfig(currentConfig);
      // Auto focus on withdrawals tab if pending requests exist
      const hasPending = withdrawals.some((w) => w.status === 'Pending');
      if (hasPending) {
        setAdminTab('withdrawals');
        setStatusFilter('Pending');
      }
    }
  }, [isOpen]);

  const handleModalClose = () => {
    triggerHaptic('light');
    setIsAuthenticated(false);
    setEnteredPin('');
    onClose();
  };

  const handleLockAdmin = () => {
    triggerHaptic('medium');
    setIsAuthenticated(false);
    setEnteredPin('');
    onShowToast('🔒 অ্যাডমিন প্যানেল লক করা হয়েছে');
  };

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentConfig = getAdConfig();
    const targetPin = currentConfig.adminPin || '7788';

    if (enteredPin.trim() === targetPin.trim()) {
      triggerHaptic('success');
      playAppSound('reward');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      triggerHaptic('error');
      setPinError(true);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: AdminAdConfig = {
      ...config,
      minWithdraw: Math.max(10, Number(config.minWithdraw) || 50),
      adminPin: newPin.trim().length >= 4 ? newPin.trim() : config.adminPin,
    };

    saveAdConfig(updated);
    setConfig(updated);
    onUpdateMinWithdraw(updated.minWithdraw);

    triggerHaptic('success');
    setShowSuccessBanner(true);
    onShowToast('✅ অ্যাডমিন সেটিংস ও অ্যাড রোটেশন সফলভাবে সংরক্ষিত হয়েছে!');

    if (newPin.trim().length >= 4) {
      setNewPin('');
    }

    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 4000);
  };

  const handleResetCounters = () => {
    triggerHaptic('medium');
    const reset = {
      ...config,
      adsterraImpressions: 0,
      monetagImpressions: 0,
    };
    saveAdConfig(reset);
    setConfig(reset);
    onShowToast('কাউন্টার রিসেট সম্পন্ন হয়েছে');
  };

  const testLink = (url: string) => {
    if (!url || url.trim().length < 5) {
      alert('অনুগ্রহ করে সঠিক URL প্রদান করুন');
      return;
    }
    triggerHaptic('light');
    openAdLink(url);
  };

  const handleCopyAccount = (id: string, text: string) => {
    triggerHaptic('light');
    playAppSound('click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast(`নম্বর কপি হয়েছে: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmApproval = (id: string) => {
    triggerHaptic('success');
    playAppSound('win');
    onApproveWithdrawal(id, trxIdInput);
    setActiveApprovalId(null);
    setTrxIdInput('');
  };

  const handleConfirmRejection = (id: string) => {
    triggerHaptic('warning');
    onRejectWithdrawal(id, rejectReason);
    setActiveRejectId(null);
    setRejectReason('');
  };

  // Calculations for stats
  const pendingRequests = withdrawals.filter((w) => w.status === 'Pending');
  const approvedRequests = withdrawals.filter((w) => w.status === 'Approved');
  const rejectedRequests = withdrawals.filter((w) => w.status === 'Rejected');

  const pendingTotal = pendingRequests.reduce((sum, w) => sum + w.amount, 0);
  const approvedTotal = approvedRequests.reduce((sum, w) => sum + w.amount, 0);

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = w.accountNumber.toLowerCase().includes(q);
      const matchMethod = w.method.toLowerCase().includes(q);
      const matchUser = (w.userName || '').toLowerCase().includes(q);
      const matchId = w.id.toLowerCase().includes(q);
      const matchTrx = (w.trxId || '').toLowerCase().includes(q);
      return matchNumber || matchMethod || matchUser || matchId || matchTrx;
    }
    return true;
  });

  const getMethodBadgeStyle = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bkash':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'nagad':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rocket':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'upay':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-white flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                অ্যাডমিন প্যানেল (Admin Panel)
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAuthenticated ? '🟢 অ্যাডমিন মোড অ্যাক্টিভ' : '🔒 সিক্রেট পিন দিয়ে আনলক করুন'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isAuthenticated && (
              <button
                onClick={handleLockAdmin}
                title="লক করুন (Lock)"
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1 border border-amber-500/30 transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>লক</span>
              </button>
            )}
            <button
              onClick={handleModalClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PIN SCREEN (If not authenticated) */}
        {!isAuthenticated ? (
          <div className="p-6 bg-slate-50 flex flex-col items-center justify-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                সিক্রেট অ্যাডমিন পিন দিন
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                টাকা উত্তোলন অনুমোদন ও বিজ্ঞাপন কনফিগার করতে অ্যাডমিন পিন দিয়ে লগইন করুন।
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-4">
              <div className="relative">
                <input
                  type={showPinText ? 'text' : 'password'}
                  maxLength={10}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="৪ ডিজিট পিন লিখুন"
                  autoFocus
                  className={`w-full py-3 px-4 text-center tracking-widest text-lg font-mono font-bold rounded-2xl border ${
                    pinError
                      ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-rose-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-amber-500 focus:border-amber-500'
                  } focus:outline-none focus:ring-2 shadow-sm transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-bold animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ভুল পিন! সঠিক পিন দিন (ডিফল্ট: 7788)</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-amber-400" />
                <span>লগইন করুন (Unlock)</span>
              </button>
            </form>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center text-xs text-amber-800 max-w-xs">
              <span className="font-bold">🔑 ডিফল্ট অ্যাডমিন পিন: </span>
              <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                7788
              </span>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Top Navigation Bar: Withdrawals vs Ads & Settings */}
            <div className="flex bg-slate-900 px-3 pt-2 gap-2 border-b border-slate-800 flex-shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('withdrawals');
                }}
                className={`flex-1 flex items-center justify-center gap-2 pb-2.5 pt-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'withdrawals'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>উত্তোলন অনুমোদন (Withdraw)</span>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('ads');
                }}
                className={`flex-1 flex items-center justify-center gap-2 pb-2.5 pt-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'ads'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>অ্যাড ও সেটিংস (Ads & Config)</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {adminTab === 'withdrawals' ? (
              /* TAB 1: WITHDRAWALS MANAGEMENT & APPROVAL */
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        পেন্ডিং রিকোয়েস্ট
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
                      {pendingRequests.length} টি
                    </div>
                    <p className="text-[10px] text-amber-700 font-semibold font-mono">
                      মোট ৳{pendingTotal.toFixed(2)} BDT
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        পরিশোধিত (Approved)
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                      {approvedRequests.length} টি
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold font-mono">
                      মোট ৳{approvedTotal.toFixed(2)} BDT
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="নম্বর, TrxID বা নাম দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { key: 'all', label: 'সব', count: withdrawals.length },
                      { key: 'Pending', label: '⏳ পেন্ডিং', count: pendingRequests.length },
                      { key: 'Approved', label: '✅ অনুমোদিত', count: approvedRequests.length },
                      { key: 'Rejected', label: '❌ বাতিল', count: rejectedRequests.length },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => {
                          triggerHaptic('light');
                          setStatusFilter(f.key as any);
                        }}
                        className={`text-xs px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                          statusFilter === f.key
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Request List */}
                <div className="space-y-3">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">
                        কোনো উত্তোলনের আবেদন পাওয়া যায়নি
                      </p>
                    </div>
                  ) : (
                    filteredWithdrawals.map((record) => {
                      const isPending = record.status === 'Pending';
                      const isApproved = record.status === 'Approved';
                      const isRejected = record.status === 'Rejected';

                      return (
                        <div
                          key={record.id}
                          className={`p-3.5 bg-white rounded-2xl border transition-all shadow-xs ${
                            isPending
                              ? 'border-amber-300 ring-1 ring-amber-200/60'
                              : isApproved
                              ? 'border-slate-200'
                              : 'border-slate-200 opacity-80'
                          }`}
                        >
                          {/* Card Header: User & Status Badge */}
                          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {record.userName || 'ব্যবহারকারী'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{record.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{record.date}</span>
                                {record.processedAt && (
                                  <span>• প্রসেসড: {record.processedAt}</span>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isPending
                                ? '⏳ পেন্ডিং'
                                : isApproved
                                ? '✅ পেইড (Approved)'
                                : '❌ বাতিল (Rejected)'}
                            </span>
                          </div>

                          {/* Card Body: Method, Account Number, Amount */}
                          <div className="py-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${getMethodBadgeStyle(
                                    record.method
                                  )}`}
                                >
                                  {record.method}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  ({record.accountType === 'Personal' ? 'পার্সোনাল' : 'এজেন্ট'})
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-base font-black text-slate-900 font-mono">
                                  ৳{record.amount.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold ml-1">
                                  BDT
                                </span>
                              </div>
                            </div>

                            {/* Account Number with 1-click Copy */}
                            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                                  {record.accountNumber}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleCopyAccount(record.id, record.accountNumber)
                                }
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                                  copiedId === record.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {copiedId === record.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>কপি হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>নম্বর কপি</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* If Approved, show TrxID */}
                            {isApproved && record.trxId && (
                              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center justify-between font-mono">
                                <span className="font-medium text-emerald-700">TrxID:</span>
                                <span className="font-bold">{record.trxId}</span>
                              </div>
                            )}

                            {/* If Rejected, show reason */}
                            {isRejected && record.adminNote && (
                              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-0.5">
                                <span className="font-bold text-rose-900">বাতিলের কারণ: </span>
                                <span>{record.adminNote}</span>
                                <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                                  * টাকা ব্যবহারকারীর ব্যালেন্সে ফেরত দেওয়া হয়েছে।
                                </p>
                              </div>
                            )}
                          </div>

                          {/* ACTION CONTROLS FOR PENDING REQUESTS */}
                          {isPending && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              {activeApprovalId === record.id ? (
                                /* Inline Approval Drawer */
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>পেমেন্ট অনুমোদন নিশ্চিতকরণ</span>
                                    </h5>
                                    <button
                                      onClick={() => setActiveApprovalId(null)}
                                      className="text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-emerald-800">
                                    আপনি কি {record.method} নম্বরে (<b>{record.accountNumber}</b>) ৳{record.amount} টাকা পাঠিয়েছেন?
                                  </p>
                                  <div>
                                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                                      ট্রানজেকশন আইডি / TrxID (ঐচ্ছিক):
                                    </label>
                                    <input
                                      type="text"
                                      value={trxIdInput}
                                      onChange={(e) => setTrxIdInput(e.target.value)}
                                      placeholder={`যেমন: ${record.method.toUpperCase()}${Date.now().toString().slice(-6)}`}
                                      className="w-full text-xs font-mono py-1.5 px-2.5 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => handleConfirmApproval(record.id)}
                                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>হ্যাঁ, অনুমোদন করুন (Approve)</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveApprovalId(null)}
                                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                                    >
                                      ফিরে যান
                                    </button>
                                  </div>
                                </div>
                              ) : activeRejectId === record.id ? (
                                /* Inline Rejection Drawer */
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>উত্তোলন বাতিল ও টাকা রিফান্ড</span>
                                    </h5>
                                    <button
                                      onClick={() => setActiveRejectId(null)}
                                      className="text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-rose-800">
                                    বাতিল করলে ৳{record.amount} BDT স্বয়ংক্রিয়ভাবে ব্যবহারকারীর ব্যালেন্সে ফেরত যাবে।
                                  </p>
                                  <div>
                                    <label className="block text-[10px] font-bold text-rose-900 mb-1">
                                      বাতিলের কারণ (ইউজার দেখতে পাবে):
                                    </label>
                                    <input
                                      type="text"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder="ভুল একাউন্ট নম্বর / ফোন বন্ধ..."
                                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-rose-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 mb-1.5"
                                    />
                                    {/* Preset Reason Tags */}
                                    <div className="flex flex-wrap gap-1">
                                      {[
                                        'ভুল একাউন্ট নম্বর',
                                        'নম্বর বন্ধ/অপ্রাপ্য',
                                        'লিমিট অতিক্রম',
                                        'ফেক তথ্য প্রদান',
                                      ].map((reasonTag) => (
                                        <button
                                          key={reasonTag}
                                          type="button"
                                          onClick={() => setRejectReason(reasonTag)}
                                          className="text-[9px] font-bold bg-white hover:bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 cursor-pointer"
                                        >
                                          {reasonTag}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => handleConfirmRejection(record.id)}
                                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>বাতিল ও রিফান্ড করুন</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveRejectId(null)}
                                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                                    >
                                      ফিরে যান
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Default Approve / Reject Buttons */
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      triggerHaptic('light');
                                      setActiveApprovalId(record.id);
                                      setTrxIdInput(
                                        `${record.method.toUpperCase()}${Date.now()
                                          .toString()
                                          .slice(-6)}`
                                      );
                                      setActiveRejectId(null);
                                    }}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>অনুমোদন (Approve)</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      triggerHaptic('light');
                                      setActiveRejectId(record.id);
                                      setRejectReason('ভুল একাউন্ট নম্বর');
                                      setActiveApprovalId(null);
                                    }}
                                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-transform active:scale-98 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>বাতিল</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: ADS & SYSTEM CONFIGURATION */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {/* Success Banner */}
                {showSuccessBanner && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>সব অ্যাডমিন সেটিংস এবং বিজ্ঞাপন লিংক সেভ হয়েছে!</span>
                  </div>
                )}

                {/* Smart Location Note Banner */}
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950">
                      একই লোকেশন/আইপি সমস্যা সমাধান (Dual Ad System)
                    </h4>
                  </div>
                  <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                    একজন ব্যবহারকারী একই লোকেশন বা IP থেকে বারবার একই নেটওয়ার্কের অ্যাড দেখলে Adsterra বা Monetag বিজ্ঞাপন বাতিল/ব্যান করে দিতে পারে।
                    এখানে ২টি নেটওয়ার্কের লিংক দিন; অ্যাপ স্বয়ংক্রিয়ভাবে একটির পর অন্যটি অদলবদল (Alternate) করে দেখাবে।
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveAll} className="space-y-4">
                  {/* SECTION 1: DUAL AD LINKS */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>📡 ১. অ্যাড লিংক কনফিগারেশন</span>
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>

                    {/* Adsterra Link */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          <span>Adsterra Direct Link:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.adsterraUrl)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.adsterraUrl}
                        onChange={(e) => setConfig({ ...config, adsterraUrl: e.target.value })}
                        placeholder="https://www.profitablecpmrate.com/..."
                        className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Monetag Link */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Monetag Direct Link / SmartLink:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.monetagUrl)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.monetagUrl}
                        onChange={(e) => setConfig({ ...config, monetagUrl: e.target.value })}
                        placeholder="https://otieuhoo.net/... বা https://monetag.com/..."
                        className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Rotation Strategy */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-700">
                        অ্যাড রোটেশন মোড (Rotation Mode):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, rotationStrategy: 'alternate' })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.rotationStrategy === 'alternate'
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>🔄 অল্টারনেট (50/50)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ১ম Adsterra, ২য় Monetag (সেরা)
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, rotationStrategy: 'random' })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.rotationStrategy === 'random'
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">🎲 র‍্যান্ডম (Random)</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">৫০% র‍্যান্ডম সুযোগ</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, rotationStrategy: 'adsterra_only' })}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            config.rotationStrategy === 'adsterra_only'
                              ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-bold ring-1 ring-orange-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">🅰️ শুধু Adsterra</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, rotationStrategy: 'monetag_only' })}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            config.rotationStrategy === 'monetag_only'
                              ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-bold ring-1 ring-blue-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">Ⓜ️ শুধু Monetag</div>
                        </button>
                      </div>
                    </div>

                    {/* Impression Stats Pill */}
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3 font-medium">
                        <span className="text-orange-700 font-bold">
                          Adsterra: {config.adsterraImpressions}
                        </span>
                        <span className="text-blue-700 font-bold">
                          Monetag: {config.monetagImpressions}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetCounters}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>রিসেট</span>
                      </button>
                    </div>
                  </div>

                  {/* SECTION 2: AD TRIGGERS */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                      🎯 ২. কোথায় বিজ্ঞাপন ওপেন হবে (Ad Triggers)
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <span className="text-xs font-medium text-slate-700">
                          🎬 ভিডিও প্লে করার সময় অ্যাড ওপেন হবে
                        </span>
                        <input
                          type="checkbox"
                          checked={config.triggerOnVideo}
                          onChange={(e) =>
                            setConfig({ ...config, triggerOnVideo: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <span className="text-xs font-medium text-slate-700">
                          🎡 ডেইলি লাকি স্পিন ঘোরানোর সময়
                        </span>
                        <input
                          type="checkbox"
                          checked={config.triggerOnSpin}
                          onChange={(e) =>
                            setConfig({ ...config, triggerOnSpin: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <span className="text-xs font-medium text-slate-700">
                          ✅ টাস্ক সম্পন্ন করার সময়
                        </span>
                        <input
                          type="checkbox"
                          checked={config.triggerOnTask}
                          onChange={(e) =>
                            setConfig({ ...config, triggerOnTask: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  {/* SECTION 3: MIN WITHDRAWAL */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>৩. সর্বনিম্ন উত্তোলন লিমিট (Min Withdraw)</span>
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">৳</span>
                        <input
                          type="number"
                          min={10}
                          step={10}
                          value={config.minWithdraw}
                          onChange={(e) =>
                            setConfig({ ...config, minWithdraw: Number(e.target.value) })
                          }
                          className="w-full py-2 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 font-medium">BDT</span>
                      </div>

                      <div className="flex gap-2">
                        {[50, 100, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setConfig({ ...config, minWithdraw: amt })}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                              config.minWithdraw === amt
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            ৳{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: CHANGE PIN */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>৪. অ্যাডমিন পিন পরিবর্তন (Change PIN)</span>
                    </h4>

                    <div className="space-y-1.5">
                      <input
                        type="password"
                        maxLength={10}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder={`বর্তমান পিন: ${config.adminPin || '7788'} (নতুন পিন দিতে পারেন)`}
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        খালি রাখলে আগের পিন ({config.adminPin || '7788'}) বহাল থাকবে।
                      </p>
                    </div>
                  </div>

                  {/* SAVE BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>সব পরিবর্তন সেভ করুন (Save Changes)</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

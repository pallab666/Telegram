import { motion } from 'motion/react';
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
  Play,
  Link2,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  HelpCircle,
  Award,
  CheckCircle,
  Smartphone,
  Save,
  Radio,
  Megaphone,
  Settings,
  Users,
  Gift,
  Shield,
} from 'lucide-react';
import { AdminAdConfig, getAdConfig, saveAdConfig } from '../utils/adManager';
import { getLocalAnnouncement, saveLocalAnnouncement } from '../utils/announcementManager';
import { getSystemSettings, saveSystemSettings, SystemSettings } from '../utils/systemSettings';
import { triggerHaptic, openAdLink, sendTelegramNotification } from '../utils/telegram';
import { WithdrawalRecord, VideoClip, EarnTask } from '../types';
import { INITIAL_TASKS } from '../data/mockData';
import { playAppSound } from '../utils/preferences';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMinWithdraw: (amount: number) => void;
  onShowToast: (msg: string) => void;
  withdrawals: WithdrawalRecord[];
  onApproveWithdrawal: (id: string, trxId?: string) => void;
  onRejectWithdrawal: (id: string, reason?: string) => void;
  videos?: VideoClip[];
  onAddVideo?: (video: VideoClip) => void;
  onDeleteVideo?: (id: string) => void;
  onlineCount?: number;
  tasks?: EarnTask[];
  onUpdateTasks?: (tasks: EarnTask[]) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onUpdateMinWithdraw,
  onShowToast,
  withdrawals,
  onApproveWithdrawal,
  onRejectWithdrawal,
  videos = [],
  onAddVideo,
  onDeleteVideo,
  onlineCount = 1,
  tasks = [],
  onUpdateTasks,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [config, setConfig] = useState<AdminAdConfig>(getAdConfig());
  const [newPin, setNewPin] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Admin section tabs: 'withdrawals' | 'earnLinks' | 'ads' | 'videos' | 'announcement' | 'settings'
  const [adminTab, setAdminTab] = useState<'withdrawals' | 'earnLinks' | 'ads' | 'videos' | 'announcement' | 'settings'>('withdrawals');

  // System Settings state
  const [sysSettings, setSysSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Announcement Broadcast State in Admin Panel
  const [adminNotice, setAdminNotice] = useState(() => getLocalAnnouncement());
  const [noticeSavedSuccess, setNoticeSavedSuccess] = useState(false);

  // Earn Tasks state
  const [editableTasks, setEditableTasks] = useState<EarnTask[]>(() => {
    if (tasks && tasks.length > 0) return tasks;
    return INITIAL_TASKS;
  });

  const [testingLinkId, setTestingLinkId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilterCategory, setTaskFilterCategory] = useState<'all' | 'visit' | 'special'>('all');

  // New Custom Task form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTitleBn, setNewTaskTitleBn] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('2.50');
  const [newTaskDuration, setNewTaskDuration] = useState('15');
  const [newTaskIconType, setNewTaskIconType] = useState<EarnTask['iconType']>('web');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('visit');

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setEditableTasks(tasks);
    }
  }, [tasks]);

  const handleUpdateTaskLink = (taskId: string, newLink: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, link: newLink } : t))
    );
  };

  const handleUpdateTaskReward = (taskId: string, newReward: number) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reward: newReward } : t))
    );
  };

  const handleUpdateTaskDuration = (taskId: string, newDuration: number) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, duration: newDuration } : t))
    );
  };

  const handleUpdateTaskTitleBn = (taskId: string, newTitleBn: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, titleBn: newTitleBn } : t))
    );
  };

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    setEditableTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
    );
  };

  const handleSaveEarnLinks = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('success');
    playAppSound('win');

    if (onUpdateTasks) {
      onUpdateTasks(editableTasks);
    }
    // Also save config in case ad URL was modified
    saveAdConfig(config);

    setShowSuccessBanner(true);
    onShowToast('✅ Earn সেকশনের সকল টাস্ক ও লিংক সফলভাবে সেভ হয়েছে!');

    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 4000);
  };

  const handleResetDefaultTasks = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে Earn সেকশনের সব লিংক ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      triggerHaptic('medium');
      setEditableTasks(INITIAL_TASKS);
      if (onUpdateTasks) {
        onUpdateTasks(INITIAL_TASKS);
      }
      onShowToast('🔄 সকল টাস্ক লিংক ডিফল্ট অবস্থায় রিস্টোর হয়েছে');
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitleBn.trim() && !newTaskTitle.trim()) {
      alert('টাস্কের নাম দিন');
      return;
    }
    if (!newTaskLink.trim()) {
      alert('টাস্কের লিংক (URL) দিন');
      return;
    }

    let formattedLink = newTaskLink.trim();
    if (
      !formattedLink.startsWith('http://') &&
      !formattedLink.startsWith('https://') &&
      !formattedLink.startsWith('tg://')
    ) {
      formattedLink = `https://${formattedLink}`;
    }

    const newTask: EarnTask = {
      id: `task_custom_${Date.now()}`,
      title: newTaskTitle.trim() || newTaskTitleBn.trim(),
      titleBn: newTaskTitleBn.trim() || newTaskTitle.trim(),
      reward: Number(newTaskReward) || 2.5,
      iconType: newTaskIconType,
      category: newTaskCategory,
      completed: false,
      link: formattedLink,
      duration: Number(newTaskDuration) || 15,
    };

    const updated = [...editableTasks, newTask];
    setEditableTasks(updated);
    if (onUpdateTasks) {
      onUpdateTasks(updated);
    }

    setNewTaskTitle('');
    setNewTaskTitleBn('');
    setNewTaskLink('');
    setNewTaskReward('2.50');
    setNewTaskDuration('15');
    setIsAddingTask(false);

    triggerHaptic('success');
    playAppSound('reward');
    onShowToast('✅ নতুন আর্নিং টাস্ক লিংক সফলভাবে যুক্ত হয়েছে!');

    // Trigger Telegram Notification for New Task
    sendTelegramNotification({
      type: 'task',
      title: newTaskTitle.trim() || newTaskTitleBn.trim(),
      reward: Number(newTaskReward) || 2.5,
      link: formattedLink,
    }).then((res) => {
      if (res && res.message) {
        onShowToast(`📢 ${res.message}`);
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    triggerHaptic('warning');
    const updated = editableTasks.filter((t) => t.id !== taskId);
    setEditableTasks(updated);
    if (onUpdateTasks) {
      onUpdateTasks(updated);
    }
    onShowToast('টাস্ক মুছে ফেলা হয়েছে');
  };

  const handleTestLink = (url?: string, id?: string) => {
    if (!url || !url.trim()) {
      onShowToast('⚠️ কোনো লিংক দেওয়া নেই');
      return;
    }
    triggerHaptic('light');
    if (id) {
      setTestingLinkId(id);
      setTimeout(() => setTestingLinkId(null), 2000);
    }
    let target = url.trim();
    if (
      !target.startsWith('http://') &&
      !target.startsWith('https://') &&
      !target.startsWith('tg://')
    ) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    onShowToast(`🔗 লিংক টেস্ট খোলা হয়েছে: ${target.slice(0, 32)}...`);
  };

  // Withdrawals management state
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Video management state
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoThumb, setNewVideoThumb] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState<'all' | 'movies' | 'funny' | 'music' | 'gaming' | 'news'>('movies');
  const [newVideoReward, setNewVideoReward] = useState('3.00');
  const [newVideoDuration, setNewVideoDuration] = useState('20');

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
    const targetPin = currentConfig.adminPin || '3048';

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
      minWithdraw: Math.max(10, Number(config.minWithdraw) || 1000),
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm">
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
                  <span>ভুল পিন! সঠিক পিন দিন</span>
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
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Top Navigation Bar: Withdrawals vs Earn Links vs Ads & Settings vs Videos */}
            <div className="flex bg-slate-900 px-2 pt-2 gap-1 border-b border-slate-800 flex-shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('withdrawals');
                }}
                className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'withdrawals'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>উত্তোলন</span>
                {pendingRequests.length > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('earnLinks');
                }}
                className={`flex-1 min-w-[82px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'earnLinks'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                <span>আর্নিং লিংক</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('ads');
                }}
                className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'ads'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>বিজ্ঞাপন</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('videos');
                }}
                className={`flex-1 min-w-[65px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'videos'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>ভিডিও</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('announcement');
                }}
                className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'announcement'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>নোটিশ</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAdminTab('settings');
                }}
                className={`flex-1 min-w-[75px] flex items-center justify-center gap-1 pb-2 pt-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${
                  adminTab === 'settings'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>সেটিংস</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {adminTab === 'withdrawals' ? (
              /* TAB 1: WITHDRAWALS MANAGEMENT & APPROVAL */
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                        পেন্ডিং
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                      {pendingRequests.length} টি
                    </div>
                    <p className="text-[9px] text-amber-700 font-semibold font-mono truncate">
                      ৳{pendingTotal.toFixed(0)}
                    </p>
                  </div>

                  <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                        পরিশোধিত
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="text-base font-black text-emerald-950 font-mono mt-0.5">
                      {approvedRequests.length} টি
                    </div>
                    <p className="text-[9px] text-emerald-700 font-semibold font-mono truncate">
                      ৳{approvedTotal.toFixed(0)}
                    </p>
                  </div>

                  <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-800 uppercase tracking-wider">
                        অনলাইন
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="text-base font-black text-indigo-950 font-mono mt-0.5">
                      {onlineCount} জন
                    </div>
                    <p className="text-[9px] text-indigo-700 font-semibold truncate">
                      লাইভ রিয়েল-টাইম
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
            ) : adminTab === 'earnLinks' ? (
              /* TAB 2: EARN SECTION LINKS & TASKS CONTROL */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {/* Success Notification Banner */}
                {showSuccessBanner && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p>Earn সেকশনের সকল টাস্ক ও লিংক সফলভাবে সেভ হয়েছে!</p>
                      <p className="text-[10px] font-normal text-emerald-700">ব্যবহারকারীরা এখন নতুন লিংকে সরাসরি প্রবেশ করবে।</p>
                    </div>
                  </div>
                )}

                {/* Explanatory Info Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/80 text-purple-950 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-950">
                        Earn সেকশনের লিংক কন্ট্রোল প্যানেল
                      </h4>
                      <p className="text-[10px] text-purple-700">
                        টেলিগ্রাম, ইউটিউব, ফেসবুক ও স্পন্সর ওয়েবসাইট লিংক পরিবর্তন করুন
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-900/90 leading-relaxed pt-1">
                    ইউজারদের অ্যাপের Earn স্ক্রিনে যে সোশ্যাল ও ওয়েব ভিজিট লিংকগুলো থাকে, সেগুলো আপনি যেকোনো সময় এখান থেকে পরিবর্তন করতে পারেন। লিংক দেওয়ার পর <span className="font-bold text-purple-700">"টেস্ট"</span> বাটনে চাপ দিয়ে যাচাই করতে পারবেন। পরিবর্তন শেষে নিচের <span className="font-bold text-purple-700">"সব লিংক সেভ করুন"</span> বাটনে চাপুন।
                  </p>
                </div>

                {/* 1. Watch Ads Card Direct Ad Link (Top Hero Card in Earn Section) */}
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
                        📺
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span>বিজ্ঞাপন দেখুন ও আয় করুন লিংক (Watch Ads URL)</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                            Earn Hero Card
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Earn স্ক্রিনের শীর্ষভাগের বোনাস ভিডিও/অ্যাড কার্ডের ডিরেক্ট লিংক
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      ৳১.৫০
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Direct Ad URL (Adsterra / Monetag / Sponsor Direct Link)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={config.adsterraUrl1}
                        onChange={(e) => setConfig({ ...config, adsterraUrl1: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleTestLink(config.adsterraUrl1, 'ad_hero')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                          testingLinkId === 'ad_hero'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 active:scale-95'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>টেস্ট</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Tasks List with Edit Fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>সকল আর্নিং টাস্ক ও লিংক তালিকা ({editableTasks.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(!isAddingTask)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingTask ? 'ফর্ম বন্ধ' : '+ নতুন টাস্ক যোগ'}</span>
                    </button>
                  </div>

                  {/* Add New Custom Task Form */}
                  {isAddingTask && (
                    <form
                      onSubmit={handleAddNewTask}
                      className="p-3.5 bg-gradient-to-br from-purple-50/70 to-indigo-50/70 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-purple-600" />
                          <span>নতুন আর্নিং টাস্ক লিংক তৈরি করুন</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingTask(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                            বাংলা শিরোনাম *
                          </label>
                          <input
                            type="text"
                            value={newTaskTitleBn}
                            onChange={(e) => setNewTaskTitleBn(e.target.value)}
                            placeholder="যেমন: টেলিগ্রাম এয়ারড্রপ চ্যানেলে যোগ দিন"
                            className="w-full text-xs py-2 px-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                            English Title
                          </label>
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Join Partner Telegram"
                            className="w-full text-xs py-2 px-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                          টাস্ক লিংক (URL) *
                        </label>
                        <input
                          type="url"
                          value={newTaskLink}
                          onChange={(e) => setNewTaskLink(e.target.value)}
                          placeholder="https://t.me/... বা https://your-website.com"
                          className="w-full text-xs py-2 px-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                            রিওয়ার্ড (টাকা)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={newTaskReward}
                            onChange={(e) => setNewTaskReward(e.target.value)}
                            className="w-full text-xs py-2 px-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                            ভিজিট সময় (সেকেন্ড)
                          </label>
                          <input
                            type="number"
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(e.target.value)}
                            className="w-full text-xs py-2 px-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                            টাস্ক টাইপ
                          </label>
                          <select
                            value={newTaskIconType}
                            onChange={(e) => setNewTaskIconType(e.target.value as any)}
                            className="w-full text-xs py-2 px-2 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          >
                            <option value="telegram">Telegram</option>
                            <option value="youtube">YouTube</option>
                            <option value="facebook">Facebook</option>
                            <option value="web">Web Visit</option>
                            <option value="quiz">Quiz</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>টাস্কটি তালিকায় যুক্ত করুন</span>
                      </button>
                    </form>
                  )}

                  {/* Task Cards */}
                  <div className="space-y-2.5">
                    {editableTasks.map((task) => {
                      const isBuiltinNoLink = !task.link && (task.iconType === 'checkin' || task.iconType === 'quiz');

                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5 transition-all hover:border-purple-200"
                        >
                          {/* Task Header Row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  task.iconType === 'telegram'
                                    ? 'bg-sky-50 text-sky-600 border border-sky-200'
                                    : task.iconType === 'youtube'
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : task.iconType === 'facebook'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : task.iconType === 'web'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : task.iconType === 'quiz'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}
                              >
                                {task.iconType === 'telegram' ? (
                                  <Send className="w-3.5 h-3.5" />
                                ) : task.iconType === 'youtube' ? (
                                  <Play className="w-3.5 h-3.5 fill-rose-600" />
                                ) : task.iconType === 'facebook' ? (
                                  <Globe className="w-3.5 h-3.5" />
                                ) : task.iconType === 'web' ? (
                                  <Globe className="w-3.5 h-3.5" />
                                ) : task.iconType === 'quiz' ? (
                                  <HelpCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Award className="w-3.5 h-3.5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <input
                                  type="text"
                                  value={task.titleBn || task.title}
                                  onChange={(e) => handleUpdateTaskTitleBn(task.id, e.target.value)}
                                  className="w-full text-xs font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white px-1.5 py-0.5 rounded-lg border border-transparent focus:border-purple-300 focus:outline-none transition-all"
                                  title="ক্লিক করে শিরোনাম এডিট করতে পারেন"
                                />
                                <span className="text-[9px] text-slate-400 px-1 font-mono">
                                  #{task.id}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                {task.category === 'visit' ? 'ওয়েব ভিজিট' : 'সোশ্যাল / স্পেশাল'}
                              </span>
                              {task.id.startsWith('task_custom_') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="টাস্ক মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Link Input Row (For tasks that have external URLs) */}
                          {!isBuiltinNoLink ? (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                টাস্ক লিংক (ইউজার এই লিংকে যাবে):
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="url"
                                  value={task.link || ''}
                                  onChange={(e) => handleUpdateTaskLink(task.id, e.target.value)}
                                  placeholder="https://..."
                                  className="flex-1 text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-slate-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTestLink(task.link, task.id)}
                                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                                    testingLinkId === task.id
                                      ? 'bg-purple-600 text-white border-purple-700'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 active:scale-95'
                                  }`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>টেস্ট</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 font-medium">
                              {task.iconType === 'checkin'
                                ? 'ℹ️ দৈনিক চেক-ইন বোনাস: এটি কোনো বাহ্যিক লিংক নয়, অ্যাপের ভেতরেই এক-ক্লিকে ক্লেইম হয়।'
                                : 'ℹ️ ইন্টারঅ্যাক্টিভ কুইজ: অ্যাপের ভেতরে কুইজ প্রশ্ন সমাধান করে বোনাস অর্জন করতে হয়।'}
                            </div>
                          )}

                          {/* Reward & Duration Row */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400">রিওয়ার্ড:</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-emerald-600">৳</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={task.reward}
                                  onChange={(e) =>
                                    handleUpdateTaskReward(task.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-16 text-xs font-bold py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400">অপেক্ষা:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={task.duration ?? 10}
                                  onChange={(e) =>
                                    handleUpdateTaskDuration(task.id, parseInt(e.target.value) || 0)
                                  }
                                  className="w-14 text-xs font-bold py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-slate-500">সেকেন্ড</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SAVE & RESET BUTTONS */}
                <div className="pt-3 pb-2 space-y-2 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pt-3">
                  <button
                    type="button"
                    onClick={() => handleSaveEarnLinks()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-98 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>সব লিংক ও টাস্ক সংরক্ষণ করুন (Save All Links)</span>
                  </button>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleResetDefaultTasks}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ডিফল্ট লিংকগুলোতে ফিরে যান (Reset Default Links)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : adminTab === 'ads' ? (
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

                    {/* Adsterra Link 1 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          <span>Adsterra Direct Link 1:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.adsterraUrl1)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.adsterraUrl1 || ''}
                        onChange={(e) => setConfig({ ...config, adsterraUrl1: e.target.value })}
                        placeholder="https://www.profitablecpmrate.com/..."
                        className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    {/* Adsterra Link 2 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-400" />
                          <span>Adsterra Direct Link 2:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.adsterraUrl2)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.adsterraUrl2 || ''}
                        onChange={(e) => setConfig({ ...config, adsterraUrl2: e.target.value })}
                        placeholder="https://www.profitablecpmrate.com/..."
                        className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Monetag Link 1 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Monetag Direct Link 1:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.monetagUrl1)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.monetagUrl1 || ''}
                        onChange={(e) => setConfig({ ...config, monetagUrl1: e.target.value })}
                        placeholder="https://otieuhoo.net/... বা https://monetag.com/..."
                        className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    {/* Monetag Link 2 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span>Monetag Direct Link 2:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => testLink(config.monetagUrl2)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>টেস্ট লিংক</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        value={config.monetagUrl2 || ''}
                        onChange={(e) => setConfig({ ...config, monetagUrl2: e.target.value })}
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
                          onClick={() => setConfig({ ...config, rotationStrategy: 'cycle_all' })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.rotationStrategy === 'cycle_all'
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>🔄 সাইকেল (সবগুলো)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ৪টি লিংকেই সমান্তরাল ভিজিট যাবে
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
                        placeholder={`বর্তমান পিন: ${config.adminPin || '3048'} (নতুন পিন দিতে পারেন)`}
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        খালি রাখলে আগের পিন ({config.adminPin || '3048'}) বহাল থাকবে।
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
            ) : adminTab === 'videos' ? (
              /* TAB 3: VIDEOS MANAGEMENT */
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                {/* Upload New Video Form */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Play className="w-4 h-4 text-pink-500 fill-pink-500" />
                    নতুন ভিডিও আপলোড করুন
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title (ভিডিওর শিরোনাম * )</label>
                      <input 
                        type="text" 
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        placeholder="e.g. নতুন বাংলা কমেডি ক্লিপ"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Video URL (ভিডিও লিংক * )</label>
                      <input 
                        type="text" 
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=... বা mp4 লিংক"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">ক্যাটাগরি</label>
                        <select
                          value={newVideoCategory}
                          onChange={(e) => setNewVideoCategory(e.target.value as any)}
                          className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        >
                          <option value="movies">Movies & Clips</option>
                          <option value="funny">Funny Shorts</option>
                          <option value="music">Music Videos</option>
                          <option value="gaming">Gaming</option>
                          <option value="news">Trending News</option>
                          <option value="all">All Videos</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">পুরস্কার (৳ BDT)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={newVideoReward}
                          onChange={(e) => setNewVideoReward(e.target.value)}
                          placeholder="3.00"
                          className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">সময় (সেকেন্ড)</label>
                        <input 
                          type="number" 
                          value={newVideoDuration}
                          onChange={(e) => setNewVideoDuration(e.target.value)}
                          placeholder="20"
                          className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        Thumbnail URL (ঐচ্ছিক - খালি রাখলে অটোমেটিক সেট হবে)
                      </label>
                      <input 
                        type="text" 
                        value={newVideoThumb}
                        onChange={(e) => setNewVideoThumb(e.target.value)}
                        placeholder="https://... (ইউটিউব হলে অটো নিবে)"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const trimmedTitle = newVideoTitle.trim();
                        const trimmedUrl = newVideoUrl.trim();
                        if (!trimmedTitle || !trimmedUrl) {
                          onShowToast('❌ ভিডিওর শিরোনাম এবং লিংক পূরণ করুন');
                          return;
                        }

                        // Auto generate thumbnail if not provided
                        let finalThumb = newVideoThumb.trim();
                        if (!finalThumb) {
                          const ytMatch = trimmedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
                          if (ytMatch && ytMatch[1]) {
                            finalThumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
                          } else {
                            finalThumb = 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&q=80&w=400';
                          }
                        }

                        triggerHaptic('medium');
                        if (onAddVideo) {
                          onAddVideo({
                            id: Date.now().toString(),
                            title: trimmedTitle,
                            duration: Number(newVideoDuration) || 20,
                            reward: Number(newVideoReward) || 3.0,
                            thumbnailUrl: finalThumb,
                            videoUrl: trimmedUrl,
                            watched: false,
                            category: newVideoCategory,
                            views: '0',
                            viewCount: 0,
                          });
                          setNewVideoTitle('');
                          setNewVideoDesc('');
                          setNewVideoThumb('');
                          setNewVideoUrl('');
                          onShowToast('✅ নতুন ভিডিও সফলভাবে যুক্ত করা হয়েছে!');

                          // Trigger Telegram Notification for New Video
                          sendTelegramNotification({
                            type: 'video',
                            title: trimmedTitle,
                            reward: Number(newVideoReward) || 3.0,
                            link: trimmedUrl,
                          }).then((res) => {
                            if (res && res.message) {
                              onShowToast(`📢 ${res.message}`);
                            }
                          });
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ভিডিও যুক্ত করুন (Publish Video)</span>
                    </button>
                  </div>
                </div>

                {/* Existing Videos List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">সকল ভিডিও ({videos.length})</h3>
                  {videos.map((vid) => (
                    <div key={vid.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <img src={vid.thumbnailUrl} alt={vid.title} className="w-16 h-12 object-cover rounded-md bg-slate-200" />
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{vid.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{vid.videoUrl}</p>
                      </div>
                      <button 
                        onClick={() => {
                          triggerHaptic('medium');
                          if (onDeleteVideo) onDeleteVideo(vid.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {videos.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      কোনো ভিডিও নেই।
                    </div>
                  )}
                </div>

              </div>
            ) : adminTab === 'announcement' ? (
              /* TAB 5: BROADCAST NOTICE / ANNOUNCEMENT MANAGEMENT */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                      <Megaphone className="w-5 h-5 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">অ্যাডমিন ব্রডকাস্ট নোটিশ পপ-আপ</h3>
                      <p className="text-[11px] text-purple-100 font-medium">
                        এখানে নোটিশ লিখলে অ্যাপ খোলার সাথে সাথে সকল ব্যবহারকারী পপ-আপ ব্যানারে এটি দেখতে পাবে।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>নোটিশ পপ-আপ সক্রিয় করুন (Enable Broadcast)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={adminNotice.enabled}
                      onChange={(e) =>
                        setAdminNotice((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                      ব্যাজ / ট্যাগ (যেমন: মেগা অফার 🔥)
                    </label>
                    <input
                      type="text"
                      value={adminNotice.badge || ''}
                      onChange={(e) =>
                        setAdminNotice((prev) => ({ ...prev, badge: e.target.value }))
                      }
                      placeholder="মেগা অফার 🔥"
                      className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                      নোটিশ শিরোনাম (Title)
                    </label>
                    <input
                      type="text"
                      value={adminNotice.title || ''}
                      onChange={(e) =>
                        setAdminNotice((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="যেমন: আজ রাত ৮টায় মেগা রিওয়ার্ড ইভেন্ট!"
                      className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                      বিস্তারিত বার্তা (Message)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotice.message || ''}
                      onChange={(e) =>
                        setAdminNotice((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="সকল টাস্ক সম্পন্ন করে প্রতিদিন ১০০+ টাকা পর্যন্ত আয় করুন..."
                      className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                        বাটন টেক্সট (Button Text)
                      </label>
                      <input
                        type="text"
                        value={adminNotice.linkText || ''}
                        onChange={(e) =>
                          setAdminNotice((prev) => ({ ...prev, linkText: e.target.value }))
                        }
                        placeholder="বিস্তারিত দেখুন"
                        className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                        অ্যাকশন লিংক URL (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={adminNotice.linkUrl || ''}
                        onChange={(e) =>
                          setAdminNotice((prev) => ({ ...prev, linkUrl: e.target.value }))
                        }
                        placeholder="https://t.me/..."
                        className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      const updated = {
                        ...adminNotice,
                        id: `notice_${Date.now()}`,
                        updatedAt: Date.now(),
                      };
                      setAdminNotice(updated);
                      saveLocalAnnouncement(updated);
                      setNoticeSavedSuccess(true);
                      onShowToast('✅ ব্রডকাস্ট নোটিশ সফলভাবে পাবলিশ করা হয়েছে!');
                      setTimeout(() => setNoticeSavedSuccess(false), 3000);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer mt-2"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>নোটিশ ব্রডকাস্ট করুন (Publish Broadcast Notice)</span>
                  </button>

                  {noticeSavedSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700 animate-in fade-in">
                      ✅ নোটিশ সফলভাবে আপডেট হয়েছে! সব ইউজারের কাছে পপ-আপ দেখাবে।
                    </div>
                  )}
                </div>
              </div>
            ) : adminTab === 'settings' ? (
              /* TAB 6: SYSTEM & FEATURE SETTINGS */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                      <Settings className="w-5 h-5 text-amber-300 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">অ্যাপ সিস্টেম ও পলিসি সেটিংস</h3>
                      <p className="text-[11px] text-cyan-100 font-medium">
                        রেফার বোনাস, পেমেন্ট মেথড, টেলিগ্রাম লিংক এবং গেম রুলস নিয়ন্ত্রণ করুন।
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. Referral Bonus Settings */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>রেফারেল বোনাস ও ভেরিফিকেশন কন্ডিশন</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        প্রতি রেফারে বোনাস (৳ BDT)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={sysSettings.referralReward}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            referralReward: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        ন্যূনতম একটিভ দিন
                      </label>
                      <input
                        type="number"
                        value={sysSettings.referralMinDaysActive}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            referralMinDaysActive: Number(e.target.value) || 1,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        ন্যূনতম সম্পন্ন করা টাস্ক
                      </label>
                      <input
                        type="number"
                        value={sysSettings.referralMinTasks}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            referralMinTasks: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Daily Rewards & Spin Settings */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span>দৈনিক চেক-ইন, স্পিন হুইল ও স্ক্র্যাচ লিমিট</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        চেক-ইন বেস বোনাস (৳)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={sysSettings.dailyCheckInBaseReward}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            dailyCheckInBaseReward: Number(e.target.value) || 1,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        স্পিন কুলডাউন (ঘণ্টা)
                      </label>
                      <select
                        value={sysSettings.spinCooldownHours}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            spinCooldownHours: Number(e.target.value) || 8,
                          }))
                        }
                        className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      >
                        <option value={4}>4 Hours</option>
                        <option value={8}>8 Hours</option>
                        <option value={12}>12 Hours</option>
                        <option value={24}>24 Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        স্পিন জ্যাকপট প্রাইস (৳)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={sysSettings.spinMaxReward}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            spinMaxReward: Number(e.target.value) || 5,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        দৈনিক স্ক্র্যাচ কার্ড লিমিট
                      </label>
                      <input
                        type="number"
                        value={sysSettings.dailyScratchLimit}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            dailyScratchLimit: Number(e.target.value) || 5,
                          }))
                        }
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Telegram Bot & Auto-Notification Settings */}
                <div className="bg-white rounded-2xl p-4 border border-sky-200 shadow-xs space-y-3 bg-gradient-to-br from-sky-50/50 to-white">
                  <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                      <Send className="w-4 h-4 text-sky-600" />
                      <span>🤖 টেলিগ্রাম বট ও অটো-নোটিফিকেশন সেটিং</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
                      Telegram Bot API
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    নতুন ভিডিও বা টাস্ক অ্যাপে যোগ করার সাথে সাথে অফিশিয়াল টেলিগ্রাম চ্যানেলে ও ইউজারের নোটিফিকেশনে মেসেজ চলে যাবে।
                  </p>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        Telegram Bot Token (@BotFather থেকে প্রাপ্ত)
                      </label>
                      <input
                        type="text"
                        value={sysSettings.telegramBotToken || ''}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            telegramBotToken: e.target.value,
                          }))
                        }
                        placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        Telegram Bot Username (রেফারেন্স লিংকের জন্য)
                      </label>
                      <input
                        type="text"
                        value={sysSettings.telegramBotUsername || ''}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            telegramBotUsername: e.target.value,
                          }))
                        }
                        placeholder="SmartEarning_bot"
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-slate-800"
                      />
                    </div>

                    {/* Referral Link Type Selector */}
                    <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/80 space-y-2">
                      <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                        🔗 রেফারেল লিংক টাইপ (ইউজারদের জন্য কোন লিংক তৈরি হবে?)
                      </label>

                      <div className="space-y-1.5">
                        <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="referralLinkFormat"
                            checked={(sysSettings.referralLinkFormat || 'mini_app') === 'web_url'}
                            onChange={() =>
                              setSysSettings((prev) => ({
                                ...prev,
                                referralLinkFormat: 'web_url',
                              }))
                            }
                            className="mt-0.5 accent-amber-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-slate-800 block">🌐 ডাইরেক্ট ওয়েবসাইট লিংক (Direct Web App URL)</span>
                            <span className="text-[10px] text-slate-500">
                              ইউজাররা লিংকে চাপ দিলেই সরাসরি ব্রাউজারে অ্যাপ ওপেন হবে (যেমন: <code className="text-indigo-600">https://ais-pre...run.app?ref=CODE</code>)
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="referralLinkFormat"
                            checked={(sysSettings.referralLinkFormat || 'mini_app') === 'mini_app'}
                            onChange={() =>
                              setSysSettings((prev) => ({
                                ...prev,
                                referralLinkFormat: 'mini_app',
                              }))
                            }
                            className="mt-0.5 accent-amber-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-slate-800 block">⚡ ডাইরেক্ট টেলিগ্রাম মিনি অ্যাপ (1-Click Telegram App)</span>
                            <span className="text-[10px] text-slate-500">
                              চ্যাট ছাড়াও ১-ক্লিকে টেলিগ্রামের ভেতর অ্যাপ ওপেন হবে (যেমন: <code className="text-indigo-600">t.me/SmartEarning_bot/app?startapp=CODE</code>)
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="referralLinkFormat"
                            checked={(sysSettings.referralLinkFormat || 'mini_app') === 'bot_start'}
                            onChange={() =>
                              setSysSettings((prev) => ({
                                ...prev,
                                referralLinkFormat: 'bot_start',
                              }))
                            }
                            className="mt-0.5 accent-amber-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-slate-800 block">🤖 টেলিগ্রাম বট চ্যাট লিংক (Bot Start Chat)</span>
                            <span className="text-[10px] text-slate-500">
                              বটের মূল চ্যাটে নিয়ে যাবে (যেমন: <code className="text-indigo-600">t.me/SmartEarning_bot?start=CODE</code>)
                            </span>
                          </div>
                        </label>
                      </div>

                      {sysSettings.referralLinkFormat === 'web_url' && (
                        <div className="pt-1">
                          <label className="text-[10px] font-bold text-slate-600 mb-0.5 block">
                            কাস্টম ওয়েবসাইট URL (ফাঁকা রাখলে বর্তমান অ্যাপের মূল লিংক ব্যবহার হবে)
                          </label>
                          <input
                            type="text"
                            value={sysSettings.customWebUrl || ''}
                            onChange={(e) =>
                              setSysSettings((prev) => ({
                                ...prev,
                                customWebUrl: e.target.value,
                              }))
                            }
                            placeholder="https://ais-pre-ggdb4cv4g7cfbb3xlhcvwn-374535181190.asia-southeast1.run.app"
                            className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      )}

                      {sysSettings.referralLinkFormat === 'mini_app' && (
                        <div className="pt-1">
                          <label className="text-[10px] font-bold text-slate-600 mb-0.5 block">
                            BotFather এর Mini App Short Name (ডিফল্ট: app)
                          </label>
                          <input
                            type="text"
                            value={sysSettings.miniAppShortName || ''}
                            onChange={(e) =>
                              setSysSettings((prev) => ({
                                ...prev,
                                miniAppShortName: e.target.value,
                              }))
                            }
                            placeholder="app"
                            className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        টেলিগ্রাম চ্যানেল ইউজারনেম/আইডি
                      </label>
                      <input
                        type="text"
                        value={sysSettings.telegramChannelUsername || ''}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            telegramChannelUsername: e.target.value,
                          }))
                        }
                        placeholder="@SmartEarningBdOfficial"
                        className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-sky-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-800">
                          🔥 নতুন টাস্ক নোটিফিকেশন
                        </span>
                        <input
                          type="checkbox"
                          checked={sysSettings.notifyOnNewTask !== false}
                          onChange={(e) =>
                            setSysSettings((prev) => ({
                              ...prev,
                              notifyOnNewTask: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-800">
                          🎬 নতুন ভিডিও নোটিফিকেশন
                        </span>
                        <input
                          type="checkbox"
                          checked={sysSettings.notifyOnNewVideo !== false}
                          onChange={(e) =>
                            setSysSettings((prev) => ({
                              ...prev,
                              notifyOnNewVideo: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic('light');
                          saveSystemSettings(sysSettings);
                          onShowToast('⏳ টেলিগ্রাম টেস্ট নোটিফিকেশন পাঠানো হচ্ছে...');
                          const res = await sendTelegramNotification({
                            type: 'test',
                            title: '🧪 টেস্ট নোটিফিকেশন বার্তা',
                            message: 'স্মার্ট আর্নিং বিডি অ্যাপের টেলিগ্রাম বট নোটিফিকেশন প্রসেস সফলভাবে চালু হয়েছে! 🚀',
                          });
                          if (res && res.message) {
                            onShowToast(`📢 ${res.message}`);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>টেস্ট নোটিফিকেশন পাঠান (Send Test Telegram Alert)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Official Community & Support Links */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                    <Send className="w-4 h-4 text-sky-500" />
                    <span>অফিশিয়াল সোশ্যাল, টেলিগ্রাম ও টিউটোরিয়াল লিংক</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        অফিশিয়াল টেলিগ্রাম চ্যানেল URL
                      </label>
                      <input
                        type="text"
                        value={sysSettings.telegramChannelUrl}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            telegramChannelUrl: e.target.value,
                          }))
                        }
                        placeholder="https://t.me/..."
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        টেলিগ্রাম ইউজার সাপোর্ট গ্রুপ URL
                      </label>
                      <input
                        type="text"
                        value={sysSettings.telegramGroupUrl}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            telegramGroupUrl: e.target.value,
                          }))
                        }
                        placeholder="https://t.me/..."
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        এডমিন সাপোর্ট ইউজারনেম (Telegram Username)
                      </label>
                      <input
                        type="text"
                        value={sysSettings.adminSupportUsername}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            adminSupportUsername: e.target.value,
                          }))
                        }
                        placeholder="@SmartEarningSupport"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        কাজের নিয়ম / ভিডিও গাইড URL
                      </label>
                      <input
                        type="text"
                        value={sysSettings.howToWorkVideoUrl}
                        onChange={(e) =>
                          setSysSettings((prev) => ({
                            ...prev,
                            howToWorkVideoUrl: e.target.value,
                          }))
                        }
                        placeholder="https://www.youtube.com/..."
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Withdrawal Payment Method Gateways */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <span>উইথড্রয়াল পেমেন্ট মেথড সক্রিয়করণ (Payment Gateways)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(['bKash', 'Nagad', 'Rocket', 'Binance', 'Upay', 'CellFin'] as const).map(
                      (method) => (
                        <label
                          key={method}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-xs font-bold text-slate-800">{method}</span>
                          <input
                            type="checkbox"
                            checked={sysSettings.enabledMethods[method] !== false}
                            onChange={(e) =>
                              setSysSettings((prev) => ({
                                ...prev,
                                enabledMethods: {
                                  ...prev.enabledMethods,
                                  [method]: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    saveSystemSettings(sysSettings);
                    setSettingsSavedSuccess(true);
                    onShowToast('✅ অ্যাপ সেটিংস সফলভাবে আপডেট হয়েছে!');
                    setTimeout(() => setSettingsSavedSuccess(false), 3000);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>সেটিংস সেভ করুন (Save System Settings)</span>
                </button>

                {settingsSavedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700 animate-in fade-in">
                    ✅ সকল সিস্টেম ও রেফারেল সেটিংস রিয়েল-টাইমে সেভ হয়েছে!
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
};

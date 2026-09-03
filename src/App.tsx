import React, { useState, useEffect } from 'react';
import { TelegramHeader } from './components/TelegramHeader';
import { BalanceCard } from './components/BalanceCard';
import { QuickActions } from './components/QuickActions';
import { MoviesClipsSection } from './components/MoviesClipsSection';
import { BottomNav, NavTab } from './components/BottomNav';
import { TasksModal } from './components/TasksModal';
import { WithdrawModal } from './components/WithdrawModal';
import { ReferModal } from './components/ReferModal';
import { RankModal } from './components/RankModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BotSetupGuideModal } from './components/BotSetupGuideModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { DailySpinWheel } from './components/DailySpinWheel';
import { InitialSetupModal } from './components/InitialSetupModal';
import { INITIAL_USER, INITIAL_TASKS, INITIAL_VIDEOS, INITIAL_LEADERBOARD } from './data/mockData';
import { UserData, EarnTask, VideoClip, WithdrawalRecord } from './types';
import { initTelegramApp, getTelegramUser, triggerHaptic } from './utils/telegram';
import { getAdConfig } from './utils/adManager';
import {
  AppPreferences,
  getAppPreferences,
  saveAppPreferences,
  hasCompletedInitialSetup,
  markInitialSetupCompleted,
} from './utils/preferences';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<UserData>(() => {
    const adConfig = getAdConfig();
    const saved = localStorage.getItem('smart_earning_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          minWithdraw: adConfig.minWithdraw || parsed.minWithdraw || 50,
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      ...INITIAL_USER,
      minWithdraw: adConfig.minWithdraw || 50,
    };
  });

  const [tasks, setTasks] = useState<EarnTask[]>(() => {
    const saved = localStorage.getItem('smart_earning_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_TASKS;
  });

  const [videos, setVideos] = useState<VideoClip[]>(INITIAL_VIDEOS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    try {
      const stored = localStorage.getItem('smart_earning_withdrawals');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // safe fallback
    }
    return [
      {
        id: 'tx_98124',
        date: '০১/০৯/২০২৬',
        method: 'bKash',
        accountNumber: '01712345678',
        accountType: 'Personal',
        amount: 1000,
        status: 'Approved',
        userName: 'রহিম আহমেদ',
        trxId: 'BKASH782391',
      },
    ];
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [onlineCount, setOnlineCount] = useState<number>(20);

  // Modals
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoClip | null>(null);

  // App preferences (Language & Currency) + Initial Setup Flow
  const [preferences, setPreferences] = useState<AppPreferences>(() => getAppPreferences());
  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState<boolean>(() => !hasCompletedInitialSetup());

  // Reward notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSavePreferences = (newPrefs: AppPreferences) => {
    setPreferences(newPrefs);
    saveAppPreferences(newPrefs);
    markInitialSetupCompleted();
    setIsInitialSetupOpen(false);
    showToast(
      newPrefs.language === 'bn'
        ? '✅ ভাষা ও কারেন্সি আপডেট হয়েছে!'
        : '✅ Language & Currency updated!'
    );
  };

  useEffect(() => {
    initTelegramApp();

    // Check if launched inside Telegram with user info
    const tgUser = getTelegramUser();
    if (tgUser) {
      setUser((prev) => ({
        ...prev,
        name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        username: tgUser.username || prev.username,
        telegramId: tgUser.id,
        avatarUrl: tgUser.photo_url || prev.avatarUrl,
      }));
    }

    // Dynamic online counter fluctuation
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(18, Math.min(32, prev + delta));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Save user data
  useEffect(() => {
    localStorage.setItem('smart_earning_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('smart_earning_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('smart_earning_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const handleClaimVideoReward = (videoId: string, reward: number) => {
    setUser((prev) => ({
      ...prev,
      balance: prev.balance + reward,
      totalEarned: prev.totalEarned + reward,
    }));

    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, watched: true } : v))
    );

    triggerCelebration();
    showToast(`🎉 +৳${reward.toFixed(2)} BDT ব্যালেন্সে যুক্ত হয়েছে!`);
  };

  const handleCompleteTask = (taskId: string, reward: number) => {
    setUser((prev) => ({
      ...prev,
      balance: prev.balance + reward,
      totalEarned: prev.totalEarned + reward,
      dailyCheckedIn: taskId === 'task_checkin' ? true : prev.dailyCheckedIn,
    }));

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );

    triggerCelebration();
    showToast(`✅ টাস্ক সম্পন্ন! +৳${reward.toFixed(2)} BDT যোগ হয়েছে`);
  };

  const handleSpinReward = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      totalEarned: prev.totalEarned + amount,
    }));

    triggerCelebration();
    showToast(`🎡 স্পিন থেকে +৳${amount.toFixed(2)} BDT জিতেছেন!`);
  };

  const handleRequestWithdraw = (record: WithdrawalRecord) => {
    const enrichedRecord: WithdrawalRecord = {
      ...record,
      userName: user.name,
      userPhone: user.phone || record.accountNumber,
      status: 'Pending',
    };

    setUser((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - record.amount),
      totalWithdrawn: prev.totalWithdrawn + record.amount,
    }));

    setWithdrawals((prev) => [enrichedRecord, ...prev]);
    showToast(
      preferences.language === 'bn'
        ? '🔔 উত্তোলনের আবেদন জমা হয়েছে! অ্যাডমিন প্যানেল অনুমোদনের পর টাকা পাঠানো হবে।'
        : '🔔 Withdrawal request submitted! Awaiting admin panel approval.'
    );
  };

  const handleApproveWithdrawal = (id: string, trxId?: string) => {
    setWithdrawals((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Approved',
              trxId: trxId?.trim() || `TRX${Date.now().toString().slice(-6)}`,
              processedAt: new Date().toLocaleDateString(
                preferences.language === 'bn' ? 'bn-BD' : 'en-US'
              ),
            }
          : item
      )
    );
    showToast('✅ উত্তোলন সফলভাবে অনুমোদিত (Approved) হয়েছে!');
  };

  const handleRejectWithdrawal = (id: string, reason?: string) => {
    const target = withdrawals.find((w) => w.id === id);
    if (!target) return;

    // Refund the amount back to the user balance if it was pending
    if (target.status === 'Pending') {
      setUser((prev) => ({
        ...prev,
        balance: prev.balance + target.amount,
        totalWithdrawn: Math.max(0, prev.totalWithdrawn - target.amount),
      }));
    }

    setWithdrawals((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Rejected',
              adminNote: reason?.trim() || 'ভুল একাউন্ট তথ্য বা নিয়ম লঙ্ঘন',
              processedAt: new Date().toLocaleDateString(
                preferences.language === 'bn' ? 'bn-BD' : 'en-US'
              ),
            }
          : item
      )
    );
    showToast('❌ উত্তোলন বাতিল ও ব্যালেন্স রিফান্ড করা হয়েছে!');
  };

  const handleResetData = () => {
    setUser(INITIAL_USER);
    setTasks(INITIAL_TASKS);
    setVideos(INITIAL_VIDEOS);
    showToast('ডাটা সফলভাবে রিসেট করা হয়েছে');
  };

  const handleTabSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      // close extra modals if any
    } else if (tab === 'refer') {
      setIsReferOpen(true);
    } else if (tab === 'earn') {
      setIsTasksOpen(true);
    } else if (tab === 'rank') {
      setIsRankOpen(true);
    } else if (tab === 'profile') {
      setIsProfileOpen(true);
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen relative flex flex-col bg-slate-50 text-slate-900 pb-24 shadow-xl border-x border-slate-200/80">
        
        {/* Telegram Header Bar */}
        <TelegramHeader
          user={user}
          onlineCount={onlineCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          pendingWithdrawalsCount={
            withdrawals.filter((w) => w.status === 'Pending').length
          }
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-full shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 space-y-1">
          {/* 1. Total Balance Card */}
          <BalanceCard
            balance={user.balance}
            minWithdraw={user.minWithdraw}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            preferences={preferences}
          />

          {/* 2. Quick Action Squircles (Tasks, Videos, Refer, Withdraw) */}
          <QuickActions
            onOpenTasks={() => setIsTasksOpen(true)}
            onOpenVideos={() => {
              // Scroll to movies and clips section
              const el = document.getElementById('section-movies-clips');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenRefer={() => setIsReferOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            pendingTasksCount={pendingTasksCount}
            preferences={preferences}
          />

          {/* 3. Daily Spin Wheel (Once every 24 hours with random prize & cooldown) */}
          <DailySpinWheel onWinReward={handleSpinReward} preferences={preferences} />

          {/* 4. Movies & Clips Section */}
          <MoviesClipsSection
            videos={videos}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onWatchVideo={(vid) => setActiveVideo(vid)}
          />
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onSelectTab={handleTabSelect} />

        {/* Interactive Modals */}
        <TasksModal
          isOpen={isTasksOpen}
          onClose={() => {
            setIsTasksOpen(false);
            if (activeTab === 'earn') setActiveTab('home');
          }}
          tasks={tasks}
          onCompleteTask={handleCompleteTask}
          dailyCheckedIn={user.dailyCheckedIn}
        />

        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          balance={user.balance}
          minWithdraw={user.minWithdraw}
          withdrawals={withdrawals}
          onRequestWithdraw={handleRequestWithdraw}
          preferences={preferences}
        />

        <ReferModal
          isOpen={isReferOpen}
          onClose={() => {
            setIsReferOpen(false);
            if (activeTab === 'refer') setActiveTab('home');
          }}
          referralCode={user.referralCode}
          referralsCount={user.referralsCount}
        />

        <RankModal
          isOpen={isRankOpen}
          onClose={() => {
            setIsRankOpen(false);
            if (activeTab === 'rank') setActiveTab('home');
          }}
          ranks={INITIAL_LEADERBOARD}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            if (activeTab === 'profile') setActiveTab('home');
          }}
          user={user}
          onUpdatePhone={(phone) => setUser((prev) => ({ ...prev, phone }))}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onResetData={handleResetData}
          preferences={preferences}
          onUpdatePreferences={handleSavePreferences}
          onOpenInitialSetup={() => setIsInitialSetupOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
        />

        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onUpdateMinWithdraw={(newMin) => {
            setUser((prev) => ({ ...prev, minWithdraw: newMin }));
          }}
          onShowToast={showToast}
          withdrawals={withdrawals}
          onApproveWithdrawal={handleApproveWithdrawal}
          onRejectWithdrawal={handleRejectWithdrawal}
        />

        <BotSetupGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
        />

        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onClaimReward={handleClaimVideoReward}
          preferences={preferences}
        />

        {/* Initial Setup Modal (Language & Currency selection on first launch or via Settings) */}
        <InitialSetupModal
          isOpen={isInitialSetupOpen}
          currentPrefs={preferences}
          onSave={handleSavePreferences}
          isFirstTime={!hasCompletedInitialSetup()}
        />
      </div>
    </div>
  );
}

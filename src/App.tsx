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
import { BotSetupGuideModal } from './components/BotSetupGuideModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { INITIAL_USER, INITIAL_TASKS, INITIAL_VIDEOS, INITIAL_LEADERBOARD } from './data/mockData';
import { UserData, EarnTask, VideoClip, WithdrawalRecord } from './types';
import { initTelegramApp, getTelegramUser, triggerHaptic } from './utils/telegram';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserData>(() => {
    const saved = localStorage.getItem('smart_earning_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER;
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
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([
    {
      id: 'tx_98124',
      date: '০১/০৯/২০২৬',
      method: 'bKash',
      accountNumber: '01712345678',
      accountType: 'Personal',
      amount: 1000,
      status: 'Approved',
    },
  ]);

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoClip | null>(null);

  // Reward notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

    showToast(`✅ টাস্ক সম্পন্ন! +৳${reward.toFixed(2)} BDT যোগ হয়েছে`);
  };

  const handleRequestWithdraw = (record: WithdrawalRecord) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - record.amount),
      totalWithdrawn: prev.totalWithdrawn + record.amount,
    }));

    setWithdrawals((prev) => [record, ...prev]);
    showToast(`🔔 উত্তোলন রিকোয়েস্ট সফল হয়েছে!`);
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
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
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
          />

          {/* 3. Movies & Clips Section */}
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
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onResetData={handleResetData}
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
        />
      </div>
    </div>
  );
}

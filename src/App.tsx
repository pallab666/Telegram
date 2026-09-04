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
import { ScratchCardModal } from './components/ScratchCardModal';
import { InitialSetupModal } from './components/InitialSetupModal';
import { LiveWithdrawalTicker } from './components/LiveWithdrawalTicker';
import { BroadcastAnnouncementModal } from './components/BroadcastAnnouncementModal';
import { INITIAL_USER, INITIAL_TASKS, INITIAL_VIDEOS, INITIAL_LEADERBOARD } from './data/mockData';
import { UserData, EarnTask, VideoClip, WithdrawalRecord, ReferredUser } from './types';
import { initTelegramApp, getTelegramUser, triggerHaptic, registerTelegramUserOnServer } from './utils/telegram';
import { getAdConfig, syncAdConfigFromServer } from './utils/adManager';
import {
  AppPreferences,
  getAppPreferences,
  saveAppPreferences,
  hasCompletedInitialSetup,
  markInitialSetupCompleted,
} from './utils/preferences';
import { initPresenceTracker } from './utils/presence';
import { generateUniqueReferralCode } from './utils/userUtils';
import { Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<UserData>(() => {
    const adConfig = getAdConfig();
    const saved = localStorage.getItem('smart_earning_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean legacy dummy user data ('Md. Tanvir Hossain', 'tanvir_dev', or female unsplash avatar)
        const isDummyTanvir = parsed.name === 'Md. Tanvir Hossain' || parsed.username === 'tanvir_dev' || parsed.id === 'usr_882910';
        const userName = isDummyTanvir ? 'ইউজার' : (parsed.name || 'ইউজার');
        const userUsername = isDummyTanvir ? 'user_member' : (parsed.username || 'user_member');
        const userAvatar = (isDummyTanvir || !parsed.avatarUrl || parsed.avatarUrl.includes('photo-1534528741775-53994a69daeb'))
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
          : parsed.avatarUrl;

        // Clean legacy mock referrals (if default mock was 2)
        const cleanedReferrals =
          parsed.referralsCount === 2 && !parsed.hasRealReferrals
            ? 0
            : parsed.referralsCount ?? 0;

        // Ensure user has their own unique referral code
        const refCode = (parsed.referralCode && parsed.referralCode !== 'SMART8829' && (parsed.referralCode.includes('_') || (parsed.telegramId && parsed.referralCode.includes(String(parsed.telegramId)))))
          ? parsed.referralCode
          : generateUniqueReferralCode({ telegramId: parsed.telegramId, username: userUsername, name: userName });

        return {
          ...parsed,
          name: userName,
          username: userUsername,
          avatarUrl: userAvatar,
          referralCode: refCode,
          referralsCount: cleanedReferrals,
          minWithdraw: adConfig.minWithdraw || parsed.minWithdraw || 1000,
        };
      } catch (e) {
        // fallback
      }
    }
    const defaultRefCode = generateUniqueReferralCode({ name: INITIAL_USER.name });
    return {
      ...INITIAL_USER,
      referralCode: defaultRefCode,
      referralsCount: 0,
      minWithdraw: adConfig.minWithdraw || 1000,
    };
  });

  const [tasks, setTasks] = useState<EarnTask[]>(() => {
    const saved = localStorage.getItem('smart_earning_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove legacy mock tasks
          const cleaned = parsed.filter((t: any) => t && t.id && !t.id.startsWith('mock_task_'));
          if (cleaned.length > 0) {
            return cleaned;
          }
        }
      } catch (e) {}
    }
    return INITIAL_TASKS;
  });

  // Fetch shared tasks from server so all users see admin-updated links
  useEffect(() => {
    const fetchSharedTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
            setTasks((prev) => {
              const completedMap = new Map(prev.map((t) => [t.id, t.completed]));
              const merged = data.tasks.map((t: EarnTask) => ({
                ...t,
                completed: Boolean(completedMap.get(t.id)),
              }));
              try {
                localStorage.setItem('smart_earning_tasks', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch shared tasks', e);
      }
    };
    fetchSharedTasks();
  }, []);

  const [videos, setVideos] = useState<VideoClip[]>(() => {
    try {
      const stored = localStorage.getItem('smart_earning_videos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove legacy dummy videos
          const cleaned = parsed.filter(
            (v: any) => !['vid_1', 'vid_2', 'vid_3', 'vid_4', 'vid_5'].includes(v.id)
          );
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  });

  // Fetch shared videos from server so all users see admin-added videos
  useEffect(() => {
    const fetchSharedVideos = async () => {
      try {
        const res = await fetch(`/api/videos?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.videos)) {
            setVideos((prev) => {
              const watchedMap = new Set(prev.filter((p) => p.watched).map((p) => p.id));
              return data.videos.map((vid: VideoClip) => ({
                ...vid,
                watched: watchedMap.has(vid.id) || Boolean(vid.watched),
              }));
            });
            localStorage.setItem('smart_earning_videos', JSON.stringify(data.videos));
          }
        }
      } catch (e) {
        // Network fallback
      }
    };

    fetchSharedVideos();
    const interval = setInterval(fetchSharedVideos, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_earning_videos', JSON.stringify(videos));
  }, [videos]);
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

  const [referrals, setReferrals] = useState<ReferredUser[]>(() => {
    try {
      const stored = localStorage.getItem('smart_earning_referrals');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(1);

  // Modals
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isScratchOpen, setIsScratchOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoClip | null>(null);
  const [highlightedVideoId, setHighlightedVideoId] = useState<string | null>(null);

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
    syncAdConfigFromServer();

    // Check for referral code in Telegram initData or URL search params
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref') || urlParams.get('startapp') || urlParams.get('start');
      const tgRef = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      const refCode = urlRef || tgRef;

      if (refCode) {
        const cleanCode = refCode.trim().toUpperCase();
        const existingRef = localStorage.getItem('smart_earning_referred_by');
        if (!existingRef) {
          localStorage.setItem('smart_earning_referred_by', cleanCode);
          setTimeout(() => {
            showToast(`🎁 আপনি রেফারেল কোড [${cleanCode}] এর মাধ্যমে যুক্ত হয়েছেন!`);
          }, 1500);
        }
      }
    } catch (e) {
      // ignore
    }

    // Register this user under their inviter's referral code on server
    const inviterRefCode = localStorage.getItem('smart_earning_referred_by');
    if (inviterRefCode) {
      const tgUser = getTelegramUser();
      const userNameToRegister = tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : user.name;
      const userHandleToRegister = tgUser?.username || user.username;

      fetch('/api/referrals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refCode: inviterRefCode,
          userId: user.id,
          name: userNameToRegister,
          username: userHandleToRegister,
          telegramId: user.telegramId || tgUser?.id,
        }),
      }).catch(() => {});
    }

    // Check if launched inside Telegram with user info (with polling for SDK readiness)
    const syncTgUser = () => {
      const tgUser = getTelegramUser();
      if (tgUser && tgUser.id) {
        registerTelegramUserOnServer(tgUser);
        setUser((prev) => {
          // Only update if it's not already synced or if it's a completely new user
          if (prev.telegramId === tgUser.id && prev.name !== 'ইউজার' && prev.name !== 'মেম্বার ইউজার') {
             // Already synced and has a real name, don't overwrite if they edited it manually
             return prev;
          }
          const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'মেম্বার ইউজার';
          const currentHasTelegramId = prev.referralCode && prev.referralCode.includes(String(tgUser.id));
          const newRefCode = (prev.referralCode && prev.referralCode !== 'SMART8829' && currentHasTelegramId)
            ? prev.referralCode
            : generateUniqueReferralCode({ telegramId: tgUser.id, username: tgUser.username, name: fullName });

          const dynamicAvatar = tgUser.photo_url || ((!prev.avatarUrl || prev.avatarUrl.includes('photo-1534528741775-53994a69daeb') || prev.avatarUrl.includes('photo-1535713875002-d1d0cf377fde')) ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}` : prev.avatarUrl);
          const cleanUsername = tgUser.username || (prev.username && prev.username !== 'tanvir_dev' && prev.username !== 'user_member' ? prev.username : `user_${tgUser.id}`);

          return {
            ...prev,
            id: `tg_${tgUser.id}`,
            name: fullName,
            username: cleanUsername,
            telegramId: tgUser.id,
            avatarUrl: dynamicAvatar,
            referralCode: newRefCode,
          };
        });
        return true; // indicates success
      }
      return false;
    };

    let tgInterval: ReturnType<typeof setInterval>;
    if (!syncTgUser()) {
      let attempts = 0;
      tgInterval = setInterval(() => {
        attempts++;
        if (syncTgUser() || attempts > 20) { // Try for 10 seconds (20 * 500ms)
          clearInterval(tgInterval);
        }
      }, 500);
    }

    const tgUser = getTelegramUser();

    // Real-time online users presence tracking
    const cleanupPresence = initPresenceTracker({
      userId: tgUser?.id ? String(tgUser.id) : user.telegramId ? String(user.telegramId) : user.username,
      username: tgUser?.username || user.username,
      name: tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : user.name,
      onCountChange: (count) => {
        setOnlineCount(count);
      },
      onTotalUsersChange: (total) => {
        setTotalUsersCount(total);
      },
    });

    return () => {
      clearInterval(tgInterval);
      cleanupPresence();
    };
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

  // Fetch real server-registered referrals for the active user's referral code
  useEffect(() => {
    if (!user.referralCode) return;

    const fetchRealReferrals = async () => {
      try {
        const res = await fetch(`/api/referrals?refCode=${encodeURIComponent(user.referralCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.referrals)) {
            setReferrals((prevReferrals) => {
              // Find new referrals that we haven't seen locally yet
              const existingIds = new Set(prevReferrals.map((r) => r.id));
              const newReferrals = data.referrals.filter((r: any) => !existingIds.has(r.id));
              
              const newVerifiedCount = newReferrals.filter((r: any) => r.status === 'verified').length;
              if (newVerifiedCount > 0) {
                const bonus = newVerifiedCount * 100;
                setUser((prev) => ({
                  ...prev,
                  balance: Math.round((prev.balance + bonus) * 100) / 100,
                  totalEarned: Math.round((prev.totalEarned + bonus) * 100) / 100,
                  referralsCount: data.referrals.length,
                }));
              } else if (data.referrals.length !== prevReferrals.length) {
                setUser((prev) => ({
                  ...prev,
                  referralsCount: data.referrals.length,
                }));
              }
              return data.referrals;
            });
          }
        }
      } catch (e) {
        // network fallback
      }
    };

    fetchRealReferrals();
    const refInterval = setInterval(fetchRealReferrals, 8000);
    return () => clearInterval(refInterval);
  }, [user.referralCode]);

  useEffect(() => {
    localStorage.setItem('smart_earning_referrals', JSON.stringify(referrals));
  }, [referrals]);

  const handleAddTestReferral = () => {
    const sampleNames = ['তানভীর আহমেদ', 'মেহেদী হাসান', 'সুমাইয়া আক্তার', 'আরিফ হোসেন', 'নাদিম ইসলাম', 'রাকিব খান'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;

    fetch('/api/referrals/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refCode: user.referralCode,
        name: randomName,
        username: randomUsername,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.referrals)) {
          setReferrals(data.referrals);
          setUser((prev) => ({
            ...prev,
            referralsCount: data.referrals.length,
          }));
        }
      })
      .catch(() => {});

    showToast(
      preferences.language === 'bn'
        ? `🎁 টেস্ট রেফারেল যোগ হয়েছে! শর্ত (৩ দিন ও ২০ টাস্ক) পূরণ হলে ৳১০০ মূল ব্যালেন্সে যোগ হবে`
        : `🎁 Test referral joined! ৳100 pending verification.`
    );
  };

  const handleSimulateReferralProgress = (id: string) => {
    let unlocked = false;
    let unlockedName = '';
    setReferrals((prev) =>
      prev.map((ref) => {
        if (ref.id !== id) return ref;
        const newDays = Math.min(3, ref.daysActive + 1);
        const newTasks = Math.min(20, ref.tasksCompleted + 7);
        const willVerify = newDays >= 3 && newTasks >= 20;

        if (willVerify && ref.status === 'pending') {
          unlocked = true;
          unlockedName = ref.name;
          return {
            ...ref,
            daysActive: newDays,
            tasksCompleted: newTasks,
            status: 'verified',
            isTransferredToMain: true,
          };
        }

        return {
          ...ref,
          daysActive: newDays,
          tasksCompleted: newTasks,
        };
      })
    );

    if (unlocked) {
      setUser((prev) => ({
        ...prev,
        balance: Math.round((prev.balance + 100) * 100) / 100,
        totalEarned: Math.round((prev.totalEarned + 100) * 100) / 100,
      }));
      triggerCelebration();
      showToast(
        preferences.language === 'bn'
          ? `🎉 অভিনন্দন! ${unlockedName} ৩ দিন সক্রিয় ও ২০ টাস্ক সম্পন্ন করায় ৳১০০ মূল ব্যালেন্সে যোগ হয়েছে!`
          : `🎉 Congratulations! ৳100 added to main balance for ${unlockedName}!`
      );
    } else {
      showToast(
        preferences.language === 'bn'
          ? `📈 রেফারেল প্রগ্রেস সিমুলেট হয়েছে (+১ দিন, +৭ টাস্ক)`
          : `📈 Referral progress simulated (+1 day, +7 tasks)`
      );
    }
  };

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

  const handleClaimDailyCheckIn = (reward: number, streak: number, timestamp: number) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + reward) * 100) / 100,
      totalEarned: Math.round((prev.totalEarned + reward) * 100) / 100,
      dailyCheckedIn: true,
      lastCheckInTimestamp: timestamp,
      checkInStreak: streak,
    }));

    setTasks((prev) =>
      prev.map((t) => (t.id === 'task_checkin' ? { ...t, completed: true } : t))
    );

    triggerCelebration();
    showToast(
      preferences.language === 'bn'
        ? `🎉 দৈনিক চেক-ইন বোনাস +৳${reward.toFixed(2)} মূল ব্যালেন্সে যোগ হয়েছে!`
        : `🎉 Daily check-in reward +৳${reward.toFixed(2)} credited to balance!`
    );
  };

  const handleSpinReward = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + amount) * 100) / 100,
      totalEarned: Math.round((prev.totalEarned + amount) * 100) / 100,
    }));
    triggerCelebration();
    showToast(
      preferences.language === 'bn'
        ? `🎉 স্পিন উইন! ৳${amount} মূল ব্যালেন্সে যোগ হয়েছে`
        : `🎉 Spin Win! ৳${amount} credited to balance`
    );
  };

  // Automatic 24-hour Daily Check-in Reset Check
  useEffect(() => {
    const checkDailyReset = () => {
      let lastTime = user.lastCheckInTimestamp;
      if (!lastTime) {
        const stored = localStorage.getItem('smart_earning_last_checkin_timestamp');
        if (stored) lastTime = parseInt(stored, 10);
      }
      const COOLDOWN = 24 * 60 * 60 * 1000;
      const isEligible = !lastTime || Date.now() - lastTime >= COOLDOWN;

      if (isEligible && user.dailyCheckedIn) {
        setUser((prev) => ({ ...prev, dailyCheckedIn: false }));
        setTasks((prev) =>
          prev.map((t) => (t.id === 'task_checkin' ? { ...t, completed: false } : t))
        );
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 5000);
    return () => clearInterval(interval);
  }, [user.lastCheckInTimestamp, user.dailyCheckedIn]);

  const scrollToNextUnwatchedVideo = (finishedVideoId: string) => {
    // Find next unwatched video
    const currentIndex = videos.findIndex((v) => v.id === finishedVideoId);
    let nextUnwatched: VideoClip | undefined;

    // Search forward from current index
    for (let i = currentIndex + 1; i < videos.length; i++) {
      if (!videos[i].watched && videos[i].id !== finishedVideoId) {
        nextUnwatched = videos[i];
        break;
      }
    }

    // If not found ahead, search from beginning
    if (!nextUnwatched) {
      for (let i = 0; i < currentIndex; i++) {
        if (!videos[i].watched && videos[i].id !== finishedVideoId) {
          nextUnwatched = videos[i];
          break;
        }
      }
    }

    // Close video player modal and ensure main home page is visible
    setActiveVideo(null);
    setActiveTab('home');
    setIsTasksOpen(false);
    setIsReferOpen(false);
    setIsRankOpen(false);
    setIsProfileOpen(false);

    if (nextUnwatched) {
      const targetVideo = nextUnwatched;
      // If category filter hides this video, reset to 'all' or that category
      if (selectedCategory !== 'all' && selectedCategory !== targetVideo.category) {
        setSelectedCategory('all');
      }

      setHighlightedVideoId(targetVideo.id);

      // Smooth scroll to the next unwatched video card
      setTimeout(() => {
        const el = document.getElementById(`video-card-${targetVideo.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const sec = document.getElementById('section-movies-clips');
          sec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);

      // Clear highlight after 4 seconds
      setTimeout(() => {
        setHighlightedVideoId((prev) => (prev === targetVideo.id ? null : prev));
      }, 4000);
    } else {
      setTimeout(() => {
        const sec = document.getElementById('section-movies-clips');
        sec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const handleClaimVideoReward = (videoId: string, reward: number) => {
    setUser((prev) => ({
      ...prev,
      balance: prev.balance + reward,
      totalEarned: prev.totalEarned + reward,
    }));

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          let currentViews = 0;
          if (typeof v.viewCount === 'number') {
            currentViews = v.viewCount;
          } else if (typeof v.views === 'number') {
            currentViews = v.views;
          } else if (typeof v.views === 'string') {
            const parsed = parseInt(v.views.replace(/[^0-9]/g, ''), 10);
            currentViews = isNaN(parsed) ? 0 : parsed;
          }
          const nextCount = currentViews + 1;
          return {
            ...v,
            watched: true,
            viewCount: nextCount,
            views: nextCount,
          };
        }
        return v;
      })
    );

    // Call server to increment view count persistently
    try {
      fetch(`/api/videos/${videoId}/view`, { method: 'POST' }).catch(() => {});
    } catch (e) {}

    triggerCelebration();
    showToast(
      preferences.language === 'bn'
        ? `🎉 +৳${reward.toFixed(2)} BDT ব্যালেন্সে যুক্ত হয়েছে!`
        : `🎉 +৳${reward.toFixed(2)} BDT added to balance!`
    );

    // Automatically scroll main page to next available unwatched video
    scrollToNextUnwatchedVideo(videoId);
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

  const handleScratchReward = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + amount) * 100) / 100,
      totalEarned: Math.round((prev.totalEarned + amount) * 100) / 100,
    }));

    triggerCelebration();
    showToast(
      preferences.language === 'bn'
        ? `🎁 স্ক্র্যাচ কার্ড থেকে +৳${amount.toFixed(2)} BDT মূল ব্যালেন্সে যোগ হয়েছে!`
        : `🎁 Scratch Card reward +৳${amount.toFixed(2)} BDT added to main balance!`
    );
  };

  const handleClaimMilestoneReward = (taka: number, _videos: number, milestoneFriends: number) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + taka) * 100) / 100,
      totalEarned: Math.round((prev.totalEarned + taka) * 100) / 100,
    }));
    triggerCelebration();
    showToast(
      preferences.language === 'bn'
        ? `🎉 ${milestoneFriends} রেফারেল বোনাস +৳${taka}.00 মূল ব্যালেন্সে যোগ হয়েছে!`
        : `🎉 ${milestoneFriends} referrals reward +৳${taka}.00 added to main balance!`
    );
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
    setVideos([]);
    localStorage.removeItem('smart_earning_videos');
    localStorage.removeItem('smart_earning_tasks');
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: INITIAL_TASKS }),
    }).catch(() => {});
    showToast('ডাটা সফলভাবে রিসেট করা হয়েছে');
  };

  const handleUpdateTasks = async (newTasks: EarnTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem('smart_earning_tasks', JSON.stringify(newTasks));
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks }),
      });
    } catch (err) {
      console.error('Error saving tasks to server:', err);
    }
  };

  const handleAdminAddVideo = async (video: VideoClip) => {
    // Immediate optimistic update
    setVideos((prev) => [video, ...prev.filter((v) => v.id !== video.id)]);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.videos)) {
          setVideos(data.videos);
          localStorage.setItem('smart_earning_videos', JSON.stringify(data.videos));
        }
      }
    } catch (err) {
      console.error('Error saving video to server:', err);
    }
  };

  const handleAdminDeleteVideo = async (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/videos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.videos)) {
          setVideos(data.videos);
          localStorage.setItem('smart_earning_videos', JSON.stringify(data.videos));
        }
      }
    } catch (err) {
      console.error('Error deleting video on server:', err);
    }
  };

  const handleTabSelect = (tab: NavTab) => {
    setActiveTab(tab);
    
    // Reset all tabs to false first
    setIsReferOpen(false);
    setIsTasksOpen(false);
    setIsRankOpen(false);
    setIsProfileOpen(false);
    
    // Open the selected tab's modal if it's not home
    if (tab === 'refer') {
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

  const handleCloseVideoModal = () => {
    const currentId = activeVideo?.id;
    const isWatched = activeVideo ? videos.find((v) => v.id === activeVideo.id)?.watched : false;
    setActiveVideo(null);
    if (currentId && isWatched) {
      scrollToNextUnwatchedVideo(currentId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen relative flex flex-col bg-[#f4f0ff] text-slate-900 pb-24 shadow-xl border-x border-slate-200/80">
        
        {/* Telegram Header Bar */}
        <TelegramHeader
          user={user}
          onlineCount={onlineCount}
          totalUsers={totalUsersCount}
          language={preferences.language}
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
            pendingBonus={referrals.filter((r) => r.status === 'pending').length * 100}
            onOpenRefer={() => {
              setIsReferOpen(true);
              setActiveTab('refer');
            }}
          />

          {/* 2. Quick Action Squircles (Tasks, Videos, Refer, Withdraw) */}
          <QuickActions
            onOpenTasks={() => handleTabSelect('earn')}
            onOpenVideos={() => {
              // Scroll to movies and clips section
              const el = document.getElementById('section-movies-clips');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenRefer={() => handleTabSelect('refer')}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            pendingTasksCount={pendingTasksCount}
            preferences={preferences}
          />

          {/* 3. Lucky Spin Wheel (8 Hours Cooldown + Adsterra Interstitial Ads) */}
          <DailySpinWheel
            onWinReward={handleSpinReward}
            preferences={preferences}
          />

          {/* 4. Interactive Scratch & Win Banner */}
          <div className="px-4 py-2" id="banner-scratch-win">
            <div
              onClick={() => {
                triggerHaptic('medium');
                setIsScratchOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-3.5 text-white shadow-md shadow-amber-500/20 flex items-center justify-between cursor-pointer border border-amber-400/40 hover:brightness-105 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                  <Gift className="w-6 h-6 text-yellow-200 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-white">
                      {preferences.language === 'bn' ? 'লাকি স্ক্র্যাচ কার্ড' : 'Lucky Scratch & Win'}
                    </span>
                    <span className="bg-yellow-300 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs">
                      Daily 3x
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium">
                    {preferences.language === 'bn'
                      ? 'প্রতিদিন কার্ড ঘষে নিশ্চিত নগদ টাকা জিতুন!'
                      : 'Scratch daily & win real cash instantly!'}
                  </p>
                </div>
              </div>

              <div className="bg-white text-slate-900 px-3 py-1.5 rounded-xl font-black text-xs shadow-sm flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{preferences.language === 'bn' ? 'ঘষুন' : 'Scratch'}</span>
              </div>
            </div>
          </div>

          {/* 4. Movies & Clips Section */}
          <MoviesClipsSection
            videos={videos}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onWatchVideo={(vid) => setActiveVideo(vid)}
            highlightedVideoId={highlightedVideoId}
            language={preferences.language}
          />
        </main>

        {/* Tab Views */}
        <TasksModal
          isOpen={isTasksOpen}
          onClose={() => {
            setIsTasksOpen(false);
            if (activeTab === 'earn') setActiveTab('home');
          }}
          onNavigate={(tab) => {
            setIsTasksOpen(false);
            handleTabSelect(tab as NavTab);
          }}
          tasks={tasks}
          onCompleteTask={handleCompleteTask}
          dailyCheckedIn={user.dailyCheckedIn}
          onlineCount={onlineCount}
          userAvatar={user.avatarUrl}
          user={user}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={preferences.language}
          preferences={preferences}
          onClaimDailyCheckIn={handleClaimDailyCheckIn}
          onOpenScratch={() => setIsScratchOpen(true)}
        />

        <ReferModal
          isOpen={isReferOpen}
          onClose={() => {
            setIsReferOpen(false);
            if (activeTab === 'refer') setActiveTab('home');
          }}
          referralCode={user.referralCode}
          referralsCount={user.referralsCount}
          onlineCount={onlineCount}
          userAvatar={user.avatarUrl}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={preferences.language}
          onShowToast={showToast}
          onClaimMilestone={handleClaimMilestoneReward}
          referrals={referrals}
          onAddTestReferral={handleAddTestReferral}
          onSimulateReferralProgress={handleSimulateReferralProgress}
          onNavigate={(tab) => {
            setIsReferOpen(false);
            handleTabSelect(tab as NavTab);
          }}
        />

        <RankModal
          isOpen={isRankOpen}
          onClose={() => {
            setIsRankOpen(false);
            if (activeTab === 'rank') setActiveTab('home');
          }}
          user={user}
          tasks={tasks}
          videos={videos}
          onNavigate={(tab) => {
            setIsRankOpen(false);
            handleTabSelect(tab as NavTab);
          }}
          onlineCount={onlineCount}
          userAvatar={user.avatarUrl}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={preferences.language}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            if (activeTab === 'profile') setActiveTab('home');
          }}
          user={user}
          withdrawals={withdrawals}
          onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
          onUpdatePhone={(phone) => setUser((prev) => ({ ...prev, phone }))}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onlineCount={onlineCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={preferences.language}
        />

        {/* Live Withdrawal Social Proof Ticker / Toast */}
        <LiveWithdrawalTicker
          preferences={preferences}
          realWithdrawals={withdrawals}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
        />

        {/* Fixed Persistent Bottom Navigation Bar across all tabs */}
        <BottomNav activeTab={activeTab} onSelectTab={handleTabSelect} />

        {/* Action & Settings Overlays (Highest z-index) */}
        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          balance={user.balance}
          minWithdraw={user.minWithdraw}
          withdrawals={withdrawals}
          onRequestWithdraw={handleRequestWithdraw}
          preferences={preferences}
          onlineCount={onlineCount}
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
          onOpenAdmin={() => setIsAdminOpen(true)}
          pendingWithdrawalsCount={
            withdrawals.filter((w) => w.status === 'Pending').length
          }
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
          videos={videos}
          onAddVideo={handleAdminAddVideo}
          onDeleteVideo={handleAdminDeleteVideo}
          onlineCount={onlineCount}
          tasks={tasks}
          onUpdateTasks={handleUpdateTasks}
        />

        <BotSetupGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
        />

        <VideoPlayerModal
          video={activeVideo}
          onClose={handleCloseVideoModal}
          onClaimReward={handleClaimVideoReward}
          preferences={preferences}
          onlineCount={onlineCount}
        />

        {/* Initial Setup Modal (Language & Currency selection on first launch or via Settings) */}
        <InitialSetupModal
          isOpen={isInitialSetupOpen}
          currentPrefs={preferences}
          onSave={handleSavePreferences}
          isFirstTime={!hasCompletedInitialSetup()}
        />

        {/* Lucky Scratch & Win Modal (Daily Scratch Cards with Adsterra/Monetag Monetization) */}
        <ScratchCardModal
          isOpen={isScratchOpen}
          onClose={() => setIsScratchOpen(false)}
          onClaimReward={handleScratchReward}
          preferences={preferences}
          onlineCount={onlineCount}
        />

        {/* Global Admin Broadcast Announcement Modal */}
        <BroadcastAnnouncementModal />
      </div>
    </div>
  );
}

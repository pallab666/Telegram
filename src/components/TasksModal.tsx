import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Globe,
  Send,
  ChevronDown,
  MoreVertical,
  Settings,
  Play,
  Briefcase,
  Clock,
  Zap,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Gift,
  Target,
  Trophy,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { EarnTask, UserData, VideoClip, ReferredUser } from "../types";
import { triggerHaptic, openAdLink } from "../utils/telegram";
import { triggerSmartAd, getAdConfig } from "../utils/adManager";
import { AppPreferences } from "../utils/preferences";
import {
  DailyCheckInCard,
  CHECKIN_COOLDOWN_MS,
  CHECKIN_STORAGE_KEY,
} from "./DailyCheckInCard";
import { DailyMissionsSection } from "./DailyMissionsSection";
import {
  DAILY_MISSIONS_LIST,
  DailyMission,
  loadDailyMissionsState,
} from "../utils/dailyMissions";
import confetti from "canvas-confetti";

interface AttentionQuestion {
  id: string;
  promptBn: string;
  promptEn: string;
  targetEmoji: string;
  options: { id: string; labelBn: string; labelEn: string; emoji: string; isCorrect: boolean }[];
}

const HIGH_CPM_ATTENTION_QUESTIONS: AttentionQuestion[] = [
  {
    id: "att_star",
    promptBn: "মানবীয় উপস্থিতি নিশ্চিত করুন: নিচের ছবিতে 'তারা' (⭐) নির্বাচন করুন:",
    promptEn: "Confirm Human Presence: Select the 'Star' (⭐):",
    targetEmoji: "⭐",
    options: [
      { id: "o1", labelBn: "হীরা 💎", labelEn: "Diamond 💎", emoji: "💎", isCorrect: false },
      { id: "o2", labelBn: "তারা ⭐", labelEn: "Star ⭐", emoji: "⭐", isCorrect: true },
      { id: "o3", labelBn: "ঘণ্টা 🔔", labelEn: "Bell 🔔", emoji: "🔔", isCorrect: false },
    ],
  },
  {
    id: "att_gift",
    promptBn: "বিজ্ঞাপন ভেরিফিকেশন: রিওয়ার্ড আনলক করতে 'উপহার বক্স' (🎁) ট্যাপ করুন:",
    promptEn: "Ad Verification: Tap the 'Gift Box' (🎁) to unlock reward:",
    targetEmoji: "🎁",
    options: [
      { id: "o1", labelBn: "উপহার 🎁", labelEn: "Gift 🎁", emoji: "🎁", isCorrect: true },
      { id: "o2", labelBn: "আগুন 🔥", labelEn: "Fire 🔥", emoji: "🔥", isCorrect: false },
      { id: "o3", labelBn: "রকেট 🚀", labelEn: "Rocket 🚀", emoji: "🚀", isCorrect: false },
    ],
  },
  {
    id: "att_check",
    promptBn: "বট রোধ যাচাই: নিচের সঠিক 'টিক চিহ্ন' (✅) বাটনে চাপুন:",
    promptEn: "Anti-bot Check: Tap the correct 'Checkmark' (✅):",
    targetEmoji: "✅",
    options: [
      { id: "o1", labelBn: "ক্রস ❌", labelEn: "Cross ❌", emoji: "❌", isCorrect: false },
      { id: "o2", labelBn: "হৃদয় ❤️", labelEn: "Heart ❤️", emoji: "❤️", isCorrect: false },
      { id: "o3", labelBn: "সঠিক ✅", labelEn: "Check ✅", emoji: "✅", isCorrect: true },
    ],
  },
  {
    id: "att_green",
    promptBn: "হাই CPM কোয়ালিটি চেক: নিচের 'সবুজ' চিহ্ন (🟢) স্পর্শ করুন:",
    promptEn: "High CPM Quality Check: Tap the 'Green' circle (🟢):",
    targetEmoji: "🟢",
    options: [
      { id: "o1", labelBn: "নীল 🔵", labelEn: "Blue 🔵", emoji: "🔵", isCorrect: false },
      { id: "o2", labelBn: "সবুজ 🟢", labelEn: "Green 🟢", emoji: "🟢", isCorrect: true },
      { id: "o3", labelBn: "হলুদ 🟡", labelEn: "Yellow 🟡", emoji: "🟡", isCorrect: false },
    ],
  },
];

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  tasks: EarnTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  dailyCheckedIn: boolean;
  onlineCount?: number;
  userAvatar?: string;
  user?: UserData;
  onOpenSettings?: () => void;
  language?: 'bn' | 'en';
  preferences?: AppPreferences;
  onClaimDailyCheckIn?: (reward: number, streak: number, timestamp: number) => void;
  onOpenScratch?: () => void;
  onClaimDailyMissionReward?: (amount: number, reason: string) => void;
  videos?: VideoClip[];
  referrals?: ReferredUser[];
}

const MAX_DAILY_ADS = 15;
const AD_REWARD_AMOUNT = 1.50;
const AD_COOLDOWN_SECONDS = 20;
const AD_WATCH_DURATION = 30;

interface QuizQuestion {
  id: string;
  questionBn: string;
  questionEn: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: Record<string, QuizQuestion[]> = {
  task_math_quiz: [
    {
      id: "mq_1",
      questionBn: "সহজ হিসাব: ৮ × ৭ = কত?",
      questionEn: "Simple math: 8 × 7 = ?",
      options: ["৫৪", "৫৬", "৪৮", "৬২"],
      correctIndex: 1,
    },
    {
      id: "mq_2",
      questionBn: "হিসাব করুন: ২৫ + ৩৭ = কত?",
      questionEn: "Calculate: 25 + 37 = ?",
      options: ["৫২", "৬০", "৬২", "৬৪"],
      correctIndex: 2,
    },
    {
      id: "mq_3",
      questionBn: "সহজ সমাধান: ৯০ ÷ ৩ = কত?",
      questionEn: "Solve: 90 ÷ 3 = ?",
      options: ["২০", "২৫", "৩০", "৩৫"],
      correctIndex: 2,
    },
  ],
  task_gk_quiz: [
    {
      id: "gk_1",
      questionBn: "বাংলাদেশের জাতীয় খেলা কোনটি?",
      questionEn: "What is the national game of Bangladesh?",
      options: ["ক্রিকেট", "ফুটবল", "হা-ডু-ডু (কাবাডি)", "হকি"],
      correctIndex: 2,
    },
    {
      id: "gk_2",
      questionBn: "বাংলাদেশের জাতীয় কবির নাম কী?",
      questionEn: "Who is the national poet of Bangladesh?",
      options: ["রবীন্দ্রনাথ ঠাকুর", "কাজী নজরুল ইসলাম", "জীবনানন্দ দাশ", "জসীমউদ্দীন"],
      correctIndex: 1,
    },
    {
      id: "gk_3",
      questionBn: "স্মার্ট আর্নিং অ্যাপে প্রতি রেফারে কত বোনাস পাওয়া যায়?",
      questionEn: "How much referral bonus is given in this app?",
      options: ["৳৫", "৳১০", "৳১৫", "৳২০"],
      correctIndex: 2,
    },
  ],
};

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  tasks,
  onCompleteTask,
  dailyCheckedIn,
  onlineCount = 1,
  userAvatar,
  user,
  onOpenSettings,
  language = 'bn',
  preferences,
  onClaimDailyCheckIn,
  onOpenScratch,
  onClaimDailyMissionReward,
  videos,
  referrals,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "missions" | "visit" | "special">("missions");

  // Computed external activity counts for daily missions
  const externalCounts = {
    video: videos ? videos.filter((v) => v.watched).length : 0,
    refer: referrals ? referrals.length : (user?.referralsCount || 0),
    task: tasks ? tasks.filter((t) => t.completed && t.id !== 'task_checkin').length : 0,
    checkin: dailyCheckedIn || user?.dailyCheckedIn ? 1 : 0,
  };

  const handleMissionRewardClaimed = (amount: number, reason: string) => {
    if (onClaimDailyMissionReward) {
      onClaimDailyMissionReward(amount, reason);
    } else {
      onCompleteTask(`mission_${Date.now()}`, amount);
    }
    showInnerToast(
      language === 'bn'
        ? `🎉 ${reason} +৳${amount.toFixed(2)} যোগ হয়েছে!`
        : `🎉 ${reason} +৳${amount.toFixed(2)} credited!`
    );
  };

  const handleMissionNavigate = (category: DailyMission['category']) => {
    if (category === 'refer') {
      if (onNavigate) onNavigate('refer');
    } else if (category === 'video') {
      onClose();
      setTimeout(() => {
        const el = document.getElementById('section-movies-clips');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else if (category === 'task') {
      setActiveTab('all');
    } else if (category === 'spin') {
      onClose();
      setTimeout(() => {
        const el = document.getElementById('section-daily-spin');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 250);
    } else if (category === 'scratch') {
      if (onOpenScratch) onOpenScratch();
    } else if (category === 'checkin') {
      const el = document.getElementById('daily-checkin-card');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Daily ad state management
  const todayKey = `smart_earning_daily_ads_${new Date().toISOString().slice(0, 10)}`;
  const [adsWatchedCount, setAdsWatchedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [adCooldown, setAdCooldown] = useState<number>(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgressTimer, setAdProgressTimer] = useState<number>(AD_WATCH_DURATION);
  const [adWatchDurationTotal, setAdWatchDurationTotal] = useState<number>(AD_WATCH_DURATION);
  const [canClaimAdReward, setCanClaimAdReward] = useState(false);
  const [attentionQuestion, setAttentionQuestion] = useState<AttentionQuestion | null>(null);
  const [attentionCheckPassed, setAttentionCheckPassed] = useState(false);
  const [attentionErrorMsg, setAttentionErrorMsg] = useState<string | null>(null);

  // Task verification countdowns: taskId -> remaining seconds & progress total
  const [verifyingTasks, setVerifyingTasks] = useState<
    Record<string, { remaining: number; total: number; canClaim: boolean }>
  >({});

  // Active Quiz Modal state
  const [activeQuizTask, setActiveQuizTask] = useState<EarnTask | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResultState, setQuizResultState] = useState<"idle" | "correct" | "wrong">("idle");

  // Toast feedback inside modal
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showInnerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Cooldown countdown effect
  useEffect(() => {
    if (adCooldown <= 0) return;
    const interval = setInterval(() => {
      setAdCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [adCooldown]);

  // Active Ad watching timer effect
  useEffect(() => {
    if (!isWatchingAd) return;
    if (adProgressTimer <= 0) {
      const config = getAdConfig();
      if (!config.enableAttentionCheck) {
        setCanClaimAdReward(true);
      }
      return;
    }
    const interval = setInterval(() => {
      setAdProgressTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWatchingAd, adProgressTimer]);

  // Task verification timer countdown
  useEffect(() => {
    const hasActiveVerifications = Object.keys(verifyingTasks).some(
      (id) => !verifyingTasks[id].canClaim && verifyingTasks[id].remaining > 0
    );
    if (!hasActiveVerifications) return;

    const interval = setInterval(() => {
      setVerifyingTasks((prev) => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach((id) => {
          if (!next[id].canClaim && next[id].remaining > 0) {
            const nextRemaining = next[id].remaining - 1;
            next[id] = {
              ...next[id],
              remaining: nextRemaining,
              canClaim: nextRemaining === 0,
            };
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verifyingTasks]);

  if (!isOpen) return null;

  // Handle Watch Ad Click
  const handleStartWatchAd = () => {
    if (adsWatchedCount >= MAX_DAILY_ADS) {
      triggerHaptic("warning");
      showInnerToast(
        language === "bn"
          ? "আজকের বিজ্ঞাপনের কোটা পূর্ণ! আগামীকাল আবার দেখুন।"
          : "Daily ad limit reached! Please return tomorrow."
      );
      return;
    }

    if (adCooldown > 0) {
      triggerHaptic("warning");
      showInnerToast(
        language === "bn"
          ? `অনুগ্রহ করে ${adCooldown} সেকেন্ড অপেক্ষা করুন!`
          : `Please wait ${adCooldown} seconds!`
      );
      return;
    }

    triggerHaptic("medium");

    const adConfig = getAdConfig();
    const duration = Math.max(5, Number(adConfig.adWatchDuration) || 30);

    // Pick a random attention question & shuffle options
    const randomQ =
      HIGH_CPM_ATTENTION_QUESTIONS[
        Math.floor(Math.random() * HIGH_CPM_ATTENTION_QUESTIONS.length)
      ];
    const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
    setAttentionQuestion({ ...randomQ, options: shuffledOptions });
    setAttentionCheckPassed(false);
    setAttentionErrorMsg(null);

    // Open real ad network direct link
    triggerSmartAd("video");

    // Start in-app interactive ad progress modal
    setIsWatchingAd(true);
    setAdWatchDurationTotal(duration);
    setAdProgressTimer(duration);
    setCanClaimAdReward(false);
  };

  // Select Attention Check Option
  const handleSelectAttentionOption = (isCorrect: boolean) => {
    if (isCorrect) {
      triggerHaptic("success");
      setAttentionCheckPassed(true);
      setCanClaimAdReward(true);
      setAttentionErrorMsg(null);
    } else {
      triggerHaptic("error");
      setAttentionErrorMsg(
        language === "bn"
          ? "❌ ভুল হয়েছে! রিওয়ার্ড পেতে নিচের নতুন প্রশ্নটি দেখে সঠিক অপশন বাছাই করুন।"
          : "❌ Incorrect! Please check the new prompt below and select the right option."
      );
      // Pick another random question
      const randomQ =
        HIGH_CPM_ATTENTION_QUESTIONS[
          Math.floor(Math.random() * HIGH_CPM_ATTENTION_QUESTIONS.length)
        ];
      const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
      setAttentionQuestion({ ...randomQ, options: shuffledOptions });
    }
  };

  // Claim Ad reward
  const handleClaimAdReward = () => {
    triggerHaptic("success");
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });

    const newCount = adsWatchedCount + 1;
    setAdsWatchedCount(newCount);
    try {
      localStorage.setItem(todayKey, newCount.toString());
    } catch {}

    onCompleteTask(`watch_ad_${Date.now()}`, AD_REWARD_AMOUNT);

    setIsWatchingAd(false);
    setCanClaimAdReward(false);
    setAttentionCheckPassed(false);
    setAttentionQuestion(null);
    setAttentionErrorMsg(null);
    setAdCooldown(AD_COOLDOWN_SECONDS);

    showInnerToast(
      language === "bn"
        ? `🎉 হাই-সিপিএম বিজ্ঞাপন সম্পন্ন! +৳${AD_REWARD_AMOUNT.toFixed(2)} ব্যালেন্সে যুক্ত হয়েছে!`
        : `🎉 High-CPM Ad completed! +৳${AD_REWARD_AMOUNT.toFixed(2)} added to balance!`
    );
  };

  // Handle Task Action (Visit, Social, Checkin, Quiz)
  const handleTaskAction = (task: EarnTask) => {
    if (task.completed) return;

    // Checkin Task
    if (task.id === "task_checkin" || task.iconType === "checkin") {
      let storedTimestamp = user?.lastCheckInTimestamp;
      if (!storedTimestamp) {
        const stored = localStorage.getItem(CHECKIN_STORAGE_KEY);
        if (stored) storedTimestamp = parseInt(stored, 10);
      }
      const isCooldown = storedTimestamp && Date.now() - storedTimestamp < CHECKIN_COOLDOWN_MS;
      if (isCooldown) {
        showInnerToast(
          language === "bn"
            ? "⏰ আজকের চেক-ইন সম্পন্ন হয়েছে! পরবর্তী ২৪ ঘণ্টা পর আবার ক্লেইম করুন।"
            : "⏰ Daily check-in already claimed! Available every 24 hours."
        );
        return;
      }

      const now = Date.now();
      const currentStreak = user?.checkInStreak || 0;
      let newStreak = 1;
      if (storedTimestamp && now - storedTimestamp <= 48 * 60 * 60 * 1000) {
        newStreak = currentStreak + 1;
      }
      localStorage.setItem(CHECKIN_STORAGE_KEY, now.toString());

      if (onClaimDailyCheckIn) {
        onClaimDailyCheckIn(task.reward, newStreak, now);
      } else {
        onCompleteTask(task.id, task.reward);
      }
      showInnerToast(
        language === "bn"
          ? `🎉 দৈনিক বোনাস +৳${task.reward.toFixed(2)} সংগ্রহ করা হয়েছে!`
          : `🎉 Daily bonus +৳${task.reward.toFixed(2)} claimed!`
      );
      return;
    }

    // Quiz Task
    if (task.iconType === "quiz") {
      triggerHaptic("medium");
      const qList = QUIZ_QUESTIONS[task.id] || QUIZ_QUESTIONS.task_math_quiz;
      const randomQ = qList[Math.floor(Math.random() * qList.length)];
      setCurrentQuestion(randomQ);
      setSelectedOption(null);
      setQuizResultState("idle");
      setActiveQuizTask(task);
      return;
    }

    // Task with link (Telegram, YouTube, Facebook, Sponsor Web)
    const verification = verifyingTasks[task.id];

    // If already verified and ready to claim
    if (verification?.canClaim) {
      triggerHaptic("success");
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
      onCompleteTask(task.id, task.reward);

      // Clean verification state
      setVerifyingTasks((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });

      showInnerToast(
        language === "bn"
          ? `✅ টাস্ক সম্পন্ন! +৳${task.reward.toFixed(2)} পেয়ে গেছেন!`
          : `✅ Task completed! +৳${task.reward.toFixed(2)} credited!`
      );
      return;
    }

    // Otherwise, start task verification
    triggerHaptic("medium");
    if (task.link && task.link.trim()) {
      let rawLink = task.link.trim();
      const isTg =
        rawLink.includes("t.me/") ||
        rawLink.startsWith("@") ||
        rawLink.includes("telegram.me/");

      if (isTg && window.Telegram?.WebApp?.openTelegramLink) {
        const tgFormatted = rawLink.startsWith("@")
          ? `https://t.me/${rawLink.slice(1)}`
          : rawLink.startsWith("http")
          ? rawLink
          : `https://${rawLink}`;
        window.Telegram.WebApp.openTelegramLink(tgFormatted);
      } else if (window.Telegram?.WebApp?.openLink) {
        const webFormatted = rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
        window.Telegram.WebApp.openLink(webFormatted);
      } else {
        const webFormatted = rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
        window.open(webFormatted, "_blank", "noopener,noreferrer");
      }
    }

    const adConfig = getAdConfig();
    const minWebVisit = Number(adConfig.webVisitMinSeconds) || 25;
    const isWebVisit = task.category === 'visit' || task.iconType === 'web';
    const duration = task.duration && task.duration > 0
      ? task.duration
      : isWebVisit
      ? minWebVisit
      : (task.iconType === 'telegram' || task.iconType === 'youtube' ? 30 : 15);

    setVerifyingTasks((prev) => ({
      ...prev,
      [task.id]: {
        remaining: duration,
        total: duration,
        canClaim: false,
      },
    }));

    showInnerToast(
      language === "bn"
        ? isWebVisit
          ? `🌐 স্পন্সর ওয়েবসাইট খোলা হয়েছে। হাই CPM নিশ্চিত করতে ${duration} সেকেন্ড পেজটিতে থাকুন ও স্ক্রল করুন!`
          : `লিংক খোলা হয়েছে। অটো-ভেরিফিকেশন টাইমার শেষ হওয়া পর্যন্ত অপেক্ষা করুন... (${duration} সে.)`
        : `Link opened. Wait for verification countdown (${duration}s)...`
    );
  };

  // Submit Quiz Answer
  const handleAnswerQuiz = (index: number) => {
    if (!currentQuestion || !activeQuizTask) return;
    setSelectedOption(index);

    if (index === currentQuestion.correctIndex) {
      triggerHaptic("success");
      setQuizResultState("correct");
    } else {
      triggerHaptic("error");
      setQuizResultState("wrong");
    }
  };

  // Claim Quiz Reward
  const handleClaimQuizReward = () => {
    if (!activeQuizTask) return;
    triggerHaptic("success");
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });

    onCompleteTask(activeQuizTask.id, activeQuizTask.reward);
    setActiveQuizTask(null);
    setCurrentQuestion(null);

    showInnerToast(
      language === "bn"
        ? `🎉 কুইজ সঠিক হয়েছে! +৳${activeQuizTask.reward.toFixed(2)} যোগ হয়েছে!`
        : `🎉 Quiz correct! +৳${activeQuizTask.reward.toFixed(2)} added!`
    );
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "visit") return task.category === "visit" || task.iconType === "web";
    if (activeTab === "special") return task.category === "special" || task.category === "Social" || task.iconType !== "web";
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  const renderIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
          <Check size={20} strokeWidth={2.5} />
        </div>
      );
    }

    switch (type) {
      case "telegram":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 border border-blue-200">
            <Send size={18} />
          </div>
        );
      case "youtube":
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 border border-red-200">
            <Play size={18} fill="currentColor" />
          </div>
        );
      case "facebook":
        return (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
            <Globe size={18} />
          </div>
        );
      case "checkin":
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
            <Award size={18} />
          </div>
        );
      case "quiz":
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
            <HelpCircle size={18} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 border border-teal-200">
            <Globe size={18} />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-30 flex flex-col bg-[#f5f3ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
    >
      {/* Top Status Bar (Purple) */}
      <div className="bg-[#a855f7] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-sm relative z-20">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-2 font-black text-lg tracking-wide">
          ⚡ {language === "bn" ? "ইনকাম টাস্কসমূহ" : "Earn Tasks"}
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      {/* Profile Bar (Blue) */}
      <div className="bg-gradient-to-b from-[#3b82f6] to-[#60a5fa] px-4 py-3 flex items-center justify-between text-white rounded-b-3xl shrink-0 shadow-md relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 bg-blue-300 shadow-inner">
            <img
              src={userAvatar || user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-black leading-tight text-white line-clamp-1 max-w-[120px]">
              {user?.name || (language === "bn" ? "ব্যবহারকারী" : "User")}
            </p>
            <p className="text-[10px] text-blue-100 font-bold">
              {language === "bn" ? "ব্যালেন্স" : "Balance"}: ৳{(user?.balance || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ade80] shadow-[0_0_8px_#4ade80]"></span>
          </span>
          <span className="text-xs font-black tracking-widest uppercase">
            {onlineCount} {language === 'bn' ? 'অনলাইন' : 'ONLINE'}
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/30 transition-colors shadow-inner cursor-pointer"
        >
          <Settings size={20} className="text-yellow-300" />
        </button>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-28 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="flex-1">{toastNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full pb-28 px-4 pt-4">
        {/* 1. DAILY CHECK-IN REWARD CARD (24h Cooldown + 7-Day Streak) */}
        <DailyCheckInCard
          lastCheckInTimestamp={user?.lastCheckInTimestamp}
          checkInStreak={user?.checkInStreak}
          onClaim={(reward, newStreak, timestamp) => {
            if (onClaimDailyCheckIn) {
              onClaimDailyCheckIn(reward, newStreak, timestamp);
            } else {
              onCompleteTask("task_checkin", reward);
            }
          }}
          preferences={preferences}
        />

        {/* 2. LUCKY SCRATCH & WIN QUICK ENTRY */}
        {onOpenScratch && (
          <div
            onClick={() => {
              triggerHaptic("medium");
              onOpenScratch();
            }}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 mb-4 text-white shadow-md shadow-amber-500/20 flex items-center justify-between cursor-pointer border border-amber-300/40 hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                <Gift className="w-5 h-5 text-yellow-200 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-white">
                    {language === "bn" ? "লাকি স্ক্র্যাচ কার্ড" : "Lucky Scratch & Win"}
                  </span>
                  <span className="bg-yellow-300 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs">
                    3x Daily
                  </span>
                </div>
                <p className="text-[10px] text-amber-100 font-medium">
                  {language === "bn"
                    ? "কার্ড ঘষে তাৎক্ষণিক টাকা জিতুন!"
                    : "Scratch card & win real cash!"}
                </p>
              </div>
            </div>

            <div className="bg-white text-slate-900 px-3 py-1.5 rounded-xl font-black text-xs shadow-sm flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === "bn" ? "ঘষুন" : "Scratch"}</span>
            </div>
          </div>
        )}

        {/* HERO CARD - Watch Ads & Earn */}
        <div className="bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#d946ef] rounded-[2rem] p-5 shadow-xl shadow-purple-500/20 text-center relative overflow-hidden mb-4 border border-purple-400/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Coin Icon Badge */}
            <div className="w-20 h-20 rounded-full border-4 border-yellow-200/50 bg-gradient-to-b from-yellow-100 to-yellow-300 flex items-center justify-center shadow-[0_0_25px_rgba(253,224,71,0.5)] mb-3 relative">
              <div className="w-13 h-13 bg-[#854d0e] rounded-full flex items-center justify-center shadow-inner">
                <span className="text-3xl font-black text-yellow-400">৳</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#4ade80] text-emerald-950 text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-purple-600 shadow-sm">
                BONUS
              </div>
            </div>

            <h2 className="text-[22px] font-black text-white mb-1 drop-shadow-md tracking-tight">
              {language === "bn" ? "বিজ্ঞাপন দেখুন ও আয় করুন" : "Watch Ads & Earn"}
            </h2>
            <p className="text-[11px] font-bold text-purple-100 mb-3.5">
              {language === "bn" ? "প্রতি বিজ্ঞাপনে নগদ টাকা ইনস্ট্যান্ট যোগ হয়" : "Instant cash credited per completed ad"}
            </p>

            {/* Info Box */}
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center border border-white/10 shadow-inner w-full mb-4">
              <div className="flex flex-col text-left">
                <span className="text-purple-200 font-bold text-[10px] uppercase tracking-wider">
                  {language === "bn" ? "প্রতি বিজ্ঞাপনে আয়" : "Per Ad Reward"}
                </span>
                <span className="text-yellow-300 font-black text-base">
                  +৳{AD_REWARD_AMOUNT.toFixed(2)}
                </span>
              </div>

              <div className="h-7 w-[1px] bg-white/20" />

              <div className="flex flex-col text-right">
                <span className="text-purple-200 font-bold text-[10px] uppercase tracking-wider">
                  {language === "bn" ? "আজকের লিমিট" : "Daily Limit"}
                </span>
                <span className="text-white font-black text-base font-mono">
                  {adsWatchedCount} / {MAX_DAILY_ADS}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartWatchAd}
              disabled={adCooldown > 0 || adsWatchedCount >= MAX_DAILY_ADS}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                adsWatchedCount >= MAX_DAILY_ADS
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : adCooldown > 0
                  ? "bg-yellow-200/90 text-yellow-900 border border-yellow-300 cursor-not-allowed font-black"
                  : "bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] shadow-[0_5px_0_#ca8a04] active:shadow-[0_0px_0_#ca8a04] active:translate-y-1 text-purple-950 font-black"
              }`}
            >
              {adsWatchedCount >= MAX_DAILY_ADS ? (
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>{language === "bn" ? "আজকের লিমিট শেষ" : "Daily Limit Reached"}</span>
                </div>
              ) : adCooldown > 0 ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock size={16} className="animate-spin" />
                  <span>
                    {language === "bn"
                      ? `পরবর্তী বিজ্ঞাপন: ${adCooldown} সে.`
                      : `Next ad in: ${adCooldown}s`}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center pl-0.5">
                    <Play className="text-yellow-400" size={13} fill="currentColor" />
                  </div>
                  <span className="text-base tracking-wide uppercase">
                    {language === "bn" ? "বিজ্ঞাপন দেখুন" : "Watch Ad Now"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* DAILY MISSIONS MILESTONE PROGRESS BAR BANNER */}
        {(() => {
          const dailyMissionsState = loadDailyMissionsState();
          const completedDailyMissionsCount = DAILY_MISSIONS_LIST.filter((m) => {
            const current = Math.max(dailyMissionsState.counts[m.category] || 0, externalCounts[m.category] || 0);
            return current >= m.target;
          }).length;
          const totalDailyMissionsCount = DAILY_MISSIONS_LIST.length;
          const milestonesProgressPercent = Math.min(
            100,
            Math.round((completedDailyMissionsCount / totalDailyMissionsCount) * 100)
          );

          return (
            <div
              onClick={() => {
                triggerHaptic("medium");
                setActiveTab("missions");
              }}
              className={`rounded-2xl p-3.5 mb-4 text-white border transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden shadow-sm ${
                activeTab === "missions"
                  ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-amber-400/50 ring-2 ring-amber-400/30"
                  : "bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-indigo-500/30 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-xs text-white">
                        {language === "bn" ? "দৈনিক মিশন ও মাইলস্টোন প্রগ্রেস" : "Daily Missions & Milestones"}
                      </h4>
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                        {completedDailyMissionsCount}/{totalDailyMissionsCount}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-200 font-medium">
                      {language === "bn"
                        ? `আজকের সম্পন্ন: ${completedDailyMissionsCount} / ${totalDailyMissionsCount} (${milestonesProgressPercent}%) • বোনাস আনলক করুন`
                        : `Completed today: ${completedDailyMissionsCount} / ${totalDailyMissionsCount} (${milestonesProgressPercent}%) • Unlock Bonuses`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-amber-300 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15 shrink-0">
                  <span>{activeTab === "missions" ? (language === "bn" ? "সক্রিয়" : "Active") : (language === "bn" ? "মিশন দেখুন" : "View")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Segmented Milestone Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${milestonesProgressPercent}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* FOUR TABS */}
        <div className="flex bg-white rounded-2xl p-1 mb-4 shadow-xs border border-slate-200 gap-1">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("missions");
            }}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "missions"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target size={13} />
            <span>{language === "bn" ? "দৈনিক মিশন" : "Missions"}</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("all");
            }}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {language === "bn" ? "সকল টাস্ক" : "All Tasks"}
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("visit");
            }}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "visit"
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Globe size={13} />
            <span>{language === "bn" ? "ওয়েব ভিজিট" : "Visit"}</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("special");
            }}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "special"
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase size={13} />
            <span>{language === "bn" ? "স্পেশাল" : "Special"}</span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        {activeTab === "missions" ? (
          <DailyMissionsSection
            language={language}
            onRewardClaimed={handleMissionRewardClaimed}
            onNavigateAction={handleMissionNavigate}
            externalCounts={externalCounts}
          />
        ) : (
          <>
            {/* STATS PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-3.5 mb-4 shadow-xs border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Layers size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">
                    {language === "bn" ? "টাস্ক সম্পন্ন প্রগ্রেস" : "Task Completion Progress"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {completedCount} / {tasks.length} {language === "bn" ? "টাস্ক সম্পন্ন" : "tasks completed"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {Math.round((completedCount / (tasks.length || 1)) * 100)}%
                </span>
              </div>
            </div>

            {/* TASKS LIST */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">
                {language === "bn" ? "এই ক্যাটাগরিতে কোনো টাস্ক নেই" : "No tasks in this category"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.completed;
              const verification = verifyingTasks[task.id];
              const isVerifying = verification && !verification.canClaim && verification.remaining > 0;
              const isReadyToClaim = verification && verification.canClaim;
              const totalSec = verification?.total || (task.duration || 30);
              const progressPct = isVerifying
                ? Math.min(100, Math.max(0, Math.round(((totalSec - verification.remaining) / totalSec) * 100)))
                : isReadyToClaim
                ? 100
                : 0;

              return (
                <motion.div
                  key={task.id}
                  layout
                  className={`bg-white rounded-[1.3rem] p-3.5 flex flex-col gap-2 border transition-all relative overflow-hidden ${
                    isDone
                      ? "opacity-60 border-slate-200 bg-slate-50/70"
                      : isReadyToClaim
                      ? "border-emerald-400 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-400/30"
                      : isVerifying
                      ? "border-blue-400 bg-blue-50/20 shadow-md ring-2 ring-blue-400/20"
                      : "border-slate-200 shadow-xs hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderIcon(task.iconType, isDone)}

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-xs line-clamp-1 max-w-[160px]">
                            {language === "bn" ? task.titleBn : task.title}
                          </h4>
                          {!isDone && (
                            <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              +৳{task.reward.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {isDone ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <Check size={12} /> {language === "bn" ? "সম্পন্ন" : "Done"}
                            </span>
                          ) : isVerifying ? (
                            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                              <Clock size={12} className="animate-spin text-blue-500" />
                              {language === "bn"
                                ? `অটো-ভেরিফাই হচ্ছে: ${verification.remaining} সে.`
                                : `Auto-verifying: ${verification.remaining}s`}
                            </span>
                          ) : isReadyToClaim ? (
                            <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 animate-pulse">
                              <Sparkles size={12} />
                              {language === "bn" ? "রিওয়ার্ড প্রস্তুত!" : "Reward Ready!"}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                              {task.iconType === "checkin" ? (
                                <span>{language === "bn" ? "দৈনিক একবার" : "Once daily"}</span>
                              ) : task.iconType === "quiz" ? (
                                <span>{language === "bn" ? "সহজ কুইজ" : "Mini Quiz"}</span>
                              ) : (
                                <>
                                  <Clock size={10} />
                                  <span>
                                    {task.duration
                                      ? `${task.duration}s`
                                      : task.iconType === "telegram" || task.iconType === "youtube"
                                      ? "30s"
                                      : "Instant"}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Task Action Button */}
                    <div>
                      {isDone ? (
                        <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 flex items-center gap-1">
                          <Check size={14} />
                          <span>{language === "bn" ? "সম্পন্ন" : "Done"}</span>
                        </div>
                      ) : isVerifying ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-wait"
                        >
                          <Clock size={12} className="animate-spin" />
                          <span>{verification.remaining}s</span>
                        </button>
                      ) : isReadyToClaim ? (
                        <button
                          onClick={() => handleTaskAction(task)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-sm flex items-center gap-1 active:scale-95 transition-transform cursor-pointer animate-bounce"
                        >
                          <Sparkles size={13} />
                          <span>{language === "bn" ? "দাবি করুন" : "Claim"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTaskAction(task)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer ${
                            task.iconType === "checkin"
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                              : task.iconType === "quiz"
                              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20"
                              : task.iconType === "telegram"
                              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                              : task.iconType === "youtube"
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                          }`}
                        >
                          {task.iconType === "checkin" ? (
                            <>
                              <Award size={13} />
                              <span>{language === "bn" ? "ক্লেম" : "Claim"}</span>
                            </>
                          ) : task.iconType === "quiz" ? (
                            <>
                              <HelpCircle size={13} />
                              <span>{language === "bn" ? "কুইজ" : "Quiz"}</span>
                            </>
                          ) : task.iconType === "telegram" ? (
                            <>
                              <Send size={12} />
                              <span>{language === "bn" ? "যুক্ত হোন (30s)" : "Join (30s)"}</span>
                            </>
                          ) : task.iconType === "youtube" ? (
                            <>
                              <ExternalLink size={12} />
                              <span>{language === "bn" ? "সাবস্ক্রাইব (30s)" : "Subscribe (30s)"}</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={12} />
                              <span>{language === "bn" ? "শুরু করুন" : "Start"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Real-Time Progress Bar for Auto-Verification */}
                  {isVerifying && (
                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>

      {/* AD WATCHING OVERLAY MODAL */}
      <AnimatePresence>
        {isWatchingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 text-white rounded-3xl p-5 w-full max-w-xs border border-purple-500/40 text-center shadow-2xl relative overflow-hidden"
            >
              {/* High CPM Network Header */}
              <div className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-[10px] font-black text-yellow-300 mb-3 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monetag & Adsterra High-CPM</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mx-auto mb-3 relative">
                <Play className="w-7 h-7 text-yellow-300 ml-1" fill="currentColor" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                </span>
              </div>

              <h3 className="text-base font-black mb-1">
                {canClaimAdReward
                  ? language === "bn"
                    ? "বিজ্ঞাপন সম্পন্ন হয়েছে! 🎉"
                    : "Ad Complete! 🎉"
                  : adProgressTimer <= 0 && !canClaimAdReward
                  ? language === "bn"
                    ? "মনোযোগ যাচাই (Verification)"
                    : "Attention Verification"
                  : language === "bn"
                  ? "বিজ্ঞাপন ও স্পন্সর লোড হচ্ছে..."
                  : "Ad & Sponsor Streaming..."}
              </h3>
              <p className="text-[11px] text-purple-200 mb-4">
                {canClaimAdReward
                  ? language === "bn"
                    ? "আপনার সম্পূর্ণ রিওয়ার্ড গ্রহণের জন্য প্রস্তুত।"
                    : "Your full reward is unlocked."
                  : adProgressTimer <= 0 && !canClaimAdReward
                  ? language === "bn"
                    ? "নিচের সঠিক অপশনটি নির্বাচন করে রিওয়ার্ড আনলক করুন"
                    : "Select the correct option below to unlock reward"
                  : language === "bn"
                  ? "হাই CPM বজায় রাখতে পুরো সময় পেজে থাকুন"
                  : "Stay active for maximum CPM rewards"}
              </p>

              {/* Countdown or Attention Check or Claim Button */}
              {adProgressTimer > 0 ? (
                <div className="space-y-3">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-yellow-400 flex items-center justify-center mx-auto animate-spin">
                    <span className="text-2xl font-black text-yellow-300 font-mono -rotate-45">
                      {adProgressTimer}
                    </span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-purple-500/30">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((adWatchDurationTotal - adProgressTimer) / adWatchDurationTotal) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-purple-300 font-bold">
                    {adProgressTimer} {language === "bn" ? `সেকেন্ড বাকি (মোট: ${adWatchDurationTotal}s)` : `seconds remaining of ${adWatchDurationTotal}s`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === "bn" ? "অ্যাড ব্যাকগ্রাউন্ডে চলছে, স্ক্রিন বন্ধ করবেন না।" : "Ad is running, please do not close."}
                  </p>
                </div>
              ) : !canClaimAdReward && attentionQuestion ? (
                /* Attention Check Form */
                <div className="bg-purple-900/40 border border-purple-500/40 rounded-2xl p-3 text-center my-2">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-black text-amber-300 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === "bn" ? "হিউম্যান ভেরিফিকেশন" : "Human Verification"}</span>
                  </div>
                  <p className="text-xs font-bold text-white mb-3">
                    {language === "bn" ? attentionQuestion.promptBn : attentionQuestion.promptEn}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {attentionQuestion.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectAttentionOption(opt.isCorrect)}
                        className="py-2.5 px-1.5 bg-slate-800 hover:bg-purple-800 border border-purple-400/40 rounded-xl text-center active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm"
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-[10px] font-bold text-purple-200">
                          {language === "bn" ? opt.labelBn : opt.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                  {attentionErrorMsg && (
                    <p className="text-[11px] text-rose-300 font-bold mt-2">
                      {attentionErrorMsg}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleClaimAdReward}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:from-emerald-300 hover:to-teal-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40"
                >
                  <Sparkles size={18} className="text-slate-950" />
                  <span>
                    {language === "bn"
                      ? `+৳${AD_REWARD_AMOUNT.toFixed(2)} সংগ্রহ করুন`
                      : `Claim +৳${AD_REWARD_AMOUNT.toFixed(2)}`}
                  </span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUIZ MODAL */}
      <AnimatePresence>
        {activeQuizTask && currentQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 relative"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <HelpCircle size={18} />
                  </div>
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
                    {language === "bn" ? "কুইজ চ্যালেঞ্জ" : "Quiz Challenge"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveQuizTask(null);
                    setCurrentQuestion(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-100 text-center">
                <p className="text-sm font-black text-slate-800">
                  {language === "bn" ? currentQuestion.questionBn : currentQuestion.questionEn}
                </p>
                <span className="text-[10px] font-bold text-purple-600 mt-1 inline-block">
                  {language === "bn"
                    ? `সঠিক উত্তরে পাবেন +৳${activeQuizTask.reward.toFixed(2)}`
                    : `Get +৳${activeQuizTask.reward.toFixed(2)} on correct answer`}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300";
                  if (quizResultState !== "idle" && isSelected) {
                    btnStyle = isCorrect
                      ? "bg-emerald-500 border-emerald-600 text-white"
                      : "bg-red-500 border-red-600 text-white";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizResultState === "correct"}
                      onClick={() => handleAnswerQuiz(idx)}
                      className={`w-full py-2.5 px-4 rounded-xl border text-xs font-black flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {quizResultState !== "idle" && isSelected && (
                        <span>{isCorrect ? "✓" : "✕"}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback State */}
              {quizResultState === "correct" && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{language === "bn" ? "সঠিক উত্তর! অভিনন্দন!" : "Correct Answer! Congratulations!"}</span>
                  </div>
                  <button
                    onClick={handleClaimQuizReward}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    {language === "bn"
                      ? `+৳${activeQuizTask.reward.toFixed(2)} জমা নিন`
                      : `Claim +৳${activeQuizTask.reward.toFixed(2)}`}
                  </button>
                </div>
              )}

              {quizResultState === "wrong" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center text-red-700 text-xs font-bold flex items-center justify-center gap-1.5">
                  <AlertCircle size={16} />
                  <span>
                    {language === "bn" ? "ভুল উত্তর! আবার চেষ্টা করুন।" : "Wrong answer! Try again."}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

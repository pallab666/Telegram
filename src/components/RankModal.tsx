import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trophy,
  Gift,
  Star,
  Users,
  Coins,
  Video,
  ChevronDown,
  MoreVertical,
  Settings,
  Sparkles,
  ArrowRight,
  Medal,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "../utils/telegram";
import { UserData, EarnTask, VideoClip, LeaderboardRank } from "../types";
import confetti from "canvas-confetti";

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineCount?: number;
  user: UserData;
  tasks?: EarnTask[];
  videos?: VideoClip[];
  onNavigate?: (tab: string) => void;
  userAvatar?: string;
  onOpenSettings?: () => void;
  language?: 'bn' | 'en';
}

export const RankModal: React.FC<RankModalProps> = ({
  isOpen,
  onClose,
  onlineCount = 1,
  user,
  tasks = [],
  videos = [],
  onNavigate,
  userAvatar,
  onOpenSettings,
  language = 'bn',
}) => {
  const [activeTimeTab, setActiveTimeTab] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Daily");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"Top Refs" | "Top Earners" | "Top Unlocks">("Top Refs");
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardRank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRankPos, setUserRankPos] = useState<number>(1);
  const [highlightUser, setHighlightUser] = useState(false);
  const [showRankToast, setShowRankToast] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 0, seconds: 0 });

  const userCardRef = useRef<HTMLDivElement>(null);

  // Completed items count for current user
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const watchedVideosCount = videos.filter((v) => v.watched).length;
  const totalUnlocks = completedTasksCount + watchedVideosCount;

  // 1. Live Countdown Timer until next reset (daily/weekly/monthly)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      if (activeTimeTab === "Daily") {
        const midnight = new Date(now);
        midnight.setHours(23, 5, 59, 999);
        const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft({ hours, minutes, seconds });
      } else if (activeTimeTab === "Weekly") {
        const endOfWeek = new Date(now);
        const daysToSunday = 7 - now.getDay();
        endOfWeek.setDate(now.getDate() + daysToSunday);
        endOfWeek.setHours(23, 5, 59, 999);
        const diff = Math.max(0, Math.floor((endOfWeek.getTime() - now.getTime()) / 1000));
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft({ hours, minutes, seconds });
      } else {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const diff = Math.max(0, Math.floor((endOfMonth.getTime() - now.getTime()) / 1000));
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeTimeTab]);

  // 2. Sync user stats and load real leaderboard from server
  useEffect(() => {
    if (!isOpen) return;

    const syncAndFetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // First, sync current user's live data to server
        await fetch("/api/leaderboard/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            name: user.name || "ব্যবহারকারী",
            username: user.username,
            avatarUrl: user.avatarUrl,
            balance: user.balance || 0,
            totalEarned: user.totalEarned || user.balance || 0,
            referralsCount: user.referralsCount || 0,
            tasksCompleted: totalUnlocks,
          }),
        });

        // Determine category param
        let catParam = "refs";
        if (activeCategoryTab === "Top Earners") catParam = "earnings";
        if (activeCategoryTab === "Top Unlocks") catParam = "unlocks";

        // Fetch real ranked list
        const res = await fetch(
          `/api/leaderboard?category=${catParam}&period=${activeTimeTab.toLowerCase()}&userId=${encodeURIComponent(user.id)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.rankings)) {
            // Map to LeaderboardRank format
            const ranks: LeaderboardRank[] = data.rankings.map((item: any, idx: number) => ({
              id: item.id,
              rank: idx + 1,
              name: item.name || "Participant",
              username: item.username,
              avatar: item.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
              earnings: item.balance || 0,
              referrals: item.referralsCount || 0,
              tasksCompleted: item.tasksCompleted || 0,
              isCurrentUser: item.id === user.id,
            }));

            // If user isn't in ranks for some reason, ensure user is included
            const userIndex = ranks.findIndex((r) => r.isCurrentUser || r.id === user.id);
            if (userIndex >= 0) {
              setUserRankPos(ranks[userIndex].rank);
            } else {
              // Add user to front
              const currentUserRank: LeaderboardRank = {
                id: user.id,
                rank: 1,
                name: user.name,
                username: user.username,
                avatar: user.avatarUrl,
                earnings: user.balance,
                referrals: user.referralsCount,
                tasksCompleted: totalUnlocks,
                isCurrentUser: true,
              };
              ranks.unshift(currentUserRank);
              setUserRankPos(1);
            }

            setLeaderboardList(ranks);
          }
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        // Fallback to showing at least the current user with real stats
        const fallbackRank: LeaderboardRank = {
          id: user.id,
          rank: 1,
          name: user.name,
          username: user.username,
          avatar: user.avatarUrl,
          earnings: user.balance,
          referrals: user.referralsCount,
          tasksCompleted: totalUnlocks,
          isCurrentUser: true,
        };
        setLeaderboardList([fallbackRank]);
        setUserRankPos(1);
      } finally {
        setIsLoading(false);
      }
    };

    syncAndFetchLeaderboard();
  }, [isOpen, activeCategoryTab, activeTimeTab, user.id, user.balance, user.referralsCount, totalUnlocks]);

  // Handle "Tap to see your rank"
  const handleTapRank = () => {
    triggerHaptic("medium");
    setHighlightUser(true);
    setShowRankToast(true);

    // Fire celebratory confetti
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.4 },
    });

    if (userCardRef.current) {
      userCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setTimeout(() => {
      setShowRankToast(false);
      setHighlightUser(false);
    }, 4000);
  };

  // Prize pool based on time tab
  const getPrizePool = () => {
    switch (activeTimeTab) {
      case "Weekly":
        return "৳১,৫০০.০০";
      case "Monthly":
        return "৳৫,০০০.০০";
      case "Yearly":
        return "৳২০,০০০.০০";
      case "Daily":
      default:
        return "৳৩০০.০০";
    }
  };

  // Format countdown string
  const formatCountdown = () => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;
  };

  // Get metric value based on active category
  const getMetricDisplay = (item: LeaderboardRank) => {
    if (activeCategoryTab === "Top Earners") {
      return {
        value: `৳${(item.earnings || 0).toFixed(2)}`,
        label: language === "bn" ? "আয়" : "Earned",
      };
    }
    if (activeCategoryTab === "Top Unlocks") {
      return {
        value: `${item.tasksCompleted || 0}`,
        label: language === "bn" ? "আনলক" : "Unlocks",
      };
    }
    return {
      value: `${item.referrals || 0}`,
      label: language === "bn" ? "রেফার" : "Refs",
    };
  };

  // Get category title badge for top positions
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        icon: "👑",
        text: language === "bn" ? "চ্যাম্পিয়ন" : "King",
        style: "bg-gradient-to-r from-[#fde047] to-[#eab308] text-yellow-950 border-yellow-300",
      };
    }
    if (rank === 2) {
      return {
        icon: "🥈",
        text: language === "bn" ? "মাস্টার" : "Master",
        style: "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border-slate-300",
      };
    }
    if (rank === 3) {
      return {
        icon: "🥉",
        text: language === "bn" ? "এলিট" : "Elite",
        style: "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-300",
      };
    }
    return {
      icon: "⚡",
      text: language === "bn" ? "অ্যাক্টিভ" : "Achiever",
      style: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-30 flex flex-col bg-[#f4f0ff] sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden"
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
        <div className="flex items-center gap-2 font-black text-[17px] tracking-wide">
          🎁 Smart Earning 💸
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
              src={userAvatar || user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-black leading-tight text-white line-clamp-1 max-w-[120px]">
              {user.name}
            </p>
            <p className="text-[10px] text-blue-100 font-bold">
              {language === 'bn' ? 'র‍্যাংক' : 'Rank'}: #{userRankPos}
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

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto w-full pb-24 px-4 pt-5">
        {/* HERO CARD - Top Champions */}
        <div className="bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] rounded-[2rem] p-6 shadow-xl shadow-blue-900/20 text-center relative overflow-hidden mb-5">
          {/* Faint Background Trophy */}
          <Trophy
            className="absolute -left-12 top-2 w-56 h-56 text-white/5 rotate-[-15deg] pointer-events-none"
            strokeWidth={1}
            fill="currentColor"
          />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-[28px] font-black text-white mb-0.5 tracking-tight drop-shadow-md">
              {language === 'bn' ? 'টপ চ্যাম্পিয়নস' : 'Top Champions'}
            </h2>
            <p className="text-[10px] font-bold text-blue-200 tracking-widest uppercase mb-5">
              {language === 'bn' ? 'এগিয়ে থাকুন এবং পুরস্কার জিতুন!' : 'Stay Ahead And Earn More!'}
            </p>

            <div className="relative inline-block mb-5">
              <div className="w-[84px] h-[84px] bg-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-[#e2e8f0]/30 backdrop-blur-sm">
                <Gift
                  className="w-10 h-10 text-[#f472b6]"
                  fill="currentColor"
                  strokeWidth={1}
                />
              </div>
              <div className="absolute -top-1 -right-1 w-[26px] h-[26px] bg-[#ef4444] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>

            {/* Interactive "Tap to see your rank!" */}
            <button
              onClick={handleTapRank}
              className="bg-gradient-to-r from-[#ef4444] to-[#f43f5e] text-white font-black text-[12px] tracking-wide px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(225,29,72,0.4)] border border-red-400 mb-6 active:scale-95 transition-transform flex items-center gap-2 uppercase cursor-pointer"
            >
              <span>👆</span>
              <span>
                {language === 'bn' ? `আপনার র‍্যাংক দেখুন (#${userRankPos})` : `Tap to see your rank (#${userRankPos})`}
              </span>
            </button>

            {/* Prize & Live Countdown Box */}
            <div className="bg-[#000000]/25 backdrop-blur-md rounded-[1.25rem] px-5 py-3.5 flex justify-between items-center border border-white/10 w-full shadow-inner">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-6 h-6 text-[#fde047] fill-[#fde047] drop-shadow-sm" />
                <div className="text-left">
                  <span className="text-[10px] text-white/90 font-bold block leading-tight mb-0.5 uppercase tracking-wide">
                    {language === 'bn' ? 'পুরস্কার পুল' : 'Prize Pool'}:
                  </span>
                  <span className="text-[#fde047] font-black text-[16px] block leading-none">
                    {getPrizePool()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-200 font-bold block leading-tight mb-0.5 uppercase tracking-wide">
                  {language === 'bn' ? 'সময় বাকি' : 'Ends In'}:
                </span>
                <span className="text-white font-black text-[15px] block leading-none tracking-wider font-mono">
                  {formatCountdown()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TIME TABS */}
        <div className="flex bg-white rounded-2xl p-1.5 mb-4 shadow-sm border border-slate-100">
          {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                triggerHaptic("light");
                setActiveTimeTab(tab);
              }}
              className={`flex-1 py-2 text-[12px] font-black rounded-xl transition-all cursor-pointer ${
                activeTimeTab === tab
                  ? "bg-[#f472b6] text-black shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "Daily" && (language === "bn" ? "দৈনিক" : "Daily")}
              {tab === "Weekly" && (language === "bn" ? "সাপ্তাহিক" : "Weekly")}
              {tab === "Monthly" && (language === "bn" ? "মাসিক" : "Monthly")}
              {tab === "Yearly" && (language === "bn" ? "সর্বকালীন" : "Yearly")}
            </button>
          ))}
        </div>

        {/* CATEGORY TABS */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Refs");
            }}
            className={`rounded-[1.5rem] p-3 flex flex-col items-center shadow-sm transition-all border cursor-pointer ${
              activeCategoryTab === "Top Refs"
                ? "bg-[#f472b6] border-pink-400 text-black shadow-md scale-[1.02]"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Users
              className="w-6 h-6 mb-1.5"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[11px] font-black">
              {language === 'bn' ? 'শীর্ষ রেফার' : 'Top Refs'}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Earners");
            }}
            className={`rounded-[1.5rem] p-3 flex flex-col items-center shadow-sm transition-all border cursor-pointer ${
              activeCategoryTab === "Top Earners"
                ? "bg-[#f472b6] border-pink-400 text-black shadow-md scale-[1.02]"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Coins
              className="w-6 h-6 mb-1.5"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[11px] font-black">
              {language === 'bn' ? 'শীর্ষ আয়' : 'Top Earners'}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveCategoryTab("Top Unlocks");
            }}
            className={`rounded-[1.5rem] p-3 flex flex-col items-center shadow-sm transition-all border cursor-pointer ${
              activeCategoryTab === "Top Unlocks"
                ? "bg-[#f472b6] border-pink-400 text-black shadow-md scale-[1.02]"
                : "bg-white border-slate-100 text-slate-500"
            }`}
          >
            <Video
              className="w-6 h-6 mb-1.5"
              fill="currentColor"
              strokeWidth={1}
            />
            <span className="text-[11px] font-black">
              {language === 'bn' ? 'টপ আনলক' : 'Top Unlocks'}
            </span>
          </button>
        </div>

        {/* Live User Toast Notification */}
        <AnimatePresence>
          {showRankToast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-between border border-purple-400"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                <div>
                  <p className="text-xs font-black">
                    {language === 'bn' ? `আপনি বর্তমানে #${userRankPos} অবস্থানে আছেন!` : `You are currently ranked #${userRankPos}!`}
                  </p>
                  <p className="text-[10px] text-purple-200">
                    {activeCategoryTab === "Top Refs" && `${user.referralsCount} টি রেফার`}
                    {activeCategoryTab === "Top Earners" && `মোট ব্যালেন্স ৳${user.balance.toFixed(2)}`}
                    {activeCategoryTab === "Top Unlocks" && `${totalUnlocks} টি টাস্ক/ভিডিও সম্পন্ন`}
                  </p>
                </div>
              </div>
              <div className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg">
                #{userRankPos}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WEEKLY REFERRAL TOP 3 BONUS BANNER */}
        {activeCategoryTab === "Top Refs" && (
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-2xl p-4 text-white shadow-lg border border-indigo-400/40 mb-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Trophy size={12} className="fill-slate-950" />
                {language === 'bn' ? 'সাপ্তাহিক রেফারেল বোনাস রেস' : 'Weekly Referral Race'}
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-md border border-amber-400/20">
                {formatCountdown()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center text-amber-300 text-2xl font-black shrink-0 shadow-inner">
                👑
              </div>
              <div>
                <h4 className="font-black text-sm text-white leading-tight">
                  {language === 'bn' ? 'টপ ৩ রেফারার পাবেন মেগা ক্যাশ প্রাইজ!' : 'Top 3 Referrers Win Cash Prizes!'}
                </h4>
                <p className="text-[11px] text-indigo-200 mt-0.5 leading-snug">
                  {language === 'bn'
                    ? '১ম স্থান: ৳৫০০ | ২য় স্থান: ৳৩০০ | ৩য় স্থান: ৳১৫০ (প্রতি রোববার স্বয়ংক্রিয় মূল ব্যালেন্সে যোগ)'
                    : '1st: ৳500 | 2nd: ৳300 | 3rd: ৳150 (Auto credited every Sunday)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REAL LEADERBOARD LIST */}
        <div className="space-y-3">
          {leaderboardList.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] p-8 text-center border border-dashed border-slate-300 shadow-sm">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'লিডারবোর্ড লোড হচ্ছে...' : 'Loading rankings...'}
              </p>
            </div>
          ) : (
            leaderboardList.map((item) => {
              const badge = getRankBadge(item.rank);
              const metric = getMetricDisplay(item);
              const isUser = item.isCurrentUser;

              // Rank 1 Special Styling
              if (item.rank === 1) {
                return (
                  <motion.div
                    key={item.id || item.rank}
                    ref={isUser ? userCardRef : null}
                    layout
                    className={`p-[2px] rounded-[1.5rem] bg-gradient-to-r from-[#2dd4bf] via-[#fef08a] to-[#ec4899] shadow-md relative transition-all ${
                      isUser && highlightUser ? "ring-4 ring-pink-500 ring-offset-2 scale-[1.02]" : ""
                    }`}
                  >
                    <div className="bg-[#fffae6] rounded-[1.4rem] p-3.5 flex items-center justify-between relative overflow-hidden">
                      <div className="flex items-center gap-3 relative z-10">
                        <Trophy className="w-[30px] h-[30px] text-[#eab308] fill-[#eab308] drop-shadow-md ml-1 shrink-0" />
                        <div className="relative">
                          <img
                            src={item.avatar}
                            alt="Avatar"
                            className="w-[50px] h-[50px] rounded-full border-2 border-white shadow-sm object-cover bg-amber-100"
                          />
                          {isUser && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-black px-1 rounded-full border border-white">
                              YOU
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-black text-slate-900 text-[15px] line-clamp-1 max-w-[130px]">
                              {item.name}
                            </span>
                            {isUser && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                {language === 'bn' ? 'আপনি' : 'You'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs border ${badge.style}`}>
                              <span>{badge.icon}</span> {badge.text}
                            </div>
                            {activeCategoryTab === "Top Refs" && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-400 shadow-xs">
                                👑 {language === 'bn' ? 'বোনাস ৳৫০০' : 'Bonus ৳500'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-[1rem] px-4 py-2 shadow-sm flex flex-col items-center justify-center border border-slate-100 relative z-10 min-w-[70px]">
                        <span className="text-[#2563eb] font-black text-[18px] leading-none mb-1">
                          {metric.value}
                        </span>
                        <span className="text-slate-400 text-[9px] font-black tracking-wider leading-none uppercase">
                          {metric.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Rank 2, 3, 4+
              return (
                <motion.div
                  key={item.id || item.rank}
                  ref={isUser ? userCardRef : null}
                  layout
                  className={`bg-white rounded-[1.3rem] p-3.5 flex items-center justify-between border transition-all ${
                    isUser
                      ? "border-purple-300 bg-purple-50/40 shadow-sm"
                      : "border-slate-100 shadow-xs"
                  } ${isUser && highlightUser ? "ring-4 ring-pink-500 ring-offset-2 scale-[1.02]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-slate-700 bg-slate-100 shrink-0">
                      {item.rank === 2 && <span className="text-base">🥈</span>}
                      {item.rank === 3 && <span className="text-base">🥉</span>}
                      {item.rank > 3 && `#${item.rank}`}
                    </div>

                    <div className="relative">
                      <img
                        src={item.avatar}
                        alt="Avatar"
                        className="w-11 h-11 rounded-full border border-slate-200 object-cover bg-slate-50"
                      />
                      {isUser && (
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-black px-1 rounded-full border border-white">
                          YOU
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-800 text-xs line-clamp-1 max-w-[130px]">
                          {item.name}
                        </h4>
                        {isUser && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                            {language === 'bn' ? 'আপনি' : 'You'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${badge.style}`}>
                          <span>{badge.icon}</span> {badge.text}
                        </div>
                        {activeCategoryTab === "Top Refs" && item.rank === 2 && (
                          <span className="text-[9px] font-black text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded-full border border-slate-300">
                            🥈 {language === 'bn' ? 'বোনাস ৳৩০০' : 'Bonus ৳300'}
                          </span>
                        )}
                        {activeCategoryTab === "Top Refs" && item.rank === 3 && (
                          <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
                            🥉 {language === 'bn' ? 'বোনাস ৳১৫০' : 'Bonus ৳150'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl px-3 py-1.5 flex flex-col items-center min-w-[65px] border border-slate-100">
                    <span className="text-slate-800 font-black text-sm leading-tight">
                      {metric.value}
                    </span>
                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">
                      {metric.label}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Motivational Call-to-Action Card */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md mt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Medal className="w-5 h-5 text-yellow-300" />
              <h4 className="font-black text-sm">
                {language === 'bn' ? 'শীর্ষ র‍্যাংক ধরে রাখুন!' : 'Climb the Leaderboard!'}
              </h4>
            </div>
            <p className="text-xs text-purple-100 mb-3 leading-relaxed">
              {language === 'bn'
                ? 'বন্ধুদের রেফার করে প্রতি রেফারে ৳১৫ বোনাস নিন এবং লিডারবোর্ডের শীর্ষ অবস্থান নিশ্চিত করে নগদ পুরস্কার জিতুন।'
                : 'Invite friends to earn bonuses and secure your top spot on the leaderboard for real prizes.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onClose();
                  onNavigate?.('refer');
                }}
                className="flex-1 py-2 px-3 bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'রেফার করুন' : 'Invite Friends'}</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onClose();
                  onNavigate?.('earn');
                }}
                className="flex-1 py-2 px-3 bg-purple-700/60 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-purple-400/40 active:scale-95 transition-transform cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-yellow-300" />
                <span>{language === 'bn' ? 'টাস্ক করুন' : 'Earn More'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

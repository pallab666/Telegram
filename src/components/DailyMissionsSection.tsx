import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Trophy,
  Sparkles,
  CheckCircle2,
  Clock,
  Users,
  Video,
  Zap,
  Disc,
  Gift,
  Calendar,
  ChevronRight,
  ArrowRight,
  Coins,
  Award,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/telegram';
import {
  DAILY_MISSIONS_LIST,
  DAILY_MILESTONES,
  DailyMission,
  DailyMissionState,
  loadDailyMissionsState,
  saveDailyMissionsState,
  claimDailyMission,
  claimDailyMilestoneTier,
  recordDailyMissionAction,
} from '../utils/dailyMissions';
import { formatMoney } from '../utils/preferences';

interface DailyMissionsSectionProps {
  onRewardClaimed: (amount: number, reason: string) => void;
  onNavigateAction?: (category: DailyMission['category']) => void;
  language?: 'bn' | 'en';
  externalCounts?: Partial<DailyMissionState['counts']>;
}

export const DailyMissionsSection: React.FC<DailyMissionsSectionProps> = ({
  onRewardClaimed,
  onNavigateAction,
  language = 'bn',
  externalCounts,
}) => {
  const isBn = language !== 'en';
  const [missionState, setMissionState] = useState<DailyMissionState>(() => loadDailyMissionsState());
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>('');

  // Sync external counts (like videos watched, tasks done, etc.) if provided
  useEffect(() => {
    if (!externalCounts) return;
    setMissionState((prev) => {
      let changed = false;
      const nextCounts = { ...prev.counts };
      (Object.keys(externalCounts) as Array<keyof DailyMissionState['counts']>).forEach((key) => {
        const extVal = externalCounts[key];
        if (typeof extVal === 'number' && extVal > (nextCounts[key] || 0)) {
          nextCounts[key] = extVal;
          changed = true;
        }
      });
      if (changed) {
        const updated = { ...prev, counts: nextCounts };
        saveDailyMissionsState(updated);
        return updated;
      }
      return prev;
    });
  }, [externalCounts]);

  // Live countdown to midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        // New day reset
        setMissionState(loadDailyMissionsState());
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeUntilMidnight(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute completed missions count
  const completedMissionsCount = DAILY_MISSIONS_LIST.filter((mission) => {
    const count = missionState.counts[mission.category] || 0;
    return count >= mission.target;
  }).length;

  const totalMissionsCount = DAILY_MISSIONS_LIST.length;
  const progressPercent = Math.min(100, Math.round((completedMissionsCount / totalMissionsCount) * 100));

  // Handler for claiming mission reward
  const handleClaimMission = (mission: DailyMission) => {
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const result = claimDailyMission(mission.id);
    if (result.success) {
      setMissionState(result.state);
      const reason = isBn
        ? `দৈনিক মিশন '${mission.titleBn}' সম্পন্ন`
        : `Daily mission '${mission.titleEn}' completed`;
      onRewardClaimed(result.reward, reason);
    }
  };

  // Handler for claiming milestone tier reward
  const handleClaimMilestone = (tier: number) => {
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (e) {}

    const milestone = DAILY_MILESTONES.find((m) => m.tier === tier);
    const result = claimDailyMilestoneTier(tier);
    if (result.success && milestone) {
      setMissionState(result.state);
      const reason = isBn
        ? `দৈনিক মাইলস্টোন '${milestone.titleBn}' বোনাস`
        : `Daily milestone '${milestone.titleEn}' bonus`;
      onRewardClaimed(result.reward, reason);
    }
  };

  // Fast test button for instant demo verification
  const handleSimulateOneAction = (category: DailyMission['category'], e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = recordDailyMissionAction(category, 1);
    setMissionState(updated);
  };

  const renderMissionIcon = (iconName: DailyMission['icon']) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-5 h-5 text-indigo-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'disc':
        return <Disc className="w-5 h-5 text-purple-500" />;
      case 'gift':
        return <Gift className="w-5 h-5 text-orange-500" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      default:
        return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 mb-5" id="section-daily-missions">
      {/* 1. MASTER DAILY MILESTONE PROGRESS BAR CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md border border-white/20">
                <Target className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                  <span>{isBn ? 'দৈনিক মিশন ও মাইলস্টোন' : 'Daily Missions & Milestones'}</span>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                    {isBn ? 'আজকের' : 'Daily'}
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-200 font-medium">
                  {isBn
                    ? 'প্রতিটি অ্যাকশন সম্পন্ন করে অতিরিক্ত ক্যাশ ও মাইলস্টোন জিতুন'
                    : 'Complete daily tasks to unlock extra cash & jackpot milestones'}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            {timeUntilMidnight && (
              <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 flex items-center gap-1 text-[10px] text-indigo-200 font-bold shrink-0">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{timeUntilMidnight}</span>
              </div>
            )}
          </div>

          {/* Progress Summary */}
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isBn
                  ? `সম্পন্ন মিশন: ${completedMissionsCount} / ${totalMissionsCount}`
                  : `Missions Done: ${completedMissionsCount} / ${totalMissionsCount}`}
              </span>
            </span>
            <span className="text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              {progressPercent}% {isBn ? 'সম্পন্ন' : 'Completed'}
            </span>
          </div>

          {/* Visual Milestone Progress Bar */}
          <div className="relative w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 mb-4 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>

          {/* Milestone Checkpoint Cards (Tier 1, Tier 2, Tier 3) */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-500/20">
            {DAILY_MILESTONES.map((milestone) => {
              const isUnlocked = completedMissionsCount >= milestone.requiredMissions;
              const isClaimed = Boolean(missionState.claimedMilestones[milestone.tier]);
              const canClaim = isUnlocked && !isClaimed;

              return (
                <div
                  key={milestone.tier}
                  className={`p-2 rounded-2xl border transition-all text-center relative flex flex-col justify-between ${
                    isClaimed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : canClaim
                      ? 'bg-amber-950/50 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-md animate-pulse'
                      : isUnlocked
                      ? 'bg-indigo-900/40 border-indigo-400/30 text-slate-200'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 opacity-80'
                  }`}
                >
                  <div className="mb-1">
                    <div className="text-base mb-0.5">{milestone.badge}</div>
                    <p className="text-[10px] font-black leading-tight truncate">
                      {isBn ? milestone.titleBn : milestone.titleEn}
                    </p>
                    <p className="text-[9px] text-amber-300 font-extrabold mt-0.5">
                      +{formatMoney(milestone.reward, 'BDT')}
                    </p>
                    <p className="text-[8px] text-slate-400 font-medium">
                      {milestone.requiredMissions} {isBn ? 'টি মিশন' : 'missions'}
                    </p>
                  </div>

                  {isClaimed ? (
                    <div className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black py-1 px-1.5 rounded-lg flex items-center justify-center gap-0.5 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{isBn ? 'সংগৃহীত' : 'Claimed'}</span>
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaimMilestone(milestone.tier)}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[9px] font-black py-1 px-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      {isBn ? 'ক্লেম করুন' : 'Claim'}
                    </button>
                  ) : (
                    <div className="bg-slate-800/70 text-slate-400 text-[9px] font-bold py-1 px-1.5 rounded-lg border border-slate-700/50">
                      {completedMissionsCount}/{milestone.requiredMissions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. DAILY MISSIONS LIST */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-slate-700">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{isBn ? 'দৈনিক নির্দিষ্ট মিশনসমূহ' : 'Daily Specific Missions'}</span>
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            {DAILY_MISSIONS_LIST.filter((m) => missionState.claimedMissions[m.id]).length} /{' '}
            {DAILY_MISSIONS_LIST.length} {isBn ? 'ক্লেম করা হয়েছে' : 'claimed'}
          </span>
        </div>

        {DAILY_MISSIONS_LIST.map((mission) => {
          const currentCount = missionState.counts[mission.category] || 0;
          const isTargetMet = currentCount >= mission.target;
          const isClaimed = Boolean(missionState.claimedMissions[mission.id]);
          const canClaim = isTargetMet && !isClaimed;
          const itemProgressPercent = Math.min(100, Math.round((currentCount / mission.target) * 100));

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                isClaimed
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : canClaim
                  ? 'border-amber-300 ring-2 ring-amber-400/30 bg-amber-50/30'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                      isClaimed
                        ? 'bg-emerald-100 border-emerald-200'
                        : canClaim
                        ? 'bg-amber-100 border-amber-200'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {isClaimed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      renderMissionIcon(mission.icon)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-xs text-slate-900 leading-snug">
                        {isBn ? mission.titleBn : mission.titleEn}
                      </h4>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                        +{formatMoney(mission.reward, 'BDT')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-1 mt-0.5">
                      {isBn ? mission.descriptionBn : mission.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Right: Simulation Pill for Testing */}
                {!isTargetMet && (
                  <button
                    onClick={(e) => handleSimulateOneAction(mission.category, e)}
                    title={isBn ? 'টেস্ট প্রগ্রেস বৃদ্ধি' : 'Simulate +1 progress'}
                    className="shrink-0 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{isBn ? '+১ টেস্ট' : '+1 Test'}</span>
                  </button>
                )}
              </div>

              {/* Progress Bar & Status Action Button */}
              <div className="space-y-2 pt-1">
                {/* Progress Stats */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-bold">
                    {isBn ? 'অগ্রগতি' : 'Progress'}:{' '}
                    <strong className="text-slate-900 font-black">
                      {Math.min(currentCount, mission.target)} / {mission.target}
                    </strong>{' '}
                    {isBn ? mission.unitBn : mission.unitEn}
                  </span>
                  <span
                    className={`font-black ${
                      isClaimed
                        ? 'text-emerald-600'
                        : canClaim
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {itemProgressPercent}%
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${itemProgressPercent}%` }}
                    transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${
                      isClaimed
                        ? 'bg-emerald-500'
                        : canClaim
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                </div>

                {/* Action / Claim Button */}
                <div className="pt-1 flex items-center justify-end">
                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 text-[11px] font-black px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'পুরস্কার সংগৃহীত ✅' : 'Reward Claimed ✅'}</span>
                    </span>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaimMission(mission)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer animate-bounce"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isBn
                          ? `ক্লেম করুন +${formatMoney(mission.reward, 'BDT')}`
                          : `Claim +${formatMoney(mission.reward, 'BDT')}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        if (onNavigateAction) {
                          onNavigateAction(mission.category);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 text-xs font-black px-3.5 py-1.5 rounded-xl border border-indigo-200 transition-all cursor-pointer active:scale-95"
                    >
                      <span>
                        {mission.category === 'refer'
                          ? isBn
                            ? 'রেফার করুন'
                            : 'Invite Friends'
                          : mission.category === 'video'
                          ? isBn
                            ? 'ভিডিও দেখুন'
                            : 'Watch Videos'
                          : mission.category === 'task'
                          ? isBn
                            ? 'টাস্ক করুন'
                            : 'Do Tasks'
                          : mission.category === 'spin'
                          ? isBn
                            ? 'হুইল স্পিন'
                            : 'Spin Wheel'
                          : mission.category === 'scratch'
                          ? isBn
                            ? 'কার্ড ঘষুন'
                            : 'Scratch Card'
                          : isBn
                          ? 'চেক-ইন করুন'
                          : 'Check In'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

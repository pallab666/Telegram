export interface DailyMission {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  category: 'refer' | 'video' | 'task' | 'spin' | 'scratch' | 'checkin';
  target: number;
  unitBn: string;
  unitEn: string;
  reward: number; // Reward in BDT
  icon: 'users' | 'video' | 'zap' | 'disc' | 'gift' | 'calendar';
}

export interface DailyMilestoneTier {
  tier: number;
  requiredMissions: number;
  reward: number;
  titleBn: string;
  titleEn: string;
  badge: string;
}

export interface DailyMissionState {
  date: string; // YYYY-MM-DD
  counts: {
    refer: number;
    video: number;
    task: number;
    spin: number;
    scratch: number;
    checkin: number;
  };
  claimedMissions: Record<string, boolean>; // missionId -> claimed
  claimedMilestones: Record<number, boolean>; // tier -> claimed
}

export const DAILY_MISSIONS_LIST: DailyMission[] = [
  {
    id: 'mission_refer_3',
    titleBn: '৩ জন ব্যবহারকারীকে রেফার করুন',
    titleEn: 'Refer 3 Users',
    descriptionBn: 'আপনার রেফার কোড দিয়ে আজ ৩ জন নতুন বন্ধুকে জয়েন করান',
    descriptionEn: 'Invite 3 new friends using your referral link today',
    category: 'refer',
    target: 3,
    unitBn: 'জন',
    unitEn: 'users',
    reward: 30.0,
    icon: 'users',
  },
  {
    id: 'mission_watch_5_videos',
    titleBn: '৫টি ভিডিও ক্লিপ দেখুন',
    titleEn: 'Watch 5 Videos',
    descriptionBn: 'মুভি ক্লিপ ও শর্টস সেকশন থেকে যেকোনো ৫টি ভিডিও উপভোগ করুন',
    descriptionEn: 'Watch any 5 short video clips from Movies & Clips section',
    category: 'video',
    target: 5,
    unitBn: 'টি',
    unitEn: 'videos',
    reward: 15.0,
    icon: 'video',
  },
  {
    id: 'mission_complete_4_tasks',
    titleBn: '৪টি মাইক্রো টাস্ক সম্পন্ন করুন',
    titleEn: 'Complete 4 Tasks',
    descriptionBn: 'ওয়েব ভিজিট, চ্যানেল সাবস্ক্রাইব বা কুইজ টাস্ক সম্পন্ন করুন',
    descriptionEn: 'Complete web visit jobs, social follows, or quiz tasks',
    category: 'task',
    target: 4,
    unitBn: 'টি',
    unitEn: 'tasks',
    reward: 20.0,
    icon: 'zap',
  },
  {
    id: 'mission_spin_wheel_2',
    titleBn: '২ বার লাকি হুইল ঘোরান',
    titleEn: 'Spin Lucky Wheel 2 Times',
    descriptionBn: 'দৈনিক স্পিন হুইল ঘুরিয়ে রিওয়ার্ড সংগ্রহ করুন',
    descriptionEn: 'Spin the Lucky Wheel 2 times to collect instant cash',
    category: 'spin',
    target: 2,
    unitBn: 'বার',
    unitEn: 'spins',
    reward: 10.0,
    icon: 'disc',
  },
  {
    id: 'mission_scratch_2_cards',
    titleBn: '২টি লাকি কার্ড ঘষুন',
    titleEn: 'Scratch 2 Lucky Cards',
    descriptionBn: 'স্ক্র্যাচ কার্ড সেকশন থেকে যেকোনো ২টি কার্ড ঘষে ক্যাশ জিতুন',
    descriptionEn: 'Scratch 2 lucky reward cards to unlock surprise prizes',
    category: 'scratch',
    target: 2,
    unitBn: 'টি',
    unitEn: 'cards',
    reward: 10.0,
    icon: 'gift',
  },
  {
    id: 'mission_daily_checkin',
    titleBn: 'দৈনিক চেক-ইন সম্পন্ন করুন',
    titleEn: 'Daily Check-In',
    descriptionBn: 'আজকের দৈনিক হাজিরা বোনাস ও স্ট্রিক পয়েন্ট সংগ্রহ করুন',
    descriptionEn: 'Claim your daily check-in attendance reward & streak points',
    category: 'checkin',
    target: 1,
    unitBn: 'বার',
    unitEn: 'time',
    reward: 5.0,
    icon: 'calendar',
  },
];

export const DAILY_MILESTONES: DailyMilestoneTier[] = [
  {
    tier: 1,
    requiredMissions: 2,
    reward: 10.0,
    titleBn: 'রৌপ্য মাইলস্টোন',
    titleEn: 'Silver Milestone',
    badge: '🥈',
  },
  {
    tier: 2,
    requiredMissions: 4,
    reward: 25.0,
    titleBn: 'স্বর্ণ মাইলস্টোন',
    titleEn: 'Gold Milestone',
    badge: '🥇',
  },
  {
    tier: 3,
    requiredMissions: 6,
    reward: 50.0,
    titleBn: 'মাস্টার জ্যাকপট',
    titleEn: 'Master Jackpot',
    badge: '👑',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STORAGE_KEY_PREFIX = 'smart_earning_daily_missions_';

export function loadDailyMissionsState(): DailyMissionState {
  const today = getTodayDateString();
  const key = `${STORAGE_KEY_PREFIX}${today}`;

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.date === today && parsed.counts) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore json error
  }

  // Initial fresh state for today
  const freshState: DailyMissionState = {
    date: today,
    counts: {
      refer: 0,
      video: 0,
      task: 0,
      spin: 0,
      scratch: 0,
      checkin: 0,
    },
    claimedMissions: {},
    claimedMilestones: {},
  };

  try {
    localStorage.setItem(key, JSON.stringify(freshState));
  } catch (e) {}

  return freshState;
}

export function saveDailyMissionsState(state: DailyMissionState): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${state.date}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {}
}

export function recordDailyMissionAction(
  actionType: keyof DailyMissionState['counts'],
  amount: number = 1
): DailyMissionState {
  const current = loadDailyMissionsState();
  const prevCount = current.counts[actionType] || 0;
  current.counts[actionType] = prevCount + amount;
  saveDailyMissionsState(current);
  return current;
}

export function claimDailyMission(
  missionId: string
): { success: boolean; reward: number; state: DailyMissionState } {
  const state = loadDailyMissionsState();
  const mission = DAILY_MISSIONS_LIST.find((m) => m.id === missionId);

  if (!mission) {
    return { success: false, reward: 0, state };
  }

  const currentProgress = state.counts[mission.category] || 0;
  if (currentProgress < mission.target) {
    return { success: false, reward: 0, state };
  }

  if (state.claimedMissions[missionId]) {
    return { success: false, reward: 0, state };
  }

  state.claimedMissions[missionId] = true;
  saveDailyMissionsState(state);

  return { success: true, reward: mission.reward, state };
}

export function claimDailyMilestoneTier(
  tier: number
): { success: boolean; reward: number; state: DailyMissionState } {
  const state = loadDailyMissionsState();
  const milestone = DAILY_MILESTONES.find((m) => m.tier === tier);

  if (!milestone) {
    return { success: false, reward: 0, state };
  }

  // Count how many missions have reached target or are completed
  const completedMissionsCount = DAILY_MISSIONS_LIST.filter((m) => {
    const p = state.counts[m.category] || 0;
    return p >= m.target;
  }).length;

  if (completedMissionsCount < milestone.requiredMissions) {
    return { success: false, reward: 0, state };
  }

  if (state.claimedMilestones[tier]) {
    return { success: false, reward: 0, state };
  }

  state.claimedMilestones[tier] = true;
  saveDailyMissionsState(state);

  return { success: true, reward: milestone.reward, state };
}

import { EarnTask, LeaderboardRank, UserData, VideoClip } from '../types';

export const INITIAL_USER: UserData = {
  id: 'usr_882910',
  telegramId: 582910284,
  name: 'Md. Tanvir Hossain',
  username: 'tanvir_dev',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  balance: 5.00,
  minWithdraw: 1000.00,
  totalEarned: 5.00,
  totalWithdrawn: 0.00,
  referralCode: 'SMART8829',
  referralsCount: 2,
  phone: '01712345678',
  dailyCheckedIn: false,
};

export const INITIAL_TASKS: EarnTask[] = [
  {
    id: 'task_checkin',
    title: 'Daily Check-in Bonus',
    titleBn: 'দৈনিক চেক-ইন বোনাস',
    reward: 5.00,
    iconType: 'checkin',
    category: 'Daily',
    completed: false,
  },
  {
    id: 'task_tg_channel',
    title: 'Join Official Telegram Channel',
    titleBn: 'অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হোন',
    reward: 10.00,
    iconType: 'telegram',
    category: 'Social',
    completed: false,
    link: 'https://t.me/telegram',
  },
  {
    id: 'task_yt_sub',
    title: 'Subscribe to YouTube Channel',
    titleBn: 'ইউটিউব চ্যানেল সাবস্ক্রাইব করুন',
    reward: 8.00,
    iconType: 'youtube',
    category: 'Social',
    completed: false,
    link: 'https://youtube.com',
  },
  {
    id: 'task_fb_page',
    title: 'Follow Facebook Page',
    titleBn: 'ফেসবুক পেজ ফলো ও লাইক করুন',
    reward: 6.00,
    iconType: 'facebook',
    category: 'Social',
    completed: false,
    link: 'https://facebook.com',
  },
  {
    id: 'task_math_quiz',
    title: 'Solve Simple Math Quiz',
    titleBn: 'সহজ গণিত কুইজ সমাধান করুন',
    reward: 3.50,
    iconType: 'quiz',
    category: 'Quiz',
    completed: false,
  },
];

export const INITIAL_VIDEOS: VideoClip[] = [];

export const INITIAL_LEADERBOARD: LeaderboardRank[] = [
  {
    rank: 1,
    name: 'Shakil Ahmed',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    earnings: 14850,
    referrals: 342,
  },
  {
    rank: 2,
    name: 'Nusrat Jahan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    earnings: 11420,
    referrals: 289,
  },
  {
    rank: 3,
    name: 'Rakib Hasan',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    earnings: 9800,
    referrals: 215,
  },
  {
    rank: 4,
    name: 'Amina Khatun',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    earnings: 8250,
    referrals: 180,
  },
  {
    rank: 5,
    name: 'Sabbir Rahman',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    earnings: 6900,
    referrals: 144,
  },
  {
    rank: 6,
    name: 'Fariha Sultana',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    earnings: 5400,
    referrals: 112,
  },
];

export interface UserData {
  id: string;
  telegramId?: number;
  name: string;
  username?: string;
  avatarUrl: string;
  balance: number;
  minWithdraw: number;
  totalEarned: number;
  totalWithdrawn: number;
  referralCode: string;
  referredBy?: string;
  referralsCount: number;
  phone?: string;
  dailyCheckedIn: boolean;
  lastCheckInTimestamp?: number;
  checkInStreak?: number;
  pendingReferralBonus?: number;
}

export interface ReferredUser {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  joinedDate: string;
  daysActive: number; // Required: 3 days
  tasksCompleted: number; // Required: 20 tasks
  status: 'pending' | 'verified';
  rewardAmount: number; // ৳100
  isTransferredToMain: boolean; // whether ৳100 was transferred to user's main wallet
}

export interface EarnTask {
  id: string;
  title: string;
  titleBn: string;
  reward: number;
  iconType: 'telegram' | 'youtube' | 'facebook' | 'quiz' | 'checkin' | 'survey' | 'web' | 'ad';
  category: string;
  completed: boolean;
  link?: string;
  duration?: number;
}

export interface VideoClip {
  id: string;
  title: string;
  category: 'all' | 'movies' | 'funny' | 'music' | 'gaming' | 'news';
  duration: number; // in seconds
  reward: number;
  thumbnailUrl: string;
  videoUrl: string;
  views: string | number;
  viewCount?: number;
  watched: boolean;
}

export interface WithdrawalRecord {
  id: string;
  date: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Binance';
  accountNumber: string;
  accountType: 'Personal' | 'Agent';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  userName?: string;
  userPhone?: string;
  trxId?: string;
  adminNote?: string;
  processedAt?: string;
}

export interface LeaderboardRank {
  id?: string;
  rank: number;
  name: string;
  username?: string;
  avatar: string;
  earnings: number;
  referrals: number;
  tasksCompleted?: number;
  isCurrentUser?: boolean;
}

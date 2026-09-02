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
}

export interface EarnTask {
  id: string;
  title: string;
  titleBn: string;
  reward: number;
  iconType: 'telegram' | 'youtube' | 'facebook' | 'quiz' | 'checkin' | 'survey';
  category: string;
  completed: boolean;
  link?: string;
}

export interface VideoClip {
  id: string;
  title: string;
  category: 'all' | 'viral' | 'marketing' | 'trailer' | 'funny';
  duration: number; // in seconds
  reward: number;
  thumbnailUrl: string;
  videoUrl: string;
  views: string;
  watched: boolean;
}

export interface WithdrawalRecord {
  id: string;
  date: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay';
  accountNumber: string;
  accountType: 'Personal' | 'Agent';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface LeaderboardRank {
  rank: number;
  name: string;
  avatar: string;
  earnings: number;
  referrals: number;
}

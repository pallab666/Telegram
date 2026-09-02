import React from 'react';
import { Home, UserPlus, Coins, Award, User } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export type NavTab = 'home' | 'refer' | 'earn' | 'rank' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const handleTabClick = (tab: NavTab) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none"
      id="bottom-navigation-bar"
    >
      <div className="flex items-center justify-around relative">
        {/* 1. Home Tab (Elevated Floating Button) */}
        <button
          onClick={() => handleTabClick('home')}
          className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
          id="nav-tab-home"
        >
          <div className="relative w-12 h-12 rounded-2xl bg-white ring-4 ring-slate-100/90 p-1 flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform active:scale-95 border border-slate-200/80">
            <div className="w-full h-full rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white shadow-sm">
              <Home className="w-5 h-5 fill-white stroke-white" />
            </div>
          </div>
          <span
            className={`mt-1 text-[10px] font-bold tracking-tight ${
              activeTab === 'home' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Refer Tab */}
        <button
          onClick={() => handleTabClick('refer')}
          className="flex flex-col items-center py-1 group active:scale-95 transition-transform"
          id="nav-tab-refer"
        >
          <div
            className={`transition-colors ${
              activeTab === 'refer' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'refer' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            Refer
          </span>
        </button>

        {/* 3. Earn Tab */}
        <button
          onClick={() => handleTabClick('earn')}
          className="flex flex-col items-center py-1 group active:scale-95 transition-transform"
          id="nav-tab-earn"
        >
          <div
            className={`transition-colors ${
              activeTab === 'earn' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Coins className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'earn' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            Earn
          </span>
        </button>

        {/* 4. Rank Tab */}
        <button
          onClick={() => handleTabClick('rank')}
          className="flex flex-col items-center py-1 group active:scale-95 transition-transform"
          id="nav-tab-rank"
        >
          <div
            className={`transition-colors ${
              activeTab === 'rank' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'rank' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            Rank
          </span>
        </button>

        {/* 5. Profile Tab */}
        <button
          onClick={() => handleTabClick('profile')}
          className="flex flex-col items-center py-1 group active:scale-95 transition-transform"
          id="nav-tab-profile"
        >
          <div
            className={`transition-colors ${
              activeTab === 'profile' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};

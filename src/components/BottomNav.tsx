import React from 'react';
import { Home, Users, CheckSquare, Trophy, User } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export type NavTab = 'home' | 'refer' | 'earn' | 'rank' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: React.FC<any> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'refer', label: 'Refer', icon: Users },
  { id: 'earn', label: 'Earn', icon: CheckSquare },
  { id: 'rank', label: 'Rank', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User }
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const handleTabClick = (tab: NavTab) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-[60] flex justify-center pointer-events-none"
      id="bottom-navigation-bar"
    >
      <div className="w-full max-w-md h-[72px] bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pointer-events-auto rounded-t-3xl">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          if (isActive) {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative -top-6 flex flex-col items-center justify-center gap-1 w-16 group transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_5px_15px_rgba(139,92,246,0.3)] border-4 border-[#f4f0ff] transition-colors">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-purple-700 text-[11px] font-black mt-1 absolute -bottom-5">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center gap-1 w-14 transition-transform active:scale-95 pt-2"
            >
              <Icon className="w-6 h-6 text-slate-400 group-hover:text-purple-500" strokeWidth={2} />
              <span className="text-[10px] font-bold text-slate-500 mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};



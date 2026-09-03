import React, { useState } from 'react';
import { X, Check, Globe, Link2, Send, ChevronDown, MoreVertical, Settings, Play, Briefcase, Clock, Zap } from 'lucide-react';
import { EarnTask } from '../types';
import { triggerHaptic } from '../utils/telegram';
import confetti from 'canvas-confetti';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  tasks: EarnTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  dailyCheckedIn: boolean;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  tasks,
  onCompleteTask,
  dailyCheckedIn,
}) => {
  const [activeTab, setActiveTab] = useState<'visit' | 'special'>('visit');

  if (!isOpen) return null;

  const handleTaskClick = (task: EarnTask) => {
    if (task.completed) return;

    triggerHaptic('medium');
    if (task.link) {
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(task.link);
      } else {
        window.open(task.link, '_blank');
      }
    }

    // Simulate ad watch or task completion
    setTimeout(() => {
      onCompleteTask(task.id, task.reward);
    }, 1500);
  };

  const handleWatchAd = () => {
    triggerHaptic('success');
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, zIndex: 9999 });
    // Simulate watching an ad
    setTimeout(() => {
      onCompleteTask('watch_ad_bonus', 10.00);
    }, 1000);
  };

  const renderIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><Check size={18} /></div>;
    }
    
    switch (type) {
      case 'telegram':
        return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500"><Send size={18} /></div>;
      case 'youtube':
        return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500"><Play size={18} fill="currentColor" /></div>;
      case 'checkin':
        return <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500"><Globe size={18} /></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500"><Link2 size={18} /></div>;
    }
  };

  // Generate some extra visual tasks if the list is short to match the screenshot vibe
  const displayTasks = [...tasks];
  if (displayTasks.length < 10) {
    for (let i = displayTasks.length; i < 12; i++) {
      displayTasks.push({
        id: `mock_task_${i}`,
        title: `Visit Job ${i + 1}`,
        titleBn: `ভিজিট করুন ${i + 1}`,
        reward: 30.00,
        iconType: i % 4 === 0 ? 'telegram' : 'quiz',
        category: 'visit',
        completed: false
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#eef2ff] animate-in slide-in-from-bottom-2 sm:max-w-md sm:mx-auto sm:border-x border-slate-200 overflow-hidden">
      
      {/* Top Status Bar (Purple) */}
      <div className="bg-[#a855f7] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-sm relative z-20">
        <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-2 font-black text-lg tracking-wide">
          🎁 Smart Earning 💸
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown size={24} className="opacity-80" />
          <MoreVertical size={24} className="opacity-80" />
        </div>
      </div>

      {/* Profile Bar (Blue) */}
      <div className="bg-gradient-to-b from-[#3b82f6] to-[#60a5fa] px-4 py-3 flex items-center justify-between text-white rounded-b-3xl shrink-0 shadow-md relative z-10">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 bg-blue-300 shadow-inner">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80] animate-pulse"></div>
          <span className="text-xs font-black tracking-widest uppercase">49 Online</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/30 transition-colors shadow-inner">
          <Settings size={20} className="text-yellow-300" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full pb-20">
        <div className="px-4 py-6">
          
          {/* HERO CARD - Watch Ads & Earn */}
          <div className="bg-gradient-to-br from-[#8b5cf6] via-[#c026d3] to-[#d946ef] rounded-[2rem] p-6 shadow-xl shadow-purple-500/20 text-center relative overflow-hidden mb-6 border border-purple-400/30">
            {/* Background floating money elements (implied) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Giant Coin Icon */}
              <div className="w-24 h-24 rounded-full border-4 border-yellow-200/50 bg-gradient-to-b from-yellow-100 to-yellow-300 flex items-center justify-center shadow-[0_0_30px_rgba(253,224,71,0.5)] mb-4 relative">
                <div className="w-16 h-16 bg-[#854d0e] rounded-full flex items-center justify-center">
                  <span className="text-4xl font-black text-yellow-400">$</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#4ade80] text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-purple-600 shadow-sm">
                  $$$
                </div>
              </div>

              <h2 className="text-[26px] font-black text-white mb-4 drop-shadow-md tracking-tight">Watch Ads & Earn</h2>
              
              {/* Dark Info Box */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center border border-white/10 shadow-inner w-[85%] mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-xs">Per Ad Reward:</span>
                  <span className="bg-[#4ade80] text-emerald-950 px-2 py-0.5 rounded-full text-xs font-black">৳10.0000</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-yellow-700 rounded-full"></div>
                  </div>
                  <span className="text-yellow-400 font-bold text-[10px] tracking-widest uppercase">Daily Limit: <span className="text-white">0 / 300</span></span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleWatchAd}
                className="w-full bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] shadow-[0_6px_0_#ca8a04] rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:shadow-[0_0px_0_#ca8a04] active:translate-y-1.5"
              >
                <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center pl-0.5">
                  <Play className="text-yellow-400" size={14} fill="currentColor" />
                </div>
                <span className="text-purple-900 font-black text-lg tracking-wide uppercase">Watch Ad Now</span>
              </button>
            </div>
          </div>

          {/* TWO TABS */}
          <div className="flex gap-3 mb-6">
            <button 
              onClick={() => setActiveTab('visit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm shadow-md transition-all ${
                activeTab === 'visit' 
                ? 'bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white border border-blue-400 shadow-blue-500/30' 
                : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <Globe size={18} /> Visit Jobs
            </button>
            <button 
              onClick={() => setActiveTab('special')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm shadow-md transition-all ${
                activeTab === 'special' 
                ? 'bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white border border-blue-400 shadow-blue-500/30' 
                : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <Briefcase size={18} /> Special Jobs
            </button>
          </div>

          {/* TASKS LIST */}
          <div className="space-y-3.5">
            {displayTasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`relative bg-gradient-to-r from-[#fefce8] to-[#fffbeb] rounded-[1.25rem] p-3.5 flex items-center justify-between border-2 transition-all ${
                  task.completed ? 'opacity-60 border-slate-200 grayscale-[0.5]' : 'border-[#fde047] shadow-sm hover:shadow-md'
                }`}
              >
                {!task.completed && (
                  <div className="absolute top-0 right-3 -translate-y-1/2 bg-[#ef4444] text-white px-1.5 py-0.5 rounded shadow-sm text-[8px] font-black uppercase tracking-wider">
                    HOT
                  </div>
                )}
                
                <div className="flex items-center gap-3.5">
                  {renderIcon(task.iconType, task.completed)}
                  
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-[15px] mb-0.5">
                      {task.titleBn}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#10b981] font-black text-[13px]">+৳{task.reward.toFixed(2)}</span>
                      <div className="flex items-center gap-0.5 text-slate-400">
                        {task.iconType === 'telegram' ? (
                          <Zap size={10} className="text-blue-500" />
                        ) : (
                          <Clock size={10} />
                        )}
                        <span className="text-[10px] font-bold">{task.iconType === 'telegram' ? 'Instant' : index === 0 ? '150s' : '60s'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleTaskClick(task)}
                  disabled={task.completed}
                  className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-90 ${
                    task.completed
                    ? 'bg-slate-200 text-slate-500 border-slate-300'
                    : task.iconType === 'telegram'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}
                >
                  {task.completed ? (
                    'Done'
                  ) : task.iconType === 'telegram' ? (
                    <>+ Join</>
                  ) : (
                    <>Start <Play size={10} fill="currentColor" /></>
                  )}
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

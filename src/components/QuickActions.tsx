import React from 'react';
import { ListChecks, Video, Users, Landmark } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { AppPreferences } from '../utils/preferences';

interface QuickActionsProps {
  onOpenTasks: () => void;
  onOpenVideos: () => void;
  onOpenRefer: () => void;
  onOpenWithdraw: () => void;
  pendingTasksCount?: number;
  preferences?: AppPreferences;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenTasks,
  onOpenVideos,
  onOpenRefer,
  onOpenWithdraw,
  pendingTasksCount = 0,
  preferences,
}) => {
  const isBn = preferences?.language !== 'en';

  return (
    <div className="px-4 py-2" id="section-quick-actions">
      <div className="grid grid-cols-4 gap-2.5">
        {/* 1. Tasks */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenTasks();
          }}
          className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow transition-all group active:scale-95 cursor-pointer"
          id="btn-quick-tasks"
        >
          <div className="relative w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
            <ListChecks className="w-5 h-5" strokeWidth={2.2} />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span className="mt-2 text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
            {isBn ? 'টাস্ক' : 'Tasks'}
          </span>
        </button>

        {/* 2. Videos */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenVideos();
          }}
          className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow transition-all group active:scale-95 cursor-pointer"
          id="btn-quick-videos"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
            <Video className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <span className="mt-2 text-[11px] font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
            {isBn ? 'ভিডিও' : 'Videos'}
          </span>
        </button>

        {/* 3. Refer */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenRefer();
          }}
          className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow transition-all group active:scale-95 cursor-pointer"
          id="btn-quick-refer"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
            <Users className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <span className="mt-2 text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
            {isBn ? 'রেফার' : 'Refer'}
          </span>
        </button>

        {/* 4. Withdraw */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenWithdraw();
          }}
          className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow transition-all group active:scale-95 cursor-pointer"
          id="btn-quick-withdraw"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
            <Landmark className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <span className="mt-2 text-[11px] font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
            {isBn ? 'উত্তোলন' : 'Withdraw'}
          </span>
        </button>
      </div>
    </div>
  );
};

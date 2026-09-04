import React from "react";
import { motion } from "motion/react";
import { ListChecks, Video, Users, Landmark } from "lucide-react";
import { triggerHaptic } from "../utils/telegram";
import { AppPreferences } from "../utils/preferences";

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
  const isBn = preferences?.language !== "en";

  return (
    <div className="px-4 py-4" id="section-quick-actions">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-4 gap-3"
      >
        {/* 1. Tasks */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", bounce: 0.4 },
            },
          }}
          onClick={() => {
            triggerHaptic("medium");
            onOpenTasks();
          }}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform cursor-pointer"
          id="btn-quick-tasks"
        >
          <div className="relative w-[3.5rem] h-[3.5rem] rounded-[1.25rem] bg-[#ec4899] flex items-center justify-center shadow-sm">
            <ListChecks className="w-6 h-6 text-white" strokeWidth={2.5} />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#f4f0ff] shadow">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span className="text-[12px] font-black text-slate-700">
            {isBn ? "টাস্ক" : "Tasks"}
          </span>
        </motion.button>

        {/* 2. Videos */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", bounce: 0.4 },
            },
          }}
          onClick={() => {
            triggerHaptic("medium");
            onOpenVideos();
          }}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform cursor-pointer"
          id="btn-quick-videos"
        >
          <div className="w-[3.5rem] h-[3.5rem] rounded-[1.25rem] bg-[#f97316] flex items-center justify-center shadow-sm">
            <Video
              className="w-6 h-6 text-white"
              strokeWidth={2.5}
              fill="currentColor"
            />
          </div>
          <span className="text-[12px] font-black text-slate-700">
            {isBn ? "ভিডিও" : "Videos"}
          </span>
        </motion.button>

        {/* 3. Refer */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", bounce: 0.4 },
            },
          }}
          onClick={() => {
            triggerHaptic("medium");
            onOpenRefer();
          }}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform cursor-pointer"
          id="btn-quick-refer"
        >
          <div className="w-[3.5rem] h-[3.5rem] rounded-[1.25rem] bg-[#3b82f6] flex items-center justify-center shadow-sm">
            <Users
              className="w-6 h-6 text-white"
              strokeWidth={2.5}
              fill="currentColor"
            />
          </div>
          <span className="text-[12px] font-black text-slate-700">
            {isBn ? "রেফার" : "Refer"}
          </span>
        </motion.button>

        {/* 4. Withdraw */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", bounce: 0.4 },
            },
          }}
          onClick={() => {
            triggerHaptic("medium");
            onOpenWithdraw();
          }}
          className="flex flex-col items-center gap-2 group active:scale-95 transition-transform cursor-pointer"
          id="btn-quick-withdraw"
        >
          <div className="w-[3.5rem] h-[3.5rem] rounded-[1.25rem] bg-[#10b981] flex items-center justify-center shadow-sm">
            <Landmark
              className="w-6 h-6 text-white"
              strokeWidth={2.5}
              fill="currentColor"
            />
          </div>
          <span className="text-[12px] font-black text-slate-700">
            {isBn ? "উত্তোলন" : "Withdraw"}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};
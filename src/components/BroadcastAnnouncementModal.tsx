import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone,
  Sparkles,
  X,
  ExternalLink,
  Zap,
  BellRing,
  ArrowRight,
} from "lucide-react";
import {
  BroadcastAnnouncement,
  isAnnouncementDismissed,
  markAnnouncementDismissed,
} from "../utils/announcementManager";
import { triggerHaptic, openAdLink } from "../utils/telegram";
import { triggerSmartAd } from "../utils/adManager";

interface BroadcastAnnouncementModalProps {
  announcement: BroadcastAnnouncement | null;
  onOpenTasks?: () => void;
  onOpenRefer?: () => void;
}

export const BroadcastAnnouncementModal: React.FC<
  BroadcastAnnouncementModalProps
> = ({ announcement, onOpenTasks, onOpenRefer }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!announcement || !announcement.enabled || !announcement.title) {
      setIsOpen(false);
      return;
    }

    // Check if this specific announcement version has been dismissed by user
    if (!isAnnouncementDismissed(announcement.id)) {
      // Delay popup slightly for smooth app entry
      const timer = setTimeout(() => {
        setIsOpen(true);
        triggerHaptic("medium");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  if (!isOpen || !announcement || !announcement.enabled) return null;

  const handleDismiss = () => {
    triggerHaptic("light");
    markAnnouncementDismissed(announcement.id);
    setIsOpen(false);
  };

  const handleAction = () => {
    triggerHaptic("success");
    handleDismiss();

    if (announcement.linkUrl && announcement.linkUrl.trim()) {
      // Open external or Adsterra link
      openAdLink(announcement.linkUrl);
    } else if (announcement.actionType === "task" && onOpenTasks) {
      onOpenTasks();
    } else if (announcement.actionType === "event" && onOpenTasks) {
      onOpenTasks();
    } else if (announcement.actionType === "ad") {
      triggerSmartAd("task");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-purple-200/80 relative"
          id="modal-broadcast-notice"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 p-5 text-white overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-pink-500/20 rounded-full blur-xl pointer-events-none -ml-8 -mb-8" />

            <button
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                <Megaphone className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                    {announcement.badge || "জরুরি নোটিশ 📢"}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1 leading-tight drop-shadow-xs">
                  {announcement.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-100/80">
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {announcement.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleAction}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{announcement.linkText || "এখনই দেখুন (Explore)"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                পরে দেখব (Got it)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

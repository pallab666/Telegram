import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCheck, ExternalLink, Calendar, MessageSquare, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export interface UserNotificationItem {
  id: string;
  targetUserId?: string;
  title: string;
  message: string;
  appLink?: string;
  createdAt: number;
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotificationItem[];
  onMarkRead: (id?: string) => void;
  language?: 'en' | 'bn';
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  language = 'bn',
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 p-4 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0 relative">
                  <Bell className="w-5 h-5 text-amber-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-purple-800">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {language === 'bn' ? 'বিজ্ঞপ্তি ও মেসেজসমূহ' : 'Notifications & Messages'}
                  </h3>
                  <p className="text-[11px] text-purple-100 font-medium">
                    {language === 'bn'
                      ? `এডমিন থেকে পাঠানো বার্তা (${notifications.length})`
                      : `Messages from Admin (${notifications.length})`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mark All Read Bar */}
          {unreadCount > 0 && (
            <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/60 flex items-center justify-between text-xs shrink-0">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                {unreadCount} {language === 'bn' ? 'টি নতুন পঠিত বার্তা আছে' : 'unread messages'}
              </span>
              <button
                onClick={() => {
                  triggerHaptic('success');
                  onMarkRead();
                }}
                className="text-purple-300 hover:text-white font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'bn' ? 'সবগুলো পঠিত চিহ্নিত করুন' : 'Mark all as read'}</span>
              </button>
            </div>
          )}

          {/* Notifications List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 border border-slate-700">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-black text-sm text-slate-300">
                  {language === 'bn' ? 'কোনো বার্তা নেই' : 'No Messages Yet'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {language === 'bn'
                    ? 'এডমিন থেকে আপনার জন্য কোনো নোটিফিকেশন পাঠালে তা এখানে দেখা যাবে।'
                    : 'When admin sends you a direct message or alert, it will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) onMarkRead(item.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    !item.read
                      ? 'bg-gradient-to-br from-indigo-950/70 to-purple-950/70 border-purple-500/50 shadow-md'
                      : 'bg-slate-800/50 border-slate-700/60 opacity-90'
                  }`}
                >
                  {!item.read && (
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="bg-rose-500/20 text-rose-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/40">
                        {language === 'bn' ? 'নতুন' : 'NEW'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0 mt-0.5">
                      <Bell className="w-4.5 h-4.5 text-purple-400" />
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <h4 className="font-black text-xs text-white mb-1 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-300 font-normal leading-relaxed whitespace-pre-line mb-2">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          {new Date(item.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>

                        {item.appLink && (
                          <a
                            href={item.appLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                          >
                            <span>{language === 'bn' ? 'লিংক খুলুন' : 'Open Link'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Close */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center shrink-0">
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

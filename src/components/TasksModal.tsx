import React, { useState } from 'react';
import { X, Check, ExternalLink, CalendarCheck, Send, Youtube, Facebook, HelpCircle, Sparkles } from 'lucide-react';
import { EarnTask } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: EarnTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  dailyCheckedIn: boolean;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onCompleteTask,
  dailyCheckedIn,
}) => {
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizError, setQuizError] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Simple math quiz: 23 + 17 = 40
  const num1 = 23;
  const num2 = 17;
  const correctAnswer = num1 + num2; // 40

  if (!isOpen) return null;

  const handleTaskClick = (task: EarnTask) => {
    if (task.completed) return;

    if (task.iconType === 'quiz') {
      setShowQuiz(true);
      return;
    }

    triggerHaptic('medium');
    if (task.link) {
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(task.link);
      } else {
        window.open(task.link, '_blank');
      }
    }

    // Award task reward
    setTimeout(() => {
      onCompleteTask(task.id, task.reward);
    }, 1000);
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(quizAnswer.trim(), 10) === correctAnswer) {
      triggerHaptic('success');
      setQuizError(false);
      setShowQuiz(false);
      onCompleteTask('task_math_quiz', 3.50);
    } else {
      triggerHaptic('warning');
      setQuizError(true);
    }
  };

  const getTaskIcon = (type: EarnTask['iconType']) => {
    switch (type) {
      case 'checkin':
        return <CalendarCheck className="w-5 h-5 text-emerald-400" />;
      case 'telegram':
        return <Send className="w-5 h-5 text-blue-400" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
              📋
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">দৈনিক টাস্ক সেন্টার (Tasks)</h3>
              <p className="text-[11px] text-slate-400">টাস্ক পূরণ করুন ও ব্যালেন্স বৃদ্ধি করুন</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task list body */}
        <div className="p-4 overflow-y-auto space-y-2.5 bg-slate-50">
          {showQuiz && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl mb-3 space-y-3 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>গণিত কুইজ সমাধান করুন:</span>
              </h4>
              <p className="text-slate-900 text-base font-mono font-black text-center bg-slate-100 py-2 rounded-xl border border-slate-200">
                {num1} + {num2} = ?
              </p>
              <form onSubmit={handleQuizSubmit} className="space-y-2">
                <input
                  type="number"
                  placeholder="আপনার উত্তর দিন..."
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
                {quizError && (
                  <p className="text-xs text-rose-500 font-semibold">ভুল উত্তর! আবার চেষ্টা করুন।</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    জমা দিন (+৳3.50 BDT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                task.completed
                  ? 'bg-slate-100/80 border-slate-200 opacity-60'
                  : 'bg-white hover:border-indigo-200 border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  {getTaskIcon(task.iconType)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                    {task.titleBn || task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-extrabold text-emerald-600">
                      +৳{task.reward.toFixed(2)} BDT
                    </span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>

              {task.completed ? (
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>সম্পন্ন</span>
                </div>
              ) : (
                <button
                  onClick={() => handleTaskClick(task)}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-transform active:scale-95 flex-shrink-0"
                  id={`btn-do-task-${task.id}`}
                >
                  <span>শুরু করুন</span>
                  {task.link && <ExternalLink className="w-3 h-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

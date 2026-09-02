import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Sparkles, CheckCircle2 } from 'lucide-react';
import { VideoClip } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface VideoPlayerModalProps {
  video: VideoClip | null;
  onClose: () => void;
  onClaimReward: (videoId: string, reward: number) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onClaimReward,
}) => {
  if (!video) return null;

  const [timeLeft, setTimeLeft] = useState(video.duration);
  const [isPlaying, setIsPlaying] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(video.watched);

  useEffect(() => {
    setTimeLeft(video.duration);
    setCanClaim(false);
    setClaimed(video.watched);
    setIsPlaying(true);
  }, [video]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0 && !canClaim && !claimed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClaim(true);
            triggerHaptic('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, canClaim, claimed]);

  const handleClaim = () => {
    if (!canClaim || claimed) return;
    triggerHaptic('success');
    setClaimed(true);
    onClaimReward(video.id, video.reward);
  };

  const progress = ((video.duration - timeLeft) / video.duration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              ভিডিও দেখে আয় করুন
            </span>
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

        {/* Video simulation / player screen */}
        <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover opacity-80"
          />

          {/* Center Play/Pause button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute w-14 h-14 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Overlay countdown badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {canClaim ? 'সময় শেষ!' : `বাকি: ${timeLeft} সেকেন্ড`}
            </span>
          </div>

          {/* Reward Tag */}
          <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm">
            +৳{video.reward.toFixed(2)} BDT
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Details & Action */}
        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{video.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              পুরো ভিডিওটি দেখুন এবং পুরস্কার দাবি করতে অপেক্ষা করুন।
            </p>
          </div>

          {claimed ? (
            <div className="w-full py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>পুরস্কার ৳{video.reward.toFixed(2)} BDT সফলভাবে যোগ হয়েছে!</span>
            </div>
          ) : canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              id="btn-claim-video-reward"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>পুরস্কার নিন: ৳{video.reward.toFixed(2)} BDT</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 bg-slate-200 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>ভিডিও দেখা হচ্ছে ({timeLeft}s)...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

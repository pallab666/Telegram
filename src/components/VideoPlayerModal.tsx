import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Sparkles, CheckCircle2, Maximize, Minimize } from 'lucide-react';
import { VideoClip } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { triggerSmartAd } from '../utils/adManager';
import { AppPreferences, formatMoney, playAppSound } from '../utils/preferences';

interface VideoPlayerModalProps {
  video: VideoClip | null;
  onClose: () => void;
  onClaimReward: (videoId: string, reward: number) => void;
  preferences?: AppPreferences;
  onlineCount?: number;
}

function getEmbedUrl(url: string) {
  if (!url) return '';
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${v}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const v = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${v}?autoplay=1`;
    }
  } catch(e) {}
  return url;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onClaimReward,
  preferences,
  onlineCount = 1,
}) => {
  if (!video) return null;

  const isBn = preferences?.language !== 'en';
  const currency = preferences?.currency || 'BDT';

  const [timeLeft, setTimeLeft] = useState(video.duration);
  const [isPlaying, setIsPlaying] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(video.watched);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeLeft(video.duration);
    setCanClaim(false);
    setClaimed(video.watched);
    setIsPlaying(true);

    // Trigger dual ad rotation (Adsterra / Monetag)
    try {
      triggerSmartAd('video');
    } catch (e) {
      console.warn('Ad trigger ignored', e);
    }
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleClaim = () => {
    if (!canClaim || claimed) return;
    triggerHaptic('success');
    playAppSound('reward');
    setClaimed(true);
    onClaimReward(video.id, video.reward);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const progress = ((video.duration - timeLeft) / video.duration) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm ">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              ভিডিও দেখে আয় করুন
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{onlineCount} {isBn ? "অনলাইন" : "Live"}</span>
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
        </div>

        {/* Video simulation / player screen */}
        <div ref={videoContainerRef} className="relative aspect-video bg-black overflow-hidden flex items-center justify-center group">
          {isPlaying && video.videoUrl ? (
            <iframe
              src={getEmbedUrl(video.videoUrl)}
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover opacity-80"
            />
          )}

          {/* Center Play/Pause button overlay - Only show if not playing to let iframe handle its own controls, or if there's no real video URL */}
          {(!isPlaying || !video.videoUrl) && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute w-14 h-14 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-sm z-10"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>
          )}

          {/* Overlay countdown badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-sm z-10 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {canClaim ? 'সময় শেষ!' : `বাকি: ${timeLeft} সেকেন্ড`}
            </span>
          </div>

          {/* Reward Tag */}
          <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm z-10 pointer-events-none">
            +৳{video.reward.toFixed(2)} BDT
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-slate-700/50 text-white flex items-center justify-center backdrop-blur-md transition-all z-20 ${!isFullscreen ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
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
              {isBn
                ? 'পুরো ভিডিওটি দেখুন এবং পুরস্কার দাবি করতে অপেক্ষা করুন।'
                : 'Watch the full video to claim your reward.'}
            </p>
          </div>

          {claimed ? (
            <div className="w-full py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {isBn
                  ? `পুরস্কার ${formatMoney(video.reward, currency)} সফলভাবে যোগ হয়েছে!`
                  : `Reward ${formatMoney(video.reward, currency)} added successfully!`}
              </span>
            </div>
          ) : canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
              id="btn-claim-video-reward"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isBn
                  ? `পুরস্কার নিন: ${formatMoney(video.reward, currency)}`
                  : `Claim Reward: ${formatMoney(video.reward, currency)}`}
              </span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 bg-slate-200 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>
                {isBn
                  ? `ভিডিও দেখা হচ্ছে (${timeLeft}s)...`
                  : `Watching video (${timeLeft}s)...`}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
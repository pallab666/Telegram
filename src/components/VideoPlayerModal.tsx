import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Sparkles, CheckCircle2, Maximize, Minimize, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';
import { VideoClip } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { triggerSmartAd, getAdConfig } from '../utils/adManager';
import { AppPreferences, formatMoney, playAppSound } from '../utils/preferences';
import { formatViews } from './MoviesClipsSection';

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
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
    } else if (url.includes('youtube.com/live/')) {
      videoId = url.split('youtube.com/live/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      // It's already an embed URL, just ensure autoplay
      return url.includes('autoplay=1') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
    }
    
    if (videoId) {
      // Remove any trailing slashes or extra path segments just in case
      videoId = videoId.split('/')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    }
  } catch(e) {
    console.warn("Failed to parse YouTube URL", e);
  }
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

  const adConfig = getAdConfig();
  const requiredWatchSeconds = Math.max(video.duration || 15, Number(adConfig.adWatchDuration) || 30);

  const [totalDuration, setTotalDuration] = useState(requiredWatchSeconds);
  const [timeLeft, setTimeLeft] = useState(requiredWatchSeconds);
  const [isPlaying, setIsPlaying] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(video.watched);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [attentionVerified, setAttentionVerified] = useState(!adConfig.enableAttentionCheck);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config = getAdConfig();
    const dur = Math.max(video.duration || 15, Number(config.adWatchDuration) || 30);
    setTotalDuration(dur);
    setTimeLeft(dur);
    setCanClaim(false);
    setClaimed(video.watched);
    setIsPlaying(true);
    setShowExitWarning(false);
    setAttentionVerified(!config.enableAttentionCheck);

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
            const config = getAdConfig();
            if (!config.enableAttentionCheck) {
              setCanClaim(true);
            }
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

    // Auto close modal smoothly after reward feedback and scroll to next unwatched video
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleVerifyAttention = () => {
    triggerHaptic('success');
    playAppSound('click');
    setAttentionVerified(true);
    setCanClaim(true);
  };

  const handleRequestClose = () => {
    if (timeLeft > 0 && !claimed) {
      triggerHaptic('warning');
      setShowExitWarning(true);
    } else {
      triggerHaptic('light');
      onClose();
    }
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

  const progress = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {isBn ? "ভিডিও ও স্পন্সর স্ট্রিম" : "Video & Sponsor Stream"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              High CPM
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
              onClick={handleRequestClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
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
              {canClaim ? 'সময় শেষ!' : `বাকি: ${timeLeft}s / ${totalDuration}s`}
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

          {/* Exit Warning Modal Dialog */}
          <AnimatePresence>
            {showExitWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 10 }}
                  className="bg-white rounded-2xl p-4 max-w-xs shadow-2xl border border-rose-200 space-y-2.5 text-slate-900 pointer-events-auto"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900">
                    {isBn ? "ভিডিও দেখা এখনও শেষ হয়নি!" : "Video is Not Finished!"}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isBn
                      ? `আর মাত্র ${timeLeft} সেকেন্ড বাকি! এখন বেরিয়ে গেলে রিওয়ার্ড ৳${video.reward.toFixed(2)} পাবেন না এবং একাউন্টের হাই-সিপিএম কমে যেতে পারে।`
                      : `Only ${timeLeft}s remaining! Exiting now forfeits your reward.`}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setShowExitWarning(false);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer"
                    >
                      {isBn ? "ভিডিও দেখা চালিয়ে যান (প্রস্তাবিত)" : "Continue Watching"}
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setShowExitWarning(false);
                        onClose();
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
                    >
                      {isBn ? "রিওয়ার্ড ছাড়াই বন্ধ করুন" : "Exit without reward"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1 flex-1">{video.title}</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex-shrink-0">
                <Eye className="w-3 h-3 text-indigo-600" />
                <span>{formatViews(video.viewCount ?? video.views, isBn)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? `হাই CPM নিশ্চিত করতে পুরো ${totalDuration} সেকেন্ড ভিডিও ও স্পন্সর উপভোগ করুন।`
                : `Watch full ${totalDuration}s video and sponsor to claim reward.`}
            </p>
          </div>

          {claimed ? (
            <div className="space-y-2">
              <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isBn
                    ? `পুরস্কার ${formatMoney(video.reward, currency)} সফলভাবে যোগ হয়েছে!`
                    : `Reward ${formatMoney(video.reward, currency)} added successfully!`}
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
                id="btn-next-video"
              >
                <span>{isBn ? 'পরবর্তী ভিডিও দেখুন 🎬' : 'Watch Next Video 🎬'}</span>
              </button>
            </div>
          ) : timeLeft === 0 && !canClaim && !attentionVerified && adConfig.enableAttentionCheck ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-black text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? "মনোযোগ যাচাই (High CPM Verification)" : "Attention Verification"}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {isBn
                  ? "ভিডিও এবং স্পন্সর প্রদর্শন শেষ হয়েছে। রিওয়ার্ড আনলক করতে নিচের বাটনে ট্যাপ করুন:"
                  : "Video completed. Tap the button below to unlock your reward:"}
              </p>
              <button
                onClick={handleVerifyAttention}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{isBn ? "আমি সম্পূর্ণ ভিডিও দেখেছি ✅ (আনলক করুন)" : "I watched the whole video ✅ (Unlock)"}</span>
              </button>
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
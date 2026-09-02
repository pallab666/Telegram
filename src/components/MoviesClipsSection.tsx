import React, { useRef } from 'react';
import { Film, SlidersHorizontal, ChevronLeft, ChevronRight, Play, Eye, Clock, Sparkles } from 'lucide-react';
import { VideoClip } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface MoviesClipsSectionProps {
  videos: VideoClip[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onWatchVideo: (video: VideoClip) => void;
}

export const MoviesClipsSection: React.FC<MoviesClipsSectionProps> = ({
  videos,
  selectedCategory,
  onSelectCategory,
  onWatchVideo,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'viral', label: 'Viral Video' },
    { id: 'marketing', label: 'marketing vi...' },
    { id: 'trailer', label: 'Movie Trailers' },
    { id: 'funny', label: 'Funny Clips' },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    triggerHaptic('light');
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const filteredVideos =
    selectedCategory === 'all'
      ? videos
      : videos.filter((v) => v.category === selectedCategory || (selectedCategory === 'marketing' && v.category === 'marketing'));

  return (
    <div className="px-4 py-2 space-y-3" id="section-movies-clips">
      {/* 1. Header: MOVIES & CLIPS */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Film className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-800 text-sm">
              Movies & Clips
            </span>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              ভিডিও দেখে ইনকাম করুন
            </span>
          </div>
        </div>

        <button
          onClick={() => triggerHaptic('light')}
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          id="btn-filter-clips"
          title="Filter Clips"
          aria-label="Filter Clips"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Category Carousel with Executive Slate Buttons */}
      <div className="flex items-center space-x-2">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
          id="btn-category-scroll-left"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable Pills */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectCategory(cat.id);
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-indigo-100'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
                }`}
                id={`btn-category-${cat.id}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
          id="btn-category-scroll-right"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Video Cards Stream */}
      <div className="space-y-3 pt-1">
        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading videos...</p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all hover:border-indigo-200 hover:shadow-md"
              id={`card-video-${video.id}`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Duration Badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border border-slate-700/50">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{video.duration}s</span>
                </div>

                {/* Reward Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>+৳{video.reward.toFixed(2)} BDT</span>
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onWatchVideo(video);
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-label={`Play ${video.title}`}
                  id={`btn-play-${video.id}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:scale-110 group-active:scale-95 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </button>

                {/* Video Info Bottom Overlay */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                    <span>{video.views} ভিউ</span>
                  </div>
                  {video.watched && (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ অর্জিত
                    </span>
                  )}
                </div>
              </div>

              {/* Title and Watch CTA */}
              <div className="p-3 flex items-center justify-between gap-2">
                <h4 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">
                  {video.title}
                </h4>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onWatchVideo(video);
                  }}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                  id={`btn-watch-earn-${video.id}`}
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>দেখুন</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

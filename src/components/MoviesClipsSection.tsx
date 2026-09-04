import React, { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Play, Film } from "lucide-react";
import { VideoClip } from "../types";
import { triggerHaptic } from "../utils/telegram";

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
    { id: "all", label: "All Videos" },
    { id: "movies", label: "Movies & Clips" },
    { id: "funny", label: "Funny Shorts" },
    { id: "music", label: "Music Videos" },
    { id: "gaming", label: "Gaming" },
    { id: "news", label: "Trending News" },
  ];

  const handleScroll = (direction: "left" | "right") => {
    triggerHaptic("light");
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const filteredVideos =
    selectedCategory === "all"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="px-4 py-2 space-y-4 pb-6"
      id="section-movies-clips"
    >
      {/* 1. Category Carousel */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleScroll("left")}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
        >
          <ChevronLeft className="w-4 h-4 stroke-[3]" />
        </button>

        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("light");
                  onSelectCategory(cat.id);
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-sm ${
                  isActive
                    ? "bg-[#8b5cf6] text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handleScroll("right")}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
        >
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* 2. Video Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {filteredVideos.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 text-center space-y-2 bg-white rounded-[1.5rem] border border-dashed border-slate-300 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Film className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              বর্তমানে কোনো ভিডিও নেই
            </p>
            <p className="text-[11px] text-slate-500 max-w-[240px]">
              অ্যাডমিন প্যানেল থেকে ভিডিও যুক্ত করা হলে এখানে সবাই দেখতে পাবে।
            </p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group relative overflow-hidden rounded-[1.5rem] bg-white shadow-sm border-[3px] border-black transition-transform active:scale-[0.98] cursor-pointer flex flex-col"
              onClick={() => {
                triggerHaptic("medium");
                onWatchVideo(video);
              }}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-slate-900 border-b-[3px] border-black overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />

                {/* Reward Badge */}
                <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  +৳{(video.reward || 3).toFixed(1)}
                </div>

                {video.watched && (
                  <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                    <span>✓ দেখা হয়েছে</span>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600 border-[3px] border-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title area */}
              <div className="bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] p-2.5 flex items-center justify-center flex-1">
                <h4 className="font-black text-[10px] text-center text-white leading-tight line-clamp-2 uppercase">
                  {video.title}
                </h4>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

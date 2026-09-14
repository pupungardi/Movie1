import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Star, Info, ChevronLeft, ChevronRight, Clock, Tv } from 'lucide-react';
import { MediaItem } from '../types';
import { formatMediaRuntime, formatCertification } from '../utils/formatters';

interface HeroBannerProps {
  featuredItems: MediaItem[];
  onSelectMedia: (media: MediaItem, autoPlayTrailer?: boolean) => void;
  onPlayMedia?: (media: MediaItem) => void;
  isSaved: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredItems,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  onToggleWatchlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate hero every 8 seconds if user doesn't interact
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  if (!featuredItems || featuredItems.length === 0) {
    return (
      <div className="relative w-full h-[420px] sm:h-[480px] overflow-hidden bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950" />
        <div className="relative z-10 text-center space-y-3 px-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs text-rose-400 border border-slate-800 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span>Fetching Live TMDB Feed...</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Discover Live Blockbusters & Acclaimed Series
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Connecting securely to The Movie Database (TMDB) for top-trending cinema and trailers.
          </p>
        </div>
      </div>
    );
  }

  const current = featuredItems[currentIndex];
  const saved = isSaved(current.id);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] overflow-hidden bg-slate-950">
      {/* Background Backdrop with Multi-layered Cinematic Gradients */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
        style={{ backgroundImage: `url(${current.backdropUrl})` }}
      >
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/40 to-slate-950" />
      </div>

      {/* Hero Content Container */}
      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          
          {/* Badges strip */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] shrink-0 whitespace-nowrap ${
                current.type === 'movie'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}
            >
              {current.type === 'movie' ? 'Feature Film' : 'TV Series'}
            </span>

            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/30 shrink-0 whitespace-nowrap">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{current.rating.toFixed(1)}</span>
            </span>

            <span className="text-slate-300 rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700 text-[11px] font-mono shrink-0 whitespace-nowrap">
              {formatCertification(current.certification, current.type)}
            </span>

            <span className="text-slate-300 rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700 text-[11px] shrink-0 whitespace-nowrap">
              {current.releaseYear}
            </span>

            <span className="flex items-center gap-1 text-slate-300 text-xs shrink-0 whitespace-nowrap">
              {current.type === 'tv' ? (
                <Tv className="h-3 w-3 text-slate-400 shrink-0" />
              ) : (
                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              )}
              <span>{formatMediaRuntime(current.runtime, current.type, current.seasonsCount)}</span>
            </span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
              {current.title}
            </h1>
            {current.tagline && (
              <p className="text-sm font-medium italic text-slate-300 sm:text-base">
                "{current.tagline}"
              </p>
            )}
          </div>

          {/* Overview text */}
          <p className="line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-xl">
            {current.overview}
          </p>

          {/* Genres pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {current.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Watch Trailer Button (Original Style) */}
            <button
              id="hero-play-trailer-btn"
              onClick={() => onSelectMedia(current, true)}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              Watch Trailer
            </button>

            {/* Play Now Button */}
            <button
              id="hero-play-now-btn"
              onClick={() => onPlayMedia ? onPlayMedia(current) : onSelectMedia(current, false)}
              className="flex items-center gap-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-rose-500 text-rose-500" />
              <span>{current.type === 'movie' ? 'Play Now' : 'Play Series'}</span>
            </button>

            <button
              id="hero-toggle-watchlist-btn"
              onClick={() => onToggleWatchlist(current.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border cursor-pointer ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add to Watchlist
                </>
              )}
            </button>

            <button
              id="hero-more-info-btn"
              onClick={() => onSelectMedia(current, false)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3.5 py-2.5 text-sm font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <Info className="h-4 w-4" />
              Details
            </button>
          </div>

        </div>
      </div>

      {/* Carousel Navigation Indicators & Chevrons */}
      <div className="absolute right-4 bottom-8 sm:right-8 z-10 flex items-center gap-2">
        <button
          onClick={prevSlide}
          aria-label="Previous featured title"
          className="rounded-full bg-slate-900/70 p-2 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {featuredItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-6 bg-rose-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          aria-label="Next featured title"
          className="rounded-full bg-slate-900/70 p-2 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Tv } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface SeriesViewProps {
  series: MediaItem[];
  onSelectMedia: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  isSaved: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  series,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20 md:pb-12">
      {/* Series Tab Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-500/30 mb-2">
          <Tv className="h-3.5 w-3.5" />
          <span>Television & Miniseries</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          TV Series & Shows
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Immerse in multi-episode story arcs, character journeys, and critically acclaimed series across major networks.
        </p>
      </div>

      {/* Series Grid */}
      {series.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <Tv className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="text-base font-semibold text-white">No series available</h3>
          <p className="text-xs text-slate-400">
            Check back later for newly added TV shows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {series.map((s) => (
            <MediaCard
              key={s.id}
              media={s}
              onSelect={onSelectMedia}
              onPlayMedia={onPlayMedia}
              isSaved={isSaved(s.id)}
              isFavorite={isFavorite(s.id)}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Film } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MovieViewProps {
  movies: MediaItem[];
  onSelectMedia: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem) => void;
  isSaved: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const MovieView: React.FC<MovieViewProps> = ({
  movies,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20 md:pb-12">
      {/* Movie Tab Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-500/30 mb-2">
          <Film className="h-3.5 w-3.5" />
          <span>Cinema Collection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Movies & Feature Films
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Browse timeless classics, sci-fi masterpieces, modern thrillers, and award-winning blockbusters.
        </p>
      </div>

      {/* Movies Grid */}
      {movies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <Film className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="text-base font-semibold text-white">No movies available</h3>
          <p className="text-xs text-slate-400">
            Check back later for newly added feature films.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {movies.map((movie) => (
            <MediaCard
              key={movie.id}
              media={movie}
              onSelect={onSelectMedia}
              onPlayMedia={onPlayMedia}
              isSaved={isSaved(movie.id)}
              isFavorite={isFavorite(movie.id)}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

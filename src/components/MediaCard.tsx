import React from 'react';
import { Star, Play, Plus, Check, Heart, Film, Tv, Clock } from 'lucide-react';
import { MediaItem } from '../types';
import { formatMediaRuntime } from '../utils/formatters';

interface MediaCardProps {
  media: MediaItem;
  onSelect: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem) => void;
  isSaved: boolean;
  isFavorite: boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onSelect,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
}) => {
  return (
    <div
      id={`media-card-${media.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-700 hover:shadow-xl hover:shadow-black/50"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => onSelect(media, false)}>
        <img
          src={media.posterUrl}
          alt={media.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
          {/* Type Badge */}
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
              media.type === 'movie'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                : 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
            }`}
          >
            {media.type === 'movie' ? (
              <>
                <Film className="h-2.5 w-2.5" />
                Movie
              </>
            ) : (
              <>
                <Tv className="h-2.5 w-2.5" />
                TV Show
              </>
            )}
          </span>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 rounded-md bg-slate-950/85 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-slate-800 backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{media.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Center Hover Action: Play Trailer Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(media, true);
            }}
            aria-label={`Watch trailer for ${media.title}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-950 hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all"
          >
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </button>
        </div>

        {/* Floating Quick Actions (Watchlist & Favorite) */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(media.id);
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-950/80 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(media.id);
            }}
            title={isSaved ? 'In watchlist' : 'Add to watchlist'}
            className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
              isSaved
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-950/80 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-900'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* Card Body Info */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div className="cursor-pointer" onClick={() => onSelect(media, false)}>
          <h3 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
            {media.title}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
            <span className="shrink-0">{media.releaseYear}</span>
            <span className="text-slate-600 shrink-0">•</span>
            <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
              {media.type === 'tv' ? (
                <Tv className="h-2.5 w-2.5 text-slate-500 shrink-0" />
              ) : (
                <Clock className="h-2.5 w-2.5 text-slate-500 shrink-0" />
              )}
              <span className="whitespace-nowrap">{formatMediaRuntime(media.runtime, media.type, media.seasonsCount)}</span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {media.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400"
              >
                {genre}
              </span>
            ))}
            {media.genres.length > 2 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{media.genres.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

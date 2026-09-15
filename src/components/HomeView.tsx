import React from 'react';
import { HeroBanner } from './HeroBanner';
import { MediaCard } from './MediaCard';
import { MediaItem, WatchlistItem, AppTab } from '../types';
import { TrendingUp, Film, Tv, Flame, ChevronRight, Play, Star } from 'lucide-react';
import { formatMediaRuntime } from '../utils/formatters';

interface HomeViewProps {
  featuredItems: MediaItem[];
  allMedia: MediaItem[];
  watchlistItems: WatchlistItem[];
  onSelectMedia: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  isSaved: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenSurpriseMe: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  featuredItems,
  allMedia,
  watchlistItems,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
  onNavigateTab,
  onOpenSurpriseMe,
}) => {
  // Top 10 sorted by rating & vote weight
  const top10Items = [...allMedia]
    .sort((a, b) => {
      const voteA = String(a.voteCount || '0').endsWith('K') ? parseFloat(a.voteCount) * 1000 : parseFloat(a.voteCount || '0');
      const voteB = String(b.voteCount || '0').endsWith('K') ? parseFloat(b.voteCount) * 1000 : parseFloat(b.voteCount || '0');
      return (b.rating * (voteB || 1)) - (a.rating * (voteA || 1));
    })
    .slice(0, 8);

  // Trending Movies
  const popularMovies = allMedia.filter((m) => m.type === 'movie').slice(0, 6);

  // Acclaimed Series
  const acclaimedSeries = allMedia.filter((m) => m.type === 'tv').slice(0, 6);

  // Recent in-progress or planned from user library
  const continueWatchingMedia = watchlistItems
    .slice(0, 4)
    .map((item) => item.cachedMedia || allMedia.find((m) => m.id === item.mediaId))
    .filter(Boolean) as MediaItem[];

  return (
    <div className="space-y-10 pb-20 md:pb-12">
      {/* Spotlight Carousel */}
      <HeroBanner
        featuredItems={featuredItems}
        onSelectMedia={onSelectMedia}
        onPlayMedia={onPlayMedia}
        isSaved={isSaved}
        onToggleWatchlist={onToggleWatchlist}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Continue Watching / In Your Watchlist (if user has items) */}
        {continueWatchingMedia.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Continue Watching & Watchlist
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('AKUN')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <span>View All ({watchlistItems.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {continueWatchingMedia.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onSelect={onSelectMedia}
                  onPlayMedia={onPlayMedia}
                  isSaved={isSaved(media.id)}
                  isFavorite={isFavorite(media.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {/* Top 10 Ranked Strip */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Flame className="h-6 w-6 text-rose-500" />
                Top 8 Ranked This Week
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Highest rated cinema and binge-worthy television right now
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {top10Items.map((media, index) => {
              const rank = index + 1;
              const rankColor =
                rank === 1
                  ? 'text-amber-400'
                  : rank === 2
                  ? 'text-slate-300'
                  : rank === 3
                  ? 'text-amber-600'
                  : 'text-slate-600 group-hover:text-rose-400';

              return (
                <div
                  key={media.id}
                  id={`top-ranked-item-${rank}`}
                  onClick={() => onSelectMedia(media)}
                  className="group relative flex items-center overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 p-3 hover:border-slate-700 hover:bg-slate-900 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40"
                >
                  {/* Stylized Rank Number */}
                  <div
                    className={`flex items-center justify-center w-10 sm:w-11 text-2xl sm:text-3xl font-black font-mono select-none flex-shrink-0 transition-colors ${rankColor}`}
                  >
                    #{rank}
                  </div>

                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[2/3] w-16 sm:w-18 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 shadow-md">
                    <img
                      src={media.posterUrl}
                      alt={media.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Metadata and Details */}
                  <div className="flex flex-1 min-w-0 flex-col justify-between pl-3 py-0.5 space-y-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.2 ${
                            media.type === 'movie'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                              : 'bg-sky-950/80 text-sky-300 border border-sky-800/80'
                          }`}
                        >
                          {media.type === 'movie' ? 'Movie' : 'Series'}
                        </span>
                        {media.genres[0] && (
                          <span className="text-[10px] text-slate-400">
                            {media.genres[0]}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1 line-clamp-1 group-hover:text-rose-400 transition-colors">
                        {media.title}
                      </h3>

                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {media.releaseYear} • {formatMediaRuntime(media.runtime, media.type, media.seasonsCount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{media.rating.toFixed(1)}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          ({media.voteCount})
                        </span>
                      </div>

                      {media.streamingPlatforms &&
                        media.streamingPlatforms.filter((p) => !p.name.toLowerCase().includes('with ads')).length > 0 && (
                          <span
                            className={`text-[9px] font-medium text-white px-1.5 py-0.2 rounded ${
                              media.streamingPlatforms.filter((p) => !p.name.toLowerCase().includes('with ads'))[0].badgeColor
                            }`}
                          >
                            {media.streamingPlatforms.filter((p) => !p.name.toLowerCase().includes('with ads'))[0].name}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Popular Movies Row */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Film className="h-5 w-5 text-rose-500" />
                Trending Movies
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cinematic blockbusters, award winners, and visionary direction
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('MOVIE')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>Explore All Movies</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
            {popularMovies.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onSelect={onSelectMedia}
                onPlayMedia={onPlayMedia}
                isSaved={isSaved(media.id)}
                isFavorite={isFavorite(media.id)}
                onToggleWatchlist={onToggleWatchlist}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>

        {/* Acclaimed TV Series Row */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Tv className="h-5 w-5 text-sky-400" />
                Acclaimed TV Series
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-season epics, gripping prestige dramas, and comedy hits
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('SERIES')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>Explore All Series</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
            {acclaimedSeries.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onSelect={onSelectMedia}
                onPlayMedia={onPlayMedia}
                isSaved={isSaved(media.id)}
                isFavorite={isFavorite(media.id)}
                onToggleWatchlist={onToggleWatchlist}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

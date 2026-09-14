import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Heart,
  Star,
  Film,
  Tv,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { WatchlistItem, WatchStatus, MediaItem } from '../types';
import { MEDIA_DATA } from '../data/mediaData';
import { formatMediaRuntime } from '../utils/formatters';

interface LibraryViewProps {
  watchlistItems: WatchlistItem[];
  onSelectMedia: (media: MediaItem) => void;
  onToggleWatchlist: (id: string) => void;
  onSetWatchStatus: (id: string, status: WatchStatus) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateToBrowse: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  watchlistItems,
  onSelectMedia,
  onToggleWatchlist,
  onSetWatchStatus,
  onToggleFavorite,
  onNavigateToBrowse,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'want_to_watch' | 'currently_watching' | 'watched' | 'favorites'>('all');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  // Map watchlist entries to full MediaItem models
  const enrichedItems = useMemo(() => {
    return watchlistItems
      .map((entry) => {
        const media = MEDIA_DATA.find((m) => m.id === entry.mediaId);
        if (!media) return null;
        return {
          ...entry,
          media,
        };
      })
      .filter(Boolean) as (WatchlistItem & { media: MediaItem })[];
  }, [watchlistItems]);

  // Calculate high-level stats
  const stats = useMemo(() => {
    const total = enrichedItems.length;
    const moviesCount = enrichedItems.filter((i) => i.media.type === 'movie').length;
    const tvCount = enrichedItems.filter((i) => i.media.type === 'tv').length;
    const completedCount = enrichedItems.filter((i) => i.status === 'watched').length;
    
    // Total episodes watched
    let totalEpisodesWatched = 0;
    enrichedItems.forEach((item) => {
      if (item.watchedEpisodes) {
        totalEpisodesWatched += Object.values(item.watchedEpisodes).filter(Boolean).length;
      }
    });

    // Average user rating
    const ratedItems = enrichedItems.filter((i) => i.userRating && i.userRating > 0);
    const avgRating =
      ratedItems.length > 0
        ? (ratedItems.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedItems.length).toFixed(1)
        : null;

    return { total, moviesCount, tvCount, completedCount, totalEpisodesWatched, avgRating };
  }, [enrichedItems]);

  // Filter items based on active sub-tab and media type
  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      // Sub-tab filter
      if (activeSubTab === 'favorites' && !item.favorite) return false;
      if (activeSubTab === 'want_to_watch' && item.status !== 'want_to_watch') return false;
      if (activeSubTab === 'currently_watching' && item.status !== 'currently_watching') return false;
      if (activeSubTab === 'watched' && item.status !== 'watched') return false;

      // Media type filter
      if (filterType !== 'all' && item.media.type !== filterType) return false;

      return true;
    });
  }, [enrichedItems, activeSubTab, filterType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Library Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bookmark className="h-7 w-7 text-rose-500" />
            My Watchlist & Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your progress, view rated favorites, and organize what to watch next.
          </p>
        </div>

        <button
          onClick={onNavigateToBrowse}
          className="self-start sm:self-auto rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
        >
          <span>Explore More Titles</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Library Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Saved</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.total}</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Movies</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">{stats.moviesCount}</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">TV Series</span>
          <span className="text-2xl font-bold text-sky-400 mt-1 block">{stats.tvCount}</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Completed</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{stats.completedCount}</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Episodes Watched</span>
          <span className="text-2xl font-bold text-cyan-400 mt-1 block">{stats.totalEpisodesWatched}</span>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Avg Your Rating</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {stats.avgRating ? `★ ${stats.avgRating}` : '—'}
          </span>
        </div>
      </div>

      {/* Tabs & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Status Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({stats.total})
          </button>

          <button
            onClick={() => setActiveSubTab('want_to_watch')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'want_to_watch'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Plan to Watch
          </button>

          <button
            onClick={() => setActiveSubTab('currently_watching')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'currently_watching'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Currently Watching
          </button>

          <button
            onClick={() => setActiveSubTab('watched')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'watched'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'favorites'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            Favorites
          </button>
        </div>

        {/* Media Type Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterType === 'movie' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setFilterType('tv')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterType === 'tv' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400'
            }`}
          >
            Series
          </button>
        </div>
      </div>

      {/* Library Items List / Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-500">
            <Bookmark className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No titles in this section</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start building your collection by browsing trending movies and TV series, or tap the bookmark icon on any title.
            </p>
          </div>
          <button
            onClick={onNavigateToBrowse}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-all"
          >
            Browse Trending Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const media = item.media;
            const watchedCount = item.watchedEpisodes ? Object.values(item.watchedEpisodes).filter(Boolean).length : 0;

            return (
              <div
                key={item.mediaId}
                className="group relative flex overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {/* Poster on left */}
                <div
                  className="relative w-28 sm:w-32 flex-shrink-0 cursor-pointer overflow-hidden bg-slate-950"
                  onClick={() => onSelectMedia(media)}
                >
                  <img
                    src={media.posterUrl}
                    alt={media.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                        media.type === 'movie'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          : 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {media.type === 'movie' ? 'Movie' : 'TV'}
                    </span>
                  </div>
                </div>

                {/* Content on right */}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3
                        onClick={() => onSelectMedia(media)}
                        className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {media.title}
                      </h3>

                      <button
                        onClick={() => onToggleFavorite(media.id)}
                        title={item.favorite ? 'Favorited' : 'Add to favorites'}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <Heart className={`h-4 w-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{media.releaseYear}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">★ {media.rating.toFixed(1)}</span>
                      <span>•</span>
                      <span>{formatMediaRuntime(media.runtime, media.type, media.seasonsCount)}</span>
                    </div>

                    {/* Status Pill / Dropdown */}
                    <div className="pt-1">
                      <select
                        value={item.status}
                        onChange={(e) => onSetWatchStatus(media.id, e.target.value as WatchStatus)}
                        className="rounded-md bg-slate-950 text-[11px] text-slate-300 px-2 py-0.5 border border-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="want_to_watch">Plan to Watch</option>
                        <option value="currently_watching">Currently Watching</option>
                        <option value="watched">Completed</option>
                      </select>
                    </div>

                    {/* TV Progress if TV */}
                    {media.type === 'tv' && media.episodesCount && (
                      <div className="pt-1 text-[11px] text-slate-400">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Episodes</span>
                          <span>{watchedCount} / {media.episodesCount}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (watchedCount / (media.episodesCount || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* User Rating badge if rated */}
                    {item.userRating && (
                      <div className="text-[11px] text-amber-300 flex items-center gap-1 font-semibold pt-0.5">
                        <span>Your Rating:</span>
                        <span>★ {item.userRating}/10</span>
                      </div>
                    )}

                    {/* Review Snippet */}
                    {item.userReview && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">
                        "{item.userReview}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2">
                    <button
                      onClick={() => onSelectMedia(media)}
                      className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View Details
                    </button>

                    <button
                      onClick={() => onToggleWatchlist(media.id)}
                      title="Remove from library"
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { searchTmdb } from '../services/tmdb';

interface SearchViewProps {
  allMedia: MediaItem[];
  onSelectMedia: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  isSaved: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  allMedia,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
}) => {
  const [query, setQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<MediaItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Live TMDB search debounced
  useEffect(() => {
    if (!query.trim()) {
      setTmdbResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchTmdb(query, 'all');
        if (res.results && res.results.length > 0) {
          setTmdbResults(res.results);
        } else {
          setTmdbResults([]);
        }
      } catch (e) {
        console.error('TMDB live search error, fallback to local pool', e);
        setTmdbResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const searchResults = useMemo(() => {
    // If no search query is typed, do not display default cards
    if (!query.trim()) {
      return [];
    }

    // If TMDB search has returned results
    if (tmdbResults !== null) {
      return tmdbResults;
    }

    // Default: filter allMedia
    const q = query.toLowerCase().trim();
    return allMedia.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inDirector = item.director.toLowerCase().includes(q);
      const inCast = item.cast.some((c) => c.name.toLowerCase().includes(q));
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const inGenres = item.genres.some((g) => g.toLowerCase().includes(q));
      const inOverview = item.overview.toLowerCase().includes(q);

      return inTitle || inDirector || inCast || inTags || inGenres || inOverview;
    });
  }, [allMedia, query, tmdbResults]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20 md:pb-12">
      {/* Search Header & Input */}
      <div className="max-w-3xl mx-auto space-y-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Search Movies & Series
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Find any title, director, actor, genre, or keyword across our entire streaming catalog.
        </p>

        {/* Big Search Bar */}
        <div className="relative pt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, director, actor (e.g. 'Timothée Chalamet', 'Inception')..."
              autoFocus
              className="w-full rounded-2xl bg-slate-900/90 pl-12 pr-12 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 border border-slate-700/80 shadow-xl shadow-black/40 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all"
            />
            {isSearching ? (
              <div className="absolute right-4 flex h-6 w-6 items-center justify-center text-rose-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search Results Display */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {searchResults.map((media) => (
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
      )}
    </div>
  );
};

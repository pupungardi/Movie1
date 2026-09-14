import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Sparkles, Film, Tv, SlidersHorizontal, TrendingUp, Loader2 } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { MediaCard } from './MediaCard';
import { ALL_GENRES } from '../data/mediaData';
import { searchTmdb } from '../services/tmdb';

interface SearchViewProps {
  allMedia: MediaItem[];
  onSelectMedia: (media: MediaItem, openTrailer?: boolean, initialTab?: 'overview' | 'episodes' | 'review') => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  isSaved: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCineAI: () => void;
}

const POPULAR_SEARCHES = [
  'Dune',
  'Severance',
  'Christopher Nolan',
  'Sci-Fi',
  'Breaking Bad',
  'Anime',
  'Mystery',
  'Denis Villeneuve',
  'Oppenheimer',
  'Arcane',
  'Crime',
];

export const SearchView: React.FC<SearchViewProps> = ({
  allMedia,
  onSelectMedia,
  onPlayMedia,
  isSaved,
  isFavorite,
  onToggleWatchlist,
  onToggleFavorite,
  onOpenCineAI,
}) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
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
        const res = await searchTmdb(query, typeFilter);
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
  }, [query, typeFilter]);

  const searchResults = useMemo(() => {
    // If TMDB search has returned results
    if (query.trim() && tmdbResults !== null) {
      if (selectedGenre === 'All') return tmdbResults;
      return tmdbResults.filter((item) => item.genres.includes(selectedGenre));
    }

    // Default: filter allMedia
    return allMedia.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Genre filter
      if (selectedGenre !== 'All' && !item.genres.includes(selectedGenre)) return false;

      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDirector = item.director.toLowerCase().includes(q);
        const inCast = item.cast.some((c) => c.name.toLowerCase().includes(q));
        const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const inGenres = item.genres.some((g) => g.toLowerCase().includes(q));
        const inOverview = item.overview.toLowerCase().includes(q);

        return inTitle || inDirector || inCast || inTags || inGenres || inOverview;
      }

      return true;
    });
  }, [allMedia, query, typeFilter, selectedGenre, tmdbResults]);

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

        {/* Popular Trending Search Chips */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Popular:
          </span>
          {POPULAR_SEARCHES.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              typeFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setTypeFilter('movie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              typeFilter === 'movie' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            <Film className="h-3 w-3" />
            Movies
          </button>
          <button
            onClick={() => setTypeFilter('tv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              typeFilter === 'tv' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            <Tv className="h-3 w-3" />
            Series
          </button>
        </div>

        {/* Genre Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Genre:</span>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white border border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="All">All Genres</option>
            {ALL_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Results Counter */}
        <span className="text-xs text-slate-400 font-medium">
          Found <strong className="text-white">{searchResults.length}</strong> matching titles
        </span>
      </div>

      {/* Search Results Display */}
      {searchResults.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-500">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              No results found for "{query}"
            </h3>
            <p className="text-xs text-slate-400">
              Try checking for spelling errors, using simpler keywords, or asking our AI recommendation concierge.
            </p>
          </div>

          <button
            onClick={onOpenCineAI}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-500 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask CineAI Concierge</span>
          </button>
        </div>
      ) : (
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

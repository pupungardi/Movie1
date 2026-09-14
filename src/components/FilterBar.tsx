import React from 'react';
import { Filter, SlidersHorizontal, Star, Film, Tv, Sparkles, X } from 'lucide-react';
import { MediaType, FilterState } from '../types';
import { ALL_GENRES, STREAMING_SERVICES } from '../data/mediaData';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  totalCount,
}) => {
  const hasActiveFilters =
    filter.genre !== 'All' ||
    filter.minRating > 0 ||
    filter.streamingProvider !== 'All' ||
    filter.searchQuery !== '';

  const resetFilters = () => {
    setFilter((prev) => ({
      ...prev,
      genre: 'All',
      minRating: 0,
      streamingProvider: 'All',
      searchQuery: '',
    }));
  };

  return (
    <div className="w-full space-y-3 pb-4 pt-2">
      {/* Top Filter Controls: Type Selector, Sort, Rating, Streaming, Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        
        {/* Type Toggle Tabs */}
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setFilter((prev) => ({ ...prev, type: 'all' }))}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.type === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Titles
          </button>
          <button
            onClick={() => setFilter((prev) => ({ ...prev, type: 'movie' }))}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.type === 'movie'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="h-3 w-3" />
            Movies
          </button>
          <button
            onClick={() => setFilter((prev) => ({ ...prev, type: 'tv' }))}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.type === 'tv'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="h-3 w-3" />
            TV Series
          </button>
        </div>

        {/* Right side controls: Sorting, Rating Filter, Streaming Platform */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Min Rating Selector */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-slate-300">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <select
              value={filter.minRating}
              onChange={(e) => setFilter((prev) => ({ ...prev, minRating: Number(e.target.value) }))}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900 text-white">Any Rating</option>
              <option value={8.0} className="bg-slate-900 text-white">8.0+ Stars</option>
              <option value={8.5} className="bg-slate-900 text-white">8.5+ Stars</option>
              <option value={8.8} className="bg-slate-900 text-white">8.8+ Top Tier</option>
            </select>
          </div>

          {/* Streaming Platform Filter */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-slate-300">
            <span className="text-slate-400">Stream:</span>
            <select
              value={filter.streamingProvider}
              onChange={(e) => setFilter((prev) => ({ ...prev, streamingProvider: e.target.value }))}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {STREAMING_SERVICES.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="popularity" className="bg-slate-900 text-white">Most Popular</option>
              <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
              <option value="newest" className="bg-slate-900 text-white">Newest First</option>
              <option value="title" className="bg-slate-900 text-white">Title A-Z</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}

          {/* Count Badge */}
          <span className="text-slate-500 ml-1">
            ({totalCount} {totalCount === 1 ? 'title' : 'titles'})
          </span>

        </div>

      </div>

      {/* Genre Filter Scrollable Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        {ALL_GENRES.map((g) => {
          const isSelected = filter.genre === g;
          return (
            <button
              key={g}
              onClick={() => setFilter((prev) => ({ ...prev, genre: g }))}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-950/50'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
};

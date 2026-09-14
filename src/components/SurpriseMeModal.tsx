import React, { useState } from 'react';
import { X, Dices, Play, Star, Sparkles, RefreshCw, Film, Tv, ArrowRight } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { ALL_GENRES } from '../data/mediaData';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMedia?: MediaItem[];
  onSelectMedia: (media: MediaItem, playTrailer?: boolean) => void;
}

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({
  isOpen,
  onClose,
  allMedia = [],
  onSelectMedia,
}) => {
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [pickedItem, setPickedItem] = useState<MediaItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const handleSpin = () => {
    setIsSpinning(true);

    // Filter available pool
    const pool = (allMedia || []).filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedGenre !== 'All' && !item.genres.includes(selectedGenre)) return false;
      return true;
    });

    const candidatePool = pool.length > 0 ? pool : allMedia;
    if (candidatePool.length === 0) {
      setIsSpinning(false);
      return;
    }

    let iterations = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * candidatePool.length);
      setPickedItem(candidatePool[randomIndex]);
      iterations++;

      if (iterations >= 12) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title & Description */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Dices className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Can't Decide What to Watch?
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set your mood or format, spin the reel, and let serendipity pick your next movie or TV show.
          </p>
        </div>

        {/* Preferences controls */}
        <div className="space-y-3 rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Format:</span>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Any
              </button>
              <button
                onClick={() => setSelectedType('movie')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedType === 'movie' ? 'bg-rose-600 text-white' : 'text-slate-400'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setSelectedType('tv')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedType === 'tv' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                TV Series
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-slate-200 border border-slate-800 focus:outline-none cursor-pointer"
            >
              {ALL_GENRES.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Picked Result Display */}
        {pickedItem ? (
          <div className={`rounded-2xl border p-4 transition-all ${
            isSpinning
              ? 'border-amber-500/40 bg-amber-950/10'
              : 'border-slate-800 bg-slate-950/70 shadow-lg'
          }`}>
            <div className="flex items-center gap-3.5">
              <img
                src={pickedItem.posterUrl}
                alt={pickedItem.title}
                className="h-24 w-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
              />
              <div className="flex-1 space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      pickedItem.type === 'movie'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-sky-950 text-sky-300 border border-sky-800'
                    }`}
                  >
                    {pickedItem.type === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
                  <span className="text-[11px] text-slate-400">{pickedItem.releaseYear}</span>
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {pickedItem.rating.toFixed(1)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white truncate">
                  {pickedItem.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {pickedItem.overview}
                </p>
              </div>
            </div>

            {!isSpinning && (
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    onClose();
                    onSelectMedia(pickedItem, true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-all"
                >
                  <Play className="h-3 w-3 fill-white" />
                  Watch Trailer
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onSelectMedia(pickedItem, false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <span>Open Full Details</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Spin CTA */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-950/50 hover:bg-amber-400 active:scale-98 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Spinning Reel...' : pickedItem ? 'Spin Again' : 'Spin the Reel!'}</span>
        </button>
      </div>
    </div>
  );
};

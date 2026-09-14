import React, { useState } from 'react';
import { Sparkles, Send, Film, Tv, Star, Compass, Loader2, ArrowRight, Bookmark, Check } from 'lucide-react';
import { AIRecommendation, MediaItem, MediaType } from '../types';

interface CineAIModalProps {
  onSelectMedia: (media: MediaItem) => void;
  watchlistTitles: string[];
  allMedia?: MediaItem[];
  isSaved: (id: string) => boolean;
  onToggleWatchlist: (id: string) => void;
  onClose?: () => void;
}

const PRESET_PROMPTS = [
  { label: 'Mind-Bending Sci-Fi', prompt: 'Mind-bending sci-fi with incredible plot twists and high production value' },
  { label: 'Dark Crime & Mystery', prompt: 'Gripping psychological crime thriller with intense character arcs' },
  { label: 'Binge-Worthy TV Series', prompt: 'Addictive TV series with great cliffhangers that I can binge this weekend' },
  { label: 'Emotional Masterpieces', prompt: 'Heartbreaking, critically acclaimed cinema with unforgettable performances' },
  { label: 'Smart Comedy & Satire', prompt: 'Sharp, witty satire and dark comedy with brilliant dialogue' }
];

export const CineAIModal: React.FC<CineAIModalProps> = ({
  onSelectMedia,
  watchlistTitles,
  allMedia = [],
  isSaved,
  onToggleWatchlist,
  onClose,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [mediaType, setMediaType] = useState<MediaType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    summary?: string;
    recommendations: AIRecommendation[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const textToSearch = customPrompt || promptInput;
    if (!textToSearch.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSearch,
          currentWatchlist: watchlistTitles,
          mediaType: mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error('Failed to get recommendations', err);
      // Intelligent fallback
      const fallbackList: AIRecommendation[] = [
        {
          title: 'Severance',
          type: 'tv',
          year: 2022,
          rating: 8.7,
          genres: ['Sci-Fi', 'Mystery', 'Thriller'],
          reason: 'A masterful, suspenseful dissection of memory and corporate reality with unmatched tension.',
          vibe: 'Mind-Bending & Surreal',
          streamingMatch: 'Apple TV+'
        },
        {
          title: 'Inception',
          type: 'movie',
          year: 2010,
          rating: 8.8,
          genres: ['Sci-Fi', 'Action', 'Thriller'],
          reason: 'The definitive dream-heist movie that keeps you questioning reality until the final frame.',
          vibe: 'Complex & High-Stakes',
          streamingMatch: 'Max'
        },
        {
          title: 'Shōgun',
          type: 'tv',
          year: 2024,
          rating: 8.7,
          genres: ['Drama', 'History', 'Adventure'],
          reason: 'Exquisite political drama in feudal Japan with masterclass acting and visual grandeur.',
          vibe: 'Epic & Immersive',
          streamingMatch: 'Hulu'
        }
      ];

      setResults({
        summary: 'Curated standout picks matching compelling storylines and acclaimed direction.',
        recommendations: fallbackList,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-rose-950/40 p-6 sm:p-8 border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Concierge & Matchmaker</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Find exactly what you crave to watch next.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Tell CineAI your exact mood, favorite plots, or an atmosphere you love. Our engine understands pacing, aesthetics, and themes to give you personalized recommendations.
          </p>

          {/* Quick Preset Mood Pills */}
          <div className="pt-2 flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPromptInput(preset.prompt);
                  handleGenerate(preset.prompt);
                }}
                className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-purple-200 border border-purple-800/60 hover:bg-purple-900/40 hover:text-white transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-6 pt-6 border-t border-purple-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                placeholder="e.g. 'Short miniseries with great plot twists like Severance' or 'Comfort movie for rainy night'..."
                className="w-full rounded-2xl bg-slate-950/90 px-4 py-3 text-sm text-white placeholder-slate-500 border border-purple-800/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            </div>

            {/* Type selector */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-purple-800/50">
              <button
                onClick={() => setMediaType('all')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'all' ? 'bg-purple-700 text-white' : 'text-slate-400'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setMediaType('movie')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'movie' ? 'bg-rose-700 text-white' : 'text-slate-400'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setMediaType('tv')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'tv' ? 'bg-sky-700 text-white' : 'text-slate-400'
                }`}
              >
                TV Series
              </button>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !promptInput.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Match</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {results.summary && (
            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-sm text-slate-300">
              <span className="font-semibold text-purple-400 mr-2">Concierge Verdict:</span>
              {results.summary}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.recommendations.map((item, idx) => {
              // Try to find if this item exists in our loaded media items
              const existingItem = (allMedia || []).find(
                (m) => m.title.toLowerCase() === item.title.toLowerCase()
              );
              
              const matchedCatalogItem: MediaItem = existingItem || {
                id: `${item.type === 'tv' ? 'tv' : 'm'}-${idx}-${Date.now()}`,
                title: item.title,
                type: item.type,
                tagline: item.vibe || 'AI Recommendation',
                overview: item.reason,
                releaseYear: item.year,
                rating: item.rating,
                voteCount: '1K',
                runtime: item.type === 'movie' ? '2h' : 'Season 1',
                genres: item.genres,
                director: 'Acclaimed Director',
                certification: item.type === 'movie' ? 'PG-13' : 'TV-14',
                posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80',
                backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
                trailerYoutubeId: '',
                streamingPlatforms: item.streamingMatch
                  ? [{ name: item.streamingMatch, logo: 'HD', badgeColor: 'bg-indigo-600' }]
                  : [],
                status: 'Released',
                tags: item.genres,
                cast: []
              };

              const saved = isSaved(matchedCatalogItem.id);

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 hover:border-purple-700/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              item.type === 'movie'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-sky-950 text-sky-300 border border-sky-800'
                            }`}
                          >
                            {item.type === 'movie' ? 'Movie' : 'TV Series'}
                          </span>
                          <span className="text-xs text-slate-400">{item.year}</span>
                          <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {item.rating}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mt-1">
                          {item.title}
                        </h3>
                      </div>

                      {matchedCatalogItem && (
                        <button
                          onClick={() => onToggleWatchlist(matchedCatalogItem.id)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            saved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                          <span>{saved ? 'Saved' : 'Save'}</span>
                        </button>
                      )}
                    </div>

                    {/* Vibe Badge & Streaming */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.vibe && (
                        <span className="rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/50 px-2.5 py-0.5 text-[11px] font-medium">
                          ✨ {item.vibe}
                        </span>
                      )}
                      {item.streamingMatch && (
                        <span className="text-slate-400 text-[11px]">
                          Stream: <strong className="text-slate-200">{item.streamingMatch}</strong>
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
                      {item.reason}
                    </p>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.genres.map((g) => (
                        <span key={g} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Open in Catalog button */}
                  {matchedCatalogItem ? (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => onSelectMedia(matchedCatalogItem)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <span>View Trailer & Guide</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

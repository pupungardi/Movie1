import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Star,
  Plus,
  Check,
  Heart,
  Clock,
  Calendar,
  Share2,
  Tv,
  Film,
  Users,
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { MediaItem, WatchStatus, Season, Episode } from '../types';
import { fetchTmdbSeason } from '../services/tmdb';
import { formatMediaRuntime, formatCertification } from '../utils/formatters';

interface MediaModalProps {
  media: MediaItem | null;
  onClose: () => void;
  allMedia?: MediaItem[];
  isSaved: boolean;
  isFavorite: boolean;
  userRating?: number;
  userReview?: string;
  watchedEpisodes?: Record<string, boolean>;
  onToggleWatchlist: (id: string, status?: WatchStatus) => void;
  onSetWatchStatus: (id: string, status: WatchStatus) => void;
  onToggleFavorite: (id: string) => void;
  onSetUserRating?: (id: string, rating: number) => void;
  onSetUserReview?: (id: string, review: string) => void;
  onToggleEpisodeWatched?: (id: string, season: number, episode: number) => void;
  onMarkAllEpisodesWatched?: (id: string, season: number, episodeNumbers: number[], markWatched?: boolean) => void;
  onSelectRelated: (media: MediaItem) => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  initialTrailerOpen?: boolean;
  initialTab?: 'overview' | 'episodes' | 'review';
}

export const MediaModal: React.FC<MediaModalProps> = ({
  media,
  onClose,
  allMedia = [],
  isSaved,
  isFavorite,
  watchedEpisodes = {},
  onToggleWatchlist,
  onSetWatchStatus,
  onToggleFavorite,
  onToggleEpisodeWatched,
  onMarkAllEpisodesWatched,
  onSelectRelated,
  onPlayMedia,
  initialTrailerOpen = false,
}) => {
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(initialTrailerOpen);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [copied, setCopied] = useState(false);
  const [seasonsCache, setSeasonsCache] = useState<Record<number, Season>>({});
  const [isLoadingSeason, setIsLoadingSeason] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState('');
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

  // Sync state when media changes
  useEffect(() => {
    setIsPlayingTrailer(initialTrailerOpen);
    setSelectedSeason(1);
    setEpisodeFilter('');
    setExpandedEpisode(null);

    // Initialize seasons cache with any seasons currently provided on media
    if (media && media.type === 'tv' && media.seasons) {
      const initialMap: Record<number, Season> = {};
      media.seasons.forEach((s) => {
        initialMap[s.seasonNumber] = s;
      });
      setSeasonsCache(initialMap);
    } else {
      setSeasonsCache({});
    }
  }, [media?.id, initialTrailerOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (media) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [media, onClose]);

  // Available seasons list
  const availableSeasons: Season[] = useMemo(() => {
    if (!media || media.type !== 'tv') return [];
    if (media.seasons && media.seasons.length > 0) {
      return media.seasons;
    }
    const count = media.seasonsCount || 1;
    const list: Season[] = [];
    for (let i = 1; i <= count; i++) {
      list.push({
        seasonNumber: i,
        name: `Season ${i}`,
        episodes: [],
      });
    }
    return list;
  }, [media]);

  // Fetch real episodes for the selected season dynamically
  useEffect(() => {
    if (!media || media.type !== 'tv') return;

    const cached = seasonsCache[selectedSeason];
    const hasDetailedEpisodes =
      cached &&
      cached.episodes &&
      cached.episodes.length > 0 &&
      cached.episodes.some((ep) => !ep.title.endsWith('Premiere') && !ep.title.startsWith('Episode '));

    if (!hasDetailedEpisodes) {
      setIsLoadingSeason(true);
      fetchTmdbSeason(media.id, selectedSeason)
        .then((fetchedSeason) => {
          if (fetchedSeason && fetchedSeason.episodes && fetchedSeason.episodes.length > 0) {
            setSeasonsCache((prev) => ({
              ...prev,
              [selectedSeason]: fetchedSeason,
            }));
          }
        })
        .catch((err) => {
          console.warn(`Could not fetch episodes for Season ${selectedSeason}:`, err);
        })
        .finally(() => {
          setIsLoadingSeason(false);
        });
    }
  }, [media?.id, selectedSeason, media?.type]);

  // Current active season data
  const currentSeasonData: Season = useMemo(() => {
    if (seasonsCache[selectedSeason]) {
      return seasonsCache[selectedSeason];
    }
    const fromMedia = media?.seasons?.find((s) => s.seasonNumber === selectedSeason);
    if (fromMedia && fromMedia.episodes && fromMedia.episodes.length > 0) {
      return fromMedia;
    }
    const epCount =
      media?.episodesCount && media?.seasonsCount
        ? Math.max(4, Math.round(media.episodesCount / media.seasonsCount))
        : 8;
    const fallbackEpisodes: Episode[] = [];
    for (let i = 1; i <= epCount; i++) {
      fallbackEpisodes.push({
        episodeNumber: i,
        title: i === 1 ? `Season ${selectedSeason} Premiere` : `Episode ${i}`,
        overview: `Episode ${i} of ${media?.title || 'TV Series'} Season ${selectedSeason}.`,
        duration: '45m',
        stillUrl:
          media?.backdropUrl ||
          'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80',
        airDate: '',
        rating: media?.rating,
      });
    }
    return {
      seasonNumber: selectedSeason,
      name: `Season ${selectedSeason}`,
      episodeCount: epCount,
      episodes: fallbackEpisodes,
    };
  }, [seasonsCache, selectedSeason, media]);

  // Filtered episodes based on search query
  const filteredEpisodes = useMemo(() => {
    if (!currentSeasonData?.episodes) return [];
    if (!episodeFilter.trim()) return currentSeasonData.episodes;
    const q = episodeFilter.toLowerCase();
    return currentSeasonData.episodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.overview.toLowerCase().includes(q) ||
        String(ep.episodeNumber).includes(q)
    );
  }, [currentSeasonData, episodeFilter]);

  // Season progress stats
  const seasonStats = useMemo(() => {
    if (!currentSeasonData?.episodes) return { watched: 0, total: 0, percent: 0 };
    const total = currentSeasonData.episodes.length;
    let watched = 0;
    currentSeasonData.episodes.forEach((ep) => {
      const key = `${selectedSeason}-${ep.episodeNumber}`;
      if (watchedEpisodes[key]) watched++;
    });
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    return { watched, total, percent };
  }, [currentSeasonData, selectedSeason, watchedEpisodes]);

  const handleMarkCurrentSeason = (markWatched: boolean) => {
    if (!currentSeasonData?.episodes || !media) return;
    const epNums = currentSeasonData.episodes.map((ep) => ep.episodeNumber);
    if (onMarkAllEpisodesWatched) {
      onMarkAllEpisodesWatched(media.id, selectedSeason, epNums, markWatched);
    } else if (onToggleEpisodeWatched) {
      epNums.forEach((ep) => {
        const key = `${selectedSeason}-${ep}`;
        const isWatched = !!watchedEpisodes[key];
        if (markWatched !== isWatched) {
          onToggleEpisodeWatched(media.id, selectedSeason, ep);
        }
      });
    }
  };

  if (!media) return null;

  // Find related titles based on genres
  const relatedTitles = (allMedia || []).filter(
    (item) => item.id !== media.id && item.genres.some((g) => media.genres.includes(g))
  ).slice(0, 4);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl scrollbar-thin scrollbar-thumb-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media Backdrop / Trailer Viewer Section */}
        <div className="relative w-full aspect-video sm:h-[360px] bg-slate-950 overflow-hidden">
          {isPlayingTrailer ? (
            <div className="relative w-full h-full">
              <iframe
                className="w-full h-full border-0"
                src={`https://www.youtube-nocookie.com/embed/${media.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={`${media.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setIsPlayingTrailer(false)}
                className="absolute top-3 left-3 z-10 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-800 transition-all"
              >
                Close Trailer
              </button>
            </div>
          ) : (
            <div
              className="relative w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${media.backdropUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

              {/* Play Trailer Overlay Button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => setIsPlayingTrailer(true)}
                  className="group flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-950 hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="h-6 w-6 fill-white ml-1 group-hover:scale-105 transition-transform" />
                </button>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 drop-shadow">
                  Watch Official Trailer
                </span>
              </div>

              {/* Badge Strip on Backdrop */}
              <div className="absolute bottom-4 left-6 flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${
                    media.type === 'movie'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}
                >
                  {media.type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                  {media.type === 'movie' ? 'Movie' : 'TV Series'}
                </span>

                <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30 shrink-0 whitespace-nowrap">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {media.rating.toFixed(1)} <span className="text-[10px] text-amber-400/80 font-normal">({media.voteCount})</span>
                </span>

                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300 border border-slate-700 font-mono shrink-0 whitespace-nowrap">
                  {formatCertification(media.certification, media.type)}
                </span>

                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300 border border-slate-700 shrink-0 whitespace-nowrap">
                  {media.releaseYear}
                </span>

                <span className="flex items-center gap-1 text-xs text-slate-300 shrink-0 whitespace-nowrap">
                  {media.type === 'tv' ? (
                    <Tv className="h-3 w-3 text-slate-400 shrink-0" />
                  ) : (
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  )}
                  <span>{formatMediaRuntime(media.runtime, media.type, media.seasonsCount)}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Header Row: Title, Tagline, Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {media.title}
              </h2>
              {media.tagline && (
                <p className="text-sm font-medium italic text-slate-400 mt-0.5">
                  "{media.tagline}"
                </p>
              )}
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-2 sm:self-start">
              {/* Primary Play Now / Nonton Film CTA Button */}
              <button
                id="modal-play-now-btn"
                onClick={() => onPlayMedia?.(media, selectedSeason, 1)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-950/60 hover:from-rose-500 hover:to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ring-1 ring-rose-400/40"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{media.type === 'movie' ? 'Play Now / Nonton Film' : `Play S${selectedSeason} E1`}</span>
              </button>

              {/* Watch status dropdown button */}
              <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-1">
                <button
                  onClick={() => onToggleWatchlist(media.id, 'want_to_watch')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSaved
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isSaved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {isSaved ? 'In Library' : 'Add to Watchlist'}
                </button>

                {isSaved && (
                  <select
                    onChange={(e) => onSetWatchStatus(media.id, e.target.value as WatchStatus)}
                    defaultValue="want_to_watch"
                    className="bg-transparent text-xs text-slate-300 px-2 py-1 focus:outline-none border-l border-slate-700 cursor-pointer"
                  >
                    <option value="want_to_watch" className="bg-slate-900 text-white">Plan to Watch</option>
                    <option value="currently_watching" className="bg-slate-900 text-white">Watching</option>
                    <option value="watched" className="bg-slate-900 text-white">Completed</option>
                  </select>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={() => onToggleFavorite(media.id)}
                title={isFavorite ? 'Favorited' : 'Add to Favorites'}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  isFavorite
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>

              {/* Share link button */}
              <button
                onClick={handleCopyLink}
                title="Copy Title Link"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="space-y-6">
            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Storyline</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {media.overview}
              </p>
            </div>

            {/* Key metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Director / Creator</span>
                <span className="text-slate-200 font-medium">{media.director}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status</span>
                <span className="text-slate-200 font-medium">{media.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Genres</span>
                <span className="text-slate-200 font-medium">{media.genres.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Certification</span>
                <span className="text-slate-200 font-medium font-mono">{formatCertification(media.certification, media.type)}</span>
              </div>
            </div>

            {/* Cast & Characters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Top Billed Cast
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {media.cast.map((actor) => (
                  <div
                    key={actor.name}
                    className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 p-2.5 border border-slate-800"
                  >
                    <img
                      src={actor.avatarUrl}
                      alt={actor.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                      }}
                      className="h-10 w-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="overflow-hidden">
                      <span className="text-xs font-semibold text-white block truncate">
                        {actor.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {actor.character}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasons & Episodes section (Full feature directly inside modal for TV shows) */}
            {media.type === 'tv' && (
              <div id="seasons-episodes-section" className="space-y-5 pt-3 border-t border-slate-800/80">
                {/* Season switcher & Quick Stats */}
                <div className="space-y-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5 text-sky-400" />
                      <span>Seasons & Episodes</span>
                    </span>

                    {isLoadingSeason && (
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Memuat episode TMDB...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {availableSeasons.map((season) => {
                      const isSelected = selectedSeason === season.seasonNumber;
                      const cachedSeason = seasonsCache[season.seasonNumber];
                      const epCount = cachedSeason?.episodes?.length || season.episodeCount || (season.episodes ? season.episodes.length : 0);

                      return (
                        <button
                          key={season.seasonNumber}
                          onClick={() => setSelectedSeason(season.seasonNumber)}
                          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50 ring-1 ring-sky-400/40'
                              : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{season.name}</span>
                          {epCount > 0 && (
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono ${
                                isSelected
                                  ? 'bg-sky-700/60 text-sky-100'
                                  : 'bg-slate-800/80 text-slate-400'
                              }`}
                            >
                              {epCount} eps
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Season Progress & Control Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/80">
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">{currentSeasonData.name} Progress:</span>
                      <span className="text-sky-400 font-semibold">
                        {seasonStats.watched} / {seasonStats.total} Ditonton ({seasonStats.percent}%)
                      </span>
                    </div>
                    {/* Progress Bar Track */}
                    <div className="h-2 w-full sm:w-64 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 rounded-full"
                        style={{ width: `${seasonStats.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Season Batch Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMarkCurrentSeason(true)}
                      title="Tandai semua episode di season ini sebagai sudah ditonton"
                      className="flex items-center gap-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-600 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:text-white border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Tandai Semua</span>
                    </button>

                    {seasonStats.watched > 0 && (
                      <button
                        onClick={() => handleMarkCurrentSeason(false)}
                        title="Reset status tonton season ini"
                        className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-300 px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Episode Search & Filter Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={episodeFilter}
                    onChange={(e) => setEpisodeFilter(e.target.value)}
                    placeholder={`Cari episode di ${currentSeasonData.name} (judul, sinopsis, atau nomor)...`}
                    className="w-full rounded-xl bg-slate-950/70 pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-200 border border-slate-800 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                  />
                  {episodeFilter && (
                    <button
                      onClick={() => setEpisodeFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Episodes List */}
                {isLoadingSeason && filteredEpisodes.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="h-8 w-8 text-sky-500 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">
                      Memuat daftar episode {currentSeasonData.name} langsung dari TMDB...
                    </p>
                  </div>
                ) : filteredEpisodes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                    <Tv className="mx-auto h-7 w-7 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-300">
                      Tidak ada episode yang sesuai pencarian "{episodeFilter}"
                    </p>
                    <button
                      onClick={() => setEpisodeFilter('')}
                      className="text-xs text-sky-400 underline hover:text-sky-300"
                    >
                      Hapus pencarian
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEpisodes.map((ep) => {
                      const epKey = `${selectedSeason}-${ep.episodeNumber}`;
                      const isWatched = !!watchedEpisodes[epKey];
                      const isExpanded = expandedEpisode === ep.episodeNumber;

                      return (
                        <div
                          key={ep.episodeNumber}
                          className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl p-3 sm:p-4 border transition-all ${
                            isWatched
                              ? 'bg-sky-950/20 border-sky-900/50 hover:border-sky-800/80'
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Episode Thumbnail */}
                            <div className="relative h-20 w-32 sm:h-22 sm:w-36 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                              <img
                                src={ep.stillUrl}
                                alt={ep.title}
                                loading="lazy"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    media.backdropUrl ||
                                    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80';
                                }}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Duration Badge on thumbnail */}
                              <span className="absolute bottom-1.5 right-1.5 rounded bg-slate-950/80 px-1.5 py-0.2 text-[10px] font-mono text-slate-300 border border-slate-800">
                                {ep.duration}
                              </span>
                              {/* Watched Overlay Checkmark on thumbnail */}
                              {isWatched && (
                                <div className="absolute inset-0 bg-sky-950/40 flex items-center justify-center">
                                  <CheckCircle2 className="h-6 w-6 text-sky-400 drop-shadow-md" />
                                </div>
                              )}
                            </div>

                            {/* Episode Metadata */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-300 border border-sky-500/30 font-mono">
                                  S{selectedSeason} E{ep.episodeNumber < 10 ? `0${ep.episodeNumber}` : ep.episodeNumber}
                                </span>

                                {ep.rating && ep.rating > 0 && (
                                  <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                    <span>{ep.rating.toFixed(1)}</span>
                                  </span>
                                )}

                                {ep.airDate && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span>{ep.airDate}</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm sm:text-base font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
                                {ep.title}
                              </h4>

                              <p
                                className={`text-xs text-slate-400 mt-1 leading-relaxed ${
                                  isExpanded ? '' : 'line-clamp-2'
                                }`}
                              >
                                {ep.overview || 'Sinopsis episode belum tersedia untuk tayangan ini.'}
                              </p>

                              {ep.overview && ep.overview.length > 130 && (
                                <button
                                  onClick={() =>
                                    setExpandedEpisode(isExpanded ? null : ep.episodeNumber)
                                  }
                                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 mt-1 cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Tutup Sinopsis</span>
                                      <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Baca Sinopsis Lengkap</span>
                                      <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Watched & Play Episode Action Buttons */}
                          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                            <button
                              onClick={() => onPlayMedia?.(media, selectedSeason, ep.episodeNumber)}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-1 ring-rose-400/30"
                            >
                              <Play className="h-3.5 w-3.5 fill-white" />
                              <span>Putar Episode</span>
                            </button>

                            {onToggleEpisodeWatched && (
                              <button
                                onClick={() =>
                                  onToggleEpisodeWatched(media.id, selectedSeason, ep.episodeNumber)
                                }
                                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                  isWatched
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 shadow-sm'
                                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                {isWatched ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                                    <span>Sudah Ditonton</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Tandai Ditonton</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tags / Highlights */}
            {media.tags && media.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {media.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related / "More Like This" row */}
          {relatedTitles.length > 0 && (
            <div className="border-t border-slate-800 pt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                More Like This
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedTitles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="group cursor-pointer rounded-xl bg-slate-950/60 p-2 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <img
                      src={rel.posterUrl}
                      alt={rel.title}
                      className="aspect-[2/3] w-full rounded-lg object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="mt-1.5">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-rose-400">
                        {rel.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>{rel.releaseYear}</span>
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {rel.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

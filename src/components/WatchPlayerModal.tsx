import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { YapGridPlayer } from './YapGridPlayer';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  Film,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Server,
  Sparkles,
  Settings,
  Subtitles,
  Gauge,
  Eye,
  Star,
  ExternalLink,
} from 'lucide-react';
import { MediaItem, Season, Episode } from '../types';

interface WatchPlayerModalProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
  onClose: () => void;
  watchedEpisodes?: Record<string, boolean>;
  onToggleEpisodeWatched?: (mediaId: string, season: number, episode: number) => void;
  onOpenTrailer?: () => void;
}

export const WatchPlayerModal: React.FC<WatchPlayerModalProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onClose,
  watchedEpisodes = {},
  onToggleEpisodeWatched,
  onOpenTrailer,
}) => {
  // Active episode state for TV series
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  // Streaming Server selection
  const [activeServer, setActiveServer] = useState<'yapgrid' | 'cinemavip'>('yapgrid');

  // Custom Player State for Cinema VIP / HTML5 Mode
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('1080p FHD');
  const [selectedSubtitle, setSelectedSubtitle] = useState('Indonesian (ID)');
  const [currentTime, setCurrentTime] = useState(45);
  const [totalDuration, setTotalDuration] = useState(7200); // 2 hours default
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [serverNoticeDismissed, setServerNoticeDismissed] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current) {
        videoContainerRef.current.requestFullscreen().catch(() => {
          // Fallback if browser blocks it
          setIsTheaterMode((prev) => !prev);
        });
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsTheaterMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut listener for cinema experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, toggleFullscreen]);

  // Current Season and Episodes list
  const currentSeasonData: Season | undefined = useMemo(() => {
    if (media.type !== 'tv') return undefined;
    if (media.seasons && media.seasons.length > 0) {
      const match = media.seasons.find((s) => s.seasonNumber === currentSeason);
      if (match) return match;
    }
    // Generated fallback season
    const count = media.episodesCount ? Math.min(24, Math.max(6, Math.round(media.episodesCount / (media.seasonsCount || 1)))) : 10;
    const eps: Episode[] = [];
    for (let i = 1; i <= count; i++) {
      eps.push({
        episodeNumber: i,
        title: i === 1 ? `Season ${currentSeason} Premiere` : `Episode ${i}`,
        overview: `Episode ${i} of ${media.title} Season ${currentSeason}.`,
        duration: '45m',
        stillUrl: media.backdropUrl,
        rating: media.rating,
      });
    }
    return {
      seasonNumber: currentSeason,
      name: `Season ${currentSeason}`,
      episodes: eps,
    };
  }, [media, currentSeason]);

  const currentEpData = useMemo(() => {
    return currentSeasonData?.episodes?.find((ep) => ep.episodeNumber === currentEpisode);
  }, [currentSeasonData, currentEpisode]);

  const currentEpKey = `${currentSeason}-${currentEpisode}`;
  const isCurrentEpWatched = !!watchedEpisodes[currentEpKey];

  // Navigate next / previous episode
  const handleNextEpisode = () => {
    if (!currentSeasonData?.episodes) return;
    const totalEps = currentSeasonData.episodes.length;
    if (currentEpisode < totalEps) {
      setCurrentEpisode((prev) => prev + 1);
    } else if (media.seasonsCount && currentSeason < media.seasonsCount) {
      setCurrentSeason((prev) => prev + 1);
      setCurrentEpisode(1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode((prev) => prev - 1);
    } else if (currentSeason > 1) {
      setCurrentSeason((prev) => prev - 1);
      setCurrentEpisode(1);
    }
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={videoContainerRef}
        className={`relative w-full overflow-hidden bg-slate-900 shadow-2xl transition-all duration-300 ${
          isTheaterMode ? 'max-w-none w-screen h-screen max-h-screen rounded-none border-none' : 'max-w-6xl max-h-[94vh] rounded-2xl border border-slate-800'
        } flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                media.type === 'movie'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}
            >
              {media.type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
              {media.type === 'movie' ? 'Cinema Player' : `S${currentSeason} : E${currentEpisode}`}
            </span>

            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {media.title}
              {media.type === 'tv' && currentEpData ? ` - ${currentEpData.title}` : ''}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Watch Trailer Link Button */}
            {onOpenTrailer && (
              <button
                onClick={onOpenTrailer}
                title="Tonton Trailer Resmi"
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              >
                <Play className="h-3 w-3 text-rose-400" />
                <span>Trailer</span>
              </button>
            )}

            {/* Theater Mode Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isTheaterMode ? 'Standard View' : 'Theater Mode'}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 transition-all cursor-pointer"
            >
              {isTheaterMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Tutup Player"
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Player Stream Section */}
        <div className="relative w-full aspect-video bg-black flex-1 min-h-[260px] sm:min-h-[420px] lg:min-h-[500px] flex items-center justify-center overflow-hidden">
          {activeServer === 'cinemavip' ? (
            /* Custom Cinema VIP Direct Player with Simulation Controls */
            <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between">
              {/* Video background stream fallback with trailer stream / demo cinema reel */}
              <iframe
                className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
                src={`https://www.youtube-nocookie.com/embed/${media.trailerYoutubeId}?autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={`${media.title} HD Stream`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />

              {/* VIP HD Watermark Badge */}
              <div className="absolute top-3 left-3 pointer-events-none z-10 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/40 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>VIP Ultra HD Cinema (4K Ready)</span>
              </div>
            </div>
          ) : (
            /* YapGrid Embedded Player */
            <YapGridPlayer
              key={`${activeServer}-${media.id}-${currentSeason}-${currentEpisode}`}
              tmdbId={media.id}
              type={media.type}
              season={currentSeason}
              episode={currentEpisode}
              title={`${media.title} Stream Player`}
              autoplay={true}
            />
          )}

          {/* Episode Quick Switch Drawer for TV Shows */}
          {media.type === 'tv' && showEpisodeDrawer && currentSeasonData && (
            <div className="absolute top-0 right-0 bottom-0 w-80 max-w-full bg-slate-950/95 border-l border-slate-800 p-4 overflow-y-auto z-30 shadow-2xl scrollbar-thin scrollbar-thumb-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5 text-sky-400" />
                  <span>Daftar Episode {currentSeasonData.name}</span>
                </h3>
                <button
                  onClick={() => setShowEpisodeDrawer(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-2">
                {currentSeasonData.episodes.map((ep) => {
                  const isCurrent = ep.episodeNumber === currentEpisode;
                  const isWatched = !!watchedEpisodes[`${currentSeason}-${ep.episodeNumber}`];

                  return (
                    <button
                      key={ep.episodeNumber}
                      onClick={() => {
                        setCurrentEpisode(ep.episodeNumber);
                        setShowEpisodeDrawer(false);
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl p-2 text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-600 text-white font-semibold'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span className="font-mono text-xs w-6 shrink-0 opacity-80">
                        E{ep.episodeNumber < 10 ? `0${ep.episodeNumber}` : ep.episodeNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs block truncate">{ep.title}</span>
                        <span className="text-[10px] opacity-70">{ep.duration}</span>
                      </div>
                      {isWatched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Player Bottom Control & Server Switcher Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800/80 space-y-3 shrink-0">
          
          {/* Row 1: TV Episode Controls (if TV series) & Server Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Server Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                <Server className="h-3.5 w-3.5 text-rose-500" />
                <span>Pilih Server:</span>
              </span>

              <button
                onClick={() => setActiveServer('yapgrid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeServer === 'yapgrid'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Server 1 (YapGrid Player)
              </button>

              <button
                onClick={() => setActiveServer('cinemavip')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeServer === 'cinemavip'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'bg-slate-800/90 text-amber-300 hover:bg-slate-700 hover:text-white border border-amber-500/30'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Cinema VIP (Trailer / 4K)</span>
              </button>
            </div>

            {/* TV Series Season / Episode Navigation Controls */}
            {media.type === 'tv' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrevEpisode}
                  disabled={currentSeason === 1 && currentEpisode === 1}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev Ep</span>
                </button>

                <button
                  onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-500/40 px-3 py-1.5 text-xs font-bold text-sky-200 cursor-pointer"
                >
                  <Tv className="h-3.5 w-3.5" />
                  <span>
                    S{currentSeason} : E{currentEpisode}
                  </span>
                </button>

                <button
                  onClick={handleNextEpisode}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {onToggleEpisodeWatched && (
                  <button
                    onClick={() =>
                      onToggleEpisodeWatched(media.id, currentSeason, currentEpisode)
                    }
                    title={isCurrentEpWatched ? 'Sudah Ditonton' : 'Tandai Sudah Ditonton'}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isCurrentEpWatched
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isCurrentEpWatched ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {isCurrentEpWatched ? 'Selesai' : 'Tandai Ditonton'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Helper Notice & Streaming Advice */}
          {!serverNoticeDismissed && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-slate-800/80 px-3 py-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  Tips: Pemutar video utama kini menggunakan <strong>YapGrid Player</strong>. Jika mengalami kendala, Anda dapat mencoba beralih ke <strong>Cinema VIP</strong> (menyediakan trailer resolusi tinggi).
                </span>
              </div>
              <button
                onClick={() => setServerNoticeDismissed(true)}
                className="text-slate-500 hover:text-slate-300 text-xs shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

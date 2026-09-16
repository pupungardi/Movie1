import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  X,
  Maximize,
  Minimize,
  Tv,
  Film,
  CheckCircle2,
  Play,
  List,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MediaItem, Season, Episode } from '../types';
import { YapGridPlayer, StreamingServer } from './YapGridPlayer';

interface WatchPlayerModalProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
  onClose: () => void;
  watchedEpisodes?: Record<string, boolean>;
  onToggleEpisodeWatched?: (mediaId: string, season: number, episode: number) => void;
  onOpenTrailer?: () => void;
  allMedia?: MediaItem[];
  onSelectMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  isSaved?: (id: string) => boolean;
  onToggleWatchlist?: (id: string) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  userReview?: string;
  onSetUserReview?: (id: string, review: string) => void;
}

export const WatchPlayerModal: React.FC<WatchPlayerModalProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onClose,
  watchedEpisodes = {},
}) => {
  // Season and Episode state for TV series
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  // Active streaming server (default to vidsrcme: completely free of Chrome sandbox block)
  const [activeServer, setActiveServer] = useState<StreamingServer | 'youtube'>('vidsrcme');

  // Clean UI controls visibility
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show quick toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Fullscreen & Landscape Orientation Handler
  const enterLandscapeFullscreen = useCallback(async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      }
    } catch {
      // Browser or iframe security might prevent auto-request without explicit tap
    }

    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // Orientation lock not supported or denied
    }
  }, []);

  // Exit Fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore
    }
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    } catch {
      // Ignore
    }
    setIsFullscreen(false);
  }, []);

  // Attempt landscape fullscreen when user opens the player
  useEffect(() => {
    enterLandscapeFullscreen();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [enterLandscapeFullscreen]);

  // Clean auto-hide controls after 3.2s of inactivity
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setShowServerMenu(false);
    }, 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterLandscapeFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, enterLandscapeFullscreen, exitFullscreen, onClose]);

  // Season & Episodes Data
  const currentSeasonData: Season | undefined = useMemo(() => {
    if (media.type !== 'tv') return undefined;
    if (media.seasons && media.seasons.length > 0) {
      const match = media.seasons.find((s) => s.seasonNumber === currentSeason);
      if (match) return match;
    }
    const count = media.episodesCount
      ? Math.min(24, Math.max(6, Math.round(media.episodesCount / (media.seasonsCount || 1))))
      : 8;
    const eps: Episode[] = [];
    for (let i = 1; i <= count; i++) {
      eps.push({
        episodeNumber: i,
        title: i === 1 ? `Season ${currentSeason} Premiere` : `Episode ${i}`,
        overview: `Episode ${i} dari ${media.title} Season ${currentSeason}.`,
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

  const ytVideoId = media.trailerYoutubeId || 'dQw4w9WgXcQ';
  const youtubeEmbedSrc = `https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;

  const cleanMediaId = useMemo(() => String(media.id).trim().replace(/^(m-|tv-)/, ''), [media.id]);

  const directStreamUrl = useMemo(() => {
    if (activeServer === 'youtube') return `https://www.youtube.com/watch?v=${ytVideoId}`;
    if (activeServer === 'vidsrcme') {
      return media.type === 'tv'
        ? `https://vidsrcme.ru/embed/tv?tmdb=${cleanMediaId}&season=${currentSeason}&episode=${currentEpisode}`
        : `https://vidsrcme.ru/embed/movie?tmdb=${cleanMediaId}`;
    }
    if (activeServer === 'vidsrcpm') {
      return media.type === 'tv'
        ? `https://vidsrc.pm/embed/tv/${cleanMediaId}/${currentSeason}/${currentEpisode}`
        : `https://vidsrc.pm/embed/movie/${cleanMediaId}`;
    }
    if (activeServer === 'vidsrc') {
      return media.type === 'tv'
        ? `https://vidsrc.to/embed/tv/${cleanMediaId}/${currentSeason}/${currentEpisode}`
        : `https://vidsrc.to/embed/movie/${cleanMediaId}`;
    }
    if (activeServer === 'autoembed') {
      return media.type === 'tv'
        ? `https://player.autoembed.cc/embed/tv/${cleanMediaId}/${currentSeason}/${currentEpisode}`
        : `https://player.autoembed.cc/embed/movie/${cleanMediaId}`;
    }
    return media.type === 'tv'
      ? `https://vidlink.pro/tv/${cleanMediaId}/${currentSeason}/${currentEpisode}`
      : `https://vidlink.pro/movie/${cleanMediaId}`;
  }, [activeServer, media.type, cleanMediaId, currentSeason, currentEpisode, ytVideoId]);

  const handleClose = () => {
    exitFullscreen();
    onClose();
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className="fixed inset-0 z-50 bg-black text-white select-none overflow-hidden flex items-center justify-center w-full h-full"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-slate-900/95 border border-slate-700/80 px-4 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Video Screen Container */}
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {activeServer === 'youtube' ? (
          <iframe
            src={youtubeEmbedSrc}
            title={`${media.title} - Official Trailer`}
            className="w-full h-full border-0 absolute inset-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
          />
        ) : (
          <YapGridPlayer
            tmdbId={media.id}
            type={media.type}
            season={currentSeason}
            episode={currentEpisode}
            title={media.title}
            autoplay={true}
            server={activeServer}
            onServerChange={(s) => setActiveServer(s)}
            backdropUrl={media.backdropUrl || media.posterUrl}
            containerClassName="w-full h-full relative bg-black flex items-center justify-center"
          />
        )}

        {/* Minimalist Floating HUD (Clean Cinema Mode & Auto-Hiding) */}
        <div
          className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 transition-opacity duration-300 z-30 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Floating Control Bar */}
          <div className="flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 sm:p-4 rounded-2xl backdrop-blur-xs">
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all backdrop-blur-md border border-white/10 shrink-0"
                title="Keluar / Kembali"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-semibold pr-1">Kembali</span>
              </button>

              <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-base font-bold text-white truncate">
                    {media.title}
                  </span>
                  {media.releaseYear && (
                    <span className="hidden sm:inline text-xs text-white/60 font-medium">
                      ({media.releaseYear})
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                    {media.type === 'tv' ? 'Serial TV' : 'Film Bioskop HD'}
                  </span>
                </div>
                {media.type === 'tv' && currentEpData && (
                  <span className="text-[11px] sm:text-xs text-white/75 truncate mt-0.5 font-medium">
                    Season {currentSeason} Episode {currentEpisode}: {currentEpData.title}
                  </span>
                )}
              </div>
            </div>

            {/* Right Controls: Server Selector, TV Episodes, Rotate, Fullscreen, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2">
              {/* TV Episodes Toggle Drawer */}
              {media.type === 'tv' && (
                <button
                  type="button"
                  onClick={() => setShowEpisodeDrawer(true)}
                  className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white border border-white/10 backdrop-blur-md transition-all"
                  title="Pilih Episode"
                >
                  <List className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Episode</span>
                </button>
              )}

              {/* Server Selector Dropdown/Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowServerMenu(!showServerMenu)}
                  className="flex items-center gap-1 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white border border-white/10 backdrop-blur-md transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  <span className="uppercase text-[11px] sm:text-xs">
                    {activeServer === 'youtube' ? 'Trailer' : activeServer}
                  </span>
                </button>

                {showServerMenu && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl bg-slate-900/95 border border-slate-700/80 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                    <div className="text-[10px] font-bold text-white/50 px-2 py-1 uppercase tracking-wider">
                      Pilihan Server Streaming
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('vidsrcme');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Server 1 (VidSrc.me - Bebas Sandbox)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'vidsrcme' ? 'bg-sky-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Server 1 (VidSrc.me - Chrome OK)</span>
                      {activeServer === 'vidsrcme' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('vidsrcpm');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Server 2 (VidSrc.pm - CloudFabric)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'vidsrcpm' ? 'bg-sky-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Server 2 (VidSrc.pm HD)</span>
                      {activeServer === 'vidsrcpm' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('vidsrc');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Server 3 (VidSrc.to)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'vidsrc' ? 'bg-sky-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Server 3 (VidSrc.to)</span>
                      {activeServer === 'vidsrc' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('autoembed');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Server 4 (AutoEmbed)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'autoembed' ? 'bg-sky-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Server 4 (AutoEmbed)</span>
                      {activeServer === 'autoembed' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('vidlink');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Server 5 (VidLink HD)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'vidlink' ? 'bg-sky-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Server 5 (VidLink HD)</span>
                      {activeServer === 'vidlink' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServer('youtube');
                        setShowServerMenu(false);
                        triggerToast('Beralih ke Trailer Resmi (YouTube)');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeServer === 'youtube' ? 'bg-rose-600 text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>Trailer Resmi (YouTube)</span>
                      {activeServer === 'youtube' && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Open in New Tab Button (Bypasses all iframe sandbox restrictions) */}
              <a
                href={directStreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white border border-white/10 backdrop-blur-md transition-all"
                title="Buka Langsung di Tab Baru (Bebas Batasan Sandbox)"
              >
                <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Tab Baru</span>
              </a>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={isFullscreen ? exitFullscreen : enterLandscapeFullscreen}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/10 transition-all"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Landscape'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-rose-600/80 hover:bg-rose-600 text-white active:scale-95 transition-all shadow-md"
                title="Tutup Pemutar"
              >
                <X className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Bottom Floating Minimalist Bar */}
          <div className="flex items-center justify-between pointer-events-auto bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 sm:p-3 rounded-xl backdrop-blur-xs text-xs text-white/70">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-white">
                {activeServer === 'youtube'
                  ? 'Trailer Resmi'
                  : `Streaming HD • Server ${activeServer.toUpperCase()}`}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">
                {media.genres?.slice(0, 2).join(', ') || 'Sinema'}
              </span>
            </div>

            <span className="text-[11px] text-white/50 hidden sm:inline">
              Ketuk layar untuk menampilkan atau menyembunyikan kontrol
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Episode Selection Drawer for TV Series */}
      {showEpisodeDrawer && media.type === 'tv' && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm sm:max-w-md h-full bg-[#121216] border-l border-white/10 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Tv className="h-5 w-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Daftar Episode</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEpisodeDrawer(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Season Selector tabs if multi-season */}
            {media.seasons && media.seasons.length > 1 && (
              <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none border-b border-white/5">
                {media.seasons.map((s) => (
                  <button
                    key={s.seasonNumber}
                    type="button"
                    onClick={() => setCurrentSeason(s.seasonNumber)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      currentSeason === s.seasonNumber
                        ? 'bg-sky-600 text-white shadow-lg'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Season {s.seasonNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/20">
              {currentSeasonData?.episodes?.map((ep) => {
                const epKey = `${currentSeason}-${ep.episodeNumber}`;
                const isSelected = currentEpisode === ep.episodeNumber;
                const isWatched = !!watchedEpisodes[epKey];

                return (
                  <div
                    key={ep.episodeNumber}
                    onClick={() => {
                      setCurrentEpisode(ep.episodeNumber);
                      setShowEpisodeDrawer(false);
                      triggerToast(`Memutar Season ${currentSeason} Episode ${ep.episodeNumber}`);
                    }}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-500/50 shadow-lg'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Thumbnail / Number */}
                    <div className="relative w-20 h-12 rounded-lg bg-black/60 overflow-hidden shrink-0 flex items-center justify-center">
                      {ep.stillUrl || media.backdropUrl ? (
                        <img
                          src={ep.stillUrl || media.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white/60">EP {ep.episodeNumber}</span>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-sky-900/60 flex items-center justify-center">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {ep.episodeNumber}. {ep.title}
                        </span>
                        {isWatched && (
                          <span title="Sudah ditonton">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                        {ep.overview || `Episode ${ep.episodeNumber}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/40">{ep.duration || '45m'}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-sky-400">
                            • Sedang Diputar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

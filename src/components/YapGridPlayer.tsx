import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { validateTmdbId } from '../lib/tmdb';

export type StreamingServer = 'vidsrcme' | 'vidsrcpm' | 'vidsrc' | 'vidlink' | 'autoembed' | 'yapgrid';

interface YapGridPlayerProps {
  tmdbId: string | number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  subUrl?: string;
  title?: string;
  autoplay?: boolean;
  server?: StreamingServer;
  onServerChange?: (server: StreamingServer) => void;
  backdropUrl?: string;
  containerClassName?: string;
}

export const YapGridPlayer: React.FC<YapGridPlayerProps> = ({
  tmdbId,
  type,
  season,
  episode,
  subUrl,
  title = 'Media Stream Player',
  autoplay = true,
  server = 'vidsrcme',
  onServerChange,
  backdropUrl,
  containerClassName,
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [currentServer, setCurrentServer] = useState<StreamingServer>(server);

  useEffect(() => {
    setCurrentServer(server);
  }, [server]);

  useEffect(() => {
    let isMounted = true;
    setIsValidating(true);
    setValidationError(null);
    setIsIframeLoading(true);

    validateTmdbId(tmdbId, type, season, episode)
      .then((result) => {
        if (!isMounted) return;
        if (!result.isValid) {
          setValidationError(result.error || 'ID media tidak valid');
        }
        setIsValidating(false);
      })
      .catch(() => {
        if (!isMounted) return;
        // Don't block playback even if TMDB validation network error occurs
        setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, type, season, episode]);

  // Clean TMDB ID
  const cleanId = String(tmdbId).trim().replace(/^(m-|tv-)/, '');
  const sNum = season || 1;
  const epNum = episode || 1;

  // Build embed URL based on selected streaming server
  let embedUrl = '';
  switch (currentServer) {
    case 'vidsrcme':
      embedUrl =
        type === 'tv'
          ? `https://vidsrcme.ru/embed/tv?tmdb=${cleanId}&season=${sNum}&episode=${epNum}`
          : `https://vidsrcme.ru/embed/movie?tmdb=${cleanId}`;
      break;
    case 'vidsrcpm':
      embedUrl =
        type === 'tv'
          ? `https://vidsrc.pm/embed/tv/${cleanId}/${sNum}/${epNum}`
          : `https://vidsrc.pm/embed/movie/${cleanId}`;
      break;
    case 'vidsrc':
      embedUrl =
        type === 'tv'
          ? `https://vidsrc.to/embed/tv/${cleanId}/${sNum}/${epNum}`
          : `https://vidsrc.to/embed/movie/${cleanId}`;
      break;
    case 'vidlink':
      embedUrl =
        type === 'tv'
          ? `https://vidlink.pro/tv/${cleanId}/${sNum}/${epNum}?autoplay=${autoplay ? 'true' : 'false'}`
          : `https://vidlink.pro/movie/${cleanId}?autoplay=${autoplay ? 'true' : 'false'}`;
      break;
    case 'autoembed':
      embedUrl =
        type === 'tv'
          ? `https://player.autoembed.cc/embed/tv/${cleanId}/${sNum}/${epNum}`
          : `https://player.autoembed.cc/embed/movie/${cleanId}`;
      break;
    case 'yapgrid':
    default:
      embedUrl =
        type === 'tv'
          ? `https://yapgrid.com/embed/tv/${cleanId}/${sNum}/${epNum}`
          : `https://yapgrid.com/embed/movie/${cleanId}`;
      if (subUrl) {
        embedUrl += `?sub_url=${encodeURIComponent(subUrl)}`;
      }
      if (autoplay) {
        embedUrl += subUrl ? '&autoplay=1' : '?autoplay=1';
      }
      break;
  }

  const handleSwitchServer = (nextServer: StreamingServer) => {
    setCurrentServer(nextServer);
    setIsIframeLoading(true);
    if (onServerChange) {
      onServerChange(nextServer);
    }
  };

  if (validationError) {
    return (
      <div className="relative w-full h-full min-h-[300px] bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
          <AlertCircle className="h-6 w-6 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Media Tidak Ditemukan</h3>
        <p className="text-sm text-slate-400 max-w-md">
          {validationError}. Periksa kembali pilihan film atau serial Anda.
        </p>
      </div>
    );
  }

  return (
    <div className={containerClassName || "relative w-full h-full bg-black overflow-hidden flex items-center justify-center"}>
      {/* Visual Backdrop Poster while loading */}
      {isIframeLoading && backdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover opacity-20 filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
        </div>
      )}

      {/* Loading indicator overlay */}
      {(isValidating || isIframeLoading) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-center p-4">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin absolute" />
          </div>
          <p className="text-white font-semibold text-sm sm:text-base">
            Menghubungkan ke Server Streaming...
          </p>
          <p className="text-white/60 text-xs mt-1">
            Server: <span className="text-sky-400 font-bold uppercase">{currentServer}</span> • Menyiapkan video HD
          </p>

          {/* Quick manual server switch if taking longer than expected */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/50">Ganti Server:</span>
            <button
              type="button"
              onClick={() => handleSwitchServer('vidsrcme')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentServer === 'vidsrcme' ? 'bg-sky-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              VidSrc.me (Chrome OK)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchServer('vidsrcpm')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentServer === 'vidsrcpm' ? 'bg-sky-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              VidSrc.pm (CloudFabric)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchServer('vidsrc')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentServer === 'vidsrc' ? 'bg-sky-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              VidSrc.to
            </button>
            <button
              type="button"
              onClick={() => handleSwitchServer('autoembed')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentServer === 'autoembed' ? 'bg-sky-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              AutoEmbed
            </button>
            <button
              type="button"
              onClick={() => handleSwitchServer('vidlink')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentServer === 'vidlink' ? 'bg-sky-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              VidLink HD
            </button>
          </div>
        </div>
      )}

      {/* The Actual Video Iframe */}
      <iframe
        key={`${currentServer}-${cleanId}-${sNum}-${epNum}`}
        src={embedUrl}
        title={title}
        className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="origin"
        onLoad={() => {
          setIsIframeLoading(false);
          setIsValidating(false);
        }}
      />
    </div>
  );
};

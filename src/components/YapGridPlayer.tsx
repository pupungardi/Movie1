import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { validateTmdbId } from '../lib/tmdb';

interface YapGridPlayerProps {
  tmdbId: string | number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  subUrl?: string;
  title?: string;
  autoplay?: boolean;
}

export const YapGridPlayer: React.FC<YapGridPlayerProps> = ({
  tmdbId,
  type,
  season,
  episode,
  subUrl,
  title = 'YapGrid Media Player',
  autoplay = true,
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsValidating(true);
    setValidationError(null);

    validateTmdbId(tmdbId, type, season, episode)
      .then(result => {
        if (!isMounted) return;
        if (!result.isValid) {
          setValidationError(result.error || 'ID tidak valid');
        }
        setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tmdbId, type, season, episode]);

  if (isValidating) {
    return (
      <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center animate-pulse">
        <Loader2 className="h-8 w-8 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Memvalidasi ketersediaan media di TMDB...</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-rose-900/50 shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
          <AlertCircle className="h-6 w-6 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Media Tidak Tersedia</h3>
        <p className="text-sm text-slate-400 max-w-md">
          {validationError}. Pemutar tidak dapat dimuat karena data tidak ditemukan di database TMDB.
        </p>
      </div>
    );
  }

  // Build the base embed URL depending on media type
  let embedUrl = `https://yapgrid.com/embed/${type}/${tmdbId}`;
  
  if (type === 'tv' && season !== undefined && episode !== undefined) {
    embedUrl += `/${season}/${episode}`;
  }

  // Append sub_url if provided, ensuring it's properly encoded
  if (subUrl) {
    embedUrl += `?sub_url=${encodeURIComponent(subUrl)}`;
  }
  
  if (autoplay) {
    embedUrl += subUrl ? '&autoplay=1' : '?autoplay=1';
  }

  // 🔍 DEBUGGING: Cek URL ini di Console Browser (F12)
  console.log("🔥 URL YAPGRID YANG DIKIRIM:", embedUrl);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
};

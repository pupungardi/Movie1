import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Film } from 'lucide-react';
import { cleanYapGridUrl } from '../lib/yapgrid-utils';

interface SmartYapGridPlayerProps {
  rawUrl: string;
  title?: string;
  posterUrl?: string;
}

export const SmartYapGridPlayer: React.FC<SmartYapGridPlayerProps> = ({
  rawUrl,
  title = 'Media Player',
  posterUrl,
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'unavailable'>('loading');
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 1. Pembersihan URL
  useEffect(() => {
    setStatus('loading');
    const cleaned = cleanYapGridUrl(rawUrl);
    if (!cleaned) {
      setStatus('unavailable'); // Invalid URL format
    } else {
      setCleanUrl(cleaned);
    }
  }, [rawUrl, retryKey]);

  // 2. State Monitoring & Timeout Handler
  useEffect(() => {
    if (status !== 'loading' || !cleanUrl) return;

    // Jika iframe tidak memicu event onLoad setelah 5 detik, 
    // kita asumsikan terjadi kendala jaringan atau iframe nyangkut.
    const timeoutId = setTimeout(() => {
      setStatus('unavailable');
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [status, cleanUrl]);

  // Handler saat iframe selesai memuat DOM-nya
  const handleIframeLoad = useCallback(() => {
    if (status === 'loading') {
      setStatus('success');
    }
  }, [status]);

  // Handler jika terjadi error jaringan pada iframe
  const handleIframeError = useCallback(() => {
    setStatus('unavailable');
  }, []);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
  };

  // State: UNAVAILABLE / FALLBACK UI
  if (status === 'unavailable' || !cleanUrl) {
    return (
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
        {/* Background Blur Poster (Opsional) */}
        {posterUrl && (
          <div className="absolute inset-0 opacity-10">
            <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center space-y-4 max-w-md">
          <div className="h-14 w-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-200">{title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              ⚠️ Player untuk tayangan ini belum tersedia atau sedang mengalami kendala jaringan. 
              Silakan coba lagi nanti atau gunakan server alternatif.
            </p>
          </div>

          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-lg shadow-sky-900/30"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Coba Refresh Player</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* State: LOADING SKELETON */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900">
          <Loader2 className="h-10 w-10 text-sky-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            Menghubungkan ke YapGrid Server...
          </p>
        </div>
      )}

      {/* State: SUCCESS (Iframe) */}
      <iframe
        key={retryKey} // Memaksa re-render jika user menekan tombol refresh
        src={cleanUrl}
        title={`Memutar: ${title}`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        className={`absolute top-0 left-0 w-full h-full border-0 transition-opacity duration-500 ${
          status === 'success' ? 'opacity-100 z-20' : 'opacity-0 z-0'
        }`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        loading="lazy"
        allowFullScreen
      />
      
      {/* Tombol lapor error manual (Ditampilkan saat success berjaga-jaga jika YapGrid merender pesan error internal) */}
      {status === 'success' && (
        <button 
          onClick={() => setStatus('unavailable')}
          className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-rose-900/80 text-xs font-medium text-slate-300 hover:text-rose-200 border border-white/10 backdrop-blur-md transition-colors"
          title="Klik jika video tidak bisa diputar"
        >
          <AlertCircle className="h-3 w-3" />
          <span className="hidden sm:inline">Lapor Error</span>
        </button>
      )}
    </div>
  );
};

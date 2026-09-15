import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  getStoredTmdbKey,
  saveTmdbApiKey,
  checkTmdbKeyStatus,
  clearTmdbApiKey,
  checkTmdbConfig
} from '../services/tmdb';

interface TmdbApiKeyCardProps {
  onKeyUpdated?: () => void;
  className?: string;
}

export const TmdbApiKeyCard: React.FC<TmdbApiKeyCardProps> = ({
  onKeyUpdated,
  className = '',
}) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load key on mount
  useEffect(() => {
    const local = getStoredTmdbKey();
    if (local) {
      setInputKey(local);
    } else {
      checkTmdbConfig().then((cfg) => {
        if (cfg.configured && cfg.maskedKey) {
          setInputKey(cfg.maskedKey);
        }
      });
    }
  }, []);

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setStatusFeedback({
        type: 'error',
        message: 'Masukkan API Key TMDB terlebih dahulu.',
      });
      return;
    }

    setIsLoading(true);
    setStatusFeedback({
      type: 'info',
      message: 'Menyimpan dan memvalidasi ke server TMDB...',
    });

    try {
      const res = await saveTmdbApiKey(trimmed);
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: res.message || 'API Key TMDB berhasil disimpan dan aktif!',
        });
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.message || 'Gagal menyimpan API Key. Periksa kembali kunci Anda.',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat menyimpan key.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    setStatusFeedback({
      type: 'info',
      message: 'Mengecek status koneksi ke TMDB...',
    });

    try {
      const trimmed = inputKey.trim();
      const res = await checkTmdbKeyStatus(trimmed || undefined);
      if (res.valid) {
        setStatusFeedback({
          type: 'success',
          message: res.message || 'Terhubung! API Key TMDB valid dan dapat digunakan.',
        });
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.message || 'Kunci TMDB tidak valid atau koneksi gagal.',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err?.message || 'Gagal menghubungi server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      await clearTmdbApiKey();
      setInputKey('');
      setStatusFeedback({
        type: 'info',
        message: 'Kunci TMDB berhasil dihapus dari browser.',
      });
      if (onKeyUpdated) onKeyUpdated();
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err?.message || 'Gagal menghapus key.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="tmdb-api-key-card"
      className={`rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl ${className}`}
    >
      {/* Title with gear icon matching the screenshot */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-purple-400 shrink-0" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          TMDB API KEY
        </h3>
      </div>

      {/* Description text matching the screenshot */}
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
        Masukkan API key TMDB milik Anda. Key disimpan hanya di browser ini dan tidak ditampilkan penuh.
      </p>

      {/* Form Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <div className="relative flex-1">
          <input
            id="tmdb-api-key-input"
            type={showKey ? 'text' : 'password'}
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Masukkan API key TMDB..."
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 pr-10 text-sm text-white border border-slate-800 focus:border-purple-500 focus:outline-none font-mono placeholder:text-slate-600 transition-colors"
          />
          <button
            type="button"
            id="tmdb-key-toggle-visibility"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
            title={showKey ? 'Sembunyikan' : 'Tampilkan'}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="tmdb-save-key-btn"
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 sm:flex-initial rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold px-4 py-2.5 text-xs transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Save</span>
          </button>

          <button
            type="button"
            id="tmdb-check-status-btn"
            onClick={handleCheckStatus}
            disabled={isLoading}
            className="flex-1 sm:flex-initial rounded-xl border border-emerald-500/60 hover:bg-emerald-500/10 active:scale-95 text-emerald-400 font-bold px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Cek Status</span>
          </button>

          <button
            type="button"
            id="tmdb-clear-key-btn"
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 sm:flex-initial rounded-xl border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 font-bold px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {statusFeedback && (
        <div
          id="tmdb-key-feedback"
          className={`rounded-xl p-3 text-xs flex items-center gap-2 transition-all ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : statusFeedback.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-slate-800/80 border border-slate-700 text-slate-300'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : statusFeedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 text-purple-400 animate-spin shrink-0" />
          )}
          <span className="leading-relaxed">{statusFeedback.message}</span>
        </div>
      )}
    </div>
  );
};

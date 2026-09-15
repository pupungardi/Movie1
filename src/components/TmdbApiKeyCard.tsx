import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { getStoredTmdbKey, removeStoredTmdbKey, setStoredTmdbKey } from '../services/tmdb';

interface TmdbApiKeyCardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

function maskKey(key: string): string {
  if (key.length <= 6) return '••••••';
  return `${key.slice(0, 3)}••••••••••••${key.slice(-3)}`;
}

export const TmdbApiKeyCard: React.FC<TmdbApiKeyCardProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [inputKey, setInputKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const key = getStoredTmdbKey();
    setSavedKey(key);
    setInputKey(key);
    setFeedback(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const key = inputKey.trim();
    if (!key) {
      setFeedback({ type: 'error', message: 'Masukkan TMDB API Key terlebih dahulu.' });
      return;
    }
    setStoredTmdbKey(key);
    setSavedKey(key);
    setInputKey(key);
    setFeedback({ type: 'success', message: 'TMDB API Key berhasil disimpan di browser ini.' });
    onKeyUpdated?.();
  };

  const handleClear = () => {
    removeStoredTmdbKey();
    setSavedKey('');
    setInputKey('');
    setFeedback({ type: 'success', message: 'TMDB API Key berhasil dihapus.' });
    onKeyUpdated?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tmdb-settings-title"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="tmdb-settings-title" className="text-lg font-bold text-white">Pengaturan TMDB API</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">API key disimpan hanya di browser Anda.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup pengaturan TMDB" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-3">
            <span className="text-sm font-medium text-slate-300">Status</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${savedKey ? 'text-emerald-400' : 'text-rose-400'}`}>
              {savedKey ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {savedKey ? 'Configured' : 'Not Configured'}
            </span>
          </div>

          <label htmlFor="tmdb-api-key-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">TMDB API Key</label>
          <div className="relative">
            <input
              id="tmdb-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(event) => setInputKey(event.target.value)}
              placeholder="Masukkan API key TMDB"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 pr-11 font-mono text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
            />
            <button type="button" onClick={() => setShowKey((visible) => !visible)} aria-label={showKey ? 'Sembunyikan API key' : 'Tampilkan API key'} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {savedKey && <p className="font-mono text-xs text-slate-500">Key tersimpan: {maskKey(savedKey)}</p>}

          {feedback && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${feedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`} role="status">
              {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {feedback.message}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {savedKey && <button type="button" onClick={handleClear} className="rounded-xl border border-rose-500/40 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/10">Clear Key</button>}
          <button type="button" onClick={handleSave} className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-950/30 hover:bg-purple-500">Validate &amp; Save</button>
        </div>
      </section>
    </div>
  );
};

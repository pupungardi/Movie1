import React, { useMemo } from 'react';
import { parseYapGridUrl, buildYapGridUrl } from '../lib/yapgrid-url';
import { AlertCircle, Link } from 'lucide-react';
import { YapGridPlayer } from './YapGridPlayer';

interface YapGridUrlHandlerProps {
  url: string;
}

export const YapGridUrlHandler: React.FC<YapGridUrlHandlerProps> = ({ url }) => {
  const parsed = useMemo(() => parseYapGridUrl(url), [url]);

  if (!parsed.isValid) {
    return (
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-rose-900/50 shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
          <AlertCircle className="h-6 w-6 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">URL Tidak Valid</h3>
        <p className="text-sm text-slate-400 max-w-md">
          {parsed.error || 'Terjadi kesalahan saat memproses URL embed.'}
        </p>
        <div className="mt-2 bg-slate-900 p-3 rounded-lg text-xs text-slate-500 font-mono break-all max-w-full border border-slate-800">
          {url}
        </div>
      </div>
    );
  }

  // Generate clean URL just for display/debugging purposes
  const cleanUrl = buildYapGridUrl({
    type: parsed.type,
    tmdbId: parsed.tmdbId,
    season: parsed.season,
    episode: parsed.episode,
    subUrl: parsed.subUrl
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* (Opsional) Informasi URL yang telah dibersihkan */}
      <div className="bg-sky-950/20 border border-sky-900/40 p-3 rounded-xl flex items-center gap-3">
        <Link className="h-4 w-4 text-sky-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mb-0.5">URL Berhasil Dibersihkan</span>
          <code className="text-xs text-slate-300 font-mono truncate">
            {cleanUrl}
          </code>
        </div>
      </div>
      
      {/* Re-use our robust YapGridPlayer component with the parsed & validated props */}
      <YapGridPlayer
        tmdbId={parsed.tmdbId}
        type={parsed.type}
        season={parsed.season || undefined}
        episode={parsed.episode || undefined}
        subUrl={parsed.subUrl || undefined}
      />
    </div>
  );
};

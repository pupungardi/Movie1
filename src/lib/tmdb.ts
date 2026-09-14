export interface TmdbValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

/**
 * Validates a TMDB ID against the backend TMDB proxy routes.
 * This ensures we don't expose the TMDB API key to the client.
 */
export async function validateTmdbId(
  tmdbId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): Promise<TmdbValidationResult> {
  try {
    const rawId = String(tmdbId).trim().replace(/^(m-|tv-)/, '');
    
    if (!rawId) {
      return { isValid: false, error: 'ID TMDB tidak boleh kosong' };
    }
    if (rawId.startsWith('http://') || rawId.startsWith('https://') || rawId.includes('yapgrid.com')) {
      return { isValid: false, error: 'ID TMDB tidak boleh berupa URL' };
    }
    if (!/^\d+$/.test(rawId)) {
      return { isValid: false, error: 'ID TMDB harus berupa angka bulat positif (tanpa desimal/negatif)' };
    }
    const numericId = parseInt(rawId, 10);
    if (numericId <= 0) {
      return { isValid: false, error: 'ID TMDB harus berupa angka lebih dari 0' };
    }

    // 1. Validate the main movie/tv item via our backend proxy
    const res = await fetch(`/api/tmdb/item/${type}/${numericId}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        return { 
          isValid: false, 
          error: `TMDB ID ${numericId} tidak ditemukan untuk tipe ${type === 'movie' ? 'Film' : 'TV Series'}` 
        };
      }
      return { isValid: false, error: 'Terjadi kesalahan saat memvalidasi ke server TMDB' };
    }

    const data = await res.json();
    
    // 2. If it's a TV show and season is requested, optionally validate the season
    if (type === 'tv' && season !== undefined) {
      const seasonRes = await fetch(`/api/tmdb/tv/${numericId}/season/${season}`);
      if (!seasonRes.ok) {
         return { isValid: false, error: `Season ${season} tidak ditemukan untuk TV Series ini` };
      }
      
      if (episode !== undefined) {
        const seasonData = await seasonRes.json();
        const epExists = seasonData.episodes?.some((ep: any) => ep.episodeNumber === episode) || 
                         (seasonData.episodeCount && episode <= seasonData.episodeCount);
                         
        if (!epExists) {
          return { 
            isValid: false, 
            error: `Episode ${episode} pada Season ${season} tidak valid atau belum dirilis` 
          };
        }
      }
    }
    
    return { isValid: true, data };
  } catch (err) {
    console.error('TMDB Validation Error:', err);
    return { isValid: false, error: 'Gagal menghubungi server validasi (Network Error)' };
  }
}

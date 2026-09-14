export interface YapGridUrlInfo {
  type: 'movie' | 'tv';
  tmdbId: string;
  season: number | null;
  episode: number | null;
  subUrl: string | null;
  isValid: boolean;
  error: string | null;
}

/**
 * Parses and validates a YapGrid embed URL.
 * Extracts parameters and determines if the URL is valid.
 */
export function parseYapGridUrl(urlStr: string): YapGridUrlInfo {
  const defaultState: YapGridUrlInfo = {
    type: 'movie',
    tmdbId: '',
    season: null,
    episode: null,
    subUrl: null,
    isValid: false,
    error: null,
  };

  if (!urlStr) {
    return { ...defaultState, error: 'URL kosong' };
  }

  try {
    const url = new URL(urlStr);
    
    // Validasi domain (pastikan berasal dari yapgrid.com)
    if (!url.hostname.includes('yapgrid.com')) {
      return { ...defaultState, error: 'URL bukan dari domain yapgrid.com yang valid' };
    }

    const pathParts = url.pathname.split('/').filter(Boolean); // e.g. ['embed', 'movie', '1058424']
    
    if (pathParts[0] !== 'embed') {
      return { ...defaultState, error: 'Format path tidak valid (harus dimulai dengan /embed)' };
    }

    const type = pathParts[1];
    if (type !== 'movie' && type !== 'tv') {
      return { ...defaultState, error: 'Tipe media tidak valid (harus movie atau tv)' };
    }

    const tmdbId = pathParts[2];
    if (!tmdbId || isNaN(Number(tmdbId))) {
      return { ...defaultState, type: type as 'movie' | 'tv', error: 'TMDB ID tidak valid atau bukan angka' };
    }

    let season: number | null = null;
    let episode: number | null = null;

    if (type === 'tv') {
      season = parseInt(pathParts[3], 10);
      episode = parseInt(pathParts[4], 10);

      if (isNaN(season) || isNaN(episode)) {
        return { 
          ...defaultState, 
          type, 
          tmdbId, 
          error: 'Parameter season dan episode wajib ada untuk TV series' 
        };
      }
    }

    // Ekstrak sub_url dari query parameter dan abaikan jika kosong string (e.g. ?sub_url= )
    let subUrl = url.searchParams.get('sub_url');
    if (subUrl && subUrl.trim() === '') {
      subUrl = null;
    }

    return {
      type,
      tmdbId,
      season,
      episode,
      subUrl,
      isValid: true,
      error: null,
    };

  } catch (e) {
    return { ...defaultState, error: 'Format URL tidak valid (malformed URL)' };
  }
}

export interface BuildYapGridUrlParams {
  type: 'movie' | 'tv';
  tmdbId: string | number;
  season?: number | null;
  episode?: number | null;
  subUrl?: string | null;
}

/**
 * Builds a clean YapGrid URL without unnecessary tracking parameters.
 */
export function buildYapGridUrl(params: BuildYapGridUrlParams): string {
  let url = `https://yapgrid.com/embed/${params.type}/${params.tmdbId}`;
  
  if (params.type === 'tv' && params.season != null && params.episode != null) {
    url += `/${params.season}/${params.episode}`;
  }

  if (params.subUrl) {
    url += `?sub_url=${encodeURIComponent(params.subUrl)}`;
  }

  return url;
}

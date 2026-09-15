import { MediaItem, MediaType, Season } from '../types';

const TMDB_API_KEY_STORAGE = 'cinehub.tmdb.apiKey';

export function getStoredTmdbApiKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TMDB_API_KEY_STORAGE)?.trim() || '';
}

export function saveStoredTmdbApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  const value = apiKey.trim();
  if (value) window.localStorage.setItem(TMDB_API_KEY_STORAGE, value);
  else window.localStorage.removeItem(TMDB_API_KEY_STORAGE);
}

export function clearStoredTmdbApiKey(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TMDB_API_KEY_STORAGE);
}

function tmdbHeaders(): HeadersInit {
  const key = getStoredTmdbApiKey();
  return key ? { 'X-TMDB-API-Key': key } : {};
}

export interface TMDBFeedResponse {
  configured: boolean;
  message?: string;
  trending: MediaItem[];
  popularMovies: MediaItem[];
  popularSeries: MediaItem[];
  topRatedMovies: MediaItem[];
  topRatedSeries: MediaItem[];
}

export interface TMDBSearchResponse {
  configured: boolean;
  results: MediaItem[];
  page: number;
  total_pages: number;
}

export interface TMDBConfigResponse {
  configured: boolean;
  message?: string;
}

export async function checkTmdbConfig(): Promise<TMDBConfigResponse> {
  try {
    const res = await fetch('/api/tmdb/config', { headers: tmdbHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { configured: false, message: data.message || 'TMDB tidak dapat dihubungi.' };
    }
    return data;
  } catch {
    return { configured: false, message: 'Tidak dapat terhubung ke server TMDB.' };
  }
}

export async function fetchTmdbFeed(): Promise<TMDBFeedResponse> {
  const res = await fetch('/api/tmdb/feed', { headers: tmdbHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to fetch TMDB feed (status: ${res.status})`);
  }
  return res.json();
}

export async function fetchTmdbMovies(params: {
  category?: string;
  genre?: string;
  page?: number;
} = {}): Promise<TMDBSearchResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.genre && params.genre !== 'All') query.set('genre', params.genre);
  if (params.page) query.set('page', String(params.page));

  const res = await fetch(`/api/tmdb/movies?${query.toString()}`, { headers: tmdbHeaders() });
  if (!res.ok) throw new Error('Failed to fetch movies from TMDB');
  return res.json();
}

export async function fetchTmdbSeries(params: {
  category?: string;
  genre?: string;
  page?: number;
} = {}): Promise<TMDBSearchResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.genre && params.genre !== 'All') query.set('genre', params.genre);
  if (params.page) query.set('page', String(params.page));

  const res = await fetch(`/api/tmdb/series?${query.toString()}`, { headers: tmdbHeaders() });
  if (!res.ok) throw new Error('Failed to fetch series from TMDB');
  return res.json();
}

export async function searchTmdb(
  query: string,
  type: 'all' | 'movie' | 'tv' = 'all',
  page: number = 1
): Promise<TMDBSearchResponse> {
  if (!query.trim()) {
    return { configured: true, results: [], page: 1, total_pages: 0 };
  }

  const searchParams = new URLSearchParams({
    query: query.trim(),
    type,
    page: String(page),
  });

  const res = await fetch(`/api/tmdb/search?${searchParams.toString()}`, { headers: tmdbHeaders() });
  if (!res.ok) throw new Error('Failed to search TMDB');
  return res.json();
}

export async function fetchTmdbItemDetail(type: MediaType, id: string): Promise<MediaItem> {
  const cleanId = id.replace(/^(m-|tv-)/, '');
  const res = await fetch(`/api/tmdb/item/${type}/${cleanId}`, { headers: tmdbHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to fetch details for ${type} ${id}`);
  }
  return res.json();
}

export async function fetchTmdbSeason(tvId: string, seasonNumber: number): Promise<Season> {
  const cleanId = tvId.replace(/^(m-|tv-)/, '');
  const res = await fetch(`/api/tmdb/tv/${cleanId}/season/${seasonNumber}`, { headers: tmdbHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to fetch season ${seasonNumber} for tv ${tvId}`);
  }
  return res.json();
}

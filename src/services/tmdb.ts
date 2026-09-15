import { MediaItem, MediaType, Season } from '../types';

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

const TMDB_LOCAL_STORAGE_KEY = 'tmdb_user_api_key';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();

  if (!contentType.includes('application/json')) {
    throw new Error(
      res.ok
        ? 'Server mengembalikan respons yang tidak valid. Silakan refresh preview.'
        : `Server API tidak ditemukan (status ${res.status}). Silakan refresh preview.`
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('Respons server TMDB bukan JSON yang valid. Silakan refresh preview.');
  }
}

export function getStoredTmdbKey(): string {
  try {
    return localStorage.getItem(TMDB_LOCAL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredTmdbKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(TMDB_LOCAL_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(TMDB_LOCAL_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not save TMDB key to localStorage:', e);
  }
}

export function removeStoredTmdbKey(): void {
  try {
    localStorage.removeItem(TMDB_LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not remove TMDB key from localStorage:', e);
  }
}

export async function checkTmdbConfig(): Promise<{ configured: boolean; maskedKey?: string | null }> {
  try {
    const res = await fetch('/api/tmdb/config');
    if (!res.ok) return { configured: false };
    return await parseJsonResponse<{ configured: boolean; maskedKey?: string | null }>(res);
  } catch {
    return { configured: false };
  }
}

export async function checkTmdbKeyStatus(apiKey?: string): Promise<{ valid: boolean; message: string }> {
  try {
    const res = await fetch('/api/tmdb/check-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || getStoredTmdbKey() || undefined }),
    });
    return await parseJsonResponse<{ valid: boolean; message: string }>(res);
  } catch (err: any) {
    return { valid: false, message: err?.message || 'Gagal menghubungi server' };
  }
}

export async function saveTmdbApiKey(apiKey: string): Promise<{ success: boolean; message: string; maskedKey?: string }> {
  try {
    const cleanKey = apiKey.trim();
    const res = await fetch('/api/tmdb/save-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: cleanKey }),
    });
    const data = await parseJsonResponse<{ success: boolean; message: string; maskedKey?: string }>(res);
    if (data.success) {
      setStoredTmdbKey(cleanKey);
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghubungi server' };
  }
}

export async function clearTmdbApiKey(): Promise<{ success: boolean; message: string }> {
  try {
    removeStoredTmdbKey();
    const res = await fetch('/api/tmdb/clear-key', {
      method: 'POST',
    });
    return await parseJsonResponse<{ success: boolean; message: string }>(res);
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mereset API Key' };
  }
}

export async function fetchTmdbFeed(): Promise<TMDBFeedResponse> {
  const res = await fetch('/api/tmdb/feed');
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

  const res = await fetch(`/api/tmdb/movies?${query.toString()}`);
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

  const res = await fetch(`/api/tmdb/series?${query.toString()}`);
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

  const res = await fetch(`/api/tmdb/search?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to search TMDB');
  return res.json();
}

export async function fetchTmdbItemDetail(type: MediaType, id: string): Promise<MediaItem> {
  const cleanId = id.replace(/^(m-|tv-)/, '');
  const res = await fetch(`/api/tmdb/item/${type}/${cleanId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch details for ${type} ${id}`);
  }
  return res.json();
}

export async function fetchTmdbSeason(tvId: string, seasonNumber: number): Promise<Season> {
  const cleanId = tvId.replace(/^(m-|tv-)/, '');
  const res = await fetch(`/api/tmdb/tv/${cleanId}/season/${seasonNumber}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch season ${seasonNumber} for tv ${tvId}`);
  }
  return res.json();
}

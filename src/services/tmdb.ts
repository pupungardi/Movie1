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

export async function checkTmdbConfig(): Promise<{ configured: boolean }> {
  try {
    const res = await fetch('/api/tmdb/config');
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch {
    return { configured: false };
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

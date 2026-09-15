// TMDB API Service and Data Mapper
// Keeps TMDB_API_KEY secure on the server side

export interface TMDBStreamingPlatform {
  name: string;
  logo: string;
  badgeColor: string;
}

export interface TMDBCastMember {
  name: string;
  character: string;
  avatarUrl: string;
}

export interface TMDBEpisode {
  episodeNumber: number;
  title: string;
  overview: string;
  duration: string;
  stillUrl: string;
  airDate?: string;
  rating?: number;
}

export interface TMDBSeason {
  seasonNumber: number;
  name: string;
  overview?: string;
  posterUrl?: string;
  episodeCount?: number;
  airDate?: string;
  episodes: TMDBEpisode[];
}

export interface MappedMediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  tagline: string;
  overview: string;
  releaseYear: number;
  rating: number;
  voteCount: string;
  runtime: string;
  genres: string[];
  director: string;
  certification: string;
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeId: string;
  streamingPlatforms: TMDBStreamingPlatform[];
  status: string;
  seasonsCount?: number;
  episodesCount?: number;
  seasons?: TMDBSeason[];
  tags: string[];
  cast: TMDBCastMember[];
}

import { AsyncLocalStorage } from 'node:async_hooks';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const tmdbRequestKey = new AsyncLocalStorage<string>();

export function setTmdbRequestKey(apiKey: string | undefined): void {
  if (apiKey) tmdbRequestKey.enterWith(apiKey.trim());
}
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics'
};

export const GENRE_NAME_TO_ID: Record<string, number> = {
  'Action': 28,
  'Adventure': 12,
  'Animation': 16,
  'Comedy': 35,
  'Crime': 80,
  'Documentary': 99,
  'Drama': 18,
  'Family': 10751,
  'Fantasy': 14,
  'History': 36,
  'Horror': 27,
  'Music': 10402,
  'Mystery': 9648,
  'Romance': 10749,
  'Sci-Fi': 878,
  'Thriller': 53,
  'War': 10752,
  'Western': 37
};

export function isTmdbConfigured(apiKey?: string): boolean {
  const key = (apiKey ?? process.env.TMDB_API_KEY ?? '').trim();
  return Boolean(key);
}

function getAuth(apiKey?: string) {
  const rawKey = (apiKey ?? tmdbRequestKey.getStore() ?? process.env.TMDB_API_KEY ?? '').trim();
  if (!rawKey) return null;

  // If provided a v4 Read Access Token (JWT)
  if (rawKey.startsWith('ey') || rawKey.length > 50) {
    return {
      type: 'bearer' as const,
      headers: {
        Authorization: `Bearer ${rawKey}`,
        Accept: 'application/json'
      },
      key: rawKey
    };
  }

  // Standard v3 API Key (32 hex characters)
  return {
    type: 'key' as const,
    headers: {
      Accept: 'application/json'
    },
    key: rawKey
  };
}

export async function fetchTmdb<T = any>(endpoint: string, params: Record<string, string | number> = {}, apiKey?: string): Promise<T> {
  const auth = getAuth(apiKey);
  if (!auth) {
    throw new Error('TMDB_API_KEY is not configured in environment variables');
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  if (auth.type === 'key') {
    url.searchParams.set('api_key', auth.key);
  }

  const res = await fetch(url.toString(), {
    headers: auth.headers
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`TMDB HTTP ${res.status}: ${errorBody || res.statusText}`);
  }

  return res.json();
}

function formatVoteCount(count?: number): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

function formatRuntime(type: 'movie' | 'tv', minutes?: number, seasonsCount?: number): string {
  if (type === 'movie') {
    if (!minutes) return '2h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  const s = seasonsCount || 1;
  return `Season ${s}`;
}

function mapStreamingProviders(watchProviders?: any): TMDBStreamingPlatform[] {
  if (!watchProviders?.results) return [];

  // Prioritize US, then ID, then first available country
  const results = watchProviders.results;
  const region = results.US || results.ID || Object.values(results)[0] as any;
  const flatrate = region?.flatrate || region?.buy || [];

  const platforms: TMDBStreamingPlatform[] = [];
  const seen = new Set<string>();

  for (const prov of flatrate) {
    let name = prov.provider_name;
    if (!name) continue;

    // Filter out / remove "Amazon Prime Video with Ads" or any other "with Ads" variants
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('amazon prime video with ads') ||
      lowerName.includes('prime video with ads') ||
      lowerName.includes('with ads')
    ) {
      continue;
    }

    // Clean and normalize provider names
    if (
      lowerName.includes('prime video') ||
      lowerName.includes('amazon prime') ||
      lowerName === 'amazon video'
    ) {
      name = 'Prime Video';
    }

    if (seen.has(name)) continue;
    seen.add(name);

    let badgeColor = 'bg-slate-700';
    let logo = name.slice(0, 2).toUpperCase();

    const lower = name.toLowerCase();
    if (lower.includes('netflix')) {
      badgeColor = 'bg-rose-600';
      logo = 'N';
    } else if (lower.includes('max') || lower.includes('hbo')) {
      badgeColor = 'bg-indigo-600';
      logo = 'M';
    } else if (lower.includes('prime') || lower.includes('amazon')) {
      badgeColor = 'bg-sky-600';
      logo = 'P';
    } else if (lower.includes('apple')) {
      badgeColor = 'bg-neutral-800';
      logo = '';
    } else if (lower.includes('disney')) {
      badgeColor = 'bg-blue-600';
      logo = 'D+';
    } else if (lower.includes('hulu')) {
      badgeColor = 'bg-emerald-600';
      logo = 'H';
    } else if (lower.includes('paramount')) {
      badgeColor = 'bg-blue-700';
      logo = 'P+';
    } else if (lower.includes('peacock')) {
      badgeColor = 'bg-teal-600';
      logo = 'P';
    }

    platforms.push({ name, logo, badgeColor });
    if (platforms.length >= 4) break;
  }

  return platforms;
}

function extractTrailerId(videos?: any): string {
  if (!videos?.results || !Array.isArray(videos.results)) return '';
  const ytVideos = videos.results.filter((v: any) => v.site === 'YouTube');
  
  // Prefer official trailer
  const officialTrailer = ytVideos.find((v: any) => v.type === 'Trailer' && v.official);
  if (officialTrailer?.key) return officialTrailer.key;

  const anyTrailer = ytVideos.find((v: any) => v.type === 'Trailer');
  if (anyTrailer?.key) return anyTrailer.key;

  const teaser = ytVideos.find((v: any) => v.type === 'Teaser');
  if (teaser?.key) return teaser.key;

  return ytVideos[0]?.key || '';
}

function extractCertification(detail: any, type: 'movie' | 'tv'): string {
  let cert = '';
  if (type === 'movie') {
    const releases = detail.release_dates?.results;
    if (Array.isArray(releases)) {
      const us = releases.find((r: any) => r.iso_3166_1 === 'US');
      if (us && Array.isArray(us.release_dates)) {
        const rated = us.release_dates.find((d: any) => d.certification && d.certification.trim().length > 0);
        if (rated?.certification) cert = rated.certification;
      }
    }
    if (!cert) cert = detail.adult ? 'R' : 'PG-13';
  } else {
    const ratings = detail.content_ratings?.results;
    if (Array.isArray(ratings)) {
      const us = ratings.find((r: any) => r.iso_3166_1 === 'US');
      if (us?.rating && us.rating.trim().length > 0) cert = us.rating;
      if (!cert && ratings[0]?.rating) cert = ratings[0].rating;
    }
    if (!cert) cert = 'TV-14';
  }

  // Clean and normalize certification format
  let cleanCert = cert.trim().replace(/\s*-\s*/g, '-').toUpperCase();
  if (/^TV\s*14$/i.test(cleanCert)) cleanCert = 'TV-14';
  if (/^TV\s*MA$/i.test(cleanCert)) cleanCert = 'TV-MA';
  if (/^TV\s*PG$/i.test(cleanCert)) cleanCert = 'TV-PG';
  if (/^TV\s*G$/i.test(cleanCert)) cleanCert = 'TV-G';
  if (/^TV\s*Y7$/i.test(cleanCert)) cleanCert = 'TV-Y7';
  if (/^PG\s*13$/i.test(cleanCert)) cleanCert = 'PG-13';

  return cleanCert || (type === 'movie' ? 'PG-13' : 'TV-14');
}

// Convert concise TMDB list items (from /trending, /popular, /discover, etc.)
export function mapTmdbItemToMediaItem(item: any, explicitType?: 'movie' | 'tv'): MappedMediaItem {
  const type: 'movie' | 'tv' = explicitType || (item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie');
  const idPrefix = type === 'movie' ? 'm' : 'tv';
  const rawId = item.id;
  const title = item.title || item.name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date || '';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

  const genres: string[] = [];
  if (Array.isArray(item.genre_ids)) {
    for (const gid of item.genre_ids) {
      if (GENRE_MAP[gid]) genres.push(GENRE_MAP[gid]);
    }
  } else if (Array.isArray(item.genres)) {
    for (const g of item.genres) {
      if (g.name) genres.push(g.name);
    }
  }
  if (genres.length === 0) {
    genres.push(type === 'movie' ? 'Cinema' : 'Series');
  }

  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';

  const backdropUrl = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}`
    : posterUrl;

  const rating = item.vote_average ? Number(Number(item.vote_average).toFixed(1)) : 7.5;
  const voteCount = formatVoteCount(item.vote_count);

  const tags = genres.slice(0, 3);
  if (item.popularity && item.popularity > 100) tags.push('Trending');

  return {
    id: `${idPrefix}-${rawId}`,
    title,
    type,
    tagline: item.tagline || (type === 'movie' ? 'Featured Premiere' : 'Original Series'),
    overview: item.overview || 'No overview available.',
    releaseYear: isNaN(releaseYear) ? 2024 : releaseYear,
    rating,
    voteCount,
    runtime: formatRuntime(type, item.runtime, item.number_of_seasons),
    genres,
    director: type === 'movie' ? 'Acclaimed Director' : 'Series Creator',
    certification: item.adult ? 'R' : type === 'movie' ? 'PG-13' : 'TV-14',
    posterUrl,
    backdropUrl,
    trailerYoutubeId: '',
    streamingPlatforms: [
      { name: 'Stream', logo: 'HD', badgeColor: 'bg-rose-600' }
    ],
    status: item.status || 'Released',
    seasonsCount: item.number_of_seasons,
    episodesCount: item.number_of_episodes,
    tags,
    cast: []
  };
}

export function mapTmdbSeason(rawSeason: any, showBackdropUrl?: string): TMDBSeason {
  const episodes: TMDBEpisode[] = Array.isArray(rawSeason.episodes)
    ? rawSeason.episodes.map((ep: any) => {
        const mins = ep.runtime ? Number(ep.runtime) : (rawSeason.episode_run_time?.[0] || 48);
        const duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        const stillUrl = ep.still_path
          ? `${TMDB_IMAGE_BASE}/w500${ep.still_path}`
          : rawSeason.poster_path
          ? `${TMDB_IMAGE_BASE}/w500${rawSeason.poster_path}`
          : showBackdropUrl || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80';

        return {
          episodeNumber: ep.episode_number,
          title: ep.name || `Episode ${ep.episode_number}`,
          overview: ep.overview || 'No overview available for this episode.',
          duration,
          stillUrl,
          airDate: ep.air_date || '',
          rating: ep.vote_average ? Number(Number(ep.vote_average).toFixed(1)) : undefined,
        };
      })
    : [];

  return {
    seasonNumber: rawSeason.season_number ?? 1,
    name: rawSeason.name || `Season ${rawSeason.season_number || 1}`,
    overview: rawSeason.overview || '',
    posterUrl: rawSeason.poster_path ? `${TMDB_IMAGE_BASE}/w500${rawSeason.poster_path}` : undefined,
    episodeCount: rawSeason.episode_count || episodes.length,
    airDate: rawSeason.air_date || '',
    episodes,
  };
}

export async function fetchTmdbSeasonData(seriesId: string | number, seasonNumber: number): Promise<TMDBSeason> {
  const cleanId = String(seriesId).replace(/^(m-|tv-)/, '');
  const data = await fetchTmdb(`/tv/${cleanId}/season/${seasonNumber}`);
  return mapTmdbSeason(data);
}

// Convert rich TMDB detail item (with append_to_response=credits,videos,recommendations,watch/providers,release_dates,content_ratings)
export function mapTmdbDetailToMediaItem(detail: any, explicitType?: 'movie' | 'tv'): MappedMediaItem {
  const type: 'movie' | 'tv' = explicitType || (detail.first_air_date ? 'tv' : 'movie');
  const base = mapTmdbItemToMediaItem(detail, type);

  // Extract director / creator
  let director = base.director;
  if (type === 'movie' && detail.credits?.crew) {
    const dir = detail.credits.crew.find((c: any) => c.job === 'Director');
    if (dir?.name) director = dir.name;
  } else if (type === 'tv') {
    if (Array.isArray(detail.created_by) && detail.created_by.length > 0) {
      director = detail.created_by.map((c: any) => c.name).join(' & ');
    } else if (detail.credits?.crew) {
      const showrunner = detail.credits.crew.find((c: any) => c.job === 'Executive Producer' || c.job === 'Director');
      if (showrunner?.name) director = showrunner.name;
    }
  }

  // Extract cast
  const cast: TMDBCastMember[] = [];
  if (Array.isArray(detail.credits?.cast)) {
    for (const c of detail.credits.cast.slice(0, 10)) {
      cast.push({
        name: c.name,
        character: c.character || 'Supporting Cast',
        avatarUrl: c.profile_path
          ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}`
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      });
    }
  }

  // Extract trailer
  const trailerYoutubeId = extractTrailerId(detail.videos);

  // Extract providers
  const streamingPlatforms = mapStreamingProviders(detail['watch/providers']);
  if (streamingPlatforms.length === 0) {
    streamingPlatforms.push({ name: 'The Movie Database', logo: 'TMDB', badgeColor: 'bg-sky-700' });
  }

  // Extract certification
  const certification = extractCertification(detail, type);

  // Extract seasons and episodes for TV
  const seasons: TMDBSeason[] = [];
  if (type === 'tv' && Array.isArray(detail.seasons)) {
    for (const s of detail.seasons) {
      if (s.season_number === 0 && (!s.episode_count || s.episode_count === 0)) continue;
      
      const count = s.episode_count && s.episode_count > 0 ? s.episode_count : 8;
      const initialEpisodes: TMDBEpisode[] = [];
      
      for (let epNum = 1; epNum <= count; epNum++) {
        initialEpisodes.push({
          episodeNumber: epNum,
          title: epNum === 1 
            ? `${s.name || `Season ${s.season_number}`} Premiere` 
            : `Episode ${epNum}`,
          overview: s.overview || detail.overview || `Episode ${epNum} of ${s.name || `Season ${s.season_number}`}.`,
          duration: '45m',
          stillUrl: s.poster_path ? `${TMDB_IMAGE_BASE}/w500${s.poster_path}` : base.backdropUrl,
          airDate: s.air_date || '',
          rating: base.rating,
        });
      }

      seasons.push({
        seasonNumber: s.season_number,
        name: s.name || `Season ${s.season_number}`,
        overview: s.overview || '',
        posterUrl: s.poster_path ? `${TMDB_IMAGE_BASE}/w500${s.poster_path}` : undefined,
        episodeCount: count,
        airDate: s.air_date || '',
        episodes: initialEpisodes,
      });
    }
  }

  return {
    ...base,
    tagline: detail.tagline || base.tagline,
    director,
    certification,
    trailerYoutubeId: trailerYoutubeId || base.trailerYoutubeId,
    streamingPlatforms,
    status: detail.status || base.status,
    seasonsCount: detail.number_of_seasons || (seasons.length > 0 ? seasons.length : undefined),
    episodesCount: detail.number_of_episodes || (detail.number_of_seasons ? detail.number_of_seasons * 10 : undefined),
    seasons: seasons.length > 0 ? seasons : undefined,
    cast: cast.length > 0 ? cast : base.cast
  };
}

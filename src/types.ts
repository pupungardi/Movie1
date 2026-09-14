export type MediaType = 'movie' | 'tv';

export type WatchStatus = 'want_to_watch' | 'currently_watching' | 'watched';

export interface CastMember {
  name: string;
  character: string;
  avatarUrl: string;
}

export interface Episode {
  episodeNumber: number;
  title: string;
  overview: string;
  duration: string;
  stillUrl: string;
  airDate?: string;
  rating?: number;
}

export interface Season {
  seasonNumber: number;
  name: string;
  overview?: string;
  posterUrl?: string;
  episodeCount?: number;
  airDate?: string;
  episodes: Episode[];
}

export interface StreamingPlatform {
  name: string;
  logo: string;
  badgeColor: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  tagline: string;
  overview: string;
  releaseYear: number;
  rating: number; // 0 - 10
  voteCount: string;
  runtime: string; // e.g. "2h 46m" or "5 Seasons"
  genres: string[];
  director: string; // or Creator for TV
  certification: string; // e.g. "PG-13", "TV-MA", "R"
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeId: string;
  streamingPlatforms: StreamingPlatform[];
  status: string; // "Released", "Returning Series", "Ended"
  seasonsCount?: number;
  episodesCount?: number;
  seasons?: Season[];
  tags: string[];
  cast: CastMember[];
}

export interface WatchlistItem {
  mediaId: string;
  status: WatchStatus;
  userRating?: number; // 1 - 10
  userReview?: string;
  addedAt: string;
  favorite: boolean;
  watchedEpisodes?: Record<string, boolean>; // key: `${seasonNumber}-${episodeNumber}`
  cachedMedia?: MediaItem;
}

export interface FilterState {
  type: 'all' | 'movie' | 'tv';
  genre: string;
  sortBy: 'popularity' | 'rating' | 'newest' | 'title';
  searchQuery: string;
  minRating: number;
  streamingProvider: string;
}

export type AppTab = 'HOME' | 'MOVIE' | 'SEARCH' | 'SERIES' | 'AKUN';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  favoriteGenres: string[];
  joinedDate: string;
  tier: string;
}

export interface AIRecommendation {
  title: string;
  type: MediaType;
  year: number;
  rating: number;
  genres: string[];
  reason: string;
  vibe?: string;
  streamingMatch?: string;
}

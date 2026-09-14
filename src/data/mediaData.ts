import { MediaItem } from '../types';

// Hardcoded dummy data has been removed in favor of live TMDB API integration.
// Movie & TV series catalog is dynamically fetched from TMDB via the backend proxy.
export const MEDIA_DATA: MediaItem[] = [];

export const ALL_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western'
];

export const STREAMING_SERVICES = [
  'All',
  'Netflix',
  'Max',
  'Prime Video',
  'Apple TV+',
  'Disney+',
  'Hulu',
  'Paramount+'
];

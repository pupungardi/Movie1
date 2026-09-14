import { useState, useEffect, useCallback } from 'react';
import { WatchlistItem, WatchStatus, MediaItem } from '../types';

const STORAGE_KEY = 'cinetrack_user_watchlist_v1';

const DEFAULT_INITIAL_WATCHLIST: WatchlistItem[] = [];

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load watchlist from localStorage', e);
    }
    return DEFAULT_INITIAL_WATCHLIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, [items]);

  const isSaved = useCallback((mediaId: string) => {
    return items.some(item => item.mediaId === mediaId);
  }, [items]);

  const isFavorite = useCallback((mediaId: string) => {
    return items.some(item => item.mediaId === mediaId && item.favorite);
  }, [items]);

  const getItem = useCallback((mediaId: string) => {
    return items.find(item => item.mediaId === mediaId);
  }, [items]);

  const toggleWatchlist = useCallback((mediaId: string, defaultStatus: WatchStatus = 'want_to_watch', mediaItem?: MediaItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.mediaId === mediaId);
      if (exists) {
        return prev.filter(i => i.mediaId !== mediaId);
      } else {
        const newItem: WatchlistItem = {
          mediaId,
          status: defaultStatus,
          addedAt: new Date().toISOString(),
          favorite: false,
          watchedEpisodes: {},
          cachedMedia: mediaItem
        };
        return [newItem, ...prev];
      }
    });
  }, []);

  const setWatchStatus = useCallback((mediaId: string, status: WatchStatus, mediaItem?: MediaItem) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status,
          cachedMedia: mediaItem || updated[index].cachedMedia
        };
        return updated;
      } else {
        return [
          {
            mediaId,
            status,
            addedAt: new Date().toISOString(),
            favorite: false,
            watchedEpisodes: {},
            cachedMedia: mediaItem
          },
          ...prev
        ];
      }
    });
  }, []);

  const toggleFavorite = useCallback((mediaId: string, mediaItem?: MediaItem) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          favorite: !updated[index].favorite,
          cachedMedia: mediaItem || updated[index].cachedMedia
        };
        return updated;
      } else {
        return [
          {
            mediaId,
            status: 'want_to_watch',
            addedAt: new Date().toISOString(),
            favorite: true,
            watchedEpisodes: {},
            cachedMedia: mediaItem
          },
          ...prev
        ];
      }
    });
  }, []);

  const setUserRating = useCallback((mediaId: string, rating: number) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], userRating: rating };
        return updated;
      } else {
        return [
          {
            mediaId,
            status: 'watched',
            userRating: rating,
            addedAt: new Date().toISOString(),
            favorite: false,
            watchedEpisodes: {}
          },
          ...prev
        ];
      }
    });
  }, []);

  const setUserReview = useCallback((mediaId: string, review: string) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], userReview: review };
        return updated;
      } else {
        return [
          {
            mediaId,
            status: 'watched',
            userReview: review,
            addedAt: new Date().toISOString(),
            favorite: false,
            watchedEpisodes: {}
          },
          ...prev
        ];
      }
    });
  }, []);

  const toggleEpisodeWatched = useCallback((mediaId: string, seasonNumber: number, episodeNumber: number) => {
    const key = `${seasonNumber}-${episodeNumber}`;
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      if (index >= 0) {
        const item = prev[index];
        const currentWatched = item.watchedEpisodes || {};
        const isWatched = !!currentWatched[key];
        const updatedEpisodes = { ...currentWatched, [key]: !isWatched };
        const updated = [...prev];
        updated[index] = {
          ...item,
          status: 'currently_watching',
          watchedEpisodes: updatedEpisodes
        };
        return updated;
      } else {
        return [
          {
            mediaId,
            status: 'currently_watching',
            addedAt: new Date().toISOString(),
            favorite: false,
            watchedEpisodes: { [key]: true }
          },
          ...prev
        ];
      }
    });
  }, []);

  const markAllEpisodesWatched = useCallback((mediaId: string, seasonNumber: number, episodeNumbers: number[], markWatched: boolean = true) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.mediaId === mediaId);
      const existingItem = index >= 0 ? prev[index] : {
        mediaId,
        status: 'currently_watching' as WatchStatus,
        addedAt: new Date().toISOString(),
        favorite: false,
        watchedEpisodes: {}
      };
      const updatedEpisodes = { ...(existingItem.watchedEpisodes || {}) };
      episodeNumbers.forEach((ep) => {
        if (markWatched) {
          updatedEpisodes[`${seasonNumber}-${ep}`] = true;
        } else {
          delete updatedEpisodes[`${seasonNumber}-${ep}`];
        }
      });
      const updatedItem = {
        ...existingItem,
        status: 'currently_watching' as WatchStatus,
        watchedEpisodes: updatedEpisodes
      };
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = updatedItem;
        return updated;
      }
      return [updatedItem, ...prev];
    });
  }, []);

  const clearLibrary = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    isSaved,
    isFavorite,
    getItem,
    toggleWatchlist,
    setWatchStatus,
    toggleFavorite,
    setUserRating,
    setUserReview,
    toggleEpisodeWatched,
    markAllEpisodesWatched,
    clearLibrary
  };
}

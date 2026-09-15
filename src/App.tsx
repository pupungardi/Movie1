import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { KeyRound, RefreshCw, AlertCircle, CheckCircle2, Film, Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { MovieView } from './components/MovieView';
import { SearchView } from './components/SearchView';
import { SeriesView } from './components/SeriesView';
import { AccountView } from './components/AccountView';
import { MediaModal } from './components/MediaModal';
import { WatchPlayerModal } from './components/WatchPlayerModal';
import { SurpriseMeModal } from './components/SurpriseMeModal';
import { useWatchlist } from './hooks/useWatchlist';
import { MediaItem, AppTab, UserProfile } from './types';
import { fetchTmdbFeed, fetchTmdbItemDetail, getStoredTmdbKey, saveTmdbApiKey } from './services/tmdb';

export default function App() {
  // Navigation State: HOME, MOVIE, SEARCH, SERIES, AKUN
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  
  // Selected Media for Full Modal & Trailer
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [autoPlayTrailer, setAutoPlayTrailer] = useState(false);

  // Full Screen Streaming Player Modal
  const [playerMedia, setPlayerMedia] = useState<{
    media: MediaItem;
    season: number;
    episode: number;
  } | null>(null);

  // Aux Modals
  const [isSurpriseMeOpen, setIsSurpriseMeOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'episodes' | 'review'>('overview');

  // TMDB Feed State
  const [tmdbConfigured, setTmdbConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [trendingItems, setTrendingItems] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularSeries, setPopularSeries] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<MediaItem[]>([]);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Verno',
    email: 'verno7897123@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    favoriteGenres: ['Sci-Fi', 'Drama', 'Thriller'],
    joinedDate: 'September 2024',
    tier: 'VIP Cinephile',
  });

  // Watchlist & Library State Hook
  const {
    items: watchlistItems,
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
    clearLibrary,
  } = useWatchlist();

  // Load Live Data from TMDB Backend Feed
  const loadTmdbCatalog = useCallback(async () => {
    setIsLoading(true);
    setFeedError(null);

    try {
      // If user has stored a custom key locally, sync it to server
      const storedKey = getStoredTmdbKey();
      if (storedKey) {
        try {
          await saveTmdbApiKey(storedKey);
        } catch (syncErr) {
          console.warn('Could not sync stored TMDB key to server:', syncErr);
        }
      }

      const feed = await fetchTmdbFeed();
      setTmdbConfigured(feed.configured);

      if (feed.configured) {
        setTrendingItems(feed.trending || []);
        setPopularMovies(feed.popularMovies || []);
        setPopularSeries(feed.popularSeries || []);
        setTopRatedMovies(feed.topRatedMovies || []);
        setTopRatedSeries(feed.topRatedSeries || []);
      }
    } catch (err: any) {
      console.error('Failed to load TMDB feed:', err);
      setFeedError(err?.message || 'Failed to connect to TMDB');
      setTmdbConfigured(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTmdbCatalog();
  }, [loadTmdbCatalog]);

  // Unified allMedia list deduplicated across trending, movies, and series
  const allMedia = useMemo(() => {
    const map = new Map<string, MediaItem>();
    
    // Insert in priority order
    for (const item of trendingItems) {
      map.set(item.id, item);
    }
    for (const item of popularMovies) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    for (const item of popularSeries) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    for (const item of topRatedMovies) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    for (const item of topRatedSeries) {
      if (!map.has(item.id)) map.set(item.id, item);
    }

    return Array.from(map.values());
  }, [trendingItems, popularMovies, popularSeries, topRatedMovies, topRatedSeries]);

  // Filtered lists for Movie and Series Tabs
  const moviesList = useMemo(() => {
    const list = allMedia.filter((m) => m.type === 'movie');
    return list.length > 0 ? list : popularMovies;
  }, [allMedia, popularMovies]);

  const seriesList = useMemo(() => {
    const list = allMedia.filter((m) => m.type === 'tv');
    return list.length > 0 ? list : popularSeries;
  }, [allMedia, popularSeries]);

  // Spotlight / Featured items for Hero Carousel on HOME
  const featuredItems = useMemo(() => {
    if (trendingItems.length > 0) {
      return trendingItems.slice(0, 6);
    }
    return allMedia.slice(0, 6);
  }, [trendingItems, allMedia]);

  // Open Media Modal with immediate display + progressive background detail fetch
  const handleOpenMedia = async (
    media: MediaItem,
    trailer: boolean = false,
    tab: 'overview' | 'episodes' | 'review' = 'overview'
  ) => {
    setSelectedMedia(media);
    setAutoPlayTrailer(trailer);
    setModalInitialTab(tab);

    // Fetch full TMDB detail in background to get trailers, cast headshots, watch providers, seasons
    try {
      const detailed = await fetchTmdbItemDetail(media.type, media.id);
      setSelectedMedia((prev) => {
        if (prev && prev.id === media.id) {
          return { ...prev, ...detailed };
        }
        return prev;
      });
    } catch (e) {
      // Fallback silently to base media item
      console.warn('Could not fetch deep TMDB detail for item:', media.id, e);
    }
  };

  // Launch Full Streaming Player for Movie or TV Series
  const handlePlayMedia = useCallback(
    (media: MediaItem, season: number = 1, episode: number = 1) => {
      setPlayerMedia({ media, season, episode });
    },
    []
  );

  const selectedMediaUserEntry = selectedMedia ? getItem(selectedMedia.id) : undefined;
  const playerMediaUserEntry = playerMedia ? getItem(playerMedia.media.id) : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation Bar with HOME, MOVIE, SEARCH, SERIES, AKUN */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        libraryCount={watchlistItems.length}
        userProfile={userProfile}
      />

      {/* TMDB API Status Banner if not yet configured */}
      {tmdbConfigured === false && (
        <div className="bg-gradient-to-r from-amber-950/80 via-rose-950/70 to-slate-900 border-b border-amber-500/30 px-4 py-3 text-xs sm:text-sm">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-200">
              <KeyRound className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>TMDB API Key Diperlukan:</strong> Masukkan <code>TMDB_API_KEY</code> pada pengaturan secrets untuk memuat katalog film, trailer resmi, pemeran, dan serial live langsung dari The Movie Database.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('AKUN')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer border border-slate-700"
              >
                <span>Pengaturan API Key</span>
              </button>
              <button
                onClick={loadTmdbCatalog}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Menghubungkan...' : 'Cek Status TMDB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View by Active Tab */}
      <main className="flex-1">
        {/* 1. HOME TAB */}
        {activeTab === 'HOME' && (
          <HomeView
            featuredItems={featuredItems}
            allMedia={allMedia}
            watchlistItems={watchlistItems}
            onSelectMedia={handleOpenMedia}
            onPlayMedia={handlePlayMedia}
            isSaved={isSaved}
            isFavorite={isFavorite}
            onToggleWatchlist={toggleWatchlist}
            onToggleFavorite={toggleFavorite}
            onNavigateTab={setActiveTab}
            onOpenSurpriseMe={() => setIsSurpriseMeOpen(true)}
          />
        )}

        {/* 2. MOVIE TAB */}
        {activeTab === 'MOVIE' && (
          <MovieView
            movies={moviesList}
            onSelectMedia={handleOpenMedia}
            onPlayMedia={handlePlayMedia}
            isSaved={isSaved}
            isFavorite={isFavorite}
            onToggleWatchlist={toggleWatchlist}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* 3. SEARCH TAB */}
        {activeTab === 'SEARCH' && (
          <SearchView
            allMedia={allMedia}
            onSelectMedia={handleOpenMedia}
            onPlayMedia={handlePlayMedia}
            isSaved={isSaved}
            isFavorite={isFavorite}
            onToggleWatchlist={toggleWatchlist}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* 4. SERIES TAB */}
        {activeTab === 'SERIES' && (
          <SeriesView
            series={seriesList}
            onSelectMedia={handleOpenMedia}
            onPlayMedia={handlePlayMedia}
            isSaved={isSaved}
            isFavorite={isFavorite}
            onToggleWatchlist={toggleWatchlist}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* 5. AKUN TAB */}
        {activeTab === 'AKUN' && (
          <AccountView
            userProfile={userProfile}
            onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
            watchlistItems={watchlistItems}
            allMedia={allMedia}
            onSelectMedia={(m) => handleOpenMedia(m, false)}
            onPlayMedia={handlePlayMedia}
            onToggleWatchlist={toggleWatchlist}
            onSetWatchStatus={setWatchStatus}
            onToggleFavorite={toggleFavorite}
            onNavigateToBrowse={() => setActiveTab('HOME')}
            onClearLibrary={clearLibrary}
            onKeyUpdated={loadTmdbCatalog}
          />
        )}
      </main>

      {/* Media Detail & Trailer Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          allMedia={allMedia}
          onClose={() => setSelectedMedia(null)}
          onPlayMedia={handlePlayMedia}
          isSaved={isSaved(selectedMedia.id)}
          isFavorite={isFavorite(selectedMedia.id)}
          userRating={selectedMediaUserEntry?.userRating}
          userReview={selectedMediaUserEntry?.userReview}
          watchedEpisodes={selectedMediaUserEntry?.watchedEpisodes}
          onToggleWatchlist={toggleWatchlist}
          onSetWatchStatus={setWatchStatus}
          onToggleFavorite={toggleFavorite}
          onSetUserRating={setUserRating}
          onSetUserReview={setUserReview}
          onToggleEpisodeWatched={toggleEpisodeWatched}
          onMarkAllEpisodesWatched={markAllEpisodesWatched}
          onSelectRelated={(rel) => handleOpenMedia(rel, false)}
          initialTrailerOpen={autoPlayTrailer}
          initialTab={modalInitialTab}
        />
      )}

      {/* Full Watch Video Player Modal */}
      {playerMedia && (
        <WatchPlayerModal
          media={playerMedia.media}
          initialSeason={playerMedia.season}
          initialEpisode={playerMedia.episode}
          onClose={() => setPlayerMedia(null)}
          watchedEpisodes={playerMediaUserEntry?.watchedEpisodes}
          onToggleEpisodeWatched={toggleEpisodeWatched}
          onOpenTrailer={() => {
            const target = playerMedia.media;
            setPlayerMedia(null);
            handleOpenMedia(target, true);
          }}
        />
      )}

      {/* Surprise Me Reel Spinner Modal */}
      <SurpriseMeModal
        isOpen={isSurpriseMeOpen}
        allMedia={allMedia}
        onClose={() => setIsSurpriseMeOpen(false)}
        onSelectMedia={handleOpenMedia}
      />

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        libraryCount={watchlistItems.length}
      />

      {/* Footer (hidden on small mobile to give room for BottomNav) */}
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CineHub</span>
            <span>•</span>
            <span>Powered by The Movie Database (TMDB) API</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Logged in as {userProfile.email}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

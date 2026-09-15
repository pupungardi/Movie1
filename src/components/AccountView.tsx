import React, { useState, useMemo } from 'react';
import {
  User,
  Bookmark,
  Heart,
  Star,
  Settings,
  Clock,
  Film,
  Tv,
  CheckCircle2,
  Trash2,
  Download,
  ShieldCheck,
  Sparkles,
  Edit3,
  LogOut,
  Eye,
  Play,
  Search
} from 'lucide-react';
import { UserProfile, WatchlistItem, WatchStatus, MediaItem } from '../types';
import { fetchTmdbItemDetail } from '../services/tmdb';
import { TmdbApiKeyCard } from './TmdbApiKeyCard';

interface AccountViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  watchlistItems: WatchlistItem[];
  allMedia?: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onPlayMedia?: (media: MediaItem, season?: number, episode?: number) => void;
  onToggleWatchlist: (id: string) => void;
  onSetWatchStatus: (id: string, status: WatchStatus) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateToBrowse: () => void;
  onClearLibrary: () => void;
  onKeyUpdated?: () => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
];

export const AccountView: React.FC<AccountViewProps> = ({
  userProfile,
  onUpdateProfile,
  watchlistItems,
  allMedia = [],
  onSelectMedia,
  onPlayMedia,
  onToggleWatchlist,
  onSetWatchStatus,
  onToggleFavorite,
  onNavigateToBrowse,
  onClearLibrary,
  onKeyUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'reviews' | 'progress' | 'direct' | 'settings'>('library');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatarUrl);

  // Direct Play State
  const [dpType, setDpType] = useState<'movie' | 'tv'>('movie');
  const [dpTmdbId, setDpTmdbId] = useState('');
  const [dpSeason, setDpSeason] = useState('1');
  const [dpEpisode, setDpEpisode] = useState('1');
  const [dpLoading, setDpLoading] = useState(false);
  const [dpError, setDpError] = useState<string | null>(null);

  const handleDirectPlay = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = dpTmdbId.trim();
    
    if (!rawId) {
      setDpError('ID TMDB tidak boleh kosong.');
      return;
    }
    if (rawId.startsWith('http://') || rawId.startsWith('https://') || rawId.includes('yapgrid.com')) {
      setDpError('ID TMDB tidak boleh berupa URL.');
      return;
    }
    if (!/^\d+$/.test(rawId)) {
      setDpError('ID TMDB harus berupa angka bulat positif (tanpa desimal atau negatif).');
      return;
    }
    const numericId = parseInt(rawId, 10);
    if (numericId <= 0) {
      setDpError('ID TMDB harus bernilai lebih dari 0.');
      return;
    }

    setDpLoading(true);
    setDpError(null);
    try {
      const media = await fetchTmdbItemDetail(dpType, numericId.toString());
      
      if (onPlayMedia) {
        if (dpType === 'tv') {
          onPlayMedia(media, parseInt(dpSeason, 10) || 1, parseInt(dpEpisode, 10) || 1);
        } else {
          onPlayMedia(media);
        }
      }
    } catch (err: any) {
      setDpError(err.message || 'Media tidak ditemukan dengan ID tersebut.');
    } finally {
      setDpLoading(false);
    }
  };

  // Map watchlist items with media details
  const enrichedItems = useMemo(() => {
    return watchlistItems
      .map((entry) => {
        const media = entry.cachedMedia || allMedia.find((m) => m.id === entry.mediaId);
        if (!media) {
          // If not yet fetched, provide minimal placeholder
          const fallbackMedia: MediaItem = {
            id: entry.mediaId,
            title: `Title #${entry.mediaId.replace(/^(m-|tv-)/, '')}`,
            type: entry.mediaId.startsWith('tv-') ? 'tv' : 'movie',
            tagline: '',
            overview: '',
            releaseYear: 2024,
            rating: 8.0,
            voteCount: '1K',
            runtime: '2h',
            genres: ['Cinema'],
            director: 'Unknown',
            certification: 'PG-13',
            posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80',
            backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
            trailerYoutubeId: '',
            streamingPlatforms: [],
            status: 'Released',
            tags: ['Saved'],
            cast: []
          };
          return { ...entry, media: fallbackMedia };
        }
        return {
          ...entry,
          media,
        };
      })
      .filter(Boolean) as (WatchlistItem & { media: MediaItem })[];
  }, [watchlistItems, allMedia]);

  // Compute Account Stats
  const stats = useMemo(() => {
    const total = enrichedItems.length;
    const completedMovies = enrichedItems.filter((i) => i.media.type === 'movie' && i.status === 'watched').length;
    const tvSeriesTracked = enrichedItems.filter((i) => i.media.type === 'tv').length;
    
    let totalEpisodesWatched = 0;
    enrichedItems.forEach((item) => {
      if (item.watchedEpisodes) {
        totalEpisodesWatched += Object.values(item.watchedEpisodes).filter(Boolean).length;
      }
    });

    const reviewsCount = enrichedItems.filter((i) => i.userReview && i.userReview.trim().length > 0).length;
    const ratingsCount = enrichedItems.filter((i) => i.userRating && i.userRating > 0).length;

    return {
      total,
      completedMovies,
      tvSeriesTracked,
      totalEpisodesWatched,
      reviewsCount,
      ratingsCount,
    };
  }, [enrichedItems]);

  // Export User Library as JSON file
  const handleExportData = () => {
    const dataToExport = {
      profile: userProfile,
      watchlist: watchlistItems,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinehub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: nameInput.trim() || 'Cinephile',
      avatarUrl: selectedAvatar,
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20 md:pb-12">
      
      {/* Account Profile Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/30 p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-rose-500/80 shadow-lg shadow-rose-950/40"
              />
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white border border-slate-700 hover:bg-rose-600 transition-colors shadow-md"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {userProfile.name}
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-300 border border-rose-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  VIP Member
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                {userProfile.email}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                <span>Joined {userProfile.joinedDate}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{userProfile.tier}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={handleExportData}
              title="Export Watchlist Data"
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Drawer */}
        {isEditingProfile && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white border border-slate-700 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Avatar
                </label>
                <div className="flex items-center gap-2">
                  {AVATARS.map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt={`Avatar choice ${idx}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`h-9 w-9 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        selectedAvatar === avatar
                          ? 'border-rose-500 scale-110'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleSaveProfile}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Watchlist</span>
          <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Saved titles</span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Movies Watched</span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.completedMovies}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Feature films</span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">TV Shows</span>
          <span className="text-2xl font-black text-sky-400 mt-1 block">{stats.tvSeriesTracked}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">In your tracker</span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Episodes Tracked</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">{stats.totalEpisodesWatched}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Marked completed</span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Ratings Given</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.ratingsCount}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">1-10 stars</span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Reviews Written</span>
          <span className="text-2xl font-black text-purple-400 mt-1 block">{stats.reviewsCount}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Personal critiques</span>
        </div>
      </div>

      {/* Account Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 pb-2.5 -mb-px border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'library'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Watchlist & Library ({stats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-1.5 pb-2.5 -mb-px border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>My Ratings & Reviews ({stats.ratingsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-1.5 pb-2.5 -mb-px border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'progress'
              ? 'border-sky-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="h-4 w-4" />
          <span>TV Episode Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-1.5 pb-2.5 -mb-px border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'direct'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="h-4 w-4" />
          <span>Direct Stream</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 pb-2.5 -mb-px border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings & Data</span>
        </button>
      </div>

      {/* Subtab 1: Watchlist & Library */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {enrichedItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-3">
              <Bookmark className="mx-auto h-8 w-8 text-slate-500" />
              <h3 className="text-base font-semibold text-white">Your watchlist is currently empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore movies and series from the catalog and click the bookmark button to save them to your profile.
              </p>
              <button
                onClick={onNavigateToBrowse}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Browse Trending Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichedItems.map((item) => {
                const media = item.media;
                return (
                  <div
                    key={item.mediaId}
                    className="flex overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-3 gap-3"
                  >
                    <img
                      src={media.posterUrl}
                      alt={media.title}
                      onClick={() => onSelectMedia(media)}
                      className="h-28 w-20 rounded-xl object-cover cursor-pointer flex-shrink-0"
                    />

                    <div className="flex flex-1 flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              media.type === 'movie'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-sky-950 text-sky-300 border border-sky-800'
                            }`}
                          >
                            {media.type === 'movie' ? 'Movie' : 'Series'}
                          </span>

                          <button
                            onClick={() => onToggleFavorite(media.id)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Heart className={`h-4 w-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>

                        <h3
                          onClick={() => onSelectMedia(media)}
                          className="text-sm font-bold text-white truncate cursor-pointer hover:text-rose-400 mt-1"
                        >
                          {media.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{media.releaseYear}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">★ {media.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onPlayMedia ? onPlayMedia(media) : onSelectMedia(media)}
                            title="Play Now / Nonton"
                            className="flex items-center gap-1 rounded-md bg-gradient-to-r from-rose-600 to-amber-600 px-2 py-0.5 text-[10px] font-bold text-white hover:brightness-110 shadow-sm transition-all"
                          >
                            <Play className="h-3 w-3 fill-white" />
                            <span>Play</span>
                          </button>

                          <select
                            value={item.status}
                            onChange={(e) => onSetWatchStatus(media.id, e.target.value as WatchStatus)}
                            className="rounded-md bg-slate-950 text-[10px] text-slate-300 px-2 py-0.5 border border-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value="want_to_watch">Plan</option>
                            <option value="currently_watching">Watching</option>
                            <option value="watched">Done</option>
                          </select>
                        </div>

                        <button
                          onClick={() => onToggleWatchlist(media.id)}
                          title="Remove"
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {enrichedItems.filter((i) => i.userRating || i.userReview).length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-2">
              <Star className="mx-auto h-8 w-8 text-amber-500" />
              <h3 className="text-base font-semibold text-white">No ratings or reviews added yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click on any movie or TV series card and open the "My Rating & Notes" tab to rate out of 10 and write your thoughts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrichedItems
                .filter((i) => i.userRating || i.userReview)
                .map((item) => (
                  <div
                    key={item.mediaId}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.media.posterUrl}
                        alt={item.media.title}
                        className="h-16 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.media.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.userRating ? (
                            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                              Your Rating: ★ {item.userRating} / 10
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Unrated</span>
                          )}
                          <span className="text-xs text-slate-500">
                            IMDb: {item.media.rating.toFixed(1)}
                          </span>
                        </div>
                        {item.userReview && (
                          <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            "{item.userReview}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectMedia(item.media)}
                      className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700"
                    >
                      Edit Notes
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: TV Episode Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {enrichedItems.filter((i) => i.media.type === 'tv').length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center space-y-2">
              <Tv className="mx-auto h-8 w-8 text-sky-500" />
              <h3 className="text-base font-semibold text-white">No TV Series in your tracker</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add shows like Severance, Breaking Bad, or Arcane to start tracking your season and episode progress!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrichedItems
                .filter((i) => i.media.type === 'tv')
                .map((item) => {
                  const media = item.media;
                  const watchedCount = item.watchedEpisodes
                    ? Object.values(item.watchedEpisodes).filter(Boolean).length
                    : 0;
                  const totalCount = media.episodesCount || 10;
                  const percent = Math.min(100, Math.round((watchedCount / totalCount) * 100));

                  return (
                    <div
                      key={item.mediaId}
                      className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={media.posterUrl}
                            alt={media.title}
                            className="h-14 w-10 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">{media.title}</h4>
                            <span className="text-xs text-slate-400">
                              Season {media.seasonsCount || 1} • {totalCount} Episodes
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectMedia(media)}
                          className="rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600/30"
                        >
                          Checklist
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Progress: {percent}%</span>
                          <span>{watchedCount} / {totalCount} eps</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Direct Stream */}
      {activeTab === 'direct' && (
        <div className="space-y-6 max-w-2xl">
          <form onSubmit={handleDirectPlay} className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-500" />
                Direct Stream (TMDB ID)
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Masukkan ID TMDB untuk langsung memutar film atau TV series melalui pemutar YapGrid secara instan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Tipe Media</label>
                <select
                  value={dpType}
                  onChange={(e) => setDpType(e.target.value as 'movie' | 'tv')}
                  className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="movie">Film (Movie)</option>
                  <option value="tv">TV Series</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">TMDB ID</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 1058424"
                  value={dpTmdbId}
                  onChange={(e) => setDpTmdbId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white border border-slate-700 focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {dpType === 'tv' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Season</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dpSeason}
                    onChange={(e) => setDpSeason(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Episode</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dpEpisode}
                    onChange={(e) => setDpEpisode(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {dpError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                {dpError}
              </div>
            )}

            <button
              type="submit"
              disabled={dpLoading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dpLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mencari Media...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Mainkan Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Subtab 5: Settings & Data Management */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          {/* TMDB API Key Card - exact replica of user settings */}
          <TmdbApiKeyCard onKeyUpdated={onKeyUpdated} />

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Data & Storage
            </h3>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-white block">Download Library JSON</span>
                <span className="text-[11px] text-slate-400">Backup your watchlists, ratings, and notes</span>
              </div>
              <button
                onClick={handleExportData}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Export
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-rose-400 block">Clear Watchlist Data</span>
                <span className="text-[11px] text-slate-400">Reset saved titles and episode tracking locally</span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your saved watchlist?')) {
                    onClearLibrary();
                  }
                }}
                className="rounded-xl bg-rose-950/60 border border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

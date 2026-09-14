import React from 'react';
import { Home, Film, Search, Tv, User } from 'lucide-react';
import { AppTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  libraryCount: number;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  libraryCount,
  userProfile,
}) => {
  const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'HOME', label: 'HOME', icon: Home },
    { id: 'MOVIE', label: 'MOVIE', icon: Film },
    { id: 'SEARCH', label: 'SEARCH', icon: Search },
    { id: 'SERIES', label: 'SERIES', icon: Tv },
    { id: 'AKUN', label: 'AKUN', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            id="nav-logo-btn"
            onClick={() => setActiveTab('HOME')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform duration-200">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Cine<span className="text-rose-500">Hub</span>
              </span>
            </div>
          </button>
        </div>

        {/* 5 Main Tabs (Desktop / Tablet Navigation) */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-900/95 p-1.5 border border-slate-800 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id.toLowerCase()}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {/* Watchlist badge on AKUN */}
                {item.id === 'AKUN' && libraryCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-slate-950 text-rose-300' : 'bg-rose-500 text-white'
                  }`}>
                    {libraryCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools (User Profile Shortcut) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* User Avatar (Opens AKUN) */}
          <button
            id="nav-user-profile-btn"
            onClick={() => setActiveTab('AKUN')}
            title="Open Akun Profile"
            className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all ${
              activeTab === 'AKUN'
                ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500'
                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="h-7 w-7 rounded-full object-cover border border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-200 hidden xl:inline">
              {userProfile.name}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};

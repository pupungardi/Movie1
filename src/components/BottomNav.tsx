import React from 'react';
import { Home, Film, Search, Tv, User } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  libraryCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  libraryCount,
}) => {
  const items: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'MOVIE', label: 'Movie', icon: Film },
    { id: 'SEARCH', label: 'Search', icon: Search },
    { id: 'SERIES', label: 'Series', icon: Tv },
    { id: 'AKUN', label: 'Akun', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 transition-all ${
                isActive ? 'text-rose-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-rose-500' : 'text-slate-400'}`} />
                {item.id === 'AKUN' && libraryCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                    {libraryCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wide mt-1 uppercase font-semibold">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-6 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

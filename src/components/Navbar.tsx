import React from 'react';
import { User } from '../types';
import { Disc3, Shield, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentTab: 'playlists' | 'tickets' | 'host' | 'player' | 'admin' | 'bigscreen';
  setCurrentTab: (tab: 'playlists' | 'tickets' | 'host' | 'player' | 'admin' | 'bigscreen') => void;
  currentUser: User;
  onOpenAuth: () => void;
  onOpenPayment: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onOpenPayment,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <div 
          onClick={() => setCurrentTab('playlists')}
          className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <Disc3 className="w-5 h-5 text-white animate-spin [animation-duration:8s]" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              BeatBingo
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single line, unboxed, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setCurrentTab('playlists')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'playlists' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Playlist Builder
          </button>
          <button
            onClick={() => setCurrentTab('tickets')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'tickets' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Ticket Generator
          </button>
          <button
            onClick={() => setCurrentTab('host')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'host' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Host Game
          </button>
          <button
            onClick={() => setCurrentTab('player')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentTab === 'player' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Player Ticket
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 ${
              currentTab === 'admin' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Admin & Payments
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {!currentUser.isPaid ? (
            <button
              onClick={onOpenPayment}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Unlock Full Access · £25
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
            </button>
          )}

          <button
            onClick={onOpenAuth}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg"
            title="Account"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar below header */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-900 px-2 py-2 text-xs bg-slate-950">
        <button
          onClick={() => setCurrentTab('playlists')}
          className={`py-1 px-2 ${currentTab === 'playlists' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Playlists
        </button>
        <button
          onClick={() => setCurrentTab('tickets')}
          className={`py-1 px-2 ${currentTab === 'tickets' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Tickets
        </button>
        <button
          onClick={() => setCurrentTab('host')}
          className={`py-1 px-2 ${currentTab === 'host' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Host
        </button>
        <button
          onClick={() => setCurrentTab('player')}
          className={`py-1 px-2 ${currentTab === 'player' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Player
        </button>
        <button
          onClick={() => setCurrentTab('admin')}
          className={`py-1 px-2 ${currentTab === 'admin' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
        >
          Admin
        </button>
      </div>
    </header>
  );
};

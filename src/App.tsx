import React, { useState, useEffect, useCallback } from 'react';
import { User, Playlist, BingoGame, BingoTicket } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { PlaylistBuilder } from './components/PlaylistBuilder';
import { TicketGenerator } from './components/TicketGenerator';
import { HostGameView } from './components/HostGameView';
import { BigScreenView } from './components/BigScreenView';
import { DigitalPlayerTicket } from './components/DigitalPlayerTicket';
import { AdminDashboard } from './components/AdminDashboard';
import { PaymentModal } from './components/PaymentModal';
import { PaymentSetupGuideModal } from './components/PaymentSetupGuideModal';
import { AuthModal } from './components/AuthModal';
import { 
  Play, Users, Sparkles, Tv, ArrowRight, ShieldCheck, 
  Disc3, HelpCircle, Music2, CheckCircle2 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'playlists' | 'tickets' | 'host' | 'player' | 'admin' | 'bigscreen'>('playlists');
  
  // Initialize activeGame safely without calling setState during render
  const [activeGame, setActiveGame] = useState<BingoGame>(() => {
    const existing = storageService.getGames();
    if (existing.length > 0) return existing[0];
    const pl = storageService.getPlaylists()[0];
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    const initialGame: BingoGame = {
      id: `game_${Date.now()}`,
      pin: newPin,
      title: `${pl.title} Live Bingo`,
      playlistId: pl.id,
      playlist: pl,
      hostId: 'user_admin_1',
      hostName: 'Bob Hope (Admin)',
      status: 'lobby',
      gridSize: 5,
      maxTickets: 200,
      calledTrackIds: [],
      currentTrackId: null,
      currentTrackStartedAt: null,
      mysteryMode: false,
      isMysteryRevealed: true,
      claims: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activePatternGoal: 'any',
      ticketPrice: 2.0,
      currency: '£',
    };
    storageService.saveGame(initialGame);
    return initialGame;
  });

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Query parameters parsing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pinParam = params.get('pin');
      const viewParam = params.get('view');

      if (pinParam) {
        const game = storageService.getGames().find((g) => g.pin === pinParam);
        if (game) {
          setActiveGame(game);
        }
        if (viewParam === 'bigscreen') {
          setCurrentTab('bigscreen');
        } else {
          setCurrentTab('player');
        }
      }
    }
  }, []);

  // Listen for user updates
  useEffect(() => {
    const unsub = storageService.subscribe('USER_UPDATED', (payload: unknown) => {
      if (payload) setCurrentUser(payload as User);
    });
    return () => unsub();
  }, []);

  const createGame = useCallback((playlist?: Playlist, ticketPrice: number = 2.0): BingoGame => {
    const pl = playlist || storageService.getPlaylists()[0];
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    const newGame: BingoGame = {
      id: `game_${Date.now()}`,
      pin: newPin,
      title: `${pl.title} Live Bingo`,
      playlistId: pl.id,
      playlist: pl,
      hostId: currentUser.id,
      hostName: currentUser.name,
      status: 'lobby',
      gridSize: 5,
      maxTickets: currentUser.isPaid ? 200 : 5,
      calledTrackIds: [],
      currentTrackId: null,
      currentTrackStartedAt: null,
      mysteryMode: false,
      isMysteryRevealed: true,
      claims: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activePatternGoal: 'any',
      ticketPrice,
      currency: '£',
    };
    storageService.saveGame(newGame);
    return newGame;
  }, [currentUser]);

  const handleLaunchGame = useCallback((playlist: Playlist) => {
    const game = createGame(playlist);
    setActiveGame(game);
    setCurrentTab('host');
  }, [createGame]);

  const handleLaunchGameWithTickets = useCallback((playlist: Playlist, tickets: BingoTicket[], ticketPrice?: number) => {
    const game = createGame(playlist, ticketPrice ?? 2.0);
    storageService.saveTickets(game.id, tickets);
    setActiveGame(game);
    setCurrentTab('host');
  }, [createGame]);

  const handleUpdateGame = useCallback((updated: BingoGame) => {
    setActiveGame(updated);
  }, []);

  // Big screen full-viewport view
  if (currentTab === 'bigscreen') {
    return (
      <BigScreenView
        game={activeGame}
        onClose={() => setCurrentTab('host')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPayment={() => setIsPaymentOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section displayed on playlists landing tab */}
        {currentTab === 'playlists' && (
          <div className="relative border-b border-slate-800/80 overflow-hidden bg-slate-950">
            {/* Visual hero split */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Musical Bingo · Spotify & Apple Music Ready
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Turn Any Song Playlist Into A Live Bingo Party.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                  Generate up to <strong>200 unique tickets</strong> for your venue or party. Call songs with 30-second audio previews, broadcast to the <strong>Big Screen</strong> with mystery song reveal, and verify winners instantly on phone or print.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentTab('host')}
                    className="px-5 py-3 text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-xl hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Launch Live Game
                  </button>

                  <button
                    onClick={() => setCurrentTab('tickets')}
                    className="px-4 py-3 text-xs sm:text-sm font-bold text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    Generate 200 Tickets
                  </button>

                  <button
                    onClick={() => setIsGuideOpen(true)}
                    className="px-4 py-3 text-xs sm:text-sm font-medium text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Payment & Hosting Help
                  </button>
                </div>

                {/* Trust bar */}
                <div className="flex items-center gap-4 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    One-off £25 fee or Free Trial
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    PayPal Direct Payments
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Up to 200 Players
                  </span>
                </div>
              </div>

              {/* Right Hero Image Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl group">
                  <img
                    src="/src/assets/images/hero_music_bingo_1792239984397.jpg"
                    alt="Live Musical Bingo Party Crowd"
                    referrerPolicy="no-referrer"
                    className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-102 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-5">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400 tracking-wider">
                      Live Venue Experience
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Pubs · Parties · Corporate Events · Festivals
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Routers */}
        {currentTab === 'playlists' && (
          <PlaylistBuilder
            currentUser={currentUser}
            onLaunchGame={handleLaunchGame}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        )}

        {currentTab === 'tickets' && (
          <TicketGenerator
            currentUser={currentUser}
            onOpenPayment={() => setIsPaymentOpen(true)}
            onLaunchGameWithTickets={handleLaunchGameWithTickets}
          />
        )}

        {currentTab === 'host' && (
          <HostGameView
            game={activeGame}
            onUpdateGame={handleUpdateGame}
            onOpenBigScreen={() => setCurrentTab('bigscreen')}
          />
        )}

        {currentTab === 'player' && (
          <DigitalPlayerTicket
            initialPin={activeGame?.pin || ''}
            initialTicketNumber={1}
            onBackToLobby={() => setCurrentTab('playlists')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenPaymentGuide={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">BeatBingo Platform</span>
            <span>·</span>
            <span>One-Off £25 Lifetime Host License</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Payment Setup & Hosting Guide
            </button>
            <span>·</span>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Pricing & License (£25)
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Switch Account
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        currentUser={currentUser}
        onSuccess={(updated) => setCurrentUser(updated)}
        onOpenGuide={() => {
          setIsPaymentOpen(false);
          setIsGuideOpen(true);
        }}
      />

      <PaymentSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenAdminSettings={() => {
          setIsGuideOpen(false);
          setCurrentTab('admin');
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChanged={(updated) => setCurrentUser(updated)}
        onOpenPayment={() => {
          setIsAuthOpen(false);
          setIsPaymentOpen(true);
        }}
      />
    </div>
  );
}

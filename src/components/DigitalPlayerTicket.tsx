import React, { useState, useEffect } from 'react';
import { BingoGame, BingoTicket, BingoSquare, BingoClaim } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { BingoEngine } from '../services/bingoEngine';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Check, ListMusic, Trophy, PartyPopper, 
  HelpCircle, AlertCircle, ArrowLeft, RotateCcw, Coins 
} from 'lucide-react';

interface DigitalPlayerTicketProps {
  initialPin?: string;
  initialTicketNumber?: number;
  onBackToLobby?: () => void;
}

export const DigitalPlayerTicket: React.FC<DigitalPlayerTicketProps> = ({
  initialPin = '',
  initialTicketNumber = 1,
  onBackToLobby,
}) => {
  const [pinInput, setPinInput] = useState<string>(initialPin);
  const [ticketInput, setTicketInput] = useState<number>(initialTicketNumber);
  const [playerName, setPlayerName] = useState<string>('Player');
  const [activeGame, setActiveGame] = useState<BingoGame | null>(null);
  const [playerTicket, setPlayerTicket] = useState<BingoTicket | null>(null);
  const [markedKeys, setMarkedKeys] = useState<Set<string>>(new Set());
  const [hasClaimedBingo, setHasClaimedBingo] = useState<boolean>(false);
  const [showHistorySheet, setShowHistorySheet] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync game in real-time
  useEffect(() => {
    if (!activeGame) return;
    const unsub = storageService.subscribe('GAME_UPDATED', (payload: unknown) => {
      const g = payload as BingoGame;
      if (g.id === activeGame.id) {
        setActiveGame(g);
      }
    });
    return () => unsub();
  }, [activeGame?.id]);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPin = pinInput.trim();
    const game = storageService.getGames().find((g) => g.pin === cleanPin);

    if (!game) {
      setErrorMsg(`No active game found with PIN ${cleanPin}. Please ask the host for the correct PIN.`);
      return;
    }

    // Retrieve or generate ticket for this player
    let tickets = storageService.getTickets(game.id);
    if (tickets.length === 0) {
      // Auto generate tickets if not created yet
      tickets = BingoEngine.generateTicketBatch(
        game.id,
        game.title,
        game.playlist.tracks,
        game.maxTickets,
        game.gridSize
      );
      storageService.saveTickets(game.id, tickets);
    }

    const tNum = Math.max(1, Math.min(tickets.length, ticketInput));
    const targetTicket = tickets.find((t) => t.ticketNumber === tNum) || tickets[0];

    const updatedGame: BingoGame = {
      ...game,
      digitalTicketsSold: (game.digitalTicketsSold || 0) + 1,
      updatedAt: Date.now(),
    };
    storageService.saveGame(updatedGame);
    setActiveGame(updatedGame);
    setPlayerTicket(targetTicket);

    // Auto mark free spaces
    const initialMarked = new Set<string>();
    targetTicket.squares.forEach((row, r) => {
      row.forEach((sq, c) => {
        if (sq.isFreeSpace) {
          initialMarked.add(`${r}-${c}`);
        }
      });
    });
    setMarkedKeys(initialMarked);
  };

  const handleToggleSquare = (r: number, c: number, sq: BingoSquare) => {
    if (sq.isFreeSpace) return;
    audioService.playDabSound();

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    const key = `${r}-${c}`;
    setMarkedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCallBingo = () => {
    if (!activeGame || !playerTicket) return;

    audioService.playBingoChime();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    const evalResult = BingoEngine.evaluateTicket(playerTicket, activeGame.calledTrackIds);
    const pattern = evalResult.isFullHouse
      ? 'full_house'
      : evalResult.has2Lines
      ? '2_lines'
      : '1_line';

    const newClaim: BingoClaim = {
      id: `claim_${Date.now()}`,
      gameId: activeGame.id,
      ticketNumber: playerTicket.ticketNumber,
      playerName: playerName.trim() || `Player #${playerTicket.ticketNumber}`,
      pattern,
      timestamp: Date.now(),
      status: 'pending',
      claimedTrackIds: activeGame.calledTrackIds,
      uncalledTrackIds: [],
    };

    const updatedGame: BingoGame = {
      ...activeGame,
      claims: [newClaim, ...activeGame.claims],
      updatedAt: Date.now(),
    };

    setActiveGame(updatedGame);
    storageService.saveGame(updatedGame);
    setHasClaimedBingo(true);
  };

  // Evaluate current ticket against called songs
  const evaluation = playerTicket && activeGame
    ? BingoEngine.evaluateTicket(playerTicket, activeGame.calledTrackIds)
    : null;

  const canCallBingo = Boolean(evaluation && (evaluation.has1Line || evaluation.isFullHouse));

  // If not joined a game yet, show the PIN entry screen
  if (!activeGame || !playerTicket) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>

          <h2 className="text-2xl font-black text-white">Join Live Song Bingo</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the 6-digit Game PIN displayed on the host screen or projector.
          </p>

          <form onSubmit={handleJoinGame} className="mt-6 space-y-4 text-left text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Game PIN</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 582910"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-center text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ticket # (1-200)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={ticketInput}
                  onChange={(e) => setTicketInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Ticket Price Notification */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Coins className="w-4 h-4 text-amber-400" />
                Digital Ticket Price:
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded">
                {(() => {
                  const g = storageService.getGames().find((x) => x.pin === pinInput.trim());
                  if (g) {
                    return (g.ticketPrice ?? 2) === 0 ? 'Free Entry' : `£${(g.ticketPrice ?? 2).toFixed(2)}`;
                  }
                  return 'Set by Host';
                })()}
              </span>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-extrabold text-sm rounded-xl hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer pt-3"
            >
              <PartyPopper className="w-4 h-4" />
              Get My Bingo Ticket
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Player Game Screen
  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
            Game PIN: {activeGame.pin}
          </span>
          <h2 className="text-base font-extrabold text-white truncate max-w-[170px] sm:max-w-xs">
            {activeGame.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{(activeGame.ticketPrice ?? 2) === 0 ? 'Free' : `£${(activeGame.ticketPrice ?? 2).toFixed(2)}`}</span>
          </div>

          <button
            onClick={() => setShowHistorySheet(true)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            <span>Called ({activeGame.calledTrackIds.length})</span>
          </button>

          <span className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs rounded-lg">
            #{String(playerTicket.ticketNumber).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* Claim confirmation banner if player claimed */}
      {hasClaimedBingo && (
        <div className="mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs space-y-0.5">
          <p className="font-extrabold text-white flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            BINGO Claim Sent to Host!
          </p>
          <p className="text-[11px] text-emerald-300">
            Keep singing! The host is verifying your ticket right now.
          </p>
        </div>
      )}

      {/* Interactive Bingo Grid */}
      <div className="mt-4 bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-2xl">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${playerTicket.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {playerTicket.squares.flatMap((row, r) =>
            row.map((sq, c) => {
              const key = `${r}-${c}`;
              const isMarked = markedKeys.has(key);
              const isCalledByHost = sq.track ? activeGame.calledTrackIds.includes(sq.track.id) : false;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleSquare(r, c, sq)}
                  className={`aspect-square p-1.5 sm:p-2 rounded-xl border flex flex-col justify-center items-center text-center transition-all cursor-pointer select-none relative overflow-hidden ${
                    sq.isFreeSpace
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-inner'
                      : isMarked
                      ? 'bg-gradient-to-tr from-amber-500/25 to-rose-500/25 border-amber-400 text-white shadow-lg shadow-amber-500/15 scale-[0.98]'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {/* Dab stamp mark indicator */}
                  {isMarked && !sq.isFreeSpace && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                      ✓
                    </div>
                  )}

                  {sq.isFreeSpace ? (
                    <div className="space-y-0.5">
                      <Sparkles className="w-5 h-5 mx-auto text-amber-400" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        FREE
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2">
                        {sq.track?.title}
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {sq.track?.artist}
                      </p>
                    </>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Action: BIG "BINGO!" BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 z-30">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleCallBingo}
            className={`flex-1 py-4 px-6 rounded-2xl font-black text-base tracking-wider uppercase transition-all shadow-2xl flex items-center justify-center gap-2 cursor-pointer ${
              canCallBingo
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 text-slate-950 hover:scale-102 animate-pulse shadow-amber-500/30'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 opacity-90 hover:opacity-100'
            }`}
          >
            <Trophy className="w-6 h-6" />
            CALL BINGO!
          </button>
        </div>
      </div>

      {/* Called Songs Slide-Over Drawer */}
      {showHistorySheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                Called Songs in this Game ({activeGame.calledTrackIds.length})
              </h3>
              <button
                onClick={() => setShowHistorySheet(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="py-3 overflow-y-auto space-y-1.5 flex-1 pr-1">
              {activeGame.calledTrackIds.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No songs called yet.</p>
              ) : (
                activeGame.calledTrackIds.map((id, idx) => {
                  const trk = activeGame.playlist.tracks.find((t) => t.id === id);
                  if (!trk) return null;
                  return (
                    <div
                      key={id}
                      className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-[11px] text-amber-400 font-bold w-5">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{trk.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{trk.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                        PLAYED
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

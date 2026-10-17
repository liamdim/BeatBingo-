import React, { useState, useEffect } from 'react';
import { BingoGame, Track, BingoClaim, BingoTicket } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { BingoEngine } from '../services/bingoEngine';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { GameQRCodeModal } from './GameQRCodeModal';
import { 
  Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, 
  Tv, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, 
  Sparkles, Music, Users, AlertCircle, Search, Shuffle,
  QrCode, Coins, Copy, Check 
} from 'lucide-react';

interface HostGameViewProps {
  game: BingoGame;
  onUpdateGame: (updated: BingoGame) => void;
  onOpenBigScreen: () => void;
}

export const HostGameView: React.FC<HostGameViewProps> = ({
  game,
  onUpdateGame,
  onOpenBigScreen,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(30);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<BingoClaim | null>(null);
  const [searchCalled, setSearchCalled] = useState<string>('');
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [quickQrUrl, setQuickQrUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pin=${game.pin}`
    : `https://beatbingo.app/?pin=${game.pin}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#020617', light: '#ffffff' },
    })
      .then((url) => setQuickQrUrl(url))
      .catch((err) => console.error(err));
  }, [joinUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentTrack = game.playlist.tracks.find((t) => t.id === game.currentTrackId) || null;
  const remainingTracks = game.playlist.tracks.filter((t) => !game.calledTrackIds.includes(t.id));
  const calledTracks = game.calledTrackIds
    .map((id) => game.playlist.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[];

  // Real-time claims listener
  useEffect(() => {
    const unsub = storageService.subscribe('GAME_UPDATED', (payload: unknown) => {
      const g = payload as BingoGame;
      if (g.id === game.id) {
        onUpdateGame(g);
      }
    });
    return () => unsub();
  }, [game.id, onUpdateGame]);

  // Audio preview playback when currentTrack changes
  useEffect(() => {
    if (currentTrack && game.status === 'playing') {
      setIsPlayingAudio(true);
      const audioHandle = audioService.playPreview(
        currentTrack.previewUrl,
        currentTrack.title,
        () => {
          // Track ended: if mystery mode active, automatically reveal song at the end of the song!
          if (game.mysteryMode && !game.isMysteryRevealed) {
            audioService.playRevealChime();
            const updated: BingoGame = {
              ...game,
              isMysteryRevealed: true,
              updatedAt: Date.now(),
            };
            onUpdateGame(updated);
            storageService.saveGame(updated);
          }
          setIsPlayingAudio(false);
          setAudioProgress(0);
        },
        (curr, dur) => {
          setAudioProgress(curr);
          setAudioDuration(dur || 30);
        }
      );

      return () => {
        audioHandle.stop();
      };
    } else {
      audioService.stopPreview();
      setIsPlayingAudio(false);
    }
  }, [currentTrack?.id, game.status]);

  const handleDrawNextSong = () => {
    if (remainingTracks.length === 0) return;

    // Pick random track from remaining pool
    const randomIndex = Math.floor(Math.random() * remainingTracks.length);
    const nextTrack = remainingTracks[randomIndex];

    const updatedCalled = [...game.calledTrackIds, nextTrack.id];
    const updatedGame: BingoGame = {
      ...game,
      calledTrackIds: updatedCalled,
      currentTrackId: nextTrack.id,
      currentTrackStartedAt: Date.now(),
      status: 'playing',
      isMysteryRevealed: !game.mysteryMode, // reset reveal status if mystery mode active
      updatedAt: Date.now(),
    };

    onUpdateGame(updatedGame);
    storageService.saveGame(updatedGame);
  };

  const handleTogglePlayPause = () => {
    if (isPlayingAudio) {
      audioService.stopPreview();
      setIsPlayingAudio(false);
    } else if (currentTrack) {
      setIsPlayingAudio(true);
      audioService.playPreview(
        currentTrack.previewUrl,
        currentTrack.title,
        () => {
          if (game.mysteryMode && !game.isMysteryRevealed) {
            audioService.playRevealChime();
            const updated = { ...game, isMysteryRevealed: true };
            onUpdateGame(updated);
            storageService.saveGame(updated);
          }
          setIsPlayingAudio(false);
        },
        (curr, dur) => {
          setAudioProgress(curr);
          setAudioDuration(dur || 30);
        }
      );
    }
  };

  const handleToggleMysteryMode = () => {
    const updated: BingoGame = {
      ...game,
      mysteryMode: !game.mysteryMode,
      isMysteryRevealed: game.mysteryMode ? true : false,
      updatedAt: Date.now(),
    };
    onUpdateGame(updated);
    storageService.saveGame(updated);
  };

  const handleManualReveal = () => {
    audioService.playRevealChime();
    const updated: BingoGame = {
      ...game,
      isMysteryRevealed: true,
      updatedAt: Date.now(),
    };
    onUpdateGame(updated);
    storageService.saveGame(updated);
  };

  const handleOpenSecondScreenWindow = () => {
    // Open big screen in secondary window or tab
    const url = `${window.location.origin}/?pin=${game.pin}&view=bigscreen`;
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no');
    // Also trigger in-app view callback if popup blocked
    onOpenBigScreen();
  };

  const handleVerifyClaim = (claim: BingoClaim, approve: boolean) => {
    const updatedClaims = game.claims.map((c) =>
      c.id === claim.id ? { ...c, status: approve ? ('verified' as const) : ('rejected' as const) } : c
    );

    const updatedGame: BingoGame = {
      ...game,
      claims: updatedClaims,
      status: approve ? 'paused' : game.status,
      updatedAt: Date.now(),
    };

    if (approve) {
      audioService.playBingoChime();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }

    onUpdateGame(updatedGame);
    storageService.saveGame(updatedGame);
    setSelectedClaimForReview(null);
  };

  const pendingClaims = game.claims.filter((c) => c.status === 'pending');

  const filteredCalledTracks = calledTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchCalled.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchCalled.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Live Host Command Center
            </span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              PIN: {game.pin}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {game.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Controlling {game.playlist.title} · {game.calledTrackIds.length} of {game.playlist.tracks.length} songs called
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Join QR Code & Ticket Price Button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Join QR & Ticket Price</span>
            <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              {(game.ticketPrice ?? 2) === 0 ? 'Free' : `£${(game.ticketPrice ?? 2).toFixed(2)}`}
            </span>
          </button>

          {/* Big Screen Button */}
          <button
            onClick={handleOpenSecondScreenWindow}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            Open Big Screen / Second Screen
          </button>

          {/* Mystery Mode Toggle */}
          <button
            onClick={handleToggleMysteryMode}
            className={`px-3.5 py-2 border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              game.mysteryMode
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {game.mysteryMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            {game.mysteryMode ? 'Mystery Mode ON (Hidden)' : 'Hide Song Name'}
          </button>
        </div>
      </div>

      {/* Real-time BINGO Claims Banner */}
      {pendingClaims.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-2 border-amber-500/80 shadow-2xl animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
                BINGO!
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Winner Claim from {pendingClaims[0].playerName} (Ticket #{pendingClaims[0].ticketNumber})!
                </h3>
                <p className="text-xs text-amber-200">
                  Claimed: <strong className="uppercase">{pendingClaims[0].pattern.replace('_', ' ')}</strong>. Verify instantly before declaring winner.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedClaimForReview(pendingClaims[0])}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Ticket #{pendingClaims[0].ticketNumber}
            </button>
          </div>
        </div>
      )}

      {/* Host Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Now Playing & Next Draw (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Now Playing Turntable Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                Current Song
              </span>
              <span className="text-xs font-mono text-slate-400">
                Song #{game.calledTrackIds.length} of {game.playlist.tracks.length}
              </span>
            </div>

            {currentTrack ? (
              <div className="mt-5 space-y-5">
                {/* Mystery Mode Song Banner */}
                {game.mysteryMode && !game.isMysteryRevealed ? (
                  <div className="p-6 bg-slate-950 border border-amber-500/40 rounded-2xl text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl font-black">
                      ?
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-amber-300 tracking-wider uppercase">
                        Mystery Track #{game.calledTrackIds.length}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Title & artist hidden from players until the song finishes playing!
                      </p>
                    </div>
                    <button
                      onClick={handleManualReveal}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
                    >
                      Host Reveal Early
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-xl shrink-0 overflow-hidden">
                      {currentTrack.artworkUrl ? (
                        <img
                          src={currentTrack.artworkUrl}
                          alt={currentTrack.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-10 h-10 text-white" />
                      )}
                    </div>

                    <div className="text-center sm:text-left min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                        {currentTrack.genre || 'Hit Song'} {currentTrack.year ? `· ${currentTrack.year}` : ''}
                      </span>
                      <h2 className="text-2xl font-extrabold text-white truncate mt-0.5">
                        {currentTrack.title}
                      </h2>
                      <p className="text-base text-slate-300 font-medium truncate">
                        {currentTrack.artist}
                      </p>
                    </div>
                  </div>
                )}

                {/* Audio Progress Bar */}
                <div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all"
                      style={{
                        width: `${Math.min(100, (audioProgress / (audioDuration || 30)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
                    <span>{Math.floor(audioProgress)}s</span>
                    <span>30s Preview Snippet</span>
                  </div>
                </div>

                {/* Audio Player Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTogglePlayPause}
                      className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-amber-400/20 cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        audioService.stopPreview();
                        setIsPlayingAudio(false);
                        handleTogglePlayPause();
                      }}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      title="Replay snippet"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Draw Next Button */}
                  <button
                    disabled={remainingTracks.length === 0}
                    onClick={handleDrawNextSong}
                    className="py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Shuffle className="w-4 h-4" />
                    Draw & Play Next Song ({remainingTracks.length} left)
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Game Ready to Start</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click below to draw the first song from {game.playlist.title}!
                  </p>
                </div>
                <button
                  onClick={handleDrawNextSong}
                  className="py-3 px-6 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-sm rounded-xl hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Draw First Song
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Called Songs Tracker & QR Code (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scannable QR Code & Digital Ticket Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div 
              className="p-1.5 bg-white rounded-xl shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform" 
              onClick={() => setIsQRModalOpen(true)} 
              title="Click to enlarge scannable QR code"
            >
              {quickQrUrl ? (
                <img
                  src={quickQrUrl}
                  alt={`QR code for PIN ${game.pin}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center text-[10px] text-slate-800">
                  QR...
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mobile Join QR
                </span>
                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  PIN: {game.pin}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-200">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Ticket Price:</span>
                <strong className="text-white">
                  {(game.ticketPrice ?? 2) === 0 ? 'Free Entry' : `£${(game.ticketPrice ?? 2).toFixed(2)}`}
                </strong>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? 'Copied' : 'Copy Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsQRModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3 h-3" />
                  Expand / Edit
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Called Songs ({calledTracks.length})
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                {Math.round((calledTracks.length / game.playlist.tracks.length) * 100)}% Complete
              </span>
            </div>

            {/* Search filter for called songs */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search called tracks..."
                value={searchCalled}
                onChange={(e) => setSearchCalled(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="mt-3 space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredCalledTracks.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  {searchCalled ? 'No called songs match search.' : 'No songs called yet.'}
                </p>
              ) : (
                filteredCalledTracks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="font-mono text-[11px] text-amber-400 font-bold w-5 shrink-0">
                        #{calledTracks.indexOf(t) + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{t.artist}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono shrink-0">
                      CALLED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Verification Modal */}
      {selectedClaimForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Verify Claim: Ticket #{selectedClaimForReview.ticketNumber}
                </h3>
              </div>
              <span className="text-xs font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                {selectedClaimForReview.pattern.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Player Name:</span>
                <span className="font-bold text-white">{selectedClaimForReview.playerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ticket Number:</span>
                <span className="font-mono font-bold text-amber-400">
                  #{selectedClaimForReview.ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Claim Type:</span>
                <span className="font-bold uppercase text-white">
                  {selectedClaimForReview.pattern.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Verification Result */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Ticket Pattern Verified!</p>
                <p className="text-[11px] text-emerald-300">
                  All claimed songs have been played and marked in this game session.
                </p>
              </div>
            </div>

            {/* Host Decision Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleVerifyClaim(selectedClaimForReview, false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject Claim
              </button>
              <button
                onClick={() => handleVerifyClaim(selectedClaimForReview, true)}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Declare Official Winner!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join QR Code & Ticket Price Modal */}
      <GameQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        game={game}
        onUpdateGame={onUpdateGame}
      />
    </div>
  );
};

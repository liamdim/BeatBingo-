import React, { useState, useEffect } from 'react';
import { BingoGame, Track } from '../types';
import { storageService } from '../services/storageService';
import QRCode from 'qrcode';
import { 
  Tv, Maximize2, Minimize2, Music, QrCode, Sparkles, Volume2, ArrowLeft, Coins 
} from 'lucide-react';

interface BigScreenViewProps {
  game: BingoGame;
  onClose: () => void;
}

export const BigScreenView: React.FC<BigScreenViewProps> = ({ game: initialGame, onClose }) => {
  const [game, setGame] = useState<BingoGame>(initialGame);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pin=${game.pin}`
    : `https://beatbingo.app/?pin=${game.pin}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 260,
      margin: 1,
      color: { dark: '#020617', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [joinUrl]);

  useEffect(() => {
    const unsub = storageService.subscribe('GAME_UPDATED', (payload: unknown) => {
      const g = payload as BingoGame;
      if (g.id === game.id) {
        setGame(g);
      }
    });
    return () => unsub();
  }, [game.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentTrack = game.playlist.tracks.find((t) => t.id === game.currentTrackId) || null;
  const calledTracks = game.calledTrackIds
    .map((id) => game.playlist.tracks.find((t) => t.id === id))
    .filter(Boolean) as Track[];
  const last5Called = calledTracks.slice(-5).reverse();

  const isMystery = game.mysteryMode && !game.isMysteryRevealed;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Background ambient concert lights */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600 rounded-full blur-[140px]" />
      </div>

      {/* Top Bar on Big Screen */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Return to Host Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              BeatBingo Live
            </h1>
            <p className="text-xs text-slate-400 font-medium">{game.title}</p>
          </div>
        </div>

        {/* Join Badge & Scannable QR Code */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/95 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
            {qrDataUrl && (
              <div className="p-1 bg-white rounded-lg shrink-0 shadow">
                <img
                  src={qrDataUrl}
                  alt={`QR code for PIN ${game.pin}`}
                  className="w-14 h-14 object-contain rounded"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Scan QR to Join
                </p>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                  {(game.ticketPrice ?? 2) === 0 ? 'Free Entry' : `£${(game.ticketPrice ?? 2).toFixed(2)}`}
                </span>
              </div>
              <p className="text-xl font-mono font-black text-amber-400 tracking-wider">
                PIN: {game.pin}
              </p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-slate-300" /> : <Maximize2 className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="relative z-10 my-auto py-8 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full">
        {currentTrack ? (
          isMystery ? (
            /* Mystery Mode Screen */
            <div className="w-full p-10 sm:p-16 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-pulse-subtle">
              <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto text-4xl font-black shadow-lg shadow-amber-500/30">
                ?
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30">
                  Mystery Track #{game.calledTrackIds.length} Playing Now
                </span>
                <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white pt-2">
                  Listen & Guess The Song!
                </h2>
                <p className="text-base text-slate-300">
                  Song name will be revealed on screen when the track ends.
                </p>
              </div>

              {/* Audio visualizer bars simulation */}
              <div className="flex items-center justify-center gap-1.5 pt-4">
                {[40, 70, 95, 60, 85, 100, 75, 50, 90, 65, 80, 45].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-amber-500 to-rose-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Revealed Track Display */
            <div className="w-full p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center gap-8">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-24 h-24 text-white" />
                )}
              </div>

              <div className="text-center sm:text-left min-w-0 flex-1 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20 inline-block">
                  Now Playing · Song #{game.calledTrackIds.length}
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-xl sm:text-2xl text-slate-300 font-semibold">
                  {currentTrack.artist}
                </p>
                {currentTrack.genre && (
                  <p className="text-xs text-slate-400 font-mono">
                    {currentTrack.genre} {currentTrack.year ? `· ${currentTrack.year}` : ''}
                  </p>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-white">Welcome to BeatBingo!</h2>
            <p className="text-slate-400 text-lg">
              Grab your tickets and join with PIN <strong className="text-amber-400">{game.pin}</strong> on your phone.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Footer: Recently Called Tracks Strip */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-6">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Recently Called Tracks ({calledTracks.length} Total Called)
          </span>
          <span className="text-amber-400 font-mono">
            {game.playlist.tracks.length - calledTracks.length} songs remaining in pool
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {last5Called.map((t, idx) => (
            <div
              key={t.id}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5 min-w-0"
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-amber-400 flex items-center justify-center shrink-0">
                {calledTracks.length - idx}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{t.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{t.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

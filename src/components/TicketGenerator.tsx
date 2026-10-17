import React, { useState, useEffect } from 'react';
import { Track, Playlist, BingoTicket, GridSize, User } from '../types';
import { BingoEngine } from '../services/bingoEngine';
import { storageService } from '../services/storageService';
import { 
  Printer, Sparkles, Share2, Eye, Download, Check, 
  Copy, AlertTriangle, Layers, QrCode, Play, Coins 
} from 'lucide-react';

interface TicketGeneratorProps {
  currentUser: User;
  onOpenPayment: () => void;
  onLaunchGameWithTickets: (playlist: Playlist, tickets: BingoTicket[], ticketPrice?: number) => void;
}

export const TicketGenerator: React.FC<TicketGeneratorProps> = ({
  currentUser,
  onOpenPayment,
  onLaunchGameWithTickets,
}) => {
  const [playlists] = useState<Playlist[]>(() => storageService.getPlaylists());
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const maxAllowedTickets = currentUser.isPaid ? 200 : 5;
  const [ticketCount, setTicketCount] = useState<number>(currentUser.isPaid ? 25 : 5);
  const [ticketPrice, setTicketPrice] = useState<number>(2.0);
  const [gridSize, setGridSize] = useState<GridSize>(5);
  const [ticketsPerPage, setTicketsPerPage] = useState<1 | 2 | 4>(2);
  const [previewTicketIndex, setPreviewTicketIndex] = useState<number>(0);
  const [generatedTickets, setGeneratedTickets] = useState<BingoTicket[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [gamePin] = useState<string>(() => Math.floor(100000 + Math.random() * 900000).toString());

  // Generate tickets whenever playlist, count, size, or price changes
  useEffect(() => {
    if (!activePlaylist || activePlaylist.tracks.length < 9) return;
    try {
      const required = gridSize === 5 ? 24 : gridSize * gridSize;
      if (activePlaylist.tracks.length >= required) {
        const batch = BingoEngine.generateTicketBatch(
          `game_${gamePin}`,
          activePlaylist.title,
          activePlaylist.tracks,
          Math.min(ticketCount, maxAllowedTickets),
          gridSize,
          ticketPrice
        );
        setGeneratedTickets(batch);
        setPreviewTicketIndex(0);
      } else {
        setGeneratedTickets([]);
      }
    } catch (e) {
      console.warn('Ticket batch generation error:', e);
      setGeneratedTickets([]);
    }
  }, [activePlaylist?.id, activePlaylist?.tracks.length, ticketCount, gridSize, maxAllowedTickets, gamePin, ticketPrice]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/?pin=${gamePin}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (!activePlaylist || generatedTickets.length === 0) return;
    onLaunchGameWithTickets(activePlaylist, generatedTickets, ticketPrice);
  };

  const currentPreviewTicket = generatedTickets[previewTicketIndex];
  const requiredTracks = gridSize === 5 ? 24 : gridSize * gridSize;
  const hasEnoughTracks = (activePlaylist?.tracks.length || 0) >= requiredTracks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Section */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Ticket Factory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Song Bingo Ticket Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate up to 200 mathematically unique song bingo tickets. Print high-res sheets or play digitally on mobile devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={generatedTickets.length === 0}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Print / Save PDF
          </button>
          <button
            onClick={handleStartGame}
            disabled={generatedTickets.length === 0}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-current" />
            Launch Live Host Game
          </button>
        </div>
      </div>

      {/* Trial Alert Banner if not paid */}
      {!currentUser.isPaid && (
        <div className="no-print mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Free Trial Active:</span> Limited to 5 tickets per game.
              <span className="text-slate-300 ml-1">Upgrade to Full License to generate up to 200 tickets for large venues!</span>
            </div>
          </div>
          <button
            onClick={onOpenPayment}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Unlock 200 Tickets · £25
          </button>
        </div>
      )}

      {/* Configuration & Previewer */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Batch Configuration
            </h2>

            {/* Playlist Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Playlist:
              </label>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title} ({pl.tracks.length} songs)
                  </option>
                ))}
              </select>
              {!hasEnoughTracks && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Playlist needs at least {requiredTracks} songs (currently {activePlaylist?.tracks.length}).
                </p>
              )}
            </div>

            {/* Ticket Count Slider (up to 200) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-semibold text-slate-400">
                  Number of Tickets:
                </label>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {ticketCount} Tickets
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={maxAllowedTickets}
                value={ticketCount}
                onChange={(e) => setTicketCount(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 ticket</span>
                <span>{maxAllowedTickets === 5 ? '5 (Trial max)' : '100'}</span>
                <span>{maxAllowedTickets} {currentUser.isPaid ? 'max (Full License)' : ''}</span>
              </div>
            </div>

            {/* Digital Ticket Price Configuration Field */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Cost per Digital Ticket:
                </label>
                <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {ticketPrice === 0 ? 'Free Entry' : `£${ticketPrice.toFixed(2)}`}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {[0, 1, 2, 5].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTicketPrice(amt)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      ticketPrice === amt
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {amt === 0 ? 'Free' : `£${amt}.00`}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono">£</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  max="100"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Custom Ticket Price"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Live estimated prize pot info */}
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Total Prize Pot:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    £{(ticketCount * ticketPrice).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Players see {ticketPrice === 0 ? 'Free Entry' : `£${ticketPrice.toFixed(2)} per ticket`} on mobile when scanning QR or entering PIN.
                </p>
              </div>
            </div>

            {/* Grid Size Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Grid Format:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGridSize(3)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    gridSize === 3
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  3x3 (9 Songs)
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize(4)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    gridSize === 4
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  4x4 (16 Songs)
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize(5)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    gridSize === 5
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  5x5 (Classic Star)
                </button>
              </div>
            </div>

            {/* Print Layout */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Print Sheet Layout:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTicketsPerPage(1)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    ticketsPerPage === 1
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  1 / Page
                </button>
                <button
                  type="button"
                  onClick={() => setTicketsPerPage(2)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    ticketsPerPage === 2
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  2 / Page
                </button>
                <button
                  type="button"
                  onClick={() => setTicketsPerPage(4)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    ticketsPerPage === 4
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  4 / Page
                </button>
              </div>
            </div>

            {/* Digital Player Link Share */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Player Digital Join Link & Game PIN:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300">
                  PIN: <strong>{gamePin}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Card Preview Column (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Live Card Preview
              </h2>

              {generatedTickets.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Viewing Ticket:</span>
                  <select
                    value={previewTicketIndex}
                    onChange={(e) => setPreviewTicketIndex(parseInt(e.target.value, 10))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                  >
                    {generatedTickets.map((t, idx) => (
                      <option key={t.ticketNumber} value={idx}>
                        #{String(t.ticketNumber).padStart(3, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {currentPreviewTicket ? (
              <div className="bg-slate-950 border-2 border-amber-500/30 rounded-xl p-4 shadow-2xl">
                {/* Ticket Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-white text-base tracking-tight">
                      BeatBingo · {currentPreviewTicket.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Game PIN: <span className="font-mono text-amber-400">{gamePin}</span> · Price: <span className="font-mono text-amber-300 font-bold">{ticketPrice === 0 ? 'Free Entry' : `£${ticketPrice.toFixed(2)}`}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs rounded-lg">
                    TICKET #{String(currentPreviewTicket.ticketNumber).padStart(3, '0')}
                  </span>
                </div>

                {/* Grid */}
                <div
                  className={`mt-4 grid gap-1.5`}
                  style={{
                    gridTemplateColumns: `repeat(${currentPreviewTicket.gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {currentPreviewTicket.squares.flatMap((row, r) =>
                    row.map((sq, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`aspect-square p-2 rounded-lg border flex flex-col justify-center items-center text-center transition-all ${
                          sq.isFreeSpace
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-900/90 border-slate-800 text-slate-200'
                        }`}
                      >
                        {sq.isFreeSpace ? (
                          <div className="space-y-0.5">
                            <Sparkles className="w-4 h-4 mx-auto text-amber-400" />
                            <span className="text-[10px] uppercase tracking-wider block font-black">
                              FREE
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] font-bold leading-tight line-clamp-2">
                              {sq.track?.title}
                            </p>
                            <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                              {sq.track?.artist}
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Any line (horizontal, vertical, diagonal) wins 1st Prize · Full House wins Jackpot</span>
                  <span className="font-mono">Seed: {currentPreviewTicket.seed}</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a valid playlist with at least {requiredTracks} songs to preview tickets.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT-ONLY VIEW FOR HIGH-RES SHEET PRINTING */}
      <div className="hidden print:block text-black bg-white w-full">
        <div className="space-y-8">
          {generatedTickets.map((ticket, tIdx) => {
            const isPageBreak = (tIdx + 1) % ticketsPerPage === 0 && tIdx < generatedTickets.length - 1;
            return (
              <div
                key={ticket.ticketNumber}
                className={`avoid-break p-6 border-2 border-black rounded-lg mb-8 ${isPageBreak ? 'page-break' : ''}`}
              >
                <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-black">
                      BeatBingo · {ticket.title}
                    </h2>
                    <p className="text-xs text-gray-700">
                      Game PIN: <strong>{gamePin}</strong> · Ticket Price: <strong>{(ticket.ticketPrice ?? 2) === 0 ? 'Free Entry' : `£${(ticket.ticketPrice ?? 2).toFixed(2)}`}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black border-2 border-black px-3 py-1 rounded inline-block">
                      TICKET #{String(ticket.ticketNumber).padStart(3, '0')}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${ticket.gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {ticket.squares.flatMap((row, r) =>
                    row.map((sq, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`min-h-[64px] p-2 border-2 border-black rounded flex flex-col justify-center items-center text-center ${
                          sq.isFreeSpace ? 'bg-gray-200 font-black' : 'bg-white'
                        }`}
                      >
                        {sq.isFreeSpace ? (
                          <span className="text-xs font-black uppercase">★ FREE SPACE ★</span>
                        ) : (
                          <>
                            <p className="text-xs font-black leading-tight line-clamp-2 text-black">
                              {sq.track?.title}
                            </p>
                            <p className="text-[10px] font-medium text-gray-600 line-clamp-1 mt-0.5">
                              {sq.track?.artist}
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-400 flex items-center justify-between text-[9px] text-gray-600">
                  <span>Rules: Mark any complete 1 Line (horizontal, vertical, diagonal) or Full House & call BINGO!</span>
                  <span>beatbingo.app · Ticket #{ticket.ticketNumber}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

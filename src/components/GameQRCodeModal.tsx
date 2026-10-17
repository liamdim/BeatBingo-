import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { BingoGame } from '../types';
import { storageService } from '../services/storageService';
import { 
  X, QrCode, Copy, Check, Download, ExternalLink, 
  Coins, Sparkles, Trophy, Users, CheckCircle2 
} from 'lucide-react';

interface GameQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: BingoGame;
  onUpdateGame: (updated: BingoGame) => void;
}

export const GameQRCodeModal: React.FC<GameQRCodeModalProps> = ({
  isOpen,
  onClose,
  game,
  onUpdateGame,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<number>(game.ticketPrice ?? 2.0);
  const [isSavedPrice, setIsSavedPrice] = useState<boolean>(false);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pin=${game.pin}`
    : `https://beatbingo.app/?pin=${game.pin}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(joinUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#020617', // slate-950
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, joinUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `BeatBingo-QR-PIN-${game.pin}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleSavePrice = () => {
    const updated: BingoGame = {
      ...game,
      ticketPrice: priceInput,
      currency: '£',
      updatedAt: Date.now(),
    };
    onUpdateGame(updated);
    storageService.saveGame(updated);
    setIsSavedPrice(true);
    setTimeout(() => setIsSavedPrice(false), 2000);
  };

  const currentPrice = game.ticketPrice ?? 2.0;
  const ticketsCount = game.digitalTicketsSold ?? 0;
  const prizePot = (currentPrice * (ticketsCount || 25)).toFixed(2);
  const linePrize = (parseFloat(prizePot) * 0.3).toFixed(2);
  const fullHousePrize = (parseFloat(prizePot) * 0.7).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Player Join QR Code & Ticket Pricing
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="p-3 bg-white rounded-xl shadow-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for PIN ${game.pin}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR code...
                </div>
              )}
            </div>

            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                Scan with mobile phone camera
              </span>
              <p className="text-lg font-mono font-black text-amber-400 tracking-wider mt-0.5">
                GAME PIN: {game.pin}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-3 w-full">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Link Copied!' : 'Copy Join Link'}
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Download QR Image
              </button>
            </div>
          </div>

          {/* Digital Ticket Price Settings */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Digital Ticket Price for Players
              </span>
              {currentPrice === 0 ? (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Free Entry
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  £{currentPrice.toFixed(2)} / Ticket
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Set the price charged to players for digital phone tickets. Players will see this entry fee when scanning the QR code or joining with PIN.
            </p>

            {/* Quick Price Buttons */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {[0, 1, 2, 5].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPriceInput(amt)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    priceInput === amt
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {amt === 0 ? 'Free' : `£${amt}.00`}
                </button>
              ))}
            </div>

            {/* Custom Input & Save */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono">£</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  max="100"
                  value={priceInput}
                  onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  placeholder="Custom Price"
                />
              </div>

              <button
                type="button"
                onClick={handleSavePrice}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {isSavedPrice ? 'Saved!' : 'Save Price'}
              </button>
            </div>

            {/* Prize Pot Calculator */}
            {currentPrice > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Prize Pot (based on {ticketsCount || 25} players):</span>
                  <span className="font-mono font-bold text-emerald-400">£{prizePot}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Suggested 1st Line Prize (30%):</span>
                  <span className="font-mono">£{linePrize}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Suggested Full House Jackpot (70%):</span>
                  <span className="font-mono font-bold text-amber-300">£{fullHousePrize}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Direct URL: {joinUrl}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-300 hover:text-white rounded bg-slate-800 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

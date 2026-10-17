import React, { useState } from 'react';
import { User, PaymentSettings, PaymentRecord } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';
import { 
  X, Check, Sparkles, CreditCard, ShieldCheck, 
  HelpCircle, CheckCircle2, Music2, Users, Tv, Printer 
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: (updatedUser: User) => void;
  onOpenGuide: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onOpenGuide,
}) => {
  const [paymentSettings] = useState<PaymentSettings>(storageService.getPaymentSettings());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const transactionRef = `PP-${Date.now().toString().slice(-6)}-UK`;

      const newRecord: PaymentRecord = {
        id: `pay_${Date.now()}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        amount: 25.0,
        currency: 'GBP',
        provider: 'paypal',
        status: 'completed',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        transactionRef,
        notes: 'One-off £25 Host License unlocked via PAYPAL',
      };

      storageService.addPaymentRecord(newRecord);

      const updatedUser: User = {
        ...currentUser,
        plan: 'full',
        isPaid: true,
        paidAmount: 25.0,
        paymentMethod: 'paypal',
        transactionId: transactionRef,
      };

      storageService.setCurrentUser(updatedUser);
      setIsProcessing(false);
      setIsCompleted(true);
      audioService.playBingoChime();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setTimeout(() => {
        onSuccess(updatedUser);
        onClose();
        setIsCompleted(false);
      }, 2200);
    }, 1500);
  };

  const handleActivateTrial = () => {
    const trialUser: User = {
      ...currentUser,
      plan: 'trial',
      isPaid: false,
    };
    storageService.setCurrentUser(trialUser);
    onSuccess(trialUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600" />

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Lifetime Host License
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Unlock BeatBingo Full Access
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">£25.00</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">One-off payment · Lifetime access</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              No Subscriptions
            </span>
          </div>

          {/* Feature comparison */}
          <div className="mt-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Users className="w-3 h-3" />
              </div>
              <span><strong>Up to 200 tickets per live game</strong> (Trial option limited to 5 tickets)</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Music2 className="w-3 h-3" />
              </div>
              <span><strong>Unlimited Playlists</strong> & Spotify / Apple Music URL imports</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Tv className="w-3 h-3" />
              </div>
              <span><strong>Big Screen / Projector Mode</strong> with mystery song reveal</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Printer className="w-3 h-3" />
              </div>
              <span><strong>Printable PDF batch sheets</strong> & instant digital player links</span>
            </div>
          </div>

          {/* Payment Provider Card */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-slate-300">Direct Payment Method:</label>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <HelpCircle className="w-3 h-3" />
                How to configure PayPal?
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm tracking-tight border border-sky-500/30">
                  PP
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-400">PayPal Direct</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Enabled
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Pay via PayPal balance, debit, or credit card ({paymentSettings.paypal.merchantEmail || 'Direct merchant'})
                  </span>
                </div>
              </div>
              <Check className="w-5 h-5 text-sky-400 shrink-0" />
            </div>
          </div>

          {/* Checkout CTA */}
          <div className="mt-6 space-y-3">
            {isCompleted ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="font-bold text-white text-sm">Payment Confirmed!</p>
                <p className="text-xs text-emerald-300">Full Access unlocked permanently. Up to 200 tickets enabled.</p>
              </div>
            ) : (
              <button
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full py-3.5 px-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing £25 via PayPal...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Pay £25 with PayPal & Unlock
                  </>
                )}
              </button>
            )}

            {/* Trial fallback */}
            {!currentUser.isPaid && currentUser.plan !== 'trial' && (
              <div className="text-center pt-1">
                <button
                  onClick={handleActivateTrial}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline"
                >
                  Or activate Free Trial (1 Live Game, 5 Tickets, 1 Playlist)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL Encrypted Direct Checkout
          </span>
          <span>Instant Access Granted</span>
        </div>
      </div>
    </div>
  );
};

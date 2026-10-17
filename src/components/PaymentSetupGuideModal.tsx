import React, { useState } from 'react';
import { X, CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Terminal, Download, Globe } from 'lucide-react';

interface PaymentSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminSettings?: () => void;
}

export const PaymentSetupGuideModal: React.FC<PaymentSetupGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'paypal' | 'hosting_exe'>('paypal');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              PayPal Setup & Hosting Guide
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuring direct PayPal gateway settings, web hosting upload, and Windows .exe compilation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('paypal')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'paypal'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. PayPal Setup & Direct Checkout
          </button>
          <button
            onClick={() => setActiveTab('hosting_exe')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'hosting_exe'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Web Hosting & Windows .exe Build
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {activeTab === 'paypal' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <h3 className="font-semibold text-sky-300 text-sm mb-1">
                  Direct PayPal Payment Integration
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  BeatBingo processes all £25 lifetime host licenses exclusively via direct PayPal checkout. Customers can pay using their PayPal balance, debit card, or credit card directly into your merchant account.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Step-by-Step PayPal Configuration:</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <p className="font-medium text-slate-200">1. Set your PayPal Merchant Email:</p>
                  <p className="text-slate-400">
                    Open the <strong>Admin & Payments</strong> tab &rarr; <strong>PayPal Gateway Settings</strong>.
                    Enter your PayPal business email address (e.g. <code className="text-amber-300">Bobhope090288@gmail.com</code>).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <p className="font-medium text-slate-200">2. Get your PayPal Client ID:</p>
                  <p className="text-slate-400">
                    Log in to <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">developer.paypal.com/dashboard</a> with your PayPal account.
                  </p>
                  <p className="text-slate-400">
                    Under <em>Apps & Credentials</em>, create or choose an App named <strong>BeatBingo Live</strong>.
                  </p>
                  <p className="text-slate-400">
                    Copy the <strong>Client ID</strong> and paste it into the BeatBingo Admin Settings.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <p className="font-medium text-slate-200">3. Fee configuration & Instant Unlock:</p>
                  <p className="text-slate-400">
                    The platform is set to a fixed one-off fee of <span className="text-emerald-400 font-semibold">£25.00 GBP</span>. When a host pays via PayPal, their account is permanently upgraded to Full Access with up to 200 tickets and unlimited games.
                  </p>
                </div>
              </div>

              {onOpenAdminSettings && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminSettings();
                    }}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 text-xs cursor-pointer"
                  >
                    Open PayPal Settings in Admin Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hosting_exe' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <h3 className="font-semibold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Hosting Upload & Standalone Windows .exe Package
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Here is how you compile the code to upload to any web hosting (cPanel, Apache, Nginx, Vercel, Netlify) or bundle as a desktop Windows <code className="text-emerald-300">.exe</code> file!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Option A: Upload to your Web Hosting (cPanel / Apache / Vercel)</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <p className="text-slate-300">
                    Run the build command in the terminal:
                  </p>
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded font-mono text-amber-300">
                    <span>npm run build</span>
                    <button
                      onClick={() => copyToClipboard('npm run build', 'build_cmd')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'build_cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-slate-400">
                    This produces an optimized <code className="text-amber-300">dist/</code> folder containing index.html, JS, and CSS. Simply upload the files inside <code className="text-amber-300">dist/</code> to your web host's <code className="text-slate-200">public_html</code> or deploy directly!
                  </p>
                </div>

                <h4 className="font-semibold text-white text-sm">Option B: Compile as a Standalone Windows .exe File</h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <p className="text-slate-300">
                    To make a native Windows desktop executable (.exe), you can use Electron. Run this 2-step command:
                  </p>
                  <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-amber-300 space-y-1">
                    <p># 1. Install electron-builder</p>
                    <p className="text-slate-300">npm install -D electron electron-builder</p>
                    <p className="mt-2"># 2. Build the Windows .exe</p>
                    <p className="text-slate-300">npx electron-builder --win</p>
                  </div>
                  <p className="text-slate-400">
                    The resulting <code className="text-emerald-300">BeatBingo-Setup.exe</code> will be generated in your <code className="text-slate-200">dist/</code> folder ready to run on any Windows computer without needing a web browser!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs text-slate-500">
            Current Active Gateway: <span className="text-amber-400 font-semibold uppercase">PayPal</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

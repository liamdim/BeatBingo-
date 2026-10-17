import React, { useState } from 'react';
import { User, PaymentSettings, PaymentRecord, BingoGame } from '../types';
import { storageService } from '../services/storageService';
import { 
  Users, Shield, CreditCard, Settings, Tv, 
  CheckCircle2, XCircle, Trash2, ArrowUpRight, 
  HelpCircle, Copy, Check, Terminal, Globe, Download 
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onOpenPaymentGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenPaymentGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'settings' | 'hosting_exe' | 'games'>('users');
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(storageService.getPaymentRecords());
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(storageService.getPaymentSettings());
  const [games, setGames] = useState<BingoGame[]>(storageService.getGames());

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleUserPaid = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextPaid = !u.isPaid;
        return {
          ...u,
          isPaid: nextPaid,
          plan: nextPaid ? ('full' as const) : ('trial' as const),
          paidAmount: nextPaid ? 25.0 : 0.0,
        };
      }
      return u;
    });

    setUsers(updated);
    storageService.saveUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) return;
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    storageService.saveUsers(updated);
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.savePaymentSettings(paymentSettings);
    setSavedNotice('Payment settings updated successfully! Active gateway: ' + paymentSettings.activeProvider.toUpperCase());
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const totalRevenue = paymentRecords.reduce((acc, r) => acc + (r.status === 'completed' ? r.amount : 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            Administration & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Platform Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage users, grant or revoke £25 full licenses, configure the PayPal payment gateway, and export hosting packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPaymentGuide}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Payment & .exe Guide
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
          <p className="text-2xl font-mono font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Paid £25 Licenses</span>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {users.filter((u) => u.isPaid).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Platform Revenue</span>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            £{totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active Payment Provider</span>
          <p className="text-2xl font-mono font-bold text-sky-400 mt-1 uppercase">
            {paymentSettings.activeProvider}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 mt-8 gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Users Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payments' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Payment Records ({paymentRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Payment Gateway Settings
        </button>
        <button
          onClick={() => setActiveTab('hosting_exe')}
          className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'hosting_exe' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Hosting & Windows .exe Export
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'games' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Games Oversight
        </button>
      </div>

      {/* Tab 1: Users Table */}
      {activeTab === 'users' && (
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Plan / License</th>
                  <th className="py-3 px-4">Paid Status</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase font-mono font-bold text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isPaid ? (
                        <span className="text-emerald-400 font-semibold">£25 Full License (200 Tickets)</span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Trial (5 Tickets)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.isPaid ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid £25.00
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Unpaid</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-slate-400">
                      {u.paymentMethod || '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleUserPaid(u.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          u.isPaid
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.isPaid ? 'Revoke License' : 'Grant £25 Full'}
                      </button>
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Records */}
      {activeTab === 'payments' && (
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paymentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {r.timestamp}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                      {r.transactionRef}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{r.userName}</p>
                      <p className="text-[11px] text-slate-400">{r.userEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      £{r.amount.toFixed(2)} {r.currency}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-sky-400">
                      {r.provider}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-[10px]">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payment Settings (PayPal Configuration) */}
      {activeTab === 'settings' && (
        <div className="mt-6 max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSavePaymentSettings} className="space-y-6 text-xs">
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                PayPal Payment Gateway Settings
              </h2>
              <p className="text-slate-400">
                Configure your direct PayPal merchant account and credentials to receive the £25 license fees directly into your PayPal account.
              </p>
            </div>

            {/* Active Provider Status Banner */}
            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm tracking-tight border border-sky-500/30">
                  PP
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-400">PayPal Direct Gateway</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Exclusively Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All £25 one-off lifetime licenses are processed directly via PayPal.
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
            </div>

            {/* PayPal Credentials Configuration */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-sky-400">
                PayPal Credentials
              </h3>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  PayPal Merchant / Business Email
                </label>
                <input
                  type="email"
                  value={paymentSettings.paypal.merchantEmail}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      paypal: { ...paymentSettings.paypal, merchantEmail: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  placeholder="e.g. your-paypal-business@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  PayPal Client ID
                </label>
                <input
                  type="text"
                  value={paymentSettings.paypal.clientId}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      paypal: { ...paymentSettings.paypal, clientId: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  placeholder="e.g. AX_Ae78Q9wK..."
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="text-slate-300 font-medium">Environment Mode:</label>
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="paypal_mode"
                    checked={paymentSettings.paypal.mode === 'sandbox'}
                    onChange={() =>
                      setPaymentSettings({
                        ...paymentSettings,
                        paypal: { ...paymentSettings.paypal, mode: 'sandbox' },
                      })
                    }
                  />
                  Sandbox (Testing)
                </label>
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="paypal_mode"
                    checked={paymentSettings.paypal.mode === 'live'}
                    onChange={() =>
                      setPaymentSettings({
                        ...paymentSettings,
                        paypal: { ...paymentSettings.paypal, mode: 'live' },
                      })
                    }
                  />
                  Live (Real Payments)
                </label>
              </div>
            </div>

            {savedNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-semibold">
                {savedNotice}
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Save Payment Settings
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Hosting & Windows .exe Export Instructions */}
      {activeTab === 'hosting_exe' && (
        <div className="mt-6 space-y-6 max-w-4xl">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              Upload Package to Web Hosting
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To host this on your domain or server (cPanel, Apache, Nginx, Vercel, Netlify, or VPS):
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <p className="font-semibold text-white">Step 1: Build the production bundle</p>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded font-mono text-amber-300">
                <span>npm run build</span>
                <button
                  onClick={() => copyToClipboard('npm run build', 'build_cmd_2')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedKey === 'build_cmd_2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="font-semibold text-white pt-2">Step 2: Upload files to your host</p>
              <p className="text-slate-400">
                The command creates the <code className="text-amber-300">dist/</code> directory. Simply upload all files inside <code className="text-amber-300">dist/</code> into your web server&apos;s <code className="text-slate-200">public_html</code> or root folder.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              Compiling as Standalone Windows .exe File
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To turn BeatBingo into a standalone desktop application that runs on Windows as a native <code className="text-emerald-400">.exe</code> file:
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs font-mono">
              <p className="text-slate-400"># 1. Install Electron packaging tools:</p>
              <div className="bg-slate-900 p-2.5 rounded text-amber-300">
                npm install -D electron electron-builder
              </div>

              <p className="text-slate-400 pt-2"># 2. Compile to native Windows executable (.exe):</p>
              <div className="bg-slate-900 p-2.5 rounded text-amber-300">
                npm run build && npx electron-builder --win
              </div>

              <p className="text-slate-400 pt-2 font-sans">
                The compiled installer <code className="text-emerald-400">BeatBingo Setup.exe</code> will be generated in your <code className="text-slate-300">dist/</code> folder ready to distribute!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Games Oversight */}
      {activeTab === 'games' && (
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4">Active & Past Games</h3>
          {games.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No games currently stored. Launch a game from the Playlist or Host screen to begin.
            </p>
          ) : (
            <div className="space-y-3">
              {games.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{g.title}</span>
                      <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        PIN: {g.pin}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      {g.playlist.title} · {g.calledTrackIds.length} songs called · {g.claims.length} claims
                    </p>
                  </div>
                  <span className="uppercase font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

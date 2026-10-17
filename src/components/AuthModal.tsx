import React, { useState } from 'react';
import { User, UserRole, UserPlan } from '../types';
import { storageService } from '../services/storageService';
import { X, UserCheck, Shield, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
  onOpenPayment: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onOpenPayment,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>(storageService.getUsers());
  const [mode, setMode] = useState<'switch' | 'create'>('switch');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('host');
  const [newPlan, setNewPlan] = useState<UserPlan>('trial');

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    storageService.setCurrentUser(user);
    onUserChanged(user);
    onClose();
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const isPaid = newPlan === 'full';
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      plan: newPlan,
      isPaid,
      paidAmount: isPaid ? 25.0 : 0.0,
      paymentMethod: isPaid ? 'paypal' : null,
      transactionId: isPaid ? `INIT-${Date.now().toString().slice(-6)}` : undefined,
      gamesCreatedCount: 0,
      playlistsCount: 0,
      joinedAt: new Date().toISOString().substring(0, 10),
    };

    const users = storageService.getUsers();
    users.push(newUser);
    storageService.saveUsers(users);
    storageService.setCurrentUser(newUser);
    onUserChanged(newUser);
    onClose();

    if (newPlan === 'trial') {
      // Trial account created
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              {mode === 'switch' ? 'Sign In & Select Account' : 'Create New Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMode('switch')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'switch'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 bg-slate-950/50'
            }`}
          >
            Switch Profile
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'create'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 bg-slate-950/50'
            }`}
          >
            New Sign-Up
          </button>
        </div>

        <div className="p-6">
          {mode === 'switch' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Select an active account profile or log in with administrator privileges:
              </p>

              <div className="space-y-2">
                {allUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-400/80 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs truncate">
                            {user.name}
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold px-1.5 py-0.2 rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{user.isPaid ? '£25 Full License' : 'Trial (5 Tickets)'}</span>
                          {user.paymentMethod && (
                            <>
                              <span>·</span>
                              <span className="uppercase text-slate-300 font-mono">
                                {user.paymentMethod}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 hover:text-white">Select</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!currentUser.isPaid && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPayment();
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Unlock Full £25 License for Current User
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DJ Jack"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. host@event.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="host">Game Host</option>
                    <option value="player">Player</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Access Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as UserPlan)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="trial">Trial (1 Game, 5 Tickets)</option>
                    <option value="full">Full Access (£25 Fee)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Create & Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

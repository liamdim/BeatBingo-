import { User, Playlist, BingoGame, BingoTicket, PaymentSettings, PaymentRecord } from '../types';
import { MusicService } from './musicService';

const STORAGE_KEYS = {
  CURRENT_USER: 'beatbingo_current_user',
  USERS: 'beatbingo_users',
  PLAYLISTS: 'beatbingo_playlists',
  GAMES: 'beatbingo_games',
  TICKETS: 'beatbingo_tickets',
  PAYMENT_SETTINGS: 'beatbingo_payment_settings',
  PAYMENT_RECORDS: 'beatbingo_payment_records',
};

// Initial default users
const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin_1',
    email: 'Bobhope090288@gmail.com',
    name: 'Bob Hope (Admin)',
    role: 'admin',
    plan: 'full',
    isPaid: true,
    paidAmount: 25.0,
    paymentMethod: 'paypal',
    transactionId: 'PP-ADMIN-2026',
    gamesCreatedCount: 12,
    playlistsCount: 8,
    joinedAt: '2026-01-15',
  },
  {
    id: 'user_host_1',
    email: 'sarah.host@example.com',
    name: 'Sarah Connor',
    role: 'host',
    plan: 'full',
    isPaid: true,
    paidAmount: 25.0,
    paymentMethod: 'paypal',
    transactionId: 'PP-891042-UK',
    gamesCreatedCount: 4,
    playlistsCount: 3,
    joinedAt: '2026-02-10',
  },
  {
    id: 'user_trial_1',
    email: 'dave.trial@example.com',
    name: 'Dave Smith',
    role: 'host',
    plan: 'trial',
    isPaid: false,
    paidAmount: 0.0,
    paymentMethod: null,
    gamesCreatedCount: 1,
    playlistsCount: 1,
    joinedAt: '2026-03-01',
  },
];

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  activeProvider: 'paypal',
  feeAmount: 25.0,
  currency: 'GBP',
  paypal: {
    clientId: 'AX_Ae78Q9wK-BeatBingoPayPalClientIdMock',
    merchantEmail: 'Bobhope090288@gmail.com',
    mode: 'sandbox',
  },
};

const DEFAULT_PAYMENT_RECORDS: PaymentRecord[] = [
  {
    id: 'pay_rec_001',
    userId: 'user_admin_1',
    userEmail: 'Bobhope090288@gmail.com',
    userName: 'Bob Hope (Admin)',
    amount: 25.0,
    currency: 'GBP',
    provider: 'paypal',
    status: 'completed',
    timestamp: '2026-01-15 14:22:10',
    transactionRef: 'PAYID-MT6728492019934',
    notes: 'Admin lifetime access setup',
  },
  {
    id: 'pay_rec_002',
    userId: 'user_host_1',
    userEmail: 'sarah.host@example.com',
    userName: 'Sarah Connor',
    amount: 25.0,
    currency: 'GBP',
    provider: 'paypal',
    status: 'completed',
    timestamp: '2026-02-10 19:04:45',
    transactionRef: 'PAYID-SR839102481023',
    notes: 'One-off £25 host license payment via PayPal',
  },
];

class StorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('beatbingo_sync');
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)!.forEach((cb) => cb(payload));
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  public subscribe(eventType: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public broadcast(type: string, payload: unknown) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch {}
    }
    // Also notify local listeners in the current window
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.forEach((cb) => cb(payload));
    }
  }

  // Current User
  public getCurrentUser(): User {
    if (typeof window === 'undefined') return DEFAULT_USERS[0];
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) {
      // Default to Bob Hope admin
      this.setCurrentUser(DEFAULT_USERS[0]);
      return DEFAULT_USERS[0];
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // Also sync in users list
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    this.broadcast('USER_UPDATED', user);
  }

  // All Users
  public getUsers(): User[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      this.saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  }

  public saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcast('USERS_CHANGED', users);
  }

  // Playlists
  public getPlaylists(): Playlist[] {
    if (typeof window === 'undefined') return MusicService.getCuratedPlaylists();
    const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (!data) {
      const initial = MusicService.getCuratedPlaylists();
      this.savePlaylists(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return MusicService.getCuratedPlaylists();
    }
  }

  public savePlaylists(playlists: Playlist[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    this.broadcast('PLAYLISTS_CHANGED', playlists);
  }

  public savePlaylist(playlist: Playlist): void {
    const list = this.getPlaylists();
    const idx = list.findIndex((p) => p.id === playlist.id);
    if (idx >= 0) {
      list[idx] = playlist;
    } else {
      list.unshift(playlist);
    }
    this.savePlaylists(list);
  }

  // Games
  public getGames(): BingoGame[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public getGame(gameId: string): BingoGame | null {
    const games = this.getGames();
    return games.find((g) => g.id === gameId || g.pin === gameId) || null;
  }

  public saveGame(game: BingoGame): void {
    const games = this.getGames();
    const idx = games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      games[idx] = game;
    } else {
      games.unshift(game);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    }
    this.broadcast('GAME_UPDATED', game);
  }

  // Tickets
  public getTickets(gameId: string): BingoTicket[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`${STORAGE_KEYS.TICKETS}_${gameId}`);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveTickets(gameId: string, tickets: BingoTicket[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_KEYS.TICKETS}_${gameId}`, JSON.stringify(tickets));
    this.broadcast('TICKETS_GENERATED', { gameId, count: tickets.length });
  }

  // Payment Settings
  public getPaymentSettings(): PaymentSettings {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
    if (!data) {
      this.savePaymentSettings(DEFAULT_PAYMENT_SETTINGS);
      return DEFAULT_PAYMENT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      parsed.activeProvider = 'paypal';
      return parsed;
    } catch {
      return DEFAULT_PAYMENT_SETTINGS;
    }
  }

  public savePaymentSettings(settings: PaymentSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
    this.broadcast('PAYMENT_SETTINGS_CHANGED', settings);
  }

  // Payment Records
  public getPaymentRecords(): PaymentRecord[] {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_RECORDS;
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_RECORDS);
    if (!data) {
      this.savePaymentRecords(DEFAULT_PAYMENT_RECORDS);
      return DEFAULT_PAYMENT_RECORDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_PAYMENT_RECORDS;
    }
  }

  public savePaymentRecords(records: PaymentRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(records));
    this.broadcast('PAYMENT_RECORDS_CHANGED', records);
  }

  public addPaymentRecord(record: PaymentRecord): void {
    const list = this.getPaymentRecords();
    list.unshift(record);
    this.savePaymentRecords(list);
  }
}

export const storageService = new StorageService();

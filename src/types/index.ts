export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // in seconds
  previewUrl?: string; // 30s preview audio URL
  artworkUrl?: string;
  genre?: string;
  year?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  category: string;
  tracks: Track[];
  createdAt: number;
  createdBy: string;
}

export type GridSize = 3 | 4 | 5;

export interface BingoClaim {
  id: string;
  gameId: string;
  ticketNumber: number;
  playerName: string;
  pattern: '1_line' | '2_lines' | 'full_house';
  timestamp: number;
  status: 'pending' | 'verified' | 'rejected';
  claimedTrackIds: string[];
  uncalledTrackIds: string[];
}

export interface BingoGame {
  id: string;
  pin: string;
  title: string;
  playlistId: string;
  playlist: Playlist;
  hostId: string;
  hostName: string;
  status: 'lobby' | 'playing' | 'paused' | 'ended';
  gridSize: GridSize;
  maxTickets: number; // up to 200 (trial: 5)
  calledTrackIds: string[];
  currentTrackId: string | null;
  currentTrackStartedAt: number | null;
  mysteryMode: boolean; // hide song name until end of song / revealed
  isMysteryRevealed: boolean;
  claims: BingoClaim[];
  createdAt: number;
  updatedAt: number;
  activePatternGoal: '1_line' | '2_lines' | 'full_house' | 'any';
  ticketPrice?: number; // e.g. 0 for free, or 2.00 (£2.00)
  currency?: string; // e.g. '£'
  digitalTicketsSold?: number;
}

export interface BingoSquare {
  track: Track | null; // null represents FREE space in center of 5x5
  isFreeSpace: boolean;
  row: number;
  col: number;
}

export interface BingoTicket {
  ticketNumber: number;
  gameId: string;
  title: string;
  gridSize: GridSize;
  squares: BingoSquare[][];
  seed: string;
  ticketPrice?: number;
}

export type UserRole = 'admin' | 'host' | 'player';
export type UserPlan = 'full' | 'trial' | 'free';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  isPaid: boolean;
  paidAmount: number;
  paymentMethod: 'paypal' | null;
  transactionId?: string;
  gamesCreatedCount: number;
  playlistsCount: number;
  joinedAt: string;
}

export interface PaymentSettings {
  activeProvider: 'paypal';
  feeAmount: number; // £25.00
  currency: string; // GBP
  paypal: {
    clientId: string;
    merchantEmail: string;
    mode: 'sandbox' | 'live';
  };
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  provider: 'paypal';
  status: 'completed' | 'refunded' | 'pending';
  timestamp: string;
  transactionRef: string;
  notes?: string;
}

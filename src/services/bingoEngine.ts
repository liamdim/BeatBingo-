import { Track, BingoTicket, BingoSquare, GridSize } from '../types';

/**
 * Pseudo-random generator with seed for reproducible unique tickets
 */
class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export class BingoEngine {
  /**
   * Generates a batch of unique bingo tickets (up to 200)
   */
  public static generateTicketBatch(
    gameId: string,
    gameTitle: string,
    playlistTracks: Track[],
    ticketCount: number,
    gridSize: GridSize = 5,
    ticketPrice: number = 2.0
  ): BingoTicket[] {
    const totalCells = gridSize * gridSize;
    const hasFreeSpace = gridSize === 5;
    const requiredSongsPerTicket = hasFreeSpace ? totalCells - 1 : totalCells;

    if (playlistTracks.length < requiredSongsPerTicket) {
      throw new Error(
        `Playlist must have at least ${requiredSongsPerTicket} tracks for a ${gridSize}x${gridSize} grid (current: ${playlistTracks.length}).`
      );
    }

    const tickets: BingoTicket[] = [];
    const usedSignatureHashes = new Set<string>();

    for (let ticketIndex = 1; ticketIndex <= ticketCount; ticketIndex++) {
      let attempts = 0;
      let ticket: BingoTicket | null = null;

      while (attempts < 100) {
        attempts++;
        const seedValue = Math.floor(Math.sin(ticketIndex * 997 + attempts * 13) * 1000000) + 1234567;
        const rng = new Mulberry32(seedValue);

        // Shuffle tracks deterministically for this ticket
        const pool = [...playlistTracks];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rng.next() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const selectedTracks = pool.slice(0, requiredSongsPerTicket);
        const signature = selectedTracks.map((t) => t.id).sort().join(',');

        if (!usedSignatureHashes.has(signature) || attempts > 20) {
          usedSignatureHashes.add(signature);

          // Build grid
          const squares: BingoSquare[][] = [];
          let trackCursor = 0;

          for (let row = 0; row < gridSize; row++) {
            const rowSquares: BingoSquare[] = [];
            for (let col = 0; col < gridSize; col++) {
              const isCenter = hasFreeSpace && row === 2 && col === 2;
              if (isCenter) {
                rowSquares.push({
                  track: null,
                  isFreeSpace: true,
                  row,
                  col,
                });
              } else {
                rowSquares.push({
                  track: selectedTracks[trackCursor] || null,
                  isFreeSpace: false,
                  row,
                  col,
                });
                trackCursor++;
              }
            }
            squares.push(rowSquares);
          }

          ticket = {
            ticketNumber: ticketIndex,
            gameId,
            title: gameTitle,
            gridSize,
            squares,
            seed: `${gameId}_t${ticketIndex}`,
            ticketPrice,
          };
          break;
        }
      }

      if (ticket) {
        tickets.push(ticket);
      }
    }

    return tickets;
  }

  /**
   * Verify if a square is marked/called
   */
  public static isSquareCompleted(square: BingoSquare, calledTrackIds: string[]): boolean {
    if (square.isFreeSpace) return true;
    if (!square.track) return false;
    return calledTrackIds.includes(square.track.id);
  }

  /**
   * Checks full completion status of a ticket against called tracks
   */
  public static evaluateTicket(
    ticket: BingoTicket,
    calledTrackIds: string[],
    playerMarkedSquares?: Set<string> // optional square key "r-c"
  ): {
    has1Line: boolean;
    has2Lines: boolean;
    isFullHouse: boolean;
    completedLinesCount: number;
    completedLineIndices: { type: 'row' | 'col' | 'diag'; index: number }[];
    totalMarked: number;
    totalPossible: number;
    uncalledTracks: Track[];
  } {
    const size = ticket.gridSize;
    const completedLines: { type: 'row' | 'col' | 'diag'; index: number }[] = [];
    const uncalledTracks: Track[] = [];

    // Check rows
    for (let r = 0; r < size; r++) {
      let rowComplete = true;
      for (let c = 0; c < size; c++) {
        const sq = ticket.squares[r][c];
        const isDone = this.isSquareCompleted(sq, calledTrackIds);
        if (!isDone) {
          rowComplete = false;
          if (sq.track && !calledTrackIds.includes(sq.track.id)) {
            if (!uncalledTracks.some((t) => t.id === sq.track?.id)) {
              uncalledTracks.push(sq.track);
            }
          }
        }
      }
      if (rowComplete) {
        completedLines.push({ type: 'row', index: r });
      }
    }

    // Check cols
    for (let c = 0; c < size; c++) {
      let colComplete = true;
      for (let r = 0; r < size; r++) {
        const sq = ticket.squares[r][c];
        const isDone = this.isSquareCompleted(sq, calledTrackIds);
        if (!isDone) {
          colComplete = false;
        }
      }
      if (colComplete) {
        completedLines.push({ type: 'col', index: c });
      }
    }

    // Check primary diagonal (top-left to bottom-right)
    let diag1Complete = true;
    for (let i = 0; i < size; i++) {
      const sq = ticket.squares[i][i];
      if (!this.isSquareCompleted(sq, calledTrackIds)) {
        diag1Complete = false;
      }
    }
    if (diag1Complete) {
      completedLines.push({ type: 'diag', index: 1 });
    }

    // Check secondary diagonal (top-right to bottom-left)
    let diag2Complete = true;
    for (let i = 0; i < size; i++) {
      const sq = ticket.squares[i][size - 1 - i];
      if (!this.isSquareCompleted(sq, calledTrackIds)) {
        diag2Complete = false;
      }
    }
    if (diag2Complete) {
      completedLines.push({ type: 'diag', index: 2 });
    }

    // Count marked total
    let totalMarked = 0;
    const totalPossible = size * size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const sq = ticket.squares[r][c];
        if (this.isSquareCompleted(sq, calledTrackIds)) {
          totalMarked++;
        }
      }
    }

    const isFullHouse = totalMarked === totalPossible;
    const completedLinesCount = completedLines.length;

    return {
      has1Line: completedLinesCount >= 1,
      has2Lines: completedLinesCount >= 2,
      isFullHouse,
      completedLinesCount,
      completedLineIndices: completedLines,
      totalMarked,
      totalPossible,
      uncalledTracks,
    };
  }
}

/**
 * Audio Service for BeatBingo
 * Handles 30s track previews, synth fallbacks, and game sound effects via Web Audio API
 */

class AudioService {
  private audioContext: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private synthInterval: number | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Play track audio preview
   */
  public playPreview(
    url: string | undefined,
    trackTitle: string,
    onEnded?: () => void,
    onTimeUpdate?: (currentTime: number, duration: number) => void
  ): { stop: () => void } {
    this.stopPreview();

    // If real preview URL is available, try HTML5 Audio
    if (url && url.startsWith('http')) {
      const audio = new Audio(url);
      audio.volume = this.isMuted ? 0 : this.volume;
      this.currentAudioElement = audio;

      audio.addEventListener('ended', () => {
        if (onEnded) onEnded();
      });

      audio.addEventListener('timeupdate', () => {
        if (onTimeUpdate && audio.duration) {
          onTimeUpdate(audio.currentTime, audio.duration);
        }
      });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 audio play failed, falling back to harmonic synthesizer:', err);
          this.playSynthesizedSnippet(trackTitle, onEnded, onTimeUpdate);
        });
      }

      return {
        stop: () => this.stopPreview(),
      };
    } else {
      // Harmonic fallback synth snippet (simulates a 15-second rhythm groove)
      return this.playSynthesizedSnippet(trackTitle, onEnded, onTimeUpdate);
    }
  }

  public stopPreview() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Synthesize a melodic snippet when real preview URL is not supplied
   */
  private playSynthesizedSnippet(
    trackTitle: string,
    onEnded?: () => void,
    onTimeUpdate?: (currentTime: number, duration: number) => void
  ): { stop: () => void } {
    const ctx = this.getAudioContext();
    if (!ctx) return { stop: () => {} };

    // Derive deterministic scale notes from song title
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C major pentatonic
    let noteIndex = 0;
    const totalDuration = 18; // 18 seconds snippet
    let elapsed = 0;

    const playNote = (freq: number, duration: number) => {
      if (this.isMuted) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const currentVol = this.volume * 0.15;
        gain.gain.setValueAtTime(currentVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        console.error(e);
      }
    };

    this.synthInterval = window.setInterval(() => {
      elapsed += 0.5;
      if (onTimeUpdate) {
        onTimeUpdate(elapsed, totalDuration);
      }

      if (elapsed >= totalDuration) {
        this.stopPreview();
        if (onEnded) onEnded();
        return;
      }

      const charCode = trackTitle.charCodeAt(noteIndex % trackTitle.length) || 65;
      const freq = baseFreqs[charCode % baseFreqs.length];
      playNote(freq, 0.45);
      noteIndex++;
    }, 500);

    return {
      stop: () => this.stopPreview(),
    };
  }

  /**
   * SFX: Ticket dab/stamp pop sound
   */
  public playDabSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  /**
   * SFX: BINGO winning chime fanfare
   */
  public playBingoChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        } catch {}
      }, idx * 120);
    });
  }

  /**
   * SFX: Reveal track fanfare
   */
  public playRevealChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }, idx * 90);
    });
  }

  /**
   * SFX: Host claim notification ping
   */
  public playAlertPing() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

      gain.gain.setValueAtTime(this.volume * 0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }
}

export const audioService = new AudioService();

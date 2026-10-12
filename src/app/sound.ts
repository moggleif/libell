/**
 * WebAudio needs no asset, and the context is created lazily on a user
 * gesture (`unlock`), which also satisfies autoplay policies.
 */
import type { GuidanceDirection } from '../domain/audioGuidance';
import { toggleMute, type SoundPrefs } from '../domain/settings';
import type { SettingsAccess } from './externalSensorWiring';

export interface Sound {
  /** Creates the context on first use and resumes it; call from a gesture. */
  unlock(): void;
  playChime(): void;
  /** One guidance pulse at `pitchHz`, gliding with `direction`. */
  playGuidancePulse(pitchHz: number, direction: GuidanceDirection): void;
}

const CHIME_TONES = [
  [880, 0],
  [1174.7, 0.18],
] as const;

const PULSE_DURATION_S = 0.09;
const PULSE_GLIDE = 1.15;

function browserAudioContext(): AudioContext | null {
  return typeof AudioContext !== 'undefined' ? new AudioContext() : null;
}

export function createSound(createContext: () => AudioContext | null = browserAudioContext): Sound {
  let audioCtx: AudioContext | null = null;

  function tone(ctx: AudioContext): { osc: OscillatorNode; gain: GainNode } {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    return { osc, gain };
  }

  return {
    unlock() {
      if (!audioCtx) audioCtx = createContext();
      void audioCtx?.resume();
    },

    playChime() {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      for (const [freq, at] of CHIME_TONES) {
        const { osc, gain } = tone(audioCtx);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + at);
        gain.gain.exponentialRampToValueAtTime(0.2, now + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + at + 0.35);
        osc.start(now + at);
        osc.stop(now + at + 0.4);
      }
    },

    // A short, soft tone with a brief glide up (improving) or down
    // (worsening) that reads as directional without being alarming —
    // quieter and shorter than the chime so the two never get confused.
    playGuidancePulse(pitchHz, direction) {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const glide =
        direction === 'improving' ? PULSE_GLIDE : direction === 'worsening' ? 1 / PULSE_GLIDE : 1;
      const { osc, gain } = tone(audioCtx);
      osc.frequency.setValueAtTime(pitchHz, now);
      osc.frequency.linearRampToValueAtTime(pitchHz * glide, now + PULSE_DURATION_S);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + PULSE_DURATION_S);
      osc.start(now);
      osc.stop(now + PULSE_DURATION_S + 0.02);
    },
  };
}

export interface MuteToggle {
  /** Flips mute, stores the result, and returns whether it is now muted. */
  toggle(): boolean;
  isMuted(): boolean;
}

/**
 * One switch for both sounds. Muting remembers the exact earlier
 * values so unmuting restores them (`toggleMute`); unmuting is itself a
 * user gesture, so it unlocks audio when sound ends up on.
 */
export function createMuteToggle(settings: SettingsAccess, unlock: () => void): MuteToggle {
  let preMute: SoundPrefs | null = null;
  return {
    toggle() {
      const result = toggleMute(settings.get(), preMute);
      preMute = result.preMute;
      const next = { ...settings.get(), ...result.settings };
      settings.set(next);
      if (next.soundOnLevel || next.soundGuidance) unlock();
      return preMute !== null;
    },
    isMuted: () => preMute !== null,
  };
}

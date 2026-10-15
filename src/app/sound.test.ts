import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import type { SettingsAccess } from './boxWiring';
import { createMuteToggle, createSound, unlockOnFirstGesture } from './sound';

/** Rounds away floating-point noise in scheduled times and values. */
const r = (n: number) => Number(n.toFixed(6));

/** Records every value scheduled on it, as `kind:value@time`. */
class FakeParam {
  value = 0;
  readonly log: string[] = [];
  setValueAtTime(value: number, at: number) {
    this.log.push(`set:${r(value)}@${r(at)}`);
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.log.push(`linear:${r(value)}@${r(at)}`);
  }
  exponentialRampToValueAtTime(value: number, at: number) {
    this.log.push(`exp:${r(value)}@${r(at)}`);
  }
}

interface Tone {
  frequency: FakeParam;
  gain?: FakeParam;
  toSpeakers: boolean;
  start?: number;
  stop?: number;
}

/** An AudioContext stand-in: every oscillator becomes a `Tone`. */
function fakeContext(currentTime: number) {
  const tones: Tone[] = [];
  let resumed = 0;
  const destination = {};
  const context = {
    currentTime,
    destination,
    resume() {
      resumed += 1;
      return Promise.resolve();
    },
    createOscillator() {
      const tone: Tone = { frequency: new FakeParam(), toSpeakers: false };
      tones.push(tone);
      return {
        frequency: tone.frequency,
        connect(gainNode: { gain: FakeParam }) {
          tone.gain = gainNode.gain;
          return { connect: (to: unknown) => (tone.toSpeakers = to === destination) };
        },
        start: (at: number) => (tone.start = r(at)),
        stop: (at: number) => (tone.stop = r(at)),
      };
    },
    createGain: () => ({ gain: new FakeParam() }),
  };
  return { context: context as unknown as AudioContext, tones, resumed: () => resumed };
}

function soundWith(currentTime = 10) {
  const fake = fakeContext(currentTime);
  let created = 0;
  const sound = createSound(() => {
    created += 1;
    return fake.context;
  });
  return { sound, ...fake, created: () => created };
}

describe('createSound', () => {
  it('plays nothing before audio is unlocked', () => {
    const { sound, tones, created } = soundWith();
    sound.playChime();
    sound.playGuidancePulse(440, 'steady');
    expect(created()).toBe(0);
    expect(tones).toHaveLength(0);
  });

  it('creates one context on the first unlock and resumes it on every unlock', () => {
    const { sound, created, resumed } = soundWith();
    sound.unlock();
    sound.unlock();
    expect(created()).toBe(1);
    expect(resumed()).toBe(2);
  });

  it('does nothing where WebAudio does not exist', () => {
    const sound = createSound(() => null);
    expect(() => {
      sound.unlock();
      sound.playChime();
    }).not.toThrow();
  });

  it('unlocks speech with the audio and speaks through the speaker (#602)', () => {
    const said: string[] = [];
    let speechUnlocks = 0;
    const sound = createSound(() => null, {
      unlock: () => (speechUnlocks += 1),
      say: (text) => said.push(text),
    });
    sound.unlock();
    sound.speak('Level');
    expect(speechUnlocks).toBe(1);
    expect(said).toEqual(['Level']);
  });

  it('chimes two tones, 880 Hz then 1174.7 Hz 0.18 s later', () => {
    const { sound, tones } = soundWith(10);
    sound.unlock();
    sound.playChime();
    expect(tones.map((tone) => tone.frequency.value)).toEqual([880, 1174.7]);
    expect(tones.every((tone) => tone.toSpeakers)).toBe(true);
    expect(tones.map((tone) => [tone.start, tone.stop])).toEqual([
      [10, 10.4],
      [10.18, 10.58],
    ]);
    expect(tones[0]!.gain!.log).toEqual(['set:0.001@10', 'exp:0.2@10.02', 'exp:0.001@10.35']);
    expect(tones[1]!.gain!.log).toEqual(['set:0.001@10.18', 'exp:0.2@10.2', 'exp:0.001@10.53']);
  });

  it.each([
    ['improving', 440 * 1.15],
    ['worsening', 440 / 1.15],
    ['steady', 440],
  ] as const)('pulses one short tone that glides when %s', (direction, endHz) => {
    const { sound, tones } = soundWith(10);
    sound.unlock();
    sound.playGuidancePulse(440, direction);
    expect(tones).toHaveLength(1);
    const tone = tones[0]!;
    expect(tone.frequency.log).toEqual(['set:440@10', `linear:${r(endHz)}@10.09`]);
    expect(tone.gain!.log).toEqual(['set:0.0001@10', 'exp:0.12@10.015', 'exp:0.0001@10.09']);
    expect(tone.start).toBe(10);
    expect(tone.stop).toBe(10.11);
  });
});

function settingsAccess(initial: Partial<LevelSettings>) {
  let current: LevelSettings = { ...DEFAULT_SETTINGS, ...initial };
  const saved: LevelSettings[] = [];
  const access: SettingsAccess = {
    get: () => current,
    set(next) {
      current = next;
      saved.push(next);
    },
  };
  return { access, saved, current: () => current };
}

describe('createMuteToggle', () => {
  it('starts unmuted', () => {
    const { access } = settingsAccess({});
    expect(createMuteToggle(access, () => {}).isMuted()).toBe(false);
  });

  it('mutes both sounds, stores it, and does not unlock audio', () => {
    const { access, saved } = settingsAccess({ soundOnLevel: true, soundGuidance: true });
    let unlocks = 0;
    const mute = createMuteToggle(access, () => (unlocks += 1));
    expect(mute.toggle()).toBe(true);
    expect(mute.isMuted()).toBe(true);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ soundOnLevel: false, soundGuidance: false });
    expect(unlocks).toBe(0);
  });

  it('restores the exact earlier values on unmute and unlocks audio', () => {
    const { access, current } = settingsAccess({ soundOnLevel: false, soundGuidance: true });
    let unlocks = 0;
    const mute = createMuteToggle(access, () => (unlocks += 1));
    mute.toggle();
    expect(mute.toggle()).toBe(false);
    expect(current()).toMatchObject({ soundOnLevel: false, soundGuidance: true });
    expect(unlocks).toBe(1);
  });

  it('keeps every other setting as it was', () => {
    const { access, current } = settingsAccess({ toleranceMm: 7 });
    createMuteToggle(access, () => {}).toggle();
    expect(current().toleranceMm).toBe(7);
  });

  it('mutes spoken guidance too, and unlocks it again on unmute (#602)', () => {
    const { access, current } = settingsAccess({
      soundOnLevel: false,
      soundGuidance: false,
      soundSpeech: true,
    });
    let unlocks = 0;
    const mute = createMuteToggle(access, () => (unlocks += 1));
    mute.toggle();
    expect(current().soundSpeech).toBe(false);
    mute.toggle();
    expect(current().soundSpeech).toBe(true);
    expect(unlocks).toBe(1);
  });

  it('does not unlock audio when unmuting leaves both sounds off', () => {
    const { access } = settingsAccess({ soundOnLevel: false, soundGuidance: false });
    let unlocks = 0;
    const mute = createMuteToggle(access, () => (unlocks += 1));
    mute.toggle();
    mute.toggle();
    expect(unlocks).toBe(0);
  });
});

// #396: nothing else unlocks audio on a plain launch, so the chime and
// guidance stayed silent after every reload until a setting changed.
describe('unlockOnFirstGesture', () => {
  function counted() {
    const page = new EventTarget();
    let unlocks = 0;
    unlockOnFirstGesture(page, () => (unlocks += 1));
    return { page, unlocks: () => unlocks };
  }

  it('does not unlock before the user has done anything', () => {
    expect(counted().unlocks()).toBe(0);
  });

  it.each(['click', 'touchend', 'keydown'])('unlocks on the first %s', (gesture) => {
    const { page, unlocks } = counted();
    page.dispatchEvent(new Event(gesture));
    expect(unlocks()).toBe(1);
  });

  it('unlocks only once, whatever gestures follow', () => {
    const { page, unlocks } = counted();
    page.dispatchEvent(new Event('touchend'));
    page.dispatchEvent(new Event('click'));
    page.dispatchEvent(new Event('keydown'));
    expect(unlocks()).toBe(1);
  });

  it('ignores events that are not user gestures', () => {
    const { page, unlocks } = counted();
    page.dispatchEvent(new Event('scroll'));
    page.dispatchEvent(new Event('pointermove'));
    expect(unlocks()).toBe(0);
  });
});

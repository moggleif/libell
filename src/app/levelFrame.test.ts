import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings, type SensorSource } from '../domain/settings';
import type { GravityVector } from '../domain/leveling';
import { STALE_TIMEOUT_PHONE_MS } from '../domain/staleness';
import type { OrientationSensor, SensorState } from '../sensor/orientation';
import { createLevelFrame, type EngineTick, type LevelFrameView } from './levelFrame';

const FLAT: GravityVector = { x: 0, y: 0, z: 9.81 };
/** Standing on its edge: neither a flat phone nor a box mounted right
 * (a box's own mapping turns its proper mounting into FLAT). */
const ON_EDGE: GravityVector = { x: 0, y: 9.81, z: 0 };
const UPSIDE_DOWN: GravityVector = { x: 0, y: 0, z: -9.81 };
/** Rotated far enough between two frames to read as rocking. */
const ROCKED: GravityVector = { x: 9.81 * Math.tan((3 * Math.PI) / 180), y: 0, z: 9.81 };

interface Setup {
  source?: SensorSource;
  state?: SensorState;
  gravity?: GravityVector | null;
  lastSampleAt?: number | null;
  paused?: boolean;
  landscape?: boolean;
  visible?: boolean;
  hasSensorPage?: boolean;
  settings?: Partial<LevelSettings>;
  engine?: EngineTick;
}

/** A frame over fakes; every view call lands in `calls`, in order. */
function setup(initial: Setup = {}) {
  const world = {
    source: 'phone' as SensorSource,
    state: 'granted' as SensorState,
    gravity: FLAT as GravityVector | null,
    lastSampleAt: 0 as number | null,
    paused: false,
    landscape: false,
    visible: true,
    engine: { isLevel: false, maxCorrectionMm: 100 } as EngineTick,
    ...initial,
  };
  const settings: LevelSettings = { ...DEFAULT_SETTINGS, ...initial.settings };
  const calls: string[] = [];
  const view: LevelFrameView = {
    pause: () => void calls.push('pause'),
    showNoData: (unavailable, silent) => void calls.push(`noData:${unavailable}:${silent}`),
    showReading: () => void calls.push('reading'),
    showStale: (offer) => void calls.push(`stale:${offer}`),
    hideStale: () => void calls.push('hideStale'),
    showPose: (problem) =>
      void calls.push(`pose:${problem.message}:${problem.hint}:${problem.offerSensorPage}`),
    hidePose: () => void calls.push('hidePose'),
    tick: (_gravity, nowMs) => {
      calls.push(`tick:${nowMs}`);
      return world.engine;
    },
    showMeasuring: () => void calls.push('measuring'),
    celebrate: () => void calls.push('celebrate'),
    hideCelebration: () => void calls.push('hideCelebration'),
  };
  const sensor = {
    getSource: () => world.source,
    getState: () => world.state,
    getGravity: () => world.gravity,
    getLastSampleAt: () => world.lastSampleAt,
  } as unknown as OrientationSensor;
  const refreshStatus = vi.fn();
  const externalSensors = { canRetrySilently: vi.fn(() => true), maybeAutoRetry: vi.fn() };
  const playGuidancePulse = vi.fn();
  const frame = createLevelFrame({
    sensor: () => sensor,
    isPaused: () => world.paused,
    refreshStatus,
    externalSensors,
    hasSensorPage: initial.hasSensorPage ?? true,
    isLandscape: () => world.landscape,
    isVisible: () => world.visible,
    settings: () => settings,
    playGuidancePulse,
    view,
  });
  /** One frame at `now`, with the sample always fresh unless set. */
  const run = (now: number) => {
    calls.length = 0;
    if (initial.lastSampleAt === undefined) world.lastSampleAt = now;
    frame(now);
    return [...calls];
  };
  return { run, world, calls, refreshStatus, externalSensors, playGuidancePulse };
}

describe('createLevelFrame', () => {
  it('refreshes the sensor status on every frame, paused or not', () => {
    const { run, world, refreshStatus } = setup();
    run(0);
    world.paused = true;
    run(16);
    expect(refreshStatus).toHaveBeenCalledTimes(2);
  });

  it('pauses everything while a page is open', () => {
    const { run } = setup({ paused: true });
    expect(run(0)).toEqual(['pause']);
  });

  describe('without a reading', () => {
    it('shows no data and waits, while the sensor is still coming', () => {
      const { run, externalSensors } = setup({ gravity: null, state: 'idle' });
      expect(run(0)).toEqual(['noData:false:true']);
      expect(externalSensors.maybeAutoRetry).not.toHaveBeenCalled();
    });

    it('offers the way back and retries in the background once the box is lost', () => {
      const { run, externalSensors } = setup({
        source: 'easylevel',
        gravity: null,
        state: 'disconnected',
      });
      externalSensors.canRetrySilently.mockReturnValue(false);
      expect(run(500)).toEqual(['noData:true:false']);
      expect(externalSensors.maybeAutoRetry).toHaveBeenCalledWith(500);
    });
  });

  describe('a stale reading', () => {
    it('pauses the guidance with a link to the box page', () => {
      const { run } = setup({ source: 'xparkle', lastSampleAt: 0 });
      expect(run(60_000)).toEqual(['reading', 'stale:true', 'hidePose', 'hideCelebration']);
    });

    it('never links to a page for the phone, or when there is none', () => {
      const phone = setup({ lastSampleAt: 0 });
      expect(phone.run(STALE_TIMEOUT_PHONE_MS + 1)).toContain('stale:false');
      const noPage = setup({
        source: 'xparkle',
        lastSampleAt: 0,
        hasSensorPage: false,
      });
      expect(noPage.run(60_000)).toContain('stale:false');
    });

    it("uses the phone's own timeout", () => {
      const { run } = setup({ lastSampleAt: 0 });
      expect(run(STALE_TIMEOUT_PHONE_MS - 1)).toContain('hideStale');
    });
  });

  describe('the pose guard', () => {
    it('asks for the phone to lie flat', () => {
      const { run } = setup({ gravity: ON_EDGE });
      expect(run(0)).toEqual([
        'reading',
        'hideStale',
        'pose:pose.layFlat:pose.sensorHint:false',
        'hideCelebration',
      ]);
    });

    it('asks for portrait when the screen is landscape', () => {
      const { run } = setup({ landscape: true });
      expect(run(0)).toContain('pose:pose.portrait:pose.sensorHint:false');
    });

    it('asks an upright box to stand, with a link to its page', () => {
      const { run } = setup({ source: 'xparkle', gravity: ON_EDGE });
      expect(run(0)).toContain('pose:pose.sensorNotUpright:pose.sensorHintUpright:true');
    });

    it('tells a flat box it is upside down or too far off', () => {
      const upsideDown = setup({ source: 'easylevel', gravity: UPSIDE_DOWN });
      expect(upsideDown.run(0)).toContain('pose:pose.sensorUpsideDown:pose.sensorHint:true');
      const onEdge = setup({ source: 'easylevel', gravity: ON_EDGE });
      expect(onEdge.run(0)).toContain('pose:pose.sensorExtreme:pose.sensorHint:true');
    });

    it('ignores landscape for a box', () => {
      const { run } = setup({ source: 'xparkle', landscape: true });
      expect(run(0)).toEqual(['reading', 'hideStale', 'hidePose', 'tick:0', 'hideCelebration']);
    });
  });

  it('runs the engine and hides the celebration while not level', () => {
    const { run } = setup();
    expect(run(0)).toEqual(['reading', 'hideStale', 'hidePose', 'tick:0', 'hideCelebration']);
  });

  it('says it is measuring while the vehicle rocks', () => {
    const { run, world } = setup();
    run(0);
    world.gravity = ROCKED;
    expect(run(16)).toContain('measuring');
  });

  describe('the level celebration', () => {
    /** Clearly off level long enough to arm, then level at `levelAt`. */
    function armedThenLevel(options: Setup = {}, levelAt = 3100) {
      const frame = setup({ settings: { toleranceMm: 10 }, ...options });
      frame.run(0);
      frame.run(3000);
      frame.world.engine = { isLevel: true, maxCorrectionMm: 0 };
      return { ...frame, levelCalls: frame.run(levelAt) };
    }

    it('celebrates on reaching level after being clearly off for a while', () => {
      expect(armedThenLevel().levelCalls).toContain('celebrate');
    });

    it('never celebrates without being armed first', () => {
      const { run, world } = setup();
      world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(run(0)).not.toContain('celebrate');
    });

    it('is not armed by being only a little off, or off only briefly', () => {
      const near = setup({
        settings: { toleranceMm: 10 },
        engine: { isLevel: false, maxCorrectionMm: 25 },
      });
      near.run(0);
      near.run(5000);
      near.world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(near.run(5100)).not.toContain('celebrate');

      const brief = setup({ settings: { toleranceMm: 10 } });
      brief.run(0);
      brief.run(2900);
      brief.world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(brief.run(3000)).not.toContain('celebrate');
    });

    it('celebrates once per leveling, not again while staying level', () => {
      const { run } = armedThenLevel();
      expect(run(3200)).not.toContain('celebrate');
    });

    it('waits out the cooldown before celebrating again', () => {
      const { run, world } = armedThenLevel();
      world.engine = { isLevel: false, maxCorrectionMm: 100 };
      run(4000);
      run(7100);
      world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(run(7200)).not.toContain('celebrate');
      world.engine = { isLevel: false, maxCorrectionMm: 100 };
      run(21_000);
      run(24_100);
      world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(run(24_200)).toContain('celebrate');
    });

    it('stays armed while the page is hidden', () => {
      const { run, world, levelCalls } = armedThenLevel({ visible: false });
      expect(levelCalls).not.toContain('celebrate');
      world.engine = { isLevel: false, maxCorrectionMm: 100 };
      run(3200);
      world.visible = true;
      world.engine = { isLevel: true, maxCorrectionMm: 0 };
      expect(run(3300)).toContain('celebrate');
    });

    it('never celebrates while rocking', () => {
      const frame = setup({ settings: { toleranceMm: 10 } });
      frame.run(0);
      frame.run(3000);
      frame.world.engine = { isLevel: true, maxCorrectionMm: 0 };
      frame.world.gravity = ROCKED;
      expect(frame.run(3100)).not.toContain('celebrate');
    });
  });

  describe('audio guidance', () => {
    it('pulses only with the setting on', () => {
      const off = setup();
      off.run(0);
      off.run(5000);
      expect(off.playGuidancePulse).not.toHaveBeenCalled();
      const on = setup({ settings: { soundGuidance: true } });
      on.run(0);
      expect(on.playGuidancePulse).toHaveBeenCalledTimes(1);
    });

    it('waits the pulse interval between pulses', () => {
      const { run, playGuidancePulse } = setup({ settings: { soundGuidance: true } });
      run(0);
      run(1);
      expect(playGuidancePulse).toHaveBeenCalledTimes(1);
      run(5000);
      expect(playGuidancePulse).toHaveBeenCalledTimes(2);
    });

    it('stays quiet while level or rocking', () => {
      const level = setup({
        settings: { soundGuidance: true },
        engine: { isLevel: true, maxCorrectionMm: 0 },
      });
      level.run(0);
      expect(level.playGuidancePulse).not.toHaveBeenCalled();
      const rocking = setup({ settings: { soundGuidance: true } });
      rocking.run(0);
      rocking.world.gravity = ROCKED;
      rocking.run(1000);
      expect(rocking.playGuidancePulse).toHaveBeenCalledTimes(1);
    });
  });
});

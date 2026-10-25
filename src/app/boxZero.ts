/**
 * Zeroing an external box (ADR 0014): "set vehicle level" for the box in
 * use, stored as that box's installation offset.
 */
import {
  averageReadings,
  type Calibration,
  type CaptureResult,
  vehicleZeroFromReading,
} from '../domain/calibration';
import type { SensorSource } from '../domain/settings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { OrientationSensor } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR, type XparkleSensor } from '../sensor/xparkleSensor';
import { t } from '../ui/i18n';
import type { InstallOffsets } from './installOffsets';
import { exceedsCalibrationLimit } from './tiltReading';
import { countFeature } from './usage';

/** How long an EasyLevel zero averages the box's samples. */
export const EASYLEVEL_ZERO_SAMPLE_MS = 1500;
const SAMPLE_POLL_MS = 50;

export interface BoxZeroDeps {
  activeSensor(): OrientationSensor;
  /** The Xparkle adapter, if one was ever built. */
  getXparkle(): XparkleSensor | null;
  offsets: InstallOffsets;
  /** The active sensor's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  onChanged(): void;
  /** A box's zero was retaken or forgotten: its fine adjustment no longer
   * applies (#596). May hand back how to put that adjustment back, for an
   * undo (#624). */
  onZeroReplaced?(source: SensorSource): (() => void) | undefined;
  /** Wall time for the stored timestamp; defaults to `Date.now`. */
  now?: () => number;
  /** Monotonic time for the sampling window; defaults to `performance.now`. */
  clock?: () => number;
  wait?: (ms: number) => Promise<void>;
}

export interface BoxZeroing {
  /** Zero a box: null when stored, an error message, or — above 15° — a
   * warning that it was stored, with an undo (#624). Async for the boxes
   * that need it. */
  zero(source: SensorSource): CaptureResult | Promise<CaptureResult>;
  clear(source: SensorSource): void;
}

/** The deps with every default filled in. */
type Zeroer = Required<Omit<BoxZeroDeps, 'onZeroReplaced'>> & Pick<BoxZeroDeps, 'onZeroReplaced'>;

export function createBoxZeroing(deps: BoxZeroDeps): BoxZeroing {
  const zeroer: Zeroer = {
    ...deps,
    now: deps.now ?? Date.now,
    clock: deps.clock ?? (() => performance.now()),
    wait: deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))),
  };
  return {
    zero(source) {
      countFeature('zero-vehicle');
      if (source === 'xparkle') return zeroXparkle(zeroer);
      if (source === 'easylevel') return zeroEasyLevel(zeroer);
      const reading = zeroer.readTilt();
      if (typeof reading === 'string') return reading;
      return storeReading(zeroer, source, reading);
    },
    clear(source) {
      zeroer.offsets.clear(source);
      zeroer.onZeroReplaced?.(source);
      zeroer.onChanged();
    },
  };
}

/** Returns how to put back the zero, and its fine adjustment, it replaced. */
function store(zeroer: Zeroer, source: SensorSource, value: Calibration): () => void {
  const { offsets } = zeroer;
  const before = offsets.valueOf(source);
  const beforeAt = offsets.capturedAtOf(source);
  offsets.store(source, value, zeroer.now());
  const restoreTrim = zeroer.onZeroReplaced?.(source);
  zeroer.onChanged();
  return () => {
    if (before) offsets.store(source, before, beforeAt);
    else offsets.clear(source);
    restoreTrim?.();
    zeroer.onChanged();
  };
}

/** There is no box hardware-bias layer to subtract (unlike the phone's), so
 * `null` here means "none". A steep zero stays stored; the warning only
 * informs, with its undo (#624). */
function storeReading(zeroer: Zeroer, source: SensorSource, reading: Calibration): CaptureResult {
  const undo = store(zeroer, source, vehicleZeroFromReading(reading, null));
  if (!exceedsCalibrationLimit(reading)) return null;
  return { warning: t('calibration.vehicle.warn.notFlat'), undo };
}

/**
 * Averaged over `EASYLEVEL_ZERO_SAMPLE_MS` of the box's own samples rather
 * than taken from one. The box streams raw, unsmoothed readings, and its
 * own app says to press OK a few times until the value settles; this does
 * that settling in one tap. If the box drops while sampling, nothing is
 * stored and the user is told why.
 */
async function zeroEasyLevel(zeroer: Zeroer): Promise<CaptureResult> {
  const first = zeroer.readTilt();
  if (typeof first === 'string') return first;
  const readings = await sampleEasyLevel(zeroer, first);
  if (typeof readings === 'string') return readings;
  return storeReading(zeroer, 'easylevel', averageReadings(readings) ?? first);
}

/** Every new sample over the window, or why sampling stopped. */
async function sampleEasyLevel(
  zeroer: Zeroer,
  first: Calibration,
): Promise<Calibration[] | string> {
  const readings = [first];
  const sensor = zeroer.activeSensor;
  let lastAt = sensor().getLastSampleAt();
  const end = zeroer.clock() + EASYLEVEL_ZERO_SAMPLE_MS;
  while (zeroer.clock() < end) {
    await zeroer.wait(SAMPLE_POLL_MS);
    if (sensor().getSource() !== 'easylevel' || sensor().getState() !== 'granted') {
      return t('calibration.external.err.notConnected', {
        name: EASYLEVEL_DESCRIPTOR.displayName,
      });
    }
    const at = sensor().getLastSampleAt();
    if (at === null || at === lastAt) continue;
    lastAt = at;
    const reading = zeroer.readTilt();
    if (typeof reading !== 'string') readings.push(reading);
  }
  return readings;
}

/**
 * The Xparkle box zeroes itself (`resetZero`). It must stand upright for a
 * zero to hold; nothing is refused here, since its page shows live whether
 * it stands. Libell then stores a zero offset with the time: it changes no
 * reading, but it is what the lamp, the age text and "Check" go by, and it
 * replaces any older Libell-side offset so two zeros are never stacked.
 */
async function zeroXparkle(zeroer: Zeroer): Promise<string | null> {
  const name = XPARKLE_DESCRIPTOR.displayName;
  const box = zeroer.getXparkle();
  if (!box || box.getState() !== 'granted') {
    return t('calibration.external.err.notConnected', { name });
  }
  if (!(await box.zeroBox())) return t('calibration.external.err.failed', { name });
  store(zeroer, 'xparkle', { rollDeg: 0, pitchDeg: 0 });
  return null;
}

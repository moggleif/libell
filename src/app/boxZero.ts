/**
 * Zeroing an external box (#131, #290, ADR 0014): "set vehicle level" for
 * the box in use, stored as that box's installation offset.
 */
import { averageReadings, vehicleZeroFromReading, type CaptureResult } from '../domain/calibration';
import type { Calibration, SensorSource } from '../domain/settings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { OrientationSensor } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR, type XparkleSensor } from '../sensor/xparkleSensor';
import { t } from '../ui/i18n';
import type { InstallOffsets } from './installOffsets';
import { exceedsCalibrationLimit } from './tiltReading';

/** How long an EasyLevel zero averages the box's samples. */
export const EASYLEVEL_ZERO_SAMPLE_MS = 1500;
/** How often the sampling looks for a new sample. */
const SAMPLE_POLL_MS = 50;

export interface BoxZeroDeps {
  /** The source feeding readings now. */
  activeSensor(): OrientationSensor;
  /** The Xparkle adapter, if one was ever built. */
  getXparkle(): XparkleSensor | null;
  offsets: InstallOffsets;
  /** The active sensor's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** A zero was stored or forgotten: refresh the lamps. */
  onChanged(): void;
  /** Wall time for the stored timestamp; defaults to `Date.now`. */
  now?: () => number;
  /** Monotonic time for the sampling window; defaults to `performance.now`. */
  clock?: () => number;
  /** Defaults to a `setTimeout` promise. */
  wait?: (ms: number) => Promise<void>;
}

export interface BoxZeroing {
  /** Zero a box: null when stored, an error message, or a tilt warning
   * above 15° unless `anyway` says the user chose to go ahead (#425).
   * Async for the boxes that need it. */
  zero(source: SensorSource, anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  clear(source: SensorSource): void;
}

export function createBoxZeroing(deps: BoxZeroDeps): BoxZeroing {
  const now = deps.now ?? Date.now;
  const clock = deps.clock ?? (() => performance.now());
  const wait =
    deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  function store(source: SensorSource, value: Calibration): void {
    deps.offsets.store(source, value, now());
    deps.onChanged();
  }

  /** Store a box's zero from a reading; above 15° only once the user has
   * seen the warning and chosen to go ahead (#425). There is no box
   * hardware-bias layer to subtract (unlike the phone's), so `null` here
   * means "none". */
  function storeReading(
    source: SensorSource,
    reading: Calibration,
    anyway: boolean,
  ): CaptureResult {
    if (!anyway && exceedsCalibrationLimit(reading)) {
      return { warning: t('calibration.vehicle.warn.notFlat') };
    }
    store(source, vehicleZeroFromReading(reading, null));
    return null;
  }

  /**
   * Averaged over `EASYLEVEL_ZERO_SAMPLE_MS` of the box's own samples
   * rather than taken from one. The box streams raw, unsmoothed readings,
   * and its own app says to press OK a few times until the value settles;
   * this does that settling in one tap. If the box drops while sampling,
   * nothing is stored and the user is told why.
   */
  async function zeroEasyLevel(anyway: boolean): Promise<CaptureResult> {
    const first = deps.readTilt();
    if (typeof first === 'string') return first;
    const readings = [first];
    const sensor = deps.activeSensor;
    let lastAt = sensor().getLastSampleAt();
    const end = clock() + EASYLEVEL_ZERO_SAMPLE_MS;
    while (clock() < end) {
      await wait(SAMPLE_POLL_MS);
      if (sensor().getSource() !== 'easylevel' || sensor().getState() !== 'granted') {
        return t('calibration.external.err.notConnected', {
          name: EASYLEVEL_DESCRIPTOR.displayName,
        });
      }
      const at = sensor().getLastSampleAt();
      if (at === null || at === lastAt) continue;
      lastAt = at;
      const reading = deps.readTilt();
      if (typeof reading !== 'string') readings.push(reading);
    }
    return storeReading('easylevel', averageReadings(readings) ?? first, anyway);
  }

  /**
   * The Xparkle box zeroes itself (#290, `resetZero`). It must stand
   * upright for a zero to hold (#273); nothing is refused here, since its
   * page shows live whether it stands (#304). Libell then stores a zero
   * offset with the time: it changes no reading, but it is what the lamp,
   * the age text and "Check" go by, and it replaces any older Libell-side
   * offset so two zeros are never stacked.
   */
  async function zeroXparkle(): Promise<string | null> {
    const name = XPARKLE_DESCRIPTOR.displayName;
    const box = deps.getXparkle();
    if (!box || box.getState() !== 'granted') {
      return t('calibration.external.err.notConnected', { name });
    }
    if (!(await box.zeroBox())) return t('calibration.external.err.failed', { name });
    store('xparkle', { rollDeg: 0, pitchDeg: 0 });
    return null;
  }

  return {
    zero(source, anyway = false) {
      if (source === 'xparkle') return zeroXparkle();
      if (source === 'easylevel') return zeroEasyLevel(anyway);
      const reading = deps.readTilt();
      if (typeof reading === 'string') return reading;
      return storeReading(source, reading, anyway);
    },
    clear(source) {
      deps.offsets.clear(source);
      deps.onChanged();
    },
  };
}

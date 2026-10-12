/**
 * Simulated EasyLevel box — an `EasyLevelTransport` selected by
 * `?easylevel-sim`, plugged in at the same seam as the real one so everything
 * above it (status-before-accel ordering, calibration gate, bias subtraction,
 * mounting, R40 debug page, R33 remembered-device reconnect, and in `'drop'`
 * mode the R37 prompt and background auto-retry) is the code a real box runs
 * through. Payloads are the real wire format (`easyLevelProtocol.ts`).
 *
 * The simulated firmware is tier 3 (`faf52c22-...` byte 7 = 48) with a
 * non-zero bytes-8–19 calibration block ADDED to the raw accel counts, so
 * a pipeline that skips the bias subtraction shows a visibly wrong tilt
 * rather than silently passing. The corrected triplet resolves to `?demo`'s
 * tilt plus a deterministic ±4-count wobble, so the live UI visibly updates
 * while staying far inside the stillness detector's tolerance.
 *
 * Bytes through the seam only: no `navigator.bluetooth`, no UI. Lives in
 * `sensor/`, not `domain/`, because it owns real timers (ADR 0002).
 */
import type { EasyLevelConnection, EasyLevelTransport } from './easyLevelTransport';
import { createSimulatedLink, type SimulatedSession } from './simulatedLink';

export type EasyLevelSimulationMode = 'off' | 'steady' | 'drop';

/**
 * The `?easylevel-sim` query flag: absent → `'off'`; `?easylevel-sim=drop`
 * → `'drop'` (periodic simulated connection loss); any other presence →
 * `'steady'`. Composes with `?demo`, which replaces the phone sensor
 * instead.
 */
export function easyLevelSimulationMode(
  search: string = typeof location === 'undefined' ? '' : location.search,
): EasyLevelSimulationMode {
  const params = new URLSearchParams(search);
  if (!params.has('easylevel-sim')) return 'off';
  return params.get('easylevel-sim') === 'drop' ? 'drop' : 'steady';
}

/** Stable, so the remembered-device store and silent `reconnect()` work
 * across reloads as with a real box's browser-assigned id. */
export const SIMULATED_EASYLEVEL_DEVICE_ID = 'easylevel-simulated-box';

/**
 * A simulated id is only findable by the simulated transport and a real one
 * only through `getDevices()`; trying the mismatch adopts a 'disconnected'
 * sensor whose background auto-retry then loops forever on a lookup bound
 * to fail. The stored id is kept, so returning to the matching mode
 * reconnects normally.
 */
export function isRememberedEasyLevelDeviceUsable(
  deviceId: string,
  mode: EasyLevelSimulationMode = easyLevelSimulationMode(),
): boolean {
  return (deviceId === SIMULATED_EASYLEVEL_DEVICE_ID) === (mode !== 'off');
}

/** Same order as a real BLE notify stream, well inside the descriptor's
 * `staleTimeoutMs`. */
export const SIMULATED_ACCEL_INTERVAL_MS = 100;
/** Like a box that notifies status on subscribe (the best case), well
 * inside `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS`. */
export const SIMULATED_STATUS_DELAY_MS = 150;
const SIMULATED_STATUS_INTERVAL_MS = 5000;
/** `'drop'` mode: the link is lost this long after connecting — time to
 * watch live readings, short enough to exercise the R37 prompt and
 * auto-retry in a demo session. */
export const SIMULATED_DROP_AFTER_MS = 12000;
/** `'drop'` mode: `reconnect()` keeps failing this long, like a box out of
 * range. Otherwise the immediate auto-retry would recover within a frame
 * and the R37 prompt could not be watched. Longer than one 5 s auto-retry
 * interval, so a failed background retry is observable too. */
export const SIMULATED_OUTAGE_MS = 8000;

/** ±2g int16 → 16384 LSB/g. Only axis ratios matter downstream; the real
 * scale keeps the debug page's raw numbers plausible. */
const COUNTS_PER_G = 16384;
/** Mirrors `?demo`'s fixed tilt. */
const SIM_ROLL_DEG = -1.2;
const SIM_PITCH_DEG = -0.35;
/** The bytes-8–19 zero-bias block, added onto the raw accel counts so only
 * a pipeline that subtracts it lands on the tilt above. */
const SIM_BIAS = { accelX: 120, accelY: -80, accelZ: 64 };
/** Battery: `trunc(2620 × 0.1 − 200)` = 62% — healthy, no low warning. */
const SIM_BATTERY_RAW_MV = 2620;
/** Temperature: tier-2+ formula, int16 LE 1/100 °C → 21.5 °C. */
const SIM_TEMPERATURE_CENTI_C = 2150;
/** Byte 7 = 48 → firmware tier 3, the lowest calibration-carrying tier. */
const SIM_FIRMWARE_TIER_BYTE = 48;

function tiltCounts(deg: number): number {
  return Math.round(Math.tan((deg * Math.PI) / 180) * COUNTS_PER_G);
}

/** `faf52c21-...`: 12 bytes, accelX/Y/Z + gyroX/Y/Z(0) — the tier-≥-3
 * shape; never ≥ 18 bytes, which `parseAccelPacket` rightly reads as the
 * legacy embedded-bias format. */
function accelPacket(sampleIndex: number): DataView {
  const view = new DataView(new ArrayBuffer(12));
  const wobbleX = Math.round(4 * Math.sin(sampleIndex / 25));
  const wobbleY = Math.round(4 * Math.sin(sampleIndex / 31));
  view.setInt16(0, tiltCounts(SIM_ROLL_DEG) + wobbleX + SIM_BIAS.accelX, true);
  view.setInt16(2, tiltCounts(SIM_PITCH_DEG) + wobbleY + SIM_BIAS.accelY, true);
  view.setInt16(4, COUNTS_PER_G + SIM_BIAS.accelZ, true);
  // Bytes 6–11 (gyro) stay zero — never read downstream anyway.
  return view;
}

/** `faf52c22-...`: 20 bytes per `parseEasyLevelStatus`'s documented layout. */
function statusPacket(): DataView {
  const view = new DataView(new ArrayBuffer(20));
  view.setInt16(0, SIM_TEMPERATURE_CENTI_C, true);
  view.setUint16(2, SIM_BATTERY_RAW_MV, true);
  view.setUint8(7, SIM_FIRMWARE_TIER_BYTE);
  view.setInt16(8, SIM_BIAS.accelX, true);
  view.setInt16(10, SIM_BIAS.accelY, true);
  view.setInt16(12, SIM_BIAS.accelZ, true);
  // Bytes 14–19 (gyro biases) stay zero.
  return view;
}

export function createSimulatedEasyLevelTransport(
  mode: Exclude<EasyLevelSimulationMode, 'off'> = 'steady',
): EasyLevelTransport {
  return createSimulatedLink({
    deviceId: SIMULATED_EASYLEVEL_DEVICE_ID,
    drop:
      mode === 'drop'
        ? { dropAfterMs: SIMULATED_DROP_AFTER_MS, outageMs: SIMULATED_OUTAGE_MS }
        : null,
    open: openSimulatedEasyLevel,
  });
}

function openSimulatedEasyLevel(
  session: SimulatedSession,
): Omit<EasyLevelConnection, 'deviceId' | 'disconnect'> {
  let sampleIndex = 0;
  return {
    subscribeStatus: async (onData) => {
      session.after(SIMULATED_STATUS_DELAY_MS, () => onData(statusPacket()));
      session.every(SIMULATED_STATUS_INTERVAL_MS, () => onData(statusPacket()));
    },
    subscribeAccel: async (onData) => {
      session.every(SIMULATED_ACCEL_INTERVAL_MS, () => onData(accelPacket(sampleIndex++)));
    },
  };
}

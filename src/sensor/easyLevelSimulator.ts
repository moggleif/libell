/**
 * Simulated EasyLevel box (#220) — an `EasyLevelTransport` stand-in for
 * `createWebBluetoothTransport()`, selected by the `?easylevel-sim` query
 * flag, so the entire EasyLevel experience can be exercised with no
 * physical box and no Web Bluetooth at all: connect from the External
 * sensor page, the #217 status-before-accel ordering and initial-
 * calibration gate, the #215 tier-3 bias subtraction, the mounting
 * transform, the installation offset, the status/debug page (R40), the
 * remembered-device auto-reconnect on open (#130/R33) and — in `'drop'`
 * mode — the lost-connection prompt (R37) plus the background auto-retry
 * (#211), recovering over and over.
 *
 * Same philosophy as the `?demo` flag (a synthetic stand-in behind a query
 * flag, driving the real code path), applied one seam lower: the payloads
 * here are byte-for-byte the real box's wire format (`easyLevelProtocol
 * .ts`'s documented layouts), fed through the untouched
 * `createEasyLevelSensor()` machinery, so everything above the transport
 * seam is exactly the code a real box will run through. When the box
 * finally exists, its behavior can be compared screen-for-screen against
 * this simulation.
 *
 * The simulated firmware is tier 3 (`faf52c22-...` byte 7 = 48) with a
 * deliberately non-zero bytes-8–19 calibration block: the raw accel counts
 * carry that bias ADDED, so the leveling result is only correct if the
 * #215 subtraction actually runs — an accidentally-uncalibrated pipeline
 * shows a visibly wrong tilt rather than silently passing. The corrected
 * triplet resolves to a small fixed tilt (mirroring `?demo`'s), plus a
 * ±4-count deterministic wobble (a pure function of the sample index — no
 * clock, no randomness) so live UI visibly updates while staying far
 * inside the stillness detector's tolerance.
 *
 * Deliberately NOT here: any hook into `navigator.bluetooth`, and any
 * i18n/UI — the simulator only speaks bytes through the existing seam.
 * Lives in `sensor/`, not `domain/`: it owns real timers (ADR 0002 keeps
 * those out of the domain layer), which tests drive with fake timers.
 */
import type { EasyLevelConnection, EasyLevelTransport } from './easyLevelSensor';

export type EasyLevelSimulationMode = 'off' | 'steady' | 'drop';

/**
 * The `?easylevel-sim` query flag: absent → `'off'`; `?easylevel-sim=drop`
 * → `'drop'` (periodic simulated connection loss); any other presence →
 * `'steady'`. Composes with `?demo` but neither implies the other — demo
 * replaces the phone sensor, this replaces the EasyLevel transport.
 */
export function easyLevelSimulationMode(
  search: string = typeof location === 'undefined' ? '' : location.search,
): EasyLevelSimulationMode {
  const params = new URLSearchParams(search);
  if (!params.has('easylevel-sim')) return 'off';
  return params.get('easylevel-sim') === 'drop' ? 'drop' : 'steady';
}

/** Stable fake device id, so the remembered-device store (#130) and the
 * silent `reconnect()` path work across reloads exactly as with a real
 * box's browser-assigned id. */
export const SIMULATED_EASYLEVEL_DEVICE_ID = 'easylevel-simulated-box';

/**
 * Whether a remembered device id (#130) could possibly be reached in the
 * current simulation mode (#223). A simulated id is only ever findable by
 * the simulated transport, and a real one only by the real transport
 * hunting through `getDevices()` — so attempting the mismatched pairing
 * cannot succeed, and failing to check strands the app: `main.ts` adopts
 * the EasyLevel sensor on a failed startup reconnect (by design, so the
 * honest 'disconnected' UI shows), and the #211 background auto-retry
 * then loops forever on a lookup guaranteed to fail. Left as "not
 * reachable right now" rather than clearing the stored id, so returning
 * to the matching mode reconnects normally.
 *
 * Pure, with the mode passed in — the same time-and-state-as-parameter
 * discipline `sensorFallback.ts`'s `isEasyLevelAutoRetryDue` and
 * `domain/staleness.ts`'s `isSensorStale` already follow.
 */
export function isRememberedEasyLevelDeviceUsable(
  deviceId: string,
  mode: EasyLevelSimulationMode = easyLevelSimulationMode(),
): boolean {
  return (deviceId === SIMULATED_EASYLEVEL_DEVICE_ID) === (mode !== 'off');
}

/** Accel notification cadence — the same order of magnitude as a real BLE
 * notify stream, and comfortably inside `STALE_TIMEOUT_EASYLEVEL_MS`. */
export const SIMULATED_ACCEL_INTERVAL_MS = 100;
/** First status notification lands shortly after subscribing — like a box
 * that proactively notifies on subscribe (#217's best case), and well
 * inside `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS`. */
export const SIMULATED_STATUS_DELAY_MS = 150;
export const SIMULATED_STATUS_INTERVAL_MS = 5000;
/** `'drop'` mode: how long after connecting the simulated link is lost —
 * long enough to watch live readings first, short enough to exercise the
 * R37 prompt and the #211 auto-retry within a demo session. */
export const SIMULATED_DROP_AFTER_MS = 12000;
/** `'drop'` mode: how long after a drop `reconnect()` keeps failing — like
 * a box still out of range. Without this the #211 auto-retry (due
 * immediately on the first unavailable frame) would recover within one
 * animation frame, so the R37 prompt would never be visible long enough
 * to actually watch. Longer than one 5s auto-retry interval, so at least
 * one failed background retry is observable too. */
export const SIMULATED_OUTAGE_MS = 8000;

/** ±2g int16 → 16384 LSB/g, the scale `easyLevelProtocol.ts` documents.
 * Only the axis ratios matter downstream, but simulating the real scale
 * keeps the debug page's raw-triplet numbers plausible too. */
const COUNTS_PER_G = 16384;
/** The simulated vehicle's tilt — mirrors `?demo`'s fixed synthetic tilt. */
const SIM_ROLL_DEG = -1.2;
const SIM_PITCH_DEG = -0.35;
/** The advertised bytes-8–19 zero-bias block (#215) — added onto the raw
 * accel counts below, so only a pipeline that subtracts it lands on the
 * tilt above. */
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
  // `'drop'` mode's outage window (see `SIMULATED_OUTAGE_MS`) — plain
  // `Date.now()` rather than an injected clock: this module never runs in
  // `domain/`, and tests drive it with fake timers, which fake `Date` too.
  let lastDropAt: number | null = null;
  function makeConnection(onDisconnect: () => void): EasyLevelConnection {
    let live = true;
    let sampleIndex = 0;
    const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];
    const intervalIds: Array<ReturnType<typeof setInterval>> = [];
    const stop = () => {
      live = false;
      for (const id of timeoutIds) clearTimeout(id);
      for (const id of intervalIds) clearInterval(id);
    };
    if (mode === 'drop') {
      // A lost connection, not an explicit disconnect: stop the stream
      // and THEN report the drop, the same order a real GATT loss has —
      // `stop()` alone (the explicit-disconnect path below) never calls
      // `onDisconnect`, mirroring #219's real-transport rule that a
      // deliberate disconnect is not a lost connection.
      timeoutIds.push(
        setTimeout(() => {
          lastDropAt = Date.now();
          stop();
          onDisconnect();
        }, SIMULATED_DROP_AFTER_MS),
      );
    }
    return {
      deviceId: SIMULATED_EASYLEVEL_DEVICE_ID,
      subscribeStatus: async (onData) => {
        timeoutIds.push(
          setTimeout(() => {
            if (live) onData(statusPacket());
          }, SIMULATED_STATUS_DELAY_MS),
        );
        intervalIds.push(
          setInterval(() => {
            if (live) onData(statusPacket());
          }, SIMULATED_STATUS_INTERVAL_MS),
        );
      },
      subscribeAccel: async (onData) => {
        intervalIds.push(
          setInterval(() => {
            if (live) onData(accelPacket(sampleIndex++));
          }, SIMULATED_ACCEL_INTERVAL_MS),
        );
      },
      disconnect: stop,
    };
  }
  return {
    connect: async (onDisconnect) => makeConnection(onDisconnect),
    // The same "found among authorized devices?" contract as the real
    // transport (#130): only the simulated box's own id reconnects — and
    // in `'drop'` mode, not while the post-drop outage window is still
    // running (a box still out of range resolves null, never rejects,
    // exactly like the real transport's own catch).
    reconnect: async (deviceId, onDisconnect) => {
      if (deviceId !== SIMULATED_EASYLEVEL_DEVICE_ID) return null;
      if (lastDropAt !== null && Date.now() - lastDropAt < SIMULATED_OUTAGE_MS) return null;
      return makeConnection(onDisconnect);
    },
  };
}

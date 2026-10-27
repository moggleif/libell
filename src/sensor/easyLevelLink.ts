/**
 * One live link to an EasyLevel box, as `easyLevelSensor.ts` drives it:
 * subscribing status before accel, holding readings back until calibration is
 * known, treating a silent stream as lost, and clearing everything when the
 * link goes (see the module doc of `easyLevelSensor.ts`).
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting } from '../domain/sensorDeviceSettings';
import type { SensorState } from './orientation';
import {
  applyEasyLevelMounting,
  parseAccelPacket,
  parseEasyLevelStatus,
  type EasyLevelStatus,
} from './easyLevelProtocol';
import { isEasyLevelAvailable, type EasyLevelConnection } from './easyLevelTransport';
import type { BoxLinkSteps } from './boxLinkFlow';

/**
 * How long `getGravity()` is withheld after connecting while waiting for the
 * first status notification, which carries the bias bytes `parseAccelPacket`
 * needs. Libell's own defensive choice — the official app has no such wait:
 * long enough for a normal BLE notify round-trip, short enough not to stall
 * firmware that never sends status.
 */
export const EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS = 2000;

/** Time passed in as a parameter so this is testable without real timers. */
export function isEasyLevelInitialCalibrationWaitExpired(
  connectedAtMs: number,
  nowMs: number,
): boolean {
  return nowMs - connectedAtMs >= EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS;
}

/**
 * How long the box may stay silent, link still open, before it is treated as
 * lost: the link is closed and `'disconnected'` reported, exactly as for an
 * outright drop. The Xparkle adapter gets the same outcome from its read
 * timeout.
 *
 * Longer than `staleTimeoutMs`, so R35's "no new sensor data" overlay always
 * covers the gap first and an ordinary BLE hiccup only shows that overlay.
 * Counted only once connected; the connect itself is left to the browser.
 */
export const EASYLEVEL_SILENCE_LIMIT_MS = 10000;

const SILENCE_CHECK_INTERVAL_MS = 1000;

/** The link's mutable state; every function below works on one of these. */
export interface EasyLevelLink {
  state: SensorState;
  connection: EasyLevelConnection | null;
  gravity: GravityVector | null;
  /** Unrotated, so the lift guide's measurement is not skewed by a stored
   * mounting. */
  rawGravity: GravityVector | null;
  statusBytes: Uint8Array | null;
  status: EasyLevelStatus | null;
  /** Stamped on every accepted sample — the honest signal that data is
   * arriving, as opposed to the GATT link merely being open. */
  lastSampleAt: number | null;
  readonly getMounting: () => EasyLevelMounting;
  readonly now: () => number;
  readonly silenceWatch: ReturnType<typeof createSilenceWatch>;
}

export function createEasyLevelLink(
  getMounting: () => EasyLevelMounting,
  now: () => number,
): EasyLevelLink {
  const link: EasyLevelLink = {
    state: 'idle',
    connection: null,
    gravity: null,
    rawGravity: null,
    statusBytes: null,
    status: null,
    lastSampleAt: null,
    getMounting,
    now,
    silenceWatch: createSilenceWatch(
      now,
      () => link.state === 'granted',
      () => closeSilentLink(link),
    ),
  };
  return link;
}

/** EasyLevel's own part of the shared flow in `boxLinkFlow.ts`. */
export const EASYLEVEL_LINK_STEPS: BoxLinkSteps<EasyLevelLink, EasyLevelConnection> = {
  refusal: refusalToConnect,
  adopt,
  markLost,
};

/** The state to report instead of connecting, or null to go ahead. */
function refusalToConnect(link: EasyLevelLink): SensorState | null {
  if (link.state === 'granted') return link.state;
  if (!isEasyLevelAvailable()) {
    link.state = 'unsupported';
    return link.state;
  }
  return null;
}

async function adopt(link: EasyLevelLink, next: EasyLevelConnection): Promise<SensorState> {
  await wireConnection(link, next);
  link.state = 'granted';
  link.silenceWatch.start();
  return link.state;
}

/** Status before accel — see the module doc's "Startup ordering". */
async function wireConnection(link: EasyLevelLink, next: EasyLevelConnection): Promise<void> {
  link.connection = next;
  const gate = createCalibrationGate(link.now);
  await subscribeStatus(link, next, gate);
  try {
    await next.subscribeAccel((view) => {
      link.silenceWatch.heard();
      if (!gate.holdsBack()) acceptAccel(link, view);
    });
  } catch (error) {
    // Released rather than left half-open. disconnect() reports nothing
    // through `onDisconnect`, so the caller decides the surfaced state.
    next.disconnect();
    link.connection = null;
    throw error;
  }
}

/** Best-effort: a missing or rejected status characteristic must never
 * prevent leveling. Any status notification, even an unparseable one, opens
 * the calibration gate. */
async function subscribeStatus(
  link: EasyLevelLink,
  live: EasyLevelConnection,
  gate: ReturnType<typeof createCalibrationGate>,
): Promise<void> {
  try {
    await live.subscribeStatus((view) => {
      link.statusBytes = copyBytes(view);
      link.status = parseEasyLevelStatus(view);
      gate.open();
    });
  } catch {
    gate.open();
  }
}

function acceptAccel(link: EasyLevelLink, view: DataView): void {
  // Bias read per sample, so a later calibration or a cleared one applies at
  // once.
  const calibrated = parseAccelPacket(view, link.status?.calibration);
  link.rawGravity = calibrated;
  link.gravity = calibrated ? applyEasyLevelMounting(calibrated, link.getMounting()) : null;
  link.lastSampleAt = link.now();
}

/** Lost, not denied, so the UI offers reconnection. */
function markLost(link: EasyLevelLink): void {
  link.silenceWatch.stop();
  link.state = 'disconnected';
  clearReadings(link);
}

/** Closed actively: a half-open link keeps the box from advertising, so no
 * reconnect could find it. The transport's teardown reports nothing through
 * `onDisconnect`, so the lost state is set here, keeping `connection` for its
 * device id. */
function closeSilentLink(link: EasyLevelLink): void {
  link.connection?.disconnect();
  markLost(link);
}

/** Never show stale as live (R35). */
function clearReadings(link: EasyLevelLink): void {
  link.gravity = null;
  link.rawGravity = null;
  link.lastSampleAt = null;
  link.status = null;
}

function createSilenceWatch(now: () => number, isLive: () => boolean, onSilence: () => void) {
  let lastHeardAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  function stop(): void {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }
  return {
    start() {
      stop();
      lastHeardAt = now();
      timer = setInterval(() => {
        if (isLive() && now() - lastHeardAt > EASYLEVEL_SILENCE_LIMIT_MS) onSilence();
      }, SILENCE_CHECK_INTERVAL_MS);
    },
    stop,
    /** Any accel notification counts, even one the calibration gate holds back. */
    heard() {
      lastHeardAt = now();
    },
  };
}

/**
 * Holds back accel samples after a connect until calibration is known (see
 * the module doc). A held-back sample looks as if it had not arrived yet,
 * never like a reading missing available calibration.
 */
function createCalibrationGate(now: () => number) {
  const connectedAtMs = now();
  let waiting = true;
  return {
    /** A status notification arrived, or none ever will. */
    open() {
      waiting = false;
    },
    holdsBack(): boolean {
      if (!waiting) return false;
      if (!isEasyLevelInitialCalibrationWaitExpired(connectedAtMs, now())) return true;
      waiting = false; // give up waiting; best-effort from here on
      return false;
    },
  };
}

/** A copy, not a view: a transport may reuse its buffer for the next
 * notification, and the debug hex dump must show what actually arrived. */
function copyBytes(view: DataView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
}

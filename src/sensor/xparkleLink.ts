/**
 * One live link to an Xparkle box, as `xparkleSensor.ts` drives it: adopting
 * a connection with the vendor app's handshake, the poll loop that reads
 * `fff2`, the command replies on `fff4`, and dropping the link when it goes.
 */
import { applyAxisMapping, type AxisMapping } from '../domain/axisMapping';
import type { GravityVector } from '../domain/leveling';
import type { SensorState } from './orientation';
import {
  gravityFromAngles,
  gravityFromReading,
  parseLivePayload,
  type XparkleReading,
} from './xparkleProtocol';
import {
  createXparkleFrameReassembler,
  orientationFromByte,
  parseParameterReply,
  type XparkleOrientation,
} from './xparkleReplies';
import {
  buildPasswordFrame,
  buildQueryParameters,
  XPARKLE_DEFAULT_PASSWORD,
  XPARKLE_PASSWORD_MODE,
} from './xparkleCommands';
import type { XparkleConnection, XparkleTransport } from './xparkleTransport';

/**
 * Live-read poll interval. Matches the official app's leveling screen
 * (500 ms; its device list uses 1000 ms) — evidence the box tolerates the
 * rate.
 */
export const XPARKLE_POLL_INTERVAL_MS = 500;

/**
 * A read that never settles would stall the poll loop behind its in-flight
 * guard. Longer than any BLE round trip, shorter than the descriptor's
 * staleness timeout, so a wedged link surfaces as 'disconnected' rather than
 * as silently frozen guidance.
 */
export const XPARKLE_READ_TIMEOUT_MS = 2000;

/** How long "try again" waits for the box's password verdict. */
const XPARKLE_PASSWORD_REPLY_TIMEOUT_MS = XPARKLE_READ_TIMEOUT_MS;

interface Timers {
  setTimer: (handler: () => void, ms: number) => number;
  clearTimer: (id: number) => void;
}

/** What the link needs from the sensor's options, already defaulted. */
export interface LinkOptions {
  timers: Timers;
  getPassword: () => string;
  getAxisMapping: () => AxisMapping | null;
  now: () => number;
}

/** The link's mutable state; every function below works on one of these. */
export interface XparkleLink {
  connection: XparkleConnection | null;
  state: SensorState;
  deviceId: string | null;
  pollInFlight: boolean;
  /** `fff1`'s bytes, once read on this link. */
  versionBytes: Uint8Array | null;
  /** The `fff1` read is tried once per link, after its first reading. */
  versionAsked: boolean;
  readonly options: LinkOptions;
  readonly readings: ReturnType<typeof createReadings>;
  readonly replies: ReturnType<typeof createReplyListener>;
  readonly polling: ReturnType<typeof createPollLoop>;
}

export function createXparkleLink(options: LinkOptions): XparkleLink {
  const link: XparkleLink = {
    connection: null,
    state: 'idle',
    deviceId: null,
    pollInFlight: false,
    versionBytes: null,
    versionAsked: false,
    options,
    readings: createReadings(options),
    replies: createReplyListener(options.timers),
    polling: createPollLoop(
      () => pollOnce(link),
      () => link.connection !== null,
      XPARKLE_POLL_INTERVAL_MS,
      options.timers,
    ),
  };
  return link;
}

/** The OS picker, then the handshake. */
export async function connectWithPicker(
  link: XparkleLink,
  transport: XparkleTransport,
): Promise<SensorState> {
  try {
    return await adopt(link, await transport.connect(() => markDisconnected(link)));
  } catch {
    // A cancelled picker and a failed connect are the same to the caller. A
    // box already lost stays lost, so Retry's cancelled picker keeps the
    // unavailable prompt and its background retry.
    if (link.state !== 'disconnected') link.state = 'denied';
    return link.state;
  }
}

export async function reconnectSilently(
  link: XparkleLink,
  transport: XparkleTransport,
  deviceId: string,
): Promise<SensorState> {
  try {
    const live = await transport.reconnect(deviceId, () => markDisconnected(link));
    if (live) return await adopt(link, live);
  } catch {
    // Silent by design, like a box that cannot be found.
  }
  link.state = 'disconnected';
  return link.state;
}

export function disconnectByUser(link: XparkleLink): void {
  const live = link.connection;
  markDisconnected(link);
  link.state = 'idle';
  live?.disconnect();
}

async function adopt(link: XparkleLink, live: XparkleConnection): Promise<SensorState> {
  link.connection = live;
  link.deviceId = live.deviceId;
  link.versionBytes = null;
  link.versionAsked = false;
  link.state = 'granted';
  link.replies.restart();
  await sendHandshake(live, link.replies.handle, link.options.getPassword());
  link.polling.start();
  return link.state;
}

/** Clears the last reading too, so a stale value is never taken for a live
 * one. */
function markDisconnected(link: XparkleLink): void {
  link.polling.stop();
  link.replies.dropPartial();
  link.connection = null;
  link.readings.clear();
  link.state = 'disconnected';
}

/**
 * The link is actively closed: a BLE peripheral does not advertise while it
 * still holds a GATT connection, so a half-open link left behind makes every
 * later Retry miss a box sitting right there. The transport's teardown
 * removes its disconnect listener first, so this is not reported as a second
 * lost connection.
 */
function dropFailedLink(link: XparkleLink, live: XparkleConnection): void {
  markDisconnected(link);
  live.disconnect();
}

async function pollOnce(link: XparkleLink): Promise<void> {
  const live = link.connection;
  if (!live || link.pollInFlight) return;
  link.pollInFlight = true;
  try {
    const view = await withTimeout(live.readLive(), XPARKLE_READ_TIMEOUT_MS, link.options.timers);
    const parsed = view ? parseLivePayload(view) : null;
    // An unparseable payload is a bad packet, not a lost link;
    // `staleTimeoutMs` hides the guidance if they keep coming.
    if (parsed) link.readings.accept(parsed);
    if (parsed && !link.versionAsked && link.connection === live) {
      await readVersionOnce(link, live);
    }
  } catch {
    // A failed or timed-out read is the link going — but only this read's
    // link: a newer one adopted meanwhile has not failed.
    if (link.connection === live) dropFailedLink(link, live);
  } finally {
    link.pollInFlight = false;
  }
}

/**
 * The serial number and firmware, for the debug disclosure only. Read after
 * the first reading, inside the poll's in-flight guard so it never overlaps
 * another GATT operation; a failure is not the link going, and is not
 * retried on this link.
 */
async function readVersionOnce(link: XparkleLink, live: XparkleConnection): Promise<void> {
  link.versionAsked = true;
  try {
    const view = await withTimeout(
      live.readVersion(),
      XPARKLE_READ_TIMEOUT_MS,
      link.options.timers,
    );
    if (view && link.connection === live) {
      link.versionBytes = new Uint8Array(
        view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
      );
    }
  } catch {
    // Best-effort: the rows read "Not available yet".
  }
}

/** The latest reading, as the box reports it and as the vehicle sees it. */
function createReadings({ getAxisMapping, now }: LinkOptions) {
  let reading: XparkleReading | null = null;
  let gravity: GravityVector | null = null;
  let lastSampleAt: number | null = null;
  return {
    accept(parsed: XparkleReading): void {
      reading = parsed;
      gravity = vehicleGravity(parsed, getAxisMapping());
      lastSampleAt = now();
    },
    clear(): void {
      reading = null;
      gravity = null;
    },
    getReading: () => reading,
    getGravity: () => gravity,
    getLastSampleAt: () => lastSampleAt,
  };
}

function vehicleGravity(reading: XparkleReading, mapping: AxisMapping | null): GravityVector {
  if (!mapping) return gravityFromReading(reading);
  const mapped = applyAxisMapping(reading, mapping);
  return gravityFromAngles(mapped.rollDeg, mapped.pitchDeg);
}

/** What the box said in its command replies: its orientation and the
 * password verdict. */
function createReplyListener(timers: Timers) {
  const frames = createXparkleFrameReassembler();
  let orientation: XparkleOrientation | null = null;
  let passwordRejected = false;
  let onPasswordVerdict: ((accepted: boolean | null) => void) | null = null;
  return {
    handle(view: DataView): void {
      const frame = frames.push(view);
      if (!frame) return;
      const parameters = parseParameterReply(frame);
      if (parameters) {
        orientation = orientationFromByte(parameters.installationOrientation);
      } else if (isPasswordReply(frame)) {
        passwordRejected = !passwordAccepted(frame);
        onPasswordVerdict?.(!passwordRejected);
      }
    },
    /** A new link: no half-received reply, no verdict yet. */
    restart(): void {
      frames.reset();
      passwordRejected = false;
    },
    dropPartial: () => frames.reset(),
    /** The box's next password verdict, or null after the reply timeout. */
    nextPasswordVerdict: () =>
      waitForVerdict(timers, (listener) => {
        onPasswordVerdict = listener;
      }),
    abandonPasswordVerdict: () => onPasswordVerdict?.(null),
    getOrientation: () => orientation,
    isPasswordRejected: () => passwordRejected,
  };
}

function waitForVerdict(
  timers: Timers,
  listen: (listener: ((accepted: boolean | null) => void) | null) => void,
): Promise<boolean | null> {
  return new Promise<boolean | null>((resolve) => {
    const timer = timers.setTimer(() => finish(null), XPARKLE_PASSWORD_REPLY_TIMEOUT_MS);
    function finish(result: boolean | null): void {
      timers.clearTimer(timer);
      listen(null);
      resolve(result);
    }
    listen(finish);
  });
}

/** Command byte 4 (`XPARKLE_COMMAND.password`) marks the password verdict. */
function isPasswordReply(frame: Uint8Array): boolean {
  return frame.length > 2 && frame[2] === 0x04;
}

/** The password reply (command `4`) carries its verdict in byte 4: zero is
 * "accepted", matching the official app's own `setPwd(bArr[4] == 0)`. */
function passwordAccepted(frame: Uint8Array): boolean {
  return frame.length > 4 && frame[4] === 0;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timers: Timers): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = timers.setTimer(() => reject(new Error('read timed out')), ms);
    promise.then(
      (value) => {
        timers.clearTimer(timer);
        resolve(value);
      },
      (error: unknown) => {
        timers.clearTimer(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** Rescheduled after each attempt ends rather than on a fixed interval, so a
 * slow read delays the next one instead of stacking behind it. */
function createPollLoop(
  poll: () => Promise<void>,
  isConnected: () => boolean,
  intervalMs: number,
  timers: Timers,
) {
  let timer: number | null = null;
  function stop(): void {
    if (timer !== null) timers.clearTimer(timer);
    timer = null;
  }
  function tick(): void {
    void poll().finally(() => {
      if (isConnected()) timer = timers.setTimer(tick, intervalMs);
    });
  }
  return {
    start() {
      stop();
      tick();
    },
    stop,
  };
}

/**
 * The official app's post-connect sequence, minus its serial-number read
 * (used only for its update check). Every step is best-effort: only the
 * `fff2` read is required for leveling.
 */
async function sendHandshake(
  live: XparkleConnection,
  onReply: (view: DataView) => void,
  password: string,
): Promise<void> {
  try {
    await live.subscribeNotify(onReply);
  } catch {
    // No replies, so no orientation and no password verdict.
  }
  const frame = buildPasswordFrame(
    XPARKLE_PASSWORD_MODE.verify,
    XPARKLE_DEFAULT_PASSWORD,
    password,
  );
  if (frame) {
    try {
      await live.write(frame);
    } catch {
      // "Unknown", not "rejected": a failed write says nothing about the
      // password itself.
    }
  }
  try {
    await live.write(buildQueryParameters());
  } catch {
    // Orientation stays null; it is display-only.
  }
}

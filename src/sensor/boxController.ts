/**
 * The external-sensor lifecycle for every source, in one place: lazy
 * adapter construction, connect and disconnect, the silent reconnect at
 * app open, the background auto-retry and the "use phone sensor" escape
 * hatch — so ADR 0014's "never silently switch source" rule is enforced
 * here rather than across call sites in `main.ts`.
 *
 * **Everything is injected**, so the state machine is unit-testable with
 * fake adapters and fake time — no `navigator.bluetooth`, timers or DOM.
 *
 * It does not decide what a source *is* (the registry, ADR 0016), speak
 * any protocol (each adapter), or render anything (the shell, via
 * callbacks).
 */
import type { SensorSource } from '../domain/settings';
import type { OrientationSensor, SensorState } from './orientation';
import { isBoxAutoRetryDue } from './sensorFallback';

/**
 * What every external adapter offers beyond the plain `OrientationSensor`
 * seam: it can be connected with a user gesture, reconnected silently to a
 * device it already knows, and disconnected.
 */
export interface Box extends OrientationSensor {
  /** Connect with a live user gesture (a device picker, typically). */
  start(): Promise<SensorState>;
  /** Silent reconnect to an already-authorized device — never a picker. */
  reconnect(deviceId: string): Promise<SensorState>;
  disconnect(): void;
  /** The connected (or last-connected) device's id, for remembering. */
  getDeviceId(): string | null;
}

export interface BoxControllerOptions<T extends Box> {
  /** The always-available fallback. Never disconnected, never remembered. */
  phoneSensor: OrientationSensor;
  /**
   * Build the adapter for a source, or null when this build has none.
   * Called at most once per source: the instance is kept so a reconnect
   * reuses it rather than starting from a fresh state machine.
   */
  createSensor(source: SensorSource): T | null;
  /** The remembered device id for a source, if any. */
  loadDeviceId(source: SensorSource): string | null;
  saveDeviceId(source: SensorSource, deviceId: string): void;
  /**
   * Whether a remembered id can possibly be reached right now: a box
   * remembered in one simulation mode can never be found in another, and
   * trying anyway strands the app on R37's "unavailable" prompt with an
   * auto-retry that can never succeed.
   */
  isRememberedDeviceUsable(source: SensorSource, deviceId: string): boolean;
  /** Which source the last session left active (`settings.sensorSource`). */
  getPreferredSource(): SensorSource;
  /** Persist which source is active — read back on the next app open. */
  rememberSource(source: SensorSource): void;
  /**
   * A source has taken over and may need a screen that was never built
   * (e.g. a desktop with no phone motion sensors). Harmless to call when
   * the screen already exists.
   */
  onLevelScreenNeeded(): void;
  /** The active source changed, so the calibration lamp's condition did
   * too — it follows whichever source is active. */
  onIndicatorsChanged(): void;
  /** The connection state changed in a way the status row should show. */
  onStatusChanged(): void;
  /**
   * Whether this browser keeps device permission across app restarts
   * (`navigator.bluetooth.getDevices()`), so a silent reconnect can reach
   * a box picked in an earlier session. Chrome on Android keeps it behind
   * a flag. Optional: defaults to true.
   */
  hasPersistentDeviceAccess?(): boolean;
}

export interface BoxController<T extends Box> {
  /** The sensor feeding readings right now — the phone, or an external. */
  getActiveSensor(): OrientationSensor;
  /** The adapter for a source, if one has ever been constructed. */
  getSensor(source: SensorSource): T | null;
  /**
   * Connect (or reconnect) a source. Must be called synchronously inside
   * the button's own click handler: a device picker needs a live gesture.
   * Any other external source connected at the time is disconnected first.
   */
  connect(source: SensorSource): Promise<SensorState>;
  /**
   * Explicit disconnect — falls back to the phone sensor and starts it,
   * exactly as `usePhoneSensor()` does. Deliberately does NOT forget the
   * remembered device: this is "not right now", not "never again", so the
   * box stays one tap away while the next app open skips auto-reconnect.
   */
  disconnect(): void;
  /**
   * The fallback prompt's "Use phone sensor". The same real switch
   * `disconnect()` performs, plus the one thing only this path needs: the
   * tap is itself a user gesture, and `phoneSensor.start()` may never have
   * run (an external source can take over the whole startup flow), which
   * would otherwise leave the phone sitting at `getGravity() === null`
   * forever. A no-op once already granted.
   */
  usePhoneSensor(): void;
  /**
   * "Retry": the tap opens the device picker, like the sensor page's
   * connect button — a silent reconnect cannot reach the box on Chrome for
   * Android once the page has lost the device it picked. Must be called
   * synchronously inside the click handler, like `connect()`.
   */
  retry(): Promise<void>;
  /** The background counterpart to Retry, on its own cadence. */
  maybeAutoRetry(nowMs: number): void;
  /**
   * Whether that background retry can reach the active box at all:
   * yes once the box was picked in this page session, or when the browser
   * keeps device permission across restarts; no after a restart without
   * it, where only a tap in the picker can bring the box back.
   */
  canRetrySilently(): boolean;
  /**
   * Silent reconnect at app open. Resolves true once an external
   * source has taken over the startup flow — whether the box actually
   * answered or not, since a failed attempt still renders its
   * 'disconnected' state honestly through the ordinary per-frame loop.
   * False only when there was nothing to attempt, in which case the caller
   * runs the ordinary phone-sensor flow.
   */
  attemptAutoReconnect(): Promise<boolean>;
}

/** The controller's mutable state; the functions below work on one. */
interface Controller<T extends Box> {
  readonly options: BoxControllerOptions<T>;
  readonly sensors: Map<SensorSource, T>;
  active: OrientationSensor;
  /** Which external source is active, or null while the phone is. */
  activeSource: SensorSource | null;
  lastAutoRetryAt: number | null;
  autoRetryInFlight: boolean;
  /** Sources picked in the device picker during this page session. */
  readonly pickedThisSession: Set<SensorSource>;
}

export function createBoxController<T extends Box>(
  options: BoxControllerOptions<T>,
): BoxController<T> {
  const controller: Controller<T> = {
    options,
    sensors: new Map(),
    active: options.phoneSensor,
    activeSource: null,
    lastAutoRetryAt: null,
    autoRetryInFlight: false,
    pickedThisSession: new Set(),
  };
  return {
    getActiveSensor: () => controller.active,
    getSensor: (source) => controller.sensors.get(source) ?? null,
    connect: (source) => connect(controller, source),
    disconnect: () => switchToPhone(controller),
    usePhoneSensor: () => switchToPhone(controller),
    retry: () => retry(controller),
    maybeAutoRetry: (nowMs) => maybeAutoRetry(controller, nowMs),
    canRetrySilently: () => canRetrySilently(controller),
    attemptAutoReconnect: () => attemptAutoReconnect(controller),
  };
}

function sensorFor<T extends Box>(controller: Controller<T>, source: SensorSource): T | null {
  const existing = controller.sensors.get(source);
  if (existing) return existing;
  const created = controller.options.createSensor(source);
  if (created) controller.sensors.set(source, created);
  return created;
}

/**
 * Adopt a source as the one feeding readings — the single place that
 * switch happens (ADR 0014: never silently switch source).
 */
function adopt<T extends Box>(controller: Controller<T>, source: SensorSource, sensor: T): void {
  if (controller.activeSource !== null && controller.activeSource !== source) {
    // Never two connected at once: the previous one keeps delivering
    // samples (and its own auto-retry loop would keep firing) otherwise.
    controller.sensors.get(controller.activeSource)?.disconnect();
  }
  controller.active = sensor;
  controller.activeSource = source;
}

/** Both `disconnect()` and `usePhoneSensor()` start the phone: an external
 * source can take over the whole startup flow, so the phone may never have
 * been started. The tap is the gesture iOS needs; a no-op once granted. */
function switchToPhone<T extends Box>(controller: Controller<T>): void {
  if (controller.activeSource !== null) {
    controller.sensors.get(controller.activeSource)?.disconnect();
  }
  controller.active = controller.options.phoneSensor;
  controller.activeSource = null;
  controller.options.rememberSource('phone');
  controller.options.onIndicatorsChanged();
  void controller.options.phoneSensor.start();
}

async function connect<T extends Box>(
  controller: Controller<T>,
  source: SensorSource,
): Promise<SensorState> {
  const sensor = sensorFor(controller, source);
  if (!sensor) return 'unsupported';
  const state = await sensor.start();
  if (state === 'granted') takeOverAfterPicker(controller, source, sensor);
  return state;
}

function takeOverAfterPicker<T extends Box>(
  controller: Controller<T>,
  source: SensorSource,
  sensor: T,
): void {
  controller.pickedThisSession.add(source);
  adopt(controller, source, sensor);
  controller.options.rememberSource(source);
  // Remember this specific device, so a later app open can try a silent
  // reconnect instead of showing the picker again.
  const deviceId = sensor.getDeviceId();
  if (deviceId) controller.options.saveDeviceId(source, deviceId);
  controller.options.onLevelScreenNeeded();
  controller.options.onIndicatorsChanged();
}

async function retry<T extends Box>(controller: Controller<T>): Promise<void> {
  const source = controller.activeSource;
  if (source === null) return;
  await connect(controller, source);
  controller.options.onStatusChanged();
}

function maybeAutoRetry<T extends Box>(controller: Controller<T>, nowMs: number): void {
  // `frame()` calls this every animation frame, so the in-flight guard is
  // what keeps one slow reconnect from stacking up behind itself.
  if (controller.autoRetryInFlight) return;
  if (!isBoxAutoRetryDue(controller.lastAutoRetryAt, nowMs)) return;
  controller.lastAutoRetryAt = nowMs;
  controller.autoRetryInFlight = true;
  void reconnectSilently(controller).finally(() => {
    controller.autoRetryInFlight = false;
  });
}

/** The background loop has no gesture to open a picker with, so a silent
 * reconnect is all it can do. */
async function reconnectSilently<T extends Box>(controller: Controller<T>): Promise<void> {
  const source = controller.activeSource;
  const sensor = source === null ? null : (controller.sensors.get(source) ?? null);
  if (source === null || !sensor) return;
  const deviceId = sensor.getDeviceId() ?? controller.options.loadDeviceId(source);
  if (!deviceId) return;
  const state = await sensor.reconnect(deviceId);
  if (state === 'granted') {
    adopt(controller, source, sensor);
    controller.options.onIndicatorsChanged();
  }
  controller.options.onStatusChanged();
}

function canRetrySilently<T extends Box>(controller: Controller<T>): boolean {
  return (
    controller.activeSource !== null &&
    (controller.pickedThisSession.has(controller.activeSource) ||
      (controller.options.hasPersistentDeviceAccess?.() ?? true))
  );
}

async function attemptAutoReconnect<T extends Box>(controller: Controller<T>): Promise<boolean> {
  const remembered = rememberedDevice(controller);
  if (!remembered) return false;
  const { source, deviceId, sensor } = remembered;
  const state = await sensor.reconnect(deviceId);
  // Behave exactly as if this source had never been selected, so the
  // ordinary phone-sensor startup runs instead.
  if (state === 'unsupported') return false;
  adopt(controller, source, sensor);
  controller.options.onLevelScreenNeeded();
  controller.options.onStatusChanged();
  controller.options.onIndicatorsChanged();
  return true;
}

/** The box the last session left active, when there is one worth trying. */
function rememberedDevice<T extends Box>(
  controller: Controller<T>,
): { source: SensorSource; deviceId: string; sensor: T } | null {
  const source = controller.options.getPreferredSource();
  if (source === 'phone') return null;
  const deviceId = controller.options.loadDeviceId(source);
  if (!deviceId) return null;
  if (!controller.options.isRememberedDeviceUsable(source, deviceId)) return null;
  const sensor = sensorFor(controller, source);
  return sensor ? { source, deviceId, sensor } : null;
}

/**
 * The external-sensor lifecycle, in one place (#265).
 *
 * ADR 0014 says `main.ts` selects between `OrientationSensor`
 * implementations "at exactly one line". That was true of the
 * *assignment*; everything around it — lazy adapter construction, connect
 * and disconnect, the silent auto-reconnect at app open (#130), the
 * background auto-retry loop (#211), the "use phone sensor" escape hatch
 * (#134) — grew in `main.ts` anyway, as two dozen device-named closures in
 * a 1400-line entry point. A second source would have duplicated all of
 * it, and ADR 0014's most important rule (never silently switch source)
 * was spread across a dozen call sites rather than enforced in one.
 *
 * This module owns that lifecycle for every source. `main.ts` holds the
 * active sensor and wires callbacks; it no longer implements any of this.
 *
 * **Everything is injected**, so the whole state machine is unit-testable
 * with fake adapters and fake time — no `navigator.bluetooth`, no real
 * timers, no DOM — the same discipline `easyLevelSensor.ts` already
 * follows with its injected transport.
 *
 * **What this module does not do:** decide what a source *is* (that is the
 * registry, ADR 0016), speak any protocol (that is each adapter), or
 * render anything. It calls back into the shell for the three things a
 * source change means on screen, and leaves the shell to decide what those
 * look like.
 */
import type { SensorSource } from '../domain/settings';
import type { OrientationSensor, SensorState } from './orientation';
import { isExternalSensorAutoRetryDue } from './sensorFallback';

/**
 * What every external adapter offers beyond the plain `OrientationSensor`
 * seam: it can be connected with a user gesture, reconnected silently to a
 * device it already knows, and disconnected.
 */
export interface ExternalSensor extends OrientationSensor {
  /** Connect with a live user gesture (a device picker, typically). */
  start(): Promise<SensorState>;
  /** Silent reconnect to an already-authorized device — never a picker. */
  reconnect(deviceId: string): Promise<SensorState>;
  disconnect(): void;
  /** The connected (or last-connected) device's id, for remembering. */
  getDeviceId(): string | null;
}

export interface ExternalSensorControllerOptions<T extends ExternalSensor> {
  /** The always-available fallback. Never disconnected, never remembered. */
  phoneSensor: OrientationSensor;
  /**
   * Build the adapter for a source, or null when this build has none.
   * Called at most once per source: the instance is kept so a reconnect
   * reuses it rather than starting from a fresh state machine.
   */
  createSensor(source: SensorSource): T | null;
  /** The remembered device id for a source, if any (#130). */
  loadDeviceId(source: SensorSource): string | null;
  saveDeviceId(source: SensorSource, deviceId: string): void;
  /**
   * Whether a remembered id can possibly be reached right now (#223): a
   * box remembered in one simulation mode can never be found in another,
   * and attempting it anyway strands the app on R37's "unavailable"
   * prompt with an auto-retry that can never succeed.
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
   * too — it follows whichever source is active (#131). */
  onIndicatorsChanged(): void;
  /** The connection state changed in a way the status row should show. */
  onStatusChanged(): void;
}

export interface ExternalSensorController<T extends ExternalSensor> {
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
   * Explicit disconnect — falls back to the phone sensor. Deliberately
   * does NOT forget the remembered device (#130): this is "not right now",
   * not "never again", so the box stays one tap away while the next app
   * open skips auto-reconnect.
   */
  disconnect(): void;
  /**
   * The fallback prompt's "Use phone sensor" (#134). The same real switch
   * `disconnect()` performs, plus the one thing only this path needs: the
   * tap is itself a user gesture, and `phoneSensor.start()` may never have
   * run (an external source can take over the whole startup flow), which
   * would otherwise leave the phone sitting at `getGravity() === null`
   * forever. A no-op once already granted.
   */
  usePhoneSensor(): void;
  /** "Retry" (#134): one tap, one immediate attempt at the same box. */
  retry(): Promise<void>;
  /** The background counterpart to Retry (#211), on its own cadence. */
  maybeAutoRetry(nowMs: number): void;
  /**
   * Silent reconnect at app open (#130). Resolves true once an external
   * source has taken over the startup flow — whether the box actually
   * answered or not, since a failed attempt still renders its
   * 'disconnected' state honestly through the ordinary per-frame loop.
   * False only when there was nothing to attempt, in which case the caller
   * runs the ordinary phone-sensor flow.
   */
  attemptAutoReconnect(): Promise<boolean>;
}

export function createExternalSensorController<T extends ExternalSensor>(
  options: ExternalSensorControllerOptions<T>,
): ExternalSensorController<T> {
  /** Adapters are built lazily and kept, so a reconnect reuses the same
   * state machine rather than starting a fresh one. */
  const sensors = new Map<SensorSource, T>();
  let active: OrientationSensor = options.phoneSensor;
  /** Which external source is active, or null while the phone is. */
  let activeSource: SensorSource | null = null;
  let lastAutoRetryAt: number | null = null;
  let autoRetryInFlight = false;

  function sensorFor(source: SensorSource): T | null {
    const existing = sensors.get(source);
    if (existing) return existing;
    const created = options.createSensor(source);
    if (created) sensors.set(source, created);
    return created;
  }

  /**
   * Adopt a source as the one feeding readings. The single place that
   * switch happens — ADR 0014's "never silently switch" rule is a property
   * of this function having exactly one caller path per outcome, rather
   * than of a dozen call sites each remembering to do the right thing.
   */
  function adopt(source: SensorSource, sensor: T): void {
    if (activeSource !== null && activeSource !== source) {
      // Never two connected at once: the previous one keeps delivering
      // samples (and its own auto-retry loop would keep firing) otherwise.
      sensors.get(activeSource)?.disconnect();
    }
    active = sensor;
    activeSource = source;
  }

  function fallBackToPhone(): void {
    if (activeSource !== null) sensors.get(activeSource)?.disconnect();
    active = options.phoneSensor;
    activeSource = null;
    options.rememberSource('phone');
    options.onIndicatorsChanged();
  }

  async function connect(source: SensorSource): Promise<SensorState> {
    const sensor = sensorFor(source);
    if (!sensor) return 'unsupported';
    const state = await sensor.start();
    if (state === 'granted') {
      adopt(source, sensor);
      options.rememberSource(source);
      // Remember this specific device (#130), not just "some sensor", so a
      // later app open can try a silent reconnect instead of showing the
      // picker again.
      const deviceId = sensor.getDeviceId();
      if (deviceId) options.saveDeviceId(source, deviceId);
      options.onLevelScreenNeeded();
      options.onIndicatorsChanged();
    }
    return state;
  }

  async function retry(): Promise<void> {
    const source = activeSource;
    const sensor = source === null ? null : (sensors.get(source) ?? null);
    if (source === null || !sensor) return;
    const deviceId = sensor.getDeviceId() ?? options.loadDeviceId(source);
    if (!deviceId) return;
    const state = await sensor.reconnect(deviceId);
    if (state === 'granted') {
      adopt(source, sensor);
      options.onIndicatorsChanged();
    }
    options.onStatusChanged();
  }

  function maybeAutoRetry(nowMs: number): void {
    // `frame()` calls this every animation frame, so the in-flight guard is
    // what keeps one slow reconnect from stacking up behind itself.
    if (autoRetryInFlight) return;
    if (!isExternalSensorAutoRetryDue(lastAutoRetryAt, nowMs)) return;
    lastAutoRetryAt = nowMs;
    autoRetryInFlight = true;
    void retry().finally(() => {
      autoRetryInFlight = false;
    });
  }

  async function attemptAutoReconnect(): Promise<boolean> {
    const source = options.getPreferredSource();
    if (source === 'phone') return false;
    const deviceId = options.loadDeviceId(source);
    if (!deviceId) return false;
    if (!options.isRememberedDeviceUsable(source, deviceId)) return false;
    const sensor = sensorFor(source);
    if (!sensor) return false;
    const state = await sensor.reconnect(deviceId);
    // Behave exactly as if this source had never been selected, so the
    // ordinary phone-sensor startup runs instead.
    if (state === 'unsupported') return false;
    adopt(source, sensor);
    options.onLevelScreenNeeded();
    options.onStatusChanged();
    options.onIndicatorsChanged();
    return true;
  }

  return {
    getActiveSensor: () => active,
    getSensor: (source) => sensors.get(source) ?? null,
    connect,
    disconnect: fallBackToPhone,
    usePhoneSensor() {
      fallBackToPhone();
      void options.phoneSensor.start();
    },
    retry,
    maybeAutoRetry,
    attemptAutoReconnect,
  };
}

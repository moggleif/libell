/**
 * Sensor source section (#116, ADR 0014): one box's connect controls and
 * the sensor row that opens the box's own page — the `sensorSource`
 * choices beyond the phone's built-in sensor. Only ever built when an
 * external box is available at all (`main.ts` checks
 * `hasAvailableExternalSensor()` before creating the pages that embed this
 * section) — never a silent failure on Safari/iOS, per #116's acceptance
 * criteria.
 *
 * #129 added the connection-state text distinguishing a live connection
 * from one that dropped (previously both read as "connected", #116's
 * original minimal scope).
 *
 * **Where each half is shown (#226).** This factory builds two independent
 * halves and the callers decide where they go, because they answer
 * different questions:
 *   - `connectElement` — "which source is feeding readings, and how do I
 *     connect it": Connect (while not active) and the sensor row. This is
 *     the whole of the External sensor *list* page (`sensorPage.ts`).
 *   - `installElement` — the mounting picker (#217/#222, R43) and the
 *     installation offset (#131, R34): per-device *configuration*, so
 *     `sensorPage.ts` places it on that device's own page
 *     (`boxStatusPage.ts`'s `settingsSlot`), alongside the live
 *     battery/temperature/reading rows, rather than stacking it on the
 *     list that merely links there. Before #226 both halves sat on the
 *     list page, which left it longer than the detail page behind its own
 *     chevron and showed battery/temperature twice; the health rows now
 *     live only on that detail page.
 * The onboarding wizard uses the same split for a different reason —
 * connecting and setting the installation offset are two separate moments,
 * so each gets its own step — reusing these exact elements rather than a
 * wizard-only rebuild.
 *
 * #131's installation offset is here rather than inside the Calibration
 * menu section because it only makes sense once a box is (or was)
 * connected: the same "vehicle zero" concept R24 gives the phone (ADR
 * 0010), generalized to an external source per ADR 0014's three-way
 * calibration split.
 *
 * The sensor row's status text doubles as a button, opening
 * `boxStatusPage.ts` when `onOpenStatus` is supplied — optional
 * purely so callers/tests that don't need that page (the onboarding
 * wizard) can construct this section without threading a callback through.
 */
import type { CaptureResult } from '../domain/calibration';
import type { Calibration, EasyLevelMounting, SensorSource, VehicleType } from '../domain/settings';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import type { BoxPasswordOptions } from './boxPasswordBlock';
import { createBoxSetupChecklist } from './boxSetupChecklist';
import { createElement } from './dom';
import { t } from './i18n';
import type { LearnMountingOptions } from './learnMountingSection';
import { createSensorCard } from './sensorCard';

export interface SensorSourceOptions {
  /**
   * The external source this section is about (#262, ADR 0016). Its
   * `displayName` is substituted into the shipped strings, which name no
   * brand themselves (#267) — a product name is identical in every
   * language, so it comes from here rather than from a catalogue.
   */
  sensor: ExternalSensorDescriptor;
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /**
   * The active sensor's current state (#129) — in particular
   * `'disconnected'`, reached when a previously-granted box connection
   * drops while it stays the selected source (see, for example,
   * `easyLevelSensor.ts`'s `onGattDisconnected`).
   */
  getSensorState(): SensorState;
  /**
   * Connect (or reconnect) to the box. Must be called directly from this
   * button's click handler — `requestDevice` requires a live user
   * gesture. Resolves to the state reached: 'granted' on success,
   * 'denied' if the picker was cancelled or GATT connect failed,
   * 'unsupported' if Web Bluetooth vanished between page-open and click.
   */
  connectSensor(): Promise<SensorState>;
  /** Explicit disconnect — falls back to the phone sensor. */
  disconnectSensor(): void;
  /**
   * The box's password (#272, #367), for a box that asks for one: while it
   * rejects the code it was offered, the card says so instead of
   * "Connected" and offers a field to type the right code and try again.
   * Optional: most sources have no password.
   */
  password?: BoxPasswordOptions;
  /**
   * The box's installation offset (#131, ADR 0014) — where the
   * permanently-mounted enclosure physically sits, mirroring
   * `CalibrationOptions.getVehicleCalibration()` but stored completely
   * independently: this is never the phone's own vehicle zero.
   */
  getInstallCalibration(): Calibration | null;
  /**
   * "Set vehicle level": capture the current reading as this box's
   * installation offset — or, for a box that zeroes itself (#290), have the
   * box do it. Returns an error text, or null on success; a box that must
   * be written to answers asynchronously. Above 15° it answers with a
   * warning instead, offering "Zero anyway" (`anyway`, #425).
   */
  calibrateInstall(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  /** When the installation offset was captured (R26) — null when unknown. */
  getInstallCalibrationCapturedAt(): number | null;
  clearInstallCalibration(): void;
  /** Which physical mounting orientation this box is installed in (#217,
   * R43) — only rendered when the descriptor declares `mounting`. */
  getMounting(): EasyLevelMounting;
  /** Whether the user has picked it (#359); until then the step asks. */
  isMountingPicked(): boolean;
  /** Takes effect on the very next reading, no reconnect needed; null
   * forgets the pick and goes back to the standard placement (#359). */
  setMounting(mounting: EasyLevelMounting | null): void;
  /** The "learn the mounting" guide (#293) — only rendered when the
   * descriptor declares `learnMounting` and this is supplied. */
  learnMounting?: Omit<LearnMountingOptions, 'name'>;
  /** Which vehicle the mounting picker draws (#314); motorhome if omitted. */
  getVehicleType?(): VehicleType;
  /** The box's live reading, for the position step (#314); null before
   * the first sample. */
  getCalibratedTilt?(): Calibration | null;
}

export interface SensorSourceSection {
  /** Both halves together — only useful to a caller that really wants
   * them stacked; `sensorPage.ts` (#226) places the two on different
   * pages instead, and the onboarding wizard on different steps. Moving
   * either half into another parent re-parents it away from `element`,
   * which is fine: nothing here reads `element`'s children after
   * construction. */
  element: HTMLElement;
  /** Connect half alone: Connect (while not active), sensor row — see the
   * module doc comment's "Where each half is shown". */
  connectElement: HTMLElement;
  /** Mounting + installation-offset half alone — see `connectElement`. */
  installElement: HTMLElement;
  /** The rarely needed actions (#314) — check/clear the zero, forget the
   * direction, disconnect — for the device page's "More" disclosure. */
  moreElement: HTMLElement;
  refresh(): void;
  /** Re-reads the live position step only; cheap enough every frame. */
  refreshLive(): void;
  /** The live position step alone (#317), for the first-run wizard,
   * which checks the box's position and leaves direction and zero for the
   * first parking. Moving it out of `installElement` is fine: the wizard
   * builds a fresh section per step. */
  positionElement: HTMLElement;
}

/** Disconnect, at the foot of the device page (#332), in the warning
 * colour: it stops the box feeding readings. */
function createDisconnectFooter(onDisconnect: () => void): HTMLElement {
  const footer = createElement('div', 'box-footer__actions');
  const button = createElement('button', 'menu__action menu__action--secondary box-disconnect');
  button.type = 'button';
  button.textContent = t('sensorSource.disconnect');
  button.addEventListener('click', onDisconnect);
  footer.append(button);
  return footer;
}

/** What the section is drawn for, so a connect or a drop from anywhere
 * (the page's own header button included) redraws it at once (#343). The
 * password verdict arrives on its own, after the connect (#367), so it is
 * part of what the card was drawn for. */
function drawKeyOf(options: SensorSourceOptions): string {
  const rejected = options.password?.isRejected() ?? false;
  return `${options.getSensorSource()}|${options.getSensorState()}|${rejected}`;
}

export function createSensorSourceSection(
  options: SensorSourceOptions,
  onOpenStatus?: () => void,
  /**
   * Called after this section connects or disconnects (#272). With more
   * than one source listed, the OTHER rows are now stale — one of them was
   * showing "using the phone's own sensor" and no longer is — and nothing
   * else would refresh them until the page is reopened.
   */
  onSourceChanged?: () => void,
): SensorSourceSection {
  const card = createSensorCard(options, onOpenStatus, onSourceChanged);
  const checklist = createBoxSetupChecklist(options);
  const footer = createDisconnectFooter(() => {
    options.disconnectSensor();
    refresh();
    onSourceChanged?.();
  });
  const body = document.createElement('div');
  body.append(card.element, checklist.element, footer);

  let drawnFor = '';
  const drawKey = () => drawKeyOf(options);

  function refresh(): void {
    drawnFor = drawKey();
    card.refresh();
    // This section's own source, not "any external source" (#272): with
    // more than one listed, each card answers for itself.
    const active = options.getSensorSource() === options.sensor.id;
    checklist.element.hidden = !active;
    footer.hidden = !active;
    if (active) checklist.refresh();
  }

  refresh();
  return {
    element: body,
    connectElement: card.element,
    installElement: checklist.element,
    moreElement: footer,
    refresh,
    refreshLive: () => {
      if (drawKey() !== drawnFor) refresh();
      else checklist.refreshPosition();
    },
    positionElement: checklist.positionElement,
  };
}

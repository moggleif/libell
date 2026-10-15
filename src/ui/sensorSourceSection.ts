/**
 * Sensor source section (ADR 0014): one box's connect controls and the
 * sensor row that opens the box's own page. Only built when an external
 * box is available at all (`hasAvailableBox()`) — never a
 * silent failure on Safari/iOS.
 *
 * **Where each half is shown.** The callers place the halves, because they
 * answer different questions:
 *   - `connectElement` — "which source is feeding readings, and how do I
 *     connect it": the whole of the External sensor *list* page.
 *   - `installElement` — the mounting picker and the installation offset:
 *     per-device *configuration*, so it goes on that device's own page
 *     (`boxStatusPage.ts`'s `settingsSlot`), not on the list that merely
 *     links there.
 * The onboarding wizard reuses the same split, since connecting and setting
 * the installation offset are separate steps there.
 *
 * The installation offset lives here rather than in the Calibration
 * section because it only makes sense once a box is (or was) connected: the
 * phone's "vehicle zero" (ADR 0010) generalized to an external source per
 * ADR 0014's three-way calibration split.
 *
 * `onOpenStatus` is optional so callers that don't need the box's page (the
 * onboarding wizard) need not pass it.
 */
import type { Calibration, CaptureResult } from '../domain/calibration';
import type { SensorSource, VehicleType } from '../domain/settings';
import type { EasyLevelMounting } from '../domain/sensorDeviceSettings';
import type { BoxDescriptor } from '../sensor/boxes';
import type { SensorState } from '../sensor/orientation';
import type { BoxPasswordOptions } from './boxPasswordBlock';
import { createBoxSetupChecklist } from './boxSetupChecklist';
import { createElement } from './dom';
import { t } from './i18n';
import type { LearnMountingOptions } from './learnMountingSection';
import { createSensorCard } from './sensorCard';
import type { ZeroTrimOptions } from './zeroTrimRow';

export interface SensorSourceOptions {
  /**
   * The external source this section is about (ADR 0016). Its
   * `displayName` is substituted into the shipped strings, which name no
   * brand themselves — a product name is identical in every
   * language, so it comes from here rather than from a catalogue.
   */
  sensor: BoxDescriptor;
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /**
   * The active sensor's current state — in particular
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
   * The box's password, for a box that asks for one: while it
   * rejects the code it was offered, the card says so instead of
   * "Connected" and offers a field to type the right code and try again.
   * Optional: most sources have no password.
   */
  password?: BoxPasswordOptions;
  /**
   * The box's installation offset (ADR 0014) — where the
   * permanently-mounted enclosure physically sits, mirroring
   * `CalibrationOptions.getVehicleCalibration()` but stored completely
   * independently: this is never the phone's own vehicle zero.
   */
  getInstallCalibration(): Calibration | null;
  /** Fine adjustment of that zero (#596); no row when omitted. */
  installZeroTrim?: ZeroTrimOptions;
  /**
   * "Set vehicle level": capture the current reading as this box's
   * installation offset — or, for a box that zeroes itself, have the box do
   * it. Returns an error text, or null on success; a box that must be
   * written to answers asynchronously. Above 15° it answers with a warning
   * instead, offering "Zero anyway" (`anyway`).
   */
  calibrateInstall(anyway?: boolean): CaptureResult | Promise<CaptureResult>;
  /** When the installation offset was captured — null when unknown. */
  getInstallCalibrationCapturedAt(): number | null;
  clearInstallCalibration(): void;
  /** Which physical mounting orientation this box is installed in — only
   * rendered when the descriptor declares `mounting`. */
  getMounting(): EasyLevelMounting;
  /** Takes effect on the very next reading, no reconnect needed. */
  setMounting(mounting: EasyLevelMounting): void;
  /** The "learn the mounting" guide — only rendered when the
   * descriptor declares `learnMounting` and this is supplied. */
  learnMounting?: Omit<LearnMountingOptions, 'name'>;
  /** Which vehicle the mounting picker draws; motorhome if omitted. */
  getVehicleType?(): VehicleType;
  /** The box's live reading, for the position step; null before
   * the first sample. */
  getCalibratedTilt?(): Calibration | null;
}

export interface SensorSourceSection {
  /** Both halves together. Moving either half into another parent is
   * fine: nothing here reads `element`'s children after construction. */
  element: HTMLElement;
  /** Connect half alone: Connect (while not active), sensor row — see the
   * module doc comment's "Where each half is shown". */
  connectElement: HTMLElement;
  /** Mounting + installation-offset half alone — see `connectElement`. */
  installElement: HTMLElement;
  /** The rarely needed actions — check/clear the zero, forget the
   * direction, disconnect — for the device page's "More" disclosure. */
  moreElement: HTMLElement;
  refresh(): void;
  /** Re-reads the live position step only; cheap enough every frame. */
  refreshLive(): void;
  /** The live position step alone, for the first-run wizard,
   * which checks the box's position and leaves direction and zero for the
   * first parking. Moving it out of `installElement` is fine: the wizard
   * builds a fresh section per step. */
  positionElement: HTMLElement;
}

/** Disconnect, at the foot of the device page, in the warning
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
 * (the page's own header button included) redraws it at once. The password
 * verdict arrives on its own, after the connect, so it is part of the key. */
function drawKeyOf(options: SensorSourceOptions): string {
  const rejected = options.password?.isRejected() ?? false;
  return `${options.getSensorSource()}|${options.getSensorState()}|${rejected}`;
}

export function createSensorSourceSection(
  options: SensorSourceOptions,
  onOpenStatus?: () => void,
  /**
   * Called after this section connects or disconnects: with more than one
   * source listed, the OTHER rows are now stale and nothing else would
   * refresh them until the page is reopened.
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
    // This section's own source, not "any external source": with more than
    // one listed, each card answers for itself. The steps stay, greyed out by
    // the checklist itself, so they still show what is set (#400).
    footer.hidden = options.getSensorSource() !== options.sensor.id;
    checklist.refresh();
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

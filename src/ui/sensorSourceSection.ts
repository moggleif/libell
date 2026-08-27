/**
 * Sensor source section (#116, ADR 0014): the "Connect EasyLevel sensor"
 * controls and the sensor row that opens the box's own page — the only
 * working `sensorSource` choice beyond the phone's built-in sensor. Only
 * ever built when EasyLevel is available at all (`main.ts` checks
 * `isEasyLevelAvailable()` before creating the pages that embed this
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
 *     connect it": intro, Connect/Reconnect, and the sensor row. This is
 *     the whole of the External sensor *list* page (`sensorPage.ts`).
 *   - `installElement` — the mounting picker (#217/#222, R43) and the
 *     installation offset (#131, R34): per-device *configuration*, so
 *     `sensorPage.ts` places it on that device's own page
 *     (`easyLevelStatusPage.ts`'s `settingsSlot`), alongside the live
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
 * menu section because it only makes sense once EasyLevel is (or was)
 * connected: the same "vehicle zero" concept R24 gives the phone (ADR
 * 0010), generalized to this external source per ADR 0014's three-way
 * calibration split.
 *
 * The sensor row's status text doubles as a button, opening
 * `easyLevelStatusPage.ts` when `onOpenStatus` is supplied — optional
 * purely so callers/tests that don't need that page (the onboarding
 * wizard) can construct this section without threading a callback through.
 */
import {
  EASYLEVEL_MOUNTINGS,
  type Calibration,
  type EasyLevelMounting,
  type SensorSource,
} from '../domain/settings';
import type { EasyLevelStatus } from '../sensor/easyLevelProtocol';
import type { SensorState } from '../sensor/orientation';
import { ageText } from './calibrationAge';
import { t } from './i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/** How far the icon's box is drawn round for each mounting (#222) — the
 * same rotation `applyEasyLevelMounting` applies to the readings, so the
 * picture and the maths can never drift apart. */
const MOUNTING_ICON_DEGREES: Record<EasyLevelMounting, number> = {
  standard: 0,
  rotated90: 90,
  rotated180: 180,
  rotated270: 270,
};

/**
 * Top-down box-mounting diagram (#217): a small upward arrow labeled
 * "front" over a rectangle representing the sensor box, itself carrying an
 * arrow of its own — the box's long axis runs left/right for `'standard'`,
 * front/back for `'rotated90'`, the box's own arrow rotating along with
 * it. Deliberately schematic, not a literal redraw of the official app's
 * own illustrations (`top_wideside_rv.webp`/`top_shortside_rv.webp`) —
 * just enough for a user to visually match "which way did I screw mine
 * in" without needing to know that app's own terminology. Colors come
 * from the existing CSS custom properties, same as every other icon in
 * this codebase (no hex values here).
 */
function mountingIcon(mounting: EasyLevelMounting): SVGSVGElement {
  const icon = svgEl('svg', {
    viewBox: '0 0 64 64',
    class: 'mounting-icon',
    'aria-hidden': 'true',
  });
  // "Front of vehicle" arrow, fixed regardless of mounting.
  icon.append(
    svgEl('line', { x1: '32', y1: '4', x2: '32', y2: '16', class: 'mounting-icon__front' }),
    svgEl('polygon', { points: '32,2 27,12 37,12', class: 'mounting-icon__front' }),
  );
  // The box itself: a rectangle longer one way than the other, drawn at
  // the chosen rotation — plus a short arrow through it marking the same
  // physical edge in every drawing, so the four options read as "the same
  // box turned", not "four different boxes". The arrow is what makes the
  // half turn (#222) distinguishable from 'standard' at a glance: the
  // outline alone would look identical.
  const degrees = MOUNTING_ICON_DEGREES[mounting];
  const group = svgEl('g', {
    transform: degrees === 0 ? '' : `rotate(${degrees} 32 40)`,
    class: 'mounting-icon__box',
  });
  group.append(
    svgEl('rect', { x: '14', y: '28', width: '36', height: '24', rx: '4' }),
    svgEl('line', { x1: '32', y1: '46', x2: '32', y2: '34' }),
    svgEl('polygon', { points: '32,30 28,38 36,38' }),
  );
  icon.append(group);
  return icon;
}

export interface SensorSourceOptions {
  /** Which source is feeding gravity readings right now. */
  getSensorSource(): SensorSource;
  /**
   * The active sensor's current state (#129) — in particular
   * `'disconnected'`, reached when a previously-granted EasyLevel
   * connection drops while it stays the selected source (see
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
  connectEasyLevel(): Promise<SensorState>;
  /** Explicit disconnect — falls back to the phone sensor. */
  disconnectEasyLevel(): void;
  /** `faf52c22-...` parsed into battery/temperature/firmware-tier (#123),
   * or null before the first status notification arrives. */
  getEasyLevelStatus(): EasyLevelStatus | null;
  /**
   * The box's installation offset (#131, ADR 0014) — where the
   * permanently-mounted enclosure physically sits, mirroring
   * `CalibrationOptions.getVehicleCalibration()` but stored completely
   * independently: this is never the phone's own vehicle zero.
   */
  getInstallCalibration(): Calibration | null;
  /** Capture the current reading as this box's installation offset ("Set vehicle level"). Returns an error text, or null on success. */
  calibrateInstall(): string | null;
  /** When the installation offset was captured (R26) — null when unknown. */
  getInstallCalibrationCapturedAt(): number | null;
  /** Compare the current reading against the installation offset's promise of zero — returns a verdict text (R26). */
  checkInstallCalibration(): string;
  clearInstallCalibration(): void;
  /** Which of the box's two physical mounting orientations to use (#217) —
   * mirrors the official app's own `"sensor_Placing"` setting. */
  getEasyLevelMounting(): EasyLevelMounting;
  /** Takes effect on the very next accel reading, no reconnect needed —
   * same live-apply behavior `setEasyLevelConnectDelay` already has. */
  setEasyLevelMounting(mounting: EasyLevelMounting): void;
}

export interface SensorSourceSection {
  /** Both halves together — only useful to a caller that really wants
   * them stacked; `sensorPage.ts` (#226) places the two on different
   * pages instead, and the onboarding wizard on different steps. Moving
   * either half into another parent re-parents it away from `element`,
   * which is fine: nothing here reads `element`'s children after
   * construction. */
  element: HTMLElement;
  /** Connect half alone: intro, Connect/Reconnect, sensor row — see the
   * module doc comment's "Where each half is shown". */
  connectElement: HTMLElement;
  /** Mounting + installation-offset half alone — see `connectElement`. */
  installElement: HTMLElement;
  refresh(): void;
}

export function createSensorSourceSection(
  options: SensorSourceOptions,
  onOpenStatus?: () => void,
): SensorSourceSection {
  const body = document.createElement('div');
  // Wraps intro/connect/health — the "get connected" half (design review).
  // A plain div changes nothing visually; see the return statement below.
  const connectSection = document.createElement('div');

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('sensorSource.intro');
  connectSection.append(intro);

  const connectButton = document.createElement('button');
  connectButton.type = 'button';
  connectButton.className = 'menu__action';
  connectSection.append(connectButton);

  // The listed sensor + its disconnect action, side by side (screen-cleanup
  // follow-up): "Disconnect" now reads as belonging to the connected
  // sensor named beside it, instead of being a second stray full-width
  // button underneath "Connect" — and hidden entirely whenever there is no
  // sensor connected to disconnect (unchanged rule, just relocated).
  const sensorRow = document.createElement('div');
  sensorRow.className = 'sensor-row';
  // A button, not a plain <p> (screen-cleanup follow-up): opens the deeper
  // status page when one is wired. The status text itself lives in a
  // nested span, not directly as the button's textContent, so `refresh()`
  // below can update it without wiping the chevron appended once here.
  const status = document.createElement('button');
  status.type = 'button';
  status.className = 'menu__text menu__text--status sensor-row__status-button';
  const statusText = document.createElement('span');
  status.append(statusText);
  if (onOpenStatus) {
    const chevron = document.createElement('span');
    chevron.className = 'sensor-row__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    status.append(chevron);
    status.addEventListener('click', onOpenStatus);
  }
  const disconnectButton = document.createElement('button');
  disconnectButton.type = 'button';
  disconnectButton.className = 'menu__action menu__action--secondary menu__action--inline';
  disconnectButton.textContent = t('sensorSource.disconnect');
  sensorRow.append(status, disconnectButton);
  connectSection.append(sensorRow);

  // Mounting orientation (#217): the box can be physically mounted two
  // ways, 90° apart — mirrors the official app's own `"sensor_Placing"`,
  // exposed without that terminology (see `mountingIcon`'s doc comment).
  // Same "shown once EasyLevel is (or was) the active source" visibility
  // rule as the install-offset block below, folded into the same
  // `installElement` half so onboarding's existing two-step split needs
  // no changes.
  const mountingSection = document.createElement('div');
  const mountingHeading = document.createElement('h3');
  mountingHeading.className = 'menu__heading';
  mountingHeading.textContent = t('sensorSource.mounting.h');
  const mountingIntro = document.createElement('p');
  mountingIntro.className = 'menu__text';
  mountingIntro.textContent = t('sensorSource.mounting.intro');
  const mountingChoice = document.createElement('div');
  mountingChoice.className = 'mounting-choice';
  const mountingSelect = document.createElement('select');
  // Reuses the settings panel's own select styling (`settingsPanel.ts`'s
  // `drainSelect`) rather than inventing a menu-specific variant — this
  // page has no select of its own to style otherwise.
  mountingSelect.className = 'settings__select';
  for (const value of EASYLEVEL_MOUNTINGS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(`sensorSource.mounting.${value}`);
    mountingSelect.append(option);
  }
  let mountingIconEl = mountingIcon(options.getEasyLevelMounting());
  mountingChoice.append(mountingSelect, mountingIconEl);
  mountingSection.append(mountingHeading, mountingIntro, mountingChoice);

  function refreshMountingIcon(): void {
    const mounting = options.getEasyLevelMounting();
    mountingSelect.value = mounting;
    const next = mountingIcon(mounting);
    mountingIconEl.replaceWith(next);
    mountingIconEl = next;
  }

  mountingSelect.addEventListener('change', () => {
    // Validated against the canonical list rather than compared to one
    // literal (#222): with four options a missed branch would silently
    // store 'standard' and quietly undo the user's choice.
    const value = EASYLEVEL_MOUNTINGS.find((candidate) => candidate === mountingSelect.value);
    options.setEasyLevelMounting(value ?? 'standard');
    refreshMountingIcon();
  });

  // Installation calibration (#131, ADR 0014): the same "vehicle zero"
  // concept R24 already gives the phone (ADR 0010), generalized to this
  // permanently-mounted external sensor — its own independent stored
  // offset (`getInstallCalibration`/`calibrateInstall`/...), never the
  // phone's. Visible whenever EasyLevel is (or was) the active source,
  // connected or not —
  // capturing while disconnected simply surfaces the ordinary "not
  // running" error `readTilt`-based captures already give elsewhere.
  const installSection = document.createElement('div');
  installSection.hidden = true;
  installSection.append(mountingSection);
  const installHeading = document.createElement('h3');
  installHeading.className = 'menu__heading';
  installHeading.textContent = t('sensorSource.install.h');
  const installIntro = document.createElement('p');
  installIntro.className = 'menu__text';
  installIntro.textContent = t('sensorSource.install.intro');
  const installStatus = document.createElement('p');
  installStatus.className = 'menu__text menu__text--status';
  const installButton = document.createElement('button');
  installButton.type = 'button';
  installButton.className = 'menu__action';
  installButton.textContent = t('sensorSource.install.now');
  const installCheckButton = document.createElement('button');
  installCheckButton.type = 'button';
  installCheckButton.className = 'menu__action menu__action--secondary';
  installCheckButton.textContent = t('calibration.check');
  const installClearButton = document.createElement('button');
  installClearButton.type = 'button';
  installClearButton.className = 'menu__action menu__action--secondary';
  installClearButton.textContent = t('sensorSource.install.clear');
  installSection.append(
    installHeading,
    installIntro,
    installButton,
    installStatus,
    installCheckButton,
    installClearButton,
  );
  body.append(connectSection, installSection);

  /** Same status/age/disabled-buttons pattern as the phone's vehicle zero
   * (R26) — reused wording via `sensorSource.install.*` and the shared
   * `ageText` helper rather than a one-off implementation. */
  function refreshInstall(error?: string): void {
    const offset = options.getInstallCalibration();
    if (error) {
      installStatus.textContent = error;
    } else if (offset) {
      installStatus.textContent =
        t('sensorSource.install.status', {
          roll: offset.rollDeg.toFixed(1),
          pitch: offset.pitchDeg.toFixed(1),
        }) + ageText(options.getInstallCalibrationCapturedAt());
    } else {
      installStatus.textContent = t('sensorSource.install.status.none');
    }
    installClearButton.disabled = !offset;
    installCheckButton.disabled = !offset;
  }

  installButton.addEventListener('click', () => {
    refreshInstall(options.calibrateInstall() ?? undefined);
  });
  installCheckButton.addEventListener('click', () => {
    refreshInstall(options.checkInstallCalibration());
  });
  installClearButton.addEventListener('click', () => {
    options.clearInstallCalibration();
    refreshInstall();
  });

  /** Button labels/visibility only — never touches `status`, so an
   * in-flight connect's status text survives a `refresh()` call. */
  function refreshButtons(): void {
    const connected = options.getSensorSource() === 'easylevel';
    connectButton.textContent = connected ? t('sensorSource.reconnect') : t('sensorSource.connect');
    disconnectButton.hidden = !connected;
  }

  function refresh(): void {
    refreshButtons();
    const active = options.getSensorSource() === 'easylevel';
    statusText.textContent = !active
      ? t('sensorSource.status.phone')
      : options.getSensorState() === 'disconnected'
        ? t('sensorSource.status.disconnected')
        : t('sensorSource.status.connected');
    installSection.hidden = !active;
    if (active) {
      refreshMountingIcon();
      refreshInstall();
    }
  }

  connectButton.addEventListener('click', () => {
    statusText.textContent = t('sensorSource.status.connecting');
    void options.connectEasyLevel().then((state) => {
      statusText.textContent =
        state === 'granted'
          ? t('sensorSource.status.connected')
          : state === 'unsupported'
            ? t('sensorSource.err.unsupported')
            : t('sensorSource.err.failed');
      refreshButtons();
    });
  });

  disconnectButton.addEventListener('click', () => {
    options.disconnectEasyLevel();
    refresh();
  });

  refresh();
  return { element: body, connectElement: connectSection, installElement: installSection, refresh };
}

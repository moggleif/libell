/**
 * Sensor source section (#116, ADR 0014): the "Connect EasyLevel sensor"
 * controls and the sensor row that opens the box's own page — the only
 * working `sensorSource` choice beyond the phone's built-in sensor. Only
 * ever built when EasyLevel is available at all (`main.ts` checks
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
import type { Calibration, EasyLevelMounting, SensorSource, VehicleType } from '../domain/settings';
import {
  axisMappingForFacing,
  easyLevelMountingForFacing,
  facingForAxisMapping,
  facingForEasyLevelMounting,
  type Facing,
} from '../domain/mountingFacing';
import { isMountedRight } from '../domain/uprightMount';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import { ageText } from './calibrationAge';
import { t } from './i18n';
import { createMountingPicker, type BoxShape } from './mountingPicker';
import { createLearnMountingSection, type LearnMountingOptions } from './learnMountingSection';

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
  connectSensor(): Promise<SensorState>;
  /** Explicit disconnect — falls back to the phone sensor. */
  disconnectSensor(): void;
  /**
   * A short, actionable line about why this source is not working, or null
   * (#272) — a wrong box password, say. Shown under the status text, so a
   * user is told what to fix rather than left with a generic failure.
   * Optional: most sources have nothing to add.
   */
  getSensorNote?(): string | null;
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
   * be written to answers asynchronously.
   */
  calibrateInstall(): string | null | Promise<string | null>;
  /** When the installation offset was captured (R26) — null when unknown. */
  getInstallCalibrationCapturedAt(): number | null;
  /** Compare the current reading against the installation offset's promise of zero — returns a verdict text (R26). */
  checkInstallCalibration(): string;
  clearInstallCalibration(): void;
  /** Which physical mounting orientation this box is installed in (#217,
   * R43) — only rendered when the descriptor declares `mounting`. */
  getMounting(): EasyLevelMounting;
  /** Takes effect on the very next reading, no reconnect needed. */
  setMounting(mounting: EasyLevelMounting): void;
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
  const body = document.createElement('div');
  // Wraps connect/row/note — the "get connected" half (design review).
  // A plain div changes nothing visually; see the return statement below.
  // One card per box (#324, flow D of the #309 UX review, as drawn in its
  // mockup): a mark (✓ in use, ! lost, + not in use), the box's name, and
  // one line under it — its state, or a quiet Connect link. The card of the
  // box in use opens that box's own page, where Reconnect, its setup and
  // Disconnect live; the list never offers them itself.
  const connectSection = document.createElement('div');
  connectSection.className = 'sensor-card';
  const mark = document.createElement('span');
  mark.className = 'sensor-card__mark';
  mark.setAttribute('aria-hidden', 'true');
  const cardText = document.createElement('div');
  cardText.className = 'sensor-card__text';
  // A button, not a plain heading, so the box's page stays reachable by
  // keyboard; inert (aria-disabled, no chevron) while the box is not in
  // use, since the page behind it is that box's own (#244).
  const status = document.createElement('button');
  status.type = 'button';
  status.className = 'sensor-card__name sensor-row__status-button';
  const statusText = document.createElement('span');
  statusText.textContent = options.sensor.displayName;
  status.append(statusText);
  const chevron = document.createElement('span');
  if (onOpenStatus) {
    chevron.className = 'sensor-row__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    status.append(chevron);
    status.addEventListener('click', () => {
      if (options.getSensorSource() === options.sensor.id) onOpenStatus();
    });
  }
  const stateLine = document.createElement('p');
  stateLine.className = 'sensor-card__state';
  const connectButton = document.createElement('button');
  connectButton.type = 'button';
  connectButton.className = 'link-button sensor-card__connect';
  connectButton.textContent = t('box.connect');
  connectButton.setAttribute(
    'aria-label',
    t('sensorSource.connect', { name: options.sensor.displayName }),
  );
  // An actionable line when a source has something specific to say about
  // why it is not working (#272) — hidden the rest of the time, which is
  // nearly always.
  const noteRow = document.createElement('p');
  noteRow.className = 'menu__text menu__text--warning';
  noteRow.hidden = true;
  cardText.append(status, stateLine, connectButton, noteRow);
  connectSection.append(mark, cardText);

  // The box's setup (#314, the #309 UX review): one checklist of three
  // steps instead of three stacked sections of paragraphs and buttons —
  //   1. position, live (stands upright / lies flat, R49/#304's 45° rule);
  //   2. direction, by tapping a side of the vehicle (`mountingPicker.ts`),
  //      with the lift guide (#293) one quiet link away;
  //   3. zero on level ground (R34, #290).
  // Direction comes before the zero: it is learned from differences and
  // works anywhere, while the zero needs level ground — and the ramp
  // guidance used to reach level ground needs the direction first.
  // Only the next undone step is expanded, but every one can be opened and
  // run at any time: guidance, never a gate.
  const capabilities = options.sensor.capabilities;
  const shape: BoxShape = capabilities.upright ? 'upright' : 'flat';
  const installSection = document.createElement('div');
  installSection.className = 'box-setup';
  installSection.hidden = true;

  interface StepParts {
    element: HTMLElement;
    mark: HTMLElement;
    title: HTMLElement;
    body: HTMLElement;
  }
  function makeStep(number: number, expandable: boolean): StepParts {
    const element = document.createElement('div');
    element.className = 'box-step';
    const header = document.createElement(expandable ? 'button' : 'div');
    header.className = 'box-step__header';
    if (header instanceof HTMLButtonElement) header.type = 'button';
    const mark = document.createElement('span');
    mark.className = 'box-step__mark';
    mark.textContent = String(number);
    const title = document.createElement('span');
    title.className = 'box-step__title';
    header.append(mark, title);
    const body = document.createElement('div');
    body.className = 'box-step__body';
    body.hidden = true;
    element.append(header, body);
    return { element, mark, title, body };
  }
  function setDone(step: StepParts, done: boolean, number: number): void {
    step.element.classList.toggle('is-done', done);
    step.mark.textContent = done ? '✓' : String(number);
  }

  // Position — not a step but a status, live (#332): nothing to tap, so
  // it is drawn as a line ("✓ Stands upright"), never as a card that looks
  // like the steps below it. The device page puts it at the start of its
  // live tilt line; the first-run wizard shows it on its own.
  const positionElement = document.createElement('span');
  positionElement.className = 'box-position';
  const positionMark = document.createElement('span');
  positionMark.className = 'box-position__mark';
  positionMark.setAttribute('aria-hidden', 'true');
  const positionTitle = document.createElement('span');
  positionElement.append(positionMark, positionTitle);

  // 1. Direction.
  const usesEasyLevelMounting = capabilities.mounting;
  const usesAxisMapping = !usesEasyLevelMounting && Boolean(options.learnMounting);
  const directionStep = usesEasyLevelMounting || usesAxisMapping ? makeStep(1, true) : null;
  /** The facing in which the box's own output needs no mapping. An
   * assumption for the Xparkle box until checked on hardware (#314); the
   * lift guide below measures instead, for anyone whose box disagrees. */
  const AXIS_REFERENCE_FACING: Facing = 'front';
  function currentFacing(): Facing | null {
    if (usesEasyLevelMounting) return facingForEasyLevelMounting(options.getMounting());
    return facingForAxisMapping(
      options.learnMounting?.getLearnedMounting() ?? null,
      AXIS_REFERENCE_FACING,
    );
  }
  const picker = directionStep
    ? createMountingPicker({
        shape,
        getVehicleType: () => options.getVehicleType?.() ?? 'motorhome',
        getFacing: currentFacing,
        setFacing: (facing) => {
          if (usesEasyLevelMounting) options.setMounting(easyLevelMountingForFacing(facing));
          else
            options.learnMounting?.setLearnedMounting(
              axisMappingForFacing(facing, AXIS_REFERENCE_FACING),
            );
          refreshSteps();
        },
      })
    : null;
  const learnSection =
    capabilities.learnMounting && options.learnMounting
      ? createLearnMountingSection({
          name: options.sensor.displayName,
          ...options.learnMounting,
          setLearnedMounting: (mapping) => {
            options.learnMounting?.setLearnedMounting(mapping);
            refreshSteps();
          },
        })
      : null;
  if (directionStep && picker) {
    directionStep.body.append(picker.element);
    if (learnSection) {
      const learnLink = document.createElement('button');
      learnLink.type = 'button';
      learnLink.className = 'link-button';
      learnLink.textContent = t('box.step.direction.learn');
      learnSection.element.hidden = true;
      learnLink.addEventListener('click', () => {
        learnSection.element.hidden = !learnSection.element.hidden;
        learnSection.refresh();
      });
      directionStep.body.append(learnLink, learnSection.element);
    }
  }
  // Undoing a learned direction, where it applies (#332: was under "More").
  const forgetDirectionButton = document.createElement('button');
  forgetDirectionButton.type = 'button';
  forgetDirectionButton.className = 'link-button';
  forgetDirectionButton.textContent = t('box.forgetDirection');
  if (directionStep && usesAxisMapping) directionStep.body.append(forgetDirectionButton);

  // 2. Zero.
  const zeroStep = capabilities.installCalibration ? makeStep(2, true) : null;
  const zeroHint = document.createElement('p');
  zeroHint.className = 'menu__text';
  zeroHint.textContent = t('box.step.zero.hint');
  const installButton = document.createElement('button');
  installButton.type = 'button';
  installButton.className = 'menu__action';
  installButton.textContent = t('sensorSource.install.now');
  const installStatus = document.createElement('p');
  installStatus.className = 'menu__text menu__text--status';
  installStatus.hidden = true;
  // Once zeroed (#332): check it, or clear it, right here — quiet links,
  // not the first-time instruction again.
  const zeroLinks = document.createElement('div');
  zeroLinks.className = 'box-step__links';
  const installCheckButton = document.createElement('button');
  installCheckButton.type = 'button';
  installCheckButton.className = 'link-button';
  installCheckButton.textContent = t('calibration.check');
  const installClearButton = document.createElement('button');
  installClearButton.type = 'button';
  installClearButton.className = 'link-button';
  installClearButton.textContent = t('sensorSource.install.clear');
  zeroLinks.append(installCheckButton, installClearButton);
  zeroStep?.body.append(zeroHint, installButton, zeroLinks, installStatus);

  if (directionStep) installSection.append(directionStep.element);
  if (zeroStep) installSection.append(zeroStep.element);

  // Disconnect, at the foot of the device page (#332), in the warning
  // colour: it stops the box feeding readings.
  const moreSection = document.createElement('div');
  moreSection.className = 'box-footer__actions';
  const moreDisconnectButton = document.createElement('button');
  moreDisconnectButton.type = 'button';
  moreDisconnectButton.className = 'menu__action menu__action--secondary box-disconnect';
  moreDisconnectButton.textContent = t('sensorSource.disconnect');
  moreSection.append(moreDisconnectButton);

  /** Which step the user opened by hand; null follows "next undone". */
  let openedByHand: HTMLElement | null = null;
  const expandable = [directionStep, zeroStep].filter((step): step is StepParts => step !== null);
  for (const step of expandable) {
    step.element.querySelector('.box-step__header')?.addEventListener('click', () => {
      openedByHand = step.body.hidden ? step.element : null;
      if (!step.body.hidden) {
        // Closing by hand: keep it closed until something changes.
        step.body.hidden = true;
        openedByHand = installSection;
        return;
      }
      refreshSteps();
    });
  }

  let zeroMessage: string | null = null;

  function refreshPosition(): void {
    const tilt = options.getCalibratedTilt?.() ?? null;
    if (!tilt) {
      positionTitle.textContent = t('box.step.position.waiting');
      positionMark.textContent = '';
      positionElement.classList.remove('is-done', 'is-warning');
      return;
    }
    const ok = isMountedRight(tilt);
    positionTitle.textContent = t(`box.step.position.${shape}.${ok ? 'ok' : 'bad'}`);
    positionMark.textContent = ok ? '✓ ' : '! ';
    positionElement.classList.toggle('is-done', ok);
    positionElement.classList.toggle('is-warning', !ok);
  }

  function refreshSteps(): void {
    refreshPosition();
    const directionDone = currentFacing() !== null;
    if (directionStep) {
      const facing = currentFacing();
      // Says which way, so the closed step still shows what was picked.
      directionStep.title.textContent = facing
        ? `${t('box.step.direction.done')}: ${t(`mounting.facing.${facing}`).toLowerCase()}`
        : t('box.step.direction.todo');
      setDone(directionStep, directionDone, 1);
      picker?.refresh();
      learnSection?.refresh();
    }
    const offset = options.getInstallCalibration();
    if (zeroStep) {
      zeroStep.title.textContent = offset
        ? t('box.step.zero.done') + ageText(options.getInstallCalibrationCapturedAt())
        : t('box.step.zero.todo');
      setDone(zeroStep, offset !== null, 2);
      // Done: the links instead of the first-time instruction (#332).
      zeroHint.hidden = offset !== null;
      zeroLinks.hidden = offset === null;
      installButton.textContent = t(offset ? 'box.step.zero.again' : 'sensorSource.install.now');
      installStatus.hidden = zeroMessage === null;
      installStatus.textContent = zeroMessage ?? '';
    }
    installClearButton.disabled = !offset;
    installCheckButton.disabled = !offset;
    forgetDirectionButton.hidden = options.learnMounting?.getLearnedMounting() == null;
    // Expand the step opened by hand, else the next one not yet done.
    const next =
      openedByHand === null
        ? (expandable.find(
            (step) => (step === directionStep && !directionDone) || (step === zeroStep && !offset),
          ) ?? null)
        : (expandable.find((step) => step.element === openedByHand) ?? null);
    for (const step of expandable) {
      step.body.hidden = step !== next;
      step.element.classList.toggle('is-open', step === next);
    }
  }

  installButton.addEventListener('click', () => {
    openedByHand = zeroStep?.element ?? null;
    const result = options.calibrateInstall();
    if (!(result instanceof Promise)) {
      zeroMessage = result;
      refreshSteps();
      return;
    }
    // A box that zeroes itself (#290) answers later; no second tap while
    // the first is still on its way.
    installButton.disabled = true;
    zeroMessage = t('calibration.external.working');
    refreshSteps();
    void result.then((error) => {
      installButton.disabled = false;
      zeroMessage = error;
      refreshSteps();
    });
  });
  installCheckButton.addEventListener('click', () => {
    openedByHand = zeroStep?.element ?? null;
    zeroMessage = options.checkInstallCalibration();
    refreshSteps();
  });
  installClearButton.addEventListener('click', () => {
    options.clearInstallCalibration();
    zeroMessage = null;
    openedByHand = null;
    refreshSteps();
  });
  forgetDirectionButton.addEventListener('click', () => {
    options.learnMounting?.setLearnedMounting(null);
    openedByHand = null;
    refreshSteps();
  });
  moreDisconnectButton.addEventListener('click', () => {
    options.disconnectSensor();
    refresh();
    onSourceChanged?.();
  });
  body.append(connectSection, installSection, moreSection);

  /** The line under the name: empty while not in use (Connect shows
   * instead), else Connected or No contact. */
  function refreshCard(): void {
    const active = options.getSensorSource() === options.sensor.id;
    const lost = active && options.getSensorState() === 'disconnected';
    mark.textContent = !active ? '+' : lost ? '!' : '✓';
    connectSection.classList.toggle('is-active', active && !lost);
    connectSection.classList.toggle('is-lost', lost);
    connectButton.hidden = active;
    stateLine.hidden = !active;
    stateLine.textContent = active ? t(lost ? 'box.state.lost' : 'box.state.connected') : '';
    if (onOpenStatus) {
      chevron.hidden = !active;
      status.classList.toggle('sensor-row__status-button--plain', !active);
      if (active) status.removeAttribute('aria-disabled');
      else status.setAttribute('aria-disabled', 'true');
    }
  }

  function refresh(): void {
    refreshCard();
    // This section's own source, not "any external source" (#272): with
    // more than one listed, each card answers for itself.
    const active = options.getSensorSource() === options.sensor.id;
    const note = options.getSensorNote?.() ?? null;
    noteRow.hidden = note === null;
    if (note !== null) noteRow.textContent = note;
    installSection.hidden = !active;
    moreSection.hidden = !active;
    if (active) refreshSteps();
  }

  connectButton.addEventListener('click', () => {
    connectButton.hidden = true;
    stateLine.hidden = false;
    stateLine.textContent = t('sensorSource.status.connecting');
    void options.connectSensor().then((state) => {
      refreshCard();
      if (state !== 'granted') {
        // Said under the name, with Connect still there to try again.
        stateLine.hidden = false;
        stateLine.textContent =
          state === 'unsupported'
            ? t('sensorSource.err.unsupported')
            : t('sensorSource.err.failed', { name: options.sensor.displayName });
      }
      onSourceChanged?.();
    });
  });

  refresh();
  return {
    element: body,
    connectElement: connectSection,
    installElement: installSection,
    moreElement: moreSection,
    refresh,
    refreshLive: () => {
      if (options.getSensorSource() === options.sensor.id) refreshPosition();
    },
    positionElement,
  };
}

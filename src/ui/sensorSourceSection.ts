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
import {
  axisMappingForFacing,
  easyLevelMountingForPlacement,
  easyLevelPlacementOf,
  facingForAxisMapping,
  type EasyLevelPlacement,
  type Facing,
} from '../domain/mountingFacing';
import { isMountedRight } from '../domain/uprightMount';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import type { SensorState } from '../sensor/orientation';
import { ageText } from './calibrationAge';
import { t } from './i18n';
import { createMountingPicker, createPlacementPicker, type BoxShape } from './mountingPicker';
import { createLearnMountingSection, type LearnMountingOptions } from './learnMountingSection';
import { createBoxPasswordBlock, type BoxPasswordOptions } from './boxPasswordBlock';

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
  // A rejected password (#272, #367), with the way out right on the card —
  // hidden the rest of the time, which is nearly always.
  const passwordBlock = options.password
    ? createBoxPasswordBlock(options.password, options.sensor.displayName)
    : null;
  cardText.append(status, stateLine, connectButton);
  if (passwordBlock) cardText.append(passwordBlock.element);
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
    return facingForAxisMapping(
      options.learnMounting?.getLearnedMounting() ?? null,
      AXIS_REFERENCE_FACING,
    );
  }
  /** The EasyLevel box's picked placement (#359), or null until picked. */
  function currentPlacement(): EasyLevelPlacement | null {
    return easyLevelPlacementOf({
      mounting: options.getMounting(),
      mountingPicked: options.isMountingPicked(),
    });
  }
  /** What the closed step names as picked, or null while it still asks. */
  function directionLabel(): string | null {
    if (usesEasyLevelMounting) {
      const placement = currentPlacement();
      return placement ? t(`mounting.placement.${placement}`) : null;
    }
    const facing = currentFacing();
    return facing ? t(`mounting.facing.${facing}`) : null;
  }
  /** Stays open on the pick, so the choice is seen; closed by hand (#347). */
  function afterPick(): void {
    if (directionStep) openedByHand = directionStep.element;
    refreshSteps();
  }
  // The EasyLevel box: its manual's two placements (#359). Any other box
  // with a direction: a tap on the side its reference side points to.
  const picker = !directionStep
    ? null
    : usesEasyLevelMounting
      ? createPlacementPicker({
          getVehicleType: () => options.getVehicleType?.() ?? 'motorhome',
          getPlacement: currentPlacement,
          setPlacement: (placement) => {
            options.setMounting(easyLevelMountingForPlacement(placement));
            afterPick();
          },
        })
      : createMountingPicker({
          shape,
          getVehicleType: () => options.getVehicleType?.() ?? 'motorhome',
          getFacing: currentFacing,
          setFacing: (facing) => {
            options.learnMounting?.setLearnedMounting(
              axisMappingForFacing(facing, AXIS_REFERENCE_FACING),
            );
            afterPick();
          },
        });
  const learnSection =
    capabilities.learnMounting && options.learnMounting
      ? createLearnMountingSection({
          name: options.sensor.displayName,
          ...options.learnMounting,
          setLearnedMounting: (mapping) => {
            options.learnMounting?.setLearnedMounting(mapping);
            if (directionStep) openedByHand = directionStep.element;
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
  // Undoing a picked or learned direction (#332: was under "More"; #359
  // for the EasyLevel box too).
  const forgetDirectionButton = document.createElement('button');
  forgetDirectionButton.type = 'button';
  forgetDirectionButton.className = 'link-button';
  forgetDirectionButton.textContent = t('box.forgetDirection');
  if (directionStep) directionStep.body.append(forgetDirectionButton);

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
  // "Zero anyway" (#425, "Varning är rätt. Aldrig stopp."): shown only
  // while the last zero came back with a tilt warning.
  const installAnywayButton = document.createElement('button');
  installAnywayButton.type = 'button';
  installAnywayButton.className = 'menu__action menu__action--secondary';
  installAnywayButton.textContent = t('calibration.vehicle.anyway');
  installAnywayButton.hidden = true;
  // Once zeroed (#332): check it, or clear it, right here — quiet links,
  // not the first-time instruction again.
  const zeroLinks = document.createElement('div');
  zeroLinks.className = 'box-step__links';
  const installClearButton = document.createElement('button');
  installClearButton.type = 'button';
  installClearButton.className = 'link-button';
  installClearButton.textContent = t('sensorSource.install.clear');
  zeroLinks.append(installClearButton);
  zeroStep?.body.append(zeroHint, installButton, zeroLinks, installStatus, installAnywayButton);

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
  /** Whether `zeroMessage` is a tilt warning, which offers "Zero anyway". */
  let zeroWarned = false;

  function refreshPosition(): void {
    // Only this box's own reading says how it stands: while it is not the
    // source in use, or has lost contact, the reading is the phone's or
    // stale, so nothing is said (#343).
    positionElement.hidden = !delivering();
    if (!delivering()) return;
    const tilt = options.getCalibratedTilt?.() ?? null;
    if (!tilt) {
      positionTitle.textContent = t('box.step.position.waiting');
      positionMark.textContent = '';
      positionElement.classList.remove('is-done', 'is-warning');
      return;
    }
    const ok = isMountedRight(tilt);
    // A flat box past a right angle has its lid down (#362). Libell does
    // not support that mounting; it says so, and how to fix it.
    const upsideDown =
      shape === 'flat' && (Math.abs(tilt.pitchDeg) > 90 || Math.abs(tilt.rollDeg) > 90);
    positionTitle.textContent = upsideDown
      ? t('box.step.position.flat.upsideDown')
      : t(`box.step.position.${shape}.${ok ? 'ok' : 'bad'}`);
    positionMark.textContent = ok ? '✓ ' : '! ';
    positionElement.classList.toggle('is-done', ok);
    positionElement.classList.toggle('is-warning', !ok);
  }

  /** Whether this box is the source in use and in contact — what every
   * setup action needs (#343). */
  function delivering(): boolean {
    return (
      options.getSensorSource() === options.sensor.id && options.getSensorState() !== 'disconnected'
    );
  }

  function refreshSteps(): void {
    // Undo the offline greying first; the rules below and the pass at the
    // end decide afresh.
    for (const button of installSection.querySelectorAll<HTMLButtonElement>(
      'button[data-offline]',
    )) {
      button.disabled = false;
      delete button.dataset.offline;
    }
    refreshPosition();
    const picked = directionLabel();
    const directionDone = picked !== null;
    if (directionStep) {
      // Says which way, so the closed step still shows what was picked.
      directionStep.title.textContent = picked
        ? `${t('box.step.direction.done')}: ${picked.toLowerCase()}`
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
      // A box that zeroes itself keeps that zero, so there is no Libell
      // zero to forget (#343).
      zeroLinks.hidden = offset === null || capabilities.zeroesItself;
      installButton.textContent = t(offset ? 'box.step.zero.again' : 'sensorSource.install.now');
      installStatus.hidden = zeroMessage === null;
      installStatus.textContent = zeroMessage ?? '';
      installStatus.classList.toggle('menu__text--warning', zeroWarned);
      installAnywayButton.hidden = !zeroWarned;
    }
    installClearButton.disabled = !offset;
    forgetDirectionButton.hidden = usesEasyLevelMounting
      ? !options.isMountingPicked()
      : options.learnMounting?.getLearnedMounting() == null;
    // Without the box nothing can be set: every action greyed out until it
    // is back, while the steps still open to show what is set (#343).
    if (!delivering()) {
      for (const button of installSection.querySelectorAll<HTMLButtonElement>(
        'button:not(.box-step__header):not(:disabled)',
      )) {
        button.disabled = true;
        button.dataset.offline = '';
      }
    }
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

  function showZeroResult(result: CaptureResult): void {
    zeroWarned = typeof result === 'object' && result !== null;
    zeroMessage = typeof result === 'object' && result ? result.warning : result;
    refreshSteps();
  }
  function zeroBox(anyway: boolean): void {
    openedByHand = zeroStep?.element ?? null;
    const result = options.calibrateInstall(anyway);
    if (!(result instanceof Promise)) {
      showZeroResult(result);
      return;
    }
    // A box that zeroes itself (#290) answers later; no second tap while
    // the first is still on its way.
    installButton.disabled = true;
    zeroWarned = false;
    zeroMessage = t('calibration.external.working');
    refreshSteps();
    void result.then((answer) => {
      installButton.disabled = false;
      showZeroResult(answer);
    });
  }
  installButton.addEventListener('click', () => zeroBox(false));
  installAnywayButton.addEventListener('click', () => zeroBox(true));
  installClearButton.addEventListener('click', () => {
    options.clearInstallCalibration();
    zeroWarned = false;
    zeroMessage = null;
    openedByHand = null;
    refreshSteps();
  });
  forgetDirectionButton.addEventListener('click', () => {
    if (usesEasyLevelMounting) options.setMounting(null);
    else options.learnMounting?.setLearnedMounting(null);
    openedByHand = null;
    refreshSteps();
  });
  moreDisconnectButton.addEventListener('click', () => {
    options.disconnectSensor();
    refresh();
    onSourceChanged?.();
  });
  body.append(connectSection, installSection, moreSection);

  function passwordRejected(): boolean {
    return options.password?.isRejected() ?? false;
  }

  /** The line under the name: empty while not in use (Connect shows
   * instead), else Connected, No contact, or — never "Connected" while the
   * box says no to its password (#367) — Wrong password. */
  function refreshCard(): void {
    const active = options.getSensorSource() === options.sensor.id;
    const lost = active && options.getSensorState() === 'disconnected';
    const rejected = active && !lost && passwordRejected();
    mark.textContent = !active ? '+' : lost || rejected ? '!' : '✓';
    connectSection.classList.toggle('is-active', active && !lost && !rejected);
    connectSection.classList.toggle('is-lost', lost || rejected);
    connectButton.hidden = active;
    stateLine.hidden = !active;
    stateLine.textContent = active
      ? t(lost ? 'box.state.lost' : rejected ? 'box.state.password' : 'box.state.connected')
      : '';
    passwordBlock?.refresh();
    if (onOpenStatus) {
      chevron.hidden = !active;
      status.classList.toggle('sensor-row__status-button--plain', !active);
      if (active) status.removeAttribute('aria-disabled');
      else status.setAttribute('aria-disabled', 'true');
    }
  }

  // What the page was last drawn for, so a connect or a drop from anywhere
  // (the page's own header button included) redraws it at once (#343).
  // The password verdict arrives on its own, after the connect (#367), so
  // it is part of what the card was drawn for.
  let drawnFor = '';
  const drawKey = () =>
    `${options.getSensorSource()}|${options.getSensorState()}|${passwordRejected()}`;

  function refresh(): void {
    drawnFor = drawKey();
    refreshCard();
    // This section's own source, not "any external source" (#272): with
    // more than one listed, each card answers for itself.
    const active = options.getSensorSource() === options.sensor.id;
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
      if (drawKey() !== drawnFor) refresh();
      else refreshPosition();
    },
    positionElement,
  };
}

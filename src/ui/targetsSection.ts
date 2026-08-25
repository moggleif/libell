/**
 * Target presets UI (#122, ADR 0013): a menu section listing "Normal"
 * (true level, always first, never deletable) followed by the user's
 * saved presets — tap a row to select it, the ✕ to delete it. Adding a
 * preset captures the current tilt (the same capture-first pattern
 * `calibrationSection.ts` uses for the vehicle zero) and names it from
 * the text field.
 *
 * Deliberately NOT part of `calibrationSection.ts`: a preset is a
 * *target*, not a calibration (see the module doc comment in
 * `../domain/targetPresets.ts`) — it gets its own menu section instead
 * of a third block there, built from the same `menu__*` classes so it
 * still reads as part of the same UI family in both Classic and Modern.
 */
import type { Calibration } from '../domain/settings';
import type { TargetPreset } from '../domain/targetPresets';
import { t } from './i18n';

export interface TargetsOptions {
  getTargetPresets(): TargetPreset[];
  getActiveTargetId(): string | null;
  /** Switch the active target; `null` selects "Normal" (true level). */
  selectTarget(id: string | null): void;
  /** Capture the current tilt as a new preset named `name`. Returns an
   * error text, or null on success. */
  addTargetPreset(name: string): string | null;
  deleteTargetPreset(id: string): void;
  /**
   * The other two additive layers (#160) — read here only to surface a
   * one-line summary of all three together; this section owns none of
   * their state, and clearing/redoing either never touches this page's
   * own list above.
   */
  getCalibration(): Calibration | null;
  getVehicleCalibration(): Calibration | null;
  /** The active target preset's name, or null for "Normal" (#122) —
   * the same value the summary line's own third clause restates. */
  getActiveTargetName(): string | null;
}

export interface TargetsSection {
  element: HTMLElement;
  refresh(): void;
}

export function createTargetsSection(options: TargetsOptions): TargetsSection {
  const body = document.createElement('div');

  // Offset summary (#160): a read-only line stating which of the three
  // additive layers (sensor calibration, vehicle zero, active target)
  // currently contribute to "level" — never shown on the main screen
  // (R31's own regression guard against duplicating info there stays
  // untouched; this is menu-only, alongside the list below it).
  const summary = document.createElement('p');
  summary.className = 'menu__text menu__text--status';

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('targets.intro');

  const list = document.createElement('div');
  list.className = 'targets__list';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'targets__name-input';
  nameInput.maxLength = 40;
  nameInput.placeholder = t('targets.name.placeholder');

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'menu__action menu__action--secondary';
  addButton.textContent = t('targets.add');
  addButton.disabled = true;

  const addRow = document.createElement('div');
  addRow.className = 'targets__add';
  addRow.append(nameInput, addButton);

  const addStatus = document.createElement('p');
  addStatus.className = 'menu__text menu__text--status';

  nameInput.addEventListener('input', () => {
    addButton.disabled = nameInput.value.trim() === '';
  });

  function makeRow(
    labelText: string,
    active: boolean,
    onSelect: () => void,
    onDelete?: () => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'targets__row';

    const select = document.createElement('button');
    select.type = 'button';
    select.className = active
      ? 'targets__row-select targets__row-select--active'
      : 'targets__row-select';
    const radio = document.createElement('span');
    radio.className = 'targets__row-radio';
    radio.setAttribute('aria-hidden', 'true');
    radio.textContent = active ? '●' : '○';
    const label = document.createElement('span');
    label.className = 'targets__row-label';
    label.textContent = labelText;
    select.append(radio, label);
    select.addEventListener('click', onSelect);
    row.append(select);

    if (onDelete) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'targets__row-delete';
      del.setAttribute('aria-label', t('targets.delete', { name: labelText }));
      del.textContent = '✕';
      del.addEventListener('click', onDelete);
      row.append(del);
    }
    return row;
  }

  function refreshSummary(): void {
    summary.textContent = t('menu.offsetSummary', {
      sensor: options.getCalibration() !== null ? '✓' : '–',
      vehicleZero: options.getVehicleCalibration() !== null ? '✓' : '–',
      target: options.getActiveTargetName() ?? t('targets.normal'),
    });
  }

  function refresh(): void {
    refreshSummary();
    const presets = options.getTargetPresets();
    const activeId = options.getActiveTargetId();
    list.replaceChildren(
      makeRow(t('targets.normal'), activeId === null, () => {
        options.selectTarget(null);
        refresh();
      }),
      ...presets.map((preset) =>
        makeRow(
          preset.name,
          activeId === preset.id,
          () => {
            options.selectTarget(preset.id);
            refresh();
          },
          () => {
            options.deleteTargetPreset(preset.id);
            refresh();
          },
        ),
      ),
    );
  }

  addButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const error = options.addTargetPreset(name);
    if (error) {
      addStatus.textContent = error;
      return;
    }
    nameInput.value = '';
    addButton.disabled = true;
    addStatus.textContent = '';
    refresh();
  });

  refresh();
  body.append(summary, intro, list, addRow, addStatus);
  return { element: body, refresh };
}

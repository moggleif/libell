// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSettingsForm } from './settingsPanel';
import { setLanguage } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

function input(form: HTMLFormElement, name: string): HTMLInputElement {
  return form.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

describe('settings form', () => {
  it('tells the user where to find the measurements', () => {
    const form = createSettingsForm(DEFAULT_SETTINGS, vi.fn());
    const hint = form.querySelector('.settings__hint');
    expect(hint?.textContent).toContain('registration');
  });

  it('round-trips an edited field through save', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(DEFAULT_SETTINGS, onSave);
    input(form, 'wheelbaseMm').value = '4100';
    form.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0]).toEqual({ ...DEFAULT_SETTINGS, wheelbaseMm: 4100 });
  });

  it('falls back to defaults for an invalid field instead of saving garbage', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(DEFAULT_SETTINGS, onSave);
    input(form, 'wheelbaseMm').value = '-5';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(DEFAULT_SETTINGS.wheelbaseMm);
  });

  it('choosing "Custom set" sticks instead of snapping back to the matching model (#91)', () => {
    const form = createSettingsForm(DEFAULT_SETTINGS, vi.fn());
    // The default steps match Thule Levelers, so the picker shows it.
    const rampSelect = form.querySelectorAll('select')[2] as HTMLSelectElement;
    expect(rampSelect.value).not.toBe('');
    // Explicitly choosing the custom option must hold, even though the
    // steps still match a catalog model.
    rampSelect.value = '';
    rampSelect.dispatchEvent(new Event('change'));
    expect(rampSelect.value).toBe('');
    // Editing the steps keeps the explicit custom choice.
    const removeFirst = form.querySelector<HTMLButtonElement>('.steps__chip-remove')!;
    removeFirst.click();
    expect(rampSelect.value).toBe('');
    // Picking a model again fills its steps and shows the model.
    rampSelect.value = 'Thule Levelers';
    rampSelect.dispatchEvent(new Event('change'));
    expect(rampSelect.value).toBe('Thule Levelers');
  });

  it('round-trips the axle configuration (#81)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(DEFAULT_SETTINGS, onSave);
    const axleSelect = form.querySelectorAll('select')[1] as HTMLSelectElement;
    axleSelect.value = 'boggie';
    axleSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].rearAxle).toBe('boggie');
  });

  it('round-trips the ramp count and drain position (#93)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(DEFAULT_SETTINGS, onSave);
    // Select order: vehicle, axle, ramp model, ramp count, drain, unit, theme, appearance.
    const rampCountSelect = form.querySelectorAll('select')[3] as HTMLSelectElement;
    const drainSelect = form.querySelectorAll('select')[4] as HTMLSelectElement;
    expect(rampCountSelect.value).toBe('2'); // ramps are sold in pairs
    expect(drainSelect.value).toBe('none');
    rampCountSelect.value = '4';
    rampCountSelect.dispatchEvent(new Event('change'));
    drainSelect.value = 'left';
    drainSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].rampCount).toBe(4);
    expect(onSave.mock.calls[0]![0].drainPosition).toBe('left');
  });

  it('hides the ramp count and drain fields for a caravan', () => {
    const caravan: LevelSettings = { ...DEFAULT_SETTINGS, vehicleType: 'caravan' };
    const form = createSettingsForm(caravan, vi.fn());
    const rampCountSelect = form.querySelectorAll('select')[3] as HTMLSelectElement;
    expect((rampCountSelect.closest('label') as HTMLLabelElement).hidden).toBe(true);
  });

  it('round-trips the appearance preset, independent of theme (#104)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(DEFAULT_SETTINGS, onSave);
    const selects = form.querySelectorAll('select');
    const themeSelect = selects[6] as HTMLSelectElement;
    const appearanceSelect = selects[7] as HTMLSelectElement;
    expect(appearanceSelect.value).toBe('classic');
    appearanceSelect.value = 'modern';
    appearanceSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].appearance).toBe('modern');
    // theme (light/dark) is untouched by the appearance choice.
    expect(onSave.mock.calls[0]![0].theme).toBe(themeSelect.value);
  });

  it('keeps math in mm while displaying cm', () => {
    const cmSettings: LevelSettings = { ...DEFAULT_SETTINGS, displayUnit: 'cm' };
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(cmSettings, onSave);
    // The field shows cm (3800 mm -> 380), but the saved value is mm again.
    expect(input(form, 'wheelbaseMm').value).toBe('380');
    input(form, 'wheelbaseMm').value = '400';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4000);
    expect(onSave.mock.calls[0]![0].displayUnit).toBe('cm');
  });

  it('Classic mode has no tab elements (#108)', () => {
    const form = createSettingsForm(DEFAULT_SETTINGS, vi.fn());
    expect(form.querySelector('.settings__tabs')).toBeNull();
    expect(form.querySelectorAll('[role="tab"]').length).toBe(0);
    // The original flat structure — a section heading straight in the form.
    expect(form.querySelector('.settings__section')?.textContent).toContain('Vehicle');
  });
});

describe('settings form — Modern tabs (#108)', () => {
  const modern: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };

  function tabButton(form: HTMLFormElement, id: string): HTMLButtonElement {
    return form.querySelector<HTMLButtonElement>(`.settings__tab[data-tab="${id}"]`)!;
  }

  it('renders three tabs, Fordon active by default, and switches on click', () => {
    const form = createSettingsForm(modern, vi.fn());
    const tabs = form.querySelectorAll('.settings__tab');
    expect(tabs.length).toBe(3);
    const vehicleTab = tabButton(form, 'vehicle');
    const rampsTab = tabButton(form, 'ramps');
    const calibrationTab = tabButton(form, 'calibration');
    expect(vehicleTab.getAttribute('aria-selected')).toBe('true');
    expect(rampsTab.getAttribute('aria-selected')).toBe('false');

    const vehiclePanel = form.querySelector<HTMLElement>('.settings__tabpanel')!;
    expect(vehiclePanel.hidden).toBe(false);

    rampsTab.click();
    expect(rampsTab.getAttribute('aria-selected')).toBe('true');
    expect(vehicleTab.getAttribute('aria-selected')).toBe('false');
    const panels = form.querySelectorAll<HTMLElement>('.settings__tabpanel');
    expect(panels[0]!.hidden).toBe(true); // Fordon, now inactive
    expect(panels[1]!.hidden).toBe(false); // Klossar, now active

    calibrationTab.click();
    expect(panels[2]!.hidden).toBe(false);
    // The embedded calibration section (#109's component, not a copy) renders.
    expect(panels[2]!.querySelector('.menu__action')).not.toBeNull();
  });

  it('shows the pinned card for the default (catalog) model, with its step count', () => {
    const form = createSettingsForm(modern, vi.fn());
    const pinned = form.querySelector<HTMLElement>('.klossar__pinned')!;
    expect(pinned.hidden).toBe(false);
    expect(pinned.querySelector('.klossar__pinned-name')?.textContent).toBe('Thule Levelers');
    expect(pinned.querySelector('.klossar__pinned-sub')?.textContent).toContain('44 / 78 / 112');
    expect(pinned.querySelector('.klossar__pinned-sub')?.textContent).toContain('3 steps');
  });

  it('the brand filter narrows the visible catalog rows', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rows = [
      ...form.querySelectorAll<HTMLElement>('.klossar__row:not(.klossar__row--custom)'),
    ];
    const froliChip = [...form.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
      (c) => c.textContent === 'Froli',
    )!;
    expect(rows.every((r) => !r.hidden)).toBe(true);
    froliChip.click();
    const visible = rows.filter((r) => !r.hidden);
    expect(visible.length).toBe(2);
    for (const row of visible) {
      expect(row.querySelector('.klossar__row-name')?.textContent).toContain('Froli');
    }
    // "Alla" brings everything back.
    const allChip = [...form.querySelectorAll<HTMLButtonElement>('.klossar__chip')].find(
      (c) => c.textContent === 'All',
    )!;
    allChip.click();
    expect(rows.every((r) => !r.hidden)).toBe(true);
  });

  it('picking a model updates the fixed footer step preview immediately', () => {
    const form = createSettingsForm(modern, vi.fn());
    const rows = [
      ...form.querySelectorAll<HTMLElement>('.klossar__row:not(.klossar__row--custom)'),
    ];
    const milenco = rows.find(
      (r) => r.querySelector('.klossar__row-name')?.textContent === 'Milenco Quattro Level',
    )!;
    milenco.click();

    const footerModel = form.querySelector('.klossar__footer-model');
    expect(footerModel?.textContent).toBe('Milenco Quattro Level');
    const values = [...form.querySelectorAll('.klossar__grid-value')].map((el) => el.textContent);
    expect(values).toEqual(['40', '80', '120', '160']);

    // The pinned card follows the new selection too.
    expect(form.querySelector('.klossar__pinned-name')?.textContent).toBe('Milenco Quattro Level');
  });

  it('picking "Egen uppsättning" reveals the chip editor and hides the pinned card', () => {
    const form = createSettingsForm(modern, vi.fn());
    const customRow = form.querySelector<HTMLElement>('.klossar__row--custom')!;
    const editor = form.querySelector<HTMLElement>('.klossar__custom-editor')!;
    expect(editor.hidden).toBe(true);
    customRow.click();
    expect(editor.hidden).toBe(false);
    expect(form.querySelector<HTMLElement>('.klossar__pinned')!.hidden).toBe(true);
    expect(form.querySelector('.klossar__footer-model')?.textContent).toBe('Custom set');
  });

  it('Save/Undo in the footer round-trip like the classic form (#108)', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm(modern, onSave);
    const save = form.querySelector<HTMLButtonElement>(
      '.klossar__footer-actions button[type="submit"]',
    )!;
    const undo = form.querySelectorAll<HTMLButtonElement>('.klossar__footer-actions button')[1]!;
    expect(save.disabled).toBe(true);
    expect(undo.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '4200';
    form.dispatchEvent(new Event('input'));
    expect(save.disabled).toBe(false);
    expect(undo.disabled).toBe(false);

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0].wheelbaseMm).toBe(4200);
    expect(save.disabled).toBe(true);

    input(form, 'wheelbaseMm').value = '5000';
    form.dispatchEvent(new Event('input'));
    expect(undo.disabled).toBe(false);
    undo.click();
    expect(input(form, 'wheelbaseMm').value).toBe('4200');
    expect(save.disabled).toBe(true);
  });

  it('embeds a working calibration section in the Kalibrering tab (#109)', () => {
    const calibrate = vi.fn(() => null);
    const form = createSettingsForm(modern, vi.fn(), {
      getCalibration: () => null,
      calibrate,
      readTilt: () => 'no sensor',
      applyCalibration: () => {},
      clearCalibration: () => {},
      getVehicleCalibration: () => null,
      calibrateVehicle: () => null,
      getCalibrationCapturedAt: () => null,
      getVehicleCalibrationCapturedAt: () => null,
      checkCalibration: () => '',
      checkVehicleCalibration: () => '',
      clearVehicleCalibration: () => {},
    });
    tabButton(form, 'calibration').click();
    const calibrationPanel = form.querySelectorAll<HTMLElement>('.settings__tabpanel')[2]!;
    const calibrateButton = [
      ...calibrationPanel.querySelectorAll<HTMLButtonElement>('button'),
    ].find((b) => b.textContent === 'Calibrate now')!;
    calibrateButton.click();
    expect(calibrate).toHaveBeenCalledTimes(1);
  });
});

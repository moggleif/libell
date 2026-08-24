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
});

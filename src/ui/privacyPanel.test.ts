// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { StoredEntry } from '../data/storedData';
import { setLanguage, t } from './i18n';
import { createPrivacyPanel } from './privacyPanel';

setLanguage('en');

const settings: StoredEntry = {
  key: 'libell.settings',
  kind: 'settings',
  value: JSON.stringify({ sensorDevices: { xparkle: { password: '1234' } } }),
  session: false,
};
const language: StoredEntry = {
  key: 'libell.language',
  kind: 'language',
  value: 'sv',
  session: false,
};

function buttonNamed(panel: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...panel.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent === label && !b.closest('[hidden]') && !b.hidden,
  );
}

describe('createPrivacyPanel (#678)', () => {
  it('lists what is stored in plain words, and says so when nothing is', () => {
    const entries = [settings];
    const panel = createPrivacyPanel({ read: () => entries, deleteAll: vi.fn() });
    expect(panel.element.querySelector('.stored-data__list')?.textContent).toContain(
      t('stored.settings'),
    );
    entries.length = 0;
    panel.refresh();
    expect(panel.element.textContent).toContain(t('privacy.stored.empty'));
  });

  it('shows the raw keys and values by key, with the password masked everywhere', () => {
    const panel = createPrivacyPanel({ read: () => [settings, language], deleteAll: vi.fn() });
    const keys = [...panel.element.querySelectorAll('.stored-data__raw-key')].map(
      (k) => k.textContent,
    );
    expect(keys).toEqual(['libell.language', 'libell.settings']);
    expect(panel.element.textContent).toContain('••••');
    expect(panel.element.textContent).not.toContain('1234');
  });

  it('deletes only after "Yes", and Cancel removes nothing', () => {
    const deleteAll = vi.fn();
    const panel = createPrivacyPanel({ read: () => [settings], deleteAll });
    buttonNamed(panel.element, t('privacy.deleteAll'))!.click();
    expect(deleteAll).not.toHaveBeenCalled();
    expect(panel.element.textContent).toContain(t('privacy.deleteAll.confirm'));

    buttonNamed(panel.element, t('privacy.deleteAll.cancel'))!.click();
    expect(deleteAll).not.toHaveBeenCalled();
    expect(buttonNamed(panel.element, t('privacy.deleteAll.yes'))).toBeUndefined();

    buttonNamed(panel.element, t('privacy.deleteAll'))!.click();
    buttonNamed(panel.element, t('privacy.deleteAll.yes'))!.click();
    expect(deleteAll).toHaveBeenCalledOnce();
  });

  it('folds an open question away when it is shown again', () => {
    const panel = createPrivacyPanel({ read: () => [], deleteAll: vi.fn() });
    buttonNamed(panel.element, t('privacy.deleteAll'))!.click();
    panel.refresh();
    expect(buttonNamed(panel.element, t('privacy.deleteAll'))).toBeDefined();
    expect(buttonNamed(panel.element, t('privacy.deleteAll.yes'))).toBeUndefined();
  });

  it('offers "Reset only the settings" only where it can open them', () => {
    const without = createPrivacyPanel({ read: () => [], deleteAll: vi.fn() });
    expect(buttonNamed(without.element, t('privacy.resetSettings'))).toBeUndefined();
    const openSettings = vi.fn();
    const withIt = createPrivacyPanel({ read: () => [], deleteAll: vi.fn(), openSettings });
    buttonNamed(withIt.element, t('privacy.resetSettings'))!.click();
    expect(openSettings).toHaveBeenCalledOnce();
  });
});

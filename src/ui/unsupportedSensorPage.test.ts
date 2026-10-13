// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createUnsupportedSensorPage } from './unsupportedSensorPage';
import { LANGUAGES, setLanguage, t } from './i18n';

describe('createUnsupportedSensorPage (#507)', () => {
  it('opens as the Sensorbox page with a ✕ close', () => {
    setLanguage('en');
    const page = createUnsupportedSensorPage();
    expect(page.isOpen()).toBe(false);
    page.open();
    expect(page.isOpen()).toBe(true);
    expect(page.element.querySelector('.menu-page__title')?.textContent).toBe(
      t('menu.sensorSource'),
    );
    expect(page.element.querySelector('.menu-page__back')?.textContent).toBe('✕');
  });

  it('says the browser lacks Web Bluetooth and which browser to use, in every language', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      const text = createUnsupportedSensorPage().element.textContent;
      expect(text, lang).toContain(t('sensorSource.err.unsupported'));
      expect(text, lang).toContain(t('sensorSource.unsupported.browser'));
    }
  });

  it('offers nothing to connect: there is no Bluetooth to connect with', () => {
    setLanguage('en');
    const page = createUnsupportedSensorPage();
    expect(page.element.querySelectorAll('.menu-page__body button')).toHaveLength(0);
  });
});

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createIosSensorGuidePage } from './iosSensorGuidePage';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('createIosSensorGuidePage (R39)', () => {
  it('starts closed; attach() opens straight to the guide with a ✕ close', () => {
    const page = createIosSensorGuidePage();
    const button = document.createElement('button');
    page.attach(button);
    expect(page.isOpen()).toBe(false);

    button.click();
    expect(page.isOpen()).toBe(true);
    expect(page.element.querySelector('.menu-page__back')?.textContent).toBe('✕');

    button.click();
    expect(page.isOpen()).toBe(false);
  });

  it("open() opens it programmatically — the sensor-status icon's own trigger", () => {
    const page = createIosSensorGuidePage();
    page.open();
    expect(page.isOpen()).toBe(true);
  });

  it('explains the Bluefy workaround and never offers a Connect button — there is nothing to connect to', () => {
    const page = createIosSensorGuidePage();
    page.open();
    expect(page.element.textContent).toContain('Bluefy');
    expect(
      [...page.element.querySelectorAll('button')].some(
        (b) => b.textContent === t('sensorSource.connect'),
      ),
    ).toBe(false);
  });

  it('links out to the App Store search, opened in a new tab', () => {
    const page = createIosSensorGuidePage();
    page.open();
    const link = page.element.querySelector<HTMLAnchorElement>('a.menu__link')!;
    expect(link.href).toContain('apps.apple.com');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });
});

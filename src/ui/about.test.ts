// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createAboutSection } from './about';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('about section', () => {
  it('says what Libell is, all in translated text', () => {
    const section = createAboutSection();
    expect(section.textContent).toContain(t('about.text'));
    expect(section.textContent).toContain(t('about.privacy'));
  });

  it('shows the app version when the build provides one', () => {
    // __APP_VERSION__ is defined for tests via vite.config.ts `define`
    // (local dev resolution), so the version line must be present.
    const section = createAboutSection();
    expect(section.textContent).toContain(t('about.version', { v: __APP_VERSION__ ?? '' }));
  });

  it('links to the source repository safely (new tab, noopener)', () => {
    const link = createAboutSection().querySelector('a')!;
    expect(link.href).toBe('https://github.com/moggleif/libell');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(link.textContent).toBe(t('about.source.link'));
  });
});

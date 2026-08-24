// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createAboutSection } from './about';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('about section', () => {
  it('says what Libell is, all in translated text', () => {
    const section = createAboutSection();
    expect(section.textContent).toContain(t('about.text'));
    expect(section.textContent).toContain(t('about.offline'));
    expect(section.textContent).toContain(t('about.privacy'));
  });

  it('shows the app version last and small', () => {
    const last = createAboutSection('1.0.0 – CR93').lastElementChild!;
    expect(last.textContent).toBe(t('about.version', { v: '1.0.0 – CR93' }));
    expect(last.classList.contains('about__version')).toBe(true);
  });

  it('omits the version entirely when the build has none', () => {
    // A CI build without BUILD_VERSION: better no version than a wrong one.
    const section = createAboutSection(null);
    expect(section.querySelector('.about__version')).toBeNull();
    expect(section.textContent).not.toContain('Version');
  });

  it('links to the source repository safely (new tab, noopener)', () => {
    const link = createAboutSection().querySelector('a')!;
    expect(link.href).toBe('https://github.com/moggleif/libell');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(link.textContent).toBe(t('about.source.link'));
  });
});

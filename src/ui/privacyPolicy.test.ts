import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './i18n';
import { translate } from './translations';
import { privacyPages, renderPrivacyPage } from './privacyPolicy';
import { privacyPolicyPath } from './privacyPolicyPath';
import { escapeHtml } from './staticPage';

describe('privacy policy pages (#675)', () => {
  it('writes one page per shipped language and privacy/ in English', () => {
    const files = privacyPages('/');
    expect(files.map((f) => f.fileName)).toEqual([
      'privacy/index.html',
      ...LANGUAGES.map((lang) => `privacy/${lang}/index.html`),
    ]);
    expect(files[0]!.source).toBe(renderPrivacyPage('en', '/'));
  });

  it.each(LANGUAGES)('says the whole policy in %s, in that language', (lang) => {
    const html = renderPrivacyPage(lang, '/');
    expect(html).toContain(`<html lang="${lang}">`);
    for (const key of [
      'policy.title',
      'policy.intro',
      'policy.stored',
      'policy.sensors',
      'policy.counting',
      'policy.counting.ip',
      'policy.counting.basis',
      'policy.site',
      'policy.owner',
      'policy.questions',
    ] as const) {
      expect(html).toContain(escapeHtml(translate(lang, key)));
    }
    expect(html).not.toMatch(/\{[a-z]+\}/);
  });

  it('fills in the in-app path, the brands and the share button by their own texts', () => {
    const html = renderPrivacyPage('en', '/');
    expect(html).toContain('Under Help › Privacy in the app');
    expect(html).toContain('Xparkle RVS01');
    expect(html).toContain(`“${translate('en', 'settings.shareVehicle')}”`);
  });

  it('is inert: no script, nothing loaded from elsewhere, everything escaped', () => {
    const html = renderPrivacyPage('fr', '/');
    expect(html).not.toMatch(/<script|<style|\sstyle=|\son[a-z]+=/i);
    expect(html).toContain("default-src 'none'; style-src 'self'");
    expect(html.match(/<link [^>]*href="([^"]+)"/)?.[1]).toBe('/page.css');
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('links every other language under the base path, and back to the app', () => {
    const html = renderPrivacyPage('sv', '/libell/');
    for (const lang of LANGUAGES.filter((l) => l !== 'sv')) {
      expect(html).toContain(`href="${privacyPolicyPath('/libell/', lang)}" hreflang="${lang}"`);
    }
    expect(html).not.toContain('href="/libell/privacy/sv/"');
    expect(html).toContain(`<a href="/libell/">${translate('sv', 'policy.open')}</a>`);
  });

  it('dates the policy in the page language', () => {
    expect(renderPrivacyPage('en', '/')).toContain('Last changed 25 October 2026');
    expect(renderPrivacyPage('sv', '/')).toContain('Senast ändrad 25 oktober 2026');
  });
});

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './i18n';
import { staticPages } from './staticPages';

describe('staticPages (#703)', () => {
  it('writes the privacy pages, the language pages and their one stylesheet', () => {
    const names = staticPages('/').map((file) => file.fileName);
    expect(names).toContain('privacy/sv/index.html');
    expect(names).toContain('sv/index.html');
    expect(names.filter((name) => name.endsWith('.css'))).toEqual(['page.css']);
    expect(names).toHaveLength(2 * LANGUAGES.length + 2);
  });
});

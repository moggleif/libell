// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createTargetBadge } from './targetBadge';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('target badge (#122, ADR 0013)', () => {
  it('starts hidden and stays hidden for Normal (null)', () => {
    const badge = createTargetBadge(vi.fn());
    expect(badge.element.hidden).toBe(true);
    badge.update(null);
    expect(badge.element.hidden).toBe(true);
  });

  it('shows the active target name once a preset is selected', () => {
    const badge = createTargetBadge(vi.fn());
    badge.update('Shower drain');
    expect(badge.element.hidden).toBe(false);
    expect(badge.element.textContent).toBe(t('targets.badge', { name: 'Shower drain' }));
  });

  it('hides again once Normal is reselected (regression guard)', () => {
    const badge = createTargetBadge(vi.fn());
    badge.update('Shower drain');
    expect(badge.element.hidden).toBe(false);
    badge.update(null);
    expect(badge.element.hidden).toBe(true);
  });

  it('clicking the badge invokes the callback (opens the Targets menu section)', () => {
    const onClick = vi.fn();
    const badge = createTargetBadge(onClick);
    badge.update('Shower drain');
    badge.element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

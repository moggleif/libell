// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFeedbackSection } from './feedback';
import { setLanguage } from './i18n';

setLanguage('en');

afterEach(() => {
  vi.restoreAllMocks();
});

function fillAndSubmit(title: string, description: string): string | null {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const section = createFeedbackSection();
  const form = section.querySelector('form')!;
  const titleInput = section.querySelector<HTMLInputElement>('input[type="text"]')!;
  const descInput = section.querySelector<HTMLTextAreaElement>('textarea')!;
  titleInput.value = title;
  descInput.value = description;
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  if (open.mock.calls.length === 0) return null;
  const [url, target, features] = open.mock.calls[0]!;
  expect(target).toBe('_blank');
  expect(features).toBe('noopener');
  return String(url);
}

describe('feedback form', () => {
  it('opens a pre-filled GitHub new-issue URL with title, body and metadata', () => {
    const url = fillAndSubmit('Bubble drifts', 'It floats the wrong way.');
    expect(url).not.toBeNull();
    expect(url).toMatch(/^https:\/\/github\.com\/moggleif\/libell\/issues\/new\?/);
    const params = new URL(url!).searchParams;
    expect(params.get('title')).toBe('[Feedback] Bug: Bubble drifts');
    const body = params.get('body')!;
    expect(body).toContain('It floats the wrong way.');
    expect(body).toContain('- App version:');
    expect(body).toContain('- User agent:');
  });

  it('disables the submit button until title and description are filled', () => {
    const section = createFeedbackSection();
    const form = section.querySelector('form')!;
    const submit = section.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);
    section.querySelector<HTMLInputElement>('input[type="text"]')!.value = 'Only a title';
    form.dispatchEvent(new Event('input'));
    expect(submit.disabled).toBe(true);
    section.querySelector<HTMLTextAreaElement>('textarea')!.value = 'And a description';
    form.dispatchEvent(new Event('input'));
    expect(submit.disabled).toBe(false);
  });
});

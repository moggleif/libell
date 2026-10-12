// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFeedbackSection } from './feedback';
import { setLanguage, t } from './i18n';

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

  // #411: "Varning är rätt. Aldrig stopp." — the button is never disabled;
  // a warning names what is empty, and sending still works.
  function warningText(section: HTMLElement): string {
    return section.querySelector('.feedback__warning')?.textContent ?? '';
  }

  function type(section: HTMLElement, title: string, description: string): void {
    section.querySelector<HTMLInputElement>('input[type="text"]')!.value = title;
    section.querySelector<HTMLTextAreaElement>('textarea')!.value = description;
    section.querySelector('form')!.dispatchEvent(new Event('input'));
  }

  it('keeps the submit button enabled while title and description are empty (#411)', () => {
    const section = createFeedbackSection();
    const submit = section.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(false);
    type(section, 'Only a title', '');
    expect(submit.disabled).toBe(false);
  });

  it('warns which field is empty and clears the warning once both are filled (#411)', () => {
    const section = createFeedbackSection();
    expect(warningText(section)).toBe(t('feedback.warn.both'));
    type(section, 'Only a title', '');
    expect(warningText(section)).toBe(t('feedback.warn.desc'));
    type(section, '', 'Only a description');
    expect(warningText(section)).toBe(t('feedback.warn.title'));
    type(section, '  ', 'Whitespace is empty');
    expect(warningText(section)).toBe(t('feedback.warn.title'));
    type(section, 'Title', 'Description');
    expect(warningText(section)).toBe('');
  });

  it('sends the report anyway when title and description are empty (#411)', () => {
    const url = fillAndSubmit('', '');
    expect(url).not.toBeNull();
    const params = new URL(url!).searchParams;
    expect(params.get('title')).toBe('[Feedback] Bug: ');
    expect(params.get('body')).toContain('- App version:');
  });
});

describe('the feedback category (#483)', () => {
  it('offers the three categories, Bug picked first', () => {
    const section = createFeedbackSection();
    const radios = [...section.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.map((radio) => radio.value)).toEqual(['bug', 'suggestion', 'other']);
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
    expect(section.querySelector('legend')?.textContent).toBe(t('feedback.category'));
  });

  it('names the picked category in the issue title', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const section = createFeedbackSection();
    const suggestion = section.querySelector<HTMLInputElement>('input[value="suggestion"]')!;
    suggestion.checked = true;
    suggestion.dispatchEvent(new Event('change'));
    section.querySelector<HTMLInputElement>('input[type="text"]')!.value = 'Darker theme';
    section.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    const params = new URL(String(open.mock.calls[0]![0])).searchParams;
    expect(params.get('title')).toBe(`[Feedback] ${t('feedback.cat.suggestion')}: Darker theme`);
  });
});

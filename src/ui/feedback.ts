/**
 * Feedback form. A static site has no backend to hold a GitHub token, so the
 * form opens GitHub's new-issue page pre-filled and the visitor posts it
 * under their own account: no secret ever ships in the client.
 */

import { t, type MessageKey } from './i18n';

const REPO_ISSUES_URL = 'https://github.com/moggleif/libell/issues/new';

const CATEGORIES: { id: string; label: MessageKey }[] = [
  { id: 'bug', label: 'feedback.cat.bug' },
  { id: 'suggestion', label: 'feedback.cat.suggestion' },
  { id: 'other', label: 'feedback.cat.other' },
];

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

type Category = (typeof CATEGORIES)[number];

export function createFeedbackSection(): HTMLElement {
  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('feedback.intro');
  const form = document.createElement('form');
  form.className = 'settings__form';

  let category: Category = CATEGORIES[0] ?? { id: 'other', label: 'feedback.cat.other' };
  const categoryRow = createCategoryRow(category, (picked) => (category = picked));
  const title = createWideField(t('feedback.title'), createTitleInput());
  const description = createWideField(t('feedback.desc'), createDescriptionInput());
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'menu__action';
  submit.textContent = t('feedback.submit');
  const warning = createEmptyFieldWarning(form, title.input, description.input);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.open(
      issueUrl(category, title.input.value, description.input.value),
      '_blank',
      'noopener',
    );
  });
  form.append(categoryRow, title.field, description.field, warning, submit);
  const body = document.createElement('div');
  body.append(intro, form);
  return body;
}

function createCategoryRow(initial: Category, onPick: (category: Category) => void) {
  const categoryRow = document.createElement('fieldset');
  categoryRow.className = 'feedback__categories';
  const legend = document.createElement('legend');
  legend.className = 'menu__text';
  legend.textContent = t('feedback.category');
  categoryRow.append(legend);
  for (const cat of CATEGORIES) {
    const label = document.createElement('label');
    label.className = 'feedback__category';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'category';
    radio.value = cat.id;
    radio.checked = cat === initial;
    radio.addEventListener('change', () => {
      if (radio.checked) onPick(cat);
    });
    label.append(radio, document.createTextNode(` ${t(cat.label)}`));
    categoryRow.append(label);
  }
  return categoryRow;
}

function createTitleInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = MAX_TITLE;
  return input;
}

function createDescriptionInput(): HTMLTextAreaElement {
  const input = document.createElement('textarea');
  input.rows = 4;
  input.maxLength = MAX_DESCRIPTION;
  input.className = 'feedback__description';
  return input;
}

function createWideField<T extends HTMLElement>(captionText: string, input: T) {
  const field = document.createElement('label');
  field.className = 'settings__field settings__field--wide';
  const caption = document.createElement('span');
  caption.textContent = captionText;
  field.append(caption, input);
  return { field, input };
}

/** Warn, never block: the button stays enabled while fields are empty. */
function createEmptyFieldWarning(
  form: HTMLFormElement,
  titleInput: HTMLInputElement,
  descInput: HTMLTextAreaElement,
): HTMLParagraphElement {
  const warning = document.createElement('p');
  warning.className = 'menu__text menu__text--warning feedback__warning';
  warning.setAttribute('role', 'status');
  const updateWarning = () => {
    const key = emptyFieldWarning(titleInput.value.trim() === '', descInput.value.trim() === '');
    warning.textContent = key ? t(key) : '';
    warning.hidden = key === null;
  };
  form.addEventListener('input', updateWarning);
  updateWarning();
  return warning;
}

function emptyFieldWarning(noTitle: boolean, noDesc: boolean): MessageKey | null {
  if (noTitle && noDesc) return 'feedback.warn.both';
  if (noTitle) return 'feedback.warn.title';
  if (noDesc) return 'feedback.warn.desc';
  return null;
}

/** GitHub's new-issue page, pre-filled with the report and what helps
 * reproduce it. */
function issueUrl(category: Category, title: string, description: string): string {
  const issueTitle = `[Feedback] ${t(category.label)}: ${title.trim()}`;
  const metadata = [
    '',
    '---',
    `- App version: ${__APP_VERSION__ ?? 'unknown'}`,
    `- Screen: ${window.screen.width}×${window.screen.height}`,
    `- Time: ${new Date().toISOString()}`,
    `- User agent: ${navigator.userAgent}`,
  ].join('\n');
  return (
    `${REPO_ISSUES_URL}?title=${encodeURIComponent(issueTitle)}` +
    `&body=${encodeURIComponent(description.trim() + '\n' + metadata)}`
  );
}

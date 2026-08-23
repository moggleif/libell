/**
 * Feedback form (menu section), modeled on sbsommar's feedback feature
 * (02-§73) but adapted to a static site with no backend: instead of an
 * API holding a GitHub token, the form opens GitHub's new-issue page
 * pre-filled with the category, title, description and app metadata —
 * the visitor posts it under their own GitHub account, so no secret
 * ever ships in the client.
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

export function createFeedbackSection(): HTMLElement {
  const body = document.createElement('div');

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('feedback.intro');

  const form = document.createElement('form');
  form.className = 'settings__form';

  // Category.
  const categoryRow = document.createElement('fieldset');
  categoryRow.className = 'feedback__categories';
  const legend = document.createElement('legend');
  legend.className = 'menu__text';
  legend.textContent = t('feedback.category');
  categoryRow.append(legend);
  let category = CATEGORIES[0] ?? { id: 'other', label: 'feedback.cat.other' as MessageKey };
  for (const cat of CATEGORIES) {
    const label = document.createElement('label');
    label.className = 'feedback__category';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'category';
    radio.value = cat.id;
    radio.checked = cat === category;
    radio.addEventListener('change', () => {
      if (radio.checked) category = cat;
    });
    label.append(radio, document.createTextNode(` ${t(cat.label)}`));
    categoryRow.append(label);
  }

  // Title + description.
  const titleField = document.createElement('label');
  titleField.className = 'settings__field settings__field--wide';
  const titleCaption = document.createElement('span');
  titleCaption.textContent = t('feedback.title');
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.maxLength = MAX_TITLE;
  titleField.append(titleCaption, titleInput);

  const descField = document.createElement('label');
  descField.className = 'settings__field settings__field--wide';
  const descCaption = document.createElement('span');
  descCaption.textContent = t('feedback.desc');
  const descInput = document.createElement('textarea');
  descInput.rows = 4;
  descInput.maxLength = MAX_DESCRIPTION;
  descInput.className = 'feedback__description';
  descField.append(descCaption, descInput);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'menu__action';
  submit.textContent = t('feedback.submit');
  submit.disabled = true;

  // Active only when pressing it does something (title + description filled).
  const updateDisabled = () => {
    submit.disabled = titleInput.value.trim() === '' || descInput.value.trim() === '';
  };
  form.addEventListener('input', updateDisabled);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const issueTitle = `[Feedback] ${t(category.label)}: ${titleInput.value.trim()}`;
    const metadata = [
      '',
      '---',
      `- App version: ${__APP_VERSION__ ?? 'unknown'}`,
      `- Screen: ${window.screen.width}×${window.screen.height}`,
      `- Time: ${new Date().toISOString()}`,
      `- User agent: ${navigator.userAgent}`,
    ].join('\n');
    const url =
      `${REPO_ISSUES_URL}?title=${encodeURIComponent(issueTitle)}` +
      `&body=${encodeURIComponent(descInput.value.trim() + '\n' + metadata)}`;
    window.open(url, '_blank', 'noopener');
  });

  form.append(categoryRow, titleField, descField, submit);
  body.append(intro, form);
  return body;
}

import './ui/styles.css';
import { setupInstallButton } from './ui/install';

const installButton = document.querySelector<HTMLButtonElement>('#install-button');
const installHint = document.querySelector<HTMLElement>('#install-hint');
if (installButton && installHint) {
  setupInstallButton(installButton, installHint);
}

// Placeholder content. Real screens are built per the GitHub issue backlog
// (see docs/02-REQUIREMENTS.md).
const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const note = document.createElement('p');
  note.className = 'app__hint';
  note.textContent = 'Lay your phone flat inside your RV, top edge toward the front.';
  app.append(note);
}

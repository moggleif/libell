import './ui/styles.css';

// Placeholder entry point. Real screens are built per the GitHub issue backlog
// (see docs/02-REQUIREMENTS.md).
const app = document.querySelector<HTMLElement>('#app');

if (app) {
  const title = document.createElement('h1');
  title.className = 'app__title';
  title.textContent = 'LevelMate';
  app.append(title);
}

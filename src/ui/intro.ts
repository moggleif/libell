/**
 * The intro on the very first visit (#691), before the guide: what Libell
 * is and what you do with it, then one main action. Install sits here too,
 * since the guide covers the top bar's install row. Nothing is forced:
 * "Look around first" goes straight to the app.
 */
import { createDialog } from './dialog';
import { button, createElement } from './dom';
import { placementIllustration } from './helpIllustrations';
import { t } from './i18n';
import type { InstallOffer } from './install';

export interface IntroOptions {
  install: InstallOffer;
  /** "Get started": the guide opens next. */
  onStart(): void;
  /** "Look around first": the app, with the lamps for what is left. */
  onLookAround(): void;
}

export function showIntro(options: IntroOptions): void {
  const dialog = createDialog({
    className: 'intro',
    cardClassName: 'intro__card',
    headingId: 'intro-heading',
    heading: { className: 'intro__title', text: t('intro.h') },
  });
  dialog.card.append(
    buildBody(dialog.heading),
    buildNav(
      options.install,
      dialog.closeThen(options.onStart),
      dialog.closeThen(options.onLookAround),
    ),
  );
  dialog.open();
}

function buildBody(heading: HTMLHeadingElement): HTMLElement {
  const body = createElement('div', 'intro__body');
  // The words below say it all; the drawing only shows it.
  const drawing = placementIllustration('');
  drawing.setAttribute('aria-hidden', 'true');
  body.append(drawing, heading, paragraph('about.text'), paragraph('intro.how'));
  return body;
}

function paragraph(key: 'about.text' | 'intro.how' | 'install.hint'): HTMLParagraphElement {
  const p = createElement('p', 'intro__text');
  p.textContent = t(key);
  return p;
}

function buildNav(
  install: InstallOffer,
  onStart: () => void,
  onLookAround: () => void,
): HTMLElement {
  const nav = createElement('div', 'intro__nav');
  const later = button('intro__later', t('intro.later'), onLookAround);
  nav.append(button('menu__action', t('intro.start'), onStart), ...installParts(install), later);
  return nav;
}

/** Shown while the browser offers to install; the offer can arrive late. */
function installParts(install: InstallOffer): HTMLElement[] {
  const hint = paragraph('install.hint');
  hint.classList.add('intro__hint');
  hint.hidden = true;
  const installButton = button('menu__action menu__action--secondary', t('topbar.install'), () => {
    if (install.install() === 'hint') hint.hidden = !hint.hidden;
  });
  const sync = () => {
    installButton.hidden = install.kind() === null;
    if (installButton.hidden) hint.hidden = true;
  };
  install.onChange(sync);
  sync();
  return [installButton, hint];
}

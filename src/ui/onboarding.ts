/**
 * First-run onboarding wizard (issue #43): three steps — how to place
 * the phone, the vehicle measurements, calibration. Every step can be
 * skipped; whatever is skipped stays flagged by the warning lamps, so
 * the wizard guides without ever blocking. Reuses the real settings
 * form and calibration section — one source of truth for both.
 */
import type { LevelSettings } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import {
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import { t } from './i18n';

export interface OnboardingOptions extends CalibrationOptions {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  onFinished(): void;
}

export function showOnboarding(options: OnboardingOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'onboarding';

  const card = document.createElement('div');
  card.className = 'onboarding__card';
  overlay.append(card);

  // Always escapable: ✕ closes the wizard from any step. It can be
  // reopened from the menu ("Show introduction") at any time.
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'onboarding__close';
  close.setAttribute('aria-label', t('onboard.close'));
  close.textContent = '✕';
  close.addEventListener('click', () => finish());

  const steps: { title: string; build: () => Element[]; skipLabel?: string }[] = [
    {
      title: t('onboard.step1.h'),
      build: () => {
        const text = document.createElement('p');
        text.className = 'menu__text';
        text.textContent = t('help.what.t');
        // How to read the answer (#71): the same legend and caption as
        // the Help section — colors, glyphs and the bubble.
        const legendText = document.createElement('p');
        legendText.className = 'menu__text';
        legendText.textContent = t('help.screen.t');
        return [
          placementIllustration(t('onboard.step1.h')),
          text,
          legendIllustration(t('help.screen.h')),
          legendText,
        ];
      },
    },
    {
      title: t('menu.settings'),
      skipLabel: t('onboard.skipDefaults'),
      build: () => [
        measuresIllustration(t('menu.settings')),
        createSettingsForm(options.initialSettings, options.onSettingsSaved),
      ],
    },
    {
      title: t('menu.calibration'),
      skipLabel: t('onboard.skipStep'),
      build: () => [createCalibrationSection(options).element],
    },
  ];

  let index = 0;

  function finish(): void {
    overlay.remove();
    options.onFinished();
  }

  function renderStep(): void {
    const step = steps[index];
    if (!step) {
      finish();
      return;
    }
    card.replaceChildren();

    const header = document.createElement('div');
    header.className = 'onboarding__header';
    const progress = document.createElement('p');
    progress.className = 'onboarding__progress';
    progress.textContent = `${index + 1} / ${steps.length}`;
    header.append(progress, close);

    const heading = document.createElement('h2');
    heading.className = 'onboarding__title';
    heading.tabIndex = -1;
    heading.textContent = step.title;

    const body = document.createElement('div');
    body.className = 'onboarding__body';
    body.append(...step.build());

    const nav = document.createElement('div');
    nav.className = 'onboarding__nav';
    if (step.skipLabel) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'menu__action menu__action--secondary';
      skip.textContent = step.skipLabel;
      skip.addEventListener('click', () => {
        index += 1;
        renderStep();
      });
      nav.append(skip);
    }
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'menu__action';
    next.textContent = index === steps.length - 1 ? t('onboard.done') : t('onboard.next');
    next.addEventListener('click', () => {
      index += 1;
      renderStep();
    });
    nav.append(next);

    card.append(header, heading, body, nav);
    heading.focus();
  }

  document.body.append(overlay);
  renderStep();
}

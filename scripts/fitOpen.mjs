// Opens the app for the fit test with the preferences under test already
// stored, the way a returning user's phone would have them.

import { previewUrl } from './withPreview.mjs';

// Where the fit test serves the built app (#672 moved it to the root).
export const PORT = 4175;
export const BASE = previewUrl(PORT);

// The real keys settingsStore.ts reads — settings as one JSON object,
// language and the onboarding flag on their own. Writing anything else
// (a made-up ".v1" suffix, say) silently leaves every run on the
// defaults, which would quietly reduce the whole sweep to one
// combination tested many times over.
const SETTINGS_KEY = 'libell.settings';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';
const COUNTING_KEY = 'libell.counting';

/**
 * A new page on `base + query`, reloaded once the settings are stored. The
 * unit is stored too, so a run never starts in inches just because the
 * browser's region uses them (#627). `ramp` overrides the ramp settings,
 * e.g. `{ rampStepHeightsMm }`.
 */
export async function openWithSettings(
  context,
  base,
  {
    appearance,
    language,
    query = '',
    onboarded = true,
    vehicleType = 'motorhome',
    displayUnit = 'mm',
    ramp = {},
  },
) {
  const page = await context.newPage();
  await page.goto(base + query);
  await page.evaluate(
    ([keys, settings, language, onboarded]) => {
      localStorage.clear();
      localStorage.setItem(keys.settings, JSON.stringify(settings));
      localStorage.setItem(keys.language, language);
      // Without these the counting choice and the first-run guide open
      // over whatever view is under test; a first run gets both.
      if (onboarded) localStorage.setItem(keys.onboarded, '1');
      if (onboarded) localStorage.setItem(keys.counting, 'off');
    },
    [
      {
        settings: SETTINGS_KEY,
        language: LANGUAGE_KEY,
        onboarded: ONBOARDED_KEY,
        counting: COUNTING_KEY,
      },
      { appearance, vehicleType, displayUnit, ...ramp },
      language,
      onboarded,
    ],
  );
  await page.reload();
  return page;
}

/** The counting choice (#699) and the first-visit intro (#691) stand
 * before the guide: `audit` each by name, then "No thanks" (the choice's
 * second button) and "Get started" (the intro's main button). */
export async function passIntro(page, audit) {
  await page.waitForSelector('.counting-choice');
  await audit('counting choice');
  await page.locator('.counting-choice .intro__nav button').last().click();
  await page.waitForSelector('.counting-choice', { state: 'detached' });
  await page.waitForSelector('.intro');
  await audit('intro');
  await page.locator('.intro .menu__action').first().click();
  await page.waitForSelector('.onboarding');
}

/** The help page's Privacy tab (#678) at its longest: the raw data open and
 * the delete question asked. */
export async function openPrivacyTab(page) {
  await page.locator('[data-tab="privacy"]').click();
  await page.locator('.stored-data__raw summary').click();
  await page.locator('.stored-data .menu__action--danger').first().click();
}

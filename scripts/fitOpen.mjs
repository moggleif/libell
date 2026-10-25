// Opens the app for the fit test with the preferences under test already
// stored, the way a returning user's phone would have them.

import { basePath } from './basePath.ts';

// Where the fit test serves the built app (#672 moved it to the root).
export const PORT = 4175;
export const BASE = `http://localhost:${PORT}${basePath()}`;

// The real keys settingsStore.ts reads — settings as one JSON object,
// language and the onboarding flag on their own. Writing anything else
// (a made-up ".v1" suffix, say) silently leaves every run on the
// defaults, which would quietly reduce the whole sweep to one
// combination tested many times over.
const SETTINGS_KEY = 'libell.settings';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';

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
      // Without this the first-run guide auto-opens over whatever view is
      // under test.
      if (onboarded) localStorage.setItem(keys.onboarded, '1');
    },
    [
      { settings: SETTINGS_KEY, language: LANGUAGE_KEY, onboarded: ONBOARDED_KEY },
      { appearance, vehicleType, displayUnit, ...ramp },
      language,
      onboarded,
    ],
  );
  await page.reload();
  return page;
}

/** The first-visit intro (#691) stands before the guide: `audit` it, then
 * "Get started" (its main button) into the guide. */
export async function passIntro(page, audit) {
  await page.waitForSelector('.intro');
  await audit();
  await page.locator('.intro .menu__action').first().click();
  await page.waitForSelector('.onboarding');
}

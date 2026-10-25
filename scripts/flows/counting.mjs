// The counting choice (#699): asked before anything else, stored as made,
// never asked again, and skipped when the browser asks not to be tracked.
import { assert, button, openApp, storage } from './harness.mjs';
import { intro } from './firstVisit.mjs';

export const countingChoice = (page) => page.locator('.counting-choice');

const FIRST_VISIT = { 'libell.onboarded': null, 'libell.counting': null };

export async function countingFlow(browser) {
  await chooseScenario(browser, 'Count', 'on');
  await chooseScenario(browser, 'Don’t count', 'off');
  await legacyOffScenario(browser);
  await privacySignalScenario(browser);
}

// The choice comes first, the intro waits behind it, and it is asked once.
async function chooseScenario(browser, label, stored) {
  const { context, page, errors } = await openApp(browser, 'counting', FIRST_VISIT);
  await countingChoice(page).waitFor();
  assert((await intro(page).count()) === 0, 'the intro should wait behind the choice');
  const text = await countingChoice(page).textContent();
  assert(text.includes('May Libell count your use anonymously?'), 'the screen should ask');
  assert(text.includes('What is never saved'), 'the screen should say what is never saved');
  await button(countingChoice(page), label).click();
  await countingChoice(page).waitFor({ state: 'detached' });
  assert((await storage(page, 'libell.counting')) === stored, `"${label}" should be stored`);
  await intro(page).waitFor();

  await page.reload();
  await page.locator('#app').waitFor();
  await intro(page).waitFor();
  assert((await countingChoice(page).count()) === 0, 'the choice should not be asked again');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// #674's "switched off" already is a choice.
async function legacyOffScenario(browser) {
  const { context, page, errors } = await openApp(browser, 'counting', {
    ...FIRST_VISIT,
    'libell.countingOff': '1',
  });
  await intro(page).waitFor();
  assert((await countingChoice(page).count()) === 0, 'an earlier "off" should not be asked');
  assert((await storage(page, 'libell.counting')) === 'off', 'it should become "off"');
  assert((await storage(page, 'libell.countingOff')) === null, 'the old key should go');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// Global Privacy Control answers for the user: no screen, nothing stored.
async function privacySignalScenario(browser) {
  const { context, page, errors } = await openApp(browser, 'counting', FIRST_VISIT, undefined, () =>
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }),
  );
  await intro(page).waitFor();
  assert((await countingChoice(page).count()) === 0, 'GPC should skip the choice');
  assert((await storage(page, 'libell.counting')) === null, 'GPC should store nothing');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

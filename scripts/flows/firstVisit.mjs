// The very first visit (#691): the intro before the guide, Install on it
// and on the row under the top bar, and the row's ✕.
import { assert, button, openApp, storage, wizard } from './harness.mjs';

export const intro = (page) => page.locator('.intro:not(.counting-choice)');

/** A stand-in for Chromium's install offer; its tap is counted. */
async function offerInstall(page) {
  await page.evaluate(() => {
    window.__prompted = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = () => {
      window.__prompted += 1;
      return Promise.resolve();
    };
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(event);
  });
}

const prompted = (page) => page.evaluate(() => window.__prompted);

export async function firstVisitFlow(browser) {
  await lookAroundScenario(browser);
  await getStartedScenario(browser);
}

// "Look around first": no guide, never again by itself; then the row.
async function lookAroundScenario(browser) {
  const { context, page, errors } = await openApp(browser, 'first-visit', {
    'libell.onboarded': null,
  });
  await intro(page).waitFor();
  assert((await wizard(page).count()) === 0, 'the guide should wait behind the intro');
  assert(
    (await intro(page).textContent()).includes('Lay the phone flat in the vehicle'),
    'the intro should say what you do with Libell',
  );
  assert(!(await button(intro(page), 'Install').isVisible()), 'nothing to install yet');
  await offerInstall(page);
  await button(intro(page), 'Install').waitFor();
  await button(intro(page), 'Look around first').click();
  await intro(page).waitFor({ state: 'detached' });
  assert((await wizard(page).count()) === 0, 'looking around should skip the guide');
  assert((await storage(page, 'libell.onboarded')) === '1', 'the intro should count as seen');

  const row = page.locator('#install-row');
  await row.waitFor();
  assert((await row.textContent()).includes('Install Libell as an app'), 'the row should say so');
  await button(row, 'Install').click();
  assert((await prompted(page)) === 1, 'the row should replay the browser offer');
  await offerInstall(page);
  await row.locator('#install-close').click();
  await row.waitFor({ state: 'hidden' });
  assert((await storage(page, 'libell.installDismissed')) === '1', 'the ✕ should be kept');

  await page.reload();
  await page.locator('#app').waitFor();
  await offerInstall(page);
  assert((await intro(page).count()) === 0, 'the intro should not come back');
  assert(!(await row.isVisible()), 'a dismissed row should stay hidden');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// "Get started" opens the guide on its first step; Install works here too.
async function getStartedScenario(browser) {
  const { context, page, errors } = await openApp(browser, 'first-visit', {
    'libell.onboarded': null,
  });
  await intro(page).waitFor();
  await offerInstall(page);
  await button(intro(page), 'Install').click();
  assert((await prompted(page)) === 1, 'Install on the intro should replay the browser offer');
  await button(intro(page), 'Get started').click();
  await wizard(page).waitFor();
  assert(
    (await wizard(page).locator('.onboarding__title').textContent()) === 'Language',
    'the guide should open on its first step',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

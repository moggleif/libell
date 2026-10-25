// The Privacy tab (#678): what is stored, in plain words and raw, and
// "Delete all Libell data", which starts the app again as on first run.
import { assert, button, closeClean, openApp, storage } from './harness.mjs';
import { countingChoice } from './counting.mjs';
import { intro } from './firstVisit.mjs';

const SEED = {
  'libell.settings': JSON.stringify({
    wheelbaseMm: 3800,
    sensorDevices: { xparkle: { axisMapping: null, password: '4321' } },
  }),
  'libell.vehicles': JSON.stringify({
    activeId: 'vehicle-1',
    vehicles: [{ id: 'vehicle-1', name: 'Hymer B 2', fields: {}, stored: {} }],
  }),
  'libell.calibration': JSON.stringify({ rollDeg: 0.3, pitchDeg: -0.2, capturedAt: 1 }),
  'libell.sensorDevice.xparkle': 'device-id',
};

async function openPrivacy(page) {
  await page.locator('#help-button').click();
  await page.locator('[data-tab="privacy"]').click();
  return page.locator('.stored-data');
}

export async function privacyFlow(browser) {
  const app = await openApp(browser, 'privacy', SEED);
  const { page } = app;
  await page.locator('#app').waitFor();
  const panel = await openPrivacy(page);
  const list = await panel.locator('.stored-data__list').textContent();
  for (const shown of [
    'Hymer B 2, wheelbase 3800 mm',
    'Phone calibration',
    'Xparkle RVS01: ••••',
  ]) {
    assert(list.includes(shown), `the list should show "${shown}"`);
  }
  await panel.locator('.stored-data__raw summary').click();
  assert(!(await panel.textContent()).includes('4321'), 'the box password should never show');

  await button(panel, 'Delete all Libell data').click();
  await button(panel, 'Cancel').click();
  assert((await storage(page, 'libell.vehicles')) !== null, 'Cancel should remove nothing');

  await page.evaluate(() => localStorage.setItem('other.site', 'keep'));
  await button(panel, 'Delete all Libell data').click();
  await Promise.all([page.waitForEvent('load'), button(panel, 'Yes, delete everything').click()]);
  // The counting choice is deleted too, so it is asked again first (#699).
  await countingChoice(page).waitFor();
  assert((await storage(page, 'libell.counting')) === null, 'the choice should be deleted');
  await button(countingChoice(page), 'No thanks').click();
  await intro(page).waitFor();
  for (const key of Object.keys(SEED)) {
    assert((await storage(page, key)) === null, `${key} should be deleted`);
  }
  assert((await storage(page, 'other.site')) === 'keep', 'other data should stay');
  await closeClean(app);
}

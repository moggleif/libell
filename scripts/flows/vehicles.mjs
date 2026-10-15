import { assert, button, openApp, openSettingsTab, storage, storedSettings } from './harness.mjs';

/** Adding or switching a vehicle starts the app again on it. */
async function reloadAfter(page, action) {
  await Promise.all([page.waitForEvent('load'), action()]);
}

const ZERO = JSON.stringify({ rollDeg: 1, pitchDeg: 0.5 });

// Several vehicles (#599): a new vehicle starts from the defaults with no
// zero, and switching back brings the first one's measurements and zero
// back, each across the reload a switch makes.
export async function vehiclesFlow(browser) {
  const app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ wheelbaseMm: 3600 }),
    'libell.vehicleCalibration': ZERO,
  });
  const { page } = app;
  let settings = await openSettingsTab(page, 'vehicle');
  await button(settings, 'New vehicle').click();
  await settings.locator('.name-prompt__input:visible').fill('Caravan');
  await reloadAfter(page, () => button(settings.locator('.name-prompt'), 'Save').click());
  const list = JSON.parse(await storage(page, 'libell.vehicles'));
  assert(list.vehicles.length === 2, 'the new vehicle should be listed');
  assert((await storage(page, 'libell.vehicleCalibration')) === null, 'a new vehicle has no zero');
  assert((await storedSettings(page)).wheelbaseMm !== 3600, 'a new vehicle starts from defaults');

  settings = await openSettingsTab(page, 'vehicle');
  const rows = settings.locator('.vehicles .choice__row-select');
  assert(
    (
      await settings.locator('.vehicles .choice__row-select[aria-pressed=true]').textContent()
    ).endsWith('Caravan'),
    'Caravan is active',
  );
  // Tapping the chosen vehicle again renames it in place (#613).
  await rows.filter({ hasText: 'Caravan' }).click();
  await settings.locator('.choice__row-input').fill('Camper');
  await settings.locator('.choice__row-input').press('Enter');
  await rows.filter({ hasText: 'Camper' }).waitFor();
  const renamed = JSON.parse(await storage(page, 'libell.vehicles'));
  assert(
    renamed.vehicles.some((v) => v.name === 'Camper'),
    'the rename should be stored',
  );
  await reloadAfter(page, () => rows.filter({ hasText: 'My vehicle' }).click());
  const { wheelbaseMm } = await storedSettings(page);
  assert(wheelbaseMm === 3600, 'switching back should bring the first vehicle back');
  assert((await storage(page, 'libell.vehicleCalibration')) === ZERO, 'and its zero');
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();
}

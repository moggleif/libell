import {
  assert,
  button,
  closeAllPages,
  closeClean,
  connectAndOpenBox,
  eventually,
  openApp,
  openSettingsTab,
  storedSettings,
} from './harness.mjs';

const poseOverlay = (page) => page.locator('.pose-overlay');

const fallbackPrompt = (page) => page.locator('.sensor-fallback');

// The level screen's frame loop: the pose guard pauses while a page is open.
export async function landscapeFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo', {}, { width: 844, height: 390 });
  await poseOverlay(page).getByText('Turn the phone to portrait', { exact: false }).waitFor();
  await page.click('#settings-button');
  await poseOverlay(page).waitFor({ state: 'hidden' });
  await closeAllPages(page);
  await poseOverlay(page).waitFor();
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// Clearly off level for a while arms the celebration; zeroing the vehicle
// then makes it level, and the overlay celebrates once back on the screen.
export async function celebrationFlow(browser) {
  const flat = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const { context, page, errors } = await openApp(browser, 'demo', { 'libell.calibration': flat });
  await page.locator('.rv-diagram').first().waitFor();
  await page.waitForTimeout(3500);
  const settings = await openSettingsTab(page, 'calibration');
  await button(settings, 'Zero now').click();
  await settings.getByText('Zeroed (today)').waitFor();
  await closeAllPages(page);
  await page.locator('.level-overlay.is-visible').waitFor({ timeout: 5000 });
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// A lost box dims the screen and offers the way back; the background
// retry brings it back on its own once the simulated outage is over.
export async function lostBoxFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'easylevel-sim=drop');
  await connectAndOpenBox(page, 'EasyLevel');
  await closeAllPages(page);
  await fallbackPrompt(page).getByText('Lost contact with the box').waitFor({ timeout: 20000 });
  assert(
    (await page.locator('.is-no-data').count()) > 0,
    'a lost box should dim the diagram and readout',
  );
  await eventually(
    async () => (await page.locator('.is-no-data').count()) === 0,
    'readings back should undim the diagram',
    20000,
  );
  assert(await fallbackPrompt(page).isHidden(), 'readings back should hide the prompt');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

const statusLine = (page) => page.locator('.status-line');

const diagramLabel = (page) =>
  page.locator('#app .rv-diagram svg').first().getAttribute('aria-label');

// The level screen per vehicle: the status row speaks only for what the
// wheel cards cannot show, and a saved change rebuilds the screen only
// when it changes what the screen is built from.
export async function levelScreenFlow(browser) {
  await statusRowScenarios(browser);
  await rebuildScenario(browser);
}

async function statusRowScenarios(browser) {
  // Nearly within the tolerance: how little is left.
  let app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ toleranceMm: 60 }),
  });
  await statusLine(app.page).getByText('Almost level — 3 mm left').waitFor();
  await closeClean(app);

  // Ramps whose first step is far too high: they do not reach.
  app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ rampStepHeightsMm: [200] }),
  });
  await statusLine(app.page)
    .getByText('Your ramps are far from enough here — move the vehicle')
    .waitFor();
  await closeClean(app);

  // A caravan: its own diagram, and nothing for the status row to say.
  app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ vehicleType: 'caravan' }),
  });
  await app.page.locator('.rv-diagram svg').first().waitFor();
  assert((await diagramLabel(app.page)).includes('caravan'), 'a caravan should get its diagram');
  await app.page.waitForTimeout(1000);
  assert(await statusLine(app.page).isHidden(), 'the caravan status row should stay hidden');
  await closeClean(app);
}

async function rebuildScenario(browser) {
  const app = await openApp(browser, 'demo');
  const { page } = app;
  await page.locator('.rv-diagram svg').first().waitFor();
  assert((await diagramLabel(page)).includes('motorhome'), 'a motorhome should get its diagram');
  await page.locator('#app .rv-diagram').evaluate((el) => (el.dataset.flowsMark = 'first'));
  const firstScreen = () =>
    page
      .locator('#app .rv-diagram[data-flows-mark=first]')
      .count()
      .then((n) => n === 1);

  // A save that the screen is not built from keeps the same screen.
  const general = await openSettingsTab(page, 'general');
  await general.getByText('Chime when level').click();
  await eventually(
    async () => (await storedSettings(page)).soundOnLevel === false,
    'unticking the chime should be stored',
  );
  await closeAllPages(page);
  assert(await firstScreen(), 'a sound setting should not rebuild the screen');

  // Switching the vehicle type rebuilds it for the caravan.
  const vehicle = await openSettingsTab(page, 'vehicle');
  await vehicle.locator('select:visible').first().selectOption('caravan');
  await closeAllPages(page);
  await eventually(
    async () => (await diagramLabel(page)).includes('caravan'),
    'switching to a caravan should rebuild the screen',
  );
  assert(!(await firstScreen()), 'the rebuilt screen should be a new one');
  assert(
    (await page.locator('#app .rv-diagram').count()) === 1,
    'the rebuilt screen should hold one diagram',
  );
  await closeClean(app);
}

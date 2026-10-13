import {
  assert,
  closeAllPages,
  closeClean,
  connectAndOpenBox,
  lamps,
  openApp,
} from './harness.mjs';

const pageTitle = (page) =>
  page.locator('.menu-page.is-visible .menu-page__title').last().textContent();

const openTab = (page) =>
  page.locator('.menu-page.is-visible [role=tab][aria-selected=true]').last().textContent();

/** Where a tap on `target` lands: the open page's title and tab. */
async function landing(page, target) {
  await target.click();
  await page.locator('.menu-page.is-visible').first().waitFor();
  await page.waitForTimeout(150);
  const where = `${await pageTitle(page)}${
    (await page.locator('.menu-page.is-visible [role=tab]').count()) > 0
      ? ` / ${await openTab(page)}`
      : ''
  }`;
  await closeAllPages(page);
  return where;
}

const lamp = (page, text) => page.locator('.indicators__lamp:visible').filter({ hasText: text });

/** Where a Help topic's button leads. */
async function helpLanding(page, topic) {
  await page.click('#help-button');
  const help = page.locator('.menu-page.is-visible').first();
  const section = help.locator('.help-topic').filter({
    has: page.locator('.help-topic__toggle', { hasText: topic }),
  });
  const toggle = section.locator('.help-topic__toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  return landing(page, section.locator('.help-topic__go'));
}

async function expectLanding(actual, expected, what) {
  assert((await actual) === expected, `${what} should open ${expected}, got ${await actual}`);
}

// The lamps, the sensor icon, the target badge and Help's buttons each
// open the right page, per appearance and per sensor.
export async function navigationFlow(browser) {
  await freshPhoneScenario(browser);
  await calibratedPhoneScenario(browser);
  await pendingBoxScenario(browser);
  await connectedBoxScenario(browser);
  await classicScenario(browser);
}

// A fresh phone: the lamps, the icon and Help's topics.
async function freshPhoneScenario(browser) {
  const app = await openApp(browser, 'xparkle-sim');
  const { page } = app;
  assert(
    JSON.stringify(await lamps(page)) === JSON.stringify(['⚠ Measurements', '⚠ Calibrate']),
    `a fresh phone should light Measurements and Calibrate, got ${await lamps(page)}`,
  );
  await expectLanding(
    landing(page, lamp(page, 'Measurements')),
    'Settings / Vehicle',
    'the Measurements lamp',
  );
  await expectLanding(
    landing(page, lamp(page, 'Calibrate')),
    'Settings / Calibrate and zero',
    'the Calibrate lamp',
  );
  await expectLanding(
    landing(page, page.locator('.sensor-status')),
    'Sensor box',
    'the sensor icon',
  );
  for (const [topic, expected] of [
    ['Enter the measurements', 'Settings / Vehicle'],
    ['Ramps', 'Settings / Ramps'],
    ['Calibrate and zero', 'Settings / Calibrate and zero'],
    ['Sensor box', 'Sensor box'],
    ['Targets and sound', 'Settings / Level'],
  ]) {
    await expectLanding(helpLanding(page, topic), expected, `Help's ${topic}`);
  }
  await closeClean(app);
}

// A calibrated phone asks for its zero, on the same tab.
async function calibratedPhoneScenario(browser) {
  const flat = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const app = await openApp(browser, 'xparkle-sim', { 'libell.calibration': flat });
  const { page } = app;
  assert((await lamps(page)).includes('⚠ Zero'), 'a calibrated phone should light ⚠ Zero');
  await expectLanding(
    landing(page, lamp(page, 'Zero')),
    'Settings / Calibrate and zero',
    "the phone's Zero lamp",
  );
  await closeClean(app);
}

// A box chosen in the wizard but not connected: to the box list (#365).
async function pendingBoxScenario(browser) {
  const app = await openApp(browser, 'xparkle-sim', { 'libell.boxPending': '1' });
  const { page } = app;
  await expectLanding(landing(page, lamp(page, 'Zero')), 'Sensor box', 'the pending Zero lamp');
  await expectLanding(
    helpLanding(page, 'Calibrate and zero'),
    'Sensor box',
    "Help's Calibrate and zero with a box pending",
  );
  await closeClean(app);
}

// A connected box: the icon, the lamp and Help go to its own page.
async function connectedBoxScenario(browser) {
  const app = await openApp(browser, 'xparkle-sim');
  const { page } = app;
  await connectAndOpenBox(page, 'Xparkle RVS01');
  await closeAllPages(page);
  await expectLanding(
    landing(page, page.locator('.sensor-status')),
    'Xparkle RVS01 sensor',
    'the icon',
  );
  await expectLanding(
    landing(page, lamp(page, 'Zero')),
    'Xparkle RVS01 sensor',
    "the box's Zero lamp",
  );
  await expectLanding(
    helpLanding(page, 'Calibrate and zero'),
    'Xparkle RVS01 sensor',
    "Help's Calibrate and zero with a box",
  );
  await expectLanding(helpLanding(page, 'Sensor box'), 'Xparkle RVS01 sensor', "Help's Sensor box");
  await closeClean(app);
}

// Classic: the ☰ menu's sections instead of Settings' tabs.
async function classicScenario(browser) {
  const preset = { id: 'p1', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } };
  const app = await openApp(browser, 'xparkle-sim', {
    'libell.settings': JSON.stringify({ appearance: 'classic' }),
    'libell.targetPresets': JSON.stringify([preset]),
    'libell.activeTarget': JSON.stringify('p1'),
  });
  const { page } = app;
  await expectLanding(
    landing(page, lamp(page, 'Calibrate')),
    'Calibrate and zero',
    'the Calibrate lamp',
  );
  await expectLanding(landing(page, page.locator('.target-badge')), 'Level', 'the target badge');
  for (const [topic, expected] of [
    ['Enter the measurements', 'Vehicle'],
    ['Ramps', 'Ramps'],
    ['Calibrate and zero', 'Calibrate and zero'],
    ['Targets and sound', 'Level'],
  ]) {
    await expectLanding(helpLanding(page, topic), expected, `Classic Help's ${topic}`);
  }
  await closeClean(app);
}

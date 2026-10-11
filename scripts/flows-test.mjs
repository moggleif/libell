// Flows test (#374): drives the built app through the flows that only
// exist as wiring in `src/main.ts`. For the boxes: connecting one, its
// health and live rows, picking or learning its direction, zeroing it,
// its password, its debug knob, and the silent reconnect after a reload,
// against the simulated boxes (`?xparkle-sim`, `?easylevel-sim`). For the
// phone: calibrating, zeroing and checking it, and target presets, against
// `?demo`'s fixed tilt. Settings' Calibration tab while a box is in use. For the first-run wizard: its phone calibration
// and its box path, connected or not. For the level screen: the pose
// guard, the level celebration, a lost box coming back, the status row
// per vehicle, and the rebuild after a saved change. The mute
// button and the sounds, against a stand-in for WebAudio. None of it
// needs hardware or Web Bluetooth.
//
// It exists to pin today's behaviour while `main.ts` is split into
// modules: the unit tests reach each module, but only a whole running app
// shows that the modules are still wired to each other the same way.
//
// Run after `npm run build`; CI runs it on every branch. Exits non-zero
// on any failed assertion.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4175;
const BASE = `http://localhost:${PORT}/libell/`;

function assert(condition, message) {
  if (!condition) throw new Error(`flows test failed: ${message}`);
}

/** A fresh page, past the first-run wizard, in English, with `seed`
 * written to localStorage before the app first reads it (a null value
 * removes the key), and `initScript` run before the app's own code. */
async function openApp(
  browser,
  query,
  seed = {},
  viewport = { width: 390, height: 844 },
  initScript = null,
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (initScript) await page.addInitScript(initScript);
  await page.addInitScript((extra) => {
    if (sessionStorage.getItem('flows.seeded')) return;
    sessionStorage.setItem('flows.seeded', '1');
    localStorage.setItem('libell.onboarded', '1');
    localStorage.setItem('libell.language', 'en');
    for (const [key, value] of Object.entries(extra)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  }, seed);
  await page.goto(`${BASE}?${query}`);
  return { context, page, errors };
}

/** Polls a check for a while: lamps and storage settle a frame or two
 * after the click that changes them. */
async function eventually(check, message, timeoutMs = 3000) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) assert(false, message);
    await new Promise((r) => setTimeout(r, 50));
  }
}

const storage = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const storedSettings = async (page) => JSON.parse((await storage(page, 'libell.settings')) ?? '{}');
const lamps = async (page) =>
  (await page.locator('.indicators__lamp:visible').allTextContents()).map((text) => text.trim());
const boxPage = (page) => page.locator('.sensor-status-page.is-visible');
const button = (scope, text) => scope.locator('button:visible').filter({ hasText: text }).first();

/** Connect the only box the list offers and open its own page. */
async function connectAndOpenBox(page, name) {
  await page.click('.sensor-status');
  const list = page.locator('.menu-page.is-visible').first();
  await button(list, 'Connect').click();
  await list.getByText('Connected', { exact: true }).waitFor();
  await button(list, name).click();
  await boxPage(page).waitFor();
  await boxPage(page).getByText('Connected · battery 62 %').waitFor();
}

async function closeAllPages(page) {
  for (;;) {
    const back = page.locator('.menu-page.is-visible .menu-page__back');
    if ((await back.count()) === 0) break;
    await back.last().click();
    await page.waitForTimeout(100);
  }
  // Classic's ☰ drawer stays open under its section pages.
  const drawer = page.locator('.menu:visible .menu__close');
  if ((await drawer.count()) > 0) {
    await drawer.click();
    await page.locator('.menu').waitFor({ state: 'hidden' });
  }
}

async function xparkleFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim');
  await connectAndOpenBox(page, 'Xparkle RVS01');
  const box = boxPage(page);

  // A connected box with no zero yet asks for one.
  assert((await lamps(page)).includes('⚠ Zero'), 'connected Xparkle should light ⚠ Zero');
  await eventually(
    async () => (await box.locator('.box-live').textContent()).includes('Stands upright'),
    'the live row should report the box standing upright',
  );
  assert(
    (await storage(page, 'libell.sensorDevice.xparkle')) === 'xparkle-simulated-box',
    'the connected device id should be remembered',
  );
  assert((await storedSettings(page)).sensorSource === 'xparkle', 'source should be remembered');

  // The learn guide is offered for this box.
  assert(
    (await button(box, 'Not sure? Learn it by raising the front').count()) === 1,
    'the Xparkle page should offer to learn the direction',
  );

  // Picking a direction stores the learned axis mapping.
  await box.locator('.mounting-picker__button--right').click();
  await box.getByText('Direction set: points to the right').waitFor();
  const mapping = (await storedSettings(page)).sensorDevices.xparkle.axisMapping;
  assert(
    JSON.stringify(mapping) === JSON.stringify({ swap: true, pitchSign: -1, rollSign: 1 }),
    `picking "right" should store its axis mapping, got ${JSON.stringify(mapping)}`,
  );

  // Zero: the box zeroes itself and Libell stores a zero offset.
  await button(box, 'Zero the vehicle').click();
  await button(box, 'Zero now').click();
  await box.getByText('Zeroed (today)').waitFor();
  const zero = JSON.parse(await storage(page, 'libell.installCalibration.xparkle'));
  assert(zero.rollDeg === 0 && zero.pitchDeg === 0, `Xparkle zero should be 0/0, got ${zero}`);
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Zero'),
    'a zeroed box should clear ⚠ Zero',
  );

  // Back on the main screen the box feeds the diagram.
  await closeAllPages(page);
  await page.locator('.rv-diagram svg').waitFor();
  assert(await page.locator('.app__hint').isHidden(), 'the waiting hint should be gone');

  // After a reload the remembered box reconnects silently.
  await page.reload();
  await page.locator('.rv-diagram svg').waitFor();
  await page.click('.sensor-status');
  await boxPage(page).getByText('Connected · battery 62 %').waitFor();

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

async function xparklePasswordFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim=badpassword');
  await page.click('.sensor-status');
  const list = page.locator('.menu-page.is-visible').first();
  await button(list, 'Connect').click();
  await button(list, 'Xparkle RVS01').click();
  const box = boxPage(page);
  const password = box.locator('.box-password');
  await password.waitFor();
  await password.locator('input').fill('1234');
  await button(password, '').click();
  await password.waitFor({ state: 'hidden' });
  await box.getByText('Connected · battery 62 %').waitFor();
  assert(
    (await storedSettings(page)).sensorDevices.xparkle.password === '1234',
    'an accepted password should be kept for later connects',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

async function easyLevelFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'easylevel-sim');
  await connectAndOpenBox(page, 'EasyLevel');
  const box = boxPage(page);
  assert((await lamps(page)).includes('⚠ Zero'), 'connected EasyLevel should light ⚠ Zero');
  await eventually(
    async () => (await box.locator('.box-live').textContent()).includes('Lies flat'),
    'the live row should report the box lying flat',
  );

  // Health and debug rows come from the box's own status struct.
  await box.locator('summary').first().click();
  for (const row of [
    'Temperature: 21.5°C',
    'Device ID: easylevel-simulated-box',
    'Firmware tier: 3',
    'Raw status bytes: 66 08',
  ]) {
    await eventually(
      async () => (await box.locator('.sensor-status__debug').textContent()).includes(row),
      `debug info should include "${row}"`,
    );
  }

  // The connect-delay knob is stored straight into the settings.
  await box.locator('.sensor-status__debug input[type=checkbox]').check();
  const device = (await storedSettings(page)).sensorDevices.easylevel;
  assert(device.connectDelayEnabled === true, 'enabling the connect delay should be stored');
  await box.locator('summary').first().click();

  // The learn guide reads the box and asks for the second lift.
  await button(box, 'Not sure? Learn it by raising the front').click();
  await button(box, 'Learn the mounting').click();
  await button(box, 'The front is raised').click();
  await button(box, 'The right side is raised').waitFor();
  await button(box, 'Cancel').click();

  // Picking a placement stores it as picked.
  await button(box, 'Short side forward').click();
  await box.getByText('Direction set', { exact: false }).waitFor();
  const picked = (await storedSettings(page)).sensorDevices.easylevel;
  assert(
    picked.mountingPicked === true && picked.mounting !== undefined,
    `picking a placement should store it, got ${JSON.stringify(picked)}`,
  );

  // Zero averages a short run of samples, then stores the box's reading.
  await button(box, 'Zero the vehicle').click();
  await button(box, 'Zero now').click();
  await box.getByText('Zeroed (today)').waitFor({ timeout: 5000 });
  const zero = JSON.parse(await storage(page, 'libell.installCalibration.easylevel'));
  assert(
    Math.abs(zero.rollDeg) > 0.1 && Math.abs(zero.rollDeg) < 15,
    `EasyLevel zero should be the box's own tilt, got ${JSON.stringify(zero)}`,
  );
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Zero'),
    'a zeroed box should clear ⚠ Zero',
  );

  // Forgetting the zero (a box that zeroes itself has no such link)
  // brings the lamp back.
  await button(box, 'Forget the zero').click();
  await eventually(
    async () => (await storage(page, 'libell.installCalibration.easylevel')) === null,
    'forgetting the zero should clear it from storage',
  );
  await eventually(
    async () => (await lamps(page)).includes('⚠ Zero'),
    'a forgotten zero should light ⚠ Zero again',
  );

  // Disconnecting hands the readings back to the phone.
  await button(box, 'Disconnect').click();
  await eventually(
    async () => (await storedSettings(page)).sensorSource === 'phone',
    'disconnect should pick the phone',
  );

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

/** Open Settings on one of its tabs. */
async function openSettingsTab(page, tab) {
  await page.click('#settings-button');
  await page.locator(`.menu-page.is-visible [role=tab][data-tab=${tab}]`).click();
  return page.locator('.menu-page.is-visible').first();
}

// ?demo's fixed tilt, in degrees (`DEMO_TILT_DEG` in src/app/demoSensor.ts).
const DEMO_ROLL = -1.2;
const DEMO_PITCH = -0.35;
const near = (a, b) => Math.abs(a - b) < 0.01;

async function phoneCalibrationFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo');
  const settings = await openSettingsTab(page, 'calibration');

  // Calibrating stores the phone's reading as its bias.
  await button(settings, 'Calibrate now').click();
  await settings.getByText('Phone calibrated (today)').waitFor();
  const calibration = JSON.parse(await storage(page, 'libell.calibration'));
  assert(
    near(calibration.rollDeg, DEMO_ROLL) && near(calibration.pitchDeg, DEMO_PITCH),
    `calibration should be the demo tilt, got ${JSON.stringify(calibration)}`,
  );

  // The vehicle zero is stored sensor-corrected: nothing left over here.
  await button(settings, 'Zero now').click();
  await settings.getByText('Zeroed (today)').waitFor();
  const zero = JSON.parse(await storage(page, 'libell.vehicleCalibration'));
  assert(
    near(zero.rollDeg, 0) && near(zero.pitchDeg, 0),
    `vehicle zero should be sensor-corrected to 0/0, got ${JSON.stringify(zero)}`,
  );

  // Check compares the reading against calibration plus zero.
  await button(settings, 'Zeroed (today)').click();
  await settings.locator('summary:visible').filter({ hasText: 'More' }).click();
  await button(settings, 'Check').click();
  await settings.getByText('Still good — off by 0.0°.').waitFor();

  // Forgetting the zero clears it.
  await button(settings, 'Forget the zero').click();
  await eventually(
    async () => (await storage(page, 'libell.vehicleCalibration')) === null,
    'forgetting the vehicle zero should clear it from storage',
  );

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

async function phoneCheckOffFlow(browser) {
  // A calibration and zero taken elsewhere: the demo tilt now reads as off.
  const level = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const { context, page, errors } = await openApp(browser, 'demo', {
    'libell.calibration': level,
    'libell.vehicleCalibration': level,
  });
  const settings = await openSettingsTab(page, 'calibration');
  await button(settings, 'Zeroed (today)').click();
  await settings.locator('summary:visible').filter({ hasText: 'More' }).click();
  await button(settings, 'Check').click();
  await settings.getByText('Off by 1.2° — consider recalibrating.').waitFor();
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

async function targetsFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo');
  const settings = await openSettingsTab(page, 'targets');

  // Saving a target stores the tilt relative to the zero (none here).
  await settings.locator('.targets__name-input').fill('Ferry');
  await button(settings, 'Save current tilt as new target').click();
  await settings.locator('.targets__row-label').filter({ hasText: 'Ferry' }).waitFor();
  const [preset] = JSON.parse(await storage(page, 'libell.targetPresets'));
  assert(
    preset.name === 'Ferry' &&
      near(preset.offset.rollDeg, DEMO_ROLL) &&
      near(preset.offset.pitchDeg, DEMO_PITCH),
    `the preset should hold the demo tilt, got ${JSON.stringify(preset)}`,
  );

  // An unnamed target gets the next free default name.
  await button(settings, 'Save current tilt as new target').click();
  await settings.locator('.targets__row-label').filter({ hasText: 'Target 1' }).waitFor();

  // Selecting it stores it and shows the badge on the main screen.
  await button(settings, 'Ferry').click();
  assert(
    (await storage(page, 'libell.activeTarget')) === JSON.stringify(preset.id),
    'selecting a target should store it as active',
  );
  await closeAllPages(page);
  await page.locator('.target-badge:visible').filter({ hasText: 'Ferry' }).waitFor();

  // Deleting the active target falls back to Normal and hides the badge.
  await page.locator('.target-badge').click();
  const targets = page.locator('.menu-page.is-visible').first();
  await targets.locator('.targets__row-delete[aria-label*="Ferry"]').click();
  await eventually(
    async () => JSON.parse(await storage(page, 'libell.targetPresets')).length === 1,
    'deleting a target should remove it from storage',
  );
  assert(
    (await storage(page, 'libell.activeTarget')) === null,
    'deleting the active target should fall back to Normal',
  );
  await closeAllPages(page);
  await page.locator('.target-badge').waitFor({ state: 'hidden' });

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

async function settingsBoxFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'easylevel-sim');
  await page.click('.sensor-status');
  const list = page.locator('.menu-page.is-visible').first();
  await button(list, 'Connect').click();
  await list.getByText('Connected', { exact: true }).waitFor();
  await closeAllPages(page);

  // With a box in use, Settings' Calibration tab zeroes the box.
  const settings = await openSettingsTab(page, 'calibration');
  await settings.getByText('Not zeroed yet', { exact: false }).waitFor();
  await button(settings, 'Zero now').click();
  await eventually(
    async () => (await storage(page, 'libell.installCalibration.easylevel')) !== null,
    "Settings' Zero now should store the box's zero",
    5000,
  );

  // And its link opens the box's own page.
  await button(settings, 'Show the box').click();
  await boxPage(page).getByText('EasyLevel sensor').waitFor();

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

const wizard = (page) => page.locator('.onboarding');

/** Tap the wizard's Next until the step titled `heading` shows. */
async function nextUntil(page, heading) {
  for (let step = 0; step < 15; step += 1) {
    const title = await wizard(page).locator('.onboarding__title').textContent();
    if (title.startsWith(heading)) return;
    await button(wizard(page), /^Next$/).click();
    await page.waitForTimeout(100);
  }
  assert(false, `the wizard never reached "${heading}"`);
}

/** Tap Next to the end, then Done. */
async function finishWizard(page) {
  while ((await button(wizard(page), /^Next$/).count()) > 0) {
    await button(wizard(page), /^Next$/).click();
    await page.waitForTimeout(100);
  }
  await button(wizard(page), /^Done$/).click();
  await wizard(page).waitFor({ state: 'detached' });
}

async function wizardPhoneFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo');
  // Demo never opens the wizard by itself; Help does.
  await page.click('#help-button');
  await button(page.locator('.menu-page.is-visible'), 'Show introduction').click();
  await nextUntil(page, 'Calibrate the phone');

  // Flip calibration hands its result back through the wizard's options.
  // The first tap captures, the second after the half turn.
  await button(wizard(page), 'Calibrate by flipping').click();
  await wizard(page).getByText('Now rotate the phone half a turn', { exact: false }).waitFor();
  await button(wizard(page), 'Capture').click();
  await wizard(page).getByText('Done! Your surface leans 0.0° — cancelled out.').waitFor();
  const calibration = JSON.parse(await storage(page, 'libell.calibration'));
  assert(
    near(calibration.rollDeg, DEMO_ROLL) && near(calibration.pitchDeg, DEMO_PITCH),
    `flip calibration should store the demo tilt, got ${JSON.stringify(calibration)}`,
  );

  await finishWizard(page);
  assert(
    (await storage(page, 'libell.onboardingDone')) === '1',
    'finishing the wizard should mark it done',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

/** The wizard's box path; `connect` decides whether a box is connected. */
async function wizardBoxFlow(browser, connect) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim', {
    'libell.onboarded': null,
  });
  await nextUntil(page, 'How do you want to measure?');
  await wizard(page).getByText('Sensor box', { exact: true }).click();
  await nextUntil(page, 'Sensor box');
  if (connect) {
    await button(wizard(page), 'Connect').click();
    await wizard(page).getByText('Connected', { exact: true }).waitFor();
  }
  await nextUntil(page, "The box's position");
  if (connect) {
    await eventually(
      async () => (await wizard(page).textContent()).includes('Stands upright'),
      "the wizard should show the connected box's live position",
    );
  } else {
    await wizard(page).getByText('No box is connected yet', { exact: false }).waitFor();
  }
  await finishWizard(page);

  // A box chosen but not connected keeps the lamp asking for it (#365).
  assert(
    (await storage(page, 'libell.boxPending')) === (connect ? null : '1'),
    `the box should ${connect ? 'not ' : ''}be pending after the wizard`,
  );
  await eventually(
    async () => (await lamps(page)).includes('⚠ Zero'),
    'the lamp should ask for the box zero after the wizard',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// The wizard's box step is the same card as the box page, password and all.
async function wizardPasswordFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim=badpassword', {
    'libell.onboarded': null,
  });
  await nextUntil(page, 'How do you want to measure?');
  await wizard(page).getByText('Sensor box', { exact: true }).click();
  await nextUntil(page, 'Sensor box');
  await button(wizard(page), 'Connect').click();
  await wizard(page).getByText('Connected', { exact: true }).waitFor();
  // The connect step is drawn once, so the verdict that arrives after the
  // connect shows when the step is drawn again.
  await button(wizard(page), 'Next').click();
  await button(wizard(page), 'Back').click();
  const password = wizard(page).locator('.box-password');
  await password.waitFor();
  await password.locator('input').fill('1234');
  await button(password, '').click();
  await password.waitFor({ state: 'hidden' });
  assert(
    (await storedSettings(page)).sensorDevices.xparkle.password === '1234',
    'a password typed in the wizard should be kept for later connects',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

const poseOverlay = (page) => page.locator('.pose-overlay');
const fallbackPrompt = (page) => page.locator('.sensor-fallback');

// The level screen's frame loop: the pose guard pauses while a page is open.
async function landscapeFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo', {}, { width: 844, height: 390 });
  await poseOverlay(page)
    .getByText('Turn the phone upright (portrait)', { exact: false })
    .waitFor();
  await page.click('#settings-button');
  await poseOverlay(page).waitFor({ state: 'hidden' });
  await closeAllPages(page);
  await poseOverlay(page).waitFor();
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// Clearly off level for a while arms the celebration; zeroing the vehicle
// then makes it level, and the overlay celebrates once back on the screen.
async function celebrationFlow(browser) {
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
async function lostBoxFlow(browser) {
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
async function levelScreenFlow(browser) {
  // Nearly within the tolerance: how little is left.
  let app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ toleranceMm: 60 }),
  });
  await statusLine(app.page).getByText('Almost level — 3 mm left').waitFor();
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // Ramps whose first step is far too high: they do not reach.
  app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ rampStepHeightsMm: [200] }),
  });
  await statusLine(app.page).getByText('Your ramps are way off here — move the vehicle').waitFor();
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A caravan: its own diagram, and nothing for the status row to say.
  app = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ vehicleType: 'caravan' }),
  });
  await app.page.locator('.rv-diagram svg').first().waitFor();
  assert((await diagramLabel(app.page)).includes('caravan'), 'a caravan should get its diagram');
  await app.page.waitForTimeout(1000);
  assert(await statusLine(app.page).isHidden(), 'the caravan status row should stay hidden');
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  const { context, page, errors } = await openApp(browser, 'demo');
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
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

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
async function navigationFlow(browser) {
  let app = await openApp(browser, 'xparkle-sim');
  let { page } = app;
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
    'Settings / Calibration',
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
    ['Calibrate and zero', 'Settings / Calibration'],
    ['Sensor box', 'Sensor box'],
    ['Targets and sound', 'Settings / Level'],
  ]) {
    await expectLanding(helpLanding(page, topic), expected, `Help's ${topic}`);
  }
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A calibrated phone asks for its zero, on the same tab.
  const flat = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  app = await openApp(browser, 'xparkle-sim', { 'libell.calibration': flat });
  page = app.page;
  assert((await lamps(page)).includes('⚠ Zero'), 'a calibrated phone should light ⚠ Zero');
  await expectLanding(
    landing(page, lamp(page, 'Zero')),
    'Settings / Calibration',
    "the phone's Zero lamp",
  );
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A box chosen in the wizard but not connected: to the box list (#365).
  app = await openApp(browser, 'xparkle-sim', { 'libell.boxPending': '1' });
  page = app.page;
  await expectLanding(landing(page, lamp(page, 'Zero')), 'Sensor box', 'the pending Zero lamp');
  await expectLanding(
    helpLanding(page, 'Calibrate and zero'),
    'Sensor box',
    "Help's Calibrate and zero with a box pending",
  );
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A connected box: the icon, the lamp and Help go to its own page.
  app = await openApp(browser, 'xparkle-sim');
  page = app.page;
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
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // Classic: the ☰ menu's sections instead of Settings' tabs.
  const preset = { id: 'p1', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } };
  app = await openApp(browser, 'xparkle-sim', {
    'libell.settings': JSON.stringify({ appearance: 'classic' }),
    'libell.targetPresets': JSON.stringify([preset]),
    'libell.activeTarget': JSON.stringify('p1'),
  });
  page = app.page;
  await expectLanding(landing(page, lamp(page, 'Calibrate')), 'Calibration', 'the Calibrate lamp');
  await expectLanding(landing(page, page.locator('.target-badge')), 'Level', 'the target badge');
  for (const [topic, expected] of [
    ['Enter the measurements', 'Vehicle'],
    ['Ramps', 'Ramps'],
    ['Calibrate and zero', 'Calibration'],
    ['Targets and sound', 'Level'],
  ]) {
    await expectLanding(helpLanding(page, topic), expected, `Classic Help's ${topic}`);
  }
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();
}

/** Stands in for WebAudio: counts contexts and resumes, and records every
 * tone by its frequency when it starts. */
function fakeAudio() {
  const log = { created: 0, resumed: 0, tones: [] };
  window.__audio = log;
  class Param {
    value = 0;
    setValueAtTime(value) {
      this.value = value;
    }
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class Node {
    connect(next) {
      return next;
    }
  }
  window.AudioContext = class {
    currentTime = 0;
    destination = new Node();
    constructor() {
      log.created += 1;
    }
    resume() {
      log.resumed += 1;
      return Promise.resolve();
    }
    createOscillator() {
      const osc = new Node();
      osc.frequency = new Param();
      osc.start = () => log.tones.push(osc.frequency.value);
      osc.stop = () => {};
      return osc;
    }
    createGain() {
      const gain = new Node();
      gain.gain = new Param();
      return gain;
    }
  };
}

const audioLog = (page) => page.evaluate(() => window.__audio);
const CHIME = [880, 1174.7];

// The mute button, the audio unlock, the guidance pulse and the chime.
async function soundFlow(browser) {
  const flat = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const { context, page, errors } = await openApp(
    browser,
    'demo',
    {
      'libell.calibration': flat,
      'libell.settings': JSON.stringify({ soundOnLevel: true, soundGuidance: true }),
    },
    undefined,
    fakeAudio,
  );
  await page.locator('.rv-diagram').first().waitFor();
  const sound = page.locator('#sound-button');
  assert((await sound.getAttribute('aria-label')) === 'Mute sound', 'sound should start unmuted');
  assert(await page.locator('#sound-icon-mute').isHidden(), 'the mute icon should start hidden');

  // No sound before a gesture unlocks it.
  await page.waitForTimeout(500);
  assert((await audioLog(page)).created === 0, 'audio should wait for a user gesture');

  // Muting turns both sounds off and stores it, without unlocking audio.
  await sound.click();
  await eventually(async () => {
    const stored = await storedSettings(page);
    return stored.soundOnLevel === false && stored.soundGuidance === false;
  }, 'muting should store both sounds off');
  assert((await sound.getAttribute('aria-label')) === 'Unmute sound', 'muted label');
  assert(
    await sound.evaluate((b) => b.classList.contains('bottombar__button--muted')),
    'muted class',
  );
  assert(await page.locator('#sound-icon-waves').isHidden(), 'muted hides the waves');
  assert((await audioLog(page)).created === 0, 'muting should not unlock audio');

  // Unmuting restores both and is the gesture that unlocks audio.
  await sound.click();
  await eventually(async () => {
    const stored = await storedSettings(page);
    return stored.soundOnLevel === true && stored.soundGuidance === true;
  }, 'unmuting should restore both sounds');
  assert((await sound.getAttribute('aria-label')) === 'Mute sound', 'unmuted label');
  assert(await page.locator('#sound-icon-mute').isHidden(), 'unmuted hides the mute icon');
  const unlocked = await audioLog(page);
  assert(unlocked.created === 1 && unlocked.resumed === 1, 'unmuting should unlock audio once');

  // Off level, the guidance pulses play.
  await eventually(
    async () => (await audioLog(page)).tones.length > 0,
    'guidance should pulse while off level',
    5000,
  );
  assert(
    (await audioLog(page)).tones.every((hz) => !CHIME.includes(hz)),
    'no chime before level',
  );

  // Level after the zero: the chime plays its two tones.
  await page.waitForTimeout(3000);
  const settings = await openSettingsTab(page, 'calibration');
  await button(settings, 'Zero now').click();
  await settings.getByText('Zeroed (today)').waitFor();
  await closeAllPages(page);
  await page.locator('.level-overlay.is-visible').waitFor({ timeout: 5000 });
  const tones = (await audioLog(page)).tones;
  const at = tones.indexOf(CHIME[0]);
  assert(at >= 0 && tones[at + 1] === CHIME[1], `the chime should play, got ${tones.join(', ')}`);

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// A save from Settings or from the wizard reaches the rest of the app:
// the lamps follow it, sound is unlocked by it, and the mute button's
// change shows when Settings opens again.
async function settingsSaveFlow(browser) {
  let app = await openApp(browser, 'xparkle-sim', {}, undefined, fakeAudio);
  let { page } = app;
  assert((await lamps(page)).includes('⚠ Measurements'), 'a fresh app lacks measurements');
  const vehicle = await openSettingsTab(page, 'vehicle');
  const wheelbase = vehicle.locator('input:visible').first();
  await wheelbase.fill('3600');
  await wheelbase.dispatchEvent('change');
  await closeAllPages(page);
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Measurements'),
    'saved measurements should clear the lamp',
  );
  assert((await audioLog(page)).created === 1, 'a save with sound on should unlock audio');

  // Muted from the bottom bar: Settings shows the chime off when reopened.
  await page.click('#sound-button');
  const general = await openSettingsTab(page, 'general');
  const chime = general.getByLabel('Chime when level');
  assert(!(await chime.isChecked()), 'Settings should show the muted chime');
  await closeAllPages(page);
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // The wizard's measurements clear the lamp as soon as they are saved.
  app = await openApp(browser, 'xparkle-sim', { 'libell.onboarded': null });
  page = app.page;
  await nextUntil(page, 'The measurements');
  const field = wizard(page)
    .locator('input[type=number]:visible, input[type=text]:visible')
    .first();
  await field.fill('3600');
  await field.dispatchEvent('change');
  await button(wizard(page), /^Next$/).click();
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Measurements'),
    "the wizard's measurements should clear the lamp",
  );
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();
}

/** Records what the app hands the share sheet. */
function fakeShare() {
  navigator.share = (data) => {
    window.__shared = data;
    return Promise.resolve();
  };
}

const appHint = (page) => page.locator('#app .app__hint').first();

// Start-up: the top bar, the storage migrations, an incoming vehicle-setup
// link, and how the phone sensor is started.
async function startupFlow(browser) {
  // The top bar is labelled and reserves the corner its icon sits in.
  let app = await openApp(browser, 'xparkle-sim');
  let { page } = app;
  assert(
    (await page.locator('#settings-button').getAttribute('aria-label')) === 'Settings',
    'the settings button should be labelled',
  );
  assert(
    (await page.locator('#help-button').getAttribute('aria-label')) === 'Help',
    'the help button should be labelled',
  );
  assert(
    (await page.locator('#install-hint').textContent()) === 'Tap Share, then "Add to Home Screen".',
    'the install hint should be translated',
  );
  assert(
    (await page.locator('#install-button').textContent()) === 'Install',
    'the install button should be translated',
  );
  const corner = await page
    .locator('.topbar')
    .evaluate((bar) => [
      bar.classList.contains('topbar--has-corner'),
      bar.style.getPropertyValue('--topbar-corner'),
    ]);
  assert(
    corner[0] && /^\d+px$/.test(corner[1]) && corner[1] !== '0px',
    `the corner should be reserved, got ${corner}`,
  );
  assert(
    (await page.locator('#sensor-slot .sensor-status').count()) === 1,
    'the icon sits in the corner',
  );
  // Headless Chromium has motion events but never fires one: waiting.
  await page
    .locator('#app.app--level')
    .waitFor({ timeout: 10000 })
    .catch(async () => {
      const seen = await page.evaluate(() => ({
        app: document.querySelector('#app')?.className,
        text: document.querySelector('#app')?.textContent?.slice(0, 200),
        motion: typeof window.DeviceMotionEvent,
        orientation: typeof window.DeviceOrientationEvent,
        secure: window.isSecureContext,
      }));
      throw new Error(`no level screen: ${JSON.stringify(seen)}; errors: ${app.errors}`);
    });
  assert((await appHint(page).textContent()) === 'Waiting for the tilt sensor…', 'should wait');
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // Storage from before the per-source keys is carried over once (#263).
  const legacyZero = JSON.stringify({ rollDeg: 1, pitchDeg: 2, capturedAt: 5 });
  app = await openApp(browser, 'xparkle-sim', {
    'libell.easyLevelDeviceId': 'old-box',
    'libell.easyLevelInstallCalibration': legacyZero,
    'libell.settings': JSON.stringify({ wheelbaseMm: 3700 }),
  });
  page = app.page;
  await page.locator('#app.app--level').waitFor();
  assert((await storage(page, 'libell.sensorDevice.easylevel')) === 'old-box', 'device id moved');
  assert(
    (await storage(page, 'libell.installCalibration.easylevel')) === legacyZero,
    'box zero moved',
  );
  assert((await storage(page, 'libell.measurementsSaved')) === '1', 'saved settings count');
  assert(!(await lamps(page)).includes('⚠ Measurements'), 'no measurements lamp after it');
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A shared vehicle setup arrives as a link, instead of the wizard.
  app = await openApp(
    browser,
    'demo',
    { 'libell.settings': JSON.stringify({ wheelbaseMm: 4321 }) },
    undefined,
    fakeShare,
  );
  page = app.page;
  const vehicle = await openSettingsTab(page, 'vehicle');
  await button(vehicle, 'Share to another phone').click();
  await eventually(() => page.evaluate(() => window.__shared !== undefined), 'shared');
  const { url } = await page.evaluate(() => window.__shared);
  assert(url.includes('#setup='), `the shared link should carry the setup, got ${url}`);
  await app.context.close();

  const setupHash = url.slice(url.indexOf('#'));
  app = await openApp(browser, `xparkle-sim${setupHash}`, { 'libell.onboarded': null });
  page = app.page;
  const incoming = page.locator('.incoming-setup');
  await incoming.waitFor();
  assert((await wizard(page).count()) === 0, 'the link should show instead of the wizard');
  assert(!(await page.evaluate(() => location.hash)), 'the link should be taken off the URL');
  await button(incoming, 'Use these values').click();
  await eventually(
    async () => (await storedSettings(page)).wheelbaseMm === 4321,
    'the shared wheelbase should be applied',
  );
  assert((await storage(page, 'libell.measurementsSaved')) === '1', 'applied counts as saved');
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Measurements'),
    'applied measurements should clear the lamp',
  );
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // A broken link changes nothing and says so.
  app = await openApp(browser, 'xparkle-sim#setup=not-a-setup');
  page = app.page;
  await page.getByText("That vehicle-setup link couldn't be read — nothing was changed.").waitFor();
  assert((await page.locator('.incoming-setup').count()) === 0, 'no setup to apply');
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();

  // iOS asks for motion access on a tap: Start, then the level screen.
  for (const [answer, expected] of [
    ['granted', null],
    ['denied', 'denied'],
  ]) {
    app = await openApp(
      browser,
      'xparkle-sim',
      {},
      undefined,
      `
      DeviceMotionEvent.requestPermission = () => Promise.resolve('${answer}');
    `,
    );
    page = app.page;
    assert(
      (await appHint(page).textContent()) ===
        'Lay your phone flat inside the vehicle, top edge toward the front.',
      'iOS should explain before asking',
    );
    await button(page.locator('#app'), 'Start').click();
    if (expected === null) {
      await page.locator('#app.app--level').waitFor();
    } else {
      await eventually(
        async () => (await appHint(page).textContent()).startsWith('Motion access was denied'),
        `a refusal should say so, got ${await appHint(page).textContent()}`,
      );
    }
    assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
    await app.context.close();
  }

  // No motion sensors at all.
  app = await openApp(
    browser,
    'xparkle-sim',
    {},
    undefined,
    `
    delete window.DeviceMotionEvent;
    delete window.DeviceOrientationEvent;
  `,
  );
  page = app.page;
  await page
    .getByText('This device does not expose motion sensors, so Libell cannot read the tilt.')
    .waitFor();
  assert(app.errors.length === 0, `page errors: ${app.errors.join('; ')}`);
  await app.context.close();
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});
let browser;
try {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fetch(BASE);
      break;
    } catch {
      if (attempt > 40) throw new Error('vite preview did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  // CHROMIUM_PATH overrides the browser binary, as in smoke-test.mjs.
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  await xparkleFlow(browser);
  await xparklePasswordFlow(browser);
  await easyLevelFlow(browser);
  await phoneCalibrationFlow(browser);
  await phoneCheckOffFlow(browser);
  await targetsFlow(browser);
  await settingsBoxFlow(browser);
  await wizardPhoneFlow(browser);
  await wizardBoxFlow(browser, true);
  await wizardBoxFlow(browser, false);
  await wizardPasswordFlow(browser);
  await landscapeFlow(browser);
  await celebrationFlow(browser);
  await lostBoxFlow(browser);
  await soundFlow(browser);
  await levelScreenFlow(browser);
  await navigationFlow(browser);
  await settingsSaveFlow(browser);
  await startupFlow(browser);
  console.log(
    'flows test passed: Xparkle, Xparkle password, EasyLevel, phone calibration, targets, Settings with a box, wizard, wizard password, landscape, celebration, lost box, sound, level screen, navigation, settings saves, start-up',
  );
} finally {
  await browser?.close();
  preview.kill();
}

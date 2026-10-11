// Flows test (#374): drives the built app through the flows that only
// exist as wiring in `src/main.ts`. For the boxes: connecting one, its
// health and live rows, picking or learning its direction, zeroing it,
// its password, its debug knob, and the silent reconnect after a reload,
// against the simulated boxes (`?xparkle-sim`, `?easylevel-sim`). For the
// phone: calibrating, zeroing and checking it, and target presets, against
// `?demo`'s fixed tilt. Settings' Calibration tab while a box is in use. For the first-run wizard: its phone calibration
// and its box path, connected or not. None of it needs hardware or Web
// Bluetooth.
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
 * removes the key). */
async function openApp(browser, query, seed = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
    if ((await back.count()) === 0) return;
    await back.last().click();
    await page.waitForTimeout(100);
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

// ?demo's fixed tilt, in degrees (`createDemoSensor` in main.ts).
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
  console.log(
    'flows test passed: Xparkle, Xparkle password, EasyLevel, phone calibration, targets, Settings with a box, wizard, wizard password',
  );
} finally {
  await browser?.close();
  preview.kill();
}

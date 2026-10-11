// Flows test (#374): drives the built app through the external-sensor
// flows that only exist as wiring in `src/main.ts` — connecting a box,
// its health and live rows, picking or learning its direction, zeroing
// it, its password, its debug knob, and the silent reconnect after a
// reload. Each flow runs against the simulated boxes (`?xparkle-sim`,
// `?easylevel-sim`), so it needs no hardware and no Web Bluetooth.
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

/** A fresh page, past the first-run wizard, in English. */
async function openApp(browser, query) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('flows.seeded')) return;
    sessionStorage.setItem('flows.seeded', '1');
    localStorage.setItem('libell.onboarded', '1');
    localStorage.setItem('libell.language', 'en');
  });
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
  console.log('flows test passed: Xparkle, Xparkle password, EasyLevel');
} finally {
  await browser?.close();
  preview.kill();
}

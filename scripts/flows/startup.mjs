import {
  assert,
  button,
  closeClean,
  eventually,
  lamps,
  openApp,
  openSettingsTab,
  storage,
  storedSettings,
  wizard,
} from './harness.mjs';

/** Records what the app hands the share sheet. */
function fakeShare() {
  navigator.share = (data) => {
    window.__shared = data;
    return Promise.resolve();
  };
}

const appHint = (page) => page.locator('#app .app__hint').first();

// Chromium 153 offers iOS's requestPermission too; these hide it so a
// case pins the start-up without the Start tap, or stub it as iOS's,
// which also hides Chromium's userAgentData marker (#410).
const permission = (motion, orientation) => `
    for (const [api, value] of [
      [window.DeviceMotionEvent, ${motion}],
      [window.DeviceOrientationEvent, ${orientation}],
    ]) {
      if (api) Object.defineProperty(api, 'requestPermission', { value });
    }
  `;
const notIos = permission('undefined', 'undefined');
const ios = (answer) =>
  permission(...Array(2).fill(`() => Promise.resolve('${answer}')`)) +
  'delete Navigator.prototype.userAgentData;';

// Start-up: the top bar, the storage migrations, an incoming vehicle-setup
// link, and how the phone sensor is started.
export async function startupFlow(browser) {
  await topBarScenario(browser);
  await legacyStorageScenario(browser);
  const url = await shareSetupScenario(browser);
  await incomingSetupScenario(browser, url);
  await brokenSetupLinkScenario(browser);
  await noTapPermissionScenario(browser);
  for (const answer of ['granted', 'denied']) await iosStartScenario(browser, answer);
  await noMotionSensorsScenario(browser);
}

// The top bar is labelled and reserves the corner its icon sits in.
async function topBarScenario(browser) {
  const app = await openApp(browser, 'xparkle-sim', {}, undefined, notIos);
  const { page } = app;
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
  await page.locator('#app.app--level').waitFor();
  assert((await appHint(page).textContent()) === 'Waiting for the tilt sensor…', 'should wait');
  await closeClean(app);
}

// Storage from before the per-source keys is carried over once (#263).
async function legacyStorageScenario(browser) {
  const legacyZero = JSON.stringify({ rollDeg: 1, pitchDeg: 2, capturedAt: 5 });
  const app = await openApp(
    browser,
    'xparkle-sim',
    {
      'libell.easyLevelDeviceId': 'old-box',
      'libell.easyLevelInstallCalibration': legacyZero,
      'libell.settings': JSON.stringify({ wheelbaseMm: 3700 }),
    },
    undefined,
    notIos,
  );
  const { page } = app;
  await page.locator('#app.app--level').waitFor();
  assert((await storage(page, 'libell.sensorDevice.easylevel')) === 'old-box', 'device id moved');
  assert(
    (await storage(page, 'libell.installCalibration.easylevel')) === legacyZero,
    'box zero moved',
  );
  assert((await storage(page, 'libell.measurementsSaved')) === '1', 'saved settings count');
  assert(!(await lamps(page)).includes('⚠ Measurements'), 'no measurements lamp after it');
  await closeClean(app);
}

// Settings shares the vehicle setup as a link; returns that link.
async function shareSetupScenario(browser) {
  const app = await openApp(
    browser,
    'demo',
    { 'libell.settings': JSON.stringify({ wheelbaseMm: 4321 }) },
    undefined,
    fakeShare,
  );
  const { page } = app;
  const vehicle = await openSettingsTab(page, 'vehicle');
  await button(vehicle, 'Share to another phone').click();
  await eventually(() => page.evaluate(() => window.__shared !== undefined), 'shared');
  const { url } = await page.evaluate(() => window.__shared);
  assert(url.includes('#setup='), `the shared link should carry the setup, got ${url}`);
  await app.context.close();
  return url;
}

// A shared vehicle setup arrives as a link, instead of the wizard.
async function incomingSetupScenario(browser, url) {
  const setupHash = url.slice(url.indexOf('#'));
  const app = await openApp(browser, `xparkle-sim${setupHash}`, { 'libell.onboarded': null });
  const { page } = app;
  const incoming = page.locator('.incoming-setup');
  await incoming.waitFor();
  assert((await wizard(page).count()) === 0, 'the link should show instead of the wizard');
  assert(!(await page.evaluate(() => location.hash)), 'the link should be taken off the URL');
  await button(incoming, 'Replace the current vehicle').click();
  await eventually(
    async () => (await storedSettings(page)).wheelbaseMm === 4321,
    'the shared wheelbase should be applied',
  );
  assert((await storage(page, 'libell.measurementsSaved')) === '1', 'applied counts as saved');
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Measurements'),
    'applied measurements should clear the lamp',
  );
  await closeClean(app);
}

// A broken link changes nothing and says so.
async function brokenSetupLinkScenario(browser) {
  const app = await openApp(browser, 'xparkle-sim#setup=not-a-setup');
  const { page } = app;
  await page.getByText("That vehicle-setup link couldn't be read — nothing was changed.").waitFor();
  assert((await page.locator('.incoming-setup').count()) === 0, 'no setup to apply');
  await closeClean(app);
}

// Chrome 153+ offers requestPermission but needs no tap (#410): straight
// to the level screen, even when that request would never settle.
async function noTapPermissionScenario(browser) {
  const app = await openApp(
    browser,
    'xparkle-sim',
    {},
    undefined,
    permission(...Array(2).fill('() => new Promise(() => {})')),
  );
  await app.page.locator('#app.app--level').waitFor();
  await closeClean(app);
}

// iOS asks for motion access on a tap: Start, then the level screen, or
// the refusal when `answer` is 'denied'.
async function iosStartScenario(browser, answer) {
  const app = await openApp(browser, 'xparkle-sim', {}, undefined, ios(answer));
  const { page } = app;
  assert(
    (await appHint(page).textContent()) ===
      'Lay your phone flat inside the vehicle, top edge toward the front.',
    'iOS should explain before asking',
  );
  await button(page.locator('#app'), 'Start').click();
  if (answer === 'granted') {
    await page.locator('#app.app--level').waitFor();
  } else {
    await eventually(
      async () => (await appHint(page).textContent()).startsWith('Motion access was denied'),
      `a refusal should say so, got ${await appHint(page).textContent()}`,
    );
  }
  await closeClean(app);
}

// No motion sensors at all.
async function noMotionSensorsScenario(browser) {
  const app = await openApp(
    browser,
    'xparkle-sim',
    {},
    undefined,
    `
    delete window.DeviceMotionEvent;
    delete window.DeviceOrientationEvent;
  `,
  );
  await app.page
    .getByText('This device does not expose motion sensors, so Libell cannot read the tilt.')
    .waitFor();
  await closeClean(app);
}

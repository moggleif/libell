// The flows test's shared helpers (#374, split per flow in #518): opening
// the app on a fresh page, polling, reading storage and the lamps, and
// finding and leaving its pages.

import { basePath } from '../basePath.ts';

export const PORT = 4175;
export const BASE = `http://localhost:${PORT}${basePath()}`;

export function assert(condition, message) {
  if (!condition) throw new Error(`flows test failed: ${message}`);
}

/** A fresh page, past the first-run wizard, in English, with `seed`
 * written to localStorage before the app first reads it (a null value
 * removes the key), and `initScript` run before the app's own code. */
export async function openApp(
  browser,
  query,
  seed = {},
  viewport = { width: 390, height: 844 },
  initScript = null,
) {
  // A metric region, so a first run starts in mm whatever the runner's own
  // locale is (#627: en-US would start every flow in inches).
  const context = await browser.newContext({ viewport, locale: 'en-GB' });
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
export async function eventually(check, message, timeoutMs = 3000) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) assert(false, message);
    await new Promise((r) => setTimeout(r, 50));
  }
}

export const storage = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

export const storedSettings = async (page) =>
  JSON.parse((await storage(page, 'libell.settings')) ?? '{}');

export const lamps = async (page) =>
  (await page.locator('.indicators__lamp:visible').allTextContents()).map((text) => text.trim());

export const boxPage = (page) => page.locator('.sensor-status-page.is-visible');

export const button = (scope, text) =>
  scope.locator('button:visible').filter({ hasText: text }).first();

/** Connect the only box the list offers and open its own page. */
export async function connectAndOpenBox(page, name) {
  await page.click('.sensor-status');
  const list = page.locator('.menu-page.is-visible').first();
  await button(list, 'Connect').click();
  await list.getByText('Connected', { exact: true }).waitFor();
  await button(list, name).click();
  await boxPage(page).waitFor();
  await boxPage(page).getByText('Connected · battery 62 %').waitFor();
}

export async function closeAllPages(page) {
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

/** Open Settings on one of its tabs. */
export async function openSettingsTab(page, tab) {
  await page.click('#settings-button');
  await page.locator(`.menu-page.is-visible [role=tab][data-tab=${tab}]`).click();
  return page.locator('.menu-page.is-visible').first();
}

// ?demo's fixed tilt, in degrees (`DEMO_TILT_DEG` in src/app/demoSensor.ts).
export const DEMO_ROLL = -1.2;

export const DEMO_PITCH = -0.35;

export const near = (a, b) => Math.abs(a - b) < 0.01;

export const wizard = (page) => page.locator('.onboarding');

/** Tap the wizard's Next until the step titled `heading` shows. */
export async function nextUntil(page, heading) {
  for (let step = 0; step < 15; step += 1) {
    const title = await wizard(page).locator('.onboarding__title').textContent();
    if (title.startsWith(heading)) return;
    await button(wizard(page), /^Next$/).click();
    await page.waitForTimeout(100);
  }
  assert(false, `the wizard never reached "${heading}"`);
}

/** Stands in for WebAudio: counts contexts and resumes, and records every
 * tone by its frequency when it starts. */
export function fakeAudio() {
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

export const audioLog = (page) => page.evaluate(() => window.__audio);

/** Close a page opened by `openApp`, failing if it threw along the way. */
export async function closeClean({ context, errors }) {
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

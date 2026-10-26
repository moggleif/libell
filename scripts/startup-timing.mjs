// Start-up timing (ADR 0024): serves the built app (dist/) and measures how
// long a cold start in ?demo takes until the level screen stands, on a CPU
// slowed four times like a mid-range phone. Prints the median of several
// runs; each PR that changes what loads at start reports it before and after.
// Not a CI gate: timings vary too much between machines.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { basePath } from './basePath.ts';

const PORT = 4176;
const APP_URL = `http://localhost:${PORT}${basePath()}?demo=1`;
const RUNS = 7;
const CPU_SLOWDOWN = 4;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function waitForServer() {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fetch(APP_URL);
      return;
    } catch {
      if (attempt > 40) throw new Error('vite preview did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

/** One cold start in a fresh context, in ms from navigation to the level screen. */
async function coldStart(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await page.goto(APP_URL);
  await page.waitForSelector('.rv-diagram svg', { timeout: 30_000 });
  const ms = await page.evaluate(() => performance.now());
  await context.close();
  return ms;
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});
let browser;
try {
  await waitForServer();
  // CHROMIUM_PATH overrides the browser binary, as in the smoke test.
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const runs = [];
  for (let run = 0; run < RUNS; run += 1) runs.push(await coldStart(browser));
  const list = runs.map((ms) => ms.toFixed(0)).join(', ');
  console.log(`cold start to level screen, CPU ×${CPU_SLOWDOWN}: ${list} ms`);
  console.log(`median: ${median(runs).toFixed(0)} ms`);
} finally {
  await browser?.close();
  preview.kill();
}

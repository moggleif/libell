// Start-up timing (ADR 0024): serves the built app (dist/) and measures how
// long a cold start in ?demo takes until the level screen stands, on a CPU
// slowed four times like a mid-range phone. Prints the median of several
// runs; each PR that changes what loads at start reports it before and after.
// Not a CI gate: timings vary too much between machines.
import { withPreview } from './withPreview.mjs';

const PORT = 4176;
const RUNS = 7;
const CPU_SLOWDOWN = 4;

/** One cold start in a fresh context, in ms from navigation to the level screen. */
async function coldStart(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await page.goto(`${url}?demo=1`);
  await page.waitForSelector('.rv-diagram svg', { timeout: 30_000 });
  const ms = await page.evaluate(() => performance.now());
  await context.close();
  return ms;
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

await withPreview(PORT, async (browser, url) => {
  const runs = [];
  for (let run = 0; run < RUNS; run += 1) runs.push(await coldStart(browser, url));
  const list = runs.map((ms) => ms.toFixed(0)).join(', ');
  console.log(`cold start to level screen, CPU ×${CPU_SLOWDOWN}: ${list} ms`);
  console.log(`median: ${median(runs).toFixed(0)} ms`);
});

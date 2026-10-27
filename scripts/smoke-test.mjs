// Smoke test: serves the built app (dist/) and asserts that the level
// screen actually renders in ?demo mode — diagram SVG present, status
// line non-empty, version footer sane. Run after `npm run build`; CI
// runs it on every pull request. Exits non-zero on any failed assertion.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPreview } from './withPreview.mjs';

const swPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'sw.js');

function assert(condition, message) {
  if (!condition) throw new Error(`smoke test failed: ${message}`);
}

await withPreview(4174, async (browser, appUrl) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-GB' });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${appUrl}?demo=1`);

  await page.waitForSelector('.rv-diagram svg', { timeout: 10_000 });
  // The status row is deliberately silent when the wheel cards already say
  // it (#252) — in ?demo's fixed tilt they do — so what is asserted here is
  // that it stays out of the way, not that it speaks.
  const statusRow = await page.$('.status-line');
  const status = (await page.textContent('.status-line'))?.trim() ?? '';
  assert(
    status === '' && (await statusRow.isHidden()),
    `status line should be silent and hidden when the wheels say it all, got "${status}"`,
  );
  // Modern (the default appearance) shows per-wheel status only in the
  // floating wheel cards — no on-body SVG marker (#161 follow-up).
  const cards = await page.locator('.wheel-card').count();
  assert(cards === 4, `expected 4 wheel cards, got ${cards}`);
  // The markers fill in on the first demo frame, a moment after the diagram
  // appears, so wait for them rather than read them at once (#746).
  await page
    .waitForFunction(
      () => [...document.querySelectorAll('.wheel-card__marker')].some((m) => m.textContent),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});
  const glyphs = (await page.locator('.wheel-card__marker').allTextContents()).join('');
  assert(glyphs.length > 0, 'wheel card glyphs are empty');
  const lamps = await page.locator('.indicators__lamp:visible').count();
  assert(lamps === 0, `demo mode shows ${lamps} warning lamp(s) — it should present as configured`);
  assert(pageErrors.length === 0, `page errors: ${pageErrors.join('; ')}`);

  await assertNewWorkerTakesOver(page);

  console.log(`smoke test passed — glyphs: ${glyphs}, status row silent, update reloads`);
});

/**
 * A new deployment must reach an open app: the worker controls the first
 * visit, and a changed worker takes over at once so the page reloads into it,
 * rather than waiting until every window is closed (#749).
 */
async function assertNewWorkerTakesOver(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  const controlled = await page
    .waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
      timeout: 10_000,
    })
    .then(
      () => true,
      () => false,
    );
  assert(controlled, 'the service worker does not control the first visit (clientsClaim)');

  await page.evaluate(() => {
    window.beforeUpdate = true;
  });
  const original = readFileSync(swPath, 'utf8');
  try {
    // A same-length change keeps the preview server's size header true.
    writeFileSync(swPath, original.replace('sw.js.map', 'sw.js.maq'));
    const reloaded = page.waitForNavigation({ timeout: 15_000 }).then(
      () => true,
      () => false,
    );
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
    assert(
      await reloaded,
      'a new service worker waits instead of reloading the open app (skipWaiting)',
    );
    assert(!(await page.evaluate(() => window.beforeUpdate)), 'the page did not reload');
  } finally {
    writeFileSync(swPath, original);
  }
}

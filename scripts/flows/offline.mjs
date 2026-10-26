// Offline (R62, ADR 0024): once the app has been opened with a connection,
// it starts with no signal, and the parts that load after the first screen
// open the first time from the precache.
import { assert, closeClean, openApp } from './harness.mjs';

export async function offlineFlow(browser) {
  const app = await openApp(browser, 'demo');
  const { page, context } = app;
  await page.waitForSelector('.rv-diagram svg');
  // The worker has precached everything once it is ready; it controls the
  // page from the next load on.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector('.rv-diagram svg');
  const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
  assert(controlled, 'the service worker should control the page after a reload');

  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.rv-diagram svg');
  await page.locator('#help-button').click();
  await page.locator('[data-tab="privacy"]').click();
  await page.locator('.stored-data').waitFor();
  await page.goBack();
  await page.locator('#settings-button').click();
  await page.locator('.menu-page.is-visible [role=tab]').first().waitFor();
  await closeClean(app);
}

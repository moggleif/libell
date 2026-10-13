import {
  assert,
  boxPage,
  button,
  closeAllPages,
  eventually,
  openApp,
  openSettingsTab,
  storage,
} from './harness.mjs';

export async function settingsBoxFlow(browser) {
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

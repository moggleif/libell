import {
  assert,
  audioLog,
  button,
  closeAllPages,
  eventually,
  fakeAudio,
  lamps,
  nextUntil,
  openApp,
  openSettingsTab,
  wizard,
} from './harness.mjs';

// A save from Settings or from the wizard reaches the rest of the app:
// the lamps follow it, sound is unlocked by it, and the mute button's
// change shows when Settings opens again.
export async function settingsSaveFlow(browser) {
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

import {
  DEMO_PITCH,
  DEMO_ROLL,
  assert,
  button,
  closeAllPages,
  eventually,
  near,
  openApp,
  openSettingsTab,
  storage,
} from './harness.mjs';

export async function phoneCalibrationFlow(browser) {
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

export async function phoneCheckOffFlow(browser) {
  // A calibration and zero taken elsewhere: the demo tilt now reads as off,
  // and the vehicle zero's advice is to zero again, not to recalibrate (#506).
  const level = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const { context, page, errors } = await openApp(browser, 'demo', {
    'libell.calibration': level,
    'libell.vehicleCalibration': level,
  });
  const settings = await openSettingsTab(page, 'calibration');
  await button(settings, 'Zeroed (today)').click();
  await settings.locator('summary:visible').filter({ hasText: 'More' }).click();
  await button(settings, 'Check').click();
  await settings.getByText('Off by 1.2° — consider zeroing again.').waitFor();
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

export async function targetsFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo');
  const settings = await openSettingsTab(page, 'targets');

  // Saving a target stores the tilt relative to the zero (none here).
  // The name is asked for only once the button is tapped (#613).
  await button(settings, 'Save current tilt as new target').click();
  await settings.locator('.name-prompt__input:visible').fill('Ferry');
  await button(settings.locator('.name-prompt'), 'Save').click();
  await settings.locator('.choice__row-label').filter({ hasText: 'Ferry' }).waitFor();
  const [preset] = JSON.parse(await storage(page, 'libell.targetPresets'));
  assert(
    preset.name === 'Ferry' &&
      near(preset.offset.rollDeg, DEMO_ROLL) &&
      near(preset.offset.pitchDeg, DEMO_PITCH),
    `the preset should hold the demo tilt, got ${JSON.stringify(preset)}`,
  );

  // The field suggests the next free default name.
  await button(settings, 'Save current tilt as new target').click();
  await button(settings.locator('.name-prompt'), 'Save').click();
  await settings.locator('.choice__row-label').filter({ hasText: 'Target 1' }).waitFor();

  // Selecting it stores it and shows the badge on the main screen.
  await button(settings, 'Ferry').click();
  assert(
    (await storage(page, 'libell.activeTarget')) === JSON.stringify(preset.id),
    'selecting a target should store it as active',
  );
  await closeAllPages(page);
  await page.locator('.target-badge:visible').filter({ hasText: 'Ferry' }).waitFor();

  await deleteActiveTarget(page, 'Ferry');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

/** Deleting the active target falls back to Normal, which the badge names
 * while another target is left to choose (#616). */
async function deleteActiveTarget(page, name) {
  await page.locator('.target-badge').click();
  const targets = page.locator('.menu-page.is-visible').first();
  await targets.locator(`.choice__row-delete[aria-label*="${name}"]`).click();
  await eventually(
    async () => JSON.parse(await storage(page, 'libell.targetPresets')).length === 1,
    'deleting a target should remove it from storage',
  );
  assert(
    (await storage(page, 'libell.activeTarget')) === null,
    'deleting the active target should fall back to Normal',
  );
  await closeAllPages(page);
  await page.locator('.target-badge:visible').filter({ hasText: 'Normal (level)' }).waitFor();
}

// A caravan's hitch height (#598): offered on the main screen while none is
// saved, saved relative to the zero (none here), then the jockey wheel leads
// back to it with its own badge until that badge ends it.
export async function hitchHeightFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo', {
    'libell.settings': JSON.stringify({ vehicleType: 'caravan' }),
  });
  const offer = page.locator('.hitch-offer');
  await offer.getByText('Save the hitch height first?').waitFor();
  await button(offer, 'Save').click();
  await offer.waitFor({ state: 'hidden' });
  const pitch = JSON.parse(await storage(page, 'libell.hitchPitch'));
  assert(near(pitch, DEMO_PITCH), `the hitch height should be the demo pitch, got ${pitch}`);

  const settings = await openSettingsTab(page, 'targets');
  await settings.getByText('A hitch height is saved.').waitFor();
  await button(settings, 'Back to hitch height').click();
  await settings.getByText('The main screen shows how far to crank the jockey wheel.').waitFor();
  await closeAllPages(page);
  // The demo still stands at the saved pitch, side tilt and all.
  await page.locator('.status-line').getByText('At hitch height').waitFor();
  assert(
    await page.locator('.target-badge').isHidden(),
    'the target badge should give way to the hitch height badge',
  );

  await page.locator('.hitch-badge').click();
  await page.locator('.hitch-badge').waitFor({ state: 'hidden' });
  await page.locator('.status-line').waitFor({ state: 'hidden' });

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

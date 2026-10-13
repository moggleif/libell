import {
  DEMO_PITCH,
  DEMO_ROLL,
  assert,
  button,
  eventually,
  lamps,
  near,
  nextUntil,
  openApp,
  storage,
  storedSettings,
  wizard,
} from './harness.mjs';

/** Tap Next to the end, then Done. */
async function finishWizard(page) {
  while ((await button(wizard(page), /^Next$/).count()) > 0) {
    await button(wizard(page), /^Next$/).click();
    await page.waitForTimeout(100);
  }
  await button(wizard(page), /^Done$/).click();
  await wizard(page).waitFor({ state: 'detached' });
}

export async function wizardPhoneFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'demo');
  // Demo never opens the wizard by itself; Help does.
  await page.click('#help-button');
  await button(page.locator('.menu-page.is-visible'), 'Show introduction').click();
  await nextUntil(page, 'Calibrate the phone');

  // Flip calibration hands its result back through the wizard's options.
  // The first tap captures, the second after the half turn.
  await button(wizard(page), 'Calibrate by flipping').click();
  await wizard(page).getByText('Now rotate the phone half a turn', { exact: false }).waitFor();
  await button(wizard(page), 'Capture').click();
  await wizard(page).getByText('Done! Your surface leans 0.0° — cancelled out.').waitFor();
  const calibration = JSON.parse(await storage(page, 'libell.calibration'));
  assert(
    near(calibration.rollDeg, DEMO_ROLL) && near(calibration.pitchDeg, DEMO_PITCH),
    `flip calibration should store the demo tilt, got ${JSON.stringify(calibration)}`,
  );

  await finishWizard(page);
  assert(
    (await storage(page, 'libell.onboardingDone')) === '1',
    'finishing the wizard should mark it done',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

/** The wizard's box path; `connect` decides whether a box is connected. */
export async function wizardBoxFlow(browser, connect) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim', {
    'libell.onboarded': null,
  });
  await nextUntil(page, 'How do you want to measure?');
  await wizard(page).getByText('Sensor box', { exact: true }).click();
  await nextUntil(page, 'Sensor box');
  if (connect) {
    await button(wizard(page), 'Connect').click();
    await wizard(page).getByText('Connected', { exact: true }).waitFor();
  }
  await nextUntil(page, "The box's position");
  if (connect) {
    await eventually(
      async () => (await wizard(page).textContent()).includes('Stands upright'),
      "the wizard should show the connected box's live position",
    );
  } else {
    await wizard(page).getByText('No box is connected yet', { exact: false }).waitFor();
  }
  await finishWizard(page);

  // A box chosen but not connected keeps the lamp asking for it (#365).
  assert(
    (await storage(page, 'libell.boxPending')) === (connect ? null : '1'),
    `the box should ${connect ? 'not ' : ''}be pending after the wizard`,
  );
  await eventually(
    async () => (await lamps(page)).includes('⚠ Zero'),
    'the lamp should ask for the box zero after the wizard',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// The wizard's box step is the same card as the box page, password and all.
export async function wizardPasswordFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim=badpassword', {
    'libell.onboarded': null,
  });
  await nextUntil(page, 'How do you want to measure?');
  await wizard(page).getByText('Sensor box', { exact: true }).click();
  await nextUntil(page, 'Sensor box');
  await button(wizard(page), 'Connect').click();
  // The verdict arrives after the connect; the step redraws live (#390).
  await wizard(page).getByText('Wrong password', { exact: true }).waitFor();
  const password = wizard(page).locator('.box-password');
  await password.waitFor();
  await password.locator('input').fill('1234');
  await button(password, '').click();
  await password.waitFor({ state: 'hidden' });
  await wizard(page).getByText('Connected', { exact: true }).waitFor();
  assert(
    (await storedSettings(page)).sensorDevices.xparkle.password === '1234',
    'a password typed in the wizard should be kept for later connects',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

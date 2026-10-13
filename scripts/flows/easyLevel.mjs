import {
  assert,
  boxPage,
  button,
  connectAndOpenBox,
  eventually,
  lamps,
  openApp,
  storage,
  storedSettings,
} from './harness.mjs';

export async function easyLevelFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'easylevel-sim');
  await connectAndOpenBox(page, 'EasyLevel');
  const box = boxPage(page);
  assert((await lamps(page)).includes('⚠ Zero'), 'connected EasyLevel should light ⚠ Zero');
  await eventually(
    async () => (await box.locator('.box-live').textContent()).includes('Lies flat'),
    'the live row should report the box lying flat',
  );

  await checkHealthAndDebug(page, box);
  await learnAndPickPlacement(page, box);
  await zeroAndForget(page, box);
  await disconnectToPhone(page, box);

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// Health and debug rows come from the box's own status struct.
async function checkHealthAndDebug(page, box) {
  await box.locator('summary').first().click();
  for (const row of [
    'Temperature: 21.5°C',
    'Device ID: easylevel-simulated-box',
    'Firmware tier: 3',
    'Raw status bytes: 66 08',
  ]) {
    await eventually(
      async () => (await box.locator('.sensor-status__debug').textContent()).includes(row),
      `debug info should include "${row}"`,
    );
  }

  // The connect-delay knob is stored straight into the settings.
  await box.locator('.sensor-status__debug input[type=checkbox]').check();
  const device = (await storedSettings(page)).sensorDevices.easylevel;
  assert(device.connectDelayEnabled === true, 'enabling the connect delay should be stored');
  await box.locator('summary').first().click();
}

// The learn guide reads the box and asks for the second lift.
async function learnAndPickPlacement(page, box) {
  await button(box, 'Not sure? Learn it by raising the front').click();
  await button(box, 'Learn the mounting').click();
  await button(box, 'The front is raised').click();
  await button(box, 'The right side is raised').waitFor();
  await button(box, 'Cancel').click();

  // Picking a placement stores it as picked.
  await button(box, 'Short side forward').click();
  await box.getByText('Direction set', { exact: false }).waitFor();
  const picked = (await storedSettings(page)).sensorDevices.easylevel;
  assert(
    picked.mountingPicked === true && picked.mounting !== undefined,
    `picking a placement should store it, got ${JSON.stringify(picked)}`,
  );
}

// Zero averages a short run of samples, then stores the box's reading.
async function zeroAndForget(page, box) {
  await button(box, 'Zero the vehicle').click();
  await button(box, 'Zero now').click();
  await box.getByText('Zeroed (today)').waitFor({ timeout: 5000 });
  const zero = JSON.parse(await storage(page, 'libell.installCalibration.easylevel'));
  assert(
    Math.abs(zero.rollDeg) > 0.1 && Math.abs(zero.rollDeg) < 15,
    `EasyLevel zero should be the box's own tilt, got ${JSON.stringify(zero)}`,
  );
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Zero'),
    'a zeroed box should clear ⚠ Zero',
  );

  // Forgetting the zero (a box that zeroes itself has no such link)
  // brings the lamp back.
  await button(box, 'Forget the zero').click();
  await eventually(
    async () => (await storage(page, 'libell.installCalibration.easylevel')) === null,
    'forgetting the zero should clear it from storage',
  );
  await eventually(
    async () => (await lamps(page)).includes('⚠ Zero'),
    'a forgotten zero should light ⚠ Zero again',
  );
}

// Disconnecting hands the readings back to the phone.
async function disconnectToPhone(page, box) {
  await button(box, 'Disconnect').click();
  await eventually(
    async () => (await storedSettings(page)).sensorSource === 'phone',
    'disconnect should pick the phone',
  );
  // The steps stay, greyed out, still showing what is set (#400).
  await button(box, 'Zero the vehicle').waitFor();
  assert(
    await button(box, 'Zero now').isDisabled(),
    'after Disconnect the zero step should be greyed out',
  );
}

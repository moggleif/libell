import {
  assert,
  boxPage,
  button,
  closeAllPages,
  connectAndOpenBox,
  eventually,
  lamps,
  openApp,
  storage,
  storedSettings,
} from './harness.mjs';

export async function xparkleFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim');
  await connectAndOpenBox(page, 'Xparkle RVS01');
  const box = boxPage(page);

  await checkConnectedAndPickDirection(page, box);
  await zeroAndReconnect(page, box);
  await fineTuneTheZero(page);

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// A connected box with no zero yet asks for one.
async function checkConnectedAndPickDirection(page, box) {
  assert((await lamps(page)).includes('⚠ Zero'), 'connected Xparkle should light ⚠ Zero');
  await eventually(
    async () => (await box.locator('.box-live').textContent()).includes('Stands upright'),
    'the live row should report the box standing upright',
  );
  assert(
    (await storage(page, 'libell.sensorDevice.xparkle')) === 'xparkle-simulated-box',
    'the connected device id should be remembered',
  );
  assert((await storedSettings(page)).sensorSource === 'xparkle', 'source should be remembered');

  // The learn guide is offered for this box.
  assert(
    (await button(box, 'Not sure? Learn it by raising the front').count()) === 1,
    'the Xparkle page should offer to learn the direction',
  );

  // Picking a direction stores the learned axis mapping.
  await box.locator('.mounting-picker__button--right').click();
  await box.getByText('Direction set: points to the right').waitFor();
  const mapping = (await storedSettings(page)).sensorDevices.xparkle.axisMapping;
  assert(
    JSON.stringify(mapping) === JSON.stringify({ swap: true, pitchSign: -1, rollSign: 1 }),
    `picking "right" should store its axis mapping, got ${JSON.stringify(mapping)}`,
  );
}

// Zero: the box zeroes itself and Libell stores a zero offset.
async function zeroAndReconnect(page, box) {
  await button(box, 'Zero the vehicle').click();
  await button(box, 'Zero now').click();
  await box.getByText('Zeroed (today)').waitFor();
  const zero = JSON.parse(await storage(page, 'libell.installCalibration.xparkle'));
  assert(zero.rollDeg === 0 && zero.pitchDeg === 0, `Xparkle zero should be 0/0, got ${zero}`);
  await eventually(
    async () => !(await lamps(page)).includes('⚠ Zero'),
    'a zeroed box should clear ⚠ Zero',
  );

  // Back on the main screen the box feeds the diagram.
  await closeAllPages(page);
  await page.locator('.rv-diagram svg').waitFor();
  assert(await page.locator('.app__hint').isHidden(), 'the waiting hint should be gone');

  // After a reload the remembered box reconnects silently.
  await page.reload();
  await page.locator('.rv-diagram svg').waitFor();
  await page.click('.sensor-status');
  await boxPage(page).getByText('Connected · battery 62 %').waitFor();
}

// #596: the zero is fine-tuned in Libell, per source, and a new zero clears it.
// The box's page is still open from the reconnect.
async function fineTuneTheZero(page) {
  const box = boxPage(page);
  await button(box, 'Zeroed (today)').click();
  await button(box, 'Left up').click();
  await box.getByText('Fine-tuned: Left +0.1°').waitFor();
  const trim = JSON.parse(await storage(page, 'libell.zeroTrim.xparkle'));
  assert(
    trim.rollDeg === -0.1 && trim.pitchDeg === 0,
    `"Left up" should store a −0.1° roll trim, got ${JSON.stringify(trim)}`,
  );
  assert((await storage(page, 'libell.zeroTrim.phone')) === null, 'the phone keeps no trim');
  await button(box, 'Zero again').click();
  await box.getByText('Not fine-tuned').waitFor();
  assert(
    (await storage(page, 'libell.zeroTrim.xparkle')) === null,
    'zeroing again should clear the fine adjustment',
  );
  await closeAllPages(page);
}

export async function xparklePasswordFlow(browser) {
  const { context, page, errors } = await openApp(browser, 'xparkle-sim=badpassword');
  await page.click('.sensor-status');
  const list = page.locator('.menu-page.is-visible').first();
  await button(list, 'Connect').click();
  await button(list, 'Xparkle RVS01').click();
  const box = boxPage(page);
  const password = box.locator('.box-password');
  await password.waitFor();
  await password.locator('input').fill('1234');
  await button(password, '').click();
  await password.waitFor({ state: 'hidden' });
  await box.getByText('Connected · battery 62 %').waitFor();
  assert(
    (await storedSettings(page)).sensorDevices.xparkle.password === '1234',
    'an accepted password should be kept for later connects',
  );
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

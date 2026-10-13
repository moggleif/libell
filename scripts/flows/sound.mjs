import {
  assert,
  audioLog,
  button,
  closeAllPages,
  eventually,
  fakeAudio,
  openApp,
  openSettingsTab,
  storedSettings,
} from './harness.mjs';

const CHIME = [880, 1174.7];

// The mute button, the audio unlock, the guidance pulse and the chime.
export async function soundFlow(browser) {
  const flat = JSON.stringify({ rollDeg: 0, pitchDeg: 0, capturedAt: Date.now() });
  const { context, page, errors } = await openApp(
    browser,
    'demo',
    {
      'libell.calibration': flat,
      'libell.settings': JSON.stringify({ soundOnLevel: true, soundGuidance: true }),
    },
    undefined,
    fakeAudio,
  );
  await page.locator('.rv-diagram').first().waitFor();
  const sound = page.locator('#sound-button');
  assert((await sound.getAttribute('aria-label')) === 'Mute sound', 'sound should start unmuted');
  assert(await page.locator('#sound-icon-mute').isHidden(), 'the mute icon should start hidden');

  // No sound before a gesture unlocks it.
  await page.waitForTimeout(500);
  assert((await audioLog(page)).created === 0, 'audio should wait for a user gesture');

  // The first tap anywhere unlocks audio, so the chime works after a
  // plain reload (#396).
  await page.locator('.rv-diagram').first().click();
  const tapped = await audioLog(page);
  assert(tapped.created === 1 && tapped.resumed === 1, 'the first tap should unlock audio');

  await muteAndUnmute(page, sound);
  await guidanceThenChime(page);

  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  await context.close();
}

// Muting turns both sounds off and stores it, without touching audio.
async function muteAndUnmute(page, sound) {
  await sound.click();
  await eventually(async () => {
    const stored = await storedSettings(page);
    return stored.soundOnLevel === false && stored.soundGuidance === false;
  }, 'muting should store both sounds off');
  assert((await sound.getAttribute('aria-label')) === 'Unmute sound', 'muted label');
  assert(
    await sound.evaluate((b) => b.classList.contains('bottombar__button--muted')),
    'muted class',
  );
  assert(await page.locator('#sound-icon-waves').isHidden(), 'muted hides the waves');
  const muted = await audioLog(page);
  assert(muted.created === 1 && muted.resumed === 1, 'muting should not touch audio');

  // Unmuting restores both and resumes audio again.
  await sound.click();
  await eventually(async () => {
    const stored = await storedSettings(page);
    return stored.soundOnLevel === true && stored.soundGuidance === true;
  }, 'unmuting should restore both sounds');
  assert((await sound.getAttribute('aria-label')) === 'Mute sound', 'unmuted label');
  assert(await page.locator('#sound-icon-mute').isHidden(), 'unmuted hides the mute icon');
  const unlocked = await audioLog(page);
  assert(unlocked.created === 1 && unlocked.resumed === 2, 'unmuting should resume audio');
}

// Off level, the guidance pulses play.
async function guidanceThenChime(page) {
  await eventually(
    async () => (await audioLog(page)).tones.length > 0,
    'guidance should pulse while off level',
    5000,
  );
  assert(
    (await audioLog(page)).tones.every((hz) => !CHIME.includes(hz)),
    'no chime before level',
  );

  // Level after the zero: the chime plays its two tones.
  await page.waitForTimeout(3000);
  const settings = await openSettingsTab(page, 'calibration');
  await button(settings, 'Zero now').click();
  await settings.getByText('Zeroed (today)').waitFor();
  await closeAllPages(page);
  await page.locator('.level-overlay.is-visible').waitFor({ timeout: 5000 });
  const tones = (await audioLog(page)).tones;
  const at = tones.indexOf(CHIME[0]);
  assert(at >= 0 && tones[at + 1] === CHIME[1], `the chime should play, got ${tones.join(', ')}`);
}

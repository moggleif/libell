import { BASE, assert, closeClean, openApp, openSettingsTab } from './harness.mjs';

// The language the app starts in: the stored choice, else the phone's, and a
// change in Settings reloads into the new one (#708 pins these before the
// dictionaries load one at a time).
export async function languageFlow(browser) {
  await storedChoiceScenario(browser);
  await phoneLanguageScenario(browser, 'de-DE', 'de', 'Einstellungen');
  await phoneLanguageScenario(browser, 'ja-JP', 'en', 'Settings');
  await changeInSettingsScenario(browser);
}

const settingsLabel = (page) => page.locator('#settings-button').getAttribute('aria-label');

/** Waits for the level screen, then checks the page speaks `lang`. */
async function assertSpeaks(page, lang, label, why) {
  await page.waitForSelector('.rv-diagram svg');
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  assert(htmlLang === lang, `${why}: <html lang> should be ${lang}, got ${htmlLang}`);
  const shown = await settingsLabel(page);
  assert(shown === label, `${why}: Settings should read "${label}", got "${shown}"`);
}

async function storedChoiceScenario(browser) {
  const app = await openApp(browser, 'demo', { 'libell.language': 'sv' });
  await assertSpeaks(app.page, 'sv', 'Inställningar', 'a stored Swedish choice');
  await closeClean(app);
}

/** Nothing stored: the phone's language decides, an unshipped one gives English. */
async function phoneLanguageScenario(browser, locale, lang, label) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('libell.onboarded', '1');
    localStorage.setItem('libell.counting', 'off');
  });
  await page.goto(`${BASE}?demo`);
  await assertSpeaks(page, lang, label, `a phone in ${locale}`);
  await closeClean({ context, errors });
}

async function changeInSettingsScenario(browser) {
  const app = await openApp(browser, 'demo');
  const { page } = app;
  await assertSpeaks(page, 'en', 'Settings', 'a stored English choice');
  const general = await openSettingsTab(page, 'general');
  const reloaded = page.waitForEvent('load');
  await general.locator('select:visible').first().selectOption('fr');
  await reloaded;
  await assertSpeaks(page, 'fr', 'Réglages', 'after choosing Français in Settings');
  await closeClean(app);
}

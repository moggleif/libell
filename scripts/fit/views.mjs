// Every view the fit test opens for one screen, appearance and language.
import { BASE, PORT, openPrivacyTab, openWithSettings } from '../fitOpen.mjs';
import { auditView } from './auditView.mjs';
import { LEVEL9, TIGHTEST } from './config.mjs';
import { checkLevelScreen } from './levelScreen.mjs';
import { countCheck, fail } from './report.mjs';
import { checkWizard } from './wizard.mjs';

/** Opens the app with the given preferences already stored. */
export function open(context, appearance, language, options) {
  return openWithSettings(context, BASE, { appearance, language, ...options });
}

/** A level view with these settings, opened and checked. */
async function levelVariant(context, run, view, options) {
  const page = await open(context, run.appearance, run.language, { query: '?demo=1', ...options });
  await page.waitForSelector('.rv-diagram svg');
  await checkLevelScreen(page, run.at(view), { fitsWhole: run.viewport.fitsWhole });
  await auditView(page, run.at(view));
  return page;
}

/** Every level view; returns the plain one, still open. */
async function checkLevelViews(context, run) {
  // `?demo` replaces the sensor with a fixed tilt and presents the app as
  // configured, which is the only way to reach this view on a machine with
  // no motion sensor.
  const level = await levelVariant(context, run, 'level', {});

  // The caravan's level view (#368): its own drawing, and in Modern its
  // own wheel cards, jockey card included.
  await (await levelVariant(context, run, 'caravan level', { vehicleType: 'caravan' })).close();

  // An adjustable kloss (#687): its line above the vehicle takes height
  // from the drawing, in every language's longest sentence.
  const adjustable = await levelVariant(context, run, 'adjustable kloss level', { ramp: LEVEL9 });
  const line = adjustable.locator('.adjustable-line');
  if (await line.isHidden()) fail(run.at('adjustable kloss level'), 'no line above the vehicle');
  await adjustable.close();

  // Inches (#627): "1 ⅜ in" is the widest a wheel card's lift gets, so
  // both drawings are walked once more in that unit.
  for (const vehicleType of ['motorhome', 'caravan']) {
    const view = `${vehicleType} level, inches`;
    await (await levelVariant(context, run, view, { vehicleType, displayUnit: 'in' })).close();
  }
  return level;
}

/** Runs in the page: opens Settings' Ramps tab; false if there is none. */
function clickRampsTab() {
  const tab = [...document.querySelectorAll('.settings__tab')].find(
    (t) => t.getAttribute('data-tab') === 'ramps',
  );
  if (!tab) return false;
  tab.click();
  return true;
}

/** Runs in the page: whether the ramp picker is open, and how far the page scrolls. */
function measureRampsTab() {
  const page = document.querySelector('.menu-page:not([hidden])');
  const picker = document.querySelector('.klossar__picker-details');
  return {
    pickerOpen: picker ? picker.open : null,
    scrollBy: page ? page.scrollHeight - page.clientHeight : 0,
  };
}

/**
 * The Ramps tab specifically, which is meant to fit one screen with its
 * picker collapsed (#246): what is set, its step heights and the ramp
 * count, all without scrolling. That is the point of collapsing the
 * picker, so it is checked rather than left to hold by luck — a longer
 * hint or one more setting would otherwise take it back silently.
 */
async function checkRampsTab(level, run) {
  if (!(await level.evaluate(clickRampsTab))) {
    fail(run.at('ramps tab'), 'could not reach the Ramps tab to check that it fits');
    return;
  }
  await level.waitForTimeout(250);
  const overflow = await level.evaluate(measureRampsTab);
  if (overflow.pickerOpen !== false) {
    fail(run.at('ramps tab'), 'the ramp picker is not collapsed by default');
  } else if (overflow.scrollBy > 0) {
    fail(
      run.at('ramps tab'),
      `does not fit one screen with the picker collapsed — scrolls by ${Math.round(
        overflow.scrollBy,
      )}px`,
    );
  }
  countCheck();
}

/** Settings, then Help and its Privacy tab, from the level view; closes it. */
async function checkSettingsAndHelp(level, run) {
  // Settings: a page in Modern, a drawer in Classic.
  await level.locator('#settings-button').click();
  await auditView(level, run.at('settings'));

  // Held to every phone that is meant to fit whole: with the Save row
  // (#328) and the Advanced block (#329) gone, it fits the SE in every
  // language too. The 320x480 floor only promises reachability. Modern
  // only; Classic splits these settings across drawer sub-pages with no
  // tab bar.
  if (run.viewport.fitsWhole && run.appearance === 'modern') await checkRampsTab(level, run);

  // Reload rather than closing: a page's own ✕ goes through history.back(), which from a
  // freshly-loaded page can leave the app; a test must not depend on the history stack.
  await level.reload();
  await level.waitForSelector('.rv-diagram svg');

  // Help / info, the longest scrolling page in the app.
  await level.locator('#help-button').click();
  await auditView(level, run.at('help'));
  await openPrivacyTab(level);
  await auditView(level, run.at('privacy'));
  await level.close();
}

/** The external sensor page, via the simulated box. */
async function checkExternalSensor(context, run) {
  const sim = await open(context, run.appearance, run.language, {
    query: '?demo=1&easylevel-sim',
  });
  await sim.waitForSelector('.rv-diagram svg');
  const sensorButton = sim.locator('#sensor-slot button');
  if ((await sensorButton.count()) > 0) {
    await sensorButton.click();
    await auditView(sim, run.at('external sensor'));
  }
  await sim.close();
}

/**
 * Runs in the page, with Settings open: presses the vehicle's share button
 * and returns the link it would have copied, or null. Walks whatever tabs
 * or sub-pages this appearance shows until the vehicle section, and its
 * share button, is on screen: Modern lays the sections out as tabs on one
 * page; Classic's drawer lists them as items that each open their own page.
 */
async function findShareUrl() {
  let captured = null;
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async (text) => void (captured = text) },
    configurable: true,
  });
  const findButton = () => document.querySelector('.settings__share-vehicle');
  if (!findButton()) {
    const steps = [...document.querySelectorAll('.settings__tab, .menu__item')];
    for (const step of steps) {
      step.click();
      await new Promise((r) => setTimeout(r, 120));
      if (findButton()) break;
    }
  }
  const button = findButton();
  if (!button) return null;
  button.click();
  await new Promise((r) => setTimeout(r, 300));
  return captured;
}

/**
 * Incoming vehicle setup, reached the way a real one is: the share link
 * this app itself produces, opened fresh. Walked on the tightest screen
 * only: reaching it costs a page load, a settings walk and a navigation,
 * and it is a small centred dialog whose content does not change with the
 * screen around it — if it fits there it fits anywhere, and every language
 * still passes through.
 */
async function checkIncomingSetup(context, run) {
  const sharer = await open(context, run.appearance, run.language, { query: '?demo=1' });
  await sharer.waitForSelector('.rv-diagram svg');
  // The vehicle-setup link comes from Settings, not the top bar's share
  // button (which shares the app itself).
  await sharer.locator('#settings-button').click();
  await sharer.waitForTimeout(300);
  const shareUrl = await sharer.evaluate(findShareUrl);
  if (shareUrl && shareUrl.includes('#setup=')) {
    await sharer.goto(shareUrl.replace(/^https?:\/\/[^/]+/, `http://localhost:${PORT}`));
    await sharer.waitForTimeout(500);
    await auditView(sharer, run.at('incoming setup'));
  } else {
    fail(run.at('incoming setup'), 'could not produce a share link to open the view with');
  }
  await sharer.close();
}

/** Every view for one screen, appearance and language, in `context`. */
export async function walkViews(context, viewport, appearance, language) {
  const at = (view) => `${viewport.name} / ${appearance} / ${language} / ${view}`;
  const run = { viewport, appearance, language, at };

  const level = await checkLevelViews(context, run);
  await checkSettingsAndHelp(level, run);
  await checkExternalSensor(context, run);
  if (viewport === TIGHTEST) await checkIncomingSetup(context, run);

  // The first-run guide, the one view that opens on its own when nothing
  // has been stored yet.
  const wizard = await open(context, appearance, language, { onboarded: false });
  await checkWizard(wizard, at('guide'), { fitsWhole: viewport.fitsWhole });
  await wizard.close();
}

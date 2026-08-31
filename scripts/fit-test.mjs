// Fit test (#239, #241, #243): Libell has to fit a phone screen. Every
// view is opened against small-phone viewports, in both appearances and
// all five languages, and checked for the ways a layout stops fitting —
// content below the fold, a page that scrolls sideways, something that
// cannot be reached at all.
//
// It exists because the unit tests cannot catch any of this: they run in
// happy-dom, which has no layout engine, so every height and width they
// measure is zero, and a view that overflows an iPhone by 300 px passes
// them happily.
//
// Two kinds of check, because one browser cannot see everything:
//
//   * Runtime, below: what Chromium can measure — overflow, reachability,
//     the level view's geometry, each guide step's fit.
//   * Static, at the end: the one rule Chromium *cannot* reproduce. On iOS
//     a `position: fixed; inset: 0` box is laid out against the
//     toolbar-free LARGE viewport while `window.innerHeight` is the small
//     one, so the bottom of such a box sits behind Safari's bar with
//     nothing to scroll. In Chromium the two viewports are identical and
//     the bug is invisible, so the rule is enforced against the
//     stylesheet instead.
//
// Run after `npm run build`; CI runs it on every branch. Exits non-zero
// on anything that does not fit.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4175;
const BASE = `http://localhost:${PORT}/libell/`;

// Every shipped language: German and French wrap to more lines, and run
// wider on a button, than the English — a view that fits in one language
// can overflow in another.
const LANGUAGES = ['sv', 'en', 'fr', 'es', 'de'];

// The longest of them, and the one that has caught every language-related
// failure so far; English is the baseline to compare it against.
const LONGEST = ['de', 'en'];

// CSS pixels actually visible to the page, not the phone's spec sheet:
// Safari's own toolbars take ~114 px of an iPhone SE and ~107 px of an
// iPhone 15. 320 px wide is the narrowest phone still in use and the one
// that catches horizontal overflow; the SE in Safari is the tightest
// height anyone can install this on. Anything taller or wider than the
// iPhone 15 in Safari is strictly more room.
//
// `fitsWhole` is the stricter promise — every view fits with no scrolling
// at all — and it is made for the phones this app actually targets. The
// 320x480 entry is an iPhone 5 / SE-1 in Safari: it is here for the
// horizontal checks, which is where a 320px screen bites, and it still
// gets every reachability check; it is simply not held to fitting the
// longest German guide step without scrolling its body, which on that
// screen would mean type too small to read. Its controls stay pinned
// either way — that is what R18 guarantees everywhere.
//
// `languages` is per viewport rather than the whole list everywhere,
// because the language dimension is not equally informative at every
// size: it exists to catch text that runs longer than the space it has,
// and the space is tightest on the SE, so that is where all five are
// walked. The 320px entry is about width, where German is the worst case
// and English the baseline. The roomiest screen is a sanity check that
// nothing breaks when there is more room, not a place where text
// overflows — one language is enough to notice a structural break.
// Together this is 8 language-runs per appearance instead of 15, without
// giving up a combination that has ever failed.
const VIEWPORTS = [
  { name: '320x480', width: 320, height: 480, fitsWhole: false, languages: LONGEST },
  { name: 'iPhone SE, Safari', width: 375, height: 553, fitsWhole: true, languages: LANGUAGES },
  { name: 'iPhone 15, Safari', width: 393, height: 745, fitsWhole: true, languages: ['de'] },
];
const TIGHTEST = VIEWPORTS[1];

// Classic and Modern build different DOM for the same content, and
// Classic's settings is a drawer where Modern's is a page.
const APPEARANCES = ['classic', 'modern'];

// The real keys settingsStore.ts reads — settings as one JSON object,
// language and the onboarding flag on their own. Writing anything else
// (a made-up ".v1" suffix, say) silently leaves every run on the
// defaults, which would quietly reduce this whole sweep to one
// combination tested many times over.
const SETTINGS_KEY = 'libell.settings';
const LANGUAGE_KEY = 'libell.language';
const ONBOARDED_KEY = 'libell.onboarded';

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Every container that covers the screen in its own right. Anything open
// gets the reachability checks below, and each is held to the iOS rule at
// the end of this file.
const VIEW_CONTAINERS = ['.menu-page', '.onboarding', '.menu', '.incoming-setup'];

const failures = [];
let checked = 0;

function fail(label, what) {
  failures.push(`${label} | ${what}`);
}

/**
 * The checks that apply to every view, whatever it contains: the page
 * never moves sideways, nothing sits outside the screen it is drawn on,
 * and anything that scrolls can be scrolled to its end.
 */
async function auditView(page, label) {
  await page.waitForTimeout(250);
  const r = await page.evaluate((selectors) => {
    const de = document.documentElement;
    const open = selectors
      .flatMap((s) => [...document.querySelectorAll(s)])
      .filter((e) => !e.hidden && e.getBoundingClientRect().height > 0);

    // Content inside a deliberate horizontal scroller (a tab strip) is
    // meant to overflow — that is what makes it swipeable — so it is not
    // a defect. Anything else wider than its container is.
    const inScroller = (el, stopAt) => {
      for (let p = el.parentElement; p && p !== stopAt; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
      return false;
    };

    const containers = open.map((el) => {
      const box = el.getBoundingClientRect();
      // Scroll to the end and see whether the last thing in the view
      // actually comes into sight.
      const before = el.scrollTop;
      el.scrollTop = el.scrollHeight;
      const last = el.lastElementChild?.getBoundingClientRect();
      const lastBottomAtEnd = last ? last.bottom : null;
      el.scrollTop = before;

      const wide = [...el.querySelectorAll('*')]
        .filter((n) => {
          const nb = n.getBoundingClientRect();
          return nb.width > 0 && nb.right > box.left + el.clientWidth + 0.5 && !inScroller(n, el);
        })
        .map((n) => `${n.tagName.toLowerCase()}.${(n.getAttribute('class') ?? '').split(' ')[0]}`);

      return {
        cls: el.className.split(' ')[0],
        bottom: box.bottom,
        lastBottomAtEnd,
        wide: [...new Set(wide)].slice(0, 3),
      };
    });

    return {
      pageSideways: de.scrollWidth - de.clientWidth,
      innerHeight: window.innerHeight,
      containers,
    };
  }, VIEW_CONTAINERS);
  checked += 1;

  if (r.pageSideways > 0) {
    fail(label, `the page scrolls sideways by ${Math.round(r.pageSideways)}px`);
  }
  for (const c of r.containers) {
    if (c.bottom > r.innerHeight + 0.5) {
      fail(label, `${c.cls} extends ${Math.round(c.bottom - r.innerHeight)}px past the screen`);
    }
    if (c.lastBottomAtEnd !== null && c.lastBottomAtEnd > r.innerHeight + 0.5) {
      fail(
        label,
        `${c.cls}: scrolled to the end, its last content is still ` +
          `${Math.round(c.lastBottomAtEnd - r.innerHeight)}px below the screen`,
      );
    }
    if (c.wide.length > 0) {
      fail(label, `${c.cls}: ${c.wide.join(', ')} overflow it horizontally`);
    }
  }
}

/**
 * The level view on top of that: it is the one view that must fit whole,
 * with nothing below the fold and no scrolling at all, and its diagram
 * has to keep the drawing's proportions with each wheel card still
 * sitting on the wheel it describes (#241).
 */
async function checkLevelScreen(page, label, { fitsWhole = true } = {}) {
  await page.waitForSelector('.rv-diagram svg');
  // The bubble settles and the wheel cards fill in after the first frame.
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => {
    const svg = document.querySelector('.rv-diagram svg');
    const box = document.querySelector('.rv-diagram').getBoundingClientRect();
    const footer = document.querySelector('.site-footer');
    const bottombar = document.querySelector('.bottombar');
    const vb = svg.viewBox.baseVal;

    // Where each wheel actually is on screen, straight from the SVG's own
    // transform — the drawing is the authority, not any assumption about
    // how it was laid out.
    const ctm = svg.getScreenCTM();
    const screenY = (y) => {
      const p = svg.createSVGPoint();
      p.x = 0;
      p.y = y;
      return p.matrixTransform(ctm).y;
    };
    // Each card carries its wheel's y in the drawing's own coordinates
    // (rvDiagram.ts), so the expected position is read off the drawing
    // rather than hardcoded here.
    const cards = [...document.querySelectorAll('.wheel-card')].map((card) => {
      const r = card.getBoundingClientRect();
      return {
        centre: r.top + r.height / 2,
        left: r.left,
        right: r.right,
        top: r.top,
        wheelY: card.dataset.wheelY === undefined ? null : Number(card.dataset.wheelY),
      };
    });

    return {
      pageOverflow: document.documentElement.scrollHeight - window.innerHeight,
      innerHeight: window.innerHeight,
      footerBottom: footer ? footer.getBoundingClientRect().bottom : null,
      bottombarBottom: bottombar ? bottombar.getBoundingClientRect().bottom : null,
      // The drawing's own top and bottom on screen: the box around it is
      // deliberately wider than the drawing (the wheel cards live in that
      // margin), so the box's shape says nothing — where the drawing
      // actually lands does.
      drawingTop: screenY(0),
      drawingBottom: screenY(vb.height),
      boxTop: box.top,
      boxBottom: box.bottom,
      cards,
      wheelScreenYs: cards.map((c) => (c.wheelY === null ? null : screenY(c.wheelY))),
    };
  });

  if (fitsWhole && result.pageOverflow > 0) {
    fail(label, `level view: the page scrolls by ${Math.round(result.pageOverflow)}px`);
  }
  for (const [name, bottom] of [
    ['action bar', result.bottombarBottom],
    ['version footer', result.footerBottom],
  ]) {
    if (fitsWhole && bottom !== null && bottom > result.innerHeight + 0.5) {
      fail(
        label,
        `level view: the ${name} is ${Math.round(bottom - result.innerHeight)}px below the fold`,
      );
    }
  }
  // The whole of #241: the drawing used to be taller than the space it was
  // given, which is what pushed everything below it off the screen.
  if (result.drawingTop < result.boxTop - 0.5 || result.drawingBottom > result.boxBottom + 0.5) {
    fail(
      label,
      `level view: the drawing overflows its box by ${Math.round(
        Math.max(result.boxTop - result.drawingTop, result.drawingBottom - result.boxBottom),
      )}px`,
    );
  }
  // Wheel cards, where the appearance has them: on their wheel, and never
  // overlapping each other.
  if (result.cards.length > 0) {
    result.cards.forEach((card, i) => {
      const expected = result.wheelScreenYs[i];
      if (expected === null) {
        fail(label, `level view: wheel card ${i + 1} carries no wheel position to check against`);
        return;
      }
      const drift = Math.abs(card.centre - expected);
      if (drift > 1.5) {
        fail(label, `level view: wheel card ${i + 1} is ${Math.round(drift)}px off its wheel`);
      }
    });
    const rows = new Map();
    for (const card of result.cards) {
      const row = Math.round(card.top);
      rows.set(row, [...(rows.get(row) ?? []), card]);
    }
    for (const pair of rows.values()) {
      if (pair.length === 2) {
        const [a, b] = pair.sort((x, y) => x.left - y.left);
        if (a.right > b.left) {
          fail(
            label,
            `level view: the two wheel cards overlap by ${Math.round(a.right - b.left)}px`,
          );
        }
      }
    }
  }
}

/**
 * The first-run guide: every step has to fit whole, and Back/Skip/Next are
 * never allowed to leave the screen (#239). With `external`, the
 * sensor-source step's second radio is picked as that step comes up — the
 * only way to reach the external path, since the radios do not exist until
 * that step renders.
 */
async function checkWizard(page, label, { external = false, fitsWhole = true } = {}) {
  await page.waitForSelector('.onboarding');
  // 12 is past the longest path (11 steps with an external sensor); the
  // loop stops on its own when the wizard closes.
  for (let step = 0; step < 12; step += 1) {
    if (external) {
      await page.evaluate(() => {
        const radios = [...document.querySelectorAll('input[name="onboarding-source"]')];
        const choice = radios[radios.length - 1];
        if (choice && !choice.checked) {
          choice.checked = true;
          choice.dispatchEvent(new Event('change'));
        }
      });
    }
    // The calibration steps fill in a live status line a tick after they
    // render, which makes them taller — measure after that has landed,
    // never the empty first frame.
    await page.waitForTimeout(200);
    const info = await page.evaluate(() => {
      const overlay = document.querySelector('.onboarding');
      if (!overlay) return null;
      const body = overlay.querySelector('.onboarding__body');
      const next = overlay.querySelector('.onboarding__nav').lastElementChild;
      return {
        title: overlay.querySelector('.onboarding__title')?.textContent ?? '(untitled)',
        overflow: body.scrollHeight - body.clientHeight,
        // Half a pixel of slack for sub-pixel layout rounding.
        nextOffScreen: next.getBoundingClientRect().bottom > window.innerHeight + 0.5,
      };
    });
    if (!info) return;
    checked += 1;
    if (fitsWhole && info.overflow > 0) {
      fail(label, `guide step "${info.title}": content overflows by ${info.overflow}px`);
    }
    if (info.nextOffScreen) {
      fail(label, `guide step "${info.title}": the Next button is below the fold`);
    }
    await page.locator('.onboarding__nav > button').last().click({ force: true });
  }
}

/** Opens the app with the given preferences already stored. */
async function open(context, appearance, language, { query = '', onboarded = true } = {}) {
  const page = await context.newPage();
  await page.goto(BASE + query);
  await page.evaluate(
    ([settingsKey, languageKey, onboardedKey, appearance, language, onboarded]) => {
      localStorage.clear();
      localStorage.setItem(settingsKey, JSON.stringify({ appearance }));
      localStorage.setItem(languageKey, language);
      // Without this the first-run guide auto-opens over whatever view is
      // under test.
      if (onboarded) localStorage.setItem(onboardedKey, '1');
    },
    [SETTINGS_KEY, LANGUAGE_KEY, ONBOARDED_KEY, appearance, language, onboarded],
  );
  await page.reload();
  return page;
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});
let browser;
try {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fetch(BASE);
      break;
    } catch {
      if (attempt > 40) throw new Error('vite preview did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  // CHROMIUM_PATH overrides the browser binary (used in environments with
  // a pre-installed Chromium instead of playwright-downloaded browsers) —
  // same convention as smoke-test.mjs.
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    for (const appearance of APPEARANCES) {
      for (const language of viewport.languages) {
        const at = (view) => `${viewport.name} / ${appearance} / ${language} / ${view}`;

        // --- Level view. `?demo` replaces the sensor with a fixed tilt and
        // presents the app as configured, which is the only way to reach
        // this view on a machine with no motion sensor.
        const level = await open(context, appearance, language, { query: '?demo=1' });
        await level.waitForSelector('.rv-diagram svg');
        await checkLevelScreen(level, at('level'), { fitsWhole: viewport.fitsWhole });
        await auditView(level, at('level'));

        // --- Settings: a page in Modern, a drawer in Classic.
        await level.locator('#settings-button').click();
        await auditView(level, at('settings'));

        // --- The Ramps tab specifically, which is meant to fit one screen
        // with its picker collapsed (#246): what is set, its step heights,
        // the ramp count and Save, all without scrolling. That is the
        // point of collapsing the picker, so it is checked rather than
        // left to hold by luck — a longer hint or one more setting would
        // otherwise take it back silently.
        //
        // Held to the phones where it actually holds. On a 375x553 SE the
        // tab is about 130px too tall (181px in French), and the space is
        // in things put there on purpose: the Reset/Undo/Save row (150px),
        // the block naming the choice and its step heights (125px), and
        // labels sized up for readability. Closing that gap would mean
        // shrinking the type this tab was just given for exactly the
        // opposite reason, so the promise is stated where it is kept
        // rather than asserted where it is not.
        // Modern only; Classic splits these settings across drawer
        // sub-pages with no tab bar.
        if (viewport.height >= 745 && appearance === 'modern') {
          const reached = await level.evaluate(() => {
            const tab = [...document.querySelectorAll('.settings__tab')].find(
              (t) => t.getAttribute('data-tab') === 'ramps',
            );
            if (!tab) return false;
            tab.click();
            return true;
          });
          if (!reached) {
            fail(at('ramps tab'), 'could not reach the Ramps tab to check that it fits');
          } else {
            await level.waitForTimeout(250);
            const overflow = await level.evaluate(() => {
              const page = document.querySelector('.menu-page:not([hidden])');
              const picker = document.querySelector('.klossar__picker-details');
              return {
                pickerOpen: picker ? picker.open : null,
                scrollBy: page ? page.scrollHeight - page.clientHeight : 0,
              };
            });
            if (overflow.pickerOpen !== false) {
              fail(at('ramps tab'), 'the ramp picker is not collapsed by default');
            } else if (overflow.scrollBy > 0) {
              fail(
                at('ramps tab'),
                `does not fit one screen with the picker collapsed — scrolls by ${Math.round(
                  overflow.scrollBy,
                )}px`,
              );
            }
            checked += 1;
          }
        }

        // Reload rather than closing: a page's own ✕ goes through
        // history.back(), which from a freshly-loaded page can leave the
        // app entirely. Saving one page load is not worth a test that
        // depends on the browser's history stack.
        await level.reload();
        await level.waitForSelector('.rv-diagram svg');

        // --- Help / info, the longest scrolling page in the app.
        await level.locator('#help-button').click();
        await auditView(level, at('help'));
        await level.close();

        // --- External sensor page, via the simulated box.
        const sim = await open(context, appearance, language, { query: '?demo=1&easylevel-sim' });
        await sim.waitForSelector('.rv-diagram svg');
        const sensorButton = sim.locator('#sensor-slot button');
        if ((await sensorButton.count()) > 0) {
          await sensorButton.click();
          await auditView(sim, at('external sensor'));
        }
        await sim.close();

        // --- Incoming vehicle setup, reached the way a real one is: the
        // share link this app itself produces, opened fresh. Walked on the
        // tightest screen only: reaching it costs a page load, a settings
        // walk and a navigation, and it is a small centred dialog whose
        // content does not change with the screen around it — if it fits
        // there it fits anywhere, and every language still passes through.
        const sharer =
          viewport === TIGHTEST
            ? await open(context, appearance, language, { query: '?demo=1' })
            : null;
        if (sharer) {
          await sharer.waitForSelector('.rv-diagram svg');
          // The vehicle-setup link comes from Settings, not the top bar's
          // share button (which shares the app itself). Open Settings and
          // find the button wherever this appearance puts it — a tab panel
          // in Modern, a separate page in Classic.
          await sharer.locator('#settings-button').click();
          await sharer.waitForTimeout(300);
          const shareUrl = await sharer.evaluate(async () => {
            let captured = null;
            Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
            Object.defineProperty(navigator, 'clipboard', {
              value: { writeText: async (text) => void (captured = text) },
              configurable: true,
            });
            // Walk whatever tabs or sub-pages this appearance shows until
            // the vehicle section, and its share button, is on screen.
            // Modern lays the sections out as tabs on one page; Classic's
            // drawer lists them as items that each open their own page. Try
            // each in turn until the vehicle section is showing.
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
          });
          if (shareUrl && shareUrl.includes('#setup=')) {
            await sharer.goto(shareUrl.replace(/^https?:\/\/[^/]+/, `http://localhost:${PORT}`));
            await sharer.waitForTimeout(500);
            await auditView(sharer, at('incoming setup'));
          } else {
            fail(at('incoming setup'), 'could not produce a share link to open the view with');
          }
          await sharer.close();
        }

        // --- The first-run guide, the one view that opens on its own when
        // nothing has been stored yet.
        const wizard = await open(context, appearance, language, { onboarded: false });
        await checkWizard(wizard, at('guide'), { fitsWhole: viewport.fitsWhole });
        await wizard.close();
      }
    }
    await context.close();
  }

  // --- iOS-only view: the Bluefy workaround guide (R39), which exists
  // only on an iOS browser without Web Bluetooth.
  const iosContext = await browser.newContext({
    viewport: { width: TIGHTEST.width, height: TIGHTEST.height },
    userAgent: IOS_UA,
  });
  for (const language of LONGEST) {
    const label = `iOS / modern / ${language} / sensor guide`;
    const page = await open(iosContext, 'modern', language, { query: '?demo=1' });
    await page.waitForSelector('.rv-diagram svg');
    const guideButton = page.locator('#sensor-slot button');
    if ((await guideButton.count()) > 0) {
      await guideButton.click();
      await auditView(page, label);
    } else {
      fail(label, 'the iOS sensor guide could not be opened');
    }
    await page.close();
  }
  await iosContext.close();

  // --- The external-sensor path through the guide adds a step and swaps
  // the calibration pair for connect + installation offset. Its extra
  // steps are no taller than the phone path's, so it is walked on the
  // tightest screen only.
  const tightest = await browser.newContext({
    viewport: { width: TIGHTEST.width, height: TIGHTEST.height },
  });
  for (const appearance of APPEARANCES) {
    for (const language of LANGUAGES) {
      const page = await open(tightest, appearance, language, {
        query: '?easylevel-sim',
        onboarded: false,
      });
      await checkWizard(page, `${TIGHTEST.name} / ${appearance} / ${language} / guide, external`, {
        external: true,
      });
      await page.close();
    }
  }
  await tightest.close();
} finally {
  if (browser) await browser.close();
  preview.kill();
}

// ---------------------------------------------------------------------
// The static half: the iOS rule no browser here can reproduce.
//
// On iOS a `position: fixed; inset: 0` box is laid out against the
// toolbar-free LARGE viewport while `window.innerHeight` is the small
// one, so the bottom of that box — and any control in it — sits behind
// Safari's bottom bar with nothing to scroll. In Chromium the two
// viewports are identical, so every runtime check above passes happily on
// a layout that is broken on the device this app is built for. Hence
// this: every full-screen container must say, in the stylesheet, that it
// is sized to the small viewport and that its bottom padding clears the
// home indicator.
// ---------------------------------------------------------------------
const css = readFileSync(resolve(root, 'src/ui/styles.css'), 'utf8');

for (const container of VIEW_CONTAINERS) {
  const start = css.indexOf(`\n${container} {`);
  if (start === -1) {
    fail('stylesheet', `no rule found for the full-screen container ${container}`);
    continue;
  }
  const block = css.slice(start, css.indexOf('}', start));
  checked += 1;
  if (!/position:\s*fixed/.test(block)) continue;

  if (!/height:\s*100svh/.test(block)) {
    fail(
      'stylesheet',
      `${container} is a full-screen fixed container but is not sized to the small viewport ` +
        `(needs "height: 100svh", with "height: 100vh" above it as the fallback) — on iOS its ` +
        `bottom would sit behind Safari's toolbar`,
    );
  }
  // The bottom padding may live on the container or on the single child
  // that holds its content, so accept either.
  const childStart = css.indexOf(`\n${container}__drawer {`);
  const childBlock = childStart === -1 ? '' : css.slice(childStart, css.indexOf('}', childStart));
  if (!/env\(safe-area-inset-bottom\)/.test(block + childBlock)) {
    fail(
      'stylesheet',
      `${container} does not pad its bottom by env(safe-area-inset-bottom) — its last control ` +
        `would sit under the home indicator`,
    );
  }
}

if (failures.length > 0) {
  console.error(`fit test failed — ${failures.length} problem(s) across ${checked} checks:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`fit test passed — ${checked} checks, every view fits a phone screen`);

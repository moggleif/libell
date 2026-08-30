// Fit test (#239, #241): Libell is a one-screen app — the level view and
// every step of the first-run guide have to fit a phone screen, with
// nothing below the fold and no scrolling. This walks both against
// small-phone viewports and fails on anything that does not fit.
//
// It exists because the unit tests cannot catch this class of bug at all:
// they run in happy-dom, which has no layout engine, so every height they
// measure is zero and a view that overflows an iPhone by 300 px passes
// them happily. Run after `npm run build`; CI runs it on every branch.
// Exits non-zero on the first thing that does not fit.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4175;
const BASE = `http://localhost:${PORT}/libell/`;

// CSS pixels actually visible to the page, not the phone's spec sheet:
// Safari's own toolbars take ~114 px of an iPhone SE and ~107 px of an
// iPhone 15. The SE in Safari is the tightest screen anyone can install
// this on; if a view fits there it fits every current iPhone. Anything
// taller than the 15 in Safari is strictly more room, so testing it would
// only cost time.
const VIEWPORTS = [
  { name: 'iPhone SE, Safari', width: 375, height: 553 },
  { name: 'iPhone SE, installed', width: 375, height: 667 },
  { name: 'iPhone 15, Safari', width: 393, height: 745 },
];

// Every shipped language: German and Swedish wrap to more lines than
// English on the same button, and a view that fits in one language can
// overflow in another.
const LANGUAGES = ['sv', 'en', 'fr', 'es', 'de'];

// Classic and Modern build different DOM for the same content (illustrated
// legend vs. swatch rows, different type scale), so both are walked.
const APPEARANCES = ['classic', 'modern'];

// The real keys settingsStore.ts reads — settings as one JSON object,
// language on its own. Writing anything else (a made-up ".v1" suffix, say)
// silently leaves every run on the defaults, which would quietly reduce
// this whole sweep to one combination tested many times.
const SETTINGS_KEY = 'libell.settings';
const LANGUAGE_KEY = 'libell.language';

const failures = [];
let checked = 0;

function fail(label, what) {
  failures.push(`${label} | ${what}`);
}

/** Loads the app with the given preferences already stored. */
async function open(browser, viewport, appearance, language, query = '') {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  await page.goto(BASE + query);
  await page.evaluate(
    ([settingsKey, languageKey, appearance, language]) => {
      localStorage.clear();
      localStorage.setItem(settingsKey, JSON.stringify({ appearance }));
      localStorage.setItem(languageKey, language);
    },
    [SETTINGS_KEY, LANGUAGE_KEY, appearance, language],
  );
  await page.reload();
  return page;
}

/**
 * The level view: everything from the top bar to the version footer has
 * to be on screen at once, the page must not scroll, and the diagram has
 * to keep the drawing's proportions with each wheel card still sitting on
 * the wheel it describes (#241).
 */
async function checkLevelScreen(page, label) {
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
      // The drawing's own top and bottom on screen, mapped through the
      // SVG's transform: the box around it is deliberately wider than the
      // drawing (the wheel cards live in that margin), so the box's shape
      // says nothing — where the drawing actually lands does.
      drawingTop: screenY(0),
      drawingBottom: screenY(vb.height),
      boxTop: box.top,
      boxBottom: box.bottom,
      cards,
      wheelScreenYs: cards.map((c) => (c.wheelY === null ? null : screenY(c.wheelY))),
    };
  });
  checked += 1;

  if (result.pageOverflow > 0) {
    fail(label, `level view: the page scrolls by ${Math.round(result.pageOverflow)}px`);
  }
  for (const [name, bottom] of [
    ['action bar', result.bottombarBottom],
    ['version footer', result.footerBottom],
  ]) {
    if (bottom !== null && bottom > result.innerHeight + 0.5) {
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
 * One pass through the whole first-run guide, one assertion per step
 * (#239). With `external`, the sensor-source step's second radio is picked
 * as that step comes up — the only way to reach the external path, since
 * the radios do not exist until that step renders.
 */
async function checkWizard(page, label, { external = false } = {}) {
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
    if (info.overflow > 0) {
      fail(label, `guide step "${info.title}": content overflows by ${info.overflow}px`);
    }
    if (info.nextOffScreen) {
      fail(label, `guide step "${info.title}": the Next button is below the fold`);
    }
    await page.locator('.onboarding__nav > button').last().click({ force: true });
  }
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
    for (const appearance of APPEARANCES) {
      for (const language of LANGUAGES) {
        const label = `${viewport.name} / ${appearance} / ${language}`;

        // ?demo replaces the sensor with a fixed tilt and presents the app
        // as configured, which is the only way to reach the level view on
        // a machine with no motion sensor.
        const level = await open(browser, viewport, appearance, language, '?demo=1');
        await checkLevelScreen(level, label);
        await level.close();

        // Without ?demo the wizard auto-opens, this being a first run.
        const wizard = await open(browser, viewport, appearance, language);
        await checkWizard(wizard, label);
        await wizard.close();
      }
    }
  }

  // The external-sensor path adds a step and swaps the calibration pair
  // for connect + installation offset. Its extra steps are no taller than
  // the phone path's, so it is walked on the tightest screen only —
  // enough to catch a step that does not fit, without doubling the run.
  // ?easylevel-sim puts a simulated box behind the same gate real hardware
  // would satisfy, which is what makes the wizard offer that step at all.
  for (const appearance of APPEARANCES) {
    for (const language of LANGUAGES) {
      const page = await open(browser, VIEWPORTS[0], appearance, language, '?easylevel-sim');
      await checkWizard(page, `${VIEWPORTS[0].name} / ${appearance} / ${language} / external`, {
        external: true,
      });
      await page.close();
    }
  }
} finally {
  if (browser) await browser.close();
  preview.kill();
}

if (failures.length > 0) {
  console.error(`fit test failed — ${failures.length} problem(s) across ${checked} views:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`fit test passed — ${checked} views, all fit on one screen`);

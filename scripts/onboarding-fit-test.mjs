// Onboarding fit test (#239): the first-run guide has to fit one phone
// screen. Walks every step of the wizard against small-phone viewports
// and asserts, per step, that
//
//   1. the step's content fits its region without scrolling, and
//   2. the "Next"/"Done" button is inside the viewport.
//
// It exists because the unit tests cannot catch this: they run in
// happy-dom, which has no layout engine at all — every height there is
// zero, so a step that overflows an iPhone by 300 px passes them
// happily. This is the only check in the repo that can fail on the bug
// #239 was about. Run after `npm run build`; CI runs it on every branch.
// Exits non-zero on any step that does not fit.
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
// this on; if a step fits there it fits every current iPhone. Anything
// taller than the 15 in Safari is strictly more room, so testing it
// would only cost time.
const VIEWPORTS = [
  { name: 'iPhone SE, Safari', width: 375, height: 553 },
  { name: 'iPhone SE, installed', width: 375, height: 667 },
  { name: 'iPhone 15, Safari', width: 393, height: 745 },
];

// Every shipped language: German and Swedish wrap to more lines than
// English on the same button, and a step that fits in one language can
// overflow in another.
const LANGUAGES = ['sv', 'en', 'fr', 'es', 'de'];

// Classic and Modern build different DOM for the same steps (illustrated
// legend vs. swatch rows, different type scale), so both are walked.
const APPEARANCES = ['classic', 'modern'];

const failures = [];
let checked = 0;

/**
 * One pass through the whole wizard, one assertion per step. With
 * `external`, the sensor-source step's second radio is picked as that
 * step comes up — which is the only way to reach the external path, since
 * the radios do not exist until that step renders.
 */
async function walkWizard(page, label, { external = false } = {}) {
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
      failures.push(`${label} | "${info.title}" | content overflows by ${info.overflow}px`);
    }
    if (info.nextOffScreen) {
      failures.push(`${label} | "${info.title}" | Next button is below the fold`);
    }
    await page.locator('.onboarding__nav > button').last().click({ force: true });
  }
}

/** Opens a first-run wizard with the given preferences already stored. */
async function openWizard(browser, viewport, appearance, language, { external = false } = {}) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  // ?easylevel-sim puts a simulated external sensor behind the same gate
  // real hardware would satisfy, which is what makes the wizard offer its
  // sensor-source step and the longer external path.
  await page.goto(external ? `${BASE}?easylevel-sim` : BASE);
  // The wizard only auto-opens on a first run, so the stored state is
  // cleared — then the preferences under test are written back and the
  // page reloaded to pick them up.
  await page.evaluate(
    ([appearance, language]) => {
      localStorage.clear();
      localStorage.setItem('libell.settings.v1', JSON.stringify({ appearance, language }));
    },
    [appearance, language],
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

  // The phone path — what everyone without an external sensor sees — in
  // every combination.
  for (const viewport of VIEWPORTS) {
    for (const appearance of APPEARANCES) {
      for (const language of LANGUAGES) {
        const page = await openWizard(browser, viewport, appearance, language);
        await walkWizard(page, `${viewport.name} / ${appearance} / ${language}`);
        await page.close();
      }
    }
  }

  // The external-sensor path adds a step and swaps the calibration pair
  // for connect + installation offset. Its extra steps are no taller than
  // the phone path's, so it is walked on the tightest screen only —
  // enough to catch a step that does not fit, without doubling the run.
  for (const appearance of APPEARANCES) {
    for (const language of LANGUAGES) {
      const page = await openWizard(browser, VIEWPORTS[0], appearance, language, {
        external: true,
      });
      await walkWizard(page, `${VIEWPORTS[0].name} / ${appearance} / ${language} / external`, {
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
  console.error(`onboarding fit test failed — ${failures.length} of ${checked} steps do not fit:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`onboarding fit test passed — ${checked} step renderings, all fit on one screen`);

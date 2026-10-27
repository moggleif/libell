// The first-run guide: every step fits whole, Back/Skip/Next never leave
// the screen (#239) and the calibration card is spaced as in Classic (#572).
import { calibrationGapProblem, measureCalibrationGap } from '../fitWizardSpacing.ts';
import { passIntro } from '../fitOpen.mjs';
import { auditView } from './auditView.mjs';
import { countCheck, fail } from './report.mjs';

/** Runs in the page: picks the source step's last radio, if that step is showing. */
function pickExternalSource() {
  const radios = [...document.querySelectorAll('input[name="onboarding-source"]')];
  const choice = radios[radios.length - 1];
  if (choice && !choice.checked) {
    choice.checked = true;
    choice.dispatchEvent(new Event('change'));
  }
}

/** Runs in the page: the open guide step's title and fit, or null once the guide has closed. */
function measureGuideStep() {
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
}

/** Checks the step on screen; false once the guide has closed. */
async function checkGuideStep(page, label, fitsWhole) {
  const info = await page.evaluate(measureGuideStep);
  if (!info) return false;
  countCheck();
  if (fitsWhole && info.overflow > 0) {
    fail(label, `guide step "${info.title}": content overflows by ${info.overflow}px`);
  }
  if (info.nextOffScreen) {
    fail(label, `guide step "${info.title}": the Next button is below the fold`);
  }
  const spacing = calibrationGapProblem(await page.evaluate(measureCalibrationGap));
  if (spacing) fail(label, `guide step "${info.title}": ${spacing}`);
  return true;
}

/**
 * Walks the guide step by step. With `external`, the source step's last
 * radio is picked as that step renders — the only way onto the external
 * path, since the radios exist only then.
 */
export async function checkWizard(page, label, { external = false, fitsWhole = true } = {}) {
  await passIntro(page, (screen) => auditView(page, `${label} / ${screen}`));
  // 12 is past the longest path (10, external sensor); the loop ends when the guide closes.
  for (let step = 0; step < 12; step += 1) {
    if (external) await page.evaluate(pickExternalSource);
    // Calibration steps fill in a live status line a tick after rendering, which
    // makes them taller: measure once it has landed, never the empty first frame.
    await page.waitForTimeout(200);
    if (!(await checkGuideStep(page, label, fitsWhole))) return;
    await page.locator('.onboarding__nav > button').last().click({ force: true });
  }
}

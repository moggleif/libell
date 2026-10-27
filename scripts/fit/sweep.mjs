// The fit test's runtime half: every view on every screen, plus the views
// that exist only on one platform or one path through the guide.
import { IOS_UA, LANGUAGES, LONGEST, TIGHTEST, VIEWPORTS, WALKED_APPEARANCES } from './config.mjs';
import { auditView } from './auditView.mjs';
import { fail } from './report.mjs';
import { open, walkViews } from './views.mjs';
import { checkWizard } from './wizard.mjs';

/**
 * The iOS-only view: the Bluefy workaround guide (R39), which exists only
 * on an iOS browser without Web Bluetooth. Walked in Modern only, so it
 * runs in whichever run includes Modern.
 */
async function checkIosSensorGuide(browser) {
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
}

/**
 * The external-sensor path through the guide adds a step and swaps the
 * calibration pair for connect + installation offset. Its extra steps are
 * no taller than the phone path's, so it is walked on the tightest screen
 * only.
 */
async function checkExternalGuide(browser) {
  const tightest = await browser.newContext({
    viewport: { width: TIGHTEST.width, height: TIGHTEST.height },
  });
  for (const appearance of WALKED_APPEARANCES) {
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
}

/** Walks every view, on every screen, in every walked appearance and its languages. */
export async function sweep(browser) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    for (const appearance of WALKED_APPEARANCES) {
      for (const language of viewport.languages) {
        await walkViews(context, viewport, appearance, language);
      }
    }
    await context.close();
  }
  if (WALKED_APPEARANCES.includes('modern')) await checkIosSensorGuide(browser);
  await checkExternalGuide(browser);
}

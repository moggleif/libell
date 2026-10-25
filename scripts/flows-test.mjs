// Flows test (#374): drives the built app through the flows that only
// exist as wiring in `src/main.ts`. For the boxes: connecting one, its
// health and live rows, picking or learning its direction, zeroing it,
// its password, its debug knob, and the silent reconnect after a reload,
// against the simulated boxes (`?xparkle-sim`, `?easylevel-sim`). For the
// phone: calibrating, zeroing and checking it, target presets and a
// caravan's hitch height, against
// `?demo`'s fixed tilt. Settings' Calibration tab while a box is in use. For the first visit:
// the counting choice, the intro, Install and the install row. For the first-run wizard: its phone calibration
// and its box path, connected or not. For the level screen: the pose
// guard, the level celebration, a lost box coming back, the status row
// per vehicle, and the rebuild after a saved change. What is stored, and deleting it. The mute
// button and the sounds, against a stand-in for WebAudio. None of it
// needs hardware or Web Bluetooth.
//
// It exists to pin today's behaviour while `main.ts` is split into
// modules: the unit tests reach each module, but only a whole running app
// shows that the modules are still wired to each other the same way.
//
// Each flow lives in its own file under `scripts/flows/`, with the shared
// helpers in `scripts/flows/harness.mjs`; this file starts the preview
// server and the browser and runs them in order.
//
// Run after `npm run build`; CI runs it on every pull request. Exits non-zero
// on any failed assertion.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { BASE, PORT } from './flows/harness.mjs';
import { xparkleFlow, xparklePasswordFlow } from './flows/xparkle.mjs';
import { easyLevelFlow } from './flows/easyLevel.mjs';
import {
  hitchHeightFlow,
  phoneCalibrationFlow,
  phoneCheckOffFlow,
  targetsFlow,
} from './flows/phone.mjs';
import { settingsBoxFlow } from './flows/settingsBox.mjs';
import { countingFlow } from './flows/counting.mjs';
import { firstVisitFlow } from './flows/firstVisit.mjs';
import { wizardPhoneFlow, wizardBoxFlow, wizardPasswordFlow } from './flows/wizard.mjs';
import {
  landscapeFlow,
  celebrationFlow,
  lostBoxFlow,
  levelScreenFlow,
} from './flows/levelScreen.mjs';
import { soundFlow } from './flows/sound.mjs';
import { navigationFlow } from './flows/navigation.mjs';
import { settingsSaveFlow } from './flows/settingsSave.mjs';
import { startupFlow } from './flows/startup.mjs';
import { vehiclesFlow } from './flows/vehicles.mjs';
import { privacyFlow } from './flows/privacy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
  // CHROMIUM_PATH overrides the browser binary, as in smoke-test.mjs.
  browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  await xparkleFlow(browser);
  await xparklePasswordFlow(browser);
  await easyLevelFlow(browser);
  await phoneCalibrationFlow(browser);
  await phoneCheckOffFlow(browser);
  await targetsFlow(browser);
  await hitchHeightFlow(browser);
  await settingsBoxFlow(browser);
  await countingFlow(browser);
  await firstVisitFlow(browser);
  await wizardPhoneFlow(browser);
  await wizardBoxFlow(browser, true);
  await wizardBoxFlow(browser, false);
  await wizardPasswordFlow(browser);
  await landscapeFlow(browser);
  await celebrationFlow(browser);
  await lostBoxFlow(browser);
  await soundFlow(browser);
  await levelScreenFlow(browser);
  await navigationFlow(browser);
  await settingsSaveFlow(browser);
  await startupFlow(browser);
  await vehiclesFlow(browser);
  await privacyFlow(browser);
  console.log(
    'flows test passed: Xparkle, Xparkle password, EasyLevel, phone calibration, targets, hitch height, Settings with a box, counting choice, first visit, wizard, wizard password, landscape, celebration, lost box, sound, level screen, navigation, settings saves, start-up, vehicles, privacy',
  );
} finally {
  await browser?.close();
  preview.kill();
}

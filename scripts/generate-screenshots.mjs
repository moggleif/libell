// Renders the PWA manifest screenshot from the built app in ?demo mode,
// so the repository stays text-only (like the icons). Run after
// `npm run build`; the deploy workflow does it before publishing.
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPreview } from './withPreview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist/screenshots');

await withPreview(4173, async (browser, appUrl) => {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, locale: 'en-GB' });
  await page.goto(`${appUrl}?demo=1`);
  await page.waitForSelector('.rv-diagram svg');
  await page.waitForTimeout(600); // let the bubble settle
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, 'narrow.png') });
  console.log('screenshot written to dist/screenshots/narrow.png');
});

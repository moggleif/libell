// Renders the PWA manifest screenshot from the built app in ?demo mode,
// so the repository stays text-only (like the icons). Run after
// `npm run build`; the deploy workflow does it before publishing.
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist/screenshots');

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});
try {
  // Wait for the preview server to accept connections.
  const url = 'http://localhost:4173/libell/?demo=1';
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fetch('http://localhost:4173/libell/');
      break;
    } catch {
      if (attempt > 40) throw new Error('vite preview did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  // CHROMIUM_PATH overrides the browser binary (used in environments with
  // a pre-installed Chromium instead of playwright-downloaded browsers).
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  await page.goto(url);
  await page.waitForSelector('.rv-diagram svg');
  await page.waitForTimeout(600); // let the bubble settle
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, 'narrow.png') });
  await browser.close();
  console.log('screenshot written to dist/screenshots/narrow.png');
} finally {
  preview.kill();
}

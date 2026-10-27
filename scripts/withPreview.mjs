// The browser scripts' shared start-up (#732): serve the built app (dist/)
// with `vite preview` on a port of their own, wait until it answers, start
// Chromium, run, and tear both down again whatever happens.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { basePath } from './basePath.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Where `vite preview` on `port` serves the app. */
export const previewUrl = (port) => `http://localhost:${port}${basePath()}`;

async function waitForServer(url) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fetch(url);
      return;
    } catch {
      if (attempt > 40) throw new Error('vite preview did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

/**
 * Runs `run(browser, url)` against the built app served on `port`, and
 * returns what it returns. CHROMIUM_PATH overrides the browser binary (used
 * in environments with a pre-installed Chromium instead of
 * playwright-downloaded browsers).
 */
export async function withPreview(port, run) {
  const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  });
  let browser;
  try {
    const url = previewUrl(port);
    await waitForServer(url);
    browser = await chromium.launch(
      process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    );
    return await run(browser, url);
  } finally {
    await browser?.close();
    preview.kill();
  }
}

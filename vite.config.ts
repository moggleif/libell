// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// GitHub Pages serves a project site from /<repo>/. Override with BASE_PATH
// (e.g. BASE_PATH=/ for a custom domain or local static hosting).
const base = process.env.BASE_PATH ?? '/libell/';

// ── Version string for the footer ──────────────────────────────────────────
// Release handling mirrors sbsommar: the VERSION file holds major.minor, the
// deploy workflow computes the patch from git tags and passes BUILD_VERSION.
// - BUILD_VERSION set (deploy workflow): use it verbatim.
// - CI without BUILD_VERSION: no version — better none than a wrong one.
// - Local dev: latest matching tag (or {base}.0) plus a local timestamp.
function resolveVersionString(): string | null {
  if (process.env.BUILD_VERSION) return process.env.BUILD_VERSION;
  if (process.env.GITHUB_ACTIONS) return null;
  const versionPath = join(__dirname, 'VERSION');
  const baseVersion = existsSync(versionPath) ? readFileSync(versionPath, 'utf8').trim() : '0.0';
  let latest = `${baseVersion}.0`;
  try {
    const tags = execFileSync(
      'git',
      ['tag', '--list', `v${baseVersion}.*`, '--sort=-version:refname'],
      {
        encoding: 'utf8',
      },
    ).trim();
    const first = tags.split('\n')[0];
    if (first) latest = first.replace(/^v/, '');
  } catch {
    // git unavailable — keep the fallback.
  }
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ');
  return `${latest} – local ${stamp}`;
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(resolveVersionString()),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Libell',
        short_name: 'Libell',
        description: 'Level your motorhome / RV with your phone.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#101418',
        theme_color: '#101418',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The app must work with no signal at all on a campsite, so every
        // build asset is precached.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

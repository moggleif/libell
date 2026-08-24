// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// GitHub Pages serves a project site from /<repo>/. Override with BASE_PATH
// (e.g. BASE_PATH=/ for a custom domain or local static hosting).
const base = process.env.BASE_PATH ?? '/libell/';

// ── Version string for the footer ──────────────────────────────────────────
// The VERSION file holds major.minor; the deploy workflow decides release vs
// candidate and passes the finished display string as BUILD_VERSION (ADR 0007).
// - BUILD_VERSION set (deploy workflow): use it verbatim ("X.Y.0" or
//   "X.Y.0 – CR<PR>").
// - CI without BUILD_VERSION: no version — better none than a wrong one.
// - Local dev: the release of this minor plus a local timestamp. A working
//   tree is not a candidate build, so it never carries a CR number — and
//   the string always keeps the full X.Y.Z shape.
function resolveVersionString(): string | null {
  if (process.env.BUILD_VERSION) return process.env.BUILD_VERSION;
  if (process.env.GITHUB_ACTIONS) return null;
  const versionPath = join(import.meta.dirname, 'VERSION');
  const baseVersion = existsSync(versionPath) ? readFileSync(versionPath, 'utf8').trim() : '0.0';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  return `${baseVersion}.0 – local ${stamp}`;
}

// GitHub Pages cannot set response headers, so the strictest available
// hardening is a CSP <meta> tag. Injected only into production builds —
// the dev server inlines styles/scripts and would break under it. The
// app is fully self-contained (no CDNs, no analytics, no remote calls),
// so 'self' covers everything; anything injected from elsewhere is
// refused by the browser. Browsers ignore `frame-ancestors` in a meta
// CSP — it is kept for header-capable hosts, and the framing guard in
// main.ts covers clickjacking on Pages (#67, ADR 0005).
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; " +
  "font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; " +
  "object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

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
    {
      name: 'security-meta-tags',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'referrer', content: 'no-referrer' },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
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
        categories: ['utilities', 'travel'],
        screenshots: [
          {
            src: 'screenshots/narrow.png',
            sizes: '540x960',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
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

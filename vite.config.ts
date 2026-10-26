// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';
import { runnerImport, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { localVersion } from './scripts/version.ts';
import { basePath } from './scripts/basePath.ts';

// The root of libell.app, or the BASE_PATH the deploy workflow passes (#672).
const base = basePath();

// ── Version string for the footer ──────────────────────────────────────────
// The VERSION file holds major.minor (or major.minor.patch); the deploy
// workflow decides release vs candidate and passes the finished display
// string as BUILD_VERSION (ADR 0007, scripts/version.ts).
// - BUILD_VERSION set (deploy workflow): use it verbatim ("X.Y.Z" or
//   "X.Y.Z – CR<PR>").
// - CI without BUILD_VERSION: no version — better none than a wrong one.
// - Local dev: the release of this VERSION plus a local timestamp, never a
//   CR number, always in the full X.Y.Z shape.
function resolveVersionString(): string | null {
  if (process.env.BUILD_VERSION) return process.env.BUILD_VERSION;
  if (process.env.GITHUB_ACTIONS) return null;
  const versionPath = join(import.meta.dirname, 'VERSION');
  const versionFile = existsSync(versionPath) ? readFileSync(versionPath, 'utf8') : '0.0';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  return localVersion(versionFile, stamp);
}

// GitHub Pages cannot set response headers, so the strictest available
// hardening is a CSP <meta> tag. Injected only into production builds —
// the dev server inlines styles/scripts and would break under it. The
// app is self-contained (no CDNs, no remote calls) apart from the anonymous
// counter (ADR 0021): its origin, `COUNTER_ORIGIN` in src/domain/usage.ts,
// is the one addition to connect-src. Anything injected from elsewhere is
// refused by the browser. Browsers ignore `frame-ancestors` in a meta
// CSP — it is kept for header-capable hosts, and the framing guard in
// main.ts covers clickjacking on Pages (#67, ADR 0005).
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; " +
  "font-src 'self'; connect-src 'self' https://libell.goatcounter.com; manifest-src 'self'; worker-src 'self'; " +
  "object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

// The static pages: the privacy policy (#675) and the language pages (#703),
// one page per language each, plus their shared stylesheet, written from the
// message dictionaries. `src/ui/staticPages.ts` is app code (typed and tested
// with the app), so it is loaded through Vite here rather than imported.
// Its shape is written out: importing its type would pull the app's sources,
// with their browser-only types, into this config's type check.
interface StaticPagesModule {
  staticPages(base: string): { fileName: string; source: string }[];
}

function staticPages(): Plugin {
  return {
    name: 'static-pages',
    apply: 'build',
    async generateBundle() {
      const { module } = await runnerImport<StaticPagesModule>('./src/ui/staticPages.ts');
      for (const { fileName, source } of module.staticPages(base)) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
  };
}

// What search engines and AI assistants read (#701): the page head, plus
// robots.txt, sitemap.xml and llms.txt at the root. `src/ui/findability.ts`
// is app code (typed and tested with the app, its text from the message
// dictionaries), so it is loaded through Vite rather than imported here.
type FindabilityModule = typeof import('./src/ui/findability');

function loadFindability(): Promise<FindabilityModule> {
  return runnerImport<FindabilityModule>('./src/ui/findability.ts').then((r) => r.module);
}

function findability(): Plugin {
  return {
    name: 'findability',
    async transformIndexHtml() {
      const { headTags, siteUrl } = await loadFindability();
      return headTags(siteUrl(base)).map((tag) => ({ ...tag, injectTo: 'head' as const }));
    },
    // After every other plugin, so the sitemap sees every page they wrote.
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const { llmsTxt, robotsTxt, sitemapXml, siteUrl } = await loadFindability();
        const site = siteUrl(base);
        const files = {
          'robots.txt': robotsTxt(site),
          'sitemap.xml': sitemapXml(site, Object.keys(bundle)),
          'llms.txt': llmsTxt(site),
        };
        for (const [fileName, source] of Object.entries(files)) {
          this.emitFile({ type: 'asset', fileName, source });
        }
      },
    },
  };
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
    findability(),
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
    staticPages(),
    VitePWA({
      registerType: 'autoUpdate',
      // The glob below already precaches every icon; listing the manifest's
      // icons again would precache each one twice (#542).
      includeManifestIcons: false,
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
        // The link preview is for chat apps, never shown offline (#702).
        globIgnores: ['preview.png'],
        cleanupOutdatedCaches: true,
        // The privacy and language pages are pages of their own, never the
        // app (#675, #703).
        navigateFallbackDenylist: [/\/privacy\//, /\/[a-z]{2}\/(index\.html)?$/],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    // `npm run test:coverage` (CI) fails when coverage of the app source drops
    // below these floors, about 0.8 points under main's coverage when last
    // raised (#475, #529). Raise them as coverage grows; never lower them to
    // get green.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary'],
      thresholds: { statements: 97.5, branches: 94.0, functions: 96.3, lines: 97.8 },
    },
  },
});

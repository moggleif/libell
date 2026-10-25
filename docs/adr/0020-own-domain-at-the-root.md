# 0020 — Libell is served from the root of its own domain, libell.app

**Status:** Accepted, 2026-10-25. Amends the hosting in ADR 0007.

## Context

Issue #672: the app was a GitHub Pages project site at `https://moggleif.github.io/libell/`.
Shipping it on Google Play as a Trusted Web Activity (#671) needs
`/.well-known/assetlinks.json` at the root of the origin, which a project site cannot
publish, and a name of its own helps people find it (#673). Morgan bought `libell.app` at
Cloudflare (2026-10-25), which keeps its DNS. Hosting stays on GitHub Pages and the deploy
workflow of ADR 0007.

## Decision

The app is served from `https://libell.app/`, so its base path, `start_url` and `scope` are
`/`. The domain is set in the repository's Pages settings, with HTTPS enforced. With a
custom domain, GitHub Pages sends the old project-site address on to the new one by itself.

The base path is not hard-coded. `scripts/basePath.ts` reads `BASE_PATH` and defaults to
`/`. The deploy workflow runs `actions/configure-pages` before the build and passes its
`base_path` output: `""` once the custom domain is set, `"/libell"` before. A deploy
therefore fits whatever the Pages setting says, and the order of merging this change and
setting the domain does not matter. The smoke, flows, fit and screenshot scripts read the
same base path, so they open the app where the build put it.

`public/.well-known/` is copied into `dist/` by Vite. The Pages upload leaves out
dot-directories by default, so the workflow sets `include-hidden-files: true`.

## Alternatives considered

- **Hard-code `/`.** Simpler, but the site would be broken from the merge until the domain
  is set in Pages, or from setting the domain until the merge.
- **A `CNAME` file in `dist/`.** GitHub Pages ignores it when the site is deployed by
  Actions; the domain lives in the Pages settings.
- **Hosting on Cloudflare Pages.** It would add a second deploy machinery for no gain now.
  Cloudflare stays the DNS, and later the feedback Worker (#676).

## Consequences

- Saved data does not carry over from the old address, because the browser keeps it per
  origin. There were no users yet (Morgan, 2026-10-16), so there is no migration.
- The phone that already installed the old address keeps that install. It is removed and
  the app installed again from `libell.app`.
- Release notes under `docs/releases/` keep the old address, as they were written.

# Security

## Reporting

Found a vulnerability? Open an issue via the in-app **? → Feedback** form (category
Bug) or directly at <https://github.com/moggleif/libell/issues>. There is no bug
bounty; reports are handled best-effort.

## Model

Libell is a fully static, self-contained PWA on GitHub Pages:

- **No backend, no accounts, no secrets.** The client contains no tokens or API keys;
  the repository contains no credentials. Feedback is filed by the visitor under their
  own GitHub account via a pre-filled issue URL.
- **No third-party code at runtime.** No CDNs and no third-party scripts; every
  asset is same-origin, and everything the app loads is precached by the service
  worker. The one exception is install metadata: the manifest's screenshot (shown only
  in the install sheet) is generated from the built app after the service worker, so it
  is fetched on demand instead. Production builds carry a
  `default-src 'self'` Content-Security-Policy meta tag and a `no-referrer` referrer
  policy, so injected external script/style is refused by the browser.
- **One remote request: anonymous counting (ADR 0021).** The app sends GoatCounter
  (`libell.goatcounter.com`, the only origin added to `connect-src`) a fixed event name:
  app opened, app version, the language chosen in Libell, the sensor model and the
  features listed in `src/domain/usage.ts`, each at most once per app start. It sends no
  cookie, referrer or identifier, and nothing about the user, the phone or its readings;
  GoatCounter sees the IP address and User-Agent of the request but does not store them.
  Nothing is sent until the user has chosen "Yes, count anonymously" on the first screen (ADR 0022);
  "No thanks", Global Privacy Control and Do Not Track stop every request.
- **No HTML injection surface.** The DOM is built exclusively with `createElement` /
  `textContent`; `innerHTML` and friends are not used.
- **Framing is refused.** Pages cannot send headers and browsers ignore
  `frame-ancestors` in a meta CSP, so `src/app/frameGuard.ts` blanks the page and
  breaks out of any hostile iframe instead (clickjacking guard).
- **Untrusted storage is validated.** Everything read from `localStorage` passes
  validation with per-field fallback, so hand-edited or corrupt values cannot break
  or subvert startup.
- **Sensor data stays on the device.** Tilt readings, from the phone or from a Sensorbox
  over Web Bluetooth, are processed in memory and never leave the phone; the counter
  only learns which sensor model is used.
- **The Xparkle box's password is a pairing code, not a secret.** The box's four-digit
  code is kept in `localStorage` with the other settings and is only ever written to
  that box over Bluetooth. Libell never changes it.
- **A privacy policy in every language.** `/privacy/<lang>/` (R60) says in plain words
  what is stored, what is sent and to whom. The pages are static, run no script and carry
  a `default-src 'none'` CSP of their own; the Privacy tab links to them.
- **Everything stored can be seen and deleted.** The help page's Privacy tab
  (R58 in `docs/02-REQUIREMENTS.md`) lists every `libell.*` key, shows the box password
  only as dots, and deletes them all on request.

## Supply chain

- GitHub Actions are pinned to commit SHAs, and workflow inputs/outputs reach shell
  steps via `env:` rather than inline interpolation.
- Workflow permissions follow least privilege: `contents: read` by default, with any
  write granted only where it is needed. In the deploy, only the job that publishes to
  GitHub Pages gets `pages: write` and `id-token: write` (the OIDC token Pages
  requires), and only the tagging job gets `contents: write`. The release-notes
  workflow writes release texts (`contents: write`), CodeQL uploads its results
  (`security-events: write`), and the Dependabot auto-merge job turns on auto-merge
  for Dependabot's own patch and minor PRs (`contents: write`, `pull-requests: write`,
  without checking out the PR's code; ADR 0021).
- Dependabot watches npm packages and action pins weekly. All npm dependencies are
  build-time only; none ship to the client. Patch and minor updates merge themselves
  once CI is green; a major version waits for a person (ADR 0021).

## Supported versions

Only the latest deployed version (the top bar and the About page show it) is supported — the PWA
auto-updates on next launch after every deploy.

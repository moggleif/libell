# Security

## Reporting

Found a vulnerability? Open an issue via the in-app **☰ → Feedback** form (category
Bug) or directly at <https://github.com/moggleif/libell/issues>. There is no bug
bounty; reports are handled best-effort.

## Model

Libell is a fully static, self-contained PWA on GitHub Pages:

- **No backend, no accounts, no secrets.** The client contains no tokens or API keys;
  the repository contains no credentials. Feedback is filed by the visitor under their
  own GitHub account via a pre-filled issue URL.
- **No third-party code at runtime.** No CDNs, no analytics, no remote requests; every
  asset is same-origin and precached by the service worker. Production builds carry a
  `default-src 'self'` Content-Security-Policy meta tag and a `no-referrer` referrer
  policy, so injected external script/style is refused by the browser.
- **No HTML injection surface.** The DOM is built exclusively with `createElement` /
  `textContent`; `innerHTML` and friends are not used.
- **Framing is refused.** Pages cannot send headers and browsers ignore
  `frame-ancestors` in a meta CSP, so `main.ts` blanks the page and breaks out of any
  hostile iframe instead (clickjacking guard).
- **Untrusted storage is validated.** Everything read from `localStorage` passes
  validation with per-field fallback, so hand-edited or corrupt values cannot break
  or subvert startup.
- **Sensor data stays on the device.** Tilt readings are processed in memory and never
  leave the phone.

## Supply chain

- GitHub Actions are pinned to commit SHAs, and workflow inputs/outputs reach shell
  steps via `env:` rather than inline interpolation.
- Workflow permissions follow least privilege (`contents: read` unless a job tags or
  publishes a release).
- Dependabot watches npm packages and action pins weekly. All npm dependencies are
  build-time only; none ship to the client.

## Supported versions

Only the latest deployed version (the footer shows it) is supported — the PWA
auto-updates on next launch after every deploy.

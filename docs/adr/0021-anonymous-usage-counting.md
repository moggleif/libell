# 0021 — Anonymous usage counting with GoatCounter, on by default, one origin

**Status:** Accepted, 2026-10-25. Amends ADR 0005 ("no analytics, no remote calls").

## Context

Issue #674: Morgan wants to know roughly how many use Libell and which features, while
being openly honest about it and tracking no one. GitHub Pages gives no access logs, and
Cloudflare's own traffic statistics need proxied DNS, which libell.app cannot have on
GitHub Pages (ADR 0020). So counting needs one request from the app. Morgan decided
(2026-10-25): GoatCounter; the proposed events; on from the start, with its own step in
the introduction that says what is saved and what is not.

## Decision

- **Service:** GoatCounter's hosted service, site `libell.goatcounter.com`, with every
  optional data collection setting off and the dashboard public.
- **What is sent:** a fixed set of event names (`src/domain/usage.ts`): app opened, app
  version, the language chosen in Libell, the sensor model in use, and the features in
  `FEATURE_EVENTS`. Each at most once per app start, held in memory. Nothing about the
  user, the phone or its readings: no country, screen, device, OS, firmware or id.
- **How:** a `fetch` from Libell's own code to `/count` (`mode: 'no-cors'`, no credentials,
  no referrer). No external script, so only `connect-src` gains the counter's origin.
- **Off means off:** the switch (`libell.countingOff`, kept apart from the settings so a
  settings reset never turns it back on), Global Privacy Control and Do Not Track all
  stop every request. Offline, nothing is sent and nothing is kept for later.
- **Only production counts:** only on `libell.app`, never in dev, a preview or `?demo`.

## Alternatives considered

- **Cloudflare traffic statistics (proxied DNS)** — rejected: conflicts with GitHub Pages'
  DNS-only records (ADR 0020), and misses offline opens.
- **Cloudflare Web Analytics, Plausible, Umami** — rejected: they keep country, device and
  browser, which Morgan ruled out.
- **Our own Cloudflare Worker** — kept as the fallback: full control, but a dashboard to
  build and run.
- **Store consoles only** — rejected: installs only, no features.

## Consequences

- The app makes one kind of remote request; the "no remote requests" rule in `CLAUDE.md`
  and `SECURITY.md` now names this one exception, and any other still needs its own ADR.
- Every request reaches GoatCounter with the phone's IP address and User-Agent, which
  GoatCounter says it never writes to disk. The privacy texts say so plainly.
- A new event is a code change to `FEATURE_EVENTS`, reviewed like any other, and must be
  added to the texts that list what is counted.

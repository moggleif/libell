# Libell

**➡️ Open the app: <https://libell.app/>** · no sensor at hand?
[Try the demo modes](#try-the-demo-modes).

Libell is an installable web app (PWA) that helps you level a motorhome / RV with your
phone. It doesn't just tell you how far off level you are — it turns that tilt into a
plan for the ramps you actually own: which wheels to drive up, onto which step, and when
your ramps can't finish the job at all.

Lay the phone flat inside the vehicle (for example on the table) with the **top edge of
the phone pointing toward the front**, or let a Sensorbox measure instead (see below).
Libell shows a top-down view of the motorhome or caravan: green ✓ wheels are already
within tolerance, orange ↑ wheels show which ramp step to drive up onto and how many mm
they are missing, gray – wheels get no ramp because your ramp set doesn't stretch that
far, and red ✕ means your ramps can't fix that wheel — move the vehicle instead. If no
arrangement of your ramps reaches level at all, the status line says so and gives a
rough sense of how far off ("close" or "far"). A bubble level sits in the middle of the
diagram, and a big "Your vehicle is level!" (with an optional chime) confirms when you are
done. A caravan gets a ramp for the low axle wheel and a signed correction for the
jockey wheel; a tandem (boggie) axle is supported too. Everything works offline once
loaded; there is no account.

## Privacy

Your settings, measurements and calibrations stay in your phone's browser storage and are
never sent anywhere. The one thing Libell sends is an anonymous count to
[GoatCounter](https://libell.goatcounter.com): that the app was opened, the app version,
the language chosen in Libell, the sensor model in use and which features are used. No
country, IP address, screen, device, operating system, browser, firmware or identifier is
saved, and no cookie is set. It is on from the start, the introduction says so on a page
of its own, and it can be switched off under Help › Privacy, which also shows everything
Libell has stored; a browser's Global Privacy Control or Do Not Track switches it off too. The statistics are public. Details: `SECURITY.md` and
[ADR 0021](docs/adr/0021-anonymous-usage-counting.md).

## Try the demo modes

Each link opens the deployed app in a mode that needs no phone sensor and no Sensorbox:

- [Demo](https://libell.app/?demo) — a fixed synthetic tilt instead of the
  phone's sensor.
- [Xparkle, simulated](https://libell.app/?xparkle-sim) — a simulated
  Xparkle box.
- [Xparkle, connection drops](https://libell.app/?xparkle-sim=drop) — the
  simulated box loses its connection now and then.
- [Xparkle, wrong password](https://libell.app/?xparkle-sim=badpassword) —
  the box rejects the factory password; enter `1234` to get past it.
- [EasyLevel, simulated](https://libell.app/?easylevel-sim) — a simulated
  EasyLevel box.
- [EasyLevel, connection drops](https://libell.app/?easylevel-sim=drop) —
  the simulated box loses its connection now and then.
- [Demo + Xparkle](https://libell.app/?demo&xparkle-sim) and
  [Demo + EasyLevel](https://libell.app/?demo&easylevel-sim) — the flags
  combine.

## Using it on your phone

Open the app link above and, when you want it permanently available:

- **Android (Chrome):** menu → **Add to Home screen** / **Install app**
- **iOS (Safari):** Share → **Add to Home Screen**

It then launches standalone, like any other app, and keeps working with no signal.

The first time you open it, a short introduction walks you through language,
appearance, sound, vehicle type, how to place the phone, your measurements and ramps,
and calibrating the phone. Every step can be skipped; **Help → Show introduction**
reopens it. After that:

- **Settings** (bottom bar) holds the vehicle (wheelbase and track widths in mm, rear
  axle), your ramps (pick a ready-made ramp by name or type the step heights, and how
  many you own) and fine-tuning such as tolerance, stability and which side your
  waste-water drain is on.
- **Calibrate** the phone once on a surface you know is level, so the phone's own bias is
  cancelled.
- **Zero the vehicle** the first time you park on level ground (check with a spirit
  level), with the phone in its usual spot, so the spot's own tilt is cancelled.
  The **⚠ Calibrate** and **⚠ Zero** lamps in the top bar remind you until each is done.
- **Targets** let you save an intentional tilt, for example toward the shower drain, and
  switch between them.
- The middle button of the bottom bar turns sound on and off, including the optional
  audio guidance while you drive onto the ramps and the optional spoken guidance that
  says which wheel to raise and how much.
- You can share your vehicle setup (measurements and ramps, never calibration) with a
  link, send feedback as a GitHub issue, and use the app in Swedish, English, French,
  Spanish or German.

Two platform notes:

- **iOS needs one tap.** Safari only releases motion data after a user gesture, so the app
  shows a "Start" button. Android grants access silently.
- **HTTPS is required.** Motion sensors are unavailable on plain HTTP origins.

## Sensorbox: an external sensor

Instead of the phone's own sensor, Libell can read a Bluetooth leveling box mounted in
the vehicle: the **EasyLevel** box (R32) or the **Xparkle RVS01** (R49). Tap the sensor
icon at the top right to connect; the box's own page then walks you through its
position, its direction and zeroing the vehicle. The Xparkle box stands upright; the
EasyLevel box lies flat, lid up, with one arrow pointing forward. With a box connected
it doesn't matter how the phone lies, and the phone needs no calibration.

This needs Web Bluetooth, which Chrome on Android has. If Chrome can't reconnect to the
box on its own after a restart, the box's page has an **Advanced** tip for turning that
on in `chrome://flags`. On iPhone, Safari and every other browser lack Web Bluetooth;
[the Bluefy browser is the supported workaround](docs/ios-easylevel-bluefy-guide.md).
What each box does is specified in [`docs/02-REQUIREMENTS.md`](docs/02-REQUIREMENTS.md).

## How leveling works

The measured gravity vector (from the phone or the box) gives the vehicle's roll and pitch; from your wheelbase and
track widths the app computes each wheel's required lift, taking the **highest wheel as
the reference** (blocks only go _under_ wheels). Because ramps are sold in pairs and most
owners carry only two or three, raising every low wheel independently is often not
physically possible, so a planning layer picks which wheels get which of your configured
ramp steps — favoring the plan that levels the vehicle with the fewest ramps and, when a
choice remains, keeps your waste-water drain side lowest. The vehicle counts as level
when no wheel sits more than the tolerance below the highest one. The full math, defaults
and display pipeline are specified in `docs/03-ARCHITECTURE.md`, and the ramp-planning
decision in `docs/adr/0011-ramp-plan-for-owned-ramps.md` — those documents are the single
source for the formulas.

## Tech

A TypeScript PWA built with Vite, with no UI framework and no backend, deployed as a
static site to GitHub Pages. The stack, layers and math are described in
[`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md), and the reasons behind them in
[`docs/adr/`](docs/adr/README.md).

## Developing

```sh
npm install
npm run dev           # http://localhost:5173/
```

The same query flags as in [Try the demo modes](#try-the-demo-modes) work on the dev
server, so the app runs on a machine with no sensors.
Every merge to `main` deploys to GitHub Pages at <https://libell.app/>; versions and release builds are described
in [ADR 0007](docs/adr/0007-pages-as-qa-and-versioning.md).

See [`docs/01-CONTRIBUTING.md`](docs/01-CONTRIBUTING.md) for the build, test and
deployment workflow, and [`CLAUDE.md`](CLAUDE.md) for the code rules.

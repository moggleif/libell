/**
 * Minimal i18n layer (issue #42): one flat dictionary per language, keyed
 * by message id. Language comes from a stored override when present,
 * otherwise from `navigator.language` (any `sv*` locale → Swedish,
 * everything else → English). The dictionaries are plain data so a unit
 * test can assert both languages cover the same keys.
 */

export const MESSAGES = {
  en: {
    'topbar.install': 'Install',
    'topbar.share': 'Share Libell',
    // Bottom action bar (#161): settings/sound/help, aria-labels only —
    // the settings/help buttons show fixed glyphs (☰ / ?), never text.
    'bottombar.settings': 'Settings',
    'bottombar.sound.mute': 'Mute sound',
    'bottombar.sound.unmute': 'Unmute sound',
    'bottombar.help': 'Help',
    'share.text': 'Level your motorhome with your phone.',
    'share.copied': 'Link copied!',
    'install.hint': 'Tap Share, then "Add to Home Screen".',

    'lamp.setup': '⚠ Setup',
    'lamp.setup.title': 'Vehicle settings have never been saved — tap to open Settings',
    'lamp.calibrate': '⚠ Calibrate',
    'lamp.calibrate.title': 'The phone is not calibrated — tap to open Calibration',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    // Deliberately just an icon/dot, no numbers — detail lives one tap
    // away in the "External sensor" menu page.
    'sensorStatus.connected': 'External sensor connected',
    'sensorStatus.disconnected': 'External sensor connection lost — tap for details',
    // Screen-cleanup follow-up: shown whenever the phone's own sensor is
    // active but an external one is available to connect — the only
    // remaining entry point to External sensor now that the ☰ menu no
    // longer carries it.
    'sensorStatus.idle': 'External sensor — tap to connect',

    'menu.title': 'Menu',
    'menu.close': 'Close menu',
    'menu.settings': 'Settings',
    'menu.calibration': 'Calibration',
    'menu.targets': 'Targets',
    'menu.feedback': 'Feedback',
    'menu.help': 'Help',
    'menu.intro': 'Show introduction',
    'menu.about': 'About Libell',
    // Short form for the "?" page's tab button (screen-cleanup follow-up)
    // — 'menu.about' above is the full title, too long for a tab pill.
    'menu.about.tab': 'About',
    'menu.sensorSource': 'External sensor',
    // Modern-only heading (#152) grouping External sensor + Targets above
    // "OTHER" — distinct key from settings.advanced (#157), a different
    // heading in a different part of the UI.
    'menu.advanced': 'ADVANCED',
    'menu.others': 'OTHER',
    'menu.card.notSaved': 'Not saved',
    'menu.card.notDone': 'Not done',

    // EasyLevel BLE box (#116) — an opt-in alternative to the phone's own
    // sensor, only ever shown when Web Bluetooth exists (`menu.ts`).
    'sensorSource.intro':
      "Connect an EasyLevel BLE box as an alternative to the phone's own sensor. " +
      'Requires Chrome on Android with Bluetooth turned on.',
    'sensorSource.connect': 'Connect EasyLevel sensor',
    'sensorSource.reconnect': 'Reconnect EasyLevel sensor',
    'sensorSource.disconnect': 'Disconnect',
    'sensorSource.status.phone': "Using the phone's own sensor.",
    'sensorSource.status.connected': 'Connected to the EasyLevel sensor.',
    'sensorSource.status.connecting': 'Connecting…',
    // Connection lost while the box stays the selected source (#129) —
    // distinct from the plain "connected" text above so the settings page
    // never claims a live link that no longer exists.
    'sensorSource.status.disconnected':
      'Connection to the EasyLevel sensor was lost — tap Reconnect.',
    'sensorSource.err.unsupported': 'Web Bluetooth is not supported in this browser.',
    'sensorSource.err.failed': 'Could not connect to the EasyLevel sensor.',

    // Detailed sensor health (#129). Battery/temperature show real decoded
    // values (#123) once the first `faf52c22-...` status notification
    // arrives — "not available yet" only before that. Signal strength
    // stays "not available yet": this app has no reliable, cross-browser
    // RSSI reading — never fabricated.
    'sensorSource.detail.heading': 'Sensor details',
    'sensorSource.detail.battery': 'Battery: {value}',
    'sensorSource.detail.rssi': 'Signal strength: {value}',
    'sensorSource.detail.temperature': 'Temperature: {value}',
    'sensorSource.detail.notAvailable': 'Not available yet',
    // Low-battery warning (#123): a settings-page notice, not a
    // leveling-screen interruption — see `easyLevelProtocol.ts`'s
    // `isLowBattery` for the threshold/hysteresis it is driven by.
    'sensorSource.lowBattery':
      '⚠ Low battery ({value}) — consider replacing the sensor box’s battery soon.',

    // Installation calibration (#131, ADR 0014): the same "vehicle zero"
    // concept R24 already applies to the phone, generalized to a
    // permanently-mounted external sensor — the ">15° looks wrong",
    // "age", and "Check" copy is intentionally reused from
    // `calibration.vehicle.*` / `calibration.*` rather than re-invented.
    // Shown only once EasyLevel is connected: an install offset means
    // nothing until there is a live reading to capture.
    'sensorSource.install.h': 'Installation offset',
    'sensorSource.install.intro':
      'Once the sensor is permanently mounted, its exact placement inside the ' +
      'enclosure stops mattering — only where the enclosure sits does. Level the ' +
      'vehicle verifiably once (spirit level, or after leveling with your ramps), ' +
      'then set the current reading as level.',
    'sensorSource.install.now': 'Set vehicle level',
    'sensorSource.install.clear': 'Clear installation offset',
    'sensorSource.install.status': 'Installation offset: side/side {roll}°, front/back {pitch}°.',
    'sensorSource.install.status.none': 'No installation offset — the raw reading counts as level.',

    // Diagnostics page (#133, R36): development/support detail, never
    // shown during normal leveling — see `diagnosticsSection.ts`.
    'menu.diagnostics': 'Diagnostics',
    'diagnostics.intro':
      'Technical detail for development and support — not needed for everyday leveling.',
    'diagnostics.row.source': 'Sensor source: {value}',
    'diagnostics.row.state': 'Connection state: {value}',
    'diagnostics.row.sampleRate': 'Sample rate: {value}',
    'diagnostics.row.lastSampleAge': 'Last sample: {value}',
    'diagnostics.row.rawTilt': 'Raw tilt: {value}',
    'diagnostics.row.calibratedTilt': 'Calibrated tilt: {value}',
    'diagnostics.row.target': 'Effective target: {value}',
    'diagnostics.row.battery': 'Battery: {value}',
    'diagnostics.row.temperature': 'Temperature: {value}',
    'diagnostics.row.rssi': 'Signal strength: {value}',
    'diagnostics.row.version': 'App version: {value}',
    'diagnostics.roll': 'roll',
    'diagnostics.pitch': 'pitch',
    // Reported, not measured (see the file-level comment in
    // `diagnosticsSection.ts` for why): honest, simple descriptions
    // instead of a fabricated precise number.
    'diagnostics.rate.phone': 'Continuous (device motion events, ≈60 Hz)',
    'diagnostics.rate.easylevel': 'Event-driven (BLE notifications, no fixed rate)',
    'diagnostics.age': '{s} s ago',
    'diagnostics.version.unknown': 'unknown',
    'diagnostics.copy': 'Copy diagnostics',
    'diagnostics.copied': 'Diagnostics copied!',
    'diagnostics.copy.failed': 'Could not copy automatically.',

    'about.text':
      'Libell helps you level your motorhome or caravan with the phone you ' +
      'already have — no bubble vials, no guessing.',
    'about.version': 'Version {v}',
    'about.offline':
      'Works fully offline — the network is only used to fetch updates of the app itself.',
    'about.privacy':
      'Everything stays on your phone — no account, no tracking, and no data ' +
      'ever leaves the device.',
    'about.source': 'Libell is free and open source (MIT license).',
    'about.source.link': 'Source code on GitHub',

    // Welcome step (design-review follow-up): the very first thing a new
    // user sees, before any question or form — what the app is for. Body
    // reuses 'about.text' verbatim rather than separate copy.
    'onboard.welcome.h': 'Welcome to Libell',
    'onboard.welcome.t':
      'This quick guide sets up your vehicle and phone. Every step can be skipped and ' +
      'finished later from Settings.',
    // Sound step (design review): Chime + Continuous audio guidance
    // together, split out of #189's combined 'general' step. No existing
    // section heading covers just these two (unlike 'settings.language'/
    // 'settings.appearance', reused as-is for their own steps), so this is
    // the one new short label the split needed.
    'onboard.sound.h': 'Sound',
    // Sensor source choice (#135, ADR 0014): the wizard's first step,
    // shown only when an external sensor option actually exists
    // (`isWebBluetoothSupported()`). The external radio reuses
    // 'menu.sensorSource' ("External sensor") for its label, not a
    // separate name here.
    'onboard.source.h': 'How do you want to measure?',
    // #189: reassures anyone unfamiliar with the external-sensor concept
    // that the default (pre-selected) choice is the normal one.
    'onboard.source.intro':
      'Choose which sensor Libell should read tilt from — most people just use the phone.',
    'onboard.source.phone': 'This phone',
    // Vehicle step: which vehicle every later step's imagery and field
    // labels are drawn for. Reuses 'vehicle.motorhome'/'vehicle.caravan' —
    // the exact same labels Settings uses — rather than separate copy.
    'onboard.vehicle.h': 'What are you leveling?',
    'onboard.vehicle.intro': 'Choose your vehicle — the rest of this guide matches it.',
    'onboard.step1.h': 'Place the phone like this',
    'onboard.next': 'Next',
    // Back (#189): only shown from the second step on — lets a wrong tap
    // (vehicle type, sensor source) be corrected without finishing the
    // wizard or closing and restarting it.
    'onboard.back': 'Back',
    'onboard.close': 'Close the introduction',
    'onboard.done': 'Done',
    'onboard.skipStep': 'Skip',
    'onboard.skipDefaults': 'Skip — use defaults',
    // What skipping actually means (#189) — "Skip" alone never said a
    // warning lamp (R11) stays lit until the step is done.
    'onboard.skip.consequence': 'Skip for now — a warning lamp will remind you until it’s done.',
    'onboard.legend.ok': 'Green ✓ — that wheel is level.',
    'onboard.legend.up': 'Orange ↑ — drive that wheel up onto the step shown.',
    'onboard.legend.no': 'Red ✕ — no step is enough; move to a flatter spot.',
    'onboard.legend.dim': 'Gray – — a low wheel your ramps don’t reach.',
    // Compact onboarding steps (#156): points to ☰ for everything the
    // reduced step doesn't show.
    'onboard.moreInMenu': 'More options are available later in Settings.',
    'settings.wheelbase': 'Wheelbase',
    'settings.trackFront': 'Track width front',
    'settings.trackRear': 'Track width rear',
    'settings.tolerance': 'Tolerance',
    'settings.stability': 'Stability',
    'settings.dwellRest': 'Response delay (ms)',
    'settings.dwellMotion': 'Response delay while adjusting (ms)',
    'settings.dwell.hint':
      'How long a reading must hold steady before the shown number changes. The second ' +
      "value applies only right after a change, while you're actively adjusting (e.g. " +
      "driving up a ramp), so the live number doesn't lag behind.",
    'settings.vehicle': 'Vehicle',
    'vehicle.motorhome': 'Motorhome',
    'vehicle.caravan': 'Caravan',
    'settings.axleToJockey': 'Axle to jockey wheel',
    'settings.rearAxle': 'Rear axle',
    'settings.axle': 'Axle',
    'axle.single': 'Single',
    'axle.boggie': 'Tandem (boggie)',
    'settings.track': 'Track width',
    'settings.measureHint':
      'Wheelbase and track widths are in the registration document or the handbook — ' +
      'a tape measure works too; a few cm of error hardly matters.',
    'settings.measureHint.boggie': 'With a boggie, measure to the centre of the axle pair.',
    'settings.steps': 'Ramp step heights',
    'settings.steps.add': 'Add step',
    'settings.steps.remove': 'Remove {value}',
    'settings.ramp': 'Ready-made ramp',
    'settings.ramp.custom': 'Custom set',
    'settings.rampCount': 'Number of ramps',
    'settings.drain': 'Drain side',
    'settings.rampHint': 'The app picks where your ramps do the most good.',
    // Split out of the old combined rampHint (design review): only matters
    // if the owner cares where sink/shower water drains, so it moved
    // behind the Drain field's own Advanced disclosure instead of always
    // showing next to the ramp steps.
    'settings.drainHint':
      'Matters only if you care where sink/shower water drains — within the ' +
      'tolerance, the app then leaves this side lowest so it keeps draining.',
    'settings.section.vehicle': 'Vehicle & measurements',
    'settings.section.ramps': 'Ramps',
    'settings.section.display': 'Level & display',
    // General (screen-cleanup follow-up): language/theme/sound, common
    // enough to want a visible home — a Modern tab, or this Classic
    // section — rather than Advanced's rarely-tuned pile.
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.language.auto': 'Automatic (device language)',
    'settings.advanced': 'Advanced',
    // Design review: the fields inside Advanced had labels but no
    // explanation of what they actually do — this is why the disclosure
    // "saknar beskrivning" (was missing a description).
    'settings.advanced.hint':
      'Tolerance sets how close to level counts as "level" — tighter for a shower or ' +
      'fridge, looser if close enough is fine. Stability smooths out small sensor jitter ' +
      'so the numbers do not flicker.',
    'drain.none': 'None / does not matter',
    // "Middle" (design review): the mean of the two wheels on that edge —
    // a coarser preference than a single corner, now that corners exist
    // below as their own choice.
    'drain.left': 'Left, middle',
    'drain.right': 'Right, middle',
    'drain.front': 'Front, middle',
    'drain.rear': 'Rear, middle',
    // Single-corner positions (design review): match a waste-water outlet
    // that sits at one specific corner, not spread across a whole side.
    'drain.frontLeft': 'Front left',
    'drain.frontRight': 'Front right',
    'drain.rearLeft': 'Rear left',
    'drain.rearRight': 'Rear right',
    'settings.unit': 'Show lengths in',
    'settings.theme': 'Theme',
    'theme.system': 'Follow the phone',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'settings.appearance': 'Appearance',
    'appearance.classic': 'Classic',
    'appearance.modern': 'Modern',
    // Design review: the color change previews immediately, same as Theme
    // — this only explains why the *layout* (tabs vs. one long page) does
    // not visibly switch until Settings is reopened.
    'settings.appearance.hint':
      'Colors update immediately; the full Modern layout takes effect next time you open Settings.',
    'settings.sound': 'Chime when level',
    'settings.soundGuidance': 'Continuous audio guidance',
    'settings.soundGuidance.help':
      'A pulse speeds up and rises in pitch as you approach level, with a distinct ' +
      'signal for getting closer vs. moving the wrong way — so you can watch the ' +
      'ramps instead of the screen. Pauses while the vehicle moves or is unsteady.',
    'settings.save': 'Save',
    'settings.undo': 'Undo changes',
    'settings.reset': 'Reset to defaults',

    'settings.tab.vehicle': 'Vehicle',
    'settings.tab.ramps': 'Ramps',
    'settings.klossar.brandAll': 'All',
    'settings.klossar.pinnedSub': '{lengths} · {steps}',
    'settings.klossar.step.one': '1 step',
    'settings.klossar.step.many': '{n} steps',
    'settings.klossar.stepsHeading': 'Step heights',

    'status.measuring': 'Measuring…',
    'status.almost': 'Almost level — {left} left',
    'status.one': '1 wheel to raise',
    'status.many': '{n} wheels to raise',
    'status.cantLevel.close': 'Your ramps get close but not enough here — move the vehicle',
    'status.cantLevel.far': 'Your ramps are way off here — move the vehicle',

    'calibration.intro':
      'Put the phone on a surface you know is level, then tap Calibrate now. ' +
      'The current tilt becomes the zero point.',
    'calibration.status': 'Calibrated: side/side {roll}°, front/back {pitch}°.',
    'calibration.status.none': 'Not calibrated — using the raw sensor.',
    'calibration.now': 'Calibrate now',
    'calibration.clear': 'Clear calibration',
    'calibration.err.notRunning':
      'The tilt sensor is not running yet — tap Start on the main screen first.',
    'calibration.err.notFlat':
      'The phone does not look flat — place it on a level surface and try again.',
    // Design review: both card headings now lead with the verb "Calibrate"
    // — they used to name what each card was about ("Phone sensor",
    // "Vehicle zero position") without naming the shared action.
    'calibration.sensor.h': 'Calibrate the phone',
    'calibration.vehicle.h': 'Calibrate the vehicle zero',
    // Design review: the two-layer overview used to live only on the Help
    // page ('help.calibration.t' below) — moved to the top of the actual
    // Kalibrering tab, where it is actionable, not just informational.
    'calibration.guide.intro':
      'Two layers:\n' +
      '1. Calibrate the phone once on a level surface (or with the 180° flip).\n' +
      "2. With the vehicle verifiably level, set the phone's normal spot as the " +
      'vehicle zero — then a slightly tilting table is cancelled out too.',
    'calibration.vehicle.intro':
      'The sensor calibration zeroes the phone — not the spot where it lies. If the ' +
      'table tilts slightly, the app would always show that tilt. Level the vehicle ' +
      'verifiably once (spirit level, or after leveling with your ramps), put the ' +
      'phone in its normal place, and set that as level.',
    'calibration.vehicle.now': 'Set current position as level',
    'calibration.vehicle.clear': 'Clear vehicle zero',
    'calibration.vehicle.status': 'Vehicle zero: side/side {roll}°, front/back {pitch}°.',
    'calibration.vehicle.status.none': 'No vehicle zero — the phone spot counts as flat.',
    'calibration.vehicle.err.notFlat':
      'That looks like more than placement tilt (>15°) — is the vehicle really level?',
    'calibration.age.today': '(today)',
    'calibration.age.days': '({n} days ago)',
    'calibration.check': 'Check',
    'calibration.check.good': 'Still good — off by {off}°.',
    'calibration.check.off': 'Off by {off}° — consider recalibrating.',
    'calibration.flip.intro':
      'No level surface around? Use flip calibration: put the phone down anywhere ' +
      'reasonably flat, capture, rotate the phone half a turn (180°) on the same ' +
      'spot, capture again — the surface tilt cancels itself out.',
    'calibration.flip.start': 'Calibrate by flipping',
    'calibration.flip.rotate':
      'Now rotate the phone half a turn (180°) on the same spot, then tap Capture.',
    'calibration.flip.capture': 'Capture',
    'calibration.flip.done': 'Done! Your surface leans {surface}° — cancelled out.',
    'calibration.flip.err.moved':
      'The two captures do not match — did the phone move? Try again from the start.',
    // Short status-pill labels for the Modern calibration cards (#109).
    'calibration.pill.notDone': 'NOT DONE',
    'calibration.pill.done': 'DONE',
    'calibration.pill.none': 'NONE',

    // Target presets (#122, ADR 0013): an intentional NON-level target,
    // distinct from the calibration layers above — "Normal" (true level)
    // is always available and is not one of the saved presets.
    'targets.intro':
      'Save an intentional tilt — for the shower or grey-water drain — and switch ' +
      'to it in a couple of taps. Normal (level) is always available and is never ' +
      'overwritten.',
    'targets.normal': 'Normal (level)',
    'targets.name.placeholder': 'Name (e.g. "Shower drain")',
    'targets.add': 'Save current tilt as new target',
    'targets.delete': 'Delete {name}',
    'targets.err.tooSteep': 'That looks like more than an intentional target (>15°) — try again.',
    'targets.badge': 'Target: {name}',
    // Offset summary (#160): read-only, inside the menu only — never the
    // main screen (see targetBadge.ts/R31's own guard against that).
    'menu.offsetSummary':
      'Level is calculated from: sensor {sensor} · vehicle zero {vehicleZero} · target: {target}',

    'feedback.intro':
      'Found a problem or have an idea? Fill this in and tap the button — it opens ' +
      'a ready-made report on GitHub where you post it (a free GitHub account is ' +
      'needed, created in a minute).',
    'feedback.category': 'What is it about?',
    'feedback.cat.bug': 'Bug',
    'feedback.cat.suggestion': 'Suggestion',
    'feedback.cat.other': 'Other',
    'feedback.title': 'Short title',
    'feedback.desc': 'What happened, or what do you wish for?',
    'feedback.submit': 'Open the report on GitHub',

    'help.what.h': 'What Libell does',
    'help.what.t':
      'Lay the phone flat inside the vehicle with the top toward the front. ' +
      'The screen shows your vehicle from above, and each wheel tells you what to do.',
    'help.first.h': 'Before the first use',
    'help.first.t':
      'Fill in Settings and calibrate once — the yellow signs in the top bar remind ' +
      'you until both are done. Everything is remembered.',
    'help.screen.h': 'Reading the screen',
    'help.screen.t':
      'Green ✓: done.\n' +
      'Orange ↑: drive that wheel up on the step shown above it.\n' +
      'Red ✕: not even your highest step is enough — move to a flatter spot.\n' +
      'Gray –: a low wheel your ramps do not stretch to.\n' +
      'When the bubble rests in the middle, you are level.',
    'help.settings.h': 'The measurements',
    // Design review: used to say "L is the wheelbase, W the track width",
    // but the illustration below stopped drawing those letters (see
    // `helpIllustrations.ts`'s `measuresIllustration`) — the text still
    // promised letters the picture no longer shows.
    'help.settings.t':
      'Wheelbase is the distance between the front and rear axles; track width is the ' +
      'distance between the left and right wheels (front and rear can differ) — usually ' +
      'in the vehicle papers, or use a tape measure.\n' +
      'Tolerance = how strict "level" is.\n' +
      'Stability keeps the numbers calm.',
    // Design review: used to be one sentence inside "The measurements"
    // ("Add your ramp steps...") — moved to its own topic, matching Ramps'
    // status elsewhere (its own wizard step, its own Settings tab).
    'help.ramps.t':
      'Pick a ready-made ramp model, or add your own step heights with the + button. ' +
      'The app then picks where your ramps do the most good — and, within the ' +
      'tolerance, leaves the drain side lowest so sink and shower keep draining.',
    'help.calibration.h': 'Calibration',
    // Design review: the step-by-step "how" moved to the actual
    // Kalibrering tab ('calibration.guide.intro' above) where it is
    // actionable — this stays the "why" instead of repeating it.
    'help.calibration.t':
      "The phone reads its own tilt, not the ground's — and a vehicle floor is rarely " +
      'perfectly flat either. Calibrating corrects for both, so what the app shows is ' +
      'the actual ground, not just how the phone happens to sit.',
    'help.notes.h': 'Good to know',
    'help.notes.t':
      'Works fully offline once opened — add it to your home screen like an app.\n' +
      'On iPhone, tap Start each time.\n' +
      'The version number at the bottom helps when reporting problems.',

    'main.hint': 'Lay your phone flat inside your motorhome, top edge toward the front.',
    'main.start': 'Start',
    'main.waiting': 'Waiting for the tilt sensor…',
    'main.level': 'Your motorhome is level!',
    'main.denied':
      'Motion access was denied, so Libell cannot read the tilt. ' +
      'Allow motion & orientation access for this site and reload.',
    'main.noSensors': 'This device does not expose motion sensors, so Libell cannot read the tilt.',
    'main.https':
      'Libell needs a secure connection (HTTPS) to read the tilt sensors. ' +
      'Open the app over HTTPS and try again.',

    'diagram.aria': 'Top-down view of your motorhome showing which wheels need raising',
    'diagram.caravan.aria':
      'Top-down view of your caravan showing the axle wheels and the jockey wheel',
    'diagram.front': 'Front',
    'diagram.step': 'Step {n}',
    'diagram.done': 'Done',
    // Gray/"unserved" wheel (low, but no ramp reaches it, R5) — says why
    // nothing is happening there instead of leaving the step line blank
    // (screen-cleanup follow-up).
    'diagram.noRamp': 'No ramp',
    'diagram.wheel.frontLeft': 'FRONT L',
    'diagram.wheel.frontRight': 'FRONT R',
    'diagram.wheel.rearLeft': 'REAR L',
    'diagram.wheel.rearRight': 'REAR R',
    'caravan.crankUp': 'Crank up',
    'caravan.crankDown': 'Crank down',
    'status.crank.up': 'Crank the jockey wheel up',
    'status.crank.down': 'Crank the jockey wheel down',
    'status.caravan.both': 'Ramp the wheel, then crank the jockey wheel',

    'tilt.frontBack': 'Front/back',
    'tilt.sideSide': 'Side/side',

    'pose.layFlat': 'Lay the phone flat to measure',
    'pose.portrait': 'Turn the phone upright (portrait) — the top edge must point forward',

    'stale.dataUnavailable': 'No new sensor data — guidance is paused until it returns',

    // Sensor unavailable fallback prompt (#134): shown instead of the
    // plain "waiting" hint once an EasyLevel connection cannot be
    // reached — never a silent or automatic switch to the phone (ADR
    // 0014's calibration split), always this explicit Retry / "Use phone
    // sensor" choice.
    'sensorFallback.unavailable': 'External sensor unavailable.',
    'sensorFallback.phoneHint':
      'The phone sensor needs the phone lying flat inside the vehicle — a permanently ' +
      'mounted box does not.',
    'sensorFallback.retry': 'Retry',
    'sensorFallback.usePhone': 'Use phone sensor',
  },
  sv: {
    'topbar.install': 'Installera',
    'topbar.share': 'Dela Libell',
    'bottombar.settings': 'Inställningar',
    'bottombar.sound.mute': 'Stäng av ljud',
    'bottombar.sound.unmute': 'Slå på ljud',
    'bottombar.help': 'Hjälp',
    'share.text': 'Få husbilen i våg med telefonen.',
    'share.copied': 'Länken kopierad!',
    'install.hint': 'Tryck på Dela och sedan "Lägg till på hemskärmen".',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    'sensorStatus.connected': 'Extern sensor ansluten',
    'sensorStatus.disconnected': 'Extern sensor — anslutningen bröts, tryck för detaljer',
    'sensorStatus.idle': 'Extern sensor — tryck för att ansluta',

    'lamp.setup': '⚠ Mått',
    'lamp.setup.title':
      'Fordonsinställningarna har aldrig sparats — tryck för att öppna Inställningar',
    'lamp.calibrate': '⚠ Kalibrera',
    'lamp.calibrate.title': 'Telefonen är inte kalibrerad — tryck för att öppna Kalibrering',

    'menu.title': 'Meny',
    'menu.close': 'Stäng menyn',
    'menu.settings': 'Inställningar',
    'menu.calibration': 'Kalibrering',
    'menu.targets': 'Mål',
    'menu.feedback': 'Feedback',
    'menu.help': 'Hjälp',
    'menu.intro': 'Visa introduktionen',
    'menu.about': 'Om Libell',
    'menu.about.tab': 'Om',
    'menu.sensorSource': 'Extern sensor',
    'menu.advanced': 'AVANCERAT',
    'menu.others': 'ÖVRIGT',
    'menu.card.notSaved': 'Ej sparade',
    'menu.card.notDone': 'Ej gjord',

    // EasyLevel-boxen via BLE (#116) — ett tillval utöver telefonens egen
    // sensor, visas bara när Web Bluetooth finns (`menu.ts`).
    'sensorSource.intro':
      'Anslut en EasyLevel-box via Bluetooth som alternativ till telefonens egen ' +
      'sensor. Kräver Chrome på Android med Bluetooth påslaget.',
    'sensorSource.connect': 'Anslut EasyLevel-sensor',
    'sensorSource.reconnect': 'Återanslut EasyLevel-sensor',
    'sensorSource.disconnect': 'Koppla från',
    'sensorSource.status.phone': 'Använder telefonens egen sensor.',
    'sensorSource.status.connected': 'Ansluten till EasyLevel-sensorn.',
    'sensorSource.status.connecting': 'Ansluter…',
    'sensorSource.status.disconnected':
      'Anslutningen till EasyLevel-sensorn bröts — tryck på Återanslut.',
    'sensorSource.err.unsupported': 'Den här webbläsaren stöder inte Web Bluetooth.',
    'sensorSource.err.failed': 'Kunde inte ansluta till EasyLevel-sensorn.',

    'sensorSource.detail.heading': 'Sensordetaljer',
    'sensorSource.detail.battery': 'Batteri: {value}',
    'sensorSource.detail.rssi': 'Signalstyrka: {value}',
    'sensorSource.detail.temperature': 'Temperatur: {value}',
    'sensorSource.detail.notAvailable': 'Inte tillgängligt ännu',
    'sensorSource.lowBattery':
      '⚠ Låg batterinivå ({value}) — överväg att byta batteri i sensorboxen snart.',

    // Installationskalibrering (#131, ADR 0014): samma "fordonets nolläge"
    // som R24 redan använder för telefonen, generaliserat till en permanent
    // monterad extern sensor.
    'sensorSource.install.h': 'Installationsoffset',
    'sensorSource.install.intro':
      'När sensorn är permanent monterad spelar dess exakta placering i höljet ' +
      'inte längre någon roll — bara var höljet sitter gör det. Ställ fordonet ' +
      'verifierat plant en gång (vattenpass, eller efter nivellering med ' +
      'ramperna), och sätt sedan den aktuella avläsningen som plan.',
    'sensorSource.install.now': 'Sätt fordonet som plant',
    'sensorSource.install.clear': 'Rensa installationsoffset',
    'sensorSource.install.status': 'Installationsoffset: sidled {roll}°, längsled {pitch}°.',
    'sensorSource.install.status.none':
      'Inget installationsoffset — den råa avläsningen räknas som plan.',

    // Diagnostikvy (#133, R36): utvecklings-/supportdetaljer, visas aldrig
    // under vanlig nivellering — se `diagnosticsSection.ts`.
    'menu.diagnostics': 'Diagnostik',
    'diagnostics.intro':
      'Teknisk detaljinformation för utveckling och support — behövs inte för ' +
      'vardaglig nivellering.',
    'diagnostics.row.source': 'Sensorkälla: {value}',
    'diagnostics.row.state': 'Anslutningsstatus: {value}',
    'diagnostics.row.sampleRate': 'Samplingsfrekvens: {value}',
    'diagnostics.row.lastSampleAge': 'Senaste mätvärde: {value}',
    'diagnostics.row.rawTilt': 'Rå lutning: {value}',
    'diagnostics.row.calibratedTilt': 'Kalibrerad lutning: {value}',
    'diagnostics.row.target': 'Aktivt mål: {value}',
    'diagnostics.row.battery': 'Batteri: {value}',
    'diagnostics.row.temperature': 'Temperatur: {value}',
    'diagnostics.row.rssi': 'Signalstyrka: {value}',
    'diagnostics.row.version': 'Appversion: {value}',
    'diagnostics.roll': 'roll',
    'diagnostics.pitch': 'pitch',
    'diagnostics.rate.phone': 'Kontinuerlig (rörelsehändelser, ≈60 Hz)',
    'diagnostics.rate.easylevel': 'Händelsestyrd (BLE-notiser, ingen fast frekvens)',
    'diagnostics.age': '{s} s sedan',
    'diagnostics.version.unknown': 'okänd',
    'diagnostics.copy': 'Kopiera diagnostik',
    'diagnostics.copied': 'Diagnostik kopierad!',
    'diagnostics.copy.failed': 'Kunde inte kopiera automatiskt.',

    'about.text':
      'Libell hjälper dig att få husbilen eller husvagnen i våg med telefonen ' +
      'du redan har — inget vattenpass, inget gissande.',
    'about.version': 'Version {v}',
    'about.offline':
      'Fungerar helt utan internet — nätet används bara för att hämta appens ' +
      'egna uppdateringar.',
    'about.privacy':
      'Allt stannar i din telefon — inget konto, ingen spårning och ingen data ' +
      'lämnar någonsin enheten.',
    'about.source': 'Libell är fri och öppen källkod (MIT-licens).',
    'about.source.link': 'Källkoden på GitHub',

    'onboard.welcome.h': 'Välkommen till Libell',
    'onboard.welcome.t':
      'Den här snabbguiden ställer in ditt fordon och din telefon. Varje steg går att ' +
      'hoppa över och avsluta senare från Inställningar.',
    'onboard.sound.h': 'Ljud',
    'onboard.source.h': 'Hur vill du mäta?',
    'onboard.source.intro':
      'Välj vilken sensor Libell ska läsa lutning från — de flesta använder bara telefonen.',
    'onboard.source.phone': 'Den här telefonen',
    'onboard.vehicle.h': 'Vad ska nivelleras?',
    'onboard.vehicle.intro': 'Välj fordon — resten av guiden anpassas efter det.',
    'onboard.step1.h': 'Lägg telefonen så här',
    'onboard.next': 'Nästa',
    'onboard.back': 'Tillbaka',
    'onboard.close': 'Stäng introduktionen',
    'onboard.done': 'Klart',
    'onboard.skipStep': 'Hoppa över',
    'onboard.skipDefaults': 'Hoppa över — använd standardvärden',
    'onboard.skip.consequence': 'Hoppa över nu — en varningslampa påminner dig tills det är klart.',
    'onboard.legend.ok': 'Grönt ✓ — hjulet står i våg.',
    'onboard.legend.up': 'Orange ↑ — kör upp hjulet på steget som visas.',
    'onboard.legend.no': 'Rött ✕ — inget steg räcker; flytta till ett planare ställe.',
    'onboard.legend.dim': 'Grått – — ett lågt hjul som ramperna inte når.',
    'onboard.moreInMenu': 'Fler alternativ finns senare i Inställningar.',

    'settings.wheelbase': 'Hjulbas',
    'settings.trackFront': 'Spårvidd fram',
    'settings.trackRear': 'Spårvidd bak',
    'settings.tolerance': 'Tolerans',
    'settings.stability': 'Stabilitet',
    'settings.dwellRest': 'Svarsfördröjning (ms)',
    'settings.dwellMotion': 'Svarsfördröjning vid justering (ms)',
    'settings.dwell.hint':
      'Hur länge en mätning måste hålla i sig innan den visade siffran ändras. Det andra ' +
      'värdet gäller bara direkt efter en ändring, medan du aktivt justerar (t.ex. kör upp ' +
      'på en ramp), så att siffran inte släpar efter.',
    'settings.vehicle': 'Fordon',
    'vehicle.motorhome': 'Husbil',
    'vehicle.caravan': 'Husvagn',
    'settings.axleToJockey': 'Axel till stödhjul',
    'settings.rearAxle': 'Bakaxel',
    'settings.axle': 'Axel',
    'axle.single': 'Enkel',
    'axle.boggie': 'Boggie',
    'settings.track': 'Spårvidd',
    'settings.measureHint':
      'Hjulbas och spårvidd står i registreringsbeviset eller handboken — tumstock ' +
      'funkar också; några centimeters fel spelar knappast någon roll.',
    'settings.measureHint.boggie': 'Med boggie mäter du till mitten av axelparet.',
    'settings.steps': 'Rampens steghöjder',
    'settings.steps.add': 'Lägg till steg',
    'settings.steps.remove': 'Ta bort {value}',
    'settings.ramp': 'Färdig ramp',
    'settings.ramp.custom': 'Egen uppsättning',
    'settings.rampCount': 'Antal ramper',
    'settings.drain': 'Avloppssida',
    'settings.rampHint': 'Appen väljer var ramperna gör mest nytta.',
    'settings.drainHint':
      'Spelar bara roll om det är viktigt var disk- eller duschvattnet rinner — inom ' +
      'toleransen lämnas den här sidan lägst så att det fortsätter rinna undan.',
    'settings.section.vehicle': 'Fordon och mått',
    'settings.section.ramps': 'Ramper',
    'settings.section.display': 'Nivå och visning',
    'settings.general': 'Allmänt',
    'settings.language': 'Språk',
    'settings.language.auto': 'Automatiskt (enhetens språk)',
    'settings.advanced': 'Avancerat',
    'settings.advanced.hint':
      'Tolerans avgör hur nära i våg som räknas som "i våg" — snävare för dusch eller ' +
      'kylskåp, mer tillåtande om det bara ska vara tillräckligt bra. Stabilitet jämnar ' +
      'ut små skakningar i sensorn så att siffrorna inte hoppar.',
    'drain.none': 'Inget / spelar ingen roll',
    'drain.left': 'Vänster, mitt',
    'drain.right': 'Höger, mitt',
    'drain.front': 'Fram, mitt',
    'drain.rear': 'Bak, mitt',
    'drain.frontLeft': 'Vänster fram',
    'drain.frontRight': 'Höger fram',
    'drain.rearLeft': 'Vänster bak',
    'drain.rearRight': 'Höger bak',
    'settings.unit': 'Visa längder i',
    'settings.theme': 'Tema',
    'theme.system': 'Följ telefonen',
    'theme.light': 'Ljust',
    'theme.dark': 'Mörkt',
    'settings.appearance': 'Utseende',
    'appearance.classic': 'Klassisk',
    'appearance.modern': 'Modern',
    'settings.appearance.hint':
      'Färgerna uppdateras direkt; hela Modern-layouten gäller nästa gång du öppnar ' +
      'Inställningar.',
    'settings.sound': 'Ljudsignal när det är i våg',
    'settings.soundGuidance': 'Kontinuerlig ljudvägledning',
    'settings.soundGuidance.help':
      'En puls blir snabbare och stiger i tonhöjd ju närmare våg du kommer, med en ' +
      'tydlig signal för om du närmar dig eller rör dig åt fel håll — så att du kan ' +
      'titta på klossarna istället för skärmen. Pausar medan fordonet rör sig eller ' +
      'är ostadigt.',
    'settings.save': 'Spara',
    'settings.undo': 'Ångra ändringar',
    'settings.reset': 'Återställ standard',

    'settings.tab.vehicle': 'Fordon',
    'settings.tab.ramps': 'Klossar',
    'settings.klossar.brandAll': 'Alla',
    'settings.klossar.pinnedSub': '{lengths} · {steps}',
    'settings.klossar.step.one': '1 steg',
    'settings.klossar.step.many': '{n} steg',
    'settings.klossar.stepsHeading': 'Steghöjder',

    'status.measuring': 'Mäter…',
    'status.almost': 'Nästan i våg — {left} kvar',
    'status.one': '1 hjul att höja',
    'status.many': '{n} hjul att höja',
    'status.cantLevel.close': 'Ramperna räcker nästan här — flytta fordonet',
    'status.cantLevel.far': 'Ramperna räcker inte alls här — flytta fordonet',

    'calibration.intro':
      'Lägg telefonen på en yta du vet är plan och tryck sedan på Kalibrera nu. ' +
      'Den aktuella lutningen blir nollpunkten.',
    'calibration.status': 'Kalibrerad: sidled {roll}°, längsled {pitch}°.',
    'calibration.status.none': 'Inte kalibrerad — använder sensorn som den är.',
    'calibration.now': 'Kalibrera nu',
    'calibration.clear': 'Rensa kalibrering',
    'calibration.err.notRunning':
      'Lutningssensorn är inte igång ännu — tryck på Start på huvudskärmen först.',
    'calibration.err.notFlat':
      'Telefonen verkar inte ligga plant — lägg den på en plan yta och försök igen.',
    'calibration.sensor.h': 'Kalibrera telefonen',
    'calibration.vehicle.h': 'Kalibrera fordonets nolläge',
    'calibration.guide.intro':
      'Två lager:\n' +
      '1. Kalibrera telefonen en gång på en plan yta (eller med 180°-vändningen).\n' +
      '2. När fordonet står verifierat plant: sätt telefonens vanliga plats som ' +
      'fordonets nolläge — då räknas även ett lutande bord bort.',
    'calibration.vehicle.intro':
      'Sensorkalibreringen nollar telefonen — inte platsen där den ligger. Lutar ' +
      'bordet lite visar appen alltid den lutningen. Ställ fordonet verifierat ' +
      'plant en gång (vattenpass, eller efter nivellering med ramperna), lägg ' +
      'telefonen på sin vanliga plats och sätt det som plant.',
    'calibration.vehicle.now': 'Sätt nuvarande läge som plant',
    'calibration.vehicle.clear': 'Rensa nolläget',
    'calibration.vehicle.status': 'Fordonets nolläge: sidled {roll}°, längsled {pitch}°.',
    'calibration.vehicle.status.none': 'Inget nolläge — telefonens plats räknas som plan.',
    'calibration.vehicle.err.notFlat':
      'Det ser ut som mer än platslutning (>15°) — står fordonet verkligen plant?',
    'calibration.age.today': '(idag)',
    'calibration.age.days': '(för {n} dagar sedan)',
    'calibration.check': 'Kontrollera',
    'calibration.check.good': 'Fortfarande bra — avviker {off}°.',
    'calibration.check.off': 'Avviker {off}° — överväg att kalibrera om.',
    'calibration.flip.intro':
      'Ingen plan yta i närheten? Använd vändkalibrering: lägg telefonen på något ' +
      'någorlunda plant, fånga, vrid telefonen ett halvt varv (180°) på samma ' +
      'ställe, fånga igen — ytans lutning tar ut sig själv.',
    'calibration.flip.start': 'Kalibrera genom att vända',
    'calibration.flip.rotate':
      'Vrid nu telefonen ett halvt varv (180°) på samma ställe och tryck sedan på Fånga.',
    'calibration.flip.capture': 'Fånga',
    'calibration.flip.done': 'Klart! Din yta lutar {surface}° — borträknat.',
    'calibration.flip.err.moved':
      'De två mätningarna stämmer inte överens — flyttades telefonen? Börja om.',
    // Korta statusetiketter för Modern-kalibreringens kort (#109).
    'calibration.pill.notDone': 'EJ GJORD',
    'calibration.pill.done': 'GJORD',
    'calibration.pill.none': 'INGET',

    // Sparade mål/presets (#122, ADR 0013): ett avsiktligt ICKE-plant mål,
    // skilt från kalibreringslagren ovan — "Normal" (i våg) finns alltid
    // kvar och är inte ett av de sparade målen.
    'targets.intro':
      'Spara en avsiktlig lutning — för dusch- eller gråvattenavlopp — och växla ' +
      'till den på ett par tryck. Normal (i våg) finns alltid kvar och skrivs ' +
      'aldrig över.',
    'targets.normal': 'Normal (i våg)',
    'targets.name.placeholder': 'Namn (t.ex. "Duschavlopp")',
    'targets.add': 'Spara aktuell lutning som nytt mål',
    'targets.delete': 'Ta bort {name}',
    'targets.err.tooSteep': 'Det ser ut som mer än ett avsiktligt mål (>15°) — försök igen.',
    'targets.badge': 'Mål: {name}',
    'menu.offsetSummary':
      'Nivån beräknas från: sensor {sensor} · fordonets nolläge {vehicleZero} · mål: {target}',

    'feedback.intro':
      'Har du hittat ett problem eller har en idé? Fyll i det här och tryck på ' +
      'knappen — då öppnas en färdig rapport på GitHub som du postar (ett gratis ' +
      'GitHub-konto behövs och skapas på en minut).',
    'feedback.category': 'Vad gäller det?',
    'feedback.cat.bug': 'Bugg',
    'feedback.cat.suggestion': 'Förslag',
    'feedback.cat.other': 'Övrigt',
    'feedback.title': 'Kort rubrik',
    'feedback.desc': 'Vad hände, eller vad önskar du dig?',
    'feedback.submit': 'Öppna rapporten på GitHub',

    'help.what.h': 'Vad Libell gör',
    'help.what.t':
      'Lägg telefonen plant i fordonet med ovansidan mot fronten. Skärmen visar ' +
      'fordonet ovanifrån, och varje hjul talar om vad du ska göra.',
    'help.first.h': 'Före första användningen',
    'help.first.t':
      'Fyll i Inställningar och kalibrera en gång — de gula skyltarna i listen ' +
      'påminner tills båda är gjorda. Allt sparas.',
    'help.screen.h': 'Så läser du skärmen',
    'help.screen.t':
      'Grönt ✓: klart.\n' +
      'Orange ↑: kör upp hjulet på steget som visas ovanför.\n' +
      'Rött ✕: inte ens ditt högsta steg räcker — flytta till ett planare ställe.\n' +
      'Grått –: ett lågt hjul som ramperna inte räcker till.\n' +
      'När bubblan vilar i mitten står du i våg.',
    'help.settings.h': 'Måtten',
    'help.settings.t':
      'Hjulbasen är avståndet mellan fram- och bakaxeln, spårvidden avståndet mellan ' +
      'vänster och höger hjul (fram och bak kan skilja sig) — står oftast i ' +
      'fordonspapperen, annars tumstock.\n' +
      'Tolerans = hur strikt "i våg" är.\n' +
      'Stabilitet håller siffrorna lugna.',
    'help.ramps.t':
      'Välj en färdig ramp, eller lägg till egna steghöjder med plusknappen. Appen ' +
      'väljer sedan var ramperna gör mest nytta — och lämnar avloppssidan lägst ' +
      'inom toleransen, så att disk- och duschvattnet rinner undan.',
    'help.calibration.h': 'Kalibrering',
    'help.calibration.t':
      'Telefonen läser sin egen lutning, inte markens — och fordonets golv är sällan ' +
      'helt plant heller. Kalibrering rättar till båda delarna, så det appen visar är ' +
      'den verkliga marken, inte bara hur telefonen råkar ligga.',
    'help.notes.h': 'Bra att veta',
    'help.notes.t':
      'Fungerar helt utan internet när den väl öppnats — lägg den på hemskärmen ' +
      'som en app.\n' +
      'På iPhone trycker du Start varje gång.\n' +
      'Versionsnumret längst ner är bra vid felanmälan.',

    'main.hint': 'Lägg telefonen plant i husbilen, med ovansidan mot fronten.',
    'main.start': 'Start',
    'main.waiting': 'Väntar på lutningssensorn…',
    'main.level': 'Din husbil står i våg!',
    'main.denied':
      'Åtkomst till rörelsesensorerna nekades, så Libell kan inte läsa lutningen. ' +
      'Tillåt rörelse och orientering för den här webbplatsen och ladda om.',
    'main.noSensors': 'Den här enheten saknar rörelsesensorer, så Libell kan inte läsa lutningen.',
    'main.https':
      'Libell behöver en säker anslutning (HTTPS) för att läsa lutningssensorerna. ' +
      'Öppna appen via HTTPS och försök igen.',

    'diagram.aria': 'Din husbil ovanifrån, med hjulen som behöver höjas markerade',
    'diagram.caravan.aria': 'Din husvagn ovanifrån, med axelhjulen och stödhjulet',
    'diagram.front': 'Fram',
    'diagram.step': 'Steg {n}',
    'diagram.done': 'Klart',
    'diagram.noRamp': 'Ingen ramp',
    'diagram.wheel.frontLeft': 'V FRAM',
    'diagram.wheel.frontRight': 'H FRAM',
    'diagram.wheel.rearLeft': 'V BAK',
    'diagram.wheel.rearRight': 'H BAK',
    'caravan.crankUp': 'Veva upp',
    'caravan.crankDown': 'Veva ner',
    'status.crank.up': 'Veva upp stödhjulet',
    'status.crank.down': 'Veva ner stödhjulet',
    'status.caravan.both': 'Rampa hjulet, veva sedan stödhjulet',

    'tilt.frontBack': 'Längsled',
    'tilt.sideSide': 'Sidled',

    'pose.layFlat': 'Lägg telefonen plant för att mäta',
    'pose.portrait': 'Vänd telefonen på höjden (porträtt) — ovansidan ska peka framåt',

    'stale.dataUnavailable':
      'Ingen ny sensordata – vägledningen är pausad tills den kommer tillbaka',

    'sensorFallback.unavailable': 'Extern sensor otillgänglig.',
    'sensorFallback.phoneHint':
      'Telefonens sensor kräver att telefonen ligger plant i fordonet – en fast ' +
      'monterad box behöver inte det.',
    'sensorFallback.retry': 'Försök igen',
    'sensorFallback.usePhone': 'Använd telefonsensorn',
  },
} as const;

export type Language = keyof typeof MESSAGES;
export type MessageKey = keyof (typeof MESSAGES)['en'];

function detectLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('sv')) {
    return 'sv';
  }
  return 'en';
}

/** Stored override ('sv' | 'en'), validated; anything else → auto-detect. */
export function resolveLanguage(stored: unknown): Language {
  return stored === 'sv' || stored === 'en' ? stored : detectLanguage();
}

let current: Language = resolveLanguage(null);

export function getLanguage(): Language {
  return current;
}

export function setLanguage(lang: Language): void {
  current = lang;
}

/** Look up a message, substituting `{name}` placeholders from `vars`. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = MESSAGES[current][key] ?? MESSAGES.en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

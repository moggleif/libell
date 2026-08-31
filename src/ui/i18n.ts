/**
 * Minimal i18n layer (issue #42, extended to five languages in #178): one
 * flat dictionary per language, keyed by message id. Language comes from a
 * stored override when present, otherwise from `navigator.language` (the
 * locale's language subtag picks the dictionary; anything we don't ship
 * → English). The dictionaries are plain data so a unit test can assert
 * every language covers the same keys.
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
    // "Share vehicle setup" (R41, #207): a link carrying only the vehicle-
    // geometry fields (never calibration, never UI/behavior preferences —
    // see domain/vehicleShare.ts) so a family member using the same
    // vehicle doesn't have to re-measure and retype everything by hand.
    'share.vehicle.text': "My RV's vehicle setup for Libell — measurements and ramps.",
    'settings.shareVehicle': 'Share vehicle setup',
    'setup.incoming.h': 'Incoming vehicle setup',
    'setup.incoming.intro': 'A family member shared these vehicle measurements with you:',
    'setup.incoming.reminder':
      "This does not include any calibration — you'll still need to calibrate on this phone.",
    'setup.incoming.apply': 'Use these values',
    'setup.incoming.dismiss': 'Not now',
    'setup.incoming.invalid': "That vehicle-setup link couldn't be read — nothing was changed.",

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
    // iOS Safari (R39): tapping this opens the Bluefy workaround guide
    // instead of a connect flow that could never work there.
    'sensorStatus.idle.guide': 'External sensor — tap for iPhone setup guide',

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

    // iOS Safari has no Web Bluetooth and Apple has no plans to add it
    // (R39) — rather than hide this page outright there too, iOS shows a
    // guide to a workaround: Bluefy, a third-party browser that adds Web
    // Bluetooth, makes the page above work unchanged once Libell is opened
    // inside it. See docs/ios-easylevel-bluefy-guide.md for the long form.
    'sensorSource.ios.intro':
      "Safari can't connect to Bluetooth sensors directly, but there's a workaround:",
    'sensorSource.ios.step1': 'Install "Bluefy – Web Bluetooth Browser" from the App Store.',
    'sensorSource.ios.step2': 'Open Bluefy and allow the Bluetooth permission.',
    'sensorSource.ios.step3': 'In Bluefy, go to this same Libell address.',
    'sensorSource.ios.step4': 'Open External sensor here again — it works like on Android.',
    'sensorSource.ios.note':
      'Bluefy is a third-party app, not built by Libell — reconnecting when you open ' +
      'the app may need one manual tap there, instead of happening silently.',
    'sensorSource.ios.bluefyLink': 'Find Bluefy in the App Store',

    // Detailed sensor health (#129). Battery/temperature show real decoded
    // values (#123) once the first `faf52c22-...` status notification
    // arrives — "not available yet" only before that, which is honest for
    // these two: they really do arrive. There is deliberately no signal-
    // strength string any more (#228) — see `easyLevelStatusPage.ts` for
    // why RSSI can never be read for a connected device.
    'sensorSource.detail.heading': 'Sensor details',
    'sensorSource.detail.battery': 'Battery: {value}',
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

    // Mounting orientation (#217): the box can be physically mounted two
    // ways, 90° apart — mirrors the official EasyLevel app's own setting,
    // described here without that app's own "sensor_Placing" terminology.
    'sensorSource.mounting.h': 'Sensor mounting',
    'sensorSource.mounting.intro':
      'The sensor box can be mounted four ways, each a quarter turn apart. Pick the ' +
      'picture that matches how yours actually sits — if Libell ever suggests raising ' +
      'the wrong side, or shows front/back and left/right swapped, try another one.',
    'sensorSource.mounting.standard': 'Standard',
    'sensorSource.mounting.rotated90': 'Rotated 90°',
    'sensorSource.mounting.rotated180': 'Rotated 180°',
    'sensorSource.mounting.rotated270': 'Rotated 270°',

    // Sensor status page: reached by tapping the sensor row on the
    // External sensor page. `reading` is the same roll/pitch the main
    // screen already computes, shown here too so a user checking the box
    // itself doesn't have to leave this page to see it move.
    'sensorStatus.title': 'EasyLevel sensor',
    'sensorStatus.reading': 'Reading: {value}',
    'sensorStatus.roll': 'roll',
    'sensorStatus.pitch': 'pitch',
    // Debug info (EasyLevel only — hidden while the phone's own sensor is
    // active): raw values straight off the box, for troubleshooting a box
    // that isn't behaving as expected — not everyday reading material.
    'sensorStatus.debug': 'Debug info',
    'sensorStatus.debug.intro':
      'Raw values straight from the box — for troubleshooting if something isn’t working.',
    'sensorStatus.debug.deviceId': 'Device ID: {value}',
    'sensorStatus.debug.lastSample': 'Last sample: {value}',
    'sensorStatus.debug.age': '{s} s ago',
    'sensorStatus.debug.rawAccel': 'Raw accelerometer (x/y/z): {value}',
    'sensorStatus.debug.firmwareTier': 'Firmware tier: {value}',
    'sensorStatus.debug.rawStatusBytes': 'Raw status bytes: {value}',
    'sensorStatus.debug.copy': 'Copy debug info',
    'sensorStatus.debug.copied': 'Debug info copied!',
    'sensorStatus.debug.copy.failed': 'Could not copy automatically.',
    // Connect-delay workaround (#212): an experimental, off-by-default
    // hardware-compatibility knob, not a normal setting — only worth
    // touching if the box's connection is actually unreliable.
    'sensorStatus.debug.connectDelay.intro':
      'Experimental: only try this if your box’s connection is unreliable. Adds a fixed pause after connecting, before the app starts reading from it.',
    'sensorStatus.debug.connectDelay.enable': 'Enable connect delay',
    'sensorStatus.debug.connectDelay.ms': 'Delay (ms)',

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
    // (`isEasyLevelAvailable()`). The external radio reuses
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
    // warning lamp (R11) stays lit until the step is done, or that the
    // shipped defaults are used meanwhile.
    'onboard.skip.consequence':
      'Skip for now — a warning lamp will remind you until it’s done. The defaults are used meanwhile, and they often work reasonably well.',
    'onboard.legend.ok': 'Green ✓ — that wheel is level.',
    'onboard.legend.up': 'Orange ↑ — drive that wheel up onto the step shown.',
    'onboard.legend.no': 'Red ✕ — no step is enough; move to a flatter spot.',
    'onboard.legend.dim': 'Gray – — a low wheel your ramps don’t reach.',
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
    // "saknar beskrivning" (was missing a description). Split into one hint
    // per field (follow-up), each placed right below its own field — the
    // same pattern the response-delay hint below already uses — instead of
    // one combined paragraph ahead of both fields.
    'settings.tolerance.hint':
      'Sets how close to level counts as "level" — tighter for a shower or fridge, ' +
      'looser if close enough is fine.',
    'settings.stability.hint': 'Smooths out small sensor jitter so the numbers do not flicker.',
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
    'appearance.glossy': 'Glossy',
    // Design review, follow-up: switching this now saves and reloads
    // (matching Language above) so the whole app switches immediately,
    // not just this form's colors.
    'settings.appearance.hint':
      'Switching this saves your changes and reloads Libell so the new layout applies everywhere.',
    'settings.sound': 'Chime when level',
    'settings.soundGuidance': 'Continuous audio guidance',
    'settings.soundGuidance.help':
      'A pulse speeds up and rises in pitch as you approach level, with a distinct ' +
      'signal for getting closer vs. moving the wrong way — so you can watch the ' +
      'ramps instead of the screen. Silent when the reading is too unreliable to ' +
      'trust — changing too fast, for instance.',
    'settings.save': 'Save',
    'settings.undo': 'Undo changes',
    'settings.reset': 'Reset to defaults',

    'settings.tab.vehicle': 'Vehicle',
    'settings.tab.ramps': 'Ramps',
    'settings.klossar.brandAll': 'All',
    'settings.klossar.changeRamp': 'Change ramp',
    'settings.rampCountHint':
      'How many ramps you have to put out. The app places them where they help most.',
    'settings.klossar.selected': 'Selected',
    'settings.klossar.stepsHeading': 'Step heights',

    'status.measuring': 'Measuring…',
    'status.almost': 'Almost level — {left} left',
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
    // Design review, two follow-ups: (1) used to say "L is the wheelbase,
    // W the track width", but the illustration stopped drawing those
    // letters (see `helpIllustrations.ts`'s `measuresIllustration`) — the
    // text still promised letters the picture no longer shows; (2) this
    // static Help tab isn't tied to any particular user's vehicle (see
    // that file's own comment) but the text only ever described a
    // motorhome — now covers both, matching the motorhome+caravan pair of
    // illustrations shown above it.
    'help.settings.t':
      'For a motorhome, wheelbase is the distance between the front and rear axles; a ' +
      "caravan's is the axle-to-jockey-wheel distance instead. Track width is the distance " +
      'between the left and right wheels — a motorhome can have a different width front and ' +
      'rear, a caravan has just the one. Usually in the vehicle papers, or use a tape measure.',
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
    'share.vehicle.text': 'Mina fordonsmått för Libell — mått och ramper.',
    'settings.shareVehicle': 'Dela fordonsinställning',
    'setup.incoming.h': 'Inkommande fordonsinställning',
    'setup.incoming.intro': 'En familjemedlem har delat de här fordonsmåtten med dig:',
    'setup.incoming.reminder':
      'Ingen kalibrering följer med — du behöver fortfarande kalibrera den här telefonen.',
    'setup.incoming.apply': 'Använd dessa värden',
    'setup.incoming.dismiss': 'Inte nu',
    'setup.incoming.invalid': 'Länken för fordonsinställning gick inte att läsa – inget ändrades.',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    'sensorStatus.connected': 'Extern sensor ansluten',
    'sensorStatus.disconnected': 'Extern sensor — anslutningen bröts, tryck för detaljer',
    'sensorStatus.idle': 'Extern sensor — tryck för att ansluta',
    'sensorStatus.idle.guide': 'Extern sensor — tryck för guide till iPhone',

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

    'sensorSource.ios.intro':
      'Safari kan inte ansluta till Bluetooth-sensorer direkt, men det finns en lösning:',
    'sensorSource.ios.step1': 'Installera "Bluefy – Web Bluetooth Browser" från App Store.',
    'sensorSource.ios.step2': 'Öppna Bluefy och tillåt Bluetooth-behörigheten.',
    'sensorSource.ios.step3': 'Gå till samma Libell-adress i Bluefy.',
    'sensorSource.ios.step4': 'Öppna Extern sensor här igen — det fungerar som på Android.',
    'sensorSource.ios.note':
      'Bluefy är en tredjepartsapp som inte byggs av Libell — återanslutning när du öppnar ' +
      'appen kan behöva en manuell tryckning där, istället för att ske tyst.',
    'sensorSource.ios.bluefyLink': 'Hitta Bluefy i App Store',

    'sensorSource.detail.heading': 'Sensordetaljer',
    'sensorSource.detail.battery': 'Batteri: {value}',
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

    // Monteringsriktning (#217): sensorboxen kan monteras på två sätt, ett
    // kvarts varv från varandra — motsvarar den officiella EasyLevel-
    // appens egen inställning, beskrivet här utan appens "sensor_Placing"-
    // terminologi.
    'sensorSource.mounting.h': 'Sensormontering',
    'sensorSource.mounting.intro':
      'Sensorboxen kan monteras på fyra sätt, ett kvarts varv mellan varje. Välj den ' +
      'bild som stämmer med hur din faktiskt sitter — om Libell någon gång föreslår ' +
      'att fel sida ska höjas, eller visar fram/bak och vänster/höger omkastat, ' +
      'prova ett annat alternativ.',
    'sensorSource.mounting.standard': 'Standard',
    'sensorSource.mounting.rotated90': 'Vriden 90°',
    'sensorSource.mounting.rotated180': 'Vriden 180°',
    'sensorSource.mounting.rotated270': 'Vriden 270°',

    'sensorStatus.title': 'EasyLevel-sensor',
    'sensorStatus.reading': 'Mätvärde: {value}',
    'sensorStatus.roll': 'roll',
    'sensorStatus.pitch': 'pitch',
    'sensorStatus.debug': 'Felsökningsinfo',
    'sensorStatus.debug.intro':
      'Råa värden direkt från boxen — för felsökning om något inte fungerar som det ska.',
    'sensorStatus.debug.deviceId': 'Enhets-ID: {value}',
    'sensorStatus.debug.lastSample': 'Senaste mätvärde: {value}',
    'sensorStatus.debug.age': '{s} s sedan',
    'sensorStatus.debug.rawAccel': 'Rå accelerometer (x/y/z): {value}',
    'sensorStatus.debug.firmwareTier': 'Firmware-nivå: {value}',
    'sensorStatus.debug.rawStatusBytes': 'Råa statusbytes: {value}',
    'sensorStatus.debug.copy': 'Kopiera felsökningsinfo',
    'sensorStatus.debug.copied': 'Felsökningsinfo kopierad!',
    'sensorStatus.debug.copy.failed': 'Kunde inte kopiera automatiskt.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimentellt: prova bara om boxens anslutning är opålitlig. Lägger till en fast paus efter anslutning, innan appen börjar läsa av den.',
    'sensorStatus.debug.connectDelay.enable': 'Aktivera anslutningsfördröjning',
    'sensorStatus.debug.connectDelay.ms': 'Fördröjning (ms)',

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
    'onboard.skip.consequence':
      'Hoppa över nu — en varningslampa påminner dig tills det är klart. Standardvärdena används under tiden, och de fungerar ofta någorlunda bra.',
    'onboard.legend.ok': 'Grönt ✓ — hjulet står i våg.',
    'onboard.legend.up': 'Orange ↑ — kör upp hjulet på steget som visas.',
    'onboard.legend.no': 'Rött ✕ — inget steg räcker; flytta till ett planare ställe.',
    'onboard.legend.dim': 'Grått – — ett lågt hjul som ramperna inte når.',

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
    'settings.tolerance.hint':
      'Avgör hur nära i våg som räknas som "i våg" — snävare för dusch eller kylskåp, ' +
      'mer tillåtande om det bara ska vara tillräckligt bra.',
    'settings.stability.hint': 'Jämnar ut små skakningar i sensorn så att siffrorna inte hoppar.',
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
    'appearance.glossy': 'Glansig',
    'settings.appearance.hint':
      'Att byta det här sparar dina ändringar och laddar om Libell så att den nya ' +
      'layouten gäller överallt.',
    'settings.sound': 'Ljudsignal när det är i våg',
    'settings.soundGuidance': 'Kontinuerlig ljudvägledning',
    'settings.soundGuidance.help':
      'En puls blir snabbare och stiger i tonhöjd ju närmare våg du kommer, med en ' +
      'tydlig signal för om du närmar dig eller rör dig åt fel håll — så att du kan ' +
      'titta på klossarna istället för skärmen. Tyst vid osäker indata — till ' +
      'exempel för snabba förändringar.',
    'settings.save': 'Spara',
    'settings.undo': 'Ångra ändringar',
    'settings.reset': 'Återställ standard',

    'settings.tab.vehicle': 'Fordon',
    'settings.tab.ramps': 'Klossar',
    'settings.klossar.brandAll': 'Alla',
    'settings.klossar.changeRamp': 'Byt ramp',
    'settings.rampCountHint':
      'Hur många klossar du har att lägga ut. Appen placerar dem där de gör mest nytta.',
    'settings.klossar.selected': 'Vald',
    'settings.klossar.stepsHeading': 'Steghöjder',

    'status.measuring': 'Mäter…',
    'status.almost': 'Nästan i våg — {left} kvar',
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
      'För en husbil är hjulbasen avståndet mellan fram- och bakaxeln; för en husvagn är ' +
      'det istället avståndet från axeln till stödhjulet. Spårvidden är avståndet mellan ' +
      'vänster och höger hjul — en husbil kan ha olika bredd fram och bak, en husvagn har ' +
      'bara en. Står oftast i fordonspapperen, annars tumstock.',
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
  fr: {
    'topbar.install': 'Installer',
    'topbar.share': 'Partager Libell',
    'bottombar.settings': 'Réglages',
    'bottombar.sound.mute': 'Couper le son',
    'bottombar.sound.unmute': 'Activer le son',
    'bottombar.help': 'Aide',
    'share.text': 'Mettez votre camping-car de niveau avec votre téléphone.',
    'share.copied': 'Lien copié !',
    'install.hint': 'Touchez Partager, puis « Sur l’écran d’accueil ».',
    'share.vehicle.text': 'La configuration de mon camping-car pour Libell — mesures et rampes.',
    'settings.shareVehicle': 'Partager la configuration du véhicule',
    'setup.incoming.h': 'Configuration de véhicule reçue',
    'setup.incoming.intro': 'Un proche a partagé ces mesures de véhicule avec vous :',
    'setup.incoming.reminder':
      'Cela ne comprend aucun étalonnage — vous devrez tout de même étalonner sur ce téléphone.',
    'setup.incoming.apply': 'Utiliser ces valeurs',
    'setup.incoming.dismiss': 'Pas maintenant',
    'setup.incoming.invalid': 'Ce lien de configuration n’a pas pu être lu — rien n’a été modifié.',

    'lamp.setup': '⚠ Réglages',
    'lamp.setup.title':
      'Les réglages du véhicule n’ont jamais été enregistrés — touchez pour ouvrir les Réglages',
    'lamp.calibrate': '⚠ Étalonner',
    'lamp.calibrate.title': 'Le téléphone n’est pas étalonné — touchez pour ouvrir l’Étalonnage',

    'sensorStatus.connected': 'Capteur externe connecté',
    'sensorStatus.disconnected': 'Connexion au capteur externe perdue — touchez pour les détails',
    'sensorStatus.idle': 'Capteur externe — touchez pour connecter',
    'sensorStatus.idle.guide': 'Capteur externe — touchez pour le guide iPhone',

    'menu.title': 'Menu',
    'menu.close': 'Fermer le menu',
    'menu.settings': 'Réglages',
    'menu.calibration': 'Étalonnage',
    'menu.targets': 'Cibles',
    'menu.feedback': 'Commentaires',
    'menu.help': 'Aide',
    'menu.intro': 'Afficher l’introduction',
    'menu.about': 'À propos de Libell',
    'menu.about.tab': 'À propos',
    'menu.sensorSource': 'Capteur externe',
    'menu.advanced': 'AVANCÉ',
    'menu.others': 'AUTRES',
    'menu.card.notSaved': 'Non enregistré',
    'menu.card.notDone': 'Non fait',

    'sensorSource.intro':
      'Connectez un boîtier EasyLevel BLE comme alternative au capteur du téléphone. ' +
      'Nécessite Chrome sur Android avec le Bluetooth activé.',
    'sensorSource.connect': 'Connecter le capteur EasyLevel',
    'sensorSource.reconnect': 'Reconnecter le capteur EasyLevel',
    'sensorSource.disconnect': 'Déconnecter',
    'sensorSource.status.phone': 'Utilise le capteur du téléphone.',
    'sensorSource.status.connected': 'Connecté au capteur EasyLevel.',
    'sensorSource.status.connecting': 'Connexion…',
    'sensorSource.status.disconnected':
      'La connexion au capteur EasyLevel a été perdue — touchez Reconnecter.',
    'sensorSource.err.unsupported': 'Web Bluetooth n’est pas pris en charge par ce navigateur.',
    'sensorSource.err.failed': 'Impossible de se connecter au capteur EasyLevel.',

    'sensorSource.ios.intro':
      'Safari ne peut pas se connecter directement aux capteurs Bluetooth, mais il existe une solution :',
    'sensorSource.ios.step1': 'Installez « Bluefy – Web Bluetooth Browser » depuis l’App Store.',
    'sensorSource.ios.step2': 'Ouvrez Bluefy et autorisez l’accès au Bluetooth.',
    'sensorSource.ios.step3': 'Dans Bluefy, ouvrez cette même adresse Libell.',
    'sensorSource.ios.step4': 'Rouvrez Capteur externe ici — cela fonctionne comme sur Android.',
    'sensorSource.ios.note':
      'Bluefy est une application tierce, pas développée par Libell — la reconnexion à ' +
      'l’ouverture peut y demander une touche manuelle au lieu de se faire toute seule.',
    'sensorSource.ios.bluefyLink': 'Trouver Bluefy dans l’App Store',

    'sensorSource.detail.heading': 'Détails du capteur',
    'sensorSource.detail.battery': 'Batterie : {value}',
    'sensorSource.detail.temperature': 'Température : {value}',
    'sensorSource.detail.notAvailable': 'Pas encore disponible',
    'sensorSource.lowBattery':
      '⚠ Batterie faible ({value}) — pensez à remplacer bientôt la pile du boîtier.',

    'sensorSource.install.h': 'Décalage d’installation',
    'sensorSource.install.intro':
      'Une fois le capteur monté à demeure, son emplacement exact dans le boîtier n’a ' +
      'plus d’importance — seule compte la position du boîtier. Mettez le véhicule de ' +
      'niveau de façon vérifiable une fois (niveau à bulle, ou après avoir calé avec vos ' +
      'rampes), puis définissez la lecture actuelle comme niveau.',
    'sensorSource.install.now': 'Définir le véhicule comme de niveau',
    'sensorSource.install.clear': 'Effacer le décalage d’installation',
    'sensorSource.install.status':
      'Décalage d’installation : latéral {roll}°, longitudinal {pitch}°.',
    'sensorSource.install.status.none':
      'Aucun décalage d’installation — la lecture brute compte comme le niveau.',

    'sensorSource.mounting.h': 'Montage du capteur',
    'sensorSource.mounting.intro':
      'Le boîtier peut être monté de quatre façons, chacune à un quart de tour de la ' +
      'suivante. Choisissez l’image qui correspond au montage réel — si Libell propose ' +
      'de soulever le mauvais côté, ou intervertit avant/arrière et gauche/droite, ' +
      'essayez-en une autre.',
    'sensorSource.mounting.standard': 'Standard',
    'sensorSource.mounting.rotated90': 'Tourné à 90°',
    'sensorSource.mounting.rotated180': 'Tourné à 180°',
    'sensorSource.mounting.rotated270': 'Tourné à 270°',

    'sensorStatus.title': 'Capteur EasyLevel',
    'sensorStatus.reading': 'Lecture : {value}',
    'sensorStatus.roll': 'roulis',
    'sensorStatus.pitch': 'tangage',
    'sensorStatus.debug': 'Infos de débogage',
    'sensorStatus.debug.intro':
      'Valeurs brutes directement du boîtier — pour le dépannage si quelque chose ne fonctionne pas.',
    'sensorStatus.debug.deviceId': 'ID de l’appareil : {value}',
    'sensorStatus.debug.lastSample': 'Dernière mesure : {value}',
    'sensorStatus.debug.age': 'il y a {s} s',
    'sensorStatus.debug.rawAccel': 'Accéléromètre brut (x/y/z) : {value}',
    'sensorStatus.debug.firmwareTier': 'Niveau de micrologiciel : {value}',
    'sensorStatus.debug.rawStatusBytes': 'Octets d’état bruts : {value}',
    'sensorStatus.debug.copy': 'Copier les infos de débogage',
    'sensorStatus.debug.copied': 'Infos de débogage copiées !',
    'sensorStatus.debug.copy.failed': 'La copie automatique a échoué.',
    'sensorStatus.debug.connectDelay.intro':
      'Expérimental : à essayer seulement si la connexion de votre boîtier est instable. ' +
      'Ajoute une pause fixe après la connexion, avant que l’application ne commence à lire.',
    'sensorStatus.debug.connectDelay.enable': 'Activer le délai de connexion',
    'sensorStatus.debug.connectDelay.ms': 'Délai (ms)',

    'about.text':
      'Libell vous aide à mettre de niveau votre camping-car ou votre caravane avec le ' +
      'téléphone que vous avez déjà — sans niveau à bulle, sans deviner.',
    'about.version': 'Version {v}',
    'about.offline':
      'Fonctionne entièrement hors ligne — le réseau ne sert qu’à télécharger les mises ' +
      'à jour de l’application elle-même.',
    'about.privacy':
      'Tout reste sur votre téléphone — pas de compte, pas de suivi, et aucune donnée ne ' +
      'quitte l’appareil.',
    'about.source': 'Libell est gratuit et open source (licence MIT).',
    'about.source.link': 'Code source sur GitHub',

    'onboard.welcome.h': 'Bienvenue dans Libell',
    'onboard.welcome.t':
      'Ce guide rapide configure votre véhicule et votre téléphone. Chaque étape peut ' +
      'être passée et terminée plus tard depuis les Réglages.',
    'onboard.sound.h': 'Son',
    'onboard.source.h': 'Comment voulez-vous mesurer ?',
    'onboard.source.intro':
      'Choisissez le capteur dont Libell doit lire l’inclinaison — la plupart des gens ' +
      'utilisent simplement le téléphone.',
    'onboard.source.phone': 'Ce téléphone',
    'onboard.vehicle.h': 'Que mettez-vous de niveau ?',
    'onboard.vehicle.intro': 'Choisissez votre véhicule — la suite du guide s’y adapte.',
    'onboard.step1.h': 'Posez le téléphone comme ceci',
    'onboard.next': 'Suivant',
    'onboard.back': 'Retour',
    'onboard.close': 'Fermer l’introduction',
    'onboard.done': 'Terminé',
    'onboard.skipStep': 'Passer',
    'onboard.skipDefaults': 'Passer — utiliser les valeurs par défaut',
    'onboard.skip.consequence':
      'Passer pour l’instant — un voyant vous le rappellera jusqu’à ce que ce soit fait. ' +
      'Les valeurs par défaut sont utilisées en attendant, et elles conviennent souvent assez bien.',
    'onboard.legend.ok': 'Vert ✓ — cette roue est de niveau.',
    'onboard.legend.up': 'Orange ↑ — montez cette roue sur le palier indiqué.',
    'onboard.legend.no': 'Rouge ✕ — aucun palier ne suffit ; allez sur un endroit plus plat.',
    'onboard.legend.dim': 'Gris – — une roue basse que vos rampes n’atteignent pas.',
    'settings.wheelbase': 'Empattement',
    'settings.trackFront': 'Voie avant',
    'settings.trackRear': 'Voie arrière',
    'settings.tolerance': 'Tolérance',
    'settings.stability': 'Stabilité',
    'settings.dwellRest': 'Délai de réponse (ms)',
    'settings.dwellMotion': 'Délai de réponse pendant le réglage (ms)',
    'settings.dwell.hint':
      'Combien de temps une lecture doit rester stable avant que le nombre affiché ne ' +
      'change. La seconde valeur ne s’applique que juste après un changement, pendant que ' +
      'vous ajustez activement (en montant sur une rampe, par exemple), pour que le nombre ' +
      'affiché ne soit pas en retard.',
    'settings.vehicle': 'Véhicule',
    'vehicle.motorhome': 'Camping-car',
    'vehicle.caravan': 'Caravane',
    'settings.axleToJockey': 'Essieu à la roue jockey',
    'settings.rearAxle': 'Essieu arrière',
    'settings.axle': 'Essieu',
    'axle.single': 'Simple',
    'axle.boggie': 'Tandem (double essieu)',
    'settings.track': 'Voie',
    'settings.measureHint':
      'L’empattement et les voies figurent sur la carte grise ou dans le manuel — un ' +
      'mètre ruban fait aussi l’affaire ; quelques cm d’erreur n’ont guère d’importance.',
    'settings.measureHint.boggie':
      'Avec un double essieu, mesurez jusqu’au centre de la paire d’essieux.',
    'settings.steps': 'Hauteurs des paliers de rampe',
    'settings.steps.add': 'Ajouter un palier',
    'settings.steps.remove': 'Supprimer {value}',
    'settings.ramp': 'Rampe toute faite',
    'settings.ramp.custom': 'Jeu personnalisé',
    'settings.rampCount': 'Nombre de rampes',
    'settings.drain': 'Côté de l’évacuation',
    'settings.rampHint': 'L’application choisit où vos rampes sont le plus utiles.',
    'settings.drainHint':
      'N’a d’importance que si vous tenez à l’endroit où l’eau de l’évier ou de la douche ' +
      's’écoule — dans la tolérance, l’application laisse alors ce côté le plus bas pour ' +
      'que l’écoulement continue.',
    'settings.section.vehicle': 'Véhicule et mesures',
    'settings.section.ramps': 'Rampes',
    'settings.section.display': 'Niveau et affichage',
    'settings.general': 'Général',
    'settings.language': 'Langue',
    'settings.language.auto': 'Automatique (langue de l’appareil)',
    'settings.advanced': 'Avancé',
    'settings.tolerance.hint':
      'Définit à quel point il faut être proche du niveau pour compter comme « de niveau » ' +
      '— plus strict pour une douche ou un réfrigérateur, plus souple si à peu près suffit.',
    'settings.stability.hint':
      'Lisse les petites variations du capteur pour que les nombres ne clignotent pas.',
    'drain.none': 'Aucun / peu importe',
    'drain.left': 'Gauche, milieu',
    'drain.right': 'Droite, milieu',
    'drain.front': 'Avant, milieu',
    'drain.rear': 'Arrière, milieu',
    'drain.frontLeft': 'Avant gauche',
    'drain.frontRight': 'Avant droite',
    'drain.rearLeft': 'Arrière gauche',
    'drain.rearRight': 'Arrière droite',
    'settings.unit': 'Afficher les longueurs en',
    'settings.theme': 'Thème',
    'theme.system': 'Suivre le téléphone',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'settings.appearance': 'Apparence',
    'appearance.classic': 'Classique',
    'appearance.modern': 'Moderne',
    'appearance.glossy': 'Brillant',
    'settings.appearance.hint':
      'Changer ce réglage enregistre vos modifications et recharge Libell pour que la ' +
      'nouvelle mise en page s’applique partout.',
    'settings.sound': 'Carillon quand c’est de niveau',
    'settings.soundGuidance': 'Guidage sonore continu',
    'settings.soundGuidance.help':
      'Une impulsion s’accélère et monte dans les aigus à mesure que vous approchez du ' +
      'niveau, avec un signal distinct selon que vous vous rapprochez ou allez dans le ' +
      'mauvais sens — vous pouvez ainsi regarder les rampes plutôt que l’écran. Silencieux ' +
      'quand la lecture est trop peu fiable — par exemple quand elle change trop vite.',
    'settings.save': 'Enregistrer',
    'settings.undo': 'Annuler les modifications',
    'settings.reset': 'Rétablir les valeurs par défaut',

    'settings.tab.vehicle': 'Véhicule',
    'settings.tab.ramps': 'Rampes',
    'settings.klossar.brandAll': 'Toutes',
    'settings.klossar.changeRamp': 'Changer de rampe',
    'settings.rampCountHint':
      "Combien de rampes vous avez à poser. L'application les place au mieux.",
    'settings.klossar.selected': 'Sélectionné',
    'settings.klossar.stepsHeading': 'Hauteurs des paliers',

    'status.measuring': 'Mesure…',
    'status.almost': 'Presque de niveau — il reste {left}',
    'status.cantLevel.close':
      'Vos rampes approchent mais ne suffisent pas ici — déplacez le véhicule',
    'status.cantLevel.far': 'Vos rampes sont loin du compte ici — déplacez le véhicule',

    'calibration.intro':
      'Posez le téléphone sur une surface dont vous savez qu’elle est de niveau, puis ' +
      'touchez Étalonner maintenant. L’inclinaison actuelle devient le point zéro.',
    'calibration.status': 'Étalonné : latéral {roll}°, longitudinal {pitch}°.',
    'calibration.status.none': 'Non étalonné — capteur brut utilisé.',
    'calibration.now': 'Étalonner maintenant',
    'calibration.clear': 'Effacer l’étalonnage',
    'calibration.err.notRunning':
      'Le capteur d’inclinaison n’est pas encore actif — touchez d’abord Démarrer sur ' +
      'l’écran principal.',
    'calibration.err.notFlat':
      'Le téléphone ne semble pas à plat — posez-le sur une surface de niveau et réessayez.',
    'calibration.sensor.h': 'Étalonner le téléphone',
    'calibration.vehicle.h': 'Étalonner le zéro du véhicule',
    'calibration.guide.intro':
      'Deux couches :\n' +
      '1. Étalonnez le téléphone une fois sur une surface de niveau (ou avec le retournement à 180°).\n' +
      '2. Le véhicule étant vérifiablement de niveau, définissez l’emplacement habituel du ' +
      'téléphone comme zéro du véhicule — une table légèrement inclinée est alors compensée elle aussi.',
    'calibration.vehicle.intro':
      'L’étalonnage du capteur met le téléphone à zéro — pas l’endroit où il repose. Si la ' +
      'table penche un peu, l’application afficherait toujours cette inclinaison. Mettez le ' +
      'véhicule de niveau de façon vérifiable une fois (niveau à bulle, ou après avoir calé ' +
      'avec vos rampes), posez le téléphone à sa place habituelle et définissez cela comme le niveau.',
    'calibration.vehicle.now': 'Définir la position actuelle comme de niveau',
    'calibration.vehicle.clear': 'Effacer le zéro du véhicule',
    'calibration.vehicle.status': 'Zéro du véhicule : latéral {roll}°, longitudinal {pitch}°.',
    'calibration.vehicle.status.none':
      'Aucun zéro du véhicule — l’emplacement du téléphone compte comme plat.',
    'calibration.vehicle.err.notFlat':
      'Cela ressemble à plus qu’une inclinaison de pose (>15°) — le véhicule est-il vraiment de niveau ?',
    'calibration.age.today': '(aujourd’hui)',
    'calibration.age.days': '(il y a {n} jours)',
    'calibration.check': 'Vérifier',
    'calibration.check.good': 'Toujours bon — écart de {off}°.',
    'calibration.check.off': 'Écart de {off}° — pensez à réétalonner.',
    'calibration.flip.intro':
      'Pas de surface de niveau à proximité ? Utilisez l’étalonnage par retournement : posez ' +
      'le téléphone n’importe où d’assez plat, capturez, faites-lui faire un demi-tour (180°) ' +
      'au même endroit, capturez à nouveau — l’inclinaison de la surface s’annule d’elle-même.',
    'calibration.flip.start': 'Étalonner par retournement',
    'calibration.flip.rotate':
      'Faites maintenant tourner le téléphone d’un demi-tour (180°) au même endroit, puis touchez Capturer.',
    'calibration.flip.capture': 'Capturer',
    'calibration.flip.done': 'Terminé ! Votre surface penche de {surface}° — compensé.',
    'calibration.flip.err.moved':
      'Les deux captures ne concordent pas — le téléphone a-t-il bougé ? Recommencez depuis le début.',
    'calibration.pill.notDone': 'NON FAIT',
    'calibration.pill.done': 'FAIT',
    'calibration.pill.none': 'AUCUN',

    'targets.intro':
      'Enregistrez une inclinaison volontaire — pour la douche ou l’évacuation des eaux ' +
      'grises — et passez-y en quelques touches. Normal (de niveau) est toujours disponible ' +
      'et n’est jamais écrasé.',
    'targets.normal': 'Normal (de niveau)',
    'targets.name.placeholder': 'Nom (par ex. « Évacuation douche »)',
    'targets.add': 'Enregistrer l’inclinaison actuelle comme nouvelle cible',
    'targets.delete': 'Supprimer {name}',
    'targets.err.tooSteep': 'Cela ressemble à plus qu’une cible volontaire (>15°) — réessayez.',
    'targets.badge': 'Cible : {name}',
    'menu.offsetSummary':
      'Le niveau est calculé à partir de : capteur {sensor} · zéro véhicule {vehicleZero} · cible : {target}',

    'feedback.intro':
      'Un problème ou une idée ? Remplissez ceci et touchez le bouton — cela ouvre un ' +
      'rapport prêt à l’emploi sur GitHub où vous le publiez (un compte GitHub gratuit est ' +
      'nécessaire, créé en une minute).',
    'feedback.category': 'De quoi s’agit-il ?',
    'feedback.cat.bug': 'Bogue',
    'feedback.cat.suggestion': 'Suggestion',
    'feedback.cat.other': 'Autre',
    'feedback.title': 'Titre court',
    'feedback.desc': 'Que s’est-il passé, ou que souhaitez-vous ?',
    'feedback.submit': 'Ouvrir le rapport sur GitHub',

    'help.what.h': 'Ce que fait Libell',
    'help.what.t':
      'Posez le téléphone à plat dans le véhicule, le haut vers l’avant. L’écran montre ' +
      'votre véhicule vu de dessus, et chaque roue vous dit quoi faire.',
    'help.first.h': 'Avant la première utilisation',
    'help.first.t':
      'Remplissez les Réglages et étalonnez une fois — les panneaux jaunes de la barre du ' +
      'haut vous le rappellent jusqu’à ce que les deux soient faits. Tout est mémorisé.',
    'help.screen.h': 'Lire l’écran',
    'help.screen.t':
      'Vert ✓ : c’est fait.\n' +
      'Orange ↑ : montez cette roue sur le palier indiqué au-dessus.\n' +
      'Rouge ✕ : même votre palier le plus haut ne suffit pas ; allez sur un endroit plus plat.\n' +
      'Gris – : une roue basse que vos rampes n’atteignent pas.\n' +
      'Quand la bulle repose au milieu, vous êtes de niveau.',
    'help.settings.h': 'Les mesures',
    'help.settings.t':
      'Pour un camping-car, l’empattement est la distance entre l’essieu avant et l’essieu ' +
      'arrière ; pour une caravane, c’est la distance entre l’essieu et la roue jockey. La ' +
      'voie est la distance entre les roues gauche et droite — un camping-car peut avoir une ' +
      'largeur différente à l’avant et à l’arrière, une caravane n’en a qu’une. Cela figure ' +
      'généralement sur les papiers du véhicule, sinon prenez un mètre ruban.',
    'help.ramps.t':
      'Choisissez un modèle de rampe tout fait, ou ajoutez vos propres hauteurs de palier ' +
      'avec le bouton +. L’application choisit ensuite où vos rampes sont le plus utiles — ' +
      'et, dans la tolérance, laisse le côté de l’évacuation le plus bas pour que l’évier et ' +
      'la douche continuent de s’écouler.',
    'help.calibration.h': 'Étalonnage',
    'help.calibration.t':
      'Le téléphone lit sa propre inclinaison, pas celle du sol — et le plancher d’un ' +
      'véhicule est rarement parfaitement plat non plus. L’étalonnage corrige les deux, si ' +
      'bien que ce que l’application affiche est le sol réel, et pas seulement la façon dont ' +
      'le téléphone se trouve posé.',
    'help.notes.h': 'Bon à savoir',
    'help.notes.t':
      'Fonctionne entièrement hors ligne une fois ouverte — ajoutez-la à votre écran ' +
      'd’accueil comme une application.\n' +
      'Sur iPhone, touchez Démarrer à chaque fois.\n' +
      'Le numéro de version en bas est utile pour signaler un problème.',

    'main.hint':
      'Posez votre téléphone à plat dans votre camping-car, le bord supérieur vers l’avant.',
    'main.start': 'Démarrer',
    'main.waiting': 'En attente du capteur d’inclinaison…',
    'main.level': 'Votre camping-car est de niveau !',
    'main.denied':
      'L’accès aux mouvements a été refusé, Libell ne peut donc pas lire l’inclinaison. ' +
      'Autorisez l’accès au mouvement et à l’orientation pour ce site, puis rechargez.',
    'main.noSensors':
      'Cet appareil n’expose pas de capteurs de mouvement, Libell ne peut donc pas lire l’inclinaison.',
    'main.https':
      'Libell a besoin d’une connexion sécurisée (HTTPS) pour lire les capteurs ' +
      'd’inclinaison. Ouvrez l’application en HTTPS et réessayez.',

    'diagram.aria': 'Vue de dessus de votre camping-car montrant les roues à surélever',
    'diagram.caravan.aria':
      'Vue de dessus de votre caravane montrant les roues d’essieu et la roue jockey',
    'diagram.front': 'Avant',
    'diagram.step': 'Palier {n}',
    'diagram.done': 'Terminé',
    'diagram.noRamp': 'Aucune rampe',
    'diagram.wheel.frontLeft': 'AVANT G',
    'diagram.wheel.frontRight': 'AVANT D',
    'diagram.wheel.rearLeft': 'ARRIÈRE G',
    'diagram.wheel.rearRight': 'ARRIÈRE D',
    'caravan.crankUp': 'Monter à la manivelle',
    'caravan.crankDown': 'Descendre à la manivelle',

    'tilt.frontBack': 'Longitudinal',
    'tilt.sideSide': 'Latéral',

    'pose.layFlat': 'Posez le téléphone à plat pour mesurer',
    'pose.portrait':
      'Tournez le téléphone à la verticale (portrait) — le bord supérieur doit pointer vers l’avant',

    'stale.dataUnavailable':
      'Aucune nouvelle donnée du capteur — le guidage est en pause jusqu’à son retour',

    'sensorFallback.unavailable': 'Capteur externe indisponible.',
    'sensorFallback.phoneHint':
      'Le capteur du téléphone exige que le téléphone soit posé à plat dans le véhicule — ' +
      'un boîtier monté à demeure, non.',
    'sensorFallback.retry': 'Réessayer',
    'sensorFallback.usePhone': 'Utiliser le capteur du téléphone',
  },
  es: {
    'topbar.install': 'Instalar',
    'topbar.share': 'Compartir Libell',
    'bottombar.settings': 'Ajustes',
    'bottombar.sound.mute': 'Silenciar el sonido',
    'bottombar.sound.unmute': 'Activar el sonido',
    'bottombar.help': 'Ayuda',
    'share.text': 'Nivela tu autocaravana con el móvil.',
    'share.copied': '¡Enlace copiado!',
    'install.hint': 'Toca Compartir y luego «Añadir a pantalla de inicio».',
    'share.vehicle.text': 'La configuración de mi autocaravana para Libell: medidas y rampas.',
    'settings.shareVehicle': 'Compartir la configuración del vehículo',
    'setup.incoming.h': 'Configuración de vehículo recibida',
    'setup.incoming.intro':
      'Alguien de tu familia ha compartido contigo estas medidas del vehículo:',
    'setup.incoming.reminder':
      'Esto no incluye ninguna calibración: tendrás que calibrar igualmente en este móvil.',
    'setup.incoming.apply': 'Usar estos valores',
    'setup.incoming.dismiss': 'Ahora no',
    'setup.incoming.invalid':
      'No se ha podido leer ese enlace de configuración: no se ha cambiado nada.',

    'lamp.setup': '⚠ Ajustes',
    'lamp.setup.title': 'Los ajustes del vehículo nunca se han guardado: toca para abrir Ajustes',
    'lamp.calibrate': '⚠ Calibrar',
    'lamp.calibrate.title': 'El móvil no está calibrado: toca para abrir Calibración',

    'sensorStatus.connected': 'Sensor externo conectado',
    'sensorStatus.disconnected':
      'Se ha perdido la conexión con el sensor externo: toca para ver los detalles',
    'sensorStatus.idle': 'Sensor externo: toca para conectar',
    'sensorStatus.idle.guide': 'Sensor externo: toca para ver la guía de iPhone',

    'menu.title': 'Menú',
    'menu.close': 'Cerrar el menú',
    'menu.settings': 'Ajustes',
    'menu.calibration': 'Calibración',
    'menu.targets': 'Objetivos',
    'menu.feedback': 'Comentarios',
    'menu.help': 'Ayuda',
    'menu.intro': 'Mostrar la introducción',
    'menu.about': 'Acerca de Libell',
    'menu.about.tab': 'Acerca de',
    'menu.sensorSource': 'Sensor externo',
    'menu.advanced': 'AVANZADO',
    'menu.others': 'OTROS',
    'menu.card.notSaved': 'Sin guardar',
    'menu.card.notDone': 'Sin hacer',

    'sensorSource.intro':
      'Conecta una caja EasyLevel BLE como alternativa al sensor del propio móvil. ' +
      'Requiere Chrome en Android con el Bluetooth activado.',
    'sensorSource.connect': 'Conectar el sensor EasyLevel',
    'sensorSource.reconnect': 'Reconectar el sensor EasyLevel',
    'sensorSource.disconnect': 'Desconectar',
    'sensorSource.status.phone': 'Usando el sensor del propio móvil.',
    'sensorSource.status.connected': 'Conectado al sensor EasyLevel.',
    'sensorSource.status.connecting': 'Conectando…',
    'sensorSource.status.disconnected':
      'Se ha perdido la conexión con el sensor EasyLevel: toca Reconectar.',
    'sensorSource.err.unsupported': 'Este navegador no admite Web Bluetooth.',
    'sensorSource.err.failed': 'No se ha podido conectar con el sensor EasyLevel.',

    'sensorSource.ios.intro':
      'Safari no puede conectarse directamente a sensores Bluetooth, pero hay una solución:',
    'sensorSource.ios.step1': 'Instala «Bluefy – Web Bluetooth Browser» desde la App Store.',
    'sensorSource.ios.step2': 'Abre Bluefy y concede el permiso de Bluetooth.',
    'sensorSource.ios.step3': 'En Bluefy, ve a esta misma dirección de Libell.',
    'sensorSource.ios.step4': 'Vuelve a abrir Sensor externo aquí: funciona igual que en Android.',
    'sensorSource.ios.note':
      'Bluefy es una aplicación de terceros, no creada por Libell: puede que reconectar al ' +
      'abrir la app requiera un toque manual allí en lugar de hacerse solo.',
    'sensorSource.ios.bluefyLink': 'Buscar Bluefy en la App Store',

    'sensorSource.detail.heading': 'Detalles del sensor',
    'sensorSource.detail.battery': 'Batería: {value}',
    'sensorSource.detail.temperature': 'Temperatura: {value}',
    'sensorSource.detail.notAvailable': 'Aún no disponible',
    'sensorSource.lowBattery':
      '⚠ Batería baja ({value}): conviene cambiar pronto la pila de la caja del sensor.',

    'sensorSource.install.h': 'Desfase de instalación',
    'sensorSource.install.intro':
      'Una vez el sensor está montado de forma permanente, su colocación exacta dentro de ' +
      'la caja deja de importar: solo importa dónde está la caja. Nivela el vehículo de ' +
      'forma verificable una vez (con un nivel de burbuja, o después de nivelar con tus ' +
      'rampas) y luego fija la lectura actual como nivel.',
    'sensorSource.install.now': 'Fijar el vehículo como nivelado',
    'sensorSource.install.clear': 'Borrar el desfase de instalación',
    'sensorSource.install.status':
      'Desfase de instalación: lado/lado {roll}°, delante/detrás {pitch}°.',
    'sensorSource.install.status.none':
      'Sin desfase de instalación: la lectura en bruto cuenta como nivel.',

    'sensorSource.mounting.h': 'Montaje del sensor',
    'sensorSource.mounting.intro':
      'La caja del sensor se puede montar de cuatro maneras, cada una a un cuarto de vuelta ' +
      'de la siguiente. Elige la imagen que coincida con cómo está montada la tuya: si ' +
      'Libell propone subir el lado equivocado, o intercambia delante/detrás e ' +
      'izquierda/derecha, prueba otra.',
    'sensorSource.mounting.standard': 'Estándar',
    'sensorSource.mounting.rotated90': 'Girado 90°',
    'sensorSource.mounting.rotated180': 'Girado 180°',
    'sensorSource.mounting.rotated270': 'Girado 270°',

    'sensorStatus.title': 'Sensor EasyLevel',
    'sensorStatus.reading': 'Lectura: {value}',
    'sensorStatus.roll': 'alabeo',
    'sensorStatus.pitch': 'cabeceo',
    'sensorStatus.debug': 'Información de depuración',
    'sensorStatus.debug.intro':
      'Valores en bruto directamente de la caja: para resolver problemas si algo no funciona.',
    'sensorStatus.debug.deviceId': 'ID del dispositivo: {value}',
    'sensorStatus.debug.lastSample': 'Última muestra: {value}',
    'sensorStatus.debug.age': 'hace {s} s',
    'sensorStatus.debug.rawAccel': 'Acelerómetro en bruto (x/y/z): {value}',
    'sensorStatus.debug.firmwareTier': 'Nivel de firmware: {value}',
    'sensorStatus.debug.rawStatusBytes': 'Bytes de estado en bruto: {value}',
    'sensorStatus.debug.copy': 'Copiar la información de depuración',
    'sensorStatus.debug.copied': '¡Información de depuración copiada!',
    'sensorStatus.debug.copy.failed': 'No se ha podido copiar automáticamente.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimental: pruébalo solo si la conexión de tu caja es inestable. Añade una pausa ' +
      'fija después de conectar, antes de que la app empiece a leer.',
    'sensorStatus.debug.connectDelay.enable': 'Activar la pausa de conexión',
    'sensorStatus.debug.connectDelay.ms': 'Pausa (ms)',

    'about.text':
      'Libell te ayuda a nivelar tu autocaravana o caravana con el móvil que ya tienes: ' +
      'sin niveles de burbuja y sin adivinar.',
    'about.version': 'Versión {v}',
    'about.offline':
      'Funciona totalmente sin conexión: la red solo se usa para descargar actualizaciones ' +
      'de la propia app.',
    'about.privacy':
      'Todo se queda en tu móvil: sin cuenta, sin seguimiento y sin que ningún dato salga ' +
      'del dispositivo.',
    'about.source': 'Libell es gratuita y de código abierto (licencia MIT).',
    'about.source.link': 'Código fuente en GitHub',

    'onboard.welcome.h': 'Te damos la bienvenida a Libell',
    'onboard.welcome.t':
      'Esta guía rápida configura tu vehículo y tu móvil. Puedes saltarte cualquier paso y ' +
      'terminarlo más tarde desde Ajustes.',
    'onboard.sound.h': 'Sonido',
    'onboard.source.h': '¿Cómo quieres medir?',
    'onboard.source.intro':
      'Elige de qué sensor debe leer Libell la inclinación: la mayoría simplemente usa el móvil.',
    'onboard.source.phone': 'Este móvil',
    'onboard.vehicle.h': '¿Qué vas a nivelar?',
    'onboard.vehicle.intro': 'Elige tu vehículo: el resto de la guía se adapta a él.',
    'onboard.step1.h': 'Coloca el móvil así',
    'onboard.next': 'Siguiente',
    'onboard.back': 'Atrás',
    'onboard.close': 'Cerrar la introducción',
    'onboard.done': 'Listo',
    'onboard.skipStep': 'Saltar',
    'onboard.skipDefaults': 'Saltar: usar los valores predeterminados',
    'onboard.skip.consequence':
      'Saltar por ahora: un aviso te lo recordará hasta que esté hecho. Mientras tanto se ' +
      'usan los valores predeterminados, que a menudo funcionan bastante bien.',
    'onboard.legend.ok': 'Verde ✓: esa rueda está nivelada.',
    'onboard.legend.up': 'Naranja ↑: sube esa rueda al nivel indicado.',
    'onboard.legend.no': 'Rojo ✕: ningún nivel basta; muévete a un sitio más llano.',
    'onboard.legend.dim': 'Gris –: una rueda baja a la que no llegan tus rampas.',
    'settings.wheelbase': 'Distancia entre ejes',
    'settings.trackFront': 'Ancho de vía delantero',
    'settings.trackRear': 'Ancho de vía trasero',
    'settings.tolerance': 'Tolerancia',
    'settings.stability': 'Estabilidad',
    'settings.dwellRest': 'Retardo de respuesta (ms)',
    'settings.dwellMotion': 'Retardo de respuesta al ajustar (ms)',
    'settings.dwell.hint':
      'Cuánto tiempo debe mantenerse estable una lectura antes de que cambie el número ' +
      'mostrado. El segundo valor solo se aplica justo después de un cambio, mientras ' +
      'ajustas activamente (por ejemplo, subiendo por una rampa), para que el número en ' +
      'vivo no se quede atrás.',
    'settings.vehicle': 'Vehículo',
    'vehicle.motorhome': 'Autocaravana',
    'vehicle.caravan': 'Caravana',
    'settings.axleToJockey': 'Del eje a la rueda jockey',
    'settings.rearAxle': 'Eje trasero',
    'settings.axle': 'Eje',
    'axle.single': 'Simple',
    'axle.boggie': 'Tándem (doble eje)',
    'settings.track': 'Ancho de vía',
    'settings.measureHint':
      'La distancia entre ejes y los anchos de vía están en la documentación del vehículo o ' +
      'en el manual; una cinta métrica también sirve: unos pocos cm de error apenas importan.',
    'settings.measureHint.boggie': 'Con doble eje, mide hasta el centro del par de ejes.',
    'settings.steps': 'Alturas de nivel de la rampa',
    'settings.steps.add': 'Añadir nivel',
    'settings.steps.remove': 'Quitar {value}',
    'settings.ramp': 'Rampa prefabricada',
    'settings.ramp.custom': 'Juego personalizado',
    'settings.rampCount': 'Número de rampas',
    'settings.drain': 'Lado del desagüe',
    'settings.rampHint': 'La app elige dónde tus rampas hacen más falta.',
    'settings.drainHint':
      'Solo importa si te interesa por dónde desagua el fregadero o la ducha: dentro de la ' +
      'tolerancia, la app deja ese lado lo más bajo posible para que siga desaguando.',
    'settings.section.vehicle': 'Vehículo y medidas',
    'settings.section.ramps': 'Rampas',
    'settings.section.display': 'Nivel y visualización',
    'settings.general': 'General',
    'settings.language': 'Idioma',
    'settings.language.auto': 'Automático (idioma del dispositivo)',
    'settings.advanced': 'Avanzado',
    'settings.tolerance.hint':
      'Define cuánto hay que acercarse al nivel para contar como «nivelado»: más estricto ' +
      'para una ducha o un frigorífico, más holgado si basta con aproximarse.',
    'settings.stability.hint':
      'Suaviza las pequeñas fluctuaciones del sensor para que los números no parpadeen.',
    'drain.none': 'Ninguno / da igual',
    'drain.left': 'Izquierda, centro',
    'drain.right': 'Derecha, centro',
    'drain.front': 'Delante, centro',
    'drain.rear': 'Detrás, centro',
    'drain.frontLeft': 'Delantero izquierdo',
    'drain.frontRight': 'Delantero derecho',
    'drain.rearLeft': 'Trasero izquierdo',
    'drain.rearRight': 'Trasero derecho',
    'settings.unit': 'Mostrar las longitudes en',
    'settings.theme': 'Tema',
    'theme.system': 'Seguir al móvil',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'settings.appearance': 'Aspecto',
    'appearance.classic': 'Clásico',
    'appearance.modern': 'Moderno',
    'appearance.glossy': 'Brillante',
    'settings.appearance.hint':
      'Cambiar esto guarda tus cambios y recarga Libell para que el nuevo diseño se aplique ' +
      'en todas partes.',
    'settings.sound': 'Sonido al quedar nivelado',
    'settings.soundGuidance': 'Guía sonora continua',
    'settings.soundGuidance.help':
      'Un pulso se acelera y sube de tono a medida que te acercas al nivel, con una señal ' +
      'distinta según si te acercas o vas en la dirección equivocada, de modo que puedes ' +
      'mirar las rampas en vez de la pantalla. Se calla cuando la lectura es demasiado poco ' +
      'fiable, por ejemplo si cambia demasiado deprisa.',
    'settings.save': 'Guardar',
    'settings.undo': 'Deshacer los cambios',
    'settings.reset': 'Restablecer los valores predeterminados',

    'settings.tab.vehicle': 'Vehículo',
    'settings.tab.ramps': 'Rampas',
    'settings.klossar.brandAll': 'Todas',
    'settings.klossar.changeRamp': 'Cambiar rampa',
    'settings.rampCountHint':
      'Cuántas rampas tienes para colocar. La aplicación las coloca donde más ayudan.',
    'settings.klossar.selected': 'Seleccionado',
    'settings.klossar.stepsHeading': 'Alturas de nivel',

    'status.measuring': 'Midiendo…',
    'status.almost': 'Casi nivelado: faltan {left}',
    'status.cantLevel.close': 'Tus rampas se acercan pero no bastan aquí: mueve el vehículo',
    'status.cantLevel.far': 'Aquí tus rampas se quedan muy cortas: mueve el vehículo',

    'calibration.intro':
      'Pon el móvil sobre una superficie que sepas que está nivelada y toca Calibrar ahora. ' +
      'La inclinación actual se convierte en el punto cero.',
    'calibration.status': 'Calibrado: lado/lado {roll}°, delante/detrás {pitch}°.',
    'calibration.status.none': 'Sin calibrar: se usa el sensor en bruto.',
    'calibration.now': 'Calibrar ahora',
    'calibration.clear': 'Borrar la calibración',
    'calibration.err.notRunning':
      'El sensor de inclinación aún no está en marcha: toca primero Iniciar en la pantalla principal.',
    'calibration.err.notFlat':
      'El móvil no parece estar plano: ponlo sobre una superficie nivelada e inténtalo de nuevo.',
    'calibration.sensor.h': 'Calibrar el móvil',
    'calibration.vehicle.h': 'Calibrar el cero del vehículo',
    'calibration.guide.intro':
      'Dos capas:\n' +
      '1. Calibra el móvil una vez sobre una superficie nivelada (o con el giro de 180°).\n' +
      '2. Con el vehículo verificablemente nivelado, fija el sitio habitual del móvil como ' +
      'cero del vehículo: así también se compensa una mesa algo inclinada.',
    'calibration.vehicle.intro':
      'La calibración del sensor pone a cero el móvil, no el sitio donde está apoyado. Si la ' +
      'mesa se inclina un poco, la app mostraría siempre esa inclinación. Nivela el vehículo ' +
      'de forma verificable una vez (con un nivel de burbuja, o después de nivelar con tus ' +
      'rampas), pon el móvil en su sitio habitual y fija eso como nivel.',
    'calibration.vehicle.now': 'Fijar la posición actual como nivelada',
    'calibration.vehicle.clear': 'Borrar el cero del vehículo',
    'calibration.vehicle.status': 'Cero del vehículo: lado/lado {roll}°, delante/detrás {pitch}°.',
    'calibration.vehicle.status.none':
      'Sin cero del vehículo: el sitio del móvil cuenta como plano.',
    'calibration.vehicle.err.notFlat':
      'Esto parece más que la inclinación del sitio (>15°): ¿está el vehículo realmente nivelado?',
    'calibration.age.today': '(hoy)',
    'calibration.age.days': '(hace {n} días)',
    'calibration.check': 'Comprobar',
    'calibration.check.good': 'Sigue bien: desviación de {off}°.',
    'calibration.check.off': 'Desviación de {off}°: conviene recalibrar.',
    'calibration.flip.intro':
      '¿No tienes cerca ninguna superficie nivelada? Usa la calibración por giro: pon el ' +
      'móvil en cualquier sitio razonablemente plano, captura, gíralo media vuelta (180°) en ' +
      'el mismo sitio y captura otra vez: la inclinación de la superficie se cancela sola.',
    'calibration.flip.start': 'Calibrar girando',
    'calibration.flip.rotate':
      'Ahora gira el móvil media vuelta (180°) en el mismo sitio y toca Capturar.',
    'calibration.flip.capture': 'Capturar',
    'calibration.flip.done': '¡Listo! Tu superficie se inclina {surface}°: compensado.',
    'calibration.flip.err.moved':
      'Las dos capturas no coinciden: ¿se ha movido el móvil? Empieza otra vez desde el principio.',
    'calibration.pill.notDone': 'SIN HACER',
    'calibration.pill.done': 'HECHO',
    'calibration.pill.none': 'NINGUNO',

    'targets.intro':
      'Guarda una inclinación intencionada, para la ducha o el desagüe de aguas grises, y ' +
      'cambia a ella en un par de toques. Normal (nivelado) siempre está disponible y nunca ' +
      'se sobrescribe.',
    'targets.normal': 'Normal (nivelado)',
    'targets.name.placeholder': 'Nombre (p. ej. «Desagüe de la ducha»)',
    'targets.add': 'Guardar la inclinación actual como nuevo objetivo',
    'targets.delete': 'Eliminar {name}',
    'targets.err.tooSteep':
      'Esto parece más que un objetivo intencionado (>15°): inténtalo de nuevo.',
    'targets.badge': 'Objetivo: {name}',
    'menu.offsetSummary':
      'El nivel se calcula a partir de: sensor {sensor} · cero del vehículo {vehicleZero} · objetivo: {target}',

    'feedback.intro':
      '¿Has encontrado un problema o tienes una idea? Rellena esto y toca el botón: se ' +
      'abrirá un informe ya preparado en GitHub donde publicarlo (hace falta una cuenta ' +
      'gratuita de GitHub, que se crea en un minuto).',
    'feedback.category': '¿Sobre qué es?',
    'feedback.cat.bug': 'Error',
    'feedback.cat.suggestion': 'Sugerencia',
    'feedback.cat.other': 'Otro',
    'feedback.title': 'Título breve',
    'feedback.desc': '¿Qué ha pasado, o qué te gustaría?',
    'feedback.submit': 'Abrir el informe en GitHub',

    'help.what.h': 'Qué hace Libell',
    'help.what.t':
      'Deja el móvil plano dentro del vehículo con la parte de arriba hacia delante. La ' +
      'pantalla muestra tu vehículo visto desde arriba, y cada rueda te dice qué hacer.',
    'help.first.h': 'Antes del primer uso',
    'help.first.t':
      'Rellena los Ajustes y calibra una vez: los avisos amarillos de la barra superior te ' +
      'lo recuerdan hasta que ambas cosas estén hechas. Todo se guarda.',
    'help.screen.h': 'Cómo leer la pantalla',
    'help.screen.t':
      'Verde ✓: hecho.\n' +
      'Naranja ↑: sube esa rueda al nivel indicado encima.\n' +
      'Rojo ✕: ni tu nivel más alto basta; muévete a un sitio más llano.\n' +
      'Gris –: una rueda baja a la que no llegan tus rampas.\n' +
      'Cuando la burbuja descansa en el centro, estás nivelado.',
    'help.settings.h': 'Las medidas',
    'help.settings.t':
      'En una autocaravana, la distancia entre ejes es la que hay entre el eje delantero y ' +
      'el trasero; en una caravana es, en cambio, la distancia del eje a la rueda jockey. El ' +
      'ancho de vía es la distancia entre las ruedas izquierda y derecha: una autocaravana ' +
      'puede tener anchos distintos delante y detrás, una caravana solo tiene uno. Suele ' +
      'estar en la documentación del vehículo; si no, usa una cinta métrica.',
    'help.ramps.t':
      'Elige un modelo de rampa ya hecho, o añade tus propias alturas de nivel con el ' +
      'botón +. Después la app elige dónde tus rampas hacen más falta y, dentro de la ' +
      'tolerancia, deja el lado del desagüe lo más bajo posible para que el fregadero y la ' +
      'ducha sigan desaguando.',
    'help.calibration.h': 'Calibración',
    'help.calibration.t':
      'El móvil lee su propia inclinación, no la del suelo, y el piso de un vehículo tampoco ' +
      'suele ser perfectamente plano. Calibrar corrige ambas cosas, de modo que lo que ' +
      'muestra la app es el suelo real y no solo cómo está apoyado el móvil.',
    'help.notes.h': 'Bueno saberlo',
    'help.notes.t':
      'Funciona totalmente sin conexión una vez abierta: añádela a tu pantalla de inicio ' +
      'como una app.\n' +
      'En iPhone hay que tocar Iniciar cada vez.\n' +
      'El número de versión de abajo ayuda al informar de problemas.',

    'main.hint':
      'Deja el móvil plano dentro de la autocaravana, con el borde superior hacia delante.',
    'main.start': 'Iniciar',
    'main.waiting': 'Esperando al sensor de inclinación…',
    'main.level': '¡Tu autocaravana está nivelada!',
    'main.denied':
      'Se ha denegado el acceso al movimiento, así que Libell no puede leer la inclinación. ' +
      'Permite el acceso a movimiento y orientación para este sitio y recarga.',
    'main.noSensors':
      'Este dispositivo no expone sensores de movimiento, así que Libell no puede leer la inclinación.',
    'main.https':
      'Libell necesita una conexión segura (HTTPS) para leer los sensores de inclinación. ' +
      'Abre la app por HTTPS e inténtalo de nuevo.',

    'diagram.aria':
      'Vista desde arriba de tu autocaravana con las ruedas que hay que subir marcadas',
    'diagram.caravan.aria':
      'Vista desde arriba de tu caravana con las ruedas del eje y la rueda jockey',
    'diagram.front': 'Delante',
    'diagram.step': 'Nivel {n}',
    'diagram.done': 'Hecho',
    'diagram.noRamp': 'Sin rampa',
    'diagram.wheel.frontLeft': 'DEL IZQ',
    'diagram.wheel.frontRight': 'DEL DER',
    'diagram.wheel.rearLeft': 'TRAS IZQ',
    'diagram.wheel.rearRight': 'TRAS DER',
    'caravan.crankUp': 'Subir con la manivela',
    'caravan.crankDown': 'Bajar con la manivela',

    'tilt.frontBack': 'Delante/detrás',
    'tilt.sideSide': 'Lado/lado',

    'pose.layFlat': 'Deja el móvil plano para medir',
    'pose.portrait':
      'Pon el móvil en vertical (retrato): el borde superior debe apuntar hacia delante',

    'stale.dataUnavailable':
      'No llegan datos nuevos del sensor: la guía está en pausa hasta que vuelvan',

    'sensorFallback.unavailable': 'Sensor externo no disponible.',
    'sensorFallback.phoneHint':
      'El sensor del móvil exige que el móvil esté plano dentro del vehículo; una caja ' +
      'montada de forma permanente no lo necesita.',
    'sensorFallback.retry': 'Reintentar',
    'sensorFallback.usePhone': 'Usar el sensor del móvil',
  },
  de: {
    'topbar.install': 'Installieren',
    'topbar.share': 'Libell teilen',
    'bottombar.settings': 'Einstellungen',
    'bottombar.sound.mute': 'Ton stummschalten',
    'bottombar.sound.unmute': 'Ton einschalten',
    'bottombar.help': 'Hilfe',
    'share.text': 'Richte dein Wohnmobil mit dem Handy waagerecht aus.',
    'share.copied': 'Link kopiert!',
    'install.hint': 'Auf Teilen tippen, dann „Zum Home-Bildschirm“.',
    'share.vehicle.text':
      'Die Fahrzeugkonfiguration meines Wohnmobils für Libell — Maße und Auffahrkeile.',
    'settings.shareVehicle': 'Fahrzeugkonfiguration teilen',
    'setup.incoming.h': 'Empfangene Fahrzeugkonfiguration',
    'setup.incoming.intro': 'Jemand aus deiner Familie hat dir diese Fahrzeugmaße geschickt:',
    'setup.incoming.reminder':
      'Eine Kalibrierung ist nicht dabei — auf diesem Handy musst du trotzdem kalibrieren.',
    'setup.incoming.apply': 'Diese Werte übernehmen',
    'setup.incoming.dismiss': 'Jetzt nicht',
    'setup.incoming.invalid':
      'Dieser Konfigurationslink konnte nicht gelesen werden — es wurde nichts geändert.',

    'lamp.setup': '⚠ Einrichten',
    'lamp.setup.title':
      'Die Fahrzeugeinstellungen wurden noch nie gespeichert — zum Öffnen der Einstellungen tippen',
    'lamp.calibrate': '⚠ Kalibrieren',
    'lamp.calibrate.title': 'Das Handy ist nicht kalibriert — zum Öffnen der Kalibrierung tippen',

    'sensorStatus.connected': 'Externer Sensor verbunden',
    'sensorStatus.disconnected': 'Verbindung zum externen Sensor verloren — für Details tippen',
    'sensorStatus.idle': 'Externer Sensor — zum Verbinden tippen',
    'sensorStatus.idle.guide': 'Externer Sensor — für die iPhone-Anleitung tippen',

    'menu.title': 'Menü',
    'menu.close': 'Menü schließen',
    'menu.settings': 'Einstellungen',
    'menu.calibration': 'Kalibrierung',
    'menu.targets': 'Ziele',
    'menu.feedback': 'Rückmeldung',
    'menu.help': 'Hilfe',
    'menu.intro': 'Einführung anzeigen',
    'menu.about': 'Über Libell',
    'menu.about.tab': 'Über',
    'menu.sensorSource': 'Externer Sensor',
    'menu.advanced': 'ERWEITERT',
    'menu.others': 'SONSTIGES',
    'menu.card.notSaved': 'Nicht gespeichert',
    'menu.card.notDone': 'Nicht erledigt',

    'sensorSource.intro':
      'Verbinde eine EasyLevel-BLE-Box als Alternative zum Sensor des Handys. ' +
      'Erfordert Chrome unter Android mit eingeschaltetem Bluetooth.',
    'sensorSource.connect': 'EasyLevel-Sensor verbinden',
    'sensorSource.reconnect': 'EasyLevel-Sensor neu verbinden',
    'sensorSource.disconnect': 'Trennen',
    'sensorSource.status.phone': 'Der Sensor des Handys wird verwendet.',
    'sensorSource.status.connected': 'Mit dem EasyLevel-Sensor verbunden.',
    'sensorSource.status.connecting': 'Verbinden…',
    'sensorSource.status.disconnected':
      'Die Verbindung zum EasyLevel-Sensor ist abgebrochen — auf Neu verbinden tippen.',
    'sensorSource.err.unsupported': 'Dieser Browser unterstützt Web Bluetooth nicht.',
    'sensorSource.err.failed': 'Verbindung zum EasyLevel-Sensor nicht möglich.',

    'sensorSource.ios.intro':
      'Safari kann sich nicht direkt mit Bluetooth-Sensoren verbinden, aber es gibt einen Umweg:',
    'sensorSource.ios.step1': 'Installiere „Bluefy – Web Bluetooth Browser“ aus dem App Store.',
    'sensorSource.ios.step2': 'Öffne Bluefy und erlaube die Bluetooth-Berechtigung.',
    'sensorSource.ios.step3': 'Rufe in Bluefy dieselbe Libell-Adresse auf.',
    'sensorSource.ios.step4':
      'Öffne hier wieder Externer Sensor — es funktioniert wie unter Android.',
    'sensorSource.ios.note':
      'Bluefy ist eine App von Dritten, nicht von Libell — das erneute Verbinden beim Öffnen ' +
      'erfordert dort eventuell einen manuellen Tipp, statt still zu geschehen.',
    'sensorSource.ios.bluefyLink': 'Bluefy im App Store finden',

    'sensorSource.detail.heading': 'Sensordetails',
    'sensorSource.detail.battery': 'Batterie: {value}',
    'sensorSource.detail.temperature': 'Temperatur: {value}',
    'sensorSource.detail.notAvailable': 'Noch nicht verfügbar',
    'sensorSource.lowBattery':
      '⚠ Batterie schwach ({value}) — die Batterie der Sensorbox sollte bald gewechselt werden.',

    'sensorSource.install.h': 'Einbau-Offset',
    'sensorSource.install.intro':
      'Sobald der Sensor fest eingebaut ist, spielt seine genaue Lage im Gehäuse keine Rolle ' +
      'mehr — nur noch, wie das Gehäuse sitzt. Stelle das Fahrzeug einmal nachweislich ' +
      'waagerecht (Wasserwaage, oder nach dem Auffahren auf die Keile) und setze dann den ' +
      'aktuellen Messwert als waagerecht.',
    'sensorSource.install.now': 'Fahrzeug als waagerecht setzen',
    'sensorSource.install.clear': 'Einbau-Offset löschen',
    'sensorSource.install.status': 'Einbau-Offset: seitlich {roll}°, längs {pitch}°.',
    'sensorSource.install.status.none': 'Kein Einbau-Offset — der Rohwert gilt als waagerecht.',

    'sensorSource.mounting.h': 'Sensormontage',
    'sensorSource.mounting.intro':
      'Die Sensorbox lässt sich auf vier Arten montieren, jeweils um eine Vierteldrehung ' +
      'versetzt. Wähle das Bild, das zu deiner tatsächlichen Montage passt — wenn Libell die ' +
      'falsche Seite anheben will oder vorn/hinten und links/rechts vertauscht, probiere eine andere.',
    'sensorSource.mounting.standard': 'Standard',
    'sensorSource.mounting.rotated90': 'Um 90° gedreht',
    'sensorSource.mounting.rotated180': 'Um 180° gedreht',
    'sensorSource.mounting.rotated270': 'Um 270° gedreht',

    'sensorStatus.title': 'EasyLevel-Sensor',
    'sensorStatus.reading': 'Messwert: {value}',
    'sensorStatus.roll': 'Querneigung',
    'sensorStatus.pitch': 'Längsneigung',
    'sensorStatus.debug': 'Debug-Infos',
    'sensorStatus.debug.intro':
      'Rohwerte direkt aus der Box — zur Fehlersuche, wenn etwas nicht funktioniert.',
    'sensorStatus.debug.deviceId': 'Geräte-ID: {value}',
    'sensorStatus.debug.lastSample': 'Letzte Messung: {value}',
    'sensorStatus.debug.age': 'vor {s} s',
    'sensorStatus.debug.rawAccel': 'Rohes Beschleunigungssignal (x/y/z): {value}',
    'sensorStatus.debug.firmwareTier': 'Firmware-Stufe: {value}',
    'sensorStatus.debug.rawStatusBytes': 'Rohe Status-Bytes: {value}',
    'sensorStatus.debug.copy': 'Debug-Infos kopieren',
    'sensorStatus.debug.copied': 'Debug-Infos kopiert!',
    'sensorStatus.debug.copy.failed': 'Automatisches Kopieren nicht möglich.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimentell: nur versuchen, wenn die Verbindung deiner Box unzuverlässig ist. Fügt ' +
      'nach dem Verbinden eine feste Pause ein, bevor die App zu lesen beginnt.',
    'sensorStatus.debug.connectDelay.enable': 'Verbindungspause aktivieren',
    'sensorStatus.debug.connectDelay.ms': 'Pause (ms)',

    'about.text':
      'Libell hilft dir, dein Wohnmobil oder deinen Wohnwagen mit dem Handy auszurichten, ' +
      'das du ohnehin dabeihast — ohne Libelle, ohne Raten.',
    'about.version': 'Version {v}',
    'about.offline':
      'Funktioniert vollständig offline — das Netz wird nur für Updates der App selbst genutzt.',
    'about.privacy':
      'Alles bleibt auf deinem Handy — kein Konto, kein Tracking, und keine Daten verlassen das Gerät.',
    'about.source': 'Libell ist kostenlos und quelloffen (MIT-Lizenz).',
    'about.source.link': 'Quellcode auf GitHub',

    'onboard.welcome.h': 'Willkommen bei Libell',
    'onboard.welcome.t':
      'Diese kurze Einführung richtet Fahrzeug und Handy ein. Jeder Schritt lässt sich ' +
      'überspringen und später in den Einstellungen erledigen.',
    'onboard.sound.h': 'Ton',
    'onboard.source.h': 'Wie möchtest du messen?',
    'onboard.source.intro':
      'Wähle, von welchem Sensor Libell die Neigung lesen soll — die meisten nehmen einfach das Handy.',
    'onboard.source.phone': 'Dieses Handy',
    'onboard.vehicle.h': 'Was richtest du aus?',
    'onboard.vehicle.intro':
      'Wähle dein Fahrzeug — der Rest dieser Einführung richtet sich danach.',
    'onboard.step1.h': 'Lege das Handy so hin',
    'onboard.next': 'Weiter',
    'onboard.back': 'Zurück',
    'onboard.close': 'Einführung schließen',
    'onboard.done': 'Fertig',
    'onboard.skipStep': 'Überspringen',
    'onboard.skipDefaults': 'Überspringen — Standardwerte nutzen',
    'onboard.skip.consequence':
      'Vorerst überspringen — eine Warnleuchte erinnert dich daran, bis es erledigt ist. So ' +
      'lange gelten die Standardwerte, die oft schon ganz gut passen.',
    'onboard.legend.ok': 'Grün ✓ — dieses Rad steht waagerecht.',
    'onboard.legend.up': 'Orange ↑ — dieses Rad auf die angezeigte Stufe fahren.',
    'onboard.legend.no': 'Rot ✕ — keine Stufe reicht; such dir einen ebeneren Platz.',
    'onboard.legend.dim': 'Grau – — ein tiefes Rad, das deine Keile nicht erreichen.',
    'settings.wheelbase': 'Radstand',
    'settings.trackFront': 'Spurweite vorn',
    'settings.trackRear': 'Spurweite hinten',
    'settings.tolerance': 'Toleranz',
    'settings.stability': 'Stabilität',
    'settings.dwellRest': 'Reaktionsverzögerung (ms)',
    'settings.dwellMotion': 'Reaktionsverzögerung beim Ausrichten (ms)',
    'settings.dwell.hint':
      'Wie lange ein Messwert stabil bleiben muss, bevor sich die angezeigte Zahl ändert. ' +
      'Der zweite Wert gilt nur direkt nach einer Änderung, während du aktiv ausrichtest ' +
      '(etwa beim Auffahren auf einen Keil), damit die Anzeige nicht hinterherhinkt.',
    'settings.vehicle': 'Fahrzeug',
    'vehicle.motorhome': 'Wohnmobil',
    'vehicle.caravan': 'Wohnwagen',
    'settings.axleToJockey': 'Achse bis Stützrad',
    'settings.rearAxle': 'Hinterachse',
    'settings.axle': 'Achse',
    'axle.single': 'Einzeln',
    'axle.boggie': 'Tandem (Doppelachse)',
    'settings.track': 'Spurweite',
    'settings.measureHint':
      'Radstand und Spurweiten stehen im Fahrzeugschein oder im Handbuch — ein Maßband tut ' +
      'es auch; ein paar cm Abweichung machen kaum etwas aus.',
    'settings.measureHint.boggie': 'Bei einer Doppelachse bis zur Mitte des Achspaars messen.',
    'settings.steps': 'Stufenhöhen der Keile',
    'settings.steps.add': 'Stufe hinzufügen',
    'settings.steps.remove': '{value} entfernen',
    'settings.ramp': 'Fertiger Auffahrkeil',
    'settings.ramp.custom': 'Eigener Satz',
    'settings.rampCount': 'Anzahl Keile',
    'settings.drain': 'Abflussseite',
    'settings.rampHint': 'Die App wählt, wo deine Keile am meisten bringen.',
    'settings.drainHint':
      'Wichtig nur, wenn dir wichtig ist, wohin das Wasser aus Spüle und Dusche abläuft — ' +
      'innerhalb der Toleranz lässt die App diese Seite dann am tiefsten, damit es weiter abläuft.',
    'settings.section.vehicle': 'Fahrzeug und Maße',
    'settings.section.ramps': 'Auffahrkeile',
    'settings.section.display': 'Ausrichtung und Anzeige',
    'settings.general': 'Allgemein',
    'settings.language': 'Sprache',
    'settings.language.auto': 'Automatisch (Gerätesprache)',
    'settings.advanced': 'Erweitert',
    'settings.tolerance.hint':
      'Legt fest, wie nah an der Waagerechten als „waagerecht“ gilt — enger für Dusche oder ' +
      'Kühlschrank, großzügiger, wenn ungefähr reicht.',
    'settings.stability.hint':
      'Glättet kleine Schwankungen des Sensors, damit die Zahlen nicht flackern.',
    'drain.none': 'Keine / egal',
    'drain.left': 'Links, Mitte',
    'drain.right': 'Rechts, Mitte',
    'drain.front': 'Vorn, Mitte',
    'drain.rear': 'Hinten, Mitte',
    'drain.frontLeft': 'Vorn links',
    'drain.frontRight': 'Vorn rechts',
    'drain.rearLeft': 'Hinten links',
    'drain.rearRight': 'Hinten rechts',
    'settings.unit': 'Längen anzeigen in',
    'settings.theme': 'Design',
    'theme.system': 'Wie das Handy',
    'theme.light': 'Hell',
    'theme.dark': 'Dunkel',
    'settings.appearance': 'Darstellung',
    'appearance.classic': 'Klassisch',
    'appearance.modern': 'Modern',
    'appearance.glossy': 'Glänzend',
    'settings.appearance.hint':
      'Diese Änderung speichert deine Eingaben und lädt Libell neu, damit das neue Layout überall gilt.',
    'settings.sound': 'Signalton bei waagerecht',
    'settings.soundGuidance': 'Durchgehende Tonführung',
    'settings.soundGuidance.help':
      'Ein Puls wird schneller und höher, je näher du der Waagerechten kommst, mit ' +
      'unterschiedlichem Signal je nachdem, ob du näher kommst oder in die falsche Richtung ' +
      'fährst — so kannst du auf die Keile statt auf den Bildschirm schauen. Still, wenn der ' +
      'Messwert zu unzuverlässig ist, etwa weil er sich zu schnell ändert.',
    'settings.save': 'Speichern',
    'settings.undo': 'Änderungen verwerfen',
    'settings.reset': 'Auf Standardwerte zurücksetzen',

    'settings.tab.vehicle': 'Fahrzeug',
    'settings.tab.ramps': 'Keile',
    'settings.klossar.brandAll': 'Alle',
    'settings.klossar.changeRamp': 'Keil wechseln',
    'settings.rampCountHint':
      'Wie viele Keile du auslegen kannst. Die App legt sie dorthin, wo sie am meisten bringen.',
    'settings.klossar.selected': 'Ausgewählt',
    'settings.klossar.stepsHeading': 'Stufenhöhen',

    'status.measuring': 'Messen…',
    'status.almost': 'Fast waagerecht — noch {left}',
    'status.cantLevel.close':
      'Deine Keile kommen nah heran, reichen hier aber nicht — stell das Fahrzeug um',
    'status.cantLevel.far': 'Deine Keile reichen hier bei Weitem nicht — stell das Fahrzeug um',

    'calibration.intro':
      'Lege das Handy auf eine Fläche, von der du weißt, dass sie waagerecht ist, und tippe ' +
      'auf Jetzt kalibrieren. Die aktuelle Neigung wird zum Nullpunkt.',
    'calibration.status': 'Kalibriert: seitlich {roll}°, längs {pitch}°.',
    'calibration.status.none': 'Nicht kalibriert — der Rohwert des Sensors wird verwendet.',
    'calibration.now': 'Jetzt kalibrieren',
    'calibration.clear': 'Kalibrierung löschen',
    'calibration.err.notRunning':
      'Der Neigungssensor läuft noch nicht — tippe zuerst auf dem Hauptbildschirm auf Start.',
    'calibration.err.notFlat':
      'Das Handy scheint nicht flach zu liegen — lege es auf eine waagerechte Fläche und ' +
      'versuche es erneut.',
    'calibration.sensor.h': 'Handy kalibrieren',
    'calibration.vehicle.h': 'Fahrzeug-Nullpunkt kalibrieren',
    'calibration.guide.intro':
      'Zwei Ebenen:\n' +
      '1. Kalibriere das Handy einmal auf einer waagerechten Fläche (oder mit der 180°-Drehung).\n' +
      '2. Setze bei nachweislich waagerechtem Fahrzeug den gewohnten Platz des Handys als ' +
      'Fahrzeug-Nullpunkt — dann wird auch ein leicht schiefer Tisch herausgerechnet.',
    'calibration.vehicle.intro':
      'Die Sensorkalibrierung stellt das Handy auf null — nicht den Platz, auf dem es liegt. ' +
      'Steht der Tisch leicht schief, würde die App diese Neigung immer anzeigen. Stelle das ' +
      'Fahrzeug einmal nachweislich waagerecht (Wasserwaage, oder nach dem Auffahren auf die ' +
      'Keile), lege das Handy an seinen gewohnten Platz und setze das als waagerecht.',
    'calibration.vehicle.now': 'Aktuelle Lage als waagerecht setzen',
    'calibration.vehicle.clear': 'Fahrzeug-Nullpunkt löschen',
    'calibration.vehicle.status': 'Fahrzeug-Nullpunkt: seitlich {roll}°, längs {pitch}°.',
    'calibration.vehicle.status.none':
      'Kein Fahrzeug-Nullpunkt — der Platz des Handys gilt als eben.',
    'calibration.vehicle.err.notFlat':
      'Das sieht nach mehr als nur Auflageneigung aus (>15°) — steht das Fahrzeug wirklich waagerecht?',
    'calibration.age.today': '(heute)',
    'calibration.age.days': '(vor {n} Tagen)',
    'calibration.check': 'Prüfen',
    'calibration.check.good': 'Immer noch gut — {off}° daneben.',
    'calibration.check.off': '{off}° daneben — neu kalibrieren wäre sinnvoll.',
    'calibration.flip.intro':
      'Keine waagerechte Fläche in der Nähe? Nimm die Umdreh-Kalibrierung: Handy irgendwo ' +
      'halbwegs eben hinlegen, erfassen, das Handy an derselben Stelle um eine halbe Drehung ' +
      '(180°) drehen, erneut erfassen — die Neigung der Fläche hebt sich dabei selbst auf.',
    'calibration.flip.start': 'Durch Umdrehen kalibrieren',
    'calibration.flip.rotate':
      'Drehe das Handy jetzt an derselben Stelle um eine halbe Drehung (180°) und tippe auf Erfassen.',
    'calibration.flip.capture': 'Erfassen',
    'calibration.flip.done': 'Fertig! Deine Fläche neigt sich um {surface}° — herausgerechnet.',
    'calibration.flip.err.moved':
      'Die beiden Erfassungen passen nicht zusammen — hat sich das Handy bewegt? Fang noch ' +
      'einmal von vorn an.',
    'calibration.pill.notDone': 'OFFEN',
    'calibration.pill.done': 'ERLEDIGT',
    'calibration.pill.none': 'KEINER',

    'targets.intro':
      'Speichere eine gewollte Neigung — für die Dusche oder den Grauwasserablauf — und ' +
      'wechsle mit ein paar Tipps dorthin. Normal (waagerecht) ist immer verfügbar und wird ' +
      'nie überschrieben.',
    'targets.normal': 'Normal (waagerecht)',
    'targets.name.placeholder': 'Name (z. B. „Duschablauf“)',
    'targets.add': 'Aktuelle Neigung als neues Ziel speichern',
    'targets.delete': '{name} löschen',
    'targets.err.tooSteep':
      'Das sieht nach mehr als einem gewollten Ziel aus (>15°) — versuche es erneut.',
    'targets.badge': 'Ziel: {name}',
    'menu.offsetSummary':
      'Die Waagerechte wird berechnet aus: Sensor {sensor} · Fahrzeug-Nullpunkt {vehicleZero} · Ziel: {target}',

    'feedback.intro':
      'Ein Problem gefunden oder eine Idee? Fülle das hier aus und tippe auf den Knopf — es ' +
      'öffnet sich ein fertiger Bericht auf GitHub, den du dort abschickst (ein kostenloses ' +
      'GitHub-Konto ist nötig, in einer Minute angelegt).',
    'feedback.category': 'Worum geht es?',
    'feedback.cat.bug': 'Fehler',
    'feedback.cat.suggestion': 'Vorschlag',
    'feedback.cat.other': 'Sonstiges',
    'feedback.title': 'Kurzer Titel',
    'feedback.desc': 'Was ist passiert, oder was wünschst du dir?',
    'feedback.submit': 'Den Bericht auf GitHub öffnen',

    'help.what.h': 'Was Libell macht',
    'help.what.t':
      'Lege das Handy flach ins Fahrzeug, mit der Oberkante nach vorn. Der Bildschirm zeigt ' +
      'dein Fahrzeug von oben, und jedes Rad sagt dir, was zu tun ist.',
    'help.first.h': 'Vor der ersten Nutzung',
    'help.first.t':
      'Fülle die Einstellungen aus und kalibriere einmal — die gelben Schilder in der oberen ' +
      'Leiste erinnern dich daran, bis beides erledigt ist. Alles wird gespeichert.',
    'help.screen.h': 'Den Bildschirm lesen',
    'help.screen.t':
      'Grün ✓: erledigt.\n' +
      'Orange ↑: dieses Rad auf die darüber angezeigte Stufe fahren.\n' +
      'Rot ✕: selbst die höchste Stufe reicht nicht; such dir einen ebeneren Platz.\n' +
      'Grau –: ein tiefes Rad, das deine Keile nicht erreichen.\n' +
      'Wenn die Blase in der Mitte ruht, steht das Fahrzeug waagerecht.',
    'help.settings.h': 'Die Maße',
    'help.settings.t':
      'Bei einem Wohnmobil ist der Radstand der Abstand zwischen Vorder- und Hinterachse; ' +
      'bei einem Wohnwagen stattdessen der Abstand von der Achse zum Stützrad. Die Spurweite ' +
      'ist der Abstand zwischen linkem und rechtem Rad — ein Wohnmobil kann vorn und hinten ' +
      'unterschiedlich breit sein, ein Wohnwagen hat nur eine. Steht meist in den ' +
      'Fahrzeugpapieren, sonst hilft ein Maßband.',
    'help.ramps.t':
      'Wähle ein fertiges Keilmodell, oder füge mit der Plus-Taste eigene Stufenhöhen hinzu. ' +
      'Die App wählt dann, wo deine Keile am meisten bringen — und lässt innerhalb der ' +
      'Toleranz die Abflussseite am tiefsten, damit Spüle und Dusche weiter ablaufen.',
    'help.calibration.h': 'Kalibrierung',
    'help.calibration.t':
      'Das Handy misst seine eigene Neigung, nicht die des Bodens — und der Fahrzeugboden ist ' +
      'selten perfekt eben. Die Kalibrierung korrigiert beides, sodass die App den ' +
      'tatsächlichen Untergrund zeigt und nicht nur, wie das Handy gerade liegt.',
    'help.notes.h': 'Gut zu wissen',
    'help.notes.t':
      'Funktioniert nach dem ersten Öffnen vollständig offline — lege sie wie eine App auf ' +
      'den Home-Bildschirm.\n' +
      'Auf dem iPhone musst du jedes Mal auf Start tippen.\n' +
      'Die Versionsnummer unten hilft bei Fehlermeldungen.',

    'main.hint': 'Lege dein Handy flach ins Wohnmobil, die Oberkante nach vorn.',
    'main.start': 'Start',
    'main.waiting': 'Warten auf den Neigungssensor…',
    'main.level': 'Dein Wohnmobil steht waagerecht!',
    'main.denied':
      'Der Zugriff auf die Bewegungssensoren wurde verweigert, daher kann Libell die Neigung ' +
      'nicht lesen. Erlaube Bewegung und Orientierung für diese Website und lade neu.',
    'main.noSensors':
      'Dieses Gerät bietet keine Bewegungssensoren, daher kann Libell die Neigung nicht lesen.',
    'main.https':
      'Libell braucht eine sichere Verbindung (HTTPS), um die Neigungssensoren zu lesen. ' +
      'Öffne die App über HTTPS und versuche es erneut.',

    'diagram.aria': 'Dein Wohnmobil von oben, mit den Rädern, die angehoben werden müssen',
    'diagram.caravan.aria': 'Dein Wohnwagen von oben, mit den Achsrädern und dem Stützrad',
    'diagram.front': 'Vorn',
    'diagram.step': 'Stufe {n}',
    'diagram.done': 'Fertig',
    'diagram.noRamp': 'Kein Keil',
    'diagram.wheel.frontLeft': 'VORN L',
    'diagram.wheel.frontRight': 'VORN R',
    'diagram.wheel.rearLeft': 'HINTEN L',
    'diagram.wheel.rearRight': 'HINTEN R',
    'caravan.crankUp': 'Hochkurbeln',
    'caravan.crankDown': 'Herunterkurbeln',

    'tilt.frontBack': 'Längs',
    'tilt.sideSide': 'Quer',

    'pose.layFlat': 'Zum Messen das Handy flach hinlegen',
    'pose.portrait': 'Drehe das Handy hochkant (Porträt) — die Oberkante muss nach vorn zeigen',

    'stale.dataUnavailable': 'Keine neuen Sensordaten — die Führung pausiert, bis sie zurückkommen',

    'sensorFallback.unavailable': 'Externer Sensor nicht verfügbar.',
    'sensorFallback.phoneHint':
      'Der Handysensor verlangt, dass das Handy flach im Fahrzeug liegt — eine fest ' +
      'eingebaute Box nicht.',
    'sensorFallback.retry': 'Erneut versuchen',
    'sensorFallback.usePhone': 'Handysensor verwenden',
  },
} as const;

export type Language = keyof typeof MESSAGES;
export type MessageKey = keyof (typeof MESSAGES)['en'];

/** Each language named in itself — a picker always names a language in its
 * own language, never translated through `t()`, so a Swedish reader can
 * still find "Deutsch" and vice versa. Typed against `Language`, so a new
 * dictionary cannot ship without a name here. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  sv: 'Svenska',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
};

/** Every language Libell ships, in the order the Language picker lists them:
 * alphabetical by the name each is shown under. Derived rather than written
 * out, so a new dictionary lands in the right place on its own; sorted in a
 * fixed locale rather than the viewer's, so the list reads the same on every
 * phone and the order is testable. "Automatic" is deliberately not in here —
 * `settingsPanel.ts` pins it above this list, never sorted into it. */
export const LANGUAGES: readonly Language[] = (Object.keys(LANGUAGE_NAMES) as Language[]).sort(
  (a, b) => LANGUAGE_NAMES[a].localeCompare(LANGUAGE_NAMES[b], 'en'),
);

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** The locale's language subtag decides — 'de-AT', 'de' and 'DE' all pick
 * German; a region we ship no dictionary for falls back to English. */
function detectLanguage(): Language {
  const locale = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : undefined;
  const subtag = locale?.split('-')[0];
  return isLanguage(subtag) ? subtag : 'en';
}

/** Stored override, validated against the shipped languages; anything else
 * (missing, corrupt, a language we dropped) → auto-detect. */
export function resolveLanguage(stored: unknown): Language {
  return isLanguage(stored) ? stored : detectLanguage();
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

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
    'share.text': 'Level your motorhome or caravan with your phone.',
    'share.copied': 'Link copied!',
    // Update check (#301): tapping the name / version in the top bar.
    'update.check': 'Check for a new version',
    'update.checking': 'Checking for updates…',
    'update.updating': 'Updating to the new version…',
    'update.latest': 'You have the latest version',
    'update.offline': "No connection, can't check for updates",
    'update.unsupported': "Updates aren't available here",
    'install.hint': 'Tap Share, then "Add to Home Screen".',
    // "Share vehicle setup" (R41, #207): a link carrying only the vehicle-
    // geometry fields (never calibration, never UI/behavior preferences —
    // see domain/vehicleShare.ts) so a family member using the same
    // vehicle doesn't have to re-measure and retype everything by hand.
    'share.vehicle.text': 'My vehicle setup for Libell — measurements and ramps.',
    'settings.shareVehicle': 'Share to another phone',
    'setup.incoming.h': 'Incoming vehicle setup',
    'setup.incoming.intro': 'A family member shared these vehicle measurements with you:',
    'setup.incoming.reminder':
      "This does not include any calibration — you'll still need to calibrate on this phone.",
    'setup.incoming.apply': 'Use these values',
    'setup.incoming.dismiss': 'Not now',
    'setup.incoming.invalid': "That vehicle-setup link couldn't be read — nothing was changed.",

    'lamp.setup': '⚠ Measurements',
    'lamp.setup.title': 'The vehicle measurements have never been saved — tap to open Settings',
    'lamp.calibrate': '⚠ Calibrate',
    'lamp.zero': '⚠ Zero',
    'lamp.calibrate.title': 'The phone is not calibrated — tap to open Calibration',
    'lamp.zero.title': 'The vehicle is not zeroed — tap to open Calibration',
    'lamp.calibrate.title.sensor': 'The box is not zeroed — tap to open the box',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    // Deliberately just an icon/dot, no numbers — detail lives one tap
    // away in the "External sensor" menu page.
    'sensorStatus.connected': 'Sensor box connected',
    'sensorStatus.disconnected': 'Sensor box — lost contact, tap for details',
    // Screen-cleanup follow-up: shown whenever the phone's own sensor is
    // active but an external one is available to connect — the only
    // remaining entry point to External sensor now that the ☰ menu no
    // longer carries it.
    'sensorStatus.idle': 'Sensor box — tap to connect',
    // iOS Safari (R39): tapping this opens the Bluefy workaround guide
    // instead of a connect flow that could never work there.
    'sensorStatus.idle.guide': 'Sensor box — tap for iPhone setup guide',

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
    'menu.sensorSource': 'Sensor box',
    // Modern-only heading (#152) grouping External sensor + Targets above
    // "OTHER" — distinct key from settings.advanced (#157), a different
    // heading in a different part of the UI.
    'menu.advanced': 'ADVANCED',
    'menu.others': 'OTHER',
    'menu.card.notDone': 'Not done',

    // EasyLevel BLE box (#116) — an opt-in alternative to the phone's own
    // sensor, only ever shown when Web Bluetooth exists (`menu.ts`).
    // The device sentence only — the browser requirement is the same for
    // every box and is shown once per page (#272), not once per row.
    'sensorSource.connect': 'Connect {name} sensor',
    'sensorSource.disconnect': 'Disconnect',
    // Shown on a source's own row while a DIFFERENT external source is
    // feeding readings (#272) — claiming the phone is active would be
    // plainly wrong once there is more than one box to choose from.
    'sensorSource.status.connecting': 'Connecting…',
    // Connection lost while the box stays the selected source (#129) —
    // distinct from the plain "connected" text above so the settings page
    // never claims a live link that no longer exists.
    'sensorSource.err.unsupported': 'Web Bluetooth is not supported in this browser.',
    // Some boxes ask for a password before they will talk (#272). Kept
    // separate from the generic failure so the user knows the hardware is
    // fine and only the password is wrong.
    'sensorSource.err.password':
      'The {name} box did not accept its password. Change it back in the manufacturer’s own app, or reset the box.',
    'sensorSource.err.failed': 'Could not connect to the {name} sensor.',

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
    'sensorSource.ios.step4': 'Open Sensor box here again — it works like on Android.',
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
    'sensorSource.install.now': 'Zero now',
    'sensorSource.install.clear': 'Forget the zero',
    'sensorSource.install.status': 'Zero: side/side {roll}°, front/back {pitch}°.',
    'sensorSource.install.status.none': 'Not zeroed yet — the box measures as it sits.',

    // Learn the mounting (#293): Libell watches the box while the user
    // lifts the front, then the right side — no vendor app needed.
    'sensorSource.learn.h': 'Learn the mounting',
    'sensorSource.learn.intro':
      'Libell learns the direction from two lifts: first the front, then the right side.',
    'sensorSource.learn.start': 'Learn the mounting',
    'sensorSource.learn.step.front':
      'Raise the vehicle’s front a few centimetres, then press the button.',
    'sensorSource.learn.capture.front': 'The front is raised',
    'sensorSource.learn.step.right':
      'Lower the front again. Now raise the right side a few centimetres, then press the button.',
    'sensorSource.learn.capture.right': 'The right side is raised',
    'sensorSource.learn.cancel': 'Cancel',
    'sensorSource.learn.status.learned': 'Mounting learned.',
    'sensorSource.learn.status.none': 'No mounting learned — the box’s own directions are used.',
    'sensorSource.learn.done':
      'Done! Check it: raise the front and Libell should point to the rear wheels.',
    'sensorSource.learn.err.tooSmall':
      'The vehicle hardly moved. Raise it a little more and try again.',
    'sensorSource.learn.err.ambiguous':
      'Both directions moved about as much. Raise only the front, then only the right side, and try again.',
    'sensorSource.learn.err.arrow':
      'No arrow points forward. Turn the box so one of its arrows points forward, then try again.',
    'sensorSource.learn.err.mirrored':
      'The box seems upside down, or the wrong side was raised. Check, then try again.',
    'sensorSource.learn.err.sameAxis':
      'Both lifts tilted the same way. Raise the front first, then the right side, and try again.',

    // Sensor status page: reached by tapping the sensor row on the
    // External sensor page. `reading` is the same roll/pitch the main
    // screen already computes, shown here too so a user checking the box
    // itself doesn't have to leave this page to see it move.
    'sensorStatus.title': '{name} sensor',
    'sensorStatus.reading': 'Tilt now: {value}',
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
    'sensorStatus.advanced': 'Advanced',
    'sensorStatus.silentReconnect.intro':
      'This browser cannot yet reconnect to the box on its own, so after a restart you pick it in the list again. In Chrome you can turn this on yourself.',
    'sensorStatus.silentReconnect.steps':
      'Open {address}, search for “web bluetooth”, set “Use the new permissions backend for Web Bluetooth” to Enabled and tap Relaunch. Then connect the box once.',
    'sensorStatus.silentReconnect.copy': 'Copy {address}',
    'sensorStatus.silentReconnect.copied': 'Copied — paste it into Chrome’s address bar.',
    // Connect-delay workaround (#212): an experimental, off-by-default
    // hardware-compatibility knob, not a normal setting — only worth
    // touching if the box's connection is actually unreliable.
    'sensorStatus.debug.connectDelay.intro':
      'Experimental: only try this if your box’s connection is unreliable. Adds a fixed pause after connecting, before the app starts reading from it.',
    'sensorStatus.debug.connectDelay.enable': 'Enable connect delay',
    'sensorStatus.debug.connectDelay.ms': 'Delay (ms)',

    'about.text':
      'Libell helps you level your motorhome or caravan with the phone you ' +
      'already have, without guessing.',
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
    // #287: shown on the source step only while a box is the active source.
    'onboard.source.externalActive':
      'A sensor box is active now. Choosing this phone skips the phone calibration steps — to calibrate the phone, first tap "Disconnect" on the Sensor box page.',
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
    'onboard.legend.dim': 'Gray – — no ramp at that wheel; leave it as it is.',
    'settings.wheelbase': 'Wheelbase',
    'settings.trackFront': 'Track width front',
    'settings.trackRear': 'Track width rear',
    'settings.tolerance': 'Tolerance',
    'settings.stability': 'Stability',
    'settings.dwellRest': 'Response delay (ms)',
    'settings.dwellMotion': 'Response delay while adjusting (ms)',
    'settings.dwell.hint': 'How long a reading must hold before the number changes.',
    'settings.vehicle': 'Vehicle',
    'vehicle.motorhome': 'Motorhome',
    'vehicle.caravan': 'Caravan',
    'settings.axleToJockey': 'Axle to jockey wheel',
    'settings.rearAxle': 'Rear axle',
    'settings.axle': 'Axle',
    'axle.single': 'Single',
    'axle.boggie': 'Tandem (boggie)',
    'settings.track': 'Track width',
    'settings.measureHint': "They're in the registration document. A few cm off doesn't matter.",
    'settings.measureHint.caravan':
      "Measure from the axle to the jockey wheel. A few cm off doesn't matter.",
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
    'settings.drainHint': 'Within the tolerance, this side is left lowest so water drains.',
    'settings.section.vehicle': 'Vehicle & measurements',
    'settings.section.ramps': 'Ramps',
    // General (screen-cleanup follow-up): language/theme/sound, common
    // enough to want a visible home — a Modern tab, or this Classic
    // section — rather than Advanced's rarely-tuned pile.
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.language.auto': 'Automatic (device language)',
    // Design review: the fields inside Advanced had labels but no
    // explanation of what they actually do — this is why the disclosure
    // "saknar beskrivning" (was missing a description). Split into one hint
    // per field (follow-up), each placed right below its own field — the
    // same pattern the response-delay hint below already uses — instead of
    // one combined paragraph ahead of both fields.
    'settings.tolerance.hint': 'How close to level counts as level.',
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
    'settings.sound': 'Chime when level',
    'settings.soundGuidance': 'Continuous audio guidance',
    'settings.soundGuidance.help': 'The beep gets faster and higher the closer you get to level.',
    'settings.undo': 'Undo',
    'settings.saved': 'Saved',
    'settings.more': 'More',
    'settings.fineTuning': 'Fine-tuning',
    'settings.resetAll': 'Reset all settings',
    'settings.err.positive': 'Enter a number above 0. The previous value still applies.',
    'settings.err.notNegative': 'Enter 0 or more. The previous value still applies.',

    'settings.tab.vehicle': 'Vehicle',
    'settings.tab.ramps': 'Ramps',
    'settings.tab.level': 'Level',
    'settings.klossar.brandAll': 'All',
    'settings.klossar.changeRamp': 'Change ramp',
    'settings.rampCountHint': 'The app puts them where they help most.',
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
    'calibration.step.phone.done': 'Phone calibrated',
    'calibration.step.phone.hint': 'Lay the phone on something flat.',
    'calibration.step.flipLink': 'No flat surface? Flip the phone',
    'calibration.step.vehicle.done': 'Zeroed',
    'calibration.step.vehicle.hint':
      'Level the vehicle with a spirit level and put the phone in its usual spot.',
    'calibration.step.vehicle.now': 'Zero now',
    'calibration.clear': 'Clear calibration',
    'calibration.err.notRunning':
      'The tilt sensor is not running yet — tap Start on the main screen first.',
    'calibration.err.notFlat':
      'The phone does not look flat — place it on a level surface and try again.',
    // Design review: both card headings now lead with the verb "Calibrate"
    // — they used to name what each card was about ("Phone sensor",
    // "Vehicle zero position") without naming the shared action.
    'calibration.sensor.h': 'Calibrate the phone',
    'calibration.vehicle.h': 'Zero the vehicle',
    // Design review: the two-layer overview used to live only on the Help
    // page ('help.calibration.t' below) — moved to the top of the actual
    // Kalibrering tab, where it is actionable, not just informational.
    'calibration.vehicle.intro':
      'Calibration is about the phone, not the spot where it lies. If the table tilts a little, the app shows that tilt. Level the vehicle once with a spirit level, put the phone in its usual place and zero.',
    'calibration.vehicle.now': 'Zero now',
    'calibration.vehicle.clear': 'Forget the zero',
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
    'targets.normal': 'Normal (level)',
    'targets.name.placeholder': 'Name (e.g. "Shower drain")',
    'targets.defaultName': 'Target {n}',
    'targets.add': 'Save current tilt as new target',
    'targets.delete': 'Delete {name}',
    'targets.err.tooSteep': 'That looks like more than an intentional target (>15°) — try again.',
    'targets.badge': 'Target: {name}',
    // Offset summary (#160): read-only, inside the menu only — never the
    // main screen (see targetBadge.ts/R31's own guard against that).

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

    // Help tab (#326): fold-out topics, one fact per line (R28). The
    // screens themselves explain how; these say what and where.
    'help.screen.h': 'Reading the screen',
    'help.screen.t':
      'Green ✓: done, nothing to do.\n' +
      'Orange ↑: drive that wheel up onto the step shown next to it.\n' +
      'Red ✕: your ramps are not enough here. Move the vehicle.\n' +
      'Gray –: no ramp at that wheel. Leave it as it is.\n' +
      'When the bubble rests in the middle, you are level.',
    'help.what.t':
      'Lay the phone flat in the vehicle, top toward the front, in the same spot every time.\n' +
      'With a sensor box it does not matter how the phone lies.',
    'help.settings.h': 'The measurements',
    'help.measures.h': 'Enter the measurements',
    'help.settings.t':
      'Wheelbase and track width. They are in the vehicle papers, or measure with a tape.\n' +
      'On a caravan, the wheelbase is the distance from the axle to the jockey wheel.',
    'help.ramps.t':
      'Pick your ramps or type in the step heights. Libell puts them where they help most.',
    'help.calibration.h': 'Calibrate and zero',
    'help.calibration.t':
      'Calibrate the phone once: lay it on a flat surface and tap Calibrate now.\n' +
      'Then zero when the vehicle is level, with the phone in its usual place.\n' +
      'With a sensor box you zero on the box’s page. It needs no calibration.\n' +
      'The ⚠ Calibrate or ⚠ Zero lamp stays on until it is done.',
    'help.sensor.h': 'Sensor box',
    'help.sensor.t':
      'A box in the vehicle can measure instead of the phone.\n' +
      'Tap the sensor icon at the top right to connect. The box’s page shows the rest step by step.\n' +
      'The Xparkle must stand upright.\n' +
      'A box with arrows lies flat, lid up, with one arrow pointing forward.\n' +
      'On iPhone you need the Bluefy browser.',
    'help.targets.h': 'Targets and sound',
    'help.targets.t':
      'Save a tilt you want, for example toward the shower drain, and switch between them.\n' +
      'The button in the middle of the bottom bar turns sound on and off.',
    'help.trouble.h': 'If something is wrong',
    'help.trouble.t':
      '“Measuring…”: the vehicle is rocking. Wait until it is still.\n' +
      '“Lay the phone flat to measure”: the phone is tilted too much to measure.\n' +
      '“Lost contact with the box”: tap Reconnect and pick the box in the list.\n' +
      'On iPhone: tap Start each time you open the app.\n' +
      'Still wrong? Write a report under Feedback.',
    'help.open': 'Open {name}',
    'help.open.sensor': 'Open the sensor',
    'help.open.feedback': 'Write a report',

    'main.hint': 'Lay your phone flat inside the vehicle, top edge toward the front.',
    'main.start': 'Start',
    'main.waiting': 'Waiting for the tilt sensor…',
    'main.level': 'Your vehicle is level!',
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
    'pose.sensorHint': 'It only measures right lying flat, top up.',
    'pose.openSensorPage': 'Show the box',
    'pose.sensorExtreme': 'The box is tilted too far',
    'pose.sensorUpsideDown': 'The box looks upside down',
    'pose.sensorNotUpright': 'The box is lying down',
    'pose.sensorHintUpright': 'It only measures right standing up.',
    'calibration.external.h': 'Zero the vehicle',
    'calibration.external.intro': 'Level the vehicle once with a spirit level, then zero.',
    'calibration.external.working': 'Zeroing…',
    'calibration.external.done': '{name} is zeroed: this position now counts as level.',
    'calibration.external.err.notConnected': '{name} is not connected. Connect it and try again.',
    'calibration.external.err.failed':
      'Could not zero {name}. Nothing was changed. Check the connection and try again.',
    'pose.portrait': 'Turn the phone upright (portrait) — the top edge must point forward',

    'stale.dataUnavailable': 'No new sensor data — guidance is paused until it returns',

    // Sensor unavailable fallback prompt (#134): shown instead of the
    // plain "waiting" hint once an EasyLevel connection cannot be
    // reached — never a silent or automatic switch to the phone (ADR
    // 0014's calibration split), always this explicit Retry / "Use phone
    // sensor" choice.
    'sensorFallback.lost': 'Lost contact with the box',
    'sensorFallback.autoRetry': 'Trying again automatically…',
    'sensorFallback.connect': 'Connect the box',
    'sensorFallback.pick': 'Tap and pick your box in the list.',
    'sensorFallback.notFound': 'No box found? Check that it is on and close by.',
    'sensorFallback.retry': 'Reconnect',
    'sensorFallback.usePhone': 'Use the phone instead',
    // Box page (#314, the #309 UX review): the mounting picker, the
    // header and the three-step setup checklist.
    'mounting.prompt.upright': 'Tap where the box’s back (the screw mount) points.',
    'mounting.prompt.arrow':
      'One of the box’s arrows (on the lid, or on the circuit board under it) points forward. Which side faces the front?',
    'mounting.placement.wide': 'Long side forward',
    'mounting.placement.short': 'Short side forward',
    'mounting.facing.front': 'Points to the front',
    'mounting.facing.right': 'Points to the right',
    'mounting.facing.rear': 'Points to the rear',
    'mounting.facing.left': 'Points to the left',
    'box.state.connected': 'Connected',
    'box.state.lost': 'Lost contact',
    'box.state.notConnected': 'Not connected',
    'box.state.battery': 'battery {value}',
    'box.connect': 'Connect',
    'box.step.position.upright.ok': 'Stands upright',
    'box.step.position.upright.bad': 'Lying down: stand it upright, facing any way',
    'box.step.position.flat.ok': 'Lies flat',
    'box.step.position.flat.bad': 'Tilted too far: lay it flat, top up',
    'box.step.position.flat.upsideDown':
      'Upside down: turn it lid up. The maker advises against mounting it upside down.',
    'box.step.position.waiting': 'Position: waiting for a reading',
    'box.step.direction.todo': 'Pick the direction',
    'box.step.direction.done': 'Direction set',
    'box.step.direction.learn': 'Not sure? Learn it by raising the front',
    'box.step.zero.todo': 'Zero the vehicle',
    'box.step.zero.done': 'Zeroed',
    'box.step.zero.hint': 'Level the vehicle with a spirit level, then zero.',
    'box.forgetDirection': 'Forget the direction',
    'onboard.boxPosition.h': "The box's position",
    'onboard.boxPosition.later':
      "Direction and zero are set the first time you park. The box's page guides you, and the ⚠ Zero lamp reminds you until it's done.",
    'sensorList.title': 'Sensor box',
    'sensorList.phone': "The phone's own sensor is used when no box is connected.",
    'box.step.zero.again': 'Zero again',
  },
  sv: {
    'topbar.install': 'Installera',
    'topbar.share': 'Dela Libell',
    'bottombar.settings': 'Inställningar',
    'bottombar.sound.mute': 'Stäng av ljud',
    'bottombar.sound.unmute': 'Slå på ljud',
    'bottombar.help': 'Hjälp',
    'share.text': 'Få husbilen eller husvagnen i våg med telefonen.',
    'share.copied': 'Länken kopierad!',
    'update.check': 'Sök efter ny version',
    'update.checking': 'Söker efter uppdatering…',
    'update.updating': 'Uppdaterar till den nya versionen…',
    'update.latest': 'Du har den senaste versionen',
    'update.offline': 'Ingen anslutning, kan inte söka efter uppdatering',
    'update.unsupported': 'Uppdateringar är inte tillgängliga här',
    'install.hint': 'Tryck på Dela och sedan "Lägg till på hemskärmen".',
    'share.vehicle.text': 'Mina fordonsmått för Libell — mått och klossar.',
    'settings.shareVehicle': 'Dela till en annan telefon',
    'setup.incoming.h': 'Inkommande fordonsinställning',
    'setup.incoming.intro': 'En familjemedlem har delat de här fordonsmåtten med dig:',
    'setup.incoming.reminder':
      'Ingen kalibrering följer med — du behöver fortfarande kalibrera den här telefonen.',
    'setup.incoming.apply': 'Använd dessa värden',
    'setup.incoming.dismiss': 'Inte nu',
    'setup.incoming.invalid': 'Länken för fordonsinställning gick inte att läsa – inget ändrades.',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    'sensorStatus.connected': 'Sensorbox ansluten',
    'sensorStatus.disconnected': 'Sensorbox — tappade kontakten, tryck för detaljer',
    'sensorStatus.idle': 'Sensorbox — tryck för att ansluta',
    'sensorStatus.idle.guide': 'Sensorbox — tryck för guide till iPhone',

    'lamp.setup': '⚠ Mått',
    'lamp.setup.title': 'Fordonets mått har aldrig sparats — tryck för att öppna Inställningar',
    'lamp.calibrate': '⚠ Kalibrera',
    'lamp.zero': '⚠ Nollställ',
    'lamp.calibrate.title': 'Telefonen är inte kalibrerad — tryck för att öppna Kalibrering',
    'lamp.zero.title': 'Fordonet är inte nollställt — tryck för att öppna Kalibrering',
    'lamp.calibrate.title.sensor': 'Boxen är inte nollställd — tryck för att öppna boxen',

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
    'menu.sensorSource': 'Sensorbox',
    'menu.advanced': 'AVANCERAT',
    'menu.others': 'ÖVRIGT',
    'menu.card.notDone': 'Ej gjord',

    // EasyLevel-boxen via BLE (#116) — ett tillval utöver telefonens egen
    // sensor, visas bara när Web Bluetooth finns (`menu.ts`).
    'sensorSource.connect': 'Anslut {name}-sensor',
    'sensorSource.disconnect': 'Koppla från',
    'sensorSource.status.connecting': 'Ansluter…',
    'sensorSource.err.unsupported': 'Den här webbläsaren stöder inte Web Bluetooth.',
    'sensorSource.err.password':
      '{name}-boxen godtog inte lösenordet. Ändra tillbaka det i tillverkarens egen app, eller nollställ boxen.',
    'sensorSource.err.failed': 'Kunde inte ansluta till {name}-sensorn.',

    'sensorSource.ios.intro':
      'Safari kan inte ansluta till Bluetooth-sensorer direkt, men det finns en lösning:',
    'sensorSource.ios.step1': 'Installera "Bluefy – Web Bluetooth Browser" från App Store.',
    'sensorSource.ios.step2': 'Öppna Bluefy och tillåt Bluetooth-behörigheten.',
    'sensorSource.ios.step3': 'Gå till samma Libell-adress i Bluefy.',
    'sensorSource.ios.step4': 'Öppna Sensorbox här igen — det fungerar som på Android.',
    'sensorSource.ios.note':
      'Bluefy är en tredjepartsapp som inte byggs av Libell — återanslutning när du öppnar ' +
      'appen kan behöva en manuell tryckning där, istället för att ske tyst.',
    'sensorSource.ios.bluefyLink': 'Hitta Bluefy i App Store',

    'sensorSource.detail.temperature': 'Temperatur: {value}',
    'sensorSource.detail.notAvailable': 'Inte tillgängligt ännu',
    'sensorSource.lowBattery':
      '⚠ Låg batterinivå ({value}) — överväg att byta batteri i sensorboxen snart.',

    // Installationskalibrering (#131, ADR 0014): samma "fordonets nolläge"
    // som R24 redan använder för telefonen, generaliserat till en permanent
    // monterad extern sensor.
    'sensorSource.install.now': 'Nollställ nu',
    'sensorSource.install.clear': 'Glöm nolläget',
    'sensorSource.install.status': 'Nolläge: sidled {roll}°, längsled {pitch}°.',
    'sensorSource.install.status.none': 'Inget nolläge ännu — boxen mäter som den sitter.',

    // Lär in monteringen (#293): Libell följer boxen medan användaren
    // höjer fronten och sedan höger sida — ingen tillverkarapp behövs.
    'sensorSource.learn.h': 'Lär in monteringen',
    'sensorSource.learn.intro':
      'Libell lär sig riktningen från två lyft: först fronten, sedan höger sida.',
    'sensorSource.learn.start': 'Lär in monteringen',
    'sensorSource.learn.step.front':
      'Höj fordonets front några centimeter och tryck sedan på knappen.',
    'sensorSource.learn.capture.front': 'Fronten är höjd',
    'sensorSource.learn.step.right':
      'Sänk fronten igen. Höj nu höger sida några centimeter och tryck sedan på knappen.',
    'sensorSource.learn.capture.right': 'Höger sida är höjd',
    'sensorSource.learn.cancel': 'Avbryt',
    'sensorSource.learn.status.learned': 'Monteringen är inlärd.',
    'sensorSource.learn.status.none': 'Ingen inlärd montering — boxens egna riktningar används.',
    'sensorSource.learn.done': 'Klart! Kontrollera: höj fronten så ska Libell peka ut bakhjulen.',
    'sensorSource.learn.err.tooSmall': 'Fordonet rörde sig knappt. Höj lite mer och försök igen.',
    'sensorSource.learn.err.ambiguous':
      'Båda riktningarna rörde sig ungefär lika mycket. Höj bara fronten, sedan bara höger sida, och försök igen.',
    'sensorSource.learn.err.arrow':
      'Ingen pil pekar framåt. Vrid boxen så att en av dess pilar pekar framåt och försök igen.',
    'sensorSource.learn.err.mirrored':
      'Boxen verkar sitta upp och ner, eller så lyftes fel sida. Kontrollera och försök igen.',
    'sensorSource.learn.err.sameAxis':
      'Båda lyften lutade åt samma håll. Höj fronten först och sedan höger sida, och försök igen.',

    'sensorStatus.title': '{name}-sensor',
    'sensorStatus.reading': 'Lutning nu: {value}',
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
    'sensorStatus.advanced': 'Avancerat',
    'sensorStatus.silentReconnect.intro':
      'Den här webbläsaren kan ännu inte återansluta till boxen av sig själv, så efter en omstart väljer du den i listan igen. I Chrome kan du slå på det själv.',
    'sensorStatus.silentReconnect.steps':
      'Öppna {address}, sök på ”web bluetooth”, sätt ”Use the new permissions backend for Web Bluetooth” till Enabled och tryck Relaunch. Anslut sedan boxen en gång.',
    'sensorStatus.silentReconnect.copy': 'Kopiera {address}',
    'sensorStatus.silentReconnect.copied': 'Kopierat – klistra in i Chromes adressfält.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimentellt: prova bara om boxens anslutning är opålitlig. Lägger till en fast paus efter anslutning, innan appen börjar läsa av den.',
    'sensorStatus.debug.connectDelay.enable': 'Aktivera anslutningsfördröjning',
    'sensorStatus.debug.connectDelay.ms': 'Fördröjning (ms)',

    'about.text':
      'Libell hjälper dig att få husbilen eller husvagnen i våg med telefonen ' +
      'du redan har, utan att gissa.',
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
    'onboard.source.externalActive':
      'En sensorbox är aktiv nu. Väljer du telefonen hoppar guiden över telefonens kalibrering — för att kalibrera telefonen, tryck först på "Koppla från" på sidan Sensorbox.',
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
    'onboard.legend.dim': 'Grått – — ingen kloss vid det hjulet, låt det vara.',

    'settings.wheelbase': 'Hjulbas',
    'settings.trackFront': 'Spårvidd fram',
    'settings.trackRear': 'Spårvidd bak',
    'settings.tolerance': 'Tolerans',
    'settings.stability': 'Stabilitet',
    'settings.dwellRest': 'Svarsfördröjning (ms)',
    'settings.dwellMotion': 'Svarsfördröjning vid justering (ms)',
    'settings.dwell.hint': 'Hur länge en mätning ska hålla i sig innan siffran ändras.',
    'settings.vehicle': 'Fordon',
    'vehicle.motorhome': 'Husbil',
    'vehicle.caravan': 'Husvagn',
    'settings.axleToJockey': 'Axel till stödhjul',
    'settings.rearAxle': 'Bakaxel',
    'settings.axle': 'Axel',
    'axle.single': 'Enkel',
    'axle.boggie': 'Boggie',
    'settings.track': 'Spårvidd',
    'settings.measureHint': 'Står i registreringsbeviset. Några cm fel gör inget.',
    'settings.measureHint.caravan': 'Mät från axeln till stödhjulet. Några cm fel gör inget.',
    'settings.measureHint.boggie': 'Med boggie mäter du till mitten av axelparet.',
    'settings.steps': 'Klossarnas steghöjder',
    'settings.steps.add': 'Lägg till steg',
    'settings.steps.remove': 'Ta bort {value}',
    'settings.ramp': 'Färdiga klossar',
    'settings.ramp.custom': 'Egen uppsättning',
    'settings.rampCount': 'Antal klossar',
    'settings.drain': 'Avloppssida',
    'settings.rampHint': 'Appen väljer var klossarna gör mest nytta.',
    'settings.drainHint':
      'Inom toleransen hamnar den här sidan lägst, så att vattnet rinner undan.',
    'settings.section.vehicle': 'Fordon och mått',
    'settings.section.ramps': 'Klossar',
    'settings.general': 'Allmänt',
    'settings.language': 'Språk',
    'settings.language.auto': 'Automatiskt (enhetens språk)',
    'settings.tolerance.hint': 'Hur nära våg som räknas som i våg.',
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
    'settings.sound': 'Ljudsignal när det är i våg',
    'settings.soundGuidance': 'Kontinuerlig ljudvägledning',
    'settings.soundGuidance.help': 'Pipet går snabbare och ljusare ju närmare våg du kommer.',
    'settings.undo': 'Ångra',
    'settings.saved': 'Sparat',
    'settings.more': 'Mer',
    'settings.fineTuning': 'Finjustering',
    'settings.resetAll': 'Återställ alla inställningar',
    'settings.err.positive': 'Ange ett tal större än 0. Det förra värdet gäller.',
    'settings.err.notNegative': 'Ange 0 eller mer. Det förra värdet gäller.',

    'settings.tab.vehicle': 'Fordon',
    'settings.tab.ramps': 'Klossar',
    'settings.tab.level': 'I våg',
    'settings.klossar.brandAll': 'Alla',
    'settings.klossar.changeRamp': 'Byt klossar',
    'settings.rampCountHint': 'Appen lägger dem där de gör mest nytta.',
    'settings.klossar.selected': 'Vald',
    'settings.klossar.stepsHeading': 'Steghöjder',

    'status.measuring': 'Mäter…',
    'status.almost': 'Nästan i våg — {left} kvar',
    'status.cantLevel.close': 'Klossarna räcker nästan här — flytta fordonet',
    'status.cantLevel.far': 'Klossarna räcker inte alls här — flytta fordonet',

    'calibration.intro':
      'Lägg telefonen på en yta du vet är plan och tryck sedan på Kalibrera nu. ' +
      'Den aktuella lutningen blir nollpunkten.',
    'calibration.status': 'Kalibrerad: sidled {roll}°, längsled {pitch}°.',
    'calibration.status.none': 'Inte kalibrerad — använder sensorn som den är.',
    'calibration.now': 'Kalibrera nu',
    'calibration.step.phone.done': 'Telefonen kalibrerad',
    'calibration.step.phone.hint': 'Lägg telefonen på något plant.',
    'calibration.step.flipLink': 'Inget plant underlag? Vänd telefonen',
    'calibration.step.vehicle.done': 'Nollställd',
    'calibration.step.vehicle.hint':
      'Ställ fordonet plant med ett vattenpass och lägg telefonen på sin vanliga plats.',
    'calibration.step.vehicle.now': 'Nollställ nu',
    'calibration.clear': 'Rensa kalibrering',
    'calibration.err.notRunning':
      'Lutningssensorn är inte igång ännu — tryck på Start på huvudskärmen först.',
    'calibration.err.notFlat':
      'Telefonen verkar inte ligga plant — lägg den på en plan yta och försök igen.',
    'calibration.sensor.h': 'Kalibrera telefonen',
    'calibration.vehicle.h': 'Nollställ fordonet',
    'calibration.vehicle.intro':
      'Kalibreringen gäller telefonen, inte platsen där den ligger. Lutar bordet lite visar appen den lutningen. Ställ fordonet plant en gång med ett vattenpass, lägg telefonen på sin vanliga plats och nollställ.',
    'calibration.vehicle.now': 'Nollställ nu',
    'calibration.vehicle.clear': 'Glöm nolläget',
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
    'targets.normal': 'Normal (i våg)',
    'targets.name.placeholder': 'Namn (t.ex. "Duschavlopp")',
    'targets.defaultName': 'Mål {n}',
    'targets.add': 'Spara aktuell lutning som nytt mål',
    'targets.delete': 'Ta bort {name}',
    'targets.err.tooSteep': 'Det ser ut som mer än ett avsiktligt mål (>15°) — försök igen.',
    'targets.badge': 'Mål: {name}',

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

    'help.screen.h': 'Så läser du skärmen',
    'help.screen.t':
      'Grönt ✓: klart, inget att göra.\n' +
      'Orange ↑: kör upp hjulet på steget som står bredvid.\n' +
      'Rött ✕: klossarna räcker inte här. Flytta fordonet.\n' +
      'Grått –: ingen kloss vid det hjulet. Låt det vara.\n' +
      'När bubblan vilar i mitten står du i våg.',
    'help.what.t':
      'Lägg telefonen plant i fordonet med ovansidan mot fronten, på samma plats varje gång.\n' +
      'Med en sensorbox spelar det ingen roll hur telefonen ligger.',
    'help.settings.h': 'Måtten',
    'help.measures.h': 'Fyll i måtten',
    'help.settings.t':
      'Hjulbas och spårvidd. De står i fordonspapperen, annars mäter du med tumstock.\n' +
      'På en husvagn är hjulbasen avståndet från axeln till stödhjulet.',
    'help.ramps.t':
      'Välj dina klossar eller skriv in stegens höjder. Libell lägger dem där de gör mest nytta.',
    'help.calibration.h': 'Kalibrera och nollställ',
    'help.calibration.t':
      'Kalibrera telefonen en gång: lägg den på en plan yta och tryck Kalibrera nu.\n' +
      'Nollställ sedan när fordonet står i våg, med telefonen på sin vanliga plats.\n' +
      'Med en sensorbox nollställer du på boxens sida. Den behöver ingen kalibrering.\n' +
      'Lampan ⚠ Kalibrera eller ⚠ Nollställ lyser tills det är gjort.',
    'help.sensor.h': 'Sensorbox',
    'help.sensor.t':
      'En box i fordonet kan mäta i stället för telefonen.\n' +
      'Tryck på sensorikonen uppe till höger för att ansluta. Boxens sida visar resten steg för steg.\n' +
      'Xparkle ska stå upprätt.\n' +
      'En box med pilar ska ligga plant med locket upp och en pil framåt.\n' +
      'På iPhone behövs webbläsaren Bluefy.',
    'help.targets.h': 'Mål och ljud',
    'help.targets.t':
      'Spara en lutning du vill ha, till exempel mot duschavloppet, och växla mellan dem.\n' +
      'Knappen mitt i nederkanten slår av och på ljudet.',
    'help.trouble.h': 'Om något krånglar',
    'help.trouble.t':
      '”Mäter…”: fordonet gungar. Vänta tills det står still.\n' +
      '”Lägg telefonen plant för att mäta”: telefonen lutar för mycket för att mäta.\n' +
      '”Tappade kontakten med boxen”: tryck Återanslut och välj boxen i listan.\n' +
      'På iPhone: tryck Start varje gång du öppnar appen.\n' +
      'Fortfarande fel? Skriv en rapport under Feedback.',
    'help.open': 'Öppna {name}',
    'help.open.sensor': 'Öppna sensorn',
    'help.open.feedback': 'Skriv en rapport',

    'main.hint': 'Lägg telefonen plant i fordonet, med ovansidan mot fronten.',
    'main.start': 'Start',
    'main.waiting': 'Väntar på lutningssensorn…',
    'main.level': 'Fordonet står i våg!',
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
    'diagram.noRamp': 'Ingen kloss',
    'diagram.wheel.frontLeft': 'V FRAM',
    'diagram.wheel.frontRight': 'H FRAM',
    'diagram.wheel.rearLeft': 'V BAK',
    'diagram.wheel.rearRight': 'H BAK',
    'caravan.crankUp': 'Veva upp',
    'caravan.crankDown': 'Veva ner',

    'tilt.frontBack': 'Längsled',
    'tilt.sideSide': 'Sidled',

    'pose.layFlat': 'Lägg telefonen plant för att mäta',
    'pose.sensorHint': 'Den mäter bara rätt liggande plant, ovansidan upp.',
    'pose.openSensorPage': 'Visa boxen',
    'pose.sensorExtreme': 'Boxen lutar för mycket',
    'pose.sensorUpsideDown': 'Boxen verkar sitta upp och ner',
    'pose.sensorNotUpright': 'Boxen ligger ner',
    'pose.sensorHintUpright': 'Den mäter bara rätt stående.',
    'calibration.external.h': 'Nollställ fordonet',
    'calibration.external.intro':
      'Ställ fordonet plant en gång med ett vattenpass och nollställ sedan.',
    'calibration.external.working': 'Nollställer…',
    'calibration.external.done': '{name} är nollställd: det här läget räknas nu som plant.',
    'calibration.external.err.notConnected': '{name} är inte ansluten. Anslut den och försök igen.',
    'calibration.external.err.failed':
      'Kunde inte nollställa {name}. Inget ändrades. Kontrollera anslutningen och försök igen.',
    'pose.portrait': 'Vänd telefonen på höjden (porträtt) — ovansidan ska peka framåt',

    'stale.dataUnavailable':
      'Ingen ny sensordata – vägledningen är pausad tills den kommer tillbaka',

    'sensorFallback.lost': 'Tappade kontakten med boxen',
    'sensorFallback.autoRetry': 'Försöker igen automatiskt…',
    'sensorFallback.connect': 'Anslut boxen',
    'sensorFallback.pick': 'Tryck och välj din box i listan.',
    'sensorFallback.notFound': 'Hittade ingen box? Kontrollera att den är påslagen och nära.',
    'sensorFallback.retry': 'Återanslut',
    'sensorFallback.usePhone': 'Använd telefonen i stället',
    'mounting.prompt.upright': 'Tryck där boxens baksida (skruvfästet) pekar.',
    'mounting.prompt.arrow':
      'En av boxens pilar (på locket eller kretskortet under) pekar framåt. Vilken sida är vänd framåt?',
    'mounting.placement.wide': 'Långsidan framåt',
    'mounting.placement.short': 'Kortsidan framåt',
    'mounting.facing.front': 'Pekar mot fronten',
    'mounting.facing.right': 'Pekar åt höger',
    'mounting.facing.rear': 'Pekar bakåt',
    'mounting.facing.left': 'Pekar åt vänster',
    'box.state.connected': 'Ansluten',
    'box.state.lost': 'Tappade kontakten',
    'box.state.notConnected': 'Inte ansluten',
    'box.state.battery': 'batteri {value}',
    'box.connect': 'Anslut',
    'box.step.position.upright.ok': 'Står upprätt',
    'box.step.position.upright.bad': 'Ligger ner – ställ den upprätt, åt vilket håll som helst',
    'box.step.position.flat.ok': 'Ligger plant',
    'box.step.position.flat.bad': 'Lutar för mycket – lägg den plant med ovansidan upp',
    'box.step.position.flat.upsideDown':
      'Upp och ner – vänd den med locket uppåt. Tillverkaren avråder från att montera den upp och ner.',
    'box.step.position.waiting': 'Läge: väntar på mätvärde',
    'box.step.direction.todo': 'Välj riktning',
    'box.step.direction.done': 'Riktning vald',
    'box.step.direction.learn': 'Osäker? Lär in genom att höja fronten',
    'box.step.zero.todo': 'Nollställ fordonet',
    'box.step.zero.done': 'Nollställd',
    'box.step.zero.hint': 'Ställ fordonet plant med ett vattenpass och nollställ sedan.',
    'box.forgetDirection': 'Glöm riktningen',
    'onboard.boxPosition.h': 'Boxens läge',
    'onboard.boxPosition.later':
      'Riktning och nollställning gör du första gången du parkerar. Boxens sida guidar dig, och lampan ⚠ Nollställ påminner tills det är gjort.',
    'sensorList.title': 'Sensorbox',
    'sensorList.phone': 'Telefonens egen sensor används när ingen box är ansluten.',
    'box.step.zero.again': 'Nollställ igen',
  },
  fr: {
    'topbar.install': 'Installer',
    'topbar.share': 'Partager Libell',
    'bottombar.settings': 'Réglages',
    'bottombar.sound.mute': 'Couper le son',
    'bottombar.sound.unmute': 'Activer le son',
    'bottombar.help': 'Aide',
    'share.text': 'Mettez votre camping-car ou votre caravane de niveau avec votre téléphone.',
    'share.copied': 'Lien copié !',
    'update.check': 'Rechercher une nouvelle version',
    'update.checking': 'Recherche de mises à jour…',
    'update.updating': 'Mise à jour vers la nouvelle version…',
    'update.latest': 'Vous avez la dernière version',
    'update.offline': 'Pas de connexion, impossible de rechercher des mises à jour',
    'update.unsupported': 'Les mises à jour ne sont pas disponibles ici',
    'install.hint': 'Touchez Partager, puis « Sur l’écran d’accueil ».',
    'share.vehicle.text': 'La configuration de mon véhicule pour Libell — mesures et rampes.',
    'settings.shareVehicle': 'Partager vers un autre téléphone',
    'setup.incoming.h': 'Configuration de véhicule reçue',
    'setup.incoming.intro': 'Un proche a partagé ces mesures de véhicule avec vous :',
    'setup.incoming.reminder':
      'Cela ne comprend aucun étalonnage — vous devrez tout de même étalonner sur ce téléphone.',
    'setup.incoming.apply': 'Utiliser ces valeurs',
    'setup.incoming.dismiss': 'Pas maintenant',
    'setup.incoming.invalid': 'Ce lien de configuration n’a pas pu être lu — rien n’a été modifié.',

    'lamp.setup': '⚠ Mesures',
    'lamp.setup.title':
      'Les mesures du véhicule n’ont jamais été enregistrées — touchez pour ouvrir les Réglages',
    'lamp.calibrate': '⚠ Étalonner',
    'lamp.zero': '⚠ Mettre à zéro',
    'lamp.calibrate.title': 'Le téléphone n’est pas étalonné — touchez pour ouvrir l’Étalonnage',
    'lamp.zero.title': 'Le véhicule n’est pas mis à zéro — touchez pour ouvrir l’Étalonnage',
    'lamp.calibrate.title.sensor':
      'Le boîtier n’est pas mis à zéro — touchez pour ouvrir le boîtier',

    'sensorStatus.connected': 'Boîtier capteur connecté',
    'sensorStatus.disconnected': 'Boîtier capteur — contact perdu, touchez pour les détails',
    'sensorStatus.idle': 'Boîtier capteur — touchez pour connecter',
    'sensorStatus.idle.guide': 'Boîtier capteur — touchez pour le guide iPhone',

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
    'menu.sensorSource': 'Boîtier capteur',
    'menu.advanced': 'AVANCÉ',
    'menu.others': 'AUTRES',
    'menu.card.notDone': 'Non fait',

    'sensorSource.connect': 'Connecter le capteur {name}',
    'sensorSource.disconnect': 'Déconnecter',
    'sensorSource.status.connecting': 'Connexion…',
    'sensorSource.err.unsupported': 'Web Bluetooth n’est pas pris en charge par ce navigateur.',
    'sensorSource.err.password':
      'Le boîtier {name} n’a pas accepté son mot de passe. Rétablissez-le dans l’application du fabricant, ou réinitialisez le boîtier.',
    'sensorSource.err.failed': 'Impossible de se connecter au capteur {name}.',

    'sensorSource.ios.intro':
      'Safari ne peut pas se connecter directement aux capteurs Bluetooth, mais il existe une solution :',
    'sensorSource.ios.step1': 'Installez « Bluefy – Web Bluetooth Browser » depuis l’App Store.',
    'sensorSource.ios.step2': 'Ouvrez Bluefy et autorisez l’accès au Bluetooth.',
    'sensorSource.ios.step3': 'Dans Bluefy, ouvrez cette même adresse Libell.',
    'sensorSource.ios.step4': 'Rouvrez Boîtier capteur ici — cela fonctionne comme sur Android.',
    'sensorSource.ios.note':
      'Bluefy est une application tierce, pas développée par Libell — la reconnexion à ' +
      'l’ouverture peut y demander une touche manuelle au lieu de se faire toute seule.',
    'sensorSource.ios.bluefyLink': 'Trouver Bluefy dans l’App Store',

    'sensorSource.detail.temperature': 'Température : {value}',
    'sensorSource.detail.notAvailable': 'Pas encore disponible',
    'sensorSource.lowBattery':
      '⚠ Batterie faible ({value}) — pensez à remplacer bientôt la pile du boîtier.',

    'sensorSource.install.now': 'Mettre à zéro',
    'sensorSource.install.clear': 'Oublier le zéro',
    'sensorSource.install.status': 'Zéro : latéral {roll}°, longitudinal {pitch}°.',
    'sensorSource.install.status.none':
      'Pas encore mis à zéro — le boîtier mesure tel qu’il est posé.',

    'sensorSource.learn.h': 'Apprendre le montage',
    'sensorSource.learn.intro':
      'Libell apprend l’orientation à partir de deux levées : d’abord l’avant, puis le côté droit.',
    'sensorSource.learn.start': 'Apprendre le montage',
    'sensorSource.learn.step.front':
      'Soulevez l’avant du véhicule de quelques centimètres, puis appuyez sur le bouton.',
    'sensorSource.learn.capture.front': 'L’avant est soulevé',
    'sensorSource.learn.step.right':
      'Redescendez l’avant. Soulevez maintenant le côté droit de quelques centimètres, puis appuyez sur le bouton.',
    'sensorSource.learn.capture.right': 'Le côté droit est soulevé',
    'sensorSource.learn.cancel': 'Annuler',
    'sensorSource.learn.status.learned': 'Montage appris.',
    'sensorSource.learn.status.none':
      'Aucun montage appris — les directions du boîtier sont utilisées.',
    'sensorSource.learn.done':
      'Terminé ! Vérifiez : soulevez l’avant et Libell doit indiquer les roues arrière.',
    'sensorSource.learn.err.tooSmall':
      'Le véhicule a à peine bougé. Soulevez un peu plus et réessayez.',
    'sensorSource.learn.err.ambiguous':
      'Les deux directions ont bougé à peu près autant. Soulevez seulement l’avant, puis seulement le côté droit, et réessayez.',
    'sensorSource.learn.err.arrow':
      'Aucune flèche ne pointe vers l’avant. Tournez le boîtier pour qu’une de ses flèches pointe vers l’avant, puis réessayez.',
    'sensorSource.learn.err.mirrored':
      'Le boîtier semble à l’envers, ou le mauvais côté a été soulevé. Vérifiez, puis réessayez.',
    'sensorSource.learn.err.sameAxis':
      'Les deux levages ont incliné dans le même sens. Soulevez d’abord l’avant, puis le côté droit, et réessayez.',

    'sensorStatus.title': 'Capteur {name}',
    'sensorStatus.reading': 'Inclinaison actuelle : {value}',
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
    'sensorStatus.advanced': 'Avancé',
    'sensorStatus.silentReconnect.intro':
      'Ce navigateur ne sait pas encore se reconnecter seul au boîtier : après un redémarrage, vous le choisissez à nouveau dans la liste. Dans Chrome, vous pouvez l’activer vous-même.',
    'sensorStatus.silentReconnect.steps':
      'Ouvrez {address}, cherchez « web bluetooth », réglez « Use the new permissions backend for Web Bluetooth » sur Enabled et touchez Relaunch. Connectez ensuite le boîtier une fois.',
    'sensorStatus.silentReconnect.copy': 'Copier {address}',
    'sensorStatus.silentReconnect.copied': 'Copié — collez-le dans la barre d’adresse de Chrome.',
    'sensorStatus.debug.connectDelay.intro':
      'Expérimental : à essayer seulement si la connexion de votre boîtier est instable. ' +
      'Ajoute une pause fixe après la connexion, avant que l’application ne commence à lire.',
    'sensorStatus.debug.connectDelay.enable': 'Activer le délai de connexion',
    'sensorStatus.debug.connectDelay.ms': 'Délai (ms)',

    'about.text':
      'Libell vous aide à mettre de niveau votre camping-car ou votre caravane avec le ' +
      'téléphone que vous avez déjà, sans deviner.',
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
    'onboard.source.externalActive':
      'Un boîtier capteur est actif. Si vous choisissez ce téléphone, le guide saute l’étalonnage du téléphone — pour étalonner le téléphone, touchez d’abord « Déconnecter » sur la page Boîtier capteur.',
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
    'onboard.legend.dim': 'Gris – — pas de rampe à cette roue ; laissez-la telle quelle.',
    'settings.wheelbase': 'Empattement',
    'settings.trackFront': 'Voie avant',
    'settings.trackRear': 'Voie arrière',
    'settings.tolerance': 'Tolérance',
    'settings.stability': 'Stabilité',
    'settings.dwellRest': 'Délai de réponse (ms)',
    'settings.dwellMotion': 'Délai de réponse pendant le réglage (ms)',
    'settings.dwell.hint': 'Combien de temps une mesure doit tenir avant que le nombre change.',
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
      'Elles figurent sur la carte grise. Quelques cm d’écart ne changent rien.',
    'settings.measureHint.caravan':
      'Mesurez de l’essieu à la roue jockey. Quelques cm d’écart ne changent rien.',
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
    'settings.drainHint': 'Dans la tolérance, ce côté reste le plus bas pour que l’eau s’écoule.',
    'settings.section.vehicle': 'Véhicule et mesures',
    'settings.section.ramps': 'Rampes',
    'settings.general': 'Général',
    'settings.language': 'Langue',
    'settings.language.auto': 'Automatique (langue de l’appareil)',
    'settings.tolerance.hint':
      'À quel point il faut être proche du niveau pour compter comme de niveau.',
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
    'settings.sound': 'Carillon quand c’est de niveau',
    'settings.soundGuidance': 'Guidage sonore continu',
    'settings.soundGuidance.help':
      'Le bip s’accélère et monte à mesure que vous approchez du niveau.',
    'settings.undo': 'Annuler',
    'settings.saved': 'Enregistré',
    'settings.more': 'Plus',
    'settings.fineTuning': 'Réglage fin',
    'settings.resetAll': 'Réinitialiser tous les réglages',
    'settings.err.positive':
      'Saisissez un nombre supérieur à 0. La valeur précédente reste en vigueur.',
    'settings.err.notNegative': 'Saisissez 0 ou plus. La valeur précédente reste en vigueur.',

    'settings.tab.vehicle': 'Véhicule',
    'settings.tab.ramps': 'Rampes',
    'settings.tab.level': 'Niveau',
    'settings.klossar.brandAll': 'Toutes',
    'settings.klossar.changeRamp': 'Changer de rampe',
    'settings.rampCountHint': 'L’application les place au mieux.',
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
    'calibration.step.phone.done': 'Téléphone étalonné',
    'calibration.step.phone.hint': 'Posez le téléphone sur une surface plane.',
    'calibration.step.flipLink': 'Pas de surface plane ? Retournez le téléphone',
    'calibration.step.vehicle.done': 'Mis à zéro',
    'calibration.step.vehicle.hint':
      'Mettez le véhicule de niveau avec un niveau à bulle et posez le téléphone à sa place habituelle.',
    'calibration.step.vehicle.now': 'Mettre à zéro',
    'calibration.clear': 'Effacer l’étalonnage',
    'calibration.err.notRunning':
      'Le capteur d’inclinaison n’est pas encore actif — touchez d’abord Démarrer sur ' +
      'l’écran principal.',
    'calibration.err.notFlat':
      'Le téléphone ne semble pas à plat — posez-le sur une surface de niveau et réessayez.',
    'calibration.sensor.h': 'Étalonner le téléphone',
    'calibration.vehicle.h': 'Mettre le véhicule à zéro',
    'calibration.vehicle.intro':
      'L’étalonnage concerne le téléphone, pas l’endroit où il repose. Si la table penche un peu, l’application affiche cette inclinaison. Mettez le véhicule de niveau une fois avec un niveau à bulle, posez le téléphone à sa place habituelle et mettez à zéro.',
    'calibration.vehicle.now': 'Mettre à zéro',
    'calibration.vehicle.clear': 'Oublier le zéro',
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

    'targets.normal': 'Normal (de niveau)',
    'targets.name.placeholder': 'Nom (par ex. « Évacuation douche »)',
    'targets.defaultName': 'Cible {n}',
    'targets.add': 'Enregistrer l’inclinaison actuelle comme nouvelle cible',
    'targets.delete': 'Supprimer {name}',
    'targets.err.tooSteep': 'Cela ressemble à plus qu’une cible volontaire (>15°) — réessayez.',
    'targets.badge': 'Cible : {name}',

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

    'help.screen.h': 'Lire l’écran',
    'help.screen.t':
      'Vert ✓ : c’est fait, rien à faire.\n' +
      'Orange ↑ : montez cette roue sur le palier indiqué à côté.\n' +
      'Rouge ✕ : vos rampes ne suffisent pas ici. Déplacez le véhicule.\n' +
      'Gris – : pas de rampe à cette roue. Laissez-la telle quelle.\n' +
      'Quand la bulle repose au milieu, vous êtes de niveau.',
    'help.what.t':
      'Posez le téléphone à plat dans le véhicule, le haut vers l’avant, toujours au même endroit.\n' +
      'Avec un boîtier capteur, la position du téléphone n’a pas d’importance.',
    'help.settings.h': 'Les mesures',
    'help.measures.h': 'Saisir les mesures',
    'help.settings.t':
      'Empattement et voie. Ils figurent sur les papiers du véhicule, sinon prenez un mètre ruban.\n' +
      'Sur une caravane, l’empattement est la distance entre l’essieu et la roue jockey.',
    'help.ramps.t':
      'Choisissez vos rampes ou saisissez les hauteurs des paliers. Libell les place là où elles servent le plus.',
    'help.calibration.h': 'Étalonner et mettre à zéro',
    'help.calibration.t':
      'Étalonnez le téléphone une fois : posez-le sur une surface plane et touchez Étalonner maintenant.\n' +
      'Mettez ensuite à zéro quand le véhicule est de niveau, le téléphone à sa place habituelle.\n' +
      'Avec un boîtier capteur, la mise à zéro se fait sur la page du boîtier. Il n’a pas besoin d’étalonnage.\n' +
      'Le voyant ⚠ Étalonner ou ⚠ Mettre à zéro reste allumé tant que ce n’est pas fait.',
    'help.sensor.h': 'Boîtier capteur',
    'help.sensor.t':
      'Un boîtier dans le véhicule peut mesurer à la place du téléphone.\n' +
      'Touchez l’icône du capteur en haut à droite pour le connecter. La page du boîtier montre la suite étape par étape.\n' +
      'Le Xparkle doit être posé debout.\n' +
      'Un boîtier à flèches se pose à plat, couvercle en haut, une flèche vers l’avant.\n' +
      'Sur iPhone, il faut le navigateur Bluefy.',
    'help.targets.h': 'Cibles et son',
    'help.targets.t':
      'Enregistrez une inclinaison voulue, par exemple vers l’évacuation de la douche, et passez de l’une à l’autre.\n' +
      'Le bouton au milieu de la barre du bas active et coupe le son.',
    'help.trouble.h': 'En cas de souci',
    'help.trouble.t':
      '« Mesure… » : le véhicule bouge. Attendez qu’il soit immobile.\n' +
      '« Posez le téléphone à plat pour mesurer » : le téléphone est trop incliné pour mesurer.\n' +
      '« Contact perdu avec le boîtier » : touchez Reconnecter et choisissez le boîtier dans la liste.\n' +
      'Sur iPhone : touchez Démarrer à chaque ouverture de l’application.\n' +
      'Toujours un souci ? Écrivez un rapport sous Commentaires.',
    'help.open': 'Ouvrir {name}',
    'help.open.sensor': 'Ouvrir le capteur',
    'help.open.feedback': 'Écrire un rapport',

    'main.hint': 'Posez votre téléphone à plat dans le véhicule, le bord supérieur vers l’avant.',
    'main.start': 'Démarrer',
    'main.waiting': 'En attente du capteur d’inclinaison…',
    'main.level': 'Votre véhicule est de niveau !',
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
    'pose.sensorHint': 'Il ne mesure correctement qu’à plat, face vers le haut.',
    'pose.openSensorPage': 'Voir le boîtier',
    'pose.sensorExtreme': 'Le boîtier est trop incliné',
    'pose.sensorUpsideDown': 'Le boîtier semble à l’envers',
    'pose.sensorNotUpright': 'Le boîtier est couché',
    'pose.sensorHintUpright': 'Il ne mesure correctement que debout.',
    'calibration.external.h': 'Mettre le véhicule à zéro',
    'calibration.external.intro':
      'Mettez le véhicule de niveau une fois avec un niveau à bulle, puis mettez à zéro.',
    'calibration.external.working': 'Mise à zéro…',
    'calibration.external.done':
      '{name} est mis à zéro : cette position compte désormais comme le niveau.',
    'calibration.external.err.notConnected':
      '{name} n’est pas connecté. Connectez-le et réessayez.',
    'calibration.external.err.failed':
      'Impossible de mettre {name} à zéro. Rien n’a été modifié. Vérifiez la connexion et réessayez.',
    'pose.portrait':
      'Tournez le téléphone à la verticale (portrait) — le bord supérieur doit pointer vers l’avant',

    'stale.dataUnavailable':
      'Aucune nouvelle donnée du capteur — le guidage est en pause jusqu’à son retour',

    'sensorFallback.lost': 'Contact perdu avec le boîtier',
    'sensorFallback.autoRetry': 'Nouvelle tentative automatique…',
    'sensorFallback.connect': 'Connectez le boîtier',
    'sensorFallback.pick': 'Touchez puis choisissez votre boîtier dans la liste.',
    'sensorFallback.notFound': 'Aucun boîtier trouvé ? Vérifiez qu’il est allumé et à proximité.',
    'sensorFallback.retry': 'Reconnecter',
    'sensorFallback.usePhone': 'Utiliser plutôt le téléphone',
    'mounting.prompt.upright':
      'Touchez le côté vers lequel pointe l’arrière du boîtier (la fixation à vis).',
    'mounting.prompt.arrow':
      'Une des flèches du boîtier (sur le couvercle ou le circuit dessous) pointe vers l’avant. Quel côté est tourné vers l’avant ?',
    'mounting.placement.wide': 'Côté large vers l’avant',
    'mounting.placement.short': 'Côté étroit vers l’avant',
    'mounting.facing.front': 'Vers l’avant',
    'mounting.facing.right': 'Vers la droite',
    'mounting.facing.rear': 'Vers l’arrière',
    'mounting.facing.left': 'Vers la gauche',
    'box.state.connected': 'Connecté',
    'box.state.lost': 'Contact perdu',
    'box.state.notConnected': 'Non connecté',
    'box.state.battery': 'batterie {value}',
    'box.connect': 'Connecter',
    'box.step.position.upright.ok': 'Debout',
    'box.step.position.upright.bad': 'Couché : mettez-le debout, dans n’importe quel sens',
    'box.step.position.flat.ok': 'À plat',
    'box.step.position.flat.bad': 'Trop incliné : posez-le à plat, face vers le haut',
    'box.step.position.flat.upsideDown':
      'À l’envers : retournez-le couvercle vers le haut. Le fabricant déconseille de le monter à l’envers.',
    'box.step.position.waiting': 'Position : en attente d’une mesure',
    'box.step.direction.todo': 'Choisir l’orientation',
    'box.step.direction.done': 'Orientation choisie',
    'box.step.direction.learn': 'Pas sûr ? Apprenez-la en levant l’avant',
    'box.step.zero.todo': 'Mettre le véhicule à zéro',
    'box.step.zero.done': 'Mis à zéro',
    'box.step.zero.hint':
      'Mettez le véhicule de niveau avec un niveau à bulle, puis mettez à zéro.',
    'box.forgetDirection': 'Oublier l’orientation',
    'onboard.boxPosition.h': 'Position du boîtier',
    'onboard.boxPosition.later':
      'La direction et le zéro se règlent la première fois que vous vous garez. La page du boîtier vous guide, et le voyant ⚠ Mettre à zéro vous le rappelle jusque-là.',
    'sensorList.title': 'Boîtier capteur',
    'sensorList.phone': 'Le capteur du téléphone est utilisé quand aucun boîtier n’est connecté.',
    'box.step.zero.again': 'Remettre à zéro',
  },
  es: {
    'topbar.install': 'Instalar',
    'topbar.share': 'Compartir Libell',
    'bottombar.settings': 'Ajustes',
    'bottombar.sound.mute': 'Silenciar el sonido',
    'bottombar.sound.unmute': 'Activar el sonido',
    'bottombar.help': 'Ayuda',
    'share.text': 'Nivela tu autocaravana o caravana con el móvil.',
    'share.copied': '¡Enlace copiado!',
    'update.check': 'Buscar una versión nueva',
    'update.checking': 'Buscando actualizaciones…',
    'update.updating': 'Actualizando a la nueva versión…',
    'update.latest': 'Tienes la última versión',
    'update.offline': 'Sin conexión, no se pueden buscar actualizaciones',
    'update.unsupported': 'Las actualizaciones no están disponibles aquí',
    'install.hint': 'Toca Compartir y luego «Añadir a pantalla de inicio».',
    'share.vehicle.text': 'La configuración de mi vehículo para Libell: medidas y rampas.',
    'settings.shareVehicle': 'Compartir con otro teléfono',
    'setup.incoming.h': 'Configuración de vehículo recibida',
    'setup.incoming.intro':
      'Alguien de tu familia ha compartido contigo estas medidas del vehículo:',
    'setup.incoming.reminder':
      'Esto no incluye ninguna calibración: tendrás que calibrar igualmente en este móvil.',
    'setup.incoming.apply': 'Usar estos valores',
    'setup.incoming.dismiss': 'Ahora no',
    'setup.incoming.invalid':
      'No se ha podido leer ese enlace de configuración: no se ha cambiado nada.',

    'lamp.setup': '⚠ Medidas',
    'lamp.setup.title': 'Las medidas del vehículo nunca se han guardado: toca para abrir Ajustes',
    'lamp.calibrate': '⚠ Calibrar',
    'lamp.zero': '⚠ Poner a cero',
    'lamp.calibrate.title': 'El móvil no está calibrado: toca para abrir Calibración',
    'lamp.zero.title': 'El vehículo no está puesto a cero: toca para abrir Calibración',
    'lamp.calibrate.title.sensor': 'La caja no está puesta a cero: toca para abrir la caja',

    'sensorStatus.connected': 'Caja sensora conectada',
    'sensorStatus.disconnected': 'Caja sensora: se perdió el contacto, toca para ver los detalles',
    'sensorStatus.idle': 'Caja sensora: toca para conectar',
    'sensorStatus.idle.guide': 'Caja sensora: toca para ver la guía de iPhone',

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
    'menu.sensorSource': 'Caja sensora',
    'menu.advanced': 'AVANZADO',
    'menu.others': 'OTROS',
    'menu.card.notDone': 'Sin hacer',

    'sensorSource.connect': 'Conectar el sensor {name}',
    'sensorSource.disconnect': 'Desconectar',
    'sensorSource.status.connecting': 'Conectando…',
    'sensorSource.err.unsupported': 'Este navegador no admite Web Bluetooth.',
    'sensorSource.err.password':
      'La caja {name} no ha aceptado su contraseña. Restablécela en la aplicación del fabricante o reinicia la caja.',
    'sensorSource.err.failed': 'No se ha podido conectar con el sensor {name}.',

    'sensorSource.ios.intro':
      'Safari no puede conectarse directamente a sensores Bluetooth, pero hay una solución:',
    'sensorSource.ios.step1': 'Instala «Bluefy – Web Bluetooth Browser» desde la App Store.',
    'sensorSource.ios.step2': 'Abre Bluefy y concede el permiso de Bluetooth.',
    'sensorSource.ios.step3': 'En Bluefy, ve a esta misma dirección de Libell.',
    'sensorSource.ios.step4': 'Vuelve a abrir Caja sensora aquí: funciona igual que en Android.',
    'sensorSource.ios.note':
      'Bluefy es una aplicación de terceros, no creada por Libell: puede que reconectar al ' +
      'abrir la app requiera un toque manual allí en lugar de hacerse solo.',
    'sensorSource.ios.bluefyLink': 'Buscar Bluefy en la App Store',

    'sensorSource.detail.temperature': 'Temperatura: {value}',
    'sensorSource.detail.notAvailable': 'Aún no disponible',
    'sensorSource.lowBattery':
      '⚠ Batería baja ({value}): conviene cambiar pronto la pila de la caja del sensor.',

    'sensorSource.install.now': 'Poner a cero',
    'sensorSource.install.clear': 'Olvidar el cero',
    'sensorSource.install.status': 'Cero: lado/lado {roll}°, delante/detrás {pitch}°.',
    'sensorSource.install.status.none': 'Aún sin poner a cero: la caja mide tal como está montada.',

    'sensorSource.learn.h': 'Aprender el montaje',
    'sensorSource.learn.intro':
      'Libell aprende la orientación con dos elevaciones: primero la parte delantera y luego el lado derecho.',
    'sensorSource.learn.start': 'Aprender el montaje',
    'sensorSource.learn.step.front':
      'Levanta la parte delantera del vehículo unos centímetros y pulsa el botón.',
    'sensorSource.learn.capture.front': 'La parte delantera está levantada',
    'sensorSource.learn.step.right':
      'Baja otra vez la parte delantera. Ahora levanta el lado derecho unos centímetros y pulsa el botón.',
    'sensorSource.learn.capture.right': 'El lado derecho está levantado',
    'sensorSource.learn.cancel': 'Cancelar',
    'sensorSource.learn.status.learned': 'Montaje aprendido.',
    'sensorSource.learn.status.none':
      'Ningún montaje aprendido: se usan las direcciones propias de la caja.',
    'sensorSource.learn.done':
      '¡Listo! Compruébalo: levanta la parte delantera y Libell debería señalar las ruedas traseras.',
    'sensorSource.learn.err.tooSmall':
      'El vehículo apenas se movió. Levántalo un poco más e inténtalo de nuevo.',
    'sensorSource.learn.err.ambiguous':
      'Las dos direcciones se movieron casi lo mismo. Levanta solo la parte delantera, luego solo el lado derecho, e inténtalo de nuevo.',
    'sensorSource.learn.err.arrow':
      'Ninguna flecha apunta hacia delante. Gira la caja para que una de sus flechas apunte hacia delante e inténtalo de nuevo.',
    'sensorSource.learn.err.mirrored':
      'La caja parece estar al revés, o se levantó el lado equivocado. Compruébalo e inténtalo de nuevo.',
    'sensorSource.learn.err.sameAxis':
      'Los dos levantamientos inclinaron hacia el mismo lado. Levanta primero la parte delantera y luego el lado derecho, e inténtalo de nuevo.',

    'sensorStatus.title': 'Sensor {name}',
    'sensorStatus.reading': 'Inclinación ahora: {value}',
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
    'sensorStatus.advanced': 'Avanzado',
    'sensorStatus.silentReconnect.intro':
      'Este navegador aún no puede volver a conectarse a la caja por sí solo, así que tras un reinicio la eliges de nuevo en la lista. En Chrome puedes activarlo tú mismo.',
    'sensorStatus.silentReconnect.steps':
      'Abre {address}, busca «web bluetooth», pon «Use the new permissions backend for Web Bluetooth» en Enabled y toca Relaunch. Después conecta la caja una vez.',
    'sensorStatus.silentReconnect.copy': 'Copiar {address}',
    'sensorStatus.silentReconnect.copied': 'Copiado: pégalo en la barra de direcciones de Chrome.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimental: pruébalo solo si la conexión de tu caja es inestable. Añade una pausa ' +
      'fija después de conectar, antes de que la app empiece a leer.',
    'sensorStatus.debug.connectDelay.enable': 'Activar la pausa de conexión',
    'sensorStatus.debug.connectDelay.ms': 'Pausa (ms)',

    'about.text':
      'Libell te ayuda a nivelar tu autocaravana o caravana con el móvil que ya tienes, ' +
      'sin adivinar.',
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
    'onboard.source.externalActive':
      'Hay una caja sensora activa. Si eliges este móvil, la guía omite la calibración del móvil; para calibrarlo, toca primero «Desconectar» en la página Caja sensora.',
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
    'onboard.legend.dim': 'Gris –: ninguna rampa en esa rueda; déjala como está.',
    'settings.wheelbase': 'Distancia entre ejes',
    'settings.trackFront': 'Ancho de vía delantero',
    'settings.trackRear': 'Ancho de vía trasero',
    'settings.tolerance': 'Tolerancia',
    'settings.stability': 'Estabilidad',
    'settings.dwellRest': 'Retardo de respuesta (ms)',
    'settings.dwellMotion': 'Retardo de respuesta al ajustar (ms)',
    'settings.dwell.hint': 'Cuánto debe mantenerse una lectura antes de que cambie el número.',
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
      'Figuran en la documentación del vehículo. Unos cm de error no importan.',
    'settings.measureHint.caravan':
      'Mide desde el eje hasta la rueda jockey. Unos cm de error no importan.',
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
      'Dentro de la tolerancia, este lado queda más bajo para que el agua desagüe.',
    'settings.section.vehicle': 'Vehículo y medidas',
    'settings.section.ramps': 'Rampas',
    'settings.general': 'General',
    'settings.language': 'Idioma',
    'settings.language.auto': 'Automático (idioma del dispositivo)',
    'settings.tolerance.hint': 'Cuánto hay que acercarse al nivel para contar como nivelado.',
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
    'settings.sound': 'Sonido al quedar nivelado',
    'settings.soundGuidance': 'Guía sonora continua',
    'settings.soundGuidance.help': 'El pitido se acelera y sube a medida que te acercas al nivel.',
    'settings.undo': 'Deshacer',
    'settings.saved': 'Guardado',
    'settings.more': 'Más',
    'settings.fineTuning': 'Ajuste fino',
    'settings.resetAll': 'Restablecer todos los ajustes',
    'settings.err.positive': 'Introduce un número mayor que 0. Sigue valiendo el valor anterior.',
    'settings.err.notNegative': 'Introduce 0 o más. Sigue valiendo el valor anterior.',

    'settings.tab.vehicle': 'Vehículo',
    'settings.tab.ramps': 'Rampas',
    'settings.tab.level': 'Nivelación',
    'settings.klossar.brandAll': 'Todas',
    'settings.klossar.changeRamp': 'Cambiar rampa',
    'settings.rampCountHint': 'La app las coloca donde más ayudan.',
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
    'calibration.step.phone.done': 'Teléfono calibrado',
    'calibration.step.phone.hint': 'Deja el teléfono sobre algo plano.',
    'calibration.step.flipLink': '¿Nada plano? Gira el teléfono',
    'calibration.step.vehicle.done': 'Puesto a cero',
    'calibration.step.vehicle.hint':
      'Nivela el vehículo con un nivel de burbuja y pon el teléfono en su sitio habitual.',
    'calibration.step.vehicle.now': 'Poner a cero',
    'calibration.clear': 'Borrar la calibración',
    'calibration.err.notRunning':
      'El sensor de inclinación aún no está en marcha: toca primero Iniciar en la pantalla principal.',
    'calibration.err.notFlat':
      'El móvil no parece estar plano: ponlo sobre una superficie nivelada e inténtalo de nuevo.',
    'calibration.sensor.h': 'Calibrar el móvil',
    'calibration.vehicle.h': 'Poner el vehículo a cero',
    'calibration.vehicle.intro':
      'La calibración es del móvil, no del sitio donde está apoyado. Si la mesa se inclina un poco, la app muestra esa inclinación. Nivela el vehículo una vez con un nivel de burbuja, pon el móvil en su sitio habitual y ponlo a cero.',
    'calibration.vehicle.now': 'Poner a cero',
    'calibration.vehicle.clear': 'Olvidar el cero',
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

    'targets.normal': 'Normal (nivelado)',
    'targets.name.placeholder': 'Nombre (p. ej. «Desagüe de la ducha»)',
    'targets.defaultName': 'Objetivo {n}',
    'targets.add': 'Guardar la inclinación actual como nuevo objetivo',
    'targets.delete': 'Eliminar {name}',
    'targets.err.tooSteep':
      'Esto parece más que un objetivo intencionado (>15°): inténtalo de nuevo.',
    'targets.badge': 'Objetivo: {name}',

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

    'help.screen.h': 'Cómo leer la pantalla',
    'help.screen.t':
      'Verde ✓: hecho, nada que hacer.\n' +
      'Naranja ↑: sube esa rueda al escalón indicado al lado.\n' +
      'Rojo ✕: tus rampas no bastan aquí. Mueve el vehículo.\n' +
      'Gris –: ninguna rampa en esa rueda. Déjala como está.\n' +
      'Cuando la burbuja reposa en el centro, estás nivelado.',
    'help.what.t':
      'Coloca el móvil plano en el vehículo, con la parte de arriba hacia delante, siempre en el mismo sitio.\n' +
      'Con una caja sensora da igual cómo esté el móvil.',
    'help.settings.h': 'Las medidas',
    'help.measures.h': 'Introduce las medidas',
    'help.settings.t':
      'Distancia entre ejes y ancho de vía. Vienen en la documentación del vehículo; si no, mide con una cinta métrica.\n' +
      'En una caravana, la distancia entre ejes va del eje a la rueda jockey.',
    'help.ramps.t':
      'Elige tus rampas o escribe la altura de los escalones. Libell las coloca donde más ayudan.',
    'help.calibration.h': 'Calibrar y poner a cero',
    'help.calibration.t':
      'Calibra el móvil una vez: colócalo sobre una superficie plana y toca Calibrar ahora.\n' +
      'Después pon a cero cuando el vehículo esté nivelado, con el móvil en su sitio habitual.\n' +
      'Con una caja sensora, la puesta a cero se hace en la página de la caja. No necesita calibración.\n' +
      'La luz ⚠ Calibrar o ⚠ Poner a cero sigue encendida hasta que esté hecho.',
    'help.sensor.h': 'Caja sensora',
    'help.sensor.t':
      'Una caja en el vehículo puede medir en lugar del móvil.\n' +
      'Toca el icono del sensor arriba a la derecha para conectarla. La página de la caja muestra el resto paso a paso.\n' +
      'El Xparkle debe ir de pie.\n' +
      'Una caja con flechas va plana, tapa arriba, con una flecha hacia delante.\n' +
      'En iPhone necesitas el navegador Bluefy.',
    'help.targets.h': 'Objetivos y sonido',
    'help.targets.t':
      'Guarda una inclinación que quieras, por ejemplo hacia el desagüe de la ducha, y cambia entre ellas.\n' +
      'El botón en el centro de la barra inferior activa y quita el sonido.',
    'help.trouble.h': 'Si algo falla',
    'help.trouble.t':
      '«Midiendo…»: el vehículo se mueve. Espera a que esté quieto.\n' +
      '«Deja el móvil plano para medir»: el móvil está demasiado inclinado para medir.\n' +
      '«Se perdió el contacto con la caja»: toca Reconectar y elige la caja en la lista.\n' +
      'En iPhone: toca Iniciar cada vez que abras la app.\n' +
      '¿Sigue fallando? Escribe un informe en Comentarios.',
    'help.open': 'Abrir {name}',
    'help.open.sensor': 'Abrir el sensor',
    'help.open.feedback': 'Escribir un informe',

    'main.hint': 'Deja el móvil plano dentro del vehículo, con el borde superior hacia delante.',
    'main.start': 'Iniciar',
    'main.waiting': 'Esperando al sensor de inclinación…',
    'main.level': '¡Tu vehículo está nivelado!',
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
    'pose.sensorHint': 'Solo mide bien en plano, con la cara hacia arriba.',
    'pose.openSensorPage': 'Ver la caja',
    'pose.sensorExtreme': 'La caja está demasiado inclinada',
    'pose.sensorUpsideDown': 'La caja parece estar del revés',
    'pose.sensorNotUpright': 'La caja está tumbada',
    'pose.sensorHintUpright': 'Solo mide bien de pie.',
    'calibration.external.h': 'Poner el vehículo a cero',
    'calibration.external.intro':
      'Nivela el vehículo una vez con un nivel de burbuja y luego pon a cero.',
    'calibration.external.working': 'Poniendo a cero…',
    'calibration.external.done':
      '{name} está puesto a cero: esta posición cuenta ahora como nivelada.',
    'calibration.external.err.notConnected':
      '{name} no está conectado. Conéctalo e inténtalo de nuevo.',
    'calibration.external.err.failed':
      'No se pudo poner {name} a cero. No se ha cambiado nada. Comprueba la conexión e inténtalo de nuevo.',
    'pose.portrait':
      'Pon el móvil en vertical (retrato): el borde superior debe apuntar hacia delante',

    'stale.dataUnavailable':
      'No llegan datos nuevos del sensor: la guía está en pausa hasta que vuelvan',

    'sensorFallback.lost': 'Se perdió el contacto con la caja',
    'sensorFallback.autoRetry': 'Reintentando automáticamente…',
    'sensorFallback.connect': 'Conecta la caja',
    'sensorFallback.pick': 'Toca y elige tu caja en la lista.',
    'sensorFallback.notFound': '¿No aparece ninguna caja? Comprueba que esté encendida y cerca.',
    'sensorFallback.retry': 'Reconectar',
    'sensorFallback.usePhone': 'Usar el móvil en su lugar',
    'mounting.prompt.upright':
      'Toca el lado hacia el que apunta la parte trasera de la caja (el soporte de tornillo).',
    'mounting.prompt.arrow':
      'Una de las flechas de la caja (en la tapa o en la placa de debajo) apunta hacia delante. ¿Qué lado mira hacia delante?',
    'mounting.placement.wide': 'Lado largo hacia delante',
    'mounting.placement.short': 'Lado corto hacia delante',
    'mounting.facing.front': 'Hacia delante',
    'mounting.facing.right': 'Hacia la derecha',
    'mounting.facing.rear': 'Hacia atrás',
    'mounting.facing.left': 'Hacia la izquierda',
    'box.state.connected': 'Conectada',
    'box.state.lost': 'Se perdió el contacto',
    'box.state.notConnected': 'No conectada',
    'box.state.battery': 'batería {value}',
    'box.connect': 'Conectar',
    'box.step.position.upright.ok': 'Está de pie',
    'box.step.position.upright.bad': 'Tumbada: ponla de pie, hacia cualquier lado',
    'box.step.position.flat.ok': 'Está en plano',
    'box.step.position.flat.bad': 'Demasiado inclinada: ponla en plano, cara arriba',
    'box.step.position.flat.upsideDown':
      'Al revés: dale la vuelta con la tapa hacia arriba. El fabricante desaconseja montarla al revés.',
    'box.step.position.waiting': 'Posición: esperando una lectura',
    'box.step.direction.todo': 'Elegir la orientación',
    'box.step.direction.done': 'Orientación elegida',
    'box.step.direction.learn': '¿No estás seguro? Apréndela levantando la parte delantera',
    'box.step.zero.todo': 'Poner el vehículo a cero',
    'box.step.zero.done': 'Puesta a cero',
    'box.step.zero.hint': 'Nivela el vehículo con un nivel de burbuja y luego pon a cero.',
    'box.forgetDirection': 'Olvidar la orientación',
    'onboard.boxPosition.h': 'Posición de la caja',
    'onboard.boxPosition.later':
      'La dirección y el cero se ajustan la primera vez que aparcas. La página de la caja te guía y el piloto ⚠ Poner a cero te lo recuerda hasta entonces.',
    'sensorList.title': 'Caja sensora',
    'sensorList.phone': 'Se usa el sensor del propio móvil cuando no hay ninguna caja conectada.',
    'box.step.zero.again': 'Volver a poner a cero',
  },
  de: {
    'topbar.install': 'Installieren',
    'topbar.share': 'Libell teilen',
    'bottombar.settings': 'Einstellungen',
    'bottombar.sound.mute': 'Ton stummschalten',
    'bottombar.sound.unmute': 'Ton einschalten',
    'bottombar.help': 'Hilfe',
    'share.text': 'Richte dein Wohnmobil oder deinen Wohnwagen mit dem Handy waagerecht aus.',
    'share.copied': 'Link kopiert!',
    'update.check': 'Nach neuer Version suchen',
    'update.checking': 'Suche nach Updates…',
    'update.updating': 'Aktualisiere auf die neue Version…',
    'update.latest': 'Du hast die neueste Version',
    'update.offline': 'Keine Verbindung, Suche nach Updates nicht möglich',
    'update.unsupported': 'Updates sind hier nicht verfügbar',
    'install.hint': 'Auf Teilen tippen, dann „Zum Home-Bildschirm“.',
    'share.vehicle.text': 'Die Konfiguration meines Fahrzeugs für Libell — Maße und Auffahrkeile.',
    'settings.shareVehicle': 'An ein anderes Handy senden',
    'setup.incoming.h': 'Empfangene Fahrzeugkonfiguration',
    'setup.incoming.intro': 'Jemand aus deiner Familie hat dir diese Fahrzeugmaße geschickt:',
    'setup.incoming.reminder':
      'Eine Kalibrierung ist nicht dabei — auf diesem Handy musst du trotzdem kalibrieren.',
    'setup.incoming.apply': 'Diese Werte übernehmen',
    'setup.incoming.dismiss': 'Jetzt nicht',
    'setup.incoming.invalid':
      'Dieser Konfigurationslink konnte nicht gelesen werden — es wurde nichts geändert.',

    'lamp.setup': '⚠ Maße',
    'lamp.setup.title':
      'Die Maße des Fahrzeugs wurden noch nie gespeichert — zum Öffnen der Einstellungen tippen',
    'lamp.calibrate': '⚠ Kalibrieren',
    'lamp.zero': '⚠ Nullen',
    'lamp.calibrate.title': 'Das Handy ist nicht kalibriert — zum Öffnen der Kalibrierung tippen',
    'lamp.zero.title': 'Das Fahrzeug ist nicht genullt — zum Öffnen der Kalibrierung tippen',
    'lamp.calibrate.title.sensor': 'Die Box ist nicht genullt — tippen, um die Box zu öffnen',

    'sensorStatus.connected': 'Sensorbox verbunden',
    'sensorStatus.disconnected': 'Sensorbox — Verbindung verloren, für Details tippen',
    'sensorStatus.idle': 'Sensorbox — zum Verbinden tippen',
    'sensorStatus.idle.guide': 'Sensorbox — für die iPhone-Anleitung tippen',

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
    'menu.sensorSource': 'Sensorbox',
    'menu.advanced': 'ERWEITERT',
    'menu.others': 'SONSTIGES',
    'menu.card.notDone': 'Nicht erledigt',

    'sensorSource.connect': '{name}-Sensor verbinden',
    'sensorSource.disconnect': 'Trennen',
    'sensorSource.status.connecting': 'Verbinden…',
    'sensorSource.err.unsupported': 'Dieser Browser unterstützt Web Bluetooth nicht.',
    'sensorSource.err.password':
      'Die {name}-Box hat ihr Passwort nicht akzeptiert. Stelle es in der App des Herstellers zurück, oder setze die Box zurück.',
    'sensorSource.err.failed': 'Verbindung zum {name}-Sensor nicht möglich.',

    'sensorSource.ios.intro':
      'Safari kann sich nicht direkt mit Bluetooth-Sensoren verbinden, aber es gibt einen Umweg:',
    'sensorSource.ios.step1': 'Installiere „Bluefy – Web Bluetooth Browser“ aus dem App Store.',
    'sensorSource.ios.step2': 'Öffne Bluefy und erlaube die Bluetooth-Berechtigung.',
    'sensorSource.ios.step3': 'Rufe in Bluefy dieselbe Libell-Adresse auf.',
    'sensorSource.ios.step4': 'Öffne hier wieder Sensorbox — es funktioniert wie unter Android.',
    'sensorSource.ios.note':
      'Bluefy ist eine App von Dritten, nicht von Libell — das erneute Verbinden beim Öffnen ' +
      'erfordert dort eventuell einen manuellen Tipp, statt still zu geschehen.',
    'sensorSource.ios.bluefyLink': 'Bluefy im App Store finden',

    'sensorSource.detail.temperature': 'Temperatur: {value}',
    'sensorSource.detail.notAvailable': 'Noch nicht verfügbar',
    'sensorSource.lowBattery':
      '⚠ Batterie schwach ({value}) — die Batterie der Sensorbox sollte bald gewechselt werden.',

    'sensorSource.install.now': 'Jetzt nullen',
    'sensorSource.install.clear': 'Nullpunkt vergessen',
    'sensorSource.install.status': 'Nullpunkt: seitlich {roll}°, längs {pitch}°.',
    'sensorSource.install.status.none': 'Noch nicht genullt — die Box misst so, wie sie sitzt.',

    'sensorSource.learn.h': 'Montage anlernen',
    'sensorSource.learn.intro':
      'Libell lernt die Richtung aus zwei Anhebungen: zuerst vorne, dann die rechte Seite.',
    'sensorSource.learn.start': 'Montage anlernen',
    'sensorSource.learn.step.front':
      'Hebe die Fahrzeugfront ein paar Zentimeter an und tippe dann auf die Schaltfläche.',
    'sensorSource.learn.capture.front': 'Die Front ist angehoben',
    'sensorSource.learn.step.right':
      'Senke die Front wieder ab. Hebe jetzt die rechte Seite ein paar Zentimeter an und tippe dann auf die Schaltfläche.',
    'sensorSource.learn.capture.right': 'Die rechte Seite ist angehoben',
    'sensorSource.learn.cancel': 'Abbrechen',
    'sensorSource.learn.status.learned': 'Montage angelernt.',
    'sensorSource.learn.status.none':
      'Keine Montage angelernt — die eigenen Richtungen der Box werden verwendet.',
    'sensorSource.learn.done':
      'Fertig! Prüfe es: Hebe die Front an, dann sollte Libell auf die Hinterräder zeigen.',
    'sensorSource.learn.err.tooSmall':
      'Das Fahrzeug hat sich kaum bewegt. Hebe es etwas mehr an und versuche es erneut.',
    'sensorSource.learn.err.ambiguous':
      'Beide Richtungen haben sich etwa gleich stark bewegt. Hebe nur die Front, dann nur die rechte Seite an und versuche es erneut.',
    'sensorSource.learn.err.arrow':
      'Kein Pfeil zeigt nach vorn. Drehe die Box so, dass einer ihrer Pfeile nach vorn zeigt, und versuche es erneut.',
    'sensorSource.learn.err.mirrored':
      'Die Box scheint verkehrt herum zu sitzen, oder die falsche Seite wurde angehoben. Prüfe es und versuche es erneut.',
    'sensorSource.learn.err.sameAxis':
      'Beide Anhebungen haben in dieselbe Richtung geneigt. Hebe zuerst die Front, dann die rechte Seite an und versuche es erneut.',

    'sensorStatus.title': '{name}-Sensor',
    'sensorStatus.reading': 'Neigung jetzt: {value}',
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
    'sensorStatus.advanced': 'Erweitert',
    'sensorStatus.silentReconnect.intro':
      'Dieser Browser kann sich noch nicht selbst wieder mit der Box verbinden, daher wählst du sie nach einem Neustart erneut in der Liste. In Chrome kannst du das selbst einschalten.',
    'sensorStatus.silentReconnect.steps':
      'Öffne {address}, suche nach „web bluetooth“, stelle „Use the new permissions backend for Web Bluetooth“ auf Enabled und tippe auf Relaunch. Verbinde die Box danach einmal.',
    'sensorStatus.silentReconnect.copy': '{address} kopieren',
    'sensorStatus.silentReconnect.copied': 'Kopiert – füge es in die Adressleiste von Chrome ein.',
    'sensorStatus.debug.connectDelay.intro':
      'Experimentell: nur versuchen, wenn die Verbindung deiner Box unzuverlässig ist. Fügt ' +
      'nach dem Verbinden eine feste Pause ein, bevor die App zu lesen beginnt.',
    'sensorStatus.debug.connectDelay.enable': 'Verbindungspause aktivieren',
    'sensorStatus.debug.connectDelay.ms': 'Pause (ms)',

    'about.text':
      'Libell hilft dir, dein Wohnmobil oder deinen Wohnwagen mit dem Handy auszurichten, ' +
      'das du ohnehin dabeihast, ohne Raten.',
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
    'onboard.source.externalActive':
      'Eine Sensorbox ist aktiv. Wählst du dieses Handy, überspringt der Assistent die Kalibrierung des Handys – um das Handy zu kalibrieren, tippe zuerst auf der Seite „Sensorbox“ auf „Trennen“.',
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
    'onboard.legend.dim': 'Grau – — an diesem Rad kein Keil; lass es so.',
    'settings.wheelbase': 'Radstand',
    'settings.trackFront': 'Spurweite vorn',
    'settings.trackRear': 'Spurweite hinten',
    'settings.tolerance': 'Toleranz',
    'settings.stability': 'Stabilität',
    'settings.dwellRest': 'Reaktionsverzögerung (ms)',
    'settings.dwellMotion': 'Reaktionsverzögerung beim Ausrichten (ms)',
    'settings.dwell.hint': 'Wie lange ein Messwert halten muss, bevor sich die Zahl ändert.',
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
      'Die Maße stehen im Fahrzeugschein. Ein paar cm Abweichung machen nichts.',
    'settings.measureHint.caravan':
      'Von der Achse bis zum Stützrad messen. Ein paar cm Abweichung machen nichts.',
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
      'Innerhalb der Toleranz bleibt diese Seite am tiefsten, damit das Wasser abläuft.',
    'settings.section.vehicle': 'Fahrzeug und Maße',
    'settings.section.ramps': 'Auffahrkeile',
    'settings.general': 'Allgemein',
    'settings.language': 'Sprache',
    'settings.language.auto': 'Automatisch (Gerätesprache)',
    'settings.tolerance.hint': 'Wie nah an der Waagerechten noch als waagerecht gilt.',
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
    'settings.sound': 'Signalton bei waagerecht',
    'settings.soundGuidance': 'Durchgehende Tonführung',
    'settings.soundGuidance.help':
      'Der Ton wird schneller und höher, je näher du der Waagerechten kommst.',
    'settings.undo': 'Rückgängig',
    'settings.saved': 'Gespeichert',
    'settings.more': 'Mehr',
    'settings.fineTuning': 'Feinabstimmung',
    'settings.resetAll': 'Alle Einstellungen zurücksetzen',
    'settings.err.positive': 'Gib eine Zahl über 0 ein. Der vorige Wert gilt weiter.',
    'settings.err.notNegative': 'Gib 0 oder mehr ein. Der vorige Wert gilt weiter.',

    'settings.tab.vehicle': 'Fahrzeug',
    'settings.tab.ramps': 'Keile',
    'settings.tab.level': 'Waagerecht',
    'settings.klossar.brandAll': 'Alle',
    'settings.klossar.changeRamp': 'Keil wechseln',
    'settings.rampCountHint': 'Die App legt sie dorthin, wo sie am meisten bringen.',
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
    'calibration.step.phone.done': 'Handy kalibriert',
    'calibration.step.phone.hint': 'Leg das Handy auf etwas Ebenes.',
    'calibration.step.flipLink': 'Nichts Ebenes da? Handy drehen',
    'calibration.step.vehicle.done': 'Genullt',
    'calibration.step.vehicle.hint':
      'Richte das Fahrzeug mit einer Wasserwaage aus und leg das Handy an seinen üblichen Platz.',
    'calibration.step.vehicle.now': 'Jetzt nullen',
    'calibration.clear': 'Kalibrierung löschen',
    'calibration.err.notRunning':
      'Der Neigungssensor läuft noch nicht — tippe zuerst auf dem Hauptbildschirm auf Start.',
    'calibration.err.notFlat':
      'Das Handy scheint nicht flach zu liegen — lege es auf eine waagerechte Fläche und ' +
      'versuche es erneut.',
    'calibration.sensor.h': 'Handy kalibrieren',
    'calibration.vehicle.h': 'Fahrzeug nullen',
    'calibration.vehicle.intro':
      'Die Kalibrierung gilt dem Handy, nicht dem Platz, auf dem es liegt. Steht der Tisch leicht schief, zeigt die App diese Neigung. Stell das Fahrzeug einmal mit einer Wasserwaage waagerecht, leg das Handy an seinen gewohnten Platz und nulle.',
    'calibration.vehicle.now': 'Jetzt nullen',
    'calibration.vehicle.clear': 'Nullpunkt vergessen',
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

    'targets.normal': 'Normal (waagerecht)',
    'targets.name.placeholder': 'Name (z. B. „Duschablauf“)',
    'targets.defaultName': 'Ziel {n}',
    'targets.add': 'Aktuelle Neigung als neues Ziel speichern',
    'targets.delete': '{name} löschen',
    'targets.err.tooSteep':
      'Das sieht nach mehr als einem gewollten Ziel aus (>15°) — versuche es erneut.',
    'targets.badge': 'Ziel: {name}',

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

    'help.screen.h': 'Den Bildschirm lesen',
    'help.screen.t':
      'Grün ✓: fertig, nichts zu tun.\n' +
      'Orange ↑: fahr das Rad auf die daneben angezeigte Stufe.\n' +
      'Rot ✕: deine Keile reichen hier nicht. Stell das Fahrzeug um.\n' +
      'Grau –: an diesem Rad kein Keil. Lass es so.\n' +
      'Ruht die Blase in der Mitte, stehst du waagerecht.',
    'help.what.t':
      'Leg das Handy flach ins Fahrzeug, die Oberseite nach vorn, jedes Mal an dieselbe Stelle.\n' +
      'Mit einer Sensorbox ist egal, wie das Handy liegt.',
    'help.settings.h': 'Die Maße',
    'help.measures.h': 'Maße eintragen',
    'help.settings.t':
      'Radstand und Spurweite. Sie stehen in den Fahrzeugpapieren, sonst miss mit dem Maßband.\n' +
      'Beim Wohnwagen ist der Radstand der Abstand von der Achse zum Stützrad.',
    'help.ramps.t':
      'Wähle deine Keile oder gib die Stufenhöhen ein. Libell legt sie dorthin, wo sie am meisten bringen.',
    'help.calibration.h': 'Kalibrieren und nullen',
    'help.calibration.t':
      'Kalibriere das Handy einmal: leg es auf eine ebene Fläche und tippe auf Jetzt kalibrieren.\n' +
      'Nulle dann, wenn das Fahrzeug waagerecht steht, mit dem Handy an seinem gewohnten Platz.\n' +
      'Mit einer Sensorbox nullst du auf der Seite der Box. Sie braucht keine Kalibrierung.\n' +
      'Die Lampe ⚠ Kalibrieren oder ⚠ Nullen leuchtet, bis es erledigt ist.',
    'help.sensor.h': 'Sensorbox',
    'help.sensor.t':
      'Eine Box im Fahrzeug kann statt des Handys messen.\n' +
      'Tippe oben rechts auf das Sensorsymbol, um sie zu verbinden. Die Seite der Box zeigt den Rest Schritt für Schritt.\n' +
      'Die Xparkle muss aufrecht stehen.\n' +
      'Eine Box mit Pfeilen liegt flach, Deckel oben, mit einem Pfeil nach vorn.\n' +
      'Auf dem iPhone brauchst du den Browser Bluefy.',
    'help.targets.h': 'Ziele und Ton',
    'help.targets.t':
      'Speichere eine gewünschte Neigung, etwa zum Duschablauf hin, und wechsle zwischen ihnen.\n' +
      'Die Taste in der Mitte der unteren Leiste schaltet den Ton ein und aus.',
    'help.trouble.h': 'Wenn etwas nicht klappt',
    'help.trouble.t':
      '„Messen…“: das Fahrzeug schaukelt. Warte, bis es ruhig steht.\n' +
      '„Zum Messen das Handy flach hinlegen“: das Handy ist zum Messen zu stark geneigt.\n' +
      '„Verbindung zur Box verloren“: tippe auf Erneut verbinden und wähle die Box in der Liste.\n' +
      'Auf dem iPhone: tippe bei jedem Öffnen der App auf Start.\n' +
      'Immer noch falsch? Schreib einen Bericht unter Rückmeldung.',
    'help.open': '{name} öffnen',
    'help.open.sensor': 'Sensor öffnen',
    'help.open.feedback': 'Bericht schreiben',

    'main.hint': 'Lege dein Handy flach ins Fahrzeug, die Oberkante nach vorn.',
    'main.start': 'Start',
    'main.waiting': 'Warten auf den Neigungssensor…',
    'main.level': 'Dein Fahrzeug steht waagerecht!',
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
    'pose.sensorHint': 'Sie misst nur flach liegend richtig, Oberseite nach oben.',
    'pose.openSensorPage': 'Box anzeigen',
    'pose.sensorExtreme': 'Die Box ist zu stark geneigt',
    'pose.sensorUpsideDown': 'Die Box scheint kopfüber zu sitzen',
    'pose.sensorNotUpright': 'Die Box liegt',
    'pose.sensorHintUpright': 'Sie misst nur stehend richtig.',
    'calibration.external.h': 'Fahrzeug nullen',
    'calibration.external.intro':
      'Stell das Fahrzeug einmal mit einer Wasserwaage waagerecht und nulle dann.',
    'calibration.external.working': 'Wird genullt…',
    'calibration.external.done': '{name} ist genullt: Diese Lage gilt jetzt als waagerecht.',
    'calibration.external.err.notConnected':
      '{name} ist nicht verbunden. Verbinden Sie ihn und versuchen Sie es erneut.',
    'calibration.external.err.failed':
      '{name} konnte nicht genullt werden. Es wurde nichts geändert. Prüf die Verbindung und versuch es erneut.',
    'pose.portrait': 'Drehe das Handy hochkant (Porträt) — die Oberkante muss nach vorn zeigen',

    'stale.dataUnavailable': 'Keine neuen Sensordaten — die Führung pausiert, bis sie zurückkommen',

    'sensorFallback.lost': 'Verbindung zur Box verloren',
    'sensorFallback.autoRetry': 'Neuer Versuch läuft automatisch…',
    'sensorFallback.connect': 'Box verbinden',
    'sensorFallback.pick': 'Tippe und wähle deine Box in der Liste.',
    'sensorFallback.notFound':
      'Keine Box gefunden? Prüfe, ob sie eingeschaltet und in der Nähe ist.',
    'sensorFallback.retry': 'Erneut verbinden',
    'sensorFallback.usePhone': 'Stattdessen das Handy verwenden',
    'mounting.prompt.upright':
      'Tippe auf die Seite, auf die die Rückseite der Box (die Schraubhalterung) zeigt.',
    'mounting.prompt.arrow':
      'Einer der Pfeile der Box (auf dem Deckel oder der Platine darunter) zeigt nach vorn. Welche Seite zeigt nach vorn?',
    'mounting.placement.wide': 'Lange Seite nach vorn',
    'mounting.placement.short': 'Kurze Seite nach vorn',
    'mounting.facing.front': 'Zeigt nach vorne',
    'mounting.facing.right': 'Zeigt nach rechts',
    'mounting.facing.rear': 'Zeigt nach hinten',
    'mounting.facing.left': 'Zeigt nach links',
    'box.state.connected': 'Verbunden',
    'box.state.lost': 'Verbindung verloren',
    'box.state.notConnected': 'Nicht verbunden',
    'box.state.battery': 'Akku {value}',
    'box.connect': 'Verbinden',
    'box.step.position.upright.ok': 'Steht aufrecht',
    'box.step.position.upright.bad': 'Liegt: stelle sie aufrecht, Richtung egal',
    'box.step.position.flat.ok': 'Liegt flach',
    'box.step.position.flat.bad': 'Zu stark geneigt: lege sie flach, Oberseite nach oben',
    'box.step.position.flat.upsideDown':
      'Verkehrt herum: dreh sie mit dem Deckel nach oben. Der Hersteller rät von einer Montage über Kopf ab.',
    'box.step.position.waiting': 'Lage: wartet auf einen Messwert',
    'box.step.direction.todo': 'Richtung wählen',
    'box.step.direction.done': 'Richtung gewählt',
    'box.step.direction.learn': 'Unsicher? Durch Anheben der Front einlernen',
    'box.step.zero.todo': 'Fahrzeug nullen',
    'box.step.zero.done': 'Genullt',
    'box.step.zero.hint': 'Stelle das Fahrzeug mit einer Wasserwaage waagerecht und nulle dann.',
    'box.forgetDirection': 'Richtung vergessen',
    'onboard.boxPosition.h': 'Lage der Box',
    'onboard.boxPosition.later':
      'Richtung und Nullpunkt stellst du beim ersten Parken ein. Die Seite der Box führt dich, und die Lampe ⚠ Nullen erinnert dich bis dahin.',
    'sensorList.title': 'Sensorbox',
    'sensorList.phone': 'Der Sensor des Handys wird verwendet, wenn keine Box verbunden ist.',
    'box.step.zero.again': 'Erneut nullen',
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

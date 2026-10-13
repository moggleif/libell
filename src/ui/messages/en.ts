/** English, the reference dictionary: its keys are the message ids every
 * other language must cover, so a missing or extra key fails typecheck. */
export const en = {
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
  'lamp.calibrate.title': 'The phone is not calibrated — tap to open “Calibrate and zero”',
  'lamp.zero.title': 'The vehicle is not zeroed — tap to open “Calibrate and zero”',
  'lamp.calibrate.title.sensor': 'The box is not zeroed — tap to open the box',

  // Main-screen external-sensor indicator (#129): shown only while an
  // external source (today: EasyLevel) is active — never in phone mode.
  // Deliberately just an icon/dot, no numbers — detail lives one tap
  // away in the "External sensor" menu page.
  'sensorStatus.connected': 'Sensor box connected',
  'sensorStatus.disconnected': 'Sensor box — lost contact, tap for details',
  'sensorStatus.stale': 'Sensor box — no new data, tap for details',
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
  'menu.calibration': 'Calibrate and zero',
  'menu.targets': 'Targets',
  'menu.feedback': 'Feedback',
  'menu.help': 'Help',
  'menu.intro': 'Show introduction',
  'menu.about': 'About Libell',
  // Short form for the "?" page's tab button (screen-cleanup follow-up)
  // — 'menu.about' above is the full title, too long for a tab pill.
  'menu.about.tab': 'About',
  'menu.sensorSource': 'Sensor box',

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
  'sensorSource.unsupported.browser':
    'To connect a sensor box, open Libell in Chrome or Edge on Android or on a computer. The phone’s own sensor works here as usual.',
  // Some boxes ask for a password before they will talk (#272). Kept
  // separate from the generic failure so the user knows the hardware is
  // fine and only the password is wrong. The code is typed in Libell; only
  // a forgotten code is changed in the vendor app, since Libell never
  // changes a box's password (#367).
  'sensorSource.err.password':
    'The {name} box did not accept its password. Type the box’s four-digit code below and tap Try again. The factory code is 0000. If you don’t know the code, change it in the Xparkle app.',
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
  // strength string any more (#228) — see `boxStatusPage.ts` for
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
  // Shown only once a box is connected: an install offset means
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
  // Debug info (only for a box with the `debugBytes` capability, hidden
  // while the phone's own sensor is active): raw values straight off the box, for troubleshooting a box
  // that isn't behaving as expected — not everyday reading material.
  'sensorStatus.debug': 'Debug info',
  'sensorStatus.debug.intro':
    'Raw values straight from the box — for troubleshooting if something isn’t working.',
  'sensorStatus.debug.state': 'Connection state: {value}',
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
  // Only where an external sensor is an option (#365): the box is not in
  // Settings, so "later from Settings" alone pointed the wrong way.
  'onboard.welcome.sensor':
    'A sensor box can be connected any time with the sensor icon at the top right.',
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
    'A sensor box is active now. Choosing this phone skips the phone calibration. To calibrate the phone, open the box with the sensor icon at the top right and tap "{disconnect}" first.',
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
  // What leaving a step undone means, per step (#365; #189 had one
  // shared note on every step). {lamp} and {next} are filled in from
  // 'lamp.*' and 'onboard.next', so the note always names the real lamp
  // and button.
  'onboard.note.measurements':
    'Skip, and the default measurements are used; {lamp} stays lit until you save yours.',
  'onboard.note.ramps':
    'Skip, and the default ramps are used. You can pick yours later in Settings.',
  'onboard.note.calibrate':
    'No flat surface right now? Tap {next}; {lamp} reminds you until it’s done.',
  'onboard.note.connect':
    'No box at hand? Tap {next} and connect later with the sensor icon at the top right.',
  'onboard.zeroLater':
    'You zero the vehicle the first time you park on level ground. {lamp} reminds you until it’s done.',
  'onboard.legend.ok': 'Green ✓ — that wheel is level.',
  'onboard.legend.up': 'Orange ↑ — drive that wheel up onto the step shown.',
  'onboard.legend.no': 'Red ✕ — no step is enough; move to a flatter spot.',
  'onboard.legend.dim': 'Gray – — no ramp at that wheel; the figure shows how much it lacks.',
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
  'calibration.warn.notFlat':
    'This does not look flat (over 15°), so the calibration will be wrong. Lay the phone on a flat surface, or calibrate anyway.',
  'calibration.anyway': 'Calibrate anyway',
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
  'calibration.vehicle.warn.notFlat':
    'This does not look level (over 15°). Is the vehicle really level? Zero anyway if you are sure.',
  'calibration.vehicle.anyway': 'Zero anyway',
  'calibration.age.today': '(today)',
  'calibration.age.days': '({n} days ago)',
  'calibration.check': 'Check',
  'calibration.check.good': 'Still good — off by {off}°.',
  'calibration.check.off': 'Off by {off}° — consider recalibrating.',
  'calibration.vehicle.check.off': 'Off by {off}° — consider zeroing again.',
  'calibration.check.none':
    'Not calibrated yet, so there is nothing to check. Lay the phone on a level surface and tap "{now}".',
  'calibration.vehicle.check.none':
    'No zero yet, so there is nothing to check. Level the vehicle with a spirit level and tap "{now}".',
  'calibration.flip.intro':
    'No level surface around? Use flip calibration: put the phone down anywhere ' +
    'reasonably flat, capture, rotate the phone half a turn (180°) on the same ' +
    'spot, capture again — the surface tilt cancels itself out.',
  'calibration.flip.start': 'Calibrate by flipping',
  'calibration.flip.rotate':
    'Now rotate the phone half a turn (180°) on the same spot, then tap Capture.',
  'calibration.flip.capture': 'Capture',
  'calibration.flip.done': 'Done! Your surface leans {surface}° — cancelled out.',
  'calibration.flip.warn.moved':
    'The two captures differ by more than 15° — did the phone move? Start over, or calibrate anyway.',
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
  'targets.warn.tooSteep':
    'That looks steeper than an intentional target (over 15°). Try again, or save anyway.',
  'targets.anyway': 'Save anyway',
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
  'feedback.warn.title': 'The title is empty — you can send the report anyway.',
  'feedback.warn.desc': 'The description is empty — you can send the report anyway.',
  'feedback.warn.both': 'The title and description are empty — you can send the report anyway.',

  // Help tab (#326): fold-out topics, one fact per line (R28). The
  // screens themselves explain how; these say what and where.
  'help.screen.h': 'Reading the screen',
  'help.screen.t':
    'Green ✓: done, nothing to do.\n' +
    'Orange ↑: drive that wheel up onto the step shown next to it.\n' +
    'Red ✕: your ramps are not enough here. Move the vehicle.\n' +
    'Gray –: no ramp at that wheel. The figure shows how much it lacks, if you want to put something else under it.\n' +
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
  'help.open.sensor': 'Open the sensor box',
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
  // Modern caravan wheel cards' aria-labels (#368).
  'caravan.axleLeft': 'Left axle wheel',
  'caravan.axleRight': 'Right axle wheel',
  'caravan.jockeyWheel': 'Jockey wheel',
  // Help → Reading the screen, for a caravan's jockey wheel (#368).
  'help.screen.caravan': 'Caravan: the jockey wheel says Crank up or Crank down, and by how much.',

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
  'calibration.external.phoneHidden':
    'The phone’s own calibration is hidden while the sensor box measures. To calibrate the phone, open the box and tap "{disconnect}" first.',
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
  'box.state.password': 'Wrong password',
  'box.password.label': 'Box code',
  'box.password.retry': 'Try again',
  'box.password.checking': 'Trying the code…',
  'box.password.invalid': 'The code is four digits.',
  'box.password.wrong': 'The box did not accept that code either.',
  'box.password.noAnswer':
    'The box did not answer. The code is saved and tried the next time the box connects.',
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
  // The box path with no box connected (#365): said once, Next goes on —
  // never "waiting for a reading" with nothing to wait for.
  'onboard.boxPosition.notConnected':
    'No box is connected yet, so its position can’t be shown. Tap {next} and connect later with the sensor icon at the top right.',
  'sensorList.title': 'Sensor box',
  'sensorList.phone': "The phone's own sensor is used when no box is connected.",
  'box.step.zero.again': 'Zero again',
} as const;

/** A complete dictionary: exactly the English keys. */
export type Messages = Record<keyof typeof en, string>;

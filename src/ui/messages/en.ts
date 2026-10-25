/** English, the reference dictionary: its keys are the message ids every
 * other language must cover, so a missing or extra key fails typecheck. */
export const en = {
  'topbar.install': 'Install',
  'topbar.share': 'Share Libell',
  // Bottom bar: aria-labels only; the buttons show fixed glyphs (☰ / ?).
  'bottombar.settings': 'Settings',
  'bottombar.sound.mute': 'Mute sound',
  'bottombar.sound.unmute': 'Unmute sound',
  'bottombar.help': 'Help',
  'bottombar.label': 'Actions',
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
  'install.row': 'Install Libell as an app on your home screen.',
  'install.close': 'Hide',
  // A shared link carries only the vehicle's measurements (R41).
  'share.vehicle.text': 'My vehicle setup for Libell — measurements and ramps.',
  'settings.shareVehicle': 'Share to another phone',
  'setup.incoming.h': 'Incoming vehicle setup',
  'setup.incoming.intro': 'A family member shared these vehicle measurements with you:',
  'setup.incoming.reminder':
    "This does not include any calibration — you'll still need to calibrate on this phone.",
  'setup.incoming.apply': 'Replace the current vehicle',
  'setup.incoming.dismiss': 'Not now',
  'setup.incoming.invalid': "That vehicle-setup link couldn't be read — nothing was changed.",

  'lamp.setup': '⚠ Measurements',
  'lamp.setup.title': 'The vehicle measurements have never been saved — tap to open Settings',
  'lamp.calibrate': '⚠ Calibrate',
  'lamp.zero': '⚠ Zero',
  'lamp.calibrate.title': 'The phone is not calibrated — tap to open “Calibrate and zero”',
  'lamp.zero.title': 'The vehicle is not zeroed — tap to open “Calibrate and zero”',
  'lamp.calibrate.title.sensor': 'The box is not zeroed — tap to open the box',

  // The main screen's sensor chip: short, it sits in the top-right corner.
  'sensorStatus.connected': 'Sensor box connected',
  'sensorStatus.disconnected': 'Sensor box — lost contact, tap for details',
  'sensorStatus.stale': 'Sensor box — no new data, tap for details',
  // Phone in use, a box available: the way to the box pages.
  'sensorStatus.idle': 'Sensor box — tap to connect',
  // iOS (R39): opens the Bluefy guide instead of a connect flow.
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
  // A tab pill: shorter than the full title 'menu.about'.
  'menu.about.tab': 'About',
  'menu.sensorSource': 'Sensor box',

  // One sentence per box; the browser requirement is said once per page.
  'sensorSource.connect': 'Connect {name} sensor',
  'sensorSource.disconnect': 'Disconnect',
  // On a box's row while a different box is the one in use.
  'sensorSource.status.connecting': 'Connecting…',
  // Lost while still the chosen source: never claim a live link.
  'sensorSource.err.unsupported': 'Web Bluetooth is not supported in this browser.',
  'sensorSource.unsupported.browser':
    'To connect a sensor box, open Libell in Chrome or Edge on Android or on a computer. The phone’s own sensor works here as usual.',
  // The box is fine, only the code is wrong; Libell never changes it (#367).
  'sensorSource.err.password':
    'The {name} box did not accept its password. Type the box’s four-digit code below and tap Try again. The factory code is 0000. If you don’t know the code, change it in the Xparkle app.',
  'sensorSource.err.failed': 'Could not connect to the {name} sensor.',

  // iOS has no Web Bluetooth (R39): the Bluefy browser is the workaround.
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

  // "Not available yet" shows only until the box's first status message.
  'sensorSource.detail.temperature': 'Temperature: {value}',
  'sensorSource.detail.notAvailable': 'Not available yet',
  // A notice on the box page, never an interruption on the level screen.
  'sensorSource.lowBattery':
    '⚠ Low battery ({value}) — consider replacing the sensor box’s battery soon.',

  // The box's zero (ADR 0014): same wording as the vehicle zero where it can be.
  'sensorSource.install.now': 'Zero now',
  'sensorSource.install.clear': 'Forget the zero',
  'sensorSource.install.status': 'Zero: front/back {pitch}, side/side {roll}.',
  'sensorSource.install.status.none': 'Not zeroed yet — the box measures as it sits.',

  // Learn the mounting (#293): the user lifts the front, then the right side.
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

  // The box's own page: its state and the live reading.
  'sensorStatus.title': '{name} sensor',
  'sensorStatus.reading': 'Tilt now: {value}',
  // Raw values for troubleshooting, not everyday reading.
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
  'sensorStatus.debug.versionBytes': 'Serial number and firmware (raw): {value}',
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
  // An experimental, off-by-default knob for an unreliable connection.
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
    'Your settings stay on your phone — no account and no tracking. The only thing ' +
    'Libell sends is anonymous counts of how the app is used, which you can turn off.',
  'about.source': 'Libell is free and open source (MIT license).',
  'about.source.link': 'Source code on GitHub',
  'menu.privacy': 'Privacy',
  'menu.privacy.tab': 'Privacy',
  'privacy.stored.h': 'Stored on this phone',
  'privacy.stored.empty': 'Nothing is stored.',
  'privacy.raw': 'Show raw data',
  'privacy.raw.hint': 'Exactly as stored. The box password is hidden.',
  'privacy.resetSettings': 'Reset only the settings',
  'privacy.deleteAll': 'Delete all Libell data',
  'privacy.deleteAll.confirm':
    'Delete everything Libell has stored on this phone? Vehicles, measurements and calibration are removed, and Libell starts again as the first time.',
  'privacy.deleteAll.yes': 'Yes, delete everything',
  'privacy.deleteAll.cancel': 'Cancel',
  'stored.vehicle': 'Vehicle',
  'stored.vehicle.detail': '{name}, wheelbase {wheelbase}',
  'stored.settings': 'Settings',
  'stored.settings.detail': 'Measurements, ramps, unit, appearance and sound',
  'stored.password': 'Sensor box password',
  'stored.language': 'Language',
  'stored.phoneCalibration': 'Phone calibration',
  'stored.zero': 'Vehicle zero',
  'stored.zeroTrim': 'Fine adjustment of the zero',
  'stored.targets': 'Targets',
  'stored.targets.active': '{name} (selected)',
  'stored.hitch': 'Hitch height',
  'stored.rememberedBox': 'Remembered sensor box',
  'stored.notes': 'The app’s own notes',
  'stored.notes.detail': '{n} small marks, such as whether the introduction has been shown',
  'stored.phone': 'The phone',
  'stored.saved': 'saved',
  'stored.counting.off': 'Switched off',
  'stored.counting.on': 'Switched on',
  'stored.savedOn': 'saved {date}',

  // The very first thing a new user sees, before any question.
  'intro.h': 'Welcome to Libell',
  'intro.how':
    'Lay the phone flat in the vehicle and Libell shows which wheels to raise, and by how much.',
  'intro.start': 'Get started',
  'intro.later': 'Look around first',
  // The box is not in Settings, so this says where it is.
  'onboard.source.sensorIcon':
    'A sensor box can be connected any time with the sensor icon at the top right.',
  // Anonymous counting (#674): the first-start choice (#699) and the Privacy tab.
  'counting.title': 'Anonymous counting',
  'counting.intro': 'Libell can count use anonymously, so we know what to improve.',
  'counting.sent.h': 'What is counted',
  'counting.sent':
    'That the app was opened, which features are used, which sensor measures ' +
    '(the phone or a model such as {boxes}), the app version and the language chosen in Libell.',
  'counting.notSent.h': 'What is never saved',
  'counting.notSent':
    'Your IP address, country, device, screen, operating system or browser, your ' +
    'vehicle’s measurements, your settings, or anything else about you. Only your choice is ' +
    'kept on your phone.',
  'counting.gpc': 'If your browser asks websites not to track you, Libell counts nothing.',
  'counting.later': 'You can change your choice any time under {help} › {tab}.',
  'counting.toggle': 'Count my use anonymously',
  'counting.dashboard': 'See the statistics',
  'counting.ask': 'Would you like to help make Libell better?',
  'counting.yes': 'Yes, count anonymously',
  'counting.no': 'No thanks',
  // Heads the wizard step holding the chime and the audio guidance.
  'onboard.sound.h': 'Sound',
  // The wizard's source step; the box radio is labelled 'menu.sensorSource'.
  'onboard.source.h': 'How do you want to measure?',
  // Reassures that the pre-selected choice is the normal one.
  'onboard.source.intro':
    'Choose which sensor Libell should read tilt from — most people just use the phone.',
  'onboard.source.phone': 'This phone',
  // #287: shown on the source step only while a box is the active source.
  'onboard.source.externalActive':
    'A sensor box is active now. Choosing this phone skips the phone calibration. To calibrate the phone, open the box with the sensor icon at the top right and tap "{disconnect}" first.',
  // Labels come from 'vehicle.motorhome' / 'vehicle.caravan'.
  'onboard.vehicle.h': 'What are you leveling?',
  'onboard.vehicle.intro': 'Choose your vehicle — the rest of this guide matches it.',
  'onboard.step1.h': 'Place the phone like this',
  'onboard.next': 'Next',
  // From the second step on, to correct a wrong tap.
  'onboard.back': 'Back',
  'onboard.close': 'Close the introduction',
  'onboard.done': 'Done',
  'onboard.skipStep': 'Skip',
  // What skipping a step means; {lamp} and {next} name the real lamp and button.
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
  'settings.measureHint.boggie': 'With a tandem axle, measure to the centre of the axle pair.',
  'settings.steps': 'Ramp step heights',
  'settings.steps.add': 'Add step',
  'settings.steps.new': 'New step height ({unit})',
  'settings.steps.remove': 'Remove {value}',
  'settings.ramp': 'Ready-made ramp',
  'settings.ramp.custom': 'Custom set',
  'settings.ramp.stepless': 'Stepless wedge',
  'settings.ramp.steplessModel': '{name} (stepless, max {max} mm)',
  'settings.stepless.max': 'Stepless wedge, max height',
  'settings.stepless.maxHeading': 'Max height',
  'settings.stepless.set': 'Save',
  'settings.stepless.new': 'Max height ({unit})',
  'settings.rampCount': 'Number of ramps',
  'settings.drain': 'Drain side',
  'settings.rampHint': 'The app picks where your ramps do the most good.',
  // Sink and shower water: shown under the Drain field.
  'settings.drainHint': 'Within the tolerance, this side is left lowest so water drains.',
  'settings.section.vehicle': 'Vehicle & measurements',
  'settings.section.ramps': 'Ramps',
  // Language, theme and sound: a tab in Modern, a section in Classic.
  'settings.general': 'General',
  'settings.language': 'Language',
  'settings.language.auto': 'Automatic (device language)',
  // Each hint sits right below its own field.
  'settings.tolerance.hint': 'How close to level counts as level.',
  'settings.stability.hint': 'Smooths out small sensor jitter so the numbers do not flicker.',
  'drain.none': 'None / does not matter',
  // "Middle": the mean of the two wheels on that edge, unlike a corner.
  'drain.left': 'Left, middle',
  'drain.right': 'Right, middle',
  'drain.front': 'Front, middle',
  'drain.rear': 'Rear, middle',
  // A waste-water outlet at one specific corner.
  'drain.frontLeft': 'Front left',
  'drain.frontRight': 'Front right',
  'drain.rearLeft': 'Rear left',
  'drain.rearRight': 'Rear right',
  'settings.unit': 'Show lengths in',
  'settings.unitInches': 'inches (in)',
  'settings.theme': 'Theme',
  'theme.system': 'Follow the phone',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'settings.appearance': 'Appearance',
  'appearance.classic': 'Classic',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Glossy',
  'settings.sound': 'Chime when level',
  'settings.soundGuidance': 'Continuous audio guidance',
  'settings.soundGuidance.help': 'The beep gets faster and higher the closer you get to level.',
  'settings.soundSpeech': 'Spoken guidance',
  'settings.soundSpeech.help':
    'When the vehicle stands still, the app says which wheel and how much, for example “Rear left, Step 2”.',
  'settings.soundSpeech.unavailable':
    'Spoken guidance does not work on this phone: it has no English voice that works offline. The tones work as usual.',
  'speech.level': 'Level',
  'speech.inches': '{n} inches',
  'speech.inchOne': 'one inch',
  'speech.inchOneAnd': 'one and {fraction} inches',
  'speech.inchesAnd': '{n} and {fraction} inches',
  'speech.inchFraction': '{fraction} of an inch',
  'speech.eighth1': 'one eighth',
  'speech.eighth2': 'a quarter',
  'speech.eighth3': 'three eighths',
  'speech.eighth4': 'a half',
  'speech.eighth5': 'five eighths',
  'speech.eighth6': 'three quarters',
  'speech.eighth7': 'seven eighths',
  'settings.undo': 'Undo',
  'settings.saved': 'Saved',
  'settings.more': 'More',
  'settings.fineTuning': 'Fine-tuning',
  'settings.resetAll': 'Reset all settings',
  'settings.err.positive': 'Enter a number above 0. The previous value still applies.',
  'settings.err.notNegative': 'Enter 0 or more. The previous value still applies.',
  'settings.err.range': 'Enter a number from {min} to {max}. The previous value still applies.',

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
  'status.cantLevel.far': 'Your ramps are far from enough here — move the vehicle',
  'adjustable.before': 'Set the ramps to the step shown, then drive up.',
  'adjustable.after': 'Not level yet. Drive off the ramps and the app measures again.',

  'calibration.intro':
    'Put the phone on a surface you know is level, then tap Calibrate now. ' +
    'The current tilt becomes the zero point.',
  'calibration.status': 'Calibrated: front/back {pitch}, side/side {roll}.',
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
    'Calibration saved, but this does not look flat (over 15°), so it is probably wrong. Not what you meant? Tap Undo, lay the phone on a flat surface and calibrate again.',
  'calibration.undo': 'Undo',
  // Card headings lead with the verb (Kalibrera / Nollställ).
  'calibration.sensor.h': 'Calibrate the phone',
  'calibration.vehicle.h': 'Zero the vehicle',
  // The two-layer overview at the top of the calibration tab.
  'calibration.vehicle.intro':
    'Calibration is about the phone, not the spot where it lies. If the table tilts a little, the app shows that tilt. Level the vehicle once with a spirit level, put the phone in its usual place and zero.',
  'calibration.vehicle.now': 'Zero now',
  'calibration.vehicle.clear': 'Forget the zero',
  'calibration.vehicle.status': 'Vehicle zero: front/back {pitch}, side/side {roll}.',
  'calibration.vehicle.status.none': 'No vehicle zero — the phone spot counts as flat.',
  'calibration.vehicle.warn.notFlat':
    'Zero saved, but this does not look level (over 15°). Was the vehicle not level? Tap Undo, level the vehicle and zero again.',
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
    'Calibration saved, but the two captures differ by more than 15°. Did the phone move? Tap Undo and start over.',
  // Short status-pill labels for the Modern calibration cards (#109).
  'calibration.pill.notDone': 'NOT DONE',
  'calibration.pill.done': 'DONE',
  'calibration.pill.none': 'NONE',

  // A deliberate non-level target (ADR 0013); "Normal" is true level.
  'targets.normal': 'Normal (level)',
  'targets.name.placeholder': 'Name (e.g. "Shower drain")',
  'targets.name.label': 'Name of the new target',
  'targets.defaultName': 'Target {n}',
  'targets.add': 'Save current tilt as new target',
  'targets.delete': 'Delete {name}',
  'targets.warn.tooSteep':
    'Target saved, but it is steeper than a usual target (over 15°). Not what you meant? Delete it with the cross and save again.',
  'targets.badge': 'Target: {name}',
  // Read-only, in the menu only, never on the main screen (R31).

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

  // Help topics: one fact per line (R28), saying what and where.
  'help.screen.h': 'Reading the screen',
  'help.screen.lead':
    'The screen shows which wheels to raise and by how much. Step 2 means the second step of your ramp.',
  'help.screen.t':
    'Green ✓: done, nothing to do.\n' +
    'Orange ↑: drive that wheel up onto the step shown next to it.\n' +
    'Red ✕: your ramps are not enough here. Move the vehicle.\n' +
    'Gray –: no ramp at that wheel. The figure shows how much it lacks, if you want to put something else under it.\n' +
    'When the bubble rests in the middle, you are level.',
  'help.screen.routine':
    'Drive up, wait until the vehicle is still and look again. Repeat until every wheel is green.',
  'help.what.t':
    'Lay the phone flat in the vehicle, top toward the front, in the same spot every time.\n' +
    'With a sensor box it does not matter how the phone lies.',
  'help.settings.h': 'The measurements',
  'help.measures.h': 'Enter the measurements',
  'help.settings.t':
    'Libell works out how much each wheel must rise from the wheelbase and track width.\n' +
    'They are in the vehicle papers, or measure with a tape.\n' +
    'Type them in mm, cm or inches, whichever you picked under Show lengths in.\n' +
    'On a caravan, the wheelbase is the distance from the axle to the jockey wheel.\n' +
    'With several vehicles, each keeps its own measurements, ramps, vehicle zero, targets and sensor box; pick one at the top of Vehicle.',
  'help.ramps.t':
    'The screen tells you which step of your ramp each wheel goes up on, so enter the ramps you carry.\n' +
    'Pick a ready-made ramp or a custom set, and how many you have. Libell puts them where they help most.\n' +
    'For a ramp with no steps, pick Stepless wedge and enter its height. The screen then says how far to drive up.',
  'help.calibration.h': 'Calibrate and zero',
  'help.calibration.t':
    'Two steps make the readings right: calibrate the phone once and zero the vehicle once.\n' +
    'Calibrate: lay the phone on a flat surface and tap Calibrate now.\n' +
    'Zero: level the vehicle with a spirit level, put the phone in its usual place and tap Zero now.\n' +
    'With a sensor box you zero on the box’s page. It needs no calibration.\n' +
    'Still not quite level? Fine-tune the zero with Left up, Right up, Front up or Back up in Zero the vehicle.\n' +
    'The ⚠ Calibrate or ⚠ Zero lamp stays on until it is done.',
  'help.sensor.h': 'Sensor box',
  'help.sensor.t':
    'A sensor box in the vehicle can measure instead of the phone. Libell works with these:\n' +
    '{upright}: stands upright, facing any way.\n' +
    '{flat}: lies flat, lid up, with one arrow pointing forward.\n' +
    'Connect with the sensor icon at the top right. The box’s page then takes you through Pick the direction and Zero the vehicle.\n' +
    'It works in Chrome or Edge on Android or a computer. On iPhone you need the Bluefy browser.\n' +
    'If the box rejects the code, Libell asks for the box’s four-digit code.',
  'help.targets.h': 'Targets and sound',
  'help.targets.t':
    'Save a tilt you want, for example toward the shower drain, and switch between them.\n' +
    'Caravan: save the hitch height before you unhitch, and Back to hitch height leads the jockey wheel back to it.\n' +
    'With spoken guidance on, the app says which wheel to raise and how much, so you can level without seeing the phone.\n' +
    'The button in the middle of the bottom bar turns sound on and off.',
  'help.trouble.h': 'If something is wrong',
  'help.trouble.t':
    '“Measuring…”: the vehicle is rocking. Wait until it is still.\n' +
    '“Lay the phone flat to measure”: the phone is tilted too much to measure.\n' +
    '“Lost contact with the box”: tap Reconnect and pick the box in the list.\n' +
    '“Waiting for the tilt sensor…”: no readings yet. On iPhone, tap Start each time you open the app; otherwise reload.\n' +
    '“Motion access was denied”: allow motion & orientation for this site in the browser settings and reload.\n' +
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
  'diagram.driveUp': 'Drive up',
  'diagram.done': 'Done',
  // A low wheel no ramp reaches (R5): says why nothing happens there.
  'diagram.noRamp': 'No ramp',
  'diagram.wheel.frontLeft': 'Front left',
  'diagram.wheel.frontRight': 'Front right',
  'diagram.wheel.rearLeft': 'Rear left',
  'diagram.wheel.rearRight': 'Rear right',
  // Spoken only (#534): after a red ✕ wheel's step and lift.
  'diagram.notEnough': 'not enough',
  // One wheel in the drawing's screen-reader text: its position, then what it needs.
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Crank up',
  'caravan.crankDown': 'Crank down',
  // Modern caravan wheel cards' aria-labels (#368).
  'caravan.axleLeft': 'Left axle wheel',
  'caravan.axleRight': 'Right axle wheel',
  'caravan.jockeyWheel': 'Jockey wheel',
  // Help → Reading the screen, for a caravan's jockey wheel (#368).
  'help.screen.caravan': 'Caravan: the jockey wheel says Crank up or Crank down, and by how much.',

  // Several vehicles (#599).
  'vehicles.title': 'Vehicles',
  'vehicles.defaultName': 'My vehicle',
  'vehicles.numbered': 'Vehicle {n}',
  'vehicles.name.placeholder': 'Name (e.g. "Caravan")',
  'vehicles.name.label': 'Vehicle name',
  'vehicles.add': 'New vehicle',
  // The name field shown only when a name is needed (#613).
  'namePrompt.save': 'Save',
  'namePrompt.cancel': 'Cancel',
  // Tapping the chosen target or vehicle again edits its name (#613).
  'choice.rename': 'Rename {name}',
  // The active vehicle on the main screen while there are several (#616).
  'vehicles.badge': 'Vehicle: {name}',
  'vehicles.delete': 'Remove {name}',
  'vehicles.remove.confirm': 'Remove {name} with its vehicle zero, targets and sensor box?',
  'vehicles.remove.yes': 'Yes, remove',
  'vehicles.hint':
    'Measurements, ramps, the vehicle zero, targets and the sensor box belong to the vehicle. The phone’s calibration is shared.',
  'setup.incoming.addNew': 'Add as a new vehicle',

  // A caravan's hitch height (#598).
  'hitch.title': 'Hitch height',
  'hitch.hint':
    'Save it while the caravan is still on the tow ball. Before you hitch up again, the jockey wheel shows how far to crank so the coupling meets the ball.',
  'hitch.save': 'Save hitch height',
  'hitch.go': 'Back to hitch height',
  'hitch.done': 'Done',
  'hitch.savedNow': 'Hitch height saved.',
  'hitch.status.none': 'No hitch height saved yet.',
  'hitch.status.saved': 'A hitch height is saved.',
  'hitch.status.active': 'The main screen shows how far to crank the jockey wheel.',
  'hitch.badge': 'Hitch height',
  'hitch.badge.aria': 'Hitch height: tap to level as usual again',
  'hitch.crank.up': 'Crank up {amount} to hitch height',
  'hitch.crank.down': 'Crank down {amount} to hitch height',
  'hitch.reached': 'At hitch height',
  'hitch.offer': 'Save the hitch height first?',
  'hitch.offer.save': 'Save',
  'hitch.offer.dismiss': 'Not now',

  'zeroTrim.title': 'Fine-tune the zero',
  'zeroTrim.hint':
    'Still not quite level? Each tap moves the zero by 0.1°, so the app wants that side higher.',
  'zeroTrim.left': 'Left up',
  'zeroTrim.right': 'Right up',
  'zeroTrim.front': 'Front up',
  'zeroTrim.back': 'Back up',
  'zeroTrim.side.left': 'Left',
  'zeroTrim.side.right': 'Right',
  'zeroTrim.side.front': 'Front',
  'zeroTrim.side.back': 'Back',
  'zeroTrim.total': 'Fine-tuned: {trim}',
  'zeroTrim.none': 'Not fine-tuned',
  'zeroTrim.reset': 'Reset fine-tuning',
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
  'pose.portrait': 'Turn the phone to portrait — the top edge must point forward',

  'stale.dataUnavailable': 'No new sensor data — guidance is paused until it returns',

  // Never a silent switch to the phone: always Retry or Use phone sensor.
  'sensorFallback.lost': 'Lost contact with the box',
  'sensorFallback.autoRetry': 'Trying again automatically…',
  'sensorFallback.connect': 'Connect the box',
  'sensorFallback.pick': 'Tap and pick your box in the list.',
  'sensorFallback.notFound': 'No box found? Check that it is on and close by.',
  'sensorFallback.retry': 'Reconnect',
  'sensorFallback.usePhone': 'Use the phone instead',
  // Box page: the mounting picker, the header and the setup checklist.
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
  // Said once; Next goes on, never "waiting for a reading".
  'onboard.boxPosition.notConnected':
    'No box is connected yet, so its position can’t be shown. Tap {next} and connect later with the sensor icon at the top right.',
  'sensorList.title': 'Sensor box',
  'sensorList.phone': "The phone's own sensor is used when no box is connected.",
  'box.step.zero.again': 'Zero again',
} as const;

/** A complete dictionary: exactly the English keys. */
export type Messages = Record<keyof typeof en, string>;

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
    'topbar.menu': 'Menu',
    'topbar.share': 'Share Libell',
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

    'menu.title': 'Menu',
    'menu.close': 'Close menu',
    'menu.settings': 'Settings',
    'menu.calibration': 'Calibration',
    'menu.targets': 'Targets',
    'menu.feedback': 'Feedback',
    'menu.help': 'Help',
    'menu.intro': 'Show introduction',
    'menu.about': 'About Libell',
    'menu.sensorSource': 'External sensor',
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

    // Detailed sensor health (#129). Battery/RSSI/temperature are shown
    // honestly as "not available yet" — `faf52c22-...`'s bytes beyond the
    // firmware version are undecoded (#116, deferred to #123), and this
    // app has no reliable, cross-browser RSSI reading — never fabricated.
    'sensorSource.detail.heading': 'Sensor details',
    'sensorSource.detail.battery': 'Battery: {value}',
    'sensorSource.detail.rssi': 'Signal strength: {value}',
    'sensorSource.detail.temperature': 'Temperature: {value}',
    'sensorSource.detail.notAvailable': 'Not available yet',

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

    'onboard.step1.h': 'Place the phone like this',
    'onboard.next': 'Next',
    'onboard.close': 'Close the introduction',
    'onboard.done': 'Done',
    'onboard.skipStep': 'Skip',
    'onboard.skipDefaults': 'Skip — use defaults',
    'onboard.legend.ok': 'Green ✓ — that wheel is level.',
    'onboard.legend.up': 'Orange ↑ — drive that wheel up onto the step shown.',
    'onboard.legend.no': 'Red ✕ — no step is enough; move to a flatter spot.',

    'settings.wheelbase': 'Wheelbase',
    'settings.trackFront': 'Track width front',
    'settings.trackRear': 'Track width rear',
    'settings.tolerance': 'Tolerance',
    'settings.stability': 'Stability',
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
    'settings.rampHint':
      'The app picks where your ramps do the most good — and, within the ' +
      'tolerance, leaves the drain side lowest so sink and shower keep draining.',
    'settings.section.vehicle': 'Vehicle & measurements',
    'settings.section.ramps': 'Ramps',
    'settings.section.display': 'Level & display',
    'drain.none': 'None / does not matter',
    'drain.left': 'Left side',
    'drain.right': 'Right side',
    'drain.front': 'Front',
    'drain.rear': 'Rear',
    'settings.unit': 'Show lengths in',
    'settings.theme': 'Theme',
    'theme.system': 'Follow the phone',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'settings.appearance': 'Appearance',
    'appearance.classic': 'Classic',
    'appearance.modern': 'Modern',
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
    'settings.klossar.pinnedSub': '{mm} mm · {steps}',
    'settings.klossar.step.one': '1 step',
    'settings.klossar.step.many': '{n} steps',
    'settings.klossar.stepsHeading': 'Step heights (mm)',

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
    'calibration.sensor.h': 'Phone sensor',
    'calibration.vehicle.h': 'Vehicle zero position',
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
      'Lay the phone flat inside the motorhome with the top toward the front. ' +
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
    'help.settings.t':
      'L is the wheelbase, W the track width (front and rear can differ) — usually ' +
      'in the vehicle papers, or use a tape measure.\n' +
      'Add your ramp steps with the + button or pick a preset.\n' +
      'Tolerance = how strict "level" is.\n' +
      'Stability keeps the numbers calm.',
    'help.calibration.h': 'Calibration',
    'help.calibration.t':
      'Two layers:\n' +
      '1. Calibrate the phone once on a level surface (or with the 180° flip).\n' +
      "2. With the vehicle verifiably level, set the phone's normal spot as the " +
      'vehicle zero — then a slightly tilting table is cancelled out too.',
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
    'main.easyLevelDisconnected':
      'Connection to the EasyLevel sensor was lost. Open the menu to reconnect.',

    'diagram.aria': 'Top-down view of your motorhome showing which wheels need raising',
    'diagram.caravan.aria':
      'Top-down view of your caravan showing the axle wheels and the jockey wheel',
    'diagram.front': 'Front',
    'diagram.step': 'Step {n}',
    'diagram.done': 'Done',
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
  },
  sv: {
    'topbar.install': 'Installera',
    'topbar.menu': 'Meny',
    'topbar.share': 'Dela Libell',
    'share.text': 'Få husbilen i våg med telefonen.',
    'share.copied': 'Länken kopierad!',
    'install.hint': 'Tryck på Dela och sedan "Lägg till på hemskärmen".',

    // Main-screen external-sensor indicator (#129): shown only while an
    // external source (today: EasyLevel) is active — never in phone mode.
    'sensorStatus.connected': 'Extern sensor ansluten',
    'sensorStatus.disconnected': 'Extern sensor — anslutningen bröts, tryck för detaljer',

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
    'menu.sensorSource': 'Extern sensor',
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

    'onboard.step1.h': 'Lägg telefonen så här',
    'onboard.next': 'Nästa',
    'onboard.close': 'Stäng introduktionen',
    'onboard.done': 'Klart',
    'onboard.skipStep': 'Hoppa över',
    'onboard.skipDefaults': 'Hoppa över — använd standardvärden',
    'onboard.legend.ok': 'Grönt ✓ — hjulet står i våg.',
    'onboard.legend.up': 'Orange ↑ — kör upp hjulet på steget som visas.',
    'onboard.legend.no': 'Rött ✕ — inget steg räcker; flytta till ett planare ställe.',

    'settings.wheelbase': 'Hjulbas',
    'settings.trackFront': 'Spårvidd fram',
    'settings.trackRear': 'Spårvidd bak',
    'settings.tolerance': 'Tolerans',
    'settings.stability': 'Stabilitet',
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
    'settings.rampHint':
      'Appen väljer var ramperna gör mest nytta — och lämnar avloppssidan ' +
      'lägst inom toleransen, så att disk- och duschvattnet rinner undan.',
    'settings.section.vehicle': 'Fordon och mått',
    'settings.section.ramps': 'Ramper',
    'settings.section.display': 'Nivå och visning',
    'drain.none': 'Inget / spelar ingen roll',
    'drain.left': 'Vänster sida',
    'drain.right': 'Höger sida',
    'drain.front': 'Fram',
    'drain.rear': 'Bak',
    'settings.unit': 'Visa längder i',
    'settings.theme': 'Tema',
    'theme.system': 'Följ telefonen',
    'theme.light': 'Ljust',
    'theme.dark': 'Mörkt',
    'settings.appearance': 'Utseende',
    'appearance.classic': 'Klassisk',
    'appearance.modern': 'Modern',
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
    'settings.klossar.pinnedSub': '{mm} mm · {steps}',
    'settings.klossar.step.one': '1 steg',
    'settings.klossar.step.many': '{n} steg',
    'settings.klossar.stepsHeading': 'Steghöjder (mm)',

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
    'calibration.sensor.h': 'Telefonens sensor',
    'calibration.vehicle.h': 'Fordonets nolläge',
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
      'Lägg telefonen plant i husbilen med ovansidan mot fronten. Skärmen visar ' +
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
      'L är hjulbasen, W spårvidden (fram och bak kan skilja sig) — står oftast i ' +
      'fordonspapperen, annars tumstock.\n' +
      'Lägg till rampens steg med plusknappen eller välj en färdig ramp.\n' +
      'Tolerans = hur strikt "i våg" är.\n' +
      'Stabilitet håller siffrorna lugna.',
    'help.calibration.h': 'Kalibrering',
    'help.calibration.t':
      'Två lager:\n' +
      '1. Kalibrera telefonen en gång på en plan yta (eller med 180°-vändningen).\n' +
      '2. När fordonet står verifierat plant: sätt telefonens vanliga plats som ' +
      'fordonets nolläge — då räknas även ett lutande bord bort.',
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
    'main.easyLevelDisconnected':
      'Anslutningen till EasyLevel-sensorn förlorades. Öppna menyn för att återansluta.',

    'diagram.aria': 'Din husbil ovanifrån, med hjulen som behöver höjas markerade',
    'diagram.caravan.aria': 'Din husvagn ovanifrån, med axelhjulen och stödhjulet',
    'diagram.front': 'Fram',
    'diagram.step': 'Steg {n}',
    'diagram.done': 'Klart',
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

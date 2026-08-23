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
    'install.hint': 'Tap Share, then "Add to Home Screen".',

    'lamp.setup': '⚠ Setup',
    'lamp.setup.title': 'Vehicle settings have never been saved — tap to open Settings',
    'lamp.calibrate': '⚠ Calibrate',
    'lamp.calibrate.title': 'The phone is not calibrated — tap to open Calibration',

    'menu.title': 'Menu',
    'menu.close': 'Close menu',
    'menu.settings': 'Settings',
    'menu.calibration': 'Calibration',
    'menu.feedback': 'Feedback',
    'menu.help': 'Help',

    'settings.wheelbase': 'Wheelbase (mm)',
    'settings.trackFront': 'Track width front (mm)',
    'settings.trackRear': 'Track width rear (mm)',
    'settings.tolerance': 'Tolerance (mm)',
    'settings.stability': 'Stability (mm)',
    'settings.steps': 'Ramp step heights (mm, separated by ;)',
    'settings.steps.placeholder': 'e.g. 20; 40; 60',
    'settings.save': 'Save',

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
      'Libell helps you park your motorhome level, using nothing but your phone. ' +
      'Lay the phone flat inside the vehicle — on the table or the floor — with the ' +
      'top of the phone pointing toward the front of the vehicle. The screen then ' +
      'shows your motorhome from above, and each wheel tells you what to do.',
    'help.first.h': 'Before the first use',
    'help.first.t':
      'Two things, both under the ☰ menu, and the app reminds you with yellow warning ' +
      'signs in the top bar until they are done. 1) Open Settings and fill in your ' +
      "vehicle's measurements and the step heights of your leveling ramps — the " +
      'numbers are usually in the vehicle papers, or measure with a tape measure. ' +
      '2) Calibrate the phone (see below). You only do this once; everything is ' +
      'remembered.',
    'help.screen.h': 'Reading the screen',
    'help.screen.t':
      'Green wheel: leave it alone, it is fine. Orange wheel: drive that wheel up on ' +
      'a ramp — the text above the wheel says which step to stop on (for example ' +
      '"↑ 40 mm"), and the number below says how much the wheel is missing. Red ' +
      'wheel: even your highest ramp step is not enough — do not bother driving up; ' +
      'move the vehicle to a flatter spot instead. The round bubble in the middle ' +
      'works like an ordinary spirit level: when the dot rests in the middle and ' +
      'everything is green, the app says "Your motorhome is level!" — then you are done.',
    'help.settings.h': 'The settings, one by one',
    'help.settings.t':
      'Wheelbase: the distance from the front wheels to the rear wheels, in mm. ' +
      'Track width front / rear: the distance between the left and right wheel on ' +
      'each axle, in mm — they may differ, so there is one field for each. ' +
      'Ramp step heights: your leveling ramps are like small staircases; write the ' +
      'height of every step in mm with semicolons between, for example 20; 40; 60. ' +
      'Tolerance: how many mm lower a wheel may stand than the highest wheel and ' +
      'still count as level — smaller number, stricter leveling. ' +
      'Stability: keeps the numbers calm when the phone lies still; raise it if ' +
      'anything flickers. The defaults are fine to start with.',
    'help.calibration.h': 'Calibration',
    'help.calibration.t':
      'No phone is perfectly flat — the case, a screen protector or the phone itself ' +
      'adds a small tilt. To cancel it: put the phone on a surface you know is ' +
      'level (check with a spirit level if unsure), open ☰ → Calibration and tap ' +
      '"Calibrate now". From then on that position counts as perfectly flat. ' +
      '"Clear calibration" undoes it.',
    'help.notes.h': 'Good to know',
    'help.notes.t':
      'The app works completely without internet once it has been opened — a campsite ' +
      'without signal is no problem. Add it to your home screen to use it like an ' +
      'ordinary app: on iPhone via Share → "Add to Home Screen", on Android via the ' +
      'Install button. On iPhone you also tap "Start" each time you open the app — ' +
      'Apple requires that before the phone shares its tilt sensors. The version ' +
      'number at the bottom of the screen is useful if you ever report a problem.',

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
    'diagram.front': 'Front ↑',

    'tilt.frontBack': 'Front/back',
    'tilt.sideSide': 'Side/side',
  },
  sv: {
    'topbar.install': 'Installera',
    'topbar.menu': 'Meny',
    'install.hint': 'Tryck på Dela och sedan "Lägg till på hemskärmen".',

    'lamp.setup': '⚠ Mått',
    'lamp.setup.title':
      'Fordonsinställningarna har aldrig sparats — tryck för att öppna Inställningar',
    'lamp.calibrate': '⚠ Kalibrera',
    'lamp.calibrate.title': 'Telefonen är inte kalibrerad — tryck för att öppna Kalibrering',

    'menu.title': 'Meny',
    'menu.close': 'Stäng menyn',
    'menu.settings': 'Inställningar',
    'menu.calibration': 'Kalibrering',
    'menu.feedback': 'Feedback',
    'menu.help': 'Hjälp',

    'settings.wheelbase': 'Hjulbas (mm)',
    'settings.trackFront': 'Spårvidd fram (mm)',
    'settings.trackRear': 'Spårvidd bak (mm)',
    'settings.tolerance': 'Tolerans (mm)',
    'settings.stability': 'Stabilitet (mm)',
    'settings.steps': 'Rampens steghöjder (mm, åtskilda med ;)',
    'settings.steps.placeholder': 't.ex. 20; 40; 60',
    'settings.save': 'Spara',

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
      'Libell hjälper dig att ställa husbilen i våg — med bara din telefon. ' +
      'Lägg telefonen plant inne i fordonet, på bordet eller golvet, med telefonens ' +
      'ovansida pekande mot fronten. Skärmen visar då din husbil ovanifrån, och ' +
      'varje hjul talar om vad du ska göra.',
    'help.first.h': 'Före första användningen',
    'help.first.t':
      'Två saker, båda under ☰-menyn — appen påminner med gula varningsskyltar i ' +
      'listen tills de är gjorda. 1) Öppna Inställningar och fyll i fordonets mått ' +
      'och rampens steghöjder — siffrorna finns oftast i fordonspapperen, eller mät ' +
      'med tumstock. 2) Kalibrera telefonen (se nedan). Det görs bara en gång; allt ' +
      'sparas.',
    'help.screen.h': 'Så läser du skärmen',
    'help.screen.t':
      'Grönt hjul: låt det vara, det är bra. Orange hjul: kör upp det hjulet på en ' +
      'ramp — texten ovanför hjulet visar vilket steg du ska stanna på (till exempel ' +
      '"↑ 40 mm"), och siffran under visar hur mycket hjulet saknar. Rött hjul: inte ' +
      'ens ditt högsta rampsteg räcker — flytta bilen till ett planare ställe i ' +
      'stället. Den runda bubblan i mitten fungerar som ett vanligt vattenpass: när ' +
      'pricken vilar i mitten och allt är grönt säger appen "Din husbil står i våg!" ' +
      '— då är du klar.',
    'help.settings.h': 'Inställningarna, en i taget',
    'help.settings.t':
      'Hjulbas: avståndet från framhjulen till bakhjulen, i mm. Spårvidd fram/bak: ' +
      'avståndet mellan vänster och höger hjul på respektive axel, i mm — de kan ' +
      'skilja sig, därför ett fält för varje. Rampens steghöjder: dina ramper är som ' +
      'små trappor; skriv höjden på varje steg i mm med semikolon emellan, till ' +
      'exempel 20; 40; 60. Tolerans: hur många mm lägre ett hjul får stå än det ' +
      'högsta hjulet och ändå räknas som i våg — lägre siffra, noggrannare. ' +
      'Stabilitet: håller siffrorna lugna när telefonen ligger still; höj den om ' +
      'något fladdrar. Standardvärdena fungerar bra att börja med.',
    'help.calibration.h': 'Kalibrering',
    'help.calibration.t':
      'Ingen telefon är helt plan — skalet, skärmskyddet eller telefonen själv ger ' +
      'en liten lutning. Så tar du bort den: lägg telefonen på en yta du vet är plan ' +
      '(kolla med vattenpass om du är osäker), öppna ☰ → Kalibrering och tryck på ' +
      '"Kalibrera nu". Från och med då räknas det läget som helt plant. "Rensa ' +
      'kalibrering" ångrar.',
    'help.notes.h': 'Bra att veta',
    'help.notes.t':
      'Appen fungerar helt utan internet när den väl har öppnats — en campingplats ' +
      'utan täckning är inget problem. Lägg den på hemskärmen så funkar den som en ' +
      'vanlig app: på iPhone via Dela → "Lägg till på hemskärmen", på Android via ' +
      'Installera-knappen. På iPhone trycker du också på "Start" varje gång appen ' +
      'öppnas — det kräver Apple innan telefonen delar sina lutningssensorer. ' +
      'Versionsnumret längst ner på skärmen är bra att ha om du rapporterar ett fel.',

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
    'diagram.front': 'Fram ↑',

    'tilt.frontBack': 'Längsled',
    'tilt.sideSide': 'Sidled',
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

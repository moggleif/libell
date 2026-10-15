/**
 * The app's fixed terms (#628): what each means, and the one word every
 * language has locked for it. A translation uses that word everywhere the
 * term is meant, never a synonym, so "Nollställ" on a button and in help
 * read as the same action. Each word is written as the stem every
 * inflection of it contains ("kloss" covers "klossar"), lower case.
 *
 * `anchors` are strings the term must appear in, checked by a unit test in
 * every language. `never` lists words a language must not use for it at
 * all, also checked.
 */
import type { Language, MessageKey } from '../i18n';

export interface GlossaryTerm {
  /** The term as the Swedish original names it. */
  term: string;
  /** What it means, and what it must never be confused with. */
  meaning: string;
  /** Each language's locked word, as a lower-case stem. */
  words: Record<Language, string>;
  anchors: readonly MessageKey[];
  never?: Partial<Record<Language, readonly string[]>>;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    term: 'Kalibrera',
    meaning:
      'Teach the phone its own sensor error, lying on a flat surface. Only ever the phone; a box or the vehicle is zeroed, not calibrated.',
    words: {
      sv: 'kalibr',
      en: 'calibrat',
      fr: 'étalonn',
      es: 'calibr',
      de: 'kalibr',
      nl: 'kalibr',
    },
    anchors: ['menu.calibration', 'help.calibration.h'],
  },
  {
    term: 'Nollställ',
    meaning:
      "Set the vehicle's level zero (with the phone or a box): this position counts as level from now on. Not calibration.",
    words: { sv: 'nollst', en: 'zero', fr: 'zéro', es: 'cero', de: 'null', nl: 'nul' },
    anchors: ['menu.calibration', 'calibration.vehicle.h', 'box.step.zero.todo'],
  },
  {
    term: 'kloss',
    meaning:
      'The stepped levelling block a wheel drives up onto. In Swedish always "kloss", never "ramp".',
    words: { sv: 'kloss', en: 'ramp', fr: 'rampe', es: 'rampa', de: 'keil', nl: 'blok' },
    anchors: ['settings.tab.ramps', 'help.ramps.t'],
    never: { sv: ['ramp'] },
  },
  {
    term: 'steg',
    meaning: 'One numbered height on a kloss: "Steg 2" means drive the wheel up onto step 2.',
    words: { sv: 'steg', en: 'step', fr: 'palier', es: 'escalón', de: 'stufe', nl: 'trede' },
    anchors: ['diagram.step', 'help.ramps.t'],
  },
  {
    term: 'steglös kil',
    meaning:
      'A wedge with no steps: the wheel stops anywhere on the slope, so the app gives a height to drive up.',
    words: {
      sv: 'steglös kil',
      en: 'stepless wedge',
      fr: 'cale sans paliers',
      es: 'calzo sin escalones',
      de: 'stufenloser keil',
      nl: 'traploze wig',
    },
    anchors: ['settings.ramp.stepless', 'settings.stepless.max'],
  },
  {
    term: 'Kör upp',
    meaning: 'Drive the wheel up onto the kloss by the height shown; the action on a wheel card.',
    words: {
      sv: 'kör upp',
      en: 'drive up',
      fr: 'monter',
      es: 'subir',
      de: 'auffahren',
      nl: 'oprij',
    },
    anchors: ['diagram.driveUp'],
  },
  {
    term: 'Sensorbox',
    meaning:
      'The external Bluetooth level sensor mounted in the vehicle (Xparkle, EasyLevel). Not the phone.',
    words: {
      sv: 'sensorbox',
      en: 'sensor box',
      fr: 'boîtier capteur',
      es: 'caja sensora',
      de: 'sensorbox',
      nl: 'sensorbox',
    },
    anchors: ['menu.sensorSource'],
  },
  {
    term: 'fordon',
    meaning: 'The motorhome or caravan being levelled; also each saved vehicle in the list.',
    words: {
      sv: 'fordon',
      en: 'vehicle',
      fr: 'véhicule',
      es: 'vehículo',
      de: 'fahrzeug',
      nl: 'voertuig',
    },
    anchors: ['settings.tab.vehicle', 'calibration.vehicle.h'],
  },
  {
    term: 'stödhjul',
    meaning: "A caravan's jockey wheel at the drawbar, cranked up or down to level front to back.",
    words: {
      sv: 'stödhjul',
      en: 'jockey wheel',
      fr: 'roue jockey',
      es: 'rueda jockey',
      de: 'stützrad',
      nl: 'neuswiel',
    },
    anchors: ['caravan.jockeyWheel'],
  },
  {
    term: 'Veva',
    meaning: 'Turn the jockey wheel crank, up or down, by the height shown.',
    words: { sv: 'veva', en: 'crank', fr: 'manivelle', es: 'manivela', de: 'kurbel', nl: 'draai' },
    anchors: ['caravan.crankUp'],
  },
  {
    term: 'mål',
    meaning:
      'A saved tilt to level to instead of flat (e.g. a slope for the shower drain). Not a goal in general.',
    words: { sv: 'mål', en: 'target', fr: 'cible', es: 'objetivo', de: 'ziel', nl: 'doel' },
    anchors: ['menu.targets', 'targets.badge'],
  },
  {
    term: 'hjulbas',
    meaning:
      'Front to rear axle distance; on a caravan, axle to jockey wheel. From the vehicle papers.',
    words: {
      sv: 'hjulbas',
      en: 'wheelbase',
      fr: 'empattement',
      es: 'distancia entre ejes',
      de: 'radstand',
      nl: 'wielbasis',
    },
    anchors: ['settings.wheelbase'],
  },
  {
    term: 'spårvidd',
    meaning: 'Distance between the left and right wheels of one axle.',
    words: {
      sv: 'spårvidd',
      en: 'track width',
      fr: 'voie',
      es: 'ancho de vía',
      de: 'spurweite',
      nl: 'spoorbreedte',
    },
    anchors: ['settings.trackFront'],
  },
  {
    term: 'tolerans',
    meaning: 'How far a wheel may sit below the highest wheel and still count as level (mm).',
    words: {
      sv: 'tolerans',
      en: 'tolerance',
      fr: 'tolérance',
      es: 'tolerancia',
      de: 'toleranz',
      nl: 'tolerantie',
    },
    anchors: ['settings.tolerance'],
  },
];

// @vitest-environment happy-dom
//
// Pins what every Settings tab does (#376, step 2) before the panel is
// split per tab: which fields each tab shows, which stored setting each
// field writes, the message an unusable number gets, and the Undo toast.
// Everything here goes through `createSettingsForm`'s public surface —
// captions, input names, `selectTab` and `classicPages` — never its
// internals, so the same tests hold before and after the split.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSettingsForm, type SettingsFormOptions } from './settingsPanel';
import type { CalibrationOptions } from './calibrationSection';
import type { CompactStep, Hosts, SettingsFormElement } from './settingsLayout';
import type { TargetsOptions } from './targetsSection';
import { setLanguage, t, type MessageKey } from './i18n';
import { loadSettings } from '../data/settingsStore';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { RAMP_MODELS } from '../domain/ramps';

setLanguage('en');

type Tab = 'vehicle' | 'ramps' | 'targets' | 'general';
type Appearance = 'modern' | 'classic';
const APPEARANCES: Appearance[] = ['modern', 'classic'];

/** The full form's options, with stand-in hosts for whatever a test does
 * not wire itself. */
function full(
  options: Partial<Hosts> & Omit<Extract<SettingsFormOptions, { hosts: Hosts }>, 'hosts'> = {},
): SettingsFormOptions {
  const { calibration = calibrationHost(), targets = targetsHost(), vehicles, ...rest } = options;
  return { hosts: { calibration, targets, vehicles }, ...rest };
}

function calibrationHost(): CalibrationOptions {
  return {
    appearance: 'modern',
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => 'no sensor',
    applyCalibration: () => () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => '',
    checkVehicleCalibration: () => '',
    clearVehicleCalibration: () => {},
  };
}

function targetsHost(): TargetsOptions {
  return {
    getTargetPresets: () => [],
    getActiveTargetId: () => null,
    selectTarget: () => {},
    addTargetPreset: () => null,
    deleteTargetPreset: () => {},
  };
}

interface Built {
  form: SettingsFormElement;
  onSave: ReturnType<typeof vi.fn<(s: LevelSettings) => void>>;
  initial: LevelSettings;
}

function build(appearance: Appearance, overrides: Partial<LevelSettings> = {}): Built {
  const initial: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides, appearance };
  const onSave = vi.fn<(s: LevelSettings) => void>();
  const onShareVehicleSetup = vi.fn<(s: LevelSettings) => void>();
  const form = createSettingsForm(initial, onSave, full({ splitPages: true, onShareVehicleSetup }));
  document.body.append(form);
  return { form, onSave, initial };
}

/** Shows a tab the way the app does: Modern selects it, Classic's ☰ mounts its page. */
function show(form: SettingsFormElement, appearance: Appearance, tab: Tab): HTMLElement {
  if (appearance === 'modern') {
    form.selectTab!(tab);
    return form.querySelector<HTMLElement>(`.settings__tabpanel[data-tab="${tab}"]`)!;
  }
  const page = form.classicPages![tab];
  form.replaceChildren(page);
  return page;
}

/** A field's caption without its unit suffix, e.g. "Wheelbase (mm)" → "Wheelbase". */
function captionOf(field: Element): string {
  return (field.firstElementChild?.textContent ?? '').replace(/ \((mm|cm)\)$/, '');
}

function captions(container: Element): string[] {
  return [...container.querySelectorAll('.settings__field')]
    .filter((f) => !(f as HTMLElement).hidden)
    .map(captionOf);
}

function field(container: Element, caption: MessageKey): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('.settings__field')].find(
    (f) => captionOf(f) === t(caption),
  );
  if (!found) throw new Error(`no field captioned ${caption}`);
  return found;
}

function control<T extends HTMLElement>(container: Element, caption: MessageKey): T {
  return field(container, caption).querySelector<T>('select, input')!;
}

function change(element: HTMLElement): void {
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function setValue(element: HTMLInputElement | HTMLSelectElement, value: string): void {
  element.value = value;
  change(element);
}

function numberInput(container: Element, name: string): HTMLInputElement {
  return container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

function undo(): void {
  document.querySelector<HTMLButtonElement>('.toast__action')!.click();
}

beforeEach(() => {
  localStorage.clear();
  document.body.replaceChildren();
});

const TAB_CAPTIONS: Record<Tab, MessageKey[]> = {
  vehicle: [
    'settings.vehicle',
    'settings.rearAxle',
    'settings.wheelbase',
    'settings.trackFront',
    'settings.trackRear',
  ],
  ramps: ['settings.rampCount'],
  targets: ['settings.tolerance', 'settings.drain'],
  general: [
    'settings.language',
    'settings.theme',
    'settings.appearance',
    'settings.unit',
    'settings.sound',
    'settings.soundGuidance',
    'settings.soundSpeech',
    'settings.stability',
    'settings.dwellRest',
    'settings.dwellMotion',
  ],
};

/** One edit per field: how the user makes it, and what it stores. */
interface Edit {
  name: string;
  tab: Tab;
  apply: (tab: HTMLElement) => void;
  expected: Partial<LevelSettings>;
}

const OTHER_MODEL = RAMP_MODELS.find((m) => m.name === 'Fiamma Level Up')!;

const EDITS: Edit[] = [
  {
    name: 'Vehicle',
    tab: 'vehicle',
    apply: (tab) => setValue(control(tab, 'settings.vehicle'), 'caravan'),
    expected: { vehicleType: 'caravan' },
  },
  {
    name: 'Rear axle',
    tab: 'vehicle',
    apply: (tab) => setValue(control(tab, 'settings.rearAxle'), 'boggie'),
    expected: { rearAxle: 'boggie' },
  },
  {
    name: 'Wheelbase',
    tab: 'vehicle',
    apply: (tab) => setValue(numberInput(tab, 'wheelbaseMm'), '4200'),
    expected: { wheelbaseMm: 4200 },
  },
  {
    name: 'Track width front',
    tab: 'vehicle',
    apply: (tab) => setValue(numberInput(tab, 'trackWidthFrontMm'), '1900'),
    expected: { trackWidthFrontMm: 1900 },
  },
  {
    name: 'Track width rear',
    tab: 'vehicle',
    apply: (tab) => setValue(numberInput(tab, 'trackWidthRearMm'), '2050'),
    expected: { trackWidthRearMm: 2050 },
  },
  {
    name: 'a catalogue ramp',
    tab: 'ramps',
    apply: (tab) =>
      [...tab.querySelectorAll<HTMLButtonElement>('.klossar__row')]
        .find((row) => row.querySelector('.klossar__row-name')?.textContent === OTHER_MODEL.name)!
        .click(),
    expected: { rampStepHeightsMm: OTHER_MODEL.stepsMm },
  },
  {
    name: 'Number of ramps',
    tab: 'ramps',
    apply: (tab) => setValue(control(tab, 'settings.rampCount'), '3'),
    expected: { rampCount: 3 },
  },
  {
    name: 'Tolerance',
    tab: 'targets',
    apply: (tab) => setValue(numberInput(tab, 'toleranceMm'), '10'),
    expected: { toleranceMm: 10 },
  },
  {
    name: 'Drain side',
    tab: 'targets',
    apply: (tab) => setValue(control(tab, 'settings.drain'), 'rear'),
    expected: { drainPosition: 'rear' },
  },
  {
    name: 'Theme',
    tab: 'general',
    apply: (tab) => setValue(control(tab, 'settings.theme'), 'dark'),
    expected: { theme: 'dark' },
  },
  {
    name: 'Show lengths in',
    tab: 'general',
    apply: (tab) => setValue(control(tab, 'settings.unit'), 'cm'),
    expected: { displayUnit: 'cm' },
  },
  {
    name: 'Chime when level',
    tab: 'general',
    apply: (tab) => {
      const box = control<HTMLInputElement>(tab, 'settings.sound');
      box.checked = !box.checked;
      change(box);
    },
    expected: { soundOnLevel: !DEFAULT_SETTINGS.soundOnLevel },
  },
  {
    name: 'Continuous audio guidance',
    tab: 'general',
    apply: (tab) => {
      const box = control<HTMLInputElement>(tab, 'settings.soundGuidance');
      box.checked = !box.checked;
      change(box);
    },
    expected: { soundGuidance: !DEFAULT_SETTINGS.soundGuidance },
  },
  {
    name: 'Spoken guidance',
    tab: 'general',
    apply: (tab) => {
      const box = control<HTMLInputElement>(tab, 'settings.soundSpeech');
      box.checked = !box.checked;
      change(box);
    },
    expected: { soundSpeech: !DEFAULT_SETTINGS.soundSpeech },
  },
  {
    name: 'Stability',
    tab: 'general',
    apply: (tab) => setValue(numberInput(tab, 'stabilityMm'), '5'),
    expected: { stabilityMm: 5 },
  },
  {
    name: 'Response delay',
    tab: 'general',
    apply: (tab) => setValue(numberInput(tab, 'dwellRestMs'), '800'),
    expected: { dwellRestMs: 800 },
  },
  {
    name: 'Response delay while adjusting',
    tab: 'general',
    apply: (tab) => setValue(numberInput(tab, 'dwellMotionMs'), '200'),
    expected: { dwellMotionMs: 200 },
  },
];

/** A typed number that cannot be used, and the message it gets. */
const INVALID_NUMBERS: {
  tab: Tab;
  name: string;
  value: string;
  message: MessageKey;
  vars?: Record<string, number>;
}[] = [
  { tab: 'vehicle', name: 'wheelbaseMm', value: '0', message: 'settings.err.positive' },
  { tab: 'vehicle', name: 'trackWidthFrontMm', value: '-1', message: 'settings.err.positive' },
  { tab: 'vehicle', name: 'trackWidthRearMm', value: '', message: 'settings.err.positive' },
  { tab: 'targets', name: 'toleranceMm', value: '0', message: 'settings.err.positive' },
  { tab: 'general', name: 'stabilityMm', value: '-1', message: 'settings.err.notNegative' },
  { tab: 'general', name: 'dwellRestMs', value: '0', message: 'settings.err.positive' },
  { tab: 'general', name: 'dwellMotionMs', value: '-10', message: 'settings.err.positive' },
  // Outside the plausible range a stored length is dropped on reload, so
  // the form keeps it out too (#541).
  ...(
    [
      ['vehicle', 'wheelbaseMm', '15010', 500, 15000],
      ['vehicle', 'wheelbaseMm', '400', 500, 15000],
      ['vehicle', 'trackWidthRearMm', '4010', 500, 4000],
      ['targets', 'toleranceMm', '201', 1, 200],
      ['general', 'stabilityMm', '51', 0, 50],
    ] as const
  ).map(([tab, name, value, min, max]) => ({
    tab,
    name,
    value,
    message: 'settings.err.range' as const,
    vars: { min, max },
  })),
];

for (const appearance of APPEARANCES) {
  describe(`settings tabs — ${appearance} (#376)`, () => {
    for (const [tab, expected] of Object.entries(TAB_CAPTIONS) as [Tab, MessageKey[]][]) {
      it(`the ${tab} tab shows exactly its own fields, in order`, () => {
        const { form } = build(appearance);
        expect(captions(show(form, appearance, tab))).toEqual(expected.map((key) => t(key)));
      });
    }

    for (const edit of EDITS) {
      it(`${edit.name} (${edit.tab} tab) is stored at once, with a toast that undoes it`, () => {
        const { form, onSave, initial } = build(appearance);
        edit.apply(show(form, appearance, edit.tab));

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave.mock.lastCall![0]).toMatchObject(edit.expected);
        expect(loadSettings()).toMatchObject(edit.expected);
        expect(document.querySelector('.toast')?.textContent).toContain(t('settings.saved'));

        undo();
        const before = Object.fromEntries(
          Object.keys(edit.expected).map((key) => [key, initial[key as keyof LevelSettings]]),
        );
        expect(onSave.mock.lastCall![0]).toMatchObject(before);
        expect(loadSettings()).toMatchObject(before);
        expect(document.querySelector('.toast')).toBeNull();
      });
    }

    for (const { tab, name, value, message, vars } of INVALID_NUMBERS) {
      it(`${name} = "${value}" keeps the value in effect and says why, right under the field`, () => {
        const { form, onSave, initial } = build(appearance);
        const input = numberInput(show(form, appearance, tab), name);
        setValue(input, value);

        expect(onSave).not.toHaveBeenCalled();
        expect(input.value).toBe(String(initial[name as keyof LevelSettings]));
        const error = input.closest('.settings__field')!.nextElementSibling as HTMLElement;
        expect(error.classList).toContain('settings__error');
        expect(error.getAttribute('role')).toBe('alert');
        expect(error.hidden).toBe(false);
        expect(error.textContent).toBe(t(message, vars));
      });
    }

    it('Stability may be zero', () => {
      const { form, onSave } = build(appearance);
      setValue(numberInput(show(form, appearance, 'general'), 'stabilityMm'), '0');
      expect(onSave.mock.lastCall![0].stabilityMm).toBe(0);
      expect(form.querySelector<HTMLElement>('.settings__error')).toBeNull();
    });

    it('a caravan relabels the vehicle fields and hides what does not apply', () => {
      const { form } = build(appearance, { vehicleType: 'caravan' });
      expect(captions(show(form, appearance, 'vehicle'))).toEqual(
        (
          ['settings.vehicle', 'settings.axle', 'settings.axleToJockey', 'settings.track'] as const
        ).map((key) => t(key)),
      );
      expect(captions(show(form, appearance, 'ramps'))).toEqual([]);
      expect(captions(show(form, appearance, 'targets'))).toEqual([t('settings.tolerance')]);
    });

    it('lengths are typed and shown in cm, and stored in mm', () => {
      const { form, onSave } = build(appearance, { displayUnit: 'cm' });
      const vehicle = show(form, appearance, 'vehicle');
      expect(field(vehicle, 'settings.wheelbase').firstElementChild?.textContent).toBe(
        `${t('settings.wheelbase')} (cm)`,
      );
      expect(numberInput(vehicle, 'wheelbaseMm').value).toBe(
        String(DEFAULT_SETTINGS.wheelbaseMm / 10),
      );
      setValue(numberInput(vehicle, 'wheelbaseMm'), '420');
      expect(onSave.mock.lastCall![0].wheelbaseMm).toBe(4200);
    });

    it('switching the unit converts the numbers in place without storing anything else', () => {
      const { form, onSave } = build(appearance);
      setValue(control(show(form, appearance, 'general'), 'settings.unit'), 'cm');
      expect(onSave.mock.lastCall![0]).toEqual({
        ...DEFAULT_SETTINGS,
        appearance,
        displayUnit: 'cm',
      });
      expect(numberInput(show(form, appearance, 'targets'), 'toleranceMm').value).toBe(
        String(DEFAULT_SETTINGS.toleranceMm / 10),
      );
    });

    it('a custom set of step heights is edited with + and − and stored as it changes', () => {
      const { form, onSave } = build(appearance);
      const ramps = show(form, appearance, 'ramps');
      ramps.querySelector<HTMLButtonElement>('.klossar__row--custom')!.click();
      expect(ramps.querySelector<HTMLElement>('.klossar__custom-editor')!.hidden).toBe(false);

      const add = ramps.querySelector<HTMLInputElement>('.steps__add input')!;
      const addButton = ramps.querySelector<HTMLButtonElement>('.steps__add-btn')!;
      add.value = '150';
      add.dispatchEvent(new Event('input', { bubbles: true }));
      addButton.click();
      expect(onSave.mock.lastCall![0].rampStepHeightsMm).toEqual([44, 78, 112, 150]);

      const removeFirst = ramps.querySelector<HTMLButtonElement>('.steps__chip-remove')!;
      expect(removeFirst.getAttribute('aria-label')).toBe(
        t('settings.steps.remove', { value: '44 mm' }),
      );
      removeFirst.click();
      expect(onSave.mock.lastCall![0].rampStepHeightsMm).toEqual([78, 112, 150]);
    });

    it('"Share to another phone" hands the current values to the host', () => {
      const onShareVehicleSetup = vi.fn<(s: LevelSettings) => void>();
      const form = createSettingsForm(
        { ...DEFAULT_SETTINGS, appearance },
        vi.fn(),
        full({ splitPages: true, onShareVehicleSetup }),
      );
      document.body.append(form);
      const vehicle = show(form, appearance, 'vehicle');
      setValue(numberInput(vehicle, 'wheelbaseMm'), '4100');
      vehicle.querySelector<HTMLButtonElement>('.settings__share-vehicle')!.click();
      expect(onShareVehicleSetup).toHaveBeenCalledWith(
        expect.objectContaining({ wheelbaseMm: 4100 }),
      );
    });
  });
}

describe('settings — the wizard steps (#376)', () => {
  const STEPS: [CompactStep, string[]][] = [
    ['measurements', ['settings.wheelbase', 'settings.trackFront', 'settings.trackRear']],
    ['language', ['settings.language']],
    ['appearance', ['settings.theme', 'settings.appearance']],
    ['sound', ['settings.sound', 'settings.soundGuidance', 'settings.soundSpeech']],
    ['ramps', ['settings.steps', 'settings.rampCount']],
  ];
  for (const [compact, expected] of STEPS) {
    it(`the ${compact} step shows exactly its own fields`, () => {
      const form = createSettingsForm({ ...DEFAULT_SETTINGS }, vi.fn(), { compact });
      expect(captions(form)).toEqual(expected.map((key) => t(key as MessageKey)));
    });
  }

  it('a step stores nothing until Next submits it, and shows no toast', () => {
    const onSave = vi.fn<(s: LevelSettings) => void>();
    const form = createSettingsForm({ ...DEFAULT_SETTINGS }, onSave, {
      compact: 'sound',
    });
    const box = control<HTMLInputElement>(form, 'settings.soundGuidance');
    box.checked = true;
    change(box);
    expect(onSave).not.toHaveBeenCalled();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSave.mock.lastCall![0].soundGuidance).toBe(true);
    expect(document.querySelector('.toast')).toBeNull();
  });
});

describe('a Modern form built without hosts (#481)', () => {
  function buildBare(): SettingsFormElement {
    const initial: LevelSettings = { ...DEFAULT_SETTINGS, appearance: 'modern' };
    const form = createSettingsForm(initial, vi.fn(), full());
    document.body.append(form);
    return form;
  }

  it('still draws the Calibration tab, from an inert stand-in', () => {
    const form = buildBare();
    form.selectCalibrationTab!();
    const panel = form.querySelector<HTMLElement>('.settings__tabpanel[data-tab="calibration"]')!;
    expect(panel.hidden).toBe(false);
    expect(panel.childElementCount).toBeGreaterThan(0);
  });

  it('still draws the Level tab, with no saved targets', () => {
    const form = buildBare();
    form.selectTargetsTab!();
    const panel = form.querySelector<HTMLElement>('.settings__tabpanel[data-tab="targets"]')!;
    expect(panel.hidden).toBe(false);
    expect(panel.childElementCount).toBeGreaterThan(0);
  });

  it('redraws whichever tab is open, and opens on Vehicle', () => {
    const form = buildBare();
    const selected = () =>
      form.querySelector<HTMLElement>('.settings__tab[aria-selected="true"]')!.dataset.tab;
    expect(selected()).toBe('vehicle');
    form.selectTab!('general');
    form.refreshOpenTab!();
    expect(selected()).toBe('general');
  });

  it('labels every tab in the tab bar', () => {
    const form = buildBare();
    const labels = [...form.querySelectorAll('.settings__tab')].map((tab) => tab.textContent);
    expect(labels).toEqual([
      t('settings.tab.vehicle'),
      t('settings.tab.ramps'),
      t('menu.calibration'),
      t('settings.tab.level'),
      t('settings.general'),
    ]);
  });
});

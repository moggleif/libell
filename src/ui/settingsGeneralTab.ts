/**
 * Settings › General: how the app looks and sounds, and More: the rarely
 * tuned Fine-tuning fields and "Reset all settings".
 */
import { type AppearanceSetting, type LevelSettings, type ThemeSetting } from '../domain/settings';
import { clearLanguage, loadLanguage, saveLanguage, saveSettings } from '../data/settingsStore';
import { markReopenSettings } from './reopenSettings';
import { applyAppearance, applyTheme } from './theme';
import {
  createCheckboxField,
  createHint,
  createLengthField,
  createPlainNumberField,
  createSectionHeading,
  createSelectField,
  type DisplayUnit,
  type NumberField,
  type RawSettings,
  type SettingsFormContext,
  type SettingsFormState,
} from './settingsFields';
import { isLanguage, LANGUAGE_NAMES, LANGUAGES, t } from './i18n';

export interface GeneralTab {
  languageField: HTMLElement;
  /** Theme and Appearance: the wizard's "how it looks" step. */
  lookElements(): HTMLElement[];
  /** Chime and audio guidance: the wizard's "what it sounds like" step. */
  soundElements(): HTMLElement[];
  /** The whole tab, in order. */
  elements(): HTMLElement[];
  /** Stability and both response delays, in that order. */
  fineTuning: NumberField[];
  relabel(): void;
  read(raw: RawSettings): void;
  populate(settings: LevelSettings): void;
  /** Takes a sound choice made outside the form as the new state. */
  resyncSound(sound: Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>): void;
}

export interface GeneralTabActions {
  /** Converts the shown lengths to `unit`, which the state now holds. */
  unitChanged(previous: DisplayUnit): void;
  /** "Reset all settings". */
  resetAll(): void;
}

export function createGeneralTab(
  initial: LevelSettings,
  context: SettingsFormContext,
  actions: GeneralTabActions,
): GeneralTab {
  const language = createLanguageField(context.compact);
  const unit = createUnitField(initial.displayUnit, context.state, actions);
  const theme = createThemeField(initial.theme, context);
  const appearance = createAppearanceField(initial.appearance, context);
  const sound = createSoundFields(initial);
  const more = createMore(context, actions);

  const lookElements = (): HTMLElement[] => [theme.element, appearance.element];

  return {
    languageField: language.element,
    lookElements,
    soundElements: sound.elements,
    elements: () => [
      language.element,
      ...lookElements(),
      unit.element,
      sound.heading,
      ...sound.elements(),
      more.element,
    ],
    fineTuning: more.fields,
    relabel: () => {
      unit.caption.textContent = t('settings.unit');
      language.relabel();
      theme.caption.textContent = t('settings.theme');
      theme.relabelOptions();
      appearance.caption.textContent = t('settings.appearance');
      appearance.relabelOptions();
      sound.relabel();
      more.relabel();
    },
    read: (raw) => {
      raw.displayUnit = context.state.unit;
      raw.soundOnLevel = sound.chime.control.checked;
      raw.soundGuidance = sound.guidance.control.checked;
      raw.theme = theme.control.value;
      raw.appearance = appearance.control.value;
    },
    populate: (settings) => {
      unit.control.value = settings.displayUnit;
      theme.control.value = settings.theme;
      applyTheme(settings.theme);
      appearance.control.value = settings.appearance;
      applyAppearance(settings.appearance);
      sound.show(settings);
    },
    resyncSound: (prefs) => sound.show(prefs),
  };
}

/** mm or cm: updates the form state, then lets the form convert the
 * lengths it shows. */
function createUnitField(
  initial: DisplayUnit,
  state: SettingsFormState,
  actions: GeneralTabActions,
) {
  const unit = createSelectField<DisplayUnit>(
    [
      { value: 'mm', text: 'mm' },
      { value: 'cm', text: 'cm' },
    ],
    initial,
  );
  unit.control.addEventListener('change', () => {
    const previous = state.unit;
    state.unit = unit.value() === 'cm' ? 'cm' : 'mm';
    actions.unitChanged(previous);
  });
  return unit;
}

function createThemeField(initial: ThemeSetting, context: SettingsFormContext) {
  const theme = createSelectField<ThemeSetting>(
    [
      { value: 'system', label: 'theme.system' },
      { value: 'light', label: 'theme.light' },
      { value: 'dark', label: 'theme.dark' },
    ],
    initial,
  );
  // Live preview, and stored at once like every other change.
  theme.control.addEventListener('change', () => {
    applyTheme(theme.value());
    context.changed();
  });
  return theme;
}

/** A preset independent of light/dark. */
function createAppearanceField(initial: AppearanceSetting, context: SettingsFormContext) {
  const appearance = createSelectField<AppearanceSetting>(
    [
      { value: 'classic', label: 'appearance.classic' },
      { value: 'modern', label: 'appearance.modern' },
      { value: 'glossy', label: 'appearance.glossy' },
    ],
    initial,
  );
  // Live preview for colors, same as Theme — but this axis also decides
  // *structure* (tabs vs. pages, the main diagram, onboarding), which is
  // built once and never restructured in place. So outside the wizard the
  // choice is stored and the app reloads, as for Language. A wizard step
  // keeps it a preview only: the wizard decides when settings are saved.
  appearance.control.addEventListener('change', () => {
    applyAppearance(appearance.value());
    if (context.compact) {
      context.changed();
      return;
    }
    saveSettings(context.currentSettings());
    markReopenSettings();
    location.reload();
  });
  return appearance;
}

/**
 * The level chime and, a separate opt-in, audio guidance that
 * pulses rate/pitch while approaching level — under a Sound heading.
 */
function createSoundFields(initial: LevelSettings) {
  const heading = createSectionHeading();
  const chime = createCheckboxField(initial.soundOnLevel);
  const guidance = createCheckboxField(initial.soundGuidance);
  const guidanceHint = createHint();
  return {
    heading,
    chime,
    guidance,
    elements: (): HTMLElement[] => [chime.element, guidance.element, guidanceHint],
    show: (sound: Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>): void => {
      chime.control.checked = sound.soundOnLevel;
      guidance.control.checked = sound.soundGuidance;
    },
    relabel: (): void => {
      chime.caption.textContent = t('settings.sound');
      guidance.caption.textContent = t('settings.soundGuidance');
      guidanceHint.textContent = t('settings.soundGuidance.help');
      // Reuses the wizard's own step title: same name for the same grouping.
      heading.textContent = t('onboard.sound.h');
    },
  };
}

/**
 * A stored override, separate from `LevelSettings` (see `settingsStore`'s
 * loadLanguage/saveLanguage), so it applies — and reloads, since `t()`
 * isn't reactive — immediately on change. Every shipped language is
 * offered, each named in itself via `LANGUAGE_NAMES`, so a Swedish
 * reader can still find "Deutsch". Automatic stays pinned at the top.
 */
function createLanguageField(compact: boolean) {
  const stored = loadLanguage();
  const field = createSelectField<string>(
    [
      { value: 'auto', label: 'settings.language.auto' },
      ...LANGUAGES.map((lang) => ({ value: lang, text: LANGUAGE_NAMES[lang] })),
    ],
    isLanguage(stored) ? stored : 'auto',
  );
  field.control.addEventListener('change', () => {
    const value = field.value();
    if (isLanguage(value)) saveLanguage(value);
    else clearLanguage();
    // Back on Settings › General after the reload; the wizard's language
    // step keeps its own place instead.
    if (!compact) markReopenSettings();
    location.reload();
  });
  return {
    element: field.element,
    relabel: (): void => {
      field.caption.textContent = t('settings.language');
      field.relabelOptions();
    },
  };
}

/**
 * General › More: Fine-tuning, tuned rarely if ever, and "Reset all
 * settings". Always collapsed on open, never auto-expanded for a
 * customized value.
 * Tolerance is not here: it is a real choice about how level is level,
 * and has its place on the Level tab.
 */
function createMore(context: SettingsFormContext, actions: GeneralTabActions) {
  const { state } = context;
  const element = document.createElement('details');
  element.className = 'settings__advanced settings__more';
  const summary = document.createElement('summary');
  summary.className = 'settings__advanced-summary';
  const heading = createSectionHeading();

  const stability = createLengthField(
    'stabilityMm',
    { label: () => 'settings.stability', stepMm: 0.5, min: 0 },
    state,
  );
  const stabilityHint = createHint();

  // Response delay (ms): how long a reading must hold before the
  // shown figure/plan changes, and the shorter delay used only right after
  // a change while actively adjusting — see `src/domain/stability.ts`.
  // Always milliseconds, never unit-converted.
  const dwellRest = createPlainNumberField(
    'dwellRestMs',
    { label: 'settings.dwellRest', min: 50, step: 50 },
    state,
  );
  const dwellMotion = createPlainNumberField(
    'dwellMotionMs',
    { label: 'settings.dwellMotion', min: 20, step: 10 },
    state,
  );
  const dwellHint = createHint();

  // The one whole-form action. It keeps the appearance: that
  // decides the page's whole structure, and changing it reloads the app,
  // which would take the Undo toast with it.
  const resetAll = document.createElement('button');
  resetAll.type = 'button';
  resetAll.className = 'menu__action menu__action--secondary settings__reset-all';
  resetAll.addEventListener('click', () => actions.resetAll());

  element.append(
    summary,
    heading,
    stability.element,
    stabilityHint,
    dwellRest.element,
    dwellMotion.element,
    dwellHint,
    resetAll,
  );

  return {
    element,
    fields: [stability, dwellRest, dwellMotion],
    relabel: (): void => {
      heading.textContent = t('settings.fineTuning');
      stabilityHint.textContent = t('settings.stability.hint');
      dwellHint.textContent = t('settings.dwell.hint');
      summary.textContent = t('settings.more');
      resetAll.textContent = t('settings.resetAll');
    },
  };
}

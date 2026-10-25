/**
 * What every message is for, so a translator knows more than the English
 * words (#628): where it appears, what it does, and how much room it has.
 * The translate skill (`.claude/skills/translate`) reads this first, and the
 * parity test requires an entry for every key in `en.ts`.
 */
import type { MessageKey } from '../i18n';

/**
 * How much room the text has:
 * - `button`: a button, tab or link label; one short line.
 * - `label`: a field caption, option, heading or title; short.
 * - `card`: a wheel card, badge or other tight spot; a few words at most.
 * - `line`: one sentence; a hint, status line, toast, error or confirmation.
 * - `text`: a help, intro or about paragraph; may run several lines.
 * - `speech`: only spoken, or read by a screen reader; no visible room.
 */
export type Room = 'button' | 'label' | 'card' | 'line' | 'text' | 'speech';

export interface StringContext {
  room: Room;
  /** Screen › place › element. */
  where: string;
  /** The purpose a translation must keep. */
  does: string;
}

function ctx(room: Room, where: string, does: string): StringContext {
  return { room, where, does };
}

export const CONTEXT: Record<MessageKey, StringContext> = {
  'settings.shareVehicle': ctx(
    'button',
    'Settings › Vehicle: a quiet link-style button below the vehicle measurements.',
    "Makes a link that sends this vehicle's measurements and ramps to another phone.",
  ),
  'settings.wheelbase': ctx(
    'label',
    'Settings › Vehicle: caption of the wheelbase length field (motorhome); also a row in the shared-setup dialog.',
    'Distance between the front and rear axles of a motorhome.',
  ),
  'settings.trackFront': ctx(
    'label',
    'Settings › Vehicle: caption of the front track width field (motorhome); also a row in the shared-setup dialog.',
    'Distance between the left and right front wheels.',
  ),
  'settings.trackRear': ctx(
    'label',
    'Settings › Vehicle: caption of the rear track width field (motorhome); also a row in the shared-setup dialog.',
    'Distance between the left and right rear wheels.',
  ),
  'settings.tolerance': ctx(
    'label',
    'Settings › Level: caption of the tolerance length field.',
    'How far from perfectly level, as a length, still counts as level.',
  ),
  'settings.stability': ctx(
    'label',
    'Settings › General › More › Fine-tuning: caption of the stability length field.',
    'Amount of smoothing of small sensor jitter, as a length.',
  ),
  'settings.dwellRest': ctx(
    'label',
    'Settings › General › More › Fine-tuning: caption of a number field in milliseconds.',
    'How long a reading must hold before the shown figure changes while standing still. Keep "(ms)".',
  ),
  'settings.dwellMotion': ctx(
    'label',
    'Settings › General › More › Fine-tuning: caption of a number field in milliseconds.',
    'The shorter response delay used right after a change while you are adjusting. Keep "(ms)".',
  ),
  'settings.dwell.hint': ctx(
    'line',
    'Settings › General › More › Fine-tuning: hint below the two response delay fields.',
    'Explains the response delay: how long a reading must stay before the number on screen changes.',
  ),
  'settings.vehicle': ctx(
    'label',
    'Settings › Vehicle: caption of the vehicle type select; also a row in the shared-setup dialog.',
    'The kind of vehicle (motorhome or caravan). Fordon = vehicle.',
  ),
  'vehicle.motorhome': ctx(
    'label',
    'Settings › Vehicle: option of the vehicle type select; also onboarding choice and Help picture caption.',
    'A motorhome / RV (Swedish husbil): a self-driven vehicle with four wheels.',
  ),
  'vehicle.caravan': ctx(
    'label',
    'Settings › Vehicle: option of the vehicle type select; also onboarding choice and Help picture caption.',
    'A towed caravan / travel trailer (Swedish husvagn) with a jockey wheel in front.',
  ),
  'settings.axleToJockey': ctx(
    'label',
    'Settings › Vehicle: caption of the length field for a caravan; also a row in the shared-setup dialog.',
    "Distance from the caravan's axle to its jockey wheel (stödhjul). Replaces Wheelbase for a caravan.",
  ),
  'settings.rearAxle': ctx(
    'label',
    'Settings › Vehicle: caption of the axle type select for a motorhome; also a shared-setup dialog row.',
    "Whether the motorhome's rear axle is single or tandem.",
  ),
  'settings.axle': ctx(
    'label',
    'Settings › Vehicle: caption of the axle type select for a caravan; also a shared-setup dialog row.',
    'Whether the caravan has a single axle or a tandem pair.',
  ),
  'axle.single': ctx(
    'label',
    'Settings › Vehicle: option of the (rear) axle select.',
    'One axle (one wheel per side).',
  ),
  'axle.boggie': ctx(
    'label',
    'Settings › Vehicle: option of the (rear) axle select.',
    'A tandem axle pair, two wheels close together per side (Swedish boggie).',
  ),
  'settings.track': ctx(
    'label',
    'Settings › Vehicle: caption of the track width field for a caravan.',
    "Distance between the caravan's left and right wheels.",
  ),
  'settings.measureHint': ctx(
    'line',
    'Settings › Vehicle: hint below the measurement fields for a motorhome.',
    'Says the measurements are in the vehicle registration document and a few cm error does not matter.',
  ),
  'settings.measureHint.caravan': ctx(
    'line',
    'Settings › Vehicle: hint below the measurement fields for a caravan.',
    'Tells the user to measure from the axle to the jockey wheel (stödhjul); a few cm error does not matter.',
  ),
  'settings.measureHint.boggie': ctx(
    'line',
    'Settings › Vehicle: sentence appended to the measurement hint when a tandem axle is chosen.',
    'With a tandem axle (boggie), measure to the middle of the axle pair.',
  ),
  'settings.steps': ctx(
    'label',
    'Settings › Ramps: heading over the custom step-height editor; also a row in the shared-setup dialog.',
    "The heights of each step of the user's ramps (klossar, levelling blocks).",
  ),
  'settings.steps.add': ctx(
    'button',
    'Settings › Ramps: button beside the new step height field, shown as "+ Add step".',
    'Adds the typed height as one more step of the custom ramp (kloss).',
  ),
  'settings.steps.new': ctx(
    'speech',
    'Settings › Ramps: screen-reader label of the new step height input.',
    'Names the field for a new step height. {unit} is the length unit, e.g. mm, cm or in.',
  ),
  'settings.steps.remove': ctx(
    'speech',
    'Settings › Ramps: screen-reader label of the minus button on a step height chip.',
    'Removes that step height. {value} is the height as shown, e.g. "40".',
  ),
  'settings.ramp': ctx(
    'label',
    'Settings › Ramps (compact layout): caption of the ready-made ramp select.',
    'Pick a ready-made commercial ramp model (kloss, levelling block), which fills in its step heights.',
  ),
  'settings.ramp.custom': ctx(
    'label',
    'Settings › Ramps: first row of the ramp catalogue and name of the selection; also a select option.',
    "The user's own set of step heights instead of a catalogue model.",
  ),
  'settings.ramp.stepless': ctx(
    'label',
    'Settings › Ramps: row of the ramp catalogue and name of the selection; also a select option.',
    'A stepless wedge (steglös kil) of your own, defined only by its max height. Fixed app term.',
  ),
  'settings.ramp.steplessModel': ctx(
    'label',
    'Settings › Ramps: option text for a stepless catalogue model in the ramp select.',
    '{name} is the model name, {max} its max height in mm. Stepless = steglös kil.',
  ),
  'settings.stepless.max': ctx(
    'label',
    'Shared-setup dialog (incoming vehicle link): row caption shown when the ramp is a stepless wedge.',
    'Max height of the stepless wedge (steglös kil).',
  ),
  'settings.stepless.maxHeading': ctx(
    'label',
    "Settings › Ramps: heading over a stepless wedge's height in the Selected summary and catalogue rows.",
    'The maximum height a stepless wedge (steglös kil) can lift.',
  ),
  'settings.stepless.set': ctx(
    'button',
    'Settings › Ramps: button beside the max height field when a stepless wedge is chosen.',
    "Saves the typed value as the stepless wedge's max height.",
  ),
  'settings.stepless.new': ctx(
    'speech',
    'Settings › Ramps: screen-reader label of the max height input for a stepless wedge.',
    "Names the field for the wedge's max height. {unit} is the length unit, e.g. mm, cm or in.",
  ),
  'settings.rampCount': ctx(
    'label',
    'Settings › Ramps: caption of the number-of-ramps select (motorhome only); also a shared-setup row.',
    'How many ramps (klossar) the user owns; the plan never uses more.',
  ),
  'settings.drain': ctx(
    'label',
    'Settings › Level: caption of the drain side select; also a row in the shared-setup dialog.',
    "Where the vehicle's waste-water outlet sits.",
  ),
  'settings.rampHint': ctx(
    'line',
    'Settings, flat one-page layout: hint below the number of ramps (motorhome only).',
    'The app decides which wheels the ramps (klossar) go under to help most.',
  ),
  'settings.drainHint': ctx(
    'line',
    'Settings › Level: hint below the drain side select.',
    'Within the tolerance the chosen side is left lowest so water drains away.',
  ),
  'settings.section.vehicle': ctx(
    'label',
    'Settings, flat one-page layout: section heading over the vehicle fields.',
    'Groups the vehicle type and its measurements.',
  ),
  'settings.section.ramps': ctx(
    'label',
    'Settings, flat one-page layout: section heading over the ramp fields.',
    "Groups the ramp (kloss) settings. Use the app's word for levelling blocks.",
  ),
  'settings.general': ctx(
    'button',
    'Settings: General tab label and menu entry; also a section heading.',
    'Opens the general settings: language, unit, theme, appearance, sound, fine-tuning.',
  ),
  'settings.language': ctx(
    'label',
    'Settings › General: caption of the language select; also an onboarding step title.',
    "Chooses the app's language.",
  ),
  'settings.language.auto': ctx(
    'label',
    'Settings › General: first option of the language select.',
    "Use the phone's own language.",
  ),
  'settings.tolerance.hint': ctx(
    'line',
    'Settings › Level: hint below the tolerance field.',
    'Explains tolerance: how close to perfectly level counts as level.',
  ),
  'settings.stability.hint': ctx(
    'line',
    'Settings › General › More › Fine-tuning: hint below the stability field.',
    'Explains stability: smooths small sensor jitter so the numbers do not flicker.',
  ),
  'drain.none': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'No drain to consider, or it does not matter which side is lowest.',
  ),
  'drain.left': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain on the left side, in the middle lengthwise.',
  ),
  'drain.right': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain on the right side, in the middle lengthwise.',
  ),
  'drain.front': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the front, in the middle crosswise.',
  ),
  'drain.rear': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the rear, in the middle crosswise.',
  ),
  'drain.frontLeft': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the front left corner.',
  ),
  'drain.frontRight': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the front right corner.',
  ),
  'drain.rearLeft': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the rear left corner.',
  ),
  'drain.rearRight': ctx(
    'label',
    'Settings › Level: option of the drain side select; also shown in the shared-setup dialog.',
    'Drain at the rear right corner.',
  ),
  'settings.unit': ctx(
    'label',
    'Settings › General: caption of the length unit select (options mm, cm, inches).',
    'Chooses the unit lengths are shown in.',
  ),
  'settings.unitInches': ctx(
    'label',
    'Settings › General: the inches option of the length unit select.',
    'Inches; keep the abbreviation "(in)", which is the unit symbol shown elsewhere.',
  ),
  'settings.theme': ctx(
    'label',
    'Settings › General: caption of the theme select.',
    'Chooses light or dark colours.',
  ),
  'theme.system': ctx(
    'label',
    'Settings › General: option of the theme select.',
    "Use the phone's own light/dark setting.",
  ),
  'theme.light': ctx(
    'label',
    'Settings › General: option of the theme select.',
    'Light colour theme.',
  ),
  'theme.dark': ctx(
    'label',
    'Settings › General: option of the theme select.',
    'Dark colour theme.',
  ),
  'settings.appearance': ctx(
    'label',
    'Settings › General: caption of the appearance select; also an onboarding step title.',
    'Chooses the visual style of the app (Classic, Modern, Glossy).',
  ),
  'appearance.classic': ctx(
    'label',
    'Settings › General and onboarding: option of the appearance select.',
    'Name of the classic visual style.',
  ),
  'appearance.modern': ctx(
    'label',
    'Settings › General and onboarding: option of the appearance select.',
    'Name of the modern visual style.',
  ),
  'appearance.glossy': ctx(
    'label',
    'Settings › General and onboarding: option of the appearance select.',
    'Name of the glossy, shiny visual style.',
  ),
  'settings.sound': ctx(
    'label',
    'Settings › General › Sound: caption of a switch.',
    'Plays a chime when the vehicle becomes level.',
  ),
  'settings.soundGuidance': ctx(
    'label',
    'Settings › General › Sound: caption of a switch.',
    'Turns on a continuous beep that guides toward level.',
  ),
  'settings.soundGuidance.help': ctx(
    'line',
    'Settings › General › Sound: hint below the continuous audio guidance switch.',
    'Explains that the beep gets faster and higher-pitched as you get closer to level.',
  ),
  'settings.soundSpeech': ctx(
    'label',
    'Settings › General › Sound: caption of a switch.',
    'Turns on a voice that reads the guidance aloud.',
  ),
  'settings.soundSpeech.help': ctx(
    'line',
    'Settings › General › Sound: hint below the spoken guidance switch.',
    "Explains the voice says which wheel and how much; the quoted example should match the voice's own words.",
  ),
  'settings.soundSpeech.unavailable': ctx(
    'line',
    'Settings › General › Sound: hint below the spoken guidance switch when no offline voice exists.',
    'Says the phone lacks an offline voice in this language; name your own language in place of English.',
  ),
  'settings.undo': ctx(
    'button',
    'Settings: action button on the toast shown after a change is auto-saved.',
    'Reverts the change just saved.',
  ),
  'settings.saved': ctx(
    'card',
    'Settings: toast text shown after a change is auto-saved, beside the Undo button.',
    'Confirms the setting was saved. One word.',
  ),
  'settings.more': ctx(
    'button',
    'Settings › General: summary of a fold-out; also the fold-out on the Calibration page.',
    'Opens more, less common options (fine-tuning, reset; extra calibration actions).',
  ),
  'settings.fineTuning': ctx(
    'label',
    'Settings › General › More: heading over the stability and response delay fields.',
    'Groups the advanced fine-tuning settings.',
  ),
  'settings.resetAll': ctx(
    'button',
    'Settings › General › More: button at the bottom.',
    'Restores every setting to its default value.',
  ),
  'settings.err.positive': ctx(
    'line',
    'Settings: error below a number field or the step height field when the value is not above 0.',
    'Asks for a number above 0 and says the old value is still in use.',
  ),
  'settings.err.notNegative': ctx(
    'line',
    'Settings: error below a number field that allows 0 when the value is negative.',
    'Asks for 0 or more and says the old value is still in use.',
  ),
  'settings.err.range': ctx(
    'line',
    'Settings: error below a number field when the value is out of range.',
    '{min} and {max} are the allowed limits with the unit; the old value is still in use.',
  ),
  'settings.tab.vehicle': ctx(
    'button',
    'Settings: Vehicle tab label and menu entry; also inside Help\'s "Open …" button.',
    'Opens the vehicle settings: type, measurements, vehicles. Fordon = vehicle.',
  ),
  'settings.tab.ramps': ctx(
    'button',
    'Settings: Ramps tab label and menu entry; also an onboarding step title and Help heading.',
    'Opens the ramp (kloss) settings. Kloss = levelling block, never "ramp" in Swedish.',
  ),
  'settings.tab.level': ctx(
    'button',
    'Settings: Level tab label and menu entry; also a section heading and in Help\'s "Open …" button.',
    'Opens the level settings: tolerance, drain side and saved targets (mål).',
  ),
  'settings.klossar.brandAll': ctx(
    'button',
    'Settings › Ramps › Change ramp: first chip of the brand filter row.',
    'Shows ramp models of all brands.',
  ),
  'settings.klossar.changeRamp': ctx(
    'button',
    'Settings › Ramps: summary of the fold-out that holds the ramp catalogue.',
    'Opens the catalogue to pick another ramp (kloss) model.',
  ),
  'settings.rampCountHint': ctx(
    'line',
    'Settings › Ramps: hint below the number of ramps select (motorhome only).',
    'The app puts the ramps (klossar) under the wheels where they help most.',
  ),
  'settings.klossar.selected': ctx(
    'card',
    "Settings › Ramps: small label before the chosen ramp's name in the summary.",
    'Marks the ramp currently in use, read as "Selected: <model>".',
  ),
  'settings.klossar.stepsHeading': ctx(
    'label',
    'Settings › Ramps: heading over the chosen ramp\'s step heights grid, followed by "(unit)".',
    'The heights of each step of the chosen ramp (kloss).',
  ),
  'targets.normal': ctx(
    'label',
    'Settings › Level › targets: the first, fixed row; also the target badge on the level screen.',
    'The default target: true level. Mål = a saved target.',
  ),
  'targets.name.placeholder': ctx(
    'label',
    'Settings › Level › targets: placeholder in the name field for a new target.',
    'Asks for a name and gives an example of a target, e.g. a shower drain tilt.',
  ),
  'targets.name.label': ctx(
    'speech',
    'Settings › Level › targets: screen-reader label of the new target name field.',
    "Names the field for the new target's (mål) name.",
  ),
  'targets.defaultName': ctx(
    'label',
    'Settings › Level › targets: suggested name filled into the name field for a new target.',
    'Default target (mål) name; {n} is a number making it unique.',
  ),
  'targets.add': ctx(
    'button',
    'Settings › Level › targets: button below the list of targets.',
    "Saves the vehicle's current tilt as a new target (mål) to level toward later.",
  ),
  'targets.delete': ctx(
    'speech',
    'Settings › Level › targets: screen-reader label of the cross on a target row.',
    "Deletes that saved target. {name} is the target's name.",
  ),
  'targets.warn.tooSteep': ctx(
    'line',
    'Settings › Level › targets: warning after saving a target steeper than 15 degrees.',
    'Saved, but unusually steep; tells how to delete it with the cross and save again.',
  ),
  'targets.badge': ctx(
    'card',
    'Level screen: small badge naming the active target; tapping opens Settings › Level.',
    "Shows which target (mål) the leveling works toward. {name} is the target's name.",
  ),
  'vehicles.title': ctx(
    'label',
    "Settings › Vehicle: heading over the list of the user's vehicles.",
    'The list of saved vehicles (fordon) to switch between.',
  ),
  'vehicles.defaultName': ctx(
    'label',
    'Settings › Vehicle list and level screen badge: name shown for a vehicle without a name.',
    "Default name of the user's first vehicle (fordon).",
  ),
  'vehicles.numbered': ctx(
    'label',
    'Settings › Vehicle: suggested name filled into the name field for a new vehicle.',
    'Default vehicle name; {n} is a number making it unique.',
  ),
  'vehicles.name.placeholder': ctx(
    'label',
    'Settings › Vehicle: placeholder in the new vehicle name field.',
    'Asks for a name with an example vehicle name, e.g. "Caravan".',
  ),
  'vehicles.name.label': ctx(
    'speech',
    'Settings › Vehicle: screen-reader label of the new vehicle name field.',
    "Names the field for the vehicle's (fordon) name.",
  ),
  'vehicles.add': ctx(
    'button',
    'Settings › Vehicle: button below the list of vehicles.',
    'Starts adding another vehicle (fordon) with its own measurements.',
  ),
  'namePrompt.save': ctx(
    'button',
    'Settings › Vehicle / Level: button beside the name field for a new vehicle or target.',
    'Saves the typed name.',
  ),
  'namePrompt.cancel': ctx(
    'button',
    'Settings › Vehicle / Level: button beside the name field for a new vehicle or target.',
    'Closes the name field without saving.',
  ),
  'choice.rename': ctx(
    'speech',
    'Settings › Vehicle / Level lists: screen-reader label of the in-place name field on the chosen row.',
    'Renames that vehicle or target. {name} is its current name.',
  ),
  'vehicles.badge': ctx(
    'card',
    'Level screen: small badge naming the active vehicle when there are several; tapping opens Settings.',
    "Shows which vehicle (fordon) is in use. {name} is the vehicle's name.",
  ),
  'vehicles.delete': ctx(
    'speech',
    'Settings › Vehicle list: screen-reader label of the cross on a vehicle row.',
    "Removes that vehicle. {name} is the vehicle's name.",
  ),
  'vehicles.remove.confirm': ctx(
    'line',
    "Settings › Vehicle list: confirmation question after tapping a vehicle's cross.",
    'Asks to remove {name} (the vehicle) along with its vehicle zero, targets (mål) and Sensorbox.',
  ),
  'vehicles.remove.yes': ctx(
    'button',
    'Settings › Vehicle list: button under the removal question.',
    'Confirms removing the vehicle.',
  ),
  'vehicles.hint': ctx(
    'text',
    'Settings › Vehicle: hint below the heading of the vehicles list.',
    'Says what belongs to each vehicle (measurements, ramps, zero, targets, Sensorbox) and that phone calibration is shared.',
  ),
  'setup.incoming.h': ctx(
    'label',
    'Shared-setup dialog (opened from a shared vehicle link): the dialog heading.',
    'Title: a vehicle setup (measurements) shared by link has arrived. fordon = vehicle.',
  ),
  'setup.incoming.intro': ctx(
    'line',
    'Shared-setup dialog: the sentence under the heading, above the list of shared measurements.',
    'Says someone shared these vehicle measurements; ends with a colon because the list follows.',
  ),
  'setup.incoming.reminder': ctx(
    'line',
    'Shared-setup dialog: the note below the measurement list.',
    "Calibration is never shared; this phone must still be calibrated itself (Kalibrera = the phone's own sensor).",
  ),
  'setup.incoming.apply': ctx(
    'button',
    'Shared-setup dialog: the secondary button that overwrites the current vehicle.',
    'Replaces the measurements of the vehicle in use with the shared ones. fordon = vehicle.',
  ),
  'setup.incoming.dismiss': ctx(
    'button',
    'Shared-setup dialog: the secondary button that closes it without changes.',
    'Declines for now; nothing is saved.',
  ),
  'setup.incoming.invalid': ctx(
    'line',
    'Toast shown on start when a shared vehicle-setup link is broken.',
    'Error: the link could not be read and no settings were changed.',
  ),
  'lamp.setup': ctx(
    'card',
    'Main screen › top bar: warning lamp chip (with ⚠) shown until vehicle measurements are saved.',
    'Short lamp label: measurements missing. Keep the ⚠. Also quoted in the onboarding note. Tap opens Settings.',
  ),
  'lamp.setup.title': ctx(
    'speech',
    'Main screen › top bar: tooltip/aria label of the ⚠ Measurements lamp.',
    'Explains the lamp: vehicle measurements never saved; tapping opens Settings.',
  ),
  'lamp.calibrate': ctx(
    'card',
    'Main screen › top bar: warning lamp chip (with ⚠) while the phone is not calibrated.',
    "Short lamp label; Kalibrera = calibrate the phone's own sensor. Keep the ⚠. Quoted in the onboarding note.",
  ),
  'lamp.zero': ctx(
    'card',
    'Main screen › top bar: warning lamp chip (with ⚠) while the vehicle has no zero.',
    "Short lamp label; Nollställ = set the vehicle's level zero. Keep the ⚠. Quoted in onboarding.",
  ),
  'lamp.calibrate.title': ctx(
    'speech',
    'Main screen › top bar: tooltip/aria label of the ⚠ Calibrate lamp.',
    'Phone not calibrated; tap opens the “Calibrate and zero” page (quote that menu name exactly as translated).',
  ),
  'lamp.zero.title': ctx(
    'speech',
    'Main screen › top bar: tooltip/aria label of the ⚠ Zero lamp.',
    'Vehicle not zeroed; tap opens the “Calibrate and zero” page (quote that menu name exactly as translated).',
  ),
  'lamp.calibrate.title.sensor': ctx(
    'speech',
    'Main screen › top bar: tooltip/aria label of the calibration lamp when a Sensorbox is in use.',
    "The Sensorbox (the box) has no zero; tapping opens the box's page. Nollställ = set level zero.",
  ),
  'calibration.intro': ctx(
    'text',
    'Calibrate and zero › Calibrate the phone card: the intro paragraph.',
    'Explains phone calibration on a known-level surface; names the Calibrate now button (keep it matching). Kalibrera = phone sensor only.',
  ),
  'calibration.status': ctx(
    'line',
    'Calibrate and zero › Calibrate the phone card: status line under the buttons.',
    'Shows the stored phone calibration; {pitch} = front/back angle, {roll} = side/side angle, e.g. +0.3°.',
  ),
  'calibration.status.none': ctx(
    'line',
    'Calibrate and zero › Calibrate the phone card: status line when there is no calibration.',
    'The phone is uncalibrated and raw sensor values are used.',
  ),
  'calibration.now': ctx(
    'button',
    'Calibrate and zero › Calibrate the phone card: the main capture button.',
    "Calibrates the phone's own sensor now (Kalibrera). Also quoted as {now} in the check-none message.",
  ),
  'calibration.step.phone.done': ctx(
    'label',
    'Calibrate and zero › phone step card: card title once done, followed by an age like “(today)”.',
    "Says the phone is calibrated (Kalibrera = the phone's own sensor).",
  ),
  'calibration.step.phone.hint': ctx(
    'line',
    'Calibrate and zero › phone step card: short hint above the Calibrate now button.',
    'Instruction: lay the phone on a flat surface before calibrating.',
  ),
  'calibration.step.flipLink': ctx(
    'button',
    'Calibrate and zero › phone step card: text link that opens flip calibration.',
    'Offers flip calibration when no flat surface is at hand (turn the phone half a turn).',
  ),
  'calibration.step.vehicle.done': ctx(
    'label',
    'Calibrate and zero › vehicle step card: card title once done, followed by an age like “(today)”.',
    "Says the vehicle zero is set (Nollställ = vehicle's level zero). Past participle.",
  ),
  'calibration.step.vehicle.hint': ctx(
    'line',
    'Calibrate and zero › vehicle step card: hint above the Zero now button.',
    'Instruction: level the vehicle with a spirit level, put the phone in its usual spot.',
  ),
  'calibration.step.vehicle.now': ctx(
    'button',
    'Calibrate and zero › vehicle step card: the main capture button.',
    "Sets the vehicle's level zero now (Nollställ, not Kalibrera).",
  ),
  'calibration.clear': ctx(
    'button',
    'Calibrate and zero › Calibrate the phone card: secondary button.',
    'Deletes the phone calibration (Kalibrera = phone sensor).',
  ),
  'calibration.err.notRunning': ctx(
    'line',
    'Calibrate and zero: status/error line after tapping a capture or check button.',
    'The tilt sensor has not started; tells the user to tap Start on the main screen first (keep Start matching).',
  ),
  'calibration.warn.notFlat': ctx(
    'line',
    'Calibrate and zero › phone card: warning status line with an Undo button after calibrating.',
    'Saved, but tilt over 15° so likely wrong; refers to the Undo button (keep matching). Kalibrera = phone sensor.',
  ),
  'calibration.undo': ctx(
    'button',
    'Calibrate and zero and Sensorbox page: Undo button shown beside a steep-capture warning.',
    'Reverts the just-saved calibration or zero.',
  ),
  'calibration.sensor.h': ctx(
    'label',
    'Calibrate and zero › phone card heading (also an onboarding step title).',
    "Heading leads with the verb: Kalibrera telefonen = calibrate the phone's own sensor.",
  ),
  'calibration.vehicle.h': ctx(
    'label',
    'Calibrate and zero › vehicle card heading.',
    "Heading leads with the verb: Nollställ fordonet = set the vehicle's level zero.",
  ),
  'calibration.vehicle.intro': ctx(
    'text',
    'Calibrate and zero › Zero the vehicle card: the intro paragraph.',
    'Explains calibration is about the phone, not the spot; zero once with the vehicle levelled. Keep Kalibrera vs Nollställ distinct.',
  ),
  'calibration.vehicle.now': ctx(
    'button',
    'Calibrate and zero › Zero the vehicle card: the main capture button.',
    "Sets the vehicle's level zero now (Nollställ). Also quoted as {now} in the vehicle check-none message.",
  ),
  'calibration.vehicle.clear': ctx(
    'button',
    'Calibrate and zero › Zero the vehicle card: secondary button.',
    'Deletes the stored vehicle zero (nolläge).',
  ),
  'calibration.vehicle.status': ctx(
    'line',
    'Calibrate and zero › Zero the vehicle card: status line.',
    'Shows the stored vehicle zero; {pitch} = front/back angle, {roll} = side/side angle, e.g. +0.3°.',
  ),
  'calibration.vehicle.status.none': ctx(
    'line',
    'Calibrate and zero › Zero the vehicle card: status line when no zero is set.',
    "No vehicle zero: the phone's resting place is treated as level.",
  ),
  'calibration.vehicle.warn.notFlat': ctx(
    'line',
    'Calibrate and zero / Sensorbox page: warning line with Undo after zeroing.',
    'Zero saved but tilt over 15°; refers to the Undo button (keep matching). Nollställ = vehicle zero.',
  ),
  'calibration.age.today': ctx(
    'card',
    'Calibrate and zero: appended after a status or step title, e.g. “Phone calibrated (today)”.',
    'Age of the calibration or zero: done today. Keep the parentheses.',
  ),
  'calibration.age.days': ctx(
    'card',
    'Calibrate and zero: appended after a status or step title, e.g. “Zeroed (3 days ago)”.',
    'Age of the calibration or zero; {n} = number of days. Keep the parentheses.',
  ),
  'calibration.check': ctx(
    'button',
    'Calibrate and zero › phone and vehicle cards: secondary Check button.',
    'Compares the current reading with the stored calibration or zero without changing it.',
  ),
  'calibration.check.good': ctx(
    'line',
    'Calibrate and zero: status line after tapping Check.',
    'The stored calibration/zero is still fine; {off} = deviation in degrees (number only, ° follows).',
  ),
  'calibration.check.off': ctx(
    'line',
    'Calibrate and zero › phone card: status line after tapping Check.',
    'The phone calibration is off by {off} degrees; suggests calibrating again (Kalibrera).',
  ),
  'calibration.vehicle.check.off': ctx(
    'line',
    'Calibrate and zero › vehicle card: status line after tapping Check.',
    'The vehicle zero is off by {off} degrees; suggests zeroing again (Nollställ).',
  ),
  'calibration.check.none': ctx(
    'line',
    'Calibrate and zero › phone card: status line after Check with no calibration.',
    'Nothing to check yet; {now} = the Calibrate now button label, keep the quotes.',
  ),
  'calibration.vehicle.check.none': ctx(
    'line',
    'Calibrate and zero › vehicle card: status line after Check with no zero.',
    'Nothing to check yet; {now} = the Zero now button label, keep the quotes.',
  ),
  'calibration.flip.intro': ctx(
    'text',
    'Calibrate and zero › phone card › flip calibration: intro paragraph.',
    'Explains flip calibration: capture, turn phone 180° on the same spot, capture again; surface tilt cancels out.',
  ),
  'calibration.flip.start': ctx(
    'button',
    'Calibrate and zero › flip calibration: the start button.',
    'Starts flip calibration (Kalibrera = phone sensor; vända = turn half a turn).',
  ),
  'calibration.flip.rotate': ctx(
    'line',
    'Calibrate and zero › flip calibration: status line after the first capture.',
    'Tells the user to turn the phone 180° in place and tap Capture (keep matching the Capture button).',
  ),
  'calibration.flip.capture': ctx(
    'button',
    'Calibrate and zero › flip calibration: the button label for the second capture.',
    'Takes the second reading (Fånga = capture a measurement).',
  ),
  'calibration.flip.done': ctx(
    'line',
    'Calibrate and zero › flip calibration: status line when finished.',
    "Success; {surface} = the surface's own tilt in degrees, which was removed from the result.",
  ),
  'calibration.flip.warn.moved': ctx(
    'line',
    'Calibrate and zero › flip calibration: warning status line with an Undo button.',
    'Saved, but the two captures differ over 15°, so the phone likely moved; refers to Undo (keep matching).',
  ),
  'calibration.pill.notDone': ctx(
    'card',
    'Calibrate and zero › phone card: small status pill in the card corner (upper case).',
    'Phone calibration still pending. Very short, upper case.',
  ),
  'calibration.pill.done': ctx(
    'card',
    'Calibrate and zero › phone and vehicle cards: small status pill (upper case).',
    'Step completed. Very short, upper case.',
  ),
  'calibration.pill.none': ctx(
    'card',
    'Calibrate and zero › vehicle card: small status pill (upper case).',
    'No vehicle zero set (optional, so not “pending”). Very short, upper case; Swedish INGET agrees with nolläge.',
  ),
  'setup.incoming.addNew': ctx(
    'button',
    'Shared-setup dialog: the primary (default) button.',
    'Saves the shared measurements as an additional vehicle, keeping the current one. fordon = vehicle.',
  ),
  'zeroTrim.title': ctx(
    'label',
    'Calibrate and zero › Zero the vehicle card (and Sensorbox page): fine-tune row heading.',
    'Fine-tune the vehicle zero (nolläge) in small steps.',
  ),
  'zeroTrim.hint': ctx(
    'line',
    'Calibrate and zero / Sensorbox page › Fine-tune the zero: hint under the heading.',
    'Each tap shifts the zero by 0.1° so the app wants that side higher. Use a decimal comma where usual.',
  ),
  'zeroTrim.left': ctx(
    'button',
    'Fine-tune the zero row: one of four small trim buttons.',
    'Nudges the zero so the left side ends higher. Very short.',
  ),
  'zeroTrim.right': ctx(
    'button',
    'Fine-tune the zero row: one of four small trim buttons.',
    'Nudges the zero so the right side ends higher. Very short.',
  ),
  'zeroTrim.front': ctx(
    'button',
    'Fine-tune the zero row: one of four small trim buttons.',
    'Nudges the zero so the front ends higher. Very short.',
  ),
  'zeroTrim.back': ctx(
    'button',
    'Fine-tune the zero row: one of four small trim buttons.',
    'Nudges the zero so the back ends higher. Very short.',
  ),
  'zeroTrim.side.left': ctx(
    'card',
    'Fine-tune the zero row: a part of the Fine-tuned summary, e.g. “Left +0.2°”.',
    'Side name before a signed angle in the {trim} summary.',
  ),
  'zeroTrim.side.right': ctx(
    'card',
    'Fine-tune the zero row: a part of the Fine-tuned summary, e.g. “Right +0.2°”.',
    'Side name before a signed angle in the {trim} summary.',
  ),
  'zeroTrim.side.front': ctx(
    'card',
    'Fine-tune the zero row: a part of the Fine-tuned summary, e.g. “Front +0.1°”.',
    'Side name before a signed angle in the {trim} summary.',
  ),
  'zeroTrim.side.back': ctx(
    'card',
    'Fine-tune the zero row: a part of the Fine-tuned summary, e.g. “Back +0.1°”.',
    'Side name before a signed angle in the {trim} summary.',
  ),
  'zeroTrim.total': ctx(
    'line',
    'Fine-tune the zero row: summary line of the current trim.',
    '{trim} = side names with signed angles joined by “ · ”, e.g. “Left +0.2° · Front +0.1°”.',
  ),
  'zeroTrim.none': ctx(
    'line',
    'Fine-tune the zero row: summary line when no trim is applied.',
    'The zero has not been fine-tuned.',
  ),
  'zeroTrim.reset': ctx(
    'button',
    'Fine-tune the zero row: secondary button.',
    'Removes all fine-tuning, back to the plain vehicle zero.',
  ),
  'tilt.frontBack': ctx(
    'card',
    'Level screen tilt readout and Sensorbox status: label before an angle, e.g. “Front/back +0.3°”.',
    'The lengthwise (pitch) axis; Swedish Längsled. Keep very short.',
  ),
  'tilt.sideSide': ctx(
    'card',
    'Level screen tilt readout and Sensorbox status: label before an angle, e.g. “Side/side −1.3°”.',
    'The crosswise (roll) axis; Swedish Sidled. Keep very short.',
  ),
  'pose.layFlat': ctx(
    'line',
    'Level screen › pose overlay: main message (also spoken) when the phone is not lying flat.',
    'Tells the user to lay the phone flat; guidance is paused meanwhile.',
  ),
  'pose.sensorHint': ctx(
    'line',
    'Level screen › pose overlay: hint under the message when the Sensorbox is in a wrong pose.',
    '“It” = the Sensorbox: it measures correctly only lying flat, top side up.',
  ),
  'pose.openSensorPage': ctx(
    'button',
    'Level screen pose/stale overlays and Calibrate and zero: button to the Sensorbox page.',
    "Opens the Sensorbox's own page (the box = the Sensorbox).",
  ),
  'pose.sensorExtreme': ctx(
    'line',
    'Level screen › pose overlay: main message (also spoken) for the Sensorbox.',
    'The Sensorbox is tilted too far to be a real mounting; guidance paused.',
  ),
  'pose.sensorUpsideDown': ctx(
    'line',
    'Level screen › pose overlay: main message (also spoken) for the Sensorbox.',
    'The Sensorbox appears to be mounted upside down; guidance paused.',
  ),
  'pose.sensorNotUpright': ctx(
    'line',
    'Level screen › pose overlay: main message (also spoken) for an upright-type Sensorbox.',
    'A Sensorbox built to stand upright is lying down; guidance paused.',
  ),
  'pose.sensorHintUpright': ctx(
    'line',
    'Level screen › pose overlay: hint under the message for an upright-type Sensorbox.',
    '“It” = the Sensorbox: it measures correctly only standing upright.',
  ),
  'calibration.external.h': ctx(
    'label',
    'Calibrate and zero (Sensorbox in use) › box zero card: the heading.',
    "Heading leads with the verb: Nollställ fordonet = set the vehicle's level zero, here with the Sensorbox.",
  ),
  'calibration.external.intro': ctx(
    'line',
    'Calibrate and zero (Sensorbox in use) › box zero card: intro under the heading.',
    'Level the vehicle once with a spirit level, then zero (Nollställ).',
  ),
  'calibration.external.phoneHidden': ctx(
    'line',
    'Calibrate and zero (Sensorbox in use): note under the box zero card.',
    'Phone calibration is hidden while the Sensorbox measures; {disconnect} = the Disconnect button label, keep quotes.',
  ),
  'calibration.external.working': ctx(
    'line',
    'Calibrate and zero / Sensorbox page: status line while the box is being zeroed.',
    'Progress: the Sensorbox is being zeroed (Nollställ). Keep the ellipsis.',
  ),
  'calibration.external.done': ctx(
    'line',
    'Calibrate and zero (Sensorbox in use) › box zero card: status line on success.',
    '{name} = the Sensorbox model name; its current position now counts as level.',
  ),
  'calibration.external.err.notConnected': ctx(
    'line',
    'Calibrate and zero / Sensorbox page: error line when zeroing or learning mounting.',
    '{name} = the Sensorbox model name; it is not connected over Bluetooth.',
  ),
  'calibration.external.err.failed': ctx(
    'line',
    'Calibrate and zero / Sensorbox page: error line after a failed box zero.',
    '{name} = the Sensorbox model name; zeroing failed and nothing changed.',
  ),
  'pose.portrait': ctx(
    'line',
    'Level screen › pose overlay: main message (also spoken) when the phone is in landscape.',
    "Turn the phone to portrait; its top edge must point toward the vehicle's front.",
  ),
  'stale.dataUnavailable': ctx(
    'line',
    'Level screen › stale overlay: the message (also spoken) when sensor data stops.',
    'No fresh sensor readings; wheel guidance is hidden until data returns.',
  ),
  'mounting.prompt.upright': ctx(
    'line',
    'Sensorbox page › mounting step: prompt above the direction picker for an upright box.',
    "Tap the side the box's back (the screw mount) points toward.",
  ),
  'mounting.prompt.arrow': ctx(
    'line',
    'Sensorbox page › mounting step (EasyLevel): prompt above the two placement pictures.',
    "An arrow on the box points forward; asks which side of the box faces the vehicle's front.",
  ),
  'mounting.placement.wide': ctx(
    'button',
    "Sensorbox page › mounting step (EasyLevel): button under a picture; also the step's chosen value.",
    "The box is placed with its long side facing the vehicle's front.",
  ),
  'mounting.placement.short': ctx(
    'button',
    "Sensorbox page › mounting step (EasyLevel): button under a picture; also the step's chosen value.",
    "The box is placed with its short side facing the vehicle's front.",
  ),
  'mounting.facing.front': ctx(
    'label',
    "Sensorbox page › mounting picker: tooltip/aria label of an arrow button; also the step's chosen value.",
    "The box's reference side points toward the vehicle's front.",
  ),
  'mounting.facing.right': ctx(
    'label',
    "Sensorbox page › mounting picker: tooltip/aria label of an arrow button; also the step's chosen value.",
    "The box's reference side points to the vehicle's right.",
  ),
  'mounting.facing.rear': ctx(
    'label',
    "Sensorbox page › mounting picker: tooltip/aria label of an arrow button; also the step's chosen value.",
    "The box's reference side points toward the vehicle's rear.",
  ),
  'mounting.facing.left': ctx(
    'label',
    "Sensorbox page › mounting picker: tooltip/aria label of an arrow button; also the step's chosen value.",
    "The box's reference side points to the vehicle's left.",
  ),
  'sensorStatus.connected': ctx(
    'speech',
    'Level screen › top bar, top-right corner: the Sensorbox icon button (aria label and tooltip).',
    'Says the external Sensorbox is connected and delivering readings. Sensorbox is the fixed app term.',
  ),
  'sensorStatus.disconnected': ctx(
    'speech',
    'Level screen › top bar: the Sensorbox icon button (aria label and tooltip) when the link dropped.',
    'The Sensorbox lost its Bluetooth connection; tapping the icon opens its page with details.',
  ),
  'sensorStatus.stale': ctx(
    'speech',
    'Level screen › top bar: the Sensorbox icon button (aria label and tooltip) when readings stopped.',
    'Connected, but the Sensorbox sends no new data; tapping the icon opens its page with details.',
  ),
  'sensorStatus.idle': ctx(
    'speech',
    'Level screen › top bar: the Sensorbox icon button (aria label and tooltip) while the phone is in use.',
    'No box in use; tapping the icon opens the Sensorbox pages to connect one.',
  ),
  'sensorStatus.idle.guide': ctx(
    'speech',
    'Level screen › top bar on iPhone: the Sensorbox icon button (aria label and tooltip).',
    'On iOS the icon opens a guide to using a Sensorbox via the Bluefy browser, not a connect flow.',
  ),
  'sensorSource.connect': ctx(
    'speech',
    'Sensorbox page › a box card: aria label of the Connect link.',
    'Screen-reader name of the Connect link; {name} is the box brand, e.g. EasyLevel or Xparkle.',
  ),
  'sensorSource.disconnect': ctx(
    'button',
    'Box page › footer: the Disconnect button; also quoted in calibration and first-run texts.',
    'Stops using the Sensorbox and drops its Bluetooth link; other texts quote this label, so keep them identical.',
  ),
  'sensorSource.status.connecting': ctx(
    'card',
    'Sensorbox page › a box card status line, and the box page Connect button while busy.',
    'Shown while a Bluetooth connection to the box is being made.',
  ),
  'sensorSource.err.unsupported': ctx(
    'line',
    'Sensorbox page in a browser without Web Bluetooth; also a box card error line.',
    'Explains that this browser cannot talk to Bluetooth sensors. Web Bluetooth is a technical name, keep it.',
  ),
  'sensorSource.unsupported.browser': ctx(
    'text',
    'Sensorbox page in a browser without Web Bluetooth: paragraph under the reason.',
    'Names the browsers that can connect a Sensorbox and reassures that the phone sensor still works.',
  ),
  'sensorSource.err.password': ctx(
    'text',
    'Box page (and box card) › password block: warning paragraph above the code field.',
    'The Xparkle box rejected its password; {name} is the box brand. Try again and Xparkle app must match their labels.',
  ),
  'sensorSource.err.failed': ctx(
    'line',
    'Sensorbox page › a box card: error line under the name after a failed connect.',
    'The Bluetooth connection failed; {name} is the box brand, e.g. EasyLevel.',
  ),
  'sensorSource.ios.intro': ctx(
    'line',
    'Sensorbox page on iPhone (Bluefy guide): intro line above the numbered steps.',
    'Safari lacks Bluetooth access for web pages; a workaround follows.',
  ),
  'sensorSource.ios.step1': ctx(
    'line',
    'Sensorbox page on iPhone (Bluefy guide): numbered step 1.',
    'Install the Bluefy app. Keep the App Store app name "Bluefy – Web Bluetooth Browser" untranslated.',
  ),
  'sensorSource.ios.step2': ctx(
    'line',
    'Sensorbox page on iPhone (Bluefy guide): numbered step 2.',
    'Open Bluefy and grant it Bluetooth permission.',
  ),
  'sensorSource.ios.step3': ctx(
    'line',
    'Sensorbox page on iPhone (Bluefy guide): numbered step 3.',
    'Open the same web address of Libell inside Bluefy.',
  ),
  'sensorSource.ios.step4': ctx(
    'line',
    'Sensorbox page on iPhone (Bluefy guide): numbered step 4.',
    'Open the Sensorbox page again inside Bluefy; it then works as on Android. Sensorbox is the fixed app term.',
  ),
  'sensorSource.ios.note': ctx(
    'text',
    'Sensorbox page on iPhone (Bluefy guide): note paragraph at the bottom.',
    'Bluefy is third-party; reconnecting on app start may need one manual tap rather than being automatic.',
  ),
  'sensorSource.ios.bluefyLink': ctx(
    'button',
    'Sensorbox page on iPhone (Bluefy guide): link to the App Store search.',
    'Opens the App Store search for Bluefy.',
  ),
  'sensorSource.detail.temperature': ctx(
    'line',
    'Box page › Debug info disclosure: temperature row; also in the copied debug text.',
    'The box temperature; {value} is a formatted temperature such as 21 °C.',
  ),
  'sensorSource.detail.notAvailable': ctx(
    'card',
    'Box page › Debug info rows: stands in for a value not received yet.',
    'Placeholder value when the box has not reported this field yet; inserted into the debug rows.',
  ),
  'sensorSource.lowBattery': ctx(
    'line',
    'Box page: warning line under the live reading when the battery is low.',
    'Low Sensorbox battery; {value} is a percentage like 15%. Keep the ⚠ sign.',
  ),
  'sensorSource.install.now': ctx(
    'button',
    'Box page › setup step 2 (zero): main button; also the Sensorbox card in Calibrate.',
    'Nollställ: sets the vehicle level zero for the box now. Fixed app term, not Kalibrera.',
  ),
  'sensorSource.install.clear': ctx(
    'button',
    'Box page › setup step 2 (zero): link button under the Zero again button.',
    'Deletes the stored level zero of the box (Nollställ term: nolläge = the zero).',
  ),
  'sensorSource.install.status': ctx(
    'line',
    'Calibrate › Sensorbox card: status line showing the stored zero.',
    'The stored box zero; {pitch} is the front/back tilt and {roll} the side-to-side tilt, as formatted angles.',
  ),
  'sensorSource.install.status.none': ctx(
    'line',
    'Calibrate › Sensorbox card: status line when no zero is stored.',
    'No level zero set yet, so the box readings are used raw, as mounted.',
  ),
  'sensorSource.learn.h': ctx(
    'label',
    'Box page › direction step › Learn the mounting guide: heading.',
    'Heading of the guide that learns how the box is mounted (its direction) by lifting the vehicle.',
  ),
  'sensorSource.learn.intro': ctx(
    'line',
    'Box page › direction step › Learn the mounting guide: intro under the heading.',
    'Libell learns the box direction from two lifts: first the vehicle front, then its right side.',
  ),
  'sensorSource.learn.start': ctx(
    'button',
    'Box page › direction step › Learn the mounting guide: start button.',
    'Starts the two-lift guide that learns the box mounting direction.',
  ),
  'sensorSource.learn.step.front': ctx(
    'line',
    'Box page › Learn the mounting guide: instruction for the first lift.',
    'Tells the user to raise the vehicle front a few centimetres, then press the button below.',
  ),
  'sensorSource.learn.capture.front': ctx(
    'button',
    'Box page › Learn the mounting guide: button pressed after the first lift.',
    'Confirms the front is raised and records the reading.',
  ),
  'sensorSource.learn.step.right': ctx(
    'line',
    'Box page › Learn the mounting guide: instruction for the second lift.',
    'Lower the front, then raise the right side a few centimetres and press the button below.',
  ),
  'sensorSource.learn.capture.right': ctx(
    'button',
    'Box page › Learn the mounting guide: button pressed after the second lift.',
    'Confirms the right side is raised, records it and finishes the learning.',
  ),
  'sensorSource.learn.cancel': ctx(
    'button',
    'Box page › Learn the mounting guide: secondary Cancel button during the lifts.',
    'Stops the guide without learning anything.',
  ),
  'sensorSource.learn.status.learned': ctx(
    'line',
    'Box page › Learn the mounting guide: status line when a mounting is stored.',
    'A box mounting direction has been learned and is in use.',
  ),
  'sensorSource.learn.status.none': ctx(
    'line',
    'Box page › Learn the mounting guide: status line when nothing is learned.',
    'No mounting learned; the directions printed on the box are used as they are.',
  ),
  'sensorSource.learn.done': ctx(
    'line',
    'Box page › Learn the mounting guide: status line after a successful learning.',
    'Success, with a check: raising the front should make Libell point out the rear wheels to raise.',
  ),
  'sensorSource.learn.err.tooSmall': ctx(
    'line',
    'Box page › Learn the mounting guide: error status after the second lift.',
    'The lifts were too small to measure; raise more and retry.',
  ),
  'sensorSource.learn.err.ambiguous': ctx(
    'line',
    'Box page › Learn the mounting guide: error status after the second lift.',
    'A lift tilted both axes about equally; raise only the front, then only the right side.',
  ),
  'sensorSource.learn.err.arrow': ctx(
    'line',
    'Box page › Learn the mounting guide: error status after the second lift.',
    'The learned mounting has none of the box arrows pointing forward; turn the box and retry.',
  ),
  'sensorSource.learn.err.mirrored': ctx(
    'line',
    'Box page › Learn the mounting guide: error status after the second lift.',
    'The result is mirrored: the box is upside down or the left side was raised instead of the right.',
  ),
  'sensorSource.learn.err.sameAxis': ctx(
    'line',
    'Box page › Learn the mounting guide: error status after the second lift.',
    'Both lifts tilted along the same axis; raise the front first, then the right side.',
  ),
  'sensorStatus.title': ctx(
    'label',
    'Box page: page title at the top.',
    'Title of one box page; {name} is the box brand, e.g. EasyLevel or Xparkle.',
  ),
  'sensorStatus.reading': ctx(
    'line',
    'Box page: live line under the header when no position is shown ({value} is then a dash).',
    'The live tilt reading of the box; {value} is the tilt text or a dash when none.',
  ),
  'sensorStatus.debug': ctx(
    'label',
    'Box page › Debug info: disclosure summary; also the first line of the copied debug text.',
    'Opens the raw diagnostic values of the box, for troubleshooting.',
  ),
  'sensorStatus.debug.intro': ctx(
    'line',
    'Box page › Debug info disclosure: intro line at the top.',
    'Explains these are raw values from the box, meant for troubleshooting.',
  ),
  'sensorStatus.debug.state': ctx(
    'line',
    'Box page › Copy debug info: a line of the copied text only (not shown on screen).',
    'The connection state; {value} is a raw internal word like granted or disconnected, left untranslated.',
  ),
  'sensorStatus.debug.deviceId': ctx(
    'line',
    'Box page › Debug info disclosure: device ID row; also in the copied text.',
    'The Bluetooth device identifier; {value} is the raw ID.',
  ),
  'sensorStatus.debug.lastSample': ctx(
    'line',
    'Box page › Debug info disclosure: last sample row; also in the copied text.',
    'When the last reading arrived; {value} is an age like 0.4 s ago.',
  ),
  'sensorStatus.debug.age': ctx(
    'card',
    'Box page › Debug info: the value inside the Last sample row.',
    'How long ago the last reading came; {s} is seconds with one decimal.',
  ),
  'sensorStatus.debug.rawAccel': ctx(
    'line',
    'Box page › Debug info disclosure: raw accelerometer row; also in the copied text.',
    'The raw x/y/z accelerometer values; {value} holds the numbers.',
  ),
  'sensorStatus.debug.firmwareTier': ctx(
    'line',
    'Box page › Debug info disclosure: firmware row; also in the copied text.',
    'The firmware generation of the box; {value} is its label.',
  ),
  'sensorStatus.debug.rawStatusBytes': ctx(
    'line',
    'Box page › Debug info disclosure: raw status bytes row; also in the copied text.',
    'The raw status bytes from the box; {value} is hex bytes.',
  ),
  'sensorStatus.debug.versionBytes': ctx(
    'line',
    'Box page › Debug info disclosure: serial/firmware row; also in the copied text.',
    'Serial number and firmware as raw bytes; {value} is hex bytes.',
  ),
  'sensorStatus.debug.copy': ctx(
    'button',
    'Box page › Debug info disclosure: copy button.',
    'Copies all debug rows to the clipboard, for a bug report.',
  ),
  'sensorStatus.debug.copied': ctx(
    'line',
    'Box page › Debug info: toast after the copy button.',
    'Confirms the debug info was copied to the clipboard.',
  ),
  'sensorStatus.debug.copy.failed': ctx(
    'line',
    'Box page: toast when copying debug info or the Chrome address fails.',
    'The clipboard copy failed; the user has to copy by hand.',
  ),
  'sensorStatus.advanced': ctx(
    'label',
    'Box page: summary of the Advanced disclosure (Chrome reconnect tip).',
    'Opens advanced tips, here how to let Chrome reconnect to the box by itself.',
  ),
  'sensorStatus.silentReconnect.intro': ctx(
    'text',
    'Box page › Advanced disclosure: first paragraph.',
    'This browser cannot reconnect automatically after a restart, so the box is picked again; Chrome can enable it.',
  ),
  'sensorStatus.silentReconnect.steps': ctx(
    'text',
    'Box page › Advanced disclosure: steps paragraph.',
    '{address} is the chrome://flags address. Keep the quoted Chrome flag name, Enabled and Relaunch in English as Chrome shows them.',
  ),
  'sensorStatus.silentReconnect.copy': ctx(
    'button',
    'Box page › Advanced disclosure: copy button under the steps.',
    'Copies the Chrome flags address; {address} is that address, e.g. chrome://flags.',
  ),
  'sensorStatus.silentReconnect.copied': ctx(
    'line',
    'Box page › Advanced disclosure: toast after copying the address.',
    'Confirms the copy and says to paste it into the Chrome address bar.',
  ),
  'sensorStatus.debug.connectDelay.intro': ctx(
    'line',
    'Box page › Debug info disclosure: hint above the connect-delay controls.',
    'Experimental option for unreliable boxes: a fixed pause after connecting before reading starts.',
  ),
  'sensorStatus.debug.connectDelay.enable': ctx(
    'label',
    'Box page › Debug info disclosure: caption of the connect-delay checkbox.',
    'Turns the experimental pause after connecting on or off.',
  ),
  'sensorStatus.debug.connectDelay.ms': ctx(
    'label',
    'Box page › Debug info disclosure: caption of the delay number field.',
    'The pause length in milliseconds; keep the unit ms.',
  ),
  'status.measuring': ctx(
    'line',
    'Level screen: status line under the vehicle while the first readings settle.',
    'The app is measuring the tilt and has no result yet.',
  ),
  'status.almost': ctx(
    'line',
    'Level screen: status line under the vehicle when it is nearly level.',
    'Nearly level; {left} is the remaining height to raise, formatted with its unit, e.g. 4 mm.',
  ),
  'status.cantLevel.close': ctx(
    'line',
    'Level screen: status line when the owned ramps cannot level here.',
    'The klossar (ramps) are just short of enough; suggests moving the vehicle. kloss is a fixed term.',
  ),
  'status.cantLevel.far': ctx(
    'line',
    'Level screen: status line when the owned ramps cannot level here.',
    'The klossar (ramps) fall far short; suggests moving the vehicle. kloss is a fixed term.',
  ),
  'adjustable.before': ctx(
    'line',
    'Level screen: line above the vehicle for an adjustable kloss (Lippert LEVEL9), shown until level.',
    'The kloss has a movable step set before driving up: set it to the step (steg) each wheel card shows, then drive up. kloss and steg are fixed terms.',
  ),
  'adjustable.after': ctx(
    'line',
    'Level screen: the same line once the vehicle has driven up onto an adjustable kloss and is still not level.',
    'The steps shown are only right from the ground: drive off the klossar so the app measures again. kloss is a fixed term.',
  ),
  'sensorFallback.lost': ctx(
    'line',
    'Level screen › box lost prompt: main sentence while an automatic retry is possible.',
    'The app lost the Bluetooth connection to the Sensorbox.',
  ),
  'sensorFallback.autoRetry': ctx(
    'line',
    'Level screen › box lost prompt: hint under the main sentence.',
    'The app keeps trying to reconnect to the box by itself.',
  ),
  'sensorFallback.connect': ctx(
    'line',
    'Level screen › box lost prompt: main sentence when the box must be picked again.',
    'Asks the user to connect the box (after a restart the browser cannot reconnect by itself).',
  ),
  'sensorFallback.pick': ctx(
    'line',
    'Level screen › box lost prompt: hint under Connect the box.',
    'Tap Reconnect and choose the box in the browser Bluetooth device list.',
  ),
  'sensorFallback.notFound': ctx(
    'line',
    'Level screen › box lost prompt: hint after a failed Reconnect.',
    'Reconnect found no box; check it is switched on and nearby.',
  ),
  'sensorFallback.retry': ctx(
    'button',
    'Level screen › box lost prompt: main button; also the box page Connect button for a lost box.',
    'Tries one Bluetooth reconnect to the Sensorbox.',
  ),
  'sensorFallback.usePhone': ctx(
    'button',
    'Level screen › box lost prompt: quiet link beside Reconnect.',
    'Switches to the phone own sensor instead of the box.',
  ),
  'box.state.connected': ctx(
    'card',
    'Box page header and Sensorbox page box card: connection state.',
    'The box is connected. May be followed by · battery 80 %.',
  ),
  'box.state.lost': ctx(
    'card',
    'Box page header and Sensorbox page box card: connection state.',
    'The box was in use but the Bluetooth contact is lost.',
  ),
  'box.state.password': ctx(
    'card',
    'Box page header and Sensorbox page box card: connection state.',
    'The box rejected the password (code), so it cannot be read.',
  ),
  'box.password.label': ctx(
    'label',
    'Box page › password block: caption of the four-digit code field.',
    'The box password: a four-digit code.',
  ),
  'box.password.retry': ctx(
    'button',
    'Box page › password block: button under the code field.',
    'Retries connecting with the typed code. Quoted in the password warning text, keep identical.',
  ),
  'box.password.checking': ctx(
    'line',
    'Box page › password block: status line while the code is tried.',
    'The typed code is being tried on the box.',
  ),
  'box.password.invalid': ctx(
    'line',
    'Box page › password block: status line when the input is not four digits.',
    'Validation: the code must be exactly four digits.',
  ),
  'box.password.wrong': ctx(
    'line',
    'Box page › password block: status line after a rejected code.',
    'The box also rejected the newly typed code.',
  ),
  'box.password.noAnswer': ctx(
    'line',
    'Box page › password block: status line when the box did not reply.',
    'No reply from the box; the code is saved and tried on the next connection.',
  ),
  'box.state.notConnected': ctx(
    'card',
    'Box page header: connection state of a box not in use.',
    'The box is not connected.',
  ),
  'box.state.battery': ctx(
    'card',
    'Box page header: after the Connected state, as Connected · battery 80 %.',
    'The box battery level; {value} is a percentage like 80 %. Lowercase, it follows a separator.',
  ),
  'box.connect': ctx(
    'button',
    'Sensorbox page › box card: Connect link; also the box page header button.',
    'Connects this Sensorbox over Bluetooth.',
  ),
  'box.step.position.upright.ok': ctx(
    'card',
    'Box page › live line and first-run wizard: position check of an upright box.',
    'The upright-type box (EasyLevel) stands upright as it should; shown after a ✓.',
  ),
  'box.step.position.upright.bad': ctx(
    'line',
    'Box page › live line and first-run wizard: position check of an upright box.',
    'The upright box lies down; stand it upright, any facing works. Shown after a !.',
  ),
  'box.step.position.flat.ok': ctx(
    'card',
    'Box page › live line and first-run wizard: position check of a flat box.',
    'The flat-type box (Xparkle) lies flat as it should; shown after a ✓.',
  ),
  'box.step.position.flat.bad': ctx(
    'line',
    'Box page › live line and first-run wizard: position check of a flat box.',
    'The flat box is tilted too much; lay it flat, top side up. Shown after a !.',
  ),
  'box.step.position.flat.upsideDown': ctx(
    'line',
    'Box page › live line and first-run wizard: position check of a flat box.',
    'The flat box is upside down; turn it lid up, as the manufacturer advises against upside-down mounting.',
  ),
  'box.step.position.waiting': ctx(
    'card',
    'Box page › live line and first-run wizard: position check before any reading.',
    'No reading from the box yet, so its position cannot be checked.',
  ),
  'box.step.direction.todo': ctx(
    'label',
    'Box page › setup checklist: title of step 1 while no direction is picked.',
    'Pick how the box is mounted (which way it faces in the vehicle).',
  ),
  'box.step.direction.done': ctx(
    'label',
    'Box page › setup checklist: title of step 1 once picked, then ": " and the choice.',
    'The box direction is set; followed by a colon and the picked placement in lowercase.',
  ),
  'box.step.direction.learn': ctx(
    'button',
    'Box page › setup checklist step 1: link that opens the Learn the mounting guide.',
    'Offers to learn the direction by raising the vehicle front instead of picking it.',
  ),
  'box.step.zero.todo': ctx(
    'label',
    'Box page › setup checklist: title of step 2 while no zero is stored.',
    'Nollställ: set the vehicle level zero for the box. Fixed app term, not Kalibrera.',
  ),
  'box.step.zero.done': ctx(
    'label',
    'Box page › setup checklist: title of step 2 once zeroed, followed by its age.',
    'The vehicle level zero is set (Nollställd); an age text such as · 3 days ago follows.',
  ),
  'box.step.zero.hint': ctx(
    'line',
    'Box page › setup checklist step 2: hint above the Zero now button.',
    'First make the vehicle level with a spirit level, then zero (Nollställ).',
  ),
  'box.forgetDirection': ctx(
    'button',
    'Box page › setup checklist step 1: link at the bottom.',
    'Deletes the learned or picked box direction.',
  ),
  'sensorList.title': ctx(
    'label',
    'Sensorbox page (from the menu): page title above the box cards.',
    'The page listing the external Bluetooth boxes. Sensorbox is the fixed app term.',
  ),
  'sensorList.phone': ctx(
    'line',
    'Sensorbox page: line under the box cards.',
    'Explains the phone own sensor is used whenever no Sensorbox is connected.',
  ),
  'box.step.zero.again': ctx(
    'button',
    'Box page › setup checklist step 2: main button once a zero is stored.',
    'Sets the vehicle level zero again (Nollställ igen). Fixed app term, not Kalibrera.',
  ),
  'topbar.install': ctx(
    'button',
    'Install row under the top bar, and the first-visit intro: the Install button (shown only when the app can be installed).',
    'Installs Libell as an app on the home screen. Keep very short.',
  ),
  'topbar.share': ctx(
    'speech',
    'Level screen › top bar: aria label and tooltip of the share icon button.',
    'Shares a link to the Libell app itself with someone else (Libell is the app name).',
  ),
  'bottombar.settings': ctx(
    'speech',
    'Level screen › bottom bar: aria label of the settings button (shows only the ☰ glyph).',
    'Opens Settings.',
  ),
  'bottombar.sound.mute': ctx(
    'speech',
    'Level screen › bottom bar: aria label of the speaker button while sound is on.',
    "Tapping turns the app's sound (chime and spoken guidance) off.",
  ),
  'bottombar.sound.unmute': ctx(
    'speech',
    'Level screen › bottom bar: aria label of the speaker button while muted.',
    "Tapping turns the app's sound back on.",
  ),
  'bottombar.help': ctx(
    'speech',
    'Level screen › bottom bar: aria label of the help button (shows only the ? glyph).',
    'Opens the Help page.',
  ),
  'bottombar.label': ctx(
    'speech',
    'Level screen › bottom bar: aria label of the whole bar for screen readers.',
    'Names the group of action buttons (settings, sound, help) at the bottom.',
  ),
  'share.text': ctx(
    'line',
    'System share sheet: the message text sent with the app link from the top bar Share button.',
    'A one-line pitch of the app that the recipient reads above the link.',
  ),
  'share.copied': ctx(
    'line',
    'Toast after sharing when the device has no share sheet and the link was copied instead.',
    'Confirms the link is now on the clipboard.',
  ),
  'update.check': ctx(
    'speech',
    'Level screen › top bar: aria label suffix on the tappable app name and version.',
    'Says that tapping the name/version checks for a new app version.',
  ),
  'update.checking': ctx(
    'line',
    'Toast after tapping the app name/version in the top bar.',
    'Shown while the app checks the server for a newer version.',
  ),
  'update.updating': ctx(
    'line',
    'Toast after the update check finds a newer version.',
    'The new version is being installed; the app will reload.',
  ),
  'update.latest': ctx(
    'line',
    'Toast after the update check finds nothing new.',
    'Confirms the installed app is already the newest version.',
  ),
  'update.offline': ctx(
    'line',
    'Toast when the update check cannot reach the network.',
    'No internet connection, so no update check was possible.',
  ),
  'update.unsupported': ctx(
    'line',
    'Toast when the browser cannot check for updates (no service worker).',
    'Update checks are not possible in this browser or context.',
  ),
  'install.row': ctx(
    'line',
    'Install row under the top bar: the text left of the Install button.',
    'Invites the user to install Libell as an app on the home screen. One short line.',
  ),
  'install.close': ctx(
    'speech',
    'Install row under the top bar: aria label of the ✕ button.',
    'Hides the install row for good.',
  ),
  'install.hint': ctx(
    'line',
    'Install row under the top bar, and the first-visit intro: hint shown on iPhone after tapping Install.',
    'Explains manual install on iOS; "Share" and "Add to Home Screen" must match the Safari menu names in your language.',
  ),
  'share.vehicle.text': ctx(
    'line',
    'System share sheet: message sent with the vehicle-setup link from Settings › Share to another phone.',
    "Says the link carries this vehicle's measurements and ramps (klossar) for Libell on another phone.",
  ),
  'menu.title': ctx(
    'label',
    'Settings menu drawer: the title in its header (also its dialog aria label).',
    'Heading of the menu listing the settings sections.',
  ),
  'menu.close': ctx(
    'speech',
    'Settings, Help and other full pages: aria label of the ✕ close button in the header.',
    'Closes the open menu or page and returns to the level screen.',
  ),
  'menu.settings': ctx(
    'label',
    'Settings page: the page title in its header.',
    'Title of the Settings page.',
  ),
  'menu.calibration': ctx(
    'button',
    'Settings: tab label of the calibration tab; also in Help on the button that opens that tab.',
    'Kalibrera (phone sensor on a flat surface) and Nollställ (vehicle level zero), both fixed app terms. Keep short.',
  ),
  'menu.targets': ctx(
    'label',
    'Settings › Level tab: heading above the list of saved targets.',
    'Heading for saved targets (mål): stored tilts to level towards instead of flat.',
  ),
  'menu.feedback': ctx(
    'button',
    'Help page: tab label of the Feedback tab and the page title when it is selected.',
    'The section where users report a bug or suggest an idea.',
  ),
  'menu.help': ctx(
    'button',
    'Help page: the page title and the Help tab label.',
    'The help section.',
  ),
  'menu.intro': ctx(
    'button',
    'Help page › Help tab: button that restarts the introduction wizard.',
    'Opens the first-run introduction guide again.',
  ),
  'menu.about': ctx(
    'label',
    'Help page: the page title when the About tab is selected.',
    'Full title "About Libell"; Libell is the app name.',
  ),
  'menu.about.tab': ctx(
    'button',
    'Help page: the About tab pill label.',
    'Short form of "About Libell" for a tight tab; keep it one short word.',
  ),
  'menu.sensorSource': ctx(
    'label',
    'Sensorbox pages: page title; introduction › source step: the radio choice for the external box.',
    'The Sensorbox: external Bluetooth sensor box, a fixed app term.',
  ),
  'about.text': ctx(
    'text',
    'Help › About tab: first paragraph; also the first paragraph of the first-visit intro.',
    'What Libell does in one sentence: level a motorhome or caravan with your own phone, no guessing.',
  ),
  'about.version': ctx(
    'line',
    'Help › About tab: the version line at the bottom.',
    '{v} is the app version number, e.g. 2.4.1 or "2.4.1 – CR123".',
  ),
  'about.offline': ctx(
    'text',
    'Help › About tab: paragraph on offline use.',
    'The app works without internet; the network is only used to fetch updates of the app itself.',
  ),
  'about.privacy': ctx(
    'text',
    'Help › About tab: privacy paragraph.',
    'Settings stay on the phone, no account, no tracking; only anonymous usage counts are sent, and they can be turned off (#674).',
  ),
  'menu.privacy': ctx(
    'label',
    'Help page: the page title while the Privacy tab is selected.',
    'Names the page that shows what Libell has stored on the phone and lets the user delete it all.',
  ),
  'menu.privacy.tab': ctx(
    'button',
    'Help page: the Privacy tab pill label, the fourth of four tabs on a 320 px screen.',
    'Short form of the Privacy title for a tight tab; keep it one short word ("Data" is fine where "Privacy" is long).',
  ),
  'privacy.stored.h': ctx(
    'label',
    'Help › Privacy tab: heading above the list of what is stored.',
    'Introduces the plain-words list of everything Libell keeps on this phone.',
  ),
  'privacy.stored.empty': ctx(
    'line',
    'Help › Privacy tab: shown instead of the list when nothing is stored.',
    'Says Libell keeps nothing on this phone right now.',
  ),
  'privacy.raw': ctx(
    'button',
    'Help › Privacy tab: a fold-out below the list.',
    'Opens the exact stored keys and values, for the curious.',
  ),
  'privacy.raw.hint': ctx(
    'line',
    'Help › Privacy tab › Show raw data: first line inside the fold-out.',
    'Says these are the exact stored values, except the sensor box password, which shows as dots.',
  ),
  'privacy.resetSettings': ctx(
    'button',
    'Help › Privacy tab: secondary button above "Delete all Libell data".',
    'Opens Settings › General, where "Reset all settings" resets the settings and keeps vehicles and calibration.',
  ),
  'privacy.deleteAll': ctx(
    'button',
    'Help › Privacy tab: red button at the bottom.',
    'Asks once, then removes everything Libell has stored on this phone.',
  ),
  'privacy.deleteAll.confirm': ctx(
    'line',
    'Help › Privacy tab: the question after tapping "Delete all Libell data".',
    'Warns what is lost and that the app restarts as on first use; answered with Yes or Cancel.',
  ),
  'privacy.deleteAll.yes': ctx(
    'button',
    'Help › Privacy tab: red button under the delete question.',
    'Confirms: removes all stored data and restarts the app.',
  ),
  'privacy.deleteAll.cancel': ctx(
    'button',
    'Help › Privacy tab: button next to "Yes, delete everything".',
    'Keeps everything and folds the question away.',
  ),
  'stored.vehicle': ctx(
    'label',
    'Help › Privacy tab › list: row label for one saved vehicle.',
    'Names the kind of stored data: a vehicle the user has set up.',
  ),
  'stored.vehicle.detail': ctx(
    'line',
    "Help › Privacy tab › list: the vehicle row's value.",
    'The vehicle\'s name and its wheelbase, e.g. "Hymer B 2, wheelbase 3800 mm".',
  ),
  'stored.settings': ctx(
    'label',
    'Help › Privacy tab › list: row label for the saved settings.',
    "Names the kind of stored data: the app's settings.",
  ),
  'stored.settings.detail': ctx(
    'line',
    "Help › Privacy tab › list: the settings row's value.",
    'Says in a few words what the settings hold.',
  ),
  'stored.password': ctx(
    'label',
    'Help › Privacy tab › list: row label; the value is the box brand and dots.',
    'Says the sensor box password is stored, without ever showing it.',
  ),
  'stored.language': ctx(
    'label',
    'Help › Privacy tab › list: row label for the chosen language.',
    'Names the kind of stored data: the language picked in Settings.',
  ),
  'stored.phoneCalibration': ctx(
    'label',
    'Help › Privacy tab › list: row label; the value says when it was saved.',
    "Names the phone's own calibration on a flat surface.",
  ),
  'stored.zero': ctx(
    'label',
    'Help › Privacy tab › list: row label; the value names the phone or the box, and when.',
    'Names a saved "Zero the vehicle" for the phone or a sensor box.',
  ),
  'stored.zeroTrim': ctx(
    'label',
    'Help › Privacy tab › list: row label; the value names the phone or the box.',
    'Names a saved fine adjustment of the vehicle zero.',
  ),
  'stored.targets': ctx(
    'label',
    "Help › Privacy tab › list: row label; the value lists the targets' names.",
    'Names the saved level targets (presets).',
  ),
  'stored.targets.active': ctx(
    'card',
    'Help › Privacy tab › list: one target in the Targets row.',
    'Marks the target that is selected now.',
  ),
  'stored.hitch': ctx(
    'label',
    "Help › Privacy tab › list: row label for a caravan's saved hitch height.",
    'Names the saved hitch height.',
  ),
  'stored.rememberedBox': ctx(
    'label',
    'Help › Privacy tab › list: row label; the value is the box brand.',
    'Says which box Libell remembers to reconnect to.',
  ),
  'stored.notes': ctx(
    'label',
    'Help › Privacy tab › list: row label for small internal marks.',
    'Groups small marks the app keeps, such as whether the introduction was shown.',
  ),
  'stored.notes.detail': ctx(
    'line',
    "Help › Privacy tab › list: the notes row's value.",
    'How many internal marks there are, with one example.',
  ),
  'stored.phone': ctx(
    'card',
    'Help › Privacy tab › list: the owner in a zero row, when it is the phone and not a box.',
    "Says the value belongs to the phone's own sensor.",
  ),
  'stored.saved': ctx(
    'card',
    'Help › Privacy tab › list: when a value was saved, date unknown.',
    'Says the value is saved, for one saved before dates were kept.',
  ),
  'stored.counting.off': ctx(
    'card',
    'Help › Privacy tab › list: the value next to "Anonymous counting".',
    'Says the stored choice is: anonymous counting switched off.',
  ),
  'stored.counting.on': ctx(
    'card',
    'Help › Privacy tab › list: the value next to "Anonymous counting".',
    'Says the stored choice is: anonymous counting switched on.',
  ),
  'stored.savedOn': ctx(
    'card',
    'Help › Privacy tab › list: when a value was saved.',
    'The date the value was saved, e.g. "saved 12 Oct 2026".',
  ),
  'about.source': ctx(
    'line',
    'Help › About tab: sentence followed directly by the source-code link.',
    'Says the app is free, open source under the MIT license; the link text follows it.',
  ),
  'about.source.link': ctx(
    'button',
    'Help › About tab: link after the open-source sentence.',
    'Opens the source code repository on GitHub.',
  ),
  'intro.h': ctx(
    'label',
    'First-visit intro (before the introduction wizard): the heading.',
    'Welcome heading on the very first screen a new user sees; Libell is the app name.',
  ),
  'intro.how': ctx(
    'text',
    'First-visit intro: second paragraph, under the one-sentence pitch.',
    'What you do with Libell: lay the phone flat in the vehicle, and it shows which wheels to raise and by how much.',
  ),
  'intro.start': ctx(
    'button',
    'First-visit intro: the main button at the bottom.',
    'Opens the introduction wizard (the short setup guide).',
  ),
  'intro.later': ctx(
    'button',
    'First-visit intro: a text link under the buttons.',
    'Skips the guide and goes straight to the app; the guide can be opened later from Help.',
  ),
  'onboard.source.sensorIcon': ctx(
    'text',
    'Introduction wizard › source step: second paragraph, under the step intro.',
    'Points to the sensor icon at the top right for connecting a Sensorbox (external Bluetooth box) later.',
  ),
  'counting.title': ctx(
    'label',
    'Help › Privacy tab’s counting block heading, and the stored-data list’s row label.',
    'Names the anonymous usage counting the Privacy tab’s block explains.',
  ),
  'counting.intro': ctx(
    'text',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: first paragraph.',
    'Says Libell can count app use anonymously (only if the user agrees), and why; the details follow under the two headings.',
  ),
  'counting.sent.h': ctx(
    'label',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: heading over the list of what is counted.',
    'Introduces exactly what the counting sends.',
  ),
  'counting.sent': ctx(
    'text',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: under "What is counted".',
    'Lists everything that is counted: app opened, features used, sensor model, app version, language chosen in the app.',
  ),
  'counting.notSent.h': ctx(
    'label',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: heading over the list of what is never saved.',
    'Introduces what the counting never keeps.',
  ),
  'counting.notSent': ctx(
    'text',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: under "What is never saved".',
    'Lists what is never saved (IP, country, device, screen, OS, browser, measurements, settings, anything personal) and that only the user’s count/don’t-count choice is kept on the phone.',
  ),
  'counting.gpc': ctx(
    'line',
    'Help › Privacy tab › counting block: last sentence of the "What is never saved" paragraph.',
    'Says a browser privacy signal (Global Privacy Control / Do Not Track) turns counting off.',
  ),
  'counting.later': ctx(
    'line',
    'First-start counting choice screen: last sentence of the "What is never saved" paragraph. {help} is the Help page name, {tab} its Privacy tab.',
    'Says where the choice can be changed later: Help › Privacy.',
  ),
  'counting.toggle': ctx(
    'label',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: checkbox caption.',
    'Turns the anonymous counting on or off.',
  ),
  'counting.dashboard': ctx(
    'button',
    'First-start counting choice screen, and Help › Privacy tab’s counting block: link at the end of the first paragraph.',
    'Opens the public statistics page in a new tab, so anyone can see what is counted.',
  ),
  'counting.ask': ctx(
    'label',
    'First-start counting choice screen: its heading, above what is and is not counted; the two buttons at the bottom answer it.',
    'Asks the user whether Libell may count their use anonymously; the two buttons below answer it.',
  ),
  'counting.yes': ctx(
    'button',
    'First-start counting choice screen: the first of two equal buttons.',
    'Agrees to anonymous counting; stores the choice and goes on into the app.',
  ),
  'counting.no': ctx(
    'button',
    'First-start counting choice screen: the second of two equal buttons.',
    'Declines anonymous counting; stores the choice, nothing is ever counted, and goes on into the app.',
  ),
  'onboard.sound.h': ctx(
    'label',
    'Introduction wizard › sound step title; also the Sound section heading in Settings › General.',
    'Heading for the chime and spoken-guidance settings.',
  ),
  'onboard.source.h': ctx(
    'label',
    'Introduction wizard › source step: the step title.',
    'Asks whether to measure tilt with the phone or a Sensorbox.',
  ),
  'onboard.source.intro': ctx(
    'text',
    'Introduction wizard › source step: paragraph under the title.',
    'Choose which sensor to read tilt from; reassures that most people just use the phone.',
  ),
  'onboard.source.phone': ctx(
    'label',
    'Introduction wizard › source step: the radio option for the phone.',
    "Use this phone's own sensor (the default choice).",
  ),
  'onboard.source.externalActive': ctx(
    'text',
    'Introduction wizard › source step: note shown only while a Sensorbox is the active source.',
    "{disconnect} is the box page's Disconnect button label; explains how to free the phone for calibration.",
  ),
  'onboard.vehicle.h': ctx(
    'label',
    'Introduction wizard › vehicle step: the step title.',
    'Asks whether a motorhome or a caravan is being levelled.',
  ),
  'onboard.vehicle.intro': ctx(
    'text',
    'Introduction wizard › vehicle step: paragraph under the title.',
    'Choose the vehicle (fordon); the rest of the guide adapts to it.',
  ),
  'onboard.step1.h': ctx(
    'label',
    'Introduction wizard › placement step title (and picture label); also a Help topic heading.',
    'How to lay the phone in the vehicle, shown with an illustration.',
  ),
  'onboard.next': ctx(
    'button',
    'Introduction wizard: the primary button at the bottom of each step.',
    'Goes to the next step; also inserted as {next} in step notes, so keep the wording identical.',
  ),
  'onboard.back': ctx(
    'button',
    'Introduction wizard: secondary button from the second step on.',
    'Returns to the previous step.',
  ),
  'onboard.close': ctx(
    'speech',
    'Introduction wizard: aria label of the ✕ close button.',
    'Closes the introduction guide.',
  ),
  'onboard.done': ctx(
    'button',
    'Introduction wizard: the primary button on the last step (replaces Next).',
    'Finishes the introduction and opens the level screen.',
  ),
  'onboard.skipStep': ctx(
    'button',
    'Introduction wizard: secondary button on steps that can be skipped.',
    'Skips this step without saving; it can be done later.',
  ),
  'onboard.note.measurements': ctx(
    'line',
    'Introduction wizard › measurements step: note under the fields.',
    '{lamp} is the name of the setup warning lamp; says skipping keeps default measurements until yours are saved.',
  ),
  'onboard.note.ramps': ctx(
    'line',
    'Introduction wizard › ramps step: note under the ramp choice.',
    'Skipping uses default klossar (ramps, never "ramp" in Swedish); they can be chosen later in Settings.',
  ),
  'onboard.note.calibrate': ctx(
    'line',
    'Introduction wizard › calibration step: note under the Kalibrera button.',
    '{next} = Next button label, {lamp} = calibrate warning lamp name; calibration needs a flat surface.',
  ),
  'onboard.note.connect': ctx(
    'line',
    'Introduction wizard › Sensorbox connect step: note under the connect button.',
    '{next} = Next button label; the box can be connected later via the sensor icon at the top right.',
  ),
  'onboard.zeroLater': ctx(
    'line',
    'Introduction wizard › calibration step: paragraph about zeroing.',
    'Nollställ (set vehicle level zero) happens on first level parking; {lamp} = the zero reminder lamp name.',
  ),
  'onboard.legend.ok': ctx(
    'line',
    'Introduction wizard › placement step: legend row beside a green ✓ swatch.',
    'Explains a green ✓ on a wheel card: that wheel is level. Keep colour, symbol and dash.',
  ),
  'onboard.legend.up': ctx(
    'line',
    'Introduction wizard › placement step: legend row beside an orange ↑ swatch.',
    'Orange ↑: drive that wheel up onto the kloss step shown on its card.',
  ),
  'onboard.legend.no': ctx(
    'line',
    'Introduction wizard › placement step: legend row beside a red ✕ swatch.',
    'Red ✕: no kloss step is high enough; park somewhere flatter.',
  ),
  'onboard.legend.dim': ctx(
    'line',
    'Introduction wizard › placement step: legend row beside a grey – swatch.',
    'Grey –: no kloss at that wheel; the figure shows how much height is missing.',
  ),
  'speech.level': ctx(
    'speech',
    'Spoken guidance: said by the voice when the vehicle is level.',
    'One word meaning the vehicle is now level/flat.',
  ),
  'speech.inches': ctx(
    'speech',
    'Spoken guidance (inch units): a whole number of inches.',
    '{n} is a whole number of inches above one, e.g. "3 inches".',
  ),
  'speech.inchOne': ctx(
    'speech',
    'Spoken guidance (inch units): exactly one inch.',
    'Singular "one inch" spoken in words.',
  ),
  'speech.inchOneAnd': ctx(
    'speech',
    'Spoken guidance (inch units): one inch plus a fraction.',
    '{fraction} is a spoken eighth such as "three eighths"; whole part is one.',
  ),
  'speech.inchesAnd': ctx(
    'speech',
    'Spoken guidance (inch units): several inches plus a fraction.',
    '{n} = whole inches (2 or more), {fraction} = a spoken eighth such as "a quarter".',
  ),
  'speech.inchFraction': ctx(
    'speech',
    'Spoken guidance (inch units): less than one inch.',
    '{fraction} is a spoken eighth such as "a half"; read as a fraction of an inch.',
  ),
  'speech.eighth1': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 1/8, inserted as {fraction}.',
    'One eighth of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth2': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 2/8, inserted as {fraction}.',
    'A quarter of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth3': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 3/8, inserted as {fraction}.',
    'Three eighths of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth4': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 4/8, inserted as {fraction}.',
    'A half inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth5': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 5/8, inserted as {fraction}.',
    'Five eighths of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth6': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 6/8, inserted as {fraction}.',
    'Three quarters of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'speech.eighth7': ctx(
    'speech',
    'Spoken guidance (inch units): the fraction word for 7/8, inserted as {fraction}.',
    'Seven eighths of an inch, spoken; must fit the speech.inch* sentences.',
  ),
  'feedback.intro': ctx(
    'text',
    'Help › Feedback tab: intro paragraph above the form.',
    'Explains the form opens a ready-made GitHub report to post; a free GitHub account is needed.',
  ),
  'feedback.category': ctx(
    'label',
    'Help › Feedback tab: caption above the category radio buttons.',
    'Asks what kind of feedback this is (bug, suggestion, other).',
  ),
  'feedback.cat.bug': ctx(
    'label',
    'Help › Feedback tab: the first category radio option.',
    'Feedback reports a bug/error in the app; becomes part of the GitHub report.',
  ),
  'feedback.cat.suggestion': ctx(
    'label',
    'Info › Feedback tab: a radio option under "What is it about?".',
    'Report category: an idea or wish for the app (not a bug).',
  ),
  'feedback.cat.other': ctx(
    'label',
    'Info › Feedback tab: a radio option under "What is it about?".',
    'Report category for anything that is neither a bug nor a suggestion.',
  ),
  'feedback.title': ctx(
    'label',
    'Info › Feedback tab: caption of the title text field.',
    'Asks for a short headline for the report (becomes the GitHub issue title).',
  ),
  'feedback.desc': ctx(
    'label',
    'Info › Feedback tab: caption of the description text area.',
    'Invites the user to describe the problem or wish in their own words.',
  ),
  'feedback.submit': ctx(
    'button',
    'Info › Feedback tab: the submit button under the form.',
    'Opens a pre-filled issue on GitHub in a new tab; the user posts it there.',
  ),
  'feedback.warn.title': ctx(
    'line',
    'Info › Feedback tab: warning line above the submit button.',
    'Shown when the title is empty; not blocking, the report can still be sent.',
  ),
  'feedback.warn.desc': ctx(
    'line',
    'Info › Feedback tab: warning line above the submit button.',
    'Shown when the description is empty; not blocking, the report can still be sent.',
  ),
  'feedback.warn.both': ctx(
    'line',
    'Info › Feedback tab: warning line above the submit button.',
    'Shown when title and description are both empty; not blocking.',
  ),
  'help.screen.h': ctx(
    'label',
    'Info › Help: heading of the first topic; also an onboarding step title and picture label.',
    "Topic on how to read the level screen's wheel cards and bubble.",
  ),
  'help.screen.lead': ctx(
    'text',
    'Info › Help › Reading the screen: first line above the picture.',
    'Says what the screen shows. "Step 2" must match diagram.step; step = a step of the ramp (kloss).',
  ),
  'help.screen.t': ctx(
    'text',
    'Info › Help › Reading the screen, and onboarding: legend lines, one per line.',
    'Explains each wheel-card colour/symbol (✓ ↑ ✕ –) and the bubble. Keep the symbols; ramp = kloss.',
  ),
  'help.screen.routine': ctx(
    'text',
    'Info › Help › Reading the screen: closing line after the legend.',
    'The leveling routine: drive up, wait for stillness, look again, repeat until all wheels are green.',
  ),
  'help.what.t': ctx(
    'text',
    'Info › Help › Place the phone, and onboarding placement step: paragraph under the picture.',
    'How to lay the phone (flat, top toward the front, same spot); not needed with a Sensorbox.',
  ),
  'help.settings.h': ctx(
    'label',
    'Onboarding: title of the measurements step and label of its picture.',
    "Heading for the vehicle's measurements (wheelbase and track width).",
  ),
  'help.measures.h': ctx(
    'label',
    'Info › Help: heading of the measurements topic.',
    "Imperative heading: enter the vehicle's measurements (wheelbase, track width).",
  ),
  'help.settings.t': ctx(
    'text',
    'Info › Help › Enter the measurements: topic paragraph, one fact per line.',
    'Explains wheelbase/track width, units, caravan wheelbase to the stödhjul (jockey wheel), and per-vehicle (fordon) data.',
  ),
  'help.ramps.t': ctx(
    'text',
    'Info › Help › Ramps topic: paragraph, one fact per line.',
    'Explains entering the ramps (klossar) you carry; "Stepless wedge" must match the steglös kil option name.',
  ),
  'help.calibration.h': ctx(
    'label',
    'Info › Help: heading of the calibration topic.',
    'Heading naming the two fixed app terms: Kalibrera (phone sensor) and Nollställ (vehicle zero).',
  ),
  'help.calibration.t': ctx(
    'text',
    'Info › Help › Calibrate and zero: paragraph, one fact per line.',
    'Kalibrera = phone on a flat surface; Nollställ = vehicle zero. Quoted buttons/lamps must match their own strings.',
  ),
  'help.sensor.h': ctx(
    'label',
    'Info › Help: heading of the sensor box topic.',
    'Heading for the Sensorbox (external Bluetooth sensor box) topic; fixed app term.',
  ),
  'help.sensor.t': ctx(
    'text',
    'Info › Help › Sensor box: paragraph, one fact per line.',
    '{upright}/{flat} hold box brand names grouped by mounting. Quoted step names must match the box page.',
  ),
  'help.targets.h': ctx(
    'label',
    'Info › Help: heading of the targets and sound topic.',
    'Heading: saved targets (mål, a saved tilt) and the spoken guidance/sound.',
  ),
  'help.targets.t': ctx(
    'text',
    'Info › Help › Targets and sound: paragraph, one fact per line.',
    'Explains mål (saved tilt), caravan hitch height and "Back to hitch height" (match hitch.go), voice and sound button.',
  ),
  'help.trouble.h': ctx(
    'label',
    'Info › Help: heading of the troubleshooting topic.',
    'Heading for the topic listing common problems and what to do.',
  ),
  'help.trouble.t': ctx(
    'text',
    'Info › Help › If something is wrong: paragraph, one fact per line.',
    "Each quoted message must match the app's own status/error text exactly; then the fix for it.",
  ),
  'help.open': ctx(
    'button',
    'Info › Help: button under a topic leading to a Settings tab.',
    '{name} holds the tab name (e.g. Vehicle, Ramps, Calibrate and zero, Level); opens that tab.',
  ),
  'help.open.sensor': ctx(
    'button',
    'Info › Help › Sensor box: button under the topic.',
    'Opens the Sensorbox page (external Bluetooth sensor box).',
  ),
  'help.open.feedback': ctx(
    'button',
    'Info › Help › If something is wrong: button under the topic.',
    'Switches to the Feedback tab to write a problem report.',
  ),
  'main.hint': ctx(
    'line',
    'Level screen: hint above the Start button before the sensor is started.',
    "Tells the user how to place the phone: flat, top edge toward the vehicle's front.",
  ),
  'main.start': ctx(
    'button',
    'Level screen: the Start button shown before sensors run (needed on iPhone).',
    'Starts the tilt sensor; the tap grants motion permission on iOS.',
  ),
  'main.waiting': ctx(
    'line',
    'Level screen: status line while no sensor reading has arrived yet.',
    'Waiting for the first tilt reading; quoted verbatim in help.trouble.t.',
  ),
  'main.level': ctx(
    'line',
    'Level screen: the overlay message when level; also announced to screen readers.',
    'Celebrates that the vehicle (fordon) is level.',
  ),
  'main.denied': ctx(
    'text',
    'Level screen: error message replacing the screen when motion permission is denied.',
    'Explains that motion access was refused and how to allow it and reload; quoted in help.trouble.t.',
  ),
  'main.noSensors': ctx(
    'line',
    'Level screen: error message when the device has no motion sensors.',
    'Explains the device cannot provide tilt readings, so the app cannot work on it.',
  ),
  'main.https': ctx(
    'text',
    'Level screen: error message when the page is not opened over HTTPS.',
    'Explains sensors require a secure connection (HTTPS) and to reopen over HTTPS.',
  ),
  'diagram.aria': ctx(
    'speech',
    'Level screen: screen-reader label of the motorhome drawing.',
    'Describes the top-down motorhome drawing; wheel instructions follow it.',
  ),
  'diagram.caravan.aria': ctx(
    'speech',
    'Level screen: screen-reader label of the caravan drawing.',
    'Describes the top-down caravan drawing with axle wheels and the stödhjul (jockey wheel).',
  ),
  'diagram.front': ctx(
    'card',
    "Sensorbox page › mounting picker: label at the vehicle's front in the small drawing, uppercased.",
    "Marks the vehicle's front (shown in capitals followed by ↑). One short word.",
  ),
  'diagram.step': ctx(
    'card',
    'Level screen: wheel card; also Settings › Ramps step grid and the spoken guidance.',
    '{n} = step number on the ramp (kloss) to drive the wheel up onto. Very short.',
  ),
  'diagram.driveUp': ctx(
    'card',
    'Level screen: wheel card when using a stepless wedge; also spoken.',
    'Drive the wheel up the steglös kil (stepless wedge) by the length shown after it.',
  ),
  'diagram.done': ctx(
    'card',
    'Level screen: wheel card when that wheel needs nothing.',
    'This wheel is done, nothing to raise. One short word.',
  ),
  'diagram.noRamp': ctx(
    'card',
    'Level screen: wheel card for a low wheel with no ramp placed there.',
    'No ramp (kloss) at this wheel; the lift it lacks is shown under it. Swedish says kloss.',
  ),
  'diagram.wheel.frontLeft': ctx(
    'speech',
    'Level screen: screen-reader label of a motorhome wheel card and drawing.',
    'Names the front left wheel before its instruction.',
  ),
  'diagram.wheel.frontRight': ctx(
    'speech',
    'Level screen: screen-reader label of a motorhome wheel card and drawing.',
    'Names the front right wheel before its instruction.',
  ),
  'diagram.wheel.rearLeft': ctx(
    'speech',
    'Level screen: screen-reader label of a motorhome wheel card and drawing.',
    'Names the rear left wheel before its instruction.',
  ),
  'diagram.wheel.rearRight': ctx(
    'speech',
    'Level screen: screen-reader label of a motorhome wheel card and drawing.',
    'Names the rear right wheel before its instruction.',
  ),
  'diagram.notEnough': ctx(
    'card',
    'Level screen: note on a red ✕ wheel card; also spoken after its step and lift.',
    'The ramps (klossar) are not high enough for this wheel. Lowercase fragment, very short.',
  ),
  'diagram.speech.wheel': ctx(
    'speech',
    'Level screen: screen-reader description of the drawing, one per wheel.',
    '{wheel} = wheel name, {instruction} = what it needs (e.g. Step 2, 30 mm). Keep the pattern.',
  ),
  'caravan.crankUp': ctx(
    'card',
    'Level screen: caravan stödhjul (jockey wheel) card; also spoken.',
    'Turn the jockey wheel crank to raise the front; the amount is shown beside it. Very short.',
  ),
  'caravan.crankDown': ctx(
    'card',
    'Level screen: caravan stödhjul (jockey wheel) card; also spoken.',
    'Turn the jockey wheel crank to lower the front; the amount is shown beside it. Very short.',
  ),
  'caravan.axleLeft': ctx(
    'speech',
    "Level screen: screen-reader label of the caravan's left axle wheel card.",
    "Names the caravan's left axle wheel.",
  ),
  'caravan.axleRight': ctx(
    'speech',
    "Level screen: screen-reader label of the caravan's right axle wheel card.",
    "Names the caravan's right axle wheel.",
  ),
  'caravan.jockeyWheel': ctx(
    'speech',
    "Level screen: screen-reader label of the caravan's jockey wheel card and drawing.",
    'Stödhjul: the small front wheel of a caravan, raised or lowered with a crank.',
  ),
  'help.screen.caravan': ctx(
    'text',
    'Info › Help › Reading the screen: extra line for caravans.',
    'Explains the stödhjul (jockey wheel) card; "Crank up"/"Crank down" must match caravan.crankUp/Down.',
  ),
  'hitch.title': ctx(
    'label',
    'Settings › Level tab (caravan): heading of the hitch height section.',
    'Hitch height: the jockey-wheel height at which the coupling meets the tow ball.',
  ),
  'hitch.hint': ctx(
    'text',
    'Settings › Level tab (caravan): hint under the Hitch height heading.',
    'Save while still hitched; later the stödhjul (jockey wheel) card shows how far to crank back.',
  ),
  'hitch.save': ctx(
    'button',
    'Settings › Level tab (caravan) › Hitch height: secondary button.',
    'Stores the current height as the hitch height.',
  ),
  'hitch.go': ctx(
    'button',
    'Settings › Level tab (caravan) › Hitch height: main button.',
    'Starts guiding the jockey wheel back to the saved hitch height; quoted in help.targets.t.',
  ),
  'hitch.done': ctx(
    'button',
    'Settings › Level tab (caravan) › Hitch height: button while going back to it.',
    'Ends the hitch height mode and returns to normal leveling.',
  ),
  'hitch.savedNow': ctx(
    'line',
    'Settings › Level tab › Hitch height status, and a toast from the main-screen offer.',
    'Confirms the hitch height has just been saved.',
  ),
  'hitch.status.none': ctx(
    'line',
    'Settings › Level tab (caravan) › Hitch height: status line.',
    'No hitch height has been saved yet.',
  ),
  'hitch.status.saved': ctx(
    'line',
    'Settings › Level tab (caravan) › Hitch height: status line.',
    'A hitch height is stored and can be returned to.',
  ),
  'hitch.status.active': ctx(
    'line',
    'Settings › Level tab (caravan) › Hitch height: status line while active.',
    'The level screen now shows how far to crank the stödhjul (jockey wheel).',
  ),
  'hitch.badge': ctx(
    'card',
    'Level screen: badge button at the top while going back to the hitch height.',
    'Shows the hitch height mode is on; tapping it ends the mode. A couple of words.',
  ),
  'hitch.badge.aria': ctx(
    'speech',
    'Level screen: screen-reader label of the hitch height badge.',
    'Names the mode and says tapping returns to normal leveling.',
  ),
  'hitch.crank.up': ctx(
    'line',
    'Level screen: status line while going back to the hitch height.',
    '{amount} = formatted length (e.g. 3.5 cm) to crank the jockey wheel up.',
  ),
  'hitch.crank.down': ctx(
    'line',
    'Level screen: status line while going back to the hitch height.',
    '{amount} = formatted length (e.g. 3.5 cm) to crank the jockey wheel down.',
  ),
  'hitch.reached': ctx(
    'line',
    'Level screen: status line when the jockey wheel is at the hitch height.',
    'The coupling is at the saved hitch height; ready to hitch up.',
  ),
  'hitch.offer': ctx(
    'line',
    'Level screen (caravan): quiet one-line offer while no hitch height is saved.',
    'Suggests saving the hitch height before unhitching; never blocks leveling.',
  ),
  'hitch.offer.save': ctx(
    'button',
    'Level screen (caravan): link button after the save-hitch-height offer.',
    'Saves the hitch height now.',
  ),
  'hitch.offer.dismiss': ctx(
    'button',
    'Level screen (caravan): link button after the save-hitch-height offer.',
    'Dismisses the offer without saving.',
  ),
  'onboard.boxPosition.h': ctx(
    'label',
    'Onboarding (Sensorbox path): title of the box position step.',
    'Heading: how the external sensor box sits in the vehicle.',
  ),
  'onboard.boxPosition.later': ctx(
    'text',
    'Onboarding (Sensorbox path) › box position step: paragraph under the position.',
    'Direction and Nollställ (vehicle zero) wait until first parking; "⚠ Zero" must match the lamp text.',
  ),
  'onboard.boxPosition.notConnected': ctx(
    'text',
    'Onboarding (Sensorbox path) › box position step: note when no box is connected.',
    '{next} holds the Next button label. Says to go on and connect later via the sensor icon.',
  ),
};

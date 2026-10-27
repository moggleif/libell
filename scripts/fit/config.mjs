// What the fit test walks: the languages, the screens, the appearances and
// the containers that cover the screen.
import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPEARANCES } from '../../src/domain/appearance.ts';
import { selectAppearances } from '../fitAppearances.ts';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Every shipped language (one `xx.ts` dictionary each): a view that fits in
// one language can overflow in another, where words run longer.
export const LANGUAGES = readdirSync(resolve(ROOT, 'src/ui/messages'))
  .filter((file) => /^[a-z]{2}\.ts$/.test(file))
  .map((file) => file.slice(0, 2));

// The longest of them, and the one that has caught every language-related
// failure so far; English is the baseline to compare it against.
export const LONGEST = ['de', 'en'];

// CSS pixels actually visible to the page, not the phone's spec sheet:
// Safari's own toolbars take ~114 px of an iPhone SE and ~107 px of an
// iPhone 15. 320 px wide is the narrowest phone still in use and the one
// that catches horizontal overflow; the SE in Safari is the tightest
// height anyone can install this on. Anything taller or wider than the
// iPhone 15 in Safari is strictly more room.
//
// `fitsWhole` is the stricter promise — every view fits with no scrolling
// at all — and it is made for the phones this app actually targets. The
// 320x480 entry is an iPhone 5 / SE-1 in Safari: it is here for the
// horizontal checks, which is where a 320px screen bites, and it still
// gets every reachability check; it is simply not held to fitting the
// longest German guide step without scrolling its body, which on that
// screen would mean type too small to read. Its controls stay pinned
// either way — that is what R18 guarantees everywhere.
//
// `languages` is per viewport rather than the whole list everywhere,
// because the language dimension is not equally informative at every
// size: it exists to catch text that runs longer than the space it has,
// and the space is tightest on the SE, so that is where all of them are
// walked. The 320px entry is about width, where German is the worst case
// and English the baseline. The roomiest screen is a sanity check that
// nothing breaks when there is more room, not a place where text
// overflows — one language is enough to notice a structural break.
// That is 3 language-runs per appearance plus one per shipped language.
export const VIEWPORTS = [
  { name: '320x480', width: 320, height: 480, fitsWhole: false, languages: LONGEST },
  { name: 'iPhone SE, Safari', width: 375, height: 553, fitsWhole: true, languages: LANGUAGES },
  { name: 'iPhone 15, Safari', width: 393, height: 745, fitsWhole: true, languages: ['de'] },
];
export const TIGHTEST = VIEWPORTS[1];
export const LEVEL9 = { rampStepHeightsMm: [20, 40, 60, 80, 100, 120, 140, 160, 180] };

// Every appearance the app offers, read from the domain rather than
// copied (#403). Classic and Modern build different DOM for the same
// content (Classic's settings is a drawer, Modern's a page), and Glossy
// is Classic's DOM under its own gradients, bevels and shadows.
//
// FIT_APPEARANCE narrows a run to one of them: CI runs one job per
// appearance side by side, since the sweep is mostly settle pauses and
// three of them in parallel take well under half the time of one after
// the other (#494).
export const WALKED_APPEARANCES = selectAppearances(APPEARANCES, process.env.FIT_APPEARANCE);

export const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Every container that covers the screen in its own right. Anything open
// gets the reachability checks in auditView.mjs, and each is held to the
// iOS rule in stylesheet.mjs.
export const VIEW_CONTAINERS = ['.menu-page', '.intro', '.onboarding', '.menu', '.incoming-setup'];

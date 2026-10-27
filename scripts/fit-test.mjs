// Fit test (#239, #241, #243): Libell has to fit a phone screen. Every
// view is opened against small-phone viewports, in every appearance and
// every language, and checked for the ways a layout stops fitting —
// content below the fold, a page that scrolls sideways, something that
// cannot be reached at all.
//
// It exists because the unit tests cannot catch any of this: they run in
// happy-dom, which has no layout engine, so every height and width they
// measure is zero, and a view that overflows an iPhone by 300 px passes
// them happily.
//
// Two kinds of check, because one browser cannot see everything:
//
//   * Runtime (`fit/sweep.mjs`): what Chromium can measure — overflow, reachability,
//     the level view's geometry, each guide step's fit.
//   * Static (`fit/stylesheet.mjs`): the one rule Chromium *cannot* reproduce. On iOS
//     a `position: fixed; inset: 0` box is laid out against the
//     toolbar-free LARGE viewport while `window.innerHeight` is the small
//     one, so the bottom of such a box sits behind Safari's bar with
//     nothing to scroll. In Chromium the two viewports are identical and
//     the bug is invisible, so the rule is enforced against the
//     stylesheet instead.
//
// The checks live in `scripts/fit/`, one module per kind of view; this file
// starts the preview server and the browser and runs them in order.
//
// Run after `npm run build`; CI runs it on every pull request. Exits non-zero
// on anything that does not fit.
import { withPreview } from './withPreview.mjs';
import { PORT } from './fitOpen.mjs';
import { WALKED_APPEARANCES } from './fit/config.mjs';
import { report } from './fit/report.mjs';
import { checkStylesheet } from './fit/stylesheet.mjs';
import { sweep } from './fit/sweep.mjs';

await withPreview(PORT, sweep);
checkStylesheet();
report(WALKED_APPEARANCES);

// The static half of the fit test: the iOS rule no browser here can
// reproduce.
//
// On iOS a `position: fixed; inset: 0` box is laid out against the
// toolbar-free LARGE viewport while `window.innerHeight` is the small
// one, so the bottom of that box — and any control in it — sits behind
// Safari's bottom bar with nothing to scroll. In Chromium the two
// viewports are identical, so every runtime check passes happily on
// a layout that is broken on the device this app is built for. Hence
// this: every full-screen container must say, in the stylesheet, that it
// is sized to the small viewport and that its bottom padding clears the
// home indicator.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, VIEW_CONTAINERS } from './config.mjs';
import { countCheck, fail } from './report.mjs';

/** The rule for `selector`, from its line start to its closing brace, or null. */
function ruleBlock(css, selector) {
  const start = css.indexOf(`\n${selector} {`);
  return start === -1 ? null : css.slice(start, css.indexOf('}', start));
}

function checkContainerRule(css, container) {
  const block = ruleBlock(css, container);
  if (block === null) {
    fail('stylesheet', `no rule found for the full-screen container ${container}`);
    return;
  }
  countCheck();
  if (!/position:\s*fixed/.test(block)) return;

  if (!/height:\s*100svh/.test(block)) {
    fail(
      'stylesheet',
      `${container} is a full-screen fixed container but is not sized to the small viewport ` +
        `(needs "height: 100svh", with "height: 100vh" above it as the fallback) — on iOS its ` +
        `bottom would sit behind Safari's toolbar`,
    );
  }
  // The bottom padding may live on the container or on the single child
  // that holds its content, so accept either.
  const childBlock = ruleBlock(css, `${container}__drawer`) ?? '';
  if (!/env\(safe-area-inset-bottom\)/.test(block + childBlock)) {
    fail(
      'stylesheet',
      `${container} does not pad its bottom by env(safe-area-inset-bottom) — its last control ` +
        `would sit under the home indicator`,
    );
  }
}

/** Holds every full-screen container in the stylesheet to the iOS rule. */
export function checkStylesheet() {
  const css = readFileSync(resolve(ROOT, 'src/ui/styles.css'), 'utf8');
  for (const container of VIEW_CONTAINERS) checkContainerRule(css, container);
}

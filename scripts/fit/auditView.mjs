// The checks every view gets, whatever it contains.
import { VIEW_CONTAINERS } from './config.mjs';
import { countCheck, fail } from './report.mjs';

/**
 * Runs in the page: each open container among `selectors`, where it ends,
 * where its last content ends once scrolled to the bottom, and what is
 * wider than it.
 */
function measureView(selectors) {
  const de = document.documentElement;
  const open = selectors
    .flatMap((s) => [...document.querySelectorAll(s)])
    .filter((e) => !e.hidden && e.getBoundingClientRect().height > 0);

  const containers = open.map((el) => {
    const box = el.getBoundingClientRect();
    // Scroll to the end and see whether the last thing in the view
    // actually comes into sight.
    const before = el.scrollTop;
    el.scrollTop = el.scrollHeight;
    const last = el.lastElementChild?.getBoundingClientRect();
    const lastBottomAtEnd = last ? last.bottom : null;
    el.scrollTop = before;

    const wide = [...el.querySelectorAll('*')]
      .filter((n) => {
        const nb = n.getBoundingClientRect();
        return nb.width > 0 && nb.right > box.left + el.clientWidth + 0.5;
      })
      .map((n) => `${n.tagName.toLowerCase()}.${(n.getAttribute('class') ?? '').split(' ')[0]}`);

    // A tab bar shows every tab whole: one cut off at its edge, or
    // scrolled out of sight, is a tab the user cannot see exists (#538).
    const cutTabs = [...el.querySelectorAll('[role=tablist]')].some(
      (bar) => bar.scrollWidth > bar.clientWidth + 0.5,
    );

    return {
      cls: el.className.split(' ')[0],
      bottom: box.bottom,
      lastBottomAtEnd,
      wide: [...new Set(wide)].slice(0, 3),
      cutTabs,
    };
  });

  return {
    pageSideways: de.scrollWidth - de.clientWidth,
    innerHeight: window.innerHeight,
    containers,
  };
}

function checkContainer(label, c, innerHeight) {
  if (c.bottom > innerHeight + 0.5) {
    fail(label, `${c.cls} extends ${Math.round(c.bottom - innerHeight)}px past the screen`);
  }
  if (c.lastBottomAtEnd !== null && c.lastBottomAtEnd > innerHeight + 0.5) {
    fail(
      label,
      `${c.cls}: scrolled to the end, its last content is still ` +
        `${Math.round(c.lastBottomAtEnd - innerHeight)}px below the screen`,
    );
  }
  if (c.wide.length > 0) {
    fail(label, `${c.cls}: ${c.wide.join(', ')} overflow it horizontally`);
  }
  if (c.cutTabs) {
    fail(label, `${c.cls}: its tab bar is wider than the screen, so tabs are cut off`);
  }
}

/**
 * The checks that apply to every view, whatever it contains: the page
 * never moves sideways, nothing sits outside the screen it is drawn on,
 * and anything that scrolls can be scrolled to its end.
 */
export async function auditView(page, label) {
  await page.waitForTimeout(250);
  const r = await page.evaluate(measureView, VIEW_CONTAINERS);
  countCheck();

  if (r.pageSideways > 0) {
    fail(label, `the page scrolls sideways by ${Math.round(r.pageSideways)}px`);
  }
  for (const c of r.containers) checkContainer(label, c, r.innerHeight);
}

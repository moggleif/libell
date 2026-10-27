// The level view's own checks: it fits whole, its drawing keeps its
// proportions, and each wheel card sits on its wheel (#241).
import { fail } from './report.mjs';

/** Runs in the page: where the drawing, its box, the action bar and each wheel card are. */
function measureLevelScreen() {
  const svg = document.querySelector('.rv-diagram svg');
  const box = document.querySelector('.rv-diagram').getBoundingClientRect();
  const bottombar = document.querySelector('.bottombar');
  const vb = svg.viewBox.baseVal;

  // Where each wheel actually is on screen, straight from the SVG's own
  // transform — the drawing is the authority, not any assumption about
  // how it was laid out.
  const ctm = svg.getScreenCTM();
  const screenY = (y) => {
    const p = svg.createSVGPoint();
    p.x = 0;
    p.y = y;
    return p.matrixTransform(ctm).y;
  };
  // Each card carries its wheel's y in the drawing's own coordinates
  // (`placeWheelCard` in diagramParts.ts), so the expected position is read off the drawing
  // rather than hardcoded here.
  const cards = [...document.querySelectorAll('.wheel-card')].map((card) => {
    const r = card.getBoundingClientRect();
    const wheelY = card.dataset.wheelY === undefined ? null : Number(card.dataset.wheelY);
    return { centre: r.top + r.height / 2, left: r.left, right: r.right, top: r.top, wheelY };
  });

  return {
    pageOverflow: document.documentElement.scrollHeight - window.innerHeight,
    innerHeight: window.innerHeight,
    bottombarBottom: bottombar ? bottombar.getBoundingClientRect().bottom : null,
    // The drawing's own top and bottom on screen: the box around it is
    // deliberately wider than the drawing (the wheel cards live in that
    // margin), so the box's shape says nothing — where the drawing
    // actually lands does.
    drawingTop: screenY(0),
    drawingBottom: screenY(vb.height),
    boxTop: box.top,
    boxBottom: box.bottom,
    cards,
    wheelScreenYs: cards.map((c) => (c.wheelY === null ? null : screenY(c.wheelY))),
  };
}

function checkFitsWhole(label, result) {
  if (result.pageOverflow > 0) {
    fail(label, `level view: the page scrolls by ${Math.round(result.pageOverflow)}px`);
  }
  // The action bar is the last thing on the level view now — the version
  // footer that used to sit under it moved up beside the logo (#251).
  if (result.bottombarBottom !== null && result.bottombarBottom > result.innerHeight + 0.5) {
    fail(
      label,
      `level view: the action bar is ${Math.round(
        result.bottombarBottom - result.innerHeight,
      )}px below the fold`,
    );
  }
}

/** The whole of #241: the drawing used to be taller than the space it was
 * given, which is what pushed everything below it off the screen. */
function checkDrawing(label, result) {
  if (result.drawingTop < result.boxTop - 0.5 || result.drawingBottom > result.boxBottom + 0.5) {
    fail(
      label,
      `level view: the drawing overflows its box by ${Math.round(
        Math.max(result.boxTop - result.drawingTop, result.drawingBottom - result.boxBottom),
      )}px`,
    );
  }
}

function checkCardsOnWheels(label, result) {
  result.cards.forEach((card, i) => {
    const expected = result.wheelScreenYs[i];
    if (expected === null) {
      fail(label, `level view: wheel card ${i + 1} carries no wheel position to check against`);
      return;
    }
    const drift = Math.abs(card.centre - expected);
    if (drift > 1.5) {
      fail(label, `level view: wheel card ${i + 1} is ${Math.round(drift)}px off its wheel`);
    }
  });
}

function checkCardsApart(label, cards) {
  const rows = new Map();
  for (const card of cards) {
    const row = Math.round(card.top);
    rows.set(row, [...(rows.get(row) ?? []), card]);
  }
  for (const pair of rows.values()) {
    if (pair.length !== 2) continue;
    const [a, b] = pair.sort((x, y) => x.left - y.left);
    if (a.right > b.left) {
      fail(label, `level view: the two wheel cards overlap by ${Math.round(a.right - b.left)}px`);
    }
  }
}

/**
 * The level view on top of auditView: it is the one view that must fit
 * whole, with nothing below the fold and no scrolling at all, and its
 * diagram has to keep the drawing's proportions with each wheel card still
 * sitting on the wheel it describes (#241).
 */
export async function checkLevelScreen(page, label, { fitsWhole = true } = {}) {
  await page.waitForSelector('.rv-diagram svg');
  // The bubble settles and the wheel cards fill in after the first frame.
  await page.waitForTimeout(400);
  const result = await page.evaluate(measureLevelScreen);

  if (fitsWhole) checkFitsWhole(label, result);
  checkDrawing(label, result);
  // Wheel cards, where the appearance has them: on their wheel, and never
  // overlapping each other.
  if (result.cards.length > 0) {
    checkCardsOnWheels(label, result);
    checkCardsApart(label, result.cards);
  }
}

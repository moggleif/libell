/**
 * Clickjacking guard (#67): GitHub Pages cannot send response headers and
 * browsers ignore `frame-ancestors` in a <meta>-delivered CSP (ADR 0005),
 * so the app refuses to run framed — blank the page, then walk the top
 * window to the real address (allowed cross-origin for navigation).
 */
export function guardAgainstFraming(win: Window = window): void {
  if (win.top === win.self) return;
  win.document.body.replaceChildren();
  try {
    win.top!.location.href = win.location.href;
  } catch {
    // Sandboxed frame without top-navigation: stay blank.
  }
}

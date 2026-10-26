// The tests run with one fixed phone locale, whatever machine runs them: the
// first-run unit follows the region (#627), and Node reports the host's own
// locale (en-US on most CI runners, which would start every test in inches).
// English in a metric region keeps the defaults the tests are written to.
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true });
}

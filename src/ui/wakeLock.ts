/**
 * Screen Wake Lock (issue #1): keep the display on while leveling. The
 * lock is dropped by the platform when the page is hidden, so it is
 * re-acquired on visibilitychange. Degrades silently where the API is
 * missing (it is Chrome-on-Android and Safari 16.4+).
 */

export function keepScreenAwake(): void {
  if (!('wakeLock' in navigator)) return;

  let sentinel: WakeLockSentinel | null = null;

  const acquire = async () => {
    try {
      sentinel = await navigator.wakeLock.request('screen');
    } catch {
      // Denied (e.g. low battery mode) — not worth interrupting the user.
      sentinel = null;
    }
  };

  void acquire();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !sentinel) void acquire();
    if (document.visibilityState === 'hidden') sentinel = null;
  });
}

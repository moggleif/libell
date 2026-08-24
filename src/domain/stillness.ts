/**
 * Stillness detection (#86) — pure TypeScript, no browser APIs.
 *
 * When people move around inside, the vehicle rocks and momentary
 * readings are meaningless. The sensor is already EMA-smoothed and the
 * display has hysteresis; this adds an explicit state on top: the
 * reading counts as unstable while roll or pitch has varied more than a
 * small threshold within a short window, and returns to stable only
 * once a full window has passed calmly.
 *
 * The detector starts stable — a calm app shows guidance immediately;
 * rocking is detected within a couple of samples anyway.
 */

/** Peak-to-peak variation (degrees) within the window that counts as movement. */
export const STILLNESS_THRESHOLD_DEG = 0.4;
/** How long the signal must have been calm before guidance returns. */
export const STILLNESS_CALM_MS = 1500;

interface Sample {
  t: number;
  rollDeg: number;
  pitchDeg: number;
}

/**
 * Creates a stateful detector: feed it every (already smoothed) reading
 * with a monotonic timestamp; it returns true while the reading is
 * trustworthy. State is per-instance, like the display stabilizer.
 */
export function createStillnessDetector(): (
  rollDeg: number,
  pitchDeg: number,
  nowMs: number,
) => boolean {
  let samples: Sample[] = [];

  return (rollDeg, pitchDeg, nowMs) => {
    samples.push({ t: nowMs, rollDeg, pitchDeg });
    samples = samples.filter((s) => nowMs - s.t <= STILLNESS_CALM_MS);

    let minRoll = Infinity;
    let maxRoll = -Infinity;
    let minPitch = Infinity;
    let maxPitch = -Infinity;
    for (const s of samples) {
      minRoll = Math.min(minRoll, s.rollDeg);
      maxRoll = Math.max(maxRoll, s.rollDeg);
      minPitch = Math.min(minPitch, s.pitchDeg);
      maxPitch = Math.max(maxPitch, s.pitchDeg);
    }
    return (
      maxRoll - minRoll <= STILLNESS_THRESHOLD_DEG && maxPitch - minPitch <= STILLNESS_THRESHOLD_DEG
    );
  };
}

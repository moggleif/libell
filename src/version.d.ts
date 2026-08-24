/**
 * Injected at build time by the `define` block in vite.config.ts: the
 * version shown in the footer — "1.0.0" for a release deploy,
 * "1.0.0 – CR93" for a candidate (ADR 0007), "1.0.0 – local …" in dev —
 * or null when a CI build has no version to show.
 */
declare const __APP_VERSION__: string | null;

/**
 * Injected at build time by the `define` block in vite.config.ts: the
 * version shown in the footer ("1.0.3" in deploys, "1.0.3 – local …" in
 * dev), or null when a CI build has no version to show.
 */
declare const __APP_VERSION__: string | null;

// The version strings of Libell's builds (ADR 0007). The VERSION file holds
// major.minor, or major.minor.patch for a patch release (#611). The first
// deploy of a version is its release; every later merge on it is a QA
// candidate shown as "X.Y.Z – CR<PR>" and tagged "vX.Y.Z-CR<PR>" (tag names
// take no spaces). The tags decide which: once a version has any tag, it is
// released. Used by the deploy workflow (compute-version.ts) and by local
// dev builds (vite.config.ts), so both read VERSION the same way.

export interface DeployVersion {
  /** Shown under the logo, e.g. "1.3.1" or "1.3.1 – CR612". */
  versionString: string;
  /** The git tag the deploy pushes, e.g. "v1.3.1" or "v1.3.1-CR612". */
  tagName: string;
  /** True for the release itself, which also gets a GitHub Release. */
  isRelease: boolean;
}

/** "1.3" → "1.3.0"; "1.3.1" → "1.3.1". */
export function releaseOf(versionFile: string): string {
  const version = versionFile.trim();
  return version.split('.').length === 2 ? `${version}.0` : version;
}

export function deployVersion(
  versionFile: string,
  tags: string[],
  prNumber: string,
): DeployVersion {
  const release = releaseOf(versionFile);
  const releaseTag = `v${release}`;
  const released = tags.some((tag) => tag === releaseTag || tag.startsWith(`${releaseTag}-`));
  if (!released) return { versionString: release, tagName: releaseTag, isRelease: true };
  return {
    versionString: `${release} – CR${prNumber}`,
    tagName: `${releaseTag}-CR${prNumber}`,
    isRelease: false,
  };
}

/**
 * Merge and squash commits both carry "#<PR>" in the subject. Direct pushes
 * and manual dispatches have none, so the run number keeps the tag unique.
 */
export function prNumberFrom(subject: string, fallback: string): string {
  return /#(\d+)/.exec(subject)?.[1] ?? fallback;
}

/** A working tree is not a candidate build, so it never carries a CR number. */
export function localVersion(versionFile: string, stamp: string): string {
  return `${releaseOf(versionFile)} – local ${stamp}`;
}

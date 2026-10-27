// The fit test's tally: every problem found, and how many checks ran.

const failures = [];
let checked = 0;

/** Records that `what` does not fit in the view `label`. */
export function fail(label, what) {
  failures.push(`${label} | ${what}`);
}

/** Counts one check, passed or failed. */
export function countCheck() {
  checked += 1;
}

/** Prints the outcome for the walked `appearances`, and exits non-zero on any problem. */
export function report(appearances) {
  if (failures.length > 0) {
    console.error(
      `fit test failed (${appearances.join(', ')}) — ${failures.length} problem(s) across ${checked} checks:`,
    );
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(
    `fit test passed (${appearances.join(', ')}) — ${checked} checks, every view fits a phone screen`,
  );
}

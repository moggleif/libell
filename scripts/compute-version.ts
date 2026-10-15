// Deploy workflow step (ADR 0007): computes this deploy's version from the
// VERSION file, the existing tags and the merged PR, and hands it to the
// later jobs as step outputs. Run with plain Node (type stripping), no
// install needed.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { deployVersion, prNumberFrom } from './version.ts';

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();

const subject = git('log', '-1', '--pretty=%s');
const runNumber = process.env.GITHUB_RUN_NUMBER ?? '0';
const prNumber = prNumberFrom(subject, runNumber);
if (prNumber === runNumber) {
  console.log(`No PR number in '${subject}' — falling back to run number ${runNumber}`);
}

const tags = git('tag', '--list').split('\n').filter(Boolean);
const version = deployVersion(readFileSync('VERSION', 'utf8'), tags, prNumber);

const outputs = [
  `version_string=${version.versionString}`,
  `tag_name=${version.tagName}`,
  `is_release=${version.isRelease}`,
];
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
console.log(`Computed version: ${version.tagName} (is_release=${version.isRelease})`);

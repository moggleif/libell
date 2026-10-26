import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Every ADR has its own number, and the index lists them in order, each row
 * linking the file with that number (#711: two ADRs were once both 0021).
 */
const ADR_DIR = 'docs/adr';

const adrFiles = readdirSync(ADR_DIR).filter((name) => /^\d{4}-.+\.md$/.test(name));
const numberOf = (name: string): string => name.slice(0, 4);

const indexRows = readFileSync(`${ADR_DIR}/README.md`, 'utf8')
  .split('\n')
  .map((line) => /^\| (\d{4}) \| \[.*\]\((\d{4}-[^)]+\.md)\)/.exec(line))
  .filter((match) => match !== null)
  .map(([, number, file]) => ({ number, file }));

describe('ADR numbering', () => {
  it('gives every ADR file its own number', () => {
    const numbers = adrFiles.map(numberOf);
    expect(numbers.filter((n, i) => numbers.indexOf(n) !== i)).toEqual([]);
  });

  it('lists every ADR once in the index, in numeric order', () => {
    expect(indexRows.map((row) => row.file)).toEqual([...adrFiles].sort());
  });

  it('links each index row to the file with that number', () => {
    expect(indexRows.filter((row) => numberOf(row.file) !== row.number)).toEqual([]);
  });
});

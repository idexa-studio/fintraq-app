import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * The English copy, held to the voice in docs/PRODUCT.md ("Words"). Every string of every copy
 * namespace is read, so a new screen cannot bring its own tone in.
 */
const COPY_DIR = join(__dirname, '..', 'copy');

type Line = { where: string; text: string };

function linesOf(value: unknown, where: string, out: Line[]): Line[] {
  if (typeof value === 'string') out.push({ where, text: value });
  else if (value && typeof value === 'object') for (const [key, inner] of Object.entries(value)) linesOf(inner, `${where}.${key}`, out);
  return out;
}

const lines: Line[] = readdirSync(COPY_DIR)
  .filter((file) => file.endsWith('.en.ts'))
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  .flatMap((file) => linesOf(require(join(COPY_DIR, file)).default, file.replace('.en.ts', ''), []));

const offenders = (rule: RegExp): string[] => lines.filter((line) => rule.test(line.text)).map((line) => `${line.where}: ${line.text}`);

describe('the English copy', () => {
  it('is all here', () => {
    expect(lines.length).toBeGreaterThan(800);
  });

  it('does not shout or decorate', () => {
    expect(offenders(/!/)).toEqual([]);
    expect(offenders(/\p{Extended_Pictographic}/u)).toEqual([]);
    expect(offenders(/\.\.\./)).toEqual([]);
  });

  it('uses no dash as punctuation', () => {
    expect(offenders(/—| – | - /)).toEqual([]);
  });

  it('has no filler', () => {
    expect(offenders(/\b(please|sorry|oops|simply|easily|awesome|well done|great job)\b/i)).toEqual([]);
  });

  it('calls a transaction a transaction', () => {
    expect(offenders(/\bentr(y|ies)\b/i)).toEqual([]);
  });

  it('spells in British English', () => {
    expect(offenders(/\b(color|favorite|canceled|organize)\b/i)).toEqual([]);
  });
});

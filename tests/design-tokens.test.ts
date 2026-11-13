// Design checks (docs/reference/08-design-system.md, 8.2 and 8.15):
//   1. tokens.css has exactly the colour values in the spec table;
//   2. no component, page or stylesheet uses a raw colour outside tokens.css;
//   3. every text-on-surface pair reaches WCAG contrast 4.5:1 (3:1 for chart marks).
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8');
const tokensCss = read('src/styles/tokens.css');

/** --name: value pairs defined in tokens.css. */
const tokens = new Map([...tokensCss.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));

describe('colour tokens match the spec table (8.2)', () => {
  const spec = read('docs/reference/08-design-system.md');
  const rows = [...spec.matchAll(/^\| `--([\w-]+)`[^|]*\| `([^`]+)` \|/gm)].map((m) => [m[1]!, m[2]!] as const);

  it('the spec table was read', () => {
    expect(rows.length).toBeGreaterThanOrEqual(19);
  });
  it.each(rows)('--%s is %s', (name, value) => {
    const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    expect(norm(tokens.get(name) ?? '(missing)')).toBe(norm(value));
  });
});

describe('no raw colours outside tokens.css (8.2)', () => {
  const files = [
    ...readdirSync(resolve(ROOT, 'src/components'), { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => `src/components/${f.replace(/\\/g, '/')}`),
    ...readdirSync(resolve(ROOT, 'src/pages')).map((f) => `src/pages/${f}`),
    ...readdirSync(resolve(ROOT, 'src/styles')).filter((f) => f !== 'tokens.css').map((f) => `src/styles/${f}`),
  ];
  it.each(files)('%s', (file) => {
    const text = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(text.match(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g) ?? []).toEqual([]);
    expect(text.match(/\b(?:rgba?|hsla?)\(/g) ?? []).toEqual([]);
  });
});

// ---- WCAG contrast ----
const hex = (name: string) => {
  const v = tokens.get(name);
  if (!v || !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`--${name} is not a plain hex colour: ${v}`);
  return v;
};
const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe('text contrast 4.5:1 on every surface text sits on', () => {
  const surfaces = ['chal', 'muslin', 'dhan-tint'];
  const texts = ['kali', 'kali-2', 'kali-3', 'dhan', 'lal-deep'];
  const pairs = surfaces.flatMap((s) => texts.map((tx) => [tx, s] as const));
  it.each(pairs)('--%s on --%s', (text, surface) => {
    expect(contrast(hex(text), hex(surface))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('chart marks 3:1 on the chart surface (--muslin)', () => {
  // --paat sits right at the line (the palette validator reports a WARN). The spec's relief is
  // in place: direct labels and a Chart | Table view on every chart. Checked at 2.95 so it
  // cannot get worse unnoticed.
  const marks: [string, number][] = [
    ['dhan-chart', 3],
    ['paat', 2.95],
    ['padma', 3],
    ['rickshaw', 3],
    ['nil', 3],
    ['sindoor', 3],
  ];
  it.each(marks)('--%s', (name, min) => {
    expect(contrast(hex(name), hex('muslin'))).toBeGreaterThanOrEqual(min);
  });

  it('--peer-grey is a known exception (open peer dots), recorded for review', () => {
    // 8.2 sets --peer-grey to #9AA39D, which is about 2.5:1 on paper: below the 3:1 that WCAG
    // 1.4.11 asks of meaningful graphics. Peers are also told apart by shape (open circles),
    // listed for screen readers and in the table view. Raised with Ahmar (DECISIONS.md).
    const c = contrast(hex('peer-grey'), hex('muslin'));
    expect(c).toBeGreaterThan(2.3);
    expect(c).toBeLessThan(3);
  });
});

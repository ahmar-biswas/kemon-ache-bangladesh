// "Bangladesh over time" for money measures, in the prices of the latest year (DECISIONS.md 106).
//
// The published constant-taka series (base-year prices) is the one the spec requires for
// trends, but its latest value differs from the current-taka figure on the tile (e.g. ৳1.97
// lakh vs ৳3.14 lakh). Ahmar asked for one basis everywhere, so every year of the constant
// series is multiplied by one number:
//
//   factor = (latest year's value in current taka) ÷ (same year's value in constant taka)
//
// Simple arithmetic on two published values (rule R4), labelled "Calculated by this site".
// The line's shape and every year-to-year change are exactly those of the published constant
// series; only the unit becomes "taka at <year> prices", and the latest point equals the tile.
import type { DataRecord } from './types.ts';

export interface Rebased {
  /** The constant series, re-expressed in the prices of `year`. */
  points: DataRecord[];
  /** The year whose prices are used: the latest year with both a current and a constant value. */
  year: number;
  factor: number;
  /** The two published inputs for that year. */
  current: DataRecord;
  constant: DataRecord;
}

export function rebaseToLatestPrices(constant: DataRecord[], current: DataRecord[]): Rebased | null {
  const byYear = new Map(current.map((r) => [r.year, r]));
  const pairs = constant.filter((r) => byYear.has(r.year) && r.value !== 0).sort((a, b) => b.year - a.year);
  const base = pairs[0];
  if (!base) return null;
  const cur = byYear.get(base.year)!;
  const factor = cur.value / base.value;
  return {
    points: constant.map((r) => ({ ...r, value: r.value * factor })),
    year: base.year,
    factor,
    current: cur,
    constant: base,
  };
}

/** CSV with both the calculated value and the published constant-taka value for every year. */
export function rebasedCsv(r: Rebased, constant: DataRecord[]): string {
  const esc = (s: string | number | null) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['year', `value_in_${r.year}_prices_calculated_by_this_site`, 'published_value_constant_taka', 'factor', 'formula', 'source_url_constant', 'source_url_current', 'retrieved_at'];
  const formula = `published constant-taka value × (${r.year} current-taka value ${r.current.value} ÷ ${r.year} constant-taka value ${r.constant.value})`;
  const body = constant.map((c, i) =>
    [c.year, r.points[i]!.value, c.value, r.factor, formula, c.source_url, r.current.source_url, c.retrieved_at].map(esc).join(','),
  );
  return [head.join(','), ...body].join('\r\n');
}

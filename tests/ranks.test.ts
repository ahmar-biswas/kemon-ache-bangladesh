// Global rank "calculated by this site" (DECISIONS.md 67). Made-up test values.
import { describe, expect, it } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { MIN_RANKED, buildRank, rankHighestFirst, validateRank, type AllCountriesRaw } from '../scripts/lib/ranks.ts';
import type { CountryInfo } from '../src/data/types.ts';

const life = INDICATORS.find((i) => i.id === 'life_expectancy')!;

describe('rankHighestFirst', () => {
  it('ranks highest first and gives equal values the same rank (1, 2, 2, 4)', () => {
    const r = rankHighestFirst([
      { country: 'A', value: 5 },
      { country: 'B', value: 9 },
      { country: 'C', value: 7 },
      { country: 'D', value: 7 },
    ]);
    expect(r.map((x) => `${x.country}${x.rank}`)).toEqual(['B1', 'C2', 'D2', 'A4']);
  });
});

describe('buildRank', () => {
  const ids = Array.from({ length: MIN_RANKED + 5 }, (_, i) => `C${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`);
  const countries: CountryInfo[] = [...ids, 'BGD'].map((id) => ({ id, iso2: 'XX', name: id, region: 'x', income_group: 'LMC', income_group_name: 'x' }));
  const raw = (rows: AllCountriesRaw['rows']): AllCountriesRaw => ({ request_url: 'https://x', retrieved_at: '2026-01-01', total_rows: rows.length, rows });

  it('counts only countries with a value for the same year, never aggregates', () => {
    const rows = [
      ...ids.map((c, i) => ({ c, y: 2024, v: i })), // values 0 … n-1
      { c: 'BGD', y: 2024, v: 10.5 },
      { c: 'BGD', y: 2023, v: 999 }, // other year: ignored
      { c: 'SAS', y: 2024, v: 1000 }, // aggregate (not in the country list): ignored
    ];
    const r = buildRank(life, raw(rows), countries, 2024, 'World Bank')!;
    expect(r.out_of).toBe(ids.length + 1);
    // Higher than BGD: values 11 … n-1.
    expect(r.rank).toBe(ids.length - 11 + 1);
    expect(r.kind).toBe('calculated');
    expect(r.order).toBe('highest_first');
    expect(validateRank(life, r)).toEqual([]);
  });

  it(`gives no rank when fewer than ${MIN_RANKED} countries have a value that year`, () => {
    const rows = [...ids.slice(0, MIN_RANKED - 2).map((c) => ({ c, y: 2024, v: 1 })), { c: 'BGD', y: 2024, v: 2 }];
    expect(buildRank(life, raw(rows), countries, 2024, 'World Bank')).toBeNull();
  });
});

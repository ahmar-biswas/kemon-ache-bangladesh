// The position badge count (8.10) and the "last 10 years" rule (5.5). Made-up test values.
import { describe, expect, it } from 'vitest';
import { latestRecent, position, recentSince } from '../src/data/compare.ts';
import type { DataRecord } from '../src/data/types.ts';

const rec = (country: string, value: number, year = 2022): DataRecord => ({
  indicator_id: 'x', country, year, value, unit: 'percent', source_name: 's', original_source: '',
  source_url: 'https://example.org', definition_url: 'https://example.org', api_url: 'https://example.org',
  retrieved_at: '2026-01-01', notes: [], measured_by: null,
});

describe('recentSince and latestRecent', () => {
  it('"last 10 years" counts back from the year of the last check', () => {
    expect(recentSince('2026-11-13')).toBe(2016);
  });
  it('keeps each country\'s newest year and drops countries with nothing recent', () => {
    const m = latestRecent([rec('IND', 1, 2015), rec('IND', 2, 2020), rec('IND', 3, 2018), rec('PAK', 9, 2010)], ['IND', 'PAK'], 2016);
    expect(m.get('IND')?.value).toBe(2);
    expect(m.has('PAK')).toBe(false);
  });
});

describe('position', () => {
  const bgd = rec('BGD', 10);
  const peers = [rec('A', 5), rec('B', 8), rec('C', 12), rec('D', 20), rec('E', 10)];

  it('is null for "context" indicators: no badge', () => {
    expect(position('context', bgd, peers)).toBeNull();
  });
  it('"lower" target: ahead of countries with a higher value; equal counts as neither', () => {
    const p = position('lower', bgd, peers)!;
    expect(p.ahead.map((r) => r.country)).toEqual(['C', 'D']);
    expect(p.behind.map((r) => r.country)).toEqual(['A', 'B']);
    expect(p.equal.map((r) => r.country)).toEqual(['E']);
    expect(p.m).toBe(5);
    expect(p.kind).toBe('level');
  });
  it('"higher" target flips the sides', () => {
    const p = position('higher', bgd, peers)!;
    expect(p.ahead.map((r) => r.country)).toEqual(['A', 'B']);
    expect(p.behind.map((r) => r.country)).toEqual(['C', 'D']);
  });
  it('ring shows 3 quarters when ahead of most, 1 when ahead of few', () => {
    expect(position('lower', rec('BGD', 1), peers)!).toMatchObject({ kind: 'ahead', quarters: 3 });
    expect(position('lower', rec('BGD', 30), peers)!).toMatchObject({ kind: 'behind', quarters: 1 });
  });
  it('is null with no peers to compare', () => {
    expect(position('lower', bgd, [])).toBeNull();
  });
});

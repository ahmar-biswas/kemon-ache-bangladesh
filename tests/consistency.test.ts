// One figure, one value (Ahmar, M6): every view of a measure must show the same Bangladesh
// value and year, and the over-time line for money ends at the tile's own figure.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rebaseToLatestPrices, rebasedCsv } from '../src/data/rebase.ts';
import type { DataRecord } from '../src/data/types.ts';

const read = <T,>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
interface Latest {
  indicators: Record<string, { bangladesh: DataRecord | null }>;
}
const LATEST = read<Latest>('data/processed/latest.json');
const DETAILS = read<{ records: Record<string, DataRecord[]> }>('data/processed/details.json');

describe.each(Object.keys(LATEST.indicators))('%s: same Bangladesh value everywhere', (id) => {
  const tile = LATEST.indicators[id]!.bangladesh;
  it('details, trend and world files agree with the tile', () => {
    if (!tile) return;
    const detail = DETAILS.records[id]?.find((r) => r.country === 'BGD');
    expect(detail && [detail.year, detail.value]).toEqual([tile.year, tile.value]);
    const trendPath = `data/processed/trend/${id}.json`;
    if (existsSync(trendPath)) {
      const trend = read<DataRecord[]>(trendPath);
      const last = trend[trend.length - 1]!;
      expect([last.year, last.value]).toEqual([tile.year, tile.value]);
    }
    const worldPath = `data/processed/world/${id}.json`;
    if (existsSync(worldPath)) {
      const bgd = read<{ rows: { country: string; year: number; value: number }[] }>(worldPath).rows.find((r) => r.country === 'BGD');
      if (bgd) expect([bgd.year, bgd.value]).toEqual([tile.year, tile.value]);
    }
  });
});

describe('GDP per person over time, in the latest year\'s prices', () => {
  const constant = read<DataRecord[]>('data/processed/trend/gdp_pc_taka_constant.json');
  const current = read<DataRecord[]>('data/processed/trend/gdp_pc_taka.json');
  const tile = LATEST.indicators.gdp_pc_taka!.bangladesh!;
  const r = rebaseToLatestPrices(constant, current)!;

  it('ends at the tile figure, in the tile year', () => {
    expect(r.year).toBe(tile.year);
    const last = r.points[r.points.length - 1]!;
    expect(last.year).toBe(tile.year);
    expect(last.value).toBeCloseTo(tile.value, 6);
  });

  it('keeps every year-to-year change of the published constant series', () => {
    for (let i = 1; i < constant.length; i++) {
      expect(r.points[i]!.value / r.points[i - 1]!.value).toBeCloseTo(constant[i]!.value / constant[i - 1]!.value, 12);
    }
  });

  it('CSV carries both the calculated and the published value', () => {
    const csv = rebasedCsv(r, constant).split('\r\n');
    expect(csv[0]).toMatch(/calculated_by_this_site/);
    expect(csv).toHaveLength(constant.length + 1);
  });

  it('gives nothing when no year has both values', () => {
    expect(rebaseToLatestPrices(constant, [])).toBeNull();
  });
});

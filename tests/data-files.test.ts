// Checks the committed data against the cached World Bank answers it was built from:
// every published value is carried over exactly, and every empty value stays empty.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { processedPath, rawPath } from '../scripts/lib/files.ts';
import type { DataRecord } from '../src/data/types.ts';
import { DATA, latest } from '../src/data/index.ts';

const readJson = <T,>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;

type Row = { date: string; value: number | null };

describe.each(INDICATORS)('$id', (config) => {
  const raw = readJson<{ response: [unknown, Row[]][] }>(rawPath(config.code, 'data'));
  const rows = raw.response.flatMap(([, r]) => r);
  const records = readJson<DataRecord[]>(processedPath(config.id));

  it('has exactly one record per year that has a published value', () => {
    const published = rows.filter((r) => r.value !== null);
    expect(records).toHaveLength(published.length);
    for (const r of published) {
      expect(records.find((rec) => rec.year === Number(r.date))?.value).toBe(r.value);
    }
  });

  it('has no record for any year the World Bank left empty', () => {
    for (const r of rows.filter((x) => x.value === null)) {
      expect(records.find((rec) => rec.year === Number(r.date))).toBeUndefined();
    }
  });

  it('shows as "latest" the newest year that has a value', () => {
    const newestWithValue = Math.max(...rows.filter((r) => r.value !== null).map((r) => Number(r.date)));
    expect(latest(DATA[config.id])?.year).toBe(newestWithValue);
  });
});

describe('life expectancy', () => {
  it('latest year is the last published one, skipping any empty newer years', () => {
    const raw = readJson<{ response: [unknown, Row[]][] }>(rawPath('SP.DYN.LE00.IN', 'data'));
    const empty2025 = raw.response.flatMap(([, r]) => r).find((r) => r.date === '2025')?.value === null;
    if (empty2025) {
      // True as of 13 November 2026: 2025 is empty, so the page must show 2024.
      expect(latest(DATA.life_expectancy)?.year).toBe(2024);
    }
  });
});

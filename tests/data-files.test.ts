// Checks the committed data against the cached World Bank answers it was built from:
// every published value is carried over exactly, every empty value stays empty, and
// every median is the plain median of same-year values of the group's countries.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTRY, DEFAULT_PEERS, INDICATORS, MEDIAN_GROUP } from '../scripts/indicators.ts';
import { countriesPath, medianPath, processedPath, rawPath } from '../scripts/lib/files.ts';
import { median, MEDIAN_MIN_COUNTRIES } from '../scripts/lib/median.ts';
import type { CountriesFile, DataRecord, MedianRecord } from '../src/data/types.ts';

const readJson = <T,>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;

type Row = { countryiso3code: string; date: string; value: number | null };
const countries = readJson<CountriesFile>(countriesPath());
const group = new Set(countries.countries.filter((c) => c.income_group === MEDIAN_GROUP).map((c) => c.id));

describe.each(INDICATORS)('$id', (config) => {
  const raw = readJson<{ response: [unknown, Row[]][] }>(rawPath(config.code, 'data'));
  const rows = raw.response.flatMap(([, r]) => r);
  const shown = new Set(config.scope === 'compare' ? [COUNTRY, ...DEFAULT_PEERS] : [COUNTRY]);
  const records = readJson<DataRecord[]>(processedPath(config.id));

  it('has exactly one record per shown country and year that has a published value', () => {
    const published = rows.filter((r) => r.value !== null && shown.has(r.countryiso3code));
    expect(records).toHaveLength(published.length);
    for (const r of published) {
      expect(records.find((rec) => rec.country === r.countryiso3code && rec.year === Number(r.date))?.value).toBe(r.value);
    }
  });

  it('has no record for any country and year the World Bank left empty', () => {
    for (const r of rows.filter((x) => x.value === null)) {
      expect(records.find((rec) => rec.country === r.countryiso3code && rec.year === Number(r.date))).toBeUndefined();
    }
  });

  it('only publishes Bangladesh and the default peers', () => {
    for (const r of records) expect(shown.has(r.country)).toBe(true);
  });

  if (config.scope === 'compare') {
    it('every median is recomputable from the raw answer', () => {
      const medians = readJson<MedianRecord[]>(medianPath(config.id));
      const byYear = new Map<number, number[]>();
      for (const r of rows) {
        if (r.value === null || !group.has(r.countryiso3code)) continue;
        byYear.set(Number(r.date), [...(byYear.get(Number(r.date)) ?? []), r.value]);
      }
      const expectedYears = [...byYear].filter(([, v]) => v.length >= MEDIAN_MIN_COUNTRIES).map(([y]) => y).sort();
      expect(medians.map((m) => m.year).sort()).toEqual(expectedYears);
      for (const m of medians) {
        expect(m.value).toBe(median(byYear.get(m.year)!));
        expect(m.inputs).toHaveLength(byYear.get(m.year)!.length);
      }
    });
  }
});

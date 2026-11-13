// Milestone 5: the rules behind "Compare with other countries" and "Bangladesh over time".
// Made-up test values except where real data files are read.
import { describe, expect, it } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { buildWorld, validateEvents, validateWorld } from '../scripts/lib/world.ts';
import { approvedEvents } from '../src/data/measure.ts';
import {
  GROUPS,
  MAX_PICKED,
  availability,
  chartForm,
  multiCountryUrl,
  niceTicks,
  presetCountries,
  rankHighestFirst,
  segments,
  shownRows,
  toCsv,
  toggleCountry,
  yearFraction,
} from '../src/data/picker.ts';
import type { CountryInfo, DataRecord, EventsFile, WorldFile, WorldRow } from '../src/data/types.ts';

const life = INDICATORS.find((i) => i.id === 'life_expectancy')!;
const country = (id: string, income_group = 'LMC'): CountryInfo => ({ id, iso2: id.slice(0, 2), name: id, region: 'x', income_group, income_group_name: 'x' });
const row = (c: string, value: number, notes: string[] = []): WorldRow => ({ country: c, year: 2024, value, notes, measured_by: null, source_url: `https://data.worldbank.org/indicator/X?locations=${c}` });
const world = (rows: WorldRow[]): WorldFile => ({
  indicator_id: 'life_expectancy',
  code: 'SP.DYN.LE00.IN',
  unit: 'years',
  since: 2016,
  source_name: 'World Bank, World Development Indicators',
  original_source: 'x',
  definition_url: 'https://x',
  api_url: 'https://x',
  retrieved_at: '2026-11-13',
  rows,
});

describe('ranking among the countries shown (calculated by this site)', () => {
  it('ranks highest first; equal values share a rank (1, 2, 2, 4)', () => {
    const r = rankHighestFirst([
      { country: 'A', value: 5 },
      { country: 'B', value: 9 },
      { country: 'C', value: 7 },
      { country: 'D', value: 7 },
    ]);
    expect(r.map((x) => `${x.country}${x.rank}`)).toEqual(['B1', 'C2', 'D2', 'A4']);
  });
  it('always includes Bangladesh, and leaves out countries that cannot be shown', () => {
    const w = world([row('BGD', 70), row('IND', 72), row('PAK', 66, ['An untranslated note'])]);
    const shown = shownRows(w, ['IND', 'PAK', 'NPL']);
    expect(shown.map((r) => r.country)).toEqual(['IND', 'BGD']);
    expect(shown[1]!.rank).toBe(2);
  });
});

describe('picking countries', () => {
  it('never goes beyond the limit and never adds Bangladesh', () => {
    const full = Array.from({ length: MAX_PICKED }, (_, i) => `C${i}`);
    expect(toggleCountry(full, 'NEW')).toEqual(full);
    expect(toggleCountry(['IND'], 'BGD')).toEqual(['IND']);
    expect(toggleCountry(['IND'], 'IND')).toEqual([]);
  });
  it('greys out countries with no recent value or an untranslated note', () => {
    expect(availability(undefined)).toBe('no_data');
    expect(availability(row('X', 1, ['Something new from the publisher']))).toBe('note_untranslated');
    expect(availability(row('X', 1, ['UIS Estimation']))).toBe('ok');
  });
});

describe('presets', () => {
  const countries = ['BGD', 'IND', 'PAK', 'NPL', 'LKA', 'BTN', 'MDV', 'AFG', 'MMR', 'THA'].map((c) => country(c));
  const w = world(countries.map((c) => row(c.id, 60)));
  it('South Asia is the SAARC members, Neighbours the BIMSTEC members, without Bangladesh', () => {
    expect(presetCountries('south_asia', countries, [], w, null).picked.sort()).toEqual(GROUPS.south_asia.members.filter((c) => c !== 'BGD').sort());
    expect(presetCountries('neighbours', countries, [], w, null).picked.sort()).toEqual(GROUPS.neighbours.members.filter((c) => c !== 'BGD').sort());
  });
  it('names the group members that have no value', () => {
    const r = presetCountries('south_asia', countries, [], world([row('BGD', 60), row('IND', 61)]), null);
    expect(r.picked).toEqual(['IND']);
    expect(r.unavailable).toContain('PAK');
  });
  it('Similar income keeps the 10 nearest by GDP per person (PPP) when there are more', () => {
    const many = ['BGD', ...Array.from({ length: 15 }, (_, i) => `L${String(i).padStart(2, '0')}`)].map((c) => country(c));
    const lw = world(many.map((c) => row(c.id, 60)));
    // L00 … L14 sit 1, 2, … 15 thousand dollars away from Bangladesh.
    const ppp = world([row('BGD', 9000), ...many.slice(1).map((c, i) => row(c.id, 9000 + (i + 1) * 1000 * (i % 2 ? 1 : -1)))]);
    const r = presetCountries('income', many, [], lw, ppp);
    expect(r.trimmed).toBe(true);
    expect(r.picked).toHaveLength(MAX_PICKED);
    expect(r.picked).toEqual(many.slice(1, 11).map((c) => c.id));
  });
});

describe('chart rules', () => {
  it('uses dots where zero is not a meaningful start, bars elsewhere', () => {
    expect(chartForm('life_expectancy')).toBe('dots');
    expect(chartForm('literacy')).toBe('dots');
    expect(chartForm('under5_mortality')).toBe('bars');
    expect(chartForm('poverty_intl')).toBe('bars');
  });
  it('round ticks cover the values', () => {
    const t = niceTicks(0, 57.3);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]!).toBeGreaterThanOrEqual(57.3);
  });
  it('breaks the line at a missing year and never bridges it', () => {
    const pts = [2000, 2001, 2002, 2005, 2006, 2009].map((year) => ({ year }));
    expect(segments(pts).map((s) => s.map((p) => p.year))).toEqual([[2000, 2001, 2002], [2005, 2006], [2009]]);
  });
  it('places a date within its year', () => {
    expect(yearFraction('2024-01-01')).toBe(2024);
    expect(yearFraction('2024-08-08')).toBeGreaterThan(2024.5);
  });
});

describe('source links and CSV', () => {
  it('the source link carries every country shown', () => {
    const countries = [{ ...country('BGD'), iso2: 'BD' }, { ...country('IND'), iso2: 'IN' }];
    expect(multiCountryUrl('SP.DYN.LE00.IN', ['BGD', 'IND'], countries)).toBe('https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=BD-IN');
  });
  it('the CSV has the columns section 12 asks for, one row per country, values as published', () => {
    const rows = shownRows(world([row('BGD', 74.912), row('IND', 72.2)]), ['IND']);
    const csv = toCsv(rows, (id) => id).split('\r\n');
    expect(csv[0]).toBe('country,country_code,year,value,unit,source_name,source_url,retrieved_at,notes');
    expect(csv).toHaveLength(3);
    expect(csv[1]).toContain('"74.912"');
  });
});

describe('every-country file', () => {
  const rec = (c: string, year: number, value: number, notes: string[] = []): DataRecord => ({
    indicator_id: 'life_expectancy', country: c, year, value, unit: 'years', source_name: 'World Bank, World Development Indicators', original_source: 'x',
    source_url: 'https://x', definition_url: 'https://x', api_url: 'https://x', retrieved_at: '2026-11-13', notes, measured_by: null,
  });
  const countries = [country('BGD'), country('IND')];
  const all = { request_url: 'https://api', retrieved_at: '2026-11-13', total_rows: 5, rows: [
    { c: 'BGD', y: 2023, v: 74 }, { c: 'BGD', y: 2024, v: 74.9, n: 'UIS Estimation' }, { c: 'IND', y: 2015, v: 68 }, { c: 'SAS', y: 2024, v: 70 },
  ] };
  const w = buildWorld({ config: life, all, countries, since: 2016, sample: rec('BGD', 2024, 74.9), specialNotes: new Map() });
  it('keeps each real country\'s newest value since the cut-off, with its note, and no aggregates', () => {
    expect(w.rows.map((r) => [r.country, r.year, r.value, r.notes])).toEqual([['BGD', 2024, 74.9, ['UIS Estimation']]]);
  });
  it('must agree with the records already published for Bangladesh and the peers', () => {
    expect(validateWorld(life, w, [rec('BGD', 2024, 74.9, ['UIS Estimation'])])).toEqual([]);
    expect(validateWorld(life, w, [rec('BGD', 2024, 75, ['UIS Estimation'])]).join()).toMatch(/differs/);
  });
});

describe('events (DECISIONS.md 88)', () => {
  const event = {
    id: 'e1', date: '2024-08-08', kind: 'political' as const, label: { en: 'x', bn: 'y' },
    source_name: { en: 'x', bn: 'y' }, source_url: 'https://x', checked_at: '2026-11-14',
  };
  it('shows no event until the whole list is approved', () => {
    const file: EventsFile = { approved: false, approved_at: null, events: [event] };
    expect(approvedEvents(file)).toEqual([]);
    expect(approvedEvents({ ...file, approved: true, approved_at: '2026-11-14' })).toHaveLength(1);
    // The real list (data/events.json) is approved and valid.
    expect(approvedEvents().length).toBeGreaterThan(0);
  });
  it('every event needs a date, both labels and a source', () => {
    expect(validateEvents({ approved: false, approved_at: null, events: [event] })).toEqual([]);
    expect(validateEvents({ approved: false, approved_at: null, events: [{ ...event, date: '2024-13-01', source_url: '' }] })).toHaveLength(2);
    expect(validateEvents({ approved: true, approved_at: null, events: [] })).toHaveLength(1);
  });
});

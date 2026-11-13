// Tests for normalise, validate and the median. The responses below are made-up test
// fixtures shaped like World Bank answers; they are never written to the site's data.
import { describe, expect, it } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { buildMedians, median, MEDIAN_MIN_COUNTRIES } from '../scripts/lib/median.ts';
import { compareWithPrevious, validateMedians, validateRecords } from '../scripts/lib/validate.ts';
import {
  normalise,
  parseCountryList,
  parseCountryMeta,
  type CountryMeta,
  type NormaliseContext,
  type RawResponse,
} from '../scripts/lib/worldbank.ts';
import type { CountryInfo } from '../src/data/types.ts';

const gdp = INDICATORS.find((i) => i.id === 'gdp_pc_taka')!;
const inflation = INDICATORS.find((i) => i.id === 'inflation')!;
const poverty = INDICATORS.find((i) => i.id === 'poverty_intl')!;

const raw = (response: unknown): RawResponse => ({ retrieved_at: '2026-01-01', request_url: 'https://x', response });

const metaFor = (code: string, name: string) =>
  raw([
    { page: 1, pages: 1, total: 1 },
    [{ id: code, name, source: { id: '2', value: 'World Development Indicators' }, sourceOrganization: 'Test org' }],
  ]);

type Row = [country: string, date: string, value: number | null, footnote?: string];
const dataFor = (code: string, rows: Row[]) =>
  raw([
    [
      { page: 1, pages: 1, total: rows.length, lastupdated: '2026-01-01' },
      rows.map(([country, date, value, footnote]) => ({ indicator: { id: code }, countryiso3code: country, date, value, footnote: footnote ?? '' })),
    ],
  ]);

const taka: CountryMeta = { currencyUnit: 'Bangladeshi taka', specialNotes: 'Fiscal year note.' };
const ctx = (meta: CountryMeta = taka, countries = ['BGD', 'IND']): NormaliseContext => ({
  countries,
  iso2: new Map([
    ['BGD', 'BD'],
    ['IND', 'IN'],
  ]),
  countryMeta: new Map([
    ['BGD', meta],
    ['IND', { currencyUnit: 'Indian rupee', specialNotes: 'India note.' }],
  ]),
});

describe('normalise', () => {
  it('builds records with full provenance for each country and skips missing years', () => {
    const { records } = normalise(
      inflation,
      metaFor(inflation.code, inflation.expectedName),
      dataFor(inflation.code, [['BGD', '2021', 5], ['BGD', '2020', null], ['BGD', '2019', 4], ['IND', '2021', 6]]),
      ctx(),
    );
    expect(records.map((r) => `${r.country}${r.year}`)).toEqual(['BGD2019', 'BGD2021', 'IND2021']);
    expect(records[0]).toMatchObject({
      indicator_id: 'inflation',
      country: 'BGD',
      unit: 'percent',
      source_name: 'World Bank, World Development Indicators',
      original_source: 'Test org',
      source_url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=BD',
      api_url: 'https://api.worldbank.org/v2/country/BGD/indicator/FP.CPI.TOTL.ZG?format=json',
      retrieved_at: '2026-01-01',
      notes: [],
    });
    expect(records[2]!.source_url).toBe('https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN');
  });

  it('keeps footnotes word for word', () => {
    const { records } = normalise(
      inflation,
      metaFor(inflation.code, inflation.expectedName),
      dataFor(inflation.code, [['BGD', '2021', 5, 'A note.']]),
      ctx(),
    );
    expect(records[0]!.notes).toEqual(['A note.']);
  });

  it("attaches each country's own note to national accounts series only", () => {
    const g = normalise(gdp, metaFor(gdp.code, gdp.expectedName), dataFor(gdp.code, [['BGD', '2021', 100]]), ctx());
    expect(g.records[0]!.notes).toEqual(['Fiscal year note.']);
  });

  it('reads the poverty line from the series name', () => {
    const p = normalise(poverty, metaFor(poverty.code, poverty.expectedName), dataFor(poverty.code, []), ctx());
    expect(p.params).toEqual({ line: '$3.00', ppp_year: '2021' });
  });

  it('fails on a row for a country that was not asked for', () => {
    expect(() =>
      normalise(inflation, metaFor(inflation.code, inflation.expectedName), dataFor(inflation.code, [['PAK', '2021', 5]]), ctx()),
    ).toThrow(/unexpected row/);
  });

  it('fails on two rows for the same country and year', () => {
    expect(() =>
      normalise(
        inflation,
        metaFor(inflation.code, inflation.expectedName),
        dataFor(inflation.code, [['BGD', '2021', 5], ['BGD', '2021', 6]]),
        ctx(),
      ),
    ).toThrow(/two rows/);
  });

  it('fails if the World Bank series name (and so maybe the unit) changed', () => {
    expect(() => normalise(inflation, metaFor(inflation.code, 'Inflation (something else)'), dataFor(inflation.code, []), ctx())).toThrow(
      /name changed/,
    );
  });

  it('fails if the local currency is not taka', () => {
    expect(() =>
      normalise(gdp, metaFor(gdp.code, gdp.expectedName), dataFor(gdp.code, [['BGD', '2021', 1]]), ctx({ currencyUnit: 'Something else', specialNotes: null })),
    ).toThrow(/currency unit/);
  });

  it('fails if a page is missing, so no year can disappear silently', () => {
    const onePage = raw([
      [{ page: 1, pages: 2, total: 2 }, [{ indicator: { id: inflation.code }, countryiso3code: 'BGD', date: '2021', value: 5 }]],
    ]);
    expect(() => normalise(inflation, metaFor(inflation.code, inflation.expectedName), onePage, ctx())).toThrow(/1 of 2 pages/);
  });

  it('fails on a World Bank error message', () => {
    expect(() => normalise(inflation, raw([{ message: [{ id: '120', value: 'Invalid value' }] }]), dataFor(inflation.code, []), ctx())).toThrow(
      /unexpected World Bank response/,
    );
  });
});

const metaAnswer = (variables: { id: string; metatype: { id: string; value: string }[] }[]) =>
  raw({ source: [{ concept: [{ variable: variables }] }] });

describe('parseCountryMeta', () => {
  it('reads currency and special notes for each country', () => {
    const m = parseCountryMeta(
      metaAnswer([
        { id: 'BGD', metatype: [{ id: 'CurrencyUnit', value: 'Bangladeshi taka' }, { id: 'SpecialNotes', value: 'Note.' }] },
        { id: 'IND', metatype: [{ id: 'CurrencyUnit', value: 'Indian rupee' }, { id: 'SpecialNotes', value: '' }] },
      ]),
      ['BGD', 'IND'],
    );
    expect(m.get('BGD')).toEqual({ currencyUnit: 'Bangladeshi taka', specialNotes: 'Note.' });
    expect(m.get('IND')).toEqual({ currencyUnit: 'Indian rupee', specialNotes: null });
  });
  it('fails if a country is missing', () => {
    expect(() => parseCountryMeta(metaAnswer([{ id: 'BGD', metatype: [{ id: 'CurrencyUnit', value: 'Bangladeshi taka' }] }]), ['BGD', 'IND'])).toThrow(
      /no entry for IND/,
    );
  });
  it('fails on an unexpected shape', () => {
    expect(() => parseCountryMeta(raw({}), ['BGD'])).toThrow();
  });
});

describe('parseCountryList', () => {
  const c = (id: string, iso2: string, region: string, income: string) => ({
    id,
    iso2Code: iso2,
    name: id,
    region: { id: region, value: region },
    incomeLevel: { id: income, value: income },
  });
  it('drops aggregates and reads income groups from the source', () => {
    const rows = [c('SAS', '8S', 'NA', 'NA'), ...Array.from({ length: 160 }, (_, i) => c(`A${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`, `${String.fromCharCode(65 + (i % 26))}${i % 10}`, 'X', i % 2 ? 'LMC' : 'UMC'))];
    const list = parseCountryList(raw([{ page: 1, pages: 1, total: rows.length }, rows]));
    expect(list).toHaveLength(160);
    expect(list.some((x) => x.id === 'SAS')).toBe(false);
    expect(list.filter((x) => x.income_group === 'LMC')).toHaveLength(80);
  });
});

const records = (pairs: [number, number][], country = 'BGD') =>
  normalise(
    inflation,
    metaFor(inflation.code, inflation.expectedName),
    dataFor(inflation.code, pairs.map(([y, v]) => [country, String(y), v])),
    ctx(),
  ).records;

describe('validateRecords', () => {
  it('passes good records', () => {
    expect(validateRecords(inflation, [...records([[2020, 5], [2021, 6]]), ...records([[2020, 7]], 'IND')])).toEqual([]);
  });
  it('flags a missing source_url', () => {
    const rs = records([[2020, 5]]).map((r) => ({ ...r, source_url: '' }));
    expect(validateRecords(inflation, rs).join()).toMatch(/source_url/);
  });
  it('flags values outside the plausible range', () => {
    expect(validateRecords(inflation, records([[2020, 5000]])).join()).toMatch(/plausible range/);
  });
  it('flags a duplicate country and year', () => {
    const r = records([[2020, 5]]);
    expect(validateRecords(inflation, [...r, ...r]).join()).toMatch(/duplicate/);
  });
  it('flags an empty answer', () => {
    expect(validateRecords(inflation, [])).toEqual(['inflation: no data returned']);
  });
});

describe('compareWithPrevious', () => {
  const prev = records([[2016, 1], [2017, 2], [2018, 3], [2019, 4], [2020, 5]]);

  it('accepts a new year with no revisions', () => {
    const next = records([[2016, 1], [2017, 2], [2018, 3], [2019, 4], [2020, 5], [2021, 6]]);
    expect(compareWithPrevious(inflation, prev, next)).toEqual({ problems: [], changed: true });
  });
  it('accepts a new country', () => {
    const next = [...prev, ...records([[2020, 9]], 'IND')];
    expect(compareWithPrevious(inflation, prev, next)).toEqual({ problems: [], changed: true });
  });
  it('reports no change when nothing changed', () => {
    expect(compareWithPrevious(inflation, prev, prev)).toEqual({ problems: [], changed: false });
  });
  it('flags a year going backwards', () => {
    const next = records([[2016, 1], [2017, 2], [2018, 3], [2019, 4]]);
    expect(compareWithPrevious(inflation, prev, next).problems.join()).toMatch(/went backwards/);
  });
  it('flags a country disappearing', () => {
    const before = [...prev, ...records([[2020, 9]], 'IND')];
    expect(compareWithPrevious(inflation, before, prev).problems.join()).toMatch(/IND: all data disappeared/);
  });
  it('flags more than 20% of values changing for human review', () => {
    const next = records([[2016, 9], [2017, 9], [2018, 3], [2019, 4], [2020, 5]]);
    expect(compareWithPrevious(inflation, prev, next).problems.join()).toMatch(/human to review/);
  });
  it('flags a unit change', () => {
    const next = prev.map((r) => ({ ...r, unit: 'years' as const }));
    expect(compareWithPrevious(inflation, prev, next).problems.join()).toMatch(/unit changed/);
  });
});

describe('median', () => {
  it('takes the middle value, or the average of the two middle values', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  const members: CountryInfo[] = Array.from({ length: 12 }, (_, i) => ({
    id: `C${String.fromCharCode(65 + i)}${String.fromCharCode(65 + i)}`,
    iso2: `${String.fromCharCode(65 + i)}1`,
    name: 'x',
    region: 'x',
    income_group: 'LMC',
    income_group_name: 'Lower middle income',
  }));
  const rec = (country: string, year: number, value: number) => ({ ...records([[year, value]])[0]!, country });
  const cls = { url: 'https://example.org/classification', retrieved_at: '2026-01-01' };

  it('uses only same-year values of group members and lists every input', () => {
    const rs = [
      ...members.map((m, i) => rec(m.id, 2020, i + 1)), // 12 values: 1..12
      rec('ZZZ', 2020, 1000), // not a member: ignored
    ];
    const [m] = buildMedians(inflation, rs, members, cls);
    expect(m).toMatchObject({ year: 2020, value: 6.5, calculated_by_site: true, group: 'LMC' });
    expect(m!.inputs).toHaveLength(12);
    expect(m!.inputs_source_url).toContain('FP.CPI.TOTL.ZG?locations=');
    expect(validateMedians(inflation, [m!])).toEqual([]);
  });

  it(`gives no median for a year with fewer than ${MEDIAN_MIN_COUNTRIES} countries (nothing is filled in)`, () => {
    const rs = members.slice(0, MEDIAN_MIN_COUNTRIES - 1).map((m) => rec(m.id, 2020, 1));
    expect(buildMedians(inflation, rs, members, cls)).toEqual([]);
  });

  it('validation catches a median that does not match its inputs', () => {
    const [m] = buildMedians(inflation, members.map((x, i) => rec(x.id, 2020, i)), members, cls);
    expect(validateMedians(inflation, [{ ...m!, value: 99 }]).join()).toMatch(/not the median/);
  });
});

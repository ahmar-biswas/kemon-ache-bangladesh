// Tests for normalise and validate. The responses below are made-up test fixtures
// shaped like World Bank answers; they are never written to the site's data.
import { describe, expect, it } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { compareWithPrevious, validateRecords } from '../scripts/lib/validate.ts';
import { normalise, parseCountryMeta, type CountryMeta, type RawResponse } from '../scripts/lib/worldbank.ts';

const gdp = INDICATORS.find((i) => i.id === 'gdp_pc_taka')!;
const inflation = INDICATORS.find((i) => i.id === 'inflation')!;

const raw = (response: unknown): RawResponse => ({ retrieved_at: '2026-01-01', request_url: 'https://x', response });

const metaFor = (code: string, name: string) =>
  raw([
    { page: 1, pages: 1, total: 1 },
    [{ id: code, name, source: { id: '2', value: 'World Development Indicators' }, sourceOrganization: 'Test org' }],
  ]);

const dataFor = (code: string, rows: [string, number | null][]) =>
  raw([
    [
      { page: 1, pages: 1, total: rows.length, lastupdated: '2026-01-01' },
      rows.map(([date, value]) => ({
        indicator: { id: code },
        countryiso3code: 'BGD',
        date,
        value,
        footnote: '',
      })),
    ],
  ]);

const taka: CountryMeta = { currencyUnit: 'Bangladeshi taka', specialNotes: 'Fiscal year note.' };

describe('normalise', () => {
  it('builds records with full provenance and skips missing years', () => {
    const { records } = normalise(
      inflation,
      metaFor(inflation.code, inflation.expectedName),
      dataFor(inflation.code, [['2021', 5], ['2020', null], ['2019', 4]]),
      taka,
    );
    expect(records.map((r) => r.year)).toEqual([2019, 2021]);
    expect(records[0]).toMatchObject({
      indicator_id: 'inflation',
      country: 'BGD',
      unit: 'percent',
      source_name: 'World Bank, World Development Indicators',
      original_source: 'Test org',
      source_url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=BD',
      retrieved_at: '2026-01-01',
      notes: [],
    });
  });

  it('attaches the country note to national accounts series only', () => {
    const g = normalise(gdp, metaFor(gdp.code, gdp.expectedName), dataFor(gdp.code, [['2021', 100]]), taka);
    expect(g.records[0]!.notes).toEqual(['Fiscal year note.']);
  });

  it('fails if the World Bank series name (and so maybe the unit) changed', () => {
    expect(() =>
      normalise(inflation, metaFor(inflation.code, 'Inflation (something else)'), dataFor(inflation.code, []), taka),
    ).toThrow(/name changed/);
  });

  it('fails if the local currency is not taka', () => {
    expect(() =>
      normalise(gdp, metaFor(gdp.code, gdp.expectedName), dataFor(gdp.code, [['2021', 1]]), {
        currencyUnit: 'Something else',
        specialNotes: null,
      }),
    ).toThrow(/currency unit/);
  });

  it('fails if a page is missing, so no year can disappear silently', () => {
    const onePage = raw([
      [{ page: 1, pages: 2, total: 2 }, [{ indicator: { id: inflation.code }, countryiso3code: 'BGD', date: '2021', value: 5 }]],
    ]);
    expect(() => normalise(inflation, metaFor(inflation.code, inflation.expectedName), onePage, taka)).toThrow(/1 of 2 pages/);
  });

  it('fails on a World Bank error message', () => {
    expect(() =>
      normalise(inflation, raw([{ message: [{ id: '120', value: 'Invalid value' }] }]), dataFor(inflation.code, []), taka),
    ).toThrow(/unexpected World Bank response/);
  });
});

describe('parseCountryMeta', () => {
  it('reads currency and special notes', () => {
    const m = parseCountryMeta(
      raw({
        source: [
          {
            concept: [
              {
                variable: [
                  {
                    id: 'BGD',
                    metatype: [
                      { id: 'CurrencyUnit', value: 'Bangladeshi taka' },
                      { id: 'SpecialNotes', value: 'Note.' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(m).toEqual({ currencyUnit: 'Bangladeshi taka', specialNotes: 'Note.' });
  });
  it('fails on an unexpected shape', () => {
    expect(() => parseCountryMeta(raw({}))).toThrow();
  });
});

const records = (pairs: [number, number][]) =>
  normalise(
    inflation,
    metaFor(inflation.code, inflation.expectedName),
    dataFor(inflation.code, pairs.map(([y, v]) => [String(y), v])),
    taka,
  ).records;

describe('validateRecords', () => {
  it('passes good records', () => {
    expect(validateRecords(inflation, records([[2020, 5], [2021, 6]]))).toEqual([]);
  });
  it('flags a missing source_url', () => {
    const rs = records([[2020, 5]]).map((r) => ({ ...r, source_url: '' }));
    expect(validateRecords(inflation, rs).join()).toMatch(/source_url/);
  });
  it('flags values outside the plausible range', () => {
    expect(validateRecords(inflation, records([[2020, 5000]])).join()).toMatch(/plausible range/);
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
  it('reports no change when nothing changed', () => {
    expect(compareWithPrevious(inflation, prev, prev)).toEqual({ problems: [], changed: false });
  });
  it('flags a year going backwards', () => {
    const next = records([[2016, 1], [2017, 2], [2018, 3], [2019, 4]]);
    expect(compareWithPrevious(inflation, prev, next).problems.join()).toMatch(/went backwards/);
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

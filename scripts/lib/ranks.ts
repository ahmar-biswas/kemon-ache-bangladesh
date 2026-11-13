// Bangladesh's global rank on each comparable World Bank series (DECISIONS.md 67).
// "Calculated by this site": among all countries (not regional aggregates) that have a value
// for the same year as Bangladesh's latest value. 1 = highest value. Equal values share a rank
// (1, 2, 2, 4). Nothing is filled in: a country with no value that year is simply not counted.
import type { CountryInfo, RankDetail } from '../../src/data/types.ts';
import { COUNTRY, type IndicatorConfig } from '../indicators.ts';
import { rankHighestFirst } from '../../src/data/picker.ts';
import type { RawResponse } from './worldbank.ts';

/** One published value (compact copy of the World Bank answer for all countries, recent years). */
export interface CompactRow {
  c: string;
  y: number;
  v: number;
  /** The publisher's footnote for this value, word for word (absent when there is none). */
  n?: string;
}

/** The saved copy (data/raw/<CODE>.all.json): request, date, and every non-empty value. */
export interface AllCountriesRaw {
  request_url: string;
  retrieved_at: string;
  total_rows: number;
  rows: CompactRow[];
}

interface WbRow {
  indicator: { id: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  footnote?: string;
}

/** Turns the page answers into the compact copy. Checks pages add up, like normalise does. */
export function compactAll(config: IndicatorConfig, raw: RawResponse): AllCountriesRaw {
  const pages = raw.response as [{ page: number; pages: number; total: number }, WbRow[]][];
  if (!Array.isArray(pages) || pages.length === 0) throw new Error(`${config.code} all countries: no pages`);
  const total = pages[0]![0].total;
  const rows = pages.flatMap(([, r]) => r ?? []);
  if (pages.length !== pages[0]![0].pages) throw new Error(`${config.code} all countries: got ${pages.length} of ${pages[0]![0].pages} pages`);
  if (rows.length !== total) throw new Error(`${config.code} all countries: got ${rows.length} rows; World Bank says ${total}`);
  const out: CompactRow[] = [];
  for (const r of rows) {
    if (r.indicator.id !== config.code) throw new Error(`${config.code} all countries: unexpected row for ${r.indicator.id}`);
    if (r.value === null || !r.countryiso3code) continue;
    const note = r.footnote?.trim() ? r.footnote : undefined;
    out.push({ c: r.countryiso3code, y: Number(r.date), v: r.value, ...(note ? { n: note } : {}) });
  }
  out.sort((a, b) => a.c.localeCompare(b.c) || a.y - b.y);
  return { request_url: raw.request_url, retrieved_at: raw.retrieved_at, total_rows: total, rows: out };
}

/** A global rank is shown only if at least this many countries have a value for that year. */
export const MIN_RANKED = 20;

// One ranking rule for the whole site: the same function the charts use.
export { rankHighestFirst };

export function buildRank(
  config: IndicatorConfig,
  all: AllCountriesRaw,
  countries: CountryInfo[],
  bangladeshYear: number,
  sourceName: string,
): RankDetail | null {
  const real = new Set(countries.map((c) => c.id));
  const sameYear = all.rows.filter((r) => r.y === bangladeshYear && real.has(r.c)).map((r) => ({ country: r.c, value: r.v }));
  const ranked = rankHighestFirst(sameYear);
  const bgd = ranked.find((r) => r.country === COUNTRY);
  // Too few countries that year for a global rank to mean much: show no rank (see DECISIONS.md).
  if (!bgd || ranked.length < MIN_RANKED) return null;
  const iso2 = new Map(countries.map((c) => [c.id, c.iso2]));
  return {
    indicator_id: config.id,
    kind: 'calculated',
    year: bangladeshYear,
    rank: bgd.rank,
    out_of: ranked.length,
    order: 'highest_first',
    source_name: sourceName,
    // World Bank page for this indicator (all countries); the list itself is in the rank file.
    source_url: `https://data.worldbank.org/indicator/${config.code}?year=${bangladeshYear}`,
    retrieved_at: all.retrieved_at,
    values: ranked.map((r) => ({ ...r, country: r.country })).filter((r) => iso2.has(r.country)),
  };
}

export function validateRank(config: IndicatorConfig, r: RankDetail): string[] {
  const p: string[] = [];
  if (r.rank < 1 || r.rank > r.out_of) p.push(`${config.id} rank: ${r.rank} of ${r.out_of}`);
  if (r.values.length !== r.out_of) p.push(`${config.id} rank: list has ${r.values.length} entries, out_of is ${r.out_of}`);
  return p;
}

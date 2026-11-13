// Rules behind "Compare with other countries" (DECISIONS.md 87). Pure functions, no display.
// Everything is either a published value or simple counting ("Calculated by this site", R4).
import { matchNote } from './notes.ts';
import type { CountryInfo, DataRecord, WorldFile, WorldRow } from './types.ts';

export const HOME = 'BGD';
/** At most this many countries beside Bangladesh (8.2: the chart must stay readable). */
export const MAX_PICKED = 10;

/**
 * Groups Ahmar chose (2026-11-13), each read from the group's own website on 2026-11-14:
 *  South Asia = the eight SAARC Member States; Neighbours = the seven BIMSTEC Member States
 *  around the Bay of Bengal. Bangladesh is a member of both and is always shown anyway.
 */
export const GROUPS = {
  south_asia: {
    members: ['AFG', 'BGD', 'BTN', 'IND', 'MDV', 'NPL', 'PAK', 'LKA'],
    source_url: 'https://www.saarc-sec.org/',
  },
  neighbours: {
    members: ['BGD', 'BTN', 'IND', 'MMR', 'NPL', 'LKA', 'THA'],
    source_url: 'https://bimstec.org/member-states',
  },
} as const;

export type Preset = 'default' | 'south_asia' | 'income' | 'neighbours';
export const PRESETS: readonly Preset[] = ['default', 'south_asia', 'income', 'neighbours'];

/**
 * Chart form (Ahmar's "mixed" choice): ranked dots where zero is not a meaningful starting
 * point (life expectancy, literacy, enrolment); ranked bars from zero everywhere else.
 */
const DOT_FORM = new Set(['life_expectancy', 'literacy', 'secondary_enrol', 'secondary_enrol_female', 'secondary_enrol_male']);
export const chartForm = (indicatorId: string): 'dots' | 'bars' => (DOT_FORM.has(indicatorId) ? 'dots' : 'bars');

export type Availability = 'ok' | 'no_data' | 'note_untranslated';

/**
 * Can this country be picked for this measure?
 *  - no_data: no published value in the last 10 years (section 5.5).
 *  - note_untranslated: the publisher attaches a note to the value that this site cannot yet
 *    show in both languages. The value is not shown without its note (rules R7 and R8).
 */
export function availability(row: WorldRow | undefined): Availability {
  if (!row) return 'no_data';
  return row.notes.every((n) => matchNote(n) !== null) ? 'ok' : 'note_untranslated';
}

export const rowsByCountry = (world: WorldFile) => new Map(world.rows.map((r) => [r.country, r]));

/** Competition ranking, highest value first: equal values share a rank (1, 2, 2, 4). */
export function rankHighestFirst<T extends { country: string; value: number }>(values: T[]): (T & { rank: number })[] {
  const sorted = [...values].sort((a, b) => b.value - a.value || a.country.localeCompare(b.country));
  let lastValue = Number.NaN;
  let lastRank = 0;
  return sorted.map((v, i) => {
    const rank = v.value === lastValue ? lastRank : i + 1;
    lastValue = v.value;
    lastRank = rank;
    return { ...v, rank };
  });
}

export interface PresetResult {
  /** Countries to show (never Bangladesh itself), at most MAX_PICKED. */
  picked: string[];
  /** Countries the preset names that cannot be shown for this measure. */
  unavailable: string[];
  /** For "income" only: true when the group was cut down to the nearest MAX_PICKED. */
  trimmed: boolean;
}

/**
 * The countries a preset stands for, for one measure.
 *  - default: the site's default comparison countries.
 *  - south_asia: the SAARC Member States (GROUPS).
 *  - income: the World Bank's income group of Bangladesh. When more than MAX_PICKED have data,
 *    the MAX_PICKED whose GDP per person (PPP) is nearest to Bangladesh's (a difference of two
 *    published values: "Calculated by this site").
 *  - neighbours: the BIMSTEC Member States around the Bay of Bengal (GROUPS).
 */
export function presetCountries(
  preset: Preset,
  countries: CountryInfo[],
  defaultPeers: readonly string[],
  world: WorldFile,
  ppp: WorldFile | null,
): PresetResult {
  const home = countries.find((c) => c.id === HOME);
  const rows = rowsByCountry(world);
  let candidates: string[];
  if (preset === 'default') candidates = [...defaultPeers];
  else if (preset === 'neighbours' || preset === 'south_asia') candidates = GROUPS[preset].members.filter((id) => id !== HOME);
  else candidates = countries.filter((c) => c.id !== HOME && c.income_group === home?.income_group).map((c) => c.id);

  const ok = candidates.filter((id) => availability(rows.get(id)) === 'ok');
  const unavailable = candidates.filter((id) => !ok.includes(id));
  if (ok.length <= MAX_PICKED) return { picked: ok, unavailable, trimmed: false };

  // Too many to show: keep those nearest to Bangladesh by GDP per person (PPP).
  const pppRows = ppp ? rowsByCountry(ppp) : new Map<string, WorldRow>();
  const homePpp = pppRows.get(HOME)?.value;
  if (homePpp === undefined) return { picked: ok.slice(0, MAX_PICKED), unavailable, trimmed: true };
  const nearest = ok
    .filter((id) => pppRows.has(id))
    .map((id) => ({ id, gap: Math.abs(pppRows.get(id)!.value - homePpp) }))
    .sort((a, b) => a.gap - b.gap || a.id.localeCompare(b.id))
    .slice(0, MAX_PICKED)
    .map((x) => x.id);
  return { picked: nearest, unavailable, trimmed: true };
}

/** Adds or removes a country, never beyond MAX_PICKED and never Bangladesh. */
export function toggleCountry(picked: readonly string[], id: string): string[] {
  if (id === HOME) return [...picked];
  if (picked.includes(id)) return picked.filter((c) => c !== id);
  if (picked.length >= MAX_PICKED) return [...picked];
  return [...picked, id];
}

/** A chart row in the full record shape, so the table, CSV and source line can use it. */
export function toRecord(world: WorldFile, row: WorldRow): DataRecord {
  return {
    indicator_id: world.indicator_id,
    country: row.country,
    year: row.year,
    value: row.value,
    unit: world.unit,
    source_name: world.source_name,
    original_source: world.original_source,
    source_url: row.source_url,
    definition_url: world.definition_url,
    api_url: world.api_url,
    retrieved_at: world.retrieved_at,
    notes: row.notes,
    measured_by: row.measured_by,
  };
}

/** Bangladesh and the picked countries that have a showable value, highest value first. */
export function shownRows(world: WorldFile, picked: readonly string[]): (DataRecord & { rank: number })[] {
  const rows = rowsByCountry(world);
  const list = [HOME, ...picked.filter((c) => c !== HOME)]
    .map((id) => rows.get(id))
    .filter((r): r is WorldRow => availability(r) === 'ok')
    .map((r) => toRecord(world, r));
  return rankHighestFirst(list);
}

/** World Bank page for this indicator showing every country in the chart (section 5.2). */
export function multiCountryUrl(code: string, ids: readonly string[], countries: CountryInfo[]): string {
  const iso2 = ids.map((id) => countries.find((c) => c.id === id)?.iso2).filter((x): x is string => !!x);
  return `https://data.worldbank.org/indicator/${code}?locations=${iso2.join('-')}`;
}

/** CSV with the columns section 12 asks for. Values are as published (no rounding). */
export function toCsv(rows: DataRecord[], countryName: (id: string) => string): string {
  const esc = (s: string | number | null) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['country', 'country_code', 'year', 'value', 'unit', 'source_name', 'source_url', 'retrieved_at', 'notes'];
  const body = rows.map((r) =>
    [countryName(r.country), r.country, r.year, r.value, r.unit, r.source_name, r.source_url, r.retrieved_at, r.notes.join(' | ')].map(esc).join(','),
  );
  return [head.join(','), ...body].join('\r\n');
}

/** Round tick values covering [lo, hi] (about `count` of them). The scale runs first to last tick. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
  }
  const raw = (hi - lo) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v < hi + step * 0.999; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

/** Decimals needed to print these ticks without losing their difference. */
export function tickDecimals(ticks: number[]): number {
  const step = ticks.length > 1 ? Math.abs(ticks[1]! - ticks[0]!) : 1;
  return step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step)));
}

/**
 * Line segments for a yearly series: consecutive years are joined; a missing year breaks the
 * line (section 12: gaps stay gaps, never bridged). A year with no neighbour is a lone point.
 */
export function segments<T extends { year: number }>(points: T[]): T[][] {
  const sorted = [...points].sort((a, b) => a.year - b.year);
  const out: T[][] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && last[last.length - 1]!.year === p.year - 1) last.push(p);
    else out.push([p]);
  }
  return out;
}

/** A date as a position on a year axis: 2024-07-01 is about 2024.5. */
export function yearFraction(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, d) - start) / (end - start);
}

// Milestone 5 data files (DECISIONS.md 89), all built from answers already downloaded:
//   world/<id>.json  every country's newest value in the last 10 years (the country picker);
//   trend/<id>.json  Bangladesh's full history ("Bangladesh over time");
//   details.json     the newest records and medians "The full picture" shows before a
//                    measure is opened, so that view no longer downloads every year of
//                    every country (rule R10).
// Nothing here is computed: values, years and notes are copied; only "newest year" is picked.
import type { CountryInfo, DataRecord, DetailsFile, EventsFile, MedianRecord, WorldFile, WorldRow } from '../../src/data/types.ts';
import { COUNTRY, DEFAULT_PEERS, type IndicatorConfig } from '../indicators.ts';
import type { AllCountriesRaw } from './ranks.ts';
import { measuredBy, urls } from './worldbank.ts';

export function buildWorld(args: {
  config: IndicatorConfig;
  all: AllCountriesRaw;
  countries: CountryInfo[];
  since: number;
  /** One record of this series (any country), for the source wording. */
  sample: DataRecord;
  /** WDI special notes by country, for national accounts series. */
  specialNotes: ReadonlyMap<string, string>;
}): WorldFile {
  const { config, all, countries, since, sample } = args;
  const iso2 = new Map(countries.map((c) => [c.id, c.iso2]));
  const u = urls(config.code);
  const newest = new Map<string, AllCountriesRaw['rows'][number]>();
  for (const r of all.rows) {
    // Real countries only: regional and income aggregates are not in the country list.
    if (!iso2.has(r.c) || r.y < since) continue;
    const best = newest.get(r.c);
    if (!best || r.y > best.y) newest.set(r.c, r);
  }
  const rows: WorldRow[] = [...newest.values()]
    .sort((a, b) => a.c.localeCompare(b.c))
    .map((r) => {
      const special = config.nationalAccounts ? args.specialNotes.get(r.c) : undefined;
      return {
        country: r.c,
        year: r.y,
        value: r.v,
        notes: [...(special ? [special] : []), ...(r.n ? [r.n] : [])],
        measured_by: measuredBy(r.n),
        source_url: u.page([iso2.get(r.c)!]),
      };
    });
  return {
    indicator_id: config.id,
    code: config.code,
    unit: config.unit,
    since,
    source_name: sample.source_name,
    original_source: sample.original_source,
    definition_url: u.definition,
    api_url: all.request_url,
    retrieved_at: all.retrieved_at,
    rows,
  };
}

/**
 * The world file must agree with the records the site already shows: for Bangladesh and the
 * default peers, the same newest year, value and notes. Otherwise the two downloads disagree
 * and a person should look before anything is published.
 */
export function validateWorld(config: IndicatorConfig, world: WorldFile, records: DataRecord[]): string[] {
  const p: string[] = [];
  const seen = new Set<string>();
  for (const r of world.rows) {
    const where = `${config.id} world ${r.country}`;
    if (seen.has(r.country)) p.push(`${where}: listed twice`);
    seen.add(r.country);
    if (!Number.isFinite(r.value)) p.push(`${where}: value is not a number`);
    if (!Number.isInteger(r.year) || r.year < world.since) p.push(`${where}: year ${r.year} is before ${world.since}`);
    if (!r.source_url.startsWith('https://') || !r.source_url.includes(config.code)) p.push(`${where}: missing or wrong source_url`);
  }
  for (const id of [COUNTRY, ...DEFAULT_PEERS]) {
    let own: DataRecord | undefined;
    for (const r of records) if (r.country === id && r.year >= world.since && (!own || r.year > own.year)) own = r;
    const w = world.rows.find((r) => r.country === id);
    if (!own && !w) continue;
    if (!own || !w) p.push(`${config.id} world ${id}: ${own ? 'missing from' : 'only in'} the all-countries answer`);
    else if (own.year !== w.year || own.value !== w.value) {
      p.push(`${config.id} world ${id}: ${w.value} (${w.year}) differs from the country's own record ${own.value} (${own.year})`);
    } else if (JSON.stringify(own.notes) !== JSON.stringify(w.notes)) {
      p.push(`${config.id} world ${id}: notes differ from the country's own record`);
    }
  }
  return p;
}

/** Bangladesh's records for one series, oldest first. */
export const buildTrend = (records: DataRecord[]): DataRecord[] =>
  records.filter((r) => r.country === COUNTRY).sort((a, b) => a.year - b.year);

/** Newest record per shown country (and Bangladesh's newest of all), plus the newest median. */
export function buildDetails(records: Record<string, DataRecord[]>, medians: Record<string, MedianRecord[]>, since: number): DetailsFile {
  const out: DetailsFile = { records: {}, medians: {} };
  for (const [id, list] of Object.entries(records)) {
    const newest = new Map<string, DataRecord>();
    for (const r of list) {
      // Bangladesh's own headline value may be older than the 10-year cut-off; peers' may not.
      if (r.country !== COUNTRY && r.year < since) continue;
      const best = newest.get(r.country);
      if (!best || r.year > best.year) newest.set(r.country, r);
    }
    out.records[id] = [...newest.values()].sort((a, b) => a.country.localeCompare(b.country));
  }
  for (const [id, list] of Object.entries(medians)) {
    const best = list.reduce<MedianRecord | null>((b, m) => (!b || m.year > b.year ? m : b), null);
    out.medians[id] = best ? [best] : [];
  }
  return out;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** data/events.json: every event dated, labelled in both languages and sourced (DECISIONS.md 88). */
export function validateEvents(file: EventsFile): string[] {
  const p: string[] = [];
  if (typeof file.approved !== 'boolean') p.push('events.json: "approved" must be true or false');
  if (file.approved && !ISO_DATE.test(file.approved_at ?? '')) p.push('events.json: approved without an approval date');
  const seen = new Set<string>();
  for (const e of file.events ?? []) {
    const where = `events.json ${e.id}`;
    if (!e.id || seen.has(e.id)) p.push(`${where}: missing or repeated id`);
    seen.add(e.id);
    if (!ISO_DATE.test(e.date) || Number.isNaN(Date.parse(`${e.date}T00:00:00Z`))) p.push(`${where}: bad date "${e.date}"`);
    if (e.kind !== 'political' && e.kind !== 'shock') p.push(`${where}: kind must be "political" or "shock"`);
    if (!e.label?.en?.trim() || !e.label?.bn?.trim()) p.push(`${where}: needs a label in English and Bangla`);
    if (!e.source_name?.en?.trim() || !e.source_name?.bn?.trim() || !/^https:\/\/\S+$/.test(e.source_url ?? '')) p.push(`${where}: needs a source name and an https link`);
    if (!ISO_DATE.test(e.checked_at ?? '')) p.push(`${where}: needs the date its source was checked`);
  }
  return p;
}

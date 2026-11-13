// Everything the /sources page lists for one measure (section 10; DECISIONS.md 114).
// It reads the same files the rest of the site shows, so every value shown anywhere is here:
//   trend/<id>.json   Bangladesh, every year ("Bangladesh over time")
//   <id>.json         Bangladesh and the default peers, every year (tiles, subsection charts)
//   world/<id>.json   every country's newest value ("Compare with other countries")
//   median/<id>.json  the lower-middle-income median, "Calculated by this site"
//   ranks/<id>.json   Bangladesh's world position, "Calculated by this site"
// Nothing is computed here: rows are only gathered and sorted.
import { loadSeries, loadTrend, loadWorld } from './measure.ts';
import type { DataRecord, IndicatorMeta, MedianRecord, RankDetail, WorldFile } from './types.ts';

const medianFiles = import.meta.glob<MedianRecord[]>('../../data/processed/median/*.json', { import: 'default' });
const rankFiles = import.meta.glob<RankDetail>('../../data/processed/ranks/*.json', { import: 'default' });

export interface SourceRow {
  country: string;
  year: number;
  value: number;
  notes: string[];
  measured_by: string | null;
  source_url: string;
}

export interface MeasureSources {
  /** Bangladesh, every published year, newest first. */
  bangladesh: SourceRow[];
  /** The default peers, every published year, by country then newest first. */
  peers: SourceRow[];
  /** Every country's newest value (the compare view's list), or null if this measure is not compared. */
  world: WorldFile | null;
  medians: MedianRecord[];
  rank: RankDetail | null;
  /** Provenance shared by the rows (from the first record found). */
  first: Pick<DataRecord, 'source_name' | 'original_source' | 'api_url' | 'retrieved_at' | 'source_url'> | null;
}

const toRow = (r: DataRecord | (SourceRow & object)): SourceRow => ({
  country: r.country,
  year: r.year,
  value: r.value,
  notes: r.notes,
  measured_by: r.measured_by,
  source_url: r.source_url,
});

const newestFirst = (a: SourceRow, b: SourceRow) => b.year - a.year;

export async function loadMeasureSources(meta: IndicatorMeta, peers: readonly string[]): Promise<MeasureSources> {
  const [trend, series, world, medians, rank] = await Promise.all([
    loadTrend(meta.id),
    loadSeries(meta.id),
    loadWorld(meta.id),
    medianFiles[`../../data/processed/median/${meta.id}.json`]?.() ?? Promise.resolve(null),
    rankFiles[`../../data/processed/ranks/${meta.id}.json`]?.() ?? Promise.resolve(null),
  ]);
  const all = series ?? [];
  // Bangladesh: the full history where there is one, plus any year only in the series file.
  const bgd = new Map<number, DataRecord>();
  for (const r of [...all.filter((r) => r.country === 'BGD'), ...(trend ?? [])]) bgd.set(r.year, r);
  const peerRows = all
    .filter((r) => peers.includes(r.country))
    .map(toRow)
    .sort((a, b) => peers.indexOf(a.country) - peers.indexOf(b.country) || newestFirst(a, b));
  const first = trend?.[0] ?? all[0] ?? null;
  return {
    bangladesh: [...bgd.values()].map(toRow).sort(newestFirst),
    peers: peerRows,
    world,
    medians: [...(medians ?? [])].sort((a, b) => b.year - a.year),
    rank,
    first,
  };
}

/** One CSV with every row listed for a measure. Values as published (no rounding). */
export function sourcesCsv(meta: IndicatorMeta, s: MeasureSources, countryName: (id: string) => string): string {
  const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['table', 'country', 'country_code', 'year', 'value', 'unit', 'source_name', 'source_url', 'definition_url', 'retrieved_at', 'notes'];
  const src = s.first;
  const line = (table: string, r: SourceRow, retrieved: string, sourceName: string) =>
    [table, countryName(r.country), r.country, r.year, r.value, meta.unit, sourceName, r.source_url, meta.definition_url, retrieved, r.notes.join(' | ')]
      .map(esc)
      .join(',');
  const rows = [
    ...s.bangladesh.map((r) => line('bangladesh_every_year', r, src?.retrieved_at ?? '', src?.source_name ?? '')),
    ...s.peers.map((r) => line('peers_every_year', r, src?.retrieved_at ?? '', src?.source_name ?? '')),
    ...(s.world?.rows ?? []).map((r) => line('every_country_latest', r, s.world!.retrieved_at, s.world!.source_name)),
    ...s.medians.map((m) =>
      [
        'median_calculated_by_this_site',
        'Median of lower-middle-income countries',
        '',
        m.year,
        m.value,
        m.unit,
        'Calculated by this site',
        m.inputs_source_url,
        meta.definition_url,
        m.retrieved_at,
        `median of ${m.inputs.length} values: ${m.inputs.map((i) => `${i.country} ${i.value}`).join('; ')}`,
      ]
        .map(esc)
        .join(','),
    ),
  ];
  return [head.join(','), ...rows].join('\r\n');
}

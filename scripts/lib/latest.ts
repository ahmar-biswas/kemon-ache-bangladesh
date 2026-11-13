// Builds data/processed/latest.json: everything the homepage shows, and nothing more, so the
// first page load stays small (rule R10). Every value here is copied from the full data files;
// nothing is computed except picking the newest year (and counts already made elsewhere).
import type {
  DataRecord,
  IndicatorMeta,
  LatestFile,
  LatestIndicator,
  MedianRecord,
  RankDetail,
  RankSummary,
  Target,
} from '../../src/data/types.ts';
import { COUNTRY, DEFAULT_PEERS } from '../indicators.ts';

function newest(records: DataRecord[], country: string, since = -Infinity): DataRecord | null {
  let best: DataRecord | null = null;
  for (const r of records) if (r.country === country && r.year >= since && (!best || r.year > best.year)) best = r;
  return best;
}

const summary = (r: RankDetail): RankSummary => {
  const { values: _values, ...rest } = r;
  return rest;
};

export function buildLatest(args: {
  lastChecked: string;
  metas: IndicatorMeta[];
  records: Record<string, DataRecord[]>;
  medians: Record<string, MedianRecord[]>;
  ranks: Record<string, RankDetail>;
  targets: Target[];
  /** English names as the World Bank writes them (Bangla names come from countries.bn.json). */
  names: Record<string, string>;
}): LatestFile {
  const since = Number(args.lastChecked.slice(0, 4)) - 10;
  const out: Record<string, LatestIndicator> = {};
  for (const meta of args.metas) {
    const own = args.records[meta.id] ?? [];
    const cmpId = meta.compare_id ?? (meta.scope === 'compare' ? meta.id : null);
    const cmp = cmpId ? args.records[cmpId] ?? [] : [];
    const points = cmpId
      ? [COUNTRY, ...DEFAULT_PEERS]
          .map((c) => newest(cmp, c, since))
          .filter((r): r is DataRecord => !!r)
          .map((r) => ({ country: r.country, year: r.year, value: r.value }))
      : [];
    const meds = cmpId ? args.medians[cmpId] ?? [] : [];
    const med = meds.reduce<MedianRecord | null>((b, m) => (!b || m.year > b.year ? m : b), null);

    // Published ranks (unit "rank") carry their own rank; others use the calculated one.
    const bgd = newest(own, COUNTRY);
    let rank: RankSummary | null = null;
    if (bgd?.unit === 'rank' && bgd.out_of) {
      rank = {
        indicator_id: meta.id,
        kind: 'published',
        year: bgd.year,
        rank: bgd.value,
        out_of: bgd.out_of,
        order: null,
        source_name: bgd.source_name,
        source_url: bgd.source_url,
        retrieved_at: bgd.retrieved_at,
      };
    } else if (cmpId && args.ranks[cmpId]) {
      rank = summary(args.ranks[cmpId]!);
    }

    out[meta.id] = {
      id: meta.id,
      unit: meta.unit,
      favourable_direction: meta.favourable_direction,
      bangladesh: bgd,
      compare_id: meta.compare_id,
      points,
      compare_bangladesh: meta.compare_id ? newest(cmp, COUNTRY, since) : null,
      median: med ? { year: med.year, value: med.value, n: med.inputs.length } : null,
      target: args.targets.find((t) => t.indicator_id === meta.id) ?? null,
      rank,
    };
  }
  const names = Object.fromEntries([COUNTRY, ...DEFAULT_PEERS].map((c) => [c, args.names[c] ?? c]));
  return { last_checked: args.lastChecked, since, default_peers: [...DEFAULT_PEERS], names, indicators: out };
}

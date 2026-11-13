// Comparing Bangladesh with its peers. Pure functions, no display.
// Everything here is either a published value or simple counting ("Calculated by this site", rule R4).
import type { DataRecord, FavourableDirection, MedianRecord } from './types.ts';

/** "In the last 10 years" (section 5.5): the year of the last data check minus 10, or later. */
export function recentSince(lastChecked: string): number {
  return Number(lastChecked.slice(0, 4)) - 10;
}

/** Each country's newest published record, if it is from `since` or later. Gaps are never filled. */
export function latestRecent(records: DataRecord[], countries: readonly string[], since: number): Map<string, DataRecord> {
  const out = new Map<string, DataRecord>();
  for (const r of records) {
    if (!countries.includes(r.country) || r.year < since) continue;
    const best = out.get(r.country);
    if (!best || r.year > best.year) out.set(r.country, r);
  }
  return out;
}

/** The newest median year, or undefined. */
export function latestMedian(medians: MedianRecord[] | undefined): MedianRecord | undefined {
  let best: MedianRecord | undefined;
  for (const m of medians ?? []) if (!best || m.year > best.year) best = m;
  return best;
}

export interface Position {
  /** Peers Bangladesh is ahead of, in the official target direction. */
  ahead: DataRecord[];
  behind: DataRecord[];
  equal: DataRecord[];
  /** Number of peers compared (those with a recent value). */
  m: number;
  /** Which wording the badge uses. */
  kind: 'ahead' | 'behind' | 'level';
  /** Ring fill: 1, 2 or 3 quarters, from the share of peers Bangladesh is ahead of. */
  quarters: 1 | 2 | 3;
}

/**
 * Counts peers on each side of Bangladesh. Only for indicators with an official target
 * direction ("higher" or "lower"); returns null for "context" or when nothing can be compared.
 */
export function position(direction: FavourableDirection, bgd: DataRecord | undefined, peers: DataRecord[]): Position | null {
  if (direction === 'context' || !bgd || peers.length === 0) return null;
  const isAhead = (p: DataRecord) => (direction === 'lower' ? p.value > bgd.value : p.value < bgd.value);
  const ahead = peers.filter((p) => p.value !== bgd.value && isAhead(p));
  const equal = peers.filter((p) => p.value === bgd.value);
  const behind = peers.filter((p) => p.value !== bgd.value && !isAhead(p));
  const m = peers.length;
  const kind = ahead.length > behind.length ? 'ahead' : behind.length > ahead.length ? 'behind' : 'level';
  const share = ahead.length / m;
  const quarters = share >= 0.625 ? 3 : share <= 0.375 ? 1 : 2;
  return { ahead, behind, equal, m, kind, quarters };
}

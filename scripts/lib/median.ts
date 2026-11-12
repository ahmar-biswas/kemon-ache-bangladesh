// The "median of lower-middle-income countries" reference line (section 5.5).
// Calculated by this site (rule R4): for each year, the middle value of the published
// values of every country in the group that has a value for that exact year.
// Years are never mixed and nothing is filled in.
import type { CountryInfo, DataRecord, MedianRecord } from '../../src/data/types.ts';
import { MEDIAN_GROUP, type IndicatorConfig } from '../indicators.ts';
import { urls } from './worldbank.ts';

/**
 * A year gets a median only if at least this many countries in the group have a value
 * for that year. With fewer, "the median of the group" would really describe only a
 * handful of countries. See DECISIONS.md.
 */
export const MEDIAN_MIN_COUNTRIES = 10;

/** Plain median: sort, take the middle value, or the average of the two middle values. */
export function median(values: number[]): number {
  if (values.length === 0) throw new Error('median of no values');
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function groupMembers(countries: CountryInfo[]): CountryInfo[] {
  return countries.filter((c) => c.income_group === MEDIAN_GROUP);
}

export function buildMedians(
  config: IndicatorConfig,
  records: DataRecord[],
  members: CountryInfo[],
  classification: { url: string; retrieved_at: string },
): MedianRecord[] {
  const inGroup = new Set(members.map((c) => c.id));
  const iso2 = new Map(members.map((c) => [c.id, c.iso2]));
  const byYear = new Map<number, DataRecord[]>();
  for (const r of records) {
    if (!inGroup.has(r.country)) continue;
    byYear.set(r.year, [...(byYear.get(r.year) ?? []), r]);
  }
  const out: MedianRecord[] = [];
  for (const [year, rs] of [...byYear].sort(([a], [b]) => a - b)) {
    if (rs.length < MEDIAN_MIN_COUNTRIES) continue;
    const inputs = rs.map((r) => ({ country: r.country, value: r.value })).sort((a, b) => a.country.localeCompare(b.country));
    out.push({
      indicator_id: config.id,
      year,
      value: median(inputs.map((i) => i.value)),
      unit: config.unit,
      calculated_by_site: true,
      formula: 'median',
      inputs,
      inputs_source_url: urls(config.code).page(inputs.map((i) => iso2.get(i.country)!)),
      source_name: rs[0]!.source_name,
      retrieved_at: rs.map((r) => r.retrieved_at).sort()[0]!,
      group: MEDIAN_GROUP,
      classification_url: classification.url,
      classification_retrieved_at: classification.retrieved_at,
    });
  }
  return out;
}

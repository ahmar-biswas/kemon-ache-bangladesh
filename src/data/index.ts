// The website's only way to get numbers: the generated JSON in data/processed/.
import type { DataMeta, DataRecord } from './types.ts';
import lifeExpectancy from '../../data/processed/life_expectancy.json';
import gdpPcTaka from '../../data/processed/gdp_pc_taka.json';
import inflation from '../../data/processed/inflation.json';
import metaJson from '../../data/processed/meta.json';

export const DATA: Record<string, DataRecord[]> = {
  life_expectancy: lifeExpectancy as DataRecord[],
  gdp_pc_taka: gdpPcTaka as DataRecord[],
  inflation: inflation as DataRecord[],
};

export const META = metaJson as DataMeta;

/** The most recent year with a published value, or undefined if there is none. Never fills gaps. */
export function latest(records: DataRecord[] | undefined, country = 'BGD'): DataRecord | undefined {
  let best: DataRecord | undefined;
  for (const r of records ?? []) {
    if (r.country === country && (!best || r.year > best.year)) best = r;
  }
  return best;
}

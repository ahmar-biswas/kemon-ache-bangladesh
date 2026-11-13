// What "The full picture" needs before a measure is opened: the newest record per country,
// the newest medians, the indicator descriptions and the country list. Loaded with that view
// only (R10). Each measure's own files load when its view opens (src/data/measure.ts).
import type { CountriesFile, DataRecord, DetailsFile, IndicatorMeta, MedianRecord } from './types.ts';
import countriesJson from '../../data/processed/countries.json';
import detailsJson from '../../data/processed/details.json';
import indicatorsJson from '../../data/processed/indicators.json';

const details = detailsJson as unknown as DetailsFile;

export const INDICATORS = indicatorsJson as IndicatorMeta[];
export const COUNTRIES = countriesJson as CountriesFile;
export const RECORDS: Record<string, DataRecord[]> = details.records;
export const MEDIANS: Record<string, MedianRecord[]> = details.medians;

export const indicatorMeta = (id: string) => INDICATORS.find((m) => m.id === id);

/** The series compared across countries for this measure (PPP dollars for a taka measure). */
export const compareIdFor = (meta: IndicatorMeta): string | null => meta.compare_id ?? (meta.scope === 'compare' ? meta.id : null);

/** The series drawn over time: constant taka for a current-taka measure (section 12). */
export function trendIdFor(meta: IndicatorMeta): string {
  if (meta.unit !== 'taka_current') return meta.id;
  const constant = INDICATORS.find((m) => m.unit === 'taka_constant' && m.explanation_id === meta.explanation_id);
  return constant?.id ?? meta.id;
}

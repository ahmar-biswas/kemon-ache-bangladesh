// Every P0 data file, for pages that show many indicators (the design preview now; the
// homepage and indicator pages later). Imported only by those pages, so Vite puts this data
// in its own chunk and the first page load stays small (rule R10).
import type { CountriesFile, DataRecord, IndicatorMeta, MedianRecord } from './types.ts';
import countriesJson from '../../data/processed/countries.json';
import indicatorsJson from '../../data/processed/indicators.json';

const records = import.meta.glob<DataRecord[]>(
  ['../../data/processed/*.json', '!**/countries.json', '!**/indicators.json', '!**/meta.json', '!**/latest.json', '!**/details.json'],
  { eager: true, import: 'default' },
);
const medians = import.meta.glob<MedianRecord[]>('../../data/processed/median/*.json', { eager: true, import: 'default' });

const byId = <T,>(files: Record<string, T>) =>
  Object.fromEntries(Object.entries(files).map(([path, v]) => [path.split('/').pop()!.replace('.json', ''), v]));

export const INDICATORS = indicatorsJson as IndicatorMeta[];
export const COUNTRIES = countriesJson as CountriesFile;
export const RECORDS: Record<string, DataRecord[]> = byId(records);
export const MEDIANS: Record<string, MedianRecord[]> = byId(medians);

export const indicatorMeta = (id: string) => INDICATORS.find((m) => m.id === id);

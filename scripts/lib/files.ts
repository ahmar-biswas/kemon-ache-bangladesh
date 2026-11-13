import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const RAW_DIR = resolve(ROOT, 'data/raw');
export const PROCESSED_DIR = resolve(ROOT, 'data/processed');

export const rawPath = (code: string, kind: 'data' | 'meta') => resolve(RAW_DIR, `${code}.${kind}.json`);
export const processedPath = (id: string) => resolve(PROCESSED_DIR, `${id}.json`);
export const medianPath = (id: string) => resolve(PROCESSED_DIR, 'median', `${id}.json`);
export const metaPath = () => resolve(PROCESSED_DIR, 'meta.json');
export const indicatorsPath = () => resolve(PROCESSED_DIR, 'indicators.json');
export const countriesPath = () => resolve(PROCESSED_DIR, 'countries.json');
/** WDI country metadata (currency, special notes) for Bangladesh and the default peers. */
export const countryMetaPath = () => resolve(RAW_DIR, 'countries.meta.json');
/** The World Bank country list (regions and income groups). */
export const countryListPath = () => resolve(RAW_DIR, 'countries.list.json');

export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Write via a temporary file and rename, so a crash never leaves half a file. */
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, path);
}

/** Compact copy of every country's values for recent years (for global ranks). */
export const allRawPath = (code: string) => resolve(RAW_DIR, `${code}.all.json`);
/** Saved copy of a published-rank source (UNDP, TI, WHR). */
export const externalRawPath = (id: string) => resolve(RAW_DIR, 'external', `${id}.json`);
/** A calculated global rank with every input. */
export const rankPath = (id: string) => resolve(PROCESSED_DIR, 'ranks', `${id}.json`);
/** Small file with only what the homepage shows. */
export const latestPath = () => resolve(PROCESSED_DIR, 'latest.json');
/** Hand-checked official goals (data/targets.json). */
export const targetsPath = () => resolve(ROOT, 'data', 'targets.json');
/** WDI special notes for every country (compact copy), for the country picker's caveats. */
export const countryNotesPath = () => resolve(RAW_DIR, 'countries.notes.json');
/** Every country's latest value in the last 10 years, for one measure (the country picker). */
export const worldPath = (id: string) => resolve(PROCESSED_DIR, 'world', `${id}.json`);
/** Bangladesh's full history for one measure ("Bangladesh over time"). */
export const trendPath = (id: string) => resolve(PROCESSED_DIR, 'trend', `${id}.json`);
/** What "The full picture" shows before a measure is opened: latest records and medians only. */
export const detailsPath = () => resolve(PROCESSED_DIR, 'details.json');
/** Hand-checked events for "Bangladesh over time" (shown only once approved). */
export const eventsPath = () => resolve(ROOT, 'data', 'events.json');

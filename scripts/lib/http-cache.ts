// Response cache: every successful API answer is saved here, so a rerun (after a
// failure, or while developing) never downloads the same thing twice.
//
// An answer is reused for CACHE_MAX_AGE_DAYS (same day only). The weekly
// scheduled refresh must see fresh data, and the "retrieved" date shown on the site must
// be the real download date, so older answers are fetched again.
//
// The folder is git-ignored; the reproducible copy of the data lives in data/raw/.
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { ROOT, readJson, writeJson } from './files.ts';

/** Tests point this somewhere temporary with KAB_HTTP_CACHE_DIR. */
const cacheDir = () => process.env.KAB_HTTP_CACHE_DIR ?? resolve(ROOT, 'data/.http-cache');

interface CacheEntry {
  url: string;
  retrieved_at: string;
  response: unknown;
}

const pathFor = (url: string) => resolve(cacheDir(), `${createHash('sha256').update(url).digest('hex').slice(0, 32)}.json`);

/**
 * Same day only (M9, DECISIONS 24 and 140): the weekly refresh always downloads fresh answers, so the
 * "retrieved" date on the site is the real download date. (During M2 this was 7 days, to resume
 * interrupted fetches.)
 */
export const CACHE_MAX_AGE_DAYS = 1;

const dayNumber = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000;

export function readCached(url: string, today: string): CacheEntry | null {
  const entry = readJson<CacheEntry>(pathFor(url));
  if (!entry || entry.url !== url) return null;
  const age = dayNumber(today) - dayNumber(entry.retrieved_at);
  if (!(age >= 0 && age < CACHE_MAX_AGE_DAYS)) return null;
  return entry;
}

export function writeCached(url: string, today: string, response: unknown): void {
  writeJson(pathFor(url), { url, retrieved_at: today, response } satisfies CacheEntry);
}

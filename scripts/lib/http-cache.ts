// Response cache: every successful API answer is saved here, so a rerun (after a
// failure, or while developing) never downloads the same thing twice.
//
// An answer is reused for CACHE_MAX_AGE_DAYS (normally same day only; 7 days for now, see below). The weekly
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
 * TEMPORARY (M2, 2026-11-13): answers are reused for up to 7 days instead of only on the
 * day they were downloaded, so an interrupted M2 fetch can resume without downloading
 * again. The "retrieved" date stays the real download date (stored in the entry).
 * Set back to 1 (same day only) before the weekly scheduled refresh (M9). See DECISIONS.md 24.
 */
export const CACHE_MAX_AGE_DAYS = 7;

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

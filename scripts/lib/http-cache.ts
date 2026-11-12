// Response cache: every successful API answer is saved here, so a rerun (after a
// failure, or while developing) never downloads the same thing twice.
//
// An answer is reused only on the day it was downloaded (Bangladesh time). The weekly
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

export function readCached(url: string, today: string): CacheEntry | null {
  const entry = readJson<CacheEntry>(pathFor(url));
  if (!entry || entry.url !== url || entry.retrieved_at !== today) return null;
  return entry;
}

export function writeCached(url: string, today: string, response: unknown): void {
  writeJson(pathFor(url), { url, retrieved_at: today, response } satisfies CacheEntry);
}

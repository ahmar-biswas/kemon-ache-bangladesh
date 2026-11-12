// Fetch → normalise → validate → write. Run: npm run data:refresh
//
// All or nothing: if any indicator fails any check, no data file is changed.
// Only data/processed/meta.json is updated, to record that a check happened and failed.
import type { DataMeta, DataRecord } from '../src/data/types.ts';
import { INDICATORS } from './indicators.ts';
import { countryMetaPath, metaPath, processedPath, rawPath, readJson, writeJson } from './lib/files.ts';
import { compareWithPrevious, validateRecords } from './lib/validate.ts';
import {
  COUNTRY_META_URL,
  fetchAllPages,
  fetchJson,
  normalise,
  parseCountryMeta,
  todayInDhaka,
  urls,
  type CountryMeta,
  type RawResponse,
} from './lib/worldbank.ts';

const today = todayInDhaka();
const problems: string[] = [];
const pending: { path: string; value: unknown }[] = [];
const sourceLastUpdated: Record<string, string> = {};
let anyChanged = false;

// Country metadata first: currency unit and special notes. This endpoint is slow.
let country: CountryMeta | null = null;
try {
  console.log('Fetching Bangladesh country metadata…');
  const f = await fetchJson(COUNTRY_META_URL);
  if (f.fromCache) console.log('  (from today\'s response cache)');
  const raw: RawResponse = { retrieved_at: f.retrievedAt, request_url: COUNTRY_META_URL, response: f.response };
  country = parseCountryMeta(raw);
  pending.push({ path: countryMetaPath(), value: raw });
} catch (err) {
  problems.push(err instanceof Error ? err.message : String(err));
}

for (const config of country ? INDICATORS : []) {
  const u = urls(config.code);
  try {
    console.log(`Fetching ${config.id} (${config.code})…`);
    const m = await fetchJson(u.meta);
    const metaRaw: RawResponse = { retrieved_at: m.retrievedAt, request_url: u.meta, response: m.response };
    const d = await fetchAllPages(u.data);
    const dataRaw: RawResponse = { retrieved_at: d.retrievedAt, request_url: u.data, response: d.answers };

    const { records, sourceLastUpdated: lastUpdated } = normalise(config, metaRaw, dataRaw, country!);
    if (lastUpdated) sourceLastUpdated[config.code] = lastUpdated;

    const own = validateRecords(config, records);
    const previous = readJson<DataRecord[]>(processedPath(config.id)) ?? [];
    const cmp = compareWithPrevious(config, previous, records);
    problems.push(...own, ...cmp.problems);

    if (cmp.changed) {
      anyChanged = true;
      console.log(`  ${records.length} records; values changed, will update.`);
      pending.push({ path: rawPath(config.code, 'meta'), value: metaRaw });
      pending.push({ path: rawPath(config.code, 'data'), value: dataRaw });
      pending.push({ path: processedPath(config.id), value: records });
    } else {
      // Nothing changed: keep the existing files (and their original retrieved date)
      // so the repository only gets a commit when a value really changes.
      console.log(`  ${records.length} records; no change.`);
    }
  } catch (err) {
    problems.push(err instanceof Error ? err.message : String(err));
  }
}

const previousMeta = readJson<DataMeta>(metaPath());

if (problems.length > 0) {
  console.error(`\nRefresh FAILED. No data files were changed. Problems:`);
  for (const p of problems) console.error(`  - ${p}`);
  writeJson(metaPath(), {
    last_checked: today,
    last_check_ok: false,
    last_updated: previousMeta?.last_updated ?? today,
    source_last_updated: previousMeta?.source_last_updated ?? {},
  } satisfies DataMeta);
  process.exit(1);
}

for (const { path, value } of pending) writeJson(path, value);
writeJson(metaPath(), {
  last_checked: today,
  last_check_ok: true,
  last_updated: anyChanged || !previousMeta ? today : previousMeta.last_updated,
  source_last_updated: sourceLastUpdated,
} satisfies DataMeta);
console.log(`\nRefresh OK (${anyChanged ? 'data updated' : 'no changes'}).`);

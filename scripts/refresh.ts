// Fetch → normalise → validate → write. Run: npm run data:refresh
//
// All or nothing: if any indicator fails any check, no data file is changed.
// Only data/processed/meta.json is updated, to record that a check happened and failed.
import type { CountriesFile, DataMeta, DataRecord, IndicatorMeta, MedianRecord, RankDetail, Target } from '../src/data/types.ts';
import { COUNTRY, COUNTRY_ISO2, DEFAULT_PEERS, INDICATORS } from './indicators.ts';
import {
  allRawPath,
  countriesPath,
  countryNotesPath,
  detailsPath,
  trendPath,
  worldPath,
  countryListPath,
  countryMetaPath,
  externalRawPath,
  indicatorsPath,
  latestPath,
  medianPath,
  metaPath,
  processedPath,
  rankPath,
  rawPath,
  readJson,
  targetsPath,
  writeJson,
} from './lib/files.ts';
import { EXTERNAL, fetchExternal, rankRecords, validateExternal } from './lib/external.ts';
import { buildLatest } from './lib/latest.ts';
import { buildMedians, groupMembers } from './lib/median.ts';
import { MIN_RANKED, buildRank, compactAll, validateRank } from './lib/ranks.ts';
import { buildDetails, buildTrend, buildWorld, validateWorld } from './lib/world.ts';
import { compareWithPrevious, validateMedians, validateRecords, validateTargets } from './lib/validate.ts';
import {
  CLASSIFICATION_URL,
  COUNTRY_LIST_URL,
  COUNTRY_META_ALL_URL,
  countryMetaUrl,
  fetchAllPages,
  fetchJson,
  normalise,
  parseCountryList,
  parseCountryMeta,
  todayInDhaka,
  urls,
  type RawResponse,
} from './lib/worldbank.ts';

const today = todayInDhaka();
const problems: string[] = [];
const pending: { path: string; value: unknown }[] = [];
const sourceLastUpdated: Record<string, string> = {};
let anyChanged = false;
const allRecords: Record<string, DataRecord[]> = {};
const allMedians: Record<string, MedianRecord[]> = {};
const ranks: Record<string, RankDetail> = {};
/** Global ranks use every country's values for the last 10 years only (keeps data/raw small). */
const thisYear = Number(today.slice(0, 4));
const sinceYear = thisYear - 10;

const IGNORED_KEYS = new Set(['retrieved_at', 'classification_retrieved_at', 'last_checked']);
/** Same content apart from the retrieved date? Then keep the old file (and its date). */
const sameIgnoringDates = (a: unknown, b: unknown) =>
  JSON.stringify(a, (k, v) => (IGNORED_KEYS.has(k) ? undefined : v)) ===
  JSON.stringify(b, (k, v) => (IGNORED_KEYS.has(k) ? undefined : v));

function stage(path: string, value: unknown) {
  const previous = readJson<unknown>(path);
  if (previous !== null && sameIgnoringDates(previous, value)) return;
  anyChanged = true;
  pending.push({ path, value });
}

async function fetchRaw(url: string): Promise<RawResponse> {
  const f = await fetchJson(url);
  if (f.fromCache) console.log("  (from today's response cache)");
  return { retrieved_at: f.retrievedAt, request_url: url, response: f.response };
}

const shown = [COUNTRY, ...DEFAULT_PEERS];

try {
  // 1. Country list: income groups are read from the source, never assumed.
  console.log('Fetching the World Bank country list…');
  const listRaw = await fetchRaw(COUNTRY_LIST_URL);
  const countries = parseCountryList(listRaw);
  const byId = new Map(countries.map((c) => [c.id, c]));
  for (const id of shown) if (!byId.has(id)) throw new Error(`Country list has no ${id}`);
  const members = groupMembers(countries);
  if (members.length < 20) throw new Error(`Only ${members.length} lower-middle-income countries in the list; expected about 50`);

  // 2. Country metadata (currency, special notes) for the countries we show. Slow endpoint.
  console.log('Fetching country metadata (slow)…');
  const metaUrl = countryMetaUrl(shown);
  const countryMetaRaw = await fetchRaw(metaUrl);
  const countryMeta = parseCountryMeta(countryMetaRaw, shown);

  // 2b. Special notes for every country (one fast answer), for the country picker's caveats.
  console.log('Fetching special notes for every country…');
  const allMetaRaw = await fetchRaw(COUNTRY_META_ALL_URL);
  const allMeta = parseCountryMeta(allMetaRaw, shown);
  const specialNotes = new Map<string, string>();
  for (const c of countries) {
    const note = allMeta.get(c.id)?.specialNotes;
    if (note) specialNotes.set(c.id, note);
  }
  for (const id of shown) {
    if ((countryMeta.get(id)?.specialNotes ?? null) !== (specialNotes.get(id) ?? null)) {
      problems.push(`Country notes for ${id} differ between the two World Bank answers`);
    }
  }
  stage(countryNotesPath(), {
    request_url: COUNTRY_META_ALL_URL,
    retrieved_at: allMetaRaw.retrieved_at,
    special_notes: Object.fromEntries([...specialNotes].sort(([a], [b]) => a.localeCompare(b))),
  });

  const countriesFile: CountriesFile = {
    source_name: 'World Bank, country and lending groups',
    classification_url: CLASSIFICATION_URL,
    api_url: COUNTRY_LIST_URL,
    retrieved_at: listRaw.retrieved_at,
    default_peers: [...DEFAULT_PEERS],
    countries,
  };
  const classification = { url: CLASSIFICATION_URL, retrieved_at: listRaw.retrieved_at };
  const fetchSet = [...new Set([...shown, ...members.map((c) => c.id)])].sort();
  const iso2 = new Map(countries.map((c) => [c.id, c.iso2]));
  const indicatorMetas: IndicatorMeta[] = [];
  const pendingRaw: { path: string; value: unknown }[] = [
    { path: countryListPath(), value: listRaw },
    { path: countryMetaPath(), value: countryMetaRaw },
  ];

  // 3. Each indicator.
  for (const config of INDICATORS) {
    const requested = config.scope === 'compare' ? fetchSet : [COUNTRY];
    const keep = new Set(config.scope === 'compare' ? shown : [COUNTRY]);
    const u = urls(config.code);
    try {
      console.log(`Fetching ${config.id} (${config.code}) for ${requested.length} countries…`);
      const metaRaw = await fetchRaw(u.meta);
      const d = await fetchAllPages(u.data(requested), 20_000);
      const dataRaw: RawResponse = { retrieved_at: d.retrievedAt, request_url: u.data(requested), response: d.answers };

      const n = normalise(config, metaRaw, dataRaw, { countries: requested, iso2, countryMeta });
      if (n.sourceLastUpdated) sourceLastUpdated[config.code] = n.sourceLastUpdated;

      const records: DataRecord[] = n.records.filter((r) => keep.has(r.country));
      if (!records.some((r) => r.country === COUNTRY)) problems.push(`${config.id}: no data for Bangladesh`);
      const medians: MedianRecord[] = config.scope === 'compare' ? buildMedians(config, n.records, members, classification) : [];

      const previous = readJson<DataRecord[]>(processedPath(config.id)) ?? [];
      const cmp = compareWithPrevious(config, previous, records);
      problems.push(...validateRecords(config, records), ...validateMedians(config, medians), ...cmp.problems);

      console.log(
        `  ${records.length} records for ${new Set(records.map((r) => r.country)).size} countries; ` +
          `${medians.length} median years; ${cmp.changed ? 'changed' : 'no change'}.`,
      );
      if (cmp.changed || readJson(rawPath(config.code, 'data')) === null) {
        anyChanged = true;
        pendingRaw.push({ path: rawPath(config.code, 'meta'), value: metaRaw }, { path: rawPath(config.code, 'data'), value: dataRaw });
        pending.push({ path: processedPath(config.id), value: records });
      }
      if (config.scope === 'compare') stage(medianPath(config.id), medians);
      allRecords[config.id] = records;
      allMedians[config.id] = medians;
      stage(trendPath(config.id), buildTrend(records));

      // Global rank (calculated by this site): every country's value for recent years.
      if (config.scope === 'compare') {
        const allUrl = urls(config.code).allRecent(sinceYear, thisYear);
        const a = await fetchAllPages(allUrl, 20_000);
        const compact = compactAll(config, { retrieved_at: a.retrievedAt, request_url: allUrl, response: a.answers });
        stage(allRawPath(config.code), compact);
        // Every country's newest value, for the "Compare with other countries" picker.
        const sample = records[0];
        if (sample) {
          const world = buildWorld({ config, all: compact, countries, since: sinceYear, sample, specialNotes });
          problems.push(...validateWorld(config, world, records));
          stage(worldPath(config.id), world);
          console.log(`  ${world.rows.length} countries have a value since ${sinceYear}.`);
        }
        const bgdLatest = Math.max(...records.filter((r) => r.country === COUNTRY).map((r) => r.year));
        const rank = buildRank(config, compact, countries, bgdLatest, `World Bank, ${n.seriesName}`);
        if (rank) {
          problems.push(...validateRank(config, rank));
          ranks[config.id] = rank;
          stage(rankPath(config.id), rank);
          console.log(`  global rank ${rank.rank} of ${rank.out_of} (${rank.year}).`);
        } else {
          console.log(`  no global rank: fewer than ${MIN_RANKED} countries have a value for ${bgdLatest}.`);
        }
      }

      indicatorMetas.push({
        id: config.id,
        code: config.code,
        area: config.area,
        priority: config.priority,
        unit: config.unit,
        source_series_name: n.seriesName,
        definition_url: u.definition,
        source_url: u.page([COUNTRY_ISO2]),
        explanation_id: config.explanationId ?? config.id,
        compare_id: config.compareWith ?? null,
        scope: config.scope,
        favourable_direction: config.favourable_direction,
        direction_source_url: config.direction_source_url,
        direction_source_text: config.direction_source_text,
        params: n.params,
      });
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 4. Published ranks (UNDP, Transparency International, World Happiness Report).
  for (const src of EXTERNAL) {
    try {
      console.log(`Fetching ${src.id} (${src.source_name})…`);
      const raw = await fetchExternal(src, countries);
      const bad = validateExternal(src, raw, shown);
      problems.push(...bad);
      const records = rankRecords(src, raw, shown);
      stage(externalRawPath(src.id), raw);
      stage(processedPath(src.id), records);
      allRecords[src.id] = records;
      const bgd = records.find((r) => r.country === COUNTRY);
      console.log(`  ${raw.rows.length} countries; Bangladesh ${bgd ? `${bgd.value} of ${bgd.out_of} (${bgd.year})` : 'missing'}.`);
      indicatorMetas.push({
        id: src.id,
        code: src.id,
        area: 'overall',
        priority: 'P0',
        unit: 'rank',
        source_series_name: src.source_name,
        definition_url: src.definition_url,
        source_url: bgd?.source_url ?? src.definition_url,
        explanation_id: src.id,
        compare_id: null,
        scope: 'compare',
        favourable_direction: 'context',
        direction_source_url: null,
        direction_source_text: null,
        params: {},
      });
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 5. Official goals (hand-checked file) and the small homepage file.
  const targets = (readJson<{ targets: Target[] }>(targetsPath())?.targets ?? []) as Target[];
  problems.push(...validateTargets(targets, indicatorMetas));
  stage(
    latestPath(),
    buildLatest({
      lastChecked: today,
      metas: indicatorMetas,
      records: allRecords,
      medians: allMedians,
      ranks,
      targets,
      names: Object.fromEntries(countries.map((c) => [c.id, c.name])),
    }),
  );

  stage(detailsPath(), buildDetails(allRecords, allMedians, sinceYear));
  stage(countriesPath(), countriesFile);
  stage(indicatorsPath(), indicatorMetas);
  // Raw answers are saved only when something they produced changed.
  if (anyChanged) pending.push(...pendingRaw);
} catch (err) {
  problems.push(err instanceof Error ? err.message : String(err));
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

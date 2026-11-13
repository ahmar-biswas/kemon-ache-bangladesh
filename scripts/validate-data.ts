// CI check: validates the committed data files without fetching anything.
// Run: npm run check:data
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CountriesFile, DataMeta, DataRecord, IndicatorMeta, LatestFile, MedianRecord, RankDetail, Target } from '../src/data/types.ts';
import { matchNote } from '../src/data/notes.ts';
import { SOURCE_KEYS } from '../src/data/sources.ts';
import { hasKey } from '../src/i18n/index.ts';
import { COUNTRY, DEFAULT_PEERS, INDICATORS, MEDIAN_GROUP } from './indicators.ts';
import { EXTERNAL } from './lib/external.ts';
import { ROOT, countriesPath, detailsPath, eventsPath, indicatorsPath, latestPath, medianPath, metaPath, processedPath, rankPath, readJson, targetsPath, trendPath, worldPath } from './lib/files.ts';
import { rankHighestFirst, validateRank } from './lib/ranks.ts';
import { validateMedians, validateRecords, validateTargets } from './lib/validate.ts';
import { buildTrend, validateEvents, validateWorld } from './lib/world.ts';
import type { EventsFile, WorldFile } from '../src/data/types.ts';

const problems: string[] = [];
const countriesBn = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/countries.bn.json'), 'utf8')) as Record<string, string>;

const countries = readJson<CountriesFile>(countriesPath());
if (!countries) problems.push('data/processed/countries.json is missing');
const groupIds = new Set(countries?.countries.filter((c) => c.income_group === MEDIAN_GROUP).map((c) => c.id) ?? []);
// Every country the site can name needs a Bangla name: any country can be picked (M5).
for (const id of new Set([COUNTRY, ...DEFAULT_PEERS, ...groupIds, ...(countries?.countries.map((c) => c.id) ?? [])])) {
  if (!countriesBn[id]?.trim()) problems.push(`src/i18n/countries.bn.json: no Bangla name for ${id}`);
}

const metas = readJson<IndicatorMeta[]>(indicatorsPath()) ?? [];
if (metas.length === 0) problems.push('data/processed/indicators.json is missing or empty');

for (const config of INDICATORS) {
  const records = readJson<DataRecord[]>(processedPath(config.id));
  if (!records) {
    problems.push(`${config.id}: data/processed/${config.id}.json is missing`);
    continue;
  }
  problems.push(...validateRecords(config, records));
  for (const name of new Set(records.map((r) => r.source_name))) {
    if (!(name in SOURCE_KEYS)) problems.push(`${config.id}: source "${name}" has no translated name in src/data/sources.ts`);
  }
  for (const note of new Set(records.flatMap((r) => r.notes))) {
    if (!matchNote(note)) problems.push(`${config.id}: note has no translation in src/data/notes.ts: "${note.slice(0, 100)}…"`);
  }
  // Milestone 5 files: Bangladesh's history, and every country's latest value.
  const trend = readJson<DataRecord[]>(trendPath(config.id));
  if (!trend) problems.push(`${config.id}: data/processed/trend/${config.id}.json is missing`);
  else if (JSON.stringify(trend) !== JSON.stringify(buildTrend(records))) problems.push(`${config.id}: trend file does not match the data file`);
  if (config.scope === 'compare') {
    const world = readJson<WorldFile>(worldPath(config.id));
    if (!world) problems.push(`${config.id}: data/processed/world/${config.id}.json is missing`);
    else {
      problems.push(...validateWorld(config, world, records));
      if (world.unit !== config.unit) problems.push(`${config.id} world: unit "${world.unit}" but expected "${config.unit}"`);
      if (!(world.source_name in SOURCE_KEYS)) problems.push(`${config.id} world: source "${world.source_name}" has no translated name`);
    }
  }
  if (config.scope === 'compare') {
    const medians = readJson<MedianRecord[]>(medianPath(config.id));
    if (!medians) problems.push(`${config.id}: data/processed/median/${config.id}.json is missing`);
    else problems.push(...validateMedians(config, medians));
  }

  const meta = metas.find((m) => m.id === config.id);
  if (!meta) problems.push(`${config.id}: not in indicators.json`);
  else {
    if (meta.favourable_direction !== 'context' && !meta.direction_source_url?.startsWith('https://')) {
      problems.push(`${config.id}: "${meta.favourable_direction}" needs a direction_source_url`);
    }
    if (meta.favourable_direction !== 'context' && !hasKey(`direction.target.${config.id}`)) {
      problems.push(`${config.id}: target text has no translation (direction.target.${config.id})`);
    }
  }
  if (!hasKey(`indicator.${config.id}.name`)) problems.push(`${config.id}: no translated name (indicator.${config.id}.name)`);
  const explanation = config.explanationId ?? config.id;
  if (!hasKey(`explain.${explanation}`)) problems.push(`${config.id}: no explanation (explain.${explanation})`);
}

// Published ranks (UNDP, TI, WHR): Bangladesh and every peer, a valid rank out of a count.
for (const src of EXTERNAL) {
  const records = readJson<DataRecord[]>(processedPath(src.id));
  if (!records) {
    problems.push(`${src.id}: data/processed/${src.id}.json is missing`);
    continue;
  }
  for (const id of [COUNTRY, ...DEFAULT_PEERS]) if (!records.some((r) => r.country === id)) problems.push(`${src.id}: no rank for ${id}`);
  for (const r of records) {
    if (r.unit !== 'rank' || !r.out_of || !Number.isInteger(r.value) || r.value < 1 || r.value > r.out_of) {
      problems.push(`${src.id} ${r.country}: bad rank ${r.value} of ${r.out_of}`);
    }
    if (!r.source_url.startsWith('https://')) problems.push(`${src.id} ${r.country}: missing source_url`);
    if (!(r.source_name in SOURCE_KEYS)) problems.push(`${src.id}: source "${r.source_name}" has no translated name in src/data/sources.ts`);
  }
  if (!hasKey(`indicator.${src.id}.name`)) problems.push(`${src.id}: no translated name`);
  if (!hasKey(`explain.${src.id}`)) problems.push(`${src.id}: no explanation`);
}

// Calculated global ranks: recomputable from their own list.
for (const config of INDICATORS.filter((c) => c.scope === 'compare')) {
  const r = readJson<RankDetail>(rankPath(config.id));
  if (!r) continue; // allowed: too few countries that year
  problems.push(...validateRank(config, r));
  const again = rankHighestFirst(r.values.map(({ country, value }) => ({ country, value })));
  if (again.find((x) => x.country === COUNTRY)?.rank !== r.rank) problems.push(`${config.id} rank: does not match its own list`);
}

// Official goals and the homepage file.
const targets = readJson<{ targets: Target[] }>(targetsPath())?.targets ?? [];
problems.push(...validateTargets(targets, metas));
for (const t of targets) if (!hasKey(t.label_key)) problems.push(`targets.json ${t.indicator_id}: no translation for ${t.label_key}`);
for (const t of targets) {
  const key = t.label_key.replace('target.short.', 'target.source.');
  if (!hasKey(key)) problems.push(`targets.json ${t.indicator_id}: no translated source name ${key}`);
}
const latest = readJson<LatestFile>(latestPath());
if (!latest) problems.push('data/processed/latest.json is missing');
else for (const m of metas) if (!latest.indicators[m.id]) problems.push(`latest.json: no entry for ${m.id}`);

if (!readJson(detailsPath())) problems.push('data/processed/details.json is missing');
const events = readJson<EventsFile>(eventsPath());
if (!events) problems.push('data/events.json is missing');
else problems.push(...validateEvents(events));

const meta = readJson<DataMeta>(metaPath());
if (!meta) problems.push('data/processed/meta.json is missing');
else if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.last_checked)) problems.push('meta.json: bad last_checked');

if (problems.length > 0) {
  console.error(`Data check failed (${problems.length} problem(s)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Data check passed for ${INDICATORS.length} indicators.`);

// CI check: validates the committed data files without fetching anything.
// Run: npm run check:data
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CountriesFile, DataMeta, DataRecord, IndicatorMeta, MedianRecord } from '../src/data/types.ts';
import { matchNote } from '../src/data/notes.ts';
import { SOURCE_KEYS } from '../src/data/sources.ts';
import { hasKey } from '../src/i18n/index.ts';
import { COUNTRY, DEFAULT_PEERS, INDICATORS, MEDIAN_GROUP } from './indicators.ts';
import { ROOT, countriesPath, indicatorsPath, medianPath, metaPath, processedPath, readJson } from './lib/files.ts';
import { validateMedians, validateRecords } from './lib/validate.ts';

const problems: string[] = [];
const countriesBn = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/countries.bn.json'), 'utf8')) as Record<string, string>;

const countries = readJson<CountriesFile>(countriesPath());
if (!countries) problems.push('data/processed/countries.json is missing');
const groupIds = new Set(countries?.countries.filter((c) => c.income_group === MEDIAN_GROUP).map((c) => c.id) ?? []);
// Every country the site can name (shown, or an input to the median) needs a Bangla name.
for (const id of new Set([COUNTRY, ...DEFAULT_PEERS, ...groupIds])) {
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

const meta = readJson<DataMeta>(metaPath());
if (!meta) problems.push('data/processed/meta.json is missing');
else if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.last_checked)) problems.push('meta.json: bad last_checked');

if (problems.length > 0) {
  console.error(`Data check failed (${problems.length} problem(s)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Data check passed for ${INDICATORS.length} indicators.`);

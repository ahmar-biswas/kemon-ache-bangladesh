// CI check: validates the committed data files without fetching anything.
// Run: npm run check:data
import type { DataMeta, DataRecord } from '../src/data/types.ts';
import { NOTE_KEYS } from '../src/data/notes.ts';
import { SOURCE_KEYS } from '../src/data/sources.ts';
import { INDICATORS } from './indicators.ts';
import { metaPath, processedPath, readJson } from './lib/files.ts';
import { validateRecords } from './lib/validate.ts';

const problems: string[] = [];

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
    if (!(note in NOTE_KEYS)) {
      problems.push(`${config.id}: note has no translation in src/data/notes.ts: "${note.slice(0, 100)}…"`);
    }
  }
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

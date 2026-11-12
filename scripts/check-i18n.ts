// CI check: fails if any English string lacks a Bangla translation.
// Run: npm run check:i18n
import { readFileSync } from 'node:fs';
import { checkTranslations } from '../src/i18n/check.ts';

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

const problems = checkTranslations(read('../src/i18n/en.json'), read('../src/i18n/bn.json'));

const countries = read('../src/i18n/countries.bn.json') as Record<string, unknown>;
for (const [code, name] of Object.entries(countries)) {
  if (!/^[A-Z]{3}$/.test(code)) problems.push(`countries.bn.json: "${code}" is not an ISO3 code`);
  if (typeof name !== 'string' || name.trim() === '') problems.push(`countries.bn.json: "${code}" has no Bangla name`);
}

if (problems.length > 0) {
  console.error(`Translation check failed (${problems.length} problem(s)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Translation check passed: every key has a Bangla value.');

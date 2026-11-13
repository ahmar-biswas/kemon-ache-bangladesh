// Downloads the slow "every country" answers in parallel into the response cache, so the
// refresh that follows finds them there (DECISIONS.md 23: warming first is what works).
// Run: npx tsx scripts/warm-cache.ts
import { INDICATORS } from './indicators.ts';
import { fetchAllPages, todayInDhaka, urls } from './lib/worldbank.ts';

const year = Number(todayInDhaka().slice(0, 4));
const jobs = INDICATORS.filter((c) => c.scope === 'compare').map(async (c) => {
  try {
    await fetchAllPages(urls(c.code).allRecent(year - 10, year), 20_000);
    return `${c.id}: ok`;
  } catch (err) {
    return `${c.id}: FAILED ${err instanceof Error ? err.message : String(err)}`;
  }
});
for (const line of await Promise.all(jobs)) console.log(line);

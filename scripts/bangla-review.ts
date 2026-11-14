// Writes BANGLA_REVIEW.md (M8 step 4): every Bangla string on the site next to its English,
// grouped by where it appears, for Ahmar to review. Rows the builder was unsure of in earlier
// milestones (docs/bangla-review-history.md) are marked ⚑.
//
//   npm run bangla:review
import { readFileSync, writeFileSync } from 'node:fs';

const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8')) as Record<string, string>;
const bn = JSON.parse(readFileSync('src/i18n/bn.json', 'utf8')) as Record<string, string>;
const countriesBn = JSON.parse(readFileSync('src/i18n/countries.bn.json', 'utf8')) as Record<string, string>;
const countries = (JSON.parse(readFileSync('data/processed/countries.json', 'utf8')) as { countries: { id: string; name: string }[] }).countries;
const events = (JSON.parse(readFileSync('data/events.json', 'utf8')) as {
  events: { id: string; label: { en: string; bn: string }; source_name: { en: string; bn: string } }[];
}).events;
const history = readFileSync('docs/bangla-review-history.md', 'utf8');

// ---------- Keys the history file asks a question about (and Ahmar has not already settled) ----------
function flaggedPatterns(): RegExp[] {
  const out: RegExp[] = [];
  let reviewed = false;
  for (const line of history.split('\n')) {
    if (line.startsWith('## ')) reviewed = /reviewed by Ahmar/i.test(line);
    if (reviewed || /Changed by Ahmar/.test(line)) continue;
    const tokens = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]!).concat(line.match(/\b[a-z_]+\.[a-z0-9_.*-]+/g) ?? []);
    for (const tok of tokens) {
      if (!/^[a-z_]+\./.test(tok) || tok.includes('/')) continue;
      // `indicator.{a, b}.name` and `indicator.*.short` style patterns.
      const re = tok
        .replace(/[.+?^$()|[\]\\]/g, '\\$&')
        .replace(/\\\.\*|\*/g, '(\\..+)?')
        .replace(/\{([^}]+)\}/g, (_, list: string) => `(${list.split(/,\s*/).join('|')})`);
      out.push(new RegExp(`^${re}$`));
    }
  }
  return out;
}
const FLAGS = flaggedPatterns();
const flagged = (key: string) => FLAGS.some((re) => re.test(key));

// ---------- Groups, by where a reader meets the string ----------
const GROUPS: [string, string[]][] = [
  ['Site name, menu, homepage and page frame', ['site', 'nav', 'lang', 'page', 'home', 'glance', 'side', 'view', 'details', 'slicer', 'area', 'group', 'strip', 'status', 'notfound', 'state']],
  ['Measure names', ['indicator']],
  ['Explanations (definitions)', ['explain']],
  ['Area and subsection pages', ['sub', 'snapshot']],
  ['Comparing countries, goals and positions', ['peers', 'badge', 'rank', 'direction', 'target', 'goal', 'compare', 'comparepage', 'picker', 'peerchart', 'measure', 'median', 'derived']],
  ['Over time and events', ['trend', 'events']],
  ['Units, numbers, money and charts', ['unit', 'number', 'month', 'money', 'chart', 'table', 'caveat']],
  ['Sources and the Sources page', ['source', 'sources']],
  ['Publisher notes (translated sentence by sentence; the English is word for word)', ['note']],
  ['About and How to read', ['about', 'how']],
  ['Design preview (for review only; low priority)', ['design']],
];

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
const table = (rows: [string, string, string, boolean][]) =>
  ['| | Key | English | Bangla (draft) |', '|---|---|---|---|', ...rows.map(([k, e, b, f]) => `| ${f ? '⚑' : ''} | \`${k}\` | ${cell(e)} | ${cell(b)} |`)].join('\n');

const keys = Object.keys(en);
const used = new Set<string>();
const sections: string[] = [];
let flagCount = 0;
for (const [title, prefixes] of GROUPS) {
  const ks = keys.filter((k) => prefixes.includes(k.split('.')[0]!));
  ks.forEach((k) => used.add(k));
  const rows = ks.map((k) => [k, en[k]!, bn[k] ?? '(missing)', flagged(k)] as [string, string, string, boolean]);
  flagCount += rows.filter((r) => r[3]).length;
  sections.push(`## ${title} (${rows.length})\n\n${table(rows)}`);
}
const rest = keys.filter((k) => !used.has(k));
if (rest.length) {
  const rows = rest.map((k) => [k, en[k]!, bn[k] ?? '(missing)', flagged(k)] as [string, string, string, boolean]);
  flagCount += rows.filter((r) => r[3]).length;
  sections.push(`## Other (${rows.length})\n\n${table(rows)}`);
}

const nameOf = new Map(countries.map((c) => [c.id, c.name]));
const countryRows = Object.entries(countriesBn)
  .sort(([a], [b]) => (nameOf.get(a) ?? a).localeCompare(nameOf.get(b) ?? b))
  .map(([id, b]) => `| ${id} | ${cell(nameOf.get(id) ?? '')} | ${cell(b)} |`);
sections.push(
  `## Country names (${countryRows.length}; \`src/i18n/countries.bn.json\`; English as the World Bank writes it)\n\n| Code | English | Bangla (draft) |\n|---|---|---|\n${countryRows.join('\n')}`,
);
const eventRows = events.map((e) => `| ${e.id} | ${cell(e.label.en)} | ${cell(e.label.bn)} |\n| | ${cell(e.source_name.en)} | ${cell(e.source_name.bn)} |`);
sections.push(`## Event labels on the over-time charts (${events.length}; \`data/events.json\`; second row is the source name)\n\n| Event | English | Bangla (draft) |\n|---|---|---|\n${eventRows.join('\n')}`);

const total = keys.length + countryRows.length + events.length * 2;
const out = `# Bangla strings for review

Every Bangla string on the site, next to its English, so you can read them all in one place
(${total} strings: ${keys.length} interface strings, ${countryRows.length} country names, ${events.length} event labels and their sources).
Every Bangla string is a draft until you review it.

**How to review.** Read down the Bangla column. For anything to change, send me the key and the new
text (or edit the Bangla cell here and tell me): I will copy it into the translation file.
Rows marked ⚑ (${flagCount}) are the ones I was least sure of in earlier milestones; the questions about them
are in [docs/bangla-review-history.md](docs/bangla-review-history.md). Long paragraphs (About, How to read) read
more easily as pages: /bn/about and /bn/how-to-read.

This file is generated by \`npm run bangla:review\` from \`src/i18n/bn.json\`, \`src/i18n/countries.bn.json\` and
\`data/events.json\`. Do not edit it as the record: the translation files are the record.

Words in \`{curly brackets}\` are filled in from the data (a number, a year, a country).

${sections.join('\n\n')}
`;
writeFileSync('BANGLA_REVIEW.md', out);
console.log(`BANGLA_REVIEW.md: ${total} strings, ${flagCount} marked ⚑.`);

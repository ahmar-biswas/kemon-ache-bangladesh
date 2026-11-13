// Notes from the publisher are stored in data files word for word, in English.
// To show them in Bangla, each note is matched against the patterns below and turned
// into a translation key plus the values it contains (numbers, survey names, dates).
//
// The English translation of every key reproduces the publisher's text exactly
// (tests/notes.test.ts checks this for every note in the data). If the publisher
// changes a note's wording, `npm run check:data` fails until a person adds the new
// pattern and its Bangla translation.
import type { MessageKey } from '../i18n/index.ts';

/** How a captured value is shown: numbers get Bangla digits; text stays as published; months are translated. */
type ParamKind = 'number' | 'text' | 'month';

interface NotePattern {
  re: RegExp;
  key: MessageKey;
  params: Record<string, ParamKind>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const NOTE_PATTERNS: NotePattern[] = [
  // UN IGME child mortality estimates (one per country and year).
  { re: /^Uncertainty bound is (?<low>[\d.]+) - (?<high>[\d.]+)$/, key: 'note.uncertainty_bound', params: { low: 'number', high: 'number' } },
  // Poverty and Inequality Platform: survey name and whether it measures consumption or income.
  {
    re: /^Based on data from (?<survey>[A-Za-z0-9-]+)\. Estimated from unit-record consumption data\.$/,
    key: 'note.pip_unit_consumption',
    params: { survey: 'text' },
  },
  {
    re: /^Based on data from (?<survey>[A-Za-z0-9-]+)\. Estimated from grouped consumption data\.$/,
    key: 'note.pip_grouped_consumption',
    params: { survey: 'text' },
  },
  {
    re: /^Based on data from (?<survey>[A-Za-z0-9-]+)\. Estimated from unit-record income data\.$/,
    key: 'note.pip_unit_income',
    params: { survey: 'text' },
  },
  {
    re: /^Based on data from (?<survey>[A-Za-z0-9-]+)\. Estimated from grouped income data\.$/,
    key: 'note.pip_grouped_income',
    params: { survey: 'text' },
  },
  // Survey citations (e.g. stunting). The report title is a name and is shown as published.
  { re: /^Source: (?<citation>.+)$/s, key: 'note.source_citation', params: { citation: 'text' } },
  // WDI country notes on national accounts.
  {
    re: /^The reporting period for national accounts data is designated as either calendar year basis \(CY\) or fiscal year basis \(FY\)\. For this country, it is fiscal year-based \(fiscal year-end: (?<month>[A-Z][a-z]+) (?<day>\d{1,2})\)\. Also, an estimate \(PA\.NUS\.ATLS\) of the exchange rate covers the same period and thus differs from the official exchange rate \(CY\)\.$/,
    key: 'note.wb_national_accounts_fy',
    params: { month: 'month', day: 'number' },
  },
  {
    re: /^The World Bank systematically assesses the appropriateness of official exchange rates as conversion factors\. In this country, multiple or dual exchange rate activity exists and must be accounted for appropriately in underlying statistics\. An alternative estimate \(“alternative conversion factor” - PA\.NUS\.ATLS\) is thus calculated as a weighted average of the different exchange rates in use in the country\. Doing so better reflects economic reality and leads to more accurate cross-country comparisons and country classifications by income level\. For this country, this applies to the period (?<from>\d{4})-(?<to>\d{4})\. Alternative conversion factors are used in the Atlas methodology and elsewhere in World Development Indicators as single-year conversion factors\.$/,
    key: 'note.wb_alternative_conversion',
    params: { from: 'text', to: 'text' },
  },
  { re: /^UIS Estimation$/, key: 'note.uis_estimation', params: {} },
];

export interface NoteMessage {
  key: MessageKey;
  /** Captured values, as published (English digits). Use noteParams() to localise. */
  values: Record<string, string>;
  kinds: Record<string, ParamKind>;
}

/** Matches a publisher note to its translation key, or null if no pattern fits. */
export function matchNote(note: string): NoteMessage | null {
  for (const p of NOTE_PATTERNS) {
    const m = p.re.exec(note);
    if (!m) continue;
    const values: Record<string, string> = {};
    for (const name of Object.keys(p.params)) values[name] = m.groups![name]!;
    if (p.params.month && !MONTHS.includes(values.month!)) return null;
    return { key: p.key, values, kinds: p.params };
  }
  return null;
}

/** The values to fill into the translation, in the reader's language. */
export function noteParams(
  msg: NoteMessage,
  localiseDigits: (s: string) => string,
  monthName: (n: number) => string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(msg.values)) {
    const kind = msg.kinds[name];
    if (kind === 'number') out[name] = localiseDigits(value);
    else if (kind === 'month') out[name] = monthName(MONTHS.indexOf(value) + 1);
    // Years in a text value (e.g. 1963) are numbers too: localise digits only for 4-digit years.
    else out[name] = /^\d{4}$/.test(value) ? localiseDigits(value) : value;
  }
  return out;
}

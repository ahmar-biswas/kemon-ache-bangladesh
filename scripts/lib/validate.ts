// Validation rules for data records (docs/reference/05-data-layer.md, section 5.4).
// If any rule fails, the refresh stops and the last good data is kept.
import type { DataRecord, MedianRecord, Target } from '../../src/data/types.ts';
import type { IndicatorConfig } from '../indicators.ts';
import { MEDIAN_MIN_COUNTRIES, median } from './median.ts';

/** More than this share of existing values changing at once needs a human to look first. */
export const MAX_CHANGED_SHARE = 0.2;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpsUrl(s: unknown): boolean {
  if (typeof s !== 'string') return false;
  try {
    return new URL(s).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Checks one indicator's records on their own. Returns a list of problems (empty = valid). */
export function validateRecords(config: IndicatorConfig, records: DataRecord[]): string[] {
  const p: string[] = [];
  const where = (r: DataRecord) => `${config.id} ${r.country} ${r.year}`;

  if (records.length === 0) p.push(`${config.id}: no data returned`);

  const seen = new Set<string>();
  for (const r of records) {
    if (r.indicator_id !== config.id) p.push(`${where(r)}: indicator_id is "${r.indicator_id}"`);
    if (!/^[A-Z]{3}$/.test(r.country)) p.push(`${where(r)}: bad country code`);
    if (!Number.isInteger(r.year) || r.year < 1900 || r.year > 2100) p.push(`${where(r)}: bad year`);
    if (seen.has(`${r.country}-${r.year}`)) p.push(`${where(r)}: duplicate country and year`);
    seen.add(`${r.country}-${r.year}`);
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) p.push(`${where(r)}: value is not a number`);
    else if (r.value < config.plausibleRange[0] || r.value > config.plausibleRange[1]) {
      p.push(`${where(r)}: value ${r.value} outside plausible range ${config.plausibleRange.join('–')}`);
    }
    if (r.unit !== config.unit) p.push(`${where(r)}: unit "${r.unit}" but expected "${config.unit}"`);
    if (!isHttpsUrl(r.source_url)) p.push(`${where(r)}: missing or invalid source_url`);
    else if (!r.source_url.includes(config.code)) p.push(`${where(r)}: source_url does not point to ${config.code}`);
    if (!isHttpsUrl(r.definition_url)) p.push(`${where(r)}: missing or invalid definition_url`);
    if (!isHttpsUrl(r.api_url)) p.push(`${where(r)}: missing or invalid api_url`);
    if (typeof r.source_name !== 'string' || r.source_name.trim() === '') p.push(`${where(r)}: missing source_name`);
    if (typeof r.original_source !== 'string') p.push(`${where(r)}: original_source is not text`);
    if (typeof r.retrieved_at !== 'string' || !ISO_DATE.test(r.retrieved_at)) p.push(`${where(r)}: bad retrieved_at`);
    if (!Array.isArray(r.notes) || r.notes.some((n) => typeof n !== 'string')) p.push(`${where(r)}: notes must be a list of text`);
    if (r.measured_by !== null && typeof r.measured_by !== 'string') p.push(`${where(r)}: bad measured_by`);
  }
  return p;
}

/** Compares a new fetch with the data already published. */
export function compareWithPrevious(
  config: IndicatorConfig,
  previous: DataRecord[],
  next: DataRecord[],
): { problems: string[]; changed: boolean } {
  const problems: string[] = [];
  if (previous.length === 0) return { problems, changed: next.length > 0 };

  const prevUnit = previous[0]!.unit;
  if (next.some((r) => r.unit !== prevUnit)) problems.push(`${config.id}: unit changed from "${prevUnit}"`);

  // Latest year must not go backwards for any country that had data before.
  const latestBy = (rs: DataRecord[]) => {
    const m = new Map<string, number>();
    for (const r of rs) m.set(r.country, Math.max(m.get(r.country) ?? -Infinity, r.year));
    return m;
  };
  const nextLatest = latestBy(next);
  for (const [country, year] of latestBy(previous)) {
    const now = nextLatest.get(country);
    if (now === undefined) problems.push(`${config.id} ${country}: all data disappeared (latest was ${year})`);
    else if (now < year) problems.push(`${config.id} ${country}: latest year went backwards (${year} → ${now})`);
  }

  const nextByKey = new Map(next.map((r) => [`${r.country}-${r.year}`, r]));
  let changedCount = 0;
  for (const r of previous) {
    const n = nextByKey.get(`${r.country}-${r.year}`);
    if (!n || n.value !== r.value) changedCount++;
  }
  if (changedCount / previous.length > MAX_CHANGED_SHARE) {
    problems.push(
      `${config.id}: ${changedCount} of ${previous.length} existing values changed or disappeared ` +
        `(over ${MAX_CHANGED_SHARE * 100}%). Needs a human to review before publishing.`,
    );
  }

  const changed =
    changedCount > 0 ||
    next.length !== previous.length ||
    next.some((r, i) => JSON.stringify({ ...r, retrieved_at: '' }) !== JSON.stringify({ ...previous[i], retrieved_at: '' }));
  return { problems, changed };
}

/** Checks the "Calculated by this site" median records for one indicator. */
export function validateMedians(config: IndicatorConfig, medians: MedianRecord[]): string[] {
  const p: string[] = [];
  const years = new Set<number>();
  for (const m of medians) {
    const where = `${config.id} median ${m.year}`;
    if (years.has(m.year)) p.push(`${where}: duplicate year`);
    years.add(m.year);
    if (m.indicator_id !== config.id) p.push(`${where}: indicator_id is "${m.indicator_id}"`);
    if (m.unit !== config.unit) p.push(`${where}: unit "${m.unit}"`);
    if (m.calculated_by_site !== true) p.push(`${where}: not labelled "Calculated by this site"`);
    if (m.inputs.length < MEDIAN_MIN_COUNTRIES) p.push(`${where}: only ${m.inputs.length} inputs`);
    if (m.inputs.some((i) => !Number.isFinite(i.value))) p.push(`${where}: an input is not a number`);
    else if (m.value !== median(m.inputs.map((i) => i.value))) p.push(`${where}: value is not the median of its inputs`);
    if (!isHttpsUrl(m.inputs_source_url) || !m.inputs_source_url.includes(config.code)) p.push(`${where}: bad inputs_source_url`);
    if (!isHttpsUrl(m.classification_url)) p.push(`${where}: bad classification_url`);
    if (!ISO_DATE.test(m.retrieved_at) || !ISO_DATE.test(m.classification_retrieved_at)) p.push(`${where}: bad dates`);
  }
  return p;
}

/** Checks the hand-written goals file against the indicators it refers to. */
export function validateTargets(targets: Target[], metas: { id: string; unit: string }[]): string[] {
  const p: string[] = [];
  for (const t of targets) {
    const m = metas.find((x) => x.id === t.indicator_id);
    if (!m) p.push(`targets.json: unknown indicator ${t.indicator_id}`);
    else if (m.unit !== t.unit) p.push(`targets.json ${t.indicator_id}: unit ${t.unit} but the indicator is ${m.unit}`);
    if (!Number.isFinite(t.value)) p.push(`targets.json ${t.indicator_id}: value is not a number`);
    if (!isHttpsUrl(t.source_url)) p.push(`targets.json ${t.indicator_id}: bad source_url`);
    if (!t.source_text?.trim() || !t.source_name?.trim()) p.push(`targets.json ${t.indicator_id}: missing source text or name`);
  }
  if (new Set(targets.map((t) => t.indicator_id)).size !== targets.length) p.push('targets.json: an indicator has two goals');
  return p;
}

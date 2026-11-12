// Validation rules for data records (docs/reference/05-data-layer.md, section 5.4).
// If any rule fails, the refresh stops and the last good data is kept.
import type { DataRecord } from '../../src/data/types.ts';
import type { IndicatorConfig } from '../indicators.ts';

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

  const years = new Set<number>();
  for (const r of records) {
    if (r.indicator_id !== config.id) p.push(`${where(r)}: indicator_id is "${r.indicator_id}"`);
    if (!/^[A-Z]{3}$/.test(r.country)) p.push(`${where(r)}: bad country code`);
    if (!Number.isInteger(r.year) || r.year < 1900 || r.year > 2100) p.push(`${where(r)}: bad year`);
    if (years.has(r.year)) p.push(`${where(r)}: duplicate year`);
    years.add(r.year);
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

  const latest = (rs: DataRecord[]) => Math.max(...rs.map((r) => r.year));
  if (next.length > 0 && latest(next) < latest(previous)) {
    problems.push(`${config.id}: latest year went backwards (${latest(previous)} → ${latest(next)})`);
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

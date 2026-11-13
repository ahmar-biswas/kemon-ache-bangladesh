// The source line shown directly under every value (hard rule R1):
// source name (linked to the exact dataset page), data year, retrieved date.
// The compact form (dashboard rows) has the same three parts, with the short source name
// and a short date, so it fits on one line: "Source: World Bank (WDI), 2025 data, retrieved 13 Nov 2026".
import type { DataRecord } from '../data/types.ts';
import { SOURCE_KEYS, SOURCE_SHORT_KEYS } from '../data/sources.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatDate, formatDateShort, formatYear } from '../lib/format.ts';

interface Props {
  record: Pick<DataRecord, 'source_name' | 'source_url' | 'year' | 'retrieved_at'>;
  lang: Lang;
  /** Smaller, one-line version for dashboard rows. Same three parts (R1). */
  compact?: boolean;
}

/**
 * Compact source line(s) for a dashboard row. When the row shows two series from the same
 * source, year and retrieval date (taka value + PPP comparison), one line carries both links:
 * "Source: World Bank (WDI) [taka] [PPP], 2025 data, retrieved 13 Nov 2026". Otherwise one line each.
 */
export function CompactSources({ records, lang, linkLabels }: { records: Props['record'][]; lang: Lang; linkLabels: string[] }) {
  const [a, b] = records;
  if (!a) return null;
  const same = b && a.source_name === b.source_name && a.year === b.year && a.retrieved_at === b.retrieved_at;
  if (!b || !same) return <>{records.map((r) => <SourceLine key={r.source_url} record={r} lang={lang} compact />)}</>;
  const shortKey = SOURCE_SHORT_KEYS[a.source_name];
  if (!shortKey || !a.source_url || !b.source_url) throw new Error(`No translated name for source "${a.source_name}"`);
  return (
    <p className="source-line source-line--compact" data-source-line="">
      {t(lang, 'source.label')}: <span title={t(lang, SOURCE_KEYS[a.source_name]!)}>{t(lang, shortKey)}</span>{' '}
      {[a, b].map((r, i) => (
        <span key={r.source_url}>
          {i > 0 && ' '}
          <a href={r.source_url} target="_blank" rel="noopener noreferrer">
            {linkLabels[i]}
          </a>
        </span>
      ))}
      {', '}
      <span data-source-year="">{t(lang, 'source.compact_year', { year: formatYear(a.year, lang) })}</span>
      {', '}
      <span data-source-retrieved="">{t(lang, 'source.compact_retrieved', { date: formatDateShort(a.retrieved_at, lang) })}</span>
    </p>
  );
}

export function SourceLine({ record, lang, compact }: Props) {
  // No source, no display (R2).
  if (!record.source_url) return null;
  const nameKey = (compact ? SOURCE_SHORT_KEYS : SOURCE_KEYS)[record.source_name];
  if (!nameKey) throw new Error(`No translated name for source "${record.source_name}"`);

  if (compact) {
    return (
      <p className="source-line source-line--compact" data-source-line="">
        {t(lang, 'source.label')}:{' '}
        <a href={record.source_url} target="_blank" rel="noopener noreferrer" title={t(lang, SOURCE_KEYS[record.source_name]!)}>
          {t(lang, nameKey)}
        </a>
        {', '}
        <span data-source-year="">{t(lang, 'source.compact_year', { year: formatYear(record.year, lang) })}</span>
        {', '}
        <span data-source-retrieved="">{t(lang, 'source.compact_retrieved', { date: formatDateShort(record.retrieved_at, lang) })}</span>
      </p>
    );
  }

  return (
    <p className="source-line" data-source-line="">
      <span>
        {t(lang, 'source.label')}:{' '}
        <a href={record.source_url} target="_blank" rel="noopener noreferrer">
          {t(lang, nameKey)}
        </a>
      </span>{' '}
      <span data-source-year="">{t(lang, 'source.data_year', { year: formatYear(record.year, lang) })}</span>{' '}
      <span data-source-retrieved="">
        {t(lang, 'source.retrieved', { date: formatDate(record.retrieved_at, lang) })}
      </span>
    </p>
  );
}

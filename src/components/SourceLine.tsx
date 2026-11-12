// The source line shown directly under every value (hard rule R1):
// source name (linked to the exact dataset page), data year, retrieved date.
import type { DataRecord } from '../data/types.ts';
import { SOURCE_KEYS } from '../data/sources.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatDate, formatYear } from '../lib/format.ts';

interface Props {
  record: Pick<DataRecord, 'source_name' | 'source_url' | 'year' | 'retrieved_at'>;
  lang: Lang;
}

export function SourceLine({ record, lang }: Props) {
  // No source, no display (R2).
  if (!record.source_url) return null;
  const nameKey = SOURCE_KEYS[record.source_name];
  if (!nameKey) throw new Error(`No translated name for source "${record.source_name}"`);

  return (
    <p className="source-line" data-source-line="">
      {t(lang, 'source.label')}:{' '}
      <a href={record.source_url} target="_blank" rel="noopener noreferrer">
        {t(lang, nameKey)}
      </a>
      {' · '}
      <span data-source-year="">{t(lang, 'source.data_year', { year: formatYear(record.year, lang) })}</span>
      {' · '}
      <span data-source-retrieved="">
        {t(lang, 'source.retrieved', { date: formatDate(record.retrieved_at, lang) })}
      </span>
    </p>
  );
}

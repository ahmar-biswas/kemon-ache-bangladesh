// One headline value with its notes and source line. Unstyled until Milestone 3.
import type { DataRecord } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatValue } from '../lib/formatValue.ts';
import { noteText } from '../lib/noteText.ts';
import { SourceLine } from './SourceLine.tsx';

interface Props {
  label: string;
  /** The record to show, or undefined when the source has no value (R3). */
  record: DataRecord | undefined;
  lang: Lang;
}

export function Figure({ label, record, lang }: Props) {
  if (!record) {
    return (
      <section className="figure" data-figure="">
        <h2>{label}</h2>
        <p data-not-available="">{t(lang, 'data.not_available')}</p>
      </section>
    );
  }

  // No source, no display (R2): a value without a link to where it came from is not shown at all.
  if (!record.source_url) return null;

  return (
    <section className="figure" data-figure="">
      <h2>{label}</h2>
      <p className="figure-value" data-value="">
        {formatValue(record, lang)}
      </p>
      {record.notes.map((note, i) => {
        return (
          <p className="figure-note" key={i}>
            {t(lang, 'source.notes', { note: noteText(note, lang) })}
          </p>
        );
      })}
      <SourceLine record={record} lang={lang} />
    </section>
  );
}

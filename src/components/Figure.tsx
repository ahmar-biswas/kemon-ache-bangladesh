// One headline value with its notes and source line. Unstyled until Milestone 3.
import type { DataRecord } from '../data/types.ts';
import { NOTE_KEYS } from '../data/notes.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatValue } from '../lib/formatValue.ts';
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
      {record.notes.map((note) => {
        const key = NOTE_KEYS[note];
        if (!key) throw new Error(`No translation key for note: ${note.slice(0, 80)}…`);
        return (
          <p className="figure-note" key={key}>
            {t(lang, 'source.notes', { note: t(lang, key) })}
          </p>
        );
      })}
      <SourceLine record={record} lang={lang} />
    </section>
  );
}

// One headline value with its notes and source line. Unstyled until Milestone 3.
import type { DataRecord } from '../data/types.ts';
import { matchNote, noteParams } from '../data/notes.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';
import { formatValue } from '../lib/formatValue.ts';
import { toBanglaDigits } from '../lib/format.ts';
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
        const msg = matchNote(note);
        if (!msg) throw new Error(`No translation pattern for note: ${note.slice(0, 80)}…`);
        const params = noteParams(
          msg,
          (s) => (lang === 'bn' ? toBanglaDigits(s) : s),
          (n) => t(lang, `month.${n}` as MessageKey),
        );
        return (
          <p className="figure-note" key={i}>
            {t(lang, 'source.notes', { note: t(lang, msg.key, params) })}
          </p>
        );
      })}
      <SourceLine record={record} lang={lang} />
    </section>
  );
}

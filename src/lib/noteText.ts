// A publisher's note in the reader's language (rule R8). Notes are stored word for word in
// English; each is matched to a translated pattern (src/data/notes.ts). A note with no
// pattern is never shown half-translated: callers check with matchNote first.
import { matchNote, noteParams } from '../data/notes.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';
import { toBanglaDigits } from './format.ts';

export function noteText(note: string, lang: Lang): string {
  const msg = matchNote(note);
  if (!msg) throw new Error(`No translation pattern for note: ${note.slice(0, 80)}…`);
  return t(
    lang,
    msg.key,
    noteParams(
      msg,
      (s) => (lang === 'bn' ? toBanglaDigits(s) : s),
      (n) => t(lang, `month.${n}` as MessageKey),
    ),
  );
}

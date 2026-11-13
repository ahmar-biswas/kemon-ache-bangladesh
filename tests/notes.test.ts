// Publisher notes are translated by pattern (src/data/notes.ts). These tests check that
// the English template gives back the publisher's exact words for every note in the data,
// so a translation can never quietly change what the source said.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { matchNote, noteParams } from '../src/data/notes.ts';
import type { DataRecord } from '../src/data/types.ts';
import { t, type MessageKey } from '../src/i18n/index.ts';
import { toBanglaDigits } from '../src/lib/format.ts';

const dir = resolve(import.meta.dirname, '../data/processed');
const notes = new Set<string>();
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json') || ['countries.json', 'indicators.json', 'meta.json'].includes(f)) continue;
  for (const r of JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as DataRecord[]) for (const n of r.notes) notes.add(n);
}

const month = (lang: 'en' | 'bn') => (n: number) => t(lang, `month.${n}` as MessageKey);

describe('publisher notes', () => {
  it('there are notes in the data to check', () => {
    expect(notes.size).toBeGreaterThan(0);
  });

  it('every note matches a pattern, and the English template gives back the exact text', () => {
    for (const note of notes) {
      const msg = matchNote(note);
      expect(msg, note.slice(0, 80)).not.toBeNull();
      expect(t('en', msg!.key, noteParams(msg!, (s) => s, month('en')))).toBe(note);
    }
  });

  it('every note renders in Bangla with no English digits in numbers and months', () => {
    const msg = matchNote('Uncertainty bound is 240.6 - 289.6')!;
    expect(t('bn', msg.key, noteParams(msg, toBanglaDigits, month('bn')))).toBe('অনিশ্চয়তার সীমা ২৪০.৬ - ২৮৯.৬');
    for (const note of notes) {
      const m = matchNote(note)!;
      expect(() => t('bn', m.key, noteParams(m, toBanglaDigits, month('bn')))).not.toThrow();
    }
  });

  it('a changed note is not matched (so the data check fails until a person looks)', () => {
    expect(matchNote('Uncertainty bound is roughly 5')).toBeNull();
    expect(matchNote('UIS estimate')).toBeNull();
  });
});

// Publisher notes are translated by pattern (src/data/notes.ts). These tests check that
// the English template gives back the publisher's exact words for every note in the data,
// so a translation can never quietly change what the source said.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { matchNote } from '../src/data/notes.ts';
import type { DataRecord, WorldFile } from '../src/data/types.ts';
import { noteText } from '../src/lib/noteText.ts';

const dir = resolve(import.meta.dirname, '../data/processed');
const notes = new Set<string>();
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json') || ['countries.json', 'indicators.json', 'meta.json', 'latest.json', 'details.json'].includes(f)) continue;
  for (const r of JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as DataRecord[]) for (const n of r.notes) notes.add(n);
}
/** Notes on every country's latest value (the country picker). Since M7 every one is translated. */
const worldNotes = new Set<string>();
for (const f of readdirSync(resolve(dir, 'world'))) {
  for (const r of (JSON.parse(readFileSync(resolve(dir, 'world', f), 'utf8')) as WorldFile).rows) for (const n of r.notes) worldNotes.add(n);
}

describe('publisher notes', () => {
  it('there are notes in the data to check', () => {
    expect(notes.size).toBeGreaterThan(0);
  });

  it('every note matches a pattern, and the English template gives back the exact text', () => {
    for (const note of notes) {
      expect(matchNote(note), note.slice(0, 80)).not.toBeNull();
      expect(noteText(note, 'en')).toBe(note);
    }
  });

  it('every note on any country (the country picker) is translated, so no country is greyed out for its note', () => {
    for (const note of worldNotes) {
      expect(matchNote(note), note.slice(0, 80)).not.toBeNull();
      expect(noteText(note, 'en')).toBe(note);
    }
  });

  it('every note renders in Bangla, with no unfilled placeholders', () => {
    expect(noteText('Uncertainty bound is 240.6 - 289.6', 'bn')).toBe('অনিশ্চয়তার সীমা ২৪০.৬ - ২৮৯.৬');
    for (const note of [...notes, ...worldNotes]) {
      expect(noteText(note, 'bn')).not.toMatch(/\{\w+\}/);
    }
  });

  it("a note made of known sentences keeps the publisher's spacing", () => {
    const note = "Excluding Transnistria. For 1950-94, World Bank estimates using UN World Population Prospects' growth rates of whole Moldova.";
    expect(matchNote(note)?.segments.length).toBe(2);
    expect(noteText(note, 'en')).toBe(note);
  });

  it('a changed note is not matched (so the data check fails until a person looks)', () => {
    expect(matchNote('Uncertainty bound is roughly 5')).toBeNull();
    expect(matchNote('UIS estimate, revised')).toBeNull();
    // Known sentences followed by something new: never matched in part.
    expect(matchNote('Excluding Transnistria. Something new.')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import bn from '../src/i18n/bn.json';
import { checkTranslations } from '../src/i18n/check.ts';
import { t } from '../src/i18n/index.ts';

describe('translation files', () => {
  it('have a Bangla value for every English key', () => {
    expect(checkTranslations(en, bn)).toEqual([]);
  });
});

describe('checkTranslations catches problems', () => {
  it('missing Bangla', () => {
    expect(checkTranslations({ a: 'Hello' }, {})).toEqual(['bn.json: missing Bangla for "a"']);
  });
  it('empty Bangla', () => {
    expect(checkTranslations({ a: 'Hello' }, { a: ' ' })).toHaveLength(1);
  });
  it('untranslated (identical) Bangla', () => {
    expect(checkTranslations({ a: 'Hello' }, { a: 'Hello' })[0]).toMatch(/identical/);
  });
  it('different placeholders', () => {
    expect(checkTranslations({ a: '{value} years' }, { a: '{val} বছর' })[0]).toMatch(/placeholders/);
  });
  it('extra Bangla key', () => {
    expect(checkTranslations({}, { b: 'বাংলা' })[0]).toMatch(/no English/);
  });
});

describe('t()', () => {
  it('fills placeholders', () => {
    expect(t('en', 'unit.years.value', { value: '74.9' })).toBe('74.9 years');
    expect(t('bn', 'unit.years.value', { value: '৭৪.৯' })).toBe('৭৪.৯ বছর');
  });
  it('throws when a placeholder value is missing', () => {
    expect(() => t('en', 'unit.years.value')).toThrow();
  });
});

describe('BANGLA_REVIEW.md', () => {
  it('lists every Bangla string as it is now (run `npm run bangla:review` after changing bn.json)', async () => {
    const { readFileSync } = await import('node:fs');
    const review = readFileSync('BANGLA_REVIEW.md', 'utf8');
    const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
    const stale = Object.entries(bn as Record<string, string>).filter(([k, v]) => !review.includes(`\`${k}\` |`) || !review.includes(cell(v)));
    expect(stale.map(([k]) => k)).toEqual([]);
  });
});

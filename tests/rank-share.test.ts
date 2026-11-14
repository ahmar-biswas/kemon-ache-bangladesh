// Ranks as a share of the countries ranked (DECISIONS.md 129).
import { describe, expect, it } from 'vitest';
import { aboveFormula, abovePct, rankAbovePercent } from '../src/lib/rankShare.ts';

describe('ranked above X%', () => {
  it('is (z − y) ÷ z, rounded down', () => {
    expect(rankAbovePercent(130, 193)).toBe(32); // 63/193 = 32.6
    expect(rankAbovePercent(84, 122)).toBe(31); // 38/122 = 31.1
    expect(rankAbovePercent(1, 180)).toBe(99);
    expect(rankAbovePercent(180, 180)).toBe(0);
  });
  it('refuses a rank outside the list', () => {
    expect(() => rankAbovePercent(0, 10)).toThrow();
    expect(() => rankAbovePercent(11, 10)).toThrow();
  });
  it('is written in the reader\'s digits, with its formula and inputs', () => {
    expect(abovePct(130, 193, 'en')).toBe('32%');
    expect(abovePct(130, 193, 'bn')).toBe('৩২%');
    expect(aboveFormula(130, 193, 'en')).toBe('Percentage calculated by this site: (193 − 130) ÷ 193, rounded down.');
  });
});

// The numbers in this file are test inputs, not site data.
import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatTaka,
  formatTakaWords,
  formatUsd,
  formatYear,
  toBanglaDigits,
} from '../src/lib/format.ts';

describe('toBanglaDigits', () => {
  it('maps every digit', () => {
    expect(toBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  });
  it('leaves other characters alone', () => {
    expect(toBanglaDigits('৳1,234.5%')).toBe('৳১,২৩৪.৫%');
  });
});

describe('formatNumber', () => {
  it('uses standard grouping and fixed decimals', () => {
    expect(formatNumber(1234567.891, 'en', 1)).toBe('1,234,567.9');
    expect(formatNumber(1234567.891, 'bn', 1)).toBe('১,২৩৪,৫৬৭.৯');
  });
  it('keeps trailing zeros so decimals line up', () => {
    expect(formatNumber(74, 'en', 1)).toBe('74.0');
    expect(formatNumber(74, 'bn', 1)).toBe('৭৪.০');
  });
  it('handles negatives', () => {
    expect(formatNumber(-2.25, 'en', 1)).toBe('-2.3');
    expect(formatNumber(-2.25, 'bn', 1)).toBe('-২.৩');
  });
  it('refuses non-numbers', () => {
    expect(() => formatNumber(Number.NaN, 'en')).toThrow();
  });
});

describe('formatPercent', () => {
  it('formats in both languages', () => {
    expect(formatPercent(8.7687, 'en')).toBe('8.8%');
    expect(formatPercent(8.7687, 'bn')).toBe('৮.৮%');
    expect(formatPercent(10.4657, 'en', 2)).toBe('10.47%');
  });
});

describe('formatYear', () => {
  it('never groups years', () => {
    expect(formatYear(2024, 'en')).toBe('2024');
    expect(formatYear(2024, 'bn')).toBe('২০২৪');
  });
  it('rejects non four-digit years', () => {
    expect(() => formatYear(24, 'en')).toThrow();
    expect(() => formatYear(2024.5, 'en')).toThrow();
  });
});

describe('formatTaka', () => {
  it('uses lakh/crore grouping in both languages', () => {
    expect(formatTaka(273000, 'en')).toBe('৳2,73,000');
    expect(formatTaka(273000, 'bn')).toBe('৳২,৭৩,০০০');
    expect(formatTaka(123456789, 'en')).toBe('৳12,34,56,789');
    expect(formatTaka(123456789, 'bn')).toBe('৳১২,৩৪,৫৬,৭৮৯');
  });
  it('rounds to whole taka by default', () => {
    expect(formatTaka(288233.78, 'en')).toBe('৳2,88,234');
  });
});

describe('formatTakaWords', () => {
  it('uses lakh and crore words', () => {
    expect(formatTakaWords(288234, 'en')).toBe('৳2.88 lakh');
    expect(formatTakaWords(288234, 'bn')).toBe('৳২.৮৮ লাখ');
    expect(formatTakaWords(125000000, 'en')).toBe('৳12.50 crore');
    expect(formatTakaWords(125000000, 'bn')).toBe('৳১২.৫০ কোটি');
  });
  it('shows small amounts in full', () => {
    expect(formatTakaWords(45000, 'bn')).toBe('৳৪৫,০০০');
  });
});

describe('formatUsd', () => {
  it('uses million/billion words with standard grouping', () => {
    expect(formatUsd(21400000000, 'en')).toBe('US$21.4 billion');
    expect(formatUsd(21400000000, 'bn')).toBe('US$২১.৪ বিলিয়ন');
    expect(formatUsd(3500000, 'en')).toBe('US$3.5 million');
    expect(formatUsd(3500000, 'bn')).toBe('US$৩.৫ মিলিয়ন');
    expect(formatUsd(273000, 'en')).toBe('US$273,000');
  });
});

describe('formatDate', () => {
  it('writes day, month name and four-digit year', () => {
    expect(formatDate('2026-11-13', 'en')).toBe('13 November 2026');
    expect(formatDate('2026-11-13', 'bn')).toBe('১৩ নভেম্বর ২০২৬');
    expect(formatDate('2025-01-05', 'en')).toBe('5 January 2025');
    expect(formatDate('2025-01-05', 'bn')).toBe('৫ জানুয়ারি ২০২৫');
  });
  it('rejects malformed dates', () => {
    expect(() => formatDate('13/11/2026', 'en')).toThrow();
    expect(() => formatDate('2026-13-01', 'en')).toThrow();
  });
});

// Number, currency and date formatting for both languages.
//
// Approach: format digits with the browser's Intl in English ("en-IN" for lakh/crore
// grouping, "en-US" for standard thousands grouping), then swap 0-9 for Bangla digits
// in Bangla mode. This gives identical grouping in both languages and avoids differences
// between browsers' Bangla locale data. Unit tests pin the exact output.
import { t, type Lang, type MessageKey } from '../i18n/index.ts';

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Replace ASCII digits 0-9 with Bangla digits. Other characters are left as they are. */
export function toBanglaDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]!);
}

function localiseDigits(text: string, lang: Lang): string {
  return lang === 'bn' ? toBanglaDigits(text) : text;
}

function assertFinite(value: number): void {
  if (!Number.isFinite(value)) throw new Error(`Cannot format a non-number: ${value}`);
}

type Grouping = 'standard' | 'lakh';

function digits(value: number, decimals: number, grouping: Grouping): string {
  assertFinite(value);
  return new Intl.NumberFormat(grouping === 'lakh' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value);
}

/** A plain number with standard grouping, e.g. 74.9 / ৭৪.৯, 12,345 / ১২,৩৪৫. */
export function formatNumber(value: number, lang: Lang, decimals = 0): string {
  return localiseDigits(digits(value, decimals, 'standard'), lang);
}

/** A percentage, e.g. 8.8% / ৮.৮%. The value is already in percent (8.8 means 8.8%). */
export function formatPercent(value: number, lang: Lang, decimals = 1): string {
  return `${formatNumber(value, lang, decimals)}%`;
}

/** A year: always four digits and never grouped (2024 / ২০২৪, not 2,024). */
export function formatYear(year: number, lang: Lang): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`Not a four-digit year: ${year}`);
  }
  return localiseDigits(String(year), lang);
}

/** Taka with lakh/crore grouping in both languages: ৳2,88,234 / ৳২,৮৮,২৩৪. */
export function formatTaka(value: number, lang: Lang, decimals = 0): string {
  return `৳${localiseDigits(digits(value, decimals, 'lakh'), lang)}`;
}

/**
 * Taka in words for large amounts: ৳2.88 lakh / ৳২.৮৮ লাখ, ৳1.25 crore / ৳১.২৫ কোটি.
 * Below one lakh the full grouped amount is shown.
 */
export function formatTakaWords(value: number, lang: Lang, decimals = 2): string {
  assertFinite(value);
  const abs = Math.abs(value);
  if (abs >= 1e7) return `৳${formatNumber(value / 1e7, lang, decimals)} ${t(lang, 'number.crore')}`;
  if (abs >= 1e5) return `৳${formatNumber(value / 1e5, lang, decimals)} ${t(lang, 'number.lakh')}`;
  return formatTaka(value, lang, 0);
}

/**
 * US dollars as published, with standard grouping and million/billion words:
 * US$21.4 billion / US$২১.৪ বিলিয়ন. Below one million the full grouped amount is shown.
 */
export function formatUsd(value: number, lang: Lang, decimals = 1): string {
  assertFinite(value);
  const abs = Math.abs(value);
  if (abs >= 1e9) return `US$${formatNumber(value / 1e9, lang, decimals)} ${t(lang, 'number.billion')}`;
  if (abs >= 1e6) return `US$${formatNumber(value / 1e6, lang, decimals)} ${t(lang, 'number.million')}`;
  return `US$${formatNumber(value, lang, 0)}`;
}

/** A calendar date from "YYYY-MM-DD": 13 November 2026 / ১৩ নভেম্বর ২০২৬. */
export function formatDate(isoDate: string, lang: Lang): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Not an ISO date (YYYY-MM-DD): ${isoDate}`);
  const [, y, m, d] = match;
  const month = Number(m);
  if (month < 1 || month > 12) throw new Error(`Bad month in ${isoDate}`);
  const monthName = t(lang, `month.${month}` as MessageKey);
  return `${localiseDigits(String(Number(d)), lang)} ${monthName} ${formatYear(Number(y), lang)}`;
}

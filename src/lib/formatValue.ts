// Formats one record's value for display. Every unit maps to exactly one formatter.
import type { DataRecord, Unit } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatLargeWords, formatNumber, formatPercent, formatTakaWords } from './format.ts';

const FORMATTERS: Record<Unit, (value: number, lang: Lang) => string> = {
  years: (v, lang) => t(lang, 'unit.years.value', { value: formatNumber(v, lang, 1) }),
  // Words for large amounts (৳3.14 lakh, ৳55.12 lakh crore), as in the homepage sketch (9.1).
  taka_current: (v, lang) => formatTakaWords(v, lang, 2),
  // Constant taka: the indicator name says "at constant prices"; the amount looks the same.
  taka_constant: (v, lang) => formatTakaWords(v, lang, 2),
  // International dollars are not US dollars, so no "US$" sign: the unit is written out.
  intl_dollar_current: (v, lang) => t(lang, 'unit.intl_dollar.value', { value: formatLargeWords(v, lang, 2) }),
  percent: (v, lang) => formatPercent(v, lang, 1),
  ug_m3: (v, lang) => t(lang, 'unit.ug_m3.value', { value: formatNumber(v, lang, 1) }),
  rank: (v, lang) => t(lang, 'unit.rank.value', { value: formatNumber(v, lang, 0) }),
  per_1000_live_births: (v, lang) => t(lang, 'unit.per_1000_live_births.value', { value: formatNumber(v, lang, 1) }),
};

export function formatValue(record: Pick<DataRecord, 'value' | 'unit'>, lang: Lang): string {
  const format = FORMATTERS[record.unit];
  if (!format) throw new Error(`No formatter for unit "${record.unit}"`);
  return format(record.value, lang);
}

/**
 * For large headline values: the number on its own and the unit as words, so a unit like
 * "per 1,000 live births" can be set small beside the number instead of in display size.
 * Units shown as a symbol (৳, %) stay attached to the number.
 */
export function valueParts(record: Pick<DataRecord, 'value' | 'unit' | 'out_of'>, lang: Lang, short = false): { number: string; unit: string | null } {
  switch (record.unit) {
    case 'years':
      return { number: formatNumber(record.value, lang, 1), unit: t(lang, 'unit.years.label') };
    case 'per_1000_live_births':
      return { number: formatNumber(record.value, lang, 1), unit: t(lang, short ? 'unit.per_1000_live_births.short' : 'unit.per_1000_live_births.label') };
    case 'intl_dollar_current':
      return { number: formatLargeWords(record.value, lang, 2), unit: t(lang, 'unit.intl_dollar.label') };
    case 'rank':
      return {
        number: t(lang, 'unit.rank.number', { value: formatNumber(record.value, lang, 0) }),
        unit: record.out_of ? t(lang, 'unit.rank.of', { n: formatNumber(record.out_of, lang, 0) }) : null,
      };
    case 'ug_m3':
      return { number: formatNumber(record.value, lang, 1), unit: t(lang, 'unit.ug_m3.label') };
    default:
      return { number: formatValue(record, lang), unit: null };
  }
}

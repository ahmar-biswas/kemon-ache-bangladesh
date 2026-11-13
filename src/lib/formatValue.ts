// Formats one record's value for display. Every unit maps to exactly one formatter.
import type { DataRecord, Unit } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber, formatPercent, formatTaka } from './format.ts';

const FORMATTERS: Record<Unit, (value: number, lang: Lang) => string> = {
  years: (v, lang) => t(lang, 'unit.years.value', { value: formatNumber(v, lang, 1) }),
  taka_current: (v, lang) => formatTaka(v, lang, 0),
  // Constant taka: the indicator name says "at constant prices"; the amount looks the same.
  taka_constant: (v, lang) => formatTaka(v, lang, 0),
  // International dollars are not US dollars, so no "US$" sign: the unit is written out.
  intl_dollar_current: (v, lang) => t(lang, 'unit.intl_dollar.value', { value: formatNumber(v, lang, 0) }),
  percent: (v, lang) => formatPercent(v, lang, 1),
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
export function valueParts(record: Pick<DataRecord, 'value' | 'unit'>, lang: Lang): { number: string; unit: string | null } {
  switch (record.unit) {
    case 'years':
      return { number: formatNumber(record.value, lang, 1), unit: t(lang, 'unit.years.label') };
    case 'per_1000_live_births':
      return { number: formatNumber(record.value, lang, 1), unit: t(lang, 'unit.per_1000_live_births.label') };
    case 'intl_dollar_current':
      return { number: formatNumber(record.value, lang, 0), unit: t(lang, 'unit.intl_dollar.label') };
    default:
      return { number: formatValue(record, lang), unit: null };
  }
}

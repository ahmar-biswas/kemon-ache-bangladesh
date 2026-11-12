// Formats one record's value for display. Every unit maps to exactly one formatter.
import type { DataRecord, Unit } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber, formatPercent, formatTaka } from './format.ts';

const FORMATTERS: Record<Unit, (value: number, lang: Lang) => string> = {
  years: (v, lang) => t(lang, 'unit.years.value', { value: formatNumber(v, lang, 1) }),
  taka_current: (v, lang) => formatTaka(v, lang, 0),
  percent: (v, lang) => formatPercent(v, lang, 1),
};

export function formatValue(record: Pick<DataRecord, 'value' | 'unit'>, lang: Lang): string {
  const format = FORMATTERS[record.unit];
  if (!format) throw new Error(`No formatter for unit "${record.unit}"`);
  return format(record.value, lang);
}

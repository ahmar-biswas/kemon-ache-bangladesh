// Small display helpers shared by tiles, strips and tables.
import countriesBn from '../i18n/countries.bn.json';
import enMessages from '../i18n/en.json';
import type { CountriesFile, DataRecord, IndicatorMeta } from '../data/types.ts';
import { hasKey, t, type Lang, type MessageKey } from '../i18n/index.ts';
import { formatNumber, formatTaka, toBanglaDigits } from './format.ts';

const BN = countriesBn as Record<string, string>;

/** Country name in the reader's language: Bangla from countries.bn.json, English as the World Bank writes it. */
export function countryName(id: string, lang: Lang, countries: CountriesFile): string {
  if (lang === 'bn') {
    const bn = BN[id];
    if (!bn) throw new Error(`No Bangla name for ${id} in countries.bn.json`);
    return bn;
  }
  const c = countries.countries.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown country ${id}`);
  return c.name;
}

export function indicatorName(id: string, lang: Lang): string {
  const key = `indicator.${id}.name`;
  if (!hasKey(key)) throw new Error(`No name for indicator ${id}`);
  return t(lang, key);
}

/**
 * The plain-language explanation (section 11), with its placeholders filled from the record.
 * {value}: the value as the sentence needs it (taka amount, or a bare number before "%").
 * {value_plus_100}: 100 plus the value, for the inflation sentence.
 * {line}: read from the World Bank series name (indicators.json params).
 */
export function explanation(meta: IndicatorMeta, record: DataRecord | undefined, lang: Lang): string | null {
  const key = `explain.${meta.explanation_id}` as MessageKey;
  if (!hasKey(key)) return null;
  const needsValue = /\{value/.test((enMessages as Record<string, string>)[key] ?? '');
  if (needsValue && !record) return null;
  const params: Record<string, string> = { ...meta.params };
  // The poverty line is stored as published ("$3.00"); show it with the reader's digits.
  const dollars = /^\$([\d.]+)$/.exec(params.line ?? '');
  if (dollars) params.line = t(lang, 'unit.dollar_amount', { value: lang === 'bn' ? toBanglaDigits(dollars[1]!) : dollars[1]! });
  if (record) {
    const v = record.value;
    params.value = record.unit === 'taka_current' || record.unit === 'taka_constant' ? formatTaka(v, lang, 0) : formatNumber(v, lang, 1);
    params.value_plus_100 = formatNumber(100 + v, lang, 0);
  }
  return t(lang, key, params);
}


/** Short name for compact dashboard rows (full name via indicatorName). */
export function indicatorShortName(id: string, lang: Lang): string {
  const key = `indicator.${id}.short`;
  return hasKey(key) ? t(lang, key) : indicatorName(id, lang);
}

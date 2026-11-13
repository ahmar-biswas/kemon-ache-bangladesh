// Country names for the homepage without loading the full country list: English from
// latest.json (as the World Bank writes them), Bangla from countries.bn.json.
import countriesBn from '../i18n/countries.bn.json';
import type { Lang } from '../i18n/index.ts';

const BN = countriesBn as Record<string, string>;

export function countryLabel(id: string, lang: Lang, englishNames: Record<string, string>): string {
  const name = lang === 'bn' ? BN[id] : englishNames[id];
  if (!name) throw new Error(`No ${lang} name for ${id}`);
  return name;
}

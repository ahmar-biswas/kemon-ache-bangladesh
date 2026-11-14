// World ranks as a share of the countries ranked (Ahmar, 2026-11-14; DECISIONS.md 129). Rankings
// cover different numbers of countries (122, 169, 180, 193 …), so "130th" alone is hard to compare.
// Each rank is also shown as "Ranked above X% of countries", with "yth of z" underneath.
//
// X = (z − y) ÷ z × 100, rounded down so it never overstates: the share of ranked countries that
// come after Bangladesh in the publisher's (or this site's) list. "Calculated by this site" (R4),
// with the formula and both inputs shown next to it. Neutral wording only (R5): it describes
// position in the list, and each ranking's explanation says what rank 1 means.
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber, formatPercent } from './format.ts';

export function rankAbovePercent(rank: number, outOf: number): number {
  if (!(outOf > 0) || rank < 1 || rank > outOf) throw new Error(`Bad rank ${rank} of ${outOf}`);
  return Math.floor(((outOf - rank) / outOf) * 100);
}

/** "32%" in the reader's digits. */
export const abovePct = (rank: number, outOf: number, lang: Lang) => formatPercent(rankAbovePercent(rank, outOf), lang, 0);

/** The formula with its two inputs: "Percentage calculated by this site: (193 − 130) ÷ 193, rounded down." */
export function aboveFormula(rank: number, outOf: number, lang: Lang): string {
  return t(lang, 'rank.pct_formula', { rank: formatNumber(rank, lang, 0), n: formatNumber(outOf, lang, 0) });
}

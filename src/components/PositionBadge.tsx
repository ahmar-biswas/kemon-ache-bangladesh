// Position badge (8.10): where Bangladesh sits among the peers, in the official target
// direction, shown by a ring glyph and words, never by colour. Calculated by this site;
// the formula and every country's value and year are one click away.
import type { CountriesFile, DataRecord, FavourableDirection } from '../data/types.ts';
import { position } from '../data/compare.ts';
import { t, type Lang } from '../i18n/index.ts';
import { countryName } from '../lib/display.ts';
import { formatNumber, formatYear } from '../lib/format.ts';
import { formatValue } from '../lib/formatValue.ts';

interface Props {
  lang: Lang;
  direction: FavourableDirection;
  bangladesh: DataRecord | undefined;
  peers: DataRecord[];
  countries: CountriesFile;
}

/** A ring with 1, 2 or 3 quarters filled. */
function Ring({ quarters }: { quarters: 1 | 2 | 3 }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg className="badge-ring" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="2.5" />
      <circle
        cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeDasharray={`${(c * quarters) / 4} ${c}`} transform="rotate(-90 9 9)" strokeLinecap="butt"
      />
    </svg>
  );
}

export function PositionBadge({ lang, direction, bangladesh, peers, countries }: Props) {
  if (direction === 'context') {
    return <p className="context-note muted">{t(lang, 'peers.context_note')}</p>;
  }
  const pos = position(direction, bangladesh, peers);
  if (!pos || !bangladesh) return null;

  const n = (k: number) => formatNumber(k, lang, 0);
  const text =
    pos.kind === 'ahead'
      ? t(lang, 'badge.ahead', { n: n(pos.ahead.length), m: n(pos.m) })
      : pos.kind === 'behind'
        ? t(lang, 'badge.behind', { n: n(pos.behind.length), m: n(pos.m) })
        : t(lang, 'badge.level');

  const row = (r: DataRecord) => (
    <li key={r.country}>
      {countryName(r.country, lang, countries)}: {formatValue(r, lang)} ({formatYear(r.year, lang)})
    </li>
  );

  return (
    <div className="position">
      <p className="position__badge glass">
        <Ring quarters={pos.quarters} />
        <span>{text}</span>
      </p>
      <details className="position__how">
        <summary>{t(lang, 'badge.how')}</summary>
        <div className="position__body">
          <p className="calc-label">{t(lang, 'derived.calculated_by_site')}</p>
          <p>{t(lang, direction === 'lower' ? 'badge.formula_lower' : 'badge.formula_higher')}</p>
          <p>{t(lang, 'badge.years_note')}</p>
          <p>
            {countryName(bangladesh.country, lang, countries)}: {formatValue(bangladesh, lang)} ({formatYear(bangladesh.year, lang)})
          </p>
          {pos.ahead.length > 0 && (
            <>
              <p className="position__group">{t(lang, 'badge.ahead_of_list')}</p>
              <ul>{pos.ahead.map(row)}</ul>
            </>
          )}
          {pos.behind.length > 0 && (
            <>
              <p className="position__group">{t(lang, 'badge.behind_list')}</p>
              <ul>{pos.behind.map(row)}</ul>
            </>
          )}
          {pos.equal.length > 0 && (
            <>
              <p className="position__group">{t(lang, 'badge.equal_list')}</p>
              <ul>{pos.equal.map(row)}</ul>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

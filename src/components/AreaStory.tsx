// One area tile on the homepage (Ahmar, M4 review 2): one headline measure told plainly.
//   area name with its icon; the headline value, large; one sentence saying what it means;
//   the goal-facing strip (where an official goal exists) with the ring; the world rank;
//   the source line. Everything else for the area is in Details.
// The whole tile opens Details (bigger target, Fitts's law), except its own links and switch.
// Hovering or focusing the tile quietly preloads the Details code, so opening feels instant.
import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import { HOME_AREA_PATH } from '../data/site.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { explanation, indicatorName } from '../lib/display.ts';
import { formatNumber, formatYear } from '../lib/format.ts';
import { valueParts } from '../lib/formatValue.ts';
import { indicatorMeta } from '../data/latestMeta.ts';
import { GoalStrip } from './GoalStrip.tsx';
import { AreaIcon } from './Motifs.tsx';
import { CompactSources } from './SourceLine.tsx';
import { abovePct } from '../lib/rankShare.ts';

interface Props {
  lang: Lang;
  area: AreaConfig;
  latest: LatestFile;
  selected: string | null;
  open: boolean;
  onOpen: (el: HTMLElement) => void;
  onPrefetch: () => void;
}

export function AreaStory({ lang, area, latest, selected, open, onOpen, onPrefetch }: Props) {
  const d = latest.indicators[area.headline];
  if (!d) return null;
  const bgd = d.bangladesh;
  const parts = bgd ? valueParts(bgd, lang) : null;
  const meta = indicatorMeta(area.headline);
  const text = meta ? explanation(meta, bgd ?? undefined, lang) : null;
  const n = (v: number) => formatNumber(v, lang, 0);
  const rank = d.rank;

  const openFrom = (e: MouseEvent<HTMLElement>) => {
    // Links and controls inside the tile keep their own job.
    if ((e.target as HTMLElement).closest('a, button, [popover]')) return;
    onOpen(e.currentTarget);
  };

  return (
    <article
      className={`story story--${area.icon}${open ? ' is-open' : ''}`}
      data-figure=""
      aria-labelledby={`story-${area.icon}`}
      onClick={openFrom}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <span className="story__watermark" aria-hidden="true">
        <AreaIcon area={area.icon} />
      </span>
      <header className="story__head">
        <h2 id={`story-${area.icon}`} className="story__title">
          <span className="story__disc" aria-hidden="true" />
          <AreaIcon area={area.icon} />
          {/* Area card → the area page (section 10). The rest of the tile opens the full picture. */}
          <Link className="story__page" to={`/${lang}/${HOME_AREA_PATH[area.icon]}`}>
            {t(lang, area.label)}
          </Link>
        </h2>
        {/* One clear action (Ahmar, M4 review 3): open the full picture of this area. */}
        <button
          type="button"
          className="story__open"
          aria-expanded={open}
          onClick={(e) => {
            const el = (e.currentTarget as HTMLElement).closest<HTMLElement>('.story');
            if (el) onOpen(el);
          }}
        >
          {t(lang, 'view.full_picture')}
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true" focusable="false">
            <path d="M1 5 H14 M10 1 L14 5 L10 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <h3 className="story__measure">{indicatorName(area.headline, lang)}</h3>
      {bgd && parts ? (
        <p className="story__value">
          <span className="story__num num" data-value="">
            {parts.number}
          </span>
          {parts.unit && <span className="story__unit">{parts.unit}</span>}
          <span className="story__year">{formatYear(bgd.year, lang)}</span>
        </p>
      ) : (
        <p className="story__value story__value--na" data-not-available="">
          {t(lang, 'data.not_available')}
        </p>
      )}
      {/* The picture first (seen at a glance), then the sentence that explains it. */}
      <GoalStrip
        lang={lang}
        unit={d.compare_bangladesh?.unit ?? d.unit}
        points={d.points}
        names={latest.names}
        selected={selected}
        direction={d.favourable_direction}
        median={d.median}
        target={d.target}
      />
      {d.compare_id && <p className="story__note">{t(lang, 'peers.compared_in_ppp')}</p>}
      {rank && <p className="story__rank">{t(lang, 'rank.above_short', { pct: abovePct(rank.rank, rank.out_of, lang), rank: n(rank.rank), n: n(rank.out_of) })}</p>}

      {text && <p className="story__text">{text}</p>}

      {bgd && (
        <CompactSources
          records={d.compare_bangladesh ? [bgd, d.compare_bangladesh] : [bgd]}
          lang={lang}
          linkLabels={[t(lang, 'source.link_own'), t(lang, 'source.link_ppp')]}
        />
      )}
    </article>
  );
}

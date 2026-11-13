// /en/design-preview and /bn/design-preview (Milestone 3): every building block of the site,
// shown with real P0 data from data/processed. For checking the look before the homepage (M4).
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import metaJson from '../../data/processed/meta.json';
import { ChartFrame } from '../components/ChartFrame.tsx';
import { FlagSwitch } from '../components/FlagSwitch.tsx';
import { Loading } from '../components/Loading.tsx';
import { AreaIcon, Jamdani, type AreaId } from '../components/Motifs.tsx';
import { PeerStrip } from '../components/PeerStrip.tsx';
import { Tile } from '../components/Tile.tsx';
import { COUNTRIES, MEDIANS, RECORDS, indicatorMeta } from '../data/all.ts';
import { latestMedian, latestRecent, recentSince } from '../data/compare.ts';
import type { DataMeta, DataRecord } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber } from '../lib/format.ts';

const META = metaJson as DataMeta;

/** The homepage tile groups (section 5.3, 8.8). The first tile in each group is wide. */
const GROUPS: { area: AreaId; tiles: string[] }[] = [
  { area: 'economy', tiles: ['gdp_pc_taka', 'gdp_pc_growth', 'inflation', 'youth_unemployment'] },
  { area: 'poverty', tiles: ['poverty_intl', 'share_low20'] },
  { area: 'education', tiles: ['literacy', 'secondary_enrol'] },
  { area: 'health', tiles: ['life_expectancy', 'under5_mortality', 'stunting', 'oop'] },
];

/** Series compared across countries in place of the tile's own (local currency differs by country). */
const COMPARE_WITH: Record<string, string> = { gdp_pc_taka: 'gdp_pc_ppp' };

const need = <T,>(v: T | undefined, what: string): T => {
  if (v === undefined) throw new Error(`Missing ${what}`);
  return v;
};

export function DesignPreview() {
  const lang = useOutletContext<Lang>();
  const since = recentSince(META.last_checked);
  const [money, setMoney] = useState<0 | 1>(0);

  // Chart frame sample: life expectancy, latest year for Bangladesh and each peer.
  const le = latestRecent(need(RECORDS.life_expectancy, 'life_expectancy'), ['BGD', ...COUNTRIES.default_peers], since);
  const leRows = ['BGD', ...COUNTRIES.default_peers].map((id) => le.get(id)).filter((r): r is DataRecord => !!r);

  return (
    <div className="wrap design-preview">
      <header className="page-head">
        <h1>{t(lang, 'design.title')}</h1>
        <p className="secondary">{t(lang, 'design.intro')}</p>
      </header>

      <section aria-labelledby="dp-tiles">
        <h2 id="dp-tiles" className="section-head">{t(lang, 'design.tiles')}</h2>
        <hr className="stitch" />
        {GROUPS.map(({ area, tiles }) => (
          <section key={area} className={`tile-group tile-group--${area}`} aria-labelledby={`dp-${area}`}>
            <h3 id={`dp-${area}`} className="group-head">
              <AreaIcon area={area} />
              {t(lang, `area.${area}`)}
            </h3>
            <hr className="stitch" />
            <div className="tile-grid">
              {tiles.map((id, i) => {
                const meta = need(indicatorMeta(id), id);
                const cmpId = COMPARE_WITH[id];
                const compare = cmpId
                  ? { meta: need(indicatorMeta(cmpId), cmpId), records: need(RECORDS[cmpId], cmpId), medians: MEDIANS[cmpId] }
                  : undefined;
                return (
                  <Tile
                    key={id}
                    lang={lang}
                    meta={meta}
                    records={need(RECORDS[id], id)}
                    medians={MEDIANS[id]}
                    compare={compare}
                    countries={COUNTRIES}
                    since={since}
                    wide={i === 0}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </section>

      <section aria-labelledby="dp-controls">
        <h2 id="dp-controls" className="section-head">{t(lang, 'design.controls')}</h2>
        <hr className="stitch" />
        <div className="demo-row">
          <FlagSwitch
            label={t(lang, 'money.show_in')}
            options={[
              { label: t(lang, 'money.taka'), onSelect: () => setMoney(0) },
              { label: t(lang, 'money.intl'), onSelect: () => setMoney(1) },
            ]}
            selected={money}
          />
        </div>
      </section>

      <section aria-labelledby="dp-chart">
        <h2 id="dp-chart" className="section-head">{t(lang, 'design.chart_frame')}</h2>
        <hr className="stitch" />
        <ChartFrame lang={lang} title={t(lang, 'design.chart_frame_title')} rows={leRows} countries={COUNTRIES} code="SP.DYN.LE00.IN">
          <PeerStrip
            lang={lang}
            bangladesh={le.get('BGD')}
            peers={leRows.filter((r) => r.country !== 'BGD')}
            missing={COUNTRIES.default_peers.filter((id) => !le.has(id))}
            since={since}
            median={latestMedian(MEDIANS.life_expectancy)}
            direction="context"
            countries={COUNTRIES}
            size="large"
          />
        </ChartFrame>
      </section>

      <section aria-labelledby="dp-states">
        <h2 id="dp-states" className="section-head">{t(lang, 'design.states')}</h2>
        <hr className="stitch" />
        <div className="state-grid">
          <div className="state-card">
            <Loading lang={lang} />
          </div>
          <div className="state-card state-card--empty" data-figure="">
            <p className="secondary">{t(lang, 'design.state_not_available')}</p>
            <p className="tile__value tile__value--na" data-not-available="">
              {t(lang, 'data.not_available')}
            </p>
            <Jamdani />
          </div>
          <div className="state-card">
            <p className="secondary">{t(lang, 'design.state_not_found')}</p>
            <p>
              <Link to={`/${lang}/no-such-page`}>{t(lang, 'notfound.title')}</Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="dp-icons">
        <h2 id="dp-icons" className="section-head">{t(lang, 'design.icons')}</h2>
        <hr className="stitch" />
        <ul className="icon-row">
          {GROUPS.map(({ area }) => (
            <li key={area}>
              <AreaIcon area={area} />
              <span>{t(lang, `area.${area}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dp-colours">
        <h2 id="dp-colours" className="section-head">{t(lang, 'design.colours')}</h2>
        <hr className="stitch" />
        <ul className="swatch-row">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <li key={n}>
              <span className={`swatch swatch--${n}`} aria-hidden="true" />
              <span>{n === 1 ? t(lang, 'design.colour_bangladesh') : t(lang, 'design.colour_series', { n: formatNumber(n, lang, 0) })}</span>
            </li>
          ))}
          <li>
            <span className="swatch swatch--peers" aria-hidden="true" />
            <span>{t(lang, 'design.colour_peers')}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

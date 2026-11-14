// "Compare with other countries" for one measure (section 12, 4b; DECISIONS.md 87).
// Picker, ranked chart (or table), the rank among the countries shown, the goal and median
// lines, CSV, how to read it, and a source line whose link carries every country shown (R1).
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepSlots } from '../../lib/peerColours.ts';
import { COUNTRIES, MEDIANS } from '../../data/details.ts';
import { loadWorld } from '../../data/measure.ts';
import { matchNote } from '../../data/notes.ts';
import {
  HOME,
  availability,
  chartForm,
  multiCountryUrl,
  GROUPS,
  presetCountries,
  rowsByCountry,
  shownRows,
  toCsv,
  type Preset,
} from '../../data/picker.ts';
import type { IndicatorMeta, Target, WorldFile } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { countryName, indicatorName } from '../../lib/display.ts';
import { downloadCsv, ordinalEn } from '../../lib/download.ts';
import { formatNumber, formatYear } from '../../lib/format.ts';
import { formatValue } from '../../lib/formatValue.ts';
import { noteText } from '../../lib/noteText.ts';
import { FlagSwitch } from '../FlagSwitch.tsx';
import { Loading } from '../Loading.tsx';
import { SourceLine } from '../SourceLine.tsx';
import { CountryPicker } from './CountryPicker.tsx';
import { RankedChart } from './RankedChart.tsx';

const PPP_ID = 'gdp_pc_ppp';

interface Props {
  lang: Lang;
  /** The measure the reader opened (e.g. GDP per person in taka). */
  meta: IndicatorMeta;
  /** The series compared across countries (the same, or PPP dollars for a taka measure). */
  compare: IndicatorMeta;
  target: Target | null;
}

type Loaded = { world: WorldFile; ppp: WorldFile | null } | 'missing' | null;

export function CompareView({ lang, meta, compare, target }: Props) {
  const [data, setData] = useState<Loaded>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset | null>('default');
  const [view, setView] = useState<0 | 1>(0);
  // Each picked country keeps its colour while it stays picked; a new pick takes a free colour.
  const slotsRef = useRef(new Map<string, number>());
  const slots = useMemo(() => (slotsRef.current = keepSlots(slotsRef.current, picked)), [picked]);

  useEffect(() => {
    let alive = true;
    setData(null);
    void Promise.all([loadWorld(compare.id), compare.id === PPP_ID ? null : loadWorld(PPP_ID)]).then(([world, ppp]) => {
      if (!alive) return;
      if (!world) return setData('missing');
      const all = { world, ppp: compare.id === PPP_ID ? world : ppp };
      setData(all);
      setPreset('default');
      setPicked(presetCountries('default', COUNTRIES.countries, COUNTRIES.default_peers, world, all.ppp).picked);
    });
    return () => {
      alive = false;
    };
  }, [compare.id]);

  const name = useMemo(() => (id: string) => countryName(id, lang, COUNTRIES), [lang]);
  const n = (v: number) => formatNumber(v, lang, 0);
  /** Sentence end in the reader's language (Bangla uses the dari, ।). */
  const stop = lang === 'bn' ? '।' : '.';

  if (data === null) return <Loading lang={lang} />;
  if (data === 'missing') {
    return (
      <p className="measure__na" data-not-available="">
        {t(lang, 'data.not_available')}
      </p>
    );
  }
  const { world, ppp } = data;
  const rows = shownRows(world, picked);
  const bgd = rows.find((r) => r.country === HOME);
  const median = MEDIANS[compare.id]?.[0] ?? null;
  // The goal is stated for the measure itself, so it is drawn only when that is what is compared.
  const goal = target && target.indicator_id === compare.id ? target : null;
  const form = chartForm(compare.id);
  const title = indicatorName(compare.id, lang);

  const applied = preset ? presetCountries(preset, COUNTRIES.countries, COUNTRIES.default_peers, world, ppp) : null;
  const all = rowsByCountry(world);
  const noData = applied?.unavailable.filter((c) => availability(all.get(c)) === 'no_data') ?? [];
  const noNote = applied?.unavailable.filter((c) => availability(all.get(c)) === 'note_untranslated') ?? [];
  const list = (ids: string[]) => ids.map(name).join(', ');

  const choosePreset = (p: Preset) => {
    setPreset(p);
    setPicked(presetCountries(p, COUNTRIES.countries, COUNTRIES.default_peers, world, ppp).picked);
  };
  const choose = (next: string[]) => {
    setPreset(null);
    setPicked(next);
  };

  const years = new Set(rows.map((r) => r.year));
  const sourceUrl = multiCountryUrl(world.code, rows.map((r) => r.country), COUNTRIES.countries);
  const pppRow = ppp ? rowsByCountry(ppp).get(HOME) : undefined;

  return (
    <div className="measure__body">
      {compare.id !== meta.id && <p className="measure__note">{t(lang, 'compare.in_ppp', { name: title })}</p>}

      <section className="measure__picker" aria-label={t(lang, 'picker.title')}>
        <CountryPicker lang={lang} countries={COUNTRIES} world={world} picked={picked} preset={preset} onPick={choose} onPreset={choosePreset} name={name} />
        {preset === 'default' && (
          <details className="measure__why">
            <summary>{t(lang, 'picker.why')}</summary>
            <p>
              {t(lang, 'picker.why_text')}{' '}
              <a href={COUNTRIES.classification_url} target="_blank" rel="noopener noreferrer">
                {t(lang, 'picker.classification_link')}
              </a>
            </p>
          </details>
        )}
        {(preset === 'south_asia' || preset === 'neighbours') && (
          <p className="measure__preset-note muted">
            {t(lang, `picker.note.${preset}`)}{' '}
            <a href={GROUPS[preset].source_url} target="_blank" rel="noopener noreferrer">
              {t(lang, `picker.group_link.${preset}`)}
            </a>
          </p>
        )}
        {preset === 'income' && (
          <p className="measure__preset-note muted">
            {t(lang, applied?.trimmed ? 'picker.note.income_trimmed' : 'picker.note.income', { max: n(picked.length) })}{' '}
            {applied?.trimmed && pppRow && ppp && (
              <>
                {t(lang, 'derived.calculated_by_site')}{stop}{' '}
                <a href={`https://data.worldbank.org/indicator/${ppp.code}`} target="_blank" rel="noopener noreferrer">
                  {t(lang, 'picker.ppp_link')}
                </a>
              </>
            )}
          </p>
        )}
        {noData.length > 0 && (
          <p className="measure__preset-note muted">{t(lang, 'peers.missing', { year: formatYear(world.since, lang), countries: list(noData) })}</p>
        )}
        {noNote.length > 0 && <p className="measure__preset-note muted">{t(lang, 'picker.note_untranslated_list', { countries: list(noNote) })}</p>}
      </section>

      <section className="chart-frame measure__frame" data-figure="">
        <div className="chart-frame__head">
          <h3>{t(lang, 'compare.chart_title', { name: title })}</h3>
          <div className="chart-frame__controls">
            <FlagSwitch
              label={t(lang, 'chart.show_as')}
              options={[
                { label: t(lang, 'chart.chart'), onSelect: () => setView(0) },
                { label: t(lang, 'chart.table'), onSelect: () => setView(1) },
              ]}
              selected={view}
            />
            <button type="button" className="text-button" onClick={() => downloadCsv(`${world.code}-countries.csv`, toCsv(rows, name))}>
              {t(lang, 'chart.download_csv')}
            </button>
          </div>
        </div>

        {!bgd ? (
          <p data-not-available="">{t(lang, 'data.not_available')}</p>
        ) : (
          <>
            {rows.length > 1 && (
              <p className="measure__rank">
                {t(lang, 'compare.rank_line', { rank: lang === 'en' ? ordinalEn(bgd.rank) : n(bgd.rank), n: n(rows.length) })}{' '}
                <span className="muted">{t(lang, 'derived.calculated_by_site')}{stop}</span>
              </p>
            )}
            {rows.length === 1 && <p className="measure__rank muted">{t(lang, 'compare.none_picked')}</p>}

            {view === 0 ? (
              <RankedChart lang={lang} rows={rows} slots={slots} form={form} unit={world.unit} median={median} target={goal} name={name} />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">{t(lang, 'table.rank')}</th>
                      <th scope="col">{t(lang, 'table.country')}</th>
                      <th scope="col">{t(lang, 'table.value')}</th>
                      <th scope="col">{t(lang, 'table.year')}</th>
                      <th scope="col">{t(lang, 'table.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.country} className={r.country === HOME ? 'is-bgd' : undefined}>
                        <td data-label={t(lang, 'table.rank')} className="num">{n(r.rank)}</td>
                        <th scope="row" data-label={t(lang, 'table.country')}>{name(r.country)}</th>
                        <td data-label={t(lang, 'table.value')} className="num" data-value="">{formatValue(r, lang)}</td>
                        <td data-label={t(lang, 'table.year')} className="num">{formatYear(r.year, lang)}</td>
                        <td data-label={t(lang, 'table.notes')} className="data-table__notes">
                          {r.notes.filter((note) => matchNote(note)).map((note) => noteText(note, lang)).join(' ') || '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <ul className="measure__legend">
              <li>
                <span className={`measure__key measure__key--bgd-${form}`} aria-hidden="true" />
                {name(HOME)}
              </li>
              {rows.length > 1 && (
                <li>
                  <span className={`measure__key measure__key--peer-${form}`} aria-hidden="true" />
                  {t(lang, 'compare.legend_others')}
                </li>
              )}
              {median && (
                <li>
                  <span className="measure__key measure__key--median" aria-hidden="true" />
                  {t(lang, 'median.label_year', { year: formatYear(median.year, lang) })}: {formatValue(median, lang)}{stop}{' '}
                  <span className="muted">
                    {t(lang, 'derived.calculated_by_site')}: {t(lang, 'derived.median_formula', { count: n(median.inputs.length), year: formatYear(median.year, lang) })}{stop}
                  </span>{' '}
                  <a href={median.inputs_source_url} target="_blank" rel="noopener noreferrer">
                    {t(lang, 'compare.median_inputs')}
                  </a>
                </li>
              )}
              {goal && (
                <li>
                  <span className="measure__key measure__key--goal" aria-hidden="true" />
                  {t(lang, goal.label_key as never, { value: formatValue({ value: goal.value, unit: goal.unit }, lang) })}{' '}
                  <a href={goal.source_url} target="_blank" rel="noopener noreferrer">
                    {t(lang, goal.label_key.replace('target.short.', 'target.source.') as never)}
                  </a>
                </li>
              )}
            </ul>

            {years.size > 1 && <p className="measure__caveat muted">{t(lang, 'caveat.years_differ')}</p>}
            <p className="measure__caveat muted">
              {compare.favourable_direction === 'context'
                ? t(lang, 'peers.context_note')
                : t(lang, compare.favourable_direction === 'lower' ? 'peers.target_lower' : 'peers.target_higher')}
            </p>
            <SourceLine record={{ ...bgd, source_url: sourceUrl }} lang={lang} />
          </>
        )}
      </section>

      <section className="measure__read">
        <h3>{t(lang, 'chart.how_to_read')}</h3>
        <p>{t(lang, form === 'bars' ? 'compare.read_bars' : 'compare.read_dots')}</p>
      </section>
    </div>
  );
}

// The country picker (section 5.5; DECISIONS.md 87): the default comparison countries, three
// presets, and a search over every country. Up to MAX_PICKED beside Bangladesh. A country
// that cannot be shown for this measure stays in the list, greyed out, with the reason.
import { useId, useMemo, useState } from 'react';
import { HOME, MAX_PICKED, PRESETS, availability, rowsByCountry, toggleCountry, type Preset } from '../../data/picker.ts';
import type { CountriesFile, WorldFile } from '../../data/types.ts';
import { t, type Lang, type MessageKey } from '../../i18n/index.ts';
import { formatNumber, formatYear } from '../../lib/format.ts';

interface Props {
  lang: Lang;
  countries: CountriesFile;
  world: WorldFile;
  picked: string[];
  preset: Preset | null;
  onPick: (picked: string[]) => void;
  onPreset: (preset: Preset) => void;
  name: (id: string) => string;
}

export function CountryPicker({ lang, countries, world, picked, preset, onPick, onPreset, name }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const id = useId();
  const rows = useMemo(() => rowsByCountry(world), [world]);
  const n = (v: number) => formatNumber(v, lang, 0);
  const full = picked.length >= MAX_PICKED;

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.countries
      .filter((c) => c.id !== HOME)
      .map((c) => ({ id: c.id, label: name(c.id), english: c.name }))
      .filter((c) => !q || c.label.toLowerCase().includes(q) || c.english.toLowerCase().includes(q) || c.id.toLowerCase() === q)
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [countries, query, name, lang]);

  return (
    <div className="picker">
      <div className="picker__presets" role="group" aria-label={t(lang, 'picker.presets')}>
        {PRESETS.map((p) => (
          <button key={p} type="button" className={`chip${preset === p ? ' is-on' : ''}`} aria-pressed={preset === p} onClick={() => onPreset(p)}>
            {t(lang, `picker.preset.${p}` as MessageKey)}
          </button>
        ))}
      </div>

      <ul className="picker__chosen" aria-label={t(lang, 'picker.chosen')}>
        <li className="picker__tag is-bgd">{name(HOME)}</li>
        {picked.map((c) => (
          <li key={c} className="picker__tag">
            {name(c)}
            <button type="button" className="picker__remove" aria-label={t(lang, 'picker.remove', { country: name(c) })} onClick={() => onPick(toggleCountry(picked, c))}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M1 1 L9 9 M9 1 L1 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="picker__bar">
        <button type="button" className="text-button picker__toggle" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((v) => !v)}>
          {t(lang, open ? 'picker.close' : 'picker.open')}
        </button>
        <span className="picker__count muted" aria-live="polite">
          {t(lang, full ? 'picker.count_full' : 'picker.count', { n: n(picked.length), max: n(MAX_PICKED) })}
        </span>
      </div>

      {open && (
        <div className="picker__panel" id={`${id}-panel`}>
          <label className="picker__search">
            <span>{t(lang, 'picker.search')}</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          <ul className="picker__list">
            {options.map((c) => {
              const state = availability(rows.get(c.id));
              const on = picked.includes(c.id);
              const disabled = state !== 'ok' || (!on && full);
              return (
                <li key={c.id} className={state !== 'ok' ? 'is-off' : undefined}>
                  <label>
                    <input type="checkbox" checked={on} disabled={disabled} onChange={() => onPick(toggleCountry(picked, c.id))} />
                    <span>{c.label}</span>
                  </label>
                  {state === 'no_data' && <span className="picker__why">{t(lang, 'picker.no_data', { year: formatYear(world.since, lang) })}</span>}
                  {state === 'note_untranslated' && <span className="picker__why">{t(lang, 'picker.note_untranslated')}</span>}
                </li>
              );
            })}
            {options.length === 0 && <li className="picker__none muted">{t(lang, 'picker.no_match')}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

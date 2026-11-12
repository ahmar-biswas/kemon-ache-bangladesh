// Milestone 1 page: three values in a plain list, each with its source line.
// The real homepage design comes in Milestone 4.
import { useOutletContext } from 'react-router';
import { Figure } from '../components/Figure.tsx';
import { DATA, META, latest } from '../data/index.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';
import { formatDate } from '../lib/format.ts';

const SHOWN: { id: string; label: MessageKey }[] = [
  { id: 'life_expectancy', label: 'indicator.life_expectancy.name' },
  { id: 'gdp_pc_taka', label: 'indicator.gdp_pc_taka.name' },
  { id: 'inflation', label: 'indicator.inflation.name' },
];

export function Home() {
  const lang = useOutletContext<Lang>();
  return (
    <>
      <h1>{t(lang, 'home.heading')}</h1>
      <p>{t(lang, 'home.intro')}</p>
      {SHOWN.map(({ id, label }) => (
        <Figure key={id} label={t(lang, label)} record={latest(DATA[id])} lang={lang} />
      ))}
      <p className="last-checked">{t(lang, 'home.last_checked', { date: formatDate(META.last_checked, lang) })}</p>
    </>
  );
}

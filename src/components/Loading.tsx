// Loading state (8.13): the rickshaw wheel and a calm line of text. No shimmer.
import { t, type Lang } from '../i18n/index.ts';
import { RickshawWheel } from './Motifs.tsx';

export function Loading({ lang }: { lang: Lang }) {
  return (
    <div className="loading" role="status">
      <RickshawWheel />
      <span>{t(lang, 'state.loading')}</span>
    </div>
  );
}

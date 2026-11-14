// A measure's tile on the area and indicator pages: the same Tile as "The full picture"
// (value, plain line, peer strip, position badge, source), fed from details.json.
import { COUNTRIES, MEDIANS, RECORDS, indicatorMeta } from '../data/details.ts';
import { LATEST } from '../data/latest.ts';
import type { Lang } from '../i18n/index.ts';
import { Tile } from './Tile.tsx';

export function MeasureTile({ lang, id, wide, href, headingLevel }: { lang: Lang; id: string; wide?: boolean; href?: string; headingLevel?: 2 | 3 }) {
  const meta = indicatorMeta(id);
  const records = RECORDS[id];
  if (!meta || !records) return null;
  const cmpId = meta.compare_id;
  const cmpMeta = cmpId ? indicatorMeta(cmpId) : undefined;
  return (
    <Tile
      lang={lang}
      meta={meta}
      records={records}
      medians={MEDIANS[id]}
      compare={cmpId && cmpMeta ? { meta: cmpMeta, records: RECORDS[cmpId] ?? [], medians: MEDIANS[cmpId] } : undefined}
      countries={COUNTRIES}
      since={LATEST.since}
      wide={wide}
      href={href}
      headingLevel={headingLevel}
      rank={LATEST.indicators[id]?.rank ?? null}
      target={LATEST.indicators[id]?.target ?? null}
    />
  );
}

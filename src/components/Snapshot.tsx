// The snapshot at the top of an area page (section 10): a few template sentences, each with
// its source line directly under it (R1). A sentence states Bangladesh's latest published
// value and, where one exists, the published value about ten years earlier ("up from",
// "down from": neutral words, R5). Money in current taka gets no earlier value, because
// current taka rises partly from price changes (DECISIONS.md 106).
import { useEffect, useState } from 'react';
import { indicatorMeta } from '../data/details.ts';
import { loadTrend } from '../data/measure.ts';
import type { DataRecord } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatYear } from '../lib/format.ts';
import { formatValue } from '../lib/formatValue.ts';
import { SourceLine } from './SourceLine.tsx';

/** The latest record and the newest one at least ten years older (never an estimate, R3). */
export function snapshotPair(points: DataRecord[], years = 10): { now: DataRecord; then: DataRecord | null } | null {
  const sorted = [...points].sort((a, b) => a.year - b.year);
  const now = sorted[sorted.length - 1];
  if (!now) return null;
  const then = [...sorted].reverse().find((p) => p.year <= now.year - years) ?? null;
  return { now, then };
}

export function Snapshot({ lang, ids }: { lang: Lang; ids: string[] }) {
  const [rows, setRows] = useState<{ id: string; points: DataRecord[] }[] | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all(ids.map(async (id) => ({ id, points: (await loadTrend(id)) ?? [] }))).then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [ids]);
  if (!rows) return <div className="snapshot snapshot--loading" aria-hidden="true" />;

  return (
    <div className="snapshot">
      {rows.map(({ id, points }) => {
        const pair = snapshotPair(points);
        if (!pair) return null;
        const { now } = pair;
        const then = indicatorMeta(id)?.unit === 'taka_current' ? null : pair.then;
        const v = (r: DataRecord) => formatValue(r, lang);
        const params = { name: t(lang, `indicator.${id}.short` as never), value: v(now), year: formatYear(now.year, lang) };
        let text: string;
        if (!then) text = t(lang, 'snapshot.level', params);
        else {
          const same = v(then) === v(now);
          const key = same ? 'snapshot.same' : now.value > then.value ? 'snapshot.up' : 'snapshot.down';
          text = t(lang, key, { ...params, old: v(then), old_year: formatYear(then.year, lang) });
        }
        return (
          <div key={id} className="snapshot__item" data-figure="">
            <p className="snapshot__text" data-value="">
              {text}
            </p>
            <SourceLine record={now} lang={lang} fromYear={then?.year} compact />
          </div>
        );
      })}
    </div>
  );
}

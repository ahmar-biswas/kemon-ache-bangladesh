// Subsection chart (section 10; DECISIONS.md 105): Bangladesh over time with the default
// peers. Bangladesh is the 3 px green line with filled dots; the peers are thin --peer-grey
// lines (more than six countries, 8.2), each named at its own line end. Pointer or arrow keys
// pick a year (crosshair and glass tooltip); hovering a line or its name, or Up/Down, picks a
// peer and lifts its line. Gaps stay gaps (R3); a year with no neighbour is a lone dot.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { niceTicks, segments, tickDecimals } from '../../data/picker.ts';
import type { DataRecord, Unit } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { formatTaka, formatYear } from '../../lib/format.ts';
import { formatValue } from '../../lib/formatValue.ts';
import { tickLabel } from './RankedChart.tsx';

export interface Series {
  id: string;
  name: string;
  points: DataRecord[];
}

interface Props {
  lang: Lang;
  /** Bangladesh first, then the peers. */
  series: Series[];
  unit: Unit;
  label: string;
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>, fallback = 640) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

const yLabel = (v: number, unit: Unit, decimals: number, lang: Lang) =>
  unit === 'taka_current' || unit === 'taka_constant' ? formatTaka(v, lang, 0) : tickLabel(v, unit, decimals, lang);

/** Spread end labels so none overlap (at least `gap` px apart), keeping their order. */
export function spreadLabels(ys: number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = order.map((o) => o.y);
  for (let k = 1; k < out.length; k++) out[k] = Math.max(out[k]!, out[k - 1]! + gap);
  const over = out.length ? out[out.length - 1]! - hi : 0;
  if (over > 0) for (let k = out.length - 1; k >= 0; k--) out[k] = Math.min(out[k]!, (k === out.length - 1 ? hi : out[k + 1]! - gap));
  if (out.length && out[0]! < lo) {
    // Too many labels for the height: keep the gap, starting from the top.
    for (let k = 0; k < out.length; k++) out[k] = lo + k * gap;
  }
  const res = new Array<number>(ys.length);
  order.forEach((o, k) => (res[o.i] = out[k]!));
  return res;
}

export function PeerLineChart({ lang, series, unit, label }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const W = useWidth(wrap);
  const [year, setYear] = useState<number | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const shown = useMemo(() => series.filter((s) => s.points.length > 0).map((s) => ({ ...s, points: [...s.points].sort((a, b) => a.year - b.year) })), [series]);
  const all = shown.flatMap((s) => s.points);
  if (all.length === 0) return null;

  const years = [...new Set(all.map((p) => p.year))].sort((a, b) => a - b);
  const y0 = years[0]!;
  const y1 = years[years.length - 1]!;
  const ticks = niceTicks(Math.min(...all.map((p) => p.value)), Math.max(...all.map((p) => p.value)), 4);
  const decimals = tickDecimals(ticks);
  const yLabels = ticks.map((v) => yLabel(v, unit, decimals, lang));

  const narrow = W < 480;
  const H = narrow ? 280 : 340;
  const longest = Math.max(...shown.map((s) => s.name.length));
  const m = {
    l: Math.max(36, Math.max(...yLabels.map((s) => s.length)) * 7.4 + 14),
    r: Math.min(W * (narrow ? 0.34 : 0.24), longest * 7.2 + 18),
    t: 14,
    b: 30,
  };
  const plotW = Math.max(40, W - m.l - m.r);
  const plotH = H - m.t - m.b;
  const x = (yr: number) => (y1 === y0 ? m.l + plotW / 2 : m.l + ((yr - y0) / (y1 - y0)) * plotW);
  const vMin = ticks[0]!;
  const vMax = ticks[ticks.length - 1]!;
  const y = (v: number) => m.t + plotH - ((v - vMin) / (vMax - vMin)) * plotH;

  const span = y1 - y0;
  const step = [1, 2, 5, 10, 20, 50].find((s) => span / s <= plotW / 52) ?? 50;
  const xTicks: number[] = [];
  for (let yr = Math.ceil(y0 / step) * step; yr <= y1; yr += step) xTicks.push(yr);

  const ends = shown.map((s) => s.points[s.points.length - 1]!);
  const labelY = spreadLabels(ends.map((p) => y(p.value)), 15, m.t, m.t + plotH + 8);

  const nearestYear = (clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return null;
    const px = clientX - box.left;
    return years.reduce((best, yr) => (Math.abs(x(yr) - px) < Math.abs(x(best) - px) ? yr : best), years[0]!);
  };
  const onMove = (e: PointerEvent) => setYear(nearestYear(e.clientX));
  const onKey = (e: KeyboardEvent) => {
    const i = year === null ? -1 : years.indexOf(year);
    const ids = shown.map((s) => s.id);
    const f = focus === null ? 0 : ids.indexOf(focus);
    if (e.key === 'ArrowRight') setYear(years[Math.min(years.length - 1, i + 1)]!);
    else if (e.key === 'ArrowLeft') setYear(years[i < 0 ? years.length - 1 : Math.max(0, i - 1)]!);
    else if (e.key === 'ArrowDown') setFocus(ids[(f + 1) % ids.length]!);
    else if (e.key === 'ArrowUp') setFocus(ids[(f - 1 + ids.length) % ids.length]!);
    else if (e.key === 'Home') setYear(y0);
    else if (e.key === 'End') setYear(y1);
    else if (e.key === 'Escape') {
      setYear(null);
      setFocus(null);
    } else return;
    e.preventDefault();
  };

  const at = year === null ? [] : shown.map((s) => ({ s, p: s.points.find((p) => p.year === year) })).filter((r): r is { s: Series; p: DataRecord } => !!r.p);
  const tipRows = at.filter((r) => r.s.id === 'BGD' || r.s.id === focus || focus === null).sort((a, b) => b.p.value - a.p.value);
  const ax = year === null ? 0 : x(year);
  const tipSide = ax > W * 0.6 ? 'is-end' : ax < W * 0.4 ? 'is-start' : 'is-middle';
  const tipTop = tipRows.length ? Math.max(4, Math.min(...tipRows.map((r) => y(r.p.value))) - 12) : 4;
  const path = (seg: DataRecord[]) => seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');

  // Peers first (underneath), the lifted peer next, Bangladesh always on top.
  const order = [...shown].sort((a, b) => rankOf(a) - rankOf(b));
  function rankOf(s: Series) {
    return s.id === 'BGD' ? 2 : s.id === focus ? 1 : 0;
  }

  return (
    <div className={`line-chart peer-chart${focus ? ' has-focus' : ''}`} ref={wrap} style={{ height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => {
          setYear(null);
          setFocus(null);
        }}
        onKeyDown={onKey}
        onBlur={() => {
          setYear(null);
          setFocus(null);
        }}
      >
        {ticks.map((v, i) => (
          <g key={v}>
            <line className="line-chart__grid" x1={m.l} x2={m.l + plotW} y1={y(v)} y2={y(v)} />
            <text className="line-chart__tick num" x={m.l - 8} y={y(v)} dy="0.32em" textAnchor="end">
              {yLabels[i]}
            </text>
          </g>
        ))}
        {xTicks.map((yr) => (
          <text key={yr} className="line-chart__tick num" x={x(yr)} y={H - 8} textAnchor="middle">
            {formatYear(yr, lang)}
          </text>
        ))}
        {order.map((s) => {
          const bgd = s.id === 'BGD';
          const cls = `peer-chart__series${bgd ? ' is-bgd' : ''}${s.id === focus ? ' is-focus' : ''}`;
          const segs = segments(s.points);
          return (
            <g key={s.id} className={cls} onPointerEnter={() => !bgd && setFocus(s.id)}>
              {segs.map((seg) =>
                seg.length > 1 ? (
                  <g key={seg[0]!.year}>
                    {/* A wider, invisible copy makes the thin line easy to hover (8.9: hit targets ≥ 24 px). */}
                    <path className="peer-chart__hit" d={path(seg)} />
                    <path className="peer-chart__line" d={path(seg)} />
                  </g>
                ) : (
                  <circle key={seg[0]!.year} className="peer-chart__dot" cx={x(seg[0]!.year)} cy={y(seg[0]!.value)} r={bgd ? 4.5 : 3} />
                ),
              )}
              {bgd && segs.every((seg) => seg.length > 1) && (
                <circle className="peer-chart__dot" cx={x(ends[0]!.year)} cy={y(ends[0]!.value)} r={5} />
              )}
            </g>
          );
        })}
        {shown.map((s, i) => (
          <text
            key={s.id}
            className={`peer-chart__label${s.id === 'BGD' ? ' is-bgd' : ''}${s.id === focus ? ' is-focus' : ''}`}
            x={x(ends[i]!.year) + 8}
            y={labelY[i]}
            dy="0.32em"
            onPointerEnter={() => s.id !== 'BGD' && setFocus(s.id)}
          >
            {s.name}
          </text>
        ))}
        {year !== null && <line className="line-chart__cross" x1={ax} x2={ax} y1={m.t} y2={m.t + plotH} aria-hidden="true" />}
      </svg>

      {year !== null && tipRows.length > 0 && (
        <div className={`line-chart__tip glass ${tipSide}`} style={{ left: ax, top: tipTop }} role="status">
          <strong className="num">{formatYear(year, lang)}</strong>
          {tipRows.map(({ s, p }) => (
            <span key={s.id} className={s.id === 'BGD' ? 'peer-chart__tip-bgd' : undefined}>
              {s.name}: {formatValue(p, lang)}
            </span>
          ))}
        </div>
      )}
      {year === null && <span className="visually-hidden">{t(lang, 'peerchart.keys')}</span>}
    </div>
  );
}

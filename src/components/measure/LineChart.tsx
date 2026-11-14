// "Bangladesh over time" (section 12, 3; DECISIONS.md 87): one line from the earliest year.
// Consecutive years are joined; a missing year is left as a gap and never bridged (R3).
// Pointer or arrow keys move a crosshair with a glass tooltip (year, value, notes).
// Event markers (only once the list is approved): hollow circles for elections and changes
// of government, small diamonds for shocks. They are context only; the chart claims no cause.
import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { matchNote } from '../../data/notes.ts';
import { hasGaps, niceTicks, segments, tickDecimals, yearFraction } from '../../data/picker.ts';
import type { DataRecord, EventItem, Unit } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { formatDate, formatTaka, formatYear } from '../../lib/format.ts';
import { formatValue, valueParts } from '../../lib/formatValue.ts';
import { noteText } from '../../lib/noteText.ts';
import { tickLabel } from './RankedChart.tsx';

interface Props {
  lang: Lang;
  points: DataRecord[];
  unit: Unit;
  events: EventItem[];
  /** Accessible name of the chart. */
  label: string;
}

// Measured before the first paint (layout effect): drawn at the fallback width first, a chart was
// briefly wider than a phone screen, and the phone zoomed out and back (M8, DECISIONS 137).
function useWidth(ref: React.RefObject<HTMLDivElement | null>, fallback = 640) {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth > 0) setWidth(Math.round(el.clientWidth));
    if (typeof ResizeObserver === 'undefined') return;
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

export function LineChart({ lang, points, unit, events, label }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const W = useWidth(wrap);
  const [active, setActive] = useState<number | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const fillId = `line-fill-${useId().replace(/:/g, '')}`;

  const sorted = useMemo(() => [...points].sort((a, b) => a.year - b.year), [points]);
  if (sorted.length === 0) return null;
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  const ticks = niceTicks(Math.min(...sorted.map((p) => p.value)), Math.max(...sorted.map((p) => p.value)), 4);
  const decimals = tickDecimals(ticks);
  const yLabels = ticks.map((v) => yLabel(v, unit, decimals, lang));
  const endLabel = valueParts(last, lang, true).number;

  const m = {
    l: Math.max(36, Math.max(...yLabels.map((s) => s.length)) * 7.4 + 14),
    r: Math.min(W * 0.28, endLabel.length * 8 + 22),
    t: 16,
    b: 30,
  };
  const plotW = Math.max(40, W - m.l - m.r);
  const y0 = first.year;
  const y1 = last.year;
  const x = (year: number) => (y1 === y0 ? m.l + plotW / 2 : m.l + ((year - y0) / (y1 - y0)) * plotW);

  const shown = events
    .map((e) => ({ e, at: yearFraction(e.date) }))
    .filter(({ at }) => at >= y0 && at <= y1 + 0.999)
    .sort((a, b) => a.at - b.at);
  // Event markers are 24 px targets. Each goes in the first lane where it is at least 24 px from the
  // marker before it, so no two touch (WCAG target spacing); a narrow phone may need three or four lanes.
  const LANE = 24;
  const laneEnds: number[] = [];
  const marks = shown.map(({ e, at }) => {
    const px = x(Math.min(at, y1));
    let lane = laneEnds.findIndex((end) => px - end >= LANE);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = px;
    return { e, px, lane };
  });
  if (marks.length) m.t = 4 + laneEnds.length * LANE + 20;
  // Extra lanes make the chart taller rather than the plot shorter.
  const H = (W < 480 ? 260 : 340) + Math.max(0, m.t - 48);
  const plotH = H - m.t - m.b;
  const vMin = ticks[0]!;
  const vMax = ticks[ticks.length - 1]!;
  const y = (v: number) => m.t + plotH - ((v - vMin) / (vMax - vMin)) * plotH;

  const span = y1 - y0;
  const step = [1, 2, 5, 10, 20, 50].find((s) => span / s <= plotW / 52) ?? 50;
  const xTicks: number[] = [];
  for (let yr = Math.ceil(y0 / step) * step; yr <= y1; yr += step) xTicks.push(yr);
  if (xTicks.length === 0) xTicks.push(y0);

  const segs = segments(sorted);
  const sparse = sorted.length <= 30;
  const gaps = hasGaps(sorted);

  const nearest = (clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return null;
    const px = clientX - box.left;
    let best = 0;
    for (let i = 1; i < sorted.length; i++) if (Math.abs(x(sorted[i]!.year) - px) < Math.abs(x(sorted[best]!.year) - px)) best = i;
    return best;
  };
  const onMove = (e: PointerEvent) => setActive(nearest(e.clientX));
  const onKey = (e: KeyboardEvent) => {
    const max = sorted.length - 1;
    if (e.key === 'ArrowRight') setActive((i) => Math.min(max, (i ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? max + 1) - 1));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(max);
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const a = active !== null ? sorted[active] : undefined;
  const ax = a ? x(a.year) : 0;
  const tipSide = ax > W * 0.6 ? 'is-end' : ax < W * 0.4 ? 'is-start' : 'is-middle';

  return (
    <div className="line-chart" ref={wrap} style={{ height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        {/* Soft wash under the line (Ahmar, M5 review): the line's colour, fading to nothing
            downwards from the line itself. One smooth area per run of consecutive years (a gap
            stays a gap), faded by a mask made of one slice per pair of years. Each slice carries
            its own copy of the fade, so it starts right at the line everywhere. In a mask the
            slices paint over each other instead of adding up, so their overlaps leave no seams.
            The mask's white and black are brightness levels for the fade, not colours shown. */}
        <defs>
          <linearGradient id={`${fillId}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <mask id={`${fillId}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            {segs.flatMap((seg) =>
              seg.slice(1).map((p, i) => {
                const a = seg[i]!;
                const bottom = (m.t + plotH).toFixed(1);
                return (
                  <path
                    key={p.year}
                    fill={`url(#${fillId}-fade)`}
                    d={`M${(x(a.year) - 0.5).toFixed(1)} ${y(a.value).toFixed(1)} L${(x(p.year) + 0.5).toFixed(1)} ${y(p.value).toFixed(1)} L${(x(p.year) + 0.5).toFixed(1)} ${bottom} L${(x(a.year) - 0.5).toFixed(1)} ${bottom} Z`}
                  />
                );
              }),
            )}
          </mask>
        </defs>
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
        {marks.map(({ e, px }) => (
          <line key={e.id} className="line-chart__event-line" x1={px} x2={px} y1={m.t - 6} y2={m.t + plotH} />
        ))}
        {segs.map((seg) =>
          seg.length > 1 ? (
            <path
              key={`fill-${seg[0]!.year}`}
              className="line-chart__area"
              mask={`url(#${fillId}-mask)`}
              d={`${seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')} L${x(seg[seg.length - 1]!.year).toFixed(1)} ${(m.t + plotH).toFixed(1)} L${x(seg[0]!.year).toFixed(1)} ${(m.t + plotH).toFixed(1)} Z`}
            />
          ) : null,
        )}
        {segs.map((seg) =>
          seg.length > 1 ? (
            <path key={seg[0]!.year} className="line-chart__line" d={seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')} />
          ) : null,
        )}
        {sorted.map((p, i) => {
          const lone = segs.some((s) => s.length === 1 && s[0] === p);
          if (!sparse && !lone && i !== sorted.length - 1) return null;
          return <circle key={p.year} className={`line-chart__point${i === sorted.length - 1 ? ' is-last' : ''}`} cx={x(p.year)} cy={y(p.value)} r={i === sorted.length - 1 ? 5 : lone ? 4.5 : 3.5} />;
        })}
        <text className="line-chart__end num" x={x(last.year) + 10} y={y(last.value)} dy="0.32em">
          {endLabel}
        </text>
        {a && (
          <g aria-hidden="true">
            <line className="line-chart__cross" x1={ax} x2={ax} y1={m.t} y2={m.t + plotH} />
            <circle className="line-chart__focus" cx={ax} cy={y(a.value)} r={6.5} />
          </g>
        )}
      </svg>

      {marks.map(({ e, px, lane }) => (
        <div
          key={e.id}
          className={`event event--${e.kind}${openEvent === e.id ? ' is-open' : ''}${px > W * 0.6 ? ' is-end' : px < W * 0.4 ? ' is-start' : ''}`}
          style={{ left: px, top: 4 + lane * LANE }}
          onPointerEnter={(ev) => ev.pointerType === 'mouse' && setOpenEvent(e.id)}
          onPointerLeave={(ev) => ev.pointerType === 'mouse' && setOpenEvent(null)}
        >
          <button
            type="button"
            className="event__mark"
            aria-expanded={openEvent === e.id}
            aria-label={`${formatDate(e.date, lang)}: ${e.label[lang]}`}
            onClick={() => setOpenEvent((cur) => (cur === e.id ? null : e.id))}
            onKeyDown={(ev) => ev.key === 'Escape' && setOpenEvent(null)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              {e.kind === 'political' ? <circle cx="6" cy="6" r="4.25" /> : <path d="M6 1 L11 6 L6 11 L1 6 Z" />}
            </svg>
          </button>
          {openEvent === e.id && (
            <div className="event__tip glass">
              <span className="event__date num">{formatDate(e.date, lang)}</span>
              <span>{e.label[lang]}</span>
              <span className="event__source">
                {t(lang, 'source.label')}:{' '}
                <a href={e.source_url} target="_blank" rel="noopener noreferrer">
                  {e.source_name[lang]}
                </a>
              </span>
            </div>
          )}
        </div>
      ))}

      {a && (
        <div className={`line-chart__tip glass ${tipSide}${y(a.value) < H / 2 ? ' is-below' : ''}`} style={{ left: ax, top: y(a.value) < H / 2 ? y(a.value) : Math.max(4, y(a.value) - 12) }} role="status">
          <span>
            <strong className="num">{formatYear(a.year, lang)}</strong>: {formatValue(a, lang)}
          </span>
          {a.notes.filter((note) => matchNote(note)).map((note) => (
            <span key={note} className="line-chart__tip-note">
              {noteText(note, lang)}
            </span>
          ))}
        </div>
      )}
      {gaps && <span className="visually-hidden">{t(lang, 'trend.gaps')}</span>}
    </div>
  );
}

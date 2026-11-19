/** The only chart set (CLAUDE.md §3). All styling comes from chartTheme; no inline colours here. */
import { useId, useRef, useState, type ReactNode } from 'react';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTheme } from '../chartTheme';
import { InsightStrip } from './system';

type Fmt = (v: number) => string;
const plain: Fmt = (v) => (Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toFixed(2));
export interface VizSeries { key: string; name: string; color?: string; dashed?: boolean }
/** Planned/target series → --data-plan, actual/observed → --data-actual, others by position. */
export const seriesColor = (name: string, i: number) => (/plan|target|abp|benchmark/i.test(name) ? chartTheme.planned : /actual|observ|achiev|recorded|complet|done|spent|deliver/i.test(name) ? chartTheme.actual : chartTheme.series[i % chartTheme.series.length]);
const colorAt = (s: VizSeries, i: number) => s.color ?? seriesColor(s.name, i);
const pctOf = (v: number, t: number) => Math.round((v / (t || 1)) * 100);

/* ---------------------------------------------------------------- RankedBars */
export interface RankedItem { label: string; value: number; /** caption under the label */ note?: string; /** muted bar */ muted?: boolean; /** preformatted value */ display?: string; segments?: { label: string; value: number; color: string }[] }
/** Horizontal ranked bars: square 14px bars, bold value + grey share at the bar end. */
export function RankedBars({ items, fmt = plain, share = true, onSelect, max: fixedMax, insight, reference, highlight, legend }: { items: RankedItem[]; fmt?: Fmt; share?: boolean; onSelect?: (label: string) => void; max?: number; insight?: boolean | ReactNode;
  /** Dashed plan-colour vertical line (e.g. an average) with a legend entry. */ reference?: { value: number; label: string }; /** Items drawn in the risk colour. */ highlight?: (item: RankedItem) => boolean; /** Legend labels for the base and highlighted bars. */ legend?: { base: string; highlight?: string } }) {
  const max = fixedMax ?? Math.max(1, ...items.map((i) => i.segments ? i.segments.reduce((sum, segment) => sum + segment.value, 0) : Math.abs(i.value)));
  const total = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1;
  const scale = Math.max(max, reference?.value ?? 0);
  return (
    <>
    {(legend || reference) && (
      <div className="cq-ranked-legend">
        {legend && <span><i className="base" />{legend.base}</span>}
        {legend?.highlight && <span><i className="risk" />{legend.highlight}</span>}
        {reference && <span><i className="ref" />{reference.label}</span>}
      </div>
    )}
    <ol className={`cq-ranked${reference ? ' has-ref' : ''}`}>
      {items.map((it) => (
        <li key={it.label} className={onSelect ? 'clickable' : undefined} onClick={onSelect ? () => onSelect(it.label) : undefined}>
          <span className="cq-ranked-label">{it.label}{it.note && <small>{it.note}</small>}</span>
          <span className="cq-ranked-track" title={`${it.label}: ${it.display ?? fmt(it.value)}`}>
            {reference && <em className="cq-ranked-ref" style={{ left: `${(reference.value / scale) * 72}%` }} aria-hidden="true" />}
            {it.segments ? <span className="cq-ranked-stack" aria-label={it.segments.map((s) => `${s.value} ${s.label}`).join(', ')}>{it.segments.map((s) => <i key={s.label} title={`${s.label}: ${s.value}`} style={{ width: `${Math.max(0, s.value / max) * 100}%`, backgroundColor: s.color }} />)}</span> : <i className={highlight?.(it) ? 'risk' : it.muted ? 'muted' : undefined} style={{ width: `${Math.min(1, Math.abs(it.value) / scale) * 72}%` }} />}
            <b>{it.display ?? fmt(it.value)}</b>
            {share && <span>{Math.round((Math.abs(it.value) / total) * 100)}%</span>}
          </span>
        </li>
      ))}
    </ol>
    {insight && items.length > 0 && <InsightStrip>{insight === true ? rankedInsight(items, fmt, share) : insight}</InsightStrip>}
    </>
  );
}
function rankedInsight(items: RankedItem[], fmt: Fmt, share: boolean) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted[0], low = sorted[sorted.length - 1];
  const total = items.reduce((t, i) => t + Math.abs(i.value), 0);
  const v = (i: RankedItem) => i.display ?? fmt(i.value);
  if (share && items.length > 1) return `${top.label} leads at ${v(top)}, ${pctOf(top.value, total)}% of the total.`;
  return items.length > 1 ? `${top.label} is highest at ${v(top)}; ${low.label} is lowest at ${v(low)}.` : `${top.label}: ${v(top)}.`;
}

/* ---------------------------------------------------------------- GroupedColumns / TrendLine */
/**
 * Grouped columns. Optional: `highlightKey` keeps one series at full opacity (others 30%, legend 55%); `onSelect` makes
 * columns and legend items select a series; `valueLabels` prints values above columns; `yDomain`/`yTicks` fix the axis;
 * `tooltipText` gives a one-line tooltip for the hovered column.
 */
export function GroupedColumns({ data, x, series, fmt = plain, height = 240, insight, highlightKey, onSelect, valueLabels, yDomain, yTicks, barSize, tooltipText }: {
  data: Record<string, string | number>[]; x: string; series: VizSeries[]; fmt?: Fmt; height?: number; insight?: boolean | ReactNode;
  highlightKey?: string; onSelect?: (key: string) => void; valueLabels?: boolean; yDomain?: [number, number]; yTicks?: number[]; barSize?: number;
  tooltipText?: (s: VizSeries, xLabel: string, value: number) => string;
}) {
  const dim = (key: string) => highlightKey !== undefined && key !== highlightKey;
  const custom = Boolean(highlightKey !== undefined || onSelect);
  return (
    <>
    {custom && series.length > 1 && (
      <div className="cq-col-legend" role={onSelect ? 'group' : undefined}>
        {series.map((s, i) => (
          <button key={s.key} type="button" className={dim(s.key) ? 'dim' : undefined} disabled={!onSelect} aria-pressed={highlightKey === s.key} onClick={() => onSelect?.(s.key)}>
            <i style={{ background: colorAt(s, i) }} />{s.name}
          </button>
        ))}
      </div>
    )}
    <div className={`cq-chart cq-chart-fill${onSelect ? ' cq-chart-select' : ''}`} style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ ...chartTheme.margin, top: valueLabels ? 20 : chartTheme.margin.top }} barGap={4}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey={x} {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} tickFormatter={fmt} width={48} domain={yDomain} ticks={yTicks} />
          <Tooltip {...chartTheme.tooltip} shared={!tooltipText} formatter={(v: number) => fmt(v)}
            content={tooltipText ? ({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string | number; value?: number }[]; label?: string | number }) => {
              const p = active && payload?.[0]; const s = p && series.find((x) => x.key === p.dataKey);
              return p && s ? <div className="cq-col-tip">{tooltipText(s, String(label), Number(p.value))}</div> : null;
            } : undefined} />
          {!custom && series.length > 1 && <Legend {...chartTheme.legend} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={colorAt(s, i)} fillOpacity={dim(s.key) ? 0.3 : 1} barSize={barSize ?? chartTheme.barSize} radius={chartTheme.radius}
              isAnimationActive={false} onClick={onSelect ? () => onSelect(s.key) : undefined} className="cq-col-bar">
              {valueLabels && <LabelList dataKey={s.key} position="top" formatter={(v: number) => fmt(v)} className="cq-col-label" fillOpacity={dim(s.key) ? 0.55 : 1} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
    {insight && data.length > 0 && <InsightStrip>{insight === true ? columnsInsight(data, x, series, fmt) : insight}</InsightStrip>}
    </>
  );
}

function columnsInsight(data: Record<string, string | number>[], x: string, series: VizSeries[], fmt: Fmt) {
  const s0 = series[0];
  const top = [...data].sort((a, b) => Number(b[s0.key]) - Number(a[s0.key]))[0];
  if (series.length > 1) {
    const s1 = series[1];
    const gap = [...data].sort((a, b) => Math.abs(Number(b[s0.key]) - Number(b[s1.key])) - Math.abs(Number(a[s0.key]) - Number(a[s1.key])))[0];
    return `${top[x]} has the highest ${s0.name.toLowerCase()} (${fmt(Number(top[s0.key]))}); the widest gap to ${s1.name.toLowerCase()} is in ${gap[x]} (${fmt(Number(gap[s0.key]))} vs ${fmt(Number(gap[s1.key]))}).`;
  }
  return `${top[x]} is highest at ${fmt(Number(top[s0.key]))}.`;
}

/** Line trend. Optional: `gap` shades the band between two series (risk tint) and labels it at the last point;
 *  `endLabel` prints a label after each line's last point; `tickFmt` formats axis ticks (defaults to fmt). */
export function TrendLine({ data, x, series, fmt = plain, tickFmt, height = 240, gap, endLabel }: {
  data: Record<string, string | number>[]; x: string; series: VizSeries[]; fmt?: Fmt; tickFmt?: Fmt; height?: number;
  gap?: { upper: string; lower: string; label?: (gap: number) => string }; endLabel?: (s: VizSeries, value: number) => string;
}) {
  const last = data.length - 1;
  const rows = gap ? data.map((d) => ({ ...d, __band: [Number(d[gap.lower]), Number(d[gap.upper])], __mid: (Number(d[gap.lower]) + Number(d[gap.upper])) / 2 })) : data;
  const endAt = (s: VizSeries, i: number) => (props: { x?: number | string; y?: number | string; index?: number; value?: number | string }) => (
    props.index === last && endLabel ? <text x={Number(props.x) + 8} y={Number(props.y) + 4} className="cq-end-label" fill={colorAt(s, i)}>{endLabel(s, Number(props.value))}</text> : null
  );
  return (
    <div className="cq-chart">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={{ ...chartTheme.margin, right: endLabel ? 88 : chartTheme.margin.right }}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey={x} {...chartTheme.axis} padding={{ left: 8, right: 8 }} />
          <YAxis {...chartTheme.axis} tickFormatter={tickFmt ?? fmt} width={40} />
          <Tooltip {...chartTheme.tooltip} formatter={(v: number | number[], name: string) => (Array.isArray(v) ? [String(v[1] - v[0]), 'Gap'] : [fmt(v), name])} />
          {series.length > 1 && <Legend {...chartTheme.legend} payload={series.map((s, i) => ({ value: s.name, type: s.dashed ? 'plainline' : 'square', color: colorAt(s, i), payload: { strokeDasharray: s.dashed ? '6 4' : '0' } }))} />}
          {gap && <Area dataKey="__band" stroke="none" fill={chartTheme.gapFill} isAnimationActive={false} legendType="none" activeDot={false} />}
          {series.map((s, i) => (
            <Line key={s.key} dataKey={s.key} name={s.name} stroke={colorAt(s, i)} strokeWidth={2} strokeDasharray={s.dashed ? '6 4' : undefined} dot={{ r: 3 }} isAnimationActive={false}>
              {endLabel && <LabelList dataKey={s.key} content={endAt(s, i)} />}
            </Line>
          ))}
          {gap && (
            <Line dataKey="__mid" stroke="none" dot={false} activeDot={false} legendType="none" isAnimationActive={false}>
              <LabelList dataKey="__mid" content={(p: { x?: number | string; y?: number | string; index?: number }) => (p.index === last ? (
                <text x={Number(p.x) + 8} y={Number(p.y) + 4} className="cq-gap-label">{(gap.label ?? ((g: number) => `Gap ${g}`))(Number(data[last][gap.upper]) - Number(data[last][gap.lower]))}</text>
              ) : null)} />
            </Line>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------- DonutMetric */
export interface DonutItem { label: string; value: number; color?: string }
export interface DonutCenter { value: ReactNode; label: ReactNode; sub?: ReactNode }
/**
 * Part-of-a-whole ring with a legend. Static by default; `interactive` adds hover/focus emphasis, a tooltip,
 * click-to-select (`onSelect`, `selected`), a per-item centre (`center`) and an extra legend line (`detail`).
 * Interactive rings colour parts by size with brand tints (largest = brand-700) unless items carry a colour.
 */
export function DonutMetric({ items, value, label, fmt = plain, insight, interactive, onSelect, selected, center, detail, ariaLabel }: {
  items: DonutItem[]; value: ReactNode; label: string; fmt?: Fmt; insight?: boolean | ReactNode;
  interactive?: boolean; onSelect?: (item: DonutItem) => void; selected?: string;
  center?: (item: DonutItem | null) => DonutCenter; detail?: (item: DonutItem) => ReactNode; ariaLabel?: (item: DonutItem, share: number) => string;
}) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const ordered = interactive ? [...items].sort((a, b) => b.value - a.value) : items;
  const colorOf = (it: DonutItem) => it.color ?? (interactive ? chartTheme.tint(ordered.indexOf(it), ordered.length) : chartTheme.series[items.indexOf(it) % chartTheme.series.length]);
  const big = ordered.reduce<DonutItem | undefined>((m, i) => (!m || i.value > m.value ? i : m), undefined);
  const size = interactive ? 180 : 140;
  const stroke = interactive ? 22 : 18;
  const r = (size - (interactive ? 30 : stroke)) / 2;
  const c = 2 * Math.PI * r;
  const gap = interactive && ordered.length > 1 ? 2 : 0;
  const active = ordered.find((i) => i.label === hover) ?? null;
  const mid = center ? center(active) : active ? { value: fmt(active.value), label: `${active.label} · ${pctOf(active.value, total)}%` } : { value, label };
  const share = (it: DonutItem) => pctOf(it.value, total);
  const enter = (it: DonutItem) => setHover(it.label);
  const leave = () => { setHover(null); setTip(null); };
  const move = (e: { clientX: number; clientY: number }) => {
    const b = wrap.current?.getBoundingClientRect();
    if (b) setTip({ x: e.clientX - b.left + 14, y: e.clientY - b.top + 14 });
  };
  const pick = (it: DonutItem) => onSelect?.(it);
  const key = (it: DonutItem) => (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(it); } };
  const label$ = (it: DonutItem) => ariaLabel?.(it, share(it)) ?? `${it.label}: ${fmt(it.value)}, ${share(it)}% of the total`;
  let offset = 0;
  const arcs = ordered.map((it) => {
    const len = Math.max(0, (it.value / total) * c - gap);
    const arc = { it, len, offset };
    offset += (it.value / total) * c;
    return arc;
  });
  return (
    <>
    <div ref={wrap} className={`cq-donut${interactive ? ' cq-donut-live' : ''}`} onMouseLeave={leave}>
      <div className="cq-donut-ring" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} role={interactive ? 'group' : 'img'} aria-label={label}>
          {interactive && <defs><mask id={`m${uid}`}><circle className="cq-donut-sweep" cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={40} fill="none" strokeDasharray={c} style={{ ['--c' as string]: c }} /></mask></defs>}
          <circle cx={size / 2} cy={size / 2} r={r} className="cq-donut-track" style={{ strokeWidth: stroke }} />
          <g mask={interactive ? `url(#m${uid})` : undefined}>
            {arcs.map(({ it, len, offset: o }) => (
              <circle key={it.label} cx={size / 2} cy={size / 2} r={r} stroke={colorOf(it)}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-o}
                className={interactive ? `cq-seg${hover && hover !== it.label ? ' faded' : ''}${hover === it.label ? ' on' : ''}` : undefined}
                style={{ strokeWidth: interactive && hover === it.label ? 28 : stroke }}
                {...(interactive ? {
                  tabIndex: 0, role: 'button', 'aria-label': label$(it), 'aria-pressed': selected === it.label,
                  onMouseEnter: () => enter(it), onMouseMove: move, onFocus: () => enter(it), onBlur: leave, onClick: () => pick(it), onKeyDown: key(it),
                } : {})} />
            ))}
          </g>
          {interactive && selected && arcs.filter((a) => a.it.label === selected).map(({ it, len, offset: o }) => {
            const ro = r + 17, co = 2 * Math.PI * ro, l2 = (len / c) * co;
            return <circle key="sel" cx={size / 2} cy={size / 2} r={ro} className="cq-donut-selected" strokeDasharray={`${l2} ${co - l2}`} strokeDashoffset={-(o / c) * co} aria-hidden="true" data-for={it.label} />;
          })}
        </svg>
        <span aria-live="polite"><b>{mid.value}</b><small>{mid.label}</small>{mid.sub && <em>{mid.sub}</em>}</span>
      </div>
      <ul>
        {ordered.map((it) => (
          <li key={it.label} className={interactive ? `cq-legend-live${hover && hover !== it.label ? ' faded' : ''}${selected === it.label ? ' sel' : ''}` : undefined}
            {...(interactive ? { tabIndex: 0, role: 'button', 'aria-label': label$(it), 'aria-pressed': selected === it.label, onMouseEnter: () => enter(it), onMouseMove: move, onFocus: () => enter(it), onBlur: leave, onClick: () => pick(it), onKeyDown: key(it) } : {})}>
            <div className="cq-legend-row"><i style={{ background: colorOf(it) }} /><span>{it.label}</span><b>{fmt(it.value)}</b><small>{share(it)}%</small></div>
            {detail && <div className="cq-legend-detail">{detail(it)}</div>}
          </li>
        ))}
      </ul>
      {interactive && active && tip && (
        <div className="cq-donut-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <b>{active.label}</b>
          <span>{fmt(active.value)} · {share(active)}% of total</span>
          {detail && <div className="cq-donut-tip-detail">{detail(active)}</div>}
        </div>
      )}
    </div>
    {insight && big && <InsightStrip>{insight === true ? `${big.label} is the largest share at ${pctOf(big.value, total)}% (${fmt(big.value)}).` : insight}</InsightStrip>}
    </>
  );
}

/* ---------------------------------------------------------------- HeatGrid */
/** Brand-700 tints, white text on dark cells, optional row/column totals. */
export function HeatGrid({ rows, cols, values, corner = '', fmt = plain, totals, onCell, title }: {
  rows: string[]; cols: string[]; values: number[][]; corner?: string; fmt?: Fmt; totals?: boolean; onCell?: (row: string, col: string) => void; title?: (row: string, col: string, v: number) => string;
}) {
  const max = Math.max(1, ...values.flat());
  const colTotals = cols.map((_, ci) => values.reduce((s, r) => s + (r[ci] ?? 0), 0));
  return (
    <div className="cq-table-scroll">
      <table className="cq-heat">
        <thead><tr><th>{corner}</th>{cols.map((c) => <th key={c}>{c}</th>)}{totals && <th>Total</th>}</tr></thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th>{r}</th>
              {cols.map((c, ci) => {
                const v = values[ri]?.[ci] ?? 0;
                const s = v / max;
                return (
                  <td key={c}>
                    <button type="button" disabled={!onCell} title={title?.(r, c, v)} style={{ background: chartTheme.heat(s), color: chartTheme.heatInk(s) }} onClick={() => onCell?.(r, c)}>{fmt(v)}</button>
                  </td>
                );
              })}
              {totals && <td className="cq-heat-total">{fmt(values[ri].reduce((a, b) => a + b, 0))}</td>}
            </tr>
          ))}
          {totals && <tr className="cq-heat-foot"><th>Total</th>{colTotals.map((v, i) => <td key={cols[i]}>{fmt(v)}</td>)}<td>{fmt(colTotals.reduce((a, b) => a + b, 0))}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- FunnelSteps */
export interface FunnelStep { label: string; value: number; /** short stage name for conversion lines, e.g. "reach" */ short?: string }
/**
 * Conversion funnel: one full-width bar per step scaled to step 1 (brand tints, dark → light), value + % of the
 * previous step on the right, and the drop-off between steps as a risk-coloured line. Hover shows a tooltip.
 */
export function FunnelSteps({ steps, fmt = (v: number) => v.toLocaleString('en-IN'), unit = 'farmers', variant = 'bars' }: { steps: FunnelStep[]; fmt?: Fmt; unit?: string; variant?: 'bars' | 'funnel' }) {
  const first = steps[0]?.value || 1;
  if (variant === 'funnel') {
    // Stacked trapezoids: each stage narrows towards the next; widths step down evenly so small stages stay legible.
    const widths = steps.map((_, i) => 100 - i * (52 / Math.max(1, steps.length - 1)));
    const colors = ['var(--brand-900)', 'var(--brand-700)', 'var(--segment-growing)', 'var(--segment-emerging)'];
    return (
      <ol className="cq-funnel-shape">
        {steps.map((s, i) => {
          const prev = steps[i - 1];
          const w = widths[i], next = widths[i + 1] ?? w * 0.78;
          const inset = ((1 - next / w) / 2) * 100;
          const pctPrev = prev ? Math.round((s.value / (prev.value || 1)) * 100) : 100;
          return (
            <li key={s.label}>
              {prev && <p className="cq-funnel-conv">↓ {pctPrev}% {prev.short ?? prev.label.toLowerCase()} → {s.short ?? s.label.toLowerCase()} · {fmt(prev.value - s.value)} dropped</p>}
              <div className="cq-funnel-stage" title={`${s.label}: ${fmt(s.value)} · ${Math.round((s.value / first) * 100)}% of ${steps[0].label.toLowerCase()}`}
                style={{ width: `${w}%`, background: colors[i % colors.length], clipPath: `polygon(0 0, 100% 0, ${100 - inset}% 100%, ${inset}% 100%)` }}>
                <b>{fmt(s.value)}</b><small>{s.label}</small>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className="cq-funnel">
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const pctPrev = prev ? Math.round((s.value / (prev.value || 1)) * 100) : 100;
        const tip = prev ? `${s.label}: ${fmt(s.value)} · ${pctPrev}% of ${prev.label.toLowerCase()}` : `${s.label}: ${fmt(s.value)}`;
        return (
          <li key={s.label}>
            {prev && <p className="cq-funnel-drop">↓ {fmt(prev.value - s.value)} {unit} did not move to the next step</p>}
            <div className="cq-funnel-row" title={tip}>
              <span className="cq-funnel-label">{s.label}</span>
              <span className="cq-funnel-track"><i style={{ width: `${(s.value / first) * 100}%`, background: chartTheme.tint(i, steps.length) }} /></span>
              <span className="cq-funnel-value"><b>{fmt(s.value)}</b>{prev && <small>{pctPrev}% of {prev.label.toLowerCase()}</small>}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------------- StackedBar */
export interface StackSegment { label: string; value: number; color: string; /** diagonal stripes, e.g. "not yet verified" */ striped?: boolean; display?: string }
/** 100% stacked horizontal bar with a label under each segment (value + share) and a hover tooltip. */
export function StackedBar({ segments, height = 18, label }: { segments: StackSegment[]; height?: number; label?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div className="cq-sbar" role="img" aria-label={label ?? segments.map((s) => `${s.label} ${s.display ?? s.value} (${pct(s.value)}%)`).join(', ')}>
      <div className="cq-sbar-track" style={{ height }}>
        {segments.map((s) => (
          <i key={s.label} className={s.striped ? 'striped' : undefined} title={`${s.label}: ${s.display ?? s.value} · ${pct(s.value)}%`} style={{ flexGrow: s.value, background: s.color }} />
        ))}
      </div>
      <div className="cq-sbar-labels">
        {segments.map((s) => (
          <span key={s.label} style={{ flexGrow: s.value }}><b>{s.label} {s.display ?? s.value}</b><small>{pct(s.value)}%</small></span>
        ))}
      </div>
    </div>
  );
}

/** The only chart set (CLAUDE.md §3). All styling comes from chartTheme; no inline colours here. */
import { useId, useRef, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTheme } from '../chartTheme';
import { InsightStrip } from './system';

type Fmt = (v: number) => string;
const plain: Fmt = (v) => (Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toFixed(2));
export interface VizSeries { key: string; name: string; color?: string }
/** Planned/target series → --data-plan, actual/observed → --data-actual, others by position. */
export const seriesColor = (name: string, i: number) => (/plan|target|abp|benchmark/i.test(name) ? chartTheme.planned : /actual|observ|achiev|recorded/i.test(name) ? chartTheme.actual : chartTheme.series[i % chartTheme.series.length]);
const colorAt = (s: VizSeries, i: number) => s.color ?? seriesColor(s.name, i);
const pctOf = (v: number, t: number) => Math.round((v / (t || 1)) * 100);

/* ---------------------------------------------------------------- RankedBars */
export interface RankedItem { label: string; value: number; /** caption under the label */ note?: string; /** muted bar */ muted?: boolean; /** preformatted value */ display?: string; segments?: { label: string; value: number; color: string }[] }
/** Horizontal ranked bars: square 14px bars, bold value + grey share at the bar end. */
export function RankedBars({ items, fmt = plain, share = true, onSelect, max: fixedMax, insight }: { items: RankedItem[]; fmt?: Fmt; share?: boolean; onSelect?: (label: string) => void; max?: number; insight?: boolean | ReactNode }) {
  const max = fixedMax ?? Math.max(1, ...items.map((i) => i.segments ? i.segments.reduce((sum, segment) => sum + segment.value, 0) : Math.abs(i.value)));
  const total = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1;
  return (
    <>
    <ol className="cq-ranked">
      {items.map((it) => (
        <li key={it.label} className={onSelect ? 'clickable' : undefined} onClick={onSelect ? () => onSelect(it.label) : undefined}>
          <span className="cq-ranked-label">{it.label}{it.note && <small>{it.note}</small>}</span>
          <span className="cq-ranked-track">
            {it.segments ? <span className="cq-ranked-stack" aria-label={it.segments.map((s) => `${s.value} ${s.label}`).join(', ')}>{it.segments.map((s) => <i key={s.label} title={`${s.label}: ${s.value}`} style={{ width: `${Math.max(0, s.value / max) * 100}%`, backgroundColor: s.color }} />)}</span> : <i className={it.muted ? 'muted' : undefined} style={{ width: `${Math.min(1, Math.abs(it.value) / max) * 72}%` }} />}
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
export function GroupedColumns({ data, x, series, fmt = plain, height = 240, insight }: { data: Record<string, string | number>[]; x: string; series: VizSeries[]; fmt?: Fmt; height?: number; insight?: boolean | ReactNode }) {
  return (
    <>
    <div className="cq-chart cq-chart-fill" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartTheme.margin} barGap={2}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey={x} {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} tickFormatter={fmt} width={56} />
          <Tooltip {...chartTheme.tooltip} formatter={(v: number) => fmt(v)} />
          {series.length > 1 && <Legend {...chartTheme.legend} />}
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={colorAt(s, i)} barSize={chartTheme.barSize} radius={chartTheme.radius} isAnimationActive={false} />)}
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

export function TrendLine({ data, x, series, fmt = plain, height = 240 }: { data: Record<string, string | number>[]; x: string; series: VizSeries[]; fmt?: Fmt; height?: number }) {
  return (
    <div className="cq-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={chartTheme.margin}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey={x} {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} tickFormatter={fmt} width={56} />
          <Tooltip {...chartTheme.tooltip} formatter={(v: number) => fmt(v)} />
          {series.length > 1 && <Legend {...chartTheme.legend} />}
          {series.map((s, i) => <Line key={s.key} dataKey={s.key} name={s.name} stroke={colorAt(s, i)} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />)}
        </LineChart>
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

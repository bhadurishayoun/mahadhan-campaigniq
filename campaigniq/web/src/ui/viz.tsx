/** The only chart set (CLAUDE.md §3). All styling comes from chartTheme; no inline colours here. */
import type { ReactNode } from 'react';
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
export interface RankedItem { label: string; value: number; /** caption under the label */ note?: string; /** muted bar */ muted?: boolean; /** preformatted value */ display?: string }
/** Horizontal ranked bars: square 14px bars, bold value + grey share at the bar end. */
export function RankedBars({ items, fmt = plain, share = true, onSelect, max: fixedMax, insight }: { items: RankedItem[]; fmt?: Fmt; share?: boolean; onSelect?: (label: string) => void; max?: number; insight?: boolean | ReactNode }) {
  const max = fixedMax ?? Math.max(1, ...items.map((i) => Math.abs(i.value)));
  const total = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1;
  return (
    <>
    <ol className="cq-ranked">
      {items.map((it) => (
        <li key={it.label} className={onSelect ? 'clickable' : undefined} onClick={onSelect ? () => onSelect(it.label) : undefined}>
          <span className="cq-ranked-label">{it.label}{it.note && <small>{it.note}</small>}</span>
          <span className="cq-ranked-track">
            <i className={it.muted ? 'muted' : undefined} style={{ width: `${Math.min(1, Math.abs(it.value) / max) * 72}%` }} />
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
export function DonutMetric({ items, value, label, fmt = plain, insight }: { items: { label: string; value: number; color?: string }[]; value: ReactNode; label: string; fmt?: Fmt; insight?: boolean | ReactNode }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;
  const big = [...items].sort((a, b) => b.value - a.value)[0];
  return (
    <>
    <div className="cq-donut">
      <div className="cq-donut-ring">
        <svg viewBox="0 0 140 140" role="img" aria-label={label}>
          <circle cx="70" cy="70" r={r} className="cq-donut-track" />
          {items.map((it, i) => {
            const len = (it.value / total) * c;
            const el = <circle key={it.label} cx="70" cy="70" r={r} stroke={it.color ?? chartTheme.series[i % chartTheme.series.length]} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <span><b>{value}</b><small>{label}</small></span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={it.label}><i style={{ background: it.color ?? chartTheme.series[i % chartTheme.series.length] }} /><span>{it.label}</span><b>{fmt(it.value)}</b><small>{Math.round((it.value / total) * 100)}%</small></li>
        ))}
      </ul>
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

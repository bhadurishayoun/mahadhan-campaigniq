/** The only chart set (CLAUDE.md §3). All styling comes from chartTheme; no inline colours here. */
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTheme } from '../chartTheme';

type Fmt = (v: number) => string;
const plain: Fmt = (v) => v.toLocaleString('en-IN');
export interface VizSeries { key: string; name: string; color?: string }
const colorAt = (s: VizSeries, i: number) => s.color ?? chartTheme.series[i % chartTheme.series.length];

/* ---------------------------------------------------------------- RankedBars */
export interface RankedItem { label: string; value: number; /** caption under the label */ note?: string; /** muted bar */ muted?: boolean }
/** Horizontal ranked bars: square 14px bars, bold value + grey share at the bar end. */
export function RankedBars({ items, fmt = plain, share = true, onSelect }: { items: RankedItem[]; fmt?: Fmt; share?: boolean; onSelect?: (label: string) => void }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  const total = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1;
  return (
    <ol className="cq-ranked">
      {items.map((it) => (
        <li key={it.label} className={onSelect ? 'clickable' : undefined} onClick={onSelect ? () => onSelect(it.label) : undefined}>
          <span className="cq-ranked-label">{it.label}{it.note && <small>{it.note}</small>}</span>
          <span className="cq-ranked-track">
            <i className={it.muted ? 'muted' : undefined} style={{ width: `${(Math.abs(it.value) / max) * 72}%` }} />
            <b>{fmt(it.value)}</b>
            {share && <span>{Math.round((Math.abs(it.value) / total) * 100)}%</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------------- GroupedColumns / TrendLine */
export function GroupedColumns({ data, x, series, fmt = plain, height = 240 }: { data: Record<string, string | number>[]; x: string; series: VizSeries[]; fmt?: Fmt; height?: number }) {
  return (
    <div className="cq-chart">
      <ResponsiveContainer width="100%" height={height}>
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
  );
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
export function DonutMetric({ items, value, label, fmt = plain }: { items: { label: string; value: number; color?: string }[]; value: ReactNode; label: string; fmt?: Fmt }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;
  return (
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

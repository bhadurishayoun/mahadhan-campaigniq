import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { SERIES, axisStyle, gridStyle, tooltipStyle } from '../chartTheme';

type Row = Record<string, string | number>;
export interface Series { key: string; name?: string; color?: string }
const color = (s: Series, i: number) => s.color ?? SERIES[i % SERIES.length];

/** time -> line */
export function TrendLine({ data, x, series, height = 220, fmt }: { data: Row[]; x: string; series: Series[]; height?: number; fmt?: (v: number) => string }) {
  return (
    <div className="iq-fill" style={{ minHeight: height }}><ResponsiveContainer width="100%" height="100%" minHeight={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey={x} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} tickFormatter={fmt} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => (fmt ? fmt(v) : v)} />
        {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name ?? s.key} stroke={color(s, i)} strokeWidth={2} strokeDasharray={i === 1 && series.length === 2 ? '5 4' : undefined} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer></div>
  );
}

/** ranking -> horizontal bar (single or stacked mix) */
export function RankBars({ data, label = 'name', series, stacked, height, fmt, highlightFirst }: {
  data: Row[]; label?: string; series: Series[]; stacked?: boolean; height?: number; fmt?: (v: number) => string; highlightFirst?: boolean;
}) {
  const h = height ?? Math.max(120, data.length * 30 + 30);
  return (
    <div className="iq-fill" style={{ minHeight: h }}><ResponsiveContainer width="100%" height="100%" minHeight={h}>
      <BarChart data={data} layout="vertical" barCategoryGap="28%" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridStyle} horizontal={false} />
        <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <YAxis type="category" dataKey={label} tick={axisStyle} tickLine={false} axisLine={false} width={104} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => (fmt ? fmt(v) : v)} />
        {series.length > 1 && <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name ?? s.key} fill={color(s, i)} stackId={stacked ? 's' : undefined} radius={stacked ? 0 : [0, 4, 4, 0]} maxBarSize={series.length > 1 && !stacked ? 14 : 26}>
            {highlightFirst && series.length === 1 && data.map((_, di) => <Cell key={di} fill={di === 0 ? SERIES[0] : '#9fd27f'} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** category comparison -> vertical grouped / stacked columns */
export function ColumnBars({ data, x, series, stacked, height = 220, fmt, target }: {
  data: Row[]; x: string; series: Series[]; stacked?: boolean; height?: number; fmt?: (v: number) => string; target?: number;
}) {
  return (
    <div className="iq-fill" style={{ minHeight: height }}><ResponsiveContainer width="100%" height="100%" minHeight={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey={x} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} tickFormatter={fmt} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => (fmt ? fmt(v) : v)} />
        {series.length > 1 && <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />}
        {target !== undefined && <ReferenceLine y={target} stroke="#d7a62f" strokeDasharray="4 3" label={{ value: 'Target', fontSize: 10, fill: '#6b5310', position: 'right' }} />}
        {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name ?? s.key} fill={color(s, i)} stackId={stacked ? 's' : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** target vs actual -> bullet / progress rows */
export function Bullets({ rows, unit = '%', max, neutral }: { rows: { label: string; actual: number; target: number; note?: string }[]; unit?: string; max?: number; neutral?: boolean }) {
  return (
    <div className="iq-bullets">
      {rows.map((r) => {
        const ceil = max ?? Math.max(r.target * 1.25, r.actual, 1);
        const ratio = r.actual / r.target;
        return (
          <div key={r.label} className="iq-bullet">
            <span className="iq-bullet-label">{r.label}</span>
            <div className="iq-bullet-track" role="img" aria-label={`${r.label}: ${r.actual}${unit} of ${r.target}${unit} target`}>
              <i className={neutral || ratio >= 0.95 ? 'ok' : ratio >= 0.8 ? 'warn' : 'risk'} style={{ width: `${(r.actual / ceil) * 100}%` }} />
              <b style={{ left: `${(r.target / ceil) * 100}%` }} />
            </div>
            <span className="iq-bullet-val">{r.actual}{unit} <small>/ {r.target}{unit}</small></span>
          </div>
        );
      })}
    </div>
  );
}

/** two measures -> scatter */
export function ScatterPlot({ points, xLabel, yLabel, height = 240, xFmt, yFmt }: {
  points: { name: string; x: number; y: number; z?: number }[]; xLabel: string; yLabel: string; height?: number; xFmt?: (v: number) => string; yFmt?: (v: number) => string;
}) {
  return (
    <div className="iq-fill" style={{ minHeight: height }}><ResponsiveContainer width="100%" height="100%" minHeight={height}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 18, left: 0 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis type="number" dataKey="x" name={xLabel} tick={axisStyle} tickLine={false} tickFormatter={xFmt} label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: '#66736a' }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={axisStyle} tickLine={false} width={44} tickFormatter={yFmt} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#66736a' }} />
        <ZAxis type="number" dataKey="z" range={[60, 160]} />
        <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => v} labelFormatter={() => ''} content={({ payload }) => {
          const p = payload?.[0]?.payload as { name: string; x: number; y: number } | undefined;
          return p ? <div className="iq-tip"><b>{p.name}</b><span>{xLabel}: {xFmt ? xFmt(p.x) : p.x}</span><span>{yLabel}: {yFmt ? yFmt(p.y) : p.y}</span></div> : null;
        }} />
        <Scatter data={points} fill={SERIES[0]} fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer></div>
  );
}

/** staged flow -> funnel bars with step conversion */
export function FunnelBars({ stages }: { stages: { label: string; value: number }[] }) {
  const top = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ol className="iq-funnel">
      {stages.map((s, i) => (
        <li key={s.label}>
          <span>{s.label}</span>
          <div><i style={{ width: `${(s.value / top) * 100}%`, opacity: 1 - i * 0.12 }} /></div>
          <b>{s.value.toLocaleString('en-IN')}</b>
          <small>{i === 0 ? '' : `${Math.round((s.value / stages[i - 1].value) * 100)}%`}</small>
        </li>
      ))}
    </ol>
  );
}

/** matrix of two categories -> heat grid */
export function HeatGrid({ rows, cols, values, fmt = (v) => `${v}`, corner = '' }: { rows: string[]; cols: string[]; values: number[][]; fmt?: (v: number) => string; corner?: string }) {
  const flat = values.flat();
  const lo = Math.min(...flat);
  const hi = Math.max(...flat);
  return (
    <div className="iq-heat" style={{ gridTemplateColumns: `minmax(90px, auto) repeat(${cols.length}, minmax(48px, 1fr))` }}>
      <span className="corner">{corner}</span>
      {cols.map((c) => <span key={c} className="colh">{c}</span>)}
      {rows.map((r, ri) => (
        <FragmentRow key={r} label={r}>
          {values[ri].map((v, ci) => {
            const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
            return <span key={ci} className="cell" style={{ background: `rgba(47,138,59,${0.1 + t * 0.75})`, color: t > 0.55 ? '#fff' : '#1d2a1f' }} title={`${r} · ${cols[ci]}: ${fmt(v)}`}>{fmt(v)}</span>;
          })}
        </FragmentRow>
      ))}
    </div>
  );
}
function FragmentRow({ label, children }: { label: string; children: ReactNode }) {
  return <><span className="rowh">{label}</span>{children}</>;
}

/** bridge between a start and end value -> waterfall */
export function Waterfall({ steps, height = 220, fmt }: { steps: { label: string; value: number; total?: boolean }[]; height?: number; fmt?: (v: number) => string }) {
  let run = 0;
  const data = steps.map((s) => {
    if (s.total) { run = s.value; return { name: s.label, base: 0, up: s.value, down: 0, total: s.value }; }
    const start = run;
    run += s.value;
    return { name: s.label, base: Math.min(start, run), up: s.value >= 0 ? s.value : 0, down: s.value < 0 ? -s.value : 0, total: 0 };
  });
  return (
    <div className="iq-fill" style={{ minHeight: height }}><ResponsiveContainer width="100%" height="100%" minHeight={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} tickFormatter={fmt} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => (fmt ? fmt(v) : v)} />
        <Bar dataKey="base" stackId="w" fill="transparent" />
        <Bar dataKey="total" stackId="w" fill={SERIES[0]} />
        <Bar dataKey="up" stackId="w" fill="#5fae4c" />
        <Bar dataKey="down" stackId="w" fill="#d9534f" />
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** simple Gantt over months */
export function MonthGantt({ rows, months }: { rows: { label: string; start: number; end: number }[]; months: string[] }) {
  return (
    <div className="iq-gantt" style={{ gridTemplateColumns: `minmax(110px, auto) repeat(${months.length}, 1fr)` }}>
      <span />{months.map((m) => <span key={m} className="colh">{m}</span>)}
      {rows.map((r) => (
        <FragmentRow key={r.label} label={r.label}>
          {months.map((m, i) => <span key={m} className={`gcell ${i >= r.start && i <= r.end ? 'on' : ''}`} />)}
        </FragmentRow>
      ))}
    </div>
  );
}

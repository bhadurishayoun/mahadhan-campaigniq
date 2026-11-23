/** Chart wrappers. Series colours come from theme.ts (planned = brand, observed/actual = amber). */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { C } from '../theme';

const AXIS = { fontSize: 12, fill: C.inkSoft };

/** X-axis tick that wraps long category names onto two lines. */
function WrapTick({ x, y, payload, bold }: { x?: number; y?: number; payload?: { value: string }; bold?: string }) {
  const words = String(payload?.value ?? '').split(' ');
  const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : words;
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={12} fill={bold && payload?.value === bold ? C.ink : C.inkSoft} fontWeight={bold && payload?.value === bold ? 700 : 400}>
      {lines.map((l, i) => <tspan key={l} x={x} dy={i === 0 ? 14 : 14}>{l}</tspan>)}
    </text>
  );
}

export interface Series { key: string; label: string; color: string }

/** Vertical grouped columns with value labels on top. */
/** `highlight` = x value of the selected category: bold label, other categories faded. */
export function GroupedBars<T extends Record<string, unknown>>({ data, x, series, height = 200, unit = '', max, highlight, tooltip }: { tooltip?: (row: T) => string; data: T[]; x: keyof T & string; series: Series[]; height?: number; unit?: string; max?: number; highlight?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: -14, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={C.line} strokeDasharray="3 3" />
          <XAxis dataKey={x} tick={<WrapTick bold={highlight} />} height={38} axisLine={{ stroke: C.line }} tickLine={false} interval={0} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[0, max ?? 'auto']} tickFormatter={(v) => `${v}${unit}`} />
          {tooltip && <Tooltip cursor={{ fill: C.kpiBg }} content={({ active, payload }) => {
            const row = active ? (payload?.[0]?.payload as T | undefined) : undefined;
            return row ? <div className="toast" style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}` }}>{tooltip(row)}</div> : null;
          }} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false}>
              {data.map((d) => <Cell key={String(d[x])} fill={s.color} fillOpacity={highlight && d[x] !== highlight ? 0.35 : 1} />)}
              <LabelList dataKey={s.key} position="top" style={{ fontSize: 12, fontWeight: 600, fill: C.ink }} formatter={(v: number) => `${v}${unit}`} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Legend series={series} />
    </div>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return <div className="legend" style={{ justifyContent: 'center' }}>{series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}</div>;
}

/** Horizontal bars; one or two series per row, value label at the bar end. */
export function HBars({ rows, series, max, format, labelWidth = 170, fill }: {
  rows: { label: string; values: number[]; highlight?: number; title?: string }[];
  /** Spread the rows evenly over the card height. */
  fill?: boolean;
  series: Series[];
  max: number;
  format: (v: number) => string;
  labelWidth?: number;
}) {
  return (
    <div className={`hbars${fill ? ' fill' : ''}`} style={{ ['--label-w' as string]: `${labelWidth}px` }}>
      {rows.map((r) => (
        <div key={r.label} className="hbar" title={r.title}>
          <span>{r.label}</span>
          <div className="tracks">
            {r.values.map((v, i) => (
              <div key={series[i].key} className="track">
                <i style={{ width: `${(v / max) * 82}%`, background: r.highlight === i ? C.amber : series[i].color }} />
                <b>{format(v)}</b>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Waterfall: steps are signed deltas; `total` steps start from zero. */
export function Waterfall({ steps, height = 210 }: { steps: { label: string; value: number; total?: boolean }[]; height?: number }) {
  let running = 0;
  const data = steps.map((s) => {
    if (s.total) { running = s.value; return { label: s.label, base: 0, size: s.value, value: s.value, neg: false }; }
    const start = running;
    running += s.value;
    return { label: s.label, base: Math.min(start, running), size: Math.abs(s.value), value: s.value, neg: s.value < 0 };
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={C.line} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={<WrapTick />} height={38} axisLine={{ stroke: C.line }} tickLine={false} interval={0} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="size" stackId="w" isAnimationActive={false} maxBarSize={56}>
          {data.map((d) => <Cell key={d.label} fill={d.neg ? C.amber : C.brand} />)}
          <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 700, fill: C.ink }} formatter={(v: number) => (v < 0 ? `(${Math.abs(v).toFixed(1)})` : v.toFixed(1))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ parts, center, sub, size = 150 }: { parts: { label: string; value: number; color: string }[]; center: string; sub: string; size?: number }) {
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={shown.length ? shown : [{ label: 'none', value: 1, color: C.neutral }]} dataKey="value" innerRadius={size * 0.33} outerRadius={size * 0.48} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            {(shown.length ? shown : [{ label: 'none', color: C.neutral }]).map((p) => <Cell key={p.label} fill={p.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div><div className="kpi-value">{center}</div><div className="muted" style={{ fontSize: 12 }}>{sub}</div></div>
      </div>
    </div>
  );
}

/** Count grid with tint intensity by value. */
export function HeatGrid({ rows, cols, value, onCell, total, highlight }: {
  highlight?: string;
  rows: { key: string; label: string }[];
  cols: { key: string; label: string }[];
  value: (r: string, c: string) => number;
  onCell?: (r: string, c: string) => void;
  total?: boolean;
}) {
  const all = rows.flatMap((r) => cols.map((c) => value(r.key, c.key)));
  const max = Math.max(1, ...all);
  const bg = (v: number) => (v === 0 ? C.amberSoft : v / max >= 0.99 ? C.light : C.tint);
  return (
    <table className="heat">
      <thead><tr><th>Region</th>{cols.map((c) => <th key={c.key}>{c.label}</th>)}{total && <th>Total</th>}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="lab" style={highlight ? { fontWeight: r.key === highlight ? 800 : 400, color: r.key === highlight ? C.dark : C.inkSoft } : undefined}>{r.label}{r.key === highlight ? ' ●' : ''}</td>
            {cols.map((c) => {
              const v = value(r.key, c.key);
              return <td key={c.key} className={onCell ? 'click' : undefined} style={{ background: bg(v) }} onClick={onCell ? () => onCell(r.key, c.key) : undefined}>{v}</td>;
            })}
            {total && <td style={{ background: C.canvas }}>{cols.reduce((s, c) => s + value(r.key, c.key), 0)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Trend line with a light area fill, value labels and a hover tooltip (e.g. quarterly secondary sales). */
export function TrendLine<T extends Record<string, unknown>>({ data, x, y, height = 220, format = (v: number) => String(v), tooltip, color = C.brand }: {
  data: T[]; x: keyof T & string; y: keyof T & string; height?: number; format?: (v: number) => string; tooltip?: (row: T) => string; color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 24, right: 16, left: -4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={C.line} strokeDasharray="3 3" />
        <XAxis dataKey={x} tick={AXIS} axisLine={{ stroke: C.line }} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => format(v as number)} />
        <Tooltip cursor={{ stroke: C.line }} content={({ active, payload }) => {
          const row = active ? (payload?.[0]?.payload as T | undefined) : undefined;
          return row ? <div className="toast" style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}` }}>{tooltip ? tooltip(row) : format(row[y] as number)}</div> : null;
        }} />
        <Area type="monotone" dataKey={y} stroke={color} strokeWidth={2.5} fill={C.tint} fillOpacity={0.7} dot={{ r: 4, fill: C.card, stroke: color, strokeWidth: 2 }} isAnimationActive={false}>
          <LabelList dataKey={y} position="top" style={{ fontSize: 12, fontWeight: 700, fill: C.ink }} formatter={(v: number) => format(v)} />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Small inline trend line for table cells (no axes). */
export function Sparkline({ values, width = 96, height = 28, label }: { values: number[]; width?: number; height?: number; label: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const px = (i: number) => (i / (values.length - 1)) * (width - 6) + 3;
  const py = (v: number) => height - 3 - ((v - min) / (max - min || 1)) * (height - 6);
  const pts = values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  return (
    <svg width={width} height={height} role="img" aria-label={label}><title>{label}</title>
      <polyline points={pts} fill="none" stroke={C.brand} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={2.2} fill={C.brand} />)}
    </svg>
  );
}

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Home, Info, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { useNav, type ScreenId } from './nav';

/* ------------------------------------------------------------------ layout helpers */

/**
 * Measures the rendered width of an element (ResizeObserver). Charts use it to draw at their real pixel
 * width, so labels keep a readable size on phones and never stretch on wide monitors.
 */
export function useWidth<T extends Element>(fallback = 600): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // clientWidth is in the element's own CSS pixels, so the laptop `zoom` in main.tsx doesn't skew it.
    // `previous` guards against a scrollbar feedback loop (chart grows -> scrollbar appears -> width shrinks ->
    // chart shrinks -> scrollbar disappears ...): a change straight back to the width we just left is ignored.
    // Only a quick bounce (< 400 ms) counts; a real resize back to an earlier width is applied normally.
    let previous = -1;
    let changedAt = 0;
    const measure = () => {
      const next = Math.round(element.clientWidth);
      if (next <= 0) return;
      setWidth((current) => {
        if (Math.abs(current - next) <= 1) return current;
        if (next === previous && performance.now() - changedAt < 400) return current;
        previous = current;
        changedAt = performance.now();
        return next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** True inside a panel opened full screen - charts use it to grow taller. */
const ExpandedContext = createContext(false);
export const usePanelExpanded = () => useContext(ExpandedContext);

/** Chart height: the design height normally, taller (up to 60% of the viewport) when the panel is full screen. */
export function useChartHeight(base: number) {
  const expanded = usePanelExpanded();
  return expanded ? Math.max(base, Math.round(Math.min(window.innerHeight * 0.6, 560))) : base;
}

/** Clamp helper used by responsive charts. */
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** True when the user asked the OS for reduced motion. */
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ tooltips */

/**
 * One floating tooltip for the whole app. Any element with a `data-tip` attribute (HTML or SVG) shows it on
 * hover / tap. Mounted once in App.tsx.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    let current: Element | null = null;
    const show = (target: Element | null) => {
      const element = target?.closest?.('[data-tip]') ?? null;
      if (!element) { if (current) { current = null; setTip(null); } return; }
      current = element;
      const rect = element.getBoundingClientRect();
      setTip({ text: element.getAttribute('data-tip') ?? '', x: rect.left + rect.width / 2, y: rect.top });
    };
    const onOver = (event: PointerEvent) => show(event.target as Element);
    const onDown = (event: PointerEvent) => { if (event.pointerType !== 'mouse') show(event.target as Element); };
    const hide = () => { current = null; setTip(null); };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);
  if (!tip || !tip.text) return null;
  const left = clamp(tip.x, 90, window.innerWidth - 90);
  const below = tip.y < 60;
  return createPortal(
    <div className={cx('ui-tip', below && 'ui-tip-below')} style={{ left, top: below ? tip.y + 28 : tip.y - 8 }} role="tooltip">{tip.text}</div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ animated numbers */

const NUMBER_RE = /-?\d[\d,]*(?:\.\d+)?/;

/** Counts up to the first number inside a value such as "₹6.4 Cr", "3.2 Lakh", "63%" or 1,240. */
export function CountUp({ value, duration = 900 }: { value: ReactNode; duration?: number }) {
  const parsed = useMemo(() => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value);
    const match = text.match(NUMBER_RE);
    if (!match || match.index === undefined) return null;
    const raw = match[0];
    const target = parseFloat(raw.replace(/,/g, ''));
    if (!Number.isFinite(target)) return null;
    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
    return { before: text.slice(0, match.index), after: text.slice(match.index + raw.length), target, decimals, commas: raw.includes(',') };
  }, [value]);
  const [progress, setProgress] = useState(() => (reducedMotion() ? 1 : 0));
  useEffect(() => {
    if (!parsed || reducedMotion()) { setProgress(1); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setProgress(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [parsed, duration]);
  if (!parsed) return <>{value}</>;
  const current = parsed.target * progress;
  const shown = parsed.commas
    ? current.toLocaleString('en-IN', { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })
    : current.toFixed(parsed.decimals);
  return <>{parsed.before}{shown}{parsed.after}</>;
}

export type Tone = 'green' | 'lime' | 'amber' | 'red' | 'blue' | 'grey' | 'dark' | 'purple';

export const COLORS = {
  dark: '#1f5f2c',
  green: '#2f8a3b',
  mid: '#5fae4c',
  light: '#9fd27f',
  pale: '#d8edc9',
  yellow: '#e8c13a',
  amber: '#f0a830',
  red: '#d9534f',
  grey: '#c9cfc6',
  blue: '#3f7fc4',
};

const cx = (...names: (string | false | undefined | null)[]) => names.filter(Boolean).join(' ');

export function Btn({ children, variant = 'outline', to, onClick, icon, small, className, disabled }: {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'dark';
  to?: ScreenId;
  onClick?: () => void;
  icon?: ReactNode;
  small?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const { go } = useNav();
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx('btn', `btn-${variant}`, small && 'btn-sm', className)}
      onClick={() => {
        onClick?.();
        if (to) go(to);
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function Pill({ tone = 'green', children, solid }: { tone?: Tone; children: ReactNode; solid?: boolean }) {
  return <span className={cx('pill', `pill-${tone}`, solid && 'pill-solid')}>{children}</span>;
}

/** Small "Demo data / Live data" marker on panels fed by useDataset(). Click opens the Data Sources screen. */
export function DataBadge({ data }: { data: { name: string; live: boolean; source?: string; uploadedAt?: string } }) {
  const { go } = useNav();
  const title = data.live
    ? `Live data · ${data.name}${data.source ? ` · ${data.source}` : ''}${data.uploadedAt ? ` · ${data.uploadedAt}` : ''}`
    : `Illustrative demo data. Upload dataset "${data.name}" in Data Sources to replace it.`;
  return (
    <button type="button" className={cx('data-badge', data.live ? 'data-live' : 'data-demo')} title={title} onClick={() => go('admin.1')}>
      {data.live ? 'Live' : 'Demo'}
    </button>
  );
}

export function Panel({ title, icon, info, actions, className, children, number, subtitle, style, data }: {
  title?: ReactNode;
  icon?: ReactNode;
  info?: boolean;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
  number?: number;
  subtitle?: ReactNode;
  style?: CSSProperties;
  data?: { name: string; live: boolean; source?: string; uploadedAt?: string };
}) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('has-expanded-panel');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('has-expanded-panel'); };
  }, [expanded]);
  return (
    <>
      {expanded && <div className="panel-backdrop" onClick={() => setExpanded(false)} />}
      <section className={cx('panel', className, expanded && 'panel-expanded')} style={style} aria-modal={expanded || undefined}>
        {(title || actions) && (
          <header className="panel-head">
            <div className="panel-title">
              {number !== undefined && <span className="panel-number">{number}.</span>}
              {icon && <span className="panel-icon">{icon}</span>}
              <h3>{title}</h3>
              {info && <span className="panel-info" data-tip="Hover or tap chart elements for exact values. Use ⤢ to open this panel full screen."><Info size={13} className="muted-icon" /></span>}
              {data && <DataBadge data={data} />}
            </div>
            <div className="panel-head-right">
              {actions && <div className="panel-actions">{actions}</div>}
              {title && (
                <button
                  type="button"
                  className="panel-expand"
                  aria-label={expanded ? 'Exit full screen' : 'Open panel full screen'}
                  data-tip={expanded ? 'Close (Esc)' : 'Full screen'}
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              )}
            </div>
          </header>
        )}
        {subtitle && <p className="panel-sub">{subtitle}</p>}
        <ExpandedContext.Provider value={expanded}>{children}</ExpandedContext.Provider>
      </section>
    </>
  );
}

export function Kpi({ icon, label, value, sub, trend, spark, tone, badge, compact }: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  trend?: 'up' | 'down';
  spark?: boolean | number[];
  tone?: Tone;
  badge?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx('kpi', tone && `kpi-${tone}`, compact && 'kpi-compact')}>
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value-row">
          <span className="kpi-value"><CountUp value={value} /></span>
          {badge}
          {spark && <Spark points={Array.isArray(spark) ? spark : undefined} tone={trend === 'down' ? 'red' : 'green'} />}
        </div>
        {sub && <div className={cx('kpi-sub', trend && `trend-${trend}`)}>{trend === 'up' ? '▲ ' : trend === 'down' ? '▼ ' : ''}{sub}</div>}
      </div>
    </div>
  );
}

export function KpiRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('kpi-row', className)}>{children}</div>;
}

export function Spark({ points = [3, 5, 4, 6, 5, 7, 6, 8, 9], tone = 'green', width = 64, height = 22 }: {
  points?: number[];
  tone?: Tone;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = width / Math.max(points.length - 1, 1);
  const path = points
    .map((point, index) => `${index ? 'L' : 'M'}${(index * step).toFixed(1)},${(height - 2 - ((point - min) / (max - min || 1)) * (height - 4)).toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden data-tip={`Trend: ${points.join(' → ')}`}>
      <path className="spark-line" pathLength={1} d={path} fill="none" stroke={tone === 'red' ? COLORS.red : COLORS.green} strokeWidth="1.6" />
      <circle cx={width - 1.5} cy={(height - 2 - ((last - min) / (max - min || 1)) * (height - 4)).toFixed(1)} r="2" fill={tone === 'red' ? COLORS.red : COLORS.green} />
    </svg>
  );
}

export function Progress({ value, max = 100, tone = 'green', label, height = 8 }: {
  value: number;
  max?: number;
  tone?: Tone;
  label?: ReactNode;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-wrap">
      <div className="progress" style={{ height }} data-tip={`${Math.round(pct)}% of ${max === 100 ? 'target' : max}`}>
        <div className={cx('progress-fill', `fill-${tone}`)} style={{ width: `${pct}%` }} />
      </div>
      {label !== undefined && <span className="progress-label">{label}</span>}
    </div>
  );
}

export interface Column<T> {
  key: string;
  label: ReactNode;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => ReactNode;
  width?: string | number;
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, highlight, total, onRowClick, compact }: {
  columns: Column<T>[];
  rows: T[];
  highlight?: (row: T, index: number) => boolean;
  total?: Record<string, ReactNode>;
  onRowClick?: (row: T, index: number) => void;
  compact?: boolean;
}) {
  // Click a header to sort by that column (asc -> desc -> original order). Only columns whose raw values
  // are numbers or strings are sortable. Callbacks still receive each row's ORIGINAL index.
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sortable = (key: string) => rows.length > 1 && rows.every((row) => ['string', 'number'].includes(typeof row[key]));
  const ordered = useMemo(() => {
    const indexed = rows.map((row, index) => ({ row, index }));
    if (!sort) return indexed;
    const value = (row: T) => {
      const raw = row[sort.key] as string | number;
      if (typeof raw === 'number') return raw;
      const numeric = parseFloat(String(raw).replace(/[^\d.-]/g, ''));
      return /^[\s₹~≈<>+-]*\d/.test(String(raw)) && Number.isFinite(numeric) ? numeric : String(raw).toLowerCase();
    };
    return [...indexed].sort((a, b) => {
      const x = value(a.row); const y = value(b.row);
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir;
      return String(x).localeCompare(String(y)) * sort.dir;
    });
  }, [rows, sort]);
  const toggle = (key: string) => setSort((current) => {
    if (!current || current.key !== key) return { key, dir: 1 };
    return current.dir === 1 ? { key, dir: -1 } : null;
  });
  return (
    <div className="table-wrap">
      <table className={cx('dt', compact && 'dt-compact')}>
        <thead>
          <tr>
            {columns.map((column) => {
              const canSort = sortable(column.key);
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  style={{ textAlign: column.align ?? 'left', width: column.width }}
                  className={cx(canSort && 'th-sort', active && 'th-sorted')}
                  aria-sort={active ? (sort!.dir === 1 ? 'ascending' : 'descending') : undefined}
                  onClick={canSort ? () => toggle(column.key) : undefined}
                >
                  {column.label}
                  {canSort && (
                    <span className="th-sort-icon" aria-hidden>
                      {active ? (sort!.dir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} />}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map(({ row, index }) => (
            <tr
              key={index}
              className={cx(highlight?.(row, index) && 'row-highlight', onRowClick && 'row-click')}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? 'left' }} data-label={typeof column.label === 'string' ? column.label : undefined}>
                  {column.render ? column.render(row, index) : (row[column.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot>
            <tr>
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>{total[column.key]}</td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
  note?: ReactNode;
}

export function Donut({ segments, center, sub, size = 150, thickness = 28, showPct = true, legend = true }: {
  segments: Segment[];
  center?: ReactNode;
  sub?: ReactNode;
  size?: number;
  thickness?: number;
  showPct?: boolean;
  legend?: boolean;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = size / 2 - thickness / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const [active, setActive] = useState<string | null>(null);
  const activeSegment = segments.find((segment) => segment.label === active);
  let offset = 0;
  return (
    <div className={cx('donut-block', active && 'donut-has-active')} onMouseLeave={() => setActive(null)}>
      <div className="donut" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const angle = ((offset + length / 2) / circumference) * Math.PI * 2 - Math.PI / 2;
            const pct = Math.round((segment.value / total) * 100);
            const element = (
              <g
                key={segment.label}
                className={cx('donut-seg', active === segment.label && 'active')}
                style={{ animationDelay: `${index * 70}ms` }}
                onMouseEnter={() => setActive(segment.label)}
                onClick={() => setActive((current) => (current === segment.label ? null : segment.label))}
                data-tip={`${segment.label}: ${pct}%`}
              >
                <circle
                  r={radius}
                  cx={size / 2}
                  cy={size / 2}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                {showPct && segment.value / total >= 0.05 && (
                  <text
                    x={size / 2 + Math.cos(angle) * radius}
                    y={size / 2 + Math.sin(angle) * radius + 4}
                    textAnchor="middle"
                    className="donut-pct"
                  >
                    {Math.round((segment.value / total) * 100)}%
                  </text>
                )}
              </g>
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="donut-center">
          {activeSegment ? (
            <>
              <strong>{Math.round((activeSegment.value / total) * 100)}%</strong>
              <span className="donut-center-label">{activeSegment.label}</span>
            </>
          ) : (
            <>
              <strong>{center}</strong>
              {sub && <span>{sub}</span>}
            </>
          )}
        </div>
      </div>
      {legend && (
        <ul className="legend">
          {segments.map((segment) => (
            <li
              key={segment.label}
              className={cx('legend-item', active === segment.label && 'active')}
              onMouseEnter={() => setActive(segment.label)}
              onClick={() => setActive((current) => (current === segment.label ? null : segment.label))}
            >
              <i style={{ background: segment.color }} />
              <span>{segment.label}</span>
              {segment.note && <em>{segment.note}</em>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const FUNNEL_COLORS = ['#1f6b2e', '#2f8a3b', '#4c9f43', '#76b84f', '#c9b52f', '#e8c13a', '#f0d36b'];

export function Funnel({ stages, showConversion = true }: {
  stages: { label: ReactNode; value: ReactNode; pct?: ReactNode; sub?: ReactNode }[];
  showConversion?: boolean;
}) {
  return (
    <div className="funnel">
      {stages.map((stage, index) => (
        <div className="funnel-row" key={index}>
          <div
            className="funnel-bar"
            style={{
              background: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
              width: `${100 - index * (50 / Math.max(stages.length, 1))}%`,
              animationDelay: `${index * 80}ms`,
            }}
            data-tip={typeof stage.pct === 'string' && stage.pct ? `Conversion from previous stage: ${stage.pct}` : undefined}
          >
            <span>{stage.label}</span>
            <strong>{stage.value}</strong>
          </div>
          {showConversion && <span className="funnel-pct">{stage.pct ?? ''}</span>}
        </div>
      ))}
    </div>
  );
}

export function StackFunnel({ stages }: { stages: { value: ReactNode; label: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="stack-funnel">
      {stages.map((stage, index) => (
        <div
          key={index}
          className="stack-funnel-step"
          style={{ background: FUNNEL_COLORS[Math.min(index * 2, FUNNEL_COLORS.length - 1)], width: `${100 - index * 14}%` }}
        >
          <strong>{stage.value}</strong>
          <span>{stage.label}</span>
          {stage.sub && <em>{stage.sub}</em>}
        </div>
      ))}
    </div>
  );
}

export function HBars({ rows, max, tone = 'green', valueSuffix = '' }: {
  rows: { label: ReactNode; value: number; display?: ReactNode; tone?: Tone }[];
  max?: number;
  tone?: Tone;
  valueSuffix?: string;
}) {
  const top = max ?? Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="hbars">
      {rows.map((row, index) => (
        <div className="hbar-row" key={index}>
          <span className="hbar-label">{row.label}</span>
          <div className="hbar-track" data-tip={`${typeof row.label === 'string' ? `${row.label}: ` : ''}${typeof row.display === 'string' ? row.display : `${row.value}${valueSuffix}`}`}>
            <div className={cx('hbar-fill', `fill-${row.tone ?? tone}`)} style={{ width: `${(row.value / top) * 100}%`, animationDelay: `${index * 60}ms` }} />
          </div>
          <span className="hbar-value">{row.display ?? `${row.value}${valueSuffix}`}</span>
        </div>
      ))}
    </div>
  );
}

export function VBars({ data, series, height: baseHeight = 150, max, showValues = true, valueFormat }: {
  data: { label: ReactNode; values: number[]; labels?: ReactNode[] }[];
  series: { label: string; color: string }[];
  height?: number;
  max?: number;
  showValues?: boolean;
  valueFormat?: (value: number) => ReactNode;
}) {
  const height = useChartHeight(baseHeight);
  const top = max ?? Math.max(...data.flatMap((item) => item.values), 1);
  return (
    <div className="vbars-block">
      <div className="vbars" style={{ height }}>
        {data.map((item, index) => (
          <div className="vbar-group" key={index}>
            <div className="vbar-cols">
              {item.values.map((value, seriesIndex) => {
                const shown = item.labels?.[seriesIndex] ?? (valueFormat ? valueFormat(value) : value);
                const tip = `${typeof item.label === 'string' ? `${item.label} · ` : ''}${series[seriesIndex]?.label ?? ''}${series[seriesIndex]?.label ? ': ' : ''}${typeof shown === 'string' || typeof shown === 'number' ? shown : value}`;
                return (
                  <div className="vbar-col" key={seriesIndex} data-tip={tip}>
                    {showValues && <span className="vbar-value">{shown}</span>}
                    <div className="vbar" style={{ height: `${(value / top) * (height - 34)}px`, background: series[seriesIndex]?.color, animationDelay: `${index * 60 + seriesIndex * 30}ms` }} />
                  </div>
                );
              })}
            </div>
            <span className="vbar-label">{item.label}</span>
          </div>
        ))}
      </div>
      {series.length > 1 && (
        <ul className="legend legend-inline">
          {series.map((serie) => <li key={serie.label}><i style={{ background: serie.color }} /><span>{serie.label}</span></li>)}
        </ul>
      )}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: ScreenId }[] }) {
  const { go } = useNav();
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Home size={13} />
      {items.map((item, index) => (
        <span key={item.label} className={cx('crumb', index === items.length - 1 && 'crumb-current')}>
          <ChevronRight size={12} />
          {item.to ? <button type="button" onClick={() => go(item.to!)}>{item.label}</button> : item.label}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ code, title, subtitle, badge, actions, back }: {
  code?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  back?: ScreenId;
}) {
  const { go } = useNav();
  return (
    <div className="page-header">
      <div className="page-title-block">
        <div className="page-title-row">
          {back && <button type="button" className="back-btn" aria-label="Back" onClick={() => go(back)}><ChevronLeft size={18} /></button>}
          {code && <span className="code-chip">{code}</span>}
          <h1>{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function SourceBar({ children, right, tone = 'green' }: { children: ReactNode; right?: ReactNode; tone?: 'green' | 'plain' }) {
  return (
    <div className={cx('source-bar', tone === 'plain' && 'source-plain')}>
      <div>{children}</div>
      {right && <div className="source-right">{right}</div>}
    </div>
  );
}

export function FlowFooter({ label = 'Navigation Flow:', steps, next, nextLabel = 'Recommended Next:' }: {
  label?: string;
  steps: { label: string; to?: ScreenId; current?: boolean }[];
  next?: { label: ReactNode; to: ScreenId; sub?: ReactNode };
  nextLabel?: string;
}) {
  const { go } = useNav();
  return (
    <footer className="flow-footer">
      <span className="flow-label">{label}</span>
      <div className="flow-steps">
        {steps.map((step, index) => (
          <span key={step.label} className="flow-step-wrap">
            {index > 0 && <ArrowRight size={12} className="flow-arrow" />}
            <button
              type="button"
              className={cx('flow-step', step.current && 'flow-current')}
              onClick={() => step.to && go(step.to)}
              disabled={!step.to}
            >
              {step.label}
            </button>
          </span>
        ))}
      </div>
      {next && (
        <div className="flow-next">
          <span className="flow-label">{nextLabel}</span>
          <button type="button" className="btn btn-primary" onClick={() => go(next.to)}>
            <span>{next.label}{next.sub && <small>{next.sub}</small>}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </footer>
  );
}

export function Stepper({ steps, active, onSelect }: { steps: string[]; active: number; onSelect?: (index: number) => void }) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => (
        <li key={step} className={cx(index < active && 'step-done', index === active && 'step-active')}>
          <button type="button" onClick={() => onSelect?.(index)}>
            <span className="step-dot">{index < active ? '✓' : index + 1}</span>
            <span className="step-label">{step}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function AiItem({ icon, tone = 'green', title, children, action }: {
  icon?: ReactNode;
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cx('ai-item', `ai-${tone}`)}>
      <span className="ai-item-icon">{icon ?? <Sparkles size={15} />}</span>
      <div className="ai-item-body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action && <div className="ai-item-action">{action}</div>}
    </div>
  );
}

export function ContextStrip({ items }: { items: { icon?: ReactNode; label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone }[] }) {
  return (
    <div className="context-strip">
      {items.map((item, index) => (
        <div key={index} className={cx('context-item', item.tone && `context-${item.tone}`)}>
          {item.icon && <span className="context-icon">{item.icon}</span>}
          <div>
            <span className="context-label">{item.label}</span>
            <strong>{item.value}</strong>
            {item.sub && <small>{item.sub}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Check({ status, children }: { status: 'done' | 'pending' | 'warn' | 'todo'; children: ReactNode }) {
  const symbol = status === 'done' ? '✓' : status === 'warn' ? '!' : status === 'pending' ? '◷' : '○';
  return <div className={cx('check', `check-${status}`)}><span>{symbol}</span><div>{children}</div></div>;
}

export function Grid({ cols, children, className, gap }: { cols: string; children: ReactNode; className?: string; gap?: number }) {
  return <div className={cx('grid', className)} style={{ gridTemplateColumns: cols, gap }}>{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}

export { cx };

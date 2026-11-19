import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, ChevronLeft, Sparkles } from 'lucide-react';
import { STATUS } from './chartTheme';
import { SCREENS, useNav, type ScreenId } from './nav';
import { NumberedTabs, PageHeader as SysPageHeader, StepsPortal } from './ui/system';
import { MetricTile, SectionTitle } from './ui/system';
import { DonutMetric, GroupedColumns, RankedBars } from './ui/viz';
import { fmtNum } from './chartTheme';

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

/** Counts up to the first number inside a value such as "₹6.40 Cr", "3.2 Lakh", "63%" or 1,240. */
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
  dark: 'var(--brand-700)',
  green: STATUS.ok,
  mid: 'var(--segment-growing)',
  light: 'var(--data-baseline)',
  pale: 'var(--line)',
  yellow: 'var(--accent-600)',
  amber: 'var(--accent-600)',
  red: STATUS.risk,
  grey: 'var(--data-baseline)',
  blue: STATUS.info,
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
      {to && !icon && !(typeof children === 'string' && /[←→‹›]/.test(children)) && <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />}
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
    : ` demo data. Upload dataset "${data.name}" in Data Sources to replace it.`;
  return (
    <button type="button" className={cx('data-badge', data.live ? 'data-live' : 'data-demo')} title={title} onClick={() => go('admin.1')}>
      {data.live ? 'Live' : 'Demo'}
    </button>
  );
}

export function Panel({ title, actions, className, children, subtitle, style }: {
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
  return (
    <section className={cx('cq-card', className)} style={style}>
      {(title || actions) && <SectionTitle n={title ? undefined : 0} title={title ?? ''} subtitle={subtitle} action={actions} />}
      {!title && !actions && subtitle && <p className="cq-card-sub">{subtitle}</p>}
      {children}
    </section>
  );
}

export function Kpi({ icon, label, value, sub, trend, badge }: {
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
  return <MetricTile icon={icon} label={label} value={<CountUp value={value} />} note={sub} trend={trend} extra={badge} />;
}

export function KpiRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('cq-kpis', className)}>{children}</div>;
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

/** Plain cell values: ROI/multiples as 2-decimal "×", other fractional numbers capped at 2 decimals. */
function fmtCell(key: string, v: unknown): ReactNode {
  if (typeof v === 'number') return /roi|multiple/i.test(key) ? `${v.toFixed(2)}×` : Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (typeof v === 'string' && /roi/i.test(key) && /^\d+(\.\d+)?×?$/.test(v)) return `${parseFloat(v).toFixed(2)}×`;
  return v as ReactNode;
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
                  {column.render ? column.render(row, index) : fmtCell(column.key, row[column.key])}
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

export function Donut({ segments, center, sub }: {
  segments: Segment[];
  center?: ReactNode;
  sub?: ReactNode;
  size?: number;
  thickness?: number;
  showPct?: boolean;
  legend?: boolean;
}) {
  return <DonutMetric items={segments.map((s) => ({ label: s.label, value: s.value }))} value={center ?? ''} label={typeof sub === 'string' ? sub : ''} insight />;
}

const FUNNEL_COLORS = ['var(--brand-700)', 'var(--ok)', 'var(--crop-soybean)', 'var(--segment-growing)', 'var(--accent-600)', 'var(--accent-600)', 'var(--data-baseline)'];

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

export function HBars({ rows, max, valueSuffix = '' }: {
  rows: { label: ReactNode; value: number; display?: ReactNode; tone?: Tone }[];
  max?: number;
  tone?: Tone;
  valueSuffix?: string;
}) {
  const items = rows.map((row, i) => ({ label: typeof row.label === 'string' ? row.label : `Item ${i + 1}`, value: row.value, display: typeof row.display === 'string' ? row.display : `${fmtNum(row.value)}${valueSuffix}`, muted: row.tone === 'grey' }));
  return <RankedBars items={items} max={max} share={!valueSuffix.includes('%') && max === undefined} insight />;
}

export function VBars({ data, series, height = 220, valueFormat }: {
  data: { label: ReactNode; values: number[]; labels?: ReactNode[] }[];
  series: { label: string; color: string }[];
  height?: number;
  max?: number;
  showValues?: boolean;
  valueFormat?: (value: number) => ReactNode;
}) {
  const rows = data.map((d, i) => ({ x: typeof d.label === 'string' ? d.label : `${i + 1}`, ...Object.fromEntries(d.values.map((v, j) => [`s${j}`, v])) }));
  const fmt = (v: number) => { const r = valueFormat?.(v); return typeof r === 'string' ? r : fmtNum(v); };
  return <GroupedColumns data={rows} x="x" series={series.map((s, j) => ({ key: `s${j}`, name: s.label }))} fmt={fmt} height={height} insight />;
}

export function Breadcrumbs(_props: { items: { label: string; to?: ScreenId }[] }) {
  return null;
}

export function PageHeader({ code, title, subtitle, badge, actions, back }: {
  code?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  back?: ScreenId;
}) {
  void code; void back;
  const { screen } = useNav();
  const meta = SCREENS.find((m) => m.id === screen);
  const group = meta ? SCREENS.filter((m) => m.module === meta.module) : [];
  return (
    <>
      <SysPageHeader title={title} subtitle={subtitle} />
      {group.length > 1 && <NumberedTabs tabs={group.map((m) => ({ label: m.title, to: m.id }))} active={screen} />}
      {badge}
      {actions && <StepsPortal>{actions}</StepsPortal>}
    </>
  );
}

export function SourceBar({ children, right, tone = 'green' }: { children: ReactNode; right?: ReactNode; tone?: 'green' | 'plain' }) {
  void children; void right; void tone;
  return null;
}

export function FlowFooter({ steps }: {
  label?: string;
  steps: { label: string; to?: ScreenId; current?: boolean }[];
  next?: { label: ReactNode; to: ScreenId; sub?: ReactNode };
  nextLabel?: string;
}) {
  const { goBack } = useNav();
  const currentIndex = steps.findIndex((step) => step.current);
  const fallback = currentIndex > 0 ? [...steps.slice(0, currentIndex)].reverse().find((step) => step.to)?.to : steps.find((step) => step.to)?.to;
  return (
    <StepsPortal>
      <button type="button" className="cq-btn" onClick={() => goBack(fallback)}>
        <ChevronLeft size={14} />Back
      </button>
    </StepsPortal>
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



import { useMemo, useState, type ReactNode } from 'react';
import { BarChart3, MapPin, Sparkles, Target, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Clock, Download, Info, Map as MapIcon, XCircle, type LucideIcon } from 'lucide-react';
import { IndiaDistrictMap, type AreaInfo, type MapMarker, type MapTone, type MapView } from '../map/IndiaDistrictMap';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { ICON } from '../icons';
import './ui.css';

const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ---------------------------------------------------------------- Skeleton / EmptyState */
export function Skeleton({ height = 120 }: { height?: number }) {
  return <div className="iq-skeleton" style={{ height }} aria-hidden="true" />;
}
export function EmptyState({ icon: Icon = Info, title = 'Nothing to show yet', hint }: { icon?: LucideIcon; title?: string; hint?: string }) {
  return <div className="iq-empty"><Icon size={22} strokeWidth={ICON.stroke} /><b>{title}</b>{hint && <span>{hint}</span>}</div>;
}

/* ---------------------------------------------------------------- StatusChip */
export type StatusKind = 'ok' | 'warn' | 'risk' | 'info' | 'pending';
const STATUS_ICON: Record<StatusKind, LucideIcon> = { ok: CheckCircle2, warn: AlertTriangle, risk: XCircle, info: Info, pending: Clock };
export function StatusChip({ kind = 'info', children }: { kind?: StatusKind; children: ReactNode }) {
  const Icon = STATUS_ICON[kind];
  return <span className={`iq-chip iq-chip-${kind}`}><Icon size={13} strokeWidth={ICON.stroke} />{children}</span>;
}

/* ---------------------------------------------------------------- ActionButton */
export function ActionButton({ label, onClick, icon: Icon = ArrowRight, kind = 'outline', disabled, iconLeft }: {
  label: string; onClick?: () => void; icon?: LucideIcon; kind?: 'primary' | 'outline' | 'quiet'; disabled?: boolean; iconLeft?: boolean;
}) {
  const icon = <Icon size={ICON.sm} strokeWidth={ICON.stroke} />;
  return <button type="button" className={`iq-btn iq-btn-${kind}`} onClick={onClick} disabled={disabled}>{iconLeft && icon}{label}{!iconLeft && icon}</button>;
}

/* ---------------------------------------------------------------- KpiCard */
export function KpiCard({ icon: Icon, label, value, note, change, changeLabel, spark, tone = 'green', onClick }: {
  icon: LucideIcon; label: string; value: ReactNode; note?: ReactNode; change?: number; changeLabel?: string; spark?: number[]; tone?: 'green' | 'amber' | 'red' | 'blue'; onClick?: () => void;
}) {
  const data = useMemo(() => (spark ?? []).map((v, i) => ({ i, v })), [spark]);
  const body = (
    <>
      <span className="iq-kpi-icon"><Icon size={ICON.lg} strokeWidth={ICON.stroke} /></span>
      <span className="iq-kpi-body">
        <small>{label}</small>
        <strong>{value}</strong>
        {note && <span className="iq-kpi-note">{note}</span>}
        {change !== undefined && <em className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%{changeLabel ? ` ${changeLabel}` : ''}</em>}
      </span>
      {data.length > 1 && <span className="iq-kpi-spark"><ResponsiveContainer width="100%" height={32}><LineChart data={data}><Line type="monotone" dataKey="v" stroke="currentColor" strokeWidth={1.75} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></span>}
    </>
  );
  return onClick
    ? <button type="button" className={cn('iq-kpi clickable', `iq-kpi-${tone}`)} onClick={onClick}>{body}</button>
    : <div className={cn('iq-kpi', `iq-kpi-${tone}`)}>{body}</div>;
}
export function KpiGrid({ children, cols = 5 }: { children: ReactNode; cols?: number }) {
  return <div className="iq-kpi-grid" style={{ ['--cols' as string]: cols }}>{children}</div>;
}

/* ---------------------------------------------------------------- PulseStrip */
export interface PulseItem { label: string; value: number; tone?: 'green' | 'amber' | 'red' }
export function PulseStrip({ title, items, ariaLabel }: { title: string; items: PulseItem[]; ariaLabel?: string }) {
  return (
    <section className="persona-pulse" aria-label={ariaLabel ?? title}>
      <div className="persona-pulse-chip">{title}</div>
      {items.map((it) => (
        <div key={it.label} className={cn('persona-pulse-row', it.tone === 'amber' && 'persona-pulse-amber', it.tone === 'red' && 'persona-pulse-red')}>
          <span>{it.label}</span><i style={{ width: `${Math.max(0, Math.min(100, it.value))}%` }} /><b>{it.value}%</b>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- ChartCard */
export function ChartCard({ icon: Icon, title, hint, children, loading, empty, actions, className, minHeight }: {
  icon?: LucideIcon; title: string; hint?: string; children?: ReactNode; loading?: boolean; empty?: boolean | string; actions?: ReactNode; className?: string; minHeight?: number;
}) {
  return (
    <section className={cn('iq-card', className)}>
      <header className="iq-card-head">
        <h3>{Icon && <Icon size={ICON.md} strokeWidth={ICON.stroke} />}{title}</h3>
        {actions}
      </header>
      {hint && <p className="iq-card-hint">{hint}</p>}
      <div className="iq-card-body" style={minHeight ? { minHeight } : undefined}>
        {loading ? <Skeleton /> : empty ? <EmptyState title={typeof empty === 'string' ? empty : undefined} /> : children}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- MapCard */
export function MapCard({ title = 'Where is it happening?', label, markers, states, talukas, view, focus, selected, scale, markerLegend, height = 320, crumbs, onCrumb, className }: {
  title?: string; label: string; markers: MapMarker[]; states?: Record<string, AreaInfo>; talukas?: Record<string, AreaInfo>; view?: MapView; focus?: MapView | null; selected?: string;
  scale?: { title: string; items: { label: string; tone: MapTone }[] }; markerLegend?: { label: string; color: string }[]; height?: number;
  crumbs?: string[]; onCrumb?: (index: number) => void; className?: string;
}) {
  return (
    <ChartCard icon={MapIcon} title={title} className={className}
      actions={crumbs && <nav className="iq-drill" aria-label="Map drill path">{crumbs.map((c, i) => <span key={c + i}>{i > 0 && <ChevronRight size={12} />}<button type="button" disabled={i === crumbs.length - 1} onClick={() => onCrumb?.(i)}>{c}</button></span>)}</nav>}>
      <IndiaDistrictMap label={label} markers={markers} states={states} talukas={talukas} view={view} focus={focus} selected={selected} scale={scale} markerLegend={markerLegend} height={height} />
    </ChartCard>
  );
}

/* ---------------------------------------------------------------- DataTable */
export interface Col<T> { key: keyof T & string; header: string; align?: 'l' | 'r'; pct?: boolean; status?: boolean; render?: (row: T) => ReactNode }
export function DataTable<T extends Record<string, string | number>>({ columns, rows, csvName, onRow, statusKind }: {
  columns: Col<T>[]; rows: T[]; csvName?: string; onRow?: (row: T, index: number) => void; statusKind?: (v: string) => StatusKind;
}) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const x = a[sort.k];
      const y = b[sort.k];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, sort]);
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [columns.map((c) => esc(c.header)).join(','), ...sorted.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${csvName ?? 'table'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="iq-table-wrap">
      {csvName && <div className="iq-table-tools"><ActionButton kind="quiet" icon={Download} iconLeft label="Download CSV" onClick={exportCsv} /></div>}
      <div className="iq-table-scroll">
        <table className="iq-table">
          <thead>
            <tr>{columns.map((c) => (
              <th key={c.key} className={c.align === 'r' ? 'r' : ''} onClick={() => setSort((s) => ({ k: c.key, dir: s?.k === c.key && s.dir === 1 ? -1 : 1 }))} aria-sort={sort?.k === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                {c.header}{sort?.k === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={ri} className={onRow ? 'clickable' : ''} onClick={onRow ? () => onRow(row, ri) : undefined}>
                {columns.map((c) => {
                  const v = row[c.key];
                  let cell: ReactNode = c.render ? c.render(row) : v;
                  if (!c.render && c.pct && typeof v === 'number') cell = <span className="iq-pctcell"><i style={{ width: `${Math.min(100, v)}%` }} /><b>{v}%</b></span>;
                  if (!c.render && c.status) cell = <StatusChip kind={statusKind ? statusKind(String(v)) : 'info'}>{v}</StatusChip>;
                  return <td key={c.key} className={c.align === 'r' || (typeof v === 'number' && c.align !== 'l') ? 'r' : ''}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- AlertList */
export interface AlertItem { text: string; kind?: StatusKind; action?: { label: string; onClick: () => void } }
export function AlertList({ items }: { items: AlertItem[] }) {
  if (!items.length) return <EmptyState icon={CheckCircle2} title="No alerts" />;
  return (
    <ul className="iq-alerts">
      {items.map((a) => (
        <li key={a.text}>
          <StatusChip kind={a.kind ?? 'warn'}>{a.kind === 'risk' ? 'Risk' : a.kind === 'ok' ? 'OK' : a.kind === 'info' ? 'Info' : 'Watch'}</StatusChip>
          <span>{a.text}</span>
          {a.action && <ActionButton kind="quiet" label={a.action.label} onClick={a.action.onClick} />}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- QuestionChips (copilots) */
const CHIP_ICONS = [BarChart3, MapPin, Target, Sparkles];
export function QuestionChips({ questions, onPick }: { questions: string[]; onPick: (q: string) => void }) {
  return (
    <ChartCard icon={Sparkles} title="Not sure what to ask? Try one of these">
      <div className="iq-chips">
        {questions.map((q, i) => {
          const Icon = CHIP_ICONS[i % CHIP_ICONS.length];
          return <button key={q} type="button" onClick={() => onPick(q)}><Icon size={ICON.sm} strokeWidth={ICON.stroke} />{q}</button>;
        })}
      </div>
    </ChartCard>
  );
}

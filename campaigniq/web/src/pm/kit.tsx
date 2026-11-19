import { useState, type ReactNode } from 'react';
import {  ArrowRight, Lock, Sparkles, X } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { Btn, cx, type Tone } from '../ui';
import {  type PulseItem } from '../ui/index';
import { PM_CHARTS, PM_DRAWER_CHARTS } from './charts';
import { StatusChip } from '../ui/index';
import type { CreativeKind } from './data';
import { PersonaHeader } from '../ui/system';
import { PM_SCREENS } from './nav';
import { MetricTile, SectionTitle, StepsPortal } from '../ui/system';
import { GroupedColumns } from '../ui/viz';

export function toneOf(text: string): Tone {
  const t = text.toLowerCase();
  if (/not verified|unresolved|disabled|returned|rejected|not established|missing|not sent|exception/.test(t)) return 'red';
  if (/approved|validated|verified|complete|endorsed|reconciled|aligned|active|selected|sent|resolved|published/.test(t)) return 'green';
  if (/pending|to confirm|to verify|awaiting|required|conditional|review|unvalidated|provisional|not yet|not available|not determinable|not submitted|not approved|indicative|incomplete|data pending/.test(t)) return 'amber';
  if (/draft|placeholder|read-only|forecast|assumed|n\/a/.test(t)) return 'grey';
  return 'grey';
}

export function Status({ children, tone }: { children: string; tone?: Tone; solid?: boolean }) {
  const resolved = tone ?? toneOf(children);
  const kind = resolved === 'green' ? 'ok' : resolved === 'amber' ? 'warn' : resolved === 'red' ? 'risk' : 'pending';
  return <StatusChip kind={kind}>{children}</StatusChip>;
}


export const PM_PULSE: PulseItem[] = [
  { label: 'Revenue readiness', value: 82 },
  { label: 'Intervention confidence', value: 68, tone: 'amber' },
  { label: 'Execution coverage', value: 76 },
];

export function PmPage({  code, title, status, subtitle, actions, children, className }: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pulse?: PulseItem[];
}) {
  return (
    <div className={cx('pm-page', 'persona-page persona-page-pm', className)}>
      <PersonaHeader list={PM_SCREENS} id={code} title={title} subtitle={subtitle} status={status} actions={actions} />
      {PM_CHARTS[code]}
      {children}
    </div>
  );
}

export function Source({ children, right }: { children: ReactNode; right?: ReactNode }) {
  void children; void right;
  return null;
}

function DrawerSummary({ title, status, back }: { title: string; status?: string; back: ScreenId }) {
  const kind = !status ? 'info' : /approved|complete|validated/i.test(status) ? 'ok' : /not|pending|draft/i.test(status) ? 'warn' : 'info';
  return (
    <section className="iq-drawer-summary" aria-label="Summary">
      <b>{title}</b>
      <div className="iq-chip-row">
        {status && <StatusChip kind={kind}>{status}</StatusChip>}
        <StatusChip kind="info">Returns to {back.toUpperCase()}</StatusChip>
      </div>
    </section>
  );
}

export function Drawer({ title, status, width = '45%', back, children, footer, subtitle }: {
  title: string;
  status?: string;
  width?: string;
  back: ScreenId;
  children: ReactNode;
  footer?: ReactNode;
  subtitle?: ReactNode;
}) {
  const { go } = useNav();
  return (
    <aside className="pm-drawer" style={{ width }} role="dialog" aria-label={title}>
      <header className="pm-drawer-head">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <div className="pm-drawer-head-right">
          {status && <Status>{status}</Status>}
          <button type="button" className="pm-close" aria-label="Close" onClick={() => go(back)}><X size={16} /></button>
        </div>
      </header>
      <div className="pm-drawer-body"><DrawerSummary title={title} status={status} back={back} />{PM_DRAWER_CHARTS[title]}{children}</div>
      {footer && <footer className="pm-drawer-foot">{footer}</footer>}
    </aside>
  );
}

export function Modal({ title, status, width = '65%', back, children, footer, subtitle }: {
  title: string;
  status?: string;
  width?: string;
  back: ScreenId;
  children: ReactNode;
  footer?: ReactNode;
  subtitle?: ReactNode;
}) {
  const { go } = useNav();
  return (
    <div className="pm-modal" style={{ width }} role="dialog" aria-label={title}>
      <header className="pm-drawer-head">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <div className="pm-drawer-head-right">
          {status && <Status>{status}</Status>}
          <button type="button" className="pm-close" aria-label="Close" onClick={() => go(back)}><X size={16} /></button>
        </div>
      </header>
      <div className="pm-drawer-body"><DrawerSummary title={title} status={status} back={back} />{PM_DRAWER_CHARTS[title]}{children}</div>
      {footer && <footer className="pm-drawer-foot">{footer}</footer>}
    </div>
  );
}

export type StepState = 'done' | 'active' | 'pending';

export function Workflow({ steps, title, compact }: { steps: { label: string; state?: StepState; sub?: string }[]; title?: string; compact?: boolean }) {
  return (
    <div className={cx('pm-workflow', compact && 'pm-workflow-compact')}>
      {title && <span className="pm-workflow-title">{title}</span>}
      <ol>
        {steps.map((step, index) => (
          <li key={`${step.label}-${index}`} className={cx(`wf-${step.state ?? 'pending'}`)}>
            {index > 0 && <ArrowRight size={12} className="wf-arrow" />}
            <span className="wf-dot">{step.state === 'done' ? '✓' : index + 1}</span>
            <span className="wf-label">{step.label}{step.sub && <small>{step.sub}</small>}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Table({ head, rows, total, highlight, onRow, align, compact, className }: {
  head: ReactNode[];
  rows: ReactNode[][];
  total?: ReactNode[];
  highlight?: number | ((index: number) => boolean);
  onRow?: (index: number) => void;
  align?: ('l' | 'r' | 'c')[];
  compact?: boolean;
  className?: string;
}) {
  const isHighlight = (index: number) => (typeof highlight === 'function' ? highlight(index) : highlight === index);
  const style = (column: number) => ({ textAlign: align?.[column] === 'r' ? 'right' as const : align?.[column] === 'c' ? 'center' as const : 'left' as const });
  return (
    <div className={cx('table-wrap', className)}>
      <table className={cx('dt pm-table', compact && 'dt-compact')}>
        <thead><tr>{head.map((cell, index) => <th key={index} style={style(index)}>{cell}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cx(isHighlight(rowIndex) && 'row-highlight', onRow && 'row-click')}
              onClick={onRow ? () => onRow(rowIndex) : undefined}
            >
              {row.map((cell, cellIndex) => <td key={cellIndex} style={style(cellIndex)}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
        {total && <tfoot><tr>{total.map((cell, index) => <td key={index} style={style(index)}>{cell}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

export function Facts({ rows, cols = 1 }: { rows: [ReactNode, ReactNode][]; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cx('pm-facts', cols > 1 && `pm-facts-${cols}`)}>
      {rows.map(([label, value], index) => (
        <div key={index} className="pm-fact"><span>{label}</span><b>{value}</b></div>
      ))}
    </div>
  );
}

export function Strip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'amber' | 'green' }[] }) {
  return <div className="cq-kpis">{items.map((item) => <MetricTile key={item.label} label={item.label} value={item.value} note={item.sub} />)}</div>;
}

export function Box({ title, children, tone, actions, className }: {
  title?: ReactNode;
  children: ReactNode;
  tone?: 'soft' | 'tint';
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <section className={cx('cq-card', tone && `cq-card-${tone}`, className)}>
      {(title || actions) && <SectionTitle n={title ? undefined : 0} title={title ?? ''} action={actions} />}
      <div className="pm-box-body">{children}</div>
    </section>
  );
}

export function AiBox({ title = 'AI Insight', items, children, className }: {
  title?: string;
  items?: { title?: ReactNode; text: ReactNode; tone?: Tone }[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Box className={cx('pm-ai', className)} title={<><Sparkles size={14} /> {title}</>}>
      {items && (
        <ul className="pm-ai-list">
          {items.map((item, index) => <li key={index} className={`pm-ai-${item.tone ?? 'grey'}`}><span className="pm-ai-row"><StatusChip kind={item.tone === 'red' ? 'risk' : item.tone === 'amber' ? 'warn' : item.tone === 'green' ? 'ok' : 'info'}>{item.tone === 'red' ? 'Risk' : item.tone === 'amber' ? 'Watch' : item.tone === 'green' ? 'On track' : 'Note'}</StatusChip>{item.title ? <b>{item.title}</b> : null}</span><span>{item.text}</span></li>)}
        </ul>
      )}
      {children}
    </Box>
  );
}

export function Sources({ items, label = 'Sources' }: { items: { label: string; to?: ScreenId; note?: string }[]; label?: string }) {
  void items; void label;
  return null;
}

export function Checklist({ items }: { items: { label: ReactNode; status: string; note?: ReactNode }[] }) {
  return (
    <div className="pm-checklist">
      {items.map((item, index) => (
        <div key={index} className="pm-check-item">
          <div className="pm-check-main"><span>{item.label}</span><Status>{item.status}</Status></div>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </div>
  );
}

export function Actions({ left, right }: { left?: ReactNode; right?: ReactNode; note?: ReactNode }) {
  return <StepsPortal>{left}{right}</StepsPortal>;
}

export function Cta({ to, children, locked, onClick, small, message }: { to?: ScreenId; children: ReactNode; locked?: string; onClick?: () => void; small?: boolean; message?: string }) {
  const { go, toast } = useNav();
  const click = () => {
    if (locked) {
      toast(locked);
      return;
    }
    if (message) toast(message);
    if (onClick) onClick();
    if (to) go(to);
  };
  return <Btn small={small} variant="primary" icon={<ArrowRight size={13} />} onClick={click}>{children}</Btn>;
}

export function Act({ children, message, to, small, icon }: { children: ReactNode; message?: string; to?: ScreenId; small?: boolean; icon?: ReactNode }) {
  const { go, toast } = useNav();
  return <Btn small={small} variant="outline" icon={icon} onClick={() => { if (message) toast(message); if (to) go(to); }}>{children}</Btn>;
}

export function Next(_props: { label: string; to: ScreenId; sub?: string }) {
  return null;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="pm-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Input({ value = '', placeholder, rows }: { value?: string; placeholder?: string; rows?: number }) {
  if (rows && rows > 1) return <textarea rows={rows} defaultValue={value} placeholder={placeholder} />;
  return <input defaultValue={value} placeholder={placeholder} />;
}

export function Select({ options, value }: { options: string[]; value?: string }) {
  return (
    <select defaultValue={value ?? options[0]}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

export function Radios({ options, value, onChange }: { options: { label: string; sub?: string; disabled?: boolean }[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="pm-radios">
      {options.map((option) => (
        <label key={option.label} className={cx(option.disabled && 'disabled')}>
          <input type="radio" name="pm-radio" checked={value === option.label} onChange={() => onChange(option.label)} disabled={option.disabled} />
          <span><b>{option.label}</b>{option.sub && <small>{option.sub}</small>}</span>
        </label>
      ))}
    </div>
  );
}

export function Chips({ items, active, onSelect }: { items: string[]; active?: string; onSelect?: (item: string) => void }) {
  return (
    <div className="pm-chips">
      {items.map((item) => (
        <button key={item} type="button" className={cx(active === item && 'active')} onClick={() => onSelect?.(item)}>{item}</button>
      ))}
    </div>
  );
}

export function Tabs({ items, active, onSelect }: { items: string[]; active: string; onSelect: (item: string) => void }) {
  return (
    <div className="tabs">
      {items.map((item) => <button key={item} type="button" className={cx(active === item && 'active')} onClick={() => onSelect(item)}>{item}</button>)}
    </div>
  );
}

export function Bars({ data, series, height = 200, format = (value: number) => String(value) }: {
  data: { label: string; values: number[] }[];
  series: { name?: string; label?: string; color: string }[];
  height?: number;
  format?: (value: number) => string;
}) {
  const rows = data.map((d) => ({ x: d.label, ...Object.fromEntries(d.values.map((v, j) => [`s${j}`, v])) }));
  return <GroupedColumns data={rows} x="x" series={series.map((s, j) => ({ key: `s${j}`, name: s.name ?? s.label ?? `Series ${j + 1}` }))} fmt={format} height={Math.max(height, 200)} insight />;
}

export function Meter({ value, max, label, tone = 'green' }: { value: number; max: number; label?: ReactNode; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
  return (
    <div className="pm-meter">
      <div className="pm-meter-track"><div className={`pm-meter-fill fill-${tone}`} style={{ width: `${pct}%` }} /></div>
      <span>{label ?? `${value} / ${max}`}</span>
    </div>
  );
}

function CreativeBody({ kind, marathi }: { kind: CreativeKind; marathi: boolean }) {
  if (kind === 'detailer' || kind === 'leaflet') {
    return (
      <>
        <div className="cr-band"><span className="cr-logo">Mahadhan</span><span className="cr-tag">Croptek</span></div>
        <div className="cr-hero">
          <div className="cr-onion"><i /><i /><i /></div>
          <div className="cr-text">
            <h4>{marathi ? 'उत्पादन वाढीसाठी स्मार्ट पोषण' : 'Smart nutrition for higher productivity'}</h4>
            <p>{marathi ? 'डेमो आणि मार्गदर्शन उपलब्ध' : 'Demo & advisory support available'}</p>
          </div>
        </div>
        <div className="cr-rows"><i style={{ width: '82%' }} /><i style={{ width: '64%' }} /><i style={{ width: '71%' }} /></div>
      </>
    );
  }
  if (kind === 'whatsapp') {
    return (
      <>
        <div className="cr-chat">
          <div className="cr-bubble">{marathi ? 'नमस्कार! कांद्याच्या पोषणाबद्दल माहिती…' : 'Namaskar! Onion nutrition information…'}</div>
          <div className="cr-bubble cr-bubble-out">{marathi ? 'अधिक माहिती' : 'Learn more'}</div>
        </div>
        <div className="cr-cols"><div><i /><i /><i /></div><div><i /><i /></div></div>
      </>
    );
  }
  return (
    <div className="cr-poster"><b>{marathi ? 'शेत प्रात्यक्षिक' : 'Field Demonstration'}</b><span>{marathi ? 'तारीख · ठिकाण' : 'Date · Venue'}</span></div>
  );
}

export function Creative({ kind, lang = 'English', size = 'md', selected, onClick, version, label, claimsPending = true }: {
  kind: CreativeKind;
  lang?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  version?: string;
  label?: string;
  claimsPending?: boolean;
}) {
  const marathi = lang === 'Marathi';
  return (
    <div className={cx('creative', `creative-${size}`, `creative-${kind}`, selected && 'selected', onClick && 'clickable')} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="creative-page"><CreativeBody kind={kind} marathi={marathi} /></div>
      {(label || version) && <div className="creative-meta">{label && <span>{label}</span>}{version && <small>{version}</small>}</div>}
      {claimsPending && <div className="cr-pending">{marathi ? 'दावे: पडताळणी प्रलंबित' : 'Claims: validation pending'}</div>}
    </div>
  );
}

export const P = ({ children = 'Pending' }: { children?: string }) => <Status>{children}</Status>;
export const Muted = ({ children }: { children: ReactNode }) => <span className="muted small">{children}</span>;
export const CLock = ({ text = 'Locked pending checks' }: { text?: string }) => <span className="pm-lock"><Lock size={12} />{text}</span>;

export function useOpen<T extends string>(initial: T | null = null) {
  const [open, setOpen] = useState<T | null>(initial);
  return {
    open,
    is: (id: T) => open === id,
    show: (id: T) => setOpen(id),
    close: () => setOpen(null),
  };
}












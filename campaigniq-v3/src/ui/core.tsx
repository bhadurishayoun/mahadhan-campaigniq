/** Shared building blocks. Every screen composes these; no screen-specific styling of these elements. */
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { KpiIcon, kpiIconFor, type KpiIconName } from './kpiIcons';

// ---------------------------------------------------------------- page frame
export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 && <ChevronRight size={13} />}
          {i === items.length - 1 ? <b>{it.label}</b> : <button type="button" onClick={it.onClick}>{it.label}</button>}
        </Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="title-row">
      <h1 className="page-title">{title}</h1>
      {right && <div className="right">{right}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- filters
export interface FilterDef { key: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }

export function Select({ value, options, onChange, label }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="select">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} />
    </div>
  );
}

export function FilterBar({ filters }: { filters: FilterDef[] }) {
  return (
    <div className="filters">
      {filters.map((f) => (
        <label key={f.key} className="field">
          <span>{f.label}</span>
          <Select label={f.label} value={f.value} options={f.options} onChange={f.onChange} />
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- KPI
/** KPI card per mockup: header (icon + label), then ONE value. Icon auto-picked from the label unless given. */
export function KpiCard({ label, value, icon }: { label: string; value: ReactNode; icon?: KpiIconName }) {
  return (
    <div className="kpi">
      <div className="kpi-head"><KpiIcon name={icon ?? kpiIconFor(label)} /><span className="kpi-label">{label}</span></div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------- card
export function Card({ title, icon: Icon, note, right, children, flush, className, style }: { title?: string; icon?: LucideIcon; note?: string; right?: ReactNode; children: ReactNode; flush?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <section className={`card${className ? ` ${className}` : ''}`} style={style}>
      {title && (
        <header className="card-head">
          <h3>{Icon && <Icon size={16} />}{title}{note && <small>{note}</small>}</h3>
          {right && <div className="right">{right}</div>}
        </header>
      )}
      <div className={`card-body${flush ? ' flush' : ''}`}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- status, progress
export type Tone = 'ok' | 'warn' | 'neutral' | 'risk' | 'info';
export function StatusChip({ tone, children, icon: Icon, wrap }: { tone: Tone; children: ReactNode; icon?: LucideIcon; wrap?: boolean }) {
  return <span className={`chip ${tone}${wrap ? ' wrap' : ''}`}>{Icon && <Icon size={12} />}{children}</span>;
}

export function Bar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'amber' }) {
  return <span className={`bar${tone === 'amber' ? ' amber' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

export function ProgressCell({ value, label, tone }: { value: number; label: string; tone?: 'brand' | 'amber' }) {
  return <span className="progress"><b>{label}</b><Bar value={value} tone={tone} /></span>;
}

/** Planned (brand) over observed (amber) mini bars. */
export function DualBar({ planned, observed }: { planned: number; observed: number }) {
  return <span className="dual"><Bar value={planned} /><Bar value={observed} tone="amber" /></span>;
}

// ---------------------------------------------------------------- segmented, stepper
export function SegmentedControl<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="row" style={{ gap: 12 }}>
      {label && <span className="seg-label">{label}</span>}
      <div className="seg" role="tablist">
        {options.map((o) => (
          <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function WorkflowStepper({ steps, current, label = 'Workflow' }: { steps: readonly string[]; current: number; label?: string }) {
  return (
    <div className="row" style={{ gap: 14 }}>
      <b className="strong">{label}</b>
      <div className="stepper">
        {steps.map((s, i) => (
          <Fragment key={s}>
            {i > 0 && <ArrowRight size={15} className="step-arrow" />}
            <span className={`step${i < current ? ' done' : i === current ? ' on' : ''}`}>
              {i < current ? <Check size={14} /> : <span className={`radio${i === current ? ' on' : ''}`} style={i === current ? { borderColor: 'var(--card)' } : undefined} />}
              {s}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** One stepper set, identical labels wherever it appears. */
export const STEPS = {
  themeReview: ['Proposal submitted', 'Business Head review', 'Decision', 'Marketing Head assignment', 'Campaign development'],
  themeSuggestion: ['Business Head draft', 'Marketing Head assessment', 'Refined theme', 'Business Head approval', 'Campaign development'],
  intervention: ['Intervention draft', 'Marketing Head assessment', 'Recovery plan', 'Business Head review', 'Action tracking'],
} as const;

// ---------------------------------------------------------------- buttons, footer
export function Button({ children, onClick, primary, disabled, icon: Icon, small, title }: { children: ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean; icon?: LucideIcon; small?: boolean; title?: string }) {
  return (
    <button type="button" title={title} className={`btn${primary ? ' primary' : ''}${small ? ' sm' : ''}`} onClick={onClick} disabled={disabled || !onClick}>
      {Icon && <Icon size={15} />}{children}
    </button>
  );
}

/** Page bottom bar: Back on the left, Next on the right — nothing else. */
export function FooterBar({ onBack, onNext }: { onBack: () => void; onNext?: () => void }) {
  return (
    <footer className="footer">
      <Button icon={ArrowLeft} onClick={onBack}>Back</Button>
      <span className="sp" />
      {onNext && <button type="button" className="btn primary" onClick={onNext}>Next<ArrowRight size={15} /></button>}
    </footer>
  );
}

/** Drawer / modal bottom bar: Back on the left, the panel's one action on the right. */
export function PanelFooter({ onBack, action }: { onBack: () => void; action?: ReactNode }) {
  return <><Button small icon={ArrowLeft} onClick={onBack}>Back</Button><span className="sp" />{action}</>;
}

export function Toasts({ items }: { items: { id: number; text: string }[] }) {
  if (!items.length) return null;
  return <div className="toasts" role="status">{items.map((t) => <div key={t.id} className="toast"><Check size={15} />{t.text}</div>)}</div>;
}

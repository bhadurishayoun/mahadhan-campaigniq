import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { cx, Pill, type Tone } from '../ui';
import { bhMeta, type BhScreenId } from './nav';

export function BhPage({ screen, children, subtitle, actions, className }: {
  screen: BhScreenId; children: ReactNode; subtitle?: string; actions?: ReactNode; className?: string;
}) {
  const { go } = useNav();
  const meta = bhMeta(screen);
  const parent: Record<string, { label: string; to?: ScreenId }> = {
    'bh.1': { label: 'National Command Centre' },
    'bh.2': { label: 'Campaign Portfolio Performance' },
    'bh.3': { label: 'Campaign Portfolio Performance', to: 'bh.2' },
    'bh.3a': { label: 'Campaign Portfolio Performance', to: 'bh.2' },
    'bh.4': { label: 'Campaign Portfolio Performance', to: 'bh.2' },
    'bh.5': { label: 'Marketing Investment & ROI' },
    'bh.5a': { label: 'Marketing Investment & ROI', to: 'bh.5' },
    'bh.5b': { label: 'Marketing Investment & ROI', to: 'bh.5' },
    'bh.5c': { label: 'Marketing Investment & ROI', to: 'bh.5' },
    'bh.6': { label: 'Strategic Themes & Approvals' },
    'bh.7': { label: 'Strategic Themes & Approvals' },
    'bh.7a': { label: 'Theme Approval Inbox', to: 'bh.7' },
    'bh.7b': { label: 'Theme Approval Inbox', to: 'bh.7' },
    'bh.8': { label: 'Strategic Themes & Approvals' },
    'bh.9': { label: 'Strategic Interventions' },
    'bh.9a': { label: 'Strategic Intervention Tracker', to: 'bh.9' },
    'bh.10': { label: 'Portfolio Learning' },
    'bh.ai1': { label: 'AI Copilot' },
  };
  const crumb = parent[screen];
  return (
    <div className={cx('bh-page', className)}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Home size={13} />
        <span className="crumb"><ChevronRight size={12} /><button type="button" onClick={() => go('bh.1')}>Business Head</button></span>
        {crumb && <span className="crumb"><ChevronRight size={12} />{crumb.to ? <button type="button" onClick={() => go(crumb.to!)}>{crumb.label}</button> : crumb.label}</span>}
        <span className="crumb crumb-current"><ChevronRight size={12} />{meta.code}</span>
      </nav>
      <header className="bh-page-head">
        <div><div className="bh-title-row"><span className="code-chip">{meta.code}</span><h1>{meta.title}</h1><Pill tone="amber">Illustrative data</Pill></div>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function BhCard({ title, children, className = '', action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`bh-card ${className}`}><div className="bh-card-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

export function BhMetric({ label, value, note, tone = 'green' }: { label: string; value: string; note?: string; tone?: Tone }) {
  return <div className={`bh-metric bh-metric-${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function BhBars({ title, items, max }: { title?: string; items: { label: string; value: number; note?: string; tone?: 'green' | 'amber' | 'muted' }[]; max?: number }) {
  const ceiling = max ?? Math.max(...items.map((x) => x.value), 1);
  return <div className="bh-bars">{title && <h3>{title}</h3>}{items.map((item) => <div className="bh-bar-row" key={item.label}><span>{item.label}</span><div className="bh-bar-track"><i className={`bh-bar-fill ${item.tone ?? 'green'}`} style={{ width: `${Math.max(2, Math.min(100, item.value / ceiling * 100))}%` }} /></div><b>{item.note ?? item.value}</b></div>)}</div>;
}

export function BhWorkflow({ steps, active = 0 }: { steps: string[]; active?: number }) {
  return <ol className="bh-workflow">{steps.map((step, index) => <li key={step} className={index < active ? 'done' : index === active ? 'active' : ''}><i>{index < active ? '✓' : index + 1}</i><span>{step}</span></li>)}</ol>;
}

export function BhAction({ children, onClick, kind = 'outline', disabled = false }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'outline' | 'quiet'; disabled?: boolean }) {
  return <button type="button" className={`bh-action ${kind}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

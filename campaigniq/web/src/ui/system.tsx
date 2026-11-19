/** Consistency system building blocks (CLAUDE.md §1–11). Every persona page is composed from these. */
import type { ReactNode } from 'react';
import { ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { useSideFilters, type Workspace } from './filters';
import './system.css';

const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
export const AS_OF = '19 Nov 2026';
export const COMPARATOR: Record<Workspace, string> = { bh: 'vs LY', mh: 'vs LY', pm: 'vs ABP', tm: 'vs plan', legacy: 'vs LY' };

/* ---------------------------------------------------------------- Page frame */
export function FilterChips({ chips }: { chips: string[] }) {
  return (
    <div className="cq-chips">
      {chips.map((c) => <span key={c} className="cq-chip">{c}</span>)}
      <span className="cq-chip cq-chip-demo">Illustrative data</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, chips }: { title: string; subtitle?: ReactNode; chips?: string[] }) {
  const side = useSideFilters();
  return (
    <header className="cq-page-header">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <FilterChips chips={chips ?? side.chips} />
    </header>
  );
}

export interface TabDef { label: string; to: ScreenId }
export function NumberedTabs({ tabs, active }: { tabs: TabDef[]; active: ScreenId }) {
  const { go } = useNav();
  return (
    <div className="cq-tabs" role="tablist">
      {tabs.map((t, i) => (
        <button key={t.to} type="button" role="tab" aria-selected={t.to === active} className={cn('cq-tab', t.to === active && 'active')} onClick={() => go(t.to)}>
          <i>{i + 1}</i>{t.label}
        </button>
      ))}
    </div>
  );
}

/** Whole page: PageHeader → NumberedTabs → body (20px 28px, gap 16). End the children with <NextSteps/>. */
export function Page({ title, subtitle, chips, tabs, active, children, className }: {
  title: string; subtitle?: ReactNode; chips?: string[]; tabs?: TabDef[]; active?: ScreenId; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn('cq-page', className)}>
      <PageHeader title={title} subtitle={subtitle} chips={chips} />
      {tabs && active && <NumberedTabs tabs={tabs} active={active} />}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Sections & cards */
export function SectionTitle({ n, title, context, subtitle, action }: { n?: number; title: string; context?: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="cq-section-title">
      <div>
        <h2>{n !== undefined && <b>{n}.</b>}<span>{title}</span>{context && <em> — {context}</em>}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="cq-section-action">{action}</div>}
    </div>
  );
}

export function InsightStrip({ children }: { children: ReactNode }) {
  return <p className="cq-insight"><Sparkles size={15} aria-hidden="true" /><span><b>Insight:</b> {children}</span></p>;
}

/** One card style everywhere. Pass n/title for a numbered section; `insight` closes chart cards with an InsightStrip. */
export function Card({ n, title, context, subtitle, action, insight, children, className, flush }: {
  n?: number; title?: string; context?: string; subtitle?: ReactNode; action?: ReactNode; insight?: ReactNode; children?: ReactNode; className?: string; flush?: boolean;
}) {
  return (
    <section className={cn('cq-card', flush && 'cq-card-flush', className)}>
      {title && <SectionTitle n={n} title={title} context={context} subtitle={subtitle} action={action} />}
      {children}
      {insight && <InsightStrip>{insight}</InsightStrip>}
    </section>
  );
}

export function Grid({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return <div className={cols === 3 ? 'cq-grid3' : 'cq-grid2'}>{children}</div>;
}

/* ---------------------------------------------------------------- Metrics */
export function Metric({ icon: Icon, label, value, unit, delta, comparator, note }: {
  icon: LucideIcon; label: string; value: ReactNode; unit?: string;
  /** e.g. { value: '18%', up: true }. `good` defaults to `up`. */
  delta?: { value: string; up: boolean; good?: boolean }; comparator?: string; note?: ReactNode;
}) {
  const good = delta ? delta.good ?? delta.up : true;
  return (
    <div className="cq-metric">
      <div className="cq-metric-head"><span className="cq-icon-tile"><Icon size={17} aria-hidden="true" /></span><small>{label}</small></div>
      <strong>{value}{unit && <span className="cq-unit">{unit}</span>}</strong>
      {delta
        ? <em className={good ? 'ok' : 'risk'}>{delta.up ? '▲' : '▼'} {delta.value}{comparator && <span> {comparator}</span>}</em>
        : note && <span className="cq-metric-note">{note}</span>}
    </div>
  );
}
export function KpiStrip({ children }: { children: ReactNode }) {
  return <div className="cq-kpis">{children}</div>;
}

/* ---------------------------------------------------------------- Actions */
export function ActionCard({ icon: Icon, title, detail, cta, to, onClick }: { icon: LucideIcon; title: string; detail: ReactNode; cta: string; to?: ScreenId; onClick?: () => void }) {
  const { go } = useNav();
  return (
    <button type="button" className="cq-action" onClick={() => (onClick ? onClick() : to && go(to))}>
      <span className="cq-icon-tile"><Icon size={17} aria-hidden="true" /></span>
      <b>{title}</b>
      <span>{detail}</span>
      <i>Open {cta} <ArrowRight size={13} aria-hidden="true" /></i>
    </button>
  );
}
export function ActionGrid({ children }: { children: ReactNode }) {
  return <div className="cq-actions">{children}</div>;
}

export interface StepAction { label: string; to?: ScreenId; onClick?: () => void }
/** Closing bar on every page + the data-source footer line. */
export function NextSteps({ actions = [], primary, asOf = AS_OF }: { actions?: StepAction[]; primary?: StepAction; asOf?: string }) {
  const { go } = useNav();
  const run = (a: StepAction) => () => (a.onClick ? a.onClick() : a.to && go(a.to));
  return (
    <>
      <nav className="cq-next" aria-label="Next steps">
        <span>Next steps</span>
        <div>
          {actions.slice(0, 3).map((a) => <button key={a.label} type="button" className="cq-btn" onClick={run(a)}>{a.label}</button>)}
          {primary && <button type="button" className="cq-btn cq-btn-primary" onClick={run(primary)}>{primary.label}<ArrowRight size={14} aria-hidden="true" /></button>}
        </div>
      </nav>
      <p className="cq-footer">Illustrative data for demonstration · Source: CampaignIQ synthetic dataset · as of {asOf}</p>
    </>
  );
}

/* ---------------------------------------------------------------- Status */
export type PillTone = 'ok' | 'warn' | 'neutral' | 'risk';
export function pillTone(text: string): PillTone {
  const t = text.toLowerCase();
  if (/risk|reject|overdue|fail|block|gap/.test(t)) return 'risk';
  if (/pending|review|clarif|not started|draft|watch|await/.test(t)) return /not started/.test(t) ? 'neutral' : 'warn';
  if (/approv|valid|verified|complete|on track|done|active|ready|live/.test(t)) return 'ok';
  return 'neutral';
}
export function StatusPill({ tone, children }: { tone?: PillTone; children: string }) {
  return <span className={`cq-pill cq-pill-${tone ?? pillTone(children)}`}>{children}</span>;
}

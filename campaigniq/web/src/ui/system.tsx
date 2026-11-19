/** Consistency system building blocks (CLAUDE.md §1–11). Every persona page is composed from these. */
import { Component, createContext, useContext, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';
import { Activity, BarChart3, CalendarCheck, CheckCircle2, Clock, IndianRupee, MapPin, Megaphone, Percent, Sprout, Store, Target, TrendingUp, Users } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { useSideFilters, type Workspace } from './filters';
import './system.css';

const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
export const COMPARATOR: Record<Workspace, string> = { bh: 'vs LY', mh: 'vs LY', pm: 'vs ABP', tm: 'vs plan', legacy: 'vs LY' };

/* ---------------------------------------------------------------- Page frame */
export function FilterChips({ chips }: { chips: string[] }) {
  return (
    <div className="cq-chips">
      {chips.map((c) => <span key={c} className="cq-chip">{c}</span>)}
    </div>
  );
}

export function PageHeader({ title, subtitle, chips, status, actions }: { title: ReactNode; subtitle?: ReactNode; chips?: string[]; status?: string; actions?: ReactNode }) {
  const side = useSideFilters();
  return (
    <header className="cq-page-header">
      <div><h1>{title}{status && <StatusPill>{status}</StatusPill>}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <FilterChips chips={chips ?? side.chips} />{actions}
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

/** Page content: PageHeader → NumberedTabs → sections. */
export function Page({ title, subtitle, chips, tabs, active, children, className }: {
  title: string; subtitle?: ReactNode; chips?: string[]; tabs?: TabDef[]; active?: ScreenId; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn('cq-frame', className)}>
      <PageHeader title={title} subtitle={subtitle} chips={chips} />
      {tabs && active && <NumberedTabs tabs={tabs} active={active} />}
      {children}
    </div>
  );
}

interface NavMeta { id: string; code: string; title: string; tab: string }
const sentence = (t: string) => t.replace(/\b([A-Z])([a-z]+)/g, (m, a, b, i) => (i === 0 ? m : a.toLowerCase() + b)).replace(/\bai\b/gi, 'AI');
/** Sub-screen tabs for a section: main screens of the same nav group (drill-ins like 3A map to their parent; wizard steps CW.* excluded). */
export function tabsFor(list: readonly NavMeta[], id: string): { tabs: TabDef[]; active: ScreenId } | null {
  const me = list.find((m) => m.id === id || m.code === id);
  if (!me) return null;
  const isMain = (m: NavMeta) => /^[A-Z]+\.(?:\d+|[A-Z]+\d+)$/.test(m.code) && !/^CW\./.test(m.code);
  const group = list.filter((m) => m.tab === me.tab && isMain(m));
  if (group.length < 2) return null;
  let active = me;
  if (!isMain(me)) { const i = list.indexOf(me); active = [...list.slice(0, i)].reverse().find((m) => m.tab === me.tab && isMain(m)) ?? group[0]; }
  return { tabs: group.map((m) => ({ label: sentence(m.title), to: m.id as ScreenId })), active: active.id as ScreenId };
}

/** Header used by every persona page wrapper: PageHeader + numbered tabs; header actions move to the NextSteps bar. */
export function PersonaHeader({ list, id, title, subtitle, status, actions, headerActions }: { list: readonly NavMeta[]; id: string; title: string; subtitle?: ReactNode; status?: string; actions?: ReactNode; headerActions?: ReactNode }) {
  const t = tabsFor(list, id);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} status={status} actions={headerActions} />
      {t && <NumberedTabs tabs={t.tabs} active={t.active} />}
      {actions && <StepsPortal>{actions}</StepsPortal>}
    </>
  );
}

/* ---------------------------------------------------------------- Sections & cards */
/** Numbered automatically (CSS counter per page, reading order); pass n={0} for an unnumbered title. */
export function SectionTitle({ n, title, context, subtitle, action }: { n?: number; title: ReactNode; context?: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="cq-section-title">
      <div>
        <h2>{n !== 0 && <b className="cq-num" aria-hidden="true" />}<span>{title}</span>{context && <em> — {context}</em>}</h2>
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
  n?: number; title?: ReactNode; context?: string; subtitle?: ReactNode; action?: ReactNode; insight?: ReactNode; children?: ReactNode; className?: string; flush?: boolean;
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
/** The App renders one NextSteps bar per page; footers anywhere in the page portal their buttons into it. */
export const StepsSlotContext = createContext<HTMLElement | null>(null);
export function StepsPortal({ children }: { children: ReactNode }) {
  const slot = useContext(StepsSlotContext);
  return slot ? createPortal(children, slot) : null;
}
/** Adds a back link, outline actions and one green "next" button to the page's bottom bar. */
export function NextSteps({ back, actions = [], primary }: { back?: StepAction; actions?: StepAction[]; primary?: StepAction }) {
  const { go } = useNav();
  const run = (a: StepAction) => () => (a.onClick ? a.onClick() : a.to && go(a.to));
  return (
    <StepsPortal>
      {back && <button type="button" className="cq-btn" data-step="back" onClick={run(back)}><ArrowLeft size={14} aria-hidden="true" />{back.label}</button>}
      {actions.slice(0, 3).map((a) => <button key={a.label} type="button" className="cq-btn" data-step="action" onClick={run(a)}>{a.label}</button>)}
      {primary && <button type="button" className="cq-btn cq-btn-primary" data-step="next" onClick={run(primary)}>{primary.label}<ArrowRight size={14} aria-hidden="true" /></button>}
    </StepsPortal>
  );
}

/** Role of a bar button: back (left edge), next (right edge) or action (spread between). */
const PRIMARY_CLASSES = '.cq-btn-primary, .btn-primary, .primary, .iq-btn-primary, .pm-btn-primary, .gold, .btn-gold, .btn-dark, [data-primary]';
export function stepRole(el: Element): 'back' | 'action' | 'next' {
  const label = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (/^(←\s*)?back\b/i.test(label) || el.querySelector('.lucide-arrow-left, .lucide-chevron-left')) return 'back';
  if (el.matches(PRIMARY_CLASSES) || /^(next|continue|proceed|submit|send|approve|confirm)\b/i.test(label)) return 'next';
  return 'action';
}
/** Tags every untagged button in the bar; keeps a single "next" (the last one) so only one sits on the right edge. */
function tagSteps(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLElement>('.cq-next-slot :is(button, a)')];
  for (const b of buttons) if (!b.dataset.step || b.dataset.auto) { b.dataset.step = stepRole(b); b.dataset.auto = '1'; }
  const nexts = buttons.filter((b) => b.dataset.step === 'next' && getComputedStyle(b).display !== 'none');
  nexts.slice(0, -1).forEach((b) => { b.dataset.step = 'action'; });
}

/** Rendered once by the App at the end of every route: Back on the left edge, next on the right, actions evenly between. */
export function NextStepsBar({ onSlot, onBack }: { onSlot: (el: HTMLDivElement | null) => void; onBack: () => void }) {
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = bar.current;
    if (!root) return;
    tagSteps(root);
    const observer = new MutationObserver(() => tagSteps(root));
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return (
    <nav ref={bar} className="cq-next" aria-label="Page navigation">
      <div className="cq-next-btns">
        <button type="button" className="cq-btn cq-back-default" data-step="back" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" />Back</button>
        <div className="cq-next-slot" ref={onSlot} />
      </div>
    </nav>
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

/* ---------------------------------------------------------------- Legacy bridges (used by persona kits) */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/₹|rupee|budget|spend|invest|revenue|sales|cost|value|liquidation|abp|business/i, IndianRupee],
  [/adopt|farmer|reach|audience|people|participant/i, Users],
  [/dealer|retailer|outlet|store|channel/i, Store],
  [/village|territor|district|region|geograph|market|state/i, MapPin],
  [/campaign|theme|concept|collateral/i, Megaphone],
  [/crop|acre|product|sku/i, Sprout],
  [/roi|growth|uplift|trend|lift/i, TrendingUp],
  [/target|goal|attain/i, Target],
  [/%|rate|share|conversion|achiev/i, Percent],
  [/day|time|week|due|overdue|pending|await/i, Clock],
  [/approv|complete|done|validated|closed/i, CheckCircle2],
  [/activit|event|demo|meeting|plan/i, CalendarCheck],
  [/score|index|count|total/i, BarChart3],
];
/** Icon for a KPI from its label (keeps every metric tile consistent when a screen supplies none). */
export function iconFor(label: unknown): LucideIcon {
  const t = typeof label === 'string' ? label : '';
  return ICON_RULES.find(([re]) => re.test(t))?.[1] ?? Activity;
}
const textOf = (n: ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(textOf).join('') : '');

/** Metric tile for legacy KPI components: same markup as <Metric/> but accepts ReactNode labels/icons. */
export function MetricTile({ icon, label, value, note, trend, extra }: { icon?: ReactNode; label: ReactNode; value: ReactNode; note?: ReactNode; trend?: 'up' | 'down'; extra?: ReactNode }) {
  const Icon = iconFor(textOf(label));
  return (
    <div className="cq-metric">
      <div className="cq-metric-head"><span className="cq-icon-tile">{icon ?? <Icon size={17} aria-hidden="true" />}</span><small>{label}</small></div>
      <strong>{value}{extra}</strong>
      {note && (trend ? <em className={trend === 'up' ? 'ok' : 'risk'}>{trend === 'up' ? '▲' : '▼'} {note}</em> : <span className="cq-metric-note">{note}</span>)}
    </div>
  );
}

/* ---------------------------------------------------------------- Screen error boundary */
/** Keeps one failing screen from blanking the whole app; the frame, sidebar and NextSteps stay usable. */
export class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen failed to render', error, info.componentStack?.slice(0, 200)); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="cq-card"><SectionTitle n={0} title="This view could not be loaded" subtitle="Its data is unavailable right now. Use the sidebar or Back to continue." /></section>;
  }
}

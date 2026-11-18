import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Home, Sparkles } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { Btn, cx, Pill, type Tone } from '../ui';

export function toneOf(text: string): Tone {
  const t = text.toLowerCase();
  // Order matters: "not yet verified" must read amber, not green.
  if (/not verified|unresolved|disabled|returned|rejected|missing|not sent|exception|at risk|blocker|inactive/.test(t)) return 'red';
  if (/pending|to confirm|to verify|awaiting|required|conditional|review|unvalidated|unverified|provisional|not yet|not submitted|not drafted|indicative|incomplete|proposed|uncommitted/.test(t)) return 'amber';
  if (/approved|validated|verified|complete|reconciled|aligned|active|selected|linked|resolved|done|on track|ready|assigned|submitted/.test(t)) return 'green';
  return 'grey';
}

export function Status({ children, tone, solid }: { children: string; tone?: Tone; solid?: boolean }) {
  return <Pill tone={tone ?? toneOf(children)} solid={solid}>{children}</Pill>;
}

export const lakh = (value: number, digits = 0) => `₹${value.toFixed(digits)} L`;
export const crore = (value: number, digits = 2) => `₹${value.toFixed(digits)} Cr`;
export const pct = (value: number, digits = 1) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;

/** Page shell: breadcrumb, title row and the content. No pulse strip or injected charts (the V2 specs exclude them). */
export function TmPage({ crumbs, code, title, status, subtitle, actions, children, className, banner }: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  banner?: ReactNode;
}) {
  const { go } = useNav();
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const expandRole = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        const original = textNode.textContent ?? '';
        const expanded = original.replace(/\bTM(?=\.|\s)/g, 'FSM');
        if (expanded !== original) textNode.textContent = expanded;
      }
    };
    expandRole();
    const observer = new MutationObserver(expandRole);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [code]);
  return (
    <div ref={pageRef} className={cx('pm-page', 'persona-page persona-page-tm tm-page', className)} data-screen={code}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Home size={13} />
        {crumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className={cx('crumb', index === crumbs.length - 1 && 'crumb-current')}>
            {index > 0 && <ChevronRight size={12} />}
            {item.to ? <button type="button" onClick={() => go(item.to!)}>{item.label}</button> : item.label}
          </span>
        ))}
      </nav>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title-row">
            <h1>{title}</h1>
            {status && <Status>{status}</Status>}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {banner}
      {children}
    </div>
  );
}

const PLAN_TABS: { label: string; to: ScreenId }[] = [
  { label: 'My Performance', to: 'tm.1' },
  { label: 'Territory Network', to: 'tm.2' },
  { label: 'Outlet Planning', to: 'tm.3' },
  { label: 'Crop & Product Plan', to: 'tm.4' },
  { label: 'Review & Approval', to: 'tm.5' },
];

/** The five horizontal My Plan subtabs (TM.1-TM.5). */
export function PlanTabs({ active }: { active: ScreenId }) {
  const { go } = useNav();
  return (
    <div className="tm-subtabs" role="tablist" aria-label="My Plan">
      {PLAN_TABS.map((tab) => (
        <button key={tab.to} type="button" role="tab" aria-selected={tab.to === active} className={cx(tab.to === active && 'active')} onClick={() => go(tab.to)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Numbered horizontal stepper (Campaign Wizard CW.1-CW.4, TM.C1 journey). */
export function Steps({ steps, active, onStep }: { steps: { label: string; to?: ScreenId }[]; active: number; onStep?: boolean }) {
  const { go } = useNav();
  return (
    <ol className="tm-steps" aria-label="Progress">
      {steps.map((step, index) => {
        const state = index < active ? 'done' : index === active ? 'active' : 'pending';
        const content = (
          <>
            <span className="tm-step-num">{state === 'done' ? <Check size={12} /> : index + 1}</span>
            <span>{step.label}</span>
          </>
        );
        return (
          <li key={step.label} className={`tm-step tm-step-${state}`} aria-current={state === 'active' ? 'step' : undefined}>
            {onStep && step.to && state !== 'active' ? <button type="button" onClick={() => go(step.to!)}>{content}</button> : <div>{content}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export const WIZARD: { label: string; to: ScreenId }[] = [
  { label: 'Objective & Targeting', to: 'cw.1' },
  { label: 'Activity & Budget Mix', to: 'cw.2' },
  { label: 'Scenario & Expected Outcomes', to: 'cw.3' },
  { label: 'Review & Submit', to: 'cw.4' },
];

/** Compact context strip: label / value pairs in one row. */
export function Context({ items, tone }: { items: { label: string; value: ReactNode; sub?: ReactNode }[]; tone?: 'green' | 'cream' }) {
  return (
    <div className={cx('tm-context', tone && `tm-context-${tone}`)}>
      {items.map((item) => (
        <div key={item.label} className="tm-context-item">
          <span>{item.label}</span>
          <b>{item.value}</b>
          {item.sub && <small>{item.sub}</small>}
        </div>
      ))}
    </div>
  );
}

/** Big headline metric cards (TM.1, TM.EX1, TM.IM1). */
export function Metrics({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'amber' | 'green' | 'red' }[] }) {
  return (
    <div className="tm-metrics">
      {items.map((item) => (
        <article key={item.label} className={cx('tm-metric', item.tone && `tm-metric-${item.tone}`)}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.sub && <small>{item.sub}</small>}
        </article>
      ))}
    </div>
  );
}

export function Panel({ title, icon, actions, children, className, tone }: {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'ai' | 'warn' | 'soft' | 'green';
}) {
  return (
    <section className={cx('tm-panel', tone && `tm-panel-${tone}`, className)}>
      {(title || actions) && (
        <header className="tm-panel-head">
          {title && <h3>{icon}{title}</h3>}
          {actions && <div className="tm-panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function AiPanel({ title = 'AI Insight', children }: { title?: string; children: ReactNode }) {
  return <Panel tone="ai" title={title} icon={<Sparkles size={14} />}>{children}</Panel>;
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  return <p className={`tm-note tm-note-${tone}`}>{children}</p>;
}

/** Bottom bar for backwards navigation and the current screen action. */
export function Footer({ back, primary, secondary }: {
  back?: { label: string; to: ScreenId };
  primary?: { label: string; to?: ScreenId; onClick?: () => void; disabled?: boolean };
  secondary?: ReactNode;
}) {
  const { goBack } = useNav();
  return (
    <footer className="tm-footer">
      <div className="tm-footer-bar">
        {back ? <Btn to={back.to} icon={<ArrowLeft size={13} />}>{back.label}</Btn> : <button type="button" className="btn btn-outline" onClick={() => goBack('tm.1')}><ArrowLeft size={13} />Back</button>}
        <div className="tm-footer-right">
          {secondary}
          {primary && (
            <Btn variant="primary" to={primary.disabled ? undefined : primary.to} onClick={primary.disabled ? undefined : primary.onClick} disabled={primary.disabled} icon={<ArrowRight size={13} />}>
              {primary.label}
            </Btn>
          )}
        </div>
      </div>
    </footer>
  );
}

/** Horizontal percentage bars (conversion comparisons, budget mix). */
export function HBars({ rows, max = 100, unit = '%', digits = 1 }: { rows: { label: string; value: number; tone?: 'green' | 'amber' | 'grey' | 'blue'; note?: string }[]; max?: number; unit?: string; digits?: number }) {
  return (
    <div className="tm-hbars">
      {rows.map((row) => (
        <div key={row.label} className="tm-hbar">
          <span className="tm-hbar-label">{row.label}</span>
          <div className="tm-hbar-track"><i className={`tm-fill-${row.tone ?? 'green'}`} style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }} /></div>
          <b>{row.value.toFixed(digits)}{unit}</b>
          {row.note && <small>{row.note}</small>}
        </div>
      ))}
    </div>
  );
}

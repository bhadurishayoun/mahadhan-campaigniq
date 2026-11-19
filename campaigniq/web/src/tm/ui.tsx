import { useEffect, useRef, type ReactNode } from 'react';
import {  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import {  cx, type Tone } from '../ui';
import {  StatusChip } from '../ui/kit';
import { PersonaHeader } from '../ui/system';
import { TM_SCREENS } from './nav';
import { MetricTile, SectionTitle, StepsPortal } from '../ui/system';
import { RankedBars } from '../ui/viz';
import { EXECUTION_CAMPAIGNS } from './data';
import { setExecutionCampaign, useExecutionCampaign } from './state';
import { useSideFilters } from '../ui/filters';

export function CampaignSwitcher() {
  const selected = useExecutionCampaign();
  const side = useSideFilters();
  const options = EXECUTION_CAMPAIGNS;
  const id = options.some((campaign) => campaign.id === selected) ? selected : options[0].id;
  useEffect(() => { if (id !== selected) setExecutionCampaign(id); }, [id, selected]);
  useEffect(() => { if (side.values.campaign !== id) side.set('campaign', id); }, [id, side.values.campaign]);
  useEffect(() => { if (side.values.campaign && side.values.campaign !== 'All Campaigns' && side.values.campaign !== selected && options.some((campaign) => campaign.id === side.values.campaign)) setExecutionCampaign(side.values.campaign); }, [side.values.campaign, selected]);
  const index = Math.max(0, options.findIndex((campaign) => campaign.id === id));
  const choose = (next: string) => { setExecutionCampaign(next); side.set('campaign', next); };
  return <div className="cq-filterbar" aria-label="Campaign selector">
    <button type="button" className="cq-btn" aria-label="Previous campaign" onClick={() => choose(options[(index - 1 + options.length) % options.length].id)}><ChevronLeft size={14} /></button>
    <select aria-label="Campaign" value={id} onChange={(event) => choose(event.target.value)}>
      {(['Live', 'Completed'] as const).map((stage) => <optgroup key={stage} label={stage}>{options.filter((campaign) => campaign.stage === stage).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.crop} · {campaign.stage}</option>)}</optgroup>)}
    </select>
    <button type="button" className="cq-btn" aria-label="Next campaign" onClick={() => choose(options[(index + 1) % options.length].id)}><ChevronRight size={14} /></button>
    <span>{index + 1} of {options.length}</span>
  </div>;
}

export function toneOf(text: string): Tone {
  const t = text.toLowerCase();
  // Order matters: "not yet verified" must read amber, not green.
  if (/not verified|unresolved|disabled|returned|rejected|missing|not sent|exception|at risk|blocker|inactive/.test(t)) return 'red';
  if (/pending|to confirm|to verify|awaiting|required|conditional|review|unvalidated|unverified|provisional|not yet|not submitted|not drafted|indicative|incomplete|proposed|uncommitted/.test(t)) return 'amber';
  if (/approved|validated|verified|complete|reconciled|aligned|active|selected|linked|resolved|done|on track|ready|assigned|submitted/.test(t)) return 'green';
  return 'grey';
}

export function Status({ children, tone }: { children: string; tone?: Tone; solid?: boolean }) {
  const resolved = tone ?? toneOf(children);
  const kind = resolved === 'green' ? 'ok' : resolved === 'amber' ? 'warn' : resolved === 'red' ? 'risk' : 'pending';
  return <StatusChip kind={kind}>{children}</StatusChip>;
}

export const lakh = (value: number, _digits = 2) => `₹${value.toFixed(2)} L`;
export const crore = (value: number, _digits = 2) => `₹${value.toFixed(2)} Cr`;
export const pct = (value: number, digits = 1) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;

/** Page shell: breadcrumb, title row and the content. No pulse strip or injected charts (the V2 specs exclude them). */
export function TmPage({  code, title, status, subtitle, actions, headerActions, children, className, banner }: {
  crumbs?: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  banner?: ReactNode;
}) {
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
      <PersonaHeader list={TM_SCREENS} id={code} title={title} subtitle={subtitle} status={status} actions={actions} headerActions={headerActions} />
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
  return <div className="cq-kpis">{items.map((item) => <MetricTile key={item.label} label={item.label} value={item.value} note={item.sub} />)}</div>;
}

export function Panel({ title, actions, children, className, tone }: {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'ai' | 'warn' | 'soft' | 'green';
}) {
  return (
    <section className={cx('cq-card', tone === 'ai' && 'cq-ai', className)}>
      {(title || actions) && <SectionTitle n={title ? undefined : 0} title={title ?? ''} action={actions} />}
      {children}
    </section>
  );
}

export function AiPanel({ title = 'AI insight', children }: { title?: string; children: ReactNode }) {
  return <section className="cq-card cq-ai"><SectionTitle title={title} /><div className="cq-ai-body"><Sparkles size={15} aria-hidden="true" /><div>{children}</div></div></section>;
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
  const { go, goBack } = useNav();
  return (
    <StepsPortal>
      <button type="button" className="cq-btn" data-step="back" onClick={() => (back ? go(back.to) : goBack('tm.1'))}><ArrowLeft size={13} />{back ? back.label : 'Back'}</button>
      {secondary}
      {primary && (
        <button type="button" className="cq-btn cq-btn-primary" data-step="next" disabled={primary.disabled} onClick={() => { if (primary.disabled) return; primary.onClick?.(); if (primary.to) go(primary.to); }}>
          {primary.label}<ArrowRight size={13} />
        </button>
      )}
    </StepsPortal>
  );
}

/** Horizontal percentage bars (conversion comparisons, budget mix). */
export function HBars({ rows, max = 100, unit = '%', digits = 1 }: { rows: { label: string; value: number; tone?: 'green' | 'amber' | 'grey' | 'blue'; note?: string }[]; max?: number; unit?: string; digits?: number }) {
  return <RankedBars items={rows.map((r) => ({ label: r.label, value: r.value, note: r.note, muted: r.tone === 'grey', display: `${r.value.toFixed(Math.min(digits, 2))}${unit}` }))} max={max} share={false} insight />;
}

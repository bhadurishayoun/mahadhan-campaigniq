import type { ReactNode } from 'react';
import { cx, type Tone } from '../ui';
import { BH_SCREENS, bhMeta, type BhScreenId } from './nav';
import { PersonaHeader } from '../ui/system';
import { KpiCard } from '../ui/index';
import { CheckCircle2, ClipboardCheck, Clock, IndianRupee, ListChecks, Megaphone, Target, Users, Wallet } from '../icons';
import { FileText, MessageSquare } from 'lucide-react';
import { RankedBarChart } from '../ui/charts';
import { SectionTitle } from '../ui/system';

export function BhPage({ screen, children, subtitle, actions, className }: {
  screen: BhScreenId; children: ReactNode; subtitle?: string; actions?: ReactNode; className?: string;
}) {
  const meta = bhMeta(screen);
  return (
    <div className={cx('bh-page', className)}>
      <PersonaHeader list={BH_SCREENS} id={screen} title={meta.title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  );
}

export function BhCard({ title, children, className = '', action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`cq-card ${className}`}><SectionTitle title={title} action={action} />{children}</section>;
}

const metricIcon = (label: string) => (/clarification|response/i.test(label) ? MessageSquare : /draft/i.test(label) ? FileText : /closed|completed/i.test(label) ? CheckCircle2 : /awaiting decision/i.test(label) ? Clock : /action/i.test(label) ? ListChecks : /review/i.test(label) ? ClipboardCheck : /invest|budget|spend|unspent/i.test(label) ? Wallet : /achiev|abp|business|sales|roi/i.test(label) ? IndianRupee : /adopt|farmer/i.test(label) ? Users : /campaign/i.test(label) ? Megaphone : /execut|plan/i.test(label) ? Target : ClipboardCheck);

export function BhMetric({ label, value, note, tone = 'green' }: { label: string; value: string; note?: string; tone?: Tone }) {
  return <KpiCard icon={metricIcon(label)} label={label} value={value} note={note} tone={tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : tone === 'blue' ? 'blue' : 'green'} />;
}

export function BhBars({ title, items, max }: { title?: string; items: { label: string; value: number; note?: string; tone?: 'green' | 'amber' | 'muted' }[]; max?: number }) {
  return <div className="bh-bars">{title && <h3>{title}</h3>}<RankedBarChart items={items} format={(v)=>max?`${v}`:v.toLocaleString()}/></div>;
}

export function BhWorkflow({ steps, active = 0 }: { steps: string[]; active?: number }) {
  return <ol className="bh-workflow">{steps.map((step, index) => <li key={step} className={index < active ? 'done' : index === active ? 'active' : ''}><i>{index < active ? '✓' : index + 1}</i><span>{step}</span></li>)}</ol>;
}

export function BhAction({ children, onClick, kind = 'outline', disabled = false }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'outline' | 'quiet'; disabled?: boolean }) {
  return <button type="button" className={`bh-action ${kind}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

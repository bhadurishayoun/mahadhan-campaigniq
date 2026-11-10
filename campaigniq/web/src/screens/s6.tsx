import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, BarChart3, Calendar, CalendarDays, Camera, Check, CheckCircle2, ClipboardCheck, Download, FileText,
  Filter, LayoutGrid, Link2, List, ListChecks, MapPin, MessageSquare, Package, Plus, RotateCcw, Shuffle, Smartphone,
  Sparkles, Sprout, Store, Target, Truck, UserCheck, UserPlus, Users, Workflow, X, ArrowUpCircle, Eye,
} from 'lucide-react';
import { useNav } from '../nav';
import { useDataset } from '../data/datasets';
import {
  AiItem, Breadcrumbs, Btn, Check as CheckRow, DataTable, FlowFooter, Grid, Kpi, KpiRow, PageHeader, Panel, Pill,
  Progress, SourceBar, cx, type Tone,
} from '../ui';
import './s6.css';

const VERSION_BADGE = <Pill tone="grey">Product- detailer version 1</Pill>;

const STATUS_TONE: Record<string, Tone> = {
  'On Track': 'green',
  Delayed: 'red',
  Ahead: 'lime',
  'At Risk': 'amber',
  Pending: 'amber',
  Planned: 'grey',
  Replanned: 'blue',
  Confirmed: 'green',
  'In Transit': 'blue',
  'Pending Approval': 'amber',
  'Pending Retailer Receipt': 'amber',
  High: 'red',
  Medium: 'amber',
  Low: 'green',
};

const StatusPill = ({ s }: { s: string }) => <Pill tone={STATUS_TONE[s] ?? 'grey'}>{s}</Pill>;

/* ------------------------------------------------------------------ */
/* S6.1 Unified Campaign Execution Control Tower                       */
/* ------------------------------------------------------------------ */

type Seg = { from: number; to: number; kind: 'plan' | 'actual' | 'revised' | 'risk' };
type Annot = { at: number; text: string; tone: 'red' | 'amber' | 'link' };
type CalActivity = {
  id: string;
  name: string;
  icon: ReactNode;
  status: string;
  progress: number;
  segs: Seg[];
  done?: number;
  annot?: Annot[];
};

const WEEKS = ['1-7 Dec', '8-14 Dec', '15-21 Dec', '22-31 Dec', '1-7 Jan', '8-14 Jan', '15-21 Jan', '22-31 Jan', '1-7 Feb', '8-14 Feb', '15-21 Feb', '22-28 Feb', '1-7 Mar', '8-14 Mar', '15-21 Mar', '22-31 Mar'];
const STAGES = [
  { label: 'Vegetative', sub: "(Dec '26)" },
  { label: 'Bulb Development', sub: "(Jan '27)" },
  { label: 'Bulb Enlargement', sub: "(Feb '27)" },
  { label: 'Maturity', sub: "(Mar '27)" },
];
const TODAY_WEEK = 7.5;
const wk = (w: number) => `${(w / WEEKS.length) * 100}%`;

const INITIAL_ACTIVITIES: CalActivity[] = [
  { id: 'retail', name: 'Retailer Activation', icon: <Store size={14} />, status: 'On Track', progress: 62, segs: [{ from: 0.2, to: 6.9, kind: 'actual' }], done: 6.9, annot: [{ at: 8.7, text: 'View Activity → S6.2 Activity Execution & Action Workspace', tone: 'link' }] },
  { id: 'demo', name: 'Demonstration Plots', icon: <Sprout size={14} />, status: 'Delayed', progress: 40, segs: [{ from: 1.2, to: 4.6, kind: 'actual' }, { from: 4.6, to: 6.6, kind: 'plan' }, { from: 6.6, to: 8.6, kind: 'risk' }], annot: [{ at: 8.9, text: '▲ Delayed – Stock not yet arrived (Dhanora)', tone: 'red' }] },
  { id: 'meet', name: 'Farmer Meetings', icon: <Users size={14} />, status: 'On Track', progress: 58, segs: [{ from: 2.0, to: 6.6, kind: 'actual' }], done: 6.6 },
  { id: 'digital', name: 'Digital Advisory', icon: <Smartphone size={14} />, status: 'Ahead', progress: 78, segs: [{ from: 2.1, to: 9.4, kind: 'actual' }], done: 9.4 },
  { id: 'follow', name: 'Field Follow-ups', icon: <MapPin size={14} />, status: 'At Risk', progress: 36, segs: [{ from: 2.4, to: 7.5, kind: 'actual' }, { from: 7.5, to: 10.0, kind: 'revised' }], annot: [{ at: 10.3, text: '▲ At risk – Weather window (rain) in early Feb', tone: 'amber' }] },
  { id: 'stock', name: 'Stock Arrival / Allocation', icon: <Package size={14} />, status: 'Pending', progress: 48, segs: [{ from: 2.1, to: 4.5, kind: 'actual' }, { from: 4.5, to: 9.8, kind: 'revised' }], annot: [{ at: 10.3, text: '▲ Pending – Transfer to Dhanora & Pimpalgaon', tone: 'red' }] },
  { id: 'conv', name: 'Conversion Follow-up', icon: <Target size={14} />, status: 'Planned', progress: 0, segs: [{ from: 8.4, to: 15.6, kind: 'plan' }] },
];

type PlanRow = { type: string; planned: number; completed: number; progress: number; status: string };
const PLAN_ROWS: PlanRow[] = [
  { type: 'Retailer Activations', planned: 74, completed: 46, progress: 62, status: 'On Track' },
  { type: 'Demo Plots', planned: 38, completed: 15, progress: 40, status: 'Delayed' },
  { type: 'Farmer Meetings', planned: 28, completed: 16, progress: 58, status: 'On Track' },
  { type: 'Digital Advisories', planned: 43, completed: 34, progress: 78, status: 'Ahead' },
  { type: 'Field Follow-ups', planned: 26, completed: 9, progress: 36, status: 'At Risk' },
];

type OwnerRow = { owner: string; role: string; cluster: string; task: string; load: string; status: string };
const OWNER_ROWS: OwnerRow[] = [
  { owner: 'S. Patil', role: 'Sr. Field Owner', cluster: 'Wadi Gaon', task: 'Retailer visits (8)', load: '7 / 10', status: 'On Track' },
  { owner: 'R. Jadhav', role: 'Field Owner', cluster: 'Dhanora', task: 'Demo (revised) + farmer meet', load: '9 / 12', status: 'At Risk' },
  { owner: 'M. Deshmukh', role: 'Field Owner', cluster: 'Ambad HQ', task: 'Advance retailer activation (6)', load: '6 / 10', status: 'On Track' },
  { owner: 'P. Koli', role: 'Field Owner', cluster: 'Pimpalgaon', task: 'Stock receipt follow-up + demo', load: '10 / 12', status: 'Delayed' },
  { owner: 'V. Shinde', role: 'Field Owner', cluster: 'Other Villages', task: 'Farmer meetings (4)', load: '5 / 10', status: 'On Track' },
];

type SupplyRow = { action: string; qty: string; status: string; milestone: string };
const SUPPLY_ROWS: SupplyRow[] = [
  { action: 'Ambad HQ Reallocation', qty: '25.0', status: 'Confirmed', milestone: 'Dispatched (24 Jan)' },
  { action: 'Dhanora Transfer', qty: '30.0', status: 'In Transit', milestone: 'ETA: 24–25 Jan' },
  { action: 'Pimpalgaon Transfer', qty: '20.0', status: 'Pending Approval', milestone: 'Approve by 28 Jan' },
  { action: 'Other Villages Reallocation', qty: '15.0', status: 'Pending Retailer Receipt', milestone: 'Retailer receipt due ~27 Jan' },
];

type AlertRow = { n: number; alert: string; impact: string; priority: string };
const ALERT_ROWS: AlertRow[] = [
  { n: 1, alert: 'Weather risk – early Feb (light rain)', impact: '-10–15% field activity efficiency', priority: 'High' },
  { n: 2, alert: 'Delayed stock arrival – Dhanora', impact: 'Demo delayed by ~4 days; -12% turnout', priority: 'High' },
  { n: 3, alert: 'Low attendance risk – Pimpalgaon', impact: 'Farmer meeting reach may be -15%', priority: 'Medium' },
  { n: 4, alert: 'Crop-window slippage (Bulb Enlargement)', impact: 'Compressed execution window; +7 days risk', priority: 'Medium' },
];

const OWNERS = ['S. Patil (Field Owner)', 'R. Jadhav (Field Owner)', 'M. Deshmukh (Field Owner)', 'P. Koli (Field Owner)', 'V. Shinde (Field Owner)'];
const CLUSTERS = ['Wadi Gaon', 'Dhanora', 'Ambad HQ', 'Pimpalgaon', 'Other Villages'];
const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Gantt({ activities, selected, onSelect }: { activities: CalActivity[]; selected: string; onSelect: (id: string) => void }) {
  const { go } = useNav();
  const segClass = { plan: 's6-bar-plan', actual: 's6-bar-actual', revised: 's6-bar-revised', risk: 's6-bar-risk' } as const;
  return (
    <div className="s6-cal">
      <div className="s6-cal-grid s6-cal-head">
        <span>#</span>
        <span>Activity</span>
        <span>Status</span>
        <span>Progress</span>
        <div>
          <div className="s6-stage-row">{STAGES.map((s) => <span key={s.label}>{s.label}<small>{s.sub}</small></span>)}</div>
          <div className="s6-week-row">{WEEKS.map((w) => <span key={w}>{w}</span>)}</div>
        </div>
      </div>
      {activities.map((a, i) => (
        <div key={a.id} className={cx('s6-cal-grid', 's6-cal-row', selected === a.id && 'selected')} onClick={() => onSelect(a.id)} style={{ cursor: 'pointer' }}>
          <span className="muted">{i + 1}</span>
          <span className="s6-act-name"><span style={{ color: 'var(--green)', display: 'inline-flex' }}>{a.icon}</span>{a.name}</span>
          <span><StatusPill s={a.status} /></span>
          <span style={{ fontWeight: 700 }}>{a.progress}%</span>
          <div className="s6-track">
            {a.segs.map((s, k) => (
              <div
                key={k}
                className={cx('s6-bar', segClass[s.kind])}
                style={{ left: wk(s.from), width: wk(s.to - s.from), animationDelay: `${i * 70 + k * 40}ms` }}
                data-tip={`${a.name} · ${{ plan: 'Planned', actual: 'Actual progress', revised: 'Revised / replanned', risk: 'At risk / delayed' }[s.kind]} · ${WEEKS[Math.floor(s.from)] ?? ''} → ${WEEKS[Math.min(Math.ceil(s.to) - 1, WEEKS.length - 1)] ?? ''}`}
              />
            ))}
            {a.done !== undefined && <span className="s6-bar-done" style={{ left: wk(a.done) }}>✓</span>}
            {a.annot?.map((n) => (
              <span
                key={n.text}
                className={cx('s6-annot', n.tone)}
                style={{ ['--at' as string]: wk(n.at) }}
                onClick={n.tone === 'link' ? (e) => { e.stopPropagation(); go('s6.2'); } : undefined}
              >
                {n.text}
              </span>
            ))}
            <span className="s6-today" style={{ left: wk(TODAY_WEEK) }}>
              {i === 0 && <span className="s6-today-tag">Today 27 Jan</span>}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ControlTower() {
  const { toast } = useNav();
  const owners = useDataset('orchestration.owners', OWNER_ROWS);
  const [activities, setActivities] = useState<CalActivity[]>(INITIAL_ACTIVITIES);
  const [selectedAct, setSelectedAct] = useState('demo');
  const [riskOpen, setRiskOpen] = useState(true);
  const [replanOpen, setReplanOpen] = useState(true);
  const [flash, setFlash] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(2);
  const [actionsDone, setActionsDone] = useState<Record<string, boolean>>({});
  const defaultForm = { activity: 'demo', cluster: 'Dhanora', from: '2027-01-26', to: '2027-01-30', owner: OWNERS[0] };
  const [form, setForm] = useState(defaultForm);

  const openReplan = (activity?: string) => {
    setReplanOpen(true);
    if (activity) setForm((f) => ({ ...f, activity }));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  const applyReplan = () => {
    const act = activities.find((a) => a.id === form.activity);
    if (!act) return;
    const owner = form.owner.split(' (')[0];
    setActivities((list) => list.map((a) => {
      if (a.id !== form.activity) return a;
      const lastEnd = Math.max(...a.segs.map((s) => s.to));
      const segs: Seg[] = a.segs.map((s) => (s.kind === 'risk' ? { ...s, kind: 'revised' } : s));
      if (a.id !== 'demo') segs.push({ from: lastEnd, to: Math.min(lastEnd + 0.6, 16), kind: 'revised' });
      return {
        ...a,
        status: 'Replanned',
        segs,
        annot: [{ at: Math.min(lastEnd + 0.9, 10.5), text: `↻ Replanned – ${form.cluster}, ${fmtDate(form.from)} → ${fmtDate(form.to)} (${owner})`, tone: 'amber' }],
      };
    }));
    setSelectedAct(form.activity);
    toast(`Replan applied: ${act.name} (${form.cluster}) moved to ${fmtDate(form.from)} – ${fmtDate(form.to)}, reassigned to ${owner}`);
  };

  const markAction = (key: string, msg: string) => {
    setActionsDone((d) => ({ ...d, [key]: true }));
    toast(msg);
  };

  const doneBtn = (key: string) => ({ variant: actionsDone[key] ? 'primary' as const : 'outline' as const, icon: actionsDone[key] ? <Check size={12} /> : undefined });

  return (
    <div className="s6-page">
      <Breadcrumbs items={[{ label: 'S5.4 Supply Risk & Replenishment Planner', to: 's5.4' }, { label: 'S6.1 Unified Campaign Execution Control Tower' }]} />
      <PageHeader
        title="S6.1 — Unified Campaign Execution Control Tower"
        badge={VERSION_BADGE}
        subtitle="Live execution control, campaign orchestration, supply alignment and field operations for Ambad Croptek Onion Conversion"
        actions={<>
          <Btn variant="primary" icon={<Plus size={14} />} onClick={() => toast('New field activity draft created for Ambad Croptek Onion Conversion')}>Create Field Activity</Btn>
          <Btn icon={<Download size={14} />} onClick={() => toast('Execution summary exported (PDF)')}>Export Summary</Btn>
          <Btn variant="gold" icon={<Shuffle size={14} />} onClick={() => openReplan()}>Open Replanning</Btn>
        </>}
      />
      <SourceBar><Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Opened from S5.4 by clicking <b>Confirm Supply Plan &amp; Open Campaign Calendar</b></SourceBar>

      <div className="s6-layout">
        <div className="stack">
          <KpiRow>
            <Kpi icon={<CalendarDays size={18} />} label="Planned Activities" value="209" sub="+8% vs. plan (S5.4: 194)" trend="up" spark={[4, 5, 5, 6, 6, 7, 8, 8, 9]} />
            <Kpi icon={<CheckCircle2 size={18} />} label="Completed Activities" value="66" sub="32% of plan" trend="up" spark={[2, 3, 3, 4, 5, 5, 6, 7, 8]} />
            <Kpi icon={<AlertTriangle size={18} />} label="Overdue / At Risk Activities" value="27" sub="13% of plan (▲ +5 pp)" trend="down" tone="red" spark={[3, 4, 3, 5, 4, 6, 5, 7, 8]} />
            <Kpi icon={<Users size={18} />} label="Verified Farmer Reach" value="3.2 Lakh" sub="+18% vs. previous season" trend="up" spark={[3, 4, 4, 5, 6, 6, 7, 8, 9]} />
            <Kpi icon={<Package size={18} />} label="Supply Commitments Confirmed" value="~110 MT" sub="53% of 209 MT (▲ +6 pp)" spark={[2, 3, 4, 4, 5, 6, 6, 7, 8]} />
            <Kpi icon={<UserCheck size={18} />} label="Active Field Owners" value="5" sub="Across 5 clusters" spark={[3, 4, 4, 5, 5, 5, 5, 5, 5]} />
          </KpiRow>

          <Panel
            icon={<CalendarDays size={16} />}
            title={<>Crop-Stage Aligned Campaign Calendar <span className="muted" style={{ fontWeight: 600 }}>— Ambad Croptek Onion Conversion</span></>}
            actions={
              <div className="s6-legend">
                <span><i style={{ background: 'var(--dark)' }} />Planned Schedule</span>
                <span><i style={{ background: 'var(--mid)' }} />Actual Progress</span>
                <span><i className="s6-bar-revised" />Revised / Replanned</span>
                <span><i className="s6-bar-risk" />At Risk / Delayed</span>
                <b style={{ color: 'var(--red)' }}>Today: 27 Jan 2027</b>
              </div>
            }
          >
            <div style={{ paddingTop: 4 }}>
              <Gantt activities={activities} selected={selectedAct} onSelect={(id) => { setSelectedAct(id); setForm((f) => ({ ...f, activity: id })); }} />
            </div>
          </Panel>

          <Grid cols="1.16fr 1.35fr 1fr">
            <Panel icon={<BarChart3 size={16} />} title={<>Plan vs Actual Execution <span className="muted">(by Activity Type)</span></>}>
              <DataTable<PlanRow>
                compact
                columns={[
                  { key: 'type', label: 'Activity Type' },
                  { key: 'planned', label: 'Planned', align: 'right' },
                  { key: 'completed', label: 'Completed', align: 'right' },
                  { key: 'progress', label: 'Progress', width: 90, render: (r) => <Progress value={r.progress} tone={STATUS_TONE[r.status]} label={`${r.progress}%`} /> },
                  { key: 'status', label: 'Status', render: (r) => <StatusPill s={r.status} /> },
                ]}
                rows={PLAN_ROWS}
                highlight={(r) => r.type === 'Demo Plots'}
              />
            </Panel>
            <Panel icon={<Users size={16} />} title="Field Owner Allocation" data={owners}>
              <DataTable<OwnerRow>
                compact
                columns={[
                  { key: 'owner', label: 'Field Owner', render: (r) => <b>{r.owner}</b> },
                  { key: 'role', label: 'Role' },
                  { key: 'cluster', label: 'Assigned Clusters' },
                  { key: 'task', label: <>Upcoming Task<br /><small className="muted">(Next 3-5 Days)</small></> },
                  { key: 'load', label: 'Workload', align: 'center' },
                  { key: 'status', label: 'Status', render: (r) => <StatusPill s={r.status} /> },
                ]}
                rows={owners.rows}
                onRowClick={(r) => { setForm((f) => ({ ...f, owner: `${r.owner} (Field Owner)`, cluster: r.cluster })); toast(`${r.owner} (${r.cluster}) loaded into Replanning`); }}
              />
            </Panel>
            <Panel icon={<Truck size={16} />} title={<>Supply Commitments &amp; Dependencies <span className="muted">(from S5.4)</span></>}>
              <DataTable<SupplyRow>
                compact
                columns={[
                  { key: 'action', label: 'Replenishment Action (S5.4)' },
                  { key: 'qty', label: 'Qty (MT)', align: 'right' },
                  { key: 'status', label: 'Status', render: (r) => <StatusPill s={r.status} /> },
                  { key: 'milestone', label: 'Next Milestone' },
                ]}
                rows={SUPPLY_ROWS}
                highlight={(r) => r.action === 'Dhanora Transfer'}
                total={{ action: <b>Total</b>, qty: <b>90.0</b>, status: '—', milestone: '—' }}
              />
            </Panel>
          </Grid>

          <Grid cols="1fr 1.35fr">
            <Panel icon={<AlertTriangle size={16} />} title={`Risk Alerts Queue (${ALERT_ROWS.length})`}>
              <DataTable<AlertRow>
                compact
                columns={[
                  { key: 'n', label: '#' },
                  { key: 'alert', label: 'Risk Alert', render: (r) => <b>{r.alert}</b> },
                  { key: 'impact', label: 'Impact' },
                  { key: 'priority', label: 'Priority', render: (r) => <StatusPill s={r.priority} /> },
                ]}
                rows={ALERT_ROWS}
                highlight={(r) => r.n === selectedAlert}
                onRowClick={(r) => { setSelectedAlert(r.n); if (r.n === 2) setRiskOpen(true); }}
              />
            </Panel>
            <Panel icon={<Sparkles size={16} />} title="AI Recommended Operational Actions" className="ai-panel">
              <div className="stack" style={{ gap: 8 }}>
                <AiItem
                  icon={<CalendarDays size={15} />}
                  title="Reschedule Dhanora demo due to delayed stock"
                  action={<div className="row"><Btn small {...doneBtn('replan')} onClick={() => { setActionsDone((d) => ({ ...d, replan: true })); setForm(defaultForm); openReplan('demo'); setSelectedAct('demo'); toast('Replan drafted for Dhanora demo — review and apply in Replanning panel'); }}>Create Replan</Btn><Pill tone="red">High Impact</Pill></div>}
                >
                  Move to 26-27 Jan; supply ETA: 24-25 Jan. Notify field owner and registered farmers.
                </AiItem>
                <AiItem
                  icon={<Store size={15} />}
                  title="Advance retailer activation in Ambad HQ"
                  action={<div className="row"><Btn small {...doneBtn('update')} onClick={() => markAction('update', 'Plan updated: 6 Ambad HQ retailer activations pulled forward to 28–31 Jan')}>Update Plan</Btn><Pill tone="red">High Impact</Pill></div>}
                >
                  Pull forward 6 retailer activations to 28-31 Jan to build early conversion momentum.
                </AiItem>
                <AiItem
                  icon={<Users size={15} />}
                  title="Trigger farmer follow-ups where reach is high but conversion pending"
                  action={<div className="row"><Btn small {...doneBtn('follow')} onClick={() => markAction('follow', 'Follow-up tasks created for Wadi Gaon & Pimpalgaon field owners')}>Create Follow-up</Btn><Pill tone="amber">Medium</Pill></div>}
                >
                  Focus on Wadi Gaon &amp; Pimpalgaon (reach: ~1.1 Lakh; conversion: 22%).
                </AiItem>
              </div>
            </Panel>
          </Grid>
        </div>

        <aside className="s6-rail">
          {riskOpen ? (
            <Panel icon={<AlertTriangle size={16} color="var(--amber)" />} title="Risk Analysis" actions={<button type="button" className="s6-close" aria-label="Close" onClick={() => setRiskOpen(false)}><X size={14} /></button>}>
              <div className="danger-box" style={{ padding: '6px 10px' }}>
                <b>Delayed Stock Arrival – Dhanora</b>
                <div className="muted small">Linked to: Demonstration Plots</div>
              </div>
              <div className="s6-rail-block">
                <h4><Eye size={13} color="var(--green)" />Diagnosis</h4>
                <p>Replenishment from Ambad HQ (25 MT) is still in transit. Expected arrival is ~3–4 days later than planned, causing delay in Dhanora demo (planned: 22 Jan).</p>
              </div>
              <div className="s6-rail-block">
                <h4><BarChart3 size={13} color="var(--green)" />Impact</h4>
                <ul>
                  <li>Demo plot start delayed by ~4 days</li>
                  <li>Risk to farmer turnout (est. -12%)</li>
                  <li>May compress field follow-up window</li>
                </ul>
              </div>
              <div className="s6-rail-block">
                <h4><Workflow size={13} color="var(--green)" />Root Cause</h4>
                <p>Pending retailer receipt in Dhanora (transfer initiated, <span style={{ color: 'var(--red)' }}>not yet delivered</span>).</p>
              </div>
              <div className="s6-rail-block">
                <h4><CheckCircle2 size={13} color="var(--green)" />Recommended Action</h4>
                <p>Reschedule Dhanora demo to 26–27 Jan, or reallocate 5 MT from Ambad HQ to maintain field plan.</p>
              </div>
            </Panel>
          ) : (
            <Btn small icon={<AlertTriangle size={13} />} onClick={() => setRiskOpen(true)}>Show Risk Analysis</Btn>
          )}

          {replanOpen ? (
            <Panel
              className={cx(flash && 's6-panel-flash')}
              icon={<CalendarDays size={16} />}
              title="Replanning"
              subtitle="Revise activity plan, dates, or ownership to de-risk execution."
              actions={<button type="button" className="s6-close" aria-label="Close" onClick={() => setReplanOpen(false)}><X size={14} /></button>}
            >
              <div className="stack" style={{ gap: 8 }}>
                <label className="field">Activity
                  <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
                    {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                <label className="field">Cluster
                  <select value={form.cluster} onChange={(e) => setForm({ ...form, cluster: e.target.value })}>
                    {CLUSTERS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <div className="field">Revised Dates
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} style={{ minWidth: 0, flex: 1 }} />
                    <input type="date" value={form.to} min={form.from} onChange={(e) => setForm({ ...form, to: e.target.value })} style={{ minWidth: 0, flex: 1 }} />
                  </div>
                </div>
                <label className="field">Reassign To
                  <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
                    {OWNERS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <div className="highlight-box small">
                  <b className="row" style={{ marginBottom: 4 }}><ClipboardCheck size={13} />Dependency Check</b>
                  <CheckRow status="done">Supply: In Transit (ETA: 24–25 Jan)</CheckRow>
                  <CheckRow status="done">Weather: Suitable (No rain)</CheckRow>
                  <CheckRow status="done">Other Activities: No conflict</CheckRow>
                </div>
                <div className="row-between">
                  <Btn onClick={() => { setForm(defaultForm); toast('Replanning changes discarded'); }}>Cancel</Btn>
                  <Btn variant="primary" onClick={applyReplan}>Apply Replan</Btn>
                </div>
              </div>
            </Panel>
          ) : (
            <Btn small icon={<Shuffle size={13} />} onClick={() => openReplan()}>Open Replanning</Btn>
          )}
        </aside>
      </div>

      <FlowFooter
        steps={[
          { label: 'Source: S5.4 Supply Risk & Replenishment Planner', to: 's5.4' },
          { label: 'Current: S6.1 Unified Campaign Execution Control Tower', current: true },
        ]}
        next={{ label: 'S6.2 Activity Execution & Action Workspace', to: 's6.2' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S6.2 Activity Execution & Action Workspace                          */
/* ------------------------------------------------------------------ */

type ColId = 'planned' | 'assigned' | 'progress' | 'completed' | 'delayed';
type Card = { id: string; title: string; type: string; date: string; owner: string; col: ColId; status?: string; escalated?: boolean };

const COLUMNS: { id: ColId; label: string; base: number }[] = [
  { id: 'planned', label: 'Planned', base: 38 },
  { id: 'assigned', label: 'Assigned', base: 27 },
  { id: 'progress', label: 'In Progress', base: 41 },
  { id: 'completed', label: 'Completed', base: 66 },
  { id: 'delayed', label: 'Delayed', base: 27 },
];
const COL_STATUS: Record<ColId, string> = { planned: 'Planned', assigned: 'Assigned', progress: 'In Progress', completed: 'Completed', delayed: 'Delayed' };
const COL_PILL: Record<ColId, Tone> = { planned: 'grey', assigned: 'blue', progress: 'lime', completed: 'green', delayed: 'red' };

const INITIAL_CARDS: Card[] = [
  { id: 'c1', title: 'Field Follow-up – Pimpalgaon', type: 'Follow-up', date: '24 Jan 2027', owner: 'R. Jadhav', col: 'planned' },
  { id: 'c2', title: 'Farmer Meeting – Keli', type: 'Meeting', date: '25 Jan 2027', owner: 'S. Patil', col: 'planned' },
  { id: 'c3', title: 'Field Follow-up – Shinde', type: 'Follow-up', date: '23 Jan 2027', owner: 'V. Shinde', col: 'assigned' },
  { id: 'c4', title: 'Demo Support – Wadi', type: 'Demo Support', date: '24 Jan 2027', owner: 'N. Koli', col: 'assigned' },
  { id: 'c5', title: 'Field Advisory – Dhanora', type: 'Advisory Visit', date: '20 Jan 2027', owner: 'R. Jadhav', col: 'progress' },
  { id: 'c6', title: 'Retailer Activation – Ambad', type: 'Retailer', date: '21 Jan 2027', owner: 'S. Patil', col: 'progress' },
  { id: 'c7', title: 'Farmer Meeting – Pimpalgaon', type: 'Meeting', date: '19 Jan 2027', owner: 'M. Deshmukh', col: 'completed' },
  { id: 'c8', title: 'Field Follow-up – Kharpudi', type: 'Follow-up', date: '18 Jan 2027', owner: 'V. Shinde', col: 'completed' },
  { id: 'demo', title: 'Demonstration Plot – Dhanora', type: 'Demo Plot', date: '22 Jan 2027', owner: 'R. Jadhav', col: 'delayed' },
  { id: 'c10', title: 'Stock Arrival – Dhanora', type: 'Stock Receipt', date: '21 Jan 2027', owner: 'S. Patil', col: 'delayed' },
];

const TYPE_ICON: Record<string, ReactNode> = {
  'Follow-up': <MapPin size={13} />,
  Meeting: <Users size={13} />,
  'Demo Support': <Sprout size={13} />,
  'Advisory Visit': <MessageSquare size={13} />,
  Retailer: <Store size={13} />,
  'Demo Plot': <Sprout size={13} />,
  'Stock Receipt': <Truck size={13} />,
};

type AttRow = { n: number; name: string; village: string; contact: string; att: string };
const ATTENDANCE: AttRow[] = [
  { n: 1, name: 'Shankar Gaikwad', village: 'Dhanora', contact: '98XXXX1420', att: 'Present' },
  { n: 2, name: 'Kailas Pawar', village: 'Dhanora', contact: '98XXXX3175', att: 'Present' },
  { n: 3, name: 'Sunil Lohar', village: 'Dhanora', contact: '97XXXX6641', att: 'Present' },
];

const EVIDENCE_TABS = ['Attendance', 'Photographs (3)', 'Geotag', 'Observations', 'Farmer Responses', 'Demo Setup'];

const INITIAL_TASKS = [
  { text: 'Notify rescheduled attendees (22 → 26 Jan 2027)', done: false },
  { text: 'Trial follow-up (7–10 days) for interested farmers', done: false },
  { text: 'Retailer coordination for stock availability & field support', done: false },
  { text: 'Advisory messaging: demo reschedule, Croptek benefits & next steps', done: false },
];

const locationOf = (title: string) => title.split('– ')[1] ?? 'Ambad';

export function ActivityWorkspace() {
  const { toast } = useNav();
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [selectedId, setSelectedId] = useState('demo');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [typeFilter, setTypeFilter] = useState('All Activity Types');
  const [tab, setTab] = useState(EVIDENCE_TABS[0]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [verified, setVerified] = useState(false);
  const [replan, setReplan] = useState({ activity: 'Demonstration Plot', location: 'Dhanora', date: '2027-01-26', owner: 'R. Jadhav' });
  const [aiOpen, setAiOpen] = useState(true);
  const [riskOpen, setRiskOpen] = useState(true);
  const [replanOpen, setReplanOpen] = useState(true);

  const selected = cards.find((c) => c.id === selectedId) ?? cards[0];
  const isDemo = selected.id === 'demo';
  const visible = cards.filter((c) => typeFilter === 'All Activity Types' || c.type === typeFilter);
  const count = (col: ColId) => (COLUMNS.find((c) => c.id === col)?.base ?? 0) + cards.filter((c) => c.col === col).length - INITIAL_CARDS.filter((c) => c.col === col).length;
  const statusOf = (c: Card) => c.status ?? COL_STATUS[c.col];
  const toneOf = (c: Card): Tone => (c.status === 'Rescheduled' ? 'amber' : c.status === 'Verified' ? 'green' : COL_PILL[c.col]);
  const update = (patch: Partial<Card>) => setCards((list) => list.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)));

  const reschedule = () => {
    const date = fmtDate(replan.date);
    update({ col: 'planned', date, status: 'Rescheduled', owner: replan.owner });
    toast(`${selected.title} rescheduled to ${date} (owner: ${replan.owner}) — affected farmers will be notified`);
  };
  const assign = () => {
    update({ col: selected.col === 'planned' ? 'assigned' : selected.col, owner: replan.owner, status: selected.col === 'planned' ? undefined : selected.status });
    toast(`${selected.title} assigned to ${replan.owner}`);
  };
  const verify = () => {
    setVerified(true);
    if (selected.col === 'progress') update({ col: 'completed', status: undefined });
    else if (selected.col !== 'delayed') update({ status: 'Verified' });
    toast(`Field evidence verified for ${selected.title}`);
  };
  const escalate = () => {
    update({ escalated: true });
    toast(`${selected.title} escalated to Cluster Lead (S. Patil) and Supply Planner`);
  };
  const createFollowUp = () => {
    setTasks((t) => [...t, { text: `Follow-up visit: ${selected.title} (${selected.owner})`, done: false }]);
    toast('Follow-up task added to Farmer Follow-up Tasks');
  };

  const details: [string, ReactNode][] = isDemo ? [
    ['Campaign', 'Croptek Onion Conversion — Ambad, Jalna'],
    ['Activity Type', 'Demonstration Plot'],
    ['Location', 'Dhanora'],
    ['Original Scheduled Date', <><Calendar size={13} />22 Jan 2027</>],
    ['Recommended Revised Date', <><Calendar size={13} />{selected.status === 'Rescheduled' ? selected.date : '26 Jan 2027'}</>],
    ['Owner', <><UserCheck size={13} />{selected.owner} (Field Officer)</>],
    ['Cluster', <><MapPin size={13} />Dhanora</>],
    ['Target Farmers', <><Users size={13} />60 farmers</>],
    ['Expected Attendance', <><Users size={13} />45–50 farmers</>],
    ['Status', <Pill tone={toneOf(selected)}>{selected.col === 'delayed' ? 'Delayed / At Risk' : statusOf(selected)}</Pill>],
    ['Primary Dependency', <><Package size={13} color="var(--amber)" />{verified || selected.status === 'Rescheduled' ? 'Stock receipt confirmed for revised date' : 'Pending stock receipt'}</>],
    ['Owner Allocation / Field Owner', <><UserCheck size={13} />{selected.owner} — Primary Owner (Support: S. Patil, Cluster Lead)</>],
    ['Escalation', selected.escalated ? <Pill tone="red">Escalated</Pill> : 'None'],
  ] : [
    ['Campaign', 'Croptek Onion Conversion — Ambad, Jalna'],
    ['Activity Type', selected.type],
    ['Location', locationOf(selected.title)],
    ['Scheduled Date', <><Calendar size={13} />{selected.date}</>],
    ['Owner', <><UserCheck size={13} />{selected.owner} (Field Officer)</>],
    ['Cluster', <><MapPin size={13} />{locationOf(selected.title)}</>],
    ['Status', <Pill tone={toneOf(selected)}>{statusOf(selected)}</Pill>],
    ['Escalation', selected.escalated ? <Pill tone="red">Escalated</Pill> : 'None'],
  ];

  const selectCard = (id: string) => {
    setSelectedId(id);
    const c = cards.find((x) => x.id === id);
    if (c) setReplan((r) => ({ ...r, activity: c.type === 'Demo Plot' ? 'Demonstration Plot' : c.type, location: locationOf(c.title), owner: c.owner }));
  };

  const ev = (name: string) => cx('s6-ev-sec', tab.startsWith(name) && 'focus');

  return (
    <div className="s6-page">
      <Breadcrumbs items={[
        { label: 'S5.4 Supply Risk & Replenishment Planner', to: 's5.4' },
        { label: 'S6.1 Unified Campaign Execution Control Tower', to: 's6.1' },
        { label: 'S6.2 Activity Execution & Action Workspace' },
      ]} />
      <PageHeader
        title="S6.2 — Activity Execution & Action Workspace"
        badge={VERSION_BADGE}
        subtitle="Execute, monitor and resolve field activities for Ambad Croptek Onion Conversion campaign"
        actions={<>
          <Btn variant="primary" icon={<Plus size={14} />} onClick={() => {
            const id = `n${cards.length + 1}`;
            setCards((list) => [...list, { id, title: 'Farmer Meeting – Dhanora', type: 'Meeting', date: '28 Jan 2027', owner: 'R. Jadhav', col: 'planned' }]);
            setSelectedId(id);
            toast('New field activity added to Planned column');
          }}>Create Field Activity</Btn>
          <Btn icon={<Download size={14} />} onClick={() => toast('Activity execution summary exported')}>Export Summary</Btn>
          <Btn variant="gold" icon={<Shuffle size={14} />} onClick={() => { setReplanOpen(true); toast('Replanning panel opened for selected activity'); }}>Open Replanning</Btn>
        </>}
      />
      <SourceBar><Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Opened from S6.1 by clicking <b><i>View Activity</i></b> on delayed Dhanora Demonstration Plot</SourceBar>

      <div className="s6-layout">
        <div className="stack">
          <KpiRow>
            <Kpi icon={<CalendarDays size={18} />} label="Planned Activities" value="209" sub="+8% vs. plan (S5.4: 194)" trend="up" spark />
            <Kpi icon={<CheckCircle2 size={18} />} label="Completed Activities" value={String(count('completed'))} sub="+32% of plan" trend="up" spark={[2, 3, 3, 4, 5, 5, 6, 7, 8]} />
            <Kpi icon={<AlertTriangle size={18} />} label="Delayed Activities" value={String(count('delayed'))} sub="13% of plan (▲ +5 pp)" trend="down" tone="red" spark={[3, 4, 3, 5, 4, 6, 5, 7, 8]} />
            <Kpi icon={<Users size={18} />} label="Verified Farmer Reach" value="3.2 Lakh" sub="+18% vs. previous season" trend="up" spark />
            <Kpi icon={<ListChecks size={18} />} label="Follow-ups Pending" value={String(118 + tasks.length - INITIAL_TASKS.length - tasks.filter((t) => t.done).length)} sub="+27% (vs. 93 last week)" trend="up" spark={[3, 4, 4, 5, 5, 6, 7, 7, 9]} />
          </KpiRow>

          <Panel
            icon={<Workflow size={16} />}
            title="Activity Management Board — Ambad Croptek Onion Conversion"
            actions={<>
              <span className="row small"><Filter size={13} /><select className="s6-select" defaultValue="All Activities"><option>All Activities</option><option>My Activities</option><option>At Risk Only</option></select></span>
              <select className="s6-select" defaultValue="Ambad (Jalna)"><option>Ambad (Jalna)</option>{CLUSTERS.map((c) => <option key={c}>{c}</option>)}</select>
              <select className="s6-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option>All Activity Types</option>
                {Object.keys(TYPE_ICON).map((t) => <option key={t}>{t}</option>)}
              </select>
              <div className="s6-toggle">
                <button type="button" className={cx(view === 'board' && 'active')} onClick={() => setView('board')}><LayoutGrid size={12} />Board</button>
                <button type="button" className={cx(view === 'list' && 'active')} onClick={() => setView('list')}><List size={12} />List</button>
              </div>
            </>}
          >
            {view === 'board' ? (
              <div className="s6-board">
                {COLUMNS.map((col) => (
                  <div key={col.id} className={cx('s6-col', col.id === 'delayed' && 'delayed', col.id === 'completed' && 'done')}>
                    <div className="s6-col-head">
                      {col.id === 'completed' && <Check size={14} color="var(--green)" />}
                      {col.id === 'delayed' && <X size={14} color="var(--red)" />}
                      {col.label} ({count(col.id)})
                    </div>
                    {visible.filter((c) => c.col === col.id).map((c) => (
                      <button key={c.id} type="button" className={cx('s6-card', c.id === selectedId && 'selected')} onClick={() => selectCard(c.id)}>
                        <strong>
                          <span className="row" style={{ gap: 5, flexWrap: 'nowrap' }}><span style={{ color: 'var(--green)', display: 'inline-flex' }}>{TYPE_ICON[c.type]}</span>{c.title}</span>
                          {(c.col === 'delayed' || c.escalated) && <AlertTriangle size={13} color="var(--red)" />}
                        </strong>
                        <span className="muted">{c.type} | {c.date}</span>
                        <span className="row-between"><span className="row" style={{ gap: 4 }}><UserCheck size={12} />{c.owner}</span><Pill tone={toneOf(c)}>{statusOf(c)}</Pill></span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <DataTable<Card>
                compact
                columns={[
                  { key: 'title', label: 'Activity', render: (c) => <b>{c.title}</b> },
                  { key: 'type', label: 'Type' },
                  { key: 'date', label: 'Date' },
                  { key: 'owner', label: 'Owner' },
                  { key: 'col', label: 'Status', render: (c) => <Pill tone={toneOf(c)}>{statusOf(c)}</Pill> },
                ]}
                rows={visible}
                highlight={(c) => c.id === selectedId}
                onRowClick={(c) => selectCard(c.id)}
              />
            )}
          </Panel>

          <Grid cols="1.38fr 2.2fr 1fr">
            <Panel
              icon={<FileText size={16} />}
              title={`Selected Activity: ${selected.title}`}
              actions={selected.col === 'delayed' ? <Pill tone="red"><AlertTriangle size={11} />Delayed / At Risk</Pill> : <Pill tone={toneOf(selected)}>{statusOf(selected)}</Pill>}
            >
              <dl className="s6-detail">
                {details.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </Panel>

            <Panel icon={<Camera size={16} />} title="Field Execution Evidence">
              <div className="tabs">
                {EVIDENCE_TABS.map((t) => <button key={t} type="button" className={cx('tab', tab === t && 'active')} onClick={() => setTab(t)}>{t}</button>)}
              </div>
              <div className="s6-evidence">
                <div className={ev('Attendance')}>
                  <Grid cols="1.6fr 1fr" gap={10}>
                    <div>
                      <h4 className="row-between"><span className="row"><Users size={13} />Attendance Record (Field Register)</span><span className="muted small">Recorded: 22 Jan 2027 (Planned)</span></h4>
                      <DataTable<AttRow>
                        compact
                        columns={[
                          { key: 'n', label: '#' },
                          { key: 'name', label: 'Farmer Name' },
                          { key: 'village', label: 'Village' },
                          { key: 'contact', label: 'Contact' },
                          { key: 'att', label: 'Attendance', render: (r) => <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ {r.att}</span> },
                        ]}
                        rows={ATTENDANCE}
                      />
                    </div>
                    <div className="highlight-box">
                      <h4><ClipboardCheck size={13} />Attendance Summary</h4>
                      <dl className="kv">
                        <dt>Total Registered</dt><dd>60</dd>
                        <dt>Attended (Recorded)</dt><dd>47</dd>
                        <dt>Attendance Rate</dt><dd><Pill tone="green">78%</Pill></dd>
                      </dl>
                    </div>
                  </Grid>
                </div>
                <Grid cols="2fr 1fr" gap={10}>
                  <div className={ev('Photographs')}>
                    <h4><Camera size={13} />Photographs (3)</h4>
                    <Grid cols="1fr 1fr 1fr" gap={6}>
                      <div className="s6-photo p1" onClick={() => toast('Photo 1: Farmer gathering at Dhanora plot (geotagged)')}><span className="big">👨‍🌾</span>Farmer gathering</div>
                      <div className="s6-photo p2" onClick={() => toast('Photo 2: Onion crop stand, ~30 days')}><span className="big">🌱</span>Crop stand</div>
                      <div className="s6-photo p3" onClick={() => toast('Photo 3: Croptek demonstration plot board')}><span className="big">🪧</span>Croptek demo board</div>
                    </Grid>
                  </div>
                  <div className={ev('Geotag')}>
                    <h4><MapPin size={13} />Geotag (Event Location)</h4>
                    <dl className="kv"><dt>Lat</dt><dd>19.8362° N</dd><dt>Long</dt><dd>75.7571° E</dd></dl>
                    <div style={{ marginTop: 8 }}><Pill tone="green"><CheckCircle2 size={11} />Verified</Pill></div>
                  </div>
                </Grid>
                <Grid cols="1fr 1fr 1fr" gap={10}>
                  <div className={ev('Observations')}>
                    <h4><ClipboardCheck size={13} />Field Observations</h4>
                    <ul>
                      <li>Field ready for demo, good crop stand</li>
                      <li>Farmers interested in yield and bulb size</li>
                      <li>Crop age ~30 days, uniform growth</li>
                      <li>Stock not yet received; demo to be rescheduled</li>
                    </ul>
                  </div>
                  <div className={ev('Farmer Responses')}>
                    <h4><MessageSquare size={13} />Farmer Responses <span className="muted">(Quick Capture)</span></h4>
                    <ul>
                      <li>82% interested in trying Croptek</li>
                      <li>Key queries: dose, timing, yield benefit</li>
                      <li>5 farmers requested follow-up visit</li>
                      <li>Positive inclination for post-demo trial</li>
                    </ul>
                  </div>
                  <div className={ev('Demo Setup')}>
                    <h4><ListChecks size={13} />Demo Setup Checklist</h4>
                    <CheckRow status="done">Field identified &amp; farmer confirmed</CheckRow>
                    <CheckRow status="done">Plot marking &amp; layout (0.25 acre)</CheckRow>
                    <CheckRow status="done">Farmer invitation &amp; mobilization</CheckRow>
                    <CheckRow status={verified ? 'done' : 'todo'}>Product stock available at location</CheckRow>
                    <CheckRow status="todo">Demo material (banners, board, samples)</CheckRow>
                  </div>
                </Grid>
              </div>
            </Panel>

            <div className="stack">
              <Panel icon={<CheckCircle2 size={16} />} title="Evidence Verification">
                <div className="row-between small" style={{ marginBottom: 6 }}><b>Verification Status</b><Pill tone={verified ? 'green' : 'amber'}>{verified ? 'Verified' : 'In Review'}</Pill></div>
                <div className="row-between small"><CheckRow status="done">Duplicate-photo check</CheckRow><Pill tone="green">No duplicate</Pill></div>
                <div className="row-between small"><CheckRow status="done">Attendance anomaly check</CheckRow><Pill tone="green">No anomaly</Pill></div>
                <div className="row-between small"><CheckRow status={verified ? 'done' : 'warn'}>Missing-detail check</CheckRow><Pill tone={verified ? 'green' : 'amber'}>{verified ? 'Resolved' : 'Pending (1)'}</Pill></div>
                <div className="row-between small"><CheckRow status="done">Geotag validation</CheckRow><Pill tone="green">Verified</Pill></div>
              </Panel>
              <Panel icon={<ListChecks size={16} />} title={`Farmer Follow-up Tasks (${tasks.length})`}>
                <div className="s6-tasks">
                  {tasks.map((t, i) => (
                    <label key={t.text} className={cx(t.done && 'done')}>
                      <input type="checkbox" checked={t.done} onChange={() => setTasks((list) => list.map((x, k) => (k === i ? { ...x, done: !x.done } : x)))} />
                      <span>{t.text}</span>
                    </label>
                  ))}
                </div>
              </Panel>
              <Panel icon={<Workflow size={16} />} title="Corrective Action Workflow">
                <div className="s6-actions">
                  <Btn small variant="primary" icon={<RotateCcw size={12} />} onClick={reschedule}>Reschedule</Btn>
                  <Btn small icon={<UserPlus size={12} />} onClick={assign}>Assign</Btn>
                  <Btn small icon={<Check size={12} />} onClick={verify}>Verify</Btn>
                  <Btn small icon={<ArrowUpCircle size={12} />} onClick={escalate}>Escalate</Btn>
                  <Btn small icon={<Plus size={12} />} onClick={createFollowUp}>Create Follow-up</Btn>
                </div>
              </Panel>
            </div>
          </Grid>
        </div>

        <aside className="s6-rail">
          {aiOpen ? (
            <Panel className="ai-panel" icon={<Sparkles size={16} />} title="AI Next-Best-Action" actions={<button type="button" className="s6-close" aria-label="Close" onClick={() => setAiOpen(false)}><X size={14} /></button>}>
              <div className="s6-rail-block" style={{ borderTop: 0, marginTop: 0, paddingTop: 0 }}>
                <h4><Target size={13} color="var(--green)" />Recommended Action</h4>
                <p>Reschedule the Dhanora demonstration to <b>26 Jan 2027</b> after stock receipt confirmation, notify affected farmers, and coordinate <span style={{ color: '#8a5b00' }}>retailer support for on-ground execution.</span></p>
              </div>
              <div className="s6-rail-block">
                <h4><BarChart3 size={13} color="var(--green)" />Rationale</h4>
                <CheckRow status="done">Stock receipt is still pending, so demo cannot be conducted as planned on 22 Jan.</CheckRow>
                <CheckRow status="done">Farmer readiness and field setup are in place (78% attendance, positive response).</CheckRow>
                <CheckRow status="done">Retailer support is needed to ensure timely stock availability for the rescheduled demo.</CheckRow>
              </div>
            </Panel>
          ) : <Btn small icon={<Sparkles size={13} />} onClick={() => setAiOpen(true)}>Show AI Next-Best-Action</Btn>}

          {riskOpen ? (
            <Panel icon={<AlertTriangle size={16} color="var(--amber)" />} title="Risk Analysis" actions={<button type="button" className="s6-close" aria-label="Close" onClick={() => setRiskOpen(false)}><X size={14} /></button>}>
              <div className="stack small" style={{ gap: 8 }}>
                <div><b>● Stock Receipt Delay</b> <Pill tone="red">High</Pill><div className="muted">Product stock for Dhanora not yet received (Original: 21 Jan 2027).</div></div>
                <div><b>● Farmer Attendance Drop</b> <Pill tone="amber">Medium</Pill><div className="muted">Rescheduling may reduce attendance by ~10–15% if not communicated promptly.</div></div>
                <div><b>● Campaign Timeline Slippage</b> <Pill tone="green">Low</Pill><div className="muted">Limited impact if demo is executed by 26 Jan 2027.</div></div>
              </div>
            </Panel>
          ) : <Btn small icon={<AlertTriangle size={13} />} onClick={() => setRiskOpen(true)}>Show Risk Analysis</Btn>}

          {replanOpen ? (
            <Panel icon={<CalendarDays size={16} />} title="Replanning" subtitle="Revise activity plan, dates, or ownership to de-risk execution." actions={<button type="button" className="s6-close" aria-label="Close" onClick={() => setReplanOpen(false)}><X size={14} /></button>}>
              <div className="stack" style={{ gap: 8 }}>
                <label className="field">Activity
                  <select value={replan.activity} onChange={(e) => setReplan({ ...replan, activity: e.target.value })}>
                    {['Demonstration Plot', 'Follow-up', 'Meeting', 'Demo Support', 'Advisory Visit', 'Retailer', 'Stock Receipt'].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
                <label className="field">Location
                  <select value={replan.location} onChange={(e) => setReplan({ ...replan, location: e.target.value })}>
                    {Array.from(new Set([replan.location, ...CLUSTERS])).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field">Revised Date
                  <input type="date" value={replan.date} onChange={(e) => setReplan({ ...replan, date: e.target.value })} />
                </label>
                <label className="field">Owner
                  <select value={replan.owner} onChange={(e) => setReplan({ ...replan, owner: e.target.value })}>
                    {['R. Jadhav', 'S. Patil', 'M. Deshmukh', 'P. Koli', 'V. Shinde', 'N. Koli'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <Btn variant="gold" icon={<Shuffle size={14} />} onClick={reschedule}>Open Replanning</Btn>
              </div>
            </Panel>
          ) : <Btn small icon={<Shuffle size={13} />} onClick={() => setReplanOpen(true)}>Open Replanning</Btn>}
        </aside>
      </div>

      <FlowFooter
        steps={[
          { label: '‹ Return to S6.1 Unified Campaign Execution Control Tower', to: 's6.1' },
          { label: 'Current: S6.2 Activity Execution & Action Workspace', current: true },
        ]}
        nextLabel="Recommended Next: S7.1 Campaign Impact & Learning Dashboard"
        next={{ label: 'Proceed to Impact Review', to: 's7.1' }}
      />
    </div>
  );
}

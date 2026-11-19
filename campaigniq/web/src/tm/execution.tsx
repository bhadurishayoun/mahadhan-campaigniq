/** Field Sales Manager - Campaign Execution (TM.EX1-EX2), Impact & Learning (TM.IM1-IM2) and AI Copilot (TM.AI1). */
import { useState } from 'react';
import { AlertTriangle, Bot, Camera, CheckCircle2, FileText, Upload, UserRound, CircleDollarSign, Users, ListChecks, AlertOctagon, TrendingUp, CalendarDays } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, cx } from '../ui';
import { FunnelBars } from '../ui/index';
import { CAMPAIGN, EXECUTION_CAMPAIGNS, conversionFunnel, costPerAdopter, executionSummary, portfolioExecution, EXECUTION, FIELD_OWNERS, IMPACT_VILLAGES, conversion, type GanttUnit } from './data';
import { AiPanel, Context, Footer, HBars, Metrics, Note, Panel, Status, TmPage, lakh } from './ui';
import { MAP_COLORS, TmMap } from './viz';
import { LiveCopilot } from '../ui/LiveCopilot';
import { useCampaignDraft } from './campaignDraft';
import { Card, Grid, InsightStrip, KpiStrip, Metric, NextSteps } from '../ui/system';
import { FunnelSteps, GroupedColumns, TrendLine, DonutMetric, RankedBars } from '../ui/viz';
import { DataTable, StatusChip } from '../ui/kit';
import { useExecutionCampaign, setExecutionCampaign } from './state';
import { CampaignSwitcher } from './ui';
import { useState as useLocalState } from 'react';

const executionFmt = (value: number) => `₹${value.toFixed(2)} L`;
export function TmEx0() {
  const { go } = useNav();
  const selectedCampaignId = useExecutionCampaign();
  const totals = portfolioExecution();
  const campaigns = EXECUTION_CAMPAIGNS.map((c) => executionSummary(c.id));
  const [donutMode, setDonutMode] = useLocalState<'Tracked sales' | 'Adopters'>('Tracked sales');
  const atRisk = [...campaigns].sort((a, b) => b.atRisk - a.atRisk);
  const donutRows = campaigns.map((s) => ({ label: s.campaign.name, value: donutMode === 'Tracked sales' ? s.trackedSales : s.adopters }));
  const weekly = [1, 2, 3, 4].map((week) => campaigns.filter((s) => s.campaign.stage === 'Live').reduce((row, s) => {
    const count = s.units.filter((u) => u.week <= week).length;
    const completed = s.units.filter((u) => u.week <= week && u.state === 'done').length;
    return { week: `Week ${week}`, planned: Number(row.planned) + count, completed: Number(row.completed) + completed };
  }, { week: `Week ${week}`, planned: 0, completed: 0 }));
  const rows = [
    ...campaigns.map((s) => ({ id: s.campaign.id, campaign: s.campaign.name, crop: s.campaign.crop, villages: s.campaign.villages.join(', '), status: s.campaign.stage, progress: s.progress, spend: s.spent, budget: s.budgetApproved, adopters: s.adopters, sales: s.trackedSales, roi: s.roi === null ? '—' : `${s.roi.toFixed(2)}×` })),
    { id: 'total', campaign: 'Total', crop: '—', villages: '—', status: 'Total', progress: Math.round(totals.activitiesDone / totals.activitiesTotal * 100), spend: totals.spent, budget: totals.budgetApproved, adopters: totals.adopters, sales: totals.trackedSales, roi: '—' },
  ];
  const highestRisk = atRisk[0];
  const overrun = [...campaigns].sort((a, b) => (b.spent - b.budgetApproved) - (a.spent - a.budgetApproved))[0];
  const noOwner = campaigns.find((s) => s.activities.some((a) => !a.owner || a.owner === 'Owner pending'));
  const actions = [
    { icon: AlertOctagon, title: 'Resolve highest activity risk', detail: `${highestRisk.campaign.name}: ${highestRisk.atRisk} activities at risk.`, id: highestRisk.campaign.id },
    { icon: CircleDollarSign, title: 'Review budget variance', detail: `${overrun.campaign.name}: ${executionFmt(overrun.spent - overrun.budgetApproved)} against approved budget.`, id: overrun.campaign.id },
    { icon: Users, title: noOwner ? 'Assign campaign activity owner' : 'Review field ownership', detail: noOwner ? `${noOwner.campaign.name} has an unassigned activity.` : 'All listed activities have an owner.', id: (noOwner ?? campaigns[0]).campaign.id },
    { icon: CalendarDays, title: 'Review campaign close date', detail: `${campaigns.filter((s) => s.campaign.stage === 'Live').length} live campaigns are active.`, id: campaigns.filter((s) => s.campaign.stage === 'Live').sort((a, b) => a.campaign.months[1] - b.campaign.months[1])[0]?.campaign.id ?? campaigns[0].campaign.id },
  ];
  // Card 4: weekly gap (live campaigns, same scope as the chart).
  const gaps = weekly.map((w) => Number(w.planned) - Number(w.completed));
  const lastWeek = weekly[weekly.length - 1];
  const widened = gaps.every((g, i) => i === 0 || g > gaps[i - 1]);
  const weeklyInsight = `By ${String(lastWeek.week).toLowerCase()} only ${lastWeek.completed} of ${lastWeek.planned} planned activities are complete; ${widened ? 'the gap has widened every week' : `the gap stands at ${gaps[gaps.length - 1]} activities`}.`;
  // Card 5: conversion funnel, all campaigns or the selected one.
  const [funnelMode, setFunnelMode] = useLocalState<'all' | 'selected'>('all');
  const selectedSummary = campaigns.find((s) => s.campaign.id === selectedCampaignId) ?? campaigns[0];
  const funnel = conversionFunnel(funnelMode === 'all' ? undefined : [selectedSummary.campaign.id]);
  const trialLoss = funnel.reached - funnel.trials, adoptLoss = funnel.trials - funnel.adopters;
  const funnelInsight = trialLoss >= adoptLoss
    ? `The trial step loses the most farmers: ${Math.round((trialLoss / Math.max(1, funnel.reached)) * 100)}% of those reached never try the product.`
    : `The adoption step loses the most farmers: ${Math.round((adoptLoss / Math.max(1, funnel.trials)) * 100)}% of those who tried do not adopt.`;
  // Card 6: cost per adopter vs the portfolio average.
  const cpa = costPerAdopter();
  const worstCpa = [...cpa.rows].sort((a, b) => b.cost - a.cost)[0];
  const cpaInsight = `${worstCpa.name} costs ₹${Math.round(worstCpa.cost).toLocaleString('en-IN')} per adopter, ${(worstCpa.cost / cpa.average).toFixed(1)}× the portfolio average${worstCpa.spent > worstCpa.approved ? ', in line with its budget overrun' : ''}.`;
  return <TmPage code="TM.EX0" title="Execution overview" subtitle="Campaign execution" headerActions={<CampaignSwitcher />}>
    <KpiStrip>
      <Metric icon={TrendingUp} label="Campaigns running" value={totals.running} comparator="vs plan" />
      <Metric icon={CheckCircle2} label="Completed" value={totals.completed} comparator="vs plan" />
      <Metric icon={ListChecks} label="Activities completed" value={`${totals.activitiesDone} / ${totals.activitiesTotal}`} note={`${Math.round(totals.activitiesDone / totals.activitiesTotal * 100)}% complete`} />
      <Metric icon={AlertOctagon} label="At-risk activities" value={totals.atRisk} comparator="vs plan" />
      <Metric icon={CircleDollarSign} label="Budget spent / approved" value={`${executionFmt(totals.spent)} / ${executionFmt(totals.budgetApproved)}`} note={`${Math.round(totals.spent / totals.budgetApproved * 100)}% used`} />
      <Metric icon={Users} label="Adopters recorded" value={totals.adopters.toLocaleString('en-IN')} comparator="vs plan" />
    </KpiStrip>
    <Grid>
      <Card title="Execution status by campaign" subtitle="Completed, scheduled and at-risk activities">
        <RankedBars items={atRisk.map((s) => ({ label: s.campaign.name, value: s.totalUnits, note: `${s.completed} completed · ${s.scheduled} scheduled · ${s.atRisk} at risk`, display: `${s.atRisk} at risk`, segments: [{ label: 'Completed', value: s.completed, color: 'var(--ok)' }, { label: 'Scheduled', value: s.scheduled, color: 'var(--warn)' }, { label: 'At risk', value: s.atRisk, color: 'var(--risk)' }] }))} onSelect={(label) => { const campaign = campaigns.find((s) => s.campaign.name === label); if (campaign) { setExecutionCampaign(campaign.campaign.id); go('tm.ex1'); } }} share={false} />
        <InsightStrip>{highestRisk.campaign.name} has {highestRisk.atRisk} activities at risk, the most across campaigns.</InsightStrip>
      </Card>
      <Card title="Contribution by campaign" action={<div className="cq-tabs"><button className={donutMode === 'Tracked sales' ? 'cq-tab active' : 'cq-tab'} onClick={() => setDonutMode('Tracked sales')}>Tracked sales</button><button className={donutMode === 'Adopters' ? 'cq-tab active' : 'cq-tab'} onClick={() => setDonutMode('Adopters')}>Adopters</button></div>}>
        <DonutMetric items={donutRows} value={donutMode === 'Tracked sales' ? executionFmt(totals.trackedSales) : totals.adopters.toLocaleString('en-IN')} label={donutMode} fmt={donutMode === 'Tracked sales' ? executionFmt : (v) => v.toLocaleString('en-IN')} interactive selected={campaigns.find((s) => s.campaign.id === selectedCampaignId)?.campaign.name} onSelect={(item) => { const campaign = campaigns.find((s) => s.campaign.name === item.label); if (campaign) { setExecutionCampaign(campaign.campaign.id); go('tm.ex1'); } }} />
        <InsightStrip>{donutMode === 'Tracked sales' ? `Tracked campaign sales total ${executionFmt(totals.trackedSales)}.` : `${totals.adopters.toLocaleString('en-IN')} adopters are recorded across the execution portfolio.`}</InsightStrip>
      </Card>
      <Card title="Budget used vs approved">
        <GroupedColumns data={campaigns.map((s) => ({ campaign: s.campaign.name.split(' ').slice(0, 2).join(' '), approved: s.budgetApproved, spent: s.spent }))} x="campaign" series={[{ key: 'approved', name: 'Plan approved' }, { key: 'spent', name: 'Actual spent' }]} fmt={executionFmt} height={240} />
        <InsightStrip>{executionFmt(totals.spent)} spent against {executionFmt(totals.budgetApproved)} approved across the five execution campaigns.</InsightStrip>
      </Card>
      <Card title="Weekly activity completion" context="Live campaigns" subtitle="Cumulative activities, planned vs completed">
        <TrendLine data={weekly} x="week" series={[{ key: 'planned', name: 'Planned', dashed: true }, { key: 'completed', name: 'Completed' }]}
          fmt={(v) => `${v} activities`} tickFmt={(v) => String(v)} height={240}
          gap={{ upper: 'planned', lower: 'completed' }} endLabel={(s, v) => `${v} ${s.key}`} />
        <InsightStrip>{weeklyInsight}</InsightStrip>
      </Card>
      <Card title="Farmer conversion funnel" context={funnelMode === 'all' ? 'All campaigns' : selectedSummary.campaign.name}
        subtitle={funnelMode === 'all' ? 'Reached → trial → adopter, live and completed campaigns' : 'Reached → trial → adopter, selected campaign'}
        action={<div className="cq-tabs"><button className={funnelMode === 'all' ? 'cq-tab active' : 'cq-tab'} onClick={() => setFunnelMode('all')}>All campaigns</button><button className={funnelMode === 'selected' ? 'cq-tab active' : 'cq-tab'} onClick={() => setFunnelMode('selected')} title={selectedSummary.campaign.name}>Selected campaign</button></div>}>
        <FunnelSteps steps={[{ label: 'Reached', value: funnel.reached }, { label: 'Trials', value: funnel.trials }, { label: 'Adopters', value: funnel.adopters }]} />
        <InsightStrip>{funnelInsight}</InsightStrip>
      </Card>
      <Card title="Cost per adopter by campaign" context="All campaigns" subtitle="Campaign spend ÷ recorded adopters">
        <RankedBars share={false} fmt={(v) => `₹${Math.round(v).toLocaleString('en-IN')}`}
          items={cpa.rows.slice().sort((a, b) => b.cost - a.cost).map((r) => ({ label: r.name, value: r.cost }))}
          reference={{ value: cpa.average, label: `Portfolio average ₹${Math.round(cpa.average).toLocaleString('en-IN')}` }}
          highlight={(it) => it.value > cpa.average * 1.5}
          legend={{ base: 'Cost per adopter', highlight: 'Above 1.5× average' }}
          onSelect={(label) => { const r = cpa.rows.find((x) => x.name === label); if (r) { setExecutionCampaign(r.id); go('tm.ex1'); } }} />
        <InsightStrip>{cpaInsight}</InsightStrip>
      </Card>
    </Grid>
    <Card title="Campaign execution table">
      <DataTable columns={[
        { key: 'campaign', header: 'Campaign' }, { key: 'crop', header: 'Crop' }, { key: 'villages', header: 'Villages' },
        { key: 'status', header: 'Status', status: true, render: (r) => r.status === 'Total' ? '—' : <StatusChip kind={r.status === 'Completed' ? 'ok' : 'info'}>{r.status}</StatusChip> },
        { key: 'progress', header: 'Progress', align: 'r', render: (r) => <span className="iq-pctcell"><i style={{ width: `${Number(r.progress)}%` }} /><b>{Number(r.progress)}%</b></span> },
        { key: 'spend', header: 'Spent / approved', align: 'r', render: (r) => `${executionFmt(Number(r.spend))} / ${executionFmt(Number(r.budget))}` },
        { key: 'adopters', header: 'Adopters', align: 'r' }, { key: 'sales', header: 'Tracked sales', align: 'r', render: (r) => executionFmt(Number(r.sales)) },
        { key: 'roi', header: 'ROI', align: 'r' },
      ]} rows={rows} rowClassName={(row) => row.id === 'total' ? 'total' : undefined} onRow={(row) => { if (row.id !== 'total') { setExecutionCampaign(row.id); go('tm.ex1'); } }} />
    </Card>
    <Card title="Next best actions">
      <div className="cq-grid2">{actions.map((item) => <button key={item.title} type="button" className="cq-action-card" onClick={() => { setExecutionCampaign(item.id); go('tm.ex1'); }}><item.icon size={18} /><b>{item.title}</b><span>{item.detail}</span><strong>Open activity tracker →</strong></button>)}</div>
    </Card>
    <NextSteps back={{ label: 'Campaign portfolio', to: 'tm.c3' }} primary={{ label: 'Open activity tracker', to: 'tm.ex1' }} />
  </TmPage>;
}

function CampaignStrip({ extra }: { extra?: { label: string; value: string; sub?: string }[] }) {
  const { total } = useCampaignDraft();
  return (
    <Context items={[
      { label: 'Campaign', value: CAMPAIGN.name, sub: CAMPAIGN.villages },
      { label: 'Status', value: 'Approved · In progress' },
      { label: 'Approved campaign budget', value: lakh(total, 2) },
      { label: 'Plan-linked objective', value: '₹25.00 L', sub: 'Within approved Ambad ABP ₹4.20 Cr — not additional business' },
      ...(extra ?? []),
    ]} />
  );
}

/* ------------------------------------------------------------------ TM.EX1 */
export function TmEx1() {
  const { go } = useNav();
  const selected = useExecutionCampaign();
  const summary = executionSummary(selected);
  const stateCount = (stateName: GanttUnit['state']) => summary.units.filter((u) => u.state === stateName).length;
  return <TmPage headerActions={<CampaignSwitcher />} code="TM.EX1" title="Activity Tracker" status={summary.campaign.stage}>
    <Card title="Campaign activity calendar" context={summary.campaign.name.toUpperCase()} subtitle={summary.campaign.villages.join(' · ')} action={summary.campaign.stage === 'Completed' ? <StatusChip kind="ok">Completed</StatusChip> : undefined}>
      <div className="wide-scroll"><div className="tm-gantt">
        <div className="tm-gantt-head"><span>Activity · owner</span>{[1, 2, 3, 4].map((w) => <span key={w}>Week {w}</span>)}</div>
        {EXECUTION[summary.campaign.id].activities.map((row) => <div key={row.activity} className="tm-gantt-row">
          <div className="tm-gantt-label"><b>{row.activity}</b><small>{row.units.length} units · {row.owner}</small></div>
          {[1, 2, 3, 4].map((week) => <div key={week} className="tm-gantt-cell">{row.units.filter((u) => u.week === week).map((unit, i) => <button key={i} type="button" disabled={summary.campaign.stage === 'Completed'} className={cx('tm-unit', `tm-unit-${unit.state}`)} title={unit.note ?? unit.state} onClick={() => go('tm.ex2')}>{unit.village}</button>)}</div>)}
        </div>)}
      </div></div>
      <InsightStrip>{summary.completed} of {summary.totalUnits} activities are complete; {summary.atRisk} are at risk and {summary.scheduled} remain scheduled.</InsightStrip>
    </Card>
    <KpiStrip><Metric icon={ListChecks} label="Activities planned" value={summary.totalUnits} comparator="vs plan" /><Metric icon={CheckCircle2} label="Completed" value={summary.completed} comparator="vs plan" /><Metric icon={AlertOctagon} label="At risk" value={summary.atRisk} comparator="vs plan" /><Metric icon={CircleDollarSign} label="Budget spent" value={`${executionFmt(summary.spent)} / ${executionFmt(summary.budgetApproved)}`} /></KpiStrip>
    <Card title="Execution status by activity"><RankedBars items={EXECUTION[summary.campaign.id].activities.map((row) => ({ label: row.activity, value: row.units.filter((u) => u.state === 'risk').length, note: `${row.owner} · ${row.units.length} units` }))} share={false} /><InsightStrip>{summary.campaign.name} has {stateCount('risk')} activities currently at risk.</InsightStrip></Card>
    <NextSteps back={{ label: 'Execution overview', to: 'tm.ex0' }} primary={{ label: 'Open activity follow-up', to: 'tm.ex2' }} />
  </TmPage>;
}

/* ------------------------------------------------------------------ TM.EX2 */
const ACTIONS = ['Request Stock Confirmation', 'Propose Reschedule', 'Reassign Owner', 'Escalate Issue'];

export function TmEx2() {
  const { toast } = useNav();
  const selectedCampaignId = useExecutionCampaign();
  const summary = executionSummary(selectedCampaignId);
  const exceptionActivity = summary.activities.find((activity) => activity.units.some((unit) => unit.state === 'risk')) ?? summary.activities[0];
  const [action, setAction] = useState(ACTIONS[0]);
  const [owner, setOwner] = useState('R. Jadhav');
  const [date, setDate] = useState('2026-11-28');
  const [reason, setReason] = useState('Stock availability for the demonstration date is not confirmed.');
  const [saved, setSaved] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  return (
    <TmPage headerActions={<CampaignSwitcher />} code="TM.EX2" title="Activity Follow-up" status={summary.campaign.stage}>
      <div className="pm-two">
        <div className="pm-stack">
          <Panel title={exceptionActivity.activity} actions={summary.campaign.stage === 'Completed' ? <StatusChip kind="ok">Completed</StatusChip> : undefined}>
            <dl className="tm-facts tm-facts-4">
              <div><dt>Campaign</dt><dd>{summary.campaign.name}</dd></div>
              <div><dt>Assigned owner</dt><dd>{exceptionActivity.owner}</dd></div>
              <div><dt>Planned</dt><dd>Week {exceptionActivity.units.find((unit) => unit.state === 'risk')?.week ?? exceptionActivity.units[0]?.week}</dd></div>
              <div><dt>Unit</dt><dd>{exceptionActivity.units.length} planned · {summary.totalUnits} campaign activities</dd></div>
            </dl>
            <div className="tm-blocker-box"><AlertTriangle size={15} /><span><b>{summary.campaign.stage === 'Completed' ? 'Status:' : 'Blocker:'}</b> {exceptionActivity.units.find((unit) => unit.state === 'risk')?.note ?? (summary.campaign.stage === 'Completed' ? 'All campaign activities are completed.' : 'Review activity readiness before the scheduled date.')}</span></div>
          </Panel>
          <div className="pm-two-even">
            <Panel title="Execution readiness">
              <ul className="tm-checks">
                <li className="risk"><span>Stock confirmation</span><Status>Pending</Status></li>
                <li className="warn"><span>Retailer coordination</span><Status>To verify</Status></li>
                <li className="warn"><span>Venue readiness</span><Status>To verify</Status></li>
                <li className="warn"><span>Farmer mobilisation</span><Status>To verify</Status></li>
                <li className="warn"><span>Field evidence</span><Status>Not yet submitted</Status></li>
              </ul>
            </Panel>
            <Panel title="Activity timeline">
              <ol className="tm-timeline">
                <li className="done"><b>Scheduled for Week {exceptionActivity.units.find((unit) => unit.state === 'risk')?.week ?? exceptionActivity.units[0]?.week}</b><small>{summary.campaign.name} · activity planned</small></li>
                <li className="risk"><b>{summary.campaign.stage === 'Completed' ? 'Execution completed' : 'Risk identified'}</b><small>{exceptionActivity.units.find((unit) => unit.state === 'risk')?.note ?? `${exceptionActivity.activity} status recorded for ${summary.campaign.name}`}</small></li>
                <li className="pending"><b>Awaiting resolution</b><small>{saved ? `${saved} — proposed, not yet approved` : 'No corrective action assigned yet'}</small></li>
              </ol>
            </Panel>
          </div>
          <Panel title="Field evidence" actions={<Status>{Object.keys(evidence).length === 3 ? 'Ready to submit' : 'Not submitted'}</Status>}>
            <div className="tm-evidence">
              {[['photo', 'Demo photo', Camera], ['attendance', 'Attendance sheet', UserRound], ['notes', 'Completion notes', FileText]].map(([key, label, Icon]) => {
                const I = Icon as typeof Camera;
                return (
                  <label key={key as string} className={cx('tm-upload', evidence[key as string] && 'has-file')}>
                    <I size={16} /><span>{evidence[key as string] ?? label as string}</span>
                    <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setEvidence((x) => ({ ...x, [key as string]: f.name })); }} />
                    <Upload size={13} />
                  </label>
                );
              })}
            </div>
            <small className="tm-muted">Upload after the demonstration is completed. Files stay in this browser in the showcase.</small>
          </Panel>
        </div>
        <div className="pm-stack">
        <AiPanel title="AI Recommended Action">
            <ol className="tm-ai-list tm-ol">
              <li>Review readiness for {exceptionActivity.activity} in {summary.campaign.name}.</li>
              <li>Contact {exceptionActivity.owner} to confirm the next field activity.</li>
              <li>If the activity cannot proceed as planned, propose a reschedule or escalate.</li>
            </ol>
          </AiPanel>
          <Panel title="Corrective action workspace" tone="soft">
            <div className="tm-action-choices">
              {ACTIONS.map((a) => <button key={a} type="button" className={cx(a === action && 'active')} onClick={() => setAction(a)}>{a}</button>)}
            </div>
            <div className="pm-form">
              <label className="pm-field"><span>Assigned owner</span>
                <select value={owner} onChange={(e) => setOwner(e.target.value)}>{FIELD_OWNERS.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}</select>
              </label>
              <label className="pm-field"><span>Proposed new date {action !== 'Propose Reschedule' && <em className="tm-muted">(only for a reschedule)</em>}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={action !== 'Propose Reschedule'} />
              </label>
              <label className="pm-field"><span>Reason</span><input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
              <label className="pm-field"><span>Action notes</span><textarea rows={2} placeholder="e.g. call channel manager by Friday" /></label>
            </div>
            {saved && <Note tone="ok">Saved: <b>{saved}</b> assigned to {owner}. Status: proposed — not approved and not executed.</Note>}
            <Btn variant="primary" onClick={() => { setSaved(action); toast(`${action} saved and assigned to ${owner} (proposed).`); }}>Save & Assign Corrective Action</Btn>
          </Panel>
          <Panel title="Related exception">
            <p className="tm-muted"><b>{summary.campaign.villages.join(' · ')}</b> — {summary.atRisk ? `${summary.atRisk} activity risks require review.` : `${summary.campaign.stage} campaign status.`}</p>
            <Btn small to="tm.ex1">Open in Activity Tracker</Btn>
          </Panel>
        </div>
      </div>
      <Footer back={{ label: 'Return to Activity Tracker', to: 'tm.ex1' }}
        primary={{ label: 'Go to Impact & Learning', to: 'tm.im1' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.IM1 */
export function TmIm1() {
  const reached = IMPACT_VILLAGES.reduce((s, v) => s + v.reached, 0);
  const trials = IMPACT_VILLAGES.reduce((s, v) => s + v.trials, 0);
  const adopters = IMPACT_VILLAGES.reduce((s, v) => s + v.adopters, 0);
  const sales = IMPACT_VILLAGES.reduce((s, v) => s + v.sales, 0);
  const planned = IMPACT_VILLAGES.reduce((s, v) => s + v.planned, 0);
  const completed = IMPACT_VILLAGES.reduce((s, v) => s + v.completed, 0);
  return (
    <TmPage crumbs={[{ label: 'Impact & Learning' }, { label: CAMPAIGN.name }, { label: 'Campaign Performance' }]}
      code="TM.IM1" title="Campaign Results" status="Interim checkpoint"
      >
      <CampaignStrip />
      <Metrics items={[
        { label: 'Base-case forecast campaign sales', value: '₹12.00 L', sub: 'Planning forecast (CW.3)' },
        { label: 'Tracked campaign-linked sales to date', value: lakh(sales, 1), sub: 'Provisional attribution — not verified incremental', tone: 'amber' },
        { label: 'Completed activities', value: `${completed} / ${planned}`, sub: '2 scheduled · 2 at risk' },
        { label: 'Recorded adopters', value: adopters, tone: 'green' },
      ]} />
      <div className="pm-two">
        <Panel title="Farmer conversion funnel">
          <FunnelBars stages={[{ label: 'Farmers reached', value: reached }, { label: 'Trials', value: trials }, { label: 'Adopters', value: adopters }]} />
          <div className="tm-rates"><span>Reach → trial <b>{((trials / reached) * 100).toFixed(0)}%</b></span><span>Trial → adoption <b>{conversion(adopters, trials).toFixed(0)}%</b></span></div>
        </Panel>
        <Panel title="Business impact">
          <div className="tm-recon">
            <div><span>Tracked campaign-linked sales</span><b>{lakh(sales, 1)}</b></div>
            <div><span>Base forecast</span><b>₹12.00 L</b></div>
            <div className="tm-recon-gap"><span>Variance at this checkpoint</span><b>−{lakh(12 - sales, 1)}</b></div>
          </div>
          <ul className="tm-checks">
            <li className="warn"><span>Actual incremental contribution</span><Status>Not yet attributable</Status></li>
            <li className="warn"><span>Actual ROI</span><Status>Pending validation</Status></li>
            <li><span>Forecast net ROI (planning assumption)</span><Status tone="grey">+0.40×</Status></li>
          </ul>
          <small className="tm-muted">The linked ₹25.00 L objective is already within the ABP and is not double counted.</small>
        </Panel>
      </div>
      <div className="tm-map-row tm-map-row-right">
      <Panel title="Village-wise performance">
        <div className="table-wrap">
          <table className="dt pm-table tm-table">
            <thead><tr><th>Village</th><th className="r">Reached</th><th className="r">Trials</th><th className="r">Adopters</th><th className="r">Trial → adoption</th><th className="r">Activities (completed / planned)</th><th className="r">Tracked product sales</th><th>Open items</th></tr></thead>
            <tbody>
              {IMPACT_VILLAGES.map((v) => (
                <tr key={v.village}>
                  <td><b>{v.village}</b></td><td className="r">{v.reached}</td><td className="r">{v.trials}</td><td className="r">{v.adopters}</td>
                  <td className="r">{conversion(v.adopters, v.trials).toFixed(1)}%</td><td className="r">{v.completed} / {v.planned}</td><td className="r">{lakh(v.sales, 1)}</td>
                  <td><Status>{v.village === 'Dhanora' ? 'Demo at risk (stock)' : 'Meeting at risk (field confirmation)'}</Status></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td>Total</td><td className="r">{reached}</td><td className="r">{trials}</td><td className="r">{adopters}</td><td className="r">{conversion(adopters, trials).toFixed(1)}%</td><td className="r">{completed} / {planned}</td><td className="r">{lakh(sales, 1)}</td><td /></tr></tfoot>
          </table>
        </div>
      </Panel>
      <TmMap title="Trial-to-adoption by village" label="Campaign conversion by village" height={260}
        markers={IMPACT_VILLAGES.map((v) => ({
          id: v.village === 'Dhanora' ? 'v-dhanora' : 'v-wadigaon',
          label: `${v.village} · ${conversion(v.adopters, v.trials).toFixed(1)}%`,
          color: conversion(v.adopters, v.trials) < 45 ? MAP_COLORS.amber : MAP_COLORS.green,
          info: <><b>{v.village}</b><br />{v.reached} reached · {v.trials} trials · {v.adopters} adopters · {lakh(v.sales, 1)} tracked</>,
        }))}
        markerLegend={[{ label: 'Above campaign average (45%)', color: MAP_COLORS.green }, { label: 'Below average', color: MAP_COLORS.amber }]} />
      </div>
      <AiPanel title="AI Performance Insight">
        <p className="tm-ai-text">Wadi Gaon converts trials to adopters at {conversion(48, 98).toFixed(1)}% vs Dhanora's {conversion(24, 62).toFixed(1)}%. Investigate Dhanora's at-risk demonstration, stock timing, follow-up completion and activity effectiveness — causes are not yet verified.</p>
      </AiPanel>
      <Footer back={{ label: 'View Execution Details', to: 'tm.ex1' }}
        primary={{ label: 'Investigate Performance Drivers', to: 'tm.im2' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.IM2 */
export function TmIm2() {
  const [d, w] = IMPACT_VILLAGES;
  const gap = conversion(w.adopters, w.trials) - conversion(d.adopters, d.trials);
  return (
    <TmPage crumbs={[{ label: 'Impact & Learning', to: 'tm.im1' }, { label: CAMPAIGN.name }, { label: 'Campaign Performance', to: 'tm.im1' }, { label: 'Diagnostics & Learning' }]}
      code="TM.IM2" title="What Worked & Why" status="Interim · causes unverified"
      banner={<Note> interim checkpoint of an approved campaign — not a claim of actual Mahadhan results.</Note>}>
      <div className="pm-two">
        <Panel title="Village-wise conversion diagnostic">
          <HBars rows={[
            { label: 'Dhanora', value: conversion(d.adopters, d.trials), tone: 'amber', note: `${d.adopters} of ${d.trials} trials` },
            { label: 'Wadi Gaon', value: conversion(w.adopters, w.trials), tone: 'green', note: `${w.adopters} of ${w.trials} trials` },
          ]} max={60} />
          <table className="dt pm-table tm-table">
            <thead><tr><th>Village</th><th className="r">Reached</th><th className="r">Trials</th><th className="r">Adopters</th><th className="r">Trial → adoption</th></tr></thead>
            <tbody>{IMPACT_VILLAGES.map((v) => <tr key={v.village}><td>{v.village}</td><td className="r">{v.reached}</td><td className="r">{v.trials}</td><td className="r">{v.adopters}</td><td className="r">{conversion(v.adopters, v.trials).toFixed(1)}%</td></tr>)}</tbody>
            <tfoot><tr><td>Total</td><td className="r">640</td><td className="r">160</td><td className="r">72</td><td className="r">45.0%</td></tr></tfoot>
          </table>
          <div className="tm-gap-callout">Conversion gap: <b>{gap.toFixed(1)} percentage points</b> (Wadi Gaon ahead)</div>
        </Panel>
        <Panel title="Evidence-based performance drivers">
          <h4 className="tm-h4 tm-verified">Verified operational issues</h4>
          <ul className="tm-plain-list">
            <li>Dhanora stock-dependent demonstration remains at risk — stock confirmation pending.</li>
            <li>Wadi Gaon farmer meeting remains at risk — field confirmation pending.</li>
          </ul>
          <h4 className="tm-h4 tm-hypo">Unverified hypotheses (need evidence)</h4>
          <ul className="tm-plain-list">
            <li>Differences in trial-farmer follow-up between villages.</li>
            <li>Retailer advocacy strength in Dhanora.</li>
            <li>Contact quality during meetings and calls.</li>
          </ul>
          <div className="tm-evidence-links">
            <span>Evidence:</span>
            <Btn small to="tm.ex1">TM.EX1 Activity Tracker</Btn><Btn small to="tm.ex2">TM.EX2 Activity Follow-up</Btn><span className="tm-muted">CRM / field interaction data</span>
          </div>
          <div className="tm-confidence"><span>Data confidence</span><Status tone="amber">Medium — causal attribution unresolved</Status></div>
        </Panel>
      </div>
      <Panel title="Intervention effectiveness">
        <table className="dt pm-table tm-table">
          <thead><tr><th>Intervention</th><th className="r">Completed</th><th>Verified reach</th><th>Available outcome</th><th>Attribution</th></tr></thead>
          <tbody>
            <tr><td>Field demonstrations</td><td className="r">3 / 4</td><td>~210 farmers attended</td><td>60 trials linked to demo visits</td><td><Status>Pending</Status></td></tr>
            <tr><td>Retailer activation</td><td className="r">2 / 3</td><td>2 retailers · ~180 counter contacts</td><td>Partial — retailer sales not yet reconciled</td><td><Status>Pending</Status></td></tr>
            <tr><td>Farmer follow-ups</td><td className="r">1 / 2</td><td>~140 trial farmers contacted</td><td>Not measurable yet</td><td><Status>Not yet measurable</Status></td></tr>
          </tbody>
        </table>
        <small className="tm-muted">Reach overlaps between interventions and is not additive.</small>
      </Panel>
      <div className="pm-two">
        <div className="tm-learn">
          <div><h4>What worked</h4><p>Retailer activation and completed demos in Wadi Gaon coincide with higher trial-to-adoption.</p></div>
          <div><h4>What to investigate</h4><p>Dhanora follow-up completion and stock timing for trial farmers.</p></div>
          <div><h4>What to change</h4><p>Confirm stock before scheduling demos; decide on redistribution only after comparing retailer feedback.</p></div>
        </div>
        <AiPanel title="AI Learning & Recommendations">
          <ol className="tm-ai-list tm-ol">
            <li>Confirm Dhanora demonstration stock; reschedule only if necessary.</li>
            <li>Investigate follow-up completion for Dhanora trial farmers.</li>
            <li>Compare retailer participation and farmer feedback before redistributing activities.</li>
          </ol>
          <div className="tm-row-actions"><Btn small variant="primary" to="tm.ex2">Create Corrective Action</Btn><Btn small to="tm.ai1">Ask AI Copilot</Btn></div>
        </AiPanel>
      </div>
      <Footer back={{ label: 'Back to Campaign Performance', to: 'tm.im1' }}
        secondary={<Btn to="tm.ex2">Create Corrective Action</Btn>} primary={{ label: 'Ask AI Copilot', to: 'tm.ai1' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.AI1 */
/** Everything the Field Sales Manager screens show, handed to the live LLM as grounding context. */
const TM_FACTS = [
  'Persona: Field Sales Manager, Jalna Cluster, FY 2025-26. ',
  'Territories: Ambad Rs 3.2 Cr last year -> Rs 4.2 Cr ABP (+31.3%), Ghansawangi 2.8 -> 3.4 (+21.4%), Badnapur 2.0 -> 2.4 (+20%); cluster 8.0 -> 10.0 Cr (+25%).',
  'Last year: incentive achievement 92%, campaign ROI 1.60×, 3-year target attainment 94%.',
  'Ambad network: 8 dealers, 74 retailers. Dhanora 1 dealer/12 retailers (Sai Krushi Bhandar unmapped, Kisan Seva Kendra inactive); Wadi Gaon 1/14; Ambad HQ 3/22; Pimpalgaon 1/10; other villages 2/16.',
  'Outlet plan: 8 dealers Rs 320 L last year -> Rs 380 L proposed (+18.8%) vs ABP Rs 420 L; gap Rs 40 L (90.5% allocated). Dhanora Agro Inputs 48->55 L, Ambad Crop Depot 36->43, Shiv Krushi Kendra 42->50 (flagged for potential review), Mahalaxmi Agro 45->53, other 4 dealers 149->179.',
  'Onion village plan Rs 165 L: Dhanora Rs 12 L / 15 MT (last year Rs 10 L / 10 MT, 500 -> 750 acres at 20 kg/acre; realisation Rs 100 -> 80/kg, -20%), Wadi Gaon 28, Ambad HQ 42, Pimpalgaon 23, other villages 60 (history unverified).',
  'Crop plan: Onion 1.65 Cr, Maize 1.10 Cr, Other 1.05 Cr = 3.80 Cr. Approved plan v3: Onion 1.90 (+25 L), Maize 1.25 (+15 L), Other 1.05 = 4.20 Cr.',
  'Campaign Ambad Onion Croptek Conversion (Dhanora, Wadi Gaon, 3 retailers): the current activity budget is supplied from the editable CW.2 draft. Linked objective Rs 25 L (inside ABP). Forecasts use Rs 100/kg and 35% contribution margin. Approval routes to Business Head when the live draft reaches Rs 5 L.',
  'Execution: 13 activities = 3 completed, 8 scheduled, 2 at risk: Dhanora field demonstration week 2 (stock confirmation pending, owner R. Jadhav) and Wadi Gaon farmer meeting week 2 (field confirmation pending).',
  'Impact checkpoint: reached 640, trials 160, adopters 72 (reach->trial 25%, trial->adoption 45%). Dhanora 280/62/24 = 38.7%, Rs 2.0 L tracked; Wadi Gaon 360/98/48 = 49.0%, Rs 3.4 L tracked. Gap 10.3 pp. Tracked sales Rs 5.4 L vs Rs 12 L base forecast (provisional, not verified incremental). Activities 9 of 13 completed at this checkpoint.',
  'Verified issues: Dhanora demo stock pending; Wadi Gaon meeting field confirmation pending. Unverified hypotheses: follow-up quality, retailer advocacy, contact quality. Actual ROI not yet attributable.',
  'Other priorities: Maize portfolio expansion Rs 15 L (Ambad HQ, Pimpalgaon) - draft campaign Rs 2.2 L, not modelled; retailer advocacy programme not drafted. Kharif 2025: Ghansawangi soybean sulphur campaign ROI 1.80×, Badnapur cotton retailer activation ROI 1.40×.',
].join('\n');

const TM_SUGGESTIONS = [
  'Why is Croptek adoption lower in Dhanora, and what should I do?',
  'Which activities are at risk this week?',
  'How can I close the ₹13.00 L gap to the onion objective?',
  'Is the Maize ₹15.00 L priority ready for a campaign?',
  'Which dealers should I review to close the ₹40.00 L ABP gap?',
];

export function TmAi1() {
  const { lines, total } = useCampaignDraft();
  const pageContext = [...TM_FACTS, `Live CW.2 campaign budget: Rs ${total.toFixed(2)} L across ${lines.length} editable activities.`].join('\n');
  return (
    <TmPage crumbs={[{ label: 'AI Copilot' }, { label: CAMPAIGN.name }, { label: 'Campaign Diagnostics' }]}
      code="TM.AI1" title="AI Copilot" status="Live AI · evidence-linked · causation not yet verified">
      <div className="tm-copilot">
        <aside className="tm-copilot-left">
          <div><h5>What the copilot can see</h5>
            {['Territory plan & ABP (TM.1–TM.5)', 'Outlet & village plans', 'Campaign wizard & approval', 'Execution calendar & risks', 'Impact & diagnostics', 'Backend datasets & KPIs (when connected)'].map((item) => <span key={item} className="tm-muted">• {item}</span>)}
          </div>
          <div><h5>Ground rules</h5><span className="tm-muted">Answers only from CampaignIQ data, flags unverified causes, never prescribes doses or prices.</span></div>
        </aside>
        <section className="tm-copilot-main">
          <div className="tm-thread">
            <div className="tm-turn">
              <div className="tm-q"><UserRound size={14} /><span>Why is Croptek adoption lower in Dhanora, and what should I do?</span></div>
              <div className="tm-a"><Bot size={14} />
                <div>
                  <p>Dhanora converts <b>24 of 62 trials (38.7%)</b> against Wadi Gaon's <b>48 of 98 (49.0%)</b> — a <b>10.3 percentage-point</b> gap.</p>
                  <HBars rows={[{ label: 'Dhanora', value: 38.7, tone: 'amber' }, { label: 'Wadi Gaon', value: 49.0, tone: 'green' }]} max={60} />
                  <div className="tm-ai-split">
                    <div><h5 className="tm-verified">Verified operational issue</h5><p>The Dhanora field demonstration is at risk: <b>stock confirmation pending</b>. The Wadi Gaon meeting is also pending field confirmation.</p></div>
                    <div><h5 className="tm-hypo">Unverified hypotheses</h5><p>Follow-up quality and retailer influence may contribute but need validation. No proven causal attribution.</p></div>
                  </div>
                  <small className="tm-muted">Pinned analysis · ask follow-up questions to the live copilot below.</small>
                </div>
              </div>
            </div>
          </div>
          <LiveCopilot persona="Field Sales Manager" screen="tm.ai1" pageContext={pageContext} suggestions={TM_SUGGESTIONS}
            intro="Ask a follow-up about your plan, campaigns, execution or impact. The live model answers from the Field Sales Manager figures in this tool." />
        </section>
        <aside className="tm-copilot-right">
          <Panel title="Context">
            <dl className="tm-facts">
              <div><dt>Campaign</dt><dd>{CAMPAIGN.name}</dd></div>
              <div><dt>Selected village</dt><dd>Dhanora</dd></div>
              <div><dt>Linked objective</dt><dd>₹25.00 L — already in the ₹4.20 Cr Ambad ABP</dd></div>
              <div><dt>Status</dt><dd><Status>In progress</Status></dd></div>
            </dl>
          </Panel>
          <Panel title="Recommended actions">
            <ol className="tm-ai-list tm-ol"><li>Confirm stock with the channel manager.</li><li>Validate Dhanora follow-up records.</li><li>Decide: reschedule, reassign or escalate.</li></ol>
            <Btn variant="primary" to="tm.ex2">Create Corrective Action</Btn>
            <Btn to="tm.im2">View Detailed Diagnostics</Btn>
          </Panel>
        </aside>
      </div>
      <Footer back={{ label: 'Back to Diagnostics', to: 'tm.im2' }}
        primary={{ label: 'Create Corrective Action', to: 'tm.ex2' }} />
    </TmPage>
  );
}

/** Screens 13–14 — Impact & Learning: campaign impact and village-wise conversion diagnostic. */
import { BotMessageSquare, ChartColumn, CircleAlert, CircleCheck, Coins, Filter, Lightbulb, ListChecks, Search, Sprout, Target, TriangleAlert, Wrench, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { netRoi } from '../../data/bh';
import { lakh, num, pct, times } from '../../data/format';
import {
  activityName, AT_RISK_ACTIVITY, campaignFunnel, executionCounts, FSM_CAMPAIGN, impactSummary, interventionEffectiveness, scenarioOutcome, SCENARIOS, spendToDate,
  villagePerformance, BUSINESS_PRIORITIES,
} from '../../data/fsm';
import { F } from '../../routes';
import { SERIES } from '../../theme';
import { HBars } from '../../ui/charts';
import { Button, Card, FilterRows, KpiCard, StatusChip } from '../../ui/core';
import { DataTable, type Column } from '../../ui/DataTable';
import { ALL, useGo } from '../common';
import { useUnits } from './Execution';
import { FsmPage } from './frame';

const SECTION = 'Impact & learning';
const opt = (value: string, label = value) => ({ value, label });

function List({ items }: { items: { icon?: LucideIcon; label: ReactNode; value?: ReactNode; tone?: 'warn' }[] }) {
  return <>{items.map((i, k) => <div key={k} className="list-row">{i.icon && <i.icon size={16} color={i.tone === 'warn' ? 'var(--amber)' : undefined} />}<span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}</div>)}</>;
}

type Row = ReturnType<typeof villagePerformance>[number];
type ImpactView = 'villages' | 'activities';
type ImpactSort = 'conversion' | 'adopters' | 'trials' | 'sales';

/** Shared filter rows for the impact and diagnostic screens. */
function useImpactFilters() {
  const [village, setVillage] = useState(ALL);
  const [view, setView] = useState<ImpactView>('villages');
  const [sortBy, setSortBy] = useState<ImpactSort>('conversion');
  const vp = villagePerformance(useUnits());
  const rows = vp.filter((v) => village === ALL || v.name === village)
    .sort((a, b) => ({ conversion: b.conversionPct - a.conversionPct, adopters: b.adopters - a.adopters, trials: b.trials - a.trials, sales: b.sales - a.sales }[sortBy]));
  const header = (
    <FilterRows<ImpactView> view={view} setView={setView} views={[{ value: 'villages', label: 'Villages' }, { value: 'activities', label: 'Activities' }]}
      filters={[
        { key: 'territory', label: 'Territory', value: 'ambad', options: [opt('ambad', 'Ambad')], onChange: () => undefined },
        { key: 'village', label: 'Village', value: village, options: [opt(ALL, 'All villages'), ...vp.map((v) => opt(v.name))], onChange: setVillage },
        { key: 'crop', label: 'Crop', value: FSM_CAMPAIGN.crop, options: [opt(FSM_CAMPAIGN.crop)], onChange: () => undefined },
        { key: 'product', label: 'Product', value: FSM_CAMPAIGN.product, options: [opt(FSM_CAMPAIGN.product)], onChange: () => undefined },
      ]}
      extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: (v) => setSortBy(v as ImpactSort), options: [opt('conversion', 'Trial-to-adoption'), opt('adopters', 'Adopters'), opt('trials', 'Trials'), opt('sales', 'Tracked sales')] }]} />
  );
  return { header, view, rows, all: vp, village };
}

function VillageTable({ rows, compact }: { rows: ReturnType<typeof villagePerformance>; compact?: boolean }) {
  return (
    <DataTable rows={rows} rowKey={(v) => v.name}
      columns={[
        { key: 'n', header: 'Village', render: (v) => <span className="row" style={{ justifyContent: 'center' }}><b>{v.name}</b>{v.campaign && <StatusChip tone="info">Campaign</StatusChip>}</span> },
        { key: 'f', header: 'Farmers reached', align: 'right', render: (v) => (v.farmers === null ? '–' : num(v.farmers)) },
        { key: 't', header: 'Trials', align: 'right', render: (v) => num(v.trials) },
        { key: 'a', header: 'Adopters', align: 'right', render: (v) => num(v.adopters) },
        { key: 'c', header: 'Trial-to-adoption', align: 'right', render: (v) => pct(v.conversionPct) },
        ...(compact ? [] : [{ key: 'u', header: 'Units planned / done', align: 'right', render: (v: Row) => (v.planned ? `${v.planned} / ${v.completed}` : '–') },
        { key: 's', header: 'Tracked sales', align: 'right', render: (v: Row) => (v.sales ? lakh(v.sales, 1) : '–') },
        { key: 'r', header: 'Status', align: 'center', render: (v: Row) => (v.atRisk.length ? <StatusChip tone="warn">{`${v.atRisk.length} at risk`}</StatusChip> : v.planned ? <StatusChip tone="ok">On track</StatusChip> : '–') }] as Column<Row>[]),
      ]}
      total={rows.length > 1 ? {
        n: 'Total', f: num(rows.reduce((s, v) => s + (v.farmers ?? 0), 0)), t: num(rows.reduce((s, v) => s + v.trials, 0)), a: num(rows.reduce((s, v) => s + v.adopters, 0)),
        c: pct((rows.reduce((s, v) => s + v.adopters, 0) / rows.reduce((s, v) => s + v.trials, 0)) * 100), s: lakh(rows.reduce((s, v) => s + v.sales, 0), 1),
      } : undefined} />
  );
}

function ActivityTable() {
  const rows = interventionEffectiveness(useUnits());
  return (
    <DataTable rows={rows} rowKey={(r) => r.id}
      columns={[
        { key: 'n', header: 'Activity', render: (r) => <b>{r.name}</b> },
        { key: 'c', header: 'Completed / planned', align: 'right', render: (r) => `${r.completed} / ${r.planned}` },
        { key: 'r', header: 'Farmers reached', align: 'right', render: (r) => num(r.reach) },
        { key: 's', header: 'Spend to date', align: 'right', render: (r) => lakh(r.spend, 2) },
        { key: 'b', header: 'Budget', align: 'right', render: (r) => lakh(r.budget, 2) },
        { key: 'st', header: 'Status', align: 'center', render: (r) => (r.atRisk ? <StatusChip tone="warn">{`${r.atRisk} at risk`}</StatusChip> : r.completed === r.planned ? <StatusChip tone="ok">Completed</StatusChip> : <StatusChip tone="neutral">In progress</StatusChip>) },
      ]}
      total={{ n: 'Total', c: `${rows.reduce((s, r) => s + r.completed, 0)} / ${rows.reduce((s, r) => s + r.planned, 0)}`, r: num(rows.reduce((s, r) => s + r.reach, 0)), s: lakh(rows.reduce((s, r) => s + r.spend, 0), 2), b: lakh(rows.reduce((s, r) => s + r.budget, 0), 2) }} />
  );
}

// ================================================================ 13 Campaign Impact & Business Performance
export function CampaignImpact() {
  const go = useGo();
  const units = useUnits();
  const f = useImpactFilters();
  const s = impactSummary();
  const k = executionCounts(units);
  const fn = campaignFunnel();
  const spend = spendToDate(units);
  const atRisk = units.filter((u) => u.status === 'at_risk');
  const base = scenarioOutcome(SCENARIOS[1].sales);

  return (
    <FsmPage section={SECTION} sectionTo={F.impact} trail={FSM_CAMPAIGN.name} title="Campaign Impact & Business Performance" back={F.activity(AT_RISK_ACTIVITY)} next={F.diagnostic} nextLabel="Investigate performance drivers">
      {f.header}
      <div className="kpis">
        <KpiCard label="Base-case forecast sales" value={lakh(s.forecast, 1)} />
        <KpiCard label="Tracked campaign-linked sales" value={lakh(s.tracked, 1)} />
        <KpiCard label="Activities completed" value={`${k.completed} / ${k.planned}`} />
        <KpiCard label="Recorded adopters" value={num(s.adopters)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
        <Card title="Farmer conversion funnel" note="Campaign villages: Dhanora, Wadi Gaon" icon={Filter}>
          <div className="funnel">
            <div><span>Farmers reached</span><b>{num(fn.reached)}</b></div>
            <div><span>Trials</span><b>{num(fn.trials)}</b></div>
            <div className="on"><span>Adopters</span><b>{num(fn.adopters)}</b></div>
            <div className="rates"><span>Reach-to-trial <b>{pct(fn.reachToTrialPct)}</b></span><span>Trial-to-adoption <b>{pct(fn.trialToAdoptionPct)}</b></span></div>
          </div>
        </Card>
        <Card title="Campaign status" icon={ListChecks} right={<Button small onClick={() => go(F.execution)}>View execution details</Button>}>
          <div className="recon">
            <div><span>Completed</span><b>{k.completed}</b></div>
            <div><span>Scheduled</span><b>{k.scheduled}</b></div>
            <div><span>At risk</span><b className={k.atRisk ? 'warn' : ''}>{k.atRisk}</b></div>
            <div className="grow"><span>{k.planned} activity units · at risk: {atRisk.map((u) => `${u.village} ${activityName(u.activity).toLowerCase()}`).join(', ') || 'none'}</span></div>
          </div>
        </Card>
        </div>
        <Card title="Business impact" icon={Coins}>
          <List items={[
            { label: 'Tracked campaign-linked sales', value: lakh(s.tracked, 1) },
            { label: 'Base-case forecast', value: lakh(s.forecast, 1) },
            { icon: TriangleAlert, tone: 'warn', label: 'Variance at this checkpoint', value: lakh(s.variance, 1) },
            { label: 'Linked growth objective', value: lakh(BUSINESS_PRIORITIES[0].uplift!) },
            { label: 'Spend to date', value: lakh(spend, 2) },
            { label: 'Net ROI to date', value: times(netRoi(s.tracked, spend)) },
            { label: 'Forecast net ROI (base case)', value: times(base.netRoi) },
          ]} />
        </Card>
      </div>
      <Card title={f.view === 'villages' ? 'Village-wise performance' : 'Intervention effectiveness'} icon={ChartColumn} flush>
        {f.view === 'villages' ? <VillageTable rows={f.rows} /> : <ActivityTable />}
      </Card>
    </FsmPage>
  );
}

// ================================================================ 14 Village-wise Conversion Diagnostic
export function VillageDiagnostic() {
  const go = useGo();
  const units = useUnits();
  const f = useImpactFilters();
  const s = impactSummary();
  const sorted = [...f.all].sort((a, b) => b.conversionPct - a.conversionPct);
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  const atRisk = units.filter((u) => u.status === 'at_risk');
  const eff = interventionEffectiveness(units);
  const followUp = eff.find((e) => e.id === 'followup')!;

  return (
    <FsmPage section={SECTION} sectionTo={F.impact} trail={FSM_CAMPAIGN.name} title="Village-wise Conversion Diagnostic" back={F.impact} next={F.assistant}>
      {f.header}
      <div className="kpis">
        <KpiCard label={`${hi.name} trial-to-adoption`} value={pct(hi.conversionPct)} />
        <KpiCard label={`${lo.name} trial-to-adoption`} value={pct(lo.conversionPct)} />
        <KpiCard label="Village conversion gap (pp)" value={s.villageGap.toFixed(1)} />
        <KpiCard label="Ambad trial-to-adoption" value={pct(s.trialToAdoptionPct)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)' }}>
        <Card title="Trial-to-adoption by village" icon={ChartColumn}>
          <HBars fill rows={sorted.map((v) => ({ label: v.name, values: [v.conversionPct], title: `${v.name} · Trials ${num(v.trials)} · Adopters ${num(v.adopters)} · ${pct(v.conversionPct)}` }))} series={[{ key: 'c', label: 'Trial-to-adoption', color: SERIES.planned }]} max={60} format={(v) => pct(v)} labelWidth={110} />
        </Card>
        <Card title={f.view === 'villages' ? 'Comparative conversion metrics' : 'Intervention effectiveness'} icon={Target} flush>
          {f.view === 'villages' ? <VillageTable compact rows={f.rows} /> : <ActivityTable />}
        </Card>
      </div>
      <div className="grid g3">
        <Card title="What worked" icon={CircleCheck}>
          <List items={[
            { icon: CircleCheck, label: `Higher trial-to-adoption in ${hi.name} (${pct(hi.conversionPct)}).` },
            ...eff.filter((e) => e.completed === e.planned).map((e) => ({ icon: CircleCheck, label: `${e.name} completed (${e.completed} of ${e.planned}).` })),
          ]} />
        </Card>
        <Card title="What to investigate" icon={Search}>
          <List items={[
            ...atRisk.map((u) => ({ icon: TriangleAlert, tone: 'warn' as const, label: `${u.village} ${activityName(u.activity).toLowerCase()}: ${u.issue?.toLowerCase()}.` })),
            { icon: CircleAlert, tone: 'warn', label: `Follow-up completion for trial farmers (${followUp.completed} of ${followUp.planned} rounds).` },
            { icon: CircleAlert, tone: 'warn', label: `Retailer advocacy and contact quality in ${lo.name}.` },
          ]} />
        </Card>
        <Card title="What to change" icon={Lightbulb} right={<>
          <Button small icon={Wrench} onClick={() => go(F.activity(atRisk[0]?.id ?? AT_RISK_ACTIVITY))}>Create corrective action</Button>
          <Button small icon={BotMessageSquare} onClick={() => go(F.assistant)}>Open AI Copilot workspace</Button>
        </>}>
          <List items={[
            { icon: Sprout, label: atRisk.length ? `Resolve ${atRisk.length} at-risk activit${atRisk.length === 1 ? 'y' : 'ies'} before the next checkpoint.` : 'All at-risk activities have corrective actions.' },
            { icon: Sprout, label: `Close the ${s.villageGap.toFixed(1)} pp gap: reinforce follow-ups in ${lo.name}.` },
            { icon: Sprout, label: `Tracked sales ${lakh(s.tracked, 1)} against a ${lakh(s.forecast, 1)} forecast; review the activity mix if the variance holds.` },
          ]} />
        </Card>
      </div>
    </FsmPage>
  );
}

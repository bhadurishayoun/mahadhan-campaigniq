/** Screen 5 — Campaign Effectiveness (mockup BH.2a.png) with screen 6 — Campaign Diagnostics drawer (BH.2b.png). */
import { CheckCircle2, LineChart, Wallet, ChartColumn, Coins, FileSearch, Stethoscope, Target } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AMBAD, ambadMetrics, businessCase, netRoi, regionRoi, campaignById, campaignMetrics, campaignsOf, campaignTotals, regionById, type Campaign, type CampaignId } from '../data/bh';
import { lakh, num, pct, pp, ratio, times } from '../data/format';
import { R } from '../routes';
import { SERIES } from '../theme';
import { HBars, Legend } from '../ui/charts';
import { Bar, Breadcrumb, Button, Card, FooterBar, KpiCard, PageHeader, PanelFooter, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { Drawer, EvidenceDrawer, type Evidence } from '../ui/overlay';
import { useBhStore } from '../store/bhStore';
import { ApproveThemeButton, useGo, useRouteRegion } from './common';


export function Effectiveness() {
  const go = useGo();
  const region = useRouteRegion();
  const r = regionById(region);
  const [params, setParams] = useSearchParams();
  const camps = campaignsOf(region);
  const selectedId = (params.get('campaign') as CampaignId | null) ?? camps[0]?.id ?? null;
  const drawer = params.get('drawer');
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v)));
    setParams(p);
  };
  const tot = camps.length ? campaignTotals(region) : null;
  const sel = selectedId ? campaignById(selectedId) : null;

  const attributionEvidence = (c: Campaign): Evidence => ({
    title: `Attribution evidence — ${c.name}`,
    owner: 'Zonal Manager attribution record',
    status: <StatusChip tone="ok">Complete</StatusChip>,
    facts: [
      { label: 'Campaign', value: c.name },
      { label: 'Recorded adopters', value: num(c.adopters) },
      { label: 'Purchase matching', value: 'Complete' },
      { label: 'Comparable sales baseline', value: 'Complete' },
      { label: 'Validated incremental sales', value: lakh(c.sales) },
      { label: 'Net ROI', value: times(netRoi(c.sales, c.actual)) },
    ],
  });

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Campaign Portfolio Performance', onClick: () => go(R.portfolio) }, { label: `${r.name} region`, onClick: () => go(R.region(region)) }, { label: 'Campaign effectiveness' }]} />
      <PageHeader title={`${r.name} Region Campaign Effectiveness`} />
      <div className="kpis">
        <KpiCard label="Active campaigns" value={r.campaigns} />
        <KpiCard label="Recorded adopters" value={num(r.adopters)} />
        <KpiCard label="Marketing investment" value={lakh(r.actual)} />
        <KpiCard label="Validated incremental sales" value={lakh(r.sales)} />
      </div>

      <Card title="Campaign outcome scorecard" icon={Target} flush>
        {camps.length && tot ? (
          <DataTable
            rows={camps}
            rowKey={(c) => c.id}
            selected={selectedId}
            selectable
            onRowClick={(c) => set({ campaign: c.id })}
            columns={[
              { key: 'name', header: 'Campaign', render: (c) => c.name },
              { key: 'plan', header: 'Planned execution', align: 'right', render: (c) => `${c.plannedExec}%` },
              { key: 'obs', header: 'Observed execution', align: 'right', render: (c) => `${c.observedExec}%` },
              { key: 'target', header: 'Adoption target (checkpoint)', align: 'right', render: (c) => num(c.adoptionTarget) },
              { key: 'adopt', header: 'Recorded adopters', align: 'right', render: (c) => num(c.adopters) },
              { key: 'ach', header: 'Adoption achievement', render: (c) => <span className="progress"><Bar value={campaignMetrics(c).adoptionPct} /><b>{pct(campaignMetrics(c).adoptionPct)}</b></span> },
              { key: 'sales', header: 'Validated incremental sales', align: 'right', render: (c) => lakh(c.sales) },
              { key: 'roi', header: 'Net ROI', align: 'center', render: (c) => <StatusChip tone="ok">{times(netRoi(c.sales, c.actual))}</StatusChip> },
            ]}
            total={{ name: 'Total', plan: `${tot.plannedExec}%`, obs: `${tot.observedExec}%`, target: num(tot.target), adopt: num(tot.adopters), ach: <span className="progress"><Bar value={tot.adoptionPct} /><b>{pct(tot.adoptionPct)}</b></span>, sales: lakh(r.sales), roi: <StatusChip tone="ok">{times(regionRoi(r))}</StatusChip> }}
          />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">Campaign-level records pending</StatusChip></div>}
      </Card>

      {sel && (
        <div className="grid g2">
          <Card title="Target vs recorded adoption" icon={ChartColumn} right={<Legend series={[{ key: 't', label: 'Target', color: SERIES.planned }, { key: 'r', label: 'Recorded', color: SERIES.observed }]} />}>
            <HBars rows={camps.map((c) => ({ label: c.short, values: [c.adoptionTarget, c.adopters] }))}
              series={[{ key: 'target', label: 'Target', color: SERIES.planned }, { key: 'recorded', label: 'Recorded', color: SERIES.observed }]}
              max={Math.max(...camps.map((c) => c.adoptionTarget))} format={num} />
          </Card>
          <CommercialStrip c={sel} onDiagnostics={() => set({ drawer: 'diagnostics', campaign: sel.id })} onEvidence={() => setEvidence(attributionEvidence(sel))} />
        </div>
      )}

      <FooterBar onBack={() => go(R.region(region))} onNext={() => go(R.investment)} />

      {drawer === 'diagnostics' && sel && <Diagnostics c={sel} onClose={() => set({ drawer: null })} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}

function CommercialStrip({ c, onDiagnostics, onEvidence }: { c: Campaign; onDiagnostics: () => void; onEvidence: () => void }) {
  const m = campaignMetrics(c);
  const bc = businessCase(c.id);
  const panels: { title: string; icon: typeof Wallet; rows: { label: string; value: string; good?: boolean }[] }[] = [
    { title: 'Investment', icon: Wallet, rows: [{ label: 'Envelope', value: lakh(c.approved) }, { label: 'Investment', value: lakh(c.actual) }, { label: 'Utilisation', value: pct(m.utilisationPct, 0) }] },
    { title: 'Forecast', icon: LineChart, rows: [{ label: 'Incr. sales', value: lakh(bc.forecastSales) }, { label: 'Contribution', value: lakh(bc.contribution) }, { label: 'Net ROI', value: times(bc.netRoi) }] },
    { title: 'Actual', icon: CheckCircle2, rows: [{ label: 'Incr. sales', value: lakh(bc.validatedSales) }, { label: 'Net ROI', value: times(bc.actualRoi), good: true }, { label: 'vs forecast', value: times(bc.actualRoi - bc.netRoi), good: true }] },
  ];
  return (
    <Card className="ce-card" title={`${c.name}`} icon={Coins} right={<><Button small icon={Stethoscope} onClick={onDiagnostics}>Diagnostics</Button><Button small icon={FileSearch} onClick={onEvidence}>Attribution evidence</Button></>}>
      <div className="ce-panels">
        {panels.map((p) => (
          <div key={p.title} className="ce-panel">
            <div className="ce-panel-title"><p.icon size={16} />{p.title}</div>
            {p.rows.map((r) => <div key={r.label} className="ce-row"><span>{r.label}</span><b className={r.good ? 'good' : undefined}>{r.value}</b></div>)}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Diagnostics({ c, onClose }: { c: Campaign; onClose: () => void }) {
  const go = useGo();
  const store = useBhStore();
  const m = campaignMetrics(c);
  /** Opens the intervention request for this campaign, creating a draft in the register if none exists. */
  const requestIntervention = () => {
    const existing = store.interventions.find((i) => i.campaign === c.id && i.category === 'Performance');
    const id = existing?.id ?? `${c.id}-review`;
    if (!existing) store.addIntervention({ id, name: `${c.short} performance review`, category: 'Performance', geography: regionById(c.region).name, trigger: `${m.execVariance} pp execution variance`.replace('-', '–'), role: 'Marketing Head', priority: 'High', status: 'draft', statusLabel: 'Draft not sent', campaign: c.id, deliverable: 'Campaign recovery assessment' });
    go(R.intervention(id));
  };
  const bc = businessCase(c.id);
  const a = ambadMetrics();
  const execAch = ratio(c.observedExec, c.plannedExec);
  const variance = [
    { kpi: 'Programme execution', plan: `${c.plannedExec}%`, actual: `${c.observedExec}%`, status: <StatusChip tone="warn">{pp(m.execVariance)}</StatusChip> },
    { kpi: 'Recorded adoption', plan: num(c.adoptionTarget), actual: num(c.adopters), status: <StatusChip tone="warn">–{m.shortfall}</StatusChip> },
    { kpi: 'Investment (envelope)', plan: lakh(c.approved), actual: lakh(c.actual), status: <StatusChip tone="ok">{pct(m.utilisationPct, 0)}</StatusChip> },
    { kpi: 'Incremental sales (forecast vs validated)', plan: lakh(bc.forecastSales), actual: lakh(bc.validatedSales), status: <StatusChip tone={bc.validatedSales >= bc.forecastSales ? 'ok' : 'warn'}>{pct(ratio(bc.validatedSales, bc.forecastSales), 0)}</StatusChip> },
    { kpi: 'Net ROI (forecast vs actual)', plan: times(bc.netRoi), actual: times(bc.actualRoi), status: <StatusChip tone={bc.actualRoi >= bc.netRoi ? 'ok' : 'warn'}>{bc.actualRoi >= bc.netRoi ? 'Above forecast' : 'Below forecast'}</StatusChip> },
  ];
  const drivers = [
    ...AMBAD.interventions.map((i) => { const p = ratio(i.done, i.planned); return { id: i.name, driver: i.name, progress: `${i.done} / ${i.planned}`, status: <StatusChip tone={p >= 75 ? 'ok' : 'warn'}>{pct(p, p % 1 ? 1 : 0)}</StatusChip> }; }),
    { id: 'gap', driver: `Village conversion gap (${a.lowest.name} ${pct(a.lowest.pct)} vs ${a.highest.name} ${pct(a.highest.pct)})`, progress: `${a.villageGap.toFixed(1)} pp`, status: <StatusChip tone="warn">Review</StatusChip> },
    { id: 'attr', driver: 'Sales attribution', progress: lakh(c.sales), status: <StatusChip tone="ok">Complete</StatusChip> },
  ];
  const achievement = [
    { label: 'Execution', value: execAch, detail: `${c.observedExec}% / ${c.plannedExec}%` },
    { label: 'Adoption', value: m.adoptionPct, detail: `${num(c.adopters)} / ${num(c.adoptionTarget)}` },
    { label: 'Budget utilisation', value: m.utilisationPct, detail: `${lakh(c.actual)} / ${lakh(c.approved)}` },
  ];
  return (
    <Drawer
      title={`${c.name} — performance diagnostics`}
      onClose={onClose}
      footer={<PanelFooter onBack={onClose} action={<Button small primary onClick={requestIntervention}>Request strategic intervention</Button>} />}
    >
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <KpiCard label="Execution variance" value={pp(m.execVariance)} />
        <KpiCard label="Adoption shortfall" value={num(m.shortfall)} />
        <KpiCard label="Budget utilisation" value={pct(m.utilisationPct, 0)} />
      </div>
      <div className="grid g2">
        <Card title={`Campaign performance variance (${regionById(c.region).name})`} flush>
          <DataTable rows={variance} rowKey={(v) => v.kpi} columns={[
            { key: 'k', header: 'KPI', render: (v) => v.kpi },
            { key: 'p', header: 'Plan / forecast', align: 'right', render: (v) => v.plan },
            { key: 'a', header: 'Observed / actual', align: 'right', render: (v) => v.actual },
            { key: 's', header: 'Status', align: 'center', render: (v) => v.status },
          ]} />
        </Card>
        <Card title="Performance driver matrix" note="Ambad, local subset" flush>
          <DataTable rows={drivers} rowKey={(d) => d.id} columns={[
            { key: 'd', header: 'Driver', render: (d) => d.driver },
            { key: 'p', header: 'Progress', align: 'right', render: (d) => d.progress },
            { key: 's', header: 'Status', align: 'center', render: (d) => d.status },
          ]} />
        </Card>
      </div>
      <Card title="Target achievement" note="at checkpoint" right={<ApproveThemeButton match={{ region: c.region }} />}>
        {achievement.map((x) => (
          <div key={x.label} className="row" style={{ gap: 14 }}><span style={{ width: 140 }}>{x.label}</span><Bar value={x.value} /><b className="ok-text" style={{ width: 54, textAlign: 'right' }}>{pct(x.value, 0)}</b><span className="muted" style={{ width: 110 }}>{x.detail}</span></div>
        ))}
      </Card>
    </Drawer>
  );
}

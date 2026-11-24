/** Zonal Manager screens 15–19: business case, scenario simulator, audience reconciliation, proposals, revision. */
import { ArrowRight, Calculator, ChartColumn, CircleCheck, ClipboardCheck, Eye, FileSearch, GitCompare, History, ListChecks, MessageSquare, Palette, Scale, Send, ShieldCheck, SlidersHorizontal, Target, Users } from 'lucide-react';
import { Fragment, useState } from 'react';
import { lakh, num, pct, times } from '../../data/format';
import {
  AUDIENCE, businessCaseC2, CONCEPTS, CROPTEK_EVIDENCE, DRIVER_ROWS, DRIVERS, driverBridge, MH_RETURN, PROPOSALS, reconciliation, scenariosFor,
  SUBMISSION_CHECKS, trialToPurchasePct, type Drivers, type ProposalStatus, type ScenarioKey,
} from '../../data/zm';
import { Z } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore } from '../../store/zmStore';
import { SERIES } from '../../theme';
import { GroupedBars } from '../../ui/charts';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, KpiCard, StatusChip, type Tone } from '../../ui/core';
import { EvidenceDrawer, Modal, type Evidence } from '../../ui/overlay';
import { useGo } from '../common';
import { StudioTabs, ZmPage, ZM_SECTION } from './frame';
import { EditBar, Field, LeaveGuard, List, Notes } from './parts';

const C1 = CONCEPTS[0];
const C2 = CONCEPTS[1];
const l1 = (x: number) => lakh(Math.round(x * 10) / 10, 1);
const fmtDriver = (key: string, v: number) => (key === 'realisationPerMt' ? `₹${num(v)}` : key === 'investment' || key === 'sales' ? l1(v) : key === 'volumePerBuyerMt' || key === 'volumeMt' ? `${v.toFixed(2).replace(/\.?0+$/, '')}` : num(v));
const VALID_TONE = (v: string): Tone => (v === 'Derived' ? 'neutral' : v === 'Draft' ? 'neutral' : v === 'Not yet reconciled' ? 'risk' : 'warn');

/** Saved driver inputs (store) or the defaults. */
function useDrivers(): Drivers {
  const zm = useZmStore();
  return zm.drivers ?? DRIVERS;
}

// ================================================================ 15 Business Case: Assumptions and Calculation
export function BusinessCase() {
  const bh = useBhStore();
  const zm = useZmStore();
  const saved = useDrivers();
  const [d, setD] = useState<Drivers>(saved);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const keys = Object.keys(DRIVERS) as (keyof Drivers)[];
  const changed = keys.filter((k) => d[k] !== saved[k]);
  const b = driverBridge(d);
  const bs = driverBridge(saved);
  const save = () => { zm.setDrivers(d); bh.toast(`Assumptions saved · forecast ${l1(b.sales)}, ROI ${times(b.netRoi)}`); };
  const valueOf = (key: string) => (key === 'buyers' ? b.buyers : key === 'volumeMt' ? b.volumeMt : key === 'sales' ? b.sales : d[key as keyof Drivers]);
  const set = (key: keyof Drivers, v: string) => setD({ ...d, [key]: Math.max(0, Number(v) || 0) });
  const src: Evidence = {
    title: 'Source records: C1 business case', owner: 'CRM cohort, product master, sales / ERP and finance guidance',
    facts: [
      { label: 'CRM eligible cohort', value: `${num(saved.eligibleFarmers)} farmers` },
      { label: 'Pilot trial-to-purchase (reference only)', value: pct(trialToPurchasePct(), 0) },
      { label: 'Product master volume per buyer', value: `${saved.volumePerBuyerMt} MT` },
      { label: 'Net realisation (sales / ERP)', value: `₹${num(saved.realisationPerMt)} per MT` },
      { label: 'Contribution margin (finance)', value: `${saved.marginPct}%` },
    ],
  };
  return (
    <ZmPage {...ZM_SECTION.studio} trail={`${C1.code} · ${C1.name}`} title="Business Case: Assumptions and Calculation" back={Z.playbook} next={Z.scenarios} nextLabel="Compare financial scenarios"
      right={<StatusChip tone={zm.financeRequested ? 'warn' : 'neutral'}>{zm.financeRequested ? 'Finance validation requested' : 'Draft · not approved'}</StatusChip>}>
      <StudioTabs active={3} />
      <div className="kpis">
        <KpiCard label="Campaign investment (regional envelope)" value={l1(d.investment)} />
        <KpiCard label="Forecast incremental sales" value={l1(b.sales)} />
        <KpiCard label={`Forecast contribution (${d.marginPct}%)`} value={l1(b.contribution)} />
        <KpiCard label="Forecast net ROI" value={times(b.netRoi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <div className="stack">
          <Card title="Key assumptions and calculation logic" icon={Calculator} flush right={<>
            <Button small icon={FileSearch} onClick={() => setEvidence(src)}>View source records</Button>
            <Button small icon={ShieldCheck} disabled={zm.financeRequested} onClick={() => { zm.requestFinance(); bh.toast('Finance validation requested for margin and realisation'); }}>Request finance validation</Button>
          </>}>
            <DataTable rows={DRIVER_ROWS} rowKey={(r) => r.key}
              columns={[
                { key: 'l', header: 'Driver', render: (r) => <b>{r.label}</b> },
                { key: 'i', header: 'Input', align: 'center', render: (r) => (r.input
                  ? <span className="row" style={{ justifyContent: 'center' }}><input className={`num-input${changed.includes(r.key as keyof Drivers) ? ' chg' : ''}`} style={{ width: 96 }} type="number" min={0} step={r.step} aria-label={r.label} value={d[r.key as keyof Drivers]} onChange={(e) => set(r.key as keyof Drivers, e.target.value)} /><small>{r.unit}</small></span>
                  : <b>{fmtDriver(r.key, valueOf(r.key))} {r.key === 'sales' ? '' : r.unit}</b>) },
                { key: 'c', header: 'Calculation / logic', render: (r) => r.logic },
                { key: 's', header: 'Data source', align: 'center', render: (r) => <StatusChip tone="neutral">{r.source}</StatusChip> },
                { key: 'v', header: 'Validation', align: 'center', render: (r) => <StatusChip tone={VALID_TONE(r.validation)}>{r.key === 'marginPct' && zm.financeRequested ? 'Finance review requested' : r.validation}</StatusChip> },
              ]} />
            <EditBar count={changed.length} impact={`Sales ${l1(bs.sales)} → ${l1(b.sales)} · ROI ${times(bs.netRoi)} → ${times(b.netRoi)}`} onCancel={() => setD(saved)} onSave={save} />
          </Card>
          <Card title="Financial driver bridge (calculation flow)" icon={ArrowRight}>
            <div className="journey">
              {[
                { t: 'Audience', s: 'Eligible farmers', v: num(d.eligibleFarmers) },
                { t: 'Incremental buyers', s: `${d.conversionUpliftPct}% conversion uplift`, v: num(b.buyers) },
                { t: 'Incremental volume', s: `${d.volumePerBuyerMt} MT per buyer`, v: `${num(b.volumeMt)} MT` },
                { t: 'Incremental sales', s: `₹${num(d.realisationPerMt)} per MT`, v: l1(b.sales) },
              ].map((x, i, a) => (
                <Fragment key={x.t}>
                  <div className={`journey-step${i === a.length - 1 ? ' on' : ''}`}><b>{x.t}</b><small>{x.s}</small><span className="bridge-value">{x.v}</span></div>
                  {i < a.length - 1 && <ArrowRight size={16} className="journey-arrow" />}
                </Fragment>
              ))}
            </div>
          </Card>
        </div>
        <Notes title="Assumption checks" icon={ShieldCheck} items={[
          `No comparable baseline yet for the ${d.conversionUpliftPct}% conversion uplift.`,
          `Pilot trial-to-purchase ${pct(trialToPurchasePct(), 0)} is a reference, not the uplift assumption.`,
          `Retailer participation and stock evidence: ${zm.readinessChecks.includes('Retailer influence') ? 'confirmed' : 'not yet linked'}.`,
          `Margin ${d.marginPct}% and realisation ₹${num(d.realisationPerMt)}/MT ${zm.financeRequested ? 'sent for finance validation' : 'need finance validation'}.`,
          `Audience overlaps C2 by ${num(AUDIENCE.overlap)} farmers; check before adding forecasts.`,
          `Break-even needs ${l1(d.investment / (d.marginPct / 100))} of incremental sales.`,
        ]} />
      </div>
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={save} onDiscard={() => setD(saved)} />
    </ZmPage>
  );
}

// ================================================================ 16 Scenario Simulator
export function ScenarioSimulator() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const d = useDrivers();
  const rows = scenariosFor(d);
  const sel = rows.find((r) => r.id === zm.scenario)!;
  const [w, setW] = useState({ sales: sel.sales, margin: d.marginPct, investment: d.investment });
  const wc = (w.sales * w.margin) / 100;
  const wroi = w.investment ? (wc - w.investment) / w.investment : 0;
  const pick = (id: ScenarioKey) => { zm.setScenario(id); const r = rows.find((x) => x.id === id)!; setW({ ...w, sales: Math.round(r.sales * 10) / 10 }); bh.toast(`${r.name} scenario set as the business-case basis`); };
  const METRICS: { label: string; f: (r: (typeof rows)[number]) => string }[] = [
    { label: 'Incremental sales', f: (r) => l1(r.sales) },
    { label: 'Contribution margin', f: (r) => pct(r.marginPct, 0) },
    { label: 'Forecast contribution', f: (r) => l1(r.contribution) },
    { label: 'Campaign investment', f: (r) => l1(r.investment) },
    { label: 'Forecast net ROI', f: (r) => times(r.netRoi) },
  ];
  return (
    <ZmPage {...ZM_SECTION.studio} trail={`${C1.code} · ${C1.name}`} title="Scenario Simulator" back={Z.businessCase} next={Z.reconcile} nextLabel="Reconcile benefits and audience overlap"
      right={<StatusChip tone="ok">{`${sel.name} scenario selected`}</StatusChip>}>
      <StudioTabs active={3} />
      <div className="kpis">
        <KpiCard label="Business-case basis" value={sel.name} />
        <KpiCard label="Forecast contribution" value={l1(sel.contribution)} />
        <KpiCard label="Forecast net ROI" value={times(sel.netRoi)} />
        <KpiCard label="ROI range across scenarios" value={`${times(rows[0].netRoi)} to ${times(rows[2].netRoi)}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <div className="stack">
          <Card title="Financial scenarios: campaign business case" icon={Calculator} flush style={{ flex: 'none' }} right={<><Button small icon={SlidersHorizontal} onClick={() => go(Z.businessCase)}>Adjust assumptions</Button><Button small onClick={() => bh.toast('Draft scenario saved')}>Save draft scenario</Button></>}>
            <table className="tbl">
              <thead>
                <tr><th>Metric</th>{rows.map((r) => (
                  <th key={r.id} className={r.id === zm.scenario ? 'col-on' : undefined}>
                    <label className="row" style={{ justifyContent: 'center', cursor: 'pointer' }}><input type="radio" name="scenario" checked={r.id === zm.scenario} onChange={() => pick(r.id)} aria-label={`${r.name} scenario`} />{r.name}{r.id === zm.scenario ? ' (selected)' : ''}</label>
                  </th>
                ))}</tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.label}><td><b>{m.label}</b></td>{rows.map((r) => <td key={r.id} className={r.id === zm.scenario ? 'col-on' : undefined}>{m.f(r)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Contribution vs investment by scenario (₹ L)" icon={ChartColumn}>
            <GroupedBars height={300} data={rows.map((r) => ({ name: r.name, contribution: Math.round(r.contribution * 10) / 10, investment: r.investment }))} x="name"
              tooltip={(r) => `${r.name} · Contribution ₹${r.contribution.toFixed(1)} L · Investment ₹${r.investment.toFixed(1)} L · ROI ${times((r.contribution - r.investment) / r.investment)}`}
              series={[{ key: 'contribution', label: 'Forecast contribution', color: SERIES.planned }, { key: 'investment', label: 'Campaign investment', color: SERIES.observed }]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="What-if impact" icon={SlidersHorizontal}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <Field label="Sales (₹ L)"><input className="input" type="number" min={0} step={1} aria-label="What-if sales" value={w.sales} onChange={(e) => setW({ ...w, sales: Number(e.target.value) || 0 })} /></Field>
              <Field label="Margin (%)"><input className="input" type="number" min={0} max={100} step={1} aria-label="What-if margin" value={w.margin} onChange={(e) => setW({ ...w, margin: Number(e.target.value) || 0 })} /></Field>
              <Field label="Investment (₹ L)"><input className="input" type="number" min={0.5} step={0.5} aria-label="What-if investment" value={w.investment} onChange={(e) => setW({ ...w, investment: Number(e.target.value) || 0 })} /></Field>
            </div>
            <div className="recon compact" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div><span>Contribution</span><b aria-label="What-if contribution">{l1(wc)}</b></div>
              <div><span>Net ROI</span><b className={wroi < 0 ? 'warn' : ''} aria-label="What-if ROI">{times(wroi)}</b></div>
            </div>
          </Card>
          <Card title="Driver inputs (saved assumptions)" icon={ListChecks}>
            <List items={[
              { label: 'Eligible farmers', value: num(d.eligibleFarmers) },
              { label: 'Conversion uplift', value: pct(d.conversionUpliftPct, 0) },
              { label: 'Volume per buyer', value: `${d.volumePerBuyerMt} MT` },
              { label: 'Net realisation', value: `₹${num(d.realisationPerMt)}/MT` },
              { label: 'Contribution margin', value: pct(d.marginPct, 0) },
            ]} />
          </Card>
          <Notes title="Scenario risk checks" icon={ShieldCheck} items={[
            `Conservative case returns ${times(rows[0].netRoi)}; it ${rows[0].netRoi >= 0 ? 'still covers' : 'does not cover'} the ${l1(d.investment)} investment.`,
            `Each ₹1 L of sales adds ${l1(d.marginPct / 100)} of contribution.`,
            'Historical conversion comparator not finalised.',
            `Audience overlap with C2: ${num(AUDIENCE.overlap)} farmers.`,
          ]} />
        </div>
      </div>
    </ZmPage>
  );
}

// ================================================================ 17 Audience and Benefit Reconciliation
const RECON_DECISIONS: { id: 'separate' | 'coordinate' | 'defer'; label: string; sub: string }[] = [
  { id: 'separate', label: 'Develop separate campaigns', sub: 'Subject to overlap and ABP reconciliation' },
  { id: 'coordinate', label: 'Coordinate campaign interventions', sub: 'Align audience, timing and messaging' },
  { id: 'defer', label: 'Request further evidence', sub: 'C2 business case and CRM matching first' },
];
function Venn({ c1, c2, overlap }: { c1: number; c2: number; overlap: number }) {
  return (
    <svg viewBox="0 0 340 190" role="img" aria-label={`C1 ${num(c1)} farmers, C2 ${num(c2)} farmers, overlap ${num(overlap)} farmers`} style={{ width: '100%', maxHeight: 260 }}>
      <circle cx="120" cy="95" r="82" style={{ fill: 'var(--tint)', stroke: 'var(--brand)', strokeWidth: 2, fillOpacity: 0.8 }} />
      <circle cx="222" cy="95" r="62" style={{ fill: 'var(--amber-soft)', stroke: 'var(--amber)', strokeWidth: 2, fillOpacity: 0.75 }} />
      <text x="95" y="88" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--dark)' }}>C1</text>
      <text x="95" y="106" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--ink)' }}>{num(c1)} farmers</text>
      <text x="250" y="88" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--amber-ink)' }}>C2</text>
      <text x="250" y="106" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--ink)' }}>{num(c2)} farmers</text>
      <text x="181" y="90" textAnchor="middle" style={{ fontSize: 16, fontWeight: 800, fill: 'var(--dark)' }}>{num(overlap)}</text>
      <text x="181" y="106" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--ink)' }}>overlap</text>
    </svg>
  );
}
export function AudienceReconciliation() {
  const bh = useBhStore();
  const zm = useZmStore();
  const d = useDrivers();
  const c1 = driverBridge(d);
  const c2 = businessCaseC2();
  const r = reconciliation(d);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const rows: { p: string; a: string; b: string; span?: boolean }[] = [
    { p: 'Priority audience', a: 'Conventional Non-Saarthi Nutrition Users', b: 'Trial / interest farmers' },
    { p: 'First-purchase objective', a: 'Convert to Croptek', b: 'Turn trials into purchase' },
    { p: 'Intended interventions', a: 'Retailer activation, demonstrations, farmer meetings', b: 'Trial programme, advisory, follow-ups' },
    { p: 'Campaign investment', a: l1(d.investment), b: l1(c2.investment) },
    { p: 'Forecast incremental sales', a: l1(c1.sales), b: l1(c2.forecastSales) },
    { p: 'Contribution margin', a: pct(d.marginPct, 0), b: '35%' },
    { p: 'Forecast contribution', a: l1(c1.contribution), b: l1(c2.contribution) },
    { p: 'Forecast net ROI', a: times(c1.netRoi), b: times(c2.netRoi) },
    { p: 'Eligible farmers', a: num(AUDIENCE.c1), b: num(AUDIENCE.c2) },
    { p: 'Unique eligible audience', a: `${num(r.unique)} farmers across both`, b: '', span: true },
    { p: 'Potential audience overlap', a: `${num(AUDIENCE.overlap)} farmers in both cohorts`, b: '', span: true },
    { p: 'Possible double-counted sales', a: `${l1(r.doubleCount)} (${num(Math.round(r.overlapBuyers))} overlap buyers)`, b: '', span: true },
    { p: 'Common communication channels', a: 'Retailer network, field team, opt-in WhatsApp', b: '', span: true },
  ];
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Croptek conversion" title="Audience and Benefit Reconciliation" back={Z.scenarios} next={Z.proposals} nextLabel="Review proposals and submission readiness"
      right={<StatusChip tone="neutral">Draft · not approved</StatusChip>}>
      <StudioTabs active={3} />
      <div className="kpis">
        <KpiCard label="Unique eligible audience" value={num(r.unique)} />
        <KpiCard label="Audience overlap (farmers)" value={num(AUDIENCE.overlap)} />
        <KpiCard label="Combined forecast sales" value={l1(r.combinedSales)} />
        <KpiCard label="Net of overlap" value={l1(r.combinedNet)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title="Campaign comparison and financial reconciliation" icon={Scale} flush right={<>
          <Button small icon={Users} onClick={() => setEvidence({ title: 'Source cohorts: C1 and C2', owner: 'CRM farmer master and pilot investigation', facts: [
            { label: 'C1 eligible cohort', value: `${num(AUDIENCE.c1)} farmers` },
            { label: 'C2 trial cohort', value: `${num(AUDIENCE.c2)} farmers (${CROPTEK_EVIDENCE.purchases} purchased)` },
            { label: 'Matched in both', value: `${num(AUDIENCE.overlap)} farmers` },
          ] })}>View source cohorts</Button>
          <Button small icon={Send} onClick={() => bh.toast('CRM farmer-ID matching requested')}>Request CRM matching</Button>
        </>}>
          <table className="tbl">
            <thead><tr><th>Parameter</th><th>{C1.code} · {C1.name}</th><th>{C2.code} · {C2.name}</th></tr></thead>
            <tbody>{rows.map((x) => (
              <tr key={x.p}><td><b>{x.p}</b></td>{x.span ? <td colSpan={2}>{x.a}</td> : <><td>{x.a}</td><td>{x.b}</td></>}</tr>
            ))}</tbody>
          </table>
        </Card>
        <div className="stack">
          <Card title="Audience overlap" icon={Users}><Venn c1={AUDIENCE.c1} c2={AUDIENCE.c2} overlap={AUDIENCE.overlap} /></Card>
          <Notes title="Reconciliation checks" icon={ShieldCheck} items={[
            `${num(AUDIENCE.overlap)} farmers (${pct((AUDIENCE.overlap / AUDIENCE.c2) * 100, 0)} of C2) sit in both cohorts; farmer-ID matching pending.`,
            `Adding both forecasts counts up to ${l1(r.doubleCount)} of sales twice.`,
            `Combined investment ${l1(r.combinedInvestment)} for ${l1(r.combinedNet)} net forecast sales.`,
            'Common purchase attribution method to be agreed.',
          ]} />
        </div>
      </div>
      <Card title="Zonal Manager decision (campaign approach)" icon={CircleCheck}>
        <div className="grid g3">
          {RECON_DECISIONS.map((x) => (
            <label key={x.id} className={`choice${zm.reconDecision === x.id ? ' on' : ''}`} style={{ cursor: 'pointer' }}>
              <input type="radio" name="recon" checked={zm.reconDecision === x.id} onChange={() => { zm.setReconDecision(x.id); bh.toast(`Decision recorded: ${x.label.toLowerCase()}`); }} aria-label={x.label} />
              <span className="stack" style={{ gap: 2 }}><b>{x.label}</b><small className="muted">{x.sub}</small></span>
            </label>
          ))}
        </div>
      </Card>
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </ZmPage>
  );
}

// ================================================================ 18 Proposal Review and Submission
const STATUS_LABEL: Record<ProposalStatus, string> = { draft: 'Checks pending', submitted: 'Submitted to Marketing Head', returned: 'Returned for revision', resubmitted: 'Resubmitted to Marketing Head', approved: 'Approved by Marketing Head' };
const STATUS_TONE: Record<ProposalStatus, Tone> = { draft: 'warn', submitted: 'warn', returned: 'risk', resubmitted: 'warn', approved: 'ok' };
function useProposalFigures() {
  const d = useDrivers();
  const zm = useZmStore();
  const c1 = driverBridge(d);
  const c2 = businessCaseC2();
  const rev = zm.revision && zm.proposalStatus.c1 === 'resubmitted' ? zm.revision : null;
  const c1inv = rev ? rev.investment : d.investment;
  const c1sales = rev ? rev.sales : c1.sales;
  const c1margin = rev ? rev.marginPct : d.marginPct;
  const c1c = (c1sales * c1margin) / 100;
  return {
    c1: { investment: c1inv, sales: c1sales, contribution: c1c, roi: (c1c - c1inv) / c1inv },
    c2: { investment: c2.investment, sales: c2.forecastSales, contribution: c2.contribution, roi: c2.netRoi },
  };
}
export function ProposalReview() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const fig = useProposalFigures();
  const [focus, setFocus] = useState('c1');
  const [modal, setModal] = useState(false);
  const savedComment = zm.comments['proposal:review'] ?? '';
  const [comment, setComment] = useState(savedComment);
  const toggle = (id: string) => zm.setSelectedProposals(zm.selectedProposals.includes(id) ? zm.selectedProposals.filter((x) => x !== id) : [...zm.selectedProposals, id]);
  const toggleCheck = (c: string) => zm.setSubmissionChecks(zm.submissionChecks.includes(c) ? zm.submissionChecks.filter((x) => x !== c) : [...zm.submissionChecks, c]);
  const sel = PROPOSALS.filter((p) => zm.selectedProposals.includes(p.id));
  const f = (id: 'c1' | 'c2') => fig[id];
  const st = (id: string) => zm.proposalStatus[id] ?? 'draft';
  const fp = PROPOSALS.find((p) => p.id === focus)!;
  const concept = CONCEPTS.find((c) => c.id === focus)!;
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Croptek conversion" title="Proposal Review and Submission" back={Z.reconcile} next={() => setModal(true)} nextLabel="Submit to Marketing Head"
      right={<StatusChip tone={STATUS_TONE[st('c1')]}>{st('c1') === 'draft' ? 'Draft · pre-submission' : STATUS_LABEL[st('c1')]}</StatusChip>}>
      <StudioTabs active={4} />
      <div className="kpis">
        <KpiCard label="Proposals" value={num(PROPOSALS.length)} />
        <KpiCard label="Selected for submission" value={`${sel.length} of ${PROPOSALS.length}`} />
        <KpiCard label="Selected investment" value={l1(sel.reduce((s, p) => s + f(p.id).investment, 0))} />
        <KpiCard label="Selected forecast sales" value={l1(sel.reduce((s, p) => s + f(p.id).sales, 0))} />
      </div>
      <Card title="Campaign proposal portfolio" icon={ClipboardCheck} flush>
        <DataTable rows={PROPOSALS} rowKey={(p) => p.id} selected={focus} onRowClick={(p) => setFocus(p.id)}
          columns={[
            { key: 'x', header: '', width: 44, render: (p) => <input type="checkbox" checked={zm.selectedProposals.includes(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(p.id)} aria-label={`Select ${p.label}`} /> },
            { key: 'c', header: 'Campaign', render: (p) => <span className="stack" style={{ gap: 0, alignItems: 'center' }}><b>{CONCEPTS.find((c) => c.id === p.id)!.name}</b><small className="muted">{p.label}</small></span> },
            { key: 'f', header: 'Strategic focus', render: (p) => p.focus },
            { key: 'i', header: 'Proposed investment', align: 'right', render: (p) => l1(f(p.id).investment) },
            { key: 's', header: 'Forecast incremental sales', align: 'right', render: (p) => l1(f(p.id).sales) },
            { key: 'n', header: 'Forecast contribution', align: 'right', render: (p) => l1(f(p.id).contribution) },
            { key: 'r', header: 'Forecast net ROI', align: 'right', render: (p) => times(f(p.id).roi) },
            { key: 'v', header: 'Status', align: 'center', render: (p) => <StatusChip tone={STATUS_TONE[st(p.id)]}>{STATUS_LABEL[st(p.id)]}</StatusChip> },
            { key: 'a', header: 'Review', align: 'center', render: (p) => (st(p.id) === 'returned'
              ? <Button small primary icon={History} onClick={() => go(Z.revise(p.id))}>Revise</Button>
              : <Button small icon={Eye} onClick={() => setFocus(p.id)}>Review</Button>) },
          ]} />
      </Card>
      <div className="grid g3">
        <Card title="Submission readiness checklist" icon={ListChecks}>
          {SUBMISSION_CHECKS.map((c) => (
            <label key={c} className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={zm.submissionChecks.includes(c)} onChange={() => toggleCheck(c)} aria-label={c} />
              <span>{c}</span>
              <b className="right"><StatusChip tone={zm.submissionChecks.includes(c) ? 'ok' : 'warn'}>{zm.submissionChecks.includes(c) ? 'Complete' : 'Not complete'}</StatusChip></b>
            </label>
          ))}
        </Card>
        <Card title={`Selected proposal: ${fp.label}`} icon={Eye} right={<Button small onClick={() => { zm.setComment('proposal:review', comment); bh.toast('Review comments saved'); }} disabled={comment === savedComment}>Save comments</Button>}>
          <b>{concept.name}</b>
          <div className="grid g2" style={{ gap: 8 }}>
            <Button small icon={Target} onClick={() => go(Z.proposition)}>View proposition</Button>
            <Button small icon={Palette} onClick={() => go(Z.collateralApprovals)}>View assets</Button>
            <Button small icon={Calculator} onClick={() => go(Z.businessCase)}>View business case</Button>
            <Button small icon={GitCompare} onClick={() => go(Z.reconcile)}>Compare proposals</Button>
          </div>
          <Field label="Review comments (for Marketing Head)">
            <textarea className={`input${comment !== savedComment ? ' chg' : ''}`} rows={3} maxLength={500} aria-label="Review comments" value={comment} onChange={(e) => setComment(e.target.value)} />
            <small>{comment.length} / 500</small>
          </Field>
        </Card>
        <Notes title="Pre-submission checks" icon={ShieldCheck} items={[
          `${zm.submissionChecks.length} of ${SUBMISSION_CHECKS.length} readiness checks complete.`,
          `Proposals A and B share ${num(AUDIENCE.overlap)} farmers; confirm audience separation.`,
          `Trial-to-purchase ${pct(trialToPurchasePct(), 0)} is unverified for the C2 cohort definition.`,
          `Selected: ${sel.map((p) => p.label).join(', ') || 'none'}.`,
        ]} />
      </div>
      {modal && <SubmitModal onClose={() => setModal(false)} />}
    </ZmPage>
  );
}

function SubmitModal({ onClose }: { onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const fig = useProposalFigures();
  const sel = PROPOSALS.filter((p) => zm.selectedProposals.includes(p.id));
  const ready = zm.submissionChecks.length === SUBMISSION_CHECKS.length;
  const [tried, setTried] = useState(false);
  const toggle = (id: string) => zm.setSelectedProposals(zm.selectedProposals.includes(id) ? zm.selectedProposals.filter((x) => x !== id) : [...zm.selectedProposals, id]);
  const confirm = () => {
    setTried(true);
    if (!sel.length || !ready) return;
    zm.setProposalStatus(sel.map((p) => p.id), 'submitted');
    bh.toast(`${sel.map((p) => p.label).join(' and ')} submitted to Marketing Head`);
    onClose();
    go(Z.approvals);
  };
  const PACKAGE = ['Theme brief', 'Proposition and intervention', 'Collateral (detailer, latest version)', 'Financial assumptions', `${zm.scenario[0].toUpperCase()}${zm.scenario.slice(1)} scenario (selected)`, 'Audience reconciliation'];
  return (
    <Modal title="Review and submit campaign proposals" onClose={onClose} status={<StatusChip tone="warn">Pre-submission · not sent</StatusChip>}
      footer={<><Button onClick={onClose}>Back</Button><span className="sp" /><Button primary icon={Send} onClick={confirm}>Confirm submission to Marketing Head</Button></>}>
      <div className="kv">
        <span>Strategic theme</span><b>Croptek conversion</b>
        <span>Priority</span><b>Maharashtra · Onion</b>
        <span>Reviewer</span><b>Marketing Head</b>
      </div>
      <table className="tbl" style={{ marginTop: 10 }}>
        <thead><tr><th style={{ width: 44 }}>Select</th><th>Campaign</th><th>Investment</th><th>Incremental sales</th><th>Contribution</th><th>Net ROI</th></tr></thead>
        <tbody>{PROPOSALS.map((p) => (
          <tr key={p.id}>
            <td><input type="checkbox" checked={zm.selectedProposals.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Submit ${p.label}`} /></td>
            <td><b>{CONCEPTS.find((c) => c.id === p.id)!.name}</b></td>
            <td>{l1(fig[p.id].investment)}</td><td>{l1(fig[p.id].sales)}</td><td>{l1(fig[p.id].contribution)}</td><td>{times(fig[p.id].roi)}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <Card title="Submission package" icon={ClipboardCheck}><List items={PACKAGE.map((x) => ({ icon: CircleCheck, label: x }))} /></Card>
        <Card title="Validation readiness" icon={ShieldCheck}>
          <List items={SUBMISSION_CHECKS.map((c) => ({ label: c, value: <StatusChip tone={zm.submissionChecks.includes(c) ? 'ok' : 'warn'}>{zm.submissionChecks.includes(c) ? 'Complete' : 'Not complete'}</StatusChip> }))} />
          {tried && !ready && <small className="err">Complete the readiness checklist before submitting</small>}
          {tried && !sel.length && <small className="err">Select at least one proposal</small>}
        </Card>
      </div>
    </Modal>
  );
}

// ================================================================ 19 Revision and Resubmission Workspace
export function ProposalRevision() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const d = useDrivers();
  const v1 = driverBridge(d);
  const base = { investment: d.investment, sales: Math.round(v1.sales * 10) / 10, marginPct: d.marginPct, observations: {} as Record<string, string>, response: '' };
  const saved = zm.revision ?? base;
  const [r, setR] = useState(saved);
  const [sel, setSel] = useState<string>(MH_RETURN.params[1].key);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [tried, setTried] = useState(false);
  const numKeys = ['investment', 'sales', 'marginPct'] as const;
  const changed = [
    ...numKeys.filter((k) => r[k] !== saved[k]),
    ...MH_RETURN.observations.filter((o) => (r.observations[o.id] ?? '') !== (saved.observations[o.id] ?? '')).map((o) => o.id),
    ...(r.response !== saved.response ? ['response'] : []),
  ];
  const contribution = (r.sales * r.marginPct) / 100;
  const roi = r.investment ? (contribution - r.investment) / r.investment : 0;
  const status = zm.proposalStatus.c1 ?? 'draft';
  const save = () => { zm.setRevision(r); bh.toast('Revised draft saved'); };
  const addressed = MH_RETURN.observations.filter((o) => (r.observations[o.id] ?? '').trim().length >= 5).length;
  const resubmit = () => {
    setTried(true);
    if (r.response.trim().length < 10) { bh.toast('Add a response to the Marketing Head before resubmitting'); return; }
    zm.setRevision(r);
    zm.setProposalStatus(['c1'], 'resubmitted');
    bh.toast('C1 revised proposal resubmitted to Marketing Head');
    // Navigate after the save renders, so the leave guard sees no unsaved changes.
    setTimeout(() => go(Z.proposals), 0);
  };
  const v1Vals: Record<string, string> = { investment: l1(d.investment), sales: l1(v1.sales), marginPct: pct(d.marginPct, 0) };
  const note = MH_RETURN.params.find((p) => p.key === sel) ?? MH_RETURN.observations.find((o) => o.id === sel)!;
  const stTone = (k: string, isNum: boolean) => {
    const done = isNum ? r[k as 'investment'] !== base[k as 'investment'] : (r.observations[k] ?? '').trim().length >= 5;
    return <StatusChip tone={done ? 'ok' : 'warn'}>{done ? 'Updated' : 'Update required'}</StatusChip>;
  };
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Returned proposals" title="Revision and Resubmission Workspace" back={Z.proposals} next={resubmit} nextLabel="Resubmit revised proposal to Marketing Head"
      right={<StatusChip tone={STATUS_TONE[status]}>{status === 'returned' ? 'Returned for revision · not approved' : STATUS_LABEL[status]}</StatusChip>}>
      <StudioTabs active={4} />
      <div className="kpis">
        <KpiCard label="Submitted investment (version 1)" value={l1(d.investment)} />
        <KpiCard label="Revised investment" value={l1(r.investment)} />
        <KpiCard label="Revised net ROI" value={times(roi)} />
        <KpiCard label="Observations addressed" value={`${addressed} of ${MH_RETURN.observations.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title={`${C1.code} · original vs revised: financial and strategic comparison`} icon={Scale} flush right={<Button small icon={FileSearch} onClick={() => setEvidence({ title: 'Original submission: C1 version 1', owner: `Submitted to Marketing Head · returned ${MH_RETURN.date}`, facts: [
          { label: 'Proposed investment', value: l1(d.investment) }, { label: 'Forecast incremental sales', value: l1(v1.sales) }, { label: 'Contribution margin', value: pct(d.marginPct, 0) }, { label: 'Contribution', value: l1(v1.contribution) }, { label: 'Net ROI', value: times(v1.netRoi) },
        ] })}>View original submission</Button>}>
          <table className="tbl">
            <thead><tr><th>Parameter</th><th>Submitted version 1</th><th>Revised version 2</th><th>Marketing Head comment</th><th>Validation</th></tr></thead>
            <tbody>
              {MH_RETURN.params.map((p) => (
                <tr key={p.key} className={sel === p.key ? 'on' : undefined} onClick={() => setSel(p.key)} style={{ cursor: 'pointer' }}>
                  <td><b>{p.label}</b></td><td>{v1Vals[p.key]}</td>
                  <td><input className={`num-input${changed.includes(p.key) ? ' chg' : ''}`} style={{ width: 90 }} type="number" min={0} step={p.key === 'marginPct' ? 1 : 0.5} aria-label={`Revised ${p.label}`} value={r[p.key]} onChange={(e) => setR({ ...r, [p.key]: Math.max(0, Number(e.target.value) || 0) })} /> <small>{p.key === 'marginPct' ? '%' : '₹ L'}</small></td>
                  <td>{p.comment}</td><td>{stTone(p.key, true)}</td>
                </tr>
              ))}
              <tr><td><b>Contribution</b></td><td>{l1(v1.contribution)}</td><td><b>{l1(contribution)}</b></td><td>Follows the revised inputs.</td><td><StatusChip tone="neutral">Derived</StatusChip></td></tr>
              <tr><td><b>Net ROI</b></td><td>{times(v1.netRoi)}</td><td><b>{times(roi)}</b></td><td>Validate ROI after revisions.</td><td><StatusChip tone="neutral">Derived</StatusChip></td></tr>
              <tr><td colSpan={5} className="calc-label" style={{ textAlign: 'left' }}>Returned observations (to address in the revision)</td></tr>
              {MH_RETURN.observations.map((o) => (
                <tr key={o.id} className={sel === o.id ? 'on' : undefined} onClick={() => setSel(o.id)} style={{ cursor: 'pointer' }}>
                  <td><b>{o.label}</b></td><td><span className="na">Not addressed</span></td>
                  <td><input className={`input${changed.includes(o.id) ? ' chg' : ''}`} aria-label={`Revision for ${o.label}`} value={r.observations[o.id] ?? ''} onChange={(e) => setR({ ...r, observations: { ...r.observations, [o.id]: e.target.value } })} /></td>
                  <td>{o.comment}</td><td>{stTone(o.id, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <EditBar count={changed.length} impact={`ROI ${times(v1.netRoi)} → ${times(roi)}`} onCancel={() => setR(saved)} onSave={save} />
        </Card>
        <div className="stack">
          <Card title="Marketing Head review notes" icon={MessageSquare}>
            <List items={[{ label: 'Selected comment', value: note.comment }, { label: 'Returned', value: MH_RETURN.date }, { label: 'Priority', value: <StatusChip tone="risk">{MH_RETURN.priority}</StatusChip> }]} />
            <Field label="Response to Marketing Head *" error={tried && r.response.trim().length < 10 ? 'Enter at least 10 characters' : ''}>
              <textarea className={`input${changed.includes('response') ? ' chg' : ''}`} rows={4} maxLength={300} aria-label="Response to Marketing Head" value={r.response} onChange={(e) => setR({ ...r, response: e.target.value })} />
              <small>{r.response.length} / 300</small>
            </Field>
            <Button small icon={ShieldCheck} onClick={() => bh.toast('Exception review requested')}>Request exception review</Button>
          </Card>
          <Notes title="Revision checks" icon={ShieldCheck} items={[
            `${addressed} of ${MH_RETURN.observations.length} observations have a revision entered.`,
            `Revised contribution ${l1(contribution)} against ${l1(r.investment)} investment.`,
            r.investment !== d.investment ? `Investment changes by ${l1(r.investment - d.investment)}; material changes may need authority approval.` : 'Investment unchanged from version 1.',
            `Response ${r.response.trim().length >= 10 ? 'ready' : 'still needed'} for the Marketing Head.`,
          ]} />
        </div>
      </div>
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={save} onDiscard={() => setR(saved)} />
    </ZmPage>
  );
}

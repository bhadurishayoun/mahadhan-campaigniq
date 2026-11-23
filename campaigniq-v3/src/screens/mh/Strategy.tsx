/** Marketing Head screens 6–11: diagnosis, recommendations, investigation, evidence tracking, updated results, refreshed recommendations. */
import { ArrowRight, ChartColumn, CircleAlert, CircleCheck, ClipboardList, FileSearch, ListChecks, MessageSquare, PenLine, Search, Send, ShieldCheck, Users } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ambadMetrics } from '../../data/bh';
import { crore, lakh, num, pct, times } from '../../data/format';
import {
  ambadPlan, ANALYSIS_CHECKS, ANALYSIS_MODULES, ANALYSIS_OWNERS, BARRIERS, EVIDENCE_READINESS, EVIDENCE_REQUESTS, funnel, INVESTIGATION_QUESTION, RECOMMENDATIONS,
  REQUEST_OWNERS, REQUEST_STATUS_LABEL, SOURCE_SYSTEMS, STATUS_AFTER_CREATE, themeRoi, WEST_STATES, westSalesTotal, type RequestStatus,
} from '../../data/mh';
import { CROPTEK_EVIDENCE } from '../../data/zm';
import { M } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useMhStore } from '../../store/mhStore';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, type Evidence } from '../../ui/overlay';
import { opt, useGo } from '../common';
import { Field, List, Notes } from '../zm/parts';
import { MhPage, MhStudioTabs, MH_SECTION } from './frame';

const range = (r: [number, number], unit = '%') => `${r[0]}–${r[1]}${unit}`;
const REQ_TONE: Record<RequestStatus, Tone> = { draft: 'neutral', requested: 'warn', received: 'warn', validated: 'ok' };
const CONF_TONE: Record<string, Tone> = { High: 'ok', Medium: 'warn', 'Medium-low': 'warn', Low: 'neutral' };
const SCOPE = 'Maharashtra · Onion · Croptek';
/** KPI value with no zeros: a count, or "None yet". */
const nz = (n: number) => (n ? num(n) : 'None yet');

/** Request status (store, else draft) and whether purchases are linked (the purchase request is validated). */
function useInvestigation() {
  const mh = useMhStore();
  const statusOf = (id: string): RequestStatus => mh.requests?.[id]?.status ?? 'draft';
  const linked = statusOf('purchases') === 'validated';
  const allValidated = EVIDENCE_REQUESTS.every((r) => statusOf(r.id) === 'validated');
  return { statusOf, linked, allValidated, created: !!mh.requests };
}
const sourceEvidence = (): Evidence => ({
  title: `Source analysis: ${SCOPE}`, owner: 'Market sizing, secondary sales, campaign records and the Ambad plan',
  facts: [
    { label: 'Addressable market', value: `₹${WEST_STATES[0].market[0]}–${WEST_STATES[0].market[1]} Cr` },
    { label: 'Product penetration', value: range(WEST_STATES[0].penetration) },
    { label: 'Secondary sales Q1–Q4', value: CROPTEK_EVIDENCE.secondarySales.map((q) => `₹${q.v} L`).join(' → ') },
    { label: 'Ambad conversion growth objective', value: lakh(ambadPlan().growthObjective) },
    { label: 'Ambad trial-to-adoption', value: pct(ambadMetrics().trialToAdoptionPct) },
  ],
});
const rationale = (id: string): Evidence => {
  const r = RECOMMENDATIONS.find((x) => x.id === id)!;
  return { title: `Rationale: ${r.name}`, owner: 'Diagnosis evidence and historical theme effectiveness', facts: [
    { label: 'Rationale', value: r.rationale }, { label: 'Suitability', value: r.suitability },
    { label: 'Historical theme ROI', value: times(themeRoi(r.theme)) }, { label: 'Missing validations', value: r.missing.join(', ') },
  ] };
};

function Funnel({ linked }: { linked: boolean }) {
  const f = funnel(linked);
  const steps = [
    { t: num(f.eligible), s: 'CRM-screened eligible farmers' }, { t: num(f.reached), s: `Reached (${pct(f.reachPct, 0)})` },
    { t: num(f.trials), s: 'Documented trials' }, { t: f.purchases === null ? 'Not linked' : num(f.purchases), s: f.purchases === null ? 'Purchase linkage pending' : 'Matched purchases' },
  ];
  return (
    <div className="journey">
      {steps.map((x, i) => (
        <Fragment key={x.s}>
          <div className={`journey-step${i === 3 ? ' on' : ''}`}><span className="bridge-value">{x.t}</span><small>{x.s}</small></div>
          {i < steps.length - 1 && <ArrowRight size={16} className="journey-arrow" />}
        </Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- drawer: request further analysis (on screen 6)
function AnalysisDrawer({ onClose }: { onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const [question, setQuestion] = useState(mh.analysis?.question ?? INVESTIGATION_QUESTION);
  const [modules, setModules] = useState<string[]>(mh.analysis?.modules ?? ANALYSIS_MODULES.slice(0, 2));
  const [mode, setMode] = useState<'available' | 'missing'>(mh.analysis?.mode ?? 'available');
  const [owner, setOwner] = useState(mh.analysis?.owner ?? '');
  const [checks, setChecks] = useState<string[]>(mh.analysis?.checks ?? []);
  const [tried, setTried] = useState(false);
  const errors = { modules: modules.length ? '' : 'Select at least one module', owner: owner ? '' : 'Select the request owner', question: question.trim().length >= 10 ? '' : 'Enter the investigation question' };
  const toggle = (list: string[], set: (x: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const submit = () => {
    setTried(true);
    if (errors.modules || errors.owner || errors.question) return;
    mh.setAnalysis({ question: question.trim(), modules, mode, owner, checks });
    bh.toast(mode === 'available' ? 'Investigation run with available data' : 'Investigation submitted; missing evidence to request');
    onClose();
    go(M.investigation);
  };
  return (
    <Drawer title="Request further analysis" onClose={onClose} status={<StatusChip tone="neutral">Draft</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={submit}>Run / submit investigation</Button>} />}>
      <Field label="Investigation question *" error={tried ? errors.question : ''}><textarea className="input" rows={2} aria-label="Investigation question" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
      <div className="grid g2">
        <Card title="Investigation modules" icon={ListChecks}>
          {ANALYSIS_MODULES.map((m) => (
            <label key={m} className="list-row" style={{ cursor: 'pointer' }}><input type="checkbox" checked={modules.includes(m)} onChange={() => toggle(modules, setModules, m)} aria-label={m} /><span>{m}</span></label>
          ))}
          {tried && errors.modules && <small className="err">{errors.modules}</small>}
        </Card>
        <Card title="Source systems and evidence availability" icon={FileSearch}>
          <List items={SOURCE_SYSTEMS.map((x) => ({ label: x.system, value: <StatusChip tone={x.tone}>{x.status}</StatusChip> }))} />
        </Card>
      </div>
      <div className="grid g2">
        {([['available', 'Run with available data', 'Use currently available and partially available evidence.'], ['missing', 'Request missing evidence', 'Ask the owning teams for the missing data first.']] as const).map(([id, label, sub]) => (
          <label key={id} className={`choice${mode === id ? ' on' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="radio" name="mode" checked={mode === id} onChange={() => setMode(id)} aria-label={label} />
            <span className="stack" style={{ gap: 2 }}><b>{label}</b><small className="muted">{sub}</small></span>
          </label>
        ))}
      </div>
      <div className="grid g2">
        <Card title="Scope filters" icon={Search}>
          <div className="form-grid">
            <Field label="Region"><Select label="Scope region" value="west" onChange={() => undefined} options={[opt('west', 'West region')]} /></Field>
            <Field label="State"><Select label="Scope state" value="Maharashtra" onChange={() => undefined} options={WEST_STATES.map((s) => opt(s.state, s.state))} /></Field>
            <Field label="Crop"><Select label="Scope crop" value="Onion" onChange={() => undefined} options={[opt('Onion', 'Onion')]} /></Field>
            <Field label="Product"><Select label="Scope product" value="Croptek" onChange={() => undefined} options={[opt('Croptek', 'Croptek')]} /></Field>
          </div>
        </Card>
        <Card title="Data validation checklist" icon={ShieldCheck}>
          {ANALYSIS_CHECKS.map((c) => (
            <label key={c} className="list-row" style={{ cursor: 'pointer' }}><input type="checkbox" checked={checks.includes(c)} onChange={() => toggle(checks, setChecks, c)} aria-label={c} /><span>{c}</span></label>
          ))}
          <Field label="Request owner *" error={tried ? errors.owner : ''}><Select label="Request owner" value={owner} onChange={setOwner} options={[opt('', 'Select owner'), ...ANALYSIS_OWNERS.map((o) => opt(o, o))]} /></Field>
        </Card>
      </div>
    </Drawer>
  );
}

// ================================================================ 6 Market & Historical Performance Diagnosis
export function Diagnosis() {
  const [params, setParams] = useSearchParams();
  const inv = useInvestigation();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const open = params.get('analysis') === '1';
  const setOpen = (v: boolean) => setParams(v ? { analysis: '1' } : {});
  const a = ambadMetrics();
  const st = WEST_STATES[0];
  const sales = CROPTEK_EVIDENCE.secondarySales;
  const tiles: { t: string; v: string; chip: string; tone: Tone }[] = [
    { t: 'Historical campaigns', v: `Conversion theme ${times(themeRoi('conversion'))}`, chip: 'Historical evidence', tone: 'ok' },
    { t: 'Business plan support', v: `${lakh(ambadPlan().growthObjective)} conversion objective in the Ambad ABP`, chip: 'Zonal Manager endorsed', tone: 'ok' },
    { t: 'Farmer awareness', v: 'Market-level awareness', chip: inv.statusOf('awareness') === 'validated' ? 'Validated' : 'Awaiting validation', tone: inv.statusOf('awareness') === 'validated' ? 'ok' : 'warn' },
    { t: 'Trial-to-adoption (Ambad)', v: `${pct(a.trialToAdoptionPct)} (${a.adopters} of ${a.trials})`, chip: 'Recorded', tone: 'ok' },
    { t: 'Retailer recommendation', v: 'Retailer advocacy level', chip: inv.statusOf('retailer') === 'validated' ? 'Validated' : 'Awaiting validation', tone: inv.statusOf('retailer') === 'validated' ? 'ok' : 'warn' },
    { t: 'Stock and availability', v: 'Territory stock position', chip: inv.statusOf('retailer') === 'validated' ? 'Partly verified' : 'Awaiting validation', tone: 'warn' },
  ];
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Market & Historical Performance Diagnosis" back={M.planTerritory('ambad')} next={M.recommendations} nextLabel="Review campaign recommendations">
      <MhStudioTabs active={0} />
      <div className="kpis">
        <KpiCard label="Addressable market" value={`₹${st.market[0]}–${st.market[1]} Cr`} />
        <KpiCard label="Product penetration" value={range(st.penetration)} />
        <KpiCard label="Secondary sales Q1–Q4" value={crore(westSalesTotal())} />
        <KpiCard label="Ambad growth objective" value={lakh(ambadPlan().growthObjective)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={`Market and historical performance evidence: ${SCOPE}`} icon={ChartColumn} right={<>
          <Button small icon={FileSearch} onClick={() => setEvidence(sourceEvidence())}>View source analysis</Button>
          <Button small icon={MessageSquare} onClick={() => setOpen(true)}>Request further analysis</Button>
        </>}>
          <div className="journey">
            {sales.map((q, i) => (
              <Fragment key={q.q}>
                <div className="journey-step"><small>{q.q} secondary sales</small><span className="bridge-value">₹{q.v} L</span></div>
                {i < sales.length - 1 && <ArrowRight size={16} className="journey-arrow" />}
              </Fragment>
            ))}
          </div>
          <div className="grid g3">
            {tiles.map((x) => (
              <div key={x.t} className="journey-step"><b>{x.t}</b><small>{x.v}</small><StatusChip tone={x.tone}>{x.chip}</StatusChip></div>
            ))}
          </div>
        </Card>
        <Notes title="Diagnosis notes" items={[
          `Sales rose ${sales[0].v} → ${sales[sales.length - 1].v} L (+${(((sales[sales.length - 1].v - sales[0].v) / sales[0].v) * 100).toFixed(1)}%) while penetration stays at ${range(st.penetration)}.`,
          'Positive momentum plus low penetration suggests growth headroom.',
          `Ambad converts ${pct(a.trialToAdoptionPct)} of trials to adoption, with a ${a.villageGap.toFixed(1)} pp village gap.`,
          inv.linked ? `Trial-to-purchase is now measured at ${pct(funnel(true).trialToPurchasePct!, 0)}.` : 'The exact reason for under-adoption is unconfirmed: purchases are not yet linked to farmers.',
        ]} />
      </div>
      <Card title="Potential growth barriers (hypothesis assessment)" icon={Search}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {BARRIERS.map((b) => (
            <div key={b.id} className="journey-step">
              <b>{b.barrier} barrier</b><small>{b.question}</small>
              <StatusChip tone={inv.allValidated ? b.afterTone : b.beforeTone}>{inv.allValidated ? b.after : b.before}</StatusChip>
            </div>
          ))}
        </div>
      </Card>
      {open && <AnalysisDrawer onClose={() => setOpen(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}

// ---------------------------------------------------------------- recommendation list (screens 7 and 11)
function RecommendationTable({ refreshed }: { refreshed: boolean }) {
  const mh = useMhStore();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const sel = refreshed ? mh.refreshed : mh.recommendation;
  const pick = (id: string) => (refreshed ? mh.setRefreshed(id) : mh.setRecommendation(id));
  return (
    <>
      <DataTable selectable rows={RECOMMENDATIONS} rowKey={(r) => r.id} selected={sel} onRowClick={(r) => pick(r.id)}
        columns={[
          { key: 'n', header: 'Campaign recommendation', render: (r) => <span className="stack" style={{ gap: 2, alignItems: 'center' }}><b>{r.name}</b>{r.leading && <StatusChip tone="ok">Leading candidate</StatusChip>}</span> },
          { key: 'c', header: 'Evidence confidence', align: 'center', render: (r) => <StatusChip tone={CONF_TONE[refreshed ? r.after : r.before]}>{refreshed ? r.after : r.before}</StatusChip> },
          { key: 'r', header: 'Rationale', render: (r) => r.rationale },
          { key: 'm', header: 'Missing validations', render: (r) => r.missing.join(' · ') },
          { key: 'v', header: 'Rationale', align: 'center', render: (r) => <Button small icon={FileSearch} onClick={() => setEvidence(rationale(r.id))}>View rationale</Button> },
        ]} />
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </>
  );
}
function Suitability({ id, refreshed }: { id: string; refreshed: boolean }) {
  const r = RECOMMENDATIONS.find((x) => x.id === id)!;
  const st = WEST_STATES[0];
  return (
    <Card title={`Opportunity vs intervention suitability: ${r.name}`} icon={ShieldCheck}>
      <List items={[
        { label: 'Opportunity attractiveness', value: <StatusChip tone="ok">High</StatusChip> },
        { label: 'Addressable market', value: `₹${st.market[0]}–${st.market[1]} Cr` },
        { label: 'Product penetration', value: range(st.penetration) },
        { label: 'Intervention suitability', value: <StatusChip tone={CONF_TONE[refreshed ? r.after : r.before]}>{refreshed ? r.after : r.before}</StatusChip> },
        { label: 'Historical theme ROI', value: times(themeRoi(r.theme)) },
      ]} />
      <p className="muted" style={{ margin: 0 }}>{r.suitability}</p>
    </Card>
  );
}

// ================================================================ 7 Campaign Recommendations
export function Recommendations() {
  const go = useGo();
  const mh = useMhStore();
  const r = RECOMMENDATIONS.find((x) => x.id === mh.recommendation)!;
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Campaign Recommendations" back={M.diagnosis} next={`${M.diagnosis}?analysis=1`} nextLabel="Request further analysis"
      right={<StatusChip tone="neutral">Candidate · not approved</StatusChip>}>
      <MhStudioTabs active={2} />
      <div className="kpis">
        <KpiCard label="Addressable market" value={`₹${WEST_STATES[0].market[0]}–${WEST_STATES[0].market[1]} Cr`} />
        <KpiCard label="Product penetration" value={range(WEST_STATES[0].penetration)} />
        <KpiCard label="Key plan reference (Ambad)" value={lakh(ambadPlan().growthObjective)} />
        <KpiCard label="Recommendations" value={num(RECOMMENDATIONS.length)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title="Campaign recommendations (output of diagnosis)" icon={ListChecks} flush right={<Button small icon={PenLine} onClick={() => go(M.themeBrief)}>Design selected campaign</Button>}><RecommendationTable refreshed={false} /></Card>
        <div className="stack">
          <Suitability id={r.id} refreshed={false} />
          <Notes title="Recommendation summary" items={[
            `${RECOMMENDATIONS.find((x) => x.leading)!.name} is the leading candidate for West (Maharashtra onion).`,
            `Market of ₹${WEST_STATES[0].market[0]}–${WEST_STATES[0].market[1]} Cr at ${range(WEST_STATES[0].penetration)} penetration with rising sales.`,
            `Selected: ${r.name} (${r.before} confidence); missing ${r.missing.join(', ').toLowerCase()}.`,
            'Farmer conversion behaviour and retailer influence still need validation.',
          ]} />
        </div>
      </div>
    </MhPage>
  );
}

// ---------------------------------------------------------------- drawer: request missing evidence (on screen 8)
function EvidenceRequestDrawer({ onClose }: { onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const DEFAULT: Record<string, { owner: string; due: string }> = { purchases: { owner: 'CRM / sales operations', due: '2027-02-20' }, awareness: { owner: 'CRM / call centre', due: '2027-02-22' }, retailer: { owner: 'Regional sales team', due: '2027-02-24' } };
  const [sel, setSel] = useState<string[]>(EVIDENCE_REQUESTS.map((r) => r.id));
  const [cfg, setCfg] = useState(DEFAULT);
  const [tried, setTried] = useState(false);
  const missing = sel.filter((id) => !cfg[id].owner || !cfg[id].due);
  const create = () => {
    setTried(true);
    if (!sel.length || missing.length) return;
    mh.setRequests(Object.fromEntries(EVIDENCE_REQUESTS.map((r) => [r.id, { status: sel.includes(r.id) ? STATUS_AFTER_CREATE[r.id] : 'draft', owner: cfg[r.id].owner, due: cfg[r.id].due }])));
    bh.toast(`${sel.length} evidence request${sel.length === 1 ? '' : 's'} created`);
    onClose();
    go(M.evidence);
  };
  return (
    <Drawer title="Request missing evidence" onClose={onClose} status={<StatusChip tone="neutral">Draft request</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={create}>Create evidence requests</Button>} />}>
      <List items={[{ label: 'Investigation scope', value: `West · ${SCOPE} · FY 2026–27` }, { label: 'Requests selected', value: `${sel.length} of ${EVIDENCE_REQUESTS.length}` }]} />
      {tried && !sel.length && <small className="err">Select at least one request</small>}
      {EVIDENCE_REQUESTS.map((r) => (
        <Card key={r.id} title={r.title} icon={ClipboardList} right={<label className="row" style={{ cursor: 'pointer' }}><input type="checkbox" checked={sel.includes(r.id)} onChange={() => setSel((x) => (x.includes(r.id) ? x.filter((y) => y !== r.id) : [...x, r.id]))} aria-label={`Select ${r.title}`} /><span>Include</span></label>}>
          <div className="form-grid">
            <Field label="Owner *" error={tried && sel.includes(r.id) && !cfg[r.id].owner ? 'Select an owner' : ''}><Select label={`Owner ${r.title}`} value={cfg[r.id].owner} onChange={(v) => setCfg({ ...cfg, [r.id]: { ...cfg[r.id], owner: v } })} options={[opt('', 'Select owner'), ...REQUEST_OWNERS.map((o) => opt(o, o))]} /></Field>
            <Field label="Due date *" error={tried && sel.includes(r.id) && !cfg[r.id].due ? 'Select a due date' : ''}><input className="input" type="date" aria-label={`Due date ${r.title}`} value={cfg[r.id].due} onChange={(e) => setCfg({ ...cfg, [r.id]: { ...cfg[r.id], due: e.target.value } })} /></Field>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}><small className="muted">Required fields:</small>{r.requirements.map((q) => <StatusChip key={q} tone="neutral">{q}</StatusChip>)}</div>
        </Card>
      ))}
    </Drawer>
  );
}

// ================================================================ 8 Farmer Conversion Investigation Results
export function Investigation() {
  const mh = useMhStore();
  const inv = useInvestigation();
  const [drawer, setDrawer] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const readiness = EVIDENCE_READINESS.map((e) => (e.request && inv.statusOf(e.request) === 'validated' ? { ...e, status: 'Validated', tone: 'ok' as const } : e));
  const observed = ['Positive secondary-sales momentum', `Partial outreach and trial activity (${num(funnel(false).reached)} reached, ${num(funnel(false).trials)} trials)`, 'Business plan points to a conversion focus'];
  const missing = readiness.filter((e) => e.tone !== 'ok').map((e) => e.item);
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Farmer Conversion Investigation Results" back={M.recommendations} next={M.evidence} nextLabel="Track evidence requests"
      right={<StatusChip tone={inv.created ? 'warn' : mh.analysis ? 'warn' : 'neutral'}>{inv.created ? 'Evidence requested' : mh.analysis ? 'Analysis run with available data' : 'Analysis not yet requested'}</StatusChip>}>
      <MhStudioTabs active={1} />
      <Card title="Investigation summary" icon={Search}>
        <List items={[
          { label: 'Question', value: mh.analysis?.question ?? INVESTIGATION_QUESTION },
          { label: 'Summary finding', value: inv.linked ? `Purchases now linked: ${pct(funnel(true).trialToPurchasePct!, 0)} trial-to-purchase.` : 'Outreach and trial records support a partial funnel; purchase linkage, awareness and channel evidence are incomplete.' },
          { label: 'Modules', value: (mh.analysis?.modules ?? ANALYSIS_MODULES.slice(0, 2)).join(' · ') },
        ]} />
      </Card>
      <Card title="Farmer journey (pilot subset)" icon={Users}><Funnel linked={inv.linked} /></Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 300px' }}>
        <Card title="Evidence readiness" icon={ListChecks} flush>
          <DataTable rows={readiness} rowKey={(e) => e.item}
            columns={[
              { key: 'i', header: 'Evidence item', render: (e) => <b>{e.item}</b> },
              { key: 's', header: 'Status', align: 'center', render: (e) => <StatusChip tone={e.tone}>{e.status}</StatusChip> },
              { key: 'm', header: 'Source', render: (e) => e.source },
            ]} />
        </Card>
        <Card title="Barrier assessment" icon={ShieldCheck}>
          <div className="calc-label">Observed evidence</div>
          <List items={observed.map((o) => ({ icon: CircleCheck, label: o }))} />
          <div className="calc-label">Missing / unverified</div>
          <List items={missing.slice(0, 5).map((m) => ({ icon: CircleAlert, tone: 'warn' as const, label: m }))} />
          <div className="row" style={{ flexWrap: 'wrap' }}>{['Conversion friction', 'Awareness gap', 'Channel influence'].map((h) => <StatusChip key={h} tone="warn">{`${h}: unconfirmed`}</StatusChip>)}</div>
        </Card>
        <Card title="Recommended investigation actions" icon={ArrowRight}>
          <List items={['Validate purchase / farmer-ID linkage', 'Retrieve awareness and call outcomes', 'Verify channel stock and retailer recommendation', 'Re-run analysis after evidence checks'].map((x) => ({ icon: ArrowRight, label: x }))} />
          <div className="stack" style={{ gap: 8 }}>
            <Button primary icon={Send} onClick={() => setDrawer(true)}>Request missing evidence</Button>
            <Button icon={FileSearch} onClick={() => setEvidence(sourceEvidence())}>View source analysis</Button>
          </div>
        </Card>
      </div>
      {drawer && <EvidenceRequestDrawer onClose={() => setDrawer(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}

// ================================================================ 9 Evidence Request Tracking & Validation
export function EvidenceTracking() {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const inv = useInvestigation();
  const [sel, setSel] = useState(EVIDENCE_REQUESTS[0].id);
  const r = EVIDENCE_REQUESTS.find((x) => x.id === sel)!;
  const rec = mh.requests?.[sel];
  const status = inv.statusOf(sel);
  const validate = () => {
    if (!mh.requests) mh.setRequests(Object.fromEntries(EVIDENCE_REQUESTS.map((x) => [x.id, { status: 'requested' as RequestStatus, owner: x.owner, due: x.due }])));
    mh.setRequestStatus(sel, 'validated');
    bh.toast(`${r.title} validated${sel === 'purchases' ? ' · purchases linked (54)' : ''}`);
  };
  const next = () => { if (!inv.allValidated) { bh.toast('Validate all evidence requests first'); return; } go(M.updated); };
  const count = (s: RequestStatus) => EVIDENCE_REQUESTS.filter((x) => inv.statusOf(x.id) === s).length;
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Evidence Request Tracking & Validation" back={M.investigation} next={next} nextLabel="Updated investigation results"
      right={<StatusChip tone={inv.allValidated ? 'ok' : 'warn'}>{inv.allValidated ? 'All evidence validated' : `${count('validated')} of ${EVIDENCE_REQUESTS.length} validated`}</StatusChip>}>
      <MhStudioTabs active={1} />
      <div className="kpis">
        <KpiCard label="Evidence requests" value={num(EVIDENCE_REQUESTS.length)} />
        <KpiCard label="Validated" value={nz(count('validated'))} />
        <KpiCard label="Evidence received" value={nz(count('received'))} />
        <KpiCard label="Awaiting submission" value={nz(count('requested') + count('draft'))} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <div className="stack">
          <Card title="Evidence request tracker" icon={ClipboardList} flush>
            <DataTable selectable rows={EVIDENCE_REQUESTS} rowKey={(x) => x.id} selected={sel} onRowClick={(x) => setSel(x.id)}
              columns={[
                { key: 'r', header: 'Evidence request', render: (x) => <b>{x.title}</b> },
                { key: 'o', header: 'Owner', render: (x) => mh.requests?.[x.id]?.owner ?? x.owner },
                { key: 'd', header: 'Due date', render: (x) => mh.requests?.[x.id]?.due ?? x.due },
                { key: 's', header: 'Latest status', align: 'center', render: (x) => <StatusChip tone={REQ_TONE[inv.statusOf(x.id)]}>{REQUEST_STATUS_LABEL[inv.statusOf(x.id)]}</StatusChip> },
                { key: 'a', header: 'Action', align: 'center', render: (x) => <Button small onClick={() => setSel(x.id)}>Review</Button> },
              ]} />
          </Card>
          <Card title={`Selected request: ${r.title}`} icon={FileSearch} right={<StatusChip tone={REQ_TONE[status]}>{REQUEST_STATUS_LABEL[status]}</StatusChip>}>
            <div className="grid g3">
              <div>
                <div className="calc-label">Request information</div>
                <List items={[{ label: 'Owner', value: rec?.owner ?? r.owner }, { label: 'Due date', value: rec?.due ?? r.due }]} />
              </div>
              <div>
                <div className="calc-label">Validation checklist</div>
                <List items={r.checklist.map((c) => ({ icon: status === 'validated' ? CircleCheck : CircleAlert, tone: status === 'validated' ? undefined : 'warn' as const, label: c }))} />
              </div>
              <div>
                <div className="calc-label">Evidence requirements</div>
                <List items={r.requirements.map((q) => ({ label: q }))} />
                <div className="calc-label" style={{ marginTop: 12 }}>Source systems</div>
                <List items={[...new Set(EVIDENCE_READINESS.filter((item) => item.request === r.id).map((item) => item.source))].map((label) => ({ label }))} />
              </div>
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card title="Investigation readiness" icon={ShieldCheck}>
            <List items={[
              { label: 'Farmer outreach and trial counts', value: <StatusChip tone="warn">Partial</StatusChip> },
              { label: 'Purchase / adoption data', value: <StatusChip tone={inv.linked ? 'ok' : 'risk'}>{inv.linked ? 'Linked: 54 purchases' : 'Not linked'}</StatusChip> },
              { label: 'Awareness analysis', value: <StatusChip tone={inv.statusOf('awareness') === 'validated' ? 'ok' : 'warn'}>{inv.statusOf('awareness') === 'validated' ? 'Validated' : 'Pending'}</StatusChip> },
              { label: 'Primary conversion barrier', value: <StatusChip tone={inv.allValidated ? 'warn' : 'neutral'}>{inv.allValidated ? 'Conversion friction supported' : 'Unconfirmed'}</StatusChip> },
            ]} />
          </Card>
          <Card title="Available actions" icon={ListChecks}>
            <div className="stack" style={{ gap: 8 }}>
              <Button primary icon={CircleCheck} disabled={status === 'validated'} onClick={validate}>{status === 'validated' ? 'Validated' : 'Review validation'}</Button>
              <Button icon={Send} onClick={() => bh.toast(`Correction requested from ${rec?.owner ?? r.owner}`)}>Request correction</Button>
              <Button icon={Users} onClick={() => bh.toast(`Reminder sent to ${rec?.owner ?? r.owner}`)}>Track owner</Button>
              <Button icon={ArrowRight} disabled={!inv.allValidated} onClick={() => go(M.updated)}>Updated investigation results</Button>
            </div>
          </Card>
        </div>
      </div>
    </MhPage>
  );
}

// ================================================================ 10 Updated Investigation & Growth Barrier Diagnosis
export function UpdatedInvestigation() {
  const inv = useInvestigation();
  const f = funnel(inv.linked);
  const tiles = [
    { t: 'Purchase records', s: inv.statusOf('purchases') },
    { t: 'Call-centre responses', s: inv.statusOf('awareness') },
    { t: 'Retailer recommendation', s: inv.statusOf('retailer') },
    { t: 'Stock signals', s: inv.statusOf('retailer') },
  ];
  const LEVEL: Record<string, { level: string; tone: Tone; note: string }> = {
    awareness: { level: 'Needs comparison', tone: 'warn', note: `Reach is ${pct(f.reachPct, 0)} of eligible farmers; compare with a benchmark.` },
    conversion: { level: inv.linked ? 'Supported' : 'Not linked', tone: inv.linked ? 'ok' : 'warn', note: inv.linked ? `Trial-to-purchase at ${pct(f.trialToPurchasePct!, 0)} indicates conversion friction.` : 'Purchases not yet linked to trials.' },
    channel: { level: inv.statusOf('retailer') === 'validated' ? 'Partly confirmed' : 'Unconfirmed', tone: 'warn', note: 'Retailer recommendation evidence is partial.' },
    retention: { level: 'Not yet measurable', tone: 'neutral', note: 'Repeat purchase shows next season.' },
  };
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Updated Investigation & Growth Barrier Diagnosis" back={M.evidence} next={M.refreshed} nextLabel="Refresh campaign recommendations"
      right={<StatusChip tone={inv.allValidated ? 'ok' : 'warn'}>{inv.allValidated ? 'Evidence confidence: medium' : 'Evidence still pending'}</StatusChip>}>
      <MhStudioTabs active={1} />
      <div className="kpis">
        {tiles.map((x) => <KpiCard key={x.t} label={x.t} value={x.s === 'validated' ? (x.t === 'Stock signals' ? 'Partly verified' : 'Validated') : REQUEST_STATUS_LABEL[x.s]} />)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 240px' }}>
        <Card title="Updated farmer conversion funnel (pilot subset)" icon={Users}><Funnel linked={inv.linked} /></Card>
        <Card title="Trial-to-purchase conversion" icon={ChartColumn}>
          <div className="recon compact" style={{ gridTemplateColumns: '1fr' }}><div><span>{inv.linked ? `${f.purchases} of ${f.trials} trials` : 'Purchases not linked'}</span><b>{inv.linked ? pct(f.trialToPurchasePct!, 0) : 'NA'}</b></div></div>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 1fr)' }}>
        <Card title="Before vs after findings" icon={Search}>
          <div className="calc-label">Before (initial analysis)</div>
          <List items={[{ label: 'Purchases', value: 'Not linked' }, { label: 'Primary barrier', value: 'Unconfirmed' }]} />
          <div className="calc-label">Now (after validation)</div>
          <List items={[{ label: 'Trial-to-purchase', value: inv.linked ? `${pct(f.trialToPurchasePct!, 0)} (${f.purchases} of ${f.trials})` : 'NA' }, { label: 'Barrier', value: inv.linked ? 'Conversion friction; needs a benchmark' : 'Unconfirmed' }]} />
        </Card>
        <Card title="Growth barrier assessment" icon={ShieldCheck} flush>
          <DataTable rows={BARRIERS} rowKey={(b) => b.id}
            columns={[
              { key: 'b', header: 'Growth area', render: (b) => <b>{b.barrier}</b> },
              { key: 'l', header: 'Evidence level', align: 'center', render: (b) => <StatusChip tone={LEVEL[b.id].tone}>{LEVEL[b.id].level}</StatusChip> },
              { key: 'n', header: 'Interpretation', render: (b) => LEVEL[b.id].note },
            ]} />
        </Card>
        <Notes title="Implications" items={[
          `Croptek conversion: candidate, given ${inv.linked ? `the ${pct(f.trialToPurchasePct!, 0)} trial-to-purchase` : 'the conversion focus'}.`,
          'Product awareness: alternative if further analysis shows low awareness.',
          'Retailer advocacy: alternative; retailer engagement needs stronger validation.',
          'Compare the conversion rate with a reliable historical cohort before the final choice.',
        ]} />
      </div>
    </MhPage>
  );
}

// ================================================================ 11 Refreshed Recommendations & Selection
export function RefreshedRecommendations() {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const inv = useInvestigation();
  const f = funnel(inv.linked);
  const r = RECOMMENDATIONS.find((x) => x.id === mh.refreshed)!;
  const design = () => { bh.toast(`${r.name} selected for campaign design`); go(M.themeBrief); };
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Refreshed Recommendations & Selection" back={M.updated} next={design} nextLabel="Design selected campaign"
      right={<StatusChip tone="neutral">Draft candidate · not approved</StatusChip>}>
      <MhStudioTabs active={2} />
      <div className="kpis">
        <KpiCard label="Eligible farmers" value={num(f.eligible)} />
        <KpiCard label="Reached" value={num(f.reached)} />
        <KpiCard label="Documented trials" value={num(f.trials)} />
        <KpiCard label="Matched purchases" value={f.purchases === null ? 'Not linked' : num(f.purchases)} />
        <KpiCard label="Trial-to-purchase" value={f.trialToPurchasePct === null ? 'NA' : pct(f.trialToPurchasePct, 0)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title="Refreshed campaign recommendations" icon={ListChecks} flush right={<Button small icon={MessageSquare} onClick={() => go(`${M.diagnosis}?analysis=1`)}>Request further analysis</Button>}><RecommendationTable refreshed /></Card>
        <div className="stack">
          <Suitability id={r.id} refreshed />
          <Notes title="Recommendation notes" items={[
            `Before: conversion not measurable. Now: ${f.trialToPurchasePct === null ? 'purchases still to link' : `trial-to-purchase ${pct(f.trialToPurchasePct, 0)} for the matched cohort`}.`,
            `${r.name} confidence moved ${r.before.toLowerCase()} → ${r.after.toLowerCase()}.`,
            'Historical comparison, retailer influence and stock verification remain outstanding.',
            'A selected campaign is a draft for design; approval comes after the proposals.',
          ]} />
        </div>
      </div>
    </MhPage>
  );
}


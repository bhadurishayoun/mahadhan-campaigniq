/** Marketing Head screens 17–22: approval, release and rollout, portfolio and programme performance, drivers, AI Copilot workspace. */
import {
  ArrowRight, BookOpen, CircleAlert, CircleCheck, ClipboardList, FileText, Flag, Layers, MapPin, MessageCircle, MessageSquare, Send, ShieldCheck, Target, TrendingUp, Undo2, Users,
} from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { campaignById, netRoi, THEMES } from '../../data/bh';
import { lakh, num, pct, sum, times } from '../../data/format';
import {
  APPROVAL_ITEMS, APPROVAL_LABEL, REVIEW_DECISIONS, INTERVENTION_PERFORMANCE, OPTIMISATION_FOCUS, PERFORMANCE_DRIVERS, PLAYBOOK, proposals, regionRows, ROLLOUT_ENVELOPE, ROLLOUT_LABEL,
  ROLLOUT_READINESS, rolloutTerritories, STAGE_COUNTS, territoryImpact, westCampaigns, type RolloutStatus,
} from '../../data/mh';
import { PROPOSALS } from '../../data/zm';
import { M } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useMhStore } from '../../store/mhStore';
import { useZmStore } from '../../store/zmStore';
import { SERIES } from '../../theme';
import { GroupedBars, HBars } from '../../ui/charts';
import { DataTable } from '../../ui/DataTable';
import { Bar, Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, type Evidence } from '../../ui/overlay';
import { opt, useGo } from '../common';
import { EditBar, Field, LeaveGuard, List, Notes } from '../zm/parts';
import { MhPage, MH_SECTION, useMhRegion } from './frame';

const ALL = 'all';
const CROPTEK = () => campaignById('croptek');
const pp = (v: number) => `${v > 0 ? '+' : v < 0 ? '–' : ''}${Math.abs(v)} pp`;
const CONF_TONE: Record<string, Tone> = { Medium: 'warn', Low: 'risk', 'Not started': 'neutral', High: 'ok' };

/** Proposal id from the route (c1 / c2) with its figures and label. */
function useProposal() {
  const { id } = useParams();
  const pid = id === 'c2' ? 'c2' : 'c1';
  const p = proposals().find((x) => x.id === pid)!;
  return { ...p, id: pid, label: PROPOSALS.find((x) => x.id === pid)!.label };
}
function useApproval(id: string) {
  const mh = useMhStore();
  const state = mh.approval?.[id];
  const isVerified = (a: (typeof APPROVAL_ITEMS)[number]) => a.base === 'verified' || mh.verified.includes(a.id);
  const mandatoryOpen = APPROVAL_ITEMS.filter((a) => a.mandatory && !isVerified(a));
  const tone: Tone = state === 'approved' ? 'ok' : state === 'returned' ? 'risk' : 'warn';
  return { state, isVerified, mandatoryOpen, chip: <StatusChip tone={tone}>{APPROVAL_LABEL[state ?? 'pending']}</StatusChip> };
}

// ================================================================ 17 Campaign approval & rollout authorisation
export function ApprovalDecision() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const mh = useMhStore();
  const p = useProposal();
  const ap = useApproval(p.id);
  const saved = mh.approvalNotes?.[p.id] ?? '';
  const [note, setNote] = useState(saved);
  const changed = note !== saved ? ['Decision comments'] : [];
  const saveNote = () => mh.setApprovalNote(p.id, note);
  const approve = () => {
    if (ap.state === 'approved') { go(M.rollout(p.id)); return; }
    if (ap.mandatoryOpen.length) { bh.toast(`Verify the mandatory checks first: ${ap.mandatoryOpen.map((a) => a.item).join('; ')}`); return; }
    if (changed.length) saveNote();
    mh.setApproval(p.id, 'approved');
    zm.setProposalStatus([p.id], 'approved');
    bh.toast(`${p.label} approved · ${p.name}`);
    setTimeout(() => go(M.rollout(p.id)), 0);
  };
  const returnToZm = () => {
    if (changed.length) saveNote();
    mh.setApproval(p.id, 'returned');
    zm.setProposalStatus([p.id], 'returned');
    bh.toast(`${p.label} returned to the Zonal Manager for revision`);
  };
  const escalate = () => {
    if (changed.length) saveNote();
    mh.setApproval(p.id, 'escalated');
    bh.addIntervention({
      id: `mh-escalation-${p.id}`, name: `${p.name} approval escalation`, category: 'Strategic theme', geography: 'West', trigger: 'Escalated by Marketing Head',
      role: 'Business Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Escalated · decision pending', campaign: 'croptek', deliverable: 'Financial authority decision',
    });
    bh.toast(`${p.label} escalated to the Business Head`);
  };
  const verifiedCount = APPROVAL_ITEMS.filter(ap.isVerified).length;
  return (
    <MhPage {...MH_SECTION.approvals} trail={`${p.label} · ${p.name}`} title="Campaign Approval & Rollout Authorisation" back={M.compare} next={approve}
      nextLabel={ap.state === 'approved' ? 'Open release and rollout' : 'Approve campaign'} right={ap.chip}>
      <div className="kpis">
        <KpiCard label="Proposed regional investment" value={lakh(p.investment)} />
        <KpiCard label="Incremental sales forecast" value={lakh(p.sales)} />
        <KpiCard label="Incremental contribution" value={lakh(p.contribution, 1)} />
        <KpiCard label="Net ROI" value={times(p.roi)} />
        <KpiCard label="Checks verified" value={`${verifiedCount} of ${APPROVAL_ITEMS.length}`} />
      </div>
      <EditBar count={changed.length} onCancel={() => setNote(saved)} onSave={saveNote} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <div className="stack">
          <Card title="Campaign approval brief" icon={FileText}>
            <div className="kv"><span>Parent theme</span><b>Croptek conversion</b></div>
            <div className="kv"><span>Priority market</span><b>Maharashtra · Onion</b></div>
            <div className="kv"><span>Owner</span><b>Zonal Manager · Marathwada zone</b></div>
            <div className="kv"><span>Proposal</span><b>{p.label}: {p.name}</b></div>
            <div className="kv"><span>Review decision</span><b>{mh.decision ? REVIEW_DECISIONS.find((d) => d.id === mh.decision)!.label : 'Not recorded'}</b></div>
            <div className="kv"><span>Regional envelope</span><b>{lakh(ROLLOUT_ENVELOPE())} (territory budgets reconcile to it)</b></div>
            <div className="kv"><span>Net ROI basis</span><b>({lakh(p.contribution, 1)} − {lakh(p.investment)}) / {lakh(p.investment)} = {times(p.roi)}</b></div>
          </Card>
          <Card title="Approval readiness and exceptions" icon={ShieldCheck} flush style={{ flex: 1 }}>
            <DataTable rows={APPROVAL_ITEMS} rowKey={(a) => a.id} columns={[
              { key: 'item', header: 'Check', render: (a) => <b>{a.item}</b> },
              { key: 'm', header: 'Type', render: (a) => (a.mandatory ? 'Mandatory' : 'Optional') },
              { key: 's', header: 'Status', render: (a) => <StatusChip tone={ap.isVerified(a) ? 'ok' : 'warn'}>{ap.isVerified(a) ? 'Verified' : 'Pending'}</StatusChip> },
              { key: 'a', header: 'Action', render: (a) => (ap.isVerified(a) ? <span className="na">NA</span> : <Button small icon={CircleCheck} onClick={() => { mh.verify(a.id); bh.toast(`Verified: ${a.item}`); }}>Mark verified</Button>) },
            ]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Marketing Head decision" icon={Users} style={{ flex: 1 }}>
            <Field label="Decision comments">
              <textarea className={`input${changed.length ? ' chg' : ''}`} rows={5} maxLength={1000} aria-label="Decision comments" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <small className="muted">{num(note.length)} / {num(1000)}</small>
            <div className="stack" style={{ gap: 8, marginTop: 12 }}>
              <Button icon={Undo2} disabled={ap.state === 'approved'} onClick={returnToZm}>Return to Zonal Manager</Button>
              <Button icon={Flag} disabled={ap.state === 'approved' || ap.state === 'escalated'} onClick={escalate}>Escalate to Business Head</Button>
            </div>
          </Card>
          <Notes title="Approval notes" items={[
            ap.mandatoryOpen.length ? `${ap.mandatoryOpen.length} mandatory check${ap.mandatoryOpen.length === 1 ? '' : 's'} still open.` : 'All mandatory checks verified; approval can be completed.',
            `Forecast ${lakh(p.sales)} sales on ${lakh(p.investment)}, ${times(p.roi)} net ROI.`,
            `${lakh(ROLLOUT_ENVELOPE())} is the regional envelope; territory budgets reconcile to it.`,
          ]} />
        </div>
      </div>
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={saveNote} onDiscard={() => setNote(saved)} />
    </MhPage>
  );
}

// ================================================================ 18 Approved campaign release & territory rollout
const ELIGIBLE: RolloutStatus[] = ['running', 'eligible'];
export function ReleaseRollout() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const mh = useMhStore();
  const p = useProposal();
  const ap = useApproval(p.id);
  const rows = rolloutTerritories();
  const eligible = rows.filter((r) => ELIGIBLE.includes(r.status));
  const allValidated = eligible.every((r) => mh.validated.includes(r.id));
  const ready = ROLLOUT_READINESS.every((r) => mh.readiness.includes(r.id));
  const publish = () => {
    if (mh.published) { go(M.performance); return; }
    if (ap.state !== 'approved') { bh.toast('Approve the campaign before publishing'); return; }
    if (!allValidated) { bh.toast(`Validate the ${eligible.length} eligible territories first`); return; }
    if (!ready) { bh.toast('Complete the rollout readiness checklist first'); return; }
    mh.publish();
    zm.release();
    bh.toast(`Playbook published to ${eligible.length} eligible Field Sales Managers`);
    setTimeout(() => go(M.performance), 0);
  };
  const dist = (r: (typeof rows)[number]): { label: string; tone: Tone } => {
    if (!ELIGIBLE.includes(r.status)) return { label: ROLLOUT_LABEL[r.status], tone: 'neutral' };
    if (mh.published) return { label: 'Published', tone: 'ok' };
    return mh.validated.includes(r.id) ? { label: 'Validated', tone: 'ok' } : { label: 'Draft · not published', tone: 'warn' };
  };
  const [proposal, setProposal] = useState(false);
  const evidence: Evidence = {
    title: `Approved proposal: ${p.name}`, owner: 'Zonal Manager · Marathwada zone',
    facts: [{ label: 'Investment', value: lakh(p.investment) }, { label: 'Forecast sales', value: lakh(p.sales) }, { label: 'Net ROI', value: times(p.roi) }, { label: 'Approval', value: APPROVAL_LABEL[ap.state ?? 'pending'] }],
  };
  return (
    <MhPage {...MH_SECTION.approvals} trail={`${p.label} · release`} title="Approved Campaign Release & Territory Rollout" back={M.decision(p.id)} next={publish}
      nextLabel={mh.published ? 'View portfolio performance' : 'Publish to eligible Field Sales Managers'}
      right={<StatusChip tone={mh.published ? 'ok' : 'warn'}>{mh.published ? 'Published' : 'Not yet published'}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Approved regional envelope" value={lakh(ROLLOUT_ENVELOPE())} />
        <KpiCard label="Eligible territories" value={num(eligible.length)} />
        <KpiCard label="Territories validated" value={mh.validated.length ? `${mh.validated.length} of ${eligible.length}` : 'None yet'} />
        <KpiCard label="Approval" value={ap.state === "approved" ? "Approved" : ap.state === "escalated" ? "Escalated" : ap.state === "returned" ? "Returned" : "Pending"} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title="Territory campaign recommendation distribution" icon={MapPin} flush right={<Button small icon={FileText} onClick={() => setProposal(true)}>View approved proposal</Button>}>
          <DataTable rows={rows} rowKey={(r) => r.id} total={{ name: <b>Total</b>, budget: <b>{lakh(sum(rows, (r) => r.budget), 1)}</b> }} columns={[
            { key: 'name', header: 'Territory', render: (r) => <b>{r.name}</b> },
            { key: 'fsm', header: 'Field Sales Manager', render: (r) => r.fsm },
            { key: 'budget', header: 'Budget', align: 'right', render: (r) => lakh(r.budget, 1) },
            { key: 'elig', header: 'Eligibility', render: (r) => <StatusChip tone={ELIGIBLE.includes(r.status) ? 'ok' : 'neutral'}>{ELIGIBLE.includes(r.status) ? 'Eligible' : ROLLOUT_LABEL[r.status]}</StatusChip> },
            { key: 'dist', header: 'Distribution', render: (r) => <StatusChip tone={dist(r).tone}>{dist(r).label}</StatusChip> },
            {
              key: 'act', header: 'Action', render: (r) => (ELIGIBLE.includes(r.status) && !mh.validated.includes(r.id)
                ? <Button small icon={CircleCheck} onClick={() => { mh.validate(r.id); bh.toast(`${r.name} validated for release`); }}>Validate</Button>
                : <span className="na">NA</span>),
            },
          ]} />
        </Card>
        <Card title="Approved campaign playbook" icon={BookOpen}>
          <List items={PLAYBOOK.map((x) => ({ label: x.label, value: x.value }))} />
        </Card>
      </div>
      <Card title="Rollout readiness" icon={ShieldCheck} right={<StatusChip tone={ready ? 'ok' : 'warn'}>{ready ? 'Ready for publication' : 'Not ready'}</StatusChip>}>
          <div className="stack" style={{ gap: 8 }}>
            {ROLLOUT_READINESS.map((r) => (
              <label key={r.id} className="row" style={{ gap: 8 }}>
                <input type="checkbox" aria-label={r.label} checked={mh.readiness.includes(r.id)} disabled={mh.published} onChange={() => mh.toggleReadiness(r.id)} /><span>{r.label}</span>
              </label>
            ))}
          </div>
      </Card>
      {proposal && <EvidenceDrawer evidence={evidence} onClose={() => setProposal(false)} />}
    </MhPage>
  );
}

// ================================================================ 19 National & regional campaign portfolio performance
type PerfView = 'campaigns' | 'regions';
export function PortfolioPerformance() {
  const go = useGo();
  const mh = useMhStore();
  const camps = westCampaigns();
  const regions = regionRows();
  const [view, setView] = useState<PerfView>('campaigns');
  const [region, setRegion] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [sort, setSort] = useState('exec');
  const shown = camps.filter((c) => (region === ALL || c.region === region) && (theme === ALL || c.theme === theme))
    .sort((a, b) => (sort === 'roi' ? b.roi - a.roi : sort === 'variance' ? a.variance - b.variance : b.observedExec - a.observedExec));
  const c1 = proposals()[0];
  const ct = CROPTEK();
  const adopters = sum(camps, (c) => c.adopters);
  const sales = sum(camps, (c) => c.sales);
  const spend = sum(camps, (c) => c.actual);
  const worst = [...INTERVENTION_PERFORMANCE].sort((a, b) => a.observed - a.planned - (b.observed - b.planned))[0];
  const themeName = (id: string) => THEMES.find((t) => t.id === id)?.name ?? id;
  return (
    <MhPage {...MH_SECTION.performance} trail="National portfolio" title="National & Regional Campaign Portfolio Performance" back={M.rollout()} next={M.programme('west')} nextLabel="View regional programme"
      right={<StatusChip tone={mh.published ? 'ok' : 'neutral'}>{mh.published ? 'Croptek playbook published' : 'Croptek playbook not yet published'}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Croptek programme execution" value={pct(ct.observedExec, 0)} />
        <KpiCard label="Verified adopters" value={num(adopters)} />
        <KpiCard label="Validated incremental sales" value={lakh(sales)} />
        <KpiCard label="Portfolio net ROI" value={times(netRoi(sales, spend))} />
      </div>
      <FilterRows<PerfView> view={view} setView={setView} views={[{ value: 'campaigns', label: 'Campaigns' }, { value: 'regions', label: 'Regions' }]}
        filters={[
          { key: 'region', label: 'Region', value: region, options: [opt(ALL, 'All regions'), ...regions.map((r) => opt(r.id, `${r.name} region`))], onChange: setRegion },
          { key: 'theme', label: 'Theme', value: theme, options: [opt(ALL, 'All themes'), ...THEMES.map((t) => opt(t.id, t.name))], onChange: setTheme },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sort, options: [opt('exec', 'Execution'), opt('variance', 'Variance'), opt('roi', 'Net ROI')], onChange: setSort }]} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        {view === 'campaigns' ? (
          <Card title="Campaign performance by theme" icon={Target} flush>
            <DataTable rows={shown} rowKey={(c) => c.id} total={{ theme: <b>Total</b>, ad: <b>{num(sum(shown, (c) => c.adopters))}</b>, roi: <b>{times(netRoi(sum(shown, (c) => c.sales), sum(shown, (c) => c.actual)))}</b> }} onRowClick={(c) => c.id === 'croptek' && go(M.programme('west'))} columns={[
              { key: 'theme', header: 'Theme', render: (c) => themeName(c.theme) },
              { key: 'name', header: 'Campaign', render: (c) => <b>{c.name}</b> },
              { key: 'exec', header: 'Execution', render: (c) => <div className="row"><div style={{ flex: 1, minWidth: 60 }}><Bar value={c.observedExec} /></div><b>{pct(c.observedExec, 0)}</b></div> },
              { key: 'var', header: 'Variance', align: 'right', render: (c) => pp(c.variance) },
              { key: 'ad', header: 'Adopters', align: 'right', render: (c) => num(c.adopters) },
              { key: 'roi', header: 'Net ROI', align: 'right', render: (c) => times(c.roi) },
            ]} />
          </Card>
        ) : (
          <Card title="Regional portfolio" icon={MapPin} flush>
            <DataTable rows={regions.filter((r) => region === ALL || r.id === region)} rowKey={(r) => r.id} columns={[
              { key: 'name', header: 'Region', render: (r) => <b>{r.name}</b> },
              { key: 'c', header: 'Campaigns', align: 'right', render: (r) => num(r.campaigns) },
              { key: 'i', header: 'Investment', align: 'right', render: (r) => lakh(r.investment) },
              { key: 's', header: 'Validated sales', align: 'right', render: (r) => lakh(r.validatedSales) },
              { key: 'r', header: 'Net ROI', align: 'right', render: (r) => times(r.roi) },
            ]} />
          </Card>
        )}
        <Card title="Planned vs observed execution" icon={TrendingUp}>
          <GroupedBars height={170} data={shown.map((c) => ({ name: c.short, planned: c.plannedExec, observed: c.observedExec }))} x="name" unit="%" max={100}
            tooltip={(d) => `${d.name} · Planned ${d.planned}% · Observed ${d.observed}%`}
            series={[{ key: 'planned', label: 'Planned', color: SERIES.planned }, { key: 'observed', label: 'Observed', color: SERIES.observed }]} />
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' }}>
        <Card title="Croptek programme forecast (West region)" icon={ClipboardList}>
          <List items={[
            { label: 'Investment', value: lakh(c1.investment) }, { label: 'Incremental sales', value: lakh(c1.sales) },
            { label: 'Contribution', value: lakh(c1.contribution, 1) }, { label: 'Net ROI', value: times(c1.roi) },
          ]} />
        </Card>
        <Card title="Intervention effectiveness" icon={Layers}>
          <HBars rows={INTERVENTION_PERFORMANCE.map((x) => ({ label: x.name, values: [x.planned, x.observed], title: `${x.name} · Planned ${x.planned}% · Observed ${x.observed}%` }))}
            series={[{ key: 'p', label: 'Planned', color: SERIES.planned }, { key: 'o', label: 'Observed', color: SERIES.observed }]} max={100} format={(v) => pct(v, 0)} labelWidth={140} />
          <List items={INTERVENTION_PERFORMANCE.map((x) => ({ label: `${x.name} gap to plan`, value: pp(x.observed - x.planned) }))} />
        </Card>
        <Notes title="Portfolio notes" items={[
          `Croptek execution ${pct(ct.observedExec, 0)} against ${pct(ct.plannedExec, 0)} planned (${pp(ct.observedExec - ct.plannedExec)}).`,
          `${worst.name} is furthest behind plan (${pp(worst.observed - worst.planned)}).`,
          `${num(adopters)} verified adopters and ${lakh(sales)} validated sales across ${camps.length} West campaigns.`,
          'Compare intervention performance before scale-up.',
          'Check territory readiness and stock alignment.',
        ]} />
      </div>
    </MhPage>
  );
}

// ================================================================ 20 Regional programme performance & rollout
function useProgramme() {
  const impact = territoryImpact();
  const rows = rolloutTerritories().map((r) => ({ ...r, impact: impact.find((x) => x.territory === r.id) ?? null }));
  return { rows, ct: CROPTEK() };
}
const ROLL_TONE: Record<RolloutStatus, Tone> = { running: 'ok', eligible: 'warn', pending: 'neutral', not_eligible: 'neutral' };

function StageCounts() {
  return (
    <div className="journey">
      {STAGE_COUNTS.map((s, i) => (
        <Fragment key={s.stage}>
          <div className={`journey-step${i === STAGE_COUNTS.length - 1 ? ' on' : ''}`}><span className="bridge-value">{num(s.n)}</span><small>{s.stage}</small></div>
          {i < STAGE_COUNTS.length - 1 && <ArrowRight size={16} className="journey-arrow" />}
        </Fragment>
      ))}
    </div>
  );
}

export function ProgrammePerformance() {
  const go = useGo();
  const region = useMhRegion();
  const { rows, ct } = useProgramme();
  const variance = ct.observedExec - ct.plannedExec;
  const running = rows.filter((r) => r.status === 'running').length;
  return (
    <MhPage {...MH_SECTION.performance} trail="Croptek conversion · West region" title="Regional Programme Performance & Rollout" back={M.performance} next={M.drivers(region)} nextLabel="Investigate performance drivers"
      right={<StatusChip tone="warn">{pp(variance)} behind plan</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Programme execution (observed)" value={pct(ct.observedExec, 0)} />
        <KpiCard label="Planned at checkpoint" value={pct(ct.plannedExec, 0)} />
        <KpiCard label="Variance" value={pp(variance)} />
        <KpiCard label="Territories running" value={num(running)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title="Territory-wise programme rollout" icon={MapPin} flush right={<Button small icon={MapPin} onClick={() => go(`${M.drivers(region)}?explore=ambad`)}>View territory impact</Button>}>
          <DataTable rows={rows} rowKey={(r) => r.id} columns={[
            { key: 'name', header: 'Territory', render: (r) => <b>{r.name}</b> },
            { key: 'link', header: 'Campaign linkage', render: (r) => r.impact?.campaign ?? <span className="na">NA</span> },
            { key: 'st', header: 'Activation', render: (r) => <StatusChip tone={ROLL_TONE[r.status]}>{ROLLOUT_LABEL[r.status]}</StatusChip> },
            { key: 'prog', header: 'Execution', align: 'right', render: (r) => (r.impact?.done != null ? `${r.impact.done} / ${r.impact.planned}` : <span className="na">NA</span>) },
            { key: 'conf', header: 'Outcome confidence', render: (r) => (r.impact ? <StatusChip tone={CONF_TONE[r.impact.confidence]}>{r.impact.confidence}</StatusChip> : <span className="na">NA</span>) },
            { key: 'v', header: 'View', render: (r) => (r.id === 'other' ? <span className="na">NA</span> : <Button small onClick={() => go(`${M.drivers(region)}?explore=${r.id}`)}>View</Button>) },
          ]} />
        </Card>
        <div className="stack">
          <Card title="Programme progress" icon={TrendingUp}>
            <HBars rows={[{ label: 'Campaign execution', values: [ct.observedExec, ct.plannedExec], title: `Observed ${ct.observedExec}% · Planned ${ct.plannedExec}%` }]}
              series={[{ key: 'o', label: 'Observed', color: SERIES.observed }, { key: 'p', label: 'Planned', color: SERIES.planned }]} max={100} format={(v) => pct(v, 0)} labelWidth={110} />
          </Card>
          <Card title="Approved playbook" icon={BookOpen} style={{ flex: 1 }} right={<Button small onClick={() => go(M.rollout())}>Open</Button>}>
            <List items={PLAYBOOK.slice(0, 3).map((x) => ({ label: x.label, value: x.value }))} />
          </Card>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title="Campaign stage distribution (territory campaigns)" icon={Layers}>
          <StageCounts />
          <List items={STAGE_COUNTS.slice(1).map((st, i) => ({ label: `${STAGE_COUNTS[i].stage} → ${st.stage.toLowerCase()}`, value: `${st.n} of ${STAGE_COUNTS[i].n} (${pct((st.n / STAGE_COUNTS[i].n) * 100, 0)})` }))} />
        </Card>
        <Notes title="Programme notes" items={[
          `Programme is ${Math.abs(variance)} pp behind plan (${pct(ct.observedExec, 0)} vs ${pct(ct.plannedExec, 0)}).`,
          `${num(running)} territory running; ${rows.filter((r) => r.status === 'eligible').length} eligible to start.`,
          `${STAGE_COUNTS[0].n} recommendations published, ${STAGE_COUNTS[3].n} campaigns running.`,
          'Review execution gaps across territories before scale-up.',
        ]} />
      </div>
    </MhPage>
  );
}

// ================================================================ 21 Regional performance driver diagnostics (+ drawers)
function TerritoryImpactDrawer({ initial, onClose }: { initial: string; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const { rows } = useProgramme();
  const [t, setT] = useState(rows.some((r) => r.id === initial) ? initial : 'ambad');
  const r = rows.find((x) => x.id === t)!;
  const i = r.impact;
  const conv = i?.trials && i.adopters !== null ? (i.adopters / i.trials) * 100 : null;
  const NA = <span className="na">NA</span>;
  const clarify = () => {
    zm.addQuestion({ id: `mh-territory-${t}-${Date.now()}`, question: `Please clarify campaign progress and next steps in ${r.name}.`, topic: 'Territory clarification' });
    bh.toast(`Territory clarification requested · ${r.name}`);
  };
  return (
    <Drawer title="Territory impact explorer" onClose={onClose} status={<StatusChip tone={ROLL_TONE[r.status]}>{ROLLOUT_LABEL[r.status]}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={MessageSquare} onClick={clarify}>Request territory clarification</Button>} />}>
      <Card title="Select territory" icon={MapPin} flush>
        <DataTable selectable rows={rows} rowKey={(x) => x.id} selected={t} onRowClick={(x) => setT(x.id)} columns={[
          { key: 'n', header: 'Territory', render: (x) => <b>{x.name}</b> },
          { key: 'c', header: 'Campaign linkage', render: (x) => x.impact?.campaign ?? 'Eligibility review' },
          { key: 's', header: 'Local campaign status', render: (x) => <StatusChip tone={ROLL_TONE[x.status]}>{ROLLOUT_LABEL[x.status]}</StatusChip> },
        ]} />
      </Card>
      <div className="grid g2">
        <Card title={`${r.name}: campaign view`} icon={Target}>
          <List items={[
            { label: 'Qualified farmer reach', value: i?.reached != null ? num(i.reached) : NA },
            { label: 'Documented trials', value: i?.trials != null ? num(i.trials) : NA },
            { label: 'Recorded adopters', value: i?.adopters != null ? num(i.adopters) : NA },
            { label: 'Trial-to-adoption', value: conv === null ? NA : pct(conv) },
            { label: 'Campaign-linked sales', value: i?.sales != null ? lakh(i.sales, 1) : NA },
          ]} />
        </Card>
        <Card title="Execution and budget" icon={ClipboardList}>
          <List items={[
            { label: 'Activities', value: i?.done != null ? `${i.done} / ${i.planned}` : NA },
            { label: 'Territory budget', value: lakh(r.budget, 1) },
            { label: 'Field Sales Manager', value: r.fsm },
            { label: 'Outcome confidence', value: i ? <StatusChip tone={CONF_TONE[i.confidence]}>{i.confidence}</StatusChip> : NA },
          ]} />
        </Card>
      </div>
    </Drawer>
  );
}

function OptimisationDrawer({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const mh = useMhStore();
  const [focus, setFocus] = useState<string[]>([OPTIMISATION_FOCUS[0]]);
  const [question, setQuestion] = useState('');
  const [due, setDue] = useState('');
  const [tried, setTried] = useState(false);
  const err = !focus.length ? 'Select at least one focus area' : question.trim().length < 10 ? 'Describe the review request (at least 10 characters)' : '';
  const send = () => {
    setTried(true);
    if (err) return;
    zm.addQuestion({ id: `mh-optimisation-${Date.now()}`, question: question.trim(), topic: `Optimisation review · ${focus.join(', ')}` });
    mh.requestOptimisation();
    bh.toast('Optimisation review requested from the Zonal Manager');
    onSent();
  };
  return (
    <Drawer title="Request campaign optimisation review" width={640} onClose={onClose} status={<StatusChip tone="neutral">Draft</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send to Zonal Manager</Button>} />}>
      <Field label="Recipient"><Select label="Recipient" value="zm" onChange={() => undefined} options={[opt('zm', 'Zonal Manager · Marathwada zone')]} /></Field>
      <Field label="Focus areas *" error={tried && !focus.length ? 'Select at least one focus area' : ''}>
        <div className="stack" style={{ gap: 6 }}>
          {OPTIMISATION_FOCUS.map((f) => (
            <label key={f} className="row" style={{ gap: 8 }}>
              <input type="checkbox" aria-label={f} checked={focus.includes(f)} onChange={() => setFocus((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))} /><span>{f}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Review request *" error={tried && focus.length ? err : ''}><textarea className="input" rows={4} maxLength={600} aria-label="Review request" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
      <Field label="Response due date"><input className="input" type="date" aria-label="Response due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
    </Drawer>
  );
}

export function PerformanceDrivers() {
  const go = useGo();
  const region = useMhRegion();
  const [params, setParams] = useSearchParams();
  const explore = params.get('explore');
  const [panel, setPanel] = useState<'source' | 'optimise' | null>(null);
  const ct = CROPTEK();
  const variance = ct.observedExec - ct.plannedExec;
  const follow = INTERVENTION_PERFORMANCE.find((x) => x.id === 'followup')!;
  const source: Evidence = {
    title: 'Source evidence: Croptek programme', owner: 'Regional programme, approved playbook and territory impact records',
    facts: [
      { label: 'Planned execution', value: pct(ct.plannedExec, 0) }, { label: 'Observed execution', value: pct(ct.observedExec, 0) },
      { label: 'Farmer follow-up', value: `${pct(follow.observed, 0)} of ${pct(follow.planned, 0)} planned` }, { label: 'Running territory campaigns', value: num(STAGE_COUNTS[3].n) },
    ],
  };
  const refs: { label: string; to: string }[] = [
    { label: 'Regional programme', to: M.programme(region) }, { label: 'Approved playbook', to: M.rollout() }, { label: 'Portfolio performance', to: M.performance },
  ];
  return (
    <MhPage {...MH_SECTION.performance} trail="Croptek conversion · West region" title="Regional Campaign Performance Driver Diagnostics" back={M.programme(region)} next={() => setPanel('optimise')} nextLabel="Request optimisation review"
      right={<StatusChip tone="warn">{pp(variance)} variance</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Planned execution" value={pct(ct.plannedExec, 0)} />
        <KpiCard label="Observed execution" value={pct(ct.observedExec, 0)} />
        <KpiCard label="Variance" value={pp(variance)} />
        <KpiCard label="Farmer follow-up gap" value={pp(follow.observed - follow.planned)} />
      </div>
      <Card title="Programme stage progress" icon={Layers}><StageCounts /></Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title="Performance driver assessment" icon={CircleAlert} flush
          right={<div className="row" style={{ gap: 8 }}><Button small icon={MapPin} onClick={() => setParams({ explore: 'ambad' })}>View territory impact</Button><Button small icon={FileText} onClick={() => setPanel('source')}>View source evidence</Button></div>}>
          <DataTable rows={PERFORMANCE_DRIVERS} rowKey={(d) => d.id} columns={[
            { key: 'd', header: 'Driver', render: (d) => <b>{d.driver}</b> },
            { key: 's', header: 'Evidence status', render: (d) => <StatusChip tone={d.tone}>{d.status}</StatusChip> },
            { key: 'i', header: 'Implication', render: (d) => d.implication },
          ]} />
        </Card>
        <Card title="Source and references" icon={BookOpen}>
          <List items={refs.map((r) => ({ label: r.label, value: <Button small icon={ArrowRight} onClick={() => go(r.to)}>Open</Button> }))} />
        </Card>
      </div>
      <Notes title="Performance notes" items={[
        `Execution ${pct(ct.observedExec, 0)} vs ${pct(ct.plannedExec, 0)} planned (${pp(variance)}).`,
        `Farmer follow-up ${pct(follow.observed, 0)} vs ${pct(follow.planned, 0)} planned is the largest gap.`,
        'Investigate slow plan-to-activation transitions using approved campaign records.',
        'Check retailer, field completion and CRM follow-up data.',
        'Request a Zonal Manager optimisation review only if the evidence warrants it.',
      ]} />
      {explore && <TerritoryImpactDrawer initial={explore} onClose={() => setParams({})} />}
      {panel === 'source' && <EvidenceDrawer evidence={source} onClose={() => setPanel(null)} />}
      {panel === 'optimise' && <OptimisationDrawer onClose={() => setPanel(null)} onSent={() => { setPanel(null); setTimeout(() => go(M.assistant), 0); }} />}
    </MhPage>
  );
}

// ================================================================ 22 AI Copilot workspace
type QId = 'followup' | 'scale' | 'gaps' | 'intervene';
const QUESTIONS: { id: QId; title: string; text: string; keys: string[] }[] = [
  { id: 'followup', title: 'Follow-up lag', text: 'Why is farmer follow-up lagging retailer-led activation in West region?', keys: ['follow', 'lag', 'retailer'] },
  { id: 'scale', title: 'Themes to scale', text: 'Which themes should we scale?', keys: ['scale', 'theme', 'roi', 'return'] },
  { id: 'gaps', title: 'Regional gaps', text: 'Where are the regional gaps?', keys: ['region', 'gap', 'south', 'north', 'east'] },
  { id: 'intervene', title: 'Needs intervention', text: 'What requires intervention?', keys: ['interven', 'action', 'risk', 'territor'] },
];
const match = (t: string): QId => {
  const s = t.toLowerCase();
  return QUESTIONS.map((q) => ({ id: q.id, n: q.keys.filter((k) => s.includes(k)).length })).sort((a, b) => b.n - a.n)[0].id;
};

export function MhAssistant() {
  const go = useGo();
  const region = useMhRegion();
  const mh = useMhStore();
  const [q, setQ] = useState<QId>('followup');
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState<string[]>([]);
  const ct = CROPTEK();
  const camps = westCampaigns();
  const regions = regionRows();
  const themes = THEMES.map((t) => ({ ...t, roi: netRoi(t.sales, t.investment) })).sort((a, b) => b.roi - a.roi);
  const lowest = [...regions].sort((a, b) => a.roi - b.roi)[0];
  const { rows: terr } = useProgramme();
  const answers: Record<QId, { headline: string; summary: string; bars: { label: string; planned: number; observed: number }[] | null; rows: { n: string; what: string; figure: string; to: string }[] }> = {
    followup: {
      headline: 'Farmer follow-up is further behind plan.',
      summary: INTERVENTION_PERFORMANCE.map((x) => `${x.name} is ${Math.abs(x.observed - x.planned)} pp behind plan`).join('; ') + '. Follow-up completion and farmer contact evidence are incomplete.',
      bars: INTERVENTION_PERFORMANCE.map((x) => ({ label: x.name, planned: x.planned, observed: x.observed })),
      rows: [
        ...INTERVENTION_PERFORMANCE.map((x) => ({ n: x.name, what: `${pct(x.observed, 0)} observed vs ${pct(x.planned, 0)} planned`, figure: pp(x.observed - x.planned), to: M.drivers(region) })),
        { n: 'Croptek programme', what: `${pct(ct.observedExec, 0)} observed vs ${pct(ct.plannedExec, 0)} planned`, figure: pp(ct.observedExec - ct.plannedExec), to: M.programme(region) },
      ],
    },
    scale: {
      headline: `${themes[0].name} returns the most.`,
      summary: themes.map((t) => `${t.name} ${times(t.roi)} on ${lakh(t.investment)}`).join('; ') + '.',
      bars: null,
      rows: themes.map((t) => ({ n: t.name, what: `${lakh(t.investment)} invested · ${lakh(t.sales)} sales · ${num(t.adopters)} adopters`, figure: times(t.roi), to: M.performance })),
    },
    gaps: {
      headline: `${lowest.name} region has the lowest return.`,
      summary: regions.map((r) => `${r.name} ${times(r.roi)}`).join(' · ') + '.',
      bars: null,
      rows: regions.map((r) => ({ n: `${r.name} region`, what: `${num(r.campaigns)} campaigns · ${lakh(r.validatedSales)} validated sales`, figure: times(r.roi), to: M.opportunity(r.id) })),
    },
    intervene: {
      headline: `${camps.filter((c) => c.variance < 0).length} West campaigns are behind plan.`,
      summary: `${terr.filter((t) => t.status === 'pending').length} territories have plans pending; ${PERFORMANCE_DRIVERS.filter((d) => d.tone !== 'ok').length} performance drivers need evidence.`,
      bars: camps.map((c) => ({ label: c.short, planned: c.plannedExec, observed: c.observedExec })),
      rows: [
        ...camps.filter((c) => c.variance < 0).map((c) => ({ n: c.name, what: `${pct(c.observedExec, 0)} vs ${pct(c.plannedExec, 0)} planned`, figure: pp(c.variance), to: M.performance })),
        ...terr.filter((t) => t.status === 'pending').map((t) => ({ n: t.name, what: 'Plan pending', figure: lakh(t.budget, 1), to: M.rollout() })),
      ],
    },
  };
  const current = QUESTIONS.find((x) => x.id === q)!;
  const a = answers[q];
  const ask = (id: QId, text: string) => { setQ(id); setAsked((x) => [text, ...x.filter((y) => y !== text)].slice(0, 5)); };
  const submit = () => { if (!draft.trim()) return; ask(match(draft), draft.trim()); setDraft(''); };
  const header: ReactNode = <StatusChip tone={mh.optimisation ? 'ok' : 'neutral'}>{mh.optimisation ? 'Optimisation review requested' : 'No open optimisation review'}</StatusChip>;
  return (
    <MhPage {...MH_SECTION.assistant} trail="West region · campaign performance" title="AI Copilot workspace" back={M.drivers(region)} next={M.overview} nextLabel="Back to national overview" right={header}>
      <div className="kpis">
        <KpiCard label="Croptek execution" value={pct(ct.observedExec, 0)} />
        <KpiCard label="Variance to plan" value={pp(ct.observedExec - ct.plannedExec)} />
        <KpiCard label="Best theme return" value={times(themes[0].roi)} />
        <KpiCard label="Territories running" value={num(terr.filter((t) => t.status === 'running').length)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '260px minmax(0, 1fr) 300px' }}>
        <div className="stack">
          <Card title="Suggested questions" icon={MessageCircle}>
            <div className="geo">
              {QUESTIONS.map((x) => (
                <button key={x.id} type="button" className={x.id === q ? 'on' : ''} onClick={() => ask(x.id, x.text)}><MessageCircle size={16} style={{ flex: 'none' }} /><span className="stack" style={{ gap: 0, alignItems: 'flex-start', textAlign: 'left' }}><b>{x.title}</b><small>{x.text}</small></span></button>
              ))}
            </div>
          </Card>
          <Card title="Recent questions" icon={MessageCircle} style={{ flex: 1 }}>
            {asked.length === 0 ? <List items={[{ label: current.text }]} /> : <div className="geo">{asked.map((t) => <button key={t} type="button" onClick={() => setQ(match(t))}><MessageCircle size={15} />{t}</button>)}</div>}
          </Card>
        </div>
        <Card title={current.text} icon={MessageSquare}>
          <p style={{ margin: '0 0 4px' }}><b>{a.headline}</b></p>
          <p style={{ margin: '0 0 12px' }}>{a.summary}</p>
          {a.bars && (
            <HBars rows={a.bars.map((b) => ({ label: b.label, values: [b.observed, b.planned], title: `${b.label} · Observed ${b.observed}% · Planned ${b.planned}%` }))}
              series={[{ key: 'o', label: 'Observed', color: SERIES.observed }, { key: 'p', label: 'Planned', color: SERIES.planned }]} max={100} format={(v) => pct(v, 0)} labelWidth={150} />
          )}
          <DataTable rows={a.rows} rowKey={(r) => r.n} onRowClick={(r) => go(r.to)} columns={[
            { key: 'n', header: 'Item', render: (r) => <b>{r.n}</b> },
            { key: 'w', header: 'Detail', render: (r) => r.what },
            { key: 'f', header: 'Figure', align: 'right', render: (r) => r.figure },
            { key: 'o', header: 'Open', render: (r) => <Button small icon={ArrowRight} onClick={() => go(r.to)}>Open</Button> },
          ]} />
          <div className="ask-box">
            <input className="input" aria-label="Ask a question" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
            <Button primary icon={Send} onClick={submit}>Ask</Button>
          </div>
        </Card>
        <div className="stack">
          <Card title="Context" icon={ClipboardList}>
            <List items={[
              { label: 'Theme', value: 'Croptek conversion' }, { label: 'Region', value: 'West' }, { label: 'Period', value: 'YTD through Feb 2027' },
              { label: 'Programme forecast', value: `${lakh(proposals()[0].sales)} · ${times(proposals()[0].roi)}` },
            ]} />
          </Card>
          <Card title="Next steps" icon={CircleCheck} style={{ flex: 1 }}>
            <List items={[
              { label: 'Verify follow-up completion and field-owner coverage', value: <Button small onClick={() => go(M.drivers(region))}>Open</Button> },
              { label: 'Validate trial cohort CRM contact records', value: <Button small onClick={() => go(M.evidence)}>Open</Button> },
              { label: 'Request a Zonal Manager optimisation review if warranted', value: <Button small onClick={() => go(M.drivers(region))}>Open</Button> },
            ]} />
          </Card>
        </div>
      </div>
    </MhPage>
  );
}


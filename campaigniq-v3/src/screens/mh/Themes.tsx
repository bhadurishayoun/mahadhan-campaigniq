/** Marketing Head screens 12–16: theme brief and assignment, theme tracker, proposal review, proposal detail, comparison. */
import { ArrowRightLeft, CircleCheck, ClipboardList, FileText, ListChecks, MessageSquare, PenLine, Scale, Send, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CONTRIBUTION_MARGIN, type ThemeProposal } from '../../data/bh';
import { lakh, num, pct, times } from '../../data/format';
import {
  APPROVAL_ITEMS, BRIEF_GUARDRAILS, envelopeFit, BRIEF_OWNERS, briefDefaults, displayDate, funnel, PROPOSAL_LABEL, proposals, RECOMMENDATIONS, REVIEW_DECISIONS, THEME_LINKS, type ThemeBrief,
} from '../../data/mh';
import {
  allZmThemes, AUDIENCE, PROPOSALS, reconciliation, SCENARIO_FACTOR, scenarioRow, ZM_THEME_STATUS_LABEL, type ProposalStatus, type ZmTheme,
} from '../../data/zm';
import { M } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useMhStore } from '../../store/mhStore';
import { useZmStore } from '../../store/zmStore';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, type Evidence } from '../../ui/overlay';
import { opt, useGo } from '../common';
import { EditBar, Field, LeaveGuard, List, Notes } from '../zm/parts';
import { MhPage, MhStudioTabs, MH_SECTION } from './frame';

const SCOPE = 'Maharashtra · Onion · Croptek';
const ALL = 'all';
const PROP_TONE: Record<ProposalStatus, Tone> = { draft: 'neutral', submitted: 'warn', returned: 'risk', resubmitted: 'warn', approved: 'ok' };

// ---------------------------------------------------------------- shared theme lifecycle state
type Stage = 'draft' | 'with_bh' | 'approved' | 'assigned';
const STAGE_TONE: Record<Stage, Tone> = { draft: 'neutral', with_bh: 'warn', approved: 'info', assigned: 'ok' };

/** One view of a theme across the three personas: the BH queue status, the ZM assignment and the saved brief. */
function useThemeLifecycle() {
  const bh = useBhStore();
  const zm = useZmStore();
  const mh = useMhStore();
  const brief = (recId: string): ThemeBrief => mh.briefs?.[recId] ?? briefDefaults(recId);
  const zmTheme = (recId: string): ZmTheme | undefined => allZmThemes().find((t) => t.id === THEME_LINKS[recId]?.zmId);
  const stage = (recId: string): Stage => {
    if (zmTheme(recId)) return 'assigned';
    const s = bh.themeStatus[THEME_LINKS[recId].bhId];
    if (s === 'approved') return 'approved';
    return s ? 'with_bh' : 'draft';
  };
  const label = (recId: string) => {
    const t = zmTheme(recId);
    if (t) return ZM_THEME_STATUS_LABEL[zm.themeStatus[t.id] ?? t.status];
    const st = stage(recId);
    if (st === 'approved') return 'Approved by Business Head';
    if (st === 'with_bh') return bh.themeStatus[THEME_LINKS[recId].bhId] === 'clarification_requested' ? 'Clarification requested by Business Head' : 'With Business Head';
    return 'Draft theme';
  };
  const chip = (recId: string) => <StatusChip tone={STAGE_TONE[stage(recId)]}>{label(recId)}</StatusChip>;
  const sendToBh = (recId: string, b: ThemeBrief) => {
    const t: ThemeProposal = {
      id: THEME_LINKS[recId].bhId, name: b.name, geography: 'West / Maharashtra', state: 'Maharashtra', region: 'west', cropProduct: 'Onion / Croptek', crop: 'Onion', product: 'Croptek',
      proposedBy: 'Marketing Head', priority: 'High', status: 'review_pending', objective: b.objective, cohort: b.audience, focus: b.name,
    };
    bh.sendTheme(t);
    bh.toast(`${b.name} sent to the Business Head for approval`);
  };
  const assign = (recId: string, b: ThemeBrief) => {
    const r = RECOMMENDATIONS.find((x) => x.id === recId)!;
    zm.assignTheme({
      id: THEME_LINKS[recId].zmId, name: b.name, crop: 'Onion', product: 'Croptek', geography: 'Maharashtra', region: 'West region', status: 'acknowledgement_pending',
      assignedBy: 'Marketing Head', due: displayDate(b.due), objective: b.objective, scope: b.scope, audience: b.audience, openPoints: r.missing.join(', '),
    });
    bh.toast(`${b.name} assigned to the ${b.owner}`);
  };
  return { brief, zmTheme, stage, label, chip, sendToBh, assign };
}

// ================================================================ 12 Strategic theme brief & Zonal Manager assignment
const MARKETS = ['Maharashtra · Onion', 'Maharashtra · Onion and soybean', 'West region · Onion'];
const SCOPES = ['West region · eligibility to validate', 'Maharashtra only', 'Marathwada zone only'];
const AUDIENCES = ['Eligible Conventional Non-Saarthi Nutrition Users and trial-interest farmers', 'Trial users with no first purchase', 'Mapped retailers and their farmer catchments'];
const FIELDS: { key: keyof Omit<ThemeBrief, 'deliverables'>; label: string }[] = [
  { key: 'name', label: 'Theme name' }, { key: 'objective', label: 'Marketing objective' }, { key: 'market', label: 'Priority market' }, { key: 'scope', label: 'Broader scope' },
  { key: 'audience', label: 'Audience direction' }, { key: 'owner', label: 'Assigned to' }, { key: 'due', label: 'Due date' },
];

export function ThemeBriefScreen() {
  const go = useGo();
  const mh = useMhStore();
  const bh = useBhStore();
  const life = useThemeLifecycle();
  const recId = mh.refreshed in THEME_LINKS ? mh.refreshed : 'croptek-conversion';
  const r = RECOMMENDATIONS.find((x) => x.id === recId)!;
  const saved = life.brief(recId);
  const [d, setD] = useState<ThemeBrief>(saved);
  const [key, setKey] = useState(recId);
  if (key !== recId) { setKey(recId); setD(saved); }
  const changed = [...FIELDS.filter((f) => d[f.key] !== saved[f.key]).map((f) => f.label), ...(d.deliverables.join('|') !== saved.deliverables.join('|') ? ['Deliverables'] : [])];
  const save = () => { mh.setBrief(recId, d); };
  const set = <K extends keyof ThemeBrief>(k: K, v: ThemeBrief[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggle = (item: string) => set('deliverables', d.deliverables.includes(item) ? d.deliverables.filter((x) => x !== item) : [...d.deliverables, item]);
  const f = funnel(true);
  const stage = life.stage(recId);
  const nameErr = d.name.trim().length < 3 ? 'Enter a theme name' : d.deliverables.length ? '' : 'Select at least one deliverable';
  const main = () => {
    if (nameErr) { bh.toast(nameErr); return; }
    if (changed.length) save();
    if (stage === 'draft') life.sendToBh(recId, d);
    else if (stage === 'approved') life.assign(recId, d);
    setTimeout(() => go(M.themes), 0);
  };
  const nextLabel = stage === 'draft' ? 'Send to Business Head for approval' : stage === 'approved' ? 'Assign and send to Zonal Manager' : 'Open theme tracker';
  return (
    <MhPage {...MH_SECTION.studio} trail={SCOPE} title="Strategic Theme Brief & Zonal Manager Assignment" back={M.refreshed} next={main} nextLabel={nextLabel}
      right={life.chip(recId)}>
      <MhStudioTabs active={3} />
      <div className="kpis">
        <KpiCard label="Eligible farmers" value={num(f.eligible)} />
        <KpiCard label="Reached" value={num(f.reached)} />
        <KpiCard label="Documented trials" value={num(f.trials)} />
        <KpiCard label="Matched purchases" value={num(f.purchases ?? f.trials)} />
        <KpiCard label="Trial-to-purchase" value={f.trialToPurchasePct === null ? 'Not linked' : pct(f.trialToPurchasePct, 0)} />
      </div>
      <EditBar count={changed.length} impact={`Brief for ${d.name}`} onCancel={() => setD(saved)} onSave={save} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="stack">
          <Card title="Strategic campaign theme brief" icon={PenLine}>
            <Field label="Theme name *" error={d.name.trim().length < 3 ? 'Enter a theme name' : ''}>
              <input className={`input${d.name !== saved.name ? ' chg' : ''}`} aria-label="Theme name" value={d.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Marketing objective">
              <textarea className={`input${d.objective !== saved.objective ? ' chg' : ''}`} rows={2} aria-label="Marketing objective" value={d.objective} onChange={(e) => set('objective', e.target.value)} />
            </Field>
            <Field label="Priority market"><Select label="Priority market" value={d.market} onChange={(v) => set('market', v)} options={MARKETS.map((m) => opt(m, m))} /></Field>
            <Field label="Broader scope"><Select label="Broader scope" value={d.scope} onChange={(v) => set('scope', v)} options={SCOPES.map((m) => opt(m, m))} /></Field>
            <Field label="Strategic audience direction"><Select label="Audience direction" value={d.audience} onChange={(v) => set('audience', v)} options={AUDIENCES.map((m) => opt(m, m))} /></Field>
          </Card>
          <Card title="Evidence-led opportunity rationale" icon={ListChecks} style={{ flex: 1 }}>
            <List items={[
              { label: r.rationale },
              { label: `Pilot cohort: ${num(f.purchases ?? 0)} purchases from ${num(f.trials)} trials (${f.trialToPurchasePct === null ? 'not linked' : pct(f.trialToPurchasePct, 0)})` },
              { label: r.suitability },
              { label: `Confidence ${r.before.toLowerCase()} → ${r.after.toLowerCase()} after evidence validation` },
            ]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Zonal Manager assignment and expected outputs" icon={Users}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Assigned to"><Select label="Assigned to" value={d.owner} onChange={(v) => set('owner', v)} options={BRIEF_OWNERS.map((m) => opt(m, m))} /></Field>
              <Field label="Due date"><input className={`input${d.due !== saved.due ? ' chg' : ''}`} type="date" aria-label="Due date" value={d.due} onChange={(e) => set('due', e.target.value)} /></Field>
            </div>
            <Field label="Expected deliverables *" error={d.deliverables.length ? '' : 'Select at least one deliverable'}>
              <div className="stack" style={{ gap: 6 }}>
                {[...new Set([...briefDefaults(recId).deliverables, ...d.deliverables])].map((x) => (
                  <label key={x} className="row" style={{ gap: 8 }}>
                    <input type="checkbox" aria-label={x} checked={d.deliverables.includes(x)} onChange={() => toggle(x)} /><span>{x}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Card>
          <Card title="Strategic guardrails and open validations" icon={ShieldCheck} style={{ flex: 1 }}>
            <List items={[...BRIEF_GUARDRAILS.map((g) => ({ icon: CircleCheck, label: g })), ...r.missing.map((m) => ({ icon: MessageSquare, label: `Open: ${m}`, tone: 'warn' as const }))]} />
          </Card>
        </div>
      </div>
      <Notes title="Theme notes" items={[
        `Theme status: ${life.label(recId)}.`,
        stage === 'draft' ? 'The theme goes to the Business Head for approval before assignment.' : stage === 'with_bh' ? 'Awaiting the Business Head decision; assignment opens after approval.' : stage === 'approved' ? 'Approved by the Business Head; ready to assign to the Zonal Manager.' : `Assigned to the ${d.owner}; proposals return for Marketing review.`,
        `${d.deliverables.length} of ${briefDefaults(recId).deliverables.length} deliverables requested, due ${displayDate(d.due)}.`,
        `Open validations: ${r.missing.join(', ')}.`,
        'Approval of campaigns comes after the Zonal Manager proposals.',
      ]} />
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={save} onDiscard={() => setD(saved)} />
    </MhPage>
  );
}

// ================================================================ 13 Theme tracker
interface TrackerRow { id: string; recId: string | null; name: string; region: string; geography: string; owner: string; due: string; status: string; tone: Tone; proposals: number }
type TrackerView = 'all' | 'assigned' | 'pending';

function useTrackerRows(): TrackerRow[] {
  const zm = useZmStore();
  const life = useThemeLifecycle();
  const fromRecs = RECOMMENDATIONS.filter((r) => r.id in THEME_LINKS).map((r): TrackerRow => {
    const b = life.brief(r.id);
    const t = life.zmTheme(r.id);
    const st = life.stage(r.id);
    return {
      id: r.id, recId: r.id, name: t?.name ?? b.name, region: 'West region', geography: b.market, owner: st === 'assigned' ? b.owner : 'Not assigned', due: t?.due ?? displayDate(b.due),
      status: life.label(r.id), tone: STAGE_TONE[st], proposals: r.id === 'croptek-conversion' ? PROPOSALS.length : 0,
    };
  });
  const linked = new Set(Object.values(THEME_LINKS).map((l) => l.zmId));
  const others = allZmThemes().filter((t) => !linked.has(t.id)).map((t): TrackerRow => {
    const s = zm.themeStatus[t.id] ?? t.status;
    return { id: t.id, recId: null, name: t.name, region: t.region, geography: `${t.geography} · ${t.crop}`, owner: BRIEF_OWNERS[0], due: t.due, status: ZM_THEME_STATUS_LABEL[s], tone: s === 'planned' ? 'ok' : 'warn', proposals: 0 };
  });
  return [...fromRecs, ...others];
}

function ThemeClarificationDrawer({ theme, onClose }: { theme: string; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const [question, setQuestion] = useState('');
  const [tried, setTried] = useState(false);
  const err = question.trim().length < 10 ? 'Enter the clarification (at least 10 characters)' : '';
  const send = () => {
    setTried(true);
    if (err) return;
    zm.addQuestion({ id: `mh-theme-${Date.now()}`, question: question.trim(), topic: theme });
    bh.toast(`Clarification sent to the Zonal Manager · ${theme}`);
    onClose();
  };
  return (
    <Drawer title={`Send clarification: ${theme}`} width={620} onClose={onClose} status={<StatusChip tone="neutral">Draft</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send to Zonal Manager</Button>} />}>
      <Field label="Recipient"><Select label="Recipient" value="zm" onChange={() => undefined} options={[opt('zm', BRIEF_OWNERS[0])]} /></Field>
      <Field label="Clarification *" error={tried ? err : ''}><textarea className="input" rows={4} maxLength={600} aria-label="Clarification" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
    </Drawer>
  );
}

function UpdateAssignmentDrawer({ recId, onClose }: { recId: string; onClose: () => void }) {
  const bh = useBhStore();
  const mh = useMhStore();
  const life = useThemeLifecycle();
  const b = life.brief(recId);
  const [owner, setOwner] = useState(b.owner);
  const [due, setDue] = useState(b.due);
  const save = () => { mh.setBrief(recId, { ...b, owner, due }); bh.toast(`Assignment updated · ${b.name} · ${owner} · due ${displayDate(due)}`); onClose(); };
  return (
    <Drawer title={`Update assignment: ${b.name}`} width={620} onClose={onClose} status={life.chip(recId)}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={UserCheck} onClick={save}>Save assignment</Button>} />}>
      <Field label="Assigned to"><Select label="Assigned to" value={owner} onChange={setOwner} options={BRIEF_OWNERS.map((m) => opt(m, m))} /></Field>
      <Field label="Due date"><input className="input" type="date" aria-label="Assignment due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
    </Drawer>
  );
}

export function ThemeTracker() {
  const go = useGo();
  const zm = useZmStore();
  const life = useThemeLifecycle();
  const rows = useTrackerRows();
  const [theme, setTheme] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [view, setView] = useState<TrackerView>('all');
  const [sort, setSort] = useState('due');
  const [sel, setSel] = useState('croptek-conversion');
  const [panel, setPanel] = useState<'clarify' | 'update' | 'owner' | null>(null);
  const shown = rows
    .filter((r) => (theme === ALL || r.id === theme) && (owner === ALL || r.owner === owner) && (status === ALL || r.status === status))
    .filter((r) => view === 'all' || (view === 'assigned' ? r.owner !== 'Not assigned' : r.owner === 'Not assigned'))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'status' ? a.status.localeCompare(b.status) : new Date(a.due).getTime() - new Date(b.due).getTime()));
  const row = rows.find((r) => r.id === sel) ?? rows[0];
  const rec = RECOMMENDATIONS.find((r) => r.id === row.recId);
  const zt = allZmThemes().find((t) => t.id === row.id);
  const brief = row.recId ? life.brief(row.recId) : null;
  const assigned = rows.filter((r) => r.owner !== 'Not assigned').length;
  const ownerEvidence: Evidence = {
    title: `Owner tracking: ${row.name}`, owner: row.owner === 'Not assigned' ? 'Marketing Head' : row.owner,
    facts: [
      { label: 'Theme status', value: row.status },
      { label: 'Due date', value: row.due },
      { label: 'Proposals submitted', value: row.proposals ? num(row.proposals) : 'None yet' },
      { label: 'Open questions', value: num(zm.extraQuestions.filter((q) => q.status === 'open').length + 2) },
    ],
  };
  const pipeline = row.proposals ? proposals().map((p) => {
    const s = zm.proposalStatus[p.id] ?? 'submitted';
    return { id: p.id, label: `${PROPOSALS.find((x) => x.id === p.id)!.label}: ${p.name}`, value: <StatusChip tone={PROP_TONE[s]}>{PROPOSAL_LABEL[s]}</StatusChip> };
  }) : [];
  const unique = (xs: string[]) => [...new Set(xs)];
  return (
    <MhPage {...MH_SECTION.studio} trail="West region" title="Campaign Theme Assignment & Development Tracker" back={M.themeBrief} next={M.proposals} nextLabel="View submitted proposals"
      right={<StatusChip tone={row.tone}>{row.status}</StatusChip>}>
      <MhStudioTabs active={4} />
      <div className="kpis">
        <KpiCard label="Themes tracked" value={num(rows.length)} />
        <KpiCard label="Assigned to Zonal Managers" value={num(assigned)} />
        <KpiCard label="With Business Head" value={num(rows.filter((r) => r.status.startsWith('With') || r.status.startsWith('Clarification requested by')).length) || 'None'} />
        <KpiCard label="Proposals submitted" value={num(rows.reduce((s, r) => s + r.proposals, 0))} />
      </div>
      <FilterRows<TrackerView> view={view} setView={setView} views={[{ value: 'all', label: 'All themes' }, { value: 'assigned', label: 'Assigned' }, { value: 'pending', label: 'Not assigned' }]}
        filters={[
          { key: 'region', label: 'Region', value: 'west', options: [opt('west', 'West region')], onChange: () => undefined },
          { key: 'theme', label: 'Theme', value: theme, options: [opt(ALL, 'All themes'), ...rows.map((r) => opt(r.id, r.name))], onChange: setTheme },
          { key: 'owner', label: 'Assigned to', value: owner, options: [opt(ALL, 'All owners'), ...unique(rows.map((r) => r.owner)).map((o) => opt(o, o))], onChange: setOwner },
          { key: 'status', label: 'Status', value: status, options: [opt(ALL, 'All statuses'), ...unique(rows.map((r) => r.status)).map((o) => opt(o, o))], onChange: setStatus },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sort, options: [opt('due', 'Due date'), opt('name', 'Theme'), opt('status', 'Status')], onChange: setSort }]} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <Card title="Strategic theme assignment tracker" icon={ClipboardList} flush>
          <DataTable selectable rows={shown} rowKey={(r) => r.id} selected={row.id} onRowClick={(r) => setSel(r.id)} columns={[
            { key: 'name', header: 'Theme', render: (r) => <b>{r.name}</b> },
            { key: 'geo', header: 'Scope', render: (r) => r.geography },
            { key: 'owner', header: 'Assigned to', render: (r) => (r.owner === 'Not assigned' ? <span className="na">Not assigned</span> : r.owner) },
            { key: 'due', header: 'Due date', align: 'right', render: (r) => r.due },
            { key: 'status', header: 'Status', render: (r) => <StatusChip tone={r.tone} wrap>{r.status}</StatusChip> },
          ]} />
        </Card>
        <Card title="Management actions" icon={UserCheck}>
          <div className="stack" style={{ gap: 8 }}>
            <Button icon={MessageSquare} onClick={() => setPanel('clarify')}>Send clarification</Button>
            <Button icon={Users} onClick={() => setPanel('owner')}>Track owner</Button>
            <Button icon={PenLine} disabled={!row.recId} onClick={() => setPanel('update')}>Update assignment</Button>
            <Button icon={FileText} disabled={!row.recId} onClick={() => go(M.themeBrief)}>View theme brief</Button>
          </div>
          <p className="calc-label" style={{ margin: '16px 0 4px' }}>Outstanding for the Zonal Manager</p>
          <List items={(rec?.missing ?? (zt ? [zt.openPoints] : [])).concat(BRIEF_GUARDRAILS.slice(0, 2)).map((m) => ({ icon: MessageSquare, label: m }))} />
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Card title={`Selected theme: ${row.name}`} icon={FileText}>
          <div className="kv"><span>Objective</span><b>{brief?.objective ?? zt?.objective ?? 'Not defined'}</b></div>
          <div className="kv"><span>Scope</span><b>{brief?.scope ?? zt?.scope ?? 'Not defined'}</b></div>
          <div className="kv"><span>Audience</span><b>{brief?.audience ?? zt?.audience ?? 'Not defined'}</b></div>
          <div className="kv"><span>Due date</span><b>{row.due}</b></div>
        </Card>
        <Card title="Evidence and deliverables" icon={ListChecks}>
          <List items={[
            ...(rec ? [{ label: rec.rationale }] : zt ? [{ label: `Open points: ${zt.openPoints}` }] : []),
            ...(brief ? brief.deliverables.slice(0, 4).map((x) => ({ icon: CircleCheck, label: x })) : []),
          ]} />
        </Card>
        <Card title="Proposal pipeline" icon={Scale} right={row.proposals ? <Button small onClick={() => go(M.proposals)}>Review proposals</Button> : undefined}>
          {pipeline.length ? <List items={pipeline} /> : <p className="na" style={{ margin: 0 }}>No proposals submitted yet</p>}
        </Card>
      </div>
      {panel === 'clarify' && <ThemeClarificationDrawer theme={row.name} onClose={() => setPanel(null)} />}
      {panel === 'update' && row.recId && <UpdateAssignmentDrawer recId={row.recId} onClose={() => setPanel(null)} />}
      {panel === 'owner' && <EvidenceDrawer evidence={ownerEvidence} onClose={() => setPanel(null)} />}
    </MhPage>
  );
}

// ================================================================ 14–16 proposals
const DETAIL = {
  c1: {
    objective: 'Strengthen retailer recommendation and eligible farmer first-purchase conversion for Croptek.',
    audience: 'Eligible Conventional Non-Saarthi Nutrition Users and trial-interest farmers through retailer influence',
    intervention: 'Retailer education and activation with in-market support',
    content: 'Under review: key content with Brand and Technical',
  },
  c2: {
    objective: 'Drive first purchase among verified eligible trial and interest cohorts.',
    audience: 'Verified trial users and high-interest onion farmers',
    intervention: 'Structured farmer follow-up, education and first-purchase drive',
    content: 'Pending validation: educational and follow-up content',
  },
} as const;
type PropId = keyof typeof DETAIL;
const isProp = (id: string | undefined): id is PropId => id === 'c1' || id === 'c2';

function useProposals() {
  const zm = useZmStore();
  return proposals().map((p) => {
    const id = p.id as PropId;
    const status: ProposalStatus = zm.proposalStatus[id] ?? 'submitted';
    const scenarios = p.scenarios ?? (Object.keys(SCENARIO_FACTOR) as (keyof typeof SCENARIO_FACTOR)[]).map((k) => ({
      id: k, name: k[0].toUpperCase() + k.slice(1), ...scenarioRow(p.sales * SCENARIO_FACTOR[k], p.investment, CONTRIBUTION_MARGIN * 100), investment: p.investment, marginPct: CONTRIBUTION_MARGIN * 100,
    }));
    return { ...p, id, label: PROPOSALS.find((x) => x.id === id)!.label, status, scenarios, ...DETAIL[id] };
  });
}
const propChip = (s: ProposalStatus) => <StatusChip tone={PROP_TONE[s]}>{PROPOSAL_LABEL[s]}</StatusChip>;

/** Review notes with the edit pattern (saved per proposal in the MH store). */
function ReviewNotes({ id, title = 'Marketing Head review notes', rows = 5, right }: { id: string; title?: string; rows?: number; right?: ReactNode }) {
  const mh = useMhStore();
  const bh = useBhStore();
  const saved = mh.reviewNotes?.[id] ?? '';
  const [text, setText] = useState(saved);
  const [key, setKey] = useState(id);
  if (key !== id) { setKey(id); setText(saved); }
  const changed = text !== saved ? ['Review notes'] : [];
  const save = () => { mh.setReviewNote(id, text); bh.toast('Review notes saved'); };
  return (
    <Card title={title} icon={PenLine} style={{ flex: 1 }} right={right}>
      <textarea className={`input${changed.length ? ' chg' : ''}`} rows={rows} maxLength={500} aria-label="Review notes" value={text} onChange={(e) => setText(e.target.value)} />
      <small className="muted">{num(text.length)} / {num(500)}</small>
      <EditBar count={changed.length} onCancel={() => setText(saved)} onSave={save} />
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={save} onDiscard={() => setText(saved)} />
    </Card>
  );
}

type ReviewView = 'compare' | 'list';
export function MhProposalReview() {
  const go = useGo();
  const ps = useProposals();
  const [status, setStatus] = useState(ALL);
  const [view, setView] = useState<ReviewView>('compare');
  const [sel, setSel] = useState<PropId>('c1');
  const [sort, setSort] = useState('code');
  const shown = ps.filter((p) => status === ALL || p.status === status).sort((a, b) => (sort === 'roi' ? b.roi - a.roi : sort === 'investment' ? b.investment - a.investment : a.code.localeCompare(b.code)));
  const p = ps.find((x) => x.id === sel)!;
  const rec = reconciliation();
  const dims: { key: string; label: string; v: (x: typeof ps[number]) => ReactNode }[] = [
    { key: 'objective', label: 'Business objective', v: (x) => x.objective },
    { key: 'audience', label: 'Intended audience', v: (x) => x.audience },
    { key: 'intervention', label: 'Primary intervention', v: (x) => x.intervention },
    { key: 'case', label: 'Business case', v: (x) => `${lakh(x.investment)} for ${lakh(x.sales)} sales · ${times(x.roi)}` },
    { key: 'content', label: 'Content validation', v: (x) => x.content },
    { key: 'overlap', label: 'Audience overlap', v: () => `${num(AUDIENCE.overlap)} farmers in both cohorts` },
    { key: 'status', label: 'Status', v: (x) => propChip(x.status) },
  ];
  return (
    <MhPage {...MH_SECTION.approvals} trail="Croptek conversion theme" title="Zonal Manager Campaign Proposal Review & Comparison" back={M.themes} next={M.proposal(sel)} nextLabel="View detailed proposal"
      right={<StatusChip tone="warn">Marketing review pending</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Proposals submitted" value={num(ps.length)} />
        <KpiCard label="Combined investment" value={lakh(rec.combinedInvestment)} />
        <KpiCard label="Combined forecast sales" value={lakh(rec.combinedSales)} />
        <KpiCard label="Overlap farmers" value={num(AUDIENCE.overlap)} />
        <KpiCard label="Overlap sales at risk" value={lakh(rec.doubleCount, 2)} />
      </div>
      <FilterRows<ReviewView> view={view} setView={setView} views={[{ value: 'compare', label: 'Comparison' }, { value: 'list', label: 'Proposal list' }]}
        filters={[
          { key: 'region', label: 'Region', value: 'west', options: [opt('west', 'West region')], onChange: () => undefined },
          { key: 'theme', label: 'Theme', value: 'croptek', options: [opt('croptek', 'Croptek conversion')], onChange: () => undefined },
          { key: 'zm', label: 'Zonal Manager', value: 'zm', options: [opt('zm', BRIEF_OWNERS[0])], onChange: () => undefined },
          { key: 'status', label: 'Status', value: status, options: [opt(ALL, 'All statuses'), ...[...new Set(ps.map((x) => x.status))].map((s) => opt(s, PROPOSAL_LABEL[s]))], onChange: setStatus },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sort, options: [opt('code', 'Proposal'), opt('roi', 'Net ROI'), opt('investment', 'Investment')], onChange: setSort }]} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        {view === 'compare' ? (
          <Card title="Submitted campaign proposals: comparison" icon={Scale} flush>
            <DataTable rows={dims} rowKey={(d) => d.key} columns={[
              { key: 'dim', header: 'Comparison dimension', width: 180, render: (d) => <b>{d.label}</b> },
              ...shown.map((x) => ({ key: x.id, header: <span>{x.label}: {x.name}</span>, render: (d: typeof dims[number]) => d.v(x) })),
            ]} />
          </Card>
        ) : (
          <Card title="Submitted campaign proposals" icon={ClipboardList} flush>
            <DataTable selectable rows={shown} rowKey={(x) => x.id} selected={sel} onRowClick={(x) => setSel(x.id)} columns={[
              { key: 'name', header: 'Proposal', render: (x) => <b>{x.label}: {x.name}</b> },
              { key: 'inv', header: 'Investment', align: 'right', render: (x) => lakh(x.investment) },
              { key: 'sales', header: 'Forecast sales', align: 'right', render: (x) => lakh(x.sales) },
              { key: 'roi', header: 'Net ROI', align: 'right', render: (x) => times(x.roi) },
              { key: 'status', header: 'Status', render: (x) => propChip(x.status) },
              { key: 'open', header: 'Action', render: (x) => <Button small onClick={() => go(M.proposal(x.id))}>Open proposal</Button> },
            ]} />
          </Card>
        )}
        <div className="stack">
          <Card title="Selected proposal summary" icon={FileText} right={<Button small onClick={() => go(M.proposal(sel))}>Open proposal</Button>}>
            <Field label="Selected proposal"><Select label="Selected proposal" value={sel} onChange={(v) => setSel(v as PropId)} options={ps.map((x) => opt(x.id, `${x.label}: ${x.name}`))} /></Field>
            <p style={{ margin: 0 }}>{p.objective}</p>
          </Card>
          <ReviewNotes id={sel} />
        </div>
      </div>
      <Notes title="Review notes" items={[
        `${num(AUDIENCE.overlap)} farmers sit in both cohorts; up to ${lakh(rec.doubleCount, 2)} sales could be counted twice.`,
        `Proposal A returns ${times(ps[0].roi)} on ${lakh(ps[0].investment)}; Proposal B returns ${times(ps[1].roi)} on ${lakh(ps[1].investment)}.`,
        'Retailer engagement assumptions in Proposal A need field validation.',
        'A comparable conversion benchmark is needed for a consistent assessment.',
        'Review the financial assumptions and key drivers before approval.',
      ]} />
    </MhPage>
  );
}

export function ProposalDetail() {
  const { id } = useParams();
  const bh = useBhStore();
  const zm = useZmStore();
  const ps = useProposals();
  const p = ps.find((x) => x.id === (isProp(id) ? id : 'c1'))!;
  const [source, setSource] = useState(false);
  const base = p.scenarios.find((s) => s.id === 'base')!;
  const requestChanges = () => { zm.setProposalStatus([p.id], 'returned'); bh.toast(`${p.label} returned to the Zonal Manager for revision`); };
  const evidence: Evidence = {
    title: `Source proposal: ${p.label}`, owner: BRIEF_OWNERS[0],
    facts: [
      { label: 'Proposal', value: p.name },
      { label: 'Investment', value: lakh(p.investment) },
      { label: 'Forecast incremental sales', value: lakh(p.sales) },
      { label: 'Status', value: PROPOSAL_LABEL[p.status] },
    ],
  };
  const valTone = (b: 'verified' | 'pending'): Tone => (b === 'verified' ? 'ok' : 'warn');
  return (
    <MhPage {...MH_SECTION.approvals} trail={`Croptek conversion · ${p.name}`} title="Detailed Campaign Proposal & Business Case Review" back={M.proposals} next={M.compare} nextLabel="Compare with other proposal"
      right={propChip(p.status)}>
      <div className="kpis">
        <KpiCard label="Proposed regional investment" value={lakh(p.investment)} />
        <KpiCard label="Forecast incremental sales" value={lakh(p.sales)} />
        <KpiCard label="Contribution margin" value={pct(CONTRIBUTION_MARGIN * 100, 0)} />
        <KpiCard label="Forecast contribution" value={lakh(p.contribution, 1)} />
        <KpiCard label="Forecast net ROI" value={times(p.roi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
        <Card title="Campaign proposition" icon={FileText} right={<Button small onClick={() => setSource(true)}>View source proposal</Button>}>
          <div className="kv"><span>Objective</span><b>{p.objective}</b></div>
          <div className="kv"><span>Target audience</span><b>{p.audience}</b></div>
          <div className="kv"><span>Intervention</span><b>{p.intervention}</b></div>
        </Card>
        <Card title="Scenario analysis" icon={Scale} flush>
          <DataTable rows={p.scenarios} rowKey={(s) => s.id} selected="base" columns={[
            { key: 'name', header: 'Scenario', render: (s) => <b>{s.name}</b> },
            { key: 'inv', header: 'Investment', align: 'right', render: (s) => lakh(s.investment) },
            { key: 'sales', header: 'Incremental sales', align: 'right', render: (s) => lakh(s.sales) },
            { key: 'contrib', header: 'Contribution', align: 'right', render: (s) => lakh(s.contribution, 1) },
            { key: 'roi', header: 'Net ROI', align: 'right', render: (s) => times(s.netRoi) },
          ]} />
          <div style={{ padding: 16 }}>
            <List items={[
              { label: `Base case: (${lakh(base.contribution, 1)} − ${lakh(base.investment)}) / ${lakh(base.investment)} = ${times(base.netRoi)}` },
              { label: `${lakh(p.investment)} is a regional envelope that territory allocations draw on (not added again); ${envelopeFit().text}` },
              { label: 'Campaign sales sit over and above the sales already in approved territory ABPs' },
            ]} />
          </div>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
        <Card title="Validation status" icon={ShieldCheck} style={{ flex: 1 }}>
          <List items={APPROVAL_ITEMS.map((a) => ({ label: a.item, value: <StatusChip tone={valTone(a.base)}>{a.base === 'verified' ? 'Verified' : 'Not verified'}</StatusChip> }))} />
        </Card>
        <ReviewNotes id={p.id} rows={8} right={<Button small icon={Send} disabled={p.status === 'returned'} onClick={requestChanges}>{p.status === 'returned' ? 'Returned for revision' : 'Request changes'}</Button>} />
      </div>
      <Notes title="Business case checks" items={[
        `Trial-to-purchase of ${pct(funnel(true).trialToPurchasePct ?? 0, 0)} is measured but has no comparable benchmark.`,
        `Contribution margin of ${pct(CONTRIBUTION_MARGIN * 100, 0)} needs Product and Finance validation.`,
        'Retailer participation and stock readiness need evidence and regional feasibility checks.',
        `${num(AUDIENCE.overlap)} farmers overlap with the other proposal; targeting must stay distinct.`,
        `Net ROI ranges ${times(p.scenarios[0].netRoi)} to ${times(p.scenarios[p.scenarios.length - 1].netRoi)} across scenarios.`,
      ]} />
      {source && <EvidenceDrawer evidence={evidence} onClose={() => setSource(false)} />}
    </MhPage>
  );
}

export function ProposalCompare() {
  const nav = useNavigate();
  const mh = useMhStore();
  const bh = useBhStore();
  const ps = useProposals();
  const rec = reconciliation();
  const [a, b] = ps;
  const rows: { key: string; label: string; a: ReactNode; b: ReactNode }[] = [
    { key: 'objective', label: 'Objective', a: a.objective, b: b.objective },
    { key: 'audience', label: 'Priority audience', a: a.audience, b: b.audience },
    { key: 'intervention', label: 'Intervention', a: a.intervention, b: b.intervention },
    { key: 'geo', label: 'Target geography', a: 'West region · Maharashtra (onion focus)', b: 'West region · Maharashtra (onion focus)' },
    { key: 'inv', label: 'Proposed investment', a: lakh(a.investment), b: lakh(b.investment) },
    { key: 'sales', label: 'Forecast incremental sales', a: lakh(a.sales), b: lakh(b.sales) },
    { key: 'contrib', label: 'Forecast contribution', a: lakh(a.contribution, 1), b: lakh(b.contribution, 1) },
    { key: 'roi', label: 'Expected net ROI', a: times(a.roi), b: times(b.roi) },
    { key: 'content', label: 'Content readiness', a: a.content, b: b.content },
    { key: 'status', label: 'Status', a: propChip(a.status), b: propChip(b.status) },
  ];
  const next = () => {
    if (!mh.decision) { bh.toast('Select a review decision to continue'); return; }
    if (mh.decision === 'consolidated') { bh.toast('Consolidated revision requested from the Zonal Manager'); return; }
    nav(M.decision(mh.decision === 'b' ? 'c2' : 'c1'));
  };
  const pick = (d: NonNullable<typeof mh.decision>) => { mh.setDecision(d); bh.toast(`Review decision: ${REVIEW_DECISIONS.find((x) => x.id === d)!.label}`); };
  return (
    <MhPage {...MH_SECTION.approvals} trail="Croptek conversion · compare proposals" title="Campaign Proposal Comparison & Strategic Evaluation" back={M.proposal('c1')} next={next} nextLabel="Proceed to approval review"
      right={<StatusChip tone="warn">Both proposals submitted · not approved</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Combined investment" value={lakh(rec.combinedInvestment)} />
        <KpiCard label="Combined forecast sales" value={lakh(rec.combinedSales)} />
        <KpiCard label="Net forecast sales" value={lakh(rec.combinedNet, 1)} />
        <KpiCard label="Unique farmers" value={num(rec.unique)} />
      </div>
      <Card title="Side-by-side evaluation" icon={ArrowRightLeft} flush>
        <DataTable rows={rows} rowKey={(r) => r.key} columns={[
          { key: 'label', header: 'Dimension', width: 200, render: (r) => <b>{r.label}</b> },
          { key: 'a', header: `${a.label}: ${a.name}`, render: (r) => r.a },
          { key: 'b', header: `${b.label}: ${b.name}`, render: (r) => r.b },
        ]} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <Notes title="Review notes" items={[
          'Retailer advocacy and farmer follow-up may support different stages of conversion.',
          `${num(AUDIENCE.overlap)} overlapping farmers put ${lakh(rec.doubleCount, 2)} of sales at risk of being counted twice.`,
          `Together the proposals ask for ${lakh(rec.combinedInvestment)} against ${lakh(rec.combinedNet, 1)} net forecast sales.`,
          `Proposal A has the higher return (${times(a.roi)} vs ${times(b.roi)}).`,
          'Open validations: comparable benchmark, retailer influence and stock readiness.',
        ]} />
        <Card title="Marketing review decision" icon={CircleCheck} flush right={mh.decision ? <StatusChip tone="ok">Saved</StatusChip> : undefined}>
          <DataTable selectable rows={REVIEW_DECISIONS} rowKey={(d) => d.id} selected={mh.decision} onRowClick={(d) => pick(d.id)} columns={[
            { key: 'label', header: 'Decision', render: (d) => <b>{d.label}</b> },
            { key: 'meaning', header: 'Meaning', render: (d) => d.meaning },
          ]} />
        </Card>
      </div>
    </MhPage>
  );
}

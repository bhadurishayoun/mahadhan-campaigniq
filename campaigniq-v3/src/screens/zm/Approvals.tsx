/** Zonal Manager screens 20–21: activity approval inbox and territory activity plan review (drawers 9a, 9c, 9d; modal 9e). */
import { BookOpen, CircleAlert, CircleCheck, ClipboardCheck, Eye, FileSearch, Flag, ListChecks, MessageSquare, Save, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { lakh, num } from '../../data/format';
import {
  ACTIVITY_CHECKS, APPROVAL_STATUS_LABEL, approvalQueue, PLAN_EXCEPTIONS, REGIONAL_ENVELOPE, territoryActivityPlan, zmTerritoryName,
  type ApprovalStatus, type PlanActivity,
} from '../../data/zm';
import { Z, type ZmTerritoryId } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore } from '../../store/zmStore';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, Modal, type Evidence } from '../../ui/overlay';
import { ALL, opt, useGo } from '../common';
import { useZmTerritory, ZmPage, ZM_SECTION } from './frame';
import { Field, List, Notes } from './parts';

const TONE: Record<ApprovalStatus, Tone> = { pending: 'warn', returned: 'risk', approved: 'ok', awaiting: 'neutral' };
const l2 = (x: number) => lakh(x, 2);
type View = 'all' | ApprovalStatus;

/** Approval status (Zonal Manager decision, else the submission's status) and the queue with it applied. */
export function useApprovals() {
  const zm = useZmStore();
  const statusOf = (t: ZmTerritoryId): ApprovalStatus => zm.approvalStatus[t] ?? approvalQueue().find((q) => q.territory === t)!.status;
  return { statusOf, queue: approvalQueue().map((q) => ({ ...q, status: statusOf(q.territory) })) };
}
const chip = (st: ApprovalStatus) => <StatusChip tone={TONE[st]}>{APPROVAL_STATUS_LABEL[st]}</StatusChip>;

// ================================================================ 20 Activity Approval Inbox
export function ApprovalInbox() {
  const go = useGo();
  const bh = useBhStore();
  const { queue } = useApprovals();
  const [view, setView] = useState<View>('all');
  const [territory, setTerritory] = useState(ALL);
  const [campaign, setCampaign] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [sortBy, setSortBy] = useState('submitted');
  const [sel, setSel] = useState<ZmTerritoryId>('ambad');
  const rows = queue.filter((q) => (view === 'all' || q.status === view) && (territory === ALL || q.territory === territory) && (campaign === ALL || q.campaign === campaign) && (status === ALL || q.status === status) && (owner === ALL || q.owner === owner))
    .sort((a, b) => (sortBy === 'budget' ? b.budget - a.budget : sortBy === 'units' ? b.units - a.units : sortBy === 'territory' ? a.territory.localeCompare(b.territory) : a.status === 'pending' ? -1 : b.status === 'pending' ? 1 : 0));
  const s = queue.find((q) => q.territory === sel)!;
  const plan = territoryActivityPlan(sel);
  const count = (st: ApprovalStatus) => queue.filter((q) => q.status === st).length;
  const committed = queue.filter((q) => q.status !== 'awaiting').reduce((x, q) => x + q.budget, 0);
  const views: { value: View; label: string }[] = [opt('all', 'All'), opt('pending', 'Pending review'), opt('returned', 'Returned'), opt('approved', 'Approved'), opt('awaiting', 'Awaiting submission')] as { value: View; label: string }[];
  return (
    <ZmPage {...ZM_SECTION.approvals} title="Activity Approval Inbox" back={Z.proposals} next={() => go(Z.approval(sel))} nextLabel="Review selected territory activity plan">
      <FilterRows<View> view={view} setView={setView} views={views}
        filters={[
          { key: 'territory', label: 'Territory', value: territory, options: [opt(ALL, 'All territories'), ...queue.map((q) => opt(q.territory, zmTerritoryName(q.territory)))], onChange: setTerritory },
          { key: 'campaign', label: 'Campaign', value: campaign, options: [opt(ALL, 'All campaigns'), ...queue.map((q) => opt(q.campaign, q.campaign))], onChange: setCampaign },
          { key: 'status', label: 'Approval status', value: status, options: [opt(ALL, 'All statuses'), ...(Object.keys(APPROVAL_STATUS_LABEL) as ApprovalStatus[]).map((x) => opt(x, APPROVAL_STATUS_LABEL[x]))], onChange: setStatus },
          { key: 'owner', label: 'Owner', value: owner, options: [opt(ALL, 'All owners'), ...queue.map((q) => opt(q.owner, q.owner))], onChange: setOwner },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('submitted', 'Pending first'), opt('budget', 'Local budget'), opt('units', 'Activity units'), opt('territory', 'Territory')] }]} />
      <div className="kpis">
        <KpiCard label="Territory submissions" value={num(queue.length)} />
        <KpiCard label="Pending review" value={num(count('pending'))} />
        <KpiCard label="Approved plans" value={num(count('approved'))} />
        <KpiCard label={`Local budgets vs ${lakh(REGIONAL_ENVELOPE(), 1)} envelope`} value={l2(committed)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title="Territory campaign approval queue" icon={ClipboardCheck} flush>
          <DataTable selectable rows={rows} rowKey={(q) => q.territory} selected={sel} onRowClick={(q) => setSel(q.territory)}
            columns={[
              { key: 't', header: 'Territory', render: (q) => <b>{zmTerritoryName(q.territory)}</b> },
              { key: 'c', header: 'Local activity plan', render: (q) => q.campaign },
              { key: 'u', header: 'Planned units', align: 'right', render: (q) => num(q.units) },
              { key: 'b', header: 'Local budget', align: 'right', render: (q) => l2(q.budget) },
              { key: 'd', header: 'Submitted', render: (q) => (q.submitted === 'NA' ? <span className="na">NA</span> : q.submitted) },
              { key: 's', header: 'Submission state', align: 'center', render: (q) => chip(q.status) },
              { key: 'r', header: 'Review', align: 'center', render: (q) => <Button small primary={q.status === 'pending'} icon={Eye} disabled={q.status === 'awaiting'} onClick={() => go(Z.approval(q.territory))}>Review</Button> },
            ]}
            total={{ t: 'Total', u: num(rows.reduce((x, q) => x + q.units, 0)), b: l2(rows.reduce((x, q) => x + q.budget, 0)) }} />
        </Card>
        <div className="stack">
          <Card title={`Selected submission: ${zmTerritoryName(sel)}`} icon={ListChecks}>
            <List items={plan.map((a) => ({ label: a.name, value: `${num(a.units)} ${a.unitLabel}` }))} />
            <List items={[{ label: <b>Total</b>, value: `${num(s.units)} activities · ${l2(s.budget)}` }]} />
          </Card>
          <Notes title="Readiness checks" icon={ShieldCheck} right={<Button small icon={MessageSquare} onClick={() => bh.toast(`Clarification requested from ${s.owner}`)}>Request clarification</Button>} items={[
            `Status: ${APPROVAL_STATUS_LABEL[s.status]}.`,
            `Local budget ${l2(s.budget)} draws on the ${lakh(REGIONAL_ENVELOPE(), 1)} regional envelope; it is not additive.`,
            `Owners confirmed for ${plan.filter((a) => a.ownerReady).length} of ${plan.length} activities.`,
            `${num(s.units)} planned activity units across ${plan.length} activity types.`,
          ]} />
        </div>
      </div>
    </ZmPage>
  );
}

// ================================================================ 21 Territory Activity Plan Review
export function TerritoryActivityReview() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const t = useZmTerritory();
  const { statusOf, queue } = useApprovals();
  const q = queue.find((x) => x.territory === t)!;
  const plan = territoryActivityPlan(t);
  const accepted = zm.accepted[t] ?? [];
  const [detail, setDetail] = useState<string | null>(null);
  const [correction, setCorrection] = useState(false);
  const [exception, setException] = useState(false);
  const [approve, setApprove] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const saved = zm.comments[`approval:${t}`] ?? '';
  const [comment, setComment] = useState(saved);
  const status = statusOf(t);
  const villages = [...new Set(plan.flatMap((a) => a.villages.flatMap((v) => v.village.split(', '))))];
  const used = queue.filter((x) => x.status !== 'awaiting').reduce((x, y) => x + y.budget, 0);
  const released = zm.released;
  const compliance: { label: string; tone: Tone; status: string }[] = [
    { label: 'Product / crop / geography scope', tone: 'ok', status: 'Aligned' },
    { label: `Local budget ${l2(q.budget)} within the ${lakh(REGIONAL_ENVELOPE(), 1)} envelope (${l2(used)} committed)`, tone: used <= REGIONAL_ENVELOPE() ? 'ok' : 'risk', status: used <= REGIONAL_ENVELOPE() ? 'Within envelope' : 'Over envelope' },
    { label: 'Crop-stage / agronomy timing', tone: 'warn', status: 'Pending' },
    { label: 'Collateral (approved playbook version)', tone: released ? 'ok' : 'warn', status: released ? 'Released' : 'Technical review' },
    { label: 'Stock readiness', tone: 'warn', status: 'Pending' },
    { label: 'Participant eligibility and consent', tone: 'warn', status: 'Pending' },
  ];
  const sel = plan.find((a) => a.id === detail);
  return (
    <ZmPage {...ZM_SECTION.approvals} trail={q.campaign} title="Territory Activity Plan Review" back={Z.approvals} next={() => setApprove(true)} nextLabel="Approve local activity plan"
      right={chip(status)}>
      <div className="kpis">
        <KpiCard label="Planned activity units" value={num(q.units)} />
        <KpiCard label="Local draft budget" value={l2(q.budget)} />
        <KpiCard label="Campaign villages" value={num(villages.length)} />
        <KpiCard label="Activities accepted" value={`${accepted.length} of ${plan.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="stack">
          <Card title={`Territory activity plan · ${q.owner}`} note={q.submitted === 'NA' ? undefined : `Submitted ${q.submitted}`} icon={ClipboardCheck} flush>
            <DataTable rows={plan} rowKey={(a) => a.id} selected={detail} onRowClick={(a) => setDetail(a.id)}
              columns={[
                { key: 'a', header: 'Activity', render: (a) => <b>{a.name}</b> },
                { key: 'u', header: 'Planned units', align: 'right', render: (a) => num(a.units) },
                { key: 'v', header: 'Territory / village', render: (a) => a.villages.map((v) => `${v.village} (${v.units})`).join(' · ') },
                { key: 't', header: 'Planned timing', align: 'center', render: (a) => <StatusChip tone="warn">{a.timing}</StatusChip> },
                { key: 'o', header: 'Owner / readiness', render: (a) => <span className="stack" style={{ gap: 2, alignItems: 'center' }}>{a.owner}<StatusChip tone={a.ownerReady ? 'ok' : 'warn'}>{a.ownerReady ? 'Confirmed' : 'To confirm'}</StatusChip></span> },
                { key: 'b', header: 'Draft budget', align: 'right', render: (a) => l2(a.budget) },
                { key: 's', header: 'Review', align: 'center', render: (a) => (accepted.includes(a.id) ? <StatusChip tone="ok">Accepted</StatusChip> : <Button small icon={Eye} onClick={() => setDetail(a.id)}>Review</Button>) },
              ]}
              total={{ a: 'Total', u: num(plan.reduce((x, a) => x + a.units, 0)), b: l2(plan.reduce((x, a) => x + a.budget, 0)) }} />
          </Card>
          <div className="grid g2">
            <Card title="Campaign alignment and compliance" icon={ShieldCheck}>
              <List items={compliance.map((c) => ({ icon: c.tone === 'ok' ? CircleCheck : CircleAlert, tone: c.tone === 'ok' ? undefined : 'warn' as const, label: c.label, value: <StatusChip tone={c.tone}>{c.status}</StatusChip> }))} />
            </Card>
            <Notes title="Review notes" items={[
              `Owners confirmed for ${plan.filter((a) => a.ownerReady).length} of ${plan.length} activities.`,
              `Local budget ${l2(q.budget)} is ${Math.round((q.budget / REGIONAL_ENVELOPE()) * 100)}% of the ${lakh(REGIONAL_ENVELOPE(), 1)} regional envelope.`,
              `${accepted.length} of ${plan.length} activities accepted after review.`,
              `${(zm.escalated[t] ?? []).length} exception${(zm.escalated[t] ?? []).length === 1 ? '' : 's'} escalated for authorisation.`,
            ]} />
          </div>
        </div>
        <Card title="Approval and action" icon={ClipboardCheck} right={<Button small icon={Save} disabled={comment === saved} onClick={() => { zm.setComment(`approval:${t}`, comment); bh.toast('Review saved'); }}>Save review</Button>}>
          <Field label="Review comments (for the Field Sales Manager)">
            <textarea className={`input${comment !== saved ? ' chg' : ''}`} rows={4} maxLength={500} aria-label="Review comments" value={comment} onChange={(e) => setComment(e.target.value)} />
            <small>{comment.length} / 500</small>
          </Field>
          <div className="stack" style={{ gap: 8 }}>
            <Button icon={BookOpen} onClick={() => go(Z.playbook)}>View campaign playbook</Button>
            <Button icon={FileSearch} onClick={() => setEvidence({ title: `Submitted plan: ${q.campaign}`, owner: `${q.owner} · submitted ${q.submitted}`, facts: plan.map((a) => ({ label: a.name, value: `${num(a.units)} ${a.unitLabel} · ${l2(a.budget)}` })) })}>View submitted plan</Button>
            <Button icon={MessageSquare} onClick={() => setCorrection(true)}>Request changes</Button>
            <Button icon={Flag} onClick={() => setException(true)}>Escalate exception</Button>
          </div>
        </Card>
      </div>
      {sel && <ActivityDrawer t={t} a={sel} onClose={() => setDetail(null)} onCorrection={() => { setDetail(null); setCorrection(true); }} onException={() => { setDetail(null); setException(true); }} />}
      {correction && <CorrectionDrawer t={t} onClose={() => setCorrection(false)} />}
      {exception && <ExceptionDrawer t={t} onClose={() => setException(false)} />}
      {approve && <ApproveModal t={t} onClose={() => setApprove(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </ZmPage>
  );
}

function ActivityDrawer({ t, a, onClose, onCorrection, onException }: { t: ZmTerritoryId; a: PlanActivity; onClose: () => void; onCorrection: () => void; onException: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const key = `${t}:${a.id}`;
  const checks = zm.activityChecks[key] ?? [ACTIVITY_CHECKS[0]];
  const accepted = (zm.accepted[t] ?? []).includes(a.id);
  const [comment, setComment] = useState(zm.comments[`activity:${key}`] ?? '');
  const toggle = (c: string) => zm.setActivityChecks(key, checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c]);
  const all = ACTIVITY_CHECKS.every((c) => checks.includes(c));
  const accept = () => {
    zm.setAccepted(t, [...(zm.accepted[t] ?? []), a.id]);
    if (comment) zm.setComment(`activity:${key}`, comment);
    bh.toast(`${a.name} accepted`);
    onClose();
  };
  return (
    <Drawer title={`${a.name}: activity detail and review`} onClose={onClose}
      status={<StatusChip tone={accepted ? 'ok' : 'warn'}>{accepted ? 'Accepted' : 'Zonal Manager review pending'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={CircleCheck} disabled={!all || accepted} onClick={accept}>{accepted ? 'Accepted' : 'Accept activity'}</Button>} />}>
      <div className="kpis">
        <KpiCard label="Planned units" value={`${num(a.units)} ${a.unitLabel}`} />
        <KpiCard label="Draft allocation" value={l2(a.budget)} />
        <KpiCard label="Within local plan" value={l2(approvalQueue().find((x) => x.territory === t)!.budget)} />
        <KpiCard label="Within regional envelope" value={lakh(REGIONAL_ENVELOPE(), 2)} />
      </div>
      <div className="grid g2">
        <div className="stack">
          <Card title="Village-wise plan" icon={ListChecks} flush>
            <DataTable rows={a.villages} rowKey={(v) => v.village}
              columns={[
                { key: 'v', header: 'Village', render: (v) => <b>{v.village}</b> },
                { key: 'u', header: 'Units', align: 'right', render: (v) => num(v.units) },
                { key: 't', header: 'Timing', align: 'center', render: () => <StatusChip tone="warn">To confirm</StatusChip> },
              ]} />
          </Card>
          <Card title="Owner (proposed)" icon={ClipboardCheck}>
            <List items={[{ label: a.owner, value: <StatusChip tone={a.ownerReady ? 'ok' : 'warn'}>{a.ownerReady ? 'Confirmed' : 'Confirmation pending'}</StatusChip> }]} />
          </Card>
          <Card title="Zonal Manager review comments" icon={MessageSquare} right={<>
            <Button small icon={MessageSquare} onClick={onCorrection}>Request changes</Button>
            <Button small icon={Flag} onClick={onException}>Flag exception</Button>
          </>}>
            <textarea className="input" rows={3} maxLength={500} aria-label="Activity review comments" value={comment} onChange={(e) => setComment(e.target.value)} />
            <small>{comment.length} / 500</small>
          </Card>
        </div>
        <Card title={`Validation checklist · ${checks.length} of ${ACTIVITY_CHECKS.length}`} icon={ShieldCheck}>
          {ACTIVITY_CHECKS.map((c) => (
            <label key={c} className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={checks.includes(c)} onChange={() => toggle(c)} aria-label={c} />
              <span>{c === 'Budget allocation within the local plan' ? `Budget allocation (${l2(a.budget)} within the local plan)` : c}</span>
              <b className="right"><StatusChip tone={checks.includes(c) ? 'ok' : 'warn'}>{checks.includes(c) ? 'Verified' : 'Pending'}</StatusChip></b>
            </label>
          ))}
          <Notes title="Activity review notes" items={[
            `${a.villages.length} village${a.villages.length === 1 ? '' : 's'}, ${num(a.units)} ${a.unitLabel}, ${l2(a.budget)}.`,
            `Timing: ${a.timing.toLowerCase()}; confirm against the onion crop stage.`,
            all ? 'All checks verified; the activity can be accepted.' : `${ACTIVITY_CHECKS.length - checks.length} checks to verify before acceptance.`,
          ]} />
        </Card>
      </div>
    </Drawer>
  );
}

function CorrectionDrawer({ t, onClose }: { t: ZmTerritoryId; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const q = approvalQueue().find((x) => x.territory === t)!;
  const plan = territoryActivityPlan(t);
  const items = [
    { id: 'demonstration', area: `Field demonstrations (${plan[0].units} planned)`, flag: 'Crop-stage timing and stock', change: 'Provide validated timing and stock confirmation' },
    { id: 'retailer', area: `Retailer activation (${plan[1].units} planned)`, flag: 'Owner confirmation', change: 'Confirm the responsible field owner' },
    { id: 'collateral', area: 'Collateral / content', flag: 'Collateral version', change: 'Attach the authorised collateral version' },
    { id: 'budget', area: `Local budget (${l2(q.budget)})`, flag: 'Allocation validation', change: 'Reconfirm within the regional envelope' },
    { id: 'audience', area: 'Eligible audience / consent', flag: 'Eligibility and consent', change: 'Confirm target cohort and consent approach' },
  ];
  const [picked, setPicked] = useState<string[]>(['demonstration']);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('High');
  const [tried, setTried] = useState(false);
  const errors = { picked: picked.length ? '' : 'Select at least one item', text: text.trim().length >= 10 ? '' : 'Specify the required updates', due: due ? '' : 'Select a due date' };
  const send = () => {
    setTried(true);
    if (errors.picked || errors.text || errors.due) return;
    zm.setApproval(t, 'returned');
    bh.toast(`Correction request sent to ${q.owner} · ${picked.length} item${picked.length === 1 ? '' : 's'}, due ${due}`);
    onClose();
  };
  return (
    <Drawer title={`Territory activity plan correction request: ${zmTerritoryName(t)}`} onClose={onClose}
      status={<StatusChip tone={zm.approvalStatus[t] === 'returned' ? 'risk' : 'neutral'}>{zm.approvalStatus[t] === 'returned' ? 'Returned to Field Sales Manager' : 'Draft · not sent'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send correction request to Field Sales Manager</Button>} />}>
      <Card title="Correction checklist (select items to send)" icon={ListChecks} flush>
        <DataTable rows={items} rowKey={(i) => i.id}
          columns={[
            { key: 'x', header: '', width: 44, render: (i) => <input type="checkbox" checked={picked.includes(i.id)} onChange={() => setPicked((p) => (p.includes(i.id) ? p.filter((y) => y !== i.id) : [...p, i.id]))} aria-label={`Send ${i.area}`} /> },
            { key: 'a', header: 'Activity / area', render: (i) => <b>{i.area}</b> },
            { key: 'f', header: 'Flagged exception', render: (i) => i.flag },
            { key: 'c', header: 'Required change', render: (i) => i.change },
            { key: 's', header: 'Status', align: 'center', render: (i) => <StatusChip tone={picked.includes(i.id) ? 'warn' : 'neutral'}>{picked.includes(i.id) ? 'To send' : 'Not included'}</StatusChip> },
          ]} />
      </Card>
      {tried && errors.picked && <small className="err">{errors.picked}</small>}
      <div className="grid g2">
        <Card title="Request to Field Sales Manager" icon={MessageSquare}>
          <Field label="Correction request *" error={tried ? errors.text : ''}><textarea className="input" rows={3} maxLength={500} aria-label="Correction request" value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <div className="form-grid">
            <Field label="Assignee"><Select label="Assignee" value={q.owner} onChange={() => undefined} options={[opt(q.owner, q.owner)]} /></Field>
            <Field label="Due date *" error={tried ? errors.due : ''}><input className="input" type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
            <Field label="Priority"><Select label="Priority" value={priority} onChange={setPriority} options={['High', 'Medium', 'Low'].map((x) => opt(x, x))} /></Field>
          </div>
        </Card>
        <Card title="Version and change tracking" icon={FileSearch}>
          <List items={[
            { label: `Version 1 · initial local plan (${num(q.units)} units, ${l2(q.budget)})`, value: <StatusChip tone="ok">Submitted</StatusChip> },
            { label: 'Version 2 · revised plan after this request', value: <StatusChip tone="warn">Pending revision</StatusChip> },
          ]} />
        </Card>
      </div>
    </Drawer>
  );
}

function ExceptionDrawer({ t, onClose }: { t: ZmTerritoryId; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const q = approvalQueue().find((x) => x.territory === t)!;
  const escalated = zm.escalated[t] ?? [];
  const [sel, setSel] = useState(PLAN_EXCEPTIONS[0].id);
  const [why, setWhy] = useState('');
  const [tried, setTried] = useState(false);
  const e = PLAN_EXCEPTIONS.find((x) => x.id === sel)!;
  const used = approvalQueue().filter((x) => x.status !== 'awaiting').reduce((s, x) => s + x.budget, 0);
  const escalate = () => {
    setTried(true);
    if (e.correction) { bh.toast('Stock and owner are a Field Sales Manager correction, not an exception'); return; }
    if (why.trim().length < 10) return;
    zm.setEscalated(t, [...new Set([...escalated, sel])]);
    bh.toast(`${e.category} escalated to ${e.authority}`);
    onClose();
  };
  return (
    <Drawer title={`Campaign exception and authorisation review: ${zmTerritoryName(t)}`} onClose={onClose}
      status={<StatusChip tone={escalated.length ? 'warn' : 'neutral'}>{escalated.length ? `${escalated.length} escalated` : 'Exception draft · not escalated'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} disabled={escalated.includes(sel)} onClick={escalate}>Escalate exception for authorisation</Button>} />}>
      <Card title="Exception register" icon={TriangleAlert} flush>
        <DataTable selectable rows={PLAN_EXCEPTIONS} rowKey={(x) => x.id} selected={sel} onRowClick={(x) => { setSel(x.id); setTried(false); }}
          columns={[
            { key: 'c', header: 'Exception category', render: (x) => <b>{x.category}</b> },
            { key: 'a', header: 'Activity', render: (x) => x.activity },
            { key: 'd', header: 'Potential deviation', render: (x) => x.deviation },
            { key: 'r', header: 'Required authority', render: (x) => x.authority },
            { key: 's', header: 'Status', align: 'center', render: (x) => <StatusChip tone={x.correction ? 'neutral' : escalated.includes(x.id) ? 'ok' : 'warn'}>{x.correction ? 'Field Sales Manager correction' : escalated.includes(x.id) ? 'Escalated' : 'Pending'}</StatusChip> },
          ]} />
      </Card>
      <div className="grid g2">
        <Card title="Selected exception details" icon={ShieldCheck}>
          <List items={[
            { label: 'Issue type', value: e.category },
            { label: 'Submitted reference', value: `${l2(q.budget)} local draft` },
            { label: 'Authorised reference', value: `Within the ${lakh(REGIONAL_ENVELOPE(), 2)} regional envelope (${l2(used)} committed)` },
            { label: 'Required authority', value: e.authority },
          ]} />
        </Card>
        <Card title="Justification" icon={MessageSquare}>
          <Field label="Zonal Manager justification *" error={tried && !e.correction && why.trim().length < 10 ? 'Enter at least 10 characters' : ''}>
            <textarea className="input" rows={5} maxLength={500} aria-label="Exception justification" value={why} onChange={(x) => setWhy(x.target.value)} />
          </Field>
        </Card>
      </div>
    </Drawer>
  );
}

function ApproveModal({ t, onClose }: { t: ZmTerritoryId; onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const q = approvalQueue().find((x) => x.territory === t)!;
  const plan = territoryActivityPlan(t);
  const accepted = zm.accepted[t] ?? [];
  const [comment, setComment] = useState('');
  const used = approvalQueue().filter((x) => x.status !== 'awaiting').reduce((s, x) => s + x.budget, 0);
  const readiness: { label: string; ok: boolean }[] = [
    { label: 'Authorised crop / product / geography scope', ok: true },
    { label: `Activities accepted (${accepted.length} of ${plan.length})`, ok: accepted.length === plan.length },
    { label: 'Confirmed activity ownership', ok: plan.every((a) => a.ownerReady) },
    { label: 'Latest authorised collateral versions', ok: zm.released },
    { label: `Local ${l2(q.budget)} within the ${lakh(REGIONAL_ENVELOPE(), 1)} envelope`, ok: used <= REGIONAL_ENVELOPE() },
    { label: 'Corrections and exceptions closed', ok: zm.approvalStatus[t] !== 'returned' },
  ];
  const open = readiness.filter((r) => !r.ok).length;
  const approve = () => {
    zm.setApproval(t, 'approved');
    if (comment) zm.setComment(`approval:${t}`, comment);
    bh.toast(`${zmTerritoryName(t)} local activity plan approved${open ? ` with ${open} tracked condition${open === 1 ? '' : 's'}` : ''}`);
    onClose();
    go(Z.impact);
  };
  return (
    <Modal title={`Consolidated territory campaign plan approval: ${zmTerritoryName(t)}`} onClose={onClose}
      status={<StatusChip tone="warn">Zonal Manager approval pending</StatusChip>}
      footer={<><Button onClick={onClose}>Back</Button><span className="sp" /><Button primary icon={CircleCheck} onClick={approve}>Approve consolidated local campaign plan</Button></>}>
      <div className="grid g2">
        <table className="tbl">
          <thead><tr><th>Activity</th><th>Planned units</th><th>Local budget</th></tr></thead>
          <tbody>
            {plan.map((a) => <tr key={a.id}><td><b>{a.name}</b></td><td>{num(a.units)} {a.unitLabel}</td><td>{l2(a.budget)}</td></tr>)}
            <tr className="total"><td><b>Total</b></td><td><b>{num(q.units)} units</b></td><td><b>{l2(q.budget)}</b></td></tr>
          </tbody>
        </table>
        <Card title="Final approval readiness" icon={ShieldCheck}>
          <List items={readiness.map((r) => ({ icon: r.ok ? CircleCheck : CircleAlert, tone: r.ok ? undefined : 'warn' as const, label: r.label, value: <StatusChip tone={r.ok ? 'ok' : 'warn'}>{r.ok ? 'Verified' : 'Tracked'}</StatusChip> }))} />
        </Card>
      </div>
      <Field label="Zonal Manager review comments"><textarea className="input" rows={2} maxLength={500} aria-label="Approval comments" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      {open > 0 && <p className="muted" style={{ margin: 0 }}>{open} open item{open === 1 ? '' : 's'} will be recorded as tracked conditions on the approval.</p>}
    </Modal>
  );
}


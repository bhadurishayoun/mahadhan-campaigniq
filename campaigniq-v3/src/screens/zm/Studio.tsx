/** Zonal Manager screens 6–9: assigned themes, concept studio, concept comparison, proposition designer. */
import {
  ArrowRight, Check, CheckSquare, CircleCheck, ClipboardList, Edit3, Eye, FileSearch, FileText, GitCompare, Layers, Lightbulb, ListChecks,
  MessageSquare, Plus, Save, Send, ShieldCheck, Sprout, Store, Target, TriangleAlert, Users,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { AMBAD, territoryById } from '../../data/bh';
import { lakh, num, pct } from '../../data/format';
import { campaignFunnel, defaultWizard, phaseDetails } from '../../data/fsm';
import {
  AUDIENCE, businessCaseC1, CLAIM_STATUS_LABEL, CLAIMS, CLARIFICATION_TOPICS, COMPARE_DIMENSIONS, CONCEPTS, conceptRationale, CROP_STAGES, CROPTEK_EVIDENCE,
  DELIVERABLES, INTERVENTION_KPIS, INTERVENTION_TYPES, JOURNEY, PROPOSITION, READINESS_CHECKS, secondaryTrend, themeById, trialToPurchasePct,
  ZM_THEME_STATUS_LABEL, allZmThemes, type Assessment, type Claim, type ClaimStatus, type Concept, type JourneyStage, type PropositionField, type ThemeStatus,
} from '../../data/zm';
import { Z } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore, type InterventionConfig } from '../../store/zmStore';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, Modal } from '../../ui/overlay';
import { opt, useGo } from '../common';
import { StudioTabs, ZmPage, ZM_SECTION } from './frame';
import { Attach, EditBar, Field, LeaveGuard, List, Notes } from './parts';

const THEME_TONE: Record<ThemeStatus, Tone> = { acknowledgement_pending: 'warn', acknowledged: 'ok', under_review: 'warn', planned: 'neutral', clarification_requested: 'warn' };
const CLAIM_TONE: Record<ClaimStatus, Tone> = { pending: 'warn', unvalidated: 'risk', review_requested: 'warn', validated: 'ok' };
const ASSESS_TONE: Record<Assessment, Tone> = { Observed: 'ok', Unverified: 'risk', 'Awaiting validation': 'warn', Unavailable: 'neutral', Pending: 'warn' };
const OWNER = 'Zonal Manager · Marathwada zone';
const growthPct = () => { const s = CROPTEK_EVIDENCE.secondarySales; return ((s[s.length - 1].v - s[0].v) / s[0].v) * 100; };

function useThemeStatus() {
  const zm = useZmStore();
  return (id: string): ThemeStatus => zm.themeStatus[id] ?? themeById(id).status;
}
function useConcepts() {
  const zm = useZmStore();
  return zm.concepts ?? CONCEPTS;
}
function useClaims(): Claim[] {
  const zm = useZmStore();
  return CLAIMS.map((c) => ({ ...c, ...zm.claims[c.id] }));
}

/** Opportunity rationale computed from the evidence (Croptek) or the theme record. */
function rationaleOf(id: string): string[] {
  const t = themeById(id);
  if (id !== 'croptek-conversion') return [t.objective, `Open points: ${t.openPoints}`];
  const [lo, hi] = CROPTEK_EVIDENCE.penetrationRange;
  return [
    `Croptek penetration of ${lo}–${hi}% in onion markets leaves headroom.`,
    `Secondary sales rose ${secondaryTrend()} across Q1–Q4 (+${growthPct().toFixed(1)}%).`,
    `Matched trial-to-purchase of ${pct(trialToPurchasePct(), 0)} (${CROPTEK_EVIDENCE.purchases} of ${CROPTEK_EVIDENCE.trials} trials).`,
  ];
}

// ================================================================ 6 Assigned Themes and Strategic Brief
export function AssignedThemes() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const statusOf = useThemeStatus();
  const [sel, setSel] = useState(allZmThemes()[0].id);
  const [brief, setBrief] = useState<string | null>(null);
  const [clar, setClar] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const theme = themeById(sel);
  const status = statusOf(sel);
  const savedNotes = zm.comments[`theme:${sel}`] ?? '';
  const [notes, setNotes] = useState(savedNotes);
  const pending = allZmThemes().filter((t) => statusOf(t.id) === 'acknowledgement_pending' || statusOf(t.id) === 'clarification_requested').length;
  const history = zm.clarifications.filter((c) => c.themeId === sel);
  const next = () => (status === 'acknowledged' ? go(Z.concepts) : setAck(sel));
  const ambad = territoryById('ambad')!;

  return (
    <ZmPage {...ZM_SECTION.themes} trail={theme.name} title="Assigned Themes and Strategic Brief" back={Z.revised('ambad')} next={next}
      nextLabel={status === 'acknowledged' ? 'Develop campaign concepts' : 'Acknowledge and develop concepts'}
      right={<StatusChip tone={THEME_TONE[status]}>{ZM_THEME_STATUS_LABEL[status]}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Themes assigned" value={num(allZmThemes().length)} />
        <KpiCard label="Awaiting acknowledgement" value={num(pending)} />
        <KpiCard label="Croptek penetration in onion" value={`${CROPTEK_EVIDENCE.penetrationRange[0]}–${CROPTEK_EVIDENCE.penetrationRange[1]}%`} />
        <KpiCard label="Trial-to-purchase" value={pct(trialToPurchasePct(), 0)} />
      </div>
      <Card title="My assigned marketing themes" icon={Layers} flush>
        <DataTable selectable rows={allZmThemes()} rowKey={(t) => t.id} selected={sel} onRowClick={(t) => { setSel(t.id); setNotes(zm.comments[`theme:${t.id}`] ?? ''); }}
          columns={[
            { key: 'n', header: 'Theme', render: (t) => <b>{t.name}</b> },
            { key: 'c', header: 'Priority crop / product', render: (t) => `${t.crop} · ${t.product}` },
            { key: 'g', header: 'Regional scope', render: (t) => `${t.geography} · ${t.region}` },
            { key: 'a', header: 'Assigned by', render: (t) => t.assignedBy },
            { key: 'd', header: 'Due', render: (t) => t.due },
            { key: 's', header: 'Status', align: 'center', render: (t) => <StatusChip tone={THEME_TONE[statusOf(t.id)]}>{ZM_THEME_STATUS_LABEL[statusOf(t.id)]}</StatusChip> },
            { key: 'o', header: 'Open brief', align: 'center', render: (t) => <Button small icon={Eye} onClick={() => setBrief(t.id)}>Open brief</Button> },
          ]} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }}>
        <div className="stack">
          <Card title={`Strategic brief: ${theme.name}`} icon={Target} right={<>
            <Button small icon={MessageSquare} onClick={() => setClar(sel)}>Request clarification</Button>
            <Button small icon={FileSearch} onClick={() => setBrief(sel)}>View brief and evidence</Button>
          </>}>
            <div className="kv">
              <span>Strategic objective</span><b>{theme.objective}</b>
              <span>Opportunity rationale</span><b>{rationaleOf(sel).map((r) => <div key={r}>{r}</div>)}</b>
              <span>Strategic scope</span><b>{theme.scope}</b>
              <span>Proposed audience</span><b>{theme.audience}</b>
              <span>Key open points</span><b>{theme.openPoints}</b>
            </div>
          </Card>
          <Card title="Theme notes" icon={FileText} right={<Button small icon={Save} disabled={notes === savedNotes} onClick={() => { zm.setComment(`theme:${sel}`, notes); bh.toast('Theme notes saved'); }}>Save notes</Button>}>
            <textarea className={`input${notes !== savedNotes ? ' chg' : ''}`} rows={3} maxLength={500} aria-label="Theme notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <small>{notes.length} / 500</small>
          </Card>
        </div>
        <div className="stack">
          <Card title="Zonal Manager deliverables" icon={ClipboardList}>
            <List items={DELIVERABLES.map((d) => ({ icon: status === 'acknowledged' ? CircleCheck : CheckSquare, label: d }))} />
          </Card>
          <Notes title="Brief notes" items={[
            sel === 'croptek-conversion' ? `Ambad onion growth objective ${lakh(CROPTEK_EVIDENCE.planLinkage)} already sits inside the ₹${(ambad.abp / 100).toFixed(2)} Cr Ambad ABP.` : `${theme.name} focuses on ${theme.crop.toLowerCase()} with ${theme.product}.`,
            `Acknowledgement due ${theme.due}; ${DELIVERABLES.length} deliverables follow.`,
            history.length ? `${history.length} clarification request${history.length === 1 ? '' : 's'} sent to the Marketing Head.` : 'No clarification requested yet.',
            `${pending} of ${allZmThemes().length} themes still awaiting acknowledgement.`,
          ]} />
        </div>
      </div>
      {brief && <BriefDrawer id={brief} onClose={() => setBrief(null)} onClarify={() => { setClar(brief); setBrief(null); }} onAcknowledge={() => { setAck(brief); setBrief(null); }} />}
      {clar && <ThemeClarificationDrawer id={clar} onClose={() => setClar(null)} />}
      {ack && <AcknowledgeModal id={ack} onClose={() => setAck(null)} />}
    </ZmPage>
  );
}

function BriefDrawer({ id, onClose, onClarify, onAcknowledge }: { id: string; onClose: () => void; onClarify: () => void; onAcknowledge: () => void }) {
  const statusOf = useThemeStatus();
  const t = themeById(id);
  const status = statusOf(id);
  const [lo, hi] = CROPTEK_EVIDENCE.penetrationRange;
  const ambad = territoryById('ambad')!;
  const evidence = id === 'croptek-conversion' ? [
    { item: 'Product penetration', scope: 'Market landscape · Maharashtra onion', finding: `${lo}–${hi}% penetration` },
    { item: 'Secondary sales trend', scope: 'Maharashtra · quarterly', finding: secondaryTrend() },
    { item: 'Farmer investigation', scope: 'Investigated segment', finding: `${CROPTEK_EVIDENCE.trials} trials / ${CROPTEK_EVIDENCE.purchases} purchases = ${pct(trialToPurchasePct(), 0)}` },
  ] : [{ item: 'Theme brief', scope: t.geography, finding: t.objective }];
  return (
    <Drawer title={`Strategic theme brief and evidence: ${t.name}`} onClose={onClose}
      status={<StatusChip tone={THEME_TONE[status]}>{ZM_THEME_STATUS_LABEL[status]}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={status === 'acknowledged' ? undefined : <Button primary icon={CircleCheck} onClick={onAcknowledge}>Acknowledge theme</Button>} />}>
      <div className="kv">
        <span>Theme</span><b>{t.name}</b>
        <span>Priority crop / geography</span><b>{t.geography} · {t.crop}</b>
        <span>Broader scope</span><b>{t.region}</b>
      </div>
      <Card title="Strategic opportunity evidence" icon={FileSearch} flush right={<Button small icon={MessageSquare} onClick={onClarify}>Request clarification</Button>}>
        <DataTable rows={evidence} rowKey={(e) => e.item}
          columns={[
            { key: 'i', header: 'Evidence', render: (e) => <b>{e.item}</b> },
            { key: 's', header: 'Scope', render: (e) => e.scope },
            { key: 'f', header: 'Key finding', render: (e) => <StatusChip tone="ok">{e.finding}</StatusChip> },
          ]} />
      </Card>
      <div className="grid g2">
        <div className="stack">
          {id === 'croptek-conversion' && (
            <Card title="Business plan linkage" icon={Target}>
              <List items={[
                { label: 'Ambad onion growth objective', value: lakh(CROPTEK_EVIDENCE.planLinkage) },
                { label: 'Approved all-product Ambad ABP', value: `₹${(ambad.abp / 100).toFixed(2)} Cr` },
                { label: 'Ambad onion ABP', value: `₹${(AMBAD.onionAbp / 100).toFixed(2)} Cr` },
                { label: 'Counted in the ABP', value: <StatusChip tone="ok">Already included</StatusChip> },
              ]} />
            </Card>
          )}
          <Card title="Strategic brief" icon={Lightbulb}>
            <div className="kv">
              <span>Objective</span><b>{t.objective}</b>
              <span>Initial scope</span><b>{t.scope}</b>
              <span>Proposed audience</span><b>{t.audience}</b>
              <span>Key open points</span><b>{t.openPoints}</b>
            </div>
          </Card>
        </div>
        <Card title="Zonal Manager deliverables" icon={ClipboardList}>
          <List items={DELIVERABLES.map((d) => ({ icon: CheckSquare, label: d }))} />
        </Card>
      </div>
    </Drawer>
  );
}

function ThemeClarificationDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const statusOf = useThemeStatus();
  const t = themeById(id);
  const [topics, setTopics] = useState<string[]>([CLARIFICATION_TOPICS[0].id]);
  const [question, setQuestion] = useState(CLARIFICATION_TOPICS[0].question);
  const [priority, setPriority] = useState('');
  const [recipient, setRecipient] = useState('Marketing Head');
  const [due, setDue] = useState('');
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);
  const history = zm.clarifications.filter((c) => c.themeId === id);
  const errors = { topics: topics.length ? '' : 'Select at least one topic', question: question.trim().length >= 10 ? '' : 'Enter the clarification question', priority: priority ? '' : 'Select a priority' };
  const toggle = (tid: string) => {
    const nextT = topics.includes(tid) ? topics.filter((x) => x !== tid) : [...topics, tid];
    setTopics(nextT);
    setQuestion(CLARIFICATION_TOPICS.filter((c) => nextT.includes(c.id)).map((c) => c.question).join(' '));
  };
  const send = () => {
    setTried(true);
    if (errors.topics || errors.question || errors.priority) return;
    zm.requestClarification({ themeId: id, topics, question: question.trim(), priority, due });
    bh.toast(`Clarification request sent to ${recipient} · ${topics.length} topic${topics.length === 1 ? '' : 's'}`);
    onClose();
  };
  const status = statusOf(id);
  return (
    <Drawer title={`Strategic theme clarification request: ${t.name}`} onClose={onClose}
      status={<StatusChip tone={THEME_TONE[status]}>{status === 'clarification_requested' ? 'Clarification requested' : 'Draft'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send clarification request to Marketing Head</Button>} />}>
      <div className="grid g2">
        <div className="stack">
          <Card title="Clarification topics" icon={ListChecks}>
            {CLARIFICATION_TOPICS.map((c) => (
              <label key={c.id} className="list-row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={topics.includes(c.id)} onChange={() => toggle(c.id)} aria-label={c.topic} />
                <span>{c.topic}</span>
                <b className="right"><StatusChip tone={history.some((h) => h.topics.includes(c.id)) ? 'ok' : 'warn'}>{history.some((h) => h.topics.includes(c.id)) ? 'Sent' : 'Pending'}</StatusChip></b>
              </label>
            ))}
            {tried && errors.topics && <small className="err">{errors.topics}</small>}
          </Card>
          <Card title="Communication history" icon={MessageSquare}>
            {history.length
              ? <List items={history.map((h) => ({ icon: Send, label: h.question.slice(0, 90) + (h.question.length > 90 ? '…' : ''), value: h.priority }))} />
              : <p className="muted" style={{ margin: 0 }}>No clarification submitted yet.</p>}
          </Card>
          <Notes title="Clarification notes" items={[
            `Trial-to-purchase ${pct(trialToPurchasePct(), 0)} is measured on ${CROPTEK_EVIDENCE.trials} investigated trials.`,
            'A historical comparator (product, crop or region) sets a realistic conversion target.',
            `${topics.length} of ${CLARIFICATION_TOPICS.length} topics selected.`,
          ]} />
        </div>
        <Card title="Clarification detail" icon={FileText}>
          <Field label="Clarification question *" error={tried ? errors.question : ''}>
            <textarea className="input" rows={5} maxLength={800} aria-label="Clarification question" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="Priority *" error={tried ? errors.priority : ''}><Select label="Priority" value={priority} onChange={setPriority} options={[opt('', 'Select priority'), ...['High', 'Medium', 'Low'].map((x) => opt(x, x))]} /></Field>
            <Field label="Recipient *"><Select label="Recipient" value={recipient} onChange={setRecipient} options={[opt('Marketing Head', 'Marketing Head')]} /></Field>
            <Field label="Response due date"><input className="input" type="date" aria-label="Response due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
            <Field label="Attach file"><Attach label="Clarification attachment" /></Field>
          </div>
          <Field label="Additional notes"><textarea className="input" rows={3} maxLength={300} aria-label="Additional notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </Card>
      </div>
    </Drawer>
  );
}

function AcknowledgeModal({ id, onClose }: { id: string; onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const statusOf = useThemeStatus();
  const t = themeById(id);
  const ACK_ITEMS = DELIVERABLES.slice(0, 5);
  const [done, setDone] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [owner, setOwner] = useState(OWNER);
  const [tried, setTried] = useState(false);
  const errors = { items: done.length === ACK_ITEMS.length ? '' : 'Confirm every deliverable', date: date ? '' : 'Select a target completion date' };
  const clarOpen = statusOf(id) === 'clarification_requested';
  const confirm = () => {
    setTried(true);
    if (errors.items || errors.date) return;
    zm.acknowledge(id, { owner, date, deliverables: done });
    bh.toast(`${t.name} acknowledged · campaign development started`);
    onClose();
    go(Z.concepts);
  };
  return (
    <Modal title={`Acknowledge theme: ${t.name}`} onClose={onClose}
      status={<StatusChip tone="warn">Acknowledgement pending</StatusChip>}
      footer={<><Button onClick={onClose}>Back</Button><span className="sp" /><Button primary icon={ArrowRight} onClick={confirm}>Acknowledge and start campaign development</Button></>}>
      <div className="kv">
        <span>Theme</span><b>{t.name}</b>
        <span>Strategy scope</span><b>{t.geography} · {t.crop}</b>
        <span>Marketing Head objective</span><b>{t.objective}</b>
        <span>Development dependencies</span><b>{t.openPoints}</b>
      </div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <Card title="Campaign development deliverables" icon={ListChecks}>
          {ACK_ITEMS.map((d) => (
            <label key={d} className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={done.includes(d)} onChange={() => setDone((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))} aria-label={d} />
              <span>{d}</span>
            </label>
          ))}
          {tried && errors.items && <small className="err">{errors.items}</small>}
        </Card>
        <Card title="Assignment and timeline" icon={Users}>
          <Field label="Target completion date *" error={tried ? errors.date : ''}><input className="input" type="date" aria-label="Target completion date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Responsible owner"><Select label="Responsible owner" value={owner} onChange={setOwner} options={[opt(OWNER, OWNER), opt('Zonal analyst', 'Zonal analyst')]} /></Field>
          <List items={[
            { label: 'Reviewer / approver', value: 'Marketing Head' },
            { label: 'Clarification status', value: <StatusChip tone={clarOpen ? 'warn' : 'ok'}>{clarOpen ? 'Open' : 'None open'}</StatusChip> },
          ]} />
        </Card>
      </div>
    </Modal>
  );
}

// ================================================================ 7 Campaign Concept Studio
const CONCEPT_FIELDS: { key: keyof Concept; label: string }[] = [
  { key: 'objective', label: 'Objective' },
  { key: 'audience', label: 'Primary audience' },
  { key: 'journeyStage', label: 'Customer journey stage' },
  { key: 'direction', label: 'Intervention direction' },
  { key: 'note', label: 'Note' },
];
const CONFIDENCE_TONE: Record<Concept['confidence'], Tone> = { High: 'ok', Medium: 'warn', 'Medium-low': 'warn', Low: 'risk' };

export function ConceptStudio() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const concepts = useConcepts();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Concept | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [ws, setWs] = useState(zm.workspace);
  const saved = editing ? concepts.find((c) => c.id === editing)! : null;
  const changed = draft && saved ? (['name', ...CONCEPT_FIELDS.map((f) => f.key)] as (keyof Concept)[]).filter((k) => draft[k] !== saved[k]) : [];
  const wsChanged = (Object.keys(ws) as (keyof typeof ws)[]).filter((k) => ws[k] !== zm.workspace[k]);
  const dirty = changed.length + wsChanged.length > 0;
  const startEdit = (c: Concept) => { setEditing(c.id); setDraft({ ...c }); };
  const saveConcept = () => { if (!draft) return; zm.setConcepts(concepts.map((c) => (c.id === draft.id ? draft : c))); bh.toast(`${draft.name} saved`); setEditing(null); setDraft(null); };
  const cancelConcept = () => { setEditing(null); setDraft(null); };
  const saveWs = () => { zm.setWorkspace(ws); bh.toast('Concept workspace saved'); };
  const saveAll = () => { if (changed.length) saveConcept(); if (wsChanged.length) saveWs(); };
  const discardAll = () => { cancelConcept(); setWs(zm.workspace); };
  const toggle = (id: string) => zm.setSelectedConcepts(zm.selectedConcepts.includes(id) ? zm.selectedConcepts.filter((x) => x !== id) : [...zm.selectedConcepts, id]);
  const add = () => {
    const n = concepts.length + 1;
    const c: Concept = { id: `c${n}`, code: `C${n}`, name: `New campaign concept ${n}`, objective: '', audience: '', journeyStage: '', direction: '', confidence: 'Low', note: '', evidence: 'Evidence to be added.', channelReadiness: 'To be confirmed.', technical: 'To be confirmed.', nextAction: 'Complete the concept definition.', eligibleFarmers: 0 };
    zm.setConcepts([...concepts, c]);
    startEdit(c);
    bh.toast(`${c.code} added · complete its definition`);
  };
  const selected = concepts.filter((c) => zm.selectedConcepts.includes(c.id));
  const next = () => { if (!selected.length) { bh.toast('Select at least one concept'); return; } go(Z.compare); };
  const openRationale = conceptRationale('c1').filter((r) => r.assessment !== 'Observed').length;

  return (
    <ZmPage {...ZM_SECTION.studio} trail="Croptek conversion" title="Campaign Concept Studio" back={Z.themes} next={next} nextLabel="Compare selected concepts"
      right={<StatusChip tone="warn">Campaign concepts in draft</StatusChip>}>
      <StudioTabs active={0} />
      <div className="kpis">
        <KpiCard label="Concepts drafted" value={num(concepts.length)} />
        <KpiCard label="Concepts selected" value={`${selected.length} of ${concepts.length}`} />
        <KpiCard label="Eligible farmers in selected concepts" value={num(selected.reduce((s, c) => s + c.eligibleFarmers, 0) - (selected.length > 1 && zm.selectedConcepts.includes('c1') && zm.selectedConcepts.includes('c2') ? AUDIENCE.overlap : 0))} />
        <KpiCard label="Trial-to-purchase evidence" value={pct(trialToPurchasePct(), 0)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
          <div className="grid g2" style={{ flex: 1 }}>
            {concepts.map((c) => {
              const isEdit = editing === c.id && draft;
              const on = zm.selectedConcepts.includes(c.id);
              const val = (k: keyof Concept) => (isEdit ? String(draft![k]) : String(c[k]));
              return (
                <Card key={c.id} title={`${c.code} · ${isEdit ? draft!.name : c.name}`} icon={c.id === 'c1' ? Store : c.id === 'c2' ? Sprout : Lightbulb}
                  right={<StatusChip tone="neutral">Draft</StatusChip>}>
                  {isEdit && (
                    <Field label="Concept name *"><input className={`input${changed.includes('name') ? ' chg' : ''}`} aria-label={`${c.code} name`} value={draft!.name} onChange={(e) => setDraft({ ...draft!, name: e.target.value })} /></Field>
                  )}
                  <div className="kv">
                    {CONCEPT_FIELDS.map((f) => (
                      <Fragment key={f.key}>
                        <span>{f.label}</span>
                        {isEdit
                          ? <b><textarea className={`input${changed.includes(f.key) ? ' chg' : ''}`} rows={2} aria-label={`${c.code} ${f.label}`} value={val(f.key)} onChange={(e) => setDraft({ ...draft!, [f.key]: e.target.value })} /></b>
                          : <b>{val(f.key) || <span className="na">NA</span>}</b>}
                      </Fragment>
                    ))}
                    <span>Evidence confidence</span><b><StatusChip tone={CONFIDENCE_TONE[c.confidence]}>{c.confidence}</StatusChip></b>
                  </div>
                  {isEdit && <EditBar count={changed.length} impact={`${c.code} definition`} onCancel={cancelConcept} onSave={saveConcept} />}
                  <div className="row" style={{ marginTop: 'auto' }}>
                    <Button small primary={on} icon={on ? Check : CheckSquare} onClick={() => toggle(c.id)}>{on ? 'Selected' : 'Select'}</Button>
                    <Button small icon={Edit3} disabled={!!isEdit} onClick={() => startEdit(c)}>Edit</Button>
                    <Button small icon={FileSearch} onClick={() => setRationale(c.id)}>View rationale</Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card title="Concept actions" icon={Plus} style={{ flex: 'none' }} right={<>
            <Button small icon={Plus} onClick={add}>Add new concept</Button>
            <Button small icon={GitCompare} onClick={next}>Compare concepts</Button>
          </>}>
            <p className="muted" style={{ margin: 0 }}>{selected.length} selected for development: {selected.map((c) => c.code).join(', ') || 'none'}.</p>
          </Card>
        </div>
        <div className="stack">
          <Card title="Concept development workspace" icon={ClipboardList}>
            <Field label="Selected concepts"><div className="row" style={{ flexWrap: 'wrap' }}>{selected.map((c) => <StatusChip key={c.id} tone="ok">{c.name}</StatusChip>)}{!selected.length && <span className="na">NA</span>}</div></Field>
            <Field label="Strategic intent"><textarea className={`input${wsChanged.includes('intent') ? ' chg' : ''}`} rows={2} aria-label="Strategic intent" value={ws.intent} onChange={(e) => setWs({ ...ws, intent: e.target.value })} /></Field>
            <Field label="Target behaviour"><textarea className={`input${wsChanged.includes('behaviour') ? ' chg' : ''}`} rows={2} aria-label="Target behaviour" value={ws.behaviour} onChange={(e) => setWs({ ...ws, behaviour: e.target.value })} /></Field>
            <Field label="Notes"><textarea className={`input${wsChanged.includes('notes') ? ' chg' : ''}`} rows={2} aria-label="Workspace notes" value={ws.notes} onChange={(e) => setWs({ ...ws, notes: e.target.value })} /></Field>
            <EditBar count={wsChanged.length} impact="Workspace" onCancel={() => setWs(zm.workspace)} onSave={saveWs} />
          </Card>
          <Notes title="Concept notes" items={[
            `C1 and C2 share ${num(AUDIENCE.overlap)} farmers (${pct((AUDIENCE.overlap / AUDIENCE.c2) * 100, 0)} of the C2 cohort).`,
            `C1 has ${openRationale} evidence items still open; retailer influence is unverified.`,
            `C2 builds on ${CROPTEK_EVIDENCE.purchases} purchases from ${CROPTEK_EVIDENCE.trials} trials (${pct(trialToPurchasePct(), 0)}).`,
            `${selected.length} concept${selected.length === 1 ? '' : 's'} selected for comparison.`,
          ]} />
        </div>
      </div>
      {rationale && <RationaleDrawer id={rationale} onClose={() => setRationale(null)} />}
      <LeaveGuard dirty={dirty} count={changed.length + wsChanged.length} onSave={saveAll} onDiscard={discardAll} />
    </ZmPage>
  );
}

function RationaleDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const concepts = useConcepts();
  const c = concepts.find((x) => x.id === id) ?? concepts[0];
  const rows = conceptRationale(c.id);
  const observed = rows.filter((r) => r.assessment === 'Observed');
  const unverified = rows.filter((r) => r.assessment === 'Unverified');
  const required = rows.filter((r) => r.assessment !== 'Observed' && r.assessment !== 'Unverified');
  const add = () => {
    if (!zm.selectedConcepts.includes(c.id)) zm.setSelectedConcepts([...zm.selectedConcepts, c.id]);
    bh.toast(`${c.code} added to the concept comparison`);
    onClose();
    go(Z.compare);
  };
  return (
    <Drawer title={`Concept rationale: ${c.name}`} onClose={onClose}
      status={<StatusChip tone={CONFIDENCE_TONE[c.confidence]}>{`Evidence ${c.confidence.toLowerCase()}`}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={GitCompare} onClick={add}>Add to concept comparison</Button>} />}>
      <div className="kpis">
        <KpiCard label="Observed evidence items" value={num(observed.length)} />
        <KpiCard label="Unverified hypotheses" value={num(unverified.length)} />
        <KpiCard label="Items to validate" value={num(required.length)} />
      </div>
      <Card title="Evidence and assessment" icon={FileSearch} flush right={<Button small icon={MessageSquare} onClick={() => bh.toast(`Further evidence requested for ${c.code}`)}>Request further evidence</Button>}>
        <DataTable rows={rows} rowKey={(r) => r.item}
          columns={[
            { key: 'g', header: 'Area', render: (r) => <StatusChip tone="neutral">{r.group}</StatusChip> },
            { key: 'i', header: 'Evidence item', render: (r) => <span className="stack" style={{ gap: 0 }}><b>{r.item}</b><small className="muted">{r.source}</small></span> },
            { key: 'f', header: 'Finding', render: (r) => r.finding },
            { key: 'a', header: 'Assessment', align: 'center', render: (r) => <StatusChip tone={ASSESS_TONE[r.assessment]}>{r.assessment}</StatusChip> },
          ]} />
      </Card>
      <div className="grid g3">
        <Card title="Observed evidence" icon={CircleCheck}><List items={observed.map((r) => ({ label: `${r.item}: ${r.finding}` }))} /></Card>
        <Card title="Unverified hypotheses" icon={TriangleAlert}><List items={unverified.length ? unverified.map((r) => ({ label: r.item })) : [{ label: 'None recorded' }]} /></Card>
        <Card title="Required validation" icon={ListChecks}><List items={required.map((r) => ({ label: `${r.item} · ${r.assessment.toLowerCase()}` }))} /></Card>
      </div>
    </Drawer>
  );
}

// ================================================================ 8 Concept Comparison and Consolidation
const DECISIONS: { id: 'separate' | 'combine' | 'defer'; label: string; sub: string; next: string }[] = [
  { id: 'separate', label: 'Develop as two separate campaigns', sub: 'C1 and C2 stay distinct draft campaign records.', next: 'Proceed to proposition design' },
  { id: 'combine', label: 'Combine into one draft programme', sub: 'One programme after audience overlap checks.', next: 'Proceed with the combined programme' },
  { id: 'defer', label: 'Request further evidence / defer', sub: 'Ask the Marketing Head for the missing evidence first.', next: 'Request further evidence' },
];
export function ConceptComparison() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const concepts = useConcepts();
  const [rationale, setRationale] = useState<string | null>(null);
  const shown = concepts.filter((c) => zm.selectedConcepts.includes(c.id)).length >= 2 ? concepts.filter((c) => zm.selectedConcepts.includes(c.id)) : concepts.slice(0, 2);
  const decision = DECISIONS.find((d) => d.id === zm.compareDecision)!;
  const next = () => {
    if (decision.id === 'defer') { bh.toast('Further evidence requested from the Marketing Head'); go(Z.themes); return; }
    bh.toast(decision.id === 'combine' ? 'Concepts combined into one draft programme' : `${shown.map((c) => c.code).join(' and ')} continue as separate draft campaigns`);
    go(Z.proposition);
  };
  const open = (id: string) => conceptRationale(id).filter((r) => r.assessment !== 'Observed').length;
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Croptek conversion" title="Concept Comparison and Consolidation" back={Z.concepts} next={next} nextLabel={decision.next}
      right={<StatusChip tone="neutral">Draft · not submitted</StatusChip>}>
      <StudioTabs active={0} />
      <div className="kpis">
        <KpiCard label="Concepts compared" value={num(shown.length)} />
        <KpiCard label="Audience overlap (farmers)" value={num(AUDIENCE.overlap)} />
        <KpiCard label={`${shown[0].code} eligible farmers`} value={num(shown[0].eligibleFarmers)} />
        <KpiCard label={`${shown[1].code} cohort farmers`} value={num(shown[1].eligibleFarmers)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title="Concept comparison: key dimensions" icon={GitCompare} flush right={<>
          <Button small icon={FileSearch} onClick={() => setRationale(shown[0].id)}>View {shown[0].code} evidence</Button>
          <Button small icon={Edit3} onClick={() => go(Z.concepts)}>Edit concepts</Button>
          <Button small icon={Save} onClick={() => bh.toast('Comparison saved')}>Save comparison</Button>
        </>}>
          <DataTable rows={[...COMPARE_DIMENSIONS, { key: 'eligibleFarmers' as keyof Concept, label: 'Potential audience overlap' }]} rowKey={(d) => d.label}
            columns={[
              { key: 'd', header: 'Dimension', width: 170, render: (d) => <b>{d.label}</b> },
              ...shown.map((c) => ({ key: c.id, header: `${c.code} · ${c.name}`, render: (d: { key: keyof Concept; label: string }) => (d.label === 'Potential audience overlap' ? `${num(AUDIENCE.overlap)} farmers in both audiences` : String(c[d.key]) || 'NA') })),
            ]} />
        </Card>
        <Notes title="Comparison notes" items={[
          `Complementarity: ${shown[0].code} works at "${shown[0].journeyStage.toLowerCase()}", ${shown[1].code} at "${shown[1].journeyStage.toLowerCase()}".`,
          `Audience separation: ${num(AUDIENCE.overlap)} farmers sit in both audiences (${pct((AUDIENCE.overlap / AUDIENCE.c2) * 100, 0)} of ${shown[1].code}).`,
          `Evidence: ${shown.map((c) => `${c.code} has ${open(c.id)} open items`).join('; ')}.`,
          `Confidence: ${shown.map((c) => `${c.code} ${c.confidence.toLowerCase()}`).join(', ')}.`,
          `Decision recorded: ${decision.label.toLowerCase()}.`,
        ]} />
      </div>
      <Card title="Decision (campaign development)" icon={CircleCheck}>
        <div className="grid g3">
          {DECISIONS.map((d) => (
            <label key={d.id} className={`choice${zm.compareDecision === d.id ? ' on' : ''}`} style={{ cursor: 'pointer' }}>
              <input type="radio" name="decision" checked={zm.compareDecision === d.id} onChange={() => zm.setCompareDecision(d.id)} aria-label={d.label} />
              <span className="stack" style={{ gap: 2 }}><b>{d.label}</b><small className="muted">{d.sub}</small></span>
            </label>
          ))}
        </div>
      </Card>
      {rationale && <RationaleDrawer id={rationale} onClose={() => setRationale(null)} />}
    </ZmPage>
  );
}

// ================================================================ 9 Proposition and Intervention Designer
const PROP_FIELDS: { key: PropositionField; label: string }[] = [
  { key: 'valueProposition', label: 'Draft value proposition' },
  { key: 'targetBenefit', label: 'Target benefit' },
  { key: 'positioning', label: 'Positioning / differentiation' },
];
const STAGE_DETAIL: { key: keyof JourneyStage; label: string }[] = [
  { key: 'objective', label: 'Objective' },
  { key: 'participants', label: 'Target participants' },
  { key: 'channels', label: 'Proposed channels' },
  { key: 'expectedAction', label: 'Expected action' },
  { key: 'collateral', label: 'Required collateral' },
  { key: 'kpi', label: 'Measurement KPI' },
];
const cropWindow = () => {
  const p = phaseDetails(defaultWizard('onion-croptek').activities).find((x) => x.phase === 'Crop-stage window')!;
  return `${p.cropStage} · weeks ${p.window?.[0]}–${p.window?.[1]}`;
};
const defaultConfig = (s: JourneyStage): InterventionConfig => ({
  objective: s.objective, behaviour: s.expectedAction, participants: s.participants,
  types: s.id === 'retailer' ? ['Retailer briefing', 'Product education'] : s.id === 'trial' ? ['Field demonstration support'] : s.id === 'purchase' ? ['Farmer follow-up'] : ['Product education', 'Authorised material distribution'],
  channel: s.id === 'retailer' ? 'Retailer-led' : s.id === 'engagement' ? 'Village meetings' : s.id === 'trial' ? 'Field demonstrations' : 'Field follow-up',
  crop: 'Onion', geography: 'Maharashtra', window: cropWindow(), resources: s.collateral,
});

export function PropositionDesigner() {
  const bh = useBhStore();
  const zm = useZmStore();
  const claims = useClaims();
  const saved = { ...PROPOSITION, ...zm.proposition };
  const [draft, setDraft] = useState(saved);
  const [stage, setStage] = useState(JOURNEY[0].id);
  const [config, setConfig] = useState(false);
  const [claimsOpen, setClaimsOpen] = useState(false);
  const changed = PROP_FIELDS.filter((f) => draft[f.key] !== saved[f.key]).map((f) => f.key);
  const save = () => { zm.setProposition(draft); bh.toast('Proposition saved'); };
  const s = JOURNEY.find((x) => x.id === stage)!;
  const cfg = zm.interventions[stage];
  const detail = (k: keyof JourneyStage) => (cfg && k === 'objective' ? cfg.objective : cfg && k === 'expectedAction' ? cfg.behaviour : cfg && k === 'participants' ? cfg.participants : cfg && k === 'collateral' ? cfg.resources : String(s[k]));
  const validated = claims.filter((c) => c.status === 'validated').length;
  const fn = campaignFunnel();
  const bc = businessCaseC1();

  return (
    <ZmPage {...ZM_SECTION.studio} trail="Retailer-led Croptek conversion" title="Proposition and Intervention Designer" back={Z.compare} next={Z.collateral} nextLabel="Develop campaign collateral"
      right={<StatusChip tone="neutral">Draft · not approved</StatusChip>}>
      <StudioTabs active={1} />
      <div className="kpis">
        <KpiCard label="Farmers reached (target)" value={num(fn.reached)} />
        <KpiCard label="Trials (target)" value={num(AMBAD.villages.reduce((x, v) => x + v.trials, 0))} />
        <KpiCard label="Verified first purchases (target)" value={num(AMBAD.villages.reduce((x, v) => x + v.adopters, 0))} />
        <KpiCard label="Forecast incremental sales" value={lakh(bc.forecastSales, 1)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="stack">
          <Card title="Product proposition builder" icon={Target} right={<>
            <StatusChip tone={validated === claims.length ? 'ok' : 'warn'}>{`Claims ${validated} of ${claims.length} validated`}</StatusChip>
            <Button small icon={ShieldCheck} onClick={() => setClaimsOpen(true)}>Claims and agronomy validation</Button>
          </>}>
            <div className="grid g3">
              {PROP_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <textarea className={`input${changed.includes(f.key) ? ' chg' : ''}`} rows={3} aria-label={f.label} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                </Field>
              ))}
            </div>
            <EditBar count={changed.length} impact="Proposition text" onCancel={() => setDraft(saved)} onSave={save} />
          </Card>
          <Card title="Customer journey and intervention blueprint" icon={ClipboardList} right={<Button small icon={Edit3} onClick={() => setConfig(true)}>Edit</Button>}>
            <div className="journey">
              {JOURNEY.map((j, i) => (
                <Fragment key={j.id}>
                  <button type="button" className={`journey-step${j.id === stage ? ' on' : ''}`} onClick={() => setStage(j.id)} aria-pressed={j.id === stage}>
                    <b>{j.stage}{zm.interventions[j.id] && <CircleCheck size={14} />}</b><small>{j.summary}</small>
                  </button>
                  {i < JOURNEY.length - 1 && <ArrowRight size={16} className="journey-arrow" />}
                </Fragment>
              ))}
            </div>
            <div className="calc-label">{s.stage} · selected stage</div>
            <div className="grid g3">
              {STAGE_DETAIL.map((d) => (
                <div key={d.key} className="field"><span>{d.label}</span><div className="detail-box">{detail(d.key)}</div></div>
              ))}
            </div>
          </Card>
          <Card title="Activation readiness" icon={ListChecks}>
            <div className="recon compact" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              <div><span>Audience eligibility</span><StatusChip tone="warn">Pending validation</StatusChip></div>
              <div><span>Consent status</span><StatusChip tone="warn">Pending</StatusChip></div>
              <div><span>Stage-linked activation window</span><b>{cropWindow()}</b></div>
              <div><span>Preferred channels</span><b>{(cfg?.channel) ?? defaultConfig(s).channel}</b></div>
            </div>
          </Card>
        </div>
        <Notes title="Proposition checks" icon={ShieldCheck} items={[
          'Retailer influence evidence is unverified.',
          'Historical conversion benchmark is missing.',
          `Target cohort overlaps C2 by ${num(AUDIENCE.overlap)} farmers.`,
          `Technical claims: ${validated} of ${claims.length} validated.`,
          `Evidence readiness: ${zm.readinessChecks.length} of ${READINESS_CHECKS.length} checks confirmed.`,
          `${Object.keys(zm.interventions).length} of ${JOURNEY.length} journey stages configured.`,
        ]} />
      </div>
      {config && <InterventionDrawer stage={s} onClose={() => setConfig(false)} />}
      {claimsOpen && <ClaimsDrawer onClose={() => setClaimsOpen(false)} />}
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={save} onDiscard={() => setDraft(saved)} />
    </ZmPage>
  );
}

function InterventionDrawer({ stage, onClose }: { stage: JourneyStage; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const saved = zm.interventions[stage.id] ?? defaultConfig(stage);
  const [d, setD] = useState<InterventionConfig>(saved);
  const [tried, setTried] = useState(false);
  const keys = Object.keys(saved) as (keyof InterventionConfig)[];
  const changed = keys.filter((k) => JSON.stringify(d[k]) !== JSON.stringify(saved[k]));
  const required: (keyof InterventionConfig)[] = ['objective', 'behaviour', 'participants', 'channel', 'resources'];
  const missing = required.filter((k) => !String(d[k]).trim());
  const save = () => {
    setTried(true);
    if (missing.length || !d.types.length) return;
    zm.setIntervention(stage.id, d);
    bh.toast(`${stage.stage} intervention saved`);
    onClose();
  };
  const txt = (k: keyof InterventionConfig, label: string, rows = 2) => (
    <Field label={`${label} *`} error={tried && missing.includes(k) ? 'Required' : ''}>
      <textarea className={`input${changed.includes(k) ? ' chg' : ''}`} rows={rows} aria-label={label} value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
    </Field>
  );
  return (
    <Drawer title={`${stage.stage}: intervention configuration`} onClose={onClose}
      status={<StatusChip tone={changed.length ? 'warn' : 'neutral'}>{changed.length ? `${changed.length} change${changed.length === 1 ? '' : 's'}` : 'Draft · not approved'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Save} onClick={save}>Save intervention</Button>} />}>
      <div className="form-grid">
        {txt('objective', 'Strategic objective')}
        {txt('participants', 'Intended participants')}
        {txt('behaviour', 'Desired behaviour')}
        <Field label="Intervention types *" error={tried && !d.types.length ? 'Select at least one type' : ''}>
          <div className="pick">
            {INTERVENTION_TYPES.map((t) => (
              <button key={t} type="button" className={d.types.includes(t) ? 'on' : undefined} aria-pressed={d.types.includes(t)} onClick={() => setD({ ...d, types: d.types.includes(t) ? d.types.filter((x) => x !== t) : [...d.types, t] })}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Proposed channel *"><Select label="Proposed channel" value={d.channel} onChange={(v) => setD({ ...d, channel: v })} options={['Retailer-led', 'Village meetings', 'Field demonstrations', 'Field follow-up', 'Consent-based digital'].map((x) => opt(x, x))} /></Field>
        <Field label="Target crop *"><Select label="Target crop" value={d.crop} onChange={(v) => setD({ ...d, crop: v })} options={[opt('Onion', 'Onion')]} /></Field>
        <Field label="Geography *"><Select label="Geography" value={d.geography} onChange={(v) => setD({ ...d, geography: v })} options={['Maharashtra', 'Marathwada zone'].map((x) => opt(x, x))} /></Field>
        <Field label="Activation window *"><input className={`input${changed.includes('window') ? ' chg' : ''}`} aria-label="Activation window" value={d.window} onChange={(e) => setD({ ...d, window: e.target.value })} /></Field>
      </div>
      {txt('resources', 'Required resources')}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
        <Card title="KPI configuration" icon={Target} flush>
          <DataTable rows={INTERVENTION_KPIS} rowKey={(k) => k.id}
            columns={[
              { key: 'k', header: 'KPI', render: (k) => <b>{k.kpi}</b> },
              { key: 'm', header: 'Measure', render: (k) => k.measure },
              { key: 's', header: 'Source', render: (k) => k.source },
              { key: 't', header: 'Target', align: 'right', render: (k) => k.target },
              { key: 'v', header: 'Validation', align: 'center', render: (k) => <StatusChip tone={k.status === 'Defined' ? 'ok' : 'warn'}>{k.status}</StatusChip> },
            ]} />
        </Card>
        <Card title="Evidence readiness" icon={ListChecks}>
          {READINESS_CHECKS.map((c) => (
            <label key={c} className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={zm.readinessChecks.includes(c)} aria-label={c} onChange={() => zm.setReadinessChecks(zm.readinessChecks.includes(c) ? zm.readinessChecks.filter((x) => x !== c) : [...zm.readinessChecks, c])} />
              <span>{c}</span>
              <b className="right"><StatusChip tone={zm.readinessChecks.includes(c) ? 'ok' : 'warn'}>{zm.readinessChecks.includes(c) ? 'Confirmed' : 'Pending'}</StatusChip></b>
            </label>
          ))}
        </Card>
      </div>
    </Drawer>
  );
}

function ClaimsDrawer({ onClose }: { onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const claims = useClaims();
  const [sel, setSel] = useState(claims[0].id);
  const c = claims.find((x) => x.id === sel)!;
  const [text, setText] = useState(c.text);
  const [subst, setSubst] = useState(c.substantiation);
  const [audience, setAudience] = useState('Retailer');
  const [reviewer, setReviewer] = useState(c.reviewer);
  const [tried, setTried] = useState(false);
  const pick = (id: string) => { const x = claims.find((y) => y.id === id)!; setSel(id); setText(x.text); setSubst(x.substantiation); setReviewer(x.reviewer); setTried(false); };
  const changed = [text !== c.text, subst !== c.substantiation].filter(Boolean).length;
  const err = text.trim().length < 5 ? 'Enter the claim text' : subst.trim().length < 10 ? 'Enter the substantiation' : '';
  const saveDraft = () => { zm.setClaim(sel, { text: text.trim(), substantiation: subst.trim(), reviewer }); bh.toast('Claim draft saved'); };
  const request = () => {
    setTried(true);
    if (err) return;
    zm.setClaim(sel, { text: text.trim(), substantiation: subst.trim(), reviewer, status: 'review_requested' });
    bh.toast(`Technical review requested: "${text.trim()}"`);
  };
  const requested = claims.filter((x) => x.status === 'review_requested').length;
  return (
    <Drawer title="Product proposition and agronomy validation" onClose={onClose}
      status={<StatusChip tone={CLAIM_TONE[c.status]}>{CLAIM_STATUS_LABEL[c.status]}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} disabled={c.status === 'review_requested' || c.status === 'validated'} onClick={request}>Request technical review</Button>} />}>
      <Card title="Draft claims" icon={ShieldCheck} flush>
        <DataTable selectable rows={claims} rowKey={(x) => x.id} selected={sel} onRowClick={(x) => pick(x.id)}
          columns={[
            { key: 't', header: 'Draft claim', render: (x) => <b>{x.text}</b> },
            { key: 'e', header: 'Technical evidence required', render: (x) => x.evidence },
            { key: 'c', header: 'Crop-stage applicability', render: (x) => x.stages.join(' · ') },
            { key: 'r', header: 'Reviewer', render: (x) => x.reviewer },
            { key: 's', header: 'Status', align: 'center', render: (x) => <StatusChip tone={CLAIM_TONE[x.status]}>{CLAIM_STATUS_LABEL[x.status]}</StatusChip> },
          ]} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.9fr)' }}>
        <Card title="Selected claim details" icon={FileText} right={<Button small icon={Save} disabled={!changed} onClick={saveDraft}>Save draft</Button>}>
          <div className="form-grid">
            <Field label="Draft claim text *" error={tried && text.trim().length < 5 ? err : ''}><input className={`input${text !== c.text ? ' chg' : ''}`} aria-label="Draft claim text" value={text} onChange={(e) => setText(e.target.value)} /></Field>
            <Field label="Claim category"><input className="input" aria-label="Claim category" value={c.category} readOnly /></Field>
            <Field label="Target crop"><Select label="Claim crop" value="Onion" onChange={() => undefined} options={[opt('Onion', 'Onion')]} /></Field>
            <Field label="Formulation / SKU reference"><input className="input" aria-label="SKU reference" value="Croptek · onion SKUs (product master)" readOnly /></Field>
            <Field label="Intended audience *"><Select label="Intended audience" value={audience} onChange={setAudience} options={['Retailer', 'Farmer', 'Field team'].map((x) => opt(x, x))} /></Field>
            <Field label="Reviewer assignment *"><Select label="Reviewer" value={reviewer} onChange={setReviewer} options={['Agronomy reviewer (onion)', 'Regulatory affairs'].map((x) => opt(x, x))} /></Field>
          </div>
          <Field label="Required scientific / label substantiation *" error={tried && subst.trim().length < 10 ? err : ''}>
            <textarea className={`input${subst !== c.substantiation ? ' chg' : ''}`} rows={2} aria-label="Substantiation" value={subst} onChange={(e) => setSubst(e.target.value)} />
          </Field>
          <Field label="Evidence attachment"><Attach label="Claim evidence" /></Field>
        </Card>
        <div className="stack">
          <Card title="Crop-stage suitability" icon={Sprout} flush>
            <DataTable rows={[...CROP_STAGES]} rowKey={(st) => st}
              columns={[
                { key: 's', header: 'Onion stage', render: (st) => <b>{st}</b> },
                { key: 'a', header: 'Proposed activation stage', align: 'center', render: (st) => <StatusChip tone={c.stages.includes(st) ? 'ok' : 'neutral'}>{c.stages.includes(st) ? 'Yes' : 'No'}</StatusChip> },
                { key: 'f', header: 'Product fit', align: 'center', render: (st) => (c.stages.includes(st) ? <StatusChip tone={c.status === 'validated' ? 'ok' : 'warn'}>{c.status === 'validated' ? 'Validated' : 'Pending'}</StatusChip> : <span className="na">NA</span>) },
                { key: 'r', header: 'Application rate', align: 'center', render: (st) => (c.stages.includes(st) ? <StatusChip tone={c.status === 'validated' ? 'ok' : 'warn'}>{c.status === 'validated' ? 'Validated' : 'Pending'}</StatusChip> : <span className="na">NA</span>) },
              ]} />
          </Card>
          <Notes title="Technical validation checks" icon={ShieldCheck} items={[
            `${claims.filter((x) => x.status === 'validated').length} of ${claims.length} claims validated; ${requested} in technical review.`,
            `"${c.text}" applies at ${c.stages.length} of ${CROP_STAGES.length} onion stages.`,
            `Evidence needed: ${c.evidence.toLowerCase()}.`,
            'Edits to an approved claim need a new technical review.',
          ]} />
        </div>
      </div>
    </Drawer>
  );
}

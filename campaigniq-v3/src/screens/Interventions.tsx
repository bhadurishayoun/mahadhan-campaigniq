/**
 * Screens 17–20 — Management Action Tracker (BH.5.png) with Intervention Request drawer (BH.5a.png),
 * Portfolio Learning & Next-Year Priorities (BH.5b.png), AI Copilot workspace (BH.6.png).
 */
import { ArrowRight, CircleCheck, ClipboardList, Coins, Eye, FileSearch, FileText, Folder, Layers, MessageCircle, MessagesSquare, RefreshCw, Save, Send, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ambadMetrics, businessCase, campaignById, nationalReturns, netRoi, campaignMetrics, CAMPAIGNS, FY, INTERVENTION_DELIVERABLES, NATIONAL, NEXT_FY, nextYearPriorities,
  REGIONS, regionMetrics, THEMES, themeCampaigns, themeShares, type Intervention, type InterventionCategory, type Priority,
} from '../data/bh';
import { crore, lakh, num, pct, pp, times } from '../data/format';
import { R } from '../routes';
import { useBhData, useBhStore } from '../store/bhStore';
import { C, SERIES } from '../theme';
import { Donut, HBars, Legend } from '../ui/charts';
import { Breadcrumb, Button, Card, FooterBar, KpiCard, PageHeader, PanelFooter, SegmentedControl, Select, StatusChip, type Tone } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { Drawer, EvidenceDrawer, type Evidence } from '../ui/overlay';
import { opt, useGo } from './common';

const CATEGORY_ICON: Record<InterventionCategory, typeof Target> = { Performance: Target, 'Strategic theme': Users, Investment: Coins, 'Theme clarification': MessageCircle };
const statusTone = (i: Intervention): Tone => (i.status === 'draft' ? 'warn' : i.status === 'closed' ? 'ok' : 'neutral');

// ================================================================ 17 Tracker + 18 Intervention drawer
export function ActionTracker() {
  const go = useGo();
  const store = useBhStore();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<'all' | InterventionCategory>('all');
  const list = store.interventions.filter((i) => cat === 'all' || i.category === cat);
  const selId = params.get('selected') ?? store.interventions[0]?.id;
  const sel = store.interventions.find((i) => i.id === selId) ?? store.interventions[0];
  const drawerId = params.get('drawer');
  const drawerItem = store.interventions.find((i) => i.id === drawerId);
  const counts = { total: store.interventions.length, draft: store.interventions.filter((i) => i.status === 'draft').length, awaiting: store.interventions.filter((i) => i.status === 'awaiting_response').length, closed: store.interventions.filter((i) => i.status === 'closed').length };
  const setP = (patch: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); Object.entries(patch).forEach(([k, v]) => (v === null ? n.delete(k) : n.set(k, v))); return n; });
  const camp = sel?.campaign ? campaignById(sel.campaign) : null;
  const cm = camp ? campaignMetrics(camp) : null;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic interventions' }, { label: 'Management action tracker' }]} />
      <PageHeader title="Strategic Intervention & Management Decision Tracker" />
      <div className="kpis">
        <KpiCard label="Total actions" value={counts.total} />
        <KpiCard label="Drafts" value={counts.draft} />
        <KpiCard label="Awaiting response" value={counts.awaiting} />
        <KpiCard label="Closed" value={counts.closed} />
      </div>
      <SegmentedControl<'all' | InterventionCategory> value={cat} onChange={setCat} options={[
        { value: 'all', label: 'All actions' }, { value: 'Performance', label: 'Performance' }, { value: 'Investment', label: 'Investment' }, { value: 'Strategic theme', label: 'Strategic themes' }, { value: 'Theme clarification', label: 'Clarifications' },
      ]} />
      <Card title="Management intervention register" icon={ClipboardList} flush>
        <DataTable rows={list} rowKey={(i) => i.id} selected={sel?.id} onRowClick={(i) => setP({ selected: i.id })}
          columns={[
            { key: 'n', header: 'Intervention', render: (i) => { const I = CATEGORY_ICON[i.category]; return <span className="row"><I size={17} color="var(--brand)" /><b>{i.name}</b></span>; } },
            { key: 'c', header: 'Category', align: 'center', render: (i) => <StatusChip tone="info">{i.category}</StatusChip> },
            { key: 'g', header: 'Geography', render: (i) => i.geography },
            { key: 't', header: 'Business trigger', render: (i) => i.trigger },
            { key: 'r', header: 'Responsible role', render: (i) => i.role },
            { key: 'p', header: 'Priority', align: 'center', render: (i) => <StatusChip tone={i.priority === 'High' ? 'warn' : 'ok'}>{i.priority}</StatusChip> },
            { key: 's', header: 'Status', align: 'center', render: (i) => <StatusChip tone={statusTone(i)}>{i.statusLabel}</StatusChip> },
            { key: 'v', header: 'View', align: 'center', render: (i) => <Button small onClick={() => setP({ selected: i.id, drawer: i.id })}>Open</Button> },
          ]} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1.6fr)' }}>
        <Card title="Action status distribution" icon={Target}>
          <div className="row" style={{ gap: 24 }}>
            <Donut center={String(counts.total)} sub="Actions" parts={[{ label: 'Draft', value: counts.draft, color: C.amber }, { label: 'Awaiting response', value: counts.awaiting, color: C.brand }, { label: 'Closed', value: counts.closed, color: C.neutral }]} />
            <div style={{ flex: 1 }}>
              {[['Draft', counts.draft, C.amber], ['Awaiting response', counts.awaiting, C.brand], ['Closed', counts.closed, C.light]].map(([l, v, c]) => (
                <div key={l as string} className="list-row"><i style={{ width: 12, height: 12, borderRadius: 2, background: c as string, display: 'inline-block' }} />{l}<b className="right">{v}</b></div>
              ))}
            </div>
          </div>
        </Card>
        {sel && (
          <Card title={`Selected intervention: ${sel.name}`} icon={FileText} right={<><Button small icon={Eye} onClick={() => go(R.effectiveness('west', sel.campaign ?? 'croptek'))}>Linked campaign</Button><Button small primary onClick={() => setP({ drawer: sel.id })}>Open intervention</Button></>}>
            <div className="grid g2">
              <div className="kv">
                {cm && camp ? <>
                  <span>Execution variance</span><b className="ok-text">{pp(cm.execVariance)}</b>
                  <span>Adoption shortfall</span><b className="ok-text">{cm.shortfall} ({camp.adopters}/{camp.adoptionTarget})</b>
                  <span>Budget utilisation</span><b className="ok-text">{pct(cm.utilisationPct, 0)} ({lakh(camp.actual)}/{lakh(camp.approved)})</b>
                  <span>Actual net ROI</span><b><StatusChip tone="ok">{times(netRoi(camp.sales, camp.actual))}</StatusChip></b>
                </> : <>
                  <span>Business trigger</span><b>{sel.trigger}</b>
                  <span>Category</span><b>{sel.category}</b>
                  <span>Geography</span><b>{sel.geography}</b>
                  <span>Priority</span><b>{sel.priority}</b>
                </>}
              </div>
              <div className="kv">
                <span>Responsible role</span><b>{sel.role}</b>
                <span>Required deliverable</span><b>{sel.deliverable}</b>
                <span>Due date</span><b>{sel.due ?? 'Not set'}</b>
                <span>Request status</span><b><StatusChip tone={statusTone(sel)}>{sel.statusLabel}</StatusChip></b>
              </div>
            </div>
          </Card>
        )}
      </div>
      <FooterBar onBack={() => go(R.command)} onNext={() => go(R.learning)} />
      {drawerItem && <InterventionDrawer item={drawerItem} onClose={() => setP({ drawer: null })} />}
    </div>
  );
}

function InterventionDrawer({ item, onClose }: { item: Intervention; onClose: () => void }) {
  const go = useGo();
  const store = useBhStore();
  const [type, setType] = useState(item.deliverable);
  const [role, setRole] = useState(item.role);
  const [priority, setPriority] = useState<Priority>(item.priority);
  const [due, setDue] = useState(item.due ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const camp = item.campaign ? campaignById(item.campaign) : null;
  const cm = camp ? campaignMetrics(camp) : null;
  const sent = item.status !== 'draft';
  const patch = { deliverable: type, role, priority, due: due || undefined, notes };

  return (
    <Drawer title="Strategic intervention request" status={<StatusChip tone={sent ? 'neutral' : 'warn'}>{item.statusLabel}</StatusChip>} onClose={onClose}
      footer={<PanelFooter onBack={onClose} action={<Button small primary icon={Send} onClick={sent ? undefined : () => { store.updateIntervention(item.id, { ...patch, status: 'awaiting_response', statusLabel: 'Awaiting response' }); store.toast(`Intervention request sent to ${role}`); onClose(); }}>{sent ? 'Request sent' : `Submit intervention request to ${role}`}</Button>} />}>
      <div className="row" style={{ gap: 18, background: 'var(--tint)', borderRadius: 8, padding: '8px 14px', flexWrap: 'wrap' }}>
        <b className="strong">{item.name}</b><span className="muted">|</span><span>{item.geography}</span><span className="muted">|</span><StatusChip tone="warn">{priority}</StatusChip>
      </div>
      <Card title="Business trigger" flush>
        {camp && cm ? (
          <DataTable rows={[
            { k: 'Regional execution', p: `${camp.plannedExec}%`, o: `${camp.observedExec}%`, v: <StatusChip tone="warn">{pp(cm.execVariance)}</StatusChip> },
            { k: 'Adoption', p: `${num(camp.adoptionTarget)} checkpoint target`, o: `${num(camp.adopters)} recorded`, v: <StatusChip tone="warn">–{cm.shortfall}</StatusChip> },
            { k: 'Full-campaign investment envelope', p: lakh(camp.approved), o: `${lakh(camp.actual)} actual`, v: <StatusChip tone="ok">{pct(cm.utilisationPct, 0)} utilised</StatusChip> },
            { k: 'Incremental sales', p: lakh(businessCase(camp.id).forecastSales), o: `${lakh(camp.sales)} validated`, v: <StatusChip tone="warn">–{lakh(businessCase(camp.id).forecastSales - camp.sales)}</StatusChip> },
            { k: 'Net ROI', p: times(businessCase(camp.id).netRoi), o: times(netRoi(camp.sales, camp.actual)), v: <StatusChip tone="ok">On track</StatusChip> },
          ]} rowKey={(r) => r.k} columns={[
            { key: 'k', header: 'KPI', render: (r) => r.k }, { key: 'p', header: 'Plan', render: (r) => r.p }, { key: 'o', header: 'Observed', render: (r) => r.o }, { key: 'v', header: 'Variance', align: 'center', render: (r) => r.v },
          ]} />
        ) : <div style={{ padding: '4px 16px 12px' }} className="row"><Target size={16} color="var(--brand)" />{item.trigger}</div>}
      </Card>
      <Card title="Intervention configuration" right={<><Button small icon={Eye} onClick={() => go(R.effectiveness('west', item.campaign ?? 'croptek'))}>Linked campaign</Button><Button small icon={Save} onClick={() => { store.updateIntervention(item.id, patch); store.toast('Draft saved'); }}>Save draft</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .8fr 1fr', gap: 12 }}>
          <label className="field"><span>Intervention type</span><Select label="Intervention type" value={type} onChange={setType} options={[...new Set([item.deliverable, 'Campaign recovery assessment', 'Strategic opportunity assessment', 'Finance validation of reallocation', 'Clarified theme scope'])].map((x) => opt(x, x))} /></label>
          <label className="field"><span>Recipient</span><Select label="Recipient" value={role} onChange={setRole} options={[...new Set([item.role, 'Marketing Head', 'Marketing Head and Finance'])].map((x) => opt(x, x))} /></label>
          <label className="field"><span>Priority</span><Select label="Priority" value={priority} onChange={(v) => setPriority(v as Priority)} options={['High', 'Medium', 'Low'].map((x) => opt(x, x))} /></label>
          <label className="field"><span>Response due date</span><input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} /></label>
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>Management instructions</span><textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Management instructions" /></label>
        </div>
      </Card>
      <Card title="Required deliverables">
        {INTERVENTION_DELIVERABLES.map((d) => <div key={d} className="list-row"><span className="check" />{d}<span className="right"><StatusChip tone="warn">{sent ? 'Awaiting submission' : 'Not submitted'}</StatusChip></span></div>)}
      </Card>
    </Drawer>
  );
}

// ================================================================ 19 Portfolio Learning & Next-Year Priorities
export function PortfolioLearning() {
  const go = useGo();
  const store = useBhStore();
  const [themesSel, setThemesSel] = useState<string[]>(['conversion']);
  const [prioSel, setPrioSel] = useState<string[]>([]);
  const [recipient, setRecipient] = useState('Marketing Head');
  const priorities = nextYearPriorities();
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const submit = () => {
    const id = `priorities-${NEXT_FY.replace(/\D/g, '')}`;
    const chosen = priorities.filter((p) => prioSel.includes(p.id)).map((p) => p.geography);
    store.addIntervention({ id, name: `${NEXT_FY} strategic priorities`, category: 'Strategic theme', geography: 'National', trigger: `${chosen.length || priorities.length} priorities, ${themesSel.length} themes selected`, role: recipient, priority: 'High', status: 'awaiting_response', statusLabel: 'Assessment pending', deliverable: 'Next-year strategic theme assessment' });
    store.submitLearning();
    store.toast(`Priorities sent to ${recipient}`);
    go(`${R.tracker}?selected=${id}`);
  };
  const checkbox = (on: boolean) => <span className={`check${on ? ' on' : ''}`}>{on && <CircleCheck size={11} />}</span>;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic interventions', onClick: () => go(R.tracker) }, { label: 'Portfolio learning' }, { label: 'Next-year priorities' }]} />
      <PageHeader title="National Campaign Portfolio Learning & Next-Year Strategic Priorities" right={<StatusChip tone={store.learningSubmitted ? 'ok' : 'warn'}>{store.learningSubmitted ? 'Submitted for assessment' : 'Draft priorities'}</StatusChip>} />
      <div className="kpis">
        <KpiCard label="Active campaigns" value={NATIONAL.campaigns} />
        <KpiCard label="Actual investment" value={crore(NATIONAL.actual)} />
        <KpiCard label="Recorded adopters" value={num(NATIONAL.adopters)} />
        <KpiCard label="Actual net ROI" value={times(nationalReturns().roi)} />
      </div>
      <Card title="National strategic theme performance and learning" icon={Layers} flush>
        <DataTable rows={THEMES} rowKey={(t) => t.id} selected={themesSel[0]} onRowClick={(t) => toggle(themesSel, setThemesSel, t.id)}
          columns={[
            { key: 'n', header: 'Theme', render: (t) => <b>{t.name}</b> },
            { key: 'c', header: 'Campaigns', align: 'right', render: (t) => themeCampaigns(t.id) },
            { key: 'i', header: 'Actual investment', align: 'right', render: (t) => lakh(t.investment) },
            { key: 'a', header: 'Recorded adopters', align: 'right', render: (t) => num(t.adopters) },
            { key: 'r', header: 'Actual net ROI', align: 'center', render: (t) => <StatusChip tone={netRoi(t.sales, t.investment) >= 0.3 ? 'ok' : 'warn'}>{times(netRoi(t.sales, t.investment))}</StatusChip> },
            { key: 'd', header: 'Proposed review direction', align: 'center', render: (t) => <StatusChip tone={t.direction === 'Redesign' ? 'warn' : t.direction === 'Assess' ? 'neutral' : 'ok'}>{t.direction}</StatusChip> },
            { key: 's', header: 'Select', align: 'center', render: (t) => checkbox(themesSel.includes(t.id)) },
          ]}
          total={{ n: 'Total', c: NATIONAL.campaigns, i: lakh(NATIONAL.actual), a: num(NATIONAL.adopters), r: '—', d: '—' }}
        />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)' }}>
        <Card title="Investment share vs adoption share" icon={Target} right={<Legend series={[{ key: 'i', label: 'Investment share', color: SERIES.planned }, { key: 'a', label: 'Recorded adoption share', color: SERIES.observed }]} />}>
          <HBars labelWidth={150} max={50} format={(v) => pct(v)}
            rows={THEMES.map((t) => ({ label: t.name, values: [themeShares(t).investmentShare, themeShares(t).adoptionShare] }))}
            series={[{ key: 'i', label: 'Investment share', color: SERIES.planned }, { key: 'a', label: 'Adoption share', color: SERIES.observed }]} />
        </Card>
        <Card title="Next-year strategic priority matrix" icon={ClipboardList} right={<><Button small icon={Eye} onClick={() => go(R.effectiveness('west'))}>Campaign evidence</Button><Button small icon={Save} onClick={() => store.toast('Draft priorities saved')}>Save draft</Button><Button small primary icon={Send} onClick={submit}>Submit for Marketing Head assessment</Button></>}>
          <DataTable rows={priorities} rowKey={(p) => p.id} onRowClick={(p) => toggle(prioSel, setPrioSel, p.id)}
            columns={[
              { key: 'g', header: 'Geography / theme', render: (p) => p.geography },
              { key: 'o', header: 'Observed indicator', render: (p) => p.indicator },
              { key: 'd', header: 'Proposed direction', render: (p) => <StatusChip tone={p.tone}>{p.direction}</StatusChip> },
              { key: 's', header: 'Select', align: 'center', render: (p) => checkbox(prioSel.includes(p.id)) },
            ]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 'auto' }}>
            <label className="field"><span>Target FY</span><Select label="Target FY" value={NEXT_FY} onChange={() => undefined} options={[opt(NEXT_FY, `${NEXT_FY} proposed`)]} /></label>
            <label className="field"><span>Recipient</span><Select label="Recipient" value={recipient} onChange={setRecipient} options={[opt('Marketing Head', 'Marketing Head'), opt('Marketing Head and Finance', 'Marketing Head and Finance')]} /></label>
            <div className="field"><span>Status</span><StatusChip tone={store.learningSubmitted ? 'ok' : 'warn'}>{store.learningSubmitted ? 'Submitted' : 'Draft priorities · not submitted'}</StatusChip></div>
          </div>
        </Card>
      </div>
      <FooterBar onBack={() => go(R.tracker)} onNext={() => go(R.assistant)} />
    </div>
  );
}

// ================================================================ 20 AI Copilot workspace
type QuestionId = 'priorities' | 'growth' | 'campaigns' | 'change';
const QUESTIONS: { id: QuestionId; text: string; keys: string[] }[] = [
  { id: 'priorities', text: `Which regions and marketing themes should I prioritise for ${NEXT_FY}, and why?`, keys: ['priorit', 'region', 'theme'] },
  { id: 'growth', text: 'Where is growth lagging?', keys: ['growth', 'lag', 'gap', 'behind'] },
  { id: 'campaigns', text: 'Which campaigns need review?', keys: ['campaign', 'review', 'execution'] },
  { id: 'change', text: 'What should change next year?', keys: ['change', 'next year', 'learn'] },
];

export function DecisionAssistant() {
  const go = useGo();
  const store = useBhStore();
  const periodLbl = useBhData().periodLabel;
  const [q, setQ] = useState<QuestionId>('priorities');
  const [draft, setDraft] = useState('');
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const a = ambadMetrics();
  const croptek = campaignById('croptek');
  const cm = campaignMetrics(croptek);
  const gapRegion = [...REGIONS].sort((x, y) => regionMetrics(y).gap - regionMetrics(x).gap)[0];
  const ask = (text: string) => {
    const t = text.toLowerCase();
    const hit = QUESTIONS.find((x) => x.keys.some((k) => t.includes(k)));
    setQ(hit?.id ?? 'priorities');
    setDraft('');
  };

  type Row = { n: string; title: string; evidence: string; status: string; tone: Tone; action: string; to: string };
  const answers: Record<QuestionId, Row[]> = {
    priorities: [
      { n: '1', title: `${gapRegion.name} region`, evidence: `${crore(regionMetrics(gapRegion).gap, 1)} business ABP gap`, status: 'Review', tone: 'warn', action: 'Review market opportunity', to: R.opportunity },
      { n: '2', title: 'West Croptek conversion', evidence: `${croptek.adopters} adopters / ${croptek.adoptionTarget} checkpoint target = ${pct(cm.adoptionPct, 0)}`, status: 'Provisional', tone: 'neutral', action: 'Review existing theme performance', to: R.effectiveness('west', 'croptek') },
      { n: '3', title: 'Ambad village gap', evidence: `${a.lowest.name} ${pct(a.lowest.pct)} vs ${a.highest.name} ${pct(a.highest.pct)} = ${a.villageGap.toFixed(1)} pp`, status: 'Validation required', tone: 'warn', action: 'Validate intervention evidence', to: R.territory('ambad') },
    ],
    growth: [...REGIONS].sort((x, y) => regionMetrics(y).gap - regionMetrics(x).gap).map((r, i) => ({ n: String(i + 1), title: `${r.name} region`, evidence: `${crore(regionMetrics(r).gap, 1)} gap · ${pct(regionMetrics(r).achievementPct)} of ABP`, status: pp(regionMetrics(r).execVariance) + ' execution', tone: 'warn' as Tone, action: 'Open regional performance', to: R.region(r.id) })),
    campaigns: [...CAMPAIGNS].sort((x, y) => campaignMetrics(x).execVariance - campaignMetrics(y).execVariance).map((c, i) => ({ n: String(i + 1), title: c.name, evidence: `${pp(campaignMetrics(c).execVariance)} execution · ${pct(campaignMetrics(c).adoptionPct, 0)} of adoption target`, status: campaignMetrics(c).adoptionPct < 75 ? 'Review' : 'On watch', tone: (campaignMetrics(c).adoptionPct < 75 ? 'warn' : 'ok') as Tone, action: 'Open campaign diagnostics', to: R.diagnostics(c.region, c.id) })),
    change: THEMES.map((t, i) => ({ n: String(i + 1), title: t.name, evidence: `${pct(themeShares(t).investmentShare)} of investment · ${pct(themeShares(t).adoptionShare)} of adopters`, status: t.direction, tone: (t.direction === 'Redesign' ? 'warn' : 'ok') as Tone, action: 'Open portfolio learning', to: R.learning })),
  };
  const question = QUESTIONS.find((x) => x.id === q)!;
  const requestAssessment = () => {
    const id = `market-${gapRegion.id}`;
    store.addIntervention({ id, name: `${gapRegion.name} region market assessment`, category: 'Strategic theme', geography: gapRegion.name, trigger: `${crore(regionMetrics(gapRegion).gap, 1)} business gap`, role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Assessment pending', deliverable: 'Strategic opportunity assessment' });
    store.toast('Market assessment requested from Marketing Head');
    go(`${R.tracker}?selected=${id}`);
  };

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'AI Copilot workspace' }, { label: 'National portfolio' }, { label: 'Strategic priorities' }]} />
      <PageHeader title="AI Copilot workspace" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1fr)' }}>
        <Card>
          <div className="row" style={{ gap: 12 }}><Users size={20} color="var(--ink-soft)" /><div className="input" style={{ display: 'flex', alignItems: 'center', height: 'auto', minHeight: 40, fontSize: 14, background: 'var(--canvas)' }}>{question.text}</div></div>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <MessagesSquare size={20} color="var(--brand)" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <b className="strong">{q === 'priorities' ? `Investigation priorities for ${NEXT_FY}` : q === 'growth' ? 'Regions by business gap' : q === 'campaigns' ? 'Campaigns by execution variance' : 'Theme learning directions'}</b>
              <DataTable rows={answers[q]} rowKey={(r) => r.n} onRowClick={(r) => go(r.to)}
                columns={[
                  { key: 'n', header: '#', render: (r) => <span className="kpi-tile" style={{ width: 24, height: 24, fontSize: 12, fontWeight: 700 }}>{r.n}</span> },
                  { key: 't', header: 'Focus', render: (r) => <b>{r.title}</b> },
                  { key: 'e', header: `Evidence (${FY})`, render: (r) => r.evidence },
                  { key: 's', header: 'Status', align: 'center', render: (r) => <StatusChip tone={r.tone}>{r.status}</StatusChip> },
                  { key: 'a', header: 'Next step', render: (r) => <button type="button" className="link-btn" onClick={() => go(r.to)}>{r.action}<ArrowRight size={13} /></button> },
                ]} />
              {q === 'priorities' && (
                <div className="card" style={{ padding: '10px 14px', gap: 8 }}>
                  <b className="strong">Ambad adoption ({periodLbl}) – reference</b>
                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ flex: 1 }}><HBars labelWidth={90} max={60} format={(v) => pct(v)} rows={[a.highest, a.lowest].map((v) => ({ label: v.name, values: [v.pct], highlight: v.pct < 45 ? 0 : undefined }))} series={[{ key: 'p', label: 'Trial-to-adoption', color: SERIES.planned }]} /></div>
                    <StatusChip tone="ok">{a.villageGap.toFixed(1)} pp gap</StatusChip>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {QUESTIONS.filter((x) => x.id !== q).map((x) => <Button key={x.id} small icon={MessageCircle} onClick={() => setQ(x.id)}>{x.text}</Button>)}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) ask(draft); }}>
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a follow-up question" aria-label="Follow-up question" />
            <button type="submit" className="btn primary sm" aria-label="Ask"><Send size={14} /></button>
          </form>
        </Card>
        <div className="stack">
          <Card title="Current context" icon={Folder}>
            <div className="list-row"><Folder size={15} />National portfolio</div>
            <div className="list-row"><FileText size={15} />{FY} · {periodLbl}</div>
            <div className="list-row"><Layers size={15} /><b>{NATIONAL.campaigns}</b>&nbsp;active campaigns</div>
            <div className="list-row"><Coins size={15} /><b>{crore(NATIONAL.actual)}</b>&nbsp;actual marketing investment</div>
            <div className="list-row"><Users size={15} /><b>{num(NATIONAL.adopters)}</b>&nbsp;recorded adopters</div>
            <div className="list-row"><RefreshCw size={15} />Actual net ROI<span className="right"><StatusChip tone="ok">{times(nationalReturns().roi)}</StatusChip></span></div>
          </Card>
          <Card title="Next steps" icon={ArrowRight} right={
          <Button small icon={FileSearch} onClick={() => setEvidence({ title: 'Source evidence', owner: 'Business Head workspace records', facts: [
            { label: 'Business gap by region', value: REGIONS.map((r) => `${r.name} ${crore(regionMetrics(r).gap, 1)}`).join(' · ') },
            { label: 'Croptek adoption', value: `${croptek.adopters} / ${croptek.adoptionTarget}` },
            { label: 'Ambad village gap', value: `${a.villageGap.toFixed(1)} pp` },
            { label: 'Portfolio net ROI', value: times(nationalReturns().roi) },
          ] })}>Source evidence</Button>
          }>
            <button type="button" className="list-row" style={{ width: '100%' }} onClick={() => go(R.opportunity)}><ArrowRight size={15} />Explore {gapRegion.name} region market gap<span className="right"><StatusChip tone="ok">Market opportunity</StatusChip></span></button>
            <button type="button" className="list-row" style={{ width: '100%' }} onClick={() => go(R.review('croptek-next'))}><ArrowRight size={15} />Review Croptek strategic theme<span className="right"><StatusChip tone="ok">Theme review</StatusChip></span></button>
            <button type="button" className="list-row" style={{ width: '100%' }} onClick={() => go(R.inbox)}><ArrowRight size={15} />Review pending themes<span className="right"><StatusChip tone="ok">Theme approval inbox</StatusChip></span></button>
            <button type="button" className="list-row" style={{ width: '100%' }} onClick={requestAssessment}><ArrowRight size={15} />Request market assessment<span className="right"><StatusChip tone="ok">Marketing Head</StatusChip></span></button>
          </Card>
        </div>
      </div>
      <FooterBar onBack={() => go(R.command)} onNext={() => go(R.command)} />
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}

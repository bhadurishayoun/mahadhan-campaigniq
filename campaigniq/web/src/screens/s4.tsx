import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  AlertTriangle, BarChart3, Bot, CalendarDays, CheckCircle2, ClipboardCheck, ClipboardList, Clock, CloudSun, Coins, FileBarChart,
  FileText, GitBranch, History, IndianRupee, LayoutList, Lightbulb, MapPin, Megaphone, Minus, Package, Pencil, Plus, RefreshCw,
  RotateCcw, Save, Search, Send, ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, Sprout, Store, Target, ThumbsUp, TrendingUp,
  UserCheck, Users, Wallet,
} from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import {
  AiItem, Breadcrumbs, Btn, Check, COLORS, ContextStrip, DataTable, Donut, FlowFooter, Grid, HBars, Kpi, KpiRow, Note, PageHeader,
  Panel, Pill, SourceBar, StackFunnel, Stepper, cx, type Tone,
} from '../ui';
import './s4.css';

/* ------------------------------------------------------------------ */
/* Shared Campaign Strategy Studio state (persists across S4.x screens) */
/* ------------------------------------------------------------------ */

type ActivityKey = 'demo' | 'retail' | 'meet' | 'digital' | 'follow' | 'cont';

interface ActivityDef {
  key: ActivityKey;
  name: string;
  short: string;
  sub: string;
  icon: ReactNode;
  base: number;
  unit: number;
  reachPer: number;
  ppPer: number;
  color: string;
  owner: string;
  qty: (count: number) => string;
  qtySub: string;
}

const ACTIVITIES: ActivityDef[] = [
  { key: 'demo', name: 'Farmer Demonstrations', short: 'Farmer demonstrations', sub: '(On-farm plots)', icon: <Sprout size={16} />, base: 12, unit: 20000, reachPer: 50, ppPer: 0.75, color: '#1f6b2e', owner: 'Field Marketing', qty: (c) => `${c} demo plots`, qtySub: '(~50 farmers / plot)' },
  { key: 'retail', name: 'Retailer Activation', short: 'Retailer activation', sub: '(Training + PoS + Incentive)', icon: <Store size={16} />, base: 74, unit: 2700, reachPer: 1832 / 74, ppPer: 8 / 74, color: '#3f9d45', owner: 'Channel Marketing', qty: (c) => `${c} retailers`, qtySub: '(12 retailer clusters)' },
  { key: 'meet', name: 'Farmer Meetings', short: 'Farmer meetings', sub: '(Village level)', icon: <Users size={16} />, base: 32, unit: 5000, reachPer: 37.5, ppPer: 6 / 32, color: '#7cc35f', owner: 'Field Marketing', qty: (c) => `${c} meetings`, qtySub: '(~40 farmers each)' },
  { key: 'digital', name: 'Digital Advisory', short: 'Digital advisory', sub: '(WhatsApp/SMS/IVR)', icon: <Smartphone size={16} />, base: 1, unit: 80000, reachPer: 3000, ppPer: 3, color: '#c9b52f', owner: 'Digital Marketing', qty: (c) => `${c * 4} WhatsApp bursts`, qtySub: '(~3,000 farmers)' },
  { key: 'follow', name: 'Field Follow-ups', short: 'Field follow-ups', sub: '(Advisory + trial conversion)', icon: <UserCheck size={16} />, base: 8, unit: 10000, reachPer: 125, ppPer: 2.5 / 8, color: '#e8c13a', owner: 'Field Marketing', qty: (c) => `~${(c * 150).toLocaleString('en-IN')} follow-up visits`, qtySub: '(~2-3 per trial farmer)' },
  { key: 'cont', name: 'Contingency', short: 'Contingency', sub: '(Flex for high-potential villages)', icon: <Coins size={16} />, base: 1, unit: 40000, reachPer: 0, ppPer: 0.5, color: '#c9cfc6', owner: 'Regional Marketing', qty: () => 'Operational buffer', qtySub: '(multi-activity)' },
];

const BASE_LAKH: Record<ActivityKey, number> = Object.fromEntries(ACTIVITIES.map((a) => [a.key, (a.base * a.unit) / 1e5])) as Record<ActivityKey, number>;
const PP_PER_LAKH: Record<ActivityKey, number> = Object.fromEntries(ACTIVITIES.map((a) => [a.key, (a.ppPer * a.base) / BASE_LAKH[a.key]])) as Record<ActivityKey, number>;

type ScenarioId = 'cons' | 'base' | 'opt';
type ApprovalStatus = 'Draft for Approval' | 'Submitted for Approval' | 'Changes Requested' | 'Approved' | 'Sent Back';

interface AuditRow { [key: string]: unknown; when: string; user: string; action: string }

interface StudioState {
  counts: Record<ActivityKey, number>;
  sens: Record<ActivityKey, number> | null;
  rates: { reach: number; trial: number; adopt: number; repeat: number };
  scenario: ScenarioId;
  status: ApprovalStatus;
  audit: AuditRow[];
  optimizerApplied: boolean;
}

const initialCounts = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.base])) as Record<ActivityKey, number>;

let studio: StudioState = {
  counts: initialCounts,
  sens: null,
  rates: { reach: 90, trial: 40, adopt: 81, repeat: 80 },
  scenario: 'base',
  status: 'Draft for Approval',
  audit: [
    { when: '15 Dec 2026, 11:24 AM', user: 'Strategy Head', action: 'Scenario selected from S4.4 (Base Case, ROI 0.71×)' },
    { when: '15 Dec 2026, 10:41 AM', user: 'Strategy Head', action: 'Budget revised in S4.3 (₹8.0 Lakh; activity mix finalized)' },
    { when: '14 Dec 2026, 04:32 PM', user: 'Field Manager', action: 'Risk note added: moderate weather risk (Feb–Mar)' },
    { when: '14 Dec 2026, 03:10 PM', user: 'Strategy Head', action: 'Ready for approval draft created (CAMP-R26-AMB-014)' },
  ],
  optimizerApplied: false,
};
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const setStudio = (patch: Partial<StudioState> | ((s: StudioState) => Partial<StudioState>)) => {
  studio = { ...studio, ...(typeof patch === 'function' ? patch(studio) : patch) };
  listeners.forEach((fn) => fn());
};
const useStudio = () => useSyncExternalStore(subscribe, () => studio);

const stamp = () => {
  const d = new Date();
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};
const addAudit = (action: string, user = 'Strategy Head') =>
  setStudio((s) => ({ audit: [{ when: stamp(), user, action }, ...s.audit] }));

const inr = (n: number) => Math.round(n).toLocaleString('en-IN');
const lakh = (n: number) => n.toFixed(2);

function planOf(s: StudioState) {
  const rows = ACTIVITIES.map((a) => {
    const count = s.counts[a.key];
    const budget = (count * a.unit) / 1e5;
    return { def: a, count, budget, reach: Math.round(count * a.reachPer), pp: count * a.ppPer };
  });
  const total = rows.reduce((sum, r) => sum + r.budget, 0);
  const reach = rows.reduce((sum, r) => sum + r.reach, 0);
  const pp = rows.reduce((sum, r) => sum + r.pp, 0);
  const unique = Math.round((reach * 3600) / 7632 / 100) * 100;
  return { rows, total, reach, pp, unique, adopters: Math.round((pp / 100) * 3600), roi: 3.3 * (pp / 29) / (total / 8 || 1) };
}

function sensOf(s: StudioState): Record<ActivityKey, number> {
  if (s.sens) return s.sens;
  return Object.fromEntries(ACTIVITIES.map((a) => [a.key, Math.round(((s.counts[a.key] * a.unit) / 1e5) * 100) / 100])) as Record<ActivityKey, number>;
}

interface Outcome { adoptPct: number; reached: number; trialled: number; adopted: number; demand: number; revenue: number; contribution: number; spend: number; roi: number; reachPct: number; trialPct: number; adoptConv: number }

function outcomes(s: StudioState): Record<ScenarioId, Outcome> {
  const sens = sensOf(s);
  const spend = ACTIVITIES.reduce((sum, a) => sum + sens[a.key], 0);
  const mix = ACTIVITIES.reduce((sum, a) => sum + sens[a.key] * PP_PER_LAKH[a.key], 0) / 29;
  const { reach, trial, adopt } = s.rates;
  const reached = Math.min(1832, Math.round(1832 * (reach / 100) * mix));
  const trialled = Math.round(reached * (trial / 100));
  const adopted = Math.round(1832 * (reach / 100) * mix * (trial / 100) * (adopt / 100) * (532 / (1832 * 0.2916)));
  const contribution = (13.7 * adopted) / 532;
  const make = (o: Omit<Outcome, 'spend' | 'roi'>): Outcome => ({ ...o, spend, roi: (o.contribution - spend) / spend });
  return {
    base: make({ adoptPct: Math.round((adopted / 1832) * 100), reached, trialled, adopted, demand: Math.round(adopted * 0.393), revenue: (52 * adopted) / 532, contribution, reachPct: Math.round((reached / 1832) * 100), trialPct: trial, adoptConv: adopt }),
    cons: make({ adoptPct: 24, reached: 1557, trialled: 561, adopted: 440, demand: 176, revenue: 44, contribution: 11.0, reachPct: 85, trialPct: 36, adoptConv: 78 }),
    opt: make({ adoptPct: 33, reached: 1722, trialled: 723, adopted: 604, demand: 249, revenue: 62, contribution: 16.5, reachPct: 94, trialPct: 42, adoptConv: 84 }),
  };
}

const SCENARIO_LABEL: Record<ScenarioId, string> = { cons: 'Conservative', base: 'Base Case', opt: 'Optimistic' };

const WIZARD_STEPS = ['Campaign Setup', 'Target Market', 'Nutrition Programme', 'Activity Mix', 'Budget & Outcomes', 'Review & Submit'];

function useStepNav(current: number) {
  const { go, toast } = useNav();
  return (index: number) => {
    if (index === current) return;
    const target: ScreenId | null = index <= 2 ? 's4.2' : index === 3 ? 's4.3' : index === 4 ? 's4.4' : 's4.5';
    if (index === 1 || index === 2) toast(`${WIZARD_STEPS[index]} is pre-filled from S2.5 / S3.3 recommendations`);
    if (target) go(target);
  };
}

/* ------------------------------------------------------------------ */
/* S4.1 Campaign Portfolio & Template Library                          */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tagTone: Tone;
  audience: string;
  channels: string;
  foot: string;
  footTone: Tone;
  icon: ReactNode;
  recommended?: boolean;
  geo: string;
  cohort: string;
  window: string;
  programme: string;
  note: string;
}

const TEMPLATES: Template[] = [
  { id: 'crop-stage', title: 'Crop-Stage Awareness', desc: 'Engage farmers approaching priority crop nutrition windows with approved guidance.', tag: '★ Recommended from S3.4', tagTone: 'green', audience: 'Conventional NPK onion farmers', channels: 'Farmer education · Retailer meetings · Advisory', foot: 'Agronomy sign-off required', footTone: 'amber', icon: <Clock size={16} />, recommended: true, geo: 'Onion · Ambad / Jalna', cohort: 'Conventional NPK farmers', window: '21 Feb – 4 Mar 2027', programme: 'Croptek Onion · Draft', note: 'Agronomy and advisory-content approvals pending. Create as draft; publish only after checks.' },
  { id: 'retailer', title: 'Retailer-Led Conversion', desc: 'Build adoption through influential retailers and locally relevant value propositions.', tag: 'Conversion', tagTone: 'blue', audience: 'Conventional product users', channels: 'Retailer activation · Farmer meetings · Demos', foot: 'Channel-led', footTone: 'blue', icon: <Store size={16} />, recommended: true, geo: 'Onion · Ambad / Jalna', cohort: '1,832 conventional NPK users', window: '15 Dec 2026 – 15 Mar 2027', programme: 'Croptek Onion · Approved', note: 'Recommended in S2.5 for Ambad; 18 high-influence retailers identified in S2.4.' },
  { id: 'repeat', title: 'Trial-to-Repeat Adoption', desc: 'Help previously engaged farmers progress from initial trial to repeat adoption.', tag: 'Retention', tagTone: 'purple', audience: 'Existing trial farmers', channels: 'Field follow-ups · Consented advisory', foot: 'Lifecycle-led', footTone: 'purple', icon: <RefreshCw size={16} />, recommended: true, geo: 'Onion · Pimpalgaon', cohort: 'Trial farmers (Kharif 2026)', window: '1 Jan – 31 Mar 2027', programme: 'Croptek Onion · Planned', note: 'Requires consented contact list; follow-up cadence of 2–3 visits per farmer.' },
  { id: 'champion', title: 'Retailer Champion Activation', desc: 'Equip high-influence retailers with stock, PoS and incentive to champion the product.', tag: 'Channel', tagTone: 'blue', audience: 'High-influence retailers', channels: 'Retailer training · PoS · Incentive', foot: 'Channel-led', footTone: 'blue', icon: <Megaphone size={16} />, geo: 'Onion · Jalna', cohort: '18 high-influence retailers', window: '1 Dec 2026 – 31 Jan 2027', programme: 'Retailer programme · Draft', note: 'Stock readiness to be confirmed in S5.3 before launch.' },
  { id: 'advisory', title: 'Stage-wise Digital Advisory', desc: 'Deliver crop-stage nutrition advisories over WhatsApp, SMS and IVR to consented farmers.', tag: 'Awareness', tagTone: 'lime', audience: 'Consented farmers', channels: 'WhatsApp · SMS · IVR', foot: 'Digital-led', footTone: 'lime', icon: <Smartphone size={16} />, geo: 'Onion · Ambad / Jalna', cohort: '~3,000 consented farmers', window: 'Nov 2026 – Mar 2027', programme: 'Advisory calendar · Draft', note: 'Advisory content needs agronomy sign-off before each burst.' },
];
const SAVED_TEMPLATES = ['crop-stage', 'retailer'];

type PortfolioRow = { name: string; geo: string; objective: string; status: string; tone: Tone; owner: string; next: string; to: ScreenId };

const PORTFOLIO: PortfolioRow[] = [
  { name: 'Croptek Onion Conversion — Ambad', geo: 'Ambad, Jalna', objective: 'Product adoption', status: 'Approved · Supply Planning', tone: 'green', owner: 'Regional Marketing', next: 'View Campaign', to: 's4.5' },
  { name: 'Onion Bulb Initiation Awareness', geo: 'Ambad / Jalna', objective: 'Crop-stage awareness', status: 'Draft · Agronomy Pending', tone: 'amber', owner: 'Crop Lead', next: 'Resume Draft', to: 's4.2' },
  { name: 'Retailer Champion Activation*', geo: 'Jalna', objective: 'Retailer conversion', status: 'Awaiting Review', tone: 'blue', owner: 'Trade Marketing', next: 'Review', to: 's4.5' },
  { name: 'Trial Farmer Nurturing*', geo: 'Pimpalgaon', objective: 'Repeat adoption', status: 'Planned', tone: 'grey', owner: 'Field Marketing', next: 'Open Plan', to: 's4.3' },
];

export function TemplateLibrary() {
  const { go, toast } = useNav();
  const [tab, setTab] = useState<'rec' | 'all' | 'saved'>('rec');
  const [selected, setSelected] = useState('crop-stage');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('updated');
  const visible = TEMPLATES.filter((t) => (tab === 'rec' ? t.recommended : tab === 'saved' ? SAVED_TEMPLATES.includes(t.id) : true));
  const sel = TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[0];
  const rows = PORTFOLIO
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.geo.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => statusFilter === 'All' || r.status.startsWith(statusFilter))
    .slice()
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : 0));

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'Campaign Strategy Studio', to: 's4.1' }, { label: 'S4.1 Campaign Portfolio & Template Library' }]} />
      <PageHeader
        title="Campaign Portfolio & Template Library"
        subtitle="Manage campaigns, resume drafts and start new crop nutrition campaigns using recommended templates."
        actions={<>
          <Btn icon={<FileBarChart size={14} />} to="s7.1">Campaign Reports</Btn>
          <Btn variant="primary" icon={<Plus size={14} />} to="s4.2">Create New Campaign</Btn>
        </>}
      />
      <SourceBar right="S3.4 recommendations can also open S4.2 directly · Illustrative workspace">✓ Source: Campaign Strategy Studio → Campaign Portfolio &amp; Templates</SourceBar>
      <KpiRow className="s4-kpi-big">
        <Kpi icon={<LayoutList size={18} />} label="Campaigns in Portfolio" value="04" sub="Across selected crop, region and season" />
        <Kpi icon={<CheckCircle2 size={18} />} label="Approved Campaign" value="01" sub="Croptek Onion Conversion — Ambad" />
        <Kpi icon={<Clock size={18} />} tone="amber" label="Draft / Awaiting Review" value="02" sub="Require campaign-manager attention" />
      </KpiRow>
      <Grid cols="3.2fr 1fr">
        <Panel
          title="Recommended Campaign Templates"
          actions={<div className="tabs" style={{ marginBottom: 0, borderBottom: 0 }}>
            {([['rec', 'Recommended'], ['all', 'All Templates'], ['saved', 'Saved Templates']] as const).map(([id, label]) => (
              <button key={id} type="button" className={cx('tab', tab === id && 'active')} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>}
        >
          <div className="s4-tpl-grid">
            {visible.map((t) => (
              <div key={t.id} className={cx('s4-tpl', selected === t.id && 'selected')} onClick={() => setSelected(t.id)}>
                <div className="row-between">
                  <span className="s4-tpl-icon">{t.icon}</span>
                  <Pill tone={t.tagTone}>{t.tag}</Pill>
                </div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
                <dl className="kv"><dt>Audience</dt><dd>{t.audience}</dd><dt>Channels</dt><dd>{t.channels}</dd></dl>
                <div className="s4-tpl-foot">
                  <Pill tone={t.footTone}>{t.foot}</Pill>
                  <Btn small variant={selected === t.id ? 'primary' : 'outline'} onClick={() => { setSelected(t.id); toast(`Template "${t.title}" selected`); }}>
                    {selected === t.id ? 'Selected ✓' : 'Use Template →'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Selected Template" actions={<Pill>Selected</Pill>} className="ai-panel">
          <div className="stack">
            <div className="highlight-box">
              <strong>{sel.title}</strong>
              <div className="small muted">{sel.recommended ? 'AI-recommended from S3.4 Campaign Trigger Engine' : 'From template library'}</div>
            </div>
            <dl className="kv">
              <dt>Crop / Geography</dt><dd>{sel.geo}</dd>
              <dt>Primary Cohort</dt><dd>{sel.cohort}</dd>
              <dt>Activation Window</dt><dd>{sel.window}</dd>
              <dt>Current Programme</dt><dd>{sel.programme}</dd>
            </dl>
            <div className="warn-box small">◷ {sel.note}</div>
            <Btn variant="primary" to="s4.2" onClick={() => toast(`Creating campaign from "${sel.title}"`)}>Create Campaign from Template → S4.2</Btn>
          </div>
        </Panel>
      </Grid>
      <Panel
        title="Campaign Portfolio & Drafts"
        actions={<div className="s4-filter">
          <Search size={13} className="muted" />
          <input placeholder="Search campaigns" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {['All', 'Approved', 'Draft', 'Awaiting Review', 'Planned'].map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Sort: Updated recently</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>}
      >
        <DataTable<PortfolioRow>
          columns={[
            { key: 'name', label: 'CAMPAIGN', render: (r) => <strong>{r.name}</strong> },
            { key: 'geo', label: 'GEOGRAPHY' },
            { key: 'objective', label: 'OBJECTIVE' },
            { key: 'status', label: 'STATUS', render: (r) => <Pill tone={r.tone}>{r.status}</Pill> },
            { key: 'owner', label: 'OWNER' },
            { key: 'next', label: 'NEXT ACTION', render: (r) => <button type="button" className="s4-link" onClick={(e) => { e.stopPropagation(); go(r.to); }}>{r.next} →</button> },
          ]}
          rows={rows}
          onRowClick={(r) => go(r.to)}
        />
        {rows.length === 0 && <Note>No campaigns match the current search / filter.</Note>}
      </Panel>
      <Note>* Illustrative records and dates; approval controls remain in S4.5.</Note>
      <FlowFooter
        label="Navigation:"
        steps={[{ label: 'Campaign Strategy Studio' }, { label: 'S4.1 Portfolio & Templates (Current)', current: true }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' }]}
        next={{ label: 'Create Campaign → S4.2', to: 's4.2' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S4.2 Campaign Creation Wizard                                       */
/* ------------------------------------------------------------------ */

const BARRIERS = [
  { label: 'Higher price perception', value: 42, tone: 'green' as Tone },
  { label: 'Satisfaction with current brand', value: 28, tone: 'green' as Tone },
  { label: 'Low awareness of benefits', value: 16, tone: 'lime' as Tone },
  { label: 'Limited availability', value: 9, tone: 'lime' as Tone },
  { label: 'No immediate need', value: 5, tone: 'grey' as Tone },
];

export function CreationWizard() {
  const { go, toast } = useNav();
  const stepNav = useStepNav(0);
  const [form, setForm] = useState({
    name: 'Croptek Onion Conversion – Ambad',
    owner: 'Regional Marketing – Maharashtra',
    objective: 'Competitive conversion and farmer adoption',
    type: 'Adoption (Conversion)',
    strategy: 'Retailer-led Croptek conversion supported by demonstrations',
    start: '2026-12-15',
    end: '2027-03-15',
  });
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const farmers = (primary ? 1832 : 0) + (secondary ? 1061 : 0);
  const acres = (primary ? 760 : 0) + (secondary ? 460 : 0);
  const durationOk = form.start < form.end;
  const segmentsOk = (primary || secondary) && form.name.trim().length > 0;
  const days = Math.round((new Date(form.end).getTime() - new Date(form.start).getTime()) / 86400000);

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard' }]} />
      <PageHeader back="s2.5" title="Campaign Creation Wizard" subtitle="Configure a targeted campaign based on recommended strategy for Croptek (Onion) in Ambad, Jalna" />
      <SourceBar>
        <strong>Source Click:</strong> S2.5 Opportunity Prioritization &amp; Campaign Recommendations → Create Campaign
      </SourceBar>
      <Stepper steps={WIZARD_STEPS} active={0} onSelect={stepNav} />
      <Grid cols="2.6fr 1fr">
        <div className="stack">
          <Panel title="Campaign Setup – Basic Details" icon={<FileText size={16} />}>
            <Grid cols="1.9fr 1fr" gap={16}>
              <div className="s4-form">
                <label className="field">Campaign Name *<input value={form.name} onChange={set('name')} /></label>
                <label className="field">Campaign Owner *
                  <select value={form.owner} onChange={set('owner')}>
                    {['Regional Marketing – Maharashtra', 'Trade Marketing – Jalna', 'Field Marketing – Ambad'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="field">Campaign Objective *
                  <select value={form.objective} onChange={set('objective')}>
                    {['Competitive conversion and farmer adoption', 'Crop-stage awareness', 'Trial-to-repeat adoption', 'Retailer conversion'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="field">Campaign Type *
                  <select value={form.type} onChange={set('type')}>
                    {['Adoption (Conversion)', 'Awareness', 'Retention', 'Channel Activation'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <div className="field">Recommended Strategy
                  <div className="s4-strategy">
                    <Target size={18} color={COLORS.green} />
                    <select value={form.strategy} onChange={set('strategy')}>
                      {['Retailer-led Croptek conversion supported by demonstrations', 'Demonstration-led farmer conversion', 'Digital advisory-led awareness'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">Campaign Duration *
                  <div className="s4-dates">
                    <CalendarDays size={15} />
                    <input type="date" value={form.start} onChange={set('start')} />
                    <span>–</span>
                    <input type="date" value={form.end} onChange={set('end')} />
                  </div>
                  <span className={cx('small', durationOk ? 'muted' : '')} style={durationOk ? undefined : { color: COLORS.red }}>
                    {durationOk ? `${days} days · covers Pre-plant → Maturity` : 'End date must be after start date'}
                  </span>
                </div>
              </div>
              <div>
                <div className="row" style={{ marginBottom: 8 }}><Target size={15} color={COLORS.green} /><strong className="small">Key Business Context (Ambad, Jalna)</strong></div>
                <div className="s4-ctx">
                  <div className="s4-ctx-row"><IndianRupee size={15} /><span>Market Opportunity</span><strong>₹52 Lakh</strong></div>
                  <div className="s4-ctx-row"><BarChart3 size={15} /><span>Current Penetration</span><strong>34%</strong></div>
                  <div className="s4-ctx-row hl"><TrendingUp size={15} /><span>Penetration Gap</span><strong>28 pp</strong></div>
                  <div className="s4-ctx-row"><Store size={15} /><span>Active Retailers</span><strong>74</strong></div>
                  <div className="s4-ctx-row"><Users size={15} /><span>Priority Farmer Cohort<br /><small className="muted">(Conventional NPK Users)</small></span><strong>1,832</strong></div>
                </div>
              </div>
            </Grid>
          </Panel>
          <Grid cols="1.1fr 1fr">
            <Panel title={<>Target Audience <span className="muted small">(Pre-filled from S2.5)</span></>} icon={<Users size={16} />}>
              <div className="s4-cohort s4-cohort-head"><span /><span /><span>No. of Farmers</span><span>Estimated Acreage</span></div>
              <label className="s4-cohort">
                <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
                <span><strong>Primary Cohort – Conventional NPK Users</strong><small>High conversion potential; focus for retailer-led intervention</small></span>
                <strong>1,832</strong><strong>760 Acres</strong>
              </label>
              <label className="s4-cohort">
                <input type="checkbox" checked={secondary} onChange={(e) => setSecondary(e.target.checked)} />
                <span><strong>Secondary Cohorts</strong><small>Non-users and Trial Users (nurture and convert)</small></span>
                <strong>1,061</strong><strong>460 Acres</strong>
              </label>
              <div className="s4-cohort" style={{ borderBottom: 0, background: '#f1f8ea', borderRadius: 6, padding: '8px 4px' }}>
                <span /><strong>Selected target audience</strong><strong>{inr(farmers)}</strong><strong>{inr(acres)} Acres</strong>
              </div>
            </Panel>
            <Panel title={<>Key Adoption Barriers <span className="muted small">(from S2.4)</span></>} icon={<AlertTriangle size={16} />}>
              <HBars rows={BARRIERS} max={45} valueSuffix="%" />
            </Panel>
          </Grid>
        </div>
        <div className="stack">
          <Panel title="AI Campaign Planning Assistant" icon={<Sparkles size={16} />} className="ai-panel">
            <AiItem icon={<Bot size={16} />}>
              A retailer-led conversion campaign in Ambad is recommended to drive rapid adoption of Croptek, backed by demonstrations to address price and brand-related barriers.
            </AiItem>
            <div className="row" style={{ margin: '10px 0 6px' }}><Target size={15} color={COLORS.green} /><strong className="small">Key Recommendations</strong></div>
            <Check status="done">Target 1,832 conventional NPK users across ~10 priority villages.</Check>
            <Check status="done">Activate 18 high-influence retailers for conversion.</Check>
            <Check status="done">Run 12–15 demonstration plots to build product confidence.</Check>
            <Check status="done">Deploy stage-wise advisory and follow-ups for trial users.</Check>
          </Panel>
          <Panel title="Readiness Check" icon={<ClipboardCheck size={16} />}>
            {[
              ['Market & target segments selected', segmentsOk],
              ['Retailer readiness (46/74 stocking Croptek)', true],
              ['Budget availability (₹8 Lakh proposed)', true],
              ['Campaign duration defined', durationOk],
            ].map(([label, ok]) => (
              <div key={label as string} className="row-between small" style={{ padding: '4px 0' }}>
                <span>{label}</span>
                <Pill tone={ok ? 'green' : 'red'}>{ok ? '✓ Complete' : '! Incomplete'}</Pill>
              </div>
            ))}
          </Panel>
          <div className="s4-roi"><span className="row"><BarChart3 size={18} color={COLORS.green} /> Expected Campaign ROI:</span><strong>3.3×</strong></div>
        </div>
      </Grid>
      <div className="s4-actionbar">
        <Btn icon={<Save size={14} />} onClick={() => toast(`Draft "${form.name}" saved`)}>Save as Draft</Btn>
        <Btn variant="primary" disabled={!segmentsOk || !durationOk} onClick={() => go('s4.3')}>Configure Activity Mix →</Btn>
      </div>
      <FlowFooter
        steps={[{ label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard (Current)', current: true }]}
        next={{ label: 'S4.3 Activity & Channel Mix Planner', to: 's4.3' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S4.3 Activity & Channel Mix Planner                                 */
/* ------------------------------------------------------------------ */

const GANTT_MONTHS = ['Nov (Pre-plant)', 'Dec (Vegetative)', 'Jan (Leaf growth)', 'Feb (Bulb development)', 'Mar (Maturity)'];
const GANTT_ROWS: { label: string; icon: ReactNode; bars: { left: number; width: number; text: string; color: string }[] }[] = [
  { label: 'Retailer Activation', icon: <Store size={13} />, bars: [{ left: 8, width: 30, text: 'Training & stocking', color: '#3f9d45' }] },
  { label: 'Farmer Demonstrations', icon: <Sprout size={13} />, bars: [{ left: 30, width: 16, text: 'Plot setup', color: '#1f6b2e' }, { left: 48, width: 50, text: 'Demonstration & field days', color: '#7cc35f' }] },
  { label: 'Farmer Meetings', icon: <Users size={13} />, bars: [{ left: 24, width: 52, text: 'Village meetings (cluster-wise)', color: '#4c9f43' }] },
  { label: 'Digital Advisory', icon: <Smartphone size={13} />, bars: [{ left: 18, width: 80, text: 'Stage-wise nutrition & application advisories (continuous) →', color: '#76b84f' }] },
  { label: 'Field Follow-ups', icon: <UserCheck size={13} />, bars: [{ left: 40, width: 58, text: 'Trial monitoring & conversion follow-ups', color: '#5fae4c' }] },
];

function Gantt({ months, rows }: { months: string[]; rows: typeof GANTT_ROWS }) {
  return (
    <div className="wide-scroll">
    <div className="gantt gantt-labelled">
      <div className="gantt-head">
        <span>Activity / Channel</span>
        <div className="gantt-months" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>{months.map((m) => <span key={m}>{m}</span>)}</div>
      </div>
      {rows.map((r) => (
        <div className="gantt-row" key={r.label}>
          <span className="row" style={{ gap: 6 }}><span style={{ color: COLORS.green, display: 'inline-flex' }}>{r.icon}</span>{r.label}</span>
          <div className="gantt-track">
            {r.bars.map((b) => <div key={b.text} className="gantt-bar" data-tip={`${r.label}: ${b.text}`} style={{ left: `${b.left}%`, width: `${b.width}%`, background: b.color }}>{b.text}</div>)}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

type PlanRow = { [key: string]: unknown; idx: number; key: ActivityKey; count: number; budget: number; reach: number; pp: number };

export function ActivityMixPlanner() {
  const { toast } = useNav();
  const s = useStudio();
  const stepNav = useStepNav(3);
  const [editing, setEditing] = useState(true);
  const plan = useMemo(() => planOf(s), [s]);
  const setCount = (key: ActivityKey, value: number) =>
    setStudio((st) => ({ counts: { ...st.counts, [key]: Math.max(0, Math.min(999, Math.round(value) || 0)) }, sens: null }));
  const def = (key: ActivityKey) => ACTIVITIES.find((a) => a.key === key)!;
  const rows: PlanRow[] = plan.rows.map((r, i) => ({ idx: i + 1, key: r.def.key, count: r.count, budget: r.budget, reach: r.reach, pp: r.pp }));
  const overBudget = plan.total > 8.0001;
  const canApply = !s.optimizerApplied && s.counts.cont >= 1;
  const applySuggestion = () => {
    setStudio((st) => ({ counts: { ...st.counts, cont: st.counts.cont - 1, demo: st.counts.demo + 2 }, optimizerApplied: true, sens: null }));
    addAudit('AI mix optimizer applied in S4.3: ₹0.40 L contingency → 2 demo plots');
    toast('Reallocated ₹0.40 L from Contingency to 2 additional demo plots');
  };
  const eff = plan.rows.filter((r) => r.def.key !== 'cont');
  const effOrder: ActivityKey[] = ['demo', 'retail', 'meet', 'follow', 'digital'];

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' }, { label: 'S4.3 Activity & Channel Mix Planner' }]} />
      <PageHeader back="s4.2" title="Activity & Channel Mix Planner" subtitle="Design and optimize the intervention mix, budget and execution plan for Croptek (Onion) adoption in Ambad, Jalna" />
      <SourceBar><strong>Source Click:</strong> S4.2 Campaign Creation Wizard → Configure Activity Mix</SourceBar>
      <Stepper steps={WIZARD_STEPS} active={3} onSelect={stepNav} />
      <ContextStrip items={[
        { icon: <Target size={20} />, label: 'Campaign', value: 'Croptek Onion Conversion – Ambad' },
        { icon: <Users size={20} />, label: 'Target Farmers', value: '1,832', sub: '(Conventional NPK Users)' },
        { icon: <Coins size={20} />, label: 'Market Opportunity', value: '₹52 Lakh' },
        { icon: <IndianRupee size={20} />, label: 'Total Campaign Budget', value: `₹${lakh(plan.total)} Lakh`, tone: overBudget ? 'red' : undefined },
        { icon: <BarChart3 size={20} />, label: 'Expected Adoption', value: `${inr(plan.adopters)} (${Math.round(plan.pp)}%)` },
        { icon: <TrendingUp size={20} />, label: 'Projected ROI', value: `${plan.roi.toFixed(1)}×` },
      ]} />
      <Grid cols="1.25fr 1fr">
        <div className="stack">
          <Panel title="Activity Configuration & Budget Allocation" icon={<Pencil size={15} />}
            actions={<Btn small icon={<Pencil size={12} />} variant={editing ? 'primary' : 'outline'} onClick={() => setEditing((e) => !e)}>{editing ? 'Lock Allocation' : 'Edit Allocation'}</Btn>}>
            <DataTable<PlanRow>
              compact
              columns={[
                { key: 'idx', label: '#' },
                { key: 'key', label: 'Activity / Channel', render: (r) => <div className="s4-act">{def(r.key).icon}<div><strong>{def(r.key).name}</strong><small>{def(r.key).sub}</small></div></div> },
                { key: 'count', label: 'Planned Count (editable)', align: 'center', render: (r) => editing ? (
                  <span className="stepper-input">
                    <button type="button" aria-label="decrease" onClick={() => setCount(r.key, r.count - 1)}><Minus size={11} /></button>
                    <input value={r.count} onChange={(e) => setCount(r.key, Number(e.target.value))} />
                    <button type="button" aria-label="increase" onClick={() => setCount(r.key, r.count + 1)}><Plus size={11} /></button>
                  </span>
                ) : <strong>{r.count}</strong> },
                { key: 'unit', label: 'Unit Cost (₹)', align: 'right', render: (r) => inr(def(r.key).unit) },
                { key: 'budget', label: 'Allocated Budget (₹ Lakh)', align: 'right', render: (r) => <strong>{lakh(r.budget)}</strong> },
                { key: 'share', label: 'Budget Share', align: 'right', render: (r) => `${plan.total ? Math.round((r.budget / plan.total) * 100) : 0}%` },
                { key: 'reach', label: 'Expected Farmer Reach', align: 'right', render: (r) => (r.key === 'cont' ? '–' : inr(r.reach)) },
                { key: 'pp', label: 'Adoption Contribution', align: 'right', render: (r) => `${r.pp.toFixed(1)} pp` },
              ]}
              rows={rows}
              total={{ key: 'Total Campaign Budget', budget: <span style={overBudget ? { color: COLORS.red } : undefined}>₹{lakh(plan.total)} Lakh</span>, share: '100%', reach: `~${inr(plan.unique)}*`, pp: `${plan.pp.toFixed(1)} pp` }}
            />
            <Note>*Unique reach (after de-duplication): ~{inr(plan.unique)} farmers. Approved budget envelope: ₹8.00 Lakh{overBudget ? ` — currently over by ₹${lakh(plan.total - 8)} L` : ''}.</Note>
          </Panel>
          <Panel title="Crop-Stage Campaign Calendar – Onion (Ambad)" icon={<BarChart3 size={15} />}>
            <Gantt months={GANTT_MONTHS} rows={GANTT_ROWS} />
          </Panel>
        </div>
        <div className="stack">
          <Grid cols="1.1fr 1fr">
            <div className="stack">
              <Panel title={`Budget Mix – ₹${lakh(plan.total)} Lakh`} icon={<Wallet size={15} />}>
                <Donut
                  size={160}
                  center={`₹${lakh(plan.total)}`}
                  sub="Lakh"
                  segments={plan.rows.filter((r) => r.budget > 0).map((r) => ({
                    label: r.def.name,
                    value: r.budget,
                    color: r.def.color,
                    note: `₹${lakh(r.budget)} L (${Math.round((r.budget / plan.total) * 100)}%)`,
                  }))}
                />
              </Panel>
              <Panel title={<>Channel Effectiveness <span className="muted small">(Estimated)</span></>} icon={<GitBranch size={15} />}>
                <DataTable<{ [key: string]: unknown; key: ActivityKey; cost: number; pp: number }>
                  compact
                  columns={[
                    { key: 'key', label: 'Channel', render: (r) => def(r.key).name.replace('Farmer Demonstrations', 'Demonstration') },
                    { key: 'cost', label: 'Cost / Farmer (₹)', align: 'right', render: (r) => inr(r.cost) },
                    { key: 'pp', label: 'Conversion Uplift (pp)', align: 'right', render: (r) => r.pp.toFixed(1) },
                    { key: 'eff', label: 'Relative Effectiveness', render: (r) => <div className="progress" style={{ height: 8, width: 70 }}><div className="progress-fill fill-green" style={{ width: `${Math.min(100, (r.pp / 9) * 100)}%` }} /></div> },
                  ]}
                  rows={effOrder.map((k) => {
                    const r = eff.find((x) => x.def.key === k)!;
                    return { key: k, cost: r.reach ? (r.budget * 1e5) / r.reach : 0, pp: r.pp };
                  })}
                />
              </Panel>
            </div>
            <div className="stack">
              <Panel title="AI Campaign Mix Optimizer" icon={<Sparkles size={15} />} className="ai-panel">
                <AiItem icon={<Bot size={16} />} action={<Btn small variant="primary" disabled={!canApply} onClick={applySuggestion}>{s.optimizerApplied ? 'Applied ✓' : 'Apply'}</Btn>}>
                  {s.optimizerApplied
                    ? 'Suggestion applied: ₹0.40 L moved from Contingency to 2 additional demo plots (+100 farmers reach, +1.0 pp adoption).'
                    : 'Current plan is well-balanced. Consider reallocating ₹0.40 L from Contingency to 2 additional demo plots (+100 farmers reach, +1.0 pp adoption potential).'}
                </AiItem>
                <div className="row" style={{ margin: '10px 0 6px' }}><Target size={15} color={COLORS.green} /><strong className="small">Key Recommendations</strong></div>
                <Check status="done">Increase demonstrations to 14 (focus on high-potential villages Golegaon, Dhanora).</Check>
                <Check status="done">Prioritize retailer activation for 18 high-influence retailers.</Check>
                <Check status="done">Run stage-wise digital advisory (bulb development to maturity).</Check>
              </Panel>
              <Panel title="Campaign Readiness & Validation" icon={<ClipboardCheck size={15} />}>
                {[
                  [`Budget allocation (₹${lakh(plan.total)} L)`, overBudget ? 'Over limit' : 'Within limit', !overBudget],
                  ['Resource capacity (8 FOs, 74 retailers)', s.counts.demo + s.counts.meet > 60 ? 'Stretched' : 'Adequate', s.counts.demo + s.counts.meet <= 60],
                  ['Activity timing & crop stage alignment', 'Aligned', true],
                  [`Target coverage (≥3,000 reach)`, plan.unique >= 3000 ? 'Feasible' : 'Below target', plan.unique >= 3000],
                  [`Expected adoption (≥29%)`, plan.pp >= 29 ? 'Achievable' : 'At risk', plan.pp >= 29],
                ].map(([label, status, ok]) => (
                  <div key={label as string} className="row-between small" style={{ padding: '4px 0' }}>
                    <span>{label}</span>
                    <Pill tone={ok ? 'green' : 'amber'}>{ok ? '✓' : '!'} {status}</Pill>
                  </div>
                ))}
              </Panel>
            </div>
          </Grid>
          <Panel title="Resource Allocation & Coverage" icon={<Users size={15} />}>
            <div className="s4-res">
              <div><UserCheck size={26} /><span><strong>8</strong>Field Officers (FOs)</span></div>
              <div><Store size={26} /><span><strong>{s.counts.retail}</strong>Retailers ({Math.min(46, s.counts.retail)} stocking)</span></div>
              <div><Sprout size={26} /><span><strong>{s.counts.demo}</strong>Demo Plots ({inr((s.counts.demo * 760) / 12)} Acres)</span></div>
              <div><MapPin size={26} /><span><strong>10</strong>Target Villages</span></div>
            </div>
          </Panel>
        </div>
      </Grid>
      <div className="s4-actionbar">
        <Btn icon={<Save size={14} />} onClick={() => toast('Activity mix saved to draft')}>Save Draft</Btn>
        <Btn variant="primary" to="s4.4">Simulate Campaign Outcomes →</Btn>
      </div>
      <FlowFooter
        steps={[{ label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' }, { label: 'S4.3 Activity & Channel Mix Planner (Current)', current: true }]}
        next={{ label: 'Simulate Campaign Outcomes', to: 's4.4', sub: 'S4.4 Campaign Scenario Simulator' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S4.4 Campaign Scenario Simulator                                    */
/* ------------------------------------------------------------------ */

function ScenarioCard({ id, o, selected, onSelect }: { id: ScenarioId; o: Outcome; selected: boolean; onSelect: () => void }) {
  return (
    <label className={cx('s4-scen-card', selected && 'selected')}>
      <header>
        <input type="radio" name="s4-scenario" checked={selected} onChange={onSelect} />
        {SCENARIO_LABEL[id]}{id === 'base' && <span className="small" style={{ fontWeight: 500 }}> (Recommended)</span>}
      </header>
      <dl className="kv">
        <dt>Adoption (of 1,832)</dt><dd>{o.adoptPct}% ({inr(o.adopted)})</dd>
        <dt>Incremental Demand</dt><dd>{inr(o.demand)} MT</dd>
        <dt>Incremental Revenue</dt><dd>₹{Math.round(o.revenue)} Lakh</dd>
        <dt>Contribution</dt><dd>₹{o.contribution.toFixed(1)} Lakh</dd>
        <dt><strong>Net ROI</strong></dt><dd><strong>{o.roi.toFixed(2)}×</strong></dd>
      </dl>
    </label>
  );
}

export function ScenarioSimulator() {
  const { toast } = useNav();
  const s = useStudio();
  const out = useMemo(() => outcomes(s), [s]);
  const sens = sensOf(s);
  const sel = out[s.scenario];
  const setRate = (key: keyof StudioState['rates'], value: number) => setStudio((st) => ({ rates: { ...st.rates, [key]: value }, scenario: 'base' }));
  const adjust = (key: ActivityKey, delta: number) =>
    setStudio((st) => {
      const cur = sensOf(st);
      return { sens: { ...cur, [key]: Math.max(0, Math.round((cur[key] + delta) * 100) / 100) } };
    });
  const planBudget = (a: ActivityDef) => (s.counts[a.key] * a.unit) / 1e5;
  const repeatBuyers = Math.round(sel.adopted * (s.rates.repeat / 100));
  const rateRows: [keyof StudioState['rates'], string][] = [
    ['reach', 'Farmer Reach (of 1,832)'], ['trial', 'Trial Conversion (of Reached)'], ['adopt', 'Adoption Conversion (of Trial)'], ['repeat', 'Repeat Intent (of Adopters)'],
  ];

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
        { label: 'S4.3 Activity & Channel Mix Planner', to: 's4.3' }, { label: 'S4.4 Campaign Scenario Simulator' },
      ]} />
      <PageHeader back="s4.3" title="Campaign Scenario Simulator" subtitle="Simulate and compare campaign outcomes by adjusting assumptions and activity mix for Croptek (Onion) in Ambad, Jalna" />
      <SourceBar><strong>Source Click:</strong> S4.3 Activity &amp; Channel Mix Planner → Simulate Campaign Outcomes</SourceBar>
      <ContextStrip items={[
        { icon: <Target size={20} />, label: 'Campaign', value: 'Croptek Onion Conversion – Ambad' },
        { icon: <MapPin size={20} />, label: 'Geography', value: 'Ambad, Jalna', sub: 'Maharashtra' },
        { icon: <Users size={20} />, label: 'Target Farmers', value: '1,832', sub: '(Conventional NPK Users)' },
        { icon: <Coins size={20} />, label: 'Market Opportunity', value: '₹52 Lakh' },
        { icon: <IndianRupee size={20} />, label: 'Campaign Budget', value: `₹${lakh(sel.spend)} Lakh` },
        { icon: <CalendarDays size={20} />, label: 'Campaign Period', value: '15 Dec 2026 – 15 Mar 2027' },
      ]} />
      <Grid cols="1fr 1.55fr 1fr">
        <div className="stack">
          <Panel title={<>Conversion Assumptions <span className="muted small">(Editable)</span></>} icon={<SlidersHorizontal size={15} />} info
            actions={<Btn small variant="ghost" icon={<RotateCcw size={12} />} onClick={() => setStudio({ rates: { reach: 90, trial: 40, adopt: 81, repeat: 80 } })}>Reset</Btn>}>
            {rateRows.map(([key, label]) => (
              <div className="slider-row" key={key}>
                <span>{label}</span>
                <input type="range" min={10} max={100} value={s.rates[key]} onChange={(e) => setRate(key, Number(e.target.value))} />
                <strong className="code-chip" style={{ textAlign: 'center' }}>{s.rates[key]} %</strong>
              </div>
            ))}
          </Panel>
          <Panel title="Activity Mix Sensitivity" icon={<Sparkles size={15} />} info
            actions={<Btn small variant="ghost" icon={<RotateCcw size={12} />} onClick={() => setStudio({ sens: null })}>Reset</Btn>}>
            <div className="s4-sens s4-sens-head"><span>Activity / Channel</span><span style={{ textAlign: 'right' }}>Current Plan (₹ Lakh)</span><span style={{ textAlign: 'center' }}>Adjust (₹ Lakh)</span></div>
            {ACTIVITIES.map((a) => (
              <div className="s4-sens" key={a.key}>
                <span className="s4-act">{a.icon}{a.name}</span>
                <span style={{ textAlign: 'right' }}>{lakh(planBudget(a))}</span>
                <span className="stepper-input" style={{ justifySelf: 'center' }}>
                  <button type="button" aria-label="decrease" onClick={() => adjust(a.key, -0.1)}><Minus size={11} /></button>
                  <input readOnly value={lakh(sens[a.key])} />
                  <button type="button" aria-label="increase" onClick={() => adjust(a.key, 0.1)}><Plus size={11} /></button>
                </span>
              </div>
            ))}
            <div className="s4-sens s4-sens-total"><span>Total Campaign Budget</span><span /><span style={{ textAlign: 'center' }}>₹{lakh(sel.spend)} Lakh</span></div>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Scenario Comparison – Expected Outcomes" icon={<BarChart3 size={15} />}>
            <div className="s4-scen">
              {(['cons', 'base', 'opt'] as ScenarioId[]).map((id) => (
                <ScenarioCard key={id} id={id} o={out[id]} selected={s.scenario === id} onSelect={() => { setStudio({ scenario: id }); toast(`${SCENARIO_LABEL[id]} scenario selected`); }} />
              ))}
            </div>
          </Panel>
          <Grid cols="1fr 1.1fr">
            <Panel title={`Campaign Funnel – ${SCENARIO_LABEL[s.scenario]}`} icon={<FileBarChart size={15} />}>
              <div className="s4-funnel-wrap">
                <StackFunnel stages={[
                  { value: '1,832', label: 'Target Farmers', sub: '(Conventional NPK Users)' },
                  { value: `${inr(sel.reached)} (${sel.reachPct}%)`, label: 'Reached' },
                  { value: `${inr(sel.trialled)} (${sel.trialPct}%)`, label: 'Trialled', sub: '(of Reached)' },
                  { value: `${inr(sel.adopted)} (${sel.adoptConv}%)`, label: 'Adopted', sub: '(of Trialled)' },
                ]} />
              </div>
              <Note>Repeat intent {s.rates.repeat}% → ~{inr(repeatBuyers)} repeat buyers next season.</Note>
            </Panel>
            <Panel title={`Financial Impact – ${SCENARIO_LABEL[s.scenario]}`} icon={<BarChart3 size={15} />} info>
              <DataTable<{ [key: string]: unknown; p: string; v: string; icon: ReactNode }>
                compact
                columns={[
                  { key: 'p', label: 'Parameter', render: (r) => <span className="s4-act">{r.icon}{r.p}</span> },
                  { key: 'v', label: `${SCENARIO_LABEL[s.scenario]} (Illustrative)`, align: 'right', render: (r) => <strong>{r.v}</strong> },
                ]}
                rows={[
                  { p: 'Incremental Product Demand', v: `${inr(sel.demand)} MT`, icon: <Package size={14} /> },
                  { p: 'Incremental Revenue', v: `₹${Math.round(sel.revenue)} Lakh`, icon: <BarChart3 size={14} /> },
                  { p: 'Estimated Contribution (≈26%)', v: `₹${sel.contribution.toFixed(1)} Lakh`, icon: <Coins size={14} /> },
                  { p: 'Campaign Investment', v: `₹${sel.spend.toFixed(1)} Lakh`, icon: <Target size={14} /> },
                ]}
              />
              <div className="s4-roi-box"><span>Projected Net ROI</span><strong>{sel.roi.toFixed(2)}×</strong></div>
              <Note>Net ROI = (contribution − spend) / spend</Note>
            </Panel>
          </Grid>
        </div>
        <div className="stack">
          <Panel title="AI Campaign Recommendation" icon={<Sparkles size={15} />} className="ai-panel">
            <div className="highlight-box small">
              <strong>{SCENARIO_LABEL[s.scenario]}: {sel.adoptPct}% of targeted farmers adopt.</strong><br />
              Net campaign ROI: {sel.roi.toFixed(2)}× on INR {sel.spend.toFixed(1)}L spend.<br />
              Validate attribution before approval.
            </div>
            <strong className="small" style={{ display: 'block', margin: '10px 0 6px' }}>Key Rationale</strong>
            <Check status="done">Addresses top barriers – price perception (42%) and brand preference (28%).</Check>
            <Check status="done">Leverages 18 high-influence retailers and {s.counts.demo} demos.</Check>
            <Check status="done">Maintains budget efficiency with higher adoption upside.</Check>
            <Check status={sens.cont > 0 ? 'done' : 'todo'}>Recommend reallocating ₹0.40 L from contingency to demonstrations if field capacity permits.</Check>
            {sens.cont > 0 && (
              <Btn small onClick={() => { adjust('cont', -0.4); adjust('demo', 0.4); toast('₹0.40 L moved from Contingency to Farmer Demonstrations'); }}>Apply reallocation</Btn>
            )}
          </Panel>
          <Panel title="Readiness & Risk Assessment" icon={<ShieldCheck size={15} />}>
            <DataTable<{ [key: string]: unknown; area: string; status: string; tone: Tone; remark: string; icon: ReactNode }>
              compact
              columns={[
                { key: 'area', label: 'Area', render: (r) => <span className="s4-act">{r.icon}{r.area}</span> },
                { key: 'status', label: 'Status', render: (r) => <Pill tone={r.tone}>{r.status}</Pill> },
                { key: 'remark', label: 'Remarks', render: (r) => <span className="small muted">{r.remark}</span> },
              ]}
              rows={[
                { area: 'Field Resource', status: 'Ready', tone: 'green', remark: '8 FOs – capacity adequate', icon: <Users size={13} /> },
                { area: 'Product/Stock', status: sel.demand > 250 ? 'Watch' : 'Ready', tone: sel.demand > 250 ? 'amber' : 'green', remark: `~250 MT available (buffer ${Math.round((250 / Math.max(sel.demand, 1) - 1) * 100)}%)`, icon: <Package size={13} /> },
                { area: 'Weather', status: 'Moderate', tone: 'amber', remark: 'Low rainfall risk (Feb–Mar)', icon: <CloudSun size={13} /> },
                { area: 'Retailer Coverage', status: 'Ready', tone: 'green', remark: '46/74 stocking; 18 high-influence', icon: <Store size={13} /> },
                { area: 'Timeline Alignment', status: 'Ready', tone: 'green', remark: 'Aligned with onion growth stages', icon: <CalendarDays size={13} /> },
              ]}
            />
          </Panel>
        </div>
      </Grid>
      <div className="s4-actionbar">
        <Btn variant="primary" to="s4.5" onClick={() => addAudit(`Scenario selected from S4.4 (${SCENARIO_LABEL[s.scenario]}, ROI ${sel.roi.toFixed(2)}×)`)}>Proceed to Approval →</Btn>
      </div>
      <FlowFooter
        steps={[
          { label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
          { label: 'S4.3 Activity & Channel Mix Planner', to: 's4.3' }, { label: 'S4.4 Campaign Scenario Simulator (Current)', current: true },
        ]}
        next={{ label: 'Proceed to Approval', to: 's4.5', sub: 'S4.5 Campaign Approval & Review' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S4.5 Campaign Approval & Review                                     */
/* ------------------------------------------------------------------ */

const STATUS_TONE: Record<ApprovalStatus, Tone> = {
  'Draft for Approval': 'amber', 'Submitted for Approval': 'blue', 'Changes Requested': 'amber', Approved: 'green', 'Sent Back': 'red',
};

const EXEC_MONTHS = ['Pre-plant (Dec \'26)', 'Vegetative (Jan \'27)', 'Bulb Development (Feb \'27)', 'Maturity (Mar \'27)'];
const EXEC_ROWS: typeof GANTT_ROWS = [
  { label: 'Retailer activation', icon: <Store size={13} />, bars: [{ left: 2, width: 40, text: '', color: '#3f9d45' }] },
  { label: 'Demonstration plots', icon: <Sprout size={13} />, bars: [{ left: 10, width: 60, text: '', color: '#4c9f43' }] },
  { label: 'Farmer meetings', icon: <Users size={13} />, bars: [{ left: 22, width: 52, text: '', color: '#5fae4c' }] },
  { label: 'Digital advisory', icon: <Smartphone size={13} />, bars: [{ left: 12, width: 86, text: '', color: '#76b84f' }] },
  { label: 'Field follow-ups', icon: <UserCheck size={13} />, bars: [{ left: 48, width: 50, text: '', color: '#2f8a3b' }] },
];

type RouteRow = { [key: string]: unknown; role: string; sub?: string; status: string; tone: Tone; comment: string; due: string; can: boolean };

export function ApprovalReview() {
  const { toast } = useNav();
  const s = useStudio();
  const out = useMemo(() => outcomes(s), [s]);
  const plan = useMemo(() => planOf(s), [s]);
  const sel = out[s.scenario];
  const status = s.status;
  const submitted = status === 'Submitted for Approval';
  const approved = status === 'Approved';
  const [reviewed, setReviewed] = useState(true);

  const act = (next: ApprovalStatus, action: string, msg: string, user = 'Strategy Head') => {
    setStudio({ status: next });
    addAudit(action, user);
    toast(msg);
  };

  const routing: RouteRow[] = [
    { role: 'Campaign Owner', sub: '(Strategy Team)', status: status === 'Draft for Approval' || status === 'Changes Requested' || status === 'Sent Back' ? (status === 'Draft for Approval' ? 'Draft' : status) : 'Submitted', tone: status === 'Sent Back' ? 'red' : status === 'Draft for Approval' || status === 'Changes Requested' ? 'amber' : 'green', comment: 'Campaign plan, base case & readiness submitted for approval.', due: '15 Dec 2026', can: false },
    { role: 'Regional Marketing Head', status: approved ? 'Approved' : 'Pending Approval', tone: approved ? 'green' : 'amber', comment: 'Review plan, activity mix & field readiness.', due: '17 Dec 2026', can: true },
    { role: 'Supply Chain Lead', status: approved ? 'Confirmed' : 'Pending Stock Confirmation', tone: approved ? 'green' : 'amber', comment: 'Confirm stock availability & replenishment plan.', due: '17 Dec 2026', can: true },
    { role: 'Finance Controller', status: approved ? 'Signed-off' : 'Pending Budget Sign-off', tone: approved ? 'green' : 'amber', comment: `Validate budget (₹${sel.spend.toFixed(1)} Lakh) & ROI (${sel.roi.toFixed(2)}×).`, due: '18 Dec 2026', can: true },
    { role: 'Compliance Officer', status: approved ? 'Cleared' : 'Pending Content / Compliance', tone: approved ? 'green' : 'amber', comment: 'Approve advisory content & agronomic claims.', due: '18 Dec 2026', can: true },
    { role: 'Business Head', status: approved ? 'Final Approval ✓' : 'Final Approval (Pending)', tone: approved ? 'green' : 'grey', comment: 'Authorize campaign for deployment after all prerequisites.', due: '19 Dec 2026', can: true },
  ];

  const budgetRows = plan.rows.map((r) => ({ key: r.def.key, budget: r.budget, count: r.count }));

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
        { label: 'S4.3 Activity & Channel Mix Planner', to: 's4.3' }, { label: 'S4.4 Campaign Scenario Simulator', to: 's4.4' },
        { label: 'S4.5 Campaign Approval & Review' },
      ]} />
      <PageHeader back="s4.4" title="Campaign Approval & Review" subtitle="Validate the recommended Ambad Croptek campaign, review outstanding dependencies, and route the plan for authorization before deployment." />
      <SourceBar>Opened from S4.4: Clicked 'Proceed to Approval'</SourceBar>
      <ContextStrip items={[
        { icon: <ClipboardList size={20} />, label: 'Campaign ID', value: <>CAMP-R26-AMB-014 <Pill tone={STATUS_TONE[status]}>{status}</Pill></> },
        { icon: <Users size={20} />, label: 'Target Farmers', value: '1,832' },
        { icon: <Coins size={20} />, label: 'Budget', value: `₹${sel.spend.toFixed(1)} lakh` },
        { icon: <Sprout size={20} />, label: `${SCENARIO_LABEL[s.scenario]} Adoption`, value: `${inr(sel.adopted)} farmers`, sub: `(${sel.adoptPct}% of target)` },
        { icon: <Package size={20} />, label: 'Incremental Demand', value: `${inr(sel.demand)} MT` },
        { icon: <BarChart3 size={20} />, label: 'Net Campaign ROI', value: `${sel.roi.toFixed(2)}×` },
      ]} />
      <Grid cols="2.8fr 1fr">
        <div className="stack">
          <Grid cols="1fr 1fr 1.25fr">
            <Panel title="Campaign Summary" icon={<FileText size={15} />}
              actions={<><Pill tone={reviewed ? 'green' : 'grey'}>{reviewed ? '✓ Reviewed' : 'Not reviewed'}</Pill><Btn small variant="ghost" icon={<Pencil size={12} />} to="s4.2">Edit</Btn></>}>
              <dl className="kv">
                {[
                  ['Campaign name', 'Croptek Onion Conversion — Ambad'], ['Objective', 'Competitive conversion and farmer adoption'],
                  ['Geography', 'Ambad, Jalna, Maharashtra'], ['Crop / product', 'Onion / Croptek'], ['Primary audience', 'Conventional NPK users'],
                  ['Secondary audience', 'Non-users and trial users'], ['Strategy', 'Retailer-led conversion + demonstrations'],
                  ['Campaign dates', '15 Dec 2026 – 15 Mar 2027'], ['Owner', 'Regional Marketing – Maharashtra'],
                ].map(([k, v]) => [<dt key={`${k}-t`}>{k}</dt>, <dd key={`${k}-d`}>{v} <span style={{ color: COLORS.green }}>✓</span></dd>])}
                <dt>Linked scenario</dt><dd><Pill>{SCENARIO_LABEL[s.scenario]} (Selected)</Pill></dd>
              </dl>
              <div style={{ marginTop: 8 }}><Btn small variant="ghost" onClick={() => setReviewed((r) => !r)}>{reviewed ? 'Mark as not reviewed' : 'Mark as reviewed'}</Btn></div>
            </Panel>
            <Panel title="Selected Scenario & Funnel" icon={<BarChart3 size={15} />}>
              <div className="highlight-box small" style={{ marginBottom: 8 }}>Selected Scenario: <strong>{SCENARIO_LABEL[s.scenario]}{s.scenario === 'base' ? ' (Recommended)' : ''}</strong></div>
              <Grid cols="1.2fr 1fr" gap={8}>
                <div className="s4-funnel-wrap">
                  <StackFunnel stages={[
                    { value: '1,832', label: 'Target Farmers', sub: '(Adoption Denominator)' },
                    { value: `${inr(sel.reached)} (${sel.reachPct}%)`, label: 'Reached', sub: '(of Target)' },
                    { value: `${inr(sel.trialled)} (${sel.trialPct}%)`, label: 'Trialled', sub: '(of Reached)' },
                    { value: `${inr(sel.adopted)} (${sel.adoptConv}%)`, label: 'Adopted', sub: `(${sel.adoptPct}% of Target)` },
                  ]} />
                </div>
                <div>
                  <div className="s4-side-metric"><Package size={16} /><span>Incremental Demand<strong>{inr(sel.demand)} MT</strong></span></div>
                  <div className="s4-side-metric"><BarChart3 size={16} /><span>Incremental Revenue<strong>₹{sel.revenue.toFixed(1)} Lakh</strong></span></div>
                  <div className="s4-side-metric"><Coins size={16} /><span>Incremental Contribution<strong>₹{sel.contribution.toFixed(1)} Lakh</strong></span></div>
                  <div className="s4-side-metric"><IndianRupee size={16} /><span>Campaign Spend<strong>₹{sel.spend.toFixed(1)} Lakh</strong></span></div>
                </div>
              </Grid>
            </Panel>
            <Panel title="Activity-wise Budget & Execution Plan" icon={<ClipboardList size={15} />} info>
              <DataTable<{ [key: string]: unknown; key: ActivityKey; budget: number; count: number }>
                compact
                columns={[
                  { key: 'key', label: 'Activity / Channel', render: (r) => <span className="s4-act">{ACTIVITIES.find((a) => a.key === r.key)!.icon}{ACTIVITIES.find((a) => a.key === r.key)!.short}</span> },
                  { key: 'count', label: 'Planned Quantity', render: (r) => { const a = ACTIVITIES.find((x) => x.key === r.key)!; return <span className="small">{a.qty(r.count)}<br /><span className="muted">{a.qtySub}</span></span>; } },
                  { key: 'budget', label: 'Budget (₹ Lakh)', align: 'right', render: (r) => `₹${lakh(r.budget)}` },
                  { key: 'share', label: 'Share', align: 'right', render: (r) => `${Math.round((r.budget / (plan.total || 1)) * 100)}%` },
                  { key: 'owner', label: 'Owner', render: (r) => <span className="small">{ACTIVITIES.find((a) => a.key === r.key)!.owner}</span> },
                ]}
                rows={budgetRows}
                total={{ key: 'Total Campaign Budget', budget: `₹${plan.total.toFixed(1)} Lakh`, share: '100%' }}
              />
            </Panel>
          </Grid>
          <Grid cols="1.5fr 1fr">
            <Panel title="Crop-stage Execution Calendar" icon={<CalendarDays size={15} />} info>
              <Gantt months={EXEC_MONTHS} rows={EXEC_ROWS} />
            </Panel>
            <Panel title="ROI Methodology" icon={<FileBarChart size={15} />} info>
              <Check status="done">Adoption denominator = target farmers (1,832).</Check>
              <Check status="done">Net ROI based on incremental contribution, not revenue.</Check>
              <Check status="done">Margin assumption / contribution basis is an illustrative planning assumption.</Check>
              <Check status="done">Result shown as forecast, not realized performance.</Check>
              <div className="s4-formula">
                Net ROI = (Incremental contribution − campaign spend) / campaign spend<br />
                = (₹{sel.contribution.toFixed(1)}L − ₹{sel.spend.toFixed(1)}L) / ₹{sel.spend.toFixed(1)}L<br />
                <strong className="big">= {sel.roi.toFixed(2)}×</strong>
              </div>
            </Panel>
            <Panel title="Product / Channel / Field Readiness Scorecard" icon={<ShieldCheck size={15} />} info>
              <DataTable<{ [key: string]: unknown; area: string; status: string; tone: Tone; details: string }>
                compact
                columns={[
                  { key: 'area', label: 'Readiness Area' },
                  { key: 'status', label: 'Status', render: (r) => <Pill tone={r.tone}>{r.status}</Pill> },
                  { key: 'details', label: 'Details', render: (r) => <span className="small muted">{r.details}</span> },
                ]}
                rows={[
                  { area: 'Product stock readiness', status: 'Partial', tone: 'amber', details: '~250 MT available; one replenishment trigger pending' },
                  { area: 'Retailer coverage', status: 'Partial', tone: 'amber', details: '46/74 retailers stocking Croptek; 18 high-influence activated' },
                  { area: 'Field capacity', status: 'Ready', tone: 'green', details: '8 FOs aligned for execution' },
                  { area: 'Demo material & approved content', status: 'Pending', tone: 'red', details: 'Content finalized; legal/compliance sign-off pending' },
                  { area: 'Timeline alignment with crop stage', status: 'Ready', tone: 'green', details: 'Plan aligned to Dec–Mar crop stages' },
                  { area: 'Weather dependency', status: 'Moderate', tone: 'amber', details: 'Monitor rainfall / heat during Feb–Mar' },
                ]}
              />
            </Panel>
            <Panel title="Compliance Checks" icon={<ShieldCheck size={15} />} info>
              {[
                ['Farmer advisory content approved', 'Approved', 'green'], ['Consent language reviewed', 'Approved', 'green'],
                ['Dealer / scheme compliance verified', 'Verified', 'green'], [`Budget within limit (₹8.0 Lakh)`, sel.spend <= 8.0001 ? 'Within Limit' : 'Over Limit', sel.spend <= 8.0001 ? 'green' : 'red'],
                ['Agronomic claims review (final legal / compliance sign-off)', approved ? 'Cleared' : 'Pending', approved ? 'green' : 'amber'], ['Audit trail enabled', 'Enabled', 'green'],
              ].map(([label, st, tone]) => (
                <div key={label} className="row-between small" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{label}</span><Pill tone={tone as Tone}>{st}</Pill>
                </div>
              ))}
            </Panel>
          </Grid>
          <Grid cols="1.25fr 1fr">
            <Panel title="Approval Routing & Roles" icon={<GitBranch size={15} />} info>
              <DataTable<RouteRow>
                compact
                columns={[
                  { key: 'role', label: 'Role / Approver', render: (r) => <span><strong>{r.role}</strong>{r.sub && <span className="small muted"> {r.sub}</span>}</span> },
                  { key: 'status', label: 'Action & Status', render: (r) => <Pill tone={r.tone}>{r.status}</Pill> },
                  { key: 'comment', label: 'Comments', render: (r) => <span className="small">{r.comment}</span> },
                  { key: 'due', label: 'Due Date' },
                  { key: 'can', label: 'Can Approve', align: 'center', render: (r) => (r.can ? <span style={{ color: COLORS.green }}>✓</span> : '–') },
                ]}
                rows={routing}
              />
            </Panel>
            <Panel title="Audit Trail" icon={<History size={15} />} info>
              <DataTable<AuditRow>
                compact
                columns={[
                  { key: 'when', label: 'Date & Time', render: (r) => <span className="small">{r.when}</span> },
                  { key: 'user', label: 'User', render: (r) => <span className="row" style={{ gap: 5 }}><span className="num-badge" style={{ borderRadius: 999 }}>SM</span>{r.user}</span> },
                  { key: 'action', label: 'Action / Details', render: (r) => <span className="small">{r.action}</span> },
                ]}
                rows={s.audit}
                highlight={(_, i) => i === 0 && s.audit.length > 4}
              />
            </Panel>
          </Grid>
        </div>
        <div className="stack">
          <Panel title="AI Approval Brief" icon={<Sparkles size={15} />} className="ai-panel" actions={<Pill tone="amber">Approval readiness: 82% / Conditional</Pill>}>
            <AiItem icon={<CheckCircle2 size={16} />} title="Recommendation: Submit for approval">with 2 dependencies to close.</AiItem>
            <strong className="small" style={{ display: 'block', margin: '8px 0 4px' }}>Why:</strong>
            <Check status="done">Strong market opportunity (₹52 lakh) in Ambad.</Check>
            <Check status="done">Coherent {SCENARIO_LABEL[s.scenario].toLowerCase()} economics (contribution ₹{sel.contribution.toFixed(1)}L; net ROI {sel.roi.toFixed(2)}×).</Check>
            <Check status="done">Well-structured, retailer-led activity plan aligned to crop stages and target audience.</Check>
            <strong className="small" style={{ display: 'block', margin: '8px 0 4px' }}><Lightbulb size={13} /> Outstanding actions (to close before final approval):</strong>
            <Check status={approved ? 'done' : 'pending'}>1. Finalize demonstration content (agronomy, product use, claims) – pending legal/compliance sign-off.</Check>
            <Check status={approved ? 'done' : 'pending'}>2. Confirm stock replenishment plan for low-coverage pockets (~250 MT available; trigger one replenishment).</Check>
            <strong className="small" style={{ display: 'block', margin: '8px 0 4px' }}>Suggested approvers to notify:</strong>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Regional Marketing Head – campaign approval</li>
              <li>Supply Chain Lead – stock confirmation</li>
              <li>Finance Controller – budget sign-off</li>
              <li>Compliance Officer – content / claims approval</li>
            </ul>
            <div style={{ marginTop: 8 }}><Btn small icon={<Send size={12} />} onClick={() => { addAudit('Approvers notified (Regional Marketing Head, Supply Chain Lead, Finance Controller, Compliance Officer)'); toast('Suggested approvers notified'); }}>Notify approvers</Btn></div>
          </Panel>
          <Panel title={<>Action Controls <span className="muted small">(Submitter View)</span></>} icon={<ClipboardCheck size={15} />} info>
            <div className="row" style={{ marginBottom: 8 }}><span className="small muted">Status:</span><Pill tone={STATUS_TONE[status]} solid>{status}</Pill></div>
            <div className="s4-controls">
              <Btn small icon={<Save size={12} />} disabled={approved} onClick={() => { addAudit('Draft saved'); toast('Draft saved'); }}>Save Draft</Btn>
              <Btn small icon={<RotateCcw size={12} />} disabled={approved} onClick={() => act('Changes Requested', 'Changes requested on campaign plan', 'Changes requested — plan returned to owner')}>Request Changes</Btn>
              <Btn small variant="primary" icon={<Send size={12} />} disabled={submitted || approved} onClick={() => act('Submitted for Approval', 'Submitted for approval (CAMP-R26-AMB-014)', 'Campaign submitted for approval')}>Submit for Approval</Btn>
            </div>
          </Panel>
          <Panel title={<>Authorized Approver Controls <span className="muted small">(e.g. Regional Marketing Head, Finance)</span></>} icon={<ThumbsUp size={15} />}>
            <div className="s4-controls">
              <Btn small variant="primary" icon={<ThumbsUp size={12} />} disabled={!submitted} onClick={() => act('Approved', 'Campaign approved for deployment', 'Campaign approved', 'Regional Marketing Head')}>Approve</Btn>
              <Btn small icon={<RotateCcw size={12} />} disabled={!submitted} onClick={() => act('Sent Back', 'Rejected / sent back to campaign owner', 'Campaign sent back to owner', 'Regional Marketing Head')}>Reject / Send Back</Btn>
            </div>
            <Note>{submitted ? 'Awaiting approver decision.' : approved ? 'Approved — proceed to S5.1 Campaign Demand Projection.' : 'Visible to approvers based on your role; enabled after submission.'}</Note>
          </Panel>
        </div>
      </Grid>
      <FlowFooter
        steps={[
          { label: 'S2.5 Campaign Recommendations', to: 's2.5' }, { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
          { label: 'S4.3 Activity & Channel Mix Planner', to: 's4.3' }, { label: 'S4.4 Campaign Scenario Simulator', to: 's4.4' },
          { label: 'S4.5 Campaign Approval & Review (Current)', current: true },
        ]}
        next={{ label: 'S5.1 Campaign Demand Projection', to: 's5.1', sub: 'After approval, open S5.1' }}
      />
    </div>
  );
}

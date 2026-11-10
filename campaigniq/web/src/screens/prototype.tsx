import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, Bot, Boxes, Calculator, CalendarDays, CheckCircle2, CircleDashed, ClipboardCheck,
  Cloud, Database, FileSpreadsheet, Gauge, Layers, LineChart, MapPin, MonitorSmartphone, PhoneCall, PlayCircle,
  RefreshCw, Rocket, Server, ShieldCheck, Sparkles, Sprout, Target, TerminalSquare, Truck, Users, Wallet, XCircle,
} from 'lucide-react';
import { API_BASE, API_ENABLED, api, clearApiLog, useApiLog, type Check as PlanCheck, type Plan } from '../api';

/** What to tell the user when the backend can't be reached (local dev vs. the published site). */
const backendHint = !API_ENABLED
  ? ''
  : import.meta.env.DEV
    ? ' Start it with npm run dev.'
    : ' The free backend server sleeps when idle and can take up to a minute to wake up - wait a moment, then reload.';
import { useNav, type ScreenId } from '../nav';
import { Btn, DataTable, Grid, HBars, Kpi, KpiRow, PageHeader, Panel, Pill, Progress, VBars, COLORS, type Tone } from '../ui';
import './prototype.css';

/* ================================================================== helpers */

const inr = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};
const num = (value: number | null | undefined, digits = 0) =>
  value == null || Number.isNaN(value) ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: digits });
const pct = (value: number | null | undefined, digits = 0) => (value == null || Number.isNaN(value) ? '—' : `${(value * 100).toFixed(digits)}%`);
const CHECK_TONE: Record<string, Tone> = { green: 'green', amber: 'amber', red: 'red' };
const SEGMENT_TONE: Record<string, Tone> = { Emerging: 'blue', Growing: 'green', Maturing: 'amber', Saturated: 'grey' };
const STATUS_TONE: Record<string, Tone> = { draft: 'grey', submitted: 'blue', approved: 'green', locked: 'dark', live: 'lime' };

/** Small hook: load JSON from the API, expose loading/error and a reload function. */
function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));
    api<T>(path)
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((error: Error) => { if (!cancelled) setState({ data: null, error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [path, tick]);
  return { ...state, reload: useCallback(() => setTick((value) => value + 1), []) };
}

/* ================================================================== shared: backend console */

export function ApiConsole({ title = 'Backend Activity (live API calls)' }: { title?: string }) {
  const calls = useApiLog();
  return (
    <Panel
      className="proto-console"
      icon={<TerminalSquare size={16} />}
      title={title}
      actions={<><span className="small muted">{API_BASE || 'no backend connected'}</span><Btn small variant="ghost" onClick={clearApiLog}>Clear</Btn></>}
    >
      {calls.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>No calls yet. Interact with the screen; every request to the FastAPI backend appears here with its status and response time.</p>
      ) : (
        <ol className="proto-log">
          {calls.slice(0, 14).map((call) => (
            <li key={call.id} className={typeof call.status === 'number' && call.status < 400 ? 'ok' : 'err'}>
              <span className={`proto-method m-${call.method.toLowerCase()}`}>{call.method}</span>
              <code>{call.path}</code>
              <span className="proto-status">{call.status}</span>
              <span className="proto-ms">{call.ms} ms</span>
              {call.detail && <span className="proto-detail">{call.detail}</span>}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* ================================================================== P.1 Prototype overview */

type FeatureStatus = 'live' | 'ready' | 'proposed';
const STATUS_META: Record<FeatureStatus, { label: string; tone: Tone }> = {
  live: { label: 'Live · backend connected', tone: 'green' },
  ready: { label: 'Interactive UI · API ready', tone: 'blue' },
  proposed: { label: 'Proposed', tone: 'amber' },
};

const FEATURES: { module: string; screens: string; to: ScreenId; what: string; backend: string; status: FeatureStatus; icon: ReactNode }[] = [
  { module: 'Live Planning Engine', screens: 'P.2', to: 'p.2', icon: <Calculator size={16} />, status: 'live',
    what: 'Market → goal → farmers → activity mix → budget, with guardrail checks and the full approval workflow.', backend: 'POST /plans/calculate · /plans · submit / approve / generate-calendar · stock-needs' },
  { module: 'Live Execution & Performance', screens: 'P.3', to: 'p.3', icon: <Activity size={16} />, status: 'live',
    what: 'Field completion, verified reach, conversions, liquidation, MDO queue, call-centre callbacks and audit flags.', backend: 'GET /performance · /dashboard · /mdo/today · /callbacks/queue · /audit-queue' },
  { module: 'Data Sources & Integrations', screens: 'ADM', to: 'admin.1', icon: <Database size={16} />, status: 'live',
    what: 'Upload CSV/JSON to replace demo data on any screen; geography & product masters; LLM status.', backend: '/datasets · /reference' },
  { module: 'AI Co-pilot', screens: 'AI.1', to: 'ai.1', icon: <Bot size={16} />, status: 'live',
    what: 'Grounded Q&A over CampaignIQ data. Pluggable LLM (OpenAI / Azure / local); demo answers until a key is set.', backend: 'POST /copilot/ask · GET /copilot/status' },
  { module: 'Strategy Command Centre', screens: 'S1.1–S1.5', to: 's1.1', icon: <Gauge size={16} />, status: 'ready',
    what: 'National portfolio, campaign scorecard, strategic risk root-cause and recovery replanning.', backend: '/dashboard · /risks · /reports/weekly|monthly · /plans/{id}/replan' },
  { module: 'Opportunity Atlas', screens: 'S2.1–S2.5', to: 's2.1', icon: <MapPin size={16} />, status: 'ready',
    what: 'Crop × geography opportunity, district/taluka intelligence, micro-market segments, competition, recommendations.', backend: '/market/mus · /segments/summary · PATCH /mus/{id}/segment-override' },
  { module: 'Crop Nutrition Intelligence', screens: 'S3.1–S3.4', to: 's3.1', icon: <Sprout size={16} />, status: 'ready',
    what: 'Crop-stage calendar, stage-wise nutrition, programme builder and campaign trigger engine.', backend: 'Crop stages & dose schedule in DB; trigger rules engine proposed' },
  { module: 'Campaign Strategy Studio', screens: 'S4.1–S4.5', to: 's4.1', icon: <Layers size={16} />, status: 'ready',
    what: 'Templates, creation wizard, activity & channel mix, scenario simulator, approval routing.', backend: 'Same engine & workflow as P.2 (/plans/*, /activities, /playbooks)' },
  { module: 'Demand & Channel Readiness', screens: 'S5.1–S5.4', to: 's5.1', icon: <Truck size={16} />, status: 'ready',
    what: 'Demand projection, stock readiness, dealer/retailer readiness, supply risk & replenishment.', backend: '/plans/{id}/stock-needs · POST /import/sales; ERP feed proposed' },
  { module: 'Orchestration & Control Tower', screens: 'S6.1–S6.2', to: 's6.1', icon: <CalendarDays size={16} />, status: 'ready',
    what: 'Execution calendar, owner allocation, activity workspace, evidence capture and replanning.', backend: '/calendar · /mdo/today · POST /events/{id}/report · /audit-flags' },
  { module: 'Impact & Learning', screens: 'S7.1–S7.2', to: 's7.1', icon: <LineChart size={16} />, status: 'ready',
    what: 'Impact dashboard, cluster/channel effectiveness, root-cause diagnostics and learnings library.', backend: '/performance · /callbacks · learned conversion rates in engine' },
];

const ROADMAP: { phase: string; when: string; tone: Tone; items: string[] }[] = [
  { phase: 'Phase 1 · Prototype', when: 'Now', tone: 'green', items: [
    '32 screens: 28 from the approved mockups, 3 live backend showcases and a data-integration screen',
    'Python planning engine with 8 guardrail checks and plan lifecycle (draft → live)',
    'Field execution, callbacks, consent log, imports and weekly / monthly reports APIs',
    'Data placeholders: upload CSV/JSON to replace demo data screen by screen',
    'AI Co-pilot with pluggable LLM, responsive layout for phone, tablet and desktop',
  ] },
  { phase: 'Phase 2 · Pilot', when: 'Next 8–12 weeks', tone: 'blue', items: [
    'Single sign-on, role-based access and territory scoping (HO, zone, region, MDO, call centre)',
    'ERP / SAP stock & secondary-sales feed, DMS dealer master, scheduled ETL',
    'Weather and crop-stage feeds driving the S3.4 trigger engine',
    'LLM with retrieval over approved agronomy content (RAG) and answer audit log',
    'Field app (offline-first) with GPS + photo evidence, WhatsApp / IVR advisory with consent',
  ] },
  { phase: 'Phase 3 · Scale', when: 'Season 2', tone: 'amber', items: [
    'All states, districts and the full Mahadhan product portfolio',
    'Conversion models learned from callbacks and sales (replace default k-factors)',
    'Matched-baseline ROI attribution and automated budget re-allocation suggestions',
    'Managed database (PostgreSQL), monitoring, backups and data-governance controls',
  ] },
];

const DEMO_PATH: { step: string; detail: string; to: ScreenId }[] = [
  { step: 'Command Centre', detail: 'National view and portfolio risks', to: 's1.1' },
  { step: 'Opportunity Atlas', detail: 'Where to play: crop × geography', to: 's2.1' },
  { step: 'Nutrition triggers', detail: 'When to act: crop-stage triggers', to: 's3.4' },
  { step: 'Live planning engine', detail: 'Real calculation & approval', to: 'p.2' },
  { step: 'Channel readiness', detail: 'Stock & dealer readiness', to: 's5.3' },
  { step: 'Live execution', detail: 'Field, callbacks, conversions', to: 'p.3' },
  { step: 'Impact & learning', detail: 'What worked and why', to: 's7.1' },
  { step: 'AI Co-pilot', detail: 'Ask questions across modules', to: 'ai.1' },
];

type Dashboard = { kpis: Record<string, number>; market_units: MarketRow[]; liquidation_by_month: { month: string; liquidated: number; po_packs: number }[] };
type PlanList = { items: { id: number; status: string; version: number; mu_name: string; crop_name: string; season_name: string; created_at: string; target_treated_pct: number; result: Partial<Plan> }[]; total: number };
type DatasetList = { items: { name: string; status: 'live' | 'demo' }[] };
type CopilotStatus = { provider: string; model: string | null; mode: 'llm' | 'demo' };

export function PrototypeOverview() {
  const { go, reference } = useNav();
  const [latency, setLatency] = useState<number | null>(null);
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const dashboard = useApi<Dashboard>('/dashboard');
  const plans = useApi<PlanList>('/plans?limit=200');
  const datasets = useApi<DatasetList>('/datasets');
  const copilot = useApi<CopilotStatus>('/copilot/status');

  useEffect(() => {
    const started = performance.now();
    api('/health').then(() => { setApiUp(true); setLatency(Math.round(performance.now() - started)); }).catch(() => setApiUp(false));
  }, []);

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    plans.data?.items.forEach((item) => { counts[item.status] = (counts[item.status] ?? 0) + 1; });
    return counts;
  }, [plans.data]);
  const districts = reference.states.reduce((sum, state) => sum + state.districts.length, 0);
  const liveDatasets = datasets.data?.items.filter((item) => item.status === 'live').length ?? 0;

  const health: { label: string; value: ReactNode; ok: boolean | null; sub: string }[] = [
    { label: 'FastAPI backend', value: apiUp == null ? 'Checking…' : apiUp ? `Online · ${latency} ms` : 'Offline', ok: apiUp, sub: API_BASE || 'Not connected on this published demo' },
    { label: 'Database (SQLite)', value: dashboard.data ? `${num(dashboard.data.kpis.marketing_units)} market units` : dashboard.error ? 'Unavailable' : '…', ok: dashboard.data ? true : dashboard.error ? false : null, sub: `${plans.data ? `${plans.data.total} campaign plan${plans.data.total === 1 ? '' : 's'}` : '…'} · ${num(dashboard.data?.kpis.activities_done)} field activities done` },
    { label: 'Planning engine', value: 'Python · 8 guardrails', ok: apiUp, sub: 'Segment → goal → farmers → mix → budget' },
    { label: 'Reference masters', value: `${reference.states.length} states · ${districts} districts`, ok: true, sub: `${reference.products.length} products · editable JSON` },
    { label: 'Screen datasets', value: datasets.data ? `${liveDatasets} live · ${datasets.data.items.length - liveDatasets} demo` : '…', ok: datasets.data ? true : datasets.error ? false : null, sub: 'Upload CSV/JSON in Data Sources' },
    { label: 'AI Co-pilot', value: copilot.data ? (copilot.data.mode === 'llm' ? `LLM · ${copilot.data.model}` : 'Demo answers') : '…', ok: copilot.data ? true : copilot.error ? false : null, sub: copilot.data?.mode === 'llm' ? copilot.data.provider : 'Set COPILOT_PROVIDER to connect an LLM' },
  ];

  return (
    <div className="stack proto">
      <PageHeader
        code="P.1"
        title="Mahadhan CampaignIQ · Prototype Overview"
        subtitle="An end-to-end prototype of the crop-nutrition campaign platform: what is built, how the frontend and backend work together, and what is proposed next."
        badge={<Pill tone="green">Prototype v1</Pill>}
        actions={<>
          <Btn variant="primary" icon={<PlayCircle size={14} />} to="p.2">Start live demo</Btn>
          <Btn icon={<Gauge size={14} />} to="s1.1">Open Command Centre</Btn>
        </>}
      />

      <section className="proto-hero">
        <div className="proto-hero-copy">
          <span className="proto-eyebrow">Plan · Execute · Measure · Learn</span>
          <h2>One workspace for every Mahadhan crop-nutrition campaign</h2>
          <p>
            CampaignIQ finds where adoption headroom is, plans the right activity mix and budget for each market,
            checks stock and channel readiness, runs field execution and proves impact, with an AI Co-pilot on top.
          </p>
        </div>
        <div className="proto-hero-stats">
          <div><strong>32</strong><span>screens across 11 modules</span></div>
          <div><strong>48</strong><span>REST API endpoints</span></div>
          <div><strong>8</strong><span>planning guardrails</span></div>
          <div><strong>3</strong><span>device layouts</span></div>
        </div>
      </section>

      <Grid cols="1.15fr 1fr">
        <Panel icon={<Server size={16} />} title="Live System Status" actions={<Btn small variant="ghost" icon={<RefreshCw size={12} />} onClick={() => { dashboard.reload(); plans.reload(); datasets.reload(); copilot.reload(); }}>Refresh</Btn>}>
          <div className="proto-health">
            {health.map((item) => (
              <div key={item.label} className="proto-health-item">
                <span className={`proto-dot ${item.ok == null ? 'wait' : item.ok ? 'up' : 'down'}`} />
                <div>
                  <span className="proto-health-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.sub}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="proto-plan-status">
            <span className="small muted">Plans by workflow status:</span>
            {['draft', 'submitted', 'approved', 'locked', 'live'].map((status) => (
              <Pill key={status} tone={STATUS_TONE[status]}>{status} · {byStatus[status] ?? 0}</Pill>
            ))}
          </div>
        </Panel>

        <Panel icon={<PlayCircle size={16} />} title="Guided Demo Path" subtitle="Suggested 10-minute walkthrough for stakeholders.">
          <ol className="proto-path">
            {DEMO_PATH.map((item, index) => (
              <li key={item.step}>
                <button type="button" onClick={() => go(item.to)}>
                  <span className="proto-path-n">{index + 1}</span>
                  <span><strong>{item.step}</strong><small>{item.detail}</small></span>
                  <ArrowRight size={14} />
                </button>
              </li>
            ))}
          </ol>
        </Panel>
      </Grid>

      <Panel icon={<Boxes size={16} />} title="How It Works · Architecture" subtitle="Solid boxes are built in this prototype; dashed boxes are proposed integrations.">
        <div className="proto-arch">
          <div className="proto-arch-col">
            <h4>Users</h4>
            {['Strategy & marketing heads', 'Region managers (approve)', 'Product detailers / MDOs', 'Call centre', 'Admins'].map((label) => <div key={label} className="proto-box b-user"><Users size={14} />{label}</div>)}
          </div>
          <div className="proto-arch-arrow"><ArrowRight size={18} /></div>
          <div className="proto-arch-col">
            <h4>Web app · React + TypeScript</h4>
            <div className="proto-box b-app"><MonitorSmartphone size={14} />32 screens · phone, tablet, desktop</div>
            <div className="proto-box b-app"><Target size={14} />Filters: season, state, district, crop, product</div>
            <div className="proto-box b-app"><Database size={14} />useDataset(): demo ↔ live data switch</div>
            <div className="proto-box b-app"><Sparkles size={14} />Co-pilot workspace (AI.1)</div>
          </div>
          <div className="proto-arch-arrow"><span>REST / JSON</span><ArrowRight size={18} /></div>
          <div className="proto-arch-col">
            <h4>API · Python FastAPI</h4>
            <div className="proto-box b-api"><Calculator size={14} />Planning engine & guardrails</div>
            <div className="proto-box b-api"><ClipboardCheck size={14} />Plan workflow, audit & roles</div>
            <div className="proto-box b-api"><CalendarDays size={14} />Calendar, field reports, callbacks</div>
            <div className="proto-box b-api"><FileSpreadsheet size={14} />Imports, datasets, reference masters</div>
            <div className="proto-box b-api"><Bot size={14} />Co-pilot: context builder + LLM adapter</div>
          </div>
          <div className="proto-arch-arrow"><ArrowRight size={18} /></div>
          <div className="proto-arch-col">
            <h4>Data & integrations</h4>
            <div className="proto-box b-data"><Database size={14} />SQLite DB (PostgreSQL for pilot)</div>
            <div className="proto-box b-data"><FileSpreadsheet size={14} />Reference JSON · uploaded datasets</div>
            <div className="proto-box b-proposed"><Cloud size={14} />LLM: OpenAI / Azure / local</div>
            <div className="proto-box b-proposed"><Truck size={14} />ERP / SAP stock & sales</div>
            <div className="proto-box b-proposed"><Users size={14} />DMS dealer master · CRM</div>
            <div className="proto-box b-proposed"><Cloud size={14} />Weather & crop-stage feeds</div>
            <div className="proto-box b-proposed"><PhoneCall size={14} />WhatsApp / IVR · field app</div>
          </div>
        </div>
      </Panel>

      <Panel
        icon={<Layers size={16} />}
        title="Feature Map · What Is Built"
        actions={<div className="row">{(Object.keys(STATUS_META) as FeatureStatus[]).map((key) => <Pill key={key} tone={STATUS_META[key].tone}>{STATUS_META[key].label}</Pill>)}</div>}
      >
        <div className="proto-features">
          {FEATURES.map((feature) => (
            <button type="button" key={feature.module} className={`proto-feature f-${feature.status}`} onClick={() => go(feature.to)}>
              <div className="proto-feature-head">
                <span className="proto-feature-icon">{feature.icon}</span>
                <strong>{feature.module}</strong>
                <span className="proto-feature-code">{feature.screens}</span>
              </div>
              <p>{feature.what}</p>
              <code>{feature.backend}</code>
              <div className="proto-feature-foot">
                <Pill tone={STATUS_META[feature.status].tone}>{STATUS_META[feature.status].label}</Pill>
                <span className="proto-open">Open <ArrowRight size={12} /></span>
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel icon={<Rocket size={16} />} title="Proposed Roadmap">
        <div className="proto-roadmap">
          {ROADMAP.map((phase) => (
            <div key={phase.phase} className={`proto-phase t-${phase.tone}`}>
              <div className="proto-phase-head"><strong>{phase.phase}</strong><Pill tone={phase.tone}>{phase.when}</Pill></div>
              <ul>
                {phase.items.map((item) => <li key={item}>{phase.tone === 'green' ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}<span>{item}</span></li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="note">Screens marked “Interactive UI · API ready” show the approved mockup design with illustrative data; their backend endpoints exist and are demonstrated live on P.2 and P.3. Connecting each panel is a configuration step (see Data Sources & Integrations).</p>
      </Panel>
    </div>
  );
}

/* ================================================================== P.2 Live planning engine */

type MetaFilters = {
  seasons: { id: number; name: string }[];
  crops: { id: number; name: string }[];
  products: { id: number; name: string; crop_id: number; pack_kg: number; price_per_pack: number; dose_packs_per_acre: number; placeholder: number }[];
};
type MarketRow = {
  mu_id: number; mu_name: string; district: string; crop_id: number; crop: string; segment: string; objective: string; penetration: number;
  current_treated_pct: number; amp_pct: number; crop_area_acres: number; headroom_acres: number; spend_cap_pct: number; active_dealers: number;
  competition_note: string; soil_deficiency: string[]; rainfall_dev_pct: number;
};
type CalcResult = Plan & { contingency?: number; segment_auto?: string };
/** Structural copy of PlanLine so DataTable (which needs index-signature rows) accepts it. */
type LineRow = { [K in keyof Plan['lines'][number]]: Plan['lines'][number][K] };
type WorkflowPlan = { id: number; status: string };
type StockNeeds = { stock_needed_by: string; stage: string; stage_window: { from: string; to: string }; required_packs: number; pack_kg: number; lead_time_days: number };
type CalendarEvent = { id: number; scheduled_date: string; activity_name: string; status: string };
type Cheaper = { original_budget: number; suggested: CalcResult; savings: number };

const WORKFLOW_STEPS = ['Calculate', 'Draft', 'Submit', 'Approve', 'Live'];
const workflowIndex = (plan: WorkflowPlan | null) => {
  if (!plan) return 0;
  return { draft: 1, submitted: 2, approved: 3, locked: 3, live: 5 }[plan.status] ?? 1;
};

export function LivePlanner() {
  const { go } = useNav();
  const meta = useApi<MetaFilters>('/meta/filters');
  const [cropId, setCropId] = useState<number | null>(null);
  const [muId, setMuId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [target, setTarget] = useState(0.1);
  const markets = useApi<{ items: MarketRow[] }>(cropId ? `/market/mus?crop_id=${cropId}&limit=100` : null);
  const recent = useApi<PlanList>('/plans?limit=8');
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [stock, setStock] = useState<StockNeeds | null>(null);
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [cheaper, setCheaper] = useState<Cheaper | null>(null);

  // Defaults: Onion (the crop with seeded market data) and the first matching product.
  useEffect(() => {
    if (!meta.data || cropId) return;
    setCropId(meta.data.crops.find((crop) => crop.name === 'Onion')?.id ?? meta.data.crops[0]?.id ?? null);
  }, [meta.data, cropId]);
  const products = useMemo(() => meta.data?.products.filter((product) => product.crop_id === cropId) ?? [], [meta.data, cropId]);
  useEffect(() => { setProductId(products[0]?.id ?? null); }, [products]);
  const muList = markets.data?.items ?? [];
  useEffect(() => {
    if (!muList.length) { setMuId(null); return; }
    if (!muList.some((mu) => mu.mu_id === muId)) setMuId((muList.find((mu) => mu.mu_name === 'Niphad West') ?? muList[0]).mu_id);
  }, [muList, muId]);
  const mu = muList.find((item) => item.mu_id === muId) ?? null;
  const seasonId = meta.data?.seasons[0]?.id ?? null;

  // When the market changes, start just above current penetration (a realistic growth target) and reset the workflow.
  useEffect(() => {
    if (!mu) return;
    setTarget(Math.min(mu.amp_pct, Math.round((mu.current_treated_pct + 0.05) * 200) / 200));
    setPlan(null); setStock(null); setEvents(null); setCheaper(null); setNotice(null);
  }, [mu?.mu_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = useMemo(() => (mu && productId && seasonId && cropId
    ? { mu_id: mu.mu_id, crop_id: cropId, season_id: seasonId, product_id: productId, target_treated_pct: Number(target.toFixed(4)) }
    : null), [mu, productId, seasonId, cropId, target]);

  // Live recalculation (debounced) through the Python engine.
  useEffect(() => {
    if (!payload) return;
    setCalculating(true);
    const timer = window.setTimeout(() => {
      api<CalcResult>('/plans/calculate', { method: 'POST', body: JSON.stringify(payload) })
        .then((result) => { setCalc(result); setCalcError(null); })
        .catch((error: Error) => { setCalc(null); setCalcError(error.message); })
        .finally(() => setCalculating(false));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [payload]);

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label); setNotice(null);
    try { await action(); } catch (error) { setNotice({ tone: 'err', text: (error as Error).message }); } finally { setBusy(null); recent.reload(); }
  };

  const saveDraft = () => run('save', async () => {
    const created = await api<WorkflowPlan & CalcResult>('/plans', { method: 'POST', body: JSON.stringify(payload) });
    setPlan({ id: created.id, status: created.status }); setStock(null); setEvents(null); setCheaper(null);
    setNotice({ tone: 'ok', text: `Draft plan #${created.id} saved to the database with ${created.lines.length} activity lines and ${created.checks.length} checks.` });
  });
  const submit = () => run('submit', async () => {
    if (!plan) return;
    const result = await api<WorkflowPlan>(`/plans/${plan.id}/submit`, { method: 'POST' });
    setPlan({ id: plan.id, status: result.status ?? 'submitted' });
    setNotice({ tone: 'ok', text: 'Submitted for approval. Only a Region Manager (or above) can approve.' });
  });
  const approve = (role: string) => run('approve', async () => {
    if (!plan) return;
    const result = await api<WorkflowPlan>(`/plans/${plan.id}/approve`, { method: 'POST', headers: { 'X-User-Role': role } });
    setPlan({ id: plan.id, status: result.status ?? 'approved' });
    setNotice({ tone: 'ok', text: 'Approved by Region Manager. Generate the activity calendar to make the plan live.' });
  });
  const calendar = () => run('calendar', async () => {
    if (!plan) return;
    const result = await api<{ created: number }>(`/plans/${plan.id}/generate-calendar`, { method: 'POST' });
    const [needs, list] = await Promise.all([
      api<StockNeeds>(`/plans/${plan.id}/stock-needs`),
      api<CalendarEvent[]>(`/calendar?plan_id=${plan.id}&from=2000-01-01&to=2100-12-31`),
    ]);
    setPlan({ id: plan.id, status: 'live' }); setStock(needs); setEvents(list);
    setNotice({ tone: 'ok', text: `Plan is live: ${result.created} field activities scheduled; stock requirement computed for the dealer channel.` });
  });
  const suggestCheaper = () => run('cheaper', async () => {
    if (!plan) return;
    const result = await api<Cheaper>(`/plans/${plan.id}/suggest-cheaper`, { method: 'POST' });
    setCheaper(result);
    setNotice({ tone: 'info', text: result.savings > 0 ? `Engine found a cheaper mix that still meets the conversion goal: saves ${inr(result.savings)}.` : 'The current mix is already the cheapest that meets the goal.' });
  });

  const red = calc?.checks.filter((check) => check.status === 'red') ?? [];
  const stepIndex = workflowIndex(plan);
  const minTarget = mu ? Math.ceil(mu.current_treated_pct * 200) / 200 : 0;

  const lineColumns = [
    { key: 'name', label: 'Activity', render: (line: LineRow) => <span><strong>{line.name}</strong><span className="proto-sub">{line.bucket}</span></span> },
    { key: 'share_pct', label: 'Share', align: 'right' as const, render: (line: LineRow) => pct(line.share_pct) },
    { key: 'r', label: 'Reach / unit', align: 'right' as const, render: (line: LineRow) => num(line.r) },
    { key: 'k', label: 'Conversion', align: 'right' as const, render: (line: LineRow) => <span>{pct(line.k, 1)} <span className={`proto-src s-${line.k_source}`}>{line.k_source}</span></span> },
    { key: 'c', label: 'Unit cost', align: 'right' as const, render: (line: LineRow) => inr(line.c) },
    { key: 'n', label: 'Units', align: 'right' as const, render: (line: LineRow) => <strong>{num(line.n)}</strong> },
    { key: 'budget', label: 'Budget', align: 'right' as const, render: (line: LineRow) => <strong>{inr(line.budget)}</strong> },
    { key: 'planned_converts', label: 'Converts', align: 'right' as const, render: (line: LineRow) => num(line.planned_converts, 1) },
  ];

  return (
    <div className="stack proto">
      <PageHeader
        code="P.2"
        title="Live Campaign Planning Engine"
        subtitle="Every number on this screen is computed by the Python backend from the database. Change the market or target and watch the engine, guardrails and workflow respond."
        badge={<Pill tone="green"><span className="proto-live-dot" />Live backend</Pill>}
        back="p.1"
        actions={<Btn icon={<Layers size={14} />} to="s4.3">See designed planner (S4.3)</Btn>}
      />

      <Grid cols="320px 1fr">
        <Panel icon={<Target size={16} />} title="1 · Campaign Inputs" className="proto-inputs">
          {meta.error && <div className="danger-box small">Backend unreachable: {meta.error}{backendHint}</div>}
          <label className="field">Crop
            <select value={cropId ?? ''} onChange={(event) => setCropId(Number(event.target.value))}>
              {meta.data?.crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
            </select>
          </label>
          <label className="field">Market unit
            <select value={muId ?? ''} onChange={(event) => setMuId(Number(event.target.value))} disabled={!muList.length}>
              {muList.map((item) => <option key={item.mu_id} value={item.mu_id}>{item.mu_name} · {item.district} ({item.segment})</option>)}
            </select>
          </label>
          {cropId && markets.data && !muList.length && (
            <div className="warn-box small">No market data for this crop yet. Import it with <code>POST /api/import/market</code> (proposed: ERP/market feed).</div>
          )}
          <label className="field">Product
            <select value={productId ?? ''} onChange={(event) => setProductId(Number(event.target.value))}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.pack_kg} kg · {inr(product.price_per_pack)}</option>)}
            </select>
          </label>
          {mu && (
            <>
              <div className="proto-slider">
                <div className="row-between"><span className="field-label">Target treated area</span><strong>{pct(target, 1)}</strong></div>
                <input type="range" min={minTarget} max={mu.amp_pct} step={0.005} value={target} onChange={(event) => setTarget(Number(event.target.value))} />
                <div className="row-between small muted"><span>Now {pct(mu.current_treated_pct, 1)}</span><span>Potential (AMP) {pct(mu.amp_pct)}</span></div>
              </div>
              <dl className="kv proto-mu">
                <dt>District</dt><dd>{mu.district}</dd>
                <dt>Crop area</dt><dd>{num(mu.crop_area_acres)} acres</dd>
                <dt>Segment</dt><dd><Pill tone={SEGMENT_TONE[mu.segment] ?? 'grey'}>{mu.segment}</Pill> {mu.objective}</dd>
                <dt>Headroom</dt><dd>{num(mu.headroom_acres)} acres</dd>
                <dt>Spend cap</dt><dd>{pct(mu.spend_cap_pct)} of value</dd>
                <dt>Competition</dt><dd>{mu.competition_note}</dd>
                <dt>Soil gaps</dt><dd>{mu.soil_deficiency.join(', ') || '—'}</dd>
                <dt>Dealers</dt><dd>{mu.active_dealers} active</dd>
              </dl>
            </>
          )}
        </Panel>

        <div className="stack">
          <div className={`proto-calc-state ${calculating ? 'busy' : ''}`}>
            <Calculator size={14} /> {calculating ? 'Engine recalculating…' : calc ? `Calculated by the engine · mode: ${calc.mode}` : calcError ? 'Calculation failed' : 'Waiting for inputs'}
          </div>
          {calcError && <div className="danger-box small">{calcError}</div>}
          {calc && (
            <>
              <KpiRow className="proto-kpis">
                <Kpi compact icon={<Target size={16} />} label="Segment · objective" value={calc.segment} sub={`${calc.objective} · penetration ${pct(calc.penetration)}`} />
                <Kpi compact icon={<MapPin size={16} />} label="Incremental area" value={`${num(calc.incremental_area)} ac`} sub={`${num(calc.current_area)} → ${num(calc.target_area)} acres`} />
                <Kpi compact icon={<Users size={16} />} label="Farmers to convert" value={num(calc.farmers_to_convert)} sub={`${num(calc.planned_converts, 0)} planned converts`} />
                <Kpi compact icon={<Boxes size={16} />} label="Volume goal" value={`${num(calc.incremental_packs)} packs`} sub={`${num(calc.y_tons, 1)} t total · ${inr(calc.incremental_value)}`} />
                <Kpi compact icon={<Wallet size={16} />} label="Campaign budget" value={inr(calc.budget_total)} sub={`${inr(calc.cost_per_farmer)} per farmer`} />
                <Kpi compact tone={red.some((check) => check.check_name === 'spend_ratio') ? 'red' : undefined} icon={<Gauge size={16} />} label="Spend ratio" value={pct(calc.spend_ratio, 1)} sub={`cap ${pct(calc.spend_cap_pct)} for ${calc.segment}`} />
              </KpiRow>

              <Panel icon={<Layers size={16} />} title="2 · Activity Mix Generated by the Engine" subtitle="Units = farmers allocated ÷ (reach × conversion). Conversion is 'learned' when enough callback data exists, otherwise the configured default.">
                <DataTable compact columns={lineColumns} rows={calc.lines as LineRow[]} total={{ name: <b>Total</b>, share_pct: '100%', n: <b>{num(calc.total_units)}</b>, budget: <b>{inr(calc.budget)}</b>, planned_converts: <b>{num(calc.planned_converts, 1)}</b> }} />
                <div className="proto-phasing">
                  <span className="small muted">Budget phasing</span>
                  {[['Pre-season', calc.budget_pre, COLORS.dark], ['On-season', calc.budget_on, COLORS.mid], ['Post-season', calc.budget_post, COLORS.light]].map(([label, value, color]) => (
                    <div key={label as string} className="proto-phase-bar" style={{ flex: Math.max(Number(value), 1) }}>
                      <i style={{ background: color as string }} /><span>{label as string} · {inr(Number(value))}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Grid cols="1fr 1fr">
                <Panel icon={<ShieldCheck size={16} />} title="3 · Guardrail Checks" subtitle="Red checks block submission (enforced by the API).">
                  <ul className="proto-checks">
                    {calc.checks.map((check: PlanCheck) => (
                      <li key={check.check_name} className={`c-${check.status}`}>
                        {check.status === 'red' ? <XCircle size={15} /> : check.info ? <BadgeCheck size={15} /> : <CheckCircle2 size={15} />}
                        <span>{check.message}</span>
                        {!check.info && <Pill tone={CHECK_TONE[check.status]}>{check.status}</Pill>}
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel icon={<ClipboardCheck size={16} />} title="4 · Approval Workflow" subtitle={plan ? `Plan #${plan.id} · status: ${plan.status}` : 'Save the calculation as a draft plan to start the workflow.'}>
                  <ol className="proto-track">
                    {WORKFLOW_STEPS.map((step, index) => (
                      <li key={step} className={index < stepIndex ? 'done' : index === stepIndex ? 'active' : ''}>
                        <span>{index < stepIndex ? <CheckCircle2 size={14} /> : index + 1}</span>
                        <small>{step}</small>
                      </li>
                    ))}
                  </ol>
                  <div className="proto-actions">
                    {!plan && <Btn variant="primary" icon={<Database size={14} />} disabled={!payload || busy !== null} onClick={saveDraft}>Save draft plan</Btn>}
                    {plan?.status === 'draft' && <>
                      <Btn variant="primary" icon={<ArrowRight size={14} />} disabled={busy !== null} onClick={submit}>Submit for approval</Btn>
                      <Btn icon={<Wallet size={14} />} disabled={busy !== null} onClick={suggestCheaper}>Suggest cheaper mix</Btn>
                    </>}
                    {plan?.status === 'submitted' && <>
                      <Btn variant="outline" disabled={busy !== null} onClick={() => approve('marketing')}>Approve as Marketing (blocked)</Btn>
                      <Btn variant="primary" icon={<BadgeCheck size={14} />} disabled={busy !== null} onClick={() => approve('region_manager')}>Approve as Region Manager</Btn>
                    </>}
                    {(plan?.status === 'approved' || plan?.status === 'locked') && <Btn variant="primary" icon={<CalendarDays size={14} />} disabled={busy !== null} onClick={calendar}>Generate calendar & stock plan</Btn>}
                    {plan && <Btn variant="ghost" onClick={() => { setPlan(null); setStock(null); setEvents(null); setCheaper(null); setNotice(null); }}>Start a new plan</Btn>}
                  </div>
                  <ul className="proto-roles">
                    <li><b>Marketing team</b> saves &amp; submits the plan (red guardrails block submission)</li>
                    <li><b>Region Manager</b> approves; other roles are rejected by the API (HTTP 403)</li>
                    <li><b>System</b> schedules field activities and computes dealer stock timing</li>
                  </ul>
                  {busy && <p className="small muted">Calling the API…</p>}
                  {notice && <div className={notice.tone === 'err' ? 'danger-box small' : notice.tone === 'info' ? 'warn-box small' : 'highlight-box small'}>{notice.tone === 'err' ? 'Blocked by backend: ' : ''}{notice.text}</div>}
                  {red.length > 0 && !plan && <p className="small muted">Tip: this target fails {red.length} guardrail(s). You can still save it as a draft to see the API block the submission, or lower the target until all checks are green.</p>}
                  {cheaper && (
                    <div className="proto-cheaper small">
                      <strong>Engine suggestion:</strong> budget {inr(cheaper.original_budget)} → {inr(cheaper.suggested.budget_total)} (saves {inr(cheaper.savings)}), still {num(cheaper.suggested.planned_converts, 0)} planned converts for {num(cheaper.suggested.farmers_to_convert)} needed.
                    </div>
                  )}
                </Panel>
              </Grid>

              {(stock || events) && (
                <Grid cols="1fr 1.3fr">
                  {stock && (
                    <Panel icon={<Truck size={16} />} title="5 · Stock Requirement for Dealers">
                      <dl className="kv">
                        <dt>Required</dt><dd>{num(stock.required_packs)} packs × {stock.pack_kg} kg ({num((stock.required_packs * stock.pack_kg) / 1000, 1)} t)</dd>
                        <dt>Crop stage</dt><dd>{stock.stage}: {stock.stage_window.from} → {stock.stage_window.to}</dd>
                        <dt>Stock at dealers by</dt><dd><strong>{stock.stock_needed_by}</strong> ({stock.lead_time_days}-day lead time)</dd>
                      </dl>
                      <Btn small variant="ghost" to="s5.2" icon={<ArrowRight size={12} />}>Readiness view (S5.2)</Btn>
                    </Panel>
                  )}
                  {events && (
                    <Panel icon={<CalendarDays size={16} />} title={`5 · Field Activity Calendar (${events.length} events)`} actions={<Btn small variant="ghost" onClick={() => go('p.3')}>Execution view <ArrowRight size={12} /></Btn>}>
                      <div className="proto-months">
                        {Object.entries(events.reduce<Record<string, number>>((acc, event) => {
                          const month = new Date(`${event.scheduled_date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                          acc[month] = (acc[month] ?? 0) + 1;
                          return acc;
                        }, {})).map(([month, count]) => <span key={month}><b>{count}</b>{month}</span>)}
                      </div>
                      <DataTable compact rows={events.slice(0, 8)} columns={[
                        { key: 'scheduled_date', label: 'Date' },
                        { key: 'activity_name', label: 'Activity' },
                        { key: 'status', label: 'Status', render: (event: CalendarEvent) => <Pill tone="blue">{event.status}</Pill> },
                      ]} />
                      {events.length > 8 && <p className="note">+ {events.length - 8} more events scheduled across pre-, on- and post-season windows.</p>}
                    </Panel>
                  )}
                </Grid>
              )}
            </>
          )}
        </div>
      </Grid>

      <Grid cols="1.2fr 1fr">
        <Panel icon={<FileSpreadsheet size={16} />} title="Saved Plans in the Database" actions={<Btn small variant="ghost" icon={<RefreshCw size={12} />} onClick={recent.reload}>Refresh</Btn>}>
          <DataTable compact rows={recent.data?.items ?? []} columns={[
            { key: 'id', label: '#', render: (row: PlanList['items'][number]) => <strong>#{row.id}</strong> },
            { key: 'mu_name', label: 'Market unit' },
            { key: 'crop_name', label: 'Crop' },
            { key: 'target_treated_pct', label: 'Target', align: 'right', render: (row: PlanList['items'][number]) => pct(row.target_treated_pct, 1) },
            { key: 'budget', label: 'Budget', align: 'right', render: (row: PlanList['items'][number]) => inr(row.result.budget_total) },
            { key: 'version', label: 'Ver.', align: 'center' },
            { key: 'status', label: 'Status', render: (row: PlanList['items'][number]) => <Pill tone={STATUS_TONE[row.status] ?? 'grey'}>{row.status}</Pill> },
          ]} />
        </Panel>
        <ApiConsole />
      </Grid>
    </div>
  );
}

/* ================================================================== P.3 Live execution & performance */

type Performance = {
  kpis: Record<string, number | string | null>;
  progress_by_activity: { activity: string; planned: number; done: number }[];
  conversion_by_activity: { activity: string; calls: number; positives: number; conversion_rate: number | null }[];
};
type Callback = { id: number; farmer_name: string; activity_name: string; called_at: string | null };
type MdoEvent = { id: number; scheduled_date: string; status: string; activity_name: string; mu_name: string; crop_name: string };
type AuditFlag = { flag_id: number; flag_type: string; detail: string; scheduled_date: string; activity_name: string; mu_name: string };

export function LiveOperations() {
  const { toast } = useNav();
  const perf = useApi<Performance>('/performance');
  const dash = useApi<Dashboard>('/dashboard');
  const mdo = useApi<MdoEvent[]>('/mdo/today');
  const callbacks = useApi<Callback[]>('/callbacks/queue');
  const audit = useApi<AuditFlag[]>('/audit-queue');
  const [busy, setBusy] = useState<number | null>(null);

  const reloadAll = () => { perf.reload(); dash.reload(); mdo.reload(); callbacks.reload(); audit.reload(); };

  const recordCallback = async (item: Callback, outcome: 'bought' | 'will' | 'no') => {
    setBusy(item.id);
    try {
      await api(`/callbacks/${item.id}`, { method: 'POST', body: JSON.stringify({ will_buy: outcome !== 'no', bought: outcome === 'bought' }) });
      toast(`${item.farmer_name}: callback recorded (${outcome === 'bought' ? 'bought' : outcome === 'will' ? 'will buy' : 'not interested'}) · KPIs refreshed`);
      perf.reload(); callbacks.reload();
    } catch (error) {
      toast(`Callback failed: ${(error as Error).message}`);
    } finally { setBusy(null); }
  };
  const resolveFlag = async (flag: AuditFlag) => {
    try {
      await api(`/audit-flags/${flag.flag_id}`, { method: 'PATCH', body: JSON.stringify({ resolved: true }) });
      toast('Audit flag resolved'); audit.reload(); perf.reload();
    } catch (error) { toast(`Could not resolve: ${(error as Error).message}`); }
  };

  const k = perf.data?.kpis ?? {};
  const n = (key: string) => (typeof k[key] === 'number' ? (k[key] as number) : null);

  return (
    <div className="stack proto">
      <PageHeader
        code="P.3"
        title="Live Execution & Performance"
        subtitle="Field execution, call-centre callbacks, conversions and liquidation, read live from the backend. Record a callback below and watch the KPIs update."
        badge={<Pill tone="green"><span className="proto-live-dot" />Live backend</Pill>}
        back="p.2"
        actions={<>
          <Btn icon={<RefreshCw size={14} />} onClick={reloadAll}>Refresh all</Btn>
          <Btn icon={<LineChart size={14} />} to="s7.1">Designed impact view (S7.1)</Btn>
        </>}
      />
      {perf.error && <div className="danger-box small">Backend unreachable: {perf.error}{backendHint}</div>}

      <KpiRow>
        <Kpi icon={<CalendarDays size={18} />} label="Activity completion" value={pct(n('activity_completion'))} sub={`${num(n('done_events'))} of ${num(n('scheduled_events'))} scheduled`} />
        <Kpi icon={<Users size={18} />} label="Verified unique reach" value={num(n('verified_unique_reach'))} sub="Farmers with consent & contact" />
        <Kpi icon={<Wallet size={18} />} label="Budget utilisation" value={pct(n('budget_utilisation'))} sub={`${inr(n('actual_spend'))} spent`} />
        <Kpi icon={<BadgeCheck size={18} />} label="Converted farmers" value={num(n('converted_farmers'))} sub={`${inr(n('cost_per_converted_farmer'))} per conversion`} />
        <Kpi icon={<Boxes size={18} />} label="Liquidation vs plan" value={pct(n('liquidation_vs_plan'))} sub={`${num(n('liquidated_packs'))} packs liquidated`} />
        <Kpi icon={<Sprout size={18} />} label="Demo yield gain" value={pct(n('demo_yield_gain'))} sub={`${inr(n('demo_value_gain_per_acre'))} / acre`} />
      </KpiRow>

      <Grid cols="1.1fr 1fr 1fr">
        <Panel icon={<ClipboardCheck size={16} />} title="Activity Progress (done vs planned)">
          <HBars rows={(perf.data?.progress_by_activity ?? []).map((row) => ({ label: row.activity, value: row.planned ? (row.done / row.planned) * 100 : 0, display: `${row.done}/${row.planned}`, tone: row.done >= row.planned ? 'green' : 'amber' }))} max={100} />
        </Panel>
        <Panel icon={<PhoneCall size={16} />} title="Conversion by Activity (callbacks)">
          <DataTable compact rows={perf.data?.conversion_by_activity ?? []} columns={[
            { key: 'activity', label: 'Activity' },
            { key: 'calls', label: 'Calls', align: 'right' },
            { key: 'positives', label: 'Bought', align: 'right' },
            { key: 'conversion_rate', label: 'Rate', align: 'right', render: (row: Performance['conversion_by_activity'][number]) => <strong>{pct(row.conversion_rate)}</strong> },
          ]} />
        </Panel>
        <Panel icon={<Boxes size={16} />} title="Liquidation by Month (packs)">
          <VBars
            data={(dash.data?.liquidation_by_month ?? []).map((row) => ({ label: row.month, values: [row.po_packs, row.liquidated] }))}
            series={[{ label: 'Purchase orders', color: COLORS.light }, { label: 'Liquidated', color: COLORS.dark }]}
            height={150}
          />
        </Panel>
      </Grid>

      <Grid cols="1fr 1fr">
        <Panel icon={<PhoneCall size={16} />} title={`Call-centre Callback Queue (${callbacks.data?.length ?? 0})`} subtitle="Record the farmer's response. The conversion KPI and learned conversion rates update in the backend.">
          <div className="proto-queue">
            {(callbacks.data ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className="proto-queue-row">
                <span><strong>{item.farmer_name}</strong><small>after: {item.activity_name}</small></span>
                <div className="proto-queue-actions">
                  <Btn small variant="primary" disabled={busy === item.id} onClick={() => void recordCallback(item, 'bought')}>Bought</Btn>
                  <Btn small disabled={busy === item.id} onClick={() => void recordCallback(item, 'will')}>Will buy</Btn>
                  <Btn small variant="ghost" disabled={busy === item.id} onClick={() => void recordCallback(item, 'no')}>No</Btn>
                </div>
              </div>
            ))}
            {callbacks.data?.length === 0 && <p className="small muted">Queue is empty: all callbacks recorded.</p>}
          </div>
        </Panel>
        <Panel icon={<CalendarDays size={16} />} title="MDO Field Queue · Next Activities">
          <DataTable compact rows={(mdo.data ?? []).slice(0, 7)} columns={[
            { key: 'scheduled_date', label: 'Date' },
            { key: 'activity_name', label: 'Activity' },
            { key: 'mu_name', label: 'Market unit' },
            { key: 'status', label: 'Status', render: (row: MdoEvent) => <Pill tone="blue">{row.status}</Pill> },
          ]} />
          <p className="note">Field reports (attendance, cost, GPS, photo hash, farmer contacts) post to <code>POST /api/events/&#123;id&#125;/report</code>; the proposed offline field app uses the same API.</p>
        </Panel>
      </Grid>

      <Grid cols="1.4fr 1fr">
        <Panel icon={<MapPin size={16} />} title="Market Units · Segmentation from the Engine">
          <DataTable compact rows={dash.data?.market_units ?? []} columns={[
            { key: 'mu_name', label: 'Market unit', render: (row: MarketRow) => <strong>{row.mu_name}</strong> },
            { key: 'district', label: 'District' },
            { key: 'crop', label: 'Crop' },
            { key: 'segment', label: 'Segment', render: (row: MarketRow) => <Pill tone={SEGMENT_TONE[row.segment] ?? 'grey'}>{row.segment}</Pill> },
            { key: 'penetration', label: 'Penetration', render: (row: MarketRow) => <Progress value={row.penetration * 100} label={pct(row.penetration)} tone={row.penetration > 0.7 ? 'amber' : 'green'} /> },
            { key: 'headroom_acres', label: 'Headroom', align: 'right', render: (row: MarketRow) => `${num(row.headroom_acres)} ac` },
          ]} />
        </Panel>
        <div className="stack">
          <Panel icon={<ShieldCheck size={16} />} title={`Audit Queue (${audit.data?.length ?? 0})`} subtitle="Automatic integrity flags on field reports (photo reuse, GPS distance, attendance anomalies).">
            {(audit.data ?? []).map((flag) => (
              <div key={flag.flag_id} className="proto-queue-row">
                <span><strong>{flag.flag_type.replace(/_/g, ' ')}</strong><small>{flag.activity_name} · {flag.mu_name} · {flag.scheduled_date}</small></span>
                <Btn small onClick={() => void resolveFlag(flag)}>Resolve</Btn>
              </div>
            ))}
            {audit.data?.length === 0 && <p className="small muted">No open flags.</p>}
          </Panel>
          <ApiConsole />
        </div>
      </Grid>
    </div>
  );
}

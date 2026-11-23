/** Marketing Head screens 1–5: national overview, regional opportunity and business & crop plan reviews. */
import {
  ArrowRight, ChartColumn, CircleCheck, ClipboardCheck, Eye, FileSearch, Flag, Layers, ListChecks, MapPin, MessageSquare, Send, ShieldCheck, Sprout, Target,
  Lightbulb, TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { AMBAD, NATIONAL, planCampaignsOf, mixBy, type Season } from '../../data/bh';
import { crore, lakh, num, pct, times } from '../../data/format';
import { FUNNEL_DEFAULTS } from '../../data/fsm';
import { planCrops, planStatus as zmPlanStatus } from '../../data/zm';
import { useFsmStore } from '../../store/fsmStore';
import {
  ambadPlan, ambadVillages, MH_PLAN_LABEL, otherMaharashtra, PREVIOUS_CAMPAIGNS, REGION_OPPORTUNITY, regionName, regionRows, themeEffectiveness, WEST_PLANS,
  WEST_STATES, westSalesTotal, nationalRow, type MhPlanStatus,
} from '../../data/mh';
import { M, type MhRegionId, type ZmTerritoryId } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useMhStore } from '../../store/mhStore';
import { useZmStore } from '../../store/zmStore';
import { Sparkline, TrendLine } from '../../ui/charts';
import { DataTable } from '../../ui/DataTable';
import { Bar, Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, type Evidence } from '../../ui/overlay';
import { ALL, opt, useGo } from '../common';
import { Field, List, Notes } from '../zm/parts';
import { MhPage, MH_REGIONS, MH_SECTION, useMhRegion } from './frame';
import { useParams } from 'react-router-dom';

const cr = (x: number) => `₹${num(x)} Cr`;
const range = (r: [number, number], unit = '%') => `${r[0]}–${r[1]}${unit}`;
const signed = (p: number) => `${p >= 0 ? '+' : '–'}${Math.abs(p).toFixed(1)}%`;
const LEVEL_TONE: Record<string, Tone> = { High: 'ok', 'Medium–High': 'warn', Medium: 'neutral' };
const PLAN_TONE: Record<MhPlanStatus, Tone> = { reviewed: 'ok', under_review: 'warn', not_started: 'neutral', clarification: 'risk' };
const CONF_TONE: Record<string, Tone> = { Verified: 'ok', Estimated: 'warn', 'Partial attribution': 'neutral', High: 'ok', Moderate: 'warn', Limited: 'neutral' };

/** Plan status: Marketing Head override (clarification), else Maharashtra follows the Zonal Manager's Ambad decision, else the base. */
export function usePlanStatus() {
  const mh = useMhStore();
  const zm = useZmStore();
  return (id: string): MhPlanStatus => {
    if (mh.planStatus[id]) return mh.planStatus[id];
    if (id === 'maharashtra') { const d = zm.planDecisions.ambad; return d === 'endorsed' ? 'reviewed' : d === 'returned' ? 'clarification' : 'under_review'; }
    return WEST_PLANS.find((p) => p.id === id)?.base ?? 'not_started';
  };
}
const planChip = (st: MhPlanStatus) => <StatusChip tone={PLAN_TONE[st]}>{MH_PLAN_LABEL[st]}</StatusChip>;
const zmReviewEvidence = (): Evidence => {
  const a = ambadPlan();
  return {
    title: 'Zonal Manager review: Maharashtra onion plan', owner: 'Zonal Manager · Marathwada zone',
    facts: [
      { label: 'Ambad territory ABP (all products)', value: crore(a.abp) },
      { label: 'Approved onion allocation', value: crore(a.onionAllocation) },
      { label: 'Onion conversion growth objective', value: lakh(a.growthObjective) },
      { label: 'Submitted plan', value: crore(a.plan) },
      { label: 'Croptek SKU contribution', value: crore(a.croptekSku) },
    ],
  };
};

// ---------------------------------------------------------------- shared clarification drawer (writes a question to the Zonal Manager)
const TOPICS = ['Growth objective basis', 'Volume and coverage assumptions', 'Realisation and product mix', 'Channel readiness', 'Plan consolidation timing'];
export function ClarificationDrawer({ planId, subject, onClose }: { planId: string; subject: string; onClose: () => void }) {
  const bh = useBhStore();
  const mh = useMhStore();
  const zm = useZmStore();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [question, setQuestion] = useState('');
  const [due, setDue] = useState('');
  const [tried, setTried] = useState(false);
  const err = question.trim().length < 10 ? 'Enter the clarification question (at least 10 characters)' : '';
  const send = () => {
    setTried(true);
    if (err) return;
    zm.addQuestion({ id: `mh-${planId}-${Date.now()}`, question: question.trim(), topic });
    mh.setPlanStatus(planId, 'clarification');
    bh.toast(`Clarification requested from the Zonal Manager · ${subject}`);
    onClose();
  };
  return (
    <Drawer title={`Request clarification: ${subject}`} width={620} onClose={onClose}
      status={<StatusChip tone="neutral">Draft</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send to Zonal Manager</Button>} />}>
      <Field label="Recipient"><Select label="Recipient" value="zm" onChange={() => undefined} options={[opt('zm', 'Zonal Manager · Marathwada zone')]} /></Field>
      <Field label="Topic *"><Select label="Topic" value={topic} onChange={setTopic} options={TOPICS.map((t) => opt(t, t))} /></Field>
      <Field label="Clarification question *" error={tried ? err : ''}><textarea className="input" rows={4} maxLength={600} aria-label="Clarification question" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
      <Field label="Response due date"><input className="input" type="date" aria-label="Response due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
    </Drawer>
  );
}

// ================================================================ 1 National Marketing Opportunity & Performance
type OverviewView = 'region' | 'crop' | 'product';
export function NationalOverview() {
  const go = useGo();
  const mh = useMhStore();
  const [view, setView] = useState<OverviewView>('region');
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [season, setSeason] = useState(ALL);
  const [sortBy, setSortBy] = useState('market');
  const region = mh.scope === 'national' ? ALL : mh.scope;
  const rows = regionRows().filter((r) => (region === ALL || r.id === region) && (crop === ALL || r.crop === crop) && (product === ALL || r.product === product))
    .sort((a, b) => (sortBy === 'roi' ? b.roi - a.roi : sortBy === 'growth' ? b.trendGrowthPct - a.trendGrowthPct : sortBy === 'name' ? a.name.localeCompare(b.name) : b.market - a.market));
  const mix = mixBy(view === 'product' ? 'product' : 'crop', season === ALL ? 'all' : (season as Season))
    .filter((m) => (view === 'crop' ? crop === ALL || m.name === crop : product === ALL || m.name === product))
    .sort((a, b) => b.sales - a.sales);
  const n = nationalRow();
  const themes = themeEffectiveness();
  const growths = regionRows().map((r) => r.trendGrowthPct);
  const top = [...regionRows()].sort((a, b) => b.trendGrowthPct - a.trendGrowthPct)[0];
  const best = [...themes].sort((a, b) => b.roi - a.roi)[0];
  const low = [...themes].sort((a, b) => a.roi - b.roi)[0];
  const under = regionRows().filter((r) => r.level === 'High' && r.penetration[1] <= 20);
  return (
    <MhPage {...MH_SECTION.overview} title="National Marketing Opportunity & Performance" back={M.assistant} next={M.opportunity(region === ALL ? 'west' : (region as MhRegionId))} nextLabel="Explore regional opportunity and sales trends">
      <FilterRows<OverviewView> view={view} setView={setView}
        views={[opt('region', 'Region-wise'), opt('crop', 'Crop-wise'), opt('product', 'Product-wise')] as { value: OverviewView; label: string }[]}
        filters={[
          { key: 'region', label: 'Region', value: region, options: [opt(ALL, 'All regions'), ...MH_REGIONS.map((r) => opt(r, `${regionName(r)} region`))], onChange: (v) => mh.setScope(v === ALL ? 'national' : (v as MhRegionId)) },
          { key: 'crop', label: 'Crop', value: crop, options: [opt(ALL, 'All crops'), ...[...new Set([...REGION_OPPORTUNITY.map((r) => r.crop), ...mixBy('crop').map((m) => m.name)])].map((c) => opt(c, c))], onChange: setCrop },
          { key: 'product', label: 'Product', value: product, options: [opt(ALL, 'All products'), ...mixBy('product').map((m) => opt(m.name, m.name))], onChange: setProduct },
          { key: 'season', label: 'Season', value: season, options: [opt(ALL, 'All seasons'), opt('Kharif', 'Kharif'), opt('Rabi', 'Rabi')], onChange: setSeason },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('market', 'Market opportunity'), opt('growth', 'Sales momentum'), opt('roi', 'Net ROI'), opt('name', 'Region name')] }]} />
      <div className="kpis">
        <KpiCard label="Addressable market opportunity" value={cr(n.market)} />
        <KpiCard label="Sales momentum in priority markets" value={`${signed(Math.min(...growths))} to ${signed(Math.max(...growths))}`} />
        <KpiCard label="Validated incremental sales" value={crore(n.validatedSales)} />
        <KpiCard label="National campaign net ROI" value={times(n.roi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={view === 'region' ? 'National and regional opportunity pulse' : view === 'crop' ? 'Crop-wise campaign performance' : 'Product-wise campaign performance'} icon={Layers} flush>
          {view === 'region' ? (
            <DataTable rows={rows} rowKey={(r) => r.id} onRowClick={(r) => go(M.opportunity(r.id))}
              columns={[
                { key: 'r', header: 'Region', render: (r) => <b>{r.name} region</b> },
                { key: 'm', header: 'Market opportunity', align: 'right', render: (r) => cr(r.market) },
                { key: 'l', header: 'Opportunity', align: 'center', render: (r) => <span className="stack" style={{ gap: 2, alignItems: 'center' }} title={r.gap}><StatusChip tone={LEVEL_TONE[r.level]}>{r.level}</StatusChip><small className="muted">{r.gap}</small></span> },
                { key: 'p', header: 'Priority crop · product', render: (r) => `${r.crop} · ${r.product}` },
                { key: 't', header: 'Sales trend (Q1–Q4)', align: 'center', render: (r) => <Sparkline values={r.trend} label={`${r.name}: ${r.trend.map((v) => `₹${v} L`).join(', ')}`} /> },
                { key: 'c', header: 'Campaigns', align: 'right', render: (r) => num(r.campaigns) },
                { key: 'o', header: 'Net ROI', align: 'right', render: (r) => times(r.roi) },
                { key: 'x', header: 'Explore', align: 'center', render: (r) => <Button small primary={r.id === 'west'} icon={ArrowRight} onClick={() => go(M.opportunity(r.id))}>Explore</Button> },
              ]}
              total={{ r: 'Total', m: cr(rows.reduce((s, r) => s + r.market, 0)), c: num(rows.reduce((s, r) => s + r.campaigns, 0)) }} />
          ) : (
            <DataTable rows={mix} rowKey={(m) => m.id}
              columns={[
                { key: 'n', header: view === 'crop' ? 'Crop' : 'Product', render: (m) => <b>{m.name}</b> },
                { key: 'c', header: 'Campaigns', align: 'right', render: (m) => num(m.campaigns) },
                { key: 'i', header: 'Investment', align: 'right', render: (m) => lakh(m.investment) },
                { key: 'a', header: 'Adopters', align: 'right', render: (m) => num(m.adopters) },
                { key: 's', header: 'Validated sales', align: 'right', render: (m) => lakh(m.sales) },
                { key: 'o', header: 'Net ROI', align: 'right', render: (m) => times((m.sales * 0.35 - m.investment) / m.investment) },
              ]}
              total={{ n: 'Total', c: num(mix.reduce((s, m) => s + m.campaigns, 0)), i: lakh(mix.reduce((s, m) => s + m.investment, 0)), a: num(mix.reduce((s, m) => s + m.adopters, 0)), s: lakh(mix.reduce((s, m) => s + m.sales, 0)) }} />
          )}
        </Card>
        <Notes title="Opportunity notes" items={[
          `${top.name} has the strongest sales momentum (${signed(top.trendGrowthPct)} Q1 to Q4) in ${top.crop} · ${top.product}.`,
          `${under.map((r) => r.name).join(' and ')} combine high opportunity with ${range(under[0].penetration)} penetration: under-indexing.`,
          `${best.name} returned ${times(best.roi)} historically; ${low.name.toLowerCase()} returned ${times(low.roi)}.`,
          `National validated incremental sales ${crore(n.validatedSales)} on ${crore(n.investment)} invested.`,
          `${num(NATIONAL.campaigns)} campaigns reached ${num(NATIONAL.adopters)} adopters across ${MH_REGIONS.length} regions.`,
        ]} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title="Historical campaign effectiveness" icon={ChartColumn} flush>
          <DataTable rows={themes} rowKey={(t) => t.id}
            columns={[
              { key: 't', header: 'Campaign theme', render: (t) => <b>{t.name}</b> },
              { key: 'e', header: 'Engagement', align: 'right', render: (t) => range(t.engagement) },
              { key: 'a', header: 'Adoption uplift', align: 'right', render: (t) => `+${range(t.adoption)}` },
              { key: 's', header: 'Validated sales', align: 'right', render: (t) => crore(t.sales) },
              { key: 'r', header: 'Net ROI', align: 'right', render: (t) => times(t.roi) },
              { key: 'c', header: 'Confidence', align: 'center', render: (t) => <StatusChip tone={CONF_TONE[t.confidence]}>{t.confidence}</StatusChip> },
            ]} />
        </Card>
        <Card title="Marketing investment status" icon={ShieldCheck}>
          <List items={[
            { label: 'Approved budget', value: crore(NATIONAL.approved) },
            { label: 'Invested to date', value: crore(NATIONAL.actual) },
            { label: 'Utilisation', value: pct((NATIONAL.actual / NATIONAL.approved) * 100) },
            { label: 'Unspent', value: crore(NATIONAL.approved - NATIONAL.actual) },
          ]} />
        </Card>
      </div>
    </MhPage>
  );
}

// ================================================================ 2 Regional Market Opportunity & Product Sales
type OppView = 'market' | 'trend' | 'campaigns';
export function RegionalOpportunity() {
  const go = useGo();
  const r = useMhRegion();
  const o = regionRows().find((x) => x.id === r)!;
  const [view, setView] = useState<OppView>('trend');
  const [state, setState] = useState(ALL);
  const [crop, setCrop] = useState(o.crop);
  const [product, setProduct] = useState(o.product);
  const [sortBy, setSortBy] = useState('market');
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const states = r === 'west' ? WEST_STATES : [{ state: `${o.name} region`, market: o.marketRange, penetration: o.penetration }];
  const stateRows = states.filter((s) => state === ALL || s.state === state).sort((a, b) => (sortBy === 'penetration' ? a.penetration[0] - b.penetration[0] : b.market[1] - a.market[1]));
  const camps = planCampaignsOf(r).filter((c) => (crop === ALL || c.crop === crop || true) && (product === ALL || c.product === product || true));
  const prev = r === 'west' ? PREVIOUS_CAMPAIGNS : themeEffectiveness().slice(0, 3).map((t) => ({ intervention: t.short, engagementPct: Math.round((t.engagement[0] + t.engagement[1]) / 2), evidence: `${crore(t.sales)} validated at ${times(t.roi)}`, confidence: t.confidence === 'Verified' ? 'High' as const : 'Moderate' as const }));
  const trendData = o.trend.map((v, i) => ({ q: `Q${i + 1}`, v }));
  const [q1, q2, q3, q4] = o.trend;
  const firstHalf = q1 + q2;
  const secondHalf = q3 + q4;
  const total = r === 'west' ? westSalesTotal() : o.trendTotal;
  const maxMarket = Math.max(...states.map((s) => s.market[1]));
  const src: Evidence = { title: `Source analysis: ${o.name} region · ${o.crop} · ${o.product}`, owner: 'Market sizing, secondary sales and campaign records', facts: [
    { label: 'Addressable crop / product market', value: range(o.marketRange, ' Cr').replace(/^/, '₹') },
    { label: 'Product penetration', value: range(o.penetration) },
    { label: 'Secondary sales Q1–Q4', value: o.trend.map((v) => `₹${v} L`).join(' → ') },
    { label: 'Four-quarter total', value: crore(total) },
    { label: 'Region validated incremental sales', value: crore(o.validatedSales) },
  ] };
  return (
    <MhPage {...MH_SECTION.opportunity} trail={`${o.name} region`} title="Regional Market Opportunity & Product Sales" back={M.overview} next={M.plans} nextLabel="Review related business and crop plans">
      <FilterRows<OppView> view={view} setView={setView}
        views={[opt('market', 'Market'), opt('trend', 'Sales trend'), opt('campaigns', 'Campaigns')] as { value: OppView; label: string }[]}
        filters={[
          { key: 'region', label: 'Region', value: r, options: MH_REGIONS.map((x) => opt(x, `${regionName(x)} region`)), onChange: (v) => go(M.opportunity(v as MhRegionId)) },
          { key: 'state', label: 'State', value: state, options: [opt(ALL, 'All states'), ...states.map((s) => opt(s.state, s.state))], onChange: setState },
          { key: 'crop', label: 'Crop', value: crop, options: [opt(ALL, 'All crops'), ...[...new Set([o.crop, ...planCampaignsOf(r).map((c) => c.crop)])].map((c) => opt(c, c))], onChange: setCrop },
          { key: 'product', label: 'Product', value: product, options: [opt(ALL, 'All products'), ...[...new Set([o.product, ...planCampaignsOf(r).map((c) => c.product)])].map((c) => opt(c, c))], onChange: setProduct },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('market', 'Addressable market'), opt('penetration', 'Lowest penetration')] }]} />
      <div className="kpis">
        <KpiCard label={`Addressable ${o.crop.toLowerCase()} · ${o.product} market`} value={`₹${o.marketRange[0]}–${o.marketRange[1]} Cr`} />
        <KpiCard label="Relative product penetration" value={range(o.penetration)} />
        <KpiCard label="Historical sales momentum (Q1–Q4)" value={signed(o.trendGrowthPct)} />
        <KpiCard label="Region net ROI" value={times(o.roi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={view === 'trend' ? `Product sales trend: ${o.product} (${o.crop}), ${r === 'west' ? 'Maharashtra' : `${o.name} region`}` : view === 'market' ? `Market opportunity vs product penetration (${o.name} region)` : `${o.name} region campaigns`} icon={TrendingUp}
          flush={view !== 'trend'} right={<Button small icon={FileSearch} onClick={() => setEvidence(src)}>View source analysis</Button>}>
          {view === 'trend' ? (
            <>
            <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 170px', alignItems: 'center' }}>
              <TrendLine data={trendData} x="q" y="v" height={250} format={(v) => `₹${v} L`} tooltip={(d) => `${d.q} · secondary sales ₹${d.v} L`} />
              <div className="recon compact" style={{ gridTemplateColumns: '1fr' }}><div><span>Four-quarter total</span><b>{crore(total)}</b></div></div>
            </div>
            <div className="list-row" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)' }}>
              <Lightbulb size={18} aria-hidden="true" />
              <div>
                <b>Second-half sales</b>
                <div>Combined Q3 and Q4 sales reached {lakh(secondHalf)}, compared with {lakh(firstHalf)} in Q1 and Q2.
                  {' '}The second half accounted for {pct(secondHalf / total * 100, 0)} of four-quarter sales.</div>
              </div>
            </div>
            </>
          ) : view === 'market' ? (
            <DataTable rows={stateRows} rowKey={(s) => s.state}
              columns={[
                { key: 's', header: 'State', render: (s) => <b>{s.state}</b> },
                { key: 'm', header: 'Addressable opportunity', align: 'right', render: (s) => `₹${s.market[0]}–${s.market[1]} Cr` },
                { key: 'b', header: 'Opportunity', render: (s) => <div style={{ minWidth: 140 }}><Bar value={(s.market[1] / maxMarket) * 100} /></div> },
                { key: 'p', header: 'Product penetration', align: 'right', render: (s) => range(s.penetration) },
                { key: 'q', header: 'Penetration', render: (s) => <div style={{ minWidth: 100 }}><Bar value={(s.penetration[1] / 30) * 100} tone="amber" /></div> },
              ]} />
          ) : (
            <DataTable rows={camps} rowKey={(c) => c.id}
              columns={[
                { key: 'n', header: 'Campaign', render: (c) => <b>{c.name}</b> },
                { key: 'c', header: 'Crop · product', render: (c) => `${c.crop} · ${c.product}` },
                { key: 'i', header: 'Investment', align: 'right', render: (c) => lakh(c.actual) },
                { key: 'a', header: 'Adopters', align: 'right', render: (c) => num(c.adopters) },
                { key: 's', header: 'Validated sales', align: 'right', render: (c) => lakh(c.sales) },
                { key: 'r', header: 'Net ROI', align: 'right', render: (c) => times((c.sales * 0.35 - c.actual) / c.actual) },
              ]} />
          )}
        </Card>
        <Notes title="Opportunity notes" right={<Button small icon={Target} onClick={() => go(M.diagnosis)}>Identify campaign opportunities</Button>} items={[
          `Sales rose ${o.trend.map((v) => `₹${v} L`).join(' → ')} (${signed(o.trendGrowthPct)}) while penetration is ${range(o.penetration)}.`,
          `Addressable ${o.crop.toLowerCase()} market of ₹${o.marketRange[0]}–${o.marketRange[1]} Cr against ${crore(total)} of four-quarter sales.`,
          r === 'west' ? `Gujarat has the highest penetration (${range(WEST_STATES[1].penetration)}); Madhya Pradesh the lowest (${range(WEST_STATES[2].penetration)}).` : `${o.name} region: ${num(o.campaigns)} campaigns, ${num(o.adopters)} adopters.`,
          `Region validated ${crore(o.validatedSales)} at ${times(o.roi)} net ROI.`,
          `Evaluate retailer-led conversion for ${o.product} in high-potential ${o.crop.toLowerCase()} markets.`,
        ]} />
      </div>
      <Card title={`Previous campaign effectiveness (${o.product}, ${o.crop})`} icon={ChartColumn} flush>
        <DataTable rows={prev} rowKey={(p) => p.intervention}
          columns={[
            { key: 'i', header: 'Campaign intervention', render: (p) => <b>{p.intervention}</b> },
            { key: 'e', header: 'Engagement / adoption', render: (p) => <span className="row" style={{ justifyContent: 'center' }}><div style={{ width: 160 }}><Bar value={p.engagementPct} /></div><b>{pct(p.engagementPct, 0)}</b></span> },
            { key: 'c', header: 'Commercial evidence', render: (p) => p.evidence },
            { key: 'q', header: 'Evidence confidence', align: 'center', render: (p) => <StatusChip tone={CONF_TONE[p.confidence]}>{`${p.confidence} evidence`}</StatusChip> },
          ]} />
      </Card>
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}

// ================================================================ 3 Business & Crop Plan Alignment Review
type PlanView = 'plans' | 'exceptions';
const planCropParam = (id: string) => (id === 'maharashtra' ? 'onion' : id);
export function PlanAlignment() {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const statusOf = usePlanStatus();
  const [view, setView] = useState<PlanView>('plans');
  const [region, setRegion] = useState('west');
  const [state, setState] = useState(ALL);
  const [crop, setCrop] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [sortBy, setSortBy] = useState('objective');
  const [clar, setClar] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const rows = WEST_PLANS.filter((p) => (state === ALL || p.state === state) && (crop === ALL || p.crop === crop) && (status === ALL || statusOf(p.id) === status))
    .sort((a, b) => (sortBy === 'state' ? a.state.localeCompare(b.state) : b.objective - a.objective));
  const exceptions = rows.filter((p) => statusOf(p.id) !== 'reviewed').map((p) => ({ ...p, issue: statusOf(p.id) === 'clarification' ? 'Clarification requested from the Zonal Manager' : statusOf(p.id) === 'under_review' ? 'Consolidated plan under Zonal Manager review' : 'Consolidated plan not yet started' }));
  const a = ambadPlan();
  const o = regionRows().find((x) => x.id === 'west')!;
  const reviewed = WEST_PLANS.filter((p) => statusOf(p.id) === 'reviewed').length;
  return (
    <MhPage {...MH_SECTION.plans} title="Business & Crop Plan Alignment Review" back={M.opportunity('west')} next={M.planDetail('west', 'onion')} nextLabel="Review the Maharashtra onion plan">
      <FilterRows<PlanView> view={view} setView={setView}
        views={[opt('plans', 'Plans'), opt('exceptions', 'Exceptions')] as { value: PlanView; label: string }[]}
        filters={[
          { key: 'region', label: 'Region', value: region, options: [opt('west', 'West region')], onChange: setRegion },
          { key: 'state', label: 'State', value: state, options: [opt(ALL, 'All states'), ...WEST_PLANS.map((p) => opt(p.state, p.state))], onChange: setState },
          { key: 'crop', label: 'Crop', value: crop, options: [opt(ALL, 'All crops'), ...[...new Set(WEST_PLANS.map((p) => p.crop))].map((c) => opt(c, c))], onChange: setCrop },
          { key: 'status', label: 'Review status', value: status, options: [opt(ALL, 'All statuses'), ...(Object.keys(MH_PLAN_LABEL) as MhPlanStatus[]).map((s) => opt(s, MH_PLAN_LABEL[s]))], onChange: setStatus },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('objective', 'Growth objective'), opt('state', 'State')] }]} />
      <div className="kpis">
        <KpiCard label="Maharashtra onion market" value={`₹${WEST_STATES[0].market[0]}–${WEST_STATES[0].market[1]} Cr`} />
        <KpiCard label="Product penetration" value={range(WEST_STATES[0].penetration)} />
        <KpiCard label="Secondary sales Q1–Q4" value={crore(westSalesTotal())} />
        <KpiCard label="Zonal Manager plans reviewed" value={`${reviewed} of ${WEST_PLANS.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title={view === 'plans' ? 'Consolidated regional business and crop plan alignment' : 'Plan review exceptions'} icon={ClipboardCheck} flush>
          {view === 'plans' ? (
            <DataTable rows={rows} rowKey={(p) => p.id} onRowClick={(p) => go(M.planDetail('west', planCropParam(p.id)))}
              columns={[
                { key: 's', header: 'State / market', render: (p) => <b>{p.state} · {p.crop}</b> },
                { key: 'c', header: 'Product and focus', render: (p) => <span className="stack" style={{ gap: 0, alignItems: 'center' }}><b>{p.product}</b><small className="muted">{p.focus}</small></span> },
                { key: 'o', header: 'Submitted growth objective', align: 'right', render: (p) => lakh(p.objective) },
                { key: 'r', header: 'Zonal Manager review', align: 'center', render: (p) => planChip(statusOf(p.id)) },
                { key: 'i', header: 'Identified marketing intervention', render: (p) => p.intervention },
                { key: 'a', header: 'Action', align: 'center', render: (p) => <Button small icon={Eye} onClick={() => go(M.planDetail('west', planCropParam(p.id)))}>View plan</Button> },
              ]}
              total={{ s: 'Total', o: lakh(rows.reduce((s, p) => s + p.objective, 0)) }} />
          ) : (
            <DataTable rows={exceptions} rowKey={(p) => p.id}
              columns={[
                { key: 's', header: 'State', render: (p) => <b>{p.state}</b> },
                { key: 'i', header: 'Exception', render: (p) => p.issue },
                { key: 'r', header: 'Status', align: 'center', render: (p) => planChip(statusOf(p.id)) },
                { key: 'a', header: 'Action', align: 'center', render: (p) => <Button small icon={Eye} onClick={() => go(M.planDetail('west', planCropParam(p.id)))}>View plan</Button> },
              ]} />
          )}
        </Card>
        <Card title="Maharashtra · onion plan context" icon={MapPin} right={<StatusChip tone={PLAN_TONE[statusOf('maharashtra')]}>{MH_PLAN_LABEL[statusOf('maharashtra')]}</StatusChip>}>
          <List items={[
            { label: 'Ambad territory ABP (all products)', value: crore(a.abp) },
            { label: 'Approved onion allocation (in ABP)', value: crore(a.onionAllocation) },
            { label: 'Conversion growth objective (in ABP)', value: lakh(a.growthObjective) },
          ]} />
          <div className="stack" style={{ gap: 8 }}>
            <Button icon={MessageSquare} onClick={() => setClar(true)}>Request clarification</Button>
            <Button icon={FileSearch} onClick={() => setEvidence(zmReviewEvidence())}>View Zonal Manager review</Button>
            <Button primary icon={CircleCheck} disabled={mh.endorsed.includes('maharashtra')} onClick={() => { mh.endorse('maharashtra'); bh.toast('Marketing requirements endorsed for Maharashtra onion'); }}>
              {mh.endorsed.includes('maharashtra') ? 'Marketing requirements endorsed' : 'Endorse marketing requirements'}
            </Button>
          </div>
        </Card>
      </div>
      <div className="grid g3">
        <Card title="Market evidence" icon={ChartColumn}>
          <List items={[{ label: 'Addressable market', value: `₹${o.marketRange[0]}–${o.marketRange[1]} Cr` }, { label: 'Product penetration', value: range(o.penetration) }, { label: 'Secondary sales Q1–Q4', value: o.trend.map((v) => `₹${v} L`).join(' / ') }]} />
        </Card>
        <Card title="Business plan support" icon={Layers}>
          <List items={[{ label: 'Conversion growth objective', value: `${lakh(a.growthObjective)} in ABP` }, { label: 'Zonal Manager review', value: MH_PLAN_LABEL[statusOf('maharashtra')] }, { label: 'Regional crop priority', value: 'Onion · Croptek' }]} />
        </Card>
        <Notes title="Plan notes" items={[
          `Maharashtra onion carries the largest growth objective (${lakh(a.growthObjective)}) inside the ₹${(a.abp / 100).toFixed(2)} Cr Ambad ABP.`,
          `Candidate intervention: retailer-led Croptek conversion; focus on trial-to-conversion.`,
          `${WEST_PLANS.length - reviewed} West plans still await consolidation or review.`,
          `Validate product applicability, channel readiness and Zonal Manager confirmation.`,
        ]} />
      </div>
      {clar && <ClarificationDrawer planId="maharashtra" subject="Maharashtra onion plan" onClose={() => setClar(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}

// ================================================================ 4 Regional Business Plan Detail & Intervention Review
const ZM_LABEL: Record<string, { label: string; tone: Tone }> = {
  endorsed: { label: 'Endorsed', tone: 'ok' }, submitted: { label: 'Under review', tone: 'warn' }, returned: { label: 'Returned', tone: 'risk' }, awaiting: { label: 'Awaiting submission', tone: 'neutral' },
};
export function RegionalPlanDetail() {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const zm = useZmStore();
  const statusOf = usePlanStatus();
  const { crop } = useParams();
  const plan = WEST_PLANS.find((p) => (crop === 'onion' ? p.id === 'maharashtra' : p.id === crop)) ?? WEST_PLANS[0];
  const isMh = plan.id === 'maharashtra';
  const [clar, setClar] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const a = ambadPlan();
  const fsm = useFsmStore();
  const zmStatus = (t: ZmTerritoryId) => zmPlanStatus(t, fsm.submitted, zm.planDecisions);
  const terr = [{ id: 'ambad' as ZmTerritoryId, name: 'Ambad', abp: a.abp, plan: a.plan }, ...otherMaharashtra().map((p) => ({ id: p.id, name: p.name, abp: p.abp, plan: p.plan }))];
  const o = regionRows().find((x) => x.id === 'west')!;
  const shortlist = () => { mh.addShortlist(plan.id); bh.toast(`${plan.state} ${plan.crop.toLowerCase()} added to the campaign opportunity shortlist`); go(M.planTerritory('ambad')); };
  return (
    <MhPage {...MH_SECTION.plans} trail={`${plan.state} · ${plan.crop} · ${plan.product}`} title="Regional Business Plan Detail & Intervention Review" back={M.plans} next={shortlist} nextLabel="Add to campaign opportunity shortlist"
      right={planChip(statusOf(plan.id))}>
      <div className="kpis">
        <KpiCard label={isMh ? 'Ambad territory ABP' : 'Growth objective'} value={isMh ? crore(a.abp) : lakh(plan.objective)} />
        <KpiCard label={isMh ? 'Approved onion allocation' : 'Region addressable market'} value={isMh ? crore(a.onionAllocation) : `₹${o.marketRange[0]}–${o.marketRange[1]} Cr`} />
        <KpiCard label={isMh ? 'Onion conversion growth objective' : 'Product penetration'} value={isMh ? lakh(a.growthObjective) : range(WEST_STATES.find((s) => s.state === plan.state)!.penetration)} />
        <KpiCard label="Contributing territories" value={num(isMh ? terr.length : 0) === '0' ? 'Plan pending' : num(terr.length)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={`Consolidated business and crop plan detail: ${plan.state} (${plan.crop} · ${plan.product})`} icon={ClipboardCheck} flush right={<>
          <Button small icon={MessageSquare} onClick={() => setClar(true)}>Request clarification</Button>
          <Button small icon={FileSearch} onClick={() => setEvidence(zmReviewEvidence())}>View Zonal Manager review</Button>
        </>}>
          {isMh ? (
            <DataTable rows={terr} rowKey={(t) => t.id} onRowClick={(t) => go(M.planTerritory(t.id))}
              columns={[
                { key: 't', header: 'Contributing territory', render: (t) => <b>{t.name}</b> },
                { key: 'a', header: 'Territory ABP', align: 'right', render: (t) => crore(t.abp) },
                { key: 'p', header: 'Submitted plan', align: 'right', render: (t) => crore(t.plan) },
                { key: 'o', header: 'Onion allocation', align: 'right', render: (t) => (t.id === 'ambad' ? crore(a.onionAllocation) : crore(planCrops(t.id)[0].abp)) },
                { key: 'r', header: 'Zonal Manager review', align: 'center', render: (t) => { const s = ZM_LABEL[zmStatus(t.id)]; return <StatusChip tone={s.tone}>{s.label}</StatusChip>; } },
                { key: 'v', header: 'View', align: 'center', render: (t) => <Button small icon={Eye} onClick={() => go(M.planTerritory(t.id))}>{t.id === 'ambad' ? 'View details' : 'View status'}</Button> },
              ]}
              total={{ t: 'Total', a: crore(terr.reduce((s, t) => s + t.abp, 0)), p: crore(terr.reduce((s, t) => s + t.plan, 0)) }} />
          ) : (
            <DataTable rows={[plan]} rowKey={(p) => p.id}
              columns={[
                { key: 's', header: 'State', render: (p) => <b>{p.state}</b> },
                { key: 'f', header: 'Focus', render: (p) => p.focus },
                { key: 'o', header: 'Growth objective', align: 'right', render: (p) => lakh(p.objective) },
                { key: 'r', header: 'Review status', align: 'center', render: (p) => planChip(statusOf(p.id)) },
              ]} />
          )}
        </Card>
        <Notes title="Plan notes" items={[
          isMh ? `West region Croptek conversion is a strong candidate: ${range(o.penetration)} penetration and a ${lakh(a.growthObjective)} growth objective.` : `${plan.state} plan is ${MH_PLAN_LABEL[statusOf(plan.id)].toLowerCase()}.`,
          isMh ? `${terr.filter((t) => zmStatus(t.id) === 'endorsed').length} of ${terr.length} contributing territory plans endorsed by the Zonal Manager.` : `Objective ${lakh(plan.objective)} for ${plan.focus.toLowerCase()}.`,
          'Validate channel readiness and retailer participation.',
          'Assess whether the theme can be aggregated across West territories.',
        ]} />
      </div>
      <div className="grid g2">
        <Card title="Opportunity-to-plan-to-intervention assessment" icon={Target}>
          <List items={[
            { icon: ChartColumn, label: 'Market evidence', value: `₹${o.marketRange[0]}–${o.marketRange[1]} Cr · ${range(o.penetration)}` },
            { icon: Layers, label: 'Business plan support', value: isMh ? `${lakh(a.growthObjective)} conversion growth in ABP` : lakh(plan.objective) },
            { icon: Sprout, label: 'Marketing intervention needed', value: plan.intervention },
          ]} />
        </Card>
        <Card title="Marketing intervention review: key questions" icon={ListChecks}>
          <List items={[
            { label: 'Is a marketing intervention needed?', value: <StatusChip tone="ok">Yes · conversion focus</StatusChip> },
            { label: 'Is there an existing approved theme?', value: <StatusChip tone="ok">Croptek conversion (approved)</StatusChip> },
            { label: 'Are audience and channels feasible?', value: <StatusChip tone="warn">Channel validation required</StatusChip> },
            { label: 'Can it be aggregated across territories?', value: <StatusChip tone="warn">After plan consolidation</StatusChip> },
          ]} />
        </Card>
      </div>
      {clar && <ClarificationDrawer planId={plan.id} subject={`${plan.state} ${plan.crop.toLowerCase()} plan`} onClose={() => setClar(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}

// ================================================================ 5 Contributing Territory Plan Detail
const VILLAGE_REVIEW: Record<string, MhPlanStatus> = { Dhanora: 'reviewed', 'Wadi Gaon': 'under_review', Pimpalgaon: 'reviewed', Kumbhephal: 'not_started', Shahagad: 'under_review', Rohilagad: 'not_started', 'Other villages': 'under_review' };
const VILLAGE_LABEL: Record<MhPlanStatus, string> = { reviewed: 'Reviewed', under_review: 'Under review', not_started: 'Not started', clarification: 'Clarification requested' };
export function TerritoryPlanDetail() {
  const go = useGo();
  const bh = useBhStore();
  const mh = useMhStore();
  const zm = useZmStore();
  const { territory } = useParams();
  const t = (['ambad', 'ghansawangi', 'badnapur', 'jafrabad', 'bhokardan'].includes(territory ?? '') ? territory : 'ambad') as ZmTerritoryId;
  const a = ambadPlan();
  const villages = ambadVillages();
  const additionalVillages = AMBAD.villages.filter((record) => !villages.some((plan) => plan.village === record.name));
  const [sel, setSel] = useState('Dhanora');
  const [clar, setClar] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const onionOk = (zm.cropValidated.ambad ?? []).includes('Onion');
  const vstatus = (v: string): MhPlanStatus => (onionOk ? 'reviewed' : VILLAGE_REVIEW[v] ?? 'under_review');
  const v = villages.find((x) => x.village === sel)!;
  const volGrowth = ((v.calc.volumeMt - v.calc.lastVolumeMt) / v.calc.lastVolumeMt) * 100;
  const tp = otherMaharashtra().find((p) => p.id === t);
  const name = t === 'ambad' ? 'Ambad' : tp!.name;
  const flag = () => { mh.flag(); bh.toast(`Marketing opportunity flagged: ${name} onion conversion`); go(M.diagnosis); };
  return (
    <MhPage {...MH_SECTION.plans} trail={`Maharashtra onion Croptek · ${name}`} title="Contributing Territory Plan Detail" back={M.planDetail('west', 'onion')} next={flag} nextLabel="Flag marketing opportunity"
      right={<StatusChip tone={mh.flagged ? 'ok' : 'warn'}>{mh.flagged ? 'Marketing opportunity flagged' : 'Marketing assessment pending'}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Territory ABP (all products)" value={crore(t === 'ambad' ? a.abp : tp!.abp)} />
        <KpiCard label="Approved onion allocation" value={crore(t === 'ambad' ? a.onionAllocation : tp!.crops[0].abp)} />
        <KpiCard label="Onion conversion growth objective" value={t === 'ambad' ? lakh(a.growthObjective) : lakh(Math.max(0, tp!.crops[0].abp - tp!.crops[0].proposed))} />
        <KpiCard label={t === 'ambad' ? 'Villages planned' : 'Submitted plan'} value={t === 'ambad' ? num(villages.length) : crore(tp!.plan)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title={t === 'ambad' ? `Village-wise crop and business plan: ${name} (Onion · Croptek)` : `Crop plan: ${name}`} icon={MapPin} flush right={<>
          <Button small icon={FileSearch} onClick={() => setEvidence(zmReviewEvidence())}>View Zonal Manager comments</Button>
          <Button small icon={MessageSquare} onClick={() => setClar(true)}>Request clarification</Button>
        </>}>
          {t === 'ambad' ? (
            <>
            <DataTable selectable rows={villages} rowKey={(x) => x.village} selected={sel} onRowClick={(x) => setSel(x.village)}
              columns={[
                { key: 'v', header: 'Village', render: (x) => <b>{x.village}</b> },
                { key: 'l', header: 'Last year (value / volume)', align: 'right', render: (x) => `${lakh(x.lastYear)} / ${num(x.calc.lastVolumeMt)} MT` },
                { key: 't', header: 'Current-year target', align: 'right', render: (x) => `${lakh(x.plan)} / ${num(x.calc.volumeMt)} MT` },
                { key: 'c', header: 'Coverage (acres)', align: 'right', render: (x) => `${num(x.calc.previousAcres)} → ${num(x.calc.requiredAcres)}` },
                { key: 's', header: 'Zonal Manager validation', align: 'center', render: (x) => <StatusChip tone={PLAN_TONE[vstatus(x.village)]}>{VILLAGE_LABEL[vstatus(x.village)]}</StatusChip> },
                { key: 'd', header: 'View', align: 'center', render: (x) => <Button small onClick={() => setSel(x.village)}>View details</Button> },
              ]}
              total={{ v: 'Total', l: lakh(villages.reduce((s, x) => s + x.lastYear, 0)), t: lakh(villages.reduce((s, x) => s + x.plan, 0)), c: `${num(villages.reduce((s, x) => s + x.calc.previousAcres, 0))} → ${num(villages.reduce((s, x) => s + x.calc.requiredAcres, 0))}` }} />
            {additionalVillages.length > 0 && <DataTable rows={additionalVillages} rowKey={(x) => x.name} columns={[
              { key: 'village', header: 'Additional Ambad villages', render: (x) => <b>{x.name}</b> },
              { key: 'trials', header: 'Documented trials', render: (x) => num(x.trials) },
              { key: 'adopters', header: 'Recorded adopters', render: (x) => num(x.adopters) },
              { key: 'rate', header: 'Trial-to-adoption', render: (x) => pct(x.adopters / x.trials * 100) },
            ]} />}
            </>
          ) : (
            <DataTable rows={tp!.crops} rowKey={(c) => c.crop}
              columns={[
                { key: 'c', header: 'Crop', render: (c) => <b>{c.crop}</b> },
                { key: 'l', header: 'Last year', align: 'right', render: (c) => crore(c.lastYear) },
                { key: 'p', header: 'Proposed', align: 'right', render: (c) => crore(c.proposed) },
                { key: 'a', header: 'Crop ABP', align: 'right', render: (c) => crore(c.abp) },
                { key: 'g', header: 'Growth', align: 'right', render: (c) => signed(c.growthPct) },
              ]} />
          )}
        </Card>
        {t === 'ambad' ? (
          <div className="stack">
            <Card title={`${sel}: plan detail and observations`} icon={Target} right={<StatusChip tone="ok">Selected village</StatusChip>}>
              <div className="recon compact" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <div><span>Product volume</span><b>{signed(volGrowth).replace('.0%', '%')}</b></div>
                <div><span>Effective area</span><b>+{num(v.calc.requiredAcres - v.calc.previousAcres)} acres</b></div>
                <div><span>Implied realisation</span><b>₹{FUNNEL_DEFAULTS.rupeesPerKg}/kg</b></div>
              </div>
              <List items={[
                { label: 'Product applicability (onion)', value: <StatusChip tone="ok">Reviewed</StatusChip> },
                { label: `Application rate ${FUNNEL_DEFAULTS.kgPerAcre} kg/acre`, value: <StatusChip tone={onionOk ? 'ok' : 'warn'}>{onionOk ? 'Validated' : 'Pending'}</StatusChip> },
                { label: `Realisation ₹${FUNNEL_DEFAULTS.rupeesPerKg}/kg`, value: <StatusChip tone="ok">Unchanged</StatusChip> },
              ]} />
            </Card>
            <Notes title="Plan notes" items={[
              `${sel} volume ${num(v.calc.lastVolumeMt)} → ${num(v.calc.volumeMt)} MT on ${num(v.calc.previousAcres)} → ${num(v.calc.requiredAcres)} acres.`,
              `Ambad onion plan ${crore(villages.reduce((s, x) => s + x.plan, 0))} sits inside the ${crore(a.onionAllocation)} onion allocation.`,
              `Validate farmer acquisition and the conversion approach before a theme.`,
              `${villages.filter((x) => vstatus(x.village) === 'reviewed').length} of ${villages.length} village plans reviewed.`,
            ]} />
          </div>
        ) : (
          <Notes title="Plan notes" items={[
            `${name} plan ${crore(tp!.plan)} against ${crore(tp!.abp)} ABP.`,
            `Onion ${crore(tp!.crops[0].proposed)} proposed (${signed(tp!.crops[0].growthPct)}).`,
            'Village-wise detail follows when the Field Sales Manager submits.',
          ]} />
        )}
      </div>
      <Card title={`Marketing intervention assessment: ${t === 'ambad' ? `${sel} / Ambad` : name} (Onion · Croptek)`} icon={Flag}>
        <div className="grid g3">
          <List items={[{ icon: ChartColumn, label: 'Growth requirement', value: t === 'ambad' ? `${signed(volGrowth).replace('.0%', '%')} volume, +${num(v.calc.requiredAcres - v.calc.previousAcres)} acres` : crore(tp!.plan) }]} />
          <List items={[{ icon: Sprout, label: 'Eligible opportunity', value: 'New farmer conversion and expansion of Croptek users' }]} />
          <List items={[{ icon: ArrowRight, label: 'Proposed intervention', value: 'Retailer-led Croptek conversion with farmer education' }]} />
        </div>
      </Card>
      {clar && <ClarificationDrawer planId="maharashtra" subject={`${name} onion plan`} onClose={() => setClar(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </MhPage>
  );
}


/** Zonal Manager screens 1–5: My Performance and Territory Plan Reviews, with their drawers. */
import {
  ArrowRight, ChartColumn, Check, CircleCheck, ClipboardCheck, Eye, FileSearch, FileText, ListChecks, MessageSquare,
  RefreshCw, Save, Scale, Send, ShieldCheck, Sprout, Target, TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { crore, lakh, num, pct, sum } from '../../data/format';
import { coverageCalc, FSM_CROPS, FUNNEL_DEFAULTS, onionPlanOf } from '../../data/fsm';
import {
  CATEGORIES, MAPPING_CHECKS, BASE_CHECKS, MH_QUESTIONS, PLAN_STATUS_LABEL, PORTFOLIO_CROP_SHARE, PORTFOLIO_SEASON_SHARE, planContribution,
  planPortfolio, portfolioCell, portfolioRows, portfolioTotal, revisedPlan, territoryPlan, territoryPlans, UNMAPPED_SKU, ZM_TERRITORY_IDS,
  zmTerritoryName, type PlanStatus, type QuestionStatus,
} from '../../data/zm';
import { Z, type FsmTerritoryId, type ZmTerritoryId } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore } from '../../store/zmStore';
import { SERIES } from '../../theme';
import { GroupedBars, HBars } from '../../ui/charts';
import { DataTable } from '../../ui/DataTable';
import { Bar, Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, EvidenceDrawer, type Evidence } from '../../ui/overlay';
import { ALL, opt, useGo } from '../common';
import { useZmTerritory, ZmPage, ZM_SECTION } from './frame';
import { Attach, CategoryChip, Field, List, Notes, useZmStatus } from './parts';

const signed = (p: number, dp = 1) => `${p >= 0 ? '+' : '–'}${Math.abs(p).toFixed(dp)}%`;
const FSM_TERRITORIES: ZmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];
const ownerOf = (t: ZmTerritoryId) => `Field Sales Manager · ${zmTerritoryName(t)}`;
const TERRITORY_OPTIONS = [opt(ALL, 'All territories'), ...ZM_TERRITORY_IDS.map((t) => opt(t, zmTerritoryName(t)))];
const CATEGORY_OPTIONS = [opt(ALL, 'All product categories'), ...CATEGORIES.map((c) => opt(c.id, c.name))];
const CROP_OPTIONS = [opt(ALL, 'All crops'), ...FSM_CROPS.map((c) => opt(c, c))];

// ================================================================ 1 My Performance and Product Portfolio ABP
type PerfView = 'value' | 'growth';
export function ZmPerformance() {
  const zm = useZmStore();
  const [view, setView] = useState<PerfView>('value');
  const [category, setCategory] = useState(ALL);
  const [crop, setCrop] = useState(ALL);
  const [season, setSeason] = useState(ALL);
  const [sortBy, setSortBy] = useState('abp');
  const t = zm.scope === 'zone' ? undefined : zm.scope;
  const k = (crop === ALL ? 1 : PORTFOLIO_CROP_SHARE[crop] / 100) * (season === ALL ? 1 : PORTFOLIO_SEASON_SHARE[season] / 100);
  const rows = portfolioRows(t).filter((r) => category === ALL || r.id === category)
    .map((r) => ({ ...r, lastYear: r.lastYear * k, abp: r.abp * k, ytd: r.ytd * k }))
    .sort((a, b) => (sortBy === 'growth' ? b.growthPct - a.growthPct : sortBy === 'name' ? a.name.localeCompare(b.name) : sortBy === 'lastYear' ? b.lastYear - a.lastYear : b.abp - a.abp));
  const tot = { lastYear: sum(rows, (r) => r.lastYear), abp: sum(rows, (r) => r.abp), ytd: sum(rows, (r) => r.ytd) };
  const growth = ((tot.abp - tot.lastYear) / tot.lastYear) * 100;
  const zoneTot = portfolioTotal(t);
  const byGrowth = [...portfolioRows(t)].sort((a, b) => (b.abp - b.lastYear) - (a.abp - a.lastYear));
  const bestPrev = [...portfolioRows(t)].sort((a, b) => b.prev.netRoi - a.prev.netRoi)[0];
  const lowAch = [...portfolioRows(t)].sort((a, b) => a.achievementPct - b.achievementPct)[0];
  const cr = (l: number) => Math.round(l) / 100;

  return (
    <ZmPage {...ZM_SECTION.performance} title="My Performance and Product Portfolio ABP" back={Z.assistant} next={Z.plans} nextLabel="Review consolidated territory plans">
      <FilterRows<PerfView> view={view} setView={setView}
        views={[opt('value', 'Value (₹ Cr)'), opt('growth', 'Growth (%)')] as { value: PerfView; label: string }[]}
        filters={[
          { key: 'territory', label: 'Territory', value: t ?? ALL, options: TERRITORY_OPTIONS, onChange: (v) => zm.setScope(v === ALL ? 'zone' : (v as ZmTerritoryId)) },
          { key: 'category', label: 'Product category', value: category, options: CATEGORY_OPTIONS, onChange: setCategory },
          { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
          { key: 'season', label: 'Season', value: season, options: [opt(ALL, 'All seasons'), ...Object.keys(PORTFOLIO_SEASON_SHARE).map((s) => opt(s, s))], onChange: setSeason },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('abp', 'Portfolio ABP'), opt('growth', 'Required growth'), opt('lastYear', 'Previous-year sales'), opt('name', 'Category name')] }]} />
      <div className="kpis">
        <KpiCard label="FY 2025–26 portfolio sales" value={crore(tot.lastYear)} />
        <KpiCard label="FY 2026–27 portfolio ABP" value={crore(tot.abp)} />
        <KpiCard label="Required growth" value={signed(growth)} />
        <KpiCard label="YTD achievement vs ABP" value={pct((tot.ytd / tot.abp) * 100)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
        <Card title="Product-wise achievement vs ABP" icon={Target} flush>
          <DataTable rows={rows} rowKey={(r) => r.id}
            columns={[
              { key: 'c', header: 'Product category', render: (r) => <CategoryChip id={r.id} name={r.name} /> },
              { key: 'l', header: 'FY 2025–26 sales', align: 'right', render: (r) => crore(r.lastYear) },
              { key: 'a', header: 'FY 2026–27 ABP', align: 'right', render: (r) => crore(r.abp) },
              { key: 'y', header: 'YTD sales', align: 'right', render: (r) => crore(r.ytd) },
              { key: 'g', header: 'Growth', align: 'right', render: (r) => <StatusChip tone="ok">{signed(r.growthPct)}</StatusChip> },
              { key: 'h', header: 'Achievement', align: 'right', render: (r) => pct(r.achievementPct) },
            ]}
            total={{ c: 'Total', l: crore(tot.lastYear), a: crore(tot.abp), y: crore(tot.ytd), g: <StatusChip tone="ok">{signed(growth)}</StatusChip>, h: pct((tot.ytd / tot.abp) * 100) }} />
        </Card>
        <Card title={view === 'value' ? 'Portfolio mix and growth (₹ Cr)' : 'Required growth by category (%)'} icon={ChartColumn}>
          {view === 'value'
            ? <GroupedBars height={185} data={rows.map((r) => ({ name: r.name, ly: cr(r.lastYear), abp: cr(r.abp) }))} x="name"
                tooltip={(d) => `${d.name} · FY 2025–26 ₹${d.ly.toFixed(2)} Cr · ABP ₹${d.abp.toFixed(2)} Cr`}
                series={[{ key: 'ly', label: 'FY 2025–26 sales', color: SERIES.plannedSoft }, { key: 'abp', label: 'FY 2026–27 ABP', color: SERIES.planned }]} />
            : <HBars fill rows={rows.map((r) => ({ label: r.name, values: [r.growthPct], title: `${r.name} · ${crore(r.lastYear)} → ${crore(r.abp)} · ${signed(r.growthPct)}` }))}
                series={[{ key: 'g', label: 'Required growth', color: SERIES.planned }]} max={40} format={(v) => signed(v)} labelWidth={150} />}
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
        <Card title="Previous-year campaign effectiveness" note="FY 2025–26" icon={ListChecks} flush>
          <DataTable rows={portfolioRows(t)} rowKey={(r) => r.id}
            columns={[
              { key: 'c', header: 'Product category', render: (r) => <CategoryChip id={r.id} name={r.name} /> },
              { key: 'n', header: 'Campaigns', align: 'right', render: (r) => num(r.prev.campaigns) },
              { key: 'i', header: 'Investment', align: 'right', render: (r) => lakh(r.prev.investment) },
              { key: 's', header: 'Incremental sales', align: 'right', render: (r) => lakh(r.prev.incrementalSales) },
              { key: 't', header: 'Trial-to-purchase', align: 'right', render: (r) => pct(r.prev.trialToPurchasePct, 0) },
              { key: 'r', header: 'Net ROI', align: 'right', render: (r) => <StatusChip tone={r.prev.netRoi >= 0.3 ? 'ok' : 'warn'}>{`${r.prev.netRoi >= 0 ? '+' : '–'}${Math.abs(r.prev.netRoi).toFixed(2)}×`}</StatusChip> },
            ]} />
        </Card>
        <Notes title="Portfolio notes" items={[
          <><b>{byGrowth[0].name}</b> carries the largest growth requirement: {crore(byGrowth[0].abp - byGrowth[0].lastYear)} ({signed(byGrowth[0].growthPct)}).</>,
          `${byGrowth[0].name} is ${pct((byGrowth[0].abp / zoneTot.abp) * 100, 0)} of the ${crore(zoneTot.abp)} portfolio ABP.`,
          `${lowAch.name} has the lowest YTD achievement at ${pct(lowAch.achievementPct)}.`,
          `${bestPrev.name} campaigns returned the best net ROI last year (${bestPrev.prev.netRoi >= 0 ? '+' : '–'}${Math.abs(bestPrev.prev.netRoi).toFixed(2)}×).`,
          `Portfolio ABP needs ${crore(zoneTot.abp - zoneTot.lastYear)} more than FY 2025–26 sales (${signed(zoneTot.growthPct)}).`,
        ]} />
      </div>
    </ZmPage>
  );
}

// ================================================================ 2 Consolidated Territory Plans vs Portfolio ABP
type PlanView = 'plans' | 'exceptions';
function exceptionsOf(t: ZmTerritoryId, plan: PlanStatus, mapping: string, cropValidated: string[]) {
  const p = territoryPlan(t);
  const out: { exception: string; value: string; tone: Tone; status: string }[] = [];
  if (p.gap > 0) out.push({ exception: 'All-product planning gap', value: crore(p.gap), tone: plan === 'endorsed' ? 'ok' : 'warn', status: plan === 'endorsed' ? 'Accepted at endorsement' : 'Open' });
  if (mapping !== 'validated') out.push({ exception: 'Portfolio SKU mapping', value: UNMAPPED_SKU[t] ? `${lakh(UNMAPPED_SKU[t])} unmapped` : 'Not validated', tone: mapping === 'requested' ? 'risk' : 'warn', status: mapping === 'requested' ? 'Correction requested' : 'Review required' });
  if (t === 'ambad' && !cropValidated.includes('Onion')) out.push({ exception: 'Onion application-rate validation', value: `${FUNNEL_DEFAULTS.kgPerAcre} kg/acre`, tone: 'warn', status: 'Pending' });
  return out;
}

export function ConsolidatedPlans() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const [view, setView] = useState<PlanView>('plans');
  const [territory, setTerritory] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [crop, setCrop] = useState(ALL);
  const [sortBy, setSortBy] = useState('abp');
  const all = territoryPlans();
  const contributionOf = (t: ZmTerritoryId) => (category === ALL ? planContribution(t) : planPortfolio(t).find((c) => c.id === category)!.contribution);
  const planOf = (t: ZmTerritoryId) => (crop === ALL ? territoryPlan(t).plan : territoryPlan(t).crops.find((c) => c.crop === crop)!.proposed);
  const rows = all.filter((p) => (territory === ALL || p.id === territory) && (status === ALL || st.plan(p.id) === status))
    .sort((a, b) => (sortBy === 'gap' ? b.gap - a.gap : sortBy === 'plan' ? planOf(b.id) - planOf(a.id) : sortBy === 'name' ? a.name.localeCompare(b.name) : b.abp - a.abp));
  const excRows = rows.flatMap((p) => exceptionsOf(p.id, st.plan(p.id), st.mapping(p.id), zm.cropValidated[p.id] ?? []).map((e, i) => ({ ...e, t: p.id, key: `${p.id}-${i}` })));
  const port = portfolioTotal();
  const byStatus = (s: PlanStatus[]) => sum(ZM_TERRITORY_IDS.filter((t) => s.includes(st.plan(t))), planContribution);
  const endorsed = byStatus(['endorsed']);
  const review = byStatus(['submitted', 'returned']);
  const draft = byStatus(['awaiting']);
  const gap = port.abp - endorsed - review - draft;
  const received = ZM_TERRITORY_IDS.filter((t) => st.plan(t) !== 'awaiting').length;
  const largestGap = [...all].sort((a, b) => b.gap - a.gap)[0];
  const croptek = portfolioRows().find((r) => r.id === 'croptek')!;
  const croptekSku = sum(all, (p) => p.croptekSku);

  return (
    <ZmPage {...ZM_SECTION.plans} title="Consolidated Territory Plans vs Portfolio ABP" back={Z.performance} next={Z.reconciliation} nextLabel="Reconcile SKU contributions">
      <FilterRows<PlanView> view={view} setView={setView}
        views={[opt('plans', 'Plans'), opt('exceptions', 'Exceptions')] as { value: PlanView; label: string }[]}
        filters={[
          { key: 'territory', label: 'Territory', value: territory, options: TERRITORY_OPTIONS, onChange: setTerritory },
          { key: 'category', label: 'Product category', value: category, options: CATEGORY_OPTIONS, onChange: setCategory },
          { key: 'status', label: 'Submission status', value: status, options: [opt(ALL, 'All statuses'), ...(Object.keys(PLAN_STATUS_LABEL) as PlanStatus[]).map((s) => opt(s, PLAN_STATUS_LABEL[s]))], onChange: setStatus },
          { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('abp', 'All-product ABP'), opt('plan', 'Submitted plan'), opt('gap', 'Planning gap'), opt('name', 'Territory name')] }]} />
      <div className="kpis">
        <KpiCard label="Previous-year portfolio sales" value={crore(port.lastYear)} />
        <KpiCard label="Current portfolio ABP" value={crore(port.abp)} />
        <KpiCard label="Required growth" value={signed(port.growthPct)} />
        <KpiCard label="Territory plans received" value={`${received} of ${ZM_TERRITORY_IDS.length}`} />
      </div>
      <Card title="Portfolio target reconciliation" icon={Scale}>
        <div className="recon" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr)) minmax(0, 1.4fr)' }}>
          <div><span>Portfolio target</span><b>{crore(port.abp)}</b></div>
          <div><span>Endorsed contribution</span><b>{crore(endorsed)}</b></div>
          <div><span>Under review</span><b>{crore(review)}</b></div>
          <div><span>Awaiting submission</span><b>{crore(draft)}</b></div>
          <div><span>Remaining ABP gap</span><b className={gap > 0 ? 'warn' : ''}>{crore(gap)}</b></div>
          <div className="grow"><span>{pct(((port.abp - gap) / port.abp) * 100)} of the portfolio ABP covered by plans</span><Bar value={((port.abp - gap) / port.abp) * 100} /></div>
        </div>
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <Card title={view === 'plans' ? 'Field Sales Manager plan submissions' : 'Review exceptions'} icon={ClipboardCheck} flush
          right={<Button small icon={RefreshCw} onClick={() => bh.toast(`Source submissions refreshed · ${received} of ${ZM_TERRITORY_IDS.length} plans received`)}>Refresh source submissions</Button>}>
          {view === 'plans' ? (
            <DataTable rows={rows} rowKey={(p) => p.id}
              columns={[
                { key: 't', header: 'Territory', render: (p) => <b>{p.name}</b> },
                { key: 'a', header: 'All-product ABP', align: 'right', render: (p) => crore(p.abp) },
                { key: 'p', header: crop === ALL ? 'Submitted plan' : `${crop} plan`, align: 'right', render: (p) => crore(planOf(p.id)) },
                { key: 'c', header: 'Portfolio contribution', align: 'right', render: (p) => crore(contributionOf(p.id)) },
                { key: 'g', header: 'Planning gap', align: 'right', render: (p) => (p.gap > 0 ? <StatusChip tone="warn">{crore(p.gap)}</StatusChip> : <StatusChip tone="ok">Closed</StatusChip>) },
                { key: 's', header: 'Submission status', align: 'center', render: (p) => st.planChip(p.id) },
                { key: 'v', header: 'View plan', align: 'center', render: (p) => <Button small onClick={() => go(Z.planReview(p.id))}>View plan</Button> },
              ]}
              total={{ t: 'Total', a: crore(sum(rows, (p) => p.abp)), p: crore(sum(rows, (p) => planOf(p.id))), c: crore(sum(rows, (p) => contributionOf(p.id))), g: crore(sum(rows, (p) => Math.max(0, p.gap))) }} />
          ) : (
            <DataTable rows={excRows} rowKey={(e) => e.key}
              columns={[
                { key: 't', header: 'Territory', render: (e) => <b>{zmTerritoryName(e.t)}</b> },
                { key: 'e', header: 'Exception', render: (e) => e.exception },
                { key: 'v', header: 'Value', align: 'right', render: (e) => e.value },
                { key: 's', header: 'Status', align: 'center', render: (e) => <StatusChip tone={e.tone}>{e.status}</StatusChip> },
                { key: 'o', header: 'Open', align: 'center', render: (e) => <Button small icon={Eye} onClick={() => go(Z.planReview(e.t))}>View plan</Button> },
              ]} />
          )}
        </Card>
        <Notes title="Planning notes" items={[
          `${largestGap.name} has the largest all-product gap: ${crore(largestGap.gap)} (${crore(largestGap.plan)} plan vs ${crore(largestGap.abp)} ABP).`,
          `${received} of ${ZM_TERRITORY_IDS.length} territory plans received; ${ZM_TERRITORY_IDS.filter((t) => st.plan(t) === 'endorsed').length} endorsed.`,
          `Plans contribute ${crore(port.abp - gap)} to the ${crore(port.abp)} portfolio ABP; ${crore(gap)} remains open.`,
          `Croptek SKU contribution across plans is ${crore(croptekSku)} against a ${crore(croptek.abp)} Croptek ABP.`,
          `${ZM_TERRITORY_IDS.filter((t) => st.mapping(t) !== 'validated').length} territories still need SKU mapping validation.`,
        ]} />
      </div>
    </ZmPage>
  );
}

// ================================================================ 3 SKU-to-Portfolio ABP Reconciliation
export function SkuReconciliation() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const [sel, setSel] = useState<string>('croptek:ambad');
  const [drawer, setDrawer] = useState(false);
  const selT = sel.split(':')[1] as ZmTerritoryId;
  const rows = CATEGORIES.flatMap((c) => ZM_TERRITORY_IDS.map((t) => ({ key: `${c.id}:${t}`, c, t, cell: portfolioCell(c.id, t), contribution: planPortfolio(t).find((x) => x.id === c.id)!.contribution })));
  const checks = zm.mappingChecks[selT] ?? BASE_CHECKS[selT];
  const allChecked = MAPPING_CHECKS.every((c) => checks.includes(c.id));
  const toggle = (id: string) => zm.setMappingChecks(selT, checks.includes(id) ? checks.filter((x) => x !== id) : [...checks, id]);
  const port = portfolioTotal();
  const validated = sum(ZM_TERRITORY_IDS.filter((t) => st.mapping(t) === 'validated'), planContribution);
  const review = sum(ZM_TERRITORY_IDS.filter((t) => st.mapping(t) !== 'validated'), planContribution);
  const unmapped = sum(ZM_TERRITORY_IDS, (t) => UNMAPPED_SKU[t]);
  const selRow = rows.find((r) => r.key === sel)!;

  return (
    <ZmPage {...ZM_SECTION.plans} trail="Consolidated territory plans" title="SKU-to-Portfolio ABP Reconciliation" back={Z.plans} next={Z.planReview(selT)} nextLabel="Proceed to territory plan review"
      right={st.mappingChip(selT)}>
      <div className="kpis">
        <KpiCard label="Portfolio ABP" value={crore(port.abp)} />
        <KpiCard label="Validated contribution" value={crore(validated)} />
        <KpiCard label="Contribution under review" value={crore(review)} />
        <KpiCard label="Unmapped SKU value" value={lakh(unmapped)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <Card title="Product × territory reconciliation" icon={Scale} flush>
          <DataTable selectable rows={rows} rowKey={(r) => r.key} selected={sel} onRowClick={(r) => setSel(r.key)}
            columns={[
              { key: 'c', header: 'Category', render: (r) => <CategoryChip id={r.c.id} name={r.c.name} /> },
              { key: 't', header: 'Territory', render: (r) => <b>{zmTerritoryName(r.t)}</b> },
              { key: 'a', header: 'Category ABP', align: 'right', render: (r) => lakh(r.cell.abp) },
              { key: 'm', header: 'Mapped contribution', align: 'right', render: (r) => lakh(r.contribution) },
              { key: 's', header: 'Validation status', align: 'center', render: (r) => st.mappingChip(r.t) },
              { key: 'x', header: 'Review mapping', align: 'center', render: (r) => <Button small onClick={() => { setSel(r.key); setDrawer(true); }}>Review</Button> },
            ]}
            total={{ c: 'Total', a: lakh(port.abp), m: lakh(validated + review) }} />
        </Card>
        <div className="stack">
          <Card title={`SKU mapping validation: ${zmTerritoryName(selT)}`} icon={ShieldCheck}>
            <List items={[
              { label: 'Portfolio category', value: selRow.c.name },
              { label: 'Submitted plan', value: crore(territoryPlan(selT).plan) },
              { label: 'Mapped contribution', value: lakh(selRow.contribution) },
              { label: 'Unmapped SKU value', value: UNMAPPED_SKU[selT] ? lakh(UNMAPPED_SKU[selT]) : <span className="na">NA</span> },
              { label: 'Sales basis', value: 'Primary' },
              { label: 'Time period', value: 'FY 2026–27' },
              { label: 'Source', value: ownerOf(selT) },
            ]} />
            <div className="calc-label">Mapping checks · {checks.length} of {MAPPING_CHECKS.length}</div>
            {MAPPING_CHECKS.map((c) => (
              <label key={c.id} className="list-row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checks.includes(c.id)} onChange={() => toggle(c.id)} aria-label={c.label} />
                <span>{c.label}</span>
                <b className="right"><StatusChip tone={checks.includes(c.id) ? 'ok' : 'warn'}>{checks.includes(c.id) ? 'Verified' : 'Pending'}</StatusChip></b>
              </label>
            ))}
            <div className="stack" style={{ gap: 8 }}>
              <Button icon={Eye} onClick={() => go(Z.planReview(selT))}>View submitted plan</Button>
              <Button icon={MessageSquare} onClick={() => setDrawer(true)}>Request mapping correction</Button>
              <Button primary icon={CircleCheck} disabled={!allChecked || st.mapping(selT) === 'validated'}
                onClick={() => { zm.setMapping(selT, 'validated'); bh.toast(`${zmTerritoryName(selT)} SKU mapping validated · ${crore(planContribution(selT))} contribution`); }}>
                {st.mapping(selT) === 'validated' ? 'Mapping validated' : 'Validate mapping'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {drawer && <MappingCorrectionDrawer t={selT} category={selRow.c.name} checks={checks} onClose={() => setDrawer(false)} />}
    </ZmPage>
  );
}

const MAPPING_REASONS = ['Missing SKU identifiers', 'Wrong portfolio category', 'Secondary sales used instead of primary', 'Duplicate SKU lines', 'Incomplete submission'];
const MAPPING_OWNERS = ['Master data team', 'Zonal analyst', 'Sales operations'];

function MappingCorrectionDrawer({ t, category, checks, onClose }: { t: ZmTerritoryId; category: string; checks: string[]; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const p = territoryPlan(t);
  const [reason, setReason] = useState('');
  const [owner, setOwner] = useState('');
  const [collab, setCollab] = useState('');
  const [due, setDue] = useState('');
  const [comments, setComments] = useState('');
  const [sources, setSources] = useState<string[]>(['plan']);
  const [tried, setTried] = useState(false);
  const errors = { reason: reason ? '' : 'Select a reason', owner: owner ? '' : 'Select an owner', due: due ? '' : 'Select a due date' };
  const requested = st.mapping(t) === 'requested';
  const submit = () => {
    setTried(true);
    if (errors.reason || errors.owner || errors.due) return;
    zm.setMapping(t, 'requested');
    bh.toast(`Mapping correction requested for ${zmTerritoryName(t)} · ${owner}, due ${due}`);
    onClose();
  };
  const SOURCES = [opt('plan', 'Field Sales Manager submitted plan'), opt('master', 'Product / SKU master'), opt('erp', 'ERP / DMS extract')];
  const pending = MAPPING_CHECKS.filter((c) => !checks.includes(c.id));
  return (
    <Drawer title={`SKU mapping correction request: ${zmTerritoryName(t)} · ${category}`} onClose={onClose}
      status={<StatusChip tone={requested ? 'risk' : 'neutral'}>{requested ? 'Mapping correction requested' : 'Draft'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={submit}>Create mapping correction request</Button>} />}>
      <div className="kpis">
        <KpiCard label="All-product territory ABP" value={crore(p.abp)} />
        <KpiCard label="Submitted all-product plan" value={crore(p.plan)} />
        <KpiCard label="ABP planning gap" value={crore(p.gap)} />
        <KpiCard label="Unmapped SKU value" value={UNMAPPED_SKU[t] ? lakh(UNMAPPED_SKU[t]) : 'NA'} />
      </div>
      <div className="grid g2">
        <div className="stack">
          <Card title="Correction checklist" icon={ListChecks}>
            <List items={MAPPING_CHECKS.map((c) => ({ label: c.label, value: <StatusChip tone={checks.includes(c.id) ? 'ok' : 'warn'}>{checks.includes(c.id) ? 'Verified' : 'Pending'}</StatusChip> }))} />
          </Card>
          <Card title="Source references" icon={FileText}>
            {SOURCES.map((s) => (
              <label key={s.value} className="list-row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={sources.includes(s.value)} onChange={() => setSources((x) => (x.includes(s.value) ? x.filter((y) => y !== s.value) : [...x, s.value]))} aria-label={s.label} />
                <span>{s.label}</span>
              </label>
            ))}
          </Card>
          <Notes title="Data quality checks" items={[
            `${crore(p.abp)} ABP and ${crore(p.plan)} plan are all-product figures, not ${category} contributions.`,
            `The ${crore(p.gap)} gap is plan vs ABP; unmapped SKU value is ${UNMAPPED_SKU[t] ? lakh(UNMAPPED_SKU[t]) : 'NA'}.`,
            `${pending.length} of ${MAPPING_CHECKS.length} mapping checks pending${pending.length ? `: ${pending.map((c) => c.label.toLowerCase()).join(', ')}` : ''}.`,
            `${sources.length} source reference${sources.length === 1 ? '' : 's'} selected for the correction.`,
          ]} />
        </div>
        <Card title="Request details" icon={MessageSquare} right={<Button small icon={Save} onClick={() => bh.toast('Mapping correction draft saved')}>Save draft</Button>}>
          <Field label="Request reason *" error={tried ? errors.reason : ''}><Select label="Request reason" value={reason} onChange={setReason} options={[opt('', 'Select request reason'), ...MAPPING_REASONS.map((r) => opt(r, r))]} /></Field>
          <Field label="Responsible owner *" error={tried ? errors.owner : ''}><Select label="Responsible owner" value={owner} onChange={setOwner} options={[opt('', 'Select owner'), ...MAPPING_OWNERS.map((r) => opt(r, r))]} /></Field>
          <Field label="Field Sales Manager collaborator"><Select label="Field Sales Manager collaborator" value={collab} onChange={setCollab} options={[opt('', 'Select collaborator'), opt(ownerOf(t), ownerOf(t))]} /></Field>
          <Field label="Due date *" error={tried ? errors.due : ''}><input className="input" type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Comments"><textarea className="input" rows={4} maxLength={500} aria-label="Comments" value={comments} onChange={(e) => setComments(e.target.value)} /><small>{comments.length} / 500</small></Field>
          <Field label="Supporting evidence"><Attach label="Supporting evidence" /></Field>
        </Card>
      </div>
    </Drawer>
  );
}

// ================================================================ 4 Territory Plan Validation and Endorsement
function useReviewComment(key: string) {
  const zm = useZmStore();
  const bh = useBhStore();
  const saved = zm.comments[key] ?? '';
  const [draft, setDraft] = useState(saved);
  return { draft, setDraft, dirty: draft !== saved, save: () => { zm.setComment(key, draft); bh.toast('Review saved'); } };
}

function originalPlanEvidence(t: ZmTerritoryId): Evidence {
  const p = territoryPlan(t);
  return {
    title: `Original plan: ${p.name}`, owner: `${ownerOf(t)} · version 1`,
    facts: [
      { label: 'All-product ABP', value: crore(p.abp) },
      { label: 'Submitted plan', value: crore(p.plan) },
      ...p.crops.map((c) => ({ label: `${c.crop} plan`, value: `${crore(c.proposed)} (${signed(c.growthPct)} vs last year)` })),
      { label: 'Croptek SKU contribution', value: crore(p.croptekSku) },
      { label: 'Planning gap', value: crore(p.gap) },
    ],
  };
}

export function PlanValidation() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const t = useZmTerritory();
  const p = territoryPlan(t);
  const [crop, setCrop] = useState<string>(p.crops[0].crop);
  const villages = FSM_TERRITORIES.includes(t) ? onionPlanOf(t as FsmTerritoryId).filter((v) => v.village !== 'Other villages') : [];
  const [village, setVillage] = useState(villages.find((v) => v.village === 'Dhanora')?.village ?? villages[0]?.village ?? '');
  const [drawer, setDrawer] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const review = useReviewComment(`review:${t}`);
  const validatedCrops = zm.cropValidated[t] ?? [];
  const c = p.crops.find((x) => x.crop === crop)!;
  const v = villages.find((x) => x.village === village);
  const calc = v ? coverageCalc(v) : null;
  const onionOk = validatedCrops.includes('Onion');
  const status = st.plan(t);
  const endorse = () => { zm.decidePlan(t, 'endorsed'); bh.toast(`${p.name} plan endorsed and forwarded to Marketing Head`); go(Z.themes); };

  return (
    <ZmPage {...ZM_SECTION.plans} trail={p.name} title="Territory Plan Validation and Endorsement" back={Z.reconciliation} next={Z.revised(t)} nextLabel="Review revised plan" right={st.planChip(t)}>
      <div className="kpis">
        <KpiCard label={`All-product ${p.name} ABP`} value={crore(p.abp)} />
        <KpiCard label="Submitted plan" value={crore(p.plan)} />
        <KpiCard label="Unresolved gap" value={crore(p.gap)} />
        <KpiCard label="Portfolio contribution" value={crore(planContribution(t))} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <div className="stack">
          <Card title="Crop-wise business and product validation" icon={Sprout} flush>
            <DataTable selectable rows={p.crops} rowKey={(x) => x.crop} selected={crop} onRowClick={(x) => setCrop(x.crop)}
              columns={[
                { key: 'c', header: 'Crop', render: (x) => <b>{x.crop}</b> },
                { key: 'l', header: 'Last year', align: 'right', render: (x) => crore(x.lastYear) },
                { key: 'p', header: 'Proposed business', align: 'right', render: (x) => crore(x.proposed) },
                { key: 'g', header: 'Growth assumption', align: 'right', render: (x) => signed(x.growthPct) },
                { key: 'v', header: 'Zonal Manager validation', align: 'center', render: (x) => <StatusChip tone={validatedCrops.includes(x.crop) ? 'ok' : 'warn'}>{validatedCrops.includes(x.crop) ? 'Validated' : 'Pending'}</StatusChip> },
              ]}
              total={{ c: 'Total', l: crore(sum(p.crops, (x) => x.lastYear)), p: crore(p.plan), g: signed(((p.plan - sum(p.crops, (x) => x.lastYear)) / sum(p.crops, (x) => x.lastYear)) * 100) }} />
          </Card>
          {crop === 'Onion' && v && calc ? (
            <Card title={`${village} planning detail: Onion`} icon={Target}
              right={<><Select label="Village" value={village} onChange={setVillage} options={villages.map((x) => opt(x.village, x.village))} /><StatusChip tone={onionOk ? 'ok' : 'warn'}>{onionOk ? 'Assumptions validated' : 'Assumptions not verified'}</StatusChip></>}>
              <div className="recon compact" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
                <div><span>Historical</span><b>{lakh(v.lastYear)} / {num(calc.lastVolumeMt)} MT</b></div>
                <div><span>Target</span><b>{lakh(v.plan)} / {num(calc.volumeMt)} MT</b></div>
                <div><span>Effective coverage</span><b>{num(calc.previousAcres)} → {num(calc.requiredAcres)} acres</b></div>
                <div><span>Assumption</span><b>{FUNNEL_DEFAULTS.kgPerAcre} kg/acre</b></div>
                <div><span>Realisation</span><b>₹{FUNNEL_DEFAULTS.rupeesPerKg}/kg</b></div>
                <div><span>Volume growth</span><b>{signed(((calc.volumeMt - calc.lastVolumeMt) / calc.lastVolumeMt) * 100, 0)}</b></div>
              </div>
            </Card>
          ) : (
            <Card title={`${p.name} planning detail: ${crop}`} icon={Target}>
              <div className="recon compact" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                <div><span>Last year</span><b>{crore(c.lastYear)}</b></div>
                <div><span>Proposed</span><b>{crore(c.proposed)}</b></div>
                <div><span>Crop ABP</span><b>{crore(c.abp)}</b></div>
                <div><span>Growth</span><b>{signed(c.growthPct)}</b></div>
                <div><span>Share of plan</span><b>{pct((c.proposed / p.plan) * 100, 0)}</b></div>
              </div>
            </Card>
          )}
          <div className="grid g2">
            <Card title="Product feasibility assessment" icon={ListChecks}>
              <List items={[
                { label: 'Agronomic / application-rate validation', value: <StatusChip tone={onionOk ? 'ok' : 'warn'}>{onionOk ? 'Validated' : 'Pending'}</StatusChip> },
                { label: `Price / mix realisation (₹${FUNNEL_DEFAULTS.rupeesPerKg}/kg)`, value: <StatusChip tone="ok">Verified</StatusChip> },
                { label: 'Portfolio SKU mapping', value: st.mappingChip(t) },
                { label: `${crore(p.gap)} all-product allocation gap`, value: <StatusChip tone={p.gap > 0 && status !== 'endorsed' ? 'warn' : 'ok'}>{p.gap > 0 && status !== 'endorsed' ? 'Unresolved' : 'Accepted'}</StatusChip> },
              ]} />
            </Card>
            <Notes title="Planning notes" items={[
              `${c.crop} plan ${crore(c.proposed)} is ${signed(c.growthPct)} over last year (${crore(c.lastYear)}).`,
              ...(v && calc ? [`${village} volume rises ${num(calc.lastVolumeMt)} → ${num(calc.volumeMt)} MT at an unchanged ₹${FUNNEL_DEFAULTS.rupeesPerKg}/kg.`] : []),
              `Plan covers ${pct(p.coveragePct)} of the ${crore(p.abp)} ABP; ${crore(p.gap)} still to allocate.`,
              `Croptek SKU contribution ${crore(p.croptekSku)} against a ${crore(p.croptekAbp)} Croptek ABP.`,
              `${validatedCrops.length} of ${p.crops.length} crops validated.`,
            ]} />
          </div>
        </div>
        <div className="stack">
          <Card title="Zonal Manager review and endorsement" icon={ClipboardCheck} right={<Button small icon={Save} disabled={!review.dirty} onClick={review.save}>Save review</Button>}>
            <Field label="Comments (internal review and endorsement)">
              <textarea className={`input${review.dirty ? ' chg' : ''}`} rows={5} maxLength={1000} aria-label="Review comments" value={review.draft} onChange={(e) => review.setDraft(e.target.value)} />
              <small>{review.draft.length} / 1000</small>
            </Field>
            <div className="stack" style={{ gap: 8 }}>
              <Button icon={validatedCrops.includes(crop) ? CircleCheck : Check} disabled={validatedCrops.includes(crop)}
                onClick={() => { zm.setCropValidated(t, [...validatedCrops, crop]); bh.toast(`${crop} plan validated for ${p.name}`); }}>
                {validatedCrops.includes(crop) ? `${crop} validated` : `Validate ${crop.toLowerCase()} plan`}
              </Button>
              <Button icon={MessageSquare} onClick={() => setDrawer(true)}>Request changes</Button>
              <Button icon={FileSearch} onClick={() => setEvidence(originalPlanEvidence(t))}>View original plan</Button>
              <Button primary icon={ArrowRight} disabled={status === 'endorsed' || status === 'awaiting'} onClick={endorse}>{status === 'endorsed' ? 'Endorsed' : 'Endorse and forward to Marketing Head'}</Button>
            </div>
          </Card>
          <Notes title="Review checks" icon={ShieldCheck} items={[
            `Status: ${PLAN_STATUS_LABEL[status]}.`,
            `SKU mapping: ${st.mapping(t) === 'validated' ? 'validated' : 'not yet validated'}.`,
            `Crops validated: ${validatedCrops.length ? validatedCrops.join(', ') : 'none yet'}.`,
            `Review comments ${zm.comments[`review:${t}`] ? 'saved' : 'not saved yet'}.`,
          ]} />
        </div>
      </div>
      {drawer && <PlanCorrectionDrawer t={t} onClose={() => setDrawer(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </ZmPage>
  );
}

const CORRECTION_REASONS = ['Explain allocation shortfall', 'Revise volume basis', 'Confirm price / mix', 'Agronomy validation required', 'Attach source evidence'];
const REVIEWERS = ['Agronomy lead', 'Zonal analyst', 'Regional finance'];

function PlanCorrectionDrawer({ t, onClose }: { t: ZmTerritoryId; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const p = territoryPlan(t);
  const v = FSM_TERRITORIES.includes(t) ? onionPlanOf(t as FsmTerritoryId).find((x) => x.village === 'Dhanora') : undefined;
  const calc = v ? coverageCalc(v) : null;
  const onionOk = (zm.cropValidated[t] ?? []).includes('Onion');
  const items = [
    { id: 'gap', exception: 'All-product planning gap', current: `${crore(p.gap)} gap`, need: 'Explain allocation shortfall or revise plan', tone: 'warn' as Tone, status: 'Open' },
    ...(calc ? [{ id: 'volume', exception: 'Dhanora proposed volume growth', current: `${num(calc.lastVolumeMt)} → ${num(calc.volumeMt)} MT`, need: 'Validate growth driver and basis', tone: 'warn' as Tone, status: 'Review required' }] : []),
    { id: 'realisation', exception: 'Implied realisation', current: `₹${FUNNEL_DEFAULTS.rupeesPerKg}/kg`, need: 'Confirm price and mix assumption', tone: 'ok' as Tone, status: 'Verified' },
    { id: 'application', exception: 'Application assumption', current: `${FUNNEL_DEFAULTS.kgPerAcre} kg/acre`, need: 'Agronomy validation required', tone: (onionOk ? 'ok' : 'risk') as Tone, status: onionOk ? 'Validated' : 'Not verified' },
    { id: 'source', exception: 'Supporting source evidence', current: 'Not attached', need: 'Attach source evidence', tone: 'warn' as Tone, status: 'Pending' },
  ];
  const [sel, setSel] = useState(items[0].id);
  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState(ownerOf(t));
  const [due, setDue] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [comments, setComments] = useState('');
  const [tried, setTried] = useState(false);
  const errors = { reason: reason ? '' : 'Select a reason', due: due ? '' : 'Select a due date' };
  const returned = st.plan(t) === 'returned';
  const send = () => {
    setTried(true);
    if (errors.reason || errors.due) return;
    zm.decidePlan(t, 'returned');
    bh.toast(`${p.name} plan returned to Field Sales Manager · ${reason.toLowerCase()}, due ${due}`);
    onClose();
  };
  const selItem = items.find((i) => i.id === sel)!;
  return (
    <Drawer title={`Territory plan correction request: ${p.name}`} onClose={onClose}
      status={<StatusChip tone={returned ? 'risk' : 'neutral'}>{returned ? 'Returned to Field Sales Manager' : 'Draft'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={send}>Send correction request to Field Sales Manager</Button>} />}>
      <div className="kpis">
        <KpiCard label="Original all-product ABP" value={crore(p.abp)} />
        <KpiCard label="Original submitted plan" value={crore(p.plan)} />
        <KpiCard label="Planning gap" value={crore(p.gap)} />
        <KpiCard label="Original onion allocation" value={crore(p.crops[0].proposed)} />
      </div>
      <Card title="Correction checklist" icon={ListChecks} flush>
        <DataTable selectable rows={items} rowKey={(i) => i.id} selected={sel} onRowClick={(i) => setSel(i.id)}
          columns={[
            { key: 'e', header: 'Exception', render: (i) => <b>{i.exception}</b> },
            { key: 'c', header: 'Current value', render: (i) => i.current },
            { key: 'n', header: 'Required clarification / correction', render: (i) => i.need },
            { key: 's', header: 'Status', align: 'center', render: (i) => <StatusChip tone={i.tone}>{i.status}</StatusChip> },
          ]} />
      </Card>
      <Card title={`Correction detail: ${selItem.exception}`} icon={MessageSquare} right={<Button small icon={Save} onClick={() => bh.toast('Correction draft saved')}>Save draft</Button>}>
        <div className="form-grid">
          <Field label="Reason *" error={tried ? errors.reason : ''}><Select label="Reason" value={reason} onChange={setReason} options={[opt('', 'Select reason'), ...CORRECTION_REASONS.map((r) => opt(r, r))]} /></Field>
          <Field label="Assigned to *"><Select label="Assigned to" value={assignee} onChange={setAssignee} options={[opt(ownerOf(t), ownerOf(t))]} /></Field>
          <Field label="Due date *" error={tried ? errors.due : ''}><input className="input" type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Technical reviewer"><Select label="Technical reviewer" value={reviewer} onChange={setReviewer} options={[opt('', 'Select reviewer'), ...REVIEWERS.map((r) => opt(r, r))]} /></Field>
          <Field label="Comments"><textarea className="input" rows={3} maxLength={500} aria-label="Comments" value={comments} onChange={(e) => setComments(e.target.value)} /></Field>
          <Field label="Required evidence"><Attach label="Required evidence" /></Field>
        </div>
      </Card>
      <Notes title="Review notes" items={[
        `${items.filter((i) => i.tone !== 'ok').length} of ${items.length} exceptions need the Field Sales Manager's correction.`,
        `Version 1 (${crore(p.plan)}) stays on record; the revised version is compared on the next screen.`,
        ...(calc ? [`Dhanora volume growth ${signed(((calc.volumeMt - calc.lastVolumeMt) / calc.lastVolumeMt) * 100, 0)} needs a stated driver.`] : []),
        `Croptek SKU mapping is ${st.mapping(t) === 'validated' ? 'validated' : 'still open'} and is tracked separately from the ${crore(p.gap)} gap.`,
      ]} />
    </Drawer>
  );
}

// ================================================================ 5 Revised Plan Comparison and Revalidation
const Q_TONE: Record<QuestionStatus, Tone> = { open: 'warn', responded: 'ok', closed: 'ok' };
const Q_LABEL: Record<QuestionStatus, string> = { open: 'Pending', responded: 'Responded', closed: 'Closed' };

export function RevisedPlan() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const st = useZmStatus();
  const t = useZmTerritory();
  const p = territoryPlan(t);
  const r = revisedPlan();
  const review = useReviewComment(`revised:${t}`);
  const [scope, setScope] = useState('all');
  const [exception, setException] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [correction, setCorrection] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const questions = [...MH_QUESTIONS, ...zm.extraQuestions];
  const qStatus = (id: string) => zm.questions[id] ?? questions.find((q) => q.id === id)!.status;
  const status = st.plan(t);
  const isAmbad = t === 'ambad';
  const rows: { param: string; orig: string; rev: string; variation: string; changed: boolean | null }[] = isAmbad ? [
    { param: 'All-product submitted plan', orig: crore(r.orig.plan), rev: crore(r.rev.plan), variation: `+${lakh(r.rev.plan - r.orig.plan)}`, changed: true },
    { param: 'Territory ABP', orig: crore(r.abp), rev: crore(r.abp), variation: 'Reference', changed: null },
    { param: 'Onion allocation', orig: crore(r.orig.onion), rev: crore(r.rev.onion), variation: `+${lakh(r.rev.onion - r.orig.onion)}`, changed: true },
    ...r.villages.map((x) => ({ param: `${x.village} onion target`, orig: lakh(x.orig), rev: lakh(x.rev), variation: `+${lakh(x.rev - x.orig)}`, changed: true })),
    { param: 'Onion volume basis', orig: `${num(r.orig.onionMt)} MT`, rev: `${num(r.rev.onionMt)} MT`, variation: `+${num(r.rev.onionMt - r.orig.onionMt)} MT`, changed: true },
    { param: 'Required coverage', orig: `${num(r.orig.acres)} acres`, rev: `${num(r.rev.acres)} acres`, variation: `+${num(r.rev.acres - r.orig.acres)} acres`, changed: true },
    { param: 'Implied realisation', orig: `₹${REALISATION}/kg`, rev: `₹${REALISATION}/kg`, variation: 'Unchanged', changed: false },
    { param: 'Application rate', orig: r.applicationRate.orig, rev: r.applicationRate.rev, variation: 'Validated', changed: true },
    { param: 'Planning gap', orig: crore(r.orig.gap), rev: crore(r.rev.gap), variation: `–${lakh(r.orig.gap - r.rev.gap)}`, changed: true },
  ] : [
    { param: 'All-product submitted plan', orig: crore(p.plan), rev: crore(p.plan), variation: 'No revision submitted', changed: false },
    { param: 'Territory ABP', orig: crore(p.abp), rev: crore(p.abp), variation: 'Reference', changed: null },
    { param: 'Planning gap', orig: crore(p.gap), rev: crore(p.gap), variation: 'Unchanged', changed: false },
  ];
  const v2Plan = isAmbad ? r.rev.plan : p.plan;
  const v2Gap = isAmbad ? r.rev.gap : p.gap;
  const tracker = [
    { label: `${crore(v2Gap)} all-product planning gap`, tone: (exception ? 'ok' : 'warn') as Tone, status: exception ? 'Authorised exception' : 'Exception requested' },
    { label: 'Onion volume basis', tone: 'ok' as Tone, status: isAmbad ? 'Resolved in version 2' : 'Pending' },
    { label: 'Price / mix realisation', tone: 'ok' as Tone, status: 'Verified' },
    { label: 'Application-rate validation', tone: (isAmbad ? 'ok' : 'warn') as Tone, status: isAmbad ? 'Validated' : 'Pending' },
    { label: 'Portfolio SKU mapping', tone: (st.mapping(t) === 'validated' ? 'ok' : 'warn') as Tone, status: st.mapping(t) === 'validated' ? 'Validated' : 'Pending' },
  ];
  const endorse = () => { zm.decidePlan(t, 'endorsed'); bh.toast(`${p.name} revised plan endorsed and forwarded to Marketing Head`); go(Z.themes); };
  const openQ = questions.filter((q) => qStatus(q.id) === 'open').length;

  return (
    <ZmPage {...ZM_SECTION.plans} trail={p.name} title="Revised Plan Comparison and Revalidation" back={Z.planReview(t)} next={endorse} nextLabel="Endorse and forward to Marketing Head"
      right={<StatusChip tone={status === 'endorsed' ? 'ok' : 'warn'}>{status === 'endorsed' ? 'Endorsed · forwarded to Marketing Head' : isAmbad ? 'Revised plan received · revalidation pending' : 'Awaiting revised plan'}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Territory ABP" value={crore(p.abp)} />
        <KpiCard label="Original plan (version 1)" value={crore(p.plan)} />
        <KpiCard label="Revised plan (version 2)" value={crore(v2Plan)} />
        <KpiCard label="Remaining gap" value={crore(v2Gap)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
          <Card title="Original vs revised plan comparison" icon={Scale} flush>
            <DataTable rows={rows} rowKey={(x) => x.param}
              columns={[
                { key: 'p', header: 'Parameter', render: (x) => <b>{x.param}</b> },
                { key: 'a', header: 'Version 1', align: 'right', render: (x) => x.orig },
                { key: 'b', header: 'Version 2', align: 'right', render: (x) => <span className={x.changed ? 'chg' : undefined}>{x.rev}</span> },
                { key: 'v', header: 'Variation', render: (x) => x.variation },
                { key: 's', header: 'Change', align: 'center', render: (x) => (x.changed === null ? <StatusChip tone="neutral">Reference</StatusChip> : <StatusChip tone={x.changed ? 'warn' : 'neutral'}>{x.changed ? 'Changed' : 'Unchanged'}</StatusChip>) },
              ]} />
          </Card>
          <div className="grid g2">
            <Card title="Exception resolution tracker" icon={TriangleAlert}>
              <List items={tracker.map((x) => ({ label: x.label, value: <StatusChip tone={x.tone}>{x.status}</StatusChip> }))} />
            </Card>
            <Card title="Marketing Head questions" icon={MessageSquare} flush>
              <DataTable rows={questions} rowKey={(q) => q.id}
                columns={[
                  { key: 'q', header: 'Question', render: (q) => q.topic },
                  { key: 's', header: 'Status', align: 'center', render: (q) => <StatusChip tone={Q_TONE[qStatus(q.id)]}>{Q_LABEL[qStatus(q.id)]}</StatusChip> },
                  { key: 'a', header: 'Action', align: 'center', render: (q) => <Button small onClick={() => setQuestion(q.id)}>{qStatus(q.id) === 'open' ? 'Respond' : 'View'}</Button> },
                ]} />
            </Card>
          </div>
        </div>
        <div className="stack">
          <Card title="Zonal Manager endorsement" icon={ClipboardCheck} right={<Button small icon={Save} disabled={!review.dirty} onClick={review.save}>Save review</Button>}>
            <Field label="Review comments (revalidation and endorsement)">
              <textarea className={`input${review.dirty ? ' chg' : ''}`} rows={4} maxLength={1000} aria-label="Revalidation comments" value={review.draft} onChange={(e) => review.setDraft(e.target.value)} />
              <small>{review.draft.length} / 1000</small>
            </Field>
            <Field label="Endorsed crop / product scope">
              <Select label="Endorsed scope" value={scope} onChange={setScope} options={[opt('all', 'All crops · crop nutrition portfolio'), ...p.crops.map((c) => opt(c.crop, `${c.crop} only`))]} />
            </Field>
            <label className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={exception} onChange={(e) => setException(e.target.checked)} aria-label="Authorised exception" />
              <span>Authorise the {crore(v2Gap)} planning gap as an exception</span>
            </label>
            <div className="stack" style={{ gap: 8 }}>
              <Button icon={MessageSquare} onClick={() => setCorrection(true)}>Request further changes</Button>
              <div className="row">
                <Button small icon={FileSearch} onClick={() => setEvidence(originalPlanEvidence(t))}>View original plan</Button>
                <Button small icon={FileSearch} onClick={() => setEvidence({ title: `Revised plan: ${p.name}`, owner: `${ownerOf(t)} · version 2`, facts: rows.map((x) => ({ label: x.param, value: x.rev })) })}>View revised plan</Button>
              </div>
            </div>
          </Card>
          <Notes title="Revalidation notes" items={[
            isAmbad ? `Version 2 adds ${lakh(r.rev.plan - r.orig.plan)} of onion (${r.villages.map((x) => `${x.village} +${lakh(x.rev - x.orig)}`).join(', ')}).` : 'No revised version has been submitted for this territory.',
            `Remaining gap ${crore(v2Gap)} against the ${crore(p.abp)} ABP.`,
            `${rows.filter((x) => x.changed).length} parameters changed between versions.`,
            `${openQ} of ${questions.length} Marketing Head questions open.`,
          ]} />
        </div>
      </div>
      {question && <ClarificationDrawer t={t} qid={question} setQid={setQuestion} onClose={() => setQuestion(null)} />}
      {correction && <PlanCorrectionDrawer t={t} onClose={() => setCorrection(false)} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </ZmPage>
  );
}
const REALISATION = FUNNEL_DEFAULTS.rupeesPerKg;

const RESPONSE_TYPES = ['Explain existing plan', 'Revise plan with Field Sales Manager', 'Provide market evidence'];
function ClarificationDrawer({ t, qid, setQid, onClose }: { t: ZmTerritoryId; qid: string; setQid: (id: string) => void; onClose: () => void }) {
  const bh = useBhStore();
  const zm = useZmStore();
  const p = territoryPlan(t);
  const questions = [...MH_QUESTIONS, ...zm.extraQuestions];
  const q = questions.find((x) => x.id === qid)!;
  const qStatus = (id: string) => zm.questions[id] ?? questions.find((x) => x.id === id)!.status;
  const [type, setType] = useState(RESPONSE_TYPES[0]);
  const [owner, setOwner] = useState('Zonal Manager');
  const [due, setDue] = useState('');
  const [text, setText] = useState(zm.responses[qid] ?? '');
  const [tried, setTried] = useState(false);
  const err = text.trim().length < 10 ? 'Enter a response of at least 10 characters' : '';
  const open = questions.filter((x) => qStatus(x.id) === 'open').length;
  const submit = () => {
    setTried(true);
    if (err) return;
    zm.answer(qid, text.trim());
    bh.toast(`Response to "${q.topic}" submitted to Marketing Head`);
    const next = questions.find((x) => x.id !== qid && qStatus(x.id) === 'open');
    if (next) { setQid(next.id); setText(''); setTried(false); } else onClose();
  };
  const pick = (id: string) => { setQid(id); setText(zm.responses[id] ?? ''); setTried(false); };
  return (
    <Drawer title={`Marketing Head clarification: ${p.name} onion plan`} onClose={onClose}
      status={<StatusChip tone={open ? 'warn' : 'ok'}>{open ? `${open} question${open === 1 ? '' : 's'} awaiting response` : 'All questions responded'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} disabled={qStatus(qid) !== 'open'} onClick={submit}>Submit response to Marketing Head</Button>} />}>
      <div className="kpis">
        <KpiCard label="Territory ABP" value={crore(p.abp)} />
        <KpiCard label="Submitted plan (version 1)" value={crore(p.plan)} />
        <KpiCard label="Onion allocation (version 1)" value={crore(p.crops[0].proposed)} />
      </div>
      <Card title="Marketing Head questions" icon={MessageSquare} flush>
        <DataTable selectable rows={questions} rowKey={(x) => x.id} selected={qid} onRowClick={(x) => pick(x.id)}
          columns={[
            { key: 'q', header: 'Question', render: (x) => x.question },
            { key: 's', header: 'Status', align: 'center', render: (x) => <StatusChip tone={Q_TONE[qStatus(x.id)]}>{Q_LABEL[qStatus(x.id)]}</StatusChip> },
          ]} />
      </Card>
      <Card title={`Response: ${q.topic}`} icon={FileText}>
        <p style={{ margin: 0 }}><b>{q.question}</b></p>
        <div className="form-grid">
          <Field label="Response type *"><Select label="Response type" value={type} onChange={setType} options={RESPONSE_TYPES.map((x) => opt(x, x))} /></Field>
          <Field label="Responsible owner *"><Select label="Responsible owner" value={owner} onChange={setOwner} options={['Zonal Manager', ownerOf(t), 'Zonal analyst'].map((x) => opt(x, x))} /></Field>
          <Field label="Response due date"><input className="input" type="date" aria-label="Response due date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Attach evidence"><Attach label="Attach evidence" /></Field>
        </div>
        <Field label="Zonal Manager response *" error={tried ? err : ''}>
          <textarea className="input" rows={4} maxLength={1000} aria-label="Zonal Manager response" value={text} disabled={qStatus(qid) !== 'open'} onChange={(e) => setText(e.target.value)} />
          <small>{text.length} / 1000</small>
        </Field>
      </Card>
      <Notes title="Clarification notes" items={[
        `Onion plan ${crore(p.crops[0].proposed)} in version 1; version 2 proposes ${crore(revisedPlan().rev.onion)}.`,
        `Realisation basis ₹${REALISATION}/kg and ${FUNNEL_DEFAULTS.kgPerAcre} kg/acre application rate.`,
        `${open} of ${questions.length} questions still open.`,
      ]} />
    </Drawer>
  );
}


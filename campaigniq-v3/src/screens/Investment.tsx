/**
 * Screens 7–10 — Marketing Investment & ROI (BH.3a.png), Campaign Investment (BH.3b.png),
 * Commercial Returns (BH.3d.png), Reallocation Simulator (BH.3e.png).
 */
import { ArrowLeftRight, Calculator, CalendarClock, CalendarDays, ChartColumn, ChartColumnBig, Coins, FileSearch, Percent, RotateCcw, Save, Scale, ShieldCheck, ShoppingCart, Target, TrendingUp, Users, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Bar as RBar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import {
  businessCase, CAMPAIGNS, nationalReturns, netRoi, regionRoi, campaignById, campaignMetrics, campaignsOf, campaignTotals, CROP_MIX, DEFAULT_REALLOCATION, NATIONAL, NATIONAL_METRICS,
  PRODUCT_MIX, REGIONS, regionById, regionMetrics, THEMES, type Campaign, type CampaignId, type MixRow, type RegionId,
} from '../data/bh';
import { crore, lakh, num, pct, rupees, sum, times } from '../data/format';
import { R } from '../routes';
import { useBhStore } from '../store/bhStore';
import { C, SERIES } from '../theme';
import { GroupedBars, HBars, Legend, Waterfall } from '../ui/charts';
import { Bar, Breadcrumb, Button, Card, FilterBar, FooterBar, KpiCard, PageHeader, SegmentedControl, Select, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { EvidenceDrawer, type Evidence } from '../ui/overlay';
import { ALL, CAMPAIGN_OPTIONS, CROP_OPTIONS, PRODUCT_OPTIONS, REGION_OPTIONS, THEME_OPTIONS, useDrillRegion, useGo, useRouteRegion, useScopeFilter } from './common';

const perAdopter = (actualL: number, adopters: number) => Math.round((actualL * 100000) / adopters);

function StatusList({ items }: { items: { icon: typeof Coins; label: string; value: ReactNode }[] }) {
  return <>{items.map((i) => <div key={i.label} className="list-row"><i.icon size={16} />{i.label}<span className="right">{i.value}</span></div>)}</>;
}

// ================================================================ shared card: investment per recorded adopter
/** All four regions, highest first; the scope region in amber with a bold label; dashed national average line. */
function PerAdopterCard({ scope }: { scope: RegionId | null }) {
  const rows = [...REGIONS].sort((a, b) => regionMetrics(b).perAdopter - regionMetrics(a).perAdopter)
    .map((r) => ({ id: r.id, name: r.name, value: regionMetrics(r).perAdopter, actual: r.actual, adopters: r.adopters }));
  const avg = NATIONAL_METRICS.perAdopter;
  const max = Math.ceil((rows[0].value * 1.08) / 1000) * 1000;
  const Tick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={13} fill={C.ink} fontWeight={rows.find((r) => r.name === payload?.value)?.id === scope ? 700 : 400}>{payload?.value}</text>
  );
  return (
    <Card title="Investment per recorded adopter" icon={Users}>
      <div className="muted" style={{ fontSize: 12, marginTop: -6 }}>Actual investment ÷ recorded adopters, YTD</div>
      <div style={{ flex: 1, minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 18, right: 64, left: 4, bottom: 0 }} barCategoryGap="28%">
            <XAxis type="number" hide domain={[0, max]} />
            <YAxis type="category" dataKey="name" width={56} tick={<Tick />} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: C.canvas }} content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as (typeof rows)[number] | undefined;
              return p ? <div className="toast" style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}` }}>Investment {lakh(p.actual)} · Adopters {num(p.adopters)} · {rupees(p.value)} per adopter</div> : null;
            }} />
            <ReferenceLine x={avg} stroke={C.inkSoft} strokeDasharray="4 4" label={{ value: `National avg ${rupees(avg)}`, position: 'top', fontSize: 12, fill: C.inkSoft }} />
            <RBar dataKey="value" barSize={16} radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.id} fill={r.id === scope ? C.amber : C.brand} />)}
              <LabelList dataKey="value" position="right" formatter={(v: number) => rupees(v)} style={{ fontSize: 12, fontWeight: 600, fill: C.ink }} />
            </RBar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ================================================================ 7 Marketing Investment & ROI
type InvView = 'region' | 'crop' | 'product' | 'theme' | 'campaign';

export function InvestmentRoi() {
  const go = useGo();
  const [region, setRegion] = useScopeFilter();
  const drill = useDrillRegion();
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [campaign, setCampaign] = useState(ALL);
  const [view, setView] = useState<InvView>('region');
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const regions = REGIONS.filter((r) => region === ALL || r.id === region);
  const k = { approved: sum(regions, (r) => r.approved), actual: sum(regions, (r) => r.actual) };

  const mix: MixRow[] = view === 'crop' ? CROP_MIX.filter((m) => crop === ALL || m.name === crop)
    : view === 'product' ? PRODUCT_MIX.filter((m) => product === ALL || m.name === product)
    : view === 'theme' ? THEMES.filter((t) => theme === ALL || t.id === theme).map((t) => ({ id: t.id, name: t.name, campaigns: 0, investment: t.investment, adopters: t.adopters, sales: t.sales }))
    : campaignsOf('west').filter((c) => campaign === ALL || c.id === campaign).map((c) => ({ id: c.id, name: c.name, campaigns: 1, investment: c.actual, adopters: c.adopters, sales: c.sales }));
  const label = { region: 'Region', crop: 'Crop', product: 'Product', theme: 'Theme', campaign: 'Campaign' }[view];

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Marketing investment & ROI' }, { label: region === ALL ? 'National portfolio' : `${regionById(region as never).name} region` }]} />
      <PageHeader title="Marketing Investment & ROI" />
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'theme', label: 'Theme', value: theme, options: THEME_OPTIONS, onChange: setTheme },
        { key: 'campaign', label: 'Campaign', value: campaign, options: CAMPAIGN_OPTIONS, onChange: setCampaign },
      ]} />
      <SegmentedControl<InvView> label="Analytical view" value={view} onChange={setView} options={[
        { value: 'region', label: 'Region-wise' }, { value: 'crop', label: 'Crop-wise' }, { value: 'product', label: 'Product-wise' }, { value: 'theme', label: 'Theme-wise' }, { value: 'campaign', label: 'Campaign-wise' },
      ]} />
      <div className="kpis">
        <KpiCard icon={Wallet} label="Approved marketing budget" value={crore(k.approved)} sub={`across ${regions.length} region${regions.length > 1 ? 's' : ''}`} />
        <KpiCard icon={ChartColumnBig} label="Actual marketing investment" value={crore(k.actual)} sub={<>of {crore(k.approved)}<StatusChip tone="ok">{pct((k.actual / k.approved) * 100, 0)}</StatusChip></>} ratio={(k.actual / k.approved) * 100} />
        <KpiCard icon={Calculator} label="Unspent budget" value={lakh(k.approved - k.actual)} sub="not yet spent" />
        <KpiCard icon={Target} label="Budget utilisation" value={pct((k.actual / k.approved) * 100, 0)} sub={`${crore(k.actual)} of ${crore(k.approved)}`} ratio={(k.actual / k.approved) * 100} />
      </div>

      <Card title={`${label}-wise marketing investment and efficiency`} icon={Coins} flush>
        {view === 'region' ? (
          <DataTable rows={regions} rowKey={(r) => r.id} onRowClick={(r) => go(R.campaignInvestment(r.id))}
            columns={[
              { key: 'n', header: 'Region', render: (r) => <b>{r.name}</b> },
              { key: 'ap', header: 'Approved budget', align: 'right', render: (r) => lakh(r.approved) },
              { key: 'ac', header: 'Actual investment', align: 'right', render: (r) => lakh(r.actual) },
              { key: 'un', header: 'Unspent budget', align: 'right', render: (r) => lakh(regionMetrics(r).unspent) },
              { key: 'ut', header: 'Utilisation', render: (r) => <span className="progress"><b>{pct(regionMetrics(r).utilisationPct)}</b><Bar value={regionMetrics(r).utilisationPct} /></span> },
              { key: 'ad', header: 'Recorded adopters', align: 'right', render: (r) => num(r.adopters) },
              { key: 'pa', header: 'Investment per recorded adopter', align: 'right', render: (r) => rupees(regionMetrics(r).perAdopter) },
              { key: 'roi', header: 'Actual net ROI', align: 'center', render: (r) => <StatusChip tone="ok">{times(regionRoi(r))}</StatusChip> },
              { key: 'v', header: 'View', align: 'center', render: (r) => <Button small onClick={() => go(R.campaignInvestment(r.id))}>View</Button> },
            ]}
            total={{ n: region === ALL ? 'National (total)' : 'Total', ap: lakh(k.approved), ac: lakh(k.actual), un: lakh(k.approved - k.actual), ut: <span className="progress"><b>{pct((k.actual / k.approved) * 100)}</b><Bar value={(k.actual / k.approved) * 100} /></span>, ad: num(sum(regions, (r) => r.adopters)), pa: rupees(perAdopter(k.actual, sum(regions, (r) => r.adopters))), roi: '–' }}
          />
        ) : (
          <DataTable rows={mix} rowKey={(m) => m.id}
            columns={[
              { key: 'n', header: label, render: (m) => <b>{m.name}</b> },
              { key: 'ac', header: 'Actual investment', align: 'right', render: (m) => lakh(m.investment) },
              { key: 'sh', header: 'Share of investment', align: 'right', render: (m) => pct((m.investment / NATIONAL.actual) * 100) },
              { key: 'ad', header: 'Recorded adopters', align: 'right', render: (m) => num(m.adopters) },
              { key: 'pa', header: 'Investment per recorded adopter', align: 'right', render: (m) => rupees(perAdopter(m.investment, m.adopters)) },
              { key: 'roi', header: 'Actual net ROI', align: 'center', render: (m) => <StatusChip tone="ok">{times(netRoi(m.sales, m.investment))}</StatusChip> },
            ]}
            total={{ n: 'Total', ac: lakh(sum(mix, (m) => m.investment)), sh: pct((sum(mix, (m) => m.investment) / NATIONAL.actual) * 100), ad: num(sum(mix, (m) => m.adopters)), pa: rupees(perAdopter(sum(mix, (m) => m.investment), sum(mix, (m) => m.adopters))), roi: '–' }}
          />
        )}
      </Card>

      <div className="grid" style={{ gridTemplateColumns: '1.15fr 1fr .8fr' }}>
        <Card title="Approved vs actual marketing investment" note="₹ lakh" icon={ChartColumn}>
          <GroupedBars data={regions.map((r) => ({ region: r.name, approved: r.approved, actual: r.actual }))} x="region"
            series={[{ key: 'approved', label: 'Approved', color: SERIES.planned }, { key: 'actual', label: 'Actual', color: SERIES.observed }]} />
        </Card>
        <PerAdopterCard scope={region === ALL ? null : (region as RegionId)} />
        <Card title="Financial status" note={region === ALL ? 'National' : undefined} icon={ShieldCheck} right={
<Button small icon={FileSearch} onClick={() => setEvidence({
          title: 'ROI evidence — national portfolio', owner: 'Zonal Manager attribution records',
          status: <StatusChip tone="ok">Attribution complete</StatusChip>,
          facts: [
            { label: 'Campaigns with a business case', value: `${CAMPAIGNS.filter((c) => businessCase(c.id)).length} of ${NATIONAL.campaigns}` },
            { label: 'Forecast net ROI (Retailer-led Croptek conversion)', value: times(businessCase('croptek')!.netRoi) },
            { label: 'Purchase matching', value: 'Complete' },
            { label: 'Validated incremental sales', value: crore(nationalReturns().sales) },
            { label: 'Portfolio net ROI', value: times(nationalReturns().roi) },
            { label: 'Investment per recorded adopter', value: rupees(NATIONAL_METRICS.perAdopter) },
          ],
        })}>ROI evidence</Button>
        }>
          <StatusList items={[
            { icon: ChartColumn, label: 'Actual net ROI', value: <StatusChip tone="ok">{times(netRoi(sum(regions, (r) => r.sales), k.actual))}</StatusChip> },
            { icon: Coins, label: 'Incremental sales', value: <StatusChip tone="ok">{crore(sum(regions, (r) => r.sales))}</StatusChip> },
            { icon: CalendarDays, label: 'Outstanding commitments', value: <StatusChip tone="warn">Verify</StatusChip> },
          ]} />
        </Card>
      </div>

      <FooterBar onBack={() => go(R.command)} onNext={() => go(R.campaignInvestment(region === ALL ? drill : (region as never)))} />
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}

// ================================================================ 8 Campaign Investment
export function CampaignInvestment() {
  const go = useGo();
  const region = useRouteRegion();
  const r = regionById(region);
  const camps = campaignsOf(region);
  const t = camps.length ? campaignTotals(region) : null;
  const maxApproved = Math.max(1, ...camps.map((c) => c.approved));

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Marketing investment & ROI', onClick: () => go(R.investment) }, { label: `${r.name} region` }, { label: 'Campaign investment' }]} />
      <PageHeader title={`${r.name} Region Campaign Investment`} />
      <div className="kpis">
        <KpiCard icon={Wallet} label="Approved budget" value={lakh(r.approved)} sub={`across ${camps.length} campaigns`} />
        <KpiCard icon={ChartColumnBig} label="Actual investment" value={lakh(r.actual)} sub={<>of {lakh(r.approved)}<StatusChip tone="ok">{pct(regionMetrics(r).utilisationPct, 0)}</StatusChip></>} ratio={regionMetrics(r).utilisationPct} />
        <KpiCard icon={Calculator} label="Unspent budget" value={lakh(regionMetrics(r).unspent)} sub="not yet spent" />
        <KpiCard icon={Target} label="Utilisation" value={pct(regionMetrics(r).utilisationPct, 0)} sub={`${lakh(r.actual)} of ${lakh(r.approved)}`} ratio={regionMetrics(r).utilisationPct} />
      </div>
      <Card title="Campaign-wise investment allocation" icon={Coins} flush>
        {camps.length && t ? (
          <DataTable rows={camps} rowKey={(c) => c.id} onRowClick={(c) => go(R.returns(region, c.id))}
            columns={[
              { key: 'n', header: 'Campaign', render: (c) => c.name },
              { key: 'ap', header: 'Approved budget', align: 'right', render: (c) => lakh(c.approved) },
              { key: 'ac', header: 'Actual investment', align: 'right', render: (c) => lakh(c.actual) },
              { key: 'un', header: 'Unspent budget', align: 'right', render: (c) => lakh(campaignMetrics(c).unspent) },
              { key: 'ut', header: 'Utilisation', render: (c) => <span className="progress"><b>{pct(campaignMetrics(c).utilisationPct)}</b><Bar value={campaignMetrics(c).utilisationPct} /></span> },
              { key: 'ad', header: 'Recorded adopters', align: 'right', render: (c) => num(c.adopters) },
              { key: 'pa', header: 'Investment per recorded adopter', align: 'right', render: (c) => rupees(campaignMetrics(c).perAdopter) },
            ]}
            total={{ n: `Total (${r.name} region)`, ap: lakh(t.approved), ac: lakh(t.actual), un: lakh(t.unspent), ut: <span className="progress"><b>{pct(t.utilisationPct)}</b><Bar value={t.utilisationPct} /></span>, ad: num(t.adopters), pa: rupees(t.perAdopter) }}
          />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">Campaign-level records pending</StatusChip></div>}
      </Card>
      {camps.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: '1.15fr 1fr .85fr' }}>
          <Card title="Investment allocation by campaign" note="₹ lakh" icon={ChartColumn} right={<Legend series={[{ key: 'a', label: 'Actual investment', color: SERIES.planned }, { key: 'u', label: 'Unspent budget', color: SERIES.observed }]} />}>
            <div className="hbars">
              {camps.map((c) => (
                <div key={c.id} className="hbar">
                  <span>{c.short}</span>
                  <div className="track">
                    <i style={{ width: `${(c.actual / maxApproved) * 80}%`, background: SERIES.planned, color: 'var(--card)', fontSize: 12, fontStyle: 'normal', fontWeight: 700, textAlign: 'center', height: 18, lineHeight: '18px' }}>{c.actual}</i>
                    <i style={{ width: `${(campaignMetrics(c).unspent / maxApproved) * 80}%`, background: SERIES.observed, marginLeft: -6, fontSize: 12, fontStyle: 'normal', fontWeight: 700, textAlign: 'center', height: 18, lineHeight: '18px' }}>{campaignMetrics(c).unspent}</i>
                    <b>{c.approved}</b>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <PerAdopterCard scope={region} />
          <Card title="Reallocation readiness" icon={ArrowLeftRight}>
            <StatusList items={[
              { icon: Coins, label: 'Unspent budget', value: <StatusChip tone="ok">{lakh(regionMetrics(r).unspent)}</StatusChip> },
              { icon: CalendarDays, label: 'Outstanding commitments', value: <StatusChip tone="neutral">Pending</StatusChip> },
              { icon: CalendarClock, label: 'Future planned expenditure', value: <StatusChip tone="neutral">Pending</StatusChip> },
              { icon: ArrowLeftRight, label: 'Available for reallocation', value: <StatusChip tone="warn">Not determined</StatusChip> },
            ]} />
          </Card>
        </div>
      )}
      <FooterBar onBack={() => go(R.investment)} onNext={() => go(R.returns(region))} />
    </div>
  );
}

// ================================================================ 9 Commercial Returns
export function CommercialReturns() {
  const go = useGo();
  const region = useRouteRegion();
  const r = regionById(region);
  const [params, setParams] = useSearchParams();
  const camps = campaignsOf(region);
  const selId = (params.get('campaign') as CampaignId | null) ?? camps[0]?.id ?? null;
  const sel = selId ? campaignById(selId) : null;
  const bc = businessCase(sel?.id ?? 'croptek');
  const t = camps.length ? campaignTotals(region) : null;
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Marketing investment & ROI', onClick: () => go(R.investment) }, { label: `${r.name} region`, onClick: () => go(R.campaignInvestment(region)) }, { label: 'Commercial returns' }]} />
      <PageHeader title={`${r.name} Region Commercial Returns`} />
      <div className="kpis">
        <KpiCard icon={Wallet} label="Approved budget" value={lakh(r.approved)} sub={`across ${camps.length} campaigns`} />
        <KpiCard icon={ChartColumnBig} label="Actual investment" value={lakh(r.actual)} sub={<>of {lakh(r.approved)}<StatusChip tone="ok">{pct(regionMetrics(r).utilisationPct, 0)}</StatusChip></>} ratio={regionMetrics(r).utilisationPct} />
        <KpiCard icon={Users} label="Recorded adopters" value={num(r.adopters)} sub="farmers" />
        <KpiCard icon={Target} label="Actual net ROI" value={times(regionRoi(r))} sub={`on ${lakh(r.sales)} incremental sales`} />
      </div>
      <Card title="Campaign commercial return matrix" icon={Coins} flush>
        {camps.length && t ? (
          <DataTable rows={camps} rowKey={(c) => c.id} selected={selId} onRowClick={(c) => setParams({ campaign: c.id })}
            columns={[
              { key: 'n', header: 'Campaign', render: (c) => <span className="row"><span className={`radio${c.id === selId ? ' on' : ''}`} />{c.name}</span> },
              { key: 'ap', header: 'Approved investment', align: 'right', render: (c) => lakh(c.approved) },
              { key: 'ac', header: 'Actual investment', align: 'right', render: (c) => lakh(c.actual) },
              { key: 'ad', header: 'Recorded adopters', align: 'right', render: (c) => num(c.adopters) },
              { key: 'fs', header: 'Forecast incremental sales', align: 'right', render: (c) => { const b = businessCase(c.id); return <b>{lakh(b.forecastSales)}</b>; } },
              { key: 'fc', header: 'Forecast contribution', align: 'right', render: (c) => { const b = businessCase(c.id); return <b>{lakh(b.contribution)}</b>; } },
              { key: 'fr', header: 'Forecast net ROI', align: 'center', render: (c) => { const b = businessCase(c.id); return <StatusChip tone="ok">{times(b.netRoi)}</StatusChip>; } },
              { key: 'as', header: 'Actual incremental sales', align: 'right', render: (c) => lakh(c.sales) },
              { key: 'ar', header: 'Actual net ROI', align: 'center', render: (c) => <StatusChip tone="ok">{times(netRoi(c.sales, c.actual))}</StatusChip> },
            ]}
            total={{ n: `${r.name} region (total)`, ap: lakh(t.approved), ac: lakh(t.actual), ad: num(t.adopters), fs: '–', fc: '–', fr: '–', as: lakh(r.sales), ar: <StatusChip tone="ok">{times(regionRoi(r))}</StatusChip> }}
          />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">Campaign-level records pending</StatusChip></div>}
      </Card>
      {sel && (
        <div className="grid" style={{ gridTemplateColumns: '1.3fr .9fr 1fr' }}>
          <Card title={`${sel.name} — financial forecast`} note="₹ lakh" icon={ChartColumn} right={bc ? <StatusChip tone="warn">Forecast</StatusChip> : undefined}>
            {bc ? (
              <Waterfall steps={[
                { label: 'Forecast sales', value: bc.forecastSales, total: true },
                { label: `Variable costs (${bc.variableCostPct}%)`, value: -bc.variableCosts },
                { label: `Contribution (${bc.contributionPct}%)`, value: bc.contribution, total: true },
                { label: 'Investment', value: -bc.investment },
                { label: 'Net return', value: bc.netReturn, total: true },
              ]} />
            ) : null}
          </Card>
          <Card title="Business case metrics" icon={Scale} right={
          <Button small icon={FileSearch} onClick={() => setEvidence({
            title: `Business case — ${sel.name}`, owner: 'Zonal Manager campaign business case',
            status: <StatusChip tone="ok">{bc.forecastSales === Math.round((sel.sales * sel.approved) / sel.actual) ? 'Projected from validated sales' : 'Approved'}</StatusChip>,
            facts: bc ? [
              { label: 'Approved investment', value: lakh(bc.investment) },
              { label: 'Forecast incremental sales', value: lakh(bc.forecastSales) },
              { label: 'Variable costs', value: `${lakh(bc.variableCosts)} (${bc.variableCostPct}%)` },
              { label: 'Contribution', value: `${lakh(bc.contribution)} (${bc.contributionPct}%)` },
              { label: 'Forecast net return', value: lakh(bc.netReturn) },
              { label: 'Forecast net ROI', value: times(bc.netRoi) },
            ] : [],
          })}>Business case</Button>
          }>
            <StatusList items={[
              { icon: Percent, label: 'Contribution margin (assumed)', value: <StatusChip tone="ok">{bc.contributionPct}%</StatusChip> },
              { icon: TrendingUp, label: 'Forecast net ROI (full campaign)', value: <StatusChip tone="ok">{times(bc.netRoi)}</StatusChip> },
              { icon: Coins, label: 'Budget utilisation', value: <StatusChip tone="ok">{pct(campaignMetrics(sel).utilisationPct, 0)}</StatusChip> },
            ]} />
          </Card>
          <Card title="Attribution readiness" icon={ShieldCheck} right={
          <Button small icon={ShieldCheck} onClick={() => setEvidence({
            title: `Attribution evidence — ${sel.name}`, owner: 'Zonal Manager attribution record',
            status: <StatusChip tone="ok">Attribution complete</StatusChip>,
            facts: [{ label: 'Recorded adopters', value: num(sel.adopters) }, { label: 'Purchase matching', value: 'Complete' }, { label: 'Validated incremental sales', value: lakh(sel.sales) }, { label: 'Actual net ROI', value: times(netRoi(sel.sales, sel.actual)) }],
          })}>Attribution evidence</Button>
          }>
            <StatusList items={[
              { icon: ShoppingCart, label: 'Purchase matching', value: <StatusChip tone="ok">Complete</StatusChip> },
              { icon: ChartColumn, label: 'Comparable sales baseline', value: <StatusChip tone="ok">Complete</StatusChip> },
              { icon: Coins, label: 'Actual contribution margin', value: <StatusChip tone="ok">Complete</StatusChip> },
              { icon: Target, label: 'Attributable commercial uplift', value: <StatusChip tone="ok">Complete</StatusChip> },
            ]} />
          </Card>
        </div>
      )}
      <FooterBar onBack={() => go(R.campaignInvestment(region))} onNext={() => go(R.reallocation(region))} />
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}

// ================================================================ 10 Reallocation Simulator
export function Reallocation() {
  const go = useGo();
  const store = useBhStore();
  const region = useRouteRegion();
  const r = regionById(region);
  const camps = campaignsOf(region);
  const saved = store.scenarios.find((s) => s.region === region);
  const start = saved ?? { ...DEFAULT_REALLOCATION, region, name: `${r.name} reallocation scenario 1` };
  const [from, setFrom] = useState<CampaignId>(start.from);
  const [to, setTo] = useState<CampaignId>(start.to);
  const [amount, setAmount] = useState(start.amount);
  const [name, setName] = useState(saved?.name ?? `${r.name} reallocation scenario 1`);
  if (!camps.length) return <div className="page"><PageHeader title="Reallocation Simulator" /><StatusChip tone="neutral">Campaign-level records pending</StatusChip><FooterBar onBack={() => go(R.returns(region))} onNext={() => go(R.opportunity)} /></div>;

  const maxMove = campaignMetrics(campaignById(from)).unspent;
  const amt = Math.min(amount, maxMove);
  const adj = (c: Campaign) => (c.id === to && from !== to ? amt : c.id === from && from !== to ? -amt : 0);
  const rows = camps.map((c) => ({ c, adj: adj(c), revised: c.approved + adj(c), revisedUnspent: campaignMetrics(c).unspent + adj(c) }));
  const t = campaignTotals(region);
  const net = sum(rows, (x) => x.adj);
  const opts = camps.map((c) => ({ value: c.id, label: c.name }));
  const reset = () => { setFrom(DEFAULT_REALLOCATION.from); setTo(DEFAULT_REALLOCATION.to); setAmount(DEFAULT_REALLOCATION.amount); setName(`${r.name} reallocation scenario 1`); };
  const save = () => { store.saveScenario({ id: `${region}-scenario`, name, region, from, to, amount: amt }); store.toast(`Scenario "${name}" saved`); };
  const request = () => {
    save();
    store.updateIntervention('reallocation', { trigger: `₹${amt} L simulated transfer`, status: 'awaiting_response', statusLabel: 'Review requested', geography: r.name });
    store.toast('Review requested from Marketing Head and Finance');
    go(`${R.tracker}?selected=reallocation`);
  };
  const adjChip = (v: number) => (v > 0 ? <StatusChip tone="ok">+{lakh(v)}</StatusChip> : v < 0 ? <StatusChip tone="warn">–{lakh(-v)}</StatusChip> : lakh(0));

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Marketing investment & ROI', onClick: () => go(R.investment) }, { label: `${r.name} region`, onClick: () => go(R.campaignInvestment(region)) }, { label: 'Reallocation simulator' }]} />
      <PageHeader title="Reallocation Simulator" right={<StatusChip tone="warn">What-if draft · not approved</StatusChip>} />
      <div className="kpis">
        <KpiCard icon={Wallet} label="Approved budget" value={lakh(t.approved)} sub={`across ${camps.length} campaigns`} />
        <KpiCard icon={ChartColumnBig} label="Actual investment" value={lakh(t.actual)} sub={<>of {lakh(t.approved)}<StatusChip tone="ok">{pct(t.utilisationPct, 0)}</StatusChip></>} ratio={t.utilisationPct} />
        <KpiCard icon={Calculator} label="Unspent budget" value={lakh(t.unspent)} sub="not yet spent" />
        <KpiCard icon={ArrowLeftRight} label="Simulated transfer" value={lakh(from === to ? 0 : amt)} sub={`${campaignById(from).short} → ${campaignById(to).short}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)' }}>
        <Card title="Campaign budget reallocation" icon={Coins} flush>
          <DataTable rows={rows} rowKey={(x) => x.c.id}
            columns={[
              { key: 'n', header: 'Campaign', render: (x) => x.c.name },
              { key: 'ap', header: 'Existing approved budget', align: 'right', render: (x) => lakh(x.c.approved) },
              { key: 'ac', header: 'Actual investment', align: 'right', render: (x) => lakh(x.c.actual) },
              { key: 'un', header: 'Unspent budget', align: 'right', render: (x) => lakh(campaignMetrics(x.c).unspent) },
              { key: 'ad', header: 'Proposed adjustment', align: 'center', render: (x) => adjChip(x.adj) },
              { key: 'rb', header: 'Simulated revised budget', align: 'right', render: (x) => lakh(x.revised) },
              { key: 'ru', header: 'Revised unspent budget', align: 'right', render: (x) => lakh(x.revisedUnspent) },
            ]}
            total={{ n: 'Total', ap: lakh(t.approved), ac: lakh(t.actual), un: lakh(t.unspent), ad: lakh(net), rb: lakh(sum(rows, (x) => x.revised)), ru: lakh(sum(rows, (x) => x.revisedUnspent)) }}
          />
        </Card>
        <Card title="Reallocation controls" icon={ArrowLeftRight}>
          <label className="field"><span>Transfer from</span><Select label="Transfer from" value={from} options={opts} onChange={(v) => { setFrom(v as CampaignId); setAmount((a) => Math.min(a, campaignMetrics(campaignById(v as CampaignId)).unspent)); }} /></label>
          <label className="field"><span>Transfer to</span><Select label="Transfer to" value={to} options={opts.filter((o) => o.value !== from)} onChange={(v) => setTo(v as CampaignId)} /></label>
          <label className="field"><span>Amount: {lakh(amt)}</span>
            <div className="row"><span className="muted">{lakh(0)}</span><input type="range" min={0} max={maxMove} step={0.5} value={amt} onChange={(e) => setAmount(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--brand)' }} aria-label="Transfer amount" /><span className="muted">{lakh(maxMove)}</span></div>
          </label>
          <label className="field"><span>Scenario name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div className="row" style={{ marginTop: 'auto', flexWrap: 'wrap' }}><Button icon={RotateCcw} onClick={reset}>Reset</Button><Button icon={Save} onClick={save}>Save scenario</Button><Button disabled title="Finance validation pending">Approve reallocation</Button></div>
          <Button primary onClick={from !== to && amt > 0 ? request : undefined}>Request Marketing Head &amp; Finance review</Button>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
        <Card title="Existing vs simulated budget by campaign" note="₹ lakh" icon={ChartColumn} right={<Legend series={[{ key: 'e', label: 'Existing budget', color: SERIES.planned }, { key: 's', label: 'Simulated budget', color: SERIES.observed }]} />}>
          <HBars rows={rows.map((x) => ({ label: x.c.name, values: [x.c.approved, x.revised] }))}
            series={[{ key: 'e', label: 'Existing', color: SERIES.planned }, { key: 's', label: 'Simulated', color: SERIES.observed }]}
            max={Math.max(...rows.map((x) => Math.max(x.c.approved, x.revised)))} format={(v) => String(v)} labelWidth={210} />
        </Card>
        <Card title="Financial impact and validation" icon={ShieldCheck}>
          <StatusList items={[
            { icon: Coins, label: `${r.name} budget`, value: <StatusChip tone="ok">{lakh(sum(rows, (x) => x.revised))} · unchanged</StatusChip> },
            { icon: Coins, label: 'National budget', value: <StatusChip tone="ok">{crore(NATIONAL.approved)} · unchanged</StatusChip> },
            { icon: ArrowLeftRight, label: 'Net adjustment', value: <StatusChip tone="ok">{lakh(net)}</StatusChip> },
            { icon: CalendarDays, label: 'Outstanding commitments', value: <StatusChip tone="neutral">Pending</StatusChip> },
            { icon: CalendarClock, label: 'Future planned expenditure', value: <StatusChip tone="neutral">Pending</StatusChip> },
            { icon: ChartColumn, label: 'Revised incremental sales forecast', value: <StatusChip tone="warn">Recalculate</StatusChip> },
            { icon: Target, label: 'Revised ROI', value: <StatusChip tone="warn">Recalculate</StatusChip> },
            { icon: ShieldCheck, label: 'Finance validation', value: <StatusChip tone="neutral">Pending</StatusChip> },
          ]} />
        </Card>
      </div>
      <FooterBar onBack={() => go(R.returns(region))} onNext={() => go(R.opportunity)} />
    </div>
  );
}


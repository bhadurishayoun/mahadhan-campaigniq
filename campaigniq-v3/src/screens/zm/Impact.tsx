/** Zonal Manager screens 22–26: campaign performance, performance detail, diagnostics, next-season recommendations, AI Copilot workspace. */
import {
  ArrowRight, BookOpen, ChartColumn, CircleAlert, CircleCheck, ClipboardList, Eye, FileSearch, Layers, Lightbulb, ListChecks, MapPin, MessageCircle,
  Palette, Save, Search, Send, ShieldCheck, Target, TriangleAlert, type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AMBAD } from '../../data/bh';
import { crore, lakh, num, pct, times } from '../../data/format';
import { ACTIVITY_UNITS, FARMERS_REACHED, interventionEffectiveness, villagePerformance } from '../../data/fsm';
import {
  businessCaseC1, CATEGORIES, COLLATERAL_EFFECTIVENESS, impactRows, nextSeason, planCrops, portfolioCell, portfolioTotal, TEMPLATES, zmImpact,
  zmTerritoryName, type ImpactRow, type Priority, type TemplateId,
} from '../../data/zm';
import { Z, type ZmTerritoryId } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore } from '../../store/zmStore';
import { SERIES } from '../../theme';
import { GroupedBars, HBars } from '../../ui/charts';
import { DataTable } from '../../ui/DataTable';
import { Bar, Button, Card, FilterRows, KpiCard, PanelFooter, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer } from '../../ui/overlay';
import { ALL, opt, useGo } from '../common';
import { TEMPLATE_IMG } from './Collateral';
import { ZmPage, ZM_SECTION } from './frame';
import { List, Notes } from './parts';

const NA = <span className="na">NA</span>;
const l1 = (x: number) => lakh(Math.round(x * 10) / 10, 1);
const CONF_TONE: Record<ImpactRow['confidence'], Tone> = { Medium: 'warn', Low: 'warn', 'Not started': 'neutral' };
const PRIORITY_TONE: Record<Priority, Tone> = { High: 'risk', Medium: 'warn', Low: 'neutral' };
type View = 'territories' | 'villages' | 'activities';

/** Shared filter rows for screens 22 and 24: Crop · Product · Territory · Campaign; Territories / Villages / Activities. */
function useImpactFilters(defaultView: View) {
  const [view, setView] = useState<View>(defaultView);
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [territory, setTerritory] = useState(ALL);
  const [campaign, setCampaign] = useState(ALL);
  const [sortBy, setSortBy] = useState('adopters');
  const all = impactRows();
  const rows = all.filter((r) => (crop === ALL || r.crop === crop) && (product === ALL || r.product === product) && (territory === ALL || r.territory === territory) && (campaign === ALL || r.campaign === campaign))
    .sort((a, b) => (sortBy === 'abp' ? b.abp - a.abp : sortBy === 'name' ? a.territory.localeCompare(b.territory) : (b.adopters ?? -1) - (a.adopters ?? -1)));
  const header = (
    <FilterRows<View> view={view} setView={setView}
      views={[opt('territories', 'Territories'), opt('villages', 'Villages'), opt('activities', 'Activities')] as { value: View; label: string }[]}
      filters={[
        { key: 'crop', label: 'Crop', value: crop, options: [opt(ALL, 'All crops'), ...[...new Set(all.map((r) => r.crop))].map((c) => opt(c, c))], onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: [opt(ALL, 'All products'), ...CATEGORIES.map((c) => opt(c.name, c.name))], onChange: setProduct },
        { key: 'territory', label: 'Territory', value: territory, options: [opt(ALL, 'All territories'), ...all.map((r) => opt(r.territory, zmTerritoryName(r.territory)))], onChange: setTerritory },
        { key: 'campaign', label: 'Campaign', value: campaign, options: [opt(ALL, 'All campaigns'), ...all.map((r) => opt(r.campaign, r.campaign))], onChange: setCampaign },
      ]}
      extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: setSortBy, options: [opt('adopters', 'Recorded adopters'), opt('abp', 'Current ABP'), opt('name', 'Territory name')] }]} />
  );
  return { view, rows, header };
}

function TerritoryTable({ rows, onView }: { rows: ImpactRow[]; onView: (r: ImpactRow) => void }) {
  return (
    <DataTable rows={rows} rowKey={(r) => r.id} onRowClick={onView}
      columns={[
        { key: 'c', header: 'Crop × product × territory', render: (r) => <span className="stack" style={{ gap: 0, alignItems: 'center' }}><b>{r.crop} · {r.product}</b><small className="muted">{zmTerritoryName(r.territory)}</small></span> },
        { key: 'h', header: 'Historical', align: 'right', render: (r) => lakh(r.lastYear) },
        { key: 'a', header: 'Current ABP', align: 'right', render: (r) => lakh(r.abp) },
        { key: 'r', header: 'Reached', align: 'right', render: (r) => (r.reached === null ? NA : num(r.reached)) },
        { key: 'tr', header: 'Trials', align: 'right', render: (r) => (r.trials === null ? NA : num(r.trials)) },
        { key: 'ad', header: 'Adopters', align: 'right', render: (r) => (r.adopters === null ? NA : num(r.adopters)) },
        { key: 's', header: 'Linked sales', align: 'right', render: (r) => (r.sales === null ? NA : l1(r.sales)) },
        { key: 'x', header: 'Activities', align: 'right', render: (r) => (r.done === null ? NA : `${r.done} / ${r.planned}`) },
        { key: 'f', header: 'Confidence', align: 'center', render: (r) => <StatusChip tone={CONF_TONE[r.confidence]}>{r.confidence}</StatusChip> },
        { key: 'v', header: 'View', align: 'center', render: (r) => <Button small icon={Eye} disabled={r.done === null} onClick={() => onView(r)}>View</Button> },
      ]} />
  );
}

function VillageTable({ onOpen }: { onOpen?: (v: string) => void }) {
  const vp = [...villagePerformance()].sort((a, b) => b.conversionPct - a.conversionPct);
  const avg = zmImpact().trialToAdoptionPct;
  return (
    <DataTable rows={vp} rowKey={(v) => v.name} onRowClick={onOpen ? (v) => onOpen(v.name) : undefined}
      columns={[
        { key: 'v', header: 'Village', render: (v) => <b>{v.name}</b> },
        { key: 'r', header: 'Reached', align: 'right', render: (v) => (v.farmers === null ? NA : num(v.farmers)) },
        { key: 't', header: 'Trials', align: 'right', render: (v) => num(v.trials) },
        { key: 'a', header: 'Adopters', align: 'right', render: (v) => num(v.adopters) },
        { key: 'c', header: 'Trial-to-adoption', align: 'right', render: (v) => pct(v.conversionPct) },
        { key: 'n', header: 'Diagnostic note', render: (v) => (v === vp[0] ? 'Reference comparison' : v === vp[vp.length - 1] ? 'Investigate lower conversion' : v.conversionPct >= avg ? 'Above Ambad average' : 'Below Ambad average') },
        ...(onOpen ? [{ key: 'o', header: 'Investigate', align: 'center' as const, render: (v: { name: string }) => <Button small icon={Search} onClick={() => onOpen(v.name)}>Investigate</Button> }] : []),
      ]}
      total={{ v: 'Total', r: num(vp.reduce((s, v) => s + (v.farmers ?? 0), 0)), t: num(vp.reduce((s, v) => s + v.trials, 0)), a: num(vp.reduce((s, v) => s + v.adopters, 0)), c: pct(avg) }} />
  );
}

function ActivityTable() {
  const eff = interventionEffectiveness();
  return (
    <DataTable rows={eff} rowKey={(e) => e.id}
      columns={[
        { key: 'n', header: 'Intervention', render: (e) => <b>{e.name}</b> },
        { key: 'p', header: 'Planned', align: 'right', render: (e) => num(e.planned) },
        { key: 'c', header: 'Completed', align: 'right', render: (e) => num(e.completed) },
        { key: 'x', header: 'Execution', align: 'right', render: (e) => pct((e.completed / e.planned) * 100) },
        { key: 'r', header: 'Reach', align: 'right', render: (e) => num(e.reach) },
        { key: 's', header: 'Spend to date', align: 'right', render: (e) => lakh(e.spend, 2) },
      ]}
      total={{ n: 'Total', p: num(eff.reduce((s, e) => s + e.planned, 0)), c: num(eff.reduce((s, e) => s + e.completed, 0)), x: pct((eff.reduce((s, e) => s + e.completed, 0) / eff.reduce((s, e) => s + e.planned, 0)) * 100), s: lakh(eff.reduce((s, e) => s + e.spend, 0), 2) }} />
  );
}

// ================================================================ 22 Campaign Performance and Crop-wise Uplift
export function CampaignPerformance() {
  const go = useGo();
  const f = useImpactFilters('territories');
  const i = zmImpact();
  const bc = businessCaseC1();
  const eff = interventionEffectiveness();
  const port = portfolioTotal();
  return (
    <ZmPage {...ZM_SECTION.impact} title="Campaign Performance and Crop-wise Uplift" back={Z.approval('ambad')} next={Z.detail} nextLabel="Investigate crop-wise uplift">
      {f.header}
      <div className="kpis">
        <KpiCard label="Product portfolio ABP" value={crore(port.abp)} />
        <KpiCard label="Campaign rollout (Ambad)" value={`${i.activitiesDone} / ${i.activitiesPlanned} (${pct(i.activityPct)})`} />
        <KpiCard label="Validated incremental sales (Croptek, West)" value={l1(i.regionalValidatedSales)} />
        <KpiCard label="Actual net ROI (Croptek, West)" value={times(i.regionalRoi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={f.view === 'villages' ? 'Ambad village performance' : f.view === 'activities' ? 'Ambad activity performance' : 'Crop × product × geography performance'} icon={Layers} flush>
          {f.view === 'villages' ? <VillageTable /> : f.view === 'activities' ? <ActivityTable /> : <TerritoryTable rows={f.rows} onView={(r) => r.done !== null && go(`${Z.detail}?row=${r.id}`)} />}
        </Card>
        <div className="stack">
          <Card title="Campaign forecast (regional)" icon={Target}>
            <div className="recon compact" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div><span>Forecast incremental sales</span><b>{l1(bc.forecastSales)}</b></div>
              <div><span>Forecast contribution (35%)</span><b>{l1(bc.contribution)}</b></div>
            </div>
          </Card>
          <Notes title="Performance notes" items={[
            `Onion · Croptek (Ambad): ${i.activitiesDone} of ${i.activitiesPlanned} activities and ${num(i.adopters)} adopters.`,
            `Ambad campaign-linked sales ${l1(i.campaignLinkedSales)} are provisional, not validated uplift.`,
            `West Croptek validated ${l1(i.regionalValidatedSales)} against a ${l1(bc.forecastSales)} forecast (${times(i.regionalRoi)}).`,
            `${impactRows().filter((r) => r.done === null).length} territory campaigns have not started.`,
          ]} />
        </div>
      </div>
      <div className="grid g2">
        <Card title="Campaign activity progress: Ambad (Croptek)" icon={ChartColumn}>
          <GroupedBars height={220} data={eff.map((e) => ({ name: e.name.replace('Opt-in ', ''), planned: e.planned, completed: e.completed }))} x="name"
            tooltip={(d) => `${d.name} · Planned ${d.planned} · Completed ${d.completed}`}
            series={[{ key: 'planned', label: 'Planned', color: SERIES.planned }, { key: 'completed', label: 'Completed', color: SERIES.observed }]} />
        </Card>
        <Card title="Ambad key facts" icon={ListChecks}>
          <List items={[
            { label: 'Reached · trials · adopters', value: `${num(i.reached)} · ${num(i.trials)} · ${num(i.adopters)}` },
            { label: 'Trial-to-adoption', value: pct(i.trialToAdoptionPct) },
            { label: 'Campaign-linked sales (provisional)', value: l1(i.campaignLinkedSales) },
            { label: 'Activities completed', value: `${i.activitiesDone} / ${i.activitiesPlanned} (${pct(i.activityPct)})` },
            { label: 'All-product Ambad onion ABP', value: crore(AMBAD.onionAbp) },
            { label: 'Village conversion gap', value: `${i.villageGap.toFixed(1)} pp` },
          ]} />
        </Card>
      </div>
    </ZmPage>
  );
}

// ================================================================ 23 Crop × Product × Geography Performance Detail
export function PerformanceDetail() {
  const go = useGo();
  const [params] = useSearchParams();
  const rows = impactRows();
  const r = rows.find((x) => x.id === params.get('row')) ?? rows[0];
  const i = zmImpact();
  const [explorer, setExplorer] = useState(false);
  const [source, setSource] = useState(false);
  const isAmbad = r.territory === 'ambad';
  const onionAbp = isAmbad ? AMBAD.onionAbp : planCrops(r.territory).find((c) => c.crop === r.crop)?.abp ?? r.abp;
  const ytd = portfolioCell(r.category, r.territory).ytd;
  const conv = r.trials && r.adopters !== null ? (r.adopters / r.trials) * 100 : null;
  const metrics: { m: string; ref: string; obs: string; src: string; conf: string; tone: Tone; drill: 'explorer' | 'source' }[] = [
    { m: `${r.product}-specific historical sales`, ref: lakh(r.lastYear), obs: '–', src: 'ERP / SKU mapping', conf: 'High', tone: 'ok', drill: 'source' },
    { m: `${r.product}-specific current ABP`, ref: lakh(r.abp), obs: lakh(ytd), src: 'Portfolio mapping', conf: 'High', tone: 'ok', drill: 'source' },
    { m: `All-product ${zmTerritoryName(r.territory)} ${r.crop.toLowerCase()} allocation`, ref: crore(onionAbp), obs: '–', src: 'Approved plan', conf: 'High', tone: 'ok', drill: 'source' },
    { m: 'Qualified reach', ref: '–', obs: r.reached === null ? 'NA' : num(r.reached), src: 'Execution records', conf: 'Medium', tone: 'warn', drill: 'explorer' },
    { m: 'Trials', ref: '–', obs: r.trials === null ? 'NA' : num(r.trials), src: 'Execution records', conf: 'Medium', tone: 'warn', drill: 'explorer' },
    { m: 'Recorded adopters', ref: '–', obs: r.adopters === null ? 'NA' : num(r.adopters), src: 'Execution records', conf: 'Medium', tone: 'warn', drill: 'explorer' },
    { m: 'Trial-to-adoption', ref: '–', obs: conv === null ? 'NA' : pct(conv), src: 'Calculated from recorded data', conf: 'Medium', tone: 'warn', drill: 'explorer' },
    { m: 'Activities completed', ref: `${r.planned} planned`, obs: r.done === null ? 'NA' : `${r.done} completed`, src: 'Execution records', conf: 'High', tone: 'ok', drill: 'explorer' },
    { m: 'Provisional campaign-linked sales', ref: '–', obs: r.sales === null ? 'NA' : l1(r.sales), src: 'Campaign-linked transactions', conf: 'Low / provisional', tone: 'warn', drill: 'source' },
    { m: 'Validated incremental sales (Croptek, West)', ref: l1(businessCaseC1().forecastSales), obs: l1(i.regionalValidatedSales), src: 'Business Head validation', conf: 'High', tone: 'ok', drill: 'source' },
    { m: 'Actual net ROI (Croptek, West)', ref: times(businessCaseC1().netRoi), obs: times(i.regionalRoi), src: 'Business Head validation', conf: 'High', tone: 'ok', drill: 'source' },
  ];
  return (
    <ZmPage {...ZM_SECTION.impact} trail={`${r.crop} × ${r.product} × ${zmTerritoryName(r.territory)}`} title="Crop × Product × Geography Performance Detail" back={Z.impact} next={Z.diagnostics} nextLabel="Investigate conversion and learning"
      right={<StatusChip tone="ok">Executing · local plan approved</StatusChip>}>
      <div className="kpis">
        <KpiCard label={`${r.crop} all-product ABP`} value={crore(onionAbp)} />
        <KpiCard label={`${r.product} YTD sales`} value={crore(ytd)} />
        <KpiCard label="Campaign-linked transactions" value={r.sales === null ? 'NA' : l1(r.sales)} />
        <KpiCard label="Validated incremental sales (West)" value={l1(i.regionalValidatedSales)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="stack">
          <Card title="Performance metrics and confidence" icon={ListChecks} flush right={<>
            <Button small icon={MapPin} onClick={() => setExplorer(true)}>Territory impact</Button>
            <Button small icon={FileSearch} onClick={() => setSource(true)}>Source and attribution method</Button>
          </>}>
            <DataTable rows={metrics} rowKey={(x) => x.m}
              columns={[
                { key: 'm', header: 'Metric', render: (x) => <b>{x.m}</b> },
                { key: 'r', header: 'Historical / ABP', align: 'right', render: (x) => x.ref },
                { key: 'o', header: 'Observed to date', align: 'right', render: (x) => (x.obs === 'NA' ? NA : x.obs) },
                { key: 's', header: 'Source', render: (x) => x.src },
                { key: 'c', header: 'Confidence', align: 'center', render: (x) => <StatusChip tone={x.tone}>{x.conf}</StatusChip> },
                { key: 'd', header: 'Drilldown', align: 'center', render: (x) => <Button small onClick={() => (x.drill === 'explorer' ? setExplorer(true) : setSource(true))}>{x.drill === 'explorer' ? 'View territory' : 'View source'}</Button> },
              ]} />
          </Card>
          <Card title="Activity progress" icon={ClipboardList}>
            <div className="row" style={{ gap: 16 }}>
              <span>{r.planned} planned</span><span>{r.done ?? 0} completed</span>
              <div style={{ flex: 1 }}><Bar value={r.done === null ? 0 : (r.done / r.planned) * 100} /></div>
              <b>{r.done === null ? 'Not started' : pct((r.done / r.planned) * 100)}</b>
            </div>
          </Card>
        </div>
        <Notes title="Evidence and validation" icon={ShieldCheck} items={[
          `${r.product} SKU sales mapping: ${r.territory === 'ambad' ? 'validated against the portfolio' : 'to confirm'}.`,
          `Recorded adopters ${r.adopters === null ? 'not yet available' : num(r.adopters)}; purchase matching to validate.`,
          `Linked sales ${r.sales === null ? 'not yet available' : l1(r.sales)} are provisional, not incremental.`,
          `Validated uplift is measured at West region level: ${l1(i.regionalValidatedSales)} at ${times(i.regionalRoi)}.`,
        ]} />
      </div>
      {explorer && <TerritoryExplorer initial={r.territory} onClose={() => setExplorer(false)} onNext={() => go(Z.diagnostics)} />}
      {source && <SourceEvidence r={r} onClose={() => setSource(false)} />}
    </ZmPage>
  );
}

function TerritoryExplorer({ initial, onClose, onNext }: { initial: ZmTerritoryId; onClose: () => void; onNext: () => void }) {
  const bh = useBhStore();
  const rows = impactRows();
  const [t, setT] = useState<ZmTerritoryId>(initial);
  const r = rows.find((x) => x.territory === t)!;
  const conv = r.trials && r.adopters !== null ? (r.adopters / r.trials) * 100 : null;
  return (
    <Drawer title="Territory campaign impact explorer" onClose={onClose}
      status={<StatusChip tone={r.done === null ? 'neutral' : 'ok'}>{r.done === null ? 'Not started' : 'Executing'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={ArrowRight} onClick={onNext}>Investigate conversion and learning</Button>} />}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <label className="row" style={{ gap: 6 }}><span className="seg-label">Territory</span>
          <Select label="Territory" value={t} onChange={(v) => setT(v as ZmTerritoryId)} options={rows.map((x) => opt(x.territory, zmTerritoryName(x.territory)))} />
        </label>
        <div className="row">{rows.map((x) => <button key={x.territory} type="button" className={`choice${x.territory === t ? ' on' : ''}`} style={{ padding: '6px 10px' }} onClick={() => setT(x.territory)}><b>{zmTerritoryName(x.territory)}</b></button>)}</div>
      </div>
      <div className="grid g2">
        <Card title={`Territory performance: ${zmTerritoryName(t)}`} icon={MapPin}>
          <List items={[
            { label: 'Campaign', value: r.campaign },
            { label: 'Crop · product', value: `${r.crop} · ${r.product}` },
            { label: 'Qualified farmer reach', value: r.reached === null ? NA : num(r.reached) },
            { label: 'Documented trials', value: r.trials === null ? NA : num(r.trials) },
            { label: 'Recorded adopters', value: r.adopters === null ? NA : num(r.adopters) },
            { label: 'Trial-to-adoption', value: conv === null ? NA : `${pct(conv)} (${r.adopters}/${r.trials})` },
            { label: 'Campaign-linked sales (provisional)', value: r.sales === null ? NA : l1(r.sales) },
          ]} />
        </Card>
        <div className="stack">
          <Card title="Execution progress" icon={ClipboardList}>
            <div className="row"><div style={{ flex: 1 }}><Bar value={r.done === null ? 0 : (r.done / r.planned) * 100} /></div><b>{r.done === null ? `0 / ${r.planned}` : `${r.done} / ${r.planned} (${pct((r.done / r.planned) * 100)})`}</b></div>
          </Card>
          <Card title="Drilldown" icon={ArrowRight} right={<Button small onClick={() => bh.toast(`Clarification requested from Field Sales Manager · ${zmTerritoryName(t)}`)}>Request territory clarification</Button>}>
            <List items={[
              { label: 'Historical sales', value: lakh(r.lastYear) },
              { label: 'Current ABP', value: lakh(r.abp) },
              { label: 'Confidence', value: <StatusChip tone={CONF_TONE[r.confidence]}>{r.confidence}</StatusChip> },
            ]} />
          </Card>
        </div>
      </div>
    </Drawer>
  );
}

function SourceEvidence({ r, onClose }: { r: ImpactRow; onClose: () => void }) {
  const bh = useBhStore();
  const i = zmImpact();
  const [checks, setChecks] = useState<string[]>([]);
  const PURCHASE = ['Farmer-ID / CRM matching', `${r.product} SKU transaction validation`, 'Transaction date alignment', 'Duplicate-record checks', 'Purchase source completeness'];
  return (
    <Drawer title={`Source evidence and uplift validation: ${zmTerritoryName(r.territory)}`} onClose={onClose}
      status={<StatusChip tone="warn">Ambad attribution in progress</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={() => bh.toast('Data validation requested for linked sales and purchase matching')}>Request data validation</Button>} />}>
      <Card title="Evidence reconciliation" icon={FileSearch} flush>
        <DataTable rows={[
          { m: 'Qualified reach', v: r.reached === null ? 'NA' : num(r.reached), s: 'CRM / field app', st: 'Cohort linkage' },
          { m: 'Documented trials', v: r.trials === null ? 'NA' : num(r.trials), s: 'Field records', st: 'Validation' },
          { m: 'Recorded adopters', v: r.adopters === null ? 'NA' : num(r.adopters), s: 'CRM / purchase linkage', st: 'Purchase match' },
          { m: 'Campaign-linked sales', v: r.sales === null ? 'NA' : l1(r.sales), s: 'ERP / DMS', st: 'Attribution' },
          { m: 'Completed activities', v: r.done === null ? 'NA' : `${r.done} / ${r.planned}`, s: 'Execution logs', st: 'Source review' },
        ]} rowKey={(x) => x.m}
          columns={[
            { key: 'm', header: 'Measure', render: (x) => <b>{x.m}</b> },
            { key: 'v', header: 'Recorded value', align: 'right', render: (x) => (x.v === 'NA' ? NA : x.v) },
            { key: 's', header: 'Candidate source', render: (x) => x.s },
            { key: 't', header: 'Matching / validation', align: 'center', render: (x) => <StatusChip tone="warn">{`${x.st} pending`}</StatusChip> },
          ]} />
      </Card>
      <div className="grid g2">
        <Card title="Purchase verification" icon={ListChecks}>
          {PURCHASE.map((c) => (
            <label key={c} className="list-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={checks.includes(c)} onChange={() => setChecks((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} aria-label={c} />
              <span>{c}</span><b className="right"><StatusChip tone={checks.includes(c) ? 'ok' : 'warn'}>{checks.includes(c) ? 'Verified' : 'Pending'}</StatusChip></b>
            </label>
          ))}
        </Card>
        <Card title="Incrementality method" icon={ShieldCheck}>
          <List items={[
            { label: 'Eligible exposed cohort', value: <StatusChip tone="warn">Pending</StatusChip> },
            { label: 'Comparable baseline / control', value: <StatusChip tone="ok">West region baseline</StatusChip> },
            { label: 'Validated incremental sales (West)', value: l1(i.regionalValidatedSales) },
            { label: 'Contribution margin', value: '35%' },
            { label: 'Actual net ROI (West)', value: times(i.regionalRoi) },
          ]} />
        </Card>
      </div>
    </Drawer>
  );
}

// ================================================================ 24 Campaign Diagnostics and Next-season Learning
export function CampaignDiagnostics() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const f = useImpactFilters('villages');
  const i = zmImpact();
  const [village, setVillage] = useState<string | null>(null);
  const [asset, setAsset] = useState<TemplateId | null>(null);
  const eff = interventionEffectiveness();
  const actions = nextSeason().slice(0, 4);
  return (
    <ZmPage {...ZM_SECTION.impact} trail="Onion × Croptek × Ambad" title="Campaign Diagnostics and Next-season Learning" back={Z.detail} next={Z.recommendations} nextLabel="Review next-season recommendations"
      right={<StatusChip tone={zm.learningSaved ? 'ok' : 'neutral'}>{zm.learningSaved ? 'Next-season learning saved' : 'Learning draft'}</StatusChip>}>
      {f.header}
      <div className="kpis">
        <KpiCard label="Reached" value={num(i.reached)} />
        <KpiCard label="Trials" value={num(i.trials)} />
        <KpiCard label="Recorded adopters" value={num(i.adopters)} />
        <KpiCard label="Activities complete" value={`${i.activitiesDone} / ${i.activitiesPlanned}`} />
        <KpiCard label="Campaign-linked sales" value={l1(i.campaignLinkedSales)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <Card title={f.view === 'villages' ? 'Village-wise conversion diagnostic' : f.view === 'activities' ? 'Intervention effectiveness' : 'Territory diagnostic'} icon={Search} flush
          right={<Button small icon={Save} onClick={() => { zm.saveLearning(); bh.toast('Next-season learning saved'); }}>Save next-season learning</Button>}>
          {f.view === 'villages' ? <VillageTable onOpen={setVillage} /> : f.view === 'activities' ? <ActivityTable /> : <TerritoryTable rows={f.rows} onView={(r) => r.done !== null && go(`${Z.detail}?row=${r.id}`)} />}
        </Card>
        <Card title="Next-season actions" icon={Lightbulb}>
          <List items={actions.map((a, k) => ({ label: <span className="stack" style={{ gap: 2 }}><b>{k + 1}. {a.action}</b><small className="muted">{a.finding}</small></span>, value: <StatusChip tone={PRIORITY_TONE[a.priority]}>{a.priority}</StatusChip> }))} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Intervention effectiveness" icon={ClipboardList} flush>
          <DataTable rows={eff} rowKey={(e) => e.id}
            columns={[
              { key: 'n', header: 'Intervention', render: (e) => <b>{e.name}</b> },
              { key: 'p', header: 'Planned', align: 'right', render: (e) => num(e.planned) },
              { key: 'c', header: 'Completed', align: 'right', render: (e) => num(e.completed) },
              { key: 'r', header: 'Reach', align: 'right', render: (e) => num(e.reach) },
            ]}
            total={{ n: 'Total', p: num(i.activitiesPlanned), c: num(i.activitiesDone), r: num(eff.reduce((s, e) => s + e.reach, 0)) }} />
        </Card>
        <Card title="Collateral effectiveness" icon={Palette} flush>
          <DataTable rows={COLLATERAL_EFFECTIVENESS} rowKey={(c) => c.id} onRowClick={(c) => setAsset(c.id as TemplateId)}
            columns={[
              { key: 'a', header: 'Asset', render: (c) => <b>{c.asset}</b> },
              { key: 'r', header: 'Reach', align: 'right', render: (c) => num(c.reach) },
              { key: 'e', header: 'Engaged', align: 'right', render: (c) => num(c.engaged) },
              { key: 't', header: 'Trials', align: 'right', render: (c) => num(c.trials) },
              { key: 'v', header: 'View', align: 'center', render: (c) => <Button small icon={Eye} onClick={() => setAsset(c.id as TemplateId)}>View</Button> },
            ]} />
        </Card>
      </div>
      {village && <VillageDrawer name={village} onClose={() => setVillage(null)} />}
      {asset && <CollateralDrawer id={asset} onClose={() => setAsset(null)} onNext={() => go(Z.recommendations)} />}
    </ZmPage>
  );
}

function VillageDrawer({ name, onClose }: { name: string; onClose: () => void }) {
  const bh = useBhStore();
  const vp = villagePerformance();
  const sorted = [...vp].sort((a, b) => b.conversionPct - a.conversionPct);
  const ref = sorted[0].name === name ? sorted[1] : sorted[0];
  const v = vp.find((x) => x.name === name)!;
  const i = zmImpact();
  const status = (village: string, activity: string) => {
    const u = ACTIVITY_UNITS.filter((x) => x.activity === activity && x.village.split(', ').includes(village));
    if (!u.length) return { t: 'Not in plan', tone: 'neutral' as Tone };
    if (u.some((x) => x.status === 'at_risk')) return { t: 'Verify', tone: 'warn' as Tone };
    return u.every((x) => x.status === 'completed') ? { t: 'Linked', tone: 'ok' as Tone } : { t: 'Scheduled', tone: 'neutral' as Tone };
  };
  const areas: [string, string][] = [['Field demonstration timing', 'demonstration'], ['Retailer participation', 'retailer'], ['Farmer meetings', 'meeting'], ['Follow-up completion', 'followup'], ['Opt-in digital advisory', 'digital']];
  return (
    <Drawer title={`Village conversion and performance driver investigation: ${name}`} onClose={onClose}
      status={<StatusChip tone={v.conversionPct < i.trialToAdoptionPct ? 'warn' : 'ok'}>{v.conversionPct < i.trialToAdoptionPct ? 'Below Ambad average' : 'At or above Ambad average'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={() => bh.toast(`Clarification requested on ${name} follow-up evidence`)}>Request territory clarification</Button>} />}>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <table className="tbl">
          <thead><tr><th>Measure</th><th>{name}</th><th>{ref.name}</th><th>Total Ambad</th></tr></thead>
          <tbody>
            <tr><td><b>Qualified reach</b></td><td>{v.farmers === null ? NA : num(v.farmers)}</td><td>{ref.farmers === null ? NA : num(ref.farmers)}</td><td><b>{num(i.reached)}</b></td></tr>
            <tr><td><b>Trials</b></td><td>{num(v.trials)}</td><td>{num(ref.trials)}</td><td><b>{num(i.trials)}</b></td></tr>
            <tr><td><b>Recorded adopters</b></td><td>{num(v.adopters)}</td><td>{num(ref.adopters)}</td><td><b>{num(i.adopters)}</b></td></tr>
            <tr><td><b>Trial-to-adoption</b></td><td>{pct(v.conversionPct)}</td><td>{pct(ref.conversionPct)}</td><td><b>{pct(i.trialToAdoptionPct)}</b></td></tr>
          </tbody>
        </table>
        <Card title="Trial-to-adoption comparison" icon={ChartColumn}>
          <HBars fill rows={[v, ref].map((x) => ({ label: x.name, values: [x.conversionPct], title: `${x.name} · ${num(x.adopters)} of ${num(x.trials)} trials · ${pct(x.conversionPct)}` }))}
            series={[{ key: 'c', label: 'Trial-to-adoption', color: SERIES.planned }]} max={60} format={(x) => pct(x)} labelWidth={100} />
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <Card title="Diagnostic evidence matrix" icon={ListChecks} flush>
          <DataTable rows={areas} rowKey={(a) => a[0]}
            columns={[
              { key: 'a', header: 'Diagnostic area', render: (a) => <b>{a[0]}</b> },
              { key: 'v', header: name, align: 'center', render: (a) => { const s = status(name, a[1]); return <StatusChip tone={s.tone}>{s.t}</StatusChip>; } },
              { key: 'r', header: ref.name, align: 'center', render: (a) => { const s = status(ref.name, a[1]); return <StatusChip tone={s.tone}>{s.t}</StatusChip>; } },
            ]} />
        </Card>
        <Notes title="Diagnostic checks" icon={ShieldCheck} items={[
          `${name} converts ${Math.abs(v.conversionPct - ref.conversionPct).toFixed(1)} pp ${v.conversionPct < ref.conversionPct ? 'below' : 'above'} ${ref.name}.`,
          `${name}: ${v.completed} of ${v.planned} campaign units completed${v.atRisk.length ? `; ${v.atRisk.length} at risk` : ''}.`,
          `Ambad total ${i.activitiesDone} of ${i.activitiesPlanned} activities is a territory figure, not ${name}'s.`,
        ]} />
      </div>
    </Drawer>
  );
}

function CollateralDrawer({ id, onClose, onNext }: { id: TemplateId; onClose: () => void; onNext: () => void }) {
  const zm = useZmStore();
  const [sel, setSel] = useState<TemplateId>(id);
  const a = COLLATERAL_EFFECTIVENESS.find((x) => x.id === sel)!;
  const t = TEMPLATES.find((x) => x.id === sel)!;
  const released = zm.released && zm.playbookIncluded.includes(sel);
  return (
    <Drawer title="Campaign collateral and creative effectiveness" onClose={onClose}
      status={<StatusChip tone="warn">Evidence analysis</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={ArrowRight} onClick={onNext}>Consolidate next-season learnings</Button>} />}>
      <Card title="Collateral evidence matrix" icon={Palette} flush>
        <DataTable selectable rows={COLLATERAL_EFFECTIVENESS} rowKey={(c) => c.id} selected={sel} onRowClick={(c) => setSel(c.id as TemplateId)}
          columns={[
            { key: 'a', header: 'Asset', render: (c) => <b>{c.asset}</b> },
            { key: 'v', header: 'Authorised version', align: 'center', render: (c) => <StatusChip tone={zm.released && zm.playbookIncluded.includes(c.id as TemplateId) ? 'ok' : 'warn'}>{zm.released && zm.playbookIncluded.includes(c.id as TemplateId) ? 'Released' : 'Verify version'}</StatusChip> },
            { key: 'r', header: 'Distribution / reach', align: 'right', render: (c) => num(c.reach) },
            { key: 'e', header: 'Engaged', align: 'right', render: (c) => `${num(c.engaged)} (${pct((c.engaged / c.reach) * 100, 0)})` },
            { key: 't', header: 'Linked trials', align: 'right', render: (c) => num(c.trials) },
          ]} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <Card title={`Selected asset: ${t.name}`} icon={Eye}>
          <div className="grid" style={{ gridTemplateColumns: '180px minmax(0, 1fr)' }}>
            <img src={TEMPLATE_IMG[sel]} alt={t.name} style={{ width: 180, borderRadius: 8 }} />
            <List items={[
              { label: 'Authorised version check', value: <StatusChip tone={released ? 'ok' : 'warn'}>{released ? 'Released' : 'Verify'}</StatusChip> },
              { label: 'Audience', value: t.audience },
              { label: 'Reach', value: num(a.reach) },
              { label: 'Engagement rate', value: pct((a.engaged / a.reach) * 100, 0) },
              { label: 'Trials linked to the asset', value: num(a.trials) },
            ]} />
          </div>
        </Card>
        <Notes title="Collateral checks" icon={ShieldCheck} items={[
          `${[...COLLATERAL_EFFECTIVENESS].sort((x, y) => y.trials - x.trials)[0].asset} linked the most trials.`,
          `${t.name}: ${pct((a.trials / a.reach) * 100)} of reached farmers took a trial.`,
          'Compare exposure with recorded purchases on a comparable baseline.',
        ]} />
      </div>
    </Drawer>
  );
}

// ================================================================ 25 Next-season Learning and Recommendations
export function Recommendations() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const i = zmImpact();
  const recs = nextSeason();
  const selected = zm.recSelected ?? recs.map((r) => r.id);
  const pr = (id: string) => zm.recPriority[id] ?? recs.find((r) => r.id === id)!.priority;
  const toggle = (id: string) => zm.setRecSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const submit = () => {
    if (!selected.length) { bh.toast('Select at least one recommendation'); return; }
    if (zm.recOption === 'concept') { bh.toast('Draft campaign concept started from the selected learnings'); go(Z.concepts); return; }
    zm.submitRecommendations();
    bh.toast(`${selected.length} recommendation${selected.length === 1 ? '' : 's'} submitted to Marketing Head`);
    go(Z.assistant);
  };
  const high = recs.filter((r) => selected.includes(r.id) && pr(r.id) === 'High').length;
  return (
    <ZmPage {...ZM_SECTION.impact} trail="Onion × Croptek × Ambad" title="Next-season Learning and Recommendations" back={Z.diagnostics} next={submit}
      nextLabel={zm.recOption === 'concept' ? 'Create draft campaign concept' : 'Submit recommendations to Marketing Head'}
      right={<StatusChip tone={zm.recStatus === 'submitted' ? 'ok' : 'neutral'}>{zm.recStatus === 'submitted' ? 'Submitted to Marketing Head' : 'Draft recommendations · not submitted'}</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Recorded adopters" value={num(i.adopters)} />
        <KpiCard label="Activity progress" value={`${i.activitiesDone} / ${i.activitiesPlanned} (${pct(i.activityPct)})`} />
        <KpiCard label="Validated incremental sales (West)" value={l1(i.regionalValidatedSales)} />
        <KpiCard label="Recommendations selected" value={`${selected.length} of ${recs.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px' }}>
        <Card title="Learning-to-action matrix" icon={ListChecks} flush>
          <DataTable rows={recs} rowKey={(r) => r.id}
            columns={[
              { key: 'x', header: '', width: 44, render: (r) => <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.action}`} /> },
              { key: 'f', header: 'Finding', render: (r) => <b>{r.finding}</b> },
              { key: 'a', header: 'Next-season action', render: (r) => r.action },
              { key: 'p', header: 'Priority', align: 'center', width: 130, render: (r) => <span className={pr(r.id) !== r.priority ? 'chg' : undefined}><Select label={`Priority for ${r.action}`} value={pr(r.id)} onChange={(v) => zm.setRecPriority(r.id, v as Priority)} options={['High', 'Medium', 'Low'].map((x) => opt(x, x))} /></span> },
            ]} />
        </Card>
        <div className="stack">
          <Card title="Recommendation package" icon={BookOpen}>
            <List items={[
              { label: 'Owners', value: 'Marketing and field operations' },
              { label: 'Planning period', value: 'Kharif 2027' },
              { label: 'Reviewer', value: 'Marketing Head · crop nutrition' },
              { label: 'High-priority actions', value: num(high) },
            ]} />
            <div className="calc-label">Next-step option</div>
            {([['concept', 'Create draft campaign concept', 'Theme alignment first'], ['submit', 'Submit strategic recommendations', 'For Marketing Head review']] as const).map(([id, label, sub]) => (
              <label key={id} className={`choice${zm.recOption === id ? ' on' : ''}`} style={{ cursor: 'pointer' }}>
                <input type="radio" name="option" checked={zm.recOption === id} onChange={() => zm.setRecOption(id)} aria-label={label} />
                <span className="stack" style={{ gap: 2 }}><b>{label}</b><small className="muted">{sub}</small></span>
              </label>
            ))}
          </Card>
          <Notes title="Next-season actions" icon={Lightbulb} items={[
            `${selected.length} of ${recs.length} findings selected; ${high} high priority.`,
            `Village gap ${i.villageGap.toFixed(1)} pp is the largest conversion lever.`,
            `Campaign-linked sales ${l1(i.campaignLinkedSales)} need purchase matching before attribution.`,
            'Update measurement and collateral controls for Kharif 2027.',
          ]} />
        </div>
      </div>
    </ZmPage>
  );
}

// ================================================================ 26 AI Copilot workspace
type QId = 'diagnosis' | 'worked' | 'lagging' | 'change';
const QUESTIONS: { id: QId; title: string; text: string; icon: LucideIcon; words: string[] }[] = [
  { id: 'diagnosis', title: 'Village conversion', text: 'Why is Croptek trial-to-adoption lower in Dhanora than Wadi Gaon?', icon: Search, words: ['why', 'dhanora', 'lower', 'adoption', 'conversion', 'village'] },
  { id: 'worked', title: 'What worked', text: 'Which intervention worked?', icon: CircleCheck, words: ['worked', 'intervention', 'best', 'effective', 'collateral'] },
  { id: 'lagging', title: 'Growth lagging', text: 'Where is growth lagging?', icon: TriangleAlert, words: ['lag', 'behind', 'growth', 'gap', 'plan', 'abp', 'territor'] },
  { id: 'change', title: 'Next season', text: 'What should change next year?', icon: Lightbulb, words: ['change', 'next', 'season', 'year', 'recommend'] },
];
const match = (q: string): QId => { const t = q.toLowerCase(); return [...QUESTIONS].sort((a, b) => b.words.filter((w) => t.includes(w)).length - a.words.filter((w) => t.includes(w)).length)[0].id; };

export function ZmAssistant() {
  const go = useGo();
  const zm = useZmStore();
  const [q, setQ] = useState<QId>('diagnosis');
  const [draft, setDraft] = useState('');
  const i = zmImpact();
  const vp = [...villagePerformance()].sort((a, b) => b.conversionPct - a.conversionPct);
  const hi = vp[0];
  const lo = vp[vp.length - 1];
  const eff = interventionEffectiveness();
  const bestEff = [...eff].sort((a, b) => b.completed / b.planned - a.completed / a.planned)[0];
  const topAsset = [...COLLATERAL_EFFECTIVENESS].sort((a, b) => b.trials - a.trials)[0];
  const rows = impactRows();
  const answers: Record<QId, { summary: string; rows: { n: string; what: string; figure: string; to: string }[] }> = {
    diagnosis: {
      summary: `${lo.name} recorded ${num(lo.adopters)} adopters from ${num(lo.trials)} trials (${pct(lo.conversionPct)}) against ${hi.name}'s ${num(hi.adopters)} from ${num(hi.trials)} (${pct(hi.conversionPct)}): a ${i.villageGap.toFixed(1)} pp gap. Ambad overall: ${num(i.trials)} trials, ${num(i.adopters)} adopters (${pct(i.trialToAdoptionPct)}).`,
      rows: [
        ...[lo, hi].map((v) => ({ n: v.name, what: `${num(v.trials)} trials · ${num(v.adopters)} adopters`, figure: pct(v.conversionPct), to: Z.diagnostics })),
        { n: 'Farmer follow-ups', what: `${eff.find((e) => e.id === 'followup')!.completed} of ${eff.find((e) => e.id === 'followup')!.planned} rounds completed`, figure: 'Verify', to: Z.diagnostics },
      ],
    },
    worked: {
      summary: `${bestEff.name} reached the highest completion (${bestEff.completed} of ${bestEff.planned}); ${topAsset.asset} linked the most trials (${topAsset.trials}).`,
      rows: [
        ...eff.map((e) => ({ n: e.name, what: `${e.completed} of ${e.planned} completed · reach ${num(e.reach)}`, figure: pct((e.completed / e.planned) * 100), to: Z.diagnostics })),
        { n: topAsset.asset, what: `${num(topAsset.reach)} reached · ${num(topAsset.engaged)} engaged`, figure: `${topAsset.trials} trials`, to: Z.diagnostics },
      ],
    },
    lagging: {
      summary: `${rows.filter((r) => r.done === null).length} of ${rows.length} territory campaigns have not started; Ambad has ${i.activitiesPlanned - i.activitiesDone} activities left and a ${i.villageGap.toFixed(1)} pp village gap.`,
      rows: rows.map((r) => ({ n: `${zmTerritoryName(r.territory)} · ${r.crop}`, what: r.campaign, figure: r.done === null ? 'Not started' : `${r.done} / ${r.planned}`, to: r.done === null ? Z.approvals : `${Z.detail}?row=${r.id}` })),
    },
    change: {
      summary: `${nextSeason().length} findings lead to next-season actions; ${nextSeason().filter((r) => r.priority === 'High').length} are high priority.`,
      rows: nextSeason().map((r) => ({ n: r.action, what: r.finding, figure: r.priority, to: Z.recommendations })),
    },
  };
  const current = QUESTIONS.find((x) => x.id === q)!;
  const a = answers[q];
  const ask = (id: QId, text: string) => { setQ(id); zm.ask(text); };
  const submit = () => { if (!draft.trim()) return; ask(match(draft), draft.trim()); setDraft(''); };
  return (
    <ZmPage {...ZM_SECTION.assistant} trail="Croptek conversion · Ambad" title="AI Copilot workspace" back={Z.recommendations} next={Z.recommendations} nextLabel="Create next-season recommendation">
      <div className="kpis">
        <KpiCard label="Ambad trial-to-adoption" value={pct(i.trialToAdoptionPct)} />
        <KpiCard label="Village conversion gap (pp)" value={i.villageGap.toFixed(1)} />
        <KpiCard label="Activities completed" value={`${i.activitiesDone} / ${i.activitiesPlanned}`} />
        <KpiCard label="Campaign-linked sales" value={l1(i.campaignLinkedSales)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '260px minmax(0, 1fr) 300px' }}>
        <div className="stack">
          <Card title="Suggested questions" icon={MessageCircle}>
            <div className="geo">
              {QUESTIONS.map((x) => (
                <button key={x.id} type="button" className={x.id === q ? 'on' : ''} onClick={() => ask(x.id, x.text)}><x.icon size={16} style={{ flex: 'none' }} /><span className="stack" style={{ gap: 0, alignItems: 'flex-start', textAlign: 'left' }}><b>{x.title}</b><small>{x.text}</small></span></button>
              ))}
            </div>
          </Card>
          <Card title="Recent questions" icon={MessageCircle}>
            {zm.asked.length === 0 && <List items={[{ label: current.text }]} />}
            <div className="geo">{zm.asked.map((t) => <button key={t} type="button" onClick={() => setQ(match(t))}><MessageCircle size={15} />{t}</button>)}</div>
          </Card>
        </div>
        <Card title={current.text} icon={Lightbulb}>
          <p style={{ margin: '0 0 12px' }}>{a.summary}</p>
          <DataTable rows={a.rows} rowKey={(r) => r.n} onRowClick={(r) => go(r.to)}
            columns={[
              { key: 'n', header: 'Item', render: (r) => <b>{r.n}</b> },
              { key: 'w', header: 'Detail', render: (r) => r.what },
              { key: 'f', header: 'Figure', align: 'right', render: (r) => r.figure },
              { key: 'o', header: 'Open', align: 'center', render: (r) => <Button small icon={ArrowRight} onClick={() => go(r.to)}>Open</Button> },
            ]} />
          <div className="ask-box">
            <input className="input" aria-label="Ask a question" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
            <Button primary icon={Send} onClick={submit}>Ask</Button>
          </div>
        </Card>
        <div className="stack">
          <Card title="Context: campaign and performance" icon={ClipboardList}>
            <List items={[
              { label: 'Product', value: 'Croptek' }, { label: 'Crop', value: 'Onion' },
              { label: 'Geography', value: `Ambad (${Object.keys(FARMERS_REACHED).join(', ')})` },
              { label: 'Campaign', value: 'Retailer-led Croptek conversion' },
              { label: 'Activity progress', value: `${i.activitiesDone} / ${i.activitiesPlanned} (${pct(i.activityPct)})` },
              { label: 'Tracked linked sales', value: l1(i.campaignLinkedSales) },
              { label: 'Regional forecast', value: `${l1(businessCaseC1().forecastSales)} / ${l1(businessCaseC1().contribution)}` },
            ]} />
          </Card>
          <Card title="Next-season actions" icon={CircleAlert}>
            <List items={nextSeason().slice(0, 3).map((r) => ({ label: r.action, value: <StatusChip tone={PRIORITY_TONE[r.priority]}>{r.priority}</StatusChip> }))} />
          </Card>
        </div>
      </div>
    </ZmPage>
  );
}

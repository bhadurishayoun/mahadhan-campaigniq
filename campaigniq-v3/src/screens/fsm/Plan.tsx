/** Screens 1–5 — My Plan: performance, territory network, outlet targets, crop plan, plan review. */
import {
  ArrowRight, Calculator, Check, TriangleAlert, ChevronDown, ChevronRight, CircleAlert, CircleCheck, Download, FileSpreadsheet, History, Layers, Lightbulb, ListChecks,
  MapPin, MessageSquare, Network, RefreshCw, Save, Sprout, Store, Target, Trophy, Upload,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { territoryById } from '../../data/bh';
import { crore, lakh, num, pct, ratio, sum } from '../../data/format';
import {
  clusterRows, coverageCalc, cropPlan, dealersOf, FSM_CROPS, FSM_TERRITORY_IDS, FUNNEL_DEFAULTS, GROWTH_DRIVERS, LAST_YEAR_SNAPSHOT, lastYearMix,
  onionPlanOf, perfRows, retailerDemand, PRODUCT_SHARE, retailersOf, SEASON_SHARE, TERRITORY_DISTRICT, territoryName, villagesOf,
  coverageDefaults, coverageError, coverageResult, COVERAGE_LIMITS, type CoverageInputs, type VillageOnionPlan, type ClusterRow, type Dealer, type Retailer,
} from '../../data/fsm';
import { F, type FsmTerritoryId } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useFsmStore } from '../../store/fsmStore';
import { Bar, Button, Card, FilterRows, KpiCard, StatusChip, type Tone } from '../../ui/core';
import { DataTable } from '../../ui/DataTable';
import { Drawer, Modal } from '../../ui/overlay';
import { PanelFooter } from '../../ui/core';
import { ALL, useGo } from '../common';
import { FsmPage, PlanTabs, useTerritory } from './frame';

const SECTION = 'My plan';
const opt = (value: string, label: string) => ({ value, label });
const signed = (p: number) => `${p >= 0 ? '+' : '–'}${Math.abs(p).toFixed(1)}%`;

function List({ items }: { items: { icon?: typeof Target; label: ReactNode; value?: ReactNode; tone?: 'warn' }[] }) {
  return <>{items.map((i, k) => <div key={k} className="list-row">{i.icon && <i.icon size={16} color={i.tone === 'warn' ? 'var(--amber)' : undefined} />}<span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}</div>)}</>;
}

function Notes({ title, items, fill }: { title: string; items: ReactNode[]; fill?: boolean }) {
  const list = <List items={items.map((t) => ({ label: t }))} />;
  return (
    <Card title={title} icon={Lightbulb} style={fill ? { flex: 1 } : undefined}>
      {fill ? <div className="notes-fill">{list}</div> : list}
    </Card>
  );
}

/** Edited dealer targets from the store, else the planned figure. */
function useTargets(t: FsmTerritoryId) {
  const fsm = useFsmStore();
  const dealers = dealersOf(t);
  const of = (d: Dealer) => fsm.targets[d.id] ?? d.proposed;
  const total = sum(dealers, of);
  const abp = territoryById(t)!.abp;
  return { dealers, of, total, abp, unallocated: abp - total, allocatedPct: (total / abp) * 100 };
}

/** Village onion plans with the store's edits applied. */
function useOnionPlan(t: FsmTerritoryId) {
  const fsm = useFsmStore();
  const rows = onionPlanOf(t).map((v) => ({ ...v, plan: fsm.onionPlan[`${t}:${v.village}`] ?? v.plan }));
  return { rows, total: sum(rows, (v) => v.plan), set: (village: string, v: number) => fsm.setOnionPlan(`${t}:${village}`, v) };
}

function planStatus(t: FsmTerritoryId, submitted: FsmTerritoryId[], targets: Record<string, number>): { label: string; tone: Tone } {
  if (submitted.includes(t)) return { label: 'Submitted', tone: 'ok' };
  if (dealersOf(t).some((d) => targets[d.id] !== undefined)) return { label: 'Draft', tone: 'warn' };
  return { label: 'Not planned', tone: 'neutral' };
}

// ================================================================ 1 My Business Plan — My Performance
type PerfView = 'value' | 'growth';
type PerfSort = 'abp' | 'growth' | 'lastYear' | 'name';

export function MyPerformance() {
  const go = useGo();
  const fsm = useFsmStore();
  const territory = fsm.scope === 'cluster' ? ALL : fsm.scope;
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [season, setSeason] = useState(ALL);
  const [view, setView] = useState<PerfView>('value');
  const [sortBy, setSortBy] = useState<PerfSort>('abp');
  const SORTS: Record<PerfSort, (r: ClusterRow) => number | string> = { abp: (r) => -r.abp, growth: (r) => -r.growthPct, lastYear: (r) => -r.lastYear, name: (r) => r.name };
  const rows = perfRows({ crop, product, season }).filter((r) => territory === ALL || r.id === territory)
    .sort((x, y) => { const a = SORTS[sortBy](x), b = SORTS[sortBy](y); return typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number); });
  const tot = { lastYear: sum(rows, (r) => r.lastYear), abp: sum(rows, (r) => r.abp), ytd: sum(rows, (r) => r.ytdSales) };
  const growth = ((tot.abp - tot.lastYear) / tot.lastYear) * 100;
  const upliftTotal = tot.abp - tot.lastYear;
  const lead = [...rows].sort((a, b) => (b.abp - b.lastYear) - (a.abp - a.lastYear))[0];
  const mix = lastYearMix();
  const all = clusterRows();
  const lastYearAll = sum(all, (r) => r.lastYear);
  const status = (t: FsmTerritoryId) => planStatus(t, fsm.submitted, fsm.targets);
  const action = (r: ClusterRow, i: number) => <Button small primary={i === 0} icon={ArrowRight} onClick={() => go(F.network(r.id))}>Plan territory</Button>;

  return (
    <FsmPage section={SECTION} sectionTo={F.plan} title="My Business Plan" back={F.assistant} next={F.network(lead?.id ?? 'ambad')} nextLabel="Proceed to territory network">
      <PlanTabs active={0} />
      <FilterRows<PerfView> view={view} setView={setView}
        views={[opt('value', 'Value (₹ Cr)'), opt('growth', 'Growth (%)')] as { value: PerfView; label: string }[]}
        filters={[
          { key: 'territory', label: 'Territory', value: territory, options: [opt(ALL, 'All territories'), ...FSM_TERRITORY_IDS.map((t) => opt(t, territoryName(t)))], onChange: (v) => fsm.setScope(v === ALL ? 'cluster' : (v as FsmTerritoryId)) },
          { key: 'crop', label: 'Crop', value: crop, options: [opt(ALL, 'All crops'), ...FSM_CROPS.map((c) => opt(c, c))], onChange: setCrop },
          { key: 'product', label: 'Product', value: product, options: [opt(ALL, 'All products'), ...Object.keys(PRODUCT_SHARE).map((p) => opt(p, p))], onChange: setProduct },
          { key: 'season', label: 'Season', value: season, options: [opt(ALL, 'All seasons'), ...Object.keys(SEASON_SHARE).map((s) => opt(s, s))], onChange: setSeason },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: (v) => setSortBy(v as PerfSort), options: [opt('abp', 'Current-year ABP'), opt('growth', 'Required growth'), opt('lastYear', 'Last-year sales'), opt('name', 'Territory name')] }]} />
      <div className="kpis">
        <KpiCard label="Last-year sales" value={crore(tot.lastYear, 1)} />
        <KpiCard label="Current-year ABP target" value={crore(tot.abp, 1)} />
        <KpiCard label="Required growth" value={pct(growth)} />
        <KpiCard label="Sales to date" value={crore(tot.ytd)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        <div className="stack">
          <Card title="My territory targets" note="FY 2025–26 sales · FY 2026–27 ABP" icon={Target} flush>
            {view === 'value' ? (
              <DataTable rows={rows} rowKey={(r) => r.id} onRowClick={(r) => go(F.network(r.id))}
                columns={[
                  { key: 'n', header: 'Territory', render: (r) => <b>{r.name}</b> },
                  { key: 'ly', header: 'Last-year sales', align: 'right', render: (r) => crore(r.lastYear, 1) },
                  { key: 'abp', header: 'Current-year ABP', align: 'right', render: (r) => crore(r.abp, 1) },
                  { key: 'ytd', header: 'Sales to date', align: 'right', render: (r) => crore(r.ytdSales) },
                  { key: 'st', header: 'Plan status', align: 'center', render: (r) => <StatusChip tone={status(r.id).tone}>{status(r.id).label}</StatusChip> },
                  { key: 'a', header: 'Action', align: 'center', render: (r) => action(r, rows.indexOf(r)) },
                ]}
                total={{ n: 'Total', ly: crore(tot.lastYear, 1), abp: crore(tot.abp, 1), ytd: crore(tot.ytd) }} />
            ) : (
              <DataTable rows={rows} rowKey={(r) => r.id} onRowClick={(r) => go(F.network(r.id))}
                columns={[
                  { key: 'n', header: 'Territory', render: (r) => <b>{r.name}</b> },
                  { key: 'g', header: 'Required growth', align: 'right', render: (r) => <StatusChip tone="ok">{signed(r.growthPct)}</StatusChip> },
                  { key: 'u', header: 'Required uplift', align: 'right', render: (r) => lakh(Math.round(r.abp - r.lastYear)) },
                  { key: 'sh', header: 'Share of cluster uplift', align: 'right', render: (r) => pct(((r.abp - r.lastYear) / upliftTotal) * 100) },
                  { key: 'st', header: 'Plan status', align: 'center', render: (r) => <StatusChip tone={status(r.id).tone}>{status(r.id).label}</StatusChip> },
                  { key: 'a', header: 'Action', align: 'center', render: (r) => action(r, rows.indexOf(r)) },
                ]}
                total={{ n: 'Total', g: <StatusChip tone="ok">{signed(growth)}</StatusChip>, u: lakh(Math.round(upliftTotal)), sh: pct(100) }} />
            )}
          </Card>
          <div className="grid g2" style={{ flex: 1 }}>
          <Card title="Last-year achievement (FY 2025–26)" icon={Trophy}>
            <List items={[
              { icon: Target, label: 'Last-year target', value: crore(LAST_YEAR_SNAPSHOT.target, 1) },
              { icon: CircleCheck, label: `Target attainment (${crore(lastYearAll, 1)} of ${crore(LAST_YEAR_SNAPSHOT.target, 1)})`, value: pct((lastYearAll / LAST_YEAR_SNAPSHOT.target) * 100) },
              { icon: Trophy, label: 'Incentive achievement', value: pct(LAST_YEAR_SNAPSHOT.incentivePct) },
            ]} />
          </Card>
          <Card title="Key growth drivers (FY 2026–27)" icon={ListChecks}>
            <List items={GROWTH_DRIVERS.map((d) => ({ icon: CircleCheck, label: d }))} />
          </Card>
          </div>
        </div>
        <div className="stack">
          {lead && <Notes title="Planning notes" items={[<><b>{lead.name}</b> needs the largest uplift of {crore(lead.abp - lead.lastYear, 1)} ({signed(lead.growthPct)}) and comes first for business and crop planning.</>, <>The cluster needs {crore(upliftTotal, 1)} more than last year ({signed(growth)}); {lead.name} carries {pct(((lead.abp - lead.lastYear) / upliftTotal) * 100, 0)} of it.</>]} />}
          <Card title={`Last-year sales mix (${crore(lastYearAll, 1)})`} icon={Layers}>
            <List items={[
              ...mix.crops.map((c) => ({ icon: Sprout, label: `${c.name}`, value: pct(c.pct, 0) })),
              ...mix.products.map((p) => ({ icon: Store, label: p.name, value: pct(p.pct, 0) })),
            ]} />
          </Card>
        </div>
      </div>
    </FsmPage>
  );
}

// ================================================================ outlet drawer (screens 2 and 3)
type OutletRow = { kind: 'dealer'; d: Dealer } | { kind: 'retailer'; r: Retailer };

function OutletDrawer({ t, outlet, onClose }: { t: FsmTerritoryId; outlet: OutletRow; onClose: () => void }) {
  const go = useGo();
  const dealers = dealersOf(t);
  const dealer = outlet.kind === 'dealer' ? outlet.d : dealers.find((d) => d.id === outlet.r.dealerId)!;
  const mapped = retailersOf(t).filter((r) => r.dealerId === dealer.id);
  const title = outlet.kind === 'dealer' ? outlet.d.name : outlet.r.name;
  return (
    <Drawer title={title} width={620} onClose={onClose}
      status={outlet.kind === 'dealer' ? <StatusChip tone="ok">Dealer · active</StatusChip> : <StatusChip tone={outlet.r.active ? 'ok' : 'warn'}>{outlet.r.active ? 'Retailer · active' : 'Mapping to verify'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={ArrowRight} onClick={() => go(F.outlets(t))}>Plan outlet targets</Button>} />}>
      <Card title="Outlet record" icon={Store}>
        <List items={outlet.kind === 'dealer' ? [
          { label: 'Village', value: outlet.d.village },
          { label: 'Last-year primary sales', value: lakh(outlet.d.lastYear) },
          { label: 'Proposed target', value: lakh(outlet.d.proposed) },
          { label: 'Mapped retailers', value: `${outlet.d.activeRetailers} active · ${outlet.d.inactiveRetailers} inactive` },
        ] : [
          { label: 'Linked dealer', value: dealer.name },
          { label: 'Village', value: outlet.r.village },
          { label: 'Indicative secondary demand', value: outlet.r.active ? lakh(outlet.r.secondaryDemand) : '–' },
          { label: 'Mapping status', value: outlet.r.mapping },
        ]} />
      </Card>
      <Card title={`Retailers mapped to ${dealer.name}`} icon={Network} flush>
        <DataTable rows={mapped} rowKey={(r) => r.id}
          columns={[
            { key: 'n', header: 'Retailer', render: (r) => r.name },
            { key: 'd', header: 'Indicative secondary demand', align: 'right', render: (r) => (r.active ? lakh(r.secondaryDemand) : '–') },
            { key: 's', header: 'Status', align: 'center', render: (r) => <StatusChip tone={r.active ? 'ok' : 'warn'}>{r.active ? 'Active' : 'Mapping to verify'}</StatusChip> },
          ]} />
      </Card>
    </Drawer>
  );
}

// ================================================================ 2 Territory Network & Channel Mapping
type NetView = 'dealers' | 'retailers';
type NetSort = 'sales' | 'name' | 'retailers';

export function TerritoryNetwork() {
  const go = useGo();
  const t = useTerritory();
  const fsm = useFsmStore();
  const bh = useBhStore();
  const tr = clusterRows().find((r) => r.id === t)!;
  const villages = villagesOf(t);
  const [village, setVillage] = useState(ALL);
  const [activity, setActivity] = useState(ALL);
  const [mapping, setMapping] = useState(ALL);
  const [view, setView] = useState<NetView>('dealers');
  const [sortBy, setSortBy] = useState<NetSort>('sales');
  const [expanded, setExpanded] = useState<string[]>(() => [dealersOf(t)[0].id]);
  const [open, setOpen] = useState<OutletRow | null>(null);

  const inVillage = (v: string) => village === ALL || v === village;
  const retailerOk = (r: Retailer) => inVillage(r.village) && (activity === ALL || (activity === 'active') === r.active) && (mapping === ALL || r.mapping === mapping);
  const dealers = dealersOf(t).filter((d) => inVillage(d.village));
  const retailers = retailersOf(t);
  const dealerSort: Record<NetSort, (d: Dealer) => number | string> = { sales: (d) => -d.lastYear, name: (d) => d.name, retailers: (d) => -(d.activeRetailers + d.inactiveRetailers) };
  const cmp = <T,>(f: (x: T) => number | string) => (x: T, y: T) => { const a = f(x), b = f(y); return typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number); };
  const rows: OutletRow[] = view === 'dealers'
    ? [...dealers].sort(cmp(dealerSort[sortBy])).flatMap((d) => {
      const kids = retailers.filter((r) => r.dealerId === d.id && retailerOk(r));
      const showDealer = (activity === ALL || activity === 'active') && (mapping === ALL || mapping === 'Mapped');
      if (!showDealer && kids.length === 0) return [];
      return [{ kind: 'dealer' as const, d }, ...(expanded.includes(d.id) || !showDealer ? kids.map((r) => ({ kind: 'retailer' as const, r })) : [])];
    })
    : retailers.filter(retailerOk).sort(cmp<Retailer>(sortBy === 'name' ? (r) => r.name : (r) => -r.secondaryDemand)).map((r) => ({ kind: 'retailer' as const, r }));
  const place = village === ALL ? territoryName(t) : village;
  const scoped = { dealers: dealers.length, retailers: retailers.filter((r) => inVillage(r.village) && r.active).length, pending: retailers.filter((r) => inVillage(r.village) && r.mapping !== 'Mapped').length, coverage: sum(dealers, (d) => d.lastYear) };
  const top = [...dealers].sort((a, b) => b.lastYear - a.lastYear)[0];
  const key = (o: OutletRow) => (o.kind === 'dealer' ? o.d.id : o.r.id);
  const toggle = (id: string) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  return (
    <FsmPage section={SECTION} sectionTo={F.plan} trail={territoryName(t)} title="Territory Network & Channel Mapping" back={F.plan} next={F.outlets(t)} nextLabel="Proceed to outlet planning">
      <PlanTabs active={1} territory={t} />
      <FilterRows<NetView> view={view} setView={setView}
        views={[opt('dealers', 'Dealers'), opt('retailers', 'Retailers')] as { value: NetView; label: string }[]}
        filters={[
          { key: 'territory', label: 'Territory', value: t, options: FSM_TERRITORY_IDS.map((x) => opt(x, territoryName(x))), onChange: (v) => { fsm.setScope(v as FsmTerritoryId); go(F.network(v as FsmTerritoryId)); } },
          { key: 'village', label: 'Village', value: village, options: [opt(ALL, 'All villages'), ...villages.map((v) => opt(v, v))], onChange: setVillage },
          { key: 'type', label: 'Outlet type', value: activity, options: [opt(ALL, 'All outlets'), opt('active', 'Active outlets'), opt('inactive', 'Inactive outlets')], onChange: setActivity },
          { key: 'mapping', label: 'Mapping status', value: mapping, options: [opt(ALL, 'All mapping statuses'), opt('Mapped', 'Mapped'), opt('Pending verification', 'Pending verification')], onChange: setMapping },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: (v) => setSortBy(v as NetSort), options: [opt('sales', 'Last-year sales'), opt('name', 'Outlet name'), opt('retailers', 'Mapped retailers')] }]} />
      <div className="kpis">
        <KpiCard label="Last-year primary sales" value={crore(tr.lastYear, 1)} />
        <KpiCard label="Current-year ABP target" value={crore(tr.abp, 1)} />
        <KpiCard label="Dealers" value={num(dealersOf(t).length)} />
        <KpiCard label="Active retailers" value={num(retailers.filter((r) => r.active).length)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '200px minmax(0, 1fr) 290px' }}>
        <Card title="Geography explorer" icon={MapPin}>
          <div className="geo">
            <button type="button" onClick={() => { fsm.setScope('cluster'); go(F.plan); }}><ChevronDown size={15} />{TERRITORY_DISTRICT} cluster</button>
            {FSM_TERRITORY_IDS.map((x) => (
              <div key={x} className="geo">
                <button type="button" className={`lvl1${x === t && village === ALL ? ' on' : ''}`} onClick={() => { if (x === t) setVillage(ALL); else { fsm.setScope(x); go(F.network(x)); } }}>
                  {x === t ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{territoryName(x)}
                </button>
                {x === t && villages.map((v) => (
                  <button key={v} type="button" className={`lvl2${village === v ? ' on' : ''}`} onClick={() => setVillage(v)}><MapPin size={14} />{v}</button>
                ))}
              </div>
            ))}
          </div>
        </Card>
        <Card title={`Mapped outlets: ${place}`} icon={Store} flush right={<Button small icon={RefreshCw} onClick={() => bh.toast(`Outlet master refreshed for ${territoryName(t)}`)}>Refresh outlet master</Button>}>
          <div className="register-scroll">
          <DataTable rows={rows} rowKey={key}
            columns={[
              { key: 'n', header: 'Outlet name', render: (o) => (o.kind === 'dealer'
                ? <button type="button" className="row" style={{ fontWeight: 700 }} onClick={() => toggle(o.d.id)}>{expanded.includes(o.d.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{o.d.name}</button>
                : <span style={{ paddingLeft: view === 'dealers' ? 22 : 0 }}>{o.r.name}</span>) },
              { key: 'ty', header: 'Type', align: 'center', render: (o) => <StatusChip tone={o.kind === 'dealer' ? 'info' : 'neutral'}>{o.kind === 'dealer' ? 'Dealer' : 'Retailer'}</StatusChip> },
              ...(view === 'retailers' ? [{ key: 'ld', header: 'Linked dealer', render: (o: OutletRow) => (o.kind === 'retailer' ? dealersOf(t).find((d) => d.id === o.r.dealerId)!.name : '–') }] : []),
              { key: 'v', header: 'Village', render: (o) => (o.kind === 'dealer' ? o.d.village : o.r.village) },
              { key: 's', header: 'Primary / secondary sales', align: 'right', render: (o) => (o.kind === 'dealer' ? lakh(o.d.lastYear) : o.r.active ? lakh(o.r.secondaryDemand) : '–') },
              { key: 'st', header: 'Status', align: 'center', render: (o) => (o.kind === 'dealer' || o.r.active ? <StatusChip tone="ok">Active</StatusChip> : <StatusChip tone="warn">Mapping to verify</StatusChip>) },
              { key: 'vw', header: 'View', align: 'center', render: (o) => <Button small onClick={() => setOpen(o)}>View</Button> },
            ]} />
          </div>
        </Card>
        <div className="stack">
          <Card title={`Summary: ${place}`} icon={Network}>
            <List items={[
              { label: 'Mapped dealers', value: num(scoped.dealers) },
              { label: 'Mapped retailers', value: num(scoped.retailers) },
              { label: 'Last-year coverage', value: crore(scoped.coverage) },
              { label: 'Missing outlet mappings', value: num(scoped.pending), tone: 'warn' },
            ]} />
          </Card>
          <Notes title="Network notes" items={[
            `${num(scoped.pending)} retailer${scoped.pending === 1 ? '' : 's'} in ${place} await mapping verification before target allocation.`,
            ...(top ? [`${top.name} holds the largest last-year primary sales in ${place} (${lakh(top.lastYear)}).`] : []),
          ]} />
        </div>
      </div>
      {open && <OutletDrawer t={t} outlet={open} onClose={() => setOpen(null)} />}
    </FsmPage>
  );
}

// ================================================================ 3 Outlet Business Planning & Target Allocation
function Reconciliation({ abp, total, unallocated, allocatedPct }: { abp: number; total: number; unallocated: number; allocatedPct: number }) {
  return (
    <Card title="Target reconciliation" icon={Target}>
      <div className="recon">
        <div><span>Assigned ABP</span><b>{crore(abp)}</b></div>
        <div><span>Proposed allocation</span><b>{crore(total)}</b></div>
        <div><span>Unallocated gap</span><b className={unallocated > 0 ? 'warn' : ''}>{crore(unallocated)}</b></div>
        <div className="grow"><span>{pct(allocatedPct)} allocated</span><Bar value={Math.min(100, allocatedPct)} /></div>
      </div>
    </Card>
  );
}

export function OutletPlanning() {
  const t = useTerritory();
  const fsm = useFsmStore();
  const bh = useBhStore();
  const tr = clusterRows().find((r) => r.id === t)!;
  const tg = useTargets(t);
  const [expanded, setExpanded] = useState<string[]>(() => [tg.dealers[0].id]);
  const [open, setOpen] = useState<OutletRow | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const retailers = retailersOf(t);
  const o = { active: retailers.filter((r) => r.active).length, inactive: retailers.filter((r) => !r.active).length };
  const lastYear = sum(tg.dealers, (d) => d.lastYear);
  const rows: OutletRow[] = tg.dealers.flatMap((d) => [{ kind: 'dealer' as const, d }, ...(expanded.includes(d.id) ? retailers.filter((r) => r.dealerId === d.id).map((r) => ({ kind: 'retailer' as const, r })) : [])]);
  const demand = (r: Retailer) => { const d = tg.dealers.find((x) => x.id === r.dealerId)!; return r.active ? retailerDemand(tg.of(d), d.activeRetailers, Number(/-r(\d+)$/.exec(r.id)![1]) - 1) : 0; };
  const toggle = (id: string) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const gapVillages = [...new Set([...tg.dealers].sort((a, b) => (tg.of(a) - a.lastYear) / a.lastYear - (tg.of(b) - b.lastYear) / b.lastYear).slice(0, 2).map((d) => d.village))];

  const download = () => {
    const csv = ['Dealer ID,Dealer,Village,Last-year primary sales (L),Proposed target (L)', ...tg.dealers.map((d) => `${d.id},"${d.name}",${d.village},${d.lastYear},${tg.of(d)}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${t}-outlet-plan-template.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importPlan = async (f: File) => {
    const lines = (await f.text()).split(/\r?\n/).slice(1).filter(Boolean);
    const patch: Record<string, number> = {};
    let unmatched = 0;
    for (const line of lines) {
      const cells = line.split(',');
      const id = cells[0]?.trim();
      const v = Number(cells[cells.length - 1]);
      if (tg.dealers.some((d) => d.id === id) && Number.isFinite(v)) patch[id] = v; else unmatched += 1;
    }
    fsm.setTargets(patch);
    bh.toast(`Imported ${Object.keys(patch).length} dealer targets${unmatched ? ` · ${unmatched} unmatched rows` : ''}`);
  };

  return (
    <FsmPage section={SECTION} sectionTo={F.plan} trail={territoryName(t)} title="Outlet Business Planning & Target Allocation" back={F.network(t)} next={F.crop(t)} nextLabel="Proceed to crop & product planning">
      <PlanTabs active={2} territory={t} />
      <div className="kpis">
        <KpiCard label="Last-year primary sales" value={crore(tr.lastYear, 1)} />
        <KpiCard label="Current-year ABP target" value={crore(tr.abp, 1)} />
        <KpiCard label="Required growth" value={pct(tr.growthPct)} />
        <KpiCard label="Proposed allocation" value={crore(tg.total)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
        <Card title="Dealer-wise business plan" icon={FileSpreadsheet} flush right={<>
          <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importPlan(f); e.target.value = ''; }} />
          <Button small icon={Upload} onClick={() => file.current?.click()}>Import Excel plan</Button>
          <Button small icon={Download} onClick={download}>Download template</Button>
          <Button small primary icon={Save} onClick={() => bh.toast(`Outlet plan draft saved · ${crore(tg.total)} allocated`)}>Save draft</Button>
        </>}>
          <div className="register-scroll">
          <DataTable rows={rows} rowKey={(r) => (r.kind === 'dealer' ? r.d.id : r.r.id)}
            columns={[
              { key: 'n', header: 'Dealer / outlet', render: (r) => (r.kind === 'dealer'
                ? <button type="button" className="row" style={{ fontWeight: 700 }} onClick={() => toggle(r.d.id)}>{expanded.includes(r.d.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{r.d.name}</button>
                : <span style={{ paddingLeft: 22 }}>{r.r.name}</span>) },
              { key: 'v', header: 'Village', render: (r) => (r.kind === 'dealer' ? r.d.village : r.r.village) },
              { key: 'ly', header: 'Last-year primary sales', align: 'right', render: (r) => (r.kind === 'dealer' ? lakh(r.d.lastYear) : '') },
              { key: 'p', header: 'Proposed target (₹ L)', align: 'center', render: (r) => (r.kind === 'dealer'
                ? <input className="num-input" type="number" min={0} step={1} aria-label={`Proposed target ${r.d.name}`} value={tg.of(r.d)} onChange={(e) => fsm.setTargets({ [r.d.id]: Math.max(0, Number(e.target.value) || 0) })} />
                : r.r.active ? <small>{lakh(demand(r.r))} secondary</small> : '–') },
              { key: 'g', header: 'Growth', align: 'right', render: (r) => (r.kind === 'dealer' ? <StatusChip tone="ok">{signed(((tg.of(r.d) - r.d.lastYear) / r.d.lastYear) * 100)}</StatusChip> : '') },
              { key: 's', header: 'Planning status', align: 'center', render: (r) => (r.kind === 'dealer' ? <StatusChip tone={tg.of(r.d) > 0 ? 'ok' : 'warn'}>{tg.of(r.d) > 0 ? 'Planned' : 'Not planned'}</StatusChip> : <StatusChip tone={r.r.active ? 'ok' : 'warn'}>{r.r.active ? 'Active' : 'Inactive'}</StatusChip>) },
              { key: 'd', header: 'Details', align: 'center', render: (r) => <Button small onClick={() => setOpen(r)}>View</Button> },
            ]}
            total={{ n: `Total (${tg.dealers.length} dealers)`, ly: lakh(lastYear), p: <b>{lakh(tg.total)}</b>, g: <StatusChip tone="ok">{signed(((tg.total - lastYear) / lastYear) * 100)}</StatusChip> }} />
          </div>
        </Card>
        <div className="stack">
          <Notes title="Planning notes" items={[
            <><b>{crore(tg.unallocated)}</b> remains unallocated against the {crore(tg.abp, 1)} target.</>,
            `Outlets in ${gapVillages.join(' and ')} have the most room to close the gap.`,
          ]} />
          <Card title={`Territory network (${territoryName(t)})`} icon={Network}>
            <List items={[
              { icon: Store, label: 'Total dealers', value: num(tg.dealers.length) },
              { icon: Store, label: 'Active retailers', value: num(o.active) },
              { icon: Store, label: 'Inactive retailers', value: num(o.inactive), tone: 'warn' },
              { icon: MapPin, label: 'Villages covered', value: num(villagesOf(t).length) },
            ]} />
          </Card>
        </div>
      </div>
      <Reconciliation abp={tg.abp} total={tg.total} unallocated={tg.unallocated} allocatedPct={tg.allocatedPct} />
      {open && <OutletDrawer t={t} outlet={open} onClose={() => setOpen(null)} />}
    </FsmPage>
  );
}

// ================================================================ 4 Village-wise Crop, Product & Coverage Planning
export function CropPlanning() {
  const go = useGo();
  const t = useTerritory();
  const bh = useBhStore();
  const tg = useTargets(t);
  const op = useOnionPlan(t);
  const onionCrop = cropPlan(t)[0];
  const fsm = useFsmStore();
  const [selected, setSelectedRaw] = useState(op.rows.find((v) => v.village === 'Dhanora')?.village ?? op.rows[0].village);
  const [editing, setEditing] = useState<string | null>(null);
  const sel = op.rows.find((v) => v.village === selected)!;
  // Coverage calculator: saved inputs per village in the FSM store; edits go to a draft (strings, so a field can be empty).
  const covKey = (village: string) => `${t}:${village}`;
  const savedCov = (v: VillageOnionPlan) => fsm.coverage[covKey(v.village)] ?? coverageDefaults(v);
  const KEYS = Object.keys(COVERAGE_LIMITS) as (keyof CoverageInputs)[];
  const toDraft = (i: CoverageInputs) => Object.fromEntries(KEYS.map((k) => [k, String(Math.round(i[k] * 100) / 100)])) as Record<keyof CoverageInputs, string>;
  const [draft, setDraft] = useState(() => toDraft(savedCov(sel)));
  const [pending, setPending] = useState<string | null>(null);
  const saved = savedCov(sel);
  const errs = Object.fromEntries(KEYS.map((k) => [k, coverageError(k, draft[k])])) as Record<keyof CoverageInputs, string>;
  const valid = KEYS.every((k) => !errs[k]);
  const changed = KEYS.filter((k) => errs[k] || Number(draft[k]) !== Math.round(saved[k] * 100) / 100);
  const dirty = changed.length > 0;
  const parsed = Object.fromEntries(KEYS.map((k) => [k, Number(draft[k])])) as unknown as CoverageInputs;
  const res = valid ? coverageResult(parsed) : null;
  const savedRes = coverageResult(saved);
  const switchTo = (village: string) => { setSelectedRaw(village); setDraft(toDraft(savedCov(op.rows.find((v) => v.village === village)!))); };
  const setSelected = (village: string) => { if (village === selected) return; if (dirty) setPending(village); else switchTo(village); };
  const saveCov = () => { if (!valid) return false; fsm.setCoverage(covKey(sel.village), parsed); bh.toast('Coverage plan saved'); return true; };
  const rowCov = (v: VillageOnionPlan) => coverageResult(savedCov(v));
  const totals = { lastYear: sum(op.rows, (v) => v.lastYear), prev: sum(op.rows, (v) => savedCov(v).prev), req: sum(op.rows, (v) => rowCov(v).required) };
  const realisationOk = FUNNEL_DEFAULTS.rupeesPerKg >= 100;
  // Planning notes: computed from the village rows and the saved calculator values.
  const growthPct = (a: number, b: number) => `${b >= a ? '+' : '–'}${pct(Math.abs(ratio(b - a, a)))}`;
  const addedTotal = totals.req - totals.prev;
  const top2 = [...op.rows].sort((a, b) => rowCov(b).growth - rowCov(a).growth).filter((v) => v.village !== 'Other villages' && rowCov(v).growth > 0).slice(0, 2);
  const top2Added = sum(top2, (v) => rowCov(v).growth);
  const sameAdd = top2.length === 2 && Math.round(rowCov(top2[0]).growth) === Math.round(rowCov(top2[1]).growth);
  const kgPerAcre = totals.req > 0 ? (sum(op.rows, (v) => savedCov(v).volume) * 1000) / totals.req : 0;
  const rateDiff = ratio(kgPerAcre - saved.rate, saved.rate);
  const others = op.rows.find((v) => v.village === 'Other villages');
  const othersShare = others && op.total > 0 ? ratio(others.plan, op.total) : 0;
  const planNotes: string[] = [
    `Realisation check: plan uses ₹${FUNNEL_DEFAULTS.rupeesPerKg}/kg${realisationOk ? ', in line with last year' : ''}.`,
    `Coverage: ${sel.village} needs ${num(savedRes.eligible)} eligible new acres on top of ${num(savedRes.retained)} retained acres.`,
    op.total === onionCrop.proposed
      ? `Plan matches the onion allocation: villages total ${crore(op.total)} = onion budget ${crore(onionCrop.proposed)}.`
      : `Villages total ${crore(op.total)} vs onion allocation ${crore(onionCrop.proposed)} (gap ${crore(Math.abs(op.total - onionCrop.proposed))}).`,
    `Growth vs last year: ${crore(totals.lastYear)} → ${crore(op.total)} (${growthPct(totals.lastYear, op.total)}); coverage ${num(totals.prev)} → ${num(totals.req)} acres (${growthPct(totals.prev, totals.req)}).`,
    ...(top2.length && addedTotal > 0 ? [`Largest coverage additions: ${top2.map((v) => v.village).join(' and ')} (${sameAdd ? `+${num(rowCov(top2[0]).growth)} acres each` : top2.map((v) => `+${num(rowCov(v).growth)}`).join(' and ') + ' acres'}), ${pct(ratio(top2Added, addedTotal), 0)} of the +${num(addedTotal)} acres.`] : []),
    `Plan implies ${num(kgPerAcre)} kg/acre across ${num(totals.req)} acres, ${Math.abs(rateDiff) <= 5 ? 'in line with' : rateDiff > 0 ? 'above' : 'below'} the assumed seasonal rate.`,
    ...(others && othersShare > 25 ? [`Other villages carry ${pct(othersShare, 0)} of the onion plan (${lakh(others.plan)}); split them into named villages for tracking.`] : []),
  ];

  return (
    <FsmPage section={SECTION} sectionTo={F.plan} trail={territoryName(t)} title="Village-wise Crop, Product & Coverage Planning" back={F.outlets(t)} next={F.review(t)} nextLabel="Review business & crop plan">
      <PlanTabs active={3} territory={t} />
      <div className="kpis">
        <KpiCard label="Current-year ABP target" value={crore(tg.abp)} />
        <KpiCard label="Proposed outlet plan" value={crore(tg.total)} />
        <KpiCard label="Remaining gap" value={crore(tg.unallocated)} />
        <KpiCard label="Onion plan" value={crore(op.total)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="stack">
        <Card title="Village-wise onion growth plan" icon={Sprout} flush style={{ flex: 'none' }} right={<>
          <Button small icon={CircleCheck} onClick={() => bh.toast(op.total === onionCrop.proposed ? `Assumptions valid · village plans reconcile to ${crore(onionCrop.proposed)}` : `Village plans total ${crore(op.total)} vs onion plan ${crore(onionCrop.proposed)}`)}>Validate assumptions</Button>
          <Button small icon={RefreshCw} onClick={() => go(F.outlets(t))}>Update linked outlet plan</Button>
        </>}>
          <DataTable selectable rows={op.rows} rowKey={(v) => v.village} selected={selected} onRowClick={(v) => setSelected(v.village)}
            columns={[
              { key: 'v', header: 'Village', render: (v) => <b>{v.village}</b> },
              { key: 'ly', header: 'Last year', align: 'right', render: (v) => `${lakh(v.lastYear)} / ${num(coverageCalc(v).lastVolumeMt)} MT` },
              { key: 'pa', header: 'Previous acres', align: 'right', render: (v) => num(coverageCalc(v).previousAcres) },
              { key: 'p', header: 'Target', align: 'center', render: (v) => (editing === v.village
                ? <input className="num-input" type="number" min={0} step={1} autoFocus aria-label={`Onion plan ${v.village}`} value={v.plan} onClick={(e) => e.stopPropagation()} onChange={(e) => op.set(v.village, Math.max(0, Number(e.target.value) || 0))} />
                : `${lakh(v.plan)} / ${num(coverageCalc(v).volumeMt)} MT`) },
              { key: 'ra', header: 'Required acres', align: 'right', render: (v) => num(rowCov(v).required) },
              { key: 'g', header: 'Coverage growth', align: 'right', render: (v) => { const g = rowCov(v).growth; return <StatusChip tone={g >= 0 ? 'ok' : 'warn'}>{`${g >= 0 ? '+' : '–'}${num(Math.abs(g))} acres`}</StatusChip>; } },
              { key: 'a', header: 'Action', align: 'center', render: (v) => <Button small primary={editing === v.village} onClick={() => { setSelected(v.village); setEditing(editing === v.village ? null : v.village); }}>{editing === v.village ? 'Done' : 'Edit'}</Button> },
            ]}
            total={{ v: 'Total', ly: lakh(totals.lastYear), pa: num(totals.prev), p: <b>{crore(op.total)}</b>, ra: num(totals.req), g: <StatusChip tone="ok">{`+${num(totals.req - totals.prev)} acres`}</StatusChip> }} />
        </Card>
          <Notes title="Planning notes" fill items={planNotes} />
        </div>
        <div className="stack">
          <Card title={`${sel.village} coverage & volume calculator`} icon={Calculator}
            right={<button type="button" className="text-btn" onClick={() => setDraft(toDraft(coverageDefaults(sel)))}>Reset to defaults</button>}>
            <div className="calc-label">Assumptions</div>
            {KEYS.map((k) => (
              <div key={k} className="list-row calc-row">
                <span>{COVERAGE_LIMITS[k].label}</span>
                <span className="right stack" style={{ gap: 2, alignItems: 'flex-end' }}>
                  <span className={`unit-input${errs[k] ? ' bad' : changed.includes(k) ? ' chg' : ''}`}>
                    <input type="number" aria-label={COVERAGE_LIMITS[k].label} min={COVERAGE_LIMITS[k].min} max={COVERAGE_LIMITS[k].max} step={COVERAGE_LIMITS[k].step} value={draft[k]} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                    <small>{COVERAGE_LIMITS[k].unit}</small>
                  </span>
                  {errs[k] && <small className="err">{errs[k]}</small>}
                </span>
              </div>
            ))}
            <div className="calc-label calc-divider">Result</div>
            <List items={[
              { label: 'Required effective coverage', value: res ? `${num(res.required)} acres` : '–' },
              { label: 'Retained acres', value: res ? `${num(res.retained)} acres` : '–' },
              { label: 'New effective acres needed', value: res ? `${num(res.newAcres)} acres` : '–' },
            ]} />
            <div className="list-row calc-final"><b>Eligible new acres required</b><b className="right">{!res ? '–' : res.newAcres === 0 ? 'No new acres needed' : `${num(res.eligible)} acres`}</b></div>
            {dirty && (
              <div className="unsaved-bar" style={{ margin: '4px 0 0', flexWrap: 'wrap' }}>
                <TriangleAlert size={17} />
                <b>{changed.length} input{changed.length === 1 ? '' : 's'} changed</b>
                <span>Eligible new acres {num(savedRes.eligible)} → {res ? num(res.eligible) : '–'}</span>
                <span className="sp" />
                <Button small onClick={() => setDraft(toDraft(saved))}>Cancel</Button>
                <Button small primary icon={Check} disabled={!valid} onClick={() => saveCov()}>Save changes</Button>
              </div>
            )}
          </Card>
          {pending && (
            <Modal title="Save changes before leaving?" onClose={() => setPending(null)}
              footer={<>
                <Button onClick={() => setPending(null)}>Stay</Button>
                <span className="sp" />
                <Button onClick={() => { switchTo(pending); setPending(null); }}>Discard</Button>
                <Button primary icon={Check} disabled={!valid} onClick={() => { if (saveCov()) { switchTo(pending); setPending(null); } }}>Save</Button>
              </>}>
              <p style={{ margin: 0 }}>{changed.length} input{changed.length === 1 ? '' : 's'} changed for {sel.village}.</p>
            </Modal>
          )}
          <Card title="Product & growth-stage context" icon={Sprout}>
            <List items={[
              { label: 'Onion stage', value: 'Bulb initiation to maturation' },
              { label: 'Application window', value: '31–60 days after planting' },
              { label: 'Croptek product options', value: 'Grade 1 · Grade 2 · Water soluble' },
            ]} />
          </Card>
        </div>
      </div>
    </FsmPage>
  );
}

// ================================================================ 5 Business & Crop Plan Review
export function PlanReview() {
  const go = useGo();
  const t = useTerritory();
  const fsm = useFsmStore();
  const bh = useBhStore();
  const tg = useTargets(t);
  const op = useOnionPlan(t);
  const crops = cropPlan(t);
  const cropTotal = sum(crops, (c) => c.proposed);
  const reconciled = Math.round(cropTotal) === Math.round(tg.total);
  const villagesOk = Math.round(op.total) === Math.round(crops[0].proposed);
  const submitted = fsm.submitted.includes(t);
  const notes = fsm.notes[t] ?? '';
  const dealers = [...tg.dealers].sort((a, b) => tg.of(b) - tg.of(a));
  const status = submitted ? <StatusChip tone="ok">Submitted · awaiting Zonal Manager review</StatusChip>
    : <StatusChip tone="warn">{reconciled && tg.unallocated <= 0 ? 'Draft · ready to submit' : 'Draft · reconciliation required'}</StatusChip>;
  const submit = () => {
    fsm.submitPlan(t);
    bh.toast(`${territoryName(t)} plan submitted · awaiting Zonal Manager review`);
    go(F.campaigns);
  };

  return (
    <FsmPage section={SECTION} sectionTo={F.plan} trail={territoryName(t)} title="Business & Crop Plan Review" right={status} back={F.crop(t)} next={submit} nextLabel="Submit for approval">
      <PlanTabs active={4} territory={t} />
      <div className="kpis">
        <KpiCard label="ABP target" value={crore(tg.abp)} />
        <KpiCard label="Proposed plan" value={crore(tg.total)} />
        <KpiCard label="Unallocated gap" value={crore(tg.unallocated)} />
        <KpiCard label="Allocated" value={pct(tg.allocatedPct)} />
      </div>
      <div className="grid g3">
        <Card title="Dealer / outlet business plan" icon={Store} flush>
          <DataTable rows={dealers} rowKey={(d) => d.id}
            columns={[
              { key: 'n', header: 'Dealer', render: (d) => d.name },
              { key: 'v', header: 'Target', align: 'right', render: (d) => crore(tg.of(d)) },
              { key: 's', header: 'Share of plan', align: 'right', render: (d) => pct((tg.of(d) / tg.total) * 100) },
            ]}
            total={{ n: `Total (${dealers.length} dealers)`, v: crore(tg.total), s: pct(100) }} />
        </Card>
        <Card title="Crop / product plan" icon={Sprout} flush>
          <DataTable rows={crops} rowKey={(c) => c.crop}
            columns={[
              { key: 'c', header: 'Crop', render: (c) => c.crop },
              { key: 'a', header: 'ABP', align: 'right', render: (c) => crore(c.abp) },
              { key: 'p', header: 'Plan value', align: 'right', render: (c) => crore(c.proposed) },
              { key: 'u', header: 'Plan-linked uplift', align: 'right', render: (c) => (c.abp - c.proposed > 0 ? `+${lakh(c.abp - c.proposed)}` : '–') },
            ]}
            total={{ c: 'Total', a: crore(sum(crops, (c) => c.abp)), p: crore(cropTotal), u: `+${lakh(sum(crops, (c) => Math.max(0, c.abp - c.proposed)))}` }} />
        </Card>
        <Card title="Plan validation" icon={ListChecks} right={<Button small icon={Target} onClick={() => go(F.outlets(t))}>Resolve planning gap</Button>}>
          <List items={[
            { icon: reconciled ? CircleCheck : CircleAlert, tone: reconciled ? undefined : 'warn', label: 'Outlet and crop totals reconciled', value: reconciled ? crore(tg.total) : `${crore(tg.total)} vs ${crore(cropTotal)}` },
            { icon: tg.unallocated > 0 ? CircleAlert : CircleCheck, tone: tg.unallocated > 0 ? 'warn' : undefined, label: 'ABP gap', value: tg.unallocated > 0 ? `${lakh(Math.round(tg.unallocated))} unresolved` : 'Closed' },
            ...crops.filter((c) => c.abp > c.proposed).map((c) => ({ icon: CircleAlert, tone: 'warn' as const, label: `Proposed ${c.crop.toLowerCase()} uplift`, value: `+${lakh(c.abp - c.proposed)} uncommitted` })),
            { icon: villagesOk ? CircleCheck : CircleAlert, tone: villagesOk ? undefined : 'warn', label: 'Village onion plans match the onion plan', value: crore(op.total) },
          ]} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Review notes" icon={MessageSquare} right={<>
          <Button small onClick={() => bh.toast('Exception review requested from the Zonal Manager')}>Request exception review</Button>
          <Button small icon={Save} onClick={() => bh.toast('Plan draft saved')}>Save draft</Button>
        </>}>
          <textarea className="input" maxLength={500} rows={3} aria-label="Review notes" value={notes} onChange={(e) => fsm.setNotes(t, e.target.value)} />
          <small>{notes.length} / 500</small>
        </Card>
        <Card title="Version history" icon={History}>
          <List items={[
            { label: <><StatusChip tone={submitted ? 'ok' : 'warn'}>{submitted ? 'Version 2 · submitted' : 'Version 2 · draft'}</StatusChip> ABP gap and plan-linked uplift added</>, value: crore(tg.total) },
            { label: <><StatusChip tone="neutral">Version 1 · draft</StatusChip> Dealer targets entered</>, value: crore(sum(tg.dealers, (d) => d.proposed)) },
          ]} />
        </Card>
      </div>
    </FsmPage>
  );
}


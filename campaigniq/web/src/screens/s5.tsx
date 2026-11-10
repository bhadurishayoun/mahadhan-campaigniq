import './s5.css';
import { useState } from 'react';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, Building2, CalendarDays, CheckCircle2, ClipboardCheck, Clock, Coins,
  Eye, Gauge, IndianRupee, Layers, Leaf, MapPin, MessageSquare, Package, Pencil, RefreshCw, Save, Scale, Search,
  Send, ShieldCheck, Sparkles, Sprout, Star, Store, Target, Truck, UserPlus, Users, Warehouse, ArrowRightLeft,
  Calculator, Lightbulb, ListChecks,
} from 'lucide-react';
import { useNav } from '../nav';
import { useDataset } from '../data/datasets';
import {
  AiItem, Breadcrumbs, Btn, Check, COLORS, ContextStrip, DataTable, Donut, FlowFooter, Grid, Kpi, KpiRow, Note,
  PageHeader, Panel, Pill, Progress, SourceBar, VBars, clamp, useWidth, type Tone,
} from '../ui';
import { IndiaDistrictMap } from '../map/IndiaDistrictMap';

const CAMPAIGN_ITEM = {
  icon: <Target size={22} />,
  label: 'Campaign',
  value: 'Croptek Onion Conversion — Ambad',
  sub: 'Ambad, Jalna, Maharashtra',
};

const fmt = (value: number, digits = 1) => value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const int = (value: number) => Math.round(value).toLocaleString('en-IN');

/* ------------------------------------------------------------------ */
/* S5.1 Campaign Demand Projection                                     */
/* ------------------------------------------------------------------ */

const TARGET_FARMERS = 1832;
const BASE = { reach: 90, trial: 40, adoption: 81, qty: 393, baseline: 0 };
// Calibrates the raw funnel product to the approved S4.4 base case (532 adopters).
const CALIBRATION = 532 / (TARGET_FARMERS * 0.9 * 0.4 * 0.81);
const SUPPLY_MT = 166;

type Assumptions = typeof BASE & { confidence: string };

function forecast(a: Assumptions) {
  const adopters = Math.round(TARGET_FARMERS * (a.reach / 100) * (a.trial / 100) * (a.adoption / 100) * CALIBRATION * (1 + a.baseline / 100));
  const demand = (adopters * a.qty) / 1000;
  return { adopters, demand };
}

type SkuRow = { sku: string; pack: string; qty: string; demand: number; bags: number; by: string; conf: string };
const SKU_BASE: SkuRow[] = [
  { sku: 'Croptek – 50 kg', pack: '50 kg', qty: '200 kg', demand: 106.4, bags: 2128, by: "10 Jan '27", conf: 'High' },
  { sku: 'Croptek – 25 kg', pack: '25 kg', qty: '125 kg', demand: 66.5, bags: 2660, by: "20 Jan '27", conf: 'Medium' },
  { sku: 'Croptek – 10 kg', pack: '10 kg', qty: '68 kg', demand: 36.1, bags: 3610, by: "05 Feb '27", conf: 'Medium' },
];

type VillageRow = { village: string; farmers: number; adopters: number; demand: number; retailer: string; visibility: string; arrival: string };
const VILLAGE_BASE: VillageRow[] = [
  { village: 'Wadi Gaon', farmers: 368, adopters: 107, demand: 42.0, retailer: 'Wadi Gaon (R1)', visibility: 'Limited', arrival: "05 Jan '27" },
  { village: 'Dhanora', farmers: 344, adopters: 100, demand: 39.3, retailer: 'Dhanora (R2)', visibility: 'Adequate', arrival: "10 Jan '27" },
  { village: 'Ambad HQ', farmers: 386, adopters: 115, demand: 45.2, retailer: 'Ambad Mkt (R3)', visibility: 'Adequate', arrival: "10 Jan '27" },
  { village: 'Pimpalgaon', farmers: 272, adopters: 79, demand: 31.0, retailer: 'Pimpalgaon (R4)', visibility: 'Limited', arrival: "15 Jan '27" },
  { village: 'Other Villages', farmers: 462, adopters: 131, demand: 51.5, retailer: 'Mixed (R5–R7)', visibility: 'Unverified', arrival: "20 Jan '27" },
];

const PHASES = [
  { label: "Dec '26", stage: 'Vegetative (Dec)', mt: 31, pct: 15 },
  { label: "Jan '27", stage: 'Bulb Development (Jan)', mt: 73, pct: 35 },
  { label: "Feb '27", stage: 'Bulb Enlargement (Feb)', mt: 63, pct: 30 },
  { label: "Mar '27", stage: 'Maturity (Mar)', mt: 42, pct: 20 },
];

const visTone = (v: string): Tone => (v === 'Adequate' ? 'green' : v === 'Limited' ? 'amber' : 'grey');
const confTone = (v: string): Tone => (v === 'High' ? 'green' : v === 'Medium' ? 'amber' : 'red');

function PctInput({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <span className="s5-pct">
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))} />
      <span>%</span>
    </span>
  );
}

export function DemandProjection() {
  const { toast } = useNav();
  const villages = useDataset('readiness.village_demand', VILLAGE_BASE);
  const [draft, setDraft] = useState<Assumptions>({ ...BASE, confidence: 'Medium' });
  const [applied, setApplied] = useState<Assumptions>({ ...BASE, confidence: 'Medium' });
  const [status, setStatus] = useState<'draft' | 'changes' | 'submitted'>('draft');

  const live = forecast(draft);
  const result = forecast(applied);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const factor = result.demand / 209.076;
  const gap = Math.max(0, result.demand - SUPPLY_MT);
  const set = (key: keyof Assumptions) => (v: number | string) => setDraft((d) => ({ ...d, [key]: v }));

  const skuRows = SKU_BASE.map((r) => ({ ...r, demand: r.demand * factor, bags: Math.round(r.bags * factor) }));
  const totalBags = skuRows.reduce((s, r) => s + r.bags, 0);
  const villageRows = villages.rows.map((r) => ({ ...r, adopters: Math.round(r.adopters * factor), demand: r.demand * factor }));
  const revenueL = 52 * factor;

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S2.5 Campaign Recommendations', to: 's2.5' },
        { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
        { label: 'S4.3 Activity Planner', to: 's4.3' },
        { label: 'S4.4 Scenario Simulator', to: 's4.4' },
        { label: 'S4.5 Approval & Review', to: 's4.5' },
        { label: 'S5.1 Campaign Demand Projection' },
      ]} />
      <PageHeader
        back="s4.5"
        title="Campaign Demand Projection"
        subtitle="Project and plan product demand, SKU requirements and supply for the approved Croptek (Onion) campaign in Ambad, Jalna"
      />
      <SourceBar right={<Pill tone="green"><CheckCircle2 size={12} /> Campaign Status: {status === 'submitted' ? 'Demand Submitted for Approval' : 'Approved — Supply Planning'}</Pill>}>
        <CheckCircle2 size={15} /> <strong>Approved campaign scenario imported from S4.5 — Base Case</strong>
      </SourceBar>
      <ContextStrip items={[
        CAMPAIGN_ITEM,
        { icon: <Users size={22} />, label: 'Target Farmers', value: '1,832', sub: '(Conventional NPK Users)' },
        { icon: <CalendarDays size={22} />, label: 'Campaign Period', value: '15 Dec 2026 – 15 Mar 2027' },
        { icon: <Coins size={22} />, label: 'Budget', value: '₹8.00 Lakh' },
        { icon: <BarChart3 size={22} />, label: 'Market Opportunity', value: '₹52 Lakh' },
        { icon: <Sprout size={22} />, label: 'Base Case (Approved)', value: 'Adopters: 532 | Adoption: 29%', sub: 'Incremental Demand: 209 MT' },
      ]} />
      <KpiRow>
        <Kpi icon={<Package size={20} />} label="Projected Incremental Demand" value={`${fmt(result.demand, 0)} MT`} />
        <Kpi icon={<IndianRupee size={20} />} label="Estimated Incremental Revenue" value={`₹${fmt(revenueL, 0)} Lakh`} />
        <Kpi icon={<Users size={20} />} label="Expected Adopting Farmers" value={int(result.adopters)} />
        <Kpi icon={<Scale size={20} />} label="Average Demand per Adopter" value={`${applied.qty} kg`} />
        <Kpi icon={<Target size={20} />} label="Campaign Demand Confidence" value={<Pill tone={confTone(applied.confidence)} solid={applied.confidence === 'High'}>{applied.confidence}</Pill>} />
        <Kpi icon={<Truck size={20} />} label="Supply Planning Status" value={<Pill tone="amber">Pending Stock Validation</Pill>} />
      </KpiRow>

      <Grid cols="1.25fr 1.15fr 1.1fr">
        <Panel title="Demand Calculation & Assumptions" icon={<Pencil size={15} />} info>
          <div className="s5-calc">
            <div>
              <div className="s5-calc-row"><span>Target farmers</span><span className="s5-out">{int(TARGET_FARMERS)}</span></div>
              <div className="s5-calc-row"><span>Expected reach (% of target)</span><PctInput value={draft.reach} onChange={set('reach')} /></div>
              <div className="s5-calc-row"><span>Trial conversion (% of reached)</span><PctInput value={draft.trial} onChange={set('trial')} /></div>
              <div className="s5-calc-row"><span>Trial-to-adoption conversion</span><PctInput value={draft.adoption} onChange={set('adoption')} /></div>
              <div className="s5-calc-row"><span>Expected adopting farmers</span><span className="s5-out">{int(live.adopters)}</span></div>
              <div className="s5-calc-row">
                <span>Programme quantity per adopter</span>
                <span className="s5-pct"><input type="number" min={50} max={1000} value={draft.qty} onChange={(e) => set('qty')(Math.max(0, Number(e.target.value) || 0))} /><span>kg</span></span>
              </div>
              <div className="s5-calc-row"><span>Existing demand baseline adj.</span><PctInput value={draft.baseline} min={-50} max={50} onChange={set('baseline')} /></div>
              <div className="s5-calc-row">
                <span>Scenario confidence</span>
                <select value={draft.confidence} onChange={(e) => set('confidence')(e.target.value)}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="s5-formula">
              <strong><Calculator size={13} /> Demand Formula</strong>
              <span>Projected Demand = Expected Adopters × Programme Quantity / Adopter</span>
              <div className="s5-formula-eq">{int(live.adopters)} × {draft.qty} kg<br />= {fmt(live.demand, 0)} MT</div>
              <span className="muted small">Incrementality: 100% of projected demand is considered campaign-linked (configurable).</span>
              {dirty && <span className="s5-dirty">Assumptions changed — recalculate to apply.</span>}
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <Btn variant="primary" icon={<RefreshCw size={14} />} onClick={() => {
              setApplied(draft);
              const next = forecast(draft);
              toast(`Forecast recalculated: ${int(next.adopters)} adopters × ${draft.qty} kg = ${fmt(next.demand, 0)} MT`);
            }}>Recalculate Forecast</Btn>
            {dirty && <Btn variant="ghost" small onClick={() => setDraft(applied)}>Reset</Btn>}
          </div>
        </Panel>

        <Panel title="SKU-wise Demand Projection" icon={<BarChart3 size={15} />}>
          <DataTable<SkuRow>
            compact
            columns={[
              { key: 'sku', label: 'Product / SKU (Croptek)*' },
              { key: 'pack', label: 'Pack Size' },
              { key: 'qty', label: 'Programme Qty / Adopter', align: 'right' },
              { key: 'demand', label: 'Projected Demand (MT)', align: 'right', render: (r) => fmt(r.demand) },
              { key: 'bags', label: 'Required Bags', align: 'right', render: (r) => int(r.bags) },
              { key: 'by', label: 'Required-by' },
              { key: 'conf', label: 'Confidence', render: (r) => <Pill tone={confTone(r.conf)}>{r.conf}</Pill> },
            ]}
            rows={skuRows}
            total={{ sku: 'Total', pack: '–', qty: '–', demand: <strong>{fmt(result.demand)}</strong>, bags: <strong>{int(totalBags)}</strong> }}
          />
          <Note>*Illustrative pack mix; to be validated with Mahadhan's approved SKU master.</Note>
        </Panel>

        <Panel title={<>Demand Phasing by Crop Stage <span className="muted small">(Total: {fmt(result.demand, 0)} MT)</span></>} icon={<Leaf size={15} />}>
          <VBars
            height={190}
            max={Math.max(100, 75 * factor)}
            series={[{ label: 'Demand (MT)', color: COLORS.green }]}
            data={PHASES.map((p) => ({ label: <><b>{p.label}</b><br /><span className="muted">{p.stage}</span></>, values: [p.mt * factor], labels: [`${fmt(p.mt * factor, 0)} MT (${p.pct}%)`] }))}
          />
          <div className="s5-stage-acts">
            <div><strong>Key Activities</strong></div>
            <div><Sprout size={14} />Demos (12 plots)</div>
            <div><Store size={14} />Retailer Activation</div>
            <div><Users size={14} />Farmer Meetings</div>
            <div><MessageSquare size={14} />Follow-ups & Conversion</div>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.25fr 1.15fr 1.1fr">
        <div className="stack">
          <Panel title={<>Village / Cluster Demand Distribution <span className="muted small">(Total: {fmt(result.demand, 0)} MT)</span></>} icon={<Users size={15} />} data={villages}>
            <DataTable<VillageRow>
              compact
              columns={[
                { key: 'village', label: 'Village / Cluster' },
                { key: 'farmers', label: 'Target Farmers', align: 'right', render: (r) => int(r.farmers) },
                { key: 'adopters', label: 'Expected Adopters', align: 'right' },
                { key: 'demand', label: 'Estimated Demand (MT)', align: 'right', render: (r) => fmt(r.demand) },
                { key: 'retailer', label: 'Priority Retailer Cluster' },
                { key: 'visibility', label: 'Stock Visibility', render: (r) => <Pill tone={visTone(r.visibility)}>{r.visibility}</Pill> },
                { key: 'arrival', label: 'Req. Arrival' },
              ]}
              rows={villageRows}
              total={{ village: 'Total', farmers: '1,832', adopters: int(result.adopters), demand: fmt(result.demand), retailer: '–', visibility: '–', arrival: '–' }}
            />
          </Panel>
          <Panel title={<>ROI Methodology <span className="muted small">(Base Case)</span></>} icon={<CheckCircle2 size={15} />}>
            <div className="row" style={{ fontSize: 12, gap: 14 }}>
              <strong>Net ROI =</strong>
              <span style={{ textAlign: 'center' }}>Incremental Contribution − Campaign Spend<hr style={{ margin: '3px 0' }} />Campaign Spend</span>
              <span>=</span>
              <span style={{ textAlign: 'center' }}>₹13.7 L − ₹8.0 L<hr style={{ margin: '3px 0' }} />₹8.0 L</span>
              <span>=</span>
              <strong style={{ fontSize: 16, color: COLORS.dark }}>0.71×</strong>
            </div>
          </Panel>
        </div>

        <Panel title="Demand-to-Supply Planning Bridge" icon={<Layers size={15} />}>
          <div className="s5-bridge">
            {[
              { icon: <BarChart3 size={22} />, t: 'Conversion Forecast', s: `(${int(result.adopters)} adopters)` },
              { icon: <Package size={22} />, t: 'Product Demand', s: `(${fmt(result.demand, 0)} MT)` },
              { icon: <Boxes size={22} />, t: 'Pack Requirements', s: `(${int(totalBags)} bags)` },
              { icon: <Store size={22} />, t: 'Retailer Allocation', s: '(74 retailers)' },
              { icon: <Truck size={22} />, t: 'Dispatch', s: "(Dec '26 – Mar '27)" },
            ].map((step, i) => (
              <div key={step.t} style={{ display: 'contents' }}>
                {i > 0 && <ArrowRight size={14} className="s5-bridge-arrow" />}
                <div className="s5-bridge-step">{step.icon}<strong>{step.t}</strong>{step.s}</div>
              </div>
            ))}
          </div>
          <DataTable
            compact
            columns={[
              { key: 'view', label: 'Demand & Supply View' },
              { key: 'qty', label: 'Quantity (MT)', align: 'right' },
              { key: 'pct', label: '% of Demand', align: 'right' },
              { key: 'status', label: 'Status' },
            ]}
            rows={[
              { view: 'Projected campaign demand', qty: fmt(result.demand), pct: '100%', status: '' },
              { view: 'Available stock (ERP, Ambad)', qty: '138.0', pct: `${Math.round((138 / result.demand) * 100)}%`, status: <Check status="done">Available</Check> },
              { view: 'In-transit inventory', qty: '28.0', pct: `${Math.round((28 / result.demand) * 100)}%`, status: <Check status="done">On Schedule</Check> },
              { view: 'Total available (stock + in-transit)', qty: '166.0', pct: `${Math.round((166 / result.demand) * 100)}%`, status: '' },
              { view: <strong>Estimated supply gap</strong>, qty: <strong>{fmt(gap)}</strong>, pct: `${Math.round((gap / result.demand) * 100)}%`, status: gap > 0 ? <Pill tone="red">To be planned</Pill> : <Pill tone="green">Covered</Pill> },
            ]}
          />
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <Btn variant="primary" icon={<Truck size={14} />} to="s5.2">Validate Stock Availability</Btn>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="AI Demand Planning Insights" icon={<Sparkles size={15} />} className="ai-panel">
            <AiItem icon={<Target size={15} />} title="Demand concentration in priority clusters"
              action={<Btn small onClick={() => toast('Cluster allocation opened for review — Ambad HQ & Wadi Gaon prioritised')}>Review Allocation</Btn>}>
              ~56% ({fmt(117 * factor, 0)} MT) demand is from Ambad HQ and Wadi Gaon. Validate retailer allocation and pre-position stock.
            </AiItem>
            <AiItem icon={<Package size={15} />} title="Optimize pack mix and coverage"
              action={<Btn small onClick={() => toast('Pack mix sent for validation against approved SKU master')}>Validate Pack Mix</Btn>}>
              Current pack mix is 51% (50 kg), 32% (25 kg), 17% (10 kg). Confirm against approved SKUs and retailer stocking patterns.
            </AiItem>
            <AiItem icon={<BarChart3 size={15} />} title="Forecast sensitivity & risk"
              action={<Btn small to="s4.4">Compare Scenarios</Btn>}>
              Demand varies between 176–248 MT (±17%) based on adoption and programme quantity. Review before final dispatch.
            </AiItem>
          </Panel>
          <Panel title="Readiness & Compliance Checks" icon={<ShieldCheck size={15} />}>
            <Grid cols="repeat(4, 1fr)" gap={6}>
              <Check status="done">Product Ready</Check>
              <Check status="done">Retailer Plan Ready</Check>
              <Check status="done">Field Capacity Ready</Check>
              <Check status="warn">Content & Compliance Pending</Check>
            </Grid>
          </Panel>
        </div>
      </Grid>

      <div className="s5-action-bar">
        <div className="row">
          <Btn icon={<Save size={14} />} onClick={() => { setStatus('draft'); toast('Demand projection saved as draft'); }}>Save Draft</Btn>
          <Btn icon={<MessageSquare size={14} />} onClick={() => { setStatus('changes'); toast('Change request sent to Campaign Strategy Studio (S4.5)'); }}>Request Changes</Btn>
          <Btn variant="primary" icon={<Send size={14} />} disabled={status === 'submitted'} onClick={() => { setStatus('submitted'); toast(`Demand projection (${fmt(result.demand, 0)} MT) submitted for approval`); }}>
            {status === 'submitted' ? 'Submitted for Approval' : 'Submit for Approval'}
          </Btn>
          {status === 'changes' && <Pill tone="amber">Changes requested</Pill>}
        </div>
        <div className="row">
          <span className="muted small"><Lightbulb size={13} /> Recommended Next:</span>
          <Btn variant="dark" to="s5.2" icon={<ArrowRight size={14} />}>Check Stock Readiness — S5.2 Stock Readiness Dashboard</Btn>
        </div>
      </div>

      <FlowFooter steps={[
        { label: 'S2.5 Campaign Recommendations', to: 's2.5' },
        { label: 'S4.2 Campaign Creation Wizard', to: 's4.2' },
        { label: 'S4.3 Activity Planner', to: 's4.3' },
        { label: 'S4.4 Scenario Simulator', to: 's4.4' },
        { label: 'S4.5 Approval & Review', to: 's4.5' },
        { label: 'S5.1 Campaign Demand Projection (Current)', current: true },
      ]} next={{ label: 'Check Stock Readiness', to: 's5.2', sub: ' → S5.2' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S5.2 Stock Readiness & Supply Gap Intelligence                      */
/* ------------------------------------------------------------------ */

function Waterfall() {
  const [ref, width] = useWidth<HTMLDivElement>(420);
  // Real-pixel width keeps the 3-line bar labels readable on phones (they shrank to ~7 px before).
  const W = clamp(width, 300, 900), H = 236, top = 12, bottom = 196, left = 30;
  const y = (v: number) => bottom - (v / 250) * (bottom - top);
  const bars = [
    { label: ['Required', 'Demand', '(Projected)'], from: 0, to: 209, text: '209', color: COLORS.dark },
    { label: ['ERP Stock', '(Available,', 'Confirmed)'], from: 71, to: 209, text: '−138', color: COLORS.mid },
    { label: ['In Transit', '(Pending', 'Arrival)'], from: 43, to: 71, text: '+28', color: COLORS.light },
    { label: ['Time', 'Adjustment', '(Lead-time)'], from: 43, to: 43, text: '0', color: '#c9cfc6' },
    { label: ['Total', 'Usable', 'Supply'], from: 0, to: 166, text: '166', color: COLORS.green },
    { label: ['Remaining', 'Gap', '(Shortfall)'], from: 166, to: 209, text: '−43', color: COLORS.yellow },
  ];
  const slot = (W - left) / bars.length;
  return (
    <div ref={ref} className="s5-wf-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Demand vs supply waterfall">
      {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250].map((t) => (
        <g key={t}>
          <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke="#eef2ea" />
          <text x={left - 4} y={y(t) + 3} textAnchor="end" className="s5-wf-axis">{t}</text>
        </g>
      ))}
      {bars.map((b, i) => {
        const x = left + i * slot + slot * 0.18;
        const w = slot * 0.64;
        const h = Math.max(y(b.from) - y(b.to), 0);
        return (
          <g key={i} className="s5-wf-bar" data-tip={`${b.label.join(' ')}: ${b.text} MT`}>
            <rect x={left + i * slot} y={top} width={slot} height={bottom - top} fill="transparent" />
            {h > 0
              ? <rect className="s1-grow" style={{ animationDelay: `${i * 90}ms` }} x={x} y={y(b.to)} width={w} height={h} fill={b.color} rx={2} />
              : <line x1={x} x2={x + w} y1={y(b.to)} y2={y(b.to)} stroke="#8a978c" strokeDasharray="4 3" strokeWidth={1.5} />}
            {i < bars.length - 1 && <line x1={x + w} x2={x + slot} y1={y(i === 0 ? 209 : i === 4 ? 166 : b.from)} y2={y(i === 0 ? 209 : i === 4 ? 166 : b.from)} stroke="#b5bfb2" strokeDasharray="2 2" />}
            <text x={x + w / 2} y={h > 24 && i !== 0 && i !== 4 ? y(b.to) + h / 2 + 4 : y(b.to) - 5} textAnchor="middle" className="s5-wf-val">{b.text}</text>
            {b.label.map((l, k) => <text key={k} x={x + w / 2} y={bottom + 11 + k * 10} textAnchor="middle" className="s5-wf-label">{l}</text>)}
          </g>
        );
      })}
      <text x={8} y={(top + bottom) / 2} transform={`rotate(-90 8 ${(top + bottom) / 2})`} textAnchor="middle" className="s5-wf-axis">Quantity (MT)</text>
    </svg>
    </div>
  );
}

type StockRow = { sku: string; demand: number; bags: number; erp: number; transit: number; avail: number; cov: number; gap: number; conf: string; by: string; action: string };
const STOCK_ROWS: StockRow[] = [
  { sku: 'Croptek – 50 kg', demand: 52.0, bags: 1040, erp: 36.0, transit: 8.0, avail: 44.0, cov: 85, gap: 8.0, conf: 'ERP-confirmed', by: "10 Jan '27", action: 'Plan Replenishment' },
  { sku: 'Croptek – 25 kg', demand: 41.8, bags: 1672, erp: 28.0, transit: 6.0, avail: 34.0, cov: 81, gap: 7.8, conf: 'Reported', by: "12 Jan '27", action: 'Raise Dispatch' },
  { sku: 'Croptek – 20 kg', demand: 62.7, bags: 3135, erp: 40.0, transit: 10.0, avail: 50.0, cov: 80, gap: 12.7, conf: 'Estimated', by: "16 Jan '27", action: 'Validate Stock' },
  { sku: 'Croptek – 10 kg', demand: 52.5, bags: 5250, erp: 34.0, transit: 4.0, avail: 38.0, cov: 72, gap: 14.5, conf: 'Estimated', by: "20 Jan '27", action: 'Raise Dispatch' },
];
const ACTIONS = ['Plan Replenishment', 'Raise Dispatch', 'Validate Stock', 'Request Reallocation', 'No Action'];
const srcTone = (c: string): Tone => (c === 'ERP-confirmed' ? 'green' : c === 'Reported' ? 'amber' : c === 'Estimated' ? 'lime' : 'red');

type HeatRow = { village: string; demand: number; supply: number; cov: number; gap: number; retailers: number; vis: string; risk: string };
const HEAT_ROWS: HeatRow[] = [
  { village: 'Wadi Gaon', demand: 36.0, supply: 31.0, cov: 86, gap: 5.0, retailers: 12, vis: 'High', risk: 'Medium' },
  { village: 'Dhanora', demand: 34.0, supply: 20.0, cov: 59, gap: 14.0, retailers: 10, vis: 'Medium', risk: 'High' },
  { village: 'Ambad HQ', demand: 38.0, supply: 31.0, cov: 82, gap: 7.0, retailers: 14, vis: 'High', risk: 'Medium' },
  { village: 'Pimpalgaon', demand: 27.0, supply: 18.0, cov: 67, gap: 9.0, retailers: 8, vis: 'Medium', risk: 'High' },
  { village: 'Other Villages', demand: 74.0, supply: 66.0, cov: 89, gap: 8.0, retailers: 26, vis: 'Medium', risk: 'Medium' },
];
const covCls = (c: number) => (c >= 85 ? 's5-c-good' : c >= 75 ? 's5-c-ok' : c >= 65 ? 's5-c-warn' : 's5-c-bad');
const gapCls = (g: number) => (g >= 12 ? 's5-c-bad' : g >= 8.5 ? 's5-c-warn' : g >= 6 ? 's5-c-ok' : 's5-c-good');
const levelCls = (v: string, invert = false) => {
  const good = invert ? v === 'Low' : v === 'High';
  const bad = invert ? v === 'High' : v === 'Low';
  return good ? 's5-c-good' : bad ? 's5-c-bad' : 's5-c-warn';
};

const TIMELINE = [
  { stage: 'Vegetative', window: "Dec '26 (15–31 Dec)", win: [14, 25], bars: [{ text: '8 MT (15–20 Dec)', l: 14, w: 9, late: false }] },
  { stage: 'Bulb Development', window: "Jan '27 (1–31 Jan)", win: [25, 50], bars: [{ text: '12 MT (5–12 Jan)', l: 28, w: 12, late: false }, { text: '8 MT (20–26 Jan) ⚠', l: 41, w: 15, late: true }] },
  { stage: 'Bulb Enlargement', window: "Feb '27 (1–28 Feb)", win: [50, 75], bars: [{ text: '8 MT (5–10 Feb)', l: 54, w: 12, late: false }] },
  { stage: 'Maturity', window: "Mar '27 (1–15 Mar)", win: [75, 88], bars: [] },
];

export function StockReadiness() {
  const { toast } = useNav();
  const heat = useDataset('readiness.stock_heatmap', HEAT_ROWS);
  const [actions, setActions] = useState<string[]>(STOCK_ROWS.map((r) => r.action));
  const [done, setDone] = useState<Record<number, boolean>>({});

  const recs = [
    { text: <><strong>Reallocate ~14 MT</strong> from lower-priority clusters (e.g., Wadi Gaon: 5 MT, Other Villages: 9 MT) to Dhanora (14 MT gap) and Pimpalgaon (9 MT gap).</>, btn: 'Request Reallocation', icon: <ArrowRightLeft size={13} />, msg: 'Reallocation request (14 MT) raised to Regional Sales' },
    { text: <><strong>Expedite dispatch of 10 MT</strong> (Croptek – 20 kg) and 6 MT (Croptek – 10 kg) to close ₹9.6 Lakh (~22.3 MT) of shortfall before 16 Jan '27.</>, btn: 'Raise Dispatch Request', icon: <Truck size={13} />, msg: 'Dispatch request for 16 MT raised to Supply Chain' },
    { text: <><strong>Validate low-confidence retailer inventory</strong> (~24 MT across Dhanora and Pimpalgaon) to firm up supply and reduce estimation risk.</>, btn: 'Validate Retailer Stock', icon: <Search size={13} />, msg: 'Retailer stock validation assigned to field officers' },
    { text: <><strong>Prioritize Dhanora and Pimpalgaon</strong> for immediate replenishment as their purchase windows (Jan–Feb) are nearest and shortfall is highest (total 23 MT).</>, btn: 'View Shortfall Details', icon: <Eye size={13} />, msg: 'Shortfall details: Dhanora 14 MT, Pimpalgaon 9 MT — review in S5.3' },
  ];

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S4.5 Approved Campaign', to: 's4.5' },
        { label: 'S5.1 Campaign Demand Projection', to: 's5.1' },
        { label: 'S5.2 Campaign Stock Readiness & Supply Gap Intelligence' },
      ]} />
      <PageHeader
        back="s5.1"
        title="S5.2 — Campaign Stock Readiness & Supply Gap Intelligence"
        subtitle="Validate stock availability, quantify supply gap, assess timing risks and recommend replenishment actions for the approved campaign."
      />
      <SourceBar right={<Pill tone="green"><CheckCircle2 size={12} /> Approved — Stock Validation in Progress</Pill>}>
        Opened from <strong>S5.1 Campaign Demand Projection</strong> by clicking <strong>Check Stock Readiness</strong>.
      </SourceBar>
      <ContextStrip items={[
        CAMPAIGN_ITEM,
        { icon: <Users size={22} />, label: 'Target Farmers', value: '1,832', sub: '(Confirmed, from S5.1)' },
        { icon: <CalendarDays size={22} />, label: 'Campaign Period', value: '15 Dec 2026 – 15 Mar 2027' },
        { icon: <Coins size={22} />, label: 'Projected Demand', value: '209 MT', sub: '(From S5.1)' },
        { icon: <Warehouse size={22} />, label: 'Reported Available', value: '138 MT' },
        { icon: <Truck size={22} />, label: 'In-transit', value: '28 MT' },
      ]} />
      <KpiRow>
        <Kpi icon={<Package size={20} />} label="Projected Demand" value="209 MT" />
        <Kpi icon={<Warehouse size={20} />} label="ERP-confirmed Available" value="138 MT" sub="ERP-confirmed" />
        <Kpi icon={<Truck size={20} />} label="In-transit" value="28 MT" sub="Reported (Pending Arrival)" />
        <Kpi icon={<Boxes size={20} />} label="Total Potential Supply" value="166 MT" sub="(138 + 28)" />
        <Kpi icon={<AlertTriangle size={20} />} label="Preliminary Gap" value="43 MT" tone="amber" />
        <Kpi icon={<BarChart3 size={20} />} label="Coverage" value="79%" sub="(166 / 209)" />
        <Kpi icon={<Clock size={20} />} label="Time-adjusted Availability" value="166 MT" sub="Time-adjusted (0 MT deduction)" />
      </KpiRow>

      <Grid cols="1.1fr 1.3fr">
        <Panel title="Demand vs Supply Waterfall (MT)" icon={<BarChart3 size={15} />} info>
          <div className="s5-waterfall">
            <div>
              <Waterfall />
              <div className="s5-legend">
                <span><i style={{ background: COLORS.dark }} />Confirmed Supply</span>
                <span><i style={{ background: COLORS.light }} />Pending Arrival</span>
                <span><i style={{ background: '#c9cfc6' }} />Adjustment</span>
                <span><i style={{ background: COLORS.yellow }} />Gap / Shortfall</span>
              </div>
            </div>
            <div className="highlight-box">
              <strong className="small">Waterfall Summary</strong>
              <dl className="kv" style={{ marginTop: 8 }}>
                <dt>Required Demand</dt><dd>209 MT</dd>
                <dt>ERP Stock (Confirmed)</dt><dd>138 MT</dd>
                <dt>In Transit (Pending)</dt><dd>28 MT</dd>
                <dt>Time Adjustment</dt><dd>0 MT</dd>
                <dt><strong>Total Usable Supply</strong></dt><dd>166 MT</dd>
                <dt><strong>Remaining Gap</strong></dt><dd style={{ color: COLORS.red }}>43 MT</dd>
                <dt>Coverage</dt><dd>79%</dd>
              </dl>
            </div>
          </div>
        </Panel>
        <Panel title="SKU / Pack Stock Readiness" icon={<Layers size={15} />} info>
          <DataTable<StockRow>
            compact
            columns={[
              { key: 'sku', label: 'SKU / Pack (Croptek)' },
              { key: 'demand', label: 'Proj. Demand (MT)', align: 'right', render: (r) => fmt(r.demand) },
              { key: 'bags', label: 'Required Bags', align: 'right', render: (r) => int(r.bags) },
              { key: 'erp', label: 'ERP Stock (MT)', align: 'right', render: (r) => fmt(r.erp) },
              { key: 'transit', label: 'In Transit (MT)', align: 'right', render: (r) => fmt(r.transit) },
              { key: 'avail', label: 'Time-adj. Available (MT)', align: 'right', render: (r) => fmt(r.avail) },
              { key: 'cov', label: 'Coverage (%)', align: 'right', render: (r) => `${r.cov}%` },
              { key: 'gap', label: 'Gap (MT)', align: 'right', render: (r) => fmt(r.gap) },
              { key: 'conf', label: 'Confidence', render: (r) => <Pill tone={srcTone(r.conf)}>{r.conf}</Pill> },
              { key: 'by', label: 'Required-by Date' },
              {
                key: 'action', label: 'Action', render: (_r, i) => (
                  <select className="s5-select" value={actions[i]} onChange={(e) => {
                    const v = e.target.value;
                    setActions((a) => a.map((x, k) => (k === i ? v : x)));
                    toast(`${STOCK_ROWS[i].sku}: action set to "${v}"`);
                  }}>
                    {ACTIONS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                ),
              },
            ]}
            rows={STOCK_ROWS}
            total={{ sku: 'Total', demand: '209.0', bags: '11,097', erp: '138.0', transit: '28.0', avail: '166.0', cov: '79%', gap: '43.0' }}
          />
          <Note>ⓘ Time adjustment: 0 MT — All in-transit stock (28 MT) is expected to arrive within the purchase window (by 10 Jan '27).</Note>
        </Panel>
      </Grid>

      <Grid cols="1.2fr 1fr 0.8fr">
        <Panel title="Village / Cluster Stock Gap Heatmap" icon={<MapPin size={15} />} data={heat}>
          <DataTable<HeatRow>
            compact
            columns={[
              { key: 'village', label: 'Village / Cluster' },
              { key: 'demand', label: 'Cluster Demand (MT)', align: 'right', render: (r) => fmt(r.demand) },
              { key: 'supply', label: 'Available Supply (MT)', align: 'right', render: (r) => fmt(r.supply) },
              { key: 'cov', label: 'Coverage (%)', align: 'center', render: (r) => <span className={`s5-cell ${covCls(r.cov)}`}>{r.cov}%</span> },
              { key: 'gap', label: 'Gap (MT)', align: 'center', render: (r) => <span className={`s5-cell ${gapCls(r.gap)}`}>{fmt(r.gap)}</span> },
              { key: 'retailers', label: 'Retailer Cluster (Count)', align: 'right' },
              { key: 'vis', label: 'Stock Visibility', align: 'center', render: (r) => <span className={`s5-cell ${levelCls(r.vis)}`}>{r.vis}</span> },
              { key: 'risk', label: 'Risk', align: 'center', render: (r) => <span className={`s5-cell ${levelCls(r.risk, true)}`}>{r.risk}</span> },
            ]}
            rows={heat.rows}
            total={{ village: 'Total', demand: '209.0', supply: '166.0', cov: '79%', gap: '43.0', retailers: '70', vis: '—', risk: '—' }}
          />
        </Panel>
        <Panel title="Stock Arrival vs Crop-stage Purchase Timeline" icon={<CalendarDays size={15} />}>
          <div className="s5-legend" style={{ marginTop: 0, marginBottom: 8 }}>
            <span><i style={{ background: COLORS.green }} />On-time</span>
            <span><i style={{ background: COLORS.yellow }} />Late</span>
            <span><i style={{ background: '#e6f2dc' }} />Within Window</span>
          </div>
          <div className="s5-timeline">
            <div className="s5-tl-head">
              <span>Crop Stage (Onion)</span><span>Purchase Window (Target)</span>
              <div className="s5-tl-months"><span>Dec '26</span><span>Jan '27</span><span>Feb '27</span><span>Mar '27</span></div>
            </div>
            {TIMELINE.map((t) => (
              <div className="s5-tl-row" key={t.stage}>
                <strong>{t.stage}</strong>
                <span className="muted">{t.window}</span>
                <div className="s5-tl-track">
                  <div className="s5-tl-window" style={{ left: `${t.win[0]}%`, width: `${t.win[1] - t.win[0]}%` }} />
                  {t.bars.map((b) => (
                    <div key={b.text} className={`s5-tl-bar ${b.late ? 'late' : 'ontime'}`} style={{ left: `${b.l}%`, width: `${b.w}%`, minWidth: 'fit-content' }}>{b.text}</div>
                  ))}
                  {!t.bars.length && <span className="muted" style={{ position: 'absolute', left: '80%', top: 7 }}>—</span>}
                </div>
              </div>
            ))}
          </div>
          <Note>8 MT (20–26 Jan) arrives after the Bulb Development peak — flagged late.</Note>
        </Panel>
        <Panel title={<>Exposed Business Impact <span className="muted small">(Illustrative)</span></>} icon={<Coins size={15} />}>
          <div className="s5-impact">
            <Users size={28} color={COLORS.green} />
            <div><span className="small muted">Expected Adopters at Risk</span><strong>~378 farmers</strong><span className="small muted">(≈ 43 MT gap ÷ 0.114 MT/farmer)</span></div>
            <div className="s5-impact-pct">−21%<small>of 1,832 target</small></div>
          </div>
          <div className="s5-impact">
            <BarChart3 size={28} color={COLORS.green} />
            <div><span className="small muted">Revenue at Risk (Projected)</span><strong>₹20.6 Lakh</strong><span className="small muted">(43 MT × ₹47,900 / MT, est. campaign price)</span></div>
            <div className="s5-impact-pct">−21%<small>of ₹98.7 Lakh projected revenue</small></div>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.2fr 1fr">
        <Panel title="AI Replenishment Recommendations" icon={<Sparkles size={15} />} info className="ai-panel">
          {recs.map((r, i) => (
            <div className="s5-rec" key={r.btn}>
              <span className="num-badge">{i + 1}</span>
              <span>{r.text}</span>
              <Btn small icon={done[i] ? <CheckCircle2 size={13} /> : r.icon} onClick={() => { setDone((d) => ({ ...d, [i]: true })); toast(r.msg); }}>
                {done[i] && i < 3 ? `${r.btn.split(' ')[0]} Raised` : r.btn}
              </Btn>
            </div>
          ))}
        </Panel>
        <Panel title="Stock Source Confidence — Legend & Scorecard" icon={<ShieldCheck size={15} />} info>
          <DataTable
            compact
            columns={[
              { key: 'src', label: 'Stock Source' },
              { key: 'def', label: 'Definition & Data Source' },
              { key: 'use', label: 'Usage in S5.2' },
              { key: 'conf', label: 'Confidence' },
            ]}
            rows={[
              { src: <span className="row"><Warehouse size={13} /><strong>ERP-confirmed</strong></span>, def: 'Stock recorded in SAP/ERP (DC/WH).', use: 'Primary available stock (138 MT).', conf: <Pill tone="green">High (≥90%)</Pill> },
              { src: <span className="row"><Truck size={13} /><strong>Reported</strong></span>, def: 'Distributor / dealer reported stock (not yet ERP-updated).', use: 'In-transit and pipeline (28 MT).', conf: <Pill tone="amber">Medium (70–89%)</Pill> },
              { src: <span className="row"><Boxes size={13} /><strong>Estimated</strong></span>, def: 'Calculated/assumed stock (e.g., based on recent off-take, days of supply).', use: 'Not used in total supply; flagged for validation.', conf: <Pill tone="red">Low (50–69%)</Pill> },
              { src: <span className="row"><Clock size={13} /><strong>Time-adjusted</strong></span>, def: 'Supply adjusted for lead-time and expected arrival within purchase window.', use: '0 MT deduction (all 28 MT arrives within window).', conf: <Pill tone="green">High (≥90%)</Pill> },
            ]}
          />
        </Panel>
      </Grid>

      <FlowFooter steps={[
        { label: 'S4.5 Approved Campaign', to: 's4.5' },
        { label: 'S5.1 Campaign Demand Projection', to: 's5.1' },
        { label: 'S5.2 Campaign Stock Readiness & Supply Gap Intelligence (Current)', current: true },
      ]} next={{ label: 'Review Dealer & Retailer Readiness', to: 's5.3', sub: ' → S5.3' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S5.3 Dealer & Retailer Readiness Intelligence                       */
/* ------------------------------------------------------------------ */

type DealerRow = {
  name: string; village: string; mapped: number; stock: string; demand: number; gap: number; influence: string;
  licence: string; training: string; data: string; owner: string; deadline: string; action: string;
};
const DEALERS: DealerRow[] = [
  { name: 'Shree Agri Seva', village: 'Ambad HQ', mapped: 6, stock: '6.5 MT (Estimated)', demand: 8.0, gap: 1.5, influence: 'High', licence: 'Compliant', training: 'Completed', data: 'ERP-confirmed', owner: 'TM – R. Patil', deadline: "20 Jan '27", action: 'Activate & confirm sales plan' },
  { name: 'Dhanora Agro Mart', village: 'Dhanora', mapped: 5, stock: '2.8 MT (Unverified)', demand: 9.0, gap: 6.2, influence: 'High', licence: 'Compliant', training: 'Not Started', data: 'Reported', owner: 'FO – S. Jadhav', deadline: "12 Jan '27", action: 'Assign activation & raise dispatch' },
  { name: 'Ambad Krushi Centre', village: 'Ambad HQ', mapped: 8, stock: '8.0 MT (Estimated)', demand: 10.0, gap: 2.0, influence: 'Medium', licence: 'Compliant', training: 'Completed', data: 'ERP-confirmed', owner: 'TM – R. Patil', deadline: "20 Jan '27", action: 'Confirm stock & drive conversion' },
  { name: 'Pimpalgaon Agri Stores', village: 'Pimpalgaon', mapped: 4, stock: '3.0 MT (Unverified)', demand: 6.5, gap: 3.5, influence: 'High', licence: 'Compliant', training: 'In Progress', data: 'Unverified', owner: 'FO – A. More', deadline: "12 Jan '27", action: 'Validate inventory & replenish' },
  { name: 'Wadi Gaon Kisan Point', village: 'Wadi Gaon', mapped: 7, stock: '5.5 MT (Estimated)', demand: 6.0, gap: 0.5, influence: 'Medium', licence: 'Compliant', training: 'Completed', data: 'Estimated', owner: 'FO – P. Kale', deadline: "22 Jan '27", action: 'Maintain stock & execute activation' },
  { name: 'Maharashtra Agri Traders', village: 'Other Villages', mapped: 10, stock: '14.0 MT (Estimated)', demand: 16.0, gap: 2.0, influence: 'High', licence: 'Compliant', training: 'Completed', data: 'Reported', owner: 'TM – M. Deshmukh', deadline: "24 Jan '27", action: 'Drive broader retailer activation' },
  { name: 'Kisan Seva Depot', village: 'Other Villages', mapped: 8, stock: '11.0 MT (Unverified)', demand: 14.0, gap: 3.0, influence: 'Medium', licence: 'Compliant', training: 'In Progress', data: 'Unverified', owner: 'FO – N. Gaikwad', deadline: "24 Jan '27", action: 'Validate & raise stock transfer' },
];
const trainTone = (t: string): Tone => (t === 'Completed' ? 'green' : t === 'In Progress' ? 'amber' : 'red');
const dataTone = (d: string): Tone => (d === 'ERP-confirmed' ? 'green' : d === 'Reported' ? 'blue' : d === 'Estimated' ? 'amber' : 'red');

type ClusterRow = { village: string; demand: number; supply: number; gap: number; retailers: number; status: string };
const CLUSTERS: ClusterRow[] = [
  { village: 'Wadi Gaon', demand: 36, supply: 31, gap: 5, retailers: 12, status: 'Ready' },
  { village: 'Dhanora', demand: 34, supply: 20, gap: 14, retailers: 11, status: 'High Risk' },
  { village: 'Ambad HQ', demand: 38, supply: 31, gap: 7, retailers: 14, status: 'Moderate' },
  { village: 'Pimpalgaon', demand: 27, supply: 18, gap: 9, retailers: 9, status: 'High Risk' },
  { village: 'Other Villages', demand: 74, supply: 66, gap: 8, retailers: 28, status: 'Moderate' },
];
const statusTone = (s: string): Tone => (s === 'Ready' ? 'green' : s === 'High Risk' ? 'red' : 'amber');

const CALLOUTS: { village: string; text: string; state: 'stocked' | 'partial' | 'under'; label: string }[] = [
  { village: 'Wadi Gaon', text: '36 / 31 MT', state: 'stocked', label: '(Stocked)' },
  { village: 'Ambad HQ', text: '38 / 31 MT', state: 'partial', label: '(Partially Stocked)' },
  { village: 'Pimpalgaon', text: '27 / 18 MT', state: 'under', label: '(Under-Covered)' },
  { village: 'Dhanora', text: '34 / 20 MT', state: 'under', label: '(Under-Covered)' },
  { village: 'Other Villages', text: '74 / 66 MT', state: 'partial', label: '(Partially Stocked)' },
];
/** Cluster names -> verified place ids (src/map/places.json). "Other Villages" is an aggregate, not a place. */
const CLUSTER_PLACE: Record<string, string> = { 'Wadi Gaon': 'v-wadigaon', 'Ambad HQ': 'v-ambad', Pimpalgaon: 'v-pimpalgaon', Dhanora: 'v-dhanora' };
const STOCK_COLOR = { stocked: COLORS.green, partial: COLORS.yellow, under: COLORS.red } as const;

const QUADS = [
  { cls: 's5-q-urgent', title: 'Urgent Replenishment', sub: '(High Influence, Low Stock)', color: COLORS.red, names: ['Dhanora Agro Mart', 'Pimpalgaon Agri Stores'] },
  { cls: 's5-q-ready', title: 'Ready to Activate', sub: '(High Influence, High Stock)', color: COLORS.green, names: ['Shree Agri Seva', 'Maharashtra Agri Traders'] },
  { cls: 's5-q-select', title: 'Selective Support', sub: '(Low Influence, Low Stock)', color: COLORS.amber, names: ['Wadi Gaon Kisan Point'] },
  { cls: 's5-q-dev', title: 'Retailer Development', sub: '(Low Influence, High Stock)', color: COLORS.mid, names: ['Ambad Krushi Centre', 'Kisan Seva Depot'] },
];

export function DealerReadiness() {
  const { toast } = useNav();
  const dealers = useDataset('readiness.dealers', DEALERS);
  const clusters = useDataset('readiness.cluster_supply', CLUSTERS);
  const [selected, setSelected] = useState(1);
  const [showDetail, setShowDetail] = useState(false);
  const [cluster, setCluster] = useState<string | undefined>(undefined);
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const dealer = dealers.rows[selected] ?? dealers.rows[0];

  const act = (verb: string, msg: string) => {
    setAssigned((a) => ({ ...a, [dealer.name]: verb }));
    toast(`${dealer.name}: ${msg}`);
  };
  const selectName = (name: string) => {
    const i = dealers.rows.findIndex((d) => d.name === name);
    if (i >= 0) { setSelected(i); setShowDetail(true); }
  };
  const pickCluster = (v: string) => setCluster((c) => (c === v ? undefined : v));

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S4.5 Approved Campaign', to: 's4.5' },
        { label: 'S5.1 Campaign Demand Projection', to: 's5.1' },
        { label: 'S5.2 Campaign Stock Readiness & Supply Gap Intelligence', to: 's5.2' },
        { label: 'S5.3 Dealer & Retailer Readiness Intelligence' },
      ]} />
      <PageHeader
        back="s5.2"
        title="S5.3 — Dealer & Retailer Readiness Intelligence"
        subtitle="Validates channel readiness, stocking, compliance, and activation for the approved campaign."
      />
      <SourceBar>Opened from <strong>S5.2</strong> by clicking <strong>Review Dealer & Retailer Readiness</strong>.</SourceBar>
      <ContextStrip items={[
        { ...CAMPAIGN_ITEM, sub: 'Ambad, Jalna' },
        { icon: <Package size={20} />, label: 'Projected Demand', value: '209 MT' },
        { icon: <Boxes size={20} />, label: 'Potential Supply', value: '166 MT' },
        { icon: <AlertTriangle size={20} />, label: 'Gap', value: '43 MT', tone: 'amber' },
        { icon: <Store size={20} />, label: 'Active Retailers', value: '74' },
        { icon: <Building2 size={20} />, label: 'Stocking Croptek', value: '46' },
        { icon: <Users size={20} />, label: 'High-Influence Retailers', value: '18' },
      ]} />
      <KpiRow>
        <Kpi compact icon={<Store size={18} />} label="Active Retailers" value="74" sub="— mapped for campaign" trend="up" />
        <Kpi compact icon={<Boxes size={18} />} label="Croptek Stocking Retailers" value="46" sub="62% of active retailers" trend="up" />
        <Kpi compact icon={<Users size={18} />} label="High-Influence Retailers" value="18" sub="24% of active retailers" trend="up" />
        <Kpi compact icon={<Package size={18} />} label="Projected Demand" value="209 MT" sub="same as S5.2" trend="up" />
        <Kpi compact icon={<Boxes size={18} />} label="Potential Supply" value="166 MT" sub="same as S5.2" trend="up" />
        <Kpi compact icon={<AlertTriangle size={18} />} label="Channel Gap" value="43 MT" tone="amber" />
        <Kpi compact icon={<BarChart3 size={18} />} label="Channel Readiness Score" value="72%" sub="(53 / 74 retailers ready)" />
        <Kpi compact icon={<ShieldCheck size={18} />} label="Stock Data Confidence" value={<Pill tone="amber">Medium</Pill>} />
      </KpiRow>

      <Grid cols="1.8fr 0.78fr 1fr">
        <Panel title="Retailer Coverage Map — Ambad & Nearby Villages" icon={<MapPin size={15} />}>
          <div className="s5-map-wrap">
            <div className="s5-map">
              <IndiaDistrictMap
                label="Retailer coverage map, Ambad and nearby villages"
                height={360}
                view="markers"
                talukas={{}}
                selected={cluster ? CLUSTER_PLACE[cluster] : undefined}
                markers={CALLOUTS.filter((c) => CLUSTER_PLACE[c.village]).map((c) => ({
                  id: CLUSTER_PLACE[c.village],
                  label: c.village,
                  color: STOCK_COLOR[c.state],
                  info: <>Demand / supply: <b>{c.text}</b> {c.label}</>,
                  onSelect: () => setCluster(c.village),
                }))}
              />
            </div>
            <div className="s5-status-legend">
              <strong>Cluster Stock Status</strong>
              <div><i style={{ background: COLORS.green }} /><span>Stocked<br /><span className="muted">(≥90% of demand)</span></span></div>
              <div><i style={{ background: COLORS.yellow }} /><span>Partially Stocked<br /><span className="muted">(70–89%)</span></span></div>
              <div><i style={{ background: COLORS.red }} /><span>Under-Covered<br /><span className="muted">(&lt;70%)</span></span></div>
              {CALLOUTS.filter((c) => !CLUSTER_PLACE[c.village]).map((c) => (
                <button key={c.village} type="button" className={`s5-callout-inline ${c.state} ${cluster === c.village ? 'sel' : ''}`} onClick={() => pickCluster(c.village)}>
                  <strong>{c.village}</strong> {c.text} <span className="muted">{c.label}</span>
                </button>
              ))}
              <span className="muted">Markers show demand / supply. Click a village (or its chip under the map) to highlight it.</span>
            </div>
          </div>
        </Panel>
        <Panel title="Retailer Influence vs Stock Readiness Matrix" icon={<BarChart3 size={15} />}>
          <div className="s5-matrix">
            <div className="s5-matrix-y">Retailer Influence (Business Potential) → High</div>
            <div className="s5-matrix-grid">
              {QUADS.map((q) => (
                <div key={q.title} className={`s5-quad ${q.cls}`}>
                  <h4>{q.title}</h4><em>{q.sub}</em>
                  <ul>
                    {q.names.map((n) => (
                      <li key={n} className={dealer.name === n ? 'sel' : ''} onClick={() => selectName(n)}><i style={{ background: q.color }} />{n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="s5-matrix-x"><span>Low</span><span>Stock Readiness (% of Estimated Demand Met)</span><span>High</span></div>
        </Panel>
        <Panel title="Village Cluster Summary — Demand, Supply & Readiness" icon={<ListChecks size={15} />} data={clusters}>
          <DataTable<ClusterRow>
            compact
            columns={[
              { key: 'village', label: 'Village / Cluster' },
              { key: 'demand', label: 'Demand (MT)', align: 'right' },
              { key: 'supply', label: 'Supply (MT)', align: 'right' },
              { key: 'gap', label: 'Gap (MT)', align: 'right' },
              { key: 'retailers', label: 'Retailers (#)', align: 'right' },
              { key: 'status', label: 'Readiness Status', render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={clusters.rows}
            highlight={(r) => r.village === cluster}
            onRowClick={(r) => pickCluster(r.village)}
            total={{ village: 'Total', demand: '209', supply: '166', gap: '43', retailers: '74', status: <Pill tone="amber" solid>Overall: Moderate</Pill> }}
          />
        </Panel>
      </Grid>

      <Panel
        title="Dealer / Retailer Intelligence — Stock, Compliance, Readiness & Actions"
        data={dealers}
        icon={<Store size={15} />}
        info
        actions={<>
          <Btn small icon={<Search size={13} />} onClick={() => setShowDetail((s) => !s)}>View Retailer Details</Btn>
          <Btn small icon={<UserPlus size={13} />} onClick={() => act('Activation assigned', `retailer activation assigned to ${dealer.owner}`)}>Assign Retailer Activation</Btn>
          <Btn small icon={<ClipboardCheck size={13} />} onClick={() => act('Inventory validation', 'inventory validation requested')}>Validate Inventory</Btn>
          <Btn small icon={<Truck size={13} />} onClick={() => act('Transfer requested', `stock transfer of ${fmt(dealer.gap)} MT requested`)}>Request Stock Transfer</Btn>
          <Btn small icon={<AlertTriangle size={13} />} onClick={() => act('Escalated', 'supply gap escalated to Regional Supply Chain')}>Escalate Supply Gap</Btn>
        </>}
      >
        <DataTable<DealerRow>
          compact
          columns={[
            { key: 'name', label: 'Dealer / Retailer Cluster', render: (r) => <strong>{r.name}</strong> },
            { key: 'village', label: 'Village / Cluster' },
            { key: 'mapped', label: 'Retailers Mapped', align: 'right' },
            { key: 'stock', label: 'Current Stock (MT)', render: (r) => <Pill tone={r.stock.includes('Unverified') ? 'red' : 'amber'}>{r.stock}</Pill> },
            { key: 'demand', label: 'Estimated Demand (MT)', align: 'right', render: (r) => fmt(r.demand) },
            { key: 'gap', label: 'Gap (MT)', align: 'right', render: (r) => fmt(r.gap) },
            { key: 'influence', label: 'Influence Level', render: (r) => <Pill tone={r.influence === 'High' ? 'green' : 'amber'}>{r.influence}</Pill> },
            { key: 'licence', label: 'Licence Compliance', render: (r) => <Check status="done">{r.licence}</Check> },
            { key: 'training', label: 'Training Readiness', render: (r) => <Pill tone={trainTone(r.training)}>{r.training}</Pill> },
            { key: 'data', label: 'Data Confidence', render: (r) => <Pill tone={dataTone(r.data)}>{r.data}</Pill> },
            { key: 'owner', label: 'Field Owner' },
            { key: 'deadline', label: 'Deadline' },
            { key: 'action', label: 'Suggested Action', render: (r) => assigned[r.name] ? <Pill tone="blue">✓ {assigned[r.name]}</Pill> : <span className="small">{r.action}</span> },
          ]}
          rows={dealers.rows}
          highlight={(_r, i) => i === selected}
          onRowClick={(_r, i) => setSelected(i)}
        />
        {showDetail && (
          <div className="highlight-box" style={{ marginTop: 10 }}>
            <div className="row-between"><strong><Store size={14} /> {dealer.name} — {dealer.village}</strong><Btn small variant="ghost" onClick={() => setShowDetail(false)}>Close</Btn></div>
            <div className="s5-detail">
              <div><span>Retailers mapped</span>{dealer.mapped}</div>
              <div><span>Current stock</span>{dealer.stock}</div>
              <div><span>Estimated demand / gap</span>{fmt(dealer.demand)} MT / {fmt(dealer.gap)} MT</div>
              <div><span>Stock readiness</span><Progress value={((dealer.demand - dealer.gap) / dealer.demand) * 100} tone={dealer.gap > 3 ? 'red' : 'green'} label={`${Math.round(((dealer.demand - dealer.gap) / dealer.demand) * 100)}%`} /></div>
              <div><span>Influence level</span>{dealer.influence}</div>
              <div><span>Training</span>{dealer.training}</div>
              <div><span>Field owner / deadline</span>{dealer.owner} · {dealer.deadline}</div>
              <div><span>Suggested action</span>{dealer.action}</div>
            </div>
          </div>
        )}
      </Panel>

      <Grid cols="1fr 1fr 1.25fr">
        <Panel title="Dealer Licence Compliance & Campaign Readiness" icon={<ShieldCheck size={15} />}>
          <div className="s5-comp-row muted"><strong>Readiness Parameter</strong><strong>Compliant / Ready</strong><strong>Status</strong></div>
          {[
            ['Dealer Licence (Retail Trade)', 72],
            ['Source Certificate (Croptek)', 70],
            ['PMKSK / Compliance Flag', 74],
            ['Retailer Training Completion', 54],
            ['POS Material Readiness', 59],
            ['Meeting / Demo Support Ready', 52],
          ].map(([label, n]) => {
            const pct = Math.round(((n as number) / 74) * 100);
            return (
              <div className="s5-comp-row" key={label as string}>
                <span>{label}</span><span>{n} / 74</span>
                <Progress value={pct} tone={pct >= 90 ? 'green' : pct >= 75 ? 'lime' : 'amber'} label={`${pct}%`} />
              </div>
            );
          })}
        </Panel>
        <Panel title="Field Ownership & Deadlines" icon={<Users size={15} />}>
          <DataTable
            compact
            columns={[
              { key: 'v', label: 'Village / Cluster' },
              { key: 'o', label: 'Field Owner (TM / FO)' },
              { key: 'f', label: 'Focus' },
              { key: 'd', label: 'Target Date' },
            ]}
            rows={[
              { v: 'Wadi Gaon', o: 'FO – P. Kale', f: 'Stock confirm & activation', d: "22 Jan '27" },
              { v: 'Dhanora', o: 'FO – S. Jadhav', f: 'Replenishment (14 MT gap)', d: "12 Jan '27" },
              { v: 'Ambad HQ', o: 'TM – R. Patil', f: 'Activation & conversion', d: "20 Jan '27" },
              { v: 'Pimpalgaon', o: 'FO – A. More', f: 'Replenishment (9 MT gap)', d: "12 Jan '27" },
              { v: 'Other Villages', o: 'TM – M. Deshmukh', f: 'Stock confirm & coverage', d: "24 Jan '27" },
            ]}
          />
        </Panel>
        <Panel title="AI Channel & Replenishment Recommendations" icon={<Sparkles size={15} />} info className="ai-panel">
          {[
            { t: 'Prioritize Dhanora and Pimpalgaon since they account for 23 MT of the 43 MT gap (53% of total gap).', b: 'Assign Activation', i: <UserPlus size={13} />, m: 'Activation assigned for Dhanora & Pimpalgaon retailers' },
            { t: 'Activate 18 high-influence retailers first to build early demand and faster campaign traction.', b: 'Assign Activation', i: <UserPlus size={13} />, m: 'Activation assigned for 18 high-influence retailers' },
            { t: 'Validate low-confidence stock in Ambad HQ and Pimpalgaon (Estimated/Unverified) before final dispatch.', b: 'Validate Inventory', i: <ClipboardCheck size={13} />, m: 'Inventory validation requested for Ambad HQ & Pimpalgaon' },
            { t: "Align replenishment with crop-stage purchase window (Onion: 10 MT (5–20 Feb)) to ensure availability at peak buying period.", b: 'Raise Dispatch Request', i: <Truck size={13} />, m: 'Dispatch request raised for 5–20 Feb window' },
          ].map((r, k) => (
            <div className="s5-rec" key={k}>
              <span className="num-badge">{k + 1}</span>
              <span>{r.t}</span>
              <Btn small icon={r.i} onClick={() => toast(r.m)}>{r.b}</Btn>
            </div>
          ))}
        </Panel>
      </Grid>

      <div className="warn-box small"><AlertTriangle size={13} /> <strong>Note:</strong> Retailer stock figures are illustrative and unverified until confirmed through field validation or dealer ERP update.</div>

      <FlowFooter label="Source:" steps={[
        { label: 'S5.2 Campaign Stock Readiness & Supply Gap Intelligence', to: 's5.2' },
        { label: 'Current: S5.3 Dealer & Retailer Readiness Intelligence', current: true },
      ]} nextLabel="Recommended Next: S5.4 Supply Risk & Replenishment Planner" next={{ label: 'Create Replenishment Plan', to: 's5.4', sub: ' → S5.4' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S5.4 Supply Risk & Replenishment Planner                            */
/* ------------------------------------------------------------------ */

const SCENARIOS = [
  { id: 'A', name: 'A. Reallocation', desc: 'Transfer stock from low-priority areas', lead: '2–3 days', delivery: '2–3 Days' },
  { id: 'B', name: 'B. Fresh Dispatch', desc: 'Request supply from depot/plant', lead: '5–7 days', delivery: '5–7 Days' },
  { id: 'C', name: 'C. Hybrid Plan', desc: 'Mix of transfer & dispatch', lead: '3–5 days', delivery: '2–5 Days' },
];

export function SupplyRiskPlanner() {
  const { toast, go } = useNav();
  const [scenario, setScenario] = useState('B');
  const [detail, setDetail] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const chosen = SCENARIOS.find((s) => s.id === scenario)!;

  const statusPill = (s: string) => <span style={{ color: s === 'At Risk' || s === 'Critical' ? COLORS.red : s === 'Watch' ? '#b07d00' : COLORS.green, fontWeight: 600 }}>{s}</span>;

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'S5.1 Campaign Demand Projection', to: 's5.1' },
        { label: 'S5.2 Stock Readiness', to: 's5.2' },
        { label: 'S5.3 Dealer & Retailer Readiness', to: 's5.3' },
        { label: 'S5.4 Supply Risk & Replenishment Planner' },
      ]} />
      <PageHeader back="s5.3" title="Supply Risk & Replenishment Planner" subtitle="Plan inventory recovery to close the 43 MT supply gap and ensure campaign success" />
      <SourceBar><CheckCircle2 size={15} /> <strong>Campaign Context: Croptek Onion Conversion — Ambad, Jalna</strong></SourceBar>
      <KpiRow>
        <Kpi icon={<Target size={22} />} label="Projected Demand" value="209 MT" />
        <Kpi icon={<Coins size={22} />} label="Potential Supply" value="166 MT" />
        <Kpi icon={<AlertTriangle size={22} />} label="Supply Gap" value="43 MT" tone="red" />
        <Kpi icon={<Gauge size={22} />} label="Supply Coverage" value="79%" />
        <Kpi icon={<Users size={22} />} label="Active Retailers" value="74" />
        <Kpi icon={<Star size={22} />} label="High-Influence Retailers" value="18" />
      </KpiRow>

      <Grid cols="0.8fr 1.4fr 1.1fr">
        <Panel number={1} title="Supply Position Overview" className="dark-head">
          <Donut size={170} thickness={24} center="79%" sub="Coverage" showPct={false} segments={[
            { label: 'Available Stock (138 MT)', value: 138, color: COLORS.green },
            { label: 'In Transit (28 MT)', value: 28, color: COLORS.yellow },
            { label: 'Supply Gap (43 MT)', value: 43, color: COLORS.grey },
          ]} />
        </Panel>
        <Panel number={2} title="Replenishment Scenarios" className="dark-head">
          <div className="s5-scen">
            {SCENARIOS.map((s) => (
              <div key={s.id} className={`s5-scen-card ${scenario === s.id ? 'selected' : ''}`}>
                {s.id === 'B' && <span className="s5-rec-tag"><Pill tone="green" solid>✓ Recommended</Pill></span>}
                <h4>{s.name}</h4>
                <span className="muted">{s.desc}</span>
                <span>Fulfilment</span>
                <span className="s5-big">100%</span>
                <span>Lead Time</span>
                <strong>{s.lead}</strong>
                <Btn small variant={scenario === s.id ? 'primary' : 'outline'} onClick={() => { setScenario(s.id); setConfirmed(false); toast(`Scenario ${s.name} selected`); }}>
                  {scenario === s.id ? 'Selected' : 'Select'}
                </Btn>
              </div>
            ))}
          </div>
        </Panel>
        <Panel number={3} title="Cluster-wise Supply Gap" className="dark-head">
          <DataTable
            compact
            columns={[
              { key: 'v', label: 'Village / Cluster' },
              { key: 'd', label: 'Demand (MT)', align: 'right' },
              { key: 's', label: 'Supply (MT)', align: 'right' },
              { key: 'g', label: 'Gap (MT)', align: 'right' },
              { key: 'st', label: 'Status', render: (r) => statusPill(r.st as string) },
            ]}
            rows={[
              { v: 'Wadi Gaon', d: 36, s: 31, g: 5, st: 'Watch' },
              { v: 'Dhanora', d: 34, s: 20, g: 14, st: 'Critical' },
              { v: 'Ambad HQ', d: 38, s: 31, g: 7, st: 'Watch' },
              { v: 'Pimpalgaon', d: 27, s: 18, g: 9, st: 'Watch' },
              { v: 'Other Villages', d: 74, s: 66, g: 8, st: 'On Track' },
            ]}
            total={{ v: 'Total', d: '209', s: '166', g: '43', st: '' }}
          />
        </Panel>
      </Grid>

      <Grid cols="1.3fr 0.95fr 1.05fr">
        <Panel number={4} title="SKU-wise Allocation Plan" className="dark-head">
          <DataTable
            compact
            columns={[
              { key: 'p', label: 'SKU / Product' },
              { key: 'pack', label: 'Pack Size' },
              { key: 'a', label: 'Cluster Allocation (MT)', align: 'right' },
              { key: 'b', label: 'Required Bags', align: 'right' },
              { key: 'st', label: 'Status', render: (r) => statusPill(r.st as string) },
            ]}
            rows={[
              { p: 'Croptek', pack: '50 kg', a: 72, b: '1,440', st: 'On Track' },
              { p: 'Croptek', pack: '25 kg', a: 61, b: '2,440', st: 'At Risk' },
              { p: 'Croptek', pack: '10 kg', a: 51, b: '5,100', st: 'On Track' },
            ]}
            total={{ p: 'Total', a: '184', b: '8,980' }}
          />
        </Panel>
        <Panel number={5} title="Stock Sources & Availability" className="dark-head">
          <DataTable
            compact
            columns={[
              { key: 's', label: 'Source' },
              { key: 'a', label: 'Available Stock', align: 'right' },
              { key: 'st', label: 'Status', render: (r) => <Check status={r.st === 'Confirmed' ? 'done' : 'pending'}>{r.st as string}</Check> },
            ]}
            rows={[
              { s: 'Central Warehouse', a: '70 MT', st: 'Confirmed' },
              { s: 'Regional Depot', a: '48 MT', st: 'Confirmed' },
              { s: 'Other Distributor', a: '48 MT', st: 'Estimated' },
            ]}
          />
        </Panel>
        <Panel number={6} title="Crop-Stage & Delivery Timeline" className="dark-head">
          <div className="s5-tracker">
            <div className="done"><b /><span>Vegetative</span><small>(Dec '26)</small></div>
            <div className="now"><b /><span>Bulb Development</span><small>(Jan '27)</small></div>
            <div><b /><span>Bulb Enlargement</span><small>(Feb '27)</small></div>
            <div><b /><span>Maturity</span><small>(Mar '27)</small></div>
          </div>
          <div className="highlight-box small" style={{ textAlign: 'center' }}>
            <strong>Planned Dispatch: 15 Dec – 10 Jan | Delivery: {chosen.delivery}</strong>
            <div className="muted">Scenario {chosen.name}</div>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.25fr 1.05fr 0.85fr">
        <Panel number={7} title="AI Insights & Recommendations" icon={<Lightbulb size={15} />} className="dark-head"
          actions={<Btn small variant="ghost" className="s5-light-btn" icon={<ArrowRight size={13} />} onClick={() => setDetail((d) => !d)}>{detail ? 'Hide Detailed Plan' : 'View Detailed Plan'}</Btn>}>
          <Check status="done">Dhanora & Pimpalgaon account for ~53% of the supply gap. Prioritize replenishment for these clusters.</Check>
          <Check status="done">Consider 25 kg packs to address mid-size retailers effectively.</Check>
          <Check status="done">Ensure stock arrival before 15 Jan to align with peak purchase window.</Check>
          {detail && (
            <div className="highlight-box small" style={{ marginTop: 8 }}>
              <strong>Detailed plan — Scenario {chosen.name}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                <li>Dhanora: close 14 MT gap via {scenario === 'A' ? 'transfer from Other Villages' : 'depot dispatch'} by 10 Jan '27</li>
                <li>Pimpalgaon: close 9 MT gap via {scenario === 'B' ? 'depot dispatch' : 'transfer from Wadi Gaon / Ambad HQ'} by 12 Jan '27</li>
                <li>Ambad HQ, Wadi Gaon, Other Villages: top-up 20 MT across 25 kg & 10 kg packs</li>
                <li>Lead time {chosen.lead}; fulfilment 100% of the 43 MT gap</li>
              </ul>
            </div>
          )}
        </Panel>
        <Panel number={8} title="Action Plan & Ownership" className="dark-head">
          <DataTable
            compact
            columns={[
              { key: 'a', label: 'Action' },
              { key: 'o', label: 'Owner' },
              { key: 't', label: 'Timeline' },
              { key: 's', label: 'Approval Status', render: (r) => <Pill tone={r.s === 'Approved' ? 'green' : r.s === 'Pending' ? 'amber' : r.s === 'In Progress' ? 'blue' : 'grey'}>{r.s as string}</Pill> },
            ]}
            rows={[
              { a: 'Request Dispatch (48 MT)', o: 'Supply Chain', t: "By 10 Jan '27", s: confirmed ? 'Approved' : 'Pending' },
              { a: 'Transfer Stock (48 MT)', o: 'Regional Sales', t: "By 08 Jan '27", s: confirmed ? 'Approved' : 'In Progress' },
              { a: 'Monitor Retail Coverage', o: 'Territory Manager', t: 'Ongoing', s: confirmed ? 'In Progress' : 'Not Started' },
            ]}
          />
        </Panel>
        <Panel className="s5-ready-card">
          <div className="s5-ready-top">
            <CheckCircle2 size={40} color={COLORS.green} />
            <div>
              <h3>Replenishment Plan {confirmed ? 'Confirmed' : 'Ready'}</h3>
              <span className="small">Close the 43 MT gap and enable campaign success · Scenario {chosen.id}</span>
            </div>
          </div>
          <Btn variant="primary" icon={<ArrowRight size={14} />} onClick={() => {
            setConfirmed(true);
            toast(`Supply plan confirmed (Scenario ${chosen.name}) — opening Campaign Calendar`);
            go('s6.1');
          }}>Confirm Supply Plan & Open Campaign Calendar</Btn>
          <span className="muted small" style={{ textAlign: 'center' }}>Go to S6.1 Unified Campaign Orchestration Calendar</span>
        </Panel>
      </Grid>

      <FlowFooter label="Source:" steps={[
        { label: 'S5.3 Dealer & Retailer Readiness', to: 's5.3' },
        { label: 'Current: S5.4 Supply Risk & Replenishment Planner', current: true },
      ]} next={{ label: 'S6.1 Unified Campaign Orchestration Calendar', to: 's6.1' }} />
      <Note>ⓘ All figures are illustrative and for planning purposes only.</Note>
    </div>
  );
}

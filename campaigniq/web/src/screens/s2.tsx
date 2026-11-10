import './s2.css';
import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRightLeft, BarChart3, Boxes, Check as CheckIcon, Coins, FlaskConical, Info, Landmark, LayoutGrid,
  Leaf, Map as MapIcon, MapPin, Megaphone, MessageCircle, MousePointerClick, Package, PieChart, Plus, RefreshCw, Settings2,
  ShieldCheck, Sparkles, Sprout, Star, Store, Target, TrendingUp, Users, Wand2,
} from 'lucide-react';
import {
  AiItem, Breadcrumbs, Btn, COLORS, DataTable, Donut, FlowFooter, Grid, HBars, Kpi, KpiRow, PageHeader, Panel, Pill,
  SourceBar, VBars, clamp, cx, useChartHeight, useWidth, type Tone,
} from '../ui';
import { IndiaDistrictMap, type MapTone } from '../map/IndiaDistrictMap';
import { useNav, type ScreenId } from '../nav';
import { useDataset } from '../data/datasets';

/* ---------------------------------------------------------------- shared helpers */

function TopLine({ crumbs, opened }: { crumbs: { label: string; to?: ScreenId }[]; opened?: ReactNode }) {
  return (
    <div className="s2-topline">
      <Breadcrumbs items={crumbs} />
      {opened && <span className="s2-opened"><Info size={13} />{opened}</span>}
    </div>
  );
}

function Callout({ title, lines, onClick, active, star }: {
  title: string;
  lines: ReactNode;
  onClick?: () => void;
  active?: boolean;
  star?: boolean;
}) {
  return (
    <button type="button" className={cx('s2-callout', onClick && 's2-click', active && 's2-active')} onClick={onClick}>
      <strong>{star && <Star size={12} fill={COLORS.yellow} color={COLORS.amber} />}{title}</strong>
      <span>{lines}</span>
    </button>
  );
}

const rateTone = (value: string, inverse = false): Tone => {
  const v = value.toLowerCase();
  if (v === 'high') return inverse ? 'red' : 'green';
  if (v === 'low') return inverse ? 'green' : 'red';
  if (v === 'medium-high') return 'lime';
  return 'amber';
};

function Rate({ v, inverse }: { v: string; inverse?: boolean }) {
  return <Pill tone={rateTone(v, inverse)}>{v}</Pill>;
}

type QPoint = { label: string; x: number; y: number; color?: string; onClick?: () => void };

function Quadrant({ points, xRange, yRange, split, labels, xTicks, yTicks, xLabel, yLabel, fmtX = String, fmtY = String, selected }: {
  points: QPoint[];
  xRange: [number, number];
  yRange: [number, number];
  split: [number, number];
  labels: [string, string, string, string];
  xTicks: number[];
  yTicks: number[];
  xLabel: string;
  yLabel: string;
  fmtX?: (v: number) => string;
  fmtY?: (v: number) => string;
  selected?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(430);
  const [hover, setHover] = useState<string | null>(null);
  // Drawn at the real panel width so quadrant labels and dot names keep their size on phones.
  const W = clamp(width, 280, 900);
  const tall = useChartHeight(0);
  const H = tall || clamp(Math.round(W * 0.56), 230, 320);
  const L = 46;
  const R = W - 12;
  const T = 10;
  const B = H - 35;
  const sx = (v: number) => L + ((v - xRange[0]) / (xRange[1] - xRange[0])) * (R - L);
  const sy = (v: number) => B - ((v - yRange[0]) / (yRange[1] - yRange[0])) * (B - T);
  const mx = sx(split[0]);
  const my = sy(split[1]);
  return (
    <div className="s2-quad" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(null)}>
        <rect x={L} y={T} width={mx - L} height={my - T} fill="#f3f9ee" />
        <rect x={mx} y={T} width={R - mx} height={my - T} fill="#e4f2d8" />
        <rect x={L} y={my} width={mx - L} height={B - my} fill="#fbfaf1" />
        <rect x={mx} y={my} width={R - mx} height={B - my} fill="#f4f7f1" />
        <line x1={mx} x2={mx} y1={T} y2={B} stroke="#9fb59a" strokeDasharray="4 3" />
        <line x1={L} x2={R} y1={my} y2={my} stroke="#9fb59a" strokeDasharray="4 3" />
        <line x1={L} x2={L} y1={T} y2={B} stroke="#7f8f80" />
        <line x1={L} x2={R} y1={B} y2={B} stroke="#7f8f80" />
        {xTicks.map((t) => <text key={`x${t}`} x={sx(t)} y={B + 13} fontSize="9.5" textAnchor="middle" fill="#5b665d">{fmtX(t)}</text>)}
        {yTicks.map((t) => <text key={`y${t}`} x={L - 5} y={sy(t) + 3} fontSize="9.5" textAnchor="end" fill="#5b665d">{fmtY(t)}</text>)}
        <text x={(L + R) / 2} y={H - 3} fontSize="10.5" textAnchor="middle" fill="#34463a" fontWeight="600">{xLabel}</text>
        <text x={11} y={(T + B) / 2} fontSize="10.5" textAnchor="middle" fill="#34463a" fontWeight="600" transform={`rotate(-90 11 ${(T + B) / 2})`}>{yLabel}</text>
        <text x={L + 8} y={T + 15} fontSize="11.5" fontWeight="700" fill={COLORS.dark}>{labels[0]}</text>
        <text x={R - 8} y={T + 15} fontSize="11.5" fontWeight="700" fill={COLORS.dark} textAnchor="end">{labels[1]}</text>
        <text x={L + 8} y={B - 8} fontSize="11.5" fontWeight="700" fill={COLORS.dark}>{labels[2]}</text>
        <text x={R - 8} y={B - 8} fontSize="11.5" fontWeight="700" fill={COLORS.dark} textAnchor="end">{labels[3]}</text>
        {points.map((p, index) => {
          // Keep each dot label inside the plot: flip it to the left of the dot near the right edge.
          const flip = sx(p.x) > R - p.label.length * 5.8 - 12;
          return (
            <g
              key={p.label}
              className={cx('q-dot', p.onClick && 'q-click', hover && hover !== p.label && 'q-dim')}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={p.onClick}
              onMouseEnter={() => setHover(p.label)}
              data-tip={`${p.label} · ${xLabel}: ${fmtX(p.x)} · ${yLabel}: ${fmtY(p.y)}`}
            >
              <circle cx={sx(p.x)} cy={sy(p.y)} r={selected === p.label || hover === p.label ? 6.5 : 5} fill={p.color ?? COLORS.green} stroke="#fff" strokeWidth="1.5" />
              <text x={flip ? sx(p.x) - 8 : sx(p.x) + 8} y={sy(p.y) - 5} textAnchor={flip ? 'end' : 'start'} fontSize="10.5" fontWeight="600" fill="#1f3d25">{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Meter({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="s2-meter">
      <span>{label}</span>
      <div><i style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

const SWITCHING_BARRIERS = [
  { label: 'Higher price perception', value: 42, tone: 'dark' as Tone },
  { label: 'Satisfaction with current brand', value: 28, tone: 'green' as Tone },
  { label: 'Low awareness of benefits', value: 16, tone: 'lime' as Tone },
  { label: 'Limited availability', value: 9, tone: 'lime' as Tone },
  { label: 'No immediate need', value: 5, tone: 'grey' as Tone },
];

/* ---------------------------------------------------------------- S2.1 */

type MarketRow = { rank: number; geo: string; crop: string; score: number; potential: string; gap: string; readiness: string; to?: ScreenId };

const TOP_MARKETS: MarketRow[] = [
  { rank: 1, geo: 'Jalna', crop: 'Onion', score: 92, potential: '₹2.4 Cr', gap: '24 pp', readiness: 'High', to: 's2.2' },
  { rank: 2, geo: 'Dhule', crop: 'Onion', score: 88, potential: '₹1.8 Cr', gap: '18 pp', readiness: 'High', to: 's2.2' },
  { rank: 3, geo: 'Nashik', crop: 'Onion', score: 78, potential: '₹1.6 Cr', gap: '16 pp', readiness: 'Medium', to: 's2.2' },
  { rank: 4, geo: 'Sangli', crop: 'Onion', score: 76, potential: '₹1.1 Cr', gap: '15 pp', readiness: 'Medium', to: 's2.2' },
  { rank: 5, geo: 'Anantapur', crop: 'Onion', score: 74, potential: '₹1.0 Cr', gap: '17 pp', readiness: 'Medium', to: 's2.2' },
];

const INSIGHTS = [
  {
    id: 'Jalna',
    icon: <Star size={16} />,
    tone: 'amber' as Tone,
    title: 'Jalna (Onion) shows high acreage and low Croptek penetration; prioritize acquisition campaign.',
    body: 'Rationale: 1.8 L acres, 46% penetration (−24 pp vs. state avg), ₹2.4 Cr opportunity, high retailer readiness (91).',
  },
  {
    id: 'Dhule',
    icon: <BarChart3 size={16} />,
    tone: 'green' as Tone,
    title: 'Dhule is retailer-ready with strong coverage; ideal for scale-up and trial conversion.',
    body: 'Rationale: 1.4 L acres, 52% penetration, ₹1.8 Cr opportunity, 26 active clusters, readiness score 88.',
  },
  {
    id: 'Nashik',
    icon: <AlertTriangle size={16} />,
    tone: 'red' as Tone,
    title: 'Nashik grape clusters should be deprioritized in this campaign wave; focus specialty programmes separately.',
    body: 'Rationale: High grape share (62% of acreage), Croptek fit lower for this wave, better suited for specialty nutrition push (e.g. Vitamax).',
  },
];

const SHORTLIST = [
  { name: 'Jalna', state: 'Maharashtra', acres: '1.8 L acres', gap: '24 pp (46% vs. 70% state avg)', retailers: 412, readiness: '91 (High)', priority: true },
  { name: 'Dhule', state: 'Maharashtra', acres: '1.4 L acres', gap: '18 pp (52% vs. 70%)', retailers: 326, readiness: '88 (High)', priority: true },
  { name: 'Nashik', state: 'Maharashtra', acres: '1.2 L acres', gap: '16 pp (54% vs. 70%)', retailers: 298, readiness: '78 (Medium)', priority: false },
  { name: 'Sangli', state: 'Maharashtra', acres: '0.9 L acres', gap: '16 pp (55% vs. 70%)', retailers: 243, readiness: '76 (Medium)', priority: false },
];

export function OpportunityAtlas() {
  const { go, toast } = useNav();
  const markets = useDataset('atlas.top_markets', TOP_MARKETS);
  const [targets, setTargets] = useState<string[]>([]);
  const [hover, setHover] = useState<string>('Jalna');

  const toggleTarget = (name: string) => {
    setTargets((current) => {
      const has = current.includes(name);
      toast(has ? `${name} removed from target list` : `${name} added to target list`);
      return has ? current.filter((item) => item !== name) : [...current, name];
    });
  };

  const openDistrict = (name: string) => {
    setHover(name);
    if (name !== 'Jalna' && name !== 'Dhule') toast(`Opening district view — taluka data currently modelled for Jalna`);
    go('s2.2');
  };

  return (
    <div className="stack">
      <TopLine
        crumbs={[
          { label: 'S1.1 Executive Strategy Command Centre', to: 's1.1' },
          { label: 'Opportunity Atlas' },
          { label: 'S2.1 Crop × Geography Opportunity Atlas' },
        ]}
        opened="Opened from S1.1: Opportunity Atlas / Explore Opportunity"
      />
      <PageHeader
        title="Crop × Geography Opportunity Atlas"
        subtitle="Identify high-potential crop nutrition markets, penetration gaps and campaign-ready micro-markets"
        actions={
          <>
            <Btn variant="primary" icon={<ArrowRightLeft size={14} />} onClick={() => toast('Comparing Jalna, Dhule, Nashik, Sangli and Anantapur side by side')}>Compare Markets</Btn>
            <Btn icon={<Plus size={14} />} onClick={() => toast(targets.length ? `Target list created with ${targets.length} market(s): ${targets.join(', ')}` : 'Add markets via "Add to Target List" first')}>
              Create Target List{targets.length ? ` (${targets.length})` : ''}
            </Btn>
            <Btn variant="gold" icon={<Sparkles size={14} />} onClick={() => toast('AI Market Brief generated for Late Rabi 2026-27 — Croptek Onion')}>Open AI Market Brief</Btn>
          </>
        }
      />

      <KpiRow>
        <Kpi icon={<Coins size={18} />} label="Addressable Market Potential" value="₹18.6 Cr" sub="+14% vs. previous season" trend="up" spark />
        <Kpi icon={<Target size={18} />} label="Opportunity Coverage" value="63%" sub="+7 pp vs. previous season" trend="up" spark />
        <Kpi icon={<BarChart3 size={18} />} label="Underpenetrated High-Potential Districts" value="12" sub="+3 vs. previous season" trend="up" spark />
        <Kpi icon={<MapPin size={18} />} label="Priority Target Talukas" value="38" sub="+12% vs. previous season" trend="up" spark />
        <Kpi icon={<Store size={18} />} label="Retailer-Ready Clusters" value="26" sub="+4 vs. previous season" trend="up" spark />
        <Kpi icon={<Package size={18} />} label="Estimated Incremental Volume Potential" value="24.8 K MT" sub="+18% vs. previous season" trend="up" spark />
      </KpiRow>

      <Grid cols="1.25fr 1fr">
        <Panel title="India Opportunity Heatmap" info>
          <div className="s2-mapwrap">
            <div className="s2-callouts">
              <Callout title="Gujarat" lines="Opportunity: ₹2.1 Cr" />
              <Callout title="Maharashtra" lines="Opportunity: ₹8.7 Cr" />
              <Callout title="Karnataka" lines="Opportunity: ₹2.3 Cr" />
              <Callout title="Sangli" lines="₹1.1 Cr | Score: 76" active={hover === 'Sangli'} />
            </div>
            <IndiaDistrictMap
              label="India opportunity heatmap"
              height={400}
              view="india"
              selected={hover.toLowerCase()}
              states={{
                Gujarat: { tone: 2, info: 'Opportunity ₹2.1 Cr' },
                Maharashtra: { tone: 3, info: 'Opportunity ₹8.7 Cr' },
                Telangana: { tone: 1 },
                Karnataka: { tone: 2, info: 'Opportunity ₹2.3 Cr' },
                'Andhra Pradesh': { tone: 2, info: 'Opportunity ₹1.9 Cr' },
                Goa: { tone: 0 },
                'Tamil Nadu': { tone: 1 },
              }}
              markers={[
                { id: 'dhule', info: '₹1.8 Cr | Score 88 · priority district', action: { label: 'Open District Intelligence', run: () => go('s2.2') } },
                { id: 'jalna', info: '₹2.4 Cr | Score 92 · priority district', action: { label: 'Open District Intelligence', run: () => go('s2.2') } },
                { id: 'nashik', info: '₹1.6 Cr | Score 78', onSelect: () => setHover('Nashik') },
                { id: 'sangli', info: '₹1.1 Cr | Score 76', onSelect: () => setHover('Sangli') },
                { id: 'anantapur', info: '₹1.0 Cr | Score 74', onSelect: () => setHover('Anantapur') },
              ]}
              scale={{ title: 'Opportunity (₹ Cr)', items: [{ label: '≥ 5.0', tone: 4 }, { label: '3.0–5.0', tone: 3 }, { label: '1.0–3.0', tone: 2 }, { label: '< 1.0', tone: 0 }] }}
            />
            <div className="s2-callouts">
              <Callout title="Dhule" star lines="₹1.8 Cr | Score: 88" onClick={() => go('s2.2')} />
              <Callout title="Jalna" star lines="₹2.4 Cr | Score: 92" onClick={() => go('s2.2')} />
              <Callout title="Nashik" lines="₹1.6 Cr | Score: 78" active={hover === 'Nashik'} />
              <Callout title="Andhra Pradesh" lines="Opportunity: ₹1.9 Cr" />
              <Callout title="Anantapur" lines="₹1.0 Cr | Score: 74" active={hover === 'Anantapur'} />
            </div>
          </div>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="small muted">Opportunity Intensity (Market Potential, ₹ Cr)</span>
            <span className="s2-hint"><MousePointerClick size={14} />Click district to open S2.2 District / Taluka Intelligence</span>
          </div>
        </Panel>

        <Panel title="AI Market Insights" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="stack" style={{ gap: 8 }}>
            {INSIGHTS.map((insight) => {
              const added = targets.includes(insight.id);
              return (
                <AiItem
                  key={insight.id}
                  icon={insight.icon}
                  tone={insight.tone}
                  title={insight.title}
                  action={
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <Btn small onClick={() => openDistrict(insight.id)}>Open District View</Btn>
                      <Btn small variant={added ? 'outline' : 'primary'} icon={added ? <CheckIcon size={12} /> : undefined} onClick={() => toggleTarget(insight.id)}>
                        {added ? 'In Target List' : 'Add to Target List'}
                      </Btn>
                    </div>
                  }
                >
                  <span className="small muted">{insight.body}</span>
                </AiItem>
              );
            })}
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.4fr 1fr 1.05fr">
        <Panel title="Top Opportunity Markets" info data={markets}>
          <DataTable<MarketRow>
            compact
            rows={markets.rows}
            highlight={(row) => targets.includes(row.geo)}
            columns={[
              { key: 'rank', label: '#', render: (row) => <span className="rank">{row.rank}</span> },
              { key: 'geo', label: 'Geography', render: (row) => <strong>{row.geo}</strong> },
              { key: 'crop', label: 'Crop' },
              { key: 'score', label: 'Opportunity Score', align: 'center', render: (row) => <span className="num-badge" style={row.score < 80 ? { background: 'transparent', color: '#1f3d25' } : undefined}>{row.score}</span> },
              { key: 'potential', label: 'Market Potential (₹ Cr)', align: 'right' },
              { key: 'gap', label: 'Penetration Gap (pp)', align: 'right' },
              { key: 'readiness', label: 'Campaign Readiness', render: (row) => <Pill tone={row.readiness === 'High' ? 'green' : 'amber'}>{row.readiness}</Pill> },
              { key: 'next', label: 'Next Action', render: (row) => <Btn small to={row.to}>Open S2.2 ›</Btn> },
            ]}
          />
        </Panel>

        <Panel title="Opportunity Segmentation Matrix" info>
          <Quadrant
            xRange={[15, 75]}
            yRange={[0.25, 3]}
            split={[47, 1.75]}
            labels={['Market Expansion', 'Defend & Grow', 'Selective Conversion', 'Retain Efficiently']}
            xTicks={[20, 30, 40, 50, 60, 70]}
            yTicks={[0.5, 1, 1.5, 2, 2.5, 3]}
            fmtX={(v) => `${v}%`}
            fmtY={(v) => v.toFixed(1)}
            xLabel="Mahadhan Penetration"
            yLabel="Market Potential (₹ Cr)"
            selected={hover}
            points={[
              { label: 'Jalna', x: 24, y: 2.4, color: COLORS.dark, onClick: () => go('s2.2') },
              { label: 'Dhule', x: 52, y: 2.2, color: COLORS.dark, onClick: () => go('s2.2') },
              { label: 'Nashik', x: 36, y: 1.95, onClick: () => setHover('Nashik') },
              { label: 'Anantapur', x: 22, y: 1.05, color: COLORS.mid, onClick: () => setHover('Anantapur') },
              { label: 'Sangli', x: 54, y: 1.2, color: COLORS.mid, onClick: () => setHover('Sangli') },
            ]}
          />
        </Panel>

        <Panel title="Crop Opportunity Mix" info>
          <VBars
            height={210}
            series={[
              { label: 'Market Potential (₹ Cr)', color: COLORS.dark },
              { label: 'Current Campaign Allocation (₹ Cr)', color: COLORS.yellow },
            ]}
            data={[
              { label: 'Onion', values: [8.7, 2.6] },
              { label: 'Sugarcane', values: [3.9, 1.2] },
              { label: 'Grapes', values: [2.8, 0.7] },
              { label: 'Cotton', values: [2.1, 0.5] },
              { label: 'Maize', values: [1.1, 0.3] },
            ]}
          />
        </Panel>
      </Grid>

      <Panel title="Micro-Market Drilldown Shortlist" info>
        <div className="s2-shortlist">
          {SHORTLIST.map((market) => (
            <div key={market.name} className={cx('s2-mm-card', market.priority && 'priority', targets.includes(market.name) && 'selected')}>
              {market.priority && <span className="s2-flag"><Pill tone="amber" solid>Priority</Pill></span>}
              <div>
                <h4>{market.priority && <Star size={13} fill={COLORS.yellow} color={COLORS.amber} />}{market.name} <span>({market.state})</span></h4>
                <ul>
                  <li>Key Crop: Onion</li>
                  <li>Addressable Acres: {market.acres}</li>
                  <li>Penetration Gap: {market.gap}</li>
                  <li>Active Retailers: {market.retailers}</li>
                  <li>Readiness Score: <strong>{market.readiness}</strong></li>
                </ul>
              </div>
              <Btn small variant="primary" to="s2.2">Open S2.2 District View ›</Btn>
            </div>
          ))}
        </div>
      </Panel>

      <FlowFooter
        steps={[
          { label: 'Source: S1.1 Executive Strategy Command Centre', to: 's1.1' },
          { label: 'Current: S2.1 Crop × Geography Opportunity Atlas', current: true },
          { label: 'On click of Jalna / Dhule: Next S2.2 District / Taluka Intelligence', to: 's2.2' },
        ]}
        nextLabel="Recommended Next Screen:"
        next={{ label: 'S2.2 — District / Taluka Intelligence', to: 's2.2', sub: ' Opens when clicking a district / taluka such as Jalna or Dhule' }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- S2.2 */

type TalukaRow = { rank: number; taluka: string; score: number; potential: string; gap: string; retailers: number; readiness: string };

const TALUKAS: TalukaRow[] = [
  { rank: 1, taluka: 'Ambad', score: 94, potential: '₹52 L', gap: '28 pp', retailers: 74, readiness: 'High' },
  { rank: 2, taluka: 'Partur', score: 91, potential: '₹46 L', gap: '25 pp', retailers: 61, readiness: 'High' },
  { rank: 3, taluka: 'Badnapur', score: 89, potential: '₹39 L', gap: '21 pp', retailers: 58, readiness: 'High' },
  { rank: 4, taluka: 'Jalna', score: 86, potential: '₹34 L', gap: '18 pp', retailers: 82, readiness: 'Medium' },
  { rank: 5, taluka: 'Mantha', score: 83, potential: '₹29 L', gap: '19 pp', retailers: 47, readiness: 'Medium' },
];

type FactorRow = { factor: string; croptek: string; npk: string; local: string };

const VALUE_FACTORS: FactorRow[] = [
  { factor: 'Farmer perceived value (1–5)', croptek: '4.4', npk: '3.6', local: '3.9' },
  { factor: 'Price sensitivity (% high)', croptek: '42%', npk: '58%', local: '55%' },
  { factor: 'Retailer push (1–5)', croptek: '4.5', npk: '3.3', local: '3.7' },
  { factor: 'Switching barrier', croptek: 'Low', npk: 'High', local: 'Medium' },
];

/** Village names used on the S2 screens -> verified place ids in src/map/places.json. */
const VILLAGE_ID: Record<string, string> = {
  Golegaon: 'v-golegaon', 'Wadi Gaon': 'v-wadigaon', Wadigaon: 'v-wadigaon', Dhanora: 'v-dhanora', Shahagad: 'v-shahagad',
  'Ambad (HQ)': 'v-ambad', 'Ambad HQ': 'v-ambad', Rohilagad: 'v-rohilagad', Jamkhed: 'v-jamkhed', Tandulwadi: 'v-tandulwadi',
  Pimpalgaon: 'v-pimpalgaon', Kingaon: 'v-kingaon', Sukapuri: 'v-sukapuri', Gondi: 'v-gondi',
};
type Band = 'High' | 'Medium' | 'Low';
const hotspotColor = (band: Band) => (band === 'High' ? '#1f6b2e' : band === 'Medium' ? '#7cb342' : '#d9a21b');
/** S2.3 village hotspot bands (High >= 80, Medium 60-79, Low < 60). */
const HOTSPOTS: { label: string; band: Band }[] = [
  { label: 'Golegaon', band: 'High' }, { label: 'Dhanora', band: 'High' }, { label: 'Ambad (HQ)', band: 'High' },
  { label: 'Wadi Gaon', band: 'Medium' }, { label: 'Pimpalgaon', band: 'Medium' }, { label: 'Shahagad', band: 'Medium' },
  { label: 'Rohilagad', band: 'Medium' }, { label: 'Tandulwadi', band: 'Medium' }, { label: 'Jamkhed', band: 'Low' },
  { label: 'Kingaon', band: 'Low' }, { label: 'Sukapuri', band: 'Low' }, { label: 'Gondi', band: 'Low' },
];
/** S2.4 retailer influence by village (band from the influence score; detail from the map callouts). */
const INFLUENCE: { label: string; band: Band; detail?: string }[] = [
  { label: 'Wadigaon', band: 'High', detail: 'High influence / Medium stock' },
  { label: 'Ambad HQ', band: 'High', detail: 'High influence / Full stock' },
  { label: 'Dhanora', band: 'High', detail: 'Good influence / Full stock' },
  { label: 'Pimpalgaon', band: 'Medium', detail: 'Good influence / Medium stock' },
  { label: 'Tandulwadi', band: 'Medium', detail: 'Medium influence / Low stock' },
  { label: 'Golegaon', band: 'Medium' }, { label: 'Rohilagad', band: 'Medium' },
  { label: 'Shahagad', band: 'Low' }, { label: 'Kingaon', band: 'Low' }, { label: 'Jamkhed', band: 'Low' },
];
const HOTSPOT_LEGEND = [
  { label: 'High hotspot (score ≥ 80)', color: hotspotColor('High') },
  { label: 'Medium (60–79)', color: hotspotColor('Medium') },
  { label: 'Low (< 60)', color: hotspotColor('Low') },
];

/** Jalna's 8 talukas: shading band and opportunity score shown on the S2.2 heatmap. */
const JALNA_TALUKA_MAP: { name: string; tone: MapTone; score: number }[] = [
  { name: 'Jalna', tone: 3, score: 86 },
  { name: 'Ambad', tone: 4, score: 94 },
  { name: 'Badnapur', tone: 3, score: 89 },
  { name: 'Jafrabad', tone: 2, score: 80 },
  { name: 'Bhokardan', tone: 2, score: 82 },
  { name: 'Partur', tone: 4, score: 91 },
  { name: 'Mantha', tone: 2, score: 83 },
  { name: 'Ghansawangi', tone: 1, score: 78 },
];

export function DistrictIntelligence() {
  const { go, toast } = useNav();
  const talukas = useDataset('atlas.taluka_ranking', TALUKAS);
  const [taluka, setTaluka] = useState('Ambad');

  const pickTaluka = (name: string) => {
    if (name === 'Ambad') {
      go('s2.3');
      return;
    }
    setTaluka(name);
    toast(`${name} selected — micro-market segmentation currently modelled for Ambad`);
  };

  const factorCell = (value: string, column: 'croptek' | 'other') => {
    if (['Low', 'Medium', 'High'].includes(value)) return <Rate v={value} inverse />;
    return <Pill tone={column === 'croptek' ? 'green' : 'lime'}>{value}</Pill>;
  };

  return (
    <div className="stack">
      <TopLine
        crumbs={[
          { label: 'S1.1 Executive Strategy Command Centre', to: 's1.1' },
          { label: 'Opportunity Atlas', to: 's2.1' },
          { label: 'S2.1 Crop × Geography Opportunity Atlas', to: 's2.1' },
          { label: 'S2.2 Jalna District / Taluka Intelligence' },
        ]}
        opened="Opened from S2.1: Clicked Jalna / Open S2.2 District View"
      />
      <PageHeader
        title="Jalna District / Taluka Intelligence"
        subtitle="Deep dive into taluka-level opportunity, penetration gaps, farmer segments and campaign readiness for Croptek onion adoption."
        actions={
          <>
            <Btn variant="primary" icon={<ArrowRightLeft size={14} />} onClick={() => toast('Comparing top 5 Jalna talukas on opportunity, gap and readiness')}>Compare Talukas</Btn>
            <Btn icon={<Plus size={14} />} onClick={() => toast(`Target segment created for ${taluka} taluka`)}>Create Target Segment</Btn>
            <Btn variant="gold" icon={<Sparkles size={14} />} onClick={() => toast('AI District Brief for Jalna generated')}>Open AI District Brief</Btn>
          </>
        }
      />

      <KpiRow>
        <Kpi icon={<Star size={18} />} label="Jalna Opportunity Score" value="92" sub="+12 vs. previous season" trend="up" spark />
        <Kpi icon={<Coins size={18} />} label="Estimated Opportunity" value="₹2.4 Cr" sub="+9% vs. previous season" trend="up" spark />
        <Kpi icon={<Target size={18} />} label="Penetration Gap" value="24 pp" sub="-5 pp vs. previous season" trend="down" spark={[9, 8, 8, 7, 7, 6, 6, 5, 4]} />
        <Kpi icon={<Store size={18} />} label="Active Retailers" value="412" sub="+8% vs. previous season" trend="up" spark />
        <Kpi icon={<ShieldCheck size={18} />} label="Campaign Readiness" value="91 (High)" sub="+6 vs. previous season" trend="up" spark />
        <Kpi icon={<Package size={18} />} label="Estimated Incremental Volume Potential" value="6.8 K MT" sub="+14% vs. previous season" trend="up" spark />
      </KpiRow>

      <Grid cols="1.4fr 1fr 1fr">
        <Panel title="Jalna Taluka Opportunity Heatmap" info>
          <div className="s2-mapwrap">
            <div className="s2-callouts">
              <Callout title="Jalna" lines="Score: 86" onClick={() => pickTaluka('Jalna')} active={taluka === 'Jalna'} />
              <Callout title="Ambad" star lines="Score: 94" onClick={() => pickTaluka('Ambad')} />
              <Callout title="Badnapur" lines="Score: 89" onClick={() => pickTaluka('Badnapur')} active={taluka === 'Badnapur'} />
              <Callout title="Jafrabad" lines="Score: 80" onClick={() => pickTaluka('Jafrabad')} active={taluka === 'Jafrabad'} />
            </div>
            <IndiaDistrictMap
              label="Jalna district taluka opportunity heatmap"
              height={380}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected={`t-${taluka.toLowerCase()}`}
              talukas={Object.fromEntries(JALNA_TALUKA_MAP.map((t) => [t.name, {
                tone: t.tone,
                info: <>Opportunity score <b>{t.score}</b>{t.name === 'Ambad' ? ' · click to open S2.3 Micro-Market Segmentation' : ''}</>,
                onSelect: () => pickTaluka(t.name),
              }]))}
              markers={JALNA_TALUKA_MAP.map((t) => ({
                id: `t-${t.name.toLowerCase()}`,
                info: `${t.name} taluka headquarters · score ${t.score}`,
                ...(t.name === 'Ambad'
                  ? { action: { label: 'Open Micro-Market Segmentation', run: () => pickTaluka('Ambad') } }
                  : { onSelect: () => pickTaluka(t.name) }),
              }))}
              scale={{ title: 'Taluka potential (₹ Lakh)', items: [{ label: '≥ 50', tone: 4 }, { label: '40–50', tone: 3 }, { label: '30–40', tone: 2 }, { label: '20–30', tone: 1 }, { label: '< 20', tone: 0 }] }}
            />
            <div className="s2-callouts">
              <Callout title="Bhokardan" lines="Score: 82" onClick={() => pickTaluka('Bhokardan')} active={taluka === 'Bhokardan'} />
              <Callout title="Partur" lines="Score: 91" onClick={() => pickTaluka('Partur')} active={taluka === 'Partur'} />
              <Callout title="Mantha" lines="Score: 83" onClick={() => pickTaluka('Mantha')} active={taluka === 'Mantha'} />
              <Callout title="Ghansawangi" lines="Score: 78" onClick={() => pickTaluka('Ghansawangi')} active={taluka === 'Ghansawangi'} />
            </div>
          </div>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="small muted">Opportunity Intensity (Taluka Potential, ₹ Lakh)</span>
            <span className="s2-hint"><MousePointerClick size={14} />Click taluka to open S2.3 Micro-Market Segmentation</span>
          </div>
        </Panel>

        <Panel title="AI Recommended Actions" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="stack" style={{ gap: 8 }}>
            <AiItem
              icon={<Sprout size={16} />}
              title="Ambad and Partur combine high onion acreage with low Croptek penetration; prioritize acquisition campaign."
              action={<div className="stack" style={{ gap: 4 }}><Btn small to="s2.3">Open Taluka View</Btn><Btn small variant="primary" to="s2.3">Explore Target Segments</Btn></div>}
            />
            <AiItem
              icon={<Store size={16} />}
              tone="blue"
              title="Badnapur has strong retailer readiness and moderate penetration gap; use retailer-led conversion campaign."
              action={<div className="stack" style={{ gap: 4 }}><Btn small onClick={() => pickTaluka('Badnapur')}>Open Taluka View</Btn><Btn small variant="primary" onClick={() => toast('Target segment "Badnapur retailer-led conversion" created')}>Create Target Segment</Btn></div>}
            />
            <AiItem
              icon={<AlertTriangle size={16} />}
              tone="amber"
              title="Jalna urban cluster has high awareness but lower trial conversion; recommend demo-led follow-up and retailer activation."
              action={<div className="stack" style={{ gap: 4 }}><Btn small onClick={() => toast('Root cause: awareness 71% but trial only 18% — few demo plots & follow-up visits')}>View Root Cause</Btn><Btn small variant="primary" to="s2.3">Explore Target Segments</Btn></div>}
            />
          </div>
        </Panel>

        <Panel title="Taluka Opportunity vs Penetration" info>
          <Quadrant
            xRange={[0, 50]}
            yRange={[70, 100]}
            split={[25, 85]}
            labels={['Market Expansion', 'Defend & Grow', 'Selective Conversion', 'Retain Efficiently']}
            xTicks={[0, 10, 20, 30, 40, 50]}
            yTicks={[70, 75, 80, 85, 90, 95, 100]}
            fmtX={(v) => `${v}%`}
            xLabel="Croptek Penetration (%)"
            yLabel="Opportunity Score"
            selected={taluka}
            points={[
              { label: 'Ambad', x: 5, y: 95, color: COLORS.dark, onClick: () => go('s2.3') },
              { label: 'Partur', x: 12, y: 93, onClick: () => pickTaluka('Partur') },
              { label: 'Badnapur', x: 18, y: 91, onClick: () => pickTaluka('Badnapur') },
              { label: 'Jalna', x: 34, y: 88, onClick: () => pickTaluka('Jalna') },
              { label: 'Mantha', x: 13, y: 82, color: COLORS.yellow, onClick: () => pickTaluka('Mantha') },
              { label: 'Jafrabad', x: 11, y: 80, color: COLORS.yellow, onClick: () => pickTaluka('Jafrabad') },
              { label: 'Bhokardan', x: 36, y: 81, color: COLORS.mid, onClick: () => pickTaluka('Bhokardan') },
              { label: 'Ghansawangi', x: 39, y: 78, color: COLORS.mid, onClick: () => pickTaluka('Ghansawangi') },
            ]}
          />
        </Panel>
      </Grid>

      <Grid cols="2fr 0.93fr 1fr 0.98fr">
        <Panel title="Top Taluka Opportunity Ranking" icon={<BarChart3 size={15} />} info data={talukas}>
          <DataTable<TalukaRow>
            compact
            rows={talukas.rows}
            highlight={(row) => row.taluka === taluka}
            onRowClick={(row) => setTaluka(row.taluka)}
            columns={[
              { key: 'rank', label: 'Rank', render: (row) => <span className="rank">{row.rank}</span> },
              { key: 'taluka', label: 'Taluka', render: (row) => <strong>{row.taluka}</strong> },
              { key: 'score', label: 'Opportunity Score', align: 'center', render: (row) => <span className="num-badge">{row.score}</span> },
              { key: 'potential', label: 'Potential (₹ Lakh)', align: 'right' },
              { key: 'gap', label: 'Penetration Gap', align: 'right' },
              { key: 'retailers', label: 'Active Retailers', align: 'right' },
              { key: 'readiness', label: 'Campaign Readiness', render: (row) => <Pill tone={row.readiness === 'High' ? 'green' : 'amber'}>{row.readiness}</Pill> },
              { key: 'next', label: 'Next Action', render: () => <Btn small to="s2.3">Open S2.3 ›</Btn> },
            ]}
            total={{
              rank: <strong>District Total (Jalna)</strong>,
              score: <span className="num-badge">92</span>,
              potential: <strong>₹2.4 Cr</strong>,
              gap: <strong>24 pp</strong>,
              retailers: <strong>412</strong>,
              readiness: <Pill tone="green">High</Pill>,
              next: '—',
            }}
          />
        </Panel>

        <Panel title="Farmer Segmentation" icon={<Users size={15} />} info>
          <Donut
            size={170}
            thickness={30}
            center="~32,400"
            sub="Onion Farmers"
            segments={[
              { label: 'Non-users / Conventional NPK users: 38%', value: 38, color: COLORS.dark, note: '(~12,312 farmers)' },
              { label: 'Trial users: 21%', value: 21, color: COLORS.mid, note: '(~6,804 farmers)' },
              { label: 'Partial nutrition programme users: 18%', value: 18, color: COLORS.light, note: '(~5,832 farmers)' },
              { label: 'Repeat Croptek adopters: 11%', value: 11, color: COLORS.yellow, note: '(~3,564 farmers)' },
              { label: 'Influencer / progressive farmers: 12%', value: 12, color: '#f3dc83', note: '(~3,888 farmers)' },
            ]}
          />
          <div style={{ marginTop: 10 }}>
            <Btn variant="primary" className="s2-cta" icon={<Users size={15} />} to="s2.3">Explore Target Segments → S2.3</Btn>
          </div>
        </Panel>

        <Panel title="Competition & Value Perception" icon={<Boxes size={15} />}>
          <DataTable<FactorRow>
            compact
            rows={VALUE_FACTORS}
            columns={[
              { key: 'factor', label: 'Factor' },
              { key: 'croptek', label: 'Croptek', align: 'center', render: (row) => factorCell(row.croptek, 'croptek') },
              { key: 'npk', label: 'Conv. NPK Programme', align: 'center', render: (row) => factorCell(row.npk, 'other') },
              { key: 'local', label: 'Local Brand Programme', align: 'center', render: (row) => factorCell(row.local, 'other') },
            ]}
          />
        </Panel>

        <Panel title="Campaign Coverage & Gaps" icon={<Target size={15} />}>
          <div className="s2-cov">
            <ul className="s2-cov-list">
              <li><MapPin size={14} color={COLORS.green} />Target villages<b>126</b></li>
              <li><CheckIcon size={14} color={COLORS.green} />Covered villages<b>78 (62%)</b></li>
              <li><FlaskConical size={14} color={COLORS.green} />Demo plots<b>34</b></li>
              <li><Store size={14} color={COLORS.green} />Retailer meetings<b>96</b></li>
              <li><Users size={14} color={COLORS.green} />Farmer meetings<b>148</b></li>
            </ul>
            <div className="warn-box small">
              <div className="row" style={{ marginBottom: 6 }}><AlertTriangle size={14} color={COLORS.amber} /><strong>Low-coverage pockets (need focus)</strong></div>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li><button type="button" className="linkish" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }} onClick={() => go('s2.3')}>Ambad (12 villages)</button></li>
                <li>Mantha (8 villages)</li>
                <li>Ghansawangi (6 villages)</li>
              </ul>
            </div>
          </div>
        </Panel>
      </Grid>

      <FlowFooter
        steps={[
          { label: 'Source: S2.1 Crop × Geography Opportunity Atlas', to: 's2.1' },
          { label: 'Current: S2.2 Jalna District / Taluka Intelligence', current: true },
          { label: "On click of 'Explore Target Segments' → Next: S2.3 Micro-Market Segmentation", to: 's2.3' },
        ]}
        nextLabel="Recommended Next Screen:"
        next={{ label: 'S2.3 — Micro-Market Segmentation', to: 's2.3' }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- S2.3 */

type SegRow = { id: string; segment: string; sub: string; farmers: number; acreage: number; opp: number; intervention: string; icon: ReactNode };

const SEGMENT_ROWS: SegRow[] = [
  { id: 'npk', segment: 'Conventional NPK', sub: 'Priority Acquisition', farmers: 1832, acreage: 760, opp: 20.0, intervention: 'Retailer activation + field demos + crop advisory', icon: <Users size={15} /> },
  { id: 'non', segment: 'Non-users', sub: 'Nurture & Convert', farmers: 1061, acreage: 460, opp: 11.0, intervention: 'Demo plots + yield proof + introductory pack', icon: <Sprout size={15} /> },
  { id: 'trial', segment: 'Trial Users', sub: 'Targeted Trial', farmers: 771, acreage: 320, opp: 8.0, intervention: 'Follow-up visits + advisory + repeat purchase incentive', icon: <FlaskConical size={15} /> },
  { id: 'partial', segment: 'Partial Programme', sub: 'Conversion', farmers: 675, acreage: 280, opp: 7.0, intervention: 'Stage-wise nutrition plan + retailer referral', icon: <LayoutGrid size={15} /> },
];

const QUADS = [
  { id: 'trial', title: 'Targeted Trial', meta: '(16% | ₹8 L)', bullets: ['Trial → repeat conversion'], icon: <FlaskConical size={14} />, cls: '' },
  { id: 'npk', title: 'Priority Acquisition', meta: '(38% | ₹20 L)', bullets: ['Conventional NPK users', 'High conversion'], icon: <Star size={14} fill={COLORS.green} color={COLORS.green} />, cls: 'q-hot' },
  { id: 'repeat', title: 'Low-Cost Nurturing', meta: '(10% | ₹5 L)', bullets: ['Retain & cross-sell'], icon: <Sprout size={14} />, cls: '' },
  { id: 'non', title: 'Nurture & Convert', meta: '(23% | ₹11 L)', bullets: ['Non-users', 'Demo & evidence-led'], icon: <Users size={14} />, cls: 'q-blue' },
];

export function MicroMarketSegmentation() {
  const { toast } = useNav();
  const [picked, setPicked] = useState<string[]>(SEGMENT_ROWS.map((row) => row.id));
  const [quad, setQuad] = useState('npk');
  const [village, setVillage] = useState('Golegaon');

  const chosen = SEGMENT_ROWS.filter((row) => picked.includes(row.id));
  const totals = {
    farmers: chosen.reduce((sum, row) => sum + row.farmers, 0),
    acreage: chosen.reduce((sum, row) => sum + row.acreage, 0),
    opp: chosen.reduce((sum, row) => sum + row.opp, 0),
  };
  const toggle = (id: string) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const villages = [
    { label: 'Golegaon', score: 96 },
    { label: 'Dhanora', score: 92 },
    { label: 'Ambad (HQ)', score: 94 },
    { label: 'Pimpalgaon', score: 88 },
  ];
  const pickVillage = (name: string) => {
    setVillage(name);
    toast(`${name} hotspot selected`);
  };

  return (
    <div className="stack">
      <TopLine
        crumbs={[
          { label: 'S1.1 Executive Command Centre', to: 's1.1' },
          { label: 'S2.1 Opportunity Atlas', to: 's2.1' },
          { label: 'S2.2 Jalna District Intelligence', to: 's2.2' },
          { label: 'S2.3 Ambad Segmentation' },
        ]}
        opened="From S2.2: Ambad / Explore Target Segments"
      />
      <PageHeader
        title="Ambad — Micro-Market Segmentation & Campaign Targeting"
        subtitle="Prioritize onion farmer cohorts and village clusters for Croptek acquisition campaigns in Jalna."
      />

      <KpiRow>
        <Kpi icon={<Target size={20} />} label="Opportunity Score" value="94" badge={<span className="small trend-up">▲ +2 vs. District Avg.</span>} />
        <Kpi icon={<Coins size={20} />} label="Market Opportunity" value="₹52 Lakh" />
        <Kpi icon={<BarChart3 size={20} />} label="Current Penetration" value="34%" badge={<Pill tone="amber">28 pp Gap to Potential</Pill>} />
        <Kpi icon={<Store size={20} />} label="Active Retailers" value="74" />
        <Kpi icon={<Users size={20} />} label="Target Farmers" value="4,820" />
        <Kpi icon={<Sprout size={20} />} label="Target Acreage" value="1,960 Acres" />
      </KpiRow>

      <Grid cols="1fr 1fr 0.95fr">
        <Panel title="Farmer Segmentation – Ambad (Onion)">
          <Donut
            size={180}
            thickness={34}
            center="4,820"
            sub="Farmers"
            segments={[
              { label: 'Conventional NPK Users', value: 1832, color: COLORS.dark, note: '1,832 (38%)' },
              { label: 'Non-users', value: 1061, color: COLORS.green, note: '1,061 (22%)' },
              { label: 'Trial Users', value: 771, color: COLORS.light, note: '771 (16%)' },
              { label: 'Partial Programme Users', value: 675, color: COLORS.yellow, note: '675 (14%)' },
              { label: 'Repeat Users', value: 481, color: COLORS.grey, note: '481 (10%)' },
            ]}
          />
        </Panel>

        <Panel title="Segment Opportunity vs. Conversion Feasibility">
          <div className="s2-quadgrid">
            <div className="s2-qaxis-y"><span>Low</span><span>Conversion Feasibility</span><span>High</span></div>
            {QUADS.map((q) => (
              <button
                key={q.id}
                type="button"
                className={cx('s2-qbox', q.cls, quad === q.id && 'active')}
                onClick={() => {
                  setQuad(q.id);
                  if (SEGMENT_ROWS.some((row) => row.id === q.id) && !picked.includes(q.id)) toggle(q.id);
                }}
              >
                <strong>{q.icon}{q.title}</strong>
                <span>{q.meta}</span>
                <ul>{q.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              </button>
            ))}
            <span />
            <div className="s2-qaxis-x"><span>Low</span><span>Market Opportunity (₹ Lakh)</span><span>High</span></div>
          </div>
        </Panel>

        <Panel title="AI Recommended Interventions" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="stack" style={{ gap: 6 }}>
            <AiItem icon={<Target size={15} />}>Focus on 1,832 conventional NPK users (₹20 L opportunity) with retailer-led conversion drive.</AiItem>
            <AiItem icon={<FlaskConical size={15} />}>Conduct 12 demo plots across top 5 villages (coverage ~240 acres).</AiItem>
            <AiItem icon={<Users size={15} />}>Run cluster farmer meetings (≥15) in low-penetration villages (Golegaon, Dhanora).</AiItem>
            <AiItem icon={<MessageCircle size={15} />}>Offer crop-stage advisory &amp; nutrition schedule via WhatsApp to trial &amp; non-users (2,000+ farmers).</AiItem>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.32fr 1fr 0.83fr">
        <Panel title="Village Hotspots – Ambad">
          <div className="s2-mapwrap">
            <div className="s2-callouts">
              <Callout title="Golegaon" lines="(Score: 96)" onClick={() => pickVillage('Golegaon')} active={village === 'Golegaon'} />
              <Callout title="Ambad (HQ)" lines="(Score: 94)" onClick={() => pickVillage('Ambad (HQ)')} active={village === 'Ambad (HQ)'} />
            </div>
            <IndiaDistrictMap
              label="Village hotspots around Ambad, Jalna district"
              height={380}
              view="markers"
              talukas={{}}
              selected={VILLAGE_ID[village]}
              markerLegend={HOTSPOT_LEGEND}
              markers={HOTSPOTS.map((h) => {
                const scored = villages.find((v) => v.label === h.label);
                return {
                  id: VILLAGE_ID[h.label],
                  label: h.label,
                  color: hotspotColor(h.band),
                  info: <>Hotspot: <b>{h.band}</b>{scored ? <> · score <b>{scored.score}</b></> : null}</>,
                  ...(scored ? { onSelect: () => pickVillage(h.label) } : {}),
                };
              })}
            />
            <div className="s2-callouts">
              <Callout title="Dhanora" lines="(Score: 92)" onClick={() => pickVillage('Dhanora')} active={village === 'Dhanora'} />
              <Callout title="Pimpalgaon" lines="(Score: 88)" onClick={() => pickVillage('Pimpalgaon')} active={village === 'Pimpalgaon'} />
            </div>
          </div>
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            Selected: <strong>{village}</strong> — score {villages.find((v) => v.label === village)?.score ?? '—'}
          </p>
        </Panel>

        <Panel title="Target Segment Shortlist & Campaign Plan" subtitle="Tick segments to include in the campaign plan — totals update automatically.">
          <DataTable<SegRow>
            compact
            rows={SEGMENT_ROWS}
            highlight={(row) => row.id === quad}
            columns={[
              {
                key: 'pick', label: '', width: 26,
                render: (row) => <input type="checkbox" className="s2-chk" checked={picked.includes(row.id)} onChange={() => toggle(row.id)} aria-label={`Include ${row.segment}`} />,
              },
              { key: 'segment', label: 'Target Segment', render: (row) => <span className={cx(!picked.includes(row.id) && 's2-row-off')}><strong>{row.segment}</strong><br /><span className="small muted">({row.sub})</span></span> },
              { key: 'farmers', label: '# Farmers', align: 'right', render: (row) => row.farmers.toLocaleString('en-IN') },
              { key: 'acreage', label: 'Target Acreage', align: 'right', render: (row) => row.acreage.toLocaleString('en-IN') },
              { key: 'opp', label: 'Opportunity (₹ Lakh)', align: 'right', render: (row) => row.opp.toFixed(1) },
              { key: 'intervention', label: 'Suggested Intervention', render: (row) => <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ color: COLORS.green }}>{row.icon}</span><span className="small">{row.intervention}</span></span> },
            ]}
            total={{
              segment: <strong>Total (Targeted)</strong>,
              farmers: <strong>{totals.farmers.toLocaleString('en-IN')}</strong>,
              acreage: <strong>{totals.acreage.toLocaleString('en-IN')}</strong>,
              opp: <strong>{totals.opp.toFixed(1)}</strong>,
              intervention: <span className="small muted">{chosen.length} of {SEGMENT_ROWS.length} segments selected</span>,
            }}
          />
        </Panel>

        <Panel title="Competition & Switching Barriers">
          <HBars
            rows={SWITCHING_BARRIERS.map((b) => ({ ...b, display: `${b.value}%` }))}
            max={45}
          />
        </Panel>
      </Grid>

      <FlowFooter
        steps={[
          { label: 'Source: S2.2 Jalna District Intelligence', to: 's2.2' },
          { label: 'Ambad → Explore Target Segments', to: 's2.2' },
          { label: 'Current Screen: S2.3 Ambad Segmentation', current: true },
        ]}
        nextLabel="Recommended Next Screen:"
        next={{ label: 'S2.4 Competition & Channel Intelligence', to: 's2.4' }}
      />
      <p className="s2-footnote">Illustrative concept data | S2.2 → S2.3 → S2.4 connected user journey</p>
    </div>
  );
}

/* ---------------------------------------------------------------- S2.4 */

type CompRow = { product: string; icon: ReactNode; value: string; price: string; push: string; proof: string; ease: string; own?: boolean };

const COMPETITORS: CompRow[] = [
  { product: 'Croptek (Mahadhan)', icon: <Leaf size={15} />, value: 'High', price: 'Moderate', push: 'High', proof: 'High', ease: 'High', own: true },
  { product: 'Conventional NPK 24:24:0 Programme', icon: <FlaskConical size={15} />, value: 'Medium', price: 'High', push: 'Medium', proof: 'Medium', ease: 'Medium' },
  { product: 'Local Brand Balanced NPK', icon: <Boxes size={15} />, value: 'Medium', price: 'Low', push: 'Medium', proof: 'Low', ease: 'Medium' },
  { product: 'Premium Specialty Nutrition Programme', icon: <Sprout size={15} />, value: 'High', price: 'High', push: 'Medium', proof: 'High', ease: 'Moderate' },
];

type CohortRow = { cohort: string; icon: ReactNode; programme: string; difficulty: string; support: string; potential: string };

const COHORTS: CohortRow[] = [
  { cohort: 'Conventional NPK users', icon: <Users size={14} />, programme: 'Conventional NPK (24:24:0)', difficulty: 'Medium', support: 'High', potential: 'High' },
  { cohort: 'Non-users', icon: <Users size={14} />, programme: 'No structured programme', difficulty: 'High', support: 'Medium', potential: 'Medium' },
  { cohort: 'Trial users', icon: <FlaskConical size={14} />, programme: 'Trial / one-time use', difficulty: 'Low', support: 'High', potential: 'High' },
  { cohort: 'Partial programme users', icon: <Boxes size={14} />, programme: 'Other brand NPK (partial)', difficulty: 'Medium', support: 'Medium', potential: 'Medium-High' },
];

type StockRow = { village: string; retailers: number; status: string };

const STOCK: StockRow[] = [
  { village: 'Wadigaon', retailers: 14, status: 'Full' },
  { village: 'Dhanora', retailers: 12, status: 'Full' },
  { village: 'Ambad HQ', retailers: 10, status: 'Full' },
  { village: 'Pimpalgaon', retailers: 9, status: 'Partial' },
  { village: 'Tandulwadi', retailers: 7, status: 'Low' },
];

type PriorityRow = { village: string; cluster: string; issue: string; opportunity: string; action: string; icon: ReactNode };

const PRIORITY_VILLAGES: PriorityRow[] = [
  { village: 'Wadigaon', cluster: 'Shree Agri Seva, Patil Krushi Kendra (2)', issue: 'Price concern, need yield proof', opportunity: 'High influence, good farmer base (≈240 acres)', action: 'Retailer activation (price + yield proof)', icon: <Target size={14} /> },
  { village: 'Dhanora', cluster: 'Dhanora Agro Mart, Kisan Seva (2)', issue: 'Partial adoption, availability gaps', opportunity: 'Good influence, scope to scale (≈180 acres)', action: 'Demo + proof plot (with retailer support)', icon: <FlaskConical size={14} /> },
  { village: 'Ambad HQ', cluster: 'Ambad Krushi Centre, Maharashtra Agri (3)', issue: 'Brand satisfaction (current NPK)', opportunity: 'High influence cluster, larger potential (≈320 acres)', action: 'Retailer activation + farmer meeting', icon: <Users size={14} /> },
  { village: 'Pimpalgaon', cluster: 'Pimpalgaon Agri Stores, Sai Krushi (2)', issue: 'Limited availability', opportunity: 'Active farmers, conversion-ready (≈160 acres)', action: 'Stock replenishment + advisory follow-up', icon: <Package size={14} /> },
];

const PLAYBOOK = [
  { id: 'price', icon: <Target size={16} />, text: 'Counter price barrier with yield-proof messaging and simple economics during retailer meetings.', cta: 'Create Action', detail: 'Show ₹/acre economics: +11% bulb yield vs. 24:24:0 on 3 Ambad demo plots; cost difference recovered at 0.4 q/acre.' },
  { id: 'retail', icon: <Users size={16} />, text: 'Prioritize 18 high-influence retailers in Wadigaon, Dhanora and Ambad HQ for conversion push.', cta: 'Assign', detail: 'Assign to Territory Manager — Ambad; 18 retailers cover ~62% of conventional NPK sales in the taluka.' },
  { id: 'stock', icon: <Package size={16} />, text: 'Improve Croptek availability in 4 low-coverage pockets before demo burst.', cta: 'Create Action', detail: 'Pockets: Tandulwadi, Pimpalgaon and 2 outer villages — 28 stock-outs recorded last season.' },
  { id: 'whatsapp', icon: <MessageCircle size={16} />, text: 'Use trial-user follow-up plus WhatsApp advisory to accelerate repeat adoption.', cta: 'Create Action', detail: '771 trial users; stage-wise advisory at bulb initiation and bulb development triggers.' },
];

export function CompetitionChannel() {
  const { toast } = useNav();
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [pickedVillage, setPickedVillage] = useState('Wadigaon');

  const actOn = (id: string, cta: string) => {
    if (done.includes(id)) return;
    setDone((current) => [...current, id]);
    toast(cta === 'Assign' ? 'Assigned to Territory Manager — Ambad' : 'Action created and added to the conversion plan');
  };

  return (
    <div className="stack">
      <TopLine
        crumbs={[
          { label: 'S2.1 Crop × Geography Opportunity Atlas', to: 's2.1' },
          { label: 'S2.2 Jalna District / Taluka Intelligence', to: 's2.2' },
          { label: 'S2.3 Ambad Micro-Market Segmentation & Campaign Targeting', to: 's2.3' },
          { label: 'S2.4 Ambad Competition & Channel Intelligence' },
        ]}
      />
      <PageHeader
        title="Ambad Competition & Channel Intelligence"
        subtitle="Understand competitive pressure, retailer influence and channel readiness to improve Croptek onion conversion in Ambad."
        actions={
          <>
            <span className="s2-opened">Opened from S2.3: Clicked 'Analyze Competition &amp; Channel Barriers'</span>
            <Btn variant="primary" icon={<Plus size={14} />} to="s2.5">Generate Conversion Strategy</Btn>
            <Btn variant="gold" icon={<Sparkles size={14} />} onClick={() => toast('AI Conversion Brief for Ambad generated')}>Open AI Conversion Brief</Btn>
          </>
        }
      />

      <KpiRow>
        <Kpi icon={<Coins size={18} />} label="Estimated Opportunity" value="₹52 Lakh" sub="+8% vs. S2.2 (₹48 Lakh)" trend="up" spark />
        <Kpi icon={<Target size={18} />} label="Penetration Gap" value="28 pp" sub="-2 pp vs. S2.2 (30 pp)" trend="down" spark={[8, 7, 7, 6, 6, 5, 5, 4]} />
        <Kpi icon={<Store size={18} />} label="Active Retailers" value="74" sub="+5 vs. S2.2 (69)" trend="up" spark />
        <Kpi icon={<Users size={18} />} label="Conventional NPK Users" value="1,832" sub="+1% vs. S2.2 (1,820)" trend="up" spark />
        <Kpi icon={<MapPin size={18} />} label="Retailer-ready Villages" value="18" sub="+2 vs. S2.2 (16)" trend="up" spark />
        <Kpi icon={<BarChart3 size={18} />} label="Channel Readiness Score" value="79" sub="+4 vs. S2.2 (75)" trend="up" spark />
      </KpiRow>

      <Grid cols="1.3fr 1fr 1fr">
        <Panel title="Competitor Product Positioning – Ambad (Onion)" info>
          <DataTable<CompRow>
            compact
            rows={COMPETITORS}
            highlight={(row) => Boolean(row.own)}
            columns={[
              { key: 'product', label: 'Product / Programme', render: (row) => <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ color: COLORS.green }}>{row.icon}</span><strong>{row.product}</strong></span> },
              { key: 'value', label: 'Farmer-perceived Value (Agronomic)', align: 'center', render: (row) => <Rate v={row.value} /> },
              { key: 'price', label: 'Price Perception', align: 'center', render: (row) => <Rate v={row.price} inverse /> },
              { key: 'push', label: 'Retailer Push', align: 'center', render: (row) => <Rate v={row.push} /> },
              { key: 'proof', label: 'Yield Proof', align: 'center', render: (row) => <Rate v={row.proof} /> },
              { key: 'ease', label: 'Ease of Recommendation', align: 'center', render: (row) => <Rate v={row.ease} /> },
            ]}
          />
        </Panel>

        <Panel title="Farmer Switching Barriers" info>
          <HBars rows={SWITCHING_BARRIERS.map((b) => ({ ...b, display: `${b.value}%` }))} max={45} />
          <div className="warn-box small" style={{ marginTop: 10 }}>
            <strong>Interpretation:</strong> Price and brand satisfaction (70% combined) are the key barriers; reduce price concern and build stronger value proof.
          </div>
        </Panel>

        <Panel title="AI Conversion Playbook" icon={<Sparkles size={15} />} info className="ai-panel">
          {PLAYBOOK.map((item) => (
            <div key={item.id} className="s2-play">
              <span style={{ color: COLORS.green }}>{item.icon}</span>
              <span>{item.text}</span>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <Btn small variant={done.includes(item.id) ? 'outline' : 'primary'} icon={done.includes(item.id) ? <CheckIcon size={12} /> : undefined} onClick={() => actOn(item.id, item.cta)}>
                  {done.includes(item.id) ? (item.cta === 'Assign' ? 'Assigned' : 'Created') : item.cta}
                </Btn>
                <Btn small onClick={() => setOpen(open === item.id ? null : item.id)}>{open === item.id ? 'Hide Detail' : 'Open Detail'}</Btn>
              </div>
              {open === item.id && <div className="s2-play-detail">{item.detail}</div>}
            </div>
          ))}
        </Panel>
      </Grid>

      <Grid cols="1.15fr 1.05fr 1.1fr">
        <Panel title="Retailer Influence Map – Ambad" info>
          <div className="s2-mapwrap">
            <div className="s2-callouts">
              <Callout title="Wadigaon" lines="High influence / Medium stock" onClick={() => setPickedVillage('Wadigaon')} active={pickedVillage === 'Wadigaon'} />
              <Callout title="Ambad (HQ)" lines="High influence / Full stock" onClick={() => setPickedVillage('Ambad HQ')} active={pickedVillage === 'Ambad HQ'} />
              <Callout title="Tandulwadi" lines="Medium influence / Low stock" onClick={() => setPickedVillage('Tandulwadi')} active={pickedVillage === 'Tandulwadi'} />
            </div>
            <IndiaDistrictMap
              label="Retailer influence around Ambad, Jalna district"
              height={360}
              view="markers"
              talukas={{}}
              selected={VILLAGE_ID[pickedVillage]}
              markerLegend={[
                { label: 'High influence (score ≥ 80)', color: hotspotColor('High') },
                { label: 'Medium (60–79)', color: hotspotColor('Medium') },
                { label: 'Low (< 60)', color: hotspotColor('Low') },
              ]}
              markers={INFLUENCE.map((r) => ({
                id: VILLAGE_ID[r.label],
                label: r.label,
                color: hotspotColor(r.band),
                info: r.detail ? <>{r.detail}</> : <>Influence: <b>{r.band}</b></>,
                ...(r.detail ? { onSelect: () => setPickedVillage(r.label) } : {}),
              }))}
            />
            <div className="s2-callouts">
              <Callout title="Dhanora" lines="Good influence / Full stock" onClick={() => setPickedVillage('Dhanora')} active={pickedVillage === 'Dhanora'} />
              <Callout title="Pimpalgaon" lines="Good influence / Medium stock" onClick={() => setPickedVillage('Pimpalgaon')} active={pickedVillage === 'Pimpalgaon'} />
            </div>
          </div>
        </Panel>

        <Panel title="Competitor Conversion Matrix – Ambad" info>
          <DataTable<CohortRow>
            compact
            rows={COHORTS}
            columns={[
              { key: 'cohort', label: 'Target Farmer Cohort', render: (row) => <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ color: COLORS.green }}>{row.icon}</span><strong>{row.cohort}</strong></span> },
              { key: 'programme', label: 'Current Programme' },
              { key: 'difficulty', label: 'Switching Difficulty', align: 'center', render: (row) => <Rate v={row.difficulty} inverse /> },
              { key: 'support', label: 'Retailer Support', align: 'center', render: (row) => <Rate v={row.support} /> },
              { key: 'potential', label: 'Conversion Potential', align: 'center', render: (row) => <Rate v={row.potential} /> },
            ]}
          />
        </Panel>

        <Panel title="Channel Readiness – Ambad" info>
          <Grid cols="0.65fr 1fr" gap={10}>
            <div className="stack" style={{ gap: 7 }}>
              <div className="row-between small"><strong>Readiness Score</strong><strong>79</strong></div>
              <div className="progress"><div className="progress-fill fill-green" style={{ width: '79%' }} /></div>
              <div className="row-between small"><span className="row"><Store size={13} color={COLORS.green} />Retailers stocking Croptek</span><b>46 / 74</b></div>
              <div className="row-between small"><span className="row"><Users size={13} color={COLORS.green} />High-influence retailers</span><b>18</b></div>
              <div className="row-between small"><span className="row"><MapPin size={13} color={COLORS.green} />Villages with adequate availability</span><b>14 / 22</b></div>
              <div className="row-between small"><span className="row"><AlertTriangle size={13} color={COLORS.amber} />Low-coverage pockets</span><b>4 villages</b></div>
              <div className="row-between small"><span className="row"><FlaskConical size={13} color={COLORS.green} />Demo-support retailers identified</span><b>12</b></div>
            </div>
            <DataTable<StockRow>
              compact
              rows={STOCK}
              highlight={(row) => row.village === pickedVillage}
              onRowClick={(row) => setPickedVillage(row.village)}
              columns={[
                { key: 'village', label: 'Village (Key)' },
                { key: 'retailers', label: 'Retailers', align: 'right' },
                { key: 'status', label: 'Stocking Status', align: 'center', render: (row) => <Pill tone={row.status === 'Full' ? 'green' : row.status === 'Partial' ? 'amber' : 'red'}>{row.status}</Pill> },
              ]}
            />
          </Grid>
        </Panel>
      </Grid>

      <Panel title="Priority Retailer & Village Shortlist – Conversion Strategy Preparation" info>
        <DataTable<PriorityRow>
          compact
          rows={PRIORITY_VILLAGES}
          highlight={(row) => row.village === pickedVillage}
          onRowClick={(row) => setPickedVillage(row.village)}
          columns={[
            { key: 'village', label: 'Village', render: (row) => <span className="row" style={{ flexWrap: 'nowrap' }}><MapPin size={14} color={COLORS.green} /><strong>{row.village}</strong></span> },
            { key: 'cluster', label: 'Retailer Cluster / Key Retailers' },
            { key: 'issue', label: 'Key Issue / Barrier' },
            { key: 'opportunity', label: 'Opportunity' },
            { key: 'action', label: 'Suggested Next Action', render: (row) => <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ color: COLORS.green }}>{row.icon}</span>{row.action}</span> },
          ]}
        />
      </Panel>

      <FlowFooter
        steps={[
          { label: 'Source: S2.3 Ambad Micro-Market Segmentation & Campaign Targeting', to: 's2.3' },
          { label: 'S2.4 Ambad Competition & Channel Intelligence (Current Screen)', current: true },
          { label: "On click of 'Generate Conversion Strategy' → Next S2.5", to: 's2.5' },
        ]}
        nextLabel="Recommended Next Screen:"
        next={{ label: 'S2.5 — Opportunity Prioritization & Campaign Recommendations', to: 's2.5' }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- S2.5 */

type PrioRow = { n: number; segment: string; opp: string; share: string; feas: string; feasPct: number; chan: string; chanPct: number; score: number; campaign: string };

const PRIO: PrioRow[] = [
  { n: 1, segment: 'Conventional NPK Users', opp: '₹20.0 Lakh', share: '(38%)', feas: 'High', feasPct: 85, chan: 'High', chanPct: 85, score: 94, campaign: 'Retailer-led Croptek Conversion' },
  { n: 2, segment: 'Non-users', opp: '₹11.0 Lakh', share: '(22%)', feas: 'Medium', feasPct: 55, chan: 'Medium-High', chanPct: 70, score: 82, campaign: 'Demonstration-led Acquisition' },
  { n: 3, segment: 'Trial Users', opp: '₹8.0 Lakh', share: '(16%)', feas: 'High', feasPct: 85, chan: 'Medium', chanPct: 55, score: 78, campaign: 'Trial-to-Repeat Adoption' },
  { n: 4, segment: 'Partial Programme Users', opp: '₹7.0 Lakh', share: '(14%)', feas: 'Medium', feasPct: 55, chan: 'Medium', chanPct: 55, score: 71, campaign: 'Programme Completion & Upsell' },
];

const STRATEGIES = [
  {
    id: 1, title: 'Retailer-Led Croptek Conversion', priority: 'High Priority', tone: 'amber' as Tone, icon: <Store size={18} />,
    target: 'Conventional NPK users (1,832 farmers)',
    interventions: 'Retailer training, village meetings, price-value education, targeted demos',
    detail: 'Owner: Territory Manager Ambad · 18 high-influence retailers · Budget share ~45% · Expected 620 adopters.',
  },
  {
    id: 2, title: 'Demonstration-Led Acquisition', priority: 'High Priority', tone: 'amber' as Tone, icon: <Sprout size={18} />,
    target: 'Non-users & price-sensitive farmers (1,061)',
    interventions: 'Demo plots, field days, result sharing, advisory communication',
    detail: '12 demo plots across Golegaon, Dhanora, Pimpalgaon · 2 field days at bulb development · Budget share ~35%.',
  },
  {
    id: 3, title: 'Trial-to-Repeat Adoption', priority: 'Medium Priority', tone: 'lime' as Tone, icon: <RefreshCw size={18} />,
    target: 'Trial users (771 farmers)',
    interventions: 'Crop-stage advisories, follow-up visits, retailer referrals, programme completion messaging',
    detail: 'WhatsApp stage-wise advisory + 2 follow-up visits per farmer · Budget share ~20% · Expected repeat rate 42%.',
  },
];

type OutcomeRow = { scenario: string; reach: string; trials: string; adoption: string; demand: string; revenue: string; roi: string };

const OUTCOMES: OutcomeRow[] = [
  { scenario: 'Conservative', reach: '3,000', trials: '600 (20%)', adoption: '720 (24%)', demand: '144 MT', revenue: '₹36 Lakh', roi: '2.5×' },
  { scenario: 'Base Case (Recommended)', reach: '3,600', trials: '900 (25%)', adoption: '1,044 (29%)', demand: '209 MT', revenue: '₹52 Lakh', roi: '3.3×' },
  { scenario: 'Optimistic', reach: '4,200', trials: '1,260 (30%)', adoption: '1,386 (33%)', demand: '277 MT', revenue: '₹69 Lakh', roi: '4.1×' },
];

const TIMELINE = [
  { stage: 'Pre-plant', month: '(Nov)', items: ['Retailer activation', 'Booking drive', 'Meeting'] },
  { stage: 'Vegetative', month: '(Dec–Jan)', items: ['Demo plots', 'Advisory burst', 'Farmer meetings'] },
  { stage: 'Bulb Dev.', month: '(Feb)', items: ['Follow-ups', 'Yield & quality proof', 'Re-trial push'] },
  { stage: 'Maturity', month: '(Mar)', items: ['Adoption closure', 'Repeat plan', 'Programme completion'] },
];

const levelColor = (level: string) => (level === 'High' ? COLORS.green : level === 'Medium-High' ? COLORS.mid : COLORS.yellow);

export function CampaignRecommendations() {
  const { toast } = useNav();
  const [segment, setSegment] = useState(1);
  const [strategy, setStrategy] = useState<number | null>(null);
  const [scenario, setScenario] = useState('Base Case (Recommended)');
  const [rationale, setRationale] = useState(false);
  const current = OUTCOMES.find((row) => row.scenario === scenario) ?? OUTCOMES[1];

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { label: 'S2.1 Opportunity Atlas', to: 's2.1' },
          { label: 'S2.2 District Intelligence', to: 's2.2' },
          { label: 'S2.3 Micro-Market Segmentation', to: 's2.3' },
          { label: 'S2.4 Competition & Channel Intelligence', to: 's2.4' },
          { label: 'S2.5 Campaign Recommendations' },
        ]}
      />
      <PageHeader
        back="s2.4"
        title="Opportunity Prioritization & Campaign Recommendations"
        subtitle="Convert market and channel insights into a targeted campaign plan to drive Croptek (Onion) adoption in Ambad, Jalna"
      />
      <SourceBar>
        <MousePointerClick size={14} />
        <strong>Source Click:</strong>
        <span className="code-chip">S2.4 Competition &amp; Channel Intelligence → Generate Conversion Strategy</span>
      </SourceBar>

      <KpiRow>
        <Kpi icon={<Coins size={20} />} label="Market Opportunity" value="₹52 Lakh" />
        <Kpi icon={<Target size={20} />} label="Opportunity Score" value="94" badge={<span className="small trend-up">▲ +2 vs. Jalna Avg.</span>} />
        <Kpi icon={<Users size={20} />} label="Priority Farmer Cohort" value="1,832" sub="Conventional NPK Users" />
        <Kpi icon={<BarChart3 size={20} />} label="Current Penetration" value="34%" badge={<Pill tone="amber">28 pp Gap to Potential</Pill>} />
        <Kpi icon={<Store size={20} />} label="Channel Readiness" value="79 / 100" />
        <Kpi icon={<Megaphone size={20} />} label="Campaigns Recommended" value="3" />
      </KpiRow>

      <Grid cols="2.35fr 1fr">
        <div className="stack">
          <Grid cols="1.25fr 1fr">
            <Panel title="Opportunity Prioritization – Farmer Segments">
              <DataTable<PrioRow>
                compact
                rows={PRIO}
                highlight={(row) => row.n === segment}
                onRowClick={(row) => setSegment(row.n)}
                columns={[
                  { key: 'n', label: '#', render: (row) => <span className="rank" style={row.n === 1 ? { background: COLORS.green, color: '#fff' } : undefined}>{row.n}</span> },
                  { key: 'segment', label: 'Farmer Segment', render: (row) => <strong>{row.segment}</strong> },
                  { key: 'opp', label: 'Market Opportunity', align: 'center', render: (row) => <span>{row.opp}<br /><span className="small muted">{row.share}</span></span> },
                  { key: 'feas', label: 'Conversion Feasibility', render: (row) => <Meter label={row.feas} pct={row.feasPct} color={levelColor(row.feas)} /> },
                  { key: 'chan', label: 'Channel Readiness', render: (row) => <Meter label={row.chan} pct={row.chanPct} color={levelColor(row.chan)} /> },
                  { key: 'score', label: 'Priority Score', align: 'center', render: (row) => <span className="num-badge" style={row.n === 1 ? undefined : { background: '#eef0ec', color: '#1f3d25' }}>{row.score}</span> },
                  { key: 'campaign', label: 'Recommended Campaign' },
                ]}
              />
            </Panel>

            <Panel title="Recommended Campaign Strategies">
              {STRATEGIES.map((s) => (
                <div key={s.id} className="s2-strategy" style={s.id === segment ? { background: '#f6fbf1' } : undefined}>
                  <span className="s2-strategy-icon">{s.icon}</span>
                  <div>
                    <h4>{s.id}. {s.title}</h4>
                    <ul>
                      <li><strong>Target:</strong> {s.target}</li>
                      <li><strong>Interventions:</strong> {s.interventions}</li>
                    </ul>
                  </div>
                  <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
                    <Pill tone={s.tone}>{s.priority}</Pill>
                    <Btn small onClick={() => setStrategy(strategy === s.id ? null : s.id)}>{strategy === s.id ? 'Hide Strategy' : 'View Strategy ›'}</Btn>
                  </div>
                  {strategy === s.id && <div className="s2-detail highlight-box small">{s.detail}</div>}
                </div>
              ))}
            </Panel>
          </Grid>

          <Grid cols="0.9fr 1fr 1.05fr">
            <Panel title="Farmer Switching Barriers">
              <HBars rows={SWITCHING_BARRIERS.map((b) => ({ ...b, display: `${b.value}%` }))} max={45} />
            </Panel>
            <Panel title="Campaign Budget & Intervention Mix" actions={<Pill tone="amber" solid>₹8.0 Lakh</Pill>}>
              <p className="small muted" style={{ margin: '0 0 6px' }}>Proposed Campaign Budget (Illustrative)</p>
              <Donut
                size={140}
                thickness={28}
                center="₹8.0"
                sub="Lakh"
                segments={[
                  { label: 'Farmer demonstrations', value: 30, color: COLORS.dark, note: '₹2.4 L (30%)' },
                  { label: 'Retailer activation', value: 25, color: COLORS.green, note: '₹2.0 L (25%)' },
                  { label: 'Farmer meetings', value: 20, color: COLORS.mid, note: '₹1.6 L (20%)' },
                  { label: 'Digital advisory', value: 10, color: COLORS.yellow, note: '₹0.8 L (10%)' },
                  { label: 'Field follow-ups', value: 10, color: COLORS.light, note: '₹0.8 L (10%)' },
                  { label: 'Contingency', value: 5, color: COLORS.grey, note: '₹0.4 L (5%)' },
                ]}
              />
            </Panel>
            <Panel title="Intervention Timeline (Onion Crop Cycle)">
              <div className="s2-chev">
                {TIMELINE.map((t) => (
                  <div key={t.stage}>
                    <div className="s2-chev-head">{t.stage}<br />{t.month}</div>
                    <ul>{t.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </Panel>
          </Grid>

          <Panel
            title={<>Expected Campaign Outcomes <span className="muted small" style={{ fontWeight: 400 }}>(Ambad – Croptek, Onion)</span></>}
            actions={<span className="small muted">Click a scenario to select · Selected: <strong>{current.scenario}</strong></span>}
          >
            <DataTable<OutcomeRow>
              compact
              rows={OUTCOMES}
              highlight={(row) => row.scenario === scenario}
              onRowClick={(row) => {
                setScenario(row.scenario);
                toast(`${row.scenario} scenario selected — ${row.adoption} adopters, ${row.demand} demand, ROI ${row.roi}`);
              }}
              columns={[
                { key: 'scenario', label: 'Scenario', render: (row) => <strong>{row.scenario}</strong> },
                { key: 'reach', label: 'Target Farmer Reach', align: 'right' },
                { key: 'trials', label: 'Expected Trials', align: 'right' },
                { key: 'adoption', label: 'Expected Adoption', align: 'right' },
                { key: 'demand', label: 'Incremental Demand', align: 'right' },
                { key: 'revenue', label: 'Incremental Revenue', align: 'right' },
                { key: 'roi', label: 'Campaign ROI', align: 'right', render: (row) => <strong>{row.roi}</strong> },
              ]}
            />
            <p className="s2-footnote" style={{ marginTop: 6 }}>All financials are illustrative.</p>
          </Panel>
        </div>

        <Panel title="AI Campaign Strategy Brief" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="highlight-box row" style={{ flexWrap: 'nowrap', marginBottom: 6 }}>
            <Target size={22} color={COLORS.dark} />
            <strong style={{ color: COLORS.dark }}>Prioritize retailer-led Croptek conversion in Ambad, supported by demonstration-led value communication.</strong>
          </div>
          <div className="s2-brief-q"><BarChart3 size={16} color={COLORS.green} /><span><b>Why this campaign?</b> Addresses top barriers – price perception (42%) and brand preference (28%).</span></div>
          <div className="s2-brief-q"><Users size={16} color={COLORS.green} /><span><b>Which farmer segments?</b> Focus on 1,832 conventional NPK users; support non-users (1,061).</span></div>
          <div className="s2-brief-q"><MapIcon size={16} color={COLORS.green} /><span><b>Which villages?</b> Golegaon, Dhanora, Pimpalgaon and 6 other high-potential villages.</span></div>
          <div className="s2-brief-q"><TrendingUp size={16} color={COLORS.green} /><span><b>Expected business benefit?</b> +24 pp adoption, ~₹52 Lakh opportunity realization (base case).</span></div>
          <div className="s2-brief-q"><Settings2 size={16} color={COLORS.green} /><span><b>Operational dependencies?</b> Retailer activation (18 high-influence retailers), timely product availability and field team coverage.</span></div>
          {rationale && (
            <div className="highlight-box small" style={{ marginTop: 8 }}>
              <div className="row" style={{ marginBottom: 4 }}><Landmark size={13} /><strong>Rationale</strong></div>
              Ambad scores 94 (highest in Jalna) with a 28 pp penetration gap. 62% of conventional NPK volume flows through 18 retailers, so retailer-led conversion gives the fastest reach; demos de-risk the price barrier for non-users.
            </div>
          )}
          <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
            <Btn className="s2-cta" onClick={() => setRationale((v) => !v)}>{rationale ? 'Hide Rationale' : 'View Rationale'}</Btn>
            <Btn className="s2-cta" icon={<PieChart size={14} />} onClick={() => toast('Comparing 3 recommended strategies on reach, cost per adopter and ROI')}>Compare Strategies</Btn>
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn variant="primary" className="s2-cta" icon={<Wand2 size={16} />} to="s4.2">Create Campaign →</Btn>
          </div>
          <p className="s2-footnote" style={{ marginTop: 6 }}>On clicking Create Campaign → Open S4.2 Campaign Creation Wizard</p>
        </Panel>
      </Grid>

      <FlowFooter
        steps={[
          { label: 'S2.1 Opportunity Atlas', to: 's2.1' },
          { label: 'S2.2 District Intelligence', to: 's2.2' },
          { label: 'S2.3 Micro-Market Segmentation', to: 's2.3' },
          { label: 'S2.4 Competition & Channel Intelligence', to: 's2.4' },
          { label: 'S2.5 Campaign Recommendations (Current)', current: true },
        ]}
        next={{ label: 'S4.2 Campaign Creation Wizard', to: 's4.2' }}
      />
    </div>
  );
}

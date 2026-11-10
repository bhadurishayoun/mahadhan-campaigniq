import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Boxes, Calendar, CalendarClock, CheckCircle2, ChevronRight, CircleDollarSign,
  ClipboardCheck, CloudRain, Download, ExternalLink, FileText, Filter, Info, Layers, LineChart, Megaphone,
  MapPin, Package, Plus, Send, Sparkles, Sprout, Target, TrendingUp, UserCheck, Users, Wallet, Wheat,
} from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { useDataset } from '../data/datasets';
import {
  AiItem, Breadcrumbs, Btn, COLORS, DataTable, Donut, FlowFooter, Funnel, Grid, HBars, Kpi, KpiRow, PageHeader,
  Panel, Pill, Progress, SourceBar, VBars, clamp, cx, useChartHeight, useWidth, type Tone,
} from '../ui';
import { IndiaDistrictMap, type MapTone } from '../map/IndiaDistrictMap';
import './s1.css';

/* ------------------------------------------------------------------ shared helpers */

const riskTone = (risk: string): Tone => (risk === 'High' ? 'red' : risk === 'Medium' || risk === 'Moderate' ? 'amber' : 'green');

function FootNote({ role = true }: { role?: boolean }) {
  return (
    <div className="s1-foot-note">
      <span><Info size={12} /> Data last refreshed 2 hours ago</span>
      <span>All financials are illustrative</span>
      {role && <span><UserCheck size={12} /> Role: National Campaign Head</span>}
    </div>
  );
}

function FlowStrip({ items }: { items: { small: string; label: string; to?: ScreenId; current?: boolean; icon?: ReactNode }[] }) {
  const { go } = useNav();
  return (
    <div className="s1-flowstrip">
      <span className="s1-flow-tag">Story Flow</span>
      {items.map((item, index) => (
        <span key={item.label} style={{ display: 'contents' }}>
          {index > 0 && <span className="s1-flow-arrow"><ArrowRight size={14} /></span>}
          {item.to ? (
            <button type="button" className={cx('s1-flow-box', item.current && 'current')} onClick={() => go(item.to!)}>
              {item.icon}
              <span><small>{item.small}</small><strong>{item.label}</strong></span>
            </button>
          ) : (
            <div className={cx('s1-flow-box', item.current && 'current')}>
              {item.icon}
              <span><small>{item.small}</small><strong>{item.label}</strong></span>
            </div>
          )}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ SVG charts */

type ScatterPoint = { label: string; lines: string[]; x: number; y: number; r: number; color: string };

function ScatterChart({ points, onPick }: { points: ScatterPoint[]; onPick: (p: ScatterPoint) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>(330);
  const [hover, setHover] = useState<string | null>(null);
  // Drawn at the panel's real width (min 280) so labels stay ~9-10 px on every screen; top padding leaves
  // room for the stacked bubble labels so none are clipped.
  const tall = useChartHeight(0);
  const W = clamp(width, 280, 1400); const H = tall || clamp(Math.round(W * 0.62), 220, 300); const L = 34; const B = 34; const T = 30; const R = 40;
  const sx = (x: number) => L + (x / 1.2) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - 0.5) / 3) * (H - T - B);
  const yTicks = [0.5, 1, 1.5, 2, 2.5, 3, 3.5];
  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
  return (
    <div ref={ref}>
    <svg className="s1-chart" viewBox={`0 0 ${W} ${H}`}>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#edf1ea" />
          <text x={L - 5} y={sy(t) + 3} textAnchor="end">{t.toFixed(1)}</text>
        </g>
      ))}
      {xTicks.map((t) => <text key={t} x={sx(t)} y={H - B + 12} textAnchor="middle">{t.toFixed(1)}</text>)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#9aa59a" />
      <line x1={L} x2={L} y1={T} y2={H - B} stroke="#9aa59a" />
      <text x={(W + L) / 2} y={H - 4} textAnchor="middle" className="lbl">Campaign Spend (₹ Cr)</text>
      <text x={10} y={(H - B) / 2} textAnchor="middle" className="lbl" transform={`rotate(-90 10 ${(H - B) / 2})`}>Campaign ROI (x)</text>
      {points.map((p, index) => (
        <g
          key={p.label}
          className={cx('pt', hover && hover !== p.label && 'pt-dim')}
          style={{ animationDelay: `${index * 80}ms` }}
          onClick={() => onPick(p)}
          onMouseEnter={() => setHover(p.label)}
          onMouseLeave={() => setHover(null)}
          data-tip={`${p.label}: spend ₹${p.x} Cr · ROI ${p.y}x — click for details`}
        >
          <circle cx={sx(p.x)} cy={sy(p.y)} r={hover === p.label ? p.r + 2 : p.r} fill={p.color} opacity={0.9} />
          {p.lines.map((line, i) => (
            <text key={line} x={clamp(sx(p.x), L + 30, W - 34)} y={sy(p.y) - p.r - 4 - (p.lines.length - 1 - i) * 9} textAnchor="middle" className="lbl">{line}</text>
          ))}
        </g>
      ))}
    </svg>
    </div>
  );
}

type ComboDatum = { label: string; a: number; b?: number; line: number; aText?: string; bText?: string };

function ComboChart({ data, aMax, lineMax, aLabel, bLabel, lineLabel, yLabel, yTicks, lineTicks, height = 190, aColor = COLORS.dark }: {
  data: ComboDatum[];
  aMax: number;
  lineMax: number;
  aLabel: string;
  bLabel?: string;
  lineLabel: string;
  yLabel: string;
  yTicks: number[];
  lineTicks: number[];
  height?: number;
  aColor?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const [hover, setHover] = useState<number | null>(null);
  // Real-pixel width: on a phone the plot narrows instead of the whole chart (and its text) shrinking.
  const W = clamp(width, 280, 1400); const H = useChartHeight(height); const L = 44; const R = 40; const T = 18; const B = 26;
  const plotH = H - T - B;
  const band = (W - L - R) / data.length;
  const sy = (v: number) => T + plotH - (v / aMax) * plotH;
  const ly = (v: number) => T + plotH - (v / lineMax) * plotH;
  const hasB = data.some((d) => d.b !== undefined);
  const bw = Math.min(band * (hasB ? 0.3 : 0.5), 70);
  const cx0 = (i: number) => L + band * i + band / 2;
  const linePts = data.map((d, i) => `${cx0(i)},${ly(d.line)}`).join(' ');
  return (
    <div ref={ref}>
      <svg className="s1-chart" viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(null)}>
        {hover !== null && <rect x={L + band * hover} y={T} width={band} height={plotH} className="s1-band-hover" />}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#edf1ea" />
            <text x={L - 6} y={sy(t) + 3} textAnchor="end">{t.toFixed(1)}</text>
          </g>
        ))}
        {lineTicks.map((t) => <text key={t} x={W - R + 6} y={ly(t) + 3}>{t}%</text>)}
        <text x={10} y={T + plotH / 2} textAnchor="middle" className="lbl" transform={`rotate(-90 10 ${T + plotH / 2})`}>{yLabel}</text>
        {data.map((d, i) => {
          const x = cx0(i);
          const ax = hasB ? x - bw - 2 : x - bw / 2;
          return (
            <g
              key={d.label}
              className="s1-combo-group"
              onMouseEnter={() => setHover(i)}
              data-tip={`${d.label} · ${aLabel}: ${d.aText ?? d.a}${d.b !== undefined && bLabel ? ` · ${bLabel}: ${d.bText ?? d.b}` : ''} · ${lineLabel}: ${d.line}%`}
            >
              <rect x={L + band * i} y={T} width={band} height={plotH + B} fill="transparent" />
              <rect className="s1-grow" style={{ animationDelay: `${i * 60}ms` }} x={ax} y={sy(d.a)} width={bw} height={T + plotH - sy(d.a)} fill={aColor} rx={2} />
              <text x={ax + bw / 2} y={hasB ? sy(d.a) - 4 : sy(d.a) + 14} textAnchor="middle" className="val" style={hasB ? undefined : { fill: '#fff' }}>{d.aText ?? d.a}</text>
              {d.b !== undefined && (
                <>
                  <rect className="s1-grow" style={{ animationDelay: `${i * 60 + 30}ms` }} x={x + 2} y={sy(d.b)} width={bw} height={T + plotH - sy(d.b)} fill={COLORS.yellow} rx={2} />
                  <text x={x + 2 + bw / 2} y={sy(d.b) - 4} textAnchor="middle" className="val">{d.bText ?? d.b}</text>
                </>
              )}
              <text x={x} y={H - 8} textAnchor="middle" className="lbl">{d.label}</text>
            </g>
          );
        })}
        <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#9aa59a" />
        <polyline className="s1-draw" pathLength={1} points={linePts} fill="none" stroke={COLORS.mid} strokeWidth={2} pointerEvents="none" />
        {data.map((d, i) => (
          <g key={d.label} pointerEvents="none">
            <circle cx={cx0(i)} cy={ly(d.line)} r={hover === i ? 5 : 3.5} fill="#fff" stroke={COLORS.green} strokeWidth={2} />
            <text x={cx0(i)} y={ly(d.line) - 7} textAnchor="middle" className="val">{d.line}%</text>
          </g>
        ))}
      </svg>
      <ul className="s1-chart-legend">
        <li><i style={{ background: aColor }} />{aLabel}</li>
        {bLabel && <li><i style={{ background: COLORS.yellow }} />{bLabel}</li>}
        <li><i className="line" style={{ background: COLORS.mid }} />{lineLabel}</li>
      </ul>
    </div>
  );
}

function TrendChart({ months, series }: { months: string[]; series: { label: string; color: string; values: number[] }[] }) {
  const [ref, width] = useWidth<HTMLDivElement>(420);
  const W = clamp(width, 280, 1000); const H = useChartHeight(200); const L = 34; const R = 50; const T = 12; const B = 24;
  const plotH = H - T - B;
  const sx = (i: number) => L + 20 + (i * (W - L - R - 40)) / (months.length - 1);
  const sy = (v: number) => T + plotH - (v / 50) * plotH;
  return (
    <div ref={ref}>
      <svg className="s1-chart" viewBox={`0 0 ${W} ${H}`}>
        {[0, 10, 20, 30, 40, 50].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#edf1ea" />
            <text x={L - 6} y={sy(t) + 3} textAnchor="end">{t}%</text>
          </g>
        ))}
        {months.map((m, i) => <text key={m} x={sx(i)} y={H - 6} textAnchor="middle" className="lbl">{m}</text>)}
        {series.map((s) => {
          const last = s.values[s.values.length - 1];
          return (
            <g key={s.label}>
              <polyline className="s1-draw" pathLength={1} fill="none" stroke={s.color} strokeWidth={2.2} points={s.values.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')} />
              {s.values.map((v, i) => (
                <circle key={i} className="s1-dot" cx={sx(i)} cy={sy(v)} r={3.5} fill="#fff" stroke={s.color} strokeWidth={2} data-tip={`${s.label} · ${months[i]}: ${v}%`} />
              ))}
              <rect x={sx(s.values.length - 1) + 8} y={sy(last) - 9} width={34} height={18} rx={4} fill={s.color} />
              <text x={sx(s.values.length - 1) + 25} y={sy(last) + 4} textAnchor="middle" style={{ fill: '#fff', fontWeight: 700, fontSize: 10 }}>{last}%</text>
            </g>
          );
        })}
      </svg>
      <ul className="s1-chart-legend">
        {series.map((s) => <li key={s.label}><i className="line" style={{ background: s.color }} />{s.label}</li>)}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ India map */

type StateKey = 'Gujarat' | 'Maharashtra' | 'Karnataka' | 'Telangana' | 'Andhra Pradesh';

const STATE_INFO: Record<StateKey, { text: string; value: string; coverage: string; crop: string }> = {
  Gujarat: { text: 'Opportunity', value: '₹2.9 Cr', coverage: '51%', crop: 'Cotton & groundnut' },
  Maharashtra: { text: 'Onion opportunity', value: '₹5.8 Cr', coverage: '42%', crop: 'Onion (Jalna, Dhule, Nashik)' },
  Karnataka: { text: 'Sugarcane nutrition opportunity', value: '₹4.1 Cr', coverage: '46%', crop: 'Sugarcane' },
  Telangana: { text: 'Opportunity', value: '₹2.6 Cr', coverage: '44%', crop: 'Cotton & maize' },
  'Andhra Pradesh': { text: 'Horticulture specialty opportunity', value: '₹3.9 Cr', coverage: '38%', crop: 'Horticulture' },
};
/** Market-potential band per state (same bands as the Market Potential legend: >=5, 3-5, 1-3, <1 Rs Cr). */
const STATE_TONE: Record<StateKey, MapTone> = { Maharashtra: 4, Karnataka: 3, 'Andhra Pradesh': 3, Gujarat: 2, Telangana: 2 };

function IndiaMap({ selected, onSelect }: { selected: StateKey; onSelect: (s: StateKey) => void }) {
  const go = useNav().go;
  const states = Object.fromEntries((Object.keys(STATE_INFO) as StateKey[]).map((key) => [key, {
    tone: STATE_TONE[key],
    info: <>{STATE_INFO[key].text}: <b>{STATE_INFO[key].value}</b> · coverage {STATE_INFO[key].coverage} · {STATE_INFO[key].crop}</>,
    onSelect: () => onSelect(key),
  }]));
  const onion = { info: 'Onion opportunity cluster (Maharashtra: ₹5.8 Cr, 42% coverage)', action: { label: 'Drill into Jalna / Ambad', run: () => go('s2.1') } };
  return (
    <IndiaDistrictMap
      label="Crop × geography campaign opportunity across India"
      view="india"
      focus={{ state: selected }}
      states={states}
      markers={[{ id: 'jalna', ...onion }, { id: 'dhule', ...onion }, { id: 'nashik', ...onion }]}
      scale={{ title: 'Market potential (₹ Cr)', items: [{ label: '≥ 5.0', tone: 4 }, { label: '3.0–5.0', tone: 3 }, { label: '1.0–3.0', tone: 2 }, { label: '< 1.0', tone: 0 }] }}
      height={380}
    />
  );
}

/* ------------------------------------------------------------------ portfolio data */

type CampaignRow = {
  name: string;
  objective: string;
  crop: string;
  geography: string;
  region: string;
  budget: string;
  stage: string;
  progress: number;
  trial: string;
  risk: string;
  roi: string;
  next: string;
};

const CAMPAIGNS: CampaignRow[] = [
  { name: 'Croptek Onion Adoption', objective: 'Competitive conversion', crop: 'Onion', geography: 'Dhule & Jalna, MH', region: 'Maharashtra', budget: '₹0.80 Cr', stage: 'Execute', progress: 72, trial: '27%*', risk: 'Medium', roi: '2.1x', next: 'Resolve stock gap' },
  { name: 'Solutek Grape Advisory', objective: 'Stage-based education', crop: 'Grapes', geography: 'Nashik, MH', region: 'Maharashtra', budget: '₹0.46 Cr', stage: 'Deploy', progress: 61, trial: '31%*', risk: 'Low', roi: '2.8x', next: 'Launch stage burst' },
  { name: 'Smartek Sugarcane Push', objective: 'Repeat adoption', crop: 'Sugarcane', geography: 'North Karnataka', region: 'Karnataka', budget: '₹0.95 Cr', stage: 'Scale', progress: 84, trial: '36%*', risk: 'Low', roi: '3.0x', next: 'Expand cluster' },
  { name: 'Cotton Micronutrient Recovery', objective: 'Underperforming territories', crop: 'Cotton', geography: 'Telangana', region: 'Telangana', budget: '₹0.38 Cr', stage: 'Review', progress: 49, trial: '16%*', risk: 'High', roi: '1.2x', next: 'Diagnose adoption drop' },
  { name: 'Dealer Activation South', objective: 'Channel readiness', crop: 'Multi-crop', geography: 'AP & Telangana', region: 'AP & Telangana', budget: '₹0.55 Cr', stage: 'Execute', progress: 68, trial: '24%*', risk: 'Medium', roi: '1.9x', next: 'Increase field follow-up' },
];

const STAGE_TONE: Record<string, Tone> = { Execute: 'green', Deploy: 'blue', Scale: 'dark', Review: 'amber' };

function PortfolioKpis({ icons }: { icons?: boolean }) {
  return (
    <KpiRow>
      <Kpi icon={<Megaphone size={18} />} label="Active Campaigns" value="28" sub="+12% vs. previous season" trend="up" spark={icons ? undefined : [4, 6, 5, 7, 6, 8, 7, 9]} />
      <Kpi icon={<Wallet size={18} />} label="Campaign Investment" value="₹6.4 Cr" sub="+8% vs. plan" trend="up" spark={icons ? undefined : [3, 4, 4, 5, 6, 5, 7, 7]} />
      <Kpi icon={<Target size={18} />} label="Opportunity Coverage" value="63%" sub="+7 pp vs. previous season" trend="up" spark={icons ? undefined : [5, 4, 6, 5, 7, 6, 8, 9]} />
      <Kpi icon={<Users size={18} />} label="Verified Farmer Reach" value="3.2 Lakh" sub="+18% vs. previous season" trend="up" spark={icons ? undefined : [3, 5, 4, 6, 7, 6, 8, 9]} />
      <Kpi icon={<Sprout size={18} />} label="Trial-to-Adoption Rate" value="27%" sub="+6 pp vs. previous season" trend="up" spark={icons ? undefined : [4, 4, 5, 6, 5, 7, 7, 8]} />
      <Kpi icon={<TrendingUp size={18} />} label="Est. Incremental Revenue" value="₹88.7 Cr" sub="+22% vs. previous season" trend="up" spark={icons ? undefined : [3, 4, 6, 5, 7, 8, 7, 9]} />
    </KpiRow>
  );
}

/* ------------------------------------------------------------------ S1.1 Executive Strategy Command Centre */

export function CommandCentre() {
  const { go, toast } = useNav();
  const campaigns = useDataset('portfolio.campaigns', CAMPAIGNS);
  const [state, setState] = useState<StateKey>('Maharashtra');
  const [picked, setPicked] = useState<string>('Onion Conversion');

  const selectState = (key: StateKey) => {
    setState(key);
    if (key === 'Maharashtra') go('s2.1');
    else toast(`${key}: ${STATE_INFO[key].value} opportunity, ${STATE_INFO[key].coverage} coverage`);
  };

  const scatter: ScatterPoint[] = [
    { label: 'Grape Solutek', lines: ['Grape', 'Solutek'], x: 0.36, y: 2.85, r: 7, color: '#8a6bc4' },
    { label: 'Sugarcane Programme', lines: ['Sugarcane', 'Programme'], x: 0.98, y: 3.15, r: 11, color: '#5fae4c' },
    { label: 'Onion Conversion', lines: ['Onion', 'Conversion'], x: 0.8, y: 2.35, r: 8, color: COLORS.green },
    { label: 'Retailer Activation', lines: ['Retailer', 'Activation'], x: 0.55, y: 1.9, r: 6, color: COLORS.amber },
    { label: 'Cotton Micronutrient', lines: ['Cotton', 'Micronutrient'], x: 0.16, y: 1.2, r: 6, color: '#5fb6e0' },
  ];
  const pickedInfo: Record<string, string> = {
    'Grape Solutek': 'Low spend, high ROI (2.9x) — candidate for scale-up in Nashik.',
    'Sugarcane Programme': 'Highest spend and ROI (3.1x) — scale to adjacent North Karnataka districts.',
    'Onion Conversion': 'Mid ROI (2.3x) held back by Jalna stock gap — see root cause.',
    'Retailer Activation': 'ROI 1.9x — increase field follow-up to lift conversion.',
    'Cotton Micronutrient': 'Lowest ROI (1.2x) — diagnose adoption drop before more spend.',
  };

  const columns = [
    { key: 'name', label: 'Campaign', render: (r: CampaignRow) => <strong>{r.name}</strong> },
    { key: 'region', label: 'Geography' },
    { key: 'budget', label: 'Budget', align: 'right' as const },
    { key: 'stage', label: 'Stage', render: (r: CampaignRow) => <Pill tone={STAGE_TONE[r.stage]}>{r.stage}</Pill> },
    { key: 'progress', label: 'Progress', render: (r: CampaignRow) => <div className="s1-prog"><Progress value={r.progress} tone={r.progress < 55 ? 'amber' : 'green'} label={`${r.progress}%`} height={6} /></div> },
    { key: 'risk', label: 'Risk', render: (r: CampaignRow) => <button type="button" className="s1-pill-btn" onClick={(e) => { e.stopPropagation(); go('s1.4'); }}><Pill tone={riskTone(r.risk)}>{r.risk}</Pill></button> },
    { key: 'roi', label: 'ROI', align: 'right' as const },
    {
      key: 'next', label: 'Next Decision', render: (r: CampaignRow) => (
        <button type="button" className="s1-link" onClick={(e) => {
          e.stopPropagation();
          if (r.name === 'Croptek Onion Adoption') go('s1.3');
          else if (r.risk === 'High') go('s1.4');
          else toast(`Decision queued: ${r.next} — ${r.name}`);
        }}>{r.next}</button>
      ),
    },
  ];

  return (
    <div className="s1-page">
      <PageHeader
        title="Executive Strategy Command Centre"
        subtitle="National view of campaign opportunity, execution, adoption and business impact"
        actions={<>
          <Btn variant="primary" icon={<Plus size={14} />} to="s4.2">Create Campaign</Btn>
          <Btn icon={<Download size={14} />} onClick={() => toast('Executive summary exported (PDF)')}>Export Summary</Btn>
          <Btn variant="gold" icon={<Sparkles size={14} />} to="ai.1">Open AI Brief</Btn>
        </>}
      />
      <PortfolioKpis />

      <Grid cols="1.5fr 1fr">
        <Panel title="Crop × Geography Campaign Opportunity" actions={<Btn small variant="ghost" icon={<MapPin size={13} />} to="s2.1">Open Opportunity Atlas</Btn>}>
          <div className="s1-map-wrap">
            <IndiaMap selected={state} onSelect={selectState} />
            <div>
              <div className="highlight-box">
                <div className="row" style={{ marginBottom: 6 }}><Target size={14} color={COLORS.dark} /><strong className="small">Underpenetrated High-Potential Markets</strong></div>
                <ol className="s1-under">
                  {(['Maharashtra', 'Karnataka', 'Andhra Pradesh'] as StateKey[]).map((key, i) => (
                    <li key={key}>
                      <span className="rank">{i + 1}</span>
                      <button type="button" onClick={() => selectState(key)}>
                        <strong>{key}</strong> <span className="muted">– {STATE_INFO[key].value} opportunity | {STATE_INFO[key].coverage} coverage</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="s1-state-detail mini-card selected">
                <strong>{state}</strong> · {STATE_INFO[state].crop}<br />
                <span className="muted">Opportunity {STATE_INFO[state].value} · Coverage {STATE_INFO[state].coverage}</span>
                {state === 'Maharashtra' && <div style={{ marginTop: 6 }}><Btn small variant="primary" to="s2.1" icon={<ChevronRight size={13} />}>Drill into Jalna / Ambad</Btn></div>}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="AI Priority Actions" icon={<Sparkles size={15} />} className="ai-panel" actions={<span className="small muted">3 high-impact actions for this season</span>}>
          <div className="stack">
            {[
              { icon: <AlertTriangle size={16} />, tone: 'amber' as Tone, title: 'Maharashtra onion campaigns show strong reach but low verified conversion; likely stock gap in Jalna and Dhule.', next: 'Reallocate stock and increase retailer activation.' },
              { icon: <Calendar size={16} />, tone: 'green' as Tone, title: 'Grape Solutek programmes in Nashik approaching stage window in 9 days.', next: 'Launch advisory burst and field demo follow-up.' },
              { icon: <TrendingUp size={16} />, tone: 'green' as Tone, title: 'Sugarcane Smartek campaigns in North Karnataka delivering 1.4x better repeat adoption than benchmark.', next: 'Scale to adjacent districts.' },
            ].map((item) => (
              <AiItem key={item.title} icon={item.icon} tone={item.tone} title={item.title}
                action={<div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Btn small to="s1.4">View Root Cause</Btn>
                  <Btn small variant="primary" to="s1.5">Create Action Plan</Btn>
                </div>}>
                <span className="small"><b>Next action:</b> {item.next}</span>
              </AiItem>
            ))}
          </div>
        </Panel>
      </Grid>

      <Grid cols="0.85fr 1fr 1.75fr">
        <Panel title="Campaign Funnel" icon={<Filter size={15} />} info>
          <Funnel stages={[
            { label: 'Target Farmers', value: '12.0 Lakh', pct: '–' },
            { label: 'Reached', value: '9.6 Lakh', pct: '80%' },
            { label: 'Engaged', value: '6.2 Lakh', pct: '65%' },
            { label: 'Trialled', value: '2.3 Lakh', pct: '37%' },
            { label: 'Adopted', value: '1.7 Lakh', pct: '74%' },
            { label: 'Repeat', value: '1.3 Lakh', pct: '76%' },
          ]} />
        </Panel>
        <Panel title="Investment Effectiveness" icon={<BarChart3 size={15} />} info>
          <ScatterChart points={scatter} onPick={(p) => setPicked(p.label)} />
          <p className="small" style={{ margin: '4px 0 0' }}><b>{picked}:</b> <span className="muted">{pickedInfo[picked]}</span></p>
        </Panel>
        <Panel title="Campaign Portfolio Performance" icon={<Layers size={15} />} data={campaigns} actions={<Btn small variant="ghost" to="s1.2">View all 28 <ArrowRight size={12} /></Btn>}>
          <DataTable compact columns={columns} rows={campaigns.rows}
            onRowClick={(r) => (r.name === 'Croptek Onion Adoption' ? go('s1.3') : go('s1.2'))} />
        </Panel>
      </Grid>

      <Panel title="Portfolio vs Opportunity by Crop" icon={<BarChart3 size={15} />} info>
        <ComboChart
          data={[
            { label: 'Onion', a: 7.2, b: 1.8, line: 28 },
            { label: 'Sugarcane', a: 5.6, b: 1.4, line: 31 },
            { label: 'Grapes', a: 4.1, b: 0.9, line: 26 },
            { label: 'Cotton', a: 3.0, b: 0.6, line: 20 },
            { label: 'Maize', a: 2.4, b: 0.5, line: 18 },
          ]}
          aMax={8} lineMax={40} yTicks={[0, 2, 4, 6, 8]} lineTicks={[0, 10, 20, 30, 40]}
          aLabel="Opportunity (₹ Cr)" bLabel="Investment (₹ Cr)" lineLabel="Conversion Rate" yLabel="Value (₹ Cr)" height={200}
        />
      </Panel>

      <FootNote />
      <FlowFooter label="Story Flow:" steps={[
        { label: 'S1.1 Executive Command Centre', to: 's1.1', current: true },
        { label: 'S1.2 Campaign Portfolio', to: 's1.2' },
        { label: 'S1.3 Campaign Executive Summary', to: 's1.3' },
        { label: 'S1.4 Strategic Risk Analysis', to: 's1.4' },
      ]} next={{ label: 'S1.2 Campaign Portfolio Dashboard', to: 's1.2' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ S1.2 Campaign Portfolio Dashboard */

export function PortfolioDashboard() {
  const { go, toast } = useNav();
  const campaigns = useDataset('portfolio.campaigns', CAMPAIGNS);
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = campaigns.rows.filter((r) =>
    (riskFilter === 'All' || r.risk === riskFilter) &&
    (!q || [r.name, r.objective, r.crop, r.geography].some((v) => v.toLowerCase().includes(q))));

  const columns = [
    { key: 'name', label: 'Campaign / Objective', render: (r: CampaignRow) => <span><strong>{r.name}</strong><span className="s1-sub">{r.objective}</span></span> },
    { key: 'crop', label: 'Crop' },
    { key: 'geography', label: 'Geography' },
    { key: 'budget', label: 'Budget', align: 'right' as const },
    { key: 'progress', label: 'Execution', render: (r: CampaignRow) => <div className="s1-prog"><Progress value={r.progress} tone="green" label={`${r.progress}%`} height={6} /></div> },
    { key: 'trial', label: 'Trial → Adoption', align: 'center' as const },
    { key: 'roi', label: 'ROI', align: 'center' as const },
    { key: 'risk', label: 'Risk', align: 'center' as const, render: (r: CampaignRow) => (
      <button type="button" className="s1-pill-btn" title="Open root-cause analysis" onClick={(e) => { e.stopPropagation(); go('s1.4'); }}>
        <Pill tone={riskTone(r.risk)}>{r.risk}</Pill>
      </button>
    ) },
    { key: 'drill', label: 'Drill-down Action', render: (r: CampaignRow) => (
      <span onClick={(e) => e.stopPropagation()}>
        <Btn small onClick={() => go(r.name === 'Croptek Onion Adoption' || r.risk === 'Low' ? 's1.3' : 's1.4')}>
          View {r.name === 'Croptek Onion Adoption' || r.risk === 'Low' ? 'S1.3' : 'S1.4'} →
        </Btn>
      </span>
    ) },
  ];

  return (
    <div className="s1-page">
      <Breadcrumbs items={[{ label: 'Strategy Command Centre (S1.1)', to: 's1.1' }, { label: 'Campaign Portfolio Dashboard (S1.2)' }]} />
      <PageHeader
        title="Campaign Portfolio Dashboard"
        subtitle="Review every active crop nutrition campaign, compare performance and open the next business decision"
        actions={<>
          <Btn icon={<ArrowLeft size={14} />} to="s1.1">Back to S1.1</Btn>
          <Btn variant="gold" icon={<AlertTriangle size={14} />} to="s1.4">Review Campaign Risks</Btn>
          <Btn variant="primary" icon={<Plus size={14} />} to="s4.2">Create Campaign</Btn>
        </>}
      />
      <PortfolioKpis icons />

      <Grid cols="1fr 1.1fr 0.95fr">
        <Panel title="Campaign Portfolio by Objective" actions={<button type="button" className="s1-link small" onClick={() => setShowAll(true)}>28 active ↗</button>}>
          <Donut center="28" sub="active campaigns" size={150} thickness={22} showPct={false}
            segments={[
              { label: 'Adoption & conversion', value: 10, color: '#1f6b2e', note: '10' },
              { label: 'Crop nutrition awareness', value: 7, color: '#2f8a3b', note: '7' },
              { label: 'Repeat & cross-sell', value: 5, color: '#5fae4c', note: '5' },
              { label: 'Retailer activation', value: 4, color: '#9fd27f', note: '4' },
              { label: 'Market development', value: 2, color: COLORS.yellow, note: '2' },
            ]} />
        </Panel>
        <Panel title="Estimated Return on Campaign Spend" actions={<span className="small muted">Illustrative campaign sample</span>}>
          <HBars max={3.2} rows={[
            { label: 'Smartek Sugarcane', value: 3.0, display: '3.0x', tone: 'dark' },
            { label: 'Solutek Grape', value: 2.8, display: '2.8x', tone: 'dark' },
            { label: 'Croptek Onion', value: 2.1, display: '2.1x', tone: 'green' },
            { label: 'Dealer Activation South', value: 1.9, display: '1.9x', tone: 'green' },
            { label: 'Cotton Micronutrient', value: 1.2, display: '1.2x', tone: 'lime' },
          ]} />
          <p className="small muted" style={{ margin: '8px 0 0' }}>Compare campaign spend, ROI and adoption before shifting investment.</p>
        </Panel>
        <Panel title="Priority Decisions" actions={<Pill tone="lime">AI assisted</Pill>}>
          <div className="stack">
            <div className="warn-box small">
              <div className="row"><Pill tone="amber" solid>STOCK RISK</Pill><strong>Croptek Onion · Dhule &amp; Jalna</strong></div>
              <p style={{ margin: '6px 0' }} className="muted">Strong farmer reach but conversion below potential. Check retailer stock availability.</p>
              <button type="button" className="s1-link" onClick={() => go('s1.4')}>View Root Cause → S1.4</button>
            </div>
            <div className="highlight-box small">
              <div className="row"><Pill tone="green" solid>SCALE</Pill><strong>Smartek Sugarcane · Karnataka</strong></div>
              <p style={{ margin: '6px 0' }} className="muted">Highest sample ROI at 3.0x. Explore adjacent target clusters.</p>
              <button type="button" className="s1-link" onClick={() => go('s1.3')}>Open Campaign Summary → S1.3</button>
            </div>
          </div>
        </Panel>
      </Grid>

      <Panel
        title="Campaign Portfolio Performance"
        data={campaigns}
        subtitle="Select a campaign to inspect its full business scorecard; select a risk to view root-cause analysis"
        actions={<>
          <div className="field" style={{ flexDirection: 'row' }}>
            <input placeholder="Search campaigns..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 190 }} />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="All">All risk levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button type="button" className="s1-link small" onClick={() => { setShowAll(true); toast('Showing all sample campaigns; full list of 28 loads from portfolio service'); }}>View all 28 →</button>
        </>}
      >
        <DataTable columns={columns} rows={rows}
          highlight={(r) => r.name === 'Croptek Onion Adoption'}
          onRowClick={(r) => (r.name === 'Croptek Onion Adoption' ? go('s1.3') : toast(`${r.name}: ${r.stage} stage, ${r.progress}% executed, ROI ${r.roi}`))} />
        {rows.length === 0 && <p className="small muted" style={{ textAlign: 'center' }}>No campaigns match “{query}”.</p>}
        <div className="row-between small muted" style={{ marginTop: 8 }}>
          <span>* Campaign-specific conversion values are illustrative | ROI shown as estimated return on campaign spend</span>
          <span>Showing {rows.length} of 28 campaigns{showAll ? ' · sample view' : ''}</span>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn variant="primary" small to="s1.3">Next: S1.3 →</Btn>
        </div>
      </Panel>

      <p className="s1-hint">Click the <b>Croptek Onion Adoption</b> row above to open its campaign-level scorecard; click a risk badge for S1.4 Root Cause.</p>
      <FlowFooter label="Story Flow:" steps={[
        { label: 'S1.1 Executive Command Centre', to: 's1.1' },
        { label: 'S1.2 Campaign Portfolio', to: 's1.2', current: true },
        { label: 'S1.3 Campaign Executive Summary', to: 's1.3' },
      ]} next={{ label: 'S1.3 Campaign Executive Summary', to: 's1.3' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ S1.3 Campaign Executive Summary */

type ExecRow = { activity: string; planned: string; done: string; progress: number; status: string };
type GeoRow = { geo: string; reach: string; trial: string; adoption: string; roi: string };
type DecisionRow = { decision: string; owner: string; urgency: string; icon: ReactNode };

export function ExecutiveSummary() {
  const { go, toast } = useNav();
  const campaigns = useDataset('portfolio.campaigns', CAMPAIGNS);
  const [campaign, setCampaign] = useState('Croptek Onion Adoption');
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<number, boolean>>({});

  const execRows: ExecRow[] = [
    { activity: 'Farmer Meetings', planned: '148', done: '132', progress: 89, status: 'On Track' },
    { activity: 'Demo Plots', planned: '42', done: '35', progress: 83, status: 'Moderate Risk' },
    { activity: 'Retailer Activations', planned: '96', done: '58', progress: 60, status: 'Behind' },
    { activity: 'Advisory Follow-ups', planned: '18.0 K', done: '11.6 K', progress: 64, status: 'Moderate Risk' },
    { activity: 'Stock-linked follow-up visits', planned: '64', done: '28', progress: 44, status: 'High Risk' },
  ];
  const statusTone: Record<string, Tone> = { 'On Track': 'green', 'Moderate Risk': 'amber', Behind: 'red', 'High Risk': 'red' };
  const geoRows: GeoRow[] = [
    { geo: 'Dhule', reach: '28.6 K', trial: '41%', adoption: '34%', roi: '2.6x' },
    { geo: 'Jalna', reach: '20.1 K', trial: '36%', adoption: '24%', roi: '1.5x' },
    { geo: 'Nashik', reach: '29.7 K', trial: '40%', adoption: '32%', roi: '2.4x' },
  ];
  const decisions: DecisionRow[] = [
    { decision: 'Reallocate Croptek stock to Jalna and expedite replenishment.', owner: 'Supply Lead', urgency: 'High', icon: <Package size={14} /> },
    { decision: 'Intensify retailer activation in low-conversion pockets.', owner: 'Regional Sales Lead', urgency: 'Medium', icon: <Boxes size={14} /> },
    { decision: 'Trigger advisory follow-up burst for farmers who attended demos in the last 14 days.', owner: 'Campaign Lead', urgency: 'High', icon: <Calendar size={14} /> },
  ];
  const brief = [
    { icon: <AlertTriangle size={16} />, tone: 'amber' as Tone, text: 'Adoption is 6 pp below plan in Jalna despite strong meeting attendance. Signal suggests post-demo stock unavailability.' },
    { icon: <Users size={16} />, tone: 'green' as Tone, text: 'Dhule shows above-benchmark retailer influence; increasing retailer activation could improve conversion.' },
    { icon: <TrendingUp size={16} />, tone: 'green' as Tone, text: 'Nashik follow-up advisories are delayed by 5 days; risk to repeat purchase conversion.' },
  ];

  return (
    <div className="s1-page">
      <Breadcrumbs items={[{ label: 'Strategy Command Centre', to: 's1.1' }, { label: 'Campaign Portfolio Dashboard', to: 's1.2' }, { label: 'Campaign Executive Summary' }]} />
      <PageHeader
        title="Campaign Executive Summary"
        subtitle="Detailed view of campaign performance, execution, adoption and business impact"
        back="s1.2"
        badge={<Pill tone="lime">Opened from S1.2: Clicked ‘Croptek Onion Adoption’</Pill>}
        actions={<>
          <Btn icon={<Target size={14} />} to="s1.4">View Root Cause</Btn>
          <Btn variant="gold" icon={<Sparkles size={14} />} to="s2.2">Open Opportunity Context</Btn>
          <Btn icon={<Download size={14} />} onClick={() => toast(`${campaign} summary exported (PDF)`)}>Export Campaign Summary</Btn>
        </>}
      />
      <div className="s1-ctx">
        <select value={campaign} onChange={(e) => { setCampaign(e.target.value); if (e.target.value !== 'Croptek Onion Adoption') toast(`Scorecard for ${e.target.value} uses portfolio sample data`); }}>
          {campaigns.rows.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        <span><MapPin size={13} /> Maharashtra</span>
        <span><Sprout size={13} /> Onion</span>
        <span><Calendar size={13} /> Late Rabi 2026–27</span>
        <span>Stage: <Pill tone="green">Execute</Pill></span>
      </div>
      <FlowStrip items={[
        { small: 'Source:', label: 'S1.2 Campaign Portfolio Dashboard', to: 's1.2', icon: <Layers size={16} /> },
        { small: 'Current:', label: 'S1.3 Campaign Executive Summary', current: true, icon: <Target size={16} /> },
        { small: 'On click of “View Root Cause” → Next:', label: 'S1.4 Strategic Risk Analysis', to: 's1.4', icon: <BarChart3 size={16} /> },
        { small: 'On click of “Open Opportunity Context” → Next:', label: 'S2.2 District / Taluka Intelligence', to: 's2.2', icon: <MapPin size={16} /> },
      ]} />

      <KpiRow>
        <Kpi icon={<CircleDollarSign size={18} />} label="Budget" value="₹0.80 Cr" sub="2% vs. plan" trend="up" spark />
        <Kpi icon={<Users size={18} />} label="Verified Farmer Reach" value="78.4 K" sub="+16% vs. plan" trend="up" spark />
        <Kpi icon={<Target size={18} />} label="Engagement Rate" value="64%" sub="+8 pp vs. plan" trend="up" spark />
        <Kpi icon={<Sprout size={18} />} label="Trial-to-Adoption" value="29%" sub="+2 pp vs. plan" trend="up" spark />
        <Kpi icon={<BarChart3 size={18} />} label="Estimated Incremental Revenue" value="₹2.1 Cr" sub="+19% vs. plan" trend="up" spark />
        <Kpi icon={<Layers size={18} />} label="Campaign ROI" value="2.1x" sub="+0.3x vs. benchmark" trend="up" spark />
      </KpiRow>

      <Grid cols="1.55fr 1fr">
        <Panel title="Campaign Overview" icon={<FileText size={15} />}>
          <Grid cols="1.15fr 1fr">
            <dl className="kv">
              <dt>Objective</dt><dd>Convert onion farmers from standard nutrition programme to Croptek package</dd>
              <dt>Geography</dt><dd>Dhule, Jalna, Nashik cluster</dd>
              <dt>Target Segment</dt><dd>Mid-acreage onion growers and progressive retailers</dd>
              <dt>Campaign Mix</dt><dd>Farmer meetings, field demos, retailer activation, advisory follow-ups</dd>
              <dt>Planned Window</dt><dd>12 Nov 2026 – 28 Jan 2027</dd>
              <dt>Campaign Owner</dt><dd>National Crop Manager / Regional Lead</dd>
            </dl>
            <div>
              <div className="s1-stages">
                {['Planned', 'Approved', 'Deployed', 'Execute', 'Review'].map((s, i) => (
                  <div key={s} className={cx('s1-stage', i < 3 && 'done', i === 3 && 'current')}><i>{i < 3 ? '✓' : ''}</i>{s}</div>
                ))}
              </div>
              <div className="highlight-box small" style={{ marginBottom: 8 }}>
                <div className="row"><Target size={14} color={COLORS.dark} /><strong>Primary business hypothesis</strong></div>
                <span className="muted">Better yield and balanced nutrition will drive adoption in high-opportunity onion markets.</span>
              </div>
              <div className="warn-box small">
                <div className="row"><AlertTriangle size={14} color={COLORS.amber} /><strong>Current issue</strong></div>
                <span className="muted">Reach is strong but verified conversion is lagging due to likely stock and retailer follow-up gaps.</span>
              </div>
            </div>
          </Grid>
        </Panel>
        <Panel title="AI Executive Brief" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="stack">
            {brief.map((b, i) => (
              <AiItem key={i} icon={b.icon} tone={b.tone}
                action={<div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Btn small to="s1.4">View Root Cause</Btn>
                  <Btn small variant="primary" disabled={assigned[i]} onClick={() => { setAssigned({ ...assigned, [i]: true }); toast('Action assigned to Regional Campaign Lead'); }}>
                    {assigned[i] ? 'Assigned ✓' : 'Assign Action'}
                  </Btn>
                </div>}>
                <span className="small">{b.text}</span>
              </AiItem>
            ))}
          </div>
        </Panel>
      </Grid>

      <Grid cols="1fr 1.15fr 1.1fr">
        <div className="stack">
          <Panel title="Campaign Funnel" icon={<Filter size={15} />} info>
            <Funnel stages={[
              { label: 'Targeted', value: '96 K', pct: '–' },
              { label: 'Reached', value: '78.4 K', pct: '82%' },
              { label: 'Engaged', value: '50.2 K', pct: '64%' },
              { label: 'Trialled', value: '19.8 K', pct: '39%' },
              { label: 'Adopted', value: '5.7 K', pct: '29%' },
              { label: 'Repeat', value: '2.9 K', pct: '51%' },
            ]} />
          </Panel>
          <Panel title="Geography Performance" icon={<BarChart3 size={15} />}>
            <DataTable<GeoRow> compact rows={geoRows}
              highlight={(r) => r.geo === 'Jalna'}
              onRowClick={(r) => (r.geo === 'Jalna' ? go('s1.4') : toast(`${r.geo}: adoption ${r.adoption}, ROI ${r.roi}`))}
              columns={[
                { key: 'geo', label: 'Geography', render: (r) => <strong>{r.geo}</strong> },
                { key: 'reach', label: 'Reach', align: 'right' },
                { key: 'trial', label: 'Trial Rate', align: 'right' },
                { key: 'adoption', label: 'Adoption Rate', align: 'right', render: (r) => (r.geo === 'Jalna' ? <Pill tone="red">{r.adoption}</Pill> : r.adoption) },
                { key: 'roi', label: 'Estimated ROI', align: 'right' },
              ]} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Execution vs Plan" icon={<Layers size={15} />}>
            <DataTable<ExecRow> compact rows={execRows}
              columns={[
                { key: 'activity', label: 'Activity' },
                { key: 'planned', label: 'Planned', align: 'right' },
                { key: 'done', label: 'Done', align: 'right' },
                { key: 'progress', label: 'Progress', render: (r) => <div className="s1-prog"><Progress value={r.progress} tone={r.progress >= 80 ? 'green' : r.progress >= 60 ? 'amber' : 'red'} label={`${r.progress}%`} height={6} /></div> },
                { key: 'status', label: 'Status', render: (r) => <Pill tone={statusTone[r.status]}>{r.status}</Pill> },
              ]} />
          </Panel>
          <Panel title="Investment vs Outcome" icon={<LineChart size={15} />}>
            <ComboChart
              data={[
                { label: 'Farmer Meetings', a: 0.24, aText: '₹0.24 Cr', line: 31 },
                { label: 'Demo Plots', a: 0.16, aText: '₹0.16 Cr', line: 17 },
                { label: 'Retailer Activation', a: 0.26, aText: '₹0.26 Cr', line: 33 },
                { label: 'Advisory Follow-ups', a: 0.14, aText: '₹0.14 Cr', line: 19 },
              ]}
              aMax={0.4} lineMax={40} yTicks={[0, 0.1, 0.2, 0.3, 0.4]} lineTicks={[0, 10, 20, 30, 40]}
              aLabel="Spend (₹ Cr)" lineLabel="Adoption Contribution" yLabel="Spend (₹ Cr)" height={210} aColor={COLORS.green}
            />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Stock & Channel Readiness" icon={<Package size={15} />}>
            <table className="dt dt-compact">
              <thead><tr><th>Geography</th><th>Stock Readiness</th><th style={{ textAlign: 'right' }}>Active Retailers</th></tr></thead>
              <tbody>
                {[['Dhule', 92, 84], ['Jalna', 61, 52], ['Nashik', 88, 41]].map(([g, s, r]) => (
                  <tr key={g}>
                    <td><strong>{g}</strong></td>
                    <td><div className="s1-prog"><Progress value={s as number} tone={(s as number) < 70 ? 'amber' : 'green'} label={`${s}%`} height={6} /></div></td>
                    <td style={{ textAlign: 'right' }}>{r} {g === 'Jalna' && <Pill tone="amber">Shortage</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row-between" style={{ marginTop: 10 }}>
              <span className="small row"><AlertTriangle size={14} color={COLORS.amber} /> Jalna stock gap estimated at 11% of required campaign volume.</span>
              <Btn small variant="primary" to="s5.2">Open Demand &amp; Channel View</Btn>
            </div>
          </Panel>
          <Panel title="Next Decisions" icon={<Layers size={15} />}>
            <DataTable<DecisionRow> compact rows={decisions}
              onRowClick={(_, i) => setDone({ ...done, [i]: !done[i] })}
              columns={[
                { key: 'decision', label: 'Decision', render: (r, i) => <span className="row" style={{ flexWrap: 'nowrap', textDecoration: done[i] ? 'line-through' : undefined }}>{done[i] ? <CheckCircle2 size={14} color={COLORS.green} /> : r.icon}<span>{r.decision}</span></span> },
                { key: 'owner', label: 'Owner' },
                { key: 'urgency', label: 'Urgency', render: (r) => <Pill tone={riskTone(r.urgency)}>{r.urgency}</Pill> },
              ]} />
            <div className="row" style={{ marginTop: 10 }}>
              <Btn variant="primary" small to="s1.4">Recommended Next Screen</Btn>
              <ArrowRight size={14} />
              <span className="small"><strong>S1.4 — Strategic Risk Analysis</strong><span className="s1-sub">Opens on clicking ‘View Root Cause’ to diagnose conversion and stock gap drivers.</span></span>
            </div>
          </Panel>
        </div>
      </Grid>

      <FootNote />
      <FlowFooter label="Story Flow:" steps={[
        { label: 'S1.1 Executive Command Centre', to: 's1.1' },
        { label: 'S1.2 Campaign Portfolio', to: 's1.2' },
        { label: 'S1.3 Campaign Executive Summary', to: 's1.3', current: true },
        { label: 'S1.4 Strategic Risk Analysis', to: 's1.4' },
      ]} next={{ label: 'S1.4 Strategic Risk Analysis', to: 's1.4' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ S1.4 Strategic Risk Analysis */

type RiskDriver = { icon: ReactNode; title: string; desc: string; impact: string };
type Risk = {
  id: string;
  icon: ReactNode;
  title: string;
  sub: string;
  root: string;
  rootSub: string;
  drivers: RiskDriver[];
  impact: { label: string; value: string }[];
  impactBars: { label: string; value: number; display: string; tone: Tone }[];
  insights: string[];
  options: { name: string; text: string; uplift: string }[];
};

const RISKS: Risk[] = [
  {
    id: 'adoption', icon: <Boxes size={22} />, title: 'Lower adoption in Jalna', sub: 'Adoption 28% vs. target 34%',
    root: 'Lower Adoption', rootSub: '(28% vs. 34%)',
    drivers: [
      { icon: <Boxes size={20} />, title: 'Channel Readiness', desc: 'Limited retailer coverage (68% vs. 82% in Dhule)', impact: '~40%' },
      { icon: <Users size={20} />, title: 'Field Engagement', desc: 'Fewer demo plots executed (11 vs. planned 16)', impact: '~30%' },
      { icon: <Megaphone size={20} />, title: 'Farmer Awareness', desc: 'Lower recall of Croptek benefits (52% vs. 68% in Dhule)', impact: '~20%' },
      { icon: <CalendarClock size={20} />, title: 'Crop Stage Timing', desc: 'Transplanting delayed by ~10 days in key clusters', impact: '~10%' },
    ],
    impact: [
      { label: 'Adoption gap vs. target', value: '-6 pp' },
      { label: 'Farmers at risk of non-conversion', value: '~1,200' },
      { label: 'Revenue at risk', value: '₹0.42 Cr' },
      { label: 'Volume at risk', value: '~3,800 MT' },
    ],
    impactBars: [
      { label: 'Channel readiness', value: 40, display: '40%', tone: 'red' },
      { label: 'Field engagement', value: 30, display: '30%', tone: 'amber' },
      { label: 'Farmer awareness', value: 20, display: '20%', tone: 'amber' },
      { label: 'Crop stage timing', value: 10, display: '10%', tone: 'lime' },
    ],
    insights: [
      'Adoption in Jalna is 6 pp lower than plan and 6 pp below Dhule (34%).',
      'Primary driver: lower retailer coverage and fewer demonstration plots.',
      'Delayed transplanting has shifted the engagement window in ~30% of target villages.',
    ],
    options: [
      { name: 'Scenario A: Retailer Activation Boost', text: 'Onboard 25 additional retailers, stock replenishment in low-coverage clusters.', uplift: '+3.5 pp' },
      { name: 'Scenario B: Demo Plot Acceleration', text: 'Add 5 demo plots, 2 field days, 1 advisory burst.', uplift: '+4.2 pp' },
      { name: 'Scenario C: Combined Recovery Plan', text: 'Retailer activation + 5 demo plots + reschedule 2 field days + advisory burst.', uplift: '+7.0 pp' },
    ],
  },
  {
    id: 'weather', icon: <Calendar size={22} />, title: 'Weather risk – Rainfall', sub: 'Higher rainfall next 7 days (Impact on 2 field days)',
    root: 'Field Day Disruption', rootSub: '(2 of 6 days at risk)',
    drivers: [
      { icon: <CloudRain size={20} />, title: 'Forecast Rainfall', desc: 'IMD forecast 35–50 mm across Ambad & Jalna clusters', impact: '~50%' },
      { icon: <CalendarClock size={20} />, title: 'Schedule Overlap', desc: '2 field days planned in the heavy-rain window', impact: '~30%' },
      { icon: <Users size={20} />, title: 'Attendance Risk', desc: 'Expected turnout drop of 25–30% on wet days', impact: '~20%' },
    ],
    impact: [
      { label: 'Field days at risk', value: '2' },
      { label: 'Farmers not reached', value: '~240' },
      { label: 'Adoption impact', value: '-1 pp' },
      { label: 'Schedule slip', value: '5–7 days' },
    ],
    impactBars: [
      { label: 'Rainfall exposure', value: 50, display: '50%', tone: 'red' },
      { label: 'Schedule overlap', value: 30, display: '30%', tone: 'amber' },
      { label: 'Attendance risk', value: 20, display: '20%', tone: 'lime' },
    ],
    insights: [
      'Heavy rainfall is forecast for the next 7 days in Jalna clusters.',
      'Two planned field days fall inside the forecast window.',
      'Rescheduling to the following week keeps the crop-stage window intact.',
    ],
    options: [
      { name: 'Reschedule field days', text: 'Move 2 field days to next week based on forecasted rainfall.', uplift: 'Protects ~1 pp' },
      { name: 'Switch to village meetings', text: 'Indoor meetings with retailer-led product demos.', uplift: 'Protects ~0.6 pp' },
      { name: 'Combined Recovery Plan', text: 'Included in Scenario C weather-adjusted schedule.', uplift: '+7.0 pp overall' },
    ],
  },
  {
    id: 'demo', icon: <Users size={22} />, title: 'Low demo participation', sub: 'Avg. attendance 72% vs. target 85%',
    root: 'Low Participation', rootSub: '(72% vs. 85%)',
    drivers: [
      { icon: <Megaphone size={20} />, title: 'Invitation Reach', desc: 'Only 61% of invited farmers received SMS/WhatsApp reminders', impact: '~45%' },
      { icon: <MapPin size={20} />, title: 'Plot Location', desc: '3 demo plots located > 8 km from target villages', impact: '~35%' },
      { icon: <CalendarClock size={20} />, title: 'Timing Conflict', desc: 'Demos overlapped with local market days', impact: '~20%' },
    ],
    impact: [
      { label: 'Attendance gap', value: '-13 pp' },
      { label: 'Farmers missed', value: '~310' },
      { label: 'Trial conversion impact', value: '-2 pp' },
      { label: 'Revenue at risk', value: '₹0.14 Cr' },
    ],
    impactBars: [
      { label: 'Invitation reach', value: 45, display: '45%', tone: 'red' },
      { label: 'Plot location', value: 35, display: '35%', tone: 'amber' },
      { label: 'Timing conflict', value: 20, display: '20%', tone: 'lime' },
    ],
    insights: [
      'Attendance is 13 pp below target across Jalna demo plots.',
      'Reminder coverage is the strongest driver of turnout.',
      'Relocating plots closer to high-potential clusters lifts expected attendance.',
    ],
    options: [
      { name: 'Reminder burst', text: 'WhatsApp + retailer reminders 48h and 4h before each demo.', uplift: '+6 pp attendance' },
      { name: 'Relocate 3 demo plots', text: 'Move plots into high-potential clusters (Wadi Gaon, Dhanora).', uplift: '+5 pp attendance' },
      { name: 'Combined Recovery Plan', text: 'Included in Scenario C demo acceleration.', uplift: '+7.0 pp adoption' },
    ],
  },
];

export function RiskAnalysis() {
  const { toast } = useNav();
  const [riskId, setRiskId] = useState('adoption');
  const [tab, setTab] = useState<'root' | 'impact' | 'recovery'>('root');
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const risk = RISKS.find((r) => r.id === riskId)!;

  const recActions = [
    { key: 'assign', icon: <Users size={16} />, text: 'Onboard 25 additional retailers in Jalna within 10 days', btn: 'Assign', done: 'Assigned' },
    { key: 'plan', icon: <Sprout size={16} />, text: 'Add 5 new demo plots in high-potential clusters (target: +4–6 pp adoption)', btn: 'Plan', done: 'Planned' },
    { key: 'resched', icon: <Calendar size={16} />, text: 'Reschedule 2 field days to next week basis forecasted rainfall', btn: 'Reschedule', done: 'Rescheduled' },
  ];

  return (
    <div className="s1-page">
      <Breadcrumbs items={[{ label: 'Strategy Command Centre', to: 's1.1' }, { label: 'Campaign Portfolio Dashboard', to: 's1.2' }, { label: 'Campaign Executive Summary', to: 's1.3' }, { label: 'Strategic Risk Analysis' }]} />
      <PageHeader
        code="S1.4"
        title="Strategic Risk Analysis"
        subtitle="Croptek Onion Adoption / Diagnose low conversion in Jalna"
        back="s1.3"
        actions={<>
          <Pill tone="lime">Opened from S1.3: View Root Cause</Pill>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>Campaign:
            <select defaultValue="Croptek – Onion Adoption" onChange={(e) => toast(`Risk model for ${e.target.value} uses portfolio sample data`)}>
              <option>Croptek – Onion Adoption</option>
              <option>Cotton Micronutrient Recovery</option>
              <option>Dealer Activation South</option>
            </select>
          </label>
        </>}
      />

      <div className="s1-kpi-strip">
        <div><Sprout size={28} className="ic" /><div><div className="lab">Overall Progress</div><span className="big">76%</span></div><span className="delta">vs. Plan 80%</span></div>
        <div><Target size={28} className="ic" /><div><div className="lab">Adoption</div><span className="big">34%</span></div><span className="delta"><b style={{ color: COLORS.red }}>▼ -6 pp</b><br />vs. Plan</span></div>
        <div><BarChart3 size={28} className="ic" /><div><div className="lab">Investment Utilization</div><span className="big">72%</span></div><span className="delta"><b style={{ color: COLORS.green }}>▲ -8 pp</b><br />vs. Plan</span></div>
        <div><Package size={28} className="ic" /><div><div className="lab">Stock Coverage</div><span className="big">93%</span></div><CheckCircle2 size={18} color={COLORS.green} /></div>
        <div><AlertTriangle size={28} color={COLORS.amber} /><div><div className="lab">Risk Index</div><Pill tone="amber" solid>Medium</Pill></div></div>
      </div>

      <Grid cols="0.85fr 1.35fr 0.95fr">
        <Panel title={`Active Risks (${RISKS.length})`} actions={<Filter size={15} className="muted-icon" />}>
          <div className="stack" style={{ gap: 6 }}>
            {RISKS.map((r) => (
              <button key={r.id} type="button" className={cx('s1-risk-item', r.id === riskId && 'active')} onClick={() => { setRiskId(r.id); setTab('root'); }}>
                <span className="ic">{r.icon}</span>
                <span><strong>{r.title}</strong><span>{r.sub}</span></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={<>Risk Deep Dive: <span style={{ color: COLORS.amber }}>{risk.title.replace('Lower adoption', 'Lower Adoption')}</span></>}>
          <div className="tabs">
            <button type="button" className={cx('tab', tab === 'root' && 'active')} onClick={() => setTab('root')}>Root Cause Analysis</button>
            <button type="button" className={cx('tab', tab === 'impact' && 'active')} onClick={() => setTab('impact')}>Impact Assessment</button>
            <button type="button" className={cx('tab', tab === 'recovery' && 'active')} onClick={() => setTab('recovery')}>Recovery Options</button>
          </div>
          {tab === 'root' && (
            <div className="s1-tree">
              <div className="s1-tree-root">{risk.root}<small>{risk.rootSub}</small></div>
              <div className="s1-tree-links" />
              <div className="s1-tree-nodes">
                {risk.drivers.map((d) => (
                  <div key={d.title} className="s1-node">
                    <span style={{ color: COLORS.dark }}>{d.icon}</span>
                    <span><strong>{d.title}</strong>{d.desc}</span>
                    <span className="imp"><b>{d.impact}</b>impact</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'impact' && (
            <div>
              <div className="s1-impact-cards">
                {risk.impact.map((m) => <div key={m.label} className="mini-card"><strong>{m.value}</strong><span>{m.label}</span></div>)}
              </div>
              <strong className="small">Share of gap by driver</strong>
              <HBars rows={risk.impactBars} max={60} />
            </div>
          )}
          {tab === 'recovery' && (
            <div className="stack">
              {risk.options.map((o, i) => (
                <div key={o.name} className={cx('mini-card', i === risk.options.length - 1 && 'selected')}>
                  <div className="row-between"><strong className="small">{o.name}</strong><Pill tone={i === risk.options.length - 1 ? 'green' : 'lime'}>{o.uplift}</Pill></div>
                  <span className="small muted">{o.text}</span>
                </div>
              ))}
              <div className="row-between">
                <span className="small muted">Recommended: Combined Recovery Plan (best ROI 3.6x)</span>
                <Btn variant="primary" icon={<ArrowRight size={14} />} to="s1.5">Open Recovery &amp; Replanning (S1.5)</Btn>
              </div>
            </div>
          )}
        </Panel>

        <div className="stack">
          <Panel title="Key Insights" icon={<Sparkles size={15} />} className="ai-panel">
            <ul className="s1-insights">{risk.insights.map((t) => <li key={t}>{t}</li>)}</ul>
          </Panel>
          <Panel title="Recommended Actions" icon={<Target size={15} />}>
            <div className="s1-actions-list">
              {recActions.map((a) => (
                <div key={a.key} className="s1-act">
                  <span style={{ color: COLORS.dark }}>{a.icon}</span>
                  <span>{a.text}</span>
                  <Btn small variant={actions[a.key] ? 'primary' : 'outline'} disabled={actions[a.key]}
                    onClick={() => { setActions({ ...actions, [a.key]: true }); toast(`${a.done}: ${a.text}`); }}>
                    {actions[a.key] ? `${a.done} ✓` : `${a.btn} ›`}
                  </Btn>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Grid>

      <Grid cols="1fr 1fr 0.95fr">
        <Panel title="Adoption Trend – Dhule vs. Jalna">
          <TrendChart months={['Nov', 'Dec', 'Jan', 'Feb']} series={[
            { label: 'Dhule', color: COLORS.green, values: [21, 26, 30, 34] },
            { label: 'Jalna', color: COLORS.yellow, values: [17, 22, 25, 28] },
          ]} />
        </Panel>
        <Panel title="Activity Coverage (Jalna)">
          <VBars height={190} max={110}
            series={[{ label: 'Plan', color: '#d3d8cf' }, { label: 'Actual', color: COLORS.green }]}
            valueFormat={(v) => `${v}%`}
            data={[
              { label: 'Farmer Meetings', values: [85, 76] },
              { label: 'Demo Plots', values: [100, 69] },
              { label: 'Retailer Meetings', values: [90, 68] },
            ]} />
        </Panel>
        <Panel title="Expected Impact of Recovery Plan (Jalna)">
          <div className="s1-expected">
            <div><strong>28%</strong><span>Current<br />Adoption</span></div>
            <ArrowRight size={20} />
            <div className="proj"><strong>32 – 35%</strong><span>Projected Adoption<br />(Recovery Scenario)</span></div>
            <div><strong style={{ fontSize: 18 }}>+3,800 MT</strong><span>Potential Incremental<br />Volume</span></div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <Btn small variant="primary" to="s1.5">Plan Recovery →</Btn>
          </div>
        </Panel>
      </Grid>

      <FlowFooter label="Story Flow:" steps={[
        { label: 'S1.1 Command Centre', to: 's1.1' },
        { label: 'S1.2 Campaign Portfolio', to: 's1.2' },
        { label: 'S1.3 Executive Summary', to: 's1.3' },
        { label: 'S1.4 Risk Analysis (Current)', to: 's1.4', current: true },
      ]} nextLabel="Next Recommended Screen:" next={{ label: 'S1.5 Recovery & Replanning', to: 's1.5' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ S1.5 Recovery & Replanning */

type ScenarioKey = 'A' | 'B' | 'C';
type Scenario = {
  key: ScenarioKey; name: string; short: string; actions: string; icon: ReactNode;
  uplift: number; cost: string; timeline: string; risk: string; roi: string; details: string[];
};

const SCENARIOS: Scenario[] = [
  { key: 'A', name: 'Scenario A: Retailer Activation Boost', short: 'Retailer Activation Boost', icon: <Calendar size={20} />,
    actions: 'Onboard 25 additional retailers, stock replenishment in low-coverage clusters, retailer scheme push.',
    uplift: 3.5, cost: '₹0.08 Cr', timeline: 'Low', risk: 'Medium', roi: '3.3x',
    details: ['25 retailers identified across Wadi Gaon, Dhanora and Ambad HQ', 'Stock reallocation of 43 MT gap prioritised to Jalna', 'Retailer scheme push for 18 high-influence retailers'] },
  { key: 'B', name: 'Scenario B: Demo Plot Acceleration', short: 'Demo Plot Acceleration', icon: <Sprout size={20} />,
    actions: 'Add 5 demo plots, 2 field days, 1 advisory burst, follow-up visits.',
    uplift: 4.2, cost: '₹0.11 Cr', timeline: 'Medium', risk: 'Low', roi: '3.4x',
    details: ['5 new demo plots in high-potential clusters', '2 field days aligned with transplanting stage', '1 advisory burst to demo attendees'] },
  { key: 'C', name: 'Scenario C: Combined Recovery Plan', short: 'Combined Recovery Plan', icon: <Layers size={20} />,
    actions: 'Retailer activation + 5 demo plots + reschedule 2 field days + advisory burst.',
    uplift: 7.0, cost: '₹0.17 Cr', timeline: 'Moderate', risk: 'Medium', roi: '3.6x',
    details: ['Combines Scenario A and B levers', 'Weather-adjusted schedule for 2 field days', 'Best ROI (3.6x) and balanced execution risk'] },
];

const IMPACT_GROUPS = [
  { label: 'Adoption Rate', max: 50, values: [34, 37.5, 38.2, 41.0], fmt: (v: number) => `${v}%` },
  { label: 'Incremental Volume (MT)', max: 30000, values: [21600, 23900, 24500, 26200], fmt: (v: number) => v.toLocaleString('en-IN') },
  { label: 'Incremental Revenue (₹ Cr)', max: 3.4, values: [2.1, 2.3, 2.4, 2.7], fmt: (v: number) => `₹${v}` },
  { label: 'ROI', max: 4.4, values: [3.1, 3.3, 3.4, 3.6], fmt: (v: number) => `${v}x` },
];
const IMPACT_SERIES = [
  { label: 'Current Plan', color: '#c9cfc6' },
  { label: 'Scenario A', color: '#9fd27f' },
  { label: 'Scenario B', color: '#5fae4c' },
  { label: 'Scenario C', color: '#1f6b2e' },
];

function ImpactComparison({ selected }: { selected: ScenarioKey }) {
  const [ref, width] = useWidth<HTMLDivElement>(620);
  const W = clamp(width, 280, 1400); const H = useChartHeight(210); const T = 22; const L = 8;
  const gw = (W - L) / IMPACT_GROUPS.length;
  const bw = clamp((gw - 24) / 4, 10, 28);
  // Narrow panels: per-bar values would collide, so only the selected scenario's value is printed (the rest
  // are in tooltips) and group labels wrap onto two lines.
  const narrow = bw * 4 + 9 < 150;
  const B = narrow ? 40 : 30;
  const plotH = H - T - B;
  const selIdx = { A: 1, B: 2, C: 3 }[selected];
  const labelLines = (label: string) => {
    if (!narrow) return [label];
    const words = label.split(' ');
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean);
  };
  return (
    <div ref={ref}>
      <svg className="s1-chart" viewBox={`0 0 ${W} ${H}`}>
        <line x1={L} x2={W} y1={T + plotH} y2={T + plotH} stroke="#9aa59a" />
        {IMPACT_GROUPS.map((g, gi) => {
          const x0 = L + gi * gw + (gw - bw * 4 - 9) / 2;
          return (
            <g key={g.label}>
              {g.values.map((v, i) => {
                const h = (v / g.max) * plotH;
                const x = x0 + i * (bw + 3);
                return (
                  <g key={i} opacity={i === 0 || i === selIdx ? 1 : 0.45} data-tip={`${g.label} · ${IMPACT_SERIES[i].label}: ${g.fmt(v)}`}>
                    <rect className="s1-grow" style={{ animationDelay: `${gi * 80 + i * 30}ms` }} x={x} y={T + plotH - h} width={bw} height={h} fill={IMPACT_SERIES[i].color} rx={2} />
                    {(!narrow || i === selIdx) && (
                      <text x={narrow ? x0 + (bw * 4 + 9) / 2 : x + bw / 2} y={narrow ? T - 8 : T + plotH - h - 4} textAnchor="middle" className="val" style={{ fontSize: narrow ? 9.5 : 8 }}>{g.fmt(v)}</text>
                    )}
                  </g>
                );
              })}
              <text x={L + gi * gw + gw / 2} y={T + plotH + 14} textAnchor="middle" className="lbl">
                {labelLines(g.label).map((line, k) => <tspan key={line} x={L + gi * gw + gw / 2} dy={k ? 11 : 0}>{line}</tspan>)}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="s1-chart-legend">
        {IMPACT_SERIES.map((s) => <li key={s.label}><i style={{ background: s.color }} />{s.label}</li>)}
      </ul>
    </div>
  );
}

const TIMELINE = [
  { label: 'Reallocate stock to Jalna clusters', start: 0, end: 22, color: COLORS.mid, scen: ['A', 'C'] },
  { label: 'Retailer onboarding and activation', start: 8, end: 50, color: COLORS.green, scen: ['A', 'C'] },
  { label: 'Launch advisory burst', start: 22, end: 50, color: COLORS.green, scen: ['B', 'C'] },
  { label: 'Add demo plots', start: 28, end: 62, color: COLORS.mid, scen: ['B', 'C'] },
  { label: 'Conduct rescheduled field days', start: 50, end: 75, color: COLORS.green, scen: ['B', 'C'] },
  { label: 'Measure recovery signals', start: 75, end: 98, color: COLORS.mid, scen: ['A', 'B', 'C'] },
];

const DEPENDENCIES = [
  { icon: <Package size={14} />, dep: 'Stock availability', status: 'Partially ready', tone: 'amber' as Tone, note: 'Reallocation to Jalna in W1' },
  { icon: <ClipboardCheck size={14} />, dep: 'Retailer list finalization', status: 'Ready', tone: 'green' as Tone, note: '25 retailers identified' },
  { icon: <Sprout size={14} />, dep: 'Demo resource allocation', status: 'Needs approval', tone: 'amber' as Tone, note: 'Field team & budget sign-off' },
  { icon: <Users size={14} />, dep: 'Field team bandwidth', status: 'Ready', tone: 'green' as Tone, note: 'Sufficient for W1–W4' },
  { icon: <CloudRain size={14} />, dep: 'Weather-adjusted schedule', status: 'In review', tone: 'blue' as Tone, note: 'Revised plan with IMD update' },
  { icon: <Wallet size={14} />, dep: 'Budget headroom', status: 'Available', tone: 'green' as Tone, note: '₹0.17 Cr within campaign budget' },
];

export function RecoveryReplanning() {
  const { toast } = useNav();
  const [selected, setSelected] = useState<ScenarioKey>('C');
  const [approved, setApproved] = useState<ScenarioKey | null>(null);
  const [details, setDetails] = useState<ScenarioKey | null>(null);
  const [simulated, setSimulated] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const scen = SCENARIOS.find((s) => s.key === selected)!;
  const improved = (28 + scen.uplift).toFixed(scen.uplift % 1 ? 1 : 0);

  const approve = (key: ScenarioKey = selected) => {
    setSelected(key);
    setApproved(key);
    const s = SCENARIOS.find((x) => x.key === key)!;
    toast(`Replan approved: ${s.short} (${s.cost}). Orchestration update queued for S6.1.`);
  };

  return (
    <div className="s1-page">
      <Breadcrumbs items={[
        { label: 'Strategy Command Centre', to: 's1.1' }, { label: 'Campaign Portfolio Dashboard', to: 's1.2' },
        { label: 'Strategic Risk Analysis', to: 's1.4' }, { label: 'Recovery & Replanning' },
      ]} />
      <PageHeader
        title="Recovery & Replanning"
        subtitle="Simulate corrective scenarios, assess business impact, and approve the best recovery plan for campaign performance."
        back="s1.4"
        badge={approved ? <Pill tone="green" solid>Replan Approved · Scenario {approved}</Pill> : undefined}
        actions={<Pill tone="lime">Opened from S1.4: Clicked ‘Recovery Options’ for Croptek Onion Adoption</Pill>}
      />
      <FlowStrip items={[
        { small: 'Previous', label: 'S1.4 Strategic Risk Analysis', to: 's1.4' },
        { small: 'Current', label: 'S1.5 Recovery & Replanning', current: true },
        { small: 'On click of “Approve Replan” →', label: 'S6.1 Campaign Action Plan / Orchestration Update', to: 's6.1' },
        { small: 'Open Demand & Channel View →', label: 'S5.2 Stock Readiness Dashboard', to: 's5.2', icon: <ExternalLink size={14} /> },
      ]} />
      <SourceBar tone="plain">
        <div className="s1-ctxline">
          <span><Target size={14} color={COLORS.dark} /><b>Campaign:</b> Croptek Onion Adoption</span>
          <span><MapPin size={14} color={COLORS.dark} /><b>Geographies:</b> Dhule, Jalna, Nashik cluster</span>
          <span><AlertTriangle size={14} color={COLORS.amber} /><b>Primary issue:</b> lower adoption in Jalna due to retailer coverage gaps, delayed demo plots, and slight weather-based timing shift.</span>
        </div>
      </SourceBar>

      <KpiRow>
        <Kpi icon={<Sprout size={18} />} label="Current Adoption" value="34%" sub="-6 pp vs. plan (40% target)" trend="down" spark={[30, 32, 31, 33, 34]} />
        <Kpi icon={<Target size={18} />} label="Target Adoption" value="40%" sub="Campaign target for Late Rabi 2026-27" />
        <Kpi icon={<BarChart3 size={18} />} label="Campaign ROI" value="3.1x" sub="+0.3x vs. 2.8x plan" trend="up" spark />
        <Kpi icon={<AlertTriangle size={18} />} label="Jalna Risk Score" value={<Pill tone="red" solid>High</Pill>} sub="Lower adoption (28%) vs. target (34%)" tone="red" />
        <Kpi icon={<Package size={18} />} label="Stock Readiness" value="93%" badge={<CheckCircle2 size={16} color={COLORS.green} />} sub="Sufficient for recovery plans" />
        <Kpi icon={<TrendingUp size={18} />} label="Estimated Recovery Upside" value="+7 to +8 pp" sub="Post recovery scenario (to ~41–42%)" trend="up" />
      </KpiRow>

      <Grid cols="2.1fr 1fr">
        <Panel title="Recovery Scenario Simulator" icon={<Layers size={15} />} info>
          <div className="s1-scen-grid">
            {SCENARIOS.map((s) => (
              <div key={s.key} className={cx('mini-card', 's1-scen', selected === s.key && 'selected')} onClick={() => setSelected(s.key)}>
                <header>
                  <input type="radio" name="s1-scenario" checked={selected === s.key} onChange={() => setSelected(s.key)} />
                  <span>{s.name}</span>
                  {s.key === 'C' && <Pill tone="green" solid>Recommended</Pill>}
                  {approved === s.key && <Pill tone="dark" solid>Approved</Pill>}
                </header>
                <div className="acts"><span style={{ color: COLORS.dark }}>{s.icon}</span><span><b>Actions:</b> {s.actions}</span></div>
                <dl>
                  <dt>Estimated adoption uplift</dt><dd style={{ color: COLORS.green }}>+{s.uplift.toFixed(1)} pp</dd>
                  <dt>Cost</dt><dd>{s.cost}</dd>
                  <dt>Timeline impact</dt><dd><Pill tone={riskTone(s.timeline)}>{s.timeline}</Pill></dd>
                  <dt>Risk</dt><dd><Pill tone={riskTone(s.risk)}>{s.risk}</Pill></dd>
                  <dt>ROI after recovery</dt><dd>{s.roi}</dd>
                </dl>
                {details === s.key && (
                  <ul className="s1-insights small" style={{ fontSize: 11 }}>{s.details.map((d) => <li key={d}>{d}</li>)}</ul>
                )}
                {simulated[s.key] && <span className="small" style={{ color: COLORS.green }}>✓ Simulated: Jalna adoption 28% → {(28 + s.uplift).toFixed(1)}%, ROI {s.roi}</span>}
                <div className="btns" onClick={(e) => e.stopPropagation()}>
                  <Btn small onClick={() => setDetails(details === s.key ? null : s.key)}>{details === s.key ? 'Hide Details' : 'View Details'}</Btn>
                  <Btn small onClick={() => { setSelected(s.key); setSimulated({ ...simulated, [s.key]: true }); toast(`${s.short} simulated: +${s.uplift} pp adoption, ROI ${s.roi}`); }}>Simulate</Btn>
                  {s.key === 'C' && <Btn small variant="primary" disabled={approved === 'C'} onClick={() => approve('C')}>Approve Replan</Btn>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="AI Replanning Recommendation" icon={<Sparkles size={15} />} className="ai-panel">
          <div className="highlight-box small" style={{ marginBottom: 10 }}>
            <b>Recommend Scenario C (Combined Recovery Plan)</b> to drive ~7.0 pp higher adoption, taking campaign adoption to ~41%, with the best ROI (3.6x) and balanced execution risk.
          </div>
          <ul className="s1-insights">
            <li>Jalna retailer coverage is the largest addressable recovery lever.</li>
            <li>Demo acceleration improves trial conversion in low-awareness pockets.</li>
            <li>Rescheduling 2 field days reduces weather-related execution loss.</li>
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            <Btn variant="primary" small icon={<CheckCircle2 size={13} />} disabled={approved === 'C'} onClick={() => approve('C')}>{approved === 'C' ? 'Replan Approved' : 'Approve Replan'}</Btn>
            <Btn small icon={<Users size={13} />} onClick={() => toast('Owners assigned: Regional Sales Lead, Campaign Lead, Supply Lead')}>Assign Owners</Btn>
            <Btn small icon={<Download size={13} />} onClick={() => toast('Recovery brief exported (PDF)')}>Export Recovery Brief</Btn>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.15fr 1fr 1fr">
        <Panel title="Impact Comparison" icon={<BarChart3 size={15} />} info>
          <ImpactComparison selected={selected} />
        </Panel>
        <Panel title="Operational Replan Timeline (Next 4 Weeks)" icon={<Calendar size={15} />} info>
          <div className="gantt">
            <div className="gantt-head"><span>Activity</span><div className="gantt-months" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}><span>W1</span><span>W2</span><span>W3</span><span>W4</span></div></div>
            {TIMELINE.map((t) => (
              <div key={t.label} className={cx('gantt-row', !t.scen.includes(selected) && 's1-faded')}>
                <span>{t.label}</span>
                <div className="gantt-track">
                  <div className="gantt-bar" style={{ left: `${t.start}%`, width: `${t.end - t.start}%`, background: t.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>Faded activities are not part of Scenario {selected}.</p>
        </Panel>
        <Panel title="Dependencies & Readiness" icon={<Layers size={15} />}>
          <div className="s1-dep">
            <span className="h">Dependency</span><span className="h">Status</span><span className="h">Notes</span>
            {DEPENDENCIES.map((d) => (
              <span key={d.dep} style={{ display: 'contents' }}>
                <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ color: COLORS.dark }}>{d.icon}</span>{d.dep}</span>
                <Pill tone={d.tone}>{d.status}</Pill>
                <span className="muted">{d.note}</span>
              </span>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn icon={<ExternalLink size={13} />} to="s5.2" className="s1-full">Open Demand &amp; Channel View</Btn>
          </div>
        </Panel>
      </Grid>

      <Panel title="Approval & Next Decisions" icon={<Wheat size={15} />}>
        <div className="s1-approval">
          <div className="cell"><Layers size={22} color={COLORS.dark} /><div>Recommended Plan<strong>{scen.short}</strong></div></div>
          <div className="cell"><CircleDollarSign size={22} color={COLORS.amber} /><div>Additional Budget Required<strong>{scen.cost}</strong></div></div>
          <div className="cell"><TrendingUp size={22} color={COLORS.green} /><div>Expected Jalna Adoption Improvement<strong>28% → {improved}%</strong></div></div>
          <div className="cell"><BarChart3 size={22} color={COLORS.green} /><div>Expected Campaign ROI<strong>3.1x → {scen.roi}</strong></div></div>
          <div className="cell"><UserCheck size={22} color={COLORS.dark} /><div>Approval Owner<strong style={{ fontSize: 12 }}>National Campaign Head</strong></div></div>
          <div className="cell"><Users size={22} color={COLORS.dark} /><div>Execution Owners<strong style={{ fontSize: 12 }}>Regional Sales Lead, Campaign Lead, Supply Lead</strong></div></div>
        </div>
        <div className="row-between" style={{ marginTop: 12 }}>
          <div className="row">
            <Btn variant="primary" icon={<CheckCircle2 size={14} />} disabled={approved === selected} onClick={() => approve()}>
              {approved === selected ? `Replan Approved (Scenario ${selected})` : 'Approve Replan'}
            </Btn>
            <Btn icon={<Send size={14} />} disabled={sent} onClick={() => { setSent(true); toast('Sent for approval to National Campaign Head'); }}>{sent ? 'Sent for Approval ✓' : 'Send for Approval'}</Btn>
            <Btn icon={<ArrowLeft size={14} />} to="s1.4">Return to Risk Analysis</Btn>
          </div>
          <div className="row">
            <span className="small muted">Recommended Next Screen →</span>
            <Btn variant={approved ? 'primary' : 'outline'} to="s6.1" icon={<ArrowRight size={14} />}>S6.1 Campaign Action Plan / Orchestration Update</Btn>
          </div>
        </div>
      </Panel>

      <FootNote />
      <FlowFooter label="Story Flow:" steps={[
        { label: 'S1.1 Command Centre', to: 's1.1' },
        { label: 'S1.2 Campaign Portfolio', to: 's1.2' },
        { label: 'S1.3 Executive Summary', to: 's1.3' },
        { label: 'S1.4 Strategic Risk Analysis', to: 's1.4' },
        { label: 'S1.5 Recovery & Replanning', to: 's1.5', current: true },
      ]} next={{ label: 'S6.1 Orchestration Update', to: 's6.1' }} />
    </div>
  );
}

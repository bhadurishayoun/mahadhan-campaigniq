import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, Calendar, CheckCircle2, Coins, Download, Filter, Gauge, IndianRupee,
  Leaf, Lightbulb, MapPin, Package, Plus, Search, Settings2, ShieldCheck, Sparkles, Sprout, Target, ThumbsUp, Truck,
  TrendingUp, Users, Wrench, FlaskConical, Network,
} from 'lucide-react';
import { useNav } from '../nav';
import { useDataset } from '../data/datasets';
import {
  AiItem, Breadcrumbs, Btn, ContextStrip, DataTable, FlowFooter, Funnel, Grid, HBars, Kpi, KpiRow, PageHeader, Panel,
  Pill, Progress, SourceBar, cx, type Tone,
} from '../ui';
import './s7.css';

/* ------------------------------------------------------------------ */
/* S7.1 Campaign Impact & Effectiveness Dashboard                      */
/* ------------------------------------------------------------------ */

type ClusterRow = { cluster: string; trials: number; rate: number; adopters: number; signal: 'ok' | 'risk' | 'moderate'; text: string };
const CLUSTER_ROWS: ClusterRow[] = [
  { cluster: 'Wadi Gaon', trials: 126, rate: 68, adopters: 86, signal: 'ok', text: 'On track' },
  { cluster: 'Dhanora', trials: 72, rate: 32, adopters: 23, signal: 'risk', text: 'At risk: Observed alongside stock receipt delay and delayed demo execution — investigate further.' },
  { cluster: 'Ambad HQ', trials: 108, rate: 69, adopters: 75, signal: 'ok', text: 'On track' },
  { cluster: 'Pimpalgaon', trials: 78, rate: 58, adopters: 45, signal: 'moderate', text: 'Moderate: Monitor conversion to drive repeat.' },
  { cluster: 'Other Villages', trials: 34, rate: 50, adopters: 17, signal: 'ok', text: 'On track' },
];

type ChannelRow = { channel: string; reached: number; trials: number; conv: string; cei: string; rel: string };
const CHANNEL_ROWS: ChannelRow[] = [
  { channel: 'Retailer Activation', reached: 482, trials: 188, conv: '58%', cei: '3.29', rel: 'Highest' },
  { channel: 'Demonstration Plots', reached: 276, trials: 104, conv: '56%', cei: '2.88', rel: 'High' },
  { channel: 'Farmer Meetings', reached: 318, trials: 72, conv: '49%', cei: '2.07', rel: 'Medium' },
  { channel: 'Digital Advisory', reached: 416, trials: 68, conv: '41%', cei: '1.96', rel: 'Medium' },
  { channel: 'Field Follow-ups', reached: 307, trials: 88, conv: '55%', cei: '2.76', rel: 'High' },
];
const REL_TONE: Record<string, Tone> = { Highest: 'green', High: 'lime', Medium: 'amber' };

const signalIcon = (s: ClusterRow['signal']) =>
  s === 'ok' ? <CheckCircle2 size={13} color="var(--green)" /> : <AlertTriangle size={13} color={s === 'risk' ? 'var(--red)' : 'var(--amber)'} />;
const rateTone = (r: number): Tone => (r < 40 ? 'red' : r < 60 ? 'amber' : 'green');

export function ImpactDashboard() {
  const { toast, go } = useNav();
  const clusterData = useDataset('impact.cluster_conversion', CLUSTER_ROWS);
  const channelData = useDataset('impact.channel_effectiveness', CHANNEL_ROWS);
  const [cluster, setCluster] = useState('Dhanora');
  const [channel, setChannel] = useState('Retailer Activation');
  const sel = clusterData.rows.find((r) => r.cluster === cluster) ?? clusterData.rows[1] ?? clusterData.rows[0];

  return (
    <div className="s7-page">
      <Breadcrumbs items={[
        { label: 'S6.2 Activity Execution & Action Workspace', to: 's6.2' },
        { label: 'Proceed to Impact Review', to: 's6.2' },
        { label: 'S7.1 Campaign Impact & Effectiveness Dashboard' },
      ]} />
      <PageHeader
        title="S7.1 — Campaign Impact & Effectiveness Dashboard"
        badge={<Pill tone="grey">Product- detailer version 1</Pill>}
        subtitle="Measure campaign performance, farmer conversion, commercial impact, and effectiveness for Croptek Onion Conversion — Ambad, Jalna"
        actions={<>
          <Btn variant="primary" icon={<Plus size={14} />} onClick={() => toast('New impact analysis created for Croptek Onion Conversion')}>Create Analysis</Btn>
          <Btn icon={<Download size={14} />} onClick={() => toast('Impact summary exported (PDF)')}>Export Summary</Btn>
          <Btn variant="gold" icon={<Sparkles size={14} />} to="ai.1">Open AI Brief</Btn>
        </>}
      />
      <SourceBar><CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Opened from S6.2 by clicking <b>“Proceed to Impact Review”</b> on 26 Jan 2027, 11:18 AM</SourceBar>

      <ContextStrip items={[
        { icon: <Target size={16} />, label: 'Campaign', value: 'Croptek Onion Conversion — Ambad, Jalna' },
        { icon: <Users size={16} />, label: 'Target Farmers (Plan)', value: '1,832' },
        { icon: <Coins size={16} />, label: 'Campaign Budget', value: '₹8.0 lakh' },
        { icon: <Sprout size={16} />, label: 'Forecast Adopters', value: '532' },
        { icon: <Boxes size={16} />, label: 'Projected Demand', value: '209 MT' },
        { icon: <BarChart3 size={16} />, label: 'Projected Revenue', value: '₹52 lakh' },
        { icon: <IndianRupee size={16} />, label: 'Projected Contribution', value: '₹13.7 lakh' },
        { icon: <Gauge size={16} />, label: 'Forecast Net ROI', value: '0.71×' },
      ]} />

      <KpiRow>
        <Kpi icon={<Users size={18} />} label="Target Farmers (Plan)" value="1,832" sub={<Pill tone="green">Plan</Pill>} spark={[3, 4, 4, 5, 5, 6, 6, 7, 8]} />
        <Kpi icon={<Users size={18} />} label="Farmers Reached To Date" value="1,246" sub={<Pill tone="green">Actual to Date</Pill>} spark={[2, 3, 4, 4, 5, 6, 7, 7, 8]} />
        <Kpi icon={<FlaskConical size={18} />} label="Trials To Date" value="418" sub={<Pill tone="green">Actual to Date</Pill>} spark={[2, 2, 3, 4, 4, 5, 6, 6, 7]} />
        <Kpi icon={<Leaf size={18} />} label="Adopters To Date" value="263" sub={<Pill tone="green">Actual to Date</Pill>} spark={[1, 2, 2, 3, 4, 4, 5, 6, 7]} />
        <Kpi icon={<Boxes size={18} />} label="Projected Demand (Forecast)" value="209 MT" sub={<Pill tone="amber">Forecast</Pill>} spark={[3, 3, 4, 5, 5, 6, 6, 7, 8]} />
        <Kpi icon={<Gauge size={18} />} label="Forecast Net ROI" value="0.71×" sub={<Pill tone="amber">Forecast</Pill>} spark={[2, 3, 3, 4, 4, 5, 5, 6, 7]} />
      </KpiRow>

      <Grid cols="1fr 1.35fr 0.95fr">
        <Panel icon={<Filter size={16} />} title="Farmer Conversion Funnel" info actions={<span className="muted small" style={{ textAlign: 'right' }}>Conversion<br />(from previous)</span>}>
          <Funnel stages={[
            { label: 'Targeted', value: '1,832', pct: '–' },
            { label: 'Reached', value: '1,246', pct: '68%' },
            { label: 'Engaged', value: '902', pct: '72%' },
            { label: 'Trialled', value: '418', pct: '46%' },
            { label: 'Adopted', value: '263', pct: '63%' },
            { label: 'Repeat', value: '94', pct: '36%' },
          ]} />
          <div className="s7-note highlight-box">
            <Target size={16} color="var(--green)" />
            <div><b>Completion forecast expects 532 adopters (29% of target)</b><span className="muted">Based on current conversion trends and planned remaining activities.</span></div>
          </div>
        </Panel>

        <Panel icon={<MapPin size={16} />} title="Crop × Geography (Cluster) Adoption Performance" info data={clusterData}>
          <DataTable<ClusterRow>
            compact
            columns={[
              { key: 'cluster', label: 'Cluster (Ambad, Jalna)', render: (r) => <b>{r.cluster}</b> },
              { key: 'trials', label: 'Trials To Date', align: 'right' },
              { key: 'rate', label: <>Adoption Rate<br /><small className="muted">(To Date)</small></>, width: 110, render: (r) => <Progress value={r.rate} tone={rateTone(r.rate)} label={`${r.rate}%`} /> },
              { key: 'adopters', label: <>Adopters<br /><small className="muted">(To Date)</small></>, align: 'right' },
              { key: 'text', label: 'Risk / Key Signal', width: '38%', render: (r) => <span className="s7-signal">{signalIcon(r.signal)}<span>{r.text}</span></span> },
            ]}
            rows={clusterData.rows}
            highlight={(r) => r.cluster === cluster}
            onRowClick={(r) => setCluster(r.cluster)}
          />
          <div className={cx('row-between', sel.signal === 'ok' ? 'highlight-box' : sel.signal === 'risk' ? 'danger-box' : 'warn-box')} style={{ marginTop: 10, fontSize: 12 }}>
            <span><b>{sel.cluster}:</b> {sel.adopters} adopters from {sel.trials} trials ({sel.rate}% trial-to-adoption). {sel.signal === 'ok' ? 'Performing in line with plan.' : 'Requires root-cause diagnosis.'}</span>
            <Btn small to="s7.2" icon={<Search size={12} />}>Diagnose</Btn>
          </div>
        </Panel>

        <Panel className="ai-panel" icon={<Sparkles size={16} />} title="AI Impact Insights">
          <div className="stack" style={{ gap: 8 }}>
            <AiItem icon={<CheckCircle2 size={15} />} tone="green" title="Strong retailer activation in Ambad HQ / Wadi Gaon.">
              Higher trial-to-adoption conversion (69% / 68%) indicates effective retailer engagement and product positioning.
            </AiItem>
            <AiItem icon={<AlertTriangle size={15} />} tone="red" title="Dhanora is trailing plan on trial-to-adoption conversion.">
              This coincides with delayed stock receipt and rescheduled demonstration activity; investigate conversion drivers before confirming root cause.
            </AiItem>
            <AiItem icon={<Leaf size={15} />} tone="green" title="Repeat potential in Pimpalgaon.">
              With 45 adopters (58% conversion) and early repeat signals, there is scope to drive higher repeat adoption through targeted follow-ups.
            </AiItem>
          </div>
        </Panel>
      </Grid>

      <Grid cols="1.25fr 1.1fr 0.7fr">
        <Panel icon={<BarChart3 size={16} />} title="Channel Effectiveness Comparison" info data={channelData}>
          <DataTable<ChannelRow>
            compact
            columns={[
              { key: 'channel', label: 'Channel', render: (r) => <b>{r.channel}</b> },
              { key: 'reached', label: 'Reached', align: 'right' },
              { key: 'trials', label: <>Trials<br />Generated</>, align: 'right' },
              { key: 'conv', label: <>Adopter<br />Conversion</>, align: 'right' },
              { key: 'cei', label: <>Cost Efficiency Index<br /><small className="muted">(Adopters per ₹1 L)</small></>, align: 'right' },
              { key: 'rel', label: <>Relative<br />Effectiveness</>, align: 'center', render: (r) => <Pill tone={REL_TONE[r.rel]}>{r.rel}</Pill> },
            ]}
            rows={channelData.rows}
            highlight={(r) => r.channel === channel}
            onRowClick={(r) => setChannel(r.channel)}
          />
        </Panel>

        <Panel icon={<Coins size={16} />} title="Commercial Impact" info>
          <div className="s7-split">
            <div>
              <h4>Actual to Date <small>(Campaign Progress)</small></h4>
              <div className="s7-list">
                <div><span><Users size={13} />Realized Demand</span><b>102 MT</b></div>
                <Progress value={102} max={209} label="49% of forecast" />
                <div><span><BarChart3 size={13} />Estimated Revenue <small className="muted">(linked to campaign progress)</small></span><b>₹25.4 lakh</b></div>
                <Progress value={25.4} max={52} label="49%" />
                <div><span><Coins size={13} />Estimated Contribution</span><b>₹6.3 lakh</b></div>
                <Progress value={6.3} max={13.7} label="46%" />
              </div>
            </div>
            <div className="highlight-box">
              <h4>Forecast at Completion <small>(if campaign completes as planned)</small></h4>
              <div className="s7-list">
                <div><span><Boxes size={13} />Projected Demand</span><b>209 MT</b></div>
                <div><span><BarChart3 size={13} />Projected Revenue</span><b>₹52 lakh</b></div>
                <div><span><Coins size={13} />Projected Contribution</span><b>₹13.7 lakh</b></div>
                <div><span><Gauge size={13} />Forecast Net ROI</span><b>0.71×</b></div>
              </div>
            </div>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>
            ⓘ Net ROI = (Projected Incremental Contribution − Campaign Spend) / Campaign Spend.<br />
            Note: This is a <b>forecast</b> at completion, not a realized or final return. All financials are illustrative.
          </p>
        </Panel>

        <Panel icon={<Network size={16} />} title="Next Action" info className="ai-panel">
          <button type="button" className="s7-next" onClick={() => go('s7.2')}>
            <span>Investigate Conversion &amp; ROI Drivers<small>S7.2 Campaign Diagnostics &amp; Learning Studio</small></span>
            <ArrowRight size={16} />
          </button>
          <p className="muted small" style={{ marginTop: 10 }}>Focus cluster: <b>{cluster}</b> · Channel in view: <b>{channel}</b></p>
        </Panel>
      </Grid>

      <FlowFooter
        steps={[
          { label: '‹ Source: S6.2 Activity Execution & Action Workspace', to: 's6.2' },
          { label: 'Current: S7.1 Campaign Impact & Effectiveness Dashboard', current: true },
        ]}
        next={{ label: 'S7.2 Campaign Diagnostics & Learning Studio', to: 's7.2' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S7.2 Campaign Diagnostics & Learning Studio                         */
/* ------------------------------------------------------------------ */

type GeoRow = { cluster: string; trials: number; adopters: number; conv: string; vs: string; dir: 'up' | 'down' | 'flat' | 'none' };
const GEO_ROWS: GeoRow[] = [
  { cluster: 'Wadi Gaon', trials: 126, adopters: 86, conv: '68%', vs: '+8 pp', dir: 'up' },
  { cluster: 'Ambad HQ', trials: 108, adopters: 75, conv: '69%', vs: '+9 pp', dir: 'up' },
  { cluster: 'Dhanora', trials: 72, adopters: 23, conv: '32%', vs: '−28 pp', dir: 'down' },
  { cluster: 'Pimpalgaon', trials: 62, adopters: 37, conv: '60%', vs: '+0 pp', dir: 'flat' },
  { cluster: 'Other Villages', trials: 112, adopters: 63, conv: '56%', vs: '−4 pp', dir: 'down' },
];

type RoiRow = { metric: string; value: string };
const ROI_ROWS: RoiRow[] = [
  { metric: 'Incremental demand (est.)', value: '~113 MT' },
  { metric: 'Incremental revenue (est.)', value: '~₹28.1 Lakh' },
  { metric: 'Incremental contribution (est.)', value: '~₹7.4 Lakh' },
  { metric: 'Attributable ROI (to date)', value: '0.93×' },
];

const FACTORS: { icon: ReactNode; title: string; text: string; chip: 'Verified' | 'Probable'; evidence: string }[] = [
  { icon: <Package size={16} />, title: 'Stock Receipt Delay', text: 'Replenishment (14 MT) pending vs. planned date', chip: 'Verified', evidence: 'S5.4 transfer log: Dhanora transfer in transit; retailer receipt not confirmed on planned date.' },
  { icon: <Calendar size={16} />, title: 'Demonstration Delay', text: "Demo planned on 22 Jan '27 rescheduled to 26 Jan '27", chip: 'Verified', evidence: 'S6.2 activity record: Demonstration Plot – Dhanora moved from 22 Jan to 26 Jan 2027.' },
  { icon: <Users size={16} />, title: 'Farmer Engagement', text: 'Lower field interaction pre-demo (−15% vs. other clusters)', chip: 'Probable', evidence: 'Field visit and meeting counts per farmer are ~15% below cluster average before the demo.' },
  { icon: <Sprout size={16} />, title: 'Adoption Behaviour', text: 'Higher price sensitivity and need for stronger local advocacy', chip: 'Probable', evidence: 'Farmer response notes mention price and request peer/champion validation more often than other clusters.' },
];

const INSIGHTS: { key: string; label: string; icon: ReactNode; bg: string; color: string; points: string[] }[] = [
  { key: 'worked', label: 'What Worked', icon: <ThumbsUp size={18} />, bg: '#e2f2d9', color: '#22672f', points: ['Retailer-led activation and demos drove higher conversion (~65% in Wadi Gaon & Ambad HQ)', 'Timely field follow-ups improved adoption by ~8–10 pp'] },
  { key: 'under', label: 'What Underperformed', icon: <AlertTriangle size={18} />, bg: '#fdf0cf', color: '#8a5b00', points: ['Dhanora conversion (32%) below cluster average (60%)', 'Engagement lower due to demo delay and pending stock receipt'] },
  { key: 'change', label: 'What to Change', icon: <Target size={18} />, bg: '#e1edf9', color: '#275f9a', points: ['Ensure stock confirmation before demo scheduling', 'Intensify retailer & field follow-ups in Dhanora', 'Focus on advocacy (local champion farmers) to improve adoption'] },
];

const LEARNINGS = [
  'Prioritize stock-ready clusters for high-impact demos',
  'Replicate retailer-led model (Wadi Gaon, Ambad HQ)',
  'Strengthen engagement in low-conversion markets (Dhanora)',
  'Use early-stage reminders for trial-to-repeat conversion',
];

export function DiagnosticsStudio() {
  const { toast } = useNav();
  const geoData = useDataset('impact.geo_performance', GEO_ROWS);
  const [factor, setFactor] = useState(0);
  const [insight, setInsight] = useState('under');
  const [saved, setSaved] = useState<boolean[]>(LEARNINGS.map(() => true));
  const [geoSel, setGeoSel] = useState('Dhanora');
  const geo = geoData.rows.find((g) => g.cluster === geoSel) ?? geoData.rows[2] ?? geoData.rows[0];

  const dirArrow = (r: GeoRow) => (r.dir === 'up' ? '▲ ' : r.dir === 'down' ? '▼ ' : r.dir === 'flat' ? '↑ ' : '');
  const dirColor = (r: GeoRow) => (r.dir === 'up' ? 'var(--green)' : r.dir === 'down' ? 'var(--red)' : 'var(--muted)');

  return (
    <div className="s7-page">
      <Breadcrumbs items={[
        { label: 'S7.1 Campaign Impact & Effectiveness', to: 's7.1' },
        { label: 'S7.2 Campaign Diagnostics & Learning Studio' },
      ]} />
      <PageHeader
        back="s7.1"
        title="S7.2 Campaign Diagnostics & Learning Studio"
        subtitle="Understand performance drivers, quantify impact and capture learnings for future campaigns"
      />
      <SourceBar><CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Source: S7.1 Campaign Impact &amp; Effectiveness Dashboard <ArrowRight size={12} style={{ verticalAlign: 'middle', margin: '0 6px' }} /> <b>Investigate Conversion &amp; ROI Drivers</b></SourceBar>

      <Panel>
        <div className="s7-hero">
          <div className="s7-onion" aria-hidden>🧅</div>
          <div>
            <h2>Croptek Onion Conversion – Ambad, Jalna</h2>
            <div className="s7-meta">
              <span><MapPin size={13} />Ambad Cluster</span>
              <span><Calendar size={13} />Late Rabi 2026–27</span>
              <span><Target size={13} />Target Farmers: 1,832</span>
            </div>
          </div>
          <div className="s7-minis">
            <span>Actuals (Till 24 Jan '27)</span>
            <div className="s7-mini-row">
              <div className="s7-mini"><Users size={18} /><div><strong>306</strong><small>Trials</small></div></div>
              <div className="s7-mini"><CheckCircle2 size={18} /><div><strong>184</strong><small>Adopters</small></div></div>
              <div className="s7-mini"><BarChart3 size={18} /><div><strong>60%</strong><small>Trial → Adoption</small></div></div>
            </div>
          </div>
          <div className="s7-minis">
            <span>Forecast (Campaign Plan)</span>
            <div className="s7-mini-row">
              <div className="s7-mini"><Target size={18} /><div><strong>532</strong><small>Forecast Adopters</small></div></div>
              <div className="s7-mini"><Boxes size={18} /><div><strong>209 MT</strong><small>Projected Demand</small></div></div>
              <div className="s7-mini"><Coins size={18} /><div><strong>₹52 Lakh</strong><small>Projected Revenue</small></div></div>
              <div className="s7-mini"><BarChart3 size={18} /><div><strong>₹13.7 Lakh</strong><small>Projected Contribution</small></div></div>
              <div className="s7-mini"><div><strong>0.71×</strong><small>Forecast Net ROI</small></div></div>
            </div>
          </div>
        </div>
      </Panel>

      <Grid cols="1fr 1.4fr 0.85fr">
        <Panel data={geoData} icon={<MapPin size={16} />} title={<>Geography-wise Performance <span className="muted">(Actuals to date)</span></>}>
          <DataTable<GeoRow>
            compact
            columns={[
              { key: 'cluster', label: 'Cluster', render: (r) => <b>{r.cluster}</b> },
              { key: 'trials', label: 'Trials', align: 'right' },
              { key: 'adopters', label: 'Adopters', align: 'right' },
              { key: 'conv', label: 'Trial → Adoption', align: 'right' },
              { key: 'vs', label: 'vs. Cluster Avg.', align: 'right', render: (r) => <span style={{ color: dirColor(r), fontWeight: 600 }}>{dirArrow(r)}{r.vs}</span> },
            ]}
            rows={geoData.rows}
            highlight={(r) => r.cluster === geoSel}
            onRowClick={(r) => setGeoSel(r.cluster)}
            total={{ cluster: <b>Total (Ambad)</b>, trials: <b>480</b>, adopters: <b>284</b>, conv: <b>59%</b>, vs: '–' }}
          />
          <p className="small muted" style={{ marginTop: 8 }}>
            {geo.cluster}: {geo.conv} trial-to-adoption ({geo.vs} vs. cluster avg.). {geo.dir === 'down' ? 'Below average — see root-cause analysis.' : 'At or above average.'}
          </p>
        </Panel>

        <Panel icon={<Search size={16} />} title="Conversion Root Cause Analysis – Dhanora">
          <div className="s7-tree">
            <div className="s7-node-root">
              <div>Trial → Adoption Conversion<strong>(32%)</strong></div>
            </div>
            <div className="s7-bracket left" />
            <div className="s7-factors">
              {FACTORS.map((f, i) => (
                <button key={f.title} type="button" className={cx('s7-factor', factor === i && 'active')} onClick={() => setFactor(i)}>
                  {f.icon}
                  <span><b>{f.title}</b>{f.text}</span>
                  <Pill tone={f.chip === 'Verified' ? 'amber' : 'blue'}>✓ {f.chip}</Pill>
                </button>
              ))}
            </div>
            <div className="s7-bracket" />
            <div className="s7-node-out">
              <Target size={18} />
              <div>Lower Trial-to-Adoption Conversion</div>
              <strong>(32%)</strong>
            </div>
          </div>
          <div className="highlight-box small" style={{ marginTop: 8 }}>
            <b>Evidence – {FACTORS[factor].title}:</b> {FACTORS[factor].evidence}
          </div>
        </Panel>

        <Panel icon={<Coins size={16} />} title="Estimated Commercial Exposure – Dhanora">
          <div className="s7-list">
            <div><span><Boxes size={14} color="var(--green)" />Expected adopters (plan share)</span><b>~104</b></div>
            <div><span><Target size={14} color="var(--green)" />Likely adopters at current run-rate</span><b>~47</b></div>
            <div><span><AlertTriangle size={14} color="var(--amber)" />Adoption gap (est.)</span><b>~57</b></div>
            <div><span><Truck size={14} color="var(--green)" />At-risk demand (est.)</span><b>~22 MT</b></div>
            <div><span><IndianRupee size={14} color="var(--amber)" />Potential revenue at risk (est.)</span><b>~₹5.5 Lakh</b></div>
            <div><span><BarChart3 size={14} color="var(--green)" />Potential contribution at risk (est.)</span><b>~₹1.4 Lakh</b></div>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>All financials are illustrative.</p>
        </Panel>
      </Grid>

      <Grid cols="1fr 1.05fr 1.3fr">
        <Panel icon={<BarChart3 size={16} />} title={<>Intervention Effectiveness <span className="muted">(Trial → Adoption %)</span></>}>
          <HBars max={80} valueSuffix="%" rows={[
            { label: 'Retailer Activation', value: 72 },
            { label: 'Demonstration Plot', value: 66 },
            { label: 'Farmer Meeting', value: 58, tone: 'lime' },
            { label: 'Digital Advisory', value: 49, tone: 'lime' },
            { label: 'Field Follow-up', value: 62 },
          ]} />
          <div className="row-between muted small" style={{ marginTop: 4, paddingLeft: '30%' }}><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span></div>
        </Panel>

        <Panel icon={<TrendingUp size={16} />} title={<>ROI Attribution <span className="muted">(Campaign to date)</span></>}>
          <Grid cols="1.3fr 1fr" gap={10}>
            <DataTable<RoiRow>
              compact
              columns={[
                { key: 'metric', label: 'Metric' },
                { key: 'value', label: 'Value', align: 'right', render: (r) => <b>{r.value}</b> },
              ]}
              rows={ROI_ROWS}
            />
            <div className="small">
              <b className="row" style={{ marginBottom: 4 }}><Settings2 size={13} />Methodology</b>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 3, color: '#3d4b40' }}>
                <li>Compared with pre-campaign baseline (similar clusters)</li>
                <li>Adoption-linked incremental demand</li>
                <li>Contribution based on product margin</li>
              </ul>
              <div className="row" style={{ marginTop: 8 }}><ShieldCheck size={13} color="var(--green)" /><b>Confidence</b><Pill tone="amber">Medium (~70%)</Pill></div>
            </div>
          </Grid>
        </Panel>

        <Panel className="ai-panel" icon={<Sparkles size={16} />} title="AI Insights – What to do next">
          <div className="stack" style={{ gap: 6 }}>
            {INSIGHTS.map((ins) => (
              <div key={ins.key} className={cx('s7-insight-row', insight === ins.key && 'active')} onClick={() => setInsight(ins.key)}>
                <div className="s7-insight-tag" style={{ background: ins.bg, color: ins.color }}>{ins.icon}{ins.label}</div>
                <ul>{ins.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
            <Btn icon={<Wrench size={14} />} to="s6.2" onClick={() => toast('Corrective action drafted for Dhanora — opening S6.2')}>Create Corrective Action → S6.2</Btn>
            <Btn variant="primary" icon={<Target size={14} />} to="s2.5">Create Next-Season Campaign Strategy → S2.5</Btn>
          </div>
        </Panel>
      </Grid>

      <Panel>
        <div className="s7-learn">
          <b className="row"><Lightbulb size={18} color="var(--yellow)" />Key Learnings for Next Season</b>
          {LEARNINGS.map((l, i) => (
            <button
              key={l}
              type="button"
              className={cx(saved[i] && 'saved')}
              onClick={() => {
                setSaved((s) => s.map((v, k) => (k === i ? !v : v)));
                toast(saved[i] ? `Removed from next-season playbook: ${l}` : `Added to next-season playbook: ${l}`);
              }}
            >
              <CheckCircle2 size={15} style={{ opacity: saved[i] ? 1 : 0.3 }} />{l}
            </button>
          ))}
        </div>
      </Panel>

      <FlowFooter
        steps={[
          { label: '‹ Back to S7.1 Campaign Impact & Effectiveness Dashboard', to: 's7.1' },
          { label: 'Current: S7.2 Campaign Diagnostics & Learning Studio', current: true },
        ]}
        next={{ label: 'S2.5 Next-Season Campaign Recommendations', to: 's2.5' }}
      />
    </div>
  );
}

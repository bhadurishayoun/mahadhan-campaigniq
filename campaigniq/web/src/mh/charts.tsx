import { useState, type ReactNode } from 'react';
import { useNav } from '../nav';
import { Bell, BarChart3, Filter, Grid3x3, IndianRupee, ListChecks, Megaphone, Sparkles, Target, ClipboardCheck, Wallet } from '../icons';
import { QuestionChips, AlertList, Bullets, ChartCard, ColumnBars, FunnelBars, HeatGrid, KpiCard, KpiGrid, MapCard, MonthGantt, RankBars, ScatterPlot } from '../ui/index';
import type { MapView } from '../map/IndiaDistrictMap';
import type { PulseItem } from '../ui/index';

/* Illustrative figures only; they reuse the numbers shown on the BH / MH screens. */
const REGIONS = ['West', 'South', 'North', 'East'];

function Mh1Charts() {
  const { go } = useNav();
  const trail: { label: string; view: MapView }[] = [
    { label: 'India', view: 'india' },
    { label: 'Maharashtra', view: { state: 'Maharashtra' } },
    { label: 'West Region · Jalna', view: { district: 'Jalna', state: 'Maharashtra' } },
  ];
  const [depth, setDepth] = useState(1);
  return (
    <div className="iq-stack">
      <KpiGrid cols={5}>
        <KpiCard icon={IndianRupee} label="YTD business vs ABP" value="₹42.8 Cr" change={-14.4} changeLabel="to ABP" tone="amber" />
        <KpiCard icon={Megaphone} label="Active campaigns" value="12" />
        <KpiCard icon={Wallet} label="Marketing investment" value="₹1.90 Cr" spark={[0.4, 0.7, 1.0, 1.3, 1.6, 1.9]} />
        <KpiCard icon={Target} label="Regions below plan" value="3" tone="red" />
        <KpiCard icon={ClipboardCheck} label="Approvals pending" value="4" tone="blue" onClick={() => go('mh.8')} />
      </KpiGrid>
      <div className="iq-grid-2">
        <MapCard title="Where is the opportunity?" label="National opportunity map" height={300}
          view={trail[depth].view} focus={trail[depth].view}
          crumbs={trail.slice(0, depth + 1).map((t) => t.label)} onCrumb={(i) => setDepth(i)}
          states={{ Maharashtra: { tone: 4, info: 'Largest opportunity', onSelect: () => setDepth(1) }, Gujarat: { tone: 3, info: 'High channel readiness' }, Karnataka: { tone: 2, info: 'Emerging cluster' }, 'Madhya Pradesh': { tone: 2, info: 'Expansion territory' } }}
          markers={[{ id: 'jalna', info: 'Jalna priority district', onSelect: () => setDepth(2) }, { id: 'nashik', info: 'Nashik demand anchor' }, { id: 'dhule', info: 'Dhule activation corridor' }, { id: 'sangli', info: 'Sangli referral adoption' }]}
          scale={{ title: 'Opportunity intensity', items: [{ label: 'Priority', tone: 4 }, { label: 'High', tone: 3 }, { label: 'Emerging', tone: 2 }] }} />
        <ChartCard icon={BarChart3} title="Which regions lead on achievement?" hint="YTD achievement vs ABP (%)"><RankBars highlightFirst fmt={(v) => `${v}%`} series={[{ key: 'v', name: 'Achievement %' }]} data={[{ name: 'West', v: 88.8 }, { name: 'East', v: 85.6 }, { name: 'South', v: 84.3 }, { name: 'North', v: 82.7 }]} /></ChartCard>
      </div>
    </div>
  );
}

function Mh2Charts() {
  return (
    <ChartCard icon={Sparkles} title="Where is potential high but penetration low?" hint="Each dot is a district; top-left = biggest headroom">
      <ScatterPlot xLabel="Penetration (%)" yLabel="Potential (index)" points={[{ name: 'Jalna', x: 38, y: 82 }, { name: 'Nashik', x: 52, y: 74 }, { name: 'Dhule', x: 31, y: 58 }, { name: 'Sangli', x: 44, y: 66 }, { name: 'Pune', x: 60, y: 70 }]} />
    </ChartCard>
  );
}

function GapCharts() {
  return (
    <ChartCard icon={BarChart3} title="Which territories carry the biggest gap?" hint="Gap to ABP, ₹ Cr"><RankBars highlightFirst fmt={(v) => `₹${v}`} series={[{ key: 'v', name: '₹ Cr' }]} data={[{ name: 'Ambad', v: 1.0 }, { name: 'Ghansawangi', v: 0.6 }, { name: 'Badnapur', v: 0.4 }]} /></ChartCard>
  );
}

const barrierGrid = (
  <ChartCard icon={Grid3x3} title="Which barriers dominate in each region?" hint="Share of farmers citing the barrier (%)">
    <HeatGrid corner="Region" rows={REGIONS} cols={['Awareness', 'Trust', 'Availability', 'Price']} fmt={(v) => `${v}%`} values={[[34, 22, 18, 26], [28, 31, 20, 21], [25, 24, 33, 18], [30, 20, 27, 23]]} />
  </ChartCard>
);
const dropFunnel = (
  <ChartCard icon={Filter} title="Where do farmers drop off?" hint="Farmers at each stage"><FunnelBars stages={[{ label: 'Aware', value: 1000 }, { label: 'Trial', value: 420 }, { label: 'Purchase', value: 190 }, { label: 'Repeat', value: 86 }]} /></ChartCard>
);

function ThemeFit() {
  return (
    <ChartCard icon={BarChart3} title="Which campaign themes fit best?" hint="Strategic fit score (0–100)"><RankBars highlightFirst series={[{ key: 'v', name: 'Fit' }]} data={[{ name: 'Croptek conversion', v: 86 }, { name: 'Retailer advocacy', v: 78 }, { name: 'Trial nurture', v: 71 }, { name: 'Crop awareness', v: 63 }]} /></ChartCard>
  );
}

function Mh6Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Where does the budget go by segment?" hint="₹ Lakh by activity"><ColumnBars x="a" stacked height={220} series={[{ key: 'emerging', name: 'Emerging', color: '#e8c13a' }, { key: 'growing', name: 'Growing', color: '#5fae4c' }, { key: 'maturing', name: 'Maturing', color: '#3972b8' }, { key: 'matured', name: 'Matured', color: '#1f5f2c' }]} data={[{ a: 'Dealer meets', emerging: 1, growing: 2, maturing: 1.5, matured: 0.7 }, { a: 'Village demos', emerging: 2, growing: 3, maturing: 1.8, matured: 1 }, { a: 'Follow-ups', emerging: 0.8, growing: 1.4, maturing: 0.9, matured: 0.5 }, { a: 'Digital', emerging: 0.4, growing: 0.7, maturing: 0.5, matured: 0.3 }]} /></ChartCard>
      <ChartCard icon={ListChecks} title="When does each activity run?"><MonthGantt months={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} rows={[{ label: 'Dealer meets', start: 0, end: 1 }, { label: 'Village demos', start: 1, end: 4 }, { label: 'Follow-ups', start: 2, end: 5 }, { label: 'Digital nudges', start: 0, end: 5 }]} /></ChartCard>
    </div>
  );
}

function RoiScatter() {
  return (
    <ChartCard icon={Sparkles} title="Is spend earning its return?" hint="Forecast ROI vs budget; bigger and higher is better">
      <ScatterPlot xLabel="Budget (₹ Lakh)" yLabel="Forecast ROI (x)" points={[{ name: 'Croptek conversion', x: 9, y: 2.4 }, { name: 'Adoption drive', x: 23, y: 1.9 }, { name: 'Retailer enablement', x: 22, y: 1.6 }, { name: 'Trial follow-up', x: 18, y: 2.1 }]} />
    </ChartCard>
  );
}

function Mh8Charts({ withMap }: { withMap?: boolean }) {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={Bell} title="How long are approvals waiting?" hint="Days in queue"><Bullets unit="d" max={10} rows={[{ label: 'Croptek conversion', actual: 2, target: 3 }, { label: 'Retailer advocacy', actual: 5, target: 3 }, { label: 'Trial nurture', actual: 7, target: 3 }]} /></ChartCard>
      {withMap && <MapCard title="Where is rollout releasing?" label="Rollout map" height={240} view={{ district: 'Jalna', state: 'Maharashtra' }} markers={[{ id: 'v-ambad', info: 'Released' }, { id: 'v-dhanora', info: 'Release scheduled', color: '#d7a62f' }]} />}
    </div>
  );
}

function Mh9Charts({ map }: { map?: boolean }) {
  return (
    <div className="iq-stack">
      <div className="iq-grid-2">
        <ChartCard icon={Grid3x3} title="Which crop and region combos perform?" hint="Execution vs plan (%)"><HeatGrid corner="Crop" rows={['Onion', 'Maize', 'Soybean']} cols={REGIONS} fmt={(v) => `${v}%`} values={[[88, 74, 68, 72], [80, 70, 66, 64], [76, 68, 60, 62]]} /></ChartCard>
        <ChartCard icon={BarChart3} title="What drives the gaps?" hint="Observed workflow gaps (count)"><RankBars highlightFirst series={[{ key: 'v', name: 'Villages' }]} data={[{ name: 'Follow-up lag', v: 6 }, { name: 'Stock continuity', v: 4 }, { name: 'Demo attendance', v: 3 }, { name: 'Retailer onboarding', v: 2 }]} /></ChartCard>
      </div>
      {map && <MapCard title="Where is impact showing?" label="Impact map" height={250} view={{ district: 'Jalna', state: 'Maharashtra' }} talukas={{ Ambad: { tone: 4, info: 'Strong impact' }, Badnapur: { tone: 2, info: 'Moderate' }, Ghansawangi: { tone: 1, info: 'Early' } }} markers={[{ id: 'v-ambad' }, { id: 'v-dhanora' }]} />}
    </div>
  );
}

const withAlerts = (node: ReactNode, items: { text: string; kind?: 'risk' | 'warn' | 'info' | 'ok' }[]) => (
  <div className="iq-stack">{node}<ChartCard icon={Bell} title="What needs attention?"><AlertList items={items} /></ChartCard></div>
);

function ChipsFor({ qs }: { qs: string[] }) { const { toast } = useNav(); return <QuestionChips questions={qs} onPick={(q) => toast(`Question sent to the Copilot: ${q}`)} />; }

export const MH_OWN_MAP = new Set(['MH.1']);
export const MH_CHARTS: Record<string, ReactNode> = {
  'MH.AI1': <ChipsFor qs={['Which regions need attention first?', 'Where is potential highest?', 'Which approvals are ageing?', 'What drives the West gap?']} />,
  'MH.1': withAlerts(<Mh1Charts />, [{ text: 'West execution is 6 pp below plan.', kind: 'risk' }, { text: 'North adoption evidence needs source validation.', kind: 'warn' }, { text: 'Two strategic themes await a decision.', kind: 'info' }]),
  'MH.2': <Mh2Charts />,
  'MH.3': <GapCharts />, 'MH.3A': <GapCharts />, 'MH.3B': <GapCharts />,
  'MH.4': <div className="iq-grid-2">{dropFunnel}{barrierGrid}</div>,
  'MH.4A': dropFunnel, 'MH.4A-I2': barrierGrid, 'MH.4A-I3': dropFunnel, 'MH.4A-I4': <div className="iq-grid-2">{dropFunnel}{barrierGrid}</div>,
  'MH.4B': <ThemeFit />,
  'MH.5': <ChartCard icon={Target} title="Does the brief meet its governance thresholds?" hint="Current vs required threshold"><Bullets max={100} rows={[{ label: 'Evidence coverage', actual: 72, target: 80 }, { label: 'ABP alignment', actual: 90, target: 85 }, { label: 'Audience validation', actual: 60, target: 75 }]} /></ChartCard>,
  'MH.6': <Mh6Charts />,
  'MH.9C': <Mh9Charts map />,
  'MH.9D': <ChartCard icon={BarChart3} title="Which gaps justify an optimization request?" hint="Villages affected"><RankBars highlightFirst series={[{ key: 'v', name: 'Villages' }]} data={[{ name: 'Follow-up lag', v: 6 }, { name: 'Stock continuity', v: 4 }, { name: 'Demo attendance', v: 3 }]} /></ChartCard>,
  'MH.7': <RoiScatter />, 'MH.7A': <RoiScatter />, 'MH.7B': <RoiScatter />,
  'MH.8': <Mh8Charts />, 'MH.8A': <Mh8Charts withMap />,
  'MH.9': <Mh9Charts map />, 'MH.9A': <Mh9Charts map />, 'MH.9B': <Mh9Charts />,
};
export const MH_PULSE: Record<string, PulseItem[]> = {
  'MH.1': [{ label: 'Opportunity realization', value: 86 }, { label: 'Regions on plan', value: 25, tone: 'amber' }, { label: 'Approvals cleared', value: 60 }],
  'MH.2': [{ label: 'Potential captured', value: 52, tone: 'amber' }, { label: 'Product coverage', value: 71 }, { label: 'Data confidence', value: 80 }],
  'MH.6': [{ label: 'Budget allocated', value: 92 }, { label: 'Calendar locked', value: 66, tone: 'amber' }, { label: 'Segment balance', value: 78 }],
  'MH.8': [{ label: 'Approvals cleared', value: 58, tone: 'amber' }, { label: 'On-time decisions', value: 67 }, { label: 'Rollout readiness', value: 79 }],
  'MH.9': [{ label: 'Execution vs plan', value: 90, tone: 'amber' }, { label: 'Evidence verified', value: 64 }, { label: 'Drivers confirmed', value: 40, tone: 'amber' }],
};

import type { ReactNode } from 'react';
import { useNav } from '../nav';
import { BarChart3, ClipboardCheck, Filter, IndianRupee, LineChart, MapPin, Store, Target, Users, Wallet, Bell, ListChecks, Sparkles } from '../icons';
import { SEGMENT } from '../chartTheme';
import { QuestionChips, AlertList, Bullets, ChartCard, ColumnBars, FunnelBars, KpiCard, KpiGrid, MapCard, RankBars, ScatterPlot, TrendLine } from '../ui/index';
import type { PulseItem } from '../ui/index';

/* Illustrative figures only: every number below mirrors what the TM screens already show. */
const talukaTones = { Ambad: { tone: 4 as const, info: 'Highest achievement' }, Badnapur: { tone: 2 as const, info: 'Mid achievement' }, Ghansawangi: { tone: 1 as const, info: 'Early coverage' }, Jalna: { tone: 1 as const, info: 'Feeder market' } };
const jalna = { district: 'Jalna', state: 'Maharashtra' };

export function TM_KPIS(): ReactNode {
  return (
    <KpiGrid cols={5}>
      <KpiCard icon={IndianRupee} label="Last-year sales" value="₹8.0 Cr" spark={[5.8, 6.4, 6.9, 7.3, 7.6, 8.0]} />
      <KpiCard icon={Target} label="Current-year ABP target" value="₹10.0 Cr" />
      <KpiCard icon={Wallet} label="Required growth" value="+25%" tone="amber" change={25} changeLabel="vs last year" />
      <KpiCard icon={MapPin} label="Territories planned" value="3" />
      <KpiCard icon={ClipboardCheck} label="Plan readiness" value="78%" tone="blue" />
    </KpiGrid>
  );
}

function Tm1Charts() {
  const { go } = useNav();
  return (
    <div className="iq-stack">
      <div className="iq-grid-2">
        <MapCard title="Which clusters are ahead of plan?" label="Ambad cluster achievement map" view={jalna} talukas={talukaTones} markers={[{ id: 'v-ambad', info: 'Ambad · ₹3.2 Cr → ₹4.2 Cr', action: { label: 'Plan territory', run: () => go('tm.2') } }]} scale={{ title: 'Achievement vs ABP', items: [{ label: 'Ahead', tone: 4 }, { label: 'On plan', tone: 2 }, { label: 'Behind', tone: 1 }] }} height={280} />
        <ChartCard icon={LineChart} title="Are we tracking the monthly plan?" hint="₹ Cr, Apr–Sep (illustrative)">
          <TrendLine x="m" height={250} series={[{ key: 'plan', name: 'Plan' }, { key: 'actual', name: 'Actual' }]} data={[{ m: 'Apr', plan: 0.7, actual: 0.6 }, { m: 'May', plan: 0.8, actual: 0.7 }, { m: 'Jun', plan: 0.8, actual: 0.8 }, { m: 'Jul', plan: 0.9, actual: 0.8 }, { m: 'Aug', plan: 0.9, actual: 0.9 }, { m: 'Sep', plan: 1.0, actual: 0.9 }]} />
        </ChartCard>
      </div>
      <div className="iq-grid-2">
        <ChartCard icon={Filter} title="Where do activities drop off?"><FunnelBars stages={[{ label: 'Planned', value: 24 }, { label: 'Approved', value: 18 }, { label: 'Executed', value: 14 }, { label: 'Reported', value: 11 }]} /></ChartCard>
        <ChartCard icon={BarChart3} title="Which crops carry the plan?" hint="Target by crop, ₹ Cr"><RankBars label="name" series={[{ key: 'v', name: '₹ Cr' }]} highlightFirst fmt={(v) => `₹${v}`} data={[{ name: 'Onion', v: 4.6 }, { name: 'Maize', v: 2.4 }, { name: 'Soybean', v: 1.8 }, { name: 'Others', v: 1.2 }]} /></ChartCard>
      </div>
      <ChartCard icon={Bell} title="What needs attention?"><AlertList items={[{ text: 'Pimpalgaon readiness gap may slow conversion.', kind: 'risk', action: { label: 'Open coverage plan', onClick: () => go('tm.4') } }, { text: 'Ambad carries the largest absolute uplift (+₹1.0 Cr).', kind: 'warn' }, { text: '11 of 14 reconciliation checks complete.', kind: 'info' }]} /></ChartCard>
    </div>
  );
}

function Tm2Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={Store} title="How deep is outlet coverage by village?" hint="Retailers linked"><RankBars series={[{ key: 'v', name: 'Retailers' }]} highlightFirst data={[{ name: 'Ambad HQ', v: 22 }, { name: 'Dhanora', v: 14 }, { name: 'Wadi Gaon', v: 11 }, { name: 'Pimpalgaon', v: 9 }]} /></ChartCard>
      <ChartCard icon={Users} title="Which outlet tiers dominate?" hint="Outlets by tier"><ColumnBars x="tier" height={170} series={[{ key: 'n', name: 'Outlets' }]} data={[{ tier: 'Tier A', n: 18 }, { tier: 'Tier B', n: 31 }, { tier: 'Tier C', n: 25 }]} /></ChartCard>
    </div>
  );
}

function Tm3Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Which outlets carry the biggest targets?" hint="ABP target, ₹ Cr"><RankBars series={[{ key: 'v', name: '₹ Cr' }]} highlightFirst fmt={(v) => `₹${v}`} data={[{ name: 'Shiv Traders', v: 1.25 }, { name: 'Cluster B', v: 1.14 }, { name: 'Mahalaxmi Agro', v: 1.05 }, { name: 'Cluster A', v: 0.76 }]} /></ChartCard>
      <ChartCard icon={Target} title="How far is each outlet from its target?" hint="Allocated target vs last-year base (₹ Cr)"><Bullets neutral unit="" max={1.5} rows={[{ label: 'Shiv Traders', actual: 0.96, target: 1.25 }, { label: 'Mahalaxmi Agro', actual: 0.82, target: 1.05 }, { label: 'Cluster A', actual: 0.58, target: 0.76 }, { label: 'Cluster B', actual: 0.84, target: 1.14 }]} /></ChartCard>
    </div>
  );
}

function Tm4Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="How much onion area is in each village?" hint="Acres, by readiness"><RankBars series={[{ key: 'v', name: 'Acres' }]} highlightFirst data={[{ name: 'Ambad HQ belt', v: 510 }, { name: 'Dhanora', v: 420 }, { name: 'Wadi Gaon', v: 360 }, { name: 'Pimpalgaon', v: 280 }]} /></ChartCard>
      <ChartCard icon={ListChecks} title="What is the crop mix?" hint="Share of planned area (%)"><RankBars stacked series={[{ key: 'onion', name: 'Onion' }, { key: 'maize', name: 'Maize' }, { key: 'other', name: 'Other' }]} data={[{ name: 'Dhanora', onion: 62, maize: 24, other: 14 }, { name: 'Wadi Gaon', onion: 55, maize: 30, other: 15 }, { name: 'Ambad HQ', onion: 68, maize: 20, other: 12 }, { name: 'Pimpalgaon', onion: 48, maize: 34, other: 18 }]} /></ChartCard>
    </div>
  );
}

function Tm5Charts() {
  return (
    <ChartCard icon={BarChart3} title="How does each territory's plan compare with the ABP?" hint="Plan vs ABP, ₹ Cr"><ColumnBars x="t" height={200} series={[{ key: 'plan', name: 'Plan' }, { key: 'abp', name: 'ABP' }]} data={[{ t: 'Ambad', plan: 4.1, abp: 4.2 }, { t: 'Ghansawangi', plan: 3.3, abp: 3.4 }, { t: 'Badnapur', plan: 2.4, abp: 2.4 }]} /></ChartCard>
  );
}

function Cw1Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={Users} title="Which segments are we targeting?" hint="Farmers by segment"><ColumnBars x="s" height={190} series={[{ key: 'n', name: 'Farmers' }]} data={Object.keys(SEGMENT).map((s, i) => ({ s, n: [120, 340, 280, 90][i] }))} /></ChartCard>
      <MapCard title="Which villages are in scope?" label="Campaign scope villages" view={jalna} talukas={talukaTones} markers={[{ id: 'v-ambad' }, { id: 'v-dhanora' }, { id: 'v-wadigaon' }, { id: 'v-pimpalgaon' }]} height={240} />
    </div>
  );
}

function Cw2Charts() {
  return (
    <ChartCard icon={BarChart3} title="Where does the budget go?" hint="₹ Lakh by activity and phase"><ColumnBars x="a" stacked height={210} series={[{ key: 'pre', name: 'Pre-season' }, { key: 'season', name: 'In-season' }]} data={[{ a: 'Dealer meets', pre: 3.2, season: 2.0 }, { a: 'Village demos', pre: 2.8, season: 5.0 }, { a: 'Follow-ups', pre: 0.6, season: 3.0 }, { a: 'Digital', pre: 0.9, season: 1.0 }]} /></ChartCard>
  );
}

function Cw3Charts() {
  return (
    <ChartCard icon={BarChart3} title="Which scenario converts best?" hint="Trial-to-purchase conversion (%)"><ColumnBars x="s" height={190} series={[{ key: 'c', name: 'Conversion %' }]} data={[{ s: 'Conservative', c: 16.1 }, { s: 'Base', c: 18.4 }, { s: 'Stretch', c: 21.2 }]} target={18.4} /></ChartCard>
  );
}

function Cw4Charts() {
  return (
    <div className="iq-stack">
      <KpiGrid cols={3}><KpiCard icon={Wallet} label="Total budget" value="₹18.5 L" tone="amber" /><KpiCard icon={ClipboardCheck} label="Review completeness" value="96%" /><KpiCard icon={CalendarIcon} label="Status" value="Draft" tone="blue" /></KpiGrid>
      <ChartCard icon={BarChart3} title="How is the final budget split?" hint="₹ Lakh"><RankBars series={[{ key: 'v', name: '₹ Lakh' }]} highlightFirst data={[{ name: 'Village demos', v: 7.8 }, { name: 'Dealer meets', v: 5.2 }, { name: 'Field follow-ups', v: 3.6 }, { name: 'Digital nudges', v: 1.9 }]} /></ChartCard>
    </div>
  );
}
import { CalendarCheck as CalendarIcon } from '../icons';

function Ex1Charts() {
  const { go } = useNav();
  return (
    <div className="iq-grid-2">
      <ChartCard icon={LineChart} title="Are we keeping pace each week?" hint="Cumulative % of activities"><TrendLine x="w" height={230} fmt={(v) => `${v}%`} series={[{ key: 'plan', name: 'Plan' }, { key: 'actual', name: 'Actual' }]} data={[{ w: 'W1', plan: 12, actual: 10 }, { w: 'W2', plan: 28, actual: 24 }, { w: 'W3', plan: 45, actual: 39 }, { w: 'W4', plan: 62, actual: 55 }, { w: 'W5', plan: 80, actual: 72 }]} /></ChartCard>
      <MapCard title="Which villages need escalation?" label="Escalation map" view={jalna} talukas={talukaTones} markers={[{ id: 'v-dhanora', color: '#d9534f', info: 'Follow-up lag', action: { label: 'Handle in corrective actions', run: () => go('tm.ex2') } }, { id: 'v-pimpalgaon', color: '#d9534f', info: 'Demo attendance low' }, { id: 'v-wadigaon', color: '#d7a62f', info: 'Stock-out watch' }]} height={230} />
    </div>
  );
}

function Ex2Charts() {
  return (
    <ChartCard icon={BarChart3} title="Which villages have the most open issues?" hint="Open issues"><RankBars series={[{ key: 'v', name: 'Open issues' }]} highlightFirst data={[{ name: 'Dhanora', v: 4 }, { name: 'Pimpalgaon', v: 3 }, { name: 'Wadi Gaon', v: 2 }, { name: 'Ambad HQ', v: 0 }]} /></ChartCard>
  );
}

function Im1Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Did sales improve by crop?" hint="Sales index, before vs after"><ColumnBars x="c" height={200} series={[{ key: 'before', name: 'Before' }, { key: 'after', name: 'After' }]} data={[{ c: 'Onion', before: 100, after: 112 }, { c: 'Maize', before: 100, after: 108 }, { c: 'Soybean', before: 100, after: 111 }]} /></ChartCard>
      <ChartCard icon={LineChart} title="Is adoption growing?" hint="Adopters per week"><TrendLine x="w" height={200} series={[{ key: 'a', name: 'Adopters' }]} data={[{ w: 'W1', a: 20 }, { w: 'W2', a: 46 }, { w: 'W3', a: 81 }, { w: 'W4', a: 118 }, { w: 'W5', a: 152 }]} /></ChartCard>
    </div>
  );
}

function Im2Charts() {
  return (
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Which activities convert best?" hint="Conversion (%)"><RankBars series={[{ key: 'v', name: 'Conversion %' }]} highlightFirst fmt={(v) => `${v}%`} data={[{ name: 'Dealer meets', v: 24 }, { name: 'Village demos', v: 21 }, { name: 'Follow-up visits', v: 17 }, { name: 'Digital nudges', v: 9 }]} /></ChartCard>
      <ChartCard icon={Sparkles} title="Does more reach mean more conversion?" hint="Each dot is a village"><ScatterPlot xLabel="Qualified reach (%)" yLabel="Conversion (%)" points={[{ name: 'Ambad HQ', x: 82, y: 24 }, { name: 'Dhanora', x: 64, y: 14 }, { name: 'Wadi Gaon', x: 58, y: 16 }, { name: 'Pimpalgaon', x: 49, y: 11 }, { name: 'Ghansawangi', x: 71, y: 19 }]} /></ChartCard>
    </div>
  );
}

function ChipsFor({ qs }: { qs: string[] }) { const { toast } = useNav(); return <QuestionChips questions={qs} onPick={(q) => toast(`Question sent to the Copilot: ${q}`)} />; }

export const TM_CHARTS: Record<string, ReactNode> = {
  'TM.AI1': <ChipsFor qs={['Which villages need intervention this week?', 'How do I close the 8 pp execution gap?', 'Which drivers are verified?', 'Where should I shift field days?']} />,
  'TM.1': <Tm1Charts />, 'TM.2': <Tm2Charts />, 'TM.3': <Tm3Charts />, 'TM.4': <Tm4Charts />, 'TM.5': <Tm5Charts />,
  'CW.1': <Cw1Charts />, 'CW.2': <Cw2Charts />, 'CW.3': <Cw3Charts />, 'CW.4': <Cw4Charts />,
  'TM.EX1': <Ex1Charts />, 'TM.EX2': <Ex2Charts />, 'TM.IM1': <Im1Charts />, 'TM.IM2': <Im2Charts />,
};

export const TM_PULSE: Record<string, PulseItem[]> = {
  'TM.1': [{ label: 'Plan readiness', value: 78 }, { label: 'ABP coverage', value: 100 }, { label: 'Growth feasibility', value: 64, tone: 'amber' }],
  'TM.2': [{ label: 'Mapping complete', value: 86 }, { label: 'Outlets verified', value: 82 }, { label: 'Duplicates cleared', value: 70, tone: 'amber' }],
  'TM.3': [{ label: 'Targets allocated', value: 100 }, { label: 'Reviewed', value: 50, tone: 'amber' }, { label: 'Within stretch band', value: 75 }],
  'TM.4': [{ label: 'Coverage adequacy', value: 78, tone: 'amber' }, { label: 'Villages ready', value: 40, tone: 'amber' }, { label: 'Crop-fit validated', value: 80 }],
  'TM.5': [{ label: 'Checks complete', value: 79 }, { label: 'Assumptions validated', value: 60, tone: 'amber' }, { label: 'Package ready', value: 90 }],
  'TM.EX1': [{ label: 'Execution vs plan', value: 90, tone: 'amber' }, { label: 'Villages on track', value: 60, tone: 'amber' }, { label: 'Follow-up completion', value: 74 }],
  'TM.EX2': [{ label: 'Issues closed', value: 56 }, { label: 'High-priority open', value: 33, tone: 'amber' }, { label: 'Owners assigned', value: 100 }],
  'TM.IM1': [{ label: 'Qualified reach', value: 68 }, { label: 'Trial conversion', value: 19 }, { label: 'Evidence verified', value: 57, tone: 'amber' }],
  'TM.IM2': [{ label: 'Villages analysed', value: 100 }, { label: 'Drivers verified', value: 57, tone: 'amber' }, { label: 'Hypotheses open', value: 43, tone: 'amber' }],
};

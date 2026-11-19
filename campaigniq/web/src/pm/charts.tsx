import type { ReactNode } from 'react';
import { BarChart3, Bell, ClipboardCheck, Grid3x3, IndianRupee, Package, Sparkles, Target, Wallet } from '../icons';
import { useNav } from '../nav';
import { QuestionChips, Bullets, ChartCard, ColumnBars, HeatGrid, KpiCard, KpiGrid, MapCard, RankBars, Waterfall } from '../ui/index';
import type { PulseItem } from '../ui/index';
import { PORTFOLIO, PORTFOLIO_TOTAL } from './data';

/* Illustrative figures only; product numbers come from pm/data.ts so every screen stays consistent. */
const jalna = { district: 'Jalna', state: 'Maharashtra' };
const crL = (v: number) => `₹${v}`;

const Pm1 = () => (
  <div className="iq-stack">
    <KpiGrid cols={4}>
      <KpiCard icon={IndianRupee} label="Last-year sales" value={`₹${PORTFOLIO_TOTAL.ly} Cr`} />
      <KpiCard icon={Target} label="ABP target" value={`₹${PORTFOLIO_TOTAL.abp} Cr`} />
      <KpiCard icon={Package} label="Products in portfolio" value={String(PORTFOLIO.length)} />
      <KpiCard icon={ClipboardCheck} label="Territory submissions" value="1 of 4" tone="amber" />
    </KpiGrid>
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Which products carry the ABP?" hint="Last year vs ABP, ₹ Cr"><ColumnBars x="p" height={210} fmt={crL} series={[{ key: 'ly', name: 'Last year' }, { key: 'abp', name: 'ABP' }]} data={PORTFOLIO.map((r) => ({ p: r.product, ly: r.ly, abp: r.abp }))} /></ChartCard>
      <ChartCard icon={Grid3x3} title="Which crop and product pairs are strongest?" hint="ABP by crop, ₹ Cr"><HeatGrid corner="Crop" rows={['Onion', 'Maize', 'Soybean']} cols={['Croptek', 'Water Soluble', 'Specialty']} fmt={(v) => v.toFixed(1)} values={[[1.4, 0.7, 0.3], [1.0, 0.6, 0.4], [0.8, 0.5, 0.3]]} /></ChartCard>
    </div>
  </div>
);

const Pm2 = () => (
  <div className="iq-grid-2">
    <ChartCard icon={ClipboardCheck} title="How far along are territory submissions?" hint="Territories by status"><ColumnBars x="s" height={190} series={[{ key: 'n', name: 'Territories' }]} data={[{ s: 'Not started', n: 1 }, { s: 'Submitted', n: 1 }, { s: 'Returned', n: 1 }, { s: 'Endorsed', n: 1 }]} /></ChartCard>
    <MapCard title="Which territories are pending?" label="Submission status map" height={230} view={jalna} markers={[{ id: 'v-ambad', info: 'Ambad · submitted, under review' }, { id: 'v-dhanora', color: '#d7a62f', info: 'Awaiting TM' }]} />
  </div>
);

const Pm2a = () => (
  <ChartCard icon={BarChart3} title="How does the TM submission reconcile to the ABP?" hint="₹ Cr, Ambad ( bridge)"><Waterfall fmt={crL} steps={[{ label: 'TM submitted', value: 3.8, total: true }, { label: 'Crop revalidation', value: 0.15 }, { label: 'Outlet adjustment', value: 0.25 }, { label: 'ABP', value: 4.2, total: true }]} /></ChartCard>
);

const PmCompare = () => (
  <ChartCard icon={BarChart3} title="How does the submission compare with what is required?" hint="Submitted vs required by crop, ₹ Cr "><ColumnBars x="c" height={200} fmt={crL} series={[{ key: 'sub', name: 'Submitted' }, { key: 'req', name: 'Required' }]} data={[{ c: 'Onion', sub: 1.65, req: 1.8 }, { c: 'Maize', sub: 1.1, req: 1.3 }, { c: 'Soybean', sub: 1.05, req: 1.1 }]} /></ChartCard>
);

const Pm4 = () => (
  <KpiGrid cols={3}>
    <KpiCard icon={Sparkles} label="Conversion & Adoption" value="Fit 86" tone="green" />
    <KpiCard icon={Sparkles} label="Retailer Enablement" value="Fit 78" tone="blue" />
    <KpiCard icon={Sparkles} label="Trial & Follow-up" value="Fit 71" tone="amber" />
  </KpiGrid>
);

const Pm5c = () => (
  <ChartCard icon={BarChart3} title="Which campaign concepts look strongest?" hint="Concept score (0–100)"><RankBars highlightFirst series={[{ key: 'v', name: 'Score' }]} data={[{ name: 'Retailer-led conversion', v: 84 }, { name: 'Trial nurture', v: 72 }, { name: 'Demo-plot network', v: 66 }]} /></ChartCard>
);

const Pm7d = () => (
  <ChartCard icon={ClipboardCheck} title="How far has each asset got through approval?" hint="Approval progress (%)"><Bullets max={100} rows={[{ label: 'Croptek leaflet', actual: 100, target: 100 }, { label: 'Retailer deck', actual: 75, target: 100 }, { label: 'Demo-plot banner', actual: 50, target: 100 }, { label: 'WhatsApp creative', actual: 25, target: 100 }]} /></ChartCard>
);

const Pm8 = () => (
  <div className="iq-grid-2">
    <ChartCard icon={BarChart3} title="How do the scenarios compare?" hint="Forecast net ROI (x)"><ColumnBars x="s" height={200} series={[{ key: 'roi', name: 'Net ROI' }]} data={[{ s: 'Conservative', roi: 1.4 }, { s: 'Base', roi: 1.9 }, { s: 'Stretch', roi: 2.3 }]} /></ChartCard>
    <ChartCard icon={Sparkles} title="Which assumption moves ROI most?" hint="Swing in ROI (x) for ±10% change"><RankBars highlightFirst series={[{ key: 'v', name: 'ROI swing' }]} data={[{ name: 'Conversion rate', v: 0.5 }, { name: 'Average price', v: 0.3 }, { name: 'Investment', v: 0.25 }, { name: 'Reach', v: 0.2 }]} /></ChartCard>
  </div>
);

const Pm8d = () => (
  <ChartCard icon={BarChart3} title="How much do the two proposals overlap?" hint="Audience share (%)"><RankBars stacked series={[{ key: 'only', name: 'Only this proposal' }, { key: 'both', name: 'Both proposals' }]} data={[{ name: 'Proposal A', only: 62, both: 38 }, { name: 'Proposal B', only: 55, both: 45 }]} /></ChartCard>
);

const Pm9 = () => (
  <div className="iq-grid-2">
    <ChartCard icon={Bell} title="How long are items waiting in the inbox?" hint="Days open"><RankBars highlightFirst series={[{ key: 'v', name: 'Days' }]} data={[{ name: 'Ambad submission', v: 6 }, { name: 'Dhanora plan', v: 4 }, { name: 'Retailer deck', v: 2 }]} /></ChartCard>
    <ChartCard icon={Wallet} title="Is cost within the norm?" hint="Cost per outlet, ₹ thousand vs norm"><Bullets unit="k" max={60} rows={[{ label: 'Dealer meet', actual: 28, target: 30 }, { label: 'Village demo', actual: 41, target: 36 }, { label: 'Follow-up visit', actual: 12, target: 14 }]} /></ChartCard>
  </div>
);

const Impact = ({ map }: { map?: boolean }) => (
  <div className="iq-stack">
    <div className="iq-grid-2">
      <ChartCard icon={BarChart3} title="Which campaigns lifted sales?" hint="Uplift vs baseline (%)"><RankBars highlightFirst fmt={(v) => `${v}%`} series={[{ key: 'v', name: 'Uplift %' }]} data={[{ name: 'Croptek conversion', v: 11.6 }, { name: 'Retailer enablement', v: 8.4 }, { name: 'Trial follow-up', v: 6.1 }]} /></ChartCard>
      <ChartCard icon={Grid3x3} title="Where is uplift strongest?" hint="Uplift (%) by crop and region"><HeatGrid corner="Crop" rows={['Onion', 'Maize']} cols={['West', 'South', 'North']} fmt={(v) => `${v}%`} values={[[12, 8, 6], [9, 7, 5]]} /></ChartCard>
    </div>
    <div className="iq-grid-2">
      <ChartCard icon={Sparkles} title="What explains the difference?" hint="Verified driver strength"><RankBars highlightFirst series={[{ key: 'v', name: 'Strength' }]} data={[{ name: 'Follow-up completion', v: 78 }, { name: 'Dealer support density', v: 64 }, { name: 'Stock continuity', v: 41 }]} /></ChartCard>
      {map && <MapCard title="Where is impact showing?" label="Impact map" height={240} view={jalna} talukas={{ Ambad: { tone: 4, info: 'Strong' }, Badnapur: { tone: 2, info: 'Moderate' }, Ghansawangi: { tone: 1, info: 'Early' } }} markers={[{ id: 'v-ambad' }, { id: 'v-dhanora' }]} />}
    </div>
  </div>
);

function ChipsFor({ qs }: { qs: string[] }) { const { toast } = useNav(); return <QuestionChips questions={qs} onPick={(q) => toast(`Question sent to the Copilot: ${q}`)} />; }

export const PM_CHARTS: Record<string, ReactNode> = {
  'PM.AI1': <ChipsFor qs={['Why is Dhanora adoption lower?', 'Which proposal has the best ROI?', 'Which territories are pending?', 'What should change next season?']} />,
  'PM.1': <Pm1 />, 'PM.2': <Pm2 />, 'PM.2A': <Pm2a />, 'PM.3': <PmCompare />, 'PM.3C': <PmCompare />, 'PM.4': <Pm4 />,
  'PM.5C': <Pm5c />, 'PM.7D': <Pm7d />, 'PM.8': <Pm8 />, 'PM.8C': <Pm8 />, 'PM.8D': <Pm8d />,
  'PM.9': <Pm9 />, 'PM.9B': <Pm9 />, 'PM.10': <Impact map />, 'PM.10A': <Impact />, 'PM.11': <Impact map />, 'PM.11D': <Impact />,
};
export const PM_PULSE: Record<string, PulseItem[]> = {
  'PM.1': [{ label: 'ABP coverage', value: 82 }, { label: 'Submissions in', value: 25, tone: 'amber' }, { label: 'Portfolio confidence', value: 68, tone: 'amber' }],
  'PM.2': [{ label: 'Submissions received', value: 50 }, { label: 'Reviewed', value: 25, tone: 'amber' }, { label: 'Data confidence', value: 75 }],
  'PM.8': [{ label: 'Mandatory checks', value: 60, tone: 'amber' }, { label: 'ROI confidence', value: 66, tone: 'amber' }, { label: 'Evidence attached', value: 80 }],
  'PM.9': [{ label: 'Inbox cleared', value: 40, tone: 'amber' }, { label: 'On-time', value: 70 }, { label: 'Cost within norm', value: 78 }],
  'PM.10': [{ label: 'Impact verified', value: 57, tone: 'amber' }, { label: 'Execution coverage', value: 76 }, { label: 'Uplift vs plan', value: 88 }],
};

/* Charts shown inside drawers, keyed by drawer title */
export const PM_DRAWER_CHARTS: Record<string, ReactNode> = {
  'Retailer Enablement — Intervention Configuration': (
    <ChartCard icon={Target} title="Are the intervention KPIs on track?" hint="Planned vs target "><Bullets rows={[{ label: 'Retailers trained', actual: 18, target: 24, }, { label: 'Farmer trials', actual: 140, target: 160 }, { label: 'Adoption rate', actual: 42, target: 45 }]} unit="" /></ChartCard>
  ),
};

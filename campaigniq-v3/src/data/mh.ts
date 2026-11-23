/**
 * Marketing Head data: national and regional opportunity, plan reviews, diagnosis and investigation, recommendations,
 * proposals, rollout and performance. Shared figures are read from bh.ts, zm.ts and fsm.ts so every persona agrees.
 * Money in ₹ lakh unless noted.
 */
import type { MhRegionId } from '../routes';
import { AMBAD, ambadMetrics, CAMPAIGNS, campaignById, netRoi, NATIONAL, REGIONS, regionById, regionRoi, THEMES, type ThemeId } from './bh';
import { ratio, sum } from './format';
import { coverageCalc, ONION_VILLAGE_PLAN } from './fsm';
import {
  approvalQueue, businessCaseC1, businessCaseC2, CROPTEK_EVIDENCE, impactRows, REGIONAL_ENVELOPE, scenariosFor, territoryPlan, trialToPurchasePct,
  ZM_TERRITORY_IDS, zmTerritoryName,
} from './zm';

// ---------------------------------------------------------------- regions (national view)
export interface RegionOpportunity {
  id: MhRegionId; market: number; /** ₹ Cr addressable market */ crop: string; product: string; marketRange: [number, number]; /** ₹ Cr, priority crop · product */
  penetration: [number, number]; trend: number[]; /** ₹ L secondary sales Q1–Q4 */ level: 'High' | 'Medium–High' | 'Medium'; gap: string;
}
/** Addressable market per region (₹ Cr) sums to the ₹1,350 Cr national figure; West's priority market is Maharashtra onion. */
export const REGION_OPPORTUNITY: RegionOpportunity[] = [
  { id: 'west', market: 420, crop: 'Onion', product: 'Croptek', marketRange: [7, 10], penetration: CROPTEK_EVIDENCE.penetrationRange, trend: CROPTEK_EVIDENCE.secondarySales.map((q) => q.v), level: 'High', gap: 'High potential, under-indexing' },
  { id: 'south', market: 380, crop: 'Paddy', product: 'Croptek', marketRange: [6, 9], penetration: [16, 20], trend: [34, 36, 39, 41], level: 'High', gap: 'Strong momentum, scale further' },
  { id: 'north', market: 310, crop: 'Wheat', product: 'Croptek', marketRange: [5, 7], penetration: [12, 15], trend: [22, 23, 25, 26], level: 'Medium–High', gap: 'Stable, improve penetration' },
  { id: 'east', market: 240, crop: 'Paddy', product: 'Croptek', marketRange: [3, 5], penetration: [9, 12], trend: [18, 19, 21, 23], level: 'Medium', gap: 'Emerging expansion opportunity' },
];
export const NATIONAL_MARKET = () => sum(REGION_OPPORTUNITY, (r) => r.market);
export const regionName = (r: MhRegionId) => regionById(r).name;

/** Region rows: opportunity plus the Business Head figures (sales, campaigns, adopters, investment, ROI). */
export const regionRows = () => REGION_OPPORTUNITY.map((o) => {
  const r = regionById(o.id);
  const t = o.trend;
  return {
    ...o, name: r.name, abp: r.abp, achieved: r.achieved, campaigns: r.campaigns, adopters: r.adopters, investment: r.actual,
    validatedSales: r.sales, roi: regionRoi(r), trendTotal: sum(t, (x) => x), trendGrowthPct: ratio(t[t.length - 1] - t[0], t[0]),
  };
});
export const nationalRow = () => ({
  market: NATIONAL_MARKET(), abp: NATIONAL.abp, achieved: NATIONAL.achieved, campaigns: NATIONAL.campaigns, adopters: NATIONAL.adopters,
  investment: NATIONAL.actual, validatedSales: sum(REGIONS, (r) => r.sales), roi: netRoi(sum(REGIONS, (r) => r.sales), NATIONAL.actual),
});

// ---------------------------------------------------------------- historical campaign effectiveness (Business Head themes)
const THEME_RANGES: Record<ThemeId, { engagement: [number, number]; adoption: [number, number]; confidence: 'Verified' | 'Estimated' | 'Partial attribution' }> = {
  conversion: { engagement: [45, 55], adoption: [14, 20], confidence: 'Verified' },
  retailer: { engagement: [58, 66], adoption: [8, 13], confidence: 'Estimated' },
  trial: { engagement: [40, 50], adoption: [9, 15], confidence: 'Estimated' },
  awareness: { engagement: [70, 78], adoption: [6, 10], confidence: 'Partial attribution' },
};
export const themeEffectiveness = () => THEMES.map((t) => ({ ...t, ...THEME_RANGES[t.id], roi: netRoi(t.sales, t.investment) }));

// ---------------------------------------------------------------- West states and the Maharashtra onion market
export const WEST_STATES: { state: string; market: [number, number]; penetration: [number, number] }[] = [
  { state: 'Maharashtra', market: [7, 10], penetration: CROPTEK_EVIDENCE.penetrationRange },
  { state: 'Gujarat', market: [5, 7], penetration: [18, 22] },
  { state: 'Madhya Pradesh', market: [4, 6], penetration: [12, 16] },
  { state: 'Rajasthan', market: [3, 5], penetration: [16, 20] },
];
export const westSalesTotal = () => sum(CROPTEK_EVIDENCE.secondarySales, (q) => q.v);
/** Previous Croptek campaign effectiveness in Maharashtra onion. */
export const PREVIOUS_CAMPAIGNS: { intervention: string; engagementPct: number; evidence: string; confidence: 'High' | 'Moderate' | 'Limited' }[] = [
  { intervention: 'Retailer activation', engagementPct: 62, evidence: 'Higher offtake at participating outlets', confidence: 'High' },
  { intervention: 'Conversion', engagementPct: 45, evidence: 'Improved product trials and repeat', confidence: 'Moderate' },
  { intervention: 'Awareness', engagementPct: 74, evidence: 'Strong reach and interest generation', confidence: 'Limited' },
];

// ---------------------------------------------------------------- business and crop plans (from the Zonal Manager data)
export type MhPlanStatus = 'reviewed' | 'under_review' | 'not_started' | 'clarification';
export const MH_PLAN_LABEL: Record<MhPlanStatus, string> = { reviewed: 'Endorsed by Zonal Manager', under_review: 'Under review', not_started: 'Not started', clarification: 'Clarification requested' };
/** West plans by state; Maharashtra rolls up the Zonal Manager's Marathwada territory plans. */
export const WEST_PLANS: { id: string; state: string; crop: string; product: string; focus: string; objective: number; intervention: string; base: MhPlanStatus }[] = [
  { id: 'maharashtra', state: 'Maharashtra', crop: 'Onion', product: 'Croptek', focus: 'Conversion', objective: CROPTEK_EVIDENCE.planLinkage, intervention: 'Retailer-led Croptek conversion', base: 'reviewed' },
  { id: 'gujarat', state: 'Gujarat', crop: 'Priority crops', product: 'Crop nutrition', focus: 'Portfolio penetration', objective: 18, intervention: 'Awareness and portfolio education', base: 'under_review' },
  { id: 'madhya-pradesh', state: 'Madhya Pradesh', crop: 'Priority crops', product: 'Croptek and portfolio', focus: 'Adoption', objective: 12, intervention: 'Adoption and trial support', base: 'not_started' },
  { id: 'rajasthan', state: 'Rajasthan', crop: 'Priority crops', product: 'Nutrition portfolio', focus: 'Channel coverage', objective: 10, intervention: 'Channel activation and product visibility', base: 'not_started' },
];
/** Ambad contributing plan (equal to FSM and ZM): ABP, approved onion allocation and the onion growth objective. */
export const ambadPlan = () => {
  const p = territoryPlan('ambad');
  return { abp: p.abp, plan: p.plan, onionAllocation: AMBAD.onionAbp, growthObjective: CROPTEK_EVIDENCE.planLinkage, croptekSku: p.croptekSku };
};
/** Other Maharashtra territories in the zone (consolidated). */
export const otherMaharashtra = () => ZM_TERRITORY_IDS.filter((t) => t !== 'ambad').map((t) => territoryPlan(t));
/** Village-wise Ambad onion plan: the FSM plan with its coverage calculation. */
export const ambadVillages = () => ONION_VILLAGE_PLAN.map((v) => ({ ...v, calc: coverageCalc(v) }));

// ---------------------------------------------------------------- diagnosis and investigation
export const BARRIERS: { id: string; barrier: string; question: string; before: string; after: string; beforeTone: 'warn' | 'neutral'; afterTone: 'ok' | 'warn' | 'risk' }[] = [
  { id: 'awareness', barrier: 'Awareness', question: 'Do eligible farmers know Croptek and its crop-stage use?', before: 'Unverified', after: 'Partly confirmed: 65% reached', beforeTone: 'warn', afterTone: 'warn' },
  { id: 'conversion', barrier: 'Conversion', question: 'Do trials turn into purchases?', before: 'Not linked', after: 'Confirmed: 36% trial-to-purchase', beforeTone: 'warn', afterTone: 'risk' },
  { id: 'channel', barrier: 'Channel', question: 'Do retailers recommend and stock Croptek?', before: 'Unverified', after: 'Partly confirmed: retailer evidence received', beforeTone: 'warn', afterTone: 'warn' },
  { id: 'retention', barrier: 'Retention', question: 'Do buyers repeat next season?', before: 'No data', after: 'Not yet measurable this season', beforeTone: 'neutral', afterTone: 'warn' },
];
/** Funnel: 1,200 eligible → 780 reached → 150 trials → purchases (linked once the evidence is validated). */
export const FUNNEL = { eligible: 1200, reached: 780, trials: CROPTEK_EVIDENCE.trials, purchases: CROPTEK_EVIDENCE.purchases };
export const funnel = (purchasesLinked: boolean) => ({
  ...FUNNEL, purchases: purchasesLinked ? FUNNEL.purchases : null,
  reachPct: ratio(FUNNEL.reached, FUNNEL.eligible), trialPct: ratio(FUNNEL.trials, FUNNEL.reached),
  trialToPurchasePct: purchasesLinked ? trialToPurchasePct() : null,
});
export type RequestStatus = 'draft' | 'requested' | 'received' | 'validated';
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = { draft: 'Draft', requested: 'Requested', received: 'Evidence received', validated: 'Validated' };
export const EVIDENCE_REQUESTS: { id: string; title: string; owner: string; due: string; requirements: string[]; checklist: string[] }[] = [
  { id: 'purchases', title: 'Farmer-linked purchase records', owner: 'Zonal analyst', due: '20 Feb 2027', requirements: ['Farmer ID or mobile number', 'Croptek SKU and quantity', 'Purchase date within the campaign window'], checklist: ['Records matched to trial farmers', 'Duplicates removed', 'Dates inside the campaign window'] },
  { id: 'awareness', title: 'Awareness and call outcomes', owner: 'Field Sales Manager · Ambad', due: '22 Feb 2027', requirements: ['Reached farmer list', 'Call outcome codes', 'Consent status'], checklist: ['Reach list reconciled', 'Outcome codes complete', 'Consent recorded'] },
  { id: 'retailer', title: 'Retailer recommendation evidence', owner: 'Retail operations', due: '24 Feb 2027', requirements: ['Retailers briefed', 'Recommendation logs', 'Stock on hand'], checklist: ['Retailer list matches the mapped outlets', 'Recommendation logs present', 'Stock confirmed'] },
];
/** Evidence readiness before the investigation; items linked to a request change once that request is validated. */
export const EVIDENCE_READINESS: { item: string; source: string; status: string; tone: 'ok' | 'warn' | 'risk'; request?: string }[] = [
  { item: 'CRM farmer cohort', source: 'CRM', status: 'Partial', tone: 'warn' },
  { item: 'Call-centre contact records', source: 'Call centre', status: 'Available, matching pending', tone: 'ok', request: 'awareness' },
  { item: 'Field trial records', source: 'Field app', status: 'Partial', tone: 'warn' },
  { item: 'Farmer awareness', source: 'Call centre / survey', status: 'Unavailable', tone: 'risk', request: 'awareness' },
  { item: 'Farmer-linked purchase', source: 'DMS / channel', status: 'Unavailable', tone: 'risk', request: 'purchases' },
  { item: 'Retailer influence', source: 'DMS / channel', status: 'Awaiting validation', tone: 'warn', request: 'retailer' },
  { item: 'Stock readiness', source: 'DMS / channel', status: 'Awaiting validation', tone: 'warn', request: 'retailer' },
  { item: 'Historical campaigns', source: 'Campaign records', status: 'Partially available', tone: 'warn' },
];
export const ANALYSIS_MODULES = ['Farmer awareness and conversion', 'Historical intervention effectiveness', 'Retailer influence', 'Repeat adoption'];
export const SOURCE_SYSTEMS: { system: string; status: string; tone: 'ok' | 'warn' }[] = [
  { system: 'CRM / call centre', status: 'Availability to check', tone: 'warn' },
  { system: 'Field records', status: 'Partially available', tone: 'ok' },
  { system: 'Channel sales', status: 'Requires validation', tone: 'warn' },
  { system: 'Historical campaign records', status: 'Availability to check', tone: 'warn' },
];
export const ANALYSIS_CHECKS = ['Comparable time period confirmed', 'Reporting basis confirmed (secondary sales)', 'Audience eligibility data checked', 'Campaign history complete'];
export const ANALYSIS_OWNERS = ['Marketing analytics', 'CRM team', 'Call centre operations', 'Regional marketing lead'];
export const INVESTIGATION_QUESTION = 'What explains low Croptek penetration despite rising secondary sales?';
/** Owners and due dates offered for the evidence requests. */
export const REQUEST_OWNERS = ['Zonal analyst', 'CRM / sales operations', 'CRM / call centre', 'Field Sales Manager · Ambad', 'Retail operations', 'Regional sales team'];
/** Status of each request right after creation (purchases and awareness evidence come back first). */
export const STATUS_AFTER_CREATE: Record<string, RequestStatus> = { purchases: 'received', awareness: 'received', retailer: 'requested' };
/** Status progression when the Marketing Head requests and reviews evidence. */
export const nextRequestStatus = (s: RequestStatus): RequestStatus => (s === 'draft' ? 'requested' : s === 'requested' ? 'received' : 'validated');

// ---------------------------------------------------------------- recommendations
export interface Recommendation { id: string; name: string; theme: ThemeId; leading: boolean; before: 'Medium' | 'Low' | 'Medium-low'; after: 'High' | 'Medium' | 'Medium-low'; rationale: string; missing: string[]; suitability: string }
export const RECOMMENDATIONS: Recommendation[] = [
  { id: 'croptek-conversion', name: 'Croptek conversion', theme: 'conversion', leading: true, before: 'Medium', after: 'High', rationale: 'Large onion market with 14–18% penetration, rising secondary sales and a measured trial-to-purchase gap.', missing: ['Comparable baseline', 'Retailer stock norms'], suitability: 'Fits the Ambad onion growth objective and the conversion theme (+0.40× historical ROI).' },
  { id: 'product-awareness', name: 'Product awareness', theme: 'awareness', leading: false, before: 'Medium-low', after: 'Medium-low', rationale: 'Reach is already 65% of eligible farmers; awareness alone shows the lowest historical return.', missing: ['Awareness lift measure'], suitability: 'Supports conversion but returns +0.10× on its own.' },
  { id: 'retailer-advocacy', name: 'Retailer advocacy', theme: 'retailer', leading: false, before: 'Low', after: 'Medium', rationale: 'Retailer recommendation evidence links to higher offtake at participating outlets.', missing: ['Retailer participation plan'], suitability: 'Pairs with conversion as its channel lever (+0.40× historical ROI).' },
];
export const themeRoi = (t: ThemeId) => { const x = THEMES.find((y) => y.id === t)!; return netRoi(x.sales, x.investment); };

// ---------------------------------------------------------------- proposals (equal to the Zonal Manager figures)
export const proposals = () => {
  const c1 = businessCaseC1();
  const c2 = businessCaseC2();
  return [
    { id: 'c1', code: 'C1', name: 'Retailer-led Croptek conversion', investment: c1.investment, sales: c1.forecastSales, contribution: c1.contribution, roi: c1.netRoi, scenarios: scenariosFor() },
    { id: 'c2', code: 'C2', name: 'Trial-to-purchase farmer nurture', investment: c2.investment, sales: c2.forecastSales, contribution: c2.contribution, roi: c2.netRoi, scenarios: null },
  ];
};
export const APPROVAL_ITEMS: { id: string; item: string; mandatory: boolean; base: 'verified' | 'pending' }[] = [
  { id: 'abp', item: 'Business plan linkage (₹25 L inside the Ambad ABP)', mandatory: true, base: 'verified' },
  { id: 'claims', item: 'Technical claims and collateral validated', mandatory: true, base: 'pending' },
  { id: 'envelope', item: 'Regional envelope (₹12.0 L) approved', mandatory: true, base: 'verified' },
  { id: 'overlap', item: 'C1 / C2 audience overlap resolved', mandatory: true, base: 'pending' },
  { id: 'baseline', item: 'Incrementality baseline agreed', mandatory: false, base: 'pending' },
];

// ---------------------------------------------------------------- rollout
export const ROLLOUT_ENVELOPE = () => REGIONAL_ENVELOPE();
export type RolloutStatus = 'running' | 'eligible' | 'pending' | 'not_eligible';
export const ROLLOUT_LABEL: Record<RolloutStatus, string> = { running: 'Running', eligible: 'Eligible', pending: 'Plan pending', not_eligible: 'Not eligible' };
export const rolloutTerritories = () => {
  const q = approvalQueue();
  const base: Record<string, RolloutStatus> = { ambad: 'running', ghansawangi: 'eligible', badnapur: 'pending', jafrabad: 'pending', bhokardan: 'eligible' };
  return [
    ...ZM_TERRITORY_IDS.map((t) => ({ id: t, name: zmTerritoryName(t), fsm: `Field Sales Manager · ${zmTerritoryName(t)}`, budget: q.find((x) => x.territory === t)!.budget, status: base[t] })),
    { id: 'other', name: 'Other Maharashtra territories', fsm: 'Field Sales Managers (4)', budget: 2.3, status: 'pending' as RolloutStatus },
  ];
};
export const STAGE_COUNTS = [{ stage: 'Published', n: 12 }, { stage: 'Submitted', n: 8 }, { stage: 'Approved', n: 6 }, { stage: 'Running', n: 4 }];

// ---------------------------------------------------------------- performance (equal to the Business Head)
export const westCampaigns = () => CAMPAIGNS.map((c) => ({ ...c, variance: c.observedExec - c.plannedExec, roi: netRoi(c.sales, c.actual) }));
export const programmeVariance = () => { const c = campaignById('croptek'); return c.observedExec - c.plannedExec; };
export const INTERVENTION_PERFORMANCE: { id: string; name: string; planned: number; observed: number }[] = [
  { id: 'retailer', name: 'Retailer-led activation', planned: 80, observed: 72 },
  { id: 'followup', name: 'Farmer follow-up', planned: 70, observed: 48 },
];
export const territoryImpact = () => impactRows();
export const ambadSummary = () => ambadMetrics();

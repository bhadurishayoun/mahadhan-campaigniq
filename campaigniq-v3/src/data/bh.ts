/**
 * Business Head data module — the single source of every figure shown in the workspace.
 * Money is in lakh (₹ L). Business values (ABP, sales) are also in lakh and shown as ₹ Cr.
 * Derived values (totals, percentages, shares) are computed here; `bh.test.ts` reconciles them.
 */
import { ratio, sum } from './format';

export const FY = 'FY 2026–27';
export const NEXT_FY = 'FY 2027–28';
export const PERIOD = 'YTD through Feb 2027';

// ---------------------------------------------------------------- regions
export type RegionId = 'west' | 'south' | 'north' | 'east';
export type ThemeId = 'conversion' | 'retailer' | 'trial' | 'awareness';

export interface Region {
  id: RegionId;
  name: string;
  abp: number; // lakh
  achieved: number; // lakh
  campaigns: number;
  plannedExec: number; // %
  observedExec: number; // %
  approved: number; // lakh marketing budget
  actual: number; // lakh marketing investment
  adopters: number;
  /** campaign count by theme */
  themeMix: Record<ThemeId, number>;
  /** validated incremental sales, lakh */
  sales: number;
  adoptionSourceValidated: boolean;
}

export const REGIONS: Region[] = [
  { id: 'west', name: 'West', abp: 1600, achieved: 1420, campaigns: 4, plannedExec: 82, observedExec: 76, approved: 90, actual: 72, adopters: 760, sales: 288, themeMix: { conversion: 2, retailer: 1, trial: 1, awareness: 0 }, adoptionSourceValidated: true },
  { id: 'south', name: 'South', abp: 1400, achieved: 1180, campaigns: 3, plannedExec: 78, observedExec: 71, approved: 70, actual: 54, adopters: 490, sales: 192, themeMix: { conversion: 1, retailer: 1, trial: 0, awareness: 1 }, adoptionSourceValidated: true },
  { id: 'north', name: 'North', abp: 1100, achieved: 910, campaigns: 3, plannedExec: 74, observedExec: 68, approved: 55, actual: 39, adopters: 370, sales: 138, themeMix: { conversion: 1, retailer: 0, trial: 1, awareness: 1 }, adoptionSourceValidated: false },
  { id: 'east', name: 'East', abp: 900, achieved: 770, campaigns: 2, plannedExec: 70, observedExec: 66, approved: 35, actual: 25, adopters: 240, sales: 88, themeMix: { conversion: 0, retailer: 1, trial: 1, awareness: 0 }, adoptionSourceValidated: true },
];

export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
export const regionLabel = (id: RegionId) => `${regionById(id).name} region`;

export const regionMetrics = (r: Region) => ({
  achievementPct: ratio(r.achieved, r.abp),
  gap: r.abp - r.achieved,
  unspent: r.approved - r.actual,
  utilisationPct: ratio(r.actual, r.approved),
  perAdopter: Math.round((r.actual * 100000) / r.adopters),
  execVariance: r.observedExec - r.plannedExec,
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const NATIONAL = {
  abp: sum(REGIONS, (r) => r.abp),
  achieved: sum(REGIONS, (r) => r.achieved),
  campaigns: sum(REGIONS, (r) => r.campaigns),
  approved: sum(REGIONS, (r) => r.approved),
  actual: sum(REGIONS, (r) => r.actual),
  adopters: sum(REGIONS, (r) => r.adopters),
  plannedExec: Math.round(mean(REGIONS.map((r) => r.plannedExec))),
  observedExec: Math.round(mean(REGIONS.map((r) => r.observedExec))),
};
export const NATIONAL_METRICS = {
  achievementPct: ratio(NATIONAL.achieved, NATIONAL.abp),
  gap: NATIONAL.abp - NATIONAL.achieved,
  unspent: NATIONAL.approved - NATIONAL.actual,
  utilisationPct: ratio(NATIONAL.actual, NATIONAL.approved),
  perAdopter: Math.round((NATIONAL.actual * 100000) / NATIONAL.adopters),
};

/** Contribution margin used for every ROI: net ROI = (incremental sales × 35% − investment) / investment. */
export const CONTRIBUTION_MARGIN = 0.35;
export const netRoi = (sales: number, investment: number) => (sales * CONTRIBUTION_MARGIN - investment) / investment;

/** National validated incremental sales and net ROI (sum of regions). */
export const nationalReturns = () => { const s = sum(REGIONS, (r) => r.sales); return { sales: s, roi: netRoi(s, sum(REGIONS, (r) => r.actual)) }; };
export const regionRoi = (r: Region) => netRoi(r.sales, r.actual);

// ---------------------------------------------------------------- themes
export interface Theme {
  id: ThemeId;
  name: string;
  short: string;
  investment: number; // lakh
  adopters: number;
  /** validated incremental sales, lakh */
  sales: number;
  direction: 'Refine' | 'Validate' | 'Redesign' | 'Assess';
}

export const THEMES: Theme[] = [
  { id: 'conversion', name: 'Conversion & adoption', short: 'Conversion', investment: 64, adopters: 720, sales: 256, direction: 'Refine' },
  { id: 'retailer', name: 'Retailer enablement', short: 'Retailer', investment: 48, adopters: 460, sales: 192, direction: 'Validate' },
  { id: 'trial', name: 'Trial & follow-up', short: 'Trial', investment: 50, adopters: 420, sales: 170, direction: 'Redesign' },
  { id: 'awareness', name: 'Crop nutrition awareness', short: 'Awareness', investment: 28, adopters: 260, sales: 88, direction: 'Assess' },
];

export const themeCampaigns = (t: ThemeId) => sum(REGIONS, (r) => r.themeMix[t]);
export const themeShares = (t: Theme) => ({
  investmentShare: ratio(t.investment, sum(THEMES, (x) => x.investment)),
  adoptionShare: ratio(t.adopters, sum(THEMES, (x) => x.adopters)),
});

/** Portfolio views by crop and by product (same national totals: 12 campaigns, ₹190 L, 1,860 adopters). */
export interface MixRow { id: string; name: string; campaigns: number; investment: number; adopters: number; sales: number }
/** Filled from ALL_CAMPAIGNS (crop / product tags) by applyPeriod, so they always reconcile to the national totals. */
export const CROP_MIX: MixRow[] = [];
export const PRODUCT_MIX: MixRow[] = [];

// ---------------------------------------------------------------- theme status labels
export const THEME_STATUS: Record<ThemeStatus, { mh: string; bh: string; tone: 'ok' | 'warn' | 'risk' | 'neutral' }> = {
  review_pending: { mh: 'Submitted', bh: 'Review pending', tone: 'warn' },
  clarification_requested: { mh: 'Clarification requested', bh: 'NA', tone: 'risk' },
  approved: { mh: 'Submitted', bh: 'Approved', tone: 'ok' },
  returned: { mh: 'Returned for changes', bh: 'Returned', tone: 'neutral' },
  rejected: { mh: 'Submitted', bh: 'Rejected', tone: 'risk' },
};

// ---------------------------------------------------------------- West campaigns
export type CampaignId = 'croptek' | 'adoption' | 'enablement' | 'trial';

export interface Campaign {
  id: CampaignId;
  region: RegionId;
  name: string;
  short: string;
  theme: ThemeId;
  plannedExec: number;
  observedExec: number;
  adoptionTarget: number;
  adopters: number;
  approved: number; // lakh
  actual: number; // lakh
  /** validated incremental sales, lakh */
  sales: number;
}

export const CAMPAIGNS: Campaign[] = [
  { id: 'croptek', region: 'west', name: 'Retailer-led Croptek conversion', short: 'Croptek conversion', theme: 'conversion', plannedExec: 80, observedExec: 72, adoptionTarget: 250, adopters: 180, approved: 12, actual: 9, sales: 40 },
  { id: 'adoption', region: 'west', name: 'Product adoption drive', short: 'Product adoption drive', theme: 'conversion', plannedExec: 84, observedExec: 80, adoptionTarget: 300, adopters: 260, approved: 28, actual: 23, sales: 92 },
  { id: 'enablement', region: 'west', name: 'Retailer enablement', short: 'Retailer enablement', theme: 'retailer', plannedExec: 82, observedExec: 76, adoptionTarget: 250, adopters: 180, approved: 28, actual: 22, sales: 84 },
  { id: 'trial', region: 'west', name: 'Trial & follow-up', short: 'Trial & follow-up', theme: 'trial', plannedExec: 82, observedExec: 76, adoptionTarget: 200, adopters: 140, approved: 22, actual: 18, sales: 72 },
];

export const campaignById = (id: CampaignId) => CAMPAIGNS.find((c) => c.id === id)!;
export const campaignsOf = (region: RegionId) => CAMPAIGNS.filter((c) => c.region === region);

export const campaignMetrics = (c: Campaign) => ({
  execVariance: c.observedExec - c.plannedExec,
  adoptionPct: ratio(c.adopters, c.adoptionTarget),
  shortfall: c.adoptionTarget - c.adopters,
  unspent: c.approved - c.actual,
  utilisationPct: ratio(c.actual, c.approved),
  perAdopter: Math.round((c.actual * 100000) / c.adopters),
});

export const campaignTotals = (region: RegionId) => {
  const cs = campaignsOf(region);
  const target = sum(cs, (c) => c.adoptionTarget);
  const adopters = sum(cs, (c) => c.adopters);
  const approved = sum(cs, (c) => c.approved);
  const actual = sum(cs, (c) => c.actual);
  return {
    plannedExec: Math.round(mean(cs.map((c) => c.plannedExec))),
    observedExec: Math.round(mean(cs.map((c) => c.observedExec))),
    target, adopters, approved, actual,
    unspent: approved - actual,
    adoptionPct: ratio(adopters, target),
    utilisationPct: ratio(actual, approved),
    perAdopter: Math.round((actual * 100000) / adopters),
  };
};

// ---------------------------------------------------------------- business case (Croptek)
/** Croptek has its own approved business case; other campaigns forecast = validated × approved / actual (to ₹1 L). */
export const BUSINESS_CASE: Partial<Record<CampaignId, { forecastSales: number }>> = {
  croptek: { forecastSales: 48 },
};

export const businessCase = (id: CampaignId) => {
  const c = campaignById(id);
  const forecastSales = BUSINESS_CASE[id]?.forecastSales ?? Math.round((c.sales * c.approved) / c.actual);
  const variableCostPct = Math.round((1 - CONTRIBUTION_MARGIN) * 100);
  const bc = { forecastSales, variableCostPct };
  const variableCosts = (bc.forecastSales * bc.variableCostPct) / 100;
  const contribution = bc.forecastSales - variableCosts;
  const netReturn = contribution - c.approved;
  return {
    validatedSales: c.sales,
    actualRoi: netRoi(c.sales, c.actual),
    forecastSales: bc.forecastSales,
    variableCostPct: bc.variableCostPct,
    contributionPct: 100 - bc.variableCostPct,
    variableCosts,
    contribution,
    investment: c.approved,
    netReturn,
    netRoi: netReturn / c.approved,
  };
};

// ---------------------------------------------------------------- West territories (Regional performance)
export interface Territory {
  id: string;
  name: string;
  region: RegionId;
  abp: number; // lakh
  ytdSales: number; // lakh
  campaigns: number;
  activitiesDone: number | null;
  activitiesPlanned: number | null;
  adopters: number | null;
}

export const TERRITORIES: Territory[] = [
  { id: 'ambad', name: 'Ambad (Jalna)', region: 'west', abp: 420, ytdSales: 362, campaigns: 2, activitiesDone: 9, activitiesPlanned: 13, adopters: 72 },
  { id: 'ghansawangi', name: 'Ghansawangi', region: 'west', abp: 340, ytdSales: 295, campaigns: 1, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'badnapur', name: 'Badnapur', region: 'west', abp: 240, ytdSales: 210, campaigns: 0, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'jafrabad', name: 'Jafrabad', region: 'west', abp: 180, ytdSales: 166, campaigns: 0, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'bhokardan', name: 'Bhokardan', region: 'west', abp: 160, ytdSales: 148, campaigns: 0, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'aurangabad', name: 'Aurangabad', region: 'west', abp: 260, ytdSales: 239, campaigns: 1, activitiesDone: null, activitiesPlanned: null, adopters: null },
];
export const territoriesOf = (region: RegionId) => TERRITORIES.filter((t) => t.region === region);
export const territoryById = (id: string) => TERRITORIES.find((t) => t.id === id);

// ---------------------------------------------------------------- Ambad detail
export const AMBAD = {
  territoryId: 'ambad',
  district: 'Jalna',
  state: 'Maharashtra',
  crop: 'Onion',
  product: 'Croptek',
  onionAbp: 190, // lakh, all-product onion ABP
  campaignLinkedSales: 5.4, // lakh, provisional
  villages: [
    { name: 'Wadi Gaon', adopters: 24, trials: 49 },
    { name: 'Pimpalgaon', adopters: 9, trials: 19 },
    { name: 'Ambad HQ', adopters: 6, trials: 13 },
    { name: 'Kumbhephal', adopters: 5, trials: 11 },
    { name: 'Kingaon', adopters: 5, trials: 11 },
    { name: 'Shahagad', adopters: 4, trials: 9 },
    { name: 'Jamkhed', adopters: 3, trials: 7 },
    { name: 'Rohilagad', adopters: 4, trials: 10 },
    { name: 'Dhanora', adopters: 12, trials: 31 },
  ],
  interventions: [
    { name: 'Field demonstrations', done: 3, planned: 4 },
    { name: 'Retailer activation', done: 2, planned: 3 },
    { name: 'Farmer meetings', done: 2, planned: 3 },
    { name: 'Digital advisory', done: 1, planned: 1 },
    { name: 'Farmer follow-ups', done: 1, planned: 2 },
  ],
  cropRows: [
    { crop: 'Onion', product: 'Croptek', allProductAbp: 190 as number | null, mapped: false, trials: 160 as number | null, adopters: 72 as number | null },
    { crop: 'Maize', product: 'All products', allProductAbp: null, mapped: false, trials: null, adopters: null },
    { crop: 'Other crops', product: 'All products', allProductAbp: null, mapped: false, trials: null, adopters: null },
  ],
};

export const ambadMetrics = () => {
  const done = sum(AMBAD.interventions, (i) => i.done);
  const planned = sum(AMBAD.interventions, (i) => i.planned);
  const trials = sum(AMBAD.villages, (v) => v.trials);
  const adopters = sum(AMBAD.villages, (v) => v.adopters);
  const villagePct = AMBAD.villages.map((v) => ({ ...v, pct: ratio(v.adopters, v.trials) }));
  const pcts = villagePct.map((v) => Number(v.pct.toFixed(1)));
  return {
    activitiesDone: done,
    activitiesPlanned: planned,
    activityPct: ratio(done, planned),
    trials,
    adopters,
    trialToAdoptionPct: ratio(adopters, trials),
    villages: villagePct,
    /** villages sorted by trial-to-adoption, highest first */
    villagesSorted: [...villagePct].sort((x, y) => y.pct - x.pct),
    highest: [...villagePct].sort((x, y) => y.pct - x.pct)[0],
    lowest: [...villagePct].sort((x, y) => x.pct - y.pct)[0],
    villageGap: Math.max(...pcts) - Math.min(...pcts),
    followUpPct: ratio(AMBAD.interventions[4].done, AMBAD.interventions[4].planned),
    retailerActivationPct: ratio(AMBAD.interventions[1].done, AMBAD.interventions[1].planned),
  };
};

// ---------------------------------------------------------------- market
export const MARKET = {
  state: 'Maharashtra',
  penetration: '14–18%',
};

// ---------------------------------------------------------------- strategic themes (queue)
export type ThemeStatus = 'review_pending' | 'clarification_requested' | 'approved' | 'returned' | 'rejected';
export type Priority = 'High' | 'Medium' | 'Low' | 'Review';

export interface ThemeProposal {
  id: string;
  name: string;
  geography: string;
  state: string;
  region: RegionId | 'multi';
  cropProduct: string;
  crop: string | null;
  product: string | null;
  proposedBy: string;
  priority: Priority;
  status: ThemeStatus;
  objective: string;
  cohort: string;
  focus: string;
}

export const THEME_QUEUE: ThemeProposal[] = [
  { id: 'croptek-next', name: 'Croptek conversion', geography: 'West / Maharashtra', state: 'Maharashtra', region: 'west', cropProduct: 'Onion / Croptek', crop: 'Onion', product: 'Croptek', proposedBy: 'Marketing Head', priority: 'High', status: 'approved', objective: 'Farmer conversion', cohort: 'Eligible non-adopters and trial users', focus: 'Conversion & adoption' },
  { id: 'retailer-advocacy', name: 'Multi-region retailer advocacy', geography: 'Multi-region', state: 'Multi-region', region: 'multi', cropProduct: 'Pending validation', crop: null, product: null, proposedBy: 'Marketing Head', priority: 'High', status: 'review_pending', objective: 'Retailer advocacy', cohort: 'Priority retailers', focus: 'Retailer enablement' },
  { id: 'north-awareness', name: 'North region crop nutrition awareness', geography: 'North', state: 'North region', region: 'north', cropProduct: 'Pending', crop: null, product: null, proposedBy: 'Marketing Head', priority: 'Medium', status: 'clarification_requested', objective: 'Crop nutrition awareness', cohort: 'Pending', focus: 'Crop nutrition awareness' },
  { id: 'paddy-south', name: 'Paddy nutrition programme', geography: 'South', state: 'South region', region: 'south', cropProduct: 'Paddy / Croptek', crop: 'Paddy', product: 'Croptek', proposedBy: 'Marketing Head', priority: 'Medium', status: 'review_pending', objective: 'Nutrition programme adoption', cohort: 'Paddy growers in mapped retailer catchments', focus: 'Conversion & adoption' },
];

/** Theme candidates surfaced by the market opportunity view (Ambad / Onion / Croptek evidence). */
export const themeCandidates = () => {
  const a = ambadMetrics();
  return [
    { id: 'conversion-acceleration', name: 'Farmer conversion acceleration', indicator: `${a.villageGap.toFixed(1)} pp village gap` },
    { id: 'structured-follow-up', name: 'Structured farmer follow-up', indicator: `${a.followUpPct.toFixed(0)}% completion` },
    { id: 'retailer-enablement', name: 'Retailer enablement', indicator: `${a.retailerActivationPct.toFixed(1)}% completion` },
  ];
};

// ---------------------------------------------------------------- interventions (register)
export type InterventionCategory = 'Performance' | 'Strategic theme' | 'Investment' | 'Theme clarification';
export type InterventionStatus = 'draft' | 'awaiting_response' | 'closed';

export interface Intervention {
  id: string;
  name: string;
  category: InterventionCategory;
  geography: string;
  trigger: string;
  role: string;
  priority: Priority;
  status: InterventionStatus;
  statusLabel: string;
  campaign?: CampaignId;
  deliverable: string;
  due?: string;
  notes?: string;
}

export const initialInterventions = (): Intervention[] => {
  const c = campaignMetrics(campaignById('croptek'));
  return [
    { id: 'croptek-review', name: 'Croptek campaign performance review', category: 'Performance', geography: 'West', trigger: `${c.execVariance} pp execution variance`.replace('-', '–'), role: 'Marketing Head', priority: 'High', status: 'draft', statusLabel: 'Draft not sent', campaign: 'croptek', deliverable: 'Campaign recovery assessment' },
    { id: 'paddy-theme-approval', name: 'Paddy nutrition programme theme approval', category: 'Strategic theme', geography: 'South', trigger: 'New theme submitted by Marketing Head', role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Decision pending', deliverable: 'Theme decision' },
    { id: 'reallocation', name: 'Marketing investment reallocation', category: 'Investment', geography: 'West', trigger: `₹${DEFAULT_REALLOCATION.amount} L simulated transfer`, role: 'Marketing Head and Finance', priority: 'Medium', status: 'draft', statusLabel: 'Draft not sent', deliverable: 'Finance validation of reallocation' },
    { id: 'north-clarification', name: 'North region crop nutrition awareness clarification', category: 'Theme clarification', geography: 'North', trigger: 'Scope validation', role: 'Marketing Head', priority: 'Medium', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Clarified theme scope' },
    { id: 'south-paddy-review', name: 'South paddy campaign execution review', category: 'Performance', geography: 'South', trigger: '–7 pp execution variance', role: 'Marketing Head', priority: 'High', status: 'draft', statusLabel: 'Draft not sent', deliverable: 'Campaign recovery assessment' },
    { id: 'east-underspend', name: 'East budget underspend review', category: 'Investment', geography: 'East', trigger: '₹10 L unspent (29%)', role: 'Marketing Head and Finance', priority: 'Medium', status: 'draft', statusLabel: 'Draft not sent', deliverable: 'Budget utilisation plan' },
    { id: 'north-wheat-review', name: 'North wheat adoption review', category: 'Performance', geography: 'North', trigger: '120 adopters recorded', role: 'Zonal Manager', priority: 'Medium', status: 'draft', statusLabel: 'Draft not sent', deliverable: 'Adoption recovery assessment' },
    { id: 'south-retailer-recovery', name: 'Retailer partner programme recovery plan', category: 'Performance', geography: 'South', trigger: 'Retailer activation 66.7%', role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Retailer recovery plan' },
    { id: 'retailer-advocacy-approval', name: 'Multi-region retailer advocacy theme approval', category: 'Strategic theme', geography: 'Multi-region', trigger: 'Theme awaiting decision', role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Decision pending', deliverable: 'Theme decision' },
    { id: 'soil-health-roi', name: 'Soil health awareness ROI review', category: 'Investment', geography: 'North', trigger: '+0.10× theme ROI', role: 'Marketing Head and Finance', priority: 'Medium', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Investment level review' },
    { id: 'ambad-follow-up', name: 'Ambad farmer follow-up plan', category: 'Performance', geography: 'Ambad', trigger: '50% follow-up completion', role: 'Zonal Manager', priority: 'High', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Farmer follow-up plan' },
    { id: 'dhanora-conversion', name: 'Dhanora village conversion drive', category: 'Performance', geography: 'Ambad', trigger: '38.7% trial-to-adoption', role: 'Zonal Manager', priority: 'Medium', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Village conversion plan' },
    { id: 'south-gap-assessment', name: 'South business gap assessment', category: 'Strategic theme', geography: 'South', trigger: '₹2.2 Cr ABP gap', role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Assessment pending', deliverable: 'Opportunity assessment' },
    { id: 'east-trial-phasing', name: 'East trial follow-up budget phasing', category: 'Investment', geography: 'East', trigger: 'Budget phasing validation', role: 'Marketing Head and Finance', priority: 'Review', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Finance validation of phasing' },
    { id: 'west-retailer-topup', name: 'West retailer enablement budget top-up', category: 'Investment', geography: 'West', trigger: '₹2 L added', role: 'Marketing Head and Finance', priority: 'Medium', status: 'closed', statusLabel: 'Closed', deliverable: 'Budget top-up' },
    { id: 'south-nutrition-scope', name: 'South crop nutrition scope clarification', category: 'Theme clarification', geography: 'South', trigger: 'Scope confirmed', role: 'Marketing Head', priority: 'Medium', status: 'closed', statusLabel: 'Closed', deliverable: 'Clarified theme scope' },
    { id: 'q2-kharif-review', name: 'Q2 kharif execution review', category: 'Performance', geography: 'National', trigger: 'Review completed', role: 'Marketing Head', priority: 'High', status: 'closed', statusLabel: 'Closed', deliverable: 'Execution review' },
    { id: 'croptek-sku-mapping', name: 'Croptek SKU mapping confirmation', category: 'Theme clarification', geography: 'West', trigger: 'Mapping confirmed', role: 'Zonal Manager', priority: 'Review', status: 'closed', statusLabel: 'Closed', deliverable: 'SKU mapping' },
  ];
};

/** Tracker KPI counts, computed from the register rows. */
export const interventionCounts = (list: Intervention[]) => ({
  total: list.length,
  draft: list.filter((i) => i.status === 'draft').length,
  awaiting: list.filter((i) => i.status === 'awaiting_response').length,
  closed: list.filter((i) => i.status === 'closed').length,
});

// ---------------------------------------------------------------- reallocation
export const DEFAULT_REALLOCATION = { from: 'trial' as CampaignId, to: 'croptek' as CampaignId, amount: 2, region: 'west' as RegionId };

// ---------------------------------------------------------------- scope labels
export const SCOPES: { id: RegionId | 'national'; label: string }[] = [
  { id: 'national', label: 'National portfolio' },
  ...REGIONS.map((r) => ({ id: r.id, label: `${r.name} region` })),
];

// ---------------------------------------------------------------- theme review content
export const READINESS_ITEMS = ['ABP alignment', 'Market evidence', 'Prior campaign outcomes', 'Commercial attribution', 'Scope (crop / product / geography)'] as const;
export const READINESS_STATUS: Record<(typeof READINESS_ITEMS)[number], { label: string; tone: 'warn' | 'neutral' | 'ok' }> = {
  'ABP alignment': { label: 'Review required', tone: 'warn' },
  'Market evidence': { label: 'Validate', tone: 'warn' },
  'Prior campaign outcomes': { label: 'Review', tone: 'warn' },
  'Commercial attribution': { label: 'Complete', tone: 'ok' },
  'Scope (crop / product / geography)': { label: 'Review required', tone: 'warn' },
};

/** Evidence tiles for a proposed theme, computed from the records behind it. */
export const themeEvidence = (themeId: string): { value: string; label: string }[] => {
  const a = ambadMetrics();
  if (themeId === 'croptek-next') {
    return [
      { value: MARKET.penetration, label: `${MARKET.state} penetration` },
      { value: `${a.trialToAdoptionPct.toFixed(0)}%`, label: 'Trial-to-adoption (Ambad)' },
      { value: `${a.villageGap.toFixed(1)} pp`, label: 'Village gap (Dhanora vs Wadi Gaon)' },
      { value: `${a.activityPct.toFixed(1)}%`, label: 'Activity completion' },
      { value: `${a.followUpPct.toFixed(1)}%`, label: 'Follow-up completion' },
      { value: `${a.retailerActivationPct.toFixed(1)}%`, label: 'Retailer activation' },
    ];
  }
  if (themeId === 'retailer-advocacy') {
    const t = THEMES.find((x) => x.id === 'retailer')!;
    return [
      { value: String(themeCampaigns('retailer')), label: 'Retailer enablement campaigns' },
      { value: `₹${t.investment} L`, label: 'Retailer enablement investment' },
      { value: t.adopters.toLocaleString('en-IN'), label: 'Recorded adopters' },
      { value: `${a.retailerActivationPct.toFixed(1)}%`, label: 'Retailer activation (Ambad)' },
      { value: String(REGIONS.filter((r) => r.themeMix.retailer > 0).length), label: 'Regions running the theme' },
      { value: `+${netRoi(t.sales, t.investment).toFixed(2)}×`, label: 'Retailer enablement net ROI' },
    ];
  }
  const n = regionById('north');
  return [
    { value: `₹${((n.abp - n.achieved) / 100).toFixed(1)} Cr`, label: 'North business gap' },
    { value: `${n.observedExec}%`, label: 'Observed execution' },
    { value: n.adopters.toLocaleString('en-IN'), label: 'Recorded adopters' },
    { value: String(n.themeMix.awareness), label: 'Awareness campaigns running' },
    { value: `₹${(n.sales / 100).toFixed(2)} Cr`, label: 'Validated incremental sales' },
    { value: `+${netRoi(n.sales, n.actual).toFixed(2)}×`, label: 'North net ROI' },
  ];
};

/** Business Head recommended direction per proposal parameter (decision modal). */
export const themeDirections = (t: ThemeProposal) => [
  { parameter: 'Geography', proposal: t.state, direction: 'Retain' },
  { parameter: 'Crop', proposal: t.crop ?? 'Pending', direction: t.crop ? 'Retain' : 'Define crop scope' },
  { parameter: 'Product', proposal: t.product ?? 'Pending', direction: t.product ? 'Retain' : 'Define product scope' },
  { parameter: 'Strategic objective', proposal: t.objective, direction: 'Retain' },
  { parameter: 'Target cohort', proposal: t.cohort, direction: 'Validate eligibility' },
  { parameter: 'Strategic focus', proposal: t.focus, direction: t.id === 'croptek-next' ? 'Evaluate structured farmer follow-up' : 'Retain' },
];

// ---------------------------------------------------------------- next-year priorities (learning)
export const nextYearPriorities = () => {
  const biggestGap = [...REGIONS].sort((x, y) => (y.abp - y.achieved) - (x.abp - x.achieved))[0];
  const c = campaignMetrics(campaignById('croptek'));
  const a = ambadMetrics();
  return [
    { id: 'gap', geography: `${biggestGap.name} region`, indicator: `₹${((biggestGap.abp - biggestGap.achieved) / 100).toFixed(1)} Cr business gap`, direction: 'Opportunity assessment', tone: 'ok' as const },
    { id: 'croptek', geography: 'West Croptek conversion', indicator: `${c.adoptionPct.toFixed(0)}% adoption target achievement`, direction: 'Refine theme', tone: 'ok' as const },
    { id: 'ambad-gap', geography: 'Ambad', indicator: `${a.villageGap.toFixed(1)} pp village conversion gap`, direction: 'Investigate', tone: 'warn' as const },
    { id: 'ambad-follow', geography: 'Ambad farmer follow-up', indicator: `${a.followUpPct.toFixed(0)}% completion`, direction: 'Review intervention design', tone: 'neutral' as const },
    { id: 'attribution', geography: 'Crop nutrition awareness', indicator: `+${netRoi(THEMES[3].sales, THEMES[3].investment).toFixed(2)}× net ROI (lowest theme)`, direction: 'Review investment level', tone: 'ok' as const },
  ];
};

export const INTERVENTION_DELIVERABLES = ['Campaign performance diagnosis', 'Territory-wise recovery opportunities', 'Revised strategic intervention plan', 'Updated outcome and investment forecast'];

// ---------------------------------------------------------------- campaign budgets, all regions (reallocation)
/** Budget view of every active campaign (West detail above + the other regions). Sums reconcile to REGIONS and THEMES. */
export type Season = 'Kharif' | 'Rabi';
export interface PlanCampaign { id: string; region: RegionId; name: string; theme: ThemeId; crop: string; product: string; season: Season; approved: number; actual: number; adopters: number; sales: number }

/** Crop, product and season per West campaign (detail records above). */
const WEST_TAGS: Record<CampaignId, { crop: string; product: string; season: Season }> = {
  croptek: { crop: 'Onion', product: 'Croptek', season: 'Rabi' },
  adoption: { crop: 'Soybean', product: 'Mahadhan 19:19:19', season: 'Kharif' },
  enablement: { crop: 'Onion', product: 'Croptek', season: 'Rabi' },
  trial: { crop: 'Cotton', product: 'Mahadhan Bensulf', season: 'Kharif' },
};

export const ALL_CAMPAIGNS: PlanCampaign[] = [
  ...CAMPAIGNS.map(({ id, region, name, theme, approved, actual, adopters, sales }) => ({ id, region, name, theme, ...WEST_TAGS[id], approved, actual, adopters, sales })),
  { id: 'paddy', region: 'south', name: 'Paddy conversion drive', theme: 'conversion', crop: 'Paddy', product: 'Mahadhan 19:19:19', season: 'Kharif', approved: 23, actual: 18, adopters: 160, sales: 68 },
  { id: 'retailer-south', region: 'south', name: 'Retailer partner programme', theme: 'retailer', crop: 'Cotton', product: 'Croptek', season: 'Kharif', approved: 21, actual: 16, adopters: 170, sales: 64 },
  { id: 'awareness-south', region: 'south', name: 'Crop nutrition awareness South', theme: 'awareness', crop: 'Maize', product: 'Mahadhan Bensulf', season: 'Kharif', approved: 26, actual: 20, adopters: 160, sales: 60 },
  { id: 'wheat', region: 'north', name: 'Wheat adoption drive', theme: 'conversion', crop: 'Wheat', product: 'Mahadhan 19:19:19', season: 'Rabi', approved: 20, actual: 14, adopters: 120, sales: 56 },
  { id: 'trial-north', region: 'north', name: 'Trial & follow-up North', theme: 'trial', crop: 'Wheat', product: 'Croptek', season: 'Rabi', approved: 24, actual: 17, adopters: 150, sales: 54 },
  { id: 'soil-health', region: 'north', name: 'Soil health awareness', theme: 'awareness', crop: 'Maize', product: 'Mahadhan Bensulf', season: 'Kharif', approved: 11, actual: 8, adopters: 100, sales: 28 },
  { id: 'enablement-east', region: 'east', name: 'Retailer enablement East', theme: 'retailer', crop: 'Paddy', product: 'Croptek', season: 'Kharif', approved: 14, actual: 10, adopters: 110, sales: 44 },
  { id: 'trial-east', region: 'east', name: 'Trial & follow-up East', theme: 'trial', crop: 'Soybean', product: 'Mahadhan 19:19:19', season: 'Kharif', approved: 21, actual: 15, adopters: 130, sales: 44 },
];

export const planCampaign = (id: string) => ALL_CAMPAIGNS.find((c) => c.id === id)!;
export const planCampaignsOf = (region: RegionId) => ALL_CAMPAIGNS.filter((c) => c.region === region);

/** Portfolio mix by a campaign tag (crop / product / theme / region), optionally filtered by season. */
export const mixBy = (key: 'crop' | 'product', season: Season | 'all' = 'all'): MixRow[] => {
  const cs = ALL_CAMPAIGNS.filter((c) => season === 'all' || c.season === season);
  const names = [...new Set(cs.map((c) => c[key]))];
  return names.map((n) => {
    const g = cs.filter((c) => c[key] === n);
    return { id: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n, campaigns: g.length, investment: sum(g, (c) => c.actual), adopters: sum(g, (c) => c.adopters), sales: sum(g, (c) => c.sales) };
  }).sort((a, b) => b.investment - a.investment);
};

// ================================================================ reporting periods
/**
 * Every flow figure above is the YTD (Apr 2026 – Feb 2027) total. Each is split into months with MONTH_SHARES
 * (rounded per month, remainder in Feb so the months add up exactly to YTD); a period is the sum of its months.
 * applyPeriod() rewrites the exported records in place, so every screen and helper reads the selected period.
 * Counts (campaigns, territories, activities) and rates (planned / observed execution) do not change by period.
 */
export type PeriodId = 'ytd' | 'q1' | 'q2' | 'q3' | 'q4' | 'feb';
export const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'] as const;
export const MONTH_SHARES = [6, 7, 10, 12, 11, 9, 10, 11, 9, 8, 7];
export const PERIODS: { id: PeriodId; label: string; months: number[] }[] = [
  { id: 'ytd', label: 'YTD through Feb 2027', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 'q1', label: 'Q1 · Apr–Jun 2026', months: [0, 1, 2] },
  { id: 'q2', label: 'Q2 · Jul–Sep 2026', months: [3, 4, 5] },
  { id: 'q3', label: 'Q3 · Oct–Dec 2026', months: [6, 7, 8] },
  { id: 'q4', label: 'Q4 to date · Jan–Feb 2027', months: [9, 10] },
  { id: 'feb', label: 'Feb 2027', months: [10] },
];

const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp;
const dpOf = (v: number) => (Number.isInteger(v) ? 0 : 1);

/** Monthly split of a YTD total: shares rounded per month, the rounding remainder goes into Feb. */
export const monthlySplit = (total: number, dp = dpOf(total)): number[] => {
  const m = MONTH_SHARES.slice(0, -1).map((s) => round((total * s) / 100, dp));
  return [...m, round(total - m.reduce((a, b) => a + b, 0), dp)];
};
const forPeriod = (total: number, months: number[]) => {
  const dp = dpOf(total);
  const m = monthlySplit(total, dp);
  return round(months.reduce((s, i) => s + m[i], 0), dp);
};

const BASE = JSON.parse(JSON.stringify({
  regions: REGIONS, themes: THEMES, campaigns: CAMPAIGNS, all: ALL_CAMPAIGNS, territories: TERRITORIES,
  villages: AMBAD.villages, cropRows: AMBAD.cropRows, onionAbp: AMBAD.onionAbp, linked: AMBAD.campaignLinkedSales, bc: BUSINESS_CASE,
}));

const scaleFields = <T extends object>(target: T, base: T, fields: (keyof T)[], months: number[]) => {
  fields.forEach((f) => {
    const v = base[f] as unknown;
    (target as Record<keyof T, unknown>)[f] = typeof v === 'number' ? forPeriod(v, months) : v;
  });
};

let currentPeriod: PeriodId | null = null;
export const periodLabel = (id: PeriodId) => PERIODS.find((p) => p.id === id)!.label;
export const getPeriod = () => currentPeriod ?? 'ytd';

export function applyPeriod(id: PeriodId) {
  if (currentPeriod === id) return;
  currentPeriod = id;
  const months = PERIODS.find((p) => p.id === id)!.months;
  REGIONS.forEach((r, i) => scaleFields(r, BASE.regions[i], ['abp', 'achieved', 'approved', 'actual', 'adopters', 'sales'], months));
  THEMES.forEach((t, i) => scaleFields(t, BASE.themes[i], ['investment', 'adopters', 'sales'], months));
  CAMPAIGNS.forEach((c, i) => scaleFields(c, BASE.campaigns[i], ['adoptionTarget', 'adopters', 'approved', 'actual', 'sales'], months));
  ALL_CAMPAIGNS.forEach((c, i) => scaleFields(c, BASE.all[i], ['approved', 'actual', 'adopters', 'sales'], months));
  TERRITORIES.forEach((t, i) => scaleFields(t, BASE.territories[i], ['abp', 'ytdSales', 'adopters'], months));
  AMBAD.villages.forEach((v, i) => scaleFields(v, BASE.villages[i], ['adopters', 'trials'], months));
  AMBAD.cropRows.forEach((r, i) => scaleFields(r, BASE.cropRows[i], ['allProductAbp', 'trials', 'adopters'], months));
  AMBAD.onionAbp = forPeriod(BASE.onionAbp, months);
  AMBAD.campaignLinkedSales = forPeriod(BASE.linked, months);
  BUSINESS_CASE.croptek = { forecastSales: forPeriod(BASE.bc.croptek.forecastSales, months) };
  Object.assign(NATIONAL, {
    abp: sum(REGIONS, (r) => r.abp), achieved: sum(REGIONS, (r) => r.achieved), campaigns: sum(REGIONS, (r) => r.campaigns),
    approved: sum(REGIONS, (r) => r.approved), actual: sum(REGIONS, (r) => r.actual), adopters: sum(REGIONS, (r) => r.adopters),
  });
  Object.assign(NATIONAL_METRICS, {
    achievementPct: ratio(NATIONAL.achieved, NATIONAL.abp), gap: NATIONAL.abp - NATIONAL.achieved,
    unspent: NATIONAL.approved - NATIONAL.actual, utilisationPct: ratio(NATIONAL.actual, NATIONAL.approved),
    perAdopter: Math.round((NATIONAL.actual * 100000) / NATIONAL.adopters),
  });
  CROP_MIX.splice(0, CROP_MIX.length, ...mixBy('crop'));
  PRODUCT_MIX.splice(0, PRODUCT_MIX.length, ...mixBy('product'));
}

applyPeriod('ytd');

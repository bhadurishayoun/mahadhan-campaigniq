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
  adoptionSourceValidated: boolean;
}

export const REGIONS: Region[] = [
  { id: 'west', name: 'West', abp: 1600, achieved: 1420, campaigns: 4, plannedExec: 82, observedExec: 76, approved: 90, actual: 72, adopters: 760, themeMix: { conversion: 2, retailer: 1, trial: 1, awareness: 0 }, adoptionSourceValidated: true },
  { id: 'south', name: 'South', abp: 1400, achieved: 1180, campaigns: 3, plannedExec: 78, observedExec: 71, approved: 70, actual: 54, adopters: 490, themeMix: { conversion: 1, retailer: 1, trial: 0, awareness: 1 }, adoptionSourceValidated: true },
  { id: 'north', name: 'North', abp: 1100, achieved: 910, campaigns: 3, plannedExec: 74, observedExec: 68, approved: 55, actual: 39, adopters: 370, themeMix: { conversion: 1, retailer: 0, trial: 1, awareness: 1 }, adoptionSourceValidated: false },
  { id: 'east', name: 'East', abp: 900, achieved: 770, campaigns: 2, plannedExec: 70, observedExec: 66, approved: 35, actual: 25, adopters: 240, themeMix: { conversion: 0, retailer: 1, trial: 1, awareness: 0 }, adoptionSourceValidated: true },
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

/** Attribution has not closed for any campaign yet: incremental sales and net ROI read "Pending attribution". */
export const ATTRIBUTION_STATUS = 'Pending attribution';

// ---------------------------------------------------------------- themes
export interface Theme {
  id: ThemeId;
  name: string;
  short: string;
  investment: number; // lakh
  adopters: number;
  direction: 'Refine' | 'Validate' | 'Redesign' | 'Assess';
}

export const THEMES: Theme[] = [
  { id: 'conversion', name: 'Conversion & adoption', short: 'Conversion', investment: 64, adopters: 720, direction: 'Refine' },
  { id: 'retailer', name: 'Retailer enablement', short: 'Retailer', investment: 48, adopters: 460, direction: 'Validate' },
  { id: 'trial', name: 'Trial & follow-up', short: 'Trial', investment: 50, adopters: 420, direction: 'Redesign' },
  { id: 'awareness', name: 'Crop nutrition awareness', short: 'Awareness', investment: 28, adopters: 260, direction: 'Assess' },
];

export const themeCampaigns = (t: ThemeId) => sum(REGIONS, (r) => r.themeMix[t]);
export const themeShares = (t: Theme) => ({
  investmentShare: ratio(t.investment, sum(THEMES, (x) => x.investment)),
  adoptionShare: ratio(t.adopters, sum(THEMES, (x) => x.adopters)),
});

/** Portfolio views by crop and by product (same national totals: 12 campaigns, ₹190 L, 1,860 adopters). */
export interface MixRow { id: string; name: string; campaigns: number; investment: number; adopters: number }
export const CROP_MIX: MixRow[] = [
  { id: 'onion', name: 'Onion', campaigns: 4, investment: 62, adopters: 640 },
  { id: 'cotton', name: 'Cotton', campaigns: 3, investment: 52, adopters: 470 },
  { id: 'soybean', name: 'Soybean', campaigns: 3, investment: 46, adopters: 450 },
  { id: 'maize', name: 'Maize', campaigns: 2, investment: 30, adopters: 300 },
];
export const PRODUCT_MIX: MixRow[] = [
  { id: 'croptek', name: 'Croptek', campaigns: 5, investment: 80, adopters: 820 },
  { id: 'npk', name: 'Mahadhan 19:19:19', campaigns: 4, investment: 66, adopters: 600 },
  { id: 'bensulf', name: 'Mahadhan Bensulf', campaigns: 3, investment: 44, adopters: 440 },
];

// ---------------------------------------------------------------- theme status labels
export const THEME_STATUS: Record<ThemeStatus, { mh: string; bh: string; tone: 'ok' | 'warn' | 'risk' | 'neutral' }> = {
  review_pending: { mh: 'Submitted', bh: 'Review pending', tone: 'warn' },
  clarification_requested: { mh: 'Clarification requested', bh: '—', tone: 'risk' },
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
}

export const CAMPAIGNS: Campaign[] = [
  { id: 'croptek', region: 'west', name: 'Retailer-led Croptek conversion', short: 'Croptek conversion', theme: 'conversion', plannedExec: 80, observedExec: 72, adoptionTarget: 250, adopters: 180, approved: 12, actual: 9 },
  { id: 'adoption', region: 'west', name: 'Product adoption drive', short: 'Product adoption drive', theme: 'conversion', plannedExec: 84, observedExec: 80, adoptionTarget: 300, adopters: 260, approved: 28, actual: 23 },
  { id: 'enablement', region: 'west', name: 'Retailer enablement', short: 'Retailer enablement', theme: 'retailer', plannedExec: 82, observedExec: 76, adoptionTarget: 250, adopters: 180, approved: 28, actual: 22 },
  { id: 'trial', region: 'west', name: 'Trial & follow-up', short: 'Trial & follow-up', theme: 'trial', plannedExec: 82, observedExec: 76, adoptionTarget: 200, adopters: 140, approved: 22, actual: 18 },
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
export const BUSINESS_CASE: Partial<Record<CampaignId, { forecastSales: number; variableCostPct: number }>> = {
  croptek: { forecastSales: 48, variableCostPct: 65 },
};

export const businessCase = (id: CampaignId) => {
  const bc = BUSINESS_CASE[id];
  if (!bc) return null;
  const c = campaignById(id);
  const variableCosts = (bc.forecastSales * bc.variableCostPct) / 100;
  const contribution = bc.forecastSales - variableCosts;
  const netReturn = contribution - c.approved;
  return {
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
  { id: 'jalna', name: 'Jalna', region: 'west', abp: 380, ytdSales: 315, campaigns: 1, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'aurangabad', name: 'Aurangabad', region: 'west', abp: 460, ytdSales: 402, campaigns: 1, activitiesDone: null, activitiesPlanned: null, adopters: null },
  { id: 'nashik', name: 'Nashik', region: 'west', abp: 340, ytdSales: 341, campaigns: 0, activitiesDone: null, activitiesPlanned: null, adopters: null },
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
    { name: 'Dhanora', adopters: 24, trials: 62 },
    { name: 'Wadi Gaon', adopters: 48, trials: 98 },
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
export type Priority = 'High' | 'Medium' | 'Low';

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
  { id: 'croptek-next', name: 'Croptek conversion — next season', geography: 'West / Maharashtra', state: 'Maharashtra', region: 'west', cropProduct: 'Onion / Croptek', crop: 'Onion', product: 'Croptek', proposedBy: 'Marketing Head', priority: 'High', status: 'review_pending', objective: 'Farmer conversion', cohort: 'Eligible non-adopters and trial users', focus: 'Conversion & adoption' },
  { id: 'retailer-advocacy', name: 'Multi-region retailer advocacy', geography: 'Multi-region', state: 'Multi-region', region: 'multi', cropProduct: 'Pending validation', crop: null, product: null, proposedBy: 'Marketing Head', priority: 'High', status: 'review_pending', objective: 'Retailer advocacy', cohort: 'Priority retailers', focus: 'Retailer enablement' },
  { id: 'north-awareness', name: 'North region crop nutrition awareness', geography: 'North', state: 'North region', region: 'north', cropProduct: 'Pending', crop: null, product: null, proposedBy: 'Marketing Head', priority: 'Medium', status: 'clarification_requested', objective: 'Crop nutrition awareness', cohort: 'Pending', focus: 'Crop nutrition awareness' },
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
  const a = ambadMetrics();
  return [
    { id: 'croptek-review', name: 'Croptek campaign performance review', category: 'Performance', geography: 'West', trigger: `${c.execVariance} pp execution variance`.replace('-', '–'), role: 'Marketing Head', priority: 'High', status: 'draft', statusLabel: 'Draft not sent', campaign: 'croptek', deliverable: 'Campaign recovery assessment' },
    { id: 'structured-follow-up', name: 'Structured farmer conversion & follow-up', category: 'Strategic theme', geography: 'Ambad', trigger: `${a.villageGap.toFixed(1)} pp village conversion gap`, role: 'Marketing Head', priority: 'High', status: 'awaiting_response', statusLabel: 'Assessment pending', deliverable: 'Strategic opportunity assessment' },
    { id: 'reallocation', name: 'Marketing investment reallocation', category: 'Investment', geography: 'West', trigger: `₹${DEFAULT_REALLOCATION.amount} L simulated transfer`, role: 'Marketing Head and Finance', priority: 'Medium', status: 'draft', statusLabel: 'Draft not sent', deliverable: 'Finance validation of reallocation' },
    { id: 'north-clarification', name: 'North region crop nutrition awareness clarification', category: 'Theme clarification', geography: 'North', trigger: 'Scope validation', role: 'Marketing Head', priority: 'Medium', status: 'awaiting_response', statusLabel: 'Response pending', deliverable: 'Clarified theme scope' },
  ];
};

// ---------------------------------------------------------------- reallocation
export const DEFAULT_REALLOCATION = { from: 'trial' as CampaignId, to: 'croptek' as CampaignId, amount: 2, region: 'west' as RegionId };

// ---------------------------------------------------------------- scope labels
export const SCOPES: { id: RegionId | 'national'; label: string }[] = [
  { id: 'national', label: 'National portfolio' },
  ...REGIONS.map((r) => ({ id: r.id, label: `${r.name} region` })),
];

// ---------------------------------------------------------------- theme review content
export const READINESS_ITEMS = ['ABP alignment', 'Market evidence', 'Prior campaign outcomes', 'Commercial attribution', 'Scope (crop / product / geography)'] as const;
export const READINESS_STATUS: Record<(typeof READINESS_ITEMS)[number], { label: string; tone: 'warn' | 'neutral' }> = {
  'ABP alignment': { label: 'Review required', tone: 'warn' },
  'Market evidence': { label: 'Validate', tone: 'warn' },
  'Prior campaign outcomes': { label: 'Review', tone: 'warn' },
  'Commercial attribution': { label: 'Pending', tone: 'neutral' },
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
      { value: 'Pending', label: 'Retailer-level attribution' },
    ];
  }
  const n = regionById('north');
  return [
    { value: `₹${((n.abp - n.achieved) / 100).toFixed(1)} Cr`, label: 'North business gap' },
    { value: `${n.observedExec}%`, label: 'Observed execution' },
    { value: n.adopters.toLocaleString('en-IN'), label: 'Recorded adopters' },
    { value: String(n.themeMix.awareness), label: 'Awareness campaigns running' },
    { value: 'Pending', label: 'Adoption source validation' },
    { value: 'Pending', label: 'Crop and product scope' },
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
    { id: 'attribution', geography: 'National commercial attribution', indicator: 'Pending', direction: 'Strengthen measurement', tone: 'ok' as const },
  ];
};

export const INTERVENTION_DELIVERABLES = ['Campaign performance diagnosis', 'Territory-wise recovery opportunities', 'Revised strategic intervention plan', 'Updated outcome and investment forecast'];
export const THEME_DELIVERABLES = ['Market opportunity validation', 'Existing theme overlap assessment', 'Target KPI recommendations', 'Refined strategic theme brief'];

/**
 * Zonal Manager data: Marathwada zone, crop nutrition portfolio, territory plans, themes, concepts,
 * business case, activity approvals and impact. Figures shared with BH and FSM are read from bh.ts / fsm.ts.
 * Money in ₹ lakh unless noted.
 */
import type { ZmTerritoryId } from '../routes';
import { AMBAD, ambadMetrics, businessCase, campaignById, CONTRIBUTION_MARGIN, netRoi, territoryById } from './bh';
import { ratio, sum } from './format';
import { budgetMix, CAMPAIGN_ACTIVITIES, campaignFunnel, cropPlan, FSM_CROPS, impactSummary, interventionEffectiveness, ONION_VILLAGE_PLAN } from './fsm';

export type ZmScope = 'zone' | ZmTerritoryId;

export const ZM_SCOPES: { id: ZmScope; label: string }[] = [
  { id: 'zone', label: 'Marathwada zone' },
  { id: 'ambad', label: 'Ambad' },
  { id: 'ghansawangi', label: 'Ghansawangi' },
  { id: 'badnapur', label: 'Badnapur' },
  { id: 'jafrabad', label: 'Jafrabad' },
  { id: 'bhokardan', label: 'Bhokardan' },
];

export const ZM_PORTFOLIOS = [{ id: 'crop-nutrition', label: 'Crop nutrition portfolio' }] as const;
export type ZmPortfolio = (typeof ZM_PORTFOLIOS)[number]['id'];

export const ZONE_NAME = 'Marathwada zone';
export const ZM_TERRITORY_IDS: ZmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur', 'jafrabad', 'bhokardan'];
const ZM_NAME: Record<ZmTerritoryId, string> = { ambad: 'Ambad', ghansawangi: 'Ghansawangi', badnapur: 'Badnapur', jafrabad: 'Jafrabad', bhokardan: 'Bhokardan' };
export const zmTerritoryName = (t: ZmTerritoryId) => ZM_NAME[t];

// ---------------------------------------------------------------- zone territories (all-product ABP, from BH)
/** Last-year all-product sales; Ambad, Ghansawangi and Badnapur match the Field Sales Manager cluster. */
const ZONE_LAST_YEAR: Record<ZmTerritoryId, number> = { ambad: 320, ghansawangi: 280, badnapur: 200, jafrabad: 150, bhokardan: 135 };

export const zoneTerritories = () => ZM_TERRITORY_IDS.map((id) => {
  const t = territoryById(id)!;
  const lastYear = ZONE_LAST_YEAR[id];
  return { id, name: ZM_NAME[id], lastYear, abp: t.abp, ytdSales: t.ytdSales, growthPct: ratio(t.abp - lastYear, lastYear), achievementPct: ratio(t.ytdSales, t.abp) };
});

export const zoneTotal = () => {
  const rows = zoneTerritories();
  const lastYear = sum(rows, (r) => r.lastYear);
  const abp = sum(rows, (r) => r.abp);
  const ytdSales = sum(rows, (r) => r.ytdSales);
  return { lastYear, abp, ytdSales, growthPct: ratio(abp - lastYear, lastYear), achievementPct: ratio(ytdSales, abp) };
};

// ---------------------------------------------------------------- crop nutrition portfolio (product-specific ABP)
export type CategoryId = 'croptek' | 'water-soluble' | 'specialty';
export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: 'croptek', name: 'Croptek' },
  { id: 'water-soluble', name: 'Water Soluble' },
  { id: 'specialty', name: 'Specialty Nutrition' },
];

/** Portfolio split by territory (Ambad, Ghansawangi, Badnapur, Jafrabad, Bhokardan); rows sum to the zone figures. */
const PORTFOLIO_SPLIT: Record<CategoryId, { lastYear: number[]; abp: number[]; ytd: number[] }> = {
  croptek: { lastYear: [140, 38, 27, 20, 15], abp: [190, 50, 35, 25, 20], ytd: [162, 42, 29, 21, 16] },
  'water-soluble': { lastYear: [38, 42, 29, 23, 18], abp: [45, 50, 35, 28, 22], ytd: [39, 43, 31, 25, 20] },
  specialty: { lastYear: [22, 23, 18, 14, 13], abp: [25, 25, 20, 16, 14], ytd: [21, 22, 17, 14, 12] },
};

export const portfolioCell = (c: CategoryId, t: ZmTerritoryId) => {
  const i = ZM_TERRITORY_IDS.indexOf(t);
  const s = PORTFOLIO_SPLIT[c];
  return { lastYear: s.lastYear[i], abp: s.abp[i], ytd: s.ytd[i] };
};

/** Previous-year campaign effectiveness by category (FY 2025–26). */
const PREV_EFFECTIVENESS: Record<CategoryId, { campaigns: number; investment: number; incrementalSales: number; trialToPurchasePct: number }> = {
  croptek: { campaigns: 2, investment: 8, incrementalSales: 32, trialToPurchasePct: 36 },
  'water-soluble': { campaigns: 1, investment: 5, incrementalSales: 17, trialToPurchasePct: 24 },
  specialty: { campaigns: 1, investment: 3, incrementalSales: 9, trialToPurchasePct: 18 },
};

/** Category rows for the zone, or for one territory. */
export const portfolioRows = (t?: ZmTerritoryId) => CATEGORIES.map((c) => {
  const s = PORTFOLIO_SPLIT[c.id];
  const pick = (a: number[]) => (t ? a[ZM_TERRITORY_IDS.indexOf(t)] : sum(a, (x) => x));
  const lastYear = pick(s.lastYear);
  const abp = pick(s.abp);
  const ytd = pick(s.ytd);
  const prev = PREV_EFFECTIVENESS[c.id];
  return {
    ...c, lastYear, abp, ytd,
    growthPct: ratio(abp - lastYear, lastYear),
    achievementPct: ratio(ytd, abp),
    prev: { ...prev, netRoi: netRoi(prev.incrementalSales, prev.investment) },
  };
});

export const portfolioTotal = (t?: ZmTerritoryId) => {
  const rows = portfolioRows(t);
  const lastYear = sum(rows, (r) => r.lastYear);
  const abp = sum(rows, (r) => r.abp);
  const ytd = sum(rows, (r) => r.ytd);
  return { lastYear, abp, ytd, growthPct: ratio(abp - lastYear, lastYear), achievementPct: ratio(ytd, abp) };
};

/** Portfolio ABP by territory (all categories). */
export const portfolioByTerritory = () => ZM_TERRITORY_IDS.map((t) => ({ id: t, name: ZM_NAME[t], ...portfolioTotal(t) }));

// ---------------------------------------------------------------- territory plan submissions
export type PlanStatus = 'awaiting' | 'submitted' | 'returned' | 'endorsed';
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  awaiting: 'Awaiting submission', submitted: 'Submitted · pending review', returned: 'Returned to Field Sales Manager', endorsed: 'Endorsed',
};

/** Crop split of each territory plan (Onion, Maize, Other crops). FSM territories read the FSM crop plan. */
const OTHER_CROP_PLAN: Record<'jafrabad' | 'bhokardan', { abp: number[]; proposed: number[] }> = {
  jafrabad: { abp: [65, 55, 60], proposed: [60, 52, 60] },
  bhokardan: { abp: [50, 52, 58], proposed: [45, 50, 55] },
};
/** Croptek SKU contribution inside each plan. */
const CROPTEK_SKU: Record<ZmTerritoryId, number> = { ambad: 190, ghansawangi: 48, badnapur: 33, jafrabad: 25, bhokardan: 19 };
/** Status before any action in this session; FSM territories follow the FSM store once submitted there. */
const BASE_STATUS: Record<ZmTerritoryId, PlanStatus> = { ambad: 'submitted', ghansawangi: 'awaiting', badnapur: 'awaiting', jafrabad: 'endorsed', bhokardan: 'submitted' };
const FSM_PLAN_TERRITORIES: ZmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];

export const planCrops = (t: ZmTerritoryId) => (t === 'jafrabad' || t === 'bhokardan'
  ? FSM_CROPS.map((crop, i) => ({ crop, abp: OTHER_CROP_PLAN[t].abp[i], proposed: OTHER_CROP_PLAN[t].proposed[i] }))
  : cropPlan(t));

/** Plan status: ZM decisions win; otherwise an FSM submission marks it received; otherwise the base status. */
export const planStatus = (t: ZmTerritoryId, fsmSubmitted: string[], decisions: Partial<Record<ZmTerritoryId, PlanStatus>> = {}): PlanStatus => {
  if (decisions[t]) return decisions[t]!;
  if (FSM_PLAN_TERRITORIES.includes(t)) return fsmSubmitted.includes(t) ? 'submitted' : 'awaiting';
  return BASE_STATUS[t];
};

export const territoryPlan = (t: ZmTerritoryId) => {
  const crops = planCrops(t);
  const plan = sum(crops, (c) => c.proposed);
  const abp = territoryById(t)!.abp;
  return { id: t, name: ZM_NAME[t], abp, plan, gap: abp - plan, coveragePct: ratio(plan, abp), crops, croptekSku: CROPTEK_SKU[t], croptekAbp: portfolioCell('croptek', t).abp };
};

export const territoryPlans = () => ZM_TERRITORY_IDS.map(territoryPlan);
export const plansTotal = () => {
  const p = territoryPlans();
  const abp = sum(p, (x) => x.abp);
  const plan = sum(p, (x) => x.plan);
  return { abp, plan, gap: abp - plan, coveragePct: ratio(plan, abp), croptekSku: sum(p, (x) => x.croptekSku) };
};

/** Ambad onion growth from the FSM village plan (last year → plan). */
export const ambadOnionGrowth = () => {
  const lastYear = sum(ONION_VILLAGE_PLAN, (v) => v.lastYear);
  const plan = sum(ONION_VILLAGE_PLAN, (v) => v.plan);
  return { lastYear, plan, growthPct: ratio(plan - lastYear, lastYear) };
};

// ---------------------------------------------------------------- revised plan (v2) for Ambad
export interface PlanChange { item: string; v1: string; v2: string; changed: boolean }
/** Version 2 raises the onion plan by ₹7 L (Wadi Gaon +₹4 L, Dhanora +₹3 L) at the same ₹100/kg realisation. */
export const REVISED_ONION = { v1: 165, v2: 172, rupeesPerKg: 100, kgPerAcre: 20 };
export const revisedPlan = () => {
  const v1 = territoryPlan('ambad');
  const delta = REVISED_ONION.v2 - REVISED_ONION.v1;
  const v2Plan = v1.plan + delta;
  const mt = (l: number) => (l * 100000) / REVISED_ONION.rupeesPerKg / 1000;
  const acres = (l: number) => Math.round((mt(l) * 1000) / REVISED_ONION.kgPerAcre);
  return {
    v1: { plan: v1.plan, gap: v1.abp - v1.plan, onion: REVISED_ONION.v1, onionMt: mt(REVISED_ONION.v1), acres: acres(REVISED_ONION.v1) },
    v2: { plan: v2Plan, gap: v1.abp - v2Plan, onion: REVISED_ONION.v2, onionMt: mt(REVISED_ONION.v2), acres: acres(REVISED_ONION.v2) },
    villages: [
      { village: 'Wadi Gaon', v1: 18, v2: 22 },
      { village: 'Dhanora', v1: 15, v2: 18 },
    ],
    applicationRate: { v1: 'Validation pending', v2: 'Validated' },
    abp: v1.abp,
  };
};

export type QuestionStatus = 'open' | 'responded' | 'closed';
export const MH_QUESTIONS: { id: string; question: string; topic: string; status: QuestionStatus }[] = [
  { id: 'q-onion-growth', question: 'How is the onion plan growth over last year derived by village?', topic: 'Onion volume basis', status: 'closed' },
  { id: 'q-application-rate', question: 'Has the Croptek application rate been validated for bulb initiation?', topic: 'Application rate', status: 'open' },
  { id: 'q-abp-gap', question: 'How will the remaining gap to the Ambad ABP be closed?', topic: 'ABP gap', status: 'open' },
];

// ---------------------------------------------------------------- themes assigned by Marketing Head
export type ThemeStatus = 'acknowledgement_pending' | 'acknowledged' | 'under_review' | 'planned' | 'clarification_requested';
export const ZM_THEME_STATUS_LABEL: Record<ThemeStatus, string> = {
  acknowledgement_pending: 'Assigned · acknowledgement pending', acknowledged: 'Acknowledged', under_review: 'Under review', planned: 'Planned', clarification_requested: 'Clarification requested',
};
export const ZM_THEMES: { id: string; name: string; crop: string; product: string; geography: string; status: ThemeStatus; assignedBy: string; due: string }[] = [
  { id: 'croptek-conversion', name: 'Croptek conversion', crop: 'Onion', product: 'Croptek', geography: 'Maharashtra · West region', status: 'acknowledgement_pending', assignedBy: 'Marketing Head', due: '15 Mar 2027' },
  { id: 'nutrient-adoption', name: 'Nutrient programme adoption', crop: 'Soybean', product: 'Water Soluble', geography: 'Marathwada zone', status: 'under_review', assignedBy: 'Marketing Head', due: '30 Apr 2027' },
  { id: 'balanced-nutrition', name: 'Balanced nutrition awareness', crop: 'Cotton', product: 'Specialty Nutrition', geography: 'Marathwada zone', status: 'planned', assignedBy: 'Marketing Head', due: '31 May 2027' },
];

/** Croptek conversion evidence behind the strategic brief. */
export const CROPTEK_EVIDENCE = {
  penetrationRange: [14, 18] as [number, number],
  secondarySales: [{ q: 'Q1', v: 40 }, { q: 'Q2', v: 43 }, { q: 'Q3', v: 45 }, { q: 'Q4', v: 48 }],
  trials: 150,
  purchases: 54,
  planLinkage: 25,
};
export const trialToPurchasePct = () => ratio(CROPTEK_EVIDENCE.purchases, CROPTEK_EVIDENCE.trials);

// ---------------------------------------------------------------- concepts
export interface Concept { id: string; code: string; name: string; objective: string; audience: string; journeyStage: string; direction: string; confidence: 'High' | 'Medium' | 'Low'; readiness: 'Ready' | 'Review required' | 'Draft' }
export const CONCEPTS: Concept[] = [
  { id: 'c1', code: 'C1', name: 'Retailer-led Croptek conversion', objective: 'Convert conventional nutrition users to Croptek through retailer advocacy', audience: 'Onion growers buying from mapped retailers', journeyStage: 'Consideration to first purchase', direction: 'Retailer enablement, field demonstrations and verified first purchase', confidence: 'High', readiness: 'Ready' },
  { id: 'c2', code: 'C2', name: 'Trial-to-purchase farmer nurture', objective: 'Turn last-season trial farmers into repeat Croptek buyers', audience: 'Last-year Croptek trial farmers', journeyStage: 'Trial to repeat purchase', direction: 'Follow-up visits, opt-in digital advisory and farmer meetings', confidence: 'Medium', readiness: 'Review required' },
];
export const C1_RATIONALE: { evidence: string; figure: string; assessment: 'Supports' | 'Partly supports' | 'Gap' }[] = [
  { evidence: 'Croptek penetration in onion', figure: '14–18%', assessment: 'Supports' },
  { evidence: 'Secondary sales trend (Q1–Q4)', figure: '₹40 L → ₹48 L', assessment: 'Supports' },
  { evidence: 'Trial-to-purchase', figure: '36%', assessment: 'Partly supports' },
  { evidence: 'Ambad onion growth objective', figure: '₹25 L', assessment: 'Supports' },
  { evidence: 'Retailer mapping coverage', figure: '6 retailers unmapped', assessment: 'Gap' },
];

// ---------------------------------------------------------------- proposition (C1)
export const PROPOSITION = {
  valueProposition: 'Croptek at bulb initiation gives uniform bulb size and better marketable yield for onion growers.',
  targetBenefit: 'Uniform bulb size and higher marketable yield',
  positioning: 'Crop-stage nutrition recommended by the trusted local retailer',
  journey: [
    { id: 'retailer', stage: 'Retailer enablement', detail: 'Product training, demonstration kits and stock readiness at mapped retailers' },
    { id: 'engagement', stage: 'Farmer engagement', detail: 'Village meetings and field demonstrations at the bulb-initiation window' },
    { id: 'trial', stage: 'Trial / consideration', detail: 'Demonstration plots and trial packs for engaged farmers' },
    { id: 'purchase', stage: 'Verified first purchase', detail: 'Retailer-verified first purchase within the crop-stage window' },
  ],
  kpis: [
    { kpi: 'Retailers activated', target: 3 },
    { kpi: 'Farmers reached', target: 640 },
    { kpi: 'Trials', target: 160 },
    { kpi: 'Verified first purchases', target: 72 },
    { kpi: 'Campaign-linked sales (₹ L)', target: 48 },
  ],
};
export type ClaimStatus = 'validated' | 'review_requested' | 'needs_evidence' | 'draft';
export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = { validated: 'Validated', review_requested: 'Technical review requested', needs_evidence: 'Needs evidence', draft: 'Draft' };
export const CROP_STAGES = ['Vegetative', 'Early growth', 'Bulb initiation', 'Bulb development'] as const;
export const CLAIMS: { id: string; text: string; status: ClaimStatus; stages: (typeof CROP_STAGES)[number][] }[] = [
  { id: 'claim-1', text: 'Supports uniform bulb size when applied at bulb initiation', status: 'validated', stages: ['Bulb initiation', 'Bulb development'] },
  { id: 'claim-2', text: 'Improves nutrient uptake in early growth', status: 'validated', stages: ['Vegetative', 'Early growth'] },
  { id: 'claim-3', text: 'Higher marketable yield than conventional nutrition', status: 'needs_evidence', stages: ['Bulb development'] },
  { id: 'claim-4', text: 'Compatible with standard onion spray schedules', status: 'draft', stages: ['Early growth', 'Bulb initiation'] },
];

// ---------------------------------------------------------------- collateral
export const TEMPLATES: { id: string; name: string; format: string; audience: string }[] = [
  { id: 'detailer', name: 'Retailer product detailer', format: 'A4 two-page', audience: 'Mapped retailers' },
  { id: 'leaflet', name: 'Farmer education leaflet', format: 'A5 leaflet', audience: 'Onion growers' },
  { id: 'whatsapp', name: 'Marathi WhatsApp education creative', format: '1080 × 1080 image', audience: 'Opt-in farmers' },
  { id: 'poster', name: 'Field demonstration poster', format: 'A3 poster', audience: 'Demonstration visitors' },
];
export const VERSIONS: { id: string; label: string; changes: string[] }[] = [
  { id: 'v0.1', label: 'Version 0.1', changes: ['First draft from the Retailer product detailer template'] },
  { id: 'v0.2', label: 'Version 0.2', changes: ['Headline shortened', 'Bulb-initiation dose added', 'Marathi body text added'] },
  { id: 'v0.3', label: 'Version 0.3', changes: ['Claim wording aligned to validated claims', 'Retailer contact block added'] },
];
export type ReviewStatus = 'approved' | 'pending' | 'changes_requested';
export const REVIEW_ITEMS: { id: string; item: string; reviewer: string; status: ReviewStatus }[] = [
  { id: 'r-claims', item: 'Product claims', reviewer: 'Agronomy lead', status: 'approved' },
  { id: 'r-dose', item: 'Dose and crop stage', reviewer: 'Agronomy lead', status: 'approved' },
  { id: 'r-brand', item: 'Brand guidelines', reviewer: 'Brand manager', status: 'approved' },
  { id: 'r-language', item: 'Marathi translation', reviewer: 'Regional language reviewer', status: 'pending' },
  { id: 'r-regulatory', item: 'Regulatory statements', reviewer: 'Regulatory affairs', status: 'pending' },
  { id: 'r-legal', item: 'Legal disclaimer', reviewer: 'Legal', status: 'changes_requested' },
];
/** Collateral effectiveness per asset in the Ambad campaign. */
export const COLLATERAL_EFFECTIVENESS: { id: string; asset: string; reach: number; engaged: number; trials: number }[] = [
  { id: 'detailer', asset: 'Retailer product detailer', reach: 74, engaged: 52, trials: 38 },
  { id: 'leaflet', asset: 'Farmer education leaflet', reach: 640, engaged: 310, trials: 64 },
  { id: 'whatsapp', asset: 'Marathi WhatsApp education creative', reach: 420, engaged: 180, trials: 26 },
  { id: 'poster', asset: 'Field demonstration poster', reach: 260, engaged: 150, trials: 32 },
];

// ---------------------------------------------------------------- business case (C1 = BH Croptek)
export const businessCaseC1 = () => {
  const bc = businessCase('croptek');
  return { investment: bc.investment, forecastSales: bc.forecastSales, contributionPct: CONTRIBUTION_MARGIN * 100, contribution: bc.contribution, netRoi: bc.netRoi };
};
/** Driver inputs: eligible farmers × conversion uplift × volume per buyer × realisation = forecast sales. */
export const DRIVERS = { eligibleFarmers: 2400, conversionUpliftPct: 10, volumePerBuyerMt: 0.2, realisationPerMt: 100000, marginPct: 35, investment: 12 };
export type Drivers = typeof DRIVERS;
export const driverBridge = (d: Drivers = DRIVERS) => {
  const buyers = (d.eligibleFarmers * d.conversionUpliftPct) / 100;
  const volumeMt = buyers * d.volumePerBuyerMt;
  const sales = (volumeMt * d.realisationPerMt) / 100000;
  const contribution = (sales * d.marginPct) / 100;
  return { buyers, volumeMt, sales, contribution, netReturn: contribution - d.investment, netRoi: (contribution - d.investment) / d.investment };
};
export const SCENARIO_SALES = [
  { id: 'conservative', name: 'Conservative', sales: 36 },
  { id: 'base', name: 'Base', sales: 48 },
  { id: 'optimistic', name: 'Optimistic', sales: 60 },
] as const;
export const scenarioRow = (sales: number, investment = DRIVERS.investment, marginPct = DRIVERS.marginPct) => {
  const contribution = (sales * marginPct) / 100;
  return { sales, contribution, netRoi: (contribution - investment) / investment };
};
export const C2_CASE = { investment: 8, forecastSales: 28 };
/** C2 ROI is exactly 0.225×; rounded half-up to 2 decimals so it reads +0.23× (floating point would give 0.22). */
export const businessCaseC2 = () => ({ ...C2_CASE, contribution: C2_CASE.forecastSales * CONTRIBUTION_MARGIN, netRoi: Math.round(netRoi(C2_CASE.forecastSales, C2_CASE.investment) * 100 + 1e-6) / 100 });
/** Audience overlap between C1 and C2 (eligible farmers). */
export const AUDIENCE = { c1: 2400, c2: 150, overlap: 54 };

// ---------------------------------------------------------------- activity approvals
export type ApprovalStatus = 'pending' | 'returned' | 'approved' | 'awaiting';
export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = { pending: 'Pending review', returned: 'Returned', approved: 'Approved', awaiting: 'Awaiting submission' };
/** Ambad reads the FSM activity plan; other territories carry their own campaigns. */
export const approvalQueue = () => {
  const mix = budgetMix();
  return [
    { territory: 'ambad' as ZmTerritoryId, campaign: 'Ambad Onion Croptek conversion', owner: 'Field Sales Manager · Ambad', units: sum(CAMPAIGN_ACTIVITIES, (a) => a.units), budget: mix.total, submitted: '12 Feb 2027', status: 'pending' as ApprovalStatus },
    { territory: 'ghansawangi' as ZmTerritoryId, campaign: 'Ghansawangi maize nutrition demonstrations', owner: 'Field Sales Manager · Ghansawangi', units: 10, budget: 2.2, submitted: '05 Feb 2027', status: 'approved' as ApprovalStatus },
    { territory: 'badnapur' as ZmTerritoryId, campaign: 'Badnapur soybean nutrient programme', owner: 'Field Sales Manager · Badnapur', units: 8, budget: 1.8, submitted: '08 Feb 2027', status: 'returned' as ApprovalStatus },
    { territory: 'jafrabad' as ZmTerritoryId, campaign: 'Jafrabad cotton balanced nutrition', owner: 'Field Sales Manager · Jafrabad', units: 7, budget: 1.5, submitted: 'NA', status: 'awaiting' as ApprovalStatus },
    { territory: 'bhokardan' as ZmTerritoryId, campaign: 'Bhokardan onion Croptek farmer meetings', owner: 'Field Sales Manager · Bhokardan', units: 6, budget: 1.2, submitted: '14 Feb 2027', status: 'pending' as ApprovalStatus },
  ];
};

// ---------------------------------------------------------------- impact (same figures as BH and FSM)
export const zmImpact = () => {
  const a = ambadMetrics();
  const fn = campaignFunnel();
  const s = impactSummary();
  const c = campaignById('croptek');
  const bc = businessCase('croptek');
  return {
    reached: fn.reached,
    trials: a.trials, adopters: a.adopters, trialToAdoptionPct: a.trialToAdoptionPct,
    activitiesDone: a.activitiesDone, activitiesPlanned: a.activitiesPlanned, activityPct: a.activityPct,
    campaignLinkedSales: AMBAD.campaignLinkedSales, villageGap: a.villageGap,
    activityProgress: interventionEffectiveness().map((e) => ({ name: e.name, completed: e.completed, planned: e.planned })),
    regionalValidatedSales: c.sales, regionalRoi: bc.actualRoi,
    forecast: s.forecast,
  };
};

// ---------------------------------------------------------------- next-season recommendations
export type Priority = 'High' | 'Medium' | 'Low';
/** Findings are computed from the Ambad results; actions and priorities are the Zonal Manager's proposal. */
export const nextSeason = (): { id: string; finding: string; action: string; priority: Priority }[] => {
  const a = ambadMetrics();
  const fu = interventionEffectiveness().find((e) => e.id === 'followup')!;
  const top = [...COLLATERAL_EFFECTIVENESS].sort((x, y) => y.trials - x.trials)[0];
  return [
    { id: 'ns-village-gap', finding: `Village conversion gap of ${a.villageGap.toFixed(1)} pp between ${a.highest.name} and ${a.lowest.name}`, action: `Repeat ${a.highest.name}'s demonstration-then-follow-up sequence in the lowest villages`, priority: 'High' },
    { id: 'ns-stock', finding: `Demonstration blocked by stock confirmation in ${a.lowest.name}`, action: 'Confirm dealer stock two weeks before each demonstration', priority: 'High' },
    { id: 'ns-followup', finding: `Follow-up rounds ${fu.completed} of ${fu.planned} completed`, action: 'Plan two follow-up rounds per village and assign one owner', priority: 'Medium' },
    { id: 'ns-leaflet', finding: `${top.asset} drove the most trials (${top.trials})`, action: 'Make it the lead asset and print by village', priority: 'Medium' },
    { id: 'ns-retailer', finding: 'Ambad retailers still awaiting mapping verification', action: 'Complete retailer mapping before allocating targets', priority: 'Low' },
  ];
};

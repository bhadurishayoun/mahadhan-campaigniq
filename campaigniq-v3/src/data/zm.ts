/**
 * Zonal Manager data: Marathwada zone, crop nutrition portfolio, territory plans, themes, concepts,
 * business case, activity approvals and impact. Figures shared with BH and FSM are read from bh.ts / fsm.ts.
 * Money in ₹ lakh unless noted.
 */
import type { ZmTerritoryId } from '../routes';
import { AMBAD, ambadMetrics, businessCase, campaignById, CONTRIBUTION_MARGIN, netRoi, territoryById } from './bh';
import { ratio, sum } from './format';
import { budgetMix, CAMPAIGN_ACTIVITIES, campaignFunnel, cropLastYear, cropPlan, FSM_CROPS, impactSummary, interventionEffectiveness, ONION_VILLAGE_PLAN } from './fsm';

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
const OTHER_CROP_PLAN: Record<'jafrabad' | 'bhokardan', { lastYear: number[]; abp: number[]; proposed: number[] }> = {
  jafrabad: { lastYear: [54, 46, 50], abp: [65, 55, 60], proposed: [60, 52, 60] },
  bhokardan: { lastYear: [42, 44, 49], abp: [50, 52, 58], proposed: [45, 50, 55] },
};
/** Portfolio contribution inside each plan (Croptek, Water Soluble, Specialty Nutrition). */
const PLAN_PORTFOLIO: Record<ZmTerritoryId, number[]> = {
  ambad: [190, 40, 22], ghansawangi: [48, 46, 23], badnapur: [33, 32, 18], jafrabad: [25, 26, 15], bhokardan: [19, 20, 13],
};
export const planPortfolio = (t: ZmTerritoryId) => CATEGORIES.map((c, i) => ({ ...c, abp: portfolioCell(c.id, t).abp, contribution: PLAN_PORTFOLIO[t][i] }));
export const planContribution = (t: ZmTerritoryId) => sum(PLAN_PORTFOLIO[t], (x) => x);

/** SKU mapping: base validation status and SKU lines without a portfolio category (₹ L). */
export type MappingStatus = 'validated' | 'needs_review' | 'awaiting' | 'requested';
export const MAPPING_STATUS_LABEL: Record<MappingStatus, string> = { validated: 'Validated', needs_review: 'Review required', awaiting: 'Awaiting submission', requested: 'Mapping correction requested' };
const BASE_MAPPING: Record<ZmTerritoryId, MappingStatus> = { ambad: 'needs_review', ghansawangi: 'awaiting', badnapur: 'awaiting', jafrabad: 'validated', bhokardan: 'needs_review' };
export const UNMAPPED_SKU: Record<ZmTerritoryId, number> = { ambad: 6, ghansawangi: 0, badnapur: 0, jafrabad: 0, bhokardan: 3 };
export const mappingStatus = (t: ZmTerritoryId, overrides: Partial<Record<ZmTerritoryId, MappingStatus>> = {}): MappingStatus => overrides[t] ?? BASE_MAPPING[t];
export const MAPPING_CHECKS: { id: string; label: string }[] = [
  { id: 'sku-ids', label: 'SKU identifiers present' },
  { id: 'category', label: 'SKU-to-portfolio category mapping' },
  { id: 'basis', label: 'Primary sales basis' },
  { id: 'dates', label: 'Validity dates in FY 2026–27' },
  { id: 'duplicates', label: 'No duplicate SKU lines' },
  { id: 'complete', label: 'Source submission complete' },
];
/** Checks already passed before review (by territory). */
export const BASE_CHECKS: Record<ZmTerritoryId, string[]> = {
  ambad: ['basis', 'dates', 'complete'], ghansawangi: [], badnapur: [], jafrabad: MAPPING_CHECKS.map((c) => c.id), bhokardan: ['sku-ids', 'basis', 'dates'],
};

/** Crop and season shares of portfolio sales (%), used by the My Performance filters. */
export const PORTFOLIO_CROP_SHARE: Record<string, number> = { Onion: 45, Maize: 25, 'Other crops': 30 };
export const PORTFOLIO_SEASON_SHARE: Record<string, number> = { Kharif: 55, Rabi: 45 };
/** Croptek SKU contribution inside each plan. */
const CROPTEK_SKU: Record<ZmTerritoryId, number> = { ambad: 190, ghansawangi: 48, badnapur: 33, jafrabad: 25, bhokardan: 19 };
/** Status before any action in this session; FSM territories follow the FSM store once submitted there. */
const BASE_STATUS: Record<ZmTerritoryId, PlanStatus> = { ambad: 'submitted', ghansawangi: 'awaiting', badnapur: 'awaiting', jafrabad: 'endorsed', bhokardan: 'submitted' };
const FSM_PLAN_TERRITORIES: ZmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];

export const planCrops = (t: ZmTerritoryId) => (t === 'jafrabad' || t === 'bhokardan'
  ? FSM_CROPS.map((crop, i) => ({ crop, lastYear: OTHER_CROP_PLAN[t].lastYear[i], abp: OTHER_CROP_PLAN[t].abp[i], proposed: OTHER_CROP_PLAN[t].proposed[i] }))
  : cropPlan(t).map((c, i) => ({ ...c, lastYear: cropLastYear(t)[i] })))
  .map((c) => ({ ...c, growthPct: ratio(c.proposed - c.lastYear, c.lastYear) }));

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

// ---------------------------------------------------------------- revised plan (rev) for Ambad
export interface PlanChange { item: string; orig: string; rev: string; changed: boolean }
/** Version 2 raises the onion plan by ₹7 L (Wadi Gaon +₹4 L, Dhanora +₹3 L) at the same ₹100/kg realisation. */
export const REVISED_ONION = { orig: 165, rev: 172, rupeesPerKg: 100, kgPerAcre: 20 };
export const revisedPlan = () => {
  const orig = territoryPlan('ambad');
  const delta = REVISED_ONION.rev - REVISED_ONION.orig;
  const v2Plan = orig.plan + delta;
  const mt = (l: number) => (l * 100000) / REVISED_ONION.rupeesPerKg / 1000;
  const acres = (l: number) => Math.round((mt(l) * 1000) / REVISED_ONION.kgPerAcre);
  return {
    orig: { plan: orig.plan, gap: orig.abp - orig.plan, onion: REVISED_ONION.orig, onionMt: mt(REVISED_ONION.orig), acres: acres(REVISED_ONION.orig) },
    rev: { plan: v2Plan, gap: orig.abp - v2Plan, onion: REVISED_ONION.rev, onionMt: mt(REVISED_ONION.rev), acres: acres(REVISED_ONION.rev) },
    villages: [
      { village: 'Wadi Gaon', orig: 18, rev: 22 },
      { village: 'Dhanora', orig: 15, rev: 18 },
    ],
    applicationRate: { orig: 'Validation pending', rev: 'Validated' },
    abp: orig.abp,
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
export interface ZmTheme {
  id: string; name: string; crop: string; product: string; geography: string; region: string; status: ThemeStatus; assignedBy: string; due: string;
  objective: string; scope: string; audience: string; openPoints: string;
}
export const ZM_THEMES: ZmTheme[] = [
  {
    id: 'croptek-conversion', name: 'Croptek conversion', crop: 'Onion', product: 'Croptek', geography: 'Maharashtra', region: 'West region', status: 'acknowledgement_pending', assignedBy: 'Marketing Head', due: '15 Mar 2027',
    objective: 'Strengthen eligible farmer conversion and Croptek adoption.',
    scope: 'Maharashtra · Onion (initial focus); other West region markets after eligibility checks.',
    audience: 'Conventional nutrition and trial-interest farmers who meet eligibility and consent.',
    openPoints: 'Retailer influence, historical comparator, stock readiness and technical applicability.',
  },
  {
    id: 'nutrient-adoption', name: 'Nutrient programme adoption', crop: 'Soybean', product: 'Water Soluble', geography: 'Marathwada zone', region: 'West region', status: 'under_review', assignedBy: 'Marketing Head', due: '30 Apr 2027',
    objective: 'Grow repeat use of the soybean nutrient programme among last-season buyers.',
    scope: 'Marathwada zone · Soybean (kharif).',
    audience: 'Last-season Water Soluble buyers in soybean villages.',
    openPoints: 'Kharif stock plan and dealer credit terms.',
  },
  {
    id: 'balanced-nutrition', name: 'Balanced nutrition awareness', crop: 'Cotton', product: 'Specialty Nutrition', geography: 'Marathwada zone', region: 'West region', status: 'planned', assignedBy: 'Marketing Head', due: '31 May 2027',
    objective: 'Raise awareness of balanced nutrition practice in cotton.',
    scope: 'Marathwada zone · Cotton.',
    audience: 'Cotton growers in mapped retailer catchments.',
    openPoints: 'Agronomy content and season timing.',
  },
];
export const themeById = (id: string) => ZM_THEMES.find((t) => t.id === id) ?? ZM_THEMES[0];

/** Zonal Manager deliverables once a theme is acknowledged. */
export const DELIVERABLES = [
  'Develop one or more campaign concepts under the theme',
  'Validate the product proposition and technical claims',
  'Define target audiences and the intervention approach',
  'Develop collateral for farmers, retailers and field use',
  'Model investments and the business case',
  'Submit campaign proposals to the Marketing Head',
];
export const CLARIFICATION_TOPICS = [
  { id: 'benchmark', topic: 'Historical benchmark for the trial-to-purchase rate', question: 'Please share a historical benchmark for the observed trial-to-purchase rate so a realistic conversion target can be set.' },
  { id: 'retailer', topic: 'Retailer influence and channel availability', question: 'Please confirm the evidence on retailer influence and channel stock availability for Croptek in onion.' },
  { id: 'eligibility', topic: 'Maharashtra vs broader West region eligibility', question: 'Please confirm whether other West region markets are in scope once Maharashtra eligibility is validated.' },
  { id: 'guardrails', topic: 'Deliverables and strategic guardrails', question: 'Please confirm the deliverables and any budget or brand guardrails for this theme.' },
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
export const secondaryTrend = () => CROPTEK_EVIDENCE.secondarySales.map((s) => `₹${s.v} L`).join(' → ');

// ---------------------------------------------------------------- concepts
export type Confidence = 'High' | 'Medium' | 'Medium-low' | 'Low';
export interface Concept {
  id: string; code: string; name: string; objective: string; audience: string; journeyStage: string; direction: string; confidence: Confidence; note: string;
  evidence: string; channelReadiness: string; technical: string; nextAction: string; eligibleFarmers: number;
}
export const CONCEPTS: Concept[] = [
  {
    id: 'c1', code: 'C1', name: 'Retailer-led Croptek conversion', objective: 'Improve first purchase through retailer education and recommendation.',
    audience: 'Eligible farmers influenced through retailer interactions.', journeyStage: 'Recommendation to first purchase',
    direction: 'Retailer education, channel activation, assisted conversion.', confidence: 'Medium-low', note: 'Retailer influence needs validation.',
    evidence: 'Retailer influence and channel stock evidence still to be verified.', channelReadiness: 'Retailer network available; activation readiness to be confirmed.',
    technical: 'None identified at this stage.', nextAction: 'Develop as a draft campaign with retailer influence and channel stock validation.', eligibleFarmers: 2400,
  },
  {
    id: 'c2', code: 'C2', name: 'Trial-to-purchase farmer nurture', objective: 'Improve first purchase for verified trial or interest cohorts through structured follow-up.',
    audience: 'Verified trial and interest farmer cohorts.', journeyStage: 'Trial to first purchase',
    direction: 'Follow-up, education, consent-based communication.', confidence: 'Medium-low', note: 'Conversion benchmark and eligibility / consent validation pending.',
    evidence: '54 purchases among 150 trials (36%); CRM matching and contact evidence to validate.', channelReadiness: 'Nurture flow feasible; CRM contact readiness to be validated.',
    technical: 'None identified at this stage.', nextAction: 'Develop as a draft campaign with CRM matching and contact consent validation.', eligibleFarmers: 150,
  },
];
export const COMPARE_DIMENSIONS: { key: keyof Concept; label: string }[] = [
  { key: 'objective', label: 'Strategic objective' },
  { key: 'audience', label: 'Priority audience' },
  { key: 'journeyStage', label: 'Journey stage' },
  { key: 'direction', label: 'Intervention direction' },
  { key: 'evidence', label: 'Supporting evidence' },
  { key: 'channelReadiness', label: 'Channel readiness' },
  { key: 'technical', label: 'Technical / agronomy dependencies' },
  { key: 'nextAction', label: 'Next development action' },
];
export type Assessment = 'Observed' | 'Unverified' | 'Awaiting validation' | 'Unavailable' | 'Pending';
/** Evidence behind a concept, grouped as market attractiveness and intervention suitability. */
export const conceptRationale = (id: string): { group: 'Market attractiveness' | 'Intervention suitability'; item: string; source: string; finding: string; assessment: Assessment }[] => {
  const market = [
    { group: 'Market attractiveness' as const, item: 'Onion Croptek penetration', source: 'Market landscape · Maharashtra onion', finding: `${CROPTEK_EVIDENCE.penetrationRange[0]}–${CROPTEK_EVIDENCE.penetrationRange[1]}%`, assessment: 'Observed' as Assessment },
    { group: 'Market attractiveness' as const, item: 'Secondary sales trend (Q1–Q4)', source: 'Commercial trend · Maharashtra', finding: secondaryTrend(), assessment: 'Observed' as Assessment },
    { group: 'Market attractiveness' as const, item: 'Pilot farmer conversion', source: 'Farmer investigation', finding: `${CROPTEK_EVIDENCE.trials} trials / ${CROPTEK_EVIDENCE.purchases} purchases = ${Math.round(trialToPurchasePct())}%`, assessment: 'Observed' as Assessment },
  ];
  const suit = id === 'c2' ? [
    { item: 'Historical comparable benchmark', source: 'Past programmes', finding: 'No comparable programme on record', assessment: 'Unavailable' as Assessment },
    { item: 'CRM matching of trial farmers', source: 'CRM records', finding: `${CROPTEK_EVIDENCE.trials} trial farmers to match`, assessment: 'Awaiting validation' as Assessment },
    { item: 'Contact consent', source: 'Programme eligibility', finding: 'Consent status per farmer', assessment: 'Pending' as Assessment },
  ] : [
    { item: 'Historical comparable benchmark', source: 'Past programmes', finding: 'No comparable programme on record', assessment: 'Unavailable' as Assessment },
    { item: 'Retailer recommendation influence', source: 'Retailer survey', finding: 'Influence share not measured', assessment: 'Unverified' as Assessment },
    { item: 'Stock / channel readiness', source: 'Theme brief · supply check', finding: 'Stock at mapped retailers', assessment: 'Awaiting validation' as Assessment },
    { item: 'Cohort eligibility / consent', source: 'Evidence review', finding: 'Eligibility rules per cohort', assessment: 'Pending' as Assessment },
  ];
  return [...market, ...suit.map((s) => ({ group: 'Intervention suitability' as const, ...s }))];
};
/** Audience overlap between C1 and C2 (eligible farmers). */
export const AUDIENCE = { c1: 2400, c2: 150, overlap: 54 };

// ---------------------------------------------------------------- proposition (C1)
export const PROPOSITION = {
  valueProposition: 'Enable more farmers to try and adopt the Croptek solution through retailer-led recommendation.',
  targetBenefit: 'Support crop performance and crop health, in line with Croptek positioning.',
  positioning: 'Retailer-recommended, trusted Croptek solution with local support and a trial pathway.',
};
export type PropositionField = keyof typeof PROPOSITION;
export interface JourneyStage { id: string; stage: string; summary: string; objective: string; participants: string; channels: string; expectedAction: string; collateral: string; kpi: string }
export const JOURNEY: JourneyStage[] = [
  { id: 'retailer', stage: 'Retailer enablement', summary: 'Retailer product education and recommendation', objective: 'Build retailer readiness to recommend Croptek to eligible farmers.', participants: 'Mapped retailers in the selected onion territories.', channels: 'Retailer meetings, product briefing and enablement sessions.', expectedAction: 'Retailers understand, are confident in and recommend Croptek to eligible farmers.', collateral: 'Retailer product detailer, key talking points and recommendation guide.', kpi: 'Retailers trained against retailers assigned.' },
  { id: 'engagement', stage: 'Farmer engagement', summary: 'Eligible farmer product discussion', objective: 'Reach eligible onion farmers with the Croptek crop-stage message.', participants: 'Eligible onion farmers in campaign villages.', channels: 'Village meetings and opt-in digital advisory.', expectedAction: 'Farmers discuss Croptek with their retailer before bulb initiation.', collateral: 'Farmer education leaflet and Marathi WhatsApp creative.', kpi: 'Farmers reached in campaign villages.' },
  { id: 'trial', stage: 'Trial / consideration', summary: 'Approved demonstration or trial support', objective: 'Let farmers see Croptek results on demonstration plots.', participants: 'Engaged farmers and demonstration hosts.', channels: 'Field demonstrations at the bulb-initiation window.', expectedAction: 'Farmers take a trial pack or visit a demonstration plot.', collateral: 'Field demonstration poster.', kpi: 'Trials recorded.' },
  { id: 'purchase', stage: 'Verified first purchase', summary: 'Farmer purchase verification and follow-up', objective: 'Convert trials into verified first purchases.', participants: 'Trial farmers and their retailers.', channels: 'Field follow-ups and retailer purchase verification.', expectedAction: 'Farmers make a retailer-verified first purchase.', collateral: 'Follow-up script and purchase verification slip.', kpi: 'Verified first purchases.' },
];
/** KPI configuration for the intervention (targets match the Ambad plan and the C1 business case). */
export const INTERVENTION_KPIS: { id: string; kpi: string; measure: string; source: string; target: string; status: 'Pending' | 'Conditional' | 'Defined' }[] = [
  { id: 'trained', kpi: 'Retailer training completion', measure: 'Retailers trained ÷ eligible retailers assigned', source: 'Field app / CRM', target: '3 retailer sessions', status: 'Pending' },
  { id: 'reach', kpi: 'Farmers reached', measure: 'Distinct eligible farmers with a qualified interaction', source: 'CRM / field app', target: '640 farmers', status: 'Pending' },
  { id: 'trials', kpi: 'Trials', measure: 'Farmers recorded at a demonstration or with a trial pack', source: 'Field app', target: '160 trials', status: 'Defined' },
  { id: 'purchases', kpi: 'Verified first purchases', measure: 'Farmer-linked purchase records matched to trials', source: 'Linked sales / CRM', target: '72 adopters', status: 'Pending' },
  { id: 'sales', kpi: 'Attributable incremental sales', measure: 'Campaign-linked sales against comparable cohorts', source: 'Validated sales', target: '₹48.0 L', status: 'Conditional' },
];
export const READINESS_CHECKS = ['Historical benchmark', 'Retailer influence', 'Stock / channel readiness', 'Technical claims', 'Purchase linkage'];
export const INTERVENTION_TYPES = ['Retailer briefing', 'Product education', 'Field demonstration support', 'Authorised material distribution', 'Farmer follow-up'];

export type ClaimStatus = 'pending' | 'unvalidated' | 'review_requested' | 'validated';
export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = { pending: 'Pending', unvalidated: 'Unvalidated', review_requested: 'Technical review requested', validated: 'Validated' };
export const CROP_STAGES = ['Early growth', 'Vegetative', 'Bulb initiation', 'Bulb development'] as const;
export type CropStage = (typeof CROP_STAGES)[number];
export interface Claim { id: string; text: string; category: string; evidence: string; stages: CropStage[]; reviewer: string; status: ClaimStatus; substantiation: string }
export const CLAIMS: Claim[] = [
  { id: 'claim-1', text: 'Complete crop nutrition for onion', category: 'Crop nutrition', evidence: 'Authorised product composition and label positioning', stages: ['Vegetative', 'Bulb initiation', 'Bulb development'], reviewer: 'Agronomy reviewer (onion)', status: 'pending', substantiation: 'Authorised product composition, nutrient role reference and label positioning.' },
  { id: 'claim-2', text: 'Supports healthy crop growth', category: 'Crop health', evidence: 'Product master nutrient profile and label claim', stages: ['Early growth', 'Vegetative'], reviewer: 'Agronomy reviewer (onion)', status: 'unvalidated', substantiation: 'Nutrient profile from the product master and the approved label claim.' },
  { id: 'claim-3', text: 'Promotes stronger roots', category: 'Root development', evidence: 'Product formulation and technical reference', stages: ['Early growth'], reviewer: 'Agronomy reviewer (onion)', status: 'pending', substantiation: 'Formulation sheet and internal technical reference.' },
  { id: 'claim-4', text: 'Aids bulb development', category: 'Bulb development', evidence: 'Product master nutrient role and label positioning', stages: ['Bulb initiation', 'Bulb development'], reviewer: 'Agronomy reviewer (onion)', status: 'unvalidated', substantiation: 'Nutrient role at bulb initiation from the product master.' },
];

// ---------------------------------------------------------------- collateral
/** Artwork cropped from the approved mockups (src/assets/collateral/<key>.png). */
export type ImageKey = 'onion-bulbs' | 'onion-field' | 'onion-rows' | 'onion-harvest';
export const IMAGE_LABEL: Record<ImageKey, string> = { 'onion-bulbs': 'Onion bulbs (close-up)', 'onion-field': 'Young onion crop', 'onion-rows': 'Onion rows in field', 'onion-harvest': 'Harvested onion' };
export type TemplateId = 'detailer' | 'leaflet' | 'whatsapp' | 'poster';
export interface CollateralTemplate { id: TemplateId; name: string; format: string; audience: string; language: string; highlights: string[]; version: string; languages: string; headline: string }
export const TEMPLATES: CollateralTemplate[] = [
  { id: 'detailer', name: 'Retailer product detailer', format: 'English / PPT', audience: 'Retailer', language: 'English / Marathi', highlights: ['Key features at a glance', 'Use in the crop programme', 'Farmer discussion points'], version: 'v0.3', languages: 'English, Marathi', headline: 'Complete Crop Nutrition for Onion' },
  { id: 'leaflet', name: 'Farmer education leaflet', format: 'English / PDF', audience: 'Farmer', language: 'English / Marathi', highlights: ['Crop information', 'Healthy crop care', 'Discussion with retailer'], version: 'v0.1', languages: 'English, Marathi', headline: 'Onion Crop Education' },
  { id: 'whatsapp', name: 'Marathi WhatsApp education creative', format: 'Marathi / Image', audience: 'Farmer', language: 'Marathi', highlights: ['Share information', 'Crop care', 'Talk to farmers'], version: 'v0.1', languages: 'Marathi', headline: 'Crop Care Information with Croptek' },
  { id: 'poster', name: 'Field demonstration poster', format: 'English / PDF', audience: 'Retailer / Farmer', language: 'English / Marathi', highlights: ['On-field discussion', 'Crop observation', 'Key takeaways'], version: 'v0.1', languages: 'Marathi', headline: 'Field Demonstration and Crop Discussion' },
];
export const SOURCE_INPUTS = ['Product master', 'Draft claims', 'Intervention design', 'Authorised imagery library', 'Supporting evidence status'];

export interface CollateralVersion {
  id: string; template: TemplateId; date: string; description: string; source: string;
  headline: string; body: string; image: ImageKey; layout: number; marathi: string; points: string[];
}
const POINTS = ['Product education for retailers', 'Key features and crop usage', 'Discussion support for farmers'];
/** Retailer product detailer history (versions 0.1 to 0.3). */
export const SEED_VERSIONS: CollateralVersion[] = [
  { id: 'v0.1', template: 'detailer', date: '22 Jan 2027, 10:18', description: 'Initial draft', source: 'Draft generator', headline: 'Croptek Product Overview', body: 'For retailer education and farmer discussion.', image: 'onion-harvest', layout: 0, marathi: '', points: POINTS },
  { id: 'v0.2', template: 'detailer', date: '24 Jan 2027, 16:32', description: 'Content and visual update', source: 'Zonal Manager workspace', headline: 'Croptek Product Overview', body: 'Helps in overall crop development in onion.', image: 'onion-harvest', layout: 0, marathi: '', points: POINTS },
  { id: 'v0.3', template: 'detailer', date: '26 Jan 2027, 11:24', description: 'Current draft', source: 'Draft generator', headline: 'Complete Crop Nutrition for Onion', body: 'A balanced nutrition approach for healthy crop growth and better bulb development.', image: 'onion-bulbs', layout: 0, marathi: 'कांदा पिकासाठी संतुलित पोषण', points: POINTS },
];
/** Prepared rewrites offered by "Rewrite text" (cycled in order). */
export const REWRITES: { headline: string; body: string }[] = [
  { headline: 'Balanced Nutrition for Better Onion Bulbs', body: 'Croptek supports uniform bulb size when applied at bulb initiation.' },
  { headline: 'Croptek for a Healthier Onion Crop', body: 'Ask your retailer how Croptek fits your onion crop-stage programme.' },
  { headline: 'Grow Stronger Onions with Croptek', body: 'Crop-stage nutrition for healthy growth, stronger roots and bulb development.' },
];
/** Change items between two versions (headline, body, image, layout, Marathi variant). */
export const versionChanges = (a: CollateralVersion, b: CollateralVersion) => {
  const out: { item: string; change: string; validation: string }[] = [];
  if (a.headline !== b.headline) out.push({ item: 'Headline', change: 'Revised', validation: 'Technical review pending' });
  if (a.body !== b.body) out.push({ item: 'Product claim copy', change: 'Changed', validation: 'Agronomy approval pending' });
  if (a.image !== b.image) out.push({ item: 'Onion image', change: 'Replaced', validation: 'Brand / rights review pending' });
  if (a.layout !== b.layout) out.push({ item: 'Layout', change: 'Adjusted', validation: 'Brand review pending' });
  if (a.marathi !== b.marathi) out.push({ item: 'Marathi variant', change: a.marathi ? 'Revised' : 'Created', validation: 'Translation review pending' });
  return out;
};

export type ReviewStatus = 'under_review' | 'evidence_pending' | 'not_validated' | 'review_pending' | 'approved';
export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = { under_review: 'Under review', evidence_pending: 'Evidence pending', not_validated: 'Not validated', review_pending: 'Review pending', approved: 'Approved' };
export interface ReviewItem { id: string; element: string; kind: 'Claim' | 'Imagery' | 'Language'; evidence: string; owner: string; stage: string; observation: string; status: ReviewStatus }
export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'r-claim-1', element: 'Complete crop nutrition for onion', kind: 'Claim', evidence: 'Authorised product information and label / technical reference', owner: 'Agronomy / technical', stage: 'Technical review', observation: 'Awaiting reviewer findings', status: 'under_review' },
  { id: 'r-claim-2', element: 'Supports healthy crop growth', kind: 'Claim', evidence: 'Product master and agronomy evidence', owner: 'Agronomy / technical', stage: 'Technical review', observation: 'Evidence verification pending', status: 'evidence_pending' },
  { id: 'r-claim-3', element: 'Promotes stronger roots', kind: 'Claim', evidence: 'Product master and agronomy evidence', owner: 'Agronomy / technical', stage: 'Technical review', observation: 'Not yet validated', status: 'not_validated' },
  { id: 'r-claim-4', element: 'Aids bulb development', kind: 'Claim', evidence: 'Product master and crop-stage evidence', owner: 'Agronomy / technical', stage: 'Technical review', observation: 'Technical review pending', status: 'not_validated' },
  { id: 'r-imagery', element: 'Onion imagery and brand layout', kind: 'Imagery', evidence: 'Authorised imagery library and brand guidelines', owner: 'Brand / content', stage: 'Brand review', observation: 'Brand and asset-rights review pending', status: 'review_pending' },
  { id: 'r-marathi', element: 'Marathi translation variant', kind: 'Language', evidence: 'Approved content base and language guidelines', owner: 'Language reviewer', stage: 'Language review', observation: 'Translation review pending', status: 'review_pending' },
];

/** Playbook assets other than the detailer, whose status follows its review items. */
export type AssetStatus = 'approved' | 'technical_review' | 'approval_pending' | 'not_selected';
export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = { approved: 'Approved', technical_review: 'Technical review pending', approval_pending: 'Approval pending', not_selected: 'Not selected' };
export const BASE_ASSET_STATUS: Record<TemplateId, AssetStatus> = { detailer: 'technical_review', leaflet: 'approval_pending', whatsapp: 'approval_pending', poster: 'not_selected' };
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

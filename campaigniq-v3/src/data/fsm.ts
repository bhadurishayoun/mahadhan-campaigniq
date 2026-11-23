/**
 * Field Sales Manager data (Jalna cluster). A drill-down of the Business Head data in `bh.ts`, never a separate set:
 * territory ABPs, Ambad trials / adopters / villages and campaign-linked sales are read from `bh.ts` (so they follow
 * the period filter and always match the Business Head screens). Money in ₹ lakh.
 */
import type { FsmTerritoryId } from '../routes';
import { AMBAD, ambadMetrics, CONTRIBUTION_MARGIN, netRoi, territoryById } from './bh';
import { ratio, sum } from './format';

export type FsmScope = 'cluster' | FsmTerritoryId;

export const FSM_SCOPES: { id: FsmScope; label: string }[] = [
  { id: 'cluster', label: 'Jalna cluster' },
  { id: 'ambad', label: 'Ambad' },
  { id: 'ghansawangi', label: 'Ghansawangi' },
  { id: 'badnapur', label: 'Badnapur' },
];

// ---------------------------------------------------------------- cluster (My Performance)
export const FSM_TERRITORY_IDS: FsmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];
const LAST_YEAR: Record<FsmTerritoryId, number> = { ambad: 320, ghansawangi: 280, badnapur: 200 };
const FSM_NAME: Record<FsmTerritoryId, string> = { ambad: 'Ambad', ghansawangi: 'Ghansawangi', badnapur: 'Badnapur' };

export interface ClusterRow { id: FsmTerritoryId; name: string; lastYear: number; abp: number; ytdSales: number; growthPct: number }

/** One row per territory; ABP and YTD sales come from the Business Head territory records. */
export const clusterRows = (): ClusterRow[] => FSM_TERRITORY_IDS.map((id) => {
  const t = territoryById(id)!;
  return { id, name: FSM_NAME[id], lastYear: LAST_YEAR[id], abp: t.abp, ytdSales: t.ytdSales, growthPct: ratio(t.abp - LAST_YEAR[id], LAST_YEAR[id]) };
});

export const clusterTotal = () => {
  const rows = clusterRows();
  const lastYear = sum(rows, (r) => r.lastYear);
  const abp = sum(rows, (r) => r.abp);
  return { lastYear, abp, ytdSales: sum(rows, (r) => r.ytdSales), growthPct: ratio(abp - lastYear, lastYear) };
};

// ---------------------------------------------------------------- crop / product / season splits (My Performance filters)
export const FSM_CROPS = ['Onion', 'Maize', 'Other crops'] as const;
export type FsmCrop = (typeof FSM_CROPS)[number];
/** Last-year sales and ABP by crop per territory (₹ L); each sums to the territory total. Ambad's onion ABP is the BH figure. */
const CROP_SPLIT: Record<FsmTerritoryId, { lastYear: number[]; abp: number[] }> = {
  ambad: { lastYear: [144, 80, 96], abp: [190, 125, 105] },
  ghansawangi: { lastYear: [98, 77, 105], abp: [119, 94, 127] },
  badnapur: { lastYear: [62, 51, 87], abp: [75, 61, 104] },
};
/** Last-year sales per crop (Onion, Maize, Other crops) for a territory. */
export const cropLastYear = (t: FsmTerritoryId) => CROP_SPLIT[t].lastYear;
/** Product and season shares of sales (%), same across the cluster. */
export const PRODUCT_SHARE: Record<string, number> = { Croptek: 56, 'Other products': 44 };
export const SEASON_SHARE: Record<string, number> = { Kharif: 60, Rabi: 40 };
/** Last year's cluster target and incentive achievement (FY 2025–26). */
export const LAST_YEAR_SNAPSHOT = { target: 850, incentivePct: 91.7 };
export const GROWTH_DRIVERS = ['Expand Croptek adoption in onion and maize', 'Increase business from under-served retailers', 'Drive repeat purchase from last-year trial users'];

export interface PerfFilter { crop: string; product: string; season: string }
const ALL_F = 'all';
/** Share (0–1) of a territory's figure that passes the crop / product / season filters. */
const share = (id: FsmTerritoryId, f: PerfFilter, kind: 'lastYear' | 'abp') => {
  const split = CROP_SPLIT[id][kind];
  const total = sum(split, (v) => v);
  const crop = f.crop === ALL_F ? 1 : split[FSM_CROPS.indexOf(f.crop as FsmCrop)] / total;
  const product = f.product === ALL_F ? 1 : PRODUCT_SHARE[f.product] / 100;
  const season = f.season === ALL_F ? 1 : SEASON_SHARE[f.season] / 100;
  return crop * product * season;
};

/** Cluster rows under the My Performance filters (figures scale with the selected crop / product / season). */
export const perfRows = (f: PerfFilter = { crop: ALL_F, product: ALL_F, season: ALL_F }): ClusterRow[] => clusterRows().map((r) => {
  const ly = r.lastYear * share(r.id, f, 'lastYear');
  const abp = r.abp * share(r.id, f, 'abp');
  return { ...r, lastYear: ly, abp, ytdSales: r.ytdSales * share(r.id, f, 'abp'), growthPct: ratio(abp - ly, ly) };
});

/** Last-year sales mix across the cluster: crop shares and product shares (%). */
export const lastYearMix = () => {
  const total = sum(FSM_TERRITORY_IDS, (id) => LAST_YEAR[id]);
  return {
    crops: FSM_CROPS.map((c, i) => ({ name: c, pct: ratio(sum(FSM_TERRITORY_IDS, (id) => CROP_SPLIT[id].lastYear[i]), total) })),
    products: Object.entries(PRODUCT_SHARE).map(([name, pct]) => ({ name, pct })),
  };
};

// ---------------------------------------------------------------- outlet networks (Ambad in full; Ghansawangi and Badnapur)
export type MappingStatus = 'Mapped' | 'Pending verification';

export interface Dealer { id: string; name: string; village: string; lastYear: number; proposed: number; activeRetailers: number; inactiveRetailers: number }
export interface Retailer { id: string; name: string; dealerId: string; village: string; active: boolean; mapping: MappingStatus; secondaryDemand: number }

const DEALER_SETS: Record<FsmTerritoryId, Dealer[]> = {
  ambad: [
    { id: 'dhanora-agro', name: 'Dhanora Agro Inputs', village: 'Dhanora', lastYear: 48, proposed: 55, activeRetailers: 11, inactiveRetailers: 1 },
    { id: 'ambad-depot', name: 'Ambad Crop Depot', village: 'Ambad HQ', lastYear: 36, proposed: 43, activeRetailers: 10, inactiveRetailers: 1 },
    { id: 'wadi-krishi', name: 'Wadi Gaon Krishi Kendra', village: 'Wadi Gaon', lastYear: 46, proposed: 54, activeRetailers: 10, inactiveRetailers: 1 },
    { id: 'ganesh-fert', name: 'Shree Ganesh Fertilisers', village: 'Ambad HQ', lastYear: 44, proposed: 52, activeRetailers: 9, inactiveRetailers: 1 },
    { id: 'pimpalgaon-agro', name: 'Pimpalgaon Agro Services', village: 'Pimpalgaon', lastYear: 40, proposed: 47, activeRetailers: 9, inactiveRetailers: 0 },
    { id: 'kumbhephal-seva', name: 'Kumbhephal Kisan Seva', village: 'Kumbhephal', lastYear: 38, proposed: 45, activeRetailers: 9, inactiveRetailers: 1 },
    { id: 'jai-kisan', name: 'Jai Kisan Traders', village: 'Ambad HQ', lastYear: 36, proposed: 43, activeRetailers: 8, inactiveRetailers: 0 },
    { id: 'matoshree-agro', name: 'Matoshree Agro Agencies', village: 'Dhanora', lastYear: 32, proposed: 41, activeRetailers: 8, inactiveRetailers: 1 },
  ],
  ghansawangi: [
    { id: 'ghansawangi-agro', name: 'Ghansawangi Agro Centre', village: 'Ghansawangi HQ', lastYear: 58, proposed: 64, activeRetailers: 10, inactiveRetailers: 1 },
    { id: 'tirthpuri-krishi', name: 'Tirthpuri Krishi Kendra', village: 'Tirthpuri', lastYear: 52, proposed: 58, activeRetailers: 9, inactiveRetailers: 0 },
    { id: 'samarth-fert', name: 'Samarth Fertilisers', village: 'Ghansawangi HQ', lastYear: 48, proposed: 53, activeRetailers: 8, inactiveRetailers: 1 },
    { id: 'kumbhar-seva', name: 'Kumbhar Pimpalgaon Kisan Seva', village: 'Kumbhar Pimpalgaon', lastYear: 46, proposed: 51, activeRetailers: 8, inactiveRetailers: 1 },
    { id: 'rani-agro', name: 'Rani Unchegaon Agro Inputs', village: 'Rani Unchegaon', lastYear: 40, proposed: 45, activeRetailers: 7, inactiveRetailers: 0 },
    { id: 'vitthal-traders', name: 'Vitthal Traders', village: 'Tirthpuri', lastYear: 36, proposed: 39, activeRetailers: 6, inactiveRetailers: 1 },
  ],
  badnapur: [
    { id: 'badnapur-depot', name: 'Badnapur Crop Depot', village: 'Badnapur HQ', lastYear: 52, proposed: 57, activeRetailers: 9, inactiveRetailers: 1 },
    { id: 'shelgaon-agro', name: 'Shelgaon Agro Services', village: 'Shelgaon', lastYear: 44, proposed: 48, activeRetailers: 8, inactiveRetailers: 1 },
    { id: 'rajewadi-krishi', name: 'Rajewadi Krishi Kendra', village: 'Rajewadi', lastYear: 40, proposed: 44, activeRetailers: 7, inactiveRetailers: 0 },
    { id: 'daregaon-seva', name: 'Daregaon Kisan Seva', village: 'Daregaon', lastYear: 34, proposed: 38, activeRetailers: 6, inactiveRetailers: 1 },
    { id: 'mauli-fert', name: 'Mauli Fertilisers', village: 'Badnapur HQ', lastYear: 30, proposed: 33, activeRetailers: 5, inactiveRetailers: 0 },
  ],
};

const SHOP = ['Krishi Seva Kendra', 'Agro Centre', 'Kisan Traders', 'Fertiliser Stores', 'Agri Mart', 'Shetkari Seva', 'Beej Bhandar', 'Agro Agencies', 'Krushi Udyog', 'Kisan Kendra', 'Agri Point', 'Shivam Agro'];
const PREFIX = ['Balaji', 'Saraswati', 'Mauli', 'Om Sai', 'Shivneri', 'Datta', 'Ganga', 'Vitthal', 'Samarth', 'Laxmi', 'Jay Bhavani', 'Renuka'];

/**
 * Retailers mapped under each dealer. Indicative secondary demand: 80% of the dealer's proposed target, spread across
 * its active retailers by outlet size (inactive retailers carry none until reactivated and verified).
 */
const SIZE = [1.5, 1.3, 1.2, 1.1, 1, 1, 0.9, 0.9, 0.8, 0.8, 0.7, 0.6];
/** Demand of the i-th active retailer when a dealer's target is spread over `active` retailers. */
export const retailerDemand = (dealerTarget: number, active: number, i: number) => {
  const w = SIZE.slice(0, active);
  return Math.round(((dealerTarget * 0.8 * w[i]) / w.reduce((s, x) => s + x, 0)) * 10) / 10;
};
const retailersFor = (dealers: Dealer[]): Retailer[] => dealers.flatMap((d, di) => {
  const n = d.activeRetailers + d.inactiveRetailers;
  return Array.from({ length: n }, (_, i) => {
    const active = i < d.activeRetailers;
    return {
      id: `${d.id}-r${i + 1}`,
      name: `${PREFIX[(di * 5 + i) % PREFIX.length]} ${SHOP[(di * 7 + i) % SHOP.length]}`,
      dealerId: d.id,
      village: d.village,
      active,
      mapping: active ? 'Mapped' : 'Pending verification',
      secondaryDemand: active ? retailerDemand(d.proposed, d.activeRetailers, i) : 0,
    } satisfies Retailer;
  });
});
const RETAILER_SETS: Record<FsmTerritoryId, Retailer[]> = {
  ambad: retailersFor(DEALER_SETS.ambad),
  ghansawangi: retailersFor(DEALER_SETS.ghansawangi),
  badnapur: retailersFor(DEALER_SETS.badnapur),
};

export const dealersOf = (t: FsmTerritoryId = 'ambad') => DEALER_SETS[t];
export const retailersOf = (t: FsmTerritoryId = 'ambad') => RETAILER_SETS[t];
export const villagesOf = (t: FsmTerritoryId = 'ambad') => [...new Set(DEALER_SETS[t].map((d) => d.village))];
export const DEALERS = DEALER_SETS.ambad;
export const RETAILERS = RETAILER_SETS.ambad;
export const OUTLET_VILLAGES = villagesOf('ambad');
export const TERRITORY_DISTRICT = 'Jalna';
export const territoryName = (t: FsmTerritoryId) => FSM_NAME[t];

export const outletSummary = (t: FsmTerritoryId = 'ambad') => {
  const dealers = dealersOf(t);
  const retailers = retailersOf(t);
  const lastYear = sum(dealers, (d) => d.lastYear);
  const proposed = sum(dealers, (d) => d.proposed);
  return {
    dealers: dealers.length,
    activeRetailers: retailers.filter((r) => r.active).length,
    inactiveRetailers: retailers.filter((r) => !r.active).length,
    villages: villagesOf(t).length,
    lastYear,
    proposed,
    growthPct: ratio(proposed - lastYear, lastYear),
  };
};

/** Target reconciliation for a set of proposed dealer targets (editable on the outlet planning screen). */
export const targetReconciliation = (proposed: number[] = DEALERS.map((d) => d.proposed), t: FsmTerritoryId = 'ambad') => {
  const assigned = territoryById(t)!.abp;
  const total = sum(proposed, (p) => p);
  return { assigned, proposed: total, unallocated: assigned - total, allocatedPct: ratio(total, assigned) };
};

// ---------------------------------------------------------------- crop plans
export interface CropPlanRow { crop: string; abp: number; proposed: number }

const CROP_PROPOSED: Record<FsmTerritoryId, number[]> = { ambad: [165, 110, 105], ghansawangi: [109, 86, 115], badnapur: [69, 56, 95] };
/** Crop plan per territory. Ambad's onion ABP is the Business Head figure; plan-linked uplift per crop is ABP − proposed. */
export const cropPlan = (t: FsmTerritoryId = 'ambad'): CropPlanRow[] => FSM_CROPS.map((crop, i) => ({
  crop,
  abp: t === 'ambad' && i === 0 ? AMBAD.onionAbp : CROP_SPLIT[t].abp[i],
  proposed: CROP_PROPOSED[t][i],
}));

/** Planning economics: 20 kg/acre at ₹100/kg, i.e. ₹2,000 per acre. */
export const FUNNEL_DEFAULTS = { reachPct: 70, trialPct: 45, adoptionPct: 60, kgPerAcre: 20, rupeesPerKg: 100, acresPerAdopter: 5 };
export const acresFor = (lakh: number) => Math.round((lakh * 100000) / (FUNNEL_DEFAULTS.kgPerAcre * FUNNEL_DEFAULTS.rupeesPerKg));
/** Coverage calculator rates. */
export const COVERAGE_RATES = { retentionPct: 80, newAcreConversionPct: 60 };

export interface VillageOnionPlan { village: string; lastYear: number; plan: number }
const ONION_SETS: Record<FsmTerritoryId, VillageOnionPlan[]> = {
  ambad: [
    { village: 'Wadi Gaon', lastYear: 13, plan: 18 },
    { village: 'Dhanora', lastYear: 10, plan: 15 },
    { village: 'Pimpalgaon', lastYear: 9, plan: 12 },
    { village: 'Kumbhephal', lastYear: 9, plan: 12 },
    { village: 'Shahagad', lastYear: 8, plan: 10 },
    { village: 'Rohilagad', lastYear: 7, plan: 10 },
    { village: 'Other villages', lastYear: 74, plan: 88 },
  ],
  ghansawangi: [
    { village: 'Ghansawangi HQ', lastYear: 30, plan: 33 },
    { village: 'Tirthpuri', lastYear: 26, plan: 29 },
    { village: 'Kumbhar Pimpalgaon', lastYear: 22, plan: 25 },
    { village: 'Rani Unchegaon', lastYear: 20, plan: 22 },
  ],
  badnapur: [
    { village: 'Badnapur HQ', lastYear: 20, plan: 22 },
    { village: 'Shelgaon', lastYear: 16, plan: 18 },
    { village: 'Rajewadi', lastYear: 14, plan: 16 },
    { village: 'Daregaon', lastYear: 12, plan: 13 },
  ],
};
export const onionPlanOf = (t: FsmTerritoryId = 'ambad') => ONION_SETS[t];
export const ONION_VILLAGE_PLAN = ONION_SETS.ambad;

/** Coverage and volume calculator for one village's onion plan (₹ L). */
export const coverageCalc = (v: VillageOnionPlan, plan = v.plan) => {
  const { kgPerAcre, rupeesPerKg } = FUNNEL_DEFAULTS;
  const volumeMt = (plan * 100000) / rupeesPerKg / 1000;
  const lastVolumeMt = (v.lastYear * 100000) / rupeesPerKg / 1000;
  const requiredAcres = Math.round((volumeMt * 1000) / kgPerAcre);
  const previousAcres = Math.round((lastVolumeMt * 1000) / kgPerAcre);
  const retainedAcres = Math.round((previousAcres * COVERAGE_RATES.retentionPct) / 100);
  const newAcres = Math.max(0, requiredAcres - retainedAcres);
  return { volumeMt, lastVolumeMt, requiredAcres, previousAcres, retainedAcres, newAcres, eligibleNewAcres: Math.round(newAcres / (COVERAGE_RATES.newAcreConversionPct / 100)), coverageGrowth: requiredAcres - previousAcres };
};

// ---------------------------------------------------------------- business priorities (My Campaigns)
export interface BusinessPriority {
  id: string; name: string; crop: string; villages: string[]; uplift: number | null;
  description: string; audience: string; approach: string; objective: string; campaignType: string; campaignName: string;
  /** Incremental sales (₹ L) under the conservative, base and optimistic scenarios. */
  scenarioSales: [number, number, number];
}
export const BUSINESS_PRIORITIES: BusinessPriority[] = [
  { id: 'onion-croptek', name: 'Onion · Croptek conversion', crop: 'Onion', villages: ['Dhanora', 'Wadi Gaon'], uplift: 25,
    description: 'Convert conventional nutrition users', audience: 'Conventional nutrition users', approach: 'Retailer-led + field demonstrations',
    objective: 'Convert conventional nutrition users', campaignType: 'Retailer-led conversion', campaignName: 'Ambad Onion Croptek conversion', scenarioSales: [8, 12, 16] },
  { id: 'maize-expansion', name: 'Maize · portfolio expansion', crop: 'Maize', villages: ['Ambad HQ', 'Pimpalgaon'], uplift: 15,
    description: 'Expand coverage at existing outlets', audience: 'Existing maize growers', approach: 'Field demonstrations + farmer meetings',
    objective: 'Expand coverage at existing outlets', campaignType: 'Field demonstration led', campaignName: 'Ambad Maize portfolio expansion', scenarioSales: [5, 7, 9] },
  { id: 'retailer-engagement', name: 'Retailer engagement', crop: 'All crops', villages: ['Dhanora', 'Wadi Gaon', 'Ambad HQ', 'Pimpalgaon', 'Kumbhephal'], uplift: null,
    description: 'Improve channel advocacy and reach', audience: 'Mapped retailers and their farmers', approach: 'Retailer activation sessions',
    objective: 'Improve channel advocacy and reach', campaignType: 'Retailer-led conversion', campaignName: 'Ambad retailer engagement', scenarioSales: [4, 6, 8] },
];
export const priorityById = (id: string) => BUSINESS_PRIORITIES.find((p) => p.id === id) ?? BUSINESS_PRIORITIES[0];

// ---------------------------------------------------------------- campaign: Ambad Onion Croptek conversion
export const FSM_CAMPAIGN = { id: 'ambad-onion-croptek', name: 'Ambad Onion Croptek conversion', territory: 'ambad' as FsmTerritoryId, crop: 'Onion', product: 'Croptek', villages: ['Dhanora', 'Wadi Gaon'] };

/** Farmers reached in the campaign villages. */
export const FARMERS_REACHED: Record<string, number> = { Dhanora: 280, 'Wadi Gaon': 360 };
/** Farmers in each village that a campaign can target (campaign villages are the reached figures above). */
export const VILLAGE_FARMERS: Record<string, number> = { ...FARMERS_REACHED, 'Ambad HQ': 300, Pimpalgaon: 240, Kumbhephal: 220 };
export const CAMPAIGN_VILLAGES = Object.keys(VILLAGE_FARMERS);

export interface CampaignActivity { id: string; name: string; units: number; unitLabel: string; cost: number }
export const CAMPAIGN_ACTIVITIES: CampaignActivity[] = [
  { id: 'demonstration', name: 'Field demonstrations', units: 4, unitLabel: 'units', cost: 1.0 },
  { id: 'retailer', name: 'Retailer activation', units: 3, unitLabel: 'sessions', cost: 0.75 },
  { id: 'meeting', name: 'Farmer meetings', units: 3, unitLabel: 'meetings', cost: 0.6 },
  { id: 'digital', name: 'Opt-in digital advisory', units: 1, unitLabel: 'wave', cost: 0.35 },
  { id: 'followup', name: 'Farmer follow-ups', units: 2, unitLabel: 'rounds', cost: 0.3 },
];

export const budgetMix = (acts: CampaignActivity[] = CAMPAIGN_ACTIVITIES) => {
  const total = Math.round(sum(acts, (a) => a.cost) * 100) / 100;
  return { total, rows: acts.map((a) => ({ ...a, sharePct: ratio(a.cost, total) })) };
};

export type ScenarioId = 'conservative' | 'base' | 'optimistic';
export const SCENARIOS: { id: ScenarioId; name: string; sales: number }[] = [
  { id: 'conservative', name: 'Conservative', sales: 8 },
  { id: 'base', name: 'Base', sales: 12 },
  { id: 'optimistic', name: 'Optimistic', sales: 16 },
];

/** Scenario outcome: volume at ₹100/kg, net ROI = (sales × 35% − budget) / budget (same rule as the Business Head). */
export const scenarioOutcome = (sales: number, budget = budgetMix().total) => ({
  sales,
  volumeMt: (sales * 100000) / FUNNEL_DEFAULTS.rupeesPerKg / 1000,
  contribution: sales * CONTRIBUTION_MARGIN,
  netRoi: netRoi(sales, budget),
});

/** Objective coverage: the onion priority's plan-linked uplift against a scenario's sales. */
export const objectiveCoverage = (sales: number, objective = BUSINESS_PRIORITIES[0].uplift!) => {
  return { objective, covered: sales, remaining: objective - sales, coveredPct: ratio(sales, objective) };
};

const round10 = (v: number) => Math.round(v / 10) * 10;
/** Planning funnel; each stage is rounded to the nearest 10 farmers (planning estimate). */
export const funnel = (a = FUNNEL_DEFAULTS, farmers = sum(Object.values(FARMERS_REACHED), (v) => v)) => {
  const reached = round10((farmers * a.reachPct) / 100);
  const trials = round10((reached * a.trialPct) / 100);
  const adopters = round10((trials * a.adoptionPct) / 100);
  const acres = adopters * a.acresPerAdopter;
  const kg = acres * a.kgPerAcre;
  return { farmers, reached, trials, adopters, acres, volumeMt: kg / 1000, sales: (kg * a.rupeesPerKg) / 100000 };
};

// ---------------------------------------------------------------- execution (13 activity units)
export type UnitStatus = 'on_track' | 'completed' | 'scheduled' | 'at_risk' | 'rescheduled' | 'escalated';
export interface ActivityUnit { id: string; activity: string; village: string; week: 1 | 2 | 3 | 4; owner: string; status: UnitStatus; issue?: string; campaign?: string; note?: string }

export const OWNERS = ['R. Jadhav', 'S. Pawar', 'M. Shinde', 'P. Kale'];

/** Activity opened from the control tower's exception list (first at-risk activity). */
export const AT_RISK_ACTIVITY = 'dhanora-field-demonstration';

export const ACTIVITY_UNITS: ActivityUnit[] = [
  { id: 'dhanora-demonstration-1', activity: 'demonstration', village: 'Dhanora', week: 1, owner: 'R. Jadhav', status: 'completed' },
  { id: 'wadi-demonstration-1', activity: 'demonstration', village: 'Wadi Gaon', week: 1, owner: 'R. Jadhav', status: 'completed' },
  { id: 'wadi-demonstration-2', activity: 'demonstration', village: 'Wadi Gaon', week: 2, owner: 'R. Jadhav', status: 'completed' },
  { id: AT_RISK_ACTIVITY, activity: 'demonstration', village: 'Dhanora', week: 3, owner: 'R. Jadhav', status: 'at_risk', issue: 'Stock confirmation pending' },
  { id: 'ambad-retailer-1', activity: 'retailer', village: 'Ambad HQ', week: 1, owner: 'S. Pawar', status: 'completed' },
  { id: 'dhanora-retailer-1', activity: 'retailer', village: 'Dhanora', week: 2, owner: 'S. Pawar', status: 'completed' },
  { id: 'wadi-retailer-1', activity: 'retailer', village: 'Wadi Gaon', week: 4, owner: 'S. Pawar', status: 'scheduled' },
  { id: 'dhanora-meeting-1', activity: 'meeting', village: 'Dhanora', week: 1, owner: 'M. Shinde', status: 'completed' },
  { id: 'wadi-meeting-1', activity: 'meeting', village: 'Wadi Gaon', week: 2, owner: 'M. Shinde', status: 'completed' },
  { id: 'wadi-gaon-farmer-meeting', activity: 'meeting', village: 'Wadi Gaon', week: 3, owner: 'M. Shinde', status: 'at_risk', issue: 'Participant mobilisation pending' },
  { id: 'digital-wave-1', activity: 'digital', village: 'Dhanora, Wadi Gaon', week: 2, owner: 'P. Kale', status: 'completed' },
  { id: 'dhanora-followup-1', activity: 'followup', village: 'Dhanora', week: 3, owner: 'P. Kale', status: 'completed' },
  { id: 'wadi-followup-1', activity: 'followup', village: 'Wadi Gaon', week: 4, owner: 'P. Kale', status: 'scheduled' },
];

export const executionCounts = (units: ActivityUnit[] = ACTIVITY_UNITS) => ({
  planned: units.length,
  completed: units.filter((u) => u.status === 'completed').length,
  scheduled: units.filter((u) => u.status === 'scheduled' || u.status === 'rescheduled').length,
  atRisk: units.filter((u) => u.status === 'at_risk').length,
});

/** Spend to date: cost of each completed unit (activity cost ÷ its units). */
export const spendToDate = (units: ActivityUnit[] = ACTIVITY_UNITS) =>
  sum(units.filter((u) => u.status === 'completed'), (u) => { const a = CAMPAIGN_ACTIVITIES.find((x) => x.id === u.activity)!; return a.cost / a.units; });

// ---------------------------------------------------------------- impact
export const impactSummary = () => {
  const forecast = scenarioOutcome(SCENARIOS[1].sales).sales;
  const tracked = AMBAD.campaignLinkedSales;
  const spend = spendToDate();
  const a = ambadMetrics();
  return { forecast, tracked, variance: forecast - tracked, spend, netRoiToDate: netRoi(tracked, spend), trials: a.trials, adopters: a.adopters, trialToAdoptionPct: a.trialToAdoptionPct, villageGap: a.villageGap };
};

// ---------------------------------------------------------------- campaign wizard
export const OBJECTIVES = ['Convert conventional nutrition users', 'Expand coverage at existing outlets', 'Improve channel advocacy and reach', 'Drive repeat purchase from trial users'];
export const AUDIENCES = ['Verified CRM cohort (eligible)', 'Last-year trial users', 'Mapped retailers and their farmers'];
export const CAMPAIGN_TYPES = ['Retailer-led conversion', 'Field demonstration led', 'Farmer meeting led', 'Digital advisory led'];
export const CHANNELS = ['Dhanora / Wadi Gaon', 'Retailer channel', 'Village meetings', 'Consent-based digital', 'Field follow-up'];
export const TIMINGS = ['Pre-activation', 'Crop-stage window', 'Follow-up support', 'Post-activity'];
/** Calendar phase for each timing. */
export const PHASE_OF: Record<string, 'Preparation' | 'Crop-stage window' | 'Follow-up'> = {
  'Pre-activation': 'Preparation', 'Crop-stage window': 'Crop-stage window', 'Follow-up support': 'Follow-up', 'Post-activity': 'Follow-up',
};
export const PHASES = ['Preparation', 'Crop-stage window', 'Follow-up'] as const;
/** Onion crop stage covered by each calendar phase. */
export const PHASE_CROP_STAGE: Record<(typeof PHASES)[number], string> = {
  Preparation: 'Before bulb initiation', 'Crop-stage window': 'Bulb initiation to early maturation', 'Follow-up': 'After early maturation',
};
/** Planned campaign weeks for each activity timing. */
export const TIMING_WEEKS: Record<string, [number, number]> = {
  'Pre-activation': [1, 2], 'Crop-stage window': [2, 3], 'Follow-up support': [3, 4], 'Post-activity': [3, 4],
};
/** Budget, share, window and owners per calendar phase, from the saved planner rows. Budgets sum to the planner total. */
export const phaseDetails = (acts: { cost: number; timing: string; owner: string }[]) => {
  const total = sum(acts, (a) => a.cost);
  return PHASES.map((phase) => {
    const mine = acts.filter((a) => PHASE_OF[a.timing] === phase);
    const budget = sum(mine, (a) => a.cost);
    const weeks = mine.flatMap((a) => TIMING_WEEKS[a.timing] ?? []);
    return {
      phase, cropStage: PHASE_CROP_STAGE[phase], budget, sharePct: ratio(budget, total),
      window: weeks.length ? [Math.min(...weeks), Math.max(...weeks)] as [number, number] : null,
      owners: [...new Set(mine.map((a) => a.owner).filter(Boolean))],
    };
  });
};

export interface WizardActivity extends CampaignActivity { type: string; channel: string; timing: string; owner: string }

/** Unit cost per activity type (₹ L); a planned activity's budget is units × unit cost. */
export const UNIT_COST: Record<string, number> = { demonstration: 0.25, retailer: 0.25, meeting: 0.2, digital: 0.35, followup: 0.15 };
export const ACTIVITY_TYPES = CAMPAIGN_ACTIVITIES.map((a) => ({ id: a.id, name: a.name, unitLabel: a.unitLabel, unitCost: UNIT_COST[a.id] }));
const round2 = (v: number) => Math.round(v * 100) / 100;
/** A planned activity row of a given type; budget = units × unit cost. */
export const planActivity = (rowId: string, type: string, units: number, rest: { channel: string; timing: string; owner: string }): WizardActivity => {
  const t = ACTIVITY_TYPES.find((x) => x.id === type) ?? ACTIVITY_TYPES[0];
  return { id: rowId, type: t.id, name: t.name, unitLabel: t.unitLabel, units, cost: round2(units * t.unitCost), channel: rest.channel, timing: rest.timing, owner: rest.owner };
};
export interface WizardState {
  priority: string;
  name: string;
  objective: string;
  villages: string[];
  retailers: string[];
  audience: string;
  campaignType: string;
  activities: WizardActivity[];
  scenario: ScenarioId;
  assumptions: typeof FUNNEL_DEFAULTS;
  rationale: string;
  attachment: string;
  /** Furthest wizard step reached (0–3). */
  maxStep: number;
  readinessResolved: boolean;
}

export const ACTIVITY_DEFAULTS: Record<string, { channel: string; timing: string; owner: string }> = {
  demonstration: { channel: 'Dhanora / Wadi Gaon', timing: 'Crop-stage window', owner: 'R. Jadhav' },
  retailer: { channel: 'Retailer channel', timing: 'Pre-activation', owner: 'S. Pawar' },
  meeting: { channel: 'Village meetings', timing: 'Crop-stage window', owner: 'M. Shinde' },
  digital: { channel: 'Consent-based digital', timing: 'Follow-up support', owner: 'P. Kale' },
  followup: { channel: 'Field follow-up', timing: 'Post-activity', owner: 'P. Kale' },
};

/** Wizard entries prefilled from a business priority. Linked retailers: the first three active retailers in its villages. */
export const defaultWizard = (priorityId: string): WizardState => {
  const p = priorityById(priorityId);
  return {
    priority: p.id,
    name: p.campaignName,
    objective: p.objective,
    villages: p.villages.filter((v) => CAMPAIGN_VILLAGES.includes(v)),
    retailers: RETAILERS.filter((r) => r.active && p.villages.includes(r.village)).slice(0, 3).map((r) => r.id),
    audience: AUDIENCES[0],
    campaignType: p.campaignType,
    activities: CAMPAIGN_ACTIVITIES.map((a) => planActivity(a.id, a.id, Math.round(a.cost / UNIT_COST[a.id]), ACTIVITY_DEFAULTS[a.id])),
    scenario: 'base',
    assumptions: { ...FUNNEL_DEFAULTS },
    rationale: '',
    attachment: '',
    maxStep: 0,
    readinessResolved: false,
  };
};

/** Scenario outcomes for a wizard: the priority's scenario sales against the wizard's activity budget. */
export const wizardScenarios = (w: WizardState) => {
  const p = priorityById(w.priority);
  const budget = budgetMix(w.activities).total;
  return SCENARIOS.map((s, i) => ({ ...s, ...scenarioOutcome(p.scenarioSales[i], budget), budget }));
};

/** Required-field check for the objective step; returns the fields still missing. */
export const objectiveErrors = (w: WizardState) => {
  const e: Record<string, string> = {};
  if (!w.name.trim()) e.name = 'Enter a campaign name';
  if (!w.objective) e.objective = 'Choose an objective';
  if (w.villages.length === 0) e.villages = 'Select at least one village';
  if (w.retailers.length === 0) e.retailers = 'Link at least one retailer';
  if (!w.audience) e.audience = 'Choose the target audience';
  if (!w.campaignType) e.campaignType = 'Choose a campaign type';
  return e;
};

/** Activity step check: every activity needs a name, units, an owner and a budget. */
export const activityErrors = (w: WizardState) => {
  const e: Record<string, string> = {};
  if (w.activities.length === 0) e.list = 'Add at least one activity';
  w.activities.forEach((a) => {
    if (!a.name.trim() || a.units <= 0 || a.cost <= 0 || !a.owner) e[a.id] = 'Name, units, owner and budget are required';
  });
  return e;
};

// ---------------------------------------------------------------- execution detail, impact and diagnostics
export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = { on_track: 'On track', completed: 'Completed', scheduled: 'Scheduled', at_risk: 'At risk', rescheduled: 'Rescheduled', escalated: 'Escalated' };
export const activityName = (id: string) => CAMPAIGN_ACTIVITIES.find((a) => a.id === id)?.name ?? id;

export interface UnitOverride { status: UnitStatus; owner?: string; date?: string; reason?: string; notes?: string; action?: string }
/** Activity units with corrective-action overrides applied. */
export const unitsWith = (overrides: Record<string, UnitOverride> = {}): ActivityUnit[] =>
  ACTIVITY_UNITS.map((u) => (overrides[u.id] ? { ...u, status: overrides[u.id].status, owner: overrides[u.id].owner ?? u.owner } : u));

export const CORRECTIVE_ACTIONS = ['Request stock confirmation', 'Propose reschedule', 'Reassign owner', 'Escalate issue'];
export const ACTION_REASONS = ['Stock confirmation pending', 'Participant mobilisation pending', 'Owner unavailable', 'Weather or field conditions', 'Retailer support pending'];
/** Status an at-risk unit takes after a corrective action. */
export const statusAfter = (action: string): UnitStatus => (action === 'Escalate issue' ? 'escalated' : 'rescheduled');

/** Execution readiness checklist for each activity type. */
export const READINESS: Record<string, { item: string; sub: string; status: string }[]> = {
  demonstration: [
    { item: 'Stock confirmation', sub: 'Product available for the demonstration', status: 'Pending' },
    { item: 'Retailer coordination', sub: 'Retailer support for venue and logistics', status: 'To verify' },
    { item: 'Venue readiness', sub: 'Demonstration plot prepared', status: 'To verify' },
    { item: 'Farmer mobilisation', sub: 'Participants informed of the schedule', status: 'To verify' },
  ],
  meeting: [
    { item: 'Participant mobilisation', sub: 'Target farmers confirmed', status: 'Pending' },
    { item: 'Venue readiness', sub: 'Meeting place booked', status: 'To verify' },
    { item: 'Content readiness', sub: 'Approved advisory material', status: 'To verify' },
  ],
  default: [
    { item: 'Owner confirmation', sub: 'Assigned owner confirmed', status: 'To verify' },
    { item: 'Content readiness', sub: 'Approved material', status: 'To verify' },
  ],
};

/** Campaign-linked sales tracked per village (₹ L); sums to the Business Head Ambad campaign-linked sales. */
export const VILLAGE_LINKED_SALES: Record<string, number> = { Dhanora: 2.1, 'Wadi Gaon': 3.3 };
/** Farmers reached per completed unit, by activity. */
export const REACH_PER_UNIT: Record<string, number> = { demonstration: 60, retailer: 25, meeting: 80, digital: 420, followup: 49 };

/** Village performance: Business Head village trials / adopters with campaign reach, units and tracked sales. */
export const villagePerformance = (units: ActivityUnit[] = ACTIVITY_UNITS) => AMBAD.villages.map((v) => {
  const mine = units.filter((u) => u.village.split(', ').includes(v.name));
  return {
    name: v.name,
    campaign: FSM_CAMPAIGN.villages.includes(v.name),
    farmers: FARMERS_REACHED[v.name] ?? null,
    trials: v.trials,
    adopters: v.adopters,
    conversionPct: ratio(v.adopters, v.trials),
    planned: mine.length,
    completed: mine.filter((u) => u.status === 'completed').length,
    atRisk: mine.filter((u) => u.status === 'at_risk'),
    sales: VILLAGE_LINKED_SALES[v.name] ?? 0,
  };
});

/** Funnel for the campaign villages (Dhanora, Wadi Gaon). */
export const campaignFunnel = () => {
  const rows = villagePerformance().filter((v) => v.campaign);
  const reached = sum(rows, (v) => v.farmers ?? 0);
  const trials = sum(rows, (v) => v.trials);
  const adopters = sum(rows, (v) => v.adopters);
  return { reached, trials, adopters, reachToTrialPct: ratio(trials, reached), trialToAdoptionPct: ratio(adopters, trials) };
};

/** Intervention effectiveness per activity: completion, reach and spend. */
export const interventionEffectiveness = (units: ActivityUnit[] = ACTIVITY_UNITS) => CAMPAIGN_ACTIVITIES.map((a) => {
  const mine = units.filter((u) => u.activity === a.id);
  const completed = mine.filter((u) => u.status === 'completed').length;
  return {
    id: a.id, name: a.name, planned: mine.length, completed,
    atRisk: mine.filter((u) => u.status === 'at_risk').length,
    reach: completed * REACH_PER_UNIT[a.id],
    budget: a.cost,
    spend: (a.cost / a.units) * completed,
  };
});

// ---------------------------------------------------------------- coverage & volume calculator (editable)
export interface CoverageInputs { rate: number; volume: number; prev: number; retention: number; conversion: number }
export const COVERAGE_LIMITS: Record<keyof CoverageInputs, { min: number; max?: number; step: number; unit: string; label: string }> = {
  rate: { min: 1, step: 1, unit: 'kg/acre', label: 'Assumed seasonal rate' },
  volume: { min: 0.1, step: 0.5, unit: 'MT', label: 'Target volume' },
  prev: { min: 0, step: 10, unit: 'acres', label: 'Previous covered acres' },
  retention: { min: 0, max: 100, step: 1, unit: '%', label: 'Historical retention' },
  conversion: { min: 1, max: 100, step: 1, unit: '%', label: 'Expected new-acre conversion' },
};
/** Calculator defaults for a village: its plan volume and previous acres, the standard rate, retention and conversion. */
export const coverageDefaults = (v: VillageOnionPlan): CoverageInputs => {
  const c = coverageCalc(v);
  return { rate: FUNNEL_DEFAULTS.kgPerAcre, volume: c.volumeMt, prev: c.previousAcres, retention: COVERAGE_RATES.retentionPct, conversion: COVERAGE_RATES.newAcreConversionPct };
};
/** Required = volume × 1000 ÷ rate; retained = previous × retention; new = max(0, required − retained); eligible = ⌈new ÷ conversion⌉. */
export const coverageResult = (i: CoverageInputs) => {
  const required = (i.volume * 1000) / i.rate;
  const retained = (i.prev * i.retention) / 100;
  const newAcres = Math.max(0, required - retained);
  const eligible = newAcres > 0 ? Math.ceil(newAcres / (i.conversion / 100) - 1e-9) : 0;
  return { required, retained, newAcres, eligible, growth: required - i.prev };
};
/** Validation message per field ('' when valid). */
export const coverageError = (k: keyof CoverageInputs, raw: string) => {
  const lim = COVERAGE_LIMITS[k];
  if (raw.trim() === '' || !Number.isFinite(Number(raw))) return 'Enter a number';
  const v = Number(raw);
  if (v < lim.min) return `Minimum ${lim.min}`;
  if (lim.max !== undefined && v > lim.max) return `Maximum ${lim.max}`;
  return '';
};

// ---------------------------------------------------------------- activity units in the other Ambad campaigns
/** Campaigns running in the other Ambad villages (they do not change the Croptek campaign figures). */
export const OTHER_CAMPAIGNS: { name: string; villages: string[] }[] = [
  { name: 'Ambad Maize portfolio expansion', villages: ['Ambad HQ', 'Pimpalgaon'] },
  { name: 'Ambad retailer engagement', villages: ['Kumbhephal', 'Shahagad', 'Rohilagad'] },
];
export const villageId = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const OTHER_BLOCKERS: Record<string, string> = {
  'pimpalgaon-demonstration': 'Demonstration plot not yet confirmed by the host farmer',
  'shahagad-retailer': 'Retailer stock of Croptek not replenished',
};
const OTHER_SCHEDULED = ['rohilagad-followup'];

/** One unit per activity type in each village of the other campaigns: mostly on track or completed, two at risk, one scheduled. */
export const OTHER_UNITS: ActivityUnit[] = OTHER_CAMPAIGNS.flatMap((c, ci) => c.villages.flatMap((v, vi) => CAMPAIGN_ACTIVITIES.map((a, ti) => {
  const id = `${villageId(v)}-${a.id}`;
  const week = (((ci * 2 + vi + ti + 1) % 4) + 1) as 1 | 2 | 3 | 4;
  const status: UnitStatus = OTHER_BLOCKERS[id] ? 'at_risk' : OTHER_SCHEDULED.includes(id) ? 'scheduled' : week <= 2 ? 'completed' : 'on_track';
  return {
    id, activity: a.id, village: v, week, owner: OWNERS[(ci + vi + ti + 1) % OWNERS.length], status, campaign: c.name,
    issue: OTHER_BLOCKERS[id],
    note: status === 'completed' ? 'Completed with field evidence' : status === 'scheduled' ? `Scheduled for week ${week}` : status === 'on_track' ? 'Inputs and participants confirmed' : undefined,
  };
})));

/** Every Ambad activity unit (Croptek campaign first), with corrective-action overrides applied. */
export const allUnitsWith = (overrides: Record<string, UnitOverride> = {}): ActivityUnit[] => [
  ...unitsWith(overrides).map((u) => ({ ...u, campaign: FSM_CAMPAIGN.name, note: u.note ?? (u.status === 'completed' ? 'Completed with field evidence' : u.status === 'scheduled' ? `Scheduled for week ${u.week}` : undefined) })),
  ...OTHER_UNITS.map((u) => (overrides[u.id] ? { ...u, status: overrides[u.id].status, owner: overrides[u.id].owner ?? u.owner } : u)),
];

/** Villages (grouped by campaign) with a unit of the given activity type; prefers the current unit, then an at-risk one. */
export const villageChoices = (units: ActivityUnit[], activity: string, current: ActivityUnit) => {
  const groups: { campaign: string; options: { village: string; unit: ActivityUnit }[] }[] = [];
  for (const u of units.filter((x) => x.activity === activity)) {
    for (const v of u.village.split(', ')) {
      let g = groups.find((x) => x.campaign === u.campaign);
      if (!g) { g = { campaign: u.campaign!, options: [] }; groups.push(g); }
      const existing = g.options.find((o) => o.village === v);
      const better = (x: ActivityUnit) => (x.id === current.id ? 2 : x.status === 'at_risk' ? 1 : 0);
      if (!existing) g.options.push({ village: v, unit: u });
      else if (better(u) > better(existing.unit)) existing.unit = u;
    }
  }
  return groups;
};

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

// ---------------------------------------------------------------- Ambad outlet network
export type MappingStatus = 'Mapped' | 'Pending verification';

export interface Dealer { id: string; name: string; village: string; lastYear: number; proposed: number; activeRetailers: number; inactiveRetailers: number }
export interface Retailer { id: string; name: string; dealerId: string; village: string; active: boolean; mapping: MappingStatus; secondaryDemand: number }

export const DEALERS: Dealer[] = [
  { id: 'dhanora-agro', name: 'Dhanora Agro Inputs', village: 'Dhanora', lastYear: 48, proposed: 55, activeRetailers: 11, inactiveRetailers: 1 },
  { id: 'ambad-depot', name: 'Ambad Crop Depot', village: 'Ambad HQ', lastYear: 36, proposed: 43, activeRetailers: 10, inactiveRetailers: 1 },
  { id: 'wadi-krishi', name: 'Wadi Gaon Krishi Kendra', village: 'Wadi Gaon', lastYear: 46, proposed: 54, activeRetailers: 10, inactiveRetailers: 1 },
  { id: 'ganesh-fert', name: 'Shree Ganesh Fertilisers', village: 'Ambad HQ', lastYear: 44, proposed: 52, activeRetailers: 9, inactiveRetailers: 1 },
  { id: 'pimpalgaon-agro', name: 'Pimpalgaon Agro Services', village: 'Pimpalgaon', lastYear: 40, proposed: 47, activeRetailers: 9, inactiveRetailers: 0 },
  { id: 'kumbhephal-seva', name: 'Kumbhephal Kisan Seva', village: 'Kumbhephal', lastYear: 38, proposed: 45, activeRetailers: 9, inactiveRetailers: 1 },
  { id: 'jai-kisan', name: 'Jai Kisan Traders', village: 'Ambad HQ', lastYear: 36, proposed: 43, activeRetailers: 8, inactiveRetailers: 0 },
  { id: 'matoshree-agro', name: 'Matoshree Agro Agencies', village: 'Dhanora', lastYear: 32, proposed: 41, activeRetailers: 8, inactiveRetailers: 1 },
];

export const OUTLET_VILLAGES = [...new Set(DEALERS.map((d) => d.village))];

const SHOP = ['Krishi Seva Kendra', 'Agro Centre', 'Kisan Traders', 'Fertiliser Stores', 'Agri Mart', 'Shetkari Seva', 'Beej Bhandar', 'Agro Agencies', 'Krushi Udyog', 'Kisan Kendra', 'Agri Point', 'Shivam Agro'];
const PREFIX = ['Balaji', 'Saraswati', 'Mauli', 'Om Sai', 'Shivneri', 'Datta', 'Ganga', 'Vitthal', 'Samarth', 'Laxmi', 'Jay Bhavani', 'Renuka'];

/**
 * Retailers mapped under each dealer. Indicative secondary demand: 80% of the dealer's proposed target, spread across
 * its active retailers (inactive retailers carry none until reactivated and verified).
 */
export const RETAILERS: Retailer[] = DEALERS.flatMap((d, di) => {
  const n = d.activeRetailers + d.inactiveRetailers;
  const each = Math.round(((d.proposed * 0.8) / d.activeRetailers) * 10) / 10;
  return Array.from({ length: n }, (_, i) => {
    const active = i < d.activeRetailers;
    return {
      id: `${d.id}-r${i + 1}`,
      name: `${PREFIX[(di * 5 + i) % PREFIX.length]} ${SHOP[(di * 7 + i) % SHOP.length]}`,
      dealerId: d.id,
      village: d.village,
      active,
      mapping: active ? 'Mapped' : 'Pending verification',
      secondaryDemand: active ? each : 0,
    } satisfies Retailer;
  });
});

export const outletSummary = () => {
  const lastYear = sum(DEALERS, (d) => d.lastYear);
  const proposed = sum(DEALERS, (d) => d.proposed);
  return {
    dealers: DEALERS.length,
    activeRetailers: RETAILERS.filter((r) => r.active).length,
    inactiveRetailers: RETAILERS.filter((r) => !r.active).length,
    villages: OUTLET_VILLAGES.length,
    lastYear,
    proposed,
    growthPct: ratio(proposed - lastYear, lastYear),
  };
};

/** Target reconciliation for a set of proposed dealer targets (editable on the outlet planning screen). */
export const targetReconciliation = (proposed: number[] = DEALERS.map((d) => d.proposed)) => {
  const assigned = territoryById('ambad')!.abp;
  const total = sum(proposed, (p) => p);
  return { assigned, proposed: total, unallocated: assigned - total, allocatedPct: ratio(total, assigned) };
};

// ---------------------------------------------------------------- Ambad crop plan
export interface CropPlanRow { crop: string; abp: number; proposed: number }

/** Onion ABP is the Business Head Ambad onion ABP; the plan-linked uplift per crop is ABP − proposed. */
export const cropPlan = (): CropPlanRow[] => [
  { crop: 'Onion', abp: AMBAD.onionAbp, proposed: 165 },
  { crop: 'Maize', abp: 125, proposed: 110 },
  { crop: 'Other crops', abp: 105, proposed: 105 },
];

/** Planning economics: 20 kg/acre at ₹100/kg, i.e. ₹2,000 per acre. */
export const FUNNEL_DEFAULTS = { reachPct: 70, trialPct: 45, adoptionPct: 60, kgPerAcre: 20, rupeesPerKg: 100, acresPerAdopter: 5 };
export const acresFor = (lakh: number) => Math.round((lakh * 100000) / (FUNNEL_DEFAULTS.kgPerAcre * FUNNEL_DEFAULTS.rupeesPerKg));

export interface VillageOnionPlan { village: string; lastYear: number; plan: number }
export const ONION_VILLAGE_PLAN: VillageOnionPlan[] = [
  { village: 'Wadi Gaon', lastYear: 13, plan: 18 },
  { village: 'Dhanora', lastYear: 10, plan: 15 },
  { village: 'Pimpalgaon', lastYear: 9, plan: 12 },
  { village: 'Kumbhephal', lastYear: 9, plan: 12 },
  { village: 'Shahagad', lastYear: 8, plan: 10 },
  { village: 'Rohilagad', lastYear: 7, plan: 10 },
  { village: 'Other villages', lastYear: 74, plan: 88 },
];

// ---------------------------------------------------------------- business priorities (My Campaigns)
export interface BusinessPriority { id: string; name: string; crop: string; villages: string[]; uplift: number | null }
export const BUSINESS_PRIORITIES: BusinessPriority[] = [
  { id: 'onion-croptek', name: 'Onion — Croptek conversion', crop: 'Onion', villages: ['Dhanora', 'Wadi Gaon'], uplift: 25 },
  { id: 'maize-expansion', name: 'Maize — portfolio expansion', crop: 'Maize', villages: ['Ambad HQ', 'Pimpalgaon'], uplift: 15 },
  { id: 'retailer-engagement', name: 'Retailer engagement', crop: 'All crops', villages: ['Across Ambad'], uplift: null },
];

// ---------------------------------------------------------------- campaign: Ambad Onion Croptek conversion
export const FSM_CAMPAIGN = { id: 'ambad-onion-croptek', name: 'Ambad Onion Croptek conversion', territory: 'ambad' as FsmTerritoryId, crop: 'Onion', product: 'Croptek', villages: ['Dhanora', 'Wadi Gaon'] };

/** Farmers reached in the campaign villages. */
export const FARMERS_REACHED: Record<string, number> = { Dhanora: 280, 'Wadi Gaon': 360 };

export interface CampaignActivity { id: string; name: string; units: number; unitLabel: string; cost: number }
export const CAMPAIGN_ACTIVITIES: CampaignActivity[] = [
  { id: 'demonstration', name: 'Field demonstrations', units: 4, unitLabel: 'units', cost: 1.05 },
  { id: 'retailer', name: 'Retailer activation', units: 3, unitLabel: 'sessions', cost: 0.75 },
  { id: 'meeting', name: 'Farmer meetings', units: 3, unitLabel: 'meetings', cost: 0.6 },
  { id: 'digital', name: 'Opt-in digital advisory', units: 1, unitLabel: 'wave', cost: 0.3 },
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
export const objectiveCoverage = (sales: number) => {
  const objective = BUSINESS_PRIORITIES[0].uplift!;
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
export type UnitStatus = 'completed' | 'scheduled' | 'at_risk' | 'rescheduled' | 'escalated';
export interface ActivityUnit { id: string; activity: string; village: string; week: 1 | 2 | 3 | 4; owner: string; status: UnitStatus; issue?: string }

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

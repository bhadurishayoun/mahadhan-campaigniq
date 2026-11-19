/**
 * Field Sales Manager planning figures for Ambad, Jalna Cluster, FY 2025-26.
 * Every number comes from the approved V2 mockup specs and is kept in one place so all 15 screens reconcile:
 *   territories 8.0 -> 10.0 Cr | dealers 320 L -> 380 L of ABP 420 L | onion villages 165 L
 *   approved plan v3: Onion 190 L + Maize 125 L + Other 105 L = 420 L | campaign 13 activities, Rs 3.00 L
 * No figure is Mahadhan actual data.
 */

export const TERRITORIES = [
  { name: 'Ambad', ly: 3.2, abp: 4.2 },
  { name: 'Ghansawangi', ly: 2.8, abp: 3.4 },
  { name: 'Badnapur', ly: 2.0, abp: 2.4 },
];
export const TOTAL_LY = 8.0;
export const TOTAL_ABP = 10.0;

export const ACHIEVEMENT = [
  { label: 'Incentive achievement (FY 2024–25)', value: '92%', note: 'of incentive target earned' },
  { label: 'Campaign ROI (FY 2024–25)', value: '1.60×', note: 'contribution ÷ campaign spend,' },
  { label: 'Historical target attainment', value: '94%', note: '3-year average vs ABP' },
];

/** Ambad network: 8 dealers, 74 active retailers. */
export const VILLAGES = [
  { name: 'Dhanora', dealers: 1, retailers: 12 },
  { name: 'Wadi Gaon', dealers: 1, retailers: 14 },
  { name: 'Ambad HQ', dealers: 3, retailers: 22 },
  { name: 'Pimpalgaon', dealers: 1, retailers: 10 },
  { name: 'Other villages', dealers: 2, retailers: 16 },
];

export interface Outlet { name: string; type: 'Dealer' | 'Retailer'; dealer: string; village: string; prev: string; status: string }

/** Outlets per village for the TM.2 explorer. Retailer values are secondary sales and never added to dealer primary. */
export const OUTLETS: Record<string, Outlet[]> = {
  Dhanora: [
    { name: 'Dhanora Agro Inputs', type: 'Dealer', dealer: '—', village: 'Dhanora', prev: '₹48.00 L primary', status: 'Active' },
    { name: 'Dhanora Krushi Seva Kendra', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹6.20 L secondary (est.)', status: 'Active' },
    { name: 'Ganesh Agro Point', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹4.80 L secondary (est.)', status: 'Active' },
    { name: 'Shetkari Agro Mart', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹3.90 L secondary (est.)', status: 'Active' },
    { name: 'Kisan Seva Kendra', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: 'No sales data', status: 'Inactive' },
    { name: 'Sai Krushi Bhandar', type: 'Retailer', dealer: 'Not mapped', village: 'Dhanora', prev: 'No sales data', status: 'Mapping missing' },
  ],
  'Wadi Gaon': [
    { name: 'Shiv Krushi Kendra', type: 'Dealer', dealer: '—', village: 'Wadi Gaon', prev: '₹42.00 L primary', status: 'Active' },
    { name: 'Wadi Gaon Kisan Point', type: 'Retailer', dealer: 'Shiv Krushi Kendra', village: 'Wadi Gaon', prev: '₹5.60 L secondary (est.)', status: 'Active' },
    { name: 'Om Agro Services', type: 'Retailer', dealer: 'Shiv Krushi Kendra', village: 'Wadi Gaon', prev: '₹4.10 L secondary (est.)', status: 'Active' },
    { name: 'Jai Bhavani Agro', type: 'Retailer', dealer: 'Not mapped', village: 'Wadi Gaon', prev: 'No sales data', status: 'Mapping missing' },
  ],
  'Ambad HQ': [
    { name: 'Ambad Crop Depot', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹36.00 L primary', status: 'Active' },
    { name: 'Om Sai Fertilisers', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹40.00 L primary', status: 'Active' },
    { name: 'Samarth Agro Agencies', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹35.00 L primary', status: 'Active' },
    { name: 'Ambad Market Agro', type: 'Retailer', dealer: 'Ambad Crop Depot', village: 'Ambad HQ', prev: '₹7.40 L secondary (est.)', status: 'Active' },
  ],
  Pimpalgaon: [
    { name: 'Mahalaxmi Agro Agencies', type: 'Dealer', dealer: '—', village: 'Pimpalgaon', prev: '₹45.00 L primary', status: 'Active' },
    { name: 'Pimpalgaon Agri Stores', type: 'Retailer', dealer: 'Mahalaxmi Agro Agencies', village: 'Pimpalgaon', prev: 'No sales data', status: 'Verification pending' },
  ],
  'Other villages': [
    { name: 'Jai Kisan Traders', type: 'Dealer', dealer: '—', village: 'Other villages', prev: '₹38.00 L primary', status: 'Active' },
    { name: 'Annapurna Krushi Bhandar', type: 'Dealer', dealer: '—', village: 'Other villages', prev: '₹36.00 L primary', status: 'Active' },
  ],
};

export interface DealerPlan { name: string; village: string; ly: number; target: number; status: string; retailers?: { name: string; secondary: string }[]; group?: string[] }

/** TM.3 dealer plan in Rs lakh: 320 -> 380. */
export const DEALER_PLAN: DealerPlan[] = [
  { name: 'Dhanora Agro Inputs', village: 'Dhanora', ly: 48, target: 55, status: 'Draft', retailers: [
    { name: 'Dhanora Krushi Seva Kendra', secondary: '₹7.00 L demand (est.)' },
    { name: 'Ganesh Agro Point', secondary: '₹5.50 L demand (est.)' },
    { name: 'Shetkari Agro Mart', secondary: '₹4.40 L demand (est.)' },
    { name: 'Kisan Seva Kendra', secondary: 'Not estimated — inactive' },
  ] },
  { name: 'Ambad Crop Depot', village: 'Ambad HQ', ly: 36, target: 43, status: 'Draft' },
  { name: 'Shiv Krushi Kendra', village: 'Wadi Gaon', ly: 42, target: 50, status: 'Review potential' },
  { name: 'Mahalaxmi Agro Agencies', village: 'Pimpalgaon', ly: 45, target: 53, status: 'Draft' },
  { name: 'Other 4 dealers', village: 'Ambad HQ · Other villages', ly: 149, target: 179, status: 'Draft',
    group: ['Om Sai Fertilisers ₹40.00 L → ₹48.00 L', 'Jai Kisan Traders ₹38.00 L → ₹45.00 L', 'Annapurna Krushi Bhandar ₹36.00 L → ₹43.00 L', 'Samarth Agro Agencies ₹35.00 L → ₹43.00 L'] },
];
export const ABP_LAKH = 420;

/** TM.4 onion village plan (Rs lakh). Only Dhanora has verified history; the rest show "View records". */
export const ONION_VILLAGES = [
  { village: 'Dhanora', lyRev: 10, lyMt: 10, prevAcres: 500, tgtRev: 12, tgtMt: 15, verified: true },
  { village: 'Wadi Gaon', tgtRev: 28 },
  { village: 'Ambad HQ', tgtRev: 42 },
  { village: 'Pimpalgaon', tgtRev: 23 },
  { village: 'Other villages', tgtRev: 60 },
] as { village: string; lyRev?: number; lyMt?: number; prevAcres?: number; tgtRev: number; tgtMt?: number; verified?: boolean }[];
export const PLANNED_REALISATION = 80; // Rs/kg (vs 100 last year)
export const PREVIOUS_REALISATION = 100;
export const ELIGIBLE_ACRES_DHANORA = 1800;

export const CROP_PLAN = [
  { crop: 'Onion', value: 1.65 },
  { crop: 'Maize', value: 1.10 },
  { crop: 'Other crops', value: 1.05 },
];

/** Approved plan v3 (after reconciliation) used from TM.C1 onwards. */
export const APPROVED = { abp: 4.2, growth: 1.0, onion: 1.9, maize: 1.25, other: 1.05 };

export const PRIORITIES = [
  { id: 'onion', title: 'Onion — Croptek conversion', sub: 'Convert Non Saarthi nutrition users', geo: 'Dhanora · Wadi Gaon', uplift: '₹25.00 L', upliftL: 25, villages: ['Dhanora', 'Wadi Gaon'],
    audience: 'Non Saarthi nutrition users', approach: 'Retailer-led + field demos', coverage: 'Dhanora & Wadi Gaon' },
  { id: 'maize', title: 'Maize — Portfolio expansion', sub: 'Expand coverage at existing outlets', geo: 'Ambad HQ · Pimpalgaon', uplift: '₹15.00 L', upliftL: 15, villages: ['Ambad HQ', 'Pimpalgaon'],
    audience: 'Existing maize growers at linked outlets', approach: 'Outlet activation + farmer meetings', coverage: 'Ambad HQ & Pimpalgaon' },
  { id: 'retail', title: 'Retailer engagement', sub: 'Improve channel advocacy and reach', geo: 'Across Ambad', uplift: 'Supports existing plan', upliftL: 0, villages: VILLAGES.map((v) => v.name),
    audience: 'Linked retailers (74)', approach: 'Retailer education programme', coverage: 'All Ambad villages' },
];

export type Priority = (typeof PRIORITIES)[number];
/** Plan-linked uplift across all growth priorities (₹ L) - already inside the approved ABP. */
export const planLinkedUplift = PRIORITIES.reduce((s, p) => s + p.upliftL, 0);
export const TOTAL_RETAILERS = VILLAGES.reduce((s, v) => s + v.retailers, 0);
/** Linked retailers in a priority's focus villages. */
export const linkedRetailers = (p: Priority) => VILLAGES.filter((v) => p.villages.includes(v.name)).reduce((s, v) => s + v.retailers, 0);
/** Last-year campaign ROI (×), read from the FY 2024–25 achievement data. */
export const lastYearRoi = parseFloat(ACHIEVEMENT.find((a) => /campaign roi/i.test(a.label))?.value ?? '0');

export const CAMPAIGN = { name: 'Ambad Onion Croptek Conversion', villages: 'Dhanora · Wadi Gaon', objective: 25, budget: 3.0 };

export const CAMPAIGN_RETAILERS = ['Dhanora Krushi Seva Kendra', 'Ganesh Agro Point', 'Wadi Gaon Kisan Point', 'Shetkari Agro Mart', 'Om Agro Services'];
export const SELECTED_RETAILERS = ['Dhanora Krushi Seva Kendra', 'Ganesh Agro Point', 'Wadi Gaon Kisan Point'];

export interface ActivityLine { activity: string; units: number; unitLabel: string; where: string; timing: string; owner: string; budget: number }

/** CW.2 activity planner (budget in Rs lakh): total 3.00. */
export const ACTIVITIES: ActivityLine[] = [
  { activity: 'Field Demonstrations', units: 4, unitLabel: 'units', where: 'Dhanora 2 · Wadi Gaon 2', timing: 'Before bulb initiation (indicative)', owner: 'R. Jadhav', budget: 1.05 },
  { activity: 'Retailer Activation', units: 3, unitLabel: 'sessions', where: '3 linked retailers', timing: 'Preparation window', owner: 'S. Patil', budget: 0.75 },
  { activity: 'Farmer Meetings', units: 3, unitLabel: 'meetings', where: 'Dhanora · Wadi Gaon', timing: 'Stage window', owner: 'Owner pending', budget: 0.60 },
  { activity: 'Opt-in Digital Advisory', units: 1, unitLabel: 'wave', where: 'Consenting farmers', timing: 'Stage window', owner: 'Owner pending', budget: 0.30 },
  { activity: 'Farmer Follow-ups', units: 2, unitLabel: 'rounds', where: 'Dhanora · Wadi Gaon', timing: 'After demonstrations', owner: 'P. Kale', budget: 0.30 },
];

export type UnitState = 'done' | 'scheduled' | 'risk';
export interface GanttUnit { week: number; village: string; state: UnitState; note?: string }

/** TM.EX1 calendar: 13 units = 3 done + 8 scheduled + 2 at risk. */
const AMBAD_ACTIVITIES: { activity: string; owner: string; units: GanttUnit[] }[] = [
  { activity: 'Field Demonstrations', owner: 'R. Jadhav', units: [
    { week: 1, village: 'Wadi Gaon', state: 'done' },
    { week: 2, village: 'Dhanora', state: 'risk', note: 'Stock confirmation pending' },
    { week: 3, village: 'Wadi Gaon', state: 'scheduled' },
    { week: 4, village: 'Dhanora', state: 'scheduled' },
  ] },
  { activity: 'Retailer Activation', owner: 'S. Patil', units: [
    { week: 1, village: 'R1 · Dhanora', state: 'done' },
    { week: 2, village: 'R2 · Dhanora', state: 'done' },
    { week: 3, village: 'R3 · Wadi Gaon', state: 'scheduled' },
  ] },
  { activity: 'Farmer Meetings', owner: 'V. Shinde', units: [
    { week: 2, village: 'Dhanora', state: 'scheduled' },
    { week: 2, village: 'Wadi Gaon', state: 'risk', note: 'Field confirmation pending' },
    { week: 4, village: 'Dhanora', state: 'scheduled' },
  ] },
  { activity: 'Digital Advisory', owner: 'M. Deshmukh', units: [{ week: 3, village: 'Opt-in farmers', state: 'scheduled' }] },
  { activity: 'Farmer Follow-ups', owner: 'P. Kale', units: [
    { week: 3, village: 'Dhanora', state: 'scheduled' },
    { week: 4, village: 'Wadi Gaon', state: 'scheduled' },
  ] },
];

export interface PortfolioCampaign {
  id: string;
  name: string; crop: string; season: string; villages: string[]; budget: number | null; objective: string; forecast: string;
  stage: 'Not drafted' | 'Draft' | 'In approval' | 'Approved' | 'Live' | 'Completed'; result?: string; approvedAt?: string; months: [number, number]; color: string;
}

/** TM.C3 portfolio (budgets Rs lakh). Kharif 2025 results average to the 1.60× campaign ROI shown on TM.1. */
export const PORTFOLIO: PortfolioCampaign[] = [
  { id: 'ambad-onion-croptek', name: 'Ambad Onion Croptek Conversion', crop: 'Onion', season: 'Rabi 2025–26', villages: ['Dhanora', 'Wadi Gaon'], budget: 3.0, objective: '₹25.00 L', forecast: '₹12.00 L (base)', stage: 'Live', approvedAt: '12 Nov 2026', months: [6, 9], color: '#2f8a3b' },
  { id: 'ambad-maize-expansion', name: 'Ambad Maize Portfolio Expansion', crop: 'Maize', season: 'Rabi 2025–26', villages: ['Ambad HQ', 'Pimpalgaon'], budget: 2.2, objective: '₹15.00 L', forecast: 'Not yet modelled', stage: 'Draft', months: [7, 10], color: '#d7a62f' },
  { id: 'ambad-retailer-advocacy', name: 'Ambad Retailer Advocacy Programme', crop: 'Multi-crop', season: 'Rabi 2025–26', villages: ['Ambad HQ', 'Other villages'], budget: null, objective: 'Supports plan', forecast: '—', stage: 'Not drafted', months: [8, 10], color: '#9aa79c' },
  { id: 'ghansawangi-soybean-awareness', name: 'Ghansawangi Soybean Sulphur Awareness', crop: 'Soybean', season: 'Kharif 2025', villages: ['Ghansawangi'], budget: 2.4, objective: '₹18.00 L', forecast: '—', stage: 'Completed', result: 'ROI 1.80×', months: [0, 3], color: '#3972b8' },
  { id: 'badnapur-cotton-retailer', name: 'Badnapur Cotton Retailer Activation', crop: 'Cotton', season: 'Kharif 2025', villages: ['Badnapur'], budget: 1.8, objective: '₹12.00 L', forecast: '—', stage: 'Completed', result: 'ROI 1.40×', months: [1, 3], color: '#6b8fb8' },
  { id: 'ghansawangi-onion-followup', name: 'Ghansawangi Onion Trial & Follow-up', crop: 'Onion', season: 'Rabi 2025–26', villages: ['Ghansawangi villages'], budget: 2.4, objective: 'Trial & Follow-up', forecast: '—', stage: 'Live', months: [7, 10], color: '#2f8a3b' },
  { id: 'badnapur-maize-retailer', name: 'Badnapur Maize Retailer Enablement', crop: 'Maize', season: 'Rabi 2025–26', villages: ['Badnapur villages'], budget: 1.9, objective: 'Retailer Enablement', forecast: '—', stage: 'Live', months: [7, 10], color: '#2f8a3b' },
];
export const GANTT = AMBAD_ACTIVITIES;

export interface ExecutionUnit extends GanttUnit { state: UnitState; note?: string }
export interface ExecutionActivity { activity: string; owner: string; units: ExecutionUnit[] }
export interface CampaignExecution { activities: ExecutionActivity[]; budgetApproved: number; spent: number; reached: number; trials: number; adopters: number; trackedSales: number }
/** The one field-owner master: every owner dropdown and the CW.2 cost model read from here
 *  (mirrored in server/data/reference/masters.json → people). */
export interface FieldOwner { name: string; role: string; base: string; costFactor: number; group: 'Field owners (MDO)' | 'Specialists' }
export const FIELD_OWNERS: FieldOwner[] = [
  { name: 'R. Jadhav', role: 'Field owner (MDO)', base: 'Dhanora', costFactor: 1.00, group: 'Field owners (MDO)' },
  { name: 'S. Patil', role: 'Field owner (MDO)', base: 'Ambad HQ', costFactor: 1.05, group: 'Field owners (MDO)' },
  { name: 'V. Shinde', role: 'Field owner (MDO)', base: 'Ghansawangi', costFactor: 1.10, group: 'Field owners (MDO)' },
  { name: 'P. Kale', role: 'Field owner (MDO)', base: 'Wadi Gaon', costFactor: 1.00, group: 'Field owners (MDO)' },
  { name: 'M. Deshmukh', role: 'Field owner (MDO)', base: 'Pimpalgaon', costFactor: 1.00, group: 'Field owners (MDO)' },
  { name: 'P. Koli', role: 'Field owner (MDO)', base: 'Badnapur', costFactor: 1.05, group: 'Field owners (MDO)' },
  { name: 'A. Pawar', role: 'Retailer activation lead', base: 'Ambad HQ', costFactor: 1.00, group: 'Specialists' },
  { name: 'K. More', role: 'Digital advisory coordinator', base: 'Jalna', costFactor: 1.00, group: 'Specialists' },
];
export const OWNER_PENDING = 'Owner pending';
export const ownerLabel = (o: FieldOwner) => `${o.name} · ${o.role} · ${o.base}`;
const unitsFor = (villages: string[], mode: UnitState, count = 8): ExecutionActivity[] => {
  const ownerNames = FIELD_OWNERS.slice(0, 3).map((owner) => owner.name);
  const unitState = (i: number): UnitState => mode === 'done' ? 'done' : mode === 'risk' && i % 5 === 0 ? 'risk' : mode === 'risk' && i < 3 ? 'done' : 'scheduled';
  return [
  { activity: 'Field Demonstrations', owner: ownerNames[0], units: Array.from({ length: count }, (_, i) => ({ week: i % 4 + 1, village: villages[i % villages.length], state: unitState(i), note: unitState(i) === 'risk' ? 'Owner confirmation required' : undefined })) },
  { activity: 'Retailer Activation', owner: ownerNames[1], units: Array.from({ length: Math.max(2, Math.round(count / 2)) }, (_, i) => ({ week: i % 4 + 1, village: villages[i % villages.length], state: mode === 'done' ? 'done' : 'scheduled' })) },
  { activity: 'Farmer Meetings', owner: ownerNames[2], units: Array.from({ length: Math.max(2, Math.round(count / 2)) }, (_, i) => ({ week: i % 4 + 1, village: villages[i % villages.length], state: mode === 'done' ? 'done' : 'scheduled' })) },
  ];
};
export const EXECUTION: Record<string, CampaignExecution> = {
  'ambad-onion-croptek': { activities: AMBAD_ACTIVITIES, budgetApproved: 3, spent: 1.35, reached: 640, trials: 160, adopters: 72, trackedSales: 5.4 },
  'ghansawangi-onion-followup': { activities: unitsFor(['Ghansawangi'], 'risk', 9), budgetApproved: 2.4, spent: 0.92, reached: 420, trials: 126, adopters: 46, trackedSales: 3.6 },
  'badnapur-maize-retailer': { activities: unitsFor(['Badnapur'], 'scheduled', 8), budgetApproved: 1.9, spent: 2.02, reached: 350, trials: 98, adopters: 35, trackedSales: 2.8 },
  'ghansawangi-soybean-awareness': { activities: unitsFor(['Ghansawangi'], 'done', 8), budgetApproved: 2.4, spent: 2.4, reached: 520, trials: 180, adopters: 90, trackedSales: 4.32 },
  'badnapur-cotton-retailer': { activities: unitsFor(['Badnapur'], 'done', 7), budgetApproved: 1.8, spent: 1.8, reached: 410, trials: 140, adopters: 70, trackedSales: 2.52 },
};
export const EXECUTION_CAMPAIGNS = PORTFOLIO.filter((p) => ['Live', 'Completed'].includes(p.stage) && p.id in EXECUTION);
export function executionSummary(id: string) {
  const campaign = EXECUTION_CAMPAIGNS.find((p) => p.id === id) ?? EXECUTION_CAMPAIGNS[0];
  const data = EXECUTION[campaign.id];
  const units = data.activities.flatMap((activity) => activity.units);
  const completed = units.filter((u) => u.state === 'done').length;
  const scheduled = units.filter((u) => u.state === 'scheduled').length;
  const atRisk = units.filter((u) => u.state === 'risk').length;
  return { campaign, ...data, units, completed, scheduled, atRisk, totalUnits: units.length, progress: units.length ? Math.round(completed / units.length * 100) : 0, roi: campaign.stage === 'Completed' && data.budgetApproved ? data.trackedSales / data.budgetApproved : null };
}
export function portfolioExecution() {
  const summaries = EXECUTION_CAMPAIGNS.map((c) => executionSummary(c.id));
  return summaries.reduce((t, s) => ({ campaigns: summaries.length, running: t.running + Number(s.campaign.stage === 'Live'), completed: t.completed + Number(s.campaign.stage === 'Completed'), activitiesDone: t.activitiesDone + s.completed, activitiesTotal: t.activitiesTotal + s.totalUnits, atRisk: t.atRisk + s.atRisk, budgetApproved: t.budgetApproved + s.budgetApproved, spent: t.spent + s.spent, adopters: t.adopters + s.adopters, trackedSales: t.trackedSales + s.trackedSales, reached: t.reached + s.reached, trials: t.trials + s.trials }), { campaigns: 0, running: 0, completed: 0, activitiesDone: 0, activitiesTotal: 0, atRisk: 0, budgetApproved: 0, spent: 0, adopters: 0, trackedSales: 0, reached: 0, trials: 0 });
}
/** Timeline columns for the portfolio (index 0 = Jun 2025; Rabi campaigns Dec–Apr). */
export const PORTFOLIO_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

/** TM.IM1 / IM2 interim checkpoint: 640 reached, 160 trials, 72 adopters, Rs 5.4 L tracked sales. */
/** TM.IM1 interim checkpoint by village, grouped into the two campaign clusters (₹ L sales).
 *  Cluster sums = 280/62/24 · 4/6 · ₹2.00 L (Dhanora) and 360/98/48 · 5/7 · ₹3.40 L (Wadi Gaon); total 640/160/72 · 9/13 · ₹5.40 L. */
export const IMPACT_VILLAGE_ROWS = [
  { cluster: 'Dhanora', village: 'Dhanora', reached: 130, trials: 30, adopters: 12, completed: 2, planned: 3, sales: 0.95 },
  { cluster: 'Dhanora', village: 'Shahagad', reached: 90, trials: 19, adopters: 7, completed: 1, planned: 2, sales: 0.62 },
  { cluster: 'Dhanora', village: 'Gondi', reached: 60, trials: 13, adopters: 5, completed: 1, planned: 1, sales: 0.43 },
  { cluster: 'Wadi Gaon', village: 'Wadi Gaon', reached: 170, trials: 48, adopters: 25, completed: 2, planned: 3, sales: 1.75 },
  { cluster: 'Wadi Gaon', village: 'Rohilagad', reached: 110, trials: 30, adopters: 14, completed: 2, planned: 2, sales: 1.05 },
  { cluster: 'Wadi Gaon', village: 'Jamkhed', reached: 80, trials: 20, adopters: 9, completed: 1, planned: 2, sales: 0.60 },
];
/** One row per cluster (same shape as the earlier two-village rows, so other screens' totals are unchanged). */
export function clusterTotals() {
  const out: { village: string; reached: number; trials: number; adopters: number; planned: number; completed: number; sales: number }[] = [];
  for (const r of IMPACT_VILLAGE_ROWS) {
    let c = out.find((x) => x.village === r.cluster);
    if (!c) { c = { village: r.cluster, reached: 0, trials: 0, adopters: 0, planned: 0, completed: 0, sales: 0 }; out.push(c); }
    c.reached += r.reached; c.trials += r.trials; c.adopters += r.adopters; c.planned += r.planned; c.completed += r.completed; c.sales = Math.round((c.sales + r.sales) * 100) / 100;
  }
  return out;
}
export const IMPACT_VILLAGES = clusterTotals();
export const conversion = (adopters: number, trials: number) => (trials ? (adopters / trials) * 100 : 0);


export const isOwnerPending = (owner: string) => !owner || owner === OWNER_PENDING;

/** Farmer conversion funnel (reached → trials → adopters), summed over the execution campaigns or one campaign. */
export function conversionFunnel(ids: string[] = EXECUTION_CAMPAIGNS.map((c) => c.id)) {
  return ids.reduce((t, id) => {
    const e = EXECUTION[id];
    return e ? { reached: t.reached + e.reached, trials: t.trials + e.trials, adopters: t.adopters + e.adopters } : t;
  }, { reached: 0, trials: 0, adopters: 0 });
}
/** Cost per adopter (₹) = spent (₹ L × 1,00,000) ÷ adopters, per execution campaign, plus the portfolio average. */
export function costPerAdopter() {
  const rows = EXECUTION_CAMPAIGNS.map((c) => {
    const e = EXECUTION[c.id];
    return { id: c.id, name: c.name, spent: e.spent, approved: e.budgetApproved, adopters: e.adopters, cost: e.adopters ? (e.spent * 1e5) / e.adopters : 0 };
  });
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const adopters = rows.reduce((s, r) => s + r.adopters, 0);
  return { rows, average: adopters ? (spent * 1e5) / adopters : 0 };
}

/** Conversion benchmark from completed execution campaigns: reach→trial = Σtrials/Σreached, trial→adoption = Σadopters/Σtrials. */
export function completedBenchmark() {
  const done = EXECUTION_CAMPAIGNS.filter((c) => c.stage === 'Completed');
  const t = done.reduce((a, c) => ({ reached: a.reached + EXECUTION[c.id].reached, trials: a.trials + EXECUTION[c.id].trials, adopters: a.adopters + EXECUTION[c.id].adopters }), { reached: 0, trials: 0, adopters: 0 });
  const seasons = [...new Set(done.map((c) => c.season))].join(', ');
  return { reachToTrial: t.reached ? (t.trials / t.reached) * 100 : 0, trialToAdoption: t.trials ? (t.adopters / t.trials) * 100 : 0, label: `${done.map((c) => c.crop).join(' + ')} (${seasons})` };
}

/**
 * Illustrative figures for the Field Sales Manager journey (Ambad, Jalna Cluster, FY 2025-26).
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
  { label: 'Campaign ROI (FY 2024–25)', value: '1.6×', note: 'contribution ÷ campaign spend, illustrative' },
  { label: 'Historical target attainment', value: '94%', note: '3-year average vs ABP' },
];

/** Ambad network: 8 dealers, 74 active retailers (illustrative). */
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
    { name: 'Dhanora Agro Inputs', type: 'Dealer', dealer: '—', village: 'Dhanora', prev: '₹48 L primary', status: 'Active' },
    { name: 'Dhanora Krushi Seva Kendra', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹6.2 L secondary (est.)', status: 'Active' },
    { name: 'Ganesh Agro Point', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹4.8 L secondary (est.)', status: 'Active' },
    { name: 'Shetkari Agro Mart', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: '₹3.9 L secondary (est.)', status: 'Active' },
    { name: 'Kisan Seva Kendra', type: 'Retailer', dealer: 'Dhanora Agro Inputs', village: 'Dhanora', prev: 'No sales data', status: 'Inactive' },
    { name: 'Sai Krushi Bhandar', type: 'Retailer', dealer: 'Not mapped', village: 'Dhanora', prev: 'No sales data', status: 'Mapping missing' },
  ],
  'Wadi Gaon': [
    { name: 'Shiv Krushi Kendra', type: 'Dealer', dealer: '—', village: 'Wadi Gaon', prev: '₹42 L primary', status: 'Active' },
    { name: 'Wadi Gaon Kisan Point', type: 'Retailer', dealer: 'Shiv Krushi Kendra', village: 'Wadi Gaon', prev: '₹5.6 L secondary (est.)', status: 'Active' },
    { name: 'Om Agro Services', type: 'Retailer', dealer: 'Shiv Krushi Kendra', village: 'Wadi Gaon', prev: '₹4.1 L secondary (est.)', status: 'Active' },
    { name: 'Jai Bhavani Agro', type: 'Retailer', dealer: 'Not mapped', village: 'Wadi Gaon', prev: 'No sales data', status: 'Mapping missing' },
  ],
  'Ambad HQ': [
    { name: 'Ambad Crop Depot', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹36 L primary', status: 'Active' },
    { name: 'Om Sai Fertilisers', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹40 L primary', status: 'Active' },
    { name: 'Samarth Agro Agencies', type: 'Dealer', dealer: '—', village: 'Ambad HQ', prev: '₹35 L primary', status: 'Active' },
    { name: 'Ambad Market Agro', type: 'Retailer', dealer: 'Ambad Crop Depot', village: 'Ambad HQ', prev: '₹7.4 L secondary (est.)', status: 'Active' },
  ],
  Pimpalgaon: [
    { name: 'Mahalaxmi Agro Agencies', type: 'Dealer', dealer: '—', village: 'Pimpalgaon', prev: '₹45 L primary', status: 'Active' },
    { name: 'Pimpalgaon Agri Stores', type: 'Retailer', dealer: 'Mahalaxmi Agro Agencies', village: 'Pimpalgaon', prev: 'No sales data', status: 'Verification pending' },
  ],
  'Other villages': [
    { name: 'Jai Kisan Traders', type: 'Dealer', dealer: '—', village: 'Other villages', prev: '₹38 L primary', status: 'Active' },
    { name: 'Annapurna Krushi Bhandar', type: 'Dealer', dealer: '—', village: 'Other villages', prev: '₹36 L primary', status: 'Active' },
  ],
};

export interface DealerPlan { name: string; village: string; ly: number; target: number; status: string; retailers?: { name: string; secondary: string }[]; group?: string[] }

/** TM.3 dealer plan in Rs lakh: 320 -> 380. */
export const DEALER_PLAN: DealerPlan[] = [
  { name: 'Dhanora Agro Inputs', village: 'Dhanora', ly: 48, target: 55, status: 'Draft', retailers: [
    { name: 'Dhanora Krushi Seva Kendra', secondary: '₹7.0 L demand (est.)' },
    { name: 'Ganesh Agro Point', secondary: '₹5.5 L demand (est.)' },
    { name: 'Shetkari Agro Mart', secondary: '₹4.4 L demand (est.)' },
    { name: 'Kisan Seva Kendra', secondary: 'Not estimated — inactive' },
  ] },
  { name: 'Ambad Crop Depot', village: 'Ambad HQ', ly: 36, target: 43, status: 'Draft' },
  { name: 'Shiv Krushi Kendra', village: 'Wadi Gaon', ly: 42, target: 50, status: 'Review potential' },
  { name: 'Mahalaxmi Agro Agencies', village: 'Pimpalgaon', ly: 45, target: 53, status: 'Draft' },
  { name: 'Other 4 dealers', village: 'Ambad HQ · Other villages', ly: 149, target: 179, status: 'Draft',
    group: ['Om Sai Fertilisers ₹40 L → ₹48 L', 'Jai Kisan Traders ₹38 L → ₹45 L', 'Annapurna Krushi Bhandar ₹36 L → ₹43 L', 'Samarth Agro Agencies ₹35 L → ₹43 L'] },
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
  { id: 'onion', title: 'Onion — Croptek conversion', sub: 'Convert Non Saarthi nutrition users', geo: 'Dhanora · Wadi Gaon', uplift: '₹25 L',
    audience: 'Non Saarthi nutrition users', approach: 'Retailer-led + field demos', coverage: 'Dhanora & Wadi Gaon' },
  { id: 'maize', title: 'Maize — Portfolio expansion', sub: 'Expand coverage at existing outlets', geo: 'Ambad HQ · Pimpalgaon', uplift: '₹15 L',
    audience: 'Existing maize growers at linked outlets', approach: 'Outlet activation + farmer meetings', coverage: 'Ambad HQ & Pimpalgaon' },
  { id: 'retail', title: 'Retailer engagement', sub: 'Improve channel advocacy and reach', geo: 'Across Ambad', uplift: 'Supports existing plan',
    audience: 'Linked retailers (74)', approach: 'Retailer education programme', coverage: 'All Ambad villages' },
];

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
export const GANTT: { activity: string; owner: string; units: GanttUnit[] }[] = [
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
  name: string; crop: string; season: string; villages: string[]; budget: number | null; objective: string; forecast: string;
  stage: 'Not drafted' | 'Draft' | 'In approval' | 'Approved' | 'Live' | 'Completed'; result?: string; months: [number, number]; color: string;
}

/** TM.C3 portfolio (budgets Rs lakh). Kharif 2025 results average to the 1.6x campaign ROI shown on TM.1. */
export const PORTFOLIO: PortfolioCampaign[] = [
  { name: 'Ambad Onion Croptek Conversion', crop: 'Onion', season: 'Rabi 2025–26', villages: ['Dhanora', 'Wadi Gaon'], budget: 3.0, objective: '₹25 L', forecast: '₹12 L (base)', stage: 'In approval', months: [6, 9], color: '#2f8a3b' },
  { name: 'Ambad Maize Portfolio Expansion', crop: 'Maize', season: 'Rabi 2025–26', villages: ['Ambad HQ', 'Pimpalgaon'], budget: 2.2, objective: '₹15 L', forecast: 'Not yet modelled', stage: 'Draft', months: [7, 10], color: '#d7a62f' },
  { name: 'Ambad Retailer Advocacy Programme', crop: 'Multi-crop', season: 'Rabi 2025–26', villages: ['Ambad HQ', 'Other villages'], budget: null, objective: 'Supports plan', forecast: '—', stage: 'Not drafted', months: [8, 10], color: '#9aa79c' },
  { name: 'Ghansawangi Soybean Sulphur Awareness', crop: 'Soybean', season: 'Kharif 2025', villages: ['Ghansawangi'], budget: 2.4, objective: '₹18 L', forecast: '—', stage: 'Completed', result: 'ROI 1.8× · ₹19.6 L tracked', months: [0, 3], color: '#3972b8' },
  { name: 'Badnapur Cotton Retailer Activation', crop: 'Cotton', season: 'Kharif 2025', villages: ['Badnapur'], budget: 1.8, objective: '₹12 L', forecast: '—', stage: 'Completed', result: 'ROI 1.4× · ₹11.2 L tracked', months: [1, 3], color: '#6b8fb8' },
];
/** Timeline columns for the portfolio (index 0 = Jun 2025; Rabi campaigns Dec–Apr). */
export const PORTFOLIO_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

/** TM.IM1 / IM2 interim checkpoint: 640 reached, 160 trials, 72 adopters, Rs 5.4 L tracked sales. */
export const IMPACT_VILLAGES = [
  { village: 'Dhanora', reached: 280, trials: 62, adopters: 24, planned: 6, completed: 4, sales: 2.0 },
  { village: 'Wadi Gaon', reached: 360, trials: 98, adopters: 48, planned: 7, completed: 5, sales: 3.4 },
];
export const conversion = (adopters: number, trials: number) => (trials ? (adopters / trials) * 100 : 0);

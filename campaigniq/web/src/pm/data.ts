/**
 * Illustrative figures shared by the Product Manager screens. Everything here is concept data - no real
 * Mahadhan results. Keeping the numbers in one place keeps every screen internally consistent.
 */

export const PM_ROLE = 'Crop Nutrition Product Manager';

/* PM.1 - product portfolio ABP (₹ Cr) */
export const PORTFOLIO = [
  { product: 'Croptek', ly: 2.4, abp: 3.2 },
  { product: 'Water Soluble', ly: 1.5, abp: 1.8 },
  { product: 'Specialty Nutrition', ly: 0.9, abp: 1.0 },
];
export const PORTFOLIO_TOTAL = { ly: 4.8, abp: 6.0 };
export const growthPct = (ly: number, abp: number) => `${(((abp - ly) / ly) * 100).toFixed(1)}%`;
export const cr = (value: number) => `₹${value.toFixed(2)} Cr`;

/* Ambad / Jalna territory submission (all-product figures) */
export const AMBAD = {
  territory: 'Ambad, Jalna',
  tm: 'Territory Manager — Jalna Cluster',
  abp: '₹4.20 Cr',
  submitted: '₹3.80 Cr',
  gap: '₹0.40 Cr',
  gapLakh: '₹40 L',
};

export const CROP_PLAN = [
  { crop: 'Onion', business: '₹1.65 Cr', growth: 'Dhanora volume +50% (10 → 15 MT); realization ₹100 → ₹80/kg' },
  { crop: 'Maize', business: '₹1.10 Cr', growth: 'Growth basis to be reviewed' },
  { crop: 'Other Crops', business: '₹1.05 Cr', growth: 'Growth basis to be reviewed' },
];
export const CROP_TOTAL = '₹3.80 Cr';
export const ONION_APPROVED_LATER = '₹1.90 Cr';

export const DHANORA = {
  histRev: '₹10 L', histVol: '10 MT', tgtRev: '₹12 L', tgtVol: '15 MT',
  prevAcres: '500 acres', reqAcres: '750 acres', rate: '20 kg/acre',
  realPrev: '₹100/kg', realNew: '₹80/kg',
};

/* Marketing Head theme */
export const THEME = {
  name: 'Croptek Conversion',
  scope: 'Maharashtra Onion · West Region (other markets subject to validation)',
  objective: 'Strengthen eligible farmer conversion and Croptek adoption',
  assignedBy: 'Marketing Head',
  status: 'Assigned — Acknowledgement Pending',
};

export const EVIDENCE = {
  penetration: '14–18% (indicative)',
  quarterly: ['₹40 L', '₹43 L', '₹45 L', '₹48 L'],
  trials: 150, purchases: 54, trialToPurchase: '36%',
};

/* Campaign concepts */
export const C1 = {
  id: 'C1', name: 'Retailer-Led Croptek Conversion',
  objective: 'Support eligible first purchase through retailer education and recommendation',
  audience: 'Eligible conventional-nutrition Onion farmers (eligibility & consent pending)',
  stage: 'Consideration → First purchase',
  intervention: 'Retailer product education, recommendation and demonstration support',
  evidence: 'Retailer influence unverified · benchmark missing',
};
export const C2 = {
  id: 'C2', name: 'Trial-to-Purchase Farmer Nurture',
  objective: 'Structured follow-up and education for verified trial / interest farmer cohorts',
  audience: 'Consent-eligible matched trial / interest farmers (CRM matching pending)',
  stage: 'Trial → First purchase',
  intervention: 'Structured nurture: follow-up visits, education, consent-based advisory',
  evidence: 'Hypothetical pilot 54 / 150 = 36% · no benchmark',
};

export const JOURNEY = [
  { stage: 'Retailer Enablement', intervention: 'Retailer product education & recommendation' },
  { stage: 'Farmer Engagement', intervention: 'Eligible farmer product discussion' },
  { stage: 'Trial / Consideration', intervention: 'Approved demonstration or trial support' },
  { stage: 'Verified First Purchase', intervention: 'Purchase verification & follow-up' },
];

export const CLAIMS = [
  'Complete crop nutrition for Onion',
  'Supports healthy crop growth',
  'Promotes stronger roots',
  'Aids bulb development',
];

export type CreativeKind = 'detailer' | 'leaflet' | 'whatsapp' | 'poster';
export const COLLATERALS: { name: string; kind: CreativeKind; lang: string; format: string; version: string; status: string }[] = [
  { name: 'Retailer Product Detailer', kind: 'detailer', lang: 'English · Marathi', format: 'Briefing deck / PDF', version: 'v0.3', status: 'Technical Review Pending' },
  { name: 'Farmer Education Leaflet', kind: 'leaflet', lang: 'Marathi · English', format: 'A5 leaflet', version: 'v0.1', status: 'Draft' },
  { name: 'Marathi WhatsApp Education Creative', kind: 'whatsapp', lang: 'Marathi', format: 'Opt-in digital creative', version: 'v0.1', status: 'Draft' },
  { name: 'Field Demonstration Poster', kind: 'poster', lang: 'Marathi', format: 'A3 poster', version: 'v0.1', status: 'Draft' },
];

/* Business case */
export const INVESTMENT = '₹12 L';
export const MARGIN = '35% (assumed)';
export const SCENARIOS = [
  { name: 'Conservative', sales: '₹36 L', contribution: '₹12.6 L', roi: '+0.05x', salesL: 36, contribL: 12.6 },
  { name: 'Base', sales: '₹48 L', contribution: '₹16.8 L', roi: '+0.40x', salesL: 48, contribL: 16.8 },
  { name: 'Optimistic', sales: '₹60 L', contribution: '₹21.0 L', roi: '+0.75x', salesL: 60, contribL: 21 },
];

/* Territory activity plan (local, Ambad) */
export const LOCAL_PLAN = {
  name: 'Ambad Onion Croptek Conversion',
  villages: 'Dhanora, Wadi Gaon',
  retailers: '3 linked retailers',
  units: 13,
  budget: '₹3.00 L',
  status: 'Submitted for PM Approval — Not Yet Approved',
};
export const ACTIVITIES = [
  { activity: 'Field Demonstrations', units: '4 units', village: 'Dhanora 2 · Wadi Gaon 2', budget: '₹1.05 L', planned: 4, done: 3 },
  { activity: 'Retailer Activation', units: '3 sessions', village: '3 linked retailers', budget: '₹0.75 L', planned: 3, done: 2 },
  { activity: 'Farmer Meetings', units: '3 meetings', village: 'Dhanora, Wadi Gaon', budget: '₹0.60 L', planned: 3, done: 2 },
  { activity: 'Consent-Based Digital Advisory', units: '1 wave', village: 'Opt-in farmers', budget: '₹0.30 L', planned: 1, done: 1 },
  { activity: 'Farmer Follow-ups', units: '2 rounds', village: 'Dhanora, Wadi Gaon', budget: '₹0.30 L', planned: 2, done: 1 },
];
export const ACTIVITY_TOTAL = { units: 13, done: 9, budget: '₹3.00 L', completion: '69.2%' };

/* Interim campaign results (local Ambad, illustrative) */
export const IMPACT = { reached: 640, trials: 160, adopters: 72, rate: '45.0%', linkedSales: '₹5.4 L', activities: '9 / 13' };
export const VILLAGES = [
  { village: 'Dhanora', reached: 280, trials: 62, adopters: 24, rate: 38.7 },
  { village: 'Wadi Gaon', reached: 360, trials: 98, adopters: 48, rate: 49.0 },
];
export const VILLAGE_GAP = '10.3 pp';

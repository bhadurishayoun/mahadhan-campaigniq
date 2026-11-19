/** Business Head investment figures (₹ L) shared by BH.5 (regional overview), BH.5A (campaign detail) and the
 *  BH.5 "Financial status" card. Totals are computed here, never typed into a screen. */

export type FinanceStatus = 'Pending attribution' | 'Pending' | 'Verify' | 'Validation required' | 'On track' | 'Confirmed';

export interface InvestmentRegion { region: string; approved: number; actual: number; adopters: number; roiStatus: FinanceStatus }
export const INVESTMENT_REGIONS: InvestmentRegion[] = [
  { region: 'West', approved: 90, actual: 72, adopters: 760, roiStatus: 'Pending attribution' },
  { region: 'South', approved: 70, actual: 54, adopters: 490, roiStatus: 'Pending attribution' },
  { region: 'North', approved: 55, actual: 39, adopters: 370, roiStatus: 'Pending attribution' },
  { region: 'East', approved: 35, actual: 25, adopters: 240, roiStatus: 'Pending attribution' },
];

export interface InvestmentDetail { region: string; campaign: string; approved: number; actual: number; committed: number; unspent: number; status: FinanceStatus }
/** BH.5A: West campaigns with verified commitments (approved = actual + committed + unspent). */
export const INVESTMENT_DETAIL: InvestmentDetail[] = [
  { region: 'West', campaign: 'Retailer-Led Croptek Conversion', approved: 12, actual: 9, committed: 2, unspent: 1, status: 'Verify' },
  { region: 'West', campaign: 'Product Adoption Drive', approved: 28, actual: 23, committed: 3, unspent: 2, status: 'On track' },
  { region: 'West', campaign: 'Retailer Enablement', approved: 28, actual: 22, committed: 4, unspent: 2, status: 'On track' },
  { region: 'West', campaign: 'Trial & Follow-up', approved: 22, actual: 18, committed: 3, unspent: 1, status: 'Verify' },
];

/** ₹ L → "₹72.00 L", or crore from ₹1 Cr upwards ("₹2.50 Cr"). */
export const lakhOrCrore = (lakh: number) => (Math.abs(lakh) >= 100 ? `₹${(lakh / 100).toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`);

/** National budget: approved, actual, unspent (₹ L), utilisation %, adopters. */
export function nationalBudget() {
  const approved = INVESTMENT_REGIONS.reduce((s, r) => s + r.approved, 0);
  const actual = INVESTMENT_REGIONS.reduce((s, r) => s + r.actual, 0);
  const adopters = INVESTMENT_REGIONS.reduce((s, r) => s + r.adopters, 0);
  return { approved, actual, unspent: approved - actual, utilisation: approved ? (actual / approved) * 100 : 0, adopters };
}

/** West commitments from BH.5A: approved = actual + committed + free (₹ L). */
export function westCommitments() {
  const rows = INVESTMENT_DETAIL.filter((d) => d.region === 'West');
  const approved = rows.reduce((s, r) => s + r.approved, 0);
  const actual = rows.reduce((s, r) => s + r.actual, 0);
  const committed = rows.reduce((s, r) => s + r.committed, 0);
  const free = rows.reduce((s, r) => s + r.unspent, 0);
  return { approved, actual, committed, free, unspent: committed + free };
}

/** What must be confirmed before ROI and reallocation decisions. */
export const FINANCIAL_CHECKS: { item: string; status: FinanceStatus }[] = [
  { item: 'Actual net ROI', status: 'Pending attribution' },
  { item: 'Incremental sales', status: 'Pending' },
  { item: 'Outstanding commitments', status: 'Verify' },
  { item: 'Budget phasing', status: 'Validation required' },
];
/** Tone of a finance status: confirmed = ok, validation required = risk, everything else still open = warn. */
export const financeTone = (s: FinanceStatus): 'ok' | 'warn' | 'risk' => (s === 'Confirmed' || s === 'On track' ? 'ok' : s === 'Validation required' ? 'risk' : 'warn');

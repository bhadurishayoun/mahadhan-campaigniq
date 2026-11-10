import { sum } from './num';

// 5.13 KPIs. Each function is a single formula from the spec.

const ratio = (a: number, b: number): number | null => (b > 0 ? a / b : null);

export const activityCompletion = (done: number, scheduledDue: number) => ratio(done, scheduledDue);

export function budgetUtilisation(actualCosts: number[], approvedBudget: number, scheduledUnitCosts: number[] = []) {
  const actual = sum(actualCosts);
  const committed = sum(scheduledUnitCosts);
  return { utilisation: ratio(actual, approvedBudget), actual, committed };
}

export const verifiedUniqueReach = (
  contacts: { farmer_id: number; event_id: number }[],
  eventsWithOpenFlag: Set<number>,
) => new Set(contacts.filter((c) => !eventsWithOpenFlag.has(c.event_id)).map((c) => c.farmer_id)).size;

export const conversionPerActivity = (positives: number, calls: number) => ratio(positives, calls);
export const costPerConvertedFarmer = (actualSpend: number, converted: number) => ratio(actualSpend, converted);
export const liquidationVsPlan = (liquidated: number, planned: number) => ratio(liquidated, planned);

// LRR (projected) = liquidated to date / days elapsed * season days
export function lrrProjected(liquidated: number, daysElapsed: number, seasonDays: number, yPacks: number) {
  if (daysElapsed <= 0) return { projected_packs: null, vs_goal: null };
  const projected = (liquidated / daysElapsed) * seasonDays;
  return { projected_packs: projected, vs_goal: ratio(projected, yPacks) };
}

export const poLiquidation = (liquidated: number, po: number) => ratio(liquidated, po);

export function forecastAccuracy(actual: number, forecast: number): number | null {
  if (actual === 0) return null;
  return 1 - Math.abs(actual - forecast) / actual;
}

export function demoYieldGain(treated: number, control: number, price: number) {
  if (control <= 0) return { gain_pct: null, extra_value_per_acre: null };
  return { gain_pct: (treated - control) / control, extra_value_per_acre: (treated - control) * price };
}

// Always an estimate: campaign MUs vs similar non-campaign MUs.
export function campaignRoiEstimate(
  campaignGrowthPacks: number,
  controlGrowthPacks: number,
  price: number,
  spend: number,
) {
  if (spend <= 0) return null;
  return ((campaignGrowthPacks - controlGrowthPacks) * price) / spend;
}

export const reportQuality = (doneWithGpsPhotoNoFlag: number, done: number) => ratio(doneWithGpsPhotoNoFlag, done);

import type { ActivityLine } from './data';

// All pricing and multipliers live here so the budget model can be tuned in one place.
export const COST_CONFIG = {
  baseCost: {
    demonstration: 1.10,
    retailerActivation: 0.25,
    meeting: 0.20,
    digitalAdvisory: 0.30,
    followUp: 0.15,
    default: 0.20,
  },
  unitFactor: { units: 1, unit: 1, sessions: 1, session: 1, meetings: 1, meeting: 1, wave: 1, rounds: 1, round: 1, days: 1.2, day: 1.2 },
  reachFactor: { perExtraPlace: 0.5, digitalConsent: 0.6 },
  timingFactor: { peak: 1.15, after: 0.9, default: 1 },
  ownerFactor: { 'r. jadhav': 1, 's. patil': 1.05, 'v. shinde': 1.1, 'p. kale': 1, pending: 1, default: 1 },
} as const;

type CostLine = Pick<ActivityLine, 'activity' | 'units' | 'unitLabel' | 'where' | 'timing' | 'owner'>;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const money = (value: number) => `₹${value.toFixed(2)} L`;

function baseCost(activity: string) {
  const name = activity.toLowerCase();
  if (/demonstrat/.test(name)) return COST_CONFIG.baseCost.demonstration;
  if (/retailer.*activat|activat.*retailer/.test(name)) return COST_CONFIG.baseCost.retailerActivation;
  if (/meeting/.test(name)) return COST_CONFIG.baseCost.meeting;
  if (/digital.*advisory|advisory.*digital/.test(name)) return COST_CONFIG.baseCost.digitalAdvisory;
  if (/follow.?up/.test(name)) return COST_CONFIG.baseCost.followUp;
  return COST_CONFIG.baseCost.default;
}

function reachCount(where: string) {
  const text = where.trim();
  const linkedCount = text.match(/\b(\d+)\s+linked\s+retailers?\b/i);
  if (linkedCount) return Math.max(1, Number(linkedCount[1]));
  return Math.max(1, text.split(/·|\/|,|\band\b/i).map((part) => part.trim()).filter(Boolean).length);
}

export function calcLineBudget(line: CostLine): { budget: number; breakdown: string } {
  const activityCost = baseCost(line.activity);
  const label = line.unitLabel.trim().toLowerCase().replace(/s$/, '');
  const unitFactor = COST_CONFIG.unitFactor[label as keyof typeof COST_CONFIG.unitFactor] ?? 1;
  const places = reachCount(line.where);
  let reach = 1 + COST_CONFIG.reachFactor.perExtraPlace * (places - 1);
  const digital = /digital|consent/i.test(`${line.activity} ${line.where}`);
  if (digital) reach *= COST_CONFIG.reachFactor.digitalConsent;
  const timingText = line.timing.toLowerCase();
  const before = /before|preparation|pre-activation|preactivation/i.test(timingText);
  const peak = !before && /stage window|bulb|crop-stage/i.test(timingText);
  const after = !before && !peak && /after|follow-up|follow up/i.test(timingText);
  const timingFactor = peak ? COST_CONFIG.timingFactor.peak : after ? COST_CONFIG.timingFactor.after : COST_CONFIG.timingFactor.default;
  const owner = line.owner.trim().toLowerCase();
  const ownerFactor = COST_CONFIG.ownerFactor[owner as keyof typeof COST_CONFIG.ownerFactor] ?? COST_CONFIG.ownerFactor.default;
  const rawBudget = Math.max(0, line.units) * activityCost * unitFactor * reach * timingFactor * ownerFactor;
  const budget = round2(rawBudget);
  const timingLabel = peak ? 'stage window' : after ? 'follow-up' : 'timing';
  return {
    budget,
    breakdown: `${line.units} × ${money(activityCost)} × ${unitFactor.toFixed(2)} unit × ${reach.toFixed(2)} reach × ${timingFactor.toFixed(2)} ${timingLabel} × ${ownerFactor.toFixed(2)} owner = ${money(budget)}`,
  };
}

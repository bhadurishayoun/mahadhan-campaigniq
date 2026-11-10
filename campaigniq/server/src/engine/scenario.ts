import { clamp } from './num';

// Forward funnel simulator (CampaignIQ S4.4). Complements the goal-backward planner:
// the planner answers "how many activities do we need for goal Y", this answers
// "given conversion assumptions, what do we get".

export interface FunnelAssumptions {
  reach_pct: number;
  trial_pct: number; // of reached
  adoption_pct: number; // of trialled
  repeat_pct: number; // of adopters
}

export interface ScenarioInput {
  target_farmers: number;
  assumptions: FunnelAssumptions;
  qty_per_adopter_kg: number;
  price_per_mt: number; // INR per metric tonne
  spend: number;
  contribution_margin_pct: number; // share of revenue that is contribution
  planning_margin_pct?: number; // used only for the planning-stage ROI multiple
}

export interface ScenarioResult {
  targeted: number;
  reached: number;
  trialled: number;
  adopted: number;
  repeat: number;
  conversion_from_prev: { reached: number; trialled: number; adopted: number; repeat: number };
  adoption_of_target: number;
  incremental_demand_mt: number;
  incremental_revenue: number;
  contribution: number;
  net_roi: number | null; // (contribution - spend) / spend
  planning_roi: number | null; // revenue * planning_margin / spend
}

export function runScenario(i: ScenarioInput): ScenarioResult {
  const a = i.assumptions;
  const targeted = i.target_farmers;
  const reached = targeted * a.reach_pct;
  const trialled = reached * a.trial_pct;
  const adopted = trialled * a.adoption_pct;
  const repeat = adopted * a.repeat_pct;
  const demand_mt = (adopted * i.qty_per_adopter_kg) / 1000;
  const revenue = demand_mt * i.price_per_mt;
  const contribution = revenue * i.contribution_margin_pct;
  return {
    targeted,
    reached,
    trialled,
    adopted,
    repeat,
    conversion_from_prev: {
      reached: a.reach_pct,
      trialled: a.trial_pct,
      adopted: a.adoption_pct,
      repeat: a.repeat_pct,
    },
    adoption_of_target: targeted > 0 ? adopted / targeted : 0,
    incremental_demand_mt: demand_mt,
    incremental_revenue: revenue,
    contribution,
    net_roi: i.spend > 0 ? (contribution - i.spend) / i.spend : null,
    planning_roi:
      i.spend > 0 && i.planning_margin_pct !== undefined
        ? (revenue * i.planning_margin_pct) / i.spend
        : null,
  };
}

export type ScenarioName = 'conservative' | 'base' | 'optimistic';

export const DEFAULT_SCENARIO_MULTIPLIERS: Record<ScenarioName, number> = {
  conservative: 0.83,
  base: 1,
  optimistic: 1.135,
};

// Scenarios scale the trial conversion (the least certain step); other steps stay as set.
export function runScenarioSet(
  i: ScenarioInput,
  multipliers: Record<ScenarioName, number> = DEFAULT_SCENARIO_MULTIPLIERS,
): Record<ScenarioName, ScenarioResult> {
  const make = (m: number) =>
    runScenario({
      ...i,
      assumptions: { ...i.assumptions, trial_pct: clamp(i.assumptions.trial_pct * m, 0, 1) },
    });
  return {
    conservative: make(multipliers.conservative),
    base: make(multipliers.base),
    optimistic: make(multipliers.optimistic),
  };
}

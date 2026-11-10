import { clamp } from './num';

// Scores shown on CampaignIQ screens. Every score returns its components so the UI can show
// the rule behind the number (no unexplained scores). Weights are config, not constants.

export interface OpportunityWeights {
  size: number;
  gap: number;
  channel: number;
  conversion: number;
}

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = {
  size: 0.3,
  gap: 0.3,
  channel: 0.2,
  conversion: 0.2,
};

export interface OpportunityInput {
  market_potential: number; // INR
  peer_max_potential: number; // largest market_potential among peers being compared
  penetration_pct: number; // current Mahadhan penetration (0-1)
  potential_pct: number; // available market potential (0-1)
  channel_readiness: number; // 0-1
  conversion_feasibility: number; // 0-1
}

export interface ScoreBreakdown {
  score: number; // 0-100
  components: { name: string; value: number; weight: number; contribution: number }[];
  rule: string;
}

export function opportunityScore(
  i: OpportunityInput,
  w: OpportunityWeights = DEFAULT_OPPORTUNITY_WEIGHTS,
): ScoreBreakdown {
  const size = i.peer_max_potential > 0 ? clamp(i.market_potential / i.peer_max_potential, 0, 1) : 0;
  const gap =
    i.potential_pct > 0 ? clamp((i.potential_pct - i.penetration_pct) / i.potential_pct, 0, 1) : 0;
  const comps = [
    { name: 'Market size vs peers', value: size, weight: w.size },
    { name: 'Penetration gap to potential', value: gap, weight: w.gap },
    { name: 'Channel readiness', value: clamp(i.channel_readiness, 0, 1), weight: w.channel },
    { name: 'Conversion feasibility', value: clamp(i.conversion_feasibility, 0, 1), weight: w.conversion },
  ].map((c) => ({ ...c, contribution: c.value * c.weight * 100 }));
  const totalWeight = comps.reduce((a, c) => a + c.weight, 0) || 1;
  return {
    score: Math.round(comps.reduce((a, c) => a + c.contribution, 0) / totalWeight),
    components: comps,
    rule: 'Opportunity score = weighted mean of market size, penetration gap, channel readiness and conversion feasibility (each 0-1), scaled to 100',
  };
}

export type Level = 'High' | 'Medium' | 'Low';

export function levelToValue(l: Level | string): number {
  return l === 'High' ? 1 : l === 'Medium' || l === 'Medium-High' ? 0.65 : 0.3;
}

// Farmer-segment priority score (S2.5): opportunity share, conversion feasibility, channel readiness.
export function segmentPriorityScore(
  opportunityShare: number,
  feasibility: Level | string,
  channel: Level | string,
): ScoreBreakdown {
  const comps = [
    { name: 'Share of market opportunity', value: clamp(opportunityShare, 0, 1), weight: 0.4 },
    { name: 'Conversion feasibility', value: levelToValue(feasibility), weight: 0.35 },
    { name: 'Channel readiness', value: levelToValue(channel), weight: 0.25 },
  ].map((c) => ({ ...c, contribution: c.value * c.weight * 100 }));
  return {
    score: Math.round(comps.reduce((a, c) => a + c.contribution, 0)),
    components: comps,
    rule: 'Priority = 40% opportunity share + 35% conversion feasibility + 25% channel readiness',
  };
}

export interface ChannelReadinessInput {
  retailers_total: number;
  retailers_stocking: number;
  retailers_trained: number;
  retailers_compliant: number;
  villages_total: number;
  villages_covered: number;
}

export function channelReadinessScore(i: ChannelReadinessInput): ScoreBreakdown {
  const r = (a: number, b: number) => (b > 0 ? clamp(a / b, 0, 1) : 0);
  const comps = [
    { name: 'Retailers stocking the product', value: r(i.retailers_stocking, i.retailers_total), weight: 0.4 },
    { name: 'Retailers trained', value: r(i.retailers_trained, i.retailers_total), weight: 0.2 },
    { name: 'Licence / compliance', value: r(i.retailers_compliant, i.retailers_total), weight: 0.2 },
    { name: 'Village coverage', value: r(i.villages_covered, i.villages_total), weight: 0.2 },
  ].map((c) => ({ ...c, contribution: c.value * c.weight * 100 }));
  return {
    score: Math.round(comps.reduce((a, c) => a + c.contribution, 0)),
    components: comps,
    rule: 'Channel readiness = 40% stocking + 20% trained + 20% compliant + 20% village coverage',
  };
}

// Demand-vs-supply (S5.2): coverage and gap.
export function supplyCoverage(demand: number, available: number, inTransit: number, timeAdjust = 0) {
  const usable = available + inTransit - timeAdjust;
  const gap = Math.max(demand - usable, 0);
  return {
    total_usable: usable,
    gap,
    coverage: demand > 0 ? Math.min(usable / demand, 1) : 1,
  };
}

// Stock confidence by source (S5.2 scorecard).
export function stockConfidence(source: string): 'High' | 'Medium' | 'Low' {
  switch (source) {
    case 'erp_confirmed':
      return 'High';
    case 'reported':
      return 'Medium';
    default:
      return 'Low';
  }
}

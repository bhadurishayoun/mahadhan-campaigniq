import type { PlanInput, PlanResult } from './types';
import { calculatePlan } from './plan';

export interface CheaperMove {
  from_activity_type_id: number;
  to_activity_type_id: number;
  shifted_share: number;
  budget_after: number;
}

export interface CheaperMixResult {
  needed: boolean;
  improved: boolean;
  before: PlanResult;
  after: PlanResult;
  suggested_shares: { activity_type_id: number; share_pct: number }[];
  moves: CheaperMove[];
}

// If the spend ratio is red, move share from the highest cost-per-convert activity
// to the lowest (c / (r*k)) and re-run steps 4-7 until the plan fits the cap.
export function suggestCheaperMix(input: PlanInput, step = 0.05, maxIter = 100): CheaperMixResult {
  const before = calculatePlan(input);
  const spendRed = (p: PlanResult) => p.spend_ratio > p.spend_cap_pct;
  if (!spendRed(before)) {
    return {
      needed: false,
      improved: false,
      before,
      after: before,
      suggested_shares: input.lines.map((l) => ({
        activity_type_id: l.activity.activity_type_id,
        share_pct: l.share_pct,
      })),
      moves: [],
    };
  }

  let lines = input.lines.map((l) => ({ ...l }));
  let current = before;
  const moves: CheaperMove[] = [];

  for (let i = 0; i < maxIter && spendRed(current); i++) {
    const usable = lines.filter((l) => l.activity.r * l.activity.k > 0);
    const cpc = (l: (typeof lines)[number]) => l.activity.c / (l.activity.r * l.activity.k);
    const donors = usable
      .filter((l) => l.share_pct > 1e-9)
      .sort((a, b) => cpc(b) - cpc(a));
    const best = usable.reduce((a, b) => (cpc(b) < cpc(a) ? b : a));

    // Counts are rounded up (ceil), so one small shift may not change the budget.
    // Try progressively larger shifts from the most expensive donor first.
    let accepted: { lines: typeof lines; next: PlanResult; from: (typeof lines)[number]; move: number } | null = null;
    for (const worst of donors) {
      if (worst === best || cpc(worst) <= cpc(best) + 1e-12) continue;
      const maxMult = Math.ceil(worst.share_pct / step - 1e-9);
      for (let mult = 1; mult <= maxMult && !accepted; mult++) {
        const move = Math.min(step * mult, worst.share_pct);
        const trial = lines.map((l) =>
          l === worst
            ? { ...l, share_pct: l.share_pct - move }
            : l === best
              ? { ...l, share_pct: l.share_pct + move }
              : l,
        );
        const next = calculatePlan({ ...input, lines: trial });
        if (next.budget_total < current.budget_total - 1e-9) {
          accepted = { lines: trial, next, from: worst, move };
        }
      }
      if (accepted) break;
    }
    if (!accepted) break;

    lines = accepted.lines;
    current = accepted.next;
    moves.push({
      from_activity_type_id: accepted.from.activity.activity_type_id,
      to_activity_type_id: best.activity.activity_type_id,
      shifted_share: accepted.move,
      budget_after: accepted.next.budget_total,
    });
  }

  return {
    needed: true,
    improved: current.budget_total < before.budget_total - 1e-9,
    before,
    after: current,
    suggested_shares: lines.map((l) => ({
      activity_type_id: l.activity.activity_type_id,
      share_pct: l.share_pct,
    })),
    moves,
  };
}

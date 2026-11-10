import type { SegmentRule } from './types';

export function penetration(currentTreatedPct: number, ampPct: number): number {
  if (ampPct <= 0) return 0;
  return currentTreatedPct / ampPct;
}

// Step 1: pick the segment_rule row where min_pen <= penetration < max_pen.
export function assignSegment(pen: number, rules: SegmentRule[]): SegmentRule {
  const sorted = [...rules].sort((a, b) => a.min_pen - b.min_pen);
  const hit = sorted.find((r) => pen >= r.min_pen && pen < r.max_pen);
  if (hit) return hit;
  // Anything beyond the last band belongs to the last segment.
  return sorted[sorted.length - 1];
}

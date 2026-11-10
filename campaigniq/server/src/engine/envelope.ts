import { sum } from './num';

export type Bucket = 'proven' | 'scaling' | 'pilot';

export interface EnvelopeRow {
  bucket: Bucket;
  budget: number;
}

export interface EnvelopeTarget {
  proven: number;
  scaling: number;
  pilot: number;
}

export const DEFAULT_ENVELOPE: EnvelopeTarget = { proven: 0.7, scaling: 0.2, pilot: 0.1 };

export interface EnvelopeResult {
  total: number;
  buckets: {
    bucket: Bucket;
    budget: number;
    share: number;
    target: number;
    deviation_pp: number;
    flagged: boolean;
  }[];
}

// Step 8: region / BU 70-20-10 view. Flag any bucket off target by more than `tolerancePp` points.
export function envelopeSplit(
  rows: EnvelopeRow[],
  target: EnvelopeTarget = DEFAULT_ENVELOPE,
  tolerancePp = 5,
): EnvelopeResult {
  const total = sum(rows.map((r) => r.budget));
  const buckets = (['proven', 'scaling', 'pilot'] as Bucket[]).map((bucket) => {
    const budget = sum(rows.filter((r) => r.bucket === bucket).map((r) => r.budget));
    const share = total > 0 ? budget / total : 0;
    const deviation_pp = (share - target[bucket]) * 100;
    return {
      bucket,
      budget,
      share,
      target: target[bucket],
      deviation_pp,
      flagged: total > 0 && Math.abs(deviation_pp) > tolerancePp + 1e-9,
    };
  });
  return { total, buckets };
}

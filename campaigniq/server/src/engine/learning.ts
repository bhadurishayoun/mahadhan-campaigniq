// 5.8 Learning conversion rates from the call-centre loop.
// k_learned = (k_default * m + positives) / (m + calls)

export interface LearnedK {
  k: number;
  source: 'default' | 'learned';
  sample_size: number;
}

export function learnedK(kDefault: number, calls: number, positives: number, m = 50): LearnedK {
  if (calls <= 0) return { k: kDefault, source: 'default', sample_size: 0 };
  return {
    k: (kDefault * m + positives) / (m + calls),
    source: 'learned',
    sample_size: calls,
  };
}

// Deterministic call-back sampling: pick ~pct of today's contacts using a stable hash,
// so re-running the job for the same day gives the same sample.
export function sampleContacts<T extends { id: number }>(contacts: T[], pct: number, seed: string): T[] {
  if (pct >= 1) return [...contacts];
  return contacts.filter((c) => hash01(`${seed}:${c.id}`) < pct);
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

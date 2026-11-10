// Small numeric helpers used by the engine.

// Tolerant ceil: 22.5 / 7.5 may come out as 3.0000000000000004 in floating point.
export function safeCeil(x: number, eps = 1e-9): number {
  return Math.ceil(x - eps);
}

export function round(x: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((x + Number.EPSILON) * f) / f;
}

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

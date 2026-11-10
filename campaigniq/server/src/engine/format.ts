// Display formatting. Raw numbers stay in separate fields; these are for *_display fields only.

export function formatIndian(n: number, dp = 0): string {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(dp);
  const [intPart, frac] = fixed.split('.');
  let out: string;
  if (intPart.length <= 3) {
    out = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = `${rest},${last3}`;
  }
  return `${neg ? '-' : ''}${out}${frac ? '.' + frac : ''}`;
}

export function formatINR(n: number, dp = 0): string {
  return `₹${formatIndian(n, dp)}`;
}

// ₹1.53 L, ₹6.4 Cr
export function formatLakhCr(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)} L`;
  return `${sign}₹${formatIndian(abs)}`;
}

function trim(x: number): string {
  const r = Math.round(x * 100 + 1e-7) / 100;
  return r.toFixed(2).replace(/\.?0+$/, '');
}

export function formatPct(fraction: number, dp = 0): string {
  return `${(fraction * 100).toFixed(dp)}%`;
}

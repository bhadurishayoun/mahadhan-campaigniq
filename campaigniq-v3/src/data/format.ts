/** Number formatting (Indian conventions). Money is stored in lakh (₹ L) throughout the data module. */
const IN = new Intl.NumberFormat('en-IN');

export const num = (n: number) => IN.format(Math.round(n));

/** ₹ lakh, e.g. 72 → "₹72 L"; fractional lakh keep up to 1 decimal (31.2 → "₹31.2 L"). */
export const lakh = (l: number, dp?: number) => {
  const d = dp ?? (Number.isInteger(l) ? 0 : 1);
  return `₹${l.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })} L`;
};

/** ₹ crore from lakh, e.g. 190 → "₹1.90 Cr"; dp 1 for business (ABP) values, 2 for marketing money. */
export const crore = (l: number, dp = 2) => `₹${(l / 100).toFixed(dp)} Cr`;

/** Plain rupees, e.g. 9474 → "₹9,474". */
export const rupees = (r: number) => `₹${num(r)}`;

export const pct = (p: number, dp = 1) => `${p.toFixed(dp)}%`;
export const pp = (v: number, dp = 0) => `${v > 0 ? '+' : v < 0 ? '–' : ''}${Math.abs(v).toFixed(dp)} pp`;
export const times = (x: number) => `${x >= 0 ? '+' : '–'}${Math.abs(x).toFixed(2)}×`;
export const ratio = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);
export const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);

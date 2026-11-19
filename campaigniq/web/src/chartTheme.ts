/** Shared chart styling: one place for series colours, segment colours, axis/grid/tooltip styles and number formats. */
export const SERIES = ['var(--data-actual)', 'var(--data-plan)', 'var(--data-baseline)', 'var(--data-forecast)', 'var(--crop-onion)', 'var(--crop-maize)'] as const;
export const SEGMENT = { Emerging: 'var(--segment-emerging)', Growing: 'var(--segment-growing)', Maturing: 'var(--segment-maturing)', Matured: 'var(--segment-matured)' } as const;
export const STATUS = { ok: 'var(--ok)', warn: 'var(--warn)', risk: 'var(--risk)', info: 'var(--info)', muted: 'var(--neutral)' } as const;
export const CROP = { Onion: 'var(--crop-onion)', Maize: 'var(--crop-maize)', Soybean: 'var(--crop-soybean)', Cotton: 'var(--crop-cotton)' } as const;
export const PRODUCT = { Croptek: 'var(--product-croptek)', 'Water Soluble': 'var(--product-water-soluble)', Specialty: 'var(--product-specialty)' } as const;

export const axisStyle = { fontSize: 'var(--fs-caption)', fill: 'var(--ink-600)' } as const;
export const gridStyle = { stroke: 'var(--line)', strokeDasharray: '3 3' } as const;
export const tooltipStyle = {
  contentStyle: { border: '1px solid var(--line)', borderRadius: 10, fontSize: 'var(--fs-caption)', boxShadow: 'var(--sh-1)' },
  labelStyle: { fontWeight: 600, color: 'var(--ink-900)' },
  cursor: { fill: 'var(--brand-50)' },
} as const;

/** Rupees -> "₹4.2 L" / "₹1.9 Cr" (en-IN). Input is in rupees. */
export function fmtINR(rupees: number, digits = 1): string {
  const n = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  if (n >= 1e7) return `${sign}₹${(n / 1e7).toFixed(digits)} Cr`;
  if (n >= 1e5) return `${sign}₹${(n / 1e5).toFixed(digits)} L`;
  return `${sign}₹${n.toLocaleString('en-IN')}`;
}
/** Value already expressed in lakhs -> formatted rupee string. */
export const fmtLakh = (lakh: number, digits = 1) => fmtINR(lakh * 1e5, digits);
export const fmtPct = (v: number, digits = 0) => `${v.toFixed(digits)}%`;
export const fmtNum = (v: number) => v.toLocaleString('en-IN');

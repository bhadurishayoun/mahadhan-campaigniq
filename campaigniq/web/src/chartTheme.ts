/** Shared chart styling: one place for series colours, segment colours, axis/grid/tooltip styles and number formats. */
export const SERIES = ['var(--data-actual)', 'var(--data-plan)', 'var(--data-baseline)', 'var(--data-forecast)', 'var(--crop-onion)', 'var(--crop-maize)'] as const;
export const SEGMENT = { Emerging: 'var(--segment-emerging)', Growing: 'var(--segment-growing)', Maturing: 'var(--segment-maturing)', Matured: 'var(--segment-matured)' } as const;
export const STATUS = { ok: 'var(--ok)', warn: 'var(--warn)', risk: 'var(--risk)', info: 'var(--info)', muted: 'var(--neutral)' } as const;
export const CROP = { Onion: 'var(--crop-onion)', Maize: 'var(--crop-maize)', Soybean: 'var(--crop-soybean)', Cotton: 'var(--crop-cotton)' } as const;
export const PRODUCT = { Croptek: 'var(--product-croptek)', 'Water Soluble': 'var(--product-water-soluble)', Specialty: 'var(--product-specialty)', 'Product A': 'color-mix(in srgb, var(--product-specialty) 75%, var(--surface))', 'Product B': 'color-mix(in srgb, var(--product-specialty) 55%, var(--surface))', 'Product C': 'color-mix(in srgb, var(--product-specialty) 38%, var(--surface))' } as const;

export const axisStyle = { fontSize: 'var(--fs-caption)', fill: 'var(--ink-600)' } as const;
export const gridStyle = { stroke: 'var(--line)', strokeDasharray: '3 3' } as const;
export const tooltipStyle = {
  contentStyle: { border: '1px solid var(--line)', borderRadius: 10, fontSize: 'var(--fs-caption)', boxShadow: 'var(--sh-1)' },
  labelStyle: { fontWeight: 600, color: 'var(--ink-900)' },
  cursor: { fill: 'var(--brand-50)' },
} as const;

/** Rupees -> "₹4.20 L" / "₹1.90 Cr" (en-IN). Input is in rupees. */
export function fmtINR(rupees: number, digits = 2): string {
  const n = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  if (n >= 1e7) return `${sign}₹${(n / 1e7).toFixed(digits)} Cr`;
  if (n >= 1e5) return `${sign}₹${(n / 1e5).toFixed(digits)} L`;
  return `${sign}₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
/** Value already expressed in lakhs -> formatted rupee string. */
export const fmtLakh = (lakh: number, digits = 2) => fmtINR(lakh * 1e5, digits);
export const fmtPct = (v: number, digits = 0) => `${v.toFixed(digits)}%`;
export const fmtNum = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const fmtX = (v: number) => `${v.toFixed(2)}×`;

/** The one chart config for every RankedBars / GroupedColumns / TrendLine / DonutMetric / HeatGrid (see CLAUDE.md §3). */
export const chartTheme = {
  planned: 'var(--data-plan)',
  actual: 'var(--data-actual)',
  series: SERIES,
  barSize: 14,
  radius: 0,
  axis: { tick: { fontSize: 12, fill: 'var(--axis-ink)' }, axisLine: { stroke: 'var(--line)' }, tickLine: false },
  grid: { stroke: 'var(--line)', strokeDasharray: '3 3', vertical: false },
  tooltip: tooltipStyle,
  legend: { verticalAlign: 'top' as const, align: 'right' as const, iconType: 'square' as const, iconSize: 10, wrapperStyle: { fontSize: 12, color: 'var(--axis-ink)', paddingBottom: 8 } },
  margin: { top: 4, right: 12, bottom: 0, left: 0 },
  heat: (share: number) => `color-mix(in srgb, var(--brand-700) ${Math.round(12 + Math.max(0, Math.min(1, share)) * 78)}%, var(--brand-50))`,
  heatInk: (share: number) => (share > 0.5 ? 'var(--surface)' : 'var(--ink-900)'),
  /** Brand tints for ranked parts of a whole: rank 0 (largest) = brand-700, fading towards brand-100. */
  tint: (rank: number, count: number) => (rank === 0 ? 'var(--brand-700)' : `color-mix(in srgb, var(--brand-700) ${Math.round(100 - (rank / Math.max(1, count - 1)) * 62)}%, var(--brand-100))`),
  /** Neutral colour for a 'base' part (e.g. last-year base under a growth gap). */
  base: 'var(--data-baseline)',
  /** Soft fill for the gap between a plan line and an actual line. */
  gapFill: 'var(--risk-bg)',
  /** Fixed colours for the TM.C1 growth priorities. */
  priority: { onion: 'var(--brand-700)', maize: 'var(--data-plan)', retail: 'var(--data-baseline)' } as Record<string, string>,
} as const;

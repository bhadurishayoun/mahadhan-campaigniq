/** Shared chart styling: one place for series colours, segment colours, axis/grid/tooltip styles and number formats. */
export const SERIES = ['#2f8a3b', '#3972b8', '#d7a62f', '#7a58c4', '#c9865a', '#5fae4c'] as const;
export const SEGMENT = { Emerging: '#e8c13a', Growing: '#5fae4c', Maturing: '#3972b8', Matured: '#1f5f2c' } as const;
export const STATUS = { ok: '#2f8a3b', warn: '#d7a62f', risk: '#d9534f', info: '#3972b8', muted: '#b8c3b8' } as const;

export const axisStyle = { fontSize: 11, fill: '#66736a' } as const;
export const gridStyle = { stroke: '#e1e8dc', strokeDasharray: '3 3' } as const;
export const tooltipStyle = {
  contentStyle: { border: '1px solid #e1e8dc', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 14px rgba(23,39,27,.12)' },
  labelStyle: { fontWeight: 600, color: '#1d2a1f' },
  cursor: { fill: 'rgba(47,138,59,.06)' },
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

/** Flat two-tone KPI icons (viewBox 32, drawn at 32px, no tile). Colours from theme.ts. */
import type { ReactNode } from 'react';
import { C } from '../theme';

const G = C.amber; // gold
const D = C.amberDark; // dark gold
const N = C.brand; // green
const W = C.card;

export type KpiIconName =
  | 'target' | 'coins' | 'moneybag' | 'wallet' | 'megaphone' | 'farmers' | 'sales' | 'roi'
  | 'gauge' | 'alert' | 'checklist' | 'swap' | 'sprout' | 'store' | 'pin';

const RUPEE = (x: number, y: number, s: number, fill: string) => (
  <text x={x} y={y} textAnchor="middle" fontSize={s} fontWeight={700} fill={fill} fontFamily="Inter, Arial, sans-serif">₹</text>
);

const PATHS: Record<KpiIconName, ReactNode> = {
  target: <>
    <circle cx="15" cy="17" r="12" fill={N} /><circle cx="15" cy="17" r="8.5" fill={W} /><circle cx="15" cy="17" r="5.5" fill={N} />
    <circle cx="15" cy="17" r="2.6" fill={G} /><path d="M15 17 L27 5" stroke={D} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M24 3 L29 3 L29 8 L27 5 Z" fill={G} />
  </>,
  coins: <>
    <ellipse cx="16" cy="25" rx="10" ry="3.5" fill={D} /><rect x="6" y="19" width="20" height="6" fill={D} /><ellipse cx="16" cy="19" rx="10" ry="3.5" fill={G} />
    <ellipse cx="16" cy="15" rx="10" ry="3.5" fill={D} /><rect x="6" y="9" width="20" height="6" fill={D} /><ellipse cx="16" cy="9" rx="10" ry="3.5" fill={G} />
  </>,
  moneybag: <>
    <path d="M12 4 h8 l-2.5 5 h-3 z" fill={D} /><path d="M13 9 h6 c6 3 9 8 9 13 c0 5 -4 7 -12 7 s-12 -2 -12 -7 c0 -5 3 -10 9 -13 z" fill={G} />
    {RUPEE(16, 25, 12, N)}
  </>,
  wallet: <>
    <rect x="3" y="8" width="24" height="18" rx="3" fill={G} /><path d="M5 8 L21 3 L23 8 Z" fill={D} />
    <rect x="19" y="13" width="10" height="8" rx="2" fill={N} /><circle cx="23" cy="17" r="1.6" fill={W} />
  </>,
  megaphone: <>
    <path d="M4 13 h5 l12 -7 v20 l-12 -7 h-5 z" fill={N} /><rect x="7" y="19" width="4" height="8" rx="1.5" fill={N} />
    <path d="M24 11 q3 5 0 10" stroke={G} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M27 8 q5 8 0 16" stroke={G} strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </>,
  farmers: <>
    <circle cx="7" cy="11" r="3.5" fill={N} /><path d="M1 26 c0 -6 3 -9 6 -9 s6 3 6 9 z" fill={N} />
    <circle cx="25" cy="11" r="3.5" fill={N} /><path d="M19 26 c0 -6 3 -9 6 -9 s6 3 6 9 z" fill={N} />
    <circle cx="16" cy="9" r="4.2" fill={G} /><path d="M8.5 28 c0 -7 3.5 -11 7.5 -11 s7.5 4 7.5 11 z" fill={G} />
  </>,
  sales: <>
    <rect x="4" y="18" width="5" height="10" rx="1" fill={G} /><rect x="12" y="13" width="5" height="15" rx="1" fill={G} /><rect x="20" y="8" width="5" height="20" rx="1" fill={D} />
    <path d="M3 15 L11 9 L17 11 L28 3" stroke={N} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 3 h4.5 v4.5" stroke={N} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </>,
  roi: <>
    <circle cx="16" cy="16" r="13" fill={G} /><circle cx="16" cy="16" r="10" fill="none" stroke={D} strokeWidth="1.6" />
    {RUPEE(16, 22, 15, N)}
  </>,
  gauge: <>
    <path d="M4 22 A12 12 0 0 1 28 22" stroke={N} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M16 22 L23 12" stroke={G} strokeWidth="2.6" strokeLinecap="round" /><circle cx="16" cy="22" r="3" fill={D} />
  </>,
  alert: <>
    <path d="M16 3 L30 28 H2 Z" fill={G} stroke={D} strokeWidth="1" strokeLinejoin="round" />
    <rect x="14.5" y="11" width="3" height="9" rx="1.2" fill={N} /><circle cx="16" cy="23.5" r="1.8" fill={N} />
  </>,
  checklist: <>
    <rect x="5" y="5" width="22" height="25" rx="3" fill={N} /><rect x="11" y="2.5" width="10" height="5" rx="1.5" fill={D} />
    <path d="M9 14 l2 2 l3.5 -3.5 M9 22 l2 2 l3.5 -3.5" stroke={G} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="17" y="13.5" width="6" height="2" rx="1" fill={W} /><rect x="17" y="21.5" width="6" height="2" rx="1" fill={W} />
  </>,
  swap: <>
    <path d="M4 11 H24" stroke={N} strokeWidth="2.6" strokeLinecap="round" /><path d="M20 6 L26 11 L20 16" stroke={N} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 21 H8" stroke={N} strokeWidth="2.6" strokeLinecap="round" /><path d="M12 16 L6 21 L12 26" stroke={N} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  sprout: <>
    <path d="M3 25 h26 l-3 5 h-20 z" fill={G} /><path d="M16 25 V14" stroke={N} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M16 15 C16 8 11 5 5 5 C5 11 9 15 16 15 Z" fill={N} /><path d="M16 13 C16 7 20 4 27 4 C27 10 23 13 16 13 Z" fill={N} />
  </>,
  store: <>
    <rect x="5" y="13" width="22" height="16" fill={W} stroke={D} strokeWidth="1.4" /><path d="M3 6 h26 l-2 8 h-22 z" fill={G} />
    <path d="M9.5 6 l-1 8 M16 6 v8 M22.5 6 l1 8" stroke={D} strokeWidth="1.2" /><rect x="13" y="19" width="6" height="10" fill={N} />
  </>,
  pin: <>
    <path d="M16 30 C16 30 5 19 5 12 a11 11 0 0 1 22 0 C27 19 16 30 16 30 Z" fill={N} /><circle cx="16" cy="12" r="4.2" fill={G} />
  </>,
};

/** Icon chosen from the KPI label (first match wins). */
const RULES: [RegExp, KpiIconName][] = [
  [/roi/i, 'roi'],
  [/gap|variance|shortfall/i, 'alert'],
  [/utilisation|execution|complet/i, 'gauge'],
  [/trial|conversion/i, 'sprout'],
  [/retail/i, 'store'],
  [/incremental|sales|uplift/i, 'sales'],
  [/unspent/i, 'wallet'],
  [/transfer/i, 'swap'],
  [/budget|approved/i, 'moneybag'],
  [/investment/i, 'coins'],
  [/achievement|abp/i, 'target'],
  [/campaign/i, 'megaphone'],
  [/adopt|farmer/i, 'farmers'],
  [/\baction|draft|awaiting|closed|review|clarification/i, 'checklist'],
  [/territor|region|village/i, 'pin'],
];

export const kpiIconFor = (label: string): KpiIconName => RULES.find(([re]) => re.test(label))?.[1] ?? 'target';

export function KpiIcon({ name }: { name: KpiIconName }) {
  return <svg width={32} height={32} viewBox="0 0 32 32" aria-hidden="true" style={{ flex: 'none' }}>{PATHS[name]}</svg>;
}

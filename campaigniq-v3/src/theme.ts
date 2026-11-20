/** The only place colour values live. `applyTheme()` publishes them as CSS variables (styles.css uses var(--…)). */
export const C = {
  brand: '#1F6B3A',
  dark: '#123D24',
  tint: '#E3F1E7',
  light: '#A9D5B5',
  amber: '#E0A82E',
  amberSoft: '#FBF0DC',
  amberInk: '#8A5A00',
  risk: '#C0392B',
  riskSoft: '#FBE9E7',
  neutral: '#EEF1F0',
  ink: '#1A2620',
  inkSoft: '#4B5A53',
  muted: '#6F7C75',
  line: '#E3E8E5',
  canvas: '#F5F7F6',
  card: '#FFFFFF',
  overlay: 'rgba(18, 61, 36, 0.45)',
} as const;

/** Chart series mapping, fixed across the workspace. */
export const SERIES = {
  planned: C.brand,
  plannedSoft: C.light,
  observed: C.amber,
} as const;

const CSS_NAMES: Record<keyof typeof C, string> = {
  brand: '--brand', dark: '--dark', tint: '--tint', light: '--light', amber: '--amber', amberSoft: '--amber-soft',
  amberInk: '--amber-ink', risk: '--risk', riskSoft: '--risk-soft', neutral: '--neutral', ink: '--ink',
  inkSoft: '--ink-soft', muted: '--muted', line: '--line', canvas: '--canvas', card: '--card', overlay: '--overlay',
};

export function applyTheme() {
  const root = document.documentElement.style;
  (Object.keys(C) as (keyof typeof C)[]).forEach((k) => root.setProperty(CSS_NAMES[k], C[k]));
}

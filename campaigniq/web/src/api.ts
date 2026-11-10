import { useSyncExternalStore } from 'react';

/**
 * Backend address.
 *  - Local development (`npm run dev`): http://localhost:8000/api unless VITE_API_URL is set.
 *  - Published build: VITE_API_URL is injected by the GitHub Actions workflow from the repository variable of the
 *    same name (e.g. https://mahadhan-campaigniq-api.onrender.com/api). When it is not set, the site runs as a pure
 *    static demo: no API requests are made, so visitors see no failing network calls or console errors.
 */
const configuredApi = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
export const API_BASE = configuredApi || (import.meta.env.DEV ? 'http://localhost:8000/api' : '');
export const API_ENABLED = API_BASE !== '';
export const API_DISABLED_MESSAGE = 'The live backend is not connected to this published demo (see README → Deployment).';

/** Every API call is recorded so the prototype can show the frontend <-> backend traffic live. */
export interface ApiCall { id: number; method: string; path: string; status: number | 'ERR'; ms: number; at: number; detail?: string }
let callLog: ApiCall[] = [];
let callSeq = 0;
const logListeners = new Set<() => void>();
function recordCall(call: Omit<ApiCall, 'id'>) {
  callLog = [{ ...call, id: ++callSeq }, ...callLog].slice(0, 60);
  logListeners.forEach((listener) => listener());
}
export function useApiLog(): ApiCall[] {
  return useSyncExternalStore((listener) => { logListeners.add(listener); return () => logListeners.delete(listener); }, () => callLog);
}
export function clearApiLog() {
  callLog = [];
  logListeners.forEach((listener) => listener());
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const started = performance.now();
  if (!API_ENABLED) {
    recordCall({ method, path, status: 'ERR', ms: 0, at: Date.now(), detail: 'No backend configured' });
    throw new Error(API_DISABLED_MESSAGE);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    recordCall({ method, path, status: 'ERR', ms: Math.round(performance.now() - started), at: Date.now(), detail: 'API unreachable' });
    throw error;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === 'string' ? body.detail : body?.error ?? `Request failed (${response.status})`;
    recordCall({ method, path, status: response.status, ms: Math.round(performance.now() - started), at: Date.now(), detail });
    throw new Error(detail);
  }
  recordCall({ method, path, status: response.status, ms: Math.round(performance.now() - started), at: Date.now() });
  return response.json() as Promise<T>;
}

export function query(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

export const money = (value: number | null | undefined) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);

export const number = (value: number | null | undefined, digits = 0) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);

export const percent = (value: number | null | undefined, digits = 0) =>
  value == null ? '—' : `${(value * 100).toFixed(digits)}%`;

export interface Filters {
  seasons: Array<{ id: number; name: string }>;
  crops: Array<{ id: number; name: string; stage_anchor: string }>;
  products: Array<{ id: number; name: string; crop_id: number; pack_kg: number; price_per_pack: number; dose_packs_per_acre: number; placeholder: number }>;
  geography: Array<{ id: number; name: string; level: string; parent_id: number | null; parent_name: string | null }>;
}

export interface MarketUnit {
  mu_id: number;
  mu_name: string;
  district: string;
  crop: string;
  crop_area_acres: number;
  amp_pct: number;
  current_treated_pct: number;
  current_area: number;
  amp_area: number;
  headroom_acres: number;
  penetration: number;
  segment: string;
  objective: string;
  spend_cap_pct: number;
  competition_note: string;
  soil_deficiency: string[];
  rainfall_dev_pct: number;
  active_dealers: number;
  source: string;
  as_of_date: string;
  stale: boolean;
}

export interface PlanLine {
  activity_type_id: number;
  name: string;
  kind: string;
  bucket: string;
  share_pct: number;
  r: number;
  k: number;
  c: number;
  r_source?: string;
  k_source?: string;
  k_sample_size?: number | null;
  farmers_i: number;
  converts_per_unit: number;
  n: number;
  budget: number;
  budget_pre: number;
  budget_on: number;
  budget_post: number;
  phase_split_pre: number;
  phase_split_on: number;
  phase_split_post: number;
  planned_converts: number;
}

export interface Check {
  check_name: string;
  value: number | null;
  limit: number | null;
  status: 'green' | 'amber' | 'red';
  info?: boolean;
  message: string;
}

export interface Plan {
  mode: string;
  segment: string;
  objective: string;
  penetration: number;
  spend_cap_pct: number;
  current_area: number;
  target_area: number;
  incremental_area: number;
  y_packs: number;
  y_tons: number;
  incremental_packs: number;
  incremental_value: number;
  total_value: number;
  farmers_to_convert: number;
  lines: PlanLine[];
  total_units: number;
  budget: number;
  budget_total: number;
  budget_pre: number;
  budget_on: number;
  budget_post: number;
  spend_ratio: number;
  cost_per_farmer: number;
  cost_per_acre: number;
  cost_per_pack: number;
  planned_converts: number;
  checks: Check[];
  can_submit: boolean;
}

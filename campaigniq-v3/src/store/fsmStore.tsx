/**
 * Field Sales Manager state: top-bar scope, plan submission and the campaign wizard entries.
 * Kept in sessionStorage so going back through the wizard keeps what was entered.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FsmScope } from '../data/fsm';
import type { FsmTerritoryId } from '../routes';

export interface FsmState {
  scope: FsmScope;
  /** Territories whose business and crop plan was submitted for Zonal Manager review. */
  submitted: FsmTerritoryId[];
  /** Edited proposed dealer targets (₹ L) by dealer id. */
  targets: Record<string, number>;
  /** Edited village onion plans (₹ L) by `territory:village`. */
  onionPlan: Record<string, number>;
  /** Review notes per territory. */
  notes: Record<string, string>;
  wizard: Record<string, unknown>;
}

const KEY = 'campaigniq.v3.fsm.2';
const INITIAL: FsmState = { scope: 'cluster', submitted: [], targets: {}, onionPlan: {}, notes: {}, wizard: {} };

function load(): FsmState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<FsmState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface FsmStore extends FsmState {
  setScope: (s: FsmScope) => void;
  submitPlan: (t: FsmTerritoryId) => void;
  setTargets: (patch: Record<string, number>) => void;
  setOnionPlan: (key: string, v: number) => void;
  setNotes: (t: FsmTerritoryId, text: string) => void;
  setWizard: (patch: Record<string, unknown>) => void;
}

const Ctx = createContext<FsmStore | null>(null);

export function FsmStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FsmState>(load);
  useEffect(() => {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
  const value = useMemo<FsmStore>(() => ({
    ...state,
    setScope: (scope) => setState((s) => ({ ...s, scope })),
    submitPlan: (t) => setState((s) => ({ ...s, submitted: s.submitted.includes(t) ? s.submitted : [...s.submitted, t] })),
    setTargets: (patch) => setState((s) => ({ ...s, targets: { ...s.targets, ...patch } })),
    setOnionPlan: (key, v) => setState((s) => ({ ...s, onionPlan: { ...s.onionPlan, [key]: v } })),
    setNotes: (t, text) => setState((s) => ({ ...s, notes: { ...s.notes, [t]: text } })),
    setWizard: (patch) => setState((s) => ({ ...s, wizard: { ...s.wizard, ...patch } })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFsmStore(): FsmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFsmStore outside FsmStoreProvider');
  return v;
}

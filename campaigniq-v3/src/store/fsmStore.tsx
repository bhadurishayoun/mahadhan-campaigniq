/**
 * Field Sales Manager state: top-bar scope, plan submission and the campaign wizard entries.
 * Kept in sessionStorage so going back through the wizard keeps what was entered.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FsmScope } from '../data/fsm';

export interface FsmState {
  scope: FsmScope;
  planSubmitted: boolean;
  wizard: Record<string, unknown>;
}

const KEY = 'campaigniq.v3.fsm.1';
const INITIAL: FsmState = { scope: 'cluster', planSubmitted: false, wizard: {} };

function load(): FsmState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<FsmState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface FsmStore extends FsmState {
  setScope: (s: FsmScope) => void;
  setPlanSubmitted: (v: boolean) => void;
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
    setPlanSubmitted: (planSubmitted) => setState((s) => ({ ...s, planSubmitted })),
    setWizard: (patch) => setState((s) => ({ ...s, wizard: { ...s.wizard, ...patch } })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFsmStore(): FsmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFsmStore outside FsmStoreProvider');
  return v;
}

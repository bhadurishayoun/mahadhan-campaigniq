/**
 * Marketing Head state: top-bar scope, plus the review, investigation, theme, approval and rollout records added phase by phase.
 * Kept in sessionStorage, like the Field Sales Manager and Zonal Manager stores.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MhPlanStatus } from '../data/mh';

export type MhScope = 'national' | 'west' | 'south' | 'north' | 'east';
export const MH_SCOPES: { id: MhScope; label: string }[] = [
  { id: 'national', label: 'National portfolio' },
  { id: 'west', label: 'West' },
  { id: 'south', label: 'South' },
  { id: 'north', label: 'North' },
  { id: 'east', label: 'East' },
];

export interface MhState {
  scope: MhScope;
  /** Plan review: status overrides (clarification), endorsed marketing requirements, opportunity shortlist and flag. */
  planStatus: Record<string, MhPlanStatus>;
  endorsed: string[];
  shortlist: string[];
  flagged: boolean;
}

const KEY = 'campaigniq.v3.mh.2';
const INITIAL: MhState = { scope: 'national', planStatus: {}, endorsed: [], shortlist: [], flagged: false };

function load(): MhState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<MhState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface MhStore extends MhState {
  setScope: (s: MhScope) => void;
  setPlanStatus: (id: string, st: MhPlanStatus) => void;
  endorse: (id: string) => void;
  addShortlist: (id: string) => void;
  flag: () => void;
}

const Ctx = createContext<MhStore | null>(null);

export function MhStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MhState>(load);
  useEffect(() => {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
  const value = useMemo<MhStore>(() => ({
    ...state,
    setScope: (scope) => setState((s) => ({ ...s, scope })),
    setPlanStatus: (id, st) => setState((s) => ({ ...s, planStatus: { ...s.planStatus, [id]: st } })),
    endorse: (id) => setState((s) => ({ ...s, endorsed: s.endorsed.includes(id) ? s.endorsed : [...s.endorsed, id] })),
    addShortlist: (id) => setState((s) => ({ ...s, shortlist: s.shortlist.includes(id) ? s.shortlist : [...s.shortlist, id] })),
    flag: () => setState((s) => ({ ...s, flagged: true })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMhStore(): MhStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMhStore outside MhStoreProvider');
  return v;
}

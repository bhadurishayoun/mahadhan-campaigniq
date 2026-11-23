/**
 * Marketing Head state: top-bar scope, plus the review, investigation, theme, approval and rollout records added phase by phase.
 * Kept in sessionStorage, like the Field Sales Manager and Zonal Manager stores.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
}

const KEY = 'campaigniq.v3.mh.1';
const INITIAL: MhState = { scope: 'national' };

function load(): MhState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<MhState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface MhStore extends MhState {
  setScope: (s: MhScope) => void;
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
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMhStore(): MhStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMhStore outside MhStoreProvider');
  return v;
}

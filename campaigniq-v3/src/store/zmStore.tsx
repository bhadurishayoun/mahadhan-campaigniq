/**
 * Zonal Manager state: top-bar scope and portfolio, plus the review, studio and approval records added phase by phase.
 * Kept in sessionStorage, like the Field Sales Manager store.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ZmPortfolio, ZmScope } from '../data/zm';

export interface ZmState {
  scope: ZmScope;
  portfolio: ZmPortfolio;
}

const KEY = 'campaigniq.v3.zm.1';
const INITIAL: ZmState = { scope: 'zone', portfolio: 'crop-nutrition' };

function load(): ZmState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<ZmState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface ZmStore extends ZmState {
  setScope: (s: ZmScope) => void;
  setPortfolio: (p: ZmPortfolio) => void;
}

const Ctx = createContext<ZmStore | null>(null);

export function ZmStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ZmState>(load);
  useEffect(() => {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
  const value = useMemo<ZmStore>(() => ({
    ...state,
    setScope: (scope) => setState((s) => ({ ...s, scope })),
    setPortfolio: (portfolio) => setState((s) => ({ ...s, portfolio })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZmStore(): ZmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZmStore outside ZmStoreProvider');
  return v;
}

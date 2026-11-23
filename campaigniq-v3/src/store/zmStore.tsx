/**
 * Zonal Manager state: top-bar scope and portfolio, plan review decisions, SKU mapping, Marketing Head questions,
 * plus the studio and approval records added phase by phase. Kept in sessionStorage, like the Field Sales Manager store.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MappingStatus, PlanStatus, QuestionStatus, ZmPortfolio, ZmScope } from '../data/zm';
import type { ZmTerritoryId } from '../routes';

export interface ZmState {
  scope: ZmScope;
  portfolio: ZmPortfolio;
  /** Zonal Manager decisions on territory plans (returned, endorsed). */
  planDecisions: Partial<Record<ZmTerritoryId, PlanStatus>>;
  /** SKU mapping status changes (validated, correction requested). */
  mapping: Partial<Record<ZmTerritoryId, MappingStatus>>;
  /** Mapping checks ticked in this session, by territory. */
  mappingChecks: Partial<Record<ZmTerritoryId, string[]>>;
  /** Saved review comments by key (e.g. `review:ambad`, `revised:ambad`). */
  comments: Record<string, string>;
  /** Crops validated per territory. */
  cropValidated: Partial<Record<ZmTerritoryId, string[]>>;
  /** Marketing Head question statuses and responses. */
  questions: Record<string, QuestionStatus>;
  responses: Record<string, string>;
}

const KEY = 'campaigniq.v3.zm.2';
const INITIAL: ZmState = { scope: 'zone', portfolio: 'crop-nutrition', planDecisions: {}, mapping: {}, mappingChecks: {}, comments: {}, cropValidated: {}, questions: {}, responses: {} };

function load(): ZmState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<ZmState>) } : INITIAL;
  } catch { return INITIAL; }
}

interface ZmStore extends ZmState {
  setScope: (s: ZmScope) => void;
  setPortfolio: (p: ZmPortfolio) => void;
  decidePlan: (t: ZmTerritoryId, s: PlanStatus) => void;
  setMapping: (t: ZmTerritoryId, s: MappingStatus) => void;
  setMappingChecks: (t: ZmTerritoryId, ids: string[]) => void;
  setComment: (key: string, text: string) => void;
  setCropValidated: (t: ZmTerritoryId, crops: string[]) => void;
  answer: (qid: string, response: string) => void;
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
    decidePlan: (t, st) => setState((s) => ({ ...s, planDecisions: { ...s.planDecisions, [t]: st } })),
    setMapping: (t, st) => setState((s) => ({ ...s, mapping: { ...s.mapping, [t]: st } })),
    setMappingChecks: (t, ids) => setState((s) => ({ ...s, mappingChecks: { ...s.mappingChecks, [t]: ids } })),
    setComment: (key, text) => setState((s) => ({ ...s, comments: { ...s.comments, [key]: text } })),
    setCropValidated: (t, crops) => setState((s) => ({ ...s, cropValidated: { ...s.cropValidated, [t]: crops } })),
    answer: (qid, response) => setState((s) => ({ ...s, questions: { ...s.questions, [qid]: 'responded' }, responses: { ...s.responses, [qid]: response } })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZmStore(): ZmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZmStore outside ZmStoreProvider');
  return v;
}

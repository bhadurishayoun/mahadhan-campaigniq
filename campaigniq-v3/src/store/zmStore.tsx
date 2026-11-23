/**
 * Zonal Manager state: top-bar scope and portfolio, plan review decisions, SKU mapping, Marketing Head questions,
 * plus the studio and approval records added phase by phase. Kept in sessionStorage, like the Field Sales Manager store.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Claim, Concept, MappingStatus, PlanStatus, PropositionField, QuestionStatus, ThemeStatus, ZmPortfolio, ZmScope } from '../data/zm';
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
  /** Theme status changes (acknowledged, clarification requested) and the acknowledgement record. */
  themeStatus: Record<string, ThemeStatus>;
  acknowledgements: Record<string, { owner: string; date: string; deliverables: string[] }>;
  clarifications: { themeId: string; topics: string[]; question: string; priority: string; due: string }[];
  /** Edited / added concepts (null = the original two) and the concepts selected for development. */
  concepts: Concept[] | null;
  selectedConcepts: string[];
  workspace: { intent: string; behaviour: string; notes: string };
  compareDecision: 'separate' | 'combine' | 'defer';
  proposition: Partial<Record<PropositionField, string>>;
  interventions: Record<string, InterventionConfig>;
  readinessChecks: string[];
  claims: Record<string, Partial<Claim>>;
}

export interface InterventionConfig { objective: string; behaviour: string; participants: string; types: string[]; channel: string; crop: string; geography: string; window: string; resources: string }

const KEY = 'campaigniq.v3.zm.3';
const INITIAL: ZmState = { scope: 'zone', portfolio: 'crop-nutrition', planDecisions: {}, mapping: {}, mappingChecks: {}, comments: {}, cropValidated: {}, questions: {}, responses: {},
  themeStatus: {}, acknowledgements: {}, clarifications: [], concepts: null, selectedConcepts: ['c1'],
  workspace: { intent: 'Drive eligible first-purchase conversion under Croptek.', behaviour: 'Move from recommendation or trial to first purchase.', notes: '' },
  compareDecision: 'separate', proposition: {}, interventions: {}, readinessChecks: [], claims: {} };

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
  setThemeStatus: (id: string, st: ThemeStatus) => void;
  acknowledge: (id: string, rec: { owner: string; date: string; deliverables: string[] }) => void;
  requestClarification: (c: ZmState['clarifications'][number]) => void;
  setConcepts: (c: Concept[]) => void;
  setSelectedConcepts: (ids: string[]) => void;
  setWorkspace: (w: ZmState['workspace']) => void;
  setCompareDecision: (d: ZmState['compareDecision']) => void;
  setProposition: (p: Partial<Record<PropositionField, string>>) => void;
  setIntervention: (stageId: string, c: InterventionConfig) => void;
  setReadinessChecks: (ids: string[]) => void;
  setClaim: (id: string, patch: Partial<Claim>) => void;
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
    setThemeStatus: (id, st) => setState((s) => ({ ...s, themeStatus: { ...s.themeStatus, [id]: st } })),
    acknowledge: (id, rec) => setState((s) => ({ ...s, themeStatus: { ...s.themeStatus, [id]: 'acknowledged' }, acknowledgements: { ...s.acknowledgements, [id]: rec } })),
    requestClarification: (c) => setState((s) => ({ ...s, themeStatus: { ...s.themeStatus, [c.themeId]: 'clarification_requested' }, clarifications: [c, ...s.clarifications] })),
    setConcepts: (c) => setState((s) => ({ ...s, concepts: c })),
    setSelectedConcepts: (ids) => setState((s) => ({ ...s, selectedConcepts: ids })),
    setWorkspace: (w) => setState((s) => ({ ...s, workspace: w })),
    setCompareDecision: (d) => setState((s) => ({ ...s, compareDecision: d })),
    setProposition: (p) => setState((s) => ({ ...s, proposition: { ...s.proposition, ...p } })),
    setIntervention: (id, c) => setState((s) => ({ ...s, interventions: { ...s.interventions, [id]: c } })),
    setReadinessChecks: (ids) => setState((s) => ({ ...s, readinessChecks: ids })),
    setClaim: (id, patch) => setState((s) => ({ ...s, claims: { ...s.claims, [id]: { ...s.claims[id], ...patch } } })),
    answer: (qid, response) => setState((s) => ({ ...s, questions: { ...s.questions, [qid]: 'responded' }, responses: { ...s.responses, [qid]: response } })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZmStore(): ZmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZmStore outside ZmStoreProvider');
  return v;
}

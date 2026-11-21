/**
 * Business Head workspace state shared across screens (React context + localStorage).
 * Holds what users change: scope, theme decisions, interventions, recommendations, scenarios, learning priorities.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initialInterventions, THEME_QUEUE, type Intervention, type RegionId, type ThemeStatus } from '../data/bh';

export type Scope = RegionId | 'national';

export interface ThemeDecision {
  themeId: string;
  choice: 'approve' | 'return' | 'clarify' | 'reject';
  comment: string;
  at: string;
  draft: boolean;
}

export interface Recommendation {
  id: string;
  name: string;
  geography: string;
  cropProduct: string;
  priority: string;
  linkedThemeId: string | null;
  status: 'draft' | 'sent';
  targets: Record<string, string>;
}

export interface Scenario {
  id: string;
  name: string;
  region: RegionId;
  from: string;
  to: string;
  amount: number;
}

interface State {
  scope: Scope;
  themeStatus: Record<string, ThemeStatus>;
  decisions: ThemeDecision[];
  interventions: Intervention[];
  recommendations: Recommendation[];
  scenarios: Scenario[];
  learningSubmitted: boolean;
}

const KEY = 'campaigniq.v3.bh';

const initial = (): State => ({
  scope: 'national',
  themeStatus: Object.fromEntries(THEME_QUEUE.map((t) => [t.id, t.status])),
  decisions: [],
  interventions: initialInterventions(),
  recommendations: [],
  scenarios: [],
  learningSubmitted: false,
});

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial();
    // Scope is never restored: every fresh open starts on all regions (national portfolio).
    return { ...initial(), ...(JSON.parse(raw) as Partial<State>), scope: 'national' };
  } catch {
    return initial();
  }
}

interface Toast { id: number; text: string }

interface Ctx extends State {
  setScope: (s: Scope) => void;
  decideTheme: (d: ThemeDecision) => void;
  addIntervention: (i: Intervention) => void;
  updateIntervention: (id: string, patch: Partial<Intervention>) => void;
  saveRecommendation: (r: Recommendation) => void;
  saveScenario: (s: Scenario) => void;
  submitLearning: () => void;
  reset: () => void;
  toast: (text: string) => void;
  toasts: Toast[];
}

const StoreCtx = createContext<Ctx | null>(null);

const STATUS_OF: Record<ThemeDecision['choice'], ThemeStatus> = {
  approve: 'approved', return: 'returned', clarify: 'clarification_requested', reject: 'rejected',
};

export function BhStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    toasts,
    toast,
    setScope: (scope) => setState((s) => (s.scope === scope ? s : { ...s, scope })),
    decideTheme: (d) => setState((s) => ({
      ...s,
      decisions: [...s.decisions.filter((x) => !(x.themeId === d.themeId && x.draft)), d],
      themeStatus: d.draft ? s.themeStatus : { ...s.themeStatus, [d.themeId]: STATUS_OF[d.choice] },
    })),
    addIntervention: (i) => setState((s) => ({ ...s, interventions: [i, ...s.interventions.filter((x) => x.id !== i.id)] })),
    updateIntervention: (id, patch) => setState((s) => ({ ...s, interventions: s.interventions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    saveRecommendation: (r) => setState((s) => ({ ...s, recommendations: [r, ...s.recommendations.filter((x) => x.id !== r.id)] })),
    saveScenario: (sc) => setState((s) => ({ ...s, scenarios: [sc, ...s.scenarios.filter((x) => x.id !== sc.id)] })),
    submitLearning: () => setState((s) => ({ ...s, learningSubmitted: true })),
    reset: () => setState(initial()),
  }), [state, toasts, toast]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useBhStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useBhStore outside provider');
  return ctx;
}

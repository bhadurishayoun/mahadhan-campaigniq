/**
 * Business Head workspace state shared across screens (React context + localStorage).
 * Holds what users change: scope, theme decisions, interventions, scenarios, learning priorities.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyPeriod, initialInterventions, periodLabel, THEME_QUEUE, type Intervention, type PeriodId, type RegionId, type ThemeStatus } from '../data/bh';

export type Scope = RegionId | 'national';

export interface ThemeDecision {
  themeId: string;
  choice: 'approve' | 'return' | 'clarify' | 'reject';
  comment: string;
  at: string;
  draft: boolean;
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
  period: PeriodId;
  themeStatus: Record<string, ThemeStatus>;
  decisions: ThemeDecision[];
  interventions: Intervention[];
  scenarios: Scenario[];
  learningSubmitted: boolean;
}

const KEY = 'campaigniq.v3.bh.3'; // bumped when the stored shape or seeded records change

const initial = (): State => ({
  scope: 'national',
  period: 'ytd',
  themeStatus: Object.fromEntries(THEME_QUEUE.map((t) => [t.id, t.status])),
  decisions: [],
  interventions: initialInterventions(),
  scenarios: [],
  learningSubmitted: false,
});

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial();
    // Scope is never restored: every fresh open starts on all regions (national portfolio).
    return { ...initial(), ...(JSON.parse(raw) as Partial<State>), scope: 'national', period: 'ytd' };
  } catch {
    return initial();
  }
}

interface Toast { id: number; text: string }

interface Ctx extends State {
  setScope: (s: Scope) => void;
  setPeriod: (p: PeriodId) => void;
  decideTheme: (d: ThemeDecision) => void;
  addIntervention: (i: Intervention) => void;
  updateIntervention: (id: string, patch: Partial<Intervention>) => void;
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

  // The selected period rewrites the data module before any screen renders (see applyPeriod in data/bh.ts).
  applyPeriod(state.period);

  const value = useMemo<Ctx>(() => ({
    ...state,
    toasts,
    toast,
    setScope: (scope) => setState((s) => (s.scope === scope ? s : { ...s, scope })),
    setPeriod: (period) => setState((s) => (s.period === period ? s : { ...s, period })),
    decideTheme: (d) => setState((s) => ({
      ...s,
      decisions: [...s.decisions.filter((x) => !(x.themeId === d.themeId && x.draft)), d],
      themeStatus: d.draft ? s.themeStatus : { ...s.themeStatus, [d.themeId]: STATUS_OF[d.choice] },
    })),
    addIntervention: (i) => setState((s) => ({ ...s, interventions: [i, ...s.interventions.filter((x) => x.id !== i.id)] })),
    updateIntervention: (id, patch) => setState((s) => ({ ...s, interventions: s.interventions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
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

/** The one selector every screen reads: top-bar scope and period (the data module is already set to the period). */
export function useBhData() {
  const { scope, period } = useBhStore();
  return { scope, period, periodLabel: periodLabel(period) };
}

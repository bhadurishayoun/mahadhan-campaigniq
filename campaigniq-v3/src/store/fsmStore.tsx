/**
 * Field Sales Manager state: top-bar scope, plan submission and the campaign wizard entries.
 * Kept in sessionStorage so going back through the wizard keeps what was entered.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultWizard, type FsmScope, type UnitOverride, type WizardState } from '../data/fsm';
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
  /** Campaign wizard entries (null until a business priority starts a draft). */
  wizard: WizardState | null;
  /** Campaign status per business priority. */
  campaigns: Record<string, 'draft' | 'launched'>;
  /** Corrective actions saved on activity units. */
  units: Record<string, UnitOverride>;
  /** Field evidence file names per activity unit. */
  evidence: Record<string, string[]>;
  /** Questions asked in the AI Copilot workspace (most recent first). */
  asked: string[];
}

const KEY = 'campaigniq.v3.fsm.5';
const INITIAL: FsmState = { scope: 'cluster', submitted: [], targets: {}, onionPlan: {}, notes: {}, wizard: null, campaigns: {}, units: {}, evidence: {}, asked: [] };

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
  /** Start (or keep) the wizard for a business priority; a different priority starts a fresh draft. */
  startWizard: (priorityId: string) => void;
  setWizard: (patch: Partial<WizardState>) => void;
  launchCampaign: () => void;
  saveAction: (unitId: string, o: UnitOverride) => void;
  addEvidence: (unitId: string, file: string) => void;
  ask: (q: string) => void;
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
    startWizard: (priorityId) => setState((s) => ({ ...s, wizard: s.wizard?.priority === priorityId ? s.wizard : defaultWizard(priorityId), campaigns: { ...s.campaigns, [priorityId]: s.campaigns[priorityId] ?? 'draft' } })),
    setWizard: (patch) => setState((s) => ({ ...s, wizard: { ...(s.wizard ?? defaultWizard('onion-croptek')), ...patch } })),
    saveAction: (unitId, o) => setState((s) => ({ ...s, units: { ...s.units, [unitId]: o } })),
    addEvidence: (unitId, file) => setState((s) => ({ ...s, evidence: { ...s.evidence, [unitId]: [...(s.evidence[unitId] ?? []), file] } })),
    ask: (q) => setState((s) => ({ ...s, asked: [q, ...s.asked.filter((x) => x !== q)].slice(0, 5) })),
    launchCampaign: () => setState((s) => (s.wizard ? { ...s, campaigns: { ...s.campaigns, [s.wizard.priority]: 'launched' } } : s)),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFsmStore(): FsmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFsmStore outside FsmStoreProvider');
  return v;
}

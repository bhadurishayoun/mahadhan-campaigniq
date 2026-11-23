/**
 * Marketing Head state: top-bar scope, plus the review, investigation, theme, approval and rollout records added phase by phase.
 * Kept in sessionStorage, like the Field Sales Manager and Zonal Manager stores.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MhPlanStatus, RequestStatus, ThemeBrief } from '../data/mh';

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
  /** Investigation: the further-analysis request, evidence requests, chosen recommendation (initial and refreshed). */
  analysis: { question: string; modules: string[]; mode: 'available' | 'missing'; owner: string; checks: string[] } | null;
  requests: Record<string, { status: RequestStatus; owner: string; due: string }> | null;
  recommendation: string;
  refreshed: string;
  /** Theme briefs by recommendation, review notes by proposal, and the comparison decision. */
  briefs: Record<string, ThemeBrief>;
  reviewNotes: Record<string, string>;
  decision: 'a' | 'b' | 'both' | 'consolidated' | null;
  /** Approval checks marked verified, the approval outcome and comments by proposal, validated rollout territories, publication. */
  verified: string[];
  approval: Record<string, 'approved' | 'returned' | 'escalated'>;
  approvalNotes: Record<string, string>;
  validated: string[];
  readiness: string[];
  published: boolean;
  optimisation: boolean;
}

const KEY = 'campaigniq.v3.mh.5';
const INITIAL: MhState = { scope: 'national', planStatus: {}, endorsed: [], shortlist: [], flagged: false,
  analysis: null, requests: null, recommendation: 'croptek-conversion', refreshed: 'croptek-conversion', briefs: {}, reviewNotes: {}, decision: null,
  verified: [], approval: {}, approvalNotes: {}, validated: [], readiness: [], published: false, optimisation: false };

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
  setAnalysis: (a: NonNullable<MhState['analysis']>) => void;
  setRequests: (r: NonNullable<MhState['requests']>) => void;
  setRequestStatus: (id: string, st: RequestStatus) => void;
  setRecommendation: (id: string) => void;
  setRefreshed: (id: string) => void;
  setBrief: (id: string, b: ThemeBrief) => void;
  setReviewNote: (id: string, text: string) => void;
  setDecision: (d: NonNullable<MhState['decision']>) => void;
  verify: (id: string) => void;
  setApproval: (id: string, a: MhState['approval'][string]) => void;
  setApprovalNote: (id: string, text: string) => void;
  validate: (id: string) => void;
  toggleReadiness: (id: string) => void;
  publish: () => void;
  requestOptimisation: () => void;
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
    setAnalysis: (analysis) => setState((s) => ({ ...s, analysis })),
    setRequests: (requests) => setState((s) => ({ ...s, requests })),
    setRequestStatus: (id, st) => setState((s) => (s.requests && s.requests[id] ? { ...s, requests: { ...s.requests, [id]: { ...s.requests[id], status: st } } } : s)),
    setRecommendation: (recommendation) => setState((s) => ({ ...s, recommendation })),
    setRefreshed: (refreshed) => setState((s) => ({ ...s, refreshed })),
    setBrief: (id, b) => setState((s) => ({ ...s, briefs: { ...s.briefs, [id]: b } })),
    setReviewNote: (id, text) => setState((s) => ({ ...s, reviewNotes: { ...s.reviewNotes, [id]: text } })),
    setDecision: (decision) => setState((s) => ({ ...s, decision })),
    verify: (id) => setState((s) => ({ ...s, verified: s.verified.includes(id) ? s.verified : [...s.verified, id] })),
    setApproval: (id, a) => setState((s) => ({ ...s, approval: { ...s.approval, [id]: a } })),
    setApprovalNote: (id, text) => setState((s) => ({ ...s, approvalNotes: { ...s.approvalNotes, [id]: text } })),
    validate: (id) => setState((s) => ({ ...s, validated: s.validated.includes(id) ? s.validated : [...s.validated, id] })),
    toggleReadiness: (id) => setState((s) => ({ ...s, readiness: s.readiness.includes(id) ? s.readiness.filter((x) => x !== id) : [...s.readiness, id] })),
    publish: () => setState((s) => ({ ...s, published: true })),
    requestOptimisation: () => setState((s) => ({ ...s, optimisation: true })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMhStore(): MhStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMhStore outside MhStoreProvider');
  return v;
}

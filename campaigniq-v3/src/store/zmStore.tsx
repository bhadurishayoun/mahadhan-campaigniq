/**
 * Zonal Manager state: top-bar scope and portfolio, plan review decisions, SKU mapping, Marketing Head questions,
 * plus the studio and approval records added phase by phase. Kept in sessionStorage, like the Field Sales Manager store.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Priority, ApprovalStatus, Drivers, ProposalStatus, ScenarioKey, AssetStatus, Claim, CollateralVersion, Concept, ReviewStatus, TemplateId, MappingStatus, PlanStatus, PropositionField, QuestionStatus, ThemeStatus, ZmPortfolio, ZmScope } from '../data/zm';
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
  /** Collateral: chosen template, draft setup, version history (null = the seeded detailer history), reviews and playbook. */
  template: TemplateId;
  draftSetup: DraftSetup | null;
  versions: CollateralVersion[] | null;
  reviews: Record<string, ReviewStatus>;
  submittedForReview: boolean;
  assetStatus: Partial<Record<TemplateId, AssetStatus>>;
  playbookIncluded: TemplateId[];
  released: boolean;
  /** Business case: saved driver inputs, chosen scenario basis, reconciliation decision. */
  drivers: Drivers | null;
  scenario: ScenarioKey;
  financeRequested: boolean;
  reconDecision: 'separate' | 'coordinate' | 'defer';
  /** Proposals: status, selection, readiness checks, review comment, revision of the returned C1. */
  proposalStatus: Record<string, ProposalStatus>;
  selectedProposals: string[];
  submissionChecks: string[];
  revision: { investment: number; sales: number; marginPct: number; observations: Record<string, string>; response: string } | null;
  /** Activity approvals: status overrides, accepted activities, activity checks, escalated exceptions, approval conditions. */
  approvalStatus: Partial<Record<ZmTerritoryId, ApprovalStatus>>;
  accepted: Partial<Record<ZmTerritoryId, string[]>>;
  activityChecks: Record<string, string[]>;
  escalated: Partial<Record<ZmTerritoryId, string[]>>;
  /** Impact and learning: saved learning, recommendation selection / priorities / option / status, Copilot questions. */
  learningSaved: boolean;
  recSelected: string[] | null;
  recPriority: Record<string, Priority>;
  recOption: 'submit' | 'concept';
  recStatus: 'draft' | 'submitted';
  asked: string[];
}

export interface DraftSetup { audience: string; language: string; objective: string; sources: string[]; style: string; format: string; regional: string }

export interface InterventionConfig { objective: string; behaviour: string; participants: string; types: string[]; channel: string; crop: string; geography: string; window: string; resources: string }

const KEY = 'campaigniq.v3.zm.8';
const INITIAL: ZmState = { scope: 'zone', portfolio: 'crop-nutrition', planDecisions: {}, mapping: {}, mappingChecks: {}, comments: {}, cropValidated: {}, questions: {}, responses: {},
  themeStatus: {}, acknowledgements: {}, clarifications: [], concepts: null, selectedConcepts: ['c1'],
  workspace: { intent: 'Drive eligible first-purchase conversion under Croptek.', behaviour: 'Move from recommendation or trial to first purchase.', notes: '' },
  compareDecision: 'separate', proposition: {}, interventions: {}, readinessChecks: [], claims: {},
  template: 'detailer', draftSetup: null, versions: null, reviews: {}, submittedForReview: false, assetStatus: {}, playbookIncluded: ['detailer'], released: false,
  drivers: null, scenario: 'base', financeRequested: false, reconDecision: 'separate',
  proposalStatus: { c1: 'submitted', c2: 'submitted' }, selectedProposals: ['c1'], submissionChecks: [], revision: null,
  approvalStatus: {}, accepted: {}, activityChecks: {}, escalated: {},
  learningSaved: false, recSelected: null, recPriority: {}, recOption: 'submit', recStatus: 'draft', asked: [] };

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
  setTemplate: (t: TemplateId) => void;
  setDraftSetup: (d: DraftSetup) => void;
  setVersions: (v: CollateralVersion[]) => void;
  setReview: (id: string, st: ReviewStatus) => void;
  submitForReview: () => void;
  setAssetStatus: (t: TemplateId, st: AssetStatus) => void;
  setPlaybookIncluded: (ids: TemplateId[]) => void;
  release: () => void;
  setDrivers: (d: Drivers) => void;
  setScenario: (s: ScenarioKey) => void;
  requestFinance: () => void;
  setReconDecision: (d: ZmState['reconDecision']) => void;
  setProposalStatus: (ids: string[], st: ProposalStatus) => void;
  setSelectedProposals: (ids: string[]) => void;
  setSubmissionChecks: (ids: string[]) => void;
  setRevision: (r: NonNullable<ZmState['revision']>) => void;
  setApproval: (t: ZmTerritoryId, st: ApprovalStatus) => void;
  setAccepted: (t: ZmTerritoryId, ids: string[]) => void;
  setActivityChecks: (key: string, ids: string[]) => void;
  setEscalated: (t: ZmTerritoryId, ids: string[]) => void;
  saveLearning: () => void;
  setRecSelected: (ids: string[]) => void;
  setRecPriority: (id: string, p: Priority) => void;
  setRecOption: (o: ZmState['recOption']) => void;
  submitRecommendations: () => void;
  ask: (q: string) => void;
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
    setTemplate: (template) => setState((s) => ({ ...s, template })),
    setDraftSetup: (draftSetup) => setState((s) => ({ ...s, draftSetup })),
    setVersions: (versions) => setState((s) => ({ ...s, versions })),
    setReview: (id, st) => setState((s) => ({ ...s, reviews: { ...s.reviews, [id]: st } })),
    submitForReview: () => setState((s) => ({ ...s, submittedForReview: true })),
    setAssetStatus: (t, st) => setState((s) => ({ ...s, assetStatus: { ...s.assetStatus, [t]: st } })),
    setPlaybookIncluded: (ids) => setState((s) => ({ ...s, playbookIncluded: ids })),
    release: () => setState((s) => ({ ...s, released: true })),
    setDrivers: (drivers) => setState((s) => ({ ...s, drivers })),
    setScenario: (scenario) => setState((s) => ({ ...s, scenario })),
    requestFinance: () => setState((s) => ({ ...s, financeRequested: true })),
    setReconDecision: (reconDecision) => setState((s) => ({ ...s, reconDecision })),
    setProposalStatus: (ids, st) => setState((s) => ({ ...s, proposalStatus: { ...s.proposalStatus, ...Object.fromEntries(ids.map((i) => [i, st])) } })),
    setSelectedProposals: (selectedProposals) => setState((s) => ({ ...s, selectedProposals })),
    setSubmissionChecks: (submissionChecks) => setState((s) => ({ ...s, submissionChecks })),
    setRevision: (revision) => setState((s) => ({ ...s, revision })),
    setApproval: (t, st) => setState((s) => ({ ...s, approvalStatus: { ...s.approvalStatus, [t]: st } })),
    setAccepted: (t, ids) => setState((s) => ({ ...s, accepted: { ...s.accepted, [t]: ids } })),
    setActivityChecks: (key, ids) => setState((s) => ({ ...s, activityChecks: { ...s.activityChecks, [key]: ids } })),
    setEscalated: (t, ids) => setState((s) => ({ ...s, escalated: { ...s.escalated, [t]: ids } })),
    saveLearning: () => setState((s) => ({ ...s, learningSaved: true })),
    setRecSelected: (recSelected) => setState((s) => ({ ...s, recSelected })),
    setRecPriority: (id, p) => setState((s) => ({ ...s, recPriority: { ...s.recPriority, [id]: p } })),
    setRecOption: (recOption) => setState((s) => ({ ...s, recOption })),
    submitRecommendations: () => setState((s) => ({ ...s, recStatus: 'submitted' })),
    ask: (q) => setState((s) => ({ ...s, asked: [q, ...s.asked.filter((x) => x !== q)].slice(0, 5) })),
    answer: (qid, response) => setState((s) => ({ ...s, questions: { ...s.questions, [qid]: 'responded' }, responses: { ...s.responses, [qid]: response } })),
  }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZmStore(): ZmStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZmStore outside ZmStoreProvider');
  return v;
}

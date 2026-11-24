/**
 * Route constants for the Business Head workspace. Screen codes and mockup file names live ONLY here
 * (never in UI text). Mockups: docs/mockups/business-head/<file>.
 */
import type { CampaignId, RegionId } from './data/bh';

export const R = {
  command: '/bh/command-centre', // 1  BH.1.png
  portfolio: '/bh/portfolio', // 2  BH.2.png
  region: (r: RegionId) => `/bh/portfolio/region/${r}`, // 3  (new, no mockup)
  territory: (t: string) => `/bh/portfolio/territory/${t}`, // 4  BH.3.png
  effectiveness: (r: RegionId, c?: CampaignId) => `/bh/portfolio/region/${r}/effectiveness${c ? `?campaign=${c}` : ''}`, // 5 BH.2a.png
  diagnostics: (r: RegionId, c: CampaignId) => `/bh/portfolio/region/${r}/effectiveness?campaign=${c}&drawer=diagnostics`, // 6 BH.2b.png
  investment: '/bh/investment', // 7  BH.3a.png
  campaignInvestment: (r: RegionId) => `/bh/investment/region/${r}`, // 8  BH.3b.png
  returns: (r: RegionId, c?: CampaignId) => `/bh/investment/region/${r}/returns${c ? `?campaign=${c}` : ''}`, // 9 BH.3d.png
  reallocation: (r: RegionId) => `/bh/investment/region/${r}/reallocation`, // 10 BH.3e.png
  opportunity: '/bh/themes/opportunity', // 11 BH.4.png
  inbox: '/bh/themes/inbox', // 12 BH.4b.png
  review: (id: string) => `/bh/themes/${id}/review`, // 13 BH.4c.png
  decision: (id: string) => `/bh/themes/${id}/review?modal=decision`, // 14 BH.4d.png
  tracker: '/bh/interventions', // 17 BH.5.png
  intervention: (id: string) => `/bh/interventions?drawer=${id}`, // 18 BH.5a.png
  learning: '/bh/interventions/learning', // 19 BH.5b.png
  assistant: '/bh/assistant', // 20 BH.6.png
} as const;

export type NavKey = 'command' | 'portfolio' | 'investment' | 'themes' | 'interventions' | 'assistant';

/** Which sidebar item a path belongs to. */
export function navKeyOf(path: string): NavKey {
  if (path.startsWith('/bh/portfolio')) return 'portfolio';
  if (path.startsWith('/bh/investment')) return 'investment';
  if (path.startsWith('/bh/themes')) return 'themes';
  if (path.startsWith('/bh/interventions')) return 'interventions';
  if (path.startsWith('/bh/assistant')) return 'assistant';
  return 'command';
}

// ================================================================ Field Sales Manager (persona id `tm`)
// Mockups: docs/mockups/field-sales-manager/<file>.
export type FsmTerritoryId = 'ambad' | 'ghansawangi' | 'badnapur';

export const F = {
  plan: '/fsm/plan', // 1  FSM.1.png
  network: (t: FsmTerritoryId = 'ambad') => `/fsm/plan/network/${t}`, // 2  FSM.2.png
  outlets: (t: FsmTerritoryId = 'ambad') => `/fsm/plan/outlets/${t}`, // 3  FSM.3.png
  crop: (t: FsmTerritoryId = 'ambad') => `/fsm/plan/crop/${t}`, // 4  FSM.4.png
  review: (t: FsmTerritoryId = 'ambad') => `/fsm/plan/review/${t}`, // 5  FSM.5.png
  campaigns: '/fsm/campaigns', // 6  FSM.CampaignWizard.a.png
  objective: '/fsm/campaigns/new/objective', // 7  FSM.CampaignWizard.b.png
  activities: '/fsm/campaigns/new/activities', // 8  FSM.CampaignWizard.c.png
  scenario: '/fsm/campaigns/new/scenario', // 9  FSM.CampaignWizard.d (2).png
  wizardReview: '/fsm/campaigns/new/review', // 10 FSM.CampaignWizard.e.png
  execution: '/fsm/execution', // 11 FSM.CampaignExecutionTower.a.png
  activity: (id: string) => `/fsm/execution/${id}`, // 12 FSM.CampaignExecutionTower.b.png
  impact: '/fsm/impact', // 13 FSM.ImpactandLearning.a.png
  diagnostic: '/fsm/impact/diagnostic', // 14 FSM.ImpactandLearning.b.png
  assistant: '/fsm/assistant', // 15 FSM.AIcopilot.png
} as const;

export type FsmNavKey = 'plan' | 'campaigns' | 'execution' | 'impact' | 'fsm-assistant';

/** Which Field Sales Manager sidebar item a path belongs to. */
export function fsmNavKeyOf(path: string): FsmNavKey {
  if (path.startsWith('/fsm/campaigns')) return 'campaigns';
  if (path.startsWith('/fsm/execution')) return 'execution';
  if (path.startsWith('/fsm/impact')) return 'impact';
  if (path.startsWith('/fsm/assistant')) return 'fsm-assistant';
  return 'plan';
}

/** Persona whose workspace a path belongs to, and each persona's landing page. */
// ---------------------------------------------------------------- Zonal Manager (mockups: docs/mockups/zonal-manager/<file>)
export type ZmTerritoryId = 'ambad' | 'ghansawangi' | 'badnapur' | 'jafrabad' | 'bhokardan' | 'partur' | 'mantha' | 'jalna';
export const Z = {
  performance: '/zm/performance', // 1  ZM.1.png
  plans: '/zm/plans', // 2  ZM.1a.png
  reconciliation: '/zm/plans/reconciliation', // 3  ZM.2.png (drawer ZM.2a)
  planReview: (t: ZmTerritoryId = 'ambad') => `/zm/plans/${t}/review`, // 4  ZM.3.png (drawer ZM.3a)
  revised: (t: ZmTerritoryId = 'ambad') => `/zm/plans/${t}/revised`, // 5  ZM.3b.png (drawer ZM.3c)
  themes: '/zm/themes', // 6  ZM.4.png (drawers ZM.4a, ZM.4b; modal ZM.4c = ZM.5a)
  concepts: '/zm/studio/concepts', // 7  ZM.5.png (drawer ZM.5b)
  compare: '/zm/studio/compare', // 8  ZM.5c.png
  proposition: '/zm/studio/proposition', // 9  ZM.6.png (drawers ZM.6a, ZM.6b)
  collateral: '/zm/studio/collateral', // 10 ZM.7a.png
  editor: '/zm/studio/collateral/edit', // 11 ZM.7b.png
  versions: '/zm/studio/collateral/versions', // 12 ZM.7c.png
  collateralApprovals: '/zm/studio/collateral/approvals', // 13 ZM.8.png
  playbook: '/zm/studio/playbook', // 14 ZM.8a.png
  businessCase: '/zm/studio/business-case', // 15 ZM.8c.png
  scenarios: '/zm/studio/scenarios', // 16 ZM.8d.png
  reconcile: '/zm/studio/reconciliation', // 17 ZM.8e.png
  proposals: '/zm/studio/proposals', // 18 ZM.8b.png (modal ZM.8f)
  revise: (id = 'c1') => `/zm/studio/proposals/${id}/revise`, // 19 ZM.8g.png
  approvals: '/zm/approvals', // 20 ZM.9b.png
  approval: (t: ZmTerritoryId = 'ambad') => `/zm/approvals/${t}`, // 21 ZM.9.png (drawers ZM.9a, 9c, 9d; modal ZM.9e)
  impact: '/zm/impact', // 22 ZM.10.png
  detail: '/zm/impact/detail', // 23 ZM.10a.png (drawers ZM.10b, ZM.10c)
  diagnostics: '/zm/impact/diagnostics', // 24 ZM.11a.png (drawers ZM.11b, ZM.11c)
  recommendations: '/zm/impact/recommendations', // 25 ZM.12.png
  assistant: '/zm/assistant', // 26 ZM.13.png
} as const;

export type ZmNavKey = 'performance' | 'plans' | 'themes' | 'studio' | 'approvals' | 'zm-impact' | 'zm-assistant';

/** Which Zonal Manager sidebar item a path belongs to. */
export function zmNavKeyOf(path: string): ZmNavKey {
  if (path.startsWith('/zm/plans')) return 'plans';
  if (path.startsWith('/zm/themes')) return 'themes';
  if (path.startsWith('/zm/studio')) return 'studio';
  if (path.startsWith('/zm/approvals')) return 'approvals';
  if (path.startsWith('/zm/impact')) return 'zm-impact';
  if (path.startsWith('/zm/assistant')) return 'zm-assistant';
  return 'performance';
}

// ---------------------------------------------------------------- Marketing Head (mockups: docs/mockups/marketing-head/<file>)
export type MhRegionId = 'west' | 'south' | 'north' | 'east';
export const M = {
  overview: '/mh/overview', // 1  MH.1.png
  opportunity: (r: MhRegionId = 'west') => `/mh/opportunity/${r}`, // 2  MH.2.png
  plans: '/mh/plans', // 3  MH.3.png
  planDetail: (r: MhRegionId = 'west', crop = 'onion') => `/mh/plans/${r}/${crop}`, // 4  MH.3a.png
  planTerritory: (t = 'ambad') => `/mh/plans/territory/${t}`, // 5  MH.3b.png
  diagnosis: '/mh/studio/diagnosis', // 6  MH.4.png (drawer MH.4b)
  recommendations: '/mh/studio/recommendations', // 7  MH.4a.png
  investigation: '/mh/studio/investigation', // 8  MH.4c.png (drawer MH.4d)
  evidence: '/mh/studio/evidence', // 9  MH.4e.png
  updated: '/mh/studio/investigation/updated', // 10 MH.4f.png
  refreshed: '/mh/studio/recommendations/refreshed', // 11 MH.4g.png
  themeBrief: '/mh/studio/theme-brief', // 12 MH.5.png
  themes: '/mh/studio/themes', // 13 MH.6.png
  proposals: '/mh/approvals/proposals', // 14 MH.7.png
  proposal: (id = 'c1') => `/mh/approvals/proposals/${id}`, // 15 MH.7a.png
  compare: '/mh/approvals/compare', // 16 MH.7b.png
  decision: (id = 'c1') => `/mh/approvals/${id}/decision`, // 17 MH.8.png
  rollout: (id = 'c1') => `/mh/approvals/${id}/rollout`, // 18 MH.8a.png
  performance: '/mh/performance', // 19 MH.9.png
  programme: (r: MhRegionId = 'west') => `/mh/performance/${r}`, // 20 MH.9a.png
  drivers: (r: MhRegionId = 'west') => `/mh/performance/${r}/drivers`, // 21 MH.9b.png (drawers MH.9c, MH.9d)
  assistant: '/mh/assistant', // 22 MH.10.png
} as const;

export type MhNavKey = 'overview' | 'opportunity' | 'mh-plans' | 'mh-studio' | 'mh-approvals' | 'mh-performance' | 'mh-assistant';

/** Which Marketing Head sidebar item a path belongs to. */
export function mhNavKeyOf(path: string): MhNavKey {
  if (path.startsWith('/mh/opportunity')) return 'opportunity';
  if (path.startsWith('/mh/plans')) return 'mh-plans';
  if (path.startsWith('/mh/studio')) return 'mh-studio';
  if (path.startsWith('/mh/approvals')) return 'mh-approvals';
  if (path.startsWith('/mh/performance')) return 'mh-performance';
  if (path.startsWith('/mh/assistant')) return 'mh-assistant';
  return 'overview';
}

export type PathPersona = 'strategy' | 'tm' | 'pm' | 'mh';
export const personaOfPath = (path: string): PathPersona =>
  (path.startsWith('/fsm') ? 'tm' : path.startsWith('/zm') ? 'pm' : path.startsWith('/mh') ? 'mh' : 'strategy');
export const LANDING: Record<string, string> = { strategy: R.command, tm: F.plan, pm: Z.performance, mh: M.overview };

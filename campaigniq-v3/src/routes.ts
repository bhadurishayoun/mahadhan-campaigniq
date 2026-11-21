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
export const personaOfPath = (path: string): 'strategy' | 'tm' => (path.startsWith('/fsm') ? 'tm' : 'strategy');
export const LANDING: Record<string, string> = { strategy: R.command, tm: F.plan };

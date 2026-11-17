/**
 * Territory Manager persona (CampaignIQ V2) - screen registry.
 *
 * Based on the approved specs in `ui-mockups/V2-persona-mockup-specs.md`.
 */

export type TmTabId = 'plan' | 'campaigns' | 'execution' | 'impact' | 'copilot';

export const TM_IDS = [
  'tm.1',
  'tm.2',
  'tm.3',
  'tm.4',
  'tm.5',
  'cw.1',
  'cw.2',
  'cw.3',
  'cw.4',
  'tm.ex1',
  'tm.ex2',
  'tm.im1',
  'tm.im2',
  'tm.ai1',
] as const;

export type TmScreenId = (typeof TM_IDS)[number];

export interface TmMeta {
  id: TmScreenId;
  code: string;
  title: string;
  tab: TmTabId;
  /** Financial year / reporting period shown in the top bar. */
  period: string;
}

const FY25 = 'FY 2025–26 · Jalna Cluster';

export const TM_TABS: { id: TmTabId; label: string; home: TmScreenId }[] = [
  { id: 'plan', label: 'My Plan', home: 'tm.1' },
  { id: 'campaigns', label: 'My Campaigns', home: 'cw.1' },
  { id: 'execution', label: 'Campaign Execution', home: 'tm.ex1' },
  { id: 'impact', label: 'Impact & Learning', home: 'tm.im1' },
  { id: 'copilot', label: 'AI Copilot', home: 'tm.ai1' },
];

export const TM_SCREENS: TmMeta[] = [
  { id: 'tm.1', code: 'TM.1', title: 'My Performance & Annual Business Plan', tab: 'plan', period: FY25 },
  { id: 'tm.2', code: 'TM.2', title: 'Territory Network & Channel Mapping', tab: 'plan', period: FY25 },
  { id: 'tm.3', code: 'TM.3', title: 'Outlet Business Planning & Target Allocation', tab: 'plan', period: FY25 },
  { id: 'tm.4', code: 'TM.4', title: 'Village-wise Crop, Product & Coverage Planning', tab: 'plan', period: FY25 },
  { id: 'tm.5', code: 'TM.5', title: 'Business & Crop Plan Review and Approval', tab: 'plan', period: FY25 },

  { id: 'cw.1', code: 'CW.1', title: 'Campaign Objective & Targeting', tab: 'campaigns', period: FY25 },
  { id: 'cw.2', code: 'CW.2', title: 'Campaign Activity & Budget Mix Planner', tab: 'campaigns', period: FY25 },
  { id: 'cw.3', code: 'CW.3', title: 'Campaign Scenario & Expected Outcomes', tab: 'campaigns', period: FY25 },
  { id: 'cw.4', code: 'CW.4', title: 'Campaign Review & Submit', tab: 'campaigns', period: FY25 },

  { id: 'tm.ex1', code: 'TM.EX1', title: 'Campaign Execution & Live Control Tower', tab: 'execution', period: FY25 },
  { id: 'tm.ex2', code: 'TM.EX2', title: 'Activity Execution & Corrective Action Workspace', tab: 'execution', period: FY25 },
  { id: 'tm.im1', code: 'TM.IM1', title: 'Campaign Impact & Business Performance', tab: 'impact', period: FY25 },
  { id: 'tm.im2', code: 'TM.IM2', title: 'Campaign Diagnostics & Learning Studio', tab: 'impact', period: FY25 },
  { id: 'tm.ai1', code: 'TM.AI1', title: 'Territory Business & Campaign Copilot Workspace', tab: 'copilot', period: FY25 },
];

export const tmMeta = (id: TmScreenId) => TM_SCREENS.find((screen) => screen.id === id)!;
export const isTmScreen = (id: string): id is TmScreenId => (TM_IDS as readonly string[]).includes(id);

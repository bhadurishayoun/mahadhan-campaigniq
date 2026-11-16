/**
 * Product Manager persona (CampaignIQ V2) - screen registry.
 *
 * The persona has seven sidebar tabs. Each screen belongs to one tab. "Interaction" screens (PM.2B, PM.9A ...)
 * are drawers or modals that open OVER their parent screen, which stays visible but dimmed behind them.
 */

export type PmTabId = 'perf' | 'reviews' | 'themes' | 'studio' | 'approvals' | 'impact' | 'copilot';

export const PM_IDS = [
  'pm.1',
  'pm.2', 'pm.2a', 'pm.2b',
  'pm.3', 'pm.3b', 'pm.3c', 'pm.3d',
  'pm.4', 'pm.4a', 'pm.4b', 'pm.4c',
  'pm.5', 'pm.5a', 'pm.5b', 'pm.5c',
  'pm.6', 'pm.6a', 'pm.6b',
  'pm.7', 'pm.7a', 'pm.7b', 'pm.7c', 'pm.7d', 'pm.7e',
  'pm.8', 'pm.8a', 'pm.8b', 'pm.8c', 'pm.8d', 'pm.8e', 'pm.8f',
  'pm.9b', 'pm.9', 'pm.9a', 'pm.9c', 'pm.9d', 'pm.9e',
  'pm.10', 'pm.10a', 'pm.10b', 'pm.10c',
  'pm.11', 'pm.11a', 'pm.11b', 'pm.11c', 'pm.11d',
  'pm.ai1',
] as const;

export type PmScreenId = (typeof PM_IDS)[number];

export interface PmMeta {
  id: PmScreenId;
  code: string;
  title: string;
  tab: PmTabId;
  /** Drawers / modals open over this screen (which is rendered dimmed behind them). */
  parent?: PmScreenId;
  kind?: 'drawer' | 'modal';
  /** Financial year / reporting period shown in the top bar. */
  period: string;
}

const FY25 = 'FY 2025–26';
const FY26 = 'FY 2026–27 · Reporting Jan–Feb 2027';

export const PM_TABS: { id: PmTabId; label: string; home: PmScreenId }[] = [
  { id: 'perf', label: 'My Performance', home: 'pm.1' },
  { id: 'reviews', label: 'Territory Plan Reviews', home: 'pm.2' },
  { id: 'themes', label: 'Assigned Themes', home: 'pm.4' },
  { id: 'studio', label: 'Campaign Studio', home: 'pm.5' },
  { id: 'approvals', label: 'Activity Approvals', home: 'pm.9b' },
  { id: 'impact', label: 'Impact & Learning', home: 'pm.10' },
  { id: 'copilot', label: 'AI Copilot', home: 'pm.ai1' },
];

export const PM_SCREENS: PmMeta[] = [
  { id: 'pm.1', code: 'PM.1', title: 'My Performance & Product Portfolio ABP', tab: 'perf', period: FY25 },

  { id: 'pm.2', code: 'PM.2', title: 'Consolidated Territory Business & Crop Plans', tab: 'reviews', period: FY25 },
  { id: 'pm.2a', code: 'PM.2A', title: 'SKU-to-Portfolio ABP Reconciliation', tab: 'reviews', period: FY25 },
  { id: 'pm.2b', code: 'PM.2B', title: 'SKU Mapping Correction Request', tab: 'reviews', parent: 'pm.2a', kind: 'drawer', period: FY25 },
  { id: 'pm.3', code: 'PM.3', title: 'Territory Plan Validation & Endorsement', tab: 'reviews', period: FY25 },
  { id: 'pm.3b', code: 'PM.3B', title: 'Territory Plan Correction Request', tab: 'reviews', parent: 'pm.3', kind: 'drawer', period: FY25 },
  { id: 'pm.3c', code: 'PM.3C', title: 'Revised Plan Comparison & Revalidation', tab: 'reviews', period: FY25 },
  { id: 'pm.3d', code: 'PM.3D', title: 'Marketing Head Feedback & Clarification', tab: 'reviews', parent: 'pm.3c', kind: 'drawer', period: FY25 },

  { id: 'pm.4', code: 'PM.4', title: 'Assigned Marketing Themes & Brief Review', tab: 'themes', period: FY25 },
  { id: 'pm.4a', code: 'PM.4A', title: 'Strategic Theme Brief & Evidence', tab: 'themes', parent: 'pm.4', kind: 'drawer', period: FY25 },
  { id: 'pm.4b', code: 'PM.4B', title: 'Theme Clarification Request', tab: 'themes', parent: 'pm.4', kind: 'drawer', period: FY25 },
  { id: 'pm.4c', code: 'PM.4C', title: 'Theme Acknowledgement & Commitment', tab: 'themes', parent: 'pm.4', kind: 'modal', period: FY25 },

  { id: 'pm.5', code: 'PM.5', title: 'Campaign Concept Development Studio', tab: 'studio', period: FY25 },
  { id: 'pm.5a', code: 'PM.5A', title: 'Campaign Concept Builder', tab: 'studio', parent: 'pm.5', kind: 'drawer', period: FY25 },
  { id: 'pm.5b', code: 'PM.5B', title: 'AI Concept Rationale & Evidence', tab: 'studio', parent: 'pm.5', kind: 'drawer', period: FY25 },
  { id: 'pm.5c', code: 'PM.5C', title: 'Concept Comparison & Consolidation', tab: 'studio', period: FY25 },
  { id: 'pm.6', code: 'PM.6', title: 'Product Proposition & Intervention Designer', tab: 'studio', period: FY25 },
  { id: 'pm.6a', code: 'PM.6A', title: 'Intervention Configuration & KPI Design', tab: 'studio', parent: 'pm.6', kind: 'drawer', period: FY25 },
  { id: 'pm.6b', code: 'PM.6B', title: 'Proposition, Claim & Agronomy Validation', tab: 'studio', parent: 'pm.6', kind: 'drawer', period: FY25 },
  { id: 'pm.7', code: 'PM.7', title: 'Campaign Collateral & Content Studio', tab: 'studio', period: FY25 },
  { id: 'pm.7a', code: 'PM.7A', title: 'AI Collateral Designer', tab: 'studio', period: FY25 },
  { id: 'pm.7b', code: 'PM.7B', title: 'Collateral Template Selection & AI Draft', tab: 'studio', period: FY25 },
  { id: 'pm.7c', code: 'PM.7C', title: 'Collateral Version Comparison', tab: 'studio', period: FY25 },
  { id: 'pm.7d', code: 'PM.7D', title: 'Collateral Approval Tracker', tab: 'studio', period: FY25 },
  { id: 'pm.7e', code: 'PM.7E', title: 'Collateral Packaging & Playbook Release', tab: 'studio', period: FY25 },
  { id: 'pm.8', code: 'PM.8', title: 'Campaign Business Case & Scenario Simulator', tab: 'studio', period: FY25 },
  { id: 'pm.8a', code: 'PM.8A', title: 'Proposal Consolidation & Submission', tab: 'studio', period: FY25 },
  { id: 'pm.8b', code: 'PM.8B', title: 'Financial Assumptions & Calculation Logic', tab: 'studio', period: FY25 },
  { id: 'pm.8c', code: 'PM.8C', title: 'Scenario Comparison & Sensitivity', tab: 'studio', period: FY25 },
  { id: 'pm.8d', code: 'PM.8D', title: 'Audience Overlap & Benefit Reconciliation', tab: 'studio', period: FY25 },
  { id: 'pm.8e', code: 'PM.8E', title: 'Proposal Submission Confirmation', tab: 'studio', parent: 'pm.8a', kind: 'modal', period: FY25 },
  { id: 'pm.8f', code: 'PM.8F', title: 'Returned Proposal Revision & Resubmission', tab: 'studio', period: FY25 },

  { id: 'pm.9b', code: 'PM.9B', title: 'Activity Plan Approval Inbox', tab: 'approvals', period: FY25 },
  { id: 'pm.9', code: 'PM.9', title: 'Territory Activity Plan Review & Approval', tab: 'approvals', period: FY25 },
  { id: 'pm.9a', code: 'PM.9A', title: 'Activity Detail & Exception Review', tab: 'approvals', parent: 'pm.9', kind: 'drawer', period: FY25 },
  { id: 'pm.9c', code: 'PM.9C', title: 'Activity Plan Correction Request', tab: 'approvals', parent: 'pm.9', kind: 'drawer', period: FY25 },
  { id: 'pm.9d', code: 'PM.9D', title: 'Exception & Authorization Review', tab: 'approvals', parent: 'pm.9', kind: 'drawer', period: FY25 },
  { id: 'pm.9e', code: 'PM.9E', title: 'Consolidated Plan Approval & Handoff', tab: 'approvals', parent: 'pm.9', kind: 'modal', period: FY25 },

  { id: 'pm.10', code: 'PM.10', title: 'Campaign Performance & Crop-wise Uplift', tab: 'impact', period: FY26 },
  { id: 'pm.10a', code: 'PM.10A', title: 'Crop × Product × Geography Detail', tab: 'impact', period: FY26 },
  { id: 'pm.10b', code: 'PM.10B', title: 'Territory Campaign Impact Explorer', tab: 'impact', parent: 'pm.10a', kind: 'drawer', period: FY26 },
  { id: 'pm.10c', code: 'PM.10C', title: 'Source Evidence & Attribution Validation', tab: 'impact', parent: 'pm.10a', kind: 'drawer', period: FY26 },
  { id: 'pm.11', code: 'PM.11', title: 'Campaign Diagnostics & Learning Studio', tab: 'impact', period: FY26 },
  { id: 'pm.11a', code: 'PM.11A', title: 'Village Conversion Driver Investigation', tab: 'impact', parent: 'pm.11', kind: 'drawer', period: FY26 },
  { id: 'pm.11b', code: 'PM.11B', title: 'Intervention Effectiveness Diagnostics', tab: 'impact', parent: 'pm.11', kind: 'drawer', period: FY26 },
  { id: 'pm.11c', code: 'PM.11C', title: 'Collateral Effectiveness Diagnostics', tab: 'impact', parent: 'pm.11', kind: 'drawer', period: FY26 },
  { id: 'pm.11d', code: 'PM.11D', title: 'Next-Season Learning & Recommendations', tab: 'impact', period: FY26 },

  { id: 'pm.ai1', code: 'PM.AI1', title: 'Product & Campaign Intelligence Copilot', tab: 'copilot', period: FY26 },
];

export const pmMeta = (id: PmScreenId) => PM_SCREENS.find((screen) => screen.id === id)!;
export const isPmScreen = (id: string): id is PmScreenId => (PM_IDS as readonly string[]).includes(id);

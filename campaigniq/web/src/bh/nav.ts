/** Business Head workspace screens and section navigation. */
export type BhTabId = 'command' | 'portfolio' | 'investment' | 'themes' | 'interventions' | 'copilot';

export const BH_SCREENS = [
  { id: 'bh.1', code: 'BH.1', title: 'National Business & Marketing Command Centre', tab: 'command' },
  { id: 'bh.2', code: 'BH.2', title: 'National Campaign Portfolio Performance', tab: 'portfolio' },
  { id: 'bh.3', code: 'BH.3', title: 'Regional & Territory Campaign Performance Intelligence', tab: 'portfolio' },
  { id: 'bh.3a', code: 'BH.3A', title: 'Territory Campaign Performance Detail', tab: 'portfolio' },
  { id: 'bh.4', code: 'BH.4', title: 'Campaign Effectiveness & Attribution', tab: 'portfolio' },
  { id: 'bh.5', code: 'BH.5', title: 'Marketing Investment & ROI', tab: 'investment' },
  { id: 'bh.5a', code: 'BH.5A', title: 'Investment Detail', tab: 'investment' },
  { id: 'bh.5b', code: 'BH.5B', title: 'ROI Evidence & Attribution', tab: 'investment' },
  { id: 'bh.5c', code: 'BH.5C', title: 'Budget Reallocation Simulator', tab: 'investment' },
  { id: 'bh.6', code: 'BH.6', title: 'Market Opportunity Intelligence', tab: 'themes' },
  { id: 'bh.7', code: 'BH.7', title: 'Strategic Theme Approval Inbox', tab: 'themes' },
  { id: 'bh.7a', code: 'BH.7A', title: 'Strategic Theme Business Alignment & Detailed Review', tab: 'themes' },
  { id: 'bh.7b', code: 'BH.7B', title: 'Strategic Theme Decision', tab: 'themes' },
  { id: 'bh.8', code: 'BH.8', title: 'Suggest Strategic Marketing Theme', tab: 'themes' },
  { id: 'bh.9', code: 'BH.9', title: 'Strategic Intervention & Management Tracker', tab: 'interventions' },
  { id: 'bh.9a', code: 'BH.9A', title: 'Strategic Intervention Request', tab: 'interventions' },
  { id: 'bh.10', code: 'BH.10', title: 'Portfolio Learning & Next-Year Strategic Priorities', tab: 'portfolio' },
  { id: 'bh.ai1', code: 'BH.AI1', title: 'Strategic Intelligence & Decision Copilot', tab: 'copilot' },
] as const;

export type BhScreenId = (typeof BH_SCREENS)[number]['id'];
export type BhMeta = (typeof BH_SCREENS)[number];

export const BH_TABS: { id: BhTabId; label: string; home: BhScreenId }[] = [
  { id: 'command', label: 'National Command Centre', home: 'bh.1' },
  { id: 'portfolio', label: 'Campaign Portfolio Performance', home: 'bh.2' },
  { id: 'investment', label: 'Marketing Investment & ROI', home: 'bh.5' },
  { id: 'themes', label: 'Strategic Themes & Approvals', home: 'bh.7' },
  { id: 'interventions', label: 'Strategic Interventions', home: 'bh.9' },
  { id: 'copilot', label: 'AI Copilot', home: 'bh.ai1' },
];

export const isBhScreen = (id: string): id is BhScreenId => BH_SCREENS.some((screen) => screen.id === id);
export const bhMeta = (id: BhScreenId) => BH_SCREENS.find((screen) => screen.id === id)!;

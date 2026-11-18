/**
 * Marketing Head persona (CampaignIQ V2) - screen registry.
 */

export type MhTabId = 'national' | 'opportunity' | 'reviews' | 'studio' | 'rollout' | 'performance' | 'copilot';

export const MH_IDS = [
  'mh.1',
  'mh.2',
  'mh.3',
  'mh.3a',
  'mh.3b',
  'mh.4',
  'mh.4a',
  'mh.4a-i2',
  'mh.4a-i3',
  'mh.4a-i4',
  'mh.4b',
  'mh.5',
  'mh.6',
  'mh.7',
  'mh.7a',
  'mh.7b',
  'mh.8',
  'mh.8a',
  'mh.9',
  'mh.9a',
  'mh.9b',
  'mh.9c',
  'mh.9d',
  'mh.ai1',
] as const;

export type MhScreenId = (typeof MH_IDS)[number];

export interface MhMeta {
  id: MhScreenId;
  code: string;
  title: string;
  tab: MhTabId;
  period: string;
}

const FY25_WEST = 'FY 2025–26 · West Region';

export const MH_TABS: { id: MhTabId; label: string; home: MhScreenId }[] = [
  { id: 'national', label: 'Marketing Overview', home: 'mh.1' },
  { id: 'opportunity', label: 'Market Opportunities', home: 'mh.2' },
  { id: 'reviews', label: 'Plan Reviews', home: 'mh.3' },
  { id: 'studio', label: 'Campaign Planning', home: 'mh.4' },
  { id: 'rollout', label: 'Approvals & Rollout', home: 'mh.8' },
  { id: 'performance', label: 'Performance & Learnings', home: 'mh.9' },
  { id: 'copilot', label: 'AI Copilot', home: 'mh.ai1' },
];

export const MH_SCREENS: MhMeta[] = [
  { id: 'mh.1', code: 'MH.1', title: 'Marketing Overview', tab: 'national', period: FY25_WEST },
  { id: 'mh.2', code: 'MH.2', title: 'Market Opportunities by Region', tab: 'opportunity', period: FY25_WEST },
  { id: 'mh.3', code: 'MH.3', title: 'Plan Reviews', tab: 'reviews', period: FY25_WEST },
  { id: 'mh.3a', code: 'MH.3A', title: 'Regional Plan Detail', tab: 'reviews', period: FY25_WEST },
  { id: 'mh.3b', code: 'MH.3B', title: 'Territory Plan Detail', tab: 'reviews', period: FY25_WEST },

  { id: 'mh.4', code: 'MH.4', title: 'Campaign Ideas', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a', code: 'MH.4A', title: 'Why Farmers Are Not Converting', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i2', code: 'MH.4A-I2', title: 'Barriers by Region', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i3', code: 'MH.4A-I3', title: 'Barriers by Territory', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i4', code: 'MH.4A-I4', title: 'Conversion Barriers: Updated Findings', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4b', code: 'MH.4B', title: 'Shortlist Campaigns', tab: 'studio', period: FY25_WEST },
  { id: 'mh.5', code: 'MH.5', title: 'Campaign Brief', tab: 'studio', period: FY25_WEST },
  { id: 'mh.6', code: 'MH.6', title: 'Campaign Mix, Budget & Calendar', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7', code: 'MH.7', title: 'Campaign Portfolio Review', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7a', code: 'MH.7A', title: 'Proposal & Business Case', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7b', code: 'MH.7B', title: 'Exceptions & Conditional Approval', tab: 'studio', period: FY25_WEST },

  { id: 'mh.8', code: 'MH.8', title: 'Approvals & Rollout', tab: 'rollout', period: FY25_WEST },
  { id: 'mh.8a', code: 'MH.8A', title: 'Release to Territories', tab: 'rollout', period: FY25_WEST },

  { id: 'mh.9', code: 'MH.9', title: 'Performance Summary', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9a', code: 'MH.9A', title: 'Regional Performance', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9b', code: 'MH.9B', title: 'What Is Driving Results', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9c', code: 'MH.9C', title: 'Territory Results', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9d', code: 'MH.9D', title: 'Request Campaign Changes', tab: 'performance', period: FY25_WEST },

  { id: 'mh.ai1', code: 'MH.AI1', title: 'AI Copilot', tab: 'copilot', period: FY25_WEST },
];

export const mhMeta = (id: MhScreenId) => MH_SCREENS.find((screen) => screen.id === id)!;
export const isMhScreen = (id: string): id is MhScreenId => (MH_IDS as readonly string[]).includes(id);

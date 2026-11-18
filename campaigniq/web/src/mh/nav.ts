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
  { id: 'national', label: 'National Marketing Overview', home: 'mh.1' },
  { id: 'opportunity', label: 'Market Opportunity Intelligence', home: 'mh.2' },
  { id: 'reviews', label: 'Business & Crop Plan Reviews', home: 'mh.3' },
  { id: 'studio', label: 'Campaign Strategy Studio', home: 'mh.4' },
  { id: 'rollout', label: 'Approvals & Rollout', home: 'mh.8' },
  { id: 'performance', label: 'Portfolio Performance & Learning', home: 'mh.9' },
  { id: 'copilot', label: 'AI Copilot', home: 'mh.ai1' },
];

export const MH_SCREENS: MhMeta[] = [
  { id: 'mh.1', code: 'MH.1', title: 'National Marketing Opportunity & Performance Command Centre', tab: 'national', period: FY25_WEST },
  { id: 'mh.2', code: 'MH.2', title: 'Regional Market Opportunity & Product Sales Intelligence', tab: 'opportunity', period: FY25_WEST },
  { id: 'mh.3', code: 'MH.3', title: 'Business & Crop Plan Alignment Review', tab: 'reviews', period: FY25_WEST },
  { id: 'mh.3a', code: 'MH.3A', title: 'Contributing Territory Plan Detail & Marketing Opportunity Review', tab: 'reviews', period: FY25_WEST },
  { id: 'mh.3b', code: 'MH.3B', title: 'Regional Business Plan Detail & Marketing Intervention Review', tab: 'reviews', period: FY25_WEST },

  { id: 'mh.4', code: 'MH.4', title: 'Campaign Strategy Studio', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a', code: 'MH.4A', title: 'Market & Historical Performance Diagnosis', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i2', code: 'MH.4A-I2', title: 'Farmer Conversion Investigation Results', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i3', code: 'MH.4A-I3', title: 'Evidence Request Tracking & Validation', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4a-i4', code: 'MH.4A-I4', title: 'Updated Farmer Conversion Investigation & Growth Barrier Diagnosis', tab: 'studio', period: FY25_WEST },
  { id: 'mh.4b', code: 'MH.4B', title: 'AI-Generated Campaign Recommendations', tab: 'studio', period: FY25_WEST },
  { id: 'mh.5', code: 'MH.5', title: 'Strategic Campaign Theme Brief & Product Manager Assignment', tab: 'studio', period: FY25_WEST },
  { id: 'mh.6', code: 'MH.6', title: 'Campaign Theme Assignment & Development Tracker', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7', code: 'MH.7', title: 'Product Manager Campaign Proposal Review & Comparison', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7a', code: 'MH.7A', title: 'Campaign Proposal & Business Case Review', tab: 'studio', period: FY25_WEST },
  { id: 'mh.7b', code: 'MH.7B', title: 'Campaign Proposal Comparison & Strategic Evaluation', tab: 'studio', period: FY25_WEST },

  { id: 'mh.8', code: 'MH.8', title: 'Approvals & Rollout', tab: 'rollout', period: FY25_WEST },
  { id: 'mh.8a', code: 'MH.8A', title: 'Approved Campaign Playbook & Territory Rollout', tab: 'rollout', period: FY25_WEST },

  { id: 'mh.9', code: 'MH.9', title: 'National & Regional Campaign Portfolio Performance', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9a', code: 'MH.9A', title: 'Regional Programme Performance & Rollout', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9b', code: 'MH.9B', title: 'Regional Campaign Performance Driver Diagnostics', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9c', code: 'MH.9C', title: 'Territory Impact Explorer', tab: 'performance', period: FY25_WEST },
  { id: 'mh.9d', code: 'MH.9D', title: 'Campaign Optimization Review Request', tab: 'performance', period: FY25_WEST },

  { id: 'mh.ai1', code: 'MH.AI1', title: 'AI Copilot', tab: 'copilot', period: FY25_WEST },
];

export const mhMeta = (id: MhScreenId) => MH_SCREENS.find((screen) => screen.id === id)!;
export const isMhScreen = (id: string): id is MhScreenId => (MH_IDS as readonly string[]).includes(id);

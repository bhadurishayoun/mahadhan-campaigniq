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

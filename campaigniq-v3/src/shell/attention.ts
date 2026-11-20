/** Management attention items, computed from data + store (shown on the command centre and in notifications). */
import { CAMPAIGNS, nationalReturns, REGIONS, regionMetrics, THEMES, netRoi } from '../data/bh';
import { R } from '../routes';
import type { ThemeStatus } from '../data/bh';

export interface AttentionItem { id: string; text: string; to: string }

export function attentionItems(themeStatus: Record<string, ThemeStatus>): AttentionItem[] {
  const items: AttentionItem[] = [];
  // Execution lag is flagged for regions with campaign-level records (the drill-down target), largest lag first.
  const lag = [...REGIONS].filter((r) => CAMPAIGNS.some((c) => c.region === r.id)).sort((a, b) => regionMetrics(a).execVariance - regionMetrics(b).execVariance)[0];
  const v = regionMetrics(lag).execVariance;
  if (v < 0) items.push({ id: 'lag', text: `${lag.name} execution lag: –${Math.abs(v)} pp vs plan`, to: R.effectiveness(lag.id) });
  REGIONS.filter((r) => !r.adoptionSourceValidated).forEach((r) => items.push({ id: `src-${r.id}`, text: `${r.name} adoption source validation pending`, to: R.region(r.id) }));
  const awaiting = Object.values(themeStatus).filter((s) => s === 'review_pending').length;
  if (awaiting > 0) items.push({ id: 'themes', text: `${awaiting} strategic theme${awaiting > 1 ? 's' : ''} awaiting decision`, to: R.inbox });
  const low = [...THEMES].sort((a, b) => netRoi(a.sales, a.investment) - netRoi(b.sales, b.investment))[0];
  items.push({ id: 'roi', text: `Portfolio net ROI +${nationalReturns().roi.toFixed(2)}×; ${low.name.toLowerCase()} lowest at +${netRoi(low.sales, low.investment).toFixed(2)}×`, to: R.learning });
  return items;
}

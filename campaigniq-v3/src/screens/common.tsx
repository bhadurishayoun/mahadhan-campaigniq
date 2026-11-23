import { CheckCircle2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CAMPAIGNS, REGIONS, themeQueue, THEMES, type RegionId } from '../data/bh';
import { R } from '../routes';
import { Button, FilterRows } from '../ui/core';
import { useBhStore } from '../store/bhStore';

export const ALL = 'all';
export const opt = (value: string, label: string) => ({ value, label });

export const REGION_OPTIONS = [opt(ALL, 'All regions'), ...REGIONS.map((r) => opt(r.id, `${r.name} region`))];
export const CROP_OPTIONS = [opt(ALL, 'All crops'), opt('Onion', 'Onion')];
export const PRODUCT_OPTIONS = [opt(ALL, 'All products'), opt('Croptek', 'Croptek')];
export const THEME_OPTIONS = [opt(ALL, 'All themes'), ...THEMES.map((t) => opt(t.id, t.name))];
export const CAMPAIGN_OPTIONS = [opt(ALL, 'All campaigns'), ...CAMPAIGNS.map((c) => opt(c.id, c.name))];

const isRegion = (v: string | undefined): v is RegionId => !!v && REGIONS.some((r) => r.id === v);

/** Region from the route; keeps the top-bar scope in step with the drill-down. */
export function useRouteRegion(): RegionId {
  const { region } = useParams();
  const store = useBhStore();
  const id: RegionId = isRegion(region) ? region : 'west';
  useEffect(() => { store.setScope(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return id;
}

/** Region filter bound to the top-bar scope (national = all regions). */
export function useScopeFilter(): [string, (v: string) => void] {
  const store = useBhStore();
  const value = store.scope === 'national' ? ALL : store.scope;
  return [value, (v) => store.setScope(v === ALL ? 'national' : (v as RegionId))];
}

/** Region to drill into from a national screen: the scope region, or West by default. */
export function useDrillRegion(): RegionId {
  const store = useBhStore();
  return store.scope === 'national' ? 'west' : store.scope;
}

export function useGo() {
  const nav = useNavigate();
  return (to: string) => nav(to);
}

/**
 * "Approve theme" target: the pending theme matching region / crop / product, else the first theme awaiting
 * Business Head review. Opens the inbox with that theme selected and the decision modal on "Approve theme".
 * With nothing pending it becomes "Review themes" and opens the inbox.
 */
export function useApproveTheme(match?: { region?: RegionId; crop?: string; product?: string }) {
  const store = useBhStore();
  const nav = useNavigate();
  const pending = themeQueue().filter((t) => store.themeStatus[t.id] === 'review_pending');
  const hit = match && pending.find((t) => (!match.region || t.region === match.region) && (!match.crop || t.crop === match.crop) && (!match.product || t.product === match.product));
  const theme = hit ?? pending[0];
  return theme
    ? { label: 'Approve theme', pending: true, open: () => nav(`${R.inbox}?theme=${theme.id}&modal=decision&choice=approve`) }
    : { label: 'Review themes', pending: false, open: () => nav(R.inbox) };
}

export function ApproveThemeButton({ match, primary }: { match?: { region?: RegionId; crop?: string; product?: string }; primary?: boolean }) {
  const a = useApproveTheme(match);
  return <Button small primary={primary} icon={a.pending ? CheckCircle2 : Eye} onClick={a.open}>{a.label}</Button>;
}

/** Back follows the path taken; when the page was opened directly (history idx 0) it goes to `fallback`. */
export function useBack(fallback: string) {
  const nav = useNavigate();
  return () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav(fallback));
}

/**
 * Shared filter block (Campaign Portfolio pattern). Row 1: Region · Crop · Product · Theme.
 * Row 2: view buttons left; Season and Sort by right. Region stays in sync with the top-bar scope.
 */
export type SeasonFilter = 'all' | 'Kharif' | 'Rabi';
export function useCampaignFilters() {
  const [region, setRegion] = useScopeFilter();
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [season, setSeason] = useState<SeasonFilter>('all');
  /** Campaign passes the non-region filters (crop, product, theme, season). */
  const matches = (c: { crop: string; product: string; theme: string; season: string }) =>
    (crop === ALL || c.crop === crop) && (product === ALL || c.product === product) && (theme === ALL || c.theme === theme) && (season === 'all' || c.season === season);
  return { region, setRegion, crop, setCrop, product, setProduct, theme, setTheme, season, setSeason, matches };
}

export function FilterHeader<V extends string, S extends string>({ f, view, setView, views, sortBy, setSortBy, sorts }: {
  f: ReturnType<typeof useCampaignFilters>;
  view: V; setView: (v: V) => void; views: { value: V; label: string }[];
  sortBy: S; setSortBy: (s: S) => void; sorts: { value: S; label: string }[];
}) {
  return (
    <FilterRows<V> view={view} setView={setView} views={views}
      filters={[
        { key: 'region', label: 'Region', value: f.region, options: REGION_OPTIONS, onChange: f.setRegion },
        { key: 'crop', label: 'Crop', value: f.crop, options: CROP_OPTIONS, onChange: f.setCrop },
        { key: 'product', label: 'Product', value: f.product, options: PRODUCT_OPTIONS, onChange: f.setProduct },
        { key: 'theme', label: 'Theme', value: f.theme, options: THEME_OPTIONS, onChange: f.setTheme },
      ]}
      extras={[
        { key: 'season', label: 'Season', value: f.season, onChange: (v) => f.setSeason(v as SeasonFilter), options: [{ value: 'all', label: 'All seasons' }, { value: 'Kharif', label: 'Kharif' }, { value: 'Rabi', label: 'Rabi' }] },
        { key: 'sort', label: 'Sort by', value: sortBy, onChange: (v) => setSortBy(v as S), options: sorts },
      ]} />
  );
}

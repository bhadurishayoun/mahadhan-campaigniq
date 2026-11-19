/**
 * Dataset placeholders - how real data replaces the illustrative screen data.
 *
 *   const campaigns = useDataset('portfolio.campaigns', CAMPAIGNS);
 *   <Panel title="..." data={campaigns}> ... campaigns.rows ...
 *
 * Every dataset is declared in server/data/datasets/catalog.json (shared with the API).
 * Until a file is uploaded (Data Sources screen or POST /api/datasets/{name}) the hook returns the
 * demo rows passed in; afterwards it returns the uploaded rows filtered by the filter-bar scope.
 */
import { useEffect, useState } from 'react';
import catalog from '../../../server/data/datasets/catalog.json';
import { api, query } from '../api';
import { useNav } from '../nav';

export interface DatasetColumn { name: string; type: string; required?: boolean; description?: string }
export interface DatasetMeta {
  name: string;
  title: string;
  screen: string;
  screens: string[];
  source_system: string;
  refresh: string;
  description: string;
  columns: DatasetColumn[];
}
export interface DatasetStatus extends DatasetMeta { status: 'live' | 'demo'; row_count: number | null; uploaded_at: string | null }

export const DATASET_CATALOG: DatasetMeta[] = catalog.datasets;
const KNOWN = new Set(DATASET_CATALOG.map((entry) => entry.name));
const SNAPSHOTS = import.meta.glob<{ default: unknown[] }>('./snapshot/*.json');

export interface DatasetState<T> { name: string; rows: T[]; live: boolean; source?: string; uploadedAt?: string }
export type DatasetScope = Partial<Record<'season' | 'state' | 'district' | 'taluka' | 'crop' | 'product' | 'campaign_type' | 'region' | 'theme' | 'period', string | undefined>>;

function snapshotFor<T>(rows: unknown[], scope: DatasetScope): T[] {
  const filters = Object.entries(scope).filter((entry): entry is [string, string] => Boolean(entry[1]));
  return (rows as Record<string, unknown>[]).filter((row) => filters.every(([key, value]) => {
    const actual = row[key];
    if (actual === undefined || actual === null || actual === '') return true;
    return String(actual).trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase();
  })) as T[];
}

let statusRequest: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

/** Names of datasets that have uploaded rows (one request shared by all panels). */
function liveDatasetNames(): Promise<Set<string>> {
  statusRequest ??= api<{ items: DatasetStatus[] }>('/datasets')
    .then((result) => new Set(result.items.filter((item) => item.status === 'live').map((item) => item.name)))
    .catch(() => new Set<string>());
  return statusRequest;
}

/** Call after an upload/delete so every mounted panel re-reads its data. */
export function refreshDatasets() {
  statusRequest = null;
  listeners.forEach((listener) => listener());
}

export function useDataset<T>(name: string, demoRows: T[], scopeOverride?: DatasetScope): DatasetState<T> {
  const { filters } = useNav();
  const defaultScope: DatasetScope = {
    season: filters.season,
    state: filters.geography === 'India' ? undefined : filters.geography,
    district: filters.district === 'All Districts' ? undefined : filters.district,
    crop: filters.crop === 'All Crops' ? undefined : filters.crop,
    product: filters.portfolio === 'All Products' ? undefined : filters.portfolio,
    campaign_type: filters.campaignType === 'All' ? undefined : filters.campaignType,
  };
  const requestedScope = { ...defaultScope, ...scopeOverride };
  const key = `${name}${query(requestedScope)}`;
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState<{ key: string; rows: T[]; source?: string; uploadedAt?: string } | null>(null);
  const [bundled, setBundled] = useState<{ key: string; rows: T[] } | null>(null);

  if (!KNOWN.has(name)) console.warn(`useDataset: '${name}' is not declared in server/data/datasets/catalog.json`);

  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    liveDatasetNames()
      .then((names) => (names.has(name)
        ? api<{ rows: T[]; source?: string; uploaded_at?: string }>(`/datasets/${encodeURIComponent(name)}${query(requestedScope)}`)
        : null))
      .then((result) => { if (!cancelled) setLive(result ? { key, rows: result.rows, source: result.source, uploadedAt: result.uploaded_at } : null); })
      .catch(() => { if (!cancelled) setLive(null); });
    return () => { cancelled = true; };
  }, [key, version]);

  useEffect(() => {
    let cancelled = false;
    const path = `./snapshot/${name.replaceAll('.', '__')}.json`;
    const loader = SNAPSHOTS[path];
    if (!loader) { setBundled(null); return () => { cancelled = true; }; }
    loader().then(({ default: rows }) => {
      if (!cancelled) setBundled({ key, rows: snapshotFor<T>(rows, requestedScope) });
    }).catch(() => { if (!cancelled) setBundled(null); });
    return () => { cancelled = true; };
  }, [key]);

  if (live && live.key === key) return { name, rows: live.rows, live: true, source: live.source, uploadedAt: live.uploadedAt };
  if (bundled && bundled.key === key) return { name, rows: bundled.rows, live: false, source: 'bundled snapshot' };
  return { name, rows: demoRows, live: false };
}

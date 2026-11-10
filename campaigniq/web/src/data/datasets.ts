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

export interface DatasetState<T> { name: string; rows: T[]; live: boolean; source?: string; uploadedAt?: string }

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

export function useDataset<T>(name: string, demoRows: T[]): DatasetState<T> {
  const { scope } = useNav();
  const key = `${name}${query(scope as Record<string, string | undefined>)}`;
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState<{ key: string; rows: T[]; source?: string; uploadedAt?: string } | null>(null);

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
        ? api<{ rows: T[]; source?: string; uploaded_at?: string }>(`/datasets/${encodeURIComponent(name)}${query(scope as Record<string, string | undefined>)}`)
        : null))
      .then((result) => { if (!cancelled) setLive(result ? { key, rows: result.rows, source: result.source, uploadedAt: result.uploaded_at } : null); })
      .catch(() => { if (!cancelled) setLive(null); });
    return () => { cancelled = true; };
  }, [key, version]);

  if (live && live.key === key && live.rows.length) return { name, rows: live.rows, live: true, source: live.source, uploadedAt: live.uploadedAt };
  return { name, rows: demoRows, live: false };
}

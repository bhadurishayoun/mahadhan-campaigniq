import { useEffect, useRef, useState } from 'react';
import { Bot, Database, Download, Globe2, Package, RotateCcw, Upload } from 'lucide-react';
import { API_BASE, api } from '../api';
import { DATASET_CATALOG, refreshDatasets, type DatasetStatus } from '../data/datasets';
import { getCopilotStatus, type CopilotStatus } from '../data/copilot';
import { SCREENS, useNav, type ScreenId } from '../nav';
import { Btn, Grid, Kpi, KpiRow, Note, PageHeader, Panel, Pill } from '../ui';

/**
 * ADM - Data Sources & Integrations.
 * Shows which screen datasets are still illustrative, lets an admin upload CSV/JSON to replace them,
 * lists the reference masters (states, districts, products) and the AI Co-pilot provider status.
 */
export function DataSources() {
  const { go, toast, reference } = useNav();
  const [items, setItems] = useState<DatasetStatus[] | null>(null);
  const [apiDown, setApiDown] = useState(false);
  const [copilot, setCopilot] = useState<CopilotStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);

  const load = () => {
    api<{ items: DatasetStatus[] }>('/datasets')
      .then((result) => { setItems(result.items); setApiDown(false); })
      .catch(() => { setItems(DATASET_CATALOG.map((entry) => ({ ...entry, status: 'demo', row_count: null, uploaded_at: null }))); setApiDown(true); });
    getCopilotStatus().then(setCopilot).catch(() => setCopilot(null));
  };
  useEffect(load, []);

  const pick = (name: string) => {
    target.current = name;
    fileInput.current?.click();
  };

  const upload = async (file: File) => {
    const name = target.current;
    if (!name) return;
    setBusy(name);
    const form = new FormData();
    form.append('file', file);
    try {
      const result = await api<{ row_count: number }>(`/datasets/${encodeURIComponent(name)}`, { method: 'POST', body: form });
      toast(`${name}: ${result.row_count} rows uploaded - screens now show live data`);
      refreshDatasets();
      load();
    } catch (error) {
      toast(`Upload failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const revert = async (name: string) => {
    setBusy(name);
    try {
      await api(`/datasets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      toast(`${name}: reverted to illustrative demo data`);
      refreshDatasets();
      load();
    } catch (error) {
      toast(`Could not revert: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const live = items?.filter((item) => item.status === 'live').length ?? 0;
  const districts = reference.states.reduce((sum, state) => sum + state.districts.length, 0);
  const withData = reference.states.reduce((sum, state) => sum + state.districts.filter((district) => district.has_data).length, 0);
  const screenLabel = (id: string) => SCREENS.find((screen) => screen.id === id)?.code ?? id.toUpperCase();

  return (
    <div className="stack">
      <PageHeader
        code="ADM"
        title="Data Sources & Integrations"
        subtitle="Replace illustrative screen data with real feeds, manage geography and product masters, and connect the AI Co-pilot to an LLM."
      />
      {apiDown && <Note>{API_BASE ? <>The API is not reachable at {API_BASE}. {import.meta.env.DEV ? <>Start it with <code>npm run dev</code></> : 'The free backend may still be waking up (up to a minute) - reload shortly'} to upload data; screens keep showing demo data meanwhile.</> : 'No backend is connected to this published demo, so uploads are disabled; every screen shows its built-in demo data.'}</Note>}

      <KpiRow>
        <Kpi icon={<Database size={18} />} label="Screen datasets" value={String(items?.length ?? DATASET_CATALOG.length)} sub={`${live} live · ${(items?.length ?? 0) - live} demo`} />
        <Kpi icon={<Globe2 size={18} />} label="States / districts" value={`${reference.states.length} / ${districts}`} sub={`${withData} district(s) with data`} />
        <Kpi icon={<Package size={18} />} label="Products" value={String(reference.products.filter((product) => product.active !== false).length)} sub={reference.products.map((product) => product.name).join(', ')} />
        <Kpi icon={<Bot size={18} />} label="AI Co-pilot" value={copilot?.mode === 'llm' ? 'LLM' : 'Demo'} sub={copilot ? `${copilot.provider}${copilot.model ? ` · ${copilot.model}` : ''}` : 'API offline'} />
      </KpiRow>

      <Panel title="Screen Datasets" icon={<Database size={16} />} subtitle="Each row is a table or chart that currently shows illustrative data. Download the CSV template, fill it from the source system and upload it. Optional scope columns (season, state, district, taluka, crop, product, campaign_type) let one file cover many states, districts and products - the filter bar picks the matching rows.">
        <input ref={fileInput} className="adm-file" type="file" accept=".csv,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        <div className="table-wrap">
          <table className="dt dt-compact adm-table">
            <thead>
              <tr><th>Dataset</th><th>Used on</th><th>Expected source</th><th>Columns</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.name}>
                  <td><strong>{item.title}</strong><div className="small muted"><code>{item.name}</code></div><div className="small muted">{item.description}</div></td>
                  <td>
                    <div className="adm-actions">
                      {item.screens.map((id) => <button type="button" key={id} className="data-badge" onClick={() => go(id as ScreenId)}>{screenLabel(id)}</button>)}
                    </div>
                  </td>
                  <td className="small">{item.source_system}<div className="muted">Refresh: {item.refresh}</div></td>
                  <td className="small">{item.columns.map((column) => column.name).join(', ')}</td>
                  <td>
                    {item.status === 'live'
                      ? <><Pill tone="green">Live</Pill><div className="small muted">{item.row_count} rows · {item.uploaded_at?.slice(0, 16).replace('T', ' ')}</div></>
                      : <Pill tone="grey">Demo</Pill>}
                  </td>
                  <td>
                    <div className="adm-actions">
                      {API_BASE && <a className="btn btn-outline btn-sm" href={`${API_BASE}/datasets/${encodeURIComponent(item.name)}/template`} download><Download size={12} /><span>Template</span></a>}
                      <Btn small variant="primary" icon={<Upload size={12} />} disabled={apiDown || busy === item.name} onClick={() => pick(item.name)}>Upload</Btn>
                      {item.status === 'live' && <Btn small variant="ghost" icon={<RotateCcw size={12} />} disabled={busy === item.name} onClick={() => void revert(item.name)}>Use demo</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Grid cols="1.4fr 1fr">
        <Panel title="Geography & Product Masters" icon={<Globe2 size={16} />} subtitle="Drives the Geography / District / Product filters. Edit server/data/reference/*.json (or PUT /api/reference/{geography|products|masters}) to add states, districts, talukas and products - no code change needed.">
          <div className="adm-tree">
            {reference.states.map((state) => (
              <div key={state.id}>
                <strong>{state.name}</strong> <span className="muted small">({state.districts.length} districts)</span>
                <ul>
                  {state.districts.map((district) => (
                    <li key={district.id}>{district.name} {district.has_data ? <Pill tone="green">data</Pill> : <span className="muted small">placeholder</span>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="adm-tree" style={{ marginTop: 10 }}>
            {reference.products.map((product) => (
              <div key={product.id}>
                <strong>{product.name}</strong> {product.active === false && <Pill tone="grey">inactive</Pill>}
                <div className="small muted">{product.family}</div>
                <div className="small">Crops: {product.crops?.join(', ') || '-'}</div>
                <div className="small">Packs: {product.pack_sizes_kg?.map((size) => `${size} kg`).join(', ') || '-'}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI Co-pilot (LLM)" icon={<Bot size={16} />} actions={<Pill tone={copilot?.mode === 'llm' ? 'green' : 'amber'}>{copilot?.mode === 'llm' ? 'LLM connected' : 'Demo answers'}</Pill>}>
          <p className="small" style={{ marginTop: 0 }}>
            The copilot sends the question, the filter scope and matching rows from uploaded datasets to the configured LLM and renders the JSON answer on AI.1.
            Without an LLM it shows the built-in illustrative answers.
          </p>
          <p className="small"><b>Provider:</b> {copilot?.provider ?? 'unknown'} {copilot?.model && <>· <b>Model:</b> {copilot.model}</>}</p>
          <p className="small" style={{ marginBottom: 0 }}>Set these in <code>server/.env</code> (see <code>.env.example</code>) and restart the API:</p>
          <pre className="adm-code">{`COPILOT_PROVIDER=openai        # or azure_openai | demo
COPILOT_MODEL=<model name>
COPILOT_API_KEY=<secret>
COPILOT_BASE_URL=https://api.openai.com/v1`}</pre>
          <div style={{ marginTop: 10 }}><Btn small variant="outline" to="ai.1" icon={<Bot size={12} />}>Open AI.1 Copilot</Btn></div>
        </Panel>
      </Grid>
    </div>
  );
}

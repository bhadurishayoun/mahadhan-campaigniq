/** Sidebar filters (CLAUDE.md §7): one light box under the logo, persona-specific fields, shared state for chips + section context.
 *  Three sources, shown in this order: persona fields (static here, or `external` from App for MH/legacy whose state lives in App),
 *  then screen-local fields registered with useSidebarField(). No other <select> filters anywhere. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { PORTFOLIO } from '../pm/data';

export type Workspace = 'bh' | 'mh' | 'pm' | 'tm' | 'legacy';
export type Opt = string | { value: string; label: string };
export interface FilterField { key: string; label: string; options: Opt[]; /** Excluded from chips and section context (e.g. a view switch). */ noContext?: boolean }
export interface ExternalFilters { fields: FilterField[]; values: Record<string, string>; set: (key: string, value: string) => void }

const BH_THEMES = ['Conversion & Adoption', 'Retailer Enablement', 'Trial & Follow-up', 'Crop Nutrition Awareness'];
const region = (r: string) => ({ value: r, label: `${r} Region` });

export const FILTER_FIELDS: Record<Workspace, FilterField[]> = {
  bh: [
    { key: 'region', label: 'Region', options: ['All Regions', region('West'), region('South'), region('North'), region('East')] },
    { key: 'crop', label: 'Crop', options: ['All Crops', 'Onion', 'Maize'] },
    { key: 'product', label: 'Product', options: ['All Products', 'Croptek', 'Smartek', 'Solutek', 'Bensulf', 'Mahadhan 24:24:0'] },
    { key: 'theme', label: 'Theme', options: ['All Themes', ...BH_THEMES] },
    { key: 'period', label: 'Period', options: ['YTD', 'QTD', 'Monthly'] },
    { key: 'view', label: 'Compare by', noContext: true, options: [{ value: 'Theme-wise', label: 'Theme' }, { value: 'Crop-wise', label: 'Crop' }, { value: 'Product-wise', label: 'Product' }, { value: 'Geography-wise', label: 'Geography' }] },
  ],
  pm: [
    { key: 'zone', label: 'Zone', options: ['West Zone'] },
    { key: 'portfolio', label: 'Portfolio', options: ['Crop Nutrition'] },
    { key: 'product', label: 'Product', options: ['All Products', ...PORTFOLIO.map((p) => p.product)] },
    { key: 'fy', label: 'Financial year', options: ['FY 2025–26'] },
  ],
  tm: [
    { key: 'cluster', label: 'Cluster', options: ['Jalna Cluster'] },
    { key: 'territory', label: 'Territory', options: ['All Territories', 'Ambad', 'Ghansawangi', 'Badnapur'] },
    { key: 'fy', label: 'Financial year', options: ['FY 2025–26'] },
  ],
  mh: [],
  legacy: [],
};

const valueOf = (o: Opt) => (typeof o === 'string' ? o : o.value);
const labelOf = (o: Opt) => (typeof o === 'string' ? o : o.label);
const defaults = () => Object.fromEntries(Object.entries(FILTER_FIELDS).map(([ws, fields]) => [ws, Object.fromEntries(fields.map((f) => [f.key, valueOf(f.options[0])]))])) as Record<Workspace, Record<string, string>>;

interface Ctx {
  workspace: Workspace; all: Record<Workspace, Record<string, string>>; set: (key: string, value: string) => void; external?: ExternalFilters;
  local: FilterField[]; localValues: Record<string, string>; setLocal: (key: string, value: string) => void;
  register: (f: FilterField, initial: string) => void; unregister: (key: string) => void;
}
const noop = () => undefined;
const SideFilterContext = createContext<Ctx>({ workspace: 'legacy', all: defaults(), set: noop, local: [], localValues: {}, setLocal: noop, register: noop, unregister: noop });

export function SideFilterProvider({ workspace, external, children }: { workspace: Workspace; external?: ExternalFilters; children: ReactNode }) {
  const [all, setAll] = useState(defaults);
  const [local, setLocalFields] = useState<FilterField[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const set = useCallback((key: string, value: string) => setAll((prev) => ({ ...prev, [workspace]: { ...prev[workspace], [key]: value } })), [workspace]);
  const setLocal = useCallback((key: string, value: string) => setLocalValues((p) => ({ ...p, [key]: value })), []);
  const register = useCallback((f: FilterField, initial: string) => {
    setLocalFields((p) => [...p.filter((x) => x.key !== f.key), f]);
    setLocalValues((p) => (f.key in p ? p : { ...p, [f.key]: initial }));
  }, []);
  const unregister = useCallback((key: string) => {
    setLocalFields((p) => p.filter((x) => x.key !== key));
    setLocalValues((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);
  const value = useMemo(() => ({ workspace, all, set, external, local, localValues, setLocal, register, unregister }), [workspace, all, set, external, local, localValues, setLocal, register, unregister]);
  return <SideFilterContext.Provider value={value}>{children}</SideFilterContext.Provider>;
}

/** Active persona filter values, chip labels and a " · "-joined context for section titles. */
export function useSideFilters() {
  const { workspace, all, set: setOwn, external, local, localValues, setLocal } = useContext(SideFilterContext);
  const personaFields = external ? external.fields : FILTER_FIELDS[workspace];
  const personaValues = external ? external.values : all[workspace];
  const values: Record<string, string> = { ...personaValues, ...localValues };
  const fields = [...personaFields, ...local];
  const set = (key: string, v: string) => (local.some((f) => f.key === key) ? setLocal(key, v) : external ? external.set(key, v) : setOwn(key, v));
  const label = (f: FilterField) => labelOf(f.options.find((o) => valueOf(o) === values[f.key]) ?? values[f.key] ?? '');
  const shown = fields.filter((f) => !f.noContext && values[f.key] !== undefined);
  const chips = shown.map(label).filter(Boolean);
  const narrowed = shown.filter((f) => !/^All\b/.test(values[f.key]) && f.options.length > 1 && f.key !== 'scope').map(label);
  return { workspace, fields, values, set, chips, context: (fallback: string) => (narrowed.length ? narrowed.join(' · ') : fallback) };
}

/** Screen-local filter shown in the sidebar box while the screen is mounted. Returns [value, setValue] like useState. */
export function useSidebarField(key: string, label: string, options: Opt[], initial?: string): [string, (v: string) => void] {
  const { register, unregister, localValues, setLocal } = useContext(SideFilterContext);
  const first = initial ?? valueOf(options[0]);
  const sig = options.map(valueOf).join('|');
  useEffect(() => {
    register({ key, label, options }, first);
    return () => unregister(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, label, sig]);
  return [localValues[key] ?? first, (v: string) => setLocal(key, v)];
}

export function SidebarFilters() {
  const { fields, values, set } = useSideFilters();
  if (!fields.length) return null;
  return (
    <section className="cq-sidefilters" aria-label="Filters">
      <h4><SlidersHorizontal size={13} />Filters</h4>
      {fields.map((f) => (
        <label key={f.key}>
          <span>{f.label}</span>
          <span className="cq-select">
            <select value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} disabled={f.options.length < 2}>
              {f.options.map((o) => <option key={valueOf(o)} value={valueOf(o)}>{labelOf(o)}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </span>
        </label>
      ))}
    </section>
  );
}

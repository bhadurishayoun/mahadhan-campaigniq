/** Sidebar filters (CLAUDE.md §7): one light box under the logo, persona-specific fields, shared state for chips + section context. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export type Workspace = 'bh' | 'mh' | 'pm' | 'tm' | 'legacy';
type Opt = string | { value: string; label: string };
export interface FilterField { key: string; label: string; options: Opt[]; /** Excluded from section-title context (e.g. a view switch). */ noContext?: boolean }

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
  tm: [
    { key: 'cluster', label: 'Cluster', options: ['Jalna Cluster'] },
    { key: 'territory', label: 'Territory', options: ['All Territories', 'Ambad', 'Ghansawangi', 'Badnapur'] },
    { key: 'fy', label: 'Financial year', options: ['FY 2025–26'] },
  ],
  mh: [],
  pm: [],
  legacy: [],
};

const valueOf = (o: Opt) => (typeof o === 'string' ? o : o.value);
const labelOf = (o: Opt) => (typeof o === 'string' ? o : o.label);
const defaults = () => Object.fromEntries(Object.entries(FILTER_FIELDS).map(([ws, fields]) => [ws, Object.fromEntries(fields.map((f) => [f.key, valueOf(f.options[0])]))])) as Record<Workspace, Record<string, string>>;

interface Ctx { workspace: Workspace; all: Record<Workspace, Record<string, string>>; set: (key: string, value: string) => void }
const SideFilterContext = createContext<Ctx>({ workspace: 'legacy', all: defaults(), set: () => undefined });

export function SideFilterProvider({ workspace, children }: { workspace: Workspace; children: ReactNode }) {
  const [all, setAll] = useState(defaults);
  const set = useCallback((key: string, value: string) => setAll((prev) => ({ ...prev, [workspace]: { ...prev[workspace], [key]: value } })), [workspace]);
  const value = useMemo(() => ({ workspace, all, set }), [workspace, all, set]);
  return <SideFilterContext.Provider value={value}>{children}</SideFilterContext.Provider>;
}

/** Active filter values for the current persona, chip labels and a " · "-joined context for section titles. */
export function useSideFilters() {
  const { workspace, all, set } = useContext(SideFilterContext);
  const fields = FILTER_FIELDS[workspace];
  const values = all[workspace];
  const label = (f: FilterField) => labelOf(f.options.find((o) => valueOf(o) === values[f.key]) ?? values[f.key]);
  const chips = fields.filter((f) => !f.noContext).map(label);
  const narrowed = fields.filter((f) => !f.noContext && !/^All /.test(values[f.key]) && f.options.length > 1).map(label);
  return { workspace, fields, values, set, chips, context: (fallback: string) => (narrowed.length ? narrowed.join(' · ') : fallback) };
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
            <select value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} disabled={f.options.length < 2}>
              {f.options.map((o) => <option key={valueOf(o)} value={valueOf(o)}>{labelOf(o)}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </span>
        </label>
      ))}
    </section>
  );
}

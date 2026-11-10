import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, Bell, CalendarDays, ChevronDown, Database, Presentation, HelpCircle, Home, Layers, MapPin, Menu, Radio, Search, ShoppingCart, SlidersHorizontal, Sparkles, Sprout, X,
} from 'lucide-react';
import {
  MODULES, NavContext, SCREENS, screenMeta, type Filters, type ModuleId, type ScreenId,
} from './nav';
import { filterOptions, normalizeFilters, scopeOf, useReference } from './data/reference';
import { DataSources } from './screens/admin';
import * as P from './screens/prototype';
import { TooltipLayer } from './ui';
import { API_ENABLED } from './api';
import * as S1 from './screens/s1';
import * as S2 from './screens/s2';
import * as S3 from './screens/s3';
import * as S4 from './screens/s4';
import * as S5 from './screens/s5';
import * as S6 from './screens/s6';
import * as S7 from './screens/s7';
import * as AI from './screens/ai';

const REGISTRY: Record<ScreenId, ComponentType> = {
  'p.1': P.PrototypeOverview,
  'p.2': P.LivePlanner,
  'p.3': P.LiveOperations,
  's1.1': S1.CommandCentre,
  's1.2': S1.PortfolioDashboard,
  's1.3': S1.ExecutiveSummary,
  's1.4': S1.RiskAnalysis,
  's1.5': S1.RecoveryReplanning,
  's2.1': S2.OpportunityAtlas,
  's2.2': S2.DistrictIntelligence,
  's2.3': S2.MicroMarketSegmentation,
  's2.4': S2.CompetitionChannel,
  's2.5': S2.CampaignRecommendations,
  's3.1': S3.NutritionCalendar,
  's3.2': S3.StageNutrition,
  's3.3': S3.ProgrammeBuilder,
  's3.4': S3.TriggerEngine,
  's4.1': S4.TemplateLibrary,
  's4.2': S4.CreationWizard,
  's4.3': S4.ActivityMixPlanner,
  's4.4': S4.ScenarioSimulator,
  's4.5': S4.ApprovalReview,
  's5.1': S5.DemandProjection,
  's5.2': S5.StockReadiness,
  's5.3': S5.DealerReadiness,
  's5.4': S5.SupplyRiskPlanner,
  's6.1': S6.ControlTower,
  's6.2': S6.ActivityWorkspace,
  's7.1': S7.ImpactDashboard,
  's7.2': S7.DiagnosticsStudio,
  'ai.1': AI.CopilotWorkspace,
  'admin.1': DataSources,
};

const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  command: Home,
  atlas: MapPin,
  nutrition: BarChart3,
  studio: Layers,
  readiness: ShoppingCart,
  orchestration: CalendarDays,
  control: Radio,
  impact: BarChart3,
  copilot: Sparkles,
  admin: Database,
  prototype: Presentation,
};

const FILTER_LABELS: Record<keyof Filters, string> = {
  season: 'Season',
  geography: 'Geography',
  district: 'District',
  crop: 'Crop',
  portfolio: 'Product Portfolio',
  campaignType: 'Campaign Type',
};

const NATIONAL: Filters = { season: 'Late Rabi 2026-27', geography: 'India', district: 'All Districts', crop: 'All Crops', portfolio: 'All Products', campaignType: 'All' };
const JALNA_ONION: Filters = { season: 'Late Rabi 2026-27', geography: 'Maharashtra', district: 'Jalna', crop: 'Onion', portfolio: 'Croptek', campaignType: 'Adoption' };

const DEFAULT_FILTERS: Record<ModuleId, Filters> = {
  command: NATIONAL,
  atlas: JALNA_ONION,
  nutrition: JALNA_ONION,
  studio: JALNA_ONION,
  readiness: JALNA_ONION,
  orchestration: JALNA_ONION,
  control: JALNA_ONION,
  impact: JALNA_ONION,
  copilot: JALNA_ONION,
  admin: NATIONAL,
  prototype: NATIONAL,
};

function readHash(): ScreenId {
  const id = window.location.hash.replace(/^#\/?/, '') as ScreenId;
  // Without a backend (published static demo) open on the Command Centre; P.1 needs the live API.
  return SCREENS.some((screen) => screen.id === id) ? id : API_ENABLED ? 'p.1' : 's1.1';
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>(readHash);
  const [filtersByModule, setFiltersByModule] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const meta = screenMeta(screen);
  const filters = filtersByModule[meta.module];
  const { reference } = useReference();
  const options = useMemo(() => filterOptions(reference, filters), [reference, filters]);
  const scope = useMemo(() => scopeOf(reference, filters), [reference, filters]);

  useEffect(() => {
    const onHash = () => setScreen(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = `${meta.code} ${meta.title} · Mahadhan CampaignIQ`;
  }, [meta]);

  const go = useCallback((id: ScreenId) => {
    window.location.hash = `/${id}`;
    setScreen(id);
    setNavOpen(false);
    document.querySelector('.main-scroll')?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2600);
  }, []);

  const setFilters = useCallback((next: Filters) => {
    setFiltersByModule((current) => ({ ...current, [meta.module]: normalizeFilters(reference, next) }));
  }, [meta.module, reference]);

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    return SCREENS.filter((item) => `${item.code} ${item.title}`.toLowerCase().includes(text)).slice(0, 6);
  }, [query]);

  const Screen = REGISTRY[screen];

  return (
    <NavContext.Provider value={{ screen, go, filters, setFilters, scope, reference, toast }}>
      <div className="app">
        <aside className={navOpen ? 'sidebar open' : 'sidebar'} aria-label="Main navigation">
          <button type="button" className="brand" onClick={() => go('p.1')}>
            <Sprout size={26} className="brand-leaf" />
            <span>Mahadhan<br />CampaignIQ</span>
          </button>
          <button type="button" className="nav-close" aria-label="Close menu" onClick={() => setNavOpen(false)}><X size={18} /></button>
          <nav className="side-nav">
            {MODULES.filter((module) => module.id !== 'admin').map((module) => {
              const Icon = MODULE_ICONS[module.id];
              const active = module.id === meta.module;
              return (
                <div key={module.id} className={module.id === 'copilot' ? 'side-copilot' : undefined}>
                  <button type="button" className={active ? 'side-link active' : 'side-link'} onClick={() => { go(module.home); setNavOpen(true); }}>
                    <Icon size={17} />
                    <span>{module.label}</span>
                  </button>
                  {active && module.id !== 'copilot' && (
                    <div className="side-sub">
                      {SCREENS.filter((item) => item.module === module.id).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className={item.id === screen ? 'side-sublink active' : 'side-sublink'}
                          onClick={() => go(item.id)}
                        >
                          <b>{item.code}</b> {item.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="side-admin">
            <button type="button" className={meta.module === 'admin' ? 'side-link active' : 'side-link'} onClick={() => go('admin.1')}>
              <Database size={16} /><span>Data Sources & Integrations</span>
            </button>
          </div>
          <div className="side-foot">Illustrative concept data · All financials are illustrative</div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button type="button" className="menu-btn" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}><Menu size={20} /></button>
            <span className="topbar-title">{meta.code} · {meta.title}</span>
            <button type="button" className={filtersOpen ? 'filters-btn active' : 'filters-btn'} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal size={15} /> Filters
            </button>
            <div className={filtersOpen ? 'filters open' : 'filters'}>
              {(Object.keys(FILTER_LABELS) as (keyof Filters)[]).map((key) => (
                <label key={key} className="filter">
                  <span>{FILTER_LABELS[key]}</span>
                  <div className="select-wrap">
                    <select value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}>
                      {(options[key].includes(filters[key]) ? options[key] : [filters[key], ...options[key]]).map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </label>
              ))}
            </div>
            <div className="search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search campaigns, districts, products..."
                aria-label="Search screens"
              />
              {matches.length > 0 && (
                <ul className="search-results">
                  {matches.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => { go(item.id); setQuery(''); }}>
                        <b>{item.code}</b> {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => toast('3 new risk alerts in Jalna and Dhanora')}>
              <Bell size={17} /><i className="dot" />
            </button>
            <button type="button" className="icon-btn" aria-label="Help"><HelpCircle size={17} /></button>
            <div className="user"><span className="avatar">PS</span><span className="user-role">Strategy Head</span><ChevronDown size={14} /></div>
          </header>
          <main className="main-scroll">
            <div className="page" key={screen}>
              <Screen />
            </div>
          </main>
        </div>
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        {message && <div className="toast" role="status" key={message}>{message}</div>}
        <TooltipLayer />
      </div>
    </NavContext.Provider>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, Bell, ChevronsLeft, ChevronsRight, CalendarDays, CheckSquare, ChevronDown, ClipboardCheck, Database, Gauge, Presentation, HelpCircle, Home, Inbox, Layers, MapPin, Menu, Radio, Search, ShoppingCart, Sparkles, Sprout, User, Wallet, X,
} from 'lucide-react';
import {
  MODULES, NavContext, PERSONAS, SCREENS, personaOf, screenMeta, type Filters, type ModuleId, type ModuleScreenId, type ScreenId, type PersonaId,
} from './nav';
import { PM_TABS, PmScreen, isPmScreen, pmMeta, type PmTabId } from './pm';
import { TM_TABS, TmScreen, isTmScreen, tmMeta, type TmTabId } from './tm';
import { MH_TABS, MhScreen, isMhScreen, mhMeta, type MhTabId } from './mh';
import { BH_TABS, BhScreen, isBhScreen, bhMeta, type BhTabId } from './bh';
import { filterOptions, normalizeFilters, scopeOf, useReference } from './data/reference';
import { SideFilterProvider, SidebarFilters, useSideFilters, type ExternalFilters } from './ui/filters';
import { NextStepsBar, ScreenBoundary, StepsSlotContext } from './ui/system';
import { DataSources } from './screens/admin';
import * as P from './screens/prototype';
import { TooltipLayer } from './ui';
import * as S1 from './screens/s1';
import * as S2 from './screens/s2';
import * as S3 from './screens/s3';
import * as S4 from './screens/s4';
import * as S5 from './screens/s5';
import * as S6 from './screens/s6';
import * as S7 from './screens/s7';
import * as AI from './screens/ai';
import { LoginPage } from './login';
import { saveSession, type Session } from './session';

const REGISTRY: Record<ModuleScreenId, ComponentType> = {
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
  pm: Gauge,
  tm: User,
  mh: User,
  bh: Gauge,
};

const PM_TAB_ICONS: Record<PmTabId, LucideIcon> = {
  perf: Gauge,
  reviews: ClipboardCheck,
  themes: Inbox,
  studio: Layers,
  approvals: CheckSquare,
  impact: BarChart3,
  copilot: Sparkles,
};

const TM_TAB_ICONS: Record<TmTabId, LucideIcon> = {
  plan: Gauge,
  campaigns: Layers,
  execution: Radio,
  impact: BarChart3,
  copilot: Sparkles,
};

const MH_TAB_ICONS: Record<MhTabId, LucideIcon> = {
  national: Home,
  opportunity: MapPin,
  reviews: ClipboardCheck,
  studio: Layers,
  rollout: CheckSquare,
  performance: BarChart3,
  copilot: Sparkles,
};

const BH_TAB_ICONS: Record<BhTabId, LucideIcon> = {
  command: Home,
  portfolio: BarChart3,
  investment: Wallet,
  themes: ClipboardCheck,
  interventions: CheckSquare,
  copilot: Sparkles,
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
const MH_REGION_STATES: Record<string, string[]> = {
  'West Region': ['Maharashtra', 'Gujarat'],
  'South Region': ['Karnataka', 'Telangana', 'Andhra Pradesh'],
  'North Region': [],
  'East Region': [],
};
const REGION_FOR_STATE = Object.fromEntries(Object.entries(MH_REGION_STATES).flatMap(([region, states]) => states.map((state) => [state, region])));

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
  pm: JALNA_ONION,
  tm: JALNA_ONION,
  mh: JALNA_ONION,
  bh: NATIONAL,
};

function readHash(): ScreenId {
  const id = window.location.hash.replace(/^#\/?/, '') as ScreenId;
  return SCREENS.some((screen) => screen.id === id) ? id : 's1.1';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginPersona, setLoginPersona] = useState<PersonaId | undefined>(undefined);
  const [screen, setScreen] = useState<ScreenId>(readHash);
  const history = useRef<ScreenId[]>([]);
  const [filtersByModule, setFiltersByModule] = useState(DEFAULT_FILTERS);
  const [marketingScope, setMarketingScope] = useState<'National' | 'Regional'>('Regional');
  const [marketingRegion, setMarketingRegion] = useState('West Region');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  useEffect(() => {
    document.querySelectorAll<HTMLButtonElement>('.side-link').forEach((b) => { b.title = b.querySelector('span')?.textContent ?? ''; });
  });
  const meta = screenMeta(screen);
  const persona = personaOf(meta.module);
  const personaMeta = PERSONAS.find((item) => item.id === persona)!;
  const pm = isPmScreen(screen) ? pmMeta(screen) : null;
  const tm = isTmScreen(screen) ? tmMeta(screen) : null;
  const mh = isMhScreen(screen) ? mhMeta(screen) : null;
  const bh = isBhScreen(screen) ? bhMeta(screen) : null;
  const filters = filtersByModule[meta.module];
  const { reference } = useReference();
  const options = useMemo(() => filterOptions(reference, filters), [reference, filters]);
  const scope = useMemo(() => scopeOf(reference, filters), [reference, filters]);
  const mhStateOptions = reference.states
    .filter((state) => marketingRegion === 'All Regions' || !MH_REGION_STATES[marketingRegion] || MH_REGION_STATES[marketingRegion].includes(state.name))
    .map((state) => state.name);
  const mhProductOptions = reference.products.filter((product) => product.active !== false
    && (filters.crop === 'All Crops' || !product.crops?.length || product.crops.includes(filters.crop.toLowerCase())));

  useEffect(() => {
    const onHash = () => setScreen(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    document.title = `${meta.title} · Mahadhan CampaignIQ`;
  }, [meta]);

  const go = useCallback((id: ScreenId) => {
    if (id !== screen) history.current.push(screen);
    window.location.hash = `/${id}`;
    setScreen(id);
    setNavOpen(false);
    document.querySelector('.main-scroll')?.scrollTo({ top: 0 });
  }, [screen]);

  const goBack = useCallback((fallback?: ScreenId) => {
    const previous = history.current.pop() ?? fallback;
    if (!previous || previous === screen) return;
    window.location.hash = `/${previous}`;
    setScreen(previous);
    setNavOpen(false);
    document.querySelector('.main-scroll')?.scrollTo({ top: 0 });
  }, [screen]);

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
    return SCREENS.filter((item) => item.title.toLowerCase().includes(text)).slice(0, 6);
  }, [query]);

  const Screen = pm ? PmScreen : tm ? TmScreen : mh ? MhScreen : bh ? () => <BhScreen screen={bh.id} /> : REGISTRY[screen as ModuleScreenId];

  const pmSidebar = pm && (
    <nav className="side-nav">
      <div className="pm-side-persona">Zonal Manager</div>
      {PM_TABS.map((tab) => {
        const Icon = PM_TAB_ICONS[tab.id];
        return (
          <div key={tab.id} className={tab.id === 'copilot' ? 'side-copilot' : undefined}>
            <button type="button" className={tab.id === pm.tab ? 'side-link active' : 'side-link'} onClick={() => { go(tab.home); setNavOpen(true); }}>
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );

  const tmSidebar = tm && (
    <nav className="side-nav">
      <div className="pm-side-persona">Field Sales Manager</div>
      {TM_TABS.map((tab) => {
        const Icon = TM_TAB_ICONS[tab.id];
        return (
          <div key={tab.id} className={tab.id === 'copilot' ? 'side-copilot' : undefined}>
            <button type="button" className={tab.id === tm.tab ? 'side-link active' : 'side-link'} onClick={() => { go(tab.home); setNavOpen(true); }}>
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );

  const mhSidebar = mh && (
    <nav className="side-nav">
      <div className="pm-side-persona">Marketing Head</div>
      {MH_TABS.map((tab) => {
        const Icon = MH_TAB_ICONS[tab.id];
        return (
          <div key={tab.id} className={tab.id === 'copilot' ? 'side-copilot' : undefined}>
            <button type="button" className={tab.id === mh.tab ? 'side-link active' : 'side-link'} onClick={() => { go(tab.home); setNavOpen(true); }}>
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );

  const bhSidebar = bh && (
    <nav className="side-nav">
      <div className="pm-side-persona">Business Head</div>
      {BH_TABS.map((tab) => {
        const Icon = BH_TAB_ICONS[tab.id];
        return (
          <div key={tab.id} className={tab.id === 'copilot' ? 'side-copilot' : undefined}>
            <button type="button" className={tab.id === bh.tab ? 'side-link active' : 'side-link'} onClick={() => { go(tab.home); setNavOpen(true); }}>
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );

  const [stepsSlot, setStepsSlot] = useState<HTMLElement | null>(null);
  const mhState = filters.geography === 'India' ? 'All States' : filters.geography;
  const mhFilters: ExternalFilters = {
    fields: [
      { key: 'scope', label: 'Scope', options: ['National', 'Regional'], noContext: true },
      { key: 'region', label: 'Region', options: ['All Regions', 'West Region', 'South Region', 'North Region', 'East Region'] },
      { key: 'state', label: 'State', options: ['All States', ...mhStateOptions] },
      { key: 'crop', label: 'Crop', options: ['All Crops', ...reference.crops.map((crop) => crop.name)] },
      { key: 'product', label: 'Product', options: ['All Products', ...mhProductOptions.map((product) => product.name)] },
    ],
    values: { scope: marketingScope, region: marketingRegion, state: mhState, crop: filters.crop, product: filters.portfolio },
    set: (key, value) => {
      if (key === 'scope') {
        const nextScope = value as 'National' | 'Regional';
        setMarketingScope(nextScope);
        if (nextScope === 'National') { setMarketingRegion('All Regions'); setFilters({ ...filters, geography: 'India', district: 'All Districts' }); }
        else {
          const nextRegion = marketingRegion === 'All Regions' ? 'West Region' : marketingRegion;
          setMarketingRegion(nextRegion);
          const allowed = MH_REGION_STATES[nextRegion] ?? [];
          if (filters.geography === 'India' || !allowed.length || !allowed.includes(filters.geography)) setFilters({ ...filters, geography: allowed[0] ?? 'India', district: 'All Districts' });
        }
      } else if (key === 'region') {
        setMarketingRegion(value);
        setMarketingScope(value === 'All Regions' ? 'National' : 'Regional');
        const allowed = MH_REGION_STATES[value] ?? [];
        if (value === 'All Regions') setFilters({ ...filters, geography: 'India', district: 'All Districts' });
        else if (!allowed.length || (filters.geography !== 'India' && !allowed.includes(filters.geography))) setFilters({ ...filters, geography: 'India', district: 'All Districts' });
      } else if (key === 'state') {
        if (value === 'All States') setFilters({ ...filters, geography: 'India', district: 'All Districts' });
        else { setMarketingScope('Regional'); setMarketingRegion(REGION_FOR_STATE[value] ?? marketingRegion); setFilters({ ...filters, geography: value, district: 'All Districts' }); }
      } else if (key === 'crop') {
        const validProducts = reference.products.filter((product) => product.active !== false && (!product.crops?.length || product.crops.includes(value.toLowerCase())));
        const productStillValid = filters.portfolio === 'All Products' || validProducts.some((product) => product.name === filters.portfolio);
        setFilters({ ...filters, crop: value, portfolio: productStillValid ? filters.portfolio : 'All Products' });
      } else if (key === 'product') setFilters({ ...filters, portfolio: value });
    },
  };
  const legacyFilters: ExternalFilters = {
    fields: (Object.keys(FILTER_LABELS) as (keyof Filters)[]).map((key) => ({
      key, label: FILTER_LABELS[key], options: options[key].includes(filters[key]) ? options[key] : [filters[key], ...options[key]],
    })),
    values: filters as unknown as Record<string, string>,
    set: (key, value) => setFilters({ ...filters, [key]: value }),
  };

  if (!session) {
    return (
      <LoginPage
        initialPersona={loginPersona}
        onLogin={(payload) => {
          setSession({ name: payload.name, persona: payload.persona, userId: payload.userId, master: payload.master });
          const dest = PERSONAS.find((p) => p.id === payload.persona)?.home ?? 's1.1';
          go(dest);
          setLoginPersona(undefined);
        }}
      />
    );
  }

  return (
    <NavContext.Provider value={{ screen, go, goBack, filters, setFilters, marketingScope, marketingRegion, setMarketingScope, setMarketingRegion, scope, reference, toast }}>
      <SideFilterProvider workspace={bh ? 'bh' : mh ? 'mh' : pm ? 'pm' : tm ? 'tm' : 'legacy'} external={mh ? mhFilters : bh || pm || tm ? undefined : legacyFilters}>
      <div className={`app${collapsed ? ' app-collapsed' : ''}${mh ? ' app-mh' : ''}`}>
        <aside className={navOpen ? 'sidebar open' : 'sidebar'} aria-label="Main navigation">
          <button type="button" className="brand" onClick={() => go(personaMeta.home)}>
            {mh ? <span className="mh-brand-mark" aria-hidden="true"><i /><b /></span> : <Sprout size={26} className="brand-leaf" />}
            <span>Mahadhan<br />CampaignIQ</span>
          </button>
          <SidebarFilters />
          <button type="button" className="nav-close" aria-label="Close menu" onClick={() => setNavOpen(false)}><X size={18} /></button>
          <button type="button" className="side-collapse" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed((c) => !c)}>{collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}</button>
          {pmSidebar || tmSidebar || mhSidebar || bhSidebar || (
            <nav className="side-nav">
              {MODULES.filter((module) => module.id !== 'admin').map((module) => {
                const Icon = MODULE_ICONS[module.id];
                return (
                  <div key={module.id} className={module.id === 'copilot' ? 'side-copilot' : undefined}>
                    <button type="button" className={module.id === meta.module ? 'side-link active' : 'side-link'} onClick={() => { go(module.home); setNavOpen(true); }}>
                      <Icon size={17} />
                      <span>{module.label}</span>
                    </button>
                  </div>
                );
              })}
            </nav>
          )}
          {!bh && !mh && <div className="side-admin">
            <button type="button" className={meta.module === 'admin' ? 'side-link active' : 'side-link'} onClick={() => go('admin.1')}>
              <Database size={16} /><span>Data Sources & Integrations</span>
            </button>
          </div>}
        </aside>

        <div className="main">
          <header className="topbar">
            <button type="button" className="menu-btn" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}><Menu size={20} /></button>
            <TopContext role={personaMeta.label} fy={pm ? pm.period : tm ? tm.period : bh ? 'FY 2026–27' : mh ? 'FY 2025–26' : filters.season} />
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
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => toast('3 new risk alerts in Jalna and Dhanora')}>
              <Bell size={17} /><span className="notif-count" aria-label="3 unread notifications">3</span>
            </button>
            <button type="button" className="icon-btn" aria-label="Help"><HelpCircle size={17} /></button>
            <div className="persona-menu">
              <button type="button" aria-haspopup="menu" aria-expanded={personaOpen} onClick={() => setPersonaOpen((open) => !open)}>
                <span className="avatar">{personaMeta.initials}</span>
                <span className="user-role">{session.name} · {personaMeta.label} · {session.userId}</span>
                <ChevronDown size={14} />
              </button>
              {personaOpen && (
                <div className="persona-list" role="menu">
                  <h5>Switch persona{session.master ? ' · master access' : ''}</h5>
                  {PERSONAS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      role="menuitem"
                      className={[item.id === persona ? 'active' : '', item.available ? '' : 'soon'].join(' ').trim()}
                      onClick={() => {
                        if (!item.available) return;
                        setPersonaOpen(false);
                        if (session.master) {
                          // Master login: move straight to the persona's workspace, no second sign-in.
                          setSession({ ...session, persona: item.id });
                          go(item.home);
                          return;
                        }
                        setLoginPersona(item.id);
                        setSession(null);
                      }}
                    >
                      <b>{item.label}</b><small>{item.sub}</small>
                    </button>
                  ))}
                  <div className="persona-actions">
                    <button
                      type="button"
                      className="persona-logout"
                      onClick={() => {
                        setPersonaOpen(false);
                        setSession(null);
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
          <main className="main-scroll">
            <div className="page cq-page" key={screen}>
              <StepsSlotContext.Provider value={stepsSlot}>
                <ScreenBoundary><Screen /></ScreenBoundary>
              </StepsSlotContext.Provider>
              <NextStepsBar onSlot={setStepsSlot} onBack={() => goBack(personaMeta.home)} />
            </div>
          </main>
        </div>
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        {personaOpen && <div className="nav-backdrop" style={{ background: 'transparent' }} onClick={() => setPersonaOpen(false)} />}
        {message && <div className="toast" role="status" key={message}>{message}</div>}
        <TooltipLayer />
      </div>
      </SideFilterProvider>
    </NavContext.Provider>
  );
}

/** Top-bar context chips, identical for every persona: role · financial year · live scope from the sidebar filters. */
function TopContext({ role, fy }: { role: string; fy: string }) {
  const side = useSideFilters();
  return (
    <div className="pm-topctx">
      <span><b>{role}</b></span>
      <span>{fy}</span>
      <span>{side.context('All regions')}</span>
    </div>
  );
}

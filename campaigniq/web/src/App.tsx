import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, Bell, ChevronsLeft, ChevronsRight, CalendarDays, CheckSquare, ChevronDown, ClipboardCheck, Database, Gauge, Presentation, HelpCircle, Home, Inbox, Layers, MapPin, Menu, Radio, Search, ShoppingCart, SlidersHorizontal, Sparkles, Sprout, User, Wallet, X,
} from 'lucide-react';
import {
  MODULES, NavContext, PERSONAS, SCREENS, personaOf, screenMeta, type Filters, type ModuleId, type ModuleScreenId, type ScreenId, type PersonaId,
} from './nav';
import { PM_TABS, PmScreen, isPmScreen, pmMeta, type PmTabId } from './pm';
import { TM_TABS, TmScreen, isTmScreen, tmMeta, type TmTabId } from './tm';
import { MH_TABS, MhScreen, isMhScreen, mhMeta, type MhTabId } from './mh';
import { BH_TABS, BhScreen, isBhScreen, bhMeta, type BhTabId } from './bh';
import { filterOptions, normalizeFilters, scopeOf, useReference } from './data/reference';
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
  const [filtersByModule, setFiltersByModule] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    return SCREENS.filter((item) => item.title.toLowerCase().includes(text)).slice(0, 6);
  }, [query]);

  const Screen = pm ? PmScreen : tm ? TmScreen : mh ? MhScreen : bh ? () => <BhScreen screen={bh.id} /> : REGISTRY[screen as ModuleScreenId];

  const pmSidebar = pm && (
    <nav className="side-nav">
      <div className="pm-side-persona">Product Manager</div>
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
      <div className="pm-side-persona">Territory Manager</div>
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
    <NavContext.Provider value={{ screen, go, filters, setFilters, scope, reference, toast }}>
      <div className={collapsed ? 'app app-collapsed' : 'app'}>
        <aside className={navOpen ? 'sidebar open' : 'sidebar'} aria-label="Main navigation">
          <button type="button" className="brand" onClick={() => go(personaMeta.home)}>
            <Sprout size={26} className="brand-leaf" />
            <span>Mahadhan<br />CampaignIQ</span>
          </button>
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
          {!bh && <div className="side-admin">
            <button type="button" className={meta.module === 'admin' ? 'side-link active' : 'side-link'} onClick={() => go('admin.1')}>
              <Database size={16} /><span>Data Sources & Integrations</span>
            </button>
          </div>}
        </aside>

        <div className="main">
          <header className="topbar">
            <button type="button" className="menu-btn" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}><Menu size={20} /></button>
            <span className="topbar-title">{meta.title}</span>

            {pm ? (
              <div className="pm-topctx">
                <span><b>Product Manager</b></span>
                <span>{pm.period}</span>
                <span>Crop Nutrition Portfolio</span>
              </div>
            ) : tm ? (
              <div className="pm-topctx">
                <span><b>Territory Manager</b></span>
                <span>{tm.period}</span>
                <span>Territory workspace</span>
              </div>
            ) : mh ? (
              <div className="pm-topctx">
                <span><b>Marketing Head</b></span>
                <span>{mh.period}</span>
                <span>Regional marketing workspace</span>
              </div>
            ) : bh ? (
              <div className="pm-topctx bh-topctx">
                <span><b>Business Head</b></span>
                <span>FY 2026–27</span>
                <span>All regions · YTD</span>
              </div>
            ) : (
              <>
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
              </>
            )}

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
            <div className="page" key={screen}>
              <Screen />
            </div>
          </main>
        </div>
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        {personaOpen && <div className="nav-backdrop" style={{ background: 'transparent' }} onClick={() => setPersonaOpen(false)} />}
        {message && <div className="toast" role="status" key={message}>{message}</div>}
        <TooltipLayer />
      </div>
    </NavContext.Provider>
  );
}



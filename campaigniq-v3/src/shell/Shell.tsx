import { AlertCircle, ArrowLeftRight, Lightbulb, LayoutDashboard, Bell, BriefcaseBusiness, Calendar, CalendarCheck, ChartColumn, ChartColumnBig, ClipboardCheck, Palette, ChartColumnIncreasing, ChevronDown, CircleHelp, ClipboardList, Flag, Layers, LogOut, BotMessageSquare, Megaphone, ShieldCheck, Sprout, TrendingUp, UserRound, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PERSONAS } from '../auth/nav';
import type { Session } from '../auth/session';
import { FSM_SCOPES } from '../data/fsm';
import { useFsmStore } from '../store/fsmStore';
import { ZM_PORTFOLIOS, ZM_SCOPES } from '../data/zm';
import { useZmStore } from '../store/zmStore';
import { MH_SCOPES, useMhStore } from '../store/mhStore';
import { FY, PERIODS, SCOPES } from '../data/bh';
import { F, fsmNavKeyOf, LANDING, M, mhNavKeyOf, navKeyOf, personaOfPath, R, Z, zmNavKeyOf } from '../routes';
import { useBhData, useBhStore, type Scope } from '../store/bhStore';
import { Toasts } from '../ui/core';
import { attentionItems } from './attention';

type NavItem = { key: string; label: string; icon: LucideIcon; to: string };
const NAV: NavItem[] = [
  { key: 'command', label: 'Marketing and Command Centre', icon: ChartColumnIncreasing, to: R.command },
  { key: 'portfolio', label: 'Campaign Portfolio Performance', icon: Layers, to: R.portfolio },
  { key: 'investment', label: 'Marketing Investment & ROI', icon: ChartColumnBig, to: R.investment },
  { key: 'themes', label: 'Strategic Themes & Approvals', icon: ShieldCheck, to: R.inbox },
  { key: 'interventions', label: 'Strategic Interventions', icon: Flag, to: R.tracker },
  { key: 'assistant', label: 'AI Copilot workspace', icon: BotMessageSquare, to: R.assistant },
];

const NAV_FSM: NavItem[] = [
  { key: 'plan', label: 'My Plan', icon: ClipboardList, to: F.plan },
  { key: 'campaigns', label: 'My Campaigns', icon: Megaphone, to: F.campaigns },
  { key: 'execution', label: 'Campaign Execution', icon: CalendarCheck, to: F.execution },
  { key: 'impact', label: 'Impact & Learning', icon: TrendingUp, to: F.impact },
  { key: 'fsm-assistant', label: 'AI Copilot workspace', icon: BotMessageSquare, to: F.assistant },
];

const NAV_ZM: NavItem[] = [
  { key: 'performance', label: 'My Performance', icon: ChartColumn, to: Z.performance },
  { key: 'plans', label: 'Territory Plan Reviews', icon: ClipboardCheck, to: Z.plans },
  { key: 'themes', label: 'Assigned Themes', icon: Layers, to: Z.themes },
  { key: 'studio', label: 'Campaign Studio', icon: Palette, to: Z.concepts },
  { key: 'approvals', label: 'Activity Approvals', icon: ShieldCheck, to: Z.approvals },
  { key: 'zm-impact', label: 'Impact & Learning', icon: TrendingUp, to: Z.impact },
  { key: 'zm-assistant', label: 'AI Copilot workspace', icon: BotMessageSquare, to: Z.assistant },
];

const NAV_MH: NavItem[] = [
  { key: 'overview', label: 'National Marketing Overview', icon: LayoutDashboard, to: M.overview },
  { key: 'opportunity', label: 'Market Opportunity', icon: TrendingUp, to: M.opportunity('west') },
  { key: 'mh-plans', label: 'Business & Crop Plan Reviews', icon: ClipboardCheck, to: M.plans },
  { key: 'mh-studio', label: 'Campaign Strategy Studio', icon: Lightbulb, to: M.diagnosis },
  { key: 'mh-approvals', label: 'Approvals & Rollout', icon: Flag, to: M.proposals },
  { key: 'mh-performance', label: 'Portfolio Performance & Learning', icon: ChartColumn, to: M.performance },
  { key: 'mh-assistant', label: 'AI Copilot workspace', icon: BotMessageSquare, to: M.assistant },
];

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return ref;
}

function Dropdown({ trigger, children, right }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; right?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && <div className={`menu${right ? ' right' : ''}`}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

export function Shell({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const store = useBhStore();
  const data = useBhData();
  const fsm = useFsmStore();
  const persona = personaOfPath(pathname);
  const zm = useZmStore();
  const isFsm = persona === 'tm';
  const isZm = persona === 'pm';
  const mh = useMhStore();
  const isMh = persona === 'mh';
  const me = PERSONAS.find((p) => p.id === persona)!;
  const nav_ = isFsm ? NAV_FSM : isZm ? NAV_ZM : isMh ? NAV_MH : NAV;
  const active = isFsm ? fsmNavKeyOf(pathname) : isZm ? zmNavKeyOf(pathname) : isMh ? mhNavKeyOf(pathname) : navKeyOf(pathname);
  const zmAlerts = zm.proposalStatus.c1 === 'returned' ? [{ id: 'mh-return-c1', text: 'Marketing Head returned C1 for revision', to: Z.revise('c1') }] : [];
  const alerts = isFsm || isMh ? [] : isZm ? zmAlerts : attentionItems(store.themeStatus);
  const scopes: { id: string; label: string }[] = isFsm ? FSM_SCOPES : isZm ? ZM_SCOPES : isMh ? MH_SCOPES : SCOPES;
  const scopeId: string = isFsm ? fsm.scope : isZm ? zm.scope : isMh ? mh.scope : store.scope;
  const setScope = (id: string) => (isFsm ? fsm.setScope(id as typeof fsm.scope) : isZm ? zm.setScope(id as typeof zm.scope) : isMh ? mh.setScope(id as typeof mh.scope) : store.setScope(id as Scope));
  const scopeLabel = scopes.find((s) => s.id === scopeId)?.label ?? scopes[0].label;
  /** Personas this session may open: all built ones for the master login, otherwise its own. */
  const canOpen = (id: string) => !!PERSONAS.find((p) => p.id === id)?.built && !!LANDING[id] && (!!session.master || id === session.persona);
  const switchTo = (id: string) => { if (id !== persona && canOpen(id)) nav(LANDING[id]); };

  useEffect(() => { document.querySelector('.main')?.scrollTo(0, 0); }, [pathname]);

  if (!canOpen(persona)) return <Navigate to={LANDING[session.persona] ?? LANDING.strategy} replace />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Sprout size={26} color="var(--brand)" />
          <div><b>Mahadhan</b><b>Campaign<em>IQ</em></b></div>
        </div>
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><UserRound size={17} />{me.label}<ChevronDown size={15} /></button>}>
          {(close) => PERSONAS.map((p) => (
            <button key={p.id} type="button" className={p.id === persona ? 'on' : ''} disabled={!canOpen(p.id)} onClick={() => { switchTo(p.id); close(); }}>{p.label}{!p.built && <small>Not yet open</small>}</button>
          ))}
        </Dropdown>
        <span className="tb-sep" />
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><Calendar size={17} />{FY}<ChevronDown size={15} /></button>}>
          {(close) => <button type="button" className="on" onClick={close}>{FY}</button>}
        </Dropdown>
        <span className="tb-sep" />
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><Layers size={17} />{scopeLabel}<ChevronDown size={15} /></button>}>
          {(close) => scopes.map((s) => (
            <button key={s.id} type="button" className={s.id === scopeId ? 'on' : ''} onClick={() => { setScope(s.id); close(); }}>{s.label}</button>
          ))}
        </Dropdown>
        <span className="tb-sep" />
        {isZm && (
          <>
            <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><BriefcaseBusiness size={17} />{ZM_PORTFOLIOS.find((p) => p.id === zm.portfolio)?.label}<ChevronDown size={15} /></button>}>
              {(close) => ZM_PORTFOLIOS.map((p) => <button key={p.id} type="button" className={p.id === zm.portfolio ? 'on' : ''} onClick={() => { zm.setPortfolio(p.id); close(); }}>{p.label}</button>)}
            </Dropdown>
            <span className="tb-sep" />
          </>
        )}
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><CalendarCheck size={17} />{data.periodLabel}<ChevronDown size={15} /></button>}>
          {(close) => PERIODS.map((p) => <button key={p.id} type="button" className={p.id === data.period ? 'on' : ''} onClick={() => { store.setPeriod(p.id); close(); }}>{p.label}</button>)}
        </Dropdown>
        <div className="tb-right">
          <button type="button" className="icon-btn" aria-label="Help" title="AI Copilot workspace" onClick={() => nav(isFsm ? F.assistant : isZm ? Z.assistant : isMh ? M.assistant : R.assistant)}><CircleHelp size={19} /></button>
          <Dropdown right trigger={(_o, t) => <button type="button" className="icon-btn" aria-label="Notifications" onClick={t}><Bell size={19} />{alerts.length > 0 && <span className="dot" />}</button>}>
            {(close) => alerts.map((a) => <button key={a.id} type="button" onClick={() => { nav(a.to); close(); }}><AlertCircle size={15} color="var(--amber)" />{a.text}</button>)}
          </Dropdown>
          <Dropdown right trigger={(_o, t) => <button type="button" className="avatar" aria-label="Account" onClick={t}>{me.initials}</button>}>
            {(close) => (
              <>
                <button type="button" disabled>{session.name}</button>
                {PERSONAS.filter((p) => p.id !== persona && canOpen(p.id)).map((p) => (
                  <button key={p.id} type="button" onClick={() => { switchTo(p.id); close(); }}><ArrowLeftRight size={15} />Switch to {p.label}</button>
                ))}
                <button type="button" onClick={onSignOut}><LogOut size={15} />Sign out</button>
              </>
            )}
          </Dropdown>
        </div>
      </header>
      <aside className="sidebar">
        {nav_.map((n) => (
          <button key={n.key} type="button" className={`nav-item${n.key === active ? ' on' : ''}`} onClick={() => nav(n.to)}>
            <n.icon size={19} />{n.label}
          </button>
        ))}
      </aside>
      <main className="main"><Outlet /></main>
      <Toasts items={store.toasts} />
    </div>
  );
}

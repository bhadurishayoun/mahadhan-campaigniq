import { AlertCircle, Bell, Calendar, CalendarCheck, ChartColumnBig, ChartColumnIncreasing, ChevronDown, CircleHelp, Flag, Layers, LogOut, BotMessageSquare, ShieldCheck, Sprout, UserRound, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PERSONAS } from '../auth/nav';
import { FY, PERIOD, SCOPES } from '../data/bh';
import { navKeyOf, R, type NavKey } from '../routes';
import { useBhStore, type Scope } from '../store/bhStore';
import { Toasts } from '../ui/core';
import { attentionItems } from './attention';

const NAV: { key: NavKey; label: string; icon: LucideIcon; to: string }[] = [
  { key: 'command', label: 'Marketing and Command Centre', icon: ChartColumnIncreasing, to: R.command },
  { key: 'portfolio', label: 'Campaign Portfolio Performance', icon: Layers, to: R.portfolio },
  { key: 'investment', label: 'Marketing Investment & ROI', icon: ChartColumnBig, to: R.investment },
  { key: 'themes', label: 'Strategic Themes & Approvals', icon: ShieldCheck, to: R.inbox },
  { key: 'interventions', label: 'Strategic Interventions', icon: Flag, to: R.tracker },
  { key: 'assistant', label: 'AI Copilot workspace', icon: BotMessageSquare, to: R.assistant },
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

export function Shell({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const store = useBhStore();
  const active = navKeyOf(pathname);
  const alerts = attentionItems(store.themeStatus);
  const scopeLabel = SCOPES.find((s) => s.id === store.scope)?.label ?? SCOPES[0].label;

  useEffect(() => { document.querySelector('.main')?.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Sprout size={26} color="var(--brand)" />
          <div><b>Mahadhan</b><b>Campaign<em>IQ</em></b></div>
        </div>
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><UserRound size={17} />Business Head<ChevronDown size={15} /></button>}>
          {(close) => PERSONAS.map((p) => (
            <button key={p.id} type="button" className={p.id === 'strategy' ? 'on' : ''} disabled={!p.built} onClick={close}>{p.label}{!p.built && <small>Not yet open</small>}</button>
          ))}
        </Dropdown>
        <span className="tb-sep" />
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><Calendar size={17} />{FY}<ChevronDown size={15} /></button>}>
          {(close) => <button type="button" className="on" onClick={close}>{FY}</button>}
        </Dropdown>
        <span className="tb-sep" />
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><Layers size={17} />{scopeLabel}<ChevronDown size={15} /></button>}>
          {(close) => SCOPES.map((s) => (
            <button key={s.id} type="button" className={s.id === store.scope ? 'on' : ''} onClick={() => { store.setScope(s.id as Scope); close(); }}>{s.label}</button>
          ))}
        </Dropdown>
        <span className="tb-sep" />
        <Dropdown trigger={(_o, t) => <button type="button" className="tb-select" onClick={t}><CalendarCheck size={17} />{PERIOD}<ChevronDown size={15} /></button>}>
          {(close) => <button type="button" className="on" onClick={close}>{PERIOD}</button>}
        </Dropdown>
        <div className="tb-right">
          <button type="button" className="icon-btn" aria-label="Help" title="AI Copilot workspace" onClick={() => nav(R.assistant)}><CircleHelp size={19} /></button>
          <Dropdown right trigger={(_o, t) => <button type="button" className="icon-btn" aria-label="Notifications" onClick={t}><Bell size={19} />{alerts.length > 0 && <span className="dot" />}</button>}>
            {(close) => alerts.map((a) => <button key={a.id} type="button" onClick={() => { nav(a.to); close(); }}><AlertCircle size={15} color="var(--amber)" />{a.text}</button>)}
          </Dropdown>
          <Dropdown right trigger={(_o, t) => <button type="button" className="avatar" aria-label="Account" onClick={t}>BH</button>}>
            {() => (
              <>
                <button type="button" disabled>{userName}</button>
                <button type="button" onClick={onSignOut}><LogOut size={15} />Sign out</button>
              </>
            )}
          </Dropdown>
        </div>
      </header>
      <aside className="sidebar">
        {NAV.map((n) => (
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

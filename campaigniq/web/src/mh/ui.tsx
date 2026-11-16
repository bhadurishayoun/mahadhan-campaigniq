import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { cx, Pill, type Tone } from '../ui';

export function toneOf(text: string): Tone {
  const t = text.toLowerCase();
  if (/not verified|unresolved|disabled|returned|rejected|not established|missing|not sent|exception/.test(t)) return 'red';
  if (/approved|validated|verified|complete|endorsed|reconciled|aligned|active|selected|sent|resolved|published/.test(t)) return 'green';
  if (/pending|to confirm|to verify|awaiting|required|conditional|review|unvalidated|provisional|not yet|not available|not determinable|not submitted|not approved|indicative|incomplete|data pending/.test(t)) return 'amber';
  if (/draft|placeholder|illustrative|read-only|forecast|assumed|n\/a/.test(t)) return 'grey';
  return 'grey';
}

export function Status({ children, tone, solid }: { children: string; tone?: Tone; solid?: boolean }) {
  return <Pill tone={tone ?? toneOf(children)} solid={solid}>{children}</Pill>;
}
function PersonaPulseMh() {
  return (
    <section className="persona-pulse persona-pulse-mh" aria-label="Marketing Head visual summary">
      <div className="persona-pulse-chip">Strategic Control</div>
      <div className="persona-pulse-row">
        <span>Opportunity realization</span><i style={{ width: '84%' }} /><b>84%</b>
      </div>
      <div className="persona-pulse-row persona-pulse-amber">
        <span>Conditional approvals</span><i style={{ width: '58%' }} /><b>58%</b>
      </div>
      <div className="persona-pulse-row">
        <span>Rollout discipline</span><i style={{ width: '79%' }} /><b>79%</b>
      </div>
    </section>
  );
}

export function MhPage({ crumbs, code, title, status, subtitle, actions, children, className }: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { go } = useNav();
  return (
    <div className={cx('pm-page', 'persona-page persona-page-mh', className)}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Home size={13} />
        <span className="crumb">
          <ChevronRight size={12} />
          <button type="button" onClick={() => go('mh.1')}>Marketing Head</button>
        </span>
        {crumbs.map((item, index) => (
          <span key={item.label} className={cx('crumb', index === crumbs.length - 1 && 'crumb-current')}>
            <ChevronRight size={12} />
            {item.to ? <button type="button" onClick={() => go(item.to!)}>{item.label}</button> : item.label}
          </span>
        ))}
      </nav>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title-row">
            <span className="code-chip">{code}</span>
            <h1>{title}</h1>
            {status && <Status>{status}</Status>}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <PersonaPulseMh />
      {children}
    </div>
  );
}

export function MhPlaceholder({ note }: { note: string }) {
  return (
    <div className="pm-grid">
      <div className="pm-card">
        <h3>Mockup-driven build</h3>
        <p className="pm-muted">{note}</p>
      </div>
    </div>
  );
}





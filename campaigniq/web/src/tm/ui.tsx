import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { PulseStrip, type PulseItem } from '../ui/index';
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

export const TM_PULSE: PulseItem[] = [
  { label: 'Network readiness', value: 78 },
  { label: 'Cluster risk watch', value: 61, tone: 'amber' },
  { label: 'Outlet coverage', value: 73 },
];

export function TmPage({ crumbs, code, title, status, subtitle, actions, children, className, pulse }: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pulse?: PulseItem[];
}) {
  const { go } = useNav();
  return (
    <div className={cx('pm-page', 'persona-page persona-page-tm', className)}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Home size={13} />
        <span className="crumb">
          <ChevronRight size={12} />
          <button type="button" onClick={() => go('tm.1')}>Territory Manager</button>
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
      <PulseStrip title="Territory Pulse" ariaLabel="Territory Manager visual summary" items={pulse ?? TM_PULSE} />
      {children}
    </div>
  );
}

export interface TmSectionRow {
  label: string;
  value: string;
  action?: { label: string; to: ScreenId };
}

export function TmSection({ title, rows }: { title: string; rows: TmSectionRow[] }) {
  const { go } = useNav();
  return (
    <div className="pm-card">
      <div className="pm-card-head">
        <h3>{title}</h3>
      </div>
      <table className="pm-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.value}</td>
              <td style={{ textAlign: 'right' }}>
                {row.action && (
                  <button type="button" className="pm-btn" onClick={() => go(row.action!.to)}>
                    {row.action.label}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





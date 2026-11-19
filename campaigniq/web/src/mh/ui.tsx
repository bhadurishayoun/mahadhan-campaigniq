import { useEffect, useRef, type ReactNode } from 'react';
import { useNav, type ScreenId } from '../nav';
import { cx, type Tone } from '../ui';
import { StatusChip } from '../ui/kit';
import { PersonaHeader } from '../ui/system';
import { MH_SCREENS } from './nav';

export function toneOf(text: string): Tone {
  const t = text.toLowerCase();
  if (/not verified|unresolved|disabled|returned|rejected|not established|missing|not sent|exception/.test(t)) return 'red';
  if (/approved|validated|verified|complete|endorsed|reconciled|aligned|active|selected|sent|resolved|published/.test(t)) return 'green';
  if (/pending|to confirm|to verify|awaiting|required|conditional|review|unvalidated|provisional|not yet|not available|not determinable|not submitted|not approved|indicative|incomplete|data pending/.test(t)) return 'amber';
  if (/draft|placeholder|illustrative|read-only|forecast|assumed|n\/a/.test(t)) return 'grey';
  return 'grey';
}

export function Status({ children, tone }: { children: string; tone?: Tone; solid?: boolean }) {
  const resolved = tone ?? toneOf(children);
  const kind = resolved === 'green' ? 'ok' : resolved === 'amber' ? 'warn' : resolved === 'red' ? 'risk' : 'pending';
  return <StatusChip kind={kind}>{children}</StatusChip>;
}

export function MhPage({  code, title, status, subtitle, actions, children, className }: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  status?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { filters, marketingScope, marketingRegion } = useNav();
  const filterKey = [marketingScope, marketingRegion, filters.geography, filters.crop, filters.portfolio].join('|');
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const cleanLabels = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        if (textNode.parentElement?.closest('.cq-chips')) continue;
        const original = textNode.textContent ?? '';
        const cleaned = original.replace(/illustrative/gi, '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1');
        if (cleaned !== original) textNode.textContent = cleaned;
      }
    };
    cleanLabels();
    const observer = new MutationObserver(cleanLabels);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [code, filterKey]);
  return (
    <div key={filterKey} ref={pageRef} className={cx('pm-page', 'persona-page persona-page-mh', className)} data-screen={code} data-filter-key={filterKey}>
      <PersonaHeader list={MH_SCREENS} id={code} title={title} subtitle={subtitle} status={status} actions={actions} />
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





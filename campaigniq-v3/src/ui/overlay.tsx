import { X } from 'lucide-react';
import { Fragment, useEffect, type ReactNode } from 'react';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

/** Right drawer (900px) over a dimmed page. */
export function Drawer({ title, status, onClose, children, footer, width = 900 }: { title: string; status?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEscape(onClose);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={title} style={{ width }}>
        <header className="drawer-head">
          <h2>{title}</h2>
          <div className="right">{status}<button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </>
  );
}

export function Modal({ title, status, onClose, children, footer }: { title: string; status?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <div className="right">{status}<button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </>
  );
}

/** Read-only evidence from another persona's records, shown inside the Business Head workspace. */
export interface Evidence {
  title: string;
  owner: string;
  facts: { label: string; value: ReactNode }[];
  status?: ReactNode;
}

export function EvidenceDrawer({ evidence, onClose }: { evidence: Evidence; onClose: () => void }) {
  return (
    <Drawer title={evidence.title} status={evidence.status} onClose={onClose} width={560}>
      <div className="muted">{evidence.owner}</div>
      <div className="kv">
        {evidence.facts.map((f) => (
          <Fragment key={f.label}><span>{f.label}</span><b>{f.value}</b></Fragment>
        ))}
      </div>
    </Drawer>
  );
}

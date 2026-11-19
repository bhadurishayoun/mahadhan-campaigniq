/** Field Sales Manager visuals: Jalna/Ambad maps, donut, progress ring, icon infographics, stage timeline, approval pipeline. */
import type { ReactNode } from 'react';
import { Check, Clock, type LucideIcon } from 'lucide-react';
import { MapCard } from '../ui/index';
import type { MapMarker, MapTone } from '../map/IndiaDistrictMap';
import { cx } from '../ui';

export const JALNA_VIEW = { district: 'Jalna', state: 'Maharashtra' } as const;

/** Map place ids for the Ambad campaign villages (verified coordinates in map/places.json). */
export const VILLAGE_PLACE: Record<string, string> = {
  Dhanora: 'v-dhanora',
  'Wadi Gaon': 'v-wadigaon',
  'Ambad HQ': 'v-ambad',
  Pimpalgaon: 'v-pimpalgaon',
  'Other villages': 'v-shahagad',
};

export const MAP_COLORS = { green: 'var(--ok)', amber: 'var(--accent-600)', red: 'var(--risk)', grey: 'var(--ink-400)', blue: 'var(--info)' };

/** Map of the Jalna cluster (Ambad and neighbouring talukas), framed on the district. */
export function TmMap({ title, label, markers, talukas, selected, scale, markerLegend, height = 300, className }: {
  title: string;
  label: string;
  markers: MapMarker[];
  talukas?: Record<string, { info?: ReactNode; tone?: MapTone; onSelect?: () => void }>;
  selected?: string;
  scale?: { title: string; items: { label: string; tone: MapTone }[] };
  markerLegend?: { label: string; color: string }[];
  height?: number;
  className?: string;
}) {
  return (
    // Taluka maps frame the whole district; village maps zoom to the villages (with their talukas visible).
    <MapCard title={title} label={label} markers={markers} talukas={talukas ?? {}} view={talukas ? JALNA_VIEW : 'markers'} selected={selected}
      scale={scale} markerLegend={markerLegend} height={height} className={cx('tm-map', className)} />
  );
}

/** SVG donut with a centre label. */
export function Donut({ segments, center, sub, size = 150 }: { segments: { label: string; value: number; color: string }[]; center: ReactNode; sub?: ReactNode; size?: number }) {
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="tm-donut">
      <div className="tm-donut-svg" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--neutral-bg)" strokeWidth="18" />
          {segments.map((s) => {
            const len = (Math.max(s.value, 0) / total) * c;
            const el = <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="18" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"><title>{s.label}</title></circle>;
            offset += len;
            return el;
          })}
        </svg>
        <div className="tm-donut-center"><b>{center}</b>{sub && <small>{sub}</small>}</div>
      </div>
      <ul className="tm-donut-legend">
        {segments.map((s) => <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><b>{((s.value / total) * 100).toFixed(1).replace(/\.0$/, '')}%</b></li>)}
      </ul>
    </div>
  );
}

/** Progress ring (0-100). */
export function Ring({ value, label, sub, tone = 'green', size = 104 }: { value: number; label: ReactNode; sub?: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue'; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = { green: MAP_COLORS.green, amber: MAP_COLORS.amber, red: MAP_COLORS.red, blue: MAP_COLORS.blue }[tone];
  return (
    <div className="tm-ring">
      <div className="tm-ring-svg" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" role="img" aria-label={`${pct.toFixed(0)}%`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--neutral-bg)" strokeWidth="10" />
          {pct > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)" />}
        </svg>
        <b>{label}</b>
      </div>
      {sub && <small>{sub}</small>}
    </div>
  );
}

/** Icon tiles: "4 demos · 3 retailer sessions ..." style infographic. */
export function IconTiles({ items }: { items: { icon: LucideIcon; value: ReactNode; label: string; note?: ReactNode; tone?: 'green' | 'amber' | 'blue' | 'grey' }[] }) {
  return (
    <div className="tm-icon-tiles">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cx('tm-icon-tile', item.tone && `tm-icon-${item.tone}`)}>
            <span className="tm-icon-badge"><Icon size={18} /></span>
            <div><b>{item.value}</b><span>{item.label}</span>{item.note && <small>{item.note}</small>}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Repeated pictograms, e.g. 4 demo icons with 1 highlighted. */
export function Pictogram({ icon: Icon, count, done = 0, risk = 0 }: { icon: LucideIcon; count: number; done?: number; risk?: number }) {
  return (
    <span className="tm-picto" aria-label={`${count} units`}>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} size={15} className={i < done ? 'done' : i < done + risk ? 'risk' : ''} />
      ))}
    </span>
  );
}

/** Crop-stage timeline with a highlighted campaign window. */
export function StageTimeline({ stages, focus, caption }: { stages: { label: string; days: string }[]; focus: [number, number]; caption?: ReactNode }) {
  return (
    <div className="tm-stage-line">
      <div className="tm-stage-track">
        {stages.map((s, i) => (
          <div key={s.label} className={cx('tm-stage-seg', i >= focus[0] && i <= focus[1] && 'focus')}>
            <b>{s.label}</b><small>{s.days}</small>
          </div>
        ))}
      </div>
      {caption && <small className="tm-muted">{caption}</small>}
    </div>
  );
}

/** Horizontal approval pipeline with per-step state. */
export function ApprovalPipeline({ steps, current }: { steps: { role: string; action: string; who?: string; sla?: string; skipped?: boolean }[]; current: number }) {
  return (
    <ol className="tm-pipeline">
      {steps.map((step, index) => {
        const state = step.skipped ? 'skipped' : index < current ? 'done' : index === current ? 'active' : 'pending';
        return (
          <li key={step.role} className={`tm-pipe-${state}`}>
            <span className="tm-pipe-dot">{state === 'done' ? <Check size={14} /> : state === 'active' ? <Clock size={13} /> : index + 1}</span>
            <div>
              <b>{step.role}</b>
              <span>{step.action}</span>
              {step.who && <small>{step.who}</small>}
              <em>{state === 'done' ? 'Completed' : state === 'active' ? `In progress · SLA ${step.sla ?? ''}` : state === 'skipped' ? 'Not required' : 'Pending'}</em>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

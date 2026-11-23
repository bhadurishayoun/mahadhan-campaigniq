/** Small building blocks shared by the Zonal Manager screens (same row and notes styles as FSM). */
import { Droplet, FlaskConical, Leaf, Lightbulb, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { MAPPING_STATUS_LABEL, mappingStatus, PLAN_STATUS_LABEL, planStatus, type CategoryId, type MappingStatus, type PlanStatus } from '../../data/zm';
import type { ZmTerritoryId } from '../../routes';
import { useFsmStore } from '../../store/fsmStore';
import { useZmStore } from '../../store/zmStore';
import { Card, StatusChip, type Tone } from '../../ui/core';

export interface ListItem { icon?: LucideIcon; label: ReactNode; value?: ReactNode; tone?: 'warn' | 'risk' }
export function List({ items }: { items: ListItem[] }) {
  return <>{items.map((i, k) => (
    <div key={k} className="list-row">
      {i.icon && <i.icon size={16} color={i.tone === 'warn' ? 'var(--amber)' : i.tone === 'risk' ? 'var(--risk)' : undefined} />}
      <span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}
    </div>
  ))}</>;
}

/** Notes / checks card: Lightbulb icon, rows spread evenly to fill the card. */
export function Notes({ title, items, icon = Lightbulb, right }: { title: string; items: ReactNode[]; icon?: LucideIcon; right?: ReactNode }) {
  return (
    <Card title={title} icon={icon} right={right}>
      <div className="notes-fill"><List items={items.map((label) => ({ label }))} /></div>
    </Card>
  );
}

const CAT_ICON: Record<CategoryId, LucideIcon> = { croptek: Leaf, 'water-soluble': Droplet, specialty: FlaskConical };
/** Category name inside a neutral chip with its icon (row icons sit inside the chip, never before centred names). */
export function CategoryChip({ id, name }: { id: CategoryId; name: string }) {
  return <StatusChip tone="neutral" icon={CAT_ICON[id]}>{name}</StatusChip>;
}

export const PLAN_TONE: Record<PlanStatus, Tone> = { awaiting: 'neutral', submitted: 'warn', returned: 'risk', endorsed: 'ok' };
export const MAPPING_TONE: Record<MappingStatus, Tone> = { validated: 'ok', needs_review: 'warn', awaiting: 'neutral', requested: 'risk' };

/** Plan and mapping status for a territory, combining the FSM submission and Zonal Manager decisions. */
export function useZmStatus() {
  const fsm = useFsmStore();
  const zm = useZmStore();
  const plan = (t: ZmTerritoryId) => planStatus(t, fsm.submitted, zm.planDecisions);
  const mapping = (t: ZmTerritoryId) => mappingStatus(t, zm.mapping);
  return {
    plan,
    mapping,
    planChip: (t: ZmTerritoryId) => <StatusChip tone={PLAN_TONE[plan(t)]}>{PLAN_STATUS_LABEL[plan(t)]}</StatusChip>,
    mappingChip: (t: ZmTerritoryId) => <StatusChip tone={MAPPING_TONE[mapping(t)]}>{MAPPING_STATUS_LABEL[mapping(t)]}</StatusChip>,
  };
}

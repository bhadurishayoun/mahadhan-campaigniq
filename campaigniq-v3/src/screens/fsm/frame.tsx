/** Page frame shared by the Field Sales Manager screens: breadcrumb, title row, content, Back / Next footer. */
import { ChartColumn, CircleCheck, MapPin, Sprout, Store, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { F, type FsmTerritoryId } from '../../routes';
import { Breadcrumb, FooterBar, PageHeader, StepTabs } from '../../ui/core';
import { useBack, useGo } from '../common';

export function FsmPage({ section, sectionTo, trail, title, right, back, next, nextLabel, children }: {
  section: string; sectionTo: string; trail?: string; title: string; right?: ReactNode;
  back: string; next: string | (() => void); nextLabel?: string; children?: ReactNode;
}) {
  const go = useGo();
  const onBack = useBack(back);
  return (
    <div className="page">
      <Breadcrumb items={[{ label: section, onClick: () => go(sectionTo) }, ...(trail ? [{ label: trail }] : []), { label: title }]} />
      <PageHeader title={title} right={right} />
      {children}
      <FooterBar onBack={onBack} onNext={typeof next === 'string' ? () => go(next) : next} nextLabel={nextLabel} />
    </div>
  );
}

const TERRITORIES: FsmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];

/** Territory from the route (`:territory`), Ambad when missing or unknown. */
export function useTerritory(): FsmTerritoryId {
  const { territory } = useParams();
  return TERRITORIES.includes(territory as FsmTerritoryId) ? (territory as FsmTerritoryId) : 'ambad';
}

const PLAN_TABS: { label: string; icon: LucideIcon; to: (t: FsmTerritoryId) => string }[] = [
  { label: 'My Performance', icon: ChartColumn, to: () => F.plan },
  { label: 'Territory Network', icon: MapPin, to: F.network },
  { label: 'Outlet Planning', icon: Store, to: F.outlets },
  { label: 'Crop & Product Plan', icon: Sprout, to: F.crop },
  { label: 'Review & Approval', icon: CircleCheck, to: F.review },
];

/** The 5 My Plan tabs; each opens its screen for the territory being planned. */
export function PlanTabs({ active, territory = 'ambad' }: { active: number; territory?: FsmTerritoryId }) {
  const go = useGo();
  return <StepTabs active={active} items={PLAN_TABS.map((t) => ({ label: t.label, icon: t.icon, onClick: () => go(t.to(territory)) }))} />;
}

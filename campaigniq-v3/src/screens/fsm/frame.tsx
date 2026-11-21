/** Page frame shared by the Field Sales Manager screens: breadcrumb, title row, content, Back / Next footer. */
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { FsmTerritoryId } from '../../routes';
import { Breadcrumb, FooterBar, PageHeader } from '../../ui/core';
import { useBack, useGo } from '../common';

export function FsmPage({ section, sectionTo, title, right, back, next, nextLabel, children }: {
  section: string; sectionTo: string; title: string; right?: ReactNode;
  back: string; next: string; nextLabel?: string; children?: ReactNode;
}) {
  const go = useGo();
  const onBack = useBack(back);
  return (
    <div className="page">
      <Breadcrumb items={[{ label: section, onClick: () => go(sectionTo) }, { label: title }]} />
      <PageHeader title={title} right={right} />
      {children}
      <FooterBar onBack={onBack} onNext={() => go(next)} nextLabel={nextLabel} />
    </div>
  );
}

const TERRITORIES: FsmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur'];

/** Territory from the route (`:territory`), Ambad when missing or unknown. */
export function useTerritory(): FsmTerritoryId {
  const { territory } = useParams();
  return TERRITORIES.includes(territory as FsmTerritoryId) ? (territory as FsmTerritoryId) : 'ambad';
}

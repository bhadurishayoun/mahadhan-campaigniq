/** Page frame and navigation shared by the Marketing Head screens (same frame as the other personas). */
import { ClipboardList, FileText, ListChecks, Search, Stethoscope, type LucideIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { M, type MhRegionId } from '../../routes';
import { StepTabs } from '../../ui/core';
import { useGo } from '../common';
export { FsmPage as MhPage } from '../fsm/frame';

export const MH_REGIONS: MhRegionId[] = ['west', 'south', 'north', 'east'];

/** Region from the route (`:region`), West when missing or unknown. */
export function useMhRegion(): MhRegionId {
  const { region } = useParams();
  return MH_REGIONS.includes(region as MhRegionId) ? (region as MhRegionId) : 'west';
}

/** Sidebar sections: breadcrumb root label and target. */
export const MH_SECTION = {
  overview: { section: 'National marketing overview', sectionTo: M.overview },
  opportunity: { section: 'Market opportunity', sectionTo: M.opportunity('west') },
  plans: { section: 'Business & crop plan reviews', sectionTo: M.plans },
  studio: { section: 'Campaign strategy studio', sectionTo: M.diagnosis },
  approvals: { section: 'Approvals & rollout', sectionTo: M.proposals },
  performance: { section: 'Portfolio performance & learning', sectionTo: M.performance },
  assistant: { section: 'AI Copilot workspace', sectionTo: M.assistant },
} as const;

const STUDIO_TABS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Diagnosis', icon: Stethoscope, to: M.diagnosis },
  { label: 'Investigation', icon: Search, to: M.investigation },
  { label: 'Recommendations', icon: ListChecks, to: M.recommendations },
  { label: 'Theme brief', icon: FileText, to: M.themeBrief },
  { label: 'Theme tracker', icon: ClipboardList, to: M.themes },
];

/** Campaign Strategy Studio sub-navigation (screens 6–13). */
export function MhStudioTabs({ active }: { active: number }) {
  const go = useGo();
  return <StepTabs active={active} items={STUDIO_TABS.map((t) => ({ label: t.label, icon: t.icon, onClick: () => go(t.to) }))} />;
}

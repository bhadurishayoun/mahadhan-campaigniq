/** Page frame and navigation shared by the Zonal Manager screens (same frame as the Field Sales Manager). */
import { Calculator, FileStack, FileText, Lightbulb, Palette, PenLine, Send, ShieldCheck, Target, type LucideIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Z, type ZmTerritoryId } from '../../routes';
import { StepTabs } from '../../ui/core';
import { useGo } from '../common';
export { FsmPage as ZmPage } from '../fsm/frame';

export const ZM_TERRITORIES: ZmTerritoryId[] = ['ambad', 'ghansawangi', 'badnapur', 'jafrabad', 'bhokardan'];

/** Territory from the route (`:territory`), Ambad when missing or unknown. */
export function useZmTerritory(): ZmTerritoryId {
  const { territory } = useParams();
  return ZM_TERRITORIES.includes(territory as ZmTerritoryId) ? (territory as ZmTerritoryId) : 'ambad';
}

/** Sidebar sections: breadcrumb root label and target. */
export const ZM_SECTION = {
  performance: { section: 'My performance', sectionTo: Z.performance },
  plans: { section: 'Territory plan reviews', sectionTo: Z.plans },
  themes: { section: 'Assigned themes', sectionTo: Z.themes },
  studio: { section: 'Campaign studio', sectionTo: Z.concepts },
  approvals: { section: 'Activity approvals', sectionTo: Z.approvals },
  impact: { section: 'Impact & learning', sectionTo: Z.impact },
  assistant: { section: 'AI Copilot workspace', sectionTo: Z.assistant },
} as const;

const STUDIO_TABS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Concepts', icon: Lightbulb, to: Z.concepts },
  { label: 'Proposition', icon: Target, to: Z.proposition },
  { label: 'Collateral', icon: Palette, to: Z.collateral },
  { label: 'Business case', icon: Calculator, to: Z.businessCase },
  { label: 'Proposals', icon: Send, to: Z.proposals },
];

/** Campaign Studio sub-navigation (screens 7–19). */
export function StudioTabs({ active }: { active: number }) {
  const go = useGo();
  return <StepTabs active={active} items={STUDIO_TABS.map((t) => ({ label: t.label, icon: t.icon, onClick: () => go(t.to) }))} />;
}

const COLLATERAL_STEPS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Select template', icon: FileStack, to: Z.collateral },
  { label: 'Configure inputs', icon: FileText, to: Z.collateral },
  { label: 'Generate draft', icon: PenLine, to: Z.editor },
  { label: 'Edit', icon: PenLine, to: Z.editor },
  { label: 'Technical approval', icon: ShieldCheck, to: Z.collateralApprovals },
];

/** Collateral wizard steps (screens 10–12), shown under the studio tabs. */
export function CollateralSteps({ active }: { active: number }) {
  const go = useGo();
  return <StepTabs active={active} items={COLLATERAL_STEPS.map((t) => ({ label: t.label, icon: t.icon, onClick: () => go(t.to) }))} />;
}

/** Zonal Manager screens not yet built out: title, breadcrumb and the wired Back / Next chain. Replaced phase by phase. */
import { Z } from '../../routes';
import { CollateralSteps, StudioTabs, ZmPage, ZM_SECTION, useZmTerritory } from './frame';

type Sec = keyof typeof ZM_SECTION;
interface Step { title: string; sec: Sec; back: string; next: string; nextLabel?: string; studio?: number; collateral?: number }

/** Screen order 1–26; Back falls back to the previous screen, Next follows the chain. */
export const ZM_CHAIN = (t = 'ambad' as Parameters<typeof Z.planReview>[0]): Step[] => [
  { title: 'My Performance and Product Portfolio ABP', sec: 'performance', back: Z.assistant, next: Z.plans, nextLabel: 'Review consolidated territory plans' },
  { title: 'Consolidated Territory Plans vs Portfolio ABP', sec: 'plans', back: Z.performance, next: Z.reconciliation },
  { title: 'SKU-to-Portfolio ABP Reconciliation', sec: 'plans', back: Z.plans, next: Z.planReview(t) },
  { title: 'Territory Plan Validation and Endorsement', sec: 'plans', back: Z.reconciliation, next: Z.revised(t) },
  { title: 'Revised Plan Comparison and Revalidation', sec: 'plans', back: Z.planReview(t), next: Z.themes, nextLabel: 'Endorse and forward to Marketing Head' },
  { title: 'Assigned Themes and Strategic Brief', sec: 'themes', back: Z.revised(t), next: Z.concepts, nextLabel: 'Acknowledge and develop concepts' },
  { title: 'Campaign Concept Studio', sec: 'studio', back: Z.themes, next: Z.compare, studio: 0 },
  { title: 'Concept Comparison and Consolidation', sec: 'studio', back: Z.concepts, next: Z.proposition, studio: 0 },
  { title: 'Proposition and Intervention Designer', sec: 'studio', back: Z.compare, next: Z.collateral, studio: 1 },
  { title: 'Collateral Templates and Draft Setup', sec: 'studio', back: Z.proposition, next: Z.editor, nextLabel: 'Generate draft and open editor', studio: 2, collateral: 1 },
  { title: 'Collateral Designer and Approval', sec: 'studio', back: Z.collateral, next: Z.versions, studio: 2, collateral: 3 },
  { title: 'Collateral Version Comparison', sec: 'studio', back: Z.editor, next: Z.collateralApprovals, nextLabel: 'Submit for technical review', studio: 2, collateral: 3 },
  { title: 'Collateral Review and Approval Tracker', sec: 'studio', back: Z.versions, next: Z.playbook, studio: 2 },
  { title: 'Campaign Playbook Release', sec: 'studio', back: Z.collateralApprovals, next: Z.businessCase, studio: 2 },
  { title: 'Business Case: Assumptions and Calculation', sec: 'studio', back: Z.playbook, next: Z.scenarios, studio: 3 },
  { title: 'Scenario Simulator', sec: 'studio', back: Z.businessCase, next: Z.reconcile, studio: 3 },
  { title: 'Audience and Benefit Reconciliation', sec: 'studio', back: Z.scenarios, next: Z.proposals, studio: 3 },
  { title: 'Proposal Review and Submission', sec: 'studio', back: Z.reconcile, next: Z.approvals, nextLabel: 'Submit to Marketing Head', studio: 4 },
  { title: 'Revision and Resubmission Workspace', sec: 'studio', back: Z.proposals, next: Z.proposals, studio: 4 },
  { title: 'Activity Approval Inbox', sec: 'approvals', back: Z.proposals, next: Z.approval(t) },
  { title: 'Territory Activity Plan Review', sec: 'approvals', back: Z.approvals, next: Z.impact, nextLabel: 'Approve local activity plan' },
  { title: 'Campaign Performance and Crop-wise Uplift', sec: 'impact', back: Z.approval(t), next: Z.detail },
  { title: 'Crop × Product × Geography Performance Detail', sec: 'impact', back: Z.impact, next: Z.diagnostics },
  { title: 'Campaign Diagnostics and Next-season Learning', sec: 'impact', back: Z.detail, next: Z.recommendations },
  { title: 'Next-season Learning and Recommendations', sec: 'impact', back: Z.diagnostics, next: Z.assistant, nextLabel: 'Submit recommendations to Marketing Head' },
  { title: 'AI Copilot workspace', sec: 'assistant', back: Z.recommendations, next: Z.performance },
];

export function ZmBlank({ n }: { n: number }) {
  const t = useZmTerritory();
  const s = ZM_CHAIN(t)[n - 1];
  return (
    <ZmPage {...ZM_SECTION[s.sec]} title={s.title} back={s.back} next={s.next} nextLabel={s.nextLabel}>
      {s.studio !== undefined && <StudioTabs active={s.studio} />}
      {s.collateral !== undefined && <CollateralSteps active={s.collateral} />}
    </ZmPage>
  );
}

/** Marketing Head screens not yet built out: title, breadcrumb and the wired Back / Next chain. Replaced phase by phase. */
import { M } from '../../routes';
import { MhPage, MhStudioTabs, MH_SECTION, useMhRegion } from './frame';

type Sec = keyof typeof MH_SECTION;
interface Step { title: string; sec: Sec; back: string; next: string; nextLabel?: string; studio?: number }

/** Screen order 1–22; Back falls back to the previous screen, Next follows the chain. */
const chain = (r: Parameters<typeof M.opportunity>[0]): Step[] => [
  { title: 'National Marketing Opportunity & Performance', sec: 'overview', back: M.assistant, next: M.opportunity(r) },
  { title: 'Regional Market Opportunity & Product Sales', sec: 'opportunity', back: M.overview, next: M.plans },
  { title: 'Business & Crop Plan Alignment Review', sec: 'plans', back: M.opportunity(r), next: M.planDetail(r) },
  { title: 'Regional Business Plan Detail & Intervention Review', sec: 'plans', back: M.plans, next: M.planTerritory() },
  { title: 'Contributing Territory Plan Detail', sec: 'plans', back: M.planDetail(r), next: M.diagnosis, nextLabel: 'Flag marketing opportunity' },
  { title: 'Market & Historical Performance Diagnosis', sec: 'studio', back: M.planTerritory(), next: M.recommendations, studio: 0 },
  { title: 'Campaign Recommendations', sec: 'studio', back: M.diagnosis, next: M.investigation, nextLabel: 'Request further analysis', studio: 2 },
  { title: 'Farmer Conversion Investigation Results', sec: 'studio', back: M.recommendations, next: M.evidence, studio: 1 },
  { title: 'Evidence Request Tracking & Validation', sec: 'studio', back: M.investigation, next: M.updated, studio: 1 },
  { title: 'Updated Investigation & Growth Barrier Diagnosis', sec: 'studio', back: M.evidence, next: M.refreshed, studio: 1 },
  { title: 'Refreshed Recommendations & Selection', sec: 'studio', back: M.updated, next: M.themeBrief, nextLabel: 'Design selected campaign', studio: 2 },
  { title: 'Strategic Theme Brief & Zonal Manager Assignment', sec: 'studio', back: M.refreshed, next: M.themes, studio: 3 },
  { title: 'Theme Assignment & Development Tracker', sec: 'studio', back: M.themeBrief, next: M.proposals, studio: 4 },
  { title: 'Zonal Manager Proposal Review & Comparison', sec: 'approvals', back: M.themes, next: M.proposal() },
  { title: 'Detailed Proposal & Business Case Review', sec: 'approvals', back: M.proposals, next: M.compare, nextLabel: 'Compare with other proposal' },
  { title: 'Proposal Comparison & Strategic Evaluation', sec: 'approvals', back: M.proposal(), next: M.decision() },
  { title: 'Campaign Approval & Rollout Authorisation', sec: 'approvals', back: M.compare, next: M.rollout(), nextLabel: 'Approve campaign' },
  { title: 'Approved Campaign Release & Territory Rollout', sec: 'approvals', back: M.decision(), next: M.performance, nextLabel: 'Publish to eligible Field Sales Managers' },
  { title: 'National & Regional Campaign Portfolio Performance', sec: 'performance', back: M.rollout(), next: M.programme(r) },
  { title: 'Regional Programme Performance & Rollout', sec: 'performance', back: M.performance, next: M.drivers(r) },
  { title: 'Regional Performance Driver Diagnostics', sec: 'performance', back: M.programme(r), next: M.assistant, nextLabel: 'Request optimisation review' },
  { title: 'AI Copilot workspace', sec: 'assistant', back: M.drivers(r), next: M.overview },
];

export function MhBlank({ n }: { n: number }) {
  const r = useMhRegion();
  const s = chain(r)[n - 1];
  return (
    <MhPage {...MH_SECTION[s.sec]} title={s.title} back={s.back} next={s.next} nextLabel={s.nextLabel}>
      {s.studio !== undefined && <MhStudioTabs active={s.studio} />}
    </MhPage>
  );
}

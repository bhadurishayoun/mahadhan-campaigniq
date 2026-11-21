/** Screens 1–5 — My Plan: performance, territory network, outlet targets, crop plan, plan review. */
import { F } from '../../routes';
import { FsmPage, useTerritory } from './frame';

const SECTION = 'My plan';

export function MyPerformance() {
  return <FsmPage section={SECTION} sectionTo={F.plan} title="My Business Plan" back={F.assistant} next={F.network()} />;
}

export function TerritoryNetwork() {
  const t = useTerritory();
  return <FsmPage section={SECTION} sectionTo={F.plan} title="Territory Network & Channel Mapping" back={F.plan} next={F.outlets(t)} />;
}

export function OutletPlanning() {
  const t = useTerritory();
  return <FsmPage section={SECTION} sectionTo={F.plan} title="Outlet Business Planning & Target Allocation" back={F.network(t)} next={F.crop(t)} />;
}

export function CropPlanning() {
  const t = useTerritory();
  return <FsmPage section={SECTION} sectionTo={F.plan} title="Village-wise Crop, Product & Coverage Planning" back={F.outlets(t)} next={F.review(t)} />;
}

export function PlanReview() {
  const t = useTerritory();
  return <FsmPage section={SECTION} sectionTo={F.plan} title="Business & Crop Plan Review" back={F.crop(t)} next={F.campaigns} nextLabel="Submit for approval" />;
}

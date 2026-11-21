/** Screens 6–10 — My Campaigns: business priority, then the 4-step campaign wizard. */
import { F } from '../../routes';
import { FsmPage } from './frame';

const SECTION = 'My campaigns';

export function SelectPriority() {
  return <FsmPage section={SECTION} sectionTo={F.campaigns} title="Select Business Priority" back={F.review()} next={F.objective} nextLabel="Create campaign draft" />;
}

export function WizardObjective() {
  return <FsmPage section={SECTION} sectionTo={F.campaigns} title="Objective & Targeting" back={F.campaigns} next={F.activities} />;
}

export function WizardActivities() {
  return <FsmPage section={SECTION} sectionTo={F.campaigns} title="Activity & Budget Mix" back={F.objective} next={F.scenario} />;
}

export function WizardScenario() {
  return <FsmPage section={SECTION} sectionTo={F.campaigns} title="Scenario & Expected Outcomes" back={F.activities} next={F.wizardReview} />;
}

export function WizardReview() {
  return <FsmPage section={SECTION} sectionTo={F.campaigns} title="Review & Submit" back={F.scenario} next={F.execution} nextLabel="Submit for campaign approval" />;
}

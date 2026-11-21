/** Screens 11–12 — Campaign Execution: live control tower and activity corrective action. */
import { AT_RISK_ACTIVITY } from '../../data/fsm';
import { F } from '../../routes';
import { FsmPage } from './frame';

const SECTION = 'Campaign execution';

export function ControlTower() {
  return <FsmPage section={SECTION} sectionTo={F.execution} title="Campaign Execution — Live Control Tower" back={F.wizardReview} next={F.activity(AT_RISK_ACTIVITY)} nextLabel="View activity and take action" />;
}

export function ActivityExecution() {
  return <FsmPage section={SECTION} sectionTo={F.execution} title="Activity Execution & Corrective Action" back={F.execution} next={F.impact} nextLabel="Save and assign corrective action" />;
}

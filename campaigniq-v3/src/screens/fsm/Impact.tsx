/** Screens 13–14 — Impact & Learning: campaign impact and village-wise conversion diagnostic. */
import { AT_RISK_ACTIVITY } from '../../data/fsm';
import { F } from '../../routes';
import { FsmPage } from './frame';

const SECTION = 'Impact & learning';

export function CampaignImpact() {
  return <FsmPage section={SECTION} sectionTo={F.impact} title="Campaign Impact & Business Performance" back={F.activity(AT_RISK_ACTIVITY)} next={F.diagnostic} nextLabel="Investigate performance drivers" />;
}

export function VillageDiagnostic() {
  return <FsmPage section={SECTION} sectionTo={F.impact} title="Village-wise Conversion Diagnostic" back={F.impact} next={F.assistant} />;
}

/** Screen 15 — AI Copilot workspace for territory business and campaigns. */
import { F } from '../../routes';
import { FsmPage } from './frame';

export function FsmAssistant() {
  return <FsmPage section="AI Copilot workspace" sectionTo={F.assistant} title="AI Copilot workspace" back={F.diagnostic} next={F.plan} />;
}

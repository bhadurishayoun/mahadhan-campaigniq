import { useNav } from '../nav';
import { isBhScreen } from './nav';
import { BhScreen } from './screens';

export { BH_TABS, BH_SCREENS, bhMeta, isBhScreen } from './nav';
export type { BhScreenId, BhTabId } from './nav';
export { BhScreen } from './screens';

export function BusinessHeadScreen() {
  const { screen } = useNav();
  if (!isBhScreen(screen)) return null;
  return <BhScreen screen={screen} />;
}

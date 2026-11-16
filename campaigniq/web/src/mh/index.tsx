/**
 * Marketing Head persona: screen registry and the shell that renders the current screen.
 */
import type { ComponentType } from 'react';
import { useNav } from '../nav';
import { MH_SCREENS, isMhScreen, type MhScreenId } from './nav';
import {
  Mh1, Mh2, Mh3, Mh3a, Mh3b,
  Mh4, Mh4a, Mh4aI2, Mh4aI3, Mh4aI4, Mh4b,
  Mh5, Mh6, Mh7, Mh7a, Mh7b,
  Mh8, Mh8a,
  Mh9, Mh9a, Mh9b, Mh9c, Mh9d,
  MhAi1,
} from './screens';

export { MH_SCREENS, MH_TABS, isMhScreen, mhMeta } from './nav';
export type { MhScreenId, MhTabId } from './nav';

const REGISTRY: Record<MhScreenId, ComponentType> = {
  'mh.1': Mh1,
  'mh.2': Mh2,
  'mh.3': Mh3,
  'mh.3a': Mh3a,
  'mh.3b': Mh3b,
  'mh.4': Mh4,
  'mh.4a': Mh4a,
  'mh.4a-i2': Mh4aI2,
  'mh.4a-i3': Mh4aI3,
  'mh.4a-i4': Mh4aI4,
  'mh.4b': Mh4b,
  'mh.5': Mh5,
  'mh.6': Mh6,
  'mh.7': Mh7,
  'mh.7a': Mh7a,
  'mh.7b': Mh7b,
  'mh.8': Mh8,
  'mh.8a': Mh8a,
  'mh.9': Mh9,
  'mh.9a': Mh9a,
  'mh.9b': Mh9b,
  'mh.9c': Mh9c,
  'mh.9d': Mh9d,
  'mh.ai1': MhAi1,
};

export function MhScreen() {
  const { screen } = useNav();
  if (!isMhScreen(screen)) return null;
  const Current = REGISTRY[screen];
  return <Current />;
}

export const MH_SCREEN_COUNT = MH_SCREENS.length;


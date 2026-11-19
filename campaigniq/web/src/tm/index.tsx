/**
 * Field Sales Manager persona: screen registry and the shell that renders the current screen.
 * Screens mirror the approved V2 mockups (ui-mockups/V2-persona-mockup-specs.md); TM.C2 / TM.C3 complete the
 * TM.C1 journey (Review & Approval, Campaign Portfolio).
 */
import type { ComponentType } from 'react';
import { useNav } from '../nav';
import { TM_SCREENS, isTmScreen, type TmScreenId } from './nav';
import { Tm1, Tm2, Tm3, Tm4, Tm5 } from './plan';
import { Cw1, Cw2, Cw3, Cw4, TmC1, TmC2, TmC3 } from './campaigns';
import { TmAi1, TmEx0, TmEx1, TmEx2, TmIm1, TmIm2 } from './execution';
import './tm.css';

export { TM_SCREENS, TM_TABS, isTmScreen, tmMeta } from './nav';
export type { TmScreenId, TmTabId } from './nav';

const REGISTRY: Record<TmScreenId, ComponentType> = {
  'tm.1': Tm1,
  'tm.2': Tm2,
  'tm.3': Tm3,
  'tm.4': Tm4,
  'tm.5': Tm5,
  'tm.c1': TmC1,
  'cw.1': Cw1,
  'cw.2': Cw2,
  'cw.3': Cw3,
  'cw.4': Cw4,
  'tm.c2': TmC2,
  'tm.c3': TmC3,
  'tm.ex0': TmEx0,
  'tm.ex1': TmEx1,
  'tm.ex2': TmEx2,
  'tm.im1': TmIm1,
  'tm.im2': TmIm2,
  'tm.ai1': TmAi1,
};

export function TmScreen() {
  const { screen } = useNav();
  if (!isTmScreen(screen)) return null;
  const Current = REGISTRY[screen];
  return <Current />;
}

export const TM_SCREEN_COUNT = TM_SCREENS.length;

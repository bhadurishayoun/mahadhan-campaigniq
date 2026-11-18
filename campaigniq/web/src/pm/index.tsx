/**
 * Zonal Manager persona: screen registry and the shell that renders overlays (drawers / modals) over their
 * dimmed parent screen.
 */
import type { ComponentType } from 'react';
import { useNav } from '../nav';
import { PM_SCREENS, isPmScreen, pmMeta, type PmScreenId } from './nav';
import { Pm1, Pm2, Pm2a, Pm2b, Pm3, Pm3b, Pm3c, Pm3d } from './reviews';
import { Pm4, Pm4a, Pm4b, Pm4c } from './themes';
import { Pm5, Pm5a, Pm5b, Pm5c, Pm6, Pm6a, Pm6b } from './studio';
import { Pm7, Pm7a, Pm7b, Pm7c, Pm7d, Pm7e } from './collateral';
import { Pm8, Pm8a, Pm8b, Pm8c, Pm8d, Pm8e, Pm8f, PmOpt1 } from './business';
import { Pm9, Pm9a, Pm9b, Pm9c, Pm9d, Pm9e } from './approvals';
import { Pm10, Pm10a, Pm10b, Pm10c, Pm11, Pm11a, Pm11b, Pm11c, Pm11d, PmAi1 } from './impact';
import './pm.css';

export { PM_SCREENS, PM_TABS, isPmScreen, pmMeta } from './nav';
export type { PmScreenId, PmTabId } from './nav';

const REGISTRY: Record<PmScreenId, ComponentType> = {
  'pm.1': Pm1,
  'pm.2': Pm2, 'pm.2a': Pm2a, 'pm.2b': Pm2b,
  'pm.3': Pm3, 'pm.3b': Pm3b, 'pm.3c': Pm3c, 'pm.3d': Pm3d,
  'pm.4': Pm4, 'pm.4a': Pm4a, 'pm.4b': Pm4b, 'pm.4c': Pm4c,
  'pm.5': Pm5, 'pm.5a': Pm5a, 'pm.5b': Pm5b, 'pm.5c': Pm5c,
  'pm.6': Pm6, 'pm.6a': Pm6a, 'pm.6b': Pm6b,
  'pm.7': Pm7, 'pm.7a': Pm7a, 'pm.7b': Pm7b, 'pm.7c': Pm7c, 'pm.7d': Pm7d, 'pm.7e': Pm7e,
  'pm.8': Pm8, 'pm.8a': Pm8a, 'pm.8b': Pm8b, 'pm.8c': Pm8c, 'pm.8d': Pm8d, 'pm.8e': Pm8e, 'pm.8f': Pm8f, 'pm.opt1': PmOpt1,
  'pm.9b': Pm9b, 'pm.9': Pm9, 'pm.9a': Pm9a, 'pm.9c': Pm9c, 'pm.9d': Pm9d, 'pm.9e': Pm9e,
  'pm.10': Pm10, 'pm.10a': Pm10a, 'pm.10b': Pm10b, 'pm.10c': Pm10c,
  'pm.11': Pm11, 'pm.11a': Pm11a, 'pm.11b': Pm11b, 'pm.11c': Pm11c, 'pm.11d': Pm11d,
  'pm.ai1': PmAi1,
};

/** Renders the current Zonal Manager screen. Overlay screens show their parent dimmed behind them. */
export function PmScreen() {
  const { screen } = useNav();
  if (!isPmScreen(screen)) return null;
  const meta = pmMeta(screen);
  const Current = REGISTRY[screen];
  if (!meta.parent) return <Current />;
  const Parent = REGISTRY[meta.parent];
  return (
    <div className="pm-stage">
      <div className="pm-dim" aria-hidden><Parent /></div>
      <div className="pm-backdrop" aria-hidden />
      <Current />
    </div>
  );
}

export const PM_SCREEN_COUNT = PM_SCREENS.length;

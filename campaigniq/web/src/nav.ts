import { createContext, useContext } from 'react';
import type { Filters, ReferenceData, Scope } from './data/reference';
import { PM_SCREENS, type PmScreenId } from './pm/nav';
import { TM_SCREENS, type TmScreenId } from './tm/nav';
import { MH_SCREENS, type MhScreenId } from './mh/nav';
import { BH_SCREENS, type BhScreenId } from './bh/nav';

/** Screens of the original module-based workspace. */
export type ModuleScreenId =
  | 'p.1' | 'p.2' | 'p.3'
  | 's1.1' | 's1.2' | 's1.3' | 's1.4' | 's1.5'
  | 's2.1' | 's2.2' | 's2.3' | 's2.4' | 's2.5'
  | 's3.1' | 's3.2' | 's3.3' | 's3.4'
  | 's4.1' | 's4.2' | 's4.3' | 's4.4' | 's4.5'
  | 's5.1' | 's5.2' | 's5.3' | 's5.4'
  | 's6.1' | 's6.2'
  | 's7.1' | 's7.2'
  | 'ai.1'
  | 'admin.1';

export type ScreenId = ModuleScreenId | PmScreenId | TmScreenId | MhScreenId | BhScreenId;

/**
 * Modules used by the app.
 *
 * - Business Head, Zonal Manager, Field Sales Manager and Marketing Head use their own workspace routes.
 * - The legacy module screens remain available for navigation and demo workflows.
 */
export type ModuleId =
  | 'prototype'
  | 'command'
  | 'atlas'
  | 'nutrition'
  | 'studio'
  | 'readiness'
  | 'orchestration'
  | 'control'
  | 'impact'
  | 'copilot'
  | 'admin'
  | 'pm'
  | 'tm'
  | 'mh'
  | 'bh';

export type StrategyModuleId = Exclude<ModuleId, 'pm' | 'tm' | 'mh'>;

export type PersonaId = 'strategy' | 'pm' | 'tm' | 'mh';

export const PERSONAS: { id: PersonaId; label: string; sub: string; home: ScreenId; initials: string; available: boolean }[] = [
  { id: 'strategy', label: 'Business Head', sub: 'Portfolio, investment, marketing themes & decisions', home: 'bh.1', initials: 'BH', available: true },
  { id: 'pm', label: 'Zonal Manager', sub: 'Crop Nutrition Portfolio · V2 persona journey', home: 'pm.1', initials: 'PM', available: true },
  { id: 'tm', label: 'Field Sales Manager', sub: 'Territory plan, campaigns, execution and impact', home: 'tm.1', initials: 'TM', available: true },
  { id: 'mh', label: 'Marketing Head', sub: 'Regional strategy, approvals & rollout, performance learning', home: 'mh.1', initials: 'MH', available: true },
];

export const personaOf = (module: ModuleId): PersonaId => {
  if (module === 'pm') return 'pm';
  if (module === 'tm') return 'tm';
  if (module === 'mh') return 'mh';
  if (module === 'bh') return 'strategy';
  return 'strategy';
};

export interface ScreenMeta {
  id: ScreenId;
  code: string;
  title: string;
  module: ModuleId;
}

export const MODULES: { id: StrategyModuleId; label: string; home: ScreenId }[] = [
  { id: 'command', label: 'Business Overview', home: 's1.1' },
  { id: 'atlas', label: 'Market Opportunities', home: 's2.1' },
  { id: 'nutrition', label: 'Crop Nutrition', home: 's3.1' },
  { id: 'studio', label: 'Campaign Planning', home: 's4.1' },
  { id: 'readiness', label: 'Demand & Channel Readiness', home: 's5.1' },
  { id: 'orchestration', label: 'Field Execution', home: 's6.1' },
  { id: 'control', label: 'Activity Tracker', home: 's6.2' },
  { id: 'impact', label: 'Campaign Results', home: 's7.1' },
  { id: 'copilot', label: 'AI Copilot', home: 'ai.1' },
  { id: 'admin', label: 'Data Sources & Integrations', home: 'admin.1' },
];

export const SCREENS: ScreenMeta[] = [
  { id: 'p.1', code: 'P.1', title: 'Prototype Overview', module: 'prototype' },
  { id: 'p.2', code: 'P.2', title: 'Campaign Planner (Live)', module: 'prototype' },
  { id: 'p.3', code: 'P.3', title: 'Execution & Results (Live)', module: 'prototype' },
  { id: 's1.1', code: 'S1.1', title: 'Business Overview', module: 'command' },
  { id: 's1.2', code: 'S1.2', title: 'Campaign Portfolio', module: 'command' },
  { id: 's1.3', code: 'S1.3', title: 'Campaign Summary', module: 'command' },
  { id: 's1.4', code: 'S1.4', title: 'Risks & Issues', module: 'command' },
  { id: 's1.5', code: 'S1.5', title: 'Recovery Plan', module: 'command' },
  { id: 's2.1', code: 'S2.1', title: 'Opportunities by Crop & District', module: 'atlas' },
  { id: 's2.2', code: 'S2.2', title: 'Jalna Taluka View', module: 'atlas' },
  { id: 's2.3', code: 'S2.3', title: 'Ambad Village Segments', module: 'atlas' },
  { id: 's2.4', code: 'S2.4', title: 'Ambad Competition & Dealers', module: 'atlas' },
  { id: 's2.5', code: 'S2.5', title: 'Campaign Recommendations', module: 'atlas' },
  { id: 's3.1', code: 'S3.1', title: 'Crop Nutrition Calendar', module: 'nutrition' },
  { id: 's3.2', code: 'S3.2', title: 'Nutrition Needs by Crop Stage', module: 'nutrition' },
  { id: 's3.3', code: 'S3.3', title: 'Nutrition Programme Builder', module: 'nutrition' },
  { id: 's3.4', code: 'S3.4', title: 'Campaign Triggers', module: 'nutrition' },
  { id: 's4.1', code: 'S4.1', title: 'Portfolio & Templates', module: 'studio' },
  { id: 's4.2', code: 'S4.2', title: 'Create a Campaign', module: 'studio' },
  { id: 's4.3', code: 'S4.3', title: 'Activity & Channel Plan', module: 'studio' },
  { id: 's4.4', code: 'S4.4', title: 'Campaign Scenarios', module: 'studio' },
  { id: 's4.5', code: 'S4.5', title: 'Campaign Approval', module: 'studio' },
  { id: 's5.1', code: 'S5.1', title: 'Demand Forecast', module: 'readiness' },
  { id: 's5.2', code: 'S5.2', title: 'Stock & Supply Gaps', module: 'readiness' },
  { id: 's5.3', code: 'S5.3', title: 'Dealer & Retailer Readiness', module: 'readiness' },
  { id: 's5.4', code: 'S5.4', title: 'Stock Replenishment Plan', module: 'readiness' },
  { id: 's6.1', code: 'S6.1', title: 'Campaign Execution Tracker', module: 'orchestration' },
  { id: 's6.2', code: 'S6.2', title: 'Activity Follow-up', module: 'control' },
  { id: 's7.1', code: 'S7.1', title: 'Campaign Results', module: 'impact' },
  { id: 's7.2', code: 'S7.2', title: 'What Worked & Why', module: 'impact' },
  { id: 'ai.1', code: 'AI.1', title: 'AI Copilot', module: 'copilot' },
  { id: 'admin.1', code: 'ADM', title: 'Data Sources & Integrations', module: 'admin' },
  ...PM_SCREENS.map((screen) => ({ id: screen.id, code: screen.code, title: screen.title, module: 'pm' as const })),
  ...TM_SCREENS.map((screen) => ({ id: screen.id, code: screen.code, title: screen.title, module: 'tm' as const })),
  ...MH_SCREENS.map((screen) => ({ id: screen.id, code: screen.code, title: screen.title, module: 'mh' as const })),
  ...BH_SCREENS.map((screen) => ({ id: screen.id, code: screen.code, title: screen.title, module: 'bh' as const })),
];

export const screenMeta = (id: ScreenId) => SCREENS.find((screen) => screen.id === id)!;

export type { Filters, Scope } from './data/reference';

export interface NavState {
  screen: ScreenId;
  go: (id: ScreenId) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  /** Master-id version of the filters, used by datasets and the copilot. */
  scope: Scope;
  reference: ReferenceData;
  toast: (message: string) => void;
}

export const NavContext = createContext<NavState | null>(null);

export function useNav() {
  const value = useContext(NavContext);
  if (!value) throw new Error('useNav must be used inside the app shell');
  return value;
}


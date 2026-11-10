import { createContext, useContext } from 'react';
import type { Filters, ReferenceData, Scope } from './data/reference';

export type ScreenId =
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

export type ModuleId = 'prototype' | 'command' | 'atlas' | 'nutrition' | 'studio' | 'readiness' | 'orchestration' | 'control' | 'impact' | 'copilot' | 'admin';

export interface ScreenMeta {
  id: ScreenId;
  code: string;
  title: string;
  module: ModuleId;
}

export const MODULES: { id: ModuleId; label: string; home: ScreenId }[] = [
  { id: 'prototype', label: 'Prototype Showcase', home: 'p.1' },
  { id: 'command', label: 'Strategy Command Centre', home: 's1.1' },
  { id: 'atlas', label: 'Opportunity Atlas', home: 's2.1' },
  { id: 'nutrition', label: 'Crop Nutrition Intelligence', home: 's3.1' },
  { id: 'studio', label: 'Campaign Strategy Studio', home: 's4.1' },
  { id: 'readiness', label: 'Demand & Channel Readiness', home: 's5.1' },
  { id: 'orchestration', label: 'Campaign Orchestration Hub', home: 's6.1' },
  { id: 'control', label: 'Live Control Tower', home: 's6.2' },
  { id: 'impact', label: 'Campaign Impact & Learning', home: 's7.1' },
  { id: 'copilot', label: 'AI Co-pilot', home: 'ai.1' },
  { id: 'admin', label: 'Data Sources & Integrations', home: 'admin.1' },
];

export const SCREENS: ScreenMeta[] = [
  { id: 'p.1', code: 'P.1', title: 'Prototype Overview & Feature Map', module: 'prototype' },
  { id: 'p.2', code: 'P.2', title: 'Live Campaign Planning Engine', module: 'prototype' },
  { id: 'p.3', code: 'P.3', title: 'Live Execution & Performance', module: 'prototype' },
  { id: 's1.1', code: 'S1.1', title: 'Executive Strategy Command Centre', module: 'command' },
  { id: 's1.2', code: 'S1.2', title: 'Campaign Portfolio Dashboard', module: 'command' },
  { id: 's1.3', code: 'S1.3', title: 'Campaign Executive Summary', module: 'command' },
  { id: 's1.4', code: 'S1.4', title: 'Strategic Risk Analysis', module: 'command' },
  { id: 's1.5', code: 'S1.5', title: 'Recovery & Replanning', module: 'command' },
  { id: 's2.1', code: 'S2.1', title: 'Crop × Geography Opportunity Atlas', module: 'atlas' },
  { id: 's2.2', code: 'S2.2', title: 'Jalna District / Taluka Intelligence', module: 'atlas' },
  { id: 's2.3', code: 'S2.3', title: 'Ambad Micro-Market Segmentation', module: 'atlas' },
  { id: 's2.4', code: 'S2.4', title: 'Ambad Competition & Channel Intelligence', module: 'atlas' },
  { id: 's2.5', code: 'S2.5', title: 'Campaign Recommendations', module: 'atlas' },
  { id: 's3.1', code: 'S3.1', title: 'Crop Nutrition Calendar', module: 'nutrition' },
  { id: 's3.2', code: 'S3.2', title: 'Stage-wise Nutrition Intelligence', module: 'nutrition' },
  { id: 's3.3', code: 'S3.3', title: 'Complete Crop Nutrition Programme Builder', module: 'nutrition' },
  { id: 's3.4', code: 'S3.4', title: 'Campaign Trigger & Recommendation Engine', module: 'nutrition' },
  { id: 's4.1', code: 'S4.1', title: 'Portfolio & Templates', module: 'studio' },
  { id: 's4.2', code: 'S4.2', title: 'Campaign Creation Wizard', module: 'studio' },
  { id: 's4.3', code: 'S4.3', title: 'Activity & Channel Mix Planner', module: 'studio' },
  { id: 's4.4', code: 'S4.4', title: 'Campaign Scenario Simulator', module: 'studio' },
  { id: 's4.5', code: 'S4.5', title: 'Campaign Approval & Review', module: 'studio' },
  { id: 's5.1', code: 'S5.1', title: 'Campaign Demand Projection', module: 'readiness' },
  { id: 's5.2', code: 'S5.2', title: 'Stock Readiness & Supply Gap Intelligence', module: 'readiness' },
  { id: 's5.3', code: 'S5.3', title: 'Dealer & Retailer Readiness', module: 'readiness' },
  { id: 's5.4', code: 'S5.4', title: 'Supply Risk & Replenishment Planner', module: 'readiness' },
  { id: 's6.1', code: 'S6.1', title: 'Unified Campaign Execution Control Tower', module: 'orchestration' },
  { id: 's6.2', code: 'S6.2', title: 'Activity Execution & Action Workspace', module: 'control' },
  { id: 's7.1', code: 'S7.1', title: 'Campaign Impact & Effectiveness Dashboard', module: 'impact' },
  { id: 's7.2', code: 'S7.2', title: 'Campaign Diagnostics & Learning Studio', module: 'impact' },
  { id: 'ai.1', code: 'AI.1', title: 'Intelligent Copilot Workspace', module: 'copilot' },
  { id: 'admin.1', code: 'ADM', title: 'Data Sources & Integrations', module: 'admin' },
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

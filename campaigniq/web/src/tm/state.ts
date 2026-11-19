/**
 * Showcase state shared by the Field Sales Manager campaign screens: CW.4 submission -> TM.C2 approvals -> TM.C3 portfolio.
 * Kept in memory for the session only (a page reload starts the journey again).
 */
import { useSyncExternalStore } from 'react';

export const APPROVAL_STEPS = [
  { role: 'Field Sales Manager', action: 'Submits campaign', who: 'You', sla: 'Day 0' },
  { role: 'Product / content review', action: 'Advisory & claims check', who: 'Zonal Manager — Crop Nutrition', sla: '2 working days' },
  { role: 'Marketing Head', action: 'Campaign approval', who: 'Marketing Head — West Region', sla: '3 working days' },
  { role: 'Business Head', action: 'Threshold escalation', who: 'Only above ₹5.00 L budget — not required', sla: 'n/a' },
];

export interface CampaignState {
  /** 0 = draft, 1 = submitted, 2 = content reviewed, 3 = Marketing Head approved (launch unlocked) */
  stage: number;
}

let state: CampaignState = { stage: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const DEFAULT_EXECUTION_CAMPAIGN = 'ambad-onion-croptek';
const readCampaign = () => typeof window === 'undefined' ? DEFAULT_EXECUTION_CAMPAIGN : new URLSearchParams(window.location.search).get('campaign') || DEFAULT_EXECUTION_CAMPAIGN;
let selectedExecutionCampaign = readCampaign();
const campaignListeners = new Set<() => void>();
const emitExecutionCampaign = () => campaignListeners.forEach((listener) => listener());
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { selectedExecutionCampaign = readCampaign(); emitExecutionCampaign(); });

export function useExecutionCampaign() {
  return useSyncExternalStore((listener) => { campaignListeners.add(listener); return () => campaignListeners.delete(listener); }, () => selectedExecutionCampaign);
}

export function setExecutionCampaign(id: string) {
  if (!id || id === selectedExecutionCampaign) return;
  selectedExecutionCampaign = id;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('campaign', id);
    window.history.pushState({}, '', url);
  }
  emitExecutionCampaign();
}

export function useCampaignState(): CampaignState {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => state);
}

export function setCampaignStage(stage: number) {
  state = { stage: Math.max(0, Math.min(3, stage)) };
  emit();
}

export const stageLabel = (stage: number) =>
  ['Draft — pending validation', 'Submitted — in content review', 'Content reviewed — awaiting Marketing Head', 'Approved — launch unlocked'][stage];

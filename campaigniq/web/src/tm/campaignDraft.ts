import { useSyncExternalStore, type SetStateAction } from 'react';
import { ACTIVITIES, type ActivityLine } from './data';
import { calcLineBudget } from './costModel';

export const CAMPAIGN_DRAFT_KEY = 'ciq.cw2.lines';
export type CampaignDraftLine = ActivityLine & { manualBudget?: number; breakdown: string };

const calculate = (line: ActivityLine & { manualBudget?: number }): CampaignDraftLine => {
  const result = calcLineBudget(line);
  return { ...line, budget: line.manualBudget ?? result.budget, breakdown: result.breakdown };
};
const initialLines = () => ACTIVITIES.map(calculate);

function readDraft(): CampaignDraftLine[] {
  if (typeof localStorage === 'undefined') return initialLines();
  try {
    const stored = localStorage.getItem(CAMPAIGN_DRAFT_KEY);
    if (!stored) return initialLines();
    const parsed = JSON.parse(stored) as Array<ActivityLine & { manualBudget?: number }>;
    return Array.isArray(parsed) ? parsed.map(calculate) : initialLines();
  } catch {
    return initialLines();
  }
}

let lines = readDraft();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => lines;

function setDraftLines(update: SetStateAction<CampaignDraftLine[]>) {
  const next = typeof update === 'function' ? update(lines) : update;
  lines = next;
  try { localStorage.setItem(CAMPAIGN_DRAFT_KEY, JSON.stringify(lines)); } catch { /* Draft remains available for this session. */ }
  listeners.forEach((listener) => listener());
}

export function useCampaignDraft() {
  const currentLines = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const total = currentLines.reduce((sum, line) => sum + line.budget, 0);
  return { lines: currentLines, total: Math.round(total * 100) / 100, setLines: setDraftLines };
}

export function calculateDraftLine(line: ActivityLine & { manualBudget?: number }): CampaignDraftLine {
  return calculate(line);
}

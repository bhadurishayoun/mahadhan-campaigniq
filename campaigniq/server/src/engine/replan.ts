import { addDays } from './dates';

// 5.11 Replanning (weather).

export interface ReplanRiskInput {
  rainfall_dev_pct: number | null; // percentage points, e.g. -35 means 35% below normal
  anchor_date: string;
  today: string;
  threshold_pct?: number; // default -30
  window_days?: number; // default 15
}

export interface ReplanRisk {
  triggered: boolean;
  message: string;
  suggested_shift_days: number;
}

export function detectWeatherRisk(i: ReplanRiskInput): ReplanRisk {
  const threshold = i.threshold_pct ?? -30;
  const windowDays = i.window_days ?? 15;
  const daysToAnchor = Math.round(
    (new Date(i.anchor_date).getTime() - new Date(i.today).getTime()) / 86_400_000,
  );
  const triggered =
    i.rainfall_dev_pct !== null &&
    i.rainfall_dev_pct <= threshold &&
    daysToAnchor <= windowDays &&
    daysToAnchor >= -windowDays;
  return {
    triggered,
    suggested_shift_days: triggered ? 14 : 0,
    message: triggered
      ? `Rainfall is ${i.rainfall_dev_pct}% vs normal within ${windowDays} days of the anchor date: suggest shifting by 14 days`
      : 'No weather replan needed',
  };
}

export interface ReplanEvent {
  id: number;
  scheduled_date: string;
  status: string;
}

export interface ReplanResult {
  anchor_date: string;
  stock_needed_by: string | null;
  events: ReplanEvent[];
  moved_event_ids: number[];
  untouched_event_ids: number[];
}

const MOVABLE = new Set(['scheduled', 'planned', 'assigned', 'in_progress', 'delayed', 'moved']);

// Shift anchor, stage windows (derived from the anchor), stock date and every unreported event.
// Done / missed events are history and never move.
export function applyReplan(
  anchor_date: string,
  stock_needed_by: string | null,
  events: ReplanEvent[],
  shiftDays: number,
): ReplanResult {
  const moved: number[] = [];
  const untouched: number[] = [];
  const next = events.map((e) => {
    if (MOVABLE.has(e.status)) {
      moved.push(e.id);
      return { ...e, scheduled_date: addDays(e.scheduled_date, shiftDays), status: e.status === 'delayed' ? e.status : 'moved' };
    }
    untouched.push(e.id);
    return e;
  });
  return {
    anchor_date: addDays(anchor_date, shiftDays),
    stock_needed_by: stock_needed_by ? addDays(stock_needed_by, shiftDays) : null,
    events: next,
    moved_event_ids: moved,
    untouched_event_ids: untouched,
  };
}

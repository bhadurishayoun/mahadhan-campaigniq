import { addDays, dayOfWeek, diffDays, monthKey } from './dates';
import { sum } from './num';

// 5.10 Calendar generation and stock-needed-by dates.

export interface CropStageWindow {
  stage_name: string;
  start_day: number; // days from anchor date
  end_day: number;
  dose_packs_per_acre?: number;
}

export interface CalendarLine {
  activity_type_id: number;
  n: number;
  phase_split_pre: number;
  phase_split_on: number;
  phase_split_post: number;
}

export interface CalendarConfig {
  pre_window_days: number;
  skip_sundays: boolean;
  default_on_days: number;
  dealer_lead_time_days: number;
}

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  pre_window_days: 120,
  skip_sundays: true,
  default_on_days: 90,
  dealer_lead_time_days: 15,
};

export type Phase = 'pre' | 'on' | 'post';

export interface PhaseWindow {
  start: string;
  end: string;
}

export interface CalendarEventDraft {
  activity_type_id: number;
  scheduled_date: string;
  phase: Phase;
}

// pre  = anchor - pre_window_days .. anchor - 1
// on   = anchor .. day before the last crop stage
// post = the last crop stage (harvest)
export function phaseWindows(
  anchor: string,
  stages: CropStageWindow[],
  cfg: Partial<CalendarConfig> = {},
): Record<Phase, PhaseWindow> {
  const c = { ...DEFAULT_CALENDAR_CONFIG, ...cfg };
  const sorted = [...stages].sort((a, b) => a.start_day - b.start_day);
  const pre = { start: addDays(anchor, -c.pre_window_days), end: addDays(anchor, -1) };
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1];
    return {
      pre,
      on: { start: anchor, end: addDays(anchor, last.start_day - 1) },
      post: { start: addDays(anchor, last.start_day), end: addDays(anchor, last.end_day) },
    };
  }
  const onEnd = addDays(anchor, c.default_on_days);
  return {
    pre,
    on: { start: anchor, end: onEnd },
    post: { start: addDays(onEnd, 1), end: addDays(onEnd, 30) },
  };
}

// Largest-remainder split so the parts always add up to n.
export function splitCount(n: number, fractions: number[]): number[] {
  const total = sum(fractions) || 1;
  const exact = fractions.map((f) => (n * f) / total);
  const base = exact.map(Math.floor);
  let rest = n - sum(base);
  const order = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem);
  for (const o of order) {
    if (rest <= 0) break;
    base[o.i] += 1;
    rest -= 1;
  }
  return base;
}

function nonSunday(date: string, start: string, end: string, skip: boolean): string {
  if (!skip || dayOfWeek(date) !== 0) return date;
  const fwd = addDays(date, 1);
  if (diffDays(fwd, end) <= 0) return fwd;
  return addDays(date, -1) >= start ? addDays(date, -1) : date;
}

function spread(count: number, w: PhaseWindow, skipSundays: boolean): string[] {
  if (count <= 0) return [];
  const len = Math.max(diffDays(w.end, w.start) + 1, 1);
  const out: string[] = [];
  for (let j = 0; j < count; j++) {
    const offset = Math.min(len - 1, Math.floor(((j + 0.5) * len) / count));
    out.push(nonSunday(addDays(w.start, offset), w.start, w.end, skipSundays));
  }
  return out;
}

export function generateCalendar(
  anchor: string,
  stages: CropStageWindow[],
  lines: CalendarLine[],
  cfg: Partial<CalendarConfig> = {},
): CalendarEventDraft[] {
  const c = { ...DEFAULT_CALENDAR_CONFIG, ...cfg };
  const windows = phaseWindows(anchor, stages, c);
  const events: CalendarEventDraft[] = [];
  for (const line of lines) {
    const [nPre, nOn, nPost] = splitCount(line.n, [
      line.phase_split_pre,
      line.phase_split_on,
      line.phase_split_post,
    ]);
    const parts: [Phase, number][] = [
      ['pre', nPre],
      ['on', nOn],
      ['post', nPost],
    ];
    for (const [phase, count] of parts) {
      for (const d of spread(count, windows[phase], c.skip_sundays)) {
        events.push({ activity_type_id: line.activity_type_id, scheduled_date: d, phase });
      }
    }
  }
  return events.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}

export interface StockNeed {
  stock_needed_by: string | null;
  by_stage: { stage_name: string; start_date: string; end_date: string; packs: number }[];
  monthly: { month: string; packs: number }[];
}

// Stock-needed-by = first stage date that uses the product minus dealer lead time.
// Required packs per month come from the stage dose schedule (spread by days in each month).
export function stockNeeds(
  anchor: string,
  stages: CropStageWindow[],
  targetArea: number,
  cfg: Partial<CalendarConfig> = {},
): StockNeed {
  const c = { ...DEFAULT_CALENDAR_CONFIG, ...cfg };
  const using = stages
    .filter((s) => (s.dose_packs_per_acre ?? 0) > 0)
    .sort((a, b) => a.start_day - b.start_day);
  const by_stage = using.map((s) => ({
    stage_name: s.stage_name,
    start_date: addDays(anchor, s.start_day),
    end_date: addDays(anchor, s.end_day),
    packs: targetArea * (s.dose_packs_per_acre ?? 0),
  }));
  const months = new Map<string, number>();
  for (const s of by_stage) {
    const days = Math.max(diffDays(s.end_date, s.start_date) + 1, 1);
    const perDay = s.packs / days;
    for (let i = 0; i < days; i++) {
      const m = monthKey(addDays(s.start_date, i));
      months.set(m, (months.get(m) ?? 0) + perDay);
    }
  }
  return {
    stock_needed_by: by_stage.length ? addDays(by_stage[0].start_date, -c.dealer_lead_time_days) : null,
    by_stage,
    monthly: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, packs]) => ({ month, packs })),
  };
}

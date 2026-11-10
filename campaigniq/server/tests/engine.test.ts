import { describe, expect, it } from 'vitest';
import {
  applyReplan,
  assignSegment,
  auditEvent,
  calculatePlan,
  channelReadinessScore,
  envelopeSplit,
  forecastAccuracy,
  formatIndian,
  formatLakhCr,
  generateCalendar,
  learnedK,
  opportunityScore,
  penetration,
  runScenario,
  runScenarioSet,
  stockNeeds,
  suggestCheaperMix,
  type ActivityParams,
  type MixLine,
  type PlanInput,
} from '../src/engine';
import { ACTIVITY_LIBRARY, PLAYBOOKS, SEGMENT_RULES } from '../src/db/seedData/library';

const toParams = (id: number): ActivityParams => {
  const a = ACTIVITY_LIBRARY.find((x) => x.id === id)!;
  return {
    activity_type_id: a.id,
    name: a.name,
    kind: a.kind,
    r: a.r_default,
    k: a.k_default,
    c: a.unit_cost,
    phase_split_pre: a.phase_split_pre,
    phase_split_on: a.phase_split_on,
    phase_split_post: a.phase_split_post,
    bucket: a.bucket,
  };
};

const playbookLines = (segment: string): MixLine[] =>
  PLAYBOOKS[segment].map((p) => ({ activity: toParams(p.activity_type_id), share_pct: p.share_pct }));

const goldenInput = (over: Partial<PlanInput> = {}): PlanInput => ({
  crop_area: 3000,
  amp_pct: 0.3,
  current_treated_pct: 0.05,
  target_treated_pct: 0.1,
  dose_packs_per_acre: 2,
  pack_kg: 50,
  price_per_pack: 1800,
  avg_area_per_farmer: 2,
  segment_rules: SEGMENT_RULES,
  lines: playbookLines('Emerging'),
  config: { mdo_count: 1, active_weeks: 16 },
  ...over,
});

describe('golden test: Emerging onion MU', () => {
  const r = calculatePlan(goldenInput());
  const line = (id: number) => r.lines.find((l) => l.activity_type_id === id)!;

  it('segment and goal', () => {
    expect(r.penetration).toBeCloseTo(0.1667, 4);
    expect(r.segment).toBe('Emerging');
    expect(r.spend_cap_pct).toBe(0.3);
    expect(r.incremental_area).toBeCloseTo(150, 9);
    expect(r.y_packs).toBeCloseTo(600, 9);
    expect(r.y_tons).toBeCloseTo(30, 9);
    expect(r.incremental_packs).toBeCloseTo(300, 9);
    expect(r.incremental_value).toBeCloseTo(540000, 6);
    expect(r.farmers_to_convert).toBeCloseTo(75, 9);
  });

  it('activity lines', () => {
    expect(line(1)).toMatchObject({ n: 10, budget: 65000 });
    expect(line(1).farmers_i).toBeCloseTo(30, 9);
    expect(line(1).converts_per_unit).toBeCloseTo(3.0, 9);
    expect(line(2)).toMatchObject({ n: 3, budget: 60000 });
    expect(line(2).farmers_i).toBeCloseTo(22.5, 9);
    expect(line(2).converts_per_unit).toBeCloseTo(7.5, 9);
    expect(line(3)).toMatchObject({ n: 15, budget: 22500 });
    expect(line(3).converts_per_unit).toBeCloseTo(1.0, 9);
    expect(line(4)).toMatchObject({ n: 50, budget: 5000 });
    expect(line(4).converts_per_unit).toBeCloseTo(0.15, 9);
    expect(r.total_units).toBe(78);
    expect(r.budget).toBe(152500);
  });

  it('phasing within ₹5', () => {
    expect(Math.abs(r.budget_pre - 37875)).toBeLessThanOrEqual(5);
    expect(Math.abs(r.budget_on - 74625)).toBeLessThanOrEqual(5);
    expect(Math.abs(r.budget_post - 40000)).toBeLessThanOrEqual(5);
    expect(r.budget_pre + r.budget_on + r.budget_post).toBeCloseTo(r.budget, 6);
  });

  it('spend ratio is amber and unit costs match', () => {
    expect(r.spend_ratio).toBeCloseTo(0.2824, 4);
    const spend = r.checks.find((c) => c.check_name === 'spend_ratio')!;
    expect(spend.status).toBe('amber');
    expect(r.cost_per_farmer).toBeCloseTo(2033.33, 2);
    expect(r.cost_per_acre).toBeCloseTo(1016.67, 2);
    expect(r.cost_per_pack).toBeCloseTo(508.33, 2);
  });

  it('planned converts and capacity are green', () => {
    expect(r.planned_converts).toBeCloseTo(75, 9);
    expect(r.checks.find((c) => c.check_name === 'planned_converts')!.status).toBe('green');
    const cap = r.checks.find((c) => c.check_name === 'field_capacity')!;
    expect(cap.value).toBeCloseTo(4.875, 9);
    expect(cap.status).toBe('green');
    expect(r.can_submit).toBe(true);
  });
});

describe('segment boundaries', () => {
  it('0.25 is Growing and 0.80 is Matured', () => {
    expect(assignSegment(0.25, SEGMENT_RULES).segment).toBe('Growing');
    expect(assignSegment(0.8, SEGMENT_RULES).segment).toBe('Matured');
    expect(assignSegment(0.2499, SEGMENT_RULES).segment).toBe('Emerging');
    expect(assignSegment(0.5, SEGMENT_RULES).segment).toBe('Maturing');
    expect(penetration(0.05, 0.3)).toBeCloseTo(0.1667, 4);
  });

  it('manager override is applied and reported', () => {
    const r = calculatePlan(goldenInput({ segment_override: 'Growing' }));
    expect(r.segment).toBe('Growing');
    expect(r.segment_auto).toBe('Emerging');
    expect(r.segment_overridden).toBe(true);
    expect(r.spend_cap_pct).toBe(0.2);
  });
});

describe('checks', () => {
  it('target above AMP is red and blocks submit', () => {
    const r = calculatePlan(goldenInput({ target_treated_pct: 0.35 }));
    const c = r.checks.find((x) => x.check_name === 'target_vs_amp')!;
    expect(c.status).toBe('red');
    expect(c.message).toBe('Target exceeds market potential');
    expect(r.can_submit).toBe(false);
  });

  it('shares summing to 95% is red', () => {
    const lines = playbookLines('Emerging');
    lines[0] = { ...lines[0], share_pct: 0.35 };
    const r = calculatePlan(goldenInput({ lines }));
    expect(r.checks.find((x) => x.check_name === 'shares')!.status).toBe('red');
    expect(r.can_submit).toBe(false);
  });

  it('too many demos for the available innovative farmers is red', () => {
    const r = calculatePlan(goldenInput({ config: { mdo_count: 1, active_weeks: 16, innovative_farmers_mapped: 5 } }));
    expect(r.checks.find((x) => x.check_name === 'demo_farmers')!.status).toBe('red');
  });

  it('field capacity over the limit is red', () => {
    const r = calculatePlan(goldenInput({ config: { mdo_count: 1, active_weeks: 8 } }));
    expect(r.checks.find((x) => x.check_name === 'field_capacity')!.status).toBe('red');
  });

  it('editing the count (override) is respected and can fall short of the goal', () => {
    const lines = playbookLines('Emerging').map((l) => (l.activity.kind === 'demo' ? { ...l, n_override: 5 } : l));
    const r = calculatePlan(goldenInput({ lines }));
    expect(r.lines.find((l) => l.kind === 'demo')!.n).toBe(5);
    expect(r.checks.find((x) => x.check_name === 'planned_converts')!.status).toBe('red');
  });

  it('contingency is added on top of the activity budget', () => {
    const r = calculatePlan(goldenInput({ config: { mdo_count: 1, active_weeks: 16, contingency_pct: 0.05 } }));
    expect(r.budget).toBe(152500);
    expect(r.contingency).toBeCloseTo((152500 * 0.05) / 0.95, 6);
    expect(r.budget_total).toBeCloseTo(152500 / 0.95, 6);
    expect(r.contingency / r.budget_total).toBeCloseTo(0.05, 9);
  });
});

describe('cheaper mix', () => {
  it('lowers B and keeps planned converts >= F when the spend ratio is red', () => {
    // Raise unit costs so the golden plan breaches the 30% cap.
    const lines = playbookLines('Emerging').map((l) => ({ ...l, activity: { ...l.activity, c: l.activity.c * 1.3 } }));
    const input = goldenInput({ lines });
    const before = calculatePlan(input);
    expect(before.checks.find((c) => c.check_name === 'spend_ratio')!.status).toBe('red');

    const s = suggestCheaperMix(input);
    expect(s.needed).toBe(true);
    expect(s.improved).toBe(true);
    expect(s.after.budget).toBeLessThan(before.budget);
    expect(s.after.planned_converts + 1e-9).toBeGreaterThanOrEqual(s.after.farmers_to_convert);
    expect(s.suggested_shares.reduce((a, x) => a + x.share_pct, 0)).toBeCloseTo(1, 9);
    expect(s.moves.length).toBeGreaterThan(0);
  });

  it('does nothing when the plan already fits', () => {
    const s = suggestCheaperMix(goldenInput());
    expect(s.needed).toBe(false);
    expect(s.moves).toHaveLength(0);
  });
});

describe('retention plan', () => {
  it('uses the Matured playbook with total value as the spend base', () => {
    const r = calculatePlan(
      goldenInput({ current_treated_pct: 0.26, amp_pct: 0.3, target_treated_pct: 0.26, lines: playbookLines('Matured') }),
    );
    expect(r.mode).toBe('retention');
    expect(r.segment).toBe('Matured');
    expect(r.spend_ratio_base).toBe('total_value');
    // F = current_area / avg_area * retention_focus = 780 / 2 * 0.2
    expect(r.farmers_to_convert).toBeCloseTo(78, 9);
    expect(r.budget).toBeGreaterThan(0);
  });
});

describe('learning', () => {
  it('smoothed conversion rate', () => {
    const l = learnedK(0.12, 20, 5, 50);
    expect(l.k).toBeCloseTo(0.1571, 4);
    expect(l.source).toBe('learned');
    expect(l.sample_size).toBe(20);
    expect(learnedK(0.12, 0, 0).source).toBe('default');
  });
});

describe('envelope 70/20/10', () => {
  it('flags buckets more than 5pp off target', () => {
    const e = envelopeSplit([
      { bucket: 'proven', budget: 500 },
      { bucket: 'scaling', budget: 400 },
      { bucket: 'pilot', budget: 100 },
    ]);
    expect(e.buckets.find((b) => b.bucket === 'proven')!.flagged).toBe(true);
    expect(e.buckets.find((b) => b.bucket === 'pilot')!.flagged).toBe(false);
  });
});

describe('calendar, stock and replan', () => {
  const stages = [
    { stage_name: 'Vegetative', start_day: 0, end_day: 30, dose_packs_per_acre: 1 },
    { stage_name: 'Bulb initiation', start_day: 31, end_day: 60, dose_packs_per_acre: 1 },
    { stage_name: 'Maturity', start_day: 61, end_day: 90 },
  ];
  const r = calculatePlan(goldenInput());
  const events = generateCalendar('2026-12-15', stages, r.lines);

  it('creates n events per line, none on Sundays', () => {
    expect(events).toHaveLength(r.total_units);
    expect(events.every((e) => new Date(e.scheduled_date + 'T00:00:00Z').getUTCDay() !== 0)).toBe(true);
    const demos = events.filter((e) => e.activity_type_id === 1);
    expect(demos).toHaveLength(10);
    expect(demos.every((e) => e.phase === 'on')).toBe(true);
  });

  it('stock-needed-by is first dosed stage minus lead time', () => {
    const s = stockNeeds('2026-12-15', stages, 300);
    expect(s.stock_needed_by).toBe('2026-11-30');
    expect(s.by_stage[0].packs).toBe(300);
    expect(s.monthly.reduce((a, m) => a + m.packs, 0)).toBeCloseTo(600, 6);
  });

  it('replan moves scheduled events and stock dates but not done events', () => {
    const base = [
      { id: 1, scheduled_date: '2027-01-10', status: 'done' },
      { id: 2, scheduled_date: '2027-01-12', status: 'scheduled' },
      { id: 3, scheduled_date: '2027-01-20', status: 'assigned' },
    ];
    const res = applyReplan('2026-12-15', '2026-11-30', base, 14);
    expect(res.anchor_date).toBe('2026-12-29');
    expect(res.stock_needed_by).toBe('2026-12-14');
    expect(res.events.find((e) => e.id === 1)!.scheduled_date).toBe('2027-01-10');
    expect(res.events.find((e) => e.id === 2)!.scheduled_date).toBe('2027-01-26');
    expect(res.events.find((e) => e.id === 3)!.scheduled_date).toBe('2027-02-03');
    expect(res.moved_event_ids).toEqual([2, 3]);
    expect(res.untouched_event_ids).toEqual([1]);
  });
});

describe('audit flags', () => {
  const base = {
    attendance: 20,
    r: 25,
    c: 6500,
    actual_cost: 6500,
    gps_lat: 20.0,
    gps_lng: 75.0,
    photo_hash: 'abc',
    actual_date: '2027-01-10',
    submitted_date: '2027-01-10',
  };
  const centre = { lat: 20.0, lng: 75.0 };

  it('clean report has no flags', () => {
    expect(auditEvent(base, centre, false)).toHaveLength(0);
  });
  it('duplicate photo hash is flagged', () => {
    expect(auditEvent(base, centre, true).map((f) => f.flag_type)).toContain('duplicate_photo');
  });
  it('low attendance, far GPS, missing GPS, cost overrun, late report', () => {
    expect(auditEvent({ ...base, attendance: 10 }, centre, false).map((f) => f.flag_type)).toContain('low_attendance');
    expect(auditEvent({ ...base, gps_lat: 21.0 }, centre, false).map((f) => f.flag_type)).toContain('gps_far');
    expect(auditEvent({ ...base, gps_lat: null }, centre, false).map((f) => f.flag_type)).toContain('gps_missing');
    expect(auditEvent({ ...base, actual_cost: 9000 }, centre, false).map((f) => f.flag_type)).toContain('cost_overrun');
    expect(auditEvent({ ...base, submitted_date: '2027-01-15' }, centre, false).map((f) => f.flag_type)).toContain('late_report');
  });
});

describe('forward scenario simulator (CampaignIQ S4.4)', () => {
  const input = {
    target_farmers: 1832,
    assumptions: { reach_pct: 0.9, trial_pct: 0.4, adoption_pct: 0.81, repeat_pct: 0.8 },
    qty_per_adopter_kg: 393,
    price_per_mt: 24880,
    spend: 800000,
    contribution_margin_pct: 0.26,
  };
  it('reproduces the funnel: 1,832 -> 1,649 -> 660 -> 532', () => {
    const s = runScenario(input);
    expect(Math.round(s.reached)).toBe(1649);
    expect(Math.round(s.trialled)).toBe(660);
    expect(Math.round(s.adopted)).toBe(534); // 1832*.9*.4*.81 before rounding to whole farmers
    expect(s.incremental_demand_mt).toBeGreaterThan(200);
  });
  it('conservative < base < optimistic', () => {
    const set = runScenarioSet(input);
    expect(set.conservative.adopted).toBeLessThan(set.base.adopted);
    expect(set.base.adopted).toBeLessThan(set.optimistic.adopted);
  });
});

describe('scores and formatting', () => {
  it('opportunity score exposes its components', () => {
    const s = opportunityScore({
      market_potential: 5_200_000,
      peer_max_potential: 5_200_000,
      penetration_pct: 0.34,
      potential_pct: 0.62,
      channel_readiness: 0.79,
      conversion_feasibility: 0.9,
    });
    expect(s.score).toBeGreaterThan(70);
    expect(s.components).toHaveLength(4);
    expect(s.rule.length).toBeGreaterThan(10);
  });
  it('channel readiness score', () => {
    const s = channelReadinessScore({
      retailers_total: 74,
      retailers_stocking: 46,
      retailers_trained: 53,
      retailers_compliant: 70,
      villages_total: 126,
      villages_covered: 78,
    });
    expect(s.score).toBeGreaterThan(50);
  });
  it('forecast accuracy', () => {
    expect(forecastAccuracy(100, 90)).toBeCloseTo(0.9, 9);
    expect(forecastAccuracy(0, 5)).toBeNull();
  });
  it('Indian number formatting', () => {
    expect(formatIndian(152500)).toBe('1,52,500');
    expect(formatIndian(540000)).toBe('5,40,000');
    expect(formatIndian(999)).toBe('999');
    expect(formatLakhCr(152500)).toBe('₹1.53 L');
    expect(formatLakhCr(64000000)).toBe('₹6.4 Cr');
  });
});

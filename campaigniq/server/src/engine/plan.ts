import type {
  CheckStatus,
  EngineConfig,
  MixLine,
  PlanCheck,
  PlanInput,
  PlanLineResult,
  PlanResult,
} from './types';
import { DEFAULT_ENGINE_CONFIG } from './types';
import { assignSegment, penetration } from './segment';
import { safeCeil, sum } from './num';

// Steps 1-7 of the goal-backward MIT planning engine:
// Y = f(n1X1 + n2X2 + ... + nkXk)

export function calculatePlan(input: PlanInput): PlanResult {
  const cfg: EngineConfig = { ...DEFAULT_ENGINE_CONFIG, ...(input.config ?? {}) };

  // Step 1: segment
  const pen = penetration(input.current_treated_pct, input.amp_pct);
  const autoRule = assignSegment(pen, input.segment_rules);
  const overrideRule = input.segment_override
    ? input.segment_rules.find((r) => r.segment === input.segment_override)
    : undefined;
  const rule = overrideRule ?? autoRule;

  // Step 2: incremental area and volume goal (Y)
  const current_area = input.crop_area * input.current_treated_pct;
  const target_area = input.crop_area * input.target_treated_pct;
  const incremental_area = target_area - current_area;
  const mode: PlanResult['mode'] = incremental_area <= 0 ? 'retention' : 'growth';
  const y_packs = target_area * input.dose_packs_per_acre;
  const y_tons = (y_packs * input.pack_kg) / 1000;
  const incremental_packs = Math.max(incremental_area, 0) * input.dose_packs_per_acre;
  const incremental_value = incremental_packs * input.price_per_pack;
  const total_value = y_packs * input.price_per_pack;

  // Step 3: farmers to convert (decimal, never rounded). Retention plans use 5.9.
  const F =
    mode === 'growth'
      ? incremental_area / input.avg_area_per_farmer
      : (current_area / input.avg_area_per_farmer) * cfg.retention_focus;

  // Steps 4-6: mix, n, budget and phasing
  const lines = input.lines.map((l) => buildLine(l, F));

  const budget = sum(lines.map((l) => l.budget));
  const contingency = cfg.contingency_pct > 0 ? (budget * cfg.contingency_pct) / (1 - cfg.contingency_pct) : 0; // share of the total, as on the planner
  const budget_total = budget + contingency;
  const budget_pre = sum(lines.map((l) => l.budget_pre));
  const budget_on = sum(lines.map((l) => l.budget_on));
  const budget_post = sum(lines.map((l) => l.budget_post));
  const total_units = sum(lines.map((l) => l.n));
  const planned_converts = sum(lines.map((l) => l.planned_converts));

  const spend_ratio_base: PlanResult['spend_ratio_base'] =
    mode === 'growth' ? 'incremental_value' : 'total_value';
  const baseValue = mode === 'growth' ? incremental_value : total_value;
  const spend_ratio = baseValue > 0 ? budget_total / baseValue : 0;
  const cost_per_farmer = F > 0 ? budget_total / F : 0;
  const cost_per_acre = incremental_area > 0 ? budget_total / incremental_area : 0;
  const cost_per_pack = incremental_packs > 0 ? budget_total / incremental_packs : 0;

  const result: PlanResult = {
    mode,
    penetration: pen,
    segment: rule.segment,
    segment_auto: autoRule.segment,
    segment_overridden: !!overrideRule && overrideRule.segment !== autoRule.segment,
    objective: rule.objective,
    spend_cap_pct: rule.spend_cap_pct,
    current_area,
    target_area,
    incremental_area,
    y_packs,
    y_tons,
    incremental_packs,
    incremental_value,
    total_value,
    farmers_to_convert: F,
    lines,
    total_units,
    budget,
    contingency,
    budget_total,
    budget_pre,
    budget_on,
    budget_post,
    spend_ratio,
    spend_ratio_base,
    cost_per_farmer,
    cost_per_acre,
    cost_per_pack,
    planned_converts,
    checks: [],
    can_submit: false,
  };

  // Step 7: checks
  result.checks = runChecks(input, result, cfg);
  result.can_submit = !result.checks.some((c) => c.status === 'red');
  return result;
}

function buildLine(l: MixLine, F: number): PlanLineResult {
  const a = l.activity;
  const F_i = F * l.share_pct;
  const converts_per_unit = a.r * a.k;
  const computedN = converts_per_unit > 0 && F_i > 0 ? safeCeil(F_i / converts_per_unit) : 0;
  const n = l.n_override !== undefined && l.n_override !== null ? Math.max(0, Math.floor(l.n_override)) : computedN;
  const budget = n * a.c;
  return {
    activity_type_id: a.activity_type_id,
    name: a.name,
    kind: a.kind,
    bucket: a.bucket,
    share_pct: l.share_pct,
    r: a.r,
    k: a.k,
    c: a.c,
    r_source: a.r_source ?? 'default',
    k_source: a.k_source ?? 'default',
    k_sample_size: a.k_sample_size ?? null,
    farmers_i: F_i,
    converts_per_unit,
    n,
    budget,
    budget_pre: budget * a.phase_split_pre,
    budget_on: budget * a.phase_split_on,
    budget_post: budget * a.phase_split_post,
    phase_split_pre: a.phase_split_pre,
    phase_split_on: a.phase_split_on,
    phase_split_post: a.phase_split_post,
    planned_converts: n * converts_per_unit,
    cost_per_convert: converts_per_unit > 0 ? a.c / converts_per_unit : Infinity,
  };
}

function ratioStatus(ratio: number, cap: number, amberFactor: number): CheckStatus {
  if (ratio > cap) return 'red';
  if (ratio >= amberFactor * cap) return 'amber';
  return 'green';
}

function runChecks(input: PlanInput, p: PlanResult, cfg: EngineConfig): PlanCheck[] {
  const checks: PlanCheck[] = [];

  const status = ratioStatus(p.spend_ratio, p.spend_cap_pct, cfg.amber_factor);
  checks.push({
    check_name: 'spend_ratio',
    value: p.spend_ratio,
    limit: p.spend_cap_pct,
    status,
    message:
      status === 'red'
        ? `Budget is ${(p.spend_ratio * 100).toFixed(1)}% of ${labelBase(p.spend_ratio_base)}, above the ${(p.spend_cap_pct * 100).toFixed(0)}% ${p.segment} cap`
        : status === 'amber'
          ? `Budget is ${(p.spend_ratio * 100).toFixed(1)}% of ${labelBase(p.spend_ratio_base)}, close to the ${(p.spend_cap_pct * 100).toFixed(0)}% ${p.segment} cap`
          : `Budget is ${(p.spend_ratio * 100).toFixed(1)}% of ${labelBase(p.spend_ratio_base)}, within the ${(p.spend_cap_pct * 100).toFixed(0)}% ${p.segment} cap`,
  });

  checks.push(info('cost_per_farmer', p.cost_per_farmer, 'Cost per new farmer'));
  checks.push(info('cost_per_acre', p.cost_per_acre, 'Cost per incremental acre'));
  checks.push(info('cost_per_pack', p.cost_per_pack, 'Cost per incremental pack'));

  const weeklyLoad =
    p.total_units / (Math.max(cfg.mdo_count, 1) * Math.max(cfg.active_weeks, 1));
  checks.push({
    check_name: 'field_capacity',
    value: weeklyLoad,
    limit: cfg.max_activities_per_mdo_week,
    status: weeklyLoad > cfg.max_activities_per_mdo_week ? 'red' : 'green',
    message:
      weeklyLoad > cfg.max_activities_per_mdo_week
        ? `${weeklyLoad.toFixed(2)} activities per MDO per week exceeds the limit of ${cfg.max_activities_per_mdo_week}`
        : `${weeklyLoad.toFixed(2)} activities per MDO per week, within the limit of ${cfg.max_activities_per_mdo_week}`,
  });

  const demoLines = p.lines.filter((l) => l.kind === 'demo');
  if (demoLines.length) {
    const demos = sum(demoLines.map((l) => l.n));
    const available =
      cfg.innovative_farmers_mapped ?? cfg.villages_count * cfg.demo_farmers_per_village;
    checks.push({
      check_name: 'demo_farmers',
      value: demos,
      limit: available,
      status: demos > available ? 'red' : 'green',
      message:
        demos > available
          ? `${demos} demos planned but only ${available} innovative farmers available to host`
          : `${demos} demos planned, ${available} innovative farmers available to host`,
    });
  }

  const shareSum = sum(input.lines.map((l) => l.share_pct));
  const shareOk = Math.abs(shareSum - 1) <= cfg.share_tolerance;
  checks.push({
    check_name: 'shares',
    value: shareSum,
    limit: 1,
    status: shareOk ? 'green' : 'red',
    message: shareOk
      ? 'Activity shares add up to 100%'
      : `Activity shares add up to ${(shareSum * 100).toFixed(1)}%, must be 100%`,
  });

  const targetOk = input.target_treated_pct <= input.amp_pct + 1e-12;
  checks.push({
    check_name: 'target_vs_amp',
    value: input.target_treated_pct,
    limit: input.amp_pct,
    status: targetOk ? 'green' : 'red',
    message: targetOk
      ? 'Target is within market potential (AMP)'
      : 'Target exceeds market potential',
  });

  const met = p.planned_converts + 1e-9 >= p.farmers_to_convert;
  checks.push({
    check_name: 'planned_converts',
    value: p.planned_converts,
    limit: p.farmers_to_convert,
    status: met ? 'green' : 'red',
    message: met
      ? `Planned converts ${fmt(p.planned_converts)} meet the ${fmt(p.farmers_to_convert)} farmers to convert`
      : `Planned converts ${fmt(p.planned_converts)} fall short of ${fmt(p.farmers_to_convert)} farmers to convert`,
  });

  if (p.mode === 'retention') {
    checks.push({
      check_name: 'retention_mode',
      value: null,
      limit: null,
      status: 'green',
      info: true,
      message: 'Target is not above current coverage: retention plan, spend ratio uses total value',
    });
  }
  return checks;
}

function info(name: string, value: number, label: string): PlanCheck {
  return {
    check_name: name,
    value,
    limit: null,
    status: 'green',
    info: true,
    message: `${label}: ₹${value.toFixed(2)}`,
  };
}

const labelBase = (b: PlanResult['spend_ratio_base']) =>
  b === 'incremental_value' ? 'incremental value' : 'total value';
const fmt = (x: number) => (Math.round(x * 100) / 100).toString();

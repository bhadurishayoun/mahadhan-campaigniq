import type { Knex } from 'knex';
import { db } from '../db/knex';
import {
  assignSegment,
  calculatePlan,
  formatINR,
  formatIndian,
  formatLakhCr,
  penetration,
  type ActivityParams,
  type EngineConfig,
  type MixLine,
  type PlanInput,
  type PlanResult,
  type SegmentRule,
} from '../engine';
import { getConfig, todayISO, type AppConfig } from './config';
import { diffDays } from '../engine/dates';
import { badRequest, notFound } from '../http/errors';

export interface ShareInput {
  activity_type_id: number;
  share_pct: number;
  n_override?: number | null;
  r?: number;
  k?: number;
  c?: number;
}

export interface CalcRequest {
  mu_id: number;
  crop_id: number;
  season_id: number;
  product_id: number;
  target_treated_pct: number;
  shares?: ShareInput[];
  segment_override?: string | null;
  contingency_pct?: number;
  campaign_type?: string;
}

export const toSegmentRules = (rows: any[]): SegmentRule[] =>
  rows.map((r) => ({
    segment: r.segment,
    min_pen: r.min_pen,
    max_pen: r.max_pen,
    objective: r.objective,
    spend_cap_pct: r.spend_cap_pct,
  }));

// Learned k per activity x crop x segment from done call-backs (5.8).
export async function learnedRates(cropId: number, segment: string, cfg: AppConfig, k: Knex = db) {
  const rows = await k('callback as cb')
    .join('activity_event as e', 'e.id', 'cb.activity_event_id')
    .join('campaign_plan as p', 'p.id', 'e.plan_id')
    .join('market_data as md', function () {
      this.on('md.mu_id', 'p.mu_id').andOn('md.crop_id', 'p.crop_id').andOn('md.season_id', 'p.season_id');
    })
    .where('cb.status', 'done')
    .where('p.crop_id', cropId)
    .select('e.activity_type_id', 'cb.will_buy', 'md.amp_pct', 'md.current_treated_pct');
  const rules = toSegmentRules(await k('segment_rule').where({ active: true }));
  const m = new Map<number, { calls: number; positives: number }>();
  for (const r of rows) {
    const seg = assignSegment(penetration(r.current_treated_pct, r.amp_pct), rules).segment;
    if (seg !== segment) continue;
    const cur = m.get(r.activity_type_id) ?? { calls: 0, positives: 0 };
    cur.calls += 1;
    if (r.will_buy) cur.positives += 1;
    m.set(r.activity_type_id, cur);
  }
  return m;
}

export async function activityParams(
  a: any,
  rates: Map<number, { calls: number; positives: number }>,
  cfg: AppConfig,
  override?: Partial<ShareInput>,
): Promise<ActivityParams> {
  const stat = rates.get(a.id);
  const { learnedK } = await import('../engine');
  const lk = stat ? learnedK(a.k_default, stat.calls, stat.positives, cfg.prior_strength) : null;
  return {
    activity_type_id: a.id,
    name: a.display_name ?? a.name,
    kind: a.kind,
    r: override?.r ?? a.r_default,
    k: override?.k ?? lk?.k ?? a.k_default,
    c: override?.c ?? a.unit_cost,
    phase_split_pre: a.phase_split_pre,
    phase_split_on: a.phase_split_on,
    phase_split_post: a.phase_split_post,
    bucket: a.bucket,
    r_source: 'default',
    k_source: override?.k !== undefined ? 'default' : lk?.source ?? 'default',
    k_sample_size: lk?.sample_size ?? 0,
  };
}

export async function buildPlanInput(req: CalcRequest, k: Knex = db) {
  const cfg = await getConfig(k);
  const mu = await k('mu').join('geo_unit as g', 'g.id', 'mu.geo_unit_id').where('mu.id', req.mu_id).select('mu.*', 'g.name as mu_name', 'g.lat', 'g.lng', 'g.parent_id').first();
  if (!mu) throw notFound('Marketing unit not found');
  const crop = await k('crop').where({ id: req.crop_id }).first();
  if (!crop) throw notFound('Crop not found');
  const product = await k('product').where({ id: req.product_id }).first();
  if (!product) throw notFound('Product not found');
  const season = await k('season').where({ id: req.season_id }).first();
  if (!season) throw notFound('Season not found');
  const market = await k('market_data').where({ mu_id: req.mu_id, crop_id: req.crop_id, season_id: req.season_id }).first();
  if (!market) throw badRequest('No market data for this MU, crop and season. Import market data first.');

  const doseRows = await k('crop_product_dose').where({ crop_id: req.crop_id, product_id: req.product_id });
  const dose = doseRows.reduce((a, d) => a + d.dose_packs_per_acre, 0);
  if (!(dose > 0)) throw badRequest('No dose is set for this crop and product');

  const rules = toSegmentRules(await k('segment_rule').where({ active: true }).orderBy('min_pen'));
  const pen = penetration(market.current_treated_pct, market.amp_pct);
  const autoSegment = assignSegment(pen, rules).segment;
  const segment = req.segment_override ?? autoSegment;
  const rates = await learnedRates(req.crop_id, segment, cfg, k);

  let shares = req.shares;
  if (!shares || !shares.length) {
    const campaignType = req.campaign_type ?? 'standard';
    let pb = await k('playbook').where({ segment, campaign_type: campaignType });
    if (!pb.length) pb = await k('playbook').where({ segment, campaign_type: 'standard' });
    shares = pb.map((p) => ({ activity_type_id: p.activity_type_id, share_pct: p.share_pct }));
  }
  const acts = await k('activity_type').whereIn('id', shares.map((s) => s.activity_type_id));
  const lines: MixLine[] = [];
  for (const s of shares) {
    const a = acts.find((x) => x.id === s.activity_type_id);
    if (!a) throw badRequest(`Unknown activity type ${s.activity_type_id}`);
    lines.push({
      activity: await activityParams(a, rates, cfg, s),
      share_pct: s.share_pct,
      n_override: s.n_override ?? null,
    });
  }

  const innovative = await k('farmer as f')
    .join('village as v', 'v.id', 'f.village_id')
    .where('v.mu_id', req.mu_id)
    .where('f.type', 'innovative')
    .count({ c: '*' })
    .first();
  const innovativeCount = Number(innovative?.c ?? 0);

  const engineCfg: Partial<EngineConfig> = {
    max_activities_per_mdo_week: cfg.max_activities_per_mdo_week,
    active_weeks: cfg.active_weeks,
    mdo_count: mu.mdo_count,
    retention_focus: cfg.retention_focus,
    amber_factor: cfg.amber_factor,
    innovative_farmers_mapped: innovativeCount > 0 ? innovativeCount : null,
    villages_count: mu.villages_count,
    demo_farmers_per_village: cfg.demo_farmers_per_village,
    contingency_pct: req.contingency_pct ?? 0,
  };

  const input: PlanInput = {
    crop_area: market.crop_area_acres,
    amp_pct: market.amp_pct,
    current_treated_pct: market.current_treated_pct,
    target_treated_pct: req.target_treated_pct,
    dose_packs_per_acre: dose,
    pack_kg: product.pack_kg,
    price_per_pack: product.price_per_pack,
    avg_area_per_farmer: market.avg_area_per_farmer,
    segment_rules: rules,
    segment_override: req.segment_override ?? null,
    lines,
    config: engineCfg,
  };

  const today = todayISO(cfg);
  const ageDays = diffDays(today, market.as_of_date);
  return {
    input,
    cfg,
    mu,
    crop,
    product,
    season,
    market: {
      ...market,
      age_days: ageDays,
      stale: ageDays > cfg.stale_data_days,
    },
    dose,
    auto_segment: autoSegment,
  };
}

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

export function planSteps(r: PlanResult, i: PlanInput) {
  return [
    {
      step: 1,
      name: 'Segment',
      formula: 'penetration = current treated % / AMP %',
      values: {
        current_treated_pct: i.current_treated_pct,
        amp_pct: i.amp_pct,
        penetration: r.penetration,
        segment: r.segment,
        objective: r.objective,
        spend_cap_pct: r.spend_cap_pct,
      },
      summary: `${pct(i.current_treated_pct)} / ${pct(i.amp_pct)} = ${pct(r.penetration)} of potential -> ${r.segment} (${r.objective})`,
    },
    {
      step: 2,
      name: 'Goal (Y)',
      formula: 'ΔA = crop area × (target % − current %);  Y = target area × dose',
      values: {
        current_area: r.current_area,
        target_area: r.target_area,
        incremental_area: r.incremental_area,
        y_packs: r.y_packs,
        y_tons: r.y_tons,
        incremental_packs: r.incremental_packs,
        incremental_value: r.incremental_value,
        total_value: r.total_value,
      },
      summary: `ΔA ${formatIndian(r.incremental_area, 0)} ac, Y ${formatIndian(r.y_packs, 0)} packs (${r.y_tons.toFixed(1)} t), incremental value ${formatINR(r.incremental_value)}`,
    },
    {
      step: 3,
      name: 'Farmers to convert',
      formula: r.mode === 'growth' ? 'F = ΔA / average area per farmer' : 'F = current area / average area per farmer × retention focus',
      values: { farmers_to_convert: r.farmers_to_convert, avg_area_per_farmer: i.avg_area_per_farmer },
      summary: `F = ${r.farmers_to_convert.toFixed(2)} farmers`,
    },
    {
      step: 4,
      name: 'Activity mix',
      formula: 'F_i = F × share_i',
      values: { shares: r.lines.map((l) => ({ activity: l.name, share_pct: l.share_pct, farmers: l.farmers_i })) },
      summary: r.lines.map((l) => `${l.name} ${pct(l.share_pct, 0)}`).join(', '),
    },
    {
      step: 5,
      name: 'How many (n)',
      formula: 'n_i = ceil(F_i / (r_i × k_i))',
      values: { lines: r.lines.map((l) => ({ activity: l.name, r: l.r, k: l.k, converts_per_unit: l.converts_per_unit, n: l.n })) },
      summary: `Σ n = ${r.total_units}`,
    },
    {
      step: 6,
      name: 'Budget and phasing',
      formula: 'budget_i = n_i × c_i;  B = Σ budget_i;  split pre / on / post',
      values: { budget: r.budget, contingency: r.contingency, budget_total: r.budget_total, pre: r.budget_pre, on: r.budget_on, post: r.budget_post },
      summary: `B = ${formatINR(r.budget_total)} (pre ${formatINR(r.budget_pre)}, on ${formatINR(r.budget_on)}, post ${formatINR(r.budget_post)})`,
    },
    {
      step: 7,
      name: 'Checks',
      formula: 'spend ratio, capacity, demo farmers, shares, target vs AMP, planned converts',
      values: { checks: r.checks },
      summary: r.can_submit ? 'No red checks: plan can be submitted' : 'Red checks: fix before submitting',
    },
  ];
}

export function planDisplay(r: PlanResult) {
  return {
    budget: formatINR(r.budget_total),
    budget_short: formatLakhCr(r.budget_total),
    incremental_value: formatINR(r.incremental_value),
    incremental_value_short: formatLakhCr(r.incremental_value),
    cost_per_farmer: formatINR(r.cost_per_farmer, 2),
    cost_per_acre: formatINR(r.cost_per_acre, 2),
    cost_per_pack: formatINR(r.cost_per_pack, 2),
    spend_ratio: pct(r.spend_ratio),
    penetration: pct(r.penetration),
  };
}

export async function calculate(req: CalcRequest, k: Knex = db) {
  const ctx = await buildPlanInput(req, k);
  const result = calculatePlan(ctx.input);
  return {
    context: {
      mu: { id: ctx.mu.id, name: ctx.mu.mu_name },
      crop: { id: ctx.crop.id, name: ctx.crop.name, stage_anchor: ctx.crop.stage_anchor },
      product: { id: ctx.product.id, name: ctx.product.name, pack_kg: ctx.product.pack_kg, price_per_pack: ctx.product.price_per_pack, placeholder: !!ctx.product.placeholder },
      season: { id: ctx.season.id, name: ctx.season.name },
      market: {
        crop_area_acres: ctx.market.crop_area_acres,
        amp_pct: ctx.market.amp_pct,
        current_treated_pct: ctx.market.current_treated_pct,
        avg_area_per_farmer: ctx.market.avg_area_per_farmer,
        source: ctx.market.source,
        as_of_date: ctx.market.as_of_date,
        stale: ctx.market.stale,
      },
      dose_packs_per_acre: ctx.dose,
      target_treated_pct: req.target_treated_pct,
    },
    result,
    display: planDisplay(result),
    steps: planSteps(result, ctx.input),
  };
}

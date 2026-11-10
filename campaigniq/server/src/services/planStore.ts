import type { Knex } from 'knex';
import { db } from '../db/knex';
import {
  applyReplan,
  calculatePlan,
  generateCalendar,
  stockNeeds,
  type PlanResult,
} from '../engine';
import { addDays } from '../engine/dates';
import { badRequest, conflict, forbidden, notFound } from '../http/errors';
import { APPROVER_ROLES, type AuthUser } from '../http/auth';
import { getConfig } from './config';
import { buildPlanInput, planDisplay, planSteps, type CalcRequest, type ShareInput } from './plans';

export interface PlanMeta {
  name?: string;
  code?: string;
  objective?: string;
  campaign_type?: string;
  strategy?: string;
  start_date?: string;
  end_date?: string;
  template_id?: number | null;
  wizard_step?: number;
  owner_user_id?: number | null;
  anchor_date: string;
  audience?: unknown;
}

export type SavePlanRequest = CalcRequest & PlanMeta & { override_reason?: string };

const j = (x: unknown) => (x === undefined ? null : JSON.stringify(x));

async function audit(
  k: Knex,
  planId: number,
  action: string,
  userId: number | null,
  reason?: string | null,
  before?: unknown,
  after?: unknown,
) {
  await k('plan_audit').insert({
    plan_id: planId,
    action,
    user_id: userId,
    reason: reason ?? null,
    before_json: j(before),
    after_json: j(after),
  });
}

async function persistLinesAndChecks(k: Knex, planId: number, result: PlanResult, shares: ShareInput[]) {
  await k('plan_line').where({ plan_id: planId }).delete();
  await k('plan_check').where({ plan_id: planId }).delete();
  for (const l of result.lines) {
    const s = shares.find((x) => x.activity_type_id === l.activity_type_id);
    await k('plan_line').insert({
      plan_id: planId,
      activity_type_id: l.activity_type_id,
      share_pct: l.share_pct,
      r: l.r,
      k: l.k,
      c: l.c,
      n: l.n,
      n_override: s?.n_override ?? null,
      budget: l.budget,
      budget_pre: l.budget_pre,
      budget_on: l.budget_on,
      budget_post: l.budget_post,
      r_source: l.r_source,
      k_source: l.k_source,
      k_sample_size: l.k_sample_size,
    });
  }
  for (const c of result.checks) {
    await k('plan_check').insert({
      plan_id: planId,
      check_name: c.check_name,
      value: c.value,
      limit_value: c.limit,
      status: c.status,
      message: c.message,
    });
  }
}

export async function createPlan(req: SavePlanRequest, user: AuthUser, k: Knex = db) {
  const ctx = await buildPlanInput(req, k);
  if (req.segment_override && req.segment_override !== ctx.auto_segment && !req.override_reason) {
    throw badRequest('A reason is required when overriding the segment');
  }
  const result = calculatePlan(ctx.input);
  const shares: ShareInput[] =
    req.shares ?? result.lines.map((l) => ({ activity_type_id: l.activity_type_id, share_pct: l.share_pct }));
  return k.transaction(async (trx) => {
    const [row] = await trx('campaign_plan')
      .insert({
        mu_id: req.mu_id,
        crop_id: req.crop_id,
        season_id: req.season_id,
        product_id: req.product_id,
        target_treated_pct: req.target_treated_pct,
        anchor_date: req.anchor_date,
        status: 'draft',
        version: 1,
        created_by: user.id,
        owner_user_id: req.owner_user_id ?? user.id,
        segment_override: req.segment_override ?? null,
        override_reason: req.override_reason ?? null,
        name: req.name ?? `${ctx.product.name} ${ctx.crop.name} - ${ctx.mu.mu_name}`,
        code: req.code ?? null,
        objective: req.objective ?? ctx.input.segment_rules.find((s) => s.segment === result.segment)?.objective,
        campaign_type: req.campaign_type ?? 'Adoption',
        strategy: req.strategy ?? null,
        start_date: req.start_date ?? null,
        end_date: req.end_date ?? null,
        template_id: req.template_id ?? null,
        wizard_step: req.wizard_step ?? 1,
        contingency_pct: req.contingency_pct ?? 0,
        audience_json: j(req.audience),
        stage: 'planned',
      })
      .returning('id');
    const id = typeof row === 'object' ? row.id : row;
    await persistLinesAndChecks(trx, id, result, shares);
    await audit(trx, id, 'create', user.id, null, null, { target_treated_pct: req.target_treated_pct });
    if (req.segment_override && req.segment_override !== ctx.auto_segment) {
      await audit(trx, id, 'segment_override', user.id, req.override_reason, { segment: ctx.auto_segment }, { segment: req.segment_override });
    }
    return id as number;
  });
}

export async function updatePlan(id: number, patch: Partial<SavePlanRequest>, user: AuthUser, k: Knex = db) {
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  if (['locked', 'live', 'closed'].includes(plan.status)) {
    throw conflict('This plan is locked. Use "revise" to create a new version.');
  }
  const lines = await k('plan_line').where({ plan_id: id });
  const merged: SavePlanRequest = {
    mu_id: plan.mu_id,
    crop_id: plan.crop_id,
    season_id: plan.season_id,
    product_id: patch.product_id ?? plan.product_id,
    target_treated_pct: patch.target_treated_pct ?? plan.target_treated_pct,
    anchor_date: patch.anchor_date ?? plan.anchor_date,
    segment_override: patch.segment_override !== undefined ? patch.segment_override : plan.segment_override,
    override_reason: patch.override_reason ?? plan.override_reason ?? undefined,
    contingency_pct: patch.contingency_pct ?? plan.contingency_pct,
    shares:
      patch.shares ??
      lines.map((l) => ({
        activity_type_id: l.activity_type_id,
        share_pct: l.share_pct,
        n_override: l.n_override,
        r: l.r,
        k: l.k,
        c: l.c,
      })),
  };
  const ctx = await buildPlanInput(merged, k);
  if (merged.segment_override && merged.segment_override !== ctx.auto_segment && !merged.override_reason) {
    throw badRequest('A reason is required when overriding the segment');
  }
  const result = calculatePlan(ctx.input);
  await k.transaction(async (trx) => {
    await trx('campaign_plan').where({ id }).update({
      product_id: merged.product_id,
      target_treated_pct: merged.target_treated_pct,
      anchor_date: merged.anchor_date,
      segment_override: merged.segment_override ?? null,
      override_reason: merged.override_reason ?? null,
      contingency_pct: merged.contingency_pct ?? 0,
      name: patch.name ?? plan.name,
      objective: patch.objective ?? plan.objective,
      campaign_type: patch.campaign_type ?? plan.campaign_type,
      strategy: patch.strategy ?? plan.strategy,
      start_date: patch.start_date ?? plan.start_date,
      end_date: patch.end_date ?? plan.end_date,
      wizard_step: patch.wizard_step ?? plan.wizard_step,
      template_id: patch.template_id !== undefined ? patch.template_id : plan.template_id,
      audience_json: patch.audience !== undefined ? j(patch.audience) : plan.audience_json,
      updated_at: new Date().toISOString(),
    });
    await persistLinesAndChecks(trx, id, result, merged.shares!);
    const before = { target_treated_pct: plan.target_treated_pct, budget: lines.reduce((a, l) => a + l.budget, 0) };
    await audit(trx, id, 'update', user.id, null, before, { target_treated_pct: merged.target_treated_pct, budget: result.budget_total });
    if (merged.segment_override && merged.segment_override !== plan.segment_override) {
      await audit(trx, id, 'segment_override', user.id, merged.override_reason, { segment: ctx.auto_segment }, { segment: merged.segment_override });
    }
  });
  return getPlan(id, k);
}

export async function getPlan(id: number, k: Knex = db) {
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  const lines = await k('plan_line').where({ plan_id: id });
  const req: CalcRequest = {
    mu_id: plan.mu_id,
    crop_id: plan.crop_id,
    season_id: plan.season_id,
    product_id: plan.product_id,
    target_treated_pct: plan.target_treated_pct,
    segment_override: plan.segment_override,
    contingency_pct: plan.contingency_pct,
    shares: lines.map((l) => ({
      activity_type_id: l.activity_type_id,
      share_pct: l.share_pct,
      n_override: l.n_override,
      r: l.r,
      k: l.k,
      c: l.c,
    })),
  };
  const ctx = await buildPlanInput(req, k);
  const result = calculatePlan(ctx.input);
  const audits = await k('plan_audit as a').leftJoin('user as u', 'u.id', 'a.user_id').where('a.plan_id', id).orderBy('a.at', 'desc').orderBy('a.id', 'desc').select('a.*', 'u.name as user_name');
  return {
    plan: { ...plan, audience: plan.audience_json ? JSON.parse(plan.audience_json) : null, audience_json: undefined },
    mu: { id: ctx.mu.id, name: ctx.mu.mu_name },
    crop: { id: ctx.crop.id, name: ctx.crop.name },
    product: { id: ctx.product.id, name: ctx.product.name },
    market: {
      crop_area_acres: ctx.market.crop_area_acres,
      amp_pct: ctx.market.amp_pct,
      current_treated_pct: ctx.market.current_treated_pct,
      source: ctx.market.source,
      as_of_date: ctx.market.as_of_date,
      stale: ctx.market.stale,
    },
    result,
    display: planDisplay(result),
    steps: planSteps(result, ctx.input),
    audit: audits,
  };
}

// ---------- workflow ----------

const FLOW: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'],
  approved: ['locked'],
  locked: ['live'],
  live: ['closed'],
  closed: [],
};

async function transition(id: number, to: string, user: AuthUser, reason: string | undefined, k: Knex) {
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  if (!FLOW[plan.status]?.includes(to)) {
    throw conflict(`A ${plan.status} plan cannot move to ${to}`);
  }
  await k('campaign_plan').where({ id }).update({ status: to, updated_at: new Date().toISOString() });
  await audit(k, id, to, user.id, reason, { status: plan.status }, { status: to });
  return { ...plan, status: to };
}

export async function submitPlan(id: number, user: AuthUser, k: Knex = db) {
  const full = await getPlan(id, k);
  if (full.plan.status !== 'draft') throw conflict(`A ${full.plan.status} plan cannot be submitted`);
  if (!full.result.can_submit) {
    throw conflict('Fix the red checks before submitting', { checks: full.result.checks.filter((c) => c.status === 'red') });
  }
  await transition(id, 'submitted', user, undefined, k);
  return getPlan(id, k);
}

export async function approvePlan(id: number, user: AuthUser, comment: string | undefined, k: Knex = db) {
  if (!APPROVER_ROLES.includes(user.role)) throw forbidden('Only a region manager or above can approve a plan');
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  if (plan.status !== 'submitted') throw conflict(`A ${plan.status} plan cannot be approved`);

  const rows = await k('plan_approval').where({ plan_id: id }).orderBy('sort_order');
  if (rows.length) {
    const mine = rows.find((r) => r.can_approve && r.status !== 'approved' && (r.user_id === user.id || r.role === user.role));
    const target = mine ?? (['admin', 'head_office'].includes(user.role) ? rows.find((r) => r.can_approve && r.status !== 'approved') : undefined);
    if (!target) throw forbidden('You are not an approver for this plan');
    await k('plan_approval').where({ id: target.id }).update({
      status: 'approved',
      status_label: 'Approved',
      decided_at: new Date().toISOString(),
      comment: comment ?? null,
      user_id: user.id,
    });
    await audit(k, id, 'approval_step', user.id, comment, null, { role: target.role_label });
    const remaining = await k('plan_approval').where({ plan_id: id, can_approve: true }).whereNot({ status: 'approved' });
    if (remaining.length) return getPlan(id, k);
  }
  await transition(id, 'approved', user, comment, k);
  return getPlan(id, k);
}

export async function rejectPlan(id: number, user: AuthUser, reason: string, k: Knex = db) {
  if (!APPROVER_ROLES.includes(user.role)) throw forbidden('Only a region manager or above can reject a plan');
  if (!reason) throw badRequest('A reason is required');
  await transition(id, 'draft', user, reason, k);
  await audit(k, id, 'reject', user.id, reason);
  return getPlan(id, k);
}

export async function lockPlan(id: number, user: AuthUser, k: Knex = db) {
  if (!APPROVER_ROLES.includes(user.role)) throw forbidden('Only a region manager or above can lock a plan');
  await transition(id, 'locked', user, undefined, k);
  return getPlan(id, k);
}

export async function goLive(id: number, user: AuthUser, k: Knex = db) {
  const events = await k('activity_event').where({ plan_id: id }).count({ c: '*' }).first();
  if (Number(events?.c ?? 0) === 0) throw conflict('Generate the calendar before going live');
  await transition(id, 'live', user, undefined, k);
  return getPlan(id, k);
}

export async function closePlan(id: number, user: AuthUser, k: Knex = db) {
  await transition(id, 'closed', user, undefined, k);
  return getPlan(id, k);
}

// A locked plan changes only through a revision: a new draft version linked to the old one.
export async function revisePlan(id: number, user: AuthUser, reason: string, k: Knex = db) {
  if (!reason) throw badRequest('A reason is required to revise a locked plan');
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  if (!['locked', 'live', 'approved'].includes(plan.status)) {
    throw conflict('Only approved, locked or live plans need a revision. Edit drafts directly.');
  }
  const lines = await k('plan_line').where({ plan_id: id });
  const newId = await k.transaction(async (trx) => {
    const { id: _old, created_at: _c, updated_at: _u, ...copy } = plan;
    const [row] = await trx('campaign_plan')
      .insert({ ...copy, status: 'draft', version: plan.version + 1, parent_plan_id: id, created_by: user.id })
      .returning('id');
    const nid = typeof row === 'object' ? row.id : row;
    for (const l of lines) {
      const { id: _lid, plan_id: _p, ...rest } = l;
      await trx('plan_line').insert({ ...rest, plan_id: nid });
    }
    const checks = await trx('plan_check').where({ plan_id: id });
    for (const c of checks) {
      const { id: _cid, plan_id: _pp, ...rest } = c;
      await trx('plan_check').insert({ ...rest, plan_id: nid });
    }
    await audit(trx, nid, 'revise', user.id, reason, { from_plan: id, version: plan.version }, { version: plan.version + 1 });
    await audit(trx, id, 'revised', user.id, reason, null, { new_plan: nid });
    return nid as number;
  });
  return getPlan(newId, k);
}

// ---------- calendar, stock, replan ----------

async function stagesFor(cropId: number, productId: number | null, k: Knex) {
  const stages = await k('crop_stage').where({ crop_id: cropId }).orderBy('start_day');
  const doses = productId ? await k('crop_product_dose').where({ crop_id: cropId, product_id: productId }) : [];
  return stages.map((s) => ({
    stage_name: s.stage_name,
    start_day: s.start_day,
    end_day: s.end_day,
    dose_packs_per_acre: doses.find((d) => d.stage_id === s.id)?.dose_packs_per_acre ?? 0,
  }));
}

export async function generatePlanCalendar(id: number, user: AuthUser, regenerate: boolean, k: Knex = db) {
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  if (!['approved', 'locked', 'live'].includes(plan.status)) {
    throw conflict('The calendar is generated after the plan is approved');
  }
  const existing = await k('activity_event').where({ plan_id: id });
  if (existing.length && !regenerate) throw conflict('This plan already has a calendar. Use regenerate to rebuild the unreported events.');
  const cfg = await getConfig(k);
  const mu = await k('mu').where({ id: plan.mu_id }).first();
  const lines = await k('plan_line').where({ plan_id: id });
  const stages = await stagesFor(plan.crop_id, plan.product_id, k);
  const acts = await k('activity_type').whereIn('id', lines.map((l) => l.activity_type_id));

  const doneByActivity = new Map<number, number>();
  if (existing.length) {
    for (const e of existing) if (e.status === 'done') doneByActivity.set(e.activity_type_id, (doneByActivity.get(e.activity_type_id) ?? 0) + 1);
    await k('activity_event').where({ plan_id: id }).whereNot({ status: 'done' }).delete();
  }

  const drafts = generateCalendar(
    plan.anchor_date,
    stages,
    lines.map((l) => ({
      activity_type_id: l.activity_type_id,
      n: Math.max(l.n - (doneByActivity.get(l.activity_type_id) ?? 0), 0),
      phase_split_pre: acts.find((a) => a.id === l.activity_type_id)!.phase_split_pre,
      phase_split_on: acts.find((a) => a.id === l.activity_type_id)!.phase_split_on,
      phase_split_post: acts.find((a) => a.id === l.activity_type_id)!.phase_split_post,
    })),
    { pre_window_days: cfg.pre_window_days, skip_sundays: cfg.skip_sundays, dealer_lead_time_days: cfg.dealer_lead_time_days },
  );
  const rows = drafts.map((d) => ({
    plan_id: id,
    activity_type_id: d.activity_type_id,
    title: acts.find((a) => a.id === d.activity_type_id)!.display_name ?? acts.find((a) => a.id === d.activity_type_id)!.name,
    phase: d.phase,
    scheduled_date: d.scheduled_date,
    mdo_user_id: mu?.mdo_user_id ?? null,
    status: mu?.mdo_user_id ? 'assigned' : 'planned',
  }));
  for (let i = 0; i < rows.length; i += 100) await k('activity_event').insert(rows.slice(i, i + 100));
  await audit(k, id, 'generate_calendar', user.id, null, null, { events: rows.length });
  return { created: rows.length, kept_done: [...doneByActivity.values()].reduce((a, b) => a + b, 0) };
}

export async function planStockNeeds(id: number, k: Knex = db) {
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  const cfg = await getConfig(k);
  const full = await getPlan(id, k);
  const stages = await stagesFor(plan.crop_id, plan.product_id, k);
  const need = stockNeeds(plan.anchor_date, stages, full.result.target_area, { dealer_lead_time_days: cfg.dealer_lead_time_days });
  return { ...need, target_area: full.result.target_area, dealer_lead_time_days: cfg.dealer_lead_time_days };
}

export async function replanPlan(id: number, shiftDays: number, reason: string, user: AuthUser, k: Knex = db) {
  if (!reason) throw badRequest('A reason is required');
  if (!Number.isInteger(shiftDays) || shiftDays === 0) throw badRequest('shift_days must be a non-zero whole number');
  const plan = await k('campaign_plan').where({ id }).first();
  if (!plan) throw notFound('Plan not found');
  const events = await k('activity_event').where({ plan_id: id });
  const stock = await planStockNeeds(id, k);
  const res = applyReplan(plan.anchor_date, stock.stock_needed_by, events.map((e) => ({ id: e.id, scheduled_date: e.scheduled_date, status: e.status })), shiftDays);
  await k.transaction(async (trx) => {
    await trx('campaign_plan').where({ id }).update({ anchor_date: res.anchor_date, updated_at: new Date().toISOString() });
    for (const e of res.events) {
      if (res.moved_event_ids.includes(e.id)) await trx('activity_event').where({ id: e.id }).update({ scheduled_date: e.scheduled_date, status: e.status });
    }
    await audit(trx, id, 'replan', user.id, reason, { anchor_date: plan.anchor_date, stock_needed_by: stock.stock_needed_by }, {
      anchor_date: res.anchor_date,
      stock_needed_by: res.stock_needed_by,
      shift_days: shiftDays,
      moved: res.moved_event_ids.length,
      untouched: res.untouched_event_ids.length,
    });
  });
  return {
    anchor_date: res.anchor_date,
    previous_anchor_date: plan.anchor_date,
    stock_needed_by: res.stock_needed_by,
    moved: res.moved_event_ids.length,
    untouched: res.untouched_event_ids.length,
    new_anchor_check: addDays(plan.anchor_date, shiftDays),
  };
}

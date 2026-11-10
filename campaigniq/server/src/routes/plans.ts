import type { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/knex';
import { calculatePlan, suggestCheaperMix, formatINR } from '../engine';
import { h, notFound, forbidden } from '../http/errors';
import { canSeeMu, visibleMuIds } from '../http/scope';
import { buildPlanInput, calculate } from '../services/plans';
import {
  approvePlan, closePlan, createPlan, generatePlanCalendar, getPlan, goLive, lockPlan,
  planStockNeeds, rejectPlan, replanPlan, revisePlan, submitPlan, updatePlan,
} from '../services/planStore';

export const path = '/plans';

const share = z.object({
  activity_type_id: z.number().int(),
  share_pct: z.number().min(0).max(1),
  n_override: z.number().int().min(0).nullable().optional(),
  r: z.number().positive().optional(),
  k: z.number().positive().optional(),
  c: z.number().nonnegative().optional(),
});

const calcSchema = z.object({
  mu_id: z.number().int(),
  crop_id: z.number().int(),
  season_id: z.number().int(),
  product_id: z.number().int(),
  target_treated_pct: z.number().min(0).max(1),
  shares: z.array(share).optional(),
  segment_override: z.string().nullable().optional(),
  contingency_pct: z.number().min(0).max(0.5).optional(),
  campaign_type: z.string().optional(),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const saveSchema = calcSchema.extend({
  anchor_date: date,
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  objective: z.string().optional(),
  strategy: z.string().optional(),
  start_date: date.optional(),
  end_date: date.optional(),
  template_id: z.number().int().nullable().optional(),
  wizard_step: z.number().int().min(1).max(6).optional(),
  owner_user_id: z.number().int().nullable().optional(),
  audience: z.unknown().optional(),
  override_reason: z.string().optional(),
});

async function assertPlanAccess(req: any, planId: number) {
  const p = await db('campaign_plan').where({ id: planId }).first();
  if (!p) throw notFound('Plan not found');
  if (!(await canSeeMu(req.user, p.mu_id))) throw forbidden('This plan is outside your geography');
  return p;
}

export default function (router: Router) {
  // Live planner: runs steps 1-7, saves nothing, returns every intermediate value.
  router.post(
    '/calculate',
    h(async (req, res) => {
      const body = calcSchema.parse(req.body);
      if (!(await canSeeMu(req.user!, body.mu_id))) throw forbidden('This MU is outside your geography');
      res.json(await calculate(body));
    }),
  );

  router.get(
    '/',
    h(async (req, res) => {
      const q = z
        .object({
          season: z.coerce.number().optional(),
          crop: z.coerce.number().optional(),
          mu: z.coerce.number().optional(),
          status: z.string().optional(),
          page: z.coerce.number().int().min(1).default(1),
          page_size: z.coerce.number().int().min(1).max(100).default(25),
        })
        .parse(req.query);
      const visible = await visibleMuIds(req.user!);
      const base = db('campaign_plan as p')
        .join('mu', 'mu.id', 'p.mu_id')
        .join('geo_unit as g', 'g.id', 'mu.geo_unit_id')
        .join('crop as c', 'c.id', 'p.crop_id')
        .modify((qb) => {
          if (visible) qb.whereIn('p.mu_id', visible);
          if (q.season) qb.where('p.season_id', q.season);
          if (q.crop) qb.where('p.crop_id', q.crop);
          if (q.mu) qb.where('p.mu_id', q.mu);
          if (q.status) qb.where('p.status', q.status);
        });
      const total = Number((await base.clone().count({ c: '*' }).first())?.c ?? 0);
      const rows = await base
        .clone()
        .select('p.id', 'p.name', 'p.code', 'p.status', 'p.version', 'p.target_treated_pct', 'p.anchor_date', 'g.name as mu_name', 'c.name as crop_name', 'p.updated_at')
        .orderBy('p.updated_at', 'desc')
        .limit(q.page_size)
        .offset((q.page - 1) * q.page_size);
      res.json({ total, page: q.page, page_size: q.page_size, items: rows });
    }),
  );

  router.post(
    '/',
    h(async (req, res) => {
      const body = saveSchema.parse(req.body);
      if (!(await canSeeMu(req.user!, body.mu_id))) throw forbidden('This MU is outside your geography');
      const id = await createPlan(body, req.user!);
      res.status(201).json(await getPlan(id));
    }),
  );

  router.get(
    '/:id',
    h(async (req, res) => {
      const id = Number(req.params.id);
      await assertPlanAccess(req, id);
      res.json(await getPlan(id));
    }),
  );

  router.put(
    '/:id',
    h(async (req, res) => {
      const id = Number(req.params.id);
      await assertPlanAccess(req, id);
      const body = saveSchema.partial().parse(req.body);
      res.json(await updatePlan(id, body, req.user!));
    }),
  );

  // Cheaper mix: shifts share from the highest cost-per-convert activity to the lowest.
  router.post(
    '/:id/suggest-cheaper',
    h(async (req, res) => {
      const id = Number(req.params.id);
      const p = await assertPlanAccess(req, id);
      const lines = await db('plan_line').where({ plan_id: id });
      const ctx = await buildPlanInput({
        mu_id: p.mu_id, crop_id: p.crop_id, season_id: p.season_id, product_id: p.product_id,
        target_treated_pct: p.target_treated_pct, segment_override: p.segment_override, contingency_pct: p.contingency_pct,
        shares: lines.map((l) => ({ activity_type_id: l.activity_type_id, share_pct: l.share_pct, r: l.r, k: l.k, c: l.c })),
      });
      const s = suggestCheaperMix(ctx.input);
      res.json({
        needed: s.needed,
        improved: s.improved,
        before: { budget: s.before.budget_total, spend_ratio: s.before.spend_ratio },
        after: { budget: s.after.budget_total, spend_ratio: s.after.spend_ratio, checks: s.after.checks, lines: s.after.lines },
        saving: s.before.budget_total - s.after.budget_total,
        saving_display: formatINR(s.before.budget_total - s.after.budget_total),
        suggested_shares: s.suggested_shares,
        moves: s.moves,
        message: s.needed
          ? s.improved
            ? 'Shifting share to the cheapest conversions brings the plan closer to the spend cap'
            : 'No cheaper mix found within this playbook'
          : 'The plan is already within the spend cap',
      });
    }),
  );

  const act = (name: string, fn: (id: number, req: any) => Promise<unknown>) =>
    router.post(
      `/:id/${name}`,
      h(async (req, res) => {
        const id = Number(req.params.id);
        await assertPlanAccess(req, id);
        res.json(await fn(id, req));
      }),
    );

  act('submit', (id, req) => submitPlan(id, req.user));
  act('approve', (id, req) => approvePlan(id, req.user, z.object({ comment: z.string().optional() }).parse(req.body ?? {}).comment));
  act('reject', (id, req) => rejectPlan(id, req.user, z.object({ reason: z.string().min(1) }).parse(req.body).reason));
  act('lock', (id, req) => lockPlan(id, req.user));
  act('go-live', (id, req) => goLive(id, req.user));
  act('close', (id, req) => closePlan(id, req.user));
  act('revise', (id, req) => revisePlan(id, req.user, z.object({ reason: z.string().min(1) }).parse(req.body).reason));
  act('generate-calendar', (id, req) =>
    generatePlanCalendar(id, req.user, z.object({ regenerate: z.boolean().optional() }).parse(req.body ?? {}).regenerate ?? false),
  );
  act('replan', (id, req) => {
    const b = z.object({ shift_days: z.number().int(), reason: z.string().min(1) }).parse(req.body);
    return replanPlan(id, b.shift_days, b.reason, req.user);
  });

  router.get('/:id/stock-needs', h(async (req, res) => {
    const id = Number(req.params.id);
    await assertPlanAccess(req, id);
    res.json(await planStockNeeds(id));
  }));

  // Data for the one-page printable MU brief.
  router.get('/:id/brief', h(async (req, res) => {
    const id = Number(req.params.id);
    await assertPlanAccess(req, id);
    const full = await getPlan(id);
    const events = await db('activity_event').where({ plan_id: id }).orderBy('scheduled_date');
    const stock = await planStockNeeds(id);
    res.json({
      title: full.plan.name,
      plan: full.plan,
      mu: full.mu,
      crop: full.crop,
      product: full.product,
      segment: { name: full.result.segment, objective: full.result.objective, penetration: full.result.penetration },
      goal: {
        incremental_area: full.result.incremental_area,
        y_packs: full.result.y_packs,
        farmers_to_convert: full.result.farmers_to_convert,
      },
      activities: full.result.lines,
      budget: { total: full.result.budget_total, pre: full.result.budget_pre, on: full.result.budget_on, post: full.result.budget_post },
      checks: full.result.checks,
      calendar: events.map((e) => ({ date: e.scheduled_date, activity: e.title, phase: e.phase, status: e.status })),
      stock,
      audit: full.audit,
    });
  }));

  // Verifies a plan can be re-priced (used by the e2e script and the UI "recalculate").
  router.post('/:id/recalculate', h(async (req, res) => {
    const id = Number(req.params.id);
    await assertPlanAccess(req, id);
    const full = await getPlan(id);
    res.json({ result: full.result, display: full.display });
  }));
}

import type { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/knex';
import { h, badRequest, notFound, forbidden } from '../http/errors';
import { requireRole } from '../http/auth';
import { envelopeSplit } from '../engine';
import { getConfig, setConfig } from '../services/config';
import { visibleMuIds } from '../http/scope';

export const path = '/';

const activityPatch = z.object({
  display_name: z.string().min(1).optional(),
  r_default: z.number().positive().optional(),
  k_default: z.number().positive().max(1).optional(),
  unit_cost: z.number().nonnegative().optional(),
  phase_split_pre: z.number().min(0).max(1).optional(),
  phase_split_on: z.number().min(0).max(1).optional(),
  phase_split_post: z.number().min(0).max(1).optional(),
  bucket: z.enum(['proven', 'scaling', 'pilot']).optional(),
  evidence_required: z.string().optional(),
  active: z.boolean().optional(),
});

export default function (router: Router) {
  router.get('/activities', h(async (_req, res) => {
    const rows = await db('activity_type').where({ active: true }).orderBy('id');
    // learned k: shown next to the default with sample size
    const learned = await db('callback as cb')
      .join('activity_event as e', 'e.id', 'cb.activity_event_id')
      .where('cb.status', 'done')
      .groupBy('e.activity_type_id')
      .select('e.activity_type_id', db.raw('count(*) as calls'), db.raw('sum(case when cb.will_buy then 1 else 0 end) as positives'));
    const cfg = await getConfig();
    res.json(
      rows.map((a) => {
        const l = learned.find((x) => x.activity_type_id === a.id);
        const calls = Number(l?.calls ?? 0);
        const positives = Number(l?.positives ?? 0);
        const m = cfg.prior_strength;
        return {
          ...a,
          k_learned: calls ? (a.k_default * m + positives) / (m + calls) : null,
          k_sample_size: calls,
          converts_per_unit: a.r_default * a.k_default,
          cost_per_convert: a.unit_cost / (a.r_default * a.k_default),
        };
      }),
    );
  }));

  router.put('/activities/:id', requireRole('admin', 'head_office'), h(async (req, res) => {
    const id = Number(req.params.id);
    const patch = activityPatch.parse(req.body);
    const row = await db('activity_type').where({ id }).first();
    if (!row) throw notFound('Activity not found');
    const next = { ...row, ...patch };
    const split = next.phase_split_pre + next.phase_split_on + next.phase_split_post;
    if (Math.abs(split - 1) > 1e-6) throw badRequest('Phase splits (pre + on + post) must add up to 100%');
    await db('activity_type').where({ id }).update({ ...patch, updated_at: new Date().toISOString() });
    res.json(await db('activity_type').where({ id }).first());
  }));

  router.get('/playbooks/:segment', h(async (req, res) => {
    const type = typeof req.query.campaign_type === 'string' ? req.query.campaign_type : 'standard';
    let rows = await db('playbook as p').join('activity_type as a', 'a.id', 'p.activity_type_id').where({ 'p.segment': req.params.segment, 'p.campaign_type': type }).select('p.activity_type_id', 'p.share_pct', 'a.name', 'a.display_name');
    if (!rows.length) rows = await db('playbook as p').join('activity_type as a', 'a.id', 'p.activity_type_id').where({ 'p.segment': req.params.segment, 'p.campaign_type': 'standard' }).select('p.activity_type_id', 'p.share_pct', 'a.name', 'a.display_name');
    res.json({ segment: req.params.segment, campaign_type: type, lines: rows });
  }));

  router.put('/playbooks/:segment', requireRole('admin', 'head_office', 'zone'), h(async (req, res) => {
    const body = z.object({
      campaign_type: z.string().default('standard'),
      lines: z.array(z.object({ activity_type_id: z.number().int(), share_pct: z.number().min(0).max(1) })).min(1),
    }).parse(req.body);
    const total = body.lines.reduce((a, l) => a + l.share_pct, 0);
    if (Math.abs(total - 1) > 1e-6) throw badRequest(`Shares add up to ${(total * 100).toFixed(1)}%, they must add up to 100%`);
    await db.transaction(async (trx) => {
      await trx('playbook').where({ segment: req.params.segment, campaign_type: body.campaign_type }).delete();
      await trx('playbook').insert(body.lines.map((l) => ({ segment: req.params.segment, campaign_type: body.campaign_type, ...l })));
    });
    res.json({ ok: true });
  }));

  router.get('/segment-rules', h(async (_req, res) => {
    res.json(await db('segment_rule').where({ active: true }).orderBy('min_pen'));
  }));

  // 70 / 20 / 10 envelope for a region and season: budget by activity bucket.
  router.get('/envelope', h(async (req, res) => {
    const q = z.object({ region: z.coerce.number().optional(), season: z.coerce.number().optional() }).parse(req.query);
    const cfg = await getConfig();
    const visible = await visibleMuIds(req.user!);
    const rows = await db('plan_line as l')
      .join('campaign_plan as p', 'p.id', 'l.plan_id')
      .join('activity_type as a', 'a.id', 'l.activity_type_id')
      .modify((qb) => {
        if (visible) qb.whereIn('p.mu_id', visible);
        if (q.season) qb.where('p.season_id', q.season);
        qb.whereNot('p.status', 'closed');
      })
      .select('a.bucket', 'l.budget');
    const env = envelopeSplit(rows.map((r: { bucket: 'proven' | 'scaling' | 'pilot'; budget: number }) => ({ bucket: r.bucket, budget: r.budget })), cfg.envelope_split, cfg.envelope_tolerance_pp);
    res.json({ ...env, note: 'Bucket labels are an interpretation of the planning deck and are editable per activity' });
  }));

  router.get('/config', requireRole('admin', 'head_office'), h(async (_req, res) => {
    res.json(await getConfig());
  }));

  router.put('/config/:key', requireRole('admin'), h(async (req, res) => {
    const { value } = z.object({ value: z.unknown() }).parse(req.body);
    await setConfig(req.params.key, value);
    res.json({ key: req.params.key, value });
  }));

  // Role check helper for clients that want to hide controls.
  router.get('/permissions', h(async (req, res) => {
    const role = req.user!.role;
    res.json({
      can_approve: ['region_manager', 'zone', 'head_office', 'admin'].includes(role),
      can_edit_library: ['admin', 'head_office'].includes(role),
      is_field_user: role === 'mdo',
    });
  }));
  void forbidden;
}

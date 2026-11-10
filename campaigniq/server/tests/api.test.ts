import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app';
import { db } from '../src/db/knex';
import { runSeeds } from '../src/db/seed';

let server: Server;
let base: string;

async function api(path: string, opts: { method?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(`${base}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function login(email: string) {
  const r = await api('/auth/login', { method: 'POST', body: { email, password: 'Demo@123' } });
  expect(r.status).toBe(200);
  return r.json.token as string;
}

beforeAll(async () => {
  await runSeeds(db);
  const app = await createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.close();
  await db.destroy();
});

describe('auth', () => {
  it('rejects bad credentials and unauthenticated calls', async () => {
    expect((await api('/auth/login', { method: 'POST', body: { email: 'strategy@mahadhan.demo', password: 'nope' } })).status).toBe(401);
    expect((await api('/meta/filters')).status).toBe(401);
  });
});

describe('scope bar and library', () => {
  it('returns filters for the scope bar', async () => {
    const t = await login('strategy@mahadhan.demo');
    const r = await api('/meta/filters', { token: t });
    expect(r.status).toBe(200);
    expect(r.json.crops).toHaveLength(9);
    expect(r.json.portfolios).toContain('Croptek');
    expect(r.json.geography[0].name).toBe('India');
  });

  it('lists the activity library with cost per convert', async () => {
    const t = await login('strategy@mahadhan.demo');
    const r = await api('/activities', { token: t });
    expect(r.json.length).toBeGreaterThanOrEqual(13);
    expect(r.json[0]).toHaveProperty('cost_per_convert');
  });

  it('only admin / head office can edit the library, and splits must add to 100%', async () => {
    const mdo = await login('jadhav@mahadhan.demo');
    expect((await api('/activities/1', { method: 'PUT', token: mdo, body: { unit_cost: 7000 } })).status).toBe(403);
    const head = await login('strategy@mahadhan.demo');
    expect((await api('/activities/1', { method: 'PUT', token: head, body: { phase_split_pre: 0.5 } })).status).toBe(400);
  });
});

describe('plan calculation', () => {
  it('calculate returns steps and does not save', async () => {
    const t = await login('region@mahadhan.demo');
    const filters = await api('/meta/filters', { token: t });
    const onion = filters.json.crops.find((c: any) => c.name === 'Onion');
    const product = filters.json.products.find((p: any) => p.name === 'Croptek - 50 kg');
    const dhule = await db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').where('g.name', 'Dhule').select('m.id').first();
    const before = Number((await db('campaign_plan').count({ c: '*' }).first())!.c);
    const r = await api('/plans/calculate', {
      method: 'POST', token: t,
      body: { mu_id: dhule.id, crop_id: onion.id, season_id: filters.json.seasons[0].id, product_id: product.id, target_treated_pct: 0.12 },
    });
    expect(r.status).toBe(200);
    expect(r.json.steps).toHaveLength(7);
    expect(r.json.result.segment).toBeTruthy();
    expect(r.json.context.market.source).toBe('placeholder');
    expect(Number((await db('campaign_plan').count({ c: '*' }).first())!.c)).toBe(before);
  });

  it('target above AMP is red and blocks submit', async () => {
    const t = await login('region@mahadhan.demo');
    const mu = await db('mu').first();
    const md = await db('market_data').where({ mu_id: mu.id, crop_id: (await db('crop').where({ name: 'Onion' }).first()).id }).first();
    const product = await db('product').where({ name: 'Croptek - 50 kg' }).first();
    const body = { mu_id: mu.id, crop_id: md.crop_id, season_id: md.season_id, product_id: product.id, target_treated_pct: Math.min(md.amp_pct + 0.1, 1) };
    const calc = await api('/plans/calculate', { method: 'POST', token: t, body });
    expect(calc.json.result.checks.find((c: any) => c.check_name === 'target_vs_amp').status).toBe('red');
    const saved = await api('/plans', { method: 'POST', token: t, body: { ...body, anchor_date: '2027-01-10' } });
    expect(saved.status).toBe(201);
    const sub = await api(`/plans/${saved.json.plan.id}/submit`, { method: 'POST', token: t });
    expect(sub.status).toBe(409);
  });
});

describe('plan workflow, calendar and replan', () => {
  it('draft -> submit -> approve -> calendar -> lock -> replan keeps done events', async () => {
    const region = await login('region@mahadhan.demo');
    const mdo = await login('jadhav@mahadhan.demo');
    const mu = await db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').where('g.name', 'Yeola').select('m.id').first();
    const onion = await db('crop').where({ name: 'Onion' }).first();
    const md = await db('market_data').where({ mu_id: mu.id, crop_id: onion.id }).first();
    const product = await db('product').where({ name: 'Croptek - 50 kg' }).first();
    const body = { mu_id: mu.id, crop_id: onion.id, season_id: md.season_id, product_id: product.id, target_treated_pct: Math.min(md.current_treated_pct + 0.03, md.amp_pct), anchor_date: '2027-01-10' };
    const created = await api('/plans', { method: 'POST', token: region, body });
    expect(created.status).toBe(201);
    const id = created.json.plan.id;
    expect(created.json.audit.map((a: any) => a.action)).toContain('create');

    // MDO cannot approve
    if (created.json.result.can_submit) {
      expect((await api(`/plans/${id}/submit`, { method: 'POST', token: region })).status).toBe(200);
      expect((await api(`/plans/${id}/approve`, { method: 'POST', token: mdo, body: {} })).status).toBe(403);
      expect((await api(`/plans/${id}/approve`, { method: 'POST', token: region, body: {} })).status).toBe(200);
    } else {
      await db('campaign_plan').where({ id }).update({ status: 'approved' });
    }

    const cal = await api(`/plans/${id}/generate-calendar`, { method: 'POST', token: region, body: {} });
    expect(cal.status).toBe(200);
    expect(cal.json.created).toBeGreaterThan(0);
    expect((await api(`/plans/${id}/generate-calendar`, { method: 'POST', token: region, body: {} })).status).toBe(409);

    const events = await db('activity_event').where({ plan_id: id }).orderBy('scheduled_date');
    await db('activity_event').where({ id: events[0].id }).update({ status: 'done', actual_date: events[0].scheduled_date });

    expect((await api(`/plans/${id}/lock`, { method: 'POST', token: region })).status).toBe(200);
    expect((await api(`/plans/${id}`, { method: 'PUT', token: region, body: { target_treated_pct: 0.2 } })).status).toBe(409);

    const rp = await api(`/plans/${id}/replan`, { method: 'POST', token: region, body: { shift_days: 14, reason: 'Low rainfall' } });
    expect(rp.status).toBe(200);
    expect(rp.json.moved).toBe(events.length - 1);
    expect(rp.json.untouched).toBe(1);
    const after = await db('activity_event').where({ plan_id: id }).orderBy('id');
    expect(after.find((e) => e.id === events[0].id).scheduled_date).toBe(events[0].scheduled_date);
    const trail = (await api(`/plans/${id}`, { token: region })).json.audit.map((a: any) => a.action);
    expect(trail).toContain('replan');

    const rev = await api(`/plans/${id}/revise`, { method: 'POST', token: region, body: { reason: 'Budget change' } });
    expect(rev.status).toBe(200);
    expect(rev.json.plan.version).toBe(2);
    expect(rev.json.plan.status).toBe('draft');
  });

  it('segment override needs a reason and is audited', async () => {
    const region = await login('region@mahadhan.demo');
    const mu = await db('mu').first();
    const onion = await db('crop').where({ name: 'Onion' }).first();
    const md = await db('market_data').where({ mu_id: mu.id, crop_id: onion.id }).first();
    const product = await db('product').where({ name: 'Croptek - 50 kg' }).first();
    const body = { mu_id: mu.id, crop_id: onion.id, season_id: md.season_id, product_id: product.id, target_treated_pct: md.current_treated_pct + 0.02, anchor_date: '2027-01-10', segment_override: 'Matured' };
    expect((await api('/plans', { method: 'POST', token: region, body })).status).toBe(400);
    const ok = await api('/plans', { method: 'POST', token: region, body: { ...body, override_reason: 'Dealer-led market' } });
    expect(ok.status).toBe(201);
    expect(ok.json.audit.map((a: any) => a.action)).toContain('segment_override');
  });
});

describe('row-level access', () => {
  it('an MDO sees only their own MU and plans', async () => {
    const mdo = await login('jadhav@mahadhan.demo');
    const filters = await api('/meta/filters', { token: mdo });
    const flat: string[] = [];
    const walk = (n: any) => { if (n.level === 'mu') flat.push(n.name); (n.children ?? []).forEach(walk); };
    filters.json.geography.forEach(walk);
    expect(flat).toEqual(['Ambad']);

    const ambadMu = await db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').where('g.name', 'Ambad').select('m.id').first();
    const other = await db('campaign_plan').whereNot('mu_id', ambadMu.id).select('id').first();
    expect((await api(`/plans/${other.id}`, { token: mdo })).status).toBe(403);
    const list = await api('/plans', { token: mdo });
    expect(list.json.items.every((p: any) => p.mu_name === 'Ambad')).toBe(true);
  });
});

describe('seed data sanity', () => {
  it('hero campaign is live with executed events and a duplicate-photo flag', async () => {
    const hero = await db('campaign_plan').where({ code: 'CAMP-R26-AMB-014' }).first();
    expect(hero.status).toBe('live');
    const done = await db('activity_event').where({ plan_id: hero.id, status: 'done' }).count({ c: '*' }).first();
    expect(Number(done!.c)).toBeGreaterThan(10);
    const dup = await db('audit_flag').where({ flag_type: 'duplicate_photo' }).count({ c: '*' }).first();
    expect(Number(dup!.c)).toBeGreaterThan(0);
  });

  it('hero plan reproduces the planner screen: count x unit cost = budget', async () => {
    const hero = await db('campaign_plan').where({ code: 'CAMP-R26-AMB-014' }).first();
    const full = await api(`/plans/${hero.id}`, { token: await login('region@mahadhan.demo') });
    const r = full.json.result;
    expect(r.budget).toBeCloseTo(759_800, 0); // activities only
    expect(r.budget_total).toBeGreaterThan(799_000); // + 5% contingency share = ₹8.0 L
    expect(r.budget_total).toBeLessThan(800_500);
    expect(r.lines.map((l: any) => l.n)).toEqual([12, 74, 32, 1, 8]);
  });
});

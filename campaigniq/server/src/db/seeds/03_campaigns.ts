import type { Knex } from 'knex';
import type { SeedCtx } from '../seed';
import { auditEvent, haversineKm } from '../../engine';
import { createPlan, generatePlanCalendar, getPlan, submitPlan } from '../../services/planStore';
import type { AuthUser } from '../../http/auth';

// Campaign plans, calendars and simulated field execution. PLACEHOLDER data.

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default async function seed(db: Knex, ctx: SeedCtx) {
  const rand = rng(7);
  const season = await db('season').where({ name: 'Late Rabi 2026-27' }).first();
  const crops = Object.fromEntries((await db('crop')).map((c) => [c.name, c]));
  const products = Object.fromEntries((await db('product')).map((p) => [p.name, p]));
  const users = Object.fromEntries((await db('user')).map((u) => [u.email.split('@')[0], u]));
  const muByName = async (district: string, name: string) =>
    db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').join('geo_unit as d', 'd.id', 'g.parent_id').where({ 'g.name': name, 'd.name': district }).select('m.*', 'g.name as name', 'g.lat', 'g.lng').first();
  const asUser = (u: any): AuthUser => ({ id: u.id, name: u.name, email: u.email, role: u.role, title: u.title, geo_scope_id: u.geo_scope_id });
  const admin = asUser(users.admin);

  const activity = Object.fromEntries((await db('activity_type')).map((a) => [a.kind, a]));

  // ---- Hero: Croptek Onion Conversion - Ambad (live, in execution) ----
  const ambad = await muByName('Jalna', 'Ambad');
  const heroMix = [
    { kind: 'demo', share: 0.3158, n: 12, r: 50, k: 0.28, c: 20000 },
    { kind: 'retailer_activation', share: 0.2632, n: 74, r: 24.76, k: 0.0816, c: 2700 },
    { kind: 'group_meeting', share: 0.2105, n: 32, r: 37.5, k: 0.0935, c: 5000 },
    { kind: 'digital_advisory', share: 0.1053, n: 1, r: 3000, k: 0.0187, c: 80000 },
    { kind: 'followup', share: 0.1052, n: 8, r: 125, k: 0.0468, c: 10000 },
  ];
  const heroId = await createPlan(
    {
      mu_id: ambad.id, crop_id: crops.Onion.id, season_id: season.id, product_id: products['Croptek - 50 kg'].id,
      target_treated_pct: 0.4, anchor_date: '2027-01-05', contingency_pct: 0.05,
      name: 'Croptek Onion Conversion - Ambad', code: 'CAMP-R26-AMB-014',
      objective: 'Competitive conversion and farmer adoption', campaign_type: 'Adoption',
      strategy: 'Retailer-led Croptek conversion supported by demonstrations', start_date: '2026-12-15', end_date: '2027-03-15',
      wizard_step: 6, owner_user_id: users.region.id,
      audience: { primary: 'Conventional NPK users', secondary: 'Non-users and trial users', target_farmers: 1832 },
      shares: heroMix.map((m) => ({ activity_type_id: activity[m.kind].id, share_pct: m.share, n_override: m.n, r: m.r, k: m.k, c: m.c })),
    },
    asUser(users.region),
    db,
  );
  await db('campaign_plan').where({ id: heroId }).update({ status: 'approved', stage: 'execute' });
  await db('plan_audit').insert([
    { plan_id: heroId, action: 'submitted', user_id: users.jadhav.id, reason: 'Plan submitted for approval', at: '2026-12-10 11:24:00' },
    { plan_id: heroId, action: 'approved', user_id: users.region.id, reason: 'Approved base case', at: '2026-12-14 16:32:00' },
  ]);
  // Calendar for the campaign window: pre-season starts 15 Dec (3 weeks before the anchor)
  const preCfg = await db('config').where({ key: 'pre_window_days' }).first();
  await db('config').where({ key: 'pre_window_days' }).update({ value: '21' });
  await generatePlanCalendar(heroId, admin, false, db);
  await db('config').where({ key: 'pre_window_days' }).update({ value: preCfg.value });
  await db('campaign_plan').where({ id: heroId }).update({ status: 'live' });

  // ---- Draft awaiting approval: Croptek Onion Conversion - Partur ----
  const partur = await muByName('Jalna', 'Partur');
  const draftId = await createPlan(
    {
      mu_id: partur.id, crop_id: crops.Onion.id, season_id: season.id, product_id: products['Croptek - 50 kg'].id,
      target_treated_pct: 0.3, anchor_date: '2027-01-12', contingency_pct: 0.05,
      name: 'Croptek Onion Conversion - Partur', code: 'CAMP-R26-PAR-015', objective: 'Crop-stage awareness', campaign_type: 'Adoption',
      strategy: 'Crop-stage awareness with retailer meetings', start_date: '2026-12-20', end_date: '2027-03-20', wizard_step: 6, owner_user_id: users.jadhav.id,
    },
    asUser(users.jadhav),
    db,
  );
  const dr = await getPlan(draftId, db);
  if (dr.result.can_submit) {
    await submitPlan(draftId, asUser(users.jadhav), db);
    const rows: [string, string, string, string, string, number, string][] = [
      ['Campaign Owner (Strategy Team)', 'region_manager', 'submitted', 'Submitted', '2026-12-15', 0, ''],
      ['Regional Marketing Head', 'region_manager', 'pending', 'Pending Approval', '2026-12-17', 1, 'users.region'],
      ['Supply Chain Lead', 'zone', 'pending', 'Pending Stock Confirmation', '2026-12-17', 2, 'users.supply'],
      ['Finance Controller', 'head_office', 'pending', 'Pending Budget Sign-off', '2026-12-18', 3, 'users.finance'],
      ['Compliance Officer', 'head_office', 'pending', 'Pending Content / Compliance', '2026-12-18', 4, 'users.compliance'],
      ['Business Head', 'head_office', 'pending', 'Final Approval (Pending)', '2026-12-19', 5, 'users.business'],
    ];
    for (const [role_label, role, status, status_label, due, order, who] of rows) {
      await db('plan_approval').insert({
        plan_id: draftId, role_label, role, status: order === 0 ? 'approved' : status, status_label: order === 0 ? 'Submitted' : status_label,
        due_date: due, sort_order: order, can_approve: order > 0, user_id: who ? users[who.split('.')[1]].id : null,
      });
    }
  }

  // ---- Portfolio campaigns (other crops / districts) ----
  const portfolio: [string, string, string, string, string, number, string, string][] = [
    // district, MU, crop, product, name, target, anchor, status
    ['Dhule', 'Dhule', 'Onion', 'Croptek - 50 kg', 'Croptek Onion Adoption', 0.35, '2027-01-08', 'live'],
    ['Dhule', 'Shirpur', 'Onion', 'Croptek - 50 kg', 'Croptek Onion Adoption', 0.3, '2027-01-10', 'live'],
    ['Nashik', 'Niphad', 'Grapes', 'Solutek - 25 kg', 'Solutek Grape Advisory', 0.4, '2026-12-20', 'live'],
    ['Sangli', 'Miraj', 'Sugarcane', 'Smartek - 50 kg', 'Smartek Sugarcane Push', 0.45, '2026-12-28', 'live'],
    ['Jalgaon', 'Jalgaon', 'Cotton', 'Micronutrient Mix - 10 kg', 'Cotton Micronutrient Recovery', 0.3, '2027-01-15', 'approved'],
  ];
  const planIds = [heroId];
  for (const [district, muName, cropName, productName, name, target, anchor, status] of portfolio) {
    const m = await muByName(district, muName);
    const id = await createPlan(
      {
        mu_id: m.id, crop_id: crops[cropName].id, season_id: season.id, product_id: products[productName].id,
        target_treated_pct: target, anchor_date: anchor, name, code: `CAMP-R26-${muName.slice(0, 3).toUpperCase()}-0${10 + planIds.length}`,
        campaign_type: 'Adoption', objective: 'Product adoption', start_date: '2026-12-15', end_date: '2027-03-31', wizard_step: 6, owner_user_id: users.region.id,
      },
      asUser(users.region),
      db,
    );
    await db('campaign_plan').where({ id }).update({ status: 'approved', stage: status === 'live' ? 'execute' : 'approved' });
    await generatePlanCalendar(id, admin, false, db);
    if (status === 'live') await db('campaign_plan').where({ id }).update({ status: 'live' });
    planIds.push(id);
  }

  // ---- Simulated field execution up to "today" ----
  const today = ctx.today;
  const clusters = await db('geo_unit').where({ level: 'cluster' });
  const mdoPool = [users.jadhav, users.patil, users.deshmukh, users.koli, users.shinde];
  const seenHashes = new Set<string>();
  const farmers = await db('farmer');
  const cfgRows = await db('config');
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, JSON.parse(r.value)]));
  const acts = Object.fromEntries((await db('activity_type')).map((a) => [a.id, a]));

  for (const pid of planIds) {
    const plan = await db('campaign_plan').where({ id: pid }).first();
    const mu = await db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').where('m.id', plan.mu_id).select('m.*', 'g.lat', 'g.lng').first();
    const events = await db('activity_event').where({ plan_id: pid }).orderBy('scheduled_date');
    const isHero = pid === heroId;
    for (const e of events) {
      const past = e.scheduled_date <= today;
      const a = acts[e.activity_type_id];
      const patch: Record<string, unknown> = {};
      if (isHero) {
        patch.cluster_id = clusters[Math.floor(rand() * clusters.length)].id;
        patch.mdo_user_id = mdoPool[Math.floor(rand() * mdoPool.length)].id;
      }
      if (!past) {
        // upcoming: first few in the next 10 days are assigned, others planned
        patch.status = e.scheduled_date <= '2027-02-06' ? 'assigned' : 'planned';
        await db('activity_event').where({ id: e.id }).update(patch);
        continue;
      }
      const roll = rand();
      const doneProb = isHero ? 0.6 : 0.8;
      if (roll < doneProb) {
        const attendance = Math.round(a.r_default * (0.55 + rand() * 0.6));
        const hash = `ph_${pid}_${e.id}`;
        const lat = (mu.lat ?? 19.6) + (rand() - 0.5) * 0.1;
        const lng = (mu.lng ?? 75.8) + (rand() - 0.5) * 0.1;
        const report = {
          attendance, r: a.r_default, c: a.unit_cost, actual_cost: Math.round(a.unit_cost * (0.85 + rand() * 0.3)),
          gps_lat: lat, gps_lng: lng, photo_hash: hash, actual_date: e.scheduled_date, submitted_date: e.scheduled_date,
        };
        Object.assign(patch, {
          status: 'done', actual_date: e.scheduled_date, attendance, actual_cost: report.actual_cost, gps_lat: lat, gps_lng: lng,
          photo_hash: hash, photo_url: `/uploads/${hash}.jpg`, submitted_at: e.scheduled_date,
        });
        await db('activity_event').where({ id: e.id }).update(patch);
        seenHashes.add(hash);
        for (const f of audit(report, mu)) await db('audit_flag').insert({ activity_event_id: e.id, ...f });
        // contacts
        const take = Math.min(attendance, 6);
        for (let i = 0; i < take; i++) await db('event_contact').insert({ activity_event_id: e.id, farmer_id: farmers[Math.floor(rand() * farmers.length)].id });
      } else if (roll < doneProb + 0.12) {
        await db('activity_event').where({ id: e.id }).update({ ...patch, status: 'delayed' });
      } else {
        await db('activity_event').where({ id: e.id }).update({ ...patch, status: 'missed' });
      }
    }
  }

  function audit(report: any, mu: any) {
    const flags = auditEvent(report, mu.lat ? { lat: mu.lat, lng: mu.lng } : null, false, {
      min_attendance_ratio: cfg.audit_min_attendance_ratio, max_gps_km: cfg.audit_max_gps_km,
      max_cost_ratio: cfg.audit_max_cost_ratio, max_report_delay_days: cfg.audit_max_report_delay_days,
    });
    void haversineKm;
    return flags;
  }

  // One reused photo, so the audit queue shows the duplicate-photo flag
  const doneHero = await db('activity_event').where({ plan_id: heroId, status: 'done' }).orderBy('scheduled_date');
  if (doneHero.length > 3) {
    await db('activity_event').where({ id: doneHero[3].id }).update({ photo_hash: doneHero[1].photo_hash });
    await db('audit_flag').insert({ activity_event_id: doneHero[3].id, flag_type: 'duplicate_photo', detail: 'This photo was already used on another event' });
  }

  // call-backs for ~10% of today's contacts + history, some completed so learned k has a sample
  const contacts = await db('event_contact as ec').join('activity_event as e', 'e.id', 'ec.activity_event_id').where('e.status', 'done').select('ec.farmer_id', 'ec.activity_event_id', 'e.activity_type_id', 'e.scheduled_date');
  let n = 0;
  for (const c of contacts) {
    if (rand() > cfg.callback_sample_pct * 1.6) continue;
    const completed = c.scheduled_date < '2027-01-24' && rand() < 0.85;
    await db('callback').insert({
      farmer_id: c.farmer_id, activity_event_id: c.activity_event_id, due_date: c.scheduled_date, status: completed ? 'done' : 'pending',
      called_at: completed ? c.scheduled_date : null, will_buy: completed ? rand() < 0.3 : null, bought: completed ? rand() < 0.12 : null,
      motivating_activity_type_id: completed ? c.activity_type_id : null, caller_user_id: completed ? users.callcentre.id : null,
    });
    n++;
  }
  void n;

  // monthly sales (read-only import): liquidation vs plan
  const muList = await db('campaign_plan').whereIn('id', planIds).select('mu_id', 'crop_id', 'product_id');
  for (const m of muList) {
    for (const [i, month] of ['2026-12', '2027-01'].entries()) {
      const po = Math.round(400 + rand() * 600);
      await db('sales_import').insert({ mu_id: m.mu_id, crop_id: m.crop_id, product_id: m.product_id, month, packs_liquidated: Math.round(po * (0.6 + rand() * 0.3) * (i ? 0.8 : 1)), po_packs: po });
    }
  }

  // one demo result so the demo-vs-control view has data
  const demo = await db('activity_event as e').join('activity_type as a', 'a.id', 'e.activity_type_id').where({ 'e.plan_id': heroId, 'a.kind': 'demo', 'e.status': 'done' }).select('e.id').first();
  if (demo) await db('demo_result').insert({ activity_event_id: demo.id, treated_yield: 118, control_yield: 102, unit: 'quintal/acre', price: 1450 });
}

import type { Knex } from 'knex';
import type { SeedCtx } from '../seed';
import { opportunityScore } from '../../engine';

// Market data, opportunity and farmer base. PLACEHOLDER values: replace via the market import
// (POST /api/import/market) or by connecting WeedIntel / Mahadhan data.

// deterministic pseudo-random so every seed run gives the same data
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const STATE_OPPORTUNITY: [string, number, number][] = [
  // state code, market potential (INR crore), onion area index
  ['MH', 8.7, 100], ['KA', 2.3, 62], ['GJ', 2.1, 41], ['MP', 1.6, 48], ['RJ', 1.0, 29], ['AP', 1.9, 22], ['TG', 1.0, 15], ['BR', 0.6, 12],
];
const DISTRICT_OPPORTUNITY: Record<string, [number, number, number]> = {
  // potential (Cr), penetration, potential%
  Jalna: [2.4, 0.34, 0.58], Dhule: [1.8, 0.28, 0.5], Nashik: [1.6, 0.4, 0.55], Sangli: [1.1, 0.38, 0.52], Anantapur: [1.0, 0.36, 0.5],
  Jalgaon: [1.2, 0.3, 0.5], Pune: [0.9, 0.42, 0.55], Ahmednagar: [0.8, 0.35, 0.5], Satara: [0.6, 0.33, 0.48], Solapur: [0.7, 0.3, 0.5], Aurangabad: [0.5, 0.31, 0.5],
};

export default async function seed(db: Knex, _ctx: SeedCtx) {
  const season = await db('season').where({ name: 'Late Rabi 2026-27' }).first();
  const onion = await db('crop').where({ name: 'Onion' }).first();
  const croptek = await db('product').where({ name: 'Croptek - 50 kg' }).first();
  const mus = await db('mu as m').join('geo_unit as g', 'g.id', 'm.geo_unit_id').join('geo_unit as d', 'd.id', 'g.parent_id').select('m.id as mu_id', 'm.geo_unit_id', 'g.name as mu_name', 'd.name as district');

  // penetration of potential cycles through all four segments so every segment appears
  const penCycle = [0.12, 0.2, 0.3, 0.45, 0.6, 0.72, 0.9, 0.15];
  const rand = rng(42);
  const muMarket: Record<number, { area: number; amp: number; cur: number }> = {};
  for (const [i, m] of mus.entries()) {
    const hero = m.mu_name === 'Ambad';
    const area = hero ? 24100 : Math.round((2500 + rand() * 9000) / 50) * 50;
    const amp = hero ? 0.7 : Math.round((0.28 + rand() * 0.4) * 100) / 100;
    const cur = hero ? 0.34 : Math.round(amp * penCycle[i % penCycle.length] * 1000) / 1000;
    muMarket[m.mu_id] = { area, amp, cur };
    await db('market_data').insert({
      mu_id: m.mu_id, crop_id: onion.id, season_id: season.id,
      crop_area_acres: area, amp_pct: amp, current_treated_pct: cur,
      avg_area_per_farmer: hero ? 2.72 : Math.round((1.6 + rand() * 1.4) * 100) / 100,
      competition_note: hero ? 'Conventional NPK 24:24:0 and local brands; price perception is the main barrier' : ['Low', 'Medium', 'High'][i % 3] + ' competitor pressure',
      soil_deficiency_json: JSON.stringify({ zinc: Math.round(20 + rand() * 40), boron: Math.round(10 + rand() * 30), potash: Math.round(15 + rand() * 35) }),
      rainfall_dev_pct: m.district === 'Dhule' ? -35 : Math.round(-15 + rand() * 30),
      crop_price: Math.round(1200 + rand() * 900),
      active_dealers: hero ? 74 : Math.round(20 + rand() * 60),
      source: 'placeholder',
      as_of_date: m.mu_name === 'Baglan' ? '2026-09-01' : '2026-12-20',
    });
  }

  // a few other crops so the crop filter has data
  const extra: [string, string[]][] = [['Grapes', ['Nashik']], ['Sugarcane', ['Sangli']], ['Cotton', ['Jalgaon', 'Jalna']]];
  for (const [cropName, districts] of extra) {
    const crop = await db('crop').where({ name: cropName }).first();
    for (const m of mus.filter((x) => districts.includes(x.district))) {
      const amp = Math.round((0.3 + rand() * 0.35) * 100) / 100;
      await db('market_data').insert({
        mu_id: m.mu_id, crop_id: crop.id, season_id: season.id,
        crop_area_acres: Math.round(1500 + rand() * 6000), amp_pct: amp, current_treated_pct: Math.round(amp * (0.2 + rand() * 0.6) * 1000) / 1000,
        avg_area_per_farmer: Math.round((1.5 + rand() * 2) * 100) / 100, competition_note: 'Medium competitor pressure',
        soil_deficiency_json: JSON.stringify({ zinc: 30, boron: 20 }), rainfall_dev_pct: Math.round(-10 + rand() * 20),
        crop_price: Math.round(1500 + rand() * 1500), active_dealers: Math.round(15 + rand() * 40), source: 'placeholder', as_of_date: '2026-12-20',
      });
    }
  }

  // opportunity by state / district / MU. The score is computed from its components (no unexplained scores).
  const insertOpp = async (geoId: number, potentialInr: number, peerMax: number, pen: number, potential: number, channel: number, conv: number, retailers: number, mt: number, farmers: number) => {
    const s = opportunityScore({ market_potential: potentialInr, peer_max_potential: peerMax, penetration_pct: pen, potential_pct: potential, channel_readiness: channel, conversion_feasibility: conv });
    await db('geo_opportunity').insert({
      geo_unit_id: geoId, crop_id: onion.id, season_id: season.id, product_id: croptek.id,
      market_potential_inr: potentialInr, opportunity_score: s.score, penetration_pct: pen, potential_pct: potential,
      addressable_acres: Math.round(potentialInr / 3000), active_retailers: retailers, channel_readiness: channel, conversion_feasibility: conv,
      campaign_readiness: Math.round(channel * 100), est_incremental_mt: mt, priority_farmers: farmers,
      trend_json: JSON.stringify([0.8, 0.85, 0.9, 0.95, 1].map((x) => Math.round(potentialInr * x))), source: 'placeholder', as_of_date: '2026-12-20',
    });
  };
  const states = await db('geo_unit').where({ level: 'state' });
  const maxState = Math.max(...STATE_OPPORTUNITY.map((s) => s[1])) * 1e7;
  for (const [code, cr, idx] of STATE_OPPORTUNITY) {
    const st = states.find((s) => s.code === code);
    if (st) await insertOpp(st.id, cr * 1e7, maxState, 0.3 + idx / 500, 0.6, 0.55 + idx / 400, 0.5 + idx / 300, Math.round(idx * 12), Math.round(cr * 2800), Math.round(cr * 21000));
  }
  const districts = await db('geo_unit').where({ level: 'district' });
  const maxDistrict = Math.max(...Object.values(DISTRICT_OPPORTUNITY).map((d) => d[0])) * 1e7;
  for (const d of districts) {
    const o = DISTRICT_OPPORTUNITY[d.name];
    if (o) await insertOpp(d.id, o[0] * 1e7, maxDistrict, o[1], o[2], 0.6 + rand() * 0.3, 0.6 + rand() * 0.3, Math.round(150 + o[0] * 120), Math.round(o[0] * 2800), Math.round(o[0] * 13000));
  }
  const potentialByMu = (muId: number) => muMarket[muId].area * muMarket[muId].amp * 3000;
  const maxMu = Math.max(...mus.map((m) => potentialByMu(m.mu_id)));
  for (const m of mus) {
    const hero = m.mu_name === 'Ambad';
    const mk = muMarket[m.mu_id];
    await insertOpp(m.geo_unit_id, hero ? 5_200_000 : potentialByMu(m.mu_id), hero ? 5_200_000 : maxMu, mk.cur, mk.amp, hero ? 0.79 : 0.5 + rand() * 0.4, hero ? 0.9 : 0.5 + rand() * 0.4, hero ? 74 : Math.round(30 + rand() * 50), Math.round(potentialByMu(m.mu_id) / 25000), hero ? 1832 : Math.round(300 + rand() * 1500));
  }

  // farmer base for the hero MU: innovative farmers host demos, potential customers are targets
  const villages = await db('village');
  const segments = ['conventional_npk', 'non_user', 'trial', 'partial_programme', 'repeat'];
  const heroMu = mus.find((m) => m.mu_name === 'Ambad')!;
  for (let i = 0; i < 80; i++) {
    const v = villages[i % villages.length];
    await db('farmer').insert({
      village_id: v.id, name: `Farmer ${i + 1}`, phone: `98${String(10000000 + i * 7919).slice(0, 8)}`,
      type: i % 5 === 0 ? 'innovative' : 'potential', segment: segments[i % segments.length], area_acres: Math.round((0.8 + rand() * 4) * 10) / 10,
      consent_record: true, consent_advice: i % 4 !== 0, language: 'mr',
    });
  }
  void heroMu;
}

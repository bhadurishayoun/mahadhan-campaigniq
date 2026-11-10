import type { Knex } from 'knex';
import type { SeedCtx } from '../seed';
import { CONFIG_DEFAULTS } from '../../config/defaults';
import { ACTIVITY_LIBRARY, CROPS, PLAYBOOKS, SEGMENT_RULES } from '../seedData/library';

// Reference data: hierarchy, geography, users, crops, products, season, activity library, config.
// All values are PLACEHOLDERS until Mahadhan / WeedIntel data is connected.

export const GEO = {
  states: [
    { name: 'Maharashtra', code: 'MH', lat: 19.7, lng: 75.7 },
    { name: 'Karnataka', code: 'KA', lat: 15.3, lng: 75.7 },
    { name: 'Gujarat', code: 'GJ', lat: 22.3, lng: 71.2 },
    { name: 'Madhya Pradesh', code: 'MP', lat: 23.5, lng: 78.0 },
    { name: 'Rajasthan', code: 'RJ', lat: 26.5, lng: 73.8 },
    { name: 'Andhra Pradesh', code: 'AP', lat: 15.9, lng: 79.7 },
    { name: 'Telangana', code: 'TG', lat: 17.9, lng: 79.1 },
    { name: 'Bihar', code: 'BR', lat: 25.6, lng: 85.6 },
  ],
  // district -> state code
  districts: [
    ['Jalna', 'MH', 19.84, 75.88], ['Dhule', 'MH', 20.9, 74.78], ['Nashik', 'MH', 20.0, 73.79],
    ['Jalgaon', 'MH', 21.0, 75.57], ['Sangli', 'MH', 16.85, 74.57], ['Pune', 'MH', 18.52, 73.86],
    ['Ahmednagar', 'MH', 19.09, 74.74], ['Satara', 'MH', 17.69, 74.0], ['Solapur', 'MH', 17.66, 75.91],
    ['Aurangabad', 'MH', 19.88, 75.34], ['Anantapur', 'AP', 14.68, 77.6],
  ] as [string, string, number, number][],
  // marketing units (talukas) -> district, lat, lng, villages, FOs
  mus: [
    ['Ambad', 'Jalna', 19.61, 75.79, 126, 8], ['Partur', 'Jalna', 19.6, 76.22, 98, 6], ['Badnapur', 'Jalna', 19.87, 75.72, 84, 5],
    ['Jalna', 'Jalna', 19.84, 75.88, 112, 6], ['Mantha', 'Jalna', 19.98, 76.05, 76, 4], ['Jafrabad', 'Jalna', 20.19, 75.9, 64, 4],
    ['Bhokardan', 'Jalna', 20.27, 75.77, 90, 5], ['Ghansawangi', 'Jalna', 19.57, 75.97, 72, 4],
    ['Dhule', 'Dhule', 20.9, 74.77, 110, 6], ['Shirpur', 'Dhule', 21.35, 74.88, 95, 5], ['Sakri', 'Dhule', 21.0, 74.31, 88, 5],
    ['Shindkheda', 'Dhule', 21.2, 74.75, 80, 4],
    ['Niphad', 'Nashik', 20.08, 73.96, 120, 7], ['Yeola', 'Nashik', 20.04, 74.49, 100, 6], ['Sinnar', 'Nashik', 19.85, 74.0, 105, 6],
    ['Chandwad', 'Nashik', 20.33, 74.25, 92, 5], ['Malegaon', 'Nashik', 20.55, 74.53, 85, 5], ['Baglan', 'Nashik', 20.74, 74.2, 78, 4],
    ['Jalgaon', 'Jalgaon', 21.0, 75.56, 115, 6], ['Chopda', 'Jalgaon', 21.25, 75.3, 90, 5], ['Amalner', 'Jalgaon', 21.04, 75.07, 82, 4],
    ['Miraj', 'Sangli', 16.82, 74.64, 88, 5], ['Tasgaon', 'Sangli', 17.04, 74.6, 80, 4], ['Kavathe Mahankal', 'Sangli', 17.0, 74.9, 70, 4],
  ] as [string, string, number, number, number, number][],
  ambadClusters: ['Wadi Gaon', 'Dhanora', 'Ambad HQ', 'Pimpalgaon', 'Other Villages'],
};

const onionStages = [
  ['Nursery / Transplanting', 0, 15],
  ['Vegetative Growth', 16, 46],
  ['Bulb Initiation', 47, 58],
  ['Bulb Development', 59, 79],
  ['Bulb Enlargement', 80, 97],
  ['Maturity / Harvest', 98, 110],
] as [string, number, number][];

const genericStages = (n: number): [string, number, number][] => {
  const names = ['Establishment', 'Vegetative Growth', 'Flowering / Fruit set', 'Development', 'Maturity / Harvest'];
  const len = Math.floor(n / names.length);
  return names.map((nm, i) => [nm, i * len + (i ? 1 : 0), (i + 1) * len]);
};

export default async function seed(db: Knex, ctx: SeedCtx) {
  // hierarchy (names are configurable)
  await db('hierarchy_level').insert(
    ['Marketing Unit (MU)', 'MDO / Field Officer', 'SIO Territory', 'MIE / AMM Region', 'Zone', 'Business Unit'].map((name, i) => ({ level_no: i + 1, name })),
  );

  // geography
  const [country] = await db('geo_unit').insert({ name: 'India', level: 'country', code: 'IN', lat: 22.5, lng: 79 }).returning('id');
  const countryId = typeof country === 'object' ? country.id : country;
  const stateIds: Record<string, number> = {};
  for (const s of GEO.states) {
    const [r] = await db('geo_unit').insert({ name: s.name, level: 'state', parent_id: countryId, code: s.code, lat: s.lat, lng: s.lng }).returning('id');
    stateIds[s.code] = typeof r === 'object' ? r.id : r;
  }
  const districtIds: Record<string, number> = {};
  for (const [name, st, lat, lng] of GEO.districts) {
    const [r] = await db('geo_unit').insert({ name, level: 'district', parent_id: stateIds[st], code: name.toLowerCase(), lat, lng }).returning('id');
    districtIds[name] = typeof r === 'object' ? r.id : r;
  }

  // users (password: Demo@123 for every demo login)
  const mk = async (name: string, email: string, role: string, title: string | null, scope: number | null) => {
    const [r] = await db('user').insert({ name, email, password_hash: ctx.passwordHash, role, title, geo_scope_id: scope, language: 'en' }).returning('id');
    return typeof r === 'object' ? r.id : r;
  };
  const U = {
    strategy: await mk('Sanjay Mehta', 'strategy@mahadhan.demo', 'head_office', 'Strategy Head', null),
    region: await mk('Priya Sharma', 'region@mahadhan.demo', 'region_manager', 'Regional Marketing Head - Maharashtra', stateIds.MH),
    national: await mk('Anil Deshpande', 'national@mahadhan.demo', 'head_office', 'National Campaign Head', null),
    supply: await mk('Kiran Joshi', 'supply@mahadhan.demo', 'zone', 'Supply Chain Lead', stateIds.MH),
    finance: await mk('Neha Kulkarni', 'finance@mahadhan.demo', 'head_office', 'Finance Controller', null),
    compliance: await mk('Rahul Nair', 'compliance@mahadhan.demo', 'head_office', 'Compliance Officer', null),
    business: await mk('Vikram Rao', 'business@mahadhan.demo', 'head_office', 'Business Head', null),
    callcentre: await mk('Sunita Pawar', 'callcentre@mahadhan.demo', 'call_centre', 'Call Centre Executive', null),
    admin: await mk('Admin', 'admin@mahadhan.demo', 'admin', 'Administrator', null),
  };
  const fos: Record<string, number> = {};
  for (const [name, key] of [
    ['R. Jadhav', 'jadhav'], ['S. Patil', 'patil'], ['M. Deshmukh', 'deshmukh'], ['P. Koli', 'koli'], ['V. Shinde', 'shinde'],
    ['S. Jadhav', 'sjadhav'], ['P. Kale', 'kale'], ['A. More', 'more'], ['N. Gaikwad', 'gaikwad'], ['R. Patil', 'rpatil'],
  ] as const) {
    fos[key] = await mk(name, `${key}@mahadhan.demo`, 'mdo', 'Field Officer', null);
  }

  // marketing units
  const muIds: Record<string, number> = {};
  for (const [name, district, lat, lng, villages, fo] of GEO.mus) {
    const [g] = await db('geo_unit').insert({ name, level: 'mu', parent_id: districtIds[district], code: `${district.toLowerCase()}-${name.toLowerCase()}`, lat, lng }).returning('id');
    const gid = typeof g === 'object' ? g.id : g;
    const mdo = name === 'Ambad' ? fos.jadhav : null;
    const [m] = await db('mu').insert({ geo_unit_id: gid, villages_count: villages, mdo_count: fo, mdo_user_id: mdo }).returning('id');
    muIds[`${district}/${name}`] = typeof m === 'object' ? m.id : m;
  }
  // Ambad is the CampaignIQ hero MU: clusters and villages
  const ambadGeo = await db('mu').where({ id: muIds['Jalna/Ambad'] }).first();
  const clusterIds: Record<string, number> = {};
  const clusterCoords: Record<string, [number, number]> = {
    'Wadi Gaon': [19.66, 75.74], Dhanora: [19.58, 75.84], 'Ambad HQ': [19.61, 75.79], Pimpalgaon: [19.55, 75.7], 'Other Villages': [19.7, 75.85],
  };
  for (const c of GEO.ambadClusters) {
    const [r] = await db('geo_unit').insert({ name: c, level: 'cluster', parent_id: ambadGeo.geo_unit_id, code: c.toLowerCase().replace(/\s+/g, '-'), lat: clusterCoords[c][0], lng: clusterCoords[c][1] }).returning('id');
    clusterIds[c] = typeof r === 'object' ? r.id : r;
  }
  const villageNames: [string, string][] = [
    ['Golegaon', 'Wadi Gaon'], ['Wadigaon', 'Wadi Gaon'], ['Wadi Gaon HQ', 'Wadi Gaon'], ['Dhanora', 'Dhanora'], ['Dhanora Kh.', 'Dhanora'],
    ['Ambad', 'Ambad HQ'], ['Ambad MIDC', 'Ambad HQ'], ['Pimpalgaon', 'Pimpalgaon'], ['Tandulwadi', 'Pimpalgaon'],
    ['Kasarwadi', 'Other Villages'], ['Rohilagad', 'Other Villages'], ['Shahagad', 'Other Villages'],
  ];
  for (const [i, [name, cluster]] of villageNames.entries()) {
    await db('village').insert({ mu_id: muIds['Jalna/Ambad'], cluster_id: clusterIds[cluster], name, lat: 19.5 + i * 0.012, lng: 75.7 + i * 0.01 });
  }

  // crops and stages
  const cropIds: Record<string, number> = {};
  for (const c of CROPS) {
    const [r] = await db('crop').insert(c).returning('id');
    const cid = typeof r === 'object' ? r.id : r;
    cropIds[c.name] = cid;
    const stages = c.name === 'Onion' ? onionStages : genericStages(c.name === 'Sugarcane' || c.name === 'Banana' ? 330 : c.name === 'Grapes' || c.name === 'Pomegranate' ? 150 : 120);
    for (const [i, [stage_name, start_day, end_day]] of stages.entries()) {
      await db('crop_stage').insert({ crop_id: cid, stage_name, start_day, end_day, sort_order: i });
    }
  }

  // products (placeholder prices and packs)
  const prod = async (name: string, category: string, pack_kg: number, price: number) => {
    const [r] = await db('product').insert({ name, category, pack_kg, price_per_pack: price, placeholder: true }).returning('id');
    return typeof r === 'object' ? r.id : r;
  };
  const P = {
    croptek50: await prod('Croptek - 50 kg', 'Croptek', 50, 1800),
    croptek25: await prod('Croptek - 25 kg', 'Croptek', 25, 950),
    croptek20: await prod('Croptek - 20 kg', 'Croptek', 20, 780),
    croptek10: await prod('Croptek - 10 kg', 'Croptek', 10, 400),
    smartek: await prod('Smartek - 50 kg', 'Smartek', 50, 1650),
    solutek: await prod('Solutek - 25 kg', 'Solutek', 25, 2600),
    micro: await prod('Micronutrient Mix - 10 kg', 'Micronutrients', 10, 900),
  };
  const cropProduct: Record<string, number> = {
    Onion: P.croptek50, Tomato: P.croptek50, Banana: P.croptek50, Soybean: P.croptek50, Groundnut: P.croptek50,
    Sugarcane: P.smartek, Grapes: P.solutek, Pomegranate: P.solutek, Cotton: P.micro,
  };
  const stageRows = await db('crop_stage').select('id', 'crop_id', 'sort_order');
  for (const [crop, productId] of Object.entries(cropProduct)) {
    const stages = stageRows.filter((s) => s.crop_id === cropIds[crop]).sort((a, b) => a.sort_order - b.sort_order);
    // total dose 2 packs/acre spread over the first three dosed stages (placeholder)
    const split = [0.8, 0.6, 0.6];
    for (const [i, d] of split.entries()) {
      if (stages[i + 1]) await db('crop_product_dose').insert({ crop_id: cropIds[crop], product_id: productId, stage_id: stages[i + 1].id, dose_packs_per_acre: d });
    }
    // other Croptek pack sizes share the Onion dose so SKU views work
  }
  for (const pid of [P.croptek25, P.croptek20, P.croptek10]) {
    for (const d of await db('crop_product_dose').where({ crop_id: cropIds.Onion, product_id: P.croptek50 })) {
      await db('crop_product_dose').insert({ crop_id: cropIds.Onion, product_id: pid, stage_id: d.stage_id, dose_packs_per_acre: d.dose_packs_per_acre });
    }
  }

  // seasons
  await db('season').insert([
    { name: 'Late Rabi 2026-27', start_date: '2026-12-01', end_date: '2027-04-30', budget_lock_date: '2026-12-10', active: true },
    { name: 'Kharif 2026', start_date: '2026-06-01', end_date: '2026-10-31', budget_lock_date: '2026-05-15', active: true },
  ]);

  // rules, activity library, playbooks
  await db('segment_rule').insert(SEGMENT_RULES);
  for (const a of ACTIVITY_LIBRARY) await db('activity_type').insert(a);
  for (const [segment, lines] of Object.entries(PLAYBOOKS)) {
    for (const l of lines) await db('playbook').insert({ segment, campaign_type: 'standard', ...l });
  }

  // config
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) {
    const value = key === 'today_override' ? ctx.today : def.value;
    await db('config').insert({ key, value: JSON.stringify(value), description: def.description });
  }
}

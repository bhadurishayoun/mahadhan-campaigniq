import type { Knex } from 'knex';

// Core tables from the backend brief (section 4). Percent/ratio columns are stored as fractions,
// except market_data.rainfall_dev_pct which is in percentage points (-35 = 35% below normal).

const base = (t: Knex.CreateTableBuilder, knex: Knex) => {
  t.increments('id');
  t.boolean('active').notNullable().defaultTo(true);
  t.timestamp('created_at').defaultTo(knex.fn.now());
  t.timestamp('updated_at').defaultTo(knex.fn.now());
};

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hierarchy_level', (t) => {
    base(t, knex);
    t.integer('level_no').notNullable();
    t.string('name').notNullable();
  });

  await knex.schema.createTable('geo_unit', (t) => {
    base(t, knex);
    t.string('name').notNullable();
    t.string('level').notNullable(); // country | state | district | mu | cluster | village
    t.integer('parent_id').references('id').inTable('geo_unit');
    t.string('code'); // key used to join map shapes
    t.float('lat');
    t.float('lng');
    t.index(['level', 'parent_id']);
  });

  await knex.schema.createTable('user', (t) => {
    base(t, knex);
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('role').notNullable(); // admin | head_office | zone | region_manager | mdo | call_centre
    t.string('title'); // display title, e.g. Strategy Head
    t.string('language').defaultTo('en');
    t.integer('geo_scope_id').references('id').inTable('geo_unit');
  });

  await knex.schema.createTable('mu', (t) => {
    base(t, knex);
    t.integer('geo_unit_id').notNullable().unique().references('id').inTable('geo_unit');
    t.integer('villages_count').notNullable().defaultTo(10);
    t.integer('mdo_user_id').references('id').inTable('user');
    t.integer('mdo_count').notNullable().defaultTo(1);
  });

  await knex.schema.createTable('crop', (t) => {
    base(t, knex);
    t.string('name').notNullable().unique();
    t.string('stage_anchor').notNullable();
  });

  await knex.schema.createTable('crop_stage', (t) => {
    t.increments('id');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.string('stage_name').notNullable();
    t.integer('start_day').notNullable(); // days from the stage anchor date
    t.integer('end_day').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('product', (t) => {
    base(t, knex);
    t.string('name').notNullable();
    t.string('category').notNullable();
    t.float('pack_kg').notNullable();
    t.float('price_per_pack').notNullable();
    t.boolean('placeholder').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('crop_product_dose', (t) => {
    t.increments('id');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('product_id').notNullable().references('id').inTable('product');
    t.integer('stage_id').references('id').inTable('crop_stage');
    t.float('dose_packs_per_acre').notNullable();
  });

  await knex.schema.createTable('season', (t) => {
    base(t, knex);
    t.string('name').notNullable();
    t.string('start_date').notNullable();
    t.string('end_date').notNullable();
    t.string('budget_lock_date');
  });

  await knex.schema.createTable('market_data', (t) => {
    base(t, knex);
    t.integer('mu_id').notNullable().references('id').inTable('mu');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.float('crop_area_acres').notNullable();
    t.float('amp_pct').notNullable();
    t.float('current_treated_pct').notNullable();
    t.float('avg_area_per_farmer').notNullable().defaultTo(2);
    t.string('competition_note');
    t.text('soil_deficiency_json');
    t.float('rainfall_dev_pct');
    t.float('crop_price');
    t.integer('active_dealers');
    t.string('source').notNullable().defaultTo('placeholder');
    t.string('as_of_date').notNullable();
    t.unique(['mu_id', 'crop_id', 'season_id']);
  });

  await knex.schema.createTable('segment_rule', (t) => {
    base(t, knex);
    t.string('segment').notNullable();
    t.float('min_pen').notNullable();
    t.float('max_pen').notNullable();
    t.string('objective').notNullable();
    t.float('spend_cap_pct').notNullable();
  });

  await knex.schema.createTable('activity_type', (t) => {
    base(t, knex);
    t.string('name').notNullable();
    t.string('display_name');
    t.string('kind').notNullable();
    t.float('r_default').notNullable();
    t.float('k_default').notNullable();
    t.float('unit_cost').notNullable();
    t.float('phase_split_pre').notNullable().defaultTo(0);
    t.float('phase_split_on').notNullable().defaultTo(0);
    t.float('phase_split_post').notNullable().defaultTo(0);
    t.string('evidence_required');
    t.string('bucket').notNullable().defaultTo('proven'); // proven | scaling | pilot
  });

  await knex.schema.createTable('playbook', (t) => {
    t.increments('id');
    t.string('segment').notNullable();
    t.string('campaign_type').notNullable().defaultTo('standard');
    t.integer('activity_type_id').notNullable().references('id').inTable('activity_type');
    t.float('share_pct').notNullable();
  });

  await knex.schema.createTable('campaign_plan', (t) => {
    base(t, knex);
    t.integer('mu_id').notNullable().references('id').inTable('mu');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.integer('product_id').references('id').inTable('product');
    t.float('target_treated_pct').notNullable();
    t.string('anchor_date').notNullable();
    t.string('status').notNullable().defaultTo('draft'); // draft | submitted | approved | locked | live | closed
    t.integer('version').notNullable().defaultTo(1);
    t.integer('parent_plan_id').references('id').inTable('campaign_plan');
    t.integer('created_by').references('id').inTable('user');
    t.string('segment_override');
    t.string('override_reason');
    // CampaignIQ fields
    t.string('name');
    t.string('code');
    t.string('objective');
    t.string('campaign_type').defaultTo('Adoption');
    t.string('strategy');
    t.integer('owner_user_id').references('id').inTable('user');
    t.string('start_date');
    t.string('end_date');
    t.integer('template_id');
    t.integer('wizard_step').notNullable().defaultTo(1);
    t.float('contingency_pct').notNullable().defaultTo(0);
    t.text('audience_json');
    t.string('stage'); // planned | approved | deployed | execute | review
  });

  await knex.schema.createTable('plan_line', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.integer('activity_type_id').notNullable().references('id').inTable('activity_type');
    t.float('share_pct').notNullable();
    t.float('r').notNullable();
    t.float('k').notNullable();
    t.float('c').notNullable();
    t.integer('n').notNullable();
    t.integer('n_override');
    t.float('budget').notNullable();
    t.float('budget_pre').notNullable().defaultTo(0);
    t.float('budget_on').notNullable().defaultTo(0);
    t.float('budget_post').notNullable().defaultTo(0);
    t.string('r_source').defaultTo('default');
    t.string('k_source').defaultTo('default');
    t.integer('k_sample_size');
  });

  await knex.schema.createTable('plan_check', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('check_name').notNullable();
    t.float('value');
    t.float('limit_value'); // doc column "limit" renamed: reserved word in SQL
    t.string('status').notNullable(); // green | amber | red
    t.string('message');
  });

  await knex.schema.createTable('plan_audit', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('action').notNullable();
    t.integer('user_id').references('id').inTable('user');
    t.string('reason');
    t.text('before_json');
    t.text('after_json');
    t.timestamp('at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('village', (t) => {
    base(t, knex);
    t.integer('mu_id').notNullable().references('id').inTable('mu');
    t.integer('cluster_id').references('id').inTable('geo_unit');
    t.string('name').notNullable();
    t.float('lat');
    t.float('lng');
  });

  await knex.schema.createTable('farmer', (t) => {
    base(t, knex);
    t.integer('village_id').references('id').inTable('village');
    t.string('name');
    t.string('phone');
    t.string('type').notNullable().defaultTo('potential'); // innovative | potential
    t.string('segment'); // conventional_npk | non_user | trial | partial_programme | repeat
    t.float('area_acres');
    t.boolean('consent_record').notNullable().defaultTo(false);
    t.boolean('consent_advice').notNullable().defaultTo(false);
    t.string('consent_proof_url');
    t.string('language').defaultTo('mr');
    t.boolean('blocked').notNullable().defaultTo(false);
  });

  await knex.schema.createTable('consent_log', (t) => {
    t.increments('id');
    t.integer('farmer_id').notNullable().references('id').inTable('farmer');
    t.string('action').notNullable(); // granted | withdrawn
    t.string('note');
    t.timestamp('at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('activity_event', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.integer('activity_type_id').notNullable().references('id').inTable('activity_type');
    t.string('title');
    t.string('phase'); // pre | on | post
    t.string('scheduled_date').notNullable();
    t.integer('mdo_user_id').references('id').inTable('user');
    t.integer('cluster_id').references('id').inTable('geo_unit');
    // planned | assigned | in_progress | done | delayed | moved | missed  (doc: scheduled | done | missed | moved)
    t.string('status').notNullable().defaultTo('planned');
    t.string('actual_date');
    t.integer('attendance');
    t.float('actual_cost');
    t.float('gps_lat');
    t.float('gps_lng');
    t.string('photo_hash');
    t.string('photo_url');
    t.string('submitted_at');
    t.string('client_ts');
    t.string('notes');
    t.index(['plan_id', 'scheduled_date']);
    t.index(['mdo_user_id']);
  });

  await knex.schema.createTable('event_contact', (t) => {
    t.increments('id');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event').onDelete('CASCADE');
    t.integer('farmer_id').notNullable().references('id').inTable('farmer');
  });

  await knex.schema.createTable('callback', (t) => {
    t.increments('id');
    t.integer('farmer_id').notNullable().references('id').inTable('farmer');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event');
    t.string('due_date');
    t.string('status').notNullable().defaultTo('pending'); // pending | done
    t.string('called_at');
    t.boolean('will_buy');
    t.boolean('bought');
    t.integer('motivating_activity_type_id').references('id').inTable('activity_type');
    t.integer('caller_user_id').references('id').inTable('user');
  });

  await knex.schema.createTable('audit_flag', (t) => {
    t.increments('id');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event').onDelete('CASCADE');
    t.string('flag_type').notNullable();
    t.string('detail');
    t.boolean('resolved').notNullable().defaultTo(false);
    t.integer('resolved_by').references('id').inTable('user');
    t.string('resolved_note');
  });

  await knex.schema.createTable('sales_import', (t) => {
    t.increments('id');
    t.integer('mu_id').notNullable().references('id').inTable('mu');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('product_id').references('id').inTable('product');
    t.string('month').notNullable(); // YYYY-MM
    t.float('packs_liquidated').notNullable().defaultTo(0);
    t.float('po_packs').notNullable().defaultTo(0);
    t.timestamp('imported_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('demo_result', (t) => {
    t.increments('id');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event');
    t.float('treated_yield').notNullable();
    t.float('control_yield').notNullable();
    t.string('unit').notNullable().defaultTo('quintal/acre');
    t.float('price').notNullable();
  });

  await knex.schema.createTable('config', (t) => {
    t.string('key').primary();
    t.text('value').notNullable();
    t.string('description');
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'config', 'demo_result', 'sales_import', 'audit_flag', 'callback', 'event_contact', 'activity_event',
    'consent_log', 'farmer', 'village', 'plan_audit', 'plan_check', 'plan_line', 'campaign_plan', 'playbook',
    'activity_type', 'segment_rule', 'market_data', 'season', 'crop_product_dose', 'product', 'crop_stage',
    'crop', 'mu', 'user', 'geo_unit', 'hierarchy_level',
  ];
  for (const t of tables) await knex.schema.dropTableIfExists(t);
}

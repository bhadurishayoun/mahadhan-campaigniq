import type { Knex } from 'knex';

// CampaignIQ extension model: tables the backend brief does not define but Sayak's screens need.
// Every addition is documented in docs/gaps.md.

export async function up(knex: Knex): Promise<void> {
  const ts = (t: Knex.CreateTableBuilder) => t.timestamp('created_at').defaultTo(knex.fn.now());

  // Opportunity per geography (S1.1, S2.1, S2.2): market potential, score, penetration, readiness.
  await knex.schema.createTable('geo_opportunity', (t) => {
    t.increments('id');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.integer('product_id').references('id').inTable('product');
    t.float('market_potential_inr').notNullable().defaultTo(0);
    t.float('opportunity_score');
    t.float('penetration_pct');
    t.float('potential_pct');
    t.float('addressable_acres');
    t.integer('active_retailers');
    t.float('channel_readiness'); // 0-1
    t.float('conversion_feasibility'); // 0-1
    t.float('campaign_readiness'); // 0-100
    t.float('est_incremental_mt');
    t.integer('priority_farmers');
    t.text('trend_json');
    t.string('source').defaultTo('placeholder');
    t.string('as_of_date');
    t.unique(['geo_unit_id', 'crop_id', 'season_id']);
  });

  // Farmer cohorts per MU / cluster (S2.3, S2.5, S4.2)
  await knex.schema.createTable('farmer_segment_stat', (t) => {
    t.increments('id');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.string('segment').notNullable(); // conventional_npk | non_user | trial | partial_programme | repeat
    t.string('label').notNullable();
    t.integer('farmers').notNullable();
    t.float('acreage');
    t.float('opportunity_inr');
    t.string('conversion_feasibility'); // High | Medium | Low
    t.string('channel_readiness'); // High | Medium-High | Medium | Low
    t.float('priority_score');
    t.string('recommended_campaign');
    t.string('suggested_intervention');
    t.integer('sort_order').defaultTo(0);
  });

  await knex.schema.createTable('adoption_barrier', (t) => {
    t.increments('id');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.string('barrier').notNullable();
    t.float('pct').notNullable();
  });

  await knex.schema.createTable('competitor_product', (t) => {
    t.increments('id');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.string('product_name').notNullable();
    t.string('owner').notNullable(); // Mahadhan | Conventional | Local | Premium
    t.string('farmer_value');
    t.string('price_perception');
    t.string('retailer_push');
    t.string('yield_proof');
    t.string('ease_of_recommendation');
    t.float('farmer_value_score'); // 1-5, used on the Jalna competition table
    t.float('price_sensitivity_pct');
    t.float('retailer_push_score');
    t.string('switching_barrier');
  });

  await knex.schema.createTable('retailer', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.integer('mu_id').references('id').inTable('mu');
    t.integer('cluster_id').references('id').inTable('geo_unit');
    t.string('cluster_name');
    t.string('influence_level'); // High | Medium | Low
    t.float('influence_score');
    t.boolean('stocks_product').notNullable().defaultTo(false);
    t.float('stock_mt');
    t.float('estimated_demand_mt');
    t.string('stock_source'); // erp_confirmed | reported | estimated | unverified
    t.string('licence_status'); // Compliant | Pending | Non-compliant
    t.string('training_status'); // Completed | In Progress | Not Started
    t.string('field_owner');
    t.string('deadline');
    t.string('suggested_action');
    t.float('lat');
    t.float('lng');
  });

  await knex.schema.createTable('cluster_stage_share', (t) => {
    t.increments('id');
    t.integer('cluster_id').notNullable().references('id').inTable('geo_unit');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('season_id').notNullable().references('id').inTable('season');
    t.string('stage_name').notNullable();
    t.float('share_pct').notNullable();
    t.string('as_of_date');
  });

  await knex.schema.createTable('field_evidence', (t) => {
    t.increments('id');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.string('stage_name').notNullable();
    t.string('kind').notNullable(); // soil_nutrient | crop_stage | moisture
    t.string('title').notNullable();
    t.string('detail');
    t.string('status').notNullable(); // Needs data | Pending | Needs review | Verified
    t.string('action_label');
  });

  await knex.schema.createTable('nutrition_programme', (t) => {
    t.increments('id');
    t.integer('crop_id').notNullable().references('id').inTable('crop');
    t.integer('geo_unit_id').notNullable().references('id').inTable('geo_unit');
    t.integer('product_id').references('id').inTable('product');
    t.string('name').notNullable();
    t.string('status').notNullable().defaultTo('Draft'); // Draft | Under review | Approved
    t.string('agronomy_status').notNullable().defaultTo('Pending Validation');
    t.string('selected_stage');
    ts(t);
  });

  await knex.schema.createTable('programme_stage', (t) => {
    t.increments('id');
    t.integer('programme_id').notNullable().references('id').inTable('nutrition_programme').onDelete('CASCADE');
    t.string('stage_name').notNullable();
    t.string('product_name').notNullable();
    t.string('product_status'); // Master Mapped | Draft Option
    t.string('objective');
    t.string('application_window');
    t.string('validation_status'); // Approved for Review | Validation Pending | Draft Option
    t.integer('sort_order').defaultTo(0);
  });

  await knex.schema.createTable('campaign_template', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.string('category').notNullable(); // Awareness | Conversion | Retention
    t.string('objective');
    t.string('description');
    t.string('audience');
    t.string('channels');
    t.string('led_by'); // Channel-led | Lifecycle-led | Stage-led
    t.boolean('requires_signoff').notNullable().defaultTo(false);
    t.string('signoff_label');
    t.text('mix_json').notNullable(); // [{activity_type_id, share_pct}]
    t.boolean('recommended').notNullable().defaultTo(false);
    t.boolean('active').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('plan_approval', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('role_label').notNullable();
    t.string('role').notNullable(); // role required to decide
    t.integer('user_id').references('id').inTable('user');
    t.string('status').notNullable().defaultTo('pending'); // submitted | pending | approved | rejected
    t.string('status_label');
    t.string('due_date');
    t.string('decided_at');
    t.string('comment');
    t.integer('sort_order').defaultTo(0);
    t.boolean('can_approve').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('compliance_check', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('status').notNullable(); // approved | verified | pending | within_limit | enabled
    t.string('detail');
  });

  await knex.schema.createTable('readiness_check', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('area').notNullable();
    t.string('status').notNullable(); // Ready | Partial | Moderate | Pending | At Risk
    t.string('detail');
  });

  await knex.schema.createTable('plan_assumption', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('key').notNullable();
    t.text('value').notNullable();
    t.unique(['plan_id', 'key']);
  });

  await knex.schema.createTable('risk', (t) => {
    t.increments('id');
    t.integer('plan_id').references('id').inTable('campaign_plan');
    t.string('type').notNullable(); // adoption | weather | participation | stock | attendance | timeline
    t.string('title').notNullable();
    t.string('detail');
    t.string('severity').notNullable(); // High | Medium | Low
    t.string('status').notNullable().defaultTo('open'); // open | mitigating | closed
    t.text('evidence_json');
    t.string('detected_at');
  });

  await knex.schema.createTable('risk_driver', (t) => {
    t.increments('id');
    t.integer('risk_id').notNullable().references('id').inTable('risk').onDelete('CASCADE');
    t.string('label').notNullable();
    t.string('detail');
    t.float('impact_pct').notNullable();
    t.string('confidence'); // Verified | Probable | Possible
    t.integer('sort_order').defaultTo(0);
  });

  await knex.schema.createTable('funnel_actual', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.integer('cluster_id').references('id').inTable('geo_unit');
    t.integer('targeted').defaultTo(0);
    t.integer('reached').defaultTo(0);
    t.integer('engaged').defaultTo(0);
    t.integer('trialled').defaultTo(0);
    t.integer('adopted').defaultTo(0);
    t.integer('repeat').defaultTo(0);
    t.string('as_of_date');
  });

  await knex.schema.createTable('channel_performance', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan').onDelete('CASCADE');
    t.string('channel').notNullable();
    t.integer('reached');
    t.integer('trials');
    t.float('adopter_conversion');
    t.float('cost_efficiency_index'); // adopters per ₹1 lakh
    t.string('relative_effectiveness'); // Highest | High | Medium | Low
  });

  await knex.schema.createTable('learning', (t) => {
    t.increments('id');
    t.integer('plan_id').references('id').inTable('campaign_plan');
    t.string('kind').notNullable(); // worked | underperformed | change | next_season
    t.string('text').notNullable();
  });

  // Supply side (S5.2-S5.4). Read-only imports: no inventory ledger, no ERP logic.
  await knex.schema.createTable('stock_snapshot', (t) => {
    t.increments('id');
    t.integer('plan_id').references('id').inTable('campaign_plan');
    t.integer('mu_id').references('id').inTable('mu');
    t.integer('cluster_id').references('id').inTable('geo_unit');
    t.integer('product_id').references('id').inTable('product');
    t.string('sku');
    t.float('pack_kg');
    t.float('demand_mt').defaultTo(0);
    t.float('erp_stock_mt').defaultTo(0);
    t.float('in_transit_mt').defaultTo(0);
    t.string('source').defaultTo('erp_confirmed'); // erp_confirmed | reported | estimated
    t.string('as_of_date');
    t.string('required_by_date');
  });

  await knex.schema.createTable('stock_source', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan');
    t.string('source').notNullable();
    t.float('available_mt').notNullable();
    t.string('status').notNullable(); // Confirmed | Estimated
  });

  await knex.schema.createTable('replenishment_scenario', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan');
    t.string('code').notNullable(); // A | B | C
    t.string('name').notNullable();
    t.string('description');
    t.float('fulfilment_pct');
    t.string('lead_time');
    t.boolean('recommended').defaultTo(false);
    t.boolean('selected').defaultTo(false);
  });

  await knex.schema.createTable('replenishment_action', (t) => {
    t.increments('id');
    t.integer('plan_id').notNullable().references('id').inTable('campaign_plan');
    t.string('action').notNullable();
    t.float('qty_mt');
    t.string('owner');
    t.string('timeline');
    t.string('status').notNullable().defaultTo('Not Started'); // Pending | In Progress | Not Started | Confirmed
    t.string('eta');
    t.string('kind').notNullable().defaultTo('action'); // action | commitment
  });

  // Field evidence for the activity workspace (S6.2)
  await knex.schema.createTable('event_evidence', (t) => {
    t.increments('id');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event').onDelete('CASCADE');
    t.string('kind').notNullable(); // attendance | photo | observation | farmer_response | checklist | verification
    t.text('payload_json').notNullable();
  });

  await knex.schema.createTable('activity_task', (t) => {
    t.increments('id');
    t.integer('activity_event_id').notNullable().references('id').inTable('activity_event').onDelete('CASCADE');
    t.string('text').notNullable();
    t.boolean('done').notNullable().defaultTo(false);
  });

  // AI Copilot (rule-based, deterministic answers)
  await knex.schema.createTable('copilot_conversation', (t) => {
    t.increments('id');
    t.integer('user_id').references('id').inTable('user');
    t.string('title').notNullable();
    ts(t);
  });

  await knex.schema.createTable('copilot_message', (t) => {
    t.increments('id');
    t.integer('conversation_id').notNullable().references('id').inTable('copilot_conversation').onDelete('CASCADE');
    t.string('role').notNullable(); // user | assistant
    t.text('content').notNullable();
    t.text('payload_json');
    ts(t);
  });

  await knex.schema.createTable('notification', (t) => {
    t.increments('id');
    t.integer('user_id').references('id').inTable('user');
    t.string('text').notNullable();
    t.string('link');
    t.boolean('read').notNullable().defaultTo(false);
    ts(t);
  });

  // Import log (read-only CSV/API imports for market, sales and stock data)
  await knex.schema.createTable('import_log', (t) => {
    t.increments('id');
    t.string('kind').notNullable(); // market | sales | stock | retailers
    t.string('filename');
    t.integer('rows_ok').defaultTo(0);
    t.integer('rows_failed').defaultTo(0);
    t.text('errors_json');
    t.integer('user_id').references('id').inTable('user');
    ts(t);
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'import_log', 'notification', 'copilot_message', 'copilot_conversation', 'activity_task', 'event_evidence',
    'replenishment_action', 'replenishment_scenario', 'stock_source', 'stock_snapshot', 'learning',
    'channel_performance', 'funnel_actual', 'risk_driver', 'risk', 'plan_assumption', 'readiness_check',
    'compliance_check', 'plan_approval', 'campaign_template', 'programme_stage', 'nutrition_programme',
    'field_evidence', 'cluster_stage_share', 'retailer', 'competitor_product', 'adoption_barrier',
    'farmer_segment_stat', 'geo_opportunity',
  ];
  for (const t of tables) await knex.schema.dropTableIfExists(t);
}

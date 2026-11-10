// Shared engine types. The engine is pure: no DB, no HTTP, no Date.now().
// Shares and percentages are fractions (0.30 = 30%).

export interface SegmentRule {
  segment: string;
  min_pen: number;
  max_pen: number; // exclusive; use Infinity for open-ended
  objective: string;
  spend_cap_pct: number;
}

export type ValueSource = 'default' | 'learned';

export interface ActivityParams {
  activity_type_id: number;
  name: string;
  kind?: string; // demo | field_day | group_meeting | one_to_one | ...
  r: number; // farmers reached per unit
  k: number; // conversion rate
  c: number; // unit cost (INR)
  phase_split_pre: number;
  phase_split_on: number;
  phase_split_post: number;
  bucket: 'proven' | 'scaling' | 'pilot';
  r_source?: ValueSource;
  k_source?: ValueSource;
  k_sample_size?: number;
}

export interface MixLine {
  activity: ActivityParams;
  share_pct: number;
  n_override?: number | null; // user-edited count (planner stepper); replaces the computed n
}

export interface EngineConfig {
  max_activities_per_mdo_week: number;
  active_weeks: number;
  mdo_count: number;
  retention_focus: number;
  contingency_pct: number; // flex reserve as a share of the TOTAL budget (CampaignIQ S4.3); 0 in the MIT golden case
  amber_factor: number;
  innovative_farmers_mapped: number | null;
  villages_count: number;
  demo_farmers_per_village: number;
  share_tolerance: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  max_activities_per_mdo_week: 6,
  active_weeks: 16,
  mdo_count: 1,
  retention_focus: 0.2,
  contingency_pct: 0,
  amber_factor: 0.9,
  innovative_farmers_mapped: null,
  villages_count: 10,
  demo_farmers_per_village: 3,
  share_tolerance: 1e-6,
};

export interface PlanInput {
  crop_area: number;
  amp_pct: number;
  current_treated_pct: number;
  target_treated_pct: number;
  dose_packs_per_acre: number;
  pack_kg: number;
  price_per_pack: number;
  avg_area_per_farmer: number;
  segment_rules: SegmentRule[];
  segment_override?: string | null;
  lines: MixLine[];
  config?: Partial<EngineConfig>;
}

export type CheckStatus = 'green' | 'amber' | 'red';

export interface PlanCheck {
  check_name: string;
  value: number | null;
  limit: number | null;
  status: CheckStatus;
  info?: boolean;
  message: string;
}

export interface PlanLineResult {
  activity_type_id: number;
  name: string;
  kind?: string;
  bucket: 'proven' | 'scaling' | 'pilot';
  share_pct: number;
  r: number;
  k: number;
  c: number;
  r_source: ValueSource;
  k_source: ValueSource;
  k_sample_size: number | null;
  farmers_i: number; // F_i
  converts_per_unit: number; // r * k
  n: number;
  budget: number;
  budget_pre: number;
  budget_on: number;
  budget_post: number;
  phase_split_pre: number;
  phase_split_on: number;
  phase_split_post: number;
  planned_converts: number; // n * r * k
  cost_per_convert: number; // c / (r*k)
}

export interface PlanResult {
  mode: 'growth' | 'retention';
  penetration: number;
  segment: string;
  segment_auto: string;
  segment_overridden: boolean;
  objective: string;
  spend_cap_pct: number;
  current_area: number;
  target_area: number;
  incremental_area: number; // ΔA
  y_packs: number;
  y_tons: number;
  incremental_packs: number;
  incremental_value: number;
  total_value: number;
  farmers_to_convert: number; // F
  lines: PlanLineResult[];
  total_units: number; // Σ n
  budget: number; // B = Σ n·c
  contingency: number;
  budget_total: number; // B + contingency; basis for ratios and unit costs
  budget_pre: number;
  budget_on: number;
  budget_post: number;
  spend_ratio: number;
  spend_ratio_base: 'incremental_value' | 'total_value';
  cost_per_farmer: number;
  cost_per_acre: number;
  cost_per_pack: number;
  planned_converts: number;
  checks: PlanCheck[];
  can_submit: boolean;
}

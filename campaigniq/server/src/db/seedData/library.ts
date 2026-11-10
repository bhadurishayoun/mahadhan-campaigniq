// Placeholder reference data shared by the seed script and the tests.
// Doses, prices, unit costs and rates are PLACEHOLDERS: replace with approved Mahadhan values.

export const SEGMENT_RULES = [
  { segment: 'Emerging', min_pen: 0, max_pen: 0.25, objective: 'Establish', spend_cap_pct: 0.3 },
  { segment: 'Growing', min_pen: 0.25, max_pen: 0.5, objective: 'Grow', spend_cap_pct: 0.2 },
  { segment: 'Maturing', min_pen: 0.5, max_pen: 0.8, objective: 'Consolidate', spend_cap_pct: 0.12 },
  { segment: 'Matured', min_pen: 0.8, max_pen: 1e9, objective: 'Sustain', spend_cap_pct: 0.08 },
];

export interface ActivitySeed {
  id: number;
  name: string;
  display_name: string;
  kind: string;
  r_default: number;
  k_default: number;
  unit_cost: number;
  phase_split_pre: number;
  phase_split_on: number;
  phase_split_post: number;
  evidence_required: string;
  bucket: 'proven' | 'scaling' | 'pilot';
}

export const ACTIVITY_LIBRARY: ActivitySeed[] = [
  { id: 1, name: 'Crop demo with control strip', display_name: 'Farmer demonstrations', kind: 'demo', r_default: 25, k_default: 0.12, unit_cost: 6500, phase_split_pre: 0, phase_split_on: 1, phase_split_post: 0, evidence_required: 'GPS + photo of plot + attendance', bucket: 'proven' },
  { id: 2, name: 'Early field day + harvest days', display_name: 'Field / harvest days', kind: 'field_day', r_default: 150, k_default: 0.05, unit_cost: 20000, phase_split_pre: 1 / 3, phase_split_on: 0, phase_split_post: 2 / 3, evidence_required: 'GPS + photo + attendance', bucket: 'proven' },
  { id: 3, name: 'Group farmer meeting (8-10)', display_name: 'Farmer meetings', kind: 'group_meeting', r_default: 10, k_default: 0.1, unit_cost: 1500, phase_split_pre: 0.65, phase_split_on: 0.35, phase_split_post: 0, evidence_required: 'Attendance sheet + photo', bucket: 'proven' },
  { id: 4, name: 'One-to-one contact', display_name: 'One-to-one contacts', kind: 'one_to_one', r_default: 1, k_default: 0.15, unit_cost: 100, phase_split_pre: 0.65, phase_split_on: 0.35, phase_split_post: 0, evidence_required: 'Call-back verification', bucket: 'proven' },
  { id: 5, name: 'Large farmer meeting (75-100)', display_name: 'Large farmer meeting', kind: 'large_meeting', r_default: 90, k_default: 0.04, unit_cost: 12000, phase_split_pre: 0.75, phase_split_on: 0.25, phase_split_post: 0, evidence_required: 'Attendance sheet + photo', bucket: 'proven' },
  { id: 6, name: 'Multiplier meet', display_name: 'Multiplier meet', kind: 'multiplier_meet', r_default: 60, k_default: 0.06, unit_cost: 15000, phase_split_pre: 1, phase_split_on: 0, phase_split_post: 0, evidence_required: 'Attendance sheet + photo', bucket: 'scaling' },
  { id: 7, name: 'HVC / branded van campaign', display_name: 'Branded van campaign', kind: 'van', r_default: 300, k_default: 0.02, unit_cost: 25000, phase_split_pre: 0.25, phase_split_on: 0.75, phase_split_post: 0, evidence_required: 'GPS trail + photos', bucket: 'proven' },
  { id: 8, name: 'Tray pe Charcha (retailer counter)', display_name: 'Tray pe Charcha', kind: 'tray', r_default: 30, k_default: 0.08, unit_cost: 3000, phase_split_pre: 0.3, phase_split_on: 0.7, phase_split_post: 0, evidence_required: 'Retailer sign-off + photo', bucket: 'scaling' },
  { id: 9, name: 'Wall painting / hoarding', display_name: 'Wall painting / hoarding', kind: 'wall', r_default: 500, k_default: 0.005, unit_cost: 4000, phase_split_pre: 0.5, phase_split_on: 0.5, phase_split_post: 0, evidence_required: 'GPS + photo', bucket: 'proven' },
  { id: 10, name: 'Key influencer engagement', display_name: 'Key influencer engagement', kind: 'influencer', r_default: 20, k_default: 0.05, unit_cost: 5000, phase_split_pre: 0.4, phase_split_on: 0.4, phase_split_post: 0.2, evidence_required: 'Call-back verification', bucket: 'pilot' },
  // CampaignIQ channels (not in the backend brief): kept as separate, editable library entries.
  { id: 11, name: 'Retailer activation (training + POS + incentive)', display_name: 'Retailer activation', kind: 'retailer_activation', r_default: 25, k_default: 0.08, unit_cost: 27000, phase_split_pre: 0.3, phase_split_on: 0.7, phase_split_post: 0, evidence_required: 'Retailer sign-off + stock photo', bucket: 'scaling' },
  { id: 12, name: 'Digital advisory (WhatsApp / SMS / IVR)', display_name: 'Digital advisory', kind: 'digital_advisory', r_default: 3000, k_default: 0.018, unit_cost: 80000, phase_split_pre: 0.2, phase_split_on: 0.6, phase_split_post: 0.2, evidence_required: 'Delivery report + consent log', bucket: 'scaling' },
  { id: 13, name: 'Field follow-up (advisory + trial conversion)', display_name: 'Field follow-ups', kind: 'followup', r_default: 125, k_default: 0.046, unit_cost: 10000, phase_split_pre: 0, phase_split_on: 0.7, phase_split_post: 0.3, evidence_required: 'GPS + call-back verification', bucket: 'proven' },
];

// Segment playbooks from the backend brief (shares are fractions; each sums to 1).
export const PLAYBOOKS: Record<string, { activity_type_id: number; share_pct: number }[]> = {
  Emerging: [
    { activity_type_id: 1, share_pct: 0.4 },
    { activity_type_id: 2, share_pct: 0.3 },
    { activity_type_id: 3, share_pct: 0.2 },
    { activity_type_id: 4, share_pct: 0.1 },
  ],
  Growing: [
    { activity_type_id: 3, share_pct: 0.25 },
    { activity_type_id: 5, share_pct: 0.2 },
    { activity_type_id: 10, share_pct: 0.15 },
    { activity_type_id: 1, share_pct: 0.2 },
    { activity_type_id: 8, share_pct: 0.2 },
  ],
  Maturing: [
    { activity_type_id: 7, share_pct: 0.35 },
    { activity_type_id: 8, share_pct: 0.3 },
    { activity_type_id: 5, share_pct: 0.2 },
    { activity_type_id: 9, share_pct: 0.15 },
  ],
  Matured: [
    { activity_type_id: 9, share_pct: 0.4 },
    { activity_type_id: 8, share_pct: 0.35 },
    { activity_type_id: 7, share_pct: 0.25 },
  ],
};

export const CROPS = [
  { name: 'Banana', stage_anchor: 'planting' },
  { name: 'Cotton', stage_anchor: 'sowing' },
  { name: 'Grapes', stage_anchor: 'pruning' },
  { name: 'Groundnut', stage_anchor: 'sowing' },
  { name: 'Onion', stage_anchor: 'transplanting' },
  { name: 'Pomegranate', stage_anchor: 'pruning' },
  { name: 'Soybean', stage_anchor: 'sowing' },
  { name: 'Sugarcane', stage_anchor: 'planting' },
  { name: 'Tomato', stage_anchor: 'transplanting' },
];

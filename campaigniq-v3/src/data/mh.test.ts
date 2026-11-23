import { describe, expect, it } from 'vitest';
import { AMBAD, ambadMetrics, businessCase, NATIONAL, REGIONS, THEME_QUEUE, territoryById } from './bh';
import { sum } from './format';
import { ONION_VILLAGE_PLAN } from './fsm';
import {
  ambadPlan, ambadVillages, APPROVAL_ITEMS, EVIDENCE_REQUESTS, funnel, NATIONAL_MARKET, nationalRow, nextRequestStatus, proposals, RECOMMENDATIONS,
  REGION_OPPORTUNITY, regionRows, rolloutTerritories, ROLLOUT_ENVELOPE, STAGE_COUNTS, themeEffectiveness, WEST_STATES, westCampaigns, westSalesTotal,
  programmeVariance, INTERVENTION_PERFORMANCE,
} from './mh';
import { businessCaseC1, ZM_THEMES, zmImpact } from './zm';

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

describe('national and regional opportunity', () => {
  it('regions sum to the national figures and equal the Business Head regions', () => {
    expect(NATIONAL_MARKET()).toBe(1350);
    const rows = regionRows();
    expect(rows.map((r) => [r.abp, r.campaigns, r.adopters, r.investment, r.validatedSales])).toEqual(REGIONS.map((r) => [r.abp, r.campaigns, r.adopters, r.actual, r.sales]));
    const n = nationalRow();
    expect([n.abp, n.campaigns, n.adopters, n.investment]).toEqual([NATIONAL.abp, NATIONAL.campaigns, NATIONAL.adopters, NATIONAL.actual]);
    expect(REGION_OPPORTUNITY.map((r) => `${r.crop} · ${r.product}`)).toEqual(['Onion · Croptek', 'Paddy · Croptek', 'Wheat · Croptek', 'Paddy · Croptek']);
  });
  it('historical effectiveness = Business Head themes: ₹2.56 / 1.92 / 1.70 / 0.88 Cr at +0.40 / +0.40 / +0.19 / +0.10×', () => {
    expect(themeEffectiveness().map((t) => [t.sales, r2(t.roi)])).toEqual([[256, 0.4], [192, 0.4], [170, 0.19], [88, 0.1]]);
  });
  it('Maharashtra onion: ₹7–10 Cr, 14–18%, ₹40 → 48 L, ₹1.76 Cr over four quarters; 4 West states', () => {
    expect(WEST_STATES[0]).toEqual({ state: 'Maharashtra', market: [7, 10], penetration: [14, 18] });
    expect(westSalesTotal()).toBe(176);
    expect(WEST_STATES).toHaveLength(4);
  });
});

describe('plans, diagnosis and recommendations', () => {
  it('Ambad plan equals FSM / ZM: ₹4.20 Cr ABP, ₹1.90 Cr onion allocation, ₹25 L objective; villages from FSM', () => {
    const a = ambadPlan();
    expect([a.abp, a.onionAllocation, a.growthObjective, a.plan]).toEqual([territoryById('ambad')!.abp, AMBAD.onionAbp, 25, 380]);
    expect(ambadVillages().map((v) => v.village)).toEqual(ONION_VILLAGE_PLAN.map((v) => v.village));
  });
  it('funnel: 1,200 → 780 → 150 → 54 purchases once linked (36%)', () => {
    expect(funnel(false).purchases).toBeNull();
    const f = funnel(true);
    expect([f.eligible, f.reached, f.trials, f.purchases, f.trialToPurchasePct]).toEqual([1200, 780, 150, 54, 36]);
  });
  it('3 evidence requests progress draft → requested → received → validated; 3 recommendations, Croptek leading', () => {
    expect(EVIDENCE_REQUESTS).toHaveLength(3);
    expect(['draft', 'requested', 'received'].map((s) => nextRequestStatus(s as never))).toEqual(['requested', 'received', 'validated']);
    expect(RECOMMENDATIONS.filter((r) => r.leading).map((r) => r.name)).toEqual(['Croptek conversion']);
  });
});

describe('theme lifecycle and proposals', () => {
  it('lifecycle agrees: BH approved Croptek conversion, ZM acknowledged it; 3 BH items pending', () => {
    expect(THEME_QUEUE.find((t) => t.id === 'croptek-next')!.status).toBe('approved');
    expect(THEME_QUEUE.filter((t) => t.status !== 'approved').map((t) => t.name)).toEqual(['Multi-region retailer advocacy', 'North region crop nutrition awareness', 'Paddy nutrition programme']);
    expect(ZM_THEMES.find((t) => t.id === 'croptek-conversion')!.status).toBe('acknowledged');
    expect(ZM_THEMES.map((t) => t.name)).toEqual(['Croptek conversion', 'Nutrient programme adoption', 'Balanced nutrition awareness']);
  });
  it('proposal ROIs follow (sales × 35% − investment) ÷ investment and equal ZM / BH', () => {
    const [c1, c2] = proposals();
    expect([c1.investment, c1.sales, r1(c1.contribution), r2(c1.roi)]).toEqual([12, 48, 16.8, 0.4]);
    expect(c1.roi).toBeCloseTo(businessCase('croptek').netRoi, 10);
    expect(c1.scenarios!.map((s) => [r1(s.sales), r2(s.netRoi)])).toEqual([[36, 0.05], [48, 0.4], [60, 0.75]]);
    expect([c2.investment, c2.sales, r1(c2.contribution), c2.roi]).toEqual([8, 28, 9.8, 0.23]);
    expect(c1.investment).toBe(businessCaseC1().investment);
    expect(APPROVAL_ITEMS.filter((i) => i.mandatory).length).toBe(4);
  });
});

describe('rollout and performance', () => {
  it('rollout budgets fill the ₹12.0 L envelope; Ambad running; stage counts 12 → 8 → 6 → 4', () => {
    expect(r2(sum(rolloutTerritories(), (t) => t.budget))).toBe(ROLLOUT_ENVELOPE());
    expect(rolloutTerritories().find((t) => t.id === 'ambad')!.status).toBe('running');
    expect(STAGE_COUNTS.map((s) => s.n)).toEqual([12, 8, 6, 4]);
  });
  it('West, Croptek and Ambad equal BH: 80% / 72%, 180 adopters, +0.56×, −8 pp; follow-up −22 pp', () => {
    const c = westCampaigns().find((x) => x.id === 'croptek')!;
    expect([c.plannedExec, c.observedExec, c.adopters, r2(c.roi)]).toEqual([80, 72, 180, 0.56]);
    expect(programmeVariance()).toBe(-8);
    expect(INTERVENTION_PERFORMANCE.map((i) => i.observed - i.planned)).toEqual([-8, -22]);
    const z = zmImpact();
    const a = ambadMetrics();
    expect([z.trials, z.adopters, z.activitiesDone]).toEqual([a.trials, a.adopters, a.activitiesDone]);
  });
});

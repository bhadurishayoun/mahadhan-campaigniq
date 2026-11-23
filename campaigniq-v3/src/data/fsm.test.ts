import { beforeEach, describe, expect, it } from 'vitest';
import { AMBAD, ambadMetrics, applyPeriod, CONTRIBUTION_MARGIN, territoryById } from './bh';
import { sum } from './format';
import {
  ACTIVITY_UNITS, acresFor, budgetMix, CAMPAIGN_ACTIVITIES, clusterRows, clusterTotal, cropPlan, DEALERS, executionCounts, FARMERS_REACHED,
  funnel, impactSummary, objectiveCoverage, ONION_VILLAGE_PLAN, outletSummary, RETAILERS, scenarioOutcome, SCENARIOS, targetReconciliation,
  coverageCalc, dealersOf, lastYearMix, onionPlanOf, perfRows, retailersOf, defaultWizard, wizardScenarios, objectiveErrors, activityErrors,
  villagePerformance, campaignFunnel, unitsWith, statusAfter, interventionEffectiveness, planActivity,
} from './fsm';

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

beforeEach(() => applyPeriod('ytd'));

describe('Jalna cluster', () => {
  it('sums to its territories', () => {
    const rows = clusterRows();
    expect(rows.map((r) => [r.name, r.lastYear, r.abp, r1(r.growthPct)])).toEqual([['Ambad', 320, 420, 31.3], ['Ghansawangi', 280, 340, 21.4], ['Badnapur', 200, 240, 20]]);
    const t = clusterTotal();
    expect([t.lastYear, t.abp, r1(t.growthPct)]).toEqual([800, 1000, 25]);
    expect(t.abp).toBe(sum(rows, (r) => r.abp));
  });
  it('territory ABPs are the Business Head figures', () => {
    clusterRows().forEach((r) => expect(r.abp).toBe(territoryById(r.id)!.abp));
  });
});

describe('Ambad equals the Business Head', () => {
  it('ABP, activities, trials, adopters, sales, village gap', () => {
    const a = ambadMetrics();
    expect(territoryById('ambad')!.abp).toBe(420);
    expect([a.activitiesDone, a.activitiesPlanned, a.trials, a.adopters, r1(a.trialToAdoptionPct)]).toEqual([9, 13, 160, 72, 45]);
    expect(AMBAD.campaignLinkedSales).toBe(5.4);
    expect(r1(a.villageGap)).toBe(10.3);
    const s = impactSummary();
    expect([s.trials, s.adopters, s.tracked]).toEqual([a.trials, a.adopters, AMBAD.campaignLinkedSales]);
  });
  it('execution units match the Business Head activity counts', () => {
    expect(executionCounts()).toEqual({ planned: 13, completed: 9, scheduled: 2, atRisk: 2 });
    AMBAD.interventions.forEach((i, k) => {
      const units = ACTIVITY_UNITS.filter((u) => u.activity === CAMPAIGN_ACTIVITIES[k].id);
      expect([units.length, units.filter((u) => u.status === 'completed').length]).toEqual([i.planned, i.done]);
    });
  });
  it('farmers reached', () => {
    expect([FARMERS_REACHED.Dhanora, FARMERS_REACHED['Wadi Gaon'], sum(Object.values(FARMERS_REACHED), (v) => v)]).toEqual([280, 360, 640]);
  });
});

describe('outlets', () => {
  it('network and targets', () => {
    const o = outletSummary();
    expect([o.dealers, o.activeRetailers, o.inactiveRetailers, o.villages]).toEqual([8, 74, 6, 5]);
    expect([o.lastYear, o.proposed, r1(o.growthPct)]).toEqual([320, 380, 18.8]);
    expect(DEALERS[0]).toMatchObject({ name: 'Dhanora Agro Inputs', lastYear: 48, proposed: 55 });
    expect(DEALERS[1]).toMatchObject({ name: 'Ambad Crop Depot', lastYear: 36, proposed: 43 });
    DEALERS.forEach((d) => expect(RETAILERS.filter((r) => r.dealerId === d.id).length).toBe(d.activeRetailers + d.inactiveRetailers));
  });
  it('target reconciliation', () => {
    const t = targetReconciliation();
    expect([t.assigned, t.proposed, t.unallocated, r1(t.allocatedPct)]).toEqual([420, 380, 40, 90.5]);
  });
});

describe('crop plan', () => {
  it('totals', () => {
    const p = cropPlan();
    expect(p.map((c) => c.proposed)).toEqual([165, 110, 105]);
    expect(sum(p, (c) => c.proposed)).toBe(targetReconciliation().proposed);
    expect(sum(p, (c) => c.abp)).toBe(territoryById('ambad')!.abp);
    expect(p[0].abp).toBe(AMBAD.onionAbp);
    expect(sum(p, (c) => c.abp - c.proposed)).toBe(targetReconciliation().unallocated);
  });
  it('village onion plan sums to the onion plan', () => {
    expect(sum(ONION_VILLAGE_PLAN, (v) => v.plan)).toBe(cropPlan()[0].proposed);
    expect(acresFor(ONION_VILLAGE_PLAN.find((v) => v.village === 'Dhanora')!.plan)).toBe(750);
  });
});

describe('campaign', () => {
  it('budget mix sums to ₹3.00 L and 100%', () => {
    const b = budgetMix();
    expect(b.total).toBe(3);
    expect(b.rows.map((r) => Math.round(r.sharePct))).toEqual([35, 25, 20, 10, 10]);
    expect(r2(sum(b.rows, (r) => r.sharePct))).toBe(100);
  });
  it('scenario ROI follows the formula', () => {
    const out = SCENARIOS.map((s) => scenarioOutcome(s.sales));
    expect(out.map((o) => [o.sales, o.volumeMt, r2(o.netRoi)])).toEqual([[8, 8, -0.07], [12, 12, 0.4], [16, 16, 0.87]]);
    out.forEach((o) => expect(o.netRoi).toBeCloseTo((o.sales * CONTRIBUTION_MARGIN - 3) / 3, 10));
    const c = objectiveCoverage(12);
    expect([c.objective, c.remaining, c.coveredPct]).toEqual([25, 13, 48]);
  });
  it('funnel at the default assumptions gives the base case', () => {
    const f = funnel();
    expect([f.farmers, f.reached, f.trials, f.adopters, f.volumeMt, f.sales]).toEqual([640, 450, 200, 120, 12, 12]);
  });
  it('impact', () => {
    const s = impactSummary();
    expect([s.forecast, s.tracked, r1(s.variance)]).toEqual([12, 5.4, 6.6]);
    expect(s.netRoiToDate).toBeCloseTo((5.4 * CONTRIBUTION_MARGIN - s.spend) / s.spend, 10);
  });
});

describe('every territory plan reconciles', () => {
  it('dealers, crop plan and village onion plan', () => {
    for (const t of ['ambad', 'ghansawangi', 'badnapur'] as const) {
      const o = outletSummary(t);
      expect(o.lastYear).toBe(clusterRows().find((r) => r.id === t)!.lastYear);
      const crops = cropPlan(t);
      expect(sum(crops, (c) => c.abp)).toBe(territoryById(t)!.abp);
      expect(sum(crops, (c) => c.proposed)).toBe(o.proposed);
      expect(sum(onionPlanOf(t), (v) => v.plan)).toBe(crops[0].proposed);
      expect(retailersOf(t).length).toBe(sum(dealersOf(t), (d) => d.activeRetailers + d.inactiveRetailers));
    }
  });
  it('performance filters scale and reconcile', () => {
    const all = perfRows();
    const byCrop = ['Onion', 'Maize', 'Other crops'].map((crop) => perfRows({ crop, product: 'all', season: 'all' }));
    expect(r1(sum(byCrop, (rows) => sum(rows, (r) => r.lastYear)))).toBe(sum(all, (r) => r.lastYear));
    expect(r1(sum(byCrop, (rows) => sum(rows, (r) => r.abp)))).toBe(sum(all, (r) => r.abp));
    const mix = lastYearMix();
    expect(mix.crops.map((c) => Math.round(c.pct))).toEqual([38, 26, 36]);
  });
  it('coverage calculator (Dhanora)', () => {
    const c = coverageCalc(ONION_VILLAGE_PLAN.find((v) => v.village === 'Dhanora')!);
    expect([c.volumeMt, c.requiredAcres, c.previousAcres, c.retainedAcres, c.newAcres, c.eligibleNewAcres]).toEqual([15, 750, 500, 400, 350, 583]);
  });
});

describe('campaign wizard', () => {
  it('prefills from the business priority and matches the campaign figures', () => {
    const w = defaultWizard('onion-croptek');
    expect([w.name, w.villages.join(','), w.retailers.length]).toEqual(['Ambad Onion Croptek conversion', 'Dhanora,Wadi Gaon', 3]);
    expect(budgetMix(w.activities).total).toBe(3);
    expect(wizardScenarios(w).map((s) => [s.sales, r2(s.netRoi)])).toEqual([[8, -0.07], [12, 0.4], [16, 0.87]]);
    expect(objectiveErrors(w)).toEqual({});
    expect(activityErrors(w)).toEqual({});
  });
  it('flags missing required fields', () => {
    const w = { ...defaultWizard('maize-expansion'), name: ' ', villages: [], retailers: [] };
    expect(Object.keys(objectiveErrors(w)).sort()).toEqual(['name', 'retailers', 'villages']);
    expect(activityErrors({ ...w, activities: [] })).toHaveProperty('list');
  });
});

describe('execution, impact and diagnostics', () => {
  it('village performance equals the Business Head villages', () => {
    const vp = villagePerformance();
    expect([sum(vp, (v) => v.trials), sum(vp, (v) => v.adopters)]).toEqual([160, 72]);
    expect(r1(sum(vp, (v) => v.sales))).toBe(AMBAD.campaignLinkedSales);
    const d = vp.find((v) => v.name === 'Dhanora')!;
    const w = vp.find((v) => v.name === 'Wadi Gaon')!;
    expect([r1(d.conversionPct), r1(w.conversionPct), r1(w.conversionPct - d.conversionPct)]).toEqual([38.7, 49, 10.3]);
    expect(sum(vp, (v) => v.atRisk.length)).toBe(2);
  });
  it('campaign funnel uses the campaign villages', () => {
    expect(campaignFunnel()).toMatchObject({ reached: 640, trials: 80, adopters: 36 });
  });
  it('corrective actions clear exceptions', () => {
    const units = unitsWith({ [ACTIVITY_UNITS.find((u) => u.status === 'at_risk')!.id]: { status: statusAfter('Propose reschedule') } });
    expect(executionCounts(units)).toEqual({ planned: 13, completed: 9, scheduled: 3, atRisk: 1 });
    expect(statusAfter('Escalate issue')).toBe('escalated');
    expect(sum(interventionEffectiveness(), (e) => e.completed)).toBe(9);
  });
});

describe('calculated activity budget', () => {
  it('defaults to 12 units and ₹3.00 L; budget = units × unit cost', () => {
    const w = defaultWizard('onion-croptek');
    expect([sum(w.activities, (a) => a.units), budgetMix(w.activities).total]).toEqual([12, 3]);
    const four = w.activities.map((a) => (a.type === 'demonstration' ? planActivity(a.id, a.type, 4, a) : a));
    expect(four[0].cost).toBe(1.4);
    expect(budgetMix(four).total).toBe(3.35);
  });
});

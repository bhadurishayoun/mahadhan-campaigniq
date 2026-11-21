import { describe, expect, it } from 'vitest';
import { sum } from './format';
import {
  ALL_CAMPAIGNS, AMBAD, ambadMetrics, businessCase, CAMPAIGNS, planCampaignsOf, CONTRIBUTION_MARGIN, CROP_MIX, nationalReturns, netRoi, PRODUCT_MIX, regionRoi, campaignMetrics, campaignTotals, initialInterventions, NATIONAL,
  NATIONAL_METRICS, REGIONS, regionMetrics, territoriesOf, THEMES, themeCampaigns, themeShares,
} from './bh';

const r1 = (n: number) => Number(n.toFixed(1));

describe('national reconciles to regions', () => {
  it('matches the mockup totals', () => {
    expect(NATIONAL.abp).toBe(5000);
    expect(NATIONAL.achieved).toBe(4280);
    expect(r1(NATIONAL_METRICS.achievementPct)).toBe(85.6);
    expect(NATIONAL.approved).toBe(250);
    expect(NATIONAL.actual).toBe(190);
    expect(NATIONAL_METRICS.unspent).toBe(60);
    expect(Math.round(NATIONAL_METRICS.utilisationPct)).toBe(76);
    expect(NATIONAL.campaigns).toBe(12);
    expect(NATIONAL.adopters).toBe(1860);
    expect(NATIONAL.plannedExec).toBe(76);
    expect(NATIONAL.observedExec).toBe(70);
    expect(NATIONAL_METRICS.perAdopter).toBe(10215);
    expect(NATIONAL_METRICS.gap).toBe(720);
  });
  it('region rows recompute', () => {
    const exp: Record<string, [number, number, number]> = { west: [88.8, 9474, 180], south: [84.3, 11020, 220], north: [82.7, 10541, 190], east: [85.6, 10417, 130] };
    REGIONS.forEach((r) => {
      const m = regionMetrics(r);
      expect([r1(m.achievementPct), m.perAdopter, m.gap]).toEqual(exp[r.id]);
      expect(sum(Object.values(r.themeMix), (x) => x)).toBe(r.campaigns);
    });
  });
});

describe('themes reconcile', () => {
  it('sum to national', () => {
    expect(sum(THEMES, (t) => t.investment)).toBe(NATIONAL.actual);
    expect(sum(THEMES, (t) => t.adopters)).toBe(NATIONAL.adopters);
    expect(sum(THEMES, (t) => themeCampaigns(t.id))).toBe(12);
    expect(THEMES.map((t) => themeCampaigns(t.id))).toEqual([4, 3, 3, 2]);
  });
  it('crop and product views sum to national', () => {
    [CROP_MIX, PRODUCT_MIX].forEach((mix) => {
      expect(sum(mix, (m) => m.campaigns)).toBe(NATIONAL.campaigns);
      expect(sum(mix, (m) => m.investment)).toBe(NATIONAL.actual);
      expect(sum(mix, (m) => m.adopters)).toBe(NATIONAL.adopters);
      expect(sum(mix, (m) => m.sales)).toBe(706);
    });
  });
  it('shares match the learning chart', () => {
    expect(THEMES.map((t) => r1(themeShares(t).investmentShare))).toEqual([33.7, 25.3, 26.3, 14.7]);
    expect(THEMES.map((t) => r1(themeShares(t).adoptionShare))).toEqual([38.7, 24.7, 22.6, 14.0]);
  });
});

describe('West campaigns reconcile to West', () => {
  const t = campaignTotals('west');
  const west = REGIONS[0];
  it('totals', () => {
    expect(t.approved).toBe(west.approved);
    expect(t.actual).toBe(west.actual);
    expect(t.adopters).toBe(west.adopters);
    expect(t.target).toBe(1000);
    expect(t.adoptionPct).toBe(76);
    expect(t.perAdopter).toBe(9474);
    expect([t.plannedExec, t.observedExec]).toEqual([west.plannedExec, west.observedExec]);
    expect(CAMPAIGNS.length).toBe(west.campaigns);
  });
  it('rows', () => {
    expect(CAMPAIGNS.map((c) => r1(campaignMetrics(c).utilisationPct))).toEqual([75, 82.1, 78.6, 81.8]);
    expect(CAMPAIGNS.map((c) => campaignMetrics(c).perAdopter)).toEqual([5000, 8846, 12222, 12857]);
  });
  it('Croptek business case', () => {
    const bc = businessCase("croptek");
    expect([bc.variableCosts, bc.contribution, bc.netReturn]).toEqual([31.2, 16.8, 4.8].map((x) => expect.closeTo(x, 5)));
    expect(bc.netRoi).toBeCloseTo(0.4, 5);

  });
});

describe('territories and Ambad', () => {
  it('West territories sum to West', () => {
    const ts = territoriesOf('west');
    expect(sum(ts, (x) => x.abp)).toBe(1600);
    expect(Math.round(sum(ts, (x) => x.ytdSales))).toBe(1420);
    expect(sum(ts, (x) => x.campaigns)).toBe(4);
  });
  it('Ambad metrics', () => {
    const a = ambadMetrics();
    expect([a.activitiesDone, a.activitiesPlanned, r1(a.activityPct)]).toEqual([9, 13, 69.2]);
    expect([a.trials, a.adopters, r1(a.trialToAdoptionPct)]).toEqual([160, 72, 45]);
    expect(a.villages.map((v) => r1(v.pct))).toEqual([38.7, 49]);
    expect(r1(a.villageGap)).toBe(10.3);
    expect(AMBAD.cropRows[0].adopters).toBe(a.adopters);
  });
  it('interventions register', () => {
    const list = initialInterventions();
    expect(list.filter((i) => i.status === 'draft').length).toBe(2);
    expect(list.filter((i) => i.status === 'awaiting_response').length).toBe(2);
    expect(list[0].trigger).toBe('–8 pp execution variance');
  });
});

describe('attributed returns reconcile', () => {
  const r2 = (n: number) => Number(n.toFixed(2));
  it('sales sum to national and ROI follows the rule', () => {
    const n = nationalReturns();
    expect(n.sales).toBe(706);
    expect(r2(n.roi)).toBe(0.3);
    expect(sum(THEMES, (t) => t.sales)).toBe(n.sales);
    expect(sum(CAMPAIGNS, (c) => c.sales)).toBe(REGIONS[0].sales);
    expect(REGIONS.map((r) => r2(regionRoi(r)))).toEqual([0.4, 0.24, 0.24, 0.23]);
    expect(CAMPAIGNS.map((c) => r2(netRoi(c.sales, c.actual)))).toEqual([0.56, 0.4, 0.34, 0.4]);
    expect(THEMES.map((t) => r2(netRoi(t.sales, t.investment)))).toEqual([0.4, 0.4, 0.19, 0.1]);
    REGIONS.forEach((r) => expect(netRoi(r.sales, r.actual)).toBeCloseTo((r.sales * CONTRIBUTION_MARGIN - r.actual) / r.actual, 10));
  });
  it('forecasts', () => {
    expect(CAMPAIGNS.map((c) => businessCase(c.id).forecastSales)).toEqual([48, 112, 107, 88]);
    expect(businessCase('croptek').netRoi).toBeCloseTo(0.4, 5);
  });
});

describe('all-region campaign budgets reconcile', () => {
  it('regions, themes and count', () => {
    expect(ALL_CAMPAIGNS.length).toBe(12);
    REGIONS.forEach((r) => {
      const cs = planCampaignsOf(r.id);
      expect([sum(cs, (c) => c.approved), sum(cs, (c) => c.actual), sum(cs, (c) => c.adopters)]).toEqual([r.approved, r.actual, r.adopters]);
      expect(cs.length).toBe(r.campaigns);
    });
    expect(THEMES.map((t) => [sum(ALL_CAMPAIGNS.filter((c) => c.theme === t.id), (c) => c.actual), sum(ALL_CAMPAIGNS.filter((c) => c.theme === t.id), (c) => c.adopters)]))
      .toEqual([[64, 720], [48, 460], [50, 420], [28, 260]]);
    THEMES.forEach((t) => expect(ALL_CAMPAIGNS.filter((c) => c.theme === t.id).length).toBe(themeCampaigns(t.id)));
  });
});

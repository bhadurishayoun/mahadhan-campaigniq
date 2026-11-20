import { describe, expect, it } from 'vitest';
import { sum } from './format';
import {
  AMBAD, ambadMetrics, businessCase, CAMPAIGNS, CROP_MIX, PRODUCT_MIX, campaignMetrics, campaignTotals, initialInterventions, NATIONAL,
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
    const bc = businessCase('croptek')!;
    expect([bc.variableCosts, bc.contribution, bc.netReturn]).toEqual([31.2, 16.8, 4.8].map((x) => expect.closeTo(x, 5)));
    expect(bc.netRoi).toBeCloseTo(0.4, 5);
    expect(businessCase('trial')).toBeNull();
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

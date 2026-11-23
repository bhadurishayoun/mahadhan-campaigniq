import { describe, expect, it } from 'vitest';
import { AMBAD, ambadMetrics, businessCase, territoriesOf } from './bh';
import { sum } from './format';
import { budgetMix, CAMPAIGN_ACTIVITIES, cropPlan, defaultWizard, ONION_VILLAGE_PLAN } from './fsm';
import {
  ambadOnionGrowth, approvalQueue, businessCaseC1, businessCaseC2, CATEGORIES, driverBridge, nextSeason, planStatus, portfolioByTerritory,
  portfolioRows, portfolioTotal, revisedPlan, SCENARIO_SALES, scenarioRow, territoryPlan, territoryPlans, trialToPurchasePct, zmImpact,
  ZM_TERRITORY_IDS, zoneTerritories, zoneTotal, planContribution, planPortfolio, planCrops, mappingStatus, BASE_CHECKS, MAPPING_CHECKS,
  impactRows, territoryActivityPlan, PLAN_EXCEPTIONS, ACTIVITY_CHECKS, REGIONAL_ENVELOPE,
  scenariosFor, reconciliation, DRIVER_ROWS, MH_RETURN, SUBMISSION_CHECKS, DRIVERS,
  REVIEW_ITEMS, REWRITES, SEED_VERSIONS, TEMPLATES, versionChanges, BASE_ASSET_STATUS,
  CLAIMS, CONCEPTS, conceptRationale, CROP_STAGES, INTERVENTION_KPIS, JOURNEY, secondaryTrend, ZM_THEMES, AUDIENCE,
} from './zm';

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

describe('zone', () => {
  it('territories match BH and sum to the zone', () => {
    const z = zoneTerritories();
    expect(z.map((t) => [t.abp, t.ytdSales])).toEqual([[420, 362], [340, 295], [240, 210], [180, 166], [160, 148]]);
    expect(zoneTotal().abp).toBe(1340);
    expect(zoneTotal().ytdSales).toBe(sum(z, (t) => t.ytdSales));
  });
  it('BH West = zone + Aurangabad = ₹16.0 Cr / ₹14.2 Cr', () => {
    const w = territoriesOf('west');
    const rest = w.filter((t) => !ZM_TERRITORY_IDS.includes(t.id as never));
    expect(rest.map((t) => [t.id, t.abp, t.ytdSales])).toEqual([['aurangabad', 260, 239]]);
    expect([sum(w, (t) => t.abp), sum(w, (t) => t.ytdSales)]).toEqual([1600, 1420]);
  });
});

describe('crop nutrition portfolio', () => {
  it('category totals and growth', () => {
    expect(portfolioRows().map((r) => [r.lastYear, r.abp, r1(r.growthPct)])).toEqual([[240, 320, 33.3], [150, 180, 20], [90, 100, 11.1]]);
    const t = portfolioTotal();
    expect([t.lastYear, t.abp, r1(t.growthPct)]).toEqual([480, 600, 25]);
  });
  it('territory split sums to each category and to the total', () => {
    for (const c of CATEGORIES) {
      const zone = portfolioRows().find((r) => r.id === c.id)!;
      expect(sum(ZM_TERRITORY_IDS, (t) => portfolioRows(t).find((r) => r.id === c.id)!.abp)).toBe(zone.abp);
      expect(sum(ZM_TERRITORY_IDS, (t) => portfolioRows(t).find((r) => r.id === c.id)!.lastYear)).toBe(zone.lastYear);
    }
    expect(sum(portfolioByTerritory(), (t) => t.abp)).toBe(600);
  });
});

describe('territory plans', () => {
  it('Ambad plan equals the FSM plan: ₹3.80 Cr vs ₹4.20 Cr, onion ₹1.65 Cr', () => {
    const p = territoryPlan('ambad');
    expect([p.plan, p.abp, p.gap, p.croptekSku]).toEqual([380, 420, 40, 190]);
    expect(p.crops.map((c) => c.proposed)).toEqual(cropPlan('ambad').map((c) => c.proposed));
    expect(p.crops.map((c) => c.proposed)).toEqual([165, 110, 105]);
    expect(r1(ambadOnionGrowth().growthPct)).toBe(26.9);
  });
  it('statuses: Ambad received from FSM, one endorsed, one pending, two awaiting', () => {
    const st = ZM_TERRITORY_IDS.map((t) => planStatus(t, ['ambad']));
    expect(st).toEqual(['submitted', 'awaiting', 'awaiting', 'endorsed', 'submitted']);
    expect(planStatus('ghansawangi', ['ambad', 'ghansawangi'])).toBe('submitted');
    expect(planStatus('ambad', [], { ambad: 'endorsed' })).toBe('endorsed');
    expect(territoryPlans().every((p) => p.plan > 0 && p.plan <= p.abp)).toBe(true);
  });
  it('revised plan rev adds ₹7 L of onion at the same realisation', () => {
    const r = revisedPlan();
    expect([r.orig.onion, r.rev.onion, r.orig.plan, r.rev.plan, r.rev.gap]).toEqual([165, 172, 380, 387, 33]);
    expect(sum(r.villages, (v) => v.rev - v.orig)).toBe(7);
    expect(r.orig.acres).toBe(sum(ONION_VILLAGE_PLAN, (v) => v.plan) * 50);
  });
});

describe('business case and scenarios', () => {
  it('C1 equals the BH Croptek business case', () => {
    const c = businessCaseC1();
    const bh = businessCase('croptek');
    expect([c.investment, c.forecastSales, r1(c.contribution), r2(c.netRoi)]).toEqual([12, 48, 16.8, 0.4]);
    expect(c.netRoi).toBeCloseTo(bh.netRoi, 10);
  });
  it('driver bridge gives the ₹48.0 L forecast', () => {
    const d = driverBridge();
    expect([d.buyers, r2(d.volumeMt), r1(d.sales), r1(d.contribution), r2(d.netRoi)]).toEqual([240, 48, 48, 16.8, 0.4]);
  });
  it('scenario ROI = (sales × 35% − investment) ÷ investment', () => {
    expect(SCENARIO_SALES.map((s) => { const x = scenarioRow(s.sales); return [x.sales, r1(x.contribution), r2(x.netRoi)]; }))
      .toEqual([[36, 12.6, 0.05], [48, 16.8, 0.4], [60, 21, 0.75]]);
  });
  it('C2: ₹8.0 L → ₹28.0 L, contribution ₹9.8 L, ROI +0.23×', () => {
    const c = businessCaseC2();
    expect([c.investment, c.forecastSales, r1(c.contribution), r2(c.netRoi)]).toEqual([8, 28, 9.8, 0.23]);
  });
  it('trial-to-purchase is 36%', () => expect(trialToPurchasePct()).toBe(36));
});

describe('activity plan and approvals', () => {
  it('Ambad activity plan is 13 units and ₹3.00 L, same as the FSM planner default', () => {
    expect(CAMPAIGN_ACTIVITIES.map((a) => [a.units, a.cost])).toEqual([[4, 1], [3, 0.75], [3, 0.6], [1, 0.35], [2, 0.3]]);
    expect([sum(CAMPAIGN_ACTIVITIES, (a) => a.units), budgetMix().total]).toEqual([13, 3]);
    const w = defaultWizard('onion-croptek');
    expect([sum(w.activities, (a) => a.units), budgetMix(w.activities).total]).toEqual([13, 3]);
    const q = approvalQueue();
    expect([q[0].units, q[0].budget]).toEqual([13, 3]);
    expect(new Set(q.map((x) => x.status))).toEqual(new Set(['pending', 'approved', 'returned', 'awaiting']));
  });
});

describe('impact', () => {
  it('equals BH and FSM', () => {
    const i = zmImpact();
    const a = ambadMetrics();
    expect([i.reached, i.trials, i.adopters, r1(i.trialToAdoptionPct)]).toEqual([640, 160, 72, 45]);
    expect([i.activitiesDone, i.activitiesPlanned, r1(i.activityPct), i.campaignLinkedSales]).toEqual([9, 13, 69.2, AMBAD.campaignLinkedSales]);
    expect(i.activityProgress.map((p) => `${p.completed}/${p.planned}`)).toEqual(['3/4', '2/3', '2/3', '1/1', '1/2']);
    expect([r1(i.villageGap), i.regionalValidatedSales, r2(i.regionalRoi)]).toEqual([r1(a.villageGap), 40, 0.56]);
  });
  it('next-season findings use the computed figures', () => {
    const n = nextSeason();
    expect(n).toHaveLength(5);
    expect(n[0].finding).toContain('10.3 pp');
  });
});

describe('plan reviews (screens 1–5)', () => {
  it('plan portfolio contributions stay within each category ABP and total ₹5.70 Cr', () => {
    for (const t of ZM_TERRITORY_IDS) for (const c of planPortfolio(t)) expect(c.contribution).toBeLessThanOrEqual(c.abp);
    expect(sum(ZM_TERRITORY_IDS, planContribution)).toBe(570);
    expect(planPortfolio('ambad')[0].contribution).toBe(territoryPlan('ambad').croptekSku);
  });
  it('crop growth uses last-year sales per crop', () => {
    expect(planCrops('ambad').map((c) => [c.lastYear, c.proposed, r1(c.growthPct)])).toEqual([[144, 165, 14.6], [80, 110, 37.5], [96, 105, 9.4]]);
  });
  it('mapping: Jafrabad validated with all checks, Ambad needs review', () => {
    expect(mappingStatus('jafrabad')).toBe('validated');
    expect(BASE_CHECKS.jafrabad).toHaveLength(MAPPING_CHECKS.length);
    expect(mappingStatus('ambad')).toBe('needs_review');
    expect(mappingStatus('ambad', { ambad: 'validated' })).toBe('validated');
  });
});

describe('themes, concepts and proposition (screens 6–9)', () => {
  it('three assigned themes; Croptek awaits acknowledgement', () => {
    expect(ZM_THEMES.map((t) => [t.crop, t.status])).toEqual([['Onion', 'acknowledgement_pending'], ['Soybean', 'under_review'], ['Cotton', 'planned']]);
    expect(secondaryTrend()).toBe('₹40 L → ₹43 L → ₹45 L → ₹48 L');
  });
  it('C1 rationale: 3 observed market items and 4 suitability items', () => {
    const r = conceptRationale('c1');
    expect(r.filter((x) => x.assessment === 'Observed')).toHaveLength(3);
    expect(r.filter((x) => x.group === 'Intervention suitability')).toHaveLength(4);
    expect(r[2].finding).toBe('150 trials / 54 purchases = 36%');
  });
  it('concept audiences and overlap', () => {
    expect(CONCEPTS.map((c) => c.eligibleFarmers)).toEqual([AUDIENCE.c1, AUDIENCE.c2]);
    expect(AUDIENCE.overlap).toBeLessThanOrEqual(AUDIENCE.c2);
  });
  it('proposition: 4 journey stages, 5 KPIs matching the plan, 4 claims on the 4 onion stages', () => {
    expect(JOURNEY.map((j) => j.stage)).toEqual(['Retailer enablement', 'Farmer engagement', 'Trial / consideration', 'Verified first purchase']);
    expect(INTERVENTION_KPIS.map((k) => k.target)).toEqual(['3 retailer sessions', '640 farmers', '160 trials', '72 adopters', '₹48.0 L']);
    expect(CLAIMS).toHaveLength(4);
    expect(CLAIMS.every((c) => c.stages.every((st) => (CROP_STAGES as readonly string[]).includes(st)))).toBe(true);
  });
});

describe('collateral (screens 10–14)', () => {
  it('4 templates, detailer history v0.1 to v0.3, 3 prepared rewrites, 6 review items', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['detailer', 'leaflet', 'whatsapp', 'poster']);
    expect(SEED_VERSIONS.map((v) => v.id)).toEqual(['v0.1', 'v0.2', 'v0.3']);
    expect(REWRITES).toHaveLength(3);
    expect(REVIEW_ITEMS).toHaveLength(6);
    expect(REVIEW_ITEMS.some((r) => r.status === 'approved')).toBe(false);
    expect(BASE_ASSET_STATUS.detailer).toBe('technical_review');
  });
  it('v0.2 → v0.3 changes: headline, claim copy, image and the Marathi variant', () => {
    expect(versionChanges(SEED_VERSIONS[1], SEED_VERSIONS[2]).map((c) => c.item)).toEqual(['Headline', 'Product claim copy', 'Onion image', 'Marathi variant']);
    expect(versionChanges(SEED_VERSIONS[2], SEED_VERSIONS[2])).toEqual([]);
  });
});

describe('business case and proposals (screens 15–19)', () => {
  it('scenarios scale the bridge: ₹36 / 48 / 60 L at +0.05× / +0.40× / +0.75×', () => {
    expect(scenariosFor().map((x) => [r1(x.sales), r1(x.contribution), r2(x.netRoi)])).toEqual([[36, 12.6, 0.05], [48, 16.8, 0.4], [60, 21, 0.75]]);
    const more = scenariosFor({ ...DRIVERS, conversionUpliftPct: 12 });
    expect(r1(more[1].sales)).toBe(57.6);
  });
  it('C1 / C2 reconciliation: 2,496 unique farmers, ₹76.0 L combined, ₹3.9 L double count', () => {
    const r = reconciliation();
    expect([r.unique, r1(r.combinedSales), r1(r.doubleCount), r1(r.combinedNet), r.combinedInvestment]).toEqual([2496, 76, 3.9, 72.1, 20]);
  });
  it('9 driver rows (6 inputs), 5 readiness checks, 3 + 4 Marketing Head return items', () => {
    expect([DRIVER_ROWS.length, DRIVER_ROWS.filter((d) => d.input).length]).toEqual([9, 6]);
    expect(SUBMISSION_CHECKS).toHaveLength(5);
    expect([MH_RETURN.params.length, MH_RETURN.observations.length]).toEqual([3, 4]);
  });
});

describe('activity approvals (screens 20–21)', () => {
  it('Ambad plan equals FSM: 13 units, ₹3.00 L, villages from the execution units', () => {
    const p = territoryActivityPlan('ambad');
    expect([sum(p, (a) => a.units), r2(sum(p, (a) => a.budget))]).toEqual([13, 3]);
    expect(p[0].villages).toEqual([{ village: 'Dhanora', units: 2 }, { village: 'Wadi Gaon', units: 2 }]);
  });
  it('other territories split their totals exactly', () => {
    for (const q of approvalQueue().filter((x) => x.territory !== 'ambad')) {
      const p = territoryActivityPlan(q.territory);
      expect([sum(p, (a) => a.units), r2(sum(p, (a) => a.budget))]).toEqual([q.units, q.budget]);
      expect(p.every((a) => a.units >= 1)).toBe(true);
    }
  });
  it('local budgets stay within the ₹12.0 L regional envelope; 7 checks, 3 exception types', () => {
    expect(REGIONAL_ENVELOPE()).toBe(12);
    expect(sum(approvalQueue(), (q) => q.budget)).toBeLessThanOrEqual(12);
    expect([ACTIVITY_CHECKS.length, PLAN_EXCEPTIONS.length]).toEqual([7, 3]);
  });
});

describe('impact rows (screens 22–26)', () => {
  it('Ambad row equals the shared impact; non-started campaigns carry no outcome figures', () => {
    const rows = impactRows();
    const a = rows[0];
    expect([a.reached, a.trials, a.adopters, a.sales, a.done, a.planned, a.abp]).toEqual([640, 160, 72, AMBAD.campaignLinkedSales, 9, 13, 190]);
    expect(rows.filter((r) => r.done === null).map((r) => r.territory)).toEqual(['bhokardan', 'badnapur', 'jafrabad']);
    expect(rows.every((r) => r.planned === approvalQueue().find((q) => q.territory === r.territory)!.units)).toBe(true);
  });
});

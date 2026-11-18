/**
 * Zonal Manager - Impact & Learning (PM.10, 10A, 10B, 10C, PM.11, 11A, 11B, 11C, 11D) and AI Copilot (PM.AI1).
 */
import { useState } from 'react';
import { BarChart3, Lightbulb, Search, Sparkles, Table2 } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, COLORS } from '../ui';
import { Act, Actions, AiBox, Bars, Box, Checklist, Chips, Creative, Cta, Drawer, Facts, Field, Input, Meter, Muted, P, PmPage, Select, Source, Sources, Status, Strip, Table, Workflow } from './kit';
import {
  ACTIVITIES, ACTIVITY_TOTAL, AMBAD, C1, C2, COLLATERALS, CROP_PLAN, DHANORA, EVIDENCE, IMPACT, INVESTMENT, LOCAL_PLAN, MARGIN,
  ONION_APPROVED_LATER, PM_ROLE, PORTFOLIO, PORTFOLIO_TOTAL, SCENARIOS, THEME, VILLAGES, VILLAGE_GAP,
} from './data';
import { LiveCopilot } from '../ui/LiveCopilot';

const BASE = SCENARIOS[1];

/* ------------------------------------------------------------------ PM.10 */

export function Pm10() {
  return (
    <PmPage
      crumbs={[{ label: 'Impact & Learning' }, { label: 'Campaign Performance' }, { label: 'Crop-wise Uplift' }]}
      code="PM.10"
      title="Campaign Performance & Crop-wise Business Uplift"
      actions={<div className="row">
        <Select options={['Onion', 'All Crops']} /><Select options={['Croptek', 'All Products']} /><Select options={['West Region', 'Maharashtra']} /><Select options={[C1.name, 'All Campaigns']} /><Select options={['Jan–Feb 2027', 'FY 2026–27']} />
      </div>}
    >
      <Source>Later illustrative interim checkpoint after Marketing Head authorization, local TM approvals and execution progress. approval checks are not portrayed as approved without that transition.</Source>
      <Strip items={[
        { label: 'Product Portfolio ABP', value: '₹6.00 Cr' },
        { label: 'Campaign rollout progress', value: <>{IMPACT.activities} activities <Muted>(Ambad, source-linked)</Muted></> },
        { label: 'Verified commercial uplift', value: <Status>Attribution Pending</Status>, sub: 'Regional forecasts are never substituted for actual performance', tone: 'amber' },
      ]} />
      <div className="pm-two">
        <Box title="Crop × Product × Geography Performance" icon={<Table2 size={15} />}>
          <Table
            head={['Crop / Product', 'Region / Territory', 'Historical Sales / Current ABP', 'Tracked Campaign Outcomes', 'Verified Adoption / Coverage', 'Incremental Uplift Confidence', '']}
            rows={[
              [<b>Onion / Croptek</b>, 'Ambad, Jalna', <><Muted>Croptek-specific: Pending SKU source</Muted><br /><Muted>All-product Onion allocation {ONION_APPROVED_LATER} (context only)</Muted></>, <>{IMPACT.reached} reached · {IMPACT.trials} trials · {IMPACT.adopters} recorded adopters<br /><Muted>{IMPACT.linkedSales} provisional campaign-linked sales · {IMPACT.activities} activities</Muted></>, <>{IMPACT.adopters} recorded adopters <Status>Not verified incremental</Status></>, <Status>Attribution Pending</Status>, <Btn small to="pm.10a">View</Btn>],
              [<b>Onion / Croptek</b>, 'Jalna HQ', <Muted>Data pending</Muted>, <Muted>Data pending</Muted>, <Muted>Data pending</Muted>, <Status>Data Pending</Status>, <Muted>—</Muted>],
              [<b>Maize / Water Soluble</b>, 'Ambad, Jalna', <Muted>Data pending</Muted>, <Muted>No campaign</Muted>, <Muted>Data pending</Muted>, <Status>Data Pending</Status>, <Muted>—</Muted>],
              [<b>Onion / Specialty Nutrition</b>, 'West Region', <Muted>Data pending</Muted>, <Muted>No campaign</Muted>, <Muted>Data pending</Muted>, <Status>Data Pending</Status>, <Muted>—</Muted>],
            ]}
            highlight={0}
          />
          <Muted>Ambad figures are local interim data, not West Region totals. {IMPACT.linkedSales} is not verified incremental sales; all-product Onion allocation is not Croptek revenue.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="Planned vs completed local activities" tone="soft">
            <Bars height={110} data={[{ label: 'Ambad local activities', values: [ACTIVITY_TOTAL.units, ACTIVITY_TOTAL.done] }]} series={[{ label: 'Planned', color: COLORS.light }, { label: 'Completed', color: COLORS.dark }]} />
            <Muted>Current sales / area coverage: Pending (no like-for-like source values).</Muted>
          </Box>
          <Box title="Original PM forecast (regional, FORECAST)" tone="soft">
            <Facts cols={2} rows={[['Forecast incremental regional sales', <>{BASE.sales} <Status>Forecast</Status></>], ['Forecast contribution', <>{BASE.contribution} <Status>Forecast</Status></>]]} />
            <Muted>Geographically separate from the Ambad tracked interim {IMPACT.linkedSales}; no actual ROI without attribution.</Muted>
          </Box>
          <AiBox title="AI Product Performance Insight" items={[
            { text: 'Assess crop-wise portfolio growth per product once SKU sources are mapped.' },
            { text: 'Investigate execution and trial-to-purchase changes by village before drawing conclusions.', tone: 'amber' },
            { text: 'Identify data gaps before attributing any sales uplift.', tone: 'amber' },
          ]} />
          <Sources items={[{ label: 'Campaign Impact' }, { label: 'Diagnostics' }, { label: 'Forecast Assumptions', to: 'pm.8' }, { label: 'Portfolio Performance' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.9">← Back to Activity Approvals</Btn><Btn to="pm.10b">View Territory Results</Btn></>}
        right={<Cta to="pm.11">Investigate Crop-wise Uplift & Learning</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.10A */

export function Pm10a() {
  return (
    <PmPage
      crumbs={[{ label: 'Impact & Learning', to: 'pm.10' }, { label: 'Crop-wise Performance', to: 'pm.10' }, { label: 'Onion × Croptek × Ambad' }, { label: 'Performance Detail' }]}
      code="PM.10A"
      title="Crop × Product × Geography Performance Detail"
    >
      <Source><b>View Performance</b> on Onion × Croptek × Ambad. Future illustrative checkpoint; no real Mahadhan performance.</Source>
      <Strip items={[{ label: 'Crop', value: 'Onion' }, { label: 'Product', value: 'Croptek' }, { label: 'Geography', value: 'Ambad / Jalna' }, { label: 'Campaign', value: C1.name }]} />
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Performance evidence" icon={<Table2 size={15} />}>
            <Table
              head={['Metric', 'Historical / ABP', 'Observed to Date', 'Source', 'Confidence', '']}
              rows={[
                [<b>Croptek-specific historical sales</b>, <P>Pending SKU Source</P>, '—', 'ERP / DMS', <Status>Pending</Status>, <Btn small to="pm.10c">Source</Btn>],
                [<b>Croptek-specific current ABP</b>, <P>Pending SKU Mapping</P>, '—', 'PM.2A', <Status>Pending</Status>, <Btn small to="pm.2a">Mapping</Btn>],
                [<b>All-product Ambad Onion approved allocation</b>, `${ONION_APPROVED_LATER} (context only)`, '—', 'Approved business plan', <Status>Context — not Croptek sales</Status>, ''],
                [<b>Qualified reach (local)</b>, '—', IMPACT.reached, 'TM.IM1', <Status>Recorded</Status>, <Btn small to="pm.10b">Territory</Btn>],
                [<b>Documented trials</b>, '—', IMPACT.trials, 'TM.IM1', <Status>Recorded</Status>, ''],
                [<b>Recorded adopters</b>, '—', IMPACT.adopters, 'TM.IM1', <Status>Recorded — not incremental</Status>, ''],
                [<b>Trial-to-adoption (observed)</b>, '—', `${IMPACT.adopters} / ${IMPACT.trials} = ${IMPACT.rate}`, 'Derived', <Status>Observed rate, not intervention effect</Status>, ''],
                [<b>Provisional campaign-linked sales</b>, '—', IMPACT.linkedSales, 'Campaign Results / DMS', <Status>Provisional — not verified incremental</Status>, <Btn small to="pm.10c">Validate</Btn>],
                [<b>Incremental commercial uplift & ROI</b>, '—', <Status>Pending Attribution</Status>, 'method', <Status>Not Established</Status>, <Btn small to="pm.10c">Method</Btn>],
              ]}
            />
          </Box>
          <Box title="Planned vs completed local activities" tone="soft">
            <Meter value={ACTIVITY_TOTAL.done} max={ACTIVITY_TOTAL.units} label={`${ACTIVITY_TOTAL.done} of ${ACTIVITY_TOTAL.units} completed · ${ACTIVITY_TOTAL.completion}`} />
          </Box>
          <Box title="Business vs campaign measurement">
            <Facts cols={2} rows={[['All-product ABP', 'Territory business plan (all products)'], ['Product-specific sales', 'Croptek SKU sales — pending mapping'], ['Campaign-linked transactions', 'Recorded against campaign — provisional'], ['Attributable incremental sales', 'Requires baseline and matched cohorts']]} />
          </Box>
        </div>
        <div className="pm-stack">
          <Box title="Evidence & validation" tone="soft">
            <Checklist items={[
              { label: 'SKU / product sales mapping', status: 'Pending' },
              { label: 'Matched purchase evidence & cohort definitions', status: 'To Validate' },
              { label: 'Incremental sales baseline', status: 'Pending' },
              { label: 'Intervention attribution', status: 'Pending' },
            ]} />
          </Box>
          <Sources items={[{ label: 'TM.IM1' }, { label: 'TM.IM2' }, { label: 'Forecast assumptions', to: 'pm.8' }, { label: 'Portfolio', to: 'pm.10' }, { label: 'ERP / CRM candidate data' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.10">← Back to Campaign Results by Crop</Btn><Btn to="pm.10b">View Territory Impact</Btn><Btn to="pm.10c">View Source & Attribution Method</Btn></>}
        right={<Cta to="pm.11">Investigate Conversion & Learning</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.10B (drawer over PM.10A) */

export function Pm10b() {
  const [territory, setTerritory] = useState('Ambad / Jalna');
  const isAmbad = territory === 'Ambad / Jalna';
  return (
    <Drawer title="Results by Territory" status="Zonal Manager Read-Only" back="pm.10a" subtitle={`${C1.name} · Croptek · Onion · Maharashtra`}
      footer={<>
        <Act message="Territory clarification requested from TM">Request Territory Clarification</Act>
        <Btn to="pm.10c">View Source Evidence</Btn>
        <span className="pm-foot-right"><Btn to="pm.10a">Close</Btn></span>
      </>}
    >
      <Field label="Select territory"><Select options={['Ambad / Jalna', 'Jalna HQ', 'Paithan / Aurangabad']} value={territory} key={territory} /></Field>
      <Chips items={['Ambad / Jalna', 'Jalna HQ', 'Paithan / Aurangabad']} active={territory} onSelect={setTerritory} />
      {isAmbad ? (
        <>
          <Table compact head={['Metric', 'Observed to Date']} align={['l', 'r']} rows={[
            ['Qualified farmer reach', IMPACT.reached], ['Documented trials', IMPACT.trials], ['Recorded adopters', <>{IMPACT.adopters} <Muted>(recorded, not verified matched purchases)</Muted></>],
            ['Trial-to-adoption', `${IMPACT.rate} = ${IMPACT.adopters} / ${IMPACT.trials}`], ['Completed activities', `${ACTIVITY_TOTAL.done} of ${ACTIVITY_TOTAL.units} = ${ACTIVITY_TOTAL.completion}`], ['Provisional campaign-linked sales', <>{IMPACT.linkedSales} <Status>Not attributable incremental revenue</Status></>],
          ]} />
          <Meter value={ACTIVITY_TOTAL.done} max={ACTIVITY_TOTAL.units} />
        </>
      ) : (
        <Box tone="soft"><Status>Eligibility / Data Pending</Status><Muted>No recorded values for this territory yet.</Muted></Box>
      )}
      <Box title="Drill down (read-only for Zonal Manager)">
        <div className="pm-stack" style={{ gap: 6 }}>
          <Act message="Territory Campaign Impact opened read-only">Open Territory Campaign Impact · reach, trials, adoption, linked sales</Act>
          <Act message="Territory Campaign Diagnostics opened read-only">Open Territory Campaign Diagnostics · conversion variation, exceptions, drivers</Act>
        </div>
      </Box>
      <Sources items={[{ label: 'PM.10A', to: 'pm.10a' }, { label: 'TM.IM1' }, { label: 'TM.IM2' }, { label: 'Source & Attribution', to: 'pm.10c' }]} />
      <Muted>Cohort linkage and source confidence subject to validation; actual incremental commercial uplift and ROI <b>pending attribution</b>. The TM owns local corrective actions.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.10C (drawer over PM.10A) */

export function Pm10c() {
  return (
    <Drawer title="Source Evidence & Incremental Uplift Validation" status="Attribution Pending" width="50%" back="pm.10a" subtitle={`Ambad / Jalna · Onion · Croptek · ${C1.name} · PM read-only evidence review`}
      footer={<>
        <Btn to="pm.10a">Close</Btn>
        <Act message="Source records opened">View Source Records</Act>
        <Act message="Data validation requested">Request Data Validation</Act>
        <span className="pm-foot-right"><Cta to="pm.11a">Investigate Village Performance</Cta></span>
      </>}
    >
      <Table compact head={['Measure', 'Recorded value', 'Candidate source', 'Matching / validation', '']} rows={[
        [<b>Qualified reach</b>, IMPACT.reached, 'Field App / CRM', <P>Cohort linkage pending</P>, <Act small message="Drilldown opened">Drill</Act>],
        [<b>Documented trials</b>, IMPACT.trials, 'Field App', <P>Pending</P>, <Act small message="Drilldown opened">Drill</Act>],
        [<b>Recorded adopters</b>, IMPACT.adopters, 'CRM', <P>Purchase matching pending</P>, <Act small message="Drilldown opened">Drill</Act>],
        [<b>Campaign-linked sales</b>, <>{IMPACT.linkedSales} <Status>Provisional</Status></>, 'DMS', <P>Pending</P>, <Act small message="Drilldown opened">Drill</Act>],
        [<b>Completed activities</b>, `${ACTIVITY_TOTAL.done} / ${ACTIVITY_TOTAL.units}`, 'logs', <Status>Recorded</Status>, ''],
        [<b>Attributable incremental sales & ROI</b>, <Status>Not Established</Status>, 'Method below', <Status>Missing Baseline</Status>, ''],
      ]} />
      <Box title="Purchase verification" tone="soft">
        <Checklist items={[
          { label: 'Farmer-ID / CRM matching', status: 'Pending' }, { label: 'Croptek SKU transaction validation', status: 'Pending' }, { label: 'Transaction date alignment', status: 'Pending' },
          { label: 'Duplicate-record checks', status: 'Pending' }, { label: 'Purchase source completeness', status: 'Pending' },
        ]} />
      </Box>
      <Box title="Incrementality method">
        <Table compact head={['Component', 'Status']} rows={[
          ['Verified eligible exposed cohort', <P />], ['Valid comparable baseline / control', <Status>Missing Baseline</Status>], ['Incremental purchases above baseline', <P />],
          ['Validated incremental net sales', <P />], ['Contribution margin', <P>Finance verification</P>], ['Eligible campaign investment', <>{INVESTMENT} regional envelope · local ₹3 L <Status>To reconcile</Status></>],
        ]} />
        <Muted>{IMPACT.linkedSales} linked sales are not treated as incremental benefit; the 36% illustrative historical conversion is not causal lift.</Muted>
      </Box>
      <Box title="Data quality & sources" tone="soft">
        <Sources label="" items={[{ label: 'TM.IM1' }, { label: 'TM.IM2' }, { label: 'PM.10A', to: 'pm.10a' }, { label: 'CRM / Farmer Master' }, { label: 'ERP / DMS sales' }, { label: 'Forecast assumptions', to: 'pm.8' }]} />
        <Muted>Provenance preserved; integration statuses unknown. Product-specific sales stay distinct from the all-product Onion ABP {ONION_APPROVED_LATER}.</Muted>
      </Box>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.11 */

export function Pm11() {
  const { go } = useNav();
  return (
    <PmPage
      crumbs={[{ label: 'Impact & Learning', to: 'pm.10' }, { label: 'Crop-wise Uplift', to: 'pm.10a' }, { label: 'Diagnostics & Learning' }]}
      code="PM.11"
      title="What Worked & Next Season"
    >
      <Source>Selected Onion / Croptek / Ambad campaign impact. Future illustrative interim reporting, not real Mahadhan results.</Source>
      <Strip items={[
        { label: 'Reached', value: IMPACT.reached }, { label: 'Trials', value: IMPACT.trials }, { label: 'Recorded adopters', value: IMPACT.adopters },
        { label: 'Activities complete', value: IMPACT.activities }, { label: 'Provisional campaign-linked sales', value: IMPACT.linkedSales },
        { label: 'Attributed uplift / actual ROI', value: <Status>Pending</Status>, tone: 'amber' },
      ]} />
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Village-wise Conversion Diagnostic" icon={<Search size={15} />}>
            <Table
              head={['Village', 'Reached', 'Trials', 'Recorded adopters', 'Trial-to-adoption', '']}
              align={['l', 'r', 'r', 'r', 'r', 'l']}
              rows={VILLAGES.map((item) => [<b>{item.village}</b>, item.reached, item.trials, item.adopters, `${item.rate.toFixed(1)}%`, <Btn small to="pm.11a">Investigate</Btn>])}
              total={['Total', IMPACT.reached, IMPACT.trials, IMPACT.adopters, IMPACT.rate, '']}
              onRow={() => go('pm.11a')}
            />
            <Muted>Difference {VILLAGE_GAP} — indicative, not proof of cause, and contingent on matched cohort definitions.</Muted>
          </Box>
          <div className="pm-two-even">
            <Box title="Intervention Effectiveness">
              <Table compact head={['Intervention', 'Planned', 'Completed', 'Attribution']} align={['l', 'r', 'r', 'l']}
                rows={ACTIVITIES.map((item) => [<b>{item.activity}</b>, item.planned, item.done, <P>Pending</P>])}
                total={['Total', ACTIVITY_TOTAL.units, ACTIVITY_TOTAL.done, '']}
                onRow={() => go('pm.11b')}
              />
              <Muted>Activity completion is separate from causal impact.</Muted>
            </Box>
            <Box title="Collateral Effectiveness">
              <Table compact head={['Asset', 'Version', 'Usage evidence', 'Attributable impact']}
                rows={COLLATERALS.map((item) => [<b>{item.name}</b>, <Status>Verify authorized version</Status>, <P />, <P />])}
                onRow={() => go('pm.11c')}
              />
              <Muted>No unfinished collateral version is claimed approved or deployed without later authorization.</Muted>
            </Box>
          </div>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Learning & Next-Season Actions" items={[
            { text: 'Investigate the Dhanora conversion difference and follow-up evidence.', tone: 'amber' },
            { text: 'Compare retailer engagement and intervention completion by village.' },
            { text: 'Validate collateral exposure.' },
            { text: 'Propose a revised concept or intervention mix for next season.', tone: 'green' },
          ]}>
            <Muted>Each item: Recommendation Pending PM Review.</Muted>
          </AiBox>
          <Sources items={[{ label: 'PM.10', to: 'pm.10' }, { label: 'TM.IM1' }, { label: 'TM.IM2' }, { label: 'Collaterals', to: 'pm.7' }]} />
          <Box title="Actions" tone="soft">
            <div className="pm-stack" style={{ gap: 6 }}>
              <Btn to="pm.10c">View Source Evidence</Btn>
              <Act message="Next-season learning saved">Save Next-Season Learning</Act>
              <Btn to="pm.11d">Submit Recommendations to Marketing Head (review required)</Btn>
            </div>
          </Box>
        </div>
      </div>
      <Actions left={<Btn to="pm.10">← Back to Campaign Results by Crop</Btn>} right={<Cta to="pm.ai1">Ask Product & Campaign Copilot</Cta>} />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.11A (drawer over PM.11) */

export function Pm11a() {
  return (
    <Drawer title="Village Conversion & Performance Driver Investigation" status="PM Read-Only Evidence View" width="50%" back="pm.11" subtitle={`Onion / Croptek / ${C1.name} / Ambad / Dhanora`}
      footer={<>
        <Btn to="pm.11">Close</Btn>
        <Act message="Village source evidence opened">View Village Source Evidence</Act>
        <Act message="Territory clarification requested">Request Territory Clarification</Act>
        <span className="pm-foot-right"><Cta to="pm.11b">Investigate Intervention Effectiveness</Cta></span>
      </>}
    >
      <Table compact head={['Village', 'Qualified reach', 'Trials', 'Recorded adopters', 'Trial-to-adoption']} align={['l', 'r', 'r', 'r', 'r']}
        rows={VILLAGES.map((item) => [<b>{item.village}</b>, item.reached, item.trials, item.adopters, `${item.rate.toFixed(1)}%`])}
        total={['Total Ambad', IMPACT.reached, IMPACT.trials, IMPACT.adopters, IMPACT.rate]}
        highlight={0}
      />
      <Muted>Village gap {VILLAGE_GAP}. No causation or incremental uplift implied.</Muted>
      <Bars height={110} data={VILLAGES.map((item) => ({ label: item.village, values: [item.rate] }))} series={[{ label: 'Trial-to-adoption', color: COLORS.dark }]} format={(value) => `${value.toFixed(1)}%`} />
      <Box title="Diagnostic evidence matrix">
        <Table compact head={['Driver', 'Dhanora', 'Wadi Gaon', 'Status']} rows={[
          [<b>Field demo timing</b>, 'Stock-dependent demo flagged earlier', 'Field confirmation flagged', <Status>Causal role Not Verified</Status>],
          [<b>Retailer participation</b>, <P>Verify</P>, <P>Verify</P>, <P>Pending</P>],
          [<b>Farmer follow-up completion</b>, <P>Verify</P>, <P>Verify</P>, <P>Pending</P>],
          [<b>Stock availability</b>, <Status>Unconfirmed</Status>, <Status>Unconfirmed</Status>, <P>Pending</P>],
          [<b>Purchase / CRM matching</b>, <P>Pending</P>, <P>Pending</P>, <P>Pending</P>],
          [<b>Authorized collateral exposure</b>, <P>Verify</P>, <P>Verify</P>, <P>Pending</P>],
        ]} />
        <Muted>The overall Ambad campaign has {IMPACT.activities} activities completed — a territory total, not Dhanora's count.</Muted>
      </Box>
      <AiBox title="AI Diagnostic Checks" items={[
        { text: 'Validate Dhanora follow-up / contact evidence.' }, { text: 'Compare retailer and stock readiness across villages.' }, { text: 'Verify recorded purchase matching and collateral exposure.' },
      ]} />
      <Sources items={[{ label: 'Village table', to: 'pm.11' }, { label: 'Recorded impact' }, { label: 'Territory diagnostics' }, { label: 'Source / attribution', to: 'pm.10c' }, { label: 'Approved collateral records', to: 'pm.7' }]} />
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.11B (drawer over PM.11) */

export function Pm11b() {
  const [selected, setSelected] = useState(4);
  const item = ACTIVITIES[selected];
  return (
    <Drawer title="Intervention Effectiveness & Execution Diagnostics" status="PM Read-Only" width="50%" back="pm.11" subtitle={`${C1.name} · Onion / Croptek · Ambad / Jalna`}
      footer={<>
        <Btn to="pm.11">Back to What Worked & Why</Btn>
        <Act message="Activity source evidence opened">View Activity Source Evidence</Act>
        <Act message="Territory clarification requested">Request Territory Clarification</Act>
        <span className="pm-foot-right"><Cta to="pm.11c">Investigate Collateral Effectiveness</Cta></span>
      </>}
    >
      <Table compact head={['Intervention', 'Planned', 'Completed', 'Completion', 'Impact evidence']} align={['l', 'r', 'r', 'r', 'l']}
        rows={ACTIVITIES.map((row) => [<b>{row.activity}</b>, row.planned, row.done, `${((row.done / row.planned) * 100).toFixed(1)}%`, <Status>Attribution Pending</Status>])}
        total={['Total', ACTIVITY_TOTAL.units, ACTIVITY_TOTAL.done, ACTIVITY_TOTAL.completion, '']}
        highlight={selected}
        onRow={setSelected}
      />
      <div className="pm-stack" style={{ gap: 4 }}>
        {ACTIVITIES.map((row) => <Meter key={row.activity} value={row.done} max={row.planned} label={`${row.activity} · ${row.done}/${row.planned}`} tone={row.done === row.planned ? 'green' : 'amber'} />)}
      </div>
      <Box title={`Selected intervention · ${item.activity}`} tone="soft">
        <Facts cols={2} rows={[
          ['Planned / completed', `${item.planned} / ${item.done}`], ['Responsible field owner & completion evidence', <P>Verification required</P>],
          ['Qualifying CRM contacts', <P />], ['Verified purchase linkage', <P />],
          ['Exposure by village (Dhanora / Wadi Gaon)', <Status>Not Available</Status>], ['Attributed adoption & commercial lift', <Status>Not Established</Status>],
        ]} />
      </Box>
      <AiBox title="AI Investigation Checks" items={[
        { text: 'Verify owner and completion logs.' }, { text: 'Match farmer contacts and follow-up exposure.' }, { text: 'Compare verified exposure with subsequent recorded purchases and a suitable baseline before impact claims.' },
      ]} />
      <Sources items={[{ label: 'Village Diagnostics', to: 'pm.11a' }, { label: 'Attribution Evidence', to: 'pm.10c' }, { label: 'Execution Diagnostics' }, { label: 'KPI Definitions', to: 'pm.6a' }, { label: 'Authorized Collateral Records', to: 'pm.7' }]} />
      <Muted>{IMPACT.adopters} recorded adopters across Ambad are distinct from intervention-attributed adopters, which remain unknown.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.11C (drawer over PM.11) */

export function Pm11c() {
  const [selected, setSelected] = useState(0);
  const asset = COLLATERALS[selected];
  return (
    <Drawer title="Campaign Collateral & Creative Effectiveness" status="Evidence Analysis — Pending" width="50%" back="pm.11" subtitle={`${C1.name} · Croptek / Onion · Ambad / Jalna · future illustrative interim reporting`}
      footer={<>
        <Btn to="pm.11">Back to What Worked & Why</Btn>
        <Act message="Authorized asset record opened (registry match pending)">View Authorized Asset Record</Act>
        <Act message="Territory usage evidence requested">Request Territory Usage Evidence</Act>
        <Btn to="pm.7c">View Creative Version History</Btn>
        <span className="pm-foot-right"><Cta to="pm.11d">Consolidate Next-Season Learnings</Cta></span>
      </>}
    >
      <Table compact head={['Asset', 'Authorized version', 'Distribution / usage', 'Engagement', 'Attributed impact', '']}
        rows={COLLATERALS.map((item, index) => [<b>{item.name}</b>, <Status>{index === 0 ? 'v0.3 submitted — verify authorized version' : 'Registry match pending'}</Status>, <P />, <P />, <Status>Not Established</Status>, <Btn small onClick={() => setSelected(index)}>View</Btn>])}
        highlight={selected}
        onRow={setSelected}
      />
      <div className="pm-two-even">
        <Creative kind={asset.kind} lang={asset.kind === 'whatsapp' || asset.kind === 'poster' ? 'Marathi' : 'English'} size="md" label="Illustrative preview" version={asset.version} />
        <Facts rows={[
          ['Authorized version check', <P>Registry match pending</P>], ['Target retailers / farmers', <P />], ['Distribution record validation', <P />],
          ['Actual field use verification', <P />], ['Exposure / engagement linkage', <P />], ['Linked purchase attribution', <Status>Not Established</Status>],
        ]} />
      </div>
      <Workflow compact steps={[{ label: 'Content Approved' }, { label: 'Distributed' }, { label: 'Usage Verified' }, { label: 'Engagement Matched' }, { label: 'Impact Assessed' }]} />
      <AiBox title="AI Collateral Learning" items={[
        { text: 'Verify asset version and retailer usage.' }, { text: 'Reconcile Marathi digital delivery with consent / engagement.' }, { text: 'Compare documented exposure with recorded purchases using a suitable baseline before claiming effect.' },
      ]} />
      <Sources items={[{ label: 'Editor', to: 'pm.7a' }, { label: 'Asset Approval', to: 'pm.7d' }, { label: 'Playbook Release', to: 'pm.7e' }, { label: 'Intervention Diagnostics', to: 'pm.11b' }, { label: 'Evidence / Attribution', to: 'pm.10c' }, { label: 'Source Records' }]} />
      <Muted>The PM may inspect asset evidence and propose next-season revisions, but cannot alter field activity logs or bypass technical / brand reapproval.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.11D */

const LEARNINGS = [
  { finding: `Dhanora trial-to-adoption ${VILLAGES[0].rate}% vs Wadi Gaon ${VILLAGES[1].rate}% (${VILLAGE_GAP})`, confidence: 'Recorded · causality unverified', change: 'Further village conversion and cohort investigation before any targeting change', priority: 'High', source: 'PM.11A' },
  { finding: 'Farmer Follow-ups 1 / 2 completed', confidence: 'Recorded · adoption impact pending', change: 'Enhanced owner assignment, contact completion tracking, consent-based follow-up validation', priority: 'High', source: 'PM.11B' },
  { finding: 'Retailer Activation 2 / 3 completed', confidence: 'Recorded', change: 'Validate retailer participation and intervention feasibility before scale decision', priority: 'Medium', source: 'PM.11B' },
  { finding: 'Collateral authorization / usage evidence incomplete', confidence: 'Incomplete', change: 'Verified asset-version distribution and usage tracking; no assumed creative effectiveness', priority: 'Medium', source: 'PM.11C' },
  { finding: `Provisional campaign-linked sales ${IMPACT.linkedSales}`, confidence: 'Provisional · not incremental', change: 'Verified purchase matching and incremental-sales baseline before financial attribution', priority: 'High', source: 'PM.10C' },
];

export function Pm11d() {
  const [picked, setPicked] = useState<number[]>([0, 1, 4]);
  const toggle = (index: number) => setPicked((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));
  return (
    <PmPage
      crumbs={[{ label: 'Impact & Learning', to: 'pm.10' }, { label: 'Campaign Diagnostics', to: 'pm.11' }, { label: 'Next-Season Changes' }]}
      code="PM.11D"
      title="Next-Season Changes"
      status="Draft Recommendations / Not Submitted"
    >
      <Source><b>Consolidate Next-Season Learnings</b>, after village diagnostics and intervention effectiveness. Future illustrative interim learning checkpoint, not season-end impact.</Source>
      <div className="pm-kpi-row">
        <div className="pm-kpi"><span>Recorded adopters</span><strong>{IMPACT.adopters}</strong><small>Ambad local, recorded</small></div>
        <div className="pm-kpi"><span>Local activity progress</span><strong>{IMPACT.activities}</strong><small>{ACTIVITY_TOTAL.completion} complete</small></div>
        <div className="pm-kpi"><span>Incremental commercial uplift</span><strong><Status>Pending Attribution</Status></strong><small>Provisional linked sales not treated as verified incremental revenue</small></div>
      </div>
      <div className="pm-two">
        <Box title="Learning-to-Action Matrix" icon={<Lightbulb size={15} />}>
          <Table
            head={['Recorded finding', 'Evidence / confidence', 'Recommended season change', 'Priority', 'Select']}
            rows={LEARNINGS.map((item, index) => [<b>{item.finding}</b>, <Status>{item.confidence}</Status>, <span className="small">{item.change}</span>, <Status tone={item.priority === 'High' ? 'amber' : 'grey'}>{item.priority}</Status>, <input type="checkbox" checked={picked.includes(index)} onChange={() => toggle(index)} />])}
            highlight={(index) => picked.includes(index)}
          />
          <Muted>Hypotheses are not presented as causes; no invented verified benefits.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="Season Recommendation Package" tone="soft">
            <Facts rows={[
              ['Selected recommendations', `${picked.length} of ${LEARNINGS.length}`],
              ['Validation owner roles', 'Field Sales Manager · Agronomy · Master Data · Finance'],
              ['Draft target planning period', <Input placeholder="Select season" />],
              ['Evidence-link coverage', <P>Partial</P>],
              ['MH review recipient', 'Marketing Head'],
            ]} />
            <div className="pm-stack" style={{ gap: 6 }}>
              <Btn to="pm.5">Create Draft Campaign Concept (subject to theme alignment)</Btn>
              <Cta locked="Conditionally disabled while mandatory evidence governance is unmet">Submit Recommendations for Marketing Head Review</Cta>
            </div>
          </Box>
          <Sources items={[{ label: 'Village', to: 'pm.11a' }, { label: 'Intervention', to: 'pm.11b' }, { label: 'Collateral', to: 'pm.11c' }, { label: 'Attribution', to: 'pm.10c' }, { label: 'Diagnostic' }, { label: 'Forecast', to: 'pm.8' }]} />
          <AiBox title="AI Season Guidance" items={[{ text: 'Validate exposure and purchase linkage.' }, { text: 'Test intervention / retailer readiness hypotheses.' }, { text: 'Update campaign measurement and collateral controls.' }]} />
          <Workflow compact steps={[{ label: 'PM Learning Draft', state: 'active' }, { label: 'PM Review' }, { label: 'Submit to Marketing Head' }, { label: 'MH Strategic Theme Alignment' }, { label: 'New Concept Draft' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.11">← Back to What Worked & Why</Btn><Btn to="pm.10c">View Source Evidence</Btn><Act message="Learning draft saved">Save Learning Draft</Act><Act message="Missing evidence requested">Request Missing Evidence</Act></>}
        right={<Cta locked="Submitting does not approve a new campaign, modify the current programme or launch next-season activities; disabled while evidence governance is unmet">Submit Recommendations to Marketing Head</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.AI1 */

const QUESTIONS = ['Which intervention worked?', 'Where is growth lagging?', 'What should change next year?', 'Is the ₹12 L investment justified?'];

/** Zonal Manager figures handed to the live LLM as grounding context. */
const PM_FACTS = [
  `Persona: ${PM_ROLE}. All figures illustrative.`,
  `Portfolio ABP (Rs Cr): ${PORTFOLIO.map((p) => `${p.product} ${p.ly} last year -> ${p.abp}`).join('; ')}; total ${PORTFOLIO_TOTAL.ly} -> ${PORTFOLIO_TOTAL.abp}.`,
  `Territory submission ${AMBAD.territory}: ABP ${AMBAD.abp}, submitted ${AMBAD.submitted}, gap ${AMBAD.gap}. Crop plan: ${CROP_PLAN.map((c) => `${c.crop} ${c.business} (${c.growth})`).join('; ')}.`,
  `Dhanora onion: history ${DHANORA.histRev} / ${DHANORA.histVol}, target ${DHANORA.tgtRev} / ${DHANORA.tgtVol}, area ${DHANORA.prevAcres} -> ${DHANORA.reqAcres} at ${DHANORA.rate}, realisation ${DHANORA.realPrev} -> ${DHANORA.realNew}.`,
  `Theme from Marketing Head: ${THEME.name} (${THEME.scope}); objective: ${THEME.objective}. Evidence: penetration ${EVIDENCE.penetration}, pilot ${EVIDENCE.purchases}/${EVIDENCE.trials} trial-to-purchase ${EVIDENCE.trialToPurchase}.`,
  `Concepts: ${C1.id} ${C1.name} (${C1.evidence}); ${C2.id} ${C2.name} (${C2.evidence}).`,
  `Business case: investment ${INVESTMENT}, margin ${MARGIN}; scenarios ${SCENARIOS.map((s) => `${s.name} sales ${s.sales}, contribution ${s.contribution}, ROI ${s.roi}`).join('; ')}.`,
  `Local plan ${LOCAL_PLAN.name}: ${LOCAL_PLAN.villages}, ${LOCAL_PLAN.retailers}, ${LOCAL_PLAN.units} units, budget ${LOCAL_PLAN.budget}, status ${LOCAL_PLAN.status}. Activities: ${ACTIVITIES.map((a) => `${a.activity} ${a.done}/${a.planned} done (${a.budget})`).join('; ')}.`,
  `Interim results: reached ${IMPACT.reached}, trials ${IMPACT.trials}, adopters ${IMPACT.adopters} (${IMPACT.rate}), linked sales ${IMPACT.linkedSales} (provisional, not incremental), activities ${IMPACT.activities}. ${VILLAGES.map((v) => `${v.village} ${v.reached}/${v.trials}/${v.adopters} = ${v.rate}%`).join('; ')}; gap ${VILLAGE_GAP}.`,
  'Unverified: stock-dependent demonstration in Dhanora, field-confirmation flag in Wadi Gaon, retailer engagement, follow-up completion, CRM purchase matching.',
].join('\n');

export function PmAi1() {
  return (
    <PmPage
      crumbs={[{ label: 'AI Copilot' }, { label: THEME.name }, { label: 'Ambad' }, { label: 'Campaign Diagnostics' }]}
      code="PM.AI1"
      title="AI Copilot"
    >
      <Source><b>Ask Product & Campaign Copilot</b>. Final Zonal Manager persona screen.</Source>
      <div className="pm-chat">
        <div className="pm-chat-thread">
          <div className="pm-msg pm-msg-user">
            <span className="pm-msg-avatar">PM</span>
            <div className="pm-msg-body"><p>Why is Croptek trial-to-adoption lower in Dhanora than Wadi Gaon, and what should we change next season?</p></div>
          </div>
          <div className="pm-msg">
            <span className="pm-msg-avatar"><Sparkles size={14} /></span>
            <div className="pm-msg-body">
              <p><b>Documented metrics.</b> Dhanora: {VILLAGES[0].trials} trials, {VILLAGES[0].adopters} adopters, {VILLAGES[0].rate}%. Wadi Gaon: {VILLAGES[1].trials} trials, {VILLAGES[1].adopters} adopters, {VILLAGES[1].rate}%. Gap {VILLAGE_GAP}. Ambad total {IMPACT.trials} trials / {IMPACT.adopters} adopters ({IMPACT.rate}).</p>
              <Box tone="soft">
                <Bars height={110} data={VILLAGES.map((item) => ({ label: item.village, values: [item.rate] }))} series={[{ label: 'Trial-to-adoption', color: COLORS.dark }]} format={(value) => `${value.toFixed(1)}%`} />
              </Box>
              <p><b>Unverified causes.</b> A stock-dependent demonstration in Dhanora and a field-confirmation flag in Wadi Gaon were raised earlier. Both remain <Status>Unresolved</Status> until verified; neither is a confirmed cause of the gap.</p>
              <p><b>Evidence gaps.</b> Retailer engagement, follow-up completion (1 of 2 rounds), CRM purchase matching, stock availability and authorized collateral exposure are all pending validation.</p>
              <p><b>What to change next season</b> depends on closing those gaps first; see the actions on the right.</p>
            </div>
          </div>
          <LiveCopilot persona="Crop Nutrition Zonal Manager" screen="pm.ai1" pageContext={PM_FACTS} suggestions={QUESTIONS}
            intro="Ask a follow-up about the portfolio, campaign concepts, business case or interim results. The live model answers from the Zonal Manager figures in this tool." />
        </div>
        <div className="pm-stack">
          <Box title="Context" tone="soft">
            <Facts rows={[['Product', 'Croptek'], ['Crop', 'Onion'], ['Geography', 'Ambad'], ['Campaign', C1.name], ['Activities', `${IMPACT.activities} completed (interim)`], ['Tracked linked sales', <>{IMPACT.linkedSales} <Status>Provisional — not incremental</Status></>]]} />
          </Box>
          <Box title="Recommended Actions" icon={<BarChart3 size={15} />}>
            <ol className="pm-list">
              <li>Validate follow-up and contact evidence in Dhanora.</li>
              <li>Compare retailer participation, stock and execution across villages.</li>
              <li>Review approved collateral exposure before proposing a revised intervention design.</li>
            </ol>
          </Box>
          <Sources items={[{ label: 'PM.10', to: 'pm.10' }, { label: 'PM.11', to: 'pm.11' }, { label: 'TM.IM2' }, { label: 'Collateral versions', to: 'pm.7c' }, { label: 'Forecast assumptions', to: 'pm.8' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.11">← Back to What Worked & Why</Btn><Btn to="pm.10c">View Source Evidence</Btn><Act message="Territory clarification requested">Request Territory Clarification</Act></>}
        right={<Cta to="pm.5">Create Draft Next-Season Campaign Recommendation</Cta>}
      />
    </PmPage>
  );
}




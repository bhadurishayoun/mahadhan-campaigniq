/**
 * Product Manager - Business case, scenarios, reconciliation and submission (PM.8, 8A, 8B, 8C, 8D, 8E, 8F).
 */
import { useState } from 'react';
import { Calculator, GitCompare, RotateCcw, Send, SlidersHorizontal } from 'lucide-react';
import { Btn, COLORS, cx } from '../ui';
import { useNav } from '../nav';
import { Act, Actions, AiBox, Bars, Box, Checklist, Cta, Facts, Field, Input, Modal, Muted, P, PmPage, Radios, Source, Sources, Status, Strip, Table, Workflow } from './kit';
import { C1, C2, INVESTMENT, MARGIN, SCENARIOS, THEME } from './data';

const BASE = SCENARIOS[1];

/* ------------------------------------------------------------------ PM.8 */

export function Pm8() {
  const [scenario, setScenario] = useState(1);
  const current = SCENARIOS[scenario];
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case & Scenarios' }]}
      code="PM.8"
      title="Business Case"
      status="Draft — Not Submitted / Not Approved"
    >
      <Source>Campaign Collateral. Parent theme {THEME.name} · PM-developed {C1.name} · priority Maharashtra Onion.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Business Case · Scenarios" icon={<Calculator size={15} />}>
            <Table
              head={['', ...SCENARIOS.map((item, index) => <span className={cx(index === scenario && 'pm-selected-col')}>{item.name}{index === scenario ? ' · SELECTED' : ''}</span>)]}
              align={['l', 'r', 'r', 'r']}
              rows={[
                [<b>Regional investment (illustrative)</b>, INVESTMENT, INVESTMENT, INVESTMENT],
                [<b>Forecast incremental sales</b>, ...SCENARIOS.map((item) => item.sales)],
                [<b>Contribution at {MARGIN}</b>, ...SCENARIOS.map((item) => item.contribution)],
                [<b>Forecast net ROI</b>, ...SCENARIOS.map((item) => <b>{item.roi}</b>)],
                ['', ...SCENARIOS.map((_, index) => <Btn small variant={index === scenario ? 'primary' : 'outline'} onClick={() => setScenario(index)}>{index === scenario ? 'Selected' : 'Select'}</Btn>)],
              ]}
            />
            <Muted>ROI = (contribution − ₹12 L) ÷ ₹12 L. All figures are PM forecasts; none are actual or approved.</Muted>
          </Box>
          <Box title="Core assumptions (editable)" tone="soft" actions={<Btn small to="pm.8b">View Assumptions & Calculation Logic</Btn>}>
            <div className="pm-form pm-form-2">
              <Field label="Eligible audience"><Input placeholder="Pending CRM validation" /></Field>
              <Field label="Expected reach"><Input placeholder="Pending" /></Field>
              <Field label="Conversion rate (incremental)"><Input placeholder="Benchmark pending" /></Field>
              <Field label="Product volume per buyer"><Input placeholder="Pending" /></Field>
              <Field label="Net realization"><Input placeholder="Pending SKU validation" /></Field>
              <Field label="Contribution margin"><Input value="35% (assumed)" /></Field>
              <Field label="Proposed investment"><Input value={INVESTMENT} /></Field>
              <Field label="Base-case incremental sales"><Input value={`${current.sales} (${current.name})`} key={current.name} /></Field>
            </div>
            <Muted>No validated cohort sizes or claimed true incremental attribution are invented.</Muted>
          </Box>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Business Case Assessment" items={[
            { text: 'Unvalidated 36% illustrative historical pilot trial-to-purchase benchmark.', tone: 'amber' },
            { text: 'Retailer influence / stock evidence pending.', tone: 'amber' },
            { text: 'Financial margin and product realization require confirmation.', tone: 'amber' },
            { text: `Potential audience and benefit overlap with the separate ${C2.name} concept.`, tone: 'red' },
          ]} />
          <Box title="Submission readiness" tone="soft">
            <Checklist items={[
              { label: 'Collateral technical review', status: 'Pending' },
              { label: 'Product / technical claims', status: 'Pending' },
              { label: 'Cohort consent', status: 'Pending' },
              { label: 'Attribution method', status: 'Pending' },
            ]} />
          </Box>
          <p className="pm-callout">The region-wide ₹12 L investment is an envelope to be allocated later to local territory campaigns, not additive to local spend. Expected incremental sales must be reconciled to approved ABP objectives and an incremental baseline, never simply added to ABP.</p>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7">← Back to Campaign Collateral</Btn><Btn to="pm.8b" icon={<SlidersHorizontal size={13} />}>Adjust Assumptions</Btn><Btn to="pm.8c" icon={<GitCompare size={13} />}>Compare Scenarios</Btn><Act message="Draft business case saved">Save Draft Business Case</Act></>}
        right={<><Btn to="pm.8a">Proposal review</Btn><Cta locked="Conditional: enabled once mandatory financial / content checks are resolved or authorized exceptions accepted. Submission is not Marketing approval.">Review & Submit Proposal to Marketing Head</Cta></>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8A */

export function Pm8a() {
  const [selected, setSelected] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Campaign Proposals' }, { label: 'Review & Submit' }]}
      code="PM.8A"
      title="Campaign Proposal Consolidation, Review & Submission to Marketing Head"
      status="Pre-Submission Draft"
    >
      <Source>Business Case after collateral preparation. Owner: Crop Nutrition Product Manager · intended reviewer: Marketing Head.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Campaign Proposal Portfolio">
            <Table
              head={['Campaign', 'Strategic Focus', 'Proposed Investment', 'Forecast Incremental Sales', 'Forecast Contribution', 'Forecast Net ROI', 'Validation Status', '']}
              align={['l', 'l', 'r', 'r', 'r', 'r', 'l', 'l']}
              rows={[
                [<b>A · {C1.name}</b>, 'Retailer education & recommendation', INVESTMENT, BASE.sales, `${BASE.contribution} (35%)`, <b>{BASE.roi}</b>, <Status>Mandatory Checks Pending</Status>, <Btn small onClick={() => setSelected(0)}>Review</Btn>],
                [<b>B · {C2.name}</b>, 'Structured trial / interest nurture', <P>Pending</P>, <P>Pending</P>, <P>Pending</P>, <P>Pending</P>, <Status>Business Case Incomplete</Status>, <Btn small onClick={() => setSelected(1)}>Review</Btn>],
              ]}
              highlight={selected}
              onRow={setSelected}
            />
            <Muted>Investments and forecast benefits are not summed while audience overlap is unresolved.</Muted>
          </Box>
          <Box title="Submission readiness checklist" tone="soft">
            <Checklist items={[
              { label: 'Technical / agronomy claims (incl. draft Croptek collateral Collateral Draft)', status: 'Pending' },
              { label: 'Collateral approval', status: 'Pending' },
              { label: 'Eligible audience / consent', status: 'Pending' },
              { label: 'Financial incrementality & ABP reconciliation', status: 'Pending' },
              { label: 'Proposal A / B audience overlap assessment', status: 'Required' },
            ]} />
          </Box>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Pre-submission Assessment" items={[
            { text: 'Duplicate commercial benefit risk across A and B.', tone: 'red' },
            { text: 'Unverified 36% trial-to-purchase comparator.', tone: 'amber' },
            { text: 'Unresolved retailer / stock evidence.', tone: 'amber' },
            { text: 'Pending source validation.', tone: 'amber' },
          ]} />
          <Box title={`Selected proposal · ${selected === 0 ? 'A' : 'B'}`}>
            <div className="row">
              <Btn small to="pm.6">View Proposition</Btn>
              <Btn small to="pm.7">View Assets</Btn>
              <Btn small to="pm.8">View Business Case</Btn>
              <Btn small to="pm.8d">Compare Proposals</Btn>
            </div>
            <Field label="Review comments"><Input rows={3} placeholder="Comments for submission…" /></Field>
          </Box>
          <Workflow title="Routing" compact steps={[{ label: 'Product Manager Submission', state: 'active' }, { label: 'Comparison' }, { label: 'Business Case Review' }, { label: 'Approval' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8">← Back to Business Case</Btn><Act message="Draft saved">Save Draft</Act><Btn to="pm.6b">Request Technical Validation</Btn></>}
        right={<><Btn to="pm.8f" icon={<RotateCcw size={13} />}>Revise & Resubmit</Btn><Btn to="pm.8e" icon={<Send size={13} />}>Open submission confirmation</Btn><Cta locked="Disabled until mandatory checks are cleared or an authorized conditional submission is recorded">Submit Selected Proposals to Marketing Head</Cta></>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8B */

const ASSUMPTIONS = [
  { parameter: 'Eligible farmers', value: 'Pending validation', method: 'From CRM eligible cohort', source: 'CRM', status: 'Pending' },
  { parameter: 'Incremental first-purchase conversion', value: 'Benchmark pending', method: 'Forecast conversion − valid comparable baseline', source: 'Conversion Barriers: Updated Findings + benchmark', status: 'Pending' },
  { parameter: 'Expected incremental purchasers', value: 'Pending', method: 'Eligible audience × attributable incremental conversion', source: 'Derived', status: 'Pending' },
  { parameter: 'Incremental product volume', value: 'Pending', method: 'Incremental purchasers × forecast quantity per purchaser', source: 'Derived', status: 'Pending' },
  { parameter: 'Net realization per SKU', value: 'Pending', method: 'Authorized price list less schemes', source: 'Product Master / ERP', status: 'Pending' },
  { parameter: 'Incremental sales', value: '₹48 L base-case target', method: 'Incremental volume × net realization', source: 'PM proposal', status: 'Not bottom-up reconciled' },
  { parameter: 'Contribution margin', value: '35% assumed', method: 'Finance standard margin', source: 'Finance', status: 'Pending Finance verification' },
  { parameter: 'Campaign investment', value: INVESTMENT, method: 'PM proposal (regional envelope)', source: 'PM', status: 'Proposed' },
];

export function Pm8b() {
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Calculation Logic' }]}
      code="PM.8B"
      title="Financial Assumptions, Calculation Logic & Source Validation"
      status="Draft / Not Approved"
    >
      <Source><b>View Calculation Logic / Adjust Assumptions</b>. collateral packaging remains a separate, not-yet-released workflow.</Source>
      <Strip items={[
        { label: 'Proposed regional investment', value: INVESTMENT },
        { label: 'Forecast incremental sales', value: BASE.sales },
        { label: `Forecast contribution (${MARGIN})`, value: BASE.contribution },
        { label: 'Forecast net ROI', value: `${BASE.roi} = (₹16.8 L − ₹12 L) ÷ ₹12 L`, tone: 'amber' },
      ]} />
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Financial assumption & formula table" icon={<Calculator size={15} />}>
            <Table
              head={['Parameter', 'Input / Value', 'Calculation method', 'Candidate data source', 'Validation status', '']}
              rows={ASSUMPTIONS.map((item) => [<b>{item.parameter}</b>, item.value, <span className="small">{item.method}</span>, item.source, <Status>{item.status}</Status>, <Act small message={`${item.parameter}: editing enabled (draft)`}>Edit</Act>])}
            />
            <Muted>The regional investment envelope is distinct from subsequent local territory budget allocations (not additive). The hypothetical 36% matched pilot trial-to-purchase is historical observed conversion, not proof of weakness and not incremental conversion.</Muted>
          </Box>
          <Box title="Financial driver bridge" tone="soft">
            <Workflow compact steps={[{ label: 'Audience', sub: 'Pending', state: 'pending' }, { label: 'Incremental Buyers', sub: 'Pending' }, { label: 'Incremental Volume', sub: 'Pending' }, { label: 'Incremental Sales', sub: '₹48 L target (not reconciled)' }]} />
          </Box>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Financial Assumption Review" items={[
            { text: 'Missing historical conversion benchmark.', tone: 'amber' },
            { text: 'Retailer participation and stock evidence pending.', tone: 'amber' },
            { text: 'Price / margin validation outstanding.', tone: 'amber' },
            { text: 'Campaign A / B overlapping audience benefit risk.', tone: 'red' },
            { text: 'ABP incrementality reconciliation required.', tone: 'amber' },
          ]} />
          <Sources items={[{ label: 'Evidence', to: 'pm.5b' }, { label: 'KPI Definitions', to: 'pm.6a' }, { label: 'Scenario', to: 'pm.8' }, { label: 'Product Master / ERP / CRM', note: 'Candidate source validation' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8">← Back to Business Case</Btn><Act message="Draft assumptions saved">Save Draft Assumptions</Act><Act message="Source records opened">View Source Records</Act><Act message="Finance validation requested">Request Finance Validation</Act></>}
        right={<Cta to="pm.8c">Compare Financial Scenarios</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8C */

export function Pm8c() {
  const [sales, setSales] = useState(48);
  const [margin, setMargin] = useState(35);
  const [invest, setInvest] = useState(12);
  const contrib = (sales * margin) / 100;
  const roi = (contrib - invest) / invest;
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Campaign Scenarios' }]}
      code="PM.8C"
      title="Scenarios & Sensitivity"
      status="Draft / Not Approved"
    >
      <Source><b>Compare Financial Scenarios</b>. Selected draft C1 {C1.name}, Maharashtra Onion.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Scenario comparison" icon={<GitCompare size={15} />}>
            <Table
              head={['', 'Conservative', 'Base · SELECTED', 'Optimistic']}
              align={['l', 'r', 'r', 'r']}
              rows={[
                [<b>Incremental sales</b>, ...SCENARIOS.map((item) => item.sales)],
                [<b>Assumed contribution margin</b>, '35%', '35%', '35%'],
                [<b>Forecast contribution</b>, ...SCENARIOS.map((item) => item.contribution)],
                [<b>Regional proposed investment</b>, INVESTMENT, INVESTMENT, INVESTMENT],
                [<b>Forecast net ROI</b>, ...SCENARIOS.map((item) => <b>{item.roi}</b>)],
              ]}
            />
            <Muted>ROI = (contribution − investment) ÷ investment. Illustrative PM forecasts, not actual or validated.</Muted>
          </Box>
          <Box title="Forecast contribution vs proposed investment">
            <Bars
              height={140}
              data={SCENARIOS.map((item) => ({ label: item.name, values: [item.contribL, 12] }))}
              series={[{ label: 'Forecast contribution', color: COLORS.dark }, { label: 'Proposed investment', color: COLORS.yellow }]}
              format={(value) => `₹${value} L`}
            />
          </Box>
        </div>
        <div className="pm-stack">
          <Box title="Sensitivity & driver controls" icon={<SlidersHorizontal size={15} />} tone="soft">
            <Facts rows={[['Eligible farmer audience', <P>Not validated</P>], ['Incremental conversion uplift', <P>Not validated</P>], ['Avg volume per incremental buyer', <P>Not validated</P>], ['Net realization', <P>Not validated</P>]]} />
            <b className="small">Numeric what-if (assumed inputs, not bottom-up)</b>
            <div className="slider-row"><span>Incremental sales</span><input type="range" min={20} max={80} value={sales} onChange={(event) => setSales(Number(event.target.value))} /><b>₹{sales} L</b></div>
            <div className="slider-row"><span>Margin</span><input type="range" min={20} max={50} value={margin} onChange={(event) => setMargin(Number(event.target.value))} /><b>{margin}%</b></div>
            <div className="slider-row"><span>Investment</span><input type="range" min={6} max={24} value={invest} onChange={(event) => setInvest(Number(event.target.value))} /><b>₹{invest} L</b></div>
            <Facts cols={2} rows={[['What-if contribution', `₹${contrib.toFixed(1)} L`], ['What-if net ROI', <b>{roi >= 0 ? '+' : ''}{roi.toFixed(2)}x</b>]]} />
          </Box>
          <AiBox title="AI Scenario Risk" items={[
            { text: 'Missing historical conversion comparator.', tone: 'amber' },
            { text: 'Retailer / stock evidence and Finance margin validation pending.', tone: 'amber' },
            { text: `ABP incrementality and audience overlap with the separate ${C2.name} campaign.`, tone: 'red' },
          ]} />
          <Sources items={[{ label: 'Assumptions', to: 'pm.8b' }, { label: 'Evidence', to: 'pm.5b' }, { label: 'KPI Logic', to: 'pm.6a' }, { label: 'Base Case', to: 'pm.8' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8b">← Back to Assumptions & Calculations</Btn><Btn to="pm.8b">Adjust Assumptions</Btn><Act message="Draft scenario saved">Save Draft Scenario</Act></>}
        right={<Cta to="pm.8d">Reconcile Campaign Benefits & Audience Overlap</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8D */

export function Pm8d() {
  const [decision, setDecision] = useState('Develop Separate Campaigns');
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Audience & Benefit Reconciliation' }]}
      code="PM.8D"
      title="Multi-Campaign Audience Overlap & Financial Benefit Reconciliation"
      status="Not Submitted / Not Approved"
    >
      <Source><b>Reconcile Campaign Benefits & Audience Overlap</b>. Two PM draft campaigns under the {THEME.name} theme.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="C1 vs C2 reconciliation">
            <Table
              head={['', `C1 · ${C1.name}`, `C2 · ${C2.name}`]}
              rows={[
                [<b>Proposed regional investment</b>, INVESTMENT, <Status>Business Case Pending</Status>],
                [<b>Forecast incremental sales</b>, BASE.sales, <Status>Not Available</Status>],
                [<b>Assumed margin / contribution</b>, `35% · ${BASE.contribution}`, <Status>Not Available</Status>],
                [<b>Forecast net ROI</b>, BASE.roi, <Status>Not Available</Status>],
                [<b>Priority audience</b>, C1.audience, C2.audience],
                [<b>First-purchase objective</b>, 'Yes', 'Yes'],
                [<b>Intended interventions</b>, C1.intervention, C2.intervention],
                [<b>Matched farmer IDs</b>, <P>Pending CRM matching</P>, <P>Pending CRM matching</P>],
                [<b>Unique eligible audience</b>, <P>Pending</P>, <P>Pending</P>],
                [<b>Potentially overlapping cohorts</b>, <P>Pending source validation</P>, <P>Pending source validation</P>],
                [<b>Common communication channels</b>, 'Retailer · consent-based digital', 'Field follow-up · consent-based digital'],
                [<b>Shared benefit attribution</b>, <P>Method pending</P>, <P>Method pending</P>],
              ]}
            />
            <Muted>C1 figures remain unvalidated PM forecasts; C1 and C2 are never summed.</Muted>
          </Box>
          <Box title="Audience overlap" tone="soft">
            <div className="pm-venn"><i /><i /><span>Pending Farmer-ID Matching</span></div>
            <div className="pm-venn-labels"><span>C1 Retailer-Led</span><span>C2 Farmer Nurture</span></div>
          </Box>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Reconciliation Checks" items={[
            { text: 'Farmer-ID overlap pending.', tone: 'amber' },
            { text: 'Common purchase attribution method pending.', tone: 'amber' },
            { text: 'C2 business case incomplete.', tone: 'red' },
            { text: 'ABP incrementality and possible shared costs need review.', tone: 'amber' },
          ]} />
          <Box title="Decision">
            <Radios value={decision} onChange={setDecision} options={[
              { label: 'Develop Separate Campaigns', sub: 'Conditional on overlap checks' },
              { label: 'Coordinate Campaign Interventions' },
              { label: 'Request Further Evidence' },
            ]} />
            <Muted>A combined forecast cannot be authorized until overlap and business-case checks pass.</Muted>
          </Box>
          <Sources items={[{ label: 'Concept Comparison', to: 'pm.5c' }, { label: 'Calculation Inputs', to: 'pm.8b' }, { label: 'Scenarios', to: 'pm.8c' }, { label: 'CRM / Farmer Master' }, { label: 'Financial baseline' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8c">← Back to Scenarios & Sensitivity</Btn><Act message="Source cohorts opened (CRM matching pending)">View Source Cohorts</Act><Act message="CRM matching requested">Request CRM Matching</Act><Act message="Reconciliation draft saved">Save Reconciliation Draft</Act></>}
        right={<Cta to="pm.8a">Review Proposals & Submission Readiness</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8E (modal over PM.8A) */

export function Pm8e() {
  return (
    <Modal title="Review & Submit Campaign Proposals" status="Pre-Submission / Not Sent" width="72%" back="pm.8a" subtitle={`${THEME.name} · Maharashtra Onion · submitted by Crop Nutrition Product Manager · reviewer Marketing Head`}
      footer={<>
        <Btn to="pm.8a">Back to Submit Proposal</Btn>
        <Act message="Missing checks listed in validation readiness">View Missing Checks</Act>
        <Act message="Submission draft saved — not sent">Save Submission Draft</Act>
        <Act message="Validation requested">Request Validation</Act>
        <span className="pm-foot-right"><Cta locked="Disabled while mandatory checks are open or no authorized policy exception is recorded">Confirm Submission to Marketing Head</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Select', 'Proposal', 'Investment', 'Forecast incremental sales', 'Contribution', 'Net ROI', 'Status']}
        rows={[
          [<input type="checkbox" checked readOnly />, <b>C1 · {C1.name}</b>, INVESTMENT, BASE.sales, `${BASE.contribution} (35% assumed)`, BASE.roi, <Status>Mandatory Checks Pending — Conditional</Status>],
          [<input type="checkbox" disabled />, <b>C2 · {C2.name}</b>, <Muted>Business Case Incomplete</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Status>Selection Disabled</Status>],
        ]}
      />
      <div className="pm-two-even">
        <Box title="Validation readiness" tone="soft">
          <Checklist items={[
            { label: 'Finance margin / realization check', status: 'Pending' },
            { label: 'Source-based incremental sales / ABP reconciliation', status: 'Pending' },
            { label: 'C1 / C2 audience overlap (CRM validation)', status: 'Pending' },
            { label: 'Approved technical claims & collateral versions', status: 'Pending' },
          ]} />
          <Muted>Submission is blocked until all required checks pass or authorized policy exceptions are explicitly recorded.</Muted>
        </Box>
        <Box title="Submission package" tone="soft">
          <Sources label="" items={[{ label: 'Theme Brief', to: 'pm.4a' }, { label: 'Proposition / Intervention', to: 'pm.6' }, { label: 'Content References', to: 'pm.7' }, { label: 'Financial Assumptions', to: 'pm.8b' }, { label: 'Selected Base Scenario', to: 'pm.8c' }, { label: 'Reconciliation', to: 'pm.8d' }]} />
          <Muted>None of these are approved.</Muted>
        </Box>
      </div>
      <Workflow title="Marketing review routing" compact steps={[{ label: 'Product Manager Draft', state: 'active' }, { label: 'Submitted' }, { label: 'Comparison' }, { label: 'Business Case Review' }, { label: 'Approval / Return for Changes' }]} />
      <Muted>After valid submission. If MH requests changes Revision & Resubmission. Submission is not marketing approval or campaign release.</Muted>
    </Modal>
  );
}

/* ------------------------------------------------------------------ PM.8F */

const RETURNED = [
  { parameter: 'Proposed investment', v1: INVESTMENT, comment: 'Confirm authority if investment changes materially', status: 'Pending PM Update' },
  { parameter: 'Forecast incremental sales', v1: BASE.sales, comment: 'Strengthen incremental sales baseline and attribution method', status: 'Pending PM Update' },
  { parameter: 'Contribution margin', v1: '35% assumed', comment: 'Finance verification', status: 'Pending PM Update' },
  { parameter: 'Forecast contribution', v1: BASE.contribution, comment: '—', status: 'Derived After Inputs' },
  { parameter: 'Net ROI', v1: BASE.roi, comment: '—', status: 'Derived After Inputs' },
  { parameter: 'Retailer participation / stock assumptions', v1: 'Unverified', comment: 'Validate before resubmission', status: 'Pending PM Update' },
  { parameter: 'Cohort overlap with C2', v1: 'Pending CRM matching', comment: 'Reconcile with separate C2 proposal', status: 'Pending PM Update' },
  { parameter: 'Technical claims / authorized collateral', v1: 'v0.3 submitted', comment: 'Confirm approved claim and collateral versions', status: 'Pending PM Update' },
];

export function Pm8f() {
  const [selected, setSelected] = useState(1);
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Returned Proposals' }, { label: 'C1 Revision & Resubmission' }]}
      code="PM.8F"
      title="Marketing Head Returned Proposal — Revision & Resubmission"
      status="Returned for Revision — Not Approved"
    >
      <Source>Hypothetical later state: C1's submission validations were resolved, a valid version was submitted to Proposal & Business Case / Approvals & Rollout, then returned for changes. The earlier blocked state is not shown as submitted. C2 remains a separate draft.</Source>
      <div className="pm-two">
        <Box title="Submitted v1 vs Revised v2">
          <Table
            head={['Parameter', 'Submitted v1', 'Revised v2', 'MH comment (hypothetical)', 'Validation', '']}
            rows={RETURNED.map((item) => [<b>{item.parameter}</b>, item.v1, <Status>{item.status}</Status>, <span className="small">{item.comment}</span>, <Status>Pending</Status>, <Act small message={`${item.parameter}: draft v2 edit enabled`}>Edit</Act>])}
            highlight={selected}
            onRow={setSelected}
          />
          <Muted>Revised figures are never invented; they show Pending PM Update or Derived After Inputs.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="Marketing Head review notes" tone="soft">
            <Facts rows={[['Selected comment', RETURNED[selected].comment], ['Source', 'Proposal & Business Case / Approvals & Rollout'], ['Priority', 'High'], ['Assigned to', 'Crop Nutrition Product Manager']]} />
            <Field label="Response"><Input rows={3} placeholder="Draft response to the comment…" /></Field>
          </Box>
          <Sources items={[{ label: 'Proposition', to: 'pm.6' }, { label: 'Collateral Approval', to: 'pm.7d' }, { label: 'Calculation Logic', to: 'pm.8b' }, { label: 'Scenarios', to: 'pm.8c' }, { label: 'Audience Reconciliation', to: 'pm.8d' }, { label: 'MH review source' }]} />
          <Workflow compact steps={[{ label: 'Original Submitted v1', state: 'done' }, { label: 'MH Returned', state: 'done' }, { label: 'PM Revision v2 Draft', state: 'active' }, { label: 'Mandatory Revalidation' }, { label: 'Resubmitted' }, { label: 'MH Review' }]} />
          <Muted>The PM revises own campaign inputs and requests specialist validation; MH comments and submitted v1 are never edited. Any material investment change can require updated authority approval.</Muted>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.5">← Back to Campaign Planning</Btn><Act message="Original submission v1 opened read-only">View Original Submission</Act><Act message="Revised draft v2 saved">Save Revised Draft</Act><Act message="Validation requested">Request Validation</Act></>}
        right={<Cta locked="Disabled until all required checks pass (policy-authorized exception process is separate)">Resubmit Revised Proposal to Marketing Head</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.OPT1: incoming MH optimization request */

export function PmOpt1() {
  const { go, toast } = useNav();
  const [status, setStatus] = useState('New Request · Not Accepted');
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: 'Incoming Optimization Request' }]}
      code="PM.OPT1"
      title="Campaign Change Requests"
      status={status}
      subtitle="Review a Marketing Head request and develop a controlled revision to the currently approved campaign."
    >
      <Source>Request from Request Campaign Changes · West Region · Retailer-Led Croptek Conversion. The current approved campaign version remains effective until a replacement completes the required approvals and controlled release.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Optimization request from Marketing Head" tone="soft">
            <Facts rows={[
              ['Observed issue', 'Execution progress 72% vs 80% planned'],
              ['Supporting concern', 'Farmer follow-up and retailer activation may need review'],
              ['Evidence status', 'Partial · no causal driver verified'],
              ['Requested review', 'Audience, intervention mix, timing, channel readiness and resource assumptions'],
              ['Requested deliverable', 'Revised campaign proposal and updated business case if materially affected'],
              ['Due date / priority', 'To confirm · High'],
            ]} />
            <AiBox title="Evidence check" items={[{ text: 'The execution gap is observed. Validate owner completion, eligible cohort and contact evidence before treating follow-up as the cause.', tone: 'amber' }]} />
          </Box>
          <Box title="Current approved campaign version">
            <Table head={['Item', 'Current authorized state', 'Revision control']} rows={[
              ['Campaign', 'Retailer-Led Croptek Conversion · West Region', 'Current version stays active'],
              ['Investment envelope', 'Approved version · ₹12 L allocation', 'Revalidate if materially changed'],
              ['Territory availability', 'Previously released recommendations', 'Do not overwrite existing release'],
            ]} />
          </Box>
        </div>
        <div className="pm-stack">
          <Box title="Review assignment">
            <Facts rows={[
              ['Request owner', 'Marketing Head · West Region'],
              ['Responsible PM', 'Crop Nutrition Product Manager'],
              ['Request status', status],
              ['Source links', 'diagnostics request approved playbook'],
            ]} />
            <Field label="PM response / clarification"><Input rows={3} placeholder="Record the evidence needed or the revision approach" /></Field>
          </Box>
          <Box title="Revision controls" tone="soft">
            <Checklist items={[
              { label: 'Accept review assignment', status: status.startsWith('Accepted') || status.startsWith('Revision') ? 'Accepted' : 'Pending' },
              { label: 'Validate source evidence and request scope', status: 'Pending' },
              { label: 'Create a new proposal version', status: status.startsWith('Revision') ? 'Draft in Progress' : 'Not Started' },
              { label: 'Revalidate affected proposition, assets and business case', status: 'Pending' },
            ]} />
            <Muted>Revisions create a new version. The PM may request specialist validation; Marketing Head and Business Head approvals are required where policy or material financial changes demand them.</Muted>
          </Box>
        </div>
      </div>
      <Sources items={[{ label: 'Performance diagnostics' }, { label: 'Optimization request' }, { label: 'Approved playbook' }, { label: 'Proposition', to: 'pm.6' }, { label: 'Business case', to: 'pm.8' }]} />
      <Workflow compact steps={[{ label: 'MH Optimization Request', state: 'done' }, { label: 'PM Assignment Review', state: status.startsWith('New') ? 'active' : 'done' }, { label: 'PM Revised Proposal', state: status.startsWith('Revision') ? 'active' : undefined }, { label: 'Required Reapproval' }, { label: 'Controlled Release' }]} />
      <Actions
        left={<><Act message="Original approved version opened read-only">View Approved Version</Act><Btn to="mh.9d">View MH Request</Btn></>}
        right={<>
          <button type="button" className="pm-btn pm-btn-soft" onClick={() => { setStatus('Clarification Requested'); toast('Clarification request drafted for the Marketing Head.'); }}>Request Clarification</button>
          <button type="button" className="pm-btn" onClick={() => { setStatus('Accepted · Draft in Progress'); toast('Optimization assignment accepted.'); }}>Accept Review Assignment</button>
          <button type="button" className="pm-btn pm-btn-primary" onClick={() => { setStatus('Revision Draft in Progress'); toast('A new proposal draft is ready; the approved version remains active.'); go('pm.8'); }}>Develop Revised Campaign Proposal</button>
        </>}
        note="No campaign, budget, territory release or execution status changes when this request is received."
      />
    </PmPage>
  );
}



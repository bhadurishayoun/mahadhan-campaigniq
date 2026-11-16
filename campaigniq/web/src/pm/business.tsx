/**
 * Product Manager - Business case, scenarios, reconciliation and submission (PM.8, 8A, 8B, 8C, 8D, 8E, 8F).
 */
import { useState } from 'react';
import { Calculator, GitCompare, Send, SlidersHorizontal } from 'lucide-react';
import { Btn, COLORS, cx } from '../ui';
import { Act, Actions, AiBox, Bars, Box, Checklist, Cta, Facts, Field, Input, Modal, Muted, P, PmPage, Radios, Source, Sources, Status, Strip, Table, Workflow } from './kit';
import { C1, C2, INVESTMENT, MARGIN, SCENARIOS, THEME } from './data';

const BASE = SCENARIOS[1];

/* ------------------------------------------------------------------ PM.8 */

export function Pm8() {
  const [scenario, setScenario] = useState(1);
  const current = SCENARIOS[scenario];
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case & Scenarios' }]}
      code="PM.8"
      title="Campaign Business Case & Scenario Simulator"
      status="Draft â€” Not Submitted / Not Approved"
    >
      <Source>PM.7 Campaign Collateral & Content Studio. Parent theme {THEME.name} Â· PM-developed {C1.name} Â· priority Maharashtra Onion.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Campaign Financial Business Case Â· Scenario Simulator" icon={<Calculator size={15} />}>
            <Table
              head={['', ...SCENARIOS.map((item, index) => <span className={cx(index === scenario && 'pm-selected-col')}>{item.name}{index === scenario ? ' Â· SELECTED' : ''}</span>)]}
              align={['l', 'r', 'r', 'r']}
              rows={[
                [<b>Regional investment (illustrative)</b>, INVESTMENT, INVESTMENT, INVESTMENT],
                [<b>Forecast incremental sales</b>, ...SCENARIOS.map((item) => item.sales)],
                [<b>Contribution at {MARGIN}</b>, ...SCENARIOS.map((item) => item.contribution)],
                [<b>Forecast net ROI</b>, ...SCENARIOS.map((item) => <b>{item.roi}</b>)],
                ['', ...SCENARIOS.map((_, index) => <Btn small variant={index === scenario ? 'primary' : 'outline'} onClick={() => setScenario(index)}>{index === scenario ? 'Selected' : 'Select'}</Btn>)],
              ]}
            />
            <Muted>ROI = (contribution âˆ’ â‚¹12 L) Ã· â‚¹12 L. All figures are PM forecasts; none are actual or approved.</Muted>
          </Box>
          <Box title="Core assumptions (editable)" tone="soft" actions={<Btn small to="pm.8b">View Assumptions & Calculation Logic â†’ PM.8B</Btn>}>
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
              { label: 'PM.7 collateral technical review', status: 'Pending' },
              { label: 'Product / technical claims', status: 'Pending' },
              { label: 'Cohort consent', status: 'Pending' },
              { label: 'Attribution method', status: 'Pending' },
            ]} />
          </Box>
          <p className="pm-callout">The region-wide â‚¹12 L investment is an envelope to be allocated later to local territory campaigns, not additive to local spend. Expected incremental sales must be reconciled to approved ABP objectives and an incremental baseline, never simply added to ABP.</p>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7">â† Back to PM.7</Btn><Btn to="pm.8b" icon={<SlidersHorizontal size={13} />}>Adjust Assumptions</Btn><Btn to="pm.8c" icon={<GitCompare size={13} />}>Compare Scenarios</Btn><Act message="Draft business case saved">Save Draft Business Case</Act></>}
        right={<><Btn to="pm.8a">Proposal review â†’ PM.8A</Btn><Cta locked="Conditional: enabled once mandatory financial / content checks are resolved or authorized exceptions accepted. Submission is not Marketing approval.">Review & Submit Proposal to Marketing Head â†’ MH.7</Cta></>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8A */

export function Pm8a() {
  const [selected, setSelected] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Campaign Proposals' }, { label: 'Review & Submit' }]}
      code="PM.8A"
      title="Campaign Proposal Consolidation, Review & Submission to Marketing Head"
      status="Pre-Submission Draft"
    >
      <Source>PM.8 Business Case after PM.7A collateral preparation. Owner: Crop Nutrition Product Manager Â· intended reviewer: Marketing Head.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Campaign Proposal Portfolio">
            <Table
              head={['Campaign', 'Strategic Focus', 'Proposed Investment', 'Forecast Incremental Sales', 'Forecast Contribution', 'Forecast Net ROI', 'Validation Status', '']}
              align={['l', 'l', 'r', 'r', 'r', 'r', 'l', 'l']}
              rows={[
                [<b>A Â· {C1.name}</b>, 'Retailer education & recommendation', INVESTMENT, BASE.sales, `${BASE.contribution} (35%)`, <b>{BASE.roi}</b>, <Status>Mandatory Checks Pending</Status>, <Btn small onClick={() => setSelected(0)}>Review</Btn>],
                [<b>B Â· {C2.name}</b>, 'Structured trial / interest nurture', <P>Pending</P>, <P>Pending</P>, <P>Pending</P>, <P>Pending</P>, <Status>Business Case Incomplete</Status>, <Btn small onClick={() => setSelected(1)}>Review</Btn>],
              ]}
              highlight={selected}
              onRow={setSelected}
            />
            <Muted>Investments and forecast benefits are not summed while audience overlap is unresolved.</Muted>
          </Box>
          <Box title="Submission readiness checklist" tone="soft">
            <Checklist items={[
              { label: 'Technical / agronomy claims (incl. draft Croptek collateral PM.7A)', status: 'Pending' },
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
          <Box title={`Selected proposal Â· ${selected === 0 ? 'A' : 'B'}`}>
            <div className="row">
              <Btn small to="pm.6">View PM.6 Proposition</Btn>
              <Btn small to="pm.7">View PM.7 Assets</Btn>
              <Btn small to="pm.8">View PM.8 Business Case</Btn>
              <Btn small to="pm.8d">Compare Proposals</Btn>
            </div>
            <Field label="Review comments"><Input rows={3} placeholder="Comments for submissionâ€¦" /></Field>
          </Box>
          <Workflow title="Routing" compact steps={[{ label: 'Product Manager Submission', state: 'active' }, { label: 'MH.7 Comparison' }, { label: 'MH.7A Business Case Review' }, { label: 'MH.8 Approval' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8">â† Back to PM.8</Btn><Act message="Draft saved">Save Draft</Act><Btn to="pm.6b">Request Technical Validation</Btn></>}
        right={<><Btn to="pm.8e" icon={<Send size={13} />}>Open submission confirmation â†’ PM.8E</Btn><Cta locked="Disabled until mandatory checks are cleared or an authorized conditional submission is recorded">Submit Selected Proposals to Marketing Head â†’ MH.7</Cta></>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8B */

const ASSUMPTIONS = [
  { parameter: 'Eligible farmers', value: 'Pending validation', method: 'From CRM eligible cohort', source: 'CRM', status: 'Pending' },
  { parameter: 'Incremental first-purchase conversion', value: 'Benchmark pending', method: 'Forecast conversion âˆ’ valid comparable baseline', source: 'MH.4A-I4 + benchmark', status: 'Pending' },
  { parameter: 'Expected incremental purchasers', value: 'Pending', method: 'Eligible audience Ã— attributable incremental conversion', source: 'Derived', status: 'Pending' },
  { parameter: 'Incremental product volume', value: 'Pending', method: 'Incremental purchasers Ã— forecast quantity per purchaser', source: 'Derived', status: 'Pending' },
  { parameter: 'Net realization per SKU', value: 'Pending', method: 'Authorized price list less schemes', source: 'Product Master / ERP', status: 'Pending' },
  { parameter: 'Incremental sales', value: 'â‚¹48 L base-case target', method: 'Incremental volume Ã— net realization', source: 'PM proposal', status: 'Not bottom-up reconciled' },
  { parameter: 'Contribution margin', value: '35% assumed', method: 'Finance standard margin', source: 'Finance', status: 'Pending Finance verification' },
  { parameter: 'Campaign investment', value: INVESTMENT, method: 'PM proposal (regional envelope)', source: 'PM', status: 'Proposed' },
];

export function Pm8b() {
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Calculation Logic' }]}
      code="PM.8B"
      title="Financial Assumptions, Calculation Logic & Source Validation"
      status="Draft / Not Approved"
    >
      <Source>PM.8 â€” <b>View Calculation Logic / Adjust Assumptions</b>. PM.7E collateral packaging remains a separate, not-yet-released workflow.</Source>
      <Strip items={[
        { label: 'Proposed regional investment', value: INVESTMENT },
        { label: 'Forecast incremental sales', value: BASE.sales },
        { label: `Forecast contribution (${MARGIN})`, value: BASE.contribution },
        { label: 'Forecast net ROI', value: `${BASE.roi} = (â‚¹16.8 L âˆ’ â‚¹12 L) Ã· â‚¹12 L`, tone: 'amber' },
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
            <Workflow compact steps={[{ label: 'Audience', sub: 'Pending', state: 'pending' }, { label: 'Incremental Buyers', sub: 'Pending' }, { label: 'Incremental Volume', sub: 'Pending' }, { label: 'Incremental Sales', sub: 'â‚¹48 L target (not reconciled)' }]} />
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
          <Sources items={[{ label: 'PM.5B Evidence', to: 'pm.5b' }, { label: 'PM.6A KPI Definitions', to: 'pm.6a' }, { label: 'PM.8 Scenario', to: 'pm.8' }, { label: 'Product Master / ERP / CRM', note: 'Candidate source validation' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8">â† Back to PM.8</Btn><Act message="Draft assumptions saved">Save Draft Assumptions</Act><Act message="Source records opened">View Source Records</Act><Act message="Finance validation requested">Request Finance Validation</Act></>}
        right={<Cta to="pm.8c">Compare Financial Scenarios â†’ PM.8C</Cta>}
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
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Scenario Simulator' }]}
      code="PM.8C"
      title="Campaign Financial Scenario Comparison & Sensitivity Simulator"
      status="Draft / Not Approved"
    >
      <Source>PM.8B â€” <b>Compare Financial Scenarios</b>. Selected draft C1 {C1.name}, Maharashtra Onion.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Scenario comparison" icon={<GitCompare size={15} />}>
            <Table
              head={['', 'Conservative', 'Base Â· SELECTED', 'Optimistic']}
              align={['l', 'r', 'r', 'r']}
              rows={[
                [<b>Incremental sales</b>, ...SCENARIOS.map((item) => item.sales)],
                [<b>Assumed contribution margin</b>, '35%', '35%', '35%'],
                [<b>Forecast contribution</b>, ...SCENARIOS.map((item) => item.contribution)],
                [<b>Regional proposed investment</b>, INVESTMENT, INVESTMENT, INVESTMENT],
                [<b>Forecast net ROI</b>, ...SCENARIOS.map((item) => <b>{item.roi}</b>)],
              ]}
            />
            <Muted>ROI = (contribution âˆ’ investment) Ã· investment. Illustrative PM forecasts, not actual or validated.</Muted>
          </Box>
          <Box title="Forecast contribution vs proposed investment">
            <Bars
              height={140}
              data={SCENARIOS.map((item) => ({ label: item.name, values: [item.contribL, 12] }))}
              series={[{ label: 'Forecast contribution', color: COLORS.dark }, { label: 'Proposed investment', color: COLORS.yellow }]}
              format={(value) => `â‚¹${value} L`}
            />
          </Box>
        </div>
        <div className="pm-stack">
          <Box title="Sensitivity & driver controls" icon={<SlidersHorizontal size={15} />} tone="soft">
            <Facts rows={[['Eligible farmer audience', <P>Not validated</P>], ['Incremental conversion uplift', <P>Not validated</P>], ['Avg volume per incremental buyer', <P>Not validated</P>], ['Net realization', <P>Not validated</P>]]} />
            <b className="small">Numeric what-if (assumed inputs, not bottom-up)</b>
            <div className="slider-row"><span>Incremental sales</span><input type="range" min={20} max={80} value={sales} onChange={(event) => setSales(Number(event.target.value))} /><b>â‚¹{sales} L</b></div>
            <div className="slider-row"><span>Margin</span><input type="range" min={20} max={50} value={margin} onChange={(event) => setMargin(Number(event.target.value))} /><b>{margin}%</b></div>
            <div className="slider-row"><span>Investment</span><input type="range" min={6} max={24} value={invest} onChange={(event) => setInvest(Number(event.target.value))} /><b>â‚¹{invest} L</b></div>
            <Facts cols={2} rows={[['What-if contribution', `â‚¹${contrib.toFixed(1)} L`], ['What-if net ROI', <b>{roi >= 0 ? '+' : ''}{roi.toFixed(2)}x</b>]]} />
          </Box>
          <AiBox title="AI Scenario Risk" items={[
            { text: 'Missing historical conversion comparator.', tone: 'amber' },
            { text: 'Retailer / stock evidence and Finance margin validation pending.', tone: 'amber' },
            { text: `ABP incrementality and audience overlap with the separate ${C2.name} campaign.`, tone: 'red' },
          ]} />
          <Sources items={[{ label: 'PM.8B Assumptions', to: 'pm.8b' }, { label: 'PM.5B Evidence', to: 'pm.5b' }, { label: 'PM.6A KPI Logic', to: 'pm.6a' }, { label: 'PM.8 Base Case', to: 'pm.8' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8b">â† Back to PM.8B</Btn><Btn to="pm.8b">Adjust Assumptions</Btn><Act message="Draft scenario saved">Save Draft Scenario</Act></>}
        right={<Cta to="pm.8d">Reconcile Campaign Benefits & Audience Overlap â†’ PM.8D</Cta>}
        note="â‚¹12 L regional envelope â‰  future TM local allocations; pilot 36% is not an incremental campaign effect"
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8D */

export function Pm8d() {
  const [decision, setDecision] = useState('Develop Separate Campaigns');
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Business Case', to: 'pm.8' }, { label: 'Audience & Benefit Reconciliation' }]}
      code="PM.8D"
      title="Multi-Campaign Audience Overlap & Financial Benefit Reconciliation"
      status="Not Submitted / Not Approved"
    >
      <Source>PM.8C â€” <b>Reconcile Campaign Benefits & Audience Overlap</b>. Two PM draft campaigns under the {THEME.name} theme.</Source>
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="C1 vs C2 reconciliation">
            <Table
              head={['', `C1 Â· ${C1.name}`, `C2 Â· ${C2.name}`]}
              rows={[
                [<b>Proposed regional investment</b>, INVESTMENT, <Status>Business Case Pending</Status>],
                [<b>Forecast incremental sales</b>, BASE.sales, <Status>Not Available</Status>],
                [<b>Assumed margin / contribution</b>, `35% Â· ${BASE.contribution}`, <Status>Not Available</Status>],
                [<b>Forecast net ROI</b>, BASE.roi, <Status>Not Available</Status>],
                [<b>Priority audience</b>, C1.audience, C2.audience],
                [<b>First-purchase objective</b>, 'Yes', 'Yes'],
                [<b>Intended interventions</b>, C1.intervention, C2.intervention],
                [<b>Matched farmer IDs</b>, <P>Pending CRM matching</P>, <P>Pending CRM matching</P>],
                [<b>Unique eligible audience</b>, <P>Pending</P>, <P>Pending</P>],
                [<b>Potentially overlapping cohorts</b>, <P>Pending source validation</P>, <P>Pending source validation</P>],
                [<b>Common communication channels</b>, 'Retailer Â· consent-based digital', 'Field follow-up Â· consent-based digital'],
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
          <Sources items={[{ label: 'PM.5C Concept Comparison', to: 'pm.5c' }, { label: 'PM.8B Calculation Inputs', to: 'pm.8b' }, { label: 'PM.8C Scenarios', to: 'pm.8c' }, { label: 'CRM / Farmer Master' }, { label: 'Financial baseline' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.8c">â† Back to PM.8C</Btn><Act message="Source cohorts opened (CRM matching pending)">View Source Cohorts</Act><Act message="CRM matching requested">Request CRM Matching</Act><Act message="Reconciliation draft saved">Save Reconciliation Draft</Act></>}
        right={<Cta to="pm.8a">Review Proposals & Submission Readiness â†’ PM.8A</Cta>}
        note="Draft navigation only; PM.8E handles actual submission after mandatory checks clear"
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.8E (modal over PM.8A) */

export function Pm8e() {
  return (
    <Modal title="Review & Submit Campaign Proposals" status="Pre-Submission / Not Sent" width="72%" back="pm.8a" subtitle={`${THEME.name} Â· Maharashtra Onion Â· submitted by Crop Nutrition Product Manager Â· reviewer Marketing Head`}
      footer={<>
        <Btn to="pm.8a">Back to PM.8A</Btn>
        <Act message="Missing checks listed in validation readiness">View Missing Checks</Act>
        <Act message="Submission draft saved â€” not sent">Save Submission Draft</Act>
        <Act message="Validation requested">Request Validation</Act>
        <span className="pm-foot-right"><Cta locked="Disabled while mandatory checks are open or no authorized policy exception is recorded">Confirm Submission to Marketing Head</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Select', 'Proposal', 'Investment', 'Forecast incremental sales', 'Contribution', 'Net ROI', 'Status']}
        rows={[
          [<input type="checkbox" checked readOnly />, <b>C1 Â· {C1.name}</b>, INVESTMENT, BASE.sales, `${BASE.contribution} (35% assumed)`, BASE.roi, <Status>Mandatory Checks Pending â€” Conditional</Status>],
          [<input type="checkbox" disabled />, <b>C2 Â· {C2.name}</b>, <Muted>Business Case Incomplete</Muted>, <Muted>â€”</Muted>, <Muted>â€”</Muted>, <Muted>â€”</Muted>, <Status>Selection Disabled</Status>],
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
          <Sources label="" items={[{ label: 'MH.5 Theme Brief', to: 'pm.4a' }, { label: 'PM.6 Proposition / Intervention', to: 'pm.6' }, { label: 'PM.7 Content References', to: 'pm.7' }, { label: 'PM.8B Financial Assumptions', to: 'pm.8b' }, { label: 'PM.8C Selected Base Scenario', to: 'pm.8c' }, { label: 'PM.8D Reconciliation', to: 'pm.8d' }]} />
          <Muted>None of these are approved.</Muted>
        </Box>
      </div>
      <Workflow title="Marketing review routing" compact steps={[{ label: 'Product Manager Draft', state: 'active' }, { label: 'Submitted' }, { label: 'MH.7 Comparison' }, { label: 'MH.7A Business Case Review' }, { label: 'MH.8 Approval / Return for Changes' }]} />
      <Muted>After valid submission â†’ MH.7. If MH requests changes â†’ PM.8F Revision & Resubmission. Submission is not marketing approval or campaign release.</Muted>
    </Modal>
  );
}

/* ------------------------------------------------------------------ PM.8F */

const RETURNED = [
  { parameter: 'Proposed investment', v1: INVESTMENT, comment: 'Confirm authority if investment changes materially', status: 'Pending PM Update' },
  { parameter: 'Forecast incremental sales', v1: BASE.sales, comment: 'Strengthen incremental sales baseline and attribution method', status: 'Pending PM Update' },
  { parameter: 'Contribution margin', v1: '35% assumed', comment: 'Finance verification', status: 'Pending PM Update' },
  { parameter: 'Forecast contribution', v1: BASE.contribution, comment: 'â€”', status: 'Derived After Inputs' },
  { parameter: 'Net ROI', v1: BASE.roi, comment: 'â€”', status: 'Derived After Inputs' },
  { parameter: 'Retailer participation / stock assumptions', v1: 'Unverified', comment: 'Validate before resubmission', status: 'Pending PM Update' },
  { parameter: 'Cohort overlap with C2', v1: 'Pending CRM matching', comment: 'Reconcile with separate C2 proposal', status: 'Pending PM Update' },
  { parameter: 'Technical claims / authorized collateral', v1: 'v0.3 submitted', comment: 'Confirm approved claim and collateral versions', status: 'Pending PM Update' },
];

export function Pm8f() {
  const [selected, setSelected] = useState(1);
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Studio', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Returned Proposals' }, { label: 'C1 Revision & Resubmission' }]}
      code="PM.8F"
      title="Marketing Head Returned Proposal â€” Revision & Resubmission"
      status="Returned for Revision â€” Not Approved"
    >
      <Source>Hypothetical later state: C1's submission validations were resolved, a valid version was submitted to MH.7A / MH.8, then returned for changes. The earlier blocked PM.8E state is not shown as submitted. C2 remains a separate draft.</Source>
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
            <Facts rows={[['Selected comment', RETURNED[selected].comment], ['Source', 'MH.7A / MH.8'], ['Priority', 'High'], ['Assigned to', 'Crop Nutrition Product Manager']]} />
            <Field label="Response"><Input rows={3} placeholder="Draft response to the commentâ€¦" /></Field>
          </Box>
          <Sources items={[{ label: 'PM.6 Proposition', to: 'pm.6' }, { label: 'PM.7D Collateral Approval', to: 'pm.7d' }, { label: 'PM.8B Calculation Logic', to: 'pm.8b' }, { label: 'PM.8C Scenarios', to: 'pm.8c' }, { label: 'PM.8D Audience Reconciliation', to: 'pm.8d' }, { label: 'MH review source' }]} />
          <Workflow compact steps={[{ label: 'Original Submitted v1', state: 'done' }, { label: 'MH Returned', state: 'done' }, { label: 'PM Revision v2 Draft', state: 'active' }, { label: 'Mandatory Revalidation' }, { label: 'Resubmitted' }, { label: 'MH Review' }]} />
          <Muted>The PM revises own campaign inputs and requests specialist validation; MH comments and submitted v1 are never edited. Any material investment change can require updated authority approval.</Muted>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.5">â† Back to Campaign Studio</Btn><Act message="Original submission v1 opened read-only">View Original Submission</Act><Act message="Revised draft v2 saved">Save Revised Draft</Act><Act message="Validation requested">Request Validation</Act></>}
        right={<Cta locked="Disabled until all required checks pass (policy-authorized exception process is separate)">Resubmit Revised Proposal to Marketing Head</Cta>}
      />
    </PmPage>
  );
}


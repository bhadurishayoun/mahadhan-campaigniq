/**
 * Zonal Manager - Campaign Planning: concepts (PM.5, 5A, 5B, 5C) and proposition / interventions (PM.6, 6A, 6B).
 */
import { useState } from 'react';
import { FlaskConical, GitCompare, Layers, Plus, Sparkles, Workflow as WorkflowIcon } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, cx } from '../ui';
import { Act, Actions, AiBox, Box, Checklist, Cta, Drawer, Facts, Field, Input, Muted, P, PmPage, Radios, Select, Source, Sources, Status, Strip, Table, Workflow } from './kit';
import { C1, C2, CLAIMS, EVIDENCE, JOURNEY, THEME } from './data';

const CONCEPTS = [C1, C2];

/* ------------------------------------------------------------------ PM.5 */

export function Pm5() {
  const [selected, setSelected] = useState<string[]>(['C1']);
  const { toast } = useNav();
  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  return (
    <PmPage
      crumbs={[{ label: 'Assigned Themes', to: 'pm.4' }, { label: THEME.name, to: 'pm.4' }, { label: 'Campaign Planning' }, { label: 'Concept Development' }]}
      code="PM.5"
      title="Campaign Concepts"
      status="Campaign Concepts in Draft"
    >
      <Source>The Marketing Head-assigned <b>{THEME.name}</b> theme has been acknowledged. Hypothetical development state, not an approved programme.</Source>
      <Strip items={[
        { label: 'Parent theme', value: THEME.name, sub: 'West Region · priority Maharashtra Onion' },
        { label: 'Strategic objective', value: 'Improve eligible first-purchase conversion' },
        { label: 'Status', value: <Status>Draft</Status>, sub: 'Not PM-submitted · not MH-approved' },
      ]} />

      <div className="pm-two">
        <div className="pm-stack">
          <div className="pm-two-even">
            {CONCEPTS.map((concept) => {
              const active = selected.includes(concept.id);
              return (
                <div key={concept.id} className={cx('pm-concept', active && 'selected')} onClick={() => toggle(concept.id)}>
                  <div className="pm-concept-head">
                    <h4><span className="pm-concept-id">{concept.id}</span>{concept.name}</h4>
                    <Status>Draft</Status>
                  </div>
                  <Facts rows={[
                    ['Objective', concept.objective],
                    ['Primary audience', concept.audience],
                    ['Customer journey stage', concept.stage],
                    ['Intervention direction', concept.intervention],
                    ['Evidence confidence', <Status>{concept.evidence}</Status>],
                  ]} />
                  <div className="pm-concept-actions" onClick={(event) => event.stopPropagation()}>
                    <Btn small variant={active ? 'primary' : 'outline'} onClick={() => toggle(concept.id)}>{active ? 'Selected' : 'Select'}</Btn>
                    <Btn small to="pm.5a">Edit</Btn>
                    <Btn small to="pm.5b">View Rationale</Btn>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="row">
            <Btn to="pm.5a" icon={<Plus size={13} />}>Add New Concept</Btn>
            <Btn to="pm.5c" icon={<GitCompare size={13} />}>Compare Concepts</Btn>
            <Btn onClick={() => toast('Combine is conditional on audience-overlap checks')}>Combine Concepts</Btn>
          </div>
          <AiBox title="AI Concept Insight" items={[{ text: 'The two interventions may be complementary, but target audiences and commercial benefits may overlap. No established cause or validated campaign effectiveness is claimed.', tone: 'amber' }]} />
        </div>

        <Box title="Concept Development" icon={<Layers size={15} />}>
          <Muted>Selected concepts: {selected.length ? selected.join(', ') : 'none'}</Muted>
          {selected.map((id) => {
            const concept = CONCEPTS.find((item) => item.id === id)!;
            return (
              <div key={id} className="pm-stack" style={{ gap: 6 }}>
                <b className="small">{id} · {concept.name}</b>
                <Field label="Strategic intent"><Input rows={2} value={concept.objective} /></Field>
              </div>
            );
          })}
          <Muted>No detailed proposition, collateral, budgets, scenario ROI or local activities at this stage.</Muted>
        </Box>
      </div>

      <Actions
        left={<><Btn to="pm.4">← Back to Assigned Themes</Btn><Act message="Draft concepts saved">Save Draft Concepts</Act></>}
        right={<Cta to="pm.6">Develop Selected Campaign Proposition</Cta>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.5A (drawer over PM.5) */

export function Pm5a() {
  const [concept, setConcept] = useState(C1);
  return (
    <Drawer title="Build a Concept" status="Draft / Not Submitted" width="50%" back="pm.5" subtitle={`${THEME.name} (acknowledged) · priority Maharashtra Onion · West Region conditional`}
      footer={<>
        <Act message="AI alternative concept drafted " icon={<Sparkles size={13} />}>Generate AI Alternative</Act>
        <Btn to="pm.5b">View Concept Rationale</Btn>
        <Act message="Draft concept saved (not submitted)">Save Draft Concept</Act>
        <Btn to="pm.5">Cancel</Btn>
        <span className="pm-foot-right"><Cta to="pm.5c">Add Concept to Comparison</Cta></span>
      </>}
    >
      <div className="row">
        <span className="small muted">Concept</span>
        {CONCEPTS.map((item) => <button type="button" key={item.id} className={cx('pm-chip', item.id === concept.id && 'active')} onClick={() => setConcept(item)}>{item.id} · {item.name}</button>)}
      </div>
      <div className="pm-form pm-form-2">
        <Field label="Campaign concept name"><Input key={concept.id} value={concept.name} /></Field>
        <Field label="Concept ID"><Input key={concept.id + 'id'} value={concept.id} /></Field>
        <Field label="Intended strategic objective"><Input key={concept.id + 'o'} rows={2} value={concept.objective} /></Field>
        <Field label="Target audience cohort"><Input key={concept.id + 'a'} rows={2} value={concept.audience} /></Field>
        <Field label="Current behaviour → desired behaviour"><Input key={concept.id + 'b'} value={concept.id === 'C1' ? 'Conventional nutrition → first Croptek purchase' : 'Trial / interest → verified first purchase'} /></Field>
        <Field label="Priority crop / product / geography"><Input value="Onion · Croptek · Maharashtra" /></Field>
        <Field label="Journey stage"><Select options={['Consideration → First purchase', 'Trial → First purchase', 'Awareness', 'Repeat']} value={concept.stage} key={concept.id + 's'} /></Field>
        <Field label="Proposed intervention direction"><Input key={concept.id + 'i'} rows={2} value={concept.intervention} /></Field>
        <Field label="Supporting evidence"><Input value={`Penetration ${EVIDENCE.penetration} · Q1–Q4 secondary sales ${EVIDENCE.quarterly.join(' → ')} · pilot ${EVIDENCE.trialToPurchase}`} /></Field>
        <Field label="Open validations"><Input value="Retailer influence · benchmark · audience overlap · stock / channel" /></Field>
      </div>
      <AiBox title="AI Concept Guidance" items={[{ text: `Indicative penetration ${EVIDENCE.penetration}, a positive quarterly secondary-sales trend and a hypothetical ${EVIDENCE.trialToPurchase} trial-to-purchase rate support exploring this concept. None of it claims underperformance or causation; audience overlap and stock / channel validation are unresolved.` }]} />
      <Sources items={[{ label: 'Strategic Brief', to: 'pm.4a' }, { label: 'Investigation' }, { label: 'Evidence Review', to: 'pm.4a' }]} />
      <Muted>Save creates an editable draft only. Not a submission or Marketing approval.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.5B (drawer over PM.5) */

export function Pm5b() {
  return (
    <Drawer title={`AI Concept Rationale — ${C1.name}`} status="Draft / Evidence Conditional" width="50%" back="pm.5" subtitle="Selected C1 · market attractiveness vs intervention suitability kept separate"
      footer={<>
        <Act message="Source analysis opened read-only">View Source Analysis</Act>
        <Btn to="pm.4b">Request Further Evidence / Clarification</Btn>
        <Btn to="pm.5a">Back to Build a Concept</Btn>
        <span className="pm-foot-right"><Cta to="pm.5c">Add to Concept Comparison</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Evidence', 'Value', 'Scope', 'Type']}
        rows={[
          [<b>Market attractiveness</b>, '', '', ''],
          ['Croptek penetration, Maharashtra Onion', EVIDENCE.penetration, 'MH.2', <Status>Indicative</Status>],
          ['Historical secondary sales Q1–Q4', EVIDENCE.quarterly.join(' → '), 'Market Opportunities by Region ', <Status>Observed / Indicative</Status>],
          [<b>Intervention suitability</b>, '', '', ''],
          ['Pilot trial-to-purchase', `${EVIDENCE.trials} trials / ${EVIDENCE.purchases} purchases = ${EVIDENCE.trialToPurchase}`, 'Conversion Barriers: Updated Findings (hypothetical)', <Status>No benchmark</Status>],
          ['Historical comparable benchmark', 'Unavailable', '—', <Status>Required Validation</Status>],
          ['Retailer recommendation influence', 'Unverified', '—', <Status>Unverified Hypothesis</Status>],
          ['Stock / channel readiness', 'Awaiting validation', 'DMS', <Status>Required Validation</Status>],
          ['Cohort eligibility / consent', 'Pending', 'CRM', <Status>Pending</Status>],
        ]}
      />
      <div className="pm-two-even">
        <div className="pm-callout pm-callout-green"><b>Opportunity attractiveness:</b> Indicative High</div>
        <div className="pm-callout"><b>Retailer-led intervention evidence:</b> Conditional / Incomplete</div>
      </div>
      <AiBox title="AI inference" items={[{ text: 'Retailer-led education is a plausible draft concept, not a proven optimal intervention. The alternative Trial-to-Purchase Farmer Nurture concept remains equally plausible.', tone: 'green' }]} />
      <Sources items={[{ label: 'Market Insights' }, { label: 'Farmer Investigation' }, { label: 'AI Recommendations' }, { label: 'Theme Brief', to: 'pm.4a' }, { label: 'Evidence', to: 'pm.4a' }]} />
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.5C */

const COMPARE_ROWS: [string, string, string][] = [
  ['Strategic objective', C1.objective, C2.objective],
  ['Priority audience', C1.audience, C2.audience],
  ['Journey stage', C1.stage, C2.stage],
  ['Intervention direction', C1.intervention, C2.intervention],
  ['Supporting evidence', 'Penetration headroom, sales momentum; retailer influence unverified', `Hypothetical pilot ${EVIDENCE.purchases} / ${EVIDENCE.trials} = ${EVIDENCE.trialToPurchase}; no benchmark`],
  ['Channel readiness', 'Retailer stock / participation unverified', 'CRM matching and contact evidence require validation'],
  ['Technical / agronomy dependencies', 'Claims validation', 'Claims validation'],
  ['Potential audience overlap', 'Both support first purchase — duplicate targeting / attribution risk', 'Both support first purchase — duplicate targeting / attribution risk'],
  ['Next development action', 'Proposition & intervention design', 'Proposition & intervention design'],
];

export function Pm5c() {
  const [decision, setDecision] = useState('Develop as Two Separate Campaigns');
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: 'Campaign Concepts', to: 'pm.5' }, { label: 'Compare & Consolidate' }]}
      code="PM.5C"
      title="Compare Concepts"
      status="PM Draft / Not Submitted / Not Approved"
    >
      <Source><b>Add to Concept Comparison</b>, or <b>Compare Concepts</b>. Theme {THEME.name}, Maharashtra Onion priority.</Source>
      <div className="pm-two">
        <Box title="C1 vs C2" icon={<GitCompare size={15} />}>
          <Table
            head={['', <>C1 · {C1.name}</>, <>C2 · {C2.name}</>]}
            rows={COMPARE_ROWS.map(([label, a, b]) => [<b>{label}</b>, a, b])}
          />
          <Muted>No overlap percentages or financial benefits are invented here; business-case benefit overlap is reconciled later.</Muted>
        </Box>
        <div className="pm-stack">
          <AiBox title="AI Comparison" items={[{ text: 'The concepts may be complementary, but causality, audience separation and readiness are not verified.', tone: 'amber' }]} />
          <Box title="Decision" tone="soft">
            <Radios value={decision} onChange={setDecision} options={[
              { label: 'Develop as Two Separate Campaigns', sub: 'C1 and C2 remain distinct draft campaign records' },
              { label: 'Combine into One Draft Programme', sub: 'Conditional on audience-overlap checks' },
              { label: 'Request Further Evidence / Defer' },
            ]} />
            <Muted>Output: C1 and C2 stay distinct drafts, not automatically approved.</Muted>
          </Box>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.5b">View C1 Evidence</Btn><Btn to="pm.5a">Edit Concepts</Btn><Act message="Comparison saved">Save Comparison</Act></>}
        right={<Cta to="pm.6">Proceed to Proposition Design</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.6 */

export function Pm6() {
  const [concept, setConcept] = useState(C1);
  const [stage, setStage] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Assigned Themes', to: 'pm.4' }, { label: THEME.name, to: 'pm.4' }, { label: 'Campaign Planning', to: 'pm.5' }, { label: concept.name }, { label: 'Proposition & Intervention Design' }]}
      code="PM.6"
      title="Product Proposition"
      status="Draft — Not Approved"
      actions={<div className="row"><span className="small muted">Concept</span>{CONCEPTS.map((item) => <button type="button" key={item.id} className={cx('pm-chip', item.id === concept.id && 'active')} onClick={() => setConcept(item)}>{item.id} · {item.name}</button>)}</div>}
    >
      <Source>Selected draft concept <b>{concept.name}</b> under the {THEME.name} theme. Switching concepts does not merge audiences or business cases.</Source>
      <Strip items={[
        { label: 'Parent theme', value: THEME.name },
        { label: 'Selected campaign', value: concept.name },
        { label: 'Priority', value: 'Maharashtra Onion' },
        { label: 'Status', value: <Status>Draft — Not Approved</Status> },
      ]} />

      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Product Proposition Builder" icon={<FlaskConical size={15} />}>
            <div className="pm-form pm-form-2">
              <Field label="Draft value proposition"><Input rows={2} value="Croptek as a crop-stage-aligned nutrition option for Onion growers, recommended through trusted retailers" /></Field>
              <Field label="Target benefit"><Input rows={2} value="Eligible farmers make an informed first purchase with correct product information" /></Field>
              <Field label="Positioning / differentiation"><Input value="Retailer-recommended, stage-specific nutrition programme" /></Field>
              <Field label="Technical claims approval"><div className="row"><Status>Pending</Status><Btn small to="pm.6b">Validate claims</Btn></div></Field>
            </div>
            <Muted>No verified Croptek nutrient or dosage claims are asserted. Draft claims: {CLAIMS.join(' · ')}.</Muted>
          </Box>

          <Box title="Customer Journey & Intervention Blueprint" icon={<WorkflowIcon size={15} />}>
            <div className="pm-journey">
              {JOURNEY.map((step, index) => (
                <div key={step.stage} className={cx('pm-journey-step', index === stage && 'active')} onClick={() => setStage(index)}>
                  <span className="pm-journey-num">{index + 1}</span>
                  <b>{step.stage}</b>
                  <span>{step.intervention}</span>
                </div>
              ))}
            </div>
            <Box title={`${JOURNEY[stage].stage} — intervention detail`} tone="soft" actions={stage === 0 && <Btn small to="pm.6a">Configure & KPIs</Btn>}>
              <div className="pm-form pm-form-2">
                <Field label="Objective"><Input key={stage} value={stage === 0 ? 'Strengthen retailer product education and eligible first-purchase support' : JOURNEY[stage].intervention} /></Field>
                <Field label="Target participants"><Input key={stage + 'p'} value={stage === 0 ? 'Eligible Croptek retailers (validation pending)' : 'Eligible farmers (eligibility & consent pending)'} /></Field>
                <Field label="Proposed channels"><Input value={stage === 0 ? 'Retailer briefing, product education' : 'Field, consent-based digital'} key={stage + 'c'} /></Field>
                <Field label="Expected action"><Input value={stage === 0 ? 'Accurate communication of approved product information' : 'Farmer progresses to next stage'} key={stage + 'e'} /></Field>
                <Field label="Required collateral"><Input value="Approved retailer detailer" /></Field>
                <Field label="Measurement KPI"><Input value={stage === 0 ? 'Retailers trained ÷ assigned eligible retailers' : 'To be defined'} key={stage + 'k'} /></Field>
              </div>
            </Box>
          </Box>

          <Box title="Configuration" tone="soft">
            <Facts cols={3} rows={[
              ['Audience eligibility & consent', <P />],
              ['Stage-linked activation window', <Status>To be validated with agronomy</Status>],
              ['Channel preferences', 'Retailer education · qualified farmer engagement · consent-based follow-up'],
            ]} />
          </Box>
        </div>

        <div className="pm-stack">
          <AiBox title="AI Proposition Guidance" items={[
            { text: 'Retailer influence evidence unverified.', tone: 'amber' },
            { text: 'Historical conversion benchmark missing.', tone: 'amber' },
            { text: 'Target-cohort overlap with Concept B unresolved.', tone: 'amber' },
            { text: 'Technical / content validation required before any claim is used.', tone: 'red' },
          ]} />
          <Box title="Role ownership" tone="soft">
            <p className="small">The <b>Zonal Manager</b> defines the regional campaign proposition and interventions. The <b>Field Sales Manager</b> later plans specific village activities, owners, dates and local budgets after Marketing approval.</p>
          </Box>
        </div>
      </div>

      <Actions
        left={<><Btn to="pm.5">← Back to Campaign Concepts</Btn><Act message="Draft proposition saved">Save Draft Proposition</Act><Btn to="pm.4a">View Theme Brief</Btn></>}
        right={<Cta to="pm.7">Develop Campaign Collaterals</Cta>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.6A (drawer over PM.6) */

export function Pm6a() {
  return (
    <Drawer title="Retailer Enablement — Intervention Configuration" status="Draft / Not Approved" width="50%" back="pm.6" subtitle={`C1 ${C1.name} · ${THEME.name} · Maharashtra Onion · C2 remains distinct`}
      footer={<>
        <Btn to="pm.5b">View Concept Evidence</Btn>
        <Btn to="pm.7">View Collateral Requirements</Btn>
        <Act message="Draft intervention saved">Save Draft Intervention</Act>
        <Btn to="pm.6">Back to Product Proposition</Btn>
        <span className="pm-foot-right"><Cta to="pm.6b">Validate Product Proposition & Agronomy</Cta></span>
      </>}
    >
      <div className="pm-form pm-form-2">
        <Field label="Strategic objective"><Input value="Strengthen retailer product education and eligible first-purchase support" /></Field>
        <Field label="Intended participants"><Input value="Eligible Croptek retailers (validation pending)" /></Field>
        <Field label="Desired behaviour"><Input value="Accurate communication of approved product information" /></Field>
        <Field label="Intervention types"><Select options={['Retailer briefing', 'Product education', 'Field demonstration support', 'Authorized material distribution']} /></Field>
        <Field label="Proposed channel"><Input value="Retailer-led" /></Field>
        <Field label="Target crop / geography"><Input value="Onion · Maharashtra" /></Field>
        <Field label="Agronomy-aligned activation window"><Input placeholder="Pending agronomy validation" /></Field>
        <Field label="Required resources"><Input value="Approved retailer detailer · product information · retailer eligibility · stock / readiness · consent checks" /></Field>
      </div>
      <Box title="KPI Configuration">
        <Table
          compact
          head={['KPI', 'Defined measure / calculation', 'Candidate source', 'Validation']}
          rows={[
            [<b>Retailer training completion</b>, 'Retailers trained ÷ assigned eligible retailers', 'Field App / CRM', <P />],
            [<b>Qualified farmer interactions</b>, 'Distinct qualified farmer interactions', 'CRM / Field App', <P />],
            [<b>Verified first purchases</b>, 'Purchases with matched farmer-linked records (where available)', 'CRM / DMS', <P />],
            [<b>Attributable incremental impact</b>, 'Requires comparable cohorts and validated sales', 'ERP / CRM + baseline', <Status>Method Pending</Status>],
          ]}
        />
        <Muted>No actual values, successful integrations or causal effects are shown.</Muted>
      </Box>
      <Box title="Evidence readiness" tone="soft">
        <Checklist items={[
          { label: 'Historical benchmark', status: 'Pending' }, { label: 'Retailer influence', status: 'Unverified' }, { label: 'Stock / channel readiness', status: 'Pending' },
          { label: 'Technical claims', status: 'Pending' }, { label: 'Purchase linkage', status: 'Pending' },
        ]} />
      </Box>
      <AiBox title="AI Intervention Guidance" items={[{ text: 'Retailer-led approach is plausible, but retailer influence is not proven; KPI outcome attribution requires validation.', tone: 'amber' }]} />
      <Muted>PM defines the regional intervention and measurement framework; the TM later assigns retailers, dates, local quantities and budgets.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.6B (drawer over PM.6) */

export function Pm6b() {
  const [selected, setSelected] = useState(1);
  return (
    <Drawer title="Product Proposition & Agronomy Validation" status="Draft — Technical Review Pending" width="50%" back="pm.6" subtitle={`C1 ${C1.name} · Maharashtra Onion · ${THEME.name} · not submitted or approved`}
      footer={<>
        <Act message="Product master reference opened (authorized source)">View Product Master Reference</Act>
        <Act message="Claim editing enabled for draft text">Edit Draft Claim</Act>
        <Act message="Draft saved">Save Draft</Act>
        <Act message="Technical review requested from authorized agronomy reviewer">Request Technical Review</Act>
        <Btn to="pm.6a">Back to Activities & KPIs</Btn>
        <span className="pm-foot-right"><Cta to="pm.7">Campaign Collateral</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Draft claim', 'Evidence requirement', 'Crop-stage applicability', 'Authorized reviewer', 'Status']}
        rows={CLAIMS.map((claim) => [<b>{claim}</b>, 'Product Master / technical evidence', <P>Pending</P>, 'Agronomy / Technical Reviewer', <Status>Pending / Unvalidated</Status>])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title={`Selected claim · "${CLAIMS[selected]}"`} tone="soft">
        <div className="pm-form pm-form-2">
          <Field label="Draft claim text"><Input key={selected} value={CLAIMS[selected]} /></Field>
          <Field label="Claim category"><Select options={['Positioning', 'Benefit claim', 'Technical claim']} /></Field>
          <Field label="Target crop"><Input value="Onion" /></Field>
          <Field label="Formulation / SKU reference"><Input placeholder="Pending from authorized product master" /></Field>
          <Field label="Evidence attachment / link"><Input placeholder="Attach substantiation" /></Field>
          <Field label="Intended audience"><Input value="Retailer" /></Field>
          <Field label="Required substantiation"><Input value="Scientific / label substantiation" /></Field>
          <Field label="Reviewer assignment"><Select options={['Assign agronomy reviewer', 'Regional Agronomy Lead', 'Technical Services']} /></Field>
        </div>
      </Box>
      <Box title="Crop-stage suitability (Onion)">
        <Table compact head={['Onion stage', 'Proposed activation', 'Product fit', 'Application-rate validation']}
          rows={[
            ['Transplanting / establishment', 'Retailer enablement window', <P />, <P />],
            ['Vegetative growth', 'Farmer engagement', <P />, <P />],
            ['Bulb initiation', 'Demonstration support', <P />, <P />],
            ['Bulb development', 'Follow-up', <P />, <P />],
          ]} />
        <Muted>No dosage or stage-specific approval is invented. Only designated technical reviewers can change claim validation status.</Muted>
      </Box>
      <Workflow compact steps={[{ label: 'PM Draft Claim', state: 'active' }, { label: 'Agronomy / Technical Review' }, { label: 'Returned or Accepted' }, { label: 'Approved Claim Library' }, { label: 'Collateral Version Review' }]} />
      <AiBox title="AI Technical Validation Guidance" items={[{ text: 'Use authorized product evidence and review current crop-stage applicability. Edits to approved claims require versioned reapproval.', tone: 'green' }]} />
      <Sources items={[{ label: 'Campaign Collateral', to: 'pm.7' }, { label: 'Content Approval', to: 'pm.7d' }]} label="Next" />
    </Drawer>
  );
}



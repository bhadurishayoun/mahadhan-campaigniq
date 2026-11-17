/**
 * Product Manager - Assigned Marketing Themes (PM.4, PM.4A, PM.4B, PM.4C).
 */
import { useState } from 'react';
import { Inbox, ListChecks, MessageSquare } from 'lucide-react';
import { Btn } from '../ui';
import { Act, Actions, AiBox, Box, Checklist, Cta, Drawer, Facts, Field, Input, Modal, Muted, P, PmPage, Select, Source, Sources, Status, Table, Workflow } from './kit';
import { EVIDENCE, PM_ROLE, THEME } from './data';

const DELIVERABLES = [
  'Develop one or more campaign concepts',
  'Validate product proposition, audiences, channel interventions and technical suitability',
  'Create collateral drafts and obtain applicable technical / brand approvals',
  'Prepare forecast investments, scenarios and business cases',
  'Submit proposals to the Marketing Head for review',
];

/* ------------------------------------------------------------------ PM.4 */

export function Pm4() {
  return (
    <PmPage
      crumbs={[{ label: 'Assigned Themes' }, { label: 'Theme Inbox' }, { label: THEME.name }]}
      code="PM.4"
      title="Assigned Marketing Themes & Strategic Brief Review"
    >
      <Source>Later illustrative workflow after Marketing Head MH.5 strategic theme assignment and MH.6 development tracking. Separate from the PM.3 planning review.</Source>

      <Box title="Assigned Marketing Themes" icon={<Inbox size={15} />}>
        <Table
          head={['Theme', 'Priority Crop / Product', 'Regional Scope', 'Assigned By', 'Status', 'Open Brief']}
          rows={[
            [<b>{THEME.name}</b>, 'Croptek · Maharashtra Onion', 'West Region', THEME.assignedBy, <Status>{THEME.status}</Status>, <Btn small to="pm.4a">Open Brief</Btn>],
            [<Muted>Theme placeholder</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Status>No Assignment</Status>, <Muted>—</Muted>],
            [<Muted>Theme placeholder</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Status>No Assignment</Status>, <Muted>—</Muted>],
          ]}
          highlight={0}
        />
      </Box>

      <div className="pm-two">
        <Box title={`Selected theme · ${THEME.name}`} tone="soft">
          <Facts cols={2} rows={[
            ['Strategic objective', THEME.objective],
            ['Strategic scope', 'Maharashtra Onion initially; other West Region markets subject to validation'],
            ['Opportunity rationale', `Indicative penetration headroom (${EVIDENCE.penetration}) and positive historical secondary-sales momentum`],
            ['Matched trial-to-purchase evidence', <>{EVIDENCE.trialToPurchase} ({EVIDENCE.purchases} / {EVIDENCE.trials}) <Status>Illustrative</Status> — not proof of poor conversion without a benchmark</>],
          ]} />
        </Box>
        <Box title="Product Manager deliverables" icon={<ListChecks size={15} />}>
          <ol className="pm-list">
            {DELIVERABLES.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </Box>
      </div>

      <AiBox title="AI Brief Insight" items={[
        { text: 'Unresolved before concept work: historical conversion benchmark, retailer channel influence, product availability and audience eligibility. None of these are confirmed causal findings.', tone: 'amber' },
      ]} />

      <Actions
        left={<><Btn to="pm.4a">View Original MH.5 Theme Brief</Btn><Btn to="pm.4b" icon={<MessageSquare size={13} />}>Request Clarification</Btn><Act message="Notes saved">Save Notes</Act></>}
        right={<Cta to="pm.4c">Acknowledge & Develop Campaign Concepts</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.4A (drawer over PM.4) */

export function Pm4a() {
  return (
    <Drawer title="Strategic Theme Brief & Evidence" status={THEME.status} width="50%" back="pm.4" subtitle={`${THEME.name} · priority Maharashtra Onion · broader West Region eligibility pending`}
      footer={<>
        <Act message="MH.2 / MH.4A-I4 source analysis opened read-only">View Source Analysis</Act>
        <Btn to="pm.4b">Request Theme Clarification</Btn>
        <span className="pm-foot-right"><Cta to="pm.4c">Acknowledge Theme</Cta></span>
      </>}
    >
      <Box title="Strategic Opportunity Evidence">
        <Table
          compact
          head={['Evidence', 'Value', 'Source scope', 'Status']}
          rows={[
            [<b>Croptek product penetration</b>, EVIDENCE.penetration, 'MH.2 Market Intelligence · Maharashtra Onion', <Status>Provisional</Status>],
            [<b>Quarterly Maharashtra secondary sales</b>, EVIDENCE.quarterly.join(' → '), 'MH.2 · illustrative Q1–Q4', <Status>Illustrative</Status>],
            [<b>Farmer investigation trial-to-purchase</b>, `${EVIDENCE.trials} documented trials / ${EVIDENCE.purchases} matched purchases = ${EVIDENCE.trialToPurchase}`, 'MH.4A-I4 Investigation', <Status>No benchmark</Status>],
          ]}
        />
        <Muted>Different source scopes; provisional evidence. 36% is not shown as poor without a comparator.</Muted>
      </Box>
      <Box title="Business-plan linkage" tone="soft">
        <p className="small">Illustrative Ambad Onion growth objective of ₹25 L is already <b>included</b> within the approved all-product Ambad ABP of ₹4.20 Cr. It is not additive to the target and not Croptek-specific committed revenue.</p>
      </Box>
      <Facts cols={2} rows={[
        ['Objective', THEME.objective],
        ['Initial scope', 'Maharashtra Onion'],
        ['Proposed audience', 'Conventional-nutrition / trial-interest farmers, subject to eligibility and consent'],
        ['Unresolved', 'Retailer influence · historical comparator · stock · technical applicability'],
      ]} />
      <Box title="PM deliverables checklist">
        <Checklist items={DELIVERABLES.map((label) => ({ label, status: 'Not Started' }))} />
      </Box>
      <Sources items={[{ label: 'MH.2 Market Intelligence' }, { label: 'MH.4A-I4 Investigation' }, { label: 'MH.4B AI Recommendations' }, { label: 'MH.5 Original Strategic Theme Brief' }]} />
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.4B (drawer over PM.4) */

const TOPICS = [
  { topic: 'Historical benchmark for the hypothetical 36% trial-to-purchase', priority: 'High' },
  { topic: 'Retailer influence / channel availability not yet validated', priority: 'High' },
  { topic: 'Maharashtra vs broader West Region eligibility', priority: 'Medium' },
  { topic: 'Requested PM campaign deliverables or strategic guardrails', priority: 'Medium' },
];

export function Pm4b() {
  const [selected, setSelected] = useState(0);
  return (
    <Drawer title="Strategic Theme Clarification Request" status="Draft — Not Sent" width="50%" back="pm.4" subtitle={`${THEME.name} · priority Maharashtra Onion · recipient: Marketing Head`}
      footer={<>
        <Btn to="pm.4a">View Original MH.5 Theme Brief</Btn>
        <Act message="Clarification saved as draft — not sent">Save Draft</Act>
        <Btn to="pm.4a">Back to PM.4A</Btn>
        <span className="pm-foot-right"><Cta message="Clarification request saved — sending requires confirmation (not sent)">Send Clarification Request to Marketing Head</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Clarification topic', 'Priority', 'Linked evidence', '']}
        rows={TOPICS.map((item, index) => [<b>{item.topic}</b>, <Status tone={item.priority === 'High' ? 'amber' : 'grey'}>{item.priority}</Status>, <Muted>MH.2 · MH.4A-I4</Muted>, <input type="radio" checked={selected === index} onChange={() => setSelected(index)} />])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title="Question" tone="soft">
        <Field label="Clarification question"><Input rows={3} value={`Regarding "${TOPICS[selected].topic}": please share the comparator or guidance available.`} /></Field>
        <div className="pm-form pm-form-2">
          <Field label="Priority"><Select options={['High', 'Medium', 'Low']} value={TOPICS[selected].priority} /></Field>
          <Field label="Recipient"><Select options={['Marketing Head']} /></Field>
          <Field label="Response due date" hint="Optional · no commitment implied"><Input placeholder="Select date" /></Field>
          <Field label="Notes / attachments"><Input placeholder="Add note or attach" /></Field>
        </div>
      </Box>
      <Box title="Communication history"><Muted>No clarification submitted yet.</Muted></Box>
      <Workflow compact steps={[{ label: 'Draft', state: 'active' }, { label: 'Sent to Marketing Head' }, { label: 'Response Received' }, { label: 'PM Reviewed' }, { label: 'Closed' }]} />
      <AiBox title="AI Clarification Suggestion" items={[{ text: 'Measurable conversion (36% of documented trials) is not the same as proven weak conversion. Request a valid historical comparator before treating it as a problem.', tone: 'green' }]} />
      <Muted>The original strategic brief remains unchanged unless a Marketing Head-authorized revision is issued.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.4C (modal over PM.4) */

export function Pm4c() {
  return (
    <Modal title="Acknowledge Strategic Theme & Commit to Campaign Development" status="Acknowledgement Pending" back="pm.4" subtitle={`${THEME.name} · Maharashtra Onion · ${PM_ROLE} assigned`}
      footer={<>
        <Btn to="pm.4a">View Original Theme Brief</Btn>
        <Act message="Development dependencies recorded">Record Development Dependencies</Act>
        <Act message="Draft commitment saved — acknowledgement not yet confirmed">Save Draft Commitment</Act>
        <Btn to="pm.4">Back to PM.4</Btn>
        <span className="pm-foot-right"><Cta to="pm.5" message="Theme acknowledged — campaign development started (MH.6 tracker will update)">Acknowledge & Start Campaign Development</Cta></span>
      </>}
    >
      <Facts cols={3} rows={[
        ['Marketing Head objective', THEME.objective],
        ['Source', 'MH.5 strategic brief'],
        ['Strategy scope', 'Maharashtra Onion · West Region pending'],
      ]} />
      <p className="pm-callout">Development dependencies flagged, not proven causes: market benchmark, retailer influence, stock and technical applicability.</p>
      <Box title="Deliverables checklist">
        <Checklist items={DELIVERABLES.map((label, index) => ({ label: `${index + 1}. ${label}`, status: 'Committed on Acknowledgement' }))} />
      </Box>
      <div className="pm-form pm-form-2">
        <Field label="Target completion date"><Input placeholder="Select proposed date" /></Field>
        <Field label="Responsible owner"><Input value={PM_ROLE} /></Field>
        <Field label="Reviewer"><Input value="Marketing Head" /></Field>
        <Field label="Clarification status"><Select options={['Open (PM.4B draft not sent)', 'Reviewed']} /></Field>
      </div>
      <Workflow compact steps={[{ label: 'MH Theme Assigned', state: 'done' }, { label: 'PM Acknowledgement', state: 'active' }, { label: 'Campaign Concepts PM.5' }, { label: 'Proposition / Collaterals / Business Case PM.6–PM.8' }, { label: 'MH Proposal Review MH.7' }]} />
      <Muted>Acknowledgement is <b>not</b> campaign proposal submission or marketing approval. <P>Not yet confirmed</P></Muted>
    </Modal>
  );
}



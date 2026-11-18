/**
 * Zonal Manager - Activity Approvals (PM.9B inbox, PM.9 review, PM.9A / 9C / 9D drawers, PM.9E modal).
 */
import { useState } from 'react';
import { AlertTriangle, ClipboardList, Inbox, MessageSquare } from 'lucide-react';
import { Btn } from '../ui';
import { Act, Actions, AiBox, Box, Checklist, Chips, Cta, Drawer, Facts, Field, Input, Modal, Muted, P, PmPage, Select, Source, Sources, Status, Strip, Table, Workflow } from './kit';
import { ACTIVITIES, ACTIVITY_TOTAL, C1, INVESTMENT, LOCAL_PLAN, THEME } from './data';

const APPROVED_CAMPAIGN = `${C1.name} (approved, released)`;

/* ------------------------------------------------------------------ PM.9B */

export function Pm9b() {
  const [filter, setFilter] = useState('All');
  return (
    <PmPage
      crumbs={[{ label: 'Activity Approvals' }, { label: 'Territory Campaign Submissions' }, { label: 'Approval Inbox' }]}
      code="PM.9B"
      title="Territory Campaign Activity Plan Approvals & Submission Tracking"
    >
      <Source>Separate later hypothetical state: the PM campaign was approved by Marketing Head, released, and at least one Field Sales Manager submitted a local plan. Publication does not automatically authorize execution.</Source>
      <Chips items={['All', 'Pending PM Review', 'Returned to TM', 'Approved', 'Awaiting Submission']} active={filter} onSelect={setFilter} />
      <div className="pm-two">
        <Box title="Territory Campaign Approval Queue" icon={<Inbox size={15} />}>
          <Table
            head={['Territory / TM', 'Approved Parent PM Campaign', 'Local Activity Plan', 'Planned Units', 'Proposed Local Budget', 'Validation / Exception', 'Submission State', '']}
            align={['l', 'l', 'l', 'r', 'r', 'l', 'l', 'l']}
            rows={[
              [<><b>Ambad, Jalna</b><br /><Muted>TM · Jalna Cluster</Muted></>, C1.name, LOCAL_PLAN.name, LOCAL_PLAN.units, LOCAL_PLAN.budget, <Status>Checks Pending</Status>, <Status>Submitted — PM Review Pending</Status>, <Btn small to="pm.9">Review Plan</Btn>],
              [<><b>Jalna HQ</b><br /><Muted>TM · Jalna Cluster</Muted></>, C1.name, <Muted>Awaiting submission</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Status>Awaiting Submission</Status>, <Muted>—</Muted>],
              [<><b>Paithan, Aurangabad</b><br /><Muted>TM · Aurangabad</Muted></>, <Muted>Awaiting approved plan</Muted>, <Muted>Data pending</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Muted>—</Muted>, <Status>Awaiting Approved Plan</Status>, <Muted>—</Muted>],
            ]}
            highlight={0}
          />
        </Box>
        <div className="pm-stack">
          <Box title="Selected submission · Ambad" tone="soft">
            <Facts rows={ACTIVITIES.map((item) => [item.activity, item.units] as [string, string])} />
            <Facts cols={2} rows={[['Total activities', '13'], ['Local budget', <>₹3 L <Muted>Within approved regional {INVESTMENT} envelope (not additive)</Muted></>]]} />
          </Box>
          <Box title="Readiness checks">
            <Checklist items={[
              { label: 'Owner confirmation', status: 'Pending' }, { label: 'Crop-stage / agronomy', status: 'Pending' }, { label: 'Collateral authorization', status: 'Verify' },
              { label: 'Stock feasibility', status: 'Verify' }, { label: 'Eligible audience / consent', status: 'Pending' }, { label: 'Allocation remaining in envelope', status: 'Verify' },
            ]} />
          </Box>
          <Sources items={[{ label: 'PM-approved playbook' }, { label: 'Submitted local plan' }, { label: 'Plan review', to: 'pm.9' }]} />
        </div>
      </div>
      <Actions
        left={<><Act message="Approved PM campaign playbook opened read-only">View Approved PM Campaign</Act><Act message="Field Sales Manager tracking opened">Track Field Sales Manager</Act><Btn to="pm.9c" icon={<MessageSquare size={13} />}>Request Clarification</Btn><Btn to="pm.5">Back to Campaign Planning</Btn></>}
        right={<Cta to="pm.9">Review Selected Territory Activity Plan</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.9 */

export function Pm9() {
  const [selected, setSelected] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Activity Approvals', to: 'pm.9b' }, { label: 'Pending Territory Plans', to: 'pm.9b' }, { label: LOCAL_PLAN.name }]}
      code="PM.9"
      title="Territory Campaign Activity Plan Review & Approval"
      status={LOCAL_PLAN.status}
    >
      <Source>Later hypothetical workflow after validations, Marketing Head approval (related screens), release and TM submission via related screens. pending checks are not implicitly completed.</Source>
      <Strip items={[
        { label: 'Parent approved campaign', value: C1.name, sub: `${THEME.name} · Maharashtra Onion` },
        { label: 'Selected local TM plan', value: LOCAL_PLAN.name, sub: `${LOCAL_PLAN.villages} · ${LOCAL_PLAN.retailers}` },
        { label: 'Planned units · local budget', value: `${LOCAL_PLAN.units} · ${LOCAL_PLAN.budget}`, sub: `Within regional ${INVESTMENT} envelope (remaining allocation to verify)` },
        { label: 'Status', value: <Status>Submitted — Not Yet Approved</Status>, tone: 'amber' },
      ]} />
      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Territory Activity Plan Review" icon={<ClipboardList size={15} />}>
            <Table
              head={['Activity', 'Planned Units', 'Territory / Village', 'Planned Timing', 'Owner / Readiness', 'Draft Budget', '']}
              align={['l', 'l', 'l', 'l', 'l', 'r', 'l']}
              rows={ACTIVITIES.map((item, index) => [
                <b>{item.activity}</b>, item.units, item.village, <Status>To Confirm</Status>, <Status>{index === 0 ? 'Owner proposed — confirmation pending' : 'Pending'}</Status>, item.budget,
                <Btn small to={index === 0 ? 'pm.9a' : 'pm.9'} onClick={() => setSelected(index)}>Review</Btn>,
              ])}
              total={['Total', `${ACTIVITY_TOTAL.units} units`, '', '', '', ACTIVITY_TOTAL.budget, '']}
              highlight={selected}
              onRow={setSelected}
            />
            <Muted>Dates and owners requiring verification show Pending / To Confirm; no confirmed scheduling is invented.</Muted>
          </Box>
          <Box title="Campaign Alignment & Compliance" tone="soft">
            <Checklist items={[
              { label: 'Approved product / crop / geography scope', status: 'Aligned' },
              { label: 'Local ₹3 L within approved regional ₹12 L envelope', status: 'Remaining allocation verification pending' },
              { label: 'Crop-stage / agronomy validation', status: 'Pending' },
              { label: 'Approved collateral version check', status: 'Pending' },
              { label: 'Stock readiness', status: 'Not Verified' },
              { label: 'Participant eligibility & communication consent', status: 'Pending' },
            ]} />
          </Box>
        </div>
        <div className="pm-stack">
          <AiBox title="AI Plan Review Insight" items={[{ text: 'Owner / readiness gaps on most activities; budget alignment to the regional envelope needs the remaining-allocation check. No activity is approved or executed.', tone: 'amber' }]} />
          <Box title="Approval">
            <Field label="Review comments"><Input rows={3} placeholder="Comments for the Field Sales Manager…" /></Field>
            <div className="pm-stack" style={{ gap: 6 }}>
              <Act message="Approved PM campaign playbook opened read-only">View Approved PM Campaign Playbook</Act>
              <Act message="Submitted TM plan opened read-only">View Submitted TM Plan</Act>
              <Btn to="pm.9c" icon={<MessageSquare size={13} />}>Request Changes</Btn>
              <Btn to="pm.9d" icon={<AlertTriangle size={13} />}>Escalate Exception</Btn>
              <Act message="Review saved — plan not approved">Save Review</Act>
              <Btn to="pm.9e">Review Consolidated Plan for Approval</Btn>
              <Cta locked="Disabled until mandatory requirements are cleared (exception escalation available for out-of-scope or investment deviations)">Approve Local Activity Plan</Cta>
            </div>
            <Muted>An approved activity plan does not equal campaign launch; launch readiness is controlled separately.</Muted>
          </Box>
        </div>
      </div>
      <Actions left={<Btn to="pm.9b">← Back to Pending Activity Plans</Btn>} right={<Cta to="pm.10">Campaign & Crop-wise Impact</Cta>} />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.9A (drawer over PM.9) */

export function Pm9a() {
  return (
    <Drawer title="Field Demonstrations — Activity Detail" status="PM Review Pending" back="pm.9" subtitle={`Linked approved campaign ${C1.name} · Onion / Croptek · Dhanora & Wadi Gaon`}
      footer={<>
        <Btn to="pm.9c">Request Changes to Field Sales Manager</Btn>
        <Btn to="pm.9d">Flag Exception</Btn>
        <Act message="Review saved — activity not accepted">Save Review</Act>
        <span className="pm-foot-right"><Cta locked="Disabled until mandatory checks resolve or authorized exceptions are recorded">Accept Activity</Cta></span>
      </>}
    >
      <Facts cols={3} rows={[
        ['Planned', '4 demonstrations'], ['Split', 'Dhanora 2 · Wadi Gaon 2'], ['Proposed local allocation', <>₹1.05 L <Muted>Within ₹3 L local plan and ₹12 L regional envelope</Muted></>],
        ['Planned dates', <Status>To Confirm</Status>], ['Assigned owner', <>R. Jadhav (proposed) <Status>Confirmation Pending</Status></>], ['Double counting', 'None — one allocation'],
      ]} />
      <Box title="Validation checklist">
        <Checklist items={[
          { label: 'Product / Crop / Region scope', status: 'Aligned' },
          { label: 'Crop-stage / agronomy timing', status: 'Pending' },
          { label: 'Activity owner confirmation', status: 'Pending' },
          { label: 'Stock availability', status: 'Not Verified' },
          { label: 'Venue and mobilization', status: 'To Verify' },
          { label: 'Collateral technical approval / correct version', status: 'Pending' },
          { label: 'Budget allocation review', status: 'Pending' },
        ]} />
      </Box>
      <AiBox title="AI Activity Review Insight" items={[{ text: 'Check timing, stock, approved content version and owner confirmation before accepting. Nothing is approved or executed yet.', tone: 'amber' }]} />
      <Sources items={[{ label: 'View Source Activity Plan' }, { label: 'View PM Approved Campaign Playbook' }]} />
      <Field label="PM review comments"><Input rows={3} placeholder="Comments…" /></Field>
      <Muted>The PM reviews source information and does not edit TM dates, targets or owners. Activity approval does not mean launched.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.9C (drawer over PM.9) */

const CORRECTIONS = [
  { activity: 'Field Demonstrations (4 planned)', exception: 'Crop-stage / agronomy timing Pending · stock Not Verified', change: 'Confirm agronomy window and distributor stock', status: 'Pending' },
  { activity: 'Retailer Activation (3 planned)', exception: 'Owner confirmation Pending', change: 'Confirm activity owner', status: 'Pending' },
  { activity: 'All activities', exception: 'Approved collateral version verification', change: 'Reference authorized asset versions', status: 'Pending' },
  { activity: 'Local budget ₹3 L', exception: 'Allocation vs available regional envelope balance', change: 'Confirm remaining envelope', status: 'Pending' },
  { activity: 'Farmer meetings & advisory', exception: 'Eligible audience / consent checks', change: 'Attach consent evidence', status: 'Pending' },
];

export function Pm9c() {
  const [selected, setSelected] = useState(0);
  return (
    <Drawer title="Territory Request Corrections" status="Draft / Not Sent" width="50%" back="pm.9" subtitle={`${LOCAL_PLAN.name} · Maharashtra Onion · parent ${APPROVED_CAMPAIGN} · 13 units · ₹3.00 L local (within ₹12 L envelope, not additive)`}
      footer={<>
        <Act message="Original TM plan v1 opened read-only">View Original TM Plan</Act>
        <Act message="Draft request saved — not sent">Save Draft Request</Act>
        <Btn to="pm.9">Back to Review Activity Plan</Btn>
        <span className="pm-foot-right"><Cta message="Correction request drafted — send requires confirmation (not sent)">Send Correction Request to Field Sales Manager</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Activity', 'Flagged exception', 'Required change', 'Status', '']}
        rows={CORRECTIONS.map((item, index) => [<b>{item.activity}</b>, <span className="small">{item.exception}</span>, <span className="small">{item.change}</span>, <Status>{item.status}</Status>, <input type="radio" checked={selected === index} onChange={() => setSelected(index)} />])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title="Selected issue · Field Demonstration Timing & Stock" tone="soft">
        <Facts cols={2} rows={[['Villages', 'Dhanora / Wadi Gaon'], ['Proposed owner', 'Field Sales Manager / field owner to confirm'], ['Planned date', <Status>To Confirm</Status>], ['Requested evidence', 'Crop-stage agronomy window · distributor / product stock confirmation · authorized demo collateral']]} />
        <div className="pm-form pm-form-2">
          <Field label="Required correction description"><Input rows={2} value="Confirm agronomy activation window and distributor stock for 4 demonstrations before PM endorsement." /></Field>
          <Field label="Assignee"><Select options={['Field Sales Manager — Jalna Cluster']} /></Field>
          <Field label="Due date" hint="No committed date"><Input placeholder="Select date" /></Field>
          <Field label="Priority"><Select options={['High', 'Medium', 'Low']} /></Field>
        </div>
        <Sources items={[{ label: 'Local plan' }, { label: 'Approved PM campaign playbook' }, { label: 'Activity review', to: 'pm.9a' }]} />
      </Box>
      <Workflow compact steps={[{ label: 'Draft', state: 'active' }, { label: 'Sent to TM' }, { label: 'Revised Plan Submitted' }, { label: 'PM Revalidation' }, { label: 'Resolved' }]} />
      <Facts cols={2} rows={[['Version control', 'Original TM submission v1'], ['Revised v2', <P>Pending (comparison after resubmission)</P>]]} />
      <AiBox title="AI Review Prompt" items={[{ text: 'Confirm timing, stock, owner and approved material before plan endorsement.', tone: 'green' }]} />
      <Muted>PM reviews and requests changes; the TM owns local plan edits. After validated resubmission: Consolidated Approval, then separately controlled execution authorization.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.9D (drawer over PM.9) */

const EXCEPTIONS = [
  { category: 'Local allocation availability', activity: 'Whole local plan ₹3.00 L', deviation: 'Remaining regional allocation not yet verified', authority: 'Finance / Marketing Head (policy-dependent)', status: 'Pending Determination' },
  { category: 'Field demonstration crop-stage deviation', activity: 'Field Demonstrations', deviation: 'Only if proposed timing is outside the validated agronomic window', authority: 'Agronomy review', status: 'Review Required' },
  { category: 'Stock and activity owner missing', activity: 'Field Demonstrations · Retailer Activation', deviation: 'Ordinary TM correction — not an authorization exception', authority: 'Field Sales Manager (correction)', status: 'Correction' },
];

export function Pm9d() {
  const [selected, setSelected] = useState(0);
  const row = EXCEPTIONS[selected];
  return (
    <Drawer title="Campaign Exceptions to Approve" status="Exception Draft / Not Escalated" width="50%" back="pm.9" subtitle={`Maharashtra Onion / Croptek · 13 local units · ₹3.00 L within approved ₹12.00 L regional envelope · remaining allocation not yet verified`}
      footer={<>
        <Btn to="pm.9">Back to Review Activity Plan</Btn>
        <Act message="Policy & authority matrix opened">View Policy & Authority</Act>
        <Btn to="pm.9c">Request TM Clarification</Btn>
        <Act message="Exception draft saved — not escalated">Save Exception Draft</Act>
        <span className="pm-foot-right"><Cta message="Escalation drafted — requires confirmation (not escalated)">Escalate Exception for Authorization</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Exception category', 'Selected activity', 'Potential deviation', 'Required authority', 'Status', '']}
        rows={EXCEPTIONS.map((item, index) => [<b>{item.category}</b>, item.activity, <span className="small">{item.deviation}</span>, <span className="small">{item.authority}</span>, <Status>{item.status}</Status>, <Btn small onClick={() => setSelected(index)}>Review</Btn>])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title={`Selected exception · ${row.category}`} tone="soft">
        <div className="pm-form pm-form-2">
          <Field label="Issue type"><Input value={row.category} key={selected} /></Field>
          <Field label="Submitted vs authorized reference"><Input value="v1 vs approved playbook" /></Field>
          <Field label="Scope of proposed variation"><Input value={row.deviation} key={`d${selected}`} /></Field>
          <Field label="Justification from TM"><Input placeholder="Pending" /></Field>
          <Field label="Supporting evidence"><Input placeholder="Attach" /></Field>
          <Field label="Expected operational impact & mitigation"><Input placeholder="To be described" /></Field>
        </div>
        <Muted>No confirmed budget overrun, policy breach, approved exception or final approver is fabricated.</Muted>
      </Box>
      <Workflow title="Approval routing (dynamic by exception)" compact steps={[{ label: 'PM technical / commercial review', state: 'active' }, { label: 'Authorized Agronomy / Marketing Head / Business Head decision' }]} />
      <Workflow compact steps={[{ label: 'Exception Draft', state: 'active' }, { label: 'Submitted for Authorization' }, { label: 'Reviewer Assessment' }, { label: 'Approved or Returned / Rejected' }, { label: 'PM Revalidation' }]} />
      <Sources items={[{ label: 'Approved PM Campaign Playbook' }, { label: 'Submitted local plan', to: 'pm.9' }, { label: 'Activity detail', to: 'pm.9a' }, { label: 'Correction request', to: 'pm.9c' }]} />
      <p className="pm-callout">A correction is not an exception, and exception authorization is not local campaign plan approval or launch. Proceed to only after mandatory checks and applicable exception decisions.</p>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.9E (modal over PM.9) */

export function Pm9e() {
  return (
    <Modal title="Consolidated Territory Campaign Plan Approval" status="PM Approval Pending" width="75%" back="pm.9" subtitle={`Ambad, Jalna · Maharashtra Onion · parent approved ${C1.name} · local plan submitted by Field Sales Manager`}
      footer={<>
        <Btn to="pm.9">Back to Review Activity Plan</Btn>
        <Btn to="pm.9d">View Activity Exceptions</Btn>
        <Act message="Approval review saved — plan not approved">Save Approval Review</Act>
        <Btn to="pm.9c">Request Further Changes</Btn>
        <span className="pm-foot-right"><Cta locked="Disabled until mandatory checks pass or valid authorized exceptions are recorded">Approve Consolidated Local Campaign Plan</Cta></span>
      </>}
    >
      <p className="pm-note">Future illustrative pre-approval checkpoint after approved the parent campaign and published the recommendation. Local approval and launch have <b>not</b> occurred. Local budget ₹3.00 L is allocated <b>within</b> the regional ₹12.00 L envelope, never added to it.</p>
      <div className="pm-two">
        <Table
          compact
          head={['Activity', 'Units', 'Budget', '']}
          align={['l', 'l', 'r', 'l']}
          rows={ACTIVITIES.map((item) => [<b>{item.activity}</b>, item.units, item.budget, <Btn small to="pm.9a">Review</Btn>])}
          total={['Total', `${ACTIVITY_TOTAL.units} units`, ACTIVITY_TOTAL.budget, '']}
        />
        <Box title="Final Approval Readiness" tone="soft">
          <Checklist items={[
            { label: 'Authorized crop / product / geography scope', status: 'Validated', note: 'Source: playbook' },
            { label: 'Agronomy & crop-stage suitability', status: 'Outstanding' },
            { label: 'Confirmed activity ownership', status: 'Outstanding' },
            { label: 'Stock feasibility', status: 'Unverified' },
            { label: 'Latest authorized collateral versions & consent', status: 'Outstanding' },
            { label: 'Local ₹3 L within remaining regional ₹12 L envelope', status: 'Unverified' },
            { label: 'Closure of corrections & exceptions', status: 'Outstanding' },
          ]} />
        </Box>
      </div>
      <Sources items={[{ label: 'Approved Playbook' }, { label: 'Source Plan' }, { label: 'Detailed Activity Review', to: 'pm.9a' }, { label: 'Corrections', to: 'pm.9c' }, { label: 'Exception Decisions', to: 'pm.9d' }]} />
      <Workflow compact steps={[{ label: 'TM Plan Submitted', state: 'done' }, { label: 'PM Consolidated Review', state: 'active' }, { label: 'PM Local Plan Approval' }, { label: 'TM Launch Readiness' }, { label: 'Execution' }]} />
      <Field label="PM review comments"><Input rows={2} placeholder="Comments…" /></Field>
      <Muted>An approval records the exact local plan version and approved budget allocation but does not start the campaign; the TM still needs separately governed launch readiness / authorization.</Muted>
    </Modal>
  );
}


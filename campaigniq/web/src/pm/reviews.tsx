/**
 * Zonal Manager - My Performance (PM.1) and Territory Plan Reviews (PM.2 ... PM.3D).
 */
import { useState } from 'react';
import { AlertTriangle, ClipboardCheck, FileText, History, MessageSquare, RefreshCw, Table2 } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, COLORS } from '../ui';
import {
  Act, Actions, AiBox, Bars, Box, Checklist, Cta, Drawer, Facts, Field, Input, Muted, P, PmPage, Select, Source, Sources, Status, Strip, Table, Workflow,
} from './kit';
import { AMBAD, CROP_PLAN, CROP_TOTAL, DHANORA, ONION_APPROVED_LATER, PORTFOLIO, PORTFOLIO_TOTAL, cr, growthPct } from './data';

/* ------------------------------------------------------------------ PM.1 */

export function Pm1() {
  return (
    <PmPage crumbs={[{ label: 'My Performance' }]} code="PM.1" title="My Performance & ABP" subtitle="Crop Nutrition Portfolio · FY 2025–26 planning context">
      <Strip items={[
        { label: 'FY 2024–25 portfolio sales', value: '₹4.80 Cr', sub: 'Previous year, all three product categories' },
        { label: 'FY 2025–26 Product Portfolio ABP', value: '₹6.00 Cr', sub: 'Annual business plan assigned to this portfolio', tone: 'green' },
        { label: 'Required growth', value: '+25%', sub: '₹1.20 Cr absolute growth across the portfolio' },
      ]} />

      <div className="pm-two">
        <Box title="Product-wise Achievement vs ABP" icon={<Table2 size={15} />}>
          <Table
            head={['Product', 'FY 2024–25 Sales', 'FY 2025–26 ABP', 'Growth Required', 'Absolute Growth', 'Share of Portfolio Growth']}
            align={['l', 'r', 'r', 'r', 'r', 'r']}
            rows={PORTFOLIO.map((row) => [
              <b>{row.product}</b>, cr(row.ly), cr(row.abp), <b>+{growthPct(row.ly, row.abp)}</b>, cr(row.abp - row.ly),
              `${Math.round(((row.abp - row.ly) / (PORTFOLIO_TOTAL.abp - PORTFOLIO_TOTAL.ly)) * 100)}%`,
            ])}
            total={['Total portfolio', cr(PORTFOLIO_TOTAL.ly), cr(PORTFOLIO_TOTAL.abp), '+25.0%', cr(1.2), '100%']}
            highlight={0}
          />
        </Box>
        <div className="pm-stack">
          <Box title="Portfolio contribution & growth">
            <Bars
              height={130}
              data={PORTFOLIO.map((row) => ({ label: row.product.replace('Specialty ', 'Spec. '), values: [row.ly, row.abp] }))}
              series={[{ label: 'FY 2024–25 sales', color: COLORS.light }, { label: 'FY 2025–26 ABP', color: COLORS.dark }]}
              format={(value) => `₹${value.toFixed(2)} Cr`}
            />
          </Box>
          <Box title="Previous-year campaign indicators" tone="soft">
            <Facts cols={3} rows={[
              ['Target attainment FY 2024–25', <>94%</>],
              ['Campaign-linked sales FY 2024–25', <>₹0.62 Cr</>],
              ['Campaigns closed with learning', <>3 of 4</>],
            ]} />
          </Box>
        </div>
      </div>

      <AiBox title="AI Portfolio Insight" items={[
        { title: 'Croptek carries the largest absolute growth requirement (₹0.80 Cr of ₹1.20 Cr).', text: 'Prioritise Croptek when reconciling incoming territory plans against the portfolio ABP. This highlights where the growth sits; it does not confirm the cause of last year\'s performance.', tone: 'green' },
      ]} />

    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.2 */

const TERRITORIES = [
  { territory: 'Ambad, Jalna', tm: 'TM · Jalna Cluster', abp: AMBAD.abp, plan: AMBAD.submitted, contribution: 'Pending SKU Mapping', gap: `${AMBAD.gap} unresolved`, status: 'Submitted — PM Review Required' },
  { territory: 'Jalna HQ', tm: 'TM · Jalna Cluster', abp: '—', plan: '—', contribution: 'Awaiting Mapping', gap: '—', status: 'Awaiting Submission' },
  { territory: 'Paithan, Aurangabad', tm: 'TM · Aurangabad', abp: '—', plan: '—', contribution: 'Awaiting Mapping', gap: '—', status: 'Awaiting Submission' },
  { territory: 'Georai, Beed', tm: 'TM · Beed', abp: '—', plan: '—', contribution: 'Awaiting Mapping', gap: '—', status: 'Awaiting Submission' },
];

export function Pm2() {
  const [selected, setSelected] = useState(0);
  const { go } = useNav();
  return (
    <PmPage
      crumbs={[{ label: 'My Performance', to: 'pm.1' }, { label: 'Territory Plan Reviews' }, { label: 'Consolidated Territory Plans' }]}
      code="PM.2"
      title="Territory Plans vs Portfolio ABP"
      actions={<Act icon={<RefreshCw size={13} />} message="Source submissions refreshed from Outlet Targets / Village Crop Plan (no TM plan was edited)">Import / Refresh Source Submissions</Act>}
    >
      <Source>Opened by clicking <b>Review Consolidated Territory Plans</b>. Field Sales Managers prepare the plans; this screen only reviews and consolidates them.</Source>

      <Strip items={[
        { label: 'Previous-year portfolio sales', value: '₹4.80 Cr' },
        { label: 'Portfolio ABP FY 2025–26', value: '₹6.00 Cr', tone: 'green' },
        { label: 'Required growth', value: '+25%' },
        { label: 'Incoming portfolio contribution', value: <Status>Pending</Status>, sub: 'Until SKU-level mappings and submissions are validated', tone: 'amber' },
      ]} />

      <div className="pm-two">
        <Box title="Consolidated Field Sales Manager Business Plan Submissions" icon={<ClipboardCheck size={15} />}>
          <Table
            head={['Territory / TM', 'All-Product Territory ABP', 'TM Submitted Plan', 'PM Portfolio-Specific Contribution', 'Gap / Review Exceptions', 'Submission Status', 'View Plan']}
            align={['l', 'r', 'r', 'l', 'l', 'l', 'l']}
            rows={TERRITORIES.map((row, index) => [
              <><b>{row.territory}</b><br /><Muted>{row.tm}</Muted></>,
              row.abp, row.plan,
              index === 0 ? <button type="button" className="pm-chip" onClick={(event) => { event.stopPropagation(); go('pm.2a'); }}>{row.contribution}</button> : <Muted>{row.contribution}</Muted>,
              index === 0 ? <span style={{ color: 'var(--risk)', fontWeight: 600 }}>{row.gap}</span> : <Muted>—</Muted>,
              <Status>{row.status}</Status>,
              index === 0 ? <Btn small to="pm.3">View</Btn> : <Muted>—</Muted>,
            ])}
            highlight={selected}
            onRow={setSelected}
          />
          <p className="pm-callout">All-product territory figures (₹4.20 Cr ABP, ₹3.80 Cr submitted) are <b>not</b> summed into the ₹6.00 Cr product portfolio target. The product-specific roll-up needs validated SKU-to-portfolio mapping first.</p>
          <Sources items={[{ label: 'Outlet Planning', note: 'Field Sales Manager outlet-wise plan (source, read-only)' }, { label: 'Crop / Product Coverage Planning', note: 'Village-wise crop coverage plan (source, read-only)' }]} />
        </Box>

        <div className="pm-stack">
          <Box title="Portfolio target reconciliation" tone="soft">
            <Facts rows={[
              ['Portfolio ABP', <b>₹6.00 Cr</b>],
              ['Validated PM contribution', <P />],
              ['Unreviewed submissions', <P />],
              ['Remaining ABP gap', <Status>Not Yet Determinable</Status>],
            ]} />
          </Box>
          <AiBox title="AI Planning Insight" items={[
            { title: 'Ambad shows a ₹40.00 L all-product allocation shortfall.', text: 'Submitted ₹3.80 Cr against a ₹4.20 Cr territory ABP. This is an all-product gap, not a portfolio-specific one.', tone: 'amber' },
            { title: 'Map Croptek, Water Soluble and Specialty Nutrition SKU contributions before drawing portfolio-gap conclusions.', text: 'Open the pending SKU mapping to see what can and cannot be attributed yet.' },
          ]} />
        </div>
      </div>

      <Actions
        left={<Btn to="pm.1">← Back to My Performance & ABP</Btn>}
        right={<Cta to="pm.3">Review Selected Territory Plan</Cta>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.2A */

const SKU_ROWS = ['Croptek', 'Water Soluble', 'Specialty Nutrition'];

export function Pm2a() {
  const [selected, setSelected] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Territory Plan Reviews', to: 'pm.2' }, { label: 'Consolidated Territory Plans', to: 'pm.2' }, { label: 'SKU-to-Portfolio Reconciliation' }]}
      code="PM.2A"
      title="SKU vs ABP Reconciliation"
    >
      <Source>Opened by clicking <b>Pending SKU Mapping</b> on the Ambad, Jalna submission.</Source>
      <Strip items={[
        { label: 'PM Portfolio ABP', value: '₹6.00 Cr', tone: 'green' },
        { label: 'Validated contribution', value: <P />, tone: 'amber' },
        { label: 'Unmapped contribution', value: <P />, tone: 'amber' },
        { label: 'Remaining gap', value: <Status>Not Determinable</Status> },
      ]} />

      <div className="pm-two">
        <Box title="Product × Territory Reconciliation" icon={<Table2 size={15} />}>
          <Table
            head={['Portfolio Category', 'Territory', 'Territory Submitted All-Product Business', 'Mapped In-Scope SKU Contribution', 'Unmapped Value', 'Validation Status', 'Accountable Owner', '']}
            align={['l', 'l', 'r', 'r', 'r', 'l', 'l', 'l']}
            rows={[
              ...SKU_ROWS.map((product) => [
                <b>{product}</b>, 'Ambad, Jalna', <>{AMBAD.submitted} <Muted>(shared all-product figure)</Muted></>, <P />, <Status>Not Determinable</Status>, <Status>Pending SKU Mapping</Status>, 'Master Data · TM Jalna', <Btn small to="pm.2b">Review Mapping</Btn>,
              ]),
              ['All categories', 'Other territories', <Muted>Data pending</Muted>, <Muted>Data pending</Muted>, <Muted>—</Muted>, <Status>Awaiting Submission</Status>, <Muted>—</Muted>, <Muted>—</Muted>],
            ]}
            highlight={selected}
            onRow={(index) => index < 3 && setSelected(index)}
          />
          <p className="pm-callout">Ambad's all-product ABP is {AMBAD.abp}; the originally submitted plan is {AMBAD.submitted} with a {AMBAD.gap} gap. Its contribution to the ₹6.00 Cr portfolio ABP stays <b>Pending</b> until a valid SKU mapping exists. Nothing here is invented to fill the gap.</p>
        </Box>

        <Box title={`Ambad · ${SKU_ROWS[selected]} SKU-mapping validation`} tone="soft">
          <Checklist items={[
            { label: 'SKU master reference', status: 'Pending', note: 'Authorized product / SKU master not yet linked' },
            { label: 'Product category assignment', status: 'Pending', note: `${SKU_ROWS[selected]} category confirmation` },
            { label: 'Primary vs secondary sales basis', status: 'To Verify', note: 'Territory plan is primary (dealer) sales' },
            { label: 'Validity period', status: 'To Verify', note: 'FY 2025–26' },
            { label: 'Duplicate mapping check', status: 'Pending' },
            { label: 'Source lineage', status: 'Unverified Input', note: 'Outlet Targets / submission v1' },
          ]} />
          <Sources items={[{ label: 'View Submitted TM Plan', note: 'Outlet Targets / Village Crop Plan (read-only)' }, { label: 'Product / SKU Master' }, { label: 'ERP / DMS', note: 'Integration verification pending' }]} />
        </Box>
      </div>

      <Actions
        left={<><Btn to="pm.2">← Back to Territory Plans</Btn><Btn to="pm.2b" icon={<MessageSquare size={13} />}>Request Mapping Correction</Btn><Cta locked="Validate Mapping is enabled when all mandatory checks pass">Validate Mapping</Cta></>}
        right={<Cta locked="Proceed to once valid mapping records exist (remains reachable)">Proceed to Territory Plan Review</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.2B (drawer over PM.2A) */

export function Pm2b() {
  return (
    <Drawer title="SKU Mapping Correction Request" status="Draft — Not Sent" back="pm.2a" subtitle="Scope: Ambad, Jalna · Croptek · FY 2025–26"
      footer={<>
        <Act message="Source record (TM submitted plan v1) opened read-only">View Source Record</Act>
        <Act message="Correction request saved as draft — not sent">Save Draft</Act>
        <Btn to="pm.2a">Back to SKU vs ABP Reconciliation</Btn>
        <span className="pm-foot-right"><Cta message="Correction request created as draft — not sent to the owner">Create Mapping Correction Request</Cta></span>
      </>}
    >
      <Facts cols={3} rows={[
        ['All-product territory ABP', AMBAD.abp],
        ['Submitted all-product plan', AMBAD.submitted],
        ['Separate ABP planning gap', AMBAD.gap],
      ]} />
      <p className="pm-callout">The {AMBAD.gap} ABP gap is <b>not</b> the unmapped SKU value. The actual unmapped Croptek contribution remains <b>Not Yet Determinable</b>.</p>

      <Box title="Correction checklist">
        <Checklist items={[
          { label: 'Missing SKU identifiers in submission', status: 'Pending' },
          { label: 'SKU-to-portfolio category mapping', status: 'Pending' },
          { label: 'Primary vs secondary sales measure', status: 'Verify' },
          { label: 'Validity dates (FY 2025–26)', status: 'Verify' },
          { label: 'Possible duplicate mappings', status: 'Pending' },
          { label: 'Source submission completeness', status: 'Verify' },
        ]} />
        <Sources label="Candidate sources" items={[{ label: 'TM submitted plan' }, { label: 'Product / SKU Master' }, { label: 'ERP / DMS', note: 'Subject to integration verification' }]} />
      </Box>

      <div className="pm-form pm-form-2">
        <Field label="Request reason"><Input rows={2} placeholder="Describe the mapping gap to correct…" value="Ambad Croptek contribution cannot be attributed: SKU identifiers missing in submitted plan v1." /></Field>
        <Field label="Responsible master-data / source owner"><Select options={['Master Data Team', 'Field Sales Manager — Jalna', 'ERP / DMS Integration Owner']} /></Field>
        <Field label="Optional TM collaborator"><Select options={['Field Sales Manager — Jalna Cluster', 'None']} /></Field>
        <Field label="Due date" hint="No committed date yet"><Input placeholder="Select due date" /></Field>
        <Field label="Comments"><Input rows={2} placeholder="Comments for the owner…" /></Field>
        <Field label="Supporting evidence"><Input placeholder="Attach file or link" /></Field>
      </div>

      <Workflow title="Correction workflow" compact steps={[
        { label: 'Draft', state: 'active' }, { label: 'Assigned' }, { label: 'Source Corrected' }, { label: 'Submitted for Validation' }, { label: 'Validated' }, { label: 'ABP Reconciled' },
      ]} />

      <AiBox title="AI Data Quality Insight" items={[{ text: 'Do not count all-product territory figures as portfolio-specific SKU contributions. After source correction and validation, return to SKU vs ABP Reconciliation, recalculate the in-scope contribution and only then proceed to plan review.', tone: 'amber' }]} />
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.3 */

export function Pm3() {
  const [crop, setCrop] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Territory Plan Reviews', to: 'pm.2' }, { label: 'Consolidated Territory Plans', to: 'pm.2' }, { label: 'Ambad' }, { label: 'Plan Validation' }]}
      code="PM.3"
      title="Territory Business & Crop Plan Validation & Endorsement"
      status="Submitted — PM Review Required"
    >
      <Source>Selected the Ambad / Jalna Field Sales Manager submission (plan v1, pre-approval).</Source>
      <Strip items={[
        { label: 'All-product Ambad ABP', value: AMBAD.abp },
        { label: 'Originally submitted primary business', value: AMBAD.submitted },
        { label: 'Unresolved gap', value: AMBAD.gap, tone: 'amber' },
        { label: 'PM portfolio contribution', value: <Status>Pending SKU Mapping</Status> },
      ]} />

      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Crop-wise Business & Product Validation" icon={<Table2 size={15} />}>
            <Table
              head={['Crop', 'Proposed Business', 'Growth Assumption', 'PM Validation', 'Review Details']}
              align={['l', 'r', 'l', 'l', 'l']}
              rows={CROP_PLAN.map((row, index) => [
                <b>{row.crop}</b>, row.business, <span className="small">{row.growth}</span>, <Status>{index === 0 ? 'Validation Pending' : 'Not Yet Reviewed'}</Status>,
                <Btn small onClick={() => setCrop(index)}>{index === crop ? 'Selected' : 'Review'}</Btn>,
              ])}
              total={['Total submitted', CROP_TOTAL, 'Two views of one allocation', '', '']}
              highlight={crop}
              onRow={setCrop}
            />
            <p className="pm-note">Onion ₹1.65 Cr is the <b>original pre-approval submission</b>. The ₹{ONION_APPROVED_LATER.replace('₹', '')} Onion figure used later in Marketing Head screens is a subsequently revised / approved value and is not shown as submitted here.</p>
          </Box>

          <div className="pm-two-even">
            <Box title="Dhanora planning detail (read-only)" tone="soft">
              <Facts cols={2} rows={[
                ['Historical', `${DHANORA.histRev} · ${DHANORA.histVol}`],
                ['Target', `${DHANORA.tgtRev} · ${DHANORA.tgtVol}`],
                ['Effective coverage ', <>{DHANORA.prevAcres} → {DHANORA.reqAcres} <Status>Unvalidated</Status></>],
                ['Application rate assumption', <>{DHANORA.rate} <Status>Unvalidated</Status></>],
                ['Product realization', <>{DHANORA.realPrev} → {DHANORA.realNew} <span style={{ color: 'var(--risk)' }}>(−20%)</span></>],
                ['Volume growth', '+50%'],
              ]} />
              <Muted>Estimated crop coverage is not verified.</Muted>
            </Box>
            <Box title="Product Feasibility Assessment">
              <Checklist items={[
                { label: 'Agronomic / application-rate validation', status: 'Pending' },
                { label: 'Price / mix realization review', status: 'Review Required' },
                { label: 'Portfolio SKU mapping', status: 'Pending' },
                { label: `${AMBAD.gapLakh} all-product allocation gap`, status: 'Unresolved' },
              ]} />
            </Box>
          </div>

          <AiBox title="AI Planning Exception Insight" items={[{ title: 'Volume +50% with realization −20% is a discrepancy worth evidence review.', text: 'This flags the assumptions for review; it is not a proven error or infeasibility.', tone: 'amber' }]} />
        </div>

        <div className="pm-stack">
          <Box title="Zonal Manager Review & Endorsement" icon={<ClipboardCheck size={15} />}>
            <Field label="Review comments"><Input rows={4} placeholder="Add review comments for the Field Sales Manager…" /></Field>
            <div className="pm-stack" style={{ gap: 6 }}>
              <Btn to="pm.3b" icon={<MessageSquare size={13} />}>Request Changes to Field Sales Manager</Btn>
              <Act icon={<FileText size={13} />} message="Outlet Plan opened read-only">View Original Outlet Plan</Act>
              <Act icon={<FileText size={13} />} message="Coverage Plan opened read-only">View Original Coverage Plan</Act>
              <Act message="Review saved (plan not endorsed)">Save Review</Act>
              <Cta locked="Disabled until mandatory validations and the ₹0.40 Cr planning gap are resolved, or an authorized exception is accepted">Endorse & Forward to Marketing Head</Cta>
            </div>
            <Muted>The Zonal Manager reviews and comments; the Field Sales Manager's original plan is never edited here.</Muted>
          </Box>
          <Box title="Approval chain" tone="soft">
            <Workflow compact steps={[{ label: 'Field Sales Manager Submission', state: 'done' }, { label: 'Zonal Manager Endorsement', state: 'active' }, { label: 'Marketing Head Review' }]} />
          </Box>
        </div>
      </div>

      <Actions
        left={<Btn to="pm.2">← Back to Territory Plans</Btn>}
        right={<><Btn to="pm.3c" icon={<History size={13} />}>Revised plan review (after TM resubmission)</Btn><Cta to="pm.4">Assigned Marketing Themes</Cta></>}
       
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.3B (drawer over PM.3) */

const EXCEPTIONS = [
  { exception: 'All-product planning gap', value: '₹0.40 Cr unresolved', fix: 'Allocate or justify gap vs ₹4.20 Cr ABP', status: 'Pending' },
  { exception: 'Dhanora proposed volume growth', value: '10 → 15 MT (+50%)', fix: 'Evidence for volume drivers', status: 'Clarification Required' },
  { exception: 'Implied realization', value: '₹100 → ₹80/kg (−20%)', fix: 'Confirm price / mix assumption', status: 'Clarification Required' },
  { exception: 'Application-rate assumption', value: '20 kg/acre', fix: 'Agronomy validation of rate', status: 'Unvalidated' },
  { exception: 'Source completeness', value: 'v1', fix: 'Attach historical sales / acreage records', status: 'Pending' },
];

export function Pm3b() {
  const [selected, setSelected] = useState(1);
  const row = EXCEPTIONS[selected];
  return (
    <Drawer title="Request Plan Correction" status="Draft — Not Sent" back="pm.3" subtitle={`Ambad, Jalna · ABP ${AMBAD.abp} · submitted ${AMBAD.submitted} · gap ${AMBAD.gap} · original Onion ₹1.65 Cr (pre-approval)`}
      footer={<>
        <Act message="Original TM plan v1 opened read-only">View Original TM Plan</Act>
        <Act message="Correction request saved as draft — not sent">Save Draft</Act>
        <Btn to="pm.3">Back to Validate Territory Plan</Btn>
        <span className="pm-foot-right"><Cta message="Correction request drafted — sending requires confirmation (not sent)">Send Correction Request to Field Sales Manager</Cta></span>
      </>}
    >
      <Table
        compact
        head={['Exception', 'Current Value', 'Required Clarification / Correction', 'Status', '']}
        rows={EXCEPTIONS.map((item, index) => [<b>{item.exception}</b>, item.value, item.fix, <Status>{item.status}</Status>, <input type="radio" checked={selected === index} onChange={() => setSelected(index)} />])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title={`Selected correction · ${row.exception}`} tone="soft">
        <div className="pm-form pm-form-2">
          <Field label="Reason"><Input rows={2} value={`${row.fix}. Current value: ${row.value}.`} /></Field>
          <Field label="Supporting source reference"><Input value="Village Crop Plan (v1)" /></Field>
          <Field label="Assigned to"><Select options={['Field Sales Manager — Jalna Cluster']} /></Field>
          <Field label="Due date" hint="No committed date"><Input placeholder="Select due date" /></Field>
          <Field label="Required evidence"><Input placeholder="e.g. historical sales records, agronomy note" /></Field>
          <Field label="Optional PM technical reviewer"><Select options={['None', 'Agronomy Lead', 'Pricing Analyst']} /></Field>
        </div>
      </Box>
      <p className="pm-callout">SKU mapping is a separate issue from this all-product planning gap. Any previously validated mapping stays untouched by this request.</p>
      <Workflow title="Correction workflow" compact steps={[{ label: 'Draft', state: 'active' }, { label: 'Sent to TM' }, { label: 'Revised Plan Submitted' }, { label: 'PM Revalidation' }, { label: 'Resolved' }]} />
      <Facts cols={2} rows={[['Version tracking', 'Original plan v1 (submitted)'], ['Revised version', <P>Pending TM resubmission</P>]]} />
      <AiBox title="AI Planning Review Insight" items={[{ text: 'Validate volume-growth drivers, realization and acreage before endorsement.', tone: 'amber' }]} />
      <Muted>After TM resubmission: revalidation Endorse & Forward to Marketing Head, only once mandatory checks are resolved or authorized exceptions accepted.</Muted>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ PM.3C */

const COMPARISON = [
  { parameter: 'All-product submitted plan vs ABP', original: '₹3.80 Cr vs ₹4.20 Cr', revised: 'View TM Revised Submission', variation: 'Awaiting Revalidation', status: 'Pending' },
  { parameter: 'Onion allocation', original: '₹1.65 Cr', revised: 'View TM Revised Submission', variation: 'Awaiting Revalidation', status: 'Pending' },
  { parameter: 'Dhanora revenue / volume', original: '₹10.00 L / 10 MT → ₹12.00 L / 15 MT', revised: 'View TM Revised Submission', variation: 'Awaiting Revalidation', status: 'Pending' },
  { parameter: 'Implied realization', original: '₹100 → ₹80/kg', revised: 'View TM Revised Submission', variation: 'Awaiting Revalidation', status: 'Pending' },
  { parameter: 'Application rate', original: '20 kg/acre (unvalidated)', revised: 'View TM Revised Submission', variation: '—', status: 'Agronomy Validation Pending' },
];

export function Pm3c() {
  return (
    <PmPage
      crumbs={[{ label: 'Territory Plan Reviews', to: 'pm.2' }, { label: 'Ambad', to: 'pm.3' }, { label: 'Correction Request', to: 'pm.3b' }, { label: 'Revised Plan Review' }]}
      code="PM.3C"
      title="Revised Territory Plan Comparison, Revalidation & Endorsement"
      status="Revised Plan v2 Received — Revalidation Pending"
    >
      <Source>Hypothetical future state: correction request sent, revised plan v2 received from the Field Sales Manager. PM revalidation and endorsement are <b>not yet complete</b>.</Source>

      <div className="pm-two">
        <div className="pm-stack">
          <Box title="Original v1 vs Revised v2" icon={<History size={15} />}>
            <Table
              head={['Parameter', 'Original v1', 'Revised v2 / Source', 'Variation', 'PM Validation']}
              rows={COMPARISON.map((row) => [<b>{row.parameter}</b>, row.original, <Act small message="TM revised submission v2 opened read-only">{row.revised}</Act>, <Muted>{row.variation}</Muted>, <Status>{row.status}</Status>])}
            />
            <p className="pm-note">Revised v2 amounts are not displayed until revalidated. The later ₹1.90 Cr approved Onion allocation is <b>not</b> treated as submitted or endorsed here.</p>
          </Box>
          <Box title="Exception Resolution Tracker">
            <Checklist items={[
              { label: 'Original ₹0.40 Cr all-product planning gap', status: 'Pending' },
              { label: 'Dhanora volume basis', status: 'Pending' },
              { label: 'Price / mix realization', status: 'Pending' },
              { label: 'Application-rate validation', status: 'Exception Requested', note: 'Agronomy review' },
              { label: 'Portfolio SKU mapping', status: 'Pending' },
            ]} />
          </Box>
        </div>

        <Box title="PM Endorsement" icon={<ClipboardCheck size={15} />}>
          <Field label="Review comments"><Input rows={3} placeholder="Revalidation notes…" /></Field>
          <Facts rows={[['Source attachments', <Sources label="" items={[{ label: 'TM Plan v1' }, { label: 'TM Plan v2' }]} />], ['Endorsed crop / product scope', 'Onion · Maize · Other Crops (all-product)'], ['Authorized-exception check', <P>Not recorded</P>]]} />
          <Workflow title="Approval routing" compact steps={[{ label: 'TM Resubmission', state: 'done' }, { label: 'PM Revalidation', state: 'active' }, { label: 'PM Endorsement' }, { label: 'Marketing Head Review' }]} />
          <div className="pm-stack" style={{ gap: 6 }}>
            <Act message="Original TM plan v1 opened read-only">View Original TM Plan</Act>
            <Act message="Revised TM plan v2 opened read-only">View Revised TM Plan</Act>
            <Btn to="pm.3b">Request Further Changes</Btn>
            <Act message="Review saved — not endorsed">Save Review</Act>
            <Cta locked="Disabled until mandatory checks clear or authorized exceptions are recorded">Endorse & Forward to Marketing Head</Cta>
          </div>
          <Muted>The PM never modifies original TM data. Endorsement is distinct from final business-plan approval.</Muted>
        </Box>
      </div>

      <Actions left={<Btn to="pm.3">← Back to Validate Territory Plan</Btn>} right={<Btn to="pm.3d" icon={<MessageSquare size={13} />}>Marketing Head clarification (later state)</Btn>} />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.3D (drawer over PM.3C) */

const MH_QUESTIONS = [
  { q: 'Justify the Onion opportunity and growth requirement', evidence: 'review note endorsed plan' },
  { q: 'Evidence for planned volume, acreage and realization assumptions', evidence: 'coverage plan · agronomy note' },
  { q: 'What marketing intervention support is recommended?', evidence: 'Market evidence comments' },
];

export function Pm3d() {
  const [selected, setSelected] = useState(0);
  const [type, setType] = useState('Explain Existing Plan');
  return (
    <Drawer title="Marketing Review Feedback & Clarification" status="MH Clarification Received — PM Response Pending" back="pm.3c" subtitle="Ambad / Jalna · Maharashtra Onion · owner: Zonal Manager · reviewed plan version from source"
      footer={<>
        <Act message="Draft response saved — not submitted">Save Draft Response</Act>
        <Btn to="pm.3b">Request TM Revision</Btn>
        <Btn to="pm.3c">Back to Plan Review</Btn>
        <span className="pm-foot-right"><Cta message="Clarification response saved as draft — not yet submitted">Submit Clarification Response to Marketing Head</Cta></span>
      </>}
    >
      <p className="pm-note">Later hypothetical state: validations were completed, the plan was endorsed and forwarded, and the Marketing Head raised a clarification. Original v1: ₹3.80 Cr submitted vs ₹4.20 Cr ABP, Onion ₹1.65 Cr. Any ₹1.90 Cr Onion figure requires a verified approved source version.</p>
      <Table
        compact
        head={['#', 'Marketing Head question', 'Status', 'Source / evidence', '']}
        rows={MH_QUESTIONS.map((item, index) => [index + 1, <b>{item.q}</b>, <Status>Pending</Status>, <Muted>{item.evidence}</Muted>, <Btn small onClick={() => setSelected(index)}>Respond</Btn>])}
        highlight={selected}
        onRow={setSelected}
      />
      <Box title={`Response · ${MH_QUESTIONS[selected].q}`} tone="soft">
        <Field label="PM response"><Input rows={3} placeholder="Draft your response…" /></Field>
        <div className="pm-form pm-form-2">
          <Field label="Response type"><Select key={type} options={['Explain Existing Plan', 'Request Field Sales Manager Revision']} value={type} /></Field>
          <Field label="Responsible owner"><Select options={['Zonal Manager', 'Field Sales Manager — Jalna']} /></Field>
          <Field label="Response due date" hint="No committed date"><Input placeholder="Select date" /></Field>
          <Field label="Evidence"><Act small message="Attachment dialog (demo)">Attach Evidence</Act></Field>
        </div>
        <Chipsy onPick={setType} />
      </Box>
      <Sources items={[{ label: 'View Review Note' }, { label: 'View Endorsed Source Plan', to: 'pm.3c' }, { label: 'View Relevant Market Evidence' }]} />
      <Workflow title="Resolution tracker" compact steps={[{ label: 'MH Feedback Received', state: 'done' }, { label: 'PM Response Draft', state: 'active' }, { label: 'Submitted to MH' }, { label: 'MH Re-review' }, { label: 'Closed / Returned' }]} />
      <p className="pm-callout">Answering a clarification is not the same as modifying an endorsed business plan. Modifications must return to TM revision, PM revalidation and the applicable approvals.</p>
    </Drawer>
  );
}

function Chipsy({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="row">
      <AlertTriangle size={13} color="var(--accent-600)" />
      <span className="muted">Choosing “Request Field Sales Manager Revision” routes the question back through TM revision.</span>
      <button type="button" className="pm-chip" onClick={() => onPick('Request Field Sales Manager Revision')}>Switch to TM revision</button>
    </div>
  );
}


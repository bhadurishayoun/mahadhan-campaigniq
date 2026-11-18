/**
 * Product Manager - Campaign Collateral (PM.7, 7A, 7B, 7C, 7D, 7E).
 */
import { useState } from 'react';
import { Eye, Image as ImageIcon, Languages, LayoutTemplate, Palette, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, cx } from '../ui';
import { Act, Actions, AiBox, Box, Checklist, Creative, Cta, Facts, Field, Input, Muted, P, PmPage, Select, Source, Status, Strip, Table, Workflow } from './kit';
import { C1, CLAIMS, COLLATERALS, THEME } from './data';

const ASSET_STAGES = ['Draft', 'Agronomy / Technical Review', 'Brand / Legal Review', 'Approved', 'Published'];

/* ------------------------------------------------------------------ PM.7 */

export function Pm7() {
  const [selected, setSelected] = useState(0);
  const [lang, setLang] = useState('English');
  const asset = COLLATERALS[selected];
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Campaign Collateral' }]}
      code="PM.7"
      title="Campaign Collateral"
      status="Draft / Not Approved"
      actions={<Btn to="pm.7b" icon={<Wand2 size={13} />}>Add Asset / Generate with AI</Btn>}
    >
      <Source>Product Proposition.</Source>
      <Strip items={[
        { label: 'Parent theme', value: THEME.name },
        { label: 'Product · Crop', value: 'Croptek · Maharashtra Onion' },
        { label: 'Selected campaign', value: C1.name },
        { label: 'Status', value: <Status>Draft / Not Approved</Status> },
      ]} />

      <div className="pm-two">
        <Box title="Collateral gallery" icon={<Palette size={15} />}>
          <div className="creative-grid">
            {COLLATERALS.map((item, index) => (
              <div key={item.name} className={cx('creative-card', index === selected && 'selected')} onClick={() => setSelected(index)}>
                <Creative kind={item.kind} lang={item.kind === 'whatsapp' || item.kind === 'poster' ? 'Marathi' : 'English'} size="md" selected={index === selected} />
                <div className="creative-card-meta">
                  <b>{item.name}</b>
                  <span>{item.lang} · {item.format}</span>
                  <div className="creative-card-row"><span>{item.version}</span><Status>{item.status}</Status></div>
                </div>
                <div className="creative-card-row">
                  <Btn small to="pm.7a">Open / Edit</Btn>
                  <Btn small to="pm.7c" icon={<Eye size={12} />}>Versions</Btn>
                </div>
              </div>
            ))}
          </div>
          <Muted>Thumbnails are editable draft materials, not finished or approved product claims.</Muted>
        </Box>

        <div className="pm-stack">
          <Box title={`Selected asset · ${asset.name}`} tone="soft">
            <Creative kind={asset.kind} lang={lang} size="lg" />
            <div className="pm-form pm-form-2">
              <Field label="Language"><Select options={['English', 'Marathi']} value={lang} key={lang} /></Field>
              <Field label="Version"><Input value={asset.version} key={asset.version} /></Field>
            </div>
            <div className="row">
              <button type="button" className={cx('pm-chip', lang === 'English' && 'active')} onClick={() => setLang('English')}>English</button>
              <button type="button" className={cx('pm-chip', lang === 'Marathi' && 'active')} onClick={() => setLang('Marathi')}>Marathi</button>
            </div>
            <div className="row">
              <Act small icon={<Sparkles size={12} />} message="AI draft generated with pending-review tags (no approved claims)">AI Generate Draft</Act>
              <Act small message="Variant created as draft">Create Variant</Act>
              <Btn small to="pm.7c">Preview</Btn>
              <Btn small to="pm.7d">Send for Technical Review</Btn>
            </div>
            <Facts rows={[['Technical claim compliance', <P />], ['Provenance', `Created by ${asset.kind === 'detailer' ? 'PM · AI draft v0.1 → v0.3' : 'PM · AI draft v0.1'}`]]} />
          </Box>
          <Box title="Asset approval tracker">
            <Workflow compact steps={ASSET_STAGES.map((label, index) => ({ label, state: index === 0 ? 'done' : 'pending' }))} />
            <Muted>Only approved assets can be published in the campaign playbook. Technical claims, dosage or crop benefits are never shown as validated here.</Muted>
          </Box>
          <AiBox title="AI Content Guidance" items={[{ text: 'Use the approved product master, validate claims and translate meaning consistently before publication.', tone: 'green' }]} />
        </div>
      </div>

      <Actions
        left={<><Btn to="pm.6">← Back to Product Proposition</Btn><Act message="Collateral drafts saved">Save Collateral Drafts</Act></>}
        right={<Cta to="pm.8">Develop Campaign Business Case</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.7A */

export function Pm7a() {
  const [page, setPage] = useState(1);
  const [lang, setLang] = useState('English');
  const { toast } = useNav();
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: 'Collateral Library', to: 'pm.7' }, { label: 'Retailer Product Detailer' }, { label: 'Edit Design' }]}
      code="PM.7A"
      title="Collateral Draft & Approval"
      status="v0.3 Draft — Not Approved"
    >
      <Source><b>Open / Edit</b> on Retailer Product Detailer. {THEME.name} · {C1.name} · Maharashtra Onion.</Source>
      <div className="pm-two">
        <Box title="Design canvas" icon={<LayoutTemplate size={15} />} actions={<Muted>Page {page} of 4 · {lang}</Muted>}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 }}>
            <div className="creative-thumbs">
              {[1, 2, 3, 4].map((item) => <button type="button" key={item} className={cx(item === page && 'active')} onClick={() => setPage(item)}>Page {item}</button>)}
            </div>
            <div className="creative-canvas">
              <Creative kind="detailer" lang={lang} size="lg" />
              <div className="cr-handle" style={{ left: '30%', top: '36%', width: '38%', height: '12%' }} />
            </div>
          </div>
          <Muted>Selection handles mark the editable headline text block. Draft content uses neutral product education; no technically approved nutrient benefits, doses or performance claims.</Muted>
        </Box>

        <div className="pm-stack">
          <Box title="AI Draft" icon={<Sparkles size={15} />}>
            <div className="pm-form">
              <Field label="Headline"><Input value={lang === 'Marathi' ? 'कांदा पिकासाठी क्रॉपटेक' : 'Croptek for Onion — product education'} key={lang} /></Field>
              <Field label="Audience"><Input value="Retailer" /></Field>
              <Field label="Language"><Select options={['English', 'Marathi']} value={lang} key={`l${lang}`} /></Field>
              <div className="row">
                <button type="button" className={cx('pm-chip', lang === 'English' && 'active')} onClick={() => setLang('English')}>English</button>
                <button type="button" className={cx('pm-chip', lang === 'Marathi' && 'active')} onClick={() => setLang('Marathi')}><Languages size={11} /> Marathi</button>
              </div>
              <div className="row">
                <Btn small onClick={() => toast('Layout picker opened')} icon={<LayoutTemplate size={12} />}>Choose Layout</Btn>
                <Btn small onClick={() => toast('Authorized imagery library opened')} icon={<ImageIcon size={12} />}>Replace Image</Btn>
                <Btn small onClick={() => toast('Text rewritten as draft (pending review tags kept)')} icon={<Wand2 size={12} />}>Rewrite Text with AI</Btn>
                <Btn small onClick={() => toast('Variant v0.4 draft created')} icon={<RefreshCw size={12} />}>Generate Variant</Btn>
              </div>
            </div>
            <Facts rows={[['Approved product master', 'Linked (reference only)'], ['Claims validation', <P />]]} />
          </Box>
          <Box title="Version history" tone="soft">
            <Table compact head={['Version', 'Change', 'Status']} rows={[['v0.1', 'Initial AI draft', <Status>Superseded</Status>], ['v0.2', 'Content edits', <Status>Superseded</Status>], ['v0.3', 'Current draft', <Status>Draft</Status>]]} highlight={2} />
            <Workflow compact steps={ASSET_STAGES.map((label, index) => ({ label, state: index === 0 ? 'active' : 'pending' }))} />
          </Box>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7">← Back to Campaign Collateral</Btn><Act message="Draft v0.3 saved">Save Draft</Act><Btn to="pm.7c">Preview</Btn></>}
        right={<><Btn to="pm.7d">Submit for Technical Review</Btn><Cta to="pm.8">Business Case</Cta></>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.7B */

export function Pm7b() {
  const [selected, setSelected] = useState(0);
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Collateral Library', to: 'pm.7' }, { label: 'AI Draft Generator' }]}
      code="PM.7B"
      title="AI Campaign Collateral Template Selection & Draft Generation"
      status="Draft / Not Approved"
    >
      <Source><b>Add Asset / Generate with AI</b>. product claims drafted and sent for technical validation, not yet approved.</Source>
      <div className="pm-two">
        <Box title="Template gallery" icon={<LayoutTemplate size={15} />}>
          <div className="creative-grid">
            {COLLATERALS.map((item, index) => (
              <div key={item.name} className={cx('creative-card', index === selected && 'selected')} onClick={() => setSelected(index)}>
                <Creative kind={item.kind} lang={item.kind === 'whatsapp' || item.kind === 'poster' ? 'Marathi' : 'English'} size="md" selected={index === selected} />
                <div className="creative-card-meta"><b>{item.name}</b><span>{item.format} · {item.lang}</span><span>Audience: {item.kind === 'detailer' ? 'Retailer' : 'Farmer'}</span></div>
                <div className="creative-card-row"><Btn small variant={index === selected ? 'primary' : 'outline'} onClick={() => setSelected(index)}>{index === selected ? 'Selected' : 'Select'}</Btn><Btn small to="pm.7c">Preview</Btn></div>
              </div>
            ))}
          </div>
        </Box>
        <div className="pm-stack">
          <Box title="AI Draft Configuration" icon={<Sparkles size={15} />}>
            <div className="pm-form">
              <Field label="Chosen template"><Input value={COLLATERALS[selected].name} key={selected} /></Field>
              <Field label="Audience"><Input value={COLLATERALS[selected].kind === 'detailer' ? 'Retailer' : 'Farmer'} key={`a${selected}`} /></Field>
              <Field label="Language"><Select options={['English', 'Marathi']} /></Field>
              <Field label="Communication objective"><Input value="Approved product education and eligible first-purchase support" /></Field>
              <Field label="Design style"><Select options={['Mahadhan corporate · white / green / yellow', 'Field-friendly high contrast']} /></Field>
              <Field label="Output format"><Select options={[COLLATERALS[selected].format, 'PDF', 'PNG']} key={`f${selected}`} /></Field>
            </div>
            <Facts rows={[['Source inputs', 'Product Master Draft Claims Intervention Design · authorized imagery library'], ['Supporting evidence status', <P />]]} />
          </Box>
          <p className="pm-callout">claims ("{CLAIMS[1]}", "{CLAIMS[2]}", "{CLAIMS[3]}") are still technically <b>unvalidated</b>. AI drafts use neutral placeholder content with explicit pending-review tags, never approved claims or invented dosages.</p>
          <Workflow compact steps={[{ label: 'Select Template', state: 'active' }, { label: 'Configure Inputs', state: 'active' }, { label: 'Generate Draft' }, { label: 'Edit' }, { label: 'Technical Approval Collateral Approvals' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7">← Back to Campaign Collateral</Btn><Btn to="pm.7c">Preview Template</Btn><Act message="Draft setup saved">Save Draft Setup</Act></>}
        right={<Cta to="pm.7a" message="Draft generated with pending-review tags — opening editor">Generate Draft & Open Editor</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.7C */

const CHANGES = [
  ['Headline revised', 'Technical Review Pending'],
  ['Product claim copy changed', 'Agronomy Approval Pending'],
  ['Onion image replaced', 'Brand / Rights Review Pending'],
  ['Marathi variant created', 'Translation Review Pending'],
];

export function Pm7c() {
  const [mode, setMode] = useState('Side-by-side');
  const [lang, setLang] = useState('English');
  const { toast } = useNav();
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: 'Collateral Library', to: 'pm.7' }, { label: 'Retailer Product Detailer', to: 'pm.7a' }, { label: 'Version Comparison' }]}
      code="PM.7C"
      title="Collateral Preview, Version Comparison & Change Tracking"
      status="Draft / Not Approved"
      actions={<div className="row">
        <Select options={['English', 'Marathi']} value={lang} key={lang} />
        <button type="button" className={cx('pm-chip', lang === 'English' && 'active')} onClick={() => setLang('English')}>EN</button>
        <button type="button" className={cx('pm-chip', lang === 'Marathi' && 'active')} onClick={() => setLang('Marathi')}>MR</button>
        <button type="button" className={cx('pm-chip', mode === 'Side-by-side' && 'active')} onClick={() => setMode('Side-by-side')}>Side-by-side</button>
        <button type="button" className={cx('pm-chip', mode === 'Overlay' && 'active')} onClick={() => setMode('Overlay')}>Overlay</button>
      </div>}
    >
      <Source><b>Preview / View Version History</b> for the Retailer Product Detailer. C1 {C1.name} · Maharashtra Onion.</Source>
      <div className="pm-two">
        <Box title={`${mode} comparison · v0.2 vs v0.3`} icon={<Eye size={15} />}>
          <div className={mode === 'Side-by-side' ? 'pm-two-even' : undefined} style={mode === 'Overlay' ? { position: 'relative' } : undefined}>
            <div style={mode === 'Overlay' ? { opacity: .45 } : undefined}>
              <Creative kind="detailer" lang={lang} size="lg" label="Previous · v0.2" version="Draft" />
            </div>
            <div style={mode === 'Overlay' ? { position: 'absolute', inset: 0, opacity: .75 } : { position: 'relative' }}>
              <Creative kind="detailer" lang={lang} size="lg" label="Current · v0.3" version="Draft" />
              <div className="cr-handle" style={{ left: '34%', top: '18%', width: '48%', height: '10%' }} />
              <div className="cr-handle" style={{ left: '4%', top: '18%', width: '26%', height: '22%' }} />
              <div className="cr-handle" style={{ left: '4%', top: '62%', width: '70%', height: '12%' }} />
            </div>
          </div>
          <Muted>Outline markers: revised headline, changed image, draft claim copy and layout. Both versions are Draft and not technically approved.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="Changes & validation">
            <Table compact head={['Change', 'Status']} rows={CHANGES.map(([change, status]) => [<b>{change}</b>, <Status>{status}</Status>])} />
            <Muted>Unvalidated claims are never labelled as approved product benefits.</Muted>
          </Box>
          <Box title="Version history" tone="soft">
            <Table compact head={['Version', 'Note', 'Author']} rows={[['v0.1', 'Initial Draft', 'PM (AI-assisted)'], ['v0.2', 'Content Edits', 'PM'], ['v0.3', 'Current Draft', 'PM']]} highlight={2} />
            <Workflow compact steps={[{ label: 'Draft', state: 'active' }, { label: 'Technical Review' }, { label: 'Brand / Language Review' }, { label: 'Approved' }, { label: 'Published' }]} />
          </Box>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7a">← Back to Editor</Btn><Btn onClick={() => toast('Restore v0.2? Confirmation required (demo: no change made)')}>Restore Previous Draft</Btn><Btn to="pm.7a">Edit Current Version</Btn><Act message="Version comparison saved">Save Version Comparison</Act></>}
        right={<Cta to="pm.7d">Submit Current Version for Technical Review</Cta>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.7D */

const REVIEW_ROWS = [
  { element: `Draft positioning “${CLAIMS[0]}”`, evidence: 'Product Master / technical evidence', owner: 'Agronomy / Technical Reviewer', stage: 'Technical Review' },
  { element: `Draft benefit claim “${CLAIMS[1]}”`, evidence: 'Technical substantiation', owner: 'Agronomy / Technical Reviewer', stage: 'Technical Review' },
  { element: `Draft claim “${CLAIMS[2]}”`, evidence: 'Technical substantiation', owner: 'Agronomy / Technical Reviewer', stage: 'Technical Review' },
  { element: `Draft claim “${CLAIMS[3]}”`, evidence: 'Technical substantiation', owner: 'Agronomy / Technical Reviewer', stage: 'Technical Review' },
  { element: 'Onion imagery / brand rights', evidence: 'Authorized imagery licence', owner: 'Brand Reviewer', stage: 'Brand / Language Review' },
  { element: 'Marathi translation variant', evidence: 'Translation meaning check', owner: 'Language Reviewer', stage: 'Brand / Language Review' },
];

export function Pm7d() {
  const [selected, setSelected] = useState(1);
  const row = REVIEW_ROWS[selected];
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: 'Collateral Library', to: 'pm.7' }, { label: 'Retailer Product Detailer', to: 'pm.7a' }, { label: 'Approval Tracker' }]}
      code="PM.7D"
      title="Collateral Technical, Brand & Language Approval Tracker"
      status="Submitted — Technical Review Pending"
    >
      <Source><b>Submit Current Version for Technical Review</b> (v0.3 English). Later illustrative state after submission, not an actual approval.</Source>
      <div className="pm-two">
        <Box title="Claim-wise & content-wise review tracker">
          <Table
            head={['Content / claim element', 'Evidence requirement', 'Review owner', 'Review stage', 'Observation', 'Status']}
            rows={REVIEW_ROWS.map((item) => [<b>{item.element}</b>, item.evidence, item.owner, item.stage, <Muted>Awaiting reviewer findings</Muted>, <Status>{item.stage.startsWith('Technical') ? 'Unvalidated' : 'Not Completed'}</Status>])}
            highlight={selected}
            onRow={setSelected}
          />
          <Muted>Reviewers are shown by role. The PM cannot self-approve technical claims or silently overwrite v0.3; corrected versions require renewed validation.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="v0.3 · Retailer Product Detailer" tone="soft">
            <Creative kind="detailer" size="md" label="v0.3 English" version="Submitted (timestamp pending)" />
            <Facts rows={[['Selected item', row.element], ['Reviewer observations', <Muted>Awaiting reviewer findings</Muted>]]} />
            <div className="row">
              <Act small message="Reviewer notes: none recorded yet">View Reviewer Notes</Act>
              <Act small message="Evidence pack opened">View Evidence</Act>
              <Act small message="Clarification requested from reviewer">Request Clarification</Act>
            </div>
          </Box>
          <Workflow title="Approval workflow" compact steps={[{ label: 'Draft v0.3', state: 'done' }, { label: 'Submitted', state: 'done' }, { label: 'Technical Review', state: 'active' }, { label: 'Brand / Language Review' }, { label: 'Approved' }, { label: 'Published' }]} />
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7c">← Back to Compare Versions</Btn><Btn to="pm.7a">Open in to Create Corrected v0.4</Btn><Act message="Approval tracking subscribed">Track Approval</Act></>}
        right={<><Btn to="pm.7e">Playbook release readiness (later state)</Btn><Cta locked="Disabled until technical and required brand / language approvals are complete and campaign release authorization permits publishing">Release Approved Asset to Campaign Playbook</Cta></>}
      />
    </PmPage>
  );
}

/* ------------------------------------------------------------------ PM.7E */

export function Pm7e() {
  return (
    <PmPage
      crumbs={[{ label: 'Campaign Planning', to: 'pm.5' }, { label: THEME.name, to: 'pm.4' }, { label: C1.name, to: 'pm.6' }, { label: 'Collateral Library', to: 'pm.7' }, { label: 'Playbook Release' }]}
      code="PM.7E"
      title="Approved Collateral Packaging & Campaign Playbook Release Readiness"
      status="Release Readiness — Pending"
    >
      <Source>Approval Tracker — later hypothetical preparation stage. It does <b>not</b> claim pending reviews were completed.</Source>
      <div className="pm-two">
        <Box title="Collateral library & playbook assembly">
          <div className="creative-grid">
            {COLLATERALS.map((item, index) => (
              <div key={item.name} className="creative-card">
                <Creative kind={item.kind} lang={item.kind === 'whatsapp' || item.kind === 'poster' ? 'Marathi' : 'English'} size="sm" />
                <div className="creative-card-meta"><b>{item.name}</b><span>{item.lang}</span><Status>{index === 0 ? 'Approved Version — Verify' : 'Approved version pending confirmation'}</Status></div>
                <Act small message="Inclusion recorded as pending authorized version">Include in Playbook</Act>
              </div>
            ))}
          </div>
          <Table
            compact
            head={['Asset', 'Latest Authorized Version', 'Languages', 'Review Status', 'Playbook Inclusion', 'View']}
            rows={COLLATERALS.map((item, index) => [
              <b>{item.name}</b>,
              index === 0 ? <Status>Approved Version — Verify</Status> : <Muted>Not selected</Muted>,
              item.lang,
              <Status>{index === 0 ? 'v0.3 submitted — not approved' : 'Approved version pending confirmation'}</Status>,
              <Status>Pending</Status>,
              <Btn small to="pm.7d">View</Btn>,
            ])}
          />
          <Muted>Retailer Detailer v0.3 was submitted for technical review, not approved; an eventual approved version must be selected from the authorized version registry.</Muted>
        </Box>
        <div className="pm-stack">
          <Box title="Campaign Playbook Release Readiness" tone="soft">
            <Facts rows={[['Scope', 'Maharashtra Onion'], ['Target', C1.name]]} />
            <Checklist items={[
              { label: 'Approved product claims', status: 'Pending' },
              { label: 'Authorized asset version validation', status: 'Pending' },
              { label: 'Campaign approval', status: 'Pending' },
              { label: 'Recommendation publication', status: 'Pending' },
              { label: 'Eligible Territory Manager recipient mapping', status: 'Pending' },
              { label: 'Language / rights checks', status: 'Pending' },
            ]} />
          </Box>
          <Workflow compact steps={[{ label: 'Asset Technical / Brand Approval' }, { label: 'Select Authorized Versions' }, { label: 'Assemble Campaign Playbook' }, { label: 'MH Campaign Approval / Release' }, { label: 'Publish to Eligible TM My Campaigns' }]} />
          <p className="pm-note"><b>Roles:</b> PM maintains approved content versions · MH authorizes campaign rollout · TM consumes authorized material and never modifies master claims.</p>
        </div>
      </div>
      <Actions
        left={<><Btn to="pm.7d">← Back to Collateral Approvals</Btn><Act message="Authorized version preview (registry match pending)">Preview Authorized Version</Act><Btn to="pm.7d">View Approval Records</Btn><Act message="Playbook draft saved">Save Playbook Draft</Act></>}
        right={<><Btn to="pm.8b">Financial Assumptions</Btn><Cta locked="Disabled until all required approvals and recipient checks pass">Publish Approved Assets to Eligible Territory Managers</Cta></>}
      />
    </PmPage>
  );
}



import type { ReactNode } from 'react';
import { useNav } from '../nav';
import { TmPage } from './ui';
import type { ScreenId } from '../nav';
import { IndiaDistrictMap } from '../map/IndiaDistrictMap';
import { ActionButton, StatusChip, type StatusKind } from '../ui/index';
import { TM_CHARTS, TM_KPIS, TM_PULSE } from './charts';

const statusKind = (t: string): StatusKind => (/verified|ready|on track|complete|resolved/i.test(t) ? 'ok' : /needs|behind|risk|blocked|accelerat/i.test(t) ? 'risk' : 'warn');

type Metric = { label: string; value: string; sub?: string; tone?: 'green' | 'amber' | 'red' | 'grey' };
type GridRow = { label: string; value: string; status?: string; cta?: { label: string; to: ScreenId } };
type Panel = { title: string; rows: GridRow[]; visual?: ReactNode; visualNote?: string };

function Workspace({
  crumbs,
  code,
  title,
  subtitle,
  metrics,
  left,
  right,
  actions,
}: {
  crumbs: { label: string; to?: ScreenId }[];
  code: string;
  title: string;
  subtitle: string;
  metrics: Metric[];
  left: Panel;
  right: Panel;
  actions?: ReactNode;
}) {
  const { go } = useNav();

  return (
    <TmPage crumbs={crumbs} code={code} title={title} subtitle={subtitle} actions={actions} pulse={TM_PULSE[code]}>
      {code === 'TM.1' ? TM_KPIS() : <div className="pm-strip">
        {metrics.map((item) => (
          <div key={item.label} className={`pm-strip-item ${item.tone ? `pm-strip-${item.tone}` : ''}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.sub && <small>{item.sub}</small>}
          </div>
        ))}
      </div>}

      {TM_CHARTS[code]}

      <div className="pm-two">
        <div className="pm-box">
          <div className="pm-box-head">
            <h3>{left.title}</h3>
          </div>
          {left.visual && <div className="tm-map-wrap">{left.visual}</div>}
          {left.visualNote && <div className="tm-map-note">{left.visualNote}</div>}
          <table className="pm-table">
            <tbody>
              {left.rows.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                  <td>{row.status ? <StatusChip kind={statusKind(row.status)}>{row.status}</StatusChip> : null}</td>
                  <td style={{ textAlign: 'right' }}>
                    {row.cta && (
                      <ActionButton label={row.cta.label} onClick={() => go(row.cta!.to)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pm-box pm-ai">
          <div className="pm-box-head">
            <h3>{right.title}</h3>
          </div>
          <ul className="pm-ai-list">
            {right.rows.map((row) => (
              <li key={row.label} className="pm-ai-amber">
                <b>{row.label}</b>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
          {right.rows.some((row) => row.cta) && (
            <div className="pm-box-actions">
              {right.rows.filter((row) => row.cta).map((row) => (
                <ActionButton key={row.label} kind="primary" label={row.cta!.label} onClick={() => go(row.cta!.to)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </TmPage>
  );
}

export function Tm1() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Plan' }, { label: 'My Performance (Active)' }]}
      code="TM.1"
      title="My Performance & Annual Business Plan"
      subtitle="Ambad Cluster · FY 2025–26 · Illustrative planning baseline"
      actions={<ActionButton kind="primary" label="Plan Territory" onClick={() => go('tm.2')} />}
      metrics={[
        { label: 'Last-year sales', value: '₹8.0 Cr' },
        { label: 'Current-year ABP target', value: '₹10.0 Cr' },
        { label: 'Required growth', value: '+25%', tone: 'amber' },
      ]}
      left={{
        title: 'Territory Planning Table',
        rows: [
          { label: 'Ambad', value: '₹3.2 Cr → ₹4.2 Cr (+31.3%)', cta: { label: 'Plan Territory', to: 'tm.2' } },
          { label: 'Ghansawangi', value: '₹2.8 Cr → ₹3.4 Cr (+21.4%)' },
          { label: 'Badnapur', value: '₹2.0 Cr → ₹2.4 Cr (+20.0%)' },
          { label: 'Total', value: '₹8.0 Cr → ₹10.0 Cr (+25.0%)' },
        ],
      }}
      right={{
        title: 'AI Planning Insight',
        rows: [
          { label: 'Largest uplift', value: 'Ambad contributes the highest absolute gap (+₹1.0 Cr).' },
          { label: 'Stability check', value: 'Maintain Ghansawangi/Badnapur growth trajectory with controlled variance.' },
          { label: 'Incentive readiness', value: 'Prior-year achievement trend indicates feasible +25% aggregate stretch.' },
        ],
      }}
    />
  );
}

export function Tm2() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Plan' }, { label: 'Territory Network (Active)' }]}
      code="TM.2"
      title="Territory Network & Channel Mapping"
      subtitle="My Plan > My Performance > Ambad > Territory Network"
      actions={<ActionButton kind="primary" label="Proceed to Outlet Planning" onClick={() => go('tm.3')} />}
      metrics={[
        { label: 'District / Territory', value: 'Jalna / Ambad' },
        { label: 'Mapped dealers', value: '8 (illustrative)' },
        { label: 'Active retailers', value: '74 (illustrative)', tone: 'green' },
      ]}
      left={{
        title: 'Geography-to-Channel Explorer',
        visual: (
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="Territory network map for Ambad"
              height={330}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected="v-ambad"
              talukas={{
                Ambad: { tone: 4, info: 'Primary focus zone' },
                Badnapur: { tone: 2, info: 'Secondary support channel' },
                Ghansawangi: { tone: 1, info: 'Spillover retailer influence' },
                Jalna: { tone: 1, info: 'Linked feeder market' },
              }}
              markers={[
                {
                  id: 'v-ambad',
                  info: 'Ambad HQ · 22 retailers linked · 1 duplicate outlet',
                  action: { label: 'Allocate outlets in TM.3', run: () => go('tm.3') },
                },
                { id: 'v-dhanora', info: 'Dhanora · 14 retailers linked · 2 inactive mappings' },
                { id: 'v-wadigaon', info: 'Wadi Gaon · 11 retailers linked · no blockers' },
                { id: 'v-pimpalgaon', info: 'Pimpalgaon · 9 retailers linked · 2 pending verifications' },
              ]}
              scale={{
                title: 'Channel depth score',
                items: [
                  { label: 'High concentration', tone: 4 },
                  { label: 'Medium concentration', tone: 2 },
                  { label: 'Early coverage', tone: 1 },
                ],
              }}
            />
          </div>
        ),
        visualNote: 'Interactive map sourced from the built-in district/taluka datasets for TM network validation.',
        rows: [
          { label: 'Dhanora', value: '14 retailers linked · 2 inactive mappings', status: 'Needs mapping clean-up' },
          { label: 'Wadi Gaon', value: '11 retailers linked · no blockers' },
          { label: 'Ambad HQ', value: '22 retailers linked · one duplicate outlet' },
          { label: 'Pimpalgaon', value: '9 retailers linked · data pending in 2 outlets' },
        ],
      }}
      right={{
        title: 'AI Network Insight',
        rows: [
          { label: 'Missing links', value: 'Prioritize dealer-retailer mapping closure in Dhanora before target allocation.' },
          { label: 'Data quality', value: 'Two outlets flagged for missing verification; keep forecast assumptions provisional.' },
          { label: 'Action', value: 'Move to TM.3 to assign outlet-level targets after mapping corrections.' },
        ],
      }}
    />
  );
}

export function Tm3() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Plan' }, { label: 'Outlet Planning (Active)' }]}
      code="TM.3"
      title="Outlet Business Planning & Target Allocation"
      subtitle="Ambad cluster dealer and retailer allocation with editable target assumptions"
      actions={<ActionButton kind="primary" label="Proceed to Crop & Product Plan" onClick={() => go('tm.4')} />}
      metrics={[
        { label: 'Previous-year primary', value: '₹3.2 Cr' },
        { label: 'ABP target', value: '₹4.2 Cr' },
        { label: 'Gap to allocate', value: '₹1.0 Cr', tone: 'amber' },
      ]}
      left={{
        title: 'Dealer/Outlet Target Allocation',
        visual: (
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="Outlet allocation map for Ambad cluster"
              height={330}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected="v-gondi"
              talukas={{
                Ambad: { tone: 4, info: 'Highest planned target uplift' },
                Badnapur: { tone: 2, info: 'Support demand from dealer spillover' },
                Ghansawangi: { tone: 1, info: 'Secondary feeder influence' },
              }}
              markers={[
                { id: 'v-ambad', info: 'Shiv Traders catchment · planned primary allocation ₹1.25 Cr' },
                { id: 'v-gondi', info: 'Mahalaxmi Agro catchment · planned primary allocation ₹1.05 Cr' },
                { id: 'v-jamkhed', info: 'Retail outlet cluster A · planned allocation ₹0.76 Cr' },
                {
                  id: 'v-kingaon',
                  info: 'Retail outlet cluster B · planned allocation ₹1.14 Cr · review concentration risk',
                  action: { label: 'Validate crop fit in TM.4', run: () => go('tm.4') },
                },
              ]}
              scale={{
                title: 'Allocation intensity',
                items: [
                  { label: 'High target pressure', tone: 4 },
                  { label: 'Balanced uplift', tone: 2 },
                  { label: 'Base allocation', tone: 1 },
                ],
              }}
            />
          </div>
        ),
        visualNote: 'Map links dealer and outlet clusters with allocation intensity before crop-plan validation.',
        rows: [
          { label: 'Shiv Traders (Dealer)', value: '₹0.96 Cr → ₹1.25 Cr (+30.2%)', status: 'Draft' },
          { label: 'Mahalaxmi Agro (Dealer)', value: '₹0.82 Cr → ₹1.05 Cr (+28.0%)', status: 'Draft' },
          { label: 'Retail outlet cluster A', value: '₹0.58 Cr → ₹0.76 Cr (+31.0%)', status: 'Pending review' },
          { label: 'Retail outlet cluster B', value: '₹0.84 Cr → ₹1.14 Cr (+35.7%)', cta: { label: 'View detail', to: 'tm.4' } },
        ],
      }}
      right={{
        title: 'AI Allocation Guidance',
        rows: [
          { label: 'Stretch balancing', value: 'Keep dealer growth within 28–32% to avoid unrealistic downstream retail pressure.' },
          { label: 'Exception', value: 'Cluster B growth >35% should be backed by campaign and crop coverage assumptions.' },
          { label: 'Hand-off', value: 'Validate crop-product fit in TM.4 before final approval workflow.' },
        ],
      }}
    />
  );
}

export function Tm4() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Plan' }, { label: 'Crop & Product Plan (Active)' }]}
      code="TM.4"
      title="Village-wise Crop, Product & Coverage Planning"
      subtitle="Ambad Onion season planning · product mix and field coverage readiness"
      actions={<ActionButton kind="primary" label="Proceed to Review & Approval" onClick={() => go('tm.5')} />}
      metrics={[
        { label: 'Primary crop focus', value: 'Onion' },
        { label: 'Coverage villages', value: '5 selected' },
        { label: 'Coverage adequacy', value: '78%', tone: 'amber' },
      ]}
      left={{
        title: 'Village Coverage Plan',
        visual: (
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="Village-wise crop and product coverage map"
              height={330}
              view={{ taluka: 'Ambad' }}
              selected="v-pimpalgaon"
              talukas={{
                Ambad: { tone: 4, info: 'Core execution taluka' },
              }}
              markers={[
                { id: 'v-dhanora', info: 'Dhanora · 420 acres · Croptek + NutriBoost bundle · Ready' },
                { id: 'v-wadigaon', info: 'Wadi Gaon · 360 acres · Croptek focus + demo plots · Conditional' },
                { id: 'v-ambad', info: 'Ambad HQ belt · 510 acres · Balanced portfolio · Ready' },
                {
                  id: 'v-pimpalgaon',
                  info: 'Pimpalgaon · 280 acres · Retailer education pending · Needs action',
                  action: { label: 'Track readiness in TM.5', run: () => go('tm.5') },
                },
              ]}
              scale={{
                title: 'Coverage readiness',
                items: [
                  { label: 'Ready', tone: 4 },
                  { label: 'Conditional', tone: 2 },
                  { label: 'Needs action', tone: 1 },
                ],
              }}
            />
          </div>
        ),
        visualNote: 'Map highlights crop coverage villages and readiness hotspots before final TM.5 approval submission.',
        rows: [
          { label: 'Dhanora', value: 'Onion 420 acres · Croptek + NutriBoost bundle', status: 'Ready' },
          { label: 'Wadi Gaon', value: 'Onion 360 acres · Croptek focus + demo plots', status: 'Conditional' },
          { label: 'Ambad HQ belt', value: 'Onion 510 acres · balanced portfolio', status: 'Ready' },
          { label: 'Pimpalgaon', value: 'Onion 280 acres · retailer education pending', status: 'Needs action' },
        ],
      }}
      right={{
        title: 'AI Coverage Insight',
        rows: [
          { label: 'Gap flag', value: 'Pimpalgaon readiness gap may constrain conversion if activation slips by >2 weeks.' },
          { label: 'Resource cue', value: 'Deploy one additional field demo day in Wadi Gaon to support planned uplift.' },
          { label: 'Approval readiness', value: 'Proceed to TM.5 once readiness blockers are explicitly tracked.' },
        ],
      }}
    />
  );
}

export function Tm5() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Plan' }, { label: 'Review & Approval (Active)' }]}
      code="TM.5"
      title="Business & Crop Plan Review and Approval"
      subtitle="Final reconciliation of sales targets, crop coverage and campaign assumptions"
      actions={<ActionButton kind="primary" label="Start Campaign Wizard" onClick={() => go('cw.1')} />}
      metrics={[
        { label: 'Plan status', value: 'Draft v3' },
        { label: 'Reconciliation checks', value: '11 / 14 complete' },
        { label: 'Approval gate', value: 'Pending MH review', tone: 'amber' },
      ]}
      left={{
        title: 'Approval Checklist',
        rows: [
          { label: 'Territory target consistency', value: 'Matched with TM.1 totals', status: 'Verified' },
          { label: 'Outlet and crop mapping', value: 'Aligned with TM.2–TM.4', status: 'Verified' },
          { label: 'Campaign support assumptions', value: '2 assumptions require validation', status: 'Pending' },
          { label: 'Submission package', value: 'Ready for MH workflow', cta: { label: 'Submit in CW.1', to: 'cw.1' } },
        ],
      }}
      right={{
        title: 'AI Approval Insight',
        rows: [
          { label: 'Risk note', value: 'Submission should include explicit assumptions where evidence is partial.' },
          { label: 'Escalation cue', value: 'Flag readiness constraints early to avoid later execution variance.' },
          { label: 'Workflow', value: 'Move to campaign creation once plan package is approved.' },
        ],
      }}
    />
  );
}

export function Cw1() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Campaigns' }, { label: 'Campaign Wizard Step 1 (Active)' }]}
      code="CW.1"
      title="Campaign Objective & Targeting"
      subtitle="Define objective, audience and territory focus for approved plan"
      actions={<button type="button" className="pm-btn" onClick={() => go('cw.2')}>Continue to activity mix</button>}
      metrics={[
        { label: 'Wizard progress', value: 'Step 1 of 4' },
        { label: 'Primary objective', value: 'Retail conversion uplift' },
        { label: 'Target territory', value: 'Ambad cluster' },
      ]}
      left={{
        title: 'Objective & Targeting Inputs',
        rows: [
          { label: 'Campaign theme', value: 'Retailer-led Croptek Conversion' },
          { label: 'Priority segments', value: 'Onion growers, dealer-influenced adopters' },
          { label: 'Coverage scope', value: '4 core villages + 1 expansion village' },
          { label: 'Readiness check', value: 'All mandatory fields complete', cta: { label: 'Proceed', to: 'cw.2' } },
        ],
      }}
      right={{
        title: 'AI Targeting Tips',
        rows: [
          { label: 'Segment precision', value: 'Avoid over-broad audience settings; keep crop-season alignment strict.' },
          { label: 'Scope control', value: 'Start with verified readiness villages for higher early activation confidence.' },
          { label: 'Data cue', value: 'Tag uncertain assumptions for later diagnostics in TM.IM2.' },
        ],
      }}
    />
  );
}

export function Cw2() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Campaigns' }, { label: 'Campaign Wizard Step 2 (Active)' }]}
      code="CW.2"
      title="Campaign Activity & Budget Mix Planner"
      subtitle="Allocate spend and activities by channel with realistic execution bandwidth"
      actions={<button type="button" className="pm-btn" onClick={() => go('cw.3')}>Continue to scenarios</button>}
      metrics={[
        { label: 'Wizard progress', value: 'Step 2 of 4' },
        { label: 'Indicative budget', value: '₹18.5 Lakh' },
        { label: 'Budget variance', value: '+3.2%', tone: 'amber' },
      ]}
      left={{
        title: 'Activity Mix',
        rows: [
          { label: 'Dealer meets', value: '18 events · ₹5.2 Lakh' },
          { label: 'Village demos', value: '24 events · ₹7.8 Lakh' },
          { label: 'Field follow-ups', value: '310 visits · ₹3.6 Lakh' },
          { label: 'Digital nudges', value: 'Targeted reminders · ₹1.9 Lakh', cta: { label: 'Validate outcomes', to: 'cw.3' } },
        ],
      }}
      right={{
        title: 'AI Mix Recommendations',
        rows: [
          { label: 'Efficiency', value: 'Keep demo-to-follow-up ratio tight in high-opportunity villages.' },
          { label: 'Control', value: 'Cap non-performing channels until first two-week signal check.' },
          { label: 'Readiness', value: 'Move to CW.3 scenario testing before final submission.' },
        ],
      }}
    />
  );
}

export function Cw3() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Campaigns' }, { label: 'Campaign Wizard Step 3 (Active)' }]}
      code="CW.3"
      title="Campaign Scenario & Expected Outcomes"
      subtitle="Compare conservative, base and stretch scenarios before final submission"
      actions={<button type="button" className="pm-btn" onClick={() => go('cw.4')}>Continue to final review</button>}
      metrics={[
        { label: 'Wizard progress', value: 'Step 3 of 4' },
        { label: 'Base conversion', value: '18.4%' },
        { label: 'Stretch conversion', value: '21.2%', tone: 'green' },
      ]}
      left={{
        title: 'Scenario Comparison',
        rows: [
          { label: 'Conservative', value: 'Lower spend · slower reach · lower risk' },
          { label: 'Base', value: 'Balanced spend · moderate reach · planned ROI' },
          { label: 'Stretch', value: 'Higher activation push · tighter execution dependency' },
          { label: 'Recommended', value: 'Base with controlled stretch add-ons', cta: { label: 'Finalize in CW.4', to: 'cw.4' } },
        ],
      }}
      right={{
        title: 'AI Scenario Notes',
        rows: [
          { label: 'Risk-adjusted pick', value: 'Base scenario best aligns with current territory readiness evidence.' },
          { label: 'Stretch guardrail', value: 'Trigger stretch only where weekly activation passes threshold checks.' },
          { label: 'Traceability', value: 'Document assumptions for post-campaign diagnostics.' },
        ],
      }}
    />
  );
}

export function Cw4() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'My Campaigns' }, { label: 'Campaign Wizard Step 4 (Active)' }]}
      code="CW.4"
      title="Campaign Review & Submit"
      subtitle="Final package review before approval workflow submission"
      actions={<ActionButton kind="primary" label="Submit & Open Execution" onClick={() => go('tm.ex1')} />}
      metrics={[
        { label: 'Wizard progress', value: 'Step 4 of 4' },
        { label: 'Submission status', value: 'Draft not submitted', tone: 'amber' },
        { label: 'Review completeness', value: '96%' },
      ]}
      left={{
        title: 'Submission Package',
        rows: [
          { label: 'Objective alignment', value: 'Aligned to approved ABP and crop plan' },
          { label: 'Budget and timeline', value: 'Validated against activity mix' },
          { label: 'Evidence references', value: 'TM.1, TM.4, CW.3 attached' },
          { label: 'Final action', value: 'Ready to submit for rollout', cta: { label: 'Go Live Control Tower', to: 'tm.ex1' } },
        ],
      }}
      right={{
        title: 'AI Final Check',
        rows: [
          { label: 'Completeness', value: 'Ensure all provisional assumptions are clearly tagged in request notes.' },
          { label: 'Governance', value: 'No budget unlock until approval confirmation is visible in rollout screen.' },
          { label: 'Transition', value: 'Move to TM.EX1 once submission is confirmed.' },
        ],
      }}
    />
  );
}

export function TmEx1() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'Campaign Execution (Active)' }]}
      code="TM.EX1"
      title="Campaign Execution & Live Control Tower"
      subtitle="Track live execution vs plan and identify immediate field deviations"
      actions={<ActionButton kind="primary" label="Open Corrective Workspace" onClick={() => go('tm.ex2')} />}
      metrics={[
        { label: 'Execution progress', value: '72%' },
        { label: 'Planned progress', value: '80%' },
        { label: 'Variance', value: '-8 pp', tone: 'amber' },
      ]}
      left={{
        title: 'Execution Tracker',
        rows: [
          { label: 'Dealer meets', value: '14 / 18 completed', status: 'Behind plan' },
          { label: 'Village demos', value: '17 / 24 completed', status: 'Needs acceleration' },
          { label: 'Field follow-ups', value: '228 / 310 completed', status: 'On track' },
          { label: 'Escalations', value: '2 villages require immediate intervention', cta: { label: 'Handle in TM.EX2', to: 'tm.ex2' } },
        ],
      }}
      right={{
        title: 'AI Control Alerts',
        rows: [
          { label: 'Delay pattern', value: 'Activation lag concentrated in villages with pending retailer onboarding.' },
          { label: 'Corrective priority', value: 'Focus resources on demo-to-follow-up conversion gaps this week.' },
          { label: 'Outcome guardrail', value: 'Track weekly impact before changing budget allocations.' },
        ],
      }}
    />
  );
}

export function TmEx2() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'Campaign Execution' }, { label: 'Corrective Action Workspace (Active)' }]}
      code="TM.EX2"
      title="Activity Execution & Corrective Action Workspace"
      subtitle="Issue triage, owner assignment and closure tracking"
      actions={<ActionButton kind="primary" label="Proceed to Impact Review" onClick={() => go('tm.im1')} />}
      metrics={[
        { label: 'Open issues', value: '9' },
        { label: 'High-priority issues', value: '3', tone: 'amber' },
        { label: 'Closure this week', value: '5 / 9' },
      ]}
      left={{
        title: 'Corrective Action Queue',
        rows: [
          { label: 'Dhanora follow-up lag', value: 'Assign extra field rep for 10 days', status: 'In progress' },
          { label: 'Wadi Gaon dealer stock-out', value: 'Escalated to channel support', status: 'Pending closure' },
          { label: 'Pimpalgaon demo attendance', value: 'Reschedule + local mobilization', status: 'Planned' },
          { label: 'Weekly review', value: 'Consolidate closed actions and impact signals', cta: { label: 'View impact summary', to: 'tm.im1' } },
        ],
      }}
      right={{
        title: 'AI Action Guidance',
        rows: [
          { label: 'Priority logic', value: 'Resolve issues that directly impact activation first, then efficiency optimizations.' },
          { label: 'Ownership', value: 'Each action requires owner, due date and evidence note for auditability.' },
          { label: 'Learning loop', value: 'Feed resolved patterns into TM.IM2 diagnostics for repeat prevention.' },
        ],
      }}
    />
  );
}

export function TmIm1() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'Impact & Learning (Active)' }]}
      code="TM.IM1"
      title="Campaign Impact & Business Performance"
      subtitle="Qualified impact summary with evidence-linked interpretation"
      actions={<ActionButton kind="primary" label="Open Diagnostics" onClick={() => go('tm.im2')} />}
      metrics={[
        { label: 'Qualified reach', value: '68%' },
        { label: 'Trial conversion', value: '19.4%' },
        { label: 'Tracked sales lift', value: '+11.6%', tone: 'green' },
      ]}
      left={{
        title: 'Impact Summary',
        rows: [
          { label: 'Reach and engagement', value: 'Improved in Ambad HQ and Wadi Gaon clusters' },
          { label: 'Adoption signal', value: 'Strongest in dealer-supported villages' },
          { label: 'Sales effect', value: 'Positive trend where follow-up completion >80%' },
          { label: 'Diagnostic drilldown', value: 'Open village-level differences and exceptions', cta: { label: 'View diagnostics', to: 'tm.im2' } },
        ],
      }}
      right={{
        title: 'AI Performance Insight',
        rows: [
          { label: 'Evidence discipline', value: 'Keep distinctions clear between observed outcomes and inferred causes.' },
          { label: 'Focus area', value: 'Sustain high-performing clusters while stabilizing low follow-up villages.' },
          { label: 'Escalation', value: 'Request PM optimization only if evidence supports campaign design change.' },
        ],
      }}
    />
  );
}

export function TmIm2() {
  const { go } = useNav();
  return (
    <Workspace
      crumbs={[{ label: 'Impact & Learning' }, { label: 'Diagnostics Studio (Active)' }]}
      code="TM.IM2"
      title="Campaign Diagnostics & Learning Studio"
      subtitle="Village conversion diagnostics, verified drivers and corrective learning loop"
      actions={<ActionButton kind="primary" label="Discuss with AI Copilot" onClick={() => go('tm.ai1')} />}
      metrics={[
        { label: 'Analyzed villages', value: '5 / 5' },
        { label: 'Verified drivers', value: '4' },
        { label: 'Unverified hypotheses', value: '3', tone: 'amber' },
      ]}
      left={{
        title: 'Diagnostics Matrix',
        rows: [
          { label: 'Dhanora', value: 'Lower conversion linked to delayed follow-ups (verified)' },
          { label: 'Wadi Gaon', value: 'Conversion gap appears tied to inventory breaks (partial evidence)' },
          { label: 'Ambad HQ', value: 'High conversion sustained by dense dealer support (verified)' },
          { label: 'Actionable learning', value: 'Promote proven activation sequence across low-performing villages' },
        ],
      }}
      right={{
        title: 'AI Learning Suggestions',
        rows: [
          { label: 'Playbook update', value: 'Codify high-conversion sequence as standard rollout guidance.' },
          { label: 'Data request', value: 'Capture missing retailer follow-up logs before confirming root causes.' },
          { label: 'Decision support', value: 'Use TM.AI1 for scenario-based corrective planning.' },
        ],
      }}
    />
  );
}

export function TmAi1() {
  return (
    <Workspace
      crumbs={[{ label: 'AI Copilot (Active)' }]}
      code="TM.AI1"
      title="Territory Business & Campaign Copilot Workspace"
      subtitle="Conversational planning and diagnostics assistant for territory execution"
      metrics={[
        { label: 'Context loaded', value: 'TM.1–TM.IM2' },
        { label: 'Suggested actions', value: '6 ranked options' },
        { label: 'Decision mode', value: 'Assistive (no auto-change)' },
      ]}
      left={{
        title: 'Copilot Prompts',
        rows: [
          { label: 'Plan question', value: 'Which villages need immediate conversion intervention this week?' },
          { label: 'Execution question', value: 'How do I close the 8 pp execution gap safely?' },
          { label: 'Impact question', value: 'Which observed drivers are verified vs pending validation?' },
          { label: 'Governance', value: 'Copilot suggests; user approves all operational actions.' },
        ],
      }}
      right={{
        title: 'AI Response Highlights',
        rows: [
          { label: 'Priority sequence', value: 'Address follow-up completion in Dhanora and stock continuity in Wadi Gaon first.' },
          { label: 'Resource move', value: 'Shift two field days from stable villages to lagging clusters for two weeks.' },
          { label: 'Escalation threshold', value: 'Escalate to PM only if conversion trend remains flat after corrective actions.' },
        ],
      }}
    />
  );
}









import type { ReactNode } from 'react';
import { useNav, type ScreenId } from '../nav';
import { MhPage } from './ui';
import { IndiaDistrictMap } from '../map/IndiaDistrictMap';
import { ActionButton } from '../ui/index';
import { MH_CHARTS, MH_OWN_MAP, MH_PULSE } from './charts';
import { LiveCopilot } from '../ui/LiveCopilot';
import { EVIDENCE, IMPACT, THEME, VILLAGES } from '../pm/data';

type Spec = {
  code: string;
  title: string;
  subtitle: string;
  crumbs: { label: string; to?: ScreenId }[];
  metrics: [string, string, string?][];
  board: [string, string, ScreenId?][];
  insight: [string, string][];
  visual?: ReactNode;
  visualNote?: string;
  next?: { label: string; to: ScreenId };
  /** Extra content rendered after the charts (e.g. the live copilot on MH.AI1). */
  extra?: ReactNode;
};

type VizBar = {
  label: string;
  value: number;
  note: string;
  tone?: 'green' | 'amber' | 'grey';
};

function MhVizBars({ title, items }: { title: string; items: VizBar[] }) {
  return (
    <div className="mh-viz-bars" role="img" aria-label={title}>
      <div className="mh-viz-bars-title">{title}</div>
      {items.map((item) => (
        <div key={item.label} className="mh-viz-row">
          <div className="mh-viz-head">
            <span>{item.label}</span>
            <b>{item.note}</b>
          </div>
          <div className="mh-viz-track" aria-hidden="true">
            <i className={`mh-viz-fill ${item.tone ? `mh-viz-${item.tone}` : ''}`} style={{ width: `${Math.max(8, Math.min(100, item.value))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function visualFor(code: string, go: (screen: ScreenId) => void): { visual?: ReactNode; visualNote?: string } {
  if (code === 'MH.1') {
    return {
      visual: (
        <div className="mh-viz-stack">
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="National opportunity overview map"
              height={310}
              view={{ state: 'Maharashtra' }}
              selected="jalna"
              states={{
                Maharashtra: { tone: 4, info: 'Largest opportunity and active programme concentration' },
                Gujarat: { tone: 3, info: 'High channel readiness and distributor pull' },
                Karnataka: { tone: 2, info: 'Emerging cluster with moderate conversion potential' },
                'Madhya Pradesh': { tone: 2, info: 'Expansion territory with rising interest' },
              }}
              markers={[
                { id: 'jalna', info: 'Jalna priority district for onion portfolio interventions' },
                { id: 'nashik', info: 'Nashik demand anchor for regional benchmarking' },
                { id: 'dhule', info: 'Dhule activation corridor with improving retailer coverage' },
                { id: 'sangli', info: 'Sangli supports referral adoption and secondary demand' },
              ]}
              scale={{
                title: 'Opportunity intensity',
                items: [
                  { label: 'Priority concentration', tone: 4 },
                  { label: 'High potential', tone: 3 },
                  { label: 'Emerging potential', tone: 2 },
                ],
              }}
            />
          </div>
          <MhVizBars
            title="Regional potential score"
            items={[
              { label: 'Maharashtra', value: 88, note: '88 / 100', tone: 'green' },
              { label: 'Gujarat', value: 74, note: '74 / 100', tone: 'green' },
              { label: 'Karnataka', value: 61, note: '61 / 100', tone: 'amber' },
              { label: 'Madhya Pradesh', value: 58, note: '58 / 100', tone: 'amber' },
            ]}
          />
        </div>
      ),
      visualNote: 'The map shows where to scale campaigns first, based on opportunity and readiness.',
    };
  }

  if (code === 'MH.2') {
    return {
      visual: (
        <div className="mh-viz-stack">
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="West region opportunity and product sales intelligence map"
              height={330}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected="v-ambad"
              talukas={{
                Ambad: { tone: 4, info: 'Highest opportunity concentration for retailer conversion' },
                Badnapur: { tone: 2, info: 'Balanced growth pocket with stable secondary throughput' },
                Ghansawangi: { tone: 1, info: 'Developing catchment for assisted adoption' },
              }}
              markers={[
                { id: 'v-ambad', info: 'High-value onion cluster with strong dealer reach' },
                { id: 'v-gondi', info: 'Retail conversion pocket with demand follow-through risk' },
                { id: 'v-jamkhed', info: 'Product trial zone with high upside on crop advisory support' },
                {
                  id: 'v-kingaon',
                  info: 'Emerging hotspot with lower assisted-activation coverage',
                  action: { label: 'Open Plan Reviews', run: () => go('mh.3') },
                },
              ]}
              scale={{
                title: 'Regional opportunity heat',
                items: [
                  { label: 'High-value pocket', tone: 4 },
                  { label: 'Moderate opportunity', tone: 2 },
                  { label: 'Emerging pocket', tone: 1 },
                ],
              }}
            />
          </div>
          <MhVizBars
            title="Product-cluster momentum"
            items={[
              { label: 'Croptek + NutriBoost bundle', value: 82, note: '₹4.8 Cr pipeline', tone: 'green' },
              { label: 'Croptek core', value: 69, note: '₹3.5 Cr pipeline', tone: 'green' },
              { label: 'NutriBoost extension', value: 57, note: '₹2.1 Cr pipeline', tone: 'amber' },
            ]}
          />
        </div>
      ),
      visualNote: 'District map and product momentum bars reveal where opportunity value and readiness diverge.',
    };
  }

  if (code.startsWith('MH.3')) {
    return {
      visual: (
        <div className="mh-viz-stack">
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="Plan alignment review map"
              height={305}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected="t-ambad"
              talukas={{
                Ambad: { tone: 4, info: 'Plan submitted with manageable conditions' },
                Badnapur: { tone: 2, info: 'Needs intervention-evidence tightening' },
                Ghansawangi: { tone: 1, info: 'Requires target/crop coherence review' },
              }}
              markers={[
                { id: 't-ambad', info: 'Ambad plan: conditional pass with two tracked assumptions' },
                { id: 't-badnapur', info: 'Badnapur plan: budget-to-coverage ratio review open' },
                { id: 't-ghansawangi', info: 'Ghansawangi plan: intervention channel detail pending' },
              ]}
            />
          </div>
          <MhVizBars
            title="Plan quality checks"
            items={[
              { label: 'Evidence linkage', value: 76, note: '76%', tone: 'green' },
              { label: 'Assumption completeness', value: 62, note: '62%', tone: 'amber' },
              { label: 'Intervention realism', value: 68, note: '68%', tone: 'amber' },
            ]}
          />
        </div>
      ),
      visualNote: 'Review map surfaces plan-quality variance across contributing territories.',
    };
  }

  if (code.startsWith('MH.9')) {
    return {
      visual: (
        <div className="mh-viz-stack">
          <div className="tm-map-frame">
            <IndiaDistrictMap
              label="Performance and impact map"
              height={305}
              view={{ district: 'Jalna', state: 'Maharashtra' }}
              selected="v-pimpalgaon"
              talukas={{
                Ambad: { tone: 2, info: 'Execution lags plan but stable on conversion quality' },
                Ghansawangi: { tone: 1, info: 'Below-plan activation cadence' },
                Badnapur: { tone: 3, info: 'Steady execution and improving response' },
              }}
              markers={[
                { id: 'v-ambad', info: 'Observed: 74% activity completion vs 82% plan' },
                { id: 'v-gondi', info: 'Observed: retailer follow-up gap affecting conversion' },
                { id: 'v-pimpalgaon', info: 'Observed: readiness delay and low campaign adherence' },
              ]}
            />
          </div>
          <MhVizBars
            title="Execution vs plan"
            items={[
              { label: 'Execution completion', value: 72, note: '72% / 80% plan', tone: 'amber' },
              { label: 'Retail conversion', value: 66, note: '66% / 74% plan', tone: 'amber' },
              { label: 'Coverage adherence', value: 79, note: '79% / 82% plan', tone: 'green' },
            ]}
          />
        </div>
      ),
      visualNote: 'Map overlays performance signals to quickly locate pockets needing optimization requests.',
    };
  }

  return {
    visual: (
      <MhVizBars
        title="Progress snapshot"
        items={[
          { label: 'Readiness', value: 74, note: 'Tracked in workflow', tone: 'green' },
          { label: 'Evidence confidence', value: 63, note: 'Needs validation', tone: 'amber' },
          { label: 'Execution control', value: 69, note: 'Gate-managed', tone: 'green' },
        ]}
      />
    ),
    visualNote: 'Compact visual summary to keep decisions grounded while moving through MH workflow steps.',
  };
}

function Workspace(spec: Spec) {
  const { go } = useNav();
  const view = spec.visual ? { visual: spec.visual, visualNote: spec.visualNote } : MH_OWN_MAP.has(spec.code) ? {} : visualFor(spec.code, go);
  return (
    <MhPage
      crumbs={spec.crumbs}
      code={spec.code}
      title={spec.title}
      subtitle={spec.subtitle}
      actions={spec.next ? <ActionButton kind="primary" label={spec.next.label} onClick={() => go(spec.next!.to)} /> : undefined}
      pulse={MH_PULSE[spec.code]}
    >
      <div className="pm-strip">
        {spec.metrics.map(([label, value, tone]) => (
          <div key={label} className={`pm-strip-item ${tone ? `pm-strip-${tone}` : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {MH_CHARTS[spec.code]}

      {spec.extra}

      {view.visual && (
        <div className="pm-box iq-visual-card">
          <div className="tm-map-wrap">{view.visual}</div>
          {view.visualNote && <div className="tm-map-note">{view.visualNote}</div>}
        </div>
      )}

      <div className="pm-two pm-two-balanced">
        <div className="pm-box">
          <div className="pm-box-head"><h3>Details</h3></div>
          <table className="pm-table">
            <tbody>
              {spec.board.map(([label, value, to]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                  <td style={{ textAlign: 'right' }}>{to && <ActionButton label="View details" onClick={() => go(to)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pm-box pm-ai">
          <div className="pm-box-head"><h3>AI Insight</h3></div>
          <ul className="pm-ai-list">
            {spec.insight.map(([label, value], index) => (
              <li key={label} className={index === 0 ? 'pm-ai-green' : 'pm-ai-amber'}>
                <b>{label}</b>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MhPage>
  );
}

function S(spec: Spec) { return <Workspace {...spec} />; }

const C = {
  m1: [{ label: 'Marketing Overview' }],
  m2: [{ label: 'Market Opportunities' }],
  m3: [{ label: 'Plan Reviews' }],
  m3a: [{ label: 'Plan Reviews' }, { label: 'Regional Plan Detail' }],
  m3b: [{ label: 'Plan Reviews' }, { label: 'Territory Plan Detail' }],
  m4: [{ label: 'Campaign Planning' }],
  m4a: [{ label: 'Campaign Planning' }, { label: 'Why Farmers Are Not Converting' }],
  m4i2: [{ label: 'Campaign Planning' }, { label: 'Barriers by Region' }],
  m4i3: [{ label: 'Campaign Planning' }, { label: 'Barriers by Territory' }],
  m4i4: [{ label: 'Campaign Planning' }, { label: 'Updated Findings' }],
  m4b: [{ label: 'Campaign Planning' }, { label: 'Shortlist Campaigns' }],
  m5: [{ label: 'Campaign Planning' }, { label: 'Campaign Brief' }],
  m6: [{ label: 'Campaign Planning' }, { label: 'Mix, Budget & Calendar' }],
  m7: [{ label: 'Campaign Planning' }, { label: 'Campaign Portfolio Review' }],
  m7a: [{ label: 'Campaign Planning' }, { label: 'Proposal & Business Case' }],
  m7b: [{ label: 'Campaign Planning' }, { label: 'Exceptions & Conditional Approval' }],
  m8: [{ label: 'Approvals & Rollout' }],
  m8a: [{ label: 'Approvals & Rollout' }, { label: 'Release to Territories' }],
  m9: [{ label: 'Performance & Learnings' }],
  m9a: [{ label: 'Performance & Learnings' }, { label: 'Regional Performance' }],
  m9b: [{ label: 'Performance & Learnings' }, { label: 'What Is Driving Results' }],
  m9c: [{ label: 'Performance & Learnings' }, { label: 'Territory Results' }],
  m9d: [{ label: 'Performance & Learnings' }, { label: 'Request Campaign Changes' }],
  ai: [{ label: 'AI Copilot' }],
};

const CORE_ROWS: [string, string][] = [
  ['Where to look first', 'West Region is 6 pp behind its execution plan.'],
  ['Before approving', 'Check stock readiness and consent conditions on each campaign.'],
  ['Reading the results', 'Figures are observed results; causes are not yet verified.'],
];

function make(code: string, title: string, subtitle: string, crumbs: { label: string; to?: ScreenId }[], next: { label: string; to: ScreenId } | undefined, metric3: string, boardOpen?: ScreenId) {
  return {
    code,
    title,
    subtitle,
    crumbs,
    next,
    metrics: [['Region/Scope', code.startsWith('MH.9') ? 'West Region' : 'All regions · West focus'], ['Progress', code === 'MH.9A' || code === 'MH.9B' ? '72% vs 80% plan' : 'In workflow'], ['Attention', metric3, 'amber']],
    board: [['Screen', title], ['Purpose', subtitle], ['Data', 'Illustrative · each figure shows its source'], ['Next action', next ? next.label : 'Review with AI Copilot', boardOpen ?? next?.to]],
    insight: CORE_ROWS,
  } as Spec;
}

export function Mh1() { return S(make('MH.1', 'Marketing Overview', 'Opportunity, performance and watch-outs across regions', C.m1, { label: 'View opportunity map', to: 'mh.2' }, '3 regional watchouts')); }
export function Mh2() { return S(make('MH.2', 'Market Opportunities by Region', 'West region opportunity stack with product-cluster context', C.m2, { label: 'Proceed to Plan Reviews', to: 'mh.3' }, 'High-priority pockets: 3')); }
export function Mh3() { return S(make('MH.3', 'Plan Reviews', 'Cross-check territory plans with intervention assumptions', C.m3, { label: 'Open Regional Detail', to: 'mh.3a' }, 'Conditional plans: 4')); }
export function Mh3a() { return S(make('MH.3A', 'Regional Plan Detail', 'Regional intervention quality and business-case consistency', C.m3a, { label: 'Open Territory Contribution', to: 'mh.3b' }, 'Conditional interventions: 2')); }
export function Mh3b() { return S(make('MH.3B', 'Territory Plan Detail', 'Ambad/Ghansawangi/Badnapur contribution audit', C.m3b, { label: 'Move to Campaign Planning', to: 'mh.4' }, 'Critical assumptions: 5')); }
export function Mh4() { return S(make('MH.4', 'Campaign Ideas', 'Candidate campaign themes ranked by strategic fit', C.m4, { label: 'Investigate Barriers', to: 'mh.4a' }, 'Top recommendations: 3')); }
export function Mh4a() { return S(make('MH.4A', 'Why Farmers Are Not Converting', 'Layered diagnostics for conversion frictions', C.m4a, { label: 'Open Regional Barrier Lens', to: 'mh.4a-i2' }, 'Unverified barriers: 2')); }
export function Mh4aI2() { return S(make('MH.4A-I2', 'Barriers by Region', 'West region barrier concentration and feasibility', C.m4i2, { label: 'Open Barriers by Territory', to: 'mh.4a-i3' }, 'Hotspots: 3')); }
export function Mh4aI3() { return S(make('MH.4A-I3', 'Barriers by Territory', 'Ambad local workflow and conversion diagnosis', C.m4i3, { label: 'Update Investigation View', to: 'mh.4a-i4' }, 'Blockers: 3')); }
export function Mh4aI4() { return S(make('MH.4A-I4', 'Conversion Barriers: Updated Findings', 'Consolidated evidence after territory validation', C.m4i4, { label: 'Refresh Recommendations', to: 'mh.4b' }, 'Outstanding unknowns: 1')); }
export function Mh4b() { return S(make('MH.4B', 'Shortlist Campaigns', 'Prioritized campaign set with revised evidence', C.m4b, { label: 'Build Strategy Brief', to: 'mh.5' }, 'Selected campaigns: 3')); }
export function Mh5() { return S(make('MH.5', 'Campaign Brief', 'Formal strategy brief with governance thresholds', C.m5, { label: 'Open Mix & Budget', to: 'mh.6' }, 'Open strategy questions: 2')); }
export function Mh6() { return S(make('MH.6', 'Campaign Mix, Budget & Calendar', 'Resource phasing by campaign theme and readiness', C.m6, { label: 'Review Portfolio', to: 'mh.7' }, 'Unallocated buffer: ₹0.3 Cr')); }
export function Mh7() { return S(make('MH.7', 'Campaign Portfolio Review', 'Final strategic quality gate before sign-off', C.m7, { label: 'Open Proposal Detail', to: 'mh.7a' }, 'Refinement items: 3')); }
export function Mh7a() { return S(make('MH.7A', 'Proposal & Business Case', 'Evidence-linked proposal assessment', C.m7a, { label: 'Open Exception Review', to: 'mh.7b' }, 'Open concerns: 2')); }
export function Mh7b() { return S(make('MH.7B', 'Exceptions & Conditional Approval', 'Resolve conditions and define control gates', C.m7b, { label: 'Move to Approvals Inbox', to: 'mh.8' }, 'Pending authorization: 2')); }
export function Mh8() { return S(make('MH.8', 'Approvals & Rollout', 'Finalize approvals and release sequencing', C.m8, { label: 'Release Approved Recommendations', to: 'mh.8a' }, 'Conditional requests: 4')); }
export function Mh8a() { return S(make('MH.8A', 'Release to Territories', 'Controlled release to Territory Managers', C.m8a, { label: 'Open Portfolio Performance', to: 'mh.9' }, 'Conditional releases: 3')); }
export function Mh9() { return S(make('MH.9', 'Performance Summary', 'Executive outcome summary for active campaign portfolio', C.m9, { label: 'View Regional Programme', to: 'mh.9a' }, 'At-risk programmes: 2')); }
export function Mh9a() { return S(make('MH.9A', 'Regional Performance', 'West region programme performance with source references', C.m9a, { label: 'Investigate Drivers', to: 'mh.9b' }, 'Regional execution gap: 8 pp')); }
export function Mh9b() { return S(make('MH.9B', 'What Is Driving Results', 'Observed workflow gaps vs unverified causal hypotheses', C.m9b, { label: 'View Territory Impact', to: 'mh.9c' }, 'Unverified drivers: 3')); }

export function Mh9c() {
  const { go } = useNav();
  return (
    <MhPage
      crumbs={C.m9c}
      code="MH.9C"
      title="Territory Results"
      subtitle="Contextual drawer over with read-only territory inspection"
      actions={<button type="button" className="pm-btn" onClick={() => go('mh.9d')}>Request Optimization Review</button>}
    >
      {MH_CHARTS['MH.9C']}
      <div className="pm-two">
        <div className="pm-box pm-box-soft">
          <div className="pm-box-head"><h3>Background Context</h3></div>
          <table className="pm-table"><tbody>
            <tr><th>Scope</th><td>West Region &gt; Croptek Conversion &gt; Retailer-led programme</td></tr>
            <tr><th>Current signal</th><td>72% execution vs 80% plan; causal evidence partial</td></tr>
            <tr><th>Navigation</th><td><button type="button" className="pm-btn" onClick={() => go('mh.9b')}>Back to What Is Driving Results</button></td></tr>
          </tbody></table>
        </div>
        <div className="pm-box pm-ai" style={{ borderLeft: '3px solid #2f8a3b' }}>
          <div className="pm-box-head"><h3>Territory Impact Drawer</h3></div>
          <table className="pm-table"><tbody>
            <tr><th>Selected territory</th><td>Ambad, Jalna (illustrative local campaign)</td></tr>
            <tr><th>Drilldown routes</th><td>Open Campaign Impact, Diagnostics</td></tr>
            <tr><th>Governance</th><td>Marketing Head inspects; Territory Manager owns local corrective action</td></tr>
          </tbody></table>
        </div>
      </div>
    </MhPage>
  );
}

export function Mh9d() {
  const { go } = useNav();
  return (
    <MhPage
      crumbs={C.m9d}
      code="MH.9D"
      title="Request Campaign Changes"
      subtitle="Draft request drawer for Product Manager optimization review"
      actions={<button type="button" className="pm-btn" onClick={() => go('mh.ai1')}>Discuss in AI Copilot</button>}
    >
      {MH_CHARTS['MH.9D']}
      <div className="pm-two">
        <div className="pm-box pm-box-soft">
          <div className="pm-box-head"><h3>Issue Context</h3></div>
          <table className="pm-table"><tbody>
            <tr><th>Observed issue</th><td>Execution 72% vs 80% plan with follow-up/activation concerns</td></tr>
            <tr><th>Evidence links</th><td>diagnostics + territory references</td></tr>
            <tr><th>Status</th><td><span className="pill pill-amber">Draft / Not Sent</span></td></tr>
          </tbody></table>
        </div>
        <div className="pm-box pm-ai" style={{ borderLeft: '3px solid #2f8a3b' }}>
          <div className="pm-box-head"><h3>Optimization Request</h3></div>
          <table className="pm-table"><tbody>
            <tr><th>Review areas</th><td>Audience, intervention mix, timing, channel readiness, assumptions</td></tr>
            <tr><th>Responsible PM</th><td>Crop Nutrition Product Manager</td></tr>
            <tr><th>Deliverable</th><td>Revised campaign proposal + updated business case if material</td></tr>
          </tbody></table>
          <div className="pm-box-actions"><button type="button" className="pm-btn" onClick={() => go('pm.opt1')}>Submit Optimization Request to Product Manager</button><button type="button" className="pm-btn pm-btn-soft" onClick={() => go('mh.9b')}>Back to What Is Driving Results</button></div>
        </div>
      </div>
    </MhPage>
  );
}

/** Marketing Head figures handed to the live LLM as grounding context (shared with the PM and BH views). */
const MH_FACTS = [
  'Persona: Marketing Head, West Region (Maharashtra and neighbouring states), FY 2026-27. All figures illustrative.',
  'West Region: ABP Rs 16.0 Cr, actual Rs 14.2 Cr (88.8%), 4 active campaigns, execution 76% vs 82% plan, campaign investment Rs 72 L, 760 adopters; largest reported business gap nationally (Rs 1.8 Cr).',
  `Strategic theme assigned to the Product Manager: ${THEME.name} (${THEME.scope}); objective: ${THEME.objective}. Evidence: penetration ${EVIDENCE.penetration}; quarterly Croptek onion sales ${EVIDENCE.quarterly.join(', ')}; pilot ${EVIDENCE.purchases}/${EVIDENCE.trials} trial-to-purchase ${EVIDENCE.trialToPurchase}.`,
  'Campaign awaiting Marketing Head approval: Ambad Onion Croptek Conversion (Dhanora, Wadi Gaon), budget Rs 3.00 L, base forecast Rs 12 L sales, ROI +0.40x (assumptions unvalidated), conditions: confirm demo stock, keep consent logs. Business Head escalation only above Rs 5 L.',
  `Interim results (Ambad): reached ${IMPACT.reached}, trials ${IMPACT.trials}, adopters ${IMPACT.adopters} (${IMPACT.rate}), linked sales ${IMPACT.linkedSales} provisional. ${VILLAGES.map((v) => `${v.village} ${v.rate}%`).join(' vs ')} trial-to-adoption; causes unverified (stock-dependent demo, follow-up, retailer advocacy).`,
  `Governance principles: ${CORE_ROWS.map(([k, v]) => `${k}: ${v}`).join(' ')}`,
].join('\n');

export function MhAi1() {
  return S({
    ...make('MH.AI1', 'AI Copilot', 'Conversational decision support across all Marketing Head workflows', C.ai, undefined, 'Assistive mode only'),
    extra: <LiveCopilot persona="Marketing Head" screen="mh.ai1" pageContext={MH_FACTS}
      suggestions={['Should I approve the Ambad onion campaign as submitted?', 'Why is West Region execution behind plan?', 'Which theme should I scale next season?', 'What evidence is missing before scaling Croptek conversion?']}
      intro="Ask about regional strategy, campaign approvals, rollout or performance learning. The live model answers from the Marketing Head figures in this tool." />,
  });
}


